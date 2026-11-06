import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {CAST} from '../src/people/cast.js';
import {ISLAND_HOUSEHOLDS,homeForResident,CORE_HOUSEHOLDS,SUPPORTING_QUARTERS,householdAtHome} from '../src/people/island-households.js';
import {residentHome} from '../src/people/home-directory.js';
import {HOUSEHOLDS as ROSTER_HOUSEHOLDS,identityOf} from '../src/people/roster.js';
import {residentPlan} from '../src/people/social.js';
import {RESIDENTS} from '../src/people/residents.js';
import {buildResidentHome} from '../src/world/interiors/resident-home.js';
import {KITAHAMA,KITAHAMA_HEIGHTS,plotGate} from '../src/world/kitahama-layout.js';
import {createBusinesses} from '../src/world/businesses.js';
import {createTown} from '../src/world/town.js';
import {buildFamilyHome} from '../src/world/interiors/family-home.js';
import {buildUpperHome} from '../src/world/interiors/upper-home.js';
import {buildSakuraOfficeRoom,SAKURA_UPSTAIRS} from '../src/world/interiors/sakura-office-room.js';
import {createRoomWalk} from '../src/people/room-walk.js';
import {standingHitsRect,townBoundsBlocked} from '../physics.js';
import {groundHeight} from '../src/world/layout.js';
import {canonicalDay} from '../src/people/canonical-day.js';
import {migrateHousing} from '../src/save.js';

installDOM();globalThis.self=globalThis;
const sites=createBusinesses(),world=createTown({scene:new THREE.Scene(),sites,mobile:true,shadows:false,register(){},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});

// Dr Kakazu retired into Nhung on 22 October 2026 (the owner), and the doctor's flat with him: 20 core, 12 Minato homes.
test('18 core residents have 11 occupied Minato primary homes and one shared tropical home; the five supporting crew have quarters, not households',()=>{
 assert.equal(CAST.length,23);assert.equal(CAST.filter(p=>!p.supporting).length,18);
 // Twelve primary home ids: eleven occupied on Minato and the Kitano house; nobody names a retired home.
 const core=CAST.filter(p=>!p.supporting),primaries=new Set(core.map(p=>p.home));assert.equal(primaries.size,12);
 assert.equal([...primaries].filter(id=>{const h=ISLAND_HOUSEHOLDS.find(h=>h.id===id);return h.island==='minato'&&!h.retired;}).length,11);
 assert.ok([...primaries].every(id=>!ISLAND_HOUSEHOLDS.find(h=>h.id===id).retired),'no retired home is anybody’s');
 assert.deepEqual(CAST.filter(p=>p.home==='kitano-1').map(p=>p.name),['Johansson','Thuan']);
 assert.deepEqual(CAST.filter(p=>p.home==='kitahama-3').map(p=>p.name),['Nhung','Kōji','Riku'],'Nhung’s family is one household');
 assert.deepEqual(CAST.filter(p=>p.home==='kitahama-1').map(p=>p.name),['Thao','Chin','Vy']);assert.deepEqual(CAST.find(p=>p.name==='Thuan').alsoAt,[],'no weekday room');
 assert.equal(ISLAND_HOUSEHOLDS.filter(h=>h.island==='minato'&&h.toLet).length,0);
 for(const name of ['Grandmother Sakurai','Mr Higa Jr','Reiko','Barfly','Dr Kakazu'])assert.equal(homeForResident(name),null,name+' is retired and has no home record');
 // The roster's 13 households are in the registry member for member (brief §13), and nothing else is occupied.
 const live=new Map(CORE_HOUSEHOLDS.map(h=>[h.home,h.residents.map(n=>identityOf(n).id).sort()]));
 assert.equal(ROSTER_HOUSEHOLDS.length,12);
 for(const h of ROSTER_HOUSEHOLDS)assert.deepEqual(live.get(h.home),[...h.members].sort(),h.home);
 assert.deepEqual(CORE_HOUSEHOLDS.filter(h=>!ROSTER_HOUSEHOLDS.some(r=>r.home===h.home)).map(h=>h.home),[],'no household outside the roster’s 12');
 // Quarters (island-households.js SUPPORTING_QUARTERS; roster.js QUARTERS): the two cabins aboard and the Shiroma house.
 assert.deepEqual(SUPPORTING_QUARTERS.map(h=>h.home).sort(),['ferry-crew-cabin','ferry-officer-cabin','kitano-2']);
 assert.deepEqual(SUPPORTING_QUARTERS.flatMap(h=>h.residents).sort(),['Aya','Jun','Kai','Ren','Ryo']);
 assert.ok(CORE_HOUSEHOLDS.every(h=>!h.quarters&&!h.aboard),'no cabin is counted as a household');
 for(const p of CAST.filter(p=>p.supporting))assert.ok(!CORE_HOUSEHOLDS.some(h=>h.residents.includes(p.name)),p.name+' is in no household');
});

test('all retained household targets are registered doors on land, clear at their real foot height',()=>{
 for(const id of new Set(CAST.map(p=>p.home))){
  // Johansson's house is the island's own; the crew's cabins are aboard the ship (their directions point at the terminal);
  // a retired flat's target is the public fallback, tested with the save migration.
  if(id==='kitano-1'||ISLAND_HOUSEHOLDS.find(h=>h.id===id).aboard||ISLAND_HOUSEHOLDS.find(h=>h.id===id).retired)continue;
  const resident=CAST.find(p=>p.home===id),home=residentHome(resident.name,{sites,landmarks:world.landmarks}),d=home.target;
  assert.ok(sites.some(s=>s.id===d.id)||id==='fujita-houseboat'&&world.landmarks.some(s=>s.id===d.id),id+' has a registered entrance or open walkable dwelling');
  assert.equal(townBoundsBlocked(d.x,d.z,.28),false,id+' approach is on land');
  const y=groundHeight(d.x,d.z);
  const hit=world.colliders.find(c=>standingHitsRect(d.x,d.z,.28,y,c));
  assert.equal(hit,undefined,id+' doorway is blocked by '+JSON.stringify(hit));
 }
});

test('each authored family room has a distinct sleeping place and actual clear routes from door to bed and table',()=>{
 for(const site of sites.filter(s=>s.familyHome?.members.length)){
  const room=new THREE.Group(),colliders=[];
  const layout=(site.upperHome?buildUpperHome:buildFamilyHome)({room,site,household:site.familyHome,residents:site.residents,kind:site.houseKind,title:site.title,reg(){},action(){},collider:(x,z,w,d,height,minY=0)=>colliders.push({x,z,w,d,height,minY})});
  const unique=new Set();
  for(const name of site.residents){
   const own=layout.homeLayouts?.[name];assert.ok(own,site.id+' has a sleeping layout for '+name);unique.add(own.bed.join(','));
   const y=own.door[1],b=layout.bounds,blocked=(x,z,r=.3)=>x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r||colliders.some(c=>standingHitsRect(x,z,r,y,c));
   const walker=createRoomWalk(blocked,{bounds:b}),g=new THREE.Group(),p={g,profile:{name,age:40}};g.position.set(...own.door);
   for(const target of [own.bedside,own.tableStand||own.table,own.door]){
    let reached=false;for(let i=0;i<60*55;i++)if(walker.move(p,target,1/60)){reached=true;break;}
    assert.ok(reached,site.id+' '+name+' can walk to '+target);
   }
  }
  assert.equal(unique.size,site.residents.length,site.id+' has enough separate bedding');
 }
});

test('canonical shore schedules resolve home, school and work destinations through clock wrap',()=>{
 for(const person of CAST.filter(p=>!['Johansson','Thuan','Mr Fujita'].includes(p.name)))for(let m=-15;m<1450;m+=15){
  const plan=canonicalDay(person.name,m);assert.ok(plan?.target?.every(Number.isFinite),person.name+' at '+m);
 }
});

test('Sakura office has reachable business fittings; the only bedding is the rest room’s futon in its cupboard',()=>{
 const room=new THREE.Group(),colliders=[],prompts=[];
 const layout=buildSakuraOfficeRoom({room,reg:(o,label)=>prompts.push({o,label}),action(){},exit(){},collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height})});
 const names=[];room.traverse(o=>names.push(o.name));assert.ok(!names.some(n=>/bunk|bedroom/i.test(n)));
 // The owner, 19 October 2026: a rest room upstairs. A staff 休憩室, not a home: one folded futon, on the cupboard's shelf.
 const futons=[];room.traverse(o=>{if(/futon/i.test(o.name))futons.push(o);});assert.ok(futons.length>0);
 const K=SAKURA_UPSTAIRS.oshiire;for(const f of futons)assert.ok(f.position.x>K.minX&&f.position.x<K.maxX&&f.position.z>K.minZ&&f.position.z<K.maxZ,f.name+' is in the futon cupboard');
 assert.ok(!ISLAND_HOUSEHOLDS.some(h=>!h.retired&&h.id==='market')&&!CAST.some(p=>p.home==='market'),'nobody lives at Sakura');
 for(const n of ['Kitchenette sink','Electric thermo pot','Office fridge','Desk telephone','Till ledger','Office desk top'])assert.ok(names.includes(n),n);
 const b=layout.bounds,blocked=(x,z,r=.3)=>x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r||colliders.some(c=>standingHitsRect(x,z,r,0,c));
 for(const label of ['Read the till ledger','Make office tea','Look over Main Street','Look over the harbour','Lie down for a minute']){
  // A prompt sits on the thing (the ledger on the desk, the futon in its cupboard): walk to the nearest clear floor.
  const at=prompts.find(p=>p.label===label).o.position;let target=null;
  for(let r=0;r<=1.3&&!target;r+=.05)for(let k=0;k<32&&!target;k++){const x=at.x+Math.cos(k*Math.PI/16)*r,z=at.z+Math.sin(k*Math.PI/16)*r;if(!blocked(x,z,.42))target=[x,0,z];}
  assert.ok(target,label+' has clear floor within reach');
  const g=new THREE.Group();g.position.set(...layout.spawn);const walker=createRoomWalk(blocked,{bounds:b}),visitor={g,profile:{name:'visitor',age:40}};let ok=false;
  for(let i=0;i<60*120;i++)if(walker.move(visitor,target,1/60)){ok=true;break;}
  assert.ok(ok,label+' is reachable');
 }
});

test('housing migration is idempotent and preserves shops, inventory, relationships and tropical home data',()=>{
 const saved={residentLocations:{'Grandmother Sakurai':{position:[0,0]},Thuan:{position:[24,57]}},visited:['market'],inventory:['tea'],friendship:{Thuan:9},'johansson-house':{doors:{a:true}},homeTarget:'home-market'};
 migrateHousing(saved);assert.equal(saved.homeTarget,'home-kitahama-flat-2');assert.equal(saved.residentLocations['Grandmother Sakurai'],undefined);assert.ok(saved.residentLocations.Thuan);assert.deepEqual(saved.visited,['market']);
 const before=JSON.stringify(saved);migrateHousing(saved);assert.equal(JSON.stringify(saved),before);
});

test('3 Kitahama is Nhung, Kōji and Riku’s: three sleeping places, a walk to each, and the family home, eats, rests and sleeps there',()=>{
 const site=sites.find(s=>s.id==='home-kitahama-3');assert.ok(site);
 assert.deepEqual(site.homeOwners,['Nhung','Kōji','Riku']);assert.equal(site.homeEntry,'kitahama-3');assert.deepEqual(site.residents,site.homeOwners);
 const gate=plotGate(KITAHAMA.plots.find(p=>p.id==='kitahama-3')).door;assert.deepEqual([site.x,site.z],gate);
 const room=new THREE.Group(),colliders=[];
 const layout=buildResidentHome({site,profile:{name:'Nhung'},room,reg(){},action(){},exit(){},collider:(x,z,w,d,height,minY=0)=>colliders.push({x,z,w,d,height,minY})});
 const beds=new Set();
 for(const name of site.homeOwners){
  const own=layout.homeLayouts[name];assert.ok(own,name+' has a place in the house');beds.add(own.bed.join(','));assert.ok(room.getObjectByName('Futon '+name),name+' has a futon');
  const y=own.door[1],b=layout.bounds,blocked=(x,z,r=.3)=>x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r||colliders.some(c=>standingHitsRect(x,z,r,y,c));
  const walker=createRoomWalk(blocked,{bounds:b}),g=new THREE.Group(),p={g,profile:{name,age:40}};g.position.set(...own.door);
  for(const target of [own.bedside,own.tableStand||own.table,own.door]){let reached=false;for(let i=0;i<60*55;i++)if(walker.move(p,target,1/60)){reached=true;break;}assert.ok(reached,name+' can walk to '+target);}
 }
 assert.equal(beds.size,3,'three separate beds');
 // Nhung, the walking resident, goes home to 3 Kitahama's gate to eat and sleep; Kōji and Riku's canonical day ends there too.
 const nhung=RESIDENTS.find(p=>p.name==='Nhung');assert.deepEqual([...nhung.home],gate);assert.equal(nhung.homeAddress,'3 Kitahama');
 // Day 15 is a Thursday (town-clock.js: day 0 is Wednesday 1 January 1997) in the bosun's week on, so Kōji is fishing, not
 // relieving her (ferry-crew.js rotaWeek); at the weekend Nhung keeps Sakura instead of the bookshop.
 for(const m of [15*1440+60,15*1440+1380]){const plan=residentPlan(nhung,m,false,{});assert.equal(plan.place,'home',m+'');assert.deepEqual(plan.target,gate);assert.match(plan.activity,/home|sleep|bed|breakfast/);}
 assert.equal(residentPlan(nhung,15*1440+720,false,{}).place,'work','and keeps the bookshop by day');
 for(const name of ['Kōji','Riku']){
  const night=canonicalDay(name,15*1440+1380),breakfast=canonicalDay(name,15*1440+(name==='Riku'?440:240));
  assert.equal(night.place,'home');assert.deepEqual(night.target,gate);assert.equal(night.rest,'sleep');
  assert.equal(breakfast.place,'home');assert.equal(breakfast.rest,'breakfast',name+' eats at home');
 }
});

test('the Heights’ two residents walk continuously from their own front doors to the terminal and back; no upper floor is left',async()=>{
 const {createNeighbours}=await import('../src/people/neighbours.js');
 const {createColliderGrid}=await import('../src/world/collider-grid.js');
 const {createWalkSurface}=await import('../src/world/walk-surface.js');
 const {planHeight,setWalkSurface}=await import('../src/world/layout.js');
 const surface=createWalkSurface({minX:-45,maxX:50,minZ:-72,maxZ:95,base:planHeight});surface.add(world.group);setWalkSurface(surface);
 const grid=createColliderGrid(world.colliders),blocked=(x,z,r=.3)=>townBoundsBlocked(x,z,r)||grid.some(x,z,r,c=>standingHitsRect(x,z,r,groundHeight(x,z),c));
 const neighbours=createNeighbours({parent:world.group,blocked,register(o){o.userData.hit={inside:false};}});
 try{
  neighbours.update(0,0);const names=['Mac','Ms Ganaha'];
  for(const clock of [600,23*60]){
   const targets=new Map(names.map(name=>[name,canonicalDay(name,clock).target]));
   let arrived=false;
   for(let frame=0;frame<60*330;frame++){
    const before=new Map(names.map(name=>{const g=neighbours.people.find(p=>p.spec.name===name).g;return [name,g.position.clone()];}));
    neighbours.update(1/60,clock);
    arrived=names.every(name=>{const p=neighbours.people.find(p=>p.spec.name===name),from=before.get(name),to=p.g.position,target=targets.get(name);
     assert.ok(Math.hypot(to.x-from.x,to.z-from.z)<.018,name+' continuous horizontal movement');
     assert.ok(Math.abs(to.y-from.y)<=.181,name+' ordinary stair riser');
     assert.equal(blocked(to.x,to.z,.3),false,name+' stays clear of actual colliders');
     return Math.hypot(to.x-target[0],to.z-target[1])<.35;
    });
    if(arrived)break;
   }
   assert.ok(arrived,'both residents complete the '+(clock===600?'outward':'homeward')+' walk');
  }
  // Their homes are the two ground-level front doors (kitahama-layout.js KITAHAMA_HEIGHTS), nothing above them.
  for(const [name,id] of [['Mac','kitahama-flat-3'],['Ms Ganaha','kitahama-flat-4']]){
   const house=KITAHAMA_HEIGHTS.houses.find(h=>h.id===id),home=canonicalDay(name,23*60);
   assert.deepEqual(home.target,[house.approachPosition[0],house.approachPosition[2]]);assert.equal(house.door[1],KITAHAMA.y+.02,'a door at ground level');
   assert.ok(!world.colliders.some(c=>standingHitsRect(house.door[0],house.door[2],.28,groundHeight(house.door[0],house.door[2]),c)),id+' front door is clear');
  }
  assert.equal(KITAHAMA_HEIGHTS.houses.length,2);assert.ok(!world.colliders.some(c=>/flats-(stair|landing|corridor)/.test(c.id)),'no stair, landing or corridor collider remains');
  for(const id of ['kitahama-flat-1','kitahama-flat-2'])assert.equal(householdAtHome(id).status,'retired');
 }finally{setWalkSurface(null);}
});

test('private residential stairs carry a visitor from the street landing to the actual room floor and back',()=>{
 for(const site of sites.filter(s=>s.upperHome)){
  const room=new THREE.Group(),colliders=[],layout=buildUpperHome({room,household:site.familyHome,residents:site.residents,reg(){},action(){},collider:(x,z,w,d,height,minY=0)=>colliders.push({x,z,w,d,height,minY})});
  for(const route of [layout.entranceRoute,[...layout.entranceRoute].reverse()]){
   let at=[...route[0]];
   for(const target of route.slice(1)){
    const distance=Math.hypot(target[0]-at[0],target[2]-at[2]),n=Math.max(1,Math.ceil(distance/.04)),start=[...at];
    for(let i=1;i<=n;i++){
     const x=start[0]+(target[0]-start[0])*i/n,z=start[2]+(target[2]-start[2])*i/n;
     const moved=layout.walk.move(at[0],at[1],at[2],x,z,.3,(px,py,pz)=>colliders.some(c=>standingHitsRect(px,pz,.05,py,c)));
     assert.ok(moved.ok,site.id+' stair supports the walking footprint at '+[x,z]);at=[x,moved.y,z];
    }
   }
   assert.ok(Math.abs(at[1]-route.at(-1)[1])<.01,site.id+' reaches the finished floor');
  }
 }
});

test('the surplus dwellings, the housing project’s nine and phase 4’s eight, leave no active doors, private obstructions, lights, prompts or plot circuits',async()=>{
 const {TOWN_WALK_PLOTS}=await import('../src/world/architecture-plan.js');
 const {canonicalHomeId}=await import('../src/people/households.js');
 const {HOME_ROUTINES}=await import('../src/world/home-lights.js');
 const {CLEARED_LOTS,clearedLot}=await import('../src/world/okinawa/lots.js');
 // The housing project's nine (18 October 2026), then phase 4's: 4, 5 and 6 Kitahama, the Kinjō and Ōshiro houses, 1 Front-Row
 // Yard, the flat over the post-office shop-house and Barfly's registration at the izakaya (the bar itself stands).
 const removed=[['kitahama-7',-15,52.5],['kitahama-9',11,52.5],['kitahama-10',-28,66.5],['kitahama-11',-15,66.5],['kitahama-12',-2,66.5],['nakasone',-15,82.5],['miyagi',-2,82.5],['arakaki',9.55,16],['yonamine',-11.95,12.7],
  ['kitahama-4',24,66.5],['kitahama-5',37,66.5],['kitahama-6',-28,52.5],['kinjo',-30.85,-5.7],['oshiro',-30.85,8.75],['resident-home-aya',-21.3,-1.2],['shimabukuro',9.55,-4.1],['izakaya',null,null]];
 const prompts=[];world.group.traverse(o=>{if(o.userData.hit?.label)prompts.push(o.userData.hit.label);});
 for(const [id,x,z] of removed){
  assert.equal(ISLAND_HOUSEHOLDS.find(h=>h.id===id).status,'retired');
  assert.ok(!sites.some(s=>s.homeId===id),id+' has no site');assert.ok(!(world.landmarks||[]).some(s=>s.homeId===id),id+' has no landmark');assert.ok(!TOWN_WALK_PLOTS.some(p=>p.id===id),id+' has no plot circuit');
  assert.equal(HOME_ROUTINES[id],undefined,id+' has no window light');assert.ok(!prompts.some(l=>l.includes(ISLAND_HOUSEHOLDS.find(h=>h.id===id).address)),id+' has no entrance prompt');
  if(x===null)continue;
  const standing=world.colliders.find(c=>standingHitsRect(x,z,.35,groundHeight(x,z),c));
  // (the Arakaki lot is the one the police station grew into, the owner's 19 October ask: its collider is the station's)
  if(id==='arakaki')assert.equal(standing?.id,'police-station',id+' lot carries the police station');
  // (and 5 Kitahama's is where Johansson Mart stands, the owner's 27 October ask: its collider is the shop's)
  else if(id==='kitahama-5')assert.equal(standing?.id,'johansson-mart',id+' lot carries Johansson Mart');
  // A cleared lot is dressed now (lots.js CLEARED_LOTS): whatever stands where the house stood is that lot's own dressing
  // (its cane, its parking, a garden bed), never a house.
  else if(standing){const lot=clearedLot(id),own=lot&&[lot,...CLEARED_LOTS.filter(l=>l.dressing.partOf===lot.id||lot.dressing.partOf===l.id)].flatMap(l=>l.dressing.props.map(p=>'lot-'+p.id));
   assert.ok(own?.includes(standing.id),id+' plot carries only its own dressing, not '+standing.id);}
  assert.equal(canonicalHomeId(id.startsWith('resident-home-')?id:'home-'+id),id==='shimabukuro'?'ferry-terminal':id==='izakaya'?'izakaya':'community-kitchen');
 }
 // Every lot phase 4 cleared on Minato is recorded with its reason, and what stands on it now is its dressing and nothing
 // else: every solid at its centre is the dressing's (tests/lot-dressing.test.mjs checks each against its data).
 for(const lot of CLEARED_LOTS.filter(l=>l.district!=='Kitano hamlet'&&!/-block$/.test(l.id))){
  assert.ok(lot.why.length>20&&lot.dressing&&lot.dressing!=='deferred',lot.id+' carries its reason and its dressing');
  const cx=(lot.rect.minX+lot.rect.maxX)/2,cz=(lot.rect.minZ+lot.rect.maxZ)/2,at=world.colliders.find(c=>standingHitsRect(cx,cz,.35,groundHeight(cx,cz),c));
  // (5 Kitahama's centre is under Johansson Mart, the owner's 27 October ask; lots.js records it on the lot)
  assert.ok(!at||/^lot-/.test(at.id)||(lot.id==='kitahama-5-lot'&&at.id==='johansson-mart'),lot.id+' carries only its dressing at its centre, not '+at?.id);
  // And nothing without a collider is left standing on the grass either (an ishiganto set in a wall that is gone, a
  // nameplate, a step): every mesh of its own inside the lot, under 2 m, is listed by name, and only the dressing's own
  // signs and drinks machines may be there. The quarter's batched chunks (named `…|cell|cell`, spanning several lots)
  // are the lanes' own surfaces and the dressing's, read by the collider check.
  const left=[],box=new THREE.Box3(),signs=new Set([lot,clearedLot(lot.dressing.partOf)].filter(Boolean).flatMap(l=>l.dressing.signs?.map(s=>s.name)||[]));
  world.group.traverse(o=>{
   if(!o.isMesh||/\|-?\d+\|-?\d+$/.test(o.name)||signs.has(o.name))return;
   for(let p=o.parent;p;p=p.parent)if(p.userData?.vending||/vending/i.test(p.name||''))return;
   // Johansson Mart, standing on the old 5 Kitahama plot by the owner's 27 October ask (world/kitahama-shop-build.js)
   for(let p=o.parent;p;p=p.parent)if(p.userData?.placeId==='kitahama-shop')return;
   box.setFromObject(o);if(box.isEmpty()||box.max.x-box.min.x>20||box.max.z-box.min.z>20)return;
   const x=(box.min.x+box.max.x)/2,z=(box.min.z+box.max.z)/2;
   if(x>lot.rect.minX+.05&&x<lot.rect.maxX-.05&&z>lot.rect.minZ+.05&&z<lot.rect.maxZ-.05&&box.min.y<2)left.push(o.name||'(unnamed)');
  });
  assert.deepEqual(left,[],lot.id+' has nothing of its own left standing on it but its dressing');
 }
 // The Rainflower pavilion is gone with its landmark, prompts and colliders (addendum 3).
 assert.ok(!(world.landmarks||[]).some(s=>s.id==='rainflower-florist'));assert.ok(!world.colliders.some(c=>c.business==='rainflower-florist'));assert.ok(!prompts.some(l=>/flower counter|Mrs Kinjō/.test(l)));
});

test('both office outlooks map the seated desk to the same physical upper floor: Main Street east, the ferry berth south through the desk’s own window',async()=>{
 const {mapShopCamera}=await import('../src/render/shop-street-view.js');
 const {BERTH_X,BERTH_Z}=await import('../src/world/ferry-paths.js');
 const site=sites.find(s=>s.id==='sakura-office'),shop=sites.find(s=>s.id==='market');assert.equal(site.officePortals.length,2);
 const chair=SAKURA_UPSTAIRS.items.find(i=>i.id==='chair').at,source=new THREE.PerspectiveCamera();source.position.set(chair[0],1.12,chair[2]);
 const mapped=site.officePortals.map(portal=>{const camera=new THREE.PerspectiveCamera();const plane=mapShopCamera(source,camera,portal);return {camera,plane};});
 assert.ok(mapped[0].camera.position.distanceTo(mapped[1].camera.position)<1e-8,'changing outlook cannot jump the observer');
 assert.ok(Math.abs(mapped[0].camera.position.y-5.13)<1e-8,'seated eye is above the 4.01 m office floor');
 assert.deepEqual(mapped.map(v=>v.plane.normal.toArray().map(n=>Math.round(n))),[[1,0,0],[0,0,-1]],'east faces town; south faces harbour');
 assert.ok(Math.abs(site.officePortals[0].yaw-shop.streetFrontage.yaw)<1e-9,'the town window faces the street the shop door opens onto');
 // From the desk chair, the line of sight to the berthed ferry passes through the harbour window's opening.
 const p=site.officePortals[1],eye=mapped[1].camera.position,n=new THREE.Vector3(Math.sin(p.yaw),0,Math.cos(p.yaw)),centre=new THREE.Vector3(...p.position),across=new THREE.Vector3(1,0,0).applyAxisAngle(new THREE.Vector3(0,1,0),p.yaw);
 for(const y of [1.5,4,7]){const to=new THREE.Vector3(BERTH_X,y,BERTH_Z).sub(eye),k=centre.clone().sub(eye).dot(n)/to.dot(n),hit=eye.clone().add(to.multiplyScalar(k)).sub(centre);
  assert.ok(Math.abs(hit.dot(across))<p.span.maxX&&hit.y>p.span.minY&&hit.y<p.span.maxY,'the berth at '+y+' m is framed by the harbour window');}
});

test('the retired neighbours have no body: nobody walks the postman’s round, tidies the pavilion, minds the generators or scrapes a sabani',async()=>{
 const {createNeighbours,NEIGHBOURS}=await import('../src/people/neighbours.js');
 const {RETIRED,isRetired}=await import('../src/people/roster.js');
 const neighbours=createNeighbours({parent:new THREE.Group()});neighbours.update(0,540);
 for(const r of RETIRED)assert.ok(!neighbours.people.some(p=>p.spec.name===r.name),r.name+' has no street body');
 assert.ok(NEIGHBOURS.every(n=>!isRetired(n.name)&&!n.walk),'no neighbour walks a round the roster retired');
 assert.deepEqual(NEIGHBOURS.map(n=>n.name),['Vy','Kōji','Riku','Miss Higa','Grandmother Higa','Mac','Ms Uezu','Ms Ganaha']);
});
