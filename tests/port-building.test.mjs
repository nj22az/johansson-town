import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {circleHitsRect} from '../physics.js';
installDOM();globalThis.self=globalThis;
const {createTown}=await import('../src/world/town.js?port-building');
const {createBusinesses}=await import('../src/world/businesses.js');
const {PORT_BUILDING}=await import('../src/world/port-building.js');
const {FERRY_TERMINAL}=await import('../src/world/ferry.js');
const {QUAY_BAYS}=await import('../src/world/town-traffic.js');
const {buildPortHall}=await import('../src/world/interiors/port-hall.js');
const labels=[];
const world=createTown({scene:new THREE.Scene(),sites:createBusinesses(),mobile:false,shadows:false,register(o,label){labels.push({label,p:o.getWorldPosition?.(new THREE.Vector3())});},enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
const own=c=>/^port-|ferry-terminal|^$/.test(c.id||'')||c.w===7.2;

test('one Port Building on the quay: the hall, the tower and the office, clear of the car bays and lanes',()=>{
 assert.ok(world.group.getObjectByName('Minato Port Building'));
 assert.equal(world.group.getObjectByName('Minato ferry terminal')?.getObjectByName('Ticket window'),undefined);
 for(const id of ['port-waiting-hall','port-clock-tower'])assert.ok(world.colliders.some(c=>c.id===id),id);
 // A parked car is 1.6 m wide: the building and its canopy posts stay clear of both bays.
 for(const [x,z] of QUAY_BAYS)for(let dz=-1.7;dz<=1.7;dz+=.4)
  assert.ok(!world.colliders.some(c=>/^port-/.test(c.id)&&circleHitsRect(x+.8,z+dz,.05,c)),`bay at ${x},${z} meets the building`);
 for(const lane of world.traffic.network.lanes.values())for(const p of lane.pts)
  assert.ok(!world.colliders.some(c=>/^port-/.test(c.id)&&circleHitsRect(p.x,p.z,.6,c)),`lane ${lane.id} runs into the Port Building`);
});

test('the forecourt is open: you can stand where the queue waits and at the hall doors',()=>{
 for(const [x,z] of [PORT_BUILDING.platform,PORT_BUILDING.driver,[PORT_BUILDING.hallDoor[0]-.7,PORT_BUILDING.hallDoor[2]]])
  assert.ok(!world.colliders.some(c=>circleHitsRect(x,z,.3,c)&&(c.height??3)>.3),`blocked at ${x},${z}: `+world.colliders.filter(c=>circleHitsRect(x,z,.3,c)).map(c=>c.id).join());
 assert.deepEqual(FERRY_TERMINAL.platform,PORT_BUILDING.platform);
 const place=world.landmarks.find(l=>l.id==='ferry-terminal');
 assert.ok(place&&Number.isFinite(place.entryFacing),'the terminal is a place you walk into');
});

test('every departure is sold at the counter, and none is left loose on the quay',()=>{
 assert.ok(!labels.some(l=>/Airport ferry tickets/.test(l.label)),'the old quay ticket prompt is gone');
 const spots=[];const room=new THREE.Group();
 const layout=buildPortHall({room,reg:(o,label)=>spots.push(label),action(){},collider(){}});
 for(const want of ['Read about cargo crossings','Buy a ticket: Airport ferry','Take the evening boat to Naha with Thuan','Go up to the Harbour Office'])assert.ok(spots.includes(want),want);
 assert.equal(layout.yaw,0);assert.ok(layout.spawn[2]<layout.bounds.maxZ&&layout.exit[2]>layout.spawn[2]);
});
