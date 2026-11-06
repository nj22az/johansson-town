import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';

let model;
async function scene(){
 if(!model){const b=await readFile(new URL('../assets/models/izakaya/minato-interior-walnut.glb',import.meta.url));model=(await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'')).scene;model.updateMatrixWorld(true);}
 return model;
}
function down(root,x,z,top){return new THREE.Raycaster(new THREE.Vector3(x,top,z),new THREE.Vector3(0,-1,0)).intersectObject(root,true);}

test('real Minato props retain seven finish batches and finite export geometry',async()=>{
 const root=await scene();let draws=0,triangles=0,glass=false;
 root.traverse(o=>{if(!o.isMesh)return;draws++;const g=o.geometry;
  for(const a of Object.values(g.attributes))assert.ok(a.array.every(Number.isFinite));
  triangles+=(g.index?.count||g.attributes.position.count)/3;
  if(o.material.transparent){glass=true;assert.ok(o.material.opacity<.4);}
 });
 assert.equal(draws,7);assert.ok(glass,'Hollow drink vessels join the transparent glass batch');
 assert.ok(triangles<210000,'Model detail remains bounded, with fixed material draws');
 const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
 assert.ok(size.x<=18.2&&size.z<=13.1,'Shared venue bounds remain intact');
});

test('the exported sinks have actual holes and recessed drains instead of black slabs',async()=>{
 const root=await scene();
 for(const [x,z,top,drain] of [[2.85,-3.06,.935,.7995],[3.52,-5.95,.915,.7495],[4.18,-5.95,.915,.7495]]){
  const hits=down(root,x,z,top);assert.ok(hits.length);
  assert.ok(Math.abs(hits[0].point.y-drain)<.012,'Actual GLB sink centre reaches its recessed floor at '+[x,z]);
 }
 const counter=down(root,2.55,-3.06,.935);assert.ok(Math.abs(counter[0].point.y-.9175)<.001,'Adjacent working surface stays at its original height');
});

test('hollow empty glass and ceramic interiors are below their rims in the real GLB',async()=>{
 const root=await scene();
 for(const [x,z,top,rim] of [[-.05,-3.0,1.06,1.05],[5.35,.45,.810,.800],[5.35,.60,.810,.800]]){
  const hits=down(root,x,z,top);assert.ok(hits.length);
  assert.ok(hits[0].point.y<rim-.010,'Open vessel has a real cavity at '+[x,z]);
 }
});

test('the rolled cotton towels rest on their shallow trays',async()=>{
 const root=await scene();
 for(const x of [-3.45,-1.95,-.45,1.05,2.55]){
  const hits=down(root,x,-2.1,FURNITURE_HEIGHTS.serviceCounter+.07);assert.ok(hits.length);
  assert.ok(Math.abs(hits[0].point.y-(FURNITURE_HEIGHTS.serviceCounter+.05))<.002,'Cotton roll is grounded on its tray at '+x);
 }
});

test('the replacement inventory covers every original food family and recognisable prop groups',async()=>{
 const inventory=JSON.parse(await readFile(new URL('../art/izakaya/minato-prop-inventory.json',import.meta.url),'utf8'));
 assert.equal(Object.keys(inventory.coverage.food).length,12);
 for(const [name,count] of Object.entries(inventory.coverage.food))assert.ok(count>0,name);
 const detail=inventory.coverage['vessels-kitchen-storage-furniture'];
 // The generic back-bar stock was retired with its cupboard. The forty-two
 // individually labelled fictional bottles are the separate walnut asset, checked
 // as loaded geometry in izakaya-backbar.test.mjs; the kitchen props stay here.
 assert.equal(detail.Bottle,0,'No old stock is hidden inside the replacement');
 assert.equal(inventory.replacement.replacementBottleCount,42);
 assert.equal(inventory.replacement.replacementBrandCount,14);
 for(const name of ['Beer crate','Rice cooker','Stock pot','Wok','Fryer basket','Tebo basket','Plate in rack','Sink basin','Sink bowl','Umbrella','Left shoes','Komodaru','Lounge back tailoring','Kamidana shrine','Noodle boiler'])assert.ok(detail[name]>0,name);
 for(const name of ['Till','Maneki-neko body','Radio cabinet','Speaker cabinet','Ticket machine','Old television','Daruma'])assert.ok(inventory.coverage.devices[name]>0,name);
 assert.equal(inventory.coverage.devices['duplicate-television-removed'],1);
});
