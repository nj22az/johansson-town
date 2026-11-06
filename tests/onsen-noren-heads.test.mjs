import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
const {buildAvatar}=await import('../src/avatars/build.js');
const {recipeFor}=await import('../src/avatars/cast.js');
const {createAvatarAnimator}=await import('../src/avatars/animate.js');
const {ONSEN_NOREN}=await import('../src/world/interiors/onsen-lobby.js');

// The noren's measured head tops (ONSEN_NOREN.tops) are the avatars' own, and every face of the story's cast, standing just
// behind the cloth, is behind it: the slit is the only way to see one.
test('the noren knows how tall everybody’s head is, and the story’s faces are behind the cloth',()=>{
 for(const [name,top] of Object.entries(ONSEN_NOREN.tops)){
  const a=buildAvatar(recipeFor(name));createAvatarAnimator(a).update(1/60,{speed:0});a.root.updateMatrixWorld(true);
  // The head's own skin: the vertices the head bone carries.
  let lo=Infinity,hi=-Infinity;const p=new THREE.Vector3();
  a.root.traverse(o=>{if(!o.isSkinnedMesh||!o.visible)return;const {position,skinIndex,skinWeight}=o.geometry.attributes;if(!skinIndex)return;const hb=o.skeleton.bones.indexOf(a.bones.head);
   for(let i=0;i<position.count;i++)if(skinIndex.getX(i)===hb&&skinWeight.getX(i)>.9){p.fromBufferAttribute(position,i);o.applyBoneTransform(i,p);o.localToWorld(p);lo=Math.min(lo,p.y);hi=Math.max(hi,p.y);}});
  // The top of them, hair and all (the cloth meets the hair first).
  const crown=new THREE.Box3().setFromObject(a.root,true).max.y;
  assert.ok(Math.abs(crown-top)<.03,`${name}: top of the head ${crown.toFixed(3)}, the noren has ${top}`);
  if(['Mr Fujita','Thuan','Thao','Nhung','Tetsuo','Miss Higa'].includes(name)){
   // Behind the cloth: most of the head, and everything from the chin's line up (only a chin's tip may show under the hem).
   const behind=(Math.min(hi,ONSEN_NOREN.top)-Math.max(lo,ONSEN_NOREN.hem))/(hi-lo);
   assert.ok(behind>.9,`${name}: ${(behind*100).toFixed(0)}% of the head behind the cloth`);
   assert.ok(lo>ONSEN_NOREN.hem-.05,`${name}: chin at ${lo.toFixed(3)}`);
  }
 }
});
