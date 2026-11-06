import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createStandIn} from '../src/render/static-props.js';

test('a stand-in draws a room as a few meshes, and the real room comes back untouched',()=>{
 const room=new THREE.Group(),box=new THREE.BoxGeometry(.2,.2,.2);
 for(let i=0;i<40;i++){const m=new THREE.Mesh(box,new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(i/40,.5,.5)}));m.position.set(i*.3,0,0);room.add(m);}
 const shelf=new THREE.InstancedMesh(box,new THREE.MeshStandardMaterial(),6);
 for(let i=0;i<6;i++)shelf.setMatrixAt(i,new THREE.Matrix4().makeScale(i<4?1:0,i<4?1:0,i<4?1:0));
 room.add(shelf);
 const hidden=new THREE.Mesh(box,new THREE.MeshBasicMaterial());hidden.visible=false;room.add(hidden);
 room.position.set(5,0,2);room.scale.setScalar(.7);
 const standIn=createStandIn(room);room.add(standIn.group);
 assert.equal(standIn.sources,41,'every visible mesh and nothing hidden');
 assert.equal(standIn.meshes,1,'same look, one draw');
 const merged=standIn.group.children[0];
 assert.equal(merged.geometry.attributes.position.count,(40+4)*36,'empty stock slots are left out');
 const colours=merged.geometry.attributes.color;
 assert.notDeepEqual([colours.getX(0),colours.getY(0)],[colours.getX(36*20),colours.getY(36*20)],'each piece keeps its colour');
 standIn.show(true);
 assert.ok(room.children.slice(0,41).every(o=>!o.layers.isEnabled(0)));
 standIn.show(false);
 assert.ok(room.children.slice(0,41).every(o=>o.layers.isEnabled(0)));
 assert.equal(standIn.group.visible,false);
});

test('moving things are neither copied into the stand-in nor drawn from outside',()=>{
 const room=new THREE.Group(),box=new THREE.BoxGeometry(.2,.2,.2);
 room.add(new THREE.Mesh(box,new THREE.MeshStandardMaterial()));
 const door=new THREE.Group();door.userData.dynamicProp=true;door.add(new THREE.Mesh(box,new THREE.MeshStandardMaterial()));room.add(door);
 const standIn=createStandIn(room);
 assert.equal(standIn.sources,1,'A door is merged into the street copy, frozen where it stood');
 standIn.show(true);
 assert.ok(!door.children[0].layers.isEnabled(0),'The real door is still drawn through the glass from the street');
 standIn.show(false);
 assert.ok(door.children[0].layers.isEnabled(0));
});

test('street copies preserve each stocked flavour without requiring an instance shader',()=>{
 const room=new THREE.Group(),geometry=new THREE.PlaneGeometry(.4,.6),texture=new THREE.Texture();
 geometry.setAttribute('atlasShift',new THREE.InstancedBufferAttribute(new Float32Array([0,0,.125,.25]),2));
 const shelf=new THREE.InstancedMesh(geometry,new THREE.MeshBasicMaterial({map:texture}),2);
 shelf.setMatrixAt(0,new THREE.Matrix4());shelf.setMatrixAt(1,new THREE.Matrix4().makeTranslation(1,0,0));room.add(shelf);
 const copy=createStandIn(room),uv=copy.group.children[0].geometry.attributes.uv;
 assert.equal(uv.count,12);
 for(let i=0;i<6;i++){
  assert.equal(uv.getX(i+6)-uv.getX(i),.125);
  assert.equal(uv.getY(i+6)-uv.getY(i),.25);
 }
 assert.equal(copy.group.children[0].geometry.attributes.atlasShift,undefined);
 assert.deepEqual(Array.from(geometry.attributes.atlasShift.array),[0,0,.125,.25],'The live stock shader keeps its own instance choices');
 copy.dispose();
});

test('live shop occupants stay animated and visible beside the merged furnishings',()=>{
 const room=new THREE.Group(),body=new THREE.Group();body.userData.name='Thuan';room.add(body);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());body.add(mesh);
 room.add(new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial()));
 const copy=createStandIn(room,{keepLive:o=>!!o.userData.name});room.add(copy.group);copy.show(true);
 assert.equal(copy.sources,1,'Only the fittings are flattened');
 assert.equal(mesh.layers.isEnabled(0),true,'The real worker remains in the street render');
 body.position.x=2;room.updateMatrixWorld(true);assert.equal(mesh.getWorldPosition(new THREE.Vector3()).x,2);
 copy.dispose();assert.equal(mesh.layers.isEnabled(0),true);
});

test('Sakura can merge fittings while preserving instanced shelf products without expanded copies',()=>{
 const room=new THREE.Group(),geometry=new THREE.BoxGeometry(.1,.2,.1),material=new THREE.MeshBasicMaterial(),stock=new THREE.InstancedMesh(geometry,material,1000);
 room.add(stock,new THREE.Mesh(geometry,material));
 const copy=createStandIn(room,{keepInstances:true});room.add(copy.group);copy.show(true);
 assert.equal(stock.layers.mask,1,'Shelf instances remain live and renderable');
 assert.equal(copy.sources,1,'Only the unbatched fitting is duplicated');
 assert.equal(copy.group.children[0].geometry.attributes.position.count,36,'No per-product vertex expansion');
 let sourceDisposals=0;geometry.addEventListener('dispose',()=>sourceDisposals++);material.addEventListener('dispose',()=>sourceDisposals++);
 copy.dispose();assert.equal(sourceDisposals,0,'Entry does not dispose shared product buffers or materials');
 assert.equal(stock.count,1000);assert.equal(stock.layers.mask,1);
});
