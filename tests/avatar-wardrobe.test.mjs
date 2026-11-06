import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {normalizeRecipe,PARTS} from '../src/avatars/recipe.js';
import {CAST_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {residentRecipe,saveResidentRecipe,adoptResidentAppearance,WARDROBE_KEY,APPEARANCE_REVISION_KEY} from '../src/avatars/wardrobe.js';
import {buildAvatar,buildHatProp} from '../src/avatars/build.js';
import {createLocalCharacters} from '../src/people/models.js';

test('straw hats have an open underside and a crown above every head shape',()=>{
 for(const form of PARTS.head){const r=normalizeRecipe({...recipeFor('Mr Ōshiro'),head:{...recipeFor('Mr Ōshiro').head,form}}),hat=buildHatProp(r,{mode:'stand'});hat.updateMatrixWorld(true);const ray=new THREE.Raycaster(new THREE.Vector3(0,-.1,0),new THREE.Vector3(0,1,0),0,.15);assert.equal(ray.intersectObject(hat).length,0,'head enters through an opening: '+form);hat.geometry.dispose();hat.material.dispose();}
});

test('each resident keeps independent saved hair, hats and clothes and refreshes without duplication',()=>{
 installDOM();const entries=new Map(),store={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)},old=globalThis.localStorage;globalThis.localStorage=store;
 try{saveResidentRecipe('Mr Ōshiro',{...recipeFor('Mr Ōshiro'),hair:{style:'bun'},outfit:{hat:'bucket',top:'jacket'}});assert.equal(residentRecipe('Mr Ōshiro',store).hair.style,'bun');assert.equal(recipeFor('Mr Ōshiro').outfit.hat,'bucket');assert.equal(residentRecipe('Thuan',store),null);
 const entity=new THREE.Group();entity.userData.name='Mr Ōshiro';const models=createLocalCharacters(),actor=models.attach(entity,'Mr Ōshiro');saveResidentRecipe('Mr Ōshiro',{...actor.avatar.recipe,outfit:{...actor.avatar.recipe.outfit,hat:'beret'}});assert.equal(models.refresh(entity),true);assert.equal(models.actors.length,1);assert.equal(actor.avatar.recipe.outfit.hat,'beret');assert.equal(entity.children.length,1);models.update(.1);actor.avatar.dispose();
 }finally{globalThis.localStorage=old;}
});

test('all hairstyles combine with every hat without invalid skinned geometry',()=>{
 installDOM();for(const style of PARTS.hair)for(const hat of PARTS.hat){const a=buildAvatar({...CAST_RECIPES.Thuan,hair:{...CAST_RECIPES.Thuan.hair,style},outfit:{...CAST_RECIPES.Thuan.outfit,hat}});for(const value of a.body.geometry.attributes.position.array)assert.ok(Number.isFinite(value));a.dispose();}
});


test('taking off a hat restores the original hairstyle and putting it on tucks it back',()=>{
 installDOM();const a=buildAvatar({...CAST_RECIPES.Thuan,hair:{...CAST_RECIPES.Thuan.hair,style:'bun'},outfit:{...CAST_RECIPES.Thuan.outfit,hat:'cap'}});
 const tucked=a.body.geometry.attributes.position.array.slice();a.setHat(false);assert.notDeepEqual(a.body.geometry.attributes.position.array,tucked,'original bun emerges when the hat is hung up');a.setHat(true);assert.deepEqual(a.body.geometry.attributes.position.array,tucked,'hat fits exactly as before');a.dispose();
});

test('shared wardrobe preserves every character’s chosen outfit across save and reload',async()=>{
 const {outfitAllowedFor}=await import('../src/avatars/outfits.js');
 const {playerRecipe,savePlayerRecipe,PLAYER_RECIPE_KEY}=await import('../src/avatars/actors.js');
 const {encodeRecipe,normalizeRecipe}=await import('../src/avatars/recipe.js');
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 const outfit={...CAST_RECIPES.Johansson.outfit,top:'sundress',bottom:'pleatedskirt'};
 assert.equal(outfitAllowedFor('Johansson',outfit),true);assert.equal(outfitAllowedFor('Thuan',outfit),true);
 storage.setItem(PLAYER_RECIPE_KEY,encodeRecipe({...CAST_RECIPES.Johansson,outfit}));
 assert.equal(playerRecipe(storage).outfit.bottom,'pleatedskirt');assert.equal(playerRecipe(storage).outfit.top,'sundress');assert.equal(normalizeRecipe(playerRecipe(storage)).outfit.bottom,'pleatedskirt','Chosen wardrobe must survive the renderer’s recipe normalization');
 savePlayerRecipe({...CAST_RECIPES.Johansson,outfit},storage);assert.equal(outfitAllowedFor('Johansson',playerRecipe(storage).outfit),true);
});


test('Vy adopts the approved appearance once, keeps her profile and respects later edits',async()=>{
 const {encodeRecipe}=await import('../src/avatars/recipe.js');
 const entries=new Map(),storage={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)};
 const canonical=recipeFor('Vy'),old=normalizeRecipe({...canonical,head:{...canonical.head,form:'round'},body:{...canonical.body,proportion:'classic'},outfit:{...canonical.outfit,skirtCut:'classic'},profile:{...canonical.profile,pitch:.91,catchphrase:'Guava first'}});
 const other=normalizeRecipe({...recipeFor('Thuan'),outfit:{...recipeFor('Thuan').outfit,hat:'beret'}});
 storage.setItem(WARDROBE_KEY,JSON.stringify({Vy:encodeRecipe(old),Thuan:encodeRecipe(other)}));
 const adopted=adoptResidentAppearance('Vy',canonical,storage);
 assert.deepEqual(adopted.head,canonical.head);assert.deepEqual(adopted.body,canonical.body);assert.deepEqual(adopted.outfit,canonical.outfit);assert.deepEqual(adopted.profile,old.profile);
 assert.deepEqual(residentRecipe('Vy',storage),adopted);assert.deepEqual(residentRecipe('Thuan',storage),other);
 assert.equal(JSON.parse(storage.getItem(APPEARANCE_REVISION_KEY)).Vy,1);
 const edited=saveResidentRecipe('Vy',{...adopted,outfit:{...adopted.outfit,bottomColour:'#ffcc00'}},storage);
 assert.deepEqual(adoptResidentAppearance('Vy',canonical,storage),edited,'later deliberate edits survive repeated startup');
 assert.deepEqual(adoptResidentAppearance('Vy',canonical,null),canonical,'works when browser storage is unavailable');
});


test('a saved player using old Vy upgrades once and keeps later wardrobe edits',async()=>{
 const {playerRecipe,savePlayerRecipe,PLAYER_RECIPE_KEY}=await import('../src/avatars/actors.js');
 const {encodeRecipe}=await import('../src/avatars/recipe.js');
 const entries=new Map(),storage={getItem:k=>entries.get(k),setItem:(k,v)=>entries.set(k,v)};
 const canonical=recipeFor('Vy');
 storage.setItem(PLAYER_RECIPE_KEY,encodeRecipe({...canonical,body:{...canonical.body,proportion:'classic'},outfit:{...canonical.outfit,skirtCut:'classic'}}));
 const adopted=playerRecipe(storage);assert.equal(adopted.body.proportion,'studio');assert.equal(adopted.outfit.skirtCut,'panel');
 savePlayerRecipe({...adopted,outfit:{...adopted.outfit,bottomColour:'#ffcc00'}},storage);
 assert.equal(playerRecipe(storage).outfit.bottomColour,'#ffcc00');
});
