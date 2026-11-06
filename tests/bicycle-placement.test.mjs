import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createKit} from '../src/world/okinawa/kit.js';
import {bicycle,PARKED_BICYCLE} from '../src/world/okinawa/parked-bicycle.js';

/**
 * Every bicycle the town parks (okinawa/parked-bicycle.js) stands clear of every other solid: the owner, 20 October
 * 2026, "Bikes clip through objects". Each placed bicycle returns its collider; this builds the town and tests each
 * one's footprint, turned as it stands, against every collider and every other bicycle, and that each says whose it
 * is and why it is there (CLAUDE.md: nothing is random).
 */
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');
const {createIslandBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,kitano:'distant',shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});

/** The four corners of a collider, turned by its yaw as physics.js circleHitsRect reads it. */
function corners(c){
 const co=Math.cos(c.yaw||0),si=Math.sin(c.yaw||0),hw=c.w/2,hd=c.d/2;
 return [[-hw,-hd],[hw,-hd],[hw,hd],[-hw,hd]].map(([u,v])=>[c.x+co*u+si*v,c.z-si*u+co*v]);
}
/** Separating axes: whether two turned rectangles overlap by more than `slack` metres. */
function overlaps(a,b,slack=.005){
 const A=corners(a),B=corners(b);
 for(const P of [A,B])for(let i=0;i<2;i++){
  const [x0,z0]=P[i],[x1,z1]=P[i+1],len=Math.hypot(x1-x0,z1-z0),nx=-(z1-z0)/len,nz=(x1-x0)/len;
  const pa=A.map(([x,z])=>x*nx+z*nz),pb=B.map(([x,z])=>x*nx+z*nz);
  if(Math.max(...pa)-slack<=Math.min(...pb)||Math.max(...pb)-slack<=Math.min(...pa))return false;
 }
 return true;
}

const bicycles=world.colliders.filter(c=>c.bicycle);

test('the town parks its bicycles, each with an owner and a reason',()=>{
 assert.ok(bicycles.length>=20,`${bicycles.length} bicycles placed`);
 for(const b of bicycles){
  assert.ok(b.owner&&b.owner.length>=2,`${b.id} at ${b.x.toFixed(2)},${b.z.toFixed(2)} says whose it is`);
  assert.ok(b.why&&b.why.length>20,`${b.id} at ${b.x.toFixed(2)},${b.z.toFixed(2)} says why it stands there`);
 }
});

test('no bicycle stands in another solid or another bicycle',()=>{
 const clashes=[];
 // Round colliders (a bitt, a post) are tested as the square round them.
 const solids=world.colliders.map(c=>c.w!=null?c:{...c,w:2*c.r,d:2*c.r});
 for(const b of bicycles)for(const c of solids){
  if(c.id===b.id&&c.x===b.x&&c.z===b.z||(c.minY??0)>=b.height)continue;   // overhead: a shed's roof, a landing
  if(c.holds==='bicycles')continue;            // a shed or a rack, whose solid the bicycles stand in by design
  if(overlaps(b,c))clashes.push(`${b.id} (${b.x.toFixed(2)},${b.z.toFixed(2)}) in ${c.id||'unnamed'} (${c.x.toFixed(2)},${c.z.toFixed(2)} ${c.w.toFixed(2)}×${c.d.toFixed(2)})`);
 }
 assert.deepEqual(clashes,[]);
});

test('the separating-axis check sees a turned overlap and a clear gap',()=>{
 assert.equal(overlaps({x:0,z:0,w:1.74,d:.62,yaw:Math.PI/4},{x:.6,z:-.6,w:.3,d:.3}),true);
 assert.equal(overlaps({x:0,z:0,w:1.74,d:.62},{x:0,z:.5,w:2,d:.3}),false);
 assert.equal(overlaps({x:0,z:0,w:1.74,d:.62,yaw:Math.PI/2},{x:.5,z:0,w:.3,d:.3}),false);
});

test('a parked bicycle stands on its wheels and its stand, and its collider is the whole of it',()=>{
 const kit=createKit(),group=new THREE.Group();
 const collider=bicycle(kit,2,3,{ry:.4,colour:0xc8432f,id:'probe',owner:'test',why:'to be measured in a test, nothing more'});
 kit.finish(group,'probe');group.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(group);
 assert.ok(Math.abs(box.min.y)<.006,`the lowest point (${box.min.y.toFixed(3)}) is on the ground: tyres and stand feet`);
 assert.ok(box.max.y<=PARKED_BICYCLE.height+.005,'no higher than its collider');
 // Every vertex lies inside the turned footprint.
 const inv=new THREE.Matrix4().makeRotationY(-.4).multiply(new THREE.Matrix4().makeTranslation(-2,0,-3)),F=PARKED_BICYCLE.footprint,v=new THREE.Vector3();
 let outside=0,triangles=0;
 group.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;triangles+=p.count/3;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).applyMatrix4(inv);if(v.x<F.minX-.005||v.x>F.maxX+.005||v.z<F.minZ-.005||v.z>F.maxZ+.005)outside++;}});
 assert.equal(outside,0,'nothing pokes out of the collider');
 assert.ok(triangles<2200,`${triangles} triangles: light enough for a street of them`);
 assert.equal(collider.bicycle,true);assert.equal(collider.id,'probe');
 assert.ok(Math.abs(collider.w-(F.maxX-F.minX))<1e-6&&Math.abs(collider.d-(F.maxZ-F.minZ))<1e-6&&Math.abs(collider.yaw-.4)<1e-6);
});
