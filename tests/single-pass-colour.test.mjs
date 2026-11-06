import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {useTownColour,TOWN_TONE_MAPPING} from '../src/render/single-pass-colour.js';
import {graphicsProfile} from '../src/render/startup-recovery.js';

test('the single-pass colour treatment survives recovery without targets or duplicate shader definitions',()=>{
 const renderer={toneMapping:THREE.AgXToneMapping,toneMappingExposure:.96};
 const before=THREE.ShaderChunk.tonemapping_pars_fragment;
 useTownColour(renderer);useTownColour(renderer);
 assert.equal(renderer.toneMapping,THREE.CustomToneMapping);
 const chunk=THREE.ShaderChunk.tonemapping_pars_fragment;
 assert.equal(chunk.split('vec3 CustomToneMapping(').length,2);
 assert.ok(chunk.includes(TOWN_TONE_MAPPING));
 assert.equal(chunk.replace(TOWN_TONE_MAPPING,'vec3 CustomToneMapping( vec3 color ) { return color; }'),before);
 assert.match(TOWN_TONE_MAPPING,/toneMappingExposure/,'the clock still controls exposure');
 assert.doesNotMatch(TOWN_TONE_MAPPING,/texture2D|sampler|uniform/,'colour requires no extra textures or uniform plumbing');
 const phone=graphicsProfile({mobile:true,ios:true,safe:true});
 assert.equal(phone.postprocess,false);assert.equal(phone.streamDetails,false);assert.equal(phone.canvasPixels,650000);
});
