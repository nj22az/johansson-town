import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recipeFor,baseRecipe,RESIDENT_NAMES,RESIDENT_GROUPS,CAST_RECIPES,NEIGHBOUR_RECIPES,RETIRED_RECIPE_NAMES} from '../src/avatars/cast.js';
import {LOOKS} from '../src/avatars/looks-data.js';
import {LOOK_PATHS,LOOK_FIELDS,applyLook,readPath} from '../src/avatars/looks.js';
import {normalizeRecipe,DEFAULT_RECIPE} from '../src/avatars/recipe.js';
import {PROFILES} from '../src/people/profiles.js';
import {WARDROBE_KEY} from '../src/avatars/wardrobe.js';
import {CAST_NAMES,liveNameFor} from '../src/people/cast.js';
import {identityOf} from '../src/people/roster.js';

// Everybody World asks recipeFor about: the island's cast (people/cast.js), the residents (PROFILES, and Thuan in the
// cast; residents.js draws its list from these), the neighbours (NEIGHBOUR_RECIPES: everyone in neighbours.js), the
// drawn cast, and a name nobody has. (residents.js and neighbours.js themselves pull in the whole island.)
const NAMES=[...new Set([...CAST_NAMES,...PROFILES.map(p=>p.name),...Object.keys(CAST_RECIPES),...Object.keys(NEIGHBOUR_RECIPES),'Somebody new'])];
const json=JSON.stringify;

test('with no published looks, every resident is drawn exactly as before (byte for byte)',()=>{
 assert.ok(NAMES.length>CAST_NAMES.length,`${NAMES.length} names`);
 for(const name of NAMES){
  assert.equal(json(recipeFor(name,{looks:{}})),json(baseRecipe(name)),name);
  if(!Object.hasOwn(LOOKS,name))assert.equal(json(recipeFor(name)),json(baseRecipe(name)),`${name} has no published look`);
 }
});

test('a published look changes only its fields; name, age and profile (gait and voice) stay',()=>{
 const set={'outfit.hat':'captain','hair.colour':'#9a9a96','body.height':.8};
 for(const name of ['Mr Fujita','Thuan','Mrs Kinjō']){
  const base=baseRecipe(name),looked=recipeFor(name,{looks:{[name]:{set}}});
  for(const path of LOOK_PATHS)assert.deepEqual(readPath(looked,path),Object.hasOwn(set,path)?set[path]:readPath(base,path),`${name} ${path}`);
  assert.deepEqual(looked.profile,base.profile);assert.equal(looked.name,name);assert.equal(looked.age,base.age);
 }
 // A look can never reach a voice or a name, whatever it says.
 const sneaky=recipeFor('Mr Fujita',{looks:{'Mr Fujita':{set:{'profile.pitch':1,name:'Somebody else','outfit.hat':'cap'}}}});
 assert.deepEqual(sneaky.profile,baseRecipe('Mr Fujita').profile);assert.equal(sneaky.name,'Mr Fujita');assert.equal(sneaky.outfit.hat,'cap');
});

test('the look this device\'s maker saved still comes first',async()=>{
 const {saveResidentRecipe}=await import('../src/avatars/wardrobe.js');
 const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 try{
  saveResidentRecipe('Chin',normalizeRecipe({...baseRecipe('Chin'),hair:{style:'afro',colour:'#1c1714'}}));assert.ok(store.has(WARDROBE_KEY));
  assert.equal(recipeFor('Chin',{looks:{Chin:{set:{'hair.style':'buzz'}}}}).hair.style,'afro');
 }finally{delete globalThis.localStorage;}
});

test('look fields are worked out from the recipe and stay in step with the maker\'s own lists',()=>{
 for(const left of ['v','name','facial.style'])assert.ok(!LOOK_PATHS.includes(left),left);
 assert.ok(!LOOK_PATHS.some(p=>p.startsWith('profile')),'profile is never a look');
 for(const path of ['age','outfit.hat','hair.colour','body.height','accessories.pin','facial.moustache','swim.bath'])assert.ok(LOOK_PATHS.includes(path),path);
 for(const [path,field] of Object.entries(LOOK_FIELDS)){
  assert.notEqual(field.kind,'unknown',path);
  // Every word Studio offers survives normalizeRecipe, so a published look is drawn as chosen.
  if(field.kind==='word')for(const word of field.words)assert.equal(readPath(normalizeRecipe(applyLook(DEFAULT_RECIPE,{[path]:word})),path),word,`${path}=${word}`);
 }
});

test('the resident groups cover everybody once, and the Studio pickers can name them all',()=>{
 assert.equal(new Set(RESIDENT_NAMES).size,RESIDENT_NAMES.length);
 // Harbour visitor is the maker's starting template (creator.js), not a resident: it has no look to change.
 // Nor is anybody the roster retired (people/roster.js RETIRED; phase 5 of docs/CAST-CONSOLIDATION.md, recorded in
 // johansson-town/AGENTS.md): their drawings stay in CAST_RECIPES for history stories, their names in no live list.
 assert.deepEqual([...RESIDENT_GROUPS.cast],Object.keys(CAST_RECIPES).filter(n=>n!=='Harbour visitor'&&!RETIRED_RECIPE_NAMES.includes(n)));
 for(const n of RETIRED_RECIPE_NAMES)assert.ok(!RESIDENT_NAMES.includes(n),n+' is retired');
 assert.ok(!RESIDENT_NAMES.includes('Harbour visitor'));
 // A townsfolk profile whose name the roster now gives to somebody else (Emi is Mrs Nakamura's display name,
 // docs/CAST-CONSOLIDATION.md) is that person: Studio names her, not a second resident called Emi.
 for(const p of PROFILES)if(!RETIRED_RECIPE_NAMES.includes(p.name))assert.ok(RESIDENT_NAMES.includes(liveNameFor(p.name)===p.name?p.name:identityOf(p.name)?.avatar||p.name),p.name);
 for(const n of Object.keys(NEIGHBOUR_RECIPES))if(!RETIRED_RECIPE_NAMES.includes(n))assert.ok(RESIDENT_NAMES.includes(n),n);
});

test('the player without a saved look is Johansson as World draws him, so a published look reaches the player too',async()=>{
 const {playerRecipe}=await import('../src/avatars/actors.js');
 const empty={getItem:()=>null,setItem(){},removeItem(){}};
 assert.equal(json(playerRecipe(empty)),json(recipeFor('Johansson')));
 if(!Object.hasOwn(LOOKS,'Johansson'))assert.equal(json(playerRecipe(empty)),json(CAST_RECIPES.Johansson),'with no published look, exactly as before');
});
