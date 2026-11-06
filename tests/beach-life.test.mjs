import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildBeachLife,createCrab,crabGround,CRAB_ZONE,CRAB_WARY,CRAB_HIDE,FISH_WATERS} from '../src/world/beach-life.js';
import {BEACH,BEACH_DRY_EDGE_X,beachHeight,gradedHeight} from '../src/world/beach-layout.js';
import {waveHeight,SEA_LEVEL,WAVE_REACH} from '../src/world/ocean.js';

const seeded=(s=7)=>()=>(s=s*1103515245+12345&0x7fffffff)/0x7fffffff;

test('crabs live on the sand the player can walk on, clear of the ramps, and stay on it',()=>{
 assert.ok(CRAB_ZONE.minX>Math.max(...BEACH.accesses.map(a=>a.toX)),'Crabs on the access ramps');
 assert.ok(CRAB_ZONE.maxX<=BEACH_DRY_EDGE_X,'Crabs out in the sea');
 assert.ok(beachHeight(CRAB_ZONE.maxX,0)>SEA_LEVEL+WAVE_REACH,'The swell washes over the crabs');
 assert.ok(CRAB_ZONE.maxX-CRAB_ZONE.minX>3,'No room on the sand for crabs');
 const life=buildBeachLife({parent:new THREE.Group(),random:seeded()});
 const player={x:40,z:-10};
 for(let i=0;i<1200;i++){player.z=-30+i*.04;life.tick(1/30,player,i/30);}
 for(const c of life.crabs){
  assert.ok(c.x>=CRAB_ZONE.minX&&c.x<=CRAB_ZONE.maxX&&c.z>=CRAB_ZONE.minZ&&c.z<=CRAB_ZONE.maxZ,'A crab left the beach at '+[c.x,c.z]);
  // On the sand as the player walks it, which is graded up where paths cross onto it (BEACH_GRADES).
  assert.ok(beachHeight(c.x,c.z)!=null&&Math.abs(crabGround(c.x,c.z)-gradedHeight(c.x,c.z,beachHeight(c.x,c.z)))<1e-9);
 }
 assert.equal(life.crabMesh.count,life.crabs.length,'The crabs are one instanced draw');
 // The section renderer batches anything static where it first stood, and culls a
 // moving thing by its group's position: so the crabs are dynamic and grouped on the beach.
 let group=life.crabMesh.parent;assert.ok(group.userData.dynamicProp,'The crabs would be frozen in the town batch');
 assert.ok(group.position.x>CRAB_ZONE.minX&&group.position.x<CRAB_ZONE.maxX,'The crabs are culled from somewhere else');
 group=life.fish[0].mesh.parent;assert.ok(group.userData.dynamicProp&&group.position.x>=FISH_WATERS.minX,'The fish are culled from the shore');
 // And the drawn crab stands where the crab is.
 const m=new THREE.Matrix4(),v=new THREE.Vector3();life.crabMesh.getMatrixAt(0,m);v.setFromMatrixPosition(m).add(life.crabMesh.parent.position);
 assert.ok(Math.hypot(v.x-life.crabs[0].x,v.z-life.crabs[0].z)<1e-4,'The crab is drawn away from where it is');
});

test('a crab scuttles sideways, runs from you and digs in when you get close',()=>{
 const crab=createCrab(40,0,seeded(3));
 for(let i=0;i<300&&crab.mode!=='walk';i++)crab.update(1/30,null);
 assert.equal(crab.mode,'walk');
 // Its body faces across the way it is going.
 const heading=Math.atan2(crab.tx-crab.x,crab.tz-crab.z),across=Math.abs(Math.cos(heading-crab.yaw));
 assert.ok(across<1e-6,'The crab walks forwards');
 const wary=createCrab(40,0,seeded(4)),player={x:40-CRAB_WARY+.5,z:0};
 wary.update(1/30,player);assert.equal(wary.mode,'flee');
 for(let i=0;i<20;i++)wary.update(1/30,player);
 assert.ok(wary.x>40,'It ran towards you rather than away');
 const shy=createCrab(40,0,seeded(5));shy.update(1/30,{x:40,z:CRAB_HIDE-.3});
 assert.equal(shy.mode,'hidden');
 for(let i=0;i<60*20;i++)shy.update(1/30,{x:40,z:.5});
 assert.equal(shy.mode,'hidden','It came up under your feet');
 for(let i=0;i<60*20;i++)shy.update(1/30,{x:10,z:0});
 assert.notEqual(shy.mode,'hidden','It never came up again');
});

test('fish leap well offshore and every leap leaves rings on the water',()=>{
 const life=buildBeachLife({parent:new THREE.Group(),random:seeded(11)});
 let leaps=0,seen=0,maxRise=0;
 for(let i=0;i<30*60;i++){
  const t=i/30;life.tick(1/30,null,t);
  for(const f of life.fish)if(f.mesh.visible){
   seen++;
   assert.ok(f.world.x>BEACH.profile.at(-1)[0]+8,'A fish jumped out of the shallows');
   maxRise=Math.max(maxRise,f.world.y-waveHeight(f.world.x,f.world.z,t));
  }
  leaps=Math.max(leaps,life.rings.filter(r=>r.mesh.visible).length);
 }
 assert.ok(seen>0,'No fish jumped in a minute');
 assert.ok(maxRise>.3&&maxRise<1.2,'The leaps are not fish-sized: '+maxRise);
 assert.ok(leaps>0,'No splash rings');
 assert.ok(FISH_WATERS.minX>BEACH.profile.at(-1)[0]);
 // The helper follows the same sea the shader draws.
 for(const [x,z,t] of [[60,0,0],[80,-30,12.5]])assert.ok(Math.abs(waveHeight(x,z,t)-SEA_LEVEL)<.25);
});
