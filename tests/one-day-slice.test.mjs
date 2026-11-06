import test from 'node:test';
import assert from 'node:assert/strict';
import {recordMoment,momentsOn,restoreDiary,diaryPage} from '../src/progression/diary.js';
import {eveningNews,newsOn,restoreNews,QUIET_NEWS,NEWS_ITEMS} from '../src/feed/evening-news.js';

const DAY=1440;

test('a moment can say who it is about and carry its own news line; an id records a step once',()=>{
 const state={},m=DAY*20+600;
 recordMoment(state,m,{text:'I took Nhung her satchel.',kind:'friend',who:['Emi','Nhung'],news:'Nhung has her satchel back.',id:'favour:emi-satchel:done'});
 recordMoment(state,m+5,{text:'Different words, same step.',kind:'friend',id:'favour:emi-satchel:done'});
 const [moment,...rest]=momentsOn(state,20);
 assert.equal(rest.length,0,'the same step twice');
 assert.deepEqual(moment.who,['Emi','Nhung']);assert.equal(moment.news,'Nhung has her satchel back.');
 // Readers get a copy: changing it does not change the record.
 moment.who.push('X');assert.deepEqual(momentsOn(state,20)[0].who,['Emi','Nhung']);
 // The diary still reads the first-person text, not the news.
 assert.match(diaryPage(state,m),/I took Nhung her satchel\./);
});

test('old saves load, and new fields survive a save but are bounded',()=>{
 const old=restoreDiary({moments:{5:[{text:'Old moment',kind:'note',weight:1}]}});
 assert.deepEqual(old.moments[5],[{text:'Old moment',kind:'note',weight:1}]);
 const fresh=restoreDiary(JSON.parse(JSON.stringify({moments:{6:[{text:'x',kind:'friend',weight:4,who:['A','B','C','D','E',7],news:'n'.repeat(400),id:'i'}]}})));
 assert.deepEqual(fresh.moments[6][0].who,['A','B','C','D']);assert.equal(fresh.moments[6][0].news.length,280);assert.equal(fresh.moments[6][0].id,'i');
});

test('the evening news: from six, the day’s news lines heaviest first, at most three',()=>{
 const state={},m=DAY*30+19*60;
 assert.equal(newsOn(DAY*30+17*60+59),false);assert.equal(newsOn(m),true);
 recordMoment(state,m,{text:'a',kind:'note',news:'Small item.'});
 recordMoment(state,m,{text:'b',kind:'happening',news:'Big item.'});
 recordMoment(state,m,{text:'c',kind:'friend',news:'Middle item.'});
 recordMoment(state,m,{text:'d',kind:'gift',news:'Fourth item.'});
 recordMoment(state,m,{text:'not news',kind:'happening'});
 const n=eveningNews(state,m);
 assert.deepEqual(n.items,['Big item.','Middle item.','Fourth item.']);assert.equal(n.items.length,NEWS_ITEMS);
 assert.equal(n.quiet,false);assert.match(n.text,/^Good evening\. This is the Minato Evening News for \w+day \d+ \w+\./);
 assert.match(n.text,/Goodnight from Minato\.$/);
});

test('quiet days: one item, the same all evening, and none repeats until all are used',()=>{
 const state={},seen=[];
 for(let d=0;d<QUIET_NEWS.length;d++){
  const a=eveningNews(state,DAY*(100+d)+19*60),b=eveningNews(state,DAY*(100+d)+23*60);
  assert.equal(a.quiet,true);assert.deepEqual(a.items,b.items,'the same evening changed its news');
  seen.push(a.items[0]);
 }
 assert.equal(new Set(seen).size,QUIET_NEWS.length,'a quiet item repeated before all were used');
 const restored=restoreNews(JSON.parse(JSON.stringify(state.news)));
 assert.deepEqual(restored.days,state.news.days);
 assert.deepEqual(restoreNews({days:{1:'made up'},quiet:['nope']}),{days:{},quiet:[]});
});

import {sendLetter,postRound,restorePost,ensurePost,dueBy,ROUND} from '../src/mail/post.js';
import {MAILBOX_SIZE} from '../src/mail/letters.js';
const senders={Emi:{name:'Emi',temper:'easy',favourite:'Plum rice ball',clue:'Thuan has postcards by the biscuits.'}};
const senderOf=n=>senders[n]||null;

test('the post: a letter comes with Tōma’s 10:30 round on its day, once, written when it arrives',()=>{
 const state={},day=40;
 assert.ok(sendLetter(state,{id:'helped:emi-satchel',day,occasion:'helped',from:'Emi'}));
 assert.equal(sendLetter(state,{id:'helped:emi-satchel',day,occasion:'helped',from:'Emi'}),false,'sent twice');
 assert.deepEqual(postRound(state,DAY*day+ROUND-1,{senderOf}),[],'before the round');
 assert.equal(dueBy(day,DAY*day+ROUND),true);assert.equal(dueBy(day,DAY*(day-1)+23*60),false);
 const [letter]=postRound(state,DAY*day+ROUND,{senderOf,playerName:'Johansson'});
 assert.equal(letter.from,'Emi');assert.equal(letter.gift,'Plum rice ball');assert.equal(letter.ps,'P.S. Thuan has postcards by the biscuits.');
 assert.deepEqual(postRound(state,DAY*day+ROUND+60,{senderOf}),[],'delivered twice');
 assert.equal(sendLetter(state,{id:'helped:emi-satchel',day:day+3,occasion:'helped',from:'Emi'}),false,'the same letter after it was delivered');
 // A second letter from her does not repeat the clue.
 sendLetter(state,{id:'thanks:emi:41',day:41,occasion:'thanks',from:'Emi'});
 const [second]=postRound(state,DAY*41+ROUND,{senderOf});
 assert.notEqual(second.ps,letter.ps);assert.match(second.ps,/^P\.S\. /);
 // A sender the town no longer knows: the letter is dropped, not kept forever.
 sendLetter(state,{id:'x',day,occasion:'missed',from:'Nobody'});assert.deepEqual(postRound(state,DAY*(day+1),{senderOf}),[]);
 assert.equal(ensurePost(state).pending.length,0);
});

test('the post: a full box of unread letters makes the next one wait, not vanish; a save keeps it all',()=>{
 const state={};
 for(let d=0;d<MAILBOX_SIZE;d++)sendLetter(state,{id:'m'+d,day:d,occasion:'missed',from:'Emi'});
 sendLetter(state,{id:'late',day:5,occasion:'missed',from:'Emi'});
 postRound(state,DAY*20,{senderOf});
 const post=ensurePost(state);
 // Earlier days first, so the newest letter is the one that waits.
 assert.equal(post.box.length,MAILBOX_SIZE);assert.deepEqual(post.pending.map(p=>p.id),['m9']);
 post.box[0].read=true;postRound(state,DAY*20+1,{senderOf});
 assert.ok(post.box.some(l=>l.id==='m9'));assert.equal(post.pending.length,0);
 const restored=restorePost(JSON.parse(JSON.stringify(post)));
 assert.equal(restored.box.length,MAILBOX_SIZE);assert.deepEqual(restored.sent,post.sent);
 assert.deepEqual(restorePost({pending:[{id:'a',day:1,occasion:'bogus',from:'Emi'},{id:'b',day:1.5,occasion:'missed',from:'Emi'}]}).pending,[]);
});

import {FAVOURS,planFavours,favourWaiting,clueFor,errandUnderWay,favourLine,askFavour,replyFavour,favourExpire,favourVisit,restoreFavours,restoreFavourErrand} from '../src/people/favours.js';
import {RESIDENTS} from '../src/people/residents.js';
import {PROFILES} from '../src/people/profiles.js';
import {EXPRESSION_NAMES} from '../src/avatars/face.js';
import {lintLine} from '../src/dialogue/markup.js';

test('every favour is between residents who are really in the town, and its lines are clean',()=>{
 const active=RESIDENTS.map(r=>r.name);
 for(const f of FAVOURS){
  assert.ok(active.includes(f.from)&&active.includes(f.to),`${f.id}: ${f.from} → ${f.to} must both be active residents`);
  assert.ok(f.why.length>=2,'a favour says why it exists');
  // Nobody who is not in the game is named: not in its lines, its letter, its thanks or its news.
  const words=[...Object.values(f.lines),f.letter,f.thanks,...Object.values(f.moments).map(m=>m.text+' '+(m.news||''))].join(' ');
  for(const p of PROFILES)if(!active.includes(p.name))assert.ok(!new RegExp('\\b'+p.name+'\\b').test(words),`${f.id} names ${p.name}, who is not in the town`);
  for(const [step,line] of Object.entries(f.lines)){
   assert.deepEqual(lintLine(line,{name:'Johansson',speaker:f.from}),[],`${f.id}/${step}`);
   for(const [,face] of line.matchAll(/\{face:([a-z]+)\}/g))assert.ok(EXPRESSION_NAMES.includes(face),`${f.id}/${step}: ${face}`);
  }
 }
});

const postFavourLetter=(state,minutes)=>{for(const {replaces,...l} of planFavours(state,minutes)){const post=ensurePost(state);post.pending=post.pending.filter(p=>!p.id.startsWith(replaces));sendLetter(state,l);}};

test('the favour from the letter to the thanks: asked, accepted, the wrong person, handed over',()=>{
 const state={},morning=DAY*50+9*60;
 const [letter]=planFavours(state,morning);
 assert.equal(letter.day,50);assert.equal(letter.from,'Nhung');assert.equal(letter.occasion,'favour');assert.equal(letter.id,'favour:nhung-cookbook:50');
 assert.deepEqual(planFavours(state,morning+60),[],'planned once');
 sendLetter(state,letter);
 assert.equal(favourWaiting(state,'Nhung',morning),null,'no "!" before her letter has come');
 postRound(state,DAY*50+ROUND,{senderOf:n=>({name:n,temper:'easy'})});
 assert.equal(favourWaiting(state,'Thao',DAY*50+ROUND),null);assert.equal(favourWaiting(state,'Nhung',DAY*50+ROUND).id,'nhung-cookbook');
 const f=FAVOURS[0],e=askFavour(state,f,{minutes:morning,temper:'easy'});
 assert.equal(favourWaiting(state,'Nhung',DAY*50+ROUND),null,'no card once asked');
 assert.match(favourLine(f,e,'ask',{speaker:'Nhung'}).text,/dashi omelette/);
 const yes=replyFavour(state,true);
 assert.equal(yes.step,'accepted');assert.deepEqual(yes.moment.who,['Nhung','Thao']);assert.equal(yes.moment.news,undefined,'an errand begun is not news');
 assert.equal(favourVisit(state,'Mrs Sato',{minutes:morning+30}).step,'wrongPerson');
 assert.match(favourLine(f,e,'wrongPerson',{speaker:'Mrs Sato',temper:'dramatic'}).text,/Thao/);
 assert.equal(favourVisit(state,'Nhung',{minutes:morning+40}).step,'checkIn');
 assert.equal(favourVisit(state,'Nhung',{minutes:morning+45}),null,'she mentions it once a day, then talks about other things');
 const done=favourVisit(state,'Thao',{minutes:DAY*50+17*60});
 assert.equal(done.step,'handOver');assert.equal(done.done,true);assert.match(done.moment.news,/cookery book/);
 assert.match(favourLine(f,e,'handOver',{speaker:'Thao'}).text,/My sister sent this/);
 assert.equal(favourVisit(state,'Nhung',{minutes:DAY*51+600}).step,'done');assert.equal(favourVisit(state,'Nhung',{minutes:DAY*51+610}),null);
 assert.doesNotMatch(favourLine(f,e,'done',{speaker:'Nhung'}).text,/\?/,'her thanks is not a question: the letter may have come first');
 assert.equal(state.favours['nhung-cookbook'].status,'done');
 const saved=JSON.parse(JSON.stringify(state));
 assert.deepEqual(restoreFavours(saved.favours),state.favours);assert.equal(restoreFavourErrand(saved.errand).favour,'nhung-cookbook');
});

test('a favour he never took up is asked again, its old letter replaced, and in the end lets go',()=>{
 const state={};
 postFavourLetter(state,DAY*10+16*60+42);
 assert.equal(state.favours['nhung-cookbook'].day,11,'too late in the day: tomorrow');
 // He comes back four days later: the old letter must not arrive as if it were today's.
 postFavourLetter(state,DAY*14+9*60);
 const post=ensurePost(state);
 assert.deepEqual(post.pending.map(p=>p.id),['favour:nhung-cookbook:14'],'the stale letter is replaced');
 assert.equal(state.favours['nhung-cookbook'].tries,2);
 postFavourLetter(state,DAY*15+9*60);assert.equal(state.favours['nhung-cookbook'].tries,3);
 postFavourLetter(state,DAY*16+9*60);assert.equal(state.favours['nhung-cookbook'].status,'lapsed');
 assert.deepEqual(post.pending.map(p=>p.id),['favour:harbour-timetable:16'],'when one lets go, the next in the calendar comes');
 // An ask he closed without answering goes back to be asked another day.
 const asked={};postFavourLetter(asked,DAY*30+9*60);askFavour(asked,FAVOURS[0],{minutes:DAY*30+11*60,temper:'easy'});
 assert.equal(favourExpire(asked,DAY*31+9*60),null);assert.equal(asked.errand,null);
 postFavourLetter(asked,DAY*31+9*60);assert.equal(asked.favours['nhung-cookbook'].day,31);assert.equal(asked.favours['nhung-cookbook'].status,'planned');
});

test('a missed day ends it kindly: a moment, and the book goes back when he sees her',()=>{
 const state={},m=DAY*70+10*60;planFavours(state,m);askFavour(state,FAVOURS[0],{minutes:m,temper:'easy'});replyFavour(state,true);
 assert.equal(favourExpire(state,m+60),null);
 const ended=favourExpire(state,DAY*71+8*60);
 assert.match(ended.moment.text,/day ran out\.$/);assert.equal(ended.item,undefined,'the book stays in the bag until he sees her');
 assert.equal(favourVisit(state,'Thao',{minutes:DAY*71+9*60}),null,'too late to hand over');
 const late=favourVisit(state,'Nhung',{minutes:DAY*71+9*60});
 assert.equal(late.step,'late');assert.equal(late.item,'Cookery book');assert.equal(favourVisit(state,'Nhung',{minutes:DAY*71+9*60+5}),null);
});

test('crafted saves cannot reach Object’s own methods through a letter or a favour',()=>{
 assert.deepEqual(restorePost({box:[{id:'x',occasion:'toString',from:'Emi',day:1}],pending:[{id:'y',day:1,occasion:'constructor',from:'Emi'}]}),{box:[],pending:[],sent:[]});
 assert.equal(sendLetter({},{id:'z',day:1,occasion:'toString',from:'Emi'}),false);
 assert.deepEqual(restoreFavours(JSON.parse('{"__proto__":{"day":1,"status":"done"}}')),{});
});

import {lettersForReturn} from '../src/mail/post.js';
test('back after a week or more: the closest friends write, at most two, never strangers',()=>{
 const friendship={Nhung:{points:40},'Mrs Sato':{points:12},Chin:{points:9},Thao:{points:60}};
 assert.deepEqual(lettersForReturn({friendship,daysAway:6,day:9}),[],'six days is not long');
 const letters=lettersForReturn({friendship,daysAway:8,day:9});
 assert.deepEqual(letters.map(l=>l.from),['Thao','Nhung'],'the closest two');
 assert.deepEqual(letters[0],{id:'missed:Thao:9',day:9,occasion:'missed',from:'Thao'});
 assert.deepEqual(lettersForReturn({friendship:{Chin:{points:9}},daysAway:30,day:9}),[],'no friends, no letters');
 const state={};for(const l of letters)sendLetter(state,l);
 const delivered=postRound(state,DAY*9+ROUND,{senderOf:n=>({name:n,temper:'dramatic'})});
 assert.deepEqual(delivered.map(l=>l.occasion),['missed','missed']);
});

import {letterLabel,OCCASIONS as OCC} from '../src/mail/letters.js';
test('every letter says what it is about on its envelope',()=>{
 for(const [k,o] of Object.entries(OCC))assert.ok(o.subject,k);
 assert.equal(letterLabel({from:'Nhung',occasion:'favour',read:false}),'Nhung · a favour to ask · new');
 assert.equal(letterLabel({from:'Thao',occasion:'missed',read:true}),'Thao · where have you been?');
});

import {printable as enginePrintable,createDialogue} from '../src/dialogue/dialogue-engine.js';
import {SAKURA_SCRIPT} from '../src/dialogue/sakura-script.js';
test('Thuan’s scripted beats reach the box, and her script can use the line cues',()=>{
 // A line from her real script: three beats where the ||| is.
 const line=Object.values(SAKURA_SCRIPT).flatMap(n=>Array.isArray(n.text)?n.text:[n.text]).find(t=>/\|\|\|/.test(t));
 assert.ok(line,'her script has a long beat');
 const r=enginePrintable(line,'Johansson');assert.ok(!r.text.includes('|'));assert.deepEqual(Object.values(r.pauses),[3]);
 assert.ok(!/  /.test(r.text),'a beat between spaces leaves one space: '+r.text);
 const d=createDialogue({script:{a:{name:'Thuan',text:['{face:shy}Oh.{p:2} It is you, &.']}},playerName:'Johansson'});
 const v=d.start('a');
 assert.equal(v.text,'Oh. It is you, Johansson.');assert.deepEqual(v.pauses,{3:2});assert.deepEqual(v.faces,[{at:0,face:'shy'}]);
});

import {TYPHOONS_1997,typhoonAt,typhoonOnDay,typhoonTomorrow,typhoonBulletin,typhoonPostDay} from '../src/world/typhoons.js';
import {townDate} from '../src/town-clock.js';
import {tomorrowItems} from '../src/feed/evening-news.js';
// A town minute on a given 1997 date and time (the town's calendar is the real date in 1997).
const onDate=(key,hhmm)=>{const [h,mi]=hhmm.split(':').map(Number);let m=Math.floor(Date.now()/60000);m=Math.floor(m/1440)*1440;for(let k=0;k<800;k++){const t=m-k*1440;if(townDate(t).key===key)return t+h*60+mi;}throw Error('no date '+key);};

test('typhoon days are 1997’s real approaches to Okinawa, with their own hours',()=>{
 assert.deepEqual(TYPHOONS_1997.map(t=>t.number),[4,8,11,13]);
 for(const t of TYPHOONS_1997){assert.ok(t.from<=t.closest.at&&t.closest.at<=t.to,`${t.number}: closest inside its window`);assert.ok(t.closest.km<=300);}
 assert.equal(typhoonAt(onDate('08-17','02:59')),null,'before the warning');
 assert.equal(typhoonAt(onDate('08-17','15:00')).number,13);
 assert.equal(typhoonAt(onDate('08-18','03:30')),null,'lifted after the last fix');
 assert.equal(typhoonOnDay(onDate('08-06','09:00')).number,11);
 assert.equal(typhoonTomorrow(onDate('08-16','19:00')).number,13);
 assert.match(typhoonBulletin(TYPHOONS_1997[3],onDate('08-17','10:00')).text,/expected to come closest at 3 in the afternoon on 17 August/);
 assert.match(typhoonBulletin(TYPHOONS_1997[3],onDate('08-17','17:00')).text,/came closest at 3 in the afternoon on 17 August.*moving away/s);
 assert.doesNotMatch(JSON.stringify(TYPHOONS_1997)+typhoonBulletin(TYPHOONS_1997[0],onDate('05-29','10:00')).text,/ferry/i,'nothing about the ferry: the town does not stop it');
});

test('the news looks ahead: tomorrow’s festival, and a typhoon on its way when the weather follows the town',()=>{
 assert.deepEqual(tomorrowItems(onDate('10-11','19:00')),['Tomorrow: the town tug-of-war, from 3 o’clock in the afternoon.']);
 assert.ok(tomorrowItems(onDate('08-16','19:00')).includes('The weather: Typhoon No. 13 is expected to come near Okinawa tomorrow.'));
 assert.ok(!tomorrowItems(onDate('08-16','19:00'),{weather:false}).some(t=>/Typhoon/.test(t)),'a fixed weather is not contradicted');
 assert.ok(tomorrowItems(onDate('08-16','19:00')).some(t=>/Ukui/.test(t)),'the eisa night is announced');
 const state={},n=eveningNews(state,onDate('10-11','19:00'));
 assert.equal(n.quiet,true);assert.equal(n.items.at(-1),'Tomorrow: the town tug-of-war, from 3 o’clock in the afternoon.');
});

test('a friend’s typhoon letter comes with the first morning post the warning covers',()=>{
 const round=10*60+30,byNumber=Object.fromEntries(TYPHOONS_1997.map(t=>[t.number,typhoonPostDay(t,round)]));
 // Tina's warning began at three in the afternoon, after the round: her letter comes the next morning.
 assert.deepEqual(byNumber,{4:'05-29',8:'06-27',11:'08-07',13:'08-17'});
 assert.equal(typhoonPostDay({from:'09-01 12:00',to:'09-01 20:00'},round),null,'a warning between two rounds brings no letter');
});

test('the favour calendar: one a day, in order, one on at a time, and only between people who are there',()=>{
 const state={},m=d=>DAY*d+9*60;
 assert.deepEqual(planFavours(state,m(200)).map(l=>l.id),['favour:nhung-cookbook:200']);
 assert.deepEqual(planFavours(state,m(200)+30),[],'one on at a time');
 askFavour(state,FAVOURS[0],{minutes:m(200)+120,temper:'easy'});replyFavour(state,false);
 assert.equal(state.favours['nhung-cookbook'].status,'declined');assert.equal(state.errand.status,'declined','the finished errand stays, as in the game');
 assert.deepEqual(planFavours(state,m(200)+180).map(l=>l.id),['favour:harbour-timetable:201'],'never two on the same day: the next is for tomorrow');
 assert.deepEqual(planFavours(state,m(201)),[],'and is not planned twice');
 state.favours['harbour-timetable'].status='done';
 assert.deepEqual(planFavours(state,DAY*202+13*60).map(l=>[l.id,l.day]),[['favour:nhung-rain-book:203',203]],'after noon: the book is asked for tomorrow morning');
 state.favours['nhung-rain-book'].status='done';assert.deepEqual(planFavours(state,m(204)),[],'the calendar has run out');
 // Each favour is a real errand between active residents, asked while the asker is at work and done before the
 // other has gone home (profiles.json hours), with the words for every step it uses.
 const hours=Object.fromEntries(PROFILES.map(p=>[p.name,[p.start,p.close]]));
 for(const f of FAVOURS){
  for(const who of [f.from,f.to])assert.ok(RESIDENTS.some(r=>r.name===who),f.id+': '+who+' walks the town');
  assert.ok(f.askBy>=ROUND&&f.askBy<hours[f.from][1],f.id+': asked after the post and before '+f.from+' goes off');
  for(const step of ['ask','accepted','checkIn',f.kind==='return'?'handBack':'handOver','done','late'])assert.ok(f.lines[step],f.id+' says '+step);
  for(const step of ['accepted','declined','done','late'])assert.ok(f.moments[step]?.text,f.id+' remembers '+step);
  assert.ok(f.moments.done.news&&f.thanks&&f.letter&&f.why.length>=2,f.id+' is news, has a thank-you, a letter and its reasons');
 }
});

test('a favour to get something back: the holder hands it over, the asker gets it, the town remembers',()=>{
 const state={},m=DAY*300+9*60,f=FAVOURS.find(x=>x.kind==='return');
 state.favours={'nhung-cookbook':{day:298,status:'done',tries:1},'harbour-timetable':{day:299,status:'done',tries:1}};
 assert.deepEqual(planFavours(state,m).map(l=>l.id),['favour:'+f.id+':300']);
 const e=askFavour(state,f,{minutes:m+90,temper:'easy'});replyFavour(state,true);
 assert.equal(e.carrying,false,'nothing in his hands yet');
 assert.equal(favourVisit(state,f.from,{minutes:m+100}).step,'checkIn');
 assert.equal(favourVisit(state,f.to,{minutes:m+120,bagFull:true}).step,'pocketsFull');
 const back=favourVisit(state,f.to,{minutes:m+130});assert.equal(back.step,'handBack');assert.equal(e.carrying,true);
 assert.match(favourLine(f,e,'handBack',{speaker:f.to}).text,/Chapter six/);
 const done=favourVisit(state,f.from,{minutes:m+300});
 assert.equal(done.step,'done');assert.equal(done.done,true);assert.match(done.moment.news,/Front-Row Books/);
 assert.equal(state.favours[f.id].status,'done');
});

test('a finished favour never stops the next one, and a favour is only asked while it can still be done',()=>{
 const state={post:{box:[],pending:[],sent:[]}},m=(d,h=9,mm=0)=>DAY*d+h*60+mm;
 const send=d=>{for(const {replaces,...l} of planFavours(state,m(d)))state.post.sent.push(l.id);};
 send(400);askFavour(state,FAVOURS[0],{minutes:m(400,11),temper:'easy'});replyFavour(state,false);
 assert.equal(errandUnderWay(state),false,'a declined favour is not under way');
 send(401);const timetable=FAVOURS.find(f=>f.id==='harbour-timetable');
 assert.equal(favourWaiting(state,'Harbour master',m(401,11))?.id,'harbour-timetable','the next asker can ask: nothing is left blocking him');
 assert.equal(favourWaiting(state,'Harbour master',m(401,14)),null,'not after he has gone off');
 const e=askFavour(state,timetable,{minutes:m(401,11),temper:'easy'});
 assert.equal(favourExpire(state,m(401,13,50)),null);assert.equal(state.errand,null,'an ask left unanswered past its hour goes back');
 assert.equal(state.favours['harbour-timetable'].status,'asked');
 send(402);assert.equal(state.favours['harbour-timetable'].tries,2,'and is asked again the next day');
 const f2=askFavour(state,timetable,{minutes:m(402,11),temper:'easy'});replyFavour(state,true);
 assert.match(favourLine(timetable,f2,'checkIn',{speaker:'Harbour master',minutes:m(402,19)}).text,/gone by now/,'after six he does not send you to Sato Ramen');
 assert.match(favourLine(timetable,f2,'checkIn',{speaker:'Harbour master',minutes:m(402,12)}).text,/Sato Ramen/);
 const book=FAVOURS.find(f=>f.kind==='return');
 assert.match(clueFor('Nhung','A rain-stained book is drying at the harbour office.',state),/drying/);
 state.favours[book.id]={day:1,status:'done',tries:1};
 assert.doesNotMatch(clueFor('Nhung','A rain-stained book is drying at the harbour office.',state),/drying/,'once it is home her clue says so');
 for(const f of FAVOURS)assert.ok(f.askUntil>f.askBy&&f.askUntil<=hoursOf(f.from)[1],f.id+' is asked only while '+f.from+' is at work');
});
const hoursOf=name=>{const p=PROFILES.find(p=>p.name===name);return [p.start,p.close];};
