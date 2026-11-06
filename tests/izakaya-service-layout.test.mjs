import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {circleHitsRect,standingHitsRect} from '../physics.js';
import {createBeerService,IZAKAYA_PLAYER_SEATS,KITCHEN_STATIONS,NAO_STATION} from '../src/people/izakaya-beer.js';
import {buildMinatoBar} from '../src/world/interiors/minato-bar.js';
import {createVenueService} from '../src/people/venue-service.js';
import {IZAKAYA_GUEST_SEATS} from '../src/people/indoor-residents.js';
import {createIzakayaGuests} from '../src/people/izakaya-guests.js';
import {createRoomWalk} from '../src/people/room-walk.js';
import {PROFILES} from '../src/people/profiles.js';
import {residentPlan,IZAKAYA_DOOR} from '../src/people/social.js';
import {MINATO_COMPACT} from '../src/world/interiors/minato-compact-plan.js';
import {SHARED_DINING_BOUNDS,SHARED_DINING_FLOOR,SHARED_DINING_COLLIDERS} from '../src/world/interiors/shared-dining-layout.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';

const layout={bounds:SHARED_DINING_BOUNDS,floorPolygon:SHARED_DINING_FLOOR};
const roomBlocked=(x,z,r)=>suppliedRoomBoundsBlocked(layout,x,z,r)||SHARED_DINING_COLLIDERS.some(c=>standingHitsRect(x,z,r,0,c));
// Stepped in beside a counter stool to set a drink down, she is checked against the stools as they are (the cushion's
// 0.195 m radius, build-minato-compact.py), not the walkers' 0.6 m squares: 0.41 m between two stools for her body.
roomBlocked.closeUp=(x,z,r)=>suppliedRoomBoundsBlocked(layout,x,z,r)||SHARED_DINING_COLLIDERS.some(c=>c.id==='minato-stool'?Math.hypot(x-c.x,z-c.z)<.195+r:standingHitsRect(x,z,r,0,c));

function fixture(blocked){
 const room=new THREE.Group(),nao=new THREE.Group();nao.position.set(...NAO_STATION);
 const [x,,z]=NAO_STATION,bounds={minX:x-4,maxX:x+4,minZ:z-3,maxZ:z+3};
 const service=createBeerService({room,getNao:()=>nao,blocked,bounds,bar:buildMinatoBar(room)});
 return {room,nao,service};
}

function tick(f,seconds,blocked,onStep=()=>{}){
 for(let i=0;i<seconds*30&&(f.service.pending||f.service.working);i++){
  const before=f.nao.position.clone();f.service.update(1/30);
  // The whole step must be clear, not just its endpoints: by her walker's 0.3 m, and stepped in to work at a place
  // (minato-bar.js, izakaya-beer.js `close`) by her body's 0.13 m.
  const close=!!f.service.working?.close,r=close?.13:.3;
  for(let k=1;k<=5;k++){
   const x=before.x+(f.nao.position.x-before.x)*k/5,z=before.z+(f.nao.position.z-before.z)*k/5;
   assert.equal((close&&blocked.closeUp||blocked)(x,z,r),false,`Thao crossed a solid at ${x.toFixed(3)}, ${z.toFixed(3)}`);
  }
  onStep(f.nao);
 }
}

test('the parked WC folding door blocks its protruding hardware while its doorway stays open',()=>{
 // Measured from the final Blender export: the folded leaves and handle occupy
 // x .520–.6075, z 2.695–3.134. The adjacent partition alone misses this overlap.
 assert.equal(roomBlocked(.31,2.91,.3),true,'A visitor cannot overlap the folded stack beside the WC');
 for(const x of [.31,.70,1.10])assert.equal(roomBlocked(x,MINATO_COMPACT.wc.doorZ,.3),false,'The actual WC doorway remains clear at '+x);
});

test('the booth back and cap stop bodies outside the cushion without closing either side approach',()=>{
 // The north cap reaches z 1.455, 8.5 cm beyond the old cushion collider.
 // A 30 cm body at z 1.23 reaches the cap even though it misses the cushion.
 assert.equal(roomBlocked(-2.50,1.23,.3),true,'A visitor cannot clip through the north booth back');
 for(const x of MINATO_COMPACT.booth.standX)for(const z of MINATO_COMPACT.booth.benchZ)
  assert.equal(roomBlocked(x,z,.3),false,'The booth side approach remains clear at '+[x,z]);
});

test('Thao routes around furniture between authored service points',()=>{
 const [x,,z]=NAO_STATION,obstacle={x:x-1,z,w:.5,d:1.2};let checks=0;
 const blocked=(px,pz,r)=>circleHitsRect(px,pz,r,obstacle);
 const f=fixture((...args)=>{checks++;return blocked(...args);}),seat={table:[x-2,.72,z+.5],serve:[x-2,0,z],route:[[x-2,z]]};
 // A dish from the range: the same walk to an authored point (a drink's round is izakaya-bar.test.mjs's).
 assert.equal(f.service.order('dashimaki',seat),true);
 let detour=0;tick(f,90,blocked,g=>{detour=Math.max(detour,Math.abs(g.position.z-z));});
 assert.ok(checks>0,'service consults the same collision predicate as the room');
 assert.ok(detour>=.9,'the staff clearance circle goes around the whole obstacle');
 assert.equal(f.service.pending,null,'both delivery and return finish');
 assert.equal(f.service.served,1);
 assert.ok(f.nao.position.distanceTo(new THREE.Vector3(...NAO_STATION))<.01);
 f.service.clear();
});

test('every compact seat is served and every kitchen station works against the complete room solids',()=>{
 const cases=[...Object.values(IZAKAYA_PLAYER_SEATS).map(seat=>['draft',seat]),
  ...['yakitori','oden','dashimaki','karaage','edamame'].map(kind=>[kind,IZAKAYA_PLAYER_SEATS.window])];
 for(const [kind,seat] of cases){
  const room=new THREE.Group(),nao=new THREE.Group();nao.position.set(...NAO_STATION);
  const service=createBeerService({room,getNao:()=>nao,blocked:roomBlocked,bar:buildMinatoBar(room)});
  assert.equal(roomBlocked(nao.position.x,nao.position.z,.3),false,'Thao starts on clear floor');
  assert.equal(service.order(kind,seat),true);tick({service,nao},120,roomBlocked);
  assert.equal(service.pending,null,`${kind} reaches ${seat.id} and Thao returns`);
  assert.equal(service.served,1);
  assert.ok(nao.position.distanceTo(new THREE.Vector3(...NAO_STATION))<.01,'the return finishes at the actual staff station');
  service.clear();
 }
});

test('all guest approaches, player stands and the WC can be reached from the entrance',()=>{
 const targets=[...IZAKAYA_GUEST_SEATS.map(s=>s.stand),...Object.values(IZAKAYA_PLAYER_SEATS).map(s=>s.stand),
  ...Object.values(KITCHEN_STATIONS),MINATO_COMPACT.wc.approach,MINATO_COMPACT.ramenEntrance.spawn];
 for(const target of targets){
  assert.equal(roomBlocked(target[0],target[2],.3),false,'clear target '+target.join(','));
  const person={g:new THREE.Group(),profile:{age:34}},walker=createRoomWalk(roomBlocked,{bounds:SHARED_DINING_BOUNDS});
  person.g.position.set(...MINATO_COMPACT.entrance.spawn);let arrived=false;
  for(let i=0;i<2400&&!arrived;i++){
   arrived=walker.move(person,target,1/30);
   assert.equal(roomBlocked(person.g.position.x,person.g.position.z,.3),false,'clear walk to '+target.join(','));
  }
  assert.equal(arrived,true,'a complete route reaches '+target.join(','));walker.clear();
 }
});

test('NPC dishes and drinks rest on each seat’s authored table or counter top',()=>{
 for(const [index,seat] of IZAKAYA_GUEST_SEATS.entries()){
  assert.ok(seat.table?.every(Number.isFinite),'guest '+index+' has an explicit meal support point');
  const support=SHARED_DINING_COLLIDERS.find(c=>Math.abs((c.minY||0)+c.height-seat.table[1])<.003&&circleHitsRect(seat.table[0],seat.table[2],0,c));
  assert.ok(support,'guest '+index+' names a physical table or counter surface');
  const room=new THREE.Group(),g=new THREE.Group();g.position.set(...seat.position);g.rotation.y=seat.yaw;
  g.userData={inIzakaya:true,izakayaSeat:index,seatHeight:seat.surfaceY};
  const person={profile:{name:'Thuan'},g},account={meals:{izakaya:{item:'yakitori',drink:'beer',delivered:true,eaten:0,finished:false}}};
  const ledger={account:()=>account,purchase:()=>true,record(){}};
  const service=createVenueService({room,place:'izakaya',getCustomers:()=>[person],getMinutes:()=>1200,ledger,
   tableFor:p=>IZAKAYA_GUEST_SEATS[p.g.userData.izakayaSeat]?.table});
  service.update(3.1); // A rest between sips: both props are on the furniture.
  assert.equal(room.children.length,2);
  for(const prop of room.children){
   assert.equal(prop.visible,true);
   const box=new THREE.Box3().setFromObject(prop);
   assert.ok(Math.abs(box.min.y-seat.table[1])<.003,`${prop.name} at seat ${index} touches its support instead of floating`);
   assert.ok(box.min.x>=support.x-support.w/2&&box.max.x<=support.x+support.w/2,`${prop.name} stays within the support width`);
   assert.ok(box.min.z>=support.z-support.d/2&&box.max.z<=support.z+support.d/2,`${prop.name} stays within the support depth`);
  }
  service.dispose();
 }
});

test('guest table identity follows the assigned seat and clears when the resident leaves',()=>{
 const street=new THREE.Group(),room=new THREE.Group(),world={people:PROFILES.map(profile=>{
  const g=new THREE.Group();g.userData={name:profile.name,hit:{inside:false}};street.add(g);
  if(residentPlan(profile,1230).place==='izakaya'){g.userData.indoors='izakaya';g.position.set(IZAKAYA_DOOR[0],0,IZAKAYA_DOOR[1]);}
  return {profile,g};
 })};
 const guests=createIzakayaGuests({world,parent:room});guests.sync(1230);
 const seated=world.people.filter(p=>Number.isFinite(p.g.userData.seatHeight));assert.ok(seated.length>0);
 for(const p of seated){
  const seat=IZAKAYA_GUEST_SEATS[p.g.userData.izakayaSeat];assert.ok(seat,p.profile.name+' retains the assigned table identity');
  assert.deepEqual(p.g.position.toArray(),seat.position);
 }
 guests.restore();for(const p of world.people)assert.equal(p.g.userData.izakayaSeat,undefined);
});

test('a blocked service point waits safely and replans when it opens',()=>{
 const [x,,z]=NAO_STATION,target=[x-2,z],obstacle={x:target[0],z:target[1],w:.5,d:.5};let closed=true;
 const blocked=(px,pz,r)=>closed&&circleHitsRect(px,pz,r,obstacle);
 const f=fixture(blocked),seat={table:[target[0],.72,target[1]+.5],serve:[target[0],0,target[1]],route:[target]};
 assert.equal(f.service.order('dashimaki',seat),true);tick(f,90,blocked);
 assert.equal(f.service.pending?.phase,'carrying');
 assert.equal(f.service.served,0,'an unreachable approach cannot deliver through furniture');
 closed=false;tick(f,60,blocked);
 assert.equal(f.service.pending,null,'a temporary obstruction does not strand the order');
 assert.equal(f.service.served,1);
 f.service.clear();
});

test('the final few centimetres of a service approach are collision checked',()=>{
 const [x,,z]=NAO_STATION;let closed=true;
 const blocked=px=>closed&&px>x+.04;
 const f=fixture(blocked),seat={table:[x+.08,.72,z+.5],serve:[x+.08,0,z],route:[[x+.08,z]]};
 assert.equal(f.service.order('dashimaki',seat),true);tick(f,8,blocked);
 assert.equal(f.service.served,0,'being within the room walker arrival tolerance is insufficient');
 assert.ok(f.nao.position.x<=x+.04);
 closed=false;tick(f,90,blocked);
 assert.equal(f.service.pending,null);
 assert.equal(f.service.served,1);
 f.service.clear();
});
