import test from 'node:test';
import assert from 'node:assert/strict';
import {FUJITA_DAY,bottlesFor,fujitaBeer,laughingAt,tvProgramme} from '../src/world/fujita-day.js';
import {FERRY_WORKING_DAY} from '../src/people/ferry-crew.js';

test('Mr Fujita gets through three to six bottles an evening, after he signs off, and the days differ', () => {
 const n=Array.from({length:400},(_,d)=>bottlesFor(d));
 assert.ok(n.every(v=>v>=3&&v<=6));
 assert.ok(Math.min(...n)===3&&Math.max(...n)===6,'the whole range turns up');
 // The master (people/ferry-crew.js) is sober on watch: the first bottle is poured when he signs off, never earlier.
 assert.equal(FUJITA_DAY.start,FERRY_WORKING_DAY.signOff);
 // After midnight the evening goes on until the set goes off at a quarter to one; then he sleeps until six, when he signs on and stands the empties back in the crate.
 for(let m=FUJITA_DAY.end-1440;m<FUJITA_DAY.start;m+=5){const b=fujitaBeer(1440+m);assert.ok(b.phase==='doze'&&m<FUJITA_DAY.collect||b.phase==='waiting',`sober at ${m}`);if(m>=FUJITA_DAY.collect)assert.equal(b.tipsy,0);}
});

test('the empties pile up all day, go back in the crate at six, and every bottle is accounted for', () => {
 const day=10,n=bottlesFor(day);let last=-1,pours=0,wasPouring=false;
 // The evening's day runs from six, when the empties go back in the crate, to the next six, past midnight.
 for(let m=day*1440+FUJITA_DAY.collect;m<(day+1)*1440+FUJITA_DAY.collect;m+=.02){
  const b=fujitaBeer(m),t=((m%1440)+1440)%1440;
  assert.ok(b.glass>=0&&b.glass<=1);
  {   // the whole evening's day, past midnight
   assert.equal(b.full+b.empties+(b.bottle===null?0:1),n,`bottles at ${t.toFixed(2)}`);
   assert.ok(b.empties>=last,'the pile never shrinks during the day');last=b.empties;
  }
  if(b.phase==='pour'&&!wasPouring)pours++;wasPouring=b.phase==='pour';
 }
 assert.equal(last,n,'every bottle is on the floor by the end of the day');
 assert.equal(pours,n*FUJITA_DAY.glassesPerBottle,'three glasses a bottle');
 assert.equal(fujitaBeer(day*1440+6*60+15).empties,0,'back in the crate at six');
 assert.equal(fujitaBeer((day+1)*1440+3*60).empties,n,'he sleeps among them');
});

test('he empties a glass before he pours the next, and pours without a dry bottle', () => {
 const day=3;let prev=null;
 for(let m=day*1440+FUJITA_DAY.start;m<day*1440+FUJITA_DAY.end;m+=.01){
  const b=fujitaBeer(m);
  if(prev&&prev.phase==='drink'&&b.phase==='pour')assert.ok(prev.glass<.02,'the glass was empty');
  if(b.phase==='pour')assert.ok(b.bottle!==null,'a bottle in his hand while he pours');
  prev=b;
 }
});

test('he flips channels in the evening, the baseball news before midnight, the set off on watch and at night', () => {
 assert.equal(tvProgramme(3*60),'off');
 assert.notEqual(tvProgramme(23*60+45),'off','on after he signs off from the last boat');
 assert.equal(tvProgramme(1440+50),'off','off after a quarter to one');
 for(let m=FUJITA_DAY.collect;m<FUJITA_DAY.start;m+=7)assert.equal(tvProgramme(m),'off',`on watch at ${m}`);
 const seen=new Set();let flips=0,last='';
 for(let day=0;day<30;day++)for(let m=FUJITA_DAY.start;m<FUJITA_DAY.signOff;m+=1){const c=tvProgramme(day*1440+m);seen.add(c);if(c!==last)flips++;last=c;
  if(c==='baseball')assert.ok(m<24*60+12,`baseball at ${m}`);}   // a stay begun before midnight may run twelve minutes past it
 assert.ok(flips>200,'several channel changes an evening');
 for(const c of ['variety','drama','cooking','baseball','news'])assert.ok(seen.has(c),c);
 assert.equal(tvProgramme(FUJITA_DAY.signOff+2),'snow');
});

test('he laughs now and then, never at a dark set', () => {
 let laughs=0,was=false;
 for(let s=0;s<24*3600;s+=.5){const l=laughingAt(s/60);if(l&&!was)laughs++;was=l;if(l)assert.notEqual(tvProgramme(s/60),'off');}
 assert.ok(laughs>10&&laughs<300,`${laughs} laughs`);
});
