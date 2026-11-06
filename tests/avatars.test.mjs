import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {normalizeRecipe,encodeRecipe,decodeRecipe,randomRecipe,DEFAULT_RECIPE,PARTS} from '../src/avatars/recipe.js';
import {CAST_RECIPES,NEIGHBOUR_RECIPES,recipeFor} from '../src/avatars/cast.js';
import {buildAvatar,BONES,measure} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {createAvatarActor,updateAvatarActor,createAvatarJohansson,playerRecipe,savePlayerRecipe,PLAYER_RECIPE_KEY} from '../src/avatars/actors.js';
import {createLocalCharacters} from '../src/people/models.js?snappy=1';
import {NEIGHBOURS} from '../src/people/neighbours.js';
import {seatContactHeight} from './seating-contact.mjs';

installDOM();
const settle=(animator,state,seconds=2)=>{for(let t=0;t<seconds;t+=1/30)animator.update(1/30,state);};

test('a recipe is always complete and safe, and survives a share code',()=>{
 const junk=normalizeRecipe({hair:{style:'mohawk',colour:'red'},eyes:{size:9},outfit:{top:'kariyushi',hat:'crown'},evil:'<script>'});
 assert.equal(junk.hair.style,DEFAULT_RECIPE.hair.style);assert.equal(junk.hair.colour,DEFAULT_RECIPE.hair.colour);
 assert.equal(junk.eyes.size,1);assert.equal(junk.outfit.top,'kariyushi');assert.equal(junk.outfit.hat,'none');assert.equal(junk.evil,undefined);
 for(const recipe of [CAST_RECIPES.Thuan,CAST_RECIPES.Johansson,randomRecipe('share')])assert.deepEqual(decodeRecipe(encodeRecipe(recipe)),normalizeRecipe(recipe));
 assert.equal(decodeRecipe('not a code'),null);
 assert.deepEqual(randomRecipe('same seed'),randomRecipe('same seed'),'A seed always makes the same person');
 assert.notDeepEqual(randomRecipe('one'),randomRecipe('two'));
});

test('everyone in town has their own recipe, and strangers get a steady face from their name',()=>{
 assert.equal(CAST_RECIPES.Thuan.hair.style,'braids','Thuan in her classic braids');assert.equal(CAST_RECIPES.Johansson.hair.style,'horseshoe');
 for(const n of NEIGHBOURS)assert.ok(recipeFor(n.name)?.body,'Canonical or stable authored recipe for '+n.name);
 const faces=new Set(NEIGHBOURS.map(n=>JSON.stringify(recipeFor(n.name))));assert.equal(faces.size,NEIGHBOURS.length,'No two neighbours share a face');
 assert.deepEqual(recipeFor('A passing stranger'),recipeFor('A passing stranger'));
 for(const style of PARTS.hair)for(const hat of ['none','cap','straw'])buildAvatar({...DEFAULT_RECIPE,hair:{...DEFAULT_RECIPE.hair,style},outfit:{...DEFAULT_RECIPE.outfit,hat}},{shadows:false}).dispose();
});

test('a body is one skinned mesh standing on the ground, with soft joints',()=>{
 const avatar=buildAvatar(CAST_RECIPES.Thuan,{shadows:false});
 const g=avatar.body.geometry,index=g.attributes.skinIndex,weight=g.attributes.skinWeight;
 g.computeBoundingBox();
 assert.ok(Math.abs(g.boundingBox.min.y)<.03,'Feet on the ground, not under it: '+g.boundingBox.min.y);
 let shared=0,elbow=BONES.indexOf('elbowL'),shoulder=BONES.indexOf('shoulderL');
 for(let i=0;i<index.count;i++){
  const sum=weight.getX(i)+weight.getY(i)+weight.getZ(i)+weight.getW(i);
  assert.ok(Math.abs(sum-1)<1e-4,'Weights sum to one at '+i);
  const bones=[index.getX(i),index.getY(i),index.getZ(i),index.getW(i)].filter((b,k)=>[weight.getX(i),weight.getY(i),weight.getZ(i),weight.getW(i)][k]>.05);
  if(bones.includes(elbow)&&bones.includes(shoulder))shared++;
 }
 assert.ok(shared>20,'The elbow bends as one soft piece, shared between the upper and lower arm');
 assert.equal(avatar.body.skeleton.bones.length,BONES.length);
 assert.ok(avatar.body.material.isMeshToonMaterial&&avatar.face.head.material.isMeshToonMaterial,'Cel-shaded like the town');
 // The face is shaded as if flat and tipped to the light: its normals lean forward.
 const n=avatar.face.head.geometry.attributes.normal,p=avatar.face.head.geometry.attributes.position;let front=0,lean=0;
 for(let i=0;i<n.count;i++)if(p.getZ(i)>0&&Math.abs(p.getX(i))<.02&&Math.abs(p.getY(i))<.1){front++;lean+=n.getZ(i);}
 assert.ok(front&&lean/front>.9);
 avatar.wear('swim');assert.equal(avatar.body.visible,false);avatar.wear('clothes');assert.equal(avatar.body.visible,true);
 avatar.dispose();
});

test('sitting rests on the seat and standing counter poses keep shoes on the floor',()=>{
 const avatar=buildAvatar(CAST_RECIPES.Johansson,{shadows:false}),animator=createAvatarAnimator(avatar),m=avatar.measure;
 settle(animator,{seated:true,seatHeight:.45});
 assert.ok(Math.abs(seatContactHeight(avatar)-.45)<.001,'Rendered clothing rests on the seat');
 const scene=new THREE.Scene(),entity=new THREE.Group();entity.userData.name='Thuan';scene.add(entity);
 const actor=createAvatarActor(entity,'Thuan');
 entity.userData.socialPose='CounterIdle';for(let i=0;i<60;i++)updateAvatarActor(actor,1/30,0);
 const body=actor.avatar.body,indices=[],feet=['footL','footR'].map(n=>body.skeleton.bones.indexOf(actor.avatar.bones[n]));
 const {skinIndex,skinWeight}=body.geometry.attributes;
 for(let i=0;i<skinIndex.count;i++)if(feet.includes(skinIndex.getX(i))&&skinWeight.getX(i)>.999)indices.push(i);
 assert.ok(indices.length>20,'Rendered rigid foot samples');
 const sole=()=>{actor.avatar.root.updateMatrixWorld(true);let lowest=Infinity;for(const i of indices){const p=new THREE.Vector3().fromBufferAttribute(body.geometry.attributes.position,i);body.applyBoneTransform(i,p);body.localToWorld(p);lowest=Math.min(lowest,p.y);}return lowest;};
 assert.ok(Math.abs(sole())<1e-5,'CounterIdle shoes stand on the floor, with no artificial lift');
 actor.animator.play('Wave');
 for(let i=0;i<120;i++){updateAvatarActor(actor,1/60,0);assert.ok(Math.abs(sole())<1e-5,'The greeting keeps the same floor contact');}
 avatar.dispose();actor.avatar.dispose();
});

test('people turn their heads to whoever they are looking at',()=>{
 const scene=new THREE.Scene(),entity=new THREE.Group();entity.userData.name='Mrs Nakamura';scene.add(entity);
 const actor=createAvatarActor(entity,'Mrs Nakamura');scene.updateMatrixWorld(true);
 // The body faces -z in the town; a point off to its right, at head height.
 entity.userData.lookTarget=[-2,1.3,-2];entity.userData.socialPose='CounterIdle';
 for(let i=0;i<60;i++){scene.updateMatrixWorld(true);updateAvatarActor(actor,1/30,0);}
 const right=actor.avatar.bones.head.rotation.y;
 entity.userData.lookTarget=[2,1.3,-2];
 for(let i=0;i<60;i++){scene.updateMatrixWorld(true);updateAvatarActor(actor,1/30,0);}
 const left=actor.avatar.bones.head.rotation.y;
 assert.ok(Math.abs(right-left)>.6,'The head follows the point from one side to the other');
});

test('the character system hands out Shimanchu, and they dress for the bath',()=>{
 {
  const models=createLocalCharacters(),scene=new THREE.Scene(),entity=new THREE.Group();entity.userData.name='Thuan';scene.add(entity);
  const actor=models.attach(entity,'Thuan');
  assert.ok(actor.isAvatar);assert.equal(entity.userData.visualReady,true);assert.match(entity.userData.visualSource,/Shimanchu/);
  entity.userData.outfit='swim';models.update(1/30);assert.equal(actor.avatar.body.visible,false);
  entity.userData.outfit='clothes';models.update(1/30);assert.equal(actor.avatar.body.visible,true);
  const eye=models.conversationTarget(entity);assert.ok(eye.y>1&&eye.y<1.7,'Conversations frame the face: '+eye.y);
 }
});

test('the player body offers everything the game asks of Johansson, and takes a new recipe',()=>{
 const scene=new THREE.Scene(),j=createAvatarJohansson({scene,recipe:CAST_RECIPES.Johansson});
 for(const k of ['play','express','speak','lookAt','seat','wear','hold','jump','stop','update','setRecipe'])assert.equal(typeof j[k],'function',k);
 assert.ok(j.sitHip>.2&&j.sitHip<.7);assert.ok(j.lens.eye>j.lens.head);
 j.play('Kachashi');j.update(.1,{visible:true});assert.equal(j.move,'Kachashi');
 const cup=new THREE.Group();j.hold(cup);assert.equal(cup.parent,j.avatar.bones.handR);
 j.setRecipe(CAST_RECIPES.Thuan);assert.equal(j.avatar.recipe.hair.style,'braids');assert.equal(cup.parent,j.avatar.bones.handR,'Still holding the drink');
 const storage=new Map(),store={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 assert.equal(playerRecipe(store).hair.style,'horseshoe','Johansson until the creator saves someone else');
 savePlayerRecipe(CAST_RECIPES.Thuan,store);assert.ok(storage.get(PLAYER_RECIPE_KEY));assert.equal(playerRecipe(store).hair.style,'braids');
});


test('the front waistband stays anchored to the hips when the chest leans for a pose',()=>{
 installDOM();const avatar=buildAvatar(CAST_RECIPES.Johansson),m=measure(CAST_RECIPES.Johansson);
 const p=avatar.body.geometry.attributes.position,front=[];
 for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))<.025&&p.getZ(i)>.04&&p.getY(i)>m.hipY&&p.getY(i)<m.hipY+m.torso*.14)front.push(i);
 assert.ok(front.length>10,'There must be a visible front waistband to check');
 avatar.root.updateMatrixWorld(true);const before=front.map(i=>avatar.body.getVertexPosition(i,new THREE.Vector3()));
 avatar.bones.chest.rotation.x=.35;avatar.root.updateMatrixWorld(true);
 for(let j=0;j<front.length;j++)assert.ok(avatar.body.getVertexPosition(front[j],new THREE.Vector3()).distanceTo(before[j])<1e-5,'Clapping or leaning must not push the trousers out in front');
 avatar.dispose();
});
