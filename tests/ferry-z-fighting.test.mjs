// No flashing surfaces aboard the Minato Maru (the owner, 3 November 2026: "there is lots of z-fighting in the whole
// ferry, have you audited interiors and the bridge"). The town's scan (tests/no-z-fighting.test.mjs) leaves her out: she
// is a dynamic prop, placed by the clock. This scans her as buildFerryModel() builds her, every room, the bridge, the
// casings, the car deck, the ramp and the boards: two faces that look the same way, lie within 2 mm of one plane and
// overlap are drawn at one depth, and the depth buffer picks a different winner from frame to frame. Each piece of a
// merged mesh is named by the line that made it (__KIT_TRACE__), so a finding says where to fix it.
//
// The audit found 72 such pairs (12.2 m²): the lane boards' faces in their bodies' planes, door leaves hooked back
// through fire-hose boxes, the purser's counter and the drink machines standing out over the stair wells, a stair rail
// running up inside the lobby's wall, every wall opening's reveal in its frame's plane, the wings' floor closing over
// the crew stair's well, curtains, the crossing chart's layers, the ramp's hinge pin in its girders' faces, and others.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();globalThis.self=globalThis;
globalThis.__KIT_TRACE__=true;
const {buildFerryModel,FERRY_DECKS}=await import('../src/world/ferry-model.js');
const {FERRY_INTERIOR,FERRY_HOUSE,FERRY_CREW_STAIR,FERRY_STAIRS}=await import('../src/world/ferry-interior.js');
const {FERRY_HEIGHTS,FERRY_SHIP}=await import('../src/world/ferry-ship.js');
/** A deck's height in her model: FERRY_HEIGHTS are above the keel, the model's origin is on her waterline. */
const deck=k=>FERRY_HEIGHTS[k]-FERRY_SHIP.draft;
const {coplanarOverlaps}=await import('../tools/z-fighting.mjs');
const ferry=buildFerryModel();
delete globalThis.__KIT_TRACE__;
const scene=new THREE.Scene();scene.add(ferry);scene.updateMatrixWorld(true);
const where=f=>`${f.a} | ${f.b}: ${f.area.toFixed(4)} m² at ${f.centre.map(v=>v.toFixed(2)).join(', ')} facing ${f.normal.join(', ')}`;

/**
 * The one pair left, on purpose: the navigation lantern's stand-in (ferry-bridge-lantern.js) until its GLB streams in,
 * which it does as soon as anyone comes within 12 m. Its cable gland's end cap, 15 cm², lies in the plane of the
 * mounting foot's underside, out on the starboard wing and facing the deck. The plan is generated with the GLB
 * (tools/blender/build-minato-navigation-feeder.py), so it is fixed there, not here.
 */
const standIn=f=>/Navigation feeder fallback/.test(f.a)&&/Navigation feeder fallback/.test(f.b)&&f.area<.002;

test('no two faces aboard share a plane (2 mm) over more than 4 cm²: rooms, bridge, casings, car deck, ramp and boards',()=>{
 const found=coplanarOverlaps(scene,{tolerance:.002,minArea:.0004,ground:-99});
 assert.deepEqual(found.filter(f=>!standIn(f)).map(where),[]);
});

test('seen from the quay: no two faces within 5 mm of one plane over 0.01 m², outside the wheelhouse',()=>{
 // 5 mm is what a phone's 24-bit depth buffer, with the game's 0.15 m near plane, still tells apart at about 110 m: the
 // car deck's plating over the machinery spaces (5 mm under the deck) and the lane lamps (5 mm off their hoods) flashed
 // from the quay. In the wheelhouse no one stands more than 6 m from anything, so a 2 mm gap is ample there.
 const WH=FERRY_DECKS.wheelhouse,B=deck('bridgeDeck');
 const inWheelhouse=f=>{const [x,y,z]=f.centre;return Math.abs(x)<=WH.width/2&&y>=B&&y<=FERRY_HOUSE.houseTop+.2&&z>=WH.aft-.1&&z<=WH.fore+.1;};
 const found=coplanarOverlaps(scene,{tolerance:.005,minArea:.01,ground:-99});
 assert.deepEqual(found.filter(f=>!inWheelhouse(f)).map(where),[]);
});

test('the crew stair’s well is open to the wheelhouse: nothing of hers over the flight below head height',()=>{
 // Her wings' floor and its deck paint ran across the wheelhouse over the well, so the flight climbed into a ceiling.
 const CS=FERRY_CREW_STAIR,B=deck('bridgeDeck'),P=deck('passengerDeck'),ray=new THREE.Raycaster();
 const meshes=[];ferry.traverse(o=>{if(o.isMesh&&o.visible)meshes.push(o);});
 const dz=(CS.head-CS.foot)/CS.risers,dy=(B-P)/CS.risers;
 for(let i=4;i<CS.risers-1;i++){
  const z=CS.foot+(i+.5)*dz,tread=P+(i+1)*dy;
  if(z<=CS.well[0]+.05||z>=CS.well[1]-.05)continue;
  for(const x of [CS.x[0]+.2,(CS.x[0]+CS.x[1])/2,CS.x[1]-.2]){
   ray.set(new THREE.Vector3(x,tread+.05,z),new THREE.Vector3(0,1,0));ray.far=Math.max(2.0,B+.5-tread);
   const hit=ray.intersectObjects(meshes,false)[0];
   assert.ok(!hit,`over step ${i+1} at x ${x.toFixed(2)}: ${hit&&(hit.object.name||hit.object.parent?.name)} ${hit&&hit.distance.toFixed(2)} m above the tread`);
  }
 }
});

test('the stairs’ stringers run under their treads: none shows through a step',()=>{
 // On the line of the treads' inner corners, each step of stair P, stair S and the crew stair had a dark stub of
 // stringer standing up at its back (seen in docs/qa/minato-maru-accommodation-2026-11-03, the crew stair from its foot).
 const C=deck('carDeck'),P=deck('passengerDeck'),B=deck('bridgeDeck');
 const flights=[
  {name:'stair P',x:FERRY_STAIRS.x,foot:[C,FERRY_STAIRS.foot],head:[P,FERRY_STAIRS.head],n:FERRY_STAIRS.risers},
  {name:'stair S',x:FERRY_STAIRS.x.map(v=>-v),foot:[C,FERRY_STAIRS.foot],head:[P,FERRY_STAIRS.head],n:FERRY_STAIRS.risers},
  {name:'the crew stair',x:FERRY_CREW_STAIR.x,foot:[P,FERRY_CREW_STAIR.foot],head:[B,FERRY_CREW_STAIR.head],n:FERRY_CREW_STAIR.risers},
 ];
 for(const F of flights){
  const [x0,x1]=[Math.min(...F.x),Math.max(...F.x)],[y0,z0]=F.foot,[y1,z1]=F.head;
  const lo=Math.min(z0,z1)-.3,hi=Math.max(z0,z1)+.3;
  const stringers=FERRY_INTERIOR.bars.filter(b=>b.r>=.04&&b.cls==='metal'&&[b.a,b.b].every(p=>p[0]>x0&&p[0]<x1&&p[2]>=lo&&p[2]<=hi&&p[1]>=y0-.2&&p[1]<=y1+.2));
  assert.equal(stringers.length,2,F.name+' has two stringers');
  for(const b of stringers){
   const dy=b.b[1]-b.a[1],dz=b.b[2]-b.a[2],len=Math.hypot(dy,dz);
   for(let i=1;i<F.n;i++){
    const y=y0+(y1-y0)*i/F.n,z=z0+(z1-z0)*i/F.n;   // the inner corner behind step i
    const gap=((z-b.a[2])*dy-(y-b.a[1])*dz)/len*Math.sign(dz)*-1;   // its height above the stringer's axis, square to it
    assert.ok(Math.abs(gap)>=b.r+.005&&y>b.a[1]+(z-b.a[2])*dy/dz,`${F.name}: the stringer at x ${b.a[0].toFixed(2)} is ${(Math.abs(gap)-b.r).toFixed(3)} m under step ${i}'s corner`);
   }
  }
 }
});
