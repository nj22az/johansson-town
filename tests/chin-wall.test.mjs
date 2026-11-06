import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildCompactShop} from '../src/world/interiors/compact-shops.js';
import {createBusinesses} from '../src/world/businesses.js';
import {DOCK_WORKSHOP,DOCK_WORKSHOP_ROOM} from '../src/world/dock-workshop-layout.js';
import {CHIN_KIT,CHIN_KIT_BY_ID,CHIN_COLLIDERS,CHIN_WALL,CHIN_JOBS,JONSSON_POSTER,chinKitText} from '../src/workshop/chin-wall.js';
import {TETSUO_COLLIDERS} from '../src/workshop/tetsuo-bench.js';
import {MOTOR_BENCH} from '../src/workshop/motor-bench.js';
import {CAST} from '../src/people/cast.js';
import {createNavigation} from '../src/people/navmesh.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {circleHitsRect,sweepFraction} from '../physics.js';
import {existsSync} from 'node:fs';

/**
 * Chin's west wall in the dock workshop (src/workshop/chin-wall.js): the mechanical half of Chin & Tetsuo Repairs, dressed
 * as a 1997 Okinawan boat mechanic's wall, every piece with an owner and a reason; the Jonsson figure that knelt on the
 * floor is a poster now (the owner, 20 October 2026), and the floor where it stood is clear.
 */
const JP=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u,PLAYER=.28,NPC=.35;
function room(){
 installDOM();
 const site={...createBusinesses().find(s=>s.id==='form3d'),...DOCK_WORKSHOP},group=new THREE.Group(),colliders=[],anchors=[],actions=[];
 const layout=buildCompactShop({site,room:group,reg:(o,label,fn,inside)=>{o.userData.hit={label,fn,inside};anchors.push(o);},collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height}),action:(...a)=>actions.push(a),exit(){}});
 const blocked=(x,z,r=PLAYER)=>suppliedRoomBoundsBlocked(layout,x,z,r)||colliders.some(c=>circleHitsRect(x,z,r,c));
 return {group,layout,colliders,anchors,actions,blocked};
}

test('every piece of Chin’s wall is data with an owner, a reason, a period note and a Japanese label',()=>{
 const r=room();
 try{
  for(const id of ['board','shelf','calendar','whiteboard','poster','outboard','extinguisher'])assert.ok(CHIN_KIT_BY_ID[id],id);
  assert.equal(new Set(CHIN_KIT.map(k=>k.id)).size,CHIN_KIT.length);
  for(const k of CHIN_KIT){
   assert.ok(['Chin','workshop'].includes(k.owner),k.id+' has an owner');
   assert.ok(k.why.length>=80&&!JP.test(k.why),k.id+' says in English why it is there');
   assert.ok(k.period.length>=40,k.id+' has its period note');assert.ok(JP.test(k.jp),k.id+' carries its Japanese label');
   assert.ok(r.group.getObjectByName(k.mesh),k.id+' is in the room as '+k.mesh);
  }
  assert.ok(CHIN_WALL.why.length>60);
  // The job board is in English, its boats and things are residents' and the town's, dated October 1997.
  const living=new Set(CAST.map(p=>p.name));
  for(const j of CHIN_JOBS){assert.match(j.date,/^10\/\d\d$/);assert.ok(!JP.test(j.job),j.job);}
  for(const name of ['Kōji','Vy'])assert.ok(living.has(name)&&CHIN_JOBS.some(j=>j.job.includes(name)),name);
  assert.equal(CHIN_JOBS.filter(j=>j.now).length,1,'one job is on the stand');assert.match(CHIN_JOBS.find(j=>j.now).job,/outboard/);
  assert.ok(JP.test(JONSSON_POSTER.jp)&&!JP.test(JONSSON_POSTER.title+JONSSON_POSTER.sub+JONSSON_POSTER.dates));
  assert.ok(existsSync(new URL('../assets/graphics/workshop/'+JONSSON_POSTER.file,import.meta.url)),'the poster is rendered');
 }finally{r.layout.dispose();}
});

test('the Jonsson figure is gone from the floor and his poster hangs on Chin’s wall',()=>{
 const r=room();
 try{
  assert.equal(r.group.getObjectByName('Jonsson'),undefined);assert.equal(r.layout.owned.length,0);
  for(const o of r.anchors)assert.ok(!/Talk to Jonsson/.test(o.userData.hit.label));
  assert.equal(r.colliders.some(c=>Math.abs(c.x+2.7)<.01&&Math.abs(c.z-.25)<.01),false,'no collider where the figure stood');
  for(const x of [-3.2,-2.7,-2.2])for(const z of [-.3,.25,.8])assert.equal(r.blocked(x,z),false,'the floor is clear at '+x+','+z);
  const poster=CHIN_KIT_BY_ID.poster,P=CHIN_WALL.poster;assert.equal(poster.owner,'Chin');assert.match(poster.why,/Jonsson/);assert.match(poster.why,/put/);
  assert.ok(P.y-P.height/2>=.9&&P.y+P.height/2<=2.0,'at eye height');
 }finally{r.layout.dispose();}
});

test('the wall’s solids are inside the room, clear of Tetsuo’s corner, the motor bench and the door, and the static parts are merged',()=>{
 const r=room();
 try{
  const {minX,maxX,minZ,maxZ}=DOCK_WORKSHOP_ROOM.bounds;
  for(const c of CHIN_COLLIDERS){
   assert.ok(r.colliders.some(b=>Math.abs(b.x-c.x)<.01&&Math.abs(b.z-c.z)<.01&&Math.abs(b.w-c.w)<.01&&Math.abs(b.d-c.d)<.01&&b.height>=c.height-.01),c.id+' is a collider');
   assert.ok(c.x-c.w/2>=minX-.02&&c.x+c.w/2<=maxX+.02&&c.z-c.d/2>=minZ-.02&&c.z+c.d/2<=maxZ+.02,c.id+' inside the walls');
   assert.ok(c.x+c.w/2<-3,c.id+' stands against the west wall');
   for(const t of [...TETSUO_COLLIDERS,{x:MOTOR_BENCH.x,z:MOTOR_BENCH.z,w:MOTOR_BENCH.width,d:MOTOR_BENCH.depth}])
    assert.ok(Math.abs(c.x-t.x)>(c.w+t.w)/2||Math.abs(c.z-t.z)>(c.d+t.d)/2,c.id+' clear of '+(t.id||'the motor bench'));
  }
  // Every mesh sits inside the room: nothing pokes through the west wall or the floor.
  const box=new THREE.Box3().setFromObject(r.layout.chin.group);
  assert.ok(box.min.x>=minX-.001&&box.min.y>=-.001&&box.max.y<=2.75&&box.min.z>=minZ&&box.max.z<=maxZ,JSON.stringify(box));
  // No lights, and three draws: painted parts, metal, and every print on one canvas.
  let lights=0,draws=0;r.layout.chin.group.traverse(o=>{if(o.isLight)lights++;if(o.isMesh)draws++;});
  assert.equal(lights,0);assert.ok(draws<=3,'draw calls '+draws);
 }finally{r.layout.dispose();}
});

test('the player walks from the door to every prompt on the wall; Chin’s work point stays clear; every edition reads the same',()=>{
 const r=room();
 try{
  const L=r.layout,nav=createNavigation(r.blocked,{step:.08,heightAt:()=>0,bounds:L.bounds,radius:PLAYER}),start={x:L.spawn[0],z:L.spawn[2]};
  assert.equal(r.blocked(start.x,start.z),false);assert.equal(sweepFraction({x:0,z:3.2},{x:0,z:1.6},r.blocked),1,'the doorway approach');
  for(const [name,[x,,z]] of Object.entries(L.staff))assert.equal(r.blocked(x,z,NPC),false,name+'’s work point');
  const prompts=r.anchors.filter(a=>a.userData.chinKit);assert.equal(prompts.length,CHIN_KIT.length);
  const zs=prompts.map(o=>o.position.z).sort((a,b)=>a-b);for(let i=1;i<zs.length;i++)assert.ok(zs[i]-zs[i-1]>=.3,'prompts stand apart: '+zs.join(', '));
  for(const o of prompts){
   const p=o.position,reach=o.userData.reach;let best=null;
   for(let x=-4;x<=4;x+=.08)for(let z=-3.4;z<=3.4;z+=.08){const d=Math.hypot(x-p.x,p.y,z-p.z);if(d<=reach&&!r.blocked(x,z)&&(!best||d<best.d))best={x,z,d};}
   assert.ok(best,o.userData.hit.label+' has a spot in reach');
   const path=nav.path(start,{x:best.x,z:best.z});assert.ok(path&&Math.hypot(path.at(-1)[0]-best.x,path.at(-1)[1]-best.z)<.12,o.userData.hit.label+' is reached on foot');
   assert.deepEqual(o.userData.workers,['Chin']);assert.ok(!JP.test(o.userData.hit.label));assert.match(o.userData.hit.label,/^(Look at|Read) the /);
   // A read prompt on the web and on Linux alike: no machinery here.
   r.actions.length=0;o.userData.hit.fn();const [kind,title,text]=r.actions.at(-1),k=CHIN_KIT_BY_ID[o.userData.chinKit];
   assert.equal(kind,'inspect');assert.equal(title,k.en);assert.equal(text,chinKitText(k.id));
  }
 }finally{r.layout.dispose();}
});
