import test from 'node:test';
import assert from 'node:assert/strict';
import {createKit} from '../src/world/okinawa/kit.js';
import {circleHitsRect} from '../physics.js';

/**
 * kit.rect: a rectangle in a kit frame becomes a world collider that covers the whole of it and no more, however the frame
 * is turned (a frame turned a little from square used to give a collider smaller than the thing: NEXT.md section 3; the
 * Aoba Garden's entrance posts, turned to face the approach, were the town's only ones).
 */
const corners=(x0,x1,z0,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
/** Where a local point lands under a frame at (x, z) turned ry (three.js rotation.y). */
const world=(fx,fz,ry,[x,z])=>[fx+x*Math.cos(ry)+z*Math.sin(ry),fz-x*Math.sin(ry)+z*Math.cos(ry)];

test('a collider covers its rectangle and no more, under any turn of the frame',()=>{
 const kit=createKit(),R=[-.3,.5,-.1,.9];
 for(const ry of [0,Math.PI/2,Math.PI,-Math.PI/2,.05,.33,-.33,Math.PI/4,2.2,-2.9]){
  let c;kit.at(3,-2,ry,()=>{c=kit.rect(...R,1.5,'test');});
  const [cx,cz]=world(3,-2,ry,[(R[0]+R[1])/2,(R[2]+R[3])/2]);
  assert.ok(Math.hypot(c.x-cx,c.z-cz)<1e-9,`at its middle (ry ${ry})`);assert.equal(c.height,1.5);assert.equal(c.id,'test');
  // every corner, pulled in a millimetre, is inside; every side, pushed out a centimetre, is outside
  const mid=[(R[0]+R[1])/2,(R[2]+R[3])/2];
  for(const p of corners(...R)){const q=[p[0]+(mid[0]-p[0])*.002,p[1]+(mid[1]-p[1])*.002];assert.ok(circleHitsRect(...world(3,-2,ry,q),0,c),`a corner left out (ry ${ry})`);}
  for(const p of [[R[0]-.01,mid[1]],[R[1]+.01,mid[1]],[mid[0],R[2]-.01],[mid[0],R[3]+.01]])assert.ok(!circleHitsRect(...world(3,-2,ry,p),0,c),`more than the rectangle (ry ${ry})`);
  // square to the world (a quarter turn or none), it is the plain axis-aligned rectangle it always was
  if(Math.abs(Math.sin(2*ry))<1e-9)assert.equal(c.yaw,undefined,'no turn on a square collider');
 }
});

test('a rectangle without a frame, or on a raised frame, is as before',()=>{
 const kit=createKit();
 assert.deepEqual(kit.rect(1,3,-2,-1,2,'flat'),{id:'flat',x:2,z:-1.5,w:2,d:1,height:2});
 let c;kit.at(0,0,Math.PI/2,()=>{c=kit.rect(1,3,-2,-1,2,'raised');},.4);
 assert.ok(Math.abs(c.w-1)<1e-9&&Math.abs(c.d-2)<1e-9&&Math.abs(c.minY-.4)<1e-9&&c.yaw===undefined);
});
