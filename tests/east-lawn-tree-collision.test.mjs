import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {standingHitsRect,sweepFraction} from '../physics.js';
import {SCHOOL} from '../src/world/school-layout.js';

installDOM();
const {buildEastLawn}=await import('../src/world/east-lawn.js');
const parent=new THREE.Group(),colliders=[];
buildEastLawn({parent,colliders});
const trees=[];
parent.traverse(object=>{if(object.name==='East lawn tree')trees.push(object);});
const trunks=colliders.filter(c=>c.id==='east-lawn-tree');
const blocked=(x,z)=>colliders.some(c=>standingHitsRect(x,z,.28,0,c));

test('the MCP-reproduced police-box approach stays open in both directions',()=>{
 const south={x:12,z:22.5},north={x:12,z:24};
 assert.equal(sweepFraction(south,north,blocked,.02),1);
 assert.equal(sweepFraction(north,south,blocked,.02),1);
 assert.equal(blocked(12,23.314692),false,'the former invisible strip has no obstacle');
});

test('the retired lawn treeline adds neither meshes nor invisible trunk collision',()=>{
 assert.equal(trees.length,0);
 assert.equal(trunks.length,0);
});

test('the visible school-gate clearing is not closed by tree collision',()=>{
 const x=SCHOOL.gate.x;
 const blockedByTrees=(x,z)=>trunks.some(c=>standingHitsRect(x,z,.28,0,c));
 assert.equal(sweepFraction({x,z:22.5},{x,z:25},blockedByTrees,.02),1);
});
