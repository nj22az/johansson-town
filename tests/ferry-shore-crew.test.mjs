import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {routeAt,groundHeight} from '../src/world/layout.js';
import {standingHitsRect} from '../physics.js';
import {createFerryShoreCrew,KITANO_HOME,KITANO_HAND_DAY,kitanoHandOut} from '../src/people/ferry-shore-crew.js';
import {FERRY_MOORINGS} from '../src/world/ferry.js';
import {HARBOUR_OFFICE} from '../src/world/business-layout.js';
import {calledToQuay} from '../src/people/shore-duty.js';
import {FERRY_WORKING_DAY} from '../src/people/ferry-crew.js';
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');
const {createBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
world.group.updateMatrixWorld(true);
// The harbour agent's street body, at his office door, the way the street has him (people/residents.js).
const agent=new THREE.Group();agent.name='Harbour master';agent.userData.name='Harbour master';agent.position.set(HARBOUR_OFFICE.door[0],0,HARBOUR_OFFICE.door[2]+.7);world.group.add(agent);
const DOOR=agent.position.clone();
const attached=[];
const shore=createFerryShoreCrew({shoreParent:world.group,shoreColliders:world.colliders,characters:{attach(g,name){attached.push(name);}},register(){},onAction(){},townBody:name=>name==='Harbour master'?agent:null});
const position=g=>g.getWorldPosition(new THREE.Vector3());
const NOON=720;

function perform(port,line,minutes=NOON){
 const task={id:port+':'+line.id,post:'shore',station:'shore-'+port,action:'Handle '+line.name,seconds:2,target:line.shoreTarget};
 shore.update(.1,[task],true,minutes);const b=shore.bodies.get(port);assert.ok(b);
 assert.equal(shore.taskReady(task.id),false,'travel cannot complete the task on assignment');
 let working=false,moved=false;
 for(let i=0;i<4000&&!shore.taskReady(task.id);i++){
  const p=position(b.g);shore.update(.2,[task],true,minutes);const q=position(b.g);
  assert.ok(p.distanceTo(q)<.31,'bounded shore walking, including a normal ground step');moved||=p.distanceTo(q)>.005;
  assert.ok(routeAt(q.x,q.z,.18),'feet remain over actual shore');
  assert.ok(Math.abs(q.y-groundHeight(q.x,q.z))<.05,'feet follow the authored ground');
  assert.ok(!world.colliders.some(c=>!c.disabled&&c.walk!==false&&c.walkSolid!==false&&standingHitsRect(q.x,q.z,.18,q.y,c)),'shore hands clear the real built props at '+q.toArray());
  if(shore.taskAtStation(task.id)&&!shore.taskReady(task.id))working=true;
  if(b.blocked)assert.fail(port+': '+b.blocked+' '+JSON.stringify(shore.snapshot()));
 }
 assert.ok(moved,'the shore hand walked to the bitt');assert.ok(working,'arrival precedes completed line handling');
 assert.equal(shore.taskReady(task.id),true,JSON.stringify(shore.snapshot()));
 assert.equal(b.g.userData.socialPose,'Interact');
 return b;
}

test('the harbour agent’s own street body walks from the office door to all four Minato bitts, works, and returns to the door',()=>{
 for(const line of FERRY_MOORINGS.town){
  const b=perform('town',line);assert.equal(b.g,agent,'the street body, not a second one');
  assert.equal(agent.userData.ferryShoreTask,true);assert.equal(calledToQuay('Harbour master'),true,'his day and any room let him go while he is out');
 }
 assert.ok(!attached.includes('Harbour master'),'no second harbour agent avatar was created');
 for(let i=0;i<4000&&agent.userData.ferryShoreTask;i++)shore.update(.2,[],true,NOON);
 assert.equal(agent.userData.ferryShoreTask,false,JSON.stringify(shore.snapshot()));assert.equal(calledToQuay('Harbour master'),false);
 assert.ok(position(agent).distanceTo(DOOR)<.04,'returns to the office door he was taken from');
 assert.equal(agent.userData.walking,false);
});

test('a room keeps him until it lets him out: called at once, moved only when free',()=>{
 const line=FERRY_MOORINGS.town[0],task={id:'lunch:'+line.id,post:'shore',station:'shore-town',action:'Make the head line fast',seconds:2,target:line.shoreTarget};
 agent.userData.inRamen=true;
 for(let i=0;i<20;i++)shore.update(.2,[task],true,NOON);
 assert.equal(agent.userData.ferryShoreTask,true,'called');assert.equal(calledToQuay('Harbour master'),true,'his plan lets him out of the counter');
 assert.ok(position(agent).distanceTo(DOOR)<.001,'not moved while the room has him');assert.equal(shore.taskAtStation(task.id),false);
 delete agent.userData.inRamen;
 for(let i=0;i<4000&&!shore.taskReady(task.id);i++)shore.update(.2,[task],true,NOON);
 assert.equal(shore.taskReady(task.id),true);
 for(let i=0;i<4000&&agent.userData.ferryShoreTask;i++)shore.update(.2,[],true,NOON);
 assert.ok(position(agent).distanceTo(DOOR)<.04);
});

test('Kitano has Kai, the line hand, who walks between its real pier bitts',()=>{
 for(const line of FERRY_MOORINGS.airport)perform('airport',line);
 assert.deepEqual(attached,['Kai']);
 assert.equal(shore.bodies.get('airport').g.parent,world.group);
 const snap=shore.snapshot().find(b=>b.where==='shore-airport');assert.equal(snap.name,'Kai');assert.equal(snap.existingResident,false);assert.equal(snap.space,'world');
 for(let i=0;i<4000&&shore.bodies.get('airport').returning;i++)shore.update(.2,[],true,NOON);
});

test('a shore hand can acknowledge arrival but waits without a gesture or work credit for the ship hand',()=>{
 const line=FERRY_MOORINGS.town[0],task={id:'wait-for-ship',post:'shore',station:'shore-town',action:'Return the head line eye',seconds:2,target:line.shoreTarget};
 for(let i=0;i<4000&&!shore.taskAtStation(task.id);i++)shore.update(.2,[task],false,NOON);
 assert.equal(shore.taskAtStation(task.id),true,'arrival does not depend on permission to begin work');
 for(let i=0;i<15;i++)shore.update(.2,[task],false,NOON);
 assert.equal(shore.taskReady(task.id),false);assert.equal(agent.userData.socialPose,'Idle');
 assert.equal(shore.snapshot().find(b=>b.task===task.id).progress,0,'waiting longer than the work duration earns no work credit');
 shore.update(.1,[task],true,NOON);assert.equal(agent.userData.socialPose,'Interact');
 assert.equal(shore.taskReady(task.id),false);
 for(let i=0;i<20&&!shore.taskReady(task.id);i++)shore.update(.2,[task],true,NOON);
 assert.equal(shore.taskReady(task.id),true);
 for(let i=0;i<4000&&agent.userData.ferryShoreTask;i++)shore.update(.2,[],true,NOON);
});

test('Kai goes home to the Shiroma house after the last boat and is back on the pier before the crew sign on',()=>{
 shore.update(.2,[],true,NOON);const b=shore.bodies.get('airport'),post=position(b.g).clone();
 assert.equal(KITANO_HAND_DAY.home,22*60+50,'after the last boat leaves his pier');assert.ok(KITANO_HAND_DAY.out<FERRY_WORKING_DAY.signOn);
 assert.equal(kitanoHandOut(NOON),true);assert.equal(kitanoHandOut(23*60),false);assert.equal(kitanoHandOut(3*60),false);
 let steps=0;
 for(;steps<6000&&b.rest!=='home';steps++){const p=position(b.g);shore.update(.2,[],true,23*60);const q=position(b.g);assert.ok(p.distanceTo(q)<.31,'walks home');assert.ok(!b.blocked,b.blocked);}
 assert.equal(b.rest,'home',JSON.stringify(shore.snapshot()));assert.equal(b.g.visible,false,'indoors');
 const home=position(b.g);assert.ok(Math.hypot(home.x-KITANO_HOME[0],home.z-KITANO_HOME[1])<.25,'at his gate');assert.ok(steps>5,'it is a walk, not a jump');
 for(let i=0;i<40;i++)shore.update(.2,[],true,3*60);assert.equal(b.rest,'home','stays in through the night');
 for(let i=0;i<6000&&b.rest!==null;i++)shore.update(.2,[],true,KITANO_HAND_DAY.out+1);
 assert.equal(b.rest,null);assert.equal(b.g.visible,true);assert.ok(position(b.g).distanceTo(post)<.2,'back at his post on the pier');
 // A late call finds him at home and takes him out to the bitts.
 for(let i=0;i<6000&&b.rest!=='home';i++)shore.update(.2,[],true,23*60);
 const line=FERRY_MOORINGS.airport[0],task={id:'late:'+line.id,post:'shore',station:'shore-airport',action:'Make the head line fast',seconds:1,target:line.shoreTarget};
 for(let i=0;i<4000&&!shore.taskReady(task.id);i++)shore.update(.2,[task],true,23*60);
 assert.equal(shore.taskReady(task.id),true);assert.equal(b.g.visible,true);
 for(let i=0;i<6000&&b.rest!=='home';i++)shore.update(.2,[],true,23*60);
 assert.equal(b.rest,'home','and goes back in afterwards');
});
