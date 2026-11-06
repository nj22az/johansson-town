import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {withVisibleMaterials} from '../src/render/compile-visible.js';

const fixture=()=>{
 const scene=new THREE.Scene(),closed=new THREE.Group(),visible=new THREE.Mesh(),unused=new THREE.Mesh(),inside=new THREE.Mesh();
 visible.name='current resident';unused.name='unused outfit';inside.name='closed room';
 unused.visible=false;closed.visible=false;closed.add(inside);scene.add(visible,unused,closed);
 // This is the traversal used by the vendored renderer's compile(), including hidden children.
 const compile=()=>{const names=[];scene.traverse(o=>{if(o.isMesh)names.push(o.name);});return names;};
 return {scene,closed,compile};
};

test('warm-up excludes hidden outfits and entire hidden rooms, retaining their real geometry',()=>{
 const {scene,closed,compile}=fixture(),traverse=scene.traverse;
 assert.deepEqual(compile(),['current resident','unused outfit','closed room'],'The renderer otherwise warms invisible material variants');
 assert.deepEqual(withVisibleMaterials(scene,compile),['current resident']);
 assert.equal(scene.traverse,traverse);assert.equal(Object.hasOwn(scene,'traverse'),false);
 closed.visible=true;assert.deepEqual(withVisibleMaterials(scene,compile),['current resident','closed room'],'The room remains complete and compiles when shown');
});

test('a driver exception restores the ordinary scene traversal',()=>{
 const {scene,compile}=fixture(),traverse=scene.traverse;
 assert.throws(()=>withVisibleMaterials(scene,()=>{throw Error('driver refused');}),/driver refused/);
 assert.equal(scene.traverse,traverse);assert.equal(compile().length,3);
});
