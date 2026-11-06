import test from 'node:test';
import assert from 'node:assert/strict';
import {circleHitsRect,standingHitsRect,sweepFraction} from '../physics.js';

const wall={x:0,z:0,w:2,d:2};

test('a player clears a visible wall corner when the circle does not touch it',()=>{
 // The old expanded-axis test blocked this position despite 10 cm of clearance.
 assert.equal(circleHitsRect(1.27,1.27,.28,wall),false);
 assert.equal(circleHitsRect(1.15,1.15,.28,wall),true);
 assert.equal(circleHitsRect(1.27,.5,.28,wall),true,'the side of the wall stays solid');
});

test('circle contact and zero-radius point probes retain strict boundary behaviour',()=>{
 assert.equal(circleHitsRect(1.25,0,.25,wall),false,'tangency is not overlap');
 assert.equal(circleHitsRect(1.375,1.5,.625,wall),false,'exact 3-4-5 corner tangency');
 assert.equal(circleHitsRect(.9,.9,0,wall),true,'a point inside is blocked');
 assert.equal(circleHitsRect(1,0,0,wall),false,'a point on the boundary is clear');
 assert.equal(circleHitsRect(1.001,0,0,wall),false);
});

test('translated, rotated wall corners use the same physical distance',()=>{
 for(const yaw of [Math.PI/2,-Math.PI/2,.37,-.81]){
  const c={...wall,x:7.4,z:-12.6,yaw};
  const world=(x,z)=>[c.x+Math.cos(yaw)*x+Math.sin(yaw)*z,c.z-Math.sin(yaw)*x+Math.cos(yaw)*z];
  assert.equal(circleHitsRect(...world(1.27,1.27),.28,c),false);
  assert.equal(circleHitsRect(...world(1.15,1.15),.28,c),true);
  assert.equal(circleHitsRect(...world(-1.27,.5),.28,c),true);
 }
});

test('a swept walk passes a clear corner but cannot tunnel through the wall',()=>{
 const blocked=(x,z)=>circleHitsRect(x,z,.28,wall);
 assert.equal(sweepFraction({x:.7,z:1.75},{x:1.75,z:.7},blocked,.01),1,
  'diagonal clearance rounds the corner instead of meeting a square buffer');
 assert.ok(sweepFraction({x:-2,z:0},{x:2,z:0},blocked,.01)<.2,
  'swept movement stops at the near face');
});

test('standing collision keeps the vertical limits of the actual wall',()=>{
 const raised={...wall,minY:2,height:.4};
 assert.equal(standingHitsRect(0,0,.28,0,raised),false,'the player fits underneath');
 assert.equal(standingHitsRect(0,0,.28,.5,raised),true,'head height overlaps');
 assert.equal(standingHitsRect(0,0,.28,2.4,raised),false,'standing above stays clear');
 assert.equal(standingHitsRect(1.27,1.27,.28,.5,raised),false,'height does not revive the false corner');
});
