import test from 'node:test';
import assert from 'node:assert/strict';
import {restoreSakura} from '../src/commerce/sakura-economy.js';
import {SHOP_STOCK,closingStockPending,shelvesNeedRestock,applyStorageRestock,consumeStorageWonHandshake,STORAGE_WON_KEY} from '../src/commerce/shop-stock.js';

function depletedState(){
  const sakura=restoreSakura();
  for(const item of SHOP_STOCK){
    sakura.stock[item.id]={shelf:Math.max(0,item.capacity-4),reserve:item.capacity*2};
  }
  sakura.restockedDay=-1;
  sakura.journal=[];
  return {sakura,minutes:1210};
}

test('applyStorageRestock fills shelves from reserve and marks the closing day',()=>{
  const state=depletedState();
  assert.equal(closingStockPending(state,state.minutes),true);
  assert.equal(shelvesNeedRestock(state),true);
  const first=applyStorageRestock(state,state.minutes);
  assert.ok(first.moved>0);
  assert.equal(first.dayMarked,true);
  for(const item of SHOP_STOCK){
    assert.equal(state.sakura.stock[item.id].shelf,item.capacity);
  }
  assert.equal(state.sakura.restockedDay,0);
  assert.equal(closingStockPending(state,state.minutes),false);
  assert.equal(shelvesNeedRestock(state),false);
});

test('applyStorageRestock is idempotent',()=>{
  const state=depletedState();
  const first=applyStorageRestock(state,state.minutes);
  const snapshot=JSON.stringify(state.sakura.stock);
  const journalLength=state.sakura.journal.length;
  const second=applyStorageRestock(state,state.minutes);
  assert.equal(second.moved,0);
  assert.equal(second.dayMarked,false);
  assert.equal(JSON.stringify(state.sakura.stock),snapshot);
  assert.equal(state.sakura.journal.length,journalLength);
  assert.equal(state.sakura.restockedDay,0);
  assert.ok(first.moved>0);
});

test('consumeStorageWonHandshake clears the localStorage key once',()=>{
  const storage=new Map();
  globalThis.localStorage={
    getItem:k=>storage.has(k)?storage.get(k):null,
    setItem:(k,v)=>storage.set(k,String(v)),
    removeItem:k=>storage.delete(k),
  };
  localStorage.setItem(STORAGE_WON_KEY,JSON.stringify({day:2,assisted:true,t:123}));
  const once=consumeStorageWonHandshake();
  assert.deepEqual(once,{day:2,player:'player-1',assisted:true,boss:null,yen:0,t:123});
  assert.equal(localStorage.getItem(STORAGE_WON_KEY),null);
  assert.equal(consumeStorageWonHandshake(),null);
});

test('a boss seen off in the stockroom pays its cave coins; one still loose pays nothing',()=>{
  const storage=new Map();
  globalThis.localStorage={getItem:k=>storage.has(k)?storage.get(k):null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
  localStorage.setItem(STORAGE_WON_KEY,JSON.stringify({day:3,boss:{who:'Bus driver',animal:'gorilla',defeated:true},yen:99999,t:1}));
  const won=consumeStorageWonHandshake();
  assert.deepEqual(won.boss,{who:'Bus driver',animal:'gorilla',defeated:true});assert.equal(won.yen,200);
  localStorage.setItem(STORAGE_WON_KEY,JSON.stringify({day:3,boss:{who:'Tetsuo',animal:'bear',defeated:false},yen:200,t:1}));
  assert.equal(consumeStorageWonHandshake().yen,0);
});
