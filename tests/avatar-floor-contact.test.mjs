import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {createAvatarAnimator,GESTURES,FUN_POSES} from '../src/avatars/animate.js';
import {createAvatarJohansson} from '../src/avatars/actors.js';
import {seatContactHeight} from './seating-contact.mjs';
installDOM();

function soles(avatar){
 const body=avatar.root.children.find(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'));
 const {position,skinIndex,skinWeight}=body.geometry.attributes,feet=['footL','footR'].map(n=>body.skeleton.bones.indexOf(avatar.bones[n])),indices=[];
 for(let i=0;i<position.count;i++)if(feet.includes(skinIndex.getX(i))&&skinWeight.getX(i)>.999)indices.push(i);
 assert.ok(indices.length>20);const p=new THREE.Vector3();
 return ()=>{avatar.root.updateMatrixWorld(true);let low=Infinity;for(const i of indices){p.fromBufferAttribute(position,i);body.applyBoneTransform(i,p);body.localToWorld(p);low=Math.min(low,p.y);}return low;};
}

test('Thuan keeps a supporting foot on the actual floor throughout every grounded gesture and outfit',()=>{
 const jumping=new Set(['Jump','Tackle','Hop','Cheer','Gasp',...Object.entries(FUN_POSES).filter(([,p])=>p.airborne).map(([n])=>n)]);   // a tackle leaves the floor: the dive itself
 const carried=new Set(['CarriedPlank']);   // laid level and lifted by the people carrying him (fujitas-back-moves tests it)
 for(const outfit of ['clothes','nozomi','sailor','swim']){
  const avatar=buildAvatar(CAST_RECIPES.Thuan);avatar.wear(outfit);
  const parent=new THREE.Group();parent.position.y=.62;parent.add(avatar.root);
  const anim=createAvatarAnimator(avatar),height=soles(avatar),floor=.2;
  for(const name of Object.keys(GESTURES)){
   anim.play(name);
   for(let frame=0;frame<120;frame++){
    anim.update(1/60,{floorHeight:floor});const y=height();
    assert.ok(y>=.62+floor-1e-5,`${outfit} ${name} sinks at ${frame}: ${y}`);
    if(!jumping.has(name)&&!carried.has(name))assert.ok(Math.abs(y-(.62+floor))<1e-5,`${outfit} ${name} loses its supporting foot: ${y}`);
   }
  }
  avatar.dispose();
 }
});

test('grounding preserves real jumps and seated support instead of snapping those poses to the floor',()=>{
 const avatar=buildAvatar(CAST_RECIPES.Thuan),anim=createAvatarAnimator(avatar),height=soles(avatar);
 anim.play('Jump');let airborne=false;
 for(let i=0;i<60;i++){anim.update(1/60);airborne||=height()>.1;assert.ok(height()>-1e-5);}
 assert.ok(airborne,'The jump still leaves the floor');
 anim.stop();for(let i=0;i<120;i++)anim.update(1/60,{seated:true,seatHeight:.71});
 assert.ok(Math.abs(seatContactHeight(avatar)-.71)<1e-5,'The rendered seat remains its support');avatar.dispose();
});

test('Johansson greets with a small inclination, including after an appearance change',()=>{
 const actor=createAvatarJohansson({scene:new THREE.Scene()});
 for(const recipe of [null,{...CAST_RECIPES.Johansson,name:'Custom Johansson'}]){
  if(recipe)actor.setRecipe(recipe);actor.play('Bow');let most=0;
  for(let i=0;i<90;i++){actor.update(1/60,{visible:true});most=Math.max(most,actor.avatar.bones.chest.rotation.x+actor.avatar.bones.spine.rotation.x);}
  assert.ok(most>.1&&most<.3,`A relaxed greeting, below17 degrees: ${most}`);
 }
});
