import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildWarehouseInterior,WAREHOUSE_ROOM} from '../src/world/interiors/warehouse.js';
import {circleHitsRect,sweepFraction} from '../physics.js';
function build(){installDOM();const room=new THREE.Group(),colliders=[],actions=[];const layout=buildWarehouseInterior({room,collider:(x,z,w,d,height)=>colliders.push({x,z,w,d,height}),reg:(o,label,fn)=>actions.push({o,label,fn}),action(){},exit(){}});return {room,colliders,actions,layout};}
test('warehouse port details keep spawn, staff and both aisle routes reachable',()=>{
 const {colliders,layout}=build();assert.equal(layout,WAREHOUSE_ROOM);
 const blocked=(x,z)=>colliders.some(c=>circleHitsRect(x,z,.32,c));
 for(const x of [-.65,0,.65])assert.equal(sweepFraction({x,z:4.5},{x,z:-3.35},blocked),1);
 assert.equal(blocked(layout.spawn[0],layout.spawn[2]),false);assert.equal(blocked(.55,-3.35),false);
 assert.equal(blocked(2.16,2.95),true);assert.equal(blocked(2.17,1.65),true);
});
test('port details are finite, batched and usable through existing inspection actions',()=>{
 const {room,actions}=build();let draws=0,triangles=0,lights=0;
 room.updateMatrixWorld(true);room.traverse(o=>{assert.ok(o.matrixWorld.elements.every(Number.isFinite));if(o.isLight)lights++;if(o.isMesh&&o.layers.test(new THREE.Layers())){draws++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
 assert.ok(draws<=35,`Draws ${draws}`);assert.ok(triangles<18000,`Triangles ${triangles}`);assert.equal(lights,1);
 for(const name of ['warehouse-cargo-hook','warehouse-hoist-rail','warehouse-jack-handle','warehouse-pallet-cargo'])assert.ok(room.getObjectByName(name),name);
 for(const title of ['Cargo hoist','Pallet jack','Island provisions'])assert.ok(actions.some(a=>a.label==='Inspect '+title));
 assert.ok(actions.some(a=>a.label==='Exit Harbour Warehouse'));assert.ok(room.userData.portBatch.drawsSaved>200);
 console.log({draws,triangles,lights,batches:room.userData.portBatch.batches});
});
