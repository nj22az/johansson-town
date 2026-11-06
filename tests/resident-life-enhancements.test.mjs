import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {PERSONALITY_QUESTIONS,answeredPersonality} from '../src/avatars/personality-questions.js';
import {personalityOf,voiceOf,hasVoiceRefinement} from '../src/avatars/personality.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {rememberEncounter,restoreRelationships,relationshipBetween,relationshipChat,connectionWeight,MEMORY_LIMIT} from '../src/people/relationships.js';
import {openYear} from '../src/progression/year-loop.js';
import {PROFILES} from '../src/people/profiles.js';
import {createNeighbourChats} from '../src/people/neighbour-chats.js';
import {bagCategory,bagEntries} from '../src/commerce/bag-catalogue.js';
import {PRODUCTS} from '../src/commerce/products-data.js';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {addPlayer} from '../src/save.js';

test('all sixteen questionnaire outcomes are reachable and incomplete answers do nothing',()=>{
 assert.equal(answeredPersonality({}),null);assert.equal(answeredPersonality({pace:0,talk:1,show:0,outlook:7}),null);
 const types=new Set();for(let i=0;i<16;i++)types.add(personalityOf(answeredPersonality(Object.fromEntries(PERSONALITY_QUESTIONS.map((q,j)=>[q.key,(i>>j)&1])))).name);
 assert.equal(types.size,16);
});

test('legacy voice defaults stay unchanged; refinements are bounded and round-trip',()=>{
 const old=normalizeRecipe({name:'Mei',profile:{talk:1,pitch:.25,speed:.75}});
 assert.equal(voiceOf(old.profile).type,'triangle');assert.equal(voiceOf(old.profile).volume,.06);assert.equal(voiceOf(old.profile).vibrato,0);
 assert.equal(hasVoiceRefinement(normalizeRecipe({}).profile),false,'legacy dialogue keeps its name-based voice');
 assert.equal(hasVoiceRefinement(old.profile),true,'an edited pitch or speed is used');
 const r=normalizeRecipe({profile:{timbre:'sine',softness:1,vibrato:.75}}),saved=decodeRecipe(encodeRecipe(r));assert.deepEqual(saved.profile,r.profile);
 assert.equal(voiceOf(saved.profile).type,'sine');assert.equal(voiceOf(saved.profile).volume,.03);
 const bad=normalizeRecipe({profile:{timbre:'script',softness:999,vibrato:-1}});assert.equal(bad.profile.timbre,'auto');assert.equal(bad.profile.softness,1);assert.equal(bad.profile.vibrato,0);
});

test('inventory categories follow the catalogue, preserve counts and never mutate saved items',()=>{
 for(const p of PRODUCTS){const zone=p.purpose.zone;if(zone==='drinks')assert.equal(bagCategory(p.inventoryName),'drinks',p.inventoryName);if(['fresh','pantry','sweets','counter'].includes(zone))assert.equal(bagCategory(p.inventoryName),'food',p.inventoryName);}
 const bag=['Green tea','Green tea','Curry roux','Empty can','Unknown souvenir'],before=[...bag];
 assert.deepEqual(bagEntries(bag,{category:'drinks',query:'TEA'}),[{item:'Green tea',count:2,category:'drinks'}]);
 assert.equal(bagCategory('Empty can'),'recycling');assert.equal(bagCategory('Unknown souvenir'),'collectibles');assert.deepEqual(bag,before);
 assert.deepEqual(bagEntries([]),[]);assert.deepEqual(bagEntries(bag,{query:'not in this bag'}),[]);
});

test('encounters count once per pair, kind and day across reloads',()=>{
 const state={};assert.equal(rememberEncounter(state,'Chin','Tetsuo',{minutes:1002}),true);
 const saved={relationships:restoreRelationships(JSON.parse(JSON.stringify(state.relationships)))};
 assert.equal(rememberEncounter(saved,'Tetsuo','Chin',{minutes:1200}),false);
 assert.equal(rememberEncounter(saved,'Chin','Tetsuo',{minutes:1440}),true);
 assert.equal(rememberEncounter(saved,'Chin','Tetsuo',{minutes:500}),false,'rewinding the clock cannot farm connection');
 assert.equal(relationshipBetween(saved,'Chin','Tetsuo').totals.chat,2);
 assert.ok(connectionWeight(saved,'Chin','Tetsuo')>0);
});

test('malformed relationships and unknown identities are discarded; legacy names migrate',()=>{
 const state={};for(const names of [['Chin','Chin'],['Chin','Invented person'],['__proto__','Chin']])assert.equal(rememberEncounter(state,...names,{minutes:1002}),false);
 assert.equal(rememberEncounter(state,'Chin','Tetsuo',{minutes:Infinity}),false);
 assert.equal(rememberEncounter(state,'Kenji','Tetsuo',{minutes:1002}),true);
 const r=restoreRelationships({...state.relationships,'Chin|Invented person':{},'Chin|Nhung':{totals:{chat:Infinity},marks:{chat:'bad'},recent:[null,{kind:'invented',day:0,place:'street'}]}});
 assert.ok(r['Chin|Tetsuo']);assert.equal(r['Chin|Invented person'],undefined);assert.equal(r['Chin|Nhung'].totals.chat,0);assert.deepEqual(r['Chin|Nhung'].recent,[]);
 assert.deepEqual(restoreRelationships([]),{});
});

test('memory is bounded and a year turn preserves familiarity while resetting dates',()=>{
 const state={loopYear:2026};for(let day=0;day<40;day++)rememberEncounter(state,'Chin','Tetsuo',{minutes:day*1440});
 assert.equal(relationshipBetween(state,'Chin','Tetsuo').recent.length,MEMORY_LIMIT);
 const {saved}=openYear(state,new Date(2027,0,1));const r=relationshipBetween(saved,'Chin','Tetsuo');assert.equal(r.totals.chat,40);assert.deepEqual(r.marks,{});assert.deepEqual(r.recent,[]);
 assert.equal(rememberEncounter(saved,'Chin','Tetsuo',{minutes:0}),true);
});

test('callbacks recall real past meals, and an explicit disagreement can be reconciled',()=>{
 const state={};rememberEncounter(state,'Chin','Tetsuo',{kind:'meal',minutes:1002,place:'izakaya'});
 assert.equal(relationshipChat(state,'Chin','Tetsuo',{minutes:1010}),null);
 assert.match(relationshipChat(state,'Chin','Tetsuo',{minutes:2442}).lines[0],/meal/);
 rememberEncounter(state,'Chin','Tetsuo',{kind:'disagreement',minutes:2442});
 assert.equal(relationshipChat(state,'Chin','Tetsuo',{minutes:3882}).relationshipKind,'reconcile');
});

function neighbours(state={},data={}){
 const world={people:['Chin','Tetsuo'].map((name,i)=>{const g=new THREE.Group();g.position.set(i*1.5,0,-4);Object.assign(g.userData,data);return {g,profile:PROFILES.find(p=>p.name===name)};})};
 let saved=0;const chats=createNeighbourChats({world,observer:()=>new THREE.Vector3(),state:()=>state,onMemory:()=>saved++,random:()=>.5});return {world,chats,state,get saved(){return saved;}};
}

test('only completed conversations persist a memory, and save once',()=>{
 const a=neighbours();a.chats.update(2,1002);assert.ok(a.chats.current);assert.deepEqual(a.state,{});
 a.chats.update(30,1032);assert.equal(a.chats.current,null);assert.equal(a.saved,1);assert.equal(relationshipBetween(a.state,'Chin','Tetsuo').totals.chat,1);
 a.chats.update(2,1034);assert.equal(a.saved,1);
 const b=neighbours();b.chats.update(2,1002);b.chats.cancel();assert.deepEqual(b.state,{});assert.equal(b.saved,0);
 const c=neighbours();c.chats.update(2,1002);c.world.people[1].g.visible=false;c.chats.update(30,1032);assert.deepEqual(c.state,{});
});

test('finished diners may chat and remember the meal; active eating is left alone',()=>{
 const a=neighbours({},{inIzakaya:true,mealState:'finished'});a.chats.update(2,1002);assert.ok(a.chats.current);a.chats.update(30,1032);
 assert.equal(relationshipBetween(a.state,'Chin','Tetsuo').totals.meal,1);
 const b=neighbours({},{inIzakaya:true,mealState:'eating'});b.chats.update(2,1002);assert.equal(b.chats.current,null);assert.deepEqual(b.state,{});
});

test('activity saves restore relationship memories in the correct player slot',()=>{
 const dom=installDOM(),options={say:()=>{},onWeather:()=>{},onTime:()=>{}};
 const a=createActivities(options);rememberEncounter(a.state,'Chin','Tetsuo',{kind:'meal',minutes:1002,place:'izakaya'});assert.equal(a.save(),true);
 installDOM(Object.fromEntries(dom.storage));const b=createActivities(options);
 assert.equal(relationshipBetween(b.state,'Chin','Tetsuo').totals.meal,1);
 addPlayer(localStorage,'Another player',100);const c=createActivities(options);
 assert.deepEqual(c.state.relationships,{});assert.equal(relationshipBetween(b.state,'Chin','Tetsuo').totals.meal,1);
});

test('directory record capability keeps Thuan and only offers existing readable records',()=>{
 const dom=installDOM(),a=createActivities({say(){},onWeather(){},onTime(){}});
 for(const name of ['Thuan','Chin','Mr Fujita'])assert.equal(a.canResidentRecord(name),true,name+' already has a record');
 for(const name of ['Vy','Grandmother Higa','Johansson','Not a resident'])assert.equal(a.canResidentRecord(name),false,name+' has no established record data');
 const saved=JSON.stringify(a.state);
 a.residentRecords(['Chin','Thuan','Vy','Chin','Mr Fujita']);
 const body=document.querySelector('#activityBody'),names=()=>body.children.find(e=>e.className==='resident-list').children.map(b=>b.textContent);
 assert.deepEqual(names(),['Chin','Thuan','Mr Fujita'],'Thuan appears once and unsupported cards do not become inactive list buttons');
 body.children.find(e=>e.className==='resident-list').children.find(b=>b.textContent==='Thuan').onclick();
 assert.equal(document.querySelector('#activityTitle').textContent,'Resident record · Thuan');
 assert.ok(body.children.some(e=>e.textContent==='Personality dials'));
 assert.ok(document.querySelector('#activity').classList.contains('resident-record'));
 dom.button('Back to residents');assert.deepEqual(names(),['Chin','Thuan','Mr Fujita'],'Returning preserves the offered records');
 const title=document.querySelector('#activityTitle').textContent;
 a.residentRecord('Vy');assert.equal(document.querySelector('#activityTitle').textContent,title,'An unsupported record does not replace the current activity');
 a.close();assert.equal(a.paused,false);
 assert.equal(JSON.stringify(a.state),saved,'Browsing records never changes the save');
});
