import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildPark,PARK_GUIDE,KOI_FEED,POND_STONES} from '../src/world/park.js?snappy=1';
import {buildParkOnsen} from '../src/world/park-onsen.js';
import {HARBOUR_PARK_PATHS,HARBOUR_POND,HARBOUR_PARK_SEATS,inHarbourPark,parkPathAt} from '../src/world/harbour-park-plan.js';
import {HARBOUR_PARK_BEDS,PARK_PLANTS,HARBOUR_POND_KEEPER,HARBOUR_SHADE_TREE,plantInFlower} from '../src/world/harbour-park-garden.js';
import {ONSEN_GROUND,coastPaved} from '../src/world/ground-plan-coast.js';
import {cherrySeason} from '../src/world/cherry-tree.js';
import {identityOf,isRetired} from '../src/people/roster.js';
import {routeAt} from '../src/world/layout.js';
import {circleHitsRect} from '../physics.js';

/**
 * The Harbour Park rework (the owner, 21 October 2026: "The park still has problems. Can you rework it"): every walk
 * joins another or the town's ground; the beds, the pond and their keepers have their reasons in data; the cherry and
 * the borders flower only in their own months by the town's calendar; the landmarks' prompts work, the koi come when
 * they are fed and never leave the water or swim through a stone; the footbath keeps the bath's hours.
 */
installDOM();
/** Town minutes at noon on a day of the town's calendar (town-clock.js reads days since 1970 as the month and day). */
const on=(month,day,hour=12)=>Date.UTC(1970,month-1,day)/60000+hour*60;
const inside=(r,x,z,pad=0)=>x>=r.minX-pad&&x<=r.maxX+pad&&z>=r.minZ-pad&&z<=r.maxZ+pad;
function park(minutes=on(10,21)){
 const prompts=[],actions=[],world={group:new THREE.Group(),colliders:[],minutes};
 const register=(object,label,run)=>prompts.push({object,label,run});
 buildPark(world,{register,onAction:(...a)=>actions.push(a),shadows:false});
 world.onsen=buildParkOnsen(world,{register,onAction:(...a)=>actions.push(a),sites:[]});
 const hour=m=>{world.minutes=m;for(const f of world.hourly)f(m);};hour(minutes);
 const ask=label=>{const p=prompts.find(q=>q.label===label);assert.ok(p,'no prompt "'+label+'"');p.run();return actions.at(-1);};
 return {world,prompts,actions,hour,ask};
}

test('every walk in the park ends on another walk, the forecourt or the town’s ground: no dead ends',()=>{
 for(const r of HARBOUR_PARK_PATHS)for(const [x,z] of [r.points[0],r.points.at(-1)]){
  const other=HARBOUR_PARK_PATHS.some(o=>o!==r&&o.points.slice(1).some((b,i)=>{const a=o.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<=o.width/2;}));
  const forecourt=inside(ONSEN_GROUND.forecourt,x,z,.05);
  const street=!inHarbourPark(x,z,-.05)&&routeAt(x,z)!==null;
  assert.ok(other||forecourt||street,`${r.id} ends at ${x}, ${z} in nothing`);
 }
});

test('the beds record living keepers or an explicit vacancy, with Okinawan plants in their beds and seasons',()=>{
 for(const [kind,p] of Object.entries(PARK_PLANTS)){
  assert.ok(p.jp&&p.why.length>40,kind+' says what it is and why it is here');
  assert.ok(p.flowers.length>0&&p.flowers.every(m=>Number.isInteger(m)&&m>=1&&m<=12),kind+' flowers in real months');
 }
 for(const bed of HARBOUR_PARK_BEDS){
  if(bed.id==='entrance-bed'){
   assert.equal(bed.keeper,null,'the retired shopkeeper is not silently replaced');assert.equal(bed.maintenance,'unassigned');assert.match(bed.tends,/No watering round/);
  }else{
   const who=identityOf(bed.keeper);assert.ok(who&&!isRetired(bed.keeper),bed.id+' is kept by a living resident');
   assert.match(bed.tends,/\d\d:\d\d/,bed.id+' says when it is tended');
  }
  assert.ok(bed.why.length>60,bed.id+' says why it remains');
  for(const [kind,x,z] of bed.plants){assert.ok(PARK_PLANTS[kind],kind);assert.ok(inside(bed.bounds,x,z),`${kind} at ${x}, ${z} stands in ${bed.id}`);}
  // A bed is a bed in the lawn: a strip of turf between it and every walk's setts.
  const b=bed.bounds;for(let x=b.minX;x<=b.maxX+1e-9;x+=.1)for(let z=b.minZ;z<=b.maxZ+1e-9;z+=.1){
   assert.equal(parkPathAt(x,z,.3),null,`${bed.id} at ${x.toFixed(1)}, ${z.toFixed(1)} is within 30 cm of a walk`);
   assert.equal(coastPaved(x,z,.25)&&!inside(b,x,z,.01)?'paved':null,null,`${bed.id} touches a laid walk`);
  }
 }
 const pond=identityOf(HARBOUR_POND_KEEPER.keeper);assert.ok(pond&&!isRetired(HARBOUR_POND_KEEPER.keeper)&&HARBOUR_POND_KEEPER.why.length>40,'the pond has its keeper and reason');
 // No cherry blossom now: Okinawa's kanhizakura flowers late January to February only.
 assert.equal(cherrySeason(on(10,21)),'leaf');assert.equal(cherrySeason(on(2,5)),'bloom');assert.equal(cherrySeason(on(4,10)),'leaf');
 assert.equal(plantInFlower('lily',on(10,21)),false);assert.equal(plantInFlower('lily',on(4,28)),true);
 assert.equal(plantInFlower('ixora',on(10,21)),true);assert.equal(plantInFlower('ixora',on(1,15)),false);
});

test('the cherry flowers and sheds its petals only in its season, and the beds show only what is in flower',()=>{
 const {world,hour}=park(on(10,21)),{cherry}=world.park.trees;
 assert.equal(cherry.season,'leaf');assert.equal(world.park.petals.mesh.visible,false,'no petals in October');
 assert.equal(world.park.flowers.get('lily').visible,false,'the lilies are leaves in October');assert.equal(world.park.flowers.get('ixora').visible,true);
 hour(on(2,5));assert.equal(cherry.season,'bloom');assert.equal(world.park.petals.mesh.visible,true,'petals fall in February');
 assert.equal(world.park.flowers.get('ixora').visible,false);
 hour(on(5,2));assert.equal(world.park.petals.mesh.visible,false);assert.equal(world.park.flowers.get('lily').visible,true);assert.equal(world.park.flowers.get('getto').visible,true);
 // The petals start inside the crown, settle on the lawn (never on a walk or the bench) and shrink away there.
 const {petals}=world.park,bench=HARBOUR_PARK_SEATS[0];
 for(let i=0;i<petals.count;i++)for(let s=0;s<=20;s++){
  const [x,y,z]=petals.path(i,s/20);
  assert.ok(!(Math.abs(x-bench.x)<.4&&Math.abs(z-bench.z)<1.1),'a petal falls through the bench');
  if(s===20){assert.ok(y>.02&&y<.03,'a settled petal lies on the turf');assert.equal(parkPathAt(x,z),null,'a petal settles on a walk at '+x+','+z);}
 }
});

test('the landmarks’ prompts work: the guide, the beds, the trees, the bench and feeding the koi',()=>{
 const {world,ask,hour}=park(on(10,21,12));
 const guide=ask('Read the park guide');assert.equal(guide[0],'read');assert.match(guide[2],/Umi-no-yu/);assert.doesNotMatch(guide[2],/Rainflower/,'the florist retired on 19 October');
 for(const bed of HARBOUR_PARK_BEDS){const a=ask('Look at the '+bed.title.toLowerCase());assert.match(a[2],bed.keeper?new RegExp(identityOf(bed.keeper).avatar):/No keeper is assigned/);}
 assert.doesNotMatch(guide[2],/Mrs Nakamura|\bMai\b/);assert.match(guide[2],/dessert counter is closed/);
 assert.match(ask('Look at the entrance bed')[2],/In flower: ixora/);assert.match(ask('Look at the entrance bed')[2],/In leaf: Easter lily/);
 assert.match(ask('Look up into the harbour cherry')[2],/green tree/);hour(on(2,5,12));assert.match(ask('Look up into the harbour cherry')[2],/in flower/);hour(on(10,21,12));
 assert.match(ask('Look up into the gajumaru')[2],/gajumaru/);
 const seat=world.park.shadeBench.userData.seat;assert.ok(seat&&seat.surfaceY>.4);
 // Fed in the bath's hours, the koi come to the feeding place within a few seconds, and go back to their rounds.
 const far=t=>world.park.fish.map(f=>Math.hypot(f.position.x-KOI_FEED.at[0],f.position.z-KOI_FEED.at[1]));
 world.park.update(10);assert.ok(Math.max(...far())>.8,'the koi are about the pond before they are fed');
 assert.match(ask('Feed the koi')[2],/fu/);world.park.update(20);world.park.update(20+KOI_FEED.gather+1);
 assert.ok(Math.max(...far())<.7,'the koi gather where the fu is scattered: '+far().map(d=>d.toFixed(2)));
 world.park.update(20+KOI_FEED.gather+KOI_FEED.stay+KOI_FEED.leave+5);assert.ok(Math.max(...far())>.8,'and go back to their rounds');
 // At night the tin is in: nothing is scattered.
 hour(on(10,21,23));const night=ask('Feed the koi');assert.match(night[2],/takes it in/);
});

test('the koi stay in the water and swim round the stones, fed or not',()=>{
 const {world,ask}=park(on(10,21,11)),p=HARBOUR_POND;
 world.park.update(5);ask('Feed the koi');
 for(let t=5;t<=120;t+=.25){
  world.park.update(t);
  for(const f of world.park.fish){
   const {x,z}=f.position;
   // The body is 44 cm long: its ends stay inside the oval as well as its middle.
   assert.ok(((x-p.x)/(p.rx-.3))**2+((z-p.z)/(p.rz-.3))**2<1,`a koi leaves the water at ${x.toFixed(2)}, ${z.toFixed(2)} (t ${t})`);
   for(const [sx,sz,r] of POND_STONES)assert.ok(Math.hypot(x-sx,z-sz)>r*1.1+.12,`a koi swims through the stone at ${sx}, ${sz} (t ${t})`);
   assert.ok(f.position.y<p.waterY);
  }
 }
});

test('the footbath keeps the bath’s hours: soak and steam while it is open, the spout off after ten at night',()=>{
 const {world,ask,hour}=park(on(10,21,15));
 assert.equal(ask('Soak your feet in the footbath')[0],'seat');assert.equal(world.onsen.kakehi.stream.visible,true);
 hour(on(10,21,23));const shut=ask('Soak your feet in the footbath');assert.equal(shut[0],'inspect');assert.match(shut[2],/ten in the morning/);
 assert.equal(world.onsen.kakehi.stream.visible,false);assert.equal(world.onsen.kakehi.lantern.emissiveIntensity,0);
 hour(on(10,21,20));assert.ok(world.onsen.kakehi.lantern.emissiveIntensity>0,'the andon glows after dark while the bath is open');
});

test('the new furniture stands on the lawn, clear of every walk: the guide board, the gajumaru, its bench and lamp',()=>{
 const {world}=park();
 for(const id of ['park-guide-board','gajumaru','gajumaru-bench']){
  const c=world.colliders.find(k=>k.id===id);assert.ok(c,id);
  for(const r of HARBOUR_PARK_PATHS)for(let i=1;i<r.points.length;i++){
   const a=r.points[i-1],b=r.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.2);
   for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n;assert.ok(!circleHitsRect(x,z,r.width/2,c),`${id} stands on ${r.id}`);}
  }
  assert.ok(!coastPaved(c.x,c.z),id+' is not on a laid walk');
 }
 // The accepted tree uses one visible-bark collider for both trunk and inboard roots.
 assert.equal(world.colliders.filter(c=>c.id==='gajumaru').length,1);
 const T=HARBOUR_SHADE_TREE;assert.ok(world.colliders.some(c=>c.park&&Math.abs(c.x-T.lamp[0])<1e-9&&Math.abs(c.z-T.lamp[1])<1e-9),'the gajumaru’s lamp');
 assert.ok(Math.hypot(PARK_GUIDE.read[0]-PARK_GUIDE.x,PARK_GUIDE.read[1]-PARK_GUIDE.z)<1.3,'the guide is read from in front of it');
 assert.notEqual(parkPathAt(...PARK_GUIDE.read),null,'and from the walk');
});
