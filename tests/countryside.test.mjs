import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildCountryside,FIELDS,STEADS} from '../src/world/countryside.js';
import {routeAt} from '../src/world/layout.js';

// The countryside (sugar cane, vegetable plots, the Ōshiro farmstead, tombs) was laid on the uplands, which are retired:
// the owner, 18 October 2026 (AGENTS.md), "Keep Minato a compact urban port town. Do not restore rural districts";
// docs/qa/urban-only-island/README.md ("Rural and farming work is deferred to the tropical island"). Its fields now lie
// in the sea or in the inhabited blocks, so the builder must lay nothing, the town must not build it, and anything it
// ever lays again must still keep off roads, paths, gardens, trees and buildings (the checks below).
test('the retired countryside lays nothing on the compact island and keeps off roads, paths and buildings',async()=>{
 installDOM();
 const world={group:new THREE.Group(),colliders:[{id:'house',x:-20,z:90,w:4,d:4,height:3}],islandTrees:[[10,0,240]]};
 const {placed,group}=buildCountryside({world});
 assert.equal(placed.cane,0,'no sugar cane on the compact island');
 assert.equal(placed.crops,0,'no vegetable plots on the compact island');
 assert.deepEqual(placed.steads,[],'no farmstead, pen, tomb or trellis');
 assert.doesNotMatch(await readFile(new URL('../src/world/town.js',import.meta.url),'utf8'),/countryside/,'the town does not build the countryside');
 const p=new THREE.Vector3();let checked=0;
 group.traverse(o=>{
  if(o.name==='Field earth'){const m=new THREE.Matrix4();for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);p.setFromMatrixPosition(m);const r=routeAt(p.x,p.z);
   assert.ok(r?.surface==='grass'&&['island-ground','island-uplands'].includes(r.id),`a field lies on ${r?.id} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
   assert.ok(!(Math.abs(p.x+20)<3&&Math.abs(p.z-90)<3),'a field lies on a building');
   assert.ok(Math.hypot(p.x-10,p.z-240)>2.4,'a field lies under a tree');checked++;}}
 });
 assert.equal(checked,0,'no field earth is laid');
 for(const c of world.colliders.filter(c=>c.id==='countryside')){const r=routeAt(c.x,c.z);assert.ok(r?.surface==='grass','a countryside building stands on '+r?.id);}
 assert.ok(FIELDS.length>=5&&STEADS.length>=8);
});
