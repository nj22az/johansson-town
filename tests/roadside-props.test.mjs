import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
const {buildTeaStop,buildFishCart,placeTeaStop}=await import('../src/world/roadside-props.js');
const {NEIGHBOURS,NEIGHBOUR_TALK}=await import('../src/people/neighbours.js');
const {PLACES}=await import('../src/people/cast.js');

const triangles=mesh=>mesh.geometry.attributes.position.count/3;

test('each roadside prop is one vertex-coloured mesh within a small budget',()=>{
 for(const [build,budget] of [[buildTeaStop,1600],[buildFishCart,2400]]){
  const mesh=build();
  assert.ok(mesh.isMesh,'a single mesh: one draw call');
  assert.ok(mesh.geometry.attributes.color,'colours are baked into the vertices');
  assert.ok(!mesh.material.map,'no texture to load');
  assert.ok(triangles(mesh)<budget,mesh.name+' has '+triangles(mesh)+' triangles');
  for(const v of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(v));
  const box=new THREE.Box3().setFromObject(mesh);assert.ok(box.min.y>=-.01,mesh.name+' stands on the ground');
 }
});

test('the tea stop blocks the way where it stands and sells a cup of tea',()=>{
 const world={group:new THREE.Group(),colliders:[]},registered=[];let bought=null;
 placeTeaStop(world,{register:(o,label,fn)=>registered.push({o,label,fn}),onAction:(...args)=>{bought=args;}},{x:5,y:1,z:-3,ry:.4});
 assert.equal(world.colliders.filter(c=>c.teaStop).length,2);
 const buy=registered.find(r=>/sencha/.test(r.label));assert.ok(buy);buy.fn();
 assert.equal(bought[0],'buy');assert.equal(bought[2].item,'Green tea');assert.equal(bought[2].cost,100);
});

test('the fish cart is gone: nobody pushes a cart along the main street, and the catch is sold at the auction',()=>{
 assert.equal(NEIGHBOUR_TALK['Mr Toguchi'],undefined,'the fish seller has left the island');
 assert.deepEqual(NEIGHBOURS.filter(n=>n.cart).map(n=>n.name),[],'no neighbour walks a cart');
 assert.ok(PLACES['fish-auction'].keepers.includes('Kōji'),'Kōji sorts the morning catch at the auction');
});
