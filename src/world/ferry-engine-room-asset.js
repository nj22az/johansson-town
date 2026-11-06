import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';
/** Loaded on the first machinery/access view aboard the ferry. */
export async function loadFerryEngineRoomH1(parent,fallback,state){
 try{
  const gltf=await new GLTFLoader().loadAsync(assetURL('models/ferry-engine-room/minato-engine-room-h1-f1.glb'));
  const bounds=new THREE.Box3().setFromObject(gltf.scene);
  if(bounds.isEmpty()||!bounds.min.toArray().concat(bounds.max.toArray()).every(Number.isFinite))throw Error('Invalid H1 mesh bounds');
  gltf.scene.name='Minato Maru H1-F1 / Blender CAD';
  gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;o.userData.ferryH1=true;}});
  parent.add(gltf.scene);parent.remove(fallback);
  const geometries=new Set(),materials=new Set();fallback.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of[].concat(o.material||[]))materials.add(m);});
  for(const g of geometries)g.dispose();for(const m of materials)m.dispose();fallback.clear();
  state.loaded=true;state.bounds={min:bounds.min.toArray(),max:bounds.max.toArray()};
  return true;
 }catch(error){state.error=String(error?.message||error);return false;}
}
