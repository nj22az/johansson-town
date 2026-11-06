import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildPark} from '../src/world/park.js';
import {buildEastLawn} from '../src/world/east-lawn.js';
import {HARBOUR_PARK_MAIN,HARBOUR_PARK_EXTENSION,HARBOUR_POND} from '../src/world/harbour-park-plan.js';
import {groundHeight} from '../src/world/layout.js';

test('park and lawn meet at the same level, colour and texture scale around both footprints',()=>{
 installDOM();const world={group:new THREE.Group(),colliders:[]};
 const lawn=buildEastLawn({parent:world.group,heightAt:groundHeight}).lawn;buildPark(world,{register(){},onAction(){}});
 for(const [name,b] of [['Harbour Park ground',HARBOUR_PARK_MAIN],['Harbour Park beach lawn',HARBOUR_PARK_EXTENSION]]){
  const ground=world.park.group.getObjectByName(name);assert.equal(ground.material.map.image,lawn.material.map.image);assert.equal(ground.material.color.getHex(),lawn.material.color.getHex());
  const lp=lawn.geometry.attributes.position,ln=lawn.geometry.attributes.normal,lu=lawn.geometry.attributes.uv;
  const boundary=new Map();for(let i=0;i<lp.count;i++)boundary.set(lp.getX(i).toFixed(4)+','+lp.getZ(i).toFixed(4),i);
  const {position:p,normal:n,uv}=ground.geometry.attributes;let corners=0;
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),z=p.getZ(i);if(!([b.minX,b.maxX].some(v=>Math.abs(x-v)<1e-5)&&[b.minZ,b.maxZ].some(v=>Math.abs(z-v)<1e-5)))continue;
   const j=boundary.get(x.toFixed(4)+','+z.toFixed(4));assert.notEqual(j,undefined,'Lawn shares corner '+[x,z]);corners++;
   assert.ok(Math.abs(p.getY(i)-lp.getY(j))<1e-4,'No vertical crack');assert.ok(Math.abs(n.getY(i)-ln.getY(j))<.001,'No shading seam');assert.ok(Math.abs(uv.getX(i)-lu.getX(j))<1e-5&&Math.abs(uv.getY(i)-lu.getY(j))<1e-5,'Continuous metre-based UVs');
  }
  assert.equal(corners,4,'Four measured rectangle corners');
 }
 world.group.updateMatrixWorld(true);const p=HARBOUR_POND,ray=new THREE.Raycaster(new THREE.Vector3(p.x,1,p.z),new THREE.Vector3(0,-1,0));
 assert.equal(ray.intersectObject(lawn).length,0,'Surrounding lawn leaves the pond opening clear');
 assert.equal(ray.intersectObject(world.park.group.getObjectByName('Harbour Park ground')).length,0,'Park turf has a real pond hole');
});
