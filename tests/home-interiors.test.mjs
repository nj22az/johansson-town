import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildResidentHome,sharedHomeLayouts} from '../src/world/interiors/resident-home.js';
import {buildFamilyHome,FAMILY_HOME_LAYOUT} from '../src/world/interiors/family-home.js';
import {householdDetails,addFamilyPhoto} from '../src/world/interiors/home-details.js';
import {ISLAND_HOUSEHOLDS} from '../src/people/island-households.js';
import {HOUSEHOLDS} from '../src/people/households.js';
import {RESIDENTS} from '../src/people/residents.js';
import {createHomeResidents} from '../src/people/home-residents.js';
import {sleepHours} from '../src/people/home-life.js';
import {residentPlan} from '../src/people/social.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';

function residentRoom(name,{material=null,castShadow=true,receiveShadow=true,site=null}={}){
 installDOM();
 const room=new THREE.Group(),colliders=[],box=(size,pos,color,parent)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),material||new THREE.MeshBasicMaterial({color}));m.position.set(...pos);m.castShadow=castShadow;m.receiveShadow=receiveShadow;parent.add(m);return m;};
 const layout=buildResidentHome({site,profile:RESIDENTS.find(p=>p.name===name),room,box,reg(){},action(){},exit(){},collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height})});
 const b=layout.bounds,collides=(x,z,r=.32)=>x<b.minX+r||x>b.maxX-r||z<b.minZ+r||z>b.maxZ-r||colliders.some(c=>circleHitsRect(x,z,r,c));
 return {room,layout,collides};
}
for(const household of HOUSEHOLDS.filter(h=>h.residents.length>1)){
 const walkingRoommates=household.residents.filter(name=>RESIDENTS.some(p=>p.name===name));
 test(walkingRoommates.join(' / ')+' have furniture and routines in the same shared room',()=>{
  const {room,layout,collides}=residentRoom(household.residents[0]);
  for(const name of walkingRoommates){
   const own=layout.homeLayouts[name],b=layout.bounds,bed=room.getObjectByName(name+' futon');
   assert.ok(bed,name+' has bedding');assert.equal(own.bed[0],bed.position.x,'sleep pose uses the rendered bed');
   for(const point of [own.bed,own.bedside,own.table,own.door,own.cover.position,own.hatHook.position])assert.ok(point[0]>=b.minX&&point[0]<=b.maxX&&point[2]>=b.minZ&&point[2]<=b.maxZ,name+' routine is inside this home');
   assert.equal(collides(own.bedside[0],own.bedside[2]),false,name+' can stand beside the bed');
   assert.equal(collides(own.table[0],own.table[2]),false,name+' table seat is clear');
   assert.equal(collides(own.door[0],own.door[2]),false,name+' can leave');
  }
 });
 test(walkingRoommates.join(' / ')+' sleep, walk to breakfast and leave their actual house at 60 Hz',()=>{
  const site={id:household.residents[0]==='Thuan'?'resident-home-thuan':household.id,title:household.title,homeOwner:household.residents[0],homeOwners:household.residents,
   ...(household.residents[0]==='Thuan'?{plot:'kitahama-1',houseKind:'red-tile'}:{})};
  const {layout,collides}=residentRoom(household.residents[0],{site});
  for(const name of walkingRoommates){
   const street=new THREE.Group(),parent=new THREE.Group(),profile=RESIDENTS.find(p=>p.name===name),g=new THREE.Group();
   g.userData={name,hit:{inside:false},indoors:'home'};g.position.set(profile.home[0],0,profile.home[1]);street.add(g);
   const world={people:[{profile,g}],homes:new Map()},guests=createHomeResidents({world,parent,collides}),{wake}=sleepHours(profile);
   guests.enter({...site,...layout},wake-2);
   assert.equal(g.userData.sleeping,true);
   for(let i=0;i<60*20;i++)guests.update(1/60,wake+16);
   assert.equal(g.userData.activity,'having breakfast');assert.equal(g.userData.roomTransition,undefined,'breakfast seat is reachable');
   assert.ok(g.position.distanceTo(new THREE.Vector3(...layout.homeLayouts[name].table))<.15);
   let departure=null;for(let offset=60;offset<1440;offset++)if(residentPlan(profile,wake+offset).place!=='home'){departure=wake+offset;break;}
   assert.ok(departure!==null,name+' has a daily reason to leave');
   guests.update(1/60,departure);assert.ok(g.parent===parent,name+' starts walking rather than vanishing');
   for(let i=0;i<60*25;i++)guests.update(1/60,departure);
   assert.ok(g.parent===street,name+' walks through the home doorway');guests.restore();
  }
 });
}

test('every occupied registered family home has visible occupation belongings and its own portrait',()=>{
 for(const household of ISLAND_HOUSEHOLDS.filter(h=>h.members.length))for(const kind of ['concrete','red-tile']){
  const room=new THREE.Group(),interactions=[];buildFamilyHome({room,household,kind,reg:(o,label,fn)=>interactions.push({o,label,fn}),action(){}});
  const names=new Set();room.traverse(o=>{if(o.name)names.add(o.name);});
  assert.ok(names.has('Framed household photograph'),household.home+' has a photograph');
  for(const m of household.members)assert.ok(names.has('Photograph of '+m.name),m.name+' appears in the family picture');
  for(const detail of householdDetails(household.members).slice(0,2))assert.ok(names.has(detail.label),household.home+' shows '+detail.label);
  for(const name of ['Cooking pot','Washed rice bowl','Used tea cup','Household shoes'])assert.ok(names.has(name),household.home+' has '+name);
  assert.ok(interactions.some(i=>i.label==='Inspect the household’s everyday things'));
  room.updateMatrixWorld(true);room.traverse(o=>{if(!o.isMesh||!o.name.startsWith('Zabuton'))return;const b=new THREE.Box3().setFromObject(o);assert.ok(b.min.x>=FAMILY_HOME_LAYOUT.bounds.minX&&b.max.x<=FAMILY_HOME_LAYOUT.bounds.maxX,'cushion is inside walls');});
 }
});
test('the rental house stays ready for its future owner without fabricated personal belongings',()=>{
 const room=new THREE.Group();buildFamilyHome({room,household:{toLet:true,members:[]},reg(){},action(){}});
 assert.equal(room.getObjectByName('Framed household photograph'),undefined);assert.ok(room.getObjectByName('Rental note'));
});
test('shared routines are fresh room-local values with no supplied-apartment coordinates',()=>{
 const a=sharedHomeLayouts(['Thuan','Thao']),b=sharedHomeLayouts(['Thuan','Thao']);
 assert.notEqual(a.Thuan,b.Thuan);assert.notEqual(a.Thuan.bed,b.Thuan.bed);
 assert.deepEqual(a.Thuan.bed,[-2.1,.58,-.3]);assert.deepEqual(a.Thao.table,[.72,0,2.15]);
});

test('both portrait orientations expose their people in front of the opaque frame',()=>{
 for(const westWall of [false,true]){
  const group=new THREE.Group(),box=(size,pos,color,name)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color}));mesh.position.set(...pos);mesh.name=name;group.add(mesh);return mesh;};
  addFamilyPhoto(box,{x:0,z:0,westWall,members:[{name:'A'},{name:'B'}]});group.updateMatrixWorld(true);
  const ray=new THREE.Raycaster(westWall?new THREE.Vector3(1,1.68,-.06):new THREE.Vector3(-.06,1.68,1),westWall?new THREE.Vector3(-1,0,0):new THREE.Vector3(0,0,-1));
  assert.equal(ray.intersectObject(group,true)[0]?.object.name,'Photograph of A','visible artwork is in front of its background and frame');
 }
});
test('single and shared resident ceilings close the whole room above the walls',()=>{
 for(const name of ['Thuan','Officer Mori']){
  const {room,layout}=residentRoom(name);room.updateMatrixWorld(true);assert.ok(room.getObjectByName('Ceiling'));
  const b=layout.bounds;
  for(const [x,z] of [[0,0],[b.minX+.15,b.minZ+.15],[b.maxX-.15,b.maxZ-.15]]){
   const ray=new THREE.Raycaster(new THREE.Vector3(x,2.1,z),new THREE.Vector3(0,1,0));
   assert.equal(ray.intersectObject(room,true)[0]?.object.name,'Ceiling',name+' has no sky opening above the room');
  }
 }
});
test('resident ceilings suppress sun self-shadow acne without removing room shadows',()=>{
 for(const name of ['Thuan','Officer Mori']){
  const {room}=residentRoom(name),ceiling=room.getObjectByName('Ceiling');
  assert.equal(ceiling.receiveShadow,false,name+' ceiling does not receive a grazing self-shadow');
  assert.equal(ceiling.castShadow,true,name+' ceiling still shelters the room from the sun');
  room.traverse(o=>{if(o.isMesh&&o!==ceiling){assert.equal(o.receiveShadow,true,o.name||'room surface retains shadow reception');assert.equal(o.castShadow,true,o.name||'furniture retains shadow casting');}});
 }
});
test('closed resident shells cast front faces without changing shared box materials or room shadow flags',()=>{
 for(const name of ['Thuan','Officer Mori'])for(const multi of [false,true])for(const [castShadow,receiveShadow] of [[true,true],[false,false],[true,false],[false,true]]){
  const sources=Array.from({length:multi?6:1},(_,i)=>new THREE.MeshStandardMaterial({color:0xe3d8bd+i,side:THREE.DoubleSide}));
  const material=multi?sources:sources[0],{room}=residentRoom(name,{material,castShadow,receiveShadow});
  const shells=[],furnishings=[];room.traverse(o=>{if(!o.isMesh)return;(/Resident shell wall|^Ceiling$/.test(o.name)?shells:furnishings).push(o);});
  assert.equal(shells.filter(o=>o.name==='Resident shell wall').length,5,name+' has five closed shell wall pieces');
  assert.equal(shells.filter(o=>o.name==='Ceiling').length,1,name+' has one closed ceiling');
  for(const mesh of shells){
   assert.notEqual(mesh.material,material,'shell changes are isolated from the box material');
   const own=Array.isArray(mesh.material)?mesh.material:[mesh.material];assert.equal(own.length,sources.length);
   own.forEach((m,i)=>{assert.notEqual(m,sources[i],'each supplied material slot is cloned');assert.equal(m.shadowSide,THREE.FrontSide,'closed shells cast the sun-facing exterior, avoiding interior exit-face acne');assert.equal(m.side,sources[i].side,'visible-face rendering stays as supplied');assert.equal(m.color.getHex(),sources[i].color.getHex(),'the material colour is preserved');});
   assert.equal(mesh.castShadow,castShadow,'casting stays at the quality setting supplied by box');
   assert.equal(mesh.receiveShadow,mesh.name==='Ceiling'?false:receiveShadow,'wall reception stays at the supplied setting; ceiling keeps its existing self-shadow suppression');
  }
  assert.ok(furnishings.length,'there are non-shell props sharing the box material');
  for(const mesh of furnishings){assert.equal(mesh.material,material,'furniture does not inherit the shell override');assert.equal(mesh.castShadow,castShadow);assert.equal(mesh.receiveShadow,receiveShadow);}
  for(const m of sources)assert.equal(m.shadowSide,null,'the original reusable material is untouched');
 }
});
test('family rail fronts and dado top faces have no coplanar overlap at their joints',()=>{
 for(const kind of ['concrete','red-tile']){
  const room=new THREE.Group();buildFamilyHome({room,household:{members:[{name:'A',purpose:'farmer'}]},kind,reg(){},action(){}});room.updateMatrixWorld(true);
  const trims=[];room.traverse(o=>{if(/Fusuma upright|Fusuma head rail|Partition dado|Outer wall dado/.test(o.name))trims.push({name:o.name,box:new THREE.Box3().setFromObject(o)});});
  for(let i=0;i<trims.length;i++)for(let j=i+1;j<trims.length;j++)for(const axis of ['x','y','z'])for(const face of ['min','max']){
   const a=trims[i],b=trims[j],other=['x','y','z'].filter(k=>k!==axis);
   // Uprights terminate against an outer wall. Their back faces are buried in
   // that wall; only its horizontal trim faces can be seen from inside.
   if(axis!=='y'&&(a.name==='Outer wall dado'||b.name==='Outer wall dado'))continue;
   const coplanar=Math.abs(a.box[face][axis]-b.box[face][axis])<1e-6;
   const overlap=other.every(k=>Math.min(a.box.max[k],b.box.max[k])-Math.max(a.box.min[k],b.box.min[k])>.001);
   assert.ok(!coplanar||!overlap,kind+' '+a.name+' / '+b.name+' overlap on the '+axis+' '+face+' face');
  }
 }
});

test('paper panel and dark trim end caps do not compete at the visible fusuma doorway',()=>{
 const room=new THREE.Group();buildFamilyHome({room,household:{members:[{name:'A',purpose:'farmer'}]},kind:'red-tile',reg(){},action(){}});room.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(.015,1.84,2),new THREE.Vector3(0,0,-1)),hits=ray.intersectObject(room,true);
 assert.equal(hits[0]?.object.name,'Fusuma head rail');
 const first=hits[0].distance,front=new Set(hits.filter(h=>Math.abs(h.distance-first)<1e-6).map(h=>h.object));
 assert.equal(front.size,1,'the rail end has a single visible face owner');
 const panel=hits.find(h=>h.object.name==='Partition');assert.ok(panel&&panel.distance-first>.015,'paper ends behind the rail cap');
});
test('full-height partition and doorway beam junctions contain one exterior surface',()=>{
 // Probe inside the overlap, away from a legitimate shared triangle edge.
 for(const [kind,points] of [['red-tile',[[.005,-.395],[.605,-.405],[-2.195,-1.455]]],['concrete',[[.005,-.605],[.755,1.205],[1.755,1.205]]]]){
  const room=new THREE.Group();buildFamilyHome({room,household:{members:[{name:'A',purpose:'farmer'}]},kind,reg(){},action(){}});room.updateMatrixWorld(true);
  const partitions=[];room.traverse(o=>{if(o.userData.partitionSurface)partitions.push(o);});
  for(const [x,z] of points){
   const ray=new THREE.Raycaster(new THREE.Vector3(x,3,z),new THREE.Vector3(0,-1,0)),hits=ray.intersectObjects(partitions,false);
   assert.ok(hits.length,kind+' retains the solid partition top');
   const front=new Set(hits.filter(h=>Math.abs(h.distance-hits[0].distance)<1e-6).map(h=>h.object));
   assert.equal(front.size,1,kind+' junction has one exposed face rather than overlapping partition/beam tops');
  }
 }
});
