import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createIndoorCeilings} from '../src/render/indoor-camera.js';
import {buildYardHomeInterior} from '../src/world/interiors/yard-home.js';
import {buildFamilyHome} from '../src/world/interiors/family-home.js';
import {installDOM} from './fixtures.mjs';

test('actual home ceilings keep the camera and its near plane below the roof',()=>{
 installDOM();
 for(const [build,height] of [[args=>buildYardHomeInterior({...args,site:{id:'resident-home-kenji',homeOwner:'Tetsuo'}}),2.5],[args=>buildFamilyHome({...args,residents:['Thuan','Thao']}),2.7]]){
  const room=new THREE.Group();build({room,reg(){},action(){},collider(){}});
  const ceiling=createIndoorCeilings(room);
  assert.ok(ceiling.count>0);
  assert.ok(Math.abs(ceiling.heightAt(0,0)-height)<.0001);
  assert.ok(ceiling.limit(0,0)<=height-.22+.0001);
  assert.equal(ceiling.heightAt(30,30),Infinity,'open air is unrestricted');
 }
});
test('sloping roofs and multiple floors use local height and the player floor',()=>{
 const room=new THREE.Group(),mat=new THREE.MeshBasicMaterial();
 const roof=new THREE.Mesh(new THREE.PlaneGeometry(8,8),mat);roof.rotation.x=Math.PI/2-.15;roof.position.y=3;room.add(roof);
 const upstairs=new THREE.Mesh(new THREE.BoxGeometry(8,.1,8),mat);upstairs.position.y=6;room.add(upstairs);
 const table=new THREE.Mesh(new THREE.BoxGeometry(2,.1,2),mat);table.position.y=.8;room.add(table);
 const ceiling=createIndoorCeilings(room);
 assert.ok(Math.abs(ceiling.heightAt(0,1)-ceiling.heightAt(0,-1))>.1);
 assert.ok(ceiling.heightAt(0,0)>2.9,'a table is not a ceiling');
 assert.ok(Math.abs(ceiling.heightAt(0,0,3.2)-5.95)<1e-5);
});
