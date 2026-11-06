import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildBeachCorner,BEACH_CORNER,BEACH_CORNER_SEATS} from '../src/world/beach-corner.js';
import {beachHeight,BEACH} from '../src/world/beach-layout.js';
import {SEA_LEVEL} from '../src/world/ocean.js';
import {circleHitsRect} from '../physics.js';
installDOM();

test('the beach corner sits on dry sand with chairs facing the sea that you can reach',()=>{
 const parent=new THREE.Group(),colliders=[],hits=[];
 const corner=buildBeachCorner({parent,colliders,register:(o,label,fn)=>hits.push({o,label,fn}),onAction(){}});
 assert.ok(BEACH_CORNER.z>BEACH.minZ&&BEACH_CORNER.z<BEACH.maxZ);
 for(const s of BEACH_CORNER_SEATS){
  const sand=beachHeight(s.position[0],s.position[2]);
  assert.ok(sand!=null&&sand>SEA_LEVEL+.1,'the chair is on dry sand');
  assert.equal(s.position[1],sand,'the chair stands on the sand, not above or under it');
  assert.ok(Math.abs(s.yaw+Math.PI/2)<1e-9,'faces east, out to sea');
  assert.ok(s.eyeY>sand+.6&&s.eyeY<sand+1.1,'a low chair: eyes under a metre up');
  assert.ok(!colliders.some(c=>circleHitsRect(s.stand[0],s.stand[2],.25,c)),s.id+' stand point is clear');
  assert.ok(hits.some(h=>h.o.userData.seat===s),s.id+' has a prompt');
 }
 // The birds keep to the shore and move.
 const before=[];corner.group.traverse(o=>{if(o.name==='Sandpiper')before.push(o.position.clone());});
 corner.tick(1.5,{x:0,z:0});const after=[];corner.group.traverse(o=>{if(o.name==='Sandpiper')after.push(o.position.clone());});
 assert.equal(before.length,4);assert.ok(after.some((p,i)=>p.distanceTo(before[i])>.01),'sandpipers run the wash line');
 assert.ok(after.every(p=>Math.abs(p.x-corner.shoreX)<1.6),'and stay at the water’s edge');
});
