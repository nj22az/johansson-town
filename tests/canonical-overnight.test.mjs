import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {CAST} from '../src/people/cast.js';
import {CANONICAL_REST} from '../src/people/canonical-rest.js';
import {NEIGHBOURS,createNeighbours} from '../src/people/neighbours.js';
import {canonicalDay} from '../src/people/canonical-day.js';
import {activeResidentHome} from '../src/people/home-directory.js';
import {sleepHours} from '../src/people/home-life.js';
import {WORLD_CAST} from '../src/people/residents.js';
import {kissaVisitAt} from '../src/commerce/kissa-higa.js';
import {FERRY_PEOPLE} from '../src/people/ferry-crew.js';

const minute=m=>((m%1440)+1440)%1440;
test('every named resident has an actual daily controller, with explicit rest for every secondary neighbour',()=>{
 // The street cast, the neighbours, the master in his shed (port-shed.js), and the crew whose only body is the ship's or
 // the Kitano pier's (ferry-crew-aboard.js, ferry-shore-crew.js).
 const controlled=new Set(['Johansson','Mr Fujita',...WORLD_CAST.map(p=>p.name),...NEIGHBOURS.map(p=>p.name),...FERRY_PEOPLE]);
 for(const p of CAST)assert.ok(controlled.has(p.name),p.name+' has a runtime controller');
 for(const p of NEIGHBOURS){assert.ok(CANONICAL_REST[p.name],p.name+' has overnight hours');assert.deepEqual(sleepHours(p.profile),CANONICAL_REST[p.name]);}
});
test('secondary residents stay at their assigned home across midnight until morning, without requiring a bedroom',()=>{
 for(const p of NEIGHBOURS){
  const {sleep,wake}=CANONICAL_REST[p.name],duration=minute(wake-sleep),home=activeResidentHome(p.name).target;
  for(let dt=0;dt<duration;dt+=15){
   const plan=canonicalDay(p.name,sleep+dt);assert.equal(plan.place,'home',p.name+' at '+minute(sleep+dt));
   assert.equal(plan.rest,'sleep');assert.deepEqual(plan.target,[home.x,home.z]);
  }
  // Since 30 October 2026 a regular's breakfast can be at Kissa Higa's counter instead (Yui on weekdays;
  // commerce/kissa-higa.js), exactly when the kissaten's data says so; never their sleep or their waking.
  for(const dt of [0,14,15,44]){const m=wake+dt,there=dt>=15&&kissaVisitAt(p.name,m);
   assert.equal(canonicalDay(p.name,m).place,there?'kissa-higa':'home',p.name+(there?' has breakfast at the Kissa Higa counter':' wakes and has breakfast before leaving'));}
 }
});
test('residents enter only at their own door and later leave from it without a position jump',()=>{
 const parent=new THREE.Group(),system=createNeighbours({parent});
 // No rendered interiors are constructed: overnight occupancy uses the actual street actor and home entrance.
 for(const p of system.people){const h=activeResidentHome(p.spec.name).target;p.g.position.set(h.x,0,h.z);p.initialised=true;}
 // A home up an indoor stair (neighbours.js STAIR_HOMES: the Nakamuras above the dessert shop) is entered at its family
 // doorway and slept in upstairs, so those residents climb before they are indoors; everyone else is in at once.
 for(let i=0;i<400;i++)system.update(.1,0);
 for(const p of system.people){
  const h=activeResidentHome(p.spec.name).target,top=p.spec.stair?.route.at(-1);
  assert.equal(p.g.userData.indoors,'home',p.spec.name);assert.equal(p.g.visible,false,p.spec.name);
  if(top)assert.ok(p.g.position.distanceTo(new THREE.Vector3(...top))<.05,p.spec.name+' rests upstairs');
  else assert.ok(Math.hypot(p.g.position.x-h.x,p.g.position.z-h.z)<.01,p.spec.name+' is at the real door');
 }
 for(let i=0;i<300;i++)system.update(1/30,i/1800);
 for(const p of system.people){assert.equal(p.g.userData.indoors,'home',p.spec.name+' remains indoors throughout the night');assert.equal(p.g.visible,false);}
 const snapshots=system.snapshot();
 const restored=createNeighbours({parent:new THREE.Group(),getState:()=>({residentLocations:snapshots})});restored.update(0,180);
 for(const p of restored.people){assert.equal(p.g.userData.indoors,'home');assert.deepEqual(restored.snapshot()[p.spec.name].position,snapshots[p.spec.name].position);}
 for(const p of restored.people){
  const {wake}=CANONICAL_REST[p.spec.name],before=p.g.position.clone();
  restored.update(1/60,wake+45);
  assert.ok(Math.hypot(p.g.position.x-before.x,p.g.position.z-before.z)<=.02,p.spec.name+' starts walking from the saved doorway');
 }
});
