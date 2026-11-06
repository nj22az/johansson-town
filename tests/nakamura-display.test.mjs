import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {createKit} from '../src/world/okinawa/kit.js';
import {shopHouse} from '../src/world/okinawa/houses.js';
import {EAST_ROW} from '../src/world/okinawa/layout.js';
import {standingHitsRect,sweepFraction} from '../physics.js';
import {NAKAMURA_DESSERTS} from '../src/world/harbour-park-plan.js';

installDOM();
const plot=EAST_ROW.plots.find(p=>p.id==='nakamura'),kit=createKit(),group=new THREE.Group();
let colliders;
kit.at((EAST_ROW.minX+EAST_ROW.maxX)/2,(plot.minZ+plot.maxZ)/2,-Math.PI/2,()=>{
 colliders=shopHouse(kit,{w:plot.maxZ-plot.minZ-.1,d:EAST_ROW.maxX-EAST_ROW.minX,interior:'zenzai',seed:plot.minZ*7|0});
});
kit.finish(group);group.updateMatrixWorld(true);

// Blue Coral's display is the compact teal freezer on Mrs Nakamura's counter (houses.js, the zenzai counter). The free-
// standing display in the old table corner went on 18 October 2026, when the family's door and stairwell were fitted into
// that corner (docs/qa/iphone-colour-nakamura-2026-10-18.md: "Nakamura's counter has ... a small Blue Coral display";
// "A separate labelled family door, partitioned stairwell and upstairs landing fit inside the existing building footprint").
const counter=()=>colliders.find(c=>c.id==='zenzai-counter');
test('Blue Coral’s compact display stands on the counter and has visible matching collision',()=>{
 const display=colliders.find(c=>c.id==='ice-cream-display'),top=counter();
 assert.ok(display&&top);
 for(const [lo,hi,a,b] of [[display.x-display.w/2,display.x+display.w/2,top.x-top.w/2,top.x+top.w/2],[display.z-display.d/2,display.z+display.d/2,top.z-top.d/2,top.z+top.d/2]])
  assert.ok(lo>=a-1e-9&&hi<=b+1e-9,'the freezer stands on the counter’s own footprint');
 assert.ok(display.w<=.6&&display.d<=.6,'a compact countertop case');
 assert.ok(display.minY+display.height>top.minY+top.height+.5,'it stands well above the counter top');
 const ray=new THREE.Raycaster(new THREE.Vector3(display.x,2,display.z),new THREE.Vector3(0,-1,0));
 const hit=ray.intersectObject(group,true)[0];
 assert.ok(hit&&Math.abs(hit.point.y-(display.minY+display.height))<.01,'collision height matches the drawn display');
 assert.equal(standingHitsRect(display.x,display.z,.28,0,display),true);
});

test('the clerk and all pavement customers retain clear standing and walking space',()=>{
 const display=colliders.find(c=>c.id==='ice-cream-display');
 const [sx,sz]=NAKAMURA_DESSERTS.staffAt;
 assert.equal(standingHitsRect(sx,sz,.32,0,display),false,'Mrs Nakamura’s place behind the counter remains clear');
 const blocked=(x,z)=>colliders.some(c=>standingHitsRect(x,z,.28,0,c));
 // The approach, the order point (blue-coral-shop.js) and the pavement in front of the family door.
 for(const [x,z] of [NAKAMURA_DESSERTS.approach,[5.1,-12.4],[4.8,-10.9],[4.8,-9.6]])assert.equal(blocked(x,z),false,'customer prompt is clear');
 assert.equal(sweepFraction({x:4.5,z:-12},{x:4.5,z:-8.5},blocked,.04),1,'the pavement remains continuous');
});
