import {test} from 'node:test';
import {AIRPORT_ISLAND} from '../src/world/airport-island.js';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {addHorizon} from '../src/world/horizon.js';
import {createHarbourBasin,createSurroundingOcean,isOceanMaterial,tickOcean} from '../src/world/ocean.js';
import {buildIslandCoast} from '../src/world/island-coast.js';

test('surrounding sea is cel-shaded Gerstner water around the island',()=>{
  const group=new THREE.Group();
  addHorizon(group);
  buildIslandCoast(group);
  let sea=null;
  group.traverse(o=>{if(o.name==='Island surrounding sea')sea=o;});
  assert.ok(sea);
  assert.ok(isOceanMaterial(sea.material));
  assert.equal(sea.position.y,-.56);
  const ray=new THREE.Raycaster();
  const hit=(x,z)=>{ray.set(new THREE.Vector3(x,10,z),new THREE.Vector3(0,-1,0));return ray.intersectObject(sea,false).length>0;};
  assert.ok(hit(0,100),'Open water north of the coast');
  assert.ok(hit(-80,0),'Open water west of the headland');
  tickOcean(1.4);
  assert.equal(sea.material.uniforms.uTime.value,1.4);
});

test('harbour basin shares the same ocean material',()=>{
  const basin=createHarbourBasin();
  const surround=createSurroundingOcean();
  assert.equal(basin.material,surround.material);
  assert.equal(basin.geometry.parameters.width,160);
  assert.equal(basin.geometry.parameters.height,86);
});

test('the sea knows how far it is from land: shallows at the beach, open water far out',async()=>{
  const {shoreDistance,shoreDistanceTexture,SHORE_FIELD,oceanMaterial}=await import('../src/world/ocean.js');
  assert.equal(shoreDistance(0,0),0,'the town is on land');
  assert.ok(shoreDistance(46,0)<2,'the water off the beach is shallow');
  assert.ok(shoreDistance(60,0)>10&&shoreDistance(60,0)<20,'the buoy floats in the azure');
  assert.equal(shoreDistance(0,400),SHORE_FIELD.range,'open sea to the north');
  assert.ok(shoreDistance(AIRPORT_ISLAND.x,AIRPORT_ISLAND.z)===0,'the airport island is land too');
  const tex=shoreDistanceTexture();
  assert.equal(tex.image.width,SHORE_FIELD.size);
  assert.equal(oceanMaterial().uniforms.uShore.value,tex);
});

test('distant islands and sea take the light of the hour',async()=>{
  const {setOceanLight,oceanMaterial}=await import('../src/world/ocean.js');
  const group=new THREE.Group();addHorizon(group);
  let islands=null;group.traverse(o=>{if(o.name==='Distant islands')islands=o;});
  assert.ok(islands&&islands.children.length>=5);
  const mat=islands.children[0].material;
  setOceanLight({day:0,dusk:0});const night=mat.color.r,glintNight=oceanMaterial().uniforms.uGlint.value;
  setOceanLight({day:1,dusk:0});
  assert.ok(mat.color.r>night,'islands brighten by day');
  assert.equal(glintNight,0,'no sun glints at night');
  assert.ok(oceanMaterial().uniforms.uGlint.value>.9);
});
