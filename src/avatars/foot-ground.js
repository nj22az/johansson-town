import * as THREE from '../../vendor/three.module.js';

/** The points of the shoes (or bare feet) each foot bone carries rigidly, in the bone's own frame, from the meshes drawn now
 *  (worked out again when the outfit changes): a function giving [{bone, samples}]. */
function footSupports(avatar){
 const point=new THREE.Vector3();
 let signature='',supports=[];
 return ()=>{
  const meshes=avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible),key=meshes.map(o=>o.uuid).join('/');
  if(key===signature)return supports;signature=key;supports=[];
  const seen=new Set();
  for(const mesh of meshes){
   const g=mesh.geometry;if(seen.has(g))continue;seen.add(g);
   const {position,skinIndex,skinWeight}=g.attributes;if(!skinIndex||!skinWeight)continue;
   for(const name of ['footL','footR']){
    const bone=avatar.bones[name],index=mesh.skeleton.bones.indexOf(bone),samples=[],unique=new Set();
    for(let i=0;i<position.count;i++){
     // Shoe geometry is rigidly attached to the foot; blended leg vertices
     // do not describe the contact surface.
     if(skinIndex.getX(i)!==index||skinWeight.getX(i)<.999)continue;
     point.fromBufferAttribute(position,i).applyMatrix4(mesh.bindMatrix).applyMatrix4(mesh.skeleton.boneInverses[index]);
     const id=point.toArray().map(v=>v.toFixed(6)).join('/');if(unique.has(id))continue;unique.add(id);samples.push(point.clone());
    }
    if(samples.length)supports.push({bone,samples});
   }
  }
  return supports;
 };
}

/** Keep the actual shoe/foot surface on its support, including changed outfits. */
export function createFootGrounder(avatar){
 const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4(),point=new THREE.Vector3(),supportsNow=footSupports(avatar);
 return (floor=0,{airborne=false}={})=>{
  const supports=supportsNow();if(!supports.length)return;
  avatar.root.updateWorldMatrix(true,false);inverse.copy(avatar.root.matrixWorld).invert();
  let lowest=Infinity;
  for(const {bone,samples} of supports){
   bone.updateWorldMatrix(true,false);matrix.multiplyMatrices(inverse,bone.matrixWorld);
   for(const sample of samples)lowest=Math.min(lowest,point.copy(sample).applyMatrix4(matrix).y);
  }
  const correction=floor-avatar.root.position.y-lowest;
  // Deliberate jumps keep their lift, but landing/preparation never crosses
  // the floor. Other poses retain a planted supporting foot.
  avatar.root.position.y+=airborne?Math.max(0,correction):correction;
 };
}

/**
 * Each foot's lowest point (the sole standing; the back of the heel with the toes up, sat on the floor), in the body's own
 * frame (the root's, as the foot grounder measures: add the root's height for the holder's): {L, R}, each {y, z} (z: how far
 * ahead of the body's middle it is, for the lever a thigh lifts it by).
 */
export function createSoleFinder(avatar){
 const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4(),point=new THREE.Vector3(),supportsNow=footSupports(avatar);
 return ()=>{
  const out={L:{y:Infinity,z:0},R:{y:Infinity,z:0}};
  avatar.root.updateWorldMatrix(true,false);inverse.copy(avatar.root.matrixWorld).invert();
  for(const {bone,samples} of supportsNow()){
   bone.updateWorldMatrix(true,false);matrix.multiplyMatrices(inverse,bone.matrixWorld);const o=out[bone.name==='footL'?'L':'R'];
   for(const sample of samples){point.copy(sample).applyMatrix4(matrix);if(point.y<o.y){o.y=point.y;o.z=point.z;}}
  }
  return out;
 };
}

/**
 * Someone lying on the ground rests on whatever on them is lowest -- a cheek, the chest, a hip -- never
 * through it and never hovering over it: the body's skin (each point carried by its bones, as it is drawn)
 * and the face are found in their place this frame and the body is raised or lowered by what the lowest
 * point is off the floor. The swinging parts (a braid, a hem) are left out: they hang from the body and
 * follow it. Returns how far the root must move up (metres), for whoever blends it in.
 */
export function createLieGrounder(avatar){
 const swinging=new Set(['hairA','hairB','braidL1','braidL2','braidR1','braidR2','skirtF','skirtB','skirtL','skirtR']);
 const inverse=new THREE.Matrix4(),matrix=new THREE.Matrix4(),point=new THREE.Vector3(),sum=new THREE.Vector3();
 let signature='',bones=[],samples=[];
 function refresh(){
  const meshes=avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible),key=meshes.map(o=>o.uuid).join('/');
  if(key===signature)return;signature=key;bones=[];samples=[];
  const slot=new Map(),seen=new Set(),unique=new Set();
  const slotOf=bone=>{if(!slot.has(bone)){slot.set(bone,bones.length);bones.push(bone);}return slot.get(bone);};
  for(const mesh of meshes){
   const g=mesh.geometry;if(seen.has(g))continue;seen.add(g);
   const {position,skinIndex,skinWeight}=g.attributes;if(!skinIndex||!skinWeight)continue;
   for(let i=0;i<position.count;i++){
    const id=[position.getX(i),position.getY(i),position.getZ(i)].map(v=>v.toFixed(4)).join('/');if(unique.has(id))continue;unique.add(id);
    const parts=[];let swing=0;
    for(let k=0;k<4;k++){
     const w=skinWeight.getComponent(i,k);if(w<1e-3)continue;
     const index=skinIndex.getComponent(i,k),bone=mesh.skeleton.bones[index];
     if(swinging.has(bone.name)){swing+=w;continue;}
     parts.push([slotOf(bone),w,point.fromBufferAttribute(position,i).applyMatrix4(mesh.bindMatrix).applyMatrix4(mesh.skeleton.boneInverses[index]).clone()]);
    }
    if(swing<.5&&parts.length)samples.push(parts);
   }
  }
  // The face is its own mesh on the head bone: its sphere, in the head bone's frame.
  const head=avatar.face?.head;
  if(head){const p=head.geometry.attributes.position,b=slotOf(avatar.bones.head);head.updateMatrix();for(let i=0;i<p.count;i++)samples.push([[b,1,point.fromBufferAttribute(p,i).applyMatrix4(head.matrix).clone()]]);}
 }
 const placed=[];
 return (floor=0)=>{
  refresh();if(!samples.length)return 0;
  const parent=avatar.root.parent;avatar.root.updateWorldMatrix(true,true);
  if(parent)inverse.copy(parent.matrixWorld).invert();else inverse.identity();
  bones.forEach((bone,i)=>{(placed[i]??=new THREE.Matrix4()).multiplyMatrices(inverse,bone.matrixWorld);});
  let lowest=Infinity;
  for(const parts of samples){
   sum.set(0,0,0);let total=0;
   for(const [b,w,p] of parts){sum.addScaledVector(point.copy(p).applyMatrix4(placed[b]),w);total+=w;}
   lowest=Math.min(lowest,sum.y/total);
  }
  return floor-lowest;
 };
}
