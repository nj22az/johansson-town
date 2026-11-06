import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildFerryModel} from '../src/world/ferry-model.js';
import {bridgeHeading,orderAngle} from '../src/world/ferry-bridge.js';
import {createPlant} from '../src/world/ferry-plant.js';
installDOM();
test('bridge follows heading and each engine order without changing the plant',()=>{
 assert.equal(bridgeHeading(0),180);assert.equal(bridgeHeading(Math.PI),0);assert.equal(bridgeHeading(-Math.PI/2),90);assert.equal(bridgeHeading(5*Math.PI),0);
 assert.ok(orderAngle('FULL AHEAD')>0,'ahead is forward in the ship frame');assert.ok(orderAngle('SLOW ASTERN')<0);
 const f=buildFerryModel(),b=f.userData.bridgeEquipment,p=createPlant({minutes:700});p.routine(700);p.tick(1);
 p.setTelegraph('mainP','HALF AHEAD');p.setTelegraph('mainS','SLOW ASTERN');const r=p.readings();f.userData.readPlant(r);
 assert.equal(b.levers[0].pivot.rotation.x,orderAngle('HALF AHEAD'));assert.equal(b.levers[1].pivot.rotation.x,orderAngle('SLOW ASTERN'));
 const parked=b.wiperRig.plan.park;assert.equal(b.wipers[0].rotation.z,parked);
 b.update(.2,{rain:true,powered:true});assert.notEqual(b.wipers[0].rotation.z,parked);
 const wetAngle=b.wipers[0].rotation.z;b.update(.2,{rain:true,powered:false});assert.equal(b.wipers[0].rotation.z,wetAngle,'power loss holds the actual blade pose');
 b.update(.2,{rain:false,powered:false});assert.equal(b.wipers[0].rotation.z,wetAngle,'unpowered blades cannot park themselves');
 for(let i=0;i<180;i++)b.update(1/60,{rain:false,powered:true});assert.ok(Math.abs(b.wipers[0].rotation.z-parked)<1e-6,'powered dry wipers return to park');
 assert.equal(p.readings().telegraph.mainS,'SLOW ASTERN');
});
test('CRT aperture, helm and chart are visible equipment in the actual model',()=>{
 const f=buildFerryModel(),b=f.userData.bridgeEquipment;f.updateMatrixWorld(true);
 assert.equal(b.wheel.children.length,1,'helm parts share a draw call');
 const spokes=b.wheel.children[0].geometry;assert.ok(spokes.attributes.position.count>500,'rim, hub and eight spokes are present');
 for(const s of [b.radar,b.sounder]){
  const target=s.mesh.getWorldPosition(new THREE.Vector3()),eye=target.clone().add(new THREE.Vector3(0,0,-.75));
  const ray=new THREE.Raycaster(eye,target.clone().sub(eye).normalize(),0,.8),hits=ray.intersectObject(f,true).filter(h=>h.object.isMesh);
  assert.equal(hits[0]?.object,s.mesh,s.mesh.name+' is not hidden behind its housing');
 }
 const normal=new THREE.Vector3(0,0,1).applyQuaternion(b.chart.mesh.quaternion);assert.ok(normal.y>.99,'chart faces upwards');
 assert.ok(b.chart.mesh.position.y<1,'chart stays on its cabinet');
});
