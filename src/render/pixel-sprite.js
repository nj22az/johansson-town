import * as THREE from '../../vendor/three.module.js';
/**
 * The Blåhaj look (the owner, 27 November 2026, of kuraneko1.github.io/blahaj-kikkou-3d: "I want the same style as the
 * shark"), for a creature of the town: its 3D body is drawn small, into a picture of its own (`dots` square over `span`
 * metres), in the town's flat tones and by the town's lights, `fps` times a second as the shark is; the picture stands in
 * the town facing the camera, its dots shown square and an ink line one dot wide drawn round the outline. The body is on a
 * layer of its own (`layer`) that only the picture's camera sees. Used by Tama (world/tama.js) and the gulls
 * (world/gulls.js).
 */
export const PIXEL_INK=0x231d2b;
export function pixelSprite(root,{name='Drawn creature',dots=72,span=.84,fps=24,layer=30,centre=[0,0,0],forward=.45,far=90,ink=PIXEL_INK}={}){
 const target=new THREE.WebGLRenderTarget(dots,dots,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,generateMipmaps:false,depthBuffer:true});
 const lens=new THREE.OrthographicCamera(-span/2,span/2,span/2,-span/2,.05,8);lens.layers.set(layer);
 root.traverse(o=>o.layers.set(layer));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:true,
  uniforms:{map:{value:target.texture},texel:{value:1/dots},ink:{value:new THREE.Color(ink)}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D map;uniform float texel;uniform vec3 ink;varying vec2 vUv;
   void main(){vec2 at=(floor(vUv/texel)+.5)*texel;vec4 c=texture2D(map,at);
    if(c.a<.5){float n=max(max(texture2D(map,at+vec2(texel,0.)).a,texture2D(map,at-vec2(texel,0.)).a),max(texture2D(map,at+vec2(0.,texel)).a,texture2D(map,at-vec2(0.,texel)).a));
     if(n<.5)discard;gl_FragColor=vec4(ink,1.);}else gl_FragColor=vec4(c.rgb,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
   }`});
 const card=new THREE.Mesh(new THREE.PlaneGeometry(span,span),material);card.name=name;card.frustumCulled=false;
 // (its own ink: the town's line is not drawn round the card)
 card.userData.outline=true;card.userData.dynamicProp=true;
 const at=new THREE.Vector3(),look=new THREE.Vector3(),offset=new THREE.Vector3(...centre);let drawn=-1,lit=null;
 card.onBeforeRender=(renderer,scene,camera)=>{
  root.updateMatrixWorld(true);at.copy(offset).applyMatrix4(root.matrixWorld);camera.getWorldDirection(look);
  const d=camera.position.distanceTo(at);
  // The card stands a little in front of the body, toward the camera, so the ground under it does not cut it.
  const toward=Math.min(forward,d*.5);
  card.position.copy(at).addScaledVector(look,-toward);card.quaternion.copy(camera.quaternion);
  card.scale.setScalar((d-toward)/d);card.updateMatrixWorld(true);
  if(scene.overrideMaterial||d>far)return;
  const now=performance.now()/1000;if(now-drawn<1/fps)return;drawn=now;
  // The town's lights light it: they are let onto its layer once.
  if(lit!==scene){scene.traverse(o=>{if(o.isLight)o.layers.enable(layer);});lit=scene;}
  lens.position.copy(at).addScaledVector(look,-3);lens.quaternion.copy(camera.quaternion);lens.updateMatrixWorld(true);
  const previous=renderer.getRenderTarget(),clear=renderer.getClearColor(new THREE.Color()),alpha=renderer.getClearAlpha(),bg=scene.background,fog=scene.fog,
   shadows=renderer.shadowMap.autoUpdate,auto=renderer.autoClear;
  try{scene.background=null;scene.fog=null;renderer.shadowMap.autoUpdate=false;renderer.autoClear=true;
   renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(scene,lens);}
  finally{renderer.setRenderTarget(previous);renderer.setClearColor(clear,alpha);scene.background=bg;scene.fog=fog;renderer.shadowMap.autoUpdate=shadows;renderer.autoClear=auto;}
 };
 return {card,target,lens};
}
