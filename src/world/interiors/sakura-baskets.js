import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {BASKET_STACK as S} from './sakura-layout.js';

/** Three nested red baskets matching the existing carried basket. One static draw.
 * Folded handles lie on the rims; nothing floats over the entrance or blocks the door.
 */
export function buildSakuraBaskets(room){
 const pieces=[],colour=new THREE.Color();
 const box=(w,h,d,x,y,z,hex)=>{
  const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);g.deleteAttribute('uv');
  colour.set(hex);const a=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<a.length;i+=3)a.set(colour.toArray(),i);
  g.setAttribute('color',new THREE.BufferAttribute(a,3));pieces.push(g);
 };
 // The low return stand supports the nested stack at floor level.
 box(S.w,.20,S.d,S.x,.10,S.z,0x59635d);
 for(let i=0;i<3;i++){
  const bottom=.20+i*.055,top=bottom+.17,w=S.w-.02,d=S.d-.02;
  box(w,.008,d,S.x,bottom+.004,S.z,0xa81a2e);
  for(let row=0;row<3;row++)for(const side of [-1,1]){
   const y=bottom+.03+row*.05;
   box(.008,.025,d,S.x+side*w/2,y,S.z,0xd7263d);
   box(w,.025,.008,S.x,y,S.z+side*d/2,0xd7263d);
  }
  for(const side of [-1,1]){
   // The rims stand 3 mm proud of the rails and the long rims end inside the short ones, never flush.
   box(.014,.02,d+.01,S.x+side*w/2,top-.01,S.z,0xfff6ea);
   box(w,.02,.012,S.x,top-.01,S.z+side*d/2,0xfff6ea);
   box(.014,.008,d*.6,S.x+side*(w/2-.018),top+.004,S.z,0xa81a2e);
  }
 }
 const mesh=new THREE.Mesh(mergeGeometries(pieces),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6}));
 pieces.forEach(g=>g.dispose());mesh.name='Sakura entrance basket stack';room.add(mesh);return mesh;
}
