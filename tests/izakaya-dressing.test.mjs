import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildIzakayaDressing,BOTTLE_KEEP,MINATO_1997_POSTERS,KEEP_SHELF,OSHIBORI_WARMER} from '../src/world/interiors/izakaya-dressing.js';
import {IZAKAYA_PLAYER_SEATS} from '../src/people/izakaya-beer.js';

test('Minato carries its 1997 posters, the bottle keep and the table things in a few draws',()=>{
 installDOM();
 const room=new THREE.Group(),colliders=[];
 const {group,bottles}=buildIzakayaDressing(room,{collider:(x,z,w,d,h)=>colliders.push({x,z,w,d,h})});
 assert.ok(MINATO_1997_POSTERS.length===5,'Five period posters; the real calendar is separate');
 for(const [,x,y,z,yaw,w,h] of MINATO_1997_POSTERS){
  // On a wall of the room (x or z at the wall line), clear of the floor and the ceiling.
  assert.ok(Math.abs(Math.abs(x)-6.29)<.01||Math.abs(Math.abs(z)-6.29)<.01,'On a wall');
  assert.ok(y-h/2>1.2&&y+h/2<3.2,'Above the wainscot and under the beams');
 }
 assert.equal(bottles.count,BOTTLE_KEEP.length,'One bottle per regular who keeps one');
 const draws=[];group.traverse(o=>{if(o.isMesh)draws.push(o.name);});
 assert.ok(draws.length<=5,'Posters, props, lanterns and bottles: '+draws.join(', '));
 assert.ok(colliders.some(c=>Math.abs(c.z-KEEP_SHELF.z)<.01),'The shelf is solid');
});

const overlap=(a,b)=>a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[2]<b.max[2]&&a.max[2]>b.min[2];
const footprint=(x,z,w,d)=>({min:[x-w/2,0,z-d/2],max:[x+w/2,0,z+d/2]});

test('Minato detailed vessels remain supported and clear of served meals and the sink',()=>{
 installDOM();const {placements}=buildIzakayaDressing(new THREE.Group());
 const caddies=placements.filter(p=>p.id.startsWith('Condiment caddy'));
 assert.equal(caddies.length,7);
 for(const caddy of caddies){
  const surface=caddy.id.includes(',-2.24')?FURNITURE_HEIGHTS.serviceCounter:caddy.id==='Condiment caddy 5,0.25'?.77:FURNITURE_HEIGHTS.table;
  assert.ok(Math.abs(caddy.min[1]-surface-.002)<.000001,'Caddy base rests on its actual table');
  for(const seat of Object.values(IZAKAYA_PLAYER_SEATS))for(const pos of [seat.table,seat.dish]){
   if(Math.abs(pos[1]-surface)>.01)continue;
   assert.ok(!overlap(caddy,footprint(pos[0],pos[2],.2,.18)),caddy.id+' clears '+seat.id+' serving space');
  }
 }
 const warmer=placements.find(p=>p.id==='Oshibori towel warmer');
 assert.ok(Math.abs(warmer.min[1]-OSHIBORI_WARMER.y)<.000001,'Warmer feet sit on the worktop');
 assert.ok(warmer.min[0]>=.35&&warmer.max[0]<1.05,'Warmer clears the glass rack and grill');
 assert.ok(!overlap(warmer,footprint(2.85,-3.06,.46,.36)),'Warmer no longer sits in the sink');
 assert.ok(warmer.min[2]>=-3.37&&warmer.max[2]<=-2.75,'Entire cabinet and handle remain on the counter');
 const lucky=placements.find(p=>p.id==='Glazed lucky tanuki');
 assert.ok(lucky.min[0]>=2.25-.21&&lucky.max[0]<=2.25+.21&&lucky.min[2]>=5.78-.19&&lucky.max[2]<=5.78+.19,'Tanuki and both held objects stay inside the unchanged floor collider');
 assert.ok(Math.abs(lucky.min[1])<.000001,'Tanuki rests on the floor');
});

test('Minato detailed dressing has finite merged geometry and a bounded cost',()=>{
 installDOM();const {group,bottles}=buildIzakayaDressing(new THREE.Group());let triangles=0;
 for(const mesh of group.children){
  const g=mesh.geometry;
  for(const [name,a] of Object.entries(g.attributes))assert.ok(a.array.every(Number.isFinite),mesh.name+' has finite '+name);
  assert.ok(g.index.array.every(i=>i<g.attributes.position.count));assert.equal(g.groups.length,0,'Merged material has no hidden subdraws');
  triangles+=g.index.count/3*(mesh.isInstancedMesh?mesh.count:1);
 }
 assert.ok(triangles<48000,'Detailed real vessels keep a small fixed scene cost');
 assert.equal(group.children.length,5,'One atlas, paper, solid props, glazed fittings and bottle instances');
 assert.equal(bottles.count,BOTTLE_KEEP.length,'Real product labels do not duplicate the kept bottles');
});
