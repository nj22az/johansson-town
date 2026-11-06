import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {measure} from '../src/avatars/build.js';
import {CAST_RECIPES,NEIGHBOUR_RECIPES,recipeFor} from '../src/avatars/cast.js';

test('silhouette is saved explicitly and old recipes retain a safe neutral body',()=>{assert.equal(normalizeRecipe({body:{build:.3}}).body.silhouette,'neutral');assert.equal(normalizeRecipe({body:{silhouette:'invalid'}}).body.silhouette,'neutral');for(const silhouette of ['neutral','feminine','masculine']){const r=normalizeRecipe({body:{silhouette}});assert.equal(decodeRecipe(encodeRecipe(r)).body.silhouette,silhouette);}});

test('body silhouettes change shoulders, waist and hips independently of height, head or face',()=>{const r=normalizeRecipe({body:{height:.5,build:.5}}),f=measure({...r,body:{...r.body,silhouette:'feminine'}}),m=measure({...r,body:{...r.body,silhouette:'masculine'}});assert.equal(f.H,m.H);assert.equal(f.Rh,m.Rh);assert.ok(f.width<m.width);assert.ok(f.hips/f.width>m.hips/m.width);assert.ok(f.waistRatio<m.waistRatio);assert.ok(f.hand>0&&f.neck>0);assert.equal(CAST_RECIPES.Thuan.body.silhouette,'feminine');assert.equal(CAST_RECIPES.Johansson.body.silhouette,'masculine');});

test('the authored village and profiled residents have explicit body silhouettes',async()=>{const {PROFILES}=await import('../src/people/profiles.js');for(const [name,r] of Object.entries({...CAST_RECIPES,...NEIGHBOUR_RECIPES}))assert.notEqual(r.body.silhouette,'neutral',name+' uses an authored silhouette');for(const p of PROFILES)if(typeof p.female==='boolean')assert.equal(recipeFor(p.name).body.silhouette,p.female?'feminine':'masculine',p.name);assert.equal(recipeFor('Mrs Kinjō').body.silhouette,'feminine');assert.equal(recipeFor('Postman Tōma').body.silhouette,'masculine');});
