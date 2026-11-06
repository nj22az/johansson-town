import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createFerryRun} from '../src/world/ferry.js';
import {createFerryWalk} from '../src/world/ferry-walk.js';
import {FERRY_WATCH,FERRY_CREW} from '../src/people/ferry-crew.js';
import {FERRY_MANNING} from '../src/world/ferry-ship.js';
import {crewPlaces,createFerryCrewAboard,watchPhase,CREW_POSTS} from '../src/people/ferry-crew-aboard.js';

function alongside(berth='town'){
 const parent=new THREE.Group(),colliders=[];
 const run=createFerryRun({parent,colliders});run.parkAt(berth);run.update(1/60,600,0);
 const walk=createFerryWalk(run);walk.update();
 return {run,walk};
}

test('every post of every phase stands on one of her floors, facing its work',()=>{
 const {run,walk}=alongside();run.ferry.updateMatrixWorld(true);
 for(const phase of Object.keys(FERRY_WATCH)){
  for(const c of crewPlaces(phase,0)){
   const p=new THREE.Vector3(...c.pos).applyMatrix4(run.ferry.matrixWorld),f=walk.floorAt(p.x,p.z,p.y,.3);
   assert.ok(f,`${phase}: ${c.name} at ${c.where} stands on a floor (${c.pos})`);
   assert.ok(Math.abs(f.y-p.y)<.3,`${phase}: ${c.name} at ${c.where} is at the floor's height`);
   assert.ok(!walk.blocked(p.x,f.y,p.z,.2),`${phase}: ${c.name} at ${c.where} is not inside a wall`);
  }
 }
 for(const [where,at] of Object.entries(CREW_POSTS)){
  const p=new THREE.Vector3(...at.pos).applyMatrix4(run.ferry.matrixWorld),f=walk.floorAt(p.x,p.z,p.y,.3);
  assert.ok(f&&!walk.blocked(p.x,f.y,p.z,.2),where+' is a usable watch or operation station');
 }
});

test('all eight declared posts are aboard by day; the established overnight residents remain aboard',()=>{
 const {run}=alongside();
 assert.equal(watchPhase(run,600),'waiting');assert.equal(watchPhase(run,23*60+30),'night');assert.equal(watchPhase(run,5*60),'night');
 assert.deepEqual(crewPlaces('waiting',600).map(c=>c.post),FERRY_MANNING.map(c=>c.post));
 assert.deepEqual(crewPlaces('night',23*60+30).map(c=>c.post).sort(),['bosun','chief']);
 for(const phase of ['waiting','arriving','crossing']){
  const places=crewPlaces(phase,700);assert.equal(places.length,8);
  for(let i=0;i<places.length;i++)for(let j=i+1;j<places.length;j++)assert.ok(new THREE.Vector3(...places[i].pos).distanceTo(new THREE.Vector3(...places[j].pos))>.4,phase+': distinct physical posts');
 }
});

test('the bodies ride with her and Fujita’s shed body is hidden while he is her master',()=>{
 const {run}=alongside();const attached=[];
 const town=new THREE.Group();town.visible=true;
 const crew=createFerryCrewAboard({run,characters:{attach:(g,name)=>attached.push(name)},register(){},onAction(){},townBody:name=>name==='Mr Fujita'?town:null});
 crew.update(1/60,600);
 assert.deepEqual(attached.sort(),FERRY_CREW.map(c=>c.name).sort());
 assert.equal(crew.snapshot().length,8);assert.equal(town.visible,false);assert.equal(town.userData.aboardFerry,true);
 const master=crew.bodies.get('Mr Fujita').g;assert.equal(master.parent,run.ferry,'a child of the ship');
 crew.update(1/60,23*60+30);
 assert.equal(crew.snapshot().length,2);assert.equal(town.userData.aboardFerry,false);
});

test('the eight posts are held by the roster’s people: no job-role body, no anonymous duplicate beside a named one',()=>{
 const {run}=alongside();const attached=[];
 const crew=createFerryCrewAboard({run,characters:{attach:(g,name)=>attached.push(name)},register(){},onAction(){}});
 crew.update(1/60,600);
 const names=crew.snapshot().map(c=>c.name);
 assert.deepEqual(new Set(names),new Set(['Mr Fujita','Ryo','Johansson','Chin','Ms Uezu','Ren','Aya','Jun']));
 assert.equal(new Set(names).size,8,'one body per post');
 for(const old of ['Chief officer','Deck hand','Purser','Cook-steward','Bus driver','Mr Higa Jr'])assert.ok(!attached.includes(old),old+' has no body aboard');
 for(const c of crew.snapshot())assert.equal(crew.bodies.get(c.name).text.includes(c.name),true,c.name+'’s prompt names them');
});

test('the bosun’s relief sleeps at home: the crew cabin is the signed-on bosun’s at night',()=>{
 const {run}=alongside();
 const crew=createFerryCrewAboard({run,characters:{attach(){}},register(){},onAction(){}});
 crew.update(1/60,23*60+30);assert.deepEqual(crew.snapshot().map(c=>c.name).sort(),['Johansson','Ms Uezu']);
 crew.update(1/60,7*1440+23*60+30);assert.deepEqual(crew.snapshot().map(c=>c.name),['Johansson'],'Kōji goes home to 3 Kitahama');
 crew.update(1/60,7*1440+600);assert.equal(crew.snapshot().find(c=>c.post==='bosun').name,'Kōji','and holds the post by day on his week');
});

test('Johansson as player is never duplicated: Mac keeps the day watch while he is ashore and returns ashore at night',()=>{
 const {run}=alongside(),shore=new THREE.Group();
 const crew=createFerryCrewAboard({run,playerIdentity:()=> 'Johansson',townBody:name=>name==='Mac'?shore:null,characters:{attach(){}},register(){},onAction(){}});
 crew.update(1/60,600);
 assert.equal(crew.snapshot().length,8);assert.ok(!crew.snapshot().some(p=>p.name==='Johansson'));
 const relief=crew.snapshot().find(p=>p.post==='chief');assert.equal(relief.name,'Mac');assert.equal(shore.userData.aboardFerry,true);
 assert.match(crew.bodies.get('Mac').text,/Mac Turner/,'the prompt tells his own biography');
 crew.update(1/60,1410);assert.equal(shore.userData.aboardFerry,false);
});
