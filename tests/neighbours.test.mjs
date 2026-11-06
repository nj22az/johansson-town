import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {preloadStreetPlants,buildStreetPlants} from '../src/world/street-plants.js';
import {createMaterials} from '../src/render/materials.js?snappy=1';
import {createHarbourInstances} from '../src/render/harbour-instances.js';

test('the selected OS3A plant loads its real geometry and batches nearby placements',async()=>{
 installDOM();const previous={fetch:globalThis.fetch,bitmap:globalThis.createImageBitmap,self:globalThis.self};
 globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:512,height:512,close(){}});
 globalThis.fetch=async url=>String(url).startsWith('blob:')?previous.fetch(url):new Response(await readFile(new URL('../assets/'+new URL(url).pathname.split('/assets/')[1],import.meta.url)));
 try{
  assert.equal(await preloadStreetPlants(),true);const parent=new THREE.Group();
  const result=buildStreetPlants(parent,[{x:1,z:2,height:1.1},{x:3,z:3,height:1.2},{x:40,z:2,height:1.0}],{shadows:true});
  assert.equal(result.count,3);assert.equal(result.draws,4);
  for(const mesh of parent.children){assert.ok(mesh.isInstancedMesh);assert.ok(mesh.boundingSphere.radius>0);assert.equal(mesh.material.transparent,false);}
  const bounds=new THREE.Box3().setFromObject(parent);assert.ok(Math.abs(bounds.min.y)<.001);assert.ok(bounds.max.y>=1.19&&bounds.max.y<=1.21);
 }finally{globalThis.fetch=previous.fetch;globalThis.createImageBitmap=previous.bitmap;globalThis.self=previous.self;}
});

test('world texture scale survives colour batching without changing authored UVs',()=>{
 installDOM();const material=createMaterials().worldMaterial('concrete',0xaabbcc,2),geometry=new THREE.BoxGeometry();
 const uv=geometry.attributes.uv.array.slice();const [mesh]=createHarbourInstances([{geo:geometry,mat:material,matrices:[new THREE.Matrix4().makeScale(8,6,10)]}]);
 const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader};mesh.material.onBeforeCompile(shader);
 assert.equal(shader.uniforms.townTileMetres.value,2);assert.match(shader.vertexShader,/instanceMatrix\*townPosition/);
 assert.match(shader.vertexShader,/vBumpMapUv=/);assert.deepEqual(geometry.attributes.uv.array,uv);
});
