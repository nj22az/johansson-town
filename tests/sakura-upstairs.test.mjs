import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {standingHitsRect} from '../physics.js';
import {SAKURA_STAIR_PASSAGE} from '../src/world/interiors/sakura-stairs.js';
import {SAKURA_UPSTAIRS,sakuraOfficePortals,buildSakuraOfficeRoom} from '../src/world/interiors/sakura-office-room.js';
import {suppliedRoomBoundsBlocked} from '../src/world/supplied-rooms.js';
import {buildThuanFlat} from '../src/world/thuan-flat.js';
import {createShopStreetView} from '../src/render/shop-street-view.js';
import {createPointWalk,ROOM_STEP} from '../src/input/point-walk.js';

// Sakura's upper floor after the owner's 19 October replan: a small office with two outlooks, a 4½-mat rest room
// behind a sliding door, the hall at the stair head and two closed stores (interiors/sakura-office-room.js). Since the
// owner's 20 October decision it is a room of its own, reached by the stair's passage into darkness (sakura-stairs.js):
// its own frame, its floor at y 0, no shop under it.
const R=.28,U=SAKURA_UPSTAIRS,HEAD=SAKURA_STAIR_PASSAGE.head.arrive.at;
function upstairs(){
 const room=new THREE.Group(),prompts=[],colliders=[];
 const layout=buildSakuraOfficeRoom({room,reg:(o,label)=>prompts.push({o,label}),action(){},collider:(x,z,w,d,height=2.8,minY=0)=>colliders.push({x,z,w,d,height,minY}),downstairs(){},evacuate(){}});
 room.updateMatrixWorld(true);
 // As game.js moves him in a room: its bounds, and its solids at the height of his feet.
 const blocked=(x,z,r=R)=>suppliedRoomBoundsBlocked(layout,x,z,r)||colliders.some(c=>standingHitsRect(x,z,r,0,c));
 return {room,prompts,layout,colliders,blocked};
}
/** Every 0.1 m cell of the upper floor a player of normal radius can reach from the stair head. */
function reachable({blocked}){
 const step=.1,key=(i,j)=>i+','+j,seen=new Set(),queue=[[Math.round(HEAD[0]/step),Math.round(HEAD[2]/step)]];
 seen.add(key(...queue[0]));
 while(queue.length){
  const [i,j]=queue.shift();
  for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const ni=i+di,nj=j+dj,k=key(ni,nj);if(seen.has(k))continue;
   if(blocked(ni*step,nj*step))continue;
   seen.add(k);queue.push([ni,nj]);
  }
 }
 return {has:(x,z)=>seen.has(key(Math.round(x/step),Math.round(z/step))),near:(x,z,r)=>[...seen].some(k=>{const [i,j]=k.split(',').map(Number);return Math.hypot(i*step-x,j*step-z)<=r;})};
}

test('the upper floor is a small office and a rest room, with the door between them, the hall and two closed stores',()=>{
 const {room}=upstairs(),names=[];room.traverse(o=>names.push(o.name));
 const area=r=>(r.maxX-r.minX)*(r.maxZ-r.minZ);
 assert.ok(area(U.office)<25,'the office is a small shop’s office, not the whole 128 m² floor');
 assert.equal(U.restRoom.mats,4.5);assert.ok(Math.abs(area({...U.restRoom,minX:U.restRoom.minX+.05,maxX:U.restRoom.maxX-.05,minZ:U.restRoom.minZ+.05,maxZ:U.restRoom.maxZ-.06})-2.7*2.74)<.05,'4½ mats, 2.7 × 2.7 m');
 assert.equal(names.filter(n=>n==='Tatami mat').length,5,'four full mats round a half mat');
 for(const n of ['Office desk top','Office safe','Filing cabinet','Wall calendar','Till ledger','Desk telephone','Kitchenette sink','Electric thermo pot','Office fridge','Ledger shelf'])assert.ok(names.includes(n),'office: '+n);
 for(const n of ['Folded futon','Oshiire middle shelf','Low table top','Six-drawer chest','Cassette radio','Wall clock','Fan guard','Shoji screen','Rest room ceiling boards'])assert.ok(names.includes(n),'rest room: '+n);
 assert.equal(names.filter(n=>n==='Oshiire sliding front').length,2,'the futon cupboard has its two fronts');
 assert.equal(names.filter(n=>n==='Rest room sliding door').length,2,'the sliding pair between office and rest room');
 for(const n of ['Shoe step','Shoe cabinet','Staff lockers','Fire extinguisher','Fire door leaf'])assert.ok(names.includes(n),'hall: '+n);
 for(const jp of ['事務所','休憩室','倉庫','書庫','非常口'])assert.ok(names.some(n=>n.includes(jp)),'sign '+jp);
 assert.ok(!names.some(n=>/bunk|bedroom|double bed/i.test(n)),'a staff rest room, not a bedroom');
 // New Yokosuka's measured pieces, as recorded.
 assert.deepEqual(U.items.find(i=>i.id==='chest').size,[1.1,1.11,.57]);
 assert.equal(+(U.doors.restRoom.to-U.doors.restRoom.from).toFixed(2),1.77);assert.equal(U.doors.restRoom.head,2.1);
 assert.ok(U.items.every(i=>i.why&&i.who),'every item says who it is for and why');
});

test('walk at normal player radius: stair head, office desk, through the sliding door to the futon, and nowhere into the stores',()=>{
 const floor=upstairs(),reach=reachable(floor);
 const chair=U.items.find(i=>i.id==='chair');
 for(const [label,[x,z]] of [['desk stand',[4.45,2.2]],['kitchenette',[3.2,1.5]],['town window',[3.2,4.1]],['harbour window',[5.6,3.6]],['office door, office side',[1.1,1.1]],['through the sliding door',[.75,3.33]],['beside the futon cupboard',[-1.65,3.95]],['at the low table',[-.35,3.2]],['by the fire door',[0,-4.9]]])
  assert.ok(reach.has(x,z),label+' is reachable');
 for(const [label,[x,z]] of [['the decorations store',[-4.2,0]],['the archive',[3.5,-2.5]],['inside the futon cupboard',[-2.5,3.9]],['the stair hole',[-3.8,-4.4]]])
  assert.ok(!reach.has(x,z),label+' is not walkable');
 // The closed leaf of the pair is solid; only the open half is a doorway.
 assert.ok(!reach.has(.75,2.4),'no way through the closed leaf');
 assert.ok(reach.has(chair.at[0]-.7,chair.at[2]),'the chair’s stand point');
});

test('every upstairs prompt is in English and reachable from the floor',()=>{
 const floor=upstairs(),reach=reachable(floor),up4=floor.prompts;
 const labels=up4.map(p=>p.label);
 for(const l of ['Sit at the harbour desk','Read the till ledger','Make office tea','Look over Main Street','Look over the harbour','Lie down for a minute','Look in the decorations store','Look in the archive','Look at the shoe cabinet','Evacuate by the fire escape','Go downstairs'])assert.ok(labels.includes(l),l);
 for(const p of up4){
  assert.match(p.label,/^[A-Za-z0-9’' ]+$/,'English prompt (including campaign numbers): '+p.label);
  const w=p.o.getWorldPosition(new THREE.Vector3());
  assert.ok(reach.near(w.x,w.z,1.3),p.label+' has a reachable standing place within reach');
  assert.ok(w.y<1.6,p.label+' is within reach height');
 }
});

test('exactly two windows look out, and both draw the town in the same frame',()=>{
 const portals=sakuraOfficePortals();assert.deepEqual(portals.map(p=>p.id),['town','harbour']);
 const {town:T,harbour:S}=U.windows;
 assert.ok(T.x0>=U.office.minX&&T.x1<=U.office.maxX&&S.z0>=U.office.minZ&&S.z1<=U.office.maxZ,'both windows are the office’s');
 // The shell's mullions frame each window (thuan-flat.js: every 1.6 m along the front, 1.425 m along the side).
 for(const x of [T.x0,T.x1])assert.ok(Math.abs(((x+6.4)/1.6)-Math.round((x+6.4)/1.6))<1e-9);
 // The renderer: from the middle of the office, looking into the corner between the windows, one street pass per window.
 const store=new THREE.Group(),town=new THREE.Group(),sites=[];store.position.set(-7.45,0,-27.3);store.rotation.y=Math.PI/2;town.add(store);
 const {site}=buildThuanFlat(store,{sites,shopDoor:[-5.5,0,-27.3]});town.updateMatrixWorld(true);
 // As game.js streetFrontageOf gives them for the office room: the site's own portals, in the office's own frame.
 const frontage={portals:site.officePortals};
 const scene=new THREE.Scene(),room=new THREE.Group();scene.add(town,room);
 const camera=new THREE.PerspectiveCamera(70,1.6,.05,500);
 camera.position.set(3,1.6,2);camera.lookAt(6.4,1.4,4.55);camera.updateMatrixWorld(true);
 const passes=[];const renderer={autoClear:true,clippingPlanes:[],shadowMap:{enabled:true},clearDepth(){},render(s,c){if(town.visible)passes.push({planes:this.clippingPlanes.map(p=>p.normal.toArray().map(n=>+n.toFixed(3))),clear:this.autoClear,background:s.background});}};
 const view=createShopStreetView();view.render({renderer,scene,camera,town,room,frontage});
 assert.equal(passes.length,2,'both windows are drawn: the town and the harbour');
 assert.equal(passes[0].clear,true);assert.equal(passes[1].clear,false,'the second window adds to the first, it does not wipe it');
 assert.notDeepEqual(passes[0].planes[0],passes[1].planes[0],'each pass is clipped to its own window');
 // Looking only at the town window, one pass.
 passes.length=0;camera.position.set(3.2,1.6,2);camera.lookAt(3.2,1.4,10);camera.updateMatrixWorld(true);view.render({renderer,scene,camera,town,room,frontage});
 assert.equal(passes.length,1);
});

/**
 * The player's own step (game.js stepFeet and collides): each frame's move is tried along x and along z on its own,
 * against the room's bounds and its solids at his feet. Returns where he ends up.
 */
function walkAs(player,{blocked},route,{speed=3,dt=1/60}={}){
 for(const [tx,tz] of route){
  for(let n=0;n<4000&&Math.hypot(tx-player.x,tz-player.z)>.02;n++){
   const d=Math.hypot(tx-player.x,tz-player.z),k=Math.min(1,speed*dt/d),nx=player.x+(tx-player.x)*k,nz=player.z+(tz-player.z)*k;
   const sx=blocked(nx,player.z),sz=blocked(player.x,nz);
   if(sx&&sz)break;
   if(!sx)player.x=nx;if(!sz)player.z=nz;
  }
 }
 return player;
}

test('walk in as the player does: from the stair head along the hall, through the office door to the desk, and to the rest room',()=>{
 // The owner, 20 October 2026, on his iPhone: "I can't seem to get into the office in the Sakura". Since the same day he
 // arrives at the stair head by the stair's passage (sakura-stairs.js), facing up the hall.
 const floor=upstairs(),player={x:HEAD[0],y:0,z:HEAD[2]};
 const legs=[
  ['along the hall to the office door',[[-.5,-2],[-.5,1.1],[.4,1.1]]],
  ['through it to the desk',[[1.4,1.1],[2.5,1.6],[U.items.find(i=>i.id==='chair').at[0]-.7,2.2]]],
  ['through the sliding door to the rest room',[[1.6,3.3],[.2,3.3],[-.35,3.6]]],
  ['back to the fire door',[[.2,3.3],[1.6,3.3],[1.4,1.1],[-.5,1.1],[-.5,-2],[0,-4.9]]],
  ['and to the stair head',[[-1.2,-4.6],[-1.2,-5.1]]],
 ];
 for(const [label,route] of legs){
  walkAs(player,floor,route);const [ex,ez]=route.at(-1);
  assert.ok(Math.hypot(player.x-ex,player.z-ez)<.03,`${label}: stopped at ${[player.x,player.z].map(v=>v.toFixed(2))}`);
 }
});

test('tap to walk upstairs plans its way through the office door and the rest room door',()=>{
 // A tap is planned on the room's grid (input/point-walk.js), as game.js plans it indoors: ROOM_STEP, the player's radius
 // and what stands at his height. On the town's 0.35 m grid there was no point in the 0.25 m the office door leaves him
 // beside its open leaf, and the tap said "There is no clear path from here".
 const floor=upstairs(),blockedAt=(x,z,r)=>floor.blocked(x,z,r);
 const fine=createPointWalk({blocked:blockedAt,heightAt:()=>0,radius:R,step:space=>space?ROOM_STEP:.35});
 const head={x:HEAD[0],z:HEAD[2]},desk={x:4.45,z:2.2},futon={x:-.35,z:3.6},room='sakura-office';
 for(const [label,to] of [['the desk',desk],['the rest room',futon]]){
  assert.ok(fine.walk(head,to,{space:room}),'a planned way from the stair head to '+label);
  const player={x:head.x,y:0,z:head.z};
  for(let i=0;i<3000&&fine.active;i++){const d=fine.direction(player,1/60,room);if(!d)break;walkAs(player,floor,[[player.x+d.x*.05,player.z+d.z*.05]]);}
  assert.ok(Math.hypot(player.x-to.x,player.z-to.z)<.35,`arrived by ${label}: ${[player.x,player.z].map(v=>v.toFixed(2))}`);
 }
});

test('the dressing: every piece has its owner and its reason; the departures board is the town’s own timetable',async()=>{
 // The owner, 20 October 2026, with a 1997 harbour-office diorama: "Here are some suggestions on how to enhance the
 // office, maybe something can be useful" (sakura-office-dressing.js).
 const {SAKURA_OFFICE_DRESSING:D,sakuraDeparturesBoard,clock}=await import('../src/world/interiors/sakura-office-dressing.js');
 const {HARBOUR_LINE,BUS_DWELL}=await import('../src/people/commuter-schedule.js');const {CARGO_CALLS}=await import('../src/world/cargo-shipping.js');
 assert.equal(new Set(D.map(d=>d.id)).size,D.length);
 for(const d of D){assert.ok(d.who&&d.why&&d.why.length>30,'who and why: '+d.id);assert.ok(['office','restRoom','hall','storey'].includes(d.room),d.id);}
 assert.ok(!D.some(d=>/ashtray|beer|radio|hard hat|life vest/i.test(d.name)),'what was left out stays out');
 const B=sakuraDeparturesBoard();
 assert.deepEqual(B.ferry.calls,HARBOUR_LINE.map(m=>({in:clock(m),out:clock(m+BUS_DWELL)})));
 assert.deepEqual(B.cargo.calls,CARGO_CALLS.map(c=>({in:clock(c.alongside),out:clock(c.departure)})));
 assert.equal(B.notes[1].at,'22:15','Thuan’s boat home');assert.match(B.english,/^[\x20-\x7e’]+$/,'the board read in English');
 // Built: the board, the pieces, and the one printed sheet merged into one mesh with the room.
 const {room,prompts}=upstairs(),names=new Set();room.traverse(o=>names.add(o.name));
 for(const n of ['Departures whiteboard','Route map poster','Desk mat','Hanko tray','Pen can','Binoculars barrel','Shisa','Archive box','Mosquito-coil pig','Binder spine label','Typhoon safety poster','Electric thermo pot','Thermo pot gauge','Sanpin-cha tin','Dish drainer','Cup noodles','Tenugui','Garbage schedule','Bamboo mat','Yunomi','Open manga','Chinsuko tin','Television','Rabbit-ear aerial','Sakura Trading carton','Skirting','Office light switch','Door mat'])assert.ok(names.has(n),'built: '+n);
 assert.ok(prompts.some(p=>p.label==='Read the departures board')&&prompts.some(p=>p.label==='Watch the television'));
 const printed=[];room.traverse(o=>{if(o.isMesh&&o.material.map&&o.name==='Sakura upstairs fittings')printed.push(o);});
 assert.ok(printed.length<=2,'the printed sheet and the room’s other texture merge, not a mesh per print');
});
