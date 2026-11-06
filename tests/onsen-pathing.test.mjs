import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {GARDEN} from '../src/world/garden-layout.js';
import {ONSEN_DOOR,onsenPoint} from '../src/world/onsen-layout.js';
import {createNavigation} from '../src/people/navmesh.js';
import {createCastAI} from '../src/people/schedules.js';
import {createIndoorResidents} from '../src/people/indoor-residents.js';
import {ONSEN_ROOM} from '../src/world/interiors/onsen.js';
import {circleHitsRect,townBoundsBlocked,sweepFraction} from '../physics.js';

function setup(){
 installDOM();
 const sites=[],world=createTown({scene:new THREE.Scene(),sites,mobile:true,shadows:false,register(o){o.userData.hit={inside:false};},onAction(){},enter(){}});
 world.people=world.people.filter(p=>p.profile.name==='Thuan');
 const person=world.people[0],g=person.g;
 const state={inventory:[],onsenDate:0};
 const blocked=(x,z,r=.32)=>townBoundsBlocked(x,z,r)||world.colliders.some(c=>circleHitsRect(x,z,r,c));
 const ai=createCastAI({world,player:new THREE.Group(),state:()=>state,paused:()=>false,collides:blocked});
 return {world,sites,person,g,state,blocked,ai};
}

test('the onsen portal and exit are reachable through a narrow opening, with solid walls beside it',()=>{
 try{
  const {sites,blocked}=setup(),site=sites.find(s=>s.id==='onsen');
  const [x,,z]=site.door;
  assert.equal(blocked(x,z),false,'Advertised doorway is collision-free');
  assert.deepEqual([x,z],ONSEN_DOOR,'Player and resident thresholds agree');
  const path=createNavigation(blocked).path({x:15,z:3},{x,z});
  assert.ok(path.length);assert.deepEqual(path.at(-1),ONSEN_DOOR);
  let from={x:15,z:3};
  for(const [x,z] of path){assert.equal(sweepFraction(from,{x,z},blocked),1);from={x,z};}
  assert.equal(sweepFraction(from,{x:site.exitPosition[0],z:site.exitPosition[2]},blocked),1,'Exit corridor is clear');
  for(const localX of [-2.9,.2])assert.equal(blocked(...onsenPoint(localX,4)),true,'Front walls remain solid');
  assert.equal(blocked(...onsenPoint(-1.4,3)),true,'Room body remains sealed beyond the portal');
 }finally{}
});

for(const dt of [1/60,1/30])test(`Thuan approaches, crosses the onsen threshold and walks out at ${1/dt} Hz`,()=>{
 try{
  const {world,person,g,state,blocked,ai}=setup();
  ai.update(dt,1190,false); // Initialise during her existing shop shift, before the invitation.
  delete g.userData.indoors;g.visible=true;g.position.set(GARDEN.entry[0],0,GARDEN.entry[1]);
  const guests=createIndoorResidents({world,parent:new THREE.Group(),place:'onsen',layout:{entrance:ONSEN_ROOM.spawn},getState:()=>state});
  for(let t=0;t<100&&!g.userData.indoors;t+=dt){
   const previous=g.position.clone();ai.update(dt,1215,false);
   assert.equal(sweepFraction(previous,g.position,blocked),1,'Every approach step obeys collision');
   if(!g.userData.indoors){assert.equal(g.visible,true);assert.deepEqual(guests.sync(1215,dt),[],'No borrowing before crossing');}
  }
  assert.equal(g.userData.indoors,'onsen','She reaches the bath within her scheduled window');
  const [frontX]=onsenPoint(-1.4,4.2);
  assert.ok(g.position.x>frontX,'She crosses the facade before being hidden');
  assert.ok(Math.hypot(g.position.x-ONSEN_DOOR[0],g.position.z-ONSEN_DOOR[1])<.16);
  assert.equal(g.visible,false);assert.equal(ai.snapshot().Thuan.indoors,'onsen');
  assert.deepEqual(guests.sync(1215,dt),['Thuan'],'Indoor hand-off works after entry');
  guests.restore();
  assert.equal(g.userData.inOnsen,undefined);assert.equal(g.userData.outfit,undefined);
  for(let t=0;t<30;t+=dt){
   const previous=g.position.clone();ai.update(dt,1300,false);
   assert.equal(sweepFraction(previous,g.position,blocked),1,'Every exit step obeys collision');
   assert.equal(g.visible,true);assert.equal(g.userData.indoors,undefined);
  }
  assert.ok(Math.hypot(g.position.x-ONSEN_DOOR[0],g.position.z-ONSEN_DOOR[1])>.3,'She leaves the threshold and continues home');
  // Thuan lives on Kitano-jima only and goes home on the last boat (the cast consolidation's phase 3, johansson-town/AGENTS.md;
  // her Kitahama weekday room was dropped): after the bath she walks to the terminal for it. It used to be 'home' in Kitahama.
  assert.equal(g.userData.place,'bus');assert.equal(ai.snapshot().Thuan.indoors,null);
 }finally{}
});

test('an old indoor onsen save resolves the current threshold and can still leave',()=>{
 try{
  const {g,state,blocked,ai}=setup();
  state.residentLocations={Thuan:{position:onsenPoint(-1.4,5.4),indoors:'onsen',place:'onsen'}};
  ai.update(1/30,1215,false);
  assert.deepEqual([g.position.x,g.position.z],ONSEN_DOOR);assert.equal(g.userData.indoors,'onsen');
  assert.equal(blocked(g.position.x,g.position.z),false);
  for(let t=0;t<30;t+=1/30)ai.update(1/30,1300,false);
  assert.ok(Math.hypot(g.position.x-ONSEN_DOOR[0],g.position.z-ONSEN_DOOR[1])>.3);assert.equal(g.visible,true);assert.equal(g.userData.indoors,undefined);
 }finally{}
});
