import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {realTownMinutes,townCalendarAt,townClockLineAt} from '../src/town-clock.js';
import {RESIDENTS} from '../src/people/residents.js';
import {residentPlan} from '../src/people/social.js';
import {createCastAI} from '../src/people/schedules.js';
import {sakuraClerkAt,sakuraOpenAt} from '../src/commerce/sakura-rota.js';
import {clinicOpenAt} from '../src/people/clinic-hours.js';
import {canonicalDay} from '../src/people/canonical-day.js';
import {transitStop} from '../src/world/transit.js';
import {MARKET_THRESHOLD} from '../src/world/town-grid.js';

const at=(day,h=12,m=0)=>realTownMinutes(new Date(2026,9,day,h,m));
const thuan=RESIDENTS.find(p=>p.name==='Thuan');

test('the complete title-board script prints the device date, including 29 February',()=>{
 const source=readFileSync(new URL('../landing.js',import.meta.url),'utf8');
 for(const [parts,date,weekday] of [[[2026,9,26,12,0],'26 OCT 2026','Monday'],[[2028,1,29,12,0],'29 FEB 2028','Tuesday']]){
  const instant=new Date(...parts).getTime(),elements=new Map();
  const element=()=>({classList:{contains:()=>false,toggle(){}},setAttribute(){},addEventListener(){},querySelectorAll:()=>[]});
  const document={getElementById:id=>{if(id==='townFeed')return null;if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelector:()=>element(),querySelectorAll:()=>[],addEventListener(){}};
  class DeviceDate extends Date{constructor(...args){super(...(args.length?args:[instant]));}static now(){return instant;}}
  runInNewContext(source,{Date:DeviceDate,document,window:{},localStorage:{getItem:()=>null},setInterval(){},console:{warn(){}}});
  assert.equal(elements.get('boardDateShort').textContent,date);
  assert.equal(elements.get('statusWeekday').textContent,weekday);
  assert.equal(elements.get('boardWeekdayLine').textContent,weekday.toUpperCase());
  assert.match(elements.get('clockChoiceNote').textContent,/device's time, date and weekday/);
 }
});

function commuter(phase='away',saved={}){
 const g=new THREE.Group();g.userData.name='Thuan';g.position.set(...[transitStop().exit[0],0,transitStop().exit[1]]);
 const world={people:[{g,profile:thuan}],ferry:{phase,boarding:false}};
 const state={residentLocations:saved};
 const ai=createCastAI({world,player:{position:new THREE.Vector3()},state:()=>state,paused:()=>false,collides:()=>false});
 return {g,world,ai};
}

test('26 October 2026 is Monday for every gameplay calendar consumer',()=>{
 const m=at(26),date=townCalendarAt(m);
 assert.equal(date.weekday,1);assert.equal(date.date.getFullYear(),2026);
 assert.match(townClockLineAt(m),/^12:00 · Monday,? 26 October 2026$/);
 assert.equal(sakuraClerkAt(m),'Thuan');assert.equal(residentPlan(thuan,m).place,'market');
 assert.equal(clinicOpenAt(at(26,10)),true);
 assert.equal(canonicalDay('Riku',at(26,10)).school,true);
});

test('the actual weekend controls Sakura, the clinic and school',()=>{
 assert.equal(sakuraOpenAt(at(24)),false,'Saturday is Sakura’s closed day');
 assert.equal(sakuraClerkAt(at(25)),'Nhung','Sunday has the relief clerk');
 assert.equal(clinicOpenAt(at(24,10)),true);assert.equal(clinicOpenAt(at(24,14)),false);
 assert.equal(clinicOpenAt(at(25,10)),false);
 for(const day of [24,25])assert.notEqual(canonicalDay('Riku',at(day,10)).school,true);
});

test('Thuan’s actual street body is absent on a weekend, including a saved terminal position',()=>{
 for(const day of [24,25])for(const phase of ['away','waiting']){
  const {g,ai}=commuter(phase,{Thuan:{place:'bus',indoors:'bus',position:[...transitStop().exit]}});
  for(let i=0;i<3;i++)ai.update(1/60,at(day),false);
  assert.equal(g.visible,false,`day ${day}, ferry ${phase}: no terminal stand-in`);
  assert.equal(g.userData.place,'away');assert.match(g.userData.activity,/Kitano-jima/);
 }
});

test('the Monday boat brings the same Thuan actor back, then she resumes her shop routine',()=>{
 const {g,world,ai}=commuter();
 ai.update(1/60,at(25),false);assert.equal(g.visible,false);
 ai.update(1/60,at(26,8,35),false);assert.equal(g.visible,false,'no arrival before the boat');
 world.ferry.phase='waiting';
 ai.update(1/60,at(26,8,35),false);assert.equal(g.visible,true);assert.equal(g.userData.place,'bus');
 assert.ok(Math.hypot(g.position.x-transitStop().arrival[0],g.position.z-transitStop().arrival[1])<.1);
 g.position.set(MARKET_THRESHOLD[0],0,MARKET_THRESHOLD[1]);
 ai.update(1/60,at(26,9,20),false);
 assert.equal(g.userData.place,'market');assert.equal(g.userData.indoors,'market');
 assert.equal(world.people.length,1);assert.equal(world.people[0].g,g);
});

test('local calendar dates survive timezone, midnight, DST, leap-day and year changes',()=>{
 const module=new URL('../src/town-clock.js',import.meta.url).href;
 const script=`import assert from 'node:assert/strict';import {realTownMinutes,townCalendar,townCalendarAt,clockCatchUp,startingMinutes} from ${JSON.stringify(module)};
 for(const parts of [[2026,9,26,0,0],[2026,9,26,23,59],[2026,2,29,1,59],[2026,2,29,3,1],[2026,9,25,3,1],[2028,1,29,12,0],[2026,11,31,23,59],[2027,0,1,0,0]]){
  const now=new Date(...parts),m=realTownMinutes(now),date=townCalendarAt(m).date;
  assert.deepEqual([date.getFullYear(),date.getMonth(),date.getDate(),date.getDay(),date.getHours(),date.getMinutes()],[now.getFullYear(),now.getMonth(),now.getDate(),now.getDay(),now.getHours(),now.getMinutes()]);
  assert.equal(townCalendar(now).weekday,now.getDay());
  assert.deepEqual(clockCatchUp(m-90,now),{start:m-90,fastForward:90});
  assert.equal(startingMinutes({start:'saved',speed:1},m,now),m,'Existing civil-minute saves need no migration');
 }
 const edge=realTownMinutes(new Date(2026,11,31,23,59))+1;
 assert.equal(townCalendarAt(edge).date.getFullYear(),2027);assert.equal(townCalendarAt(edge).date.getDate(),1);`;
 for(const TZ of ['UTC','Europe/Stockholm','America/Los_Angeles','Asia/Tokyo','Pacific/Kiritimati']){
  const result=spawnSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,TZ},encoding:'utf8'});
  assert.equal(result.status,0,TZ+': '+result.stderr);
 }
});
