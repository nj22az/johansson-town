// The Minato Maru's passenger accommodation and crew stair (the owner, 3 November 2026: "We need an interior stair case
// to the bridge as well"; "the accommodation needs to be more cosy and comfortable it should be fun to sit there and do nothing").
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
const {FERRY_INTERIOR,FERRY_HOUSE,FERRY_SALOON,FERRY_CREW_STAIR,FERRY_PASSENGER_SEATS}=await import('../src/world/ferry-interior.js');
const {FERRY_GA,FERRY_SHIP}=await import('../src/world/ferry-ship.js');
const {createFerryRun}=await import('../src/world/ferry.js');
const {createFerryWalk}=await import('../src/world/ferry-walk.js');
const F=FERRY_HOUSE,CS=FERRY_CREW_STAIR;
const seats=FERRY_INTERIOR.boxes.filter(b=>b.name==='saloon seats');

test('the saloon’s seats are the general arrangement’s, every one inside the house and clear of the crew stair',()=>{
 const places=FERRY_SALOON.rows.reduce((n,_,k)=>n+FERRY_SALOON.row(k,1)[2]+FERRY_SALOON.row(k,-1)[2],0);
 assert.equal(places,FERRY_GA.find(s=>s.id==='saloon').seats,'the places the saloon has are the places it is certified for');
 assert.equal(FERRY_GA.reduce((n,s)=>n+(s.seats||0),0),FERRY_SHIP.passengers);
 assert.equal(seats.length,FERRY_SALOON.rows.length*2);
 for(const b of seats){
  assert.ok(b.b[2]<=F.fore-.08+1e-9,'a row ends inside the forward wall ('+b.b[2].toFixed(2)+')');
  assert.ok(Math.max(Math.abs(b.a[0]),Math.abs(b.b[0]))<=F.half-.08+1e-9,'a row ends inside the side walls');
  const inTrunk=b.a[0]<CS.wall&&b.b[2]>CS.door.z&&b.a[2]<CS.head;assert.ok(!inTrunk,'no seat in the crew stair’s trunk');
 }
 // Rows are a comfortable 0.88 m apart and the aisle 0.9 m wide.
 for(let k=1;k<FERRY_SALOON.rows.length;k++)assert.ok(FERRY_SALOON.rows[k]-FERRY_SALOON.rows[k-1]>=.85);
 assert.ok(FERRY_SALOON.aisle*2>=.9-1e-9);
});

test('nothing solid in the saloon or the carpet room reaches through the house’s walls',()=>{
 const inside=b=>b.a[2]>=F.toiletsFore-1e-6&&b.b[2]<=F.fore+1e-6&&b.a[1]<F.ceiling&&b.b[1]>F.ceiling-2.3;
 for(const b of FERRY_INTERIOR.boxes.filter(b=>inside(b)&&b.name&&!/wall|deckhouse|partition|window|door/i.test(b.name)))
  assert.ok(b.b[2]<=F.fore-.08+1e-6&&Math.max(Math.abs(b.a[0]),Math.abs(b.b[0]))<=F.half-.08+1e-6||b.a[1]>=F.ceiling-.001,b.name+' stays inside the house');
});

test('the crew stair: 45°, 0.8 m clear, its well opened where the head needs it, from the saloon into the wheelhouse',()=>{
 const rise=(F.ceiling+.25)-(F.ceiling-2.1),run=CS.head-CS.foot;
 assert.ok(Math.abs(run/CS.risers-.2)<1e-9,'0.2 m goings');assert.ok(Math.abs(CS.x[1]-CS.x[0]-.8)<1e-9,'0.8 m clear');
 const stair=FERRY_INTERIOR.floors.find(f=>f.id==='crew-stair');assert.ok(stair,'the flight is a floor');
 const [y0,y1]=stair.y;assert.ok(Math.abs((y1-y0)/(stair.z[1]-stair.z[0])-1)<.02,'45°');
 assert.ok(CS.head>F.wheelhouseAft&&CS.head<F.fore-2,'its head is in the wheelhouse, aft of the console');
 assert.ok(FERRY_INTERIOR.boxes.some(b=>b.name==='crew stair rail'),'railed in the wheelhouse');
 assert.ok(FERRY_INTERIOR.plates.some(p=>p.name==='crew stair sign'&&p.lines[0]==='乗組員専用'),'marked crew only');
 const ga=FERRY_GA.find(s=>s.id==='crew-stair');assert.equal(ga.within,'saloon');assert.ok(FERRY_GA.find(s=>s.id==='wheelhouse').exits.includes('crew-stair'));
 // The chart table no longer stands in a wing door's way in.
 const chart=FERRY_INTERIOR.boxes.find(b=>b.name==='chart table');assert.ok(Math.max(Math.abs(chart.a[0]),Math.abs(chart.b[0]))<2.42-.3,'clear of both wing doors');
});

test('the seats anyone may take are reached from the floor, and move with her',()=>{
 const parent=new THREE.Group(),colliders=[],anchors=[];
 const run=createFerryRun({parent,colliders,register:(o,label,fn)=>anchors.push({o,label,fn})});run.parkAt('town');run.update(1/60,600,0);
 const walk=createFerryWalk(run);walk.update();
 for(const p of FERRY_PASSENGER_SEATS){
  const a=anchors.find(x=>x.label===p.label);assert.ok(a,p.label+' is offered');
  const seat=a.o.userData.seat,stand=new THREE.Vector3(...seat.stand),at=new THREE.Vector3(...seat.position);
  const f=walk.floorBelow(stand.x,stand.z,stand.y+.1);assert.ok(f,p.label+': he stands up on a floor');
  const m=walk.move(stand.x,f.y,stand.z,stand.x+.02,stand.z,.28);assert.ok(m?.ok,p.label+': and can walk from there');
  assert.ok(new THREE.Vector3().setFromMatrixPosition(a.o.matrixWorld).distanceTo(stand)<=a.o.userData.reach+.3,p.label+': its prompt is within reach of where he stands');
  assert.ok(walk.floorBelow(at.x,at.z,at.y+.1),p.label+': the seat is over her deck, so she carries him on it');
  assert.ok(seat.aboard&&Array.isArray(seat.aboard.position),p.label+': kept in her frame');
  // She moves: the seat goes with her.
  const before=seat.position;run.ferry.position.x+=10;run.ferry.rotation.y+=.3;run.ferry.updateMatrixWorld(true);
  const after=seat.position;assert.ok(Math.hypot(after[0]-before[0],after[2]-before[2])>5,p.label+' moves with her');
  assert.ok(Math.abs(seat.yaw-(run.ferry.rotation.y+p.yaw))<1e-9);
  run.ferry.position.x-=10;run.ferry.rotation.y-=.3;run.ferry.updateMatrixWorld(true);
 }
});
