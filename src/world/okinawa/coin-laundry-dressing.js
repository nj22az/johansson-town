import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {createKit,paint} from './kit.js';
import {signText} from './signs.js';
import {windowGlow} from '../../render/dusk.js';
import {LAUNDRY_MACHINES,laundryMachinesAt,laundryNotices} from '../../commerce/coin-laundry.js';

/**
 * The coin laundry (コインランドリー), dressed as a 1990s island launderette (the owner, 21 October 2026: "the laundromat,
 * how can we bring them more life and interactivity"). It was a white box with six portholes drawn on a back wall a pace
 * from the pavement. A coin laundry of the period is a glass-fronted room under a fluorescent ceiling: front-loading
 * washers down one wall with their coin boxes, the gas dryers down the other venting through it, a vinyl bench at the
 * back under the noticeboard, a shelf of read-to-pieces manga, the change machine, the powder box by the door, and a
 * counter along the window to fold at. Open all night, it is the one lit room on the street, its glass misted by the
 * dryers.
 *
 * The shop-house frame (houses.js shopHouse): x along the frontage (+x the vent wall, towards Higa Liquor's crate yard,
 * world -z), z out to Main Street (+z, world +x), y up from the pavement; the room is 5.4 m deep, the back of the ground
 * floor the gas meter and the store. Machines are measured from period front-loaders: a 7 kg washer 0.7 m wide, 0.72 m
 * deep and 1.05 m tall with its porthole at 0.62 m; a gas dryer 0.85 m wide, 1.85 m tall, its drum window at chest height.
 */
export const LAUNDRY_FRAME=Object.freeze({W:2.65,D:3.9,ground:3.3,H:6.1,open:2.27,back:-1.5,floor:.08,origin:Object.freeze([-11.9,20.7])});
const {W,D,H,open,back}=LAUNDRY_FRAME;
/** A point of the shop-house's frame in the world (the frame turns a quarter the other way: local +z is world +x). */
export const laundryPoint=(x,z)=>[LAUNDRY_FRAME.origin[0]+z,LAUNDRY_FRAME.origin[1]-x];
/** The doorway in the glass front: local x from DOOR[0] to DOOR[1]. */
const DOOR=Object.freeze([-.45,.65]),PANE_Z=D-.4;

/** Where each machine stands in the room (its middle; washers on the -x wall facing +x, dryers on the +x wall facing -x). */
export const LAUNDRY_PLACES=Object.freeze({
 W1:Object.freeze({x:-1.91,z:1.4,w:.72,h:1.05,door:.62,r:.2}),
 W2:Object.freeze({x:-1.91,z:.65,w:.72,h:1.05,door:.62,r:.2}),
 W3:Object.freeze({x:-1.91,z:-.1,w:.72,h:1.05,door:.62,r:.2}),
 W4:Object.freeze({x:-1.91,z:-.95,w:.85,h:1.15,door:.68,r:.25}),
 D1:Object.freeze({x:1.87,z:-.4,w:.85,h:1.85,door:1.15,r:.3}),
 D2:Object.freeze({x:1.87,z:.5,w:.85,h:1.85,door:1.15,r:.3}),
});
/** The bench's two places (world): where the sitter sits, where they stand up to, the way they face (yaw). */
export const LAUNDRY_BENCH=Object.freeze({x0:-1.25,x1:.6,z0:back+.06,z1:back+.46,height:.42,
 seats:Object.freeze([-.8,.2].map(x=>Object.freeze({at:Object.freeze(laundryPoint(x,back+.3)),stand:Object.freeze(laundryPoint(x,-.55)),height:.42,yaw:-Math.PI/2})))});
/** Where Ms Ganaha's morning round stops (world): the coin boxes, the dryers' filters, the floor, the board. */
export const LAUNDRY_ROUND_POINTS=Object.freeze({
 washers:Object.freeze(laundryPoint(-1.0,.3)),dryers:Object.freeze(laundryPoint(.95,.05)),board:Object.freeze(laundryPoint(-.25,-.55)),floor:Object.freeze(laundryPoint(.1,1.8)),
 table:Object.freeze(laundryPoint(1.45,2.0)),
});

const item=o=>Object.freeze({...o,at:Object.freeze(o.at)});
/** Every new thing in and on the laundry, by who it is for and why it is where it is. */
export const LAUNDRY_DRESSING=Object.freeze([
 item({id:'room',side:'inside',at:[0,0,1.2],build:'building',who:'everybody without a machine of their own, and those with a futon cover',why:'A room you walk into, 4.5 by 5.4 m, in place of a slot with machines drawn on its back wall; the back of the ground floor is the gas meter and the store.',period:'Coin laundries spread through Japan in the seventies and eighties in converted shop fronts like this one.'}),
 item({id:'glass-front',side:'front',at:[0,1.36,PANE_Z],build:'open-hours',who:'the street at night',why:'A full glass front in an aluminium sash, the door slid open on its track for the dryers’ heat: by day you see the machines turning from the pavement; at night the glass mists over and glows, the only lit room on the street.',period:'Launderettes were glass-fronted so they felt safe at night.'}),
 item({id:'washers',side:'inside',at:[-1.91,.52,.25],build:'fitting',who:'the customers (commerce/coin-laundry.js LAUNDRY_VISITS)',why:'Four front-loading washers down the wall away from the vents, three 7 kg at ¥200 and one 12 kg at ¥400 for futon covers, each with its coin box and number.',period:'Front-loaders with coin boxes, from the period’s commercial makers.'}),
 item({id:'dryers',side:'inside',at:[1.87,.92,.05],build:'fitting',who:'the customers',why:'Two gas dryers on the vent wall, venting straight through it to the hoods outside (quarters.js laundrySideWall), ¥100 for ten minutes; dryer 2 keeps a coin now and then (the board says so).',period:'Gas dryers: Japan’s coin laundries were sold on drying a futon cover in half an hour.'}),
 item({id:'bench',side:'inside',at:[-.32,.21,back+.26],build:'fitting',who:'whoever is waiting',why:'A blue vinyl bench along the back wall, facing the machines: where you sit and read while your washing goes round.',period:'Vinyl benches on steel legs.'}),
 item({id:'noticeboard',side:'inside',at:[-.3,1.6,back+.075],build:'fitting',who:'the street (commerce/coin-laundry.js laundryNotices)',why:'The cork board over the bench, the street’s noticeboard because everybody sits under it for half an hour: the lost cat, the found sandal, the lessons, the week’s events and the keeper’s notes.',period:'The launderette board was the neighbourhood’s classifieds.'}),
 item({id:'manga',side:'inside',at:[1.07,.48,back+.15],build:'fitting',who:'whoever is waiting',why:'A low bookcase of old manga, left by the people who read them and never taken home, the covers soft with use.',period:'Weekly manga anthologies, read to pieces in launderettes and barbers.'}),
 item({id:'change-machine',side:'inside',at:[1.07,1.5,back+.16],build:'fitting',who:'the customers; Ms Ganaha empties it',why:'The change machine (両替機) on the wall over the bookcase: ¥1,000 notes into ¥100 coins.',period:'Every coin laundry had one.'}),
 item({id:'powder-box',side:'inside',at:[-2.11,.6,2.52],build:'fitting',who:'the customers',why:'The washing-powder vending box by the door, a paper cup for ¥50, so nobody has to carry a box of soap to the laundry.',period:'Detergent vending boxes stood in every launderette.'}),
 item({id:'folding-counter',side:'inside',at:[1.48,.43,2.8],build:'fitting',who:'the customers',why:'A counter along the inside of the window to fold at, at standing height, where the light is best.',period:'The window counter of a launderette.'}),
 item({id:'lights',side:'inside',at:[0,2.95,1.2],build:'open-hours',who:'the street',why:'Three fluorescent fittings on day and night, the room never dark.',period:'Bare tubes.'}),
]);
/** What a launderette might have had that is not here, and why. */
export const LAUNDRY_LEFT_OUT=Object.freeze([
 {suggestion:'A television on a bracket',why:'The bench reads the manga and the board; a set would be one more thing in the room with nothing to do with the street’s stories.'},
 {suggestion:'A drinks machine inside',why:'The drinks machines stand on the pavement (vending.js); Sakura sells the rest across the street.'},
 {suggestion:'Shoe-washing machines',why:'A later fashion; in 1997 the island’s trainers were washed at home.'},
].map(Object.freeze));

const MINCHO='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif',GOTHIC='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
const ATLAS=Object.freeze({w:1024,h:512,banner:[0,0,1024,120],hours:[0,136,300,120],prices:[316,136,260,300],change:[600,136,200,70],powder:[600,222,200,70],
 n1:[820,136,60,60],n2:[884,136,60,60],n3:[948,136,60,60],n4:[820,200,60,60],d1:[884,200,60,60],d2:[948,200,60,60]});
function paintLettering(){
 return paint(ATLAS.w,ATLAS.h,ctx=>{
  ctx.textAlign='center';ctx.textBaseline='middle';
  {const [x,y,w,h]=ATLAS.banner;ctx.clearRect(x,y,w,h);ctx.fillStyle='#ffffff';ctx.fillRect(x,y,w,h);ctx.fillStyle='#3a6a9a';ctx.fillRect(x,y+h-16,w,16);
   ctx.fillStyle='#2d5683';signText(ctx,'コインランドリー',x+w/2,y+h/2-6,w-60,80,GOTHIC);}
  {const [x,y,w,h]=ATLAS.hours;ctx.fillStyle='#e04a3a';ctx.fillRect(x,y,w,h);ctx.fillStyle='#ffffff';signText(ctx,'24時間営業',x+w/2,y+h/2-14,w-20,48,GOTHIC);
   signText(ctx,'年中無休',x+w/2,y+h-26,w-40,26,GOTHIC);}
  {const [x,y,w,h]=ATLAS.prices;ctx.fillStyle='#fbf7ea';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#3a6a9a';ctx.lineWidth=6;ctx.strokeRect(x+4,y+4,w-8,h-8);
   ctx.fillStyle='#3a6a9a';signText(ctx,'料金',x+w/2,y+36,w-30,34,GOTHIC);ctx.fillStyle='#2a2420';
   ['洗濯 7kg 200円 30分','大型 12kg 400円 40分','乾燥 10分 100円','洗剤 1杯 50円'].forEach((t,i)=>signText(ctx,t,x+w/2,y+92+i*52,w-24,24,GOTHIC));}
  for(const [r,t,bg] of [[ATLAS.change,'両替','#2f6f9f'],[ATLAS.powder,'洗剤 50円','#d8822f']]){const [x,y,w,h]=r;ctx.fillStyle=bg;ctx.fillRect(x,y,w,h);ctx.fillStyle='#ffffff';signText(ctx,t,x+w/2,y+h/2+2,w-20,36,GOTHIC);}
  for(const [r,t] of [[ATLAS.n1,'1'],[ATLAS.n2,'2'],[ATLAS.n3,'3'],[ATLAS.n4,'4'],[ATLAS.d1,'乾1'],[ATLAS.d2,'乾2']]){const [x,y,w,h]=r;ctx.fillStyle='#ffd23a';ctx.fillRect(x,y,w,h);ctx.fillStyle='#1d1d1d';signText(ctx,t,x+w/2,y+h/2+2,w-8,40,GOTHIC);}
 });
}
function quad(r,w,h,at,ry=0,atlas=ATLAS){
 const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv,[px,py,pw,ph]=r;
 const u0=px/atlas.w,u1=(px+pw)/atlas.w,v1=1-py/atlas.h,v0=1-(py+ph)/atlas.h;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)?u1:u0,uv.getY(i)?v1:v0);
 g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...at),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,ry,0)),new THREE.Vector3(1,1,1)));
 return g;
}
const F=LAUNDRY_FRAME.floor,P=LAUNDRY_PLACES;
/** The machines' number plates sit on their control panels, the panes' stickers 1 cm behind the glass (street frame). */
const LETTERING=Object.freeze([
 ['banner',1.6,.19,[-1.36,2.3,PANE_Z-.01],0],['hours',.42,.17,[-1.36,1.98,PANE_Z-.01],0],['prices',.36,.42,[1.45,1.5,PANE_Z-.01],0],
 ['change',.24,.085,[1.07,1.69+F,back+.277],0],['powder',.26,.09,[-1.933,1.0+F,2.52],Math.PI/2],
 ...['W1','W2','W3','W4'].map((id,i)=>[['n1','n2','n3','n4'][i],.07,.07,[P[id].x+.36+.008,P[id].h-.12+F,P[id].z+.2],Math.PI/2]),
 ...['D1','D2'].map((id,i)=>[['d1','d2'][i],.09,.09,[P[id].x-.4-.013,1.69+F,P[id].z+.3],-Math.PI/2]),
]);

/** The fittings, drawn standing on the finished floor (houses.js shopInterior's fitted frame). Returns their colliders. */
export function laundryInterior(kit){
 const solids=[],white=0xf1efe8,panel=0xd8dcdc,dark=0x2a3238,chrome=0xc8ccce;
 // The room is lit all night by its tubes: the machines' enamel and the bench take the town's evening glow, so from the
 // bench at ten at night it is the bright room it is from the street (no light of its own: the phone budget). The vinyl
 // floor is the frontage's (laundryFrontage), lit by the tubes and taking no sun or moon shadow through the glass.
 // The washers, their fronts facing the room (+x): body, the sloped coin panel, the porthole's dark drum and chrome ring.
 for(const id of ['W1','W2','W3','W4']){const m=P[id],x1=m.x+.36;
  kit.block(-open,x1,0,m.h,m.z-m.w/2+.01,m.z+m.w/2-.01,white,'glow');
  kit.block(x1-.18,x1+.005,m.h,m.h+.05,m.z-m.w/2+.01,m.z+m.w/2-.01,panel);
  kit.box(.012,.1,.16,x1+.006,m.h-.12,m.z-.12,0x6d7477);kit.box(.012,.04,.05,x1+.006,m.h-.12,m.z+.08,0x2b2b2b);
  // The chrome ring proud of the face, the drum's dark window 8 mm proud of the ring (the washing turns in front of it).
  kit.cyl(m.r+.04,m.r+.04,.008,x1+.004,m.door,m.z,chrome,{rz:Math.PI/2,segments:16,finish:'metal'});
  kit.cyl(m.r,m.r,.016,x1+.008,m.door,m.z,dark,{rz:Math.PI/2,segments:16});
  kit.box(.012,.04,.12,x1+.006,.12,m.z,0x9aa0a4);
 }
 solids.push(kit.rect(-open,-1.53,-1.4,1.78,1.25,'laundry-washers'));
 // The two gas dryers on the vent wall, fronts facing the room (-x): the drum window at chest height, the coin panel under it.
 for(const id of ['D1','D2']){const m=P[id],x0=m.x-.4;
  kit.block(x0,open,0,m.h,m.z-m.w/2+.01,m.z+m.w/2-.01,0xe6e4de,'glow');
  kit.block(x0-.005,x0+.01,1.6,1.78,m.z-m.w/2+.04,m.z+m.w/2-.04,0x3a6a9a);
  kit.cyl(m.r+.05,m.r+.05,.008,x0-.004,m.door,m.z,chrome,{rz:Math.PI/2,segments:18,finish:'metal'});
  kit.cyl(m.r,m.r,.016,x0-.008,m.door,m.z,dark,{rz:Math.PI/2,segments:18});
  kit.box(.012,.16,.24,x0-.006,.58,m.z,0x6d7477);kit.box(.012,.05,.08,x0-.012,.58,m.z+.05,0x2b2b2b);
  kit.box(.012,.06,.4,x0-.006,.22,m.z,0x9aa0a4);
 }
 solids.push(kit.rect(1.45,open,-.85,.95,1.9,'laundry-dryers'));
 // The bench under the board, facing the machines.
 {const B=LAUNDRY_BENCH;
  kit.block(B.x0,B.x1,B.height-.07,B.height,B.z0+.02,B.z1,0x2f6f9f,'glow');kit.block(B.x0,B.x1,.42,.82,B.z0,B.z0+.08,0x2f6f9f,'glow');
  for(const x of [B.x0+.1,B.x1-.1])for(const z of [B.z0+.08,B.z1-.06])kit.box(.04,B.height-.07,.04,x,(B.height-.07)/2,z,0x8e979a,{finish:'metal'});
  kit.box(.17,.06,.24,B.x1-.2,B.height+.03,B.z0+.22,0xd34a3a);kit.box(.17,.04,.24,B.x1-.2,B.height+.08,B.z0+.22,0x3b6fb0);
  solids.push(kit.rect(B.x0,B.x1,back,B.z1,.86,'laundry-bench'));}
 // The noticeboard's cork and frame on the back wall (the notices are the frontage's, painted for the day).
 kit.box(1.62,.84,.03,-.3,1.6,back+.075,0x7a5a3a);kit.box(1.54,.76,.012,-.3,1.6,back+.096,0xc49a68);
 // The manga bookcase, its spines, and the change machine over it.
 {const x0=.75,x1=1.4,z0=back+.06,z1=back+.36;
  kit.block(x0,x1,0,.95,z0,z0+.03,0x8a6641,'glow');for(const x of [x0+.015,x1-.015])kit.box(.03,.95,.3,x,.475,(z0+z1)/2,0x8a6641,{finish:'glow'});
  for(const y of [.02,.47,.93])kit.block(x0+.006,x1-.006,y,y+.025,z0,z1,0x8a6641);
  const spines=[0xd34a3a,0x3b6fb0,0xf2c14a,0x5a9a52,0xe8e2d0,0x8a4aa0,0xe07a2a];
  for(const [y,n] of [[.045,10],[.495,9]])for(let i=0;i<n;i++)kit.box(.05,.19+(i%3)*.01,.18,x0+.07+i*.058,y+.1,z0+.13,spines[(i*3+n)%spines.length]);
  for(let i=0;i<4;i++)kit.box(.19,.025,.13,1.07+(i%2)*.01,.97+i*.026,z0+.14,spines[i+2],{ry:(i%2?.12:-.08)});
  solids.push(kit.rect(x0,x1,back,z1,1.0,'laundry-manga'));
  kit.box(.34,.5,.2,1.07,1.5,back+.16,0xd8dcdc);kit.box(.24,.1,.01,1.07,1.69,back+.265,0x2f6f9f);kit.box(.08,.02,.02,1.07,1.42,back+.27,0x2b2b2b);kit.box(.16,.1,.02,1.07,1.3,back+.27,0x9aa0a4);}
 // The powder box by the door, on its stand.
 {const x=-2.11,z=2.52;kit.box(.32,.5,.44,x,1.0,z,0xf0e6d0);kit.box(.01,.09,.26,x+.165,1.0,z,0xd8822f);kit.box(.01,.05,.1,x+.165,.85,z,0x2b2b2b);
  for(const dz of [-.16,.16])kit.box(.04,.75,.04,x,.375,z+dz,0x8e979a,{finish:'metal'});kit.box(.21,.12,.2,x+.065,.82,z,0xf4f0e6);
  solids.push(kit.rect(-open,x+.17,z-.24,z+.24,1.3,'laundry-powder'));}
 // The folding counter along the window.
 {const x0=.75,x1=open-.05,z0=2.55,z1=3.05;
  kit.block(x0,x1,.8,.85,z0,z1,0xd9cfb8);for(const x of [x0+.05,x1-.05])kit.box(.05,.8,.42,x,.4,(z0+z1)/2,0x8e979a,{finish:'metal'});
  solids.push(kit.rect(x0,x1+.05,z0,z1,.9,'laundry-counter'));}
 return solids;
}

/**
 * The building's own articulation, in the quarter's kit inside the shop-house's frame: the slab band and coping, the
 * hoods, an upstairs window each side, the glass front's sash (its panes are the frontage's). Returns colliders.
 */
export function laundryBuilding(kit,{trim=0x3a6a9a}={}){
 const solids=[],band=0xc9d3d8,hood=0xd4dbde,alu=0xb8bec0;
 kit.block(-W-.025,-W,3.17,3.33,-D,D,band);kit.block(W,W+.025,3.17,3.33,-D,D,band);kit.block(-W-.025,W+.025,3.17,3.33,-D-.025,-D,band);
 kit.block(-W-.03,W+.03,H+.5,H+.55,-D-.03,-D+.17,band);
 kit.block(-W-.03,-W+.17,H+.5,H+.55,-D+.17,D-.18,band);kit.block(W-.17,W+.03,H+.5,H+.55,-D+.17,D-.18,band);
 for(const x of [-W*.48,W*.48])kit.box(1.8,.08,.32,x,5.56,D+.16,hood);
 // The glass front's sash: head, sill, mullions either side of the doorway and at the ends, a transom under the box.
 kit.block(-open,open,2.62,2.7,D-.53,D-.36,alu,'metal');kit.block(-open,open,2.7,3.0,D-.46,D-.42,trim);
 kit.block(-open,open,.08,.1,D-.53,D-.36,alu,'metal');
 for(const x of [-open+.025,DOOR[0]-.02,DOOR[1]+.02,open-.025])kit.box(.05,2.52,.06,x,1.36,PANE_Z,alu,{finish:'metal'});
 for(const [a,b] of [[-open+.05,DOOR[0]-.045],[DOOR[1]+.045,open-.05]])kit.block(a,b,.1,.3,D-.415,D-.385,alu,'metal');
 // The door's leaf, slid open behind the left pane for the dryers' heat (its glass is the frontage's): the frame only.
 {const x0=DOOR[0]-1.06,x1=DOOR[0]-.02,z=D-.48;kit.block(x0,x1,2.53,2.59,z-.02,z+.02,alu,'metal');kit.block(x0,x1,.11,.22,z-.02,z+.02,alu,'metal');
  for(const x of [x0+.025,x1-.025])kit.box(.05,2.48,.04,x,1.35,z,alu,{finish:'metal'});}
 solids.push(kit.rect(-open,DOOR[0],D-.53,D-.35,2.7,'laundry-front-pane'),kit.rect(DOOR[1],open,D-.45,D-.35,2.7,'laundry-front-pane'));
 // One upstairs window each side (the store upstairs), with sill and hood.
 const sideWindow=(z,y,wz,hy,s)=>{const x=s*W;
  kit.box(.05,hy+.12,wz+.12,x+s*.025,y,z,alu,{finish:'metal'});kit.box(.04,hy-.02,wz-.02,x+s*.04,y,z,0x5d7a84,{finish:'window'});
  kit.box(.05,hy-.02,.04,x+s*.065,y,z,alu,{finish:'metal'});kit.box(.16,.06,wz+.2,x+s*.08,y-hy/2-.09,z,0xc9c2b4);kit.box(.32,.08,wz+.3,x+s*.16,y+hy/2+.1,z,hood);};
 sideWindow(1.4,4.75,1.2,1.1,-1);sideWindow(1.4,4.75,1.2,1.1,1);
 return solids;
}

/** The washing in a drum: five soft lumps round the axis, in the colours of somebody's week. */
function drumLoad(r,colours){
 const parts=[];
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2,g=new THREE.IcosahedronGeometry(r*.42,1);g.scale(.35,1,1.2);g.translate(0,Math.cos(a)*r*.45,Math.sin(a)*r*.45);
  const c=new THREE.Color(colours[i%colours.length]),n=g.attributes.position.count,col=new Float32Array(n*3);for(let k=0;k<n;k++){col[k*3]=c.r;col[k*3+1]=c.g;col[k*3+2]=c.b;}
  g.setAttribute('color',new THREE.BufferAttribute(col,3));g.deleteAttribute('uv');parts.push(g);}
 return mergeGeometries(parts);
}
/** The noticeboard's cards for the day: Japanese headings in marker, scribbled lines, a pin each, a sketch where it helps. */
function paintNotices(notices){
 return paint(512,256,(ctx,w,h)=>{
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#c49a68';ctx.fillRect(0,0,w,h);
  const cols=4,cw=w/cols;
  notices.slice(0,8).forEach((n,i)=>{const col=i%cols,row=Math.floor(i/cols),x=col*cw+10+(i*7%9),y=row*h/2+10+(i*5%7),cw2=cw-22,ch=h/2-24,tilt=((i*37)%7-3)*.012;
   ctx.save();ctx.translate(x+cw2/2,y+ch/2);ctx.rotate(tilt);ctx.fillStyle=n.colour||'#ffffff';ctx.fillRect(-cw2/2,-ch/2,cw2,ch);
   ctx.fillStyle='#1d1d1d';ctx.textAlign='center';ctx.textBaseline='middle';signText(ctx,n.jp,0,-ch/2+20,cw2-12,22,GOTHIC);
   ctx.fillStyle='rgba(30,30,30,.45)';for(let k=0;k<4;k++)ctx.fillRect(-cw2/2+10,-ch/2+44+k*14,cw2-20-(k*13%30),3);
   if(n.id==='missing-cat'){ctx.fillStyle='#e08a3a';ctx.beginPath();ctx.ellipse(cw2/2-26,ch/2-22,14,10,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(cw2/2-36,ch/2-30);ctx.lineTo(cw2/2-32,ch/2-40);ctx.lineTo(cw2/2-28,ch/2-30);ctx.fill();}
   if(n.id==='lost-sandal'){ctx.fillStyle='#2f6f9f';ctx.beginPath();ctx.ellipse(cw2/2-26,ch/2-22,9,16,.4,0,Math.PI*2);ctx.fill();}
   ctx.fillStyle='#c0302a';ctx.beginPath();ctx.arc(0,-ch/2+4,4,0,Math.PI*2);ctx.fill();ctx.restore();});
 });
}

/**
 * What changes with the clock, in its own group in the shop-house's frame: the glass (misting over at night), the washing
 * turning in the drums and the baskets on the machines (commerce/coin-laundry.js laundryMachinesAt), the lit tubes, the
 * lettering, and the noticeboard repainted when the day's notices change. update(minutes, wash) follows the clock.
 */
export function laundryFrontage({origin=LAUNDRY_FRAME.origin,shadows=false}={}){
 const group=new THREE.Group();group.name='Coin laundry frontage';group.position.set(origin[0],0,origin[1]);group.rotation.y=Math.PI/2;
 const letters=new THREE.MeshStandardMaterial({map:paintLettering(),roughness:.8,transparent:false});
 const lettering=new THREE.Mesh(mergeGeometries(LETTERING.map(([r,w,h,at,ry])=>quad(ATLAS[r],w,h,at,ry))),letters);lettering.name='Coin laundry lettering (banner, hours, prices, labels, numbers)';group.add(lettering);
 // The glass: the two fixed panes and the open leaf's pane, misting over as the evening comes.
 const glass=new THREE.MeshStandardMaterial({name:'Coin laundry glass',color:0xf2f6f8,transparent:true,opacity:.08,depthWrite:false,side:THREE.DoubleSide,roughness:.2,emissive:new THREE.Color(0xfff6e2),emissiveIntensity:0});
 const pane=(x0,x1,z)=>{const g=new THREE.PlaneGeometry(x1-x0,2.24);g.translate((x0+x1)/2,1.47,z);return g;};
 const panes=new THREE.Mesh(mergeGeometries([pane(-open+.05,DOOR[0]-.045,PANE_Z),pane(DOOR[1]+.045,open-.05,PANE_Z),pane(DOOR[0]-1.03,DOOR[0]-.05,D-.48)]),glass);
 panes.name='Coin laundry glass';panes.renderOrder=2;group.add(panes);
 // The vinyl floor, lit by the tubes: its own mesh, so it takes no shadow of the street's wires through the glass. It is
 // laid 4 mm over the shop-house's concrete floor (houses.js), as sheet vinyl is, so it is drawn as a covering, offset in
 // depth (as lane-edges.js's decals are): otherwise the two faces flicker against each other from the street.
 const floorMaterial=new THREE.MeshStandardMaterial({color:0xd6d4ca,roughness:.85,emissive:new THREE.Color(0xfff4e0),emissiveIntensity:.1,
  polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 {const g=new THREE.PlaneGeometry(open*2,D-.53-(back+.06));g.rotateX(-Math.PI/2);g.translate(0,F+.004,((D-.53)+(back+.06))/2);
  const vinyl=new THREE.Mesh(g,floorMaterial);vinyl.name='Coin laundry vinyl floor';vinyl.receiveShadow=false;group.add(vinyl);}
 // The tubes: three fittings across the ceiling, always on.
 const lamps=createKit({shadows:false});
 for(const x of [-1.2,0,1.2]){lamps.box(.14,.05,1.24,x,2.975,1.0,0xf2f0ea);lamps.cyl(.017,.017,1.18,x,2.935,1.0,0xfafaf2,{rx:Math.PI/2,segments:6,finish:'tube'});}
 const lit=lamps.finish(group,'Coin laundry lights').materials.tube;lit.emissive.setHex(0xf4f8ff);lit.emissiveIntensity=.6;
 // The washing in each drum and the basket on each machine.
 const palettes=[[0xe8e2d0,0x7aa6d8,0xd86a7a],[0xf4f0e6,0xf4f0e6,0xc8d8e8],[0xffffff,0xd8e8f0,0x9ab8d0],[0xf2c14a,0xe07a2a,0x5a9a52]];
 const loadMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95});
 const machines=LAUNDRY_MACHINES.map((spec,i)=>{
  const m=P[spec.id],washer=spec.kind==='washer',face=washer?m.x+.36:m.x-.4,s=washer?1:-1;
  const load=new THREE.Mesh(drumLoad(m.r,palettes[i%palettes.length]),loadMaterial);load.name=`Coin laundry washing in ${spec.id}`;
  load.position.set(face+s*.05,m.door+F,m.z);load.visible=false;group.add(load);
  // A washer's basket on its lid; a dryer's on the folding counter by the window, where the warm washing is folded.
  const k=createKit({shadows:false}),[bx,by,bz]=washer?[m.x-.05,m.h+F,m.z]:[spec.id==='D1'?1.1:1.78,.85+F,2.8];
  // An empty plastic basket on the machine while its washing is in it, as everybody leaves theirs.
  k.box(.4,.2,.5,0,.1,0,[0xd86a9a,0x5a8ad8,0x6ab87a,0xe8a03a,0x5a8ad8,0xd86a9a][i]);k.box(.42,.03,.52,0,.215,0,0xf4f0e6);
  const basket=new THREE.Group();basket.name=`Coin laundry basket on ${spec.id}`;basket.position.set(bx,by,bz);basket.visible=false;group.add(basket);k.finish(basket,`Coin laundry basket ${spec.id}`);
  return {id:spec.id,kind:spec.kind,load,basket};
 });
 // The noticeboard: the day's cards on the cork, repainted when they change.
 const boardMaterial=new THREE.MeshStandardMaterial({roughness:.9,emissive:new THREE.Color(0xffffff),emissiveIntensity:0});
 const board=new THREE.Mesh(new THREE.PlaneGeometry(1.52,.74),boardMaterial);board.name='Coin laundry noticeboard';board.position.set(-.3,1.6+F,back+.108);group.add(board);
 let noticeKey=null,lastGlow=null;
 const update=(minutes,wash=null)=>{
  const day=Math.floor(minutes/1440),key=day+':'+laundryNotices(minutes).map(n=>n.id).join(',');
  if(key!==noticeKey){noticeKey=key;const old=boardMaterial.map;boardMaterial.map=boardMaterial.emissiveMap=paintNotices(laundryNotices(minutes));boardMaterial.needsUpdate=true;old?.dispose?.();}
  const glow=windowGlow(minutes);
  if(glow!==lastGlow){lastGlow=glow;glass.opacity=.08+glow*.5;glass.emissiveIntensity=glow*.55;lit.emissiveIntensity=.6+glow*.6;floorMaterial.emissiveIntensity=.1+glow*.45;boardMaterial.emissiveIntensity=glow*.5;}
  const now=laundryMachinesAt(minutes,wash),spin=(((minutes%1440)+1440)%1440)*60;
  for(const m of machines){const s=now.find(x=>x.id===m.id);
   m.load.visible=!!s.running;
   if(s.running)m.load.rotation.x=spin*(s.running==='wash'?4.4:5.2);
   m.basket.visible=s.basket;}
 };
 return {group,machines,board,glass,lights:lit,update};
}
