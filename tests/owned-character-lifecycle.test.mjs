import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {clone} from '../vendor/SkeletonUtils.js';
import {addOwnedCharacter,OWNED_CHARACTERS} from '../src/people/owned-characters.js';

test('closing an owned mascot releases its cloned bone texture once and preserves cached geometry and paint',async()=>{
 const template=new THREE.Group(),geometry=new THREE.BoxGeometry(1,1,1),material=new THREE.MeshStandardMaterial(),bone=new THREE.Bone();template.add(bone);
 const count=geometry.attributes.position.count,indices=new Uint16Array(count*4),weights=new Float32Array(count*4);for(let i=0;i<count;i++)weights[i*4]=1;
 geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
 const mesh=new THREE.SkinnedMesh(geometry,material),sourceSkeleton=new THREE.Skeleton([bone]);template.add(mesh);mesh.bind(sourceSkeleton);sourceSkeleton.computeBoneTexture();
 const context={THREE,clone,OWNED_CHARACTERS,window:{document:{}},load:async()=>({scene:template,animations:[]})};
 vm.runInNewContext('factory='+addOwnedCharacter.toString(),context);
 let sourceDisposals=0;for(const resource of [geometry,material,sourceSkeleton.boneTexture])resource.addEventListener('dispose',()=>sourceDisposals++);
 for(let i=0;i<10;i++){
  const parent=new THREE.Group(),actor=context.factory({parent,kind:'barfly',staticDisplay:true});assert.equal(await actor.ready,true);
  let own;actor.holder.traverse(o=>{if(o.isSkinnedMesh)own=o.skeleton;});assert.notEqual(own,sourceSkeleton);own.computeBoneTexture();
  let releases=0;own.boneTexture.addEventListener('dispose',()=>releases++);
  actor.dispose();actor.dispose();assert.equal(releases,1);assert.equal(own.boneTexture,null);assert.equal(parent.children.length,0);
 }
 assert.equal(sourceDisposals,0);sourceSkeleton.dispose();geometry.dispose();material.dispose();
});
