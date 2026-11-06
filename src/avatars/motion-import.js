import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {retargetMotion} from './motion.js';

/** Only self-contained GLB is accepted; importing a motion must not fetch remote resources. */
export function inspectMotionGLB(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<20||buffer.byteLength>32*1024*1024)throw Error('Choose a GLB smaller than 32 MB.');
 const view=new DataView(buffer);
 if(view.getUint32(0,true)!==0x46546c67||view.getUint32(4,true)!==2||view.getUint32(8,true)!==buffer.byteLength||view.getUint32(16,true)!==0x4e4f534a)throw Error('Choose a valid glTF 2.0 binary file.');
 const length=view.getUint32(12,true);if(length>buffer.byteLength-20)throw Error('The GLB JSON chunk is incomplete.');
 const json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,length)));
 if([...json.buffers||[],...json.images||[]].some(entry=>entry.uri&&!entry.uri.startsWith('data:')))throw Error('Use a self-contained GLB with embedded resources.');
 if(!json.animations?.length||json.animations.length>32||!json.skins?.length||json.nodes?.length>4096)throw Error('Choose a skinned GLB with 1–32 animation clips and at most 4096 nodes.');
 return json;
}

export async function importMotionGLB(buffer,getTarget){
 inspectMotionGLB(buffer);
 const manager=new THREE.LoadingManager();
 manager.setURLModifier(url=>{if(/^(blob:|data:)/.test(url))return url;throw Error('External animation resources are not supported.');});
 const gltf=await new GLTFLoader(manager).parseAsync(buffer,'');
 const dispose=()=>{
  const geometries=new Set(),materials=new Set(),textures=new Set();
  for(const scene of gltf.scenes)scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures){t.dispose();t.image?.close?.();}
 };
 return {names:gltf.animations.map((c,i)=>c.name||'Animation '+(i+1)),motion(index){const target=getTarget();try{return retargetMotion(gltf.scene,gltf.animations[index],target);}finally{target.dispose();}},dispose};
}
