import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {createActivities} from '../activities.js';
import {STREET_CAST_NAMES} from '../src/people/residents.js';
import {wantPool,wantsFor,gave,openWant,wantLine,TASTE_ITEMS} from '../src/people/friendship.js';
import {playerRecipe,savePlayerRecipe,PLAYER_RECIPE_KEY} from '../src/avatars/actors.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {SAVE_KEY,DEFAULT_PLAYER,addPlayer,switchPlayer,readSave,slotKey} from '../src/save.js';

test('restoring a retired layout cannot change dialogue about the live peninsula homes',()=>{
 const dom=installDOM({[SAVE_KEY]:JSON.stringify({townMode:'shopping-district'})});
 {
  const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>600});
  assert.equal(acts.state.townMode,'peninsula');
  acts.action('resident','Nhung');
  assert.ok(dom.has('Where do you live?'));
  dom.button('Where do you live?');
  // Nhung's home is 3 Kitahama with Kōji and Riku (the cast consolidation's phase 3, johansson-town/AGENTS.md and
  // docs/CAST-CONSOLIDATION.md; kept when she became the island doctor on 22 October 2026). It was 1 Front-Row Yard.
  assert.match(document.querySelector('#activityBody').firstChild.textContent,/3 Kitahama/);
  assert.doesNotMatch(document.querySelector('#activityBody').firstChild.textContent,/commute|leave by bus/i);
 }
});

test('daily favours belong to the playable cast on every day, including the former empty day eight',()=>{
 const names=wantPool(),available=STREET_CAST_NAMES.filter(n=>n!=='Thuan');
 assert.deepEqual(names.slice().sort(),available.slice().sort());
 for(let day=0;day<365;day++){
  const wants=wantsFor(day*1440+600,names);
  assert.equal(wants.length,3,'Three reachable favours on day '+day);
  assert.equal(new Set(wants.map(w=>w.name)).size,3);
  for(const want of wants)assert.ok(available.includes(want.name),want.name+' is in town');
 }
});

test('a freshly caught taman completes a fish favour, with legacy fish gifts accepted too',()=>{
 assert.equal(TASTE_ITEMS.fish,'Taman');
 let minutes,want;
 for(let day=0;day<1000&&!want;day++){
  minutes=day*1440+600;want=wantsFor(minutes,wantPool()).find(w=>w.item==='Taman');
 }
 assert.ok(want,'A resident requests the fish obtainable from the pier');
 assert.match(wantLine(want),/off the pier tonight/,'The request directs the player to the actual fish source, at the hour it bites');
 assert.doesNotMatch(wantLine(want),/Sakura/);
 assert.match(wantLine({item:'Mībai'}),/fishing pier/,'Other pier fish point at the pier');
 for(const item of ['Taman','Sea bream','Mackerel']){
  const state={},result=gave(state,want.name,item,minutes,wantPool());
  assert.equal(result.kind,'want');assert.equal(result.yen,want.reward);
  assert.equal(openWant(state,minutes,wantPool(),want.name),null);
  assert.equal(gave(state,want.name,item,minutes,wantPool()).yen,0);
 }
});

test('players keep separate appearances while the original player keeps the legacy avatar key',()=>{
 const dom=installDOM({[PLAYER_RECIPE_KEY]:encodeRecipe(CAST_RECIPES.Thuan)});
 assert.equal(playerRecipe().name,'Thuan');
 const second=addPlayer(localStorage,'Second',1000);
 assert.equal(playerRecipe().name,'Johansson','A new player starts with their own islander');
 savePlayerRecipe({...CAST_RECIPES.Johansson,name:'Second islander'});
 assert.ok(dom.storage.get(PLAYER_RECIPE_KEY+'@'+second));
 assert.equal(playerRecipe().name,'Second islander');
 switchPlayer(localStorage,DEFAULT_PLAYER.id);
 assert.equal(playerRecipe().name,'Thuan','The original look was not overwritten');
 assert.equal(decodeRecipe(dom.storage.get(PLAYER_RECIPE_KEY)).name,'Thuan');
 switchPlayer(localStorage,second);
 assert.equal(playerRecipe().name,'Second islander');
});

test('gift pages expose a late-picked daily request and every present for Thuan',()=>{
 const inventory=['Green tea','Canned coffee','Plum rice ball','Butter biscuits','Sakura soap','Pocket notebook','Harbour postcard','Radio batteries',
  'Sea breeze cola','Spring water','Umineko lager','Instant shoyu noodles','Asamori milk','Salted potato crisps','Soy rice crackers','Milk chocolate','Taman'];
 let minutes,want;
 for(let day=0;day<1000&&!want;day++){
  minutes=day*1440+600;want=wantsFor(minutes,wantPool()).find(w=>w.item==='Taman');
 }
 assert.ok(want);
 for(const name of [want.name,'Thuan']){
  const ui=installDOM(),acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>minutes});
  acts.state.inventory=[...inventory];
  acts.action('resident',name);
  ui.button(name==='Thuan'?'Give her a present':'Give a present…');
  assert.equal(ui.has('Taman'),false,'The first page stays a manageable size');
  ui.button('More presents');assert.ok(ui.has('Sea breeze cola'));
  ui.button('Previous presents');assert.ok(ui.has('Green tea'));
  ui.button('More presents');ui.button('More presents');
  assert.ok(ui.has('Taman'),'The seventeenth picked-up item is selectable');
  assert.equal(ui.has('More presents'),false,'The last page has no empty next page');
  ui.button('Taman');
  assert.equal(acts.state.inventory.includes('Taman'),false);
  if(name==='Thuan')assert.equal(acts.state.story.gifts_given,1);
  else{
   assert.equal(acts.state.yen,1200+want.reward,'A request on a later page still pays its reward');
   assert.equal(openWant(acts.state,minutes,wantPool(),name),null);
  }
 }
});

test('exported progress includes appearance and an imported slot restores it without changing other players',()=>{
 installDOM();
 {
  savePlayerRecipe({...CAST_RECIPES.Johansson,name:'Custom islander'});
  const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>600});
  acts.state.yen=777;acts.save();
  const exported=JSON.parse(JSON.stringify({game:'johansson-town',version:1,state:readSave(localStorage)}));
  assert.equal(decodeRecipe(exported.state.avatarRecipe).name,'Custom islander');
  const imported=addPlayer(localStorage,'Imported',2000);
  localStorage.setItem(slotKey(imported),JSON.stringify(exported.state));
  assert.equal(playerRecipe().name,'Custom islander','Save-file appearance restores without an existing avatar key');
  assert.equal(readSave(localStorage).yen,777);
  savePlayerRecipe({...CAST_RECIPES.Johansson,name:'Imported edit'});
  assert.equal(playerRecipe().name,'Imported edit','Later local customization wins over the imported snapshot');
  switchPlayer(localStorage,DEFAULT_PLAYER.id);
  assert.equal(playerRecipe().name,'Custom islander');
 }
});
