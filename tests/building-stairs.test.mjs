import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createKit} from '../src/world/okinawa/kit.js';
import {stairFlight} from '../src/world/okinawa/stairs.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {standingHitsRect,canStepBetween} from '../physics.js';
for(const axis of ['x','z'])for(const direction of [-1,1])test(`stair traversal ${axis}/${direction} in a rotated building`,()=>{
 const kit=createKit(),group=new THREE.Group(),colliders=[];
 kit.at(10,20,Math.PI/2,()=>{
  const spec={id:'test',x:0,z:0,length:4.16,height:2.85,width:1.3,axis,direction};
  const flight=stairFlight(kit,c=>colliders.push(c),spec);
  assert.ok(flight.rise<=.18);assert.ok(flight.tread>=.26-1e-9);
 });kit.finish(group);
 const surface=createWalkSurface({minX:-20,maxX:40,minZ:-20,maxZ:40,base:()=>0});surface.add(group);
 assert.equal(surface.levels.length,16);
 let previous=0;
 for(const s of surface.levels){const x=(s.minX+s.maxX)/2,z=(s.minZ+s.maxZ)/2,y=surface.level(x,z);assert.ok(canStepBetween(previous,y));assert.ok(!colliders.some(c=>standingHitsRect(x,z,.32,y,c)));previous=y;}
 assert.equal(previous,2.85);assert.equal(surface.level(35,35),null);
});
test('stairs reject side entry and elevated guards still block at roof level',()=>{
 assert.equal(canStepBetween(0,2.85),false);
 assert.equal(standingHitsRect(0,0,.32,5.7,{x:0,z:0,w:6,d:6,height:5.7}),false);
 assert.equal(standingHitsRect(0,0,.32,5.7,{x:0,z:0,w:.05,d:6,minY:5.7,height:1}),true);
 assert.equal(standingHitsRect(0,0,.32,0,{x:0,z:0,w:.05,d:6,minY:5.7,height:1}),false);
});

test('raised barriers follow the lowered coastal district datum',()=>{
 const kit=createKit(),colliders=[];kit.at(0,0,0,()=>stairFlight(kit,c=>colliders.push(c),{id:'coast',x:0,z:0,length:4.16,height:2.85,base:2.85}),-.4);
 assert.equal(colliders[0].minY,2.45);
 assert.equal(kit.rect(-1,1,-1,1,3).minY,undefined);
});

test('all town stair flights and landings are clear of furniture and lighting',async()=>{
 const {installDOM}=await import('./fixtures.mjs');installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses().filter(s=>['market','frontrow'].includes(s.id)),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const levels=[];world.group.traverse(o=>levels.push(...(o.userData.walkLevels||[])));
 const stairs=levels.filter(s=>/stair|landing|turn/.test(s.id));assert.ok(stairs.length>0,'the town’s stairs are checked');
 // Kitahama Heights is two attached ground-floor houses with no corridor and no stair (the owner's ruling 6 of
 // 19 October 2026, docs/CAST-CONSOLIDATION.md addendum; built in phase 3, 9f1fd87a): its outside flight must not return.
 assert.ok(!stairs.some(s=>/^flats-/.test(s.id)),'Kitahama Heights has no stair');
 assert.ok(!stairs.some(s=>/sakura/.test(s.id)),'Sakura’s office is reached by its inside stair, not one outside');
 for(const s of stairs){const x=(s.minX+s.maxX)/2,z=(s.minZ+s.maxZ)/2;
  for(const c of world.colliders){
   assert.equal(standingHitsRect(x,z,.32,s.y,c),false,`${s.id} at ${x},${z} obstructed by ${c.id}`);
   if(/lamp|pole/i.test(c.id||''))assert.ok(c.x+c.w/2<s.minX-.04||c.x-c.w/2>s.maxX+.04||c.z+c.d/2<s.minZ-.04||c.z-c.d/2>s.maxZ+.04,`${c.id} intersects ${s.id}`);
  }
 }
});
