// Loading old business visits must preserve player progress and live residents,
// while applying the cast consolidation's approved retirement and rename rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import {SAVE_KEY,CAST_REVISION,readSave} from '../src/save.js';

test('old saved visits consolidate while preserving progress and migrating resident identities',()=>{
 const before={visited:['journal','frontrow','electronics','stepwise','form3d','career'],inventory:['Evening newspaper'],quest:3,kenjiEscort:'done',inspectedIds:['journal','stepwise'],
  residentLocations:{Reiko:{position:[0,0],indoors:'work'},Thao:{position:[2,3],indoors:'home'},Kenji:{position:[4,5],indoors:'work'}}};
 const raw=JSON.stringify(before),storage={getItem:key=>key===SAVE_KEY?raw:null};
 const saved=readSave(storage);
 assert.deepEqual(saved.visited,['frontrow','form3d','office']);
 for(const key of ['inventory','quest','kenjiEscort','inspectedIds'])assert.deepEqual(saved[key],before[key],key+' survives loading');
 assert.deepEqual(saved.residentLocations,{Thao:before.residentLocations.Thao,Chin:before.residentLocations.Kenji},'Live records survive; Kenji becomes Chin; retired Reiko is removed');
 assert.equal(saved.castRevision,CAST_REVISION);
 assert.equal(storage.getItem(SAVE_KEY),raw,'Loading does not overwrite the original save');
 const migrated=JSON.stringify(saved);
 assert.deepEqual(readSave({getItem:key=>key===SAVE_KEY?migrated:null}),saved,'A saved migration loads unchanged');
});
