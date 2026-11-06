import * as THREE from '../../vendor/three.module.js';
import {applyWorldUV} from './world-uv.js';

// Only the harbour shape() builder feeds this function. Moving meshes, characters,
// interaction anchors and room geometry never enter these batches.
export function createHarbourInstances(sources,{shadows=true,cellSize=48,consolidate=true}={}){
  if(!(cellSize>0))throw new Error('Harbour cell size must be positive');
  const groups=new Map(),signatures=new WeakMap(),position=new THREE.Vector3();
  for(const source of sources){
    const {geo,mat,matrices,mutable=false}=source;
    if(!signatures.has(mat)){
      // Match the complete serialized material state and texture identities;
      // only base colour moves into instanceColor. Never whiten a shared material.
      const state=mat.toJSON();delete state.uuid;delete state.color;delete state.metadata;
      signatures.set(mat,JSON.stringify(state));
    }
    for(const matrix of matrices){
      position.setFromMatrixPosition(matrix);
      const coloured=consolidate&&!mutable;
      const cell=coloured?[Math.floor(position.x/cellSize),Math.floor(position.z/cellSize)]:[];
      const key=JSON.stringify([geo.uuid,coloured?signatures.get(mat):mat.uuid,...cell]);
      if(!groups.has(key))groups.set(key,{geo,mat,coloured,items:[]});
      groups.get(key).items.push({matrix,colour:mat.color});
    }
  }
  return [...groups.values()].map(({geo,mat,coloured,items},index)=>{
    const material=coloured?mat.clone():mat;
    if(material.userData.worldTextureScale)applyWorldUV(material,material.userData.worldTextureScale);
    if(coloured)material.color.set(0xffffff);
    const mesh=new THREE.InstancedMesh(geo,material,items.length);
    mesh.name='harbour-instances:'+index;
    items.forEach(({matrix,colour},i)=>{mesh.setMatrixAt(i,matrix);if(coloured)mesh.setColorAt(i,colour);});
    mesh.instanceMatrix.needsUpdate=true;
    if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    mesh.castShadow=shadows;mesh.receiveShadow=shadows;
    mesh.computeBoundingBox();mesh.computeBoundingSphere();
    return mesh;
  });
}
