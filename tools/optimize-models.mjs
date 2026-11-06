// Usage: node tools/optimize-models.mjs /absolute/path/to/source-candidates
// The source folder must contain quaternius-*.glb packaged from the creator downloads.
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const candidateBase=pathToFileURL(resolve(process.argv[2]||'.')+'/');
import {readFile, writeFile} from 'node:fs/promises';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {mergeGeometries,mergeVertices} from '../vendor/BufferGeometryUtils.js';
import {SkinnedMesh,MeshStandardMaterial,Float32BufferAttribute,Matrix4,DoubleSide,AnimationMixer,Vector3} from '../vendor/three.module.js';
import {GLTFExporter} from './vendor/GLTFExporter.js';
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.({target:this});});} readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result='data:'+blob.type+';base64,'+Buffer.from(b).toString('base64');this.onloadend?.({target:this});});}};
const names=['worker','suit','casual_2','female_casual','female_formal'];
const friendly=new Set(['Idle','Idle_Neutral','Walk','Run','Interact','Wave']);
const matrixEqual=(a,b)=>a.elements.every((v,i)=>Math.abs(v-b.elements[i])<1e-7);
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
const load=async name=>{const b=await readFile(new URL(name,candidateBase));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');};
const report=[];
for(const name of names){
 const gltf=await load('quaternius-'+name+'.glb');gltf.scene.updateMatrixWorld(true);
 const meshes=[],removed=[];gltf.scene.traverse(o=>{if(o.isSkinnedMesh){let p=o;while(p&& !/Pistol|Sword|Gun/i.test(p.name))p=p.parent;if(p)removed.push(o);else meshes.push(o);}});
 for(const m of removed)m.removeFromParent();
 const first=meshes[0];
 for(const m of meshes){
  assert(matrixEqual(m.matrixWorld,first.matrixWorld),name+' mesh matrices differ');
  assert(matrixEqual(m.bindMatrix,first.bindMatrix)&&matrixEqual(m.bindMatrixInverse,first.bindMatrixInverse),name+' bind matrices differ');
  assert(m.skeleton.bones.every((b,i)=>b===first.skeleton.bones[i]),name+' joint indices differ');
  assert(m.skeleton.boneInverses.every((b,i)=>matrixEqual(b,first.skeleton.boneInverses[i])),name+' inverse bind differs');
  assert(!m.material.map&&!m.material.normalMap&&!m.material.transparent&&m.material.opacity===1&&m.material.roughness===0.5&&m.material.metalness===0,name+' incompatible materials');
 }
 const pieces=[],mapping=[];
 for(const m of meshes){
  const source=m.geometry;const geometry=source.index?source.toNonIndexed():source.clone();const old=geometry.attributes.color;const colour=m.material.color;const count=geometry.attributes.position.count;const palette=new Float32Array(count*3);
  for(let i=0;i<count;i++){
   palette[i*3]=colour.r*(old&&m.material.vertexColors?old.getX(i):1);
   palette[i*3+1]=colour.g*(old&&m.material.vertexColors?old.getY(i):1);
   palette[i*3+2]=colour.b*(old&&m.material.vertexColors?old.getZ(i):1);
   mapping.push([m,source.index?source.index.getX(i):i]);
  }
  geometry.setAttribute('color',new Float32BufferAttribute(palette,3));geometry.deleteAttribute('uv');geometry.clearGroups();pieces.push(geometry);
 }
 const expanded=mergeGeometries(pieces,false);assert(expanded,'merge failed');
 // Exact deduplication: retain source positions/normals/skin weights/colours.
 const geometry=mergeVertices(expanded,1e-7);geometry.clearGroups();
 const body=new SkinnedMesh(geometry,new MeshStandardMaterial({name:'TownPalette',vertexColors:true,color:0xffffff,roughness:0.5,metalness:0,side:DoubleSide}));body.name='ResidentBody';
 const local=new Matrix4().copy(gltf.scene.matrixWorld).invert().multiply(first.matrixWorld);local.decompose(body.position,body.quaternion,body.scale);gltf.scene.add(body);body.bind(first.skeleton,first.bindMatrix);body.frustumCulled=false;
 const clips=gltf.animations.filter(c=>friendly.has(c.name));const mixer=new AnimationMixer(gltf.scene);const p=new Vector3(),q=new Vector3();let maxError=0;let compared=0;
 function compare(){gltf.scene.updateMatrixWorld(true);for(let i=0;i<mapping.length;i++){const [m,index]=mapping[i];m.getVertexPosition(index,p).applyMatrix4(m.matrixWorld);body.getVertexPosition(geometry.index.getX(i),q).applyMatrix4(body.matrixWorld);maxError=Math.max(maxError,p.distanceTo(q));compared++;} }
 for(const clip of clips){mixer.stopAllAction();mixer.clipAction(clip).play();for(const ratio of [0,0.19,0.47,0.83]){mixer.setTime(clip.duration*ratio);compare();}}
 mixer.stopAllAction();mixer.clipAction(clips.find(c=>c.name==='Idle_Neutral')).setEffectiveWeight(.5).play();mixer.clipAction(clips.find(c=>c.name==='Walk')).setEffectiveWeight(.5).play();mixer.setTime(.43);compare();
 assert(maxError<1e-5,name+' deformation changed '+maxError);
 mixer.stopAllAction();first.skeleton.pose();gltf.scene.updateMatrixWorld(true);
 // Keep only the one body mesh; bone hierarchy and original animation targets stay intact.
 for(const m of meshes)m.removeFromParent();
 const binary=await new GLTFExporter().parseAsync(gltf.scene,{binary:true,animations:clips,onlyVisible:true});
 const filename='town-'+name+'.glb';await writeFile(new URL(filename,candidateBase),Buffer.from(binary));
 const exported=await load(filename);const newMeshes=[];exported.scene.traverse(o=>{if(o.isMesh)newMeshes.push(o);});assert(newMeshes.length===1&&newMeshes[0].isSkinnedMesh,name+' not one skinned mesh');assert(exported.animations.length===6,name+' lost animation');
 // Verify exported skin attributes and every triangle-corner pose against the merged pre-export model.
 const optimized=newMeshes[0];const reloadMixer=new AnimationMixer(exported.scene);let exportError=0;
 for(const clip of exported.animations){
  mixer.stopAllAction();reloadMixer.stopAllAction();mixer.clipAction(clips.find(c=>c.name===clip.name)).setEffectiveWeight(1).play();reloadMixer.clipAction(clip).setEffectiveWeight(1).play();
  for(const ratio of [0,.19,.47,.83]){mixer.setTime(clip.duration*ratio);reloadMixer.setTime(clip.duration*ratio);gltf.scene.updateMatrixWorld(true);exported.scene.updateMatrixWorld(true);for(let i=0;i<geometry.index.count;i++){body.getVertexPosition(geometry.index.getX(i),p).applyMatrix4(body.matrixWorld);optimized.getVertexPosition(optimized.geometry.index.getX(i),q).applyMatrix4(optimized.matrixWorld);exportError=Math.max(exportError,p.distanceTo(q));}}
 }
 assert(exportError<1e-5,name+' exported deformation differs '+exportError);
 const item={name,filename,bytes:binary.byteLength,sourceDrawCalls:meshes.length+removed.length,drawCalls:1,triangles:geometry.index.count/3,vertices:geometry.attributes.position.count,removedAccessories:removed.map(m=>m.parent?.name||m.name),clips:clips.map(c=>c.name),comparedVertices:compared,maxDeformationErrorM:maxError,maxExportErrorM:exportError};report.push(item);console.log(JSON.stringify(item));
}
await writeFile(new URL('optimization-report.json',candidateBase),JSON.stringify(report,null,2));
