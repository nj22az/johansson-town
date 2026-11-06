import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildFerryModel} from '../src/world/ferry-model.js';
import {createFerryWalk,FERRY_CLIMBS} from '../src/world/ferry-walk.js';

function fixture(){
 const ferry=buildFerryModel(),run={ferry,phase:'preparing',rampDown:1,gangwayOut:1,operation:{stage:'preparing'}};
 const walk=createFerryWalk(run);walk.update();return {run,walk};
}
const between=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);

test('both forward mooring stations have a real deck and an unobstructed ladder route',()=>{
 const {run,walk}=fixture(),ray=new THREE.Raycaster(),radius=.20;
 assert.equal(FERRY_CLIMBS.length,2);
 for(const climb of FERRY_CLIMBS){
  const s=Math.sign(climb.to[0]),path=[climb.from,...climb.via,climb.to];
  for(let i=1;i<path.length;i++)for(let k=0;k<=100;k++){
   const p=between(path[i-1],path[i],k/100);
   assert.equal(walk.blocked(p[0],p[1],p[2],radius),false,`${climb.id}: clear at ${p}`);
  }
  const station=[s*3.55,3.56,16.35],waypoints=[climb.to,[s*3.55,3.56,13.6],station];
  for(let i=1;i<waypoints.length;i++)for(let k=0;k<=100;k++){
   const p=between(waypoints[i-1],waypoints[i],k/100),move=walk.move(p[0],p[1],p[2],p[0],p[2],radius);
   assert.equal(move?.ok,true,`${climb.id}: walk around the fittings at ${p}`);
   assert.equal(move.floor.id,s>0?'forecastle-p':'forecastle-s');
  }
  for(const z of [13.7,14.2,16.35]){
   const p=new THREE.Vector3(s*3.55,3.56,z);ray.set(p.clone().add(new THREE.Vector3(0,.15,0)),new THREE.Vector3(0,-1,0));ray.far=.3;
   const hit=ray.intersectObject(run.ferry,true)[0];assert.ok(hit,'the walking surface is visible');
   assert.ok(Math.abs(hit.point.y-p.y)<.005,'the soles meet the green painted deck');
  }
  assert.equal(walk.blocked(s*3.1,3.56,16.1,radius),true,'bitts remain a physical fitting');
  assert.equal(walk.move(s*3.55,3.56,16.35,s*3.8,16.35,radius)?.ok,false,'the outboard rail keeps the rating aboard');
 }
});

test('passenger and vehicle floors follow actual access position throughout preparation',()=>{
 const {run,walk}=fixture();
 for(const stage of ['preparing','securing']){
  run.operation.stage=stage;assert.equal(walk.partOpen('gangway'),true);assert.equal(walk.partOpen('ramp'),true);
 }
 // As she closes up, the gangway and the ramp are floors only while still fully out: whoever is on them is walked off
 // to the nearer end before they move (island/play.js clearAccess; briefs/ferry-timetable.md), never left on nothing.
 run.operation.stage='closing-access';run.gangwayOut=1;run.rampDown=1;assert.equal(walk.partOpen('gangway'),true);assert.equal(walk.partOpen('ramp'),true);
 run.gangwayOut=.98;assert.equal(walk.partOpen('gangway'),false,'a stowing gangway is no floor');
 run.operation.stage='raising-ramp';run.rampDown=.97;assert.equal(walk.partOpen('ramp'),false,'a rising ramp is no floor');
 run.operation.stage='letting-go';run.gangwayOut=1;run.rampDown=1;assert.equal(walk.partOpen('gangway'),false);assert.equal(walk.partOpen('ramp'),false);
 run.phase='waiting';run.operation.stage='alongside';run.gangwayOut=.8;run.rampDown=.8;
 assert.equal(walk.partOpen('gangway'),false,'a visible, moving gangway is not an open floor');assert.equal(walk.partOpen('ramp'),false);
 run.gangwayOut=1;run.rampDown=1;assert.equal(walk.partOpen('gangway'),true);assert.equal(walk.partOpen('ramp'),true);
});

test('aboard cars obstruct bodies and cameras without an oversized square at each corner',()=>{
 const {run,walk}=fixture();run.vehicleObstacles=()=>[{id:'car',x:0,z:0,w:1.6,d:3.8,y:1.1,height:1.5}];
 assert.equal(walk.blocked(0,1.1,0,.28),true);assert.equal(walk.cameraBlocked(0,0,2,.1),true);
 assert.equal(walk.blocked(1.06,1.1,2.16,.28),false,'clear outside the rounded corner');
 assert.equal(walk.blocked(1,1.1,0,.28),true,'the actual side still blocks');
 assert.equal(walk.blocked(0,4,0,.28),false,'a car cannot obstruct the deck above');
});
