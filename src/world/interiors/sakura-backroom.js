import {addOwnedCharacter} from '../../people/owned-characters.js';
import * as THREE from '../../../vendor/three.module.js';
import {stockroomBeerBatch,deliveryOnigiri} from './stockroom-products.js';
import {paintStaffBoard,boardText} from './staff-board.js';
import {shopProductTemplate,shopProductMaterials} from '../../commerce/shop-product.js';

/**
 * Sakura's back room, stocked the way a konbini バックヤード actually is.
 *
 * The steel rack along the partition came with the model and stood empty: four bare
 * shelves the length of the room. It now holds what the morning vans leave — cases of
 * the shop's own lines (NAGI tea, PORT 88 coffee, YUNAGI noodles, MIZUNOWA water),
 * shrink-wrapped trays of the same cans and bottles the shelves sell, blue folding
 * crates, tissue and toilet-roll packs up top where they are light enough to reach
 * down, and the handy terminal in its cradle for the evening count.
 *
 * Around it: the staff noticeboard on the west wall (shift roster, delivery times, the
 * 5S rules), a green 非常口 sign over the delivery door, yellow UMINEKO bottle crates
 * waiting for the brewery van, a bundle of flattened cardboard tied for collection, a
 * blue daisha parked at the west end with the 11:00 rice delivery still on it, and a
 * fire extinguisher on its stand.
 *
 * Everything is boxes, cylinders and small canvas prints, batched into instanced draws.
 * Positions are in the shop's frame (sakura-layout.js); the floor pieces have colliders
 * there. The rack is two units, x -5.58..-2.21 and -2.12..1.25, its front at z -4.92;
 * shelf tops measured off the model.
 */
export const BACKROOM=Object.freeze({
 rack:Object.freeze({units:[[-.45,.25],[.35,1.17]],front:-4.86,back:-4.12,levels:[.219,.823,1.427,2.031]}),
 noticeboard:Object.freeze({x:-5.645,y:1.62,z:-5.85}),
 exitSign:Object.freeze({x:3.63,y:2.48,z:-6.74}),
 crates:Object.freeze({x:.65,z:-6.52,w:.86,d:.36}),
 bundle:Object.freeze({x:5.51,z:-5.67,w:.26,d:.74}),
 // Parked at the dead-end west end: by the rack's east end it stood on Thuan's line
 // from the passage to the stockroom and she could not get round it on restock runs.
 daisha:Object.freeze({x:-1.1,z:-6.1,w:.66,d:.96}),
 extinguisher:Object.freeze({x:4.66,z:-6.58,r:.15}),
 // The Thuan figurine, on a plinth in the east corner by the delivery door, facing the room.
 figurine:Object.freeze({x:5.42,z:-6.42,plinth:.4,height:.85,yaw:-1.1}),
});

const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;};
const say=(ctx,s,x,y,size,colour,align='center',weight='bold')=>boardText(ctx,s,x,y,size,colour,align==='left'?ctx.canvas.width-x-12:align==='right'?x-12:Math.min(x,ctx.canvas.width-x)*2-16,align,weight);
const std=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.75,...extra});
const hash=(i,s=0)=>{const n=Math.sin(i*127.1+s*311.7)*43758.5453;return n-Math.floor(n);};
const KRAFT='#c39a66';

/** Kraft board with a little fibre, the base of every carton print. */
function kraft(ctx,w,h,seed){
 ctx.fillStyle=KRAFT;ctx.fillRect(0,0,w,h);
 for(let i=0;i<900;i++){ctx.fillStyle=hash(i,seed)>.5?'rgba(90,60,30,.07)':'rgba(255,240,210,.07)';ctx.fillRect(hash(i,seed+1)*w,hash(i,seed+2)*h,3,2);}
}
/** A shipping case: brand panel printed on the board, plus the carrier's white slip. */
function caseLabel({brand,jp,line,count,ink,accent,seed}){
 return canvasTex(512,320,(ctx,w,h)=>{
  kraft(ctx,w,h,seed);
  ctx.fillStyle='rgba(214,170,90,.55)';ctx.fillRect(0,0,w,26);ctx.fillRect(0,h-26,w,26); // packing tape over the flaps
  ctx.strokeStyle=ink;ctx.lineWidth=6;ctx.strokeRect(24,40,300,240);
  say(ctx,brand,174,90,46,ink);say(ctx,jp+' '+line,174,150,30,ink);
  ctx.fillStyle=accent;ctx.fillRect(40,186,268,10);
  say(ctx,count,174,232,40,ink);
  // Carrier slip, the barcode and 天地無用.
  ctx.fillStyle='#fbfaf4';ctx.fillRect(344,48,148,150);ctx.fillStyle='#3f7d4e';ctx.fillRect(344,48,148,26);
  say(ctx,'南風運送',418,62,18,'#ffffff');say(ctx,'さくら商店 宛',418,96,18,'#2b2b2b');
  ctx.fillStyle='#222';let x=356;for(let i=0;i<26&&x<480;i++){const b=hash(i,seed+9)>.5?3:5;ctx.fillRect(x,116,b,44);x+=b+(hash(i,seed+7)>.5?3:2);}
  say(ctx,'49'+String(1000+seed*37).slice(0,4)+'-'+String(seed*911%9000+1000),418,180,15,'#333','center','normal');
  say(ctx,'天地無用',418,236,30,'#c23a32');
  ctx.strokeStyle='#c23a32';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(400,288);ctx.lineTo(400,262);ctx.moveTo(390,272);ctx.lineTo(400,260);ctx.lineTo(410,272);ctx.moveTo(436,288);ctx.lineTo(436,262);ctx.moveTo(426,272);ctx.lineTo(436,260);ctx.lineTo(446,272);ctx.stroke();
 });
}
const CASES={
 tea:{brand:'NAGI',jp:"Nagi",line:"Green tea",count:"500ml × 24items",ink:'#224b35',accent:'#738c43',seed:3,size:[.40,.25,.28],stack:2},
 coffee:{brand:'PORT 88',jp:"Port88",line:"Canned coffee",count:"185g × 30Can",ink:'#5a2a1c',accent:'#bd4826',seed:5,size:[.38,.14,.26],stack:3},
 noodles:{brand:'YUNAGI',jp:"Yuunagi",line:"Ramen",count:"12Meal included",ink:'#8d3028',accent:'#394e41',seed:7,size:[.46,.31,.33],stack:1},
 water:{brand:'MIZUNOWA',jp:"Mizunowa",line:"Natural water",count:"2L × 6items",ink:'#2e6572',accent:'#6dabae',seed:11,size:[.33,.33,.22],stack:1},
};

function kit(parent,name){
 const group=new THREE.Group();group.name=name;parent.add(group);
 const unit=new THREE.BoxGeometry(1,1,1),batches=new Map(),dummy=new THREE.Object3D();
 /** Queue a box (centre x, bottom y, centre z) into an instanced batch keyed by its look. */
 const put=(key,material,x,y,z,w,h,d,yaw=0,geometry=unit)=>{
  if(!batches.has(key))batches.set(key,{material,geometry,list:[]});
  batches.get(key).list.push([x,y,z,w,h,d,yaw]);
 };
 const mesh=(geometry,material,x,y,z,label=name)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=label;group.add(m);return m;};
 const plane=(tex,w,h,x,y,z,yaw,label,basic=false)=>{const mat=basic?new THREE.MeshBasicMaterial({map:tex,toneMapped:false}):new THREE.MeshStandardMaterial({map:tex,roughness:.9});const m=mesh(new THREE.PlaneGeometry(w,h),mat,x,y,z,label);m.rotation.y=yaw;return m;};
 const finish=()=>{
  for(const [key,{material,geometry,list}] of batches){
   const inst=new THREE.InstancedMesh(geometry,material,list.length);inst.name='Sakura back room '+key;
   list.forEach(([x,y,z,w,h,d,yaw],i)=>{dummy.position.set(x,y+(geometry===unit?h/2:0),z);dummy.rotation.set(0,yaw,0);dummy.scale.set(w,h,d);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});
   inst.computeBoundingSphere();group.add(inst);
  }
 };
 return {group,put,mesh,plane,finish};
}

// ===================================================================== the rack
function stockRack(k){
 const {put}=k,R=BACKROOM.rack;
 const plain=std(0xc39a66,{roughness:.9}),tape=std(0xd7b16a,{roughness:.6});
 const caseMats=Object.fromEntries(Object.entries(CASES).map(([id,c])=>{const face=new THREE.MeshStandardMaterial({map:caseLabel(c),roughness:.88});
  // BoxGeometry faces: +x, -x, +y, -y, +z, -z. The print goes on both long faces.
  return [id,[plain,plain,tape,plain,face,face]];}));
 const orikon=std(0x2f7fb8,{roughness:.45}),orikonRim=std(0x23638f,{roughness:.45});
 // Clear film: glazing that writes no depth, drawn in front of the tray it wraps by polygon offset (SK-ZF-004).
 const film=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.15,transparent:true,opacity:.18,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
 const tray=std(0xb88f5c,{roughness:.9});
 const roll=std(0xf6f3ec,{roughness:.95}),rollPrint=new THREE.MeshStandardMaterial({roughness:.9,map:canvasTex(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#f6f3ec';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f0a6b8';for(let i=0;i<14;i++){ctx.beginPath();ctx.arc(hash(i,4)*w,hash(i,5)*h,10,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#ffffff';ctx.fillRect(28,92,200,72);say(ctx,"Sakura",128,116,30,'#c4566e');say(ctx,"12Roll",128,146,22,'#6b4a52');})});
 const tissue=new THREE.MeshStandardMaterial({roughness:.8,map:canvasTex(256,128,(ctx,w,h)=>{ctx.fillStyle='#dce5d2';ctx.fillRect(0,0,w,h);ctx.fillStyle='#99b6a0';ctx.fillRect(0,h-28,w,28);say(ctx,'KOMACHI',w/2,44,34,'#c25a58');say(ctx,"5Box pack",w/2,h-14,18,'#ffffff');})});
 const banjyu=std(0x3d8fcf,{roughness:.4});
 // Shrink-wrapped trays of the shop's own cans and bottles, from the shelf templates.
 const products={},[productBody,productArt]=shopProductMaterials();
 const product=(id,x,y,z)=>{(products[id]??=[]).push([x,y,z]);};

 // Each level is a pattern that repeats across both units; widths pack left to right.
 const levels=[
  ['orikon','water','water','tea','tea','orikon','water','tea'],
  ['coffeeTray','coffee','beerTray','coffee','teaTray','coffeeTray','coffee','beerTray'],
  ['stock','noodles','stock','stock','noodles','coffee','stock','noodles'],
  ['rolls','tissue','rolls','flat','tissue','rolls','flat','tissue'],
 ];
 const width={orikon:.53,water:.33,tea:.40,coffee:.38,noodles:.46,coffeeTray:.42,beerTray:.42,teaTray:.42,stock:.34,rolls:.46,tissue:.48,flat:.64};
 const stock=shopProductTemplate('stock');
 const stockAt=[];
 R.levels.forEach((top,level)=>{
  R.units.forEach(([x0,x1],u)=>{
   let x=x0+.03,n=u*3;
   for(;;){
    const kind=levels[level][n++%levels[level].length],w=width[kind];
    // The handy terminal and its clipboard take the east end of the third shelf.
    if(level===2&&u===1&&x+w>x1-.42)break;
    if(x+w>x1-.02)break;
    // Stock stands 4 mm behind the rack's front, never flush with its uprights.
    const cx=x+w/2,front=R.front+.004,y=top+.002;
    if(CASES[kind]){
     const c=CASES[kind],[cw,ch,cd]=c.size;
     for(let s=0;s<c.stack;s++)put('case '+kind,caseMats[kind],cx,y+s*ch,front+cd/2,cw,ch,cd,(hash(n,s+level)-.5)*.04);
     // A second row behind, plain board: from the aisle the rack reads full, not one deep.
     put('back cartons',plain,cx,y,front+cd+.04+.18,cw,ch*Math.min(c.stack,2),.36);
    }else if(kind==='orikon'){
     put('orikon',orikon,cx,y,front+.2,.53,.29,.38);put('orikon rim',orikonRim,cx,y+.29,front+.2,.55,.025,.40);
     // Two more folded flat behind it, the way they come back from the stores.
     for(let s=0;s<3;s++)put('orikon',orikon,cx,y+s*.06,front+.6,.53,.05,.36);
    }else if(kind.endsWith('Tray')){
     const id=kind==='coffeeTray'?'coffee':kind==='beerTray'?'beer':'tea',bottle=id==='tea';
     const cols=bottle?4:4,rows=bottle?3:3,step=bottle?.098:.098,base=.03;
     put('product tray',tray,cx,y,front+.17,.41,base,.31);
     const t=shopProductTemplate(id),lift=y+base-t.bounds.min.y;
     for(let a=0;a<cols;a++)for(let b=0;b<rows;b++)product(id,cx+(a-(cols-1)/2)*step,lift,front+.07+b*step);
     const hgt=t.bounds.max.y-t.bounds.min.y;
     put('shrink film',film,cx,y+.0025,front+.17,.42,base+hgt+.0075,.32);// its base 2.5 mm up the tray, clear of the tray's
     put('back cartons',plain,cx,y,front+.58,.40,.26,.36);
    }else if(kind==='stock'){
     for(let s=0;s<2;s++)stockAt.push([cx,y-stock.bounds.min.y+s*.225,front+.14,(hash(n,s)-.5)*.06]);
     put('back cartons',plain,cx,y,front+.52,.32,.44,.40);
    }else if(kind==='rolls'){
     for(let s=0;s<2;s++){put('roll pack',[roll,roll,roll,roll,rollPrint,rollPrint],cx,y,front+.18+s*.36,.44,.34,.34);}
    }else if(kind==='tissue'){
     for(let s=0;s<3;s++)put('tissue pack',[tissue,tissue,tissue,tissue,tissue,tissue],cx,y+s*.1,front+.14,.46,.1,.24);
     put('back cartons',plain,cx,y,front+.52,.44,.3,.4);
    }else if(kind==='flat'){
     // Spare 番重 trays, nested, for the next rice delivery.
     for(let s=0;s<5;s++)put('banjyu',banjyu,cx,y+s*.045,front+.25,.6,.04,.44);
    }
    x+=w+.035+hash(n,level)*.03;
   }
  });
 });
 // The Sakura stock cartons use the same labelled template the shop floor uses.
 if(stockAt.length){const pair=[stock.body,stock.art].map((g,i)=>{const m=new THREE.InstancedMesh(g,i?productArt:productBody,stockAt.length);m.name='Sakura back room stock carton';return m;});
  const d=new THREE.Object3D();stockAt.forEach(([x,y,z,yaw],i)=>{d.position.set(x,y,z);d.rotation.set(0,Math.PI+yaw,0);d.updateMatrix();pair.forEach(m=>m.setMatrixAt(i,d.matrix));});
  pair.forEach(m=>{m.computeBoundingSphere();k.group.add(m);});}
 for(const [id,list] of Object.entries(products)){
  const t=shopProductTemplate(id),d=new THREE.Object3D();
  [t.body,t.art].forEach((g,i)=>{const m=new THREE.InstancedMesh(g,i?productArt:productBody,list.length);m.name='Sakura back room tray '+id;
   list.forEach(([x,y,z],j)=>{d.position.set(x,y,z);d.rotation.set(0,Math.PI,0);d.updateMatrix();m.setMatrixAt(j,d.matrix);});m.computeBoundingSphere();k.group.add(m);});
 }
 // Handy terminal in its charging cradle, and the stocktake clipboard beside it.
 const top=R.levels[2],ex=R.units[1][1]-.22;
 put('terminal cradle',std(0x3b4048),ex,top,R.front+.12,.14,.05,.14);
 const handy=new THREE.Group();handy.position.set(ex,top+.05,R.front+.12);handy.rotation.x=.28;handy.name='Handy terminal';k.group.add(handy);
 const body=new THREE.Mesh(new THREE.BoxGeometry(.07,.2,.045),std(0x2a2e33,{roughness:.5}));body.position.y=.1;handy.add(body);
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(.05,.045),new THREE.MeshBasicMaterial({color:0x8fbf8a,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));screen.position.set(0,.15,-.0235);screen.rotation.y=Math.PI;handy.add(screen);
 const led=new THREE.Mesh(new THREE.BoxGeometry(.012,.006,.006),new THREE.MeshBasicMaterial({color:0x6cff6c,toneMapped:false}));led.position.set(.045,.04,-.072);handy.add(led);
 const clip=canvasTex(256,320,(ctx,w,h)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(0,0,w,h);say(ctx,"Stock Count",w/2,30,26,'#2b2b2b');ctx.strokeStyle='#c9c4b6';ctx.lineWidth=2;for(let y=60;y<h-10;y+=24){ctx.beginPath();ctx.moveTo(14,y);ctx.lineTo(w-14,y);ctx.stroke();}
  ["Green tea 24","Canned coffee 30","Ramen 12","Natural water 6","Beer 20"].forEach((s,i)=>{say(ctx,s,20,72+i*24,15,'#2f4a8a','left','normal');say(ctx,'✓',w-30,72+i*24,18,'#c23a32');});});
 const board=new THREE.Mesh(new THREE.BoxGeometry(.2,.006,.27),std(0x8a6a4a));board.position.set(ex-.22,top+.003,R.front+.17);board.rotation.y=.08;board.name='Stocktake clipboard';k.group.add(board);
 const sheet=new THREE.Mesh(new THREE.PlaneGeometry(.18,.23),new THREE.MeshStandardMaterial({map:clip,roughness:.95,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));sheet.rotation.set(-Math.PI/2,0,Math.PI+.08);sheet.position.set(ex-.22,top+.007,R.front+.18);k.group.add(sheet);
 return {led};
}

// ================================================================ the noticeboard
function noticeboard(k){
 const N=BACKROOM.noticeboard,tex=canvasTex(768,512,paintStaffBoard);
 k.mesh(new THREE.BoxGeometry(.04,.84,1.24),std(0x7a5530),N.x+.02,N.y,N.z,'Staff noticeboard');
 k.plane(tex,1.2,.8,N.x+.045,N.y,N.z,Math.PI/2,'Staff noticeboard print');
}

// ======================================================= signs, crates and floor pieces
function exitSign(k){
 const S=BACKROOM.exitSign;
 const tex=canvasTex(512,192,(ctx,w,h)=>{
  ctx.fillStyle='#1f9a4b';ctx.fillRect(0,0,w,h);ctx.fillStyle='#f4fff6';ctx.fillRect(16,16,150,h-32);
  // A running figure heading for the door: the 非常口 pictogram, drawn plainly.
  ctx.fillStyle='#1f9a4b';ctx.beginPath();ctx.arc(104,52,14,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#1f9a4b';ctx.lineWidth=14;ctx.lineCap='round';ctx.beginPath();
  ctx.moveTo(92,72);ctx.lineTo(80,118);ctx.moveTo(80,118);ctx.lineTo(108,140);ctx.lineTo(102,168);ctx.moveTo(80,118);ctx.lineTo(56,150);
  ctx.moveTo(90,80);ctx.lineTo(118,96);ctx.lineTo(136,84);ctx.moveTo(88,82);ctx.lineTo(62,96);ctx.stroke();
  ctx.fillStyle='#f4fff6';ctx.fillRect(140,30,10,h-60);
  say(ctx,'非常口',330,76,64,'#f4fff6','center','900');say(ctx,'EXIT',330,142,40,'#f4fff6');
 });
 k.mesh(new THREE.BoxGeometry(.64,.26,.06),std(0xeef1ee),S.x,S.y,S.z+.03,'Exit sign housing');
 Object.assign(k.plane(tex,.6,.225,S.x,S.y,S.z+.062,0,'Exit sign',true).material,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});// a decal on the housing (SK-ZF-004)
}

function beerCrates(k){
 const positions=[],C=BACKROOM.crates,yellow=std(0xdcb22c,{roughness:.55});
 const label=canvasTex(256,128,(ctx,w,h)=>{ctx.fillStyle='#dcb22c';ctx.fillRect(0,0,w,h);say(ctx,'海猫ビール',w/2,42,30,'#913a2b');say(ctx,'UMINEKO · 20本',w/2,88,20,'#913a2b');});
 [[C.x-.21,3],[C.x+.21,2]].forEach(([x,count])=>{for(let i=0;i<count;i++){
  const y=i*.3;k.put('beer crate floor',yellow,x,y,C.z,.42,.018,.34);
  // The long walls between the end walls, the end walls under the rims, each rim one crate wide: stacked and side by
  // side, no two pieces share a plane (SK-ZF-004).
  for(const dz of [-.163,.163]){k.put('beer crate long wall',yellow,x,y+.018,C.z+dz,.392,.245,.014);k.put('beer crate rim',yellow,x,y+.263,C.z+dz,.42,.018,.022);}
  for(const dx of [-.203,.203])k.put('beer crate end wall',yellow,x+dx,y+.018,C.z,.014,.245,.34);
  for(let a=0;a<5;a++)for(let b=0;b<4;b++)positions.push([x-.16+a*.08,y+.02,C.z-.12+b*.08]);
  Object.assign(k.plane(label,.34,.16,x,y+.145,C.z+.1725,0,'Beer crate label').material,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});
 }});k.group.add(stockroomBeerBatch(positions));
}

function cardboardBundle(k){
 // Stood on edge against the east wall, tied twice round, waiting for the paper collection.
 const B=BACKROOM.bundle,board=std(0xbf9563,{roughness:.95}),twine=std(0xf2cc2f,{roughness:.6});
 for(let i=0;i<5;i++)k.put('flat cardboard',board,B.x-.09+i*.045,0,B.z+(hash(i,9)-.5)*.04,.044,.56-hash(i,8)*.04,.72,(hash(i,10)-.5)*.04);
 for(const dz of [-.2,.2])k.put('twine',twine,B.x,-.002,B.z+dz,.236,.566,.016);
 k.put('twine',twine,B.x,.27,B.z,.242,.016,.74);// the cross loop 3 mm proud of the long loops
}

function daisha(k){
 const D=BACKROOM.daisha,blue=std(0x2d5fae,{roughness:.5}),bumper=std(0x9fc0e8,{roughness:.6}),black=std(0x22252a,{roughness:.8}),chrome=std(0xd8dde2,{metalness:.8,roughness:.25});
 const deck=canvasTex(256,256,(ctx,w,h)=>{ctx.fillStyle='#2d5fae';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#244d8f';ctx.lineWidth=4;for(let i=-w;i<w*2;i+=18){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+h,h);ctx.stroke();ctx.beginPath();ctx.moveTo(i,h);ctx.lineTo(i+h,0);ctx.stroke();}});
 const g=new THREE.Group();g.position.set(D.x,0,D.z);g.rotation.y=-Math.PI/2;g.name='Daisha with the rice delivery';k.group.add(g);
 const add=(geometry,material,x,y,z)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);g.add(m);return m;};
 add(new THREE.BoxGeometry(.9,.05,.6),[blue,blue,new THREE.MeshStandardMaterial({map:deck,roughness:.5}),blue,blue,blue],0,.135,0);
 add(new THREE.BoxGeometry(.93,.04,.63),bumper,0,.13,0);
 for(const [x,z] of [[-.34,-.22],[.34,-.22],[-.34,.22],[.34,.22]]){add(new THREE.BoxGeometry(.05,.04,.05),chrome,x,.09,z);const w=add(new THREE.CylinderGeometry(.045,.045,.03,14),black,x,.045,z);w.rotation.x=Math.PI/2;}
 // The folding handle at the east end, standing up.
 for(const z of [-.25,.25])add(new THREE.CylinderGeometry(.014,.014,.86,10),chrome,.43,.59,z);
 // The bar's ends sit inside the uprights, turned half a facet so no facet of it lies in one of theirs.
 add(new THREE.CylinderGeometry(.016,.016,.50,10).rotateY(Math.PI/10),chrome,.43,1.02,0).rotation.x=Math.PI/2;
 // Four 番重 of rice: the top one open, onigiri in rows under the lid line.
 const crate=std(0x3d8fcf,{roughness:.4}),rim=std(0x2f74ad,{roughness:.4});
 for(let i=0;i<3;i++){add(new THREE.BoxGeometry(.64,.12,.44),crate,-.05,.22+i*.125,0);add(new THREE.BoxGeometry(.66,.015,.46),rim,-.05,.287+i*.125,0);}
 // The top tray is open: a floor and four low walls, so the onigiri sit inside it.
 const ty=.22+3*.125;
 // The floor and the long walls fit between the end walls (and the floor between the long walls), not flush with them.
 add(new THREE.BoxGeometry(.612,.015,.412),crate,-.05,ty-.052,0);
 for(const z of [-.213,.213])add(new THREE.BoxGeometry(.612,.12,.014),crate,-.05,ty,z);
 for(const x of [-.363,.263])add(new THREE.BoxGeometry(.014,.12,.44),crate,x,ty,0);
 for(const z of [-.22,.22])add(new THREE.BoxGeometry(.66,.015,.02),rim,-.05,ty+.067,z);
 for(let a=0;a<4;a++)for(let b=0;b<2;b++){const o=deliveryOnigiri();o.position.set(-.05-.21+a*.14,ty-.04,-.1+b*.2);o.rotation.y=b?Math.PI:0;g.add(o);}
 // Delivery slip tucked under the top crate's rim.
 const slip=canvasTex(128,96,(ctx,w,h)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(0,0,w,h);say(ctx,'米飯 11:00',w/2,28,20,'#2b2b2b');say(ctx,'おにぎり 32個',w/2,62,18,'#c23a32');});
 const s=new THREE.Mesh(new THREE.PlaneGeometry(.12,.09),new THREE.MeshStandardMaterial({map:slip,roughness:.9,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4}));s.position.set(-.05,ty-.01,-.221);s.rotation.y=Math.PI;g.add(s);
}

function extinguisher(k){
 const E=BACKROOM.extinguisher,red=std(0xd8302b,{roughness:.35,metalness:.2});
 k.mesh(new THREE.BoxGeometry(.26,.04,.26),std(0xb82622),E.x,.02,E.z,'Extinguisher stand');
 k.mesh(new THREE.CylinderGeometry(.085,.085,.46,18),red,E.x,.27,E.z,'Fire extinguisher');
 k.mesh(new THREE.CylinderGeometry(.03,.04,.06,10),std(0x2a2a2a),E.x,.53,E.z,'Extinguisher valve');
 const hose=k.mesh(new THREE.CylinderGeometry(.012,.012,.32,8),std(0x1a1a1a),E.x+.09,.36,E.z+.03,'Extinguisher hose');hose.rotation.z=.2;
 const sign=canvasTex(256,128,(ctx,w,h)=>{ctx.fillStyle='#d8302b';ctx.fillRect(0,0,w,h);say(ctx,'消火器',w/2,h/2,64,'#ffffff','center','900');});
 k.plane(sign,.3,.15,E.x,1.25,-6.745,0,'Extinguisher sign');
}

export function buildSakuraBackroom(room,{anchor,action}={}){
 const k=kit(room,'Sakura back room stock');
 const rack=stockRack(k);
 noticeboard(k);exitSign(k);beerCrates(k);cardboardBundle(k);daisha(k);extinguisher(k);
 k.finish();
 const F=BACKROOM.figurine;
 const plinth=new THREE.Mesh(new THREE.BoxGeometry(.34,F.plinth,.34),std(0x8a6a4a));plinth.position.set(F.x,F.plinth/2,F.z);plinth.name='Thuan figurine plinth';room.add(plinth);
 const figurine=addOwnedCharacter({parent:room,kind:'thuanFigurine',height:F.height,position:[F.x,F.plinth,F.z],yaw:F.yaw,lazy:true});
 if(anchor&&action){
  anchor([F.x-.5,1.0,F.z+.3],'Look at the Thuan figurine',()=>action('inspect','A figurine of Thuan','A carefully painted figurine of Thuan, a present from the town, the year it opened. She says it is too much and keeps it in the back room, where she dusts it every morning before the rice delivery.'));
  const N=BACKROOM.noticeboard;
  anchor([N.x+.5,1.5,N.z],'Read the staff noticeboard',()=>action('inspect',"Backyard · Staff noticeboard",
   "Thuan’s September roster, with her name on nearly every line; the delivery times for rice, drinks and the papers; and the back-room 5S rules in red.\n\nAt the bottom of the roster, in her handwriting: Assistant Manager(Potted plants) — the assistant manager — \"every day, by the window\"."));
  const D=BACKROOM.daisha;
  anchor([D.x,.9,D.z],'Look at the rice delivery',()=>action('inspect',"Banju · The 11:00 rice delivery",
   'Four blue trays of onigiri and bento off the morning van, parked on the daisha at the end of the room. They go out on the shelves before the lunch crowd; the empty trays go back on the 16:00 run.'));
 }
 // The figurine is the town's heaviest model (5 MB) and nobody sees the back room from the street: it is fetched when
 // Johansson comes near the shop or goes in (sakura-shop.js), not with the town (docs/LOADING.md batch 5).
 return {load:()=>figurine.load(),tick(time){rack.led.visible=Math.sin(time*2.4)>-.6;},dispose(){figurine.dispose();}};
}
