import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';

installDOM();globalThis.self=globalThis;
const {roadSign}=await import('../src/world/road-standards.js');
const {cherrySeason,buildCherryTree,cherryGeometries,CHERRY_SEASONS}=await import('../src/world/cherry-tree.js');
const {KOBAN}=await import('../src/world/koban-layout.js');
/** Town minutes at 07:30 on a month and day (the town's calendar reads days since 1970 as month and day). */
const at=(month,day)=>Math.round((Date.UTC(1970,month-1,day)/86400000)*1440+450);

test('the stop sign reads from the front only; from behind it is its grey plate, the same inverted triangle',()=>{
 const parent=new THREE.Group(),g=roadSign(parent,'stop',{x:0,z:0});
 const face=g.getObjectByName(g.name+' face'),back=g.getObjectByName(g.name+' back plate');
 assert.ok(face&&back,'face and back plate');
 assert.equal(face.material.side,THREE.FrontSide,'止まれ is not drawn on the back');
 g.updateMatrixWorld(true);
 const n=v=>new THREE.Vector3(0,0,1).applyQuaternion(v.getWorldQuaternion(new THREE.Quaternion()));
 assert.ok(n(face).z>.99&&n(back).z<-.99,'the face looks forward and the plate back');
 back.geometry.computeBoundingBox();const b=back.geometry.boundingBox;
 assert.ok(Math.abs(b.max.x-b.min.x-.68)<.03&&back.geometry.attributes.position.count<=6,'the plate is the sign’s triangle, not a square');
 const crossing=roadSign(parent,'crossing',{x:0,z:0});assert.ok(crossing.getObjectByName(crossing.name+' back plate'),'the crossing sign keeps its back too');
});

test('the harbour cherry is a kanhizakura: green in October, in flower late January and February, bare in early January',()=>{
 assert.equal(cherrySeason(at(10,19)),'leaf');
 assert.equal(cherrySeason(at(1,25)),'bloom');
 assert.equal(cherrySeason(at(2,14)),'bloom');
 assert.equal(cherrySeason(at(1,5)),'bare');
 assert.equal(cherrySeason(at(12,10)),'turning');
 assert.equal(cherrySeason(at(3,10)),'leaf');
 // Every day of the year has exactly one season.
 for(let d=0;d<365;d++){const m=d*1440+450,date=new Date(Date.UTC(1970,0,1+d)),md=(date.getUTCMonth()+1)*100+date.getUTCDate();
  assert.equal(CHERRY_SEASONS.filter(s=>md>=s.from[0]*100+s.from[1]&&md<=s.to[0]*100+s.to[1]).length,1,'one season on '+md);assert.ok(cherrySeason(m));}
 const tree=buildCherryTree();
 for(const [minutes,season] of [[at(10,19),'leaf'],[at(2,1),'bloom'],[at(1,5),'bare'],[at(12,10),'turning']]){
  tree.dress(minutes);
  assert.equal(tree.meshes.blossom.visible,season==='bloom','blossom on '+season);assert.equal(tree.meshes.leaf.visible,season!=='bloom','leaf mesh on '+season);
  if(season!=='bloom')assert.equal(tree.meshes.leaf.geometry,tree.dresses[season],'the leaf mesh wears the '+season+' dress');
 }
 tree.dress(at(10,19));
 // Clustered lobes, not one ball: the crown is several separate clumps, with sky between them.
 const g=cherryGeometries().leaf;g.computeBoundingBox();const size=g.boundingBox.getSize(new THREE.Vector3());
 assert.ok(size.x>.7&&size.y<.6,'a spreading crown, wider than tall');
 const tris=[tree.dresses.leaf,tree.dresses.bloom].reduce((n,g)=>n+g.attributes.position.count/3,0);
 assert.ok(tris<12000,'light enough for a phone: '+tris+' triangles');
});

test('the police station says 警察署, and its counter window keeps the police box’s 交番',async()=>{
 const {japaneseSign}=await import('../src/world/okinawa/signs.js');
 assert.equal(japaneseSign(KOBAN.jp),'警察署');
 assert.equal(japaneseSign('Minato Police Station'),'港警察署');
 assert.equal(japaneseSign('Police box'),'交番');
});

test('the coastal walk over the east beach is the beach itself, and the park keeps one paving family',async()=>{
 // Step 4 of the ground plan: along the east beach the walk is the sand (no strip laid on it), round Kitahama it is
 // laid in concrete, and the park's walks are one family of rolled crushed stone (ground-plan-coast.js).
 const {laidWalkPieces}=await import('../src/world/ground-walks.js');
 const {onBeach}=await import('../src/world/beach-layout.js');
 const coast=laidWalkPieces().filter(p=>p.route==='island-coast-walk');
 assert.ok(coast.length>=3,'the walk round Kitahama is laid');
 for(const p of coast){const n=p.polygon.length,x=p.polygon.reduce((s,v)=>s+v[0],0)/n,z=p.polygon.reduce((s,v)=>s+v[1],0)/n;assert.ok(!onBeach(x,z),'no walk is laid on the sand at '+[x,z]);}
 const {coastWalkGround}=await import('../src/world/ground-plan-coast.js');
 const park=coastWalkGround().pieces.filter(p=>p.walk.startsWith('garden-')||p.walk==='park-approach');
 assert.ok(park.length>50);assert.deepEqual([...new Set(park.map(p=>p.cls))],['park-path'],'one family: the rulebook\'s park path');
});

test('the yard windbreak stands off the paving and clear of the lane openings through the old yard wall',async()=>{
 const {YARD_WINDBREAK}=await import('../src/world/okinawa/quarters.js');
 const {WEST_YARD}=await import('../src/world/west-yard.js');
 for(const z of YARD_WINDBREAK.z)assert.ok(WEST_YARD.lanes.every(l=>Math.abs(z-l)>WEST_YARD.laneHalf+.5),'fukugi at z '+z+' is clear of the lane gaps');
 assert.ok(YARD_WINDBREAK.x>WEST_YARD.minX&&YARD_WINDBREAK.x<WEST_YARD.minX+1,'along the old wall line');
});
