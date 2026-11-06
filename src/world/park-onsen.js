import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../assets.js';
import {registerDetail} from './detail-stream.js';
import {ONSEN_SIGNS} from './interiors/onsen-signs.js';
import {frostedGlassTexture} from './interiors/onsen-front.js';
import {windowGlow,poolGlow,lanternGlow} from '../render/dusk.js';
import {createLampGlow} from './light-pools.js';

/**
 * Umi-no-yu, the town's public sea-water bath, in the level Harbour Park opposite Sakura.
 *
 * The bathhouse faces the town with the footbath out front where anybody crossing the
 * park can sit and put their feet in; the rock bath is behind it inside a bamboo fence
 * that is kept low on the sea side, so from the water you look out over the seawall.
 * The building is a Blender model (tools/blender/build-park-onsen.py), authored facing
 * +Z; here it is turned so that +Z is west.
 *
 * Collision and prompts are in place from the start and the model streams in when you
 * come near, the way every other building here does: loading a model never moves a
 * wall. A lightweight shell, noren, signs, door glass and steam are visible from the
 * first frame, including when the detailed asset is unavailable.
 */
import {ONSEN,ONSEN_DOOR,ONSEN_APPROACH,onsenPoint,onsenOpen} from './onsen-layout.js';
export {ONSEN,onsenPoint,onsenOpen};

/** A rectangle in the model's frame; a quarter turn swaps its width and depth. */
function rect(x,z,w,d,height){const [wx,wz]=onsenPoint(x,z);return {id:'park-onsen',x:wx,z:wz,w:d,d:w,height};}

/** The model's own colliders: bathhouse, fenced bath, porch posts, fridge, bench, footbath. */
export const ONSEN_COLLIDERS=Object.freeze([
 // Retain the footprint, but cut a shallow portal matching the model's 1.8m door.
 // The room beyond stays solid: crossing here hands the actor to the indoor scene.
 rect(0,1.7,7.6,3.8,3.3),
 rect(-3.05,4,1.5,.8,3.3),rect(1.65,4,4.3,.8,3.3),
 rect(0,-3.65,7.6,6.9,1.9),
 rect(-2.4,5.2,.22,.22,2.6),rect(-.4,5.2,.22,.22,2.6),
 rect(-3.0,4.65,.66,.54,1.25),
 rect(1.7,4.82,1.9,.44,.45),
 rect(1.9,7.1,3.0,1.4,.5),
 ...[[.15,6.15],[3.65,6.15],[.15,8.05],[3.65,8.05]].map(([x,z])=>rect(x,z,.2,.2,2.4)),
 rect(-2.9,6.6,.16,.16,1.8),
]);

/** Visible from the first frame and after a failed model request. Its solid parts use the real collision plan. */
export function buildOnsenFallback(){
 const group=new THREE.Group();group.name='Umi-no-yu fallback shell';
 const materials=new Map(),mat=colour=>{if(!materials.has(colour))materials.set(colour,new THREE.MeshStandardMaterial({color:colour,roughness:.9}));return materials.get(colour);};
 const box=(name,w,h,d,x,y,z,colour)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(colour));mesh.position.set(x,y,z);mesh.name=name;mesh.receiveShadow=true;group.add(mesh);return mesh;};
 ONSEN_COLLIDERS.forEach((c,i)=>{
  const x=c.z-ONSEN.z,z=ONSEN.x-c.x,w=c.d,d=c.w;
  if(i===3){
   // A visible enclosed bathing yard explains why this exterior footprint stays solid.
   box('Fallback bath yard',w-.02,.04,d-.02,x,.02,z,0xaca58c);
   for(const side of [-1,1])box('Fallback bath side fence',.12,c.height,d,x+side*(w/2-.06),c.height/2,z,0x8e9c6e);
   box('Fallback sea bath fence',w,.95,.12,x,.475,z-d/2+.06,0x8e9c6e);
   const water=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshStandardMaterial({color:0x668e89,roughness:.22,transparent:true,opacity:.85,depthWrite:false}));water.rotation.x=-Math.PI/2;water.scale.set(2.35,1.75,1);water.position.set(.2,.2,-3.9);water.name='Fallback sea bath water';group.add(water);return;
  }
  const colour=i<3?0xc9c0a7:i===8?0x949989:i>=9&&i<=12?0x5b5548:i===6?0xd9d8c5:0x76624c;
  box(i<3?'Fallback bathhouse wall':'Fallback onsen fitting',w,c.height,d,x,c.height/2,z,colour);
 });
 for(const side of [-1,1]){const roof=box('Fallback bathhouse roof',8.4,.14,3.2,0,3.9,2.1+side*1.4,0x4c5960);roof.rotation.x=side*.46;}
 box('Fallback roof ridge',8.6,.22,.3,0,4.62,2.1,0x4c5960);
 box('Fallback footbath roof',4.3,.15,2.7,1.9,2.45,7.1,0x4c5960);
 box('Fallback porch roof',2.7,.14,1.4,-1.4,2.8,4.8,0x4c5960);
 box('Fallback entrance threshold',1.8,.06,1.7,-1.4,.03,4.4,0xb2ada0);
 box('Fallback footbath water',2.7,.015,1.08,1.9,.51,7.1,0x668e89);
 // A streamed model replaces this group. Baking its meshes into a static batch
 // would leave a second shell behind after fallback.visible becomes false.
 group.traverse(mesh=>{if(mesh.isMesh)mesh.userData.staticProp=false;});
 return group;
}


function canvasTexture(width,height,draw){
 const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
const SERIF='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';

/** The indigo noren over the door, split in three, with ゆ across the middle. */
function noren(){
 const group=new THREE.Group();group.name='Umi-no-yu noren';
 const map=canvasTexture(384,256,(ctx,w,h)=>{
  ctx.fillStyle='#253a5e';ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#f3efe4';ctx.textAlign='center';ctx.textBaseline='middle';
  const N=ONSEN_SIGNS.noren;ctx.font=`bold 150px ${SERIF}`;ctx.fillText(N.jp,w/2,h*.55);
  ctx.font=`bold 30px ${SERIF}`;ctx.fillText(N.mark,w*.17,h*.2);ctx.fillText(N.mark,w*.83,h*.2);
 });
 const material=new THREE.MeshStandardMaterial({map,roughness:.9,side:THREE.DoubleSide});
 for(let k=0;k<3;k++){
  const geometry=new THREE.PlaneGeometry(.56,.72),uv=geometry.attributes.uv;
  for(let i=0;i<uv.count;i++)uv.setX(i,(k+uv.getX(i))/3);
  const panel=new THREE.Mesh(geometry,material);panel.position.set(-1.96+k*.57,2.08,4.36);panel.rotation.x=.03;
  panel.name='Umi-no-yu noren';group.add(panel);
 }
 return group;
}

function signs(group){
 const board=canvasTexture(512,140,(ctx,w,h)=>{
  ctx.fillStyle='#3a2a1c';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#c9a86a';ctx.lineWidth=5;ctx.strokeRect(8,8,w-16,h-16);
  ctx.fillStyle='#f1e2bd';ctx.textAlign='center';ctx.textBaseline='middle';
  const K=ONSEN_SIGNS.kanban;ctx.font=`bold 74px ${SERIF}`;ctx.fillText(K.mark+' '+K.jp,w/2,h*.44);
  ctx.font='bold 20px sans-serif';ctx.fillText(K.sub,w/2,h*.82);
 });
 // The name board hangs on the front face of the porch beam (model: beam 2.3 × .16 × .16 at y 2.62, z 5.2,
 // front face z 5.28), where a sentō hangs its name: its top flush with the beam's top (2.70), its lower part
 // below the beam (to 2.34, well above every head), so it reads whole from the street under the porch roof's
 // edge (2.68 at z 5.43). Between the porch posts (inner faces x -2.33 and -.47). A board, not a sheet: dark
 // timber on the back and edges, seen from under the porch.
 const timber=new THREE.MeshStandardMaterial({color:0x3a2a1c,roughness:.85});
 const kanban=new THREE.Mesh(new THREE.BoxGeometry(1.3,.355,.03),[timber,timber,timber,timber,new THREE.MeshStandardMaterial({map:board,roughness:.8}),timber]);
 kanban.position.set(-1.4,2.5225,5.296);kanban.name='Umi-no-yu sign';
 // The notice by the path: hours, fee, and what is in the water.
 const notice=canvasTexture(256,320,(ctx,w,h)=>{
  ctx.fillStyle='#efe6cf';ctx.fillRect(0,0,w,h);ctx.fillStyle='#2b2520';ctx.textAlign='center';
  ctx.font=`bold 34px ${SERIF}`;ctx.fillText(ONSEN_SIGNS.notice.jp,w/2,44);
  ctx.font='16px sans-serif';
  ['Harbour bath','','Bath 10:00 – 22:00','Adults ¥300 · Children ¥150','Footbath 10:00 – 22:00, free for residents','','Sea water, heated','42°C at the spout','Towel ¥100 at the desk'].forEach((line,i)=>ctx.fillText(line,w/2,82+i*24));
  ctx.fillStyle='#b3382c';ctx.font='bold 15px sans-serif';ctx.fillText('Please wash before you bathe',w/2,h-18);
 });
 const post=new THREE.Mesh(new THREE.BoxGeometry(.08,1.6,.08),new THREE.MeshStandardMaterial({color:0x43301f,roughness:.85}));
 post.position.set(-2.9,.8,6.6);group.add(post);
 const face=new THREE.Mesh(new THREE.BoxGeometry(.62,.78,.04),[...Array(4).fill(new THREE.MeshStandardMaterial({color:0x43301f,roughness:.85})),
  new THREE.MeshStandardMaterial({map:notice,roughness:.85}),new THREE.MeshStandardMaterial({color:0x43301f,roughness:.85})]);
 face.position.set(-2.9,1.35,6.65);face.name='Umi-no-yu notice';group.add(face);
 const cap=new THREE.Mesh(new THREE.BoxGeometry(.78,.05,.2),new THREE.MeshStandardMaterial({color:0x4c5660,roughness:.6}));
 cap.position.set(-2.9,1.77,6.66);cap.rotation.x=-.15;group.add(cap);
 return {notice:face,kanban};
}

/**
 * The frosted lower panes of the model's two street doors, with ゆ left clear in them to read
 * from the street: the same glass as the doors seen from the genkan (interiors/onsen-front.js).
 * The model's glass is one see-through surface for every pane, so the frosting is laid just
 * outside each leaf's lower pane, between its stiles and under its waist rail
 * (tools/blender/build-park-onsen.py: leaves at x -1.85 and -1.15, glass at z 4.04 and 3.99).
 */
function doorGlass(){
 const map=frostedGlassTexture(),group=new THREE.Group();group.name='Umi-no-yu door glass';
 // Lit from the genkan after dark (the hourly glow below): warm through the frosting, the ゆ left clear.
 const material=new THREE.MeshStandardMaterial(map?{map,emissiveMap:map,emissive:0xffc27e,emissiveIntensity:0,transparent:true,side:THREE.DoubleSide,roughness:.55}
  :{color:0xe8eeec,emissive:0xffc27e,emissiveIntensity:0,transparent:true,opacity:.92,side:THREE.DoubleSide,roughness:.55});
 for(const [x,z] of [[-1.85,4.04],[-1.15,3.99]]){
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(.81,.62),material);pane.position.set(x,.715,z+.006);pane.name='Umi-no-yu frosted door glass';pane.renderOrder=3;pane.userData.dynamicProp=true;group.add(pane);
 }
 return {group,material};
}

/** Soft rising steam: one draw per source, drifting up and thinning as it goes. */
function steam(group){
 const soft=canvasTexture(64,64,(ctx,w,h)=>{
  const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 });
 soft.colorSpace=THREE.NoColorSpace;
 const sources=[
  {count:26,centre:[.2,-3.9],spread:[2.0,1.5],base:.45,rise:2.4,size:1.7,opacity:.22},
  {count:10,centre:[1.9,7.1],spread:[1.1,.35],base:.35,rise:1.3,size:1.0,opacity:.2},
  {count:6,centre:[0,2.1],spread:[.9,.25],base:4.9,rise:1.6,size:1.5,opacity:.14},
 ];
 return sources.map(src=>{
  const seeds=Array.from({length:src.count},()=>[Math.random()*2-1,Math.random()*2-1,Math.random(),.6+Math.random()*.6]);
  const positions=new Float32Array(src.count*3),geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const points=new THREE.Points(geometry,new THREE.PointsMaterial({map:soft,size:src.size,sizeAttenuation:true,transparent:true,opacity:src.opacity,depthWrite:false,color:0xf4f1ea}));
  points.name='Umi-no-yu steam';points.frustumCulled=false;points.renderOrder=3;group.add(points);
  return {src,seeds,positions,geometry,points};
 });
}

/**
 * The footbath's kakehi (筧): hot sea water from the bath's boiler comes up a bamboo riser at the trough's far end and
 * pours from a bamboo spout into the water, so the heat shows and is heard, with a paper andon on the riser that glows
 * after dark while the bath is open. In the model's frame, at the trough's +x end (the trough is x 0.4–3.4, z 6.4–7.8,
 * its water at 0.51), between the gazebo's posts (x 3.65, z 6.15 and 8.05).
 */
export const KAKEHI=Object.freeze({x:3.58,z:7.1,top:.86,spoutTo:3.02,spoutY:.79,water:.51});
function kakehi(group){
 const K=KAKEHI,bamboo=new THREE.MeshStandardMaterial({color:0x9caa58,roughness:.6});
 const riser=new THREE.CylinderGeometry(.045,.05,K.top,8).translate(K.x,K.top/2,K.z);
 const spout=new THREE.CylinderGeometry(.03,.03,K.x-K.spoutTo,8).rotateZ(Math.PI/2).rotateZ(.06).translate((K.x+K.spoutTo)/2,K.spoutY,K.z);
 const pipe=new THREE.Mesh(mergeGeometries([riser.toNonIndexed(),spout.toNonIndexed()],false),bamboo);pipe.name='Umi-no-yu footbath kakehi';pipe.castShadow=pipe.receiveShadow=true;group.add(pipe);
 const lantern=new THREE.MeshStandardMaterial({color:0xf3ead2,roughness:.8,emissive:0xffc27e,emissiveIntensity:0});
 const andon=new THREE.Mesh(new THREE.BoxGeometry(.16,.22,.16),lantern);
 andon.position.set(K.x,K.top+.11,K.z);andon.name='Umi-no-yu footbath andon';group.add(andon);
 const stream=new THREE.Mesh(new THREE.CylinderGeometry(.012,.016,K.spoutY-K.water,6,1,true),new THREE.MeshStandardMaterial({color:0xdcefee,roughness:.2,transparent:true,opacity:.55,depthWrite:false}));
 stream.position.set(K.spoutTo-.01,(K.spoutY+K.water)/2,K.z);stream.name='Umi-no-yu footbath spout water';stream.userData.dynamicProp=true;stream.renderOrder=2;group.add(stream);
 return {pipe,stream,lantern,andon};
}

/**
 * @param {object} world the town world (group, colliders, details)
 * @param {object} options register / onAction as the other buildings take them
 */
export function buildParkOnsen(world,{register,onAction,enter,sites,shadows=false}={}){
 const group=new THREE.Group();group.name='Umi-no-yu';group.position.set(ONSEN.x,0,ONSEN.z);group.rotation.y=ONSEN.yaw;world.group.add(group);
 world.colliders.push(...ONSEN_COLLIDERS.map(c=>({...c})));
 // Readable frontage exists immediately, with the fallback or the detailed model.
 const {notice,kanban}=signs(group),curtain=noren(),door=doorGlass(),frosting=door.group,plumes=steam(group);
 const fallback=buildOnsenFallback();group.add(fallback,kanban,curtain,frosting);
 // The porch's approach is the forecourt the town lays in front of the bathhouse (ground-plan-coast.js ONSEN_GROUND).
 // After dark, while the bath is open (10:00–22:00): the door panes glow from the genkan, a halo under the porch
 // over the noren and a pool on the approach (light-pools.js). Shut, the frontage goes dark like any other shop.
 const entranceGlow=createLampGlow(group,[{head:{x:-1.4,y:2.42,z:4.6},ground:{x:-1.4,y:.08,z:5.5},radius:2.4,size:1.4}]);
 const spout=kakehi(group);world.colliders.push(rect(KAKEHI.x,KAKEHI.z,.14,.14,1.15));
 (world.hourly??=[]).push(minutes=>{const open=onsenOpen(minutes)?1:0;door.material.emissiveIntensity=windowGlow(minutes)*open*.9;entranceGlow.update(poolGlow(minutes)*open);
  spout.stream.visible=plumes[1].points.visible=!!open;spout.lantern.emissiveIntensity=lanternGlow(minutes)*open*1.4;});
 const anchor=(x,y,z,label,fn)=>{const o=new THREE.Object3D();o.position.set(x,y,z);group.add(o);register?.(o,label,fn);return o;};
 // Through the noren: the bathhouse is a room you walk into (interiors/onsen.js).
 const [doorX,doorZ]=ONSEN_DOOR,[outX,outZ]=ONSEN_APPROACH;
 const site={id:'onsen',title:'Umi-no-yu',jp:"Sea Bath",sub:'PUBLIC BATH · SEA WATER',x:doorX,z:doorZ,color:0x3f5f7a,accent:'#253a5e',
  line:'Bath 10:00–22:00 · adults ¥300 · swimwear please',door:[doorX,0,doorZ],exitPosition:[outX,0,outZ],approachPosition:[outX,0,outZ],
  entryFacing:ONSEN.yaw,opens:'10:00',directions:'From Sakura, use the marked crossing and follow the park path straight on to Umi-no-yu. The footbath, free for residents in the bath’s hours, is beside the entrance.'};
 sites?.push(site);
 anchor(-1.4,1.2,4.75,'Go into Umi-no-yu',()=>enter?enter(site):onAction?.('onsen'));
 register?.(notice,'Read the onsen notice',()=>onAction?.('read','Umi-no-yu notice',
  'Harbour bath, heated sea water (shio-yu). Bath 10:00–22:00, adults ¥300, children ¥150. The footbath keeps the bath’s hours and is free for residents. Sea water from the harbour, heated to 42°C at the spout — good for cold hands and long shifts on the quay. Please wash before you bathe.'));
 // Sit on the footbath's rim with your feet in the water, looking across it.
 const [sx,sz]=onsenPoint(1.9,7.72),[tx,tz]=onsenPoint(1.9,8.5);
 // The footbath keeps the bath's hours (the owner, 21 October 2026): the kakehi runs while the bath is open.
 const soak=anchor(1.9,.8,7.9,'Soak your feet in the footbath',()=>onsenOpen(world.minutes??0)
  ?onAction?.('seat','Umi-no-yu footbath','You slip off your shoes and put your feet in. It is hotter than you expect, then exactly right. The bamboo spout runs at the end, and somebody has left a folded towel on the rim.')
  :onAction?.('inspect','Umi-no-yu footbath','The bamboo spout is shut off: Grandmother Higa turns the footbath off when the bath closes at ten at night, and the water is going cold. It runs again from ten in the morning, free for residents.'));
 soak.userData.seat={position:[sx,0,sz],stand:[tx,0,tz],surfaceY:.48,eyeY:1.15,yaw:ONSEN.yaw,pitch:-.22};
 const [bx,bz]=onsenPoint(1.7,4.9),[bsx,bsz]=onsenPoint(1.7,5.5);
 const bench=anchor(1.7,.8,5.1,'Cool off on the bench',()=>onAction?.('seat','Umi-no-yu bench','The bench under the bathhouse windows, for sitting out the heat afterwards. The sea wind finds you here.'));
 bench.userData.seat={position:[bx,0,bz],stand:[bsx,0,bsz],surfaceY:.485,eyeY:1.1,yaw:ONSEN.yaw+Math.PI,pitch:0};

 let model=null;
 registerDetail(world,{id:'park-onsen',requiredNearby:true,x:ONSEN.x,z:ONSEN.z,radius:72,load:async()=>{
  const response=await fetch(assetURL('models/onsen/umi-no-yu.glb'));if(!response.ok)return false;
  const scene=(await new GLTFLoader().parseAsync(await response.arrayBuffer(),'')).scene;
  scene.name='Umi-no-yu bathhouse';scene.userData.sharedAsset=true;
  scene.traverse(o=>{if(o.isMesh){o.castShadow=!!shadows&&!o.material.transparent;o.receiveShadow=!!shadows;
   // The model's glass and water are its only see-through surfaces; drawn after the rest.
   if(o.material.transparent){o.material.depthWrite=false;o.renderOrder=2;}}});
  group.add(scene);fallback.visible=false;model=scene;return true;
 }});

 function tick(time){
  for(const {src,seeds,positions,geometry} of plumes){
   for(let i=0;i<seeds.length;i++){
    const [ox,oz,phase,speed]=seeds[i],t=(time*.12*speed+phase)%1;
    positions[i*3]=src.centre[0]+ox*src.spread[0]+Math.sin(time*.4+i)*.15*t;
    positions[i*3+1]=src.base+t*src.rise;
    positions[i*3+2]=src.centre[1]+oz*src.spread[1]+t*.35;
   }
   geometry.attributes.position.needsUpdate=true;
  }
 }
 tick(0);
 return {group,tick,fallback,entranceGlow,kakehi:spout,doorGlass:door.material,get model(){return model;}};
}
