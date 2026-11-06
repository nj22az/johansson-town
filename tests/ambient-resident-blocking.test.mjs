import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as THREE from '../vendor/three.module.js';
import {createNeighbours} from '../src/people/neighbours.js';
import {circleHitsCircle} from '../physics.js';
import {installDOM} from './fixtures.mjs';

test('actual ambient neighbours block the player and appear in the same MCP navigation query',async()=>{
 installDOM();const parent=new THREE.Group(),neighbours=createNeighbours({parent});neighbours.update(0,840);
 const source=await readFile(new URL('../src/game.js',import.meta.url),'utf8');
 const start=source.indexOf('function indoorNpc('),end=source.indexOf('function collides(',start);
 const nav=source.indexOf(' navigation(x,z,radius=',source.indexOf('window.__JOHANSSON_AUDIT__={'));
 const navigation=source.slice(nav,source.indexOf('\n enter(id)',nav));
 const context={THREE,world:{people:[],neighbours:neighbours.entities,colliders:[]},current:null,
  PLAYER_RADIUS:.28,NPC_RADIUS:.35,circleHitsCircle,inEntrance:()=>false,groundHeight:()=>0,
  townBoundsBlocked:()=>false,standingHitsRect:()=>false,
  // (outdoors: no room's walk, so a resident blocks at any height, game.js residentsAt)
  roomWalk:()=>null,player:{position:new THREE.Vector3()}};
 vm.runInNewContext(source.slice(start,end)+'\nglobalThis.audit={'+navigation+'route(){return null;}};',context);
 // (Mr Ōshiro retired in phase 4: the first neighbour out at 14:00, Grandmother Higa, people/neighbours.js.)
 const fisherman=neighbours.entities.find(g=>g.visible);assert.ok(fisherman,'a neighbour is out at 14:00');const p=fisherman.getWorldPosition(new THREE.Vector3()),name=fisherman.userData.name;
 assert.equal(context.residentBlocked(p.x,p.z),true,'Player cannot walk through the live '+name);
 assert.ok(context.audit.navigation(p.x,p.z).residents.includes(name),'MCP reports that same real body');
 assert.equal(context.residentBlocked(p.x+1,p.z),false,'Player can pass at a clear distance');
 parent.position.x=10;const moved=fisherman.getWorldPosition(new THREE.Vector3());assert.equal(context.residentBlocked(moved.x,moved.z),true,'Collision follows the actual world transform');
 fisherman.visible=false;assert.equal(context.residentBlocked(moved.x,moved.z),false,'An absent neighbour cannot block an empty street');
 fisherman.visible=true;fisherman.userData.inVehicle=true;assert.equal(context.residentBlocked(moved.x,moved.z),false,'Seated drivers use their vehicle body');
});
