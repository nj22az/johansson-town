import {EquirectangularReflectionMapping} from '../../vendor/three.module.js';
import {RGBELoader} from '../../vendor/RGBELoader.js';
import {assetURL} from '../assets.js';

// Lighting/reflections only: the photographed modern surroundings never become scenery.
// Failure leaves the existing hemisphere/sun setup playable.
export async function loadTownEnvironment(scene,renderer){
 if(!renderer.isWebGLRenderer)return false;
 try{
  const texture=await new RGBELoader().loadAsync(assetURL('lighting/industrial_sunset_02_1k.hdr'));
  texture.mapping=EquirectangularReflectionMapping;scene.environment=texture;scene.environmentIntensity=.32;scene.environmentRotation.y=.8;
  return true;
 }catch(error){console.warn('Using town light fallback:',error.message);return false;}
}
