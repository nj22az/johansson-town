import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {STAFF_BENCH} from '../src/world/staff-bench.js';
import {circleHitsRect} from '../physics.js?snappy=1';

/** Thuan, her town, and a clock that can be wound. */
async function afternoon(){
 installDOM();globalThis.self=globalThis;
 
 const {createTown}=await import('../src/world/town.js?staff-break');
 const {createBusinesses}=await import('../src/world/businesses.js');
 const {createCastAI}=await import('../src/people/schedules.js');
 const {RESIDENTS}=await import('../src/people/residents.js');
 const scene=new THREE.Scene();
 const built=createTown({scene,sites:createBusinesses().filter(s=>['market','frontrow'].includes(s.id)),
  mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
 const collides=(x,z,r=.32)=>built.colliders.some(c=>circleHitsRect(x,z,r,c));
 const profile=RESIDENTS.find(p=>p.name==='Thuan'),g=new THREE.Group();
 g.userData={name:'Thuan',visualReady:true};g.position.set(profile.work[0],0,profile.work[1]);scene.add(g);
 const player=new THREE.Group();player.position.set(0,0,-30);
 // staffBench is what hands her break to the bench routine; without it she walks to
 // the yard and stands there, which is not a break.
 const world={people:[{g,profile}],homes:new Map(),bus:built.bus,busStation:built.busStation,
  staffBench:built.staffBench};
 const ai=createCastAI({world,player,state:()=>({inventory:[],residentLocations:{}}),
  paused:()=>false,collides,getObserverPosition:()=>player.position});
 const run=(from,to,observe=()=>{})=>{for(let m=from;m<to;m+=1/60){const before=g.position.clone(),yaw=g.rotation.y;ai.update(1/60,m,false);observe(before,yaw);}};
 return {g,collides,run};
}

test('Thuan takes her break and comes back from it',async()=>{
 const {g,collides,run}=await afternoon();
 // Out of the shop, round the back, and onto the bench.
 run(838,880);
 assert.equal(g.userData.napping,true,'She never got to the bench');
 assert.equal(g.userData.socialPose,'Sleep','She is on the bench but not asleep on it');
 assert.ok(Math.hypot(g.position.x-STAFF_BENCH.seat[0],g.position.z-STAFF_BENCH.seat[1])<.1,'She is asleep somewhere other than the seat');

 // The break ends. Sitting on a bench means sitting inside its collider, and a walker
 // that refuses to step into one cannot step out of one either -- so she stayed in the
 // bench and played out the rest of her day from inside it. Standing up has to leave
 // her somewhere she can actually stand.
 run(880,900);
 assert.equal(g.userData.napping,undefined,'The break never ended');
 assert.equal(collides(g.position.x,g.position.z,.3),false,'She stood up still inside the bench');

 // And she goes somewhere with the rest of her afternoon.
 const left=g.position.clone();
 run(900,940);
 assert.ok(g.position.distanceTo(left)>8,'She got up but never walked away from the bench');
 assert.equal(g.userData.indoors,'market','She never made it back behind her own counter');
});

test('nobody put inside a collider is stuck there for good',async()=>{
 const {g,collides,run}=await afternoon();
 // Her break is over and she is walking to the park. Drop her into the middle of the
 // bench -- which is what a bad save or a prop that moved under her does -- and she
 // has to be able to walk out of it. Nothing about the break can help her here: she
 // stood up three minutes ago.
 run(838,900);
 assert.equal(g.userData.napping,undefined,'She is still on her break');
 g.position.set(STAFF_BENCH.x,0,STAFF_BENCH.z);
 g.rotation.y=0;
 assert.equal(collides(g.position.x,g.position.z,.3),true,'The bench stopped being solid');
 run(900,904,(before,yaw)=>{
  const dx=g.position.x-before.x,dz=g.position.z-before.z,distance=Math.hypot(dx,dz);
  const turn=Math.abs(Math.atan2(Math.sin(g.rotation.y-yaw),Math.cos(g.rotation.y-yaw)));
  assert.ok(turn<=2.6/60+1e-8,'Recovery turns without snapping');
  if(distance>.0001)assert.ok((-Math.sin(g.rotation.y)*dx-Math.cos(g.rotation.y)*dz)/distance>.93,'Recovery walks forwards');
 });
 assert.equal(collides(g.position.x,g.position.z,.3),false,'She cannot get out of something she is standing in');
});
