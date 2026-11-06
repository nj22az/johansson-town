import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildVehicle} from '../src/world/road-vehicles.js';
import {createVehicleDrivers} from '../src/people/vehicle-driver.js';
import {crewBlocked,crewObstacleAt} from '../src/people/ferry-crew-walk.js';
import {buildWheelSecuring} from '../src/world/ferry-vehicle-securing.js';
import {ferryServiceFixture} from './ferry-service-fixture.mjs';
import {QUICK_CROSSING} from '../src/world/ferry-quick-crossing.js';

for(const [kind,width,length,name] of [['car',1.62,3.9,'Chin'],['kei truck',1.48,3.4,'Tetsuo']])test(name+' steps out clear of the actual casing fittings, walks upstairs and returns to the same car',()=>{
 installDOM();const world=new THREE.Group(),ferry=new THREE.Group(),car=buildVehicle(kind,0xffffff),g=new THREE.Group();world.add(ferry,car,g);car.visible=true;car.position.set(-1.375,1.1,-1.9);
 const v={id:'car-test',driver:name,purpose:'Cargo errand',width,length,g:car},obstacles=()=>[{id:v.id,x:-1.375,z:-1.9,w:width,d:length,y:1.1,height:2}],drivers=createVehicleDrivers({people:()=>[{g,profile:{name}}]});
 assert.equal(drivers.board(v),true);assert.equal(g.parent,car);assert.equal(drivers.leaveForPassenger(v,ferry,{obstacles}),true);assert.equal(g.parent,ferry);
 let sawStair=false;
 for(let i=0;i<1000&&!drivers.passengerClear(v);i++){
  const before=g.position.clone(),mode=drivers.snapshot(v).mode;drivers.update(.1);
  if(mode==='walking'){assert.ok(g.position.distanceTo(before)<=.1051);assert.equal(crewBlocked(g.position.toArray()),false);assert.equal(crewObstacleAt(g.position.toArray(),obstacles()),false);}
  if(g.position.y>1.3&&g.position.y<5.4)sawStair=true;
 }
 assert.equal(drivers.passengerClear(v),true,JSON.stringify(drivers.snapshot(v)));assert.ok(sawStair,'the driver climbs the actual stair');assert.equal(g.position.y,5.5);assert.equal(g.userData.inVehicle,undefined);assert.equal(g.userData.ferryPassenger,v.id);
 assert.equal(drivers.returnToVehicle(v),true);for(let i=0;i<1000&&!drivers.atWheel(v);i++)drivers.update(.1);
 assert.equal(drivers.atWheel(v),true,JSON.stringify(drivers.snapshot(v)));assert.equal(g.parent,car);assert.equal(g.userData.inVehicle,v.id);assert.equal(g.userData.ferryPassenger,undefined);assert.equal(world.children.filter(o=>o===g).length,0);
 drivers.release(v,{restore:true});assert.equal(g.parent,world);assert.equal(g.userData.ferryPassenger,undefined);
});

test('visible chocks and straps follow the actual model wheel centres and can be removed progressively',()=>{
 installDOM();const car=buildVehicle('kei truck',0xffffff),rig=buildWheelSecuring(car);rig.set(0);assert.equal(rig.group.visible,false);
 rig.set(.4);assert.equal(rig.group.visible,true);const chocks=rig.group.children[0],straps=rig.group.children[1];assert.ok(chocks.scale.x>0&&chocks.scale.x<1);assert.equal(straps.visible,false);
 rig.set(1);assert.equal(straps.visible,true);for(const w of car.userData.wheels.filter(w=>w.z>0))assert.ok(chocks.children.some(c=>Math.abs(c.position.x-w.x)<1e-9&&Math.abs(c.position.z-w.z)>w.r));
 rig.set(.2);assert.ok(chocks.scale.x<1);rig.set(0);assert.equal(rig.group.visible,false);
});

test('a background arrival does not change Johansson’s journey or advance the town clock',()=>{
 // Her 08:45 sailing (world/ferry-timetable.js) with him ashore at the landing sign.
 const s=ferryServiceFixture({minute:8*60+41.9}),q=QUICK_CROSSING.town;s.player.position.set(q.stand[0],q.ground,q.stand[1]);
 s.until(()=>s.run.operation?.stage==='passage');s.until(()=>s.run.operation?.stage==='alongside');s.tick(.1);
 assert.equal(s.run.berth,'airport');
 assert.equal(s.timePasses.length,0);assert.equal(s.state.island.journey.location,'town');assert.equal(s.state.island.visits,0);assert.equal(s.play.active,false);assert.equal(s.play.snapshot().cinematic,false);
});

test('a passenger aboard at her time walks freely and accounts only the remaining advertised journey time',()=>{
 const s=ferryServiceFixture({minute:8*60+41.9});s.play.action('airport-ferry');assert.match(s.menu.text,/does not wait/);s.choose('Go aboard');s.tick(0);
 assert.equal(s.play.cinematic,false);assert.equal(s.play.snapshot().cinematic,false);assert.ok(s.aboard());
 s.until(()=>s.state.island.journey.location==='airport',{seconds:2400,step:.25});assert.equal(s.state.island.visits,1);
 assert.ok(Math.abs(s.minutes-(8*60+45+22))<.3,'the advertised arrival, 09:07 ('+s.minutes+')');assert.equal(s.timePasses.length,1);
 const after=s.minutes;s.play.tick(0);s.play.tick(0);assert.equal(s.minutes,after,'completion is observed exactly once');assert.equal(s.timePasses.length,1);
});
