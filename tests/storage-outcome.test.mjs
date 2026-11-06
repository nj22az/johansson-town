import test from 'node:test';import assert from 'node:assert/strict';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {applyStorageOutcome,consumeStorageWonHandshake,acknowledgeStorageOutcome,storageWonKey,STORAGE_WON_KEY,closingDay} from '../src/commerce/shop-stock.js';
const boss={who:'Tetsuo',animal:'bear',defeated:true};
const outcome=(day=2,player='player-1')=>({day,player,boss,yen:200});
const state=()=>({yen:100,sakura:restoreSakura()});
function storage(){const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};return data;}
test('boss reward and restock apply once across duplicates, purchases and save recovery',()=>{
 let s=state();s.sakura.stock.tea.shelf-=4;
 assert.equal(applyStorageOutcome(s,4090,outcome()).yen,200);assert.equal(s.yen,300);assert.equal(s.sakura.restockedDay,2);
 s.sakura.stock.tea.shelf--;const snapshot=JSON.stringify(s);
 assert.equal(applyStorageOutcome(s,4090,outcome()).applied,false);assert.equal(JSON.stringify(s),snapshot);
 s={yen:s.yen,sakura:restoreSakura(JSON.parse(JSON.stringify(s.sakura)))};
 assert.equal(applyStorageOutcome(s,4090,outcome()).applied,false);assert.equal(s.yen,300);assert.equal(s.sakura.stock.tea.shelf,23);
 assert.equal(applyStorageOutcome(s,5530,outcome(3)).yen,200);assert.equal(s.yen,500);
 assert.equal(applyStorageOutcome(s,5530,outcome(2)).applied,false);
});
test('late results mark only their own trading day and never refill an already restocked day',()=>{
 const s=state();assert.equal(closingDay(3*1440+30),2);
 applyStorageOutcome(s,4*1440+1220,outcome());assert.equal(s.sakura.restockedDay,2);
 const newer=state();newer.sakura.restockedDay=3;newer.sakura.stock.tea.shelf=10;
 assert.equal(applyStorageOutcome(newer,4*1440+1220,outcome()).yen,200);assert.equal(newer.sakura.restockedDay,3);assert.equal(newer.sakura.stock.tea.shelf,10);
});
test('zero-reward completed nights are final; malformed, future and foreign outcomes are inert',()=>{
 const s=state();assert.equal(applyStorageOutcome(s,4090,{...outcome(),boss:{...boss,defeated:false},yen:200}).yen,0);
 assert.equal(applyStorageOutcome(s,4090,outcome()).applied,false);
 for(const h of [outcome(null),outcome(-1),outcome(2.5),outcome(99),outcome(3,'player-2')]){
  const snapshot=JSON.stringify(s);assert.equal(applyStorageOutcome(s,5530,h).applied,false);assert.equal(JSON.stringify(s),snapshot);
 }
 const over=state();assert.equal(applyStorageOutcome(over,4090,{...outcome(),yen:99999}).yen,200);
});
test('per-player pending results coexist and survive until saved and acknowledged',()=>{
 const data=storage();for(const p of ['player-1','player-2'])localStorage.setItem(storageWonKey(p),JSON.stringify({...outcome(2,p),t:123}));
 const first=consumeStorageWonHandshake('player-1',{retain:true});assert.equal(data.size,2);
 let s=state();applyStorageOutcome(s,4090,first); // simulate a failed save and a reload
 s=state();const retry=consumeStorageWonHandshake('player-1',{retain:true});assert.equal(applyStorageOutcome(s,4090,retry).yen,200);
 const saved=JSON.stringify(s);assert.equal(acknowledgeStorageOutcome(retry),true);assert.equal(data.size,1);
 const second=consumeStorageWonHandshake('player-2',{retain:true});assert.equal(second.player,'player-2');assert.equal(applyStorageOutcome(state(),4090,second).applied,false);
 const restored=JSON.parse(saved);localStorage.setItem(storageWonKey('player-1'),JSON.stringify({...outcome(),t:456}));
 assert.equal(applyStorageOutcome(restored,4090,consumeStorageWonHandshake('player-1',{retain:true})).applied,false);
});
test('legacy unscoped results belong only to the original player; failed removal cannot consume; ack cannot erase a newer result',()=>{
 const data=storage();localStorage.setItem(STORAGE_WON_KEY,JSON.stringify({...outcome(2),player:undefined,t:123}));
 assert.equal(consumeStorageWonHandshake('player-2'),null);assert.ok(data.has(STORAGE_WON_KEY));
 const h=consumeStorageWonHandshake('player-1',{retain:true});localStorage.setItem(STORAGE_WON_KEY,JSON.stringify({...outcome(3),t:124}));assert.equal(acknowledgeStorageOutcome(h),false);
 localStorage.removeItem=()=>{throw Error('blocked');};assert.equal(consumeStorageWonHandshake('player-1'),null);assert.ok(data.has(STORAGE_WON_KEY));
});

test('a saved future-night return uses its player save clock before town clock restoration',()=>{
 const s=state();s.minutes=5530;assert.equal(applyStorageOutcome(s,4090,outcome(3)).yen,200);assert.equal(s.sakura.restockedDay,3);
});
