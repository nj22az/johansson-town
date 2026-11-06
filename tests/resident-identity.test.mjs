import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createResidentLedger,restoreResidentLife} from '../src/people/resident-personalities.js';
import {SAVE_KEY,migrateThuan} from '../src/save.js';

test('resident budgets and delivered meals survive real save restoration without changing the player wallet',async()=>{
 const state={yen:777},ledger=createResidentLedger(()=>state);ledger.purchase('Chin',900,'market-meal','bun',150);const record=ledger.account('Chin',900);record.meals={market:{item:'bun',delivered:true,finished:false,eaten:7}};
 const dom=installDOM({[SAVE_KEY]:JSON.stringify(state)}),{createActivities}=await import('../activities.js?resident-save=1');
 const activities=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>900});assert.equal(activities.state.yen,777);assert.equal(activities.state.residentLife.Chin.yen,2250);assert.equal(activities.state.residentLife.Chin.meals.market.eaten,7);
 const reloaded=createResidentLedger(()=>activities.state);assert.equal(reloaded.purchase('Chin',900,'market-meal','bun',150),true);assert.equal(activities.state.residentLife.Chin.yen,2250);activities.save();assert.equal(JSON.parse(dom.storage.get(SAVE_KEY)).residentLife.Chin.purchases.length,1);
 const next=reloaded.account('Chin',1441);assert.equal(next.yen,2400);assert.equal(next.purchases.length,0);
 assert.deepEqual(restoreResidentLife({Chin:{day:0,yen:'bad'},stranger:{day:0,yen:1}}),{});
});

test('legacy Yuri and Yui saves read back as Thuan across records, notes and the shop ledger',()=>{
 const migrated=migrateThuan({
  notes:['Met Yuri, the heart of Sakura Konbini.','Sold a bracket to Yuri for ¥180.'],
  residentLocations:{Yuri:{place:'market'},Thao:{place:'izakaya'}},
  residentLife:{Yui:{activities:['Yui is restocking the cooler.']}},
  sakura:{journal:[{kind:'Restocked',buyer:'Yuri',item:'Green tea'},{kind:'Sale',buyer:'Johansson',item:'Green tea'}]}
 });
 assert.deepEqual(Object.keys(migrated.residentLocations),['Thao','Thuan']);
 assert.deepEqual(Object.keys(migrated.residentLife),['Thuan']);
 assert.deepEqual(migrated.residentLife.Thuan.activities,['Thuan is restocking the cooler.']);
 assert.deepEqual(migrated.notes,['Met Thuan, the heart of Sakura Konbini.','Sold a bracket to Thuan for ¥180.']);
 assert.deepEqual(migrated.sakura.journal.map(r=>r.buyer),['Thuan','Johansson']);
 const text=JSON.stringify(migrated);
 assert.equal(/\bYuri\b|\bYui\b/.test(text),false,'no legacy shopkeeper name survives a migrated save');
});

test('a save holding both the old and the new shopkeeper keeps the Thuan record',()=>{
 const migrated=migrateThuan({residentLocations:{Yuri:{place:'izakaya'},Thuan:{place:'market'}}});
 assert.deepEqual(migrated.residentLocations,{Thuan:{place:'market'}});
});
