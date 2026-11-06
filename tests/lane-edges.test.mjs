import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {groundCover} from './ground-cover.mjs';

installDOM();globalThis.self=globalThis;
const {KITAHAMA,KITAHAMA_LANES}=await import('../src/world/kitahama-layout.js');
const {NEIGHBOURHOOD,neighbourhoodHeight}=await import('../src/world/neighbourhood-ground.js');
const {GUTTER,gutterRings,openEdgeRuns,LANE_WEAR}=await import('../src/world/okinawa/lane-edges.js');
const {createTown}=await import('../src/world/town.js');
const {createBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),townMode:'peninsula',kitano:'distant',mobile:false,shadows:false,
 register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const N=NEIGHBOURHOOD,cover=groundCover(world.group,{minX:N.minX,maxX:N.maxX,minZ:N.minZ,maxZ:N.maxZ});
const BARE='Compact neighbourhood ground';
const level=(x,z)=>x>=N.minX&&x<=N.maxX&&z>=N.minZ&&z<=N.maxZ&&neighbourhoodHeight(x,z)===0;
/** Points just outside each long side of every Kitahama lane, every quarter metre. */
function edgePoints(d){
 const out=[];
 for(const [i,L] of KITAHAMA_LANES.entries()){
  const alongX=L.maxX-L.minX>L.maxZ-L.minZ;
  for(const s of [-1,1]){const edge=alongX?(s<0?L.minZ:L.maxZ):(s<0?L.minX:L.maxX),from=alongX?L.minX:L.minZ,to=alongX?L.maxX:L.maxZ;
   for(let u=from+.125;u<to;u+=.25)out.push({lane:i,x:alongX?u:edge+s*d,z:alongX?edge+s*d:u});}
 }
 return out;
}

test('no Kitahama lane edge is bare neighbourhood lawn: the paving meets a gutter, a wall, a building or more paving',async()=>{
 const {TOWN_WALK_PLOTS}=await import('../src/world/architecture-plan.js');
 // A seam narrower than a gutter, between a building's own plot and the lane, is the building's edge, not a verge.
 const seam=p=>TOWN_WALK_PLOTS.some(q=>p.x>=q.minX-.3&&p.x<=q.maxX+.3&&p.z>=q.minZ-.3&&p.z<=q.maxZ+.3);
 for(const d of [.12,.24]){
  const bare=edgePoints(d).filter(p=>level(p.x,p.z)&&cover(p.x,p.z)?.name===BARE&&!seam(p));
  assert.deepEqual(bare.slice(0,12).map(p=>`lane ${p.lane} at ${p.x.toFixed(2)},${p.z.toFixed(2)}`),[],`${bare.length} edge points ${d} m out are bare lawn`);
 }
});

test('the cross lane and the spine have their gutter or a walled ring along both edges, and the wear of what uses them',()=>{
 const runs=[...gutterRings(),...openEdgeRuns()],has=(x,z)=>runs.some(r=>[r.band,r.soil].filter(Boolean).some(b=>x>=b.minX-.02&&x<=b.maxX+.02&&z>=b.minZ-.02&&z<=b.maxZ+.02));
 const pavedOrBuilt=(x,z)=>cover(x,z)&&cover(x,z).name!==BARE;
 for(const L of [KITAHAMA.lane,KITAHAMA.spine])for(const z of [L.minZ-.2,L.maxZ+.2])for(let x=L.minX+.5;x<L.maxX-.5;x+=.5){
  if(!level(x,z))continue;
  assert.ok(has(x,z)||pavedOrBuilt(x,z),`edge at ${x},${z} has a gutter, paving or a building`);
 }
 assert.deepEqual(LANE_WEAR.map(w=>w.lane),['cross lane','spine']);
});

test('the gutter is one family: every ring and open run is 0.3 m of lids on a channel, beside the paving and never over it',async()=>{
 // Since step 3 of the ground plan the lanes are the ground generator's (ground-plan-quarters.js), which holds every
 // gutter's ground: no lane, pad or path of a plan lies under a gutter, and no route of the lane builder either.
 const {quarterGutterRuns,quarterPlans}=await import('../src/world/ground-plan-quarters.js');
 const {laidAt}=await import('../src/world/ground-plan.js');
 // The walks laid across the plans (ground-walks.js): the lane builder lays nothing since step 4.
 const {laidWalkPieces}=await import('../src/world/ground-walks.js');
 const runs=quarterGutterRuns(),patches=laidWalkPieces(),plans=quarterPlans();
 const inPoly=(poly,x,z)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;};
 assert.ok(runs.length>40,'rings and open edges are laid');
 for(const r of runs){
  const w=r.axis==='x'?r.band.maxZ-r.band.minZ:r.band.maxX-r.band.minX;
  assert.ok(Math.abs(w-GUTTER.width)<1e-6,`${r.owner} ${r.side} gutter is ${w} m wide`);
  const cx=(r.band.minX+r.band.maxX)/2,cz=(r.band.minZ+r.band.maxZ)/2;
  assert.ok(!patches.some(p=>inPoly(p.polygon,cx,cz)),`${r.owner} ${r.side} gutter lies beside the paving, not on it`);
  assert.ok(plans.every(p=>{const at=laidAt(p,cx,cz);return !at||at.cls==='gutter';}),`${r.owner} ${r.side} gutter's ground is the gutter's`);
 }
 // Two runs never lay lids on the same ground (the same lid drawn twice flickers).
 const overlap=(a,b)=>Math.min(a.maxX,b.maxX)-Math.max(a.minX,b.minX)>.01&&Math.min(a.maxZ,b.maxZ)-Math.max(a.minZ,b.minZ)>.01;
 for(let i=0;i<runs.length;i++)for(let j=i+1;j<runs.length;j++)assert.ok(!overlap(runs[i].band,runs[j].band),`${runs[i].owner} ${runs[i].side} and ${runs[j].owner} ${runs[j].side} gutters overlap`);
 // Every walled Kitahama plot has its ring on all four sides.
 for(const p of KITAHAMA.plots)assert.equal(gutterRings().filter(r=>r.owner===p.id).length,4,p.id+' has its ring');
});

test('the weeds and the wear are kept off the walking surface and out of the depth fight',()=>{
 const names=['Kitahama lane-edge weeds','Kitahama lane tyre wear','Kitahama lane stains'];
 for(const name of names){const m=world.group.getObjectByName(name);assert.ok(m,name+' is built');assert.equal(m.userData.walkSurface,false,name+' is not stood on');}
 for(const name of names.slice(1)){const m=world.group.getObjectByName(name).material;assert.ok(m.polygonOffset&&m.transparent&&!m.depthWrite,name+' is a decal');}
});
