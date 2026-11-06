// A Pixar body in Node: its GLB parsed with World's own GLTFLoader (the textures stand-ins: Node decodes no JPEG), handed to
// pixar.js as a page's boot does, and the avatar built and skinned by World itself, so a test can pose him with the
// game's animator and read where his skin and his clothes go.
import {readFileSync} from 'node:fs';
import * as THREE from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {buildAvatar} from '../src/avatars/build.js';
import {createAvatarAnimator} from '../src/avatars/animate.js';
import {recipeFor} from '../src/avatars/cast.js';
import {PIXAR_BODIES,preparePixarBody,providePixarBody} from '../src/avatars/pixar.js';

/** The Pixar body `name` loaded from assets/ (or the given files) and provided to pixar.js. Call installDOM() first. */
export async function providePixarBodyInNode(name,{glb,json}={}){
 const root=new URL('../assets/'+PIXAR_BODIES[name].path,import.meta.url);
 const bytes=readFileSync(glb||root.pathname+'.glb'),card=JSON.parse(readFileSync(json||root.pathname+'.json','utf8'));
 const loader=new GLTFLoader();
 loader.register(()=>({name:'node-texture-stand-in',loadTexture(){return Promise.resolve(new THREE.Texture());}}));
 const gltf=await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const body=preparePixarBody(card,gltf.scene);providePixarBody(body);return body;
}

/** The avatar built on the Pixar body, with its animator, every bone at rest. */
export function pixarAvatar(name){
 const a=buildAvatar(recipeFor(name),{shadows:false}),anim=createAvatarAnimator(a);
 for(const b of Object.values(a.bones))b.rotation.set(0,0,0);a.root.updateMatrixWorld(true);
 return {a,anim,parts:Object.fromEntries(a.pixar.meshes.filter(m=>m.isSkinnedMesh&&m.userData.pixarPart).map(m=>[m.userData.pixarPart,m]))};
}

/** Where a skinned part's vertices are now (world metres), as World draws them. */
export function skinnedPositions(a,mesh){
 a.root.updateMatrixWorld(true);mesh.skeleton.update();
 const n=mesh.geometry.attributes.position.count,out=new Float32Array(n*3),v=new THREE.Vector3();
 for(let i=0;i<n;i++){mesh.getVertexPosition(i,v);out[i*3]=v.x;out[i*3+1]=v.y;out[i*3+2]=v.z;}
 return out;
}

/** The avatar put `secs` into a gesture (animate.js), standing idle ('idle': the animator's own stance, half a second in),
 *  or at rest with every bone straight when `move` is null. */
export function pose(av,move,secs=.9){
 for(const b of Object.values(av.a.bones))b.rotation.set(0,0,0);av.a.root.position.set(0,0,0);
 if(move==='idle'){for(let k=0;k<30;k++)av.anim.update(1/60,{});}
 else if(move){av.anim.play(move);for(let k=0;k<Math.round(secs*60);k++)av.anim.update(1/60,{});}
 av.a.root.position.set(0,0,0);av.a.root.updateMatrixWorld(true);
}

const _T=new THREE.Triangle(),_q=new THREE.Vector3(),_v=new THREE.Vector3();
function triangles(P,index,centre,within){
 const out=[];
 for(let t=0;t<index.length/3;t++){const i=index[t*3],j=index[t*3+1],k=index[t*3+2];
  const A=new THREE.Vector3(P[i*3],P[i*3+1],P[i*3+2]),B=new THREE.Vector3(P[j*3],P[j*3+1],P[j*3+2]),C=new THREE.Vector3(P[k*3],P[k*3+1],P[k*3+2]);
  const c=A.clone().add(B).add(C).multiplyScalar(1/3);if(c.distanceTo(centre)<within)out.push({A,B,C,n:B.clone().sub(A).cross(C.clone().sub(A)).normalize(),c});}
 return out;
}
const _c=new THREE.Vector3();
function signedDistance(P,i,tris){
 _v.set(P[i*3],P[i*3+1],P[i*3+2]);let best=1e9,sd=null;
 for(const t of tris){if(t.c.distanceToSquared(_v)>.0036)continue;_T.set(t.A,t.B,t.C);_T.closestPointToPoint(_v,_q);const d=_q.distanceTo(_v);if(d<best){best=d;sd=Math.sign(_v.clone().sub(_q).dot(t.n))*d;_c.copy(_q);}}
 return sd;
}

/**
 * How the skin under a garment fares in a pose, near a bone: of the body's vertices the garment covers at rest (inside it
 * by 2 to 25 mm, within `within` metres of the bone and not above it), how many stand outside the cloth by more than `tolerance`
 * in the pose, and the furthest (metres). Also the garment's own worst edge stretch there (posed length over rest) and
 * how far its side panel on the trunk was carried by the arm (`sideLift`, metres).
 */
export function garmentHold(av,{garment='shirt',bone='shoulderR',move='Wave',secs=.9,within=.22,tolerance=.004}={}){
 const cloth=av.parts[garment],skin=av.parts.body;
 pose(av,null);
 // (getVertexPosition is in the mesh's own frame, the avatar's root turned about: the bone is taken into that frame too)
 const S=cloth.worldToLocal(av.a.bones[bone].getWorldPosition(new THREE.Vector3()));
 const clothRest=skinnedPositions(av.a,cloth),skinRest=skinnedPositions(av.a,skin),index=cloth.geometry.index.array;
 const trisRest=triangles(clothRest,index,S,within+.1);
 // (covered: inside the cloth, close under it (within 25 mm) and with the cloth in front of the skin's own face: the
 // hanging arm's inner skin lies inside the shirt's billowing side at rest with the cloth behind it, not over it, and
 // leaves it in every move)
 const covered=[],N=skin.geometry.attributes.normal,_n=new THREE.Vector3();
 // (and within a sleeve's reach of the shoulder, 17 cm, or on the trunk: the bare arm above the elbow lies beside the
 // shirt's side at rest and swings clear of it, which is no fault)
 for(let i=0;i<skinRest.length/3;i++){_v.set(skinRest[i*3],skinRest[i*3+1],skinRest[i*3+2]);if(_v.distanceTo(S)>within||_v.y>S.y+.02)continue;
  if(_v.distanceTo(S)>.17&&Math.abs(_v.x)>Math.abs(S.x)-.03)continue;
  const sd=signedDistance(skinRest,i,trisRest);
  if(sd===null||sd>=-.002||sd<=-.025)continue;_n.set(N.getX(i),N.getY(i),N.getZ(i));if(_c.clone().sub(_v).dot(_n)>0)covered.push(i);}
 pose(av,move,secs);
 const clothNow=skinnedPositions(av.a,cloth),skinNow=skinnedPositions(av.a,skin),trisNow=triangles(clothNow,index,S,within+.15);
 let outside=0,worst=0;
 for(const i of covered){const sd=signedDistance(skinNow,i,trisNow);if(sd!==null&&sd>tolerance){outside++;worst=Math.max(worst,sd);}}
 // the garment's side panel carried by the arm: of the cloth on the trunk's side at rest (inside the shoulder's x by
 // 2 cm, from 10 to 30 cm under the shoulder, and 9 cm before or behind the arm's line, past the hanging sleeve's own
 // ring), how far the furthest vertex moved in the pose (the old weights lifted the whole side
 // into a blade under a raised arm)
 let sideLift=0;
 for(let i=0;i<clothRest.length/3;i++){const x=clothRest[i*3],y=clothRest[i*3+1],z=clothRest[i*3+2];
  if(Math.abs(x)>Math.abs(S.x)-.02||Math.sign(x)!==Math.sign(S.x)||y>S.y-.1||y<S.y-.3||Math.abs(z-S.z)<.09||Math.hypot(x-S.x,y-S.y,z-S.z)>within+.1)continue;
  sideLift=Math.max(sideLift,Math.hypot(clothNow[i*3]-x,clothNow[i*3+1]-y,clothNow[i*3+2]-z));}
 let stretch=1;
 for(let t=0;t<index.length/3;t++){const i=index[t*3],j=index[t*3+1],k=index[t*3+2];
  const c=(clothNow[i*3]+clothNow[j*3]+clothNow[k*3])/3,cy=(clothNow[i*3+1]+clothNow[j*3+1]+clothNow[k*3+1])/3,cz=(clothNow[i*3+2]+clothNow[j*3+2]+clothNow[k*3+2])/3;
  if(Math.hypot(c-S.x,cy-S.y,cz-S.z)>within+.1)continue;
  for(const [u,w] of [[i,j],[j,k],[k,i]]){const r=Math.hypot(clothRest[u*3]-clothRest[w*3],clothRest[u*3+1]-clothRest[w*3+1],clothRest[u*3+2]-clothRest[w*3+2]);if(r<.004)continue;
   const p=Math.hypot(clothNow[u*3]-clothNow[w*3],clothNow[u*3+1]-clothNow[w*3+1],clothNow[u*3+2]-clothNow[w*3+2]);stretch=Math.max(stretch,p/r);}}
 pose(av,null);
 return {covered:covered.length,outside,worst,stretch,sideLift};
}
