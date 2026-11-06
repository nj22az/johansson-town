import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import * as THREE from '../vendor/three.module.js';
import {createFerryFixedCamera} from '../src/render/ferry-fixed-camera.js';
import {ferryShotAt,h1ToLocal,FERRY_H1_SHOTS} from '../src/world/ferry-engine-room-plan.js';

test('locked ferry shot follows translation, yaw, pitch and roll; ordinary lens restores on exit',()=>{
 const camera=new THREE.PerspectiveCamera(57,1.6,.05,100);camera.zoom=1.1;
 const ship=new THREE.Group();ship.position.set(10,3,-7);ship.rotation.set(.08,.72,-.06);ship.updateMatrixWorld(true);
 const lock=createFerryFixedCamera(camera),position=ship.localToWorld(new THREE.Vector3(0,-1,11-17.25));
 assert.equal(lock.sync({ship,position,deck:{floor:{id:'engine-room'}}}),true);lock.apply();
 const wanted=ship.localToWorld(new THREE.Vector3(...h1ToLocal(FERRY_H1_SHOTS[0].pos)));
 assert.ok(camera.position.distanceTo(wanted)<1e-9);assert.equal(lock.id,'engines-aft');
 lock.sync({ship,position,deck:{floor:{id:'engine-room'}},override:true});assert.equal(lock.apply(),false,'explicit view override wins');
 lock.sync({ship,position,deck:{floor:{id:'car-deck'}}});assert.equal(camera.fov,57);assert.equal(camera.zoom,1.1);
});

test('automatic cuts have hysteresis and held movement keeps its direction until release',()=>{
 const camera=new THREE.PerspectiveCamera(55,1.6,.05,100),ship=new THREE.Group();ship.updateMatrixWorld(true);
 const lock=createFerryFixedCamera(camera),deck={floor:{id:'engine-room'}};
 lock.sync({ship,position:new THREE.Vector3(0,-1,11-17.25),deck});const first=lock.heading(true);
 lock.sync({ship,position:new THREE.Vector3(0,-1,13-17.25),deck});assert.equal(lock.id,'engines-fore');assert.equal(lock.heading(true),first);
 const released=lock.heading(false);assert.notEqual(released,first);
 assert.equal(ferryShotAt('engine-room',[0,-1,12.3-17.25],'engines-aft').id,'engines-aft');
 assert.equal(ferryShotAt('engine-room',[0,-1,12-17.25],'engines-fore').id,'engines-fore');
 assert.equal(ferryShotAt('workshop',[0,-1,19.3-17.25]).id,'workshop-entry');
 assert.equal(ferryShotAt('workshop',[0,-1,20.5-17.25],'workshop-entry').id,'workshop-entry');
 assert.equal(ferryShotAt('workshop',[0,-1,20.7-17.25],'workshop-entry').id,'workshop');
});

test('representative walking positions keep head and feet framed on desktop and portrait screens',()=>{
 const stops=[[11.1,0,.9],[13.1,0,.9],[9.2,-3.1,.9],[16.7,0,.9],[21,0,.9],[21.4,-1.4,.9],[24,0,.9],[19.3,0,.9]];
 for(const [i,s]of FERRY_H1_SHOTS.entries())for(const aspect of [1.5,390/716]){
  const c=new THREE.PerspectiveCamera(Math.min(84,s.fov+(aspect<1?13:0)),aspect,.15,100);
  c.position.set(...h1ToLocal(s.pos));c.lookAt(new THREE.Vector3(...h1ToLocal(s.at)));c.updateMatrixWorld();
  for(const height of [0,1.82]){const p=new THREE.Vector3(...h1ToLocal(stops[i]));p.y+=height;p.project(c);assert.ok(Math.max(Math.abs(p.x),Math.abs(p.y))<.94,`${s.id} / ${aspect}: ${p.toArray()}`);}
 }
});

test('ordinary play enables CAD headroom, deck stack, service openings and fixed lenses',()=>{
 const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
 globalThis.location=new URL('https://example.test/');
 const {FERRY_INTERIOR:i,FERRY_ENGINE_ROOM:r}=await import('./src/world/ferry-interior.js');
 const {FERRY_HEIGHTS:h}=await import('./src/world/ferry-ship.js');
 const {FERRY_H1_SHOTS,h1ToLocal}=await import('./src/world/ferry-engine-room-plan.js');
 const T=await import('./vendor/three.module.js');const {createFerryRun}=await import('./src/world/ferry.js');const {createFerryWalk}=await import('./src/world/ferry-walk.js');
 const run=createFerryRun({parent:new T.Group(),colliders:[]});run.parkAt('town');run.update(.01,600,0);const walk=createFerryWalk(run);walk.update();
 const poses=[[11.1,0,.9],[13.1,0,.9],[9.2,-3.1,.9],[16.7,0,.9],[21,0,.9],[21.4,-1.4,.9],[24,0,.9],[19.3,0,.9]];const poseClear=poses.map(q=>{const p=run.ferry.localToWorld(new T.Vector3(...h1ToLocal(q)));return !walk.blocked(p.x,p.y,p.z,.28,1.82);});
 const blocked=p=>i.boxes.some(b=>b.camera&&p.every((v,k)=>v>=Math.min(b.a[k],b.b[k])-.12&&v<=Math.max(b.a[k],b.b[k])+.12));
 const railAt=(x,z)=>i.boxes.some(b=>b.name==='engine rail'&&x>Math.min(b.a[0],b.b[0])-.01&&x<Math.max(b.a[0],b.b[0])+.01&&z>Math.min(b.a[2],b.b[2])&&z<Math.max(b.a[2],b.b[2]));
 console.log(JSON.stringify({poseClear,height:r.deckhead-r.floor,car:h.carDeck,pass:h.passengerDeck,ladderRun:r.ladder.foot-r.ladder.head,lenses:FERRY_H1_SHOTS.map(s=>!blocked(h1ToLocal(s.pos))),serviceOpen:[-1,1].map(s=>!railAt(s*.65,10.8-17.25)),grating:i.boxes.filter(b=>b.name==='bearing grating bar').length}));
 `],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
 assert.equal(result.height,2.7);assert.equal(result.car,4);assert.equal(result.pass,8.4);assert.ok(Math.abs(result.ladderRun-2.2)<1e-9);
 assert.ok(result.poseClear.every(Boolean),'Every review placement clears a 1.82 m standing body');assert.ok(result.lenses.every(Boolean));assert.deepEqual(result.serviceOpen,[true,true]);assert.ok(result.grating>50);
});

test('H1 access uses the relocated side door and full top landing, then returns to the car deck',()=>{
 const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
 globalThis.location=new URL('https://example.test/');
 const T=await import('./vendor/three.module.js');const {createFerryRun}=await import('./src/world/ferry.js');const {createFerryWalk}=await import('./src/world/ferry-walk.js');
 const run=createFerryRun({parent:new T.Group(),colliders:[]});run.parkAt('town');run.update(1/60,600,0);const walk=createFerryWalk(run);walk.update();
 const point=(X,Y,Z)=>run.ferry.localToWorld(new T.Vector3(Y,Z-1.9,X-17.25));
 let p=point(5.85,2.3,4),ids=new Set(),failure=null;
 const path=[[5.85,3.55,4],[6.3,3.55,4],[8.65,3.55,.9],[9.6,3.55,.9],[9.65,3.1,.9],[10.5,2.9,.9],[13.68,2.9,.9],[13.68,0,.9],[17,0,.9],[19.8,0,.9],[21.2,1.5,.9],[19.8,0,.9],[17,0,.9],[13.68,0,.9],[13.68,2.9,.9],[10.5,2.9,.9],[9.65,3.1,.9],[9.6,3.55,.9],[8.65,3.55,.9],[6.3,3.55,4],[5.85,3.55,4],[5.85,2.3,4]];
 outer:for(const q of path){const target=point(...q);for(let i=0;i<1000&&Math.hypot(target.x-p.x,target.z-p.z)>.01;i++){
  const dist=Math.hypot(target.x-p.x,target.z-p.z),d=Math.min(.025,dist),x=p.x+(target.x-p.x)/dist*d,z=p.z+(target.z-p.z)/dist*d,m=walk.move(p.x,p.y,p.z,x,z,.28);
  if(!m?.ok){failure={at:walk.local('ship',p.x,p.y,p.z),floor:m?.floor.id};break outer;}ids.add(m.floor.id);p.set(x,m.y,z);
 }}console.log(JSON.stringify({failure,ids:[...ids],endHeight:run.ferry.worldToLocal(p).y+1.9}));
 `],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
 assert.equal(result.failure,null,JSON.stringify(result.failure));
 for(const id of ['er-entrance','er-ladder','engine-room','aux-room','workshop'])assert.ok(result.ids.includes(id),id);
 assert.ok(Math.abs(result.endHeight-4)<.02);
});

test('the shipped Blender GLB keeps CAD units, source bounds and finite normals within two surface groups',async()=>{
 const bytes=readFileSync(new URL('../assets/models/ferry-engine-room/minato-engine-room-h1-f1.glb',import.meta.url));
 const {scene}=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});assert.equal(meshes.length,2);
 const bounds=new THREE.Box3().setFromObject(scene),source=JSON.parse(readFileSync(new URL('../art/ferry-engine-room/geometry-h1.json',import.meta.url)));
 for(const b of source.boxes)for(const p of [b.a,b.b])assert.ok(bounds.clone().expandByScalar(.00001).containsPoint(new THREE.Vector3(...p)),b.name||'CAD box');
 let triangles=0;
 for(const mesh of meshes){
  const {normal:n,position:p,color:c}=mesh.geometry.attributes;
  assert.equal(c.normalized,true);assert.ok(c.array instanceof Uint8Array);assert.equal(mesh.geometry.attributes.uv,undefined);
  for(let i=0;i<p.count;i++){assert.ok(Number.isFinite(p.getX(i)+p.getY(i)+p.getZ(i)));assert.ok(Math.abs(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))-1)<.002);}
  triangles+=mesh.geometry.index.count/3;
 }
 assert.ok(triangles<100_000);
 for(const [i,v]of meshes.map(m=>m.material.metalness).sort().entries())assert.ok(Math.abs(v-[.05,.55][i])<1e-6);
 assert.ok(bounds.getSize(new THREE.Vector3()).x>7.9);assert.ok(bytes.length<4_000_000);
 const audit=JSON.parse(readFileSync(new URL('../docs/qa/ferry-engine-room-h1/blender-finish-audit.json',import.meta.url)));
 assert.equal(audit.outward_faces_failed,0);assert.ok(audit.outward_faces_checked>10_000);assert.equal(audit.source_components,1290);
});

test('raised-deck boarding meets the pier and the forward crew station remains on its actual floor',()=>{
 const result=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`
 globalThis.location=new URL('https://example.test/');
 const T=await import('./vendor/three.module.js');const {createFerryRun}=await import('./src/world/ferry.js');const {GANGWAY_LENGTH}=await import('./src/world/ferry-model.js');
 const {createFerryWalk}=await import('./src/world/ferry-walk.js');const {CREW_POSTS}=await import('./src/people/ferry-crew-aboard.js');const {groundHeight}=await import('./src/world/layout.js');
 const run=createFerryRun({parent:new T.Group(),colliders:[]});run.parkAt('town');run.update(1/60,600,0);run.ferry.updateMatrixWorld(true);
 const toe=run.ferry.userData.gangway.localToWorld(new T.Vector3(GANGWAY_LENGTH,.03,0));const walk=createFerryWalk(run);walk.update();
 const p=run.ferry.localToWorld(new T.Vector3(...CREW_POSTS.bow.pos));
 const door=run.ferry.localToWorld(new T.Vector3(-2.95,-1,10.9-17.25));
 const {AIRPORT_FERRY_PORTS}=await import('./src/world/airport-ferry.js');const shore=AIRPORT_FERRY_PORTS.town,landing=walk.floorAt(shore.landing[0],shore.landing[1],shore.height,.3);
 const {FERRY_LADDER}=await import('./src/world/ferry-inspect.js');const {OPENINGS}=await import('./src/world/openings.js');const opening=OPENINGS.find(o=>o.id==='ferry');
 const ladderLandingsClear=Object.values(FERRY_LADDER).every(l=>{const p=run.ferry.localToWorld(new T.Vector3(...l.to));return !walk.blocked(p.x,p.y,p.z,.28,1.82);});
 console.log(JSON.stringify({length:GANGWAY_LENGTH,toeGap:toe.y-groundHeight(toe.x,toe.z),station:walk.move(p.x,p.y,p.z,p.x,p.z,.18)?.ok,helmetDoorClear:!walk.blocked(door.x,door.y,door.z,.28,2),shoreIsGangway:landing?.floor.part==='gangway',ladderLandingsClear,openingMatchesShore:opening.stand.every((v,i)=>Math.abs(v-shore.landing[i])<1e-8)}));
 `],{cwd:new URL('..',import.meta.url),encoding:'utf8'}));
 assert.equal(result.length,4);assert.ok(Math.abs(result.toeGap)<.001);assert.equal(result.station,true);assert.equal(result.shoreIsGangway,false,'The waiting point is beyond the gangway foot');assert.equal(result.ladderLandingsClear,true,'Both ladder prompt destinations clear the standing body');assert.equal(result.openingMatchesShore,true,'Ferry arrivals use the safe shore point');assert.equal(result.helmetDoorClear,true,'2 m standing envelope clears the control-booth door');
});
