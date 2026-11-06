import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlant} from '../src/world/ferry-plant.js';
import {createFerryOperations,FERRY_PROCEDURE} from '../src/world/ferry-operations.js';
import {AIRPORT_PASSAGES,FERRY_SAILINGS} from '../src/world/airport-ferry.js';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createFerryRun} from '../src/world/ferry.js';

function fixture({warm=false,bind=true,vehicles=null}={}){
 const plant=createPlant();plant.routine(warm?700:300);if(warm)plant.tick(120);
 const ages=new Map(),blocked=new Set(),poses=[],transitions=[];let berth='town',time=0,op;
 const crew={taskAtStation:id=>{const t=op.snapshot()?.tasks.find(t=>t.id===id);return !!t&&!blocked.has(t.post);},taskReady:id=>{const t=op.snapshot()?.tasks.find(t=>t.id===id);return !!t&&(ages.get(id)||0)>=t.seconds;}};
 op=createFerryOperations({plant,sailings:FERRY_SAILINGS,getBerth:()=>berth,getMinutes:()=>300+time/60,
  getLines:()=>['head line','forward spring','after spring','stern line'].map((name,i)=>({id:'line-'+i,name,station:i<2?'fwd':'aft',pier:[i,0,0],shoreTarget:{x:i,y:0,z:0}})),
  getCrew:()=>bind?crew:null,getVehicles:()=>vehicles,onPose:p=>poses.push({...p}),onBerth:b=>berth=b,onStage:s=>transitions.push({stage:s,at:time})});
 const tick=(dt=.1)=>{const used=Math.min(dt,.25);time+=used;plant.tick(used/60);for(const t of op.snapshot()?.tasks||[])if(!blocked.has(t.post))ages.set(t.id,(ages.get(t.id)||0)+used);op.tick(dt);};
 const until=(predicate,max=16000)=>{for(let i=0;i<max&&!predicate();i++)tick();assert.ok(predicate(),JSON.stringify({op:op.snapshot()?.stage,blocking:op.snapshot()?.blocking,time}));};
 return {plant,op,poses,transitions,blocked,tick,until,get time(){return time;},get berth(){return berth;}};
}

test('visible ferry motion follows the cleared track with bounded speed and heading rate in both directions',()=>{
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 for(const [way,sailing] of Object.entries(FERRY_SAILINGS)){
  assert.ok(sailing.duration>300&&sailing.duration<410,way+' actual-time duration '+sailing.duration);
  let last=sailing.pose(0),maxSpeed=0,maxTurn=0;
  for(let t=.05;t<sailing.duration;t+=.05){
   const p=sailing.pose(t),original=AIRPORT_PASSAGES[way].pose(p.sourceTime),speed=Math.hypot(p.x-last.x,p.z-last.z)/.05,turn=Math.abs(wrap(p.yaw-last.yaw))/.05*180/Math.PI;
   assert.ok(Math.hypot(p.x-original.x,p.z-original.z)<1e-8,'retains the actual cleared water track');
   maxSpeed=Math.max(maxSpeed,speed);maxTurn=Math.max(maxTurn,turn);
   if(p.kind==='berthing')assert.ok(speed<.62,way+' slows at its berth');
   if(p.kind==='astern')assert.ok(speed<.72,way+' leaves its berth slowly');
   last=p;
  }
  assert.ok(maxSpeed<=3.0001);assert.ok(maxTurn<2,way+' heading rate '+maxTurn);assert.equal(sailing.pose(sailing.duration).speed,0);
 }
});

test('unbound crew and a missing actor acknowledgement cannot start the ship',()=>{
 const f=fixture({bind:false});assert.equal(f.op.request('airport'),true);
 for(let i=0;i<500;i++)f.tick();assert.equal(f.poses.length,0);assert.equal(f.op.stage,'preparing');assert.match(f.op.snapshot().blocking,/Master|Chief/);
 const g=fixture({warm:true});g.blocked.add('cook');g.op.request('airport');for(let i=0;i<1200;i++)g.tick();assert.equal(g.poses.length,0);assert.match(g.op.snapshot().blocking,/Cook/);
 g.blocked.delete('cook');g.until(()=>g.poses.length>0);
});

test('public legacy clock and positioning helpers cannot bypass a requested voyage’s interlocks',()=>{
 installDOM();const run=createFerryRun({parent:new THREE.Group()});run.update(.01,600);run.parkAt('town');
 assert.equal(run.beginCrossing('airport'),true);const before=run.ferry.position.clone(),id=run.operation.id;
 run.step(3600,10000);assert.equal(run.setCrossingProgress(.9),false);assert.equal(run.parkAt('airport'),false);assert.equal(run.beginCrossing('town'),false);
 run.update(.1,600);
 assert.equal(run.operation.id,id);assert.equal(run.operation.stage,'preparing');assert.equal(run.phase,'preparing');assert.equal(run.crossingProgress,0);assert.equal(run.berth,'town');assert.equal(run.ferry.visible,true);assert.equal(run.moored,true);
 assert.ok(Math.hypot(run.ferry.position.x-before.x,run.ferry.position.z-before.z)<1e-9,'the hull stays at its original berth with no bound crew');
});

test('cold start respects plant commands, ramp duration, each returned eye and the final departmental reports',()=>{
 const f=fixture();assert.equal(f.plant.readings().board.shore,true);f.op.request('airport');
 f.until(()=>f.op.stage==='raising-ramp');const raiseAt=f.time;
 for(let i=0;i<300;i++)f.tick();let o=f.op.snapshot();assert.ok(o.ramp.down>.45&&o.ramp.down<.55);assert.equal(o.ramp.locked,false);assert.equal(f.poses.length,0);
 f.until(()=>f.op.stage==='letting-go');assert.ok(f.time-raiseAt>=FERRY_PROCEDURE['raising-ramp'].seconds-.1);assert.equal(f.op.snapshot().ramp.locked,true);
 const saw=new Set();while(f.op.stage==='letting-go'){f.tick();for(const l of f.op.snapshot().lines)saw.add(l.status);}
 for(const status of ['slack','eye-return','heaving','coiled'])assert.ok(saw.has(status),status+' is a visible phase');
 assert.equal(f.poses.length,0,'master has not authorised movement yet');f.until(()=>f.poses.length>0);
 o=f.op.snapshot();assert.equal(o.plant.ready,true);assert.equal(o.gangway.out,0);assert.ok(o.lines.every(l=>l.status==='coiled'));
 assert.equal(f.plant.readings().board.shore,false);assert.equal(f.plant.readings().telegraph.mainP,'DEAD SLOW ASTERN');
 assert.ok(o.history.some(e=>e.post==='chief'&&/both main engines/.test(e.text)));assert.ok(o.history.some(e=>e.post==='mate'&&/deck department/.test(e.text)));
 assert.ok(o.history.some(e=>e.kind==='order'&&e.post==='bosun'&&/Shore hand/.test(e.text)));
});

test('a tagged-out main engine produces a hold and cannot be started by the routine or a ready crew',()=>{
 const f=fixture();assert.equal(f.plant.isolate('mainP').ok,true);f.op.request('airport');f.until(()=>f.op.stage==='held');
 assert.match(f.op.snapshot().blocking,/isolated/);for(let i=0;i<500;i++)f.tick();assert.equal(f.poses.length,0);assert.equal(f.plant.machine('mainP').state,'isolated');
 assert.equal(f.plant.isolate('mainP',false).ok,true);f.until(()=>f.poses.length>0);assert.equal(f.plant.machine('mainP').state,'running');
});

test('warm running engines hold departure when cooling supply closes and recover through a supplied crossover',()=>{
 const f=fixture({warm:true});for(const id of ['mainP','mainS']){assert.equal(f.plant.machine(id).state,'running');assert.ok(f.plant.readings().temps[id]>60);}
 f.op.request('airport');for(const name of ['chestP','chestS','crossover'])assert.equal(f.plant.valve(name,false).ok,true);
 for(let i=0;i<3000;i++)f.tick();assert.equal(f.op.stage,'preparing');assert.equal(f.poses.length,0);assert.equal(f.plant.departureReadiness().ready,false);assert.match(f.op.snapshot().blocking,/sea-water cooling supply/);
 assert.equal(f.plant.valve('chestP',true).ok,true);for(let i=0;i<20;i++)f.tick();
 assert.equal(f.plant.departureReadiness().ready,false,'the starboard engine cannot use the other chest with its crossover shut');assert.equal(f.poses.length,0);
 assert.equal(f.plant.valve('crossover',true).ok,true);assert.equal(f.plant.departureReadiness().ready,true,'an open, supplied crossover restores both cooling circuits');
 f.until(()=>f.poses.length>0);for(const id of ['mainP','mainS'])assert.equal(f.plant.machine(id).state,'running');
});

test('a completed bosun gesture does not substitute for secured cars and drivers upstairs',()=>{
 let secured=0,driversClear=0;const vehicles={prepareCrossing:()=>true,securingSummary:()=>({aboard:1,secured,driversClear})};
 const f=fixture({warm:true,vehicles});f.op.request('airport');f.until(()=>f.op.stage==='securing');for(let i=0;i<300;i++)f.tick();assert.equal(f.op.stage,'securing');assert.equal(f.poses.length,0);
 secured=1;for(let i=0;i<100;i++)f.tick();assert.equal(f.op.stage,'securing');driversClear=1;f.until(()=>f.op.stage==='closing-access');
});

test('arrival makes every line fast before access opens, and an unaccompanied voyage uses the same clock',()=>{
 const f=fixture({warm:true});f.op.request('airport',{automatic:true});f.until(()=>f.op.stage==='passage');const sailedAt=f.time;
 f.until(()=>f.op.stage==='making-fast');assert.ok(f.time-sailedAt>=FERRY_SAILINGS.airport.duration-.2);assert.equal(f.berth,'airport');
 let o=f.op.snapshot();assert.equal(o.ramp.down,0);assert.ok(o.lines.every(l=>l.status==='coiled'));assert.equal(f.plant.readings().telegraph.mainP,'STOP');assert.equal(f.plant.machine('mainP').state,'running');
 f.until(()=>f.op.stage==='opening-access');o=f.op.snapshot();assert.ok(o.lines.every(l=>l.status==='fast'));const openAt=f.time;
 f.until(()=>f.op.stage==='alongside');assert.ok(f.time-openAt>=45-.2);assert.equal(f.op.completed.length,1);assert.equal(f.op.completed[0].automatic,true);assert.equal(f.op.snapshot().ramp.down,1);
});

test('a suspended-frame delta cannot advance the ferry by minutes or bypass a gate',()=>{
 const f=fixture({warm:true});f.op.request('airport');f.tick(1200);assert.equal(f.op.snapshot().elapsed,.25);assert.equal(f.op.stage,'preparing');assert.equal(f.poses.length,0);
});
