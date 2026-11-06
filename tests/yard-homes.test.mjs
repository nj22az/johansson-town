import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {STREET_CAST} from '../src/people/residents.js';
import {residentPlan} from '../src/people/social.js';
import {commuterPhase} from '../src/people/commuter-schedule.js';
import {YARD_HOMES,YARD_RESIDENT_NAMES} from '../src/world/yard-homes-layout.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {circleHitsRect,townBoundsBlocked} from '../physics.js?snappy=1';

test('the Front-Row staff live in the yard behind the shop and sleep at home, not on the bus',()=>{
 
 try{
  for(const name of YARD_RESIDENT_NAMES){
   const p=STREET_CAST.find(r=>r.name===name);assert.ok(p,name+' is in the street cast');
   assert.ok(CAST_RECIPES[name],name+' has a drawn Shimanchu recipe');
   const home=Object.values(YARD_HOMES).find(h=>h.door[0]===p.home[0]&&h.door[1]===p.home[1]);
   assert.ok(home,name+' lives at a yard house door: '+p.home);assert.match(p.homeAddress,/Front-Row Yard/);
   assert.equal(commuterPhase(p,3*60),'town','never away on the Harbour Line');
   const night=residentPlan(p,3*60,false,{});
   assert.equal(night.place,'home',name+' is at home at three in the morning');
   assert.deepEqual(night.target,p.home);
  }
  const aya=STREET_CAST.find(r=>r.name==='Nhung');
  assert.equal(residentPlan(aya,12*60,false,{}).place,'work','Nhung works her shift');
 }finally{}
});

test('the yard houses are home sites you can walk up to and into, clear of the passage',async()=>{
 installDOM();
 try{
  const {buildYardHomes}=await import('../src/world/yard-homes.js');
  const world={group:new THREE.Group(),colliders:[]},sites=[],doors=[];
  buildYardHomes(world,{sites,register:(o,label,fn)=>doors.push({label,fn}),enter:site=>doors.entered=site.id});
  // 1 Front-Row Yard came down in phase 4 (Nhung home at 3 Kitahama, Reiko retired): Tetsuo's house is the yard's only home.
  assert.deepEqual(sites.map(s=>s.id).sort(),['resident-home-kenji']);
  for(const s of sites){
   assert.deepEqual(s.homeOwners,['Tetsuo'],s.id+': Tetsuo alone at 2 since Chin moved in with Thao');
   const [x,,z]=s.door;assert.equal(townBoundsBlocked(x,z,.32),false,s.id+' door is on walkable ground');
   assert.ok(!world.colliders.some(c=>circleHitsRect(x,z,.32,c)),s.id+' door is not inside a house');
  }
  // The path from the lane gap and the passage beside Minato stay open, and so is the lawn where 1 Front-Row Yard stood.
  for(const [x,z] of [[-23.8,1.6],[-19.6,1.6],[-16.2,1.6],[-18,-4.2],[-21.3,-1.2],[-19,-1.2],[-23.5,-2]])
   assert.ok(!world.colliders.some(c=>circleHitsRect(x,z,.32,c)),'clear at '+[x,z]);
  assert.equal(world.homes.get('Reiko'),undefined,'the retired tenant has no home');assert.equal(world.homes.get('Tetsuo').household,'resident-home-kenji');
  assert.ok(!world.group.getObjectByName('Tama asleep on the crates'),'the removed house’s step dressing went with it');
  doors.find(d=>/Tetsuo/.test(d.label)).fn();assert.equal(doors.entered,'resident-home-kenji');
 }finally{}
});


test('the flat above the former post office, Barfly’s room and the two Nishi houses have no door: the buildings are gone (phase 4)',async()=>{
 installDOM();
 const {buildIslandHomes}=await import('../src/world/island-homes.js');
 const {EAST_ROW,NISHI}=await import('../src/world/okinawa/layout.js');
 const sites=[],world={group:new THREE.Group(),colliders:[]},doors=[];
 buildIslandHomes(world,{sites,register:(o,label)=>doors.push(label),enter(){}});
 for(const id of ['home-shimabukuro','home-izakaya','home-kinjo','home-oshiro'])assert.ok(!sites.some(s=>s.id===id)&&!(world.landmarks||[]).some(s=>s.id===id),id+' has no site');
 assert.ok(!world.group.children.some(o=>/Private residential door/.test(o.name)),'no private door panel is left on the street');
 assert.ok(!doors.some(l=>/post office|Barfly|Kinjō|Ōshiro/.test(l)),'no entrance prompt for a removed home');
 assert.deepEqual(EAST_ROW.plots.map(p=>p.id),['nakamura','higa-saketen']);assert.deepEqual(NISHI.plots.map(p=>p.id),['net-shed','higa','utaki']);
 assert.ok(sites.some(s=>s.id==='home-higa')||(world.landmarks||[]).some(s=>s.id==='home-higa'),'the Higa house still has its door');
});
