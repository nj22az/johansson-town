import test from 'node:test';
import assert from 'node:assert/strict';
import {FERRY_LOADS} from '../src/world/ferry-ship.js';
import {FERRY_SOURCES,FERRY_BOARDS,FERRY_FEEDERS,ELECTRICAL_DESIGN,CABLE_RATINGS,CLASSNK_CABLE_RATING_BOUND,
 copperResistivity,voltageDrop,cableSized,sourceAmps,feederSupply,routeLength,motorStartCableDrop,electricalChecks,electricalEngineeringReview} from '../src/world/ferry-electrical.js';

test('lighting and shore transformer schedules keep primary and secondary current/protection on their own voltage side',()=>{
 for(const id of ['T1','T2','ETR','shore']){
  const s=FERRY_SOURCES.find(s=>s.id===id);
  for(const side of [s.primary,s.secondary]){
   assert.ok(Math.abs(side.amps-sourceAmps(s.kVA,side.volts))<.06,id+' winding current');
   assert.ok(side.breaker>=side.amps,id+' frame');
   assert.ok(side.rating>=side.breakerSetting,id+' cable protects selected setting');
   assert.ok(side.breakerSetting<=side.breaker,id+' setting within frame');
  }
  assert.equal(s.amps,s.secondary.amps);
  assert.equal(s.breaker,s.secondary.breaker);
  assert.equal(s.cable,s.secondary.cable);
 }
 const lighting=FERRY_SOURCES.find(s=>s.id==='T1');
 assert.equal(lighting.primary.volts,440);assert.equal(lighting.secondary.volts,105);
 assert.equal(lighting.primary.breaker,50);assert.equal(lighting.secondary.breaker,200);
 assert.equal(lighting.primary.mm2,10);assert.equal(lighting.secondary.mm2,95);
 const shore=FERRY_SOURCES.find(s=>s.id==='shore');
 assert.equal(shore.primary.volts,200);assert.equal(shore.secondary.volts,440);
 assert.equal(shore.primary.amps,144.3);assert.equal(shore.secondary.amps,65.6);
 assert.match(FERRY_BOARDS.find(b=>b.id==='shore').name,/440 V/);
});

test('relocated auxiliary-room generators retain explicit shared parallel-cable current and geometric route estimates',()=>{
 for(const s of FERRY_SOURCES.filter(s=>/^DG/.test(s.id))){
  assert.equal(s.where,'aux-room');
  assert.equal(s.length,routeLength('aux-room','control-booth'));
  assert.equal(s.parallelSets,2);
  assert.ok(Math.abs(s.currentPerParallelSet-s.amps/2)<.1);
  assert.ok(s.dropPercent>0&&s.dropPercent<.2,'small hot-resistance drop, not omitted');
  assert.ok(Math.abs(s.dropPercent-voltageDrop(sourceAmps(125,445)/2,s.length,95,445,3))<1e-9);
  assert.match(s.route,/aux-room → engine-room → control-booth/);
  assert.match(s.routeStatus,/not verified/);
 }
});

test('hot-conductor drop includes resistance rise and a 24 V DC outgoing/return loop',()=>{
 assert.ok(Math.abs(copperResistivity(90)/copperResistivity(20)-1.2751)<1e-9);
 const hot=voltageDrop(10,20,2.5,24,0,90),cold=voltageDrop(10,20,2.5,24,0,20);
 assert.ok(hot>cold*1.27);
 assert.equal(hot,voltageDrop(10,20,2.5,24,1,90));
 assert.ok(Math.abs(hot/voltageDrop(10,20,2.5,24,3,90)-2/Math.sqrt(3))<1e-9);
 assert.deepEqual(feederSupply('24'),{volts:24,phases:0,dc:true});
 assert.throws(()=>feederSupply('240'),/Unknown/);
 assert.equal(cableSized(200,200,1000,24,0),null,'available maximum is not silently accepted');
});

test('every grouped load retains all consumers; live cores and protective conductors are separate',()=>{
 for(const l of FERRY_LOADS){
  const fs=FERRY_FEEDERS.filter(f=>f.id===l.id||f.id===l.id+'A'||f.id===l.id+'B');
  assert.equal(fs.reduce((sum,f)=>sum+f.unitsPerFeeder,0),l.count,l.id+' complete inventory');
 }
 const rooms=FERRY_FEEDERS.filter(f=>/^room-ac/.test(f.id));
 assert.equal(rooms.reduce((sum,f)=>sum+f.amps,0),44.8,'all four room air conditioners contribute');
 for(const f of FERRY_FEEDERS){
  assert.equal(f.totalCores,f.loadedCores+1,f.id);
  assert.equal(f.peMm2,f.mm2,f.id+' full-size provisional PE');
  assert.match(f.cable,/\+ PE /,f.id);
  if(f.starter==='star-delta')assert.match(f.motorTailCable,/^6 × .*\+ PE /,f.id+' six motor terminals');
 }
});

test('motor-start cable assessment differs from full-load drop and does not certify generator dynamics',()=>{
 const dol=motorStartCableDrop(10,20,2.5,440,'DOL'),star=motorStartCableDrop(10,20,2.5,440,'star-delta');
 assert.equal(dol.startAmps,60);assert.equal(star.startAmps,20);
 assert.ok(dol.impedanceEnvelopePercent>star.impedanceEnvelopePercent*2.9);
 assert.ok(star.transitionDOLCablePercent>star.resistivePercent*2.9);
 assert.match(dol.status,/source impedance.*unverified/);
 for(const f of FERRY_FEEDERS.filter(f=>f.starting))assert.ok(f.startCableDrop<=ELECTRICAL_DESIGN.motorStartCableBudget,f.id);
 const review=electricalEngineeringReview(),fire=review.emergencyStarts.find(s=>s.id==='fire-emergency');
 assert.ok(fire.totalScenarioKVA>fire.generatorKVA,'emergency generator current-only sizing does not pass');
 assert.equal(fire.exceedsContinuousRating,true);assert.match(fire.status,/HOLD/);
 assert.ok(review.openHolds.some(h=>/fault levels/.test(h.item)));
 assert.deepEqual(electricalChecks(),[],'numeric consistency remains distinct from unresolved engineering holds');
});

test('planning ampacity is bounded by the rule table and grouping exposes cable-selection sensitivity',()=>{
 for(const [mm2,amps] of CABLE_RATINGS)assert.ok(amps<=CLASSNK_CABLE_RATING_BOUND.find(([s])=>s===mm2)[1]);
 const grouped=cableSized(200,128.6,14,440,3,{groupingFactor:.85});
 assert.equal(grouped,null,'200 A protection has no adequate grouped size in the current 120 mm² range');
 const sensitivity=electricalEngineeringReview().groupedCableSensitivity;
 assert.ok(sensitivity.some(f=>f.id==='thruster'&&f.revisedSection===null));
 assert.match(ELECTRICAL_DESIGN.ampacityStatus,/manufacturer.*not verified/);
});
