import {assetURL} from '../assets.js';
import * as THREE from '../../vendor/three.module.js';
import {applyWorldUV} from './world-uv.js';
import {paintedPaving,paintedAsphalt,paintedConcrete} from './toy-surfaces.js';

const sharedTextures=new Map();
// Paint is a light finish: the old dark stone photograph tinted every wall charcoal
// once physical shading was restored. Fine deterministic grain keeps painted plaster
// readable without baking directional light or large stains into its base colour.
function plasterTexture(){
 const key='painted-plaster';if(sharedTextures.has(key))return sharedTextures.get(key);
 const data=new Uint8Array(128*128*4);let seed=1729;
 for(let i=0;i<data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const value=238+(seed>>>28);data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;}
 const map=new THREE.DataTexture(data,128,128);map.colorSpace=THREE.SRGBColorSpace;
 map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;
 map.userData.sharedAsset=true;map.needsUpdate=true;sharedTextures.set(key,map);return map;
}
const EXTRA_SURFACES={
  // Concrete is painted too (toy-surfaces.js): the OpenGameArt photograph read as a real quay.
  concrete:{painted:paintedConcrete,roughness:.95},
  // Crazy paving is painted (toy-surfaces.js), not the photograph: pale stones and grout.
  paving:{painted:paintedPaving,roughness:1},
  // Asphalt is painted too: the photograph read as a real road under a toy town.
  asphalt:{painted:paintedAsphalt,roughness:.9},
  bamboo:{map:'materials/oga-bamboo.jpg',normal:'materials/oga-bamboo-normal.jpg',roughness:.84}
};

export function createMaterials({mobile=false,anisotropy=4}={}) {
  const textures=sharedTextures,materials=new Map(),loader=new THREE.TextureLoader();
  function texture(path,colour=false){if(textures.has(path))return textures.get(path);const t=loader.load(assetURL(path),undefined,undefined,()=>{});t.userData.sharedAsset=true;t.colorSpace=colour?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(anisotropy,mobile?2:8);textures.set(path,t);return t;}
  function material(kind='plaster',colour=0xffffff){
    const id=kind+'/'+colour;if(materials.has(id))return materials.get(id);
    const extra=EXTRA_SURFACES[kind];let m;
    if(extra){
      const map=extra.painted?extra.painted():texture(extra.map,true);
      m=new THREE.MeshStandardMaterial({color:colour,map,roughness:extra.roughness,metalness:0,dithering:true});
      if(extra.normal){m.normalMap=texture(extra.normal);m.normalScale=new THREE.Vector2(.35,.35);}
      // Small height inference for photographs without a supplied normal map.
      if(extra.bump){m.bumpMap=map;m.bumpScale=extra.bump;}
    }else{
      const map=kind==='plaster'?plasterTexture():texture(kind+'.jpg',true),normalMap=texture('materials/'+kind+'-nor_gl.jpg'),arm=texture('materials/'+kind+'-arm.jpg');
      m=new THREE.MeshStandardMaterial({color:colour,map,normalMap,normalScale:new THREE.Vector2(kind==='plaster'?.16:.4,kind==='plaster'?.16:.4),roughnessMap:arm,aoMap:arm,aoMapIntensity:.45,roughness:.94,metalness:0,dithering:true});
    }
    // Architecture keeps normal, roughness and occlusion detail; residents and
    // signage retain their illustrated treatment through the separate cel pass.
    m.userData.keepPhysical=true;
    materials.set(id,m);return m;
  }
  function worldMaterial(kind,colour=0xffffff,metres=2){
    const id='world/'+kind+'/'+colour+'/'+metres;
    if(!materials.has(id))materials.set(id,applyWorldUV(material(kind,colour).clone(),metres));
    return materials.get(id);
  }
  return {material,worldMaterial,texture};
}
