import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createRoomWalk} from '../src/people/room-walk.js';
import {forwardOnly} from '../src/people/facing.js';

test('every indoor Thuan translation frame points forward',()=>{
 const g=new THREE.Group();
 g.userData.name='Thuan';
 g.rotation.y=Math.PI; // begin facing exactly away from the destination
 const person={g,profile:{name:'Thuan',age:25}};
 const walker=createRoomWalk(()=>false,{bounds:{minX:-3,maxX:3,minZ:-3,maxZ:3},smoothTurn:true});
 const target=[1.8,0,-1.8];
 let moved=0;
 for(let frame=0;frame<600;frame++){
  const before=g.position.clone();
  walker.move(person,target,1/60);
  const dx=g.position.x-before.x,dz=g.position.z-before.z;
  if(Math.hypot(dx,dz)<1e-8)continue;
  moved++;
  assert.equal(forwardOnly(g.rotation.y,dx,dz),true,'translated outside the forward cone on frame '+frame);
 }
 assert.ok(moved>30,'test never exercised walking');
 assert.ok(Math.hypot(g.position.x-target[0],g.position.z-target[2])<.13,'Thuan did not reach the target');
});
