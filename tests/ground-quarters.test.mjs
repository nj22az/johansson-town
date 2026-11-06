import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {installDOM} from './fixtures.mjs';

/**
 * Step 3 of the owner's ground plan (21 October 2026: "Can you make a plan to finally fix the roads to a unified
 * system?"): Kitahama, Nishi-machi, the west yard and the town hall's grounds are laid by the ground generator from their
 * plans (src/world/ground-plan-quarters.js), by the rulebook (src/world/ground-standard.js).
 */
installDOM();globalThis.self=globalThis;
const {GROUND_CLASSES,districtAt}=await import('../src/world/ground-standard.js');
const {partitionPlan,laidAt,mainStreetPlan}=await import('../src/world/ground-plan.js');
const {harbourPlan}=await import('../src/world/ground-plan-harbour.js');
const {OUTER_PIER}=await import('../src/world/layout.js');
const {FUKUGI:SCHOOL_FUKUGI}=await import('../src/world/school-layout.js');
const {MINATO_BERTH}=await import('../src/world/minato-berth.js');
const Q=await import('../src/world/ground-plan-quarters.js');
const {KITAHAMA,KITAHAMA_LANES,plotGate}=await import('../src/world/kitahama-layout.js');
const {NISHI,utakiStones}=await import('../src/world/okinawa/layout.js');
const {PARKING}=await import('../src/world/okinawa/lot-dressing.js');
const {lanePatches}=await import('../src/world/lane-surfaces.js');
const plans=Q.quarterPlans();
const EDGES=new Set(['kerb','drop','edging','coral-edging','coping','gutter']);

test('the plans lay only the rulebook\'s classes and edges, say why, and no two pieces lie one on another',()=>{
 assert.deepEqual(plans.map(p=>p.id),['kitahama','nishi-machi','west-yard','school']);
 const all=[];
 for(const plan of plans){
  for(const l of plan.layers.filter(l=>!l.hole)){
   assert.ok(l.edge?EDGES.has(l.cls):GROUND_CLASSES[l.cls],plan.id+': '+l.cls+' ('+l.name+')');
   assert.ok(l.why,plan.id+': '+l.name+' says why it is there');
  }
  all.push(...partitionPlan(plan).map(r=>({...r,plan:plan.id})));
 }
 // Across the four plans and Main Street's and the harbour's: one piece of ground at every point.
 for(const plan of [mainStreetPlan(),harbourPlan({pier:OUTER_PIER,landing:MINATO_BERTH.landing})])all.push(...partitionPlan(plan).map(r=>({...r,plan:plan.id})));
 const bins=new Map();for(const r of all)for(let i=Math.floor(r.x0/4);i<=Math.floor(r.x1/4);i++)for(let j=Math.floor(r.z0/4);j<=Math.floor(r.z1/4);j++){const k=i+','+j;(bins.get(k)??bins.set(k,[]).get(k)).push(r);}
 const seen=new Set();
 for(const list of bins.values())for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){
  const a=list[i],b=list[j];if(a.plan===b.plan)continue;
  const key=[a.plan,a.x0,a.z0,b.plan,b.x0,b.z0].join();if(seen.has(key))continue;seen.add(key);
  assert.ok(!(a.x0<b.x1-1e-6&&a.x1>b.x0+1e-6&&a.z0<b.z1-1e-6&&a.z1>b.z0+1e-6),`${a.plan} ${a.layer.name} overlaps ${b.plan} ${b.layer.name}`);
 }
});

test('the lane builder lays nothing anywhere: since step 4 every district is laid by its plan',()=>{
 assert.deepEqual(lanePatches().map(p=>p.route),[]);
});

test('Kitahama: every lane is back-lane asphalt, and every house meets it by its gate and the gutter, with no ring of paving',()=>{
 const K=plans[0];
 for(const L of KITAHAMA_LANES){const at=laidAt(K,(L.minX+L.maxX)/2,(L.minZ+L.maxZ)/2);assert.equal(at?.cls,'lane');assert.ok(Math.abs(at.y-GROUND_CLASSES.lane.top)<1e-9);}
 for(const p of KITAHAMA.plots){
  // From the gate out: the gutter's grating, then the lane.
  const {door}=plotGate(p,.35),dir=p.gate==='north'?[0,1]:p.gate==='south'?[0,-1]:p.gate==='east'?[1,0]:[-1,0];
  assert.equal(laidAt(K,...door)?.cls,'gutter',p.id+': the gutter at its gate');
  const lane=[door[0]+dir[0]*.4,door[1]+dir[1]*.4];assert.equal(laidAt(K,...lane)?.cls,'lane',p.id+': the lane beyond the gutter');
 }
 // The monthly parking: crushed coral under the bays, at the pad's height the cars stand on (unchanged).
 for(const x of PARKING.bays){const at=laidAt(K,x,65);assert.equal(at?.cls,'coral-sand');assert.ok(Math.abs(at.y-PARKING.pad)<1e-9,'the bays at the cars\' height');}
});

test('Nishi-machi: coral yards to the walls, asphalt lanes with a gutter on every yard side, the grove in gravel',()=>{
 const N=plans[1];
 // Everywhere but under the grove's stepping stones, which are set into the gravel (quarters.js utaki).
 const stones=utakiStones(NISHI.plots.find(p=>p.kind==='grove'));
 for(let x=NISHI.minX+.3;x<NISHI.maxX;x+=.7)for(let z=-37.9;z<NISHI.maxZ;z+=.7){
  if(stones.some(s=>Math.abs(x-s.x)<=s.w/2&&Math.abs(z-s.z)<=s.d/2))continue;
  const at=laidAt(N,x,z);assert.ok(at,`Nishi-machi's ground is laid at ${x.toFixed(1)},${z.toFixed(1)}`);
 }
 for(const l of NISHI.lanes){
  assert.equal(laidAt(N,-30,l.z)?.cls,'lane');
  for(const s of [-1,1])assert.equal(laidAt(N,-30,l.z+s*(l.half+.15))?.cls,'gutter','a gutter along the lane at '+l.z);
 }
 assert.equal(laidAt(N,-29,25)?.cls,'gravel','the utaki is gravel');
});

test('the town hall: lawn under the trees, rolled stone where it is walked, a concrete forecourt and car park, edged',()=>{
 const S=plans[3],T=Q.TOWN_HALL_GROUND;
 assert.equal(laidAt(S,20.5,26)?.cls,'concrete','the forecourt');
 assert.equal(laidAt(S,35,30.5)?.cls,'concrete','the car park');
 // The owner's phone, 21 October 2026: the yard was one sheet of stone under the trees and round the car park.
 assert.equal(laidAt(S,40.1,40)?.cls,'grass','the yard east of the hall');
 for(const [x,z] of SCHOOL_FUKUGI.filter(([,z])=>z<T.yard.z1))assert.equal(laidAt(S,x,z)?.cls,'grass','a fukugi stands in turf at '+x+', '+z);
 assert.equal(laidAt(S,16,28)?.cls,'park-path','the school playground');
 assert.equal(laidAt(S,35,33.2)?.cls,'park-path','the walk from the car park to the breezeway');
 assert.equal(laidAt(S,35.5,25.2)?.cls,'park-path','the walk in front of the bicycle shed');
 assert.equal(laidAt(S,(T.lawn.x0+T.lawn.x1)/2,(T.bed.z1+T.lawn.z1)/2)?.cls,'grass','the lawn');
 // Phase S (briefs/town-hall-zone.md): the passages between the buildings are rolled stone, the power compound a gravel yard.
 for(const p of T.passages)assert.equal(laidAt(S,(p.x0+p.x1)/2,40)?.cls,'park-path','a passage through to the lane behind');
 assert.equal(laidAt(S,24.9,31.5)?.cls,'gravel','the power compound');
 assert.ok(S.layers.some(l=>l.cls==='edging'),'the lawn is edged');
});

test('the ratchet\'s baseline has nothing left in Nishi-machi, the west yard and the town hall, and in Kitahama only the coast\'s (step 4)',()=>{
 const base=JSON.parse(fs.readFileSync(new URL('./fixtures/ground-baseline.json',import.meta.url),'utf8')).violations;
 for(const key of Object.keys(base)){
  const district=key.split('|')[1];
  if(['nishi-machi','west-yard','school'].includes(district))assert.fail('step 3 left '+key);
  if(district==='kitahama')assert.ok(/coast|west-shore|old-town\.js/.test(key),'Kitahama keeps only the coast\'s and the west shore\'s: '+key);
 }
});
