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
 // How far past the seat's edge a point is, as height it must be lower by to bear weight there, while the thighs move over it
 // (`soft`, 0..1: 1 a rounded edge about 45 degrees (`edge`), eased in over its first `round` metres; toward 0 steeper, and at
 // 0 the hard edge, which a body sat still sits on). A hard edge let the lowest point drop out of the seat in a frame as a
 // thigh swung forward over it, and the body stepped 10-14 mm in a frame as it sat down (the principles audit, 27 November
 // 2026: SitDown on Vy and Sverker). Points over the seat are never affected.
 const SEAT_EDGE=Object.freeze({edge:1,round:.01});
 const past=(d,k)=>d<=0?0:d<SEAT_EDGE.round?k*d*d/(2*SEAT_EDGE.round):k*(d-SEAT_EDGE.round/2);
 return (height,soft=0)=>{
  refresh();if(!supports.length)return;
  avatar.root.updateWorldMatrix(true,false);avatar.root.updateMatrixWorld(true);
  inverse.copy(avatar.root.matrixWorld).invert();
  let lowest=Infinity;const X=avatar.measure.width*.6,Z=avatar.measure.thigh*.5,far=soft>0?.1:0,k=soft>0?SEAT_EDGE.edge/soft:0;
  for(const {mesh,indices} of supports){
   matrix.multiplyMatrices(inverse,mesh.matrixWorld);
   for(const i of indices){
    mesh.getVertexPosition(i,point);point.applyMatrix4(matrix);
    // Only the part over the seat bears weight; the knees extend past its edge.
    const dx=Math.abs(point.x)-X,dz=Math.abs(point.z)-Z;if(dx>far||dz>far)continue;
    lowest=Math.min(lowest,point.y+past(dx,k)+past(dz,k));
   }
  }
  if(!Number.isFinite(lowest))return;
  avatar.root.position.y+=height-avatar.root.position.y-lowest;
 };
}
