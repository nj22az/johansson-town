import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createTown} from '../src/world/town.js?snappy=1';
import {createTownSky} from '../src/render/sky.js';
import {installDOM} from './fixtures.mjs';
import {STREET_CAST_NAMES} from '../src/people/residents.js';
import {groundHeight,OUTER_PIER} from '../src/world/layout.js?snappy=1';

test('street has no transparent canopy sheets and phones retain bounded night lighting',()=>{
 installDOM();const scene=new THREE.Scene();
 const world=createTown({scene,sites:[],mobile:true,shadows:false,register(){},enter(){},onAction(){}});
 const pier=world.group.getObjectByName('pier-concrete-surface');
 assert.equal(groundHeight(0,-56),pier.position.y,'Physics and visible pier share the same height');
 // Whoever keeps the harbour office stands on the relocated workplace ground once back in the cast.
 const master=world.people.find(p=>p.g.userData.name==='Harbour master');if(STREET_CAST_NAMES.includes('Harbour master'))assert.equal(master.g.position.y,groundHeight(master.g.position.x,master.g.position.z),'Initial resident is grounded at the relocated workplace');
 assert.equal(groundHeight(0,-38),0,'Boardwalk remains flush');
 assert.equal(groundHeight(0,-46),0,'Approach is not raised with the pier');
 for(const z of [-50,-56,-64])assert.equal(groundHeight(2,z),OUTER_PIER.height);
 const barriers=[],lights=[];world.group.updateMatrixWorld(true);
 world.group.traverse(o=>{
  if(o.isPointLight&&o.userData.nightIntensity)lights.push(o);
  if(o.isMesh&&o.geometry.type==='CylinderGeometry'&&o.material.transparent){const b=new THREE.Box3().setFromObject(o);if(b.min.y<2&&b.max.x-b.min.x>5)barriers.push(o);}
 });
 assert.equal(barriers.length,0,'No street-wide vertical transparent surfaces');
 // The two deck lights at the top of the quay (z −32) are pools of light on the ground now, not point lights: a
 // point light cut a hard-edged disc at the footway's kerb. Pin them, so losing one is not mistaken for a tidy-up.
 assert.equal(lights.length,0,'no deck point lights');
 const deck=world.lampGlow.pools.group.children.filter(p=>p.position.z===-32);
 assert.deepEqual(deck.map(p=>p.position.x).sort((a,b)=>a-b),[-7.2,2.05]);
 assert.ok(deck.every(p=>p.userData.lightPool&&p.geometry.parameters.radius>2));
 world.update(0,0,0,1271);assert.ok(world.lampGlow.pools.group.visible&&world.lampGlow.pools.material.opacity>.4);
 world.update(0,0,1,1002);assert.equal(world.lampGlow.pools.group.visible,false);
});
test('sky is one opaque backdrop, follows the camera and is hidden indoors',()=>{
 const scene=new THREE.Scene(),sky=createTownSky(scene),camera=new THREE.PerspectiveCamera();camera.position.set(4,2,-20);
 sky.update(camera,1,false,false);assert.equal(scene.children.length,1);assert.equal(sky.mesh.material.transparent,false);assert.equal(sky.mesh.material.depthWrite,false);assert.ok(sky.mesh.position.equals(camera.position));
 const day=sky.mesh.material.color.clone();sky.update(camera,0,true,false);assert.ok(sky.mesh.material.color.r<day.r);
 sky.update(camera,1,false,true);assert.equal(sky.mesh.visible,false);
});
