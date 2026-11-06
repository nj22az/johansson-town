import {FURNITURE_HEIGHTS} from '../src/world/furniture-standards.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {installDOM} from './fixtures.mjs';
import {OWNED_CHARACTERS} from '../src/people/owned-characters.js';
import {buildSakuraInterior} from '../src/world/interiors/sakura-interior.js';
import {ownedDisplayView} from '../tools/owned-display-views.mjs';
import {BACKROOM} from '../src/world/interiors/sakura-backroom.js';
import {compactDisplayAttribute} from '../tools/display-mesh-compaction.mjs';

test('display compaction preserves referenced triangle attributes when unused vertices follow the remap',()=>{
 const positions=Float32Array.from([1,2,3,4,5,6,7,8,9,99,98,97]);
 const uv=Float32Array.from([.1,.2,.3,.4,.5,.6,.9,.8]);
 const remap=Uint32Array.from([1,0xffffffff,0]);
 assert.deepEqual([...compactDisplayAttribute(positions,3,remap,2)],[7,8,9,1,2,3]);
 assert.deepEqual(compactDisplayAttribute(uv,2,remap,2),Float32Array.from([.5,.6,.1,.2]));
});

const root=new URL('../assets/',import.meta.url),sha=b=>createHash('sha256').update(b).digest('hex');
async function readGLB(path){
 const bytes=await readFile(new URL(path,root)),length=bytes.readUInt32LE(12),json=JSON.parse(bytes.toString('utf8',20,20+length)),binary=bytes.subarray(28+length,28+length+bytes.readUInt32LE(20+length));
 const imageBuffers=json.images.map(image=>{const v=json.bufferViews[image.bufferView];return binary.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);});
 return {bytes,json,binary,imageBuffers};
}
async function geometryOnly(asset){
 const g=structuredClone(asset.json);g.buffers=[{byteLength:asset.binary.length,uri:'data:application/octet-stream;base64,'+asset.binary.toString('base64')}];
 delete g.images;delete g.textures;delete g.samplers;g.materials=g.materials.map(m=>({name:m.name,doubleSided:m.doubleSided,pbrMetallicRoughness:{baseColorFactor:m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1]}}));
 const loaded=await new GLTFLoader().parseAsync(JSON.stringify(g),'');loaded.scene.updateMatrixWorld(true);loaded.scene.traverse(o=>o.skeleton?.update());return loaded.scene;
}

for(const spec of [
 {name:'Thuan',directory:'figurines/thuan/',original:'thuan-realistic.glb',display:'thuan-display.glb',report:'display-provenance.json',limit:98972,sourceTriangles:98972},
 {name:'Maneki-neko',directory:'models/owned/',original:'Maneki_neko_Colorful.glb',display:'maneki-neko-display.glb',report:'maneki-neko-display-provenance.json',limit:26000,sourceTriangles:26000},
])test(`${spec.name} display loads with bounded geometry and preserved source paint`,async()=>{
 installDOM();const original=await readGLB(spec.directory+spec.original),display=await readGLB(spec.directory+spec.display),report=JSON.parse(await readFile(new URL(spec.directory+spec.report,root),'utf8'));
 assert.equal(sha(original.bytes),report.sourceSha256,'The supplied original remains unchanged');assert.equal(sha(display.bytes),report.sha256);
 assert.deepEqual(display.json.materials,original.json.materials);assert.deepEqual(display.json.textures,original.json.textures);assert.deepEqual(display.json.samplers,original.json.samplers);
 assert.deepEqual(display.imageBuffers.map(sha),original.imageBuffers.map(sha),'Exact original UV/image pair');
 assert.deepEqual(display.imageBuffers.map(sha),report.paintSha256);
 assert.equal(display.json.skins,undefined);assert.equal(display.json.animations,undefined,'A static display has no hidden animation payload');
 const model=await geometryOnly(display),source=await geometryOnly(original);let triangles=0,meshes=0;
 model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;assert.ok(o.geometry.attributes.uv);assert.ok(o.geometry.attributes.normal);assert.ok(!o.isSkinnedMesh);}});
 assert.equal(meshes,1);assert.ok(triangles<=spec.limit);assert.equal(triangles,report.triangles);assert.equal(report.sourceTriangles,spec.sourceTriangles);assert.equal(triangles,spec.sourceTriangles,'No painted source face is collapsed');
 // Every original face keeps its own exact UV corners, even across tiny scan
 // islands. Geometry count/bounds alone did not catch the rejected lossy LODs.
 let sourceMesh,displayMesh;source.traverse(o=>{if(o.isMesh)sourceMesh=o;});model.traverse(o=>{if(o.isMesh)displayMesh=o;});
 const aIndex=sourceMesh.geometry.index,bIndex=displayMesh.geometry.index;
 for(let i=0;i<aIndex.count;i++)for(let axis=0;axis<2;axis++)assert.equal(displayMesh.geometry.attributes.uv.array[bIndex.getX(i)*2+axis],sourceMesh.geometry.attributes.uv.array[aIndex.getX(i)*2+axis],'Every source triangle preserves its original UV corner');
 const before=new THREE.Box3().setFromObject(source),after=new THREE.Box3().setFromObject(model),height=before.max.y-before.min.y;
 // addOwnedCharacter centres every static asset and sets its sole to zero before
 // scaling to its authored height. Compare the silhouettes in that actual frame.
 const normalized=b=>{const h=b.max.y-b.min.y,c=b.getCenter(new THREE.Vector3());return {min:{x:(b.min.x-c.x)/h,y:0,z:(b.min.z-c.z)/h},max:{x:(b.max.x-c.x)/h,y:1,z:(b.max.z-c.z)/h}};};
 const a=normalized(before),b=normalized(after);
 for(const axis of ['x','y','z'])for(const edge of ['min','max'])assert.ok(Math.abs(a[edge][axis]-b[edge][axis])<.012,'The placed silhouette stays within 1.2% of authored display height');
 if(spec.name==='Thuan'){
  const ray=new THREE.Raycaster(),depthErrors=[];
  for(const x of [-.035,0,.035])for(const y of [1.52,1.58,1.64]){
   ray.set(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1));const a=ray.intersectObject(source,true)[0],b=ray.intersectObject(model,true)[0];
   assert.ok(a&&b,`The source face remains present at ${x},${y} (source ${!!a}, display ${!!b})`);depthErrors.push(Math.abs(a.distance-b.distance));
  }
  assert.ok(Math.max(...depthErrors)*BACKROOM.figurine.height/height<.006,'Face surface changes stay below 6 mm at the current authored display scale');
 }
});

test('shop readiness waits for the cat, the back room fetches the figurine on demand, counts their real geometry and disposes pending fixtures safely',async t=>{
 installDOM();const nativeFetch=globalThis.fetch,nativeBitmap=globalThis.createImageBitmap,nativeSelf=globalThis.self;
 globalThis.self=globalThis;globalThis.window.document=globalThis.document;
 // Node has no bitmap decoder; image byte fidelity is checked above. This exercises
 // the real GLTF loader, owned-model placement and room lifecycle with real geometry.
 globalThis.createImageBitmap=async()=>({width:1024,height:1024});
 let release;const gate=new Promise(done=>{release=done;});let requested=false;
 globalThis.fetch=async(input,options)=>{
  const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
  if(url.startsWith('https://nj22az.github.io/johansson-town/assets/')){
   const path=url.split('/assets/')[1];if(path===OWNED_CHARACTERS.thuanFigurine.path){requested=true;await gate;}
   return new Response(await readFile(new URL(path,root)),{headers:{'Content-Type':'model/gltf-binary'}});
  }
  return nativeFetch(input,options);
 };
 let display;
 try{
  const room=new THREE.Group();display=buildSakuraInterior({room,reg(){},action(){},exit(){}});
  // The shop is ready without the back room's figurine (5 MB): it is fetched when he nears the shop or goes in
  // (docs/LOADING.md batch 5), and not before.
  assert.equal(await display.ready(),true);assert.equal(requested,false,'The figurine is fetched with the shop');
  const figurine=display.loadBackRooms();await new Promise(done=>setTimeout(done,30));assert.equal(requested,true);
  release();assert.equal(await figurine,true);assert.equal(display.loadBackRooms(),figurine,'The figurine is fetched twice');
  for(const kind of ['thuanFigurine','Maneki_neko_Colorful'])assert.equal(room.getObjectByName(kind)?.userData.ready,true,kind+' is part of the fully ready room');
  room.updateMatrixWorld(true);
  for(const [kind,sole,height] of [['thuanFigurine',BACKROOM.figurine.plinth,BACKROOM.figurine.height],['Maneki_neko_Colorful',FURNITURE_HEIGHTS.serviceCounter,.23]]){
   const holder=room.getObjectByName(kind),box=new THREE.Box3().setFromObject(holder);assert.ok(Math.abs(box.min.y-sole)<1e-6);assert.ok(Math.abs(box.max.y-box.min.y-height)<1e-6,'The loaded display retains its exact authored height and support');
   const view=ownedDisplayView(kind,{min:box.min.toArray(),max:box.max.toArray()}),origin=new THREE.Vector3(...view.pos),direction=new THREE.Vector3(...view.at).sub(origin).normalize();
   const meshes=[];room.traverse(o=>{if(o.isMesh&&o.visible)meshes.push(o);});
   const first=new THREE.Raycaster(origin,direction).intersectObjects(meshes,false).find(hit=>!hit.object.material?.transparent||hit.object.material.opacity>.2);
   assert.ok(first,'The actual display camera sees geometry');
   let partOfDisplay=false;for(let node=first.object;node;node=node.parent)if(node===holder)partOfDisplay=true;
   assert.equal(partOfDisplay,true,'The first visible camera hit is '+kind+', not a blocking wall or shelf ('+first.object.name+')');
  }
  let triangles=0,draws=0;room.traverse(o=>{if(!o.isMesh||!o.visible)return;draws+=Array.isArray(o.material)?o.material.length:1;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);});
  room.getObjectByName('thuanFigurine').traverse(o=>{if(o.isMesh){assert.equal(o.material.isMeshStandardMaterial,true,'The photographed figurine preserves its actual dress/face material');assert.equal(o.material.userData.keepPhysicalStrict,true);}});
  assert.ok(triangles<=450000,`${triangles} actual fully loaded triangles, budget450000`);assert.ok(draws<=813,`${draws} actual loaded draws, budget813`);
  t.diagnostic(`Fully loaded Sakura: ${triangles} triangles, ${draws} draws`);
  display.dispose();assert.equal(room.getObjectByName('thuanFigurine'),undefined);assert.equal(room.getObjectByName('Maneki_neko_Colorful'),undefined);
  assert.equal(await display.ready(),false,'A disposed room cannot mount a late model or shell');
 }finally{release();display?.dispose();globalThis.fetch=nativeFetch;globalThis.createImageBitmap=nativeBitmap;globalThis.self=nativeSelf;}
});
