// Minato Police Station (src/world/police-station*.js, src/world/interiors/police-station.js): the owner's ruling of
// 19 October 2026 (AGENTS.md; docs/CAST-CONSOLIDATION.md addendum 1). A real station on the empty lot beside the kōban,
// enterable like the shops, Officer Mori living upstairs, his home id still `koban`.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect,circleHitsRect} from '../physics.js';
import {createRoomWalk} from '../src/people/room-walk.js';

installDOM();globalThis.self=globalThis;
const {POLICE_STATION:S,STATION_YARD,KOBAN}=await import('../src/world/police-station-layout.js');
const {KOBAN:KOBAN_ALIAS}=await import('../src/world/koban-layout.js');
const {buildPoliceStationInterior,STATION_HOME_LAYOUT,STATION_ROOM,STATION_STAIR}=await import('../src/world/interiors/police-station.js');
const {createTown}=await import('../src/world/town.js');
const {createBusinesses}=await import('../src/world/businesses.js');
const {routeAt}=await import('../src/world/layout.js');
const {lanePatches}=await import('../src/world/lane-surfaces.js?snappy=1');
const {TOWN_WALK_PLOTS}=await import('../src/world/architecture-plan.js');

const sites=createBusinesses();
const anchors=[];
const world=createTown({scene:new THREE.Scene(),sites,townMode:'peninsula',kitano:'distant',mobile:false,shadows:false,
 register(o,label){anchors.push({o,label});},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
world.group.updateMatrixWorld(true);
const fixed=world.colliders.filter(c=>!c.moving&&!c.only);

test('the station stands on the lot, and where the police box stood is its yard',async()=>{
 const building=fixed.find(c=>c.id==='police-station');
 assert.ok(building,'the station is solid');
 assert.ok(circleHitsRect(9.15,18,.1,building)&&circleHitsRect(6.2,14.5,.1,building)&&circleHitsRect(12.2,21.6,.1,building),'it covers the lot');
 assert.ok(building.height>6,'two storeys and a parapet');
 assert.ok(TOWN_WALK_PLOTS.some(p=>p.id==='police-station'),'it has its walk circuit');
 // The old box stood at x 4.3–9.3, z 24.9–29.1: now open, paved yard with the car and the rack on it.
 assert.equal(fixed.some(c=>c.id==='police-station'&&circleHitsRect(6.8,25.5,.3,c)),false);
 for(const [x,z] of [[5.2,25.6],[9.3,28.3],[4.5,30],[6.8,28.1]])assert.ok(routeAt(x,z,.3),`yard paved and walkable at ${x},${z}`);
 // The yard is laid by the ground generator since step 3 of the ground plan (ground-plan-quarters.js): poured concrete.
 const {quarterPlans}=await import('../src/world/ground-plan-quarters.js'),{laidAt}=await import('../src/world/ground-plan.js');
 for(const [x,z] of [[7,26],[8.5,29.5],[8.5,26.5]])assert.equal(quarterPlans().map(p=>laidAt(p,x,z)).find(Boolean)?.cls,'concrete','the yard is concrete at '+[x,z]);
 for(const id of ['police-station-patrol-car','police-station-bicycle-rack','police-station-flagpole','police-station-bench'])
  assert.ok(fixed.some(c=>c.id===id),id+' is solid');
 const car=fixed.find(c=>c.id==='police-station-patrol-car');
 assert.ok(car.x-car.w/2>=S.yard.minX&&car.x+car.w/2<=S.yard.maxX&&car.z-car.d/2>=S.yard.minZ,'the car is in its yard');
});

test('the police box is gone: no geometry, no colliders, no plot of its own',()=>{
 let old=0;world.group.traverse(o=>{if(/Police box|Officer Mori window|Red police lamp/.test(o.name))old++;});
 assert.equal(old,0,'no police-box meshes');
 assert.equal(fixed.some(c=>c.id==='koban'||c.id==='koban-bicycle'),false,'no police-box colliders');
 assert.equal(TOWN_WALK_PLOTS.some(p=>p.id==='koban'),false,'no police-box plot');
});

test('the station door opens onto the street footway, and the way to it is clear',()=>{
 const site=sites.find(s=>s.id==='koban');
 assert.equal(site.title,'Minato Police Station');
 assert.deepEqual([site.door[0],site.door[2]],[...KOBAN.door]);
 const [x,z]=KOBAN.door;
 assert.ok(x<S.face&&S.face-x<1,'the door point is just outside the street face');
 assert.ok(z>S.entrance.z-S.entrance.half&&z<S.entrance.z+S.entrance.half,'in front of the glazed doors');
 for(let t=0;t<=1;t+=.05){const px=1.9+(x-1.9)*t;assert.ok(routeAt(px,z,.3),'walkable at '+px.toFixed(2));assert.equal(fixed.some(c=>standingHitsRect(px,z,.3,.04,c)),false,'clear at '+px.toFixed(2));}
 const entrance=anchors.find(a=>a.label==='Enter Minato Police Station');assert.ok(entrance,'an Enter prompt at the doors');
 const p=entrance.o.getWorldPosition(new THREE.Vector3());assert.ok(Math.hypot(p.x-x,p.z-z)<1.2);
 for(const label of ['Read the station notice board','Look in at the counter window','Inspect the patrol car','Inspect the police bicycle','Look up at the flag','Sit on the bench by the station'])
  assert.ok(anchors.some(a=>a.label===label),label);
});

test('the red lamp burns brighter after dark, its halo lights, and the flag comes down at night',()=>{
 const ps=world.policeStation;
 ps.update(720);const day=ps.red.material.emissiveIntensity,flagDay=ps.flag.visible;
 let halosDay=0;ps.group.traverse(o=>{if(o.isSprite&&o.parent.visible)halosDay++;});
 ps.update(1230);const night=ps.red.material.emissiveIntensity,flagNight=ps.flag.visible;
 let halosNight=0;ps.group.traverse(o=>{if(o.isSprite&&o.parent.visible)halosNight++;});
 assert.ok(night>day*2&&night>1.2,`lamp ${day} by day, ${night} at 20:30`);
 assert.equal(halosDay,0,'no halo at noon');assert.ok(halosNight>=1,'the halo at 20:30');
 assert.equal(flagDay,true);assert.equal(flagNight,false);
 assert.ok(world.hourly.includes(ps.update),'the town clock drives it');
});

// The interior, built as the game builds it.
function interior(){
 const room=new THREE.Group(),cols=[],spots=[];
 const layout=buildPoliceStationInterior({site:{id:'koban'},room,reg:(o,label)=>spots.push({o,label}),collider:(x,z,w,d,height,minY=0)=>cols.push({x,z,w,d,height,minY}),action(){},exit(){}});
 room.updateMatrixWorld(true);return {room,cols,spots,layout};
}

test('inside: the ground floor and Officer Mori’s quarters are walked from the door, up the stairs, and every prompt is in reach',()=>{
 const {cols,spots,layout}=interior(),B=layout.bounds,R=.28,walk=layout.walk;
 assert.ok(cols.length>20,'furniture and walls are solid');
 const outside=(x,z,r)=>x<B.minX+r||x>B.maxX-r||z<B.minZ+r||z>B.maxZ-r;
 const blocked=(x,z,r,y)=>outside(x,z,r)||cols.some(c=>standingHitsRect(x,z,r,y,c));
 // The player's own rule (game.js collides): a step onto a floor within a step, then nothing solid at that height.
 const step=(p,nx,nz)=>{const s=walk.move(p.x,p.y,p.z,nx,nz,R,(bx,by,bz)=>blocked(bx,bz,.05,by));return s.ok&&!blocked(nx,nz,R,s.y)?{x:nx,y:s.y,z:nz}:null;};
 const cell=.1,key=p=>Math.round(p.x/cell)+','+Math.round(p.z/cell)+','+Math.round(p.y*2);
 const start={x:layout.spawn[0],y:0,z:layout.spawn[2]};assert.ok(!blocked(start.x,start.z,R,0),'the spawn is clear');
 const seen=new Map([[key(start),start]]),queue=[start];
 while(queue.length){const p=queue.shift();for(const [dx,dz] of [[cell,0],[-cell,0],[0,cell],[0,-cell]]){const q=step(p,p.x+dx,p.z+dz);if(!q)continue;const k=key(q);if(!seen.has(k)){seen.set(k,q);queue.push(q);}}}
 const reached=[...seen.values()];
 assert.ok(reached.some(p=>p.y>STATION_STAIR.rise-.01),'the stairs lead up to the first floor');
 assert.ok(reached.some(p=>p.y>.5&&p.y<2.5),'by the stair itself');
 for(const {o,label} of spots){
  const a=o.getWorldPosition(new THREE.Vector3()),floor=a.y>STATION_STAIR.rise?STATION_STAIR.rise:0;
  const near=reached.some(p=>Math.abs(p.y-floor)<.01&&Math.hypot(p.x-a.x,p.z-a.z)<1.4);
  assert.ok(near,`${label} is within reach of somewhere you can stand`);
 }
 for(const label of ['Ring the counter bell','Sit on the waiting bench','Read the lobby notice board','Look through the lost property','Look into the holding room','Inspect the desk radio','Inspect the tea things','Go out to the patrol car','Inspect Officer Mori’s futon','Read Officer Mori’s notebook','Inspect the kettle','Exit to Main Street'])
  assert.ok(spots.some(s=>s.label===label),label);
 // The holding room is open (its barred door stands open) and empty: you can step inside it.
 assert.ok(reached.some(p=>p.y===0&&p.x< -2.3&&p.x> -3.0&&p.z> -1.4&&p.z<.3),'into the holding room');
 // The stair's underside is not a room: nobody stands under the low end of the flight.
 assert.equal(reached.some(p=>p.y===0&&p.x>STATION_STAIR.x0+.05&&p.z>-.8&&p.z<STATION_STAIR.z1-.1),false);
 // Under its head, where the back door is, there is room to stand.
 assert.ok(reached.some(p=>p.y===0&&p.x>STATION_STAIR.x0&&p.z< -2.2),'the back door, under the head of the stairs');
});

test('Officer Mori’s home is still `koban`, and his bed is upstairs in the station',async()=>{
 assert.equal(KOBAN.id,'koban');assert.equal(KOBAN_ALIAS,KOBAN,'the people code reads the same door');
 const {HOUSEHOLDS,identityOf}=await import('../src/people/roster.js');
 assert.deepEqual(HOUSEHOLDS.find(h=>h.home==='koban').members,['mori']);
 assert.equal(identityOf('mori').home,'koban');
 const {RESIDENTS}=await import('../src/people/residents.js');
 const mori=RESIDENTS.find(p=>p.name==='Officer Mori');assert.deepEqual(mori.home,[...KOBAN.door],'he walks home to the station door');
 assert.deepEqual(mori.work,[...KOBAN.door],'and to work at the same door');
 const site=sites.find(s=>s.id==='koban');assert.equal(site.homeOwner,'Officer Mori');assert.equal(site.homeLayouts['Officer Mori'],STATION_HOME_LAYOUT);
 const L=STATION_HOME_LAYOUT,B=L.bounds;
 for(const k of ['bed','bedside','table','door'])assert.ok(L[k][0]>B.minX&&L[k][0]<B.maxX&&L[k][2]>B.minZ&&L[k][2]<B.maxZ,k+' inside the station');
 assert.ok(L.bed[1]>=STATION_STAIR.rise&&L.bedside[1]===STATION_STAIR.rise,'his futon is on the first floor');
 assert.ok(Math.abs(L.cover.position[2]-L.bed[2])<.01&&L.cover.axis===L.bedAxis,'the quilt lies along his futon');
 // In the world: the room's frame maps onto the building (world x = 9.15 - z, world z = 18 + x).
 const wx=(S.minX+S.maxX)/2-L.bed[2],wz=(S.minZ+S.maxZ)/2+L.bed[0];
 assert.ok(wx>S.minX&&wx<S.maxX&&wz>S.minZ&&wz<S.maxZ,'the futon is inside the building');
 // His way in climbs the stair; it ends at his door, and starts at the street door.
 const r=L.entranceRoute;assert.deepEqual(r[0],[...STATION_ROOM.spawn]);assert.deepEqual(r.at(-1),L.door);
 for(let i=1;i<r.length;i++)assert.ok(Math.abs(r[i][1]-r[i-1][1])<.2,'no jump on the stair at '+i);
});

test('upstairs, Officer Mori walks from the stair head to his desk, his futon and back, at his floor’s height and seen from above',()=>{
 const {cols,layout}=interior(),L=STATION_HOME_LAYOUT,B=L.bounds;
 // As the game walks him (home-residents.js, his floor's colliders), and as the older tests do, every storey at once.
 for(const yAware of [true,false]){
  const blocked=(x,z,r,y=L.door[1])=>x<B.minX+r||x>B.maxX-r||z<B.minZ+r||z>B.maxZ-r||cols.some(c=>yAware?standingHitsRect(x,z,r,y,c):circleHitsRect(x,z,r,c));
  const person={g:new THREE.Object3D(),profile:{name:'Officer Mori',age:45}};person.g.position.set(...L.door);
  const walker=createRoomWalk(blocked,{bounds:B,height:L.door[1]});
  for(const [label,target] of [['desk',L.tableStand],['futon',L.bedside],['stair head',L.door]]){
   let done=false;for(let i=0;i<2400&&!done;i++)done=walker.move(person,target,1/20);
   assert.ok(done,`${yAware?'':'(every storey) '}Officer Mori cannot walk to the ${label}`);
  }
 }
 assert.equal(layout.storeys,true);
});
