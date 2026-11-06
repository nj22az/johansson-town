import * as THREE from '../../vendor/three.module.js';
import {GLTFExporter} from '../../tools/vendor/GLTFExporter.js';
import {buildAvatar,BONES} from './build.js';
import {addFaceMorphs} from './face-morphs.js';
import {drawFace} from './face.js';
import {motionClip} from './motion.js';

/** Standard neutral T-pose GLB, with two independently skinned braid meshes,
 * four facial morph targets, recipe metadata and the game's painted expressions.
 * Cel outlines and cloth clearance shaders stay in the game renderer. */
export async function exportAvatarGLB(recipe,{motion=null}={}){
 const clip=motion?motionClip(motion):null;
 const a=buildAvatar(recipe,{shadows:false,faceSize:256,eyes3d:false}),extra=[];
 try{
  a.root.rotation.set(0,0,0);a.setOpenHands(true);a.paintFace({expression:'neutral',blink:0,talk:0});
  for(const side of ['L','R']){
   const id=BONES.indexOf('braid'+side+'1'),id2=BONES.indexOf('braid'+side+'2');
   const g=a.body.geometry,I=g.attributes.skinIndex,W=g.attributes.skinWeight,indices=[];
   for(let i=0;i<I.count;i+=3){let braid=false;
    for(let j=i;j<i+3;j++)for(let k=0;k<4;k++)if((I.array[j*4+k]===id||I.array[j*4+k]===id2)&&W.array[j*4+k]>.001)braid=true;
    if(braid)indices.push(i,i+1,i+2);
   }
   if(!indices.length)continue;
   const geometry=new THREE.BufferGeometry();
   for(const [key,attr] of Object.entries(g.attributes)){
    if(!['position','normal','uv','color','skinIndex','skinWeight'].includes(key))continue;
    const array=new attr.array.constructor(indices.length*attr.itemSize);
    indices.forEach((index,j)=>array.set(attr.array.subarray(index*attr.itemSize,(index+1)*attr.itemSize),j*attr.itemSize));
    geometry.setAttribute(key,new THREE.BufferAttribute(array,attr.itemSize,attr.normalized));
   }
   const mesh=new THREE.SkinnedMesh(geometry,a.body.material);mesh.name='Braid '+side;mesh.bind(a.body.skeleton,a.body.bindMatrix);a.root.add(mesh);extra.push(geometry);
  }
  // Remove the braid triangles from the torso's exported draw range.
  const g=a.body.geometry,I=g.attributes.skinIndex,W=g.attributes.skinWeight,keep=[];
  const braidIds=new Set(['L','R'].flatMap(s=>[BONES.indexOf('braid'+s+'1'),BONES.indexOf('braid'+s+'2')]));
  for(let i=0;i<I.count;i+=3){let braid=false;for(let j=i;j<i+3;j++)for(let k=0;k<4;k++)if(braidIds.has(I.array[j*4+k])&&W.array[j*4+k]>.001)braid=true;if(!braid)keep.push(i,i+1,i+2);}
  g.setIndex(keep);
  const outlines=[];a.root.traverse(o=>{if(o.userData.outline)outlines.push(o);});outlines.forEach(o=>o.removeFromParent());
  addFaceMorphs(a.face.head,a.recipe,a.measure);
  const expressions={};
  for(const expression of ['neutral','smile','happy','shy','thinking','excited','surprised']){
   drawFace(a.face.ctx,a.recipe,{expression,size:256,objects:true});expressions[expression]=a.face.canvas.toDataURL('image/png');
  }
  drawFace(a.face.ctx,a.recipe,{expression:'neutral',blink:1,size:256,objects:true});expressions.blink=a.face.canvas.toDataURL('image/png');
  drawFace(a.face.ctx,a.recipe,{expression:'neutral',size:256,objects:true});a.face.texture.needsUpdate=true;
  a.root.userData={recipe:a.recipe,pose:'T-pose',faceExpressions:expressions,faceExpressionFormat:'PNG data URI; apply to head base-color texture',faceMorphs:['smile','shy','surprised','blink']};
  if(clip){a.root.userData.pose='animated';a.root.userData.motion={name:clip.name,inPlace:true};}
  else{a.bones.shoulderL.rotation.z=Math.PI/2;a.bones.shoulderR.rotation.z=-Math.PI/2;}
  a.root.updateMatrixWorld(true);a.body.skeleton.update();
  return await new GLTFExporter().parseAsync(a.root,{binary:true,onlyVisible:true,trs:true,animations:clip?[clip]:[]});
 }finally{extra.forEach(g=>g.dispose());a.dispose();}
}

