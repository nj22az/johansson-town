import * as THREE from '../../vendor/three.module.js';

// Select nearby instances without drawing a town-wide batch in every section.
export function createSectionInstances(mesh){
 if(!mesh.isInstancedMesh||mesh.count<2||mesh.morphTexture)return null;
 if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
 const transform=new THREE.Matrix4(),world=new THREE.Matrix4(),items=[];
 for(let i=0;i<mesh.count;i++){
  mesh.getMatrixAt(i,transform);world.multiplyMatrices(mesh.matrixWorld,transform);
  items.push({index:i,bounds:mesh.geometry.boundingBox.clone().applyMatrix4(world)});
 }
 const matrix=new THREE.InstancedBufferAttribute(new Float32Array(mesh.count*16),16).setUsage(THREE.DynamicDrawUsage);
 let color=null,colorSource=null,colorVersion=-1;
 let signature=null,count=0;
 return {select(intersects){
  const selected=items.filter(item=>intersects(item.bounds)),key=selected.map(item=>item.index).join(',');
  const selectionChanged=signature!==key;
  if(selectionChanged){
   signature=key;count=selected.length;
   selected.forEach(({index},i)=>{
    matrix.array.set(mesh.instanceMatrix.array.subarray(index*16,index*16+16),i*16);
   });
   matrix.needsUpdate=true;
  }
  // Streamed textures can remove, replace or recolour an instance palette without
  // moving the camera. Carry the current palette rather than a stale packed copy.
  const source=mesh.instanceColor;
  if(source&&(selectionChanged||source!==colorSource||source.version!==colorVersion)){
   if(!color||color.array.length!==mesh.count*3)color=new THREE.InstancedBufferAttribute(new Float32Array(mesh.count*3),3).setUsage(THREE.DynamicDrawUsage);
   selected.forEach(({index},i)=>color.array.set(source.array.subarray(index*3,index*3+3),i*3));
   color.needsUpdate=true;
  }
  colorSource=source;colorVersion=source?.version??-1;
  return {matrix,color:source?color:null,count};
 }};
}
