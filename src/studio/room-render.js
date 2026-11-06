import {findSupport,auditSupport} from './support.js';
import * as THREE from '../../vendor/three.module.js';
import {loadModel,exportModel,disposeModel,auditSurfaces} from './model-workbench.js';
import {decodeGLB,validateRoom,editRoom,newRoom,encodeGLB} from './room-project.js';
export async function buildRoom(project){
 validateRoom(project);if(project.world)return (await import('./workshop-room.js')).buildWorkshopDraft(project);const root=new THREE.Group(),templates=new Map();root.name=project.title;
 try{for(const o of project.objects){if(!o.visible)continue;
  if(!templates.has(o.asset))templates.set(o.asset,await loadModel(decodeGLB(project.assets[o.asset].glb),{name:project.assets[o.asset].name,ground:true}));
  // Duplicate instances share one parsed geometry/material set; a 24 MiB asset is not decoded 64 times.
  const model=templates.get(o.asset).clone(true);model.name=o.name;
  model.position.fromArray(o.position);model.rotation.set(...o.rotation.map(THREE.MathUtils.degToRad));model.scale.setScalar(o.scale);model.userData.roomObject=o.id;
  root.add(model);
 }root.updateMatrixWorld(true);return root;}catch(e){disposeModel(root);throw e;}
}
export async function exportRoom(project){const root=await buildRoom(project);try{return await exportModel(root);}finally{disposeModel(root);}}
export async function checkRoom(project){if(project.world)return (await import('./workshop-room.js')).checkWorkshop(project);const root=await buildRoom(project);try{const surfaces=auditSurfaces(root),support=auditSupport(root,{exempt:new Set(project.objects.filter(o=>o.support&&o.support!=='resting').map(o=>o.id))});return {...surfaces,complete:surfaces.complete&&support.complete,ok:surfaces.ok&&support.ok,support,objects:project.objects.length,scope:'Visible static objects in this room draft. This does not validate World doors, routes or runtime interactions.'};}finally{disposeModel(root);}}

/** A real World furniture starter. These are the game's own builders, not visual stand-ins. */
export async function starterRoom(){
 const {homeFurnitureFactory}=await import('../build/home-furniture.js'),factory=homeFurnitureFactory();let p=newRoom({id:'studio-room',title:'Room study'});
 for(const [kind,x,z] of [['tansu',-1.5,-1],['andon',1.5,-1],['plant',1.5,1],['cushion',0,1]]){
  if(!factory[kind])continue;const object=factory[kind](0,0,0).object;
  // Factory geometry/materials are shared with World's furniture; export reads them without disposing its cache.
  const glb=encodeGLB(await exportModel(object));p=editRoom(p,[{op:'asset.add',id:kind,name:kind,glb},{op:'object.add',id:kind,asset:kind,name:kind,position:[x,0,z]}]);
 }return p;
}

export async function dropRoomObject(project,id){const root=await buildRoom(project);try{const o=root.children.find(o=>o.userData.roomObject===id);if(!o)throw Error('Select a visible object.');const r=findSupport(root,o);if(!r.complete||!r.position)throw Error(r.reason||'No support found.');return {report:r,position:r.position};}finally{disposeModel(root);}}
