import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';

/** Accepted CAD-derived trees, enabled for ordinary play by the owner on 25 October 2026. */
export const TREE_REBUILD=true;
// Keep the baked geometry in its own cached chunk, loaded with the World.
const {TREE_DESIGN_DATA}=await import('./tree-design-data.js');
export const TREE_FAMILIES=Object.freeze(['broadleaf','fukugi','banyan','pine','palm','pandanus','banana']);
const templates=new Map(),partsCache=new Map(),meshCache=new Map();
function template(family,lod){
 const key=family+'/'+lod;if(templates.has(key))return templates.get(key);
 const model=TREE_DESIGN_DATA.models[family];if(!model)throw Error('Unknown tree family: '+family);
 const level=model.levels[lod];if(!level)throw Error('Unknown tree LOD: '+lod);
 const decoded=Uint8Array.from(atob(level.data),c=>c.charCodeAt(0)).buffer;
 const parts=level.parts.map(p=>{
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(decoded,p.position,p.vertices*3).slice(),3));
  geometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(decoded,p.normal,p.vertices*3).slice(),3));
  geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(decoded,p.index,p.indices).slice(),1));
  return {geometry,color:p.color,kind:p.kind};
 });templates.set(key,parts);return parts;
}

/** Cached parts for the existing district material buckets, or one instanced draw below. */
export function treeDesignParts(family,{lod='near',height,width,depth,bow,variant=0,rootLimit}={}){
 const spec=TREE_DESIGN_DATA.models[family];if(!spec)throw Error('Unknown tree family: '+family);
 height??=spec.height;width??=spec.width*height/spec.height;depth??=spec.depth*height/spec.height;
 if(![height,width,depth].every(v=>Number.isFinite(v)&&v>0))throw Error('Tree dimensions must be positive');
 const key=[family,lod,height,width,depth,bow??'',variant,rootLimit??''].join('/');if(partsCache.has(key))return partsCache.get(key);
 const scale=new THREE.Matrix4().makeScale(width/spec.width,height/spec.height,depth/spec.depth);
 const parts=template(family,lod).map(p=>{
  const geometry=p.geometry.clone().applyMatrix4(scale),positions=geometry.attributes.position;
  if(family==='palm'&&Number.isFinite(bow)){
   // CAD crown leans about 0.8 m. Transform every LOD with the same continuous bend.
   for(let i=0;i<positions.count;i++){const t=Math.max(0,Math.min(1,positions.getY(i)/height));positions.setX(i,positions.getX(i)+(bow-.8*height/spec.height)*t*t);}
   geometry.computeVertexNormals();
  }
  if(family==='banyan'&&p.kind==='bark'&&Number.isFinite(rootLimit)){
   // Only the low, slender aerial-root groups are limited, never the spreading limbs.
   // Grouped bark also contains the trunk, so affect vertices below the branch junction.
   for(let i=0;i<positions.count;i++)if(positions.getY(i)<height*.44){const x=positions.getX(i),z=positions.getZ(i),r=Math.hypot(x,z);if(r>rootLimit){positions.setX(i,x*rootLimit/r);positions.setZ(i,z*rootLimit/r);}}
   geometry.computeVertexNormals();
  }
  if(variant)geometry.rotateY(variant*2.39996);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return {geometry,color:p.color,kind:p.kind};
 });partsCache.set(key,parts);return parts;
}
export function treeDesignGeometry(family,options={}){
 const key=family+'/'+JSON.stringify(options);if(meshCache.has(key))return meshCache.get(key);
 const parts=treeDesignParts(family,options).map(p=>{
  const g=p.geometry.clone(),c=new THREE.Color(p.color),a=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<a.length;i+=3)c.toArray(a,i);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;
 });
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
 geometry.userData.treeDesign={family,lod:options.lod||'near',options:{...options},revision:TREE_DESIGN_DATA.revision};meshCache.set(key,geometry);return geometry;
}

/** Visible bark footprint. Foliage is deliberately excluded from pedestrian collision. */
export function treeBarkEnvelope(family,options={},maxY=1.8){
 const bounds=new THREE.Box3();let used=false;
 for(const part of treeDesignParts(family,options))if(part.kind==='bark'){
  const p=part.geometry.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)<=maxY&&p.getY(i)>=-.01){bounds.expandByPoint(new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)));used=true;}
 }
 return used?{minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z}:null;
}
export const PALM_VARIANTS=Object.freeze([{height:8.5,bow:1.8},{height:10,bow:3},{height:7,bow:1}]);
export const FOREST_VARIANTS=Object.freeze([{height:8,width:6.8,depth:6.12},{height:10,width:8,depth:7.2},{height:7,width:6,depth:5.4}]);
