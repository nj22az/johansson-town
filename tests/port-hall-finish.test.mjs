import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildPortHall,PORT_HALL} from '../src/world/interiors/port-hall.js';
import {paintHallFloor,paintHallPlywood,paintHallConcrete} from '../src/world/interiors/port-hall-finish.js';

function hall(){installDOM();const room=new THREE.Group(),registered=[],colliders=[],actions=[];const result=buildPortHall({room,reg:(object,label,fn)=>{object.userData.hit={label,fn};registered.push(object);},collider:(...args)=>colliders.push(args),action:(...args)=>actions.push(args)});return {room,result,registered,colliders,actions};}
test('terminal refit retains ticketing, parcels, ten seats, exit and Harbour Office access',()=>{
 const {room,result,registered,actions}=hall();const labels=registered.map(o=>o.name);
 assert.ok(labels.includes('Post and parcels'));assert.ok(labels.includes('Go up to the Harbour Office'));assert.ok(labels.includes('Buy a drink from the vending machine'));
 const seats=registered.filter(o=>o.userData.seat);assert.equal(seats.length,10);assert.equal(new Set(seats.map(o=>o.userData.seat.id)).size,10);
 assert.deepEqual(result.spawn,[0,0,2.8]);assert.deepEqual(result.exit,[0,1.1,3.46]);
 result.tick(.1,9*60);assert.equal(result.clerk.visible,false);result.tick(.1,13*60);assert.equal(result.clerk.visible,true);
 registered.find(o=>o.name==='Post and parcels').userData.hit.fn();assert.equal(actions.at(-1)[0],'read');
 const board=room.getObjectByName('Departures board');const bounds=new THREE.Box3().setFromObject(board);assert.ok(bounds.max.y<PORT_HALL.h);assert.ok(bounds.min.y>2.45);
});
test('new structural details and fans fit the hall and animate from absolute scene time',()=>{
 const {room,result}=hall(),fans=[];room.traverse(o=>{if(o.name==='Terminal fan blades')fans.push(o);});assert.equal(fans.length,2);
 result.tick(.2,720);const angle=fans[0].rotation.y;result.tick(0,720);assert.equal(fans[0].rotation.y,angle);result.tick(.1,720);assert.ok(fans[0].rotation.y>angle);
 const cages=[];room.traverse(o=>{if(o.name==='Caged terminal fan')cages.push(o);});for(const cage of cages){const b=new THREE.Box3().setFromObject(cage);assert.ok(b.min.y>2.4);assert.ok(b.max.y<=PORT_HALL.h);}
 const legs=[];room.traverse(o=>{if(o.name==='Bench leg')legs.push(o);});assert.equal(legs.length,8);
});
test('bench colliders cover their actual rows and leave the central entrance aisle clear',()=>{
 const {room,colliders}=hall(),seats=[];room.traverse(o=>{if(o.name==='Hall seat')seats.push(o);});
 for(const s of seats)assert.ok(colliders.some(([x,z,w,d])=>Math.abs(s.position.x-x)<w/2&&Math.abs(s.position.z-z)<d/2));
 assert.ok(!colliders.some(([x,z,w,d])=>Math.abs(x)<w/2&&Math.abs(2.8-z)<d/2));
});
test('floor and counter finish reproduce the same texture coordinates on every build',()=>{
 function record(paint){const calls=[];const gradient={addColorStop(){}};const ctx={fillRect:(...a)=>calls.push(a),beginPath(){},moveTo(){},lineTo(){},stroke(){},createLinearGradient:()=>gradient};paint(ctx,512,512);return calls;}
 for(const paint of [paintHallFloor,paintHallPlywood,paintHallConcrete]){const a=record(paint);assert.deepEqual(a,record(paint));assert.ok(a.length>100);}
});
