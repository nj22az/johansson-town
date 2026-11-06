import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildVyFamilyHome} from '../src/world/interiors/vy-room.js';
import {buildResidentHome} from '../src/world/interiors/resident-home.js';
import {createRoomWalk} from '../src/people/room-walk.js';
import {installDOM} from './fixtures.mjs';

test('Vy has separate bedding and reachable bedroom, desk, and family exit',()=>{
 installDOM();const room=new THREE.Group(),cols=[];
 const L=buildResidentHome({site:{plot:'kitahama-1'},profile:{name:'Thuan'},room,reg(){},action(){},exit(){},collider:(x,z,w,d)=>cols.push({x,z,w,d})});
 // Thuan's weekday guest bedding went with her weekday room (phase 3 of docs/CAST-CONSOLIDATION.md).
 assert.ok(room.getObjectByName('Futon Vy'));assert.equal(room.getObjectByName('Futon Thuan'),undefined);assert.equal(L.homeLayouts.Thuan,undefined);
 assert.notEqual(L.homeLayouts.Vy.bed[0],L.homeLayouts.Thao.bed[0]);
 const mats=[];room.traverse(o=>{if(o.name==='Vy tatami')mats.push(o.geometry.parameters.width*o.geometry.parameters.depth);});
 assert.equal(mats.length,5);assert.ok(Math.max(...mats)/Math.min(...mats)>1.9,'four full mats and one half');
 const B=L.bounds,blocked=(x,z,r)=>x<B.minX+r||x>B.maxX-r||z<B.minZ+r||z>B.maxZ-r||cols.some(c=>Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
 const p={g:new THREE.Object3D(),profile:{name:'Vy',age:11}};p.g.position.set(...L.spawn);
 const walk=createRoomWalk(blocked);
 for(const at of [L.homeLayouts.Vy.bedside,L.homeLayouts.Vy.tableStand,L.spawn]){let done=false;for(let i=0;i<1600&&!done;i++)done=walk.move(p,at,1/20);assert.ok(done,'Vy can reach '+at.join(','));}
 room.updateMatrixWorld(true);
 for(const name of ['Vy','Thao','Chin']){
  const bed=new THREE.Box3().setFromObject(room.getObjectByName('Futon '+name));
  for(const c of cols)assert.ok(!(bed.min.x<c.x+c.w/2&&bed.max.x>c.x-c.w/2&&bed.min.z<c.z+c.d/2&&bed.max.z>c.z-c.d/2),'Futon '+name+' overlaps solid furniture');
 }
});

test('the desk lamp toggles independently and the family exit remains usable',()=>{
 const room=new THREE.Group(),entries=[],actions=[];let exited=false;
 buildVyFamilyHome({room,reg:(o,label,fn)=>entries.push({o,label,fn}),action:(...a)=>actions.push(a),exit:()=>{exited=true;}});
 const lamp=entries.find(e=>e.label==='Switch Vy’s desk lamp');lamp.fn();lamp.fn();assert.equal(actions.length,2);assert.match(actions[0][2],/off/);assert.match(actions[1][2],/lights/);
 entries.find(e=>e.label==='Leave the family home').fn();assert.ok(exited);
});
