import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {createAvatarAnimator,GESTURES} from '../src/avatars/animate.js';
installDOM();

test('combat gestures supersede dining without the mouth IK overriding the fists',()=>{
 for(const name of ['Fist','Jab','JabL','Swipe','Hurt']){
  const a=buildAvatar(CAST_RECIPES.Johansson),anim=createAvatarAnimator(a);
  anim.play('SitDrink');anim.update(1.2,{seated:true});assert.ok(anim.consumption);
  assert.ok(anim.play(name),name+' remains registered');anim.update(GESTURES[name]/3);
  assert.equal(anim.gesture,name);assert.equal(anim.consumption,null);
  assert.ok(Math.abs(a.bones.shoulderR.rotation.x)>.1,name+' moves the arm');
  a.root.updateMatrixWorld(true);assert.ok(a.bones.handR.matrixWorld.elements.every(Number.isFinite));
  anim.update(GESTURES[name]);assert.equal(anim.gesture,null);a.dispose();
 }
});
