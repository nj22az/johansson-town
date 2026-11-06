import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {IZAKAYA_PLAYER_SEATS} from '../src/people/izakaya-beer.js';
import {SHARED_DINING_COLLIDERS} from '../src/world/interiors/shared-dining-layout.js';
import {buildIzakayaLivedIn,MINATO_DETAIL_SURFACES} from '../src/world/interiors/izakaya-lived-in.js';

const overlaps=(a,b)=>a.min[0]<b.max[0]&&a.max[0]>b.min[0]&&a.min[2]<b.max[2]&&a.max[2]>b.min[2];
const footprint=(x,z,w,d)=>({min:[x-w/2,0,z-d/2],max:[x+w/2,0,z+d/2]});

test('Minato everyday props actually rest on furniture within existing collision envelopes',()=>{
 const room=new THREE.Group(),{group,placements}=buildIzakayaLivedIn(room);
 assert.equal(group.parent,room);
 for(const item of placements){
  const surface=MINATO_DETAIL_SURFACES[item.surface];
  assert.ok(item.min[0]>=surface.minX-.000001&&item.max[0]<=surface.maxX+.000001,item.id+' remains within its table in x');
  assert.ok(item.min[2]>=surface.minZ-.000001&&item.max[2]<=surface.maxZ+.000001,item.id+' remains within its table in z');
  assert.ok(item.min[1]>=surface.y+.0039&&item.min[1]<=surface.y+.0041,item.id+' rests just above the actual upper face');
  assert.ok(SHARED_DINING_COLLIDERS.some(c=>item.min[0]>=c.x-c.w/2-.000001&&item.max[0]<=c.x+c.w/2+.000001&&item.min[2]>=c.z-c.d/2-.000001&&item.max[2]<=c.z+c.d/2+.000001),item.id+' uses an existing solid furniture footprint');
 }
 // Actual lounge tops differ from the collision height; using .73 buries napkins.
 assert.equal(MINATO_DETAIL_SURFACES.loungeNorth.y,FURNITURE_HEIGHTS.table);
});

test('Minato details leave ordered meals and existing fitted props clear',()=>{
 const {placements}=buildIzakayaLivedIn(new THREE.Group());
 for(const item of placements){
  const y=MINATO_DETAIL_SURFACES[item.surface].y;
  for(const seat of Object.values(IZAKAYA_PLAYER_SEATS))for(const pos of [seat.table,seat.dish]){
   if(Math.abs(pos[1]-y)>.01)continue;
   assert.ok(!overlaps(item,footprint(pos[0],pos[2],.20,.18)),item.id+' clears serving position '+seat.id);
  }
 }
 const existing=[];
 for(const [x,z] of [[-3.5,2.2],[2.6,2]]){
  for(const [dx,dz,w,d,label] of [[0,0,.3,.14,'condiment tray'],[-.4,-.05,.14,.025,'menu'],[-.7,-.25,.08,.08,'beer bottle'],[-.95,.15,.068,.068,'glass'],[-.35,-.35,.068,.068,'glass'],[.35,-.25,.16,.16,'edamame'],[.8,-.3,.3,.11,'skewers'],[.55,.3,.12,.12,'ashtray']])existing.push({id:label,y:FURNITURE_HEIGHTS.table,...footprint(x+dx,z+dz,w,d)});
 }
 for(const z of [4.15,5])existing.push({id:'lounge menu card',y:FURNITURE_HEIGHTS.table,...footprint(-4.6,z-.15,.11,.04)});
 existing.push({id:'prep chopping board',y:.8975,...footprint(5.4,-5.9,.5,.32)});
 for(const item of placements)for(const occupied of existing){
  if(Math.abs(MINATO_DETAIL_SURFACES[item.surface].y-occupied.y)>.01)continue;
  assert.ok(!overlaps(item,occupied),item.id+' clears the fitted '+occupied.id);
 }
 for(let i=0;i<placements.length;i++)for(let j=i+1;j<placements.length;j++){
  const a=placements[i],b=placements[j];if(a.surface!==b.surface)continue;
  assert.ok(!overlaps(a,b),a.id+' clears '+b.id);
 }
});

test('Minato details merge into four finite, compact draws with hollow transparent mugs',()=>{
 const {group}=buildIzakayaLivedIn(new THREE.Group()),draws=[];
 group.traverse(o=>{if(o.isMesh)draws.push(o);});
 assert.ok(draws.length<=4);
 let triangles=0;
 for(const mesh of draws){
  const g=mesh.geometry;
  assert.equal(g.attributes.position.count,g.attributes.color.count);
  for(const [name,a] of Object.entries(g.attributes))assert.ok(a.array.every(Number.isFinite),mesh.name+' has finite '+name);
  assert.ok(g.index.array.every(i=>i<g.attributes.position.count));
  assert.equal(g.groups.length,0,'No material subdraws');
  triangles+=g.index.count/3;
 }
 assert.ok(triangles<22000,'Everyday details stay within their geometry budget');
 const glass=draws.find(o=>o.name.endsWith('glass'));
 assert.ok(glass.material.transparent&&glass.material.opacity<.5&&!glass.material.depthWrite);
 assert.equal(glass.material.side,THREE.DoubleSide,'The open mug walls remain visible from inside');
 assert.ok(glass.material.forceSinglePass,'Double-sided glass keeps the four-draw budget');
});
