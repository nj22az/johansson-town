import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRecipe,PARTS} from '../src/avatars/recipe.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';

test('somebody new starts in the base layer: tank top, underwear, bare feet',()=>{
 const o=normalizeRecipe({}).outfit;
 assert.deepEqual([o.top,o.bottom,o.footwear,o.hat],['tank','underwear','barefoot','none']);
 assert.equal(PARTS.top[0],'tank');assert.equal(PARTS.bottom[0],'underwear');assert.equal(PARTS.footwear[0],'barefoot');
});

test('people dressed before the wardrobe existed stay dressed',()=>{
 const o=normalizeRecipe({outfit:{hat:'cap',shoes:'#2b2b2b'}}).outfit;
 assert.deepEqual([o.top,o.bottom,o.footwear],['tee','trousers','sneakers']);
 for(const [name,r] of Object.entries(CAST_RECIPES))assert.notEqual(r.outfit.top,'tank',name+' is dressed');
 assert.equal(CAST_RECIPES.Johansson.outfit.footwear,'sandals');
 assert.equal(CAST_RECIPES.Johansson.outfit.top,'kariyushi');
});
