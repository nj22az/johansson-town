// Phase 2 of the consolidation (docs/CAST-CONSOLIDATION.md §9, §12 C, §13): the eight ship posts and the shore roles are
// held by the roster's people, one actor to a station, with the reliefs the brief names and nobody doing two jobs at once.
import test from 'node:test';
import assert from 'node:assert/strict';
import {FERRY_CREW,FERRY_SHORE,FERRY_RELIEF,FERRY_WATCH,FERRY_PEOPLE,FERRY_WORKING_DAY,crewFor,bosunFor,rotaWeek,onWatch} from '../src/people/ferry-crew.js';
import {SHIP_POSTS,SHORE_ROLES,ROSTER,identityOf} from '../src/people/roster.js';
import {CAST,castMember,liveNameFor,PLACES} from '../src/people/cast.js';
import {FERRY_MANNING,FERRY_DAY} from '../src/world/ferry-ship.js';
import {CANONICAL_REST} from '../src/people/canonical-rest.js';
import {SAKURA_STAFF,sakuraClerkAt} from '../src/commerce/sakura-rota.js';
import {residentPlan} from '../src/people/social.js';
import {RESIDENTS} from '../src/people/residents.js';
import {canonicalDay} from '../src/people/canonical-day.js';
import {FUJITA_DAY,fujitaBeer,tvProgramme} from '../src/world/fujita-day.js';
import {KITANO_HAND_DAY} from '../src/people/ferry-shore-crew.js';

const DAY=1440;
test('all eight posts are held by the roster’s holders, under the names the live cast uses, with nobody in two of them',()=>{
 assert.deepEqual(FERRY_CREW.map(c=>c.post),FERRY_MANNING.map(m=>m.post));
 for(const p of SHIP_POSTS){const c=FERRY_CREW.find(c=>c.post===p.key);assert.equal(c.name,liveNameFor(p.holder),p.key);assert.ok(castMember(c.name),c.name+' is a person of the cast');}
 assert.deepEqual(FERRY_CREW.map(c=>c.post+':'+c.name),['master:Mr Fujita','mate:Ryo','chief:Johansson','oiler:Chin','bosun:Ms Uezu','deck:Ren','purser:Aya','cook:Jun']);
 assert.equal(FERRY_CREW.find(c=>c.post==='oiler').title,'Motorman');assert.equal(crewFor('motorman'),'Chin');
 assert.equal(new Set(FERRY_CREW.map(c=>c.name)).size,8);
 assert.equal(FERRY_RELIEF.chief.name,'Mac');assert.equal(FERRY_RELIEF.bosun.name,'Kōji');
 for(const c of FERRY_CREW){assert.ok(c.why.length>80,c.name+' has a biography');assert.ok(c.lives.length>10,c.name+' lives somewhere');}
 // The five who were job roles are people now, drawn and named, each in exactly one place: the ship or the Kitano pier.
 for(const [old,now] of [['Chief officer','Ryo'],['Deck hand','Ren'],['Purser','Aya'],['Cook-steward','Jun'],['Kitano line hand','Kai']]){
  assert.ok(!FERRY_CREW.some(c=>c.name===old)&&!FERRY_SHORE.some(s=>s.name===old),old+' is no longer a body');
  assert.equal(castMember(old)?.name,now);assert.ok(castMember(now).supporting);
 }
 // The Nakamura family retired on 31 October 2026; all eight ship posts remain unchanged.
 assert.equal(ROSTER.length,23);assert.equal(new Set(ROSTER.map(p=>p.name)).size,23,'23 unique display names');
});

test('the shore roles: Jack holds the berth and Minato’s lines, Kai the Kitano lines, Mika the tickets; Tetsu is contract, never crew; Mac the relief',()=>{
 for(const r of SHORE_ROLES){const s=FERRY_SHORE.find(s=>s.post===r.key);assert.equal(s.name,liveNameFor(r.holder),r.key);assert.equal(s.title,r.title);}
 assert.equal(crewFor('linesman'),'Harbour master');assert.equal(crewFor('port'),'Harbour master');assert.equal(identityOf('Harbour master').id,'jack');
 assert.equal(crewFor('airport-linesman'),'Kai');assert.equal(crewFor('tickets'),'Ms Ganaha');assert.equal(crewFor('relief-engineer'),'Mac');
 assert.equal(crewFor('electrician'),'Tetsuo');assert.ok(!FERRY_CREW.some(c=>c.name==='Tetsuo'),'Tetsuo is not sailing crew');
 for(const ashore of ['Ms Ganaha','Mrs Sato','Harbour master','Tetsuo','Mr Fujita'===null])if(ashore)assert.ok(!FERRY_CREW.some(c=>c.name===ashore)||ashore==='Mr Fujita',ashore+' stays ashore');
 assert.ok(FERRY_SHORE.find(s=>s.post==='linesman').why.includes('Jack Reed'));assert.ok(FERRY_SHORE.find(s=>s.post==='relief-engineer').why.includes('Mac Turner'));
 assert.ok(FERRY_SHORE.find(s=>s.post==='airport-linesman').why.includes('Shiroma'));
 assert.ok(FERRY_PEOPLE.every(name=>castMember(name)),'everyone the ship signs on is in the cast');
});

test('Chin is the motorman: aboard through the ship’s day, no Sakura clerk, till or stock duties anywhere',()=>{
 assert.equal(identityOf('chin').post,'oiler');assert.equal(crewFor('oiler'),'Chin');
 assert.ok(!SAKURA_STAFF.includes('Chin'));assert.ok(!PLACES.sakura.keepers.includes('Chin'));
 for(let m=0;m<14*DAY;m+=5)assert.notEqual(sakuraClerkAt(m),'Chin','no Sakura shift at '+m);
 // A plain weekday (day 10; the first days of the year have their happenings, which are stories, not shifts).
 const chin=RESIDENTS.find(p=>p.name==='Chin');
 for(let m=10*DAY;m<11*DAY;m+=5){const plan=residentPlan(chin,m,false,{});if(onWatch(m))assert.equal(plan.place,'ferry','aboard at '+m);assert.notEqual(plan.place,'market','never at the counter: '+m);}
 assert.equal(castMember('Chin').work,'ferry');assert.ok(PLACES.workshop.keepers.includes('Chin')&&PLACES.workshop.keepers.includes('Tetsuo'),'the workshop stays his and Tetsuo’s');
});

test('the bosun rota: the deck hand post is never vacant, and Kōji is never fishing and aboard at the same time',()=>{
 for(let m=0;m<21*DAY;m+=15){
  assert.equal(crewFor('deck',m),'Ren','the deck hand at '+m);
  const bosun=crewFor('bosun',m);assert.ok(['Ms Uezu','Kōji'].includes(bosun));assert.equal(bosun,bosunFor(m));
  if(bosun==='Kōji'&&onWatch(m))assert.equal(canonicalDay('Kōji',m).place,'ferry','Kōji aboard, not at the boats, at '+m);
  if(bosun==='Kōji'&&onWatch(m))assert.notEqual(canonicalDay('Ms Uezu',m).place,'ferry','her week off');
 }
 assert.equal(rotaWeek(0),0);assert.equal(rotaWeek(7*DAY),1);assert.equal(rotaWeek(14*DAY),0);
 // On his own weeks his fisherman's day is his: the auction at half past four, home to sleep at noon.
 assert.equal(canonicalDay('Kōji',4*60+40).place,'fish-auction');assert.equal(canonicalDay('Kōji',7*DAY+4*60+40).place,'home','a late start before his relief day');
 assert.ok(CANONICAL_REST['Kōji'],'his early night stands on his own weeks');
 // The relief covers the whole working day, which is the ship's (06:10 generators to 22:15 shore power).
 assert.equal(FERRY_WORKING_DAY.signOn,FERRY_DAY.generators-5);assert.equal(FERRY_WORKING_DAY.signOff,FERRY_DAY.shorePower+5);
 assert.equal(onWatch(FERRY_WORKING_DAY.signOn),true);assert.equal(onWatch(FERRY_WORKING_DAY.signOff),false);assert.equal(onWatch(3*60),false);
});

test('one actor, one station: every watch of every phase gives each post a place (distinct spots: ferry-crew-aboard.test); the master is sober on all of them',()=>{
 for(const [phase,watch] of Object.entries(FERRY_WATCH)){
  if(phase!=='night')for(const {post} of FERRY_MANNING)assert.ok(watch[post],phase+' has the '+post);
  // The deck's two mooring stations and the bridge's two are always separate posts; the shore end is the shore hand's.
  if(/arriving|reversing|swinging/.test(phase)){assert.notEqual(watch.deck[0],watch.bosun[0]);assert.notEqual(watch.master[0],watch.mate[0]);assert.equal(watch.linesman[0],'quay');}
 }
 assert.equal(FUJITA_DAY.start,FERRY_WORKING_DAY.signOff,'the first bottle is poured when he signs off');
 for(let m=FUJITA_DAY.collect;m<FUJITA_DAY.start;m+=3){assert.equal(fujitaBeer(m).tipsy,0,'sober at '+m);assert.equal(tvProgramme(m),'off');}
 assert.equal(KITANO_HAND_DAY.home,22*60+50,'Kai goes home once the last boat has left Kitano-jima (22:45)');
 // Nobody holds a shift the roster retired: the former master and the former oiler have no post, no ferry day and no body (phase 4).
 for(const name of ['Bus driver','Mr Higa Jr']){assert.ok(!FERRY_PEOPLE.includes(name),name);assert.equal(castMember(name),null,name+' has no body');}
 // Riku is nine: no freight work in anybody's day or place.
 const riku=CAST.find(p=>p.name==='Riku');assert.ok(!riku.day.some(([,,doing])=>/freight|cargo|depot|crate/i.test(doing)));
});
