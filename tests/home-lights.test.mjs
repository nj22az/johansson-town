import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeLights,routineLit,residentUpAtHome,HOME_ROUTINES} from '../src/world/home-lights.js';
import {RETIRED_HOME_IDS} from '../src/people/roster.js';
import {homeLightLevel} from '../src/render/window-interior.js';

const H=(h,m=0)=>h*60+m,day=1440;
const person=(name,flags,profile={})=>({profile:{name,start:540,retire:1410,...profile},g:{userData:flags}});

test('Kitahama’s windows follow the people who live there',()=>{
 let people=[];
 const lights=createHomeLights({people:()=>people});
 const slot=id=>lights.homes.find(h=>h.id===id).slot;
 // Chin home and up at nine in the evening: 1 Kitahama is lit; everybody out, or asleep, it is dark. Thuan lives on
 // Kitano-jima (phase 3): her being in somebody's house lights nothing here.
 people=[person('Chin',{indoors:'home'},{start:365,retire:1340}),person('Thao',{},{start:960,retire:1620})];
 lights.update(3*day+H(21));assert.equal(homeLightLevel(slot('kitahama-1')),1);
 people=[person('Chin',{}),person('Thao',{}),person('Thuan',{indoors:'home'})];
 lights.update(3*day+H(21,5));assert.equal(homeLightLevel(slot('kitahama-1')),0,'nobody home, the light is off');
 people=[person('Chin',{indoors:'home',sleeping:true})];
 lights.update(3*day+H(23,50));assert.equal(homeLightLevel(slot('kitahama-1')),0,'asleep, the light is off');
 // Thao comes in from the izakaya at three and is up for a while; Thuan is asleep.
 assert.ok(residentUpAtHome(person('Thao',{indoors:'home'},{start:960,retire:1620}),H(2,30)));
 assert.ok(!residentUpAtHome(person('Thao',{indoors:'home'},{start:960,retire:1620}),H(5)));
 // No removed house has a window to light (4, 5 and 6 Kitahama went in phase 4, 7 and 9–12 before it); only the houses
 // that stand and the two Heights houses are in the table.
 lights.update(4*day+H(22));
 for(const id of RETIRED_HOME_IDS){assert.ok(!lights.homes.some(h=>h.id===id),id+' has no light');assert.equal(HOME_ROUTINES[id],undefined,id+' has no routine');}
 assert.deepEqual(lights.homes.map(h=>h.id),['kitahama-1','kitahama-2','kitahama-3','kitahama-8','kitahama-flat-3','kitahama-flat-4']);
 // Ms Ganaha's is lit until she is home from the last boat's window.
 assert.equal(homeLightLevel(slot('kitahama-flat-4')),1);
 // The Heights' two houses are lit one by one: Mac has turned in for the generators.
 assert.equal(homeLightLevel(slot('kitahama-flat-3')),0,'Mac has retired for the night');assert.ok(!lights.homes.some(h=>/^flat-|kitahama-flat-[12]$/.test(h.id)),'no flat of the old block has a light');
 lights.update(4*day+H(20));assert.equal(homeLightLevel(slot('kitahama-flat-3')),1,'Mac’s house is lit at eight');
 const uezuHome=[0,7].map(d=>d*day+H(20)).find(m=>!HOME_ROUTINES['kitahama-8'].away(Math.floor(m/day)));lights.update(uezuHome);assert.equal(homeLightLevel(slot('kitahama-8')),1,'Ms Uezu’s house is lit at eight on her week ashore');
 // 3 Kitahama: Kōji and Riku's routine lights it while Nhung is still at the bookshop, and Nhung lights it herself after their bedtime.
 people=[person('Nhung',{})];lights.update(4*day+H(19));assert.equal(homeLightLevel(slot('kitahama-3')),1,'the household’s routine lights 3 Kitahama');
 people=[person('Nhung',{indoors:'home'},{start:540,retire:1320})];lights.update(4*day+H(21,45));assert.equal(homeLightLevel(slot('kitahama-3')),1,'Nhung up at home lights it after Kōji’s bedtime');
 people=[person('Nhung',{})];lights.update(4*day+H(21,45));assert.equal(homeLightLevel(slot('kitahama-3')),0);
});

test('the bosun’s house is dark every other week; the nurse’s night calls went with 7 Kitahama',()=>{
 const uezu=HOME_ROUTINES['kitahama-8'];
 assert.notEqual(routineLit(uezu,0*day+H(21)),routineLit(uezu,7*day+H(21)));
 assert.equal(HOME_ROUTINES['kitahama-7'],undefined);assert.equal(routineLit(undefined,1*day+H(2,20)),false);
});
