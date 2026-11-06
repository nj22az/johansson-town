import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';
import {renderedVehicleFootprint,vehicleHitsRect} from './vehicle-footprint.mjs';
import {KITANO_ROAD,KITANO_ROAD_LENGTH,KITANO_ROAD_LANDS,KITANO_SHORE,NAVIGATION_CLEARANCE,roadPoint,roadHeight,leftOf} from '../src/world/kitano-link-plan.js';
import {pathPose} from '../src/world/road-network.js';
import {FERRY,FERRY_BERTH} from '../src/world/ferry.js';

installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js?kitano-link');
const {createBusinesses}=await import('../src/world/businesses.js');
const {routeAt,groundHeight,BREAKWATER}=await import('../src/world/layout.js');
let player=new THREE.Vector3(-30,0,30);
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:false,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>player});
const traffic=world.traffic;
const fixed=world.colliders.filter(c=>c.id!=='parked-vehicle');

test('the retained mainland lane stays flat with gentle bends and no navigation bridge',()=>{
 let steepest=0;for(let s=0;s<KITANO_ROAD_LENGTH-1;s+=.5)steepest=Math.max(steepest,Math.abs(roadHeight(s+.5)-roadHeight(s))/.5);
 assert.ok(steepest<=.08,`steepest gradient ${(steepest*100).toFixed(1)} %`);
 // 30 km/h design speed: no bend on the through road tighter than 30 m.
 for(let s=1;s<KITANO_ROAD_LENGTH-1;s+=.5){const [ax,az,ahx,ahz]=roadPoint(s-1),[,,bhx,bhz]=roadPoint(s+1);const turn=Math.acos(Math.min(1,ahx*bhx+ahz*bhz));if(turn>1e-4)assert.ok(2/turn>=30,`bend at s=${s} has radius ${(2/turn).toFixed(1)} m`);}
 assert.equal(NAVIGATION_CLEARANCE,0);assert.equal(KITANO_SHORE.beachFoot,null);assert.equal(KITANO_SHORE.district,null);
 assert.ok(KITANO_ROAD_LENGTH<32&&roadPoint(KITANO_ROAD_LENGTH)[0]<33,'Road must end before the seawall');
});

test('you can walk the retained mainland lane but cannot cross the former airport bridge',()=>{
 const S=KITANO_ROAD.section;
 for(let s=.5;s<KITANO_ROAD_LENGTH-.5;s+=.5){
  const [x,z,hx,hz]=roadPoint(s),[lx,lz]=leftOf(hx,hz);
  for(const o of s>6?[S.footway-.6,0,-1.2]:[0,-1.2]){
   const px=x+lx*o,pz=z+lz*o,route=routeAt(px,pz,.3);
   assert.ok(route,`no ground at s=${s.toFixed(1)} offset ${o}`);
   assert.ok(!fixed.some(c=>circleHitsRect(px,pz,.3,c)&&c.height>groundHeight(px,pz)+.3),`something stands on the road at s=${s.toFixed(1)} o=${o}: `+fixed.filter(c=>circleHitsRect(px,pz,.3,c)).map(c=>c.id).join());
  }
  // Each step along the deck is one a person can take.
  const a=groundHeight(...roadPoint(s).slice(0,2)),b=groundHeight(...roadPoint(s+.5).slice(0,2));
  assert.ok(Math.abs(a-b)<.12,`a step of ${(b-a).toFixed(2)} m at s=${s.toFixed(1)}`);
 }
 // The open-water span has no invisible deck; the airport's own foundation remains.
 for(let x=65;x<80;x+=.5){const z=3.3+(x-24)*(-14.05/76);assert.equal(routeAt(x,z,.3),null,'Removed bridge still walkable at '+x+','+z);}
});

test('town and airport vehicle lanes support the full car body on actual ground, clear of solids',async()=>{
 const {ferryLanes}=await import('../src/world/town-traffic.js');
 const fixedRoad=world.colliders.filter(c=>!['parked-vehicle','ferry'].includes(c.id));
 const lanes=[...traffic.network.lanes.values()],body=renderedVehicleFootprint();
 for(const berth of ['town','airport']){world.ferry.parkAt(berth);const l=ferryLanes(world.ferry.ferry,0,berth);lanes.push(l.on,l.off);}
 for(const lane of lanes)for(let i=0;i<lane.pts.length;i++){
  const p=lane.pts[i],a=lane.pts[Math.max(0,i-1)],b=lane.pts[Math.min(lane.pts.length-1,i+1)],length=Math.hypot(b.x-a.x,b.z-a.z)||1,hx=(b.x-a.x)/length,hz=(b.z-a.z)/length;
  const hit=fixedRoad.find(c=>vehicleHitsRect(p.x,p.z,hx,hz,body,c));
  assert.ok(!hit,`Full rendered car body on ${lane.id} collides with ${hit?.id||'solid'} at ${p.x.toFixed(1)},${p.z.toFixed(1)}`);
  if(lane.id.includes('ferry'))continue; // The transformed deck and ramp supply these water-side surfaces.
  assert.ok(routeAt(p.x,p.z),`${lane.id} leaves the authored walking/driving ground`);
  assert.ok(Math.abs(p.y-groundHeight(p.x,p.z))<.2,`${lane.id} floats or sinks at ${p.x},${p.z}`);
 }
 assert.ok(![...traffic.network.lanes.keys()].some(id=>id.includes('bridge')));
 world.ferry.parkAt('town');
});

test('quay parking and turn paths have a drawn driving surface under the full car footprint',()=>{
 world.group.updateMatrixWorld(true);const surfaces=[];
 world.group.traverse(o=>{if(!o.isMesh||o.material?.transparent)return;for(let p=o;p;p=p.parent)if(p.userData.dynamicProp||p===world.ferry.ferry)return;surfaces.push({mesh:o,bounds:new THREE.Box3().setFromObject(o)});});
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),body=renderedVehicleFootprint();
 for(const lane of traffic.network.lanes.values())if(lane.id.startsWith('quay'))for(let i=0;i<lane.pts.length;i++){
  const p=lane.pts[i],a=lane.pts[Math.max(0,i-1)],b=lane.pts[Math.min(lane.pts.length-1,i+1)],len=Math.hypot(b.x-a.x,b.z-a.z)||1,hx=(b.x-a.x)/len,hz=(b.z-a.z)/len;
  for(const along of [-body.length/2+body.z,body.z,body.length/2+body.z])for(const across of [-body.width/2+body.x,body.width/2+body.x]){
   const x=p.x+hx*along-hz*across,z=p.z+hz*along+hx*across;
   const candidates=surfaces.filter(({bounds:b})=>x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z&&b.min.y<p.y+.15&&b.max.y>p.y-.08).map(o=>o.mesh);
   ray.set(new THREE.Vector3(x,p.y+.15,z),down);const floor=ray.intersectObjects(candidates,false).find(h=>Math.abs(h.point.y-p.y)<.08);
   assert.ok(floor,lane.id+' has no drawn support under the car at '+[x,z]);
  }
 }
});

test('the built town contains only owned runtime car models and no legacy truck colliders or scenery cars',()=>{
 const models=[];world.group.traverse(o=>{if(o.userData.vehicleStyle)models.push(o);assert.ok(!/Coastal Harbour Line bus|parked kei truck|parked car/.test(o.name),'No stationary scenery vehicle '+o.name);});
 // Five owned cars: Thao's, Mrs Sato's and Nhung's runs and the two islanders' (the newspaper car went with Reiko, phase 4).
 assert.equal(models.length,5);for(const g of models){assert.ok(g.userData.vehicleId&&g.userData.owner&&g.userData.driver&&g.userData.purpose);assert.ok(g.userData.dynamicProp);}
 assert.ok(!world.colliders.some(c=>c.id==='kei-truck'||c.id==='town-hall-parked-vehicle'));
 const parked=[...traffic.fleet,...traffic.islanders];
 for(const v of parked){assert.ok(v.owner&&v.purpose);assert.ok(routeAt(v.g.position.x,v.g.position.z));}
});

test('a car waits for you standing in the road, then drives on',()=>{
 const v=traffic.islanders[1];
 for(const other of traffic.traffic.vehicles)if(other!==v){other.g.visible=false;other.trip=null;}v.hold=false;
 const path=traffic.network.path(['main-north']);
 v.where='driving';traffic.traffic.drive(v,path,{onArrive(){}});
 const ahead=pathPose(path,30);player=new THREE.Vector3(ahead.x,0,ahead.z);
 for(let i=0;i<300;i++)traffic.traffic.update(.1);
 assert.ok(v.blocker==='player','waiting on '+(v.blocker?.kind||v.blocker));assert.ok(v.speed<.05);
 const gap=Math.hypot(v.g.position.x-player.x,v.g.position.z-player.z);
 assert.ok(gap>v.length/2+.4,'stopped '+gap.toFixed(2)+' m from you');
 player=new THREE.Vector3(-30,0,30);
 for(let i=0;i<300;i++)traffic.traffic.update(.1);
 assert.ok(!v.trip,'it carried on to the end of its trip');
});

test('the removed bridge leaves no piers, girders, causeway colliders or airport car park',()=>{
 assert.equal(world.kitanoLink.bridge,null);assert.deepEqual(world.kitanoLink.piers,[]);
 const names=[];world.kitanoLink.group.traverse(o=>names.push(o.name));
 assert.ok(!names.some(n=>/Bridge|girders|pier caps|causeway rock|Airport car park/.test(n)),names.join(','));
 assert.ok(!world.colliders.some(c=>/kitano-causeway/.test(c.id||'')));
});
test('open ferry water contains no unsupported legacy industrial silhouettes',()=>{
 world.group.updateMatrixWorld(true);const meshes=world.group.children.filter(o=>o.name.startsWith('harbour-instances:'));
 const ray=new THREE.Raycaster(new THREE.Vector3(),new THREE.Vector3(0,-1,0));
 for(const [x,z] of [[-31,-98],[32,-102],[-45,-111],[-24,-100],[20,-112],[-3,-114]]){ray.ray.origin.set(x,20,z);assert.equal(ray.intersectObjects(meshes,false).length,0,'Unsupported industrial geometry over ferry water at '+x+','+z);}
 ray.ray.origin.set(-27,20,BREAKWATER.z);assert.ok(ray.intersectObjects(meshes,false).length,'The actual breakwater and its supported beacons remain');
});
