import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {airportWorld,airportSurface} from '../src/world/airport-ground.js';
import {SEA_LEVEL,oceanMaterial} from '../src/world/ocean.js';
import {AIRPORT_ISLAND} from '../src/world/airport-island.js';
import {KITANO_HAMLET,KITANO_DUG,houseIsland} from '../src/world/kitano-hamlet-layout.js';
import {HOUSE_SITE} from '../src/world/johansson-house.js';
import {standingHitsRect,canStepBetween} from '../physics.js';

/** Johansson's yard built as the game builds it: the town with Kitano-jima, its hamlet and the house. */
async function town(){
 installDOM();globalThis.self=globalThis;
 const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
 const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),townMode:'peninsula',mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 world.group.updateMatrixWorld(true);
 return world;
}
const yard=SEA_LEVEL+KITANO_HAMLET.yardTop;
/** A drawn point of the house (x, y) in the world. */
const W=(x,y)=>airportWorld(...houseIsland(x,y));

test('the court, the garden stair and the lightwell are dug where the drawings put them, and walked as drawn',async()=>{
 // The island's floor: the garden stair through its nosings, the court and the lightwell's floor under the yard.
 const X=HOUSE_SITE.gardenStair;
 for(const t of X.treads){
  const down=t.max[1]>X.ramp[0][1]===false,nose=t.max[1]-.002,at=airportSurface(...W((t.min[0]+t.max[0])/2,nose));
  assert.equal(at.id,'kitano-garden-stair');
  // At its nosing (the edge towards the court) the slope is the tread's top.
  assert.ok(Math.abs(at.y-(yard+t.max[2]))<.01,`tread at ${t.max[2]}: ${(at.y-yard).toFixed(3)}`);
 }
 const c=HOUSE_SITE.court,l=HOUSE_SITE.lightwell;
 assert.ok(Math.abs(airportSurface(...W((c.x[0]+c.x[1])/2,(c.y[0]+c.y[1])/2)).y-(yard+c.floor))<1e-6);
 assert.ok(Math.abs(airportSurface(...W((l.x[0]+l.x[1])/2,(l.y[0]+l.y[1])/2)).y-(yard+l.floor))<1e-6);
 // The dug rectangles are the pits' walls, outside to outside.
 const court=KITANO_DUG.find(d=>d.id==='johansson-court'),well=KITANO_DUG.find(d=>d.id==='johansson-lightwell');
 for(const [d,[x0,y0,x1,y1]] of [[court,[8.5,-5.05,10.1,0]],[well,[-1.3,5.7,0,7.1]]]){
  const [a,b]=houseIsland(x1,y0),[e,f]=houseIsland(x0,y1);
  assert.deepEqual([d.minX,d.maxX,d.minZ,d.maxZ].map(v=>+v.toFixed(3)),[Math.min(a,e),Math.max(a,e),Math.min(b,f),Math.max(b,f)].map(v=>+v.toFixed(3)));
 }
});

test('the pits are open: no yard, ground or sea over them, and their floors under the sea are dry',async()=>{
 const world=await town(),ray=new THREE.Raycaster(),hits=[];
 const solid=[];world.group.traverse(o=>{if(o.isMesh&&o.visible&&!o.material?.transparent)solid.push(o);});
 // Straight down into each pit: the first thing met is its floor (or the stair's tread), not a slab at the yard.
 for(const [x,y,floor] of [[9.3,-.6,HOUSE_SITE.court.floor],[9.3,-3.2,null],[-.45,6.2,HOUSE_SITE.lightwell.floor]]){
  const [wx,wz]=W(x,y);ray.set(new THREE.Vector3(wx,yard+6,wz),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObjects(solid,false).find(h=>!/sea|ocean|water/i.test(h.object.name+h.object.material?.type));
  assert.ok(hit,'nothing under '+[x,y]);
  if(floor!==null)assert.ok(Math.abs(hit.point.y-(yard+floor))<.03,`at ${x},${y} the first floor is at ${(hit.point.y-yard).toFixed(2)} under the yard, not the pit's`);
  else assert.ok(hit.point.y<yard-.5,`at ${x},${y} the stair is covered at ${(hit.point.y-yard).toFixed(2)}`);
 }
 // The island's ground has no triangle in the pits.
 const ground=world.group.getObjectByName('Kitano-jima island ground'),pos=ground.geometry.attributes.position,idx=ground.geometry.index;
 for(let i=0;i<idx.count;i+=3){
  let u=0,v=0;for(let k=0;k<3;k++){u+=pos.getX(idx.getX(i+k))/3;v+=pos.getZ(idx.getX(i+k))/3;}
  assert.ok(!KITANO_DUG.some(d=>u>d.minX&&u<d.maxX&&v>d.minZ&&v<d.maxZ),`ground over a pit at ${u.toFixed(1)},${v.toFixed(1)}`);
 }
 // The sea is not drawn in either pit: its holes are the pits, turned with the island.
 const U=oceanMaterial().uniforms,set=U.uPitSizes.value.map((s,i)=>({s,p:U.uPits.value[i]})).filter(q=>q.s.x>0);
 assert.equal(set.length,KITANO_DUG.length);
 for(const d of KITANO_DUG){
  const [cx,cz]=airportWorld((d.minX+d.maxX)/2,(d.minZ+d.maxZ)/2);
  assert.ok(set.some(q=>Math.abs(q.p.x-cx)<1e-3&&Math.abs(q.p.y-cz)<1e-3&&Math.abs(q.p.z-Math.cos(AIRPORT_ISLAND.yaw))<1e-6&&Math.abs(q.s.x-(d.maxX-d.minX)/2)<1e-6&&Math.abs(q.s.y-(d.maxZ-d.minZ)/2)<1e-6),d.id+' has no hole in the sea');
 }
 // Down the garden stair from the top landing to the court door and back: never blocked, never a step over 0.24 m;
 // off its sides the cheeks and the walls stop him, and the court's walls keep him off the pit's edges from the yard.
 const R=.28,blocked=(x,z,y)=>world.colliders.some(c=>standingHitsRect(x,z,R,y,c));
 let prev=null;
 for(let y=-6;y<=-.4;y+=.05){
  const [wx,wz]=W(9.3,y),g=airportSurface(wx,wz).y;
  assert.ok(!blocked(wx,wz,g),`blocked on the way down at ${y.toFixed(2)}`);
  if(prev!==null)assert.ok(canStepBetween(prev,g),`a step of ${(g-prev).toFixed(3)} at ${y.toFixed(2)}`);
  prev=g;
 }
 for(const x of [8.75,9.85]){const [wx,wz]=W(x,-3),g=airportSurface(wx,wz).y;assert.ok(blocked(wx,wz,yard+HOUSE_SITE.court.floor+1.5),'off the stair’s side at '+x);}
 for(const [x,y] of [[8.4,-2.5],[10.2,-2.5],[-.6,5.55],[-1.45,6.4]]){const [wx,wz]=W(x,y);assert.ok(blocked(wx,wz,yard),`the yard runs into a pit at ${x},${y}`);}
});
