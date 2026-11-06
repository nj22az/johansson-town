import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlant,PLANT_ALARMS} from '../src/world/ferry-plant.js';
import {FERRY_PIPING,FERRY_SERVICES} from '../src/world/ferry-piping.js';
import {FERRY_DAY} from '../src/world/ferry-ship.js';

test('the plant knows every engine, every motor-driven pump and compressor of the diagrams, and the duty/standby pairs',()=>{
 const p=createPlant();
 for(const id of ['mainP','mainS','gen1','gen2'])assert.ok(p.machine(id),id);
 for(const s of FERRY_PIPING)for(const n of s.nodes)if(n.drive==='motor')assert.ok(p.machine(n.id),'a machine for '+s.id+'/'+n.id);
 for(const sv of FERRY_SERVICES){const s=FERRY_PIPING.find(x=>x.id===sv.system);for(const id of [sv.duty,sv.standby]){const n=s.nodes.find(n=>n.id===id);if(n.drive==='motor')assert.ok(p.machine(id),sv.service+': '+id);}}
 assert.ok(p.machines.size>30);
});

test('a chief’s rules: no start without air, oil pressure, fuel and cooling; no stop under way; the last generator’s breaker blacks her out and the emergency generator comes on',()=>{
 const p=createPlant({minutes:6*60});
 // Cold ship: nothing runs, the board is dead (no shore power yet): no pump, no priming, so no main engine.
 assert.equal(p.start('bp').ok,false,'a pump needs the board');
 assert.match(p.start('mainP').why,/Prime/);assert.match(p.start('prime-mainP').why,/switchboard is dead/);
 // Generators: start (on air), breaker, then the board is live; the thruster interlock.
 assert.equal(p.closeBreaker('gen1').ok,false);assert.ok(p.start('gen1').ok);assert.ok(p.closeBreaker('gen1').ok);assert.ok(p.readings().board.live);
 assert.ok(p.start('prime-mainP').ok);assert.ok(p.start('mainP').ok);
 assert.equal(p.start('mainP').ok,false,'already running');
 p.setUnderway(true);assert.match(p.stop('mainP').why,/under way/);p.setUnderway(false);assert.ok(p.stop('mainP').ok);
 assert.match(p.start('thruster').why,/two generators/);assert.ok(p.start('gen2').ok&&p.closeBreaker('gen2').ok);assert.ok(p.start('thruster').ok);
 assert.ok(p.start('bp').ok,'a pump on a live board');
 // Shore power is interlocked with the generators.
 assert.match(p.shore(true).why,/interlocked/);
 // Open the breakers one by one: the last one blacks her out, the pumps stop, the emergency generator is on load within 45 s.
 assert.ok(p.openBreaker('gen2').ok);assert.ok(p.readings().board.live);assert.ok(p.openBreaker('gen1').ok);
 const r=p.readings();assert.equal(r.board.live,false);assert.equal(p.machine('bp').state,'stopped','the bilge pump stopped in the blackout');assert.equal(p.machine('thruster').state,'stopped');
 p.tick(1);assert.ok(p.readings().board.emergency,'the emergency generator on load');assert.ok(p.readings().alarms.includes('EG RUN'));
 // The quick-closing valve stops every engine.
 assert.ok(p.closeBreaker('gen1').ok);assert.ok(p.valve('qcv',false).ok);assert.equal(p.machine('gen1').state,'stopped');assert.match(p.start('gen1').why,/quick-closing/);
});

test('standby takes over, change-over swaps the duty, isolation and overhaul follow the tag-out order',()=>{
 const p=createPlant({minutes:FERRY_DAY.generators});p.routine(FERRY_DAY.generators);p.tick(1);
 assert.ok(p.readings().board.live,'the crew’s routine put No.1 on the board');
 assert.equal(p.machine('hp1').state,'running');assert.equal(p.machine('hp2').state,'standby');
 assert.ok(p.stop('hp1').ok);assert.equal(p.machine('hp2').state,'running','the standby pump started by itself');
 assert.ok(p.stop('hp2').ok);assert.ok(p.standby('hp1').ok&&p.standby('hp2').ok);
 assert.ok(p.changeOver('Fresh water').ok);assert.equal(p.dutyOf('Fresh water'),'hp2');assert.equal(p.machine('hp2').state,'standby');
 // Overhaul: stop, isolate, open; it cannot start opened; box up, tag off.
 assert.match(p.open('fp2').why,/Isolate/);assert.ok(p.isolate('fp2').ok);assert.ok(p.open('fp2').ok);assert.match(p.start('fp2').why,/overhaul/);
 assert.ok(p.close('fp2').ok);assert.ok(p.isolate('fp2',false).ok);assert.equal(p.machine('fp2').state,'stopped');
 // A running pump cannot be isolated.
 assert.ok(p.start('fp1').ok);assert.match(p.isolate('fp1').why,/Stop/);
});

test('time passes: the compressor cuts in at 25 bar and out at 30, the hydrophore keeps its band, the engines warm up, the fuel-level alarm comes before the tank runs dry',()=>{
 const p=createPlant({minutes:FERRY_DAY.generators});p.routine(FERRY_DAY.generators);p.tick(1);
 for(let i=0;i<6;i++){p.start('prime-mainP');p.start('mainP');p.stop('mainP');}             // six starts drain a bottle
 const air0=p.readings().air[0];assert.ok(air0<=25,'air after six starts: '+air0);
 p.tick(1);assert.equal(p.machine('c1').state,'running','compressor No.1 cut in');p.tick(20);assert.equal(p.machine('c1').state,'standby','and out again at 30 bar');assert.ok(p.readings().air[0]>=29);
 const fw=p.readings().fwPressure;p.tick(30);assert.ok(p.readings().fwPressure>=.24&&p.readings().fwPressure<=.38,'the pressure tank stays in its band: '+p.readings().fwPressure);
 p.start('prime-mainP');p.start('mainP');p.tick(30);assert.ok(p.readings().temps.mainP>70,'warm');assert.equal(p.readings().engines.mainP.loPress,.55);
 p.setTelegraph('mainP','FULL AHEAD');p.tick(60*8);assert.ok(p.readings().alarms.includes('FUEL LEVEL'),'the service tank wants topping up after a day at full ahead');assert.ok(p.readings().service>0&&p.machine('mainP').state==='running','not yet dry');
 p.start('tp1');p.tick(30);assert.ok(!p.readings().alarms.includes('FUEL LEVEL'),'the transfer pump filled it');
 for(const a of p.readings().alarms)assert.ok(PLANT_ALARMS.includes(a),a);
 assert.equal(p.readings().sound,'idle');
});

test('the crew’s day: generators at 6:10, engines for the first boat, shore power after the last; a machine the player handled stays as left until the routine touches it',()=>{
 const p=createPlant({minutes:5*60});p.routine(5*60);assert.ok(p.readings().board.live&&p.readings().board.shore,'at five in the morning she is on shore power');
 p.routine(FERRY_DAY.generators);assert.ok(p.readings().board.live&&p.machine('gen1').state==='running');
 p.routine(FERRY_DAY.inService);assert.equal(p.machine('mainP').state,'running');assert.equal(p.readings().sound,'idle');
 assert.ok(p.stop('mainP').ok);p.routine(FERRY_DAY.inService+30);assert.equal(p.machine('mainP').state,'stopped','the player stopped it: the routine leaves it');
 p.routine(FERRY_DAY.shorePower);assert.ok(p.readings().board.shore);assert.equal(p.machine('gen1').state,'stopped');assert.equal(p.readings().sound,'off');
});
