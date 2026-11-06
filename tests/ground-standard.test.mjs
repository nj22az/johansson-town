import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../vendor/three.module.js';

/**
 * One ground system for Minato (the owner, 21 October 2026: "Can you make a plan to finally fix the roads to a unified
 * system? Pavement? Walk paths, grass and sandy beach?"). Every surface comes from src/world/ground-standard.js, and
 * tools/ground-audit.mjs measures the town against it. This is a ratchet: tests/fixtures/ground-baseline.json lists
 * today's violations by stable key, and the town may not add one, grow one, or fix one without taking it off the list.
 * When a step fixes something: node tools/ground-audit.mjs --diff shows it, --write-baseline records it.
 */
const {GROUND_CLASSES,GROUND_EDGE,GROUND_EDGES,DISTRICTS,districtAt,edgeRule,GROUND,GROUND_LAYER}=await import('../src/world/ground-standard.js');
const audit=await import('../tools/ground-audit.mjs');

test('the rulebook: every class says where it belongs and why, and every edge names real classes',()=>{
 const districts=new Set(DISTRICTS.map(d=>d.id));
 for(const c of Object.values(GROUND_CLASSES)){
  assert.ok(Number.isInteger(c.colour)&&c.name&&c.finish&&c.why,c.id+' has a colour, a name, a finish and a reason');
  assert.ok(Number.isFinite(c.top)&&(c.graded?c.range.length===2:Number.isFinite(c.tolerance)),c.id+' has a height');
  assert.ok(c.where.length&&c.where.every(d=>districts.has(d)),c.id+' belongs in named districts');
 }
 for(const r of GROUND_EDGES){
  assert.ok(r.between.every(id=>GROUND_CLASSES[id]),r.between.join('|'));
  assert.ok(['kerb','line-gutter','edging','coral-edging','graded','flush'].includes(r.edge)&&r.why,r.between.join('|'));
 }
 assert.equal(new Set(GROUND_EDGES.map(r=>[...r.between].sort().join('|'))).size,GROUND_EDGES.length,'one rule per pair');
 // The owner's table: kerb on road|footway, line and gutter for lane|plot, stone edging for path|grass, coral edging
 // for coral sand, a graded join for the beach.
 assert.equal(edgeRule('road','pavers').edge,'kerb');assert.equal(edgeRule('concrete','road').edge,'kerb');
 assert.equal(edgeRule('lane','concrete').edge,'line-gutter');assert.equal(edgeRule('grass','lane').edge,'line-gutter');
 assert.equal(edgeRule('park-path','grass').edge,'edging');assert.equal(edgeRule('grass','coral-sand').edge,'coral-edging');
 assert.equal(edgeRule('grass','beach-sand').edge,'graded');
 assert.equal(GROUND_EDGE.kerb.height,.15);
 assert.equal(GROUND_CLASSES.pavers.top-GROUND_CLASSES.road.top,GROUND_EDGE.kerb.height,'Main Street\'s footway is a kerb above the road');
 assert.ok(GROUND_CLASSES['park-path'].top>GROUND_CLASSES.grass.top,'grass sits just below the paths');
});

test('the old exports are thin re-exports, so step 1 changes nothing that is drawn',async()=>{
 const {GROUND:palette}=await import('../src/render/ground-palette.js');
 const {GROUND_LAYER:layer}=await import('../src/world/ground-layers.js');
 const {ROAD_STANDARD}=await import('../src/world/road-standards.js');
 assert.equal(palette,GROUND);assert.equal(layer,GROUND_LAYER);
 // Today's tones and layers, as they were before the rulebook (steps 2 to 4 change these on purpose; step 4 moved the
 // beach's sand to its standard coral-white).
 assert.deepEqual({...GROUND},{asphalt:0xa9aeb4,pavers:0xc6c3ba,concrete:0xb7b5ab,coral:0xe2dac8,sand:GROUND_CLASSES['beach-sand'].colour,gravel:0xa29e93,grass:0x5c9848});
 assert.deepEqual({...GROUND_LAYER},{grass:.02,gravel:.02,lane:.04,apron:.06});
 assert.deepEqual({...ROAD_STANDARD.kerb},{height:GROUND_EDGE.kerb.height,width:GROUND_EDGE.kerb.width});
});

test('the districts agree with the layout modules',async()=>{
 const {MAIN_ROAD}=await import('../src/world/main-road.js');
 const {WEST_YARD}=await import('../src/world/west-yard.js');
 const {SCHOOL}=await import('../src/world/school-layout.js');
 const {EAST_LAWN}=await import('../src/world/east-lawn.js');
 const {HARBOUR_PARK_MAIN}=await import('../src/world/harbour-park-plan.js');
 const {NISHI}=await import('../src/world/okinawa/layout.js');
 const d=id=>DISTRICTS.find(x=>x.id===id);
 assert.deepEqual([d('main-street').minX,d('main-street').maxX,d('main-street').minZ],[MAIN_ROAD.pavementWest,MAIN_ROAD.pavementEast,MAIN_ROAD.minZ]);
 assert.deepEqual([d('west-yard').minX,d('west-yard').maxX],[WEST_YARD.minX,WEST_YARD.maxX]);
 assert.deepEqual([d('school').minX,d('school').maxX,d('school').minZ,d('school').maxZ],[SCHOOL.minX,SCHOOL.maxX,SCHOOL.minZ,SCHOOL.maxZ]);
 assert.deepEqual([d('east-lawn').minX,d('east-lawn').maxX],[EAST_LAWN.minX,EAST_LAWN.maxX]);
 assert.deepEqual([d('harbour-park').minX,d('harbour-park').maxX,d('harbour-park').minZ],[HARBOUR_PARK_MAIN.minX,HARBOUR_PARK_MAIN.maxX,HARBOUR_PARK_MAIN.minZ]);
 assert.equal(d('nishi-machi').maxX,NISHI.maxX);
 assert.equal(districtAt(-2.75,0),'main-street');assert.equal(districtAt(0,-60),'harbour');assert.equal(districtAt(-30,60),'kitahama');
});

const {scene,world}=await audit.buildAuditTown();
const routes=await audit.auditRoutes(),patches=await audit.auditPatches();
const baseline=JSON.parse(fs.readFileSync(audit.BASELINE_PATH,'utf8')).violations;
const result=audit.auditGround(scene,{routes,patches,colliders:world.colliders});
const show=v=>`  ${v.key}: ${v.amount}${v.was!==undefined?' (was '+v.was+')':''} at ${v.at[0]}, ${v.at[2]} — ${v.detail}`;

test('Minato\'s ground has no violation of its rulebook: nothing new, nothing grown, nothing left on the list',()=>{
 // Step 4 of the ground plan emptied the baseline (tests/fixtures/ground-baseline.json): every finding is new now.
 assert.deepEqual(Object.keys(baseline),[],'The baseline is empty since step 4: fix the ground, never list it');
 assert.deepEqual(result.violations.map(show),[],'Ground violations (draw it from src/world/ground-standard.js instead):');
 const {added,grown,fixed}=audit.compareToBaseline(result.violations,baseline);
 assert.deepEqual(added.map(show),[],'New ground violations (draw it from src/world/ground-standard.js instead):');
 assert.deepEqual(grown.map(show),[],'Ground violations that grew:');
 assert.deepEqual(fixed,[],'Fixed, so take them out of tests/fixtures/ground-baseline.json (node tools/ground-audit.mjs --write-baseline):');
});

test('the audit catches what it is for: a slab of its own colour and height, a path into the grass',()=>{
 // A pink slab 4 m square laid 10 cm proud on the east lawn, and a path that runs out into its grass.
 const slab=new THREE.Mesh(new THREE.BoxGeometry(4,.04,4),new THREE.MeshStandardMaterial({color:0xd04080}));
 slab.name='Planted test slab';slab.position.set(20,.1,14);scene.add(slab);
 // And an apron of the rulebook's own concrete, at neither kerb height nor flush.
 const apron=new THREE.Mesh(new THREE.BoxGeometry(3,.04,3),new THREE.MeshStandardMaterial({color:GROUND_CLASSES.concrete.colour}));
 apron.name='Planted test apron';apron.position.set(28,.08,14);scene.add(apron);
 const planted=[...routes,{id:'planted-path-to-nowhere',width:1.5,points:[[24.5,8],[24.5,12]]}];
 try{
  const again=audit.auditGround(scene,{routes:planted,patches,colliders:world.colliders});
  const {added,fixed}=audit.compareToBaseline(again.violations,baseline);
  const keys=added.map(v=>v.key);
  assert.ok(keys.some(k=>k.startsWith('colour|east-lawn|')&&k.includes('Planted test slab')),'off-rulebook colour: '+keys.join(', '));
  assert.ok(keys.includes('height|east-lawn|concrete|Planted test apron'),'off-rulebook height: '+keys.join(', '));
  assert.ok(!keys.some(k=>k.startsWith('colour|')&&k.includes('Planted test apron')),'the rulebook\'s own colour passes');
  assert.ok(keys.some(k=>k.startsWith('seam|east-lawn|')&&k.includes('Planted test slab')),'a seam with no edge: '+keys.join(', '));
  assert.ok(keys.includes('dead-end|east-lawn|planted-path-to-nowhere|end'),'a path that ends in grass');
  assert.deepEqual(fixed.filter(k=>!k.includes('east-lawn')),[],'the plant changes nothing elsewhere');
 }finally{scene.remove(slab,apron);}
 // And the list only shrinks: a fixed entry still listed, and an entry that grew, both fail.
 const one={key:'colour|east-lawn|grass|a grown surface',amount:20};
 const stale=audit.compareToBaseline(result.violations,{...baseline,'colour|main-street|road|a fixed surface|#a9aeb4':12});
 assert.deepEqual(stale.fixed,['colour|main-street|road|a fixed surface|#a9aeb4']);
 const grew=audit.compareToBaseline([...result.violations,one],{...baseline,[one.key]:one.amount/2});
 assert.deepEqual(grew.grown.map(v=>v.key),[one.key]);
});
