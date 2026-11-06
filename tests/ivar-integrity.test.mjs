import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {prepareFurniture,IKEA_FURNITURE} from '../src/world/interiors/ikea-furniture.js';

const asset=name=>readFileSync(new URL('../assets/models/furniture/'+name,import.meta.url));
const jsonOf=bytes=>JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
const trianglesOf=json=>json.meshes.reduce((total,mesh)=>total+mesh.primitives.reduce((sum,p)=>sum+json.accessors[p.indices].count/3,0),0);
async function ivar(){const bytes=asset('town-ivar.glb');return {bytes,scene:(await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene};}

test('IVAR keeps the intact source topology, town palette and a bounded texture-free asset',async()=>{
 const source=asset('ikea-ivar.glb'),original=jsonOf(source),{bytes,scene}=await ivar(),variant=jsonOf(bytes);
 assert.equal(createHash('sha256').update(source).digest('hex'),'d11597a81c23f3f84b5e17a65714073ddbc28a27fd6aa721fbacbd6bd6e597a2','the downloaded original stays immutable');
 assert.equal(trianglesOf(variant),trianglesOf(original),'the original 7,767 triangles survive without collapse simplification');
 assert.ok(bytes.length<600000,'intact untextured geometry remains below 600 KB');
 assert.equal(variant.images,undefined,'photographic textures are absent');assert.equal(variant.textures,undefined);
 let vertices=0;scene.traverse(o=>{if(!o.isMesh)return;vertices+=o.geometry.attributes.position.count;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials){assert.equal(m.name,'ivar town palette');for(const [channel,want] of [['r',.57],['g',.4],['b',.23]])assert.ok(Math.abs(m.color[channel]-want)<1e-6,'the existing warm matte palette stays unchanged');assert.ok(Math.abs(m.roughness-.95)<1e-6);assert.equal(m.map,null);}assert.equal(o.geometry.attributes.uv,undefined);});
 assert.ok(vertices<=20000,'original IVAR fits the 20,000 vertex budget');
 const model=prepareFurniture(scene,'ivar'),bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),spec=IKEA_FURNITURE.ivar;
 assert.ok(Math.abs(bounds.min.y)<1e-6,'cabinet remains grounded');
 for(const [axis,want] of [['x',spec.width],['y',spec.height],['z',spec.depth]])assert.ok(Math.abs(size[axis]-want)<1e-6,'measured '+axis+' footprint remains unchanged');
});

test('the shared-home camera sees a continuous IVAR exterior at the former dashed panel cracks',async()=>{
 const {scene}=await ivar(),model=prepareFurniture(scene,'ivar');model.position.set(-2.85,0,.75);model.updateMatrixWorld(true);
 const camera=new THREE.PerspectiveCamera(65,1280/800,.15,480);camera.position.set(2.5,1.6,2.5);camera.lookAt(-.45,.78,-.45);camera.updateMatrixWorld(true);
 // In the collapsed variant these sightlines passed through tiny exterior slits
 // and reached the inner side at x=.382, exposing an 18 mm recess to the ink pass.
 for(const [x,y] of [[319.5,399.5],[336,389],[338.5,387],[339.5,386]]){
  const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(x/1280*2-1,1-y/800*2),camera);
  const hit=ray.intersectObject(model,true)[0];assert.ok(hit,'cabinet exists at the affected sightline');
  const local=hit.object.worldToLocal(hit.point.clone());
  assert.ok(local.x>.398&&local.x<.402,'pixel '+x+','+y+' must meet the continuous exterior x=.400, not the exposed inner panel x=.382');
 }
});

test('repairing IVAR does not regenerate the LACK derivative',()=>{
 assert.equal(createHash('sha256').update(asset('town-lack.glb')).digest('hex'),'8c832f25d5a0a135e33ef5349e90f5fa476fbbe7ee35e9a07ca9de70a414e46f');
});
