import * as THREE from '../../../vendor/three.module.js';
import {GLTFLoader} from '../../../vendor/GLTFLoader.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../../assets.js';

/**
 * Sakura's customer restroom, dressed as a 1990s Okinawan konbini 便所.
 *
 * The sanitary ware is drawn, not boxed (the owner, 26 November 2026: "The toilet and faucet needs to be more
 * realistic can you draw it in cad then redraw it in blender"): a close-coupled toilet against the west wall, its seat
 * down and lid up, with the hand-wash dish and swan-neck spout on its cistern lid, the flush lever on the tank's north
 * side and the stop valve and supply on its south; and a pedestal basin with one cold cross-head pillar tap under the
 * mirror on the south wall. Drawing SK-401 (art/sakura-restroom/): the CAD solids (tools/cad/build-sakura-restroom-cad.py),
 * redrawn in Blender (tools/blender/build-sakura-restroom.py) as assets/models/sakura-restroom/sakura-restroom-fixtures.glb.
 *
 * Around them: mint wall tiles to shoulder height, a grey mosaic floor with a drain, a 花ブロック breeze-block vent high
 * over the toilet with daylight coming through, a wall fan, a paper holder with a spare roll, a glass shelf with a pink
 * soap pump under the mirror, the green soap globe, a blue towel, a fluorescent mirror light, toilet
 * slippers, a little terracotta シーサー on a corner shelf, and the notices: the cleaning sheet with Thuan's hanko on
 * every round, "paper only" and the hand-washing card.
 *
 * Positions are in the shop's frame (sakura-layout.js): the room is x -6.82..-4.09, z -3.95..-2.58, its doorway in the
 * east wall at z -3.66..-2.78. The door is shut until somebody comes to it (RESTROOM_DOOR): you can walk in, flush, wash
 * your hands and read the sheet. The toilet and basin have colliders in sakura-layout.js; the slippers are walked over.
 */
export const RESTROOM=Object.freeze({
 minX:-6.82,maxX:-4.09,minZ:-3.95,maxZ:-2.58,
 mirror:Object.freeze({x:-5.175,y:1.61,z:-3.871,w:.55,h:.62}),
 doorway:Object.freeze({x:-4.09,z:-3.2}),
});

/**
 * The sanitary ware (drawing SK-401). Each fixture's root has its origin on the floor at the wall, its front to +Z.
 * They stand on the face of the wall tiles, 6 mm off the wall, sunk 1 mm so no back face lies in the tiles' plane.
 */
export const RESTROOM_FIXTURES=Object.freeze({
 model:'models/sakura-restroom/sakura-restroom-fixtures.glb',drawing:'SK-401',
 toilet:Object.freeze({node:'Toilet',x:RESTROOM.minX+.005,z:-3.25,yaw:Math.PI/2,width:.46,projection:.76,height:.965,
  who:'Customers of the shop and Thuan herself.',why:'The refill water washes hands on its way into the cistern, so a room with one cold supply needs no second tap for it.'}),
 washbasin:Object.freeze({node:'Washbasin',x:RESTROOM.mirror.x,z:RESTROOM.minZ+.005,yaw:0,width:.5,projection:.43,height:.96,
  who:'Everyone on the way out, and Thuan rinsing the mop cloth.',why:'A pedestal basin hides its trap and has no cupboard to rot in a damp room; one cold tap because the front of the shop has no hot water.'}),
 /** The lever dips this far (radians, about its spindle) for this long when the toilet is flushed. */
 lever:Object.freeze({node:'FlushLever',dip:.55,held:.7}),
});

/**
 * The restroom door (the owner, 26 November 2026: "the door should be closed by default"). A flush plywood leaf hung on
 * the north jamb inside the wall's thickness, opening into the room to stand where the old fixed leaf stood. It is shut
 * until somebody in the shop comes within reach, opens for them and shuts behind them; like the office door it has no
 * collider, so nobody is ever shut in or out. `closed` and `open` are the leaf's yaw about its hinge.
 * Who and why: a customer toilet off a shop floor is kept shut for the smell, the fan's draught and the customer's
 * privacy; the louvre at its foot lets the wall fan draw air through, and the plate says what the door is.
 */
export const RESTROOM_DOOR=Object.freeze({hingeX:-4.076,hingeZ:-2.786,width:.868,height:2.178,thickness:.036,sill:.012,
 closed:Math.PI/2,open:Math.PI,reach:1.25,centre:Object.freeze([-4.05,-3.22])});
/** Where the leaf's far edge sweeps, in plan: nothing that stands on the floor may be inside it. */
export const restroomDoorSwing=Object.freeze({x:RESTROOM_DOOR.hingeX,z:RESTROOM_DOOR.hingeZ,radius:Math.hypot(RESTROOM_DOOR.width,RESTROOM_DOOR.thickness)});
/**
 * How Thuan has dressed the room (the owner, 26 November 2026: "make the room more cute, remember a Japanese cute girl
 * has decorated it"). Every piece is hers and has its reason; the storyteller may use them.
 */
export const RESTROOM_DECOR=Object.freeze([
 {id:'covers',what:'Pink terry covers on the seat and the lid',who:'Thuan',why:'A cold seat in a tiled room is the first thing a customer notices; the covers go in the wash on Sunday.'},
 {id:'mat',what:'A pink mat cut round the foot of the toilet',who:'Thuan',why:'It matches the covers, keeps slippers off cold mosaic and is easier to wash than the floor is to dry.',x0:-6.5,x1:-5.74,z:-3.25,halfWidth:.31,top:.012},
 {id:'slippers',what:'Pink toilet slippers with a white bow',who:'Thuan',why:'Toilet slippers stay in the toilet; pretty ones get put on.'},
 {id:'paper-cover',what:'A gingham cover over the paper and the spare roll',who:'Thuan',why:'It keeps the spare roll dry and off show.'},
 {id:'vase',what:'A bud vase with one hibiscus on the basin\'s ledge beside the tap',who:'Thuan',why:'Cut from the hedge behind the shop each morning; a flower says the room was looked at today.',x:RESTROOM.mirror.x+.16,y:.85,z:RESTROOM.minZ+.05},
 {id:'picture',what:'A small framed drawing of a cat under cherry blossom over the cistern',who:'Thuan',why:'Something kind to look at from the seat, hung where the splash of the hand-wash spout does not reach.',y:1.7,z:-3.25,w:.24,h:.3},
 {id:'towel',what:'A pink-edged hand towel',who:'Thuan',why:'Changed at every cleaning round; the ribbon edge is how she tells the toilet towels from the shop cloths.'},
].map(Object.freeze));

/**
 * Thuan's stickers on the tiles, the door and the mosaic (the owner, 26 November 2026: "Add cute stickers on the wall
 * and floor, maybe use stickers from pocket camera to keep consistency"). They are the Pocket Camera's own Friends
 * sheet (the Office site's camera/stickers/cute, drawn by its tools/draw-cute-stickers.py), copied at their thumbnail
 * size to assets/graphics/sakura-restroom/stickers/, so the town and the camera show the same frog, duck, rabbit, cat
 * and bear. `height` in metres; a floor sticker's `yaw` turns its top to that side (0: top to the south wall).
 */
export const RESTROOM_STICKERS=Object.freeze([
 {id:'frog-rain',on:'west',y:1.19,z:-3.7,height:0.18,aspect:1.012,what:"The frog under its leaf",who:'Thuan',why:"Under the hand-wash spout's own rain, beside the cistern."},
 {id:'bear-hug',on:'north',x:-6.48,y:1.08,height:0.19,aspect:0.566,what:"The bear has a heart for you",who:'Thuan',why:"By the paper holder, where a seated customer's eye rests."},
 {id:'together',on:'south',x:-6.25,y:1.1,height:0.15,aspect:1.58,what:"Frog, duck and rabbit",who:'Thuan',why:"Over the corner by the towel: the three friends, so nobody sits alone."},
 {id:'cat-cup',on:'south',x:-4.74,y:1.0,height:0.18,aspect:1.004,what:"The cat and the cup",who:'Thuan',why:"Beside the basin and the tumbler: the cat is eyeing the cup."},
 {id:'rabbit-shy',on:'door',y:1.3,height:0.17,aspect:0.557,what:"The rabbit cannot look",who:'Thuan',why:"On the inside of the door, covering its eyes: the door is shut, nobody is looking."},
 {id:'duck-run',on:'floor',x:-4.62,z:-3.5,yaw:1.5708,height:0.2,aspect:0.994,what:"The duck is late",who:'Thuan',why:"On the mosaic inside the door, running for the toilet: it shows the way and gets a laugh from anyone in a hurry."},
 {id:'frog-nice',on:'floor',x:-5.175,z:-3.36,yaw:0,height:0.18,aspect:0.934,what:"The frog approves",who:'Thuan',why:"On the mosaic in front of the basin: stand here, wash your hands, the frog approves."},
].map(Object.freeze));

/** The slippers wait just beyond the door's swing, toes to the toilet. */
export const RESTROOM_SLIPPERS=Object.freeze({x:-5.07,z:-3.05,length:.25});

const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';
const canvasTex=(w,h,draw,repeat)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;};
const say=(ctx,s,x,y,size,colour,align='center',weight='bold')=>{ctx.fillStyle=colour;ctx.font=`${weight} ${size}px ${MARU}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);};
const std=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.6,...extra});
const hash=(i,s=0)=>{const n=Math.sin(i*127.1+s*311.7)*43758.5453;return n-Math.floor(n);};
/**
 * Small parts of one material that never move apart (a louvre's slats, a handle and its rose, a flower's petals) drawn as
 * one mesh: each geometry baked where it stood (position, rotation, scale), so the picture is the same and the room costs
 * one draw per kind rather than one per part (tests/owned-display-lod.test.mjs holds Sakura's draws).
 */
function merged(parts,material,label){
 const list=parts.map(({geometry,position=[0,0,0],rotation=[0,0,0],scale=[1,1,1]})=>geometry.applyMatrix4(new THREE.Matrix4().compose(
  new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale))));
 const mesh=new THREE.Mesh(mergeGeometries(list,false),material);mesh.name=label;for(const g of list)g.dispose();
 return mesh;
}
const TILE_TOP=1.35;

function kit(parent){
 const group=new THREE.Group();group.name='Sakura restroom';parent.add(group);
 const mesh=(geometry,material,x,y,z,label='Sakura restroom')=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=label;group.add(m);return m;};
 const box=(w,h,d,x,y,z,material,label)=>mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,label);
 // A flat print on a wall; yaw turns its face (+z) to look into the room.
 const plane=(material,w,h,x,y,z,yaw,label)=>{const m=mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,label);m.rotation.y=yaw;return m;};
 return {group,mesh,box,plane};
}

// ======================================================================= tiles
function tiles(k){
 const R=RESTROOM;
 const wall=canvasTex(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#8fa89c';ctx.fillRect(0,0,w,h);
  const s=64;for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){const r=hash(x+y*7,2);
   ctx.fillStyle=r>.7?'#c4dccf':r<.3?'#b4cdc0':'#bcd4c8';ctx.fillRect(x+2,y+2,s-4,s-4);
   ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x+2,y+2,s-4,3);ctx.fillRect(x+2,y+2,3,s-4);}
 },[1,1]);
 const tileMat=repeatX=>{const t=wall.clone();t.needsUpdate=true;t.repeat.set(repeatX/.3,TILE_TOP/.3);return new THREE.MeshStandardMaterial({map:t,roughness:.35,polygonOffset:true,polygonOffsetFactor:-1});};
 const w=R.maxX-R.minX,d=R.maxZ-R.minZ,cx=(R.minX+R.maxX)/2,cz=(R.minZ+R.maxZ)/2,y=TILE_TOP/2;
 k.plane(tileMat(d),d,TILE_TOP,R.minX+.006,y,cz,Math.PI/2,'Restroom wall tiles');
 k.plane(tileMat(w),w,TILE_TOP,cx,y,R.maxZ-.006,Math.PI,'Restroom wall tiles');
 k.plane(tileMat(w),w,TILE_TOP,cx,y,R.minZ+.006,0,'Restroom wall tiles');
 // The east wall is mostly doorway: tile the two jambs either side of it.
 for(const [z0,z1] of [[R.minZ,-3.7],[-2.76,R.maxZ]])k.plane(tileMat(z1-z0),z1-z0,TILE_TOP,R.maxX-.006,y,(z0+z1)/2,-Math.PI/2,'Restroom wall tiles');
 // A bullnose cap along the top course.
 const cap=std(0x7f998c,{roughness:.3});
 k.box(.02,.03,d,R.minX+.01,TILE_TOP,cz,cap);k.box(w,.03,.02,cx,TILE_TOP,R.maxZ-.01,cap);k.box(w,.03,.02,cx,TILE_TOP,R.minZ+.01,cap);
 // Grey mosaic floor, a little darker round the drain, laid flush: the shop's terrazzo is cut round it (sakura-shell.js).
 const floor=canvasTex(256,256,(ctx,W,H)=>{
  ctx.fillStyle='#4a524f';ctx.fillRect(0,0,W,H);
  const s=16;for(let y=0;y<H;y+=s)for(let x=0;x<W;x+=s){const c=118+Math.floor(hash(x*3+y,5)*26);ctx.fillStyle=`rgb(${c-4},${c+4},${c})`;ctx.fillRect(x+1,y+1,s-2,s-2);}
 },[w/.5,d/.5]);
 const f=k.plane(new THREE.MeshStandardMaterial({map:floor,roughness:.5}),w,d,cx,0,cz,0,'Restroom mosaic floor');f.rotation.x=-Math.PI/2;
 const drain=k.mesh(new THREE.CylinderGeometry(.07,.07,.006,20),std(0x9aa3a8,{metalness:.6,roughness:.3}),-5.6,.006,-3.0,'Restroom floor drain');
 for(let i=-2;i<=2;i++)k.box(.11,.008,.008,drain.position.x,.008,drain.position.z+i*.022,std(0x2a2e30));
}

// ======================================================= vent, fan and light
function ventilation(k){
 const R=RESTROOM;
 // 花ブロック: concrete breeze blocks with the light coming through the holes.
 const block=canvasTex(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#c8cec6';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#8c948c';ctx.lineWidth=6;ctx.strokeRect(3,3,w-6,h-6);
  ctx.globalCompositeOperation='destination-out';
  for(const [x,y] of [[64,64],[192,64],[64,192],[192,192]]){ctx.beginPath();ctx.arc(x,y,40,0,Math.PI*2);ctx.fill();}
  ctx.beginPath();ctx.moveTo(128,96);ctx.lineTo(160,128);ctx.lineTo(128,160);ctx.lineTo(96,128);ctx.closePath();ctx.fill();
 },[3,1]);
 const glow=k.plane(new THREE.MeshBasicMaterial({color:0xd8f2dc,toneMapped:false}),.88,.28,R.minX+.008,2.2,-3.27,Math.PI/2,'Restroom vent daylight');void glow;
 k.plane(new THREE.MeshStandardMaterial({map:block,transparent:true,alphaTest:.5,roughness:.9,side:THREE.DoubleSide}),.9,.3,R.minX+.03,2.2,-3.27,Math.PI/2,'Restroom hana-block vent');
 k.box(.06,.025,.96,R.minX+.03,2.04,-3.27,std(0xb9bfb7));
 // Wall fan high on the north wall, over the door side, with its pull cord.
 const fan=new THREE.Group();fan.position.set(-4.62,2.25,R.maxZ-.035);fan.rotation.y=Math.PI;fan.name='Restroom wall fan';k.group.add(fan);
 const frame=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.06),std(0xd6cebe));fan.add(frame);
 const grille=new THREE.Mesh(new THREE.TorusGeometry(.11,.006,6,24),std(0x9a9588));grille.position.z=.035;fan.add(grille);
 const blades=new THREE.Group();blades.position.z=.03;fan.add(blades);
 for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.04,.1,.005),std(0x3b4652));b.rotation.z=i*Math.PI/2;b.position.set(-.05*Math.sin(i*Math.PI/2),.05*Math.cos(i*Math.PI/2),0);blades.add(b);}
 const cord=new THREE.Mesh(new THREE.CylinderGeometry(.002,.002,.5,5),std(0xf2f0ea));cord.position.set(.12,-.38,.03);fan.add(cord);
 const pull=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),std(0xd7263d));pull.position.set(.12,-.64,.03);fan.add(pull);
 // Fluorescent bar over the mirror.
 const M=RESTROOM.mirror;
 k.box(.5,.05,.07,M.x,M.y+.43,R.minZ+.035,std(0xe2ddd0),'Mirror light');
 k.mesh(new THREE.CylinderGeometry(.012,.012,.44,10),new THREE.MeshStandardMaterial({color:0xfffbe6,emissive:0xfff3c9,emissiveIntensity:1}),M.x,M.y+.40,R.minZ+.07,'Mirror light tube').rotation.z=Math.PI/2;
 return blades;
}

// ======================================================================= toilet
function toiletFittings(k){
 const chrome=std(0xc6ccd2,{metalness:.8,roughness:.25});
 // Paper holder on the north wall beside the toilet, the spare roll on top, under Thuan's gingham cover.
 const Z=RESTROOM.maxZ-.06,pink=0xf3a3b5,rose=0xe57f98;
 k.box(.16,.012,.12,-6.15,.78,Z,chrome,'Paper holder');
 k.mesh(new THREE.CylinderGeometry(.055,.055,.11,16),std(0xfaf8f2,{roughness:.95}),-6.15,.72,Z,'Paper roll').rotation.z=Math.PI/2;
 k.mesh(new THREE.CylinderGeometry(.052,.052,.11,16),std(0xfff3f6,{roughness:.95}),-6.15,.84,Z+.005,'Spare paper roll').rotation.z=Math.PI/2;
 const gingham=canvasTex(64,64,(ctx,w,h)=>{ctx.fillStyle='#fff6f8';ctx.fillRect(0,0,w,h);ctx.fillStyle='rgba(240,120,150,.55)';for(let i=0;i<4;i++){ctx.fillRect(i*16,0,8,h);ctx.fillRect(0,i*16,w,8);}},[3,2]);
 const cloth=new THREE.MeshStandardMaterial({map:gingham,roughness:.95,side:THREE.DoubleSide});
 // The cover: a half barrel over the spare roll and a flap hanging in front of the roll in use.
 const hood=k.mesh(new THREE.CylinderGeometry(.062,.062,.15,18,1,true,0,Math.PI),cloth,-6.15,.84,Z+.005,'Paper cover');hood.rotation.z=Math.PI/2;
 k.plane(cloth,.15,.1,-6.15,.775,Z-.068,Math.PI,'Paper cover flap');
 // Pink vinyl slippers with a white bow, inside the door, clear of its swing, toes to the toilet.
 const vinyl=std(pink,{roughness:.45}),white=std(0xfffaf4,{roughness:.6});
 for(const s of [-1,1]){
  const g=new THREE.Group();g.position.set(RESTROOM_SLIPPERS.x,0,RESTROOM_SLIPPERS.z+s*.07);g.rotation.y=-Math.PI/2-s*.06;g.name='Toilet slipper';k.group.add(g);
  const sole=new THREE.Mesh(new THREE.BoxGeometry(.09,.02,.25),vinyl);sole.position.y=.01;g.add(sole);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.1,12,1,true,-Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({color:pink,roughness:.45,side:THREE.DoubleSide}));
  band.rotation.x=Math.PI/2;band.position.set(0,.02,.06);g.add(band);
  for(const b of [-1,1]){const loop=new THREE.Mesh(new THREE.SphereGeometry(.013,8,6),white);loop.scale.set(1.3,.7,.8);loop.position.set(b*.016,.071,.05);g.add(loop);}
  const knot=new THREE.Mesh(new THREE.SphereGeometry(.007,8,6),std(rose));knot.position.set(0,.072,.05);g.add(knot);
 }
 // The mat, cut round the toilet's foot: a soft slab whose top stands 12 mm clear of the mosaic (its underside is below the floor, not in its plane).
 const M=RESTROOM_DECOR.find(d=>d.id==='mat'),shape=new THREE.Shape(),r=.09,L=M.x1-M.x0,W=M.halfWidth;
 // Drawn in the mat's own plane: u along the room's x from the wall end, v across; the notch takes the foot (0.26 wide).
 shape.moveTo(0,-W+r);shape.quadraticCurveTo(0,-W,r,-W);shape.lineTo(L-r,-W);shape.quadraticCurveTo(L,-W,L,-W+r);shape.lineTo(L,W-r);shape.quadraticCurveTo(L,W,L-r,W);shape.lineTo(r,W);shape.quadraticCurveTo(0,W,0,W-r);
 shape.lineTo(0,.15);shape.lineTo(.2,.15);shape.absarc(.2,0,.15,Math.PI/2,-Math.PI/2,true);shape.lineTo(0,-.15);shape.closePath();
 const matGeo=new THREE.ExtrudeGeometry(shape,{depth:M.top+.004,bevelEnabled:false,curveSegments:10});matGeo.rotateX(-Math.PI/2);
 const mat=k.mesh(matGeo,std(pink,{roughness:1}),M.x0,-.004,M.z,'Toilet mat');mat.receiveShadow=true;
 // The framed drawing over the cistern: a cat under cherry blossom.
 const P=RESTROOM_DECOR.find(d=>d.id==='picture'),X=RESTROOM.minX;
 const art=canvasTex(192,240,(ctx,w,h)=>{
  ctx.fillStyle='#fff7ef';ctx.fillRect(0,0,w,h);
  ctx.strokeStyle='#8a5a3c';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-5,40);ctx.quadraticCurveTo(70,30,150,70);ctx.stroke();
  const petal=(x,y,s)=>{ctx.fillStyle='#f7a8c0';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x+Math.cos(i*1.2566)*s,y+Math.sin(i*1.2566)*s,s*.75,s*.75,0,0,7);ctx.fill();}ctx.fillStyle='#f6d36b';ctx.beginPath();ctx.arc(x,y,s*.45,0,7);ctx.fill();};
  petal(40,36,9);petal(92,44,10);petal(140,64,9);petal(66,62,6);petal(168,104,5);petal(24,96,5);
  // The cat: a round white head, two ears, sleepy eyes, a pink nose.
  ctx.fillStyle='#ffffff';ctx.strokeStyle='#5b4a44';ctx.lineWidth=4;ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(54,128);ctx.lineTo(60,92);ctx.lineTo(86,112);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(138,128);ctx.lineTo(132,92);ctx.lineTo(106,112);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.ellipse(96,156,52,44,0,0,7);ctx.fill();ctx.stroke();
  ctx.lineWidth=3.5;for(const x of [76,116]){ctx.beginPath();ctx.arc(x,152,8,.15*Math.PI,.85*Math.PI);ctx.stroke();}
  ctx.fillStyle='#f28aa6';ctx.beginPath();ctx.ellipse(96,166,5,3.5,0,0,7);ctx.fill();
  ctx.beginPath();ctx.moveTo(96,170);ctx.quadraticCurveTo(88,180,82,174);ctx.moveTo(96,170);ctx.quadraticCurveTo(104,180,110,174);ctx.stroke();
  ctx.fillStyle='rgba(247,168,192,.6)';for(const x of [62,130]){ctx.beginPath();ctx.ellipse(x,170,8,5,0,0,7);ctx.fill();}
 });
 k.box(.018,P.h+.03,P.w+.03,X+.017,P.y,P.z,std(0xf6d9dd,{roughness:.6}),'Restroom picture frame');
 k.plane(new THREE.MeshStandardMaterial({map:art,roughness:.8}),P.w,P.h,X+.029,P.y,P.z,Math.PI/2,'Restroom picture');
}

// ============================================================== sanitary ware
/** Plain stand-ins, used only where the drawn model cannot be had (a test without a page, a failed download). */
function plainFixtures(k){
 const porcelain=std(0xf6f4ee,{roughness:.82}),R=RESTROOM,F=RESTROOM_FIXTURES,g=new THREE.Group();g.name='Restroom plain fixtures';k.group.add(g);
 const span=(x0,x1,y0,y1,z0,z1,label)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),porcelain);m.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);m.name=label;g.add(m);};
 const tx=F.toilet.x+.02;
 span(tx,tx+.2,.4,.82,-3.46,-3.04,'Plain cistern');span(tx,tx+.74,.012,.39,-3.42,-3.08,'Plain toilet bowl');span(tx+.25,tx+.75,.395,.42,-3.44,-3.06,'Plain toilet seat');
 const bz=F.washbasin.z+.004;
 span(R.mirror.x-.25,R.mirror.x+.25,.7,.85,bz,bz+.42,'Plain basin');span(R.mirror.x-.09,R.mirror.x+.09,.012,.69,bz+.04,bz+.22,'Plain basin pedestal');
 return g;
}
/** Stands the drawn fixtures in the room and returns the parts that move. */
function mountFixtures(k,scene){
 const F=RESTROOM_FIXTURES,group=new THREE.Group();group.name='Restroom sanitary ware';
 for(const key of ['toilet','washbasin']){
  const o=scene.getObjectByName(F[key].node);if(!o)throw new Error('The restroom model has no '+F[key].node);
  o.position.set(F[key].x,0,F[key].z);o.rotation.set(0,F[key].yaw,0);group.add(o);
 }
 group.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])m.dithering=true;}});
 k.group.add(group);
 return {group,lever:group.getObjectByName(F.lever.node)||null};
}
function sanitaryWare(k){
 const state={lever:null,plain:null,group:null,disposed:false};
 const page=typeof document!=='undefined'&&!!document.baseURI&&typeof fetch==='function';
 if(!page){state.plain=plainFixtures(k);state.ready=Promise.resolve(false);return state;}
 state.ready=new GLTFLoader().loadAsync(assetURL(RESTROOM_FIXTURES.model)).then(gltf=>{
  if(state.disposed)return false;
  Object.assign(state,mountFixtures(k,gltf.scene));return true;
 }).catch(error=>{console.warn('Sakura restroom: the drawn fixtures are not available, plain ones stand in',error);if(!state.disposed)state.plain=plainFixtures(k);return false;});
 return state;
}

// ================================================================== the stickers
function stickers(k,doorPivot){
 const R=RESTROOM,page=!!globalThis.document?.baseURI&&typeof Image!=='undefined',OFF=.0045;
 for(const S of RESTROOM_STICKERS){
  // A die-cut print on what it is stuck to: a decal, cut by its own outline.
  const material=new THREE.MeshStandardMaterial({color:page?0xffffff:0xf6c6d2,roughness:.55,alphaTest:.5,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4});
  if(page)new THREE.TextureLoader().load(assetURL('graphics/sakura-restroom/stickers/'+S.id+'.webp'),t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;material.map=t;material.needsUpdate=true;});
  const w=S.height*S.aspect,h=S.height,label='Restroom sticker '+S.id;
  // The tiles' face is 6 mm off each wall; a sticker lies on it.
  if(S.on==='west')k.plane(material,w,h,R.minX+.006+OFF,S.y,S.z,Math.PI/2,label);
  else if(S.on==='north')k.plane(material,w,h,S.x,S.y,R.maxZ-.006-OFF,Math.PI,label);
  else if(S.on==='south')k.plane(material,w,h,S.x,S.y,R.minZ+.006+OFF,0,label);
  else if(S.on==='floor'){const m=k.plane(material,w,h,S.x,.007,S.z,0,label);m.rotation.set(-Math.PI/2,0,S.yaw);}
  else if(S.on==='door'){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(RESTROOM_DOOR.width/2,S.y,-OFF);m.rotation.y=Math.PI;m.name=label;doorPivot.add(m);}
 }
}

// ====================================================================== the door
function buildRestroomDoor(k){
 const D=RESTROOM_DOOR,pivot=new THREE.Group();pivot.name='Sakura restroom door';pivot.position.set(D.hingeX,0,D.hingeZ);pivot.rotation.y=D.closed;k.group.add(pivot);
 const leafMat=std(0xd8cdb4,{roughness:.62}),trim=std(0xb9ab8c,{roughness:.66}),metal=std(0xb8b2a4,{metalness:.6,roughness:.3});
 const part=(w,h,d,x,y,z,m,label)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.name=label;pivot.add(o);return o;};
 // The leaf lies along the pivot's +x; its faces are at z 0 (the room) and z thickness (the shop).
 const W=D.width,H=D.height,T=D.thickness,mid=T/2;
 part(W,H,T,W/2,D.sill+H/2,mid,leafMat,'Sakura restroom door leaf');
 // Both faces: the louvre at the foot that lets the wall fan draw air through, a lever handle on its rose.
 const indicator=std(0x2f9a62,{roughness:.5}),frames=[],slats=[],handles=[];
 for(const s of [-1,1]){
  const face=mid+s*T/2;
  frames.push({geometry:new THREE.BoxGeometry(.46,.26,.008),position:[W/2,.33,face+s*.004]});
  for(let i=0;i<4;i++)slats.push({geometry:new THREE.BoxGeometry(.4,.022,.01),position:[W/2,.25+i*.054,face+s*.013],rotation:[s*.5,0,0]});
  handles.push({geometry:new THREE.BoxGeometry(.05,.15,.008),position:[W-.07,1.0,face+s*.004]},
   {geometry:new THREE.BoxGeometry(.022,.022,.045),position:[W-.07,1.03,face+s*.03]},{geometry:new THREE.BoxGeometry(.12,.02,.02),position:[W-.12,1.03,face+s*.055]});
 }
 pivot.add(merged(frames,trim,'Restroom door louvre frames'),merged(slats,leafMat,'Restroom door louvre slats'),merged(handles,metal,'Restroom door handles'));
 // The shop side: the plate that says what the door is, and the little window that shows green for free, red for in use.
 const face=T;
 const plate=canvasTex(160,160,(ctx,w,h)=>{ctx.fillStyle='#fbfaf4';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#2f5fb8';ctx.lineWidth=8;ctx.strokeRect(8,8,w-16,h-16);say(ctx,'Toilet',w/2,h/2+2,40,'#1e3a8a');});
 part(.17,.17,.005,W/2,1.56,face+.0025,std(0xfbfaf4,{roughness:.5}),'Restroom door plate');
 const print=new THREE.Mesh(new THREE.PlaneGeometry(.16,.16),new THREE.MeshStandardMaterial({map:plate,roughness:.5,polygonOffset:true,polygonOffsetFactor:-1}));
 print.position.set(W/2,1.56,face+.0085);print.name='Restroom door plate print';pivot.add(print);
 part(.034,.018,.004,W-.07,.945,face+.0105,indicator,'Restroom door indicator');
 let angle=D.closed,occupied=false;
 const R=RESTROOM;
 return {pivot,get angle(){return angle;},get occupied(){return occupied;},
  /** points: [x,z] pairs of whoever is in the shop, in its frame; dt in seconds. */
  update(dt,points=[]){
   const near=points.some(p=>p&&Math.hypot(p[0]-D.centre[0],p[1]-D.centre[1])<D.reach);
   const target=near?D.open:D.closed,step=Math.min(1,dt*(near?6:3.5));
   angle+=(target-angle)*step;if(Math.abs(target-angle)<.002)angle=target;
   pivot.rotation.y=angle;
   const inside=points.some(p=>p&&p[0]>R.minX&&p[0]<R.maxX&&p[1]>R.minZ&&p[1]<R.maxZ);
   if(inside!==occupied){occupied=inside;indicator.color.set(occupied?0xd0312d:0x2f9a62);}
  }};
}

// ============================================================== basin and mirror
function basinFittings(k){
 const R=RESTROOM,M=R.mirror,chrome=std(0xc6ccd2,{metalness:.8,roughness:.25});
 // The mirror reads as glass: cool grey with a soft sheen across it.
 const sheen=canvasTex(128,160,(ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#c9d4d8');g.addColorStop(1,'#93a2a8');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(56,0);ctx.lineTo(-10,h*.7);ctx.lineTo(-10,h*.35);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.moveTo(78,0);ctx.lineTo(92,0);ctx.lineTo(30,h);ctx.lineTo(16,h);ctx.fill();
 });
 k.plane(new THREE.MeshStandardMaterial({map:sheen,roughness:.08,metalness:.35}),M.w,M.h,M.x,M.y,M.z+.005,0,'Restroom mirror glass');
 // Glass shelf under the mirror: the pink pump, a cup and a toothbrush someone forgot.
 const y=M.y-.37;
 k.box(.5,.01,.09,M.x,y,R.minZ+.06,new THREE.MeshStandardMaterial({color:0xcfe6e4,roughness:.1,transparent:true,opacity:.6}),'Mirror shelf');
 for(const s of [-1,1])k.box(.02,.03,.08,M.x+s*.24,y-.015,R.minZ+.05,chrome);
 k.mesh(new THREE.CylinderGeometry(.03,.034,.1,14),std(0xf06b8a,{roughness:.35}),M.x-.15,y+.055,R.minZ+.06,'Soap pump');
 k.mesh(new THREE.CylinderGeometry(.008,.008,.03,8),std(0xf2ede0),M.x-.15,y+.12,R.minZ+.06);
 k.box(.04,.012,.02,M.x-.135,y+.137,R.minZ+.06,std(0xf2ede0),'Soap pump head');
 const label=canvasTex(64,64,(ctx,w,h)=>{ctx.fillStyle='#f06b8a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffffff';ctx.fillRect(6,18,w-12,28);say(ctx,"Hand",w/2,32,14,'#c4566e');});
 k.plane(new THREE.MeshStandardMaterial({map:label,roughness:.4}),.04,.04,M.x-.15,y+.055,R.minZ+.0945,0,'Soap pump label');
 k.mesh(new THREE.CylinderGeometry(.03,.026,.08,14),new THREE.MeshStandardMaterial({color:0xa9d8e6,roughness:.2,transparent:true,opacity:.75}),M.x+.12,y+.045,R.minZ+.06,'Tumbler');
 // Thuan's bud vase with one hibiscus, on the basin's ledge beside the tap.
 const VASE=RESTROOM_DECOR.find(d=>d.id==='vase'),V=VASE.x,vz=VASE.z;
 k.mesh(new THREE.CylinderGeometry(.012,.022,.07,12),new THREE.MeshStandardMaterial({color:0xf7c9d6,roughness:.25}),V,VASE.y+.04,vz,'Bud vase');
 k.mesh(new THREE.CylinderGeometry(.003,.003,.07,6),std(0x4f8a4a),V,VASE.y+.105,vz,'Hibiscus stem');
 k.group.add(merged(Array.from({length:5},(_,i)=>{const a=i*Math.PI*2/5;return {geometry:new THREE.SphereGeometry(.017,10,8),position:[V+Math.cos(a)*.016,VASE.y+.145+Math.sin(a)*.016,vz+.012],scale:[1,1,.35]};}),
  std(0xe8436a,{roughness:.7}),'Hibiscus petals'));
 k.mesh(new THREE.SphereGeometry(.007,8,6),std(0xf6d36b),V,VASE.y+.145,vz+.022,'Hibiscus heart');
 // The green soap globe on its wall bracket, right of the mirror.
 k.box(.02,.08,.04,-4.7,1.3,R.minZ+.012,chrome,'Soap globe bracket');
 k.box(.016,.016,.08,-4.7,1.31,R.minZ+.05,chrome);
 k.mesh(new THREE.SphereGeometry(.05,16,12),std(0x27b07a,{roughness:.2}),-4.7,1.31,R.minZ+.1,'Green soap globe');// solid: a see-through globe showed the tiles and its own bracket through it
 k.mesh(new THREE.CylinderGeometry(.007,.007,.03,8),chrome,-4.7,1.245,R.minZ+.1,'Soap globe plunger');
 // A blue towel on a ring, between the toilet and the basin.
 const ring=k.mesh(new THREE.TorusGeometry(.05,.007,8,18),chrome,-5.7,1.2,R.minZ+.03,'Towel ring');void ring;
 k.box(.13,.34,.02,-5.7,1.0,R.minZ+.039,std(0x2f6fd0,{roughness:.95}),'Hand towel');
 k.box(.13,.02,.03,-5.7,1.155,R.minZ+.04,std(0x2a62b8,{roughness:.95}));
 k.box(.138,.034,.026,-5.7,.843,R.minZ+.039,std(0xf3a3b5,{roughness:.95}),'Hand towel ribbon edge');
}

// ================================================================ notices, shisa
function notices(k){
 const R=RESTROOM;
 // The notices say it with a picture and a few words that fit their card (the owner, 26 November 2026: "Signs can't be
 // truncated like this, add icons to explain. And reduce the big English bits that flow over").
 const tex=canvasTex(640,512,(ctx,w,h)=>{
  ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineJoin='round';
  const tape=(x,y)=>{ctx.fillStyle='rgba(245,214,120,.75)';ctx.fillRect(x-16,y-7,32,14);};
  /** Words set no wider than `max`: the size comes down until they fit. */
  const fit=(text,x,y,size,max,colour,weight='bold')=>{let px=size;ctx.font=`${weight} ${px}px ${MARU}`;while(px>9&&ctx.measureText(text).width>max){px-=1;ctx.font=`${weight} ${px}px ${MARU}`;}say(ctx,text,x,y,px,colour,'center',weight);};
  const ring=(x,y,r,colour,width)=>{ctx.strokeStyle=colour;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();};
  const roll=(x,y,s)=>{ctx.fillStyle='#ffffff';ctx.strokeStyle='#5b6b7a';ctx.lineWidth=4;ctx.beginPath();ctx.rect(x-s*.1,y-s*.5,s*.75,s);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(x-s*.1,y,s*.3,s*.5,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.ellipse(x-s*.1,y,s*.09,s*.16,0,0,Math.PI*2);ctx.stroke();};
  const tick=(x,y,s,colour)=>{ctx.strokeStyle=colour;ctx.lineWidth=s*.22;ctx.beginPath();ctx.moveTo(x-s*.45,y);ctx.lineTo(x-s*.1,y+s*.35);ctx.lineTo(x+s*.5,y-s*.4);ctx.stroke();};
  const drop=(x,y,s,colour)=>{ctx.fillStyle=colour;ctx.beginPath();ctx.moveTo(x,y-s);ctx.quadraticCurveTo(x+s*.8,y+s*.1,x,y+s*.6);ctx.quadraticCurveTo(x-s*.8,y+s*.1,x,y-s);ctx.fill();};
  // 1. Paper only: the roll with a tick, a bottle and a can crossed out.
  ctx.fillStyle='#fffdf6';ctx.fillRect(16,16,300,250);ctx.strokeStyle='#2f5fb8';ctx.lineWidth=6;ctx.strokeRect(24,24,284,234);
  fit('Paper only',166,62,40,240,'#1e3a8a');
  roll(98,146,56);ring(98,146,50,'#2f9a62',7);tick(138,186,26,'#2f9a62');
  ctx.fillStyle='#8fb7d9';ctx.fillRect(214,118,24,58);ctx.fillRect(221,104,10,16);ctx.fillStyle='#d9a441';ctx.fillRect(246,138,26,38);
  ring(240,146,50,'#d0312d',7);ctx.strokeStyle='#d0312d';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(205,111);ctx.lineTo(275,181);ctx.stroke();
  fit('Thank you',166,230,22,240,'#333333','normal');
  tape(30,18);tape(302,18);
  // 2. The cleaning rounds: a time, a tick and Thuan's hanko on every one.
  ctx.fillStyle='#ffffff';ctx.fillRect(340,24,280,300);fit('Cleaned today',480,56,28,240,'#2b2b2b');
  ['7:00','11:00','14:00','18:00','21:30'].forEach((t,i)=>{const y=100+i*44;ctx.strokeStyle='#c9c4b6';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(352,y+22);ctx.lineTo(608,y+22);ctx.stroke();
   say(ctx,t,362,y,22,'#333','left','normal');tick(476,y,22,'#2f9a62');
   ring(560,y,18,'#d0312d',3);fit('Thuan',560,y,13,30,'#d0312d');});
  tape(480,26);
  // 3. Wash your hands: soap, rub, fifteen seconds of water, dry.
  ctx.fillStyle='#ecfaf2';ctx.fillRect(40,300,270,190);ctx.strokeStyle='#2f9a62';ctx.lineWidth=4;ctx.strokeRect(46,306,258,178);
  fit('Wash your hands',175,336,26,230,'#1f7a4a');
  const cx=[82,144,206,268],cy=398;
  ctx.fillStyle='#f06b8a';ctx.fillRect(cx[0]-12,cy-8,24,30);ctx.fillRect(cx[0]-4,cy-22,8,14);ctx.fillRect(cx[0]-4,cy-24,18,6);
  ctx.fillStyle='#f4c9a8';for(const d of [-9,9]){ctx.beginPath();ctx.ellipse(cx[1]+d,cy+4,10,17,d>0?.35:-.35,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#ffffff';ctx.strokeStyle='#8fc7dd';ctx.lineWidth=2;for(const [dx,dy,r] of [[-14,-16,6],[2,-22,8],[16,-14,5]]){ctx.beginPath();ctx.arc(cx[1]+dx,cy+dy,r,0,Math.PI*2);ctx.fill();ctx.stroke();}
  drop(cx[2]-10,cy-6,13,'#4aa3d8');drop(cx[2]+10,cy+6,13,'#4aa3d8');
  ctx.fillStyle='#2f6fd0';ctx.fillRect(cx[3]-13,cy-20,26,42);ctx.fillStyle='#f3a3b5';ctx.fillRect(cx[3]-13,cy+14,26,8);
  ctx.strokeStyle='#1f7a4a';ctx.lineWidth=3;for(let i=0;i<3;i++){const x=(cx[i]+cx[i+1])/2;ctx.beginPath();ctx.moveTo(x-6,cy-6);ctx.lineTo(x+5,cy);ctx.lineTo(x-6,cy+6);ctx.stroke();}
  ['Soap','Rub','15 s','Dry'].forEach((t,i)=>fit(t,cx[i],458,18,52,'#245a3e'));
  tape(175,300);
  // 4. さんぴん茶, cold at the till.
  ctx.save();ctx.translate(480,420);ctx.rotate(-.05);ctx.fillStyle='#fde68a';ctx.fillRect(-120,-70,240,140);ctx.strokeStyle='#b7791f';ctx.lineWidth=4;ctx.strokeRect(-114,-64,228,128);
  ctx.fillStyle='#fffaf0';ctx.strokeStyle='#7a4a0c';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-98,-30);ctx.lineTo(-58,-30);ctx.lineTo(-64,24);ctx.lineTo(-92,24);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#d9a441';ctx.beginPath();ctx.moveTo(-95,-12);ctx.lineTo(-61,-12);ctx.lineTo(-65,21);ctx.lineTo(-91,21);ctx.closePath();ctx.fill();
  fit('Jasmine tea',28,-24,30,150,'#7a4a0c');fit('¥110',28,14,34,150,'#c23a32');fit('Cold, at the till',28,46,16,150,'#8a5a12','normal');ctx.restore();
 });
 k.plane(new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.05,roughness:.9}),.78,.62,-5.22,1.68,R.maxZ-.008,Math.PI,'Restroom notices');// west of the fan's pull cord, which hangs at x -4.74
 // A terracotta シーサー on a corner shelf, keeping an eye on the place.
 const S={x:-6.62,y:1.62,z:R.maxZ-.13};
 k.box(.26,.022,.22,S.x,S.y,S.z,std(0x7a4a26),'Shisa shelf');
 const clay=std(0xb0542c,{roughness:.8}),dark=std(0x4a1e10);
 const g=new THREE.Group();g.position.set(S.x,S.y+.011,S.z);g.rotation.y=Math.PI*.8;g.name='Shisa';k.group.add(g);
 const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
 add(new THREE.BoxGeometry(.07,.08,.1),clay,0,.04,0);
 add(new THREE.SphereGeometry(.045,12,10),clay,0,.11,.035);
 for(const s of [-1,1]){add(new THREE.SphereGeometry(.014,8,6),clay,s*.035,.15,.03);add(new THREE.SphereGeometry(.008,6,5),dark,s*.017,.12,.073);}
 add(new THREE.BoxGeometry(.05,.016,.02),dark,0,.09,.075);
 for(let i=0;i<5;i++)add(new THREE.SphereGeometry(.014,6,5),clay,(i-2)*.016,.15+Math.abs(i-2)*-.006,.0);
 add(new THREE.ConeGeometry(.02,.06,6),clay,0,.08,-.06).rotation.x=-.8;
}

export function buildSakuraRestroom(room,{anchor,action}={}){
 const k=kit(room);
 tiles(k);const blades=ventilation(k);toiletFittings(k);basinFittings(k);notices(k);
 const ware=sanitaryWare(k),door=buildRestroomDoor(k),L=RESTROOM_FIXTURES.lever;stickers(k,door.pivot);
 let now=0,flushedAt=-9,dip=0;
 if(anchor&&action){
  const D=RESTROOM.doorway;
  anchor([D.x-.25,1.35,D.z],'Look into the restroom',()=>action('inspect',"Toilet · The restroom",
   "Mint tiles, a mosaic floor still damp from the last mop, and the breeze-block vent letting the afternoon in over the cistern. The fan rattles on its cord.\n\nThuan has dressed it her way: pink terry on the seat and the lid, a mat to match, a hibiscus in a bud vase, a sleepy cat under cherry blossom over the cistern, and her frog, duck, rabbit, cat and bear stickers on the tiles and the mosaic.\n\nSlip on the pink slippers and go in. The little Shisa on the corner shelf has seen it all."));
  anchor([-6.4,1.0,-3.0],'Flush the toilet',()=>{flushedAt=now;action('inspect',"Toilet · Flush",
   'You press the lever. The cistern roars, then the swan-neck spout on its lid runs clean water into the dish on top while the tank fills again: wash your hands on the way out, the way the old cisterns ask you to.');});
  anchor([-5.18,1.15,-3.55],'Wash your hands',()=>action('inspect',"Toilet · Wash your hands",
   'One push of the green soap globe, a turn of the cross-head tap for cold water, and the blue towel on its ring. The card on the wall says fifteen seconds under running water. You count them.'));
  anchor([-5.22,1.6,-2.75],'Read the cleaning sheet',()=>action('inspect',"Cleaning checklist · Cleaning rounds",
   "7:00, 11:00, 14:00, 18:00, 21:30: a green tick on every round, each with the same small red hanko: Thuan.\nBeside it, in blue: Paper only, with the roll ticked and a bottle and a can crossed out.\nBelow, how to wash your hands in four pictures, and a card for jasmine tea, ¥110, cold at the till."));
 }
 const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 return {door,ready:ware.ready,
  tick(time){
   const dt=Math.min(.1,Math.max(0,time-now));now=time;blades.rotation.z=reduce?0:time*9;
   // The lever is pressed down and let go: it does not jump.
   const target=time-flushedAt<L.held?L.dip:0;dip+=(target-dip)*Math.min(1,dt*(target?18:7));if(Math.abs(target-dip)<.002)dip=target;
   if(ware.lever)ware.lever.rotation.x=dip;
  },
  dispose(){ware.disposed=true;}};
}
