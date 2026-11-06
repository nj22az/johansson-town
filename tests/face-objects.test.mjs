import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFaceObjects,faceObjectPoint} from '../src/avatars/face-objects.js';
import {buildAvatar,measure} from '../src/avatars/build.js';
import {normalizeRecipe,PARTS} from '../src/avatars/recipe.js';
import {PAINTED_MOUSTACHES} from '../src/avatars/face.js';
import {installDOM} from './fixtures.mjs';
const recipe=overrides=>normalizeRecipe({glasses:{style:'round',enabled:true},facial:{moustache:'handlebar',beard:'beard'},...overrides});
test('every accessory style has finite three-dimensional geometry across head shapes',()=>{
 for(const form of PARTS.head)for(const style of PARTS.glasses){
  const r=recipe({head:{form},glasses:{style,enabled:true}}),g=buildFaceObjects(r,measure(r));
  assert.equal(!!g.getObjectByName('Glasses frames and temples'),style!=='none');
  g.traverse(o=>{if(!o.isMesh)return;for(const v of o.geometry.attributes.position.array)assert.ok(Number.isFinite(v));o.geometry.computeBoundingBox();const b=o.geometry.boundingBox;assert.ok(b.max.z-b.min.z>.001);});g.userData.dispose();
 }
 // (A painted moustache is drawn on the face, not sculpted.)
 for(const moustache of PARTS.moustache)for(const beard of PARTS.beard){const r=recipe({facial:{moustache,beard}}),g=buildFaceObjects(r,measure(r));assert.equal(!!g.getObjectByName('Sculpted moustache'),moustache!=='none'&&!PAINTED_MOUSTACHES[moustache],moustache);assert.equal(!!g.getObjectByName('Sculpted beard'),beard!=='none');g.userData.dispose();}
});
test('disabled glasses are absent, adjustment changes geometry, and lift is outside the skin',()=>{
 const a=recipe({glasses:{enabled:false,style:'round'}}),b=recipe({glasses:{enabled:true,style:'round',height:1,size:1}}),m=measure(b);
 const off=buildFaceObjects(a,measure(a)),on=buildFaceObjects(b,m),base=buildFaceObjects(recipe(),m);
 assert.equal(off.getObjectByName('Glasses lenses'),undefined);
 assert.notDeepEqual(on.getObjectByName('Glasses frames and temples').geometry.attributes.position.array,base.getObjectByName('Glasses frames and temples').geometry.attributes.position.array);
 assert.ok(faceObjectPoint(m,128,104,.065).z>faceObjectPoint(m,128,104).z);
 assert.equal(on.getObjectByName('Glasses lenses').material.depthWrite,false);
 for(const g of [off,on,base])g.userData.dispose();
});
test('accessories follow the head bone and release their owned resources',()=>{
 installDOM();const a=buildAvatar(recipe()),g=a.root.getObjectByName('Face objects');assert.equal(g.parent,a.bones.head);
 let released=0;g.traverse(o=>{if(o.isMesh){o.geometry.addEventListener('dispose',()=>released++);o.material.addEventListener('dispose',()=>released++);}});
 const count=g.children.length;a.bones.head.rotation.y=.4;a.root.updateMatrixWorld(true);assert.ok(g.matrixWorld.elements.every(Number.isFinite));a.dispose();assert.equal(released,count*2);
});
