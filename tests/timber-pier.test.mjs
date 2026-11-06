import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {timberPierPlan,buildTimberPier,unsupportedCorners,widestBoardGap,PIER_TIMBER,PILE_BANDS} from '../src/world/timber-pier.js';
import {FUJITA_PIER,SHED_PIER,SHED_WALKWAY,SHED_CIRCUIT,PORT_SHED} from '../src/world/fujita-layout.js';
import {HOUSEBOAT,houseboatSurface} from '../src/world/fujita-houseboat.js';
import {buildPortShed} from '../src/world/port-shed.js';
import {SEA_LEVEL} from '../src/world/ocean.js';
import {circleHitsRect} from '../physics.js';
installDOM();

const plan=timberPierPlan(FUJITA_PIER);

test('every deck of Mr Fujita’s pier stands on piles: no corner ends in mid-air',()=>{
 assert.deepEqual(unsupportedCorners(plan),[]);
 // The bents are under two metres apart along each deck, and every pile line has a pile in every bent.
 for(const d of plan.decks){
  const bents=[...d.bents].sort((a,b)=>a-b);
  for(let i=1;i<bents.length;i++)assert.ok(bents[i]-bents[i-1]<=PIER_TIMBER.pile.maxSpacing,`${d.id}: bents ${bents[i-1]} and ${bents[i]} too far apart`);
  assert.equal(d.piles.length,d.bents.length*d.pileX.length);
  for(const x of d.pileX)assert.ok(x>d.minX&&x<d.maxX,`${d.id}: pile line ${x} under the deck`);
 }
 // Piles go into the sea bed and up under the caps, through the water.
 assert.ok(plan.seabed<SEA_LEVEL-1&&plan.levels.pileTop>SEA_LEVEL,'piles stand in the water and show above it');
 assert.ok(PILE_BANDS.wet>SEA_LEVEL&&PILE_BANDS.weed<SEA_LEVEL,'the wet band straddles the waterline');
 // A deck that ends without piles is caught.
 const bare=timberPierPlan({...FUJITA_PIER,decks:[{...FUJITA_PIER.decks[1],bents:[-53.9,-55.65]}]});
 assert.ok(unsupportedCorners(bare).length>0,'a deck with its far corners unsupported fails');
});

test('one deck across the pier: boards at one pitch over its whole length, a dark sheet under every gap',()=>{
 // The walkway and the platform are one row of boards: no seam where they meet, no gap wider than a board joint.
 assert.ok(widestBoardGap(plan)<=PIER_TIMBER.board.gap+1e-6,'no joint wider than the board gap');
 const join=plan.boards.filter(b=>b.minZ<SHED_WALKWAY.minZ+.2&&b.maxZ>SHED_WALKWAY.minZ-.2);
 assert.ok(join.length>=2,'boards run across the join');
 // Every deck rectangle has its underlay: the sea is never what shows between two boards.
 const group=new THREE.Group(),pier=buildTimberPier(group,plan);group.updateMatrixWorld(true);
 const ray=new THREE.Raycaster();
 for(const b of plan.boards.slice(0,-1)){
  if(b.index%7)continue;
  const x=(b.minX+b.maxX)/2,z=b.maxZ+PIER_TIMBER.board.gap/2;
  ray.set(new THREE.Vector3(x,plan.top+1,z),new THREE.Vector3(0,-1,0));
  const hit=ray.intersectObjects([pier.frame,pier.under],false)[0];
  assert.ok(hit&&hit.point.y>SEA_LEVEL+.3,`the joint at z ${z.toFixed(2)} shows the frame, not the sea`);
 }
 // The boards stop round the shed's own floor, so the two never share a top face.
 const S=FUJITA_PIER.cutouts[0];
 assert.ok(!plan.boards.some(b=>b.maxX>S.minX+1e-6&&b.minX<S.maxX-1e-6&&b.maxZ>S.minZ&&b.minZ<S.maxZ),'no board under the shed floor');
});

test('the berth: fender piles take the Shiosai’s side, the pier stays clear of her hull, her lines are made fast',()=>{
 // Her hull reaches x −38.81; the pier's edge and its caps stop short of it, the fenders' rubber meets it.
 assert.ok(SHED_PIER.minX-PIER_TIMBER.cap.overhang>-38.81+.1,'the frame clears her hull');
 for(const f of plan.fenders){
  const face=f.x-PIER_TIMBER.fender.radius-PIER_TIMBER.fender.rubber;
  assert.ok(Math.abs(face-(-38.81))<.02,`fender at z ${f.z} meets her side`);
  assert.ok(f.z<HOUSEBOAT.gangway.minZ||f.z>HOUSEBOAT.gangway.maxZ,'no fender in the gangway');
 }
 assert.ok(plan.cleats.some(c=>c.line==='stern line')&&plan.bollards.some(b=>b.line==='head line'));
 // The gangway still joins her deck to the pier's.
 for(let x=HOUSEBOAT.gangway.minX+.25;x<HOUSEBOAT.gangway.maxX-.2;x+=.1)assert.ok(houseboatSurface(x,-54.2,.2));
});

test('rails, kerbs and the bollard leave the walks round the shed and to the gangway open',()=>{
 const colliders=[],shed=buildPortShed({parent:new THREE.Group(),colliders,register(){},onAction(){}});
 try{
  const pier=colliders.filter(c=>c.timberPier==='fujita-pier');
  assert.ok(pier.length>=5,'rails and bollard are solid');
  // The circuit round the shed, at the masterplan's radius.
  for(let i=1;i<SHED_CIRCUIT.length;i++){const [ax,az]=SHED_CIRCUIT[i-1],[bx,bz]=SHED_CIRCUIT[i];
   for(let t=0;t<=1;t+=.02){const x=ax+(bx-ax)*t,z=az+(bz-az)*t;assert.ok(!pier.some(c=>circleHitsRect(x,z,.32,c)),`circuit clear at ${x.toFixed(2)},${z.toFixed(2)}`);}}
  // The walkway's centre line from the quay to the platform.
  for(let z=SHED_WALKWAY.maxZ;z>SHED_PIER.minZ+.5;z-=.1)assert.ok(!pier.some(c=>circleHitsRect(-37.35,z,.32,c)),`walkway clear at ${z.toFixed(2)}`);
  // Nothing of the pier stands on the circuit's kerb-side or in the shed's open end.
  for(const z of [PORT_SHED.z+1.8+.6,PORT_SHED.z+1.8-.4])assert.ok(!pier.some(c=>circleHitsRect(PORT_SHED.x-.55,z,.25,c)));
 }finally{shed.dispose();}
});
