import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect} from '../physics.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {createNavigation} from '../src/people/navmesh.js';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';
import {buildSakuraOfficeRoom} from '../src/world/interiors/sakura-office-room.js';
import {SAKURA_POSTER_WALLS,POSTER_SIZE} from '../src/world/interiors/sakura-trade-posters.js';

// The owner's office and storage allocation is actual wall decoration, not merely
// a proposed collection in the reader. Exercise the assembled rooms and their real fittings.
const R=.28,normal=face=>new THREE.Vector3(...({'+z':[0,0,1],'-z':[0,0,-1],'+x':[1,0,0],'-x':[-1,0,0]})[face]);
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-5,`${message}: ${a} != ${b}`);
let shopPromise,office;
async function stockroom(){
 if(!shopPromise)shopPromise=(async()=>{
  installDOM();const room=new THREE.Group(),prompts=[],actions=[];
  const view=buildSakuraInterior({room,reg:(object,label,fn)=>prompts.push({object,label,fn}),action:(...args)=>actions.push(args),exit(){}});
  await view.ready();room.updateMatrixWorld(true);return {room,prompts,actions,layout:view.layout,colliders:view.layout.colliders,view};
 })();return shopPromise;
}
function upstairs(){
 if(!office){
  installDOM();const room=new THREE.Group(),prompts=[],actions=[],colliders=[];
  const layout=buildSakuraOfficeRoom({room,merge:false,reg:(object,label,fn)=>prompts.push({object,label,fn}),action:(...args)=>actions.push(args),collider:(x,z,w,d,height=2.8,minY=0)=>colliders.push({x,z,w,d,height,minY})});
  room.updateMatrixWorld(true);office={room,prompts,actions,layout,colliders};
 }return office;
}
after(async()=>{if(shopPromise)(await shopPromise).view.dispose();});

function posters(f,kind){
 const specs=SAKURA_POSTER_WALLS.filter(p=>p.room===kind),paper=f.room.getObjectByName('Sakura trade posters · '+kind);
 assert.ok(paper?.isMesh,kind+' posters must be assembled into the actual room');
 assert.equal(paper.geometry.attributes.position.count,specs.length*4,'one complete quad per poster shares the atlas draw');
 assert.equal(paper.material.polygonOffset,true,'the printed paper remains a wall decal');
 return specs.map((spec,i)=>{
  const vertices=Array.from({length:4},(_,j)=>new THREE.Vector3().fromBufferAttribute(paper.geometry.attributes.position,i*4+j).applyMatrix4(paper.matrixWorld));
  const centre=vertices.reduce((sum,v)=>sum.add(v),new THREE.Vector3()).multiplyScalar(.25),n=normal(spec.face),at=new THREE.Vector3(...spec.at).addScaledVector(n,.001);
  near(centre.distanceTo(at),0,spec.id+' paper is attached at its recorded wall face');
  const bounds=new THREE.Box3().setFromPoints(vertices),size=bounds.getSize(new THREE.Vector3());
  near(spec.face[1]==='z'?size.x:size.z,POSTER_SIZE.w,spec.id+' B2 width');near(size.y,POSTER_SIZE.h,spec.id+' B2 height');
  return {spec,paper,centre,n};
 });
}

function assertWallAndSight(f,prints){
 const meshes=[];f.room.traverse(o=>{if(o.isMesh)meshes.push(o);});
 for(const {spec,paper,centre,n} of prints){
  const across=spec.face[1]==='z'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1),back=n.clone().negate();
  for(const dx of [-.49,0,.49])for(const dy of [-.49,0,.49]){
   const at=centre.clone().addScaledVector(across,dx*POSTER_SIZE.w).add(new THREE.Vector3(0,dy*POSTER_SIZE.h,0));
   // A front-on view must meet the paper before a standee, cabinet, blind, switch or sign.
   const first=new THREE.Raycaster(at.clone().addScaledVector(n,1),back,0,1.01).intersectObjects(meshes,false)[0];
   assert.equal(first?.object,paper,`${spec.id} obscured at ${at.toArray()} by ${first?.object.name}`);
   // Immediately behind each part of its face is an existing wall, not a window or unsupported gap.
   const wall=new THREE.Raycaster(at.clone().addScaledVector(n,-.0001),back,0,.005).intersectObjects(meshes.filter(m=>m!==paper),false)[0];
   assert.ok(wall,`${spec.id} floats without a wall behind ${at.toArray()}`);
   assert.match(wall.object.name,/wall|lining|building|^Front window head$/i,`${spec.id} is pinned to ${wall.object.name}`);
   near(wall.distance,.0009,spec.id+' lies one millimetre from the wall');
  }
 }
}

test('the approved office and storage campaigns are physically present and fitted to existing walls',async()=>{
 const stock=await stockroom(),upper=upstairs();
 for(const [f,kind,ids] of [[stock,'stockroom',['minato-tsuru','nami-sour','asagao-uv']],[upper,'office',['kitano-12','umineko-black']]]){
  const prints=posters(f,kind);
  assert.deepEqual(prints.map(p=>p.spec.id).sort(),ids.sort(),'each agreed campaign has a physical slot in '+kind);
  assertWallAndSight(f,prints);
 }
});

test('each new print has a clear reachable Look anchor opening its own campaign',async()=>{
 for(const [f,kind] of [[await stockroom(),'stockroom'],[upstairs(),'office']]){
  const blocked=(x,z,r=R)=>suppliedRoomBoundsBlocked(f.layout,x,z,r)||f.colliders.some(c=>standingHitsRect(x,z,r,0,c));
  const navigation=createNavigation(blocked,{step:.15,radius:R,heightAt:()=>0,bounds:f.layout.bounds}),start=f.layout.entrance||f.layout.spawn;
  for(const {spec} of posters(f,kind)){
   assert.ok(Array.isArray(spec.lookAt),spec.id+' needs an authored Look anchor on clear floor');
   const at=new THREE.Vector3(...spec.lookAt),prompt=f.prompts.find(p=>p.object.position.distanceTo(at)<1e-6&&/^Look at .* poster$/.test(p.label));
   assert.ok(prompt,spec.id+' has a registered in-room Look prompt');assert.equal(prompt.object.userData.npcInteraction,false);
   assert.equal(blocked(at.x,at.z),false,spec.id+' Look anchor overlaps a fitting or wall');
   const path=navigation.path({x:start[0],z:start[2]},{x:at.x,z:at.z});assert.ok(path.length,spec.id+' Look anchor is unreachable from the room entrance');
   near(Math.hypot(path.at(-1)[0]-at.x,path.at(-1)[1]-at.z),0,spec.id+' route reaches its authored anchor');
   assert.ok(at.distanceTo(new THREE.Vector3(...spec.at))<3.4,spec.id+' anchor remains within the interaction reach of its print');
   prompt.fn();assert.deepEqual(f.actions.at(-1),['trade-poster',spec.id]);
  }
 }
});
