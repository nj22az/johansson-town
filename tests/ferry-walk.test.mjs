import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createFerryRun} from '../src/world/ferry.js';
import {createFerryWalk,FERRY_FLOORS,FERRY_STEP} from '../src/world/ferry-walk.js';
import {FERRY_DECKS,FERRY_CASINGS,GATE,FERRY_HULL,GANGWAY_LENGTH} from '../src/world/ferry-model.js';
import {groundHeight} from '../src/world/layout.js';
import {townBoundsBlocked} from '../physics.js';
import {ferryServiceFixture} from './ferry-service-fixture.mjs';

const R=.28,HALF=FERRY_HULL.length/2;
/** The Minato Maru lying at a berth, still (no heave), her walk worked out. */
function alongside(berth='town'){
 const parent=new THREE.Group(),colliders=[];
 const run=createFerryRun({parent,colliders});run.parkAt(berth);run.update(1/60,600,0);
 const walk=createFerryWalk(run);walk.update();
 return {run,walk,colliders};
}
/** Her frame to the world: a point on her (x, z) at the height of a floor. */
const world=(run,x,y,z)=>new THREE.Vector3(x,y,z).applyMatrix4(run.ferry.matrixWorld);
/**
 * A person walking from `from` through `points` (world x, z), in small steps, the way game.js moves the player: a step
 * onto her floors goes by her walk; a step anywhere else by the shore (inside the town's bounds, within a step of the
 * ground, clear of the hull alongside).
 */
function stroll(walk,colliders,from,points){
 let x=from[0],z=from[1],y=from[2]??groundHeight(x,z);const trail=[];
 for(const [tx,tz] of points){
  for(let i=0;i<4000&&Math.hypot(tx-x,tz-z)>.02;i++){
   const d=Math.hypot(tx-x,tz-z),s=Math.min(.05,d),nx=x+(tx-x)/d*s,nz=z+(tz-z)/d*s;
   const m=walk.move(x,y,z,nx,nz,R);
   if(m){if(!m.ok)return {x,y,z,stopped:m.floor.id,trail};x=nx;z=nz;y=m.y;trail.push([x,y,z,m.floor.id]);continue;}
   const g=groundHeight(nx,nz),hull=colliders.find(c=>c.id==='ferry');
   const inHull=hull&&Math.abs(nx-hull.x)<hull.w/2+R&&Math.abs(nz-hull.z)<hull.d/2+R&&!walk.aboard(x,y,z);
   if(townBoundsBlocked(nx,nz,R)||Math.abs(g-y)>FERRY_STEP||inHull)return {x,y,z,stopped:'shore',trail};
   x=nx;z=nz;y=g;trail.push([x,y,z,'shore']);
  }
 }
 return {x,y,z,stopped:null,trail};
}

test('alongside at Minato: up the gangway from the pier, through the gate, the passage and the foyer, out of the stair door onto the car deck',()=>{
 const {run,walk,colliders}=alongside();
 const g=run.ferry.userData.gangway;g.updateMatrixWorld(true);
 const gw=(x,z)=>new THREE.Vector3(x,.03,z).applyMatrix4(g.matrixWorld);
 const onPier=gw(GANGWAY_LENGTH+.6,0),top=gw(.2,0),passage=world(run,3.6,FERRY_DECKS.car.y,GATE.z),foyer=world(run,3.4,FERRY_DECKS.car.y,GATE.z-1.6),door=world(run,2.4,FERRY_DECKS.car.y,GATE.z-2.3),lane=world(run,1.4,FERRY_DECKS.car.y,GATE.z-3);
 const r=stroll(walk,colliders,[onPier.x,onPier.z],[[top.x,top.z],[passage.x,passage.z],[foyer.x,foyer.z],[door.x,door.z],[lane.x,lane.z]]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' '+[r.x,r.y,r.z].map(n=>n.toFixed(2)));
 const ids=[...new Set(r.trail.map(t=>t[3]))];
 assert.deepEqual(ids,['shore','gangway','car-deck'],'pier, gangway, deck: '+ids);
 // Never a jump in height: every step is a step.
 for(let i=1;i<r.trail.length;i++)assert.ok(Math.abs(r.trail[i][1]-r.trail[i-1][1])<.08,'no jump at step '+i+' ('+r.trail[i-1][3]+' to '+r.trail[i][3]+')');
 assert.ok(Math.abs(r.y-run.ferry.userData.deckY-run.ferry.position.y)<.06,'on the car deck');
});

test('her bulwark, her casings and the gangway\'s rails keep you aboard',()=>{
 const {run,walk,colliders}=alongside();const car=FERRY_DECKS.car.y;
 const start=world(run,0,car,0),y=start.y;
 for(const [x,z] of [[HB_OUT(),0],[-HB_OUT(),0],[0,-HALF-.5]]){const to=world(run,x,car,z);const r=stroll(walk,colliders,[start.x,start.z,y],[[to.x,to.z]]);
  assert.notEqual(r.stopped,null,'stopped short of the water toward '+x+','+z);
  const p=new THREE.Vector3(r.x,r.y,r.z).applyMatrix4(run.ferry.matrixWorld.clone().invert());assert.ok(Math.abs(p.x)<4.2&&p.z>-HALF,'still aboard');}
 // Into the starboard casing: stopped at its face.
 {const to=world(run,-3.8,car,-5);const r=stroll(walk,colliders,[start.x,start.z,y],[[to.x,to.z]]);assert.equal(r.stopped,'car-deck');}
 // Off the side of the gangway: the rails.
 {const g=run.ferry.userData.gangway;const a=new THREE.Vector3(1,.03,0).applyMatrix4(g.matrixWorld),b=new THREE.Vector3(1,.03,1.5).applyMatrix4(g.matrixWorld);
  const r=stroll(walk,colliders,[a.x,a.z,a.y],[[b.x,b.z]]);assert.equal(r.stopped,'gangway');}
});
const HB_OUT=()=>FERRY_HULL.beam/2+1;

test('down the bow ramp onto the quay\'s landing plate, and back up',()=>{
 const {run,walk,colliders}=alongside();const car=FERRY_DECKS.car.y;
 const deck=world(run,0,car,HALF-6),quay=world(run,0,car,HALF+7.5);
 const r=stroll(walk,colliders,[deck.x,deck.z,deck.y],[[quay.x,quay.z]]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' '+[r.x,r.y,r.z].map(n=>n.toFixed(2)));
 assert.deepEqual([...new Set(r.trail.map(t=>t[3]))],['car-deck','ramp','flap','shore']);
 const back=stroll(walk,colliders,[r.x,r.z,r.y],[[deck.x,deck.z]]);
 assert.equal(back.stopped,null,'back aboard');
 for(let i=1;i<r.trail.length;i++)assert.ok(Math.abs(r.trail[i][1]-r.trail[i-1][1])<.12,'no jump at step '+i+': '+r.trail[i-1][3]+' to '+r.trail[i][3]);
});

test('under way her decks are still walked (he sails aboard), but the gangway and the ramp are in: no way on or off',()=>{
 // Her 08:45 sailing (world/ferry-timetable.js), with him aboard, clear of both boarding openings.
 const service=ferryServiceFixture({minute:8*60+41.9}),{run,walk,world:{colliders}}=service;
 service.player.position.copy(world(run,0,FERRY_DECKS.car.y,0));
 assert.equal(service.aboard(),true);
 service.until(()=>!!run.operation);assert.equal(run.operation.destination,'airport');
 // Reach the open sea through the actual crew, plant and mooring procedure.
 // Moving the hull directly would skip the very access closure this test checks.
 service.until(()=>run.operation?.stage==='passage'&&run.crossingProgress>=.5);walk.update();
 const p=world(run,0,FERRY_DECKS.car.y,0);
 assert.ok(walk.floorAt(p.x,p.z,p.y),'her car deck is a floor at sea');
 assert.ok(!walk.partOpen('gangway')&&!walk.partOpen('ramp'),'no gangway, no ramp at sea');
 // Off her side at the gate: the bulwark is open there, the gangway is not out, and the sea is no floor.
 const gate=world(run,4.0,FERRY_DECKS.car.y,GATE.z),off=world(run,5.5,FERRY_DECKS.car.y,GATE.z);
 const r=stroll(walk,colliders,[gate.x,gate.z,gate.y],[[off.x,off.z]]);assert.notEqual(r.stopped,null,'stopped at the gate, not into the sea');
 service.until(()=>run.operation?.stage==='alongside');walk.update();
 assert.equal(run.berth,'airport','the same physical voyage reaches Kitano');
 const q=world(run,0,FERRY_DECKS.car.y,0);assert.ok(walk.floorAt(q.x,q.z,q.y),'alongside again');
});

test('at Kitano-jima: up the ramp from the pier',()=>{
 const {run,walk,colliders}=alongside('airport');const car=FERRY_DECKS.car.y;
 const deck=world(run,0,car,HALF-6),flap=run.ferry.userData.flap;flap.updateMatrixWorld(true);
 const shore=new THREE.Vector3(0,.05,2.8).applyMatrix4(flap.matrixWorld);
 const up=stroll(walk,colliders,[shore.x,shore.z,groundHeight(shore.x,shore.z)],[[deck.x,deck.z]]);
 assert.equal(up.stopped,null,'stopped at '+up.stopped+' '+[up.x,up.y,up.z].map(n=>n.toFixed(2)));
 assert.equal(up.trail.at(-1)[3],'car-deck');
});

test('every floor lies where the model draws it',()=>{
 const {run,walk}=alongside();const ray=new THREE.Raycaster(),meshes=[];
 run.ferry.traverse(o=>{if(o.isMesh&&o.visible!==false&&!/windows|markings/.test(o.name))meshes.push(o);});
 const parts={ship:run.ferry,ramp:run.ferry.userData.ramp,flap:run.ferry.userData.flap,gangway:run.ferry.userData.gangway};
 for(const f of FERRY_FLOORS){const m=parts[f.part].matrixWorld,sloped=Array.isArray(f.y);
  // A ladder is open between its treads: only that its treads are where its floor is.
  const ladder=/ladder/.test(f.id);
  for(const fx of [.25,.5,.75])for(const fz of [.25,.5,.75]){
   const lx=f.x[0]+(f.x[1]-f.x[0])*fx,lz=f.z[0]+(f.z[1]-f.z[0])*fz;if(f.inside&&!f.inside(lx,lz,.3))continue;
   const y=sloped?f.y[0]+(f.y[1]-f.y[0])*fz:f.y;
   const p=new THREE.Vector3(lx,y,lz).applyMatrix4(m);
   // Where something stands on the floor (an engine, a bunk), the walk stops you at it: not a place to stand.
   if(walk.blocked(p.x,p.y,p.z,.02))continue;
   ray.set(new THREE.Vector3(p.x,p.y+.5,p.z),new THREE.Vector3(0,-1,0));ray.far=1;
   const hit=ray.intersectObjects(meshes,true).find(h=>h.object.visible);
   if(ladder&&!hit)continue;
   assert.ok(hit,f.id+' has a surface at '+lx.toFixed(2)+','+lz.toFixed(2));
   // A stair's walking line runs over the nosings of its treads: within half a riser of them.
   assert.ok(Math.abs(hit.point.y-p.y)<(sloped?.2:.04),`${f.id}: the drawn surface ${(hit.point.y-p.y).toFixed(3)} m off at ${lx.toFixed(2)},${lz.toFixed(2)} (${hit.object.name})`);
  }}
});

test('up stair P to the lobby, through the carpet room and the saloon, out and up the ladder to the wheelhouse',()=>{
 const {run,walk,colliders}=alongside();const Zs=zy=>zy-HALF,car=FERRY_DECKS.car.y;
 const W=(x,zy)=>{const p=world(run,x,car,Zs(zy));return [p.x,p.z];};
 const start=world(run,2.65,car,Zs(11.8));
 const r=stroll(walk,colliders,[start.x,start.z,start.y],[W(3.63,11.8),W(3.63,7.0),W(1,7.0),W(0,9),W(0,10.5),W(0,12.5),W(0,16),W(0,17),W(3.0,17.05),W(3.75,17.05),W(3.75,17.65),W(3.75,19.95),W(3.0,20.0),W(2.0,20.0),W(0,20.9)]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' '+[r.x,r.y,r.z].map(n=>n.toFixed(2))+' local '+walk.local('ship',r.x,r.y,r.z).map(n=>n.toFixed(2)));
 const ids=[...new Set(r.trail.map(t=>t[3]))];
 for(const id of ['stair-p','lobby','corridor','carpet-room','saloon','walkway-p','wing-ladder-p','wing-p','wheelhouse'])assert.ok(ids.includes(id),id+' in '+ids);
 for(let i=1;i<r.trail.length;i++)assert.ok(Math.abs(r.trail[i][1]-r.trail[i-1][1])<.16,'no jump at step '+i+' ('+r.trail[i-1][3]+' to '+r.trail[i][3]+')');
 // And back down the same way to the car deck.
 const back=stroll(walk,colliders,[r.x,r.z,r.y],[W(2.0,20.0),W(3.0,20.0),W(3.75,19.95),W(3.75,17.65),W(3.75,17.05),W(3.0,17.05),W(0,17),W(0,12.5),W(0,10.5),W(0,9),W(1,7.0),W(3.63,7.0),W(3.63,11.8),W(2.65,11.8)]);
 assert.equal(back.stopped,null,'back: stopped at '+back.stopped+' local '+walk.local('ship',back.x,back.y,back.z).map(n=>n.toFixed(2)));
 assert.ok(Math.abs(back.y-start.y)<.02,'on the car deck again');
});

test('the crew stair: from the saloon\u2019s cross passage through the crew door, up into the wheelhouse and out of the starboard wing door, and back (FERRY_CREW_STAIR)',()=>{
 const {run,walk,colliders}=alongside();const Zs=zy=>zy-HALF,pass=FERRY_DECKS.upper.y;
 const W=(x,zy)=>{const p=world(run,x,pass,Zs(zy));return [p.x,p.z];};
 const start=world(run,0,pass,Zs(17.0));
 const r=stroll(walk,colliders,[start.x,start.z,start.y],[W(-2.52,17.1),W(-2.52,17.7),W(-2.52,20.6),W(-2.6,20.85),W(-3.6,20.85),W(-3.6,21.6)]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' local '+walk.local('ship',r.x,r.y,r.z).map(n=>n.toFixed(2)));
 const ids=[...new Set(r.trail.map(t=>t[3]))];
 for(const id of ['saloon','crew-stair-door','crew-stair','wheelhouse','wing-door-s','wing-s'])assert.ok(ids.includes(id),id+' in '+ids);
 for(let i=1;i<r.trail.length;i++)assert.ok(Math.abs(r.trail[i][1]-r.trail[i-1][1])<.16,'no jump at step '+i+' ('+r.trail[i-1][3]+' to '+r.trail[i][3]+')');
 assert.ok(Math.abs(walk.local('ship',r.x,r.y,r.z)[1]-FERRY_DECKS.bridge.y)<.02,'on the bridge deck');
 const back=stroll(walk,colliders,[r.x,r.z,r.y],[W(-3.6,20.85),W(-2.6,20.85),W(-2.52,20.6),W(-2.52,17.7),W(-2.52,17.1),W(0,17.0)]);
 assert.equal(back.stopped,null,'back: stopped at '+back.stopped+' local '+walk.local('ship',back.x,back.y,back.z).map(n=>n.toFixed(2)));
 assert.ok(Math.abs(back.y-start.y)<.02,'in the saloon again');
 // Nobody steps into the well from the wheelhouse, nor walks through the trunk from the saloon's seats or the master's cabin.
 const at=(x,y,zy)=>world(run,x,y,Zs(zy));
 for(const [what,a,b] of [['wheelhouse into the stair well',at(-1.6,FERRY_DECKS.bridge.y,19.9),at(-2.6,FERRY_DECKS.bridge.y,19.9)],
  ['master\u2019s cabin into the trunk',at(-1.7,FERRY_DECKS.bridge.y,18.6),at(-2.6,FERRY_DECKS.bridge.y,18.6)],
  ['saloon aisle through the trunk wall',at(-.1,pass,19.0),at(-2.6,pass,19.0)]]){
  const s=stroll(walk,colliders,[a.x,a.z,walk.floorBelow(a.x,a.z,a.y+.1)?.y??a.y],[[b.x,b.z]]);assert.notEqual(s.stopped,null,what);}
});

test('from the lobby out onto the open deck and up a ladder to the bridge deck\'s aft platform',()=>{
 const {run,walk,colliders}=alongside();const Zs=zy=>zy-HALF,pass=FERRY_DECKS.upper.y;
 const W=(x,zy)=>{const p=world(run,x,pass,Zs(zy));return [p.x,p.z];};
 const start=world(run,0,pass,Zs(7.0));
 const r=stroll(walk,colliders,[start.x,start.z,start.y],[W(0,5.5),W(0,3.2),W(1.15,3.2),W(1.15,5.3),W(0,5.5)]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' local '+walk.local('ship',r.x,r.y,r.z).map(n=>n.toFixed(2)));
 const ids=[...new Set(r.trail.map(t=>t[3]))];
 for(const id of ['lobby','open-deck','platform-ladder-p','bridge-deck-aft'])assert.ok(ids.includes(id),id+' in '+ids);
});

test('the walls keep you in: no walking through the house\'s side, into the toilets, over the stair well, or off the wing',()=>{
 const {run,walk,colliders}=alongside();const Zs=zy=>zy-HALF;
 const at=(x,y,zy)=>world(run,x,y,Zs(zy));
 const tries=[
  ['saloon to the walkway through the wall',at(2.8,FERRY_DECKS.upper.y,19),at(3.9,FERRY_DECKS.upper.y,19)],
  ['lobby into the men’s toilet',at(1.4,FERRY_DECKS.upper.y,9),at(1.4,FERRY_DECKS.upper.y,10.5)],
  ['lobby into the stair well',at(2.5,FERRY_DECKS.upper.y,8.5),at(3.6,FERRY_DECKS.upper.y,8.5)],
  ['off the wing\'s aft edge onto the ledge',at(3.3,FERRY_DECKS.bridge.y,20.2),at(3.3,FERRY_DECKS.bridge.y,18.8)],
  ['through the wheelhouse\'s front',at(0,FERRY_DECKS.bridge.y,21),at(0,FERRY_DECKS.bridge.y,23.5)],
 ];
 for(const [what,a,b] of tries){const r=stroll(walk,colliders,[a.x,a.z,a.y],[[b.x,b.z]]);assert.notEqual(r.stopped,null,what);}
});

test('down into the engine room: the casing P door, the ladder through the car deck, round the engines to the control booth',()=>{
 const {run,walk,colliders}=alongside();const Zs=zy=>zy-HALF,car=FERRY_DECKS.car.y;
 const W=(x,zy)=>{const p=world(run,x,car,Zs(zy));return [p.x,p.z];};
 const start=world(run,2.3,car,Zs(5.85));
 const r=stroll(walk,colliders,[start.x,start.z,start.y],[W(3.575,5.85),W(3.575,8.65),W(3.575,9.6),W(3.1,9.65),W(2.9,10.5),W(2.9,13.0),W(2.9,13.68),W(0,13.68),W(0,10.0),W(0,13.68),W(-2.85,13.68),W(-2.85,11.3),W(-2.95,11.2),W(-2.95,10.6),W(-2.8,10.55)]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' local '+walk.local('ship',r.x,r.y,r.z).map(n=>n.toFixed(2)));
 const ids=[...new Set(r.trail.map(t=>t[3]))];
 for(const id of ['er-entrance','er-ladder','engine-room','control-booth'])assert.ok(ids.includes(id),id+' in '+ids);
 for(let i=1;i<r.trail.length;i++)assert.ok(Math.abs(r.trail[i][1]-r.trail[i-1][1])<.16,'no jump at step '+i+' ('+r.trail[i-1][3]+' to '+r.trail[i][3]+')');
 // And back up to the car deck.
 const back=stroll(walk,colliders,[r.x,r.z,r.y],[W(-2.95,10.6),W(-2.95,11.2),W(-2.85,11.3),W(-2.85,13.68),W(2.9,13.68),W(2.9,10.5),W(3.1,9.65),W(3.575,9.6),W(3.575,8.65),W(3.575,5.85),W(2.3,5.85)]);
 assert.equal(back.stopped,null,'back: stopped at '+back.stopped+' local '+walk.local('ship',back.x,back.y,back.z).map(n=>n.toFixed(2)));
 assert.ok(Math.abs(back.y-start.y)<.02,'on the car deck again');
 // Nobody walks through an engine, nor from the car deck down through the deck anywhere but the hatch.
 const e=world(run,0,FERRY_DECKS.car.y-2.1,Zs(10.8));const into=world(run,1.6,FERRY_DECKS.car.y-2.1,Zs(10.8));
 assert.notEqual(stroll(walk,colliders,[e.x,e.z,walk.floorBelow(e.x,e.z,e.y+.1).y],[[into.x,into.z]]).stopped,null,'the port main engine');
});

test('the crew house: in from the bridge deck\'s aft platform, along the corridor, into a cabin, the mess and the wheelhouse',()=>{
 const {run,walk,colliders}=alongside();const Zs=zy=>zy-HALF,br=FERRY_DECKS.bridge.y;
 const W=(x,zy)=>{const p=world(run,x,br,Zs(zy));return [p.x,p.z];};
 const start=world(run,0,br,Zs(5.5));
 const r=stroll(walk,colliders,[start.x,start.z,start.y],[W(0,6.6),W(0,12.05),W(1.6,12.05),W(0,12.05),W(0,14.55),W(1.0,14.55),W(0,14.55),W(0,20.5)]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' local '+walk.local('ship',r.x,r.y,r.z).map(n=>n.toFixed(2)));
 const ids=[...new Set(r.trail.map(t=>t[3]))];
 for(const id of ['bridge-deck-aft','crew-corridor','deckhand-cabin','mess','wheelhouse'])assert.ok(ids.includes(id),id+' in '+ids);
 // The emergency-generator room from the platform.
 const g=stroll(walk,colliders,[start.x,start.z,start.y],[W(1.6,5.6),W(1.6,6.5)]);
 assert.equal(g.stopped,null,'into the EG room: '+g.stopped);assert.ok(g.trail.some(t=>t[3]==='eg-room'));
});

test('below: from the engine room through the watertight door to the aux room, through the door at Fr 38 to the workshop and round the partition into the store (6q-1)',()=>{
 const {run,walk,colliders}=alongside();const FP=.9-1.9,Z=z=>z-HALF;
 const start=world(run,0,FP,Z(12.5)),aux=world(run,0,FP,Z(17)),manifold=world(run,-3.0,FP,Z(15.4)),door38=world(run,0,FP,Z(19.3)),bench=world(run,1.5,FP,Z(21.2)),store=world(run,-2.4,FP,Z(21.3)),gap=world(run,-1.2,FP,Z(19.7)),inside=world(run,0,FP,Z(19.8));
 // The relocated generators occupy the old diagonal across the auxiliary room.
 // Use its clear aft cross-passage and outer aisle, rather than walking through a machine.
 const cross=world(run,0,FP,Z(16.55)),outer=world(run,-2.9,FP,Z(16.55));
 const r=stroll(walk,colliders,[start.x,start.z,start.y],[[aux.x,aux.z],[cross.x,cross.z],[outer.x,outer.z],[manifold.x,manifold.z],[outer.x,outer.z],[cross.x,cross.z],[aux.x,aux.z],[door38.x,door38.z],[inside.x,inside.z],[bench.x,bench.z],[inside.x,inside.z],[gap.x,gap.z],[store.x,store.z]]);
 assert.equal(r.stopped,null,'stopped at '+r.stopped+' '+[r.x,r.y,r.z].map(n=>n.toFixed(2)));
 const ids=[...new Set(r.trail.map(t=>t[3]))];assert.deepEqual(ids,['engine-room','aux-room','workshop'],ids.join(','));
 for(let i=1;i<r.trail.length;i++)assert.ok(Math.abs(r.trail[i][1]-r.trail[i-1][1])<.05,'level plates throughout');
 // The bulkheads stop you everywhere but at their doors; the partition stops you between the workshop and the store.
 for(const [x,z] of [[2.0,Z(14.5)],[-2.0,Z(19.5)]]){const from=world(run,x,FP,z-1),to=world(run,x,FP,z+.5);const q=stroll(walk,colliders,[from.x,from.z,from.y],[[to.x,to.z]]);assert.notEqual(q.stopped,null,'through the bulkhead at '+x+','+z);}
 {const from=world(run,1.0,FP,Z(21.0)),to=world(run,-1.0,FP,Z(21.0));const q=stroll(walk,colliders,[from.x,from.z,from.y],[[to.x,to.z]]);assert.notEqual(q.stopped,null,'through the partition');}
});

