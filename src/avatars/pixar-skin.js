import * as THREE from '../../vendor/three.module.js';

/**
 * A Pixar body's skin on the town's toon ramp (the creator's brief of 26 October 2026: warm subsurface skin, no muddy
 * shadows, a soft rim): where the texture is skin (found by its colour, as the studio finds it: warm, red over green
 * over blue), the town's cool shadow tint becomes a warm terracotta, the terminator (where light gives way to shadow)
 * runs through a coral band (light under the skin, #e86a48), the ambient light on the side away from the sun keeps
 * its brightness but not its colour (the town's fill comes up blue-grey off the street, and under a chin that reads as
 * bruised: on skin it is a warm peach, uSkinAmbient, its brightness 1; the lit side keeps the town's light, so pale skin
 * stays pale), and a broad soft sheen sits on the nose, the brow and the ears (roughness
 * about 0.55). Over the whole body, skin and clothes, a Fresnel rim (pow(1 - N.V, 3)): warm cream on the sun's side, sky
 * blue on the shadow side, to lift the silhouette off the street.
 */
/** The scene alpha a modelled character's skin writes while the ink pipeline draws the scene into its own target
 *  (markSkin; render/ink-pipeline.js reads it there): opaque surfaces otherwise write 1, and the composite pass writes 1
 *  to the screen, so the mark never shows. A see-through canvas drawn without that pass (Studio's editor, a comic's
 *  panel) gets no mark. */
export const SKIN_MARK=.98;
export function markSkin(on){SKIN_UNIFORMS.uSkinMark.value=on?1:0;}
const SKIN_UNIFORMS=Object.freeze({uSkinShadow:{value:new THREE.Color('#f0b39c')},uSkinTerminator:{value:new THREE.Color('#e06a4b')},
 uSkinAmbient:{value:new THREE.Vector3(1.12,.96,.86)},uRimWarm:{value:new THREE.Color('#fff3d6')},uRimCool:{value:new THREE.Color('#8ab4f8')},
 uRim:{value:.2},uSheen:{value:.07},uSkinMark:{value:0}});
const SKIN_HEAD=`uniform vec3 uSkinShadow,uSkinTerminator,uSkinAmbient,uRimWarm,uRimCool;
uniform float uRim,uSheen,uSkinMark,uHeadY,uHeadR;
uniform vec2 uHeadXZ;
varying vec3 vPixarPos;
float pixarSkinW=0.;
float pixarRamp(float x,float a,float b){return clamp((x-a)/(b-a),0.,1.);}
`;
const CEL_LINE='vec3 irradiance = celBand * mix( uShadowTint, vec3( 1.0 ), celBand ) * directLight.color;';
const SKIN_IRRADIANCE=`float skinDL = dot( geometryNormal, directLight.direction ) * .5 + .5;
	float skinTerm = smoothstep( .36, .5, skinDL ) * ( 1. - smoothstep( .5, .64, skinDL ) );
	vec3 skinTint = mix( mix( uShadowTint, vec3( 1.0 ), celBand ), mix( uSkinShadow, vec3( 1.0 ), celBand ), pixarSkinW );
	skinTint *= mix( vec3( 1.0 ), uSkinTerminator, skinTerm * pixarSkinW * .55 );
	vec3 irradiance = celBand * skinTint * directLight.color;`;
// (after the colour is known: a feature's decal paints it in its own hook, face-features.js)
const SKIN_MASK=`{ vec3 sk = pow( max( diffuseColor.rgb, vec3( 0. ) ), vec3( 1. / 2.2 ) );
	  pixarSkinW = pixarRamp( sk.r, .5, .6 ) * pixarRamp( sk.r - sk.b, .12, .2 ) * pixarRamp( sk.g, .3, .38 ) * pixarRamp( sk.r - sk.g, .09, .16 ); }
	#include <normal_fragment_begin>`;
const SKIN_AMBIENT=`#include <lights_fragment_end>
	{ const vec3 LUMA = vec3( .3, .59, .11 );
	  float skinLit = dot( reflectedLight.indirectDiffuse, LUMA ) / max( dot( diffuseColor.rgb, LUMA ), 1e-3 ), away = 1.;
	  #if NUM_DIR_LIGHTS > 0
	   away = 1. - smoothstep( .35, .75, dot( normal, directionalLights[ 0 ].direction ) * .5 + .5 );
	  #endif
	  reflectedLight.indirectDiffuse = mix( reflectedLight.indirectDiffuse, diffuseColor.rgb * uSkinAmbient * skinLit, pixarSkinW * away ); }`;
const sheenAndRim=rim=>`{ vec3 Vv = normalize( vViewPosition ), Nn = normalize( normal );
	  float fr = pow( 1. - clamp( dot( Nn, Vv ), 0., 1. ), 3. ), sunSide = 0.;
	  #if NUM_DIR_LIGHTS > 0
	   sunSide = dot( Nn, directionalLights[ 0 ].direction );
	   vec3 Hh = normalize( directionalLights[ 0 ].direction + Vv );
	   float prot = uHeadR > 0. ? step( uHeadY, vPixarPos.y ) * smoothstep( uHeadR * .8, uHeadR * 1., length( vPixarPos.xz - uHeadXZ ) ) : 0.;
	   outgoingLight += directionalLights[ 0 ].color * pow( max( dot( Nn, Hh ), 0. ), mix( 28., 64., prot ) ) * uSheen * mix( .8, 2.2, prot ) * pixarSkinW;
	  #endif
	  ${rim?'outgoingLight += mix( uRimCool, uRimWarm, smoothstep( -.25, .35, sunSide ) ) * fr * uRim * ( .6 + .4 * pixarSkinW );':''} }
	#include <opaque_fragment>
	${rim?`gl_FragColor.a = mix( gl_FragColor.a, ${SKIN_MARK.toFixed(4)}, uSkinMark * step( .5, pixarSkinW ) * step( .999, gl_FragColor.a ) );`:''}`;
/** Pixar skin on a cel material. rim: false for a feature's decal, which lies on skin that has it. head: {y, x, z, r},
 * the neck's height, the head's axis and its radius (the card's measures): what stands out of the head beyond its radius
 * (the nose, the ears) takes a sharper, stronger sheen (roughness about .45 against the body's .65: the owner's spec
 * of 26 October 2026, night); without it the sheen is the body's everywhere. */
export function pixarSkin(material,{rim=true,head=null}={}){
 const base=material.onBeforeCompile,baseKey=material.customProgramCacheKey.bind(material);
 const headUniforms={uHeadY:{value:head?.y??0},uHeadR:{value:head?.r??0},uHeadXZ:{value:new THREE.Vector2(head?.x??0,head?.z??0)}};
 material.onBeforeCompile=(shader,renderer)=>{
  base?.call(material,shader,renderer);
  Object.assign(shader.uniforms,SKIN_UNIFORMS,headUniforms);
  // (the position in the body's own frame, after skinning: the head's measures are in it)
  shader.vertexShader=('varying vec3 vPixarPos;\n'+shader.vertexShader).replace('#include <skinning_vertex>','#include <skinning_vertex>\n\tvPixarPos = transformed;');
  let f=SKIN_HEAD+shader.fragmentShader;
  // (the town's cel patch, cel.js, is the irradiance line this replaces; without it the skin keeps the plain ramp)
  if(f.includes(CEL_LINE))f=f.replace(CEL_LINE,SKIN_IRRADIANCE);
  shader.fragmentShader=f.replace('#include <normal_fragment_begin>',SKIN_MASK).replace('#include <lights_fragment_end>',SKIN_AMBIENT)
   .replace('#include <opaque_fragment>',sheenAndRim(rim));
 };
 material.customProgramCacheKey=()=>baseKey()+':pixar-skin-v4'+(rim?'':'-norim')+(head?'-head':'');
 return material;
}
