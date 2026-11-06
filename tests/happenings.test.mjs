import test from 'node:test';
import assert from 'node:assert/strict';
import {realTownMinutes,townDate,okinawaSeason,timeBand,townDay} from '../src/town-clock.js';
import {HAPPENINGS,happeningsOn,happeningPlan,happeningLine,happeningOutcome} from '../src/people/happenings.js';
import {tomorrowItems} from '../src/feed/evening-news.js';
import {residentPlan} from '../src/people/social.js';
import {RESIDENTS} from '../src/people/residents.js';

/** Explicit historical dates for the authored festival stories; no calendar remapping. */
const on=(month,day,h=12,m=0)=>realTownMinutes(new Date(1997,month-1,day,h,m));
const who=name=>RESIDENTS.find(p=>p.name===name);

test('the calendar: 1997 dates and weekdays, Okinawa’s seasons, the parts of the day',()=>{
 const sunday=on(10,5,15);
 assert.deepEqual(townDate(sunday),{month:10,day:5,weekday:0,key:'10-05'},'5 October 1997 was a Sunday');
 assert.equal(townDay(on(10,6))-townDay(on(10,5)),1);
 assert.equal(okinawaSeason(on(5,20)),'rainy');assert.equal(okinawaSeason(on(8,1)),'summer');assert.equal(okinawaSeason(on(1,10)),'winter');
 assert.deepEqual([6,12,17,20,23].map(h=>timeBand(on(10,5,h))),['morning','midday','afternoon','evening','night']);
});

test('every happening is well formed and names only people who exist',()=>{
 const ids=new Set();
 for(const h of HAPPENINGS){
  assert.ok(!ids.has(h.id),h.id+' twice');ids.add(h.id);
  assert.ok(h.title&&h.on&&Array.isArray(h.hours),h.id);
  for(const name of [...Object.keys(h.cast||{}),...Object.keys(h.lines||{})])assert.ok(who(name),h.id+': '+name+' is not a resident');
  for(const [name,spot] of Object.entries(h.cast||{})){const s=typeof spot==='function'?spot(who(name)):spot;assert.ok(Array.isArray(s.target)&&s.target.every(Number.isFinite),h.id+' '+name);}
 }
});

test('the Sunday fish auction puts Mrs Sato and the harbour master on the quay, rain or not',()=>{
 const m=on(10,5,9,20);
 assert.ok(happeningsOn(m).some(h=>h.id==='fish-auction'));
 for(const name of ['Mrs Sato','Harbour master']){
  const plan=residentPlan(who(name),m,false,{});assert.equal(plan.happening,'fish-auction');assert.match(plan.activity,/auction/);
  assert.equal(residentPlan(who(name),m,true,{}).happening,'fish-auction','the auction is under the roof');
 }
 assert.equal(happeningPlan(who('Mrs Sato'),on(10,6,9,20)),null,'Monday is not auction day');
});

test('the last night of Obon brings the street out for the eisa, unless it rains',()=>{
 const m=on(8,17,19,50);
 for(const name of ['Thao','Nhung','Tetsuo'])assert.equal(residentPlan(who(name),m,false,{}).happening,'eisa');
 assert.notEqual(residentPlan(who('Tetsuo'),m,true,{}).happening,'eisa');
 assert.equal(residentPlan(who('Chin'),m,false,{}).place,'ferry','the motorman is aboard until the shore power');
 assert.equal(happeningPlan(who('Tetsuo'),on(8,17,23)),null,'only while the drums are out');
});

test('people mention the day all day, once per day each',()=>{
 const line=happeningLine('Thao',on(8,17,9));
 assert.ok(line&&/Obon/.test(line.text));
 assert.notEqual(line.key,happeningLine('Thao',on(8,17,9)+1440*365)?.key,'a different day, a fresh mention');
 assert.equal(happeningLine('Thao',on(8,20,9)),null);
 assert.equal(happeningLine('Chin',on(8,17,9),{rain:true}),null,'nobody talks up the eisa while the rain is calling it off');
 assert.equal(happeningLine('Thao',on(8,15,9),{rain:true})?.id,'obon','Obon is indoors: the rain does not stop it');
});

test('every happening the news reports has its own sentence for how it went, and a dry one for the rain',()=>{
 for(const h of HAPPENINGS.filter(h=>(h.on.date||h.on.dates)&&h.hours[1]>h.hours[0])){
  assert.ok(h.news?.held,h.id+' says how it went');
  if(h.dry)assert.ok(h.news?.off,h.id+' says how the rain called it off');
  for(const said of Object.values(h.news))assert.match(said,/^[A-ZŌ].*\.$/,h.id+' is a whole sentence');
 }
 assert.doesNotMatch(Object.values(HAPPENINGS.find(h=>h.id==='new-year').news).join(' '),/New Year’s Day was called off/,'a day is not called off; what happens on it is');
});

test('a festival is reported as it went: held if its cast went out in a dry moment, off if every check was wet',()=>{
 const eisa=HAPPENINGS.find(h=>h.id==='eisa'),obon=HAPPENINGS.find(h=>h.id==='omisoka');
 assert.equal(happeningOutcome(eisa,1100,{seen:undefined}),null,'not begun');
 assert.equal(happeningOutcome(eisa,1200,{seen:false}),null,'raining now, but it may clear before the end');
 assert.equal(happeningOutcome(eisa,1290,{seen:true}),'held','a dry spell sent the drummers’ crowd out');
 assert.equal(happeningOutcome(eisa,1290,{seen:false}),'off','wet at every check');
 assert.equal(happeningOutcome(eisa,1300,{seen:undefined}),null,'nobody saw it: nothing is claimed');
 assert.equal(happeningOutcome(eisa,1170,{seen:false,typhoonAllHours:true}),'off','a typhoon’s rain over all its hours settles it at once');
 assert.equal(happeningOutcome(obon,1100,{}),'held','an indoor happening is held whatever the weather');
});

test('the news only names residents who are really there, and warns when a typhoon will call a festival off',()=>{
 const names=RESIDENTS.map(r=>r.name);
 for(const h of HAPPENINGS)for(const said of Object.values(h.news||{}))for(const n of names)if(said.includes(n))assert.ok(h.cast?.[n],`${h.id}: ${n} is in its cast`);
 const eve=tomorrowItems(on(8,16,19));
 assert.match(eve[0],/Typhoon No\. 13/);assert.match(eve[1],/eisa .*likely to be called off/);
 assert.doesNotMatch(tomorrowItems(on(8,16,19),{weather:false}).join(' '),/typhoon|Typhoon/i,'a weather the player fixed is not contradicted');
});
