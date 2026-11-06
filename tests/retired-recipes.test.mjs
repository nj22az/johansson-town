// The retired identities (people/roster.js RETIRED: phase 5 of docs/CAST-CONSOLIDATION.md's ten, and Dr Kakazu, retired
// into Nhung on 22 October 2026) keep their drawings, walks and costumes for Studio and for a history story, and nothing
// live lists or spawns them; the live cast of 25 is what every live list names, by the names World calls them (Mac,
// Ms Ganaha), and Studio finds them so.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {RETIRED,CORE,SUPPORTING} from '../src/people/roster.js';
import {CAST_NAMES,castMember} from '../src/people/cast.js';
import {recipeFor,RESIDENT_GROUPS,RESIDENT_NAMES,RETIRED_RECIPES,RETIRED_RECIPE_NAMES,CREW_LOOKS} from '../src/avatars/cast.js';
import {gaitOf,PERSONAL_GAITS,RETIRED_GAITS} from '../src/avatars/gait.js';
import {COSTUMES,COSTUMED,RETIRED_COSTUMES,costumeRecipe} from '../src/dungeon/costumes.js';
import {NEIGHBOURS} from '../src/people/neighbours.js';
import {FEED_PLACES} from '../src/feed/places.js';
installDOM();
const retired=RETIRED.map(p=>p.name);

test('the retired keep a buildable drawing, walk and costume, and no live list names them',()=>{
 assert.equal(retired.length,13);assert.deepEqual(RETIRED_RECIPE_NAMES,retired);
 for(const name of retired){
  const recipe=recipeFor(name);assert.ok(recipe?.outfit&&recipe.name===name,name+' still builds for Studio and history');
  assert.equal(castMember(name),null,name+' has no body in the cast');
  assert.ok(!RESIDENT_NAMES.includes(name),name+' is in a live Studio list');
  assert.ok(!NEIGHBOURS.some(n=>n.name===name)&&!COSTUMED.includes(name)&&!(name in PERSONAL_GAITS),name+' is spawned, costumed or walked live');
  assert.ok(!FEED_PLACES.some(p=>p.regulars.includes(name)),name+' is a regular in a story place');
 }
 const by=(a,b)=>a.localeCompare(b);
 assert.deepEqual(Object.keys(RETIRED_RECIPES).sort(by),['Grandmother Chinen','Grandmother Sakurai','Mr Higa Jr','Mr Ōshiro','Mr Shimabukuro','Mrs Kinjō','Postman Tōma','Reiko','Dr Kakazu','Mrs Nakamura','Mai'].sort(by),'the eleven drawn retired');
 assert.deepEqual(Object.keys(RETIRED_GAITS).sort(by),['Barfly','Mr Ōshiro','Reiko'].sort(by));
 assert.deepEqual(gaitOf(recipeFor('Reiko'),()=>.5).tics,RETIRED_GAITS.Reiko.tics,'Reiko still walks as herself');
 assert.deepEqual(Object.keys(RETIRED_COSTUMES).sort(),['Bus driver','Reiko']);
 assert.equal(costumeRecipe(recipeFor('Reiko'),'Reiko').outfit.topColour,RETIRED_COSTUMES.Reiko.colour,'the fox suit still fits');
 for(const name of COSTUMED)assert.ok(CAST_NAMES.includes(name),name+' is costumed but not in the cast');
 assert.ok(Object.keys(COSTUMES).every(n=>!retired.includes(n)));
});

test('every live list is exactly the 23, by the names World uses, and Studio groups the crew by them',()=>{
 assert.equal(CAST_NAMES.length,23);assert.equal(CORE.length+SUPPORTING.length,23);
 for(const name of CAST_NAMES)assert.ok(RESIDENT_NAMES.includes(name),name+' is missing from the Studio lists');
 for(const name of RESIDENT_NAMES)assert.ok(!retired.includes(name));
 assert.deepEqual([...RESIDENT_GROUPS.crew].sort(),['Aya','Jun','Kai','Mac','Ms Ganaha','Ms Uezu','Ren','Ryo'],'the crew group names the people, not the job roles or the old surname');
 assert.ok(!RESIDENT_NAMES.includes('Mr Nakandakari')&&!RESIDENT_NAMES.includes('Emi')&&!RESIDENT_NAMES.includes('Chief officer'));
 assert.ok(CREW_LOOKS['Mr Nakandakari']&&recipeFor('Mac').hair.colour===CREW_LOOKS['Mr Nakandakari'].hair.colour,'Mac keeps the relief engineer’s drawing');
 assert.ok(recipeFor('Ms Ganaha').outfit&&recipeFor('Mika').outfit.top===recipeFor('Ms Ganaha').outfit.top,'the roster name and the live name draw the same person');
});

test('the Studio tools resolve the live names Mac and Ms Ganaha, in the crew group',async()=>{
 const {context,callTool}=await import('../tools/studio/tools.mjs');const ctx=await context();
 try{
  const mac=await callTool('character_get',{name:'Mac'},ctx);assert.equal(mac.error,undefined);assert.equal(mac.group,'crew');assert.equal(mac.home.id,'kitahama-flat-3');assert.match(mac.source,/CREW_LOOKS/);
  const ganaha=await callTool('character_get',{name:'Ms Ganaha'},ctx);assert.equal(ganaha.group,'crew');assert.equal(ganaha.home.id,'kitahama-flat-4');
  const crew=await callTool('character_list',{group:'crew'},ctx);assert.deepEqual(crew.characters.map(c=>c.name).sort(),['Aya','Jun','Kai','Mac','Ms Ganaha','Ms Uezu','Ren','Ryo']);
  const all=await callTool('character_list',{},ctx);for(const name of retired)assert.ok(!all.characters.some(c=>c.name===name),name+' is listed by Studio');
  for(const name of CAST_NAMES)assert.ok(all.characters.some(c=>c.name===name),name+' is missing from Studio’s list');
 }finally{await ctx.close();}
});
