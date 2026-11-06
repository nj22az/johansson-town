import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildClinic,buildCommunityKitchen} from '../src/world/interiors/town-hall.js';

// docs/BUILDING-AUDIT.md B5/B7: the clinic has a waiting room in front of the consulting room and a patients' WC, and
// the hall's public WC is off the community kitchen. Every one of them can be walked into from the door. (The mayor's
// house, with its WC and bath, is on Kitano-jima now, three floors walked by johansson-house-interior.test.mjs.)
const rooms=[
 ['clinic',buildClinic,{Toilet:[1.7,2.0],stool:[.5,-1.0],couch:[-1.9,-1.3],bench:[1.0,1.3]},['Toilet','Waiting room partition','Waiting bench']],
 ['community kitchen',buildCommunityKitchen,{Toilet:[1.6,2.0],islands:[0,-.6]},['Toilet']],
];
for(const [name,build,places,parts] of rooms){
 test(`the ${name} has its rooms, and each can be reached from the door`,()=>{
  installDOM();const room=new THREE.Group(),cols=[];
  const r=build({room,reg(){},action(){},exit(){},collider:(x,z,w,d)=>cols.push({x,z,w,d})});
  const names=new Set();room.traverse(o=>{if(o.name)names.add(o.name);});
  for(const n of parts)assert.ok(names.has(n),name+' has no '+n);
  const B=r.bounds,step=.1,R=.26,blocked=(x,z)=>x<B.minX+R||x>B.maxX-R||z<B.minZ+R||z>B.maxZ-R||cols.some(c=>Math.abs(c.x-x)<c.w/2+R&&Math.abs(c.z-z)<c.d/2+R);
  const key=(i,j)=>i+','+j,start=[Math.round(r.spawn[0]/step),Math.round(r.spawn[2]/step)],seen=new Set([key(...start)]),q=[start];
  assert.equal(blocked(r.spawn[0],r.spawn[2]),false,'the door is blocked');
  while(q.length){const [i,j]=q.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj,k=key(a,b);if(seen.has(k)||blocked(a*step,b*step))continue;seen.add(k);q.push([a,b]);}}
  for(const [place,[x,z]] of Object.entries(places)){
   let ok=false;for(let dx=-.4;dx<=.4&&!ok;dx+=.1)for(let dz=-.4;dz<=.4&&!ok;dz+=.1)ok=seen.has(key(Math.round((x+dx)/step),Math.round((z+dz)/step)));
   assert.ok(ok,`the ${place} in the ${name} cannot be reached from the door`);
  }
 });
}
