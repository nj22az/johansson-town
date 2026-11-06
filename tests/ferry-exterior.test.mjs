// The Minato Maru's exterior faults found by the CAD survey (docs/minato-maru/exterior, Rev A, 3 November 2026), kept fixed.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
const {buildFerryModel,FERRY_HULL}=await import('../src/world/ferry-model.js');
const {FERRY_MOORING,FERRY_MOORINGS}=await import('../src/world/ferry.js');
const {AIRPORT_FERRY_PORTS}=await import('../src/world/airport-ferry.js');
const {MINATO_BERTH}=await import('../src/world/minato-berth.js');
const {SEA_LEVEL}=await import('../src/world/ocean.js');

/** She is posed at her berth as the run poses her: on her waterline at rest, the ramp raised or laid on the landing. */
const LANDING={town:MINATO_BERTH.landing.top,airport:AIRPORT_FERRY_PORTS.airport.height};
function atBerth(berth,rampDown){
 const f=buildFerryModel(),P=AIRPORT_FERRY_PORTS[berth];f.rotation.order='YXZ';
 f.position.set(P.berth[0],SEA_LEVEL+FERRY_HULL.origin,P.berth[1]);f.rotation.y=P.yaw;f.updateMatrixWorld(true);
 if(rampDown)f.userData.restRamp(LANDING[berth]);f.updateMatrixWorld(true);return f;
}
const shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
/** The faces a laid line passes through between its bitt, its fairlead and the pier's bitt, except within 0.25 m of her
 * bitt and her fairlead, where the rope is round the bitt or in the fairlead's hole. */
function pierced(f,l){
 const pts=[FERRY_MOORING.bitts[l.bitt],FERRY_MOORING.fairleads[l.lead]].map(p=>f.localToWorld(new THREE.Vector3(...p))).concat(new THREE.Vector3(...l.pier));
 const ray=new THREE.Raycaster(),hits=[];
 for(let s=0;s<2;s++){const a=pts[s],d=pts[s+1].clone().sub(a),L=d.length();ray.set(a,d.normalize());ray.near=0;ray.far=L-.15;
  for(const h of ray.intersectObject(f,true))if(h.object.isMesh&&shown(h.object)&&pts.slice(0,2).every(p=>p.distanceTo(h.point)>.25))hits.push(`${h.object.name} at ${f.worldToLocal(h.point.clone()).toArray().map(n=>n.toFixed(2)).join(', ')}`);}
 return hits;
}

test('no mooring line laid at either berth passes through her (docs/minato-maru/exterior, problem 1)',()=>{
 for(const berth of ['town','airport'])for(const down of [false,true]){
  const f=atBerth(berth,down);
  for(const l of FERRY_MOORINGS[berth])assert.deepEqual(pierced(f,l),[],`${berth}, ramp ${down?'laid':'raised'}: the ${l.name} passes through her`);
 }
});

test('at Kitano-jima she makes fast from both bows, each to the bitts on its own side; the stern ropes stay aboard',()=>{
 const f=atBerth('airport',true);
 for(const l of FERRY_MOORINGS.airport){
  assert.ok(['fwd','fwdS'].includes(l.station),l.name+' is worked from a bow station');
  const pier=f.worldToLocal(new THREE.Vector3(...l.pier)),lead=FERRY_MOORING.fairleads[l.lead];
  assert.equal(Math.sign(pier.x),Math.sign(lead[0]),l.name+' stays on its own side of the ramp');
  assert.ok(pier.z>lead[2],l.name+' leads ahead, to the pier off her bow');
 }
 const ropes=FERRY_MOORINGS.airport.map(l=>l.rope);assert.equal(new Set(ropes).size,ropes.length,'one rope a line');
 assert.ok(ropes.every(r=>FERRY_MOORING.ropes[r].station===FERRY_MOORINGS.airport.find(l=>l.rope===r).station),'each rope is worked at the station it is coiled on');
});

test('every station keeps its own coiled ropes, on its own deck and clear of its windlass',()=>{
 const f=buildFerryModel();f.updateMatrixWorld(true);
 for(const berth of ['town','airport'])for(const l of FERRY_MOORINGS[berth])assert.equal(FERRY_MOORING.ropes[l.rope].station,l.station,`${berth}: ${l.name} uses a rope of its own station`);
 for(const r of FERRY_MOORING.ropes.filter(r=>r.station!=='aft')){
  // The windlass drum lies athwartships at shipyard z 32.4 (ferry-model.js), radius 0.26; a coil is 0.25 m across its outer ring.
  const drumZ=32.4-FERRY_HULL.length/2;assert.ok(Math.abs(r.coil[2]-drumZ)>.26+.25,r.name+' coil clear of the windlass drum');
 }
});

test('the name board’s two names never meet, in any font a device may use (problem 2)',async()=>{
 const {nameBoardLayout,NAME_BOARD}=await import('../src/world/ferry-boards.js');
 // Widths per em: Helvetica Bold (an iPad's sans-serif), a wide fallback, and the CJK em square for the Japanese.
 for(const [en,jp] of [[.6686,1],[.75,1.05],[.55,.95]]){
  const L=nameBoardLayout(256,512,(s,size,font)=>[...s].length*size*(font===NAME_BOARD.jpFont?jp:en));
  assert.ok(L.en.x-(L.jp.x+L.jp.width)>=20,'at least 20 px between the names');
  assert.ok(L.jp.x>=256+NAME_BOARD.margin-1e-9&&L.en.x+L.en.width<=256+512-NAME_BOARD.margin+1e-9,'both inside the border margin');
 }
});

test('the lane boards’ truck sign sits in its own lane, clear of both dividers (problem 3)',async()=>{
 const {laneBoardLayout}=await import('../src/world/ferry-boards.js');
 const G=laneBoardLayout(),[a,b]=G.truckSpan;
 assert.ok(a>G.dividers[0][1]+12&&b<G.dividers[1][0]-12,'the truck is 12 px or more inside its lane');
 assert.ok(Math.abs((a+b)/2-G.lanes[1])<12,'the truck is centred under its arrow');
 for(const [i,d] of G.dividers.entries())assert.ok(Math.abs((d[0]+d[1])/2-(G.lanes[i]+G.lanes[i+1])/2)<1e-9,'each divider is midway between its lanes');
 assert.ok(G.truck.box[1]>G.truckArrowFoot,'the arrow ends above the truck');
});

test('laid on its landing at either berth, no part of the ramp is below the landing (problem 4)',()=>{
 const v=new THREE.Vector3();
 for(const berth of ['town','airport']){
  const f=atBerth(berth,true),ramp=f.userData.ramp;let low=Infinity,at=null;
  ramp.traverse(o=>{if(!o.isMesh)return;const pos=o.geometry.attributes.position;for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(o.matrixWorld);if(v.y<low){low=v.y;at=v.clone();}}});
  assert.ok(low>=LANDING[berth]-.002,`${berth}: the ramp reaches ${(LANDING[berth]-low).toFixed(3)} m below its landing at ${f.worldToLocal(at).toArray().map(n=>n.toFixed(2))}`);
 }
 // And over the bare stone of the Kitano-jima pier, under the leaf, where the landing height is the cargo court's asphalt.
});
