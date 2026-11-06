import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {RESIDENTS,STREET_CAST_NAMES} from '../src/people/residents.js';
import {residentPlan,naoBeforeShift} from '../src/people/social.js';
import {shiftFor} from '../src/people/commuter-schedule.js';
import {residentPersonality} from '../src/people/resident-personalities.js';
import {createRoomWalk} from '../src/people/room-walk.js';
import {forwardOnly} from '../src/people/facing.js';

const nao=RESIDENTS.find(person=>person.name==='Thao');

test('Thao is back on the street beside Thuan',()=>{
 assert.ok(STREET_CAST_NAMES.includes('Thuan')&&STREET_CAST_NAMES.includes('Thao'));
});


test('every indoor Thao translation frame points forward',()=>{
 const g=new THREE.Group();g.userData.name='Thao';g.rotation.y=Math.PI;
 const person={g,profile:{name:'Thao',age:24}};
 const walker=createRoomWalk(()=>false,{bounds:{minX:-3,maxX:3,minZ:-3,maxZ:3},smoothTurn:true});
 const target=[1.8,0,-1.8];let moved=0;
 for(let frame=0;frame<600;frame++){
  const before=g.position.clone();walker.move(person,target,1/60);
  const dx=g.position.x-before.x,dz=g.position.z-before.z;
  if(Math.hypot(dx,dz)<1e-8)continue;
  moved++;assert.equal(forwardOnly(g.rotation.y,dx,dz),true,'Thao translated outside the forward cone on frame '+frame);
 }
 assert.ok(moved>30,'test never exercised Thao walking');
 assert.ok(Math.hypot(g.position.x-target[0],g.position.z-target[2])<.13,'Thao did not reach the target');
});
