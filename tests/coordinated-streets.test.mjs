import test from 'node:test';
import assert from 'node:assert/strict';
import {ROUTES} from '../src/world/layout.js';
import {ARCHITECTURE_ROUTES} from '../src/world/architecture-plan.js';
import {coordinatedStreetPatches,streetPieces,STREET_STANDARD,area,rectangle,subtractPolygon,routePolygons} from '../src/world/street-plan.js';

// The routes' paving as the junction owner cuts it; the plans lay from these (ground-walks.js), the lane builder nothing.
const patches=streetPieces(ROUTES.slice(3));
const inside=(p,x,z)=>p.every((a,i)=>{const b=p[(i+1)%p.length];return (b[0]-a[0])*(z-a[1])-(b[1]-a[1])*(x-a[0])>=-1e-7;});
const at=(x,z)=>patches.filter(p=>inside(p.polygon,x,z));
test('convex difference conserves area for partial, contained and diagonal intersections',()=>{
 const p=rectangle(0,4,0,4);
 for(const [mask,remaining] of [[rectangle(2,6,2,6),12],[rectangle(1,3,1,3),12],[rectangle(-1,5,-1,5),0],[[[2,0],[4,2],[2,4],[0,2]],8]]){
  assert.ok(Math.abs(subtractPolygon(p,mask).reduce((s,p)=>s+area(p),0)-remaining)<1e-8);
 }
});
test('every street patch has one owner, including oblique coastal joins',()=>{
 for(let i=0;i<patches.length;i++)for(let j=i+1;j<patches.length;j++){
  const a=patches[i].polygon,b=patches[j].polygon;
  const remainder=subtractPolygon(a,b).reduce((s,p)=>s+area(p),0);
  assert.ok(area(a)-remainder<1e-6,`${patches[i].route} overlaps ${patches[j].route}`);
 }
});
test('Main Street retains asphalt at residential junctions; retired overlays have no mesh',async()=>{
 // Up to the bus plaza's north edge the carriageway is the ground generator's (ground-plan.js), beyond it the lanes'.
 const {laidAt,mainStreetPlan}=await import('../src/world/ground-plan.js');
 for(const z of [21,24])assert.equal(laidAt(mainStreetPlan(),-2.75,z)?.cls,'road','Main Street\'s carriageway at '+z);
 // North of the plaza it runs on through Kitahama as one of its lanes: back-lane asphalt, laid by the quarter's plan
 // (ground-plan-quarters.js, step 3 of the ground plan), never a footway's paving.
 const {quarterPlans}=await import('../src/world/ground-plan-quarters.js');
 const kitahama=quarterPlans().find(p=>p.id==='kitahama');
 for(const z of [31,40,45]){
  assert.equal(laidAt(kitahama,-2.75,z)?.cls,'lane','street connected at '+z);
 }
 // Since step 4 the lane builder lays nothing at all: every district is its plan's.
 assert.deepEqual(coordinatedStreetPatches(ROUTES.slice(3)),[]);
 assert.equal(patches.some(p=>p.route.startsWith('neighbourhood-')||p.route==='island-shopping-lane'),false);
 assert.ok(patches.some(p=>p.kind==='coast'));
 const {laidWalkPieces}=await import('../src/world/ground-walks.js');
 assert.ok(laidWalkPieces().some(p=>p.route==='island-coast-walk'),'the coastal walk is laid round Kitahama (ground-plan-coast.js)');
 assert.equal(STREET_STANDARD.coast.access,'pedestrians');
 assert.equal(STREET_STANDARD.boardwalk.surface,'wood');
});
test('Main Street ends at the cross lane, not inside the first house; west coast shares one alignment',()=>{
 const main=ARCHITECTURE_ROUTES.find(r=>r.id==='main-street-extension');
 assert.equal(main.width,STREET_STANDARD.main.width);
 for(const p of routePolygons(main))for(const [,z] of p)assert.ok(z<=46);
 const west=ARCHITECTURE_ROUTES.find(r=>r.id==='nishi-promenade');
 assert.equal(west.width,STREET_STANDARD.coast.width);
 assert.ok(west.points.every(p=>p[0]===-36.7));
});

test('built carriageways clear the turf and join Main Street on the shared datum',async()=>{
 const THREE=await import('../vendor/three.module.js');
 const {installDOM}=await import('./fixtures.mjs');installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');
 const {createIslandBusinesses}=await import('../src/world/businesses.js');
 const {GROUND_LAYER}=await import('../src/world/ground-layers.js');
 const {streetDrop}=await import('../src/world/ground-plan.js');
 const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 world.group.updateMatrixWorld(true);
 const streets=[];world.group.traverse(o=>{if(o.isMesh&&['grid-lanes:asphalt','Carriageways','Kitano Road carriageway','Back lanes'].includes(o.name))streets.push(o);});
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0);
 for(const [x,z] of [[-2.75,-20],[-2.75,21],[-2.75,28],[-2.75,32],[-2.75,44],[2,3.3],[10,3.3],[24,3.3]]){
  // Main Street's carriageway lies a kerb under the datum and is graded back to it where the lanes go on (ground-plan.js).
  ray.set(new THREE.Vector3(x,1,z),down);const hit=ray.intersectObjects(streets,false)[0];
  assert.ok(hit,'drawn asphalt at '+[x,z]);assert.ok(Math.abs(hit.point.y-(GROUND_LAYER.lane+streetDrop(x,z)))<1e-6,'one finished datum at '+[x,z]+': '+hit.point.y);
 }
});
