import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {createIslandBusinesses} from '../src/world/businesses.js';
import {TAMA_SPOTS,TAMA_DAY,TAMA_ROUTES,TAMA_GAIT,tamaSpotAt,buildTama} from '../src/world/tama.js';
installDOM();

// Tama, the cat from the quay (the owner, 27 November 2026: "I think you can make the cat"): her day has a reason at every
// place, her places and ways are on the open quay (overhead things, the auction's roof and sign, stand above her), and she walks without sliding, popping or turning on the spot.
test('her day: a place for every minute, each with its reason, and a way between each place and the next',()=>{
 for(let m=0;m<1440;m++)assert.ok(TAMA_SPOTS[tamaSpotAt(m)],`a place at minute ${m}`);
 for(const [id,s] of Object.entries(TAMA_SPOTS))assert.ok(s.why?.length>40,`${id} has its reason`);
 TAMA_DAY.forEach((d,i)=>{const next=TAMA_DAY[(i+1)%TAMA_DAY.length].spot,route=TAMA_ROUTES[`${d.spot}>${next}`];
  assert.ok(route,`a way from ${d.spot} to ${next}`);
  assert.deepEqual(route[0],[TAMA_SPOTS[d.spot].x,TAMA_SPOTS[d.spot].z]);assert.deepEqual(route.at(-1),[TAMA_SPOTS[next].x,TAMA_SPOTS[next].z]);});
});

test('her places and her ways keep clear of everything standing on the quay',()=>{
 const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,shadows:false,register(){},enter(){},onAction(){}});
 const clear=(x,z)=>Math.min(...world.colliders.filter(c=>Number.isFinite(c.x)&&Number.isFinite(c.w)&&!((c.minY??0)>.4)).map(c=>Math.hypot(Math.max(0,Math.abs(x-c.x)-c.w/2),Math.max(0,Math.abs(z-c.z)-c.d/2))));
 for(const [id,s] of Object.entries(TAMA_SPOTS))assert.ok(clear(s.x,s.z)>=.3,`${id}: ${clear(s.x,s.z).toFixed(2)} m clear`);
 for(const [id,pts] of Object.entries(TAMA_ROUTES))for(let i=0;i<pts.length-1;i++){const [ax,az]=pts[i],[bx,bz]=pts[i+1],n=Math.ceil(Math.hypot(bx-ax,bz-az)/.05);
  for(let k=0;k<=n;k++){const x=ax+(bx-ax)*k/n,z=az+(bz-az)*k/n;assert.ok(clear(x,z)>=.25,`${id} at ${x.toFixed(2)}, ${z.toFixed(2)}: ${clear(x,z).toFixed(2)} m`);}}
 assert.ok(world.tama,'the town has her');
});

test('she walks from place to place at a walk, her paws reaching the quay, nothing jumping a frame',()=>{
 const tama=buildTama({group:new THREE.Group()});tama.tick(0,0,9*60+29.5);
 const leg=l=>({rx:l.pivot.rotation.x,s:l.pivot.scale.y});
 let prev=null,steps=0,walked=0;
 for(let f=0;f<60*75;f++){const t=f/60,s=tama.tick(1/60,t,9*60+29.5+t/60);
  const now={x:s.x,z:s.z,yaw:s.yaw,legs:tama.cat.legs.map(leg),tail:tama.cat.tail.map(l=>l.rotation.y)};
  if(prev){const d=Math.hypot(now.x-prev.x,now.z-prev.z);walked+=d;
   assert.ok(d<=TAMA_GAIT.speed/60+1e-6,`frame ${f}: ${(d*1000).toFixed(1)} mm`);
   assert.ok(Math.abs(now.yaw-prev.yaw)<=TAMA_GAIT.turn/60+1e-6,`frame ${f}: turned ${now.yaw-prev.yaw}`);
   now.legs.forEach((l,i)=>{assert.ok(Math.abs(l.rx-prev.legs[i].rx)<.12,`frame ${f} leg ${i}: ${l.rx-prev.legs[i].rx}`);assert.ok(Math.abs(l.s-prev.legs[i].s)<.06,`frame ${f} leg ${i} length`);});
   now.tail.forEach((r,i)=>assert.ok(Math.abs(r-prev.tail[i])<.1,`frame ${f} tail ${i}`));
   if(s.mode==='walk')steps++;}
  prev=now;}
 assert.ok(steps>60*10&&walked>5,`she walked (${walked.toFixed(1)} m)`);
 assert.equal(tama.state.spot,'sun');
});
