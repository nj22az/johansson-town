import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createTownSections,districtAt} from '../src/render/town-sections.js';
test('boundaries retain nearby buildings and moving residents follow their section',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group();scene.add(town);
 const actor=new THREE.Group();actor.userData.name='Resident';town.add(actor);
 const person=new THREE.Mesh(new THREE.BoxGeometry(1,2,1),new THREE.MeshBasicMaterial());actor.add(person);
 const view=createTownSections({mobile:true}),position=new THREE.Vector3(0,0,-44),camera=new THREE.PerspectiveCamera();let visible;
 const renderer={render(){visible=person.visible;}};
 actor.position.set(0,0,-49);view.render({renderer,scene,camera,town,position});assert.equal(visible,true);
 actor.position.set(0,0,50);view.render({renderer,scene,camera,town,position});assert.equal(visible,false);
 assert.equal(districtAt(0,-49),'Port');assert.equal(districtAt(30,-35),'Park');
});
test('town-wide instance batches submit only nearby instances and restore buffers',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group();scene.add(town);
 const batch=new THREE.InstancedMesh(new THREE.BoxGeometry(2,2,2),new THREE.MeshBasicMaterial(),3);
 const matrix=new THREE.Matrix4();[38,-65,-75].forEach((z,i)=>{matrix.makeTranslation(0,1,z);batch.setMatrixAt(i,matrix);});town.add(batch);
 const original=batch.instanceMatrix,view=createTownSections({mobile:true}),position=new THREE.Vector3(0,0,38),camera=new THREE.PerspectiveCamera();let count;
 const renderer={render(){count=batch.count;}};
 const render=()=>view.render({renderer,scene,camera,town,position});
 render();assert.equal(count,1);assert.equal(batch.count,3);assert.equal(batch.instanceMatrix,original);
 position.z=-65;render();assert.equal(count,2);assert.equal(batch.count,3);assert.equal(batch.instanceMatrix,original);
});

test('crossing the old 24 metre boundary does not drop the adjoining street',()=>{
 const scene=new THREE.Scene(),town=new THREE.Group();scene.add(town);
 const shop=new THREE.Mesh(new THREE.BoxGeometry(4,5,4),new THREE.MeshBasicMaterial());shop.position.set(0,2.5,-27);town.add(shop);
 const view=createTownSections({mobile:true}),camera=new THREE.PerspectiveCamera(),position=new THREE.Vector3(0,0,23.9),seen=[];
 const renderer={render(){seen.push(shop.visible);}};
 view.render({renderer,scene,camera,town,position});position.z=24.1;view.render({renderer,scene,camera,town,position});assert.deepEqual(seen,[true,true]);
});
