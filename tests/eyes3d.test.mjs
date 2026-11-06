import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../vendor/three.module.js';
import {buildAvatar} from '../src/avatars/build.js';
import {recipeFor} from '../src/avatars/cast.js';
import {normalizeRecipe,PARTS} from '../src/avatars/recipe.js';
import {drawFace,faceLayout,EXPRESSION_NAMES,eyesOf} from '../src/avatars/face.js';
import {EYES_3D_STATES,EYE_PARAMS,eyeShape,eyesShow,eyes3dOn} from '../src/avatars/eyes3d.js';
import {installDOM} from './fixtures.mjs';

// The rigged eyes (src/avatars/eyes3d.js; jojo 3d/cast/avatars-cad/HANDOFF.md, step 1): on, unless a page asks ?eyes3d=0.
const SIX=['Thuan','Johansson','Tetsuo','Thao','Fujita','Vy'];

test('the rigged eyes are on unless the page asks for the painted ones',()=>{
 installDOM();
 assert.equal(eyes3dOn(),true);
 const rigged=buildAvatar(recipeFor('Thuan'),{shadows:false});assert.ok(rigged.eyes3d);assert.ok(rigged.root.getObjectByName('Shimanchu eyes'));rigged.dispose();
 globalThis.location.search='?eyes3d=0';
 try{
  assert.equal(eyes3dOn(),false);const plain=buildAvatar(recipeFor('Thuan'),{shadows:false});
  assert.equal(plain.eyes3d,null);assert.equal(plain.root.getObjectByName('Shimanchu eyes'),undefined);plain.dispose();
 }finally{delete globalThis.location.search;}
});

test('each eye sits on the head where the painter draws it, for all six residents',()=>{
 installDOM();
 const ray=new THREE.Ray(),A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3(),hit=new THREE.Vector3(),bary=new THREE.Vector3(),tri=new THREE.Triangle();
 for(const name of SIX){
  const a=buildAvatar(recipeFor(name),{shadows:false,eyes3d:true}),L=faceLayout(a.recipe),head=a.face.head;
  const HP=head.geometry.attributes.position,HU=head.geometry.attributes.uv,EP=a.eyes3d.mesh.geometry.attributes.position,EL=a.eyes3d.mesh.geometry.attributes.eyeLocal;
  assert.equal(a.eyes3d.mesh.parent,a.bones.head,name+': on the head bone');
  let worst=0,checked=0;
  for(let i=0;i<EP.count;i+=7){
   // Where the disc's point is on the face's canvas: down onto the head's own surface, read its texture coordinates.
   const p=new THREE.Vector3().fromBufferAttribute(EP,i),centre=head.position;ray.set(p,centre.clone().sub(p).normalize());
   let best=null;
   for(let t=0;t<HP.count;t+=3){
    A.fromBufferAttribute(HP,t).add(centre);B.fromBufferAttribute(HP,t+1).add(centre);C.fromBufferAttribute(HP,t+2).add(centre);
    if(!ray.intersectTriangle(A,B,C,false,hit)||hit.distanceTo(p)>.02||(best&&hit.distanceTo(p)>=best.d))continue;
    tri.set(A,B,C);tri.getBarycoord(hit,bary);let u=0,v=0;for(let k=0;k<3;k++){u+=HU.getX(t+k)*bary.getComponent(k);v+=HU.getY(t+k)*bary.getComponent(k);}
    best={d:hit.distanceTo(p),u,v};
   }
   assert.ok(best,name+': the disc lies over the head');
   // Where the painter's drawEye puts the same point: translate to the eye, rotate by its tilt, scale by its size.
   const x=EL.getX(i),y=EL.getY(i),side=EL.getZ(i),S=L.eyeS,ang=-side*L.eyeTilt,X=x*side*S*L.eyeW,Y=-y*S;
   const expect=[128+side*L.spread+Math.cos(ang)*X-Math.sin(ang)*Y,L.eyeY+Math.sin(ang)*X+Math.cos(ang)*Y];
   worst=Math.max(worst,Math.hypot(best.u*256-expect[0],(1-best.v)*256-expect[1]));checked++;
   assert.ok(best.d>.0003&&best.d<.008,name+': a millimetre or a few off the skin, not in it ('+(best.d*1000).toFixed(2)+' mm)');
  }
  assert.ok(checked>30);
  assert.ok(worst<1.5,name+': the disc is within '+worst.toFixed(2)+' canvas units of the painted eye');
  a.dispose();
 }
});

test('two eyes are one draw of a few hundred triangles, blended, writing no depth',()=>{
 installDOM();
 for(const name of SIX){
  const a=buildAvatar(recipeFor(name),{shadows:false,eyes3d:true}),mesh=a.eyes3d.mesh,g=mesh.geometry;
  assert.ok(g.index.count/3<=600,name+' eyes: '+g.index.count/3+' triangles');
  assert.equal(mesh.isMesh,true);assert.equal(Array.isArray(mesh.material),false);
  // Nothing outside the eye changes: no depth for the ink to read, none in the Looks' normals (look-buffers.js).
  assert.equal(mesh.material.depthWrite,false);assert.equal(mesh.material.transparent,true);assert.equal(mesh.castShadow,false);
  // Drawn before glasses' lenses and a painted beard, so those stay over the eyes.
  assert.ok(mesh.renderOrder<0);
  for(const v of g.attributes.position.array)assert.ok(Number.isFinite(v));
  a.dispose();
 }
});

test('every eye style has a shape for every drawn state: open eyes open, shut eyes shut',()=>{
 for(const style of PARTS.eyes)for(const eyes of EYES_3D_STATES){
  const s=eyeShape(style,eyes);
  assert.deepEqual(Object.keys(s).filter(k=>!EYE_PARAMS.includes(k)),[],'every number has a place in the shader');
  for(const name of EYE_PARAMS.slice(0,33))assert.ok(Number.isFinite(s[name]??0),style+' '+eyes+' '+name);
  assert.ok(s.rx>0&&s.ry>0);
  assert.equal(s.closed,['closed','content','happy'].includes(eyes)?1:0,style+' '+eyes);
  if(eyes==='happy')assert.equal(s.arch,1);
 }
 // Mr Fujita's style of squint is drawn by the painter in every feeling, as are the symbol eyes.
 assert.equal(eyesShow('squint','open'),false);
 for(const eyes of ['star','heart','spiral','pain','wink','smug','bawl','blank'])assert.equal(eyesShow('round',eyes),false,eyes);
 for(const eyes of EYES_3D_STATES)assert.equal(eyesShow('heavy',eyes),true,eyes);
});

test('the painter leaves out the eyes the discs draw, and only those',()=>{
 installDOM();
 const recipe=normalizeRecipe(recipeFor('Thuan')),L=faceLayout(recipe);
 const eyeMoves=state=>{const moves=[];const ctx=new Proxy({canvas:{}},{get(t,k){if(k in t)return t[k];if(k==='translate')return (x,y)=>moves.push([x,y]);if(k.startsWith('create'))return ()=>({addColorStop(){}});return ()=>{};},set(t,k,v){t[k]=v;return true;}});drawFace(ctx,recipe,state);
  return moves.filter(([x,y])=>Math.abs(y-L.eyeY)<.01&&Math.abs(Math.abs(x-128)-L.spread)<.01).length;};
 assert.equal(eyeMoves({expression:'neutral'}),2);assert.equal(eyeMoves({expression:'neutral',skipEyes:true}),0);
 const a=buildAvatar(recipe,{shadows:false,eyes3d:true});
 for(const expression of EXPRESSION_NAMES){
  a.paintFace({expression,blink:0,look:[0,0]});
  const drawn=eyesShow(recipe.eyes.style,eyesOf({expression}).eyes);
  assert.equal(a.eyes3d.showing,drawn,expression);assert.equal(a.eyes3d.mesh.visible,drawn,expression);
  assert.equal(a.faceKey.includes('|3d|'),drawn,expression+': the canvas skips the eyes exactly when the discs show');
 }
 a.dispose();
});

test('gaze and blinks move the rigged eyes without repainting the face',()=>{
 installDOM();
 const a=buildAvatar(recipeFor('Johansson'),{shadows:false,eyes3d:true});
 // The uniforms the shader reads, found through the compile hook (the program would get the same object).
 const shader={uniforms:{},vertexShader:'#include <uv_vertex>',fragmentShader:'#include <color_fragment>#include <emissivemap_fragment>#include <opaque_fragment>'};
 a.eyes3d.mesh.material.onBeforeCompile(shader,null);const params=shader.uniforms.uEye.value;
 assert.match(shader.fragmentShader,/diffuseColor = eyesPaint\( eyeParallax\( vViewPosition \) \)/);assert.match(shader.vertexShader,/vEye = eyeLocal/);
 const at=name=>params[EYE_PARAMS.indexOf(name)];
 a.paintFace({expression:'neutral',blink:0,look:[0,0]});const key=a.faceKey;
 a.paintFace({look:[1,-.5]});assert.equal(at('lookX'),1);assert.equal(at('lookY'),-.5);
 a.paintFace({blink:.5});assert.equal(at('blinkA'),.5);assert.equal(at('blinkB'),.5);
 assert.equal(a.faceKey,key,'a look and a blink are the eyes\' own: the canvas is not redrawn');
 a.paintFace({blink:0,blinkLeft:1,blinkRight:0});assert.equal(at('blinkA'),1);assert.equal(at('blinkB'),0);
 a.paintFace({expression:'happy',blinkLeft:undefined,blinkRight:undefined});assert.equal(at('closed'),1);assert.equal(at('arch'),1);
 assert.deepEqual(a.faceState.look,[1,-.5],'the face state still records where they look');
 let released=0;a.eyes3d.mesh.geometry.addEventListener('dispose',()=>released++);a.eyes3d.mesh.material.addEventListener('dispose',()=>released++);
 a.dispose();assert.equal(released,2);
});
