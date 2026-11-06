import * as THREE from '../../../vendor/three.module.js';
import {GLTFLoader} from '../../../vendor/GLTFLoader.js';
import {assetURL} from '../../assets.js';
import {registerDetail} from '../detail-stream.js';
import {HIGA_FRAME,KISSA_MODELS,KISSA_CHAIRS,higaPoint} from './higa-liquor-dressing.js';

/**
 * Kissa Higa's three Meshy models: the record player, the two bentwood chairs and the hand grinder, the props that won the
 * audit of 30 October 2026 against the same things drawn in code (art/kissaten/meshy/provenance.json, photographs in
 * docs/qa/kissaten-meshy/). Their colour maps are shrunk to 512 px for World (tools/shrink-glb-textures.py), in
 * assets/models/kissaten/; 1,500 to 3,100 triangles each.
 *
 * Streamed in near the shop like the other model buildings (detail-stream.js). Their solids are the fittings'
 * (higa-liquor-dressing.js higaInterior), so nobody walks through a chair before it has loaded; if a model cannot load,
 * a plain one drawn in code stands in its place, so a solid is never empty.
 */
const cache=new Map();let loading=null;
/** Loads the three models once; true when they are in, false when they could not be (the stand-ins are used then). */
export async function loadKissaModels(){
 if(cache.size===Object.keys(KISSA_MODELS).length)return true;
 loading??=(async()=>{
  const loader=new GLTFLoader();
  for(const [id,spec] of Object.entries(KISSA_MODELS)){
   const response=await fetch(assetURL('models/kissaten/'+spec.file));
   if(!response.ok)throw Error(spec.file+': '+response.status);
   cache.set(id,fit((await loader.parseAsync(await response.arrayBuffer(),'')).scene,spec.size));
  }
  return true;
 })().catch(e=>{console.warn('Kissa Higa models unavailable',e);loading=null;return false;});
 return loading;
}
/** A model scaled to its real size (`h` its height, `w` its widest plan side), stood on its base and centred in plan. */
function fit(scene,{h,w}){
 scene.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(scene),size=box.getSize(new THREE.Vector3()),s=h?h/size.y:w/Math.max(size.x,size.z);
 scene.scale.multiplyScalar(s);scene.updateMatrixWorld(true);
 const b=new THREE.Box3().setFromObject(scene),c=b.getCenter(new THREE.Vector3());scene.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));
 const holder=new THREE.Group();holder.add(scene);return holder;
}

const std=(hex,o={})=>new THREE.MeshStandardMaterial({color:hex,roughness:.8,...o});
const part=(geometry,material,x,y,z,parent,{rx=0,rz=0}={})=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.rotation.set(rx,0,rz);parent.add(m);return m;};
/** The stand-ins, drawn as the audit's code versions were (tools/kissaten-meshy-look.mjs), used only if a model fails. */
const STAND_INS={
 'record-player':()=>{const g=new THREE.Group(),teak=std(0xc98a46),cream=std(0xeadfc4);
  part(new THREE.BoxGeometry(.42,.11,.32),teak,0,.055,0,g);part(new THREE.BoxGeometry(.39,.006,.29),cream,0,.113,0,g);
  part(new THREE.CylinderGeometry(.122,.122,.006,24),std(0x111111),-.05,.12,0,g);part(new THREE.CylinderGeometry(.04,.04,.007,16),std(0xb8302a),-.05,.121,0,g);
  const lid=new THREE.Group();lid.position.set(0,.11,-.16);lid.rotation.x=-1.75;g.add(lid);part(new THREE.BoxGeometry(.42,.32,.02),teak,0,.16,-.01,lid);return g;},
 'bentwood-chair':()=>{const g=new THREE.Group(),wood=std(0x5a3a24);
  part(new THREE.CylinderGeometry(.2,.2,.035,20),std(0xe0c36a),0,.42,0,g);
  for(const [x,z] of [[.15,.15],[-.15,.15],[.13,-.17],[-.13,-.17]])part(new THREE.CylinderGeometry(.014,.017,.42,8),wood,x,.21,z,g);
  for(const x of [.12,-.12])part(new THREE.CylinderGeometry(.014,.014,.44,8),wood,x,.64,-.19,g);part(new THREE.TorusGeometry(.12,.012,6,20),wood,0,.72,-.2,g);return g;},
 'hand-grinder':()=>{const g=new THREE.Group();part(new THREE.BoxGeometry(.11,.1,.11),std(0x5a3422),0,.05,0,g);
  part(new THREE.CylinderGeometry(.05,.04,.04,14),std(0xc9a24a,{metalness:.5}),0,.12,0,g);part(new THREE.SphereGeometry(.014,8,6),std(0xd8b080),.09,.17,0,g);return g;},
};

/**
 * Places the models in the shop's frontage group (the shop-house frame), on the finished floor: the record player on its
 * cabinet, the grinder on the worktop, the two chairs at the table facing it. Called once the models have loaded or failed.
 */
function place(holder,{models,shadows}){
 const put=(id,at,ry)=>{
  const m=models&&cache.get(id)?cache.get(id).clone(true):STAND_INS[id]();
  m.name='Kissa Higa '+id+(models?'':' (stand-in)');m.userData.sharedAsset=!!models;m.position.set(...at);m.rotation.y=ry;
  m.traverse(o=>{if(o.isMesh){o.castShadow=shadows;o.receiveShadow=true;}});holder.add(m);return m;};
 put('record-player',KISSA_MODELS['record-player'].at,KISSA_MODELS['record-player'].ry);
 put('hand-grinder',KISSA_MODELS['hand-grinder'].at,KISSA_MODELS['hand-grinder'].ry);
 for(const c of KISSA_CHAIRS)put('bentwood-chair',c.at,c.ry);
}

/** Registers the models' streaming near the shop; returns the holder group they are placed in. */
export function buildKissaProps({world,frontage,shadows=false}){
 const holder=new THREE.Group();holder.name='Kissa Higa models';holder.position.y=HIGA_FRAME.floor;frontage.group.add(holder);
 let placed=false;
 const [x,z]=higaPoint(0,1);
 registerDetail(world,{id:'kissa-higa-models',priority:2,x,z,radius:40,load:async()=>{
  if(placed)return true;const models=await loadKissaModels();if(placed)return true;
  place(holder,{models,shadows});placed=true;return true;}});
 return holder;
}
/** For tools and tests: place the models (or their stand-ins) now, without the stream. */
export async function placeKissaPropsNow(holder,{shadows=false,models=true}={}){
 const ok=models?await loadKissaModels():false;place(holder,{models:ok,shadows});return ok;
}
