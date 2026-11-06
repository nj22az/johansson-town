import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';
import {QUAY_DRESSING,quayDressingSolids,MAIN_QUAY_FACE} from '../src/world/quay-dressing.js';
import {MINATO_BERTH,QUAY_FISHING_BOAT} from '../src/world/minato-berth.js';
import {OPENINGS} from '../src/world/openings.js';
import {routeAt,OUTER_PIER} from '../src/world/layout.js';

installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');
const {createIslandBusinesses}=await import('../src/world/businesses.js');
const world=createTown({scene:new THREE.Scene(),sites:createIslandBusinesses(),mobile:true,kitano:'distant',shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const solids=quayDressingSolids(),ids=new Set(solids.map(s=>s.id));
const others=world.colliders.filter(c=>!ids.has(c.id));

test('everything has its reason and stands on the quay behind the kerb, on the kerb or on the pier, off the ramp landing',()=>{
 const D=QUAY_DRESSING;
 for(const item of [...D.tyres,...D.staging.pallets,D.staging.truck,D.staging.sign,D.fuel])assert.ok(item.why,'every item says why it is there');
 const L=MINATO_BERTH.landing;
 for(const s of solids){
  assert.ok(world.colliders.some(c=>c.id===s.id),`${s.id} is solid in the town`);
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=s.x+dx*s.w/2,z=s.z+dz*s.d/2;
   assert.ok(routeAt(x,z),`${s.id} stands on walkable quay at ${x.toFixed(2)},${z.toFixed(2)}`);
   if(s.outerPier)assert.ok(Math.abs(x)<=OUTER_PIER.width/2&&z<=-50,`${s.id} is on the pier's deck`);
   else if(s.kerb)assert.ok(z>=-49.555&&z<=-49.005,`${s.id} is on the kerb`);
   else assert.ok(z>-49.005,`${s.id} is behind the kerb`);
   assert.ok(!(x>L.minX&&x<L.maxX&&z>L.minZ&&z<L.maxZ),`${s.id} is off the ferry ramp's landing`);}
  // Nothing of the dressing stands in a building, a lamp or another solid.
  for(const c of others)if(!(c.minY>1.9))assert.ok(!circleHitsRect(s.x,s.z,0,{...c,w:c.w+s.w,d:c.d+s.d}),`${s.id} overlaps ${c.id||'a solid'} at ${c.x},${c.z}`);
 }
});

test('the quay stays open: its walk, the pier mouth and every docks opening keep their room',()=>{
 // Along the quay's middle, the full width of the harbour, and down to the pier's root.
 for(let x=-17;x<=17;x+=.25)assert.ok(!solids.some(s=>circleHitsRect(x,-44,.4,s)),`quay walk clear at x ${x}`);
 for(let z=-44;z>=-49.6;z-=.2)for(const x of [-3,0,3])assert.ok(!solids.some(s=>circleHitsRect(x,z,.4,s)),`pier mouth clear at ${x},${z.toFixed(1)}`);
 // Along the quay edge where the walks round the port building and the auction shed run (architecture-plan.js).
 for(let x=2.2;x<=19.3;x+=.25)assert.ok(!solids.some(s=>circleHitsRect(x,-48,.95,s)),`the port building's and auction shed's walk along the quay edge at ${x}`);
 // Down the pier's middle past the staging bay, and along the cargo boat's bitts' side of it.
 for(let z=-50;z>=-60;z-=.2)assert.ok(!solids.some(s=>circleHitsRect(0,z,.6,s)),`pier walk clear at ${z.toFixed(1)}`);
 for(const o of OPENINGS.filter(o=>o.docks))assert.ok(!solids.some(s=>circleHitsRect(o.stand[0],o.stand[1],.5,s)),`opening ${o.id} keeps its stand clear`);
});

test('tyres hang on the face where boats lie, below the coping, the fishing boat on two of them',()=>{
 for(const t of QUAY_DRESSING.tyres){assert.ok(t.face<=MAIN_QUAY_FACE+.03);assert.ok(Math.abs(t.x-(-7))>2.5||t.face!==MAIN_QUAY_FACE,'none where the ferry ramp lands');}
 const QB=QUAY_FISHING_BOAT,under=QUAY_DRESSING.tyres.filter(t=>t.face===MAIN_QUAY_FACE&&t.x>QB.x-QB.length/2&&t.x<QB.x+QB.length/2);
 assert.equal(under.length,2,'she lies on two tyres');
 // Her side stays off the tyres' faces: no part of her hull inside them.
 assert.ok(QB.z+QB.beam/2<MAIN_QUAY_FACE-.2+.03,'her beam leaves room for the tyre');
});
