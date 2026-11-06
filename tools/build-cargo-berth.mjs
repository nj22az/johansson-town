// Bake the original CAD assembly into three independently movable, batched groups.
// Run from johansson-town: node tools/build-cargo-berth.mjs
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {GLTFExporter} from './vendor/GLTFExporter.js';
import {mergeGeometries} from '../vendor/BufferGeometryUtils.js';
const root=resolve(new URL('..',import.meta.url).pathname);
const source=resolve(root,'../cad/cargo-ship-berth');
globalThis.self=globalThis;
globalThis.FileReader=class{
 readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();});}
};
const bytes=await readFile(resolve(source,'ship-and-berth.glb'));
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
gltf.scene.updateMatrixWorld(true);
const counts=JSON.parse(await readFile(resolve(source,'validation.json'),'utf8')).models;
const original=gltf.scene.children[0].children;
if(original.length!==counts['ship-and-berth'].components)throw Error('Unexpected CAD assembly hierarchy');
const result=new THREE.Group();result.name='Original CAD cargo berth';
const partitions=[['vessel',0,counts['cargo-ship'].components],['quay',counts['cargo-ship'].components,counts['cargo-ship'].components+counts.dock.components],['connections',counts['cargo-ship'].components+counts.dock.components,original.length]];
const info={source:'cad/cargo-ship-berth/build.py',units:'metres',scale:1,groups:{}};
for(const [name,from,to] of partitions){
 const group=new THREE.Group();group.name=name;const buckets=new Map();
 for(const object of original.slice(from,to))object.traverse(o=>{
  if(!o.isMesh)return;
  const material=o.material,key=material.uuid;
  if(!buckets.has(key))buckets.set(key,{material,geometries:[]});
  const geo=o.geometry.clone().applyMatrix4(o.matrixWorld);
  for(const attr of Object.keys(geo.attributes))if(!['position','normal'].includes(attr))geo.deleteAttribute(attr);
  geo.clearGroups();buckets.get(key).geometries.push(geo);
 });
 for(const {material,geometries} of buckets.values()){
  const geometry=mergeGeometries(geometries,false);
  if(!geometry)throw Error('CAD batch merge failed');
  const mesh=new THREE.Mesh(geometry,material);mesh.name=name+'-'+material.color.getHexString();group.add(mesh);
  geometries.forEach(g=>g.dispose());
 }
 result.add(group);info.groups[name]={cadComponents:to-from,draws:group.children.length};
}
const out=resolve(root,'assets/models/harbour');await mkdir(out,{recursive:true});
const data=await new GLTFExporter().parseAsync(result,{binary:true,onlyVisible:true});
await writeFile(resolve(out,'cargo-berth.glb'),Buffer.from(data));
await writeFile(resolve(out,'cargo-berth.json'),JSON.stringify(info,null,2)+'\n');
console.log(info,'bytes:',data.byteLength);
