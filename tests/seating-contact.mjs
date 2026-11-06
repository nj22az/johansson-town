import * as THREE from '../vendor/three.module.js';

/** Lowest rendered pelvis/thigh inside a small horizontal seat beneath the hips. */
export function seatContactHeight(avatar){
 avatar.root.updateWorldMatrix(true,false);avatar.root.updateMatrixWorld(true);
 const p=new THREE.Vector3(),local=new THREE.Vector3();let height=Infinity;
 for(const mesh of avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const {position,skinIndex,towelFit}=mesh.geometry.attributes;
  for(let i=0;i<position.count;i++){
   // Shader-fitted skirt/wrap cloth lies under the body; its unadjusted CPU
   // vertices do not determine the actual pelvis/thigh support surface.
   if(towelFit?.getX(i)>.5)continue;
   if(!['hips','thighL','thighR'].includes(mesh.skeleton.bones[skinIndex.getX(i)]?.name))continue;
   mesh.getVertexPosition(i,p);mesh.localToWorld(p);local.copy(p);avatar.root.worldToLocal(local);
   if(Math.abs(local.x)<=avatar.measure.width*.6&&Math.abs(local.z)<=avatar.measure.thigh*.5)height=Math.min(height,p.y);
  }
 }
 return height;
}

export function shoeHeight(avatar){
 avatar.root.updateWorldMatrix(true,false);avatar.root.updateMatrixWorld(true);const p=new THREE.Vector3();let height=Infinity;
 for(const mesh of avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const {position,skinIndex,skinWeight}=mesh.geometry.attributes;
  for(let i=0;i<position.count;i++){
   if(skinWeight.getX(i)<.999||!['footL','footR'].includes(mesh.skeleton.bones[skinIndex.getX(i)]?.name))continue;
   mesh.getVertexPosition(i,p);mesh.localToWorld(p);height=Math.min(height,p.y);
  }
 }
 return height;
}
