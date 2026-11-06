import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';

test('a boss playing pretend is plainly the townsperson: their own avatar, hood for a hat, paws and a tail',async()=>{
 installDOM();
 const {buildPretend}=await import('../src/dungeon/pretend.js');
 const {recipeFor}=await import('../src/avatars/cast.js');
 const {COSTUMES}=await import('../src/dungeon/costumes.js');
 for(const who of ['Officer Mori','Tetsuo','Mrs Sato']){
  const p=buildPretend(who,{faceSize:64,shadows:false});
  assert.deepEqual(p.avatar.recipe.outfit,recipeFor(who).outfit,who+' wears their own clothes, not a suit');
  assert.equal(p.avatar.hatOn,false,'the hood stands in for the hat');
  assert.ok(p.bones.head.children.includes(p.hood),'hood on the head');assert.equal(p.look.animal,COSTUMES[who].animal);
  assert.equal(p.paws.length,2);assert.ok(p.bones.handL.children.includes(p.paws[0])&&p.bones.handR.children.includes(p.paws[1]));
  const hand=new THREE.Box3().setFromObject(p.paws[0]);assert.ok(hand.max.x-hand.min.x>p.avatar.measure.hand*2,'a paw big enough to see over the hand');
  if(COSTUMES[who].animal==='gorilla')assert.equal(p.tail,null);else assert.ok(p.bones.hips.children.includes(p.tail));
  assert.equal(p.root.rotation.y,0,'facing +z, as the stockroom’s bosses do');
  p.face('angry');p.dispose();
 }
});
