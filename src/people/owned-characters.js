import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {clone} from '../../vendor/SkeletonUtils.js';
import {assetURL} from '../assets.js';
import {celFrom} from '../render/cel.js';

const cache=new Map();
export const OWNED_CHARACTERS=Object.freeze({barfly:{height:1.5,clip:'Idle'},Jonsson:{height:1.35,clip:'Work'},merry_Moose:{height:.62},Maneki_neko_Colorful:{height:.32,path:'models/owned/maneki-neko-display.glb',static:true},thuanFigurine:{height:.24,path:"figurines/thuan/thuan-display.glb",static:true}});
function load(kind){
 if(!cache.has(kind))cache.set(kind,new GLTFLoader().loadAsync(assetURL(OWNED_CHARACTERS[kind].path||'models/owned/'+kind+'.glb')).then(g=>{
  const material=m=>{if(kind==='thuanFigurine'){m.userData.keepPhysical=true;m.userData.keepPhysicalStrict=true;return m;}return celFrom(m,{bands:3});};
  g.scene.traverse(o=>{if(o.isMesh){o.material=Array.isArray(o.material)?o.material.map(material):material(o.material);o.castShadow=o.receiveShadow=true;}});return g;
 }).catch(e=>{cache.delete(kind);throw e;}));return cache.get(kind);
}
/** Each instance owns its skeleton/mixer; cached geometry and textures are shared. */
/**
 * `lazy`: nothing is fetched until `load()` is called (the 5 MB Thuan figurine waits until the back room it stands in is
 * near, docs/LOADING.md batch 5); `ready` is then the load's promise. Otherwise it is fetched at once.
 */
export function addOwnedCharacter({parent,kind,position=[0,0,0],yaw=0,height=null,staticDisplay=false,lazy=false}){
 const spec=OWNED_CHARACTERS[kind];if(!spec)throw Error('Unknown owned character '+kind);
 const holder=new THREE.Group();holder.name=kind;holder.position.set(...position);holder.rotation.y=yaw;holder.userData.sharedAsset=true;parent.add(holder);
 let mixer=null,current=null,disposed=false,model=null;const actions=new Map();
 function play(name){if(disposed)return false;const next=actions.get(name);if(!next||next===current)return false;current?.fadeOut(.25);next.reset().fadeIn(.25).play();current=next;holder.userData.animation=name;return true;}
 let ready=null;
 const start=()=>ready??=typeof window==='undefined'||!window.document?Promise.resolve(false):load(kind).then(g=>{
  if(disposed)return false;model=clone(g.scene);model.updateMatrixWorld(true);
  // Exported character meshes are authored with their soles on zero, facing +Z
  // after glTF's coordinate conversion. Props retain their source origin.
  if(!g.animations.length||spec.static||staticDisplay){const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());model.position.set(-centre.x,-bounds.min.y,-centre.z);holder.scale.setScalar((height??spec.height)/size.y);}
  holder.add(model);mixer=new THREE.AnimationMixer(model);for(const clip of (spec.static||staticDisplay?[]:g.animations))actions.set(clip.name,mixer.clipAction(clip));play(spec.clip||'Idle');holder.userData.rigged=actions.size>0;holder.userData.ready=true;return true;
 }).catch(e=>{holder.userData.loadError=true;console.warn('Owned character unavailable: '+kind,e);return false;});
 if(!lazy)start();
 return {holder,get ready(){return ready??Promise.resolve(false);},load:start,play,update(dt){if(!disposed&&holder.visible)mixer?.update(Math.min(.1,Math.max(0,dt)));},dispose(){
  if(disposed)return;disposed=true;mixer?.stopAllAction();
  if(model){mixer?.uncacheRoot(model);const skeletons=new Set();model.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});for(const skeleton of skeletons)skeleton.dispose();}
  // Geometry/materials belong to the cached asset; each cloned skeleton owns its
  // GPU bone texture. Removing the mascot alone leaked one texture per visit.
  holder.removeFromParent();
 }};
}
