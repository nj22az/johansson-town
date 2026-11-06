import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createAvatarActor,updateAvatarActor} from '../src/avatars/actors.js';
import {UMBRELLA,UMBRELLA_MAX_LEAN,UMBRELLA_COLOURS,buildUmbrella,fitUmbrella,umbrellaColourFor,umbrellaRise,wantsUmbrella} from '../src/avatars/umbrella.js';

installDOM();

test('every umbrella colour says why it is that colour', ()=>{
 for(const [who,c] of Object.entries(UMBRELLA_COLOURS)){
  assert.ok(Number.isInteger(c.canopy),who);
  assert.ok(typeof c.why==='string'&&c.why.length>20,who+' has a reason');
 }
 assert.equal(umbrellaColourFor('Thuan',27),UMBRELLA_COLOURS.Thuan);
 assert.equal(umbrellaColourFor('Vy',8),UMBRELLA_COLOURS.child);
 assert.equal(umbrellaColourFor('Mr Fujita',58),UMBRELLA_COLOURS.adult);
 assert.equal(umbrellaColourFor('Somebody',undefined),UMBRELLA_COLOURS.adult);
});

test('the umbrella is up only in the rain, in the street, with the right hand free', ()=>{
 assert.equal(wantsUmbrella({},false),false,'no rain');
 assert.equal(wantsUmbrella({},true),true,'walking in the rain');
 for(const flag of ['indoors','inVehicle','inBookshop','inWorkplace','inIzakaya','inOnsen','inMarket','inRamen','inHome',
  'playerControlled','usingTownObject','carrying','sleeping','climbing'])
  assert.equal(wantsUmbrella({[flag]:true},true),false,flag);
 assert.equal(wantsUmbrella({heldItem:'can'},true),false,'a drink in hand');
 assert.equal(wantsUmbrella({tool:'broom'},true),false,'a broom in hand');
 assert.equal(wantsUmbrella({seatHeight:.45},true),false,'sitting down');
 assert.equal(wantsUmbrella({bicyclePhase:.3},true),false,'cycling');
});

test('the canopy clears the head and never sinks below its least rise', ()=>{
 assert.equal(umbrellaRise(1.2,1.4),Math.max(UMBRELLA.minRise,1.4+UMBRELLA.clear-1.2));
 assert.equal(umbrellaRise(1.2,1.3),UMBRELLA.minRise);
 const u=buildUmbrella(UMBRELLA_COLOURS.Thuan);
 assert.equal(u.userData.colour,UMBRELLA_COLOURS.Thuan.canopy);
 assert.equal(u.children.length,3,'shaft, handle and canopy');
});

for(const name of ['Thuan','Mr Fujita','Johansson']){
 test(`${name}: walking in the rain, the canopy is over the head and clears it`, ()=>{
  const avatar=buildAvatar(recipeFor(name),{shadows:false,faceSize:64}),animator=createAvatarAnimator(avatar,{lively:true});
  const root=new THREE.Group();root.add(avatar.root);root.rotation.y=.7;
  const prop=buildUmbrella();avatar.bones.handR.add(prop);
  const m=avatar.measure,head=new THREE.Vector3(),rim=new THREE.Vector3(),up=new THREE.Vector3(),q=new THREE.Quaternion();
  let lowest=Infinity,offCentre=0,leaned=0,wobble=0,last=null;
  for(let i=0;i<120;i++){
   animator.update(1/60,{speed:1.1,umbrella:true});
   root.updateMatrixWorld(true);fitUmbrella(avatar,prop);prop.updateMatrixWorld(true);
   avatar.root.localToWorld(head.set(0,m.headCentre+m.Rh*m.headSY,0));
   prop.userData.canopy.getWorldPosition(rim);
   up.set(0,1,0).applyQuaternion(prop.getWorldQuaternion(q));
   const tilt=up.angleTo(new THREE.Vector3(0,1,0));leaned=Math.max(leaned,tilt);
   // the low side of the rim, against the top of the head
   lowest=Math.min(lowest,rim.y-UMBRELLA.radius*Math.sin(tilt)*.5-head.y);
   offCentre=Math.max(offCentre,Math.hypot(rim.x-head.x,rim.z-head.z));
   // after the first steps, the canopy rides steady: no jumps between frames
   if(i>30&&last)wobble=Math.max(wobble,rim.distanceTo(last)-1.1/60);
   last=rim.clone();
  }
  assert.ok(lowest>=UMBRELLA.clear-1e-3,`rim's low side ${lowest.toFixed(3)} m above the head`);
  assert.ok(leaned<=UMBRELLA_MAX_LEAN+1e-6,`shaft leaned ${leaned.toFixed(2)} rad`);
  assert.ok(offCentre<.1,`the head is under the canopy (its middle ${offCentre.toFixed(2)} m off the head)`);
  assert.ok(wobble<.02,`the canopy rides steady (${wobble.toFixed(3)} m a frame beyond the walk)`);
 });
}

test('a resident actor opens the umbrella when the schedule says so, and folds it away after', ()=>{
 const entity=new THREE.Group();entity.name='Thuan';
 const actor=createAvatarActor(entity,'Thuan');
 entity.userData.umbrella=UMBRELLA_COLOURS.Thuan.canopy;
 updateAvatarActor(actor,1/60);
 assert.ok(actor.umbrellaProp,'umbrella up');
 assert.equal(actor.umbrellaProp.parent,actor.avatar.bones.handR,'in the right hand');
 assert.equal(actor.umbrellaProp.userData.colour,UMBRELLA_COLOURS.Thuan.canopy);
 delete entity.userData.umbrella;
 updateAvatarActor(actor,1/60);
 assert.equal(actor.umbrellaProp,null,'folded away');
});
