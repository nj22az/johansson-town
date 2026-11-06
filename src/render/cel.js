import * as THREE from '../../vendor/three.module.js';
import {applyWorldUV} from './world-uv.js';

/**
 * Cel shading, applied to a town that was not built for it.
 *
 * Sakura Crossing (Kenton-GMI, MIT) gets its hand-painted look by building every
 * object out of MeshToonMaterial from the start. Johansson Town has a hundred and
 * twenty-odd MeshStandardMaterial call sites across fifty files, and districts that
 * stream in long after the first frame — so the conversion happens here instead, as
 * a pass over the scene graph. Anything that arrives later is converted when it
 * arrives, and nothing in src/world/ has to know about any of it.
 *
 * Two things carry the look. A quantised ramp steps direct sun into flat bands, and
 * a patch to the toon BRDF tints the darker bands toward a cool violet instead of
 * just darkening the base colour. That hue shift in shadow is the difference between
 * "anime cel" and "low-poly 3D": an anime background has coloured shadows, not dark
 * ones.
 */

/** Grey stops for the gradient ramp. 255 is full sun; the rest are shadow steps. */
const RAMPS={
 2:[96,255],
 3:[92,178,255],
 4:[80,142,202,255],
 // High-key ramps for pale masses — blossom, plaster, paper lanterns — which have
 // to stay light on their shadow side or they read as dirty rather than white.
 soft:[180,255],
 soft3:[172,214,255]
};

const rampCache=new Map();

/** @param {number|'soft'|'soft3'} bands */
export function gradientMap(bands=3){
 if(rampCache.has(bands))return rampCache.get(bands);
 const stops=RAMPS[bands]||RAMPS[3],data=new Uint8Array(stops.length*4);
 for(let i=0;i<stops.length;i++){data[i*4]=data[i*4+1]=data[i*4+2]=stops[i];data[i*4+3]=255;}
 const texture=new THREE.DataTexture(data,stops.length,1,THREE.RGBAFormat);
 texture.minFilter=texture.magFilter=THREE.NearestFilter;
 texture.generateMipmaps=false;texture.needsUpdate=true;
 rampCache.set(bands,texture);
 return texture;
}

const TOON_CHUNK='lights_toon_pars_fragment';
const TOON_LINE='vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;';
const TOON_PATCH=`
	vec3 celBand = getGradientIrradiance( geometryNormal, directLight.direction );
	vec3 irradiance = celBand * mix( uShadowTint, vec3( 1.0 ), celBand ) * directLight.color;`;

// Probed once. A three.js upgrade that rewrites the chunk leaves the ramp working
// and only drops the hue shift, rather than throwing on load.
let patchedChunk='';
{
 const source=THREE.ShaderChunk[TOON_CHUNK];
 if(source&&source.includes(TOON_LINE))patchedChunk='uniform vec3 uShadowTint;\n'+source.replace(TOON_LINE,TOON_PATCH);
}
export const shadowTintAvailable=()=>!!patchedChunk;

/**
 * Pulls a photographic map toward flat colour.
 *
 * Sakura Crossing has no image assets at all — every surface is a flat painted mass,
 * which is why it reads as a background painting. This town is built on photographed
 * concrete, paving and timber, and a photograph under a three-band ramp reads as a
 * muddy photograph rather than as paint. Mixing the sampled texel back toward white
 * lets the material's own colour carry the surface and leaves the photograph as
 * grain, which is roughly what an animator would paint in.
 */
const MAP_CHUNK='map_fragment';
const MAP_LINE='diffuseColor *= sampledDiffuseColor;';
const MAP_PATCH='diffuseColor.rgb *= mix( vec3( 1.0 ), sampledDiffuseColor.rgb, uFlatten );\n\tdiffuseColor.a *= sampledDiffuseColor.a;';
/**
 * Note the split: map_fragment is included inside main(), so the uniform cannot be
 * declared alongside the body the way the shadow tint declares its own. That one gets
 * away with it because lights_toon_pars_fragment is a "_pars_" chunk and those are at
 * global scope. Putting a uniform in map_fragment compiles to
 * "'uniform': only allowed at global scope", the whole fragment shader fails, and
 * every textured surface silently renders as flat colour — which looks exactly like a
 * grade pushed too far rather than like a broken shader.
 */
const FLATTEN_UNIFORM='uniform float uFlatten;\n';
let flattenChunk='';
{
 const source=THREE.ShaderChunk[MAP_CHUNK];
 if(source&&source.includes(MAP_LINE))flattenChunk=source.replace(MAP_LINE,MAP_PATCH);
}
export const flattenAvailable=()=>!!flattenChunk;

/**
 * Lamps that stop at walls, for a room that asks for it (a material whose userData has
 * `lampsStopAtWalls`). The toon ramp gives a surface facing away from a light its darkest
 * band rather than nothing (a pale plaster wall two thirds of it), which is the soft
 * wrap the sun wants outdoors; but indoors, where rooms share a wall, it lets a point
 * light shine on the far side of the wall it hangs behind: the lobby's bulb on the women's
 * side of the noren wall, the porch lamp on the inside of the street wall. For those
 * materials a point light lights only the faces turned towards it. The sun and the sky
 * keep their wrap; everything that does not ask is untouched.
 */
const LIGHTS_CHUNK='lights_fragment_begin';
const POINT_LINE='getPointLightInfo( pointLight, geometryPosition, directLight );';
let wallChunk='';
{
 const source=THREE.ShaderChunk[LIGHTS_CHUNK];
 if(source&&source.includes(POINT_LINE))wallChunk=source.replace(POINT_LINE,POINT_LINE+'\n\t\tdirectLight.color *= step( 0.0, dot( geometryNormal, directLight.direction ) );');
}
export const wallsStopLampsAvailable=()=>!!wallChunk;

/**
 * How much of a photographic map survives. 1 keeps it whole, 0 removes it.
 *
 * Sakura Crossing can flatten everything because it has no photographs to flatten.
 * This town's identity is in its materials — the crazy paving, the timber, the
 * harbour concrete — and pushing them far toward flat colour turns the whole street
 * into one khaki mass with no way to tell a boardwalk from a road. So this is a
 * light touch: enough to take the photographic contrast down to something a ramp can
 * band cleanly, not enough to throw the surfaces away.
 */
export const FLATTEN=0.65;

/**
 * True for a map that is a photographed surface rather than something drawn.
 *
 * Signage, price strips and posters are CanvasTextures carrying text that has to stay
 * readable, and they never come with a normal or roughness map. A full PBR texture
 * set is the tell for the photographic ground and wall materials, which are the ones
 * worth flattening.
 */
export function photographic(material){
 return !!(material.normalMap||material.roughnessMap||material.bumpMap||material.aoMap);
}

/**
 * Applies both fragment patches in one compile hook. Tinting the shadow bands toward
 * a cool hue is what separates "anime cel" from "low-poly 3D"; flattening the map is
 * what separates "painted" from "photographed".
 */
export function applyShadowTint(material,tint,flatten=1,{base=null,baseKey=''}={}){
 const tinting=!!patchedChunk;
 const flattening=!!flattenChunk&&flatten<1&&!!material.map;
 const walled=!!wallChunk&&material.userData?.lampsStopAtWalls===true;
 if(!tinting&&!flattening&&!base&&!walled)return material;
 const tintUniform={value:new THREE.Color(tint)};
 const flattenUniform={value:flatten};
 material.userData.shadowTint=tintUniform;
 material.userData.flatten=flattenUniform;
 material.onBeforeCompile=(shader,renderer)=>{
  // The source material's own hook runs first and must not be lost. The town's
  // architectural surfaces get their UVs from a box projection in the vertex
  // shader rather than from the geometry, so dropping that hook leaves every wall
  // and every stretch of paving sampling a single texel of its texture — which
  // looks exactly like a flat colour, and is very easy to mistake for a grade
  // that has gone too far.
  base?.(shader,renderer);
  if(tinting){
   shader.uniforms.uShadowTint=tintUniform;
   shader.fragmentShader=shader.fragmentShader.replace('#include <'+TOON_CHUNK+'>',patchedChunk);
  }
  if(flattening){
   shader.uniforms.uFlatten=flattenUniform;
   shader.fragmentShader=FLATTEN_UNIFORM+shader.fragmentShader.replace('#include <'+MAP_CHUNK+'>',flattenChunk);
  }
  if(walled)shader.fragmentShader=shader.fragmentShader.replace('#include <'+LIGHTS_CHUNK+'>',wallChunk);
 };
 // Without this every patched material compiles its own program. The base key has
 // to be in here too, or a world-projected surface shares a program with a plain one.
 const hex=new THREE.Color(tint).getHexString();
 material.customProgramCacheKey=()=>'cel_'+hex+'_'+(flattening?flatten:1)+'_'+baseKey+(walled?'_walls':'');
 return material;
}

export const DEFAULT_TINT=0x6c5f8c;
/** Above this relative luminance a colour is treated as a pale mass. */
const PALE=0.66;

/** Rough perceptual luminance of a material's base colour, 0..1. */
export function luminance(color){
 return color?color.r*0.2126+color.g*0.7152+color.b*0.0722:0;
}

/**
 * How many bands a surface should get. Pale things keep a high-key ramp so plaster
 * and blossom do not go grey the moment the sun leaves them; everything else gets
 * three steps, which is what a background painter would actually use.
 */
export function bandsFor(material){
 return luminance(material.color)>=PALE?'soft3':3;
}

/**
 * True for a material that should keep its physical shading.
 *
 * Animated residents use the same ramp as the town. Skinning is a vertex-stage
 * operation supported by MeshToonMaterial; it is not a reason to bypass the look.
 * Glass and explicitly protected effects retain their physical shading.
 */
export function keepsPhysical(material){
 if(material.userData?.keepPhysical!==true)return false;
 // Architecture used to be tagged keepPhysical wholesale, which left every wall, roof
 // and frontage physically lit beside toon props: two renderers in one picture
 // (docs/AMPLIFY-AUDIT.md, A1). Now the tag only holds for see-through glass, and for
 // anything that insists with keepPhysicalStrict. Everything else joins the ramp.
 if(material.userData.keepPhysicalStrict===true)return true;
 return !!material.transparent&&(material.opacity??1)<.95;
}

/**
 * How much of a photographed architectural map survives under the ramp. Walls and
 * roofs are big, flat masses: at FLATTEN the photograph still reads as a photograph
 * across a whole facade, so architecture keeps only a ghost of it as grain.
 */
export const ARCH_FLATTEN=0.3;

const converted=new WeakMap();

/**
 * MeshStandardMaterial -> MeshToonMaterial, carrying across everything toon can
 * still honour. Roughness, metalness and the normal/AO/roughness maps have no
 * meaning under a ramp and are dropped on purpose.
 */
export function celFrom(material,{tint=DEFAULT_TINT,bands=null}={}){
 if(converted.has(material))return converted.get(material);
 const toon=new THREE.MeshToonMaterial({
  color:material.color?material.color.clone():new THREE.Color(0xffffff),
  map:material.map||null,
  alphaMap:material.alphaMap||null,
  gradientMap:gradientMap(bands??bandsFor(material)),
  transparent:material.transparent,
  opacity:material.opacity,
  side:material.side,
  alphaTest:material.alphaTest,
  fog:material.fog,
  vertexColors:material.vertexColors,
  emissive:material.emissive?material.emissive.clone():new THREE.Color(0x000000),
  emissiveMap:material.emissiveMap||null,
  emissiveIntensity:material.emissiveIntensity??1,
 });
 // flatShading is deliberately not carried across. MeshToonMaterial has no such
 // property, and passing it made three.js warn once per material — four hundred
 // lines of console on a cold load, enough to bury a real message in it.
 
 toon.depthWrite=material.depthWrite;
 toon.depthTest=material.depthTest;
 // Closed room slabs choose their exterior face for shadow casting. Losing that
 // choice makes their interior faces self-shadow after conversion.
 toon.shadowSide=material.shadowSide;
 // A flush decal -- a board seam, a painted line -- relies on a polygon offset to win
 // the depth test against the surface it is painted on. Dropping the offset here put
 // the decal back in the same plane as its host and left the two flickering against
 // each other, which is the one thing the offset exists to prevent.
 toon.polygonOffset=material.polygonOffset;
 toon.polygonOffsetFactor=material.polygonOffsetFactor;
 toon.polygonOffsetUnits=material.polygonOffsetUnits;
 toon.name=material.name;
 toon.userData={...material.userData};
 // The source material is kept for the lamps' and windows' glow (world/town.js), but not as JSON: Material.copy
 // deep-copies userData through JSON.stringify, which serialised the source and PNG-encoded every texture it holds
 // (canvas.toDataURL) on every clone of a cel material. Sakura's window stand-in spent about 15 s there.
 Object.defineProperty(toon.userData,'celFrom',{value:material,enumerable:false,writable:true,configurable:true});
 // The town's architectural surfaces take their UVs from a box projection in the
 // vertex shader, not from the geometry, and that lives in an onBeforeCompile hook.
 // Re-apply it from the scale the material records rather than inheriting the hook:
 // some of these materials are clones, and Material.copy carries userData across but
 // not onBeforeCompile, so an inherited hook is missing exactly where it is needed.
 const metres=material.userData?.worldTextureScale;
 if(Number.isFinite(metres))applyWorldUV(toon,metres);
 const base=typeof toon.onBeforeCompile==='function'?toon.onBeforeCompile:null;
 const baseKey=Number.isFinite(metres)?'worlduv'+metres:'';
 const architectural=material.userData?.keepPhysical===true;
 applyShadowTint(toon,tint,photographic(material)?(architectural?ARCH_FLATTEN:FLATTEN):1,{base,baseKey});
 converted.set(material,toon);
 linkLive(material,toon);
 return toon;
}

/**
 * Keeps the original material steering what is drawn. Lots of the town holds on to the
 * material it built and turns its glow up at dusk (window panes, lamps, nameplates), but
 * the mesh now draws the toon copy, so those updates went nowhere and the town's windows
 * stayed dark all night. The two now share one emissive colour, and the original's
 * emissiveIntensity, opacity and visibility are forwarded to the copy.
 */
function linkLive(material,toon){
 if(material.emissive&&material.emissive.isColor)toon.emissive=material.emissive;
 for(const key of ['emissiveIntensity','opacity','visible']){
  let own=material[key];
  try{
   Object.defineProperty(material,key,{configurable:true,enumerable:true,
    get(){return own;},
    set(value){own=value;toon[key]=value;if(key==='opacity')toon.needsUpdate=toon.needsUpdate;}});
  }catch{}
 }
}

/** Materials this pass should leave exactly as they are. */
function skip(material,skinned){
 if(!material)return true;
 if(material.isMeshToonMaterial)return true;
 // Basic materials are already the "flat colour" the look wants: sky, glass,
 // glowing panels, the map. Lines and sprites have no lighting to quantise.
 if(!material.isMeshStandardMaterial&&!material.isMeshPhongMaterial&&!material.isMeshLambertMaterial)return true;
 return keepsPhysical(material,{skinned});
}

/**
 * Walks a subtree and cel-shades it. Safe to call repeatedly on the same objects:
 * conversions are memoised per source material, and an object is only visited once
 * unless `force` is set, so the streaming districts can call it on arrival.
 *
 * @returns {{converted:number,skipped:number,visited:number}}
 */
export function applyCelShading(root,{tint=DEFAULT_TINT,seen=null,force=false,collect=null}={}){
 const stats={converted:0,skipped:0,visited:0};
 if(!root)return stats;
 root.traverse(object=>{
  if(!object.isMesh&&!object.isPoints&&!object.isLine)return;
  if(!force&&seen){if(seen.has(object))return;seen.add(object);}
  stats.visited++;
  const skinned=!!object.isSkinnedMesh;
  const swap=material=>{
   if(skip(material,skinned)){stats.skipped++;return material;}
   stats.converted++;
   const toon=celFrom(material,{tint});
   if(collect&&toon.userData.flatten)collect.add(toon.userData.flatten);
   return toon;
  };
  object.material=Array.isArray(object.material)?object.material.map(swap):swap(object.material);
 });
 return stats;
}

/**
 * Keeps the whole scene cel-shaded as districts stream in, without re-walking
 * geometry it has already converted.
 */
export function createCelPass({tint=DEFAULT_TINT}={}){
 const seen=new WeakSet();
 const flattened=new Set();
 // Each map's own amount (FLATTEN, ARCH_FLATTEN …) before any scale, so a look can take the maps away and give them back.
 const natural=new WeakMap();
 let scale=1;
 function scaleFlatten(k){
  scale=k;
  for(const uniform of flattened){if(!natural.has(uniform))natural.set(uniform,uniform.value);uniform.value=natural.get(uniform)*k;}
  return k;
 }
 const stats={converted:0,skipped:0,visited:0,sweeps:0};
 return {
  stats,
  /**
   * Resets how much of the photographic maps survives, on every material already
   * converted and on everything converted after. Each surface family reads
   * differently under this, so it is worth being able to judge it against the town.
   */
  setFlatten(value){
   for(const uniform of flattened){uniform.value=value;natural.set(uniform,value);}
   if(scale!==1)scaleFlatten(scale);
   return value;
  },
  /**
   * Scales every photographic map's own amount: 0 takes them all away (flat colour, the Cartoon look), 1 puts each back as
   * it was. Materials converted later take the same scale.
   */
  scaleFlatten,
  apply(root){
   const pass=applyCelShading(root,{tint,seen,collect:flattened});
   stats.converted+=pass.converted;stats.skipped+=pass.skipped;stats.visited+=pass.visited;
   stats.sweeps++;
   if(scale!==1&&pass.converted)scaleFlatten(scale);
   return pass;
  }
 };
}
