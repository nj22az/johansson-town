import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {batchStaticProps} from '../src/render/static-props.js';

test('static batching preserves transformed vertices and interaction anchors; moving props stay live',()=>{
 const root=new THREE.Group();root.position.set(3,0,2);const prop=new THREE.Group();prop.position.set(2,0,2);prop.rotation.y=.4;root.add(prop);const material=new THREE.MeshStandardMaterial({color:0x887766}),objects=[],expected=[];
 for(let i=0;i<3;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,.5,.5),material);mesh.userData.staticProp=true;mesh.userData.hit={label:'Inspect',fn(){}};mesh.position.set(i,1,0);mesh.scale.set(1,1.2,1);prop.add(mesh);objects.push(mesh);}
 const cart=new THREE.Group();cart.userData.dynamicProp=true;root.add(cart);const moving=objects[0].clone();moving.userData.staticProp=true;cart.add(moving);
 root.updateMatrixWorld(true);for(const mesh of objects){const geometry=mesh.geometry.toNonIndexed(),p=geometry.attributes.position;for(let i=0;i<p.count;i++)expected.push(root.worldToLocal(mesh.localToWorld(new THREE.Vector3().fromBufferAttribute(p,i))));}
 const report=batchStaticProps(root);assert.equal(report.sourceMeshes,3);assert.equal(report.drawsSaved,2);assert.ok(moving.layers.test(new THREE.Layers()));
 for(const o of objects){assert.equal(o.visible,true);assert.equal(o.userData.hit.label,'Inspect');assert.equal(o.layers.test(new THREE.Layers()),false);}
 const merged=root.children.find(o=>o.name.startsWith('static-props:'));assert.ok(merged);const p=merged.geometry.attributes.position;assert.equal(p.count,expected.length);for(let i=0;i<p.count;i++)assert.ok(new THREE.Vector3().fromBufferAttribute(p,i).distanceTo(expected[i])<1e-5);
});
