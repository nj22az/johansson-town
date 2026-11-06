import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {createBusinesses} from '../src/world/businesses.js';
import {circleHitsRect} from '../physics.js';
import {buildFamilyHome} from '../src/world/interiors/family-home.js';
import {buildYardHomeInterior} from '../src/world/interiors/yard-home.js';
import {buildPortHall} from '../src/world/interiors/port-hall.js';
import {buildAirportArrivals} from '../src/world/interiors/airport-arrivals.js';
import {buildOfficeShell,buildOfficeWorkplace} from '../src/world/interiors/office-workplace.js';
import {buildMayorHome} from '../src/world/interiors/town-hall.js';
import {PARK_BENCH} from '../src/world/park-layout.js';
import {HARBOUR_BENCH_DIMENSIONS} from '../src/world/harbour-bench-dimensions.js';
import {seatRooms,seatEdge} from './seat-edge.mjs';
import {HOME_LAYOUT,SHARED_HOME_LAYOUT} from '../src/people/home-life.js';
import {TATAMI_HOME_LAYOUT} from '../src/world/interiors/tatami-home-layout.js';
import {OFFICE_HOME_LAYOUT} from '../src/world/interiors/office-workplace.js';
import {STATION_HOME_LAYOUT} from '../src/world/interiors/police-station.js';

function validateSeats(root,targets,colliders,{streamed=new Set()}={}){
 root.updateMatrixWorld(true);
 const ray=new THREE.Raycaster();
 // (a bench's places, seat-slots.js, each as a seat of its own: on the bench, with somewhere clear to stand up to)
 for(const {object,label} of targets.flatMap(t=>[t,...(t.object.userData.seat?.slots||[]).map(slot=>({object:{userData:{seat:{...t.object.userData.seat,...slot}}},label:t.label+' place '+slot.slot}))])){
  const seat=object.userData.seat;if(!seat)continue;
  assert.ok(Number.isFinite(seat.surfaceY),label+' has an authored support surface');
  assert.ok(seat.position.every(Number.isFinite)&&seat.stand.every(Number.isFinite),label+' has finite seat and stand positions');
  assert.ok(Number.isFinite(seat.yaw),label+' has an authored facing direction');
  const [x,y,z]=seat.stand;
  const blockers=colliders.filter(c=>(c.minY??0)<y+1.6&&(c.minY??0)+(c.height??10)>y+.2&&circleHitsRect(x,z,.25,c));
  assert.equal(blockers.length,0,label+' can stand clear of solid furniture');
  if(streamed.has(label.replace(/ place \d+$/,'')))continue;
  ray.set(new THREE.Vector3(seat.position[0],seat.surfaceY+.025,seat.position[2]),new THREE.Vector3(0,-1,0));ray.far=.08;
  const hit=ray.intersectObject(root,true).find(h=>h.face?.normal.clone().transformDirection(h.object.matrixWorld).y>.65);
  assert.ok(hit,label+' sits over a physical surface');
  assert.ok(Math.abs(hit.point.y-seat.surfaceY)<.015,label+' support height matches the physical seat');
 }
}

function fixture(build){
 installDOM();const room=new THREE.Group(),targets=[],colliders=[];
 const reg=(object,label)=>targets.push({object,label});
 build({room,reg,action(){},onReturn(){},collider:(x,z,w,d,height,minY)=>colliders.push({x,z,w,d,height,minY})});
 return {room,targets,colliders};
}

test('every outdoor public seat has physical support and a clear standing point',()=>{
 installDOM();const targets=[];
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:true,shadows:false,register:(object,label)=>targets.push({object,label}),enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const seats=targets.filter(t=>t.object.userData.seat);
 // The two-garden count included retired furniture. Hold the actual public seat
 // roster to its usable interactions instead of requiring extra scenery to pass.
 const expected=[
  'port-canopy-bench','quay-bench','beach-chair-0','beach-chair-1',
  'Soak your feet in the footbath','Cool off on the bench',
  'seawall-bench--20','seawall-bench-4','seawall-bench-22','kitahama-park-bench',
  'Sit on neighbourhood bench','Sit on the staff bench','Sit on the bench by the station','nakamura-dessert-bench',
  'airport-gate-a0','airport-gate-a1','airport-gate-a2','airport-gate-a3',
  'kitano-lookout','kitano-coral-bay-0','kitano-coral-bay-1','kitano-turtle-cove',
  'Sit under the harbour cherry','Sit beside the garden pond','Sit under the gajumaru',
  // The drinks corner on the old post-office lot (okinawa/lots.js POST_OFFICE): its bench beside the machines.
  'drinks-corner-bench',
  // Higa Liquor's evening bench and the coin laundry's bench (#314); the table's near chair inside Kissa Higa (30 October
  // 2026; the stools and the far chair are the regulars', commerce/kissa-higa.js KISSA_SEATS).
  'higa-yuntaku-bench','coin-laundry-bench','kissa-chair-0',
  // Aboard the Minato Maru (3 November 2026, ferry-interior.js FERRY_PASSENGER_SEATS): the saloon's front row by the bow
  // windows, a port window seat and a cushion in the carpet room; each moves with her (game.js pinAboardSeat).
  'Sit by the bow windows','Take the window seat','Sit on a cushion',
 ];
 assert.deepEqual(seats.map(t=>t.object.userData.seat.id||t.label).sort(),expected.sort(),'Every retained public bench, bath seat and airport gate offers its seat');
 // Kissa Higa's chair is a streamed Meshy model (kissa-higa-props.js): its seat height is measured on the model itself in
 // tests/kissa-higa.test.mjs.
 validateSeats(world.group,seats,world.colliders,{streamed:new Set(['Soak your feet in the footbath','Cool off on the bench','Sit at the table in Kissa Higa'])});
 // Every public bench seats two side by side (the owner, 21 October 2026), or more by its length; where its front edge is
 // goes with it (seatFront). Higa Liquor's bench is two places already (YUNTAKU: Tetsuo's and this), the footbath's rim,
 // the beach chairs and Umi-no-yu's bench are single seats.
 // The ferry's are one place each: a seat in the saloon's rows, a cushion in the carpet room (FERRY_PASSENGER_SEATS).
 const single=new Set(['beach-chair-0','beach-chair-1','Soak your feet in the footbath','Cool off on the bench','higa-yuntaku-bench','Sit on the staff bench','kissa-chair-0','Sit by the bow windows','Take the window seat','Sit on a cushion']);
 for(const t of seats){const s=t.object.userData.seat,key=s.id||t.label;if(single.has(key))continue;
  assert.ok(s.slots?.length>=2,key+' seats two side by side');assert.ok(s.front>0&&s.front<.35,key+' says where its front edge is');}
 assert.equal(PARK_BENCH.yaw,Math.PI/2,'Harbour bench faces away from its east backrest');
 assert.equal(PARK_BENCH.surfaceY,.02+HARBOUR_BENCH_DIMENSIONS.seatHeight,'The measured bench stands on the level park ground');
 const kitahama=seats.find(t=>t.object.userData.seat.id==='kitahama-park-bench');assert.equal(kitahama.object.userData.seat.yaw,Math.PI/2);
});

test('every ferry hall chair and arrivals bench is usable at its true surface',()=>{
 for(const [build,count] of [[buildPortHall,10],[buildAirportArrivals,2]]){
  const f=fixture(build),seats=f.targets.filter(t=>t.object.userData.seat);
  assert.equal(seats.length,count);
  validateSeats(f.room,seats,f.colliders);
 }
});

test('office chairs, visitor sofas and floor cushions have explicit physical seats',()=>{
 for(const build of [args=>{buildOfficeShell(args.room);buildOfficeWorkplace(args);},buildMayorHome]){
  const f=fixture(build),seats=f.targets.filter(t=>t.object.userData.seat);
  assert.ok(seats.length>=3);
  validateSeats(f.room,seats,f.colliders);
 }
});


test('every household chair and tea cushion supports visitors with a clear stand point',()=>{
 for(const kind of ['concrete','red-tile'])for(const residents of [null,['Thuan','Thao']]){
  const f=fixture(args=>buildFamilyHome({...args,kind,residents,household:{members:[{name:'A',purpose:'farmer'}]}}));
  const seats=f.targets.filter(t=>t.object.userData.seat);assert.ok(seats.length>=4);
  validateSeats(f.room,seats,f.colliders);
  for(const {object} of seats){const [x,,z]=object.userData.seat.stand;assert.ok(x>=-2.9&&x<=2.9&&z>=-2.5&&z<=2.5,'Standing leaves space inside the house walls');}
 }
 for(const [id,homeOwner] of [['resident-home-kenji','Tetsuo']]){
  const f=fixture(args=>buildYardHomeInterior({...args,site:{id,homeOwner}}));
  validateSeats(f.room,f.targets,f.colliders);
 }
});

test('every chair, stool, cushion and bench says where its front edge is, where its own mesh has it',async()=>{
 // (seat-slots.js `front`: the sitter's shins hang in front of that edge, never through the seat: animate.js seatFront.
 // A seat whose furniture is a GLB loaded only in a browser (Minato's booth, the ramen stools, the massage chair) is drawn
 // from the same plan; its number is checked against the model by the GLB's own tests, not here.)
 installDOM();const wrong=[];let measured=0;
 for(const {name,room,seats} of await seatRooms())for(const {label,seat} of seats){
  if(seat.soak)continue;
  if(!(seat.front>0&&seat.front<.4)){wrong.push(`${name}: ${label} does not say where its front edge is (${seat.front})`);continue;}
  const edge=seatEdge(room,seat);if(!edge)continue;measured++;
  if(Math.abs(edge.front-seat.front)>.01)wrong.push(`${name}: ${label} says ${seat.front}, its mesh ${edge.front.toFixed(3)}`);
 }
 assert.deepEqual(wrong,[]);assert.ok(measured>60,'measured '+measured);
 // A home's own place at the table (home-residents.js) is the seat visitors sit on: it says the same.
 for(const layout of [HOME_LAYOUT,SHARED_HOME_LAYOUT,TATAMI_HOME_LAYOUT,OFFICE_HOME_LAYOUT,STATION_HOME_LAYOUT])assert.ok(layout.tableSeatFront>0,'a home table seat says where its front edge is');
});

test('the indoor benches seat two, and the clinic’s faces its waiting room',async()=>{
 installDOM();const rooms=await seatRooms(),bench=(room,label)=>rooms.find(r=>r.name===room).seats.filter(s=>s.label===label).map(s=>s.seat);
 for(const [room,label,n] of [['domestic arrivals','Sit in domestic arrivals',6],['the clinic','Sit in the clinic waiting room',2],['the police station','Sit on the waiting bench',2],['Umi-no-yu','Sit on the changing-room bench',2]])
  assert.equal(bench(room,label).length,n,room+': a place each');
 // Its back is to the consulting room's partition (z 0.5): the sitter faces the waiting room and the street door (+z).
 for(const s of bench('the clinic','Sit in the clinic waiting room')){assert.ok(Math.abs(-Math.cos(s.yaw)-1)<1e-9,'facing +z');assert.ok(s.stand[2]>s.position[2]);}
});
