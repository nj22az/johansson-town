import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {createLensOcclusion} from '../src/render/lens-occlusion.js';

function street(){
 const root=new THREE.Group();
 // A single-sided awning 2.5 m up, facing the sky, and a shop's glass front.
 const awning=new THREE.Mesh(new THREE.BoxGeometry(3,.4,1.2),new THREE.MeshStandardMaterial());awning.position.set(-1.5,2.6,0);root.add(awning);
 const glass=new THREE.Mesh(new THREE.BoxGeometry(.05,2.4,3),new THREE.MeshStandardMaterial({transparent:true,opacity:.3,depthWrite:false}));glass.position.set(-3,1.2,0);root.add(glass);
 const neighbour=new THREE.Mesh(new THREE.BoxGeometry(.6,1.8,.6),new THREE.MeshStandardMaterial());neighbour.position.set(2,1,0);neighbour.userData.character=true;root.add(neighbour);
 const pavement=new THREE.Mesh(new THREE.BoxGeometry(20,.1,20),new THREE.MeshStandardMaterial());root.add(pavement);
 const cane=new THREE.InstancedMesh(new THREE.BoxGeometry(.2,2,.2),new THREE.MeshStandardMaterial(),2);cane.setMatrixAt(0,new THREE.Matrix4().makeTranslation(0,1,-4));cane.setMatrixAt(1,new THREE.Matrix4().makeTranslation(40,1,40));root.add(cane);
 return {root,awning,glass};
}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);

test('the lens stops at an awning seen from below and at shop glass, not at people or the pavement',()=>{
 const {root}=street(),lens=createLensOcclusion({root});
 assert.ok(Math.abs(lens.clear(V(-1.5,1.6,0),V(0,1,0),3)-.8)<1e-3,'awning underside, though only its top was meant to be seen');
 assert.ok(Math.abs(lens.clear(V(0,1.5,0),V(-1,0,0),5)-2.975)<1e-3,'glass storefront');
 assert.equal(lens.clear(V(0,1.5,0),V(1,0,0),4),4,'a neighbour walking behind does not pull the lens in');
 assert.equal(lens.clear(V(0,1.5,0),V(0,-1,0),1.2),1.2,'flat ground is left to the ground clamp');
 assert.ok(Math.abs(lens.clear(V(0,1.5,-2),V(0,0,-1),4)-1.9)<1e-3,'an instanced stalk counts where it stands');
});

test('a hidden section is not in the way',()=>{
 const {root,awning}=street(),lens=createLensOcclusion({root});
 awning.visible=false;
 assert.equal(lens.clear(V(-1.5,1.6,0),V(0,1,0),3),3);
});
