import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import * as FACADE from '../src/world/thuan-flat.js';
import {buildThuanFlat,SAKURA_OFFICE_BACK} from '../src/world/thuan-flat.js';
import {SAKURA_BACK} from '../src/world/okinawa/old-town.js';

const SHOP_DOOR=[-5.5,0,-27.3];
function office(){
 const town=new THREE.Group(),store=new THREE.Group(),sites=[];
 store.position.set(-7.45,0,-27.3);store.rotation.y=Math.PI/2;town.add(store);
 const {site}=buildThuanFlat(store,{sites,shopDoor:SHOP_DOOR});town.updateMatrixWorld(true);
 return {town,store,site};
}
const solids=town=>{const list=[];town.traverse(o=>{if(o.isMesh&&!/glazing/.test(o.name))list.push(o);});return list;};
const firstHit=(town,from,to)=>{const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to);
 return new THREE.Raycaster(a,b.clone().sub(a).normalize(),0,a.distanceTo(b)).intersectObjects(town.children,true)[0];};

test('exterior trim leaves seated town and harbour sightlines open',()=>{
 const {town,store,site}=office();
 // Through the office's two windows (sakura-office-room.js SAKURA_UPSTAIRS.windows): the town window, standing; the harbour window from the desk chair.
 for(const [from,to] of [[[2.4,5.61,-3],[2.4,5.61,0]],[[5.15,5.13,-3.3],[7,5.13,-3.3]]]){
  const a=store.localToWorld(new THREE.Vector3(...from)),b=store.localToWorld(new THREE.Vector3(...to));
  const ray=new THREE.Raycaster(a,b.clone().sub(a).normalize(),0,a.distanceTo(b));
  assert.equal(ray.intersectObjects(solids(town)).length,0,'window must remain clear at seated eye height');
 }
 assert.equal(site.officePortals.length,2);
});

test('the office is entered through the shop: its site is the shop door, with no door of its own outside',()=>{
 const {site}=office();
 assert.deepEqual(site.door,SHOP_DOOR);assert.deepEqual(site.approachPosition,SHOP_DOOR);assert.deepEqual(site.exitPosition,SHOP_DOOR);
 assert.equal(site.entryFacing,Math.PI/2,'facing into the shop, as its front door does');
});

test('upper facade uses batched geometry and the existing dusk circuit',()=>{
 const {town}=office();let meshes=0,vertices=0,lights=0;const panes=[];
 town.traverse(o=>{if(o.isLight)lights++;if(o.isMesh){meshes++;vertices+=o.geometry.attributes.position.count;if(/glazing/.test(o.name))panes.push(o);}});
 assert.ok(meshes<=8,`${meshes} exterior draw meshes`);assert.ok(vertices<16000,`${vertices} vertices`);assert.equal(lights,0);
 assert.deepEqual(panes.map(p=>p.name).sort(),['Sakura harbour office glazing','Sakura main office glazing','Sakura rear office glazing']);
 assert.ok(panes.every(p=>p.material===panes[0].material),'all three outlooks share one glass');
 assert.equal(panes[0].material.userData.kitFinish,'glow','all outlooks join the existing window dusk updates');
 assert.ok(panes[0].material.emissive.getHex()>0);
 let frosted=false;town.traverse(o=>{if(o.isMesh&&o.material.userData.kitFinish==='glow'&&!/glazing/.test(o.name))frosted=true;});
 assert.ok(frosted,'the frosted stair window lights at dusk too');
});

test('the back wall has the office windows and the fire door, open to the escape and nowhere else',()=>{
 const {town,store}=office(),F=4.01,face=SAKURA_BACK.upperWall;
 // Each sash: glass seen from the yard, set into the wall.
 for(const w of SAKURA_OFFICE_BACK.windows){
  const z=store.localToWorld(new THREE.Vector3((w.x0+w.x1)/2,0,0)).z,y=F+(w.sill+w.head)/2;
  const hit=firstHit(town,[-22,y,z],[-17,y,z]);
  assert.equal(hit?.object.name,'Sakura rear office glazing','a window at z '+z.toFixed(2));
  assert.ok(hit.point.x>face&&hit.point.x<SAKURA_BACK.upperWall+.12,'the glass is in the wall, not on it');
 }
 // The fire door: a steel leaf recessed in its opening, where the escape's landing is.
 const E=SAKURA_BACK.fireEscape,door=firstHit(town,[-22,F+1,E.door.z],[-17,F+1,E.door.z]);
 assert.ok(door&&door.point.x>face+.01,'the fire door stands in its opening at the escape');
 for(const dz of [-E.door.width/2-.1,E.door.width/2+.1]){const wall=firstHit(town,[-22,F+1,E.door.z+dz],[-17,F+1,E.door.z+dz]);assert.ok(Math.abs(wall.point.x-face)<1e-6,'solid wall either side of the door');}
 assert.ok(E.platform.minZ<E.door.z-E.door.width/2&&E.platform.maxZ>E.door.z+E.door.width/2,'the landing spans the door');
});

test('the street face and the harbour side show the plan behind them: office glass, the rest room’s shoji, wall for the stores',()=>{
 // The owner, 20 October 2026: "I want the exterior of the office to look different to reflect its inside".
 const {town,store}=office(),F=4.01,y=F+1.6;
 const look=(from,to)=>{const a=store.localToWorld(new THREE.Vector3(...from)),b=store.localToWorld(new THREE.Vector3(...to));return firstHit(town,a.toArray(),b.toArray());};
 const what=hit=>hit?/glazing/.test(hit.object.name)?hit.object.name:hit.object.material?.userData?.kitFinish==='glow'?'shoji':'wall':'nothing';
 const front=x=>what(look([x,y,3],[x,y,-3]));
 for(const x of [-5.5,-3.2,1.1,5.6])assert.equal(front(x),'wall',`the street face at ${x} is wall (the store, the office's wall)`);
 for(const x of [-1.7,-.6,.4])assert.equal(front(x),'shoji',`the rest room's shoji at ${x}`);
 for(const x of [2.2,4.3])assert.equal(front(x),'Sakura main office glazing',`the office's town window at ${x}`);
 const side=z=>what(look([9,y,z],[0,y,z]));
 for(const z of [-6.3,-5,-4.3])assert.equal(side(z),'wall',`the harbour side at ${z} is the archive's wall`);
 for(const z of [-3.6,-1.6])assert.equal(side(z),'Sakura harbour office glazing',`the office's harbour window at ${z}`);
 const {SAKURA_FACADE:A}=FACADE;
 assert.equal(A.front.length,2);assert.ok(A.front.every(o=>o.why&&o.room));
});
