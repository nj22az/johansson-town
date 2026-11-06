// Ms Ganaha's places (src/world/island-guide.js; the studio's town-studio/island-guide/plan.md, batch 2): every
// answer is held to the game's own files, she never promises what is not built, and she can be asked at her window.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installDOM} from './fixtures.mjs';
const {ISLAND_PLACES,islandPlaces,islandPlace,placeSays}=await import('../src/world/island-guide.js');
const {FLIGHT_TIMES,stamp}=await import('../src/island/services.js');
const {createActivities}=await import('../activities.js');
const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');

test('every place is whole, and each of its facts is still in the game', () => {
 assert.equal(new Set(ISLAND_PLACES.map(p=>p.id)).size,ISLAND_PLACES.length);
 for(const p of ISLAND_PLACES){
  assert.ok(['kitano','johansson'].includes(p.island),p.id);
  assert.ok(['beach','view','shrine','shop','village','travel','bath','walk'].includes(p.kind),p.id);
  assert.ok(placeSays(p).length>60&&placeSays(p).length<420,p.id+' says something, briefly');
  assert.ok(p.checks.length>=1,p.id+' is held to the game');
  for(const [file,text] of p.checks)assert.ok(read(file).includes(text),`${p.id}: "${text}" in ${file}`);
 }
 assert.ok(islandPlaces('kitano').length>=5&&islandPlaces('johansson').length>=1);
 assert.match(placeSays(islandPlace('airport')),new RegExp(FLIGHT_TIMES.map(stamp).join(', ').replace(/, ([^,]*)$/,' and $1')),'the flights from the timetable');
 // What the town has funded changes her answers: the guesthouse's 11:00 flight, the coastal bus.
 assert.match(placeSays(islandPlace('airport'),{island:{projects:['guesthouse']}}),/11:00/);
 assert.equal(islandPlace('hoshizaki'),null,'retired village is not advertised');
});

test('she never promises what is not built', () => {
 const all=ISLAND_PLACES.map(p=>placeSays(p)).join(' ');
 // No live turtles: she only repeats what the cove's own sign says, and that she has never seen one.
 assert.match(placeSays(islandPlace('turtle-cove')),/they say/);
 // No village bus, no guesthouse, no keeper, no summer flight, no fare.
 for(const id of ['hoshizaki','fumoto','aoba','aoba-radio','west-cape','oshiro-stand'])assert.equal(islandPlace(id),null);
 assert.match(placeSays(islandPlace('kitano-hamlet')),/Chief/);assert.doesNotMatch(placeSays(islandPlace('kitano-hamlet')),/Mayor/,'Nils is the chief engineer, not the mayor (docs/CAST-CONSOLIDATION.md §3)');
 assert.doesNotMatch(all,/summer flight|Gate 2|parasol|¥400 (ferry|return)/i);
});

test('at her window: pick an island, then a place', () => {
 const dom=installDOM({});const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>13*60});
 acts.action('ganaha','Ms Ganaha',{buy(){}});
 assert.ok(dom.labels().includes('What is there on Kitano-jima?')&&dom.labels().includes('What is there on this island?'));
 dom.button('What is there on Kitano-jima?');
 assert.deepEqual(dom.labels(),[...islandPlaces('kitano').map(p=>p.name),'That is all, thank you']);
 dom.button('Coral Bay');
 assert.equal(document.querySelector('#activityBody').children[0].textContent,placeSays(islandPlace('coral-bay')));
 dom.button('Somewhere else?');dom.button('That is all, thank you');
 dom.button('What is there on this island?');assert.ok(dom.labels().includes('Umi-no-yu'));
});
