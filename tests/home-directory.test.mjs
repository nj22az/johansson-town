import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {CAST} from '../src/people/cast.js';
import {ISLAND_HOUSEHOLDS,homeForResident,homeUnits,householdAtHome,homeNameplate} from '../src/people/island-households.js';
import {HOUSEHOLDS,canonicalHomeId} from '../src/people/households.js';
import {residentCards,canonicalHomeSites,residentHome,activeResidentHome} from '../src/people/home-directory.js';
import {KITAHAMA,KITAHAMA_FLATS,KITAHAMA_HEIGHTS,kitahamaHomeFor,plotGate} from '../src/world/kitahama-layout.js';
import {buildIslandHomes} from '../src/world/island-homes.js';
import {buildResidentHome} from '../src/world/interiors/resident-home.js';
import {createKit} from '../src/world/okinawa/kit.js';
import {buildKitahamaQuarter} from '../src/world/okinawa/kitahama-quarter.js';
import {createWalkSurface} from '../src/world/walk-surface.js';
import {planHeight} from '../src/world/layout.js';
import {standingHitsRect,townBoundsBlocked,canStepBetween} from '../physics.js';
import {installDOM} from './fixtures.mjs';

test('all 23 cast members have one canonical primary home; shared households map once; the crew’s cabins are aboard; no card points at a retired home',()=>{
 const cards=residentCards(),targets=canonicalHomeSites(cards);
 // The Nakamura family retired on 31 October 2026 (roster.js RETIRED).
 assert.equal(cards.length,23);assert.deepEqual(cards.map(c=>c.name),CAST.map(c=>c.name));
 // The 12 households' homes and Kai's rented Shiroma house are the shore home pins (phase 4: no retired flat, no removed house;
 // the doctor's flat went with Dr Kakazu on 22 October 2026); the four who live aboard point at the terminal.
 assert.equal(targets.filter(t=>!t.aboard).length,13);assert.equal(new Set(targets.map(t=>t.homeId)).size,targets.length);
 for(const name of ['Ryo','Ren','Aya','Jun'])assert.equal(cards.find(c=>c.name===name).home.aboard,true,name+' sleeps aboard');
 assert.equal(cards.find(c=>c.name==='Kai').home.id,'kitano-2');assert.equal(cards.find(c=>c.name==='Kai').home.target.id,'home-kitano-2');
 for(const card of cards){
  assert.equal(card.home.id,homeForResident(card.name).home);
  assert.equal(card.home.retired,false,card.name+' lives in a home that stands');
  assert.ok(card.home.residents.includes(card.name),card.name+' belongs to the listed home');
  for(const home of [card.home,...card.secondaryHomes]){
   assert.ok(home.target&&[home.target.x,home.target.y,home.target.z].every(Number.isFinite),card.name+' has an exterior target');
   assert.equal(home.target.id,householdAtHome(home.id).entranceSiteId);assert.equal(home.target.isResidence,true);
  }
  assert.ok(card.secondaryHomes.every(h=>h.aboard),card.name+' has no second room ashore (addendum 4)');
 }
 assert.equal(residentHome('Thuan').id,'kitano-1');assert.equal(activeResidentHome('Thuan').id,'kitano-1');assert.deepEqual(cards.find(c=>c.name==='Thuan').secondaryHomes,[]);
 assert.deepEqual(homeForResident('Vy').residents,['Thao','Chin','Vy']);
 assert.deepEqual(kitahamaHomeFor('Vy').door,plotGate(KITAHAMA.plots[0]).door);
 assert.deepEqual(homeForResident('Nhung').residents,['Nhung','Kōji','Riku']);assert.equal(kitahamaHomeFor('Nhung').plot,'kitahama-3');
 assert.equal(residentHome('Mr Fujita').id,'fujita-houseboat');
 // A retired identity has no home record and no card (phase 4); its former home is a removal in the registry.
 for(const name of ['Reiko','Barfly','Postman Tōma','Grandmother Chinen'])assert.equal(residentHome(name),null,name);
 for(const id of ['resident-home-aya','izakaya','kitahama-4','kitahama-5','kitahama-6','kinjo','oshiro','shimabukuro','kitano-3']){const h=householdAtHome(id);assert.equal(h.status,'retired',id);assert.deepEqual([...h.residents],[]);assert.ok(!targets.some(t=>t.homeId===id),id+' is no home pin');}
 assert.equal(homeNameplate('kitahama-3').owners,'Nhung · Kōji · Riku');assert.equal(homeNameplate('kitahama-11'),null);assert.equal(homeNameplate('kitahama-1').secondary,'');
 // Kitahama Heights: two houses, A and B, the ids kept for the saves; the old flats retired.
 assert.deepEqual(homeUnits('kitahama-flats').map(h=>[h.id,h.unit,h.address,[...h.residents]]),[['kitahama-flat-3','A','Kitahama Heights A, Fukugi Lane',['Mac']],['kitahama-flat-4','B','Kitahama Heights B, Fukugi Lane',['Ms Ganaha']]]);
 assert.equal(homeNameplate('kitahama-flat-3').address,'Kitahama Heights A');assert.equal(homeNameplate('kitahama-flat-1'),null);
 assert.equal(householdAtHome('kitahama-flats').residents.length,2);
 assert.ok(HOUSEHOLDS.every(h=>!h.address.includes('Main Street')),'legacy street-entry numbers do not become displayed addresses');
 for(const id of ['resident-home-nao','resident-home-thao','resident-home-chin','yuri-home'])assert.equal(canonicalHomeId(id),'resident-home-thuan');
 for(const id of ['tamaki','kamiya']){const h=householdAtHome(id);assert.equal(h.status,'retired');assert.equal(h.toLet,false);assert.ok(!targets.some(t=>t.homeId===id));}
 for(const h of ISLAND_HOUSEHOLDS.filter(h=>h.district==='Fumoto'))assert.equal(h.toLet,true);
});

test('Find person uses live world transforms, exterior doors for indoor actors, and labelled schedule fallbacks',()=>{
 const scene=new THREE.Group(),indoor=new THREE.Group(),hidden=new THREE.Group();scene.add(indoor,hidden);hidden.visible=false;
 const thuan=new THREE.Group();thuan.userData={name:'Thuan',inMarket:true,activity:'Restocking the shelf'};thuan.position.set(1,0,1);indoor.add(thuan);
 const vy=new THREE.Group();vy.userData={name:'Vy',activity:'Walking through the park'};vy.position.set(2,.2,3);scene.position.set(8,0,10);scene.add(vy);
 const teacher=new THREE.Group();teacher.userData={name:'Miss Higa'};teacher.position.set(1,0,1);hidden.add(teacher);scene.updateMatrixWorld(true);
 const sites=[{id:'market',title:'Sakura Shōten',door:[-5.5,0,-28.5]},{id:'ferry-terminal',title:'Port Terminal',door:[-38,0,-50]}];
 const landmarks=[{id:'school',title:'Minato Elementary School',x:23,y:0,z:35}];
 const cards=residentCards({sites,landmarks,people:[{g:thuan}],neighbours:[{g:vy},{g:teacher}],minutes:960});
 const t=cards.find(c=>c.name==='Thuan');assert.equal(t.current.source,'live');assert.equal(t.current.locationLabel,'Sakura Shōten');assert.deepEqual(t.personTarget.door,sites[0].door);assert.equal(t.home.id,'kitano-1');
 const v=cards.find(c=>c.name==='Vy');assert.equal(v.current.source,'live');assert.deepEqual(v.personTarget.door,[10,.2,13]);
 const teacherCard=cards.find(c=>c.name==='Miss Higa');assert.equal(teacherCard.current.source,'schedule');assert.equal(teacherCard.personTarget.id,'school');assert.equal(teacherCard.current.locationLabel,landmarks[0].title);
 thuan.userData={name:'Thuan',inHome:true};
 const atHome=residentCards({sites,people:[{g:thuan}],minutes:1380}).find(c=>c.name==='Thuan');
 assert.equal(atHome.personTarget.homeId,'kitano-1');assert.equal(atHome.homeTarget.homeId,'kitano-1');assert.notDeepEqual(atHome.personTarget.door,[1,0,1]);
 const aboard=new THREE.Group();aboard.userData={name:'Mac',ferryCrew:true};
 const crew=residentCards({sites,neighbours:[{g:aboard}],minutes:600}).find(c=>c.name==='Mac');
 assert.equal(crew.personTarget.id,'ferry-terminal');assert.equal(crew.current.aboard,true);assert.equal(crew.home.id,'kitahama-flat-3');assert.equal(crew.home.unit,'A');
 vy.userData.scheduledAway=true;vy.visible=false;
 const pupil=residentCards({sites,neighbours:[{g:vy,spec:{name:'Vy',routine:[{from:495,away:true,role:'at school'}]}}],minutes:600}).find(c=>c.name==='Vy');
 assert.equal(pupil.current.source,'schedule');assert.equal(pupil.current.locationLabel,'At school');assert.equal(pupil.personTarget,null);assert.equal(pupil.homeTarget.homeId,'kitahama-1');
});

test('Kitahama Heights: two ground-level front doors behind their own gates on Fukugi Lane, clear of the drawn surface and standing collisions; no stair',()=>{
 installDOM();const group=new THREE.Group(),kit=createKit(),colliders=[],anchors=[];
 const solid=cs=>colliders.push(...[].concat(cs).filter(Boolean));
 kit.at(0,0,0,()=>buildKitahamaQuarter(kit,solid,{anchor:(x,y,z,label)=>{anchors.push({x,y,z,label});return {userData:{}};},onAction(){},vending(){}}),KITAHAMA.y);
 kit.finish(group,'Kitahama quarter');
 const A=KITAHAMA.apartment;const surface=createWalkSurface({minX:A.minX-3,maxX:A.maxX+5,minZ:A.minZ-3,maxZ:A.maxZ+3,base:planHeight});surface.add(group);
 const height=(x,z)=>surface.level(x,z)??planHeight(x,z)+surface.lift(x,z);
 const check=([x,y,z])=>{
  assert.ok(Math.abs(height(x,z)-y)<.03,'route height matches floor at '+[x,z]);
  assert.equal(townBoundsBlocked(x,z,.28),false,'route stays on land');
  assert.ok(!colliders.some(c=>standingHitsRect(x,z,.28,height(x,z),c)),'route point is clear at '+[x,z]);
 };
 const world={group:new THREE.Group(),landmarks:[]},sites=[];buildIslandHomes(world,{sites});
 assert.deepEqual(KITAHAMA_FLATS.map(h=>[h.id,h.house,h.side]),[['kitahama-flat-3','A','north'],['kitahama-flat-4','B','south']]);
 for(const house of KITAHAMA_FLATS){
  const site=world.landmarks.find(s=>s.homeId===house.id);assert.ok(site);
  assert.deepEqual(site.door,house.approachPosition);assert.deepEqual(site.exitPosition,house.approachPosition);assert.deepEqual(site.entrancePosition,house.door);assert.equal(site.unit,house.house);check(site.door);
  const ex=site.x+Math.sin(site.entryFacing)*.6,ez=site.z+Math.cos(site.entryFacing)*.6;check([ex,height(ex,ez),ez]);
  const plate=anchors.find(a=>a.label.startsWith(house.name+' · '));assert.ok(plate,house.name+' has its nameplate');
  assert.ok(Math.hypot(plate.x-site.x,plate.z-site.z)<2.7,'the real nameplate is within normal interaction range');
  // From the lane, through the gate, over the garden to the front door: level ground the whole way, and the door at ground level.
  for(let x=(KITAHAMA.fukugiLane.minX+KITAHAMA.fukugiLane.maxX)/2;x>=house.door[0];x-=.1)check([x,height(x,house.z),house.z]);
  assert.ok(Math.abs(height(house.door[0],house.door[2])-KITAHAMA.y)<.1,'the front door stands on the ground, not on a corridor');
  assert.ok(house.gate[0]<house.z&&house.z<house.gate[1],'the gate is in front of the door');
  const c=residentHome(house.id==='kitahama-flat-3'?'Mac':'Ms Ganaha',{landmarks:world.landmarks});assert.deepEqual(c.target.entrancePosition,house.door);assert.deepEqual(c.target.door,house.approachPosition);assert.match(c.target.directions,/own gate and front door/);
 }
 // Nothing of the old block: no stair, landing or corridor, no upper floor over the doors, no Flat 1 or 2.
 assert.ok(!colliders.some(c=>/flats-(stair|landing|corridor|post)/.test(c.id)));
 assert.ok(surface.level(KITAHAMA_FLATS[0].door[0],KITAHAMA_FLATS[0].door[2])==null||surface.level(KITAHAMA_FLATS[0].door[0],KITAHAMA_FLATS[0].door[2])<KITAHAMA.y+.2,'no corridor floor over the north door');
 assert.ok(!anchors.some(a=>/^Flat \d/.test(a.label)));assert.ok(anchors.some(a=>a.label==='Read the Kitahama Heights mailboxes'));
 assert.ok(!world.landmarks.some(s=>['home-kitahama-flat-1','home-kitahama-flat-2'].includes(s.id)),'the retired flats have no door');
 // The lane-side wall's gates match the houses', so the gutter ring meets each gate (okinawa/lane-edges.js).
 const wall=colliders.filter(c=>c.id==='block-wall'&&Math.abs(c.x-A.maxX)<.2);assert.ok(wall.length>=3,'the front wall is in pieces round two gates');
 for(const house of KITAHAMA_FLATS)assert.ok(!wall.some(w=>house.z>w.z-w.d/2&&house.z<w.z+w.d/2),house.name+'’s gate is open');
});

test('the real 1 Kitahama interior includes the three people identified at its entrance, and nobody else’s bedding',()=>{
 installDOM();const world={group:new THREE.Group(),landmarks:[]},sites=[];buildIslandHomes(world,{sites});
 const site=sites.find(s=>s.id==='resident-home-thuan'),room=new THREE.Group();
 const layout=buildResidentHome({site,profile:{name:'Thao'},room,reg(){},action(){},collider(){},exit(){}});
 assert.deepEqual(site.homeOwners,['Thao','Chin','Vy']);
 for(const name of site.homeOwners){assert.ok(layout.homeLayouts[name],name+' has a real place in the household');assert.ok(room.getObjectByName('Futon '+name),name+' has their own bedding');assert.ok(room.getObjectByName('Photograph of '+name),name+' appears in the household photograph');}
 assert.equal(room.getObjectByName('Futon Thuan'),undefined,'Thuan’s weekday bedding went with her weekday room');assert.equal(layout.homeLayouts.Thuan,undefined);
 assert.notDeepEqual(layout.homeLayouts.Vy.bed,layout.homeLayouts.Thao.bed,'the child keeps her own bedroom');
});

test('Studio read tools report the same canonical primary and secondary residences',async()=>{
 const {context,callTool}=await import('../tools/studio/tools.mjs');const ctx=await context();
 try{
  const fujita=await callTool('character_get',{name:'Mr Fujita'},ctx);assert.equal(fujita.error,undefined);assert.equal(fujita.home.id,'fujita-houseboat');
  const thuan=await callTool('character_get',{name:'Thuan'},ctx);assert.equal(thuan.home.id,'kitano-1');assert.deepEqual(thuan.secondaryHomes,[]);
  const nhung=await callTool('character_get',{name:'Nhung'},ctx);assert.equal(nhung.home.id,'kitahama-3');assert.deepEqual(nhung.home.residents,['Nhung','Kōji','Riku']);
  const tetsuo=await callTool('character_get',{name:'Tetsuo'},ctx);assert.equal(tetsuo.home.id,'resident-home-kenji');assert.deepEqual(tetsuo.home.residents,['Tetsuo']);
  const list=await callTool('character_list',{query:'Fujita'},ctx);assert.equal(list.characters[0].home.id,'fujita-houseboat');
 }finally{await ctx.close();}
});
