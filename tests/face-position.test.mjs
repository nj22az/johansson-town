import test from 'node:test';
import assert from 'node:assert/strict';
import {hitFaceFeature,draggedFaceFields} from '../src/avatars/face-position.js';
import {faceLayout} from '../src/avatars/face.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
const r=normalizeRecipe(CAST_RECIPES.Johansson);
for(const [feature,sx,sy] of [['eyes',36,56],['brows',32,48],['nose',48,48],['mouth',56,54]]){
 test(feature+' dragging maps to existing face coordinates and clamps',()=>{
  const l=faceLayout(r),paired=['eyes','brows'].includes(feature),h=paired?'spacing':'x';
  const x=paired?128-(feature==='eyes'?l.spread:l.browSpread):l[feature+'X'];
  const y=feature==='eyes'?l.eyeY:feature==='brows'?l.browY:l[feature+'Y'];
  const hit=hitFaceFeature(r,feature,{x,y});assert.ok(hit);
  const fields=draggedFaceFields(r,hit,paired?-sx*.1:sx*.1,-sy*.1);
  assert.ok(Math.abs(fields[feature+'.'+h]-(r[feature][h]+.1))<1e-12);
  assert.ok(Math.abs(fields[feature+'.height']-(r[feature].height+.1))<1e-12);
  assert.equal(hitFaceFeature(r,feature,{x:0,y:0}),null);
  const clamped=draggedFaceFields(r,{feature,side:1},10000,-10000);
  assert.deepEqual(Object.values(clamped),[1,1]);
  const moved=structuredClone(r);for(const [at,value] of Object.entries(fields)){const [key,field]=at.split('.');moved[key][field]=value;}
  assert.deepEqual(decodeRecipe(encodeRecipe(moved)),normalizeRecipe(moved));
  assert.deepEqual(moved.body,r.body);assert.deepEqual(moved.head,r.head);
 });
}
test('paired dragging mirrors left and right',()=>{
 for(const feature of ['eyes','brows'])assert.deepEqual(draggedFaceFields(r,{feature,side:-1},-7,-5),draggedFaceFields(r,{feature,side:1},7,-5));
 assert.equal(hitFaceFeature(r,'head',{x:128,y:128}),null);
});
