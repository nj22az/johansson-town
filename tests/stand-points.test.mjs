// Stand points in residents' days (src/people/stand-points.js, stand-sequences.js; docs/research/new-yokosuka-lessons.md
// C6, approved by the owner on 19 October 2026): every point is data with its reason, reachable, clear of every solid and
// out of every doorway, and where a resident is in a sequence is the same for the same day on every run.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect,standingHitsRect,townBoundsBlocked} from '../physics.js';
import {MINATO_COMPACT} from '../src/world/interiors/minato-compact-plan.js';

installDOM();globalThis.self=globalThis;
const {STAND_SEQUENCES,STANDING_RESIDENTS,standNow,standAt,dayPhase,STAND_WALK}=await import('../src/people/stand-points.js');
const {CAST}=await import('../src/people/cast.js');
const {createRoomWalk}=await import('../src/people/room-walk.js');
const {createTown}=await import('../src/world/town.js');
const {createBusinesses,createIslandBusinesses}=await import('../src/world/businesses.js');
const {createColliderGrid}=await import('../src/world/collider-grid.js');
const {createWalkSurface}=await import('../src/world/walk-surface.js');
const {groundHeight,planHeight,setWalkSurface}=await import('../src/world/layout.js');
const {createNavigation}=await import('../src/people/navmesh.js');
const {createNeighbours}=await import('../src/people/neighbours.js');
const {canonicalDay}=await import('../src/people/canonical-day.js');
const {activeResidentHome}=await import('../src/people/home-directory.js');
const {SAKURA_LAYOUT}=await import('../src/world/interiors/sakura-layout.js');
const {inDoorPath,SAKURA_CLERK_APPROACH,TILL_BODY}=await import('../src/world/interiors/sakura-queue.js');
const {suppliedRoomBoundsBlocked}=await import('../src/world/supplied-rooms.js');
const {buildCompactShop}=await import('../src/world/interiors/compact-shops.js');
const {buildPoliceStationInterior}=await import('../src/world/interiors/police-station.js');
const {SATO_COLLIDERS,SATO_KITCHEN}=await import('../src/world/sato-ramen-layout.js');

const POSES=new Set(['Idle','CounterIdle','Interact','Use','Think','Sweep','Wipe','Polish','Mop']);
const TOOLS=new Set(['broom','mop','cloth','glass']);
const DAY=20003*1440;

test('every stand point is data with its reason, a facing, a pose of the town’s and a wait in New Yokosuka’s range',()=>{
 const waits=[];
 for(const s of Object.values(STAND_SEQUENCES)){
  assert.ok(s.why&&s.who&&['world','sakura','frontrow','ramen','koban'].includes(s.frame),s.id);
  assert.ok(s.points.length>=2&&s.points.length<=12,s.id+' has 2–12 points');
  for(const p of s.points){
   assert.ok(p.why?.length>10&&p.activity?.length>5,s.id+': every point says what and why');
   assert.ok(Math.abs(Math.hypot(...p.facing)-1)<1e-3,s.id+': facing is a direction');
   assert.ok(POSES.has(p.pose),s.id+': '+p.pose+' is a pose the avatars play');
   assert.ok(p.tool===null||TOOLS.has(p.tool),s.id+': the tool is one the avatars hold');
   assert.ok(Array.isArray(p.wait)&&p.wait[0]>=60&&p.wait[1]<=1800&&p.wait[0]<=p.wait[1],s.id+': waits 60–1,800 s');
   waits.push((p.wait[0]+p.wait[1])/2);
  }
 }
 waits.sort((a,b)=>a-b);const median=waits[Math.floor(waits.length/2)];
 assert.ok(median>=120&&median<=900,'the median wait is near New Yokosuka’s 300 s (it is '+median+')');
});

test('stand sequences belong to the residents the owner named, 3–12 rows each, and everyone else keeps one target a phase',()=>{
 const rows=new Map();
 for(const r of STANDING_RESIDENTS){const s=STAND_SEQUENCES[r.stand];assert.ok(s,r.stand+' exists');rows.set(r.name,new Set([...(rows.get(r.name)||[]),r.stand]));}
 // Ms Ganaha's coin-laundry round: the owner's decision of 21 October 2026 gave the laundry its keeper (commerce/coin-laundry.js).
 assert.deepEqual([...rows.keys()].sort(),['Grandmother Higa','Harbour master','Kōji','Mrs Sato','Ms Ganaha','Nhung','Officer Mori','Thuan'].sort());
 for(const [name,ids] of rows){const n=[...ids].reduce((t,id)=>t+STAND_SEQUENCES[id].points.length,0);assert.ok(n>=3&&n<=12,name+' has '+n+' stand rows');}
 for(const p of CAST)for(const row of p.day)assert.ok(row.length===3||row[3]?.stand,p.name+': a fourth element is only a stand sequence');
});

test('the seeded clock decides where they are: the same on every run, never Math.random, different from day to day',()=>{
 const random=Math.random;Math.random=()=>{throw new Error('Math.random used');};
 try{
  const seen=new Set();
  for(const r of STANDING_RESIDENTS){
   for(let m=r.from+1;m<r.from+120;m+=7){
    const a=standNow(r.name,DAY+m,null,r.stand),b=standNow(r.name,DAY+m,null,r.stand);
    assert.deepEqual(a&&[a.index,a.loop,a.arrive,a.leave],b&&[b.index,b.loop,b.arrive,b.leave]);
   }
   for(let d=0;d<6;d++){const s=standNow(r.name,DAY+d*1440+r.from+90,null,r.stand);seen.add(r.name+':'+s.index+':'+Math.round(s.leave));}
  }
  assert.ok(seen.size>STANDING_RESIDENTS.length*3,'the days differ');
 }finally{Math.random=random;}
});

test('the timeline walks at 1.25 m/s between points and stays at each for its drawn wait, in order, looping',()=>{
 const seq=STAND_SEQUENCES['higa-garden'];let last=null;
 for(let s=0;s<6000;s+=5){
  const at=standAt(seq,DAY+420,DAY+420+s/60,'Grandmother Higa');
  if(last&&at.index!==last.index){
   assert.equal(at.index,(last.index+1)%seq.points.length,'points in order, looping');
   const a=seq.points[last.index],b=seq.points[at.index],walk=at.arrive-last.leave;
   assert.ok(walk>=Math.hypot(b.x-a.x,b.z-a.z)/STAND_WALK,'time to walk there');
  }
  if(at.waiting){const w=at.leave-at.arrive,p=seq.points[at.index];assert.ok(w>=p.wait[0]&&w<=p.wait[1]);}
  last=at;
 }
 assert.equal(dayPhase('Grandmother Higa',DAY+430).stand,'higa-garden');
 assert.equal(standNow('Grandmother Higa',DAY+10*60,'world'),null,'only in the phase that names it');
});

// ── The rooms ──
const roomReach=(blocked,bounds,from,to,radius=.3)=>{
 const walk=createRoomWalk(blocked,{bounds,radius,smoothTurn:true}),g=new THREE.Group();g.position.set(from[0],0,from[1]);
 for(let i=0;i<5000;i++){if(walk.move({g,profile:{name:'probe',age:30}},[to[0],0,to[1]],.05))return true;assert.equal(blocked(g.position.x,g.position.z,radius),false,'the walk stays clear');}
 return false;
};
test('Sakura: the clerk’s points are reachable behind the counter, the till 0.75 m behind its front, nothing in the doorway',()=>{
 const L=SAKURA_LAYOUT,blocked=(x,z,r=.3)=>suppliedRoomBoundsBlocked(L,x,z,r)||L.colliders.some(c=>circleHitsRect(x,z,r,c));
 const points=STAND_SEQUENCES['sakura-floor'].points;
 for(const p of points){
  assert.equal(inDoorPath(p.x,p.z),false,'out of the doorway');
  if(Math.hypot(p.x-L.staff[0],p.z-L.staff[2])<.01){
   // The till: the body is clear of the counter, and the step from the routed approach is clear all the way.
   for(let t=0;t<=1;t+=.05)assert.equal(blocked(SAKURA_CLERK_APPROACH[0]+(p.x-SAKURA_CLERK_APPROACH[0])*t,p.z,TILL_BODY),false,'the till step is clear');
   assert.ok(roomReach(blocked,L.bounds,[-4.6,3.2],[SAKURA_CLERK_APPROACH[0],SAKURA_CLERK_APPROACH[2]],L.clearance),'the approach is routed to');
  }else{
   assert.equal(blocked(p.x,p.z,L.clearance),false,'clear at the clerk’s clearance');
   assert.ok(roomReach(blocked,L.bounds,[SAKURA_CLERK_APPROACH[0],SAKURA_CLERK_APPROACH[2]],[p.x,p.z],L.clearance),'reachable: '+p.activity);
  }
 }
});
test('Front-Row Books and the police station: every point reachable from the worker’s own place and clear of the furniture',()=>{
 const sites=createIslandBusinesses();
 {const room=new THREE.Group(),cs=[];const layout=buildCompactShop({site:sites.find(s=>s.id==='frontrow'),room,reg(){},collider:(x,z,w,d)=>cs.push({x,z,w,d}),action(){},exit(){}});
  const blocked=(x,z,r=.3)=>cs.some(c=>circleHitsRect(x,z,r,c));
  // Nhung's bookshop mornings went when she became the island doctor (22 October 2026); the paper is her evening's.
  for(const id of ['frontrow-paper'])for(const p of STAND_SEQUENCES[id].points){
   assert.equal(blocked(p.x,p.z,.3),false,id+' clear');assert.ok(roomReach(blocked,layout.bounds,[layout.staff.Nhung[0],layout.staff.Nhung[2]],[p.x,p.z]),id+' reachable');
   assert.ok(Math.hypot(p.x-layout.spawn[0],p.z-layout.spawn[2])>1,'out of the doorway');
  }}
 {const room=new THREE.Group(),cs=[];const L=buildPoliceStationInterior({site:sites.find(s=>s.id==='koban'),room,reg(){},collider:(x,z,w,d,h,minY=0)=>cs.push({x,z,w,d,height:h,minY}),action(){},exit(){}});
  const ground=cs.filter(c=>(c.minY||0)<1),blocked=(x,z,r=.3)=>ground.some(c=>circleHitsRect(x,z,r,c));
  for(const p of STAND_SEQUENCES['station-desk'].points){
   assert.equal(blocked(p.x,p.z,.3),false,'clear');assert.ok(roomReach(blocked,L.bounds,[L.staff['Officer Mori'][0],L.staff['Officer Mori'][2]],[p.x,p.z]),'reachable: '+p.activity);
   assert.ok(Math.hypot(p.x-L.spawn[0],p.z-L.spawn[2])>1,'out of the doorway');
  }}
});
test('Sato Ramen: Mrs Sato’s points are on the kitchen floor, clear of the line and the counter',()=>{
 for(const id of ['ramen-stock','ramen-lunch'])for(const p of STAND_SEQUENCES[id].points){
  assert.ok(p.station==='pass'||SATO_KITCHEN[p.station],'a station of the kitchen');
  assert.ok(p.x>=SATO_KITCHEN.minX&&p.x<=SATO_KITCHEN.maxX&&p.z<=SATO_KITCHEN.passZ+.01&&p.z>=MINATO_COMPACT.ramenPrep.position[2]+MINATO_COMPACT.ramenPrep.depth/2,'on the kitchen floor');   // in front of the back line (the compact plan)
  assert.equal(SATO_COLLIDERS.some(c=>circleHitsRect(p.x,p.z,.2,c)),false,id+' clear of solids: '+p.activity);
 }
});

// ── The street ──
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const surface=createWalkSurface({minX:-45,maxX:50,minZ:-78,maxZ:95,base:planHeight});surface.add(world.group);setWalkSurface(surface);
const grid=createColliderGrid(world.colliders),blocked=(x,z,r=.3)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
const doors=[...createBusinesses().map(s=>s.door&&[s.door[0],s.door[2]]),...CAST.map(p=>{const t=activeResidentHome(p.name)?.target;return t&&[t.x,t.z];})].filter(Boolean);
test('the street’s stand points stand clear of every solid and doorway, and each is walked to from the one before',()=>{
 const nav=createNavigation(blocked);
 for(const s of Object.values(STAND_SEQUENCES).filter(s=>s.frame==='world')){
  s.points.forEach((p,i)=>{
   assert.equal(blocked(p.x,p.z,.32),false,s.id+': clear at '+p.x+','+p.z);
   const near=doors.find(d=>Math.hypot(d[0]-p.x,d[1]-p.z)<.85);assert.equal(near,undefined,s.id+': out of the doorway at '+near);
   const from=s.points[(i+s.points.length-1)%s.points.length];
   assert.ok(nav.path({x:from.x,z:from.z},{x:p.x,z:p.z}).length>0,s.id+': a way from '+from.activity+' to '+p.activity);
  });
 }
});
for(const name of ['Grandmother Higa','Kōji'])test(name+' walks the stand points of the day in order, faces each and takes its pose, never through anything',()=>{
 const parent=new THREE.Group();parent.visible=false;
 const system=createNeighbours({parent,blocked,register(o){o.userData.hit={inside:false};}});
 const person=system.people.find(p=>p.spec.name===name);system.people.splice(0,system.people.length,person);
 const g=person.g,row=STANDING_RESIDENTS.find(r=>r.name===name),seq=STAND_SEQUENCES[row.stand];
 // A day on the ashore week (Kōji is aboard as relief bosun on the other).
 let day=20003;while(canonicalDay(name,day*1440+row.from+30)?.stand?.sequence!==seq.id)day++;
 const start=day*1440+row.from;const first=canonicalDay(name,start+1).target;g.position.set(first[0],groundHeight(...first),first[1]);person.initialised=true;
 const visited=new Set(),scheduled=new Set(),next=CAST.find(p=>p.name===name).day.map(r=>r[0].split(':').map(Number)).map(([h,m])=>h*60+m).filter(m=>m>row.from).sort((a,b)=>a-b)[0];let posed=0;
 for(let s=60;s<(next-row.from)*60;s+=.1){
  const at=standNow(name,start+s/60,'world');if(at?.waiting&&s<(next-row.from)*60-1500)scheduled.add(at.index);
  const before=g.position.clone();system.update(.1,start+s/60);
  assert.ok(g.position.distanceTo(before)<.2,'walks, never jumps');
  assert.equal(blocked(g.position.x,g.position.z,.2),false,'never inside a solid at '+g.position.toArray().map(v=>v.toFixed(2)));
  const plan=canonicalDay(name,start+s/60);
  if(plan.stand&&Math.hypot(g.position.x-plan.target[0],g.position.z-plan.target[1])<.35){visited.add(plan.stand.index);
   if(g.userData.standPose){posed++;assert.equal(g.userData.socialPose,plan.stand.pose);assert.ok(Math.abs(Math.atan2(Math.sin(plan.stand.yaw-g.rotation.y),Math.cos(plan.stand.yaw-g.rotation.y)))<.06,'faces the point’s way');}}
 }
 assert.ok(scheduled.size>=2,'the phase reaches more than one point');
 for(const i of scheduled)assert.ok(visited.has(i),'reached '+seq.points[i].activity);assert.ok(posed>100,'and worked at');
 setWalkSurface(surface);
});

test('one switch (full-life.js) turns stand points and quay breaks off for a lighter edition, and back on',async()=>{
 const {setFullLife,fullLife}=await import('../src/people/full-life.js');
 const {quayLedger,quayClaim}=await import('../src/people/quay-breaks.js');
 const b=quayLedger(20740).find(b=>b.spot),m=20740*1440+7*60+40;
 assert.equal(fullLife(),true,'on by default');
 assert.ok(standNow('Grandmother Higa',m,'world')&&quayClaim(b.name,b.start+1));
 setFullLife(false);
 try{
  assert.equal(standNow('Grandmother Higa',m,'world'),null);assert.equal(quayClaim(b.name,b.start+1),null);
  const plan=canonicalDay('Grandmother Higa',m);assert.equal(plan.stand,undefined,'one target for the phase');
 }finally{setFullLife(true);}
 assert.ok(standNow('Grandmother Higa',m,'world'));
});
