import {createLookBuffers} from './look-buffers.js';
import {drawWithLookMaterials} from './look-materials.js';
import * as THREE from '../../vendor/three.module.js';
import {lookFragment,lookNormals,lookSurfaceStrokes} from './looks.js';
import {SKIN_MARK,markSkin} from '../avatars/pixar-skin.js';

/**
 * The 3D-to-2D pass: what turns a lit 3D town into a drawn one.
 *
 *   scene -> rtScene (colour + depth) -> ink + grade -> rtColour -> FXAA -> screen
 *
 * With a look chosen (looks.js) the FXAA result goes to rtLook instead, and the look
 * pass draws it onto the screen. Natural adds nothing.
 *
 * Ported from Sakura Crossing by Kenton-GMI (MIT). The shading maths is theirs; the
 * plumbing is not, because this town does not render in one call. Outdoors goes
 * through the section culler, the market draws the street through the shop glazing
 * and then composites the interior over it with autoClear off, and the inspector has
 * its own pass entirely. So the pipeline takes a *callback*: it binds the target,
 * hands the renderer back to whichever path is in charge, and only then runs the
 * chain. Every path gets the look without any of them knowing about it.
 *
 * Lines come from the second difference of linearised depth. A first difference
 * smears ink across the road wherever a surface grazes the camera; a second
 * difference is flat across any plane however oblique, so it fires only on real
 * silhouettes and real creases. Positive curvature (the near side of a silhouette, a
 * roof ridge) inks strongly, negative curvature (inside corners) faintly — which is
 * how an animator draws contact lines.
 */

export const INK_DEFAULTS={
 thickness:1.35,
 sensitivity:0.0042,
 concave:0.026,
 concaveAmount:0.42,
 fadeStart:40,
 fadeEnd:98,
 strength:1,
 // Past this the picture is sky or far horizon; inking it makes the distance busy.
 skyDepth:180
};

export const GRADE_DEFAULTS={
 shadowTint:0xada8d0,
 // (the split tone's dark end on a modelled character's skin: about the violet's brightness, warm)
 skinShadowTint:0xd6ab9c,
 lightTint:0xfff7e8,
 saturation:1.12,
 lift:0.032,
 vignette:0.15,
 warmth:0.05
};

const QUAD_VERTEX=`
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}
`;

const INK_FUNCTIONS=`
#include <packing>
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear,uFar,uInkEnabled;
uniform vec3 uInk;
uniform float uThickness,uSens,uConcave,uConcaveAmount;
uniform float uFadeStart,uFadeEnd,uStrength,uSkyDepth;
// A modelled character's skin marks itself in the scene's alpha (SKIN_MARK, avatars/pixar-skin.js): its soft curves get no
// inside-corner ink (which on a face draws grey smudges under the cheekbones and beside the nose), and its darks are
// toned warm rather than violet (the grade's split tone): skin in shadow is light under the skin, not a bruise.
float gSkin=0.;
float skinMark(float a){return 1.0-smoothstep(0.004,0.008,abs(a-${SKIN_MARK.toFixed(4)}));}

float linearDepth(vec2 uv){
 float d=texture2D(tDepth,uv).x;
 return -perspectiveDepthToViewZ(d,uNear,uFar);
}

vec3 inkColour(vec2 uv){
 vec3 col=texture2D(tDiffuse,uv).rgb;
 if(uInkEnabled<0.5)return col;
 vec2 t=uTexel*uThickness;
 float dc=linearDepth(uv);
 if(dc>uSkyDepth){return col;}

 float dl=linearDepth(uv-vec2(t.x,0.0));
 float dr=linearDepth(uv+vec2(t.x,0.0));
 float du=linearDepth(uv+vec2(0.0,t.y));
 float dd=linearDepth(uv-vec2(0.0,t.y));

 float sx=(dl+dr-2.0*dc)/dc;
 float sy=(du+dd-2.0*dc)/dc;

 float convex=max(0.0,sx)+max(0.0,sy);
 float concave=max(0.0,-sx)+max(0.0,-sy);

 // (on skin only a firm edge inks: a faint one, where a nose's underside meets the lip, breaks up into scratches)
 float edge=smoothstep(uSens*mix(0.32,0.7,gSkin),uSens*mix(1.0,1.6,gSkin),convex);
 edge=max(edge,smoothstep(uConcave,uConcave*3.4,concave)*uConcaveAmount*(1.0-0.9*gSkin));
 edge*=1.0-smoothstep(uFadeStart,uFadeEnd,dc);
 edge*=uStrength;

 // The line keeps a whisper of the colour under it, so it never looks pasted on.
 vec3 line=mix(uInk,col*0.42,0.22);
 return mix(col,line,clamp(edge,0.0,1.0));
}
`;

const GRADE_FUNCTIONS=`
uniform vec3 uShadowTint,uLightTint,uSkinShadowTint;
uniform float uSaturation,uLift,uVignette,uWarmth,uAmount,uExposure;

vec3 linearToSRGB(vec3 c){
 return mix(c*12.92,1.055*pow(max(c,vec3(0.0031308)),vec3(1.0/2.4))-0.055,step(0.0031308,c));
}

// A soft shoulder above the knee. With tone mapping off, a strong sun on pale plaster
// went straight past 1.0 and clipped to flat white; this rolls the brightest channel
// into the last stretch of range and scales the others with it, so hue holds.
vec3 shoulder(vec3 c){
 const float knee=0.78;
 float m=max(c.r,max(c.g,c.b));
 if(m<=knee)return c;
 float t=knee+(1.0-knee)*(1.0-exp(-(m-knee)/(1.0-knee)));
 return c*(t/m);
}

vec3 gradeColour(vec3 source,vec2 uv){
 vec3 raw=shoulder(source*uExposure);
 vec3 c=raw;
 float l=dot(c,vec3(0.2126,0.7152,0.0722));

 // Split tone: cool violet in the darks, warm paper white in the lights.
 float k=smoothstep(0.02,0.55,l);
 c*=mix(mix(uShadowTint,uSkinShadowTint,gSkin),uLightTint,k);

 c+=vec3(uWarmth,uWarmth*0.45,0.0)*l*0.35;
 // Shadows stay readable. An anime background never crushes to black.
 c=c+uLift*(1.0-k);
 c=mix(vec3(l),c,uSaturation);

 float r=length(uv-0.5)*1.42;
 c*=1.0-uVignette*pow(clamp(r,0.0,1.0),2.6);

 // uAmount 0 leaves a plain linear->sRGB blit, so the grade can be compared away
 // without the pass dropping out of the chain and taking the picture with it.
 c=mix(raw,c,uAmount);

 return linearToSRGB(max(c,vec3(0.0)));
}
`;

// The grade consumes the ink result in the same fragment. It stays linear until
// the final sRGB conversion; FXAA still samples the graded image as before. This
// removes a full-screen colour target and one draw without changing effect order.
const COMPOSITE_FRAGMENT=`
varying vec2 vUv;
${INK_FUNCTIONS}
${GRADE_FUNCTIONS}
void main(){gSkin=skinMark(texture2D(tDiffuse,vUv).a);gl_FragColor=vec4(gradeColour(inkColour(vUv),vUv),1.0);}
`;

const FXAA_FRAGMENT=`
uniform sampler2D tDiffuse;
uniform vec2 uTexel;
varying vec2 vUv;
float luma(vec3 c){return dot(c,vec3(0.299,0.587,0.114));}
void main(){
 vec3 cM=texture2D(tDiffuse,vUv).rgb;
 vec3 cNW=texture2D(tDiffuse,vUv+vec2(-uTexel.x,-uTexel.y)).rgb;
 vec3 cNE=texture2D(tDiffuse,vUv+vec2( uTexel.x,-uTexel.y)).rgb;
 vec3 cSW=texture2D(tDiffuse,vUv+vec2(-uTexel.x, uTexel.y)).rgb;
 vec3 cSE=texture2D(tDiffuse,vUv+vec2( uTexel.x, uTexel.y)).rgb;
 float lM=luma(cM),lNW=luma(cNW),lNE=luma(cNE),lSW=luma(cSW),lSE=luma(cSE);
 float lMin=min(lM,min(min(lNW,lNE),min(lSW,lSE)));
 float lMax=max(lM,max(max(lNW,lNE),max(lSW,lSE)));
 vec2 dir=vec2(-((lNW+lNE)-(lSW+lSE)),((lNW+lSW)-(lNE+lSE)));
 float reduce=max((lNW+lNE+lSW+lSE)*0.25*0.18,1.0/128.0);
 float rcp=1.0/(min(abs(dir.x),abs(dir.y))+reduce);
 dir=clamp(dir*rcp,vec2(-8.0),vec2(8.0))*uTexel;
 vec3 rgbA=0.5*(texture2D(tDiffuse,vUv+dir*(1.0/3.0-0.5)).rgb+texture2D(tDiffuse,vUv+dir*(2.0/3.0-0.5)).rgb);
 vec3 rgbB=rgbA*0.5+0.25*(texture2D(tDiffuse,vUv-dir*0.5).rgb+texture2D(tDiffuse,vUv+dir*0.5).rgb);
 float lB=luma(rgbB);
 gl_FragColor=vec4((lB<lMin||lB>lMax)?rgbA:rgbB,1.0);
}
`;

/**
 * A screen-filling triangle-pair. three's own FullScreenQuad lives in the addons,
 * which are not vendored here, and it is four lines.
 */
// The graded picture shrunk for the Look picker's live pictures: sixteen samples across each small pixel, so a
// 2000-line frame becomes a 240-line one without the shimmer of reading every eighth pixel.
const SHRINK_FRAGMENT=`
uniform sampler2D tDiffuse;
uniform vec2 uStep;
varying vec2 vUv;
void main(){
 vec3 c=vec3(0.0);
 for(int j=0;j<4;j++)for(int i=0;i<4;i++)c+=texture2D(tDiffuse,vUv+(vec2(float(i),float(j))-1.5)*uStep).rgb;
 gl_FragColor=vec4(c/16.0,1.0);
}`;

function makeQuad(fragmentShader,uniforms){
 const material=new THREE.ShaderMaterial({
  uniforms,vertexShader:QUAD_VERTEX,fragmentShader,
  depthTest:false,depthWrite:false
 });
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),material);
 mesh.frustumCulled=false;
 const scene=new THREE.Scene();scene.add(mesh);
 // The vertex shader writes clip space directly, so the camera is never read.
 const camera=new THREE.Camera();
 return {
  material,
  render(renderer){renderer.render(scene,camera);},
  dispose(){mesh.geometry.dispose();material.dispose();}
 };
}

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {object} [options]
 * @param {number} [options.superScale] render-target scale; >1 supersamples for cleaner ink
 * @param {number} [options.pixelBudget] hard ceiling on render-target pixels
 * @param {boolean} [options.fxaa]
 * @param {number} [options.samples] MSAA samples for the scene target (WebGL2 only)
 * @param {boolean} [options.preferHalfFloat] Allow eight-bit targets on constrained devices
 * @param {number} [options.ink] ink colour
 * @param {boolean} [options.lightLooks] draw the lighter version of a look where it has one (phones and tablets)
 */
export function createInkPipeline(renderer,{superScale=1.5,pixelBudget=4.6e6,fxaa=true,samples=4,preferHalfFloat=true,ink=0x2b2a33,inkOptions={},gradeOptions={},lightLooks=false}={}){
 const capabilities=renderer.capabilities||{};
 // Half-float keeps the grade from banding. Where it is not available the chain
 // still runs, just on eight bits.
 // WebGL2 supports half-float textures, but rendering into them still requires a
 // colour-buffer extension. Unsupported attachments can produce a black frame
 // without throwing, so choose the safe target format before allocating anything.
 const halfFloat=preferHalfFloat&&capabilities.isWebGL2!==false&&!!(renderer.extensions?.has('EXT_color_buffer_float')||renderer.extensions?.has('EXT_color_buffer_half_float'));
 const targetOptions={
  type:halfFloat?THREE.HalfFloatType:THREE.UnsignedByteType,
  minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,
  stencilBuffer:false,
  colorSpace:THREE.NoColorSpace
 };
 // Native and offscreen multisampling both retain storage. Callers with a
 // constrained graphics budget use samples:0 and keep the final FXAA pass.
 const msaa=capabilities.isWebGL2!==false&&samples>0?Math.min(samples,capabilities.maxSamples??4):0;
 const rtScene=new THREE.WebGLRenderTarget(2,2,{...targetOptions,depthBuffer:true,samples:msaa});
 rtScene.depthTexture=new THREE.DepthTexture(2,2);
 rtScene.depthTexture.format=THREE.DepthFormat;
 rtScene.depthTexture.type=THREE.UnsignedIntType;
 rtScene.depthTexture.minFilter=rtScene.depthTexture.magFilter=THREE.NearestFilter;
 // Once graded the image is sRGB, so an eight-bit target is sufficient even
 // when the scene uses HDR. No second linear intermediate or depth attachment.
 const rtColour=new THREE.WebGLRenderTarget(2,2,{...targetOptions,type:THREE.UnsignedByteType,depthBuffer:false});

 const settings={...INK_DEFAULTS,...inkOptions};
 const grading={...GRADE_DEFAULTS,...gradeOptions};

 const compositePass=makeQuad(COMPOSITE_FRAGMENT,{
  tDiffuse:{value:null},tDepth:{value:rtScene.depthTexture},
  uTexel:{value:new THREE.Vector2(1,1)},
  uNear:{value:0.1},uFar:{value:220},uInkEnabled:{value:1},
  uInk:{value:new THREE.Color(ink)},
  uThickness:{value:settings.thickness},
  uSens:{value:settings.sensitivity},
  uConcave:{value:settings.concave},
  uConcaveAmount:{value:settings.concaveAmount},
  uFadeStart:{value:settings.fadeStart},
  uFadeEnd:{value:settings.fadeEnd},
  uStrength:{value:settings.strength},
  uSkyDepth:{value:settings.skyDepth},
  uShadowTint:{value:new THREE.Color(grading.shadowTint)},
  uLightTint:{value:new THREE.Color(grading.lightTint)},
  uSkinShadowTint:{value:new THREE.Color(grading.skinShadowTint)},
  uSaturation:{value:grading.saturation},
  uLift:{value:grading.lift},
  uVignette:{value:grading.vignette},
  uWarmth:{value:grading.warmth},
  uAmount:{value:1},
  uExposure:{value:1}
 });
 const fxaaPass=makeQuad(FXAA_FRAGMENT,{tDiffuse:{value:null},uTexel:{value:new THREE.Vector2(1,1)}});
 let shrinkPass=null;

 const size=new THREE.Vector2(0,0);
 const state={ink:true,grade:true,fxaa,scale:superScale,samples:msaa,hdr:halfFloat,look:'none',focusDistance:0,focusRange:3,focusMode:0};
 // One pass per look, compiled the first time it is chosen; the target only once a look needs it.
 const lookPasses=new Map();const auxiliary=createLookBuffers(renderer);let view=null;
 let rtLook=null;
 function lookPass(name){
  if(lookPasses.has(name))return lookPasses.get(name);
  const fragment=lookFragment(name,{light:lightLooks,depth:true,normals:lookNormals(name),surfaceStrokes:lookSurfaceStrokes(name)});
  const pass=fragment?makeQuad(fragment,{
   tDiffuse:{value:null},tDepth:{value:rtScene.depthTexture},tNormal:{value:null},uDepthPacked:{value:0},uProjectionInverse:{value:new THREE.Matrix4()},uCameraWorld:{value:new THREE.Matrix4()},uComic:{value:0},uFocusMode:{value:0},uFocusDistance:{value:0},uFocusRange:{value:3},
   uTexel:{value:new THREE.Vector2(1,1)},uResolution:{value:new THREE.Vector2(2,2)},
   uNear:{value:0.1},uFar:{value:220},uSkyDepth:{value:settings.skyDepth}
  }):null;
  lookPasses.set(name,pass);
  return pass;
 }
 let width=0,height=0;

 /** Sizes the targets to whatever the renderer is currently drawing into. */
 function resize(){
  const buffer=renderer.getDrawingBufferSize(new THREE.Vector2());
  const w=Math.max(2,Math.floor(buffer.x)),h=Math.max(2,Math.floor(buffer.y));
  let scale=state.scale;
  // A large Retina window can already exceed the budget before supersampling.
  // Allow downsampling there; a minimum scale of one silently defeated the cap.
  if(w*h*scale*scale>pixelBudget)scale=Math.sqrt(pixelBudget/(w*h));
  const rw=Math.max(2,Math.floor(w*scale)),rh=Math.max(2,Math.floor(h*scale));
  if(rw===width&&rh===height)return false;
  width=rw;height=rh;size.set(rw,rh);
  rtScene.setSize(rw,rh);rtColour.setSize(rw,rh);
  const texel=new THREE.Vector2(1/rw,1/rh);
  compositePass.material.uniforms.uTexel.value.copy(texel);
  fxaaPass.material.uniforms.uTexel.value.copy(texel);
  // Keep the line roughly two device pixels wide whatever we are rendering at.
  compositePass.material.uniforms.uThickness.value=(settings.thickness/1.35)*(1.05+0.55*Math.max(1,scale))*Math.min(1,scale);
  return true;
 }

 return {
  size,state,
  get width(){return width;},
  get height(){return height;},
  resize,
  /**
   * Sets ink/grade uniforms by name, for tuning the look against the actual town
   * rather than against the numbers. Colours are accepted as hex.
   * @param {Record<string,number>} values
   */
  tune(values={}){
   for(const [name,value] of Object.entries(values)){
    const uniform=compositePass.material.uniforms[name];
    if(!uniform)continue;
    if(uniform.value&&uniform.value.isColor)uniform.value.set(value);
    else uniform.value=value;
   }
  },
  /** Time of day still lifts the picture; with tone mapping off the grade carries it. */
  /** Chooses a look by name (looks.js); an unknown name is Natural. */
  setLook(name){state.look=lookFragment(name)?name:'none';},
  setLookFocus({distance=0,range=3,mode='depth'}={}){if(!['depth','tilt'].includes(mode)||!Number.isFinite(distance)||distance<0||distance>2000||!Number.isFinite(range)||range<.1||range>1000)throw Error('Invalid focus distance or range.');state.focusMode=mode==='tilt'?1:0;state.focusDistance=distance;state.focusRange=range;},
  setExposure(value){compositePass.material.uniforms.uExposure.value=value;},
  /** Camera clip planes feed the depth linearisation; re-read them each frame. */
  setCamera(camera){
   if(!camera)return;view=camera;
   compositePass.material.uniforms.uNear.value=camera.near;
   compositePass.material.uniforms.uFar.value=camera.far;
  },
  /**
   * Runs `draw(renderer)` into the offscreen target, then the chain onto the screen.
   * `draw` may render as many times as it likes; multi-pass compositing with
   * autoClear off behaves exactly as it does against the default framebuffer.
   */
  render(draw){
   resize();
   const previousTarget=renderer.getRenderTarget();
   try{
    renderer.setRenderTarget(rtScene);
    renderer.clear();
    // (a modelled character's skin marks itself only here, where this pass reads the mark: SKIN_MARK)
    markSkin(true);
    try{drawWithLookMaterials(renderer,state.look,draw);}finally{markSkin(false);}
    if(view&&lookNormals(state.look))auxiliary.render(draw,width,height);

    // Ink and grade share one draw and one sample of the scene colour. A
    // disabled ink/grade changes uniforms, never the linear -> sRGB conversion.
    compositePass.material.uniforms.uInkEnabled.value=state.ink?1:0;
    compositePass.material.uniforms.uAmount.value=state.grade?1:0;
    compositePass.material.uniforms.tDiffuse.value=rtScene.texture;
    const look=state.look==='none'?null:lookPass(state.look);
    if(look&&state.fxaa){
     if(!rtLook)rtLook=new THREE.WebGLRenderTarget(width,height,{...targetOptions,type:THREE.UnsignedByteType,depthBuffer:false});
     else if(rtLook.width!==width||rtLook.height!==height)rtLook.setSize(width,height);
    }
    renderer.setRenderTarget(state.fxaa||look?rtColour:null);
    compositePass.render(renderer);

    if(state.fxaa){
     fxaaPass.material.uniforms.tDiffuse.value=rtColour.texture;
     renderer.setRenderTarget(look?rtLook:null);
     fxaaPass.render(renderer);
    }
    if(look){
     const u=look.material.uniforms,source=compositePass.material.uniforms;
     u.tDiffuse.value=(state.fxaa?rtLook:rtColour).texture;
     u.uTexel.value.set(1/width,1/height);u.uResolution.value.set(width,height);
     u.uFocusMode.value=state.focusMode;u.uFocusDistance.value=state.focusDistance;u.uFocusRange.value=state.focusRange;u.tNormal.value=auxiliary.target?.texture||null;if(view){u.uProjectionInverse.value.copy(view.projectionMatrixInverse);u.uCameraWorld.value.copy(view.matrixWorld);}
     u.uNear.value=source.uNear.value;u.uFar.value=source.uFar.value;
     renderer.setRenderTarget(null);
     look.render(renderer);
    }
   }finally{
    // A post-process shader or target can fail after the town was drawn. Plain
    // fallback must reach the screen, not the failed pipeline's abandoned target.
    renderer.setRenderTarget(previousTarget);
   }
  },
  /**
   * The Look picker's live pictures (render/look-previews.js). `shrinkPicture(target)` copies the last frame's graded
   * picture, before any look, into a small target; `renderLookPreview(name, source, target)` then draws that picture
   * in one look, with the frame's own depth, into another small target. The look's pass is the one the town is drawn
   * with (compiled on first use, as when the look is chosen), so a preview is that look, not an imitation of it. False
   * when there is no fresh picture to draw from.
   */
  shrinkPicture(target){
   // The graded picture is kept in rtColour whenever anything follows the grade (FXAA or a look).
   if(!width||!(state.fxaa||state.look!=='none'))return false;
   shrinkPass??=makeQuad(SHRINK_FRAGMENT,{tDiffuse:{value:null},uStep:{value:new THREE.Vector2()}});
   const previous=renderer.getRenderTarget();
   try{
    shrinkPass.material.uniforms.tDiffuse.value=rtColour.texture;
    shrinkPass.material.uniforms.uStep.value.set(1/target.width/4,1/target.height/4);
    renderer.setRenderTarget(target);shrinkPass.render(renderer);
   }finally{renderer.setRenderTarget(previous);}
   return true;
  },
  renderLookPreview(name,source,target){
   const pass=lookPass(name);if(!pass)return false;
   const previous=renderer.getRenderTarget();
   try{
    const u=pass.material.uniforms,live=compositePass.material.uniforms;
    // Every uniform the live frame sets is set here too, and set back by the next live frame.
    u.tDiffuse.value=source.texture;
    u.uTexel.value.set(1/target.width,1/target.height);u.uResolution.value.set(target.width,target.height);
    u.uFocusMode.value=state.focusMode;u.uFocusDistance.value=state.focusDistance;u.uFocusRange.value=state.focusRange;
    // Normals are drawn only for a look that uses them; for any other they would be an old frame's, so none.
    u.tNormal.value=lookNormals(state.look)?auxiliary.target?.texture||null:null;
    if(view){u.uProjectionInverse.value.copy(view.projectionMatrixInverse);u.uCameraWorld.value.copy(view.matrixWorld);}
    u.uNear.value=live.uNear.value;u.uFar.value=live.uFar.value;
    renderer.setRenderTarget(target);pass.render(renderer);
   }finally{renderer.setRenderTarget(previous);}
   return true;
  },
  /** The target the town is drawn into: shaders compiled ahead of time are compiled for it (game.js compileTown). */
  get sceneTarget(){return rtScene;},
  dispose(){
   auxiliary.dispose();
   [rtScene,rtColour,rtLook].forEach(rt=>rt?.dispose());
   [compositePass,fxaaPass,shrinkPass,...lookPasses.values()].forEach(p=>p?.dispose());
  }
 };
}
