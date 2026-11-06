import {test} from 'node:test';
import {kitanoRoadAt} from '../src/world/kitano-link-plan.js';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {readFile} from 'node:fs/promises';
import {installDOM} from './fixtures.mjs';
import {preloadPark,parkFoliage} from '../src/world/park.js?snappy=1';
import {EAST_LAWN,buildEastLawn} from '../src/world/east-lawn.js';
import {PARK,COURT_TERRACE,courtTerraceHeight} from '../src/world/park-layout.js';
import {harbourPondAt} from '../src/world/harbour-park-plan.js';
import {BEACH} from '../src/world/beach-layout.js';
import {kitahamaLaneAt} from '../src/world/kitahama-layout.js';
import {GROUND_LAYER} from '../src/world/ground-layers.js';
const nearTerraceWall=(x,z)=>z<COURT_TERRACE.minZ+.1&&x>COURT_TERRACE.minX-.6&&x<COURT_TERRACE.maxX;
import {paintedTurf} from '../src/render/toy-surfaces.js';
import {MAIN_ROAD} from '../src/world/main-road.js';
import {circleHitsRect,standingHitsRect} from '../physics.js';
import {GATEBALL_ACTIVE} from '../src/world/okinawa/layout.js';

/** The island land sits at this height, and the surrounding sea at this one. */
const LAND=-.4,WATER=-.56;

test('the east of the town is one green from the kerb to the seawall',async()=>{
 
 const {routeAt,groundHeight}=await import('../src/world/layout.js?east-lawn');
 // Everything between the pavement and the wall is walkable at pavement level, which
 // is what it was not: the park was an island and the rest was scenery below the kerb.
 const off=[],steps=[];
 for(let x=MAIN_ROAD.pavementEast;x<EAST_LAWN.maxX-.6;x+=.4)for(let z=EAST_LAWN.minZ+.6;z<EAST_LAWN.maxZ-.6;z+=1.2){
  if(!routeAt(x,z,.4)&&!harbourPondAt(x,z,.4))off.push(x.toFixed(1)+','+z.toFixed(1));
  // Walking east must never be a step up. The park used to be a plinth with a
  // vertical face, and excluding its square from the lawn left a dead band one body
  // wide at its foot: you walked into an invisible wall on open grass.
  // The gateball terrace ends in a retaining wall on its seaward side.
  // Kitano Road's embankment has retaining walls of its own; the lawn meets them, not the road.
  else if(!nearTerraceWall(x,z)&&!nearTerraceWall(x+.4,z)&&!kitanoRoadAt(x,z,-.5)&&!kitanoRoadAt(x+.4,z,-.5)&&routeAt(x,z,.4)?.id===EAST_LAWN.id&&routeAt(x+.4,z,.4)?.id===EAST_LAWN.id
   &&Math.abs(groundHeight(x+.4,z)-groundHeight(x,z))>.2)
   steps.push(x.toFixed(1)+','+z.toFixed(1)+' '+(groundHeight(x+.4,z)-groundHeight(x,z)).toFixed(2));
 }
 assert.deepEqual(off.slice(0,6),[],'Ground east of the road you still cannot stand on');
 assert.deepEqual(steps.slice(0,6),[],'The east side steps rather than slopes');
 assert.equal(routeAt(28,12).surface,'grass');
 // And the kerb itself. The pavement gives up a body's radius short of its east edge
 // and the lawn only began a radius past it, so the two together left a band 0.7m wide
 // that both would have covered and neither would accept: twenty metres of invisible
 // wall with grass on the far side of it. Walk across it at every metre of its length.
 const kerb=[];
 for(let z=EAST_LAWN.minZ+.6;z<EAST_LAWN.maxZ-.6;z+=1)
  for(let x=MAIN_ROAD.pavementEast-.6;x<=MAIN_ROAD.pavementEast+.6;x+=.15)
   if(!routeAt(x,z,.32))kerb.push(x.toFixed(2)+','+z.toFixed(1));
 assert.deepEqual(kerb.slice(0,6),[],'An invisible wall runs along the east kerb');
 // The park shares the lawn datum; its own mesh leaves the pond open.
 assert.equal(routeAt(PARK.x,PARK.z).id,PARK.id);
 assert.equal(groundHeight(PARK.x,PARK.z),0,'The retired mound cannot become a plinth again');
 // and the lawn stops where the town does.
 assert.equal(routeAt(EAST_LAWN.maxX+1.5,10)?.surface,'sand','The beach beyond the seawall is walkable');
});

test('the seawall stops you, and the sand below it stays above the ground it lies on',()=>{
 installDOM();
 const parent=new THREE.Group(),colliders=[];
 const {shore}=buildEastLawn({parent,colliders});
 const wall=colliders.filter(c=>c.id==='east-seawall');
 // The wall used to be counted (five pieces: a south return, two beach openings and an
 // opening for Kitano Road). The 17 October island replan closed the Kitano Road opening
 // on purpose (kitano-link-plan.js KITANO_SEAWALL_GAP has half 0) and dropped the south
 // return, so the count changed while the wall did its job. What matters is the job:
 // solid along its whole length except exactly at the two beach openings.
 const R=.36,openings=BEACH.accesses;
 const blocked=z=>wall.some(c=>circleHitsRect(EAST_LAWN.wall.x,z,R,c));
 const start=Math.min(...wall.map(c=>c.z-c.d/2));
 assert.ok(start<=-36,'The seawall no longer reaches the south end of the lawn: it starts at z='+start.toFixed(2));
 const gaps=[],shut=[];
 for(let z=Math.ceil(start*2)/2;z<=EAST_LAWN.maxZ;z+=.5){
  const opening=openings.find(a=>Math.abs(z-a.z)<a.half);
  if(!opening){if(!blocked(z))gaps.push(z);}
  // Clear of the parapet ends by a body and the coping's lip: you can walk through.
  else if(Math.abs(z-opening.z)<opening.half-R-.07&&blocked(z))shut.push(z);
 }
 assert.deepEqual(gaps,[],'You can walk through the seawall away from the beach openings');
 assert.deepEqual(shut,[],'A beach opening in the seawall is closed');
 for(const a of openings)assert.equal(blocked(a.z),false,'The beach opening at z='+a.z+' is walled up');
 // Retained trees keep their own solid trunks. Their gaps, including the police
 // box's visible clearing, must not acquire a continuous hidden collision strip.
 const trees=colliders.filter(c=>c.id==='east-lawn-tree'),drawn=[];
 parent.traverse(o=>{if(o.name==='East lawn tree')drawn.push(o);});
 assert.equal(trees.length,0,'The retired treeline cannot return as invisible collision');assert.equal(trees.length,drawn.length);
 for(const tree of drawn)assert.ok(trees.some(c=>c.x===tree.position.x&&c.z===tree.position.z&&circleHitsRect(c.x,c.z,.28,c)),'Every visible trunk stays solid');
 assert.equal(trees.some(c=>circleHitsRect(12,23.314692,.28,c)),false,'The reproduced Koban obstruction stays clear');

 // Dry sand has to draw above the island's own ground or the land shows through it,
 // and it has to reach below the water or the beach ends in a step.
 const [first]=EAST_LAWN.beach.profile,last=EAST_LAWN.beach.profile.at(-1);
 assert.ok(first[1]>LAND,'The beach starts below the ground it lies on');
 assert.ok(last[1]<WATER,'The beach never reaches the water');
 let previous=Infinity;
 for(const [x,y] of EAST_LAWN.beach.profile){
  assert.ok(y<previous,'The beach rises again at x='+x);previous=y;
  if(y>WATER)assert.ok(y>LAND,'Dry sand at x='+x+' is under the land at y='+y);
 }
 parent.updateMatrixWorld(true);
 const ray=new THREE.Raycaster();
 ray.set(new THREE.Vector3((EAST_LAWN.beach.profile[1][0]+EAST_LAWN.beach.profile[2][0])/2,6,0),new THREE.Vector3(0,-1,0));
 assert.equal(ray.intersectObject(shore).length,1,'No sand above the beach');
});

test('the lawn wears the park\u2019s own grass rather than a green of its own',async()=>{
 installDOM();globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:256,height:256,close(){}});
 const original=fetch;
 globalThis.fetch=async url=>String(url).startsWith('blob:')?original(url):new Response(await readFile(new URL('../assets/'+new URL(url).pathname.split('/assets/')[1],import.meta.url)));
 try{
  const bare=buildEastLawn({parent:new THREE.Group(),colliders:[]});
  // The lawn wears the painted turf from the first frame, and the park hands over the
  // same turf: the two greens are one field.
  assert.ok(bare.lawn.material.map?.image===paintedTurf().image,'The bare lawn is a green of its own');
  assert.equal(parkFoliage().grass?.image,paintedTurf().image,'The park is not on the town\u2019s turf');

  assert.equal(await preloadPark(),true);
  const {grass}=parkFoliage();
  assert.ok(grass?.image,'The park has no lawn texture');
  const lawn=buildEastLawn({parent:new THREE.Group(),colliders:[]});
  assert.equal(lawn.useParkGreenery({grass}),true);
  assert.equal(lawn.lawn.material.map.image,grass.image,'The lawn is not the park\u2019s grass');
  // Brought down, not left white: the supplied green is bright enough that the town's
  // sun and the grade together push it past white over an area this size.
  const tint=lawn.lawn.material.color;
  assert.ok(tint.getHex()!==0xffffff&&tint.g>tint.r&&tint.g>tint.b,'The turf is not toned down toward grass');
  assert.notEqual(lawn.lawn.material.map,grass,'The lawn tiles the park\u2019s own texture object');
  // The tiling lives in the lawn's own UVs, in metres, so it holds wherever the
  // ground goes rather than only over a flat rectangle.
  const uv=lawn.lawn.geometry.attributes.uv;let spanX=0,spanZ=0;
  for(let i=0;i<uv.count;i++){spanX=Math.max(spanX,Math.abs(uv.getX(i)));spanZ=Math.max(spanZ,Math.abs(uv.getY(i)));}
  assert.ok(spanX>4&&spanZ>4,'One tile stretched over the whole green');
  assert.deepEqual([lawn.lawn.material.map.repeat.x,lawn.lawn.material.map.repeat.y],[1,1]);
  // No shrub clumps: from the hill they read as a scatter of boulders.
  let planting=null;lawn.group.traverse(o=>{if(o.name==='East lawn planting')planting=o;});
  assert.equal(planting,null,'The boulder-like shrub clumps are back on the lawn');
 }finally{globalThis.fetch=original;}
});

test('every open patch of the east side can be walked to from the road',async()=>{
 installDOM();globalThis.self=globalThis;
 
 const {routeAt,groundHeight}=await import('../src/world/layout.js?east-reach');
 const {createTown}=await import('../src/world/town.js');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const sites=createBusinesses().filter(s=>['market','frontrow'].includes(s.id));
 const {colliders}=createTown({scene:new THREE.Scene(),sites,mobile:false,
  shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});

 // Ground you can stand on but cannot get to is the same invisible wall seen from the
 // other side, so the question is not whether routeAt says yes — it is whether a body
 // of the player's width can walk there from the middle of the road, past every prop,
 // without climbing anything. Flood the town and then ask the east side.
 const STEP=.4,RADIUS=.32;
 // As the game's walkers test a solid (game.js): one lifted out of reach (a shutter rolled up into its box) is not in the way.
 const open=(x,z)=>!!routeAt(x,z,RADIUS)&&!colliders.some(c=>standingHitsRect(x,z,RADIUS,groundHeight(x,z),c));
 const key=(x,z)=>x.toFixed(1)+','+z.toFixed(1);
 const start=[0,0];
 assert.ok(open(...start),'The middle of the road is blocked');
 const seen=new Set([key(...start)]),queue=[start];
 while(queue.length){
  const [x,z]=queue.pop();
  for(const [dx,dz] of [[STEP,0],[-STEP,0],[0,STEP],[0,-STEP]]){
   const nx=+(x+dx).toFixed(1),nz=+(z+dz).toFixed(1);
   if(nx<-46||nx>50||nz<-74||nz>46||seen.has(key(nx,nz))||!open(nx,nz))continue;
   if(Math.abs(groundHeight(nx,nz)-groundHeight(x,z))>.45)continue;
   seen.add(key(nx,nz));queue.push([nx,nz]);
  }
 }
 // Staff aisles behind counters (Mrs Nakamura's, behind the zenzai counter) are reached
 // through passages narrower than the flood grid can step through: the passage beside
 // her stairwell leaves the walker a band under 0.2 m wide. So a cell the 0.4 m flood
 // missed gets a second look: a fine search, 0.1 m steps with the same body, colliders
 // and walk surface, from the nearest cell the flood did reach. A truly enclosed pocket
 // still has no way in and still fails.
 const reached=[...seen].map(k=>k.split(',').map(Number));
 const fineReach=(tx,tz)=>{
  let from=reached[0],best=Infinity;
  for(const p of reached){const d=Math.hypot(p[0]-tx,p[1]-tz);if(d<best){best=d;from=p;}}
  const F=.1,fk=(x,z)=>Math.round(x/F)+','+Math.round(z/F),box=2.5;
  const minX=Math.min(from[0],tx)-box,maxX=Math.max(from[0],tx)+box,minZ=Math.min(from[1],tz)-box,maxZ=Math.max(from[1],tz)+box;
  const near=new Set([fk(...from)]),todo=[from];
  while(todo.length){
   const [x,z]=todo.shift();
   if(Math.abs(x-tx)<F/2&&Math.abs(z-tz)<F/2)return true;
   for(const [dx,dz] of [[F,0],[-F,0],[0,F],[0,-F]]){
    const nx=+(x+dx).toFixed(2),nz=+(z+dz).toFixed(2);
    if(nx<minX||nx>maxX||nz<minZ||nz>maxZ||near.has(fk(nx,nz))||!open(nx,nz))continue;
    if(Math.abs(groundHeight(nx,nz)-groundHeight(x,z))>.45*F/STEP)continue;
    near.add(fk(nx,nz));todo.push([nx,nz]);
   }
  }
  return false;
 };
 // Higa Liquor is shut for good (the owner, 22 October 2026; commerce/higa-liquor.js): its floor is behind the shutter
 // and the shut doors on purpose, a closed room and not stranded ground. Only the shop-house itself is set aside.
 const {HIGA_FRAME}=await import('../src/world/okinawa/higa-liquor-dressing.js');
 const inShutShop=(x,z)=>{const lz=HIGA_FRAME.origin[0]-x,lx=z-HIGA_FRAME.origin[1];return Math.abs(lx)<HIGA_FRAME.W&&Math.abs(lz)<HIGA_FRAME.D-.15;};
 const stranded=[];let shutCells=0;
 for(let x=EAST_LAWN.minX;x<=EAST_LAWN.maxX;x+=STEP)for(let z=EAST_LAWN.minZ;z<=EAST_LAWN.maxZ;z+=STEP){
  const gx=+x.toFixed(1),gz=+z.toFixed(1);
  if(open(gx,gz)&&!seen.has(key(gx,gz))&&!fineReach(gx,gz)){if(inShutShop(gx,gz))shutCells++;else stranded.push(gx+','+gz);}
 }
 assert.ok(shutCells>0,'the shut shop’s floor is out of reach behind its shutter');
 assert.deepEqual(stranded.slice(0,8),[],'East-side ground you can stand on but cannot reach');
 assert.ok(seen.size>15000,'The flood stopped early: '+seen.size+' cells');

 // Thuan's break is round the back of the shop, which is only a break if she can
 // walk to it: the yard behind Sakura is reached the long way, out of the front and
 // round, so a wall or a prop across that route strands her on her own schedule.
 const {STAFF_BENCH}=await import('../src/world/staff-bench.js');
 const near=(x,z)=>key(+(Math.round(x/STEP)*STEP).toFixed(1),+(Math.round(z/STEP)*STEP).toFixed(1));
 assert.ok(seen.has(near(...STAFF_BENCH.stand)),'Thuan cannot walk to her own bench');
 assert.ok(colliders.some(c=>c.id==='sakura-staff-bench'),'The staff bench is not solid');
});

test('the paths across the green lie on the ground rather than through it',async()=>{
 installDOM();globalThis.self=globalThis;
 const {groundHeight}=await import('../src/world/layout.js?lane-clearance');
 const {coastWalkGround,topOf}=await import('../src/world/ground-plan-coast.js');
 const {GROUND_CLEARANCE}=await import('../src/world/ground-standard.js');
 const {onBeach}=await import('../src/world/beach-layout.js');
 // The walks across the lawns (ground-plan-coast.js, step 4 of the ground plan) lie flush at their class's top, the lawn
 // 2 cm under them: at every corner and the middle of every piece the walk is over the grass by the rulebook's clearance,
 // never under it in green wedges (as the old lane patches were over the park mound's graded foot).
 const {pieces,edging}=coastWalkGround();
 const sunk=[];let checked=0;
 for(const p of pieces){
  const pts=[...p.poly,[p.poly.reduce((s,v)=>s+v[0],0)/p.poly.length,p.poly.reduce((s,v)=>s+v[1],0)/p.poly.length]];
  // On Kitahama's lanes groundHeight is the lane's own top (layout.js), and on the sand the sand's: where a walk meets a
  // lane or comes down onto the beach it is flush with it.
  for(const [x,z] of pts){checked++;const lane=kitahamaLaneAt(x,z)||onBeach(x,z),clearance=topOf(p.cls)-groundHeight(x,z)-(lane?0:GROUND_LAYER.grass);
   if(clearance<(lane?-1e-6:GROUND_CLEARANCE-1e-6))sunk.push(p.walk+' '+x.toFixed(1)+','+z.toFixed(1)+' by '+(clearance*100).toFixed(1)+'cm');}
 }
 assert.ok(checked>500,'Every walk is sampled');assert.ok(edging.length>100,'the walks are edged');
 assert.deepEqual(sunk.slice(0,6),[],'Paving sunk under the grass it is laid on');
});

test('the gateball court stands level on the hill\u2019s ground, graded into it, walled toward the sea',{skip:!GATEBALL_ACTIVE&&'the court is switched off (okinawa/layout.js GATEBALL_ACTIVE)'},async()=>{
 
 const {groundHeight}=await import('../src/world/layout.js?terrace');
 const T=COURT_TERRACE;
 for(let x=T.minX+.2;x<T.maxX;x+=.8)for(let z=T.minZ+.2;z<T.maxZ;z+=.8)assert.equal(groundHeight(x,z),T.height,'The court is not level at '+[x,z]);
 // Up on the hill's ground, not in a pit below it.
 assert.ok(T.height>.5);
 // From the hill and the lawn beside it, the ground comes to the terrace without a step.
 for(const [x0,z0,dx,dz] of [[T.minX-3,-34,1,0],[22,T.maxZ+2.5,0,-1],[30,T.maxZ+2.5,0,-1]]){
  let last=groundHeight(x0,z0);
  for(let i=1;i<=16;i++){const h=groundHeight(x0+dx*i*.2,z0+dz*i*.2);assert.ok(Math.abs(h-last)<.12,'A step onto the terrace near '+[x0+dx*i*.2,z0+dz*i*.2]);last=h;}
 }
 // Toward the sea there is no bank: the wall holds the terrace up.
 assert.equal(courtTerraceHeight(25,T.minZ-.2,0),null);
 const parent=new THREE.Group(),colliders=[];
 const {buildOkinawaQuarters}=await import('../src/world/okinawa/quarters.js');
 buildOkinawaQuarters({group:parent,colliders},{register(){},onAction(){},shadows:false});
 const wall=colliders.filter(c=>c.id==='gateball-wall');
 assert.ok(wall.length&&wall.every(c=>c.z<T.minZ),'The terrace has no retaining wall on its seaward side');
 assert.ok(wall.some(c=>circleHitsRect(25,T.minZ-.25,.3,c)),'You can walk off the terrace over the wall');
});

