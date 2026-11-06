import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {normalizeRecipe,encodeRecipe,decodeRecipe,PARTS} from '../src/avatars/recipe.js';
import {recipeFor} from '../src/avatars/cast.js';
import {buildAvatar,measure} from '../src/avatars/build.js';
import {applyCelShading} from '../src/render/cel.js';
import {buildSakuraDetails} from '../src/world/exterior-details.js';
import {createKit} from '../src/world/okinawa/kit.js';
import {createMaterials} from '../src/render/materials.js';

installDOM();

test('existing v1 saves retain their features and gain safe silhouette defaults',()=>{
 const old={v:1,name:'Saved resident',head:{size:.4,shape:.7},eyes:{style:'almond',spacing:.2},hair:{style:'braids'},nose:{style:'hook'}};
 const saved=decodeRecipe(btoa(JSON.stringify(old)));
 assert.equal(saved.name,old.name);assert.equal(saved.head.size,.4);assert.equal(saved.head.shape,.7);
 assert.equal(saved.head.form,'oval');assert.equal(saved.head.jaw,.5);assert.equal(saved.head.cheeks,.5);
 assert.equal(saved.hair.style,'braids');assert.equal(saved.nose.style,'hook');
 assert.deepEqual(decodeRecipe(encodeRecipe(saved)),saved);
 const safe=normalizeRecipe({head:{form:'missing',jaw:99,cheeks:-99}});
 assert.equal(safe.head.form,'oval');assert.equal(safe.head.jaw,1);assert.equal(safe.head.cheeks,0);
});

test('all face forms have distinct geometry and stay in proportion at slider limits',()=>{
 const shapes=new Set();
 for(const form of PARTS.head){
  const av=buildAvatar({...recipeFor('Thuan'),head:{form,size:.5,shape:.5,jaw:.5,cheeks:.5}});
  shapes.add(JSON.stringify([...av.face.head.geometry.attributes.position.array]));
  assert.ok([...av.face.head.geometry.attributes.position.array].every(Number.isFinite));av.dispose();
  for(const size of [0,1])for(const shape of [0,1]){
   const m=measure({head:{form,size,shape}}),ratio=2*m.Rh*m.headSY/m.H;
   assert.ok(ratio>.23&&ratio<.42,`${form}: head occupies ${ratio} of height`);
  }
 }
 assert.equal(shapes.size,PARTS.head.length);
 const names=['Johansson','Thuan','Thao','Mr Ōshiro','Mrs Kinjō','Mrs Nakamura'];
 assert.ok(new Set(names.map(n=>recipeFor(n).head.form)).size>=4);
});


test('architectural fittings stay batched and leave the Sakura entrance clear',()=>{
 const root=new THREE.Group(),shop=buildSakuraDetails(root,{width:14,depth:11,doorX:0});
 assert.equal(shop.children.length,2);
 for(const group of [shop])for(const mesh of group.children){
  assert.equal(mesh.material.userData.keepPhysical,true);assert.ok([...mesh.geometry.attributes.position.array].every(Number.isFinite));
 }
 const ray=new THREE.Raycaster(new THREE.Vector3(0,1,1),new THREE.Vector3(0,0,-1),0,1.5);
 root.updateMatrixWorld(true);assert.equal(ray.intersectObject(shop,true).length,0,'No fittings across the doorway at walking height');
});

test('district plaster joins the toon ramp with its painted map and metre-sized UVs',()=>{
 // October 2026 look pass (docs/AMPLIFY-AUDIT.md, A1): architecture is no longer kept
 // physical. The map survives as faint grain; normal, roughness and AO have no meaning
 // under a ramp and are dropped.
 const kit=createKit(),map=new THREE.Texture(),normalMap=new THREE.Texture(),arm=new THREE.Texture();
 kit.surface('plaster',{map,normalMap,roughnessMap:arm,aoMap:arm,metres:2});
 kit.box(4,3,.2,0,1.5,0,0xe7dcc2,{finish:'plaster'});
 const root=new THREE.Group(),{meshes}=kit.finish(root);applyCelShading(root);
 assert.equal(meshes.length,1);assert.equal(meshes[0].material.isMeshToonMaterial,true);
 assert.equal(meshes[0].material.map,map);assert.ok(meshes[0].material.userData.flatten.value<.5,'Photograph reduced to grain');
 assert.ok(meshes[0].geometry.attributes.uv.count>0);
});


test('painted plaster has a light neutral base rather than the dark stone photograph',()=>{
 const plaster=createMaterials().material('plaster');
 assert.equal(plaster.map.isDataTexture,true);
 const pixels=plaster.map.image.data;
 for(let i=0;i<pixels.length;i+=4){assert.ok(pixels[i]>=238);assert.equal(pixels[i],pixels[i+1]);assert.equal(pixels[i+3],255);}
 assert.equal(plaster.userData.keepPhysical,true);assert.equal(plaster.normalScale.x,.16);
});
