// Pack the site's IEC 90L pump motor (../../motor-90l/motor.js) as one static display mesh
// for the Dock Electrical Workshop test bench.
// Reproduce: node tools/pack-motor-90l.mjs   (after `npm ci`; no browser needed)
//
// The motor is built straight from motor.js, the same code the /motor-90l/ viewer and its
// .glb export run. Only the closed motor's outside is kept (frame, feet, end shields, cowl,
// fan behind the grille, terminal box and lid, gland, shaft end, key, tie-rods, rating plate);
// the core, winding, rotor, bearings and terminal board are inside and never seen on the
// bench. Each part is welded, simplified with meshoptimizer, given creased normals and
// merged into one vertex-coloured mesh: one draw call, true size in metres. The town scales
// it 1.7x at the bench, the way motor-90l/workshop sizes it beside big-headed characters.
import assert from 'node:assert/strict';
import {register} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {MeshoptSimplifier} from 'meshoptimizer';
import * as THREE from '../vendor/three.module.js';
import {mergeGeometries,mergeVertices,toCreasedNormals} from '../vendor/BufferGeometryUtils.js';
import {installDOM} from '../tests/fixtures.mjs';

// motor.js imports the bare 'three' specifier (an import map on the site); point it at the
// town's own r170 build, the same file the motor-90l workshop page loads.
const threeURL=new URL('../vendor/three.module.js',import.meta.url).href;
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){return s==='three'?{url:${JSON.stringify(threeURL)},shortCircuit:true}:n(s,c);}`));
installDOM();// motor.js paints its bump and decal textures on canvases; they are not shipped
const {buildMotor}=await import('../../motor-90l/motor.js');

// Visible parts of the assembled B3 (foot-mounted) motor, and the colour each takes in town.
const PAINT=0x80868b,STEEL=0xb9bdc0,BRIGHT=0xd2d6da,RUBBER=0x1d1e20,FAN=0xe2ddd0,PLATE=0xd8dad6;
const KEEP={frame:PAINT,feet:PAINT,shieldDE:PAINT,shieldNDE:PAINT,cowl:PAINT,tbox:PAINT,lid:PAINT,shaft:BRIGHT,key:STEEL,tieRods:STEEL,gland:STEEL,fan:FAN,nameplate:PLATE};
const MESH_COLOUR={'cowl-screws':STEEL,'lid-screws':STEEL,'box-gasket':RUBBER,'lid-seal':RUBBER,cable:RUBBER,'M8-centre':RUBBER,rivets:STEEL};
const ERROR=.004;// simplification error, relative to each part's own size
const CREASE=35*Math.PI/180;

await MeshoptSimplifier.ready;
const motor=buildMotor();motor.root.updateMatrixWorld(true);
const pieces=[],report={kept:[],omitted:[]};let sourceTriangles=0;
for(const [id,part] of motor.parts){
 if(!(id in KEEP)){report.omitted.push(id);continue;}
 let before=0,after=0;
 part.group.traverse(mesh=>{
  if(!mesh.isMesh)return;
  // Decal planes (warning label, terminal marking) carry a texture and no meaning without it;
  // the rating plate keeps its plain plate.
  if(mesh.material.map&&id!=='nameplate')return;
  let g=mesh.geometry.clone();g.applyMatrix4(mesh.matrixWorld);g.scale(.001,.001,.001);// mm → m
  for(const name of Object.keys(g.attributes))if(name!=='position')g.deleteAttribute(name);
  g.clearGroups();g=mergeVertices(g,1e-7);
  const positions=g.attributes.position.array,source=Uint32Array.from(g.index.array);before+=source.length/3;
  const [indices]=MeshoptSimplifier.simplify(source,positions,3,0,ERROR);
  after+=indices.length/3;
  const simple=new THREE.BufferGeometry();simple.setAttribute('position',g.attributes.position);simple.setIndex(Array.from(indices));
  const creased=toCreasedNormals(simple,CREASE),count=creased.attributes.position.count,colour=new THREE.Color(MESH_COLOUR[mesh.name]??KEEP[id]),rgb=new Float32Array(count*3);
  for(let i=0;i<count;i++)colour.toArray(rgb,i*3);
  creased.setAttribute('color',new THREE.BufferAttribute(rgb,3));pieces.push(creased);
 });
 sourceTriangles+=before;report.kept.push({part:id,label:part.label,sourceTriangles:before,triangles:after});
}
const merged=mergeVertices(mergeGeometries(pieces,false),1e-6);
const [remap,unique]=MeshoptSimplifier.compactMesh(merged.index.array instanceof Uint32Array?merged.index.array:Uint32Array.from(merged.index.array));
const indexArray=merged.index.array instanceof Uint32Array?merged.index.array:Uint32Array.from(merged.index.array);
const compact=(attribute)=>{const w=attribute.itemSize,out=new Float32Array(unique*w);for(let i=0;i<remap.length;i++)if(remap[i]!==0xffffffff&&remap[i]<unique)out.set(attribute.array.subarray(i*w,i*w+w),remap[i]*w);return out;};
const p=compact(merged.attributes.position),n=compact(merged.attributes.normal),c=compact(merged.attributes.color);
const index=unique<65536?Uint16Array.from(indexArray):indexArray;
// Feet on y = 0, shaft axis along x (drive end toward −x), centred on the motor's footprint.
const bounds=new THREE.Box3();for(let i=0;i<unique;i++)bounds.expandByPoint(new THREE.Vector3().fromArray(p,i*3));
const shift=new THREE.Vector3(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
for(let i=0;i<unique;i++){p[i*3]+=shift.x;p[i*3+1]+=shift.y;p[i*3+2]+=shift.z;}
bounds.translate(shift);

// glTF 2.0 with KHR_mesh_quantization, which three's GLTFLoader reads natively (the town has no
// meshopt decoder): positions as normalised int16 under one node scale (5 µm steps), normals as
// int8, linear colours as uint8. Each attribute keeps its own 4-byte-aligned stride.
const centre=bounds.getCenter(new THREE.Vector3()),half=Math.max(...bounds.getSize(new THREE.Vector3()).toArray())/2;
const qp=new Int16Array(unique*4),qn=new Int8Array(unique*4),qc=new Uint8Array(unique*4),qmin=[32767,32767,32767],qmax=[-32767,-32767,-32767];
for(let i=0;i<unique;i++)for(let k=0;k<3;k++){
 const v=Math.round((p[i*3+k]-centre.getComponent(k))/half*32767);qp[i*4+k]=v;qmin[k]=Math.min(qmin[k],v);qmax[k]=Math.max(qmax[k],v);
 qn[i*4+k]=Math.round(Math.max(-1,Math.min(1,n[i*3+k]))*127);qc[i*4+k]=Math.round(Math.max(0,Math.min(1,c[i*3+k]))*255);
}
const chunks=[],views=[],accessors=[];let offset=0;
const append=(bytes,target,byteStride)=>{const data=Buffer.from(bytes.buffer,bytes.byteOffset,bytes.byteLength),pad=Buffer.alloc((4-data.length%4)%4);views.push({buffer:0,byteOffset:offset,byteLength:data.length,target,...(byteStride?{byteStride}:{})});chunks.push(data,pad);offset+=data.length+pad.length;return views.length-1;};
const TYPE=new Map([[Int8Array,5120],[Uint8Array,5121],[Int16Array,5122],[Uint16Array,5123],[Uint32Array,5125]]);
const vertexAccessor=(array,extra={})=>{accessors.push({bufferView:append(array,34962,4*array.BYTES_PER_ELEMENT),componentType:TYPE.get(array.constructor),count:unique,type:'VEC3',...extra});return accessors.length-1;};
const POSITION=vertexAccessor(qp,{normalized:true,min:qmin,max:qmax}),NORMAL=vertexAccessor(qn,{normalized:true}),COLOR_0=vertexAccessor(qc,{normalized:true});
accessors.push({bufferView:append(index,34963),componentType:TYPE.get(index.constructor),count:index.length,type:'SCALAR'});const indices=accessors.length-1;
const gltf={asset:{version:'2.0',generator:'Johansson Town tools/pack-motor-90l.mjs / meshoptimizer 1.2.0'},extensionsUsed:['KHR_mesh_quantization'],extensionsRequired:['KHR_mesh_quantization'],scene:0,scenes:[{nodes:[0]}],
 nodes:[{name:'IEC 90L-4 1.5 kW pump motor',mesh:0,translation:centre.toArray(),scale:[half,half,half]}],
 meshes:[{name:'IEC 90L motor display',primitives:[{attributes:{POSITION,NORMAL,COLOR_0},indices,material:0}]}],
 materials:[{name:'Motor paint and steel',doubleSided:true,pbrMetallicRoughness:{baseColorFactor:[1,1,1,1],metallicFactor:.2,roughnessFactor:.55}}],
 accessors,bufferViews:views,buffers:[{byteLength:offset}]};
const json=Buffer.from(JSON.stringify(gltf)),jsonPad=Buffer.alloc((4-json.length%4)%4,32),binary=Buffer.concat(chunks),header=Buffer.alloc(12),jsonHeader=Buffer.alloc(8),binHeader=Buffer.alloc(8);
header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+jsonPad.length+binary.length,8);
jsonHeader.writeUInt32LE(json.length+jsonPad.length);jsonHeader.write('JSON',4);binHeader.writeUInt32LE(binary.length);binHeader.writeUInt32LE(0x004e4942,4);
const result=Buffer.concat([header,jsonHeader,json,jsonPad,binHeader,binary]);
const out=new URL('../assets/models/props/',import.meta.url);
await writeFile(new URL('motor-90l-display.glb',out),result);
const hash=b=>createHash('sha256').update(b).digest('hex'),sources={};
for(const file of ['motor.js','calc.mjs'])sources['motor-90l/'+file]=hash(await readFile(new URL('../../motor-90l/'+file,import.meta.url)));
const triangles=index.length/3;assert.ok(triangles<20000,'Within the workshop prop budget');
const provenance={purpose:'Static display of the site\'s own IEC 90L pump motor on the Dock Electrical Workshop test bench',source:'../../motor-90l/motor.js buildMotor(), B3 mount, assembled',sourceSha256:sources,
 licence:'Original project content (nj22az.github.io); no third-party geometry or textures',units:'metres, true size; feet at y = 0, axis along x, drive end toward -x, terminal box up, rating plate toward +z',townScale:1.7,
 file:'motor-90l-display.glb',sha256:hash(result),bytes:result.length,sourceTriangles,triangles,vertices:unique,drawCalls:1,
 size:bounds.getSize(new THREE.Vector3()).toArray().map(v=>Math.round(v*10000)/10000),
 method:'Visible parts only; per-part weld, meshoptimizer 1.2.0 simplify (error '+ERROR+' of part size), '+Math.round(CREASE*180/Math.PI)+'° creased normals, one vertex-coloured mesh, compactMesh',parts:report.kept,omitted:report.omitted};
await writeFile(new URL('motor-90l-display-provenance.json',out),JSON.stringify(provenance,null,1)+'\n');
console.log(JSON.stringify({bytes:result.length,sourceTriangles,triangles,vertices:unique,size:provenance.size}));
