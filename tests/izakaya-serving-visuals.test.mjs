import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {DISHES,DRINKS,createDishProp,createDrinkProp,createBiteProp,setPropPortion} from '../src/people/izakaya-beer.js';

const dishes=[...Object.keys(DISHES),'ramen','rice','gyoza'];
function inspect(group){
 let draws=0,triangles=0,sprites=0;
 group.traverse(o=>{
  if(o.isSprite)sprites++;
  if(o.isPoints){draws++;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));return;}
  if(!o.isMesh)return;draws++;
  const g=o.geometry;
  for(const [name,a] of Object.entries(g.attributes))assert.ok(a.array.every(Number.isFinite),o.name+' has finite '+name);
  assert.ok(g.index.array.every(i=>i<g.attributes.position.count));
  assert.ok(!Array.isArray(o.material),'Each mesh has one material and one draw');triangles+=g.index.count/3;
 });return {draws,triangles,sprites};
}

test('every Minato and Sato meal is real supported geometry that survives eating',()=>{
 installDOM();
 for(const kind of dishes){
  const group=createDishProp(kind),level=group.userData.level,cost=inspect(group),bounds=new THREE.Box3().setFromObject(group);
  assert.equal(cost.sprites,0,kind+' has no billboard substitute');assert.equal(group.userData.foodGeometry,'three-dimensional');
  assert.ok(Math.abs(bounds.min.y)<.000001,kind+' rests on its serving surface');
  assert.ok(bounds.max.y>.025,kind+' contains three-dimensional food');
  assert.ok(level.children.length>=2,kind+' has separate mouthfuls');
  assert.ok(cost.draws<=8&&cost.triangles<13000,kind+' stays within its per-serving budget');
  const dish=group.children.find(o=>o.isMesh&&o.name.startsWith('Turned '));assert.ok(dish);
  const dishVertices=dish.geometry.attributes.position.array.slice();
  setPropPortion(group,.5,{immediate:true});assert.ok(level.children.some(o=>!o.visible||o.scale.x<1));
  assert.deepEqual(dish.geometry.attributes.position.array,dishVertices,'Eating leaves the physical plate unchanged');
  setPropPortion(group,0,{immediate:true});assert.equal(level.visible,false);assert.equal(dish.visible,true,'An empty real dish remains');
 }
});

test('drinks use open vessels with measured lips, grounded bases and separate live contents',()=>{
 installDOM();
 for(const kind of [...Object.keys(DRINKS),'coffee','mugicha'])for(const held of [false,true]){
  const group=createDrinkProp(kind,{held}),cost=inspect(group),bounds=new THREE.Box3().setFromObject(group);
  assert.ok(Math.abs(bounds.min.y)<.000001,kind+' base rests on the surface');
  assert.ok(group.userData.rimHeight>0&&group.userData.rimHeight<=bounds.max.y+.000001,kind+' has an actual lip for drinking poses');
  assert.ok(cost.draws<=7&&cost.triangles<10000,kind+' remains compact');
  if(['draft','bottle','awamori','oolong','mugicha'].includes(kind)){
   const glass=group.getObjectByName('Hollow '+kind+' glass');assert.ok(glass);
   assert.ok(glass.material.transparent&&!glass.material.depthWrite&&glass.material.side===THREE.DoubleSide&&glass.material.forceSinglePass,'Hollow glass has visible inner walls and one transparent pass');
  }
  if(group.userData.pour){
   const {liquid,head}=group.userData.pour,start=liquid.position.y;
   setPropPortion(group,.25,{immediate:true});assert.ok(liquid.position.y<start&&head.visible);
   assert.equal(group.userData.level.scale.y,1,'Beer surface drains without flattening the glass');
  }
  setPropPortion(group,0,{immediate:true});assert.equal(group.userData.level.visible,false);
  assert.ok(group.children.some(o=>o.isMesh&&o.visible),'Empty cup or can remains');
 }
});

test('held bites match all meals and use a single edible mouthful between bamboo tips',()=>{
 for(const kind of dishes){
  const group=createBiteProp(kind),cost=inspect(group);assert.equal(cost.sprites,0);assert.equal(cost.draws,2);
  assert.equal(group.userData.level.children.length,1);setPropPortion(group,0,{immediate:true});assert.equal(group.userData.level.visible,false);
  assert.ok(group.getObjectByName('Tapered bamboo chopsticks').visible,'Finishing the bite leaves the utensils');
 }
});
