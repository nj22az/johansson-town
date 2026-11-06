import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {normalizeRecipe,encodeRecipe,decodeRecipe} from '../src/avatars/recipe.js';
import {buildAvatar,measure,bodyVolume} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {authoredSkirtGeometry} from '../src/avatars/authored-skirt.js';
import {skirtSpec} from '../src/avatars/skirt-shape.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {ISLAND_OUTFITS} from '../src/avatars/outfits.js';
import {putOnSet} from '../src/avatars/wardrobe-catalogue.js';
installDOM();

test('panel skirt, controls, sculpted head and studio proportions round-trip; old recipes stay classic',()=>{
 const old=normalizeRecipe({});assert.equal(old.body.proportion,'classic');assert.equal(old.outfit.skirtCut,'classic');
 const r=recipeFor('Vy');assert.equal(r.head.form,'sculpted');assert.equal(r.eyes.style,'inkoval');assert.equal(r.body.proportion,'studio');
 assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
 const set=ISLAND_OUTFITS.find(s=>s.id==='vy-monochrome');assert.ok(set);
 assert.equal(putOnSet(old.outfit,set).skirtCut,'panel');
 const m=measure(r),long=measure(normalizeRecipe({...r,outfit:{...r.outfit,skirtLength:1}})),wide=measure(normalizeRecipe({...r,outfit:{...r.outfit,skirtFlare:1}}));
 assert.ok(skirtSpec(long).length>skirtSpec(m).length);assert.ok(skirtSpec(wide).hemR>skirtSpec(m).hemR);
});

test('authored topology keeps the 1472-triangle budget and fits actual upper torso surfaces across wearers',()=>{
 for(const proportion of ['classic','studio'])for(const age of ['child','teen','adult','elder'])for(const silhouette of ['feminine','masculine','neutral'])for(const build of [0,1]){
  const r=normalizeRecipe({age,body:{proportion,silhouette,build},outfit:{bottom:'skirt',skirtCut:'panel'}}),m=measure(r),vol=bodyVolume(r,m),g=authoredSkirtGeometry(m,vol),P=g.attributes.position,p=new THREE.Vector3();
  assert.equal(g.index.count/3,1472);
  for(let i=0;i<P.count;i++){
   p.fromBufferAttribute(P,i);assert.ok(p.toArray().every(Number.isFinite));
   if(p.y>m.hipY-m.torso*.08)assert.ok(vol.sdf(p)>-.00001,`${age}/${proportion}/${silhouette}: torso penetration`);
  }
  g.dispose();
 }
});

test('panel mesh uses shared bones, safe support weights, fitted waist, outfit switching and continuous poses',()=>{
 const a=buildAvatar(recipeFor('Vy'),{faceSize:64,shadows:false}),mesh=a.skirt;
 assert.ok(mesh?.isSkinnedMesh);assert.equal(mesh.skeleton,a.body.skeleton);assert.ok(mesh.material.isMeshPhysicalMaterial&&mesh.material.normalMap);
 assert.equal(mesh.geometry.attributes.position.count/3,1472);
 const weights=mesh.geometry.attributes.skinWeight;
 for(let i=0;i<weights.count;i++){let sum=0;for(let k=0;k<4;k++)sum+=weights.getComponent(i,k);assert.ok(Math.abs(sum-1)<1e-5);}
 a.root.updateMatrixWorld(true);assert.equal(mesh.towelFit.refresh().uSkirt.value.x,skirtSpec(a.measure).waist);
 a.wear('sailor');assert.equal(mesh.visible,false);
 const uniform=a.root.getObjectByName('Thuan · harbour academy sailor'),I=uniform.geometry.attributes.skinIndex;
 assert.ok(Array.from({length:I.count},(_,i)=>uniform.skeleton.bones[I.getX(i)].name).some(name=>name.startsWith('skirt')),'alternate sailor retains its own skirt');
 a.wear('swim');assert.equal(mesh.visible,false);a.wear('clothes');assert.equal(mesh.visible,true);
 const anim=createAvatarAnimator(a),p=new THREE.Vector3(),rest=new THREE.Vector3(),P=mesh.geometry.attributes.position;
 for(const pose of ['Walk','Run','Sit']){
  anim.play(pose);
  for(let frame=0;frame<90;frame++){
   anim.update(1/60,{speed:pose==='Walk'?1.1:pose==='Run'?3.8:0,running:pose==='Run',seated:pose==='Sit',seatHeight:.3,seatFront:.18});a.root.updateMatrixWorld(true);mesh.towelFit.refresh();
   for(let i=0;i<P.count;i+=37){mesh.getVertexPosition(i,p);mesh.towelFit.fitPoint(p,2,rest.fromBufferAttribute(P,i));assert.ok(p.toArray().every(Number.isFinite),`${pose} frame ${frame}`);}
  }
 }
 a.dispose();
});
