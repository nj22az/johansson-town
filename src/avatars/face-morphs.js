import * as THREE from '../../vendor/three.module.js';
import {faceLayout} from './face.js';

/** Small, localized relative morphs preserve the painted face's proportions.
 * The game keeps its expression canvas; the export also carries these editable
 * cheek, eyelid and jaw shapes and the matching painted expression textures. */
export const FACE_MORPHS=Object.freeze(['smile','shy','surprised','blink']);
export function addFaceMorphs(mesh,recipe,m){
 const g=mesh.geometry,P=g.attributes.position,U=g.attributes.uv,L=faceLayout(recipe);
 const gaussian=(x,y,cx,cy,rx,ry)=>Math.exp(-(((x-cx)/rx)**2+((y-cy)/ry)**2));
 g.morphTargetsRelative=true;
 g.morphAttributes.position=FACE_MORPHS.map(name=>{
  const values=new Float32Array(P.count*3);
  for(let i=0;i<P.count;i++){
   if(P.getZ(i)<=0||U.getX(i)<.01||U.getY(i)<.01)continue;
   const x=U.getX(i)*256,y=(1-U.getY(i))*256;
   const cheeks=gaussian(x,y,128-L.spread,L.noseY+7,21,18)+gaussian(x,y,128+L.spread,L.noseY+7,21,18);
   const mouth=gaussian(x,y,L.mouthX,L.mouthY,25,20);
   if(name==='smile'||name==='shy'){
    values[i*3+1]=cheeks*m.Rh*(name==='smile'?.018:.01);
    values[i*3+2]=cheeks*m.Rh*(name==='smile'?.012:.018);
   }else if(name==='surprised'){
    values[i*3+1]=-mouth*m.Rh*.035;values[i*3+2]=mouth*m.Rh*.012;
   }else {
    const eyelids=gaussian(x,y,128-L.spread,L.eyeY,16,20)+gaussian(x,y,128+L.spread,L.eyeY,16,20);
    values[i*3+1]=(y-L.eyeY)*m.Rh*.004*eyelids;
   }
  }
  const target=new THREE.Float32BufferAttribute(values,3);target.name=name;return target;
 });
 mesh.updateMorphTargets();return mesh;
}
