import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from './fixtures.mjs';
import {buildWestShop,WEST_SHOPS,WEST_FRONT} from '../src/world/west-shops.js';

test('the wooden frontage is closed between each display window and corner post',()=>{
 installDOM();
 const parent=new THREE.Group();
 buildWestShop({parent,site:{id:'frontrow',title:'Front-Row Books & Workshop',jp:'前列書房・工房'},colliders:[],register(){},enter(){},label(){}});
 parent.updateMatrixWorld(true);
 for(const side of [-1,1])for(const y of [.3,.75,1.5,2.5])for(let edge=4.18;edge<=4.42;edge+=.02){
  const origin=new THREE.Vector3(WEST_FRONT+2,y,WEST_SHOPS.frontrow.z+side*edge);
  const hits=new THREE.Raycaster(origin,new THREE.Vector3(-1,0,0)).intersectObject(parent,true);
  const opaque=hits.find(hit=>!hit.object.material.transparent);
  assert.ok(opaque&&opaque.point.x>=WEST_FRONT-.25,'Solid frontage at side '+side+', height '+y+', edge '+edge);
 }
});

