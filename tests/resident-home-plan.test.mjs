import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildResidentHome} from '../src/world/interiors/resident-home.js';
import {YARD_HOMES} from '../src/world/yard-homes-layout.js';
import {createRoomWalk} from '../src/people/room-walk.js';

// The shared houses are drawn to the house you see (docs/BUILDING-AUDIT.md, B4), and the households are the roster's
// (people/roster.js HOUSEHOLDS, docs/CAST-CONSOLIDATION.md §7): Nhung, Kōji and Riku at 3 Kitahama and Thao, Chin and Vy at
// 1 Kitahama, in Kitahama houses like their neighbours', and everyone who lives there can walk from the door to their
// place at the table and to their futon, and back. (1 Front-Row Yard, Nhung and Reiko's once, is gone: phase 4.)
const homes=[
 {site:{id:'home-kitahama-3',title:'Nhung, Kōji & Riku’s home',homeOwner:'Nhung',homeOwners:['Nhung','Kōji','Riku'],plot:'kitahama-3',houseKind:'concrete'},names:['Nhung','Kōji','Riku']},
 {site:{id:'resident-home-thuan',title:'Thao, Chin & Vy’s home',homeOwner:'Thao',homeOwners:['Thao','Chin','Vy'],plot:'kitahama-1',houseKind:'red-tile'},names:['Thao','Chin','Vy']},
];
for(const {site,names} of homes){
 test(`${site.title} (${site.houseKind||'yard'}): a real plan, and its people walk to the table and to bed`,()=>{
  installDOM();
  const room=new THREE.Group(),cols=[];
  const box=(size,pos,c,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial());m.position.set(...pos);(parent||room).add(m);return m;};
  const layout=buildResidentHome({site,profile:{name:site.homeOwner,role:'r'},room,box,reg(){},action(){},exit(){},collider:(x,z,w,d)=>cols.push({x,z,w,d})});
  const names_=new Set();room.traverse(o=>{if(o.name)names_.add(o.name.split(' (')[0]);});
  for(const n of ['Toilet','Kitchen counter'])assert.ok(names_.has(n),site.id+' has no '+n);
  if(YARD_HOMES[site.id]){
   const spec=YARD_HOMES[site.id],B=layout.bounds;
   assert.ok(B.maxX-B.minX<=spec.w&&B.maxZ-B.minZ<=spec.d,'the room fits inside the walls you see');
   assert.ok(names_.has('Genkan tiles'),'no genkan');
  }
  const B=layout.bounds,blocked=(x,z,r)=>x<B.minX+r||x>B.maxX-r||z<B.minZ+r||z>B.maxZ-r||cols.some(c=>Math.abs(c.x-x)<c.w/2+r&&Math.abs(c.z-z)<c.d/2+r);
  for(const name of names){
   const L=layout.homeLayouts?.[name];assert.ok(L,name+' has a place in the house');
   const person={g:new THREE.Object3D(),profile:{name,age:30}};person.g.position.set(...L.door);
   const walk=createRoomWalk(blocked);
   for(const [label,target] of [['table',L.tableStand??L.table],['bed',L.bedside],['door',L.door]]){
    let done=false;for(let i=0;i<1200&&!done;i++)done=walk.move(person,target,1/20);
    assert.ok(done,`${name} cannot walk to the ${label} in ${site.title} (stopped at ${person.g.position.x.toFixed(2)}, ${person.g.position.z.toFixed(2)})`);
   }
   assert.ok(Math.abs(L.bed[0]-L.bedside[0])<.2&&Math.abs(L.bed[2]-L.bedside[2])<.5,name+' lies down on their own futon');
  }
 });
}

test('Johansson & Thuan’s house on Kitano-jima (kitano-1) is the roster’s household: two futons, the WC, and nobody else',async()=>{
 installDOM();
 const {buildJohanssonHouse}=await import('../src/world/interiors/johansson-house-interior.js');
 const {HOUSEHOLDS}=await import('../src/people/roster.js');const {householdAtHome}=await import('../src/people/island-households.js');
 assert.deepEqual([...HOUSEHOLDS.find(h=>h.home==='kitano-1').members],['nils','thuan']);assert.deepEqual([...householdAtHome('kitano-1').residents],['Johansson','Thuan']);
 const room=new THREE.Group();buildJohanssonHouse({room,reg(){},action(){},collider(){}});
 const names=new Set();room.traverse(o=>{if(o.name)names.add(o.name);});
 for(const n of ['Futon','Futon Thuan','Toilet'])assert.ok(names.has(n),'the house has its '+n);
 const beds=[];room.traverse(o=>{if(o.userData.bed)beds.push(o.name);});assert.deepEqual(beds.sort(),['Futon','Futon Thuan'],'two sleeping places, his and hers, and no guest in residence');
});

test('the police station (home id koban) has its WC, and Officer Mori still walks to his table and his futon upstairs',async()=>{
 installDOM();
 const {buildPoliceStationInterior,STATION_HOME_LAYOUT:L}=await import('../src/world/interiors/police-station.js');
 const room=new THREE.Group(),cols=[];
 const r=buildPoliceStationInterior({room,reg(){},action(){},exit(){},collider:(x,z,w,d)=>cols.push({x,z,w,d})});
 const names=new Set();room.traverse(o=>{if(o.name)names.add(o.name);});assert.ok(names.has('Toilet'),'the station has no WC');
 const B=r.bounds,blocked=(x,z,rr)=>x<B.minX+rr||x>B.maxX-rr||z<B.minZ+rr||z>B.maxZ-rr||cols.some(c=>Math.abs(c.x-x)<c.w/2+rr&&Math.abs(c.z-z)<c.d/2+rr);
 const person={g:new THREE.Object3D(),profile:{name:'Officer Mori',age:40}};person.g.position.set(...L.door);
 const walk=createRoomWalk(blocked);
 for(const [label,target] of [['table',L.table],['futon',L.bedside],['door',L.door]]){
  let done=false;for(let i=0;i<1600&&!done;i++)done=walk.move(person,target,1/20);
  assert.ok(done,`Officer Mori cannot walk to the ${label}`);
 }
});

test('the harbour office has the harbour master’s WC, and he still walks to his tea table and his futon',async()=>{
 installDOM();
 const {buildOfficeWorkplace,OFFICE_HOME_LAYOUT:L}=await import('../src/world/interiors/office-workplace.js');
 const {SUPPLIED_ROOM_LAYOUTS}=await import('../src/world/supplied-rooms.js');
 const room=new THREE.Group(),cols=[...SUPPLIED_ROOM_LAYOUTS.office.colliders];
 buildOfficeWorkplace({room,reg(){},action(){},collider:(x,z,w,d)=>cols.push({x,z,w,d})});
 const names=new Set();room.traverse(o=>{if(o.name)names.add(o.name);});assert.ok(names.has('Toilet'),'the office has no WC');
 const B=L.bounds,blocked=(x,z,rr)=>x<B.minX+rr||x>B.maxX-rr||z<B.minZ+rr||z>B.maxZ-rr||cols.some(c=>Math.abs(c.x-x)<c.w/2+rr&&Math.abs(c.z-z)<c.d/2+rr);
 const person={g:new THREE.Object3D(),profile:{name:'Harbour master',age:60}};person.g.position.set(...L.door);
 const walk=createRoomWalk(blocked);
 for(const [label,target] of [['tea table',L.table],['futon',L.bedside],['WC',[-1.85,0,2.0]],['door',L.door]]){
  let done=false;for(let i=0;i<1600&&!done;i++)done=walk.move(person,target,1/20);
  assert.ok(done,`the harbour master cannot walk to the ${label}`);
 }
});
