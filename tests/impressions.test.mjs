import test from 'node:test';
import assert from 'node:assert/strict';
import {recordMoment} from '../src/progression/diary.js';
import {IMPRESSIONS,deedsWith,impressionOf,impressionLine,restoreImpressions,IMPRESSION_DAYS} from '../src/people/impressions.js';
import {lintLine} from '../src/dialogue/markup.js';

const DAY=1440,at=d=>d*DAY+12*60;
const favour=(state,d,id,step,who)=>recordMoment(state,at(d),{id:`favour:${id}:${step}`,text:`${id} ${step}`,kind:'friend',who});

test('a resident counts only what the mayor really did with them, and only what they could know',()=>{
 const state={};
 favour(state,100,'nhung-cookbook','declined',['Nhung','Thao']);
 assert.deepEqual(deedsWith(state,'Nhung',at(100)),{kept:0,late:0,declined:1,gifts:0,drinks:0});
 assert.equal(deedsWith(state,'Thao',at(100)).declined,0,'Thao never heard she was meant to get a book');
 favour(state,101,'harbour-timetable','done',['Harbour master','Mrs Sato']);
 assert.equal(deedsWith(state,'Mrs Sato',at(101)).kept,1,'a kept favour is known to both');
 recordMoment(state,at(102),{text:'Gave Tetsuo a melon bun.',kind:'gift',who:['Tetsuo']});
 recordMoment(state,at(102),{text:'Bought Tetsuo a drink at Minato.',kind:'friend',who:['Tetsuo']});
 assert.deepEqual(deedsWith(state,'Tetsuo',at(102)),{kept:0,late:0,declined:0,gifts:1,drinks:1});
 assert.equal(deedsWith(state,'Tetsuo',at(102+IMPRESSION_DAYS)).gifts,0,'a fortnight later it has faded');
});

test('the most telling impression wins, and it is said once until it changes',()=>{
 const state={};
 assert.equal(impressionOf(state,'Nhung',at(10)),null,'nothing done, nothing to say');
 favour(state,10,'nhung-cookbook','done',['Nhung','Thao']);
 assert.equal(impressionOf(state,'Nhung',at(10)).id,'kept-word');
 const first=impressionLine(state,'Nhung',at(10),{temper:'sunny',playerName:'Johansson'});
 assert.match(first.text,/Ask Johansson, and it gets done/);
 state.impressions={Nhung:first.id};
 assert.equal(impressionLine(state,'Nhung',at(11)),null,'said once');
 favour(state,12,'nhung-rain-book','late',['Nhung','Harbour master']);
 assert.equal(impressionOf(state,'Nhung',at(12)).id,'let-down','a broken promise weighs as much as a kept one');
 assert.ok(impressionLine(state,'Nhung',at(12)),'a changed impression is said');
 assert.equal(impressionOf(state,'Harbour master',at(12)),null,'the holder never knew the favour slipped');
});

test('every impression is written for every temperament, in the house style',()=>{
 for(const i of IMPRESSIONS)for(const t of ['sunny','dramatic','easy','dry']){
  assert.ok(i.lines[t],i.id+' '+t);assert.deepEqual(lintLine(i.lines[t],{name:'Johansson'}),[],i.id+' '+t);
 }
 assert.deepEqual(restoreImpressions({Nhung:'kept-word',Thao:'nonsense',['x'.repeat(80)]:'generous'}),{Nhung:'kept-word'});
});

test('getting something back is known to the one who asked, not to the one who handed it over',()=>{
 const state={};favour(state,50,'nhung-rain-book','done',['Nhung','Harbour master']);
 assert.equal(deedsWith(state,'Nhung',at(50)).kept,1);assert.equal(deedsWith(state,'Harbour master',at(50)).kept,0);
});
