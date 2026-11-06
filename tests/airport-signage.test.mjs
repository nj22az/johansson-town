import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildAirportDistrict} from '../src/world/airport-district.js';
import {AIRPORT_ISLAND} from '../src/world/airport-island.js';
import {AIRPORT_SHOPS,AIRPORT_GATES} from '../src/world/airport-district-plan.js';
import {SEA_LEVEL} from '../src/world/ocean.js';

test('airport signs present their textured front to the actual customer and gate anchors',()=>{
 installDOM();
 const group=new THREE.Group(),island=new THREE.Group(),anchors=new Map();
 island.position.set(AIRPORT_ISLAND.x,SEA_LEVEL,AIRPORT_ISLAND.z);island.rotation.y=AIRPORT_ISLAND.yaw;group.add(island);
 buildAirportDistrict({world:{group,airportIsland:{group:island},colliders:[]},register:(a,label)=>anchors.set(label,a),onAction(){}});
 group.updateMatrixWorld(true);
 const ray=new THREE.Raycaster();
 function facesCustomer(text,label){
  const sign=island.getObjectByName(text+' sign'),anchor=anchors.get(label);
  assert.ok(sign&&anchor,'Actual sign and interaction anchor exist for '+text);
  const centre=sign.getWorldPosition(new THREE.Vector3()),customer=anchor.getWorldPosition(new THREE.Vector3());
  customer.y=centre.y;
  const towardCustomer=customer.clone().sub(centre).normalize(),front=new THREE.Vector3(0,0,1).transformDirection(sign.matrixWorld);
  assert.ok(front.dot(towardCustomer)>.75,text+' is read from its mirrored back face');
  ray.set(customer,centre.clone().sub(customer).normalize());
  const hit=ray.intersectObject(sign,false)[0];
  assert.ok(hit,'The real interaction viewpoint sees '+text+' sign');
  assert.ok(hit.face.normal.clone().transformDirection(sign.matrixWorld).dot(towardCustomer)>.75,'Customer ray intersects the textured front of '+text);
 }
 for(const shop of AIRPORT_SHOPS)facesCustomer(shop.title,'Visit '+shop.title);
 for(const gate of AIRPORT_GATES)facesCustomer(gate.title,'Read gate '+gate.id);
 facesCustomer('CORAL BAY ↓  ·  HINATA LOOKOUT ↗','Read the island trail map');
});
