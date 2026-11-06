import test from 'node:test';
import assert from 'node:assert/strict';
import {wantsFor,openWant,talked,gave,heartsFor,heartLine,restoreFriendship,favouriteOf,wantPool,HEART_STEPS} from '../src/people/friendship.js';
import {RESIDENT_PERSONALITIES} from '../src/people/resident-personalities.js';

const names=wantPool(Object.keys(RESIDENT_PERSONALITIES));

test('a day always wants the same things, and a different day different ones',()=>{
 const a=wantsFor(2000,names),b=wantsFor(2000+300,names),c=wantsFor(2000+1440*3,names);
 assert.equal(a.length,3);assert.deepEqual(a,b,'the same day changed its mind');
 assert.notDeepEqual(a.map(w=>w.name+w.item),c.map(w=>w.name+w.item));
 for(const w of a){assert.ok(RESIDENT_PERSONALITIES[w.name]);assert.ok(w.item);assert.ok(w.reward>=100);}
 assert.ok(!a.some(w=>w.name==='Thuan'),'Thuan has her own presents');
});

test('talking counts once a day; presents count more; the want counts most and pays once',()=>{
 const state={},m=5000,[want]=wantsFor(m,names);
 assert.equal(talked(state,want.name,m),2);assert.equal(talked(state,want.name,m+60),0,'talking twice the same day');
 const r=gave(state,want.name,want.item,m,names);
 assert.equal(r.kind,'want');assert.equal(r.yen,want.reward);
 assert.equal(openWant(state,m,names,want.name),null,'the want is still open after it was met');
 const again=gave(state,want.name,want.item,m,names);assert.equal(again.kind,'again');assert.equal(again.yen,0);
 const other=names.find(n=>n!==want.name&&favouriteOf(n));
 // Their favourite counts as a favourite, or as their want when today they want it.
 const open=openWant(state,m,names,other);
 assert.ok(['favourite','want'].includes(gave(state,other,favouriteOf(other),m,names).kind)||open?.item===favouriteOf(other));
});

test('hearts fill at their steps and the save keeps only sane records',()=>{
 assert.equal(heartsFor(0),0);assert.equal(heartsFor(HEART_STEPS[0]),1);assert.equal(heartsFor(999),5);
 assert.equal(heartLine(HEART_STEPS[1]),'♥♥♡♡♡');
 const restored=restoreFriendship({Nhung:{points:42,talkDay:3},bad:{points:'x'},Chin:{points:5000}});
 assert.equal(restored.Nhung.points,42);assert.equal(restored.bad,undefined);assert.equal(restored.Chin.points,999);
});
