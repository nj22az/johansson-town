import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
const {buildVehicle}=await import('../src/world/road-vehicles.js');
const {buildAvatar}=await import('../src/avatars/build.js');
const {createAvatarAnimator}=await import('../src/avatars/animate.js');
const {gripWheel}=await import('../src/avatars/consume.js');
const {CAST_RECIPES}=await import('../src/avatars/cast.js');

test('a driver holds the steering wheel at nine and three, in every vehicle and at every height',()=>{
 for(const kind of ['car','kei truck','delivery truck'])for(const name of ['Chin','Thao','Johansson']){
  const v=buildVehicle(kind,'#d8342c'),seat=v.userData.driverSeat,wheel=v.userData.steeringWheel;
  assert.ok(wheel,kind+' says where its wheel is');
  v.rotation.y=.7;v.position.set(3,0,-2);
  const a=buildAvatar(CAST_RECIPES[name],{shadows:false,faceSize:64}),body=new THREE.Group();body.add(a.root);v.add(body);
  body.position.set(seat.x,0,seat.z);body.rotation.set(0,Math.PI,0);
  const anim=createAvatarAnimator(a);for(let i=0;i<30;i++)anim.update(1/30,{seated:true,seatHeight:seat.y,driving:true,pose:'Sit',floorHeight:.22});
  gripWheel(a,v,wheel,1.3);a.root.updateMatrixWorld(true);
  const rim=[0,Math.PI].map(t=>v.localToWorld(new THREE.Vector3(wheel.x+Math.cos(t)*wheel.r,wheel.y,wheel.z)));
  for(const side of ['L','R']){
   const wrist=a.bones['hand'+side].getWorldPosition(new THREE.Vector3()),near=Math.min(...rim.map(p=>p.distanceTo(wrist)));
   assert.ok(near<.05,kind+' '+name+' '+side+' hand is on the rim ('+near.toFixed(3)+' m)');
  }
  const l=a.bones.handL.getWorldPosition(new THREE.Vector3()),r=a.bones.handR.getWorldPosition(new THREE.Vector3());
  assert.ok(l.distanceTo(r)>wheel.r*1.6,'one hand each side');
  a.dispose();
 }
});
