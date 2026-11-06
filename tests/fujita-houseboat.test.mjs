import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildPortShed,PORT_SHED,SHED_PIER} from '../src/world/port-shed.js';
import {HOUSEBOAT,houseboatSurface,houseboatCabinAt,createHouseboatModel} from '../src/world/fujita-houseboat.js';
import {fujitaAsleep,fujitaBoatRoute} from '../src/world/fujita-routine.js';
import {buildCargoShipping} from '../src/world/cargo-shipping.js';
import {circleHitsRect,standingHitsRect} from '../physics.js';
// (standingHitsRect, not circleHitsRect, for a walk: the shed's roof is a collider too, overhead, for the arrival lens only)
import {routeAt,groundHeight} from '../src/world/layout.js';
installDOM();
const make=()=>{const colliders=[];return {shed:buildPortShed({parent:new THREE.Group(),colliders,register(){},onAction(){}}),colliders};};
test('Mr Fujita walks to his sofa at a quarter to one and returns at six without beer or a tilted walking body',()=>{
 const {shed,colliders}=make();const chairSeatHeight=shed.fujita.userData.seatHeight;shed.tick(.1,44);assert.equal(shed.routine.state,'watching');
 for(let i=0;i<600;i++){shed.tick(.1,45);const p=shed.fujita.getWorldPosition(new THREE.Vector3());if(shed.routine.state==='to-boat'&&p.z>-56.65)assert.ok(!colliders.some(c=>standingHitsRect(p.x,p.z,.2,p.y,c)),`clear ${p.x},${p.z}`);}
 assert.equal(shed.routine.state,'sleeping');assert.equal(shed.fujita.userData.heldItem,undefined);assert.equal(shed.fujita.userData.seatHeight,undefined);assert.equal(shed.fujita.userData.sleeping,true);
 const p=shed.fujita.getWorldPosition(new THREE.Vector3());assert.ok(Math.abs(p.x-HOUSEBOAT.x-HOUSEBOAT.bed[0])<.001);assert.ok(Math.abs(p.z-HOUSEBOAT.z-HOUSEBOAT.bed[2])<.001);
 shed.tick(.1,90);assert.equal(shed.routine.state,'sleeping');for(let i=0;i<600;i++)shed.tick(.1,360);assert.equal(shed.routine.state,'watching');assert.equal(shed.fujita.userData.seatHeight,chairSeatHeight);assert.equal(shed.fujita.rotation.x,0);assert.equal(shed.fujita.userData.hatOff,undefined);shed.dispose();
});
test('night boot is on the sofa with the same resident',()=>{const {shed}=make();shed.tick(0,90);assert.equal(shed.routine.state,'sleeping');for(let i=0;i<20;i++)shed.tick(.1,90);assert.equal(shed.fujita.parent,shed.group);assert.ok(!shed.boat.group.getObjectByName('Mr Fujita'));shed.dispose();});
test('pier, gangway and every walking segment are clear',()=>{
 const {shed,colliders}=make(),G=HOUSEBOAT.gangway,path=fujitaBoatRoute(PORT_SHED.chair);
 for(let x=G.minX+.25;x<G.maxX-.2;x+=.15){assert.ok(routeAt(x,-54.2,.2));assert.equal(groundHeight(x,-54.2),HOUSEBOAT.deckY);}
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.05);for(let k=1;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[2]+(b[2]-a[2])*k/n;if(i===1&&z<-56.65)continue;assert.ok(routeAt(x,z,.2),`surface ${x},${z}`);assert.ok(!colliders.some(c=>standingHitsRect(x,z,.2,groundHeight(x,z),c)),`clear ${x},${z}`);}}
 for(let z=SHED_PIER.minZ+.45;z<SHED_PIER.maxZ-.45;z+=.1){const x=PORT_SHED.x+PORT_SHED.depth/2+.65;assert.ok(!colliders.some(c=>standingHitsRect(x,z,.3,groundHeight(x,z),c)));}shed.dispose();
});
test('clock reversal reverses the current walk continuously',()=>{
 assert.equal(fujitaAsleep(44),false);assert.equal(fujitaAsleep(45),true);assert.equal(fujitaAsleep(359),true);assert.equal(fujitaAsleep(360),false);
 const {shed}=make();shed.tick(.1,1409);for(let i=0;i<40;i++)shed.tick(.1,1410);const p=shed.fujita.position.clone();shed.tick(.1,1409);assert.ok(p.distanceTo(shed.fujita.position)<.1);for(let i=0;i<200;i++)shed.tick(.1,1409);assert.equal(shed.routine.state,'watching');shed.dispose();
});
test('cargo calls never overlap the houseboat or gangway',()=>{
 const {shed}=make(),shipping=buildCargoShipping({group:new THREE.Group()});for(const minute of [420,450,500,540,870,900,980,1010]){shipping.update(0,minute);const ship=new THREE.Box3().setFromObject(shipping.ship);assert.ok(!ship.intersectsBox(new THREE.Box3().setFromObject(shed.boat.group)));assert.ok(!ship.intersectsBox(new THREE.Box3().setFromObject(shed.boat.gangway)));}shed.dispose();
});

test('the open cabin approach clears a standing player beside the freshwater tank',()=>{
 const {shed,colliders}=make();
 for(let z=HOUSEBOAT.z+2.3;z>HOUSEBOAT.z+.8;z-=.05)assert.ok(!colliders.some(c=>circleHitsRect(HOUSEBOAT.x+.65,z,.28,c)),`player approach ${z}`);
 shed.dispose();
});


test('extended cabin has a sofa and stored futon, with furniture beside the clear aisle',()=>{
 const model=createHouseboatModel(),parts=[];model.traverse(o=>parts.push(o.name,...(o.userData.parts||[])));
 assert.ok(parts.includes('Worn sofa cushion'));assert.ok(parts.includes('Folded futon'));
 assert.ok(!parts.some(n=>/Berth|mattress/i.test(n)));
 assert.equal(houseboatSurface(HOUSEBOAT.x,HOUSEBOAT.z-3.65,.1)?.id,'fujita-houseboat');
 assert.equal(houseboatSurface(HOUSEBOAT.x,HOUSEBOAT.z-4.1,.1),null);
 const {shed,colliders}=make();
 for(let z=HOUSEBOAT.z-2.7;z<=HOUSEBOAT.z+.2;z+=.05){
  assert.ok(!colliders.some(c=>circleHitsRect(HOUSEBOAT.x+.26,z,.2,c)),`cabin aisle ${z}`);
 }
 // The batches, the cabin lamp, the deck bulb and the lettering are the live meshes; every other fitting is merged.
 assert.ok(model.children.filter(o=>o.isMesh).length<31,'fittings remain batched');shed.dispose();
});

test('a deck bulb outside the cabin door burns after dark, with its halo and its pool on the deck boards',()=>{
 const {shed}=make(),boat=shed.boat,bulb=boat.group.getObjectByName('Deck bulb');
 assert.ok(bulb?.userData.houseboatBulb,'a live fitting, not batched away');
 boat.tick({night:0});assert.equal(bulb.material.emissiveIntensity,0);assert.equal(boat.deckGlow.pools.group.visible,false);
 boat.tick({night:1});assert.ok(bulb.material.emissiveIntensity>1);assert.ok(boat.deckGlow.pools.group.visible&&boat.deckGlow.halos.group.visible);
 const pool=boat.deckGlow.pools.group.children[0];assert.ok(pool.userData.lightPool&&pool.position.y>HOUSEBOAT.deckY&&pool.position.y<HOUSEBOAT.deckY+.1,'a decal on the deck');
 let points=0;boat.group.traverse(o=>{if(o.isPointLight)points++;});assert.equal(points,0,'no light of its own');
 // The shed passes the clock's lantern glow on: dark at noon, lit at nine.
 shed.tick(.1,720);assert.equal(bulb.material.emissiveIntensity,0);shed.tick(.1,1260);assert.ok(bulb.material.emissiveIntensity>1);
 shed.dispose();
});

test('standing player clearance follows Fujita through the gangway and cabin in both directions',()=>{
 const {shed,colliders}=make(),path=fujitaBoatRoute(PORT_SHED.chair).slice(3);
 for(const route of [path,[...path].reverse()])for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[2]-a[2])/.025);
  for(let k=0;k<=steps;k++){
   const x=a[0]+(b[0]-a[0])*k/steps,z=a[2]+(b[2]-a[2])*k/steps;
   assert.ok(routeAt(x,z,.28),`supported player ${x},${z}`);
   assert.ok(!colliders.some(c=>circleHitsRect(x,z,.28,c)),`clear player ${x},${z}`);
  }
 }
 shed.dispose();
});

test('the actual sleeping head rests on the pillow, which rests on the sofa',()=>{
 const {shed}=make();shed.tick(0,45);for(let i=0;i<100;i++)shed.tick(.1,45);
 shed.boat.group.updateMatrixWorld(true);shed.group.updateMatrixWorld(true);
 const head=new THREE.Box3().setFromObject(shed.actor.avatar.face.head,true),centre=head.getCenter(new THREE.Vector3());
 const ray=new THREE.Raycaster(new THREE.Vector3(centre.x,head.min.y+.1,centre.z),new THREE.Vector3(0,-1,0));
 const hits=ray.intersectObject(shed.boat.group,true),pillow=hits[0];
 assert.equal(pillow?.object.material.color.getHex(),0xd8cfb6,'the first support is the cream pillow');
 assert.ok(Math.abs(pillow.point.y-head.min.y)<.05,'soft contact with the animated head, without a gap');
 const seat=hits.find(h=>h.object.material.color.getHex()===0x777b49);
 assert.ok(seat&&pillow.point.y-seat.point.y>.04&&pillow.point.y-seat.point.y<.1,'a thin compressed pillow on the seat');
 ray.set(new THREE.Vector3(HOUSEBOAT.x-.31,1.3,centre.z),new THREE.Vector3(0,-1,0));
 assert.equal(ray.intersectObject(shed.boat.group,true)[0]?.object.material.color.getHex(),0xd8cfb6,'the pillow edge is visible beside his head, above the blanket edge');
 shed.dispose();
});

test('the folded bedding is the first visible surface through the cupboard opening from the aisle',()=>{
 const model=createHouseboatModel();model.updateMatrixWorld(true);
 for(const [y,colour] of [[.22,0xd8cfb6],[.34,0xd8cfb6],[.46,0xd8cfb6],[.625,0x657d78]]){
  const ray=new THREE.Raycaster(new THREE.Vector3(.26,y,.13),new THREE.Vector3(-1,0,0));
  const hit=ray.intersectObject(model,true)[0];
  assert.equal(hit?.object.material.color.getHex(),colour,`bedding visible at ${y} m, not an opaque cupboard body`);
  assert.ok(hit.point.x>-.74&&hit.point.x<-.69,'the front of the stored bedding is exposed');
 }
});

test('roof fittings cut away with the roof and cabin camera bounds exclude the exterior',()=>{
 const {shed}=make(),lamp=shed.boat.group.getObjectByName('Cabin lamp');
 assert.equal(lamp.userData.houseboatRoof,true);
 shed.boat.tick({player:{x:HOUSEBOAT.x+.26,z:HOUSEBOAT.z-.55}});assert.equal(lamp.visible,false);
 shed.boat.tick({sleeping:false});assert.equal(lamp.visible,true);
 shed.boat.tick({sleeping:true});assert.equal(lamp.visible,false);
 assert.equal(houseboatCabinAt(HOUSEBOAT.x+.26,HOUSEBOAT.z-.55),true);
 for(const [x,z] of [[HOUSEBOAT.x,HOUSEBOAT.z+.8],[HOUSEBOAT.x,HOUSEBOAT.z-3.3],[-38.9,-54.2],[-37.5,-54.2],[0,0]])assert.equal(houseboatCabinAt(x,z),false);
 shed.dispose();
});
