import * as THREE from '../../vendor/three.module.js';

/** Fit the rendered pelvis/upper thighs to the seat, including shorts and skirts. */
export function createSeatSupport(avatar){
 const point=new THREE.Vector3(),inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4();
 let signature='',supports=[];
 function refresh(){
  const meshes=avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'));
  const key=meshes.map(o=>o.uuid).join('/');if(key===signature)return;
  signature=key;supports=[];
  const m=avatar.measure;
  for(const mesh of meshes){
   const {position,skinIndex,skinWeight,towelFit}=mesh.geometry.attributes;if(!skinIndex||!skinWeight)continue;
   const indices=[],unique=new Set();
   for(let i=0;i<position.count;i++){
    // A bath wrap is sat on, not sat up on: the body rests on its thighs and the cloth lies on
    // the seat under them (towel-fit.js), so the wrap never lifts anyone off the seat.
    if(towelFit?.getX(i)>.5)continue;
    const y=position.getY(i);
    // The pelvis and the tops of the thighs: on a round body the seat of the thigh reaches a leg's radius above the
    // hip joint, and that is what the floor meets.
    if(y<m.hipY-m.thigh||y>m.hipY+m.legR)continue;
    const bones=[skinIndex.getX(i),skinIndex.getY(i),skinIndex.getZ(i),skinIndex.getW(i)];
    const weights=[skinWeight.getX(i),skinWeight.getY(i),skinWeight.getZ(i),skinWeight.getW(i)];
    if(!bones.every((b,j)=>weights[j]<.001||['hips','thighL','thighR'].includes(mesh.skeleton.bones[b]?.name)))continue;
    const id=[position.getX(i),y,position.getZ(i),...bones,...weights].join('/');
    if(unique.has(id))continue;unique.add(id);indices.push(i);
   }
   if(indices.length)supports.push({mesh,indices});
  }
 }
 return (height)=>{
  refresh();if(!supports.length)return;
  avatar.root.updateWorldMatrix(true,false);avatar.root.updateMatrixWorld(true);
  inverse.copy(avatar.root.matrixWorld).invert();
  let lowest=Infinity;
  for(const {mesh,indices} of supports){
   matrix.multiplyMatrices(inverse,mesh.matrixWorld);
   for(const i of indices){
    mesh.getVertexPosition(i,point);point.applyMatrix4(matrix);
    // Only the part over the seat bears weight; the knees extend past its edge.
    if(Math.abs(point.x)<=avatar.measure.width*.6&&Math.abs(point.z)<=avatar.measure.thigh*.5)lowest=Math.min(lowest,point.y);
   }
  }
  if(!Number.isFinite(lowest))return;
  avatar.root.position.y+=height-avatar.root.position.y-lowest;
 };
}
