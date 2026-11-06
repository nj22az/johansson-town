// Flatten, orient and deduplicate the supplied crystal room; preserve source credit.
import {readFile,writeFile} from 'node:fs/promises';
import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:256,height:256,close(){}});
const input=process.argv[2];if(!input)throw Error('Pass the supplied crystal GLB');
const bytes=await readFile(input),jsonSize=bytes.readUInt32LE(12),source=JSON.parse(bytes.subarray(20,20+jsonSize)),bin=bytes.subarray(28+jsonSize);
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');gltf.scene.updateMatrixWorld(true);
const out={asset:source.asset,scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:source.materials,textures:source.textures,samplers:source.samplers,images:[],accessors:[],bufferViews:[],buffers:[],extensionsUsed:source.extensionsUsed?.filter(e=>!e.includes('lights'))};let length=0;const chunks=[];
function view(data){const b=Buffer.from(data.buffer,data.byteOffset,data.byteLength);const index=out.bufferViews.length;out.bufferViews.push({buffer:0,byteOffset:length,byteLength:b.length});chunks.push(b);length+=b.length;const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad;}return index;}
function attr(values,size){const a=new Float32Array(values),index=out.accessors.length,entry={bufferView:view(a),componentType:5126,count:a.length/size,type:size===3?'VEC3':'VEC2'};if(size===3){entry.min=[Infinity,Infinity,Infinity];entry.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<a.length;i++) {const k=i%3;entry.min[k]=Math.min(entry.min[k],a[i]);entry.max[k]=Math.max(entry.max[k],a[i]);}}out.accessors.push(entry);return index;}
for(const img of source.images){const v=source.bufferViews[img.bufferView];out.images.push({...img,bufferView:view(bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength))});}
const ground=[],batches=new Map(),seen=new Set(),materialIds=new Map();out.extensionsUsed=['KHR_materials_unlit'];
for(const m of out.materials){m.extensions={KHR_materials_unlit:{}};m.doubleSided=true;}
function clip(poly,axis,edge,sign){const result=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=(a.p[axis]-edge)*sign,db=(b.p[axis]-edge)*sign;if(da>=0)result.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);result.push({p:a.p.map((v,k)=>v+(b.p[k]-v)*t),n:a.n.map((v,k)=>v+(b.n[k]-v)*t),uv:a.uv.map((v,k)=>v+(b.uv[k]-v)*t)});}}return result;}
gltf.scene.traverse(mesh=>{if(!mesh.isMesh)return;const name=mesh.material.name;
 if(/Sdw/.test(name))return;
 const bounds=new T.Box3().setFromObject(mesh,true);
 const geometry=mesh.geometry,position=geometry.attributes.position,normal=geometry.attributes.normal,uv=geometry.attributes.uv,index=geometry.index,originalMat=gltf.parser.associations.get(mesh.material).materials;const descriptor={...out.materials[originalMat]};delete descriptor.name;const key=JSON.stringify(descriptor);if(!materialIds.has(key))materialIds.set(key,originalMat);const mat=materialIds.get(key);mesh.skeleton?.update();
 if(!batches.has(mat))batches.set(mat,{p:[],n:[],uv:[]});const batch=batches.get(mat),normalMatrix=new T.Matrix3().getNormalMatrix(mesh.matrixWorld);
 for(let i=0;i<(index?.count||position.count);i+=3){let poly=[];for(let j=0;j<3;j++){const k=index?index.getX(i+j):i+j,p=mesh.getVertexPosition(k,new T.Vector3()).applyMatrix4(mesh.matrixWorld),n=new T.Vector3().fromBufferAttribute(normal,k).applyNormalMatrix(normalMatrix);p.set(-p.x,p.y+.01,-p.z);n.set(-n.x,n.y,-n.z);poly.push({p:p.toArray(),n:n.toArray(),uv:uv?[uv.getX(k),uv.getY(k)]:[0,0]});}
  const signature=mat+':'+poly.map(v=>[...v.p,...v.uv].map(n=>n.toFixed(5)).join(',')).sort().join('|');if(seen.has(signature))continue;seen.add(signature);
  for(const v of poly){batch.p.push(...v.p);batch.n.push(...v.n);batch.uv.push(...v.uv);}
 }
});
for(const [material,b] of batches){if(!b.p.length)continue;const mesh=out.meshes.length;out.meshes.push({primitives:[{attributes:{POSITION:attr(b.p,3),NORMAL:attr(b.n,3),TEXCOORD_0:attr(b.uv,2)},material}]});out.scenes[0].nodes.push(out.nodes.length);out.nodes.push({mesh,name:out.materials[material].name});}
out.buffers=[{byteLength:length}];let j=Buffer.from(JSON.stringify(out));j=Buffer.concat([j,Buffer.alloc((4-j.length%4)%4,32)]);const b=Buffer.concat(chunks),header=Buffer.alloc(20),bh=Buffer.alloc(8);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+j.length+b.length,8);header.writeUInt32LE(j.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(b.length,0);bh.writeUInt32LE(0x004e4942,4);
await writeFile(new URL('../assets/models/crystal/crystal-room.glb',import.meta.url),Buffer.concat([header,j,bh,b]));console.log({draws:out.meshes.length,bytes:28+j.length+b.length,triangles:out.accessors.filter(a=>a.type==='VEC3').reduce((n,a)=>n+a.count,0)/6});
