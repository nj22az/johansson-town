/** Auxiliary images from the SAME posed draw, not a parallel scene or renderer. */
import * as THREE from '../../vendor/three.module.js';
export function createLookBuffers(renderer){
 let target,packed;const cache=new WeakMap(),made=new Set(),identity3=new THREE.Matrix3(),quadScene=new THREE.Scene(),camera=new THREE.Camera();
 const material=new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'#include <packing>\nuniform sampler2D source;varying vec2 vUv;void main(){float v=floor(clamp(texture2D(source,vUv).x,0.0,1.0)*16777215.0);gl_FragColor=vec4(floor(v/65536.0),floor(mod(v,65536.0)/256.0),mod(v,256.0),255.0)/255.0;}',uniforms:{source:{value:null}},depthTest:false,depthWrite:false,toneMapped:false});
 const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);quadScene.add(quad);
 function updateSource(n,m){for(const texture of [m.map,m.alphaMap])if(texture?.matrixAutoUpdate)texture.updateMatrix();const u=n.userData.inkSources;if(u){u.inkMap.value=m.map||null;u.inkAlpha.value=m.alphaMap||null;u.inkHasMap.value=!!m.map;u.inkHasAlpha.value=!!m.alphaMap;u.inkMapTransform.value=m.map?.matrix||identity3;u.inkAlphaTransform.value=m.alphaMap?.matrix||identity3;u.inkTest.value=Math.max(m.alphaTest||0,m.transparent?0.5:0);}n.visible=m.visible&&m.opacity>=.5&&m.depthWrite!==false;}
 function normalFor(m){if(!m)return m;if(cache.has(m)){const n=cache.get(m);updateSource(n,m);return n;}
  const n=new THREE.MeshNormalMaterial({side:m.side,depthWrite:m.depthWrite,depthTest:m.depthTest,visible:m.visible&&m.opacity>=.5&&m.depthWrite!==false});
  n.onBeforeCompile=s=>{s.uniforms.inkMap={value:m.map||null};s.uniforms.inkAlpha={value:m.alphaMap||null};s.uniforms.inkHasMap={value:!!m.map};s.uniforms.inkHasAlpha={value:!!m.alphaMap};s.uniforms.inkTest={value:Math.max(m.alphaTest||0,m.transparent ? 0.5 : 0)};s.uniforms.inkMapTransform={value:m.map?.matrix||identity3};s.uniforms.inkAlphaTransform={value:m.alphaMap?.matrix||identity3};n.userData.inkSources=s.uniforms;updateSource(n,m);
   s.vertexShader='varying vec2 inkUV;\n'+s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ninkUV=uv;');
   s.fragmentShader='uniform sampler2D inkMap;uniform sampler2D inkAlpha;uniform bool inkHasMap;uniform bool inkHasAlpha;uniform float inkTest;uniform mat3 inkMapTransform;uniform mat3 inkAlphaTransform;varying vec2 inkUV;\n'+s.fragmentShader.replace('void main() {','void main() {\nfloat a=1.0;if(inkHasMap)a*=texture2D(inkMap,(inkMapTransform*vec3(inkUV,1.0)).xy).a;if(inkHasAlpha)a*=texture2D(inkAlpha,(inkAlphaTransform*vec3(inkUV,1.0)).xy).g;if(a<inkTest)discard;');};
  const cleanup=()=>{m.removeEventListener('dispose',cleanup);cache.delete(m);made.delete(n);n.dispose();};m.addEventListener('dispose',cleanup);n.userData.disposeSource=cleanup;cache.set(m,n);made.add(n);updateSource(n,m);return n;
 }
 return {
  render(draw,width,height){if(!target){target=new THREE.WebGLRenderTarget(width,height,{colorSpace:THREE.NoColorSpace,depthBuffer:true,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});target.depthTexture=new THREE.DepthTexture(width,height,THREE.UnsignedIntType);}else if(target.width!==width||target.height!==height)target.setSize(width,height);
   const previous=renderer.getRenderTarget(),render=renderer.render,clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),shadows=renderer.shadowMap?.autoUpdate,shadowUpdate=renderer.shadowMap?.needsUpdate;
   renderer.render=function(scene,view){const changed=[],hidden=[],bg=scene.background,override=scene.overrideMaterial;scene.background=null;scene.overrideMaterial=null;scene.traverseVisible(o=>{if(o.isLine||o.isPoints||o.isSprite){hidden.push(o);o.visible=false;return;}if(!o.isMesh||!o.material)return;const old=o.material;o.material=Array.isArray(old)?old.map(normalFor):normalFor(old);changed.push([o,old]);});try{return render.call(renderer,scene,view);}finally{for(const [o,m] of changed)o.material=m;for(const o of hidden)o.visible=true;scene.background=bg;scene.overrideMaterial=override;}};
   try{if(renderer.shadowMap){renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=false;}renderer.setRenderTarget(target);renderer.setClearColor(0,0);renderer.clear();draw(renderer);}finally{renderer.render=render;if(renderer.shadowMap){renderer.shadowMap.autoUpdate=shadows;renderer.shadowMap.needsUpdate=shadowUpdate;}renderer.setClearColor(clear,alpha);renderer.setRenderTarget(previous);}return target;
  },
  get target(){return target;},
  export(view,{focusDistance=6,focusRange=3,focusMode='depth',skyDepth=120}={}){if(!target)return null;
   const w=target.width,h=target.height,previous=renderer.getRenderTarget();
   const png=rt=>{const bytes=new Uint8Array(w*h*4);renderer.readRenderTargetPixels(rt,0,0,w,h,bytes);const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),im=ctx.createImageData(w,h);for(let y=0;y<h;y++)im.data.set(bytes.subarray(y*w*4,(y+1)*w*4),(h-y-1)*w*4);ctx.putImageData(im,0,0);return c.toDataURL('image/png');};
   packed??=new THREE.WebGLRenderTarget(w,h,{colorSpace:THREE.NoColorSpace,depthBuffer:false});if(packed.width!==w||packed.height!==h)packed.setSize(w,h);
   try{material.uniforms.source.value=target.depthTexture;renderer.setRenderTarget(packed);renderer.render(quadScene,camera);return {version:1,encoding:'rgb24-depth',width:w,height:h,depth:png(packed),normal:png(target),near:view.near,far:view.far,projectionInverse:view.projectionMatrixInverse.toArray(),cameraWorld:view.matrixWorld.toArray(),focusDistance,focusRange,focusMode,skyDepth};}finally{renderer.setRenderTarget(previous);}
  },
  dispose(){target?.dispose();packed?.dispose();quad.geometry.dispose();material.dispose();for(const m of made)m.userData.disposeSource();made.clear();}
 };
}
