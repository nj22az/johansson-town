import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {RESIDENTS} from '../src/people/residents.js';
import {HOUSEHOLDS} from '../src/people/households.js';
import {createHomeResidents} from '../src/people/home-residents.js';
import {suppliedRoomBoundsBlocked,buildSuppliedRoom} from '../src/world/supplied-rooms.js';
import {circleHitsRect} from '../physics.js';
import {readSave,SAVE_KEY} from '../src/save.js';
const native=globalThis.fetch;
function localAssets(){installDOM();globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1024,height:1024,close(){}});globalThis.fetch=async u=>String(u).startsWith('blob:')?native(u):new Response(await readFile(new URL('../assets/'+new URL(u).pathname.split('/assets/')[1],import.meta.url)));}
test('old flat IDs migrate without changing individual schedules or belongings',()=>{
 const saved={visited:['resident-home-nao','yuri-home','resident-home-reiko','resident-home-tetsuo'],residentLocations:{Thao:{indoors:'home',position:[-24,10]}},residentLife:{Thao:{yen:800}}};
 const result=readSave({getItem:key=>key===SAVE_KEY?JSON.stringify(saved):null});assert.deepEqual(result.visited,['resident-home-thuan','community-kitchen','resident-home-kenji'],'Reiko’s old flat lands at the town hall (phase 4)');assert.deepEqual(result.residentLocations,saved.residentLocations);assert.deepEqual(result.residentLife,saved.residentLife);
});
