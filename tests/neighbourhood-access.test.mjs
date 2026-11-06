import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {townBoundsBlocked,standingHitsRect,circleHitsRect,canStepBetween} from '../physics.js';
import {groundHeight,planHeight} from '../src/world/layout.js';
import {createNavigation} from '../src/people/navmesh.js';
import {KITAHAMA,plotGate} from '../src/world/kitahama-layout.js';
import {gardenPoint,PARK_ACCESS,GARDEN_BENCHES_AUTHOR} from '../src/world/garden-layout.js';
import {SHOPPING_LANE} from '../src/world/shopping-lane-plan.js';
import {FORMER_FLORIST,NAKAMURA_DESSERTS,HARBOUR_PARK_SEATS} from '../src/world/harbour-park-plan.js';
import {SAKURA_FLOWER_STAND} from '../src/world/okinawa/old-town.js';
import {PARK_BENCH} from '../src/world/park-layout.js';
import {feedPlace} from '../src/feed/places.js';
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
const prompts=[],actions=[];
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),townMode:'peninsula',mobile:false,shadows:false,register:(object,label,run)=>prompts.push({object,label,run}),enter(){},onAction:(...args)=>actions.push(args),getPlayerPosition:()=>new THREE.Vector3()});
// Broad phase keeps this whole-town route audit practical without weakening collisions.
const bins=new Map(),cell=4;
for(const c of world.colliders){const reach=Math.hypot(c.w,c.d)/2+.5;for(let x=Math.floor((c.x-reach)/cell);x<=Math.floor((c.x+reach)/cell);x++)for(let z=Math.floor((c.z-reach)/cell);z<=Math.floor((c.z+reach)/cell);z++){const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(c);}}
const nearby=(x,z)=>bins.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];
const playerBlocked=(x,z,r)=>townBoundsBlocked(x,z,r)||nearby(x,z).some(c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
const npcBlocked=(x,z,r)=>townBoundsBlocked(x,z,r)||nearby(x,z).some(c=>circleHitsRect(x,z,r,c));
function arrival(nav,x,z){const route=nav.path({x:0,z:0},{x,z});assert.ok(route.length,'route to '+[x,z]);assert.ok(Math.hypot(route.at(-1)[0]-x,route.at(-1)[1]-z)<.05,'exact arrival at '+[x,z]);return route;}
// The player resolves the x and z portions of a walking frame separately. Follow
// the whole journey with that same radius, standing height and maximum step, so a
// reachable graph node alone cannot hide a pavement cliff or a blocked corner.
function walkPath(points,label,support=null){
 let [x,z]=points[0];assert.equal(playerBlocked(x,z,.32),false,label+' starting position');
 for(const [tx,tz] of points.slice(1)){
  const sx=x,sz=z,n=Math.ceil(Math.hypot(tx-x,tz-z)/.04);
  for(let k=1;k<=n;k++){
   const nx=sx+(tx-sx)*k/n,nz=sz+(tz-sz)*k/n;
   for(const [px,pz] of [[nx,z],[nx,nz]]){
    assert.ok(canStepBetween(groundHeight(x,z),groundHeight(px,pz)),label+' floor step at '+[px,pz]);
    assert.equal(playerBlocked(px,pz,.32),false,label+' blocked at '+[px,pz]);
    if(support&&(k%5===0||k===n))assert.ok(support(px,pz),label+' missing drawn floor at '+[px,pz]);x=px;z=pz;
   }
  }
 }
 assert.ok(Math.hypot(x-points.at(-1)[0],z-points.at(-1)[1])<.001,label+' arrival');
}
test('built street, yard and town hall floors take priority over nearby garden and beach banks',async()=>{
 // Main Street's ground is laid from its plan (ground-plan.js): its footway at its own top, a kerb over the carriageway.
 const {mainStreetTop,MAIN_STREET_GROUND}=await import('../src/world/ground-plan.js');
 for(const [x,z] of [[-.8,18],[1.5,18],[3,18],[4.9,18],[4.5,28]])
  assert.equal(planHeight(x,z),mainStreetTop(x,z),'Main Street\'s laid floor at '+[x,z]);
 assert.equal(planHeight(1.5,18),MAIN_STREET_GROUND.footway);
 for(const [x,z] of [[-8.5,26],[-37.2,26],[-37.2,29],[-22,20],[35,25],[39.8,26.7]])
  assert.equal(planHeight(x,z),0,'finished flat floor at '+[x,z]);
});
test('town reaches both park benches and every residential gate with ordinary collision',()=>{
 for(const blocked of [playerBlocked,npcBlocked]){const nav=createNavigation(blocked);
  const garden=arrival(nav,-23.4,34.6);assert.ok(garden.length<65,'no eastern-island detour');
  arrival(nav,PARK_BENCH.stand[0],PARK_BENCH.stand[2]);
  for(const b of GARDEN_BENCHES_AUTHOR)arrival(nav,...gardenPoint(...b.stand));
  for(const plot of KITAHAMA.plots)arrival(nav,...plotGate(plot).door);
 }
});
test('authored park walks have no height cliffs or objects across the walking centre',()=>{
 for(const route of PARK_ACCESS)for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1);let last=groundHeight(...a);
  for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n,h=groundHeight(x,z);assert.ok(Math.abs(h-last)<.18,route.id+' height seam');assert.equal(playerBlocked(x,z,.32),false,route.id+' obstruction at '+[x,z]);last=h;}
 }
});
test('rendered paths remain connected after the game installs its walking surface',async()=>{
 const {createWalkSurface}=await import('../src/world/walk-surface.js');const {setWalkSurface}=await import('../src/world/layout.js');
 const surface=createWalkSurface({minX:-45,maxX:65,minZ:-38,maxZ:98,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 try{
  walkPath([[2.6,18],[3.6,18]],'north Main Street pavement');
  const floorBins=new Map(),ray=new THREE.Raycaster();world.group.updateMatrixWorld(true);
  world.group.traverse(o=>{if(!o.isMesh||o.material?.transparent)return;for(let p=o;p;p=p.parent)if(!p.visible||p.userData.dynamicProp)return;const b=new THREE.Box3().setFromObject(o);for(let x=Math.floor(b.min.x/4);x<=Math.floor(b.max.x/4);x++)for(let z=Math.floor(b.min.z/4);z<=Math.floor(b.max.z/4);z++){const key=x+','+z;if(!floorBins.has(key))floorBins.set(key,[]);floorBins.get(key).push(o);}});
  // The walking raster can carry a neighbouring slab edge by a few centimetres;
  // require a real supporting facet within 6 cm, well below the 24 cm step limit.
  const support=(x,z)=>{const y=groundHeight(x,z);ray.set(new THREE.Vector3(x,y+.24,z),new THREE.Vector3(0,-1,0));return ray.intersectObjects(floorBins.get(Math.floor(x/4)+','+Math.floor(z/4))||[],false).some(hit=>hit.point.y>=y-.06&&hit.point.y<=y+.06);};
  // Main Street's east footway to z 46, then Kitahama's footpath (KITAHAMA.footpath, x 3–6) past 8 and 9 Kitahama.
  const footpath=(KITAHAMA.footpath.minX+KITAHAMA.footpath.maxX)/2;
  walkPath([[1.9,14],[1.9,27],[-5.4,27],[-8,34.6],[-5.4,36.9],[1.9,36.9],[1.9,46],[footpath,46],[footpath,66]],'town to Kitahama footpath',support);
  walkPath([[1.9,14],[1.9,27],[3.3,27],SHOPPING_LANE.entry,SHOPPING_LANE.exit,[1.9,SHOPPING_LANE.exit[1]],[1.9,46],[footpath,46],[footpath,66]],'Main Street through the cleared connector to Kitahama',support);
  for(const z of SHOPPING_LANE.crosswalks)walkPath([[-5.4,z],[10.8,z]],'Retained neighbourhood cross street '+z,support);
  walkPath([[3.3,36.9],[-5.4,36.9],[-5.4,46],[-21.5,46],[-21.5,40.6],[-23.4,40.6]],'Cleared lane to western neighbourhood, round the pocket park',support);
  const shops=createNavigation(playerBlocked);
  walkPath(arrival(shops,...SAKURA_FLOWER_STAND),'Sakura flower stand',support);
  walkPath(arrival(shops,...NAKAMURA_DESSERTS.approach),'Nakamura shared dessert counter',support);
  const nav=createNavigation(playerBlocked);const garden=arrival(nav,-23.4,34.6);assert.ok(garden.length<65);walkPath(garden,'town to garden');
  for(const plot of KITAHAMA.plots){walkPath(arrival(nav,...plotGate(plot).door),'town to '+plot.id);const [x,z]=plotGate(plot).door,route=nav.path({x:3.3,z:36.9},{x,z});assert.ok(route.length);assert.ok(Math.hypot(route.at(-1)[0]-x,route.at(-1)[1]-z)<.05);walkPath(route,'Rainflower to '+plot.id,support);}
  walkPath(arrival(nav,...gardenPoint(...GARDEN_BENCHES_AUTHOR[1].stand)),'town to garden bench');
 }finally{setWalkSurface(null);}
});
test('the retired lane stays open; the florist pavilion is gone, its lawn is open ground, and the flowers are sold at Sakura’s door',async()=>{
 assert.equal(world.group.getObjectByName('Rainflower shopping lane'),undefined);assert.ok(world.group.getObjectByName('Kitahama connector'));assert.equal(world.colliders.some(c=>c.rainflower),false);
 assert.equal(world.landmarks.some(s=>s.id==='rainflower-lane'),false);assert.equal(world.landmarks.some(s=>s.id==='rainflower-florist'),false,'no pavilion landmark (phase 4, addendum 3)');assert.equal(world.landmarks.filter(s=>s.id==='nakamura').length,1);
 assert.equal(world.group.getObjectByName('Rainflower Florist'),undefined,'no pavilion meshes');assert.equal(world.colliders.some(c=>c.business==='rainflower-florist'),false,'no pavilion collider');
 const {NEIGHBOURS}=await import('../src/people/neighbours.js');
 assert.equal(NEIGHBOURS.find(n=>n.name==='Mrs Kinjō'),undefined,'no florist body');assert.deepEqual(NEIGHBOURS.find(n=>n.name==='Mrs Nakamura').at,NAKAMURA_DESSERTS.staffAt);
 assert.equal(prompts.some(p=>/flowers|flower counter|Mrs Kinjō/.test(p.label)&&!/bouquet/.test(p.label)),false,'the pavilion’s prompts are gone');
 const B=FORMER_FLORIST.bounds;for(let x=B.minX;x<=B.maxX+.01;x+=.5)for(let z=B.minZ;z<=B.maxZ+.01;z+=.5)assert.equal(playerBlocked(x,z,.32),false,'the lawn where the pavilion stood is open at '+[x,z]);
 const buy=new THREE.Vector3();prompts.find(p=>p.label==='Buy a bouquet · ¥250').object.getWorldPosition(buy);assert.ok(Math.hypot(buy.x-SAKURA_FLOWER_STAND[0],buy.z-SAKURA_FLOWER_STAND[1])<.01,'the bouquets are at Sakura’s door');
 assert.equal(playerBlocked(buy.x,buy.z,.32),false);
 assert.equal(world.colliders.some(c=>circleHitsRect(90,113,.32,c)),false,'The remote old lane remains clear land');
});
test('dry-weather garden visits use the existing residents and respect rain routines',async()=>{
 const {residentPlan}=await import('../src/people/social.js');const {RESIDENTS}=await import('../src/people/residents.js');
 const {sleepHours,homeRoutine}=await import('../src/people/home-life.js'),tetsuo=RESIDENTS.find(p=>p.name==='Tetsuo'),{wake}=sleepHours(tetsuo);
 assert.equal(homeRoutine(tetsuo,wake+16).id,'breakfast');assert.equal(residentPlan(tetsuo,wake+16,false,{}).place,'home','breakfast finishes before the garden trip');
 assert.equal(RESIDENTS.find(p=>p.name==='Reiko'),undefined,'Reiko is retired (phase 4): the morning bench is Tetsuo’s');
 for(const [name,minute] of [['Tetsuo',780]]){const profile=RESIDENTS.find(p=>p.name===name),plan=residentPlan(profile,minute,false,{});assert.equal(plan.place,'park');assert.ok(plan.activity.includes('Harbour Park'));assert.deepEqual(plan.target,HARBOUR_PARK_SEATS[1].stand);assert.notEqual(residentPlan(profile,minute,true,{}).place,'park');}
});

test('photo and feed destinations use the reachable park and Sakura’s flower stand, and Sakura directs ice cream customers to Nakamura',async()=>{
 const game=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 const source=game.match(/function photoSpots\(\)\{[\s\S]*?\n\}/)?.[0];assert.ok(source,'The public photo destinations remain available');
 const photos=Function('HARBOUR_PARK_SEATS','SAKURA_FLOWER_STAND',source+';return photoSpots();')(HARBOUR_PARK_SEATS,SAKURA_FLOWER_STAND);
 const nav=createNavigation(playerBlocked);
 for(const [photoId,feedId,point] of [['photo-garden','garden',HARBOUR_PARK_SEATS[1].stand]]){
  const photo=photos.find(p=>p.id===photoId),feed=feedPlace(feedId);assert.ok(photo&&feed,'Existing saved IDs remain valid');
  assert.deepEqual([photo.x,photo.z],point);assert.deepEqual(feed.shot.at,point);assert.equal(feed.shot.lane,undefined,'Capture cameras no longer transform the retired lane');
  assert.doesNotMatch(photo.title+' '+photo.at+' '+feed.name,/Aoba|Rainflower Lane/);
  walkPath(arrival(nav,...point),photoId+' public photo approach');
 }
 // The saved photo id keeps working: it is the flowers' new place, Sakura's door, and the feed has no pavilion to shoot.
 const flowers=photos.find(p=>p.id==='photo-rainflower');assert.deepEqual([flowers.x,flowers.z],[...SAKURA_FLOWER_STAND]);assert.match(flowers.at,/Sakura/);
 walkPath(arrival(nav,...SAKURA_FLOWER_STAND),'photo-rainflower public photo approach');
 assert.equal(feedPlace('rainflower'),undefined,'no story is set at the removed pavilion');
 const mural=prompts.find(p=>p.label==='Look at the ice-cream mural');assert.ok(mural);mural.run();
 assert.match(actions.at(-1)[2],/Blue Coral.*Nakamura.*Harbour Park/);assert.doesNotMatch(actions.at(-1)[2],/Rainflower Lane/);
});

test('visible garden approaches match walking heights across the whole entrance, not only the path',async()=>{
 // Nishi's slabs, the former terminus lawn, Kitahama's compact ground and its lanes' paving cover the garden bank at
 // the south approach. Compare physics to those finished floors, including where they overlap.
 world.group.updateMatrixWorld(true);const surfaces=[];world.group.traverse(o=>{if(['Compact neighbourhood ground','Aoba lowland shared terrain','Island land','Main Street end lawn'].includes(o.name)||/^Okinawan quarter:(matte|sand)\||^grid-lanes:/.test(o.name)||o.parent?.name==='Quarter ground'&&!o.userData.groundMarking)surfaces.push(o);});
 // Every gutter the ground plans lay, Nishi-machi's along the north lane included (ground-plan-quarters.js).
 const {quarterGutterRuns}=await import('../src/world/ground-plan-quarters.js');const gutters=quarterGutterRuns().map(r=>r.band);
 const ray=new THREE.Raycaster();for(const x of [-34,-29,-24,-19,-14,-9])for(const z of [29,30.5,32,33.5,35]){if(playerBlocked(x,z,.05))continue;   // inside the Heights, a wall or the park's railing: nobody stands there
  // A lane's U-gutter is drawn 28 mm proud of the paving, a lid's lip (okinawa/lane-edges.js GUTTER), and the walking
  // surface the game installs carries the step onto it (the paths test above walks them with it installed).
  if(gutters.some(b=>x>=b.minX-.01&&x<=b.maxX+.01&&z>=b.minZ-.01&&z<=b.maxZ+.01))continue;
  ray.set(new THREE.Vector3(x,1,z),new THREE.Vector3(0,-1,0));const hit=ray.intersectObjects(surfaces,false)[0];assert.ok(hit,'drawn ground at '+[x,z]);assert.ok(Math.abs(hit.point.y-groundHeight(x,z))<.025,'visible height disagrees at '+[x,z]+': '+hit.point.y+' / '+groundHeight(x,z));}
 assert.equal(world.group.getObjectByName('Continuous neighbourhood garden ground'),undefined,'the buried garden ground mesh is gone (west-shore.js)');
 const {position,normal}=world.group.getObjectByName('Compact neighbourhood ground').geometry.attributes;for(let i=0;i<position.count;i++)assert.ok(normal.getY(i)>0,'upward terrain normal');
});
