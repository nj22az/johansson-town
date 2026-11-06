import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createKit,trs} from '../src/world/okinawa/kit.js';
import {shopHouse} from '../src/world/okinawa/houses.js';
import {HIGA_FRAME} from '../src/world/okinawa/higa-liquor-dressing.js';
import {KISSA_KEEPER} from '../src/commerce/kissa-higa.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {canStepBetween,standingHitsRect,sweepFraction} from '../physics.js';

// Higa Liquor is a room you walk into since 21 October 2026 (higa-liquor-dressing.js); since 30 October 2026 it is Kissa
// Higa (commerce/kissa-higa.js): the counter across the back with the customers' ledge and three stools in front of it,
// the cup shelf and the family kusu behind it, the record cabinet and the paper rack on the Kitano Road wall, the table
// and its chairs by the police-station wall. Its fittings are drawn and collide in the same frame, standing on the 8 cm
// floor.
installDOM();
const w=HIGA_FRAME.W*2,d=HIGA_FRAME.D*2,D=HIGA_FRAME.D,floor=HIGA_FRAME.floor;
const higaFrame={x:HIGA_FRAME.origin[0],z:HIGA_FRAME.origin[1],y:0,yaw:-Math.PI/2};
function build(frame=higaFrame,interior='kissaten'){
 const kit=createKit(),group=new THREE.Group(),matrix=trs(frame.x,frame.y,frame.z,0,frame.yaw);
 let colliders;
 kit.at(frame.x,frame.z,frame.yaw,()=>{colliders=shopHouse(kit,{w,d,interior,seed:41,awning:false});},frame.y);
 kit.finish(group);group.updateMatrixWorld(true);
 return {group,colliders,
  point:(x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(matrix),
  direction:(x,y,z)=>new THREE.Vector3(x,y,z).transformDirection(matrix)};
}
const higa=build();
const near=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-5,`${label}: ${actual} versus ${expected}`);

test('the counter, the ledge, the stools, the cup shelf, the kusu, the record cabinet, the table and its chairs are solid in Higa’s rotated frame',()=>{
 for(const id of ['kissa-counter','kissa-ledge','kissa-stool','kissa-cup-shelf','kissa-kusu','kissa-record-cabinet','kissa-record-crate','kissa-paper-rack','kissa-table','kissa-chair'])assert.ok(higa.colliders.some(c=>c.id===id),id);
 assert.equal(higa.colliders.filter(c=>c.id==='kissa-stool').length,3,'three stools');assert.equal(higa.colliders.filter(c=>c.id==='kissa-chair').length,2,'two chairs');
 assert.ok(higa.colliders.every(c=>!c.id.startsWith('liquor-')),'the liquor fittings are gone');
 for(const [id,x,z] of [['kissa-counter',-1,-.45],['kissa-ledge',-1,0],['kissa-table',1.3,2.1]]){
  const solid=higa.colliders.find(c=>c.id===id),at=higa.point(x,0,z);assert.equal(standingHitsRect(at.x,at.z,.28,floor,solid),true,id);}
});

test('drawn counter and shelf faces match their colliders after rotation and elevation',()=>{
 for(const frame of [higaFrame,{x:-12,z:3,y:.7,yaw:.37},{x:2,z:-4,y:0,yaw:0}]){
  const shop=frame===higaFrame?higa:build(frame);
  // [collider, where the ray starts (local), which way it looks (local)]
  for(const [id,from,dir] of [['kissa-counter',[-1.0,floor+.5,D-.5],[0,0,-1]],['kissa-ledge',[-1.0,floor+.725,D-.5],[0,0,-1]],['kissa-table',[.4,floor+.705,2.1],[1,0,0]]]){
   const collider=shop.colliders.find(c=>c.id===id);
   const ray=new THREE.Raycaster(shop.point(...from),shop.direction(...dir));
   const hit=ray.intersectObject(shop.group,true)[0];
   assert.ok(hit,`${id}: a real drawn face is present`);
   const back=shop.direction(...dir).negate();
   const clear=hit.point.clone().addScaledVector(back,.30),overlap=hit.point.clone().addScaledVector(back,.26);
   assert.equal(standingHitsRect(clear.x,clear.z,.28,frame.y+floor,collider),false,`${id}: clearance in front of the visible face`);
   assert.equal(standingHitsRect(overlap.x,overlap.z,.28,frame.y+floor,collider),true,`${id}: touching the visible face is blocked`);
   near(collider.minY,frame.y+floor,`${id} starts at the finished floor`);
  }
 }
});

test('the shop floor is one visible 8 cm floor, stepped onto from the street',()=>{
 const customer=higa.point(0,0,D-.1);
 const ray=new THREE.Raycaster(new THREE.Vector3(customer.x,.7,customer.z),new THREE.Vector3(0,-1,0));
 const floorHit=ray.intersectObject(higa.group,true)[0];
 assert.ok(floorHit);
 near(floorHit.point.y,floor,'the floor is drawn at 8 cm');
 const walk=createWalkSurface({minX:4,maxX:14,minZ:5,maxZ:13,base:()=>0,cell:.05});
 walk.add(higa.group);
 near(walk.lift(customer.x,customer.z),floor,'feet use the drawn floor height');
 let previous=0;
 for(let x=4.8;x<=9.2;x+=.05){
  const y=walk.lift(x,8.4);
  assert.ok(canStepBetween(previous,y),`walkable threshold at x=${x}`);
  assert.ok(y<=floor+.02+1e-5,'nothing but the floor and the door’s 2 cm sill is underfoot');
  previous=y;
 }
});

test('the customer walks in through the doorway to the counter and stops before walking through it',()=>{
 const blocked=(x,z)=>higa.colliders.some(c=>standingHitsRect(x,z,.28,floor,c));
 assert.equal(sweepFraction({x:4.8,z:8.4},{x:9.2,z:8.4},blocked,.04),1,'in through the doors to the counter');
 assert.ok(sweepFraction({x:9.2,z:8.4},{x:11,z:8.4},blocked,.04)<.2,'the counter stops the walk through the fittings');
 assert.ok(sweepFraction({x:4.8,z:6.7},{x:7,z:6.7},blocked,.04)<1,'the fixed pane beside the door is glass, not air');
 assert.equal(sweepFraction({x:9.2,z:8.4},{x:4.8,z:8.4},blocked,.04),1);
});

test('the keeper reaches her place behind the counter round its open end',()=>{
 const blocked=(x,z)=>higa.colliders.some(c=>standingHitsRect(x,z,.3,floor,c));
 // (30 October 2026: on to Kissa Higa's keeper's place, commerce/kissa-higa.js KISSA_KEEPER.)
 const legs=[[9.2,9.9],[10.9,9.9],[10.85,8.5],KISSA_KEEPER.at];let from={x:9.2,z:8.4};
 for(const [x,z] of legs){assert.equal(sweepFraction(from,{x,z},blocked,.04),1,`clear to ${x}, ${z}`);from={x,z};}
});

test('the other shop-house types keep their three shell colliders and open customer fronts',()=>{
 for(const kind of ['zenzai','post','fish','sweets','laundry','shelves']){
  const shop=build({x:0,z:0,y:0,yaw:0},kind);
  assert.equal(shop.colliders.filter(c=>c.id==='shop-house').length,3,`${kind}: shell is retained`);
  assert.ok(shop.colliders.every(c=>!c.id.startsWith('liquor-')&&!c.id.startsWith('kissa-')),`${kind}: no liquor or kissaten fittings added`);
  assert.equal(shop.colliders.some(c=>standingHitsRect(0,D-.2,.28,0,c)),false,`${kind}: frontage stays open`);
 }
});
