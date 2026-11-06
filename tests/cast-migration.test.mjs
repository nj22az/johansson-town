// The cast consolidation's save migration (src/save.js migrateCast; docs/CAST-CONSOLIDATION.md §11, §13): old names
// to the live identity, retiring homes to a retained public place, versioned, and the same after a second load.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {migrateCast,migrateThuan,migrateHousing,castKey,CAST_REVISION,readSave,writeSave,SAVE_KEY} from '../src/save.js';
import {RETIRED_HOMES,RETIRED,CORE,identityOf} from '../src/people/roster.js';
import {CAST_NAMES,liveNameFor} from '../src/people/cast.js';

installDOM();globalThis.self=globalThis;
function store(){
 const m=new Map();
 return {m,get length(){return m.size;},key:i=>[...m.keys()][i]??null,getItem:k=>m.has(k)?m.get(k):null,removeItem:k=>m.delete(k),setItem(k,v){m.set(k,String(v));}};
}
const clone=o=>JSON.parse(JSON.stringify(o));

test('the migration is versioned and idempotent: a second pass changes nothing, and the revision is stamped once',()=>{
 const saved={friendship:{'Mr Nakandakari':{points:4},'Mr Fujita':{points:2},Thuan:{points:9}},notes:['Met Mr Nakandakari.'],homeTarget:'home-kitahama-4',yen:500,inventory:['tea']};
 migrateCast(saved);assert.equal(saved.castRevision,CAST_REVISION);
 const once=JSON.stringify(saved);migrateCast(saved);assert.equal(JSON.stringify(saved),once);
 assert.deepEqual(saved.friendship,{'Mr Fujita':{points:2},Thuan:{points:9},Mac:{points:4}});assert.deepEqual(saved.notes,['Met Mac.']);
 assert.equal(saved.yen,500);assert.deepEqual(saved.inventory,['tea']);
 assert.equal(migrateCast({castRevision:7}).castRevision,7,'a newer revision is never lowered');
 assert.equal(migrateCast(null),null);
});

test('old names move to the live identity; a record already under the live name wins; strangers are left alone',()=>{
 assert.equal(castKey('Yonamine-sensei'),'Miss Higa');assert.equal(castKey('Mrs Higa'),'Miss Higa');assert.equal(castKey('Nakamura Mai'),null);assert.equal(castKey('Kenji'),'Chin');
 assert.equal(castKey('mac'),'Mac');assert.equal(castKey('Mr Nakandakari'),'Mac');assert.equal(castKey('jack'),'Harbour master');assert.equal(castKey('fuji'),'Mr Fujita');
 // The live names are the current ones, so nothing that walks today moves.
 for(const name of CAST_NAMES)assert.equal(castKey(name),name,name);
 for(const p of RETIRED)assert.equal(castKey(p.name),null,p.name+' is retired (phase 4): the record is dropped');
 for(const p of CORE)assert.equal(castKey(p.id),liveNameFor(p.id),p.id+' resolves to the body walking today');
 // Phase 2 gave the supporting crew bodies, so their old job-role names move to them.
 assert.equal(castKey('Chief officer'),'Ryo');assert.equal(castKey('Kitano line hand'),'Kai');
 // Unclaimed display names and strangers remain untouched; retired aliases are checked separately.
 for(const name of ['Fuji','Jack','Ryo','Kai','Harbour visitor','Hana','Kinjo Yui'])assert.equal(castKey(name),name,name);
 const saved={friendship:{'Yonamine-sensei':{points:1},'Miss Higa':{points:8}},treats:{'Mr Nakandakari':2},greeted:{'Mrs Higa':3},impressions:{Kenji:'kind'},
  relationships:{'Mr Nakandakari|Vy':{totals:{chat:1}},'Mrs Higa|Yonamine-sensei':{totals:{}},'Thao|Yonamine-sensei':{totals:{}}},
  bookshop:{completed:{'3:Mr Nakandakari':true}},errand:{from:'Mr Nakandakari',kind:'fetch'},residentLife:{'Mr Nakandakari':{day:1,yen:100,activities:['Mr Nakandakari is at the harbour.']}},
  sakura:{journal:[{buyer:'Mr Nakandakari',yen:120}]},documentArchive:[{author:'Yonamine-sensei',title:'Marks'}]};
 migrateCast(saved);
 assert.deepEqual(saved.friendship,{'Miss Higa':{points:8}},'the live record wins over the old one');
 assert.deepEqual(saved.treats,{Mac:2});assert.deepEqual(saved.greeted,{'Miss Higa':3});assert.deepEqual(saved.impressions,{Chin:'kind'});
 assert.deepEqual(Object.keys(saved.relationships).sort(),['Mac|Vy','Miss Higa|Thao'],'a pair of one person collapses and goes');
 assert.deepEqual(saved.bookshop.completed,{'3:Mac':true});assert.equal(saved.errand.from,'Mac');
 assert.deepEqual(saved.residentLife,{Mac:{day:1,yen:100,activities:['Mac is at the harbour.']}});
 assert.equal(saved.sakura.journal[0].buyer,'Mac');assert.equal(saved.documentArchive[0].author,'Miss Higa');
});

test('the player’s surname stays in prose: Johansson Harbour Office is not renamed with him',()=>{
 const saved={notes:['A folio at the Johansson Harbour Office.','Johansson fixed the kettle.'],friendship:{Johansson:{points:1}}};
 migrateCast(saved);assert.deepEqual(saved.notes,['A folio at the Johansson Harbour Office.','Johansson fixed the kettle.']);assert.ok(saved.friendship.Johansson);
});

test('a save pointing into a home that goes loads at a retained public place, in both states, and the mapping is stable',async()=>{
 const {createBusinesses}=await import('../src/world/businesses.js');
 const {createTown}=await import('../src/world/town.js');
 const sites=createBusinesses(),world=createTown({scene:new THREE.Scene(),sites,mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const places=new Map([...sites,...(world.landmarks||[])].map(s=>[s.id,s]));
 for(const target of new Set(Object.values(RETIRED_HOMES))){const site=places.get(target);assert.ok(site&&!site.isResidence,target+' is a retained public place in the built town');}
 // None of the homes that go stands any more (phase 4; the Heights' Flats 1 and 2 went with its upper storey in phase 3).
 for(const id of ['home-kitahama-4','home-kitahama-5','home-kitahama-6','home-kinjo','home-oshiro','resident-home-aya','home-shimabukuro','home-izakaya','home-kitano-3','home-kitahama-flat-1','home-kitahama-flat-2','rainflower-florist'])assert.equal(places.get(id),undefined,id+' is gone');
 const cases={'home-kitahama-4':'community-kitchen','kitahama-5':'community-kitchen','home-kitahama-6':'community-kitchen','kinjo':'community-kitchen','home-oshiro':'community-kitchen','resident-home-aya':'community-kitchen',
  'home-kitano-3':'community-kitchen','kitano-3':'community-kitchen','home-kitahama-flat-1':'community-kitchen','kitahama-flat-2':'community-kitchen','home-shimabukuro':'ferry-terminal','post-office':'ferry-terminal',
  'rainflower-florist':'market','florist':'market','home-izakaya':'izakaya','home-kitahama-7':'community-kitchen','home-market':'community-kitchen',
  // The mayor's office went on 21 October 2026 (briefs/town-hall-zone.md phase M): a save at its door lands at the Community Hall's.
  'mayor-office':'community-kitchen'};
 for(const [from,to] of Object.entries(cases)){
  const saved=migrateCast(migrateHousing({homeTarget:from,lastHome:from,navigationTarget:from,yen:3}));
  assert.equal(saved.homeTarget,to,from);assert.equal(saved.lastHome,to,from);assert.equal(saved.navigationTarget,to,from);
  const again=clone(saved);migrateCast(migrateHousing(again));assert.deepEqual(again,saved,from+' twice');
 }
 // Homes that stay are untouched: the family house, the flats that stay, the houseboat, the island.
 for(const id of ['resident-home-thuan','home-kitahama-flat-3','home-kitahama-flat-4','fujita-houseboat','mayor-home','home-higa','koban','office'])assert.equal(migrateCast({homeTarget:id}).homeTarget,id,id);
});

test('a save made inside a removed building, with a retired resident’s records, loads at the retained place with the records gone, and reads the same twice',()=>{
 const s=store(),old={yen:420,inventory:['Awamori miniature'],homeTarget:'home-oshiro',navigationTarget:'home-shimabukuro',lastHome:'resident-home-aya',visited:['home-kinjo','market','home-kitano-3'],
  residentLocations:{Reiko:{position:[-20,1],indoors:'home',home:'resident-home-aya'},'Postman Tōma':{position:[2,3]},'Bus driver':{position:[0,28]},Thao:{position:[2,2]}},
  friendship:{Barfly:{points:3},'Mr Ōshiro':{points:1},Thao:{points:1}},treats:{'Mrs Kinjō':1,Thuan:2},greeted:{'Mr Shimabukuro':2},impressions:{'Grandmother Chinen':'kind'},
  relationships:{'Barfly|Thao':{totals:{drink:2}},'Thao|Thuan':{totals:{chat:1}},'Mr Higa Jr|Grandmother Sakurai':{totals:{}}},
  bookshop:{completed:{'2:Reiko':true,'3:Nhung':true}},errand:{from:'Bus driver',kind:'deliver'},residentLife:{Reiko:{day:1},Thao:{day:1,yen:50}}};
 s.setItem(SAVE_KEY,JSON.stringify(old));
 const read=readSave(s);
 assert.equal(read.castRevision,CAST_REVISION);
 assert.equal(read.homeTarget,'community-kitchen','inside the Ōshiro house: the town hall');assert.equal(read.navigationTarget,'ferry-terminal','the flat over the post office: the terminal, where its post went');assert.equal(read.lastHome,'community-kitchen');
 assert.deepEqual(read.visited,['community-kitchen','market'],'visits to removed homes land at the retained place once');
 assert.deepEqual(read.residentLocations,{Thao:{position:[2,2]}},'the retired residents’ locations are dropped');
 assert.deepEqual(read.friendship,{Thao:{points:1}});assert.deepEqual(read.treats,{Thuan:2});assert.deepEqual(read.greeted,{});assert.deepEqual(read.impressions,{});
 assert.deepEqual(read.relationships,{'Thao|Thuan':{totals:{chat:1}}},'a pair with a retired person goes');
 assert.deepEqual(read.bookshop.completed,{'3:Nhung':true});assert.equal(read.errand,undefined,'an errand from a retired person is dropped');
 assert.deepEqual(read.residentLife,{Thao:{day:1,yen:50}});
 assert.equal(read.yen,420);assert.deepEqual(read.inventory,['Awamori miniature']);
 writeSave(s,SAVE_KEY,JSON.stringify(read));assert.deepEqual(readSave(s),read,'a second load changes nothing');
 for(const r of RETIRED)for(const name of [r.name,r.id,...r.was])assert.equal(castKey(name),null,name+' has no live record');
});

test('Nhung’s own home fields follow her to 3 Kitahama; her position and everybody else’s records stay',()=>{
 const saved={residentLocations:{Nhung:{position:[-20,1],indoors:'home',home:'resident-home-aya'},Reiko:{position:[-20,1],indoors:'home',home:'resident-home-aya'},Thao:{position:[2,2]}},
  residentLife:{Nhung:{day:2,yen:50,homeId:'resident-home-aya',sleepingPlace:'home-kitahama-3'}}};
 migrateCast(saved);
 assert.deepEqual(saved.residentLocations.Nhung,{position:[-20,1],indoors:'home',home:'kitahama-3'});
 assert.deepEqual(saved.residentLife.Nhung,{day:2,yen:50,homeId:'kitahama-3',sleepingPlace:'home-kitahama-3'});
 assert.equal(saved.residentLocations.Reiko,undefined,'Reiko is not Nhung: retired in phase 4, her record is dropped');
 assert.deepEqual(saved.residentLocations.Thao,{position:[2,2]});
});

test('loading through readSave runs the whole chain once and reads the same after it is saved again',()=>{
 const s=store(),old={yen:800,inventory:['Canned coffee'],friendship:{Yui:{points:5},Aya:{points:2},'Mrs Higa':{points:1},'Nakamura Mai':{points:3}},notes:['Met Yui at Sakura.'],
  residentLocations:{Yuri:{position:[0,0]},'Grandmother Sakurai':{position:[1,1]}},homeTarget:'home-kitahama-4',visited:['market','home-kitahama-7'],'johansson-house':{doors:{a:true}}};
 s.setItem(SAVE_KEY,JSON.stringify(old));
 const read=readSave(s);
 assert.equal(read.castRevision,CAST_REVISION);assert.equal(read.housingRevision,1);
 assert.deepEqual(read.friendship,{Thuan:{points:5},Nhung:{points:2},'Miss Higa':{points:1}},'the save-era names read as the sisters and the retired family is dropped');
 assert.deepEqual(read.notes,['Met Thuan at Sakura.']);assert.deepEqual(read.residentLocations,{Thuan:{position:[0,0]}});
 assert.equal(read.homeTarget,'community-kitchen');assert.deepEqual(read.visited,['market','community-kitchen']);
 assert.equal(read.yen,800);assert.deepEqual(read.inventory,['Canned coffee']);assert.deepEqual(read['johansson-house'],{doors:{a:true}});
 writeSave(s,SAVE_KEY,JSON.stringify(read));const again=readSave(s);assert.deepEqual(again,read,'a migrated save reads back unchanged');
 // From castRevision 1 on, a record under Yui is the teacher's, not Thuan's.
 const later={castRevision:CAST_REVISION,friendship:{Yui:{points:6},Thuan:{points:1}}};
 assert.deepEqual(migrateThuan(clone(later)).friendship,later.friendship);
 s.setItem(SAVE_KEY,JSON.stringify(later));assert.deepEqual(readSave(s).friendship,{Yui:{points:6},Thuan:{points:1}});
});
