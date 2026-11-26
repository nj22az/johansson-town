// The sun's shadow on every device, free of acne (the owner's iPad, 26 November 2026: diagonal saw-toothed bands on the
// Minato Maru's white walls). Measured in the running game by tools/flicker-audit.mjs; this holds the cause found
// (render/sun-shadow.js) so it cannot come back: a normal bias fixed in metres, under a texel on a tablet's smaller map.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {graphicsProfile} from '../src/render/startup-recovery.js';
import {SUN_NORMAL_BIAS_TEXELS,sunShadowBias} from '../src/render/sun-shadow.js';

const tiers={desktop:graphicsProfile({}),tablet:graphicsProfile({mobile:true,tablet:true}),phone:graphicsProfile({mobile:true})};

test('the normal bias is the same number of shadow texels on every map, and more than the filter reaches',()=>{
 // PCF compares a texel either side; a bias under one texel lets those comparisons fall either side of the face itself.
 assert.ok(SUN_NORMAL_BIAS_TEXELS>1.5,'normal bias in texels: '+SUN_NORMAL_BIAS_TEXELS);
 for(const [name,p] of Object.entries(tiers)){
  if(!p.shadows)continue;
  const b=sunShadowBias(p),texel=2*p.shadowRadius/p.shadowSize;
  assert.ok(Math.abs(b.normalBias/texel-SUN_NORMAL_BIAS_TEXELS)<.01,name+': '+b.normalBias+' m over '+texel+' m texels');
 }
 // The desktop keeps the bias it was tuned with; the tablet's map is half as fine, so its bias is twice as long.
 assert.equal(sunShadowBias(tiers.desktop).normalBias,.045);
 assert.equal(sunShadowBias(tiers.tablet).normalBias,.09);
});

test('the game takes the sun’s biases from sun-shadow.js, with no bias of its own',async()=>{
 const game=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 assert.match(game,/sunShadowBias\(graphics\)/);
 assert.doesNotMatch(game,/sun\.shadow\.normalBias\s*=\s*[.\d]/,'a normal bias in metres in game.js');
});
