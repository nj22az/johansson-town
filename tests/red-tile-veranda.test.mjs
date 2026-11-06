import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createKit} from '../src/world/okinawa/kit.js';
import {redTileHouse} from '../src/world/okinawa/houses.js';
import {NEIGHBOURS} from '../src/people/neighbours.js';

const W=6.7,D=6.2,front=D/2-1.1;
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-5,`${label}: ${a} != ${b}`);
function house(yaw=0){
 const kit=createKit(),group=new THREE.Group();
 const matrix=new THREE.Matrix4().makeRotationY(yaw);matrix.setPosition(-30.85,0,-18.2);
 let colliders;
 kit.at(-30.85,-18.2,yaw,()=>{colliders=redTileHouse(kit,{w:W,d:D,seed:1});});
 const {meshes}=kit.finish(group,'Veranda test');group.updateMatrixWorld(true);
 const hits=(origin,direction)=>new THREE.Raycaster(
  new THREE.Vector3(...origin).applyMatrix4(matrix),
  new THREE.Vector3(...direction).transformDirection(matrix)
 ).intersectObjects(meshes,false);
 return {hits,colliders};
}

test('Higa’s veranda keeps the floor, cushion and resident at their established heights',()=>{
 const {hits,colliders}=house(Math.PI),higa=NEIGHBOURS.find(n=>n.name==='Grandmother Higa');
 for(const [x,z] of [[-1.05,2.5],[.7,2.35],[2.1,2.75]]){
  const surfaces=hits([x,.8,z],[0,-1,0]).filter(h=>h.point.y>.3);
  near(surfaces[0].point.y,higa.y,'The visible timber meets Grandmother Higa’s feet');
  const underlying=surfaces.filter(h=>h.point.y<surfaces[0].point.y-1e-5);
  assert.ok(underlying.every(h=>surfaces[0].point.y-h.point.y>=.015),'The timber clears every upward-facing support');
 }
 near(hits([-W/4,.8,D/2-.5],[0,-1,0])[0].point.y,.57,'The blue cushion remains on the veranda');
 near(colliders[0].w,W+.2,'The existing house collider width is preserved');
 near(colliders[0].d,D+.05,'The existing house collider depth is preserved');
});

test('the front and side edges of a red-tile veranda have one visible surface at every height',()=>{
 // Check the actual built triangles in several orientations. Upward-only ground audits
 // miss the old 4 cm strip where timber and coral occupied the same vertical face.
 for(const yaw of [0,Math.PI/2,Math.PI]){
  const {hits}=house(yaw);
  const probes=[];
  for(const x of [-2.73,-1.31,.41,1.77,2.91])probes.push({from:[x,0,D/2+.4],dir:[0,0,-1]});
  for(const side of [-1,1])for(const z of [front+.23,D/2-.27])probes.push({from:[side*(W/2+.4),0,z],dir:[-side,0,0]});
  for(const y of [.385,.415,.435,.455])for(const {from,dir} of probes){
   const surfaces=hits([from[0],y,from[2]],dir),first=surfaces[0];
   assert.ok(first,'The veranda retains its solid outer edge');
   const samePlane=surfaces.filter(h=>Math.abs(h.distance-first.distance)<1e-5);
   // A ray exactly on a triangle diagonal may return both halves of one material.
   const materials=new Set(samePlane.map(h=>h.object.material.uuid));
   assert.equal(materials.size,1,`Competing stone and timber at yaw=${yaw}, y=${y}, local edge ${from}`);
   assert.ok(samePlane.every(h=>!h.object.material.polygonOffset&&h.object.renderOrder===0),'Real geometry separates the surfaces');
  }
 }
});
