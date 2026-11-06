import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
installDOM();
// The bodies' idle movements draw on Math.random: seeded, so every run is the same one (BAR_SEED tries others).
{let seed=+(process.env.BAR_SEED||7);Math.random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};}
const {createBeerService,IZAKAYA_PLAYER_SEATS,NAO_STATION,DRINKS}=await import('../src/people/izakaya-beer.js');
const {buildMinatoBar,MINATO_BAR,BAR_ROUNDS}=await import('../src/world/interiors/minato-bar.js');
const {SHARED_DINING_COLLIDERS}=await import('../src/world/interiors/shared-dining-layout.js');
const {MINATO_FICTIONAL_SPIRITS}=await import('../src/world/interiors/izakaya-walnut.js');
const {createAvatarActor,updateAvatarActor}=await import('../src/avatars/actors.js');
import {readFile} from 'node:fs/promises';

/**
 * The owner, 21 October 2026: "it's better if the bottles in the izakaya bar desk is where Thao gets the drink for the
 * person who orders… now she just brings by magic". Every drink comes from where it is kept, the glass at your place is
 * the glass she took, her hands meet what they take, and nothing passes through the counter.
 */
const blocked=(x,z,r)=>SHARED_DINING_COLLIDERS.some(c=>Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
// Her body stepped in, against the stools as they are (cushion radius 0.195 m), not the walkers' 0.6 m squares.
const bodyBlocked=(x,z,r)=>SHARED_DINING_COLLIDERS.some(c=>c.id==='minato-stool'?Math.hypot(x-c.x,z-c.z)<.195+r:Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
function room(options={}){
 const root=new THREE.Group(),nao=new THREE.Group();nao.name='Thao';nao.position.set(...NAO_STATION);nao.rotation.y=Math.PI;root.add(nao);
 const bar=buildMinatoBar(root),service=createBeerService({room:root,getNao:()=>nao,bar,blocked,...options});
 return {root,nao,bar,service};
}
/** Runs the service until nothing is pending, calling `each` every frame; returns the steps in order. */
function run(service,each=()=>{},limit=90*30){
 const trail=[];for(let i=0;i<limit&&(service.pending||service.working);i++){service.update(1/30);const w=service.working;const key=w?.phase==='making'?(w.step!=='serve'?w.step:null):w?.phase;if(key&&trail.at(-1)!==key)trail.push(key);each(i);}
 return trail;
}

test('each drink comes from where it is kept, in a bartender’s order',()=>{
 const expect={draft:['rack','tap','pick'],awamori:['rack','set','shelf','pour','return','pick'],oolong:['rack','set','store','pour','return','pick'],bottle:['store','set','pour-own','pick'],can:['store'],sake:['warmer']};
 for(const kind of Object.keys(DRINKS)){
  const {service}=room();assert.equal(service.order(kind,IZAKAYA_PLAYER_SEATS.counter2),true,kind);
  const trail=run(service);
  assert.deepEqual(trail,[...expect[kind],'carrying','stepping','placing','bowing','leaving','returning'],kind);
  assert.deepEqual(BAR_ROUNDS[kind].slice(0,-1),expect[kind]);
  assert.equal(service.drink.kind,kind);assert.equal(service.drink.left,DRINKS[kind].sips,'a full '+kind);
 }
});

test('the glass on your table is the glass she took off the rack, and the rack is topped up when she is back',()=>{
 const {root,bar,service}=room(),seat=IZAKAYA_PLAYER_SEATS.counter2;
 const before=bar.counts['rack-awamori'];service.order('awamori',seat);
 let rackGlass=null,top=null;
 run(service,()=>{const held=root.getObjectByName('Thao').userData.workHeld?.R;if(held&&/Rack awamori/.test(held.name))rackGlass??=held;if(service.working?.step==='return'&&!top)top=bar.counts['rack-awamori'];});
 assert.ok(rackGlass,'she held a rack glass');assert.equal(top,before-1,'one gone from the rack while she works');
 const served=root.children.find(o=>/Rack awamori glass/.test(o.name)&&o.position.distanceTo(new THREE.Vector3(...seat.table))<.002);
 assert.equal(served,rackGlass,'that same glass is at your place');
 assert.equal(bar.counts['rack-awamori'],before,'a clean one back on the rack');
});

test('awamori is the back bar’s own Sango Quay, the bottle in use at the front of the back counter',async()=>{
 const report=JSON.parse(await readFile(new URL('../art/izakaya/walnut-runtime-report.json',import.meta.url))).exports[0].bottles;
 const bottle=report.find(b=>b.source===MINATO_BAR.shelf.source);
 assert.ok(MINATO_FICTIONAL_SPIRITS.some(b=>b.id===MINATO_BAR.shelf.brand&&b.spirit==='Awamori'),'the house awamori');
 assert.deepEqual(MINATO_BAR.shelf.bottle.map(v=>+v.toFixed(4)),[-2.1+bottle.position[0],.04+bottle.position[1],-3.42+bottle.position[2]].map(v=>+v.toFixed(4)),'the walnut export’s bottle 25');
 const {nao,bar,service}=room();service.order('awamori',IZAKAYA_PLAYER_SEATS.counter2);
 let poured=false;
 run(service,()=>{if(service.working?.step==='pour'&&nao.userData.workHeld?.R===bar.bottle.piece)poured=true;});
 assert.ok(poured,'she pours from that bottle');assert.ok(bar.bottle.piece.position.distanceTo(new THREE.Vector3(...MINATO_BAR.shelf.inUse))<1e-6,'and it stands back at the front of the back counter');
});

test('the cold store’s door opens for the can and shuts behind it',()=>{
 const {bar,service}=room();service.order('can',IZAKAYA_PLAYER_SEATS.counter2);
 let opened=0;run(service,()=>{opened=Math.max(opened,bar.doorOpen);});
 assert.ok(opened>.99,'open');assert.equal(bar.doorOpen,0,'shut');
});

test('her walk never enters the counter, the worktop, the back bar or the cold store',()=>{
 // Walking she keeps her walker's 0.3 m; stepped in to work, her body (0.13 m in front of her middle) still clears them.
 for(const place of ['rack','pour','tap','shelf','store','sink','warmer']){const [x,z]=MINATO_BAR[place].close;assert.equal(blocked(x,z,.13),false,place);}
 for(const seat of Object.values(IZAKAYA_PLAYER_SEATS))assert.equal(bodyBlocked(seat.close[0],seat.close[1],.13),false,seat.id);
 for(const kind of Object.keys(DRINKS)){
  for(const seat of ['table','counter0','counter4']){
  const {nao,service}=room();service.order(kind,IZAKAYA_PLAYER_SEATS[seat]);
  const inside=[];run(service,()=>{const w=service.working;if(w&&(w.close?bodyBlocked(nao.position.x,nao.position.z,.13):blocked(nao.position.x,nao.position.z,.3)))inside.push([w.phase,w.step,...nao.position.toArray().map(v=>+v.toFixed(2))]);});
  assert.deepEqual(inside.slice(0,4),[],kind+' to '+seat);
 }}
});

test('a resident’s drink is made the same way and set down at their place',()=>{
 const {service}=room();let got;
 const table=[IZAKAYA_PLAYER_SEATS.counter0.table[0],IZAKAYA_PLAYER_SEATS.counter0.table[1],IZAKAYA_PLAYER_SEATS.counter0.table[2]];
 assert.equal(service.request({kind:'draft',table,tag:'Tetsuo',onServed:p=>{got=p;}}),true);
 run(service);assert.ok(got&&/Rack draft glass/.test(got.name),'the rack’s mug');assert.ok(got.position.distanceTo(new THREE.Vector3(...table))<.002);
});

test('a drink for someone who has gone goes down the sink, and her hands give back what they took',()=>{
 const {nao,bar,service}=room();let got='never';
 service.request({kind:'awamori',table:IZAKAYA_PLAYER_SEATS.counter0.table,tag:'Mac',onServed:p=>{got=p;}});
 for(let i=0;i<30*12;i++)service.update(1/30);service.cancel('Mac');
 const trail=run(service);
 assert.ok(trail.includes('sink'),'down the sink: '+trail.join(' '));assert.equal(got,'never','nobody is served');
 assert.ok(bar.bottle.piece.position.distanceTo(new THREE.Vector3(...MINATO_BAR.shelf.inUse))<1e-6,'the bottle is back on the back counter');assert.equal(nao.userData.workHeld,undefined);
});

for(const [kind,seat] of [['awamori','counter2'],['draft','table'],['oolong','counter0'],['bottle','window'],['can','counter4'],['sake','counter1']])
test(`her hands meet what they take and nothing passes through the furniture: ${kind} to the ${seat}`,()=>{
 const {nao,service}=room({full:true});
 const actor=createAvatarActor(nao,'Thao');const hand=actor.avatar.bones.handR;
 service.order(kind,IZAKAYA_PLAYER_SEATS[seat]);
 const gaps=[],through=[];let last=null;
 run(service,i=>{
  updateAvatarActor(actor,1/30,i*33);
  const held=nao.userData.workHeld?.R;
  // The moment something comes into her hand, her mitten is round it: the palm's centre is where consume.js drinkGrip
  // puts it from the part she grips (its body, or a mug's handle), give or take a centimetre.
  if(held&&held!==last){
   const m=actor.avatar.measure,palm=hand.localToWorld(new THREE.Vector3(0,-m.hand*.55,0)),axis=held.localToWorld(new THREE.Vector3(...(held.userData.gripAt||[0,0,0])));
   const grip=held.userData.workGrip||held.userData.grip,expect=grip.handle!=null?grip.handle+m.hand*.25:grip.radius+m.hand*.7;
   gaps.push([held.name,+(Math.hypot(palm.x-axis.x,palm.z-axis.z)-expect).toFixed(3)]);
  }
  last=held;
  // Every point of the arm, its own thickness round it, stays out of the worktop, the back bar's cupboard, the cold
  // store and the rear unit, and so does whatever is in her hand.
  const A=actor.avatar,m=A.measure,r=m.armR,joints=['shoulderR','elbowR','handR'].map(b=>A.bones[b].getWorldPosition(new THREE.Vector3()));
  const solids=MINATO_BAR.solids.map(([a,b])=>new THREE.Box3(new THREE.Vector3(...a),new THREE.Vector3(...b)));
  for(let j=0;j<2;j++)for(let t=0;t<=1;t+=.25){const p=joints[j].clone().lerp(joints[j+1],t);
   // Contact is allowed to 5 mm, as in films (jojo/CLAUDE.md, "Collisions intact": "a few millimetres").
   for(const box of solids){const d=box.distanceToPoint(p);if(d<r-.005)through.push([['upper arm','forearm'][j],t,+(r-d).toFixed(3),p.toArray().map(v=>+v.toFixed(3))]);}}
  if(held){const box=new THREE.Box3().setFromObject(held).expandByScalar(-.005);for(const s of solids)if(s.intersectsBox(box))through.push([held.name,service.working?.step,service.working?.phase,box.min.toArray().map(v=>+v.toFixed(3)),box.max.toArray().map(v=>+v.toFixed(3))]);}
 });
 assert.ok(gaps.length>=1,'she took something: '+JSON.stringify(gaps));
 for(const [name,gap] of gaps)assert.ok(Math.abs(gap)<.01,`mitten on ${name}: ${gap} m off`);
 assert.deepEqual(through.slice(0,6),[]);
 assert.equal(service.drink.kind,kind);
});
