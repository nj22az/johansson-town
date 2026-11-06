/** Native workshop bridge: World builders in the editor, checked layout data back to World. */
import * as THREE from '../../vendor/three.module.js';
import {buildCompactShop} from '../world/interiors/compact-shops.js';
import {buildBusinessContent} from '../world/interiors/business-content.js';
import {DOCK_WORKSHOP,DOCK_WORKSHOP_ROOM} from '../world/dock-workshop-layout.js';
import {WORKSHOP_PUBLICATION} from '../world/interiors/workshop-publication.js';
import {WORKSHOP_OBJECTS,WORKSHOP_SOURCE_FILES,workshopProject,workshopLayout,validateWorkshopProject} from './workshop-contract.js';
import {parseWorkshopProp} from '../world/interiors/workshop-props.js';
import {recordSha256,sha256} from './sha256.js';
import {auditSurfaces,disposeModel} from './model-workbench.js';
import {circleHitsRect} from '../../physics.js';
export async function workshopSource(){return recordSha256(await Promise.all(WORKSHOP_SOURCE_FILES.map(async path=>{const r=await fetch('/johansson-town/'+path,{cache:'no-store'});if(!r.ok)throw Error('Workshop source could not load.');return [path,sha256(new Uint8Array(await r.arrayBuffer()))];})));}
export async function openWorkshopProject(publication=WORKSHOP_PUBLICATION){return workshopProject({revision:publication.revision,source:await workshopSource(),...publication.layout?{layout:publication.layout}:{}});}
export async function buildWorkshopDraft(p){
 validateWorkshopProject(p);const room=new THREE.Group(),colliders=[],prompts=[],propSurfaces=[];
 const collider=(x,z,w,d,height,minY=0)=>colliders.push({x,z,w,d,height,minY});
 const api=buildCompactShop({site:{...DOCK_WORKSHOP,id:'form3d'},room,collider,reg:(o,label)=>{prompts.push({object:o,label});},action(){},exit(){},studioLayout:workshopLayout(p)});
 room.studioDispose=()=>{api.workshop?.dispose();api.dispose();};
 try{
  const motorReady=await api.ready;if(p.objects.some(o=>o.id==='motor-bench'&&o.visible)&&motorReady!==true)throw Error('The pump motor model could not load.');
  buildBusinessContent({site:{...DOCK_WORKSHOP,id:'form3d'},room,register:(object,label)=>prompts.push({object,label}),onInspect(){},onAction(){}});
  // The collision records carry the same owners and transformed rectangles as World's callback.
  colliders.length=0;for(const {colliders:cs} of api.workshopObjects.values())colliders.push(...cs);
  for(const o of p.objects){if(WORKSHOP_OBJECTS[o.id]||!o.visible)continue;const g=await parseWorkshopProp(p.assets[o.asset]);room.add(g);g.name=o.name;g.userData.roomObject=o.id;g.position.fromArray(o.position);g.rotation.y=THREE.MathUtils.degToRad(o.rotation[1]);g.scale.setScalar(o.scale);room.updateMatrixWorld(true);
   const b=new THREE.Box3().setFromObject(g),size=b.getSize(new THREE.Vector3()),centre=b.getCenter(new THREE.Vector3());
   colliders.push({owner:o.id,x:centre.x,z:centre.z,w:size.x,d:size.z,height:b.max.y,minY:b.min.y});propSurfaces.push({id:o.id,...auditSurfaces(g)});
  }
  room.updateMatrixWorld(true);room.workshop={api,colliders,prompts,propSurfaces};return room;
 }catch(e){disposeModel(room);throw e;}
}
export function validateWorkshopBuilt(p,room){
 validateWorkshopProject(p);const {colliders,prompts,propSurfaces}=room.workshop,findings=[],b=DOCK_WORKSHOP_ROOM.bounds;
 const visible=p.objects.filter(o=>o.visible),movable=visible.filter(o=>!WORKSHOP_OBJECTS[o.id]?.locked),epsilon=.006;
 for(const o of movable){const group=room.children.find(g=>g.userData.roomObject===o.id),box=new THREE.Box3().setFromObject(group);if(box.isEmpty()){findings.push({id:o.id,kind:'empty-model'});continue;}
  if(o.support!=='suspended'&&Math.abs(box.min.y)>epsilon)findings.push({id:o.id,kind:'floor-contact',bottom:box.min.y});
  if(box.min.y< -epsilon||box.min.x<b.minX-epsilon||box.max.x>b.maxX+epsilon||box.min.z<b.minZ-epsilon||box.max.z>b.maxZ+epsilon||box.max.y>2.35)findings.push({id:o.id,kind:'outside-room-or-ceiling'});
  const own=colliders.filter(c=>c.owner===o.id);for(const a of own){
   if(a.w<=0||a.d<=0||!Number.isFinite(a.height))findings.push({id:o.id,kind:'invalid-bounds'});
   if(a.x+a.w/2>-.62&&a.x-a.w/2<.62&&a.z+a.d/2>2.4)findings.push({id:o.id,kind:'door-clearance'});
   for(const c of colliders)if(c.owner!==o.id&&Math.abs(a.x-c.x)<(a.w+c.w)/2-.005&&Math.abs(a.z-c.z)<(a.d+c.d)/2-.005&&Math.min(a.height,c.height)-Math.max(a.minY||0,c.minY||0)>.01){if(!findings.some(f=>f.kind==='collision'&&f.id===o.id&&f.with===c.owner))findings.push({id:o.id,kind:'collision',with:c.owner});}
  }
 }
 for(const r of propSurfaces)if(!r.ok)findings.push({id:r.id,kind:'prop-surfaces',complete:r.complete,overlaps:r.findings.length});
 // Flood the actual collision map with a 35 cm body, the staff's size; test doorway, both duty marks and prompt reach.
 const radius=.35,step=.15,minX=b.minX+radius,maxX=b.maxX-radius,minZ=b.minZ+radius,maxZ=b.maxZ-radius;
 const free=(x,z)=>x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ&&!colliders.some(c=>c.height>.15&&c.minY<1.65&&circleHitsRect(x,z,radius,c));
 const spawn=DOCK_WORKSHOP_ROOM.spawn,seen=new Set(),points=[],queue=[[spawn[0],spawn[2]]];
 if(!free(...queue[0]))findings.push({kind:'spawn-blocked'});else{seen.add('0,0');for(let head=0;head<queue.length&&head<6000;head++){const [x,z]=queue[head];points.push([x,z]);for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx*step,nz=z+dz*step,key=Math.round((nx-spawn[0])/step)+','+Math.round((nz-spawn[2])/step);if(!seen.has(key)&&free(nx,nz)){seen.add(key);queue.push([nx,nz]);}}}}
 for(const [name,mark] of Object.entries({...DOCK_WORKSHOP_ROOM.staff,door:[0,0,3.12]})){if(!free(mark[0],mark[2])||!points.some(([x,z])=>Math.hypot(x-mark[0],z-mark[2])<.23))findings.push({kind:'route',target:name});}
 for(const {object,label} of prompts){const pos=object.getWorldPosition(new THREE.Vector3()),reach=object.userData.reach||1.8;if(!points.some(([x,z])=>Math.hypot(x-pos.x,z-pos.z)<reach))findings.push({kind:'prompt-unreachable',target:label});}
 return {ok:!findings.length,complete:true,findings,room:'dock-workshop',sourceRevision:p.world.revision,objects:visible.length,walkableSamples:points.length,colliders,scope:'This workshop only: native collision rectangles, new prop bounds/internal surface checks, floor contact, doorway, staff paths and prompt proximity. A 15 cm grid checks static access; no whole-island physics, electrical rewiring, seated or future animation guarantees.'};
}
export async function checkWorkshop(p){const room=await buildWorkshopDraft(p);try{return validateWorkshopBuilt(p,room);}finally{disposeModel(room);}}
