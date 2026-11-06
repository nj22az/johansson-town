import * as THREE from '../../vendor/three.module.js';
import {celFrom} from '../render/cel.js';
import {bodyVolume} from './build.js';
import {faceLayout} from './face.js';
import {faceObjectPoint} from './face-objects.js';
import {shapeHeadPoint} from './head-profile.js';

/**
 * Small things the story puts on a body, each with its reason (nothing is random), built light for phones: a handful of
 * plain shapes each, cel-shaded like the room they come from, no textures, and at most one light (only once it is
 * switched on). They are carried by the body's own bones, so they move with it; the moves that use them (animate.js:
 * TorchUp, TorchOff, SitRead, CordWrapped, BasketHead) say where the hands are, and this module places the thing.
 *
 *   storyProps(avatar).give('torch')          Tetsuo's pocket torch, clipped to his shirt (or vest) at the left chest
 *   storyProps(avatar).give('basketOnHead')   a locker basket upside down on the head, resting on the head (or its towel)
 *   storyProps(avatar).give('newspaper')      the evening paper, folded, held open between the two mittens while reading
 *   storyProps(avatar).give('paperback')      Miss Higa's novel, open in her right mitten (the film turns it to her facing)
 *   storyProps(avatar).give('pumpkinSuit')    a Halloween costume (also 'ghostSheet', 'witchHat', 'catEars'): buildCostume
 *   storyProps(avatar).give('dryerCord')      the vanity dryer's cord, wound round the body and its pinned arms
 *   storyProps(avatar).give('safetyGlasses')  clear safety glasses over his own glasses (WORK_KIT)
 *   storyProps(avatar).give('headlamp')       a headlamp on an elastic band round the head, lit, with its own light (WORK_KIT)
 *   storyProps(avatar).give('gloves')         electrician's rubber gloves over both mittens, gauntlets over the cuffs (WORK_KIT)
 *   storyProps(avatar).give('voltageTester')  a two-pole voltage tester in the right mitten, its second probe parked on it (WORK_KIT)
 *   storyProps(avatar).giveKit('electricianWork')   all four at once: Tetsuo's work kit for a board (WORK_KIT)
 *
 * The moves give what they need themselves (SitRead the paper, CordWrapped the cord, BasketHead the basket, TorchUp the
 * torch, at his pocket); giving it beforehand puts it in place before the move (the torch on his pocket in 3f).
 */
export const STORY_PROPS=Object.freeze({
 torch:Object.freeze({who:'Tetsuo',why:'The island’s electrician carries a pocket torch for dark switchboards and roof spaces; in Umi-no-yu’s blackout it is the only light, and he switches the loads off by it before the breaker goes back up.',
  where:'Head down in his shirt pocket at the left chest beside his badge (after the bath, clipped to the vest’s neckline), where his right hand finds it without looking.'}),
 basketOnHead:Object.freeze({who:'Thuan',why:'In the dark she grabbed the nearest thing from the lockers to feel her way: a rattan clothes basket, which ends up on her head.',
  where:'The women’s room lockers’ basket (0.40 × 0.40 × 0.22 m, the men’s side’s size), upside down on the crown, askew, resting on her head towel.'}),
 newspaper:Object.freeze({who:'Tetsuo',why:'After his bath he reads the evening paper on the koagari edge, which is why nobody pays him any attention until the lights go.',
  where:'Folded once down the middle and held open like a book in both mittens, at reading distance before the chest.'}),
 paperback:Object.freeze({who:'Miss Higa',why:'Between customers at the bandai she reads: a paperback novel from Front-Row Books & Stationery’s reading copies, a 1990s edition with its paper band (obi) still on, which is why she never looks up from it.',
  where:'Held open in her right mitten at reading distance, the mitten under the foot of the spine, the pages turned up to her eyes and the cover with its band to the room.'}),
 pumpkinSuit:Object.freeze({who:'Tetsuo (and a child on the Halloween walk)',why:'The children’s Halloween walk on Sakura Street: Tetsuo explains the haunted vending machine in the pumpkin costume the children talked him into.',
  where:'A round orange pumpkin of eight lobes over the body from the hips to the shoulders, a jack-o’-lantern face on the front, a green leaf collar at the neck and a little stem cap on the head.'}),
 ghostSheet:Object.freeze({who:'Officer Mori (and a child on the Halloween walk)',why:'After a night up the pole the children dress Officer Mori as the street’s ghost, and he keeps his post.',
  where:'A white sheet from the shoulders to the knees, its hem wavy, and a hood round the head open at the face.'}),
 witchHat:Object.freeze({who:'A child on the Halloween walk',why:'A witch for the children’s walk: a pointed black hat with a purple band.',
  where:'On the crown of the head, tipped a little back.'}),
 catEars:Object.freeze({who:'A child on the Halloween walk',why:'A black cat for the children’s walk, after Kuro the Tamashiros’ dog’s black coat: the quickest costume there is, a headband with two felt ears, from Sakura’s decorations shelf. Pocket Camera has the same headband as a face sticker (modelled in Blender).',
  where:'A thin black band over the crown from ear to ear, its two pointed felt ears, pink inside, standing up either side of the top of the head.'}),
 dryerCord:Object.freeze({who:'Thao',why:'Spinning round in the dark with her dryer still in her hand, she winds herself up in its own cord, like a parcel.',
  where:'From the dryer’s handle in her right mitten, four turns round her and her arms from under the arms to the hips, then away to the socket.'}),
 // Tetsuo's work kit for an open board (WORK_KIT): what he puts on before his hands go inside one.
 safetyGlasses:Object.freeze({who:'Tetsuo',why:'Inside a board a slip of a probe across two terminals throws a flash and hot copper at the face: clear safety glasses go on before the cover comes off.',
  where:'Over his own half-rim reading glasses, as safety glasses of the kind made to fit over spectacles do: a wide clear shield on his nose, its brow bar above his own frames, its arms outside theirs.'}),
 headlamp:Object.freeze({who:'Tetsuo',why:'With the main locked off the house is dark, and a hand torch takes a hand: a headlamp puts the light where he looks and leaves both hands for the tester and the screwdriver.',
  where:'On an elastic band round his head above the brows, the lamp on his forehead tipped a little down, its battery box at the back of the band.'}),
 gloves:Object.freeze({who:'Tetsuo',why:'Electrician’s low-voltage rubber gloves: until the tester has shown the board dead, every terminal is treated as live, and the gloves are what stands between it and his hands.',
  where:'Over both mittens, their long gauntlets pulled up over the ends of his sleeves.'}),
 voltageTester:Object.freeze({who:'Tetsuo',why:'Prove dead before touching: a two-pole voltage tester, both probes on the terminals, a row of lamps for the voltage. He proves it on something live first, then the dead board, then live again (live, dead, live), so a broken tester can never tell him a live board is dead.',
  where:'The main handle in his right mitten, probe tip out past his fingers; the second probe on its lead, parked on the handle until he takes it in his left mitten (testerSplit).'}),
});

/**
 * Tetsuo's work kit (the creator, "Fujita's Back" page 9: he works on the board while everyone soaks in the dark): the four
 * things he wears and holds at an open board, given together by giveKit('electricianWork'). Isolate, lock and tag come
 * first (the board's own lock-out, onsen-electrics.js ONSEN_LOCKOUT); then these, and the tester proves the board dead.
 */
export const WORK_KIT=Object.freeze({electricianWork:Object.freeze({who:'Tetsuo',props:Object.freeze(['safetyGlasses','headlamp','gloves','voltageTester']),
 why:'Isolate, lock and tag, then glasses, gloves and light on, then prove dead with the tester before anything is touched: the order every job at a board takes.'})});

const mat=(c,o={})=>celFrom(new THREE.MeshStandardMaterial({color:c,roughness:.6,...o}),{bands:'soft3'});
const add=(g,geo,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o;};

/**
 * The pocket torch: a 13 cm penlight-sized electrician's torch, black with a chrome head, a steel pocket clip along its
 * side. Built along +z (the lens at +z), its origin where the mitten grips it (the middle of the body); the clip on its +y
 * side, by the tail. setOn(true) lights the lens and the little beam and, the first time, adds its light: a small warm spot from the
 * lens, aimed (aimAt) at the face of whoever holds it before their chest, so the face is lit from below and little else
 * (the spill a torch held under the chin throws up; nothing beyond a metre).
 */
export const TORCH=Object.freeze({length:.13,radius:.0105,head:.014,lensAt:.072,light:Object.freeze({colour:0xffe6b8,intensity:.4,distance:1.2,angle:.42,penumbra:.75,decay:2})});
export function buildPocketTorch(){
 const g=new THREE.Group();g.name='Pocket torch';
 const black=mat(0x26282a,{roughness:.45}),chrome=mat(0xc9ccce,{metalness:.8,roughness:.25}),steel=mat(0x9aa0a4,{metalness:.7,roughness:.35});
 const T=TORCH,cyl=(r0,r1,h,z,m,seg=14)=>add(g,new THREE.CylinderGeometry(r0,r1,h,seg).rotateX(Math.PI/2),m,0,0,z);
 cyl(T.radius,T.radius,.1,-.012,black);                 // the barrel (the batteries)
 cyl(T.head,T.radius,.022,.049,black);                  // the head, flaring a little
 cyl(T.head*1.02,T.head*1.02,.006,.063,chrome);         // the bezel
 cyl(T.radius*.9,T.radius*.9,.006,-.064,chrome);        // the tail cap with the switch
 const lensMat=new THREE.MeshStandardMaterial({color:0xfff6dc,emissive:0x000000,emissiveIntensity:0,roughness:.2});
 const lens=cyl(T.head*.86,T.head*.86,.002,.0665,lensMat);lens.castShadow=false;
 // the clip: a steel strip from the tail along the side, standing a little off the barrel
 add(g,new THREE.BoxGeometry(.005,.0016,.058),steel,0,T.radius+.0022,-.035);
 add(g,new THREE.BoxGeometry(.005,.0035,.006),steel,0,T.radius+.0012,-.063);
 // the beam: a short soft cone out of the lens, added light, fading to nothing (drawn only when on)
 const L=.32,cone=new THREE.CylinderGeometry(T.head*.8,.07,L,16,4,true).rotateX(Math.PI/2);cone.translate(0,0,.068+L/2);
 const P=cone.attributes.position,col=new Float32Array(P.count*4);
 for(let i=0;i<P.count;i++){const u=(P.getZ(i)-.068)/L;col.set([1,.95,.82,.2*(1-u)**2],i*4);}
 cone.setAttribute('color',new THREE.BufferAttribute(col,4));
 const beam=new THREE.Mesh(cone,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));
 beam.name='Torch beam';beam.visible=false;beam.castShadow=false;g.add(beam);
 let light=null,on=false;
 g.userData.torch={
  get on(){return on;},
  get light(){return light;},
  setOn(v){v=!!v;if(v===on)return;on=v;
   lensMat.emissive.setHex(on?0xfff1c8:0);lensMat.emissiveIntensity=on?2.4:0;beam.visible=on;
   if(on&&!light){const S=T.light;light=new THREE.SpotLight(S.colour,S.intensity,S.distance,S.angle,S.penumbra,S.decay);light.name='Torch light';light.castShadow=false;
    light.position.set(0,0,T.lensAt+.004);light.target.position.set(0,.3,0);light.add(light.target);g.add(light);}
   if(light)light.intensity=on?T.light.intensity:0;},
  /** Aims the light at a point in the world (the holder's face). */
  aimAt(p){if(!light)return;g.updateWorldMatrix(true,false);light.updateWorldMatrix(false,false);light.target.position.copy(light.worldToLocal(p.clone()));light.target.updateMatrixWorld(true);},
 };
 return g;
}

/** The locker basket (the onsen's rattan basket, 0.40 × 0.40 × 0.22 m), built upside down: open side down, its floor on
 *  top; its origin at the middle of the rim. Woven rattan in two tones: the body and a darker rim band. */
export const BASKET=Object.freeze({w:.4,d:.4,h:.22,wall:.012,tilt:Object.freeze([-.08,0,.2])});
export function buildBasket(){
 const g=new THREE.Group();g.name='Rattan basket';
 const B=BASKET,rattan=mat(0xc9a36a,{roughness:.9}),rim=mat(0xa47e48,{roughness:.9}),t=B.wall;
 add(g,new THREE.BoxGeometry(B.w,t,B.d),rattan,0,B.h-t/2,0);
 for(const s of [-1,1]){add(g,new THREE.BoxGeometry(t,B.h-t,B.d),rattan,s*(B.w/2-t/2),(B.h-t)/2,0);add(g,new THREE.BoxGeometry(B.w-2*t,B.h-t,t),rattan,0,(B.h-t)/2,s*(B.d/2-t/2));}
 // the rim band round the open edge, a little proud of the walls
 for(const s of [-1,1]){add(g,new THREE.BoxGeometry(t*1.6,.022,B.d+t*.6),rim,s*(B.w/2-t*.5),.011,0);add(g,new THREE.BoxGeometry(B.w+t*.6,.022,t*1.6),rim,0,.011,s*(B.d/2-t*.5));}
 // the weave: three darker bands round the walls
 const band=mat(0xb48d56,{roughness:.9});
 for(const y of [.07,.12,.17])for(const s of [-1,1]){add(g,new THREE.BoxGeometry(t*1.2,.008,B.d+t*.2),band,s*(B.w/2-t/2),y,0);add(g,new THREE.BoxGeometry(B.w+t*.2,.008,t*1.2),band,0,y,s*(B.d/2-t/2));}
 return g;
}

/** The evening paper folded once down its middle (a quarter of a broadsheet: each leaf 0.19 × 0.28 m at the town's scale),
 *  printed in grey columns with a dark masthead; its origin at the middle of the fold. setSpread(half) opens it so its two
 *  outer edges are `half` metres either side of the fold's line (held between the mittens). */
export const PAPER=Object.freeze({leaf:.19,height:.28});
export function buildPaper(){
 const g=new THREE.Group();g.name='Evening paper';
 const page=mat(0xf1ece0,{roughness:.95,side:THREE.DoubleSide}),ink=mat(0x8b8780,{roughness:1,side:THREE.DoubleSide}),head=mat(0x3a3836,{roughness:1,side:THREE.DoubleSide});
 const P=PAPER,leaves=[];
 for(const s of [-1,1]){
  const leaf=new THREE.Group();g.add(leaf);leaves.push(leaf);
  const sheet=add(leaf,new THREE.PlaneGeometry(P.leaf,P.height),page,s*P.leaf/2,0,0);sheet.castShadow=true;
  // print on both faces: columns of grey, a dark headline across the outer leaf's top (the front page)
  for(const f of [1,-1]){const z=f*.0012;
   for(let c=0;c<3;c++)add(leaf,new THREE.PlaneGeometry(P.leaf*.26,P.height*.62),ink,s*(P.leaf*(.18+c*.31)),-P.height*.1,z).castShadow=false;
   add(leaf,new THREE.PlaneGeometry(P.leaf*.86,P.height*.1),f>0?ink:head,s*P.leaf*.5,P.height*.36,z).castShadow=false;}
 }
 g.userData.paper={setSpread(half){const a=Math.acos(THREE.MathUtils.clamp(half/P.leaf,0,1));leaves[0].rotation.y=-a;leaves[1].rotation.y=a;return a;}};
 g.userData.paper.setSpread(P.leaf*.9);
 return g;
}

/**
 * Miss Higa's paperback (STORY_PROPS.paperback): a bunko-sized novel open in one hand, its two halves in a shallow V (each
 * turned PAPERBACK.open from flat) about the spine. Each half: the page block (cream, its edges the pages' colour), the
 * reading face with its vertical columns of print, and the cover board a little larger than the block. The front cover
 * (the reader's right half, as a book read right to left opens) is deep teal with a cream title panel and gold rule, and
 * the 1990s paper band (obi) round its foot in vermilion with a cream stripe: no real title or maker. The spine joins
 * the boards behind. Built with the reader at -z looking +z (a 'facing' hold puts +z where the holder faces), tilted
 * back PAPERBACK.tilt so the pages face up to the eyes; its origin is the grip: the mitten under the foot of the spine.
 */
export const PAPERBACK=Object.freeze({w:.115,h:.165,block:.011,board:.0025,overhang:.003,open:.3,tilt:.88,lift:.012,ahead:.02,
 colours:Object.freeze({cover:0x2f5f66,panel:0xf1e6c8,rule:0xb8913a,obi:0xc8462e,obiStripe:0xf3e7cc,pages:0xf3ead2,face:0xfaf5e8,print:0x8d8a84})});
export function buildPaperback(){
 const B=PAPERBACK,C=B.colours,g=new THREE.Group();g.name='Paperback';
 const book=new THREE.Group();book.name='Paperback (open)';g.add(book);
 const board=mat(C.cover,{roughness:.55}),pages=mat(C.pages,{roughness:.95}),face=mat(C.face,{roughness:.95,side:THREE.DoubleSide});
 const print=mat(C.print,{roughness:1,side:THREE.DoubleSide}),panel=mat(C.panel,{roughness:.8,side:THREE.DoubleSide}),rule=mat(C.rule,{roughness:.4,metalness:.3,side:THREE.DoubleSide});
 const obi=mat(C.obi,{roughness:.7,side:THREE.DoubleSide}),stripe=mat(C.obiStripe,{roughness:.8,side:THREE.DoubleSide});
 const T=B.block,W=B.w,H=B.h,back=T+B.board;
 for(const s of [-1,1]){
  const half=new THREE.Group();half.name=s<0?'Paperback front half':'Paperback back half';half.rotation.y=s*B.open;book.add(half);
  add(half,new THREE.BoxGeometry(W-.002,H-2*B.overhang,T),pages,s*(W/2+.001),H/2,T/2);                       // the page block
  add(half,new THREE.BoxGeometry(W+B.overhang,H,B.board),board,s*(W+B.overhang)/2,H/2,T+B.board/2);         // the cover board
  const f=add(half,new THREE.PlaneGeometry(W-.008,H-2*B.overhang-.004),face,s*(W/2+.001),H/2,-.0004);f.castShadow=false;   // the reading face
  for(let c=0;c<7;c++){const col=add(half,new THREE.PlaneGeometry(.0045,H*.72),print,s*(.014+c*.0135),H*.5,-.0008);col.castShadow=false;}   // print in columns
  // the outside of the board: the front cover with its title panel, rule and band; the back with its blurb panel
  const out=T+B.board+.0006,x0=s*(W+B.overhang)/2,deco=(geo,m,x,y)=>{const o=add(half,geo,m,x,y,out);o.castShadow=false;return o;};
  if(s<0){deco(new THREE.PlaneGeometry(W*.62,H*.3),panel,x0,H*.7);deco(new THREE.PlaneGeometry(W*.62,.0035),rule,x0,H*.52);
   deco(new THREE.PlaneGeometry(W+B.overhang,H*.27),obi,x0,H*.135);deco(new THREE.PlaneGeometry(W+B.overhang,.008),stripe,x0,H*.2);}
  else deco(new THREE.PlaneGeometry(W*.6,H*.22),panel,x0,H*.62);
 }
 add(book,new THREE.BoxGeometry(.016,H,.005),board,0,H/2,back+.0005);                                         // the spine
 book.rotation.x=B.tilt;book.position.set(0,B.lift,B.ahead);
 g.userData.hold='facing';
 return g;
}

/**
 * The Halloween costumes ("The Haunted Vending Machine"), fitted to the body that wears them from its own measures:
 *   pumpkinSuit  on the hips bone: eight orange lobes round the torso, a jack-o'-lantern face on the front, a leaf
 *                collar; and a stem cap on the head bone
 *   ghostSheet   on the hips bone: a white sheet from the shoulders to the knees with a wavy hem; and on the head
 *                bone a hood round the head, open at the face
 *   witchHat     on the head bone: a black cone hat with a brim and a purple band
 *   catEars      on the head bone: a thin black band over the crown and two black felt ears, pink inside
 * Each returns {parts: [[bone, object], ...]}; in the hips' and the head's bone frames the body's front is +z.
 */
export function buildCostume(avatar,kind){
 const m=avatar.measure,parts=[],k=m.k||1;
 const top=m.headCentre-m.headY+m.Rh*m.headSY;   // the crown, in the head bone's frame
 if(kind==='pumpkinSuit'){
  const g=new THREE.Group();g.name='Pumpkin suit';
  const orange=mat(0xe8812a,{roughness:.75}),dark=mat(0x2a1f18,{roughness:.9,side:THREE.DoubleSide}),green=mat(0x4f7a32,{roughness:.8,side:THREE.DoubleSide});
  const rx=m.shoulderX*.98,ry=(m.shoulderY-m.hipY)/2+.06*k,rz=m.depth/2+.13*k,cy=(m.shoulderY+m.hipY)/2-m.hipY-.02*k;   // narrow enough that the arms hang outside it
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,l=add(g,new THREE.SphereGeometry(1,18,14),orange,Math.sin(a)*rx*.38,cy,Math.cos(a)*rz*.38);l.scale.set(rx*.66,ry,rz*.66);}
  // the face, on the front (+z): two eyes, a nose and a grin, laid on the lobes' surface
  const face=new THREE.Group();face.position.set(0,cy,rz*1.0);g.add(face);
  const tri=(x,y,w,h)=>{const t=new THREE.Shape();t.moveTo(x-w/2,y-h/2);t.lineTo(x+w/2,y-h/2);t.lineTo(x,y+h/2);t.closePath();return t;};
  const grin=new THREE.Shape(),gw=rx*.55;grin.moveTo(-gw,-ry*.12);grin.quadraticCurveTo(0,-ry*.62,gw,-ry*.12);grin.lineTo(gw*.5,-ry*.22);grin.lineTo(gw*.2,-ry*.14);grin.lineTo(-gw*.2,-ry*.14);grin.lineTo(-gw*.5,-ry*.22);grin.closePath();
  add(face,new THREE.ShapeGeometry([tri(-rx*.35,ry*.28,rx*.3,ry*.25),tri(rx*.35,ry*.28,rx*.3,ry*.25),tri(0,ry*.06,rx*.13,ry*.12),grin],4),dark).castShadow=false;
  // the leaf collar round the neck
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2,leaf=add(g,new THREE.CircleGeometry(.07*k,10),green,Math.sin(a)*m.width*.22,cy+ry*.97,Math.cos(a)*m.depth*.32);leaf.rotation.set(-Math.PI/2+.5*Math.cos(a),a,0);leaf.scale.set(1,1.6,1);}
  parts.push(['hips',g]);
  const cap=new THREE.Group();cap.name='Pumpkin stem cap';
  add(cap,new THREE.CylinderGeometry(.025*k,.035*k,.09*k,10),green,0,top+.035*k,0);
  const leaf=add(cap,new THREE.CircleGeometry(.05*k,10),green,.04*k,top+.01*k,0);leaf.rotation.set(-Math.PI/2+.3,0,.4);leaf.scale.set(1,1.7,1);
  parts.push(['head',cap]);
 }else if(kind==='ghostSheet'){
  const white=mat(0xfbfaf6,{roughness:.9,side:THREE.DoubleSide});
  const sheet=new THREE.Group();sheet.name='Ghost sheet';
  // from the neck, over the shoulders and the arms hanging at the sides, down to the knees
  const y0=m.shoulderY+.13*k-m.hipY,ys=m.shoulderY-.01*k-m.hipY,y1=Math.max(.18,m.hipY*.5)-m.hipY,rn=m.width*.24,rs=m.shoulderX+m.armR+.08*k,r1=Math.max(rs+.05*k,m.width*.82),pts=[];
  for(let i=0;i<=4;i++){const t=i/4;pts.push(new THREE.Vector2(rn+(rs-rn)*Math.sin(t*Math.PI/2),y0+(ys-y0)*t));}
  for(let i=1;i<=10;i++){const t=i/10;pts.push(new THREE.Vector2(rs+(r1-rs)*Math.sqrt(t),ys+(y1-ys)*t));}
  const geo=new THREE.LatheGeometry(pts.reverse(),28);
  const P=geo.attributes.position;for(let i=0;i<P.count;i++){const y=P.getY(i);if(y<y1+.02){const a=Math.atan2(P.getX(i),P.getZ(i));P.setY(i,y+Math.sin(a*7)*.025*k);}}
  geo.computeVertexNormals();add(sheet,geo,white);
  add(sheet,new THREE.CylinderGeometry(rn*.6,rn,.03*k,24,1,true),white,0,y0+.012*k,0);   // closed round the neck
  parts.push(['hips',sheet]);
  const hood=new THREE.Group();hood.name='Ghost hood';
  const hatted=avatar.recipe?.outfit?.hat&&avatar.recipe.outfit.hat!=='none';
  if(hatted)drapedHood(avatar,hood,white);
  else{
   const R=m.Rh*Math.max(m.headSX,1)+.03*k,cy=m.headCentre-m.headY,hp=[];
   for(let i=0;i<=10;i++){const a=i/10*Math.PI*.62;hp.push(new THREE.Vector2(Math.sin(a)*R*1.02+.0001,cy+Math.cos(a)*R*m.headSY*.95));}
   for(let i=1;i<=3;i++)hp.push(new THREE.Vector2(R*1.02+.01*i,cy-R*.4-i*.05*k));
   const front=1.15;   // the face's opening, radians each side of the front
   add(hood,new THREE.LatheGeometry(hp,24,front,Math.PI*2-front*2),white);
   add(hood,new THREE.ConeGeometry(.05*k,.1*k,12),white,0,cy+R*m.headSY*.95+.03*k,-.02*k).rotation.x=-.4;   // the sheet's little peak
  }
  parts.push(['head',hood]);
 }else if(kind==='witchHat'){
  const hat=new THREE.Group();hat.name='Witch hat';
  const black=mat(0x24222a,{roughness:.8,side:THREE.DoubleSide}),band=mat(0x7d4fa8,{roughness:.7});
  const R=m.Rh*Math.max(m.headSX,1);
  add(hat,new THREE.CylinderGeometry(R*1.45,R*1.45,.012*k,28),black,0,top-.03*k,0);
  const cone=add(hat,new THREE.ConeGeometry(R*.78,R*2.2,24),black,0,top-.03*k+R*1.1,0);cone.rotation.x=.12;
  add(hat,new THREE.CylinderGeometry(R*.76,R*.79,.05*k,24),band,0,top+.0*k,0);
  hat.rotation.x=.12;parts.push(['head',hat]);
 }else if(kind==='catEars'){
  const band=new THREE.Group();band.name='Cat ears';
  const black=mat(0x24222a,{roughness:.85,side:THREE.DoubleSide}),pink=mat(0xf2a3a8,{roughness:.9,side:THREE.DoubleSide});
  // On this head's own shape (head-profile.js, as the catalogue's hats are fitted), 6 mm off the scalp: a point on the unit
  // head at angle t from the top (−π/2 the left ear, π/2 the right), a little behind the crown, where a headband sits.
  const S=[m.headSX*m.Rh,(m.headSY||1)*m.Rh,m.Rh*.98],cy=m.headCentre-m.headY,lift=1+.006/m.Rh,R=m.Rh*Math.max(m.headSX,1);
  const onHead=t=>{const u=new THREE.Vector3(Math.sin(t),Math.cos(t),-.12).normalize();shapeHeadPoint(u,m.profile);return new THREE.Vector3(u.x*S[0]*lift,cy+u.y*S[1]*lift,u.z*S[2]*lift);};
  const arc=[];for(let i=0;i<=24;i++)arc.push(onHead(-Math.PI/2+i/24*Math.PI));
  add(band,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc),48,.008*k,6,false),black);
  // the ears: flat pointed felt triangles standing on the band either side of the top, turned out a little, pink inside
  // (sized from the head, as a headband's ears are made for a head: about a third of its radius tall)
  const ear=(w,h)=>{const sh=new THREE.Shape();sh.moveTo(-w/2,0);sh.lineTo(0,h);sh.lineTo(w/2,0);sh.closePath();return sh;};
  for(const side of [-1,1]){
   const a=side*.5,e=new THREE.Group();e.position.copy(onHead(a)).setY(e.position.y-.012*k);e.rotation.z=-a*.5;band.add(e);
   add(e,new THREE.ExtrudeGeometry(ear(R*.34,R*.38),{depth:.006*k,bevelEnabled:false}),black,0,0,-.003*k);   // the felt, 6 mm thick
   add(e,new THREE.ShapeGeometry(ear(R*.19,R*.22)),pink,0,R*.055,.0035*k);                                   // its pink inside, on the front
  }
  parts.push(['head',band]);
 }else throw new Error('No costume "'+kind+'"');
 return {parts};
}

const _v=new THREE.Vector3(),_w=new THREE.Vector3(),_m=new THREE.Matrix4();
/**
 * The ghost sheet's hood over a hat (Mori's police cap): the sheet drawn over the head and everything on it, as cloth is.
 * From a point in the head, in every direction it lies a little (HOOD.clear) outside the furthest thing there -- the cap's
 * crown, its welt, the visor, the hair, the ears -- so it takes the cap's shape: flat over the crown, out over the visor,
 * which makes its peak, and nothing comes through it. The face is left open below the visor (HOOD.open each side of the
 * front), wide enough to see the face and what it is doing. It casts no shadow: a closed shell round the head would put the
 * face in the dark, which the thin sheet does not.
 */
const lerp=THREE.MathUtils.lerp;
export const HOOD=Object.freeze({clear:.016,open:1.25,rows:30,cols:72,reach:.82,brow:.3});
function drapedHood(avatar,group,material){
 const m=avatar.measure,k=m.k||1,R=m.Rh,H=HOOD,hc=m.headCentre-m.headY;
 const pts=posedPoints(avatar,avatar.bones.head).filter(p=>p.y>-R*.15&&p.y<R*4&&Math.hypot(p.x,p.z)<R*2.4);
 const c=new THREE.Vector3(0,hc+R*.2,-R*.05),rel=pts.map(p=>p.clone().sub(c)),len=rel.map(v=>v.length()),unit=rel.map((v,i)=>v.clone().divideScalar(len[i]||1));
 const NT=H.rows,NP=H.cols,TMAX=Math.PI*H.reach,cone=Math.max(TMAX/NT,Math.PI*2/NP)*2.6,cosCone=Math.cos(cone);
 const dir=(t,p)=>new THREE.Vector3(Math.sin(t)*Math.sin(p),Math.cos(t),Math.sin(t)*Math.cos(p));
 let r=[];
 for(let i=0;i<=NT;i++){const row=[],t=i/NT*TMAX;
  for(let j=0;j<NP;j++){const d=dir(t,j/NP*Math.PI*2);let best=R*.9;
   for(let n=0;n<rel.length;n++){const cos=unit[n].dot(d);if(cos>cosCone)best=Math.max(best,len[n]*Math.min(1,cos+.02));}
   row.push(best);}
  r.push(row);}
 // smoothed out into soft cloth (each pass an average of its neighbours, never drawn in below what it covers)
 const need=r.map(row=>row.slice());
 for(let pass=0;pass<6;pass++)r=r.map((row,i)=>row.map((v,j)=>{const n=[row[(j+1)%NP],row[(j+NP-1)%NP],(r[i-1]||row)[j],(r[i+1]||row)[j]];return Math.max(need[i][j],(v*2+n.reduce((a,b)=>a+b,0))/6);}));
 // The cloth falls from the widest thing it goes over (the crown's rim, the visor's edge) straight down, as a sheet does,
 // and on down to the shoulders, where the sheet's own top is.
 const grid=[];for(let i=0;i<=NT;i++)grid.push(r[i].map((v,j)=>dir(i/NT*TMAX,j/NP*Math.PI*2).multiplyScalar(v+H.clear*k).add(c)));
 for(let j=0;j<NP;j++){let wide=0;for(let i=0;i<=NT;i++){const p=grid[i][j],h=Math.hypot(p.x,p.z-c.z);
  if(h>=wide){wide=h;continue;}const f=wide/(h||1);p.x*=f;p.z=c.z+(p.z-c.z)*f;}}
 // Below the head it spreads over the shoulders onto the sheet's own top (buildCostume), so no gap shows from below.
 const neck=m.shoulderY+.04*k-m.headY,shoulder=m.shoulderY-.03*k-m.headY,spread=m.shoulderX+m.armR+.09*k;
 {const last=grid.at(-1);
  grid.push(last.map(p=>new THREE.Vector3(p.x,lerp(p.y,neck,.6),p.z)));
  grid.push(last.map(p=>{const h=Math.hypot(p.x,p.z-c.z)||1,f=Math.max(1,spread/h);return new THREE.Vector3(p.x*f,shoulder,c.z+(p.z-c.z)*f);}));}
 // The face's opening: an oval cut in the front from the brow to the chin, as the children cut it. Its edge is a clean
 // curve: the cloth's points inside it are moved out to it, and what lies wholly inside is left out.
 const NR=grid.length-1,browY=hc+R*m.headSY*H.brow,chinY=hc-R*m.headSY*1.02,midY=(browY+chinY)/2,up=browY-midY,down=midY-chinY;
 const cut=grid.map(row=>row.map(()=>false));
 for(let i=0;i<=NR;i++)for(let j=0;j<NP;j++){
  const az=Math.atan2(Math.sin(j/NP*Math.PI*2),Math.cos(j/NP*Math.PI*2)),w=1-(az/H.open)**2;if(w<=0)continue;
  const top=midY+up*Math.sqrt(w),bottom=midY-down*Math.sqrt(w),p=grid[i][j];
  if(p.y<top&&p.y>bottom){p.y=top-p.y<p.y-bottom?top:bottom;cut[i][j]=true;}
 }
 const pos=[],index=[],at=(i,j)=>i*NP+j;
 for(const row of grid)for(const p of row)pos.push(p.x,p.y,p.z);
 for(let i=0;i<NR;i++)for(let j=0;j<NP;j++){const jj=(j+1)%NP;
  if(cut[i][j]&&cut[i][jj]&&cut[i+1][j]&&cut[i+1][jj])continue;
  const a=at(i,j),b=at(i,jj),cc=at(i+1,j),d=at(i+1,jj);index.push(a,cc,b,b,cc,d);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();
 const shell=new THREE.Mesh(g,material);shell.name='Ghost hood cloth';shell.castShadow=false;shell.receiveShadow=true;group.add(shell);
 // the sheet's little peak, on top of whatever the hood covers
 const top=dir(0,0).multiplyScalar(r[0][0]+H.clear*k).add(c);
 const peak=new THREE.Mesh(new THREE.ConeGeometry(.05*k,.1*k,12),material);peak.position.set(0,top.y+.03*k,-.02*k);peak.rotation.x=-.4;peak.castShadow=false;group.add(peak);
 return {shell,points:pts.length};
}

/** Every point of the drawn body (each skinned mesh as it stands this frame, the face's head), in `frame`'s space, through
 *  `keep(point in the root's space)`: what a prop round the body must clear. The outlines and hidden ranges are left out. */
export function posedPoints(avatar,frame,keep=()=>true,stride=1,bones=null){
 avatar.root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(frame.matrixWorld).invert(),rootInv=new THREE.Matrix4().copy(avatar.root.matrixWorld).invert(),out=[];
 const take=p=>{_w.copy(p).applyMatrix4(rootInv);if(keep(_w))out.push(p.clone().applyMatrix4(inv));};
 for(const mesh of avatar.root.children){
  if(!mesh.isSkinnedMesh||!mesh.visible||mesh.userData.outline||mesh.name.includes('outline'))continue;
  const g=mesh.geometry,n=g.attributes.position.count,r=g.drawRange,end=Math.min(r.start+r.count,g.index?g.index.count:n);
  // (`bones`: only the skin those bones carry, for a prop that rests on one part of the body: a basket on the head, not on a raised mitten)
  const carried=bones&&new Set(mesh.skeleton.bones.map((b,i)=>bones.has(b.name)?i:-1).filter(i=>i>=0)),I=g.attributes.skinIndex;
  const ids=new Set();if(g.index){for(let i=r.start;i<end;i++)ids.add(g.index.getX(i));}else for(let i=r.start;i<end;i++)ids.add(i);
  let k=0;for(const i of ids){if(k++%stride)continue;if(carried&&!carried.has(I.getX(i)))continue;mesh.getVertexPosition(i,_v);mesh.localToWorld(_v);take(_v);}
 }
 const h=avatar.face?.head;if(h){const P=h.geometry.attributes.position;for(let i=0;i<P.count;i+=2){_v.fromBufferAttribute(P,i);h.localToWorld(_v);take(_v);}}
 return out;
}

/**
 * The basket on the head: upside down, a little askew (BASKET.tilt), centred over the crown, and lowered until it rests on
 * whatever the head carries (the hair, the head towel, the head itself): the lowest place where no point of them is in its
 * walls, its rim or under its floor. Worked out once for each body and what it has on, in the head bone's frame.
 */
export function fitBasket(avatar){
 const head=avatar.bones.head,B=BASKET,m=avatar.measure;
 // the head and what is on it, at rest (the head carries them rigidly), in the head bone's frame
 // (the head and what is on it only: her arms out feeling the dark must not hold the basket up)
 const pts=posedPoints(avatar,head,p=>p.y>m.headY+m.Rh*.15,1,new Set(['head']));
 const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(...B.tilt)),qi=q.clone().invert(),hc=m.headCentre-m.headY;
 const inside=y=>{for(const p of pts){_v.copy(p);_v.y-=y;_v.applyQuaternion(qi);
   const ax=Math.abs(_v.x),az=Math.abs(_v.z);if(_v.y<-.002||_v.y>B.h+.002||ax>B.w/2+.001||az>B.d/2+.001)continue;   // outside the basket's box
   // (in its hollow: a head wider than the hollow is met by the walls' own faces, within a millimetre, not a wider band
   // that would hold the basket off a big head)
   if(ax<B.w/2-B.wall-.001&&az<B.d/2-B.wall-.001&&_v.y<B.h-B.wall-.003)continue;
   return true;}return false;};
 let y=hc+m.Rh*m.headSY*1.6;const top=y;while(y>hc&&!inside(y-.0005))y-=.0005;y+=.0025;   // resting, a hair clear (the towel and hair move a little with the head)
 return {position:new THREE.Vector3(0,y,0),quaternion:q,rested:y<top-.002};
}

/**
 * The dryer's cord wound round the body: four turns from the hips to just under the arms, round the body and the arms
 * pinned to it, every point just clear of whatever is drawn there (the wrap, the arms), then away behind to the socket
 * (`to`, in the body's space; by default down to the floor and along it behind). It starts at the dryer's handle under the
 * right mitten. Built from the body as it stands (CordWrapped's pose), in the chest bone's frame, as one thin tube.
 */
export const CORD=Object.freeze({radius:.0045,turns:4,clear:.003,colour:0x2e3032});
export function buildCordWrap(avatar,{to=null}={}){
 const m=avatar.measure,k=m.k,chest=avatar.bones.chest,root=avatar.root;
 const y0=m.hipY+.02*k,y1=m.shoulderY-.1*k;
 // pulled tight, the cord lies on the outline of everything it goes round at its height (the body and the arms): the
 // convex hull of what is drawn in a slab there, in the root's space
 const pts=posedPoints(avatar,root,p=>p.y>y0-.04&&p.y<y1+.04),slab=.012,levels=[];
 for(let y=y0-.01;y<=y1+.011;y+=.01){
  const flat=pts.filter(p=>Math.abs(p.y-y)<slab).map(p=>[p.x,p.z]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
  const cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];
  for(const p of flat){while(lo.length>1&&cross(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
  for(const p of flat.slice().reverse()){while(hi.length>1&&cross(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}
  levels.push({y,hull:lo.slice(0,-1).concat(hi.slice(0,-1))});
 }
 /** How far out the hull is at angle a (radians from ahead, toward the left): where the ray from the body's axis leaves it. */
 const rayOut=(hull,a)=>{const dx=Math.sin(a),dz=Math.cos(a);let r=0;
  for(let i=0;i<hull.length;i++){const [x1,z1]=hull[i],[x2,z2]=hull[(i+1)%hull.length],ex=x2-x1,ez=z2-z1,den=dx*ez-dz*ex;if(Math.abs(den)<1e-12)continue;
   const t=(x1*ez-z1*ex)/den,u=(x1*dz-z1*dx)/den;if(t>0&&u>=-1e-9&&u<=1+1e-9)r=Math.max(r,t);}
  return r;};
 const need=(a,y)=>{const f=THREE.MathUtils.clamp((y-levels[0].y)/.01,0,levels.length-1),i=Math.floor(f),j=Math.min(levels.length-1,i+1);
  // the larger of the two levels either side (it is pulled over whichever sticks out), and the cord's own thickness
  return Math.max(rayOut(levels[i].hull,a*Math.PI*2),rayOut(levels[j].hull,a*Math.PI*2))+CORD.radius+CORD.clear;};
 // the turns, from the bottom up, starting at the right side (where the hand and the dryer are)
 // (and three quarters of a turn more, so it leaves her at the middle of her back, away from her arms)
 const turns=CORD.turns+.75,N=Math.round(turns*72),ring=[];
 for(let i=0;i<=N;i++){const u=i/N,a=(.75+u*turns)%1,y=y0+(y1-y0)*u;ring.push([a,y,need(a,y)]);}
 const R=ring.map(r=>r[2]);
 const path=ring.map(([a,y],i)=>new THREE.Vector3(Math.sin(a*Math.PI*2)*R[i],y,Math.cos(a*Math.PI*2)*R[i]));
 // in at the bottom: up from the dryer's handle (below the right mitten) to the first turn
 root.updateMatrixWorld(true);
 const hand=avatar.bones.handR.localToWorld(new THREE.Vector3(0,-m.hand*.55-.11*k,0));root.worldToLocal(hand);
 const first=path[0],between=hand.clone().lerp(first,.5);between.x-=.012*k;   // a little out to her right, round the mitten
 path.unshift(hand,between);
 // out at the top, behind: over the back and down to the socket (or to the floor behind her)
 const last=path[path.length-1],back=new THREE.Vector3(last.x,last.y-.06*k,last.z-.07*k);
 const end=to?new THREE.Vector3(...to):new THREE.Vector3(-.15*k,.005,-.75*k);
 const mid=back.clone().lerp(end,.5);mid.y=Math.min(back.y,end.y)-.05*k;if(!to)mid.y=Math.max(.02,back.y*.35);
 path.push(back,mid,end);
 const curve=new THREE.CatmullRomCurve3(path,false,'centripetal');
 const geometry=new THREE.TubeGeometry(curve,path.length*3,CORD.radius,6,false);
 // into the chest bone's frame, so it moves with the body that wears it
 const toChest=new THREE.Matrix4().copy(chest.matrixWorld).invert().multiply(root.matrixWorld);geometry.applyMatrix4(toChest);
 const mesh=new THREE.Mesh(geometry,mat(CORD.colour,{roughness:.5}));mesh.name='Dryer cord';mesh.castShadow=true;
 mesh.userData.indexCount=geometry.index.count;
 return mesh;
}

/** Where a torch clipped to the left chest sits, in the chest bone's frame: head down in the shirt pocket (or down the front of
 *  the vest, clipped to its neckline), its clip over the edge, beside the badge he wears there, lying on the body. */
export function pocketSpot(avatar){
 const m=avatar.measure,vol=bodyVolume(avatar.recipe,m),vest=avatar.outfit==='afterbath',a=vest?.16:.22;
 const edge=vest?.8:.78,mid=edge-(TORCH.length/2+.002)/m.torso;   // the clip's top at the pocket's (or the neckline's) edge
 const s=vol.surf(a,mid),n=vol.normal(s),gap=(vest?.009:.004)*m.k+TORCH.radius;
 const at=s.clone().addScaledVector(n,gap).sub(new THREE.Vector3(0,m.chestY,0));
 // the torch's +z (its lens) down the chest along the surface, its +y (the clip) outward
 const out=n.clone(),down=new THREE.Vector3(0,-1,0).addScaledVector(out,out.y).normalize(),side=new THREE.Vector3().crossVectors(out,down);
 const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side,out,down));
 return {position:at,quaternion:q,normal:n};
}

// ---- Tetsuo's work kit (WORK_KIT). Each piece fitted to the body that wears it, in the bone frame that carries it.

/** The head's centre in the head bone's frame (faceObjectPoint's frame). */
const headCentre=m=>new THREE.Vector3(0,m.headCentre-m.headY,0);
/** Whatever is drawn on the head (the head, the hair, the nose, the face's own glasses), in the head bone's frame. */
function headPoints(avatar,keep=()=>true){
 const m=avatar.measure,pts=posedPoints(avatar,avatar.bones.head,p=>p.y>m.headY-m.Rh*.2&&keep(p),1);
 const fo=avatar.bones.head.children.find(o=>o.name==='Face objects');
 if(fo)fo.traverse(o=>{if(!o.isMesh)return;const P=o.geometry.attributes.position;for(let i=0;i<P.count;i++)pts.push(new THREE.Vector3().fromBufferAttribute(P,i));});
 return pts;
}

/**
 * Clear safety glasses over spectacles: one wide shield across both eyes following the face's curve (the same projection as
 * the face's own glasses, face-objects.js), notched over the nose, a dark brow bar along its top and arms back to the head.
 * `lift` is how far out from the face it starts (in head radii); it is raised until nothing drawn on the head (the nose, the
 * brows, his own frames) comes through it, with `clear` metres to spare.
 */
export const SAFETY_GLASSES=Object.freeze({lift:.1,clear:.004,wide:1.5,top:1.2,bottom:1.05,lens:0xe6f2f6,opacity:.24,bar:0x3a3f44});
export function buildSafetyGlasses(avatar){
 const m=avatar.measure,L=faceLayout(avatar.recipe),S=SAFETY_GLASSES,c=headCentre(m);
 const r=16*L.eyeS*L.glassS,rx=r*L.eyeW,x0=128-L.spread-rx*S.wide,x1=128+L.spread+rx*S.wide,yTop=L.glassY-r*S.top,yBot=L.glassY+r*S.bottom;
 // the notch: over the nose, and up over the bridge of his own glasses (the face's glasses arch their bridge out from the face)
 const noseHalf=13*L.noseS,nTop=L.glassY-r*.6,notch=(x,y)=>y>nTop&&Math.abs(x-128)<noseHalf*(.8+.7*(y-nTop)/(yBot-nTop));
 const NX=18,NY=7,grid=[];for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++)grid.push([x0+(x1-x0)*i/NX,yTop+(yBot-yTop)*j/NY]);
 const pts=headPoints(avatar),dirs=pts.map(p=>{const d=p.clone().sub(c);return {len:d.length(),d:d.normalize()};});
 const fits=lift=>grid.every(([x,y])=>{if(notch(x,y))return true;const v=faceObjectPoint(m,x,y,lift).sub(c),len=v.length();v.normalize();
  return dirs.every(q=>q.d.dot(v)<.9985||q.len+S.clear<len);});
 let lift=S.lift;while(!fits(lift)&&lift<.4)lift+=.01;
 const g=new THREE.Group();g.name='Safety glasses';g.userData.lift=lift;
 // The shield: the grid's cells, the nose notch left open.
 const pos=[],at=(x,y,l=lift)=>faceObjectPoint(m,x,y,l);
 for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const k=j*(NX+1)+i,q=[grid[k],grid[k+1],grid[k+NX+2],grid[k+NX+1]];
  if(q.some(([x,y])=>notch(x,y)))continue;const [a,b,cc,d]=q.map(([x,y])=>at(x,y));pos.push(...a.toArray(),...d.toArray(),...b.toArray(),...b.toArray(),...d.toArray(),...cc.toArray());}
 const lensGeo=new THREE.BufferGeometry();lensGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));lensGeo.computeVertexNormals();
 const lens=new THREE.Mesh(lensGeo,new THREE.MeshStandardMaterial({color:S.lens,transparent:true,opacity:S.opacity,roughness:.1,depthWrite:false,side:THREE.DoubleSide}));
 lens.name='Safety glasses shield';lens.castShadow=false;g.add(lens);
 // The brow bar along the top edge, a rim down each outer edge, and the arms back to the sides of the head, outside his own.
 const bar=mat(S.bar,{roughness:.45}),tube=(points,radius,name)=>{const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,false,'centripetal'),Math.max(12,points.length*3),radius,6,false),bar);t.name=name;t.castShadow=false;g.add(t);return t;};
 tube(Array.from({length:NX+1},(_,i)=>at(x0+(x1-x0)*i/NX,yTop,lift+.01)),.0035,'Safety glasses brow bar');
 for(const x of [x0,x1]){
  tube(Array.from({length:NY+1},(_,j)=>at(x,yTop+(yBot-yTop)*j/NY,lift+.004)),.0022,'Safety glasses rim');
  // the arm: back from the shield's outer top corner to the side of the head above the ear, outside the face's own glasses
  const o=at(x,(yTop+L.glassY)/2,lift+.01),s=Math.sign(o.x),back=new THREE.Vector3(s*m.Rh*m.headSX*1.06,o.y-.004,-m.Rh*.1);
  tube([o,o.clone().add(new THREE.Vector3(s*m.Rh*.04,0,-m.Rh*.08)),back],.003,'Safety glasses arm');
 }
 return g;
}

/**
 * A headlamp on an elastic band: the band follows the outline of whatever is on the head at its height (hair, a bald crown)
 * just clear of it, the lamp on the forehead tipped `tilt` down, its battery box at the back. setOn(true) lights the lens and
 * switches on its light (no drawn beam: seen from in front it would lie over the face): a warm spot (an incandescent bulb of the period, not a white LED) from the lens,
 * `light` its numbers, so a film can stand the same light in for it (capture-room's "torch": from the lens, along `aim`).
 */
export const HEADLAMP=Object.freeze({band:.024,above:22,clear:.004,tilt:.22,colour:0x3b3f44,bandColour:0x2a2c2e,stripe:0xe8c23a,
 light:Object.freeze({colour:0xffd6a0,kelvin:2800,intensity:3,distance:3,angle:.34,penumbra:.5,decay:2,
  why:'A krypton bulb behind a small reflector: a warm, fairly narrow pool, bright enough to read a breaker’s label at arm’s length, dim beyond a few metres.'})});
export function buildHeadlamp(avatar){
 const m=avatar.measure,L=faceLayout(avatar.recipe),H=HEADLAMP,c=headCentre(m);
 const y=faceObjectPoint(m,128,L.browY-H.above,0).y;// the band's middle: on the forehead, above the brows
 const pts=headPoints(avatar,p=>true).filter(p=>Math.abs(p.y-y)<H.band*.6);
 const around=a=>{const dx=Math.sin(a),dz=Math.cos(a);let r=0;for(const p of pts){const px=p.x-c.x,pz=p.z-c.z,along=px*dx+pz*dz,off=Math.abs(px*dz-pz*dx);if(off<.012&&along>r)r=along;}return r+H.clear;};
 const N=48,ring=Array.from({length:N},(_,i)=>{const a=i/N*Math.PI*2;return [a,around(a)];});
 // smoothed, never inside: the larger of each radius and its neighbours' mean
 const R=ring.map(([,r],i)=>Math.max(r,(ring[(i+N-1)%N][1]+ring[(i+1)%N][1])/2));
 const g=new THREE.Group();g.name='Headlamp';
 const pos=[],idx=[];for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,r=R[i%N];for(const s of [-1,1])pos.push(c.x+Math.sin(a)*r,y+s*H.band/2,c.z+Math.cos(a)*r);if(i<N){const k=i*2;idx.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const bandGeo=new THREE.BufferGeometry();bandGeo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));bandGeo.setIndex(idx);bandGeo.computeVertexNormals();
 const band=new THREE.Mesh(bandGeo,mat(H.bandColour,{roughness:.8,side:THREE.DoubleSide}));band.name='Headlamp band';band.castShadow=false;g.add(band);
 const front=new THREE.Vector3(c.x,y,c.z+R[0]),back=new THREE.Vector3(c.x,y,c.z-R[N/2]);
 // the lamp: a dark housing on the band, tipped down, a chrome bezel, the lens, and a yellow switch on top
 const lamp=new THREE.Group();lamp.name='Headlamp lamp';lamp.position.copy(front);lamp.rotation.x=H.tilt;g.add(lamp);
 const body=mat(H.colour,{roughness:.5}),chrome=mat(0xc9ccce,{metalness:.8,roughness:.25});
 add(lamp,new THREE.BoxGeometry(.05,.036,.026),body,0,0,.013);
 add(lamp,new THREE.CylinderGeometry(.0165,.0165,.008,20).rotateX(Math.PI/2),chrome,0,0,.029);
 const lensMat=new THREE.MeshStandardMaterial({color:0xfff6dc,emissive:0x000000,emissiveIntensity:0,roughness:.2});
 const lens=add(lamp,new THREE.CylinderGeometry(.0135,.0135,.002,20).rotateX(Math.PI/2),lensMat,0,0,.0335);lens.castShadow=false;lens.name='Headlamp lens';
 add(lamp,new THREE.BoxGeometry(.012,.006,.01),mat(H.stripe,{roughness:.45}),.012,.021,.012);
 const box=add(g,new THREE.BoxGeometry(.05,.032,.018),body,back.x,back.y,back.z-.009);box.name='Headlamp battery box';
 const S=H.light,light=new THREE.SpotLight(S.colour,0,S.distance,S.angle,S.penumbra,S.decay);light.name='Headlamp light';light.castShadow=false;
 light.position.set(0,0,.036);light.target.position.set(0,0,1);light.add(light.target);lamp.add(light);
 let on=false;
 g.userData.headlamp={
  get on(){return on;},light,
  setOn(v){on=!!v;lensMat.emissive.setHex(on?0xffe2b0:0);lensMat.emissiveIntensity=on?2.6:0;light.intensity=on?S.intensity:0;},
  /** Where the light comes from and where it points, in the world: what a capture's "torch" stands in for. */
  aim(distance=1){lamp.updateWorldMatrix(true,false);const from=new THREE.Vector3(0,0,.036).applyMatrix4(lamp.matrixWorld),to=new THREE.Vector3(0,0,.036+distance).applyMatrix4(lamp.matrixWorld);
   return {from:from.toArray(),at:to.toArray(),angle_deg:S.angle*180/Math.PI,colour:'#'+new THREE.Color(S.colour).getHexString(),intensity:S.intensity,distance:S.distance,penumbra:S.penumbra};},
 };
 return g;
}

/**
 * Low-voltage rubber gloves over the mittens: a palm a size bigger than the mitten's, the thumb's, and a gauntlet pulled up
 * over the cuff of the sleeve, wide enough for whatever the forearm wears there, with a rolled rim. One per hand, carried by
 * the hand bone, so a gloved hand does whatever the mitten does.
 */
export const GLOVES=Object.freeze({colour:0xd8913a,rim:0xb5732a,over:1.12,cuff:.075,clear:.004});
export function buildGlove(avatar,side){
 const m=avatar.measure,G=GLOVES,sx=side==='L'?1:-1,h=m.hand,g=new THREE.Group();g.name='Rubber glove '+side;
 const rubber=mat(G.colour,{roughness:.55}),rim=mat(G.rim,{roughness:.55});
 const ball=(r,at,scale,name)=>{const o=add(g,new THREE.SphereGeometry(r,16,12),rubber,...at);o.scale.set(...scale);o.name=name;return o;};
 ball(h*G.over,[0,-h*.55,0],[.9,1.15,.78],'Rubber glove palm');
 ball(h*.42*G.over*1.04,[-sx*h*.55,-h*.35,h*.42],[1,1.2,1],'Rubber glove thumb');
 // the gauntlet: over the forearm (the arm is armR*0.86 at the wrist, build.js) and the sleeve's end, with room to spare
 const rad=m.armR+G.clear;
 const cuff=add(g,new THREE.CylinderGeometry(rad*1.12,rad,G.cuff+h*.25,20,1,true),rubber,0,G.cuff/2-h*.125,0);cuff.name='Rubber glove gauntlet';cuff.material=mat(G.colour,{roughness:.55,side:THREE.DoubleSide});
 const roll=add(g,new THREE.TorusGeometry(rad*1.12,.0045,6,24).rotateX(Math.PI/2),rim,0,G.cuff,0);roll.name='Rubber glove rim';
 return g;
}

/**
 * A two-pole voltage tester: the main handle (yellow, like the film's tester) with a window of lamps for the voltage and a
 * steel probe, and a second yellow probe handle on a lead. Built upright like the film's held props (props3d.ts): the probe
 * tips up (+y), the window on its -z face (towards whoever holds it up to read it), its origin at the grip. In a mitten
 * (storyProps give) it is turned so the probe points ahead, out of the fist, the window up. setReading(volts) lights the
 * lamps up to that voltage (0: dead, all dark). The second probe is parked on the handle until testerSplit puts it in the
 * other mitten; the lead follows both, every frame.
 */
export const TESTER=Object.freeze({colour:0xe8c23a,scale:Object.freeze([12,24,50,100,200,400]),length:.17,radius:.015,lead:.6,
 why:'A row of lamps, not a needle: in a dark board at arm’s length it reads at a glance, and no lamp is no voltage.'});
export function buildTester(){
 const T=TESTER,g=new THREE.Group();g.name='Voltage tester';
 const yellow=mat(T.colour,{roughness:.45}),black=mat(0x26282a,{roughness:.5}),steel=mat(0xb9c0c4,{metalness:.8,roughness:.3});
 const cyl=(parent,r0,r1,h,y,m)=>add(parent,new THREE.CylinderGeometry(r0,r1,h,16),m,0,y,0);
 // gripped near its tail (the fist is about a tenth of a metre across), so the window and the probe stand out ahead of the fist
 cyl(g,T.radius*1.05,T.radius,T.length,T.length/2-.05,yellow);              // the handle
 cyl(g,T.radius*1.35,T.radius*1.35,.008,T.length-.045,black);               // the finger guard
 cyl(g,T.radius*.3,T.radius*.55,.02,T.length-.03,black);
 cyl(g,.0022,.0022,.03,T.length-.005,steel);                                // the probe tip
 // the window and its lamps, ahead of the fist, the lowest voltage nearest the hand
 add(g,new THREE.BoxGeometry(.018,.07,.004),black,0,.072,-T.radius*.92).castShadow=false;
 const lamps=T.scale.map((v,i)=>{const lm=new THREE.MeshStandardMaterial({color:0x5a2a20,emissive:0x000000,emissiveIntensity:0,roughness:.3});
  const o=add(g,new THREE.SphereGeometry(.0042,10,8),lm,0,.046+i*.0105,-T.radius*.92-.003);o.castShadow=false;o.name='Voltage tester lamp '+v;return lm;});
 // the second probe: a shorter handle, guard and tip, parked alongside the main one
 const second=new THREE.Group();second.name='Voltage tester second probe';
 cyl(second,T.radius*.9,T.radius*.85,.13,.015,yellow);cyl(second,T.radius*1.2,T.radius*1.2,.007,.083,black);cyl(second,.0022,.0022,.03,.1,steel);
 const parked=new THREE.Vector3(T.radius*2.1,.01,0);second.position.copy(parked);g.add(second);
 // the lead: from the main handle's tail to the second's, sagging a little, rebuilt as the two move
 const tailA=new THREE.Vector3(0,-.05,0),tailB=new THREE.Vector3(0,-.05,0),leadMat=mat(0x2b2d30,{roughness:.6});
 const lead=new THREE.Mesh(new THREE.BufferGeometry(),leadMat);lead.name='Voltage tester lead';lead.castShadow=false;lead.frustumCulled=false;g.add(lead);
 const _a=new THREE.Vector3(),_b=new THREE.Vector3(),down=new THREE.Vector3(),tail=new THREE.Vector3(),inv=new THREE.Matrix4();
 const update=()=>{g.updateWorldMatrix(true,false);second.updateWorldMatrix(true,false);inv.copy(g.matrixWorld).invert();
  _a.copy(tailA);_b.copy(tailB).applyMatrix4(second.matrixWorld).applyMatrix4(inv);
  const span=_a.distanceTo(_b),sag=Math.max(.03,(T.lead-span)*.45);
  down.set(0,-1,0).transformDirection(inv);tail.set(0,-1,0).transformDirection(second.matrixWorld).transformDirection(inv);
  const pts=[_a.clone(),_a.clone().add(new THREE.Vector3(0,-.03,0)),_a.clone().lerp(_b,.5).addScaledVector(down,sag),_b.clone().addScaledVector(tail,.03),_b.clone()];
  lead.geometry.dispose();lead.geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts,false,'centripetal'),24,.0028,5,false);};
 lead.onBeforeRender=update;update();
 let reading=0;
 g.userData.tester={second,parked,update,
  get reading(){return reading;},
  /** The lamps lit up to `volts` (0: dead). */
  setReading(volts){reading=Math.max(0,+volts||0);T.scale.forEach((v,i)=>{const lit=reading>=v;lamps[i].emissive.setHex(lit?(v>=50?0xff3a1f:0x5aff4a):0);lamps[i].emissiveIntensity=lit?2.2:0;});},
 };
 g.userData.hold='facing';
 return g;
}

/** Where a mitten closes on a handle held pointing ahead (+z): the middle of the mitten, in the hand bone's frame. */
const fistSpot=avatar=>new THREE.Vector3(0,-avatar.measure.hand*.55,0);

/** The story's props on one body: given, taken, and where each is. */
export function storyProps(avatar){
 if(avatar.storyProps)return avatar.storyProps;
 const held=new Map();
 const api={
  has:kind=>held.has(kind),
  get:kind=>held.get(kind)||null,
  /** Puts a prop on the body (where it lives when not in use) and returns it. */
  give(kind,options={}){
   if(held.has(kind))return held.get(kind);
   let o=null;
   if(kind==='torch'){o=buildPocketTorch();const p=pocketSpot(avatar);o.position.copy(p.position);o.quaternion.copy(p.quaternion);avatar.bones.chest.add(o);o.userData.at='pocket';}
   else if(kind==='basketOnHead'){o=buildBasket();const f=fitBasket(avatar);o.position.copy(f.position);o.quaternion.copy(f.quaternion);avatar.bones.head.add(o);o.userData.fit=f;}
   else if(kind==='newspaper'){o=buildPaper();o.visible=false;avatar.root.add(o);}
   else if(kind==='dryerCord'){o=buildCordWrap(avatar,options);avatar.bones.chest.add(o);}
   else if(kind==='paperback'){o=buildPaperback();avatar.bones.handR.add(o);o.userData.at='R';}
   else if(kind==='safetyGlasses'){o=buildSafetyGlasses(avatar);avatar.bones.head.add(o);}
   else if(kind==='headlamp'){o=buildHeadlamp(avatar);avatar.bones.head.add(o);o.userData.headlamp.setOn(options.on!==false);}
   else if(kind==='gloves'){o=new THREE.Group();o.name='Rubber gloves';o.userData.parts=['L','R'].map(s=>{const gl=buildGlove(avatar,s);avatar.bones['hand'+s].add(gl);return gl;});avatar.root.add(o);}
   else if(kind==='voltageTester'){o=buildTester();o.position.copy(fistSpot(avatar));o.rotation.x=Math.PI/2;avatar.bones.handR.add(o);o.userData.at='R';o.userData.tester.setReading(options.reading||0);}
   else if(kind==='pumpkinSuit'||kind==='ghostSheet'||kind==='witchHat'||kind==='catEars'){o=new THREE.Group();o.name=kind;const c=buildCostume(avatar,kind);
    for(const [bone,part] of c.parts){avatar.bones[bone].add(part);}o.userData.parts=c.parts;avatar.root.add(o);}
   else throw new Error('No story prop "'+kind+'" (story-props.js STORY_PROPS)');
   o.userData.storyProp=kind;held.set(kind,o);return o;
  },
  take(kind){const o=held.get(kind);if(!o)return;if(kind==='voltageTester')api.testerSplit(false);
   // parts are objects (the gloves) or [bone, part] pairs (the costumes): both come off and are freed
   const parts=(o.userData.parts||[]).map(p=>Array.isArray(p)?p[1]:p);
   for(const p of [o,...parts]){p.removeFromParent();p.traverse(x=>{if(x.isMesh){x.geometry.dispose();}if(x.isLight)x.dispose?.();});}held.delete(kind);},
  /** A kit (WORK_KIT) given at once: Tetsuo's work kit for an open board, the headlamp lit. Returns the props. */
  giveKit(name,options={}){const K=WORK_KIT[name];if(!K)throw new Error('No kit "'+name+'" (story-props.js WORK_KIT)');return K.props.map(k=>api.give(k,options[k]||{}));},
  /** The tester's second probe to the left mitten (true: both probes out, to test) or parked back on the handle (false). */
  testerSplit(split){const o=held.get('voltageTester');if(!o)return;const T=o.userData.tester,s=T.second;
   if(split){if(s.parent!==o)return;avatar.bones.handL.add(s);s.position.copy(fistSpot(avatar));s.rotation.set(Math.PI/2,0,0);}
   else{if(s.parent===o)return;o.add(s);s.position.copy(T.parked);s.quaternion.identity();}
   T.update();},
  /** The torch to the hand ('R') or back on the pocket; on or off. */
  torchTo(where){const o=held.get('torch');if(!o||o.userData.at===where)return;
   if(where==='pocket'){const p=pocketSpot(avatar);avatar.bones.chest.add(o);o.position.copy(p.position);o.quaternion.copy(p.quaternion);}
   else avatar.bones['hand'+where].attach(o);   // taken as it is: the hand closes on it where it lies
   o.userData.at=where;},
  dispose(){for(const kind of [...held.keys()])api.take(kind);},
 };
 avatar.storyProps=api;
 const dispose=avatar.dispose;avatar.dispose=(...a)=>{api.dispose();return dispose.apply(avatar,a);};
 return api;
}
