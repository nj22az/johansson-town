import test from 'node:test';
import assert from 'node:assert/strict';
import {residentPlan,thuanWeekendAway} from '../src/people/social.js';
import {RESIDENTS,residentHomeDescription} from '../src/people/residents.js';
import {sakuraClerkAt,isWeekend,sakuraOpenAt,SAKURA_STAFF} from '../src/commerce/sakura-rota.js';
import {SUPPLIERS} from '../src/commerce/merchandising.js';
import {NEIGHBOURS} from '../src/people/neighbours.js';
import {KITANO_HAMLET,hamletGate} from '../src/world/kitano-hamlet-layout.js';
import {airportWorld} from '../src/world/airport-ground.js';
import {townCalendarAt} from '../src/town-clock.js';
import {PLACES,castMember} from '../src/people/cast.js';

// Explicit Wednesday 1 January 1997 fixture: Friday is day 2, Saturday 3, Sunday 4, Monday 5.
const firstDay=Date.UTC(1997,0,1)/60000;
const at=(day,minute)=>firstDay+day*1440+minute,profile=name=>RESIDENTS.find(p=>p.name===name);
assert.equal(townCalendarAt(at(2,0)).weekday,5);

test('Thuan spends the weekend at home on Kitano-jima: the Friday 22:00 boat out, the Monday 08:30 boat back',()=>{
 const thuan=profile('Thuan');
 assert.equal(residentPlan(thuan,at(2,1150)).place,'market','Friday afternoon she is at her counter');
 assert.match(residentPlan(thuan,at(2,1300)).activity,/ferry, home to Kitano-jima/);
 for(const [day,minute] of [[2,1330],[3,600],[3,1200],[4,120],[4,1380],[5,300]]){
  const plan=residentPlan(thuan,at(day,minute));
  assert.equal(plan.place,'away',`day ${day} ${minute}`);assert.match(plan.activity,/Kitano-jima with her husband, Johansson/);
 }
 assert.match(residentPlan(thuan,at(5,520)).activity,/arriving on the ferry from Kitano-jima/);
 assert.equal(residentPlan(thuan,at(5,600)).place,'market','Monday she is back at Sakura');
 assert.ok(!thuanWeekendAway(at(1,1400))&&!thuanWeekendAway(at(2,1319)),'Weekdays and Friday before the boat are in town');
 // Her weekday room at 1 Kitahama is gone (addendum 4): on a weekday night she is away, home on Kitano-jima, and back on the morning boat.
 assert.equal(residentPlan(thuan,at(1,1400)).place,'away','On a weekday night she is home on Kitano-jima');assert.match(residentPlan(thuan,at(1,1400)).activity,/Kitano-jima/);
 assert.equal(residentPlan(thuan,at(1,1300)).place,'bus','after the evening she waits for the last boat, never walks to a Kitahama room');
 assert.equal(residentPlan(thuan,at(1,520)).place,'bus');assert.match(residentPlan(thuan,at(1,520)).activity,/arriving/);
 assert.equal(thuan.homeAddress,'Kitano hamlet, Kitano-jima');
});

// Since 22 October 2026 (the owner) Nhung is the island doctor: surgery on Saturday morning, so Sakura shuts on Saturdays.
test('Sakura is Thuan’s outright and keeps shop hours: Thuan on weekdays, shut on Saturday, Nhung on Sunday, nobody at night; Chin, the motorman, never',()=>{
 assert.equal(SUPPLIERS.sakura.owner,'Thuan');assert.deepEqual([...SAKURA_STAFF],['Thuan','Nhung']);assert.deepEqual([...PLACES.sakura.keepers],['Thuan','Nhung']);
 assert.equal(sakuraClerkAt(at(1,600)),'Thuan');assert.equal(sakuraClerkAt(at(4,600)),'Nhung');assert.equal(sakuraClerkAt(at(4,1229)),'Nhung');
 for(let m=0;m<1440;m+=5){assert.equal(sakuraClerkAt(at(3,m)),null,'shut all Saturday: '+m);assert.equal(sakuraOpenAt(at(3,m)),false,'shut all Saturday: '+m);}
 for(const day of [1,4,5]){for(const m of [1230,180,420,539]){assert.equal(sakuraClerkAt(at(day,m)),null,'nobody at the counter at '+m);assert.equal(sakuraOpenAt(at(day,m)),false,'shut at '+m);}assert.equal(sakuraOpenAt(at(day,540)),true);assert.equal(sakuraOpenAt(at(day,1229)),true);}
 for(let m=0;m<1440;m+=5)for(const day of [1,3])assert.notEqual(sakuraClerkAt(at(day,m)),'Grandmother Sakurai','the retired owner keeps no counter at '+m);
 for(let m=0;m<1440;m+=5)for(const day of [1,3])assert.notEqual(sakuraClerkAt(at(day,m)),'Chin','Chin has no Sakura shift at '+m);
 assert.ok(isWeekend(at(3,0))&&isWeekend(at(4,1439))&&!isWeekend(at(5,0)));
 for(const day of [3,4])for(let m=0;m<1440;m+=5)assert.equal(residentPlan(profile('Nhung'),at(day,m)).place==='bookshop',false,'nobody browses at Front-Row: '+m);
 assert.equal(residentPlan(profile('Nhung'),at(3,600)).place,'work','Saturday morning surgery');assert.notEqual(residentPlan(profile('Nhung'),at(3,900)).place,'work','and the afternoon is hers');
 assert.equal(residentPlan(profile('Nhung'),at(4,700)).place,'market','Nhung minds Sakura on Sunday');
 assert.equal(residentPlan(profile('Chin'),at(1,600)).place,'ferry','Chin is aboard as the motorman by day');assert.equal(residentPlan(profile('Chin'),at(1,1300)).place,'ferry');
 assert.notEqual(residentPlan(profile('Chin'),at(1,1400)).place,'ferry','and ashore after he signs off');
});

test('Tetsuo lives in the Front-Row yard and never takes the boat; the Chinen house on Kitano-jima is gone with his mother, the history kept',()=>{
 const tetsuo=profile('Tetsuo');
 assert.equal(tetsuo.homeAddress,'2 Front-Row Yard');
 assert.equal(residentPlan(tetsuo,at(1,720)).place,'ramen');assert.equal(residentPlan(tetsuo,at(1,1100)).place,'work');
 for(let m=0;m<1440;m+=15)assert.notEqual(residentPlan(tetsuo,at(1,m)).place,'away',''+m);
 // Phase 4 (docs/CAST-CONSOLIDATION.md §6, addendum 5): Grandmother Chinen retired and the Chinen house came down; the
 // hamlet is Johansson's house and the Shiroma house (Kai's), and only the family history stays in Tetsuo's own words.
 assert.equal(NEIGHBOURS.find(n=>n.name==='Grandmother Chinen'),undefined,'no body');assert.equal(castMember('Grandmother Chinen'),null);
 assert.deepEqual(KITANO_HAMLET.plots.map(p=>p.id),['kitano-1','kitano-2']);
 for(const p of KITANO_HAMLET.plots){const [x,z]=airportWorld(...hamletGate(p).door);assert.ok(Number.isFinite(x)&&Number.isFinite(z));}
 assert.match(residentHomeDescription('Tetsuo'),/Chinen/);assert.doesNotMatch(residentHomeDescription('Tetsuo'),/5 Kitahama/);
});

test('the airport’s ticket clerk Jun has left the island: the Minato Maru’s tickets are sold at the Port Terminal window',()=>{
 assert.equal(NEIGHBOURS.find(n=>n.name==='Jun'),undefined,'the old clerk is no neighbour');
 // The name belongs to the ferry's cook-steward now (people/roster.js SUPPORTING), who lives aboard, not at the airport.
 assert.equal(castMember('Jun').work,'ferry');assert.equal(castMember('Jun').supporting,true);
 assert.equal(PLACES['airport-tickets'],undefined,'no desk of Jun’s left in the cast’s places');
 assert.ok(PLACES.port.keepers.includes('Ms Ganaha')&&castMember('Ms Ganaha').work==='port','Ms Ganaha sells the tickets at the terminal window');
});
