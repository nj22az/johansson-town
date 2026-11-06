import test from 'node:test';
import {satoRamenOpen} from '../src/world/sato-ramen-layout.js';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createIslandBusinesses,businessId,migratedVisits} from '../src/world/businesses.js';
import {createTown} from '../src/world/town.js';
import {assignWorkplaces,EVENING_DESKS,workRoomOf} from '../src/people/workplaces.js';
import {createCastAI} from '../src/people/schedules.js';
import {residentPlan} from '../src/people/social.js';
import {createWorkplaceResidents} from '../src/people/workplace-residents.js';
import {createResidentLedger} from '../src/people/resident-personalities.js';
import {createNavigation} from '../src/people/navmesh.js';
import {buildCompactShop} from '../src/world/interiors/compact-shops.js';
import {buildBusinessContent,BUSINESS_CONTENT_CATALOGUE} from '../src/world/interiors/business-content.js';
import {buildWarehouseInterior} from '../src/world/interiors/warehouse.js';
import {buildSuppliedRoom,suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {TOWN_DESTINATIONS} from '../src/world/town-grid.js';
import {circleHitsRect,townBoundsBlocked,sweepFraction} from '../physics.js';
import {ITEMS} from '../content-data.js';
import {createActivities} from '../activities.js';
import {STREET_CAST,WORLD_CAST,STREET_CAST_NAMES} from '../src/people/residents.js';
// Residents return to the street one at a time; checks on someone still away wait for them.
const inCast=name=>STREET_CAST_NAMES.includes(name);

function setup(){
 installDOM();globalThis.self=globalThis;
 const sites=createIslandBusinesses(),scene=new THREE.Scene(),targets=[];
 const register=(o,label,fn,inside=false)=>{o.userData.hit={label,fn,inside};targets.push(o);};
 const world=createTown({scene,sites,mobile:true,shadows:false,register,enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3(0,0,-30)});
 assignWorkplaces(world,sites);
 const blocked=(x,z,r=.35)=>townBoundsBlocked(x,z,r)||world.colliders.some(c=>circleHitsRect(x,z,r,c));
 const state={inventory:[],residentLocations:{}};
 return {sites,scene,targets,register,world,blocked,state};
}
function roomFor(context,site,builder=buildCompactShop){
 const room=new THREE.Group(),colliders=[];context.scene.add(room);
 const layout=builder({site,room,reg:context.register,collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height}),action(){},exit(){}});
 const blocked=(x,z,r=.35)=>suppliedRoomBoundsBlocked(layout,x,z,r)||colliders.some(c=>circleHitsRect(x,z,r,c));
 return {room,layout,blocked};
}
function staffService(c,r){return createWorkplaceResidents({world:c.world,parent:c.scene,getTargets:()=>c.targets,collides:r.blocked,getPlayerPosition:()=>null,getEntrance:()=>r.layout.spawn,getLayout:()=>r.layout,getState:()=>c.state,ledger:createResidentLedger(()=>c.state)});}
function startClock(c,minutes){const player=new THREE.Group();player.position.set(0,0,-30);const ai=createCastAI({world:c.world,player,state:()=>c.state,paused:()=>false,collides:c.blocked});ai.update(0,minutes,false);return ai;}

test('published businesses have reachable real doors and a clear passage beside Minato',()=>{
 try{
  const c=setup(),{sites,world,blocked}=c,nav=createNavigation(blocked);
  assert.equal(sites.some(s=>s.id==='form3d'),true);
  assert.ok(world.group.getObjectByName('Consolidated harbour office'));
  assert.equal(sites.find(s=>s.id==='frontrow').bookshop,true);assert.equal(sites.find(s=>s.id==='form3d').industrialWorkshop,true);
  assert.equal(world.people.length,WORLD_CAST.length);assert.equal(new Set(world.people.map(p=>p.profile.name)).size,WORLD_CAST.length);
  // Kitano-jima's doors (kitano-hamlet.js) are reached by the ferry, not on foot from Minato.
  for(const site of [...sites,world.warehouse.place].filter(s=>!s.plot?.startsWith('kitano-'))){
   const [x,,z]=site.door;assert.equal(blocked(x,z),false,site.id+' door');
   const path=nav.path({x:-3,z:-20},{x,z});assert.deepEqual(path.at(-1),[x,z],site.id+' reachable door');
  }
  for(const z of [-5.1,-4.6,-4.1])assert.equal(sweepFraction({x:-6.5,z},{x:-17,z},blocked),1,'Continuous passage to rear yard at '+z);
  assert.notDeepEqual(TOWN_DESTINATIONS.workshop,TOWN_DESTINATIONS.books);assert.deepEqual(TOWN_DESTINATIONS.workshop,[sites.find(s=>s.id==='form3d').door[0],sites.find(s=>s.id==='form3d').door[2]]);
  assert.deepEqual(TOWN_DESTINATIONS.books,[sites.find(s=>s.id==='frontrow').door[0],1.6]);
  const roles=Object.fromEntries(world.people.map(p=>[p.profile.name,p.profile.workSite]));
  // Nhung is the island doctor (22 October 2026): her work is the clinic, and nobody keeps Front-Row's floor by day.
  if(inCast('Nhung'))assert.equal(roles.Nhung,'clinic');assert.ok(!Object.values(roles).includes('frontrow'),'Front-Row’s shop floor is unstaffed');
  for(const name of ['Chin','Tetsuo'].filter(inCast))assert.equal(roles[name],'form3d');
  if(inCast('Harbour master'))assert.equal(roles['Harbour master'],'office');if(inCast('Mrs Sato'))assert.equal(roles['Mrs Sato'],'ramen');
  for(let minute=0;minute<1440;minute+=10)for(const p of world.people){
   // Sato Ramen is on the island now, beside Minato: open at lunch, with Mrs Sato in from 10:30.
   const plan=residentPlan(p.profile,minute,false,c.state);
   if(plan.place==='ramen')assert.ok(p.profile.name==='Mrs Sato'?minute>=630&&minute<900:satoRamenOpen(minute),p.profile.name+' at Sato Ramen outside its hours at '+minute);
  }
 }finally{}
});

test('bookshop and dock workshop keep distinct content, accessible rooms and their own workers',()=>{
 try{
  const c=setup(),ids=[];
  for(const [id,minute] of [['frontrow',1180],['form3d',1050]]){
   const site=c.sites.find(s=>s.id===id),r=roomFor(c,site),nav=createNavigation(r.blocked,{step:.16,heightAt:()=>0,bounds:r.layout.bounds});
   assert.equal(!!r.layout.workshop,id==='form3d');
   const content=buildBusinessContent({site,room:r.room,register:c.register,onInspect(){},onAction(){}});ids.push(...content.objects.keys());
   if(id==='frontrow'){assert.ok(!r.room.getObjectByName('Oscilloscope'));assert.ok(!r.room.getObjectByName('Star Port cabinet'));assert.ok(r.room.getObjectByName('Reading table'));}
   for(const target of [...Object.values(r.layout.staff),...r.room.children.filter(o=>o.userData.seat).map(o=>o.userData.seat.stand)]){
    const [x,,z]=target;assert.equal(r.blocked(x,z),false,'Clear station '+target);assert.deepEqual(nav.path({x:r.layout.spawn[0],z:r.layout.spawn[2]},{x,z}).at(-1),[x,z]);
   }
   // Chin's workSite is still the workshop, but since the consolidation (docs/CAST-CONSOLIDATION.md, phase 2) he is the
   // ferry's motorman, aboard 06:05–22:20 (social.js onWatch), and Tetsuo keeps the bench alone while she sails
   // (ferry-crew.js). Front-Row's floor is unstaffed since Nhung became the island doctor (22 October 2026); she sets the
   // town's paper at its back bench in the evening (workplaces.js EVENING_DESKS). So the workers expected in the room
   // are the ones whose day puts them there: 17:30 in the workshop, 19:40 at the paper.
   const assigned=c.world.people.filter(p=>p.profile.workSite===id||EVENING_DESKS[p.profile.name]?.site===id),ledger=createResidentLedger(()=>c.state);
   const staff=assigned.filter(p=>workRoomOf(p.profile,residentPlan(p.profile,minute,false,c.state))===id);
   assert.ok(staff.length,id+' has a worker in at minute '+minute);
   for(const p of assigned.filter(p=>!staff.includes(p)))assert.equal(residentPlan(p.profile,minute,false,c.state).place,'ferry',p.profile.name+' is aboard, not missing');
   for(const p of staff)ledger.account(p.profile.name,minute).shopping={finished:true};startClock(c,minute);
   const service=staffService(c,r);service.enter(site,minute);
   for(const p of staff)assert.equal(p.g.userData.inWorkplace,id);
   for(let i=0;i<500;i++){service.update(.1,minute+i*.025,false);for(const p of staff)assert.equal(r.blocked(p.g.position.x,p.g.position.z,.28),false,p.profile.name+' clear of furniture');}
   for(let i=0;i<1000;i++)service.update(.1,1500,false);
   for(const p of staff)assert.equal(p.g.userData.inWorkplace,undefined,p.profile.name+' leaves by the door');
   service.restore();r.layout.workshop?.dispose();
  }
  ids.push(...BUSINESS_CONTENT_CATALOGUE.filter(i=>i.siteId==='office').map(i=>i.id));assert.deepEqual(ids.sort(),ITEMS.map(i=>i.id).sort());
  assert.ok(BUSINESS_CONTENT_CATALOGUE.filter(i=>i.siteId==='form3d').every(i=>i.place.includes('western quay')));
 }finally{}
});

test('restored supplied office and warehouse use their existing staff and working interiors',async()=>{
 try{
  const c=setup();globalThis.createImageBitmap=async()=>({width:256,height:256,close(){}});
  const native=fetch;globalThis.fetch=async url=>String(url).startsWith('blob:')?native(url):new Response(await readFile(new URL('../assets/'+new URL(url).pathname.split('/assets/')[1],import.meta.url)));
  // The harbour master sleeps in the office at night now, so meet him on duty in the morning.
  // Mrs Sato cooks at Sato Ramen now; the warehouse keeps its interior with nobody assigned.
  for(const [id,name,builder,minute] of [['office','Harbour master',buildSuppliedRoom,480],['warehouse','Nobody',buildWarehouseInterior,1000]]){
   const site=[...c.sites,...c.world.landmarks].find(s=>s.id===id),r=roomFor(c,site,builder);
   if(id==='office'){assert.ok(r.room.getObjectByName('Harbour office shell'));assert.ok(r.room.getObjectByName('Clerk CRT monitor'));assert.ok(c.targets.some(o=>o.userData.hit.label==='Open harbour spreadsheets'));}
   if(!inCast(name))continue;
   startClock(c,minute);const service=staffService(c,r);service.enter(site,minute);
   const person=c.world.people.find(p=>p.profile.name===name);assert.equal(person.g.userData.inWorkplace,id);assert.equal(person.g.visible,true);
   const used=new Set();for(let i=0;i<900;i++){service.update(.1,minute+i*.05,false);if(person.g.userData.socialPose)used.add(person.g.userData.socialPose);}
   assert.ok(used.size,name+' performs tasks inside '+id);service.restore();
  }
 }finally{}
});

test('the relocated workshop keeps saved visits and the actual printing buttons working',()=>{
 try{
  const dom=installDOM();
  assert.equal(businessId('form3d'),'form3d');assert.equal(businessId('stepwise'),'form3d');
  assert.deepEqual(migratedVisits(['form3d','journal','frontrow','electronics','career']),['form3d','frontrow','office']);
  const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>1030,getSocialContext:()=>({inside:'form3d'})});
  acts.action('workshop');dom.button('Check with StepWise');dom.button('Use this pattern in Form 3D');dom.button('Print model · ¥40');
  acts.tick(8);acts.action('workshop');dom.button('Collect model');assert.equal(acts.state.inventory.length,1);acts.close();
 }finally{}
});
