// Faithful static displays. Preserve source triangle/UV charts; strip unused rigs.
// Reproduce: node tools/optimize-owned-displays.mjs [thuan|cat]
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MeshoptSimplifier} from 'meshoptimizer';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {compactDisplayAttribute} from './display-mesh-compaction.mjs';

globalThis.ProgressEvent??=class ProgressEvent{constructor(type,init={}){this.type=type;Object.assign(this,init);}};

const kind=process.argv[2]||'thuan';
const config={
 thuan:{directory:'figurines/thuan',source:'thuan-realistic.glb',output:'thuan-display.glb',report:'display-provenance.json',name:'Thuan',height:.85,limit:98972},
 cat:{directory:'models/owned',source:'Maneki_neko_Colorful.glb',output:'maneki-neko-display.glb',report:'maneki-neko-display-provenance.json',name:'Maneki-neko',height:.23,limit:26000},
}[kind];
assert.ok(config,'Choose thuan or cat');
const base=new URL('../assets/'+config.directory+'/',import.meta.url);
const source=await readFile(new URL(config.source,base));
const jsonLength=source.readUInt32LE(12),g=JSON.parse(source.toString('utf8',20,20+jsonLength));
const bin=source.subarray(28+jsonLength,28+jsonLength+source.readUInt32LE(20+jsonLength));
const geometryDoc=structuredClone(g);
geometryDoc.buffers=[{byteLength:bin.length,uri:'data:application/octet-stream;base64,'+bin.toString('base64')}];
delete geometryDoc.images;delete geometryDoc.textures;delete geometryDoc.samplers;
geometryDoc.materials=g.materials.map(m=>({name:m.name,pbrMetallicRoughness:{baseColorFactor:m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1],metallicFactor:m.pbrMetallicRoughness?.metallicFactor??1,roughnessFactor:m.pbrMetallicRoughness?.roughnessFactor??1}}));
const loaded=await new GLTFLoader().parseAsync(JSON.stringify(geometryDoc),'');
loaded.scene.updateMatrixWorld(true);
const meshes=[];loaded.scene.traverse(o=>{if(o.isMesh)meshes.push(o);});
assert.equal(meshes.length,1,'The preserved source is one textured body');
const mesh=meshes[0],geometry=mesh.geometry,sourceCount=geometry.attributes.position.count;
mesh.skeleton?.update();
let positions=new Float32Array(sourceCount*3),normals=new Float32Array(sourceCount*3),uvs=new Float32Array(sourceCount*2);
const normalMatrix=new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld),point=new THREE.Vector3();
const bounds=new THREE.Box3();
for(let i=0;i<sourceCount;i++){
 mesh.getVertexPosition(i,point).applyMatrix4(mesh.matrixWorld);point.toArray(positions,i*3);bounds.expandByPoint(point);
 point.fromBufferAttribute(geometry.attributes.normal,i).applyNormalMatrix(normalMatrix).toArray(normals,i*3);
 uvs[i*2]=geometry.attributes.uv.getX(i);uvs[i*2+1]=geometry.attributes.uv.getY(i);
}
// Scan paint uses many tiny UV islands. Lossy collapse joined unrelated islands
// and fractured their colours in real unlit screenshots. Keep every source face.
const sourceIndices=Uint32Array.from(geometry.index.array);
await MeshoptSimplifier.ready;
let indices=sourceIndices;
assert.equal(indices.length,config.limit*3,'Faithful static packing retains every source face');
const usedSourceIndices=indices.slice();
const [remap,unique]=MeshoptSimplifier.compactMesh(indices);
const compact=(array,width)=>compactDisplayAttribute(array,width,remap,unique);
const p=compact(positions,3),n=compact(normals,3),uv=compact(uvs,2),shortIndices=unique<65536?Uint16Array.from(indices):indices;
for(const [before,after,width] of [[positions,p,3],[normals,n,3],[uvs,uv,2]])for(let i=0;i<indices.length;i++)for(let k=0;k<width;k++)assert.equal(after[indices[i]*width+k],before[usedSourceIndices[i]*width+k],'Compaction preserves every used triangle attribute');
const chunks=[],views=[];let offset=0;
const append=(bytes,target)=>{const data=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength),pad=Buffer.alloc((4-data.length%4)%4);const index=views.length;views.push({buffer:0,byteOffset:offset,byteLength:data.length,...(target?{target}:{})});chunks.push(data,pad);offset+=data.length+pad.length;return index;};
const accessors=[];
const addAccessor=(array,width,type,target,range)=>{const index=accessors.length;accessors.push({bufferView:append(array,target),componentType:array instanceof Float32Array?5126:array instanceof Uint16Array?5123:5125,count:array.length/width,type,...range});return index;};
const displayBounds=new THREE.Box3();for(let i=0;i<unique;i++)displayBounds.expandByPoint(new THREE.Vector3().fromArray(p,i*3));
const position=addAccessor(p,3,'VEC3',34962,{min:displayBounds.min.toArray(),max:displayBounds.max.toArray()}),normal=addAccessor(n,3,'VEC3',34962),texcoord=addAccessor(uv,2,'VEC2',34962),index=addAccessor(shortIndices,1,'SCALAR',34963);
// Exact original images, UVs and PBR; remove only unused runtime attributes.
const paintDoc=g,paintBin=bin;
const paintHashes=[];
const images=paintDoc.images.map(image=>{const view=paintDoc.bufferViews[image.bufferView],bytes=paintBin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);paintHashes.push(createHash('sha256').update(bytes).digest('hex'));return {...image,bufferView:append(bytes)};});
const output={asset:{version:'2.0',generator:'Johansson Town faithful static display / meshoptimizer 1.2.0 compactMesh'},scene:0,scenes:[{nodes:[0]}],nodes:[{name:config.name+' display neutral',mesh:0}],meshes:[{name:config.name+' faithful static display',primitives:[{attributes:{POSITION:position,NORMAL:normal,TEXCOORD_0:texcoord},indices:index,material:g.meshes[0].primitives[0].material}]}],materials:g.materials,textures:g.textures,samplers:g.samplers,images,accessors,bufferViews:views,buffers:[{byteLength:offset}]};
const json=Buffer.from(JSON.stringify(output)),jsonPad=Buffer.alloc((4-json.length%4)%4,32),binary=Buffer.concat(chunks),header=Buffer.alloc(12),jsonHeader=Buffer.alloc(8),binHeader=Buffer.alloc(8);
header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+jsonPad.length+binary.length,8);jsonHeader.writeUInt32LE(json.length+jsonPad.length);jsonHeader.write('JSON',4);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4);
const result=Buffer.concat([header,jsonHeader,json,jsonPad,binHeader,binary]);
await writeFile(new URL(config.output,base),result);
const hash=b=>createHash('sha256').update(b).digest('hex');
const report={purpose:'Static '+config.height+'m Sakura display only; never a living NPC',source:config.source,sourceSha256:hash(source),file:config.output,sha256:hash(result),sourceTriangles:g.accessors[g.meshes[0].primitives[0].indices].count/3,triangles:indices.length/3,vertices:unique,bytes:result.length,animations:[],skins:0,materialImages:'Original embedded images copied byte-for-byte',paintSha256:paintHashes,method:'Default source pose baked; every original triangle, normal and UV retained; meshoptimizer 1.2.0 compactMesh removes unused vertices; skin/animation/tangent payload removed from static display',normalizedError:0,sourceBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},displayBounds:{min:displayBounds.min.toArray(),max:displayBounds.max.toArray()},reproduce:'node tools/optimize-owned-displays.mjs '+kind};
await writeFile(new URL(config.report,base),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
