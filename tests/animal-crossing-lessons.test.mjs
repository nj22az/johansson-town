import test from 'node:test';
import assert from 'node:assert/strict';
import {renderLine,lintLine,faceAt,POOLS} from '../src/dialogue/markup.js';
import {composeLetter,deliver,openLetter,restoreMail,rateLetter,letterText,stationerySvg,STATIONERY,OCCASIONS,TEMPERS,MAILBOX_SIZE} from '../src/mail/letters.js';
import {greetingFor,SITUATIONS,daysBetween} from '../src/people/greetings.js';
import {offerErrand,answer,visit,expire,errandLine,restoreErrand,DAY} from '../src/people/errands.js';
import {EXPRESSION_NAMES} from '../src/avatars/face.js';
import {printable} from '../src/dialogue/dialogue-engine.js';

test('markup: pauses, faces, emphasis and fill-ins land where they were written',()=>{
 const r=renderLine('{face:happy}Hi,{p} {name}!{p:3} {big}Look{/big} at {me}.',{name:'Johansson',speaker:'Emi'});
 assert.equal(r.text,'Hi, Johansson! Look at Emi.');
 assert.deepEqual(r.pauses,{3:1,14:3});
 assert.deepEqual(r.faces,[{at:0,face:'happy'}]);
 assert.deepEqual(r.spans,[{from:15,to:19,style:'big'}]);
 assert.equal(faceAt(r.faces,10),'happy');
 // The engine's own marks keep working, and agree with dialogue-engine.js.
 assert.deepEqual(renderLine('A|b & c',{name:'J'}),{...renderLine('A|b & c',{name:'J'}),text:printable('A|b & c','J').text,pauses:printable('A|b & c','J').pauses});
 assert.deepEqual(renderLine('x {nope} y').unknown,['{nope}']);
});

test('markup: a pool pick is fixed by its seed and always comes from the pool',()=>{
 const a=renderLine('I want {pool:food}.',{seed:7}).text,b=renderLine('I want {pool:food}.',{seed:7}).text;
 assert.equal(a,b);
 assert.ok(POOLS.food.some(f=>a==='I want '+f+'.'));
 const seen=new Set(Array.from({length:40},(_,i)=>renderLine('{pool:food}',{seed:i}).text));
 assert.ok(seen.size>3,'the seed should spread across the pool');
 assert.deepEqual(lintLine('Fine line.'),[]);
 assert.ok(lintLine('x'.repeat(130)).includes('a long line with no pause'));
});

const sender=(temper,extra={})=>({name:'Emi',temper,favourite:'Ramune soda',...extra});

test('letters: every temperament and occasion composes, the same way every time',()=>{
 for(const occasion of Object.keys(OCCASIONS))for(const temper of TEMPERS){
  const a=composeLetter({occasion,sender:sender(temper),day:40,playerName:'Johansson',place:'the tailor’s'});
  const b=composeLetter({occasion,sender:sender(temper),day:40,playerName:'Johansson',place:'the tailor’s'});
  assert.deepEqual(a,b);
  const text=letterText(a);
  assert.ok(!/[{}|&]/.test(text),`stray markup in ${occasion}/${temper}: ${text}`);
  assert.ok(text.includes('Emi'));
  assert.equal(a.stationery,Object.keys(STATIONERY).find(k=>STATIONERY[k].by===temper));
  assert.equal(a.gift,OCCASIONS[occasion].gift?'Ramune soda':null,'only a thank-you encloses a present');
 }
});

test('letters fit the fiction: nobody writes to the mayor as a newcomer',()=>{
 const all=JSON.stringify(OCCASIONS);
 for(const word of ['newcomer','newly of','new face','someone new','Welcome to'])assert.ok(!all.includes(word),word);
 // A favour needs somewhere to call, or its own words; a thank-you for help may come empty-handed.
 assert.equal(composeLetter({occasion:'favour',sender:sender('easy'),day:1}),null);
 assert.match(letterText(composeLetter({occasion:'favour',sender:sender('easy'),day:1,place:'the tailor’s'})),/the tailor’s/);
 const own=composeLetter({occasion:'favour',sender:sender('easy'),day:1,body:'I finished {me}’s thing. Come by?',id:'favour:x'});
 assert.equal(own.body,'I finished Emi’s thing. Come by?');assert.equal(own.id,'favour:x');
 assert.equal(composeLetter({occasion:'helped',sender:{name:'X',temper:'dry'},day:2}).gift,null);
});

test('letters: a P.S. points somewhere real when the sender has a clue; a thank-you needs a present',()=>{
 const l=composeLetter({occasion:'missed',sender:sender('dry',{clue:'Yoshiko knows how to save wet pages.'}),day:3});
 assert.equal(l.ps,'P.S. Yoshiko knows how to save wet pages.');
 assert.equal(composeLetter({occasion:'thanks',sender:{name:'X',temper:'easy'},day:1}),null);
 assert.equal(composeLetter({occasion:'nope',sender:sender('easy'),day:1}),null);
});

test('mailbox: ten letters, never twice, read ones make way, unread ones are kept',()=>{
 const box=[];
 for(let d=0;d<MAILBOX_SIZE;d++)assert.ok(deliver(box,composeLetter({occasion:'missed',sender:sender('sunny'),day:d})));
 assert.equal(deliver(box,composeLetter({occasion:'missed',sender:sender('sunny'),day:0})),false,'the same letter twice');
 assert.equal(deliver(box,composeLetter({occasion:'missed',sender:sender('sunny'),day:99})),false,'a full box of unread letters');
 const first=box[0].id;openLetter(box,first);
 assert.ok(deliver(box,composeLetter({occasion:'missed',sender:sender('sunny'),day:99})));
 assert.ok(!box.some(l=>l.id===first));assert.equal(box.length,MAILBOX_SIZE);
 const t=composeLetter({occasion:'thanks',sender:sender('easy'),day:5});const b2=[];deliver(b2,t);
 assert.equal(openLetter(b2,t.id).present,'Ramune soda');assert.equal(openLetter(b2,t.id).present,null,'the present comes once');
 const restored=restoreMail([...box,{id:1},{id:'x',occasion:'bogus',from:'a',day:1}]);
 assert.equal(restored.length,MAILBOX_SIZE);
});

test('letters: rating a letter Johansson wrote',()=>{
 assert.equal(rateLetter('Dear Emi,\nThank you for the ramune. It was perfect on the sea wall.\nSee you at the bench soon!\nJohansson',{to:'Emi'}).score,4);
 assert.equal(rateLetter('asdfghjkl qwrtzxcvb',{to:'Emi'}).score,0);
 const shout=rateLetter('DEAR EMI THANK YOU FOR THE RAMUNE IT WAS GREAT. SEE YOU SOON OK. JOHANSSON',{to:'Emi'});
 assert.ok(shout.notes.includes('shouting'));assert.ok(shout.score<=2);
});

test('stationery: every paper draws as a sheet of SVG',()=>{
 for(const id of Object.keys(STATIONERY)){
  const svg=stationerySvg(id,300,400);
  assert.match(svg,/^<svg [^>]*viewBox="0 0 300 400"/);assert.ok(svg.endsWith('</svg>'));
  assert.ok(!/NaN|undefined/.test(svg),id);
 }
});

test('greetings: the most specific true situation wins, and every face is one the town can draw',()=>{
 const g=s=>greetingFor({speaker:'Emi',temper:'sunny',situation:s,day:2}).id;
 assert.equal(g({}),'usual');
 assert.equal(g({weather:'rain'}),'rain');
 assert.equal(g({weather:'rain',daysAway:8}),'away7');
 assert.equal(g({daysAway:40}),'away30');
 assert.equal(g({theirBirthday:true,daysAway:40}),'birthday');
 assert.ok(!SITUATIONS.some(x=>x.id==='first'),'nobody meets the mayor for the first time');
 assert.equal(g({hour:23}),'late');
 assert.equal(daysBetween(Date.UTC(2026,0,1),Date.UTC(2026,0,8,5)),7);
 for(const s of SITUATIONS)for(const t of ['sunny','dramatic','easy','dry'])for(const line of s.lines[t]){
  for(const [,face] of line.matchAll(/\{face:([a-z]+)\}/g))assert.ok(EXPRESSION_NAMES.includes(face),`${s.id}/${t}: ${face}`);
  const r=greetingFor({speaker:'Emi',temper:t,situation:{},day:0});
  assert.deepEqual(r.unknown,[]);
 }
 // No catchphrase: no dangling space.
 for(let day=0;day<6;day++)assert.ok(!/\s$/.test(greetingFor({speaker:'Kenta',temper:'sunny',day}).text));
});

test('errands: a delivery from ask to thank-you, with the wrong neighbour on the way',()=>{
 const m=DAY*12+600;
 const e=offerErrand({kind:'deliver',from:'Emi',temper:'sunny',item:'a sanshin string',to:'Kenta',minutes:m});
 assert.match(errandLine(e,'ask').text,/a sanshin string to Kenta/);
 assert.equal(answer(e,true).moment,'Emi asked Johansson to take a sanshin string to Kenta.');
 assert.equal(visit(e,'Yui',{minutes:m+5}).step,'wrongPerson');
 assert.equal(visit(e,'Emi',{minutes:m+6}).step,'checkIn');
 const handed=visit(e,'Kenta',{minutes:m+20});
 assert.equal(handed.step,'handOver');assert.equal(handed.done,true);assert.equal(handed.reward,200);assert.equal(e.status,'done');
 assert.match(handed.moment,/Johansson helped Emi/);
 assert.equal(visit(e,'Emi',{minutes:m+40}).step,'done','the asker says thank you');
 assert.equal(visit(e,'Emi',{minutes:m+50}),null,'and only once');
 assert.equal(errandLine(e,'handOver',{speaker:'Kenta'}).text.includes('Emi'),true);
});

test('errands: a return waits for room in the bag, and a missed day ends it kindly',()=>{
 const m=DAY*3+500;
 const e=offerErrand({kind:'return',from:'Mr Tanabe',temper:'dry',item:'an umbrella',to:'Hiroshi',minutes:m});answer(e,true);
 assert.equal(visit(e,'Hiroshi',{minutes:m+1,bagFull:true}).step,'pocketsFull');
 assert.equal(visit(e,'Hiroshi',{minutes:m+2}).step,'handBack');
 assert.equal(visit(e,'Mr Tanabe',{minutes:m+3}).step,'done');
 const f=offerErrand({kind:'fetch',from:'Yui',temper:'easy',item:'a Blue Coral ice cream',place:'Blue Coral',minutes:m});answer(f,true);
 assert.equal(expire(f,m+10),null);
 const late=visit(f,'Yui',{minutes:m+DAY});
 assert.equal(late.step,'late');assert.match(late.moment,/the day ran out/);
 assert.deepEqual(restoreErrand(JSON.parse(JSON.stringify(f))),{...f,handed:false,thanked:false});
 assert.equal(restoreErrand({kind:'steal'}),null);
 assert.equal(offerErrand({kind:'deliver',from:'A',item:'x',minutes:0}),null,'a delivery needs someone to deliver to');
});

test('errands: every line of every kind renders without stray markup or unknown faces',()=>{
 for(const kind of ['deliver','fetch','return'])for(const temper of ['sunny','dramatic','easy','dry']){
  const e=offerErrand({kind,from:'Emi',temper,item:'a ramune',to:'Kenta',place:'Sakura Shōten',minutes:0});
  for(const step of ['ask','accepted','declined','checkIn','handOver','handBack','done','late','pocketsFull','wrongPerson']){
   const r=errandLine(e,step);assert.deepEqual(r.unknown,[]);assert.ok(!/[{}]/.test(r.text),`${kind}/${temper}/${step}`);
   for(const f of r.faces)assert.ok(EXPRESSION_NAMES.includes(f.face),f.face);
  }
 }
});
