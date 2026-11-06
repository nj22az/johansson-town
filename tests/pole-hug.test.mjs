import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {poleHugPole,POLE_RADIUS} from '../src/avatars/fun-poses.js';
import {surface} from './body-contact.mjs';
installDOM();

// Up the pole (FUN_POSES.PoleHug) round a real pole: Johansson Studio's collision check found the nobori pole through Officer
// Mori's face in The Haunted Vending Machine (the creator, 2026-10-14: "the world should have its collisions intact even when
// we Make films"), and then a hug beside the pole that read as a man with his arms crossed. The hug now has the pole before
// the chest (poleHugPole), the head tipped back and turned out with one cheek to it (PoleHug: the right, PoleHugR: the
// left), both arms round it. No part of the body goes into the pole (a centimetre at most: the film's own tolerance) at any
// moment of the hold, as the body sways; and both mittens close round it, one either side, their middles beyond its axis.
const mitten=(avatar,s)=>avatar.root.worldToLocal(avatar.bones['hand'+s].localToWorld(new THREE.Vector3(0,-avatar.measure.hand*.55,0)));
for(const side of ['L','R'])test(`every resident hugs a real pole before the chest, the ${side==='L'?'right':'left'} cheek to it, without going into it, both mittens round it`, ()=>{
 for(const [who,recipe] of Object.entries(CAST_RECIPES)){
  const avatar=buildAvatar(recipe),anim=createAvatarAnimator(avatar,{lively:false});
  const [px,pz]=poleHugPole(avatar.measure,POLE_RADIUS,avatar,side);
  anim.play(side==='L'?'PoleHug':'PoleHugR');
  let deepest=0,where='';
  for(let i=0;i<240;i++){
   anim.update(1/60,{airborne:true});
   if(i<56||i%10)continue;   // from when the hug has closed (its ramp, 0.9 s), every sixth of a second
   avatar.root.updateMatrixWorld(true);
   for(const {p,bone} of surface(avatar,{stride:2})){
    const q=avatar.root.worldToLocal(p.clone()),d=POLE_RADIUS-Math.hypot(q.x-px,q.z-pz);
    if(d>deepest){deepest=d;where=`${bone} at ${q.y.toFixed(2)} m, ${(i/60).toFixed(2)} s`;}
   }
  }
  assert.ok(deepest<=.01,`${who} (${side}): ${(deepest*1000).toFixed(0)} mm into the pole (${where})`);
  for(const [s,o] of [['L',1],['R',-1]]){
   const h=mitten(avatar,s);
   assert.ok(h.z>pz&&(h.x-px)*o>POLE_RADIUS&&Math.abs(h.x-px)<.16,`${who} (${side}): the ${s==='L'?'left':'right'} mitten (${h.x.toFixed(2)}, ${h.z.toFixed(2)}) is not round its side of the pole (${px.toFixed(2)}, ${pz.toFixed(2)})`);
  }
  avatar.dispose?.();
 }
});

test('the pole stands ahead of the chest, by the cheek, clear of the turned head, within the arms\' reach', ()=>{
 for(const who of ['Officer Mori','Thuan','Mr Fujita','Harbour master']){
  const avatar=buildAvatar(CAST_RECIPES[who]),m=avatar.measure,[x,z]=poleHugPole(m,POLE_RADIUS,avatar);
  assert.ok(x<0&&Math.abs(x)<.1,`${who}: by the right cheek (PoleHug turns the face out to the left), not beside the head`);
  assert.deepEqual(poleHugPole(m,POLE_RADIUS,avatar,'R'),[-x,z],'the left cheek\'s pole is the right\'s mirrored');
  assert.ok(z>m.depth/2+POLE_RADIUS&&z<m.upper+m.fore,`${who}: ahead of the chest (${z.toFixed(2)} m), the arms long enough to go round it`);
  avatar.dispose?.();
 }
});
