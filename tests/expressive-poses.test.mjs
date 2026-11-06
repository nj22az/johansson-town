import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPRESSIVE_POSES,expressiveEmotion} from '../src/avatars/expressive-poses.js';
import {GESTURES} from '../src/avatars/animate.js';
import {EXPRESSION_NAMES} from '../src/avatars/face.js';
import {MOVES} from '../src/avatars/moves.js';
import {POSES as photos} from '../src/photo/layout.js';
import {KNOWN_POSES,POSES as studio} from '../../avatar-creator/scene-catalogue.mjs';
test('reference poses are shared by World, Studio and photo exports, with valid matched emotions',()=>{
 assert.equal(Object.keys(EXPRESSIVE_POSES).length,9);
 for(const [name,p] of Object.entries(EXPRESSIVE_POSES)){
  assert.equal(GESTURES[name],Infinity);assert.ok(MOVES.some(([n])=>n===name));assert.ok(photos.includes(name));assert.ok(KNOWN_POSES.has(name)&&studio.includes(name));
  assert.ok(EXPRESSION_NAMES.includes(expressiveEmotion(name)),name+' has a painted expression');
  for(const [bone,angles] of Object.entries(p.joints)){assert.match(bone,/^(hips|chest|head|shoulder[LR]|elbow[LR]|hand[LR]|thigh[LR]|knee[LR]|foot[LR])$/);assert.equal(angles.length,3);assert.ok(angles.every(n=>Number.isFinite(n)&&Math.abs(n)<=Math.PI));}
 }
 for(const name of ['ChickenDance','JellyWobble','DramaFinish','RockBelt'])assert.ok(EXPRESSION_NAMES.includes(expressiveEmotion(name)));
 assert.equal(expressiveEmotion('Unknown'),undefined);
});
