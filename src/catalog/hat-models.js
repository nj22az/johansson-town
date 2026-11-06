import {assetURL} from '../assets.js';
import {catalogCard} from './catalog-cards.js';
import {assetHatIds,provideHatModel,hatModelLoaded} from '../avatars/hat-assets.js';

/**
 * The models of the hats people wear (src/avatars/hat-assets.js ASSET_HATS: Johansson's trucker cap), fetched from World's asset
 * catalogue and handed to the avatar code, which reads them itself so a body is still built in one go. A page that
 * builds people fetches them first: the game's boot (src/boot.js), the resident guide's portraits, the comic feed and
 * Johansson Studio (avatar-creator/studio.js). Until a model is in hand its wearers wear its stand-in (the procedural cap),
 * never a bare head.
 *
 * Each model is fetched once per page, with its card's hash in its URL (a cached model never meets a newer card); a
 * failure (offline, a timeout) is warned once and tried again on the next call. Resolves true when every hat asked for
 * is in hand; never rejects.
 */
const loading=new Map(),warned=new Set();

export function loadHatModels(ids=assetHatIds(),{timeout=15000,onProgress=()=>{}}={}){
 let done=0,failed=0;onProgress(done,ids.length,failed);
 return Promise.all(ids.map(id=>loadHatModel(id,timeout).then(ok=>{if(!ok)failed++;onProgress(++done,ids.length,failed);return ok;}))).then(all=>all.every(Boolean));
}

function loadHatModel(id,timeout){
 if(hatModelLoaded(id))return Promise.resolve(true);
 if(loading.has(id))return loading.get(id);
 if(typeof fetch!=='function'||typeof document==='undefined')return Promise.resolve(false);
 const card=catalogCard(id);
 const task=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
   const response=await fetch(assetURL('catalog/'+card.model+'?v='+card.modelSha),{signal:controller.signal});
   if(!response.ok)throw new Error('HTTP '+response.status);
   provideHatModel(id,await response.arrayBuffer());
   return true;
  }catch(error){
   if(!warned.has(id)){warned.add(id);console.warn(`${card.name} (${id}) is not available from the catalogue: its wearers wear the stand-in`,error);}
   return false;
  }finally{clearTimeout(timer);}
 })();
 loading.set(id,task);task.finally(()=>{if(loading.get(id)===task)loading.delete(id);});
 return task;
}
