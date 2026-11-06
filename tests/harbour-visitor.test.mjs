import test from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import {CAST_RECIPES,NEIGHBOUR_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe,PARTS} from '../src/avatars/recipe.js';
import {HARBOUR_POLO_OUTFIT,ISLAND_OUTFITS,outfitAllowedFor} from '../src/avatars/outfits.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {saveResidentRecipe,residentRecipe} from '../src/avatars/wardrobe.js';
import {POLO_COLLAR} from '../src/avatars/contrast-polo-mesh.js';

test('photo-inspired adult is a complete editable recipe and survives sharing',()=>{
 const r=recipeFor('Harbour visitor');assert.equal(r.age,'adult');assert.equal(r.body.silhouette,'feminine');assert.equal(r.hair.style,'shoulder');assert.equal(r.outfit.top,'contrastpolo');assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);assert.ok(PARTS.top.includes('contrastpolo'));assert.equal(r.freckles,false);
});
test('outfit can be assigned independently to every female town resident and saved',()=>{
 const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 for(const name of ['Thuan','Thao','Nhung','Reiko','Miss Higa','Mrs Kinjō','Mrs Nakamura','Hana']){
  const original=recipeFor(name),r=normalizeRecipe({...original,outfit:{...original.outfit,...HARBOUR_POLO_OUTFIT}});
  assert.ok(outfitAllowedFor(name,r.outfit));saveResidentRecipe(name,r,storage);const saved=residentRecipe(name,storage);assert.equal(saved.outfit.top,'contrastpolo');assert.deepEqual(saved.hair,original.hair);assert.deepEqual(saved.head,original.head);assert.deepEqual(saved.body,original.body);
 }
 assert.ok(ISLAND_OUTFITS.some(p=>p.outfit===HARBOUR_POLO_OUTFIT));
});
test('Blender collar topology is valid and both sides have a finite fitted animated body',()=>{
 installDOM();assert.ok(POLO_COLLAR.vertices.length>50);assert.equal(POLO_COLLAR.indices.length%3,0);
 assert.ok(POLO_COLLAR.indices.every(i=>i>=0&&i<POLO_COLLAR.vertices.length));
 for(const height of [0,1])for(const build of [0,1]){
  const r=normalizeRecipe({...CAST_RECIPES['Harbour visitor'],body:{...CAST_RECIPES['Harbour visitor'].body,height,build}}),a=buildAvatar(r),anim=createAvatarAnimator(a);
  const normal=a.body.geometry.attributes.position.count;
  assert.ok(a.body.material.userData.garment.marks.includes('modelled collar'));
  for(const pose of [{speed:1.2},{seated:true,seatHeight:.45},{speed:3.5,running:true}]){anim.update(.1,pose);a.root.updateMatrixWorld(true);assert.ok(a.body.geometry.attributes.position.array.every(Number.isFinite));for(const bone of Object.values(a.bones))assert.ok(bone.matrixWorld.elements.every(Number.isFinite));}
  a.wear('swim');assert.equal(a.body.visible,false);assert.ok(a.root.getObjectByName('Shimanchu swimwear').visible);a.wear('clothes');assert.equal(a.body.geometry.attributes.position.count,normal);assert.equal(a.recipe.outfit.top,'contrastpolo');a.dispose();
 }
});

test('playing as the visitor preserves her skirt across save and reload',async()=>{
 const {savePlayerRecipe,playerRecipe}=await import('../src/avatars/actors.js');const values=new Map(),storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
 savePlayerRecipe(CAST_RECIPES['Harbour visitor'],storage);assert.equal(playerRecipe(storage).outfit.bottom,'pleatedskirt');assert.equal(playerRecipe(storage).name,'Harbour visitor');
});


test('Blender hairstyle is available to all ages, shapes and both part directions',()=>{
 installDOM();assert.ok(PARTS.hair.includes('sweptponytail'));
 for(const age of ['child','teen','adult','elder'])for(const form of PARTS.head)for(const flip of [false,true]){
  const r=normalizeRecipe({name:'Hair fitting',age,hair:{style:'sweptponytail',colour:'#3a2618',flip},head:{form},outfit:{top:'tee',bottom:'trousers',footwear:'shoes'}}),a=buildAvatar(r);
  assert.equal(a.recipe.hair.style,'sweptponytail');assert.ok(a.body.geometry.attributes.position.array.every(Number.isFinite));assert.ok(a.springSetup.chains.some(c=>c.kind==='hair'));assert.equal(decodeRecipe(encodeRecipe(r)).hair.style,'sweptponytail');a.dispose();
 }
});

test('every authored character shares the new parts and complete move catalogue',async()=>{
 installDOM();const {MOVES}=await import('../src/avatars/moves.js');
 for(const [name,original] of Object.entries({...CAST_RECIPES,...NEIGHBOUR_RECIPES})){
  const recipe=normalizeRecipe({...original,hair:{...original.hair,style:'sweptponytail'},outfit:{...original.outfit,...HARBOUR_POLO_OUTFIT}});
  assert.ok(outfitAllowedFor(name,recipe.outfit));const a=buildAvatar(recipe),anim=createAvatarAnimator(a);
  assert.deepEqual(a.recipe.head,original.head);
  for(const [move] of MOVES){anim.play(move);for(let frame=0;frame<3;frame++){anim.update(.1,{speed:0});a.springs.update(.1);}a.root.updateMatrixWorld(true);for(const bone of Object.values(a.bones))assert.ok(bone.matrixWorld.elements.every(Number.isFinite),name+' '+move);}
  for(const state of [{speed:1.2},{speed:3.5,running:true},{seated:true,seatHeight:.45}]){anim.stop();anim.update(.1,state);a.root.updateMatrixWorld(true);for(const bone of Object.values(a.bones))assert.ok(bone.matrixWorld.elements.every(Number.isFinite),name);}
  a.dispose();
 }
});
