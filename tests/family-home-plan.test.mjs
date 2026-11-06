import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildFamilyHome,FAMILY_HOME_LAYOUT} from '../src/world/interiors/family-home.js';

// Every room of both house plans can be walked to from the door, and both have the
// rooms a 1980s Okinawan house has (docs/BUILDING-AUDIT.md).
const members=[{name:'A',purpose:'a'},{name:'B',purpose:'b'},{name:'C',purpose:'c'},{name:'D',purpose:'d'}];
for(const [kind,rooms] of [['concrete',{genkan:[0,2.2],DK:[-1.3,1.5],toilet:[1.3,1.6],bath:[2.5,1.6],west:[-1.6,-.9],east:[1.6,-1.2]}],
                           ['red-tile',{ichibanza:[1.4,.2],nibanza:[-1.2,.9],kitchen:[-.2,-1.4],uraza:[1.4,-1.7],bath:[-1.55,-1.85],toilet:[-2.7,-1.85]}]]){
 test(`the ${kind} house has its rooms, and you can walk into every one of them`,()=>{
  installDOM();const room=new THREE.Group(),cols=[];
  const r=buildFamilyHome({room,reg(){},action(){},collider:(x,z,w,d)=>cols.push({x,z,w,d}),household:{members},title:'T',kind});
  const names=new Set();room.traverse(o=>{if(o.name)names.add(o.name.split(' (')[0]);});
  for(const n of ['Toilet','Bath','Butsudan','Kitchen counter'])assert.ok(names.has(n),kind+' has no '+n);
  if(kind==='concrete')assert.ok(names.has('Genkan tiles')&&names.has('Getabako'),'no genkan');
  else assert.ok(names.has('Tokonoma'),'no tokonoma');
  const B=FAMILY_HOME_LAYOUT.bounds,step=.1,R=.26,blocked=(x,z)=>x<B.minX+R||x>B.maxX-R||z<B.minZ+R||z>B.maxZ-R||cols.some(c=>Math.abs(c.x-x)<c.w/2+R&&Math.abs(c.z-z)<c.d/2+R);
  const key=(i,j)=>i+','+j,seen=new Set(),q=[[Math.round(r.spawn[0]/step),Math.round(r.spawn[2]/step)]];assert.equal(blocked(r.spawn[0],r.spawn[2]),false,'the door is blocked');
  seen.add(key(...q[0]));while(q.length){const [i,j]=q.pop();for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj,k=key(a,b);if(seen.has(k)||blocked(a*step,b*step))continue;seen.add(k);q.push([a,b]);}}
  for(const [name,[x,z]] of Object.entries(rooms)){
   let ok=false;for(let dx=-.4;dx<=.4&&!ok;dx+=.1)for(let dz=-.4;dz<=.4&&!ok;dz+=.1)ok=seen.has(key(Math.round((x+dx)/step),Math.round((z+dz)/step)));
   assert.ok(ok,`the ${name} cannot be reached from the door`);
  }
 });
}
