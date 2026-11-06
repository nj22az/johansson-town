// The quay's shared spots (src/world/quay-spots.js, src/people/quay-breaks.js; docs/research/new-yokosuka-lessons.md
// C10, approved by the owner on 19 October 2026): named places to stop on the quay, each with its facing and its reason,
// claimed first-free by the harbour's people on a break and released when they leave; never two on one spot.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect,townBoundsBlocked} from '../physics.js';

installDOM();globalThis.self=globalThis;
const {QUAY_SPOTS}=await import('../src/world/quay-spots.js');
const {QUAY_BREAKERS,NOT_ASHORE,BREAK_WAIT,quayLedger,quayClaim,quayClaimsAt,breakFor}=await import('../src/people/quay-breaks.js');
const {FERRY_MOORINGS}=await import('../src/world/ferry.js');
const {rotaWeek}=await import('../src/people/ferry-crew.js');
const {createTown}=await import('../src/world/town.js');
const {createBusinesses}=await import('../src/world/businesses.js');
const {createColliderGrid}=await import('../src/world/collider-grid.js');
const {createWalkSurface}=await import('../src/world/walk-surface.js');
const {groundHeight,planHeight,setWalkSurface}=await import('../src/world/layout.js');
const {createNavigation}=await import('../src/people/navmesh.js');
const {createCastAI}=await import('../src/people/schedules.js');
const {WORLD_CAST}=await import('../src/people/residents.js');
const {createNeighbours}=await import('../src/people/neighbours.js');
const {canonicalDay}=await import('../src/people/canonical-day.js');
const {CAST}=await import('../src/people/cast.js');
const {activeResidentHome}=await import('../src/people/home-directory.js');

test('every spot is named, faces somewhere and says why it is a place to stop; two on Kitano’s pier where its line hand works',()=>{
 const ids=new Set(QUAY_SPOTS.map(s=>s.id));assert.equal(ids.size,QUAY_SPOTS.length);
 for(const s of QUAY_SPOTS){
  assert.ok(s.name&&s.why.length>40&&['minato','kitano'].includes(s.quay),s.id);
  assert.ok(Math.abs(Math.hypot(...s.facing)-1)<1e-3,s.id+' faces a direction');
  for(const t of QUAY_SPOTS)if(t!==s&&t.quay===s.quay)assert.ok(Math.hypot(t.x-s.x,t.z-s.z)>=1.5,s.id+' and '+t.id+' are separate places');
 }
 // Kitano's are the bitts' shore sides the ferry's line hand already walks to (ferry.js FERRY_MOORINGS).
 for(const s of QUAY_SPOTS.filter(s=>s.quay==='kitano'))
  assert.ok(FERRY_MOORINGS.airport.some(l=>Math.hypot(l.shoreTarget.x-s.x,l.shoreTarget.z-s.z)<1e-6),s.id+' is a line hand’s place at a bitt');
});

test('the ledger: first free, never two on one spot at once, stops of 60–1,800 s, the same every run',()=>{
 const random=Math.random;Math.random=()=>{throw new Error('Math.random used');};
 try{
  let taken=0,breaks=0;
  for(let d=20000;d<20140;d++){
   const ledger=quayLedger(d);assert.deepEqual(ledger,quayLedger(d));
   for(const b of ledger){
    breaks++;assert.ok(b.stop>=BREAK_WAIT[0]&&b.stop<=BREAK_WAIT[1]);
    assert.ok(QUAY_BREAKERS.some(q=>q.name===b.name)&&!NOT_ASHORE.some(n=>n.name===b.name));
    if(!b.spot)continue;taken++;
    assert.equal(b.spot.quay,b.quay,'a spot on their own quay');
    // First free: every spot before it in the list is held by somebody at that moment.
    for(const s of QUAY_SPOTS.slice(0,QUAY_SPOTS.indexOf(b.spot)).filter(s=>s.quay===b.quay))
     assert.ok(ledger.some(o=>o!==b&&o.spot===s&&o.start<=b.start&&o.end>b.start),b.name+' took the first free spot');
    for(const o of ledger)if(o!==b&&o.spot===b.spot)assert.ok(o.end<=b.start||b.end<=o.start,'never two on '+b.spot.id+' at once');
   }
   for(let m=0;m<1440;m+=2){const claims=quayClaimsAt(d*1440+m);assert.equal(new Set(claims.values()).size,claims.size);}
   if(rotaWeek(d*1440)===1)assert.equal(ledger.some(b=>b.name==='Kōji'),false,'Kōji is the ship’s bosun on his relief week');
  }
  assert.ok(breaks>300&&taken===breaks,'every break finds a spot');
  // A day when two Minato breaks overlap sends the second to the next spot.
  const both=[...Array(400).keys()].map(i=>20000+i).find(d=>{const l=quayLedger(d).filter(b=>b.quay==='minato');return l.some(a=>l.some(b=>a!==b&&a.start<=b.start&&a.end>b.start));});
  assert.ok(both,'overlapping breaks happen');const l=quayLedger(both).filter(b=>b.quay==='minato');assert.notEqual(l[0].spot,l[1].spot);
 }finally{Math.random=random;}
});

const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const surface=createWalkSurface({minX:-45,maxX:50,minZ:-78,maxZ:95,base:planHeight});surface.add(world.group);setWalkSurface(surface);
const grid=createColliderGrid(world.colliders),blocked=(x,z,r=.3)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
const doors=[...createBusinesses().map(s=>s.door&&[s.door[0],s.door[2]]),...CAST.map(p=>{const t=activeResidentHome(p.name)?.target;return t&&[t.x,t.z];})].filter(Boolean);

test('Minato’s spots stand clear of every solid and doorway, on ground the town’s walkers reach',()=>{
 const nav=createNavigation(blocked);
 for(const s of QUAY_SPOTS.filter(s=>s.quay==='minato')){
  assert.equal(blocked(s.x,s.z,.32),false,s.id+' clear');
  assert.equal(doors.find(d=>Math.hypot(d[0]-s.x,d[1]-s.z)<.85),undefined,s.id+' out of every doorway');
  assert.ok(nav.path({x:0,z:-20},{x:s.x,z:s.z}).length>0,s.id+' reachable from Main Street');
 }
});

const dayWith=name=>{for(let d=20000;d<20400;d++){const b=quayLedger(d).find(b=>b.name===name&&b.spot);if(b)return b;}return null;};
test('Jack walks out to his spot after his ramen, faces the harbour, and walks back to his day when the break ends',()=>{
 const profile=WORLD_CAST.find(p=>p.name==='Harbour master'),b=dayWith('Harbour master');
 const parent=new THREE.Group();parent.visible=false;const g=new THREE.Group();g.userData={name:profile.name,hit:{inside:false}};parent.add(g);
 const state={inventory:[],residentLocations:{}},person={g,profile};
 g.position.set(9,groundHeight(9,-36),-36);
 const system=createCastAI({world:{people:[person],homes:new Map()},player:new THREE.Vector3(100,0,100),state:()=>state,paused:()=>false,collides:blocked});
 let m=b.start-.01,on=0,left=false;
 // He is set down where his day has him on the first frame (schedules.js), and walks from there.
 system.update(.1,m,false);
 while(m<b.end+12){
  const before=g.position.clone();system.update(.1,m,false);m+=.1/60;
  if(g.visible)assert.ok(g.position.distanceTo(before)<.25,'walks, never jumps');
  if(g.visible)assert.equal(blocked(g.position.x,g.position.z,.2),false,'never inside anything');
  const claim=quayClaim('Harbour master',m),d=Math.hypot(g.position.x-b.spot.x,g.position.z-b.spot.z);
  if(claim&&d<.14&&g.userData.standPose){on++;assert.equal(g.userData.socialPose,b.spot.pose);}
  if(!claim&&on&&d>1.5){left=true;if(!g.userData.standPose)assert.equal(g.userData.socialPose,undefined,'the pose is put down on the way');}
 }
 assert.ok(on>50,'he stood on '+b.spot.id+' and took its pose');assert.ok(left,'and went back to his day');
});
test('Kōji takes his lunch on the quay and goes home to sleep after it',()=>{
 const b=dayWith('Kōji');
 const parent=new THREE.Group();parent.visible=false;
 const system=createNeighbours({parent,blocked,register(o){o.userData.hit={inside:false};}});
 const person=system.people.find(p=>p.spec.name==='Kōji');system.people.splice(0,system.people.length,person);
 const g=person.g;const start=canonicalDay('Kōji',b.start-1).target;g.position.set(start[0],groundHeight(...start),start[1]);person.initialised=true;
 let m=b.start-1,on=0,home=false;
 while(m<b.end+30){
  const before=g.position.clone();system.update(.1,m);m+=.1/60;
  assert.ok(g.position.distanceTo(before)<.2,'walks, never jumps');
  if(quayClaim('Kōji',m)&&Math.hypot(g.position.x-b.spot.x,g.position.z-b.spot.z)<.35&&g.userData.standPose)on++;
  if(!quayClaim('Kōji',m)&&g.userData.indoors==='home')home=true;
 }
 assert.ok(on>50,'on '+b.spot.id);assert.ok(home,'then home to sleep');
 setWalkSurface(surface);
});
