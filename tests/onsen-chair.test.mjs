import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildOnsenInterior,ONSEN_SEATS,ONSEN_ASSETS} from '../src/world/interiors/onsen.js';
import {ONSEN_CHAIR,CHAIR,MASSAGE_CHAIR} from '../src/world/interiors/onsen-chair.js';
import {CHAIR_TIMER,MASSAGE_CHAIR as FROM_ELECTRICS} from '../src/world/interiors/onsen-electrics.js';
import {LOBBY} from '../src/world/interiors/onsen-lobby.js';
import {catalogCard} from '../src/catalog/catalog.js';
import {circleHitsRect} from '../physics.js';
import {provideCatalog} from './catalog-fixture.mjs';
installDOM();
await provideCatalog('massage-chair');

// Umi-no-yu's coin massage chair from World's catalogue (the creator, 2026-10-10: "The chair needs to be clearer in the comic
// it's a bit blurry we don't see what Fujita is wanting to sit on"; "I would like to build assets in studio and assemble them
// in world"): Studio's model placed by id where the old chair stood, its colliders and seat from its card, and the room's own
// live parts (the coin timer's readout and lamp, the rollers, the cord, the rating plate) on the model's anchors.
const card=JSON.parse(readFileSync(new URL('../assets/catalog/massage-chair/asset.json',import.meta.url),'utf8'));
const build=()=>{const room=new THREE.Group();const layout=buildOnsenInterior({room,reg(){},action(){},exit(){}});room.updateMatrixWorld(true);return {room,layout};};
const meshes=root=>{const all=[];root.traverse(o=>{if(o.isMesh)all.push(o);});return all;};
const box=o=>new THREE.Box3().setFromObject(o);
const near=(a,b,eps=1e-6)=>Math.abs(a-b)<=eps;
const rectOf=c=>({x0:c.x-c.w/2,x1:c.x+c.w/2,z0:c.z-c.d/2,z1:c.z+c.d/2});
const overlap=(a,b)=>{const A=rectOf(a),B=rectOf(b);return A.x0<B.x1-1e-9&&B.x0<A.x1-1e-9&&A.z0<B.z1-1e-9&&B.z0<A.z1-1e-9;};
/** What the room draws on the chair itself (onsen-electrics.js), by name. */
const LIVE=['Massage chair coin timer','Massage chair rollers','Massage chair cord','Massage chair rating plate'];

test('it stands where Studio\'s card says it replaces the old chair, and the room reads its seat front from the card',()=>{
 const P=card.replaces.placement;
 assert.equal(P.room,'onsen');assert.deepEqual([ONSEN_CHAIR.x,ONSEN_CHAIR.z],[P.x,P.z]);assert.ok(near(ONSEN_CHAIR.yaw,P.yaw,1e-4));
 assert.equal(ONSEN_CHAIR.asset,card.id);assert.deepEqual(ONSEN_ASSETS,['massage-chair']);
 assert.equal(MASSAGE_CHAIR.front,4.2,'the seat’s front edge where the old one was');assert.equal(FROM_ELECTRICS,MASSAGE_CHAIR);
 assert.ok(ONSEN_CHAIR.why.length>80,'why it stands there');
 // Everything the room leaves out of the model is something the card names (the parts the room draws itself).
 for(const name of ONSEN_CHAIR.omit)assert.ok(card.parts.some(p=>p.name===name)||name==='Massage chair timer display',name);
});

test('its colliders are the card\'s: the body on the old footprint, 1.14 high, and the leg rest in front of it',()=>{
 const {layout}=build(),mine=layout.colliders.filter(c=>c.asset==='massage-chair');
 assert.deepEqual(mine.map(({x,z,w,d,height,minY,part})=>({x,z,w,d,height,minY,part})),[
  {x:4.505,z:3.55,w:.61,d:.9,height:1.14,minY:0,part:'body'},{x:4.14,z:3.55,w:.12,d:.43,height:.33,minY:0,part:'leg rest'}]);
 const R=mine.map(rectOf);
 assert.deepEqual([R[0].x0,R[0].x1,R[0].z0,R[0].z1].map(v=>+v.toFixed(6)),[4.2,4.81,3.1,4],'the old chair’s footprint exactly');
 assert.deepEqual([R[1].x0,R[1].x1,R[1].z0,R[1].z1].map(v=>+v.toFixed(6)),[4.08,4.2,3.335,3.765]);
 // Nothing else's: not the milk cooler, not the koagari, not a wall.
 for(const c of mine)for(const o of layout.colliders.filter(o=>o.asset!=='massage-chair'))assert.ok(!overlap(c,o),`${c.part} overlaps a collider at ${o.x.toFixed(2)}, ${o.z.toFixed(2)}`);
 // The ways round it are as they were: the stand spot is clear for the player (0.28 m), the nook by the cooler stays shut
 // (the koagari's corner to the leg rest is narrower than a body), and nobody stands between the chair and the cooler.
 const blocked=(x,z,r)=>layout.colliders.some(c=>!c.only&&circleHitsRect(x,z,r,c));
 assert.equal(blocked(...[ONSEN_SEATS.massage.stand[0],ONSEN_SEATS.massage.stand[2]],.28),false,'the stand spot is clear');
 const K=LOBBY.koagari,gap=Math.hypot(R[1].x0-(K.x+K.w/2),R[1].z0-(K.z+K.d/2));assert.ok(gap<.56&&gap>.4,'koagari to leg rest '+gap.toFixed(3));
 assert.ok(blocked(4.62,2.9,.25),'nobody stands in the gap between the cooler and the chair');
 layout.dispose();
});

test('its seat is the old seat exactly: the mark, the stand spot, the height and the turn, and its front edge from the card',()=>{
 assert.deepEqual(ONSEN_SEATS.massage,{id:'massage',label:'Sit in the massage chair (¥100)',position:[4.25,0,3.55],stand:[3.4,0,3.55],eyeY:1.12,yaw:Math.PI/2,surfaceY:.5,front:CHAIR.seat('seat').front});
 // (the mark 5 cm behind the seat's front edge: a sitter's shins hang in front of it, animate.js seatFront)
 assert.equal(ONSEN_SEATS.massage.front,.05);
 const s=CHAIR.seat('seat');assert.deepEqual([s.position,s.stand,s.surfaceY,s.yaw],[ONSEN_SEATS.massage.position,ONSEN_SEATS.massage.stand,.5,Math.PI/2]);
 // The card's coin spot is a film mark only: it is 0.17 m from the koagari's corner, too tight to offer as a place to stand.
 const coin=CHAIR.spot('coin');assert.deepEqual(coin.position,[3.72,0,3.3]);
});

test('the model stands on the floor, the parts the room draws itself are left out of it, and it is in nothing of the room\'s',()=>{
 const {room,layout}=build(),chair=layout.chair;
 assert.equal(chair.loaded,true);assert.equal(chair.object.parent,room);
 const b=box(chair.object);assert.ok(near(b.min.y,0,1e-3),'on the floor: '+b.min.y);assert.ok(near(b.max.y,1.14,1e-3));
 for(const name of ONSEN_CHAIR.omit)assert.equal(chair.part(name),null,name+' is the room’s, not the model’s');
 // Box against box (each 0.8 mm smaller): no piece of the chair inside the wainscot, the cooler, the koagari, the raceway,
 // the socket or anything else; the floors it stands on and the light on them aside, the painted sea round the whole house
 // (its box is the house), and the agarikamachi (below).
 const shrink=x=>x.clone().expandByScalar(-.0008),own=new Set(meshes(chair.object));
 for(const name of LIVE)for(const m of meshes(room.getObjectByName(name)))own.add(m);
 const floor=o=>/^(Umi-no-yu floor|Genkan arai-dashi|Genkan step|Rock bath paving|Umi-no-yu sea view)$/.test(o.name)||o.userData.lightPool||/light pool$/.test(o.name)||o.parent?.name?.endsWith('light pools');
 const others=meshes(room).filter(o=>!own.has(o)&&!floor(o)&&o.visible);
 for(const m of own){if(!chair.object.getObjectById(m.id))continue;const mb=shrink(box(m));
  for(const o of others){const ob=box(o);if(!ob.isEmpty()&&mb.intersectsBox(ob))assert.fail(`${m.name} meets ${o.name} at ${ob.getCenter(new THREE.Vector3()).toArray().map(v=>v.toFixed(2))}`);}}
 layout.dispose();
});

// The agarikamachi turns at x 3.0 towards the street wall (onsen-front.js GENKAN_STEP), so the chair's end of the lobby is
// hinoki: the chair stands wholly on the boards, nothing of it meets the step, and a bather reaches it barefoot.
test('the chair stands wholly on the lobby\'s hinoki, clear of the agarikamachi',()=>{
 const {room,layout}=build(),chair=meshes(layout.chair.object);
 const steps=meshes(room).filter(o=>o.name==='Genkan step').map(box);assert.equal(steps.length,2);
 for(const m of chair){const b=box(m);for(const s of steps)assert.ok(!b.intersectsBox(s),m.name+' meets the agarikamachi');}
 const floors=meshes(room).filter(o=>/^(Umi-no-yu floor|Genkan arai-dashi)$/.test(o.name)),
  boards=new THREE.Raycaster(new THREE.Vector3(0,.5,2.5),new THREE.Vector3(0,-1,0)).intersectObjects(floors,false)[0].object.material;// the lobby's own boards
 const all=box(layout.chair.object);
 for(const [x,z] of [[all.min.x,all.min.z],[all.min.x,all.max.z],[all.max.x,all.min.z],[all.max.x,all.max.z],[3.4,3.55]]){
  const hit=new THREE.Raycaster(new THREE.Vector3(x,.5,z),new THREE.Vector3(0,-1,0)).intersectObjects(floors,false)[0];
  assert.equal(hit.object.material,boards,`hinoki under ${x.toFixed(2)}, ${z.toFixed(2)}`);}
 layout.dispose();
});

test('the room\'s cord starts inside the plinth at the card\'s cord anchor, keeps clear of the chair, and ends in the plug',()=>{
 const {room,layout}=build(),cord=room.getObjectByName('Massage chair cord');
 assert.deepEqual(cord.userData.points[0],CHAIR.anchor('cord'),'from the cord anchor');
 const chair=meshes(layout.chair.object),body=chair.find(m=>m.name==='Coin massage chair');
 assert.ok(box(body).containsPoint(new THREE.Vector3(...CHAIR.anchor('cord'))),'inside the plinth');
 const path=cord.geometry.parameters.path,length=path.getLength(),R=cord.geometry.parameters.radius;
 for(let i=0;i<=400;i++){const s=i/400*length,p=path.getPointAt(i/400);
  assert.ok(p.y-R>-.001,'never below the floor: '+p.toArray().map(v=>v.toFixed(3)));
  if(s<.02)continue;
  const ball=new THREE.Box3().setFromCenterAndSize(p,new THREE.Vector3(2*R,2*R,2*R));
  for(const m of chair)assert.ok(!box(m).intersectsBox(ball),`the cord at ${p.toArray().map(v=>v.toFixed(3))} meets ${m.name}`);}
 const plug=box(room.getObjectByName('Massage chair socket plug'));assert.ok(plug.containsPoint(path.getPointAt(1)),'into the plug');
 layout.dispose();
});

test('the rating plate lies flat on the right arm\'s outer face, under its vents, and faces the cooler',()=>{
 const {room,layout}=build(),plate=room.getObjectByName('Massage chair rating plate'),b=box(plate),chair=meshes(layout.chair.object);
 assert.ok(near(b.min.z,b.max.z,1e-6),'flat, facing -z');
 const ray=new THREE.Raycaster(),north=new THREE.Vector3(0,0,1);
 for(const [x,y] of [[b.min.x+.002,b.min.y+.002],[b.max.x-.002,b.min.y+.002],[b.min.x+.002,b.max.y-.002],[b.max.x-.002,b.max.y-.002],[(b.min.x+b.max.x)/2,(b.min.y+b.max.y)/2]]){
  ray.set(new THREE.Vector3(x,y,b.min.z-.01),north);ray.far=.05;const hit=ray.intersectObjects(chair,false)[0];
  assert.ok(hit&&hit.object.name==='Coin massage chair','on the arm: '+(hit?.object.name||'nothing'));
  // on the arm's flat face itself (3.105), not on a vent standing out of it, and at most a millimetre off it
  assert.ok(near(hit.point.z,3.105,2e-4)&&hit.point.z-b.min.z<.001&&hit.point.z>=b.min.z,'flat on the face: '+hit.point.z.toFixed(4));}
 layout.dispose();
});

test('as drawn in the room, with the room\'s own parts: light enough for a phone, and every name a film hides by is one thing',()=>{
 const {room,layout}=build(),parts=[...meshes(layout.chair.object),...LIVE.flatMap(n=>meshes(room.getObjectByName(n)))];
 const tris=parts.reduce((s,m)=>s+(m.geometry.index?m.geometry.index.count:m.geometry.attributes.position.count)/3,0);
 assert.ok(parts.length<=15,'draws: '+parts.length);assert.ok(tris<=7500,'triangles: '+tris);
 assert.ok(meshes(layout.chair.object).reduce((s,m)=>s+(m.geometry.index.count/3),0)<=catalogCard('massage-chair').budget.triangles);
 const count=new Map();room.traverse(o=>{if(o.name)count.set(o.name,(count.get(o.name)||0)+1);});
 for(const name of ['Massage chair lamp',CHAIR_TIMER.name,'Massage chair cord','Massage chair rollers','Massage chair rating plate','Massage chair coin timer','Catalogue asset massage-chair'])
  assert.equal(count.get(name),1,name+' is one thing');
 layout.dispose();
});
