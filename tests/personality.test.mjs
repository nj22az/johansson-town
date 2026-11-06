import test from 'node:test';
import assert from 'node:assert/strict';
import {PERSONALITIES,personalityOf,dialStep,stepValue,voiceOf,hello,DIAL_STEPS} from '../src/avatars/personality.js';
import {normalizeRecipe,decodeRecipe,encodeRecipe} from '../src/avatars/recipe.js';

test('the four dials give sixteen distinct, original personalities',()=>{
 assert.equal(PERSONALITIES.length,16);assert.equal(new Set(PERSONALITIES.map(p=>p.name)).size,16);
 const seen=new Set();
 for(let i=0;i<16;i++){const b=k=>(i>>k)&1?stepValue(8):stepValue(1);seen.add(personalityOf({pace:b(3),talk:b(2),show:b(1),outlook:b(0)}).name);}
 assert.equal(seen.size,16);
 assert.equal(personalityOf({pace:1,talk:1,show:1,outlook:1}).name,'Typhoon');
 assert.equal(personalityOf({pace:0,talk:0,show:0,outlook:0}).name,'Lighthouse keeper');
});

test('dial steps round-trip through the stored value',()=>{
 for(let s=1;s<=DIAL_STEPS;s++)assert.equal(dialStep(stepValue(s)),s);
 assert.equal(dialStep(0),1);assert.equal(dialStep(1),8);assert.equal(dialStep('junk'),dialStep(.5));
});

test('a profile is stored, cleaned and shared with the recipe',()=>{
 const r=normalizeRecipe({name:'Mei',profile:{pace:2,month:2,day:31,catchphrase:'Haisai!<script>',favourite:'red',pitch:.9}});
 assert.equal(r.profile.pace,1);assert.equal(r.profile.day,29);assert.equal(r.profile.favourite,'#3fa0c8');
 assert.ok(!r.profile.catchphrase.includes('<'));
 assert.deepEqual(decodeRecipe(encodeRecipe(r)).profile,r.profile);
 // Old saves without a profile still load, as a middle-of-the-road islander.
 assert.equal(normalizeRecipe({}).profile.month,7);
});

test('voices follow the dials, and the hello uses the name and catchphrase',()=>{
 assert.ok(voiceOf({pitch:1}).freq>voiceOf({pitch:0}).freq);
 assert.ok(voiceOf({speed:1}).letterMs<voiceOf({speed:0}).letterMs);
 const line=hello(normalizeRecipe({name:'Mei',profile:{talk:1,show:1,catchphrase:'Haisai!'}}));
 assert.match(line,/Mei/);assert.match(line,/Haisai!/);assert.match(line,/I'm Mei/);
});
