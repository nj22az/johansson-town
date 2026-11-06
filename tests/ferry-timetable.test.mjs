import {GANGWAY_LENGTH,FERRY_RAMP} from '../src/world/ferry-model.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {ferryServiceFixture} from './ferry-service-fixture.mjs';
import {FERRY_TIMETABLE,timetableBerth,sailingDue,nextSailing,departureWarning,FERRY_WARNING_MINUTES} from '../src/world/ferry-timetable.js';
import {HARBOUR_LINE,BUS_DWELL,CROSSING_MINUTES} from '../src/people/commuter-schedule.js';
import {AIRPORT_FERRY_PORTS} from '../src/world/airport-ferry.js';
import {restoreIsland} from '../src/island/services.js';
import {chiefWatchHolder} from '../src/people/ferry-crew-aboard.js';
import {FERRY_RELIEF} from '../src/people/ferry-crew.js';

/**
 * The Minato Maru keeps her timetable and never waits for Nils (the owner, 21 October 2026; briefs/ferry-timetable.md).
 * These drive the real run, crew, shore hands and island play (ferry-service-fixture.mjs): no ready-task shortcut.
 */
const DEPARTS=8*60+45;   // the 08:45 out of Minato (Harbour Line 08:30 + BUS_DWELL)
const port=AIRPORT_FERRY_PORTS;
/** game.js stepFerryWalk, for the fixture: measured on the level, his feet on her floors (or the ground), ladders climbed. */
function walkOff(f,{seconds=240}={}){
 for(let i=0;i<seconds*10&&f.play.walking;i++){
  const t=f.play.walkTarget();if(!t)break;const p=f.player.position,dx=t.at.x-p.x,dz=t.at.z-p.z,dy=t.at.y-p.y;
  const d=t.climb?Math.hypot(dx,dy,dz):Math.hypot(dx,dz),step=Math.min(d,.1*(t.climb?.55:1.18));
  if(d<1e-3){if(t.climb)p.y=t.at.y;f.play.walkReached();f.tick(.1);continue;}
  p.x+=dx/d*step;p.z+=dz/d*step;
  if(t.climb)p.y+=dy/d*step;
  else{f.walk.update();const deck=f.walk.floorBelow(p.x,p.z,Math.max(p.y,t.at.y)+.3);p.y=deck?deck.y:t.shore?t.at.y:p.y+dy*step/d;}
  if(step>=d-1e-6)f.play.walkReached();
  f.tick(.1);
 }
 assert.equal(f.play.walking,false,'the walk ends');
}
const stageAt=(f,stage)=>{let at=null;f.until(()=>{if(at===null&&f.run.operation?.stage===stage)at=f.minutes;return at!==null;},{seconds:1800,step:.25});return at;};
const onGangway=f=>{f.run.ferry.updateWorldMatrix(true,true);const p=f.run.ferry.userData.gangway.worldToLocal(f.player.position.clone());return p.x>=0&&p.x<=GANGWAY_LENGTH&&Math.abs(p.y-.03)<.35&&Math.abs(p.z)<.7;};

test('one timetable from the Harbour Line: three calls at Minato, the first boat out and the last boat back, overnight at Minato',()=>{
 assert.equal(FERRY_TIMETABLE.length,HARBOUR_LINE.length*2+2);
 FERRY_TIMETABLE.forEach((s,i)=>{
  assert.notEqual(s.from,s.to);assert.equal(s.arrives,s.departs+CROSSING_MINUTES);
  if(i)assert.equal(s.from,FERRY_TIMETABLE[i-1].to,'each sailing leaves from where the last one went');
  if(i)assert.ok(s.departs>=FERRY_TIMETABLE[i-1].arrives+5,s.id+' leaves her time alongside');
 });
 assert.equal(FERRY_TIMETABLE[0].from,'town');assert.equal(FERRY_TIMETABLE.at(-1).to,'town','she lies overnight at Minato');
 for(const call of HARBOUR_LINE){
  assert.ok(FERRY_TIMETABLE.some(s=>s.to==='town'&&s.arrives===call),'in at '+call);
  assert.ok(FERRY_TIMETABLE.some(s=>s.from==='town'&&s.departs===call+BUS_DWELL),'out at '+(call+BUS_DWELL));
 }
 assert.ok(FERRY_TIMETABLE.some(s=>s.from==='town'&&s.departs===22*60+15),'Thuan’s boat home, the last out of Minato');
 assert.equal(timetableBerth(3*60),'town');assert.equal(timetableBerth(10*60),'airport');assert.equal(timetableBerth(8*60+31),'town');
 assert.equal(sailingDue(DEPARTS-3,'town').at,DEPARTS);assert.equal(sailingDue(DEPARTS-3,'airport'),null);
 assert.equal(departureWarning(DEPARTS-FERRY_WARNING_MINUTES,'town').at,DEPARTS);assert.equal(departureWarning(DEPARTS-FERRY_WARNING_MINUTES-.1,'town'),null);
 assert.equal(nextSailing(23*60+30,'town').at,1440+7*60+30);
});

test('ashore, she sails at her time: the gangway closes at 08:45 and nothing asks him',()=>{
 const f=ferryServiceFixture({minute:DEPARTS-6});f.player.position.set(port.town.landing[0]+6,port.town.height,port.town.landing[1]-12);
 assert.equal(f.run.berth,'town');assert.equal(f.run.operation,null);
 const closing=stageAt(f,'closing-access');assert.ok(closing>=DEPARTS&&closing<DEPARTS+.5,'gangway in at '+closing);
 const sails=stageAt(f,'passage');assert.ok(sails<DEPARTS+5,'under way by 08:50 ('+sails+')');
 assert.equal(f.aboard(),false);assert.equal(f.state.island.journey.location,'town');
});

test('two minutes before: the horn, the 出港 sign and the Go ashore / Stay aboard prompt; Go ashore lands him on the quay and she leaves without him',()=>{
 const f=ferryServiceFixture({minute:DEPARTS-5});
 f.anchors.find(a=>/Board the Minato/.test(a.label)).fn();f.choose('Go aboard');assert.ok(f.aboard());
 assert.equal(f.play.departurePrompt,null,'no prompt before the warning');
 f.until(()=>!!f.play.departurePrompt,{seconds:600,step:.1});
 assert.ok(f.minutes>=DEPARTS-FERRY_WARNING_MINUTES&&f.minutes<DEPARTS-FERRY_WARNING_MINUTES+.05,'prompt at T−2 ('+f.minutes+')');
 assert.deepEqual(f.run.audio.whistle.log.map(w=>w.kind),['departure'],'one horn, at the warning');
 f.tick(.05);assert.equal(f.play.landingSigns.departing('town'),'08:45','the sign, the next frame');
 const boards=[];f.group.traverse(o=>{if(o.name==='Landing sign board')boards.push(o);});
 assert.equal(boards.length,2);assert.ok(boards.every(b=>b.userData.dynamicProp),'a changing face is never merged into the static batch (render/static-props.js)');assert.equal(f.play.landingSigns.departing('airport'),null);
 assert.equal(f.play.departurePrompt.place,'Kitano-jima');
 assert.ok(f.play.goAshore());assert.equal(f.play.departurePrompt,null);walkOff(f);
 const p=f.player.position;assert.ok(Math.hypot(p.x-port.town.landing[0],p.z-port.town.landing[1])<.05,'at the quay end of the gangway');
 assert.equal(f.aboard(),false);assert.ok(f.minutes<DEPARTS,'ashore before she sails');
 const closing=stageAt(f,'closing-access');assert.ok(closing<DEPARTS+.5);stageAt(f,'passage');
 assert.equal(f.state.island.journey.location,'town');assert.equal(f.play.landingSigns.departing('town'),null,'the sign is the landing sign again');
});

test('Stay aboard: he crosses on his own feet, lands at the advertised time at Kitano-jima, and goes ashore down her ramp',()=>{
 const f=ferryServiceFixture({minute:DEPARTS-4});
 f.anchors.find(a=>/Board the Minato/.test(a.label)).fn();f.choose('Go aboard');
 f.until(()=>!!f.play.departurePrompt,{seconds:600,step:.1});f.play.stayAboard();assert.equal(f.play.departurePrompt,null);
 const closing=stageAt(f,'closing-access');assert.ok(closing>=DEPARTS&&closing<DEPARTS+.5);
 f.until(()=>f.run.operation?.sailingKind==='sea',{seconds:900,step:.25});
 assert.equal(f.run.ferry.getObjectByName('Masthead light').material.color.getHex(),0x333333,'no navigation lights by day');
 f.until(()=>f.state.island.journey.location==='airport',{seconds:1800,step:.25});
 assert.ok(f.aboard(),'still on her decks');assert.equal(f.run.berth,'airport');
 assert.ok(Math.abs(f.minutes-(DEPARTS+CROSSING_MINUTES))<.3,'the advertised arrival on his clock ('+f.minutes+')');
 f.until(()=>f.run.operation?.stage==='alongside',{seconds:300,step:.25});
 assert.ok(f.play.goAshore());walkOff(f);
 const p=f.player.position;assert.ok(Math.hypot(p.x-port.airport.landing[0],p.z-port.airport.landing[1])<.05,'ashore on Kitano-jima’s pier');assert.equal(f.aboard(),false);
});

for(const [end,fraction] of [['pier',.8],['deck',.2]])
 test('on the gangway as it closes, he is walked to the nearer end ('+end+') before it moves; she does not wait for him',()=>{
  const f=ferryServiceFixture({minute:DEPARTS-1});f.tick(.2);
  f.run.ferry.updateWorldMatrix(true,true);f.player.position.copy(f.run.ferry.userData.gangway.localToWorld(new THREE.Vector3(GANGWAY_LENGTH*fraction,.03,0)));f.walk.update();assert.ok(onGangway(f),'standing on the gangway');
  f.until(()=>f.run.operation?.stage==='closing-access',{seconds:300,step:.1});
  for(let i=0;i<200&&f.run.operation?.stage==='closing-access';i++){
   if(f.play.walking)walkOff(f);else f.tick(.1);
   assert.ok(!(onGangway(f)&&f.run.operation.gangway.out<1),'never on a moving gangway');
  }
  assert.equal(onGangway(f),false);assert.equal(f.aboard(),end==='deck');
  const sails=stageAt(f,'passage');assert.ok(sails<DEPARTS+5,'she sails on time');
 });

for(const [end,part,fraction,height]of [['deck','ramp',.2,.07],['pier','flap',.8,.05]])
 test('a passenger on the bow '+part+' clears to the nearer '+end+' before it is raised',()=>{
  const f=ferryServiceFixture({minute:DEPARTS-1});f.tick(.2);f.run.ferry.updateWorldMatrix(true,true);
  const object=f.run.ferry.userData[part],length=part==='ramp'?FERRY_RAMP.leaf:FERRY_RAMP.flap;
  f.player.position.copy(object.localToWorld(new THREE.Vector3(0,height,length*fraction)));f.walk.update();
  f.until(()=>f.play.walking||f.run.operation?.stage==='raising-ramp',{seconds:300,step:.1});
  assert.equal(f.play.walking,true,'The passenger is cleared before ramp motion');
  walkOff(f);assert.equal(f.aboard(),end==='deck');
  const sails=stageAt(f,'passage');assert.ok(sails<DEPARTS+5,'Clearing preserves the sailing time');
 });

test('the chief’s watch: Mac’s while Johansson is ashore or off duty, Johansson’s aboard in working hours, and the ship never waits for him',()=>{
 assert.equal(chiefWatchHolder({minutes:10*60,playerAboard:false}),'relief');
 assert.equal(chiefWatchHolder({minutes:10*60,playerAboard:true}),'player');
 assert.equal(chiefWatchHolder({minutes:23*60+30,playerAboard:true}),'relief');
 const f=ferryServiceFixture({minute:DEPARTS-5,identity:'Johansson'});
 f.player.position.set(port.town.landing[0]+6,port.town.height,port.town.landing[1]-12);f.tick(.2);
 assert.equal(f.crew.chiefWatch,'relief');assert.ok(f.crew.snapshot().some(c=>c.name===FERRY_RELIEF.chief.name&&c.post==='chief'),'Mac keeps the working watch');
 f.anchors.find(a=>/Board the Minato/.test(a.label)).fn();f.choose('Go aboard');f.tick(.2);
 assert.equal(f.crew.chiefWatch,'player');assert.ok(!f.crew.snapshot().some(c=>c.post==='chief'),'no second Johansson and no Mac at the chief’s station');
 // He does nothing at all: she still prepares and sails at her time.
 const closing=stageAt(f,'closing-access');assert.ok(closing>=DEPARTS&&closing<DEPARTS+.5);
});

test('an old save holding a requested or held crossing comes back on the timetable',()=>{
 const legacy={v:1,projects:[],journey:{location:'airport',roundTrip:true,ticket:null,checked:false,requestedDestination:'town',held:true,ride:{kind:'loading'}},ferryRequest:{destination:'town'}};
 const island=restoreIsland(legacy);
 assert.deepEqual(Object.keys(island.journey).sort(),['checked','location','roundTrip','ticket']);assert.equal(island.ferryRequest,undefined);
 assert.equal(island.journey.location,'airport','he is still where he was');
 const f=ferryServiceFixture({minute:10*60,state:{yen:1000,inventory:[],island}});
 assert.equal(f.run.berth,timetableBerth(10*60));assert.equal(f.run.operation,null,'no crossing started for the old request');
 f.tick(30);assert.equal(f.run.operation,null,'and none until her next sailing, 14:08 from Kitano-jima');
});
