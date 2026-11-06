import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {installDOM,Element} from './fixtures.mjs';
import {buildFerryModel} from '../src/world/ferry-model.js';
import {createPlant} from '../src/world/ferry-plant.js';
import {FERRY_ELECTRICS} from '../src/world/ferry-ship.js';
import {BRIDGE_LANTERN_PLAN as PLAN} from '../src/world/ferry-bridge-lantern-plan.js';
installDOM();
const file=new URL('../assets/models/ferry-bridge/navigation-feeder-v2.glb',import.meta.url);
const load=async()=>{const b=await readFile(file);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
test('native feeder replaces practice equipment with actual ESB branch and existing starboard lamp',async()=>{
 const {scene}=await load(),meshes=[];scene.traverse(o=>{if(o.isMesh)meshes.push(o);});assert.equal(meshes.length,2);
 assert.ok(meshes.reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0)<12000);assert.ok((await readFile(file)).length<200000);
 assert.equal(PLAN.supply.volts,105);assert.equal(PLAN.supply.kind,'AC');assert.equal(PLAN.supply.hz,FERRY_ELECTRICS.hz);assert.equal(PLAN.supply.board,'ESB');assert.match(PLAN.supply.system,/neither conductor is DC negative/);
 const next=new Map(PLAN.connections);let at='ESB.105.A';for(let i=0;i<10;i++)at=next.get(at);assert.equal(at,'ESB.105.B');
 assert.ok(!PLAN.parts.some(q=>/battery|tray|practice/i.test(q.name)));assert.deepEqual(PLAN.lamp.p,[-4.18,1.315,-.25]);
 const f=buildFerryModel(),state=f.userData.bridgeEquipment.navigationFeeder;assert.equal(state.pending,null);assert.ok(!f.userData.bridgeEquipment.practiceCircuit);
 const starboard=f.getObjectByName('Starboard sidelight');assert.equal(starboard,state.lamp);assert.equal(starboard.userData.on,0x2aff70);
 const p=starboard.getWorldPosition(new THREE.Vector3()),panel=f.userData.bridgeEquipment.group.getWorldPosition(new THREE.Vector3());assert.ok(p.distanceTo(panel.clone().add(new THREE.Vector3(...PLAN.lamp.p)))<1e-8);
 for(const name of ['Masthead light','Port sidelight','Stern light'])assert.ok(f.getObjectByName(name));
});
test('navigation command follows real main supply loss and emergency restoration',()=>{
 const f=buildFerryModel(),p=createPlant({minutes:700});p.routine(700);p.tick(1);f.userData.readPlant(p.readings());f.userData.setNavigationLights(true);
 const lamp=f.userData.bridgeEquipment.navigationFeeder.lamp;assert.equal(lamp.material.color.getHex(),0x2aff70);
 p.openBreaker('gen1');p.openBreaker('gen2');f.userData.readPlant(p.readings());assert.equal(p.readings().board.live,false);assert.equal(p.readings().board.emergency,false);assert.equal(lamp.material.color.getHex(),0x333333);assert.equal(f.userData.bridgeEquipment.navigationFeeder.group.getObjectByName('Navigation double-pole switch 0').rotation.x,-.45,'power loss does not move the commanded switch');
 p.tick(44/60);f.userData.readPlant(p.readings());assert.equal(p.readings().board.emergency,false);assert.equal(lamp.material.color.getHex(),0x333333,'emergency supply is not ready before45s');p.tick(2/60);f.userData.readPlant(p.readings());assert.equal(p.readings().board.emergency,true);assert.equal(lamp.material.color.getHex(),0x2aff70,'retained command resumes from ESB emergency source');
 f.userData.setNavigationLights(false);assert.equal(lamp.material.color.getHex(),0x333333);
});
test('lazy native replacement preserves command and fallback survives offline',async()=>{
 const old=globalThis.fetch;let requests=0;
 try{const bytes=await readFile(file);globalThis.fetch=async()=>{requests++;return new Response(bytes);};const f=buildFerryModel(),s=f.userData.bridgeEquipment.navigationFeeder;f.userData.setNavigationLights(true);const a=s.ensure();assert.equal(a,s.ensure());assert.equal(await a,true);assert.equal(requests,1);assert.equal(s.meshes,2);
 const native=s.group.getObjectByName('Starboard_sidelight');assert.equal(native.material.color.getHex(),0x2aff70);f.userData.setNavigationLights(false);assert.equal(native.material.color.getHex(),0x333333);
 globalThis.fetch=async()=>{throw Error('offline');};const failed=buildFerryModel().userData.bridgeEquipment.navigationFeeder;assert.equal(await failed.ensure(),false);assert.ok(failed.group.getObjectByName('Navigation feeder fallback'));
 }finally{globalThis.fetch=old;}
});

test('operator-facing canvas labels map to actual physical switch centers',()=>{
 const old=Element.prototype.getContext,records=new WeakMap();
 Element.prototype.getContext=function(...args){const ctx=old.apply(this,args),calls=[];records.set(this,calls);ctx.fillText=(text,x,y)=>calls.push({text,x,y});return ctx;};
 try{
  const f=buildFerryModel(),g=f.userData.bridgeEquipment.navigationFeeder.group;f.updateMatrixWorld(true);
  const label=g.getObjectByName('Navigation light panel markings'),canvas=label.material.map.image;
  const calls=records.get(canvas),names=['STBD','PORT','MASTHEAD','STERN'];
  for(let i=0;i<names.length;i++){
   const call=calls.find(c=>c.text===names[i]);assert.ok(call);
   const point=new THREE.Vector3((call.x/canvas.width-.5)*label.geometry.parameters.width,(.5-call.y/canvas.height)*label.geometry.parameters.height,0).applyMatrix4(label.matrixWorld);
   const pivot=g.getObjectByName('Navigation double-pole switch '+i).getWorldPosition(new THREE.Vector3());
   assert.ok(Math.abs(point.x-pivot.x)<.001,names[i]+' label belongs over its actual channel');
   assert.ok(point.y<pivot.y&&point.y>pivot.y-.08,'channel label is below lever and above fuse caps');
  }
 }finally{Element.prototype.getContext=old;}
});

test('lantern screen plates meet without overlapping coplanar top faces',()=>{
 const a=PLAN.parts.find(p=>p.name==='L1_inboard_screen'),b=PLAN.parts.find(p=>p.name==='L1_aft_screen');
 const overlap=a.d.map((d,i)=>Math.min(a.p[i]+d/2,b.p[i]+b.d[i]/2)-Math.max(a.p[i]-d/2,b.p[i]-b.d[i]/2));
 assert.ok(overlap.some(d=>d<1e-10),'screen plate volumes must not overlap');
 assert.ok(Math.abs(a.p[2]-a.d[2]/2-(b.p[2]+b.d[2]/2))<1e-10,'inboard screen ends exactly at aft screen face');
});

test('replacement sidelight has no intersecting legacy starboard sector board',()=>{
 const f=buildFerryModel(),b=f.userData.bridgeEquipment.group;f.updateMatrixWorld(true);
 const origin=b.getWorldPosition(new THREE.Vector3()),point=new THREE.Vector3();let legacyCorner=false;
 f.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let i=0;i<p.count;i++){
  point.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld).sub(origin);
  if(Math.abs(point.x+4.095)<1e-5&&Math.abs(point.y-1.45)<1e-5&&Math.abs(point.z+.9)<1e-5)legacyCorner=true;
 }});
 assert.equal(legacyCorner,false,'the original overlapping black screen must be removed when its fixture is replaced');
});
