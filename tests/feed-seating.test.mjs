import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {seatContactHeight} from './seating-contact.mjs';

installDOM();
const {blocking}=await import('../src/feed/comic.js');
const {buildAvatar}=await import('../src/avatars/build.js');
const {createAvatarAnimator}=await import('../src/avatars/animate.js');
const {CAST_RECIPES}=await import('../src/avatars/cast.js');
const views=JSON.parse(await readFile(new URL('../assets/images/feed/views.json',import.meta.url)));
const camera=view=>{const c=new THREE.PerspectiveCamera(view.camera.fov,view.camera.aspect,.1,200);c.position.fromArray(view.camera.position);c.quaternion.fromArray(view.camera.quaternion);c.updateMatrixWorld(true);return c;};

test('the comic sets carry the game’s own seats, with their height and facing',()=>{
 for(const id of ['minato','sato-ramen']){
  const seats=Object.values(views[id]).flatMap(v=>v.seats||[]);
  assert.ok(seats.length>=2,id+' has seats in view');
  for(const s of seats){
   assert.ok(Number.isFinite(s.yaw),id+' seat faces a way');
   const height=s.surfaceY-s.position[1];assert.ok(height>.35&&height<.6,id+' seat is chair height, not '+height);
  }
 }
 for(const view of Object.values(views).flatMap(Object.values))assert.equal(view.spots.seat,undefined,'seats come from the game, not from rays');
});

test('residents sit on real seats a conversation apart, facing the camera',()=>{
 for(const seed of [3,7,11,19]){
  const marks=blocking(views.minato,2,seed,true);
  assert.deepEqual(marks,blocking(views.minato,2,seed,true),'the same strip seats people the same way');
  assert.equal(marks.length,2);assert.ok(marks.every(m=>m.seat),'both sit at Minato');
  const gap=Math.hypot(marks[0].x-marks[1].x,marks[0].z-marks[1].z);assert.ok(gap>.55&&gap<2.2,'a conversation apart, not '+gap);
  const cam=camera(views.minato.wide).position;
  for(const m of marks){
   const d=Math.hypot(cam.x-m.x,cam.z-m.z),face=(-Math.sin(m.seat.yaw)*(cam.x-m.x)-Math.cos(m.seat.yaw)*(cam.z-m.z))/d;
   assert.ok(face>=.3,'a sitter faces the camera, not their back to it');
  }
 }
 // With one seat that suits, the other resident stands by, never on top of anyone.
 const ramen=blocking(views['sato-ramen'],3,5,true);
 assert.ok(ramen.some(m=>m.seat));
 for(const a of ramen)for(const b of ramen)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.z-b.z)>.55,'nobody stands inside anyone');
 // Where there is nowhere to sit, everyone stands.
 for(const id of ['harbour','pier','sakura'])assert.ok(blocking(views[id],2,5,true).every(m=>!m.seat),id+' has nowhere to sit');
});

test('a seated resident stays on the seat through any gesture',()=>{
 const avatar=buildAvatar(CAST_RECIPES.Johansson,{shadows:false});
 for(const name of ['Bow','Cheer','Tada','HeelKick','Point','CheekRest']){
  const animator=createAvatarAnimator(avatar);animator.play(name);
  for(let t=0;t<1.2;t+=1/40)animator.update(1/40,{seated:true,seatHeight:.46});
  assert.ok(Math.abs(seatContactHeight(avatar)-.46)<.01,name+' keeps the sitter on the seat');
 }
 avatar.dispose();
});
