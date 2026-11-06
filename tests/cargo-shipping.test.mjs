import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {CARGO_PASSAGES,CARGO_CALLS,CARGO_BOAT,cargoPose,cargoVisit,buildCargoShipping} from '../src/world/cargo-shipping.js';
import {CARGO_BERTH,MINATO_BERTH,QUAY_FISHING_BOAT} from '../src/world/minato-berth.js';
import {BREAKWATER,OUTER_PIER} from '../src/world/layout.js';
import {airportShoreDistance} from '../src/world/airport-island.js';
import {HARBOUR_LINE} from '../src/people/commuter-schedule.js';
import {FERRY_TIMES} from '../src/world/ferry.js';

// The island cargo boat (cargo-shipping.js) at the outer pier's east face: in and out like a ship,
// never in the ferry's water, never through a wall, a pier, a moored boat or Kitano-jima's shore.
const HL=CARGO_BOAT.length/2,HB=CARGO_BOAT.beam/2;
const outline=p=>{const c=Math.cos(p.yaw),s=Math.sin(p.yaw),out=[];for(let a=-HB;a<=HB+1e-9;a+=HB/4)for(let b=-HL;b<=HL+1e-9;b+=.5)out.push([p.x+c*a+s*b,p.z-s*a+c*b]);return out;};
const gap=([x,z],[x0,x1,z0,z1])=>{const dx=Math.max(x0-x,0,x-x1),dz=Math.max(z0-z,0,z-z1);return dx||dz?Math.hypot(dx,dz):-Math.min(x-x0,x1-x,z-z0,z1-z);};
const F=CARGO_BERTH.fenders,W=MINATO_BERTH.fenders;
const boat=QUAY_FISHING_BOAT;
const SOLIDS={
 // need: metres of water kept off it
 pier:{r:[OUTER_PIER.x-OUTER_PIER.width/2-.09,CARGO_BERTH.face,OUTER_PIER.z-OUTER_PIER.length/2,-49.65],need:.25},
 fenders:{r:[CARGO_BERTH.face,CARGO_BERTH.line,F.z.at(-1)-F.base/2,F.z[0]+F.base/2],need:-.005},
 ferryFenders:{r:[MINATO_BERTH.line,MINATO_BERTH.face,W.z.at(-1)-W.base/2,W.z[0]+W.base/2],need:1},
 quay:{r:[-19,38,-49.975,-38],need:1.5},
 breakwater:{r:[BREAKWATER.minX,BREAKWATER.maxX,BREAKWATER.z-BREAKWATER.thickness/2,BREAKWATER.z+BREAKWATER.thickness/2],need:3},
 fishingBoat:{r:[boat.x-boat.length/2,boat.x+boat.length/2,boat.z-boat.beam/2,boat.z+boat.beam/2],need:2},
 eastQuayBoats:{r:[20.6,37.2,-52.95,-50.55],need:2},
};

test('she comes in and goes out like a ship: speed and heading continuous, turns and acceleration within reason',()=>{
 for(const [name,plan] of Object.entries(CARGO_PASSAGES)){
  let prev=plan.pose(0);const dt=.25;
  for(let t=dt;t<=plan.duration;t+=dt){
   const p=plan.pose(t),moved=Math.hypot(p.x-prev.x,p.z-prev.z),speed=moved/dt;
   let turn=p.yaw-prev.yaw;turn=Math.atan2(Math.sin(turn),Math.cos(turn));
   assert.ok(speed<3.4,`${name} jumps ${moved.toFixed(2)} m at ${t} s`);
   assert.ok(Math.abs(turn)/dt<=3.05*Math.PI/180,`${name} turns ${(turn/dt*180/Math.PI).toFixed(2)} °/s at ${t} s`);
   if(Number.isFinite(p.speed)&&Number.isFinite(prev.speed))assert.ok(Math.abs(p.speed-prev.speed)<=.15*dt+1e-9,`${name} speed jumps at ${t} s`);
   prev=p;
  }
 }
 // She starts beyond sight and ends there, and lies exactly at the berth between.
 const a=CARGO_PASSAGES.arrival,d=CARGO_PASSAGES.departure;
 for(const p of [a.pose(0),d.pose(d.duration)])assert.ok(Math.hypot(p.x-CARGO_BERTH.x,p.z-CARGO_BERTH.z)>300,'She appears or vanishes in sight of the harbour');
 for(const p of [a.pose(a.duration),d.pose(0)])assert.ok(Math.hypot(p.x-CARGO_BERTH.x,p.z-CARGO_BERTH.z)<1e-6&&Math.abs(p.yaw-CARGO_BERTH.yaw)<1e-6);
});

test('every part of her hull keeps off the pier, the walls, the boats and the ferry, and lies on her fenders alongside',()=>{
 for(const [name,plan] of Object.entries(CARGO_PASSAGES))for(let t=0;t<=plan.duration;t+=.5){
  const p=plan.pose(t);
  for(const q of outline(p)){
   for(const [solid,{r,need}] of Object.entries(SOLIDS))assert.ok(gap(q,r)>=need,`${name} at ${t} s (${p.phase}): hull ${gap(q,r).toFixed(2)} m off the ${solid} at ${q.map(v=>v.toFixed(1))}`);
   assert.ok(airportShoreDistance(...q)>3,`${name} at ${t} s: within 3 m of Kitano-jima's shore`);
   // Never in the ferry's water west of the pier.
   assert.ok(q[0]>OUTER_PIER.x-OUTER_PIER.width/2||q[1]<BREAKWATER.z-BREAKWATER.thickness/2-3,`${name} at ${t} s: in the ferry's water at ${q.map(v=>v.toFixed(1))}`);
  }
 }
 // Alongside: her starboard side on the fenders' faces, her bow 2 m off the quay, between the first and last fender.
 assert.ok(Math.abs(CARGO_BERTH.x-HB-CARGO_BERTH.line)<1e-9);
 assert.ok(Math.abs(CARGO_BERTH.z+HL-(-52))<1e-9);
 assert.ok(F.z[0]<CARGO_BERTH.z+HL&&F.z.at(-1)>CARGO_BERTH.z-HL,'Her fenders are not all along her side');
});

test('her calls keep to the board and stay out of the ferry\'s way',()=>{
 for(const c of CARGO_CALLS){
  assert.equal(cargoVisit(c.alongside).phase,'alongside');assert.equal(cargoVisit(c.alongside-.5).phase,'arriving');assert.equal(cargoVisit(c.departure+.5).phase,'departing');assert.equal(cargoVisit(c.gone+.1).visible,false);
  const p=cargoPose(c.alongside+10);assert.equal(p.x,CARGO_BERTH.x);assert.equal(p.z,CARGO_BERTH.z);
  // Her minutes in and out of the harbour fall outside the ferry's timetable calls at Minato (in from
  // the sea before each sailing, out within her five minutes after it), though their waters never meet.
  for(const m of HARBOUR_LINE){
   const busy=[m-FERRY_TIMES.sea-FERRY_TIMES.harbour,m+15+FERRY_TIMES.reverse+FERRY_TIMES.turn+FERRY_TIMES.leaveHarbour+FERRY_TIMES.leaveSea];
   for(const [from,to] of [[c.arrival,c.alongside],[c.departure,c.gone]])assert.ok(to<=busy[0]||from>=busy[1],`cargo ${from.toFixed(1)}–${to.toFixed(1)} meets the ferry's call ${busy.map(v=>v.toFixed(1))}`);
  }
 }
 const world={group:new THREE.Group()},service=buildCargoShipping(world);
 service.update(0,CARGO_CALLS[0].alongside+20);assert.equal(service.ship.visible,true);assert.ok(Math.abs(service.ship.position.x-CARGO_BERTH.x)<1e-9&&Math.abs(service.ship.position.z-CARGO_BERTH.z)<1e-9);
 const lines=world.group.children.filter(o=>o.name==='Cargo mooring line');assert.equal(lines.length,4);assert.ok(lines.every(l=>l.visible));
 service.update(0,720);assert.equal(service.ship.visible,false);assert.ok(lines.every(l=>!l.visible));
});
