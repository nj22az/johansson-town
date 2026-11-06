import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {createAvatarJohansson} from '../src/avatars/actors.js';
import {PARK_BENCH,PARK_BENCH_FIT,activePark} from '../src/world/park-layout.js';
import {seatContactHeight,shoeHeight} from './seating-contact.mjs';
installDOM();

test('player clothes and changed body proportions rest on real seats, including low cushions',()=>{
 const actor=createAvatarJohansson({scene:new THREE.Scene()});
 const recipes=[CAST_RECIPES.Johansson,CAST_RECIPES.Thuan,
  {...CAST_RECIPES.Johansson,age:'child'},
  {...CAST_RECIPES.Johansson,body:{...CAST_RECIPES.Johansson.body,build:1,height:1}}];
 for(const recipe of recipes){
  actor.setRecipe(recipe);actor.seat('Sit');actor.root.position.set(3,2,4);actor.root.rotation.y=1.1;
  for(const height of [.05,.42,.565,.71,.92]){
   for(let i=0;i<90;i++)actor.update(1/60,{seated:true,seatHeight:height,visible:true});
   const surface=2+height;
   assert.ok(Math.abs(seatContactHeight(actor.avatar)-surface)<.001,recipe.name+' on '+height);
   assert.ok(shoeHeight(actor.avatar)>=2-.005,recipe.name+' shoes clear the floor at '+height);
  }
 }
 actor.avatar.dispose();
});

test('moves, meals, waves and drinks preserve the sitting legs and seat contact',()=>{
 const actor=createAvatarJohansson({scene:new THREE.Scene()});actor.seat('Sit');
 for(let i=0;i<90;i++)actor.update(1/60,{seated:true,seatHeight:.47,visible:true});
 for(const name of ['Wave','Heart','Peace','Coy','Tada','HandsOnHips','HeelKick','Jump','PickUp','SitDrink','SitEat','SitEnjoyFood','SitPresentFood']){
  actor.play(name);
  for(let i=0;i<20;i++){
   actor.update(1/30,{seated:true,seatHeight:.47,visible:true});
   assert.ok(Math.abs(seatContactHeight(actor.avatar)-.47)<.001,name+' stays on the seat');
   assert.ok(actor.avatar.bones.thighL.rotation.x<-1.4,name+' keeps seated thighs');
  }
 }
 actor.stop();for(let i=0;i<90;i++)actor.update(1/60,{visible:true});
 assert.ok(Math.abs(shoeHeight(actor.avatar))<.001,'Standing restores floor contact');actor.avatar.dispose();
});


test('Harbour Park bench leaves short seated shins in front of the wooden slats',()=>{
 const actor=createAvatarJohansson({scene:new THREE.Scene()}),park=activePark(),f=PARK_BENCH_FIT;
 const front=park.x+f.x*park.scale-f.width*f.scale*park.scale*.41;
 for(const recipe of [CAST_RECIPES.Johansson,CAST_RECIPES.Thuan,{...CAST_RECIPES.Johansson,age:'child'}]){
  actor.setRecipe(recipe);actor.seat('Sit');actor.root.position.set(...PARK_BENCH.position);actor.root.rotation.y=PARK_BENCH.yaw;
  for(let i=0;i<90;i++)actor.update(1/60,{seated:true,seatHeight:PARK_BENCH.surfaceY-PARK_BENCH.position[1],visible:true});
  actor.root.updateMatrixWorld(true);
  const foot=actor.avatar.bones.footL.getWorldPosition(new THREE.Vector3());
  assert.ok(foot.x+actor.avatar.measure.legR<front,recipe.name+' lower legs clear the seat front');
  assert.ok(Math.abs(seatContactHeight(actor.avatar)-PARK_BENCH.surfaceY)<.001);
 }
 actor.avatar.dispose();
});
