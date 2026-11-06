import test from 'node:test';
import assert from 'node:assert/strict';
import {writeSave,readSave,rescueSave,SAVE_KEY,PREV_SUFFIX,RESCUE_SUFFIX} from '../src/save.js';

// Never destroy the only good copy (research/mario-artist/report.md §2.5, §7 item 7).
function store({quota=Infinity}={}){
 const m=new Map(),size=()=>[...m.values()].reduce((n,v)=>n+v.length,0);
 return {m,get length(){return m.size;},key:i=>[...m.keys()][i]??null,getItem:k=>m.has(k)?m.get(k):null,removeItem:k=>m.delete(k),
  setItem(k,v){const before=m.get(k);m.set(k,String(v));if(size()>quota){if(before===undefined)m.delete(k);else m.set(k,before);const e=new Error('QuotaExceededError');e.name='QuotaExceededError';throw e;}}};
}

test('each save keeps the one before it, and only one that reads',()=>{
 const s=store();
 assert.equal(writeSave(s,SAVE_KEY,JSON.stringify({yen:100})),true);assert.equal(s.getItem(SAVE_KEY+PREV_SUFFIX),null,'nothing before the first');
 writeSave(s,SAVE_KEY,JSON.stringify({yen:200}));assert.equal(JSON.parse(s.getItem(SAVE_KEY+PREV_SUFFIX)).yen,100);
 s.setItem(SAVE_KEY,'{"yen":');   // something broke the save
 writeSave(s,SAVE_KEY,JSON.stringify({yen:300}));assert.equal(JSON.parse(s.getItem(SAVE_KEY+PREV_SUFFIX)).yen,100,'a save that does not read never becomes the previous copy');
});

test('a save that does not read falls back to the previous copy',()=>{
 const s=store();writeSave(s,SAVE_KEY,JSON.stringify({yen:100,visited:[]}));writeSave(s,SAVE_KEY,JSON.stringify({yen:200,visited:[]}));
 s.setItem(SAVE_KEY,'{"yen":2');
 const read=readSave(s);assert.equal(read.yen,100);assert.equal(read.readFrom,SAVE_KEY+PREV_SUFFIX,'it says which copy it used');
 assert.equal(Object.keys(read).includes('readFrom'),false,'and that is never saved');
 assert.equal(JSON.parse(JSON.stringify(read)).readFrom,undefined);
 s.removeItem(SAVE_KEY);assert.equal(readSave(s).yen,100,'and when it is gone');
 writeSave(s,SAVE_KEY,JSON.stringify({yen:300,visited:[]}));assert.equal(readSave(s).readFrom,SAVE_KEY,'a good save is read from itself');
});

test('when the storage is full the previous copy goes first, never the save',()=>{
 const big=JSON.stringify({yen:1,pad:'x'.repeat(400)}),s=store({quota:900});
 writeSave(s,SAVE_KEY,big);writeSave(s,SAVE_KEY,JSON.stringify({yen:2,pad:'x'.repeat(400)}));
 assert.equal(writeSave(s,SAVE_KEY,JSON.stringify({yen:3,pad:'y'.repeat(420)})),true,'saved by giving up the previous copy');
 assert.equal(JSON.parse(s.getItem(SAVE_KEY)).yen,3);
 const t=store({quota:100});writeSave(t,SAVE_KEY,JSON.stringify({yen:1}));
 assert.equal(writeSave(t,SAVE_KEY,JSON.stringify({yen:2,pad:'z'.repeat(200)})),false,'too big even alone: refused');
 assert.equal(JSON.parse(t.getItem(SAVE_KEY)).yen,1,'and the old save is untouched');
});

test('a save that failed to load is kept once, raw, and never overwritten by the rescue',()=>{
 const s=store();s.setItem(SAVE_KEY,'{"yen":500,"island":"broken"}');
 assert.equal(rescueSave(s,SAVE_KEY),true);assert.equal(s.getItem(SAVE_KEY+RESCUE_SUFFIX),'{"yen":500,"island":"broken"}');
 writeSave(s,SAVE_KEY,JSON.stringify({yen:0}));writeSave(s,SAVE_KEY,JSON.stringify({yen:0}));
 assert.equal(rescueSave(s,SAVE_KEY),false,'the first rescue stays');
 assert.equal(s.getItem(SAVE_KEY+RESCUE_SUFFIX),'{"yen":500,"island":"broken"}');
});

test('a full storage gives up every player’s previous copy, but never a rescued save',()=>{
 const s=store({quota:1500}),pad=n=>'x'.repeat(n);
 s.setItem(SAVE_KEY+'@player-2'+PREV_SUFFIX,JSON.stringify({yen:7,pad:pad(400)}));
 s.setItem(SAVE_KEY+RESCUE_SUFFIX,JSON.stringify({yen:9,pad:pad(300)}));
 writeSave(s,SAVE_KEY,JSON.stringify({yen:1,pad:pad(300)}));
 assert.equal(writeSave(s,SAVE_KEY,JSON.stringify({yen:2,pad:pad(500)})),true);
 assert.equal(s.getItem(SAVE_KEY+'@player-2'+PREV_SUFFIX),null,'another player’s previous copy made room');
 assert.ok(s.getItem(SAVE_KEY+RESCUE_SUFFIX),'the rescue stays');
});
