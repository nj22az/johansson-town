import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {installDOM} from './fixtures.mjs';

// The wave (animate.js 'Wave', every resident's greeting): a friendly hello, never a salute (the owner, 26 October 2026:
// "He shouldn't do the Hitler salute"; the wave had raised a straight arm high and forward, the hand flat).
installDOM();

test('a wave bends the elbow, holds the forearm up beside the head and shows the palm',()=>{
 for(const name of ['Johansson','Thuan','Mr Fujita']){
  const a=buildAvatar(CAST_RECIPES[name],{shadows:false}),anim=createAvatarAnimator(a);a.root.updateMatrixWorld(true);
  const rest=a.bones.handR.getWorldQuaternion(new THREE.Quaternion());
  anim.play('Wave');
  for(let i=0;i<100;i++){
   anim.update(1/60,{speed:0});a.root.updateMatrixWorld(true);
   // (while it is up: the shoulder dips for a quarter of a second first, its wind-up (animate.js TRUNK), the arm comes up over
   // 0.4 s, eased, and goes down after 1.7 s of its 2; it was in over 0.45 s and down after 1.3 s of 1.6, with no wind-up)
   if(i<40)continue;
   const at=b=>a.bones[b].getWorldPosition(new THREE.Vector3()),s=at('shoulderR'),e=at('elbowR'),h=at('handR');
   const upper=e.clone().sub(s).normalize(),fore=h.clone().sub(e).normalize();
   assert.ok(Math.acos(THREE.MathUtils.clamp(upper.dot(fore),-1,1))>1,`${name}: the elbow bent (${upper.dot(fore).toFixed(2)})`);
   assert.ok(fore.y>.85,`${name}: the forearm up, swaying (${fore.y.toFixed(2)})`);
   assert.ok(upper.y<.45,`${name}: the upper arm out, not raised high (${upper.y.toFixed(2)})`);
   // the body faces -z; the right palm hangs facing in (-x) at rest
   const turn=a.bones.handR.getWorldQuaternion(new THREE.Quaternion()).multiply(rest.clone().invert());
   const palm=new THREE.Vector3(-1,0,0).applyQuaternion(turn);
   assert.ok(-palm.z>.6,`${name}: the palm to the front (${palm.z.toFixed(2)})`);
  }
  a.dispose();
 }
});
