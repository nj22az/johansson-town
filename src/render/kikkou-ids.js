import * as THREE from '../../vendor/three.module.js';

/**
 * Kikkou ink (the owner, 25 November 2026: "I just know I want the kikkou style for Johansson World", then "Start kikkou
 * make the konbini first"). Studied from kuraneko1.github.io/blahaj-kikkou-3d: every object is drawn a second time in a
 * colour of its own (its ID), and the ink pass (ink-pipeline.js) draws a line wherever that colour changes. So a line
 * falls between any two things that meet, a can against the can beside it, a pack against its shelf, a sleeve against a
 * shirt, however close in depth they are, and never inside one thing; the depth ink still draws creases and folds.
 *
 * This draws the IDs from the SAME posed draw as the picture (as look-buffers.js draws its normals): the draw callback is
 * run again with each visible mesh's material swapped for an ID material, so whatever path drew the frame (the street,
 * a room through its glazing, the inspector) gets its IDs without knowing.
 *
 * - An object's ID is its own (a WeakMap counter, sixteen bits in red and green); each copy of an InstancedMesh adds its
 *   instance number in blue, so the tins in a row are inked one from the next.
 * - Skinned bodies, morphs and instancing are drawn by three's own chunks, so a walking resident's ID is where she is.
 * - A cut-out (a map with alphaTest, or an alpha map) keeps its holes; see-through and decal surfaces (opacity under one
 *   half, or not writing depth: glass, the painted face layers, blush) are left out, so they never get a box drawn round
 *   them; so are surfaces drawn without colour (colorWrite off: the stand-ins the picture never shows) and any material that
 *   asks with `userData.noInk`. The cartoon's own hull outlines (build.js addOutline, `userData.outline`) are left out here and hidden from the
 *   picture while Kikkou is on: the ID line replaces them.
 */

const ID_VERTEX=`
#include <common>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
uniform mat3 uIdMapTransform;
varying vec2 vIdUv;
varying float vIdInstance;
void main(){
 vIdUv=(uIdMapTransform*vec3(uv,1.0)).xy;
 #ifdef USE_INSTANCING
 vIdInstance=float(gl_InstanceID);
 #else
 vIdInstance=0.0;
 #endif
 #include <morphinstance_vertex>
 #include <skinbase_vertex>
 #include <begin_vertex>
 #include <morphtarget_vertex>
 #include <skinning_vertex>
 #include <project_vertex>
}`;

const ID_FRAGMENT=`
uniform vec3 uId;
uniform sampler2D uIdMap;
uniform float uIdTest;
uniform bool uIdHasMap;
varying vec2 vIdUv;
varying float vIdInstance;
void main(){
 if(uIdHasMap&&texture2D(uIdMap,vIdUv).a<uIdTest)discard;
 // (blue is never 0 on a drawn surface, so nothing drawn matches the cleared background)
 gl_FragColor=vec4(uId.xy,(mod(vIdInstance,254.0)+1.0)/255.0,1.0);
}`;

/** Whether a material is left out of the IDs: see-through, a decal, or not drawn at all. */
export function idSkips(m){return !!(!m||m.visible===false||m.colorWrite===false||m.userData?.noInk||m.opacity<.5||m.depthWrite===false||(m.transparent&&!m.map&&!m.alphaMap&&m.opacity<1));}

export function createKikkouIds(renderer){
 let target=null;
 const ids=new WeakMap();let next=1;
 const idOf=o=>{let v=ids.get(o);if(v==null){v=next;next=next>=65535?1:next+1;ids.set(o,v);}return v;};
 const cache=new WeakMap(),made=new Set();
 const blank=new THREE.Matrix3();
 function idFor(m){
  if(!m)return m;
  let n=cache.get(m);
  if(!n){
   // A cut-out keeps its holes; so does a see-through picture (a sticker or a sign on the glass, transparent with a map
   // and no alpha test): only what it prints is inked, not the rectangle it is printed on.
   const cut=m.alphaMap||(m.map&&(m.alphaTest>0||m.transparent))?(m.alphaMap||m.map):null;
   n=new THREE.ShaderMaterial({
    vertexShader:ID_VERTEX,fragmentShader:ID_FRAGMENT,side:m.side,
    uniforms:{uId:{value:new THREE.Vector3()},uIdMap:{value:cut},uIdHasMap:{value:!!cut},uIdTest:{value:Math.max(m.alphaTest||0,.5)},
     uIdMapTransform:{value:new THREE.Matrix3()}},
    visible:!idSkips(m),
   });
   n.name='Kikkou ID';
   // Each object writes its own ID: set just before it draws (three calls a material's onBeforeRender per object).
   n.onBeforeRender=function(_r,_s,_c,_g,object){
    const v=idOf(object);this.uniforms.uId.value.set((v%256)/255,Math.floor(v/256)/255,0);
    const t=this.uniforms.uIdMap.value;if(t){if(t.matrixAutoUpdate)t.updateMatrix();this.uniforms.uIdMapTransform.value.copy(t.matrix);}else this.uniforms.uIdMapTransform.value.copy(blank);
    this.uniformsNeedUpdate=true;
   };
   const cleanup=()=>{m.removeEventListener('dispose',cleanup);cache.delete(m);made.delete(n);n.dispose();};
   m.addEventListener('dispose',cleanup);n.userData.disposeSource=cleanup;cache.set(m,n);made.add(n);
  }
  n.visible=!idSkips(m);n.side=m.side;
  return n;
 }
 return {
  /** Runs `draw` again into the ID target (the size of the picture's own target). */
  render(draw,width,height){
   if(!target){
    target=new THREE.WebGLRenderTarget(width,height,{colorSpace:THREE.NoColorSpace,depthBuffer:true,stencilBuffer:false,
     minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,generateMipmaps:false});
    // Its own depth: the line thins with distance from it (the picture's depth can be cleared by a room's last pass).
    target.depthTexture=new THREE.DepthTexture(width,height,THREE.UnsignedIntType);
    target.depthTexture.minFilter=target.depthTexture.magFilter=THREE.NearestFilter;
   }else if(target.width!==width||target.height!==height)target.setSize(width,height);
   const previous=renderer.getRenderTarget(),render=renderer.render,clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),
    shadows=renderer.shadowMap?.autoUpdate,shadowUpdate=renderer.shadowMap?.needsUpdate,autoClear=renderer.autoClear;
   renderer.render=function(scene,view){
    const changed=[],hidden=[],bg=scene.background,fog=scene.fog,override=scene.overrideMaterial;
    scene.background=null;scene.fog=null;scene.overrideMaterial=null;
    scene.traverseVisible(o=>{
     if(o.isLine||o.isPoints||o.isSprite||o.userData?.outline){hidden.push(o);o.visible=false;return;}
     if(!o.isMesh||!o.material)return;
     const old=o.material;o.material=Array.isArray(old)?old.map(idFor):idFor(old);changed.push([o,old]);
    });
    try{return render.call(renderer,scene,view);}
    finally{for(const [o,m] of changed)o.material=m;for(const o of hidden)o.visible=true;scene.background=bg;scene.fog=fog;scene.overrideMaterial=override;}
   };
   try{
    if(renderer.shadowMap){renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;}
    renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();draw(renderer);
   }finally{
    renderer.render=render;renderer.autoClear=autoClear;
    if(renderer.shadowMap){renderer.shadowMap.autoUpdate=shadows;renderer.shadowMap.needsUpdate=shadowUpdate;}
    renderer.setClearColor(clear,alpha);renderer.setRenderTarget(previous);
   }
   return target;
  },
  get target(){return target;},
  dispose(){target?.dispose();for(const m of [...made])m.userData.disposeSource();made.clear();}
 };
}

/** The picture's draw with the cartoon's hull outlines hidden (Kikkou draws its own line in their place). */
export function drawWithoutHulls(renderer,draw){
 const render=renderer.render;
 renderer.render=function(scene,view){
  const hidden=[];scene.traverseVisible(o=>{if(o.userData?.outline){hidden.push(o);o.visible=false;}});
  try{return render.call(renderer,scene,view);}finally{for(const o of hidden)o.visible=true;}
 };
 try{return draw(renderer);}finally{renderer.render=render;}
}

/** Where Kikkou is on: `?kikkou=1` everywhere, `?kikkou=0` nowhere, otherwise in the rooms it has reached (Sakura first). */
// (Sakura Shōten's room is 'market': world/businesses.js)
export const KIKKOU_ROOMS=Object.freeze(new Set(['market']));
let askedSearch=null,asked=null;
export function kikkouWanted(roomId,search=globalThis.location?.search||''){
 // (asked every frame: the address is read again only when it changes)
 if(search!==askedSearch){askedSearch=search;try{asked=new URLSearchParams(search).get('kikkou');}catch{asked=null;}}
 const q=asked;
 if(q==='0')return false;
 if(q==='1')return true;
 // (`?kikkou=ids` shows the IDs themselves instead of the picture, to see what the ink is drawn from)
 if(q==='ids'||q==='edge')return q;
 return KIKKOU_ROOMS.has(roomId);
}
