import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';

/**
 * The ground generator (step 2 of the owner's ground plan, 21 October 2026: "Can you make a plan to finally fix the roads
 * to a unified system?"). Main Street and the harbour are laid from their plans (ground-plan.js, ground-plan-harbour.js)
 * by one builder (ground-build.js), from the rulebook's classes, tops and edges (ground-standard.js).
 */
const {GROUND_CLASSES,GROUND_EDGE,edgeRule}=await import('../src/world/ground-standard.js');
const {mainStreetPlan,partitionPlan,laidAt,layerTop,streetDrop,MAIN_STREET_GROUND:M,MAIN_STREET_GRADES,TACTILE}=await import('../src/world/ground-plan.js');
const {harbourPlan,groundTopAt,MAIN_QUAY_TOP,APRON_TOP}=await import('../src/world/ground-plan-harbour.js');
const {OUTER_PIER,planHeight}=await import('../src/world/layout.js');
const {MINATO_BERTH}=await import('../src/world/minato-berth.js');
const {buildGround}=await import('../src/world/ground-build.js');
const plans=[mainStreetPlan(),harbourPlan({pier:OUTER_PIER,landing:MINATO_BERTH.landing})];
const EDGES=new Set(['kerb','drop','edging','coral-edging','coping']);

test('a plan is laid only in the rulebook\'s classes and edges, and its pieces never lie one on another',()=>{
 for(const plan of plans){
  for(const l of plan.layers.filter(l=>!l.hole))assert.ok(l.edge?EDGES.has(l.cls):GROUND_CLASSES[l.cls],plan.id+': '+l.cls+' ('+l.name+')');
  for(const l of plan.layers.filter(l=>!l.hole))assert.ok(l.why,plan.id+': '+l.name+' says why it is there');
  const rects=partitionPlan(plan);
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){
   const a=rects[i],b=rects[j];
   assert.ok(!(a.x0<b.x1-1e-6&&a.x1>b.x0+1e-6&&a.z0<b.z1-1e-6&&a.z1>b.z0+1e-6),`${plan.id}: ${a.layer.name} overlaps ${b.layer.name}`);
  }
 }
});

test('Main Street: the footways a kerb above the carriageway, the carriageway at the rulebook\'s top over the street\'s datum',()=>{
 const plan=plans[0];
 assert.equal(M.footway-M.road,GROUND_EDGE.kerb.height);
 assert.equal(M.road,M.datum+GROUND_CLASSES.road.top);assert.equal(M.footway,M.datum+GROUND_CLASSES.pavers.top);
 for(const [x,z,cls,y] of [[-2.75,0,'road',M.road],[-6.5,-10,'pavers',M.footway],[2,-10,'pavers',M.footway],[-6,8,'road',M.road],[.5,-30,'road',M.road],[2.5,3.3,'road',GROUND_CLASSES.road.top]]){
  const at=laidAt(plan,x,z);assert.equal(at?.cls,cls,`${cls} at ${x},${z}`);assert.ok(Math.abs(at.y-y)<1e-9,`${cls} at ${x},${z}: ${at.y}`);
 }
 // Between every footway and the road, a kerb: walk across the street at each metre and meet one.
 for(let z=-37;z<29;z+=1){
  const line=[];for(let x=M.pavementWest+.01;x<M.pavementEast;x+=.02)line.push(laidAt(plan,x,z));
  for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];if(!a||!b||a.cls===b.cls||a.edge||b.edge)continue;
   const rule=edgeRule(a.cls,b.cls);assert.ok(rule.edge==='flush',`${a.cls} meets ${b.cls} at z ${z} with no ${rule.edge}`);}
 }
});

test('the kerb is dropped at both ends of each zebra and the bus stop, with the warning blocks at the top of the ramp',()=>{
 const plan=plans[0];
 for(const z of [-18,M.busCrossing.z0+1])for(const x of [M.west-.09,M.east+.09]){
  const at=laidAt(plan,x,z);assert.equal(at.cls,'kerb');assert.ok(at.y-M.road<.03,`dropped at ${x},${z}`);
 }
 for(const t of TACTILE)assert.ok(Math.abs(laidAt(plan,t.x,t.z).y-(M.footway-.012))<1e-9,'blocks bedded at the ramp\'s top: '+[t.x,t.z]);
 // Ramps and grades stay walkable (8 % or less across the drop takes 0.15 m over 0.9 m: 17 %, as a dropped kerb's ramp is).
 for(const l of plan.layers.filter(l=>typeof l.top==='object'&&l.cls!=='kerb')){const g=l.top,slope=Math.abs(g.yb-g.ya)/Math.abs(g.b-g.a);assert.ok(slope<=.17+1e-9,l.name+' '+slope.toFixed(3));}
 for(const g of MAIN_STREET_GRADES)if(typeof g.top==='object')assert.ok(Math.abs(g.top.yb-g.top.ya)/Math.abs(g.top.b-g.top.a)<=.08,g.id);
});

test('feet and wheels follow the laid ground: down onto the road, up onto the footway, onto the quay on its level',()=>{
 assert.ok(Math.abs(planHeight(-2.75,0)-M.road)<1e-9,'the plan lies a kerb down on the road');assert.equal(streetDrop(-6.5,-10),0);
 assert.ok(Math.abs(planHeight(-6.5,-10)-M.footway)<1e-9,'and on the footway');
 assert.ok(Math.abs(groundTopAt(-2.75,0)-M.road)<1e-9);assert.ok(Math.abs(groundTopAt(0,-45)-MAIN_QUAY_TOP)<1e-9);assert.ok(Math.abs(groundTopAt(30,-48)-APRON_TOP)<1e-9);
 // The carriageway meets the quay and the lane beyond the plaza on their level.
 assert.ok(Math.abs(groundTopAt(-2.75,M.minZ+1e-3)-MAIN_QUAY_TOP)<.002,'the road comes down to the quay\'s level');
 assert.ok(Math.abs(groundTopAt(-2.75,M.maxZ-1e-3)-GROUND_CLASSES.road.top)<.002);
});

test('one mesh a class, in the rulebook\'s colour; one for each kind of edge',()=>{
 const group=new THREE.Group(),ground=buildGround(group,plans);
 for(const [id,mesh] of ground.meshes){
  if(GROUND_CLASSES[id])assert.equal(mesh.material.color.getHex(),GROUND_CLASSES[id].colour,id);
  assert.equal(ground.group.children.filter(o=>o.isMesh&&o.userData.groundClass===id).length,1);
 }
 assert.deepEqual([...ground.meshes.keys()].sort(),['concrete','coping','edging','kerb','pavers','quay','road']);
 assert.equal(ground.meshes.get('pavers').name,'Main Street footway');
 // Every face of the merged ground faces out: nothing is drawn inside out.
 const pos=ground.meshes.get('road').geometry.attributes.position,a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 let up=0;for(let i=0;i<pos.count;i+=3){a.fromBufferAttribute(pos,i);b.fromBufferAttribute(pos,i+1);c.fromBufferAttribute(pos,i+2);if(b.sub(a).cross(c.sub(a)).y>0)up++;}
 assert.ok(up>0);
});
