import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildAirportIsland,AIRPORT_ISLAND,AIRPORT_DEPARTURES} from '../src/world/airport-island.js';
import {onIslandLand} from '../src/world/coastal-ground.js';

test('the airport island is on the horizon, inside the far plane, and not on the town',()=>{
 const parent=new THREE.Group(),island=buildAirportIsland({parent});
 const A=AIRPORT_ISLAND,fromQuay=Math.hypot(A.x,A.z+45),fromBeach=Math.hypot(A.x-40,A.z);
 assert.ok(fromQuay>300&&fromQuay<420&&fromBeach>300&&fromBeach<420,'It is far across the strait, inside the 640 m far plane');
 assert.equal(onIslandLand(A.x,A.z),false,'The airport stays across the strait');
 for(const dx of [-A.halfLength,0,A.halfLength])assert.equal(onIslandLand(A.x+dx,A.z),false,'The airport shore is separate');
 // The section renderer must not cull it for being far from every street.
 assert.equal(island.group.userData.horizon,true);
 // A plane takes off at each departure and is gone again once it has climbed away (a minute of real time).
 const t=AIRPORT_DEPARTURES[0];let seen=false;
 for(let m=t-1;m<t+65;m+=1/30){island.update(1/30,m,1);if(island.plane.visible)seen=true;}
 assert.ok(seen,'No plane took off');assert.equal(island.plane.visible,false,'The plane never left');
 // And the ferry will have somewhere to tie up: the dock is at the island's shore, facing the town.
 const [dx,dz]=A.dock;assert.ok(Math.hypot(dx,dz)<Math.hypot(A.x,A.z),'The dock faces away from the town');
});
