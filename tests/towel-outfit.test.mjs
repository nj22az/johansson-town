import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAvatar,bathOutfit,wearsBathTowel,towelSpan,wearsSwimTop,BONES} from '../src/avatars/build.js';
import {CAST_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {normalizeRecipe,decodeRecipe,encodeRecipe} from '../src/avatars/recipe.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createAvatarActor,updateAvatarActor,createAvatarJohansson} from '../src/avatars/actors.js';
import {previewOutfits,TABS,BATH_CHILD_NOTE} from '../src/avatars/creator.js';
installDOM();

/**
 * The bath wrap (yuamigi) behind Umi-no-yu's noren: grown-ups wrap up, children keep
 * their swimwear, and the cloth never shows the body through it.
 */
const towelOf=avatar=>avatar.root.children.find(o=>o.name==='Shimanchu bath towel');
const shown=avatar=>avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible).map(o=>o.name).sort();
const child=normalizeRecipe({...CAST_RECIPES.Thuan,name:'Kid',age:'child'});
const teen=normalizeRecipe({...CAST_RECIPES.Johansson,name:'Teen',age:'teen'});
const BODY_BONES=new Set(['hips','spine','chest','thighL','thighR','kneeL','kneeR']);

test('a grown-up wraps up in the bath towel, with a folded towel on the head',()=>{
 for(const name of ['Johansson','Thuan']){
  const recipe=CAST_RECIPES[name],avatar=buildAvatar(recipe,{shadows:false});
  assert.equal(wearsBathTowel(recipe),true);assert.equal(bathOutfit(recipe),'towel');
  assert.equal(avatar.wear('towel'),'towel');assert.equal(avatar.outfit,'towel');
  assert.deepEqual(shown(avatar),['Shimanchu bath towel','Shimanchu bath towel outline']);
  const towel=towelOf(avatar),{wrap,head}=towel.userData.towel,m=avatar.measure,span=towelSpan(recipe,m);
  assert.ok(wrap[1]-wrap[0]>1000&&head[1]-head[0]>200,'Both the wrap and the head towel are there');
  // Under the arms for a swimsuit-top wearer, from the waist otherwise; to just above the knee.
  assert.equal(span.chest,wearsSwimTop(recipe));
  assert.ok(span.chest?span.top>m.chestY:span.top<m.chestY&&span.top>m.hipY);
  const P=towel.geometry.attributes.position,I=towel.geometry.attributes.skinIndex,W=towel.geometry.attributes.skinWeight;
  let low=Infinity,high=-Infinity;for(let i=wrap[0];i<wrap[1];i++){low=Math.min(low,P.getY(i));high=Math.max(high,P.getY(i));}
  assert.ok(low>m.hipY-m.thigh-.01&&low<m.hipY-m.thigh*.85,'The hem is at the knee: '+low);
  assert.ok(high<m.shoulderY,'Under the arms at most');
  // The head towel is the head's: it goes where the head goes, lying on top of it.
  const headBone=BONES.indexOf('head');
  for(let i=head[0];i<head[1];i++){assert.equal(I.getX(i),headBone);assert.equal(W.getX(i),1);assert.ok(P.getY(i)>m.headCentre+m.Rh*m.headSY*.7,'On the crown');}
  // Only the wrap is fitted round the body after skinning; skin and head towel are not.
  const fit=towel.geometry.attributes.towelFit;
  assert.equal(fit.getX(wrap[0]),1);assert.equal(fit.getX(wrap[1]-1),1);assert.equal(fit.getX(head[0]),0);assert.equal(fit.getX(0),0);
  avatar.dispose();
 }
});

test('children and teenagers keep their swimwear; a grown-up may choose it',()=>{
 for(const recipe of [child,teen]){
  assert.equal(wearsBathTowel(recipe),false);assert.equal(bathOutfit(recipe),'swim');
  const avatar=buildAvatar(recipe,{shadows:false});
  assert.equal(avatar.wear('towel'),'swim','Asked into a towel, a child gets swimwear');
  assert.equal(towelOf(avatar),undefined,'No towel is ever made for them');
  assert.deepEqual(shown(avatar),['Shimanchu swimwear','Shimanchu swimwear outline']);
  assert.equal(avatar.wear('bath'),'swim');avatar.dispose();
 }
 // The choice is part of the recipe and survives a share code; children cannot opt in.
 const prefers=normalizeRecipe({...CAST_RECIPES.Thuan,swim:{...CAST_RECIPES.Thuan.swim,bath:'swimwear'}});
 assert.equal(bathOutfit(prefers),'swim');assert.equal(decodeRecipe(encodeRecipe(prefers)).swim.bath,'swimwear');
 assert.equal(normalizeRecipe({}).swim.bath,'towel');assert.equal(normalizeRecipe({swim:{bath:'nothing'}}).swim.bath,'towel');
 assert.equal(bathOutfit({...child,swim:{...child.swim,bath:'towel'}}),'swim');
});

test('clothes, towel and back again leave nothing behind',()=>{
 const avatar=buildAvatar(CAST_RECIPES.Thuan,{shadows:false}),before=shown(avatar);
 avatar.wear('towel');
 assert.equal(avatar.wear('clothes'),'clothes');assert.deepEqual(shown(avatar),before);
 assert.equal(towelOf(avatar).visible,false);
 // Wearing it again reuses the one towel: no second copy piles up.
 avatar.wear('swim');avatar.wear('towel');const meshes=avatar.root.children.length;
 for(const outfit of ['clothes','towel','swim','towel'])avatar.wear(outfit);assert.equal(avatar.root.children.length,meshes);
 assert.deepEqual(shown(avatar),['Shimanchu bath towel','Shimanchu bath towel outline']);
 avatar.wear('clothes');assert.deepEqual(shown(avatar),before);
 avatar.dispose();
});

/** Rest-pose radius of every body vertex (torso and legs; arms hang outside the wrap), by height band. */
function bodyRings(mesh,range){
 const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex,W=mesh.geometry.attributes.skinWeight,names=mesh.skeleton.bones.map(b=>b.name),pts=[];
 for(let i=0;i<P.count;i++){
  if(i>=range[0]&&i<range[1])continue;
  const bones=[0,1,2,3].filter(k=>W.getComponent(i,k)>1e-3).map(k=>names[I.getComponent(i,k)]);
  if(!bones.length||!bones.every(b=>BODY_BONES.has(b)))continue;
  pts.push([P.getX(i),P.getY(i),P.getZ(i)]);
 }
 return pts;
}

test('standing, the wrap is outside the body all the way round',()=>{
 for(const recipe of [CAST_RECIPES.Johansson,CAST_RECIPES.Thuan,recipeFor('Miss Higa'),recipeFor('Tetsuo')]){
  const avatar=buildAvatar(recipe,{shadows:false});avatar.wear('towel');
  const towel=towelOf(avatar),{wrap}=towel.userData.towel,body=bodyRings(towel,wrap),P=towel.geometry.attributes.position;
  // Every body vertex near the wrap's height, in the same direction from the body's axis,
  // is nearer the axis than the cloth.
  let checked=0;
  for(let i=wrap[0];i<wrap[1];i+=3){
   const x=P.getX(i),y=P.getY(i),z=P.getZ(i),r=Math.hypot(x,z),a=Math.atan2(x,z);
   for(const [bx,by,bz] of body){
    if(Math.abs(by-y)>.004)continue;
    let da=Math.abs(Math.atan2(bx,bz)-a);if(da>Math.PI)da=Math.PI*2-da;if(da>.03)continue;
    checked++;assert.ok(Math.hypot(bx,bz)<r,`${recipe.name}: body pokes through the wrap at y=${y.toFixed(3)}`);
   }
  }
  assert.ok(checked>2000,'Compared the wrap with the body: '+checked);
  // And in a standing frame of the animation, after the fit, nothing moves more than the clearance.
  const animator=createAvatarAnimator(avatar);animator.update(1/60,{});avatar.root.updateMatrixWorld(true);towel.towelFit.refresh();
  const p=new THREE.Vector3(),q=new THREE.Vector3();let moved=0;
  for(let i=wrap[0];i<wrap[1];i++){towel.getVertexPosition(i,p);q.copy(p);towel.towelFit.fitPoint(q);moved=Math.max(moved,p.distanceTo(q));}
  assert.ok(moved<.006,`${recipe.name}: standing, the cloth already clears the body (${moved})`);
  avatar.dispose();
 }
});

test('walking, sitting and soaking, the fitted wrap stays out of the legs and on the seat',()=>{
 const poses={walk:{speed:1.3},sit:{seated:true,seatHeight:.45},wash:{seated:true,seatHeight:.22},soak:{seated:true,seatHeight:.1,seat:'Soak'}};
 for(const recipe of [CAST_RECIPES.Johansson,CAST_RECIPES.Thuan]){
  for(const [name,state] of Object.entries(poses)){
   const avatar=buildAvatar(recipe,{shadows:false});avatar.wear('towel');
   const towel=towelOf(avatar),{wrap}=towel.userData.towel,m=avatar.measure,fit=towel.towelFit,animator=createAvatarAnimator(avatar);
   const at=n=>avatar.bones[n].getWorldPosition(new THREE.Vector3()),p=new THREE.Vector3(),ab=new THREE.Vector3(),d=new THREE.Vector3();
   for(let frame=0;frame<90;frame++){
    animator.update(1/60,state);avatar.root.updateMatrixWorld(true);fit.refresh();
    if(frame%10)continue;
    // The thighs as addBody makes them: legR*1.02 at the hip, tapering towards the ankle.
    const legs=[['thighL','kneeL'],['thighR','kneeR']].map(([a,b])=>[at(a),at(b)]);
    let deepest=0,lowest=Infinity;
    for(let i=wrap[0];i<wrap[1];i++){
     towel.getVertexPosition(i,p);fit.fitPoint(p);towel.localToWorld(p);
     for(const [A,B] of legs){ab.subVectors(B,A);const t=THREE.MathUtils.clamp(d.subVectors(p,A).dot(ab)/ab.lengthSq(),0,1);const dist=d.copy(A).addScaledVector(ab,t).distanceTo(p);deepest=Math.max(deepest,m.legR*(1.02-.16*t*m.thigh/(m.hipY-m.foot))-dist);}
     lowest=Math.min(lowest,p.y);
    }
    assert.ok(deepest<=1e-4,`${recipe.name} ${name}: a thigh comes through the cloth by ${deepest}`);
    if(state.seated&&frame>=60&&name!=='soak')assert.ok(lowest>state.seatHeight-.03,`${recipe.name} ${name}: the cloth sinks into the seat (${lowest})`);
   }
   avatar.dispose();
  }
 }
});

test('residents asked into the bath and the player dress the same way',()=>{
 const scene=new THREE.Scene(),entity=new THREE.Group();entity.userData.name='Thuan';scene.add(entity);
 const actor=createAvatarActor(entity,'Thuan');
 entity.userData.outfit='bath';updateAvatarActor(actor,1/30,0);
 assert.equal(actor.outfit,'towel');assert.equal(actor.avatar.body.visible,false);assert.equal(towelOf(actor.avatar).visible,true);
 delete entity.userData.outfit;updateAvatarActor(actor,1/30,0);
 assert.equal(actor.outfit,'clothes');assert.equal(actor.avatar.body.visible,true);
 const player=createAvatarJohansson({scene,recipe:CAST_RECIPES.Johansson});
 assert.equal(player.wear('bath'),'towel');assert.equal(player.outfit,'towel');
 // A new recipe keeps them dressed for the bath, as whatever suits the new body.
 player.setRecipe(child);assert.equal(player.outfit,'swim');
 player.setRecipe(CAST_RECIPES.Johansson);assert.equal(player.outfit,'towel');
 assert.equal(player.wear('clothes'),'clothes');
});

test('the maker offers the bath towel to grown-ups and says why children keep swimwear',()=>{
 const grown=previewOutfits(CAST_RECIPES.Johansson);
 assert.deepEqual(grown.map(o=>o.value),['clothes','swim','towel','afterbath']);
 assert.equal(grown.find(o=>o.value==='towel').disabled,false);
 const young=previewOutfits(child).find(o=>o.value==='towel');
 assert.equal(young.disabled,true);assert.match(young.label,/grown-ups/);
 const bottoms=TABS.find(t=>t.id==='bottom').controls,choice=bottoms.find(c=>c.at==='swim.bath'),note=bottoms.find(c=>c.kind==='note');
 assert.deepEqual(choice.list,['towel','swimwear']);
 assert.equal(choice.when(CAST_RECIPES.Thuan),true);assert.equal(choice.when(child),false);
 assert.equal(note.when(child),true);assert.equal(note.text,BATH_CHILD_NOTE);
 // Choosing the towel in the maker dresses the preview figure in it.
 const avatar=buildAvatar(CAST_RECIPES.Thuan,{shadows:false});
 assert.equal(avatar.wear(grown.find(o=>o.value==='towel').value),'towel');assert.equal(towelOf(avatar).visible,true);avatar.dispose();
});
