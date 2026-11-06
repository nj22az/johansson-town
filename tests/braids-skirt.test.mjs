import {test} from 'node:test';
import assert from 'node:assert/strict';
import {installDOM} from './fixtures.mjs';
import * as THREE from '../vendor/three.module.js';
import {normalizeRecipe,encodeRecipe,decodeRecipe,PARTS} from '../src/avatars/recipe.js';
import {CAST_RECIPES} from '../src/avatars/cast.js';
import {buildAvatar,measure,BONES} from '../src/avatars/build.js';
import {longBraidPoints} from '../src/avatars/braid-path.js';
import {pleatedSkirtGeometry} from '../src/avatars/pleated-skirt.js';
installDOM();

test('long twin braids remain a selectable shared part after saving a recipe',()=>{
 assert.ok(PARTS.hair.includes('braids'));assert.ok(PARTS.hair.includes('longbraids'));
 for(const age of ['child','teen','adult','elder']){
  const r=normalizeRecipe({...CAST_RECIPES.Thuan,age,hair:{style:'longbraids',colour:'#3a2618',flip:true}});
  assert.deepEqual(decodeRecipe(encodeRecipe(r)),r);
  const m=measure(r),left=longBraidPoints(m,1,r.hair),right=longBraidPoints(m,-1,r.hair);
  assert.equal(left[2][1],m.chestY+m.torso*.15);
  assert.deepEqual(left.map(p=>[-p[0],p[1],p[2]]),right);
 }
});

test('each long braid is actually skinned to its own animated bones',()=>{
 const a=buildAvatar(CAST_RECIPES.Thuan,{shadows:false}),g=a.body.geometry;
 const P=g.attributes.position,I=g.attributes.skinIndex,W=g.attributes.skinWeight;
 for(const side of ['L','R']){
  const name='braid'+side+'2',id=BONES.indexOf(name);let vertex=-1;
  for(let i=0;i<P.count;i++)for(let k=0;k<4;k++)if(I.array[i*4+k]===id&&W.array[i*4+k]>.8){vertex=i;break;}
  assert.ok(vertex>=0,name+' carries the lower plait');
  a.root.updateMatrixWorld(true);a.body.skeleton.update();
  const before=a.body.applyBoneTransform(vertex,new THREE.Vector3().fromBufferAttribute(P,vertex));
  a.bones[name].rotation.z=.25;a.root.updateMatrixWorld(true);a.body.skeleton.update();
  const after=a.body.applyBoneTransform(vertex,new THREE.Vector3().fromBufferAttribute(P,vertex));
  assert.ok(before.distanceTo(after)>.005,name+' visibly moves its mesh');
  a.bones[name].rotation.z=0;
 }
 assert.equal(a.springSetup.chains.filter(c=>c.kind==='braid').length,2);
 a.dispose();
});

test('the pleated skirt has a broad flare, recessed folds and an inner hem surface',()=>{
 const m=measure(CAST_RECIPES.Thuan),len=m.thigh*.9,g=pleatedSkirtGeometry(m,len),P=g.attributes.position;
 const radii=[];let top=0;
 for(let i=0;i<P.count;i++){
  assert.ok(Number.isFinite(P.getX(i)+P.getY(i)+P.getZ(i)));
  const r=Math.hypot(P.getX(i),P.getZ(i));
  if(Math.abs(P.getY(i)+len/2)<1e-6)radii.push(r);
  if(Math.abs(P.getY(i)-len/2)<1e-6)top=Math.max(top,r);
 }
 assert.ok(Math.max(...radii)>top*1.3,'short A-line silhouette');
 assert.ok(Math.max(...radii)-Math.min(...radii)>.02,'pressed fold relief');
 assert.equal(P.count,97*19,'outer panels, inner panels and closed waist edge');
 g.dispose();
});
