import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createFerryRun} from '../src/world/ferry.js';
import {FERRY_DAY} from '../src/world/ferry-ship.js';
import {FERRY_INTERIOR,FERRY_MACHINERY_SPACES} from '../src/world/ferry-interior.js';
import {FERRY_INSPECT} from '../src/world/ferry-inspect.js';
import {PLANT_STATIONS,stationMenu,stationLabel,liveValue,plantSound,telegraphFor} from '../src/world/ferry-plant-controls.js';
import {createPlant,PLANT_ALARMS} from '../src/world/ferry-plant.js';
import {paintBack} from '../src/render/canvas-release.js';
installDOM();

const boot=minutes=>{const prompts=[];const run=createFerryRun({parent:new THREE.Group(),colliders:[],register:(o,label,fn)=>{o.userData.hit={label,fn};prompts.push(o);}});run.parkAt('town');run.update(1/60,minutes,0);return {run,prompts};};

test('the ferry runs her plant by the town clock: shore power at five, the generators from 6:10, the engines for the first boat, and her sound follows (6r-2)',()=>{
 const {run}=boot(5*60);
 assert.ok(run.plant.readings().board.shore,'on shore power before the crew’s day');assert.equal(run.audio.engines,'off');
 run.update(1/60,FERRY_DAY.generators+1,60);assert.equal(run.plant.machine('gen1').state,'running');assert.equal(run.audio.engines,'generators');
 run.update(1/60,FERRY_DAY.inService+2,120);assert.equal(run.plant.machine('mainP').state,'running');assert.equal(run.audio.engines,'idle');
 assert.equal(run.plant.readings().telegraph.mainP,'STOP','alongside the telegraph is at STOP');
 run.update(1/60,FERRY_DAY.shorePower+1,180);assert.ok(run.plant.readings().board.shore);assert.equal(run.audio.engines,'off');
 // Under way: the telegraph by her phase, the sound by how far out she is.
 assert.equal(telegraphFor('reversing'),'SLOW ASTERN');assert.equal(telegraphFor('leaving',.9),'FULL AHEAD');assert.equal(telegraphFor('waiting'),'STOP');
 const p=createPlant({minutes:FERRY_DAY.inService});p.routine(FERRY_DAY.inService);p.tick(1);
 assert.equal(plantSound(p.readings(),{underway:true,exposure:.2}),'manoeuvring');assert.equal(plantSound(p.readings(),{underway:true,exposure:.8}),'sea');assert.equal(plantSound(p.readings(),{underway:false}),'idle');
});

test('every station stands on a floor of the machinery spaces within reach of its machines, with a prompt that reads the plant, and the console replaces the old note',()=>{
 const {run,prompts}=boot(FERRY_DAY.inService+5);
 const floors=FERRY_INTERIOR.floors.filter(f=>['engine-room','aux-room','workshop','control-booth'].includes(f.id));
 for(const st of PLANT_STATIONS){
  const onFloor=floors.some(f=>st.pos[0]>=f.x[0]-.3&&st.pos[0]<=f.x[1]+.3&&st.pos[2]>=f.z[0]-.3&&st.pos[2]<=f.z[1]+.3);
  assert.ok(onFloor,st.id+' stands by a floor: '+st.pos.map(n=>n.toFixed(2)));
  assert.ok(st.pos[2]<FERRY_MACHINERY_SPACES.storeFore,st.id+' is in the machinery spaces');
  for(const id of st.machines)assert.ok(run.plant.machine(id),st.id+' works '+id);
  const o=prompts.find(o=>o.name==='Ferry: '+st.title);assert.ok(o,'a prompt for '+st.id);assert.equal(o.userData.hit.label,stationLabel(run.plant,st));
 }
 assert.ok(!FERRY_INSPECT.some(p=>p.id==='booth-desk'));
 const stand=PLANT_STATIONS.find(s=>s.id==='stand-mainP'),o=prompts.find(o=>o.name==='Ferry: '+stand.title);
 assert.match(o.userData.hit.label,/Port main engine · running/);
 // The player stops it (alongside she may be stopped); the prompt and the console's label follow after refreshPlant.
 assert.ok(run.plant.stop('mainP').ok);run.refreshPlant();assert.match(o.userData.hit.label,/stopped/);
 const console_=PLANT_STATIONS.find(s=>s.id==='console');assert.match(stationLabel(run.plant,console_),/on the board|alarm/);
});

test('a station’s menu offers only what the machine can do now, and every refusal is the chief’s reason',()=>{
 const p=createPlant({minutes:FERRY_DAY.inService});p.routine(FERRY_DAY.inService);p.tick(1);
 const st=id=>PLANT_STATIONS.find(s=>s.id===id);
 let m=stationMenu(p,st('stand-mainP'));assert.deepEqual(m.items.map(i=>i.label),['Stop Port main engine','Start '+p.machine('prime-mainP').name,...(p.serviceOf('prime-mainP')?['Put '+p.machine('prime-mainP').name+' on standby']:[]),'Isolate '+p.machine('prime-mainP').name+' · tag out']);
 p.setUnderway(true);const r=m.items[0].act();assert.equal(r.ok,false);assert.match(r.why,/under way/);p.setUnderway(false);
 assert.ok(m.items[0].act().ok);m=stationMenu(p,st('stand-mainP'));assert.ok(m.items.some(i=>i.label==='Start Port main engine'));assert.ok(m.items.some(i=>i.label==='Isolate Port main engine · tag out'));
 // The overhaul order: isolate, open, box up, return to service.
 assert.ok(m.items.find(i=>i.label==='Isolate Port main engine · tag out').act().ok);m=stationMenu(p,st('stand-mainP'));assert.ok(m.items.some(i=>i.label==='Open Port main engine for overhaul'));
 assert.ok(m.items.find(i=>i.label==='Open Port main engine for overhaul').act().ok);m=stationMenu(p,st('stand-mainP'));assert.equal(m.items.find(i=>/Port main engine/.test(i.label)).label,'Box up Port main engine');
 assert.match(m.line,/opened for overhaul/);
 // A generator's panel has its breaker; the console changes over every pair with a standby aboard.
 m=stationMenu(p,st('panel-gen1'));assert.deepEqual(m.items.map(i=>i.label),['Stop Generator No.1','Open breaker']);
 m=stationMenu(p,st('console'));assert.match(m.line,/1 generator on the board/);assert.ok(m.items.length>=5,'change-overs: '+m.items.length);assert.ok(m.items.every(i=>/^Change over /.test(i.label)));
 const fw=m.items.find(i=>/fresh water/.test(i.label));assert.ok(fw.act().ok);assert.equal(p.dutyOf('Fresh water'),'hp2');
});

test('every live plate reads a number or the alarm list from the plant, and the model redraws them when the plant changes',()=>{
 const {run}=boot(FERRY_DAY.inService+5);
 const live=FERRY_INTERIOR.plates.filter(p=>p.live);assert.ok(live.length>=30,live.length+' live plates');
 const r=run.plant.readings();
 for(const pl of live){const v=liveValue(r,pl.live);if(pl.live==='alarms'){assert.ok(Array.isArray(v));for(const a of v)assert.ok(PLANT_ALARMS.includes(a),a);}else if(pl.live==='readout'){assert.equal(v.length,4);assert.match(v[0],/PORT \d+ rpm/);assert.match(v[1],/STBD \d+ rpm/);assert.match(v[2],/GEN ON BOARD|SHORE/);assert.match(v[3],/SERVICE TANK/);}else assert.ok(typeof v==='number'&&v>=0&&v<=1,pl.live+' = '+v);}
 for(const pl of live)if(pl.kind==='dial')assert.ok(pl.range&&pl.range[1]>pl.range[0],pl.name+' has a numbered scale');
 assert.deepEqual(FERRY_INTERIOR.plates.find(p=>p.kind==='alarms').lines,PLANT_ALARMS,'the matrix names the plant’s alarms');
 const f=run.ferry;assert.equal(f.userData.livePlates.length,live.length);
 assert.equal(f.userData.readPlant(run.plant.readings()),0,'nothing to redraw while nothing changed');
 assert.ok(run.plant.stop('mainP').ok);assert.ok(f.userData.readPlant(run.plant.readings())>=6,'the port engine’s dials fall');
});

// Hidden engine-room plates are painted just before their first upload (render/canvas-release.js); paint them to measure.
test('no plate’s lettering is stretched: every canvas has its plate’s own proportions',()=>{
 const {run}=boot(FERRY_DAY.inService+5);let n=0;const bad=[];
 run.ferry.traverse(o=>{if(!o.userData.plate||o.userData.plate==='chequer'||o.userData.plate==='grating')return;n++;paintBack(o.material.map);const img=o.material.map.image,g=o.geometry.parameters;const pw=g.width??g.radius*2,ph=g.height??g.radius*2;const r=(img.width/img.height)/(pw/ph);if(Math.abs(r-1)>.02)bad.push(o.name+' '+r.toFixed(2));});
 assert.ok(n>150,n+' plates');assert.deepEqual(bad,[]);
});
