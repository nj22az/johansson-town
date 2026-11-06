import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildCompactShop} from '../src/world/interiors/compact-shops.js';
import {createBusinesses} from '../src/world/businesses.js';
import {DOCK_WORKSHOP,DOCK_WORKSHOP_ROOM} from '../src/world/dock-workshop-layout.js';
import {MOTOR_BENCH} from '../src/workshop/motor-bench.js';
import {TETSUO_KIT,TETSUO_COLLIDERS,TETSUO_BENCH,KIT,PSU_STEPS,SCOPE_MODES,createBenchState,benchOutputs,operateKit,kitLabel} from '../src/workshop/tetsuo-bench.js';
import {BUDGETS} from '../src/edition.js';
import {createNavigation} from '../src/people/navmesh.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {circleHitsRect,sweepFraction} from '../physics.js';

/**
 * Tetsuo's electrical bench (src/workshop/tetsuo-bench.js), the owner's diorama of 20 October 2026 translated to a 1997
 * Okinawan electrician's workshop: every piece has an owner and a reason, the room keeps its door, its aisle and its
 * workers' points clear, and the web shows the bench at work while only Linux works it (edition.js `machinery`).
 */
const JP=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,PLAYER=.28,NPC=.35;
function room(budget=BUDGETS.linux){
 installDOM();
 const site={...createBusinesses().find(s=>s.id==='form3d'),...DOCK_WORKSHOP},group=new THREE.Group(),colliders=[],anchors=[],actions=[];
 const layout=buildCompactShop({site,room:group,reg:(o,label,fn,inside)=>{o.userData.hit={label,fn,inside};anchors.push(o);},collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height}),action:(...a)=>actions.push(a),exit(){}});
 // The shop builds with the page's edition; the bench is rebuilt here with the edition under test.
 if(budget!==BUDGETS.linux){layout.tetsuo.group.parent.remove(layout.tetsuo.group);for(let i=anchors.length-1;i>=0;i--)if(anchors[i].userData.tetsuoKit)anchors.splice(i,1);}
 const blocked=(x,z,r=PLAYER)=>suppliedRoomBoundsBlocked(layout,x,z,r)||colliders.some(c=>circleHitsRect(x,z,r,c));
 return {group,layout,colliders,anchors,actions,blocked};
}
async function webRoom(){
 const r=room(BUDGETS.web);const {buildTetsuoBench}=await import('../src/workshop/tetsuo-bench.js');
 const bench=buildTetsuoBench({room:r.group,collider(){},reg:(o,label,fn,inside)=>{o.userData.hit={label,fn,inside};r.anchors.push(o);},action:(...a)=>r.actions.push(a),budget:BUDGETS.web,sound:null});
 return {...r,bench};
}
const prompt=(r,id)=>r.anchors.find(o=>o.userData.tetsuoKit===id);

test('every piece of the bench is data with an owner, a reason, a period note and a Japanese label',()=>{
 const r=room();
 try{
  assert.ok(TETSUO_KIT.length>=16);assert.equal(new Set(TETSUO_KIT.map(k=>k.id)).size,TETSUO_KIT.length);
  for(const k of TETSUO_KIT){
   assert.ok(['Tetsuo','workshop'].includes(k.owner),k.id+' has an owner');
   assert.ok(k.why.length>=80&&!JP.test(k.why),k.id+' says in English why it is there');
   assert.ok(k.period.length>=40,k.id+' has its period note');assert.ok(JP.test(k.jp),k.id+' carries its Japanese label');
   assert.ok(r.group.getObjectByName(k.mesh),k.id+' is in the room as '+k.mesh);
  }
  for(const id of ['bench','mat','radio','scope','psu','iron','meter','lamp','drawer','pegboard','supply','board','fan','rack','stool','tubes'])assert.ok(KIT[id],id);
  // The kit's moving parts are named, so the room, the film and the tests can switch them.
  for(const name of ['Isolating switch lever','Lock-out tag','Exhaust fan blades','Bench tool drawer','Soldering iron','Oscilloscope CRT screen','Multimeter display','Arm lamp pool on the mat'])assert.ok(r.group.getObjectByName(name),name);
  // Prompts are English, held by Tetsuo, in reach of the floor, and never two in the same line of sight.
  const kitPrompts=r.anchors.filter(o=>o.userData.tetsuoKit);
  assert.equal(kitPrompts.length,TETSUO_KIT.filter(k=>k.where).length);
  for(const o of r.anchors)assert.ok(!JP.test(o.userData.hit.label),o.userData.hit.label);
  for(const o of kitPrompts)assert.deepEqual(o.userData.workers,['Tetsuo']);
  const bench=kitPrompts.filter(o=>o.position.z<-2.6&&o.position.x<2.7).map(o=>o.position.x).sort((a,b)=>a-b);
  for(let i=1;i<bench.length;i++)assert.ok(bench[i]-bench[i-1]>=.299,'bench prompts stand apart: '+bench.join(', '));
 }finally{r.layout.dispose();}
});

test('the bench, the stool, the rack and the board are solid, inside the room and clear of the door and the motor bench',()=>{
 const r=room();
 try{
  const {minX,maxX,minZ,maxZ}=DOCK_WORKSHOP_ROOM.bounds;
  for(const c of TETSUO_COLLIDERS){
   assert.ok(r.colliders.some(b=>Math.abs(b.x-c.x)<.01&&Math.abs(b.z-c.z)<.01&&Math.abs(b.w-c.w)<.01&&Math.abs(b.d-c.d)<.01&&b.height>=c.height-.01),c.id+' is a collider');
   assert.ok(c.x-c.w/2>=minX-.02&&c.x+c.w/2<=maxX+.02&&c.z-c.d/2>=minZ-.02&&c.z+c.d/2<=maxZ+.02,c.id+' inside the walls');
   assert.ok(c.z+c.d/2<MOTOR_BENCH.z-MOTOR_BENCH.depth/2-.9,c.id+' leaves the aisle in front of the motor bench');
  }
  // The bench's own measures (the town's and New Yokosuka's work tops are 0.8–0.9 m).
  assert.ok(TETSUO_BENCH.top>=.8&&TETSUO_BENCH.top<=.9);assert.ok(TETSUO_BENCH.why.length>60);
  // No new light: the room keeps its sky light and its one point light; the lamp is a pool and a lit bulb.
  let lights=0,kitLights=0;r.group.traverse(o=>{if(o.isLight)lights++;});r.layout.tetsuo.group.traverse(o=>{if(o.isLight)kitLights++;});
  assert.equal(lights,2);assert.equal(kitLights,0);
  // Static parts are merged: the corner draws in a few dozen calls, not hundreds.
  let draws=0;r.layout.tetsuo.group.traverse(o=>{if(o.isMesh)draws++;});assert.ok(draws<=60,'draw calls '+draws);
 }finally{r.layout.dispose();}
});

test('the player walks from the door to every prompt at the bench, the board and the rack; the workers’ points are clear',()=>{
 const r=room();
 try{
  const L=r.layout,nav=createNavigation(r.blocked,{step:.08,heightAt:()=>0,bounds:L.bounds,radius:PLAYER}),start={x:L.spawn[0],z:L.spawn[2]};
  assert.equal(r.blocked(start.x,start.z),false,'the spawn inside the door');
  assert.equal(sweepFraction({x:0,z:3.2},{x:0,z:1.6},r.blocked),1,'the doorway approach');
  for(const [name,[x,,z]] of Object.entries(L.staff))assert.equal(r.blocked(x,z,NPC),false,name+'’s work point');
  // Every kit prompt has a clear floor spot within its reach that the player can walk to from the door.
  for(const o of r.anchors.filter(a=>a.userData.tetsuoKit)){
   const p=o.position,reach=o.userData.reach;let best=null;
   for(let x=-4;x<=4;x+=.08)for(let z=-3.4;z<=3.4;z+=.08){const d=Math.hypot(x-p.x,p.y,z-p.z);if(d<=reach&&!r.blocked(x,z)&&(!best||d<best.d))best={x,z,d};}
   assert.ok(best,o.userData.hit.label+' has a spot in reach');
   const path=nav.path(start,{x:best.x,z:best.z});assert.ok(path&&Math.hypot(path.at(-1)[0]-best.x,path.at(-1)[1]-best.z)<.12,o.userData.hit.label+' is reached on foot');
  }
  // The front of the bench is a seat's width from the stool: Tetsuo's mat is reached standing.
  assert.equal(r.blocked(1.44,-2.4),false);assert.equal(r.blocked(1.82,-2.4),false);
 }finally{r.layout.dispose();}
});

test('the web edition shows the bench at work and operates nothing',async()=>{
 const r=await webRoom();
 try{
  const t=r.bench,before=JSON.stringify(t.state);assert.equal(t.edition,'web');
  const out=benchOutputs(t.state);assert.equal(out.lampLit,true);assert.equal(out.scopeOn,true);assert.equal(t.state.heat,1);assert.equal(out.pilot,'red');
  for(const k of TETSUO_KIT.filter(k=>k.where)){
   const o=r.anchors.find(a=>a.userData.tetsuoKit===k.id&&a.parent===t.group);assert.match(o.userData.hit.label,/^Look at the /);
   r.actions.length=0;o.userData.hit.fn();
   assert.equal(JSON.stringify(t.state),before,k.id+' changes nothing on the web');
   const [kind,title,text]=r.actions.at(-1);assert.equal(kind,'inspect');assert.equal(title,k.en);assert.ok(text.includes(k.why));
  }
  for(let i=0;i<30;i++)t.update(.2);
  assert.equal(JSON.stringify({...t.state,heat:1}),before,'nothing drifts on the web');
  assert.equal(t.group.getObjectByName('Lock-out tag').visible,false);
  assert.equal(t.group.getObjectByName('Exhaust fan blades').rotation.z,0,'the fan stands still');
  assert.equal(operateKit(createBenchState(),'supply',{machinery:false}).changed,false);
 }finally{r.bench.dispose();r.layout.dispose();}
});

test('the Linux edition works the bench from one small state object',()=>{
 const r=room(BUDGETS.linux);
 try{
  const t=r.layout.tetsuo,s=t.state,use=id=>prompt(r,id).userData.hit.fn();assert.equal(t.edition,'linux');
  assert.equal(prompt(r,'supply').userData.hit.label,'Switch off the bench supply');
  use('scope');assert.equal(s.scope,1);use('psu');assert.equal(s.psu,1);assert.equal(benchOutputs(s).meter,PSU_STEPS[1].volts.toFixed(2));
  use('drawer');assert.equal(s.drawer,true);const drawer=t.group.getObjectByName('Bench tool drawer'),shut=drawer.position.z;
  for(let i=0;i<20;i++)t.update(.05);assert.ok(drawer.position.z-shut>.2,'the drawer runs out');
  use('fan');assert.equal(s.fan,false);use('fan');const blades=t.group.getObjectByName('Exhaust fan blades'),a0=blades.rotation.z;t.update(.5);assert.notEqual(blades.rotation.z,a0,'the fan turns');
  // Isolate: the lever down, the tag on, the green lamp, and the bench's kit dead; the fan's branch is not the bench's.
  use('supply');assert.equal(s.supply,false);assert.equal(prompt(r,'supply').userData.hit.label,'Switch on the bench supply');
  const out=benchOutputs(s);assert.equal(out.pilot,'green');assert.equal(out.tagged,true);assert.equal(out.lampLit,false);assert.equal(out.scopeOn,false);assert.equal(out.meter,'0.00');assert.equal(out.fan,true);
  assert.equal(t.group.getObjectByName('Lock-out tag').visible,true);
  for(let i=0;i<60;i++)t.update(.25);assert.ok(s.heat<.05,'the iron cools');assert.ok(t.group.getObjectByName('Isolating switch lever').rotation.z>2,'the lever is down');
  r.actions.length=0;use('scope');assert.equal(s.scope,1,'a dead scope does not switch');assert.match(r.actions.at(-1)[2],/bench supply is off/);
  use('lamp');assert.equal(s.lamp,false);use('lamp');use('iron');use('iron');
  use('supply');for(let i=0;i<30;i++)t.update(.25);assert.ok(s.heat>.95,'the iron heats again');assert.equal(benchOutputs(s).lampLit,true);
  // The scope's modes and the supply's steps go round.
  for(let i=0;i<SCOPE_MODES.length;i++)use('scope');assert.equal(s.scope,1);for(let i=0;i<PSU_STEPS.length;i++)use('psu');assert.equal(s.psu,1);
  assert.equal(kitLabel('psu',s,{machinery:false}),'Look at the bench power supply');
 }finally{r.layout.dispose();}
});
