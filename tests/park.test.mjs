import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {preloadPark,buildPark,PARK_TREE} from '../src/world/park.js?snappy=1';
import {PARK,PARK_BENCH,parkHeight} from '../src/world/park-layout.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect,standingHitsRect} from '../physics.js';
import {clearArrivalLens} from '../src/render/spawn-scene.js';

let benchBytes;
before(async()=>{
 installDOM();benchBytes=await readFile(new URL('../assets/models/park/harbour-bench.glb',import.meta.url));
 const previousFetch=globalThis.fetch;let requests=0;
 // Serve only the actual local prop. A missing or unexpected request fails this
 // fixture instead of reaching the network or silently substituting the fallback.
 globalThis.fetch=async url=>{
  const asset=new URL(String(url));
  assert.equal(asset.origin,'https://nj22az.github.io');
  assert.equal(asset.pathname,'/johansson-town/assets/models/park/harbour-bench.glb');
  requests++;return new Response(benchBytes,{headers:{'content-type':'model/gltf-binary'}});
 };
 try{
  assert.equal(await preloadPark(),true,'the shipped local Blender bench loads');
  assert.equal(requests,1,'the bench is decoded from the actual asset');
 }finally{globalThis.fetch=previousFetch;}
});
function benchMeshes(world){
 const meshes=[];world.park.benchObject.traverse(o=>{if(o.isMesh)meshes.push(o);});return meshes;
}

test('the drawn park sits on its own ground, with its bench where the seat is and the view to the port open',async()=>{
 installDOM();
 assert.equal(await preloadPark(),true,'the decoded bench remains available');
 const world={group:new THREE.Group(),colliders:[]};buildPark(world,{register(){},onAction(){},shadows:false});world.group.updateMatrixWorld(true);
 assert.equal(world.park.benchSource,'blender');
 const authored=world.park.benchObject.getObjectByName('HarbourParkBench');assert.ok(authored,'the exported Blender authoring root is present');
 assert.equal(authored.userData.authoringSource,'tools/blender/build-harbour-bench.py');
 assert.equal(authored.userData.dimensionSource,'art/park/harbour-bench-spec.json');
 assert.equal(authored.userData.seatHeight,world.park.benchDimensions.seatHeight);
 const drawnBench=benchMeshes(world);assert.equal(drawnBench.length,3,'the bench uses three material draws');
 assert.ok(drawnBench.every(o=>o.userData.staticProp===true),'the actual exported bench is eligible for static batching');
 const triangles=drawnBench.reduce((n,o)=>n+(o.geometry.index?.count??o.geometry.attributes.position.count)/3,0);
 assert.ok(triangles<=1500,'the phone prop stays within its triangle budget: '+triangles);
 assert.ok(benchBytes.byteLength<=80_000,'the bench export stays within its local download budget');
 // Draws are the meshes shown: the cherry wears one dress, and a flowering season's kit and the petals draw only in season.
 const park=world.park.group,shown=o=>{for(let p=o;p&&p!==park;p=p.parent)if(!p.visible)return false;return true;};let meshes=0;park.traverse(o=>{if(o.isMesh&&shown(o)){meshes++;assert.ok(!o.isSkinnedMesh);}});
 assert.ok(meshes<=24,'The park is a handful of draws, not '+meshes);
 const ground=park.getObjectByName('Harbour Park ground');assert.ok(ground,'the level park ground is built');
 for(const [x,z] of [[2.06,0],[.7,0],[-8,-13.9],[-6,-7],[10,10]].map(([x,z])=>[PARK.x+x*PARK.scale,PARK.z+z*PARK.scale])){
  const hits=new THREE.Raycaster(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0)).intersectObject(ground,false);
  assert.ok(hits.length,'no ground at '+x+','+z);assert.ok(Math.abs(hits[0].point.y-parkHeight(x,z))<.03,'the ground is off the walkable height at '+x+','+z);
 }
 // The seat is wood, at the height the sitter is put.
 const hit=new THREE.Raycaster(new THREE.Vector3(PARK_BENCH.position[0],10,PARK_BENCH.position[2]),new THREE.Vector3(0,-1,0)).intersectObjects(drawnBench,false)[0];
 assert.ok(hit,'there is no bench under the seat');assert.ok(Math.abs(hit.point.y-PARK_BENCH.surfaceY)<.001,'the exported seat matches the actual sitting support');
 const eye=new THREE.Vector3(PARK_BENCH.position[0],PARK_BENCH.eyeY,PARK_BENCH.position[2]),direction=new THREE.Vector3(0,2,-44).sub(eye).normalize();
 assert.equal(new THREE.Raycaster(eye,direction,.1,25).intersectObject(park,true).length,0,'Bench view towards the port is unobstructed');
 // The cherry stands on its collider, in one dress at a time.
 const {blossom,leaf}=world.park.trees;assert.ok(blossom.visible!==leaf.visible,'the cherry wears both dresses at once');
 const tx=PARK.x+PARK_TREE[0]*PARK.scale,tz=PARK.z+PARK_TREE[1]*PARK.scale;assert.ok(world.colliders.some(c=>circleHitsRect(tx,tz,.1,c)),'the trunk has no collider');
});

test('the western approach is clear',()=>{
 installDOM();
 const world={group:new THREE.Group(),colliders:[]};buildPark(world,{register(){},onAction(){},shadows:false});
 const [x,z]=[6,-20.8];assert.equal(world.colliders.some(c=>circleHitsRect(x,z,.32,c)),false,'The western approach has a ghost collider');
});

test('bench collision matches its visible frame and leaves the camera clear above the backrest',()=>{
 installDOM();
 const world={group:new THREE.Group(),colliders:[]};buildPark(world,{register(){},onAction(){},shadows:false});world.group.updateMatrixWorld(true);
 const bench=world.colliders.find(c=>Number.isFinite(c.minY)&&circleHitsRect(PARK_BENCH.position[0],PARK_BENCH.position[2],.1,c));
 assert.ok(bench,'the seat has a bounded collider');
 // Measure the transformed exported model itself, independently of its metadata.
 let bottom=Infinity,top=-Infinity,minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;const point=new THREE.Vector3();
 for(const o of benchMeshes(world)){
  const positions=o.geometry.attributes.position;
  for(let i=0;i<positions.count;i++){
   point.fromBufferAttribute(positions,i).applyMatrix4(o.matrixWorld);
   bottom=Math.min(bottom,point.y);top=Math.max(top,point.y);
   minX=Math.min(minX,point.x);maxX=Math.max(maxX,point.x);minZ=Math.min(minZ,point.z);maxZ=Math.max(maxZ,point.z);
  }
 }
 assert.ok(Number.isFinite(top),'the frame is drawn');
 assert.ok(Math.abs((minX+maxX)/2-bench.x)<.001&&Math.abs(maxX-minX-bench.w)<.001,'collider spans the actual front and back of the frame');
 assert.ok(Math.abs((minZ+maxZ)/2-bench.z)<.001&&Math.abs(maxZ-minZ-bench.d)<.001,'collider spans the actual slat length');
 assert.ok(Math.abs(bench.minY-bottom)<.01,'collider begins at the legs');
 assert.ok(Math.abs(bench.minY+bench.height-top)<.01,'collider ends at the visible backrest');
 assert.ok(standingHitsRect(bench.x,bench.z,.32,parkHeight(bench.x,bench.z),bench),'a walking person cannot pass through the frame');
 const blocked=(x,z,y,r)=>(bench.minY<y+.12&&bench.minY+bench.height>y-.12&&circleHitsRect(x,z,r,bench));
 const target=new THREE.Vector3(bench.x,top+.15,bench.z),lens=target.clone().add(new THREE.Vector3(-2,.05,0));
 assert.equal(clearArrivalLens(target,lens,{blocked,ground:parkHeight}),true,'the arrival lens clears the real backrest');
});
