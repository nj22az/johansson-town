import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createHarbourInstances} from '../src/render/harbour-instances.js';
import {createTown} from '../src/world/harbour.js?snappy=1';
import {installDOM} from './fixtures.mjs';

function records(meshes){
 const matrix=new THREE.Matrix4(),colour=new THREE.Color(),rows=[];
 for(const mesh of meshes)for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,matrix);colour.copy(mesh.material.color);
  if(mesh.instanceColor)colour.multiply(new THREE.Color().fromBufferAttribute(mesh.instanceColor,i));
  rows.push(JSON.stringify([mesh.geometry.uuid,...matrix.elements.map(n=>+n.toFixed(5)),...colour.toArray().map(n=>+n.toFixed(5))]));
 }
 return rows.sort();
}
test('harbour consolidation preserves every transform and colour without changing source materials',()=>{
 const geo=new THREE.BoxGeometry(1,1,1),texture=new THREE.Texture();
 const materials=[0xff8040,0x4080ff].map(color=>new THREE.MeshStandardMaterial({color,map:texture,roughness:.7}));
 const sources=materials.map((mat,i)=>({geo,mat,matrices:[new THREE.Matrix4().compose(new THREE.Vector3(i,2,3),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.3),new THREE.Vector3(2,3,4))]}));
 const colours=materials.map(m=>m.color.clone()),before=createHarbourInstances(sources,{consolidate:false}),after=createHarbourInstances(sources);
 assert.equal(after.length,1);assert.deepEqual(records(after),records(before));
 materials.forEach((m,i)=>assert.ok(m.color.equals(colours[i])));
 assert.equal(after[0].material.map,texture);assert.equal(after[0].material.roughness,.7);
 assert.ok(after[0].boundingSphere.radius>0);assert.ok(after[0].boundingBox.containsPoint(new THREE.Vector3(0,2,3)));
 assert.ok(after[0].castShadow&&after[0].receiveShadow);
});
test('different surface settings, cells and mutable weather materials remain independent',()=>{
 const geo=new THREE.BoxGeometry(),red=new THREE.MeshStandardMaterial({color:0xff0000}),blue=new THREE.MeshStandardMaterial({color:0x0000ff}),rough=blue.clone();rough.roughness=.25;
 const road=blue.clone();const entries=[{geo,mat:red,matrices:[new THREE.Matrix4()]},{geo,mat:blue,matrices:[new THREE.Matrix4().makeTranslation(96,0,0)]},{geo,mat:rough,matrices:[new THREE.Matrix4()]},{geo,mat:road,mutable:true,matrices:[new THREE.Matrix4()]}];
 const meshes=createHarbourInstances(entries,{shadows:false});assert.equal(meshes.length,4);
 assert.ok(meshes.every(m=>!m.castShadow&&!m.receiveShadow));
 const roadMesh=meshes.find(m=>m.material===road);assert.ok(roadMesh);assert.equal(roadMesh.instanceColor,null);
 road.roughness=.28;assert.equal(roadMesh.material.roughness,.28);
 assert.throws(()=>createHarbourInstances(entries,{cellSize:0}),/positive/);
});
test('actual harbour retains anchors, colliders and weather updates across batching modes',()=>{
 installDOM();
 function build(harbourBatching){const scene=new THREE.Scene(),anchors=[];const world=createTown({scene,sites:[{id:'market',side:1,z:20,color:0x945060,accent:'#345678',title:'Market',jp:'店'}],mobile:false,shadows:true,harbourBatching,register:(o,label)=>anchors.push([o.position.toArray(),label]),enter(){},onAction(){}});return {world,anchors};}
 const before=build(false),after=build(true);
 assert.deepEqual(after.world.colliders,before.world.colliders);assert.deepEqual(after.anchors,before.anchors);
 // The road is the ground's now (ground-build.js): one mesh, its material the rulebook's, wet in the rain.
 const road=after.world.ground.meshes.get('road');assert.ok(road);const colour=road.material.color.clone(),dry=road.material.roughness;
 after.world.setRain(true);assert.ok(road.material.roughness<dry,'the road shines in the rain');
 after.world.update(1/60,1,0);assert.ok(road.material.color.equals(colour));
 after.world.setRain(false);assert.equal(road.material.roughness,dry);
 const count=world=>world.group.children.filter(o=>o.isInstancedMesh).length;
 // The quay's and the street's ground is laid as one mesh per class (ground-build.js), so little is left here to
 // consolidate; batching may never add a draw.
 assert.ok(count(after.world)<=count(before.world));
});
