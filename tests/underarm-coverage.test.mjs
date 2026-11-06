import {test} from 'node:test';import assert from 'node:assert/strict';import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';import {buildAvatar} from '../src/avatars/build.js';import {ORIGINAL_THUAN_RECIPE,recipeFor} from '../src/avatars/cast.js';
installDOM();
function upperArmSkinCount(a){
 const {position:P,color:C,skinIndex:I,skinWeight:W}=a.body.geometry.attributes,m=a.measure,skin=new THREE.Color(a.recipe.body.skin);let skinCount=0,samples=0;
 for(let i=0;i<P.count;i++){
  const start=i-i%3,y=(P.getY(start)+P.getY(start+1)+P.getY(start+2))/3;
  if(y<m.shoulderY-m.upper*.5||y>m.shoulderY+m.armR)continue;
  let arm=false;for(let k=0;k<4;k++)if(/^shoulder[LR]$/.test(a.body.skeleton.bones[I.array[i*4+k]].name)&&W.array[i*4+k]>.05)arm=true;
  if(!arm)continue;samples++;
  if(Math.abs(C.getX(i)-skin.r)+Math.abs(C.getY(i)-skin.g)+Math.abs(C.getZ(i)-skin.b)<1e-5)skinCount++;
 }
 return {skinCount,samples};
}
test('sleeved tops cover the shoulder and underarm instead of exposing the base arm',()=>{
 for(const base of [ORIGINAL_THUAN_RECIPE,recipeFor('Johansson')])for(const top of ['kariyushi','tee','contrastpolo','hoodie','shirt','vest','knitvest','gymtee','baseball','festival']){
  const r=structuredClone(base);r.outfit.top=top;const a=buildAvatar(r,{shadows:false});
  const {skinCount,samples}=upperArmSkinCount(a);assert.ok(samples>100);assert.equal(skinCount,0,top+' has cloth lining under the sleeve');
  for(const raised of [1.6,2.55,3]){
   a.bones.shoulderL.rotation.z=raised;a.bones.shoulderR.rotation.z=-raised;a.root.updateMatrixWorld(true);a.body.skeleton.update();
   const P=a.body.geometry.attributes.position,p=new THREE.Vector3();
   for(let i=0;i<P.count;i+=37){a.body.getVertexPosition(i,p);assert.ok(p.toArray().every(Number.isFinite));}
  }
  a.dispose();
 }
});
test('sleeveless tops and swimwear keep their intentional bare shoulders',()=>{
 const r=structuredClone(ORIGINAL_THUAN_RECIPE);r.outfit.top='tank';const a=buildAvatar(r,{shadows:false});assert.ok(upperArmSkinCount(a).skinCount>100);a.wear('swim');assert.ok(a.swimBody||a.root.children.some(c=>c.name==='Shimanchu swimwear'));a.dispose();
});
