import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {townBoundsBlocked,standingHitsRect,circleHitsRect,canStepBetween} from '../physics.js';
import {groundHeight} from '../src/world/layout.js';
import {createNavigation} from '../src/people/navmesh.js';
import {KITAHAMA,KITAHAMA_LANES,KITAHAMA_HEIGHTS,plotGate} from '../src/world/kitahama-layout.js';
import {ARCHITECTURE_ROUTES} from '../src/world/architecture-plan.js';
import {CLEARED_LOTS,LOT_PROPS,PLOT_PLANTING,clearedLot} from '../src/world/okinawa/lots.js';
import {NISHI} from '../src/world/okinawa/layout.js';
import {YARD_HOMES} from '../src/world/yard-homes-layout.js';
import {OPENINGS} from '../src/world/openings.js';
import {SIGN_JAPANESE} from '../src/world/okinawa/signs.js';

/**
 * The cleared lots' dressing (okinawa/lots.js CLEARED_LOTS `dressing`, drawn by okinawa/lot-dressing.js): every lot says
 * what it is now, for whom and why; every solid it puts down is inside its lot and carries exactly the collider the data
 * gives; nothing stands on a walking circuit, a lane, a door's approach or an opening's stand mark; and every dressed lot
 * can be walked into from Main Street with the player's own radius, step and standing height.
 */
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js');const {createBusinesses}=await import('../src/world/businesses.js');
const prompts=[],sites=createBusinesses();
const world=createTown({scene:new THREE.Scene(),sites,mobile:true,shadows:false,register:(object,label)=>prompts.push({object,label}),enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
world.group.updateMatrixWorld(true);
const inside=(r,x,z,pad=0)=>x>=r.minX-pad&&x<=r.maxX+pad&&z>=r.minZ-pad&&z<=r.maxZ+pad;
const overlap=(a,b)=>a.minX<b.maxX&&b.minX<a.maxX&&a.minZ<b.maxZ&&b.minZ<a.maxZ;
const lotColliders=world.colliders.filter(c=>/^lot-/.test(c.id||''));
const dressingSolid=c=>/^lot-/.test(c.id||'')||(c.id==='vending'&&LOT_PROPS.some(p=>p.builtBy==='vending'&&inside(p.rect,c.x,c.z)));
const mine=world.colliders.filter(dressingSolid);
const blockedByDressing=(x,z,r=.3)=>mine.find(c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
const bins=new Map(),cell=4;
for(const c of world.colliders){const reach=Math.hypot(c.w,c.d)/2+.5;for(let x=Math.floor((c.x-reach)/cell);x<=Math.floor((c.x+reach)/cell);x++)for(let z=Math.floor((c.z-reach)/cell);z<=Math.floor((c.z+reach)/cell);z++){const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(c);}}
const nearby=(x,z)=>bins.get(Math.floor(x/cell)+','+Math.floor(z/cell))||[];
const playerBlocked=(x,z,r)=>townBoundsBlocked(x,z,r)||nearby(x,z).some(c=>standingHitsRect(x,z,r,groundHeight(x,z),c));

test('every cleared lot says what it is now, for whom and why, and every solid on it is inside it',()=>{
 assert.equal(CLEARED_LOTS.length,15);
 for(const lot of CLEARED_LOTS){
  const d=lot.dressing;assert.ok(d,lot.id+' has its dressing');assert.notEqual(d,'deferred');
  assert.ok(['dressed','part','open by design'].includes(d.status),lot.id+' says what it is');
  if(d.status==='part'){assert.equal(clearedLot(d.partOf)?.dressing.status,'dressed',lot.id+' is part of a dressed lot');assert.ok(d.what.length>5);
   assert.ok(inside(clearedLot(d.partOf).rect,lot.rect.minX,lot.rect.minZ)&&inside(clearedLot(d.partOf).rect,lot.rect.maxX,lot.rect.maxZ),lot.id+' lies in '+d.partOf);continue;}
  assert.ok(d.name&&d.for&&d.ground&&d.why.length>60,lot.id+' names who it is for and why');
  if(d.status==='open by design'){assert.equal(d.props.length,0,lot.id+' is left open, so nothing stands on it');continue;}
  assert.ok(d.props.length>0&&d.hours&&d.stories.length>=2,lot.id+' is used, by the clock, and opens stories');
  for(const p of d.props){
   assert.ok(p.what&&p.why&&Number.isFinite(p.height)&&p.height>0,lot.id+'/'+p.id+' says what it is and why it is there');
   assert.ok(inside(lot.rect,p.rect.minX,p.rect.minZ,.001)&&inside(lot.rect,p.rect.maxX,p.rect.maxZ,.001),lot.id+'/'+p.id+' stands inside its lot');
  }
  for(const f of d.flat){const pad=f.meets?.6:.001;assert.ok(inside(lot.rect,f.rect.minX,f.rect.minZ,pad)&&inside(lot.rect,f.rect.maxX,f.rect.maxZ,pad)&&f.why,lot.id+'/'+f.id+' is laid inside its lot, or up to what it meets');}
  // No two solids of a lot overlap: each stands on its own ground.
  for(const [i,a] of d.props.entries())for(const b of d.props.slice(i+1))assert.ok(!overlap(a.rect,b.rect),`${lot.id}: ${a.id} and ${b.id} overlap`);
  for(const s of d.signs){assert.ok(/[぀-ヿ一-鿿]/.test(s.says)&&s.english,lot.id+' sign '+s.name+' is Japanese with its English');assert.ok(world.group.getObjectByName(s.name),s.name+' is drawn');}
  for(const label of d.prompts)assert.ok(prompts.some(p=>p.label===label),lot.id+': the prompt “'+label+'” is there');
 }
 // No Minato lot is left a bare lawn or bare sand where a house stood: only the lawn before the school gate is open, and why.
 assert.deepEqual(CLEARED_LOTS.filter(l=>l.dressing.status==='open by design').map(l=>l.id),['rainflower-lot','kitano-3-lot']);
 for(const t of ['Monthly parking','Kitahama youth association','Beware of habu'])assert.match(SIGN_JAPANESE[t],/[぀-ヿ一-鿿]/);
});

test('every solid the dressing puts down carries exactly the collider its data gives',()=>{
 for(const p of LOT_PROPS){
  const [x,z]=[(p.rect.minX+p.rect.maxX)/2,(p.rect.minZ+p.rect.maxZ)/2],w=p.rect.maxX-p.rect.minX,d=p.rect.maxZ-p.rect.minZ;
  const c=world.colliders.find(c=>c.id===p.collider&&Math.abs(c.x-x)<.01&&Math.abs(c.z-z)<.01);
  assert.ok(c,p.lot+'/'+p.id+' has its collider');
  assert.ok(Math.abs(c.w-w)<.011&&Math.abs(c.d-d)<.011,p.lot+'/'+p.id+' collider is the rectangle the data gives');
  if(!p.builtBy)assert.ok(Math.abs(c.height-p.height)<1e-6,p.lot+'/'+p.id+' collider is as high as the prop');
 }
 assert.equal(lotColliders.length,LOT_PROPS.filter(p=>!p.builtBy).length,'no lot collider without its data');
});

test('nothing on a lot stands on a walking circuit, a lane, a door’s approach or an opening',()=>{
 const faults=[];
 // The authored routes (the building circuits, the Nishi lanes and the seawall walk, the Kitahama lanes, the footways):
 // the centreline and both edges, a walker's radius in from each.
 for(const r of ARCHITECTURE_ROUTES)for(let i=1;i<r.points.length;i++){
  const [ax,az]=r.points[i-1],[bx,bz]=r.points[i],len=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(len/.25)),nx=-(bz-az)/(len||1),nz=(bx-ax)/(len||1);
  for(let k=0;k<=n;k++)for(const off of [0,-(r.width/2-.35),r.width/2-.35]){
   const x=ax+(bx-ax)*k/n+nx*Math.max(0,off),z=az+(bz-az)*k/n+nz*Math.max(0,off),x2=ax+(bx-ax)*k/n+nx*Math.min(0,off),z2=az+(bz-az)*k/n+nz*Math.min(0,off);
   for(const [px,pz] of [[x,z],[x2,z2]]){const c=blockedByDressing(px,pz);if(c)faults.push(`${r.id} at ${px.toFixed(2)},${pz.toFixed(2)}: ${c.id}`);}
  }
 }
 for(const L of KITAHAMA_LANES)for(let x=L.minX+.3;x<=L.maxX-.3;x+=.25)for(let z=L.minZ+.3;z<=L.maxZ-.3;z+=.25){const c=blockedByDressing(x,z);if(c)faults.push(`lane at ${x.toFixed(2)},${z.toFixed(2)}: ${c.id}`);}
 for(const l of NISHI.lanes)for(let x=NISHI.promenade.maxX;x<=-24.9;x+=.25)for(const z of [l.z-l.half+.3,l.z,l.z+l.half-.3]){const c=blockedByDressing(x,z);if(c)faults.push(`Nishi lane ${l.z} at ${x.toFixed(2)}: ${c.id}`);}
 // Every door's approach: a metre and a half out from each door the town has, clear of the dressing.
 const doors=[...KITAHAMA.plots.map(p=>plotGate(p).door),...KITAHAMA_HEIGHTS.houses.map(h=>[h.door[0],h.door[2]]),...Object.values(YARD_HOMES).map(h=>h.door),
  ...sites.filter(s=>Array.isArray(s.door)).map(s=>[s.door[0],s.door[2]])];
 for(const [dx,dz] of doors)for(let a=0;a<Math.PI*2;a+=Math.PI/8)for(const r of [0,.6,1.2]){const c=blockedByDressing(dx+Math.cos(a)*r,dz+Math.sin(a)*r,.25);if(c&&Math.hypot(dx-c.x,dz-c.z)<4)faults.push(`door ${dx.toFixed(1)},${dz.toFixed(1)}: ${c.id}`);}
 for(const o of OPENINGS.filter(o=>Array.isArray(o.stand))){const [x,z]=o.stand,c=mine.find(c=>circleHitsRect(x,z,1,c));if(c)faults.push(`opening ${o.id}: ${c.id}`);}
 assert.deepEqual([...new Set(faults)].slice(0,20),[]);
});

test('every dressed lot can be walked into from Main Street, and what it offers is reached on foot',()=>{
 const nav=createNavigation(playerBlocked,{step:.5});
 // The inside of each: the lane garden's middle path, Johansson Mart's forecourt at its door (where the to-let bay was,
 // 27 October 2026), the gap between Kōji's and Nhung's cars to the parking sign, the bicycle shed's
 // front, the hoop's free-throw line, the eisa ground, Mac's table, Gran Higa's path, between Kōji's rails, Tetsu's
 // table and the drinks corner's bench.
 const goals={'the lane garden':[24.0,65.0],'Johansson Mart’s door':[40.4,62.6],'the parking sign':[30.52,63.2],'the bicycle shed':[6.8,52.2],'the hoop':[12.5,53.2],
  'the eisa ground':[-15,52],'Mac’s table':[-29.6,50.4],'Gran Higa’s garden':[-30.9,-5],'Kōji’s nets':[-31.5,8.6],'Tetsu’s table':[-20.5,-.2],'the drinks corner':[7.0,-2.3]};
 for(const [name,[x,z]] of Object.entries(goals)){
  assert.equal(playerBlocked(x,z,.32),false,name+' is open ground');
  const route=nav.path({x:0,z:0},{x,z});assert.ok(route.length,'a route to '+name);
  let [px,pz]=route[0];
  for(const [tx,tz] of route.slice(1)){const sx=px,sz=pz,n=Math.ceil(Math.hypot(tx-sx,tz-sz)/.05);
   for(let k=1;k<=n;k++){const nx=sx+(tx-sx)*k/n,nz=sz+(tz-sz)*k/n;
    assert.ok(canStepBetween(groundHeight(px,pz),groundHeight(nx,nz)),name+': a step at '+[nx,nz]);assert.equal(playerBlocked(nx,nz,.32),false,name+': blocked at '+[nx.toFixed(2),nz.toFixed(2)]);px=nx;pz=nz;}}
  assert.ok(Math.hypot(px-x,pz-z)<.6,name+' is reached');
 }
 // The shop itself is solid until it is walked into (world/kitahama-shop-build.js, batch 1).
 assert.equal(playerBlocked(38.6,66.3,.32),true,'Johansson Mart’s walls are solid');
});

test('the retained plots keep their gates, nameplates and gutters; their planting stays on their walls',()=>{
 assert.deepEqual(KITAHAMA.plots.map(p=>p.id),['kitahama-1','kitahama-2','kitahama-3','kitahama-8']);
 for(const pl of PLOT_PLANTING){
  const p=KITAHAMA.plots.find(q=>q.id===pl.plot),gate=plotGate(p,0).door;
  for(const x of pl.at){assert.ok(x>p.minX+.3&&x<p.maxX-.3,pl.plot+' planting on its own wall');assert.ok(Math.abs(x-gate[0])>1.5,pl.plot+' planting clear of the gate, its shisa and its nameplate');}
 }
 for(const p of KITAHAMA.plots){const [x,z]=plotGate(p,.7).door;assert.equal(blockedByDressing(x,z,.32),undefined,p.id+' gate approach is clear');assert.equal(playerBlocked(x,z,.32),false,p.id+' gate approach');}
});

test('the parked cars are the traffic’s family, on the ground, inside their painted bays and clear of every other solid',async()=>{
 const {PARKED_CARS,PARKING,parkedCarPlace,parkedCar}=await import('../src/world/okinawa/lot-dressing.js');
 const {buildVehicle,parkedVehicleFit,VEHICLE_SIZE}=await import('../src/world/road-vehicles.js');
 const {createKit}=await import('../src/world/okinawa/kit.js');
 const north=clearedLot('kitahama-north-block').dressing;
 assert.deepEqual(PARKED_CARS.map(c=>c.owner),['Kōji','Nhung','Mac']);
 for(const car of PARKED_CARS){
  const p=north.props.find(q=>q.id===car.prop),fit=parkedVehicleFit(car.kind,{bonnet:car.bonnet}),at=parkedCarPlace(car,fit);
  assert.equal(p.owner,car.owner,car.prop+' is its owner’s');assert.ok(VEHICLE_SIZE[car.kind],car.kind+' is a kind the traffic has');
  // One family: the parked body is the traffic's, to the centimetre.
  const traffic=new THREE.Box3().setFromObject(buildVehicle(car.kind,0xffffff,{bonnet:car.bonnet}));
  assert.ok(Math.abs(traffic.min.z-fit.tail)<.01&&Math.abs(traffic.max.z-fit.nose)<.01,car.prop+' is as long as the traffic’s '+car.kind);
  // Built alone into a kit at its bay: the tyres stand on the gravel, the whole car is inside its collider and its bay.
  const kit=createKit(),g=new THREE.Group();parkedCar(kit,car,fit);kit.finish(g);const b=new THREE.Box3().setFromObject(g);
  assert.ok(Math.abs(b.min.y-PARKING.pad)<.002,car.prop+' stands on the gravel ('+b.min.y.toFixed(4)+')');
  assert.ok(b.max.y<=p.height+1e-6,car.prop+' is no taller than its collider');
  assert.ok(b.min.x>=p.rect.minX&&b.max.x<=p.rect.maxX&&b.min.z>=p.rect.minZ&&b.max.z<=p.rect.maxZ,car.prop+' is inside its collider: '+[b.min.x,b.max.x,b.min.z,b.max.z].map(v=>v.toFixed(3)));
  const left=PARKING.lines[car.bay-1]+.05,right=PARKING.lines[car.bay]-.05;
  assert.ok(b.min.x>left&&b.max.x<right&&b.min.z>PARKING.lineZ[0]&&b.max.z<PARKING.lineZ[1],car.prop+' is inside its painted bay');
  // Rear tyres short of the wheel stops; the body passes over them.
  assert.ok(at.z+fit.wheel+fit.r<=PARKING.stopZ-.07,car.prop+' rear tyres stop before the wheel stops');
  // No other solid in the town meets the car's collider.
  const c=world.colliders.find(c=>c.id==='lot-'+car.prop),R=r=>({minX:r.x-r.w/2,maxX:r.x+r.w/2,minZ:r.z-r.d/2,maxZ:r.z+r.d/2});
  const hits=world.colliders.filter(o=>o!==c&&(o.minY??0)<2&&(o.yaw?Math.hypot(o.x-c.x,o.z-c.z)<Math.hypot(o.w,o.d)/2+Math.hypot(c.w,c.d)/2&&overlap(R({...o,w:Math.hypot(o.w,o.d),d:Math.hypot(o.w,o.d)}),R(c)):overlap(R(o),R(c))));
  assert.deepEqual(hits.map(o=>o.id),[],car.prop+' meets no other solid');
 }
});
