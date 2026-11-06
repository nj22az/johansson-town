import * as THREE from '../../../vendor/three.module.js';
import {getLabelMaterial,flavourShift} from './store-advertising.js';
import {flavourCount,FLAVOURS} from '../../commerce/flavours.js';
import {STORE_BRANDS} from '../../commerce/brands.js';

/**
 * Flavours on the shelf, at no extra draw.
 *
 * Every pack of a line shares one instanced mesh. Each instance carries a shift for its
 * printed UVs, and the shift points at that flavour's cell in the right half of the
 * packaging atlas (store-advertising.js). So a shelf of crisps reads as a maker's
 * range -- lightly salted, nori, consommé -- in the one draw it always cost.
 */
let material=null;
export function shelfArtMaterial(){
 if(!material){
  material=getLabelMaterial().clone();material.name='Sakura shelf packaging (flavours)';
  material.onBeforeCompile=shader=>{
   shader.vertexShader=shader.vertexShader
    .replace('#include <common>','#include <common>\nattribute vec2 atlasShift;')
    .replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\n vMapUv+=atlasShift;\n#endif');
  };
  material.customProgramCacheKey=()=>'sakura-atlas-shift';
 }
 // The texture is the shared atlas, which repaints itself as its printed overlays arrive.
 material.map=getLabelMaterial().map;
 return material;
}

/** A copy of a pack's print with a per-instance flavour shift, all on the original to start. */
export function flavouredArt(art,count){
 const geometry=art.clone();
 geometry.setAttribute('atlasShift',new THREE.InstancedBufferAttribute(new Float32Array(count*2),2));
 return geometry;
}

/**
 * Which flavour stands in a column: the board is split into even runs left to right,
 * the original first, as a konbini faces a range.
 */
export const flavourForColumn=(id,column,columns)=>Math.min(flavourCount(id)-1,Math.floor(column*flavourCount(id)/Math.max(1,columns)));

export function setFlavour(geometry,slot,id,k){
 const [du,dv]=flavourShift(id,k),a=geometry.attributes.atlasShift;
 a.setXY(slot,du,dv);a.needsUpdate=true;
}

/**
 * The body colour for flavour k, as a per-instance multiplier on the pack's own colours:
 * the wrapper's paper turned by the same hue as its print, so bag and label agree.
 */
const tints=new Map();
export function flavourTint(id,k){
 const key=id+':'+k;if(tints.has(key))return tints.get(key);
 const hue=k>0?FLAVOURS[id]?.[k-1]?.[1]:null,brand=STORE_BRANDS[id==='bun'?'buns':id];
 let tint=new THREE.Color(1,1,1);
 if(hue!=null&&brand){
  const base=new THREE.Color(brand.paper),turned=base.clone(),[r,g,b]=[base.r,base.g,base.b];
  // Turn the hue in display space, then compare in the working space the vertices use.
  const hsl={};new THREE.Color(brand.paper).getHSL(hsl,THREE.SRGBColorSpace);
  turned.setHSL(((hsl.h+hue/360)%1+1)%1,hsl.s,hsl.l,THREE.SRGBColorSpace);
  tint=new THREE.Color(...[[turned.r,r],[turned.g,g],[turned.b,b]].map(([t,o])=>Math.min(4,t/Math.max(.02,o))));
 }
 tints.set(key,tint);return tint;
}
