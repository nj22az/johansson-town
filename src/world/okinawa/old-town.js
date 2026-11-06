import * as THREE from '../../../vendor/three.module.js';
import {paint,trs} from './kit.js';
import {GROUND_LAYER} from '../ground-layers.js';
import {fascia,iceMural,enamel,catchFlag,poster,vertical,clothBanner} from './signs.js';
import {potPlant,OKINAWA_COLOURS as C} from './houses.js';
import {buoys,bicycle} from './props.js';
import {VENDING_MACHINE} from '../vending.js';
import {sakuraOpenAt as rotaOpenAt,SAKURA_HOURS_TEXT,SAKURA_DAYS_TEXT} from '../../commerce/sakura-rota.js';

/**
 * The buildings that were here before the quarters went up, brought up to the street
 * they now stand in. Nothing here moves a wall, a door or a room: each one is dressed
 * from outside, against the footprints the town already keeps, so the interiors and
 * everything that walks in and out of them are exactly as they were.
 *
 *   Sakura      the office over the shop (its windows, fire door and fire escape on the back),
 *               the service apron behind it, a Blue Coral mural on the side wall (now served at Nakamura's counter
 *               beside Harbour Park) and enamel tins on the other.
 *   Warehouse   its name painted big on the street wall, floats hung on its wall over the ferry's apron.
 *   Office      big-catch flags on a pole by the door, a life ring and the tide board.
 *   Bookshop    a cart of cheap paperbacks out on the pavement.
 */
export function dressOldTown(kit,solid,{inspect,anchor,onAction,vending,group}){
 dressSakura(kit,solid,{inspect});
 const shutter=sakuraShopfront(kit,solid,{inspect,anchor,onAction,vending,group});
 dressWarehouse(kit,solid,{inspect});
 dressOffice(kit,solid,{inspect});
 dressBookshop(kit,solid,{inspect});
 return {shutter};
}

/** Sakura's hours are the rota's (commerce/sakura-rota.js): 9:00–20:30, Sunday to Friday, the shutter down in between. */
export const sakuraOpenAt=rotaOpenAt;
/** Where you stand to buy a bouquet: in front of the flower buckets beyond the fruit trestle (sakuraShopfront), the town's flower stand since phase 4. */
export const SAKURA_FLOWER_STAND=Object.freeze([-7.45+.95,-27.3+1.6+1.2+1.35]);

/** The roller shutter's face: galvanised slats and the shop's hours painted across it. */
function shutterTexture(){
 return paint(1024,256,(ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#b9bfc2');g.addColorStop(1,'#9ea5a8');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=9){ctx.fillStyle='rgba(60,66,70,.35)';ctx.fillRect(0,y,w,2);ctx.fillStyle='rgba(255,255,255,.25)';ctx.fillRect(0,y+2,w,1);}
  ctx.fillStyle='#a6333c';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 64px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';ctx.fillText("Sakura Shop",w/2,h*.46);
  ctx.font='bold 22px sans-serif';ctx.fillText("SAKURA · OPEN "+SAKURA_HOURS_TEXT+" · 土曜定休",w/2,h*.72);
  ctx.fillStyle='rgba(110,70,40,.25)';for(const x of [60,w-80])ctx.fillRect(x,h*.2,3,h*.7);
 });
}

/**
 * Sakura's shopfront, after Sakura Crossing's 青空商店 (shop.js): the red-and-white
 * awning built as geometry stripes so the banding stays crisp under the cel pass, the
 * roller shutter that rolls into its drum when the shop opens and comes down at eight,
 * the two vending machines, the drink crates, a trestle of fruit, the bin, the flags,
 * and the wall services -- meter, pipes, the camera and its warning plate.
 *
 * The frontage runs along z at x = -7.45; the pavement is the metre in front of it.
 * The door is at the middle (z -27.3) and everything stands clear of it.
 */
function sakuraShopfront(kit,solid,{inspect,anchor,onAction,vending,group}){
 const S=SAKURA_BOX,front=S.maxX,door=-27.3,doorClear=1.6;
 // The awning: sloping canvas in alternating stripes, on its brackets.
 const zA=S.minZ+2.8,zB=S.maxZ-.25,out=1.15,top=2.8,drop=.38,stripes=18,sw=(zB-zA)/stripes,slope=Math.atan2(drop,out);
 for(let i=0;i<stripes;i++)kit.box(out,.06,sw,front+out/2+.28,top-drop/2,zA+sw*(i+.5),i%2?0xf4f0e6:0xc8392e,{rz:-slope});
 kit.box(.06,.26,zB-zA,front+out+.28,top-drop-.1,(zA+zB)/2,0xc8392e);
 for(let i=0;i<stripes;i+=2)kit.box(.05,.2,sw*.9,front+out+.3,top-drop-.11,zA+sw*(i+.5),0xf4f0e6);
 for(const z of [zA+.2,(zA+zB)/2,zB-.2])kit.rod([front+.3,top-.2,z],[front+out+.2,top-drop,z],.02,0x6d7478);
 // The shutter drum under the sign band, and its guides down each end of the glass.
 kit.box(.24,.24,S.maxZ-S.minZ-.5,front+.135,2.72,(S.minZ+S.maxZ)/2,0x8e9699,{finish:'metal'});
 for(const z of [S.minZ+.3,S.maxZ-.3])kit.box(.08,2.6,.1,front+.055,1.3,z,0x7b8285,{finish:'metal'});
 const SH=2.55,width=S.maxZ-S.minZ-.6,tex=shutterTexture();
 const shutterMat=new THREE.MeshStandardMaterial({map:tex,roughness:.55,metalness:.3});
 const curtain=new THREE.Mesh(new THREE.PlaneGeometry(width,SH),shutterMat);
 curtain.rotation.y=Math.PI/2;curtain.position.set(front+.18,SH/2+.05,(S.minZ+S.maxZ)/2);
 curtain.name='Sakura roller shutter';curtain.userData.dynamicProp=true;curtain.receiveShadow=true;group.add(curtain);
 const rail=new THREE.Mesh(new THREE.BoxGeometry(.08,.08,width),new THREE.MeshStandardMaterial({color:0x6d7478,roughness:.5,metalness:.4}));
 rail.userData.dynamicProp=true;group.add(rail);
 let open=1;
 const setShutter=o=>{
  open=o;const shown=Math.max(.02,1-o);
  curtain.scale.y=shown;curtain.position.y=.05+SH-SH*shown/2;
  tex.repeat.set(1,shown);tex.offset.set(0,0);
  rail.position.set(front+.2,.05+SH-SH*shown,(S.minZ+S.maxZ)/2);
  curtain.visible=shown>.03;
 };
 setShutter(1);
 // The vending pair at the south end of the frontage, with a bin between them and the door.
 // One machine, not a bank: vending is kept to a few places worth stopping at (Sakura,
 // the onsen lane, the fish quay) rather than every frontage (docs/AMPLIFY-AUDIT.md).
 vending(SAKURA_VENDING.x,SAKURA_VENDING.z,SAKURA_VENDING.ry,SAKURA_VENDING.y);
 // The can recycling box (空きかん): a blue box with a round hole in the lid. Bring your
 // empties back here and Thuan gives a little for each from the till.
 {const bx=front+.4,bz=door-doorClear-.5;
  kit.box(.44,.72,.5,bx,.36,bz,0x2f6fa8);kit.box(.48,.05,.54,bx,.745,bz,0x24558a);kit.cyl(.08,.08,.012,bx,.776,bz,0x1b1d20,{segments:16});
  if(typeof document!=='undefined'&&document.createElement){const c=document.createElement('canvas');c.width=256;c.height=320;const ctx=c.getContext('2d');
   if(ctx){ctx.fillStyle='#f4f6f2';ctx.fillRect(0,0,256,320);ctx.fillStyle='#2f6fa8';ctx.fillRect(0,0,256,70);ctx.fillStyle='#ffffff';ctx.font='bold 46px "Hiragino Sans","Noto Sans CJK JP",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('空きかん',128,38);
    ctx.fillStyle='#24303a';ctx.font='bold 44px sans-serif';ctx.fillText('CANS',128,118);ctx.font='26px sans-serif';ctx.fillText('Empty cans here',128,168);ctx.fillText('¥10 back at the till',128,204);
    ctx.strokeStyle='#2f6fa8';ctx.lineWidth=10;ctx.beginPath();ctx.arc(128,262,34,0,7);ctx.stroke();for(let k=0;k<3;k++){const a=k*Math.PI*2/3-Math.PI/2;ctx.beginPath();ctx.moveTo(128+Math.cos(a)*34,262+Math.sin(a)*34);ctx.lineTo(128+Math.cos(a+.6)*24,262+Math.sin(a+.6)*24);ctx.stroke();}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;kit.sign(t,.34,.42,bx+.225,.38,bz,{ry:Math.PI/2,name:'Can recycling label'});}}
  solid({id:'sakura-bin',x:bx,z:bz,w:.5,d:.56,height:.8});
  anchor(bx+.6,1,bz,'Return empty cans',()=>onAction?.('recycle-cans'));}
 // Drink crates stacked the way empties are, against the glass beyond the vending machines.
 {const C=SAKURA_CRATES,[cw,ch,cd]=C.crate,[lw,lh,ld]=C.lid;
 C.at.forEach(([dx,ly,dz],i)=>{kit.box(cw,ch,cd,C.x+dx,ch/2+ly*ch,C.z+dz,i%2?0x2f6fb8:0xc8392e);kit.box(lw,lh,ld,C.x+dx,ch+ly*ch,C.z+dz,0x2f3140);});}
 solid({id:'sakura-crates',x:front+.3,z:S.minZ+3.95,w:.55,d:1.7,height:.9});
 // A trestle of fruit and island vegetables either side of the door's north.
 const tz=door+doorClear+1.2;
 kit.box(.55,.05,1.6,front+.36,.72,tz,0xb89a6a);for(const dz of [-.7,.7])for(const dx of [-.2,.2])kit.box(.04,.7,.04,front+.36+dx,.35,tz+dz,0x5d6468);
 const fruit=[[0xf0a63c,'mango'],[0x8fbf4a,'goya'],[0xe0574a,'dragon fruit'],[0xe8c84a,'shiquasa']];
 fruit.forEach(([colour],i)=>{const z=tz-.6+i*.4;kit.cyl(.17,.13,.12,front+.36,.8,z,0xb48a4a,{segments:10});for(let k=0;k<3;k++)kit.sphere(.06,front+.32+(k%2)*.08,.9,z-.06+k*.06,colour,{detail:0});});
 solid({id:'sakura-trestle',x:front+.36,z:tz,w:.6,d:1.7,height:.8});
 // The flower buckets beyond the trestle: Sakura took over the town's flowers and decorations when Mrs Kinjō retired
 // (docs/CAST-CONSOLIDATION.md addendum 3; commerce/merchandising.js), so the bouquets are sold at Thuan's door now, in
 // the shop's own hours. The buckets are the florist's own, and the stems are cut the way she taught Thuan.
 let clock=720;
 for(const [j,[z,tone]] of [[tz+1.15,0xe9c969],[tz+1.55,0xcb748f]].entries()){
  kit.cyl(.2,.16,.42,front+.34,.21,z,0x667a6d,{segments:9});solid({id:'sakura-flowers',x:front+.34,z,w:.42,d:.42,height:.9});
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5,sx=front+.34+Math.cos(a)*.1,sz=z+Math.sin(a)*.1;kit.cyl(.012,.012,.5,sx,.6,sz,0x547545,{segments:5});kit.sphere(.08-(i%2)*.012,sx,.88+(i%2)*.06+j*.03,sz,tone,{detail:0,sy:j?.88:1});}
 }
 kit.sign(enamel({jp:"Flowers",en:'BOUQUETS ¥250',bg:'#efe7ce',ink:'#376a51'}),.34,.26,front+.02,1.15,tz+1.35,{ry:Math.PI/2,depth:.01,name:'flower bucket sign'});
 anchor(front+.95,1,tz+1.35,'Buy a bouquet · ¥250',()=>sakuraOpenAt(clock)
  ?onAction?.('buy','Rainflower bouquet',{cost:250,item:'Rainflower bouquet',text:'Island-grown stems from the buckets by Sakura’s door, wrapped in brown paper at the till. Thuan cuts them the way Mrs Kinjō taught her. A little colour for a home, a dinner table or someone you care about.'})
  :onAction?.('read','Sakura is closed','The bouquets are sold in the shop’s hours, '+SAKURA_HOURS_TEXT+', '+SAKURA_DAYS_TEXT+'. The buckets stay out by the door.'));
 // At the two corners of the frontage, so they mark the shop without standing in front
 // of its window.
 // One flag: Blue Coral is served at Nakamura's counter beside Harbour Park.
 for(const [z,jp,bg] of [[S.minZ+.45,"Cold drinks",'#c8392e']]){
  kit.cyl(.025,.025,2.8,front+.95,1.4,z,0x9aa0a4,{segments:6});kit.rod([front+.95,2.72,z],[front+.95,2.72,z+.5],.012,0x9aa0a4);
  kit.sign(vertical({jp,bg}),.46,1.9,front+.95,1.75,z+.26,{ry:Math.PI/2,depth:.01,both:true,name:'nobori'});
  solid({id:'nobori',x:front+.95,z,w:.1,d:.1,height:2.8});
 }
 // Services on the wall ends: the meter, pipes to the drum, the camera and its plate.
 kit.box(.14,.5,.36,front+.07,1.75,S.maxZ-.2,0xd8d4ca);kit.box(.02,.2,.2,front+.15,1.8,S.maxZ-.2,0x2c3a33);
 // the downpipes at the corners (the south one tucked into its corner, leaving the pier for the drinks machine's socket)
 for(const z of [S.minZ+.07,S.maxZ-.12]){kit.cyl(.045,.045,2.7,front+.06,1.35,z,0x9aa0a4,{segments:8});for(let y=.6;y<2.6;y+=1.1)kit.box(.1,.06,.1,front+.08,y,z,0x6d7478);}
 kit.box(.18,.14,.26,front+.12,2.53,S.maxZ-.5,0xe8e6e0);kit.box(.1,.08,.08,front+.24,2.5,S.maxZ-.5,0x2b2b2b);
 kit.sign(enamel({jp:"Security camera",en:'CCTV in operation',bg:'#f4d23c',ink:'#1f1f1f'}),.28,.42,front+.02,2.05,S.maxZ-.55,{ry:Math.PI/2,depth:.01,name:'camera plate'});
 // Bicycles park behind the shop on the service strip's south end, side-on to the back wall and nose to the lane,
 // leaving the vending face, the pavement, the back door and the van's bay clear (SAKURA_BIKES).
 for(const b of SAKURA_BIKES)solid(bicycle(kit,b.x,b.z,{ry:-Math.PI/2,...b}));
 kit.box(.95,.62,.32,-12.4,1.4,S.minZ-.2,0xe2e0d8);kit.cyl(.2,.2,.04,-12.2,1.4,S.minZ-.37,0x3a3f42,{rx:Math.PI/2,segments:12});
 for(let y=1.2;y<1.6;y+=.1)kit.box(.5,.02,.02,-12.6,y,S.minZ-.37,0x7b8285);
 kit.box(.3,.004,.4,front+2.2,.012,-24.6,0xf4f1ea,{ry:.7});kit.box(.3,.004,.4,front+3.1,.012,-23.9,0xe8e2d0,{ry:-1.1});
 return {
  set:setShutter,
  get open(){return open;},
  /** Follows the rota: up at nine, down at half past eight, taking a few seconds to move. */
  update(minutes,dt=1/60,{snap=false}={}){clock=minutes;const want=sakuraOpenAt(minutes)?1:0;if(snap){setShutter(want);return;}const step=dt/2.5;if(open!==want)setShutter(Math.abs(want-open)<=step?want:open+Math.sign(want-open)*step);},
 };
}

/**
 * The two bicycles behind Sakura, on the paved strip at the south end of the back wall (SAKURA_BACK.strip), clear of the
 * wall by a hand and of the meters over them: the shop's own, and Nhung's.
 */
export const SAKURA_BIKES=Object.freeze([
 Object.freeze({id:'sakura-shop-bicycle',x:-19.13,z:-23.15,colour:0x3a7a5a,frame:'step',basket:true,owner:'Sakura (Thuan)',
  why:'The shop’s own bicycle, with the big basket: the run to the Quay Warehouse depot for a forgotten case, and the bags for the old customers on Nishi-machi who cannot carry them home.'}),
 Object.freeze({id:'nhung-bicycle',x:-19.13,z:-21.15,colour:0xd9d2c0,frame:'step',basket:true,owner:'Nhung',
  why:'Nhung rides in from 3 Kitahama to keep the shop on Sunday and leaves it at the back, out of the customers’ way.'}),
]);

/** Sakura's footprint and the height of its roof slab, as the storefront builds them. */
export const SAKURA_BOX=Object.freeze({minX:-18.45,maxX:-7.45,minZ:-34.43,maxZ:-20.17,roof:4.01});
/**
 * The drink crates stacked against the glass beyond the vending machines, the way empties are: [dx, layer, dz] from the
 * foot of the first stack (x, z). A crate is 0.46 × 0.28 × 0.50 m and its lid 0.40 × 0.04 × 0.44 m, centred on its top
 * (half sunk into it). Three stacks: three high, two high, one high. The Halloween walk's things stand on their lids
 * (halloween.js): crateTops() says where each stack's top is.
 */
export const SAKURA_CRATES=Object.freeze({x:SAKURA_BOX.maxX+.3,z:SAKURA_BOX.minZ+3.4,crate:Object.freeze([.46,.28,.5]),lid:Object.freeze([.4,.04,.44]),
 at:Object.freeze([[0,0,0],[0,1,0],[0,2,0],[0,0,.56],[0,1,.56],[.02,0,1.1]].map(a=>Object.freeze(a)))});
/** Each stack's top lid, tallest first: its centre (x, z), the height of its top face and its size (w along x, d along z). */
export function crateTops(C=SAKURA_CRATES){
 const stacks=new Map();
 for(const [dx,ly,dz] of C.at){const key=dx+','+dz;stacks.set(key,Math.max(stacks.get(key)??-1,ly));}
 return [...stacks].map(([key,ly])=>{const [dx,dz]=key.split(',').map(Number);
  return Object.freeze({x:C.x+dx,z:C.z+dz,top:Math.round((C.crate[1]*(ly+1)+C.lid[1]/2)*1e6)/1e6,w:C.lid[0],d:C.lid[2],layers:ly+1});}).sort((a,b)=>b.top-a.top);
}
/** How far the storefront's side walls stand outside SAKURA_BOX (storefront.js: an 18 cm wall outside the plan line). */
export const SAKURA_SIDE_WALL=.18;
/**
 * What is on Sakura's two blank side walls, by who put it there and why: the owner, 20 October 2026, "the walls should
 * have ad banners". As on a 1990s Okinawan shop's side wall: enamel tins (ホーロー看板) the makers' salesmen nailed up
 * for the shops that stocked them, a sign-writer's painted mural, and the shop's own cotton banner, three generations
 * on one wall. Every brand is the town's own (Sakura's products, data/studio/products.json; signs.js WALL_ADS), none
 * real. `x` along the wall (the frontage is at x -7.45), `y` the middle's height, the south wall facing up Main Street
 * and the crossing, the north wall facing the quay.
 */
export const SAKURA_WALL_ADS=Object.freeze([
 {name:'Blue Coral mural',kind:'mural',wall:'south',x:-13.55,y:2.05,w:7.4,h:2.15,depth:.01,edge:0xe9e2cf,
  who:'Blue Coral Ice Cream (Rainflower Lane)',why:'Painted in 1981 when Blue Coral was new and Sakura sold its cones from the chest freezer; the town’s only ice-cream shop still pays Thuan a little for the wall, and its ice cream is served at Nakamura’s now.'},
 {name:'Enamel sign: Hinode Curry',kind:'enamel',wall:'south',x:-8.0,y:1.55,w:.45,h:.9,depth:.012,paint:{jp:'Hinode Curry',en:'Hinode curry',bg:'#f2c23a',ink:'#b8302a'},
  who:'Hinode, the curry roux maker',why:'Sakura has sold Hinode’s curry roux since the sixties; the maker’s salesman nailed the tin up the year the shop first stocked it, at eye height by the corner where the crossing sees it.'},
 {name:'Enamel sign: Kamejirushi Soy Sauce',kind:'enamel',wall:'south',x:-8.6,y:1.68,w:.45,h:.9,depth:.012,paint:{jp:'Kamejirushi Soy Sauce',en:'Kamejirushi soy sauce',bg:'#f1e6c8',ink:'#7a2a22'},
  who:'Kamejirushi, the soy sauce brewer',why:'The turtle brand’s soy sauce is on Sakura’s shelf by the litre bottle; its tin went up beside the curry’s, a little higher, because the salesman said so.'},
 {name:'Enamel sign: Hoshimaru Batteries',kind:'enamel',wall:'south',x:-9.3,y:1.5,w:.45,h:.9,depth:.012,paint:{jp:'Hoshimaru Batteries',en:'Hoshimaru batteries',bg:'#1f4e8a',ink:'#f4e6b0'},
  who:'Hoshimaru, the dry-battery maker',why:'Every torch on the island runs on Hoshimaru’s AA from Sakura’s counter, and typhoon season sells them by the box; the newest of the three tins, from 1979.'},
 {name:'Sakura delivery banner',kind:'banner',wall:'south',x:-8.65,y:3.0,w:2.0,h:.5,depth:.006,edge:0xe8e1cf,paint:{jp:'We deliver',sub:'Sakura Shop · Telephone 2-1103',bg:'#f6f1e3',ink:'#b8302a',band:'#2f6f5a'},
  who:'Sakura (Thuan)',why:'Sakura’s own notice: the shop delivers to the old customers who cannot carry their shopping home (the shop’s bicycle behind it, SAKURA_BIKES), and the banner says so to everybody waiting at the crossing.'},
 {name:'Enamel sign: Ryukyu Cider',kind:'enamel',wall:'north',x:-9.45,y:1.7,w:.6,h:.9,depth:.012,paint:{jp:'Ryukyu Cider',en:'Ryukyu cider',bg:'#f1e6c8',ink:'#b8302a'},
  who:'Ryukyu Cider’s bottler',why:'Sakura’s cooler sold the cider by the bottle before canned drinks; the tin faces the quay, where the boats’ crews come up thirsty.'},
 {name:'Enamel sign: Mosquito coil',kind:'enamel',wall:'north',x:-10.35,y:1.6,w:.5,h:.75,depth:.012,paint:{jp:'Mosquito coil',en:'mosquito coils',bg:'#2a6a4a',ink:'#f4e6b0'},
  who:'the mosquito-coil maker',why:'Sakura sells the coils by the tin every summer; the quay side is where the mosquitoes are.'},
].map(a=>Object.freeze(a)));

/**
 * Sakura's drinks machine, at the south end of the frontage, facing the street (+x). It stands in front of the roller
 * shutter, as a machine does, so the shutter comes down behind it at night: its back is 3 cm clear of the shutter's
 * bottom rail (the curtain hangs at the front +.18, its rail reaches the front +.24), with its cord in that gap.
 */
export const SAKURA_VENDING=Object.freeze({x:SAKURA_BOX.maxX+.24+.03+VENDING_MACHINE.size.depth/2,y:GROUND_LAYER.lane,   // on the Main Street footway (harbour.js), whose top is the lane layer
 z:SAKURA_BOX.minZ+1.7,ry:Math.PI/2,
 why:'In front of the shutter at the frontage’s south end, by the corner pier with its outdoor socket: open all night when the shop is shut, and seen from the quay road.'});

function dressSakura(kit,solid,{inspect}){
 const S=SAKURA_BOX;
 // The office's upper shell, its windows and its fire door are owned by thuan-flat.js; the office is reached by the
 // stair inside the shop (interiors/sakura-stairs.js), so the back carries a fire escape and no way in.
 sakuraFireEscape(kit,solid,{inspect});
 sakuraBackServices(kit,solid);
 sakuraServiceStrip(kit);
 // The meters on the back wall, between the extractor and the bicycles.
 const W=SAKURA_BACK.wall;
 kit.box(.2,.45,.35,W-.1,1.6,-22.8,0x8a8578);kit.box(.18,.35,.3,W-.09,1.6,-21.9,0x9a958a);
 // Side walls: the ice-cream mural, the enamel tins and the delivery banner facing up the street, two tins facing the
 // quay (SAKURA_WALL_ADS). Each is on the wall's face: the storefront's side walls stand .18 outside the plan line.
 for(const a of SAKURA_WALL_ADS){
  const face=a.wall==='south'?S.maxZ+SAKURA_SIDE_WALL+a.depth/2+.004:S.minZ-SAKURA_SIDE_WALL-a.depth/2-.004,ry=a.wall==='south'?0:Math.PI;
  const tex=a.kind==='mural'?iceMural():a.kind==='banner'?clothBanner(a.paint):enamel(a.paint);
  kit.sign(tex,a.w,a.h,a.x,a.y,face,{ry,depth:a.depth,edge:a.edge??0x6d6a62,name:a.name});
  // A banner is tied at its corners to hooks in the wall; a tin is nailed at its corners (painted on the tin).
  if(a.kind==='banner')for(const dx of [-1,1])for(const dy of [-1,1])kit.box(.03,.03,.03,a.x+dx*(a.w/2-.02),a.y+dy*(a.h/2-.02),face+(ry?-1:1)*.008,0x8a8f92,{finish:'metal'});
 }
 inspect(S.maxX-2.2,1.2,S.maxZ+1.2,'Look at the ice-cream mural','Blue Coral mural',
  'Painted straight onto the wall in 1981 and touched up every summer since by whoever has the paint. The pink scoop is guava. Thuan says the man who painted it still comes in for his cigarettes and complains that nobody has got the blue right. Blue Coral ice cream is served at Nakamura’s dessert counter beside Harbour Park.');
}

/**
 * Sakura's back, over the service apron towards Nishi-machi (the creator, 2026-10-19: "Remove the outdoor stairs to
 * Sakura's office, add windows on the back and a fire escape"). What stands here and why, in the town's coordinates;
 * the back wall faces -x. The office windows and the fire door itself are in thuan-flat.js, the shop's back door, its
 * downpipe, meter cupboard, extractor and the pallet of empties in storefront.js.
 */
export const SAKURA_BACK=Object.freeze({
 /** The shop storey's back wall face (storefront.js stands its wall .18 behind the plan line) and the office storey's (thuan-flat.js). */
 wall:SAKURA_BOX.minX-.18,upperWall:SAKURA_BOX.minX-.12,
 /** The shop's back (stockroom) door: storefront.js, .9 m along the frontage from the shop's middle (z -27.3). */
 backDoor:Object.freeze({z:-28.2,width:1.32,
  awning:Object.freeze({minZ:-29.05,maxZ:-27.35,out:.75,y:2.58,why:'A corrugated sheet over the back door, so deliveries and the empties go in and out dry in the rainy season.'})}),
 /**
  * The fire escape (避難はしご): a steel fire door at the head of the inside stair, a landing on two struts and a
  * caged ladder down the wall, in the dark green of site steel. A way out only: no walking level and no route use it,
  * and the landing and the ladder are solid to anyone below. It stands north of the back door, so whoever comes down
  * it lands clear of the door and of the pallet of empties.
  */
 fireEscape:Object.freeze({
  door:Object.freeze({z:-27.3,width:.9,height:2}),
  platform:Object.freeze({minX:SAKURA_BOX.minX-.97,maxX:SAKURA_BOX.minX-.12,minZ:-27.9,maxZ:-24.95-.4,top:SAKURA_BOX.roof+.03}),
  ladder:Object.freeze({z:-24.95,width:.5,rungX:SAKURA_BOX.minX-.4,cageX:SAKURA_BOX.minX-1.05,cageFrom:2.2,rung:.3,hoops:.7}),
  colour:0x3f6a55,
  why:'The office’s second way out, for the day smoke fills the inside stair: a two-storey shop with an office over it has to have one. The fire service climbs it at the spring inspection; nobody comes in this way.'}),
 /** The shop's refrigeration, outside: two condensing units on a plinth, in a mesh cage with a padlocked gate. */
 condensers:Object.freeze({minZ:-34,maxZ:-31.95,depth:.73,height:1.1,units:Object.freeze([-32.45,-33.45]),
  why:'The cold cases and the walk-in cooler throw their heat out here, at the quay end of the back, away from Thuan’s bench. Caged: copper pipe gets stolen, and children climb on anything warm.'}),
 /** The outside tap and its hose, between the cage and the empties. */
 tap:Object.freeze({z:-31.2,y:.55,why:'For hosing the apron, rinsing the empties and washing the dust off the condensers’ fins.'}),
 /**
  * The service apron: poured concrete from the circuit's paving to the wall, in bays, its top the lane layer so it
  * meets the paving round it flush (lane-surfaces.js: the circuit's edge at x -21.6 and z -34.93 / -34.65, the staff
  * path's at x -20 and z -24.3 and -20). It replaces the strip of lawn behind the shop: nothing grows where the vans
  * stand, bar the weeds along the wall foot and the joints.
  */
 strip:Object.freeze({top:GROUND_LAYER.lane,
  rects:Object.freeze([[-21.6,-19.7,-34.93,-24.3],[-19.7,-18.5,-34.65,-24.3],[-20,-18.5,-24.3,-20]]),
  joints:Object.freeze([-32.5,-30,-27.5,-24.3,-22.2]),
  weeds:Object.freeze([[-18.72,-34.25],[-18.71,-31.75],[-18.72,-26.25],[-21.5,-30.05],[-21.52,-27.45],[-19.9,-20.1],[-21.5,-33.6],[-18.72,-21.4]]),
  why:'Where the delivery van backs up and the empties stand: concrete, as behind every konbini, not lawn.'}),
});

/**
 * A painted plate: a band of colour with the Japanese large and the English under it, one line per '\n'. Each line's type
 * shrinks to fit inside the band: 避難はしご at full size was wider than its plate and was painted cut off at both ends.
 */
function plateTexture(w,h,{jp,en,bg,ink='#ffffff'}){
 return paint(w,h,(ctx,W,H)=>{
  ctx.fillStyle='#f4f2ea';ctx.fillRect(0,0,W,H);ctx.fillStyle=bg;ctx.fillRect(W*.04,H*.06,W*.92,H*.88);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
  const line=(text,size,family,y)=>{ctx.font='bold '+size+'px '+family;const over=ctx.measureText(text).width/(W*.84);
   if(over>1)ctx.font='bold '+Math.floor(size/over)+'px '+family;ctx.fillText(text,W/2,y);};
  const lines=en?en.split('\n'):[];
  line(jp,Math.round(H*(en?.36:.5)),'"Hiragino Sans","Noto Sans CJK JP",sans-serif',H*(lines.length>1?.32:en?.38:.5));
  lines.forEach((text,i)=>line(text,Math.round(H*.16),'sans-serif',H*(.74+(i-(lines.length-1)/2)*.17)));
 });
}

/** The fire escape off the office's fire door: SAKURA_BACK.fireEscape. */
function sakuraFireEscape(kit,solid,{inspect}){
 const E=SAKURA_BACK.fireEscape,P=E.platform,L=E.ladder,W=SAKURA_BACK.wall,U=SAKURA_BACK.upperWall,F=SAKURA_BOX.roof;
 const green=E.colour,plate=0x7d8781,top=F+1.1,bar=(x0,x1,y0,y1,z0,z1)=>kit.block(Math.min(x0,x1),Math.max(x0,x1),y0,y1,Math.min(z0,z1),Math.max(z0,z1),green);
 // The landing: chequer plate on an edge channel, carried by two struts back to the shop wall.
 kit.block(P.minX,P.maxX,P.top-.05,P.top,P.minZ,P.maxZ,plate,'metal');
 bar(P.minX,P.minX+.06,P.top-.17,P.top-.05,P.minZ,P.maxZ);
 for(const z of [P.minZ+.25,P.maxZ-.25])kit.rod([W-.03,F-.75,z],[P.minX+.05,P.top-.06,z],.035,green);
 // Its guard: the open side and the south end, a top rail, a knee rail and a toe board. The north end is the ladder's.
 for(const z of [P.minZ+.03,(P.minZ+P.maxZ)/2,P.maxZ-.03])bar(P.minX,P.minX+.05,P.top,top,z-.025,z+.025);
 bar(U-.05,U,P.top,top,P.minZ,P.minZ+.05);
 for(const [y0,y1] of [[top-.04,top],[F+.53,F+.57],[P.top,P.top+.1]]){bar(P.minX,P.minX+.05,y0,y1,P.minZ,P.maxZ);bar(P.minX,U,y0,y1,P.minZ,P.minZ+.05);}
 // The ladder: two stiles to grab-rail height over the landing, rungs every .3 m, stays back to the wall.
 const z0=L.z-L.width/2,z1=L.z+L.width/2;
 for(const z of [z0,z1])bar(L.rungX-.03,L.rungX+.03,0,top,z-.03,z+.03);
 for(let y=L.rung;y<=P.top+1e-6;y+=L.rung)kit.box(.03,.03,L.width,L.rungX,y,L.z,green);
 for(const y of [.9,2.4,F-.6,F+.7])for(const z of [z0,z1])bar(L.rungX+.03,y<F?W:U,y-.03,y+.03,z-.02,z+.02);
 // The cage, from above head height: hoops of flat bar, the south side left open over the landing, five straps.
 const c0=L.z-.4,c1=L.z+.4;
 for(let y=L.cageFrom;y<=top+1e-6;y+=L.hoops){const wall=y<F?W:U;
  bar(L.cageX,L.cageX+.03,y-.02,y+.02,c0,c1);bar(L.cageX,wall,y-.02,y+.02,c1-.03,c1);
  if(y<F)bar(L.cageX,wall,y-.02,y+.02,c0,c0+.03);}
 for(const z of [c0+.02,L.z,c1-.02])bar(L.cageX,L.cageX+.03,L.cageFrom,top,z-.015,z+.015);
 bar((L.cageX+W)/2-.015,(L.cageX+W)/2+.015,L.cageFrom,top,c1-.03,c1);bar((L.cageX+W)/2-.015,(L.cageX+W)/2+.015,L.cageFrom,F,c0,c0+.03);
 solid(kit.rect(L.cageX,W,c0,c1,top,'sakura-fire-escape-ladder'));
 solid({...kit.rect(P.minX,P.maxX,P.minZ,P.maxZ,1.25,'sakura-fire-escape-landing'),minY:F-.15});
 // Its plates: 非常口 over the fire door, 避難はしご and "keep clear" at the ladder's foot.
 if(typeof document!=='undefined'&&document.createElement){
  kit.sign(plateTexture(256,96,{jp:'非常口',en:'FIRE EXIT',bg:'#2f8a4e'}),.5,.19,U-.012,F+2.45,E.door.z,{ry:-Math.PI/2,depth:.02,name:'Fire door plate'});
  kit.sign(plateTexture(288,192,{jp:'避難はしご',en:'ESCAPE LADDER\nKEEP CLEAR',bg:'#2f8a4e'}),.45,.3,W-.012,1.55,c1+.3,{ry:-Math.PI/2,depth:.02,name:'Escape ladder plate'});
 }
 inspect(L.cageX-.7,1.2,L.z,'Look at the fire escape','Sakura fire escape',
  'The office upstairs has a second way out: a steel fire door at the head of the inside stair, a little landing and a caged ladder down the back wall. It is for a fire, not for coming and going. The door opens only from inside and rings a bell in the shop when it does. The fire service climbs it at the spring inspection, and Thuan holds the clipboard.');
}

/** What the back wall carries at ground level: the caged condensers, the tap and its hose, the awning over the back door. */
function sakuraBackServices(kit,solid){
 const B=SAKURA_BACK,W=B.wall,K=B.condensers,steel=0x9aa0a4;
 // The condensers: a plinth, two ivory units with their fan guards to the yard, the refrigerant lines in a duct cover.
 const out=W-K.depth,duct=K.maxZ-.16;
 // Each unit on its own concrete plinth block, standing on the service apron.
 for(const z of K.units)kit.block(W-.47,W-.07,0,.1,z-.475,z+.475,0xc9c5b8);
 for(const z of K.units){const x=W-.27;
  kit.box(.3,.6,.8,x,.4,z,0xe4e1d6);kit.box(.32,.04,.82,x,.72,z,0xd3cfc2);
  kit.cyl(.22,.22,.02,x-.16,.42,z-.08,0x3b3f42,{rz:Math.PI/2,segments:16});
  kit.box(.012,.44,.025,x-.175,.42,z-.08,0x8e9396);kit.box(.012,.025,.44,x-.175,.42,z-.08,0x8e9396);
  kit.box(.02,.42,.16,x-.16,.4,z+.3,0xcfcbbf);}
 kit.block(W-.08,W,.3,2.9,duct-.05,duct+.05,0xd3cec0);kit.block(W-.12,W-.08,.36,.48,duct-.05,duct+.05,0xd3cec0);kit.block(W-.1,W,2.9,2.98,duct-.07,duct+.07,0xbdb8aa);
 // The cage: corner posts, three rails, welded bars a hand apart, a top of bars and a padlocked gate.
 const h=K.height,cage=(x0,x1,y0,y1,z0,z1)=>kit.block(x0,x1,y0,y1,z0,z1,steel,'metal');
 for(const [x,z] of [[out,K.minZ],[out,K.maxZ],[W-.02,K.minZ],[W-.02,K.maxZ]])cage(x-.02,x+.02,0,h,z-.02,z+.02);
 for(const y of [.04,h/2,h-.02]){cage(out-.015,out+.015,y-.015,y+.015,K.minZ,K.maxZ);for(const z of [K.minZ,K.maxZ])cage(out,W,y-.015,y+.015,z-.015,z+.015);}
 for(let z=K.minZ+.1;z<K.maxZ-.05;z+=.1)cage(out-.008,out+.008,0,h,z-.008,z+.008);
 for(const z of [K.minZ,K.maxZ])for(let x=out+.1;x<W-.05;x+=.1)cage(x-.008,x+.008,0,h,z-.008,z+.008);
 for(let z=K.minZ+.2;z<K.maxZ-.05;z+=.2)if(Math.abs(z-duct)>.1)cage(out,W,h-.016,h,z-.008,z+.008);
 const gate=(K.minZ+K.maxZ)/2;for(const z of [gate-.4,gate+.4])cage(out-.025,out+.025,.02,h-.04,z-.02,z+.02);
 kit.box(.04,.07,.05,out-.04,.62,gate+.36,0xc9a640,{finish:'metal'});
 solid(kit.rect(out-.03,W,K.minZ-.03,K.maxZ+.03,h+.02,'sakura-condenser-cage'));
 // The tap on its riser, the hose coiled on a hook beside it.
 const T=B.tap;
 kit.rod([W-.04,.04,T.z],[W-.04,T.y,T.z],.016,0x8e979a);
 kit.box(.07,.06,.06,W-.05,T.y,T.z,0xb9bcb8,{finish:'metal'});kit.rod([W-.08,T.y,T.z],[W-.13,T.y-.09,T.z],.012,0xb9bcb8);
 kit.box(.02,.02,.1,W-.05,T.y+.05,T.z,0xb9bcb8);kit.box(.02,.1,.02,W-.05,T.y+.05,T.z,0xb9bcb8);
 // The coil hangs from its hook; the end in use droops from the tap and rises into the coil's foot.
 for(const [dx,r] of [[.03,.17],[.065,.15],[.1,.17]]){const coil=new THREE.TorusGeometry(r,.02,6,18);kit.add(coil,trs(W-dx,1.13-r,T.z-.42,0,Math.PI/2,0),0x4f8a5c);coil.dispose();}
 kit.box(.14,.03,.03,W-.07,1.14,T.z-.42,0x5d6468);
 kit.rod([W-.13,T.y-.09,T.z],[W-.16,.12,T.z-.12],.02,0x4f8a5c);kit.rod([W-.16,.12,T.z-.12],[W-.1,.79,T.z-.4],.02,0x4f8a5c);
 solid(kit.rect(W-.14,W,T.z-.62,T.z+.05,1.15,'sakura-tap'));
 // The awning over the back door: corrugated sheet on two brackets, falling away from the wall.
 const A=B.backDoor.awning,fall=.12,slope=Math.atan2(fall,A.out);
 kit.box(A.out,.02,A.maxZ-A.minZ,W-A.out/2,A.y-fall/2,(A.minZ+A.maxZ)/2,0xa9c9b2,{rz:slope});
 for(let z=A.minZ+.04;z<A.maxZ;z+=.09)kit.rod([W,A.y+.012,z],[W-A.out,A.y-fall+.012,z],.012,0x9cbea6);
 kit.box(.04,.05,A.maxZ-A.minZ,W-A.out,A.y-fall-.02,(A.minZ+A.maxZ)/2,0x7b8285);
 for(const z of [A.minZ+.08,A.maxZ-.08]){kit.rod([W,A.y-.45,z],[W-A.out+.04,A.y-fall-.03,z],.018,0x7b8285);kit.box(.03,.5,.05,W-.015,A.y-.22,z,0x7b8285);}
 // A bulkhead lamp over the door under the awning, for the night deliveries: the shop never closes.
 const lampZ=(A.minZ+A.maxZ)/2;
 kit.box(.06,.16,.26,W-.03,A.y-.17,lampZ,0x5d6468);kit.box(.07,.12,.2,W-.09,A.y-.17,lampZ,0xf2e6c8,{finish:'lamp'});
}

/** SAKURA_BACK.strip: the concrete apron behind the shop, in bays, the gully under the downpipe and a few weeds. */
function sakuraServiceStrip(kit){
 const R=SAKURA_BACK.strip;
 // The apron itself is the ground's: the west yard's plan lays R.rects (ground-plan-quarters.js, step 3).
 // The gully the shop's downpipe (storefront.js) runs into.
 kit.block(SAKURA_BACK.wall-.36,SAKURA_BACK.wall-.06,R.top,R.top+.016,-26.85,-26.55,0x55595a,'metal');
 R.weeds.forEach(([x,z],i)=>{for(let k=0;k<3;k++){const a=k*2.1+i;kit.cyl(0,.028,.15+.04*((i+k)%2),x+Math.cos(a)*.04,R.top+.07,z+Math.sin(a)*.04,k%2?0x6f8c4f:0x7f9a5a,{segments:4,rx:Math.sin(a)*.3,rz:Math.cos(a)*.3});}});
}

function dressWarehouse(kit,solid,{inspect}){
 // Its name on the street wall, big enough to read from the top of Main Street.
 const x=-10.52;
 kit.sign(fascia({jp:"Port warehouse",en:'Minato harbour warehouse · stores & ice',bg:'#e9e4d6',accent:'#314d51',ink:'#1f3336'}),3.8,.9,x+.5,4.55,-43.1,{ry:Math.PI/2,depth:.06,name:'warehouse sign'});
 kit.sign(enamel({jp:"Fisheries cooperative",en:'fisheries co-op',bg:'#1f5f94',ink:'#f4f0e4'}),.6,.9,x+.04,2,-40.2,{ry:Math.PI/2,depth:.02,name:'enamel sign'});
 // (The floats in a net that hung here, over the ferry's apron, are gone: the creator, 2026-10-11, cleared the
 // ramp head of everything in the way.)

 // No crates at its foot any more (2026-10): the bigger ferry's ramp flap lies where they stood, and the cars
 // coming off her sweep the corner up to the forklift's shutter. A ferry's apron is kept clear; the co-op
 // keeps its crates inside.
}

function dressOffice(kit,solid,{inspect}){
 const x=9.1,z=-38.9;
 kit.cyl(.06,.09,7,x,3.5,z,0xf2f0ea,{segments:8});
 kit.box(.3,.2,.3,x,.1,z,0x8e979a);
 const flags=[[6.6,0],[5.2,1],[3.8,2]];
 for(const [y,seed] of flags){
  kit.rod([x,y,z],[x+1.9,y,z],.02,0xd0d4d6);
  kit.sign(catchFlag(seed),1.8,1.2,x+.98,y-.62,z,{depth:.015,both:true,name:'big-catch flag'});
 }
 solid({id:'office-flagpole',x,z,w:.4,d:.4,height:7});
 // A life ring by the door and the tide board beside it.
 kit.sign(poster({title:"Tide table",lines:["TIDES · Tide","High tide 06:12  18:40","Low tide 00:05  12:28","Wave 1.0m"],band:'#1f5f94'}),.8,1.1,11.2,1.6,-38.33,{depth:.03,name:'tide board'});
 inspect(11.2,1.2,-37.6,'Read the tide board',"Tide board · Tide table",
  "Chalked up by the harbour master at six every morning: high water, low water, the swell, and underneath, in smaller writing, whether it is a good day for the reef. Today it says Good — good.");
 inspect(x+1,1.4,z+.8,'Look at the big-catch flags',"Great catch flag · Big-catch flags",
  'Tairyō-bata: the flags a boat flies coming home with a full hold, in colours you can see from the reef. The harbour office keeps three on its pole all year, which the skippers say is either optimism or tempting fate.');
}

function dressBookshop(kit,solid,{inspect}){
 // A cart of ¥100 paperbacks out on the pavement, under the eave.
 const x=-7.63,z=3.8;
 kit.box(.3,.08,1.3,x,.7,z,0x6b4a33);kit.box(.3,.5,.06,x,.95,z-.62,0x6b4a33);kit.box(.3,.5,.06,x,.95,z+.62,0x6b4a33);
 for(let i=0;i<9;i++)kit.box(.26,.2+(i%3)*.03,.1,x,.84,z-.52+i*.13,[0xb8432f,0x2f6fa8,0xe0c060,0x3f7f5a,0xd8cfb8][i%5]);
 for(const dz of [-.55,.55])kit.box(.06,.66,.06,x,.33,z+dz,0x4a3a2a);
 solid({id:'book-cart',x,z,w:.32,d:1.4,height:1});
 kit.sign(poster({title:'¥100',lines:["Paperback",'PAPERBACKS'],band:'#8a3b2e'}),.34,.46,x+.17,1.35,z,{ry:Math.PI/2,depth:.02,name:'book cart card'});
 inspect(x+.9,1,z,'Browse the ¥100 cart','Front-Row ¥100 cart',
  'Paperbacks with their covers curled by the sea air: detective stories, a Ryūkyū cookery book, three copies of the same romance and a tide table from 1989. Nhung puts it out on her way to morning surgery, with a tin for the coins, and brings it in when she comes back to set the paper, or Kōji does when it rains, which is most afternoons in June.');
}
