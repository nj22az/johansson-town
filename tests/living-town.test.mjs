import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import {MINATO_COMPACT} from '../src/world/interiors/minato-compact-plan.js';
import {createIndoorResidents} from '../src/people/indoor-residents.js';
import {RESIDENTS} from '../src/people/residents.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {PROFILES} from '../src/people/profiles.js';
import {supperGuests,residentPlan,IZAKAYA_SEATS,gossipAt,thuanVisitsIzakaya,thuanEveningPlace,inTimeRange,izakayaOpen,IZAKAYA_DOOR,RAMEN_DOOR} from '../src/people/social.js';
import {createIzakayaGuests} from '../src/people/izakaya-guests.js';
import {createVenueService} from '../src/people/venue-service.js';
import {createActivities} from '../activities.js?snappy=1';
import {installDOM} from './fixtures.mjs';


test('nobody lives in Minato: the live-in regular was retired in phase 4, so no profile sleeps on a stool or drinks without a bill',()=>{
 assert.equal(RESIDENTS.find(p=>p.name==='Barfly'),undefined);
 for(const p of RESIDENTS)for(const minute of [0,300,660,1200])assert.notEqual(residentPlan(p,minute).barflySleeping,true,p.name+' at '+minute);
 for(const p of RESIDENTS)assert.ok(!/private room|his stool/.test(residentPlan(p,300).activity),p.name);
});

test('izakaya borrows existing entities, updates guests and restores interaction ownership without duplicates',()=>{
 const street=new THREE.Group(),scene=new THREE.Group(),world={people:PROFILES.map((profile,i)=>{const g=new THREE.Group();g.userData.name=profile.name;g.userData.hit={inside:false};g.position.set(i,0,i+1);street.add(g);return {g,profile};})};scene.add(street);
 const before=world.people.map(p=>({g:p.g,pos:p.g.position.clone(),hit:p.g.userData.hit}));const guests=createIzakayaGuests({world,parent:scene});
 // Supper at half past eight: Nhung and Thao are there (nobody lives in the bar since phase 4).
 for(const p of world.people)if(residentPlan(p.profile,1230).place==='izakaya'){p.g.position.set(IZAKAYA_DOOR[0],0,IZAKAYA_DOOR[1]);p.g.userData.indoors='izakaya';}
 const names=guests.sync(1230);assert.ok(names.length>1);assert.equal(new Set(world.people.map(p=>p.g.uuid)).size,PROFILES.length);
 for(const name of names){const g=world.people.find(p=>p.g.userData.name===name).g;assert.equal(g.parent,scene);assert.equal(g.userData.hit.inside,true);assert.ok(g.userData.socialPose||g.userData.name==='Thao');}
 const laterNames=guests.sync(1335);guests.restore();guests.restore();assert.equal(guests.names().length,0);
 for(const {g,pos,hit} of before){
  assert.equal(g.parent,street);
  const wasGuest=[...names,...laterNames].includes(g.userData.name);
  if(wasGuest){
   const d=Math.hypot(g.position.x-IZAKAYA_DOOR[0],g.position.z-IZAKAYA_DOOR[1]);
   assert.ok(d<.01,g.userData.name+' returns to the actual izakaya threshold');
   assert.ok(d<3,g.userData.name+' stays near the izakaya door');
  }else assert.ok(g.position.equals(pos),g.userData.name+' '+g.position.toArray()+' expected '+pos.toArray());
  assert.equal(g.userData.hit,hit);assert.equal(hit.inside,false);assert.equal(g.userData.inIzakaya,undefined);
 }
});

test('supper charges once, advances the evening, saves a memory and refuses insufficient funds',()=>{
 // Ordered from your seat: Thao cooks it and brings it over (people/izakaya-beer.js).
 const dom=installDOM();let minutes=1100;const ordered=[];
 const acts=createActivities({say(){},onWeather(){},onTime:v=>{if(typeof v==='number')minutes+=v;},getMinutes:()=>minutes,getSocialContext:()=>({inside:'izakaya',names:['Nhung','Reiko']}),
  getBeerTable:()=>({drink:null,dish:null,order:null,naoHere:true}),onOrderDrink:id=>{ordered.push(id);return true;}});
 acts.action('izakaya-table');dom.button('Order something to eat…');dom.button('Assorted Yakitori · ¥180');
 assert.equal(acts.state.yen,1020);assert.equal(minutes,1102);assert.deepEqual(ordered,['yakitori']);
 assert.ok(acts.state.notes.includes('Ordered a plate of yakitori at Minato.'));
 acts.state.yen=100;acts.action('izakaya-table');dom.button('Order a drink…');dom.button('Orion draught, medium mug · ¥450 (not enough yen)');
 assert.equal(acts.state.yen,100);assert.deepEqual(ordered,['yakitori'],'nothing you cannot pay for');
 acts.action('izakaya-menu');dom.button('Read the food');assert.match(document.querySelector('#activityBody').firstChild.textContent,/Grilled Atka mackerel/);
});

test('Thuan visits after closing on alternate days and has off-duty conversation',()=>{
 for(const m of [0,1199,1290,1439,1440+1230])assert.equal(thuanVisitsIzakaya(m),false);
 for(const m of [1200,1219,1220,1230,1289,2880+1230])assert.equal(thuanVisitsIzakaya(m),true);
 const dom=installDOM();const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>1230,getSocialContext:()=>({inside:'izakaya',names:['Thuan','Thao']})});
 acts.action('resident','Thuan');assert.equal(document.querySelector('#activityTitle').textContent,'Thuan · After hours');
 assert.match(document.querySelector('#activityBody').firstChild.textContent,/all locked up/);
 dom.button('What is your favourite snack?');assert.match(document.querySelector('#activityBody').firstChild.textContent,/Thao saved me/);
 assert.ok(acts.state.notes.includes('Caught up with Thuan after closing at Minato Izakaya.'));
 assert.equal(gossipAt(1230,['Thuan','Thao']).id,'yuri-evening');
});


test('the active compact izakaya export stays within its fitted envelope and geometry budget',async()=>{
 const previous={self:globalThis.self,bitmap:globalThis.createImageBitmap};globalThis.self=globalThis;
 // Geometry retains its actual textured materials; pixels are inspected in the runtime.
 globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
 try{for(const kind of ['exterior','interior']){const file=kind==='interior'?'minato-interior-compact.glb':'minato-exterior.glb',bytes=await readFile(new URL('../assets/models/izakaya/'+file,import.meta.url));const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');let draws=0,triangles=0;gltf.scene.traverse(o=>{if(o.isMesh){draws+=o.geometry.groups.length||1;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));}});assert.ok(draws<=(kind==='interior'?50:10),'bounded static material draws');const box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3());
  const p=MINATO_COMPACT;
  assert.ok(size.x<=(kind==='interior'?p.bounds.maxX-p.bounds.minX+2*p.wallThickness+.02:13.1));
  assert.ok(size.z<=(kind==='interior'?p.bounds.maxZ-p.bounds.minZ+2*p.wallThickness+.02:13.1));
  if(kind==='interior')assert.ok(triangles<=184126,'the compact room stays within the preceding fitted room’s triangle budget');
  if(kind==='interior'){gltf.scene.updateMatrixWorld(true);IZAKAYA_SEATS.forEach(([x,z],i)=>{
   const hits=new THREE.Raycaster(new THREE.Vector3(x,1.5,z),new THREE.Vector3(0,-1,0)).intersectObject(gltf.scene,true);
   assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-FURNITURE_HEIGHTS.seat)<.015,'Runtime seat height matches the actual furniture');
  });}
 }}finally{globalThis.self=previous.self;globalThis.createImageBitmap=previous.bitmap;}
});



test('at Minato you can stand somebody a drink, and they remember it',()=>{
 const dom=installDOM();const treated=[];
 const acts=createActivities({say(){},onWeather(){},onTime(){},getMinutes:()=>1200,getSocialContext:()=>({inside:'izakaya',names:['Nhung','Thao']}),onTreat:name=>treated.push(name)});
 const yen=acts.state.yen;acts.action('resident','Nhung');dom.button('Buy Nhung a drink · ¥450');
 assert.equal(acts.state.yen,yen-450);assert.equal(acts.state.treats.Nhung,1);assert.deepEqual(treated,['Nhung']);
 assert.ok(acts.state.notes.includes('Bought Nhung a drink at Minato.'));
 acts.action('resident','Thao');assert.ok(!dom.has('Buy Thao a drink · ¥450'),'Thao is working');
});
