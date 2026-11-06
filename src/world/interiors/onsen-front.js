import * as THREE from '../../../vendor/three.module.js';
import {doorState,stepDoor} from '../sliding-door.js';
import {recipeFor} from '../../avatars/cast.js';
import {onsenOpen} from '../onsen-layout.js';
import {ONSEN_SIGNS} from './onsen-signs.js';

/**
 * The street end of Umi-no-yu, seen from the genkan: the two wooden sliding doors, the
 * shoes at the step, and the umbrella stand.
 *
 * - The doors are the ones on the bathhouse model outside (tools/blender/build-park-onsen.py):
 *   two weathered-cedar leaves on two tracks, frosted lower glass with ゆ left clear in it,
 *   clear upper glass with two bars, rails at the foot, the waist and the head. The leaf on
 *   the inside track is the one that slides; in opening hours Higa-san leaves it standing a
 *   hand's span open (the 20 cm the model outside shows), and it opens for anybody who comes
 *   to it with the same motion as the town's other sliding doors (sliding-door.js).
 * - Outside the glass: the porch, the step and the stepping stones as the model has them,
 *   and the noren, hung out at ten and lifted in at ten at night.
 * - Shoes: whoever is in the bath left theirs at the step (GENKAN_SPOTS), so the genkan
 *   tells you who is in, as it tells Higa-san. What they are is what each person actually
 *   wears (their avatar recipe's footwear and colours), never a stand-in.
 * - The umbrella stand, with Mr Fujita's umbrella in it since the rainy season.
 *
 * Everything is placed by hand, with the reason beside it; nothing is rolled. The Japanese
 * is in onsen-signs.js. Room frame as in onsen.js: street door at +z, metres, floor y = 0.
 */
const plain=o=>Object.freeze(o);

export const ONSEN_STREET_DOOR=plain({
 /** The opening between the jambs, and the plane of the front wall. */
 minX:-.98,maxX:.98,z:5,bottom:.022,top:2.145,head:2.15,
 leaf:plain({width:1,thick:.035,stile:.055,waist:.7,wood:0x7a5a3c,
  why:'Weathered cedar, the model’s ‘Door stile’ and ‘Door rail’, with the waist rail where the frosted glass stops.'}),
 /** Track lines (z): the fixed leaf on the outside track, the sliding one on the inside. */
 tracks:plain({fixed:5.025,sliding:4.975}),
 /** How far the sliding leaf travels to stand fully open, behind the fixed one. */
 travel:.96,
 standing:plain({metres:.2,
  why:'In opening hours the inside leaf stands a hand’s span open: the lobby breathes (steam from the changing room out, the sea air in), the street can hear the night game, and a door ajar under the noren says the bath is open. The model outside shows the same 20 cm.'}),
 closed:plain({why:'After ten Higa-san slides it shut and lifts the noren in; a shut door with no noren says the bath is closed.'}),
 /** Somebody within this of the mat, inside, has come to the door; it opens for them. */
 mat:Object.freeze([0,4.55]),reach:1,
 opens:plain({why:'A hand-slid door opens for whoever comes to it: the player and the residents get the town’s sliding-door motion (sliding-door.js), started from where the door stands.'}),
});
const D=ONSEN_STREET_DOOR;
/** Where the door settles when nobody is at it: a hand's span open in hours, shut after ten. */
export const doorRest=minutes=>onsenOpen(minutes)?D.standing.metres/D.travel:0;

/** The porch outside, in the room's frame: the model's step, posts and roof, its ground 0.35 below the floor. */
export const ONSEN_PORCH=plain({ground:-.35,sill:plain({z0:5.06,z1:5.22}),step:plain({z:5.52,top:-.15,w:2,d:.6}),
 posts:Object.freeze([-1,1]),postZ:6,noren:plain({y:1.73,z:5.16,w:.56,h:.72,lift:.85})});

/**
 * Where shoes go at the step: either side of the middle metre, which is kept clear because
 * that is where everybody steps up (and where the residents walk in and out). Toes to the
 * door is good manners: you turn your shoes round so you can step straight into them going
 * home. Each person's place and habit is theirs, for a reason.
 *   shoes: the left and right shoe, offset from the spot (dx, dz), turned (yaw: 0 toes to the
 *   door, PI toes to the house), and `side` for one lying on its side.
 */
const TO_DOOR=0,TO_HOUSE=Math.PI;
const pair=(yaw=TO_DOOR)=>Object.freeze([plain({dx:-.055,dz:0,yaw}),plain({dx:.055,dz:0,yaw})]);
const spot=(x,z,shoes,why,note)=>plain({x,z,shoes,why,note});
export const GENKAN_STEP=plain({z:3.6,clear:.5,
 // Where it turns (room x): from the west wall along z 3.6 to here, then towards the street wall along this x.
 turn:3,width:.12,
 why:'The agarikamachi: shoes come off on the stone side and wait there; nobody wears them on the wood. The middle metre (|x| < 0.5) stays clear for stepping up.',
 turnWhy:'The stone genkan belongs to the door and the getabako: it ends at x 3.0, past the shoe row (to x 1.6) and the umbrella stand, and the step turns there towards the street wall. East of it the lobby’s hinoki runs to the street wall, so the massage chair in that corner stands wholly on the boards and a bather in after-bath clothes reaches it barefoot, never stepping onto the stone.'});
export const GENKAN_SPOTS=Object.freeze({
 Thuan:spot(-.66,3.82,pair(),
  'The sisters pay at the bandai first, so they step up on the bandai side. Thuan steps up nearest the middle and turns hers to the door, side by side, the way her grandmother taught her.',
  'Thuan’s, turned round to face the door, side by side.'),
 Nhung:spot(-.92,3.82,Object.freeze([plain({dx:-.068,dz:-.01,yaw:TO_DOOR-.08}),plain({dx:.076,dz:.02,yaw:TO_DOOR+.12})]),
  'Next to her sisters. The eldest turns hers round with her foot, without bending down, so they come out a little crooked.',
  'Nhung’s, turned with a foot, a little crooked.'),
 Thao:spot(-1.29,3.84,Object.freeze([plain({dx:-.06,dz:-.02,yaw:TO_HOUSE+.35}),plain({dx:.13,dz:.17,yaw:TO_HOUSE-.7,side:true})]),
  'At the end of the sisters’ row, as she stepped out of them: toes to the house, one kicked onto its side. Stubborn: she says she can step into them backwards.',
  'Thao’s, kicked off toes-in, one on its side.'),
 'Mr Fujita':spot(.68,3.82,Object.freeze([plain({dx:-.053,dz:0,yaw:TO_DOOR}),plain({dx:.053,dz:0,yaw:TO_DOOR})]),
  'On the side of the massage chair, where he goes first. Square to the door and touching: a fisherman stows everything ready for sea.',
  'Mr Fujita’s, square to the door and touching, ready for sea.'),
 Tetsuo:spot(.98,3.84,Object.freeze([plain({dx:-.06,dz:.01,yaw:TO_DOOR+.05}),plain({dx:.06,dz:-.01,yaw:TO_DOOR-.04})]),
  'He is here to work, not to bathe: toes to the door at the end of the row, so he can step straight into them and out to the van for a part.',
  'Tetsuo’s work shoes at the end, toes out, ready to go back to the van.'),
});
/** Anybody else's, in the order they come in; past these, shoes go in the getabako. */
export const GENKAN_SPARE=Object.freeze([spot(1.27,3.82,pair(),'A visitor’s, at the free end of the row.','A visitor’s pair.'),
 spot(-1.6,3.82,pair(),'A visitor’s, past the sisters’ row.','A visitor’s pair.'),spot(1.56,3.82,pair(),'A visitor’s, by the others.','A visitor’s pair.')]);
/** Who never leaves shoes at the step, and why. */
export const GENKAN_NOT_HERE=Object.freeze({
 'Miss Higa':'She comes in by the boiler-room door at the back and keeps her sandals under the bandai.',
 Johansson:'The player: whoever is looking still has their own shoes on.',
});
/**
 * The cast at the step for the film, by scene. 5b is shot as Tetsuo slides the door open,
 * so his shoes are still on his feet; from 5c they are at the step.
 */
export const GENKAN_SCENES=Object.freeze({
 empty:plain({cast:Object.freeze([]),en:'Nobody in the bath: a bare genkan.'}),
 evening:plain({cast:Object.freeze(['Thuan','Nhung','Thao','Mr Fujita']),
  panels:Object.freeze(['1b','1c','2a','2b','2c','2d','3a','3b','3c','3d','3e','4a','4b','4c','4d','4e','5a','5b']),
  en:'The three sisters and Mr Fujita are in; Tetsuo is not here yet.'}),
 electrician:plain({cast:Object.freeze(['Thuan','Nhung','Thao','Mr Fujita','Tetsuo']),
  panels:Object.freeze(['5c','5d','5e','6a','6b','6c','6d','7a','7b','7c','8a','8b','8c']),
  en:'Tetsuo has come in to look at the board: his shoes are at the end of the row.'}),
});

/** What a person's shoes are, from their recipe: the same kind and colours as their feet. Null if they came barefoot. */
export function footwearOf(recipe){
 const o=recipe?.outfit||{},kind=o.footwear||'sneakers',elder=recipe?.age==='elder';
 if(kind==='barefoot')return null;
 const sole=kind==='sandals'?(elder?'#6b4a32':'#c8a878'):kind==='shoes'?'#2b2622':elder?'#6b4a32':'#f2efe6';
 return {kind,upper:o.shoes||'#6d4a32',sole};
}
/**
 * The genkan for a set of people (pure): whose shoes, where, turned which way, and why.
 * Names in GENKAN_NOT_HERE leave none; strangers take the spare places in order.
 */
export function genkanLayout(names,recipeOf=recipeFor){
 const out=[];let spare=0;
 for(const name of names){
  if(!name||GENKAN_NOT_HERE[name]||out.some(e=>e.name===name))continue;
  const place=GENKAN_SPOTS[name]||GENKAN_SPARE[spare++];if(!place)continue;
  const wear=footwearOf(recipeOf(name));if(!wear)continue;
  out.push({name,...wear,x:place.x,z:place.z,shoes:place.shoes,why:place.why,note:place.note});
 }
 return out;
}

/** The forgotten umbrella, by the door on the right as you go out. */
export const ONSEN_UMBRELLA=plain({stand:plain({x:1.2,z:4.7,r:.12,h:.46,
  why:'An old Tsuboya pot by the door, where you pass it going out into the rain; clear of the step and of the door’s travel.'}),
 owner:'Mr Fujita',colour:0x23324f,
 why:'Navy, with a bamboo crook, furled tight the way a fisherman furls a sail. He left it on the last day of the rainy season; Higa-san tagged it and keeps it in the stand, and he walks past it every visit.'});

/** A canvas texture, or null where there is no page to draw it on (the room tests). */
function paint(w,h,draw){
 if(typeof document==='undefined'||!document.createElement)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext?.('2d');if(!ctx||!ctx.fillRect)return null;
 draw(ctx,w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';
const GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
/** A fixed hash in [0, 1): the same grain every time. */
const hash=(i,s=0)=>{let h=(i*374761393+s*668265263)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;};

/** The frosted lower pane: sand-blasted white with ゆ left clear, reading from the street (+z). */
export function frostedGlassTexture(){
 return paint(256,192,(ctx,w,h)=>{
  ctx.clearRect?.(0,0,w,h);ctx.fillStyle='rgba(236,240,238,.95)';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<500;i++)ctx.fillRect(hash(i,1)*w,hash(i,2)*h,1+hash(i,3)*2,1);
  // A clear border line, then the letter cut out of the frosting.
  ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='rgba(0,0,0,.75)';ctx.lineWidth=3;ctx.strokeRect(10,10,w-20,h-20);
  ctx.fillStyle='rgba(0,0,0,.8)';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 128px ${MINCHO}`;ctx.fillText(ONSEN_SIGNS.doorGlass.jp,w/2,h*.54);
  ctx.globalCompositeOperation='source-over';
 });
}
/** The street noren, as the model outside hangs it (park-onsen.js): indigo, ゆ across the middle, ♨ at the top corners. */
function norenTexture(){
 return paint(384,256,(ctx,w,h)=>{
  ctx.fillStyle='#253a5e';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f3efe4';ctx.textAlign='center';ctx.textBaseline='middle';
  const N=ONSEN_SIGNS.noren;ctx.font=`bold 150px ${MINCHO}`;ctx.fillText(N.jp,w/2,h*.55);
  ctx.font=`bold 30px ${MINCHO}`;ctx.fillText(N.mark,w*.17,h*.2);ctx.fillText(N.mark,w*.83,h*.2);
 });
}
/** The tag on the umbrella: Higa-san's 忘れ物 in felt pen on a manila luggage label. */
function tagTexture(){
 return paint(96,160,(ctx,w,h)=>{ctx.fillStyle='#e9d9ae';ctx.fillRect(0,0,w,h);ctx.fillStyle='#8a7a58';ctx.beginPath();ctx.arc(w/2,18,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1d1b18';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 30px ${GOTHIC}`;[...ONSEN_SIGNS.lostProperty.jp].forEach((c,i)=>ctx.fillText(c,w/2,52+i*36));});
}
/** Lawn, hedge and fukugi crowns against the sky, for the far side of the stepping stones. */
function treelineTexture(){
 return paint(512,128,(ctx,w,h)=>{ctx.clearRect?.(0,0,w,h);ctx.fillStyle='#2e4a30';
  // Fukugi stand in rows, tall and narrow; the hedge under them.
  for(let i=0;i<48;i++){const x=(i+hash(i,4)*.6)/47*w,r=6+hash(i,5)*7,top=h-40-hash(i,6)*34;ctx.fillStyle=hash(i,7)>.5?'#2e4a30':'#35553a';
   ctx.beginPath();ctx.ellipse(x,top,r,r*1.7,0,0,Math.PI*2);ctx.fill();ctx.fillRect(x-r*.9,top,r*1.8,h-top);}
  ctx.fillStyle='#2b4430';ctx.fillRect(0,h-30,w,30);});
}

/**
 * Builds the doors, the porch beyond them, the shoes and the umbrella stand.
 * @param {object} o
 * @param {THREE.Group} o.room
 * @param {(x:number,z:number,w:number,d:number,height?:number)=>object} o.rect adds a collider to the room
 * @param {(pos:number[],label:string,fn:Function)=>THREE.Object3D} o.anchor
 * @param {(kind:string,...args:any[])=>void} o.action
 */
export function buildOnsenFront({room,rect,anchor,action}){
 const group=new THREE.Group();group.name='Umi-no-yu street front';room.add(group);
 const mats=new Map();
 const std=(color,rough=.75,extra={})=>{const k=color+':'+rough+':'+JSON.stringify(extra);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:rough,...extra}));return mats.get(k);};
 const mesh=(geometry,material,x,y,z,name,parent=group)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const box=(w,h,d,material,x,y,z,name,parent=group)=>mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,name,parent);
 const wood=std(D.leaf.wood,.7),darkWood=std(0x43301f,.75),iron=std(0x2b2a28,.45,{metalness:.5});

 // ---- The frame: jambs at the wall ends, the threshold with its two grooves, the head.
 for(const s of [-1,1])box(.08,D.head+.07,.22,darkWood,s*(D.maxX+.04),(D.head+.07)/2,D.z,'Street door jamb');
 box(2.12,.02,.16,darkWood,0,.01,D.z,'Street door threshold');
 for(const z of [D.tracks.fixed,D.tracks.sliding])box(1.96,.003,.012,iron,0,.0215,z,'Street door groove');
 box(2.12,.07,.16,darkWood,0,D.head+.035,D.z,'Street door head');

 // ---- The leaves: frame, frosted lower pane with ゆ, clear upper pane with two bars, a sunk pull.
 const frost=frostedGlassTexture();
 // Frosting writes depth: the ink lines come from the depth picture, and what stands beyond frosted glass is not drawn through it.
 const frosted=new THREE.MeshStandardMaterial(frost?{map:frost,transparent:true,side:THREE.DoubleSide,roughness:.55}:{color:0xe8eeec,transparent:true,opacity:.92,side:THREE.DoubleSide,roughness:.55});
 const clear=new THREE.MeshStandardMaterial({color:0xcfe3e6,transparent:true,opacity:.14,roughness:.08,depthWrite:false,side:THREE.DoubleSide});
 const L=D.leaf,H=D.top-D.bottom;
 function leaf(name,x,z,pull){
  const g=new THREE.Group();g.name=name;g.position.set(x,D.bottom,z);g.userData.dynamicProp=true;group.add(g);
  for(const s of [-1,1])box(L.stile,H,L.thick,wood,s*(L.width/2-L.stile/2),H/2,0,name+' stile',g);
  const inner=L.width-2*L.stile,waist=L.waist-D.bottom;
  box(inner,.07,L.thick,wood,0,.035,0,name+' rail',g);box(inner,.05,L.thick,wood,0,waist,0,name+' rail',g);box(inner,.06,L.thick,wood,0,H-.03,0,name+' rail',g);
  const low=waist-.025-.07,up=H-.06-(waist+.025);
  const pane=mesh(new THREE.PlaneGeometry(inner,low),frosted,0,.07+low/2,0,name+' frosted glass',g);pane.renderOrder=3;pane.castShadow=false;
  const glass=mesh(new THREE.PlaneGeometry(inner,up),clear,0,waist+.025+up/2,0,name+' glass',g);glass.renderOrder=3;glass.castShadow=false;glass.userData.clearWindow=true;
  for(const dx of [-.15,.15])box(.02,up,.025,wood,dx,waist+.025+up/2,0,name+' bar',g);
  // The pull: a small iron plate sunk in the stile, on both faces.
  for(const f of [-1,1])box(.03,.11,.004,iron,pull*(L.width/2-L.stile/2),.95-D.bottom,f*(L.thick/2+.001),name+' pull',g);
  return g;
 }
 leaf('Street door fixed leaf',D.minX+L.width/2,D.tracks.fixed,1);
 const slidingHome=D.maxX-L.width/2,sliding=leaf('Street door sliding leaf',slidingHome,D.tracks.sliding,-1);
 const state=doorState();let held=false;
 const place=()=>{sliding.position.x=slidingHome-D.travel*state.amount;};

 // ---- Outside: the sill and step, the stepping stones, the porch, the noren, and the park beyond.
 // Lit by the sky, not the lamps inside: flat colours that follow the daylight, like the sea view.
 const P=ONSEN_PORCH,outdoor=[];
 const flat=(color,near=.3)=>{const m=new THREE.MeshBasicMaterial({color,fog:false});m.userData.base=new THREE.Color(color);m.userData.night=near;outdoor.push(m);return m;};
 const stone=flat(0x8b867c,.32),stepStone=flat(0x7e7a72,.3),beam=flat(0x43301f,.3),roof=flat(0x4c5660,.25),lawn=flat(0x5f7d4a,.12),stones=flat(0x8a857b,.2);
 box(2.24,-P.ground,P.sill.z1-P.sill.z0,stone,0,P.ground/2,(P.sill.z0+P.sill.z1)/2,'Umi-no-yu porch sill');
 box(P.step.w,.2,P.step.d,stepStone,0,P.step.top-.1,P.step.z,'Umi-no-yu entrance step');
 const ground=mesh(new THREE.PlaneGeometry(70,40),lawn,0,P.ground,5.06+20,'Umi-no-yu lawn');ground.rotation.x=-Math.PI/2;ground.castShadow=false;
 for(let k=0;k<6;k++){const s=.5+hash(k,21)*.16;const st=box(s,.06,s*(.8+hash(k,22)*.2),stones,(hash(k,23)-.5)*.3,P.ground+.03,6.05+k*.72,'Umi-no-yu stepping stone');st.rotation.y=(hash(k,24)-.5)*.8;}
 for(const x of P.posts)box(.14,2.65,.14,beam,x,P.ground+1.325,P.postZ,'Umi-no-yu porch post');
 box(2.3,.16,.16,beam,0,2.27,P.postZ,'Umi-no-yu porch beam');
 box(2.7,.1,1.4,roof,0,2.51,5.6,'Umi-no-yu porch roof').rotation.x=.24;
 const trees=treelineTexture();
 if(trees){const m=new THREE.MeshBasicMaterial({map:trees,transparent:true,fog:false,depthWrite:false});m.userData.base=new THREE.Color(0xffffff);m.userData.night=.08;outdoor.push(m);
  const band=mesh(new THREE.PlaneGeometry(70,9),m,0,P.ground+3.2,30,'Umi-no-yu park trees');band.rotation.y=Math.PI;band.castShadow=band.receiveShadow=false;}
 // The noren: three panels on a rod, hung out at opening and lifted in at closing.
 const noren=new THREE.Group();noren.name='Umi-no-yu street noren';group.add(noren);
 const norenTex=norenTexture(),norenMat=norenTex?new THREE.MeshBasicMaterial({map:norenTex,side:THREE.DoubleSide,fog:false}):flat(0x253a5e,.35);
 if(norenTex){norenMat.userData.base=new THREE.Color(0xffffff);norenMat.userData.night=.38;outdoor.push(norenMat);norenMat.side=THREE.DoubleSide;}
 for(let k=0;k<3;k++){const g=new THREE.PlaneGeometry(P.noren.w,P.noren.h),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(k+uv.getX(i))/3);
  const panel=mesh(g,norenMat,(k-1)*.57,P.noren.y,P.noren.z,'Umi-no-yu street noren',noren);panel.rotation.x=.03;panel.castShadow=false;}
 box(1.85,.025,.025,beam,0,P.noren.y+P.noren.h/2+.012,P.noren.z,'Umi-no-yu noren rod',noren);
 let lifted=1;

 // ---- Shoes at the step (GENKAN_SPOTS): built the first time someone needs them, then shown and hidden.
 const shoeMat=c=>std(new THREE.Color(c).getHex(),.6);
 const hollow=std(0x2a2420,.9);
 const dome=new THREE.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI/2),ball=new THREE.SphereGeometry(1,12,8),disc=new THREE.CylinderGeometry(1,1,1,20),strap=new THREE.CylinderGeometry(.006,.006,1,6);
 function shoe(kind,wear,parent){
  const s=new THREE.Group();parent.add(s);
  if(kind==='sandals'){
   // Setta: a flat sole and a thong from the toe post to either side, in the shoe colour.
   mesh(disc,shoeMat(wear.sole),0,.009,0,'Sandal sole',s).scale.set(.05,.018,.125);
   const post=new THREE.Vector3(0,.022,.07);
   for(const side of [-1,1]){const end=new THREE.Vector3(side*.045,.02,-.01),mid=post.clone().add(end).multiplyScalar(.5);mid.y=.034;
    for(const [a,b] of [[post,mid],[mid,end]]){const m=mesh(strap,shoeMat(wear.upper),(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2,'Sandal strap',s);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());m.castShadow=false;}}
  }else{
   // The sole a little proud all round (white rubber on a sneaker, dark under leather, brown on an
   // elder's, as on their feet); the upper high at the heel and collar, falling to a low round toe.
   const tall=kind==='shoes'?.05:.062;
   mesh(disc,shoeMat(wear.sole),0,.009,0,'Shoe sole',s).scale.set(.05,.018,.132);
   mesh(dome,shoeMat(wear.upper),0,.016,-.03,'Shoe upper',s).scale.set(.045,tall,.095);
   mesh(dome,shoeMat(wear.upper),0,.016,.045,'Shoe toe',s).scale.set(.043,tall*.56,.075);
   mesh(ball,hollow,0,.016+tall*.93,-.045,'Shoe opening',s).scale.set(.028,.008,.04);
   if(kind==='boots'){mesh(new THREE.CylinderGeometry(.04,.044,.12,14),shoeMat(wear.upper),0,.016+tall+.04,-.05,'Boot shaft',s);mesh(ball,hollow,0,.016+tall+.1,-.05,'Boot opening',s).scale.set(.034,.006,.034);}
  }
  return s;
 }
 // Every place at the step has a low collider from the start (the game takes the room's colliders once,
 // on the way in): lifted out of reach (minY) while the place is empty, set down when shoes are there,
 // so nobody walks through a pair and nobody bumps into shoes that are not there.
 const AWAY=99,spotColliders=new Map();
 for(const p of [...Object.values(GENKAN_SPOTS),...GENKAN_SPARE]){
  // As wide and deep as the pair lies, kicked-off shoes included.
  const w=.32+2*Math.max(0,...p.shoes.map(s=>Math.abs(s.dx)-.055)),d=.34+2*Math.max(...p.shoes.map(s=>Math.abs(s.dz)));
  const c=rect(p.x,p.z+.02,w,d,.22);c.minY=AWAY;spotColliders.set(p.x+':'+p.z,c);}
 const pairs=new Map(),colliderFor=entry=>spotColliders.get(entry.x+':'+entry.z);
 function pairFor(entry){
  const key=entry.name+':'+entry.kind+':'+entry.upper+':'+entry.x;
  if(!pairs.has(key)){
   const g=new THREE.Group();g.name='Shoes · '+entry.name;g.position.set(entry.x,.004,entry.z);g.visible=false;group.add(g);
   for(const s of entry.shoes){const one=shoe(entry.kind,entry,g);one.position.set(s.dx,s.side?.052:0,s.dz);one.rotation.set(0,s.yaw,s.side?Math.PI/2:0);}
   pairs.set(key,{group:g,entry,collider:colliderFor(entry)});
  }
  return pairs.get(key);
 }
 let shown=[],staged=null,live=[];
 const show=names=>{
  const layout=genkanLayout(names),wanted=new Set(layout.map(pairFor));
  for(const p of pairs.values())p.group.visible=wanted.has(p);
  for(const c of spotColliders.values())c.minY=AWAY;
  for(const p of wanted)p.collider.minY=0;
  shown=layout;shoesAnchor.visible=layout.length>0;
 };
 const shoesAnchor=anchor([0,.35,3.82],'Look at the shoes by the step',()=>{
  const lines=shown.map(e=>e.note);
  action('inspect','Shoes at the step',lines.length?'You can tell who is in from the shoes at the step, and so can Higa-san. '+lines.join(' '):'Nobody’s shoes at the step.');
 });shoesAnchor.visible=false;

 // ---- The umbrella stand and Mr Fujita's umbrella.
 const U=ONSEN_UMBRELLA,S=U.stand;
 const pot=new THREE.Group();pot.name='Umbrella stand';pot.position.set(S.x,0,S.z);group.add(pot);
 mesh(new THREE.CylinderGeometry(S.r,S.r*.86,S.h,22,1,true),std(0x4a3426,.35,{side:THREE.DoubleSide}),0,S.h/2,0,'Umbrella stand pot',pot);
 mesh(new THREE.CylinderGeometry(S.r*.86,S.r*.86,.02,22),std(0x4a3426,.35),0,.01,0,'Umbrella stand base',pot);
 mesh(new THREE.TorusGeometry(S.r-.008,.01,6,22),std(0xd9c9a2,.4),0,S.h,0,'Umbrella stand rim',pot).rotation.x=Math.PI/2;
 mesh(new THREE.CylinderGeometry(S.r+.002,S.r*.97,.05,22,1,true),std(0xd9c9a2,.4),0,S.h*.7,0,'Umbrella stand band',pot);
 rect(S.x,S.z,S.r*2+.06,S.r*2+.06,.6);
 // Furled, leaning on the rim towards the wall's end: tip on the pot's floor, crook up.
 const brolly=new THREE.Group();brolly.name='Forgotten umbrella';brolly.position.set(-.04,.03,0);brolly.rotation.set(-.05,0,-.2);pot.add(brolly);
 const canopy=std(U.colour,.7);
 mesh(new THREE.CylinderGeometry(.006,.006,.08,6),iron,0,.04,0,'Umbrella ferrule',brolly);
 const furl=mesh(new THREE.CylinderGeometry(.034,.012,.62,10),canopy,0,.08+.31,0,'Umbrella canopy',brolly);furl.castShadow=true;
 mesh(new THREE.CylinderGeometry(.008,.008,.14,6),iron,0,.76,0,'Umbrella shaft',brolly);
 const crook=mesh(new THREE.TorusGeometry(.045,.011,6,14,Math.PI),std(0xb98a4e,.5),-.045,.83,0,'Umbrella crook',brolly);crook.rotation.z=0;
 const tagTex=tagTexture();
 mesh(new THREE.CylinderGeometry(.0015,.0015,.05,4),std(0xe9e4d6,.9),-.09,.805,.006,'Lost-property tag string',brolly);
 const tag=mesh(new THREE.PlaneGeometry(.05,.083),tagTex?new THREE.MeshStandardMaterial({map:tagTex,roughness:.85,side:THREE.DoubleSide}):std(0xe9d9ae,.85,{side:THREE.DoubleSide}),-.09,.74,.012,'Lost-property tag',brolly);tag.rotation.set(0,-.4,.2);tag.castShadow=false;
 anchor([S.x,.7,S.z],'Look at the umbrella in the stand',()=>action('inspect','The umbrella in the stand',
  'A navy umbrella with a bamboo crook, furled tight the way a fisherman furls a sail. A paper tag on a string says lost property, in Higa-san’s felt pen. Under it, in marker on the crook, half rubbed away: FUJI. It has been here since the last day of the rainy season, and Mr Fujita walks past it every time he comes.'));

 // ---- Each frame: the door goes to whoever is at it, or back to where it stands; the noren follows the hours.
 function update(dt,minutes,people=[]){
  const open=onsenOpen(minutes),rest=doorRest(minutes);
  if(!held){const near=people.some(p=>Math.hypot(p.x-D.mat[0],p.z-D.mat[1])<D.reach);stepDoor(state,dt,near,rest);place();}
  // Lifted in on its pole at closing, hung out at opening, over a second or so.
  const target=open?0:1,step=dt/1.2;lifted=dt>0?(target>lifted?Math.min(target,lifted+step):Math.max(target,lifted-step)):target;
  noren.position.y=P.noren.lift*(lifted*lifted*(3-2*lifted));noren.visible=lifted<.999;
  if(!staged){const inside=people.filter(p=>p.name&&p.z<GENKAN_STEP.z).map(p=>p.name);if(inside.join()!==live.join()){live=inside;show(live);}}
 }
 function light(day){for(const m of outdoor){const k=m.userData.night+(1-m.userData.night)*day;m.color.copy(m.userData.base).multiplyScalar(k);}}
 const api={
  door:{get amount(){return state.amount;},get gap(){return +(state.amount*D.travel).toFixed(3);},get held(){return held;},rest:doorRest,spec:D,
   /** Hold the sliding leaf at an opening (0 shut … 1 fully open) for a film's photographs; null lets people open it again. */
   set(value){held=value!==null&&value!==undefined;if(held){state.amount=Math.max(0,Math.min(1,+value||0));state.speed=0;place();}}},
  genkan:{get shown(){return shown.map(e=>({name:e.name,kind:e.kind,x:e.x,z:e.z,why:e.why}));},scenes:GENKAN_SCENES,spots:GENKAN_SPOTS,
   /** Put a scene's cast (a GENKAN_SCENES name, or a list of names) at the step and keep it there; null goes back to whoever is in. */
   stage(scene){if(scene===null||scene===undefined){staged=null;live=[];show([]);return api.genkan.shown;}
    const cast=Array.isArray(scene)?scene:GENKAN_SCENES[scene]?.cast;if(!cast)throw new Error('No such genkan scene at Umi-no-yu: '+scene);
    staged=[...cast];show(staged);return api.genkan.shown;}},
  umbrella:U,
 };
 // You came in through it: it starts open behind you and closes once you step up.
 state.amount=1;state.hold=.6;place();update(0,600);
 const audit=typeof window!=='undefined'?window.__JOHANSSON_AUDIT__:null;
 if(audit)audit.onsenFront=api;
 return {...api,group,update,light,dispose(){if(audit&&audit.onsenFront===api)delete audit.onsenFront;}};
}
