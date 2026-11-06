// Scan the fitted game room, including runtime dressing, without a GPU.
// node --max-old-space-size=6144 tools/audit-izakaya-room.mjs [report.json]
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';
import {coplanarOverlaps} from './z-fighting.mjs';
import {MINATO_COMPACT as P} from '../src/world/interiors/minato-compact-plan.js';
installDOM();globalThis.self=globalThis;
// Geometry/material inspection only; this does not claim a texture or GPU test.
globalThis.createImageBitmap=async()=>({width:2048,height:2048,close(){}});
const fetchBlob=globalThis.fetch;
globalThis.fetch=async(input,options)=>{
 const url=new URL(typeof input==='string'?input:input.url);
 if(url.protocol==='blob:')return fetchBlob(input,options);
 const prefix='/johansson-town/assets/models/izakaya/';
 if(!url.pathname.startsWith(prefix))throw Error('Unexpected asset '+url.pathname);
 return new Response(await readFile(new URL('../assets/models/izakaya/'+url.pathname.slice(prefix.length),import.meta.url)),{headers:{'Content-Type':'model/gltf-binary'}});
};
const {preloadIzakaya,izakayaReady,buildIzakayaRoom}=await import('../src/world/izakaya.js');
await preloadIzakaya(['interior']);if(!izakayaReady('interior'))throw Error('Fitted room did not load');
const room=new THREE.Group(),api=buildIzakayaRoom({room});room.updateMatrixWorld(true);
let meshes=0,triangles=0;const invalid=[];
room.traverse(o=>{
 if(!o.matrixWorld.elements.every(Number.isFinite))invalid.push(o.name);
 if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}
});
const options={tolerance:.002,minArea:.0005,keepIdentical:true};
const findings=coplanarOverlaps(room,options);
api.bar.doorOpen=1;room.updateMatrixWorld(true);
const openDoorFindings=coplanarOverlaps(room,options);
api.bar.doorOpen=0;
const report={revision:P.revision,verification:'Loaded game geometry; no GPU or physical-device claim',meshes,triangles,
 toleranceMetres:options.tolerance,minimumAreaM2:options.minArea,findings,openDoorFindings,invalid,
 passed:findings.length===0&&openDoorFindings.length===0&&invalid.length===0};
api.dispose();api.television?.dispose();
if(process.argv[2]){const path=resolve(process.argv[2]);await mkdir(dirname(path),{recursive:true});await writeFile(path,JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1;
