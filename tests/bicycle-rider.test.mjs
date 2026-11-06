import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {bicycleRiderFit} from '../src/world/bicycle-fit.js';
import {buildBicycle} from '../src/world/bicycle.js';
import {controlVisibility} from '../src/interact/control-visibility.js';
installDOM();

test('Thuan reaches both grips and pedals throughout a complete crank revolution and turns',()=>{
 const scene=new THREE.Scene(),entity=new THREE.Group();scene.add(entity);
 entity.position.set(3,.6,-7);entity.rotation.y=1.3;
 const avatar=buildAvatar(CAST_RECIPES.Thuan),bike=buildBicycle({animated:true});entity.add(avatar.root,bike.object);
 const fit=bicycleRiderFit(avatar.measure),animator=createAvatarAnimator(avatar);bike.setRiderFit(fit);
 for(let frame=0;frame<180;frame++)animator.update(1/60,{riding:true,ridePhase:0,bicycleFit:fit});
 for(let i=0;i<=48;i++){
  const phase=i/48;animator.update(1/60,{riding:true,ridePhase:phase,bicycleFit:fit});bike.animateRide(phase,true);scene.updateMatrixWorld(true);
  const hip=avatar.bones.hips.getWorldPosition(new THREE.Vector3());entity.worldToLocal(hip);
  assert.ok(Math.abs(hip.y-avatar.measure.seatDrop-fit.saddle*fit.scale)<.001,'Hip supported by the saddle');
  assert.ok(Math.abs(hip.z-.21*fit.scale)<.001,'Pelvis centred over the saddle');
  for(const [side,sign] of [['L',-1],['R',1]]){
   const foot=avatar.bones['foot'+side].getWorldPosition(new THREE.Vector3());entity.worldToLocal(foot);
   const pedal=bike.pedals.find(p=>p.side===sign).pedal.getWorldPosition(new THREE.Vector3());entity.worldToLocal(pedal);pedal.y+=avatar.measure.foot;
   assert.ok(foot.distanceTo(pedal)<.004,`Foot ${side} on pedal at ${phase}: ${foot.distanceTo(pedal)}`);
   const hand=avatar.bones['hand'+side].getWorldPosition(new THREE.Vector3());entity.worldToLocal(hand);hand.y-=avatar.measure.hand*.55;
   const grip=new THREE.Vector3(sign*.25*fit.scale,1.04*fit.scale,-.25*fit.scale);
   assert.ok(hand.distanceTo(grip)<.006,`Hand ${side} on grip: ${hand.distanceTo(grip)}`);
  }
 }
 bike.animateRide(0,false);assert.equal(bike.stand.rotation.z,0);
 bike.animateRide(0,true);assert.ok(Math.abs(bike.stand.rotation.z)>1);
 avatar.dispose();
});

test('only spokes spin; the mudguards remain on the frame and pedals move in opposition',()=>{
 const bike=buildBicycle({animated:true});const counts=bike.wheels.map(w=>w.children[0].geometry.attributes.position.count);
 bike.animateRide(.25,true);
 assert.ok(Math.abs(bike.pedals[0].pedal.position.y+bike.pedals[1].pedal.position.y-.64)<1e-8);
 assert.notEqual(bike.pedals[0].pedal.position.y,bike.pedals[1].pedal.position.y);
 for(const w of bike.wheels)w.rotation.x=2;
 assert.equal(bike.object.children.find(o=>o.name==='commuter-bicycle-mesh').rotation.x,0);
 assert.ok(counts.every(n=>n>0));
 for(const wheel of bike.wheels){const g=wheel.children[0].geometry;g.computeBoundingBox();assert.ok(g.boundingBox.max.y<.34,'Mudguards are excluded from the rotating geometry');}
 const parked=buildBicycle();assert.equal(parked.object.children.filter(o=>o.isMesh).length,1,'Static bicycles retain one merged frame mesh');
});

test('touch dismount remains available while stopped on the bicycle',()=>{
 const state=controlVisibility({playing:true,paused:false,seated:false,moving:false,hasTarget:true});
 assert.equal(state.mobile,true);assert.equal(state.act,true);
});
