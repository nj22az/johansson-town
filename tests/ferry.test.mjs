import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createFerryRun,FERRY,FERRY_BERTH,FERRY_TERMINAL,FERRY_TIMES,TOWN_PASSAGES,shipMotion} from '../src/world/ferry.js';
import {FERRY_DAY,rollPeriod} from '../src/world/ferry-ship.js';
import {FERRY_RAMP,FERRY_HULL,GANGWAY_LENGTH} from '../src/world/ferry-model.js';
import {SEA_LEVEL} from '../src/world/ocean.js';
import {HARBOUR_LINE,BUS_DWELL} from '../src/people/commuter-schedule.js';
import {OUTER_PIER,BREAKWATER,routeAt} from '../src/world/layout.js';
import {MINATO_BERTH} from '../src/world/minato-berth.js';
import {transitStop} from '../src/world/transit.js';
import {BUS_STATION} from '../src/world/bus-station.js';
import {chooseOpening} from '../src/world/openings.js';
import {circleHitsRect} from '../physics.js';
import {TURN_LIMITS} from '../src/world/ferry-paths.js';
import {ferryServiceFixture} from './ferry-service-fixture.mjs';
import {QUICK_CROSSING} from '../src/world/ferry-quick-crossing.js';

const run=(from,to,step=1/10)=>{const colliders=[],ferry=createFerryRun({parent:new THREE.Group(),colliders});const seen=[];
 for(let m=from;m<to;m+=step){ferry.update(step,m,m);seen.push({m,phase:ferry.phase,x:ferry.ferry.position.x,z:ferry.ferry.position.z,visible:ferry.ferry.visible,yaw:ferry.ferry.rotation.y});}
 return {ferry,seen,colliders};};

test('the ferry lies alongside the pier for each sailing, boarded from the pier by its gangway',()=>{
 const {seen}=run(HARBOUR_LINE[0]-90,HARBOUR_LINE[0]+BUS_DWELL+80);
 const alongside=seen.filter(s=>s.phase==='waiting');
 assert.ok(alongside.length,'It never came alongside');
 assert.ok(alongside[0].m>=HARBOUR_LINE[0]-.5&&alongside[0].m<=HARBOUR_LINE[0]+1,'It is not alongside when the timetable says');
 const last=alongside.at(-1).m;assert.ok(Math.abs(last-(HARBOUR_LINE[0]+BUS_DWELL))<1,'It does not stand its fifteen minutes');
 for(const s of alongside){assert.ok(Math.abs(s.x-FERRY_BERTH.x)<.01&&Math.abs(s.z-FERRY_BERTH.z)<.01);}
 // Beside the pier, not in it: the hull stops short of the pier's west flank and the quay.
 assert.ok(FERRY_BERTH.x+FERRY.beam/2<OUTER_PIER.x-OUTER_PIER.width/2);
 // She lies on the berth's fenders (minato-berth.js), her side on their faces.
 assert.ok(Math.abs(FERRY_BERTH.x+FERRY.beam/2-MINATO_BERTH.line)<.005,'She does not lie on the fenders');
 const F=MINATO_BERTH.fenders;assert.ok(F.z.filter(z=>z<FERRY_BERTH.z+FERRY.length/2&&z>FERRY_BERTH.z-FERRY.length/2).length>=4,'Too few fenders along her side');
 assert.ok(FERRY_BERTH.z+FERRY.length/2< -50,'The bow runs into the quay wall');
 // Her gangway lands on the pier, short of its end.
 assert.ok(FERRY_BERTH.gangwayZ>OUTER_PIER.z-OUTER_PIER.length/2+.5);
 // The gangway's foot and the queue are on the pier's deck, where people can stand.
 const {ferry}=run(0,1);
 for(let i=0;i<24;i++){const [x,z]=ferry.queueSpot(i);assert.equal(routeAt(x,z,.3)?.id,'outer-pier','Queue place '+i+' is off the pier');}
 assert.deepEqual(ferry.door,[...FERRY_TERMINAL.queue]);
 // And it goes away again: out of sight between sailings.
 assert.ok(seen.filter(s=>s.m<HARBOUR_LINE[0]-FERRY_TIMES.arrive-1).every(s=>!s.visible));
 assert.ok(seen.at(-1).phase==='away'&&!seen.at(-1).visible,'It never left');
});

/** Every point of the hull's outline at a pose (centre, yaw), on a 0.4 m grid. */
const hullPoints=({x,z,yaw})=>{const c=Math.cos(yaw),sn=Math.sin(yaw),out=[];
 for(let dx=-FERRY.beam/2;dx<=FERRY.beam/2+1e-9;dx+=FERRY.beam/8)for(let dz=-FERRY.length/2;dz<=FERRY.length/2+1e-9;dz+=.4)out.push([x+c*dx+sn*dz,z-sn*dx+c*dz]);return out;};
const inRect=([px,pz],x0,x1,z0,z1,m=0)=>px>x0-m&&px<x1+m&&pz>z0-m&&pz<z1+m;

test('it comes in round the breakwater, never through it, and keeps every part of the hull off the pier and the quay',()=>{
 const {seen}=run(HARBOUR_LINE[1]-80,HARBOUR_LINE[1]+BUS_DWELL+80,1/20);
 const pierW=OUTER_PIER.x-OUTER_PIER.width/2,pierE=OUTER_PIER.x+OUTER_PIER.width/2,pierS=OUTER_PIER.z-OUTER_PIER.length/2,pierN=OUTER_PIER.z+OUTER_PIER.length/2,F=MINATO_BERTH.fenders;
 for(const s of seen.filter(s=>s.visible))for(const p of hullPoints(s)){
  // The breakwater: a 68 m wall across the harbour mouth, 4 m thick (at z -106 since batch 3); a metre of water kept off it.
  assert.ok(!inRect(p,BREAKWATER.minX,BREAKWATER.maxX,BREAKWATER.z-2,BREAKWATER.z+2,1),'Hull within a metre of the breakwater at '+p.map(v=>v.toFixed(1)));
  // The outer pier and the second pier, its arm and Mr Fujita's houseboat beside it.
  assert.ok(!inRect(p,pierW,pierE,pierS,pierN,.1),'Hull touches the outer pier at '+p.map(v=>v.toFixed(1)));
  // Nor into its fenders: she lies on their faces alongside, and comes off them as she backs out.
  assert.ok(!inRect(p,MINATO_BERTH.line,pierW,F.z.at(-1)-F.base/2,F.z[0]+F.base/2,-.005),'Hull into the fenders at '+p.map(v=>v.toFixed(2)));
  assert.ok(!inRect(p,-38.3,-33.7,-64.3,-44,1),'Hull touches the second pier at '+p.map(v=>v.toFixed(1)));
  assert.ok(!inRect(p,-38.3,-23.7,-64.3,-59.7,1),'Hull touches the second pier’s arm at '+p.map(v=>v.toFixed(1)));
  assert.ok(!inRect(p,-42.05,-38.95,-59.9,-53.1,1),'Hull touches the houseboat at '+p.map(v=>v.toFixed(1)));
  // And never over the quay.
  assert.ok(p[1]< -50,'Hull over the quay at '+p.map(v=>v.toFixed(1)));
 }
 // It turns before it sails away, rather than steaming out backwards or flipping round.
 const yaws=seen.filter(s=>s.visible).map(s=>s.yaw);
 for(let i=1;i<yaws.length;i++){let d=Math.abs(yaws[i]-yaws[i-1]);d=Math.min(d,Math.PI*2-d);assert.ok(d<.35,'It spun on the spot at step '+i);}
});

test('the ferry has a solid hull only while it is alongside',()=>{
 const {ferry,colliders}=run(HARBOUR_LINE[0]-FERRY_TIMES.sea-FERRY_TIMES.harbour-5,HARBOUR_LINE[0]+2);
 const hull=colliders.find(c=>c.id==='ferry');
 assert.equal(ferry.phase,'waiting');assert.ok(circleHitsRect(FERRY_BERTH.x,FERRY_BERTH.z,.3,hull));
 for(let m=HARBOUR_LINE[0]+2;m<HARBOUR_LINE[0]+BUS_DWELL+15;m+=.1)ferry.update(.1,m,m);
 assert.notEqual(ferry.phase,'waiting');assert.ok(!circleHitsRect(FERRY_BERTH.x,FERRY_BERTH.z,.3,hull));
});

test('on the island the stop is the ferry terminal and the game can start off the ferry',()=>{
 
 try{
  assert.equal(transitStop(),FERRY_TERMINAL);
  assert.equal(chooseOpening({minutes:600,force:'ferry',storage:null}).id,'ferry');
  assert.equal(chooseOpening({minutes:600,force:'bus-stop',storage:null}).id,'ferry','Old links to the bus stop go nowhere');
 }finally{}
});

test('the ferry keeps real time: in slowly, fifteen minutes alongside, five to clear the port, then away',()=>{
 const T=FERRY_TIMES,start=HARBOUR_LINE[0]-T.sea-T.harbour-2,{ferry}=run(start,start);
 const at={};let m=start;
 const go=until=>{for(;m<until;m+=1/60)ferry.update(1/60,m,m*60);return {phase:ferry.phase,x:ferry.ferry.position.x,z:ferry.ferry.position.z,visible:ferry.ferry.visible};};
 at.arriving=go(HARBOUR_LINE[0]-1);assert.equal(at.arriving.phase,'arriving');
 at.alongside=go(HARBOUR_LINE[0]+BUS_DWELL-.5);assert.equal(at.alongside.phase,'waiting','loading for a quarter of an hour');
 at.backing=go(HARBOUR_LINE[0]+BUS_DWELL+1);assert.equal(at.backing.phase,'reversing');
 at.inPort=go(HARBOUR_LINE[0]+BUS_DWELL+4);assert.equal(at.inPort.phase,'leaving');assert.equal(TOWN_PASSAGES.departure.pose(4*60).kind,'manoeuvring','still working out of the harbour four minutes after letting go');
 at.clear=go(HARBOUR_LINE[0]+BUS_DWELL+5.2);assert.equal(TOWN_PASSAGES.departure.pose(5.2*60).kind,'sea','clear of the port in five minutes');assert.ok(at.clear.x<BREAKWATER.minX,'out past the breakwater’s west end');
 at.gone=go(HARBOUR_LINE[0]+BUS_DWELL+T.reverse+T.turn+T.leaveHarbour+T.leaveSea+.2);assert.equal(at.gone.phase,'away');assert.equal(at.gone.visible,false);
 // Each way is a passage: in from sea making way and to rest alongside; out from rest, making way as she goes.
 // Faster at sea than in the harbour, her turns within what she can make, and no jumps.
 const {arrival,departure}=TOWN_PASSAGES;
 assert.ok(Math.abs(arrival.duration-(T.sea+T.harbour)*60)<1e-6&&Math.abs(departure.duration-(T.reverse+T.turn+T.leaveHarbour+T.leaveSea)*60)<1e-6);
 const speed=(plan,kind)=>{const l=plan.legs.find(l=>l.kind===kind);return plan.pose((l.from+l.until)/2).speed;};
 assert.ok(speed(arrival,'sea')>speed(arrival,'berthing')*2,'it slows inside the breakwater');assert.ok(speed(departure,'sea')>speed(departure,'astern')*2,'it opens up once it is out');
 for(const plan of [arrival,departure]){let prev=plan.pose(0);for(let t=.25;t<=plan.duration;t+=.25){const p=plan.pose(t);
  assert.ok(Math.abs(p.turn)<=TURN_LIMITS[p.kind]*Math.PI/180*1.001,p.kind+' turns too fast at '+t);assert.ok(Math.abs(p.speed-prev.speed)<=.15*.25,'speed jumps at '+t);prev=p;}}
 assert.equal(arrival.pose(arrival.duration).speed,0);assert.equal(departure.pose(0).speed,0);
});

test('she rides the water: rolls at her period, a little alongside and more at sea, and her ramp and gangway stay on their landings',()=>{
 assert.ok(rollPeriod()>5&&rollPeriod()<6.5,'a small stiff ferry rolls in five to six and a half seconds');
 const deg=Math.PI/180,most=e=>{let roll=0,pitch=0;for(let t=0;t<60;t+=.05){const m=shipMotion(-20,-120,t,e);roll=Math.max(roll,Math.abs(m.roll));pitch=Math.max(pitch,Math.abs(m.pitch));}return {roll,pitch};};
 const harbour=most(0),sea=most(1);
 assert.ok(harbour.roll<=.36*deg&&harbour.roll>.2*deg,'alongside she rolls a few tenths of a degree');
 assert.ok(sea.roll<=2.01*deg&&sea.roll>1.5*deg,'at sea about two degrees');assert.ok(sea.pitch<=.51*deg&&sea.pitch>harbour.pitch,'and pitches half a degree');
 // Her heading comes first, then pitch about her beam and roll about her length.
 const r=createFerryRun({parent:new THREE.Group(),colliders:[]});assert.equal(r.ferry.rotation.order,'YXZ');
 // Seen from the pier she does not vanish at the harbour mouth: she is drawn wherever she is in view.
 assert.equal(r.ferry.userData.horizon,true);
 r.parkAt('town');const toe=new THREE.Vector3(),foot=new THREE.Vector3();let low=Infinity,high=-Infinity,footLow=Infinity,footHigh=-Infinity,moved=0;
 const flapEnd=new THREE.Vector3();
 for(let i=0;i<400;i++){r.update(.1,600,i*.1);r.ferry.userData.flap.updateMatrixWorld(true);toe.set(0,0,0).applyMatrix4(r.ferry.userData.flap.matrixWorld);flapEnd.set(0,0,FERRY_RAMP.flap).applyMatrix4(r.ferry.userData.flap.matrixWorld);
  assert.ok(Math.abs(flapEnd.y-toe.y)<.01,'the flap lies flat on the landing');
  r.ferry.userData.gangway.updateMatrixWorld(true);foot.set(GANGWAY_LENGTH,.03,0).applyMatrix4(r.ferry.userData.gangway.matrixWorld);
  low=Math.min(low,toe.y);high=Math.max(high,toe.y);footLow=Math.min(footLow,foot.y);footHigh=Math.max(footHigh,foot.y);moved=Math.max(moved,Math.abs(r.ferry.position.y-(SEA_LEVEL+FERRY_HULL.origin)));}
 assert.ok(moved>.005,'she does heave alongside');assert.ok(high-low<.002,'the ramp toe rides up and down on the quay ('+(high-low).toFixed(3)+' m)');assert.ok(footHigh-footLow<.002,'the gangway foot rides on the pier');
 assert.ok(Math.abs(low-(MINATO_BERTH.landing.top+.05))<.01,'the leaf rests on the landing plate');assert.ok(Math.abs(footLow-OUTER_PIER.height)<.01,'the gangway rests on the pier');
});

test('her lights, engines and whistle: lit under way after dark, quiet on shore power at night, signals as she leaves and passes the breakwater',()=>{
 const r=createFerryRun({parent:new THREE.Group(),colliders:[]}),nav=run=>run.ferry.getObjectByName('Masthead light').material.color.getHex()!==0x333333;
 r.update(.1,21*60,0);r.parkAt('town');r.update(.1,21*60,.1);assert.equal(nav(r),false,'no navigation lights alongside');
 assert.equal(r.audio.engines,'idle','in service at nine in the evening: a generator running');
 r.update(.1,23*60+30,.2);assert.equal(r.audio.engines,'off','after the last boat back she lies on shore power');
 // Thuan's boat home, the 22:15 (world/ferry-timetable.js): she prepares it herself at 22:12.
 const s=ferryServiceFixture({minute:22*60+11.9}),q=QUICK_CROSSING.town;s.player.position.set(q.stand[0],q.ground,q.stand[1]);s.until(()=>!!s.run.operation);
 assert.equal(nav(s.run),false,'preparing does not put the vessel under way');s.until(()=>s.run.audio.whistle.log.length===4);
 assert.equal(nav(s.run),true,'navigation lights on under way at night');assert.equal(s.run.ferry.getObjectByName('Port sidelight').material.color.getHex(),0xff3a2a,'red to port');
 const w=s.run.audio.whistle;assert.deepEqual(w.log.map(s=>s.kind),['departure','prolonged','astern','prolonged'],'the horn two minutes before, a prolonged blast and three short leaving the berth, a prolonged blast at the breakwater');
 assert.ok(Math.hypot(w.log[3].x-BREAKWATER.minX,w.log[3].z-BREAKWATER.z)<16,'the breakwater signal is sounded at its end');
 assert.ok(['manoeuvring','sea'].includes(s.run.audio.engines));
 s.until(()=>s.run.operation.sailingKind==='sea'&&s.run.audio.engines==='sea');assert.equal(s.run.audio.engines,'sea');   // by day she sails unlit: ferry-timetable.test.mjs, the 08:45
 // Her day: generators on before the first boat, shore power after the last.
 assert.ok(FERRY_DAY.generators<FERRY_DAY.inService&&FERRY_DAY.inService<FERRY_DAY.shorePower);
});

test('both berths have four working lines whose returned eyes continue through the fairlead to visible coils aboard',async()=>{
 const {FERRY_MOORING,FERRY_MOORINGS}=await import('../src/world/ferry.js');
 const {MINATO_BERTH}=await import('../src/world/minato-berth.js');
 const s=ferryServiceFixture({minute:8*60+41.9}),q=QUICK_CROSSING.town,{run,group:parent}=s;s.player.position.set(q.stand[0],q.ground,q.stand[1]);
 assert.equal(run.moored,true);assert.equal(run.berth,'town');
 const lines=parent.getObjectByName('Minato Maru mooring lines');assert.ok(lines.visible);
 assert.equal(FERRY_MOORING.lines.length,MINATO_BERTH.bitts.length);
 const segs=lines.children;assert.equal(segs.length,FERRY_MOORING.ropes.length*4,'three rope segments and one eye per rope aboard');
 lines.updateMatrixWorld(true);
 for(const l of FERRY_MOORING.lines){
  const i=l.rope,outer=segs[i*4+2];const end=new THREE.Vector3(0,1,0).applyMatrix4(outer.matrixWorld);
  assert.ok(end.distanceTo(new THREE.Vector3(...l.pier))<.02,l.name+' ends on the pier’s bitt');
  // The run to the pier leaves her side and lands on the pier, never inside her hull.
  const start=new THREE.Vector3(0,0,0).applyMatrix4(segs[i*4+1].matrixWorld),local=run.ferry.worldToLocal(start.clone());
  assert.ok(Math.abs(local.x)>3.5,l.name+' leaves from her side ('+local.x.toFixed(2)+')');
  assert.ok(start.y>end.y,l.name+' slopes down to the pier');
 }
 s.until(()=>!!run.operation);assert.equal(run.moored,true,'beginning a sailing cannot discard the moorings');s.until(()=>run.operation.stage==='letting-go');
 const previous=new Map(),observed=new Set();
 for(let i=0;i<6000&&run.operation.stage!=='passage';i++){
  s.tick(.1);
  for(const [j,line] of run.operation.lines.entries()){
   observed.add(line.status);const eye=segs[j*4+3],before=previous.get(j);
   if(eye.visible&&before)assert.ok(eye.position.distanceTo(before)<1,line.name+' eye jumped between return and heaving: '+eye.position.distanceTo(before).toFixed(3)+' m in 0.1 s');
   if(eye.visible)previous.set(j,eye.position.clone());else previous.delete(j);
  }
 }
 assert.equal(run.operation.stage,'passage',JSON.stringify(s.diagnostics()));assert.equal(run.moored,false);
 for(const status of ['slack','eye-return','heaving','coiled'])assert.ok(observed.has(status),status+' is visibly represented');
 assert.ok(segs.every(m=>!m.visible),'no working line remains ashore at sea');
 for(const rope of FERRY_MOORING.ropes)assert.ok(run.ferry.getObjectByName('Coiled aboard: '+rope.name).visible,'every rope stays visible, coiled on deck');
 s.until(()=>run.operation.stage==='alongside');assert.equal(run.moored,true);
 const worked=new Set(FERRY_MOORINGS.airport.map(l=>l.rope));
 for(const [k,rope] of FERRY_MOORING.ropes.entries()){
  const parts=segs.slice(k*4,k*4+4);
  if(worked.has(k))assert.ok(parts.every(m=>m.visible),rope.name+' is made fast at Kitano before access opens');
  else{assert.ok(parts.every(m=>!m.visible),rope.name+' is not worked bow-on');assert.ok(run.ferry.getObjectByName('Coiled aboard: '+rope.name).visible,rope.name+' stays coiled at its station');}
 }
 lines.updateMatrixWorld(true);
 for(const [n,line] of FERRY_MOORINGS.airport.entries()){
  const end=new THREE.Vector3(0,1,0).applyMatrix4(segs[line.rope*4+2].matrixWorld);assert.ok(end.distanceTo(new THREE.Vector3(...line.pier))<.02);
  assert.ok(parent.getObjectByName('Kitano ferry pier bitt: '+line.name),'the destination bitt is actually drawn');
  assert.ok(s.world.colliders.some(c=>c.id==='kitano-ferry-bitt-'+n),'the destination bitt has a physical footprint');
 }
});
