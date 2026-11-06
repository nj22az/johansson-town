import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';
import {CATALOG} from './catalog-data.js';

/**
 * Johansson World's asset catalogue (briefs/NEXT.md §5; the creator, 2026-10-10: "I would like to build assets in studio
 * and assemble them in world"). Johansson Studio builds an asset, checks it and publishes it into assets/catalog/<id>/:
 * its model (model.glb) and its card (asset.json: what it is, who it is for and why, its colliders, seats, standing spots
 * and anchors). tools/catalog/build-catalog.mjs compiles the cards into catalog-data.js, so a place is built in one go;
 * only the model is downloaded, once, when a place needs it.
 *
 * A place asks for an asset by id and says where it stands:
 *   const chair=placeAsset('massage-chair',{parent:room,x:4.505,z:3.55,yaw:-Math.PI/2,omit:[...]});
 *   colliders.push(...chair.colliders);   // the card's colliders, in the place's frame
 *   chair.seat('seat'), chair.anchor('coin-slot'), chair.spots, chair.facing
 * The loader registers nothing: what the player can do there (labels, actions) stays the place's own. assetPlacement() gives
 * the same numbers without a model (tests, the film's staging check), and loadAsset() fetches the model ahead of time.
 *
 * Frames: an asset is built facing +z with its floor at y = 0 (Studio's modeller); placed, it is turned as three.js turns
 * an object (rotation.y = yaw), so its point (ax, ay, az) is at (x + ax·cos + az·sin, y + ay, z − ax·sin + az·cos).
 * A turn within 1e-4 rad of a right angle is that right angle (the cards write π as 3.1416), and points are kept to the
 * micrometre, so a chair turned a quarter has exactly the colliders and marks a hand-built one had.
 */

const QUARTER=Math.PI/2,SNAP=1e-4;
const round=v=>{const r=Math.round(v*1e6)/1e6;return r===0?0:r;};

/** An angle in (−π, π], a right angle exactly when it is within 1e-4 rad of one. */
export function snapYaw(yaw){
 let a=yaw>-Math.PI&&yaw<=Math.PI?yaw:Math.atan2(Math.sin(yaw),Math.cos(yaw));
 const q=Math.round(a/QUARTER);if(Math.abs(a-q*QUARTER)<SNAP)a=q*QUARTER;
 return a<=-Math.PI+1e-12?Math.PI:a;
}
/** cos and sin of a turn, exact at the right angles. */
function turnOf(yaw){
 const q=Math.round(yaw/QUARTER),right=Math.abs(yaw-q*QUARTER)<1e-12,k=((q%4)+4)%4;
 return right?{cos:[1,0,-1,0][k],sin:[0,1,0,-1][k],right,odd:k%2===1}:{cos:Math.cos(yaw),sin:Math.sin(yaw),right,odd:false};
}

import {catalogIds,catalogCard} from './catalog-cards.js';
export {catalogIds,catalogCard};

/**
 * Where an asset's card puts things once it stands at (x, y, z) turned by `yaw`, without its model: `toPlace([ax,ay,az])`,
 * `facing` (its front in the place's frame), `colliders` (World's {x, z, w, d, height, minY}, with `yaw` only when it is
 * not turned by a right angle, and the asset and part they belong to), `seats` and `spots` (position and stand in the
 * place's frame, their yaw the card's plus the turn), `anchors` (points in the place's frame) and `seat(id)`/`anchor(name)`.
 */
export function assetPlacement(id,{x=0,z=0,y=0,yaw=0}={}){
 const card=catalogCard(id),turn=snapYaw(yaw),{cos,sin}=turnOf(turn);
 const toPlace=([ax,ay,az])=>[round(x+ax*cos+az*sin),round(y+ay),round(z-ax*sin+az*cos)];
 const colliders=card.colliders.map(c=>{
  const [cx,,cz]=toPlace([c.x,0,c.z]),t=snapYaw((c.yaw||0)+turn),r=turnOf(t);
  const out={x:cx,z:cz,w:r.odd?c.d:c.w,d:r.odd?c.w:c.d,height:c.height,minY:round(y+(c.minY||0)),asset:id,part:c.name};
  if(!r.right)out.yaw=t;
  return Object.freeze(out);});
 const seats=card.seats.map(s=>Object.freeze({id:s.id,label:s.label,position:toPlace(s.position),stand:toPlace(s.stand),
  yaw:snapYaw(s.yaw+turn),surfaceY:round(y+s.surfaceY),eyeY:round(y+s.eyeY),front:s.front}));
 const spots=card.spots.map(s=>Object.freeze({id:s.id,kind:s.kind,label:s.label,position:toPlace(s.position),yaw:snapYaw(s.yaw+turn),note:s.note||''}));
 const anchors=Object.freeze(Object.fromEntries(Object.entries(card.anchors).map(([k,p])=>[k,Object.freeze(toPlace(p))])));
 const pick=(list,key,what)=>{const found=list.find(s=>s.id===key);if(!found)throw new Error(`${card.name} has no ${what} ${JSON.stringify(key)}: ${list.map(s=>s.id).join(', ')}`);return found;};
 return {id,card,x,y,z,yaw:turn,toPlace,facing:[round(sin),0,round(cos)],colliders,seats,spots,anchors,
  seat:key=>pick(seats,key,'seat'),spot:key=>pick(spots,key,'spot'),
  anchor(name){if(!Object.hasOwn(anchors,name))throw new Error(`${card.name} has no anchor ${JSON.stringify(name)}: ${Object.keys(anchors).join(', ')}`);return anchors[name];}};
}

// ---- The models: one template per asset, parsed once and copied for every place it stands in. A place built before its
// model arrived waits for it (`waiting`) and is filled in when it does.
const templates=new Map(),loading=new Map(),warned=new Set(),waiting=new Map();

/** True once an asset's model is in hand (loadAsset or provideAsset). */
export const assetLoaded=id=>templates.has(id);

/**
 * Fetches and parses an asset's model, once per id, with a timeout. Resolves true when it is in hand and false when it is
 * not (no page to fetch it in, a network failure, a timeout); never rejects, and a failure is tried again next time.
 */
export function loadAsset(id,{timeout=15000}={}){
 const card=catalogCard(id);
 if(templates.has(id))return Promise.resolve(true);
 if(loading.has(id))return loading.get(id);
 // A page to fetch it in: the room tests and the film's staging check build rooms in Node, with window={} (fixtures.mjs).
 if(typeof window==='undefined'||!window.document||typeof fetch!=='function')return Promise.resolve(false);
 const task=(async()=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
   // The model's hash is in its URL, so a model cached before a new publish is never read with the new card.
   const response=await fetch(assetURL('catalog/'+card.model+'?v='+card.modelSha),{signal:controller.signal});
   if(!response.ok)throw new Error('HTTP '+response.status);
   provideAsset(id,(await new GLTFLoader().parseAsync(await response.arrayBuffer(),'')).scene);
   return true;
  }catch(error){
   if(!warned.has(id)){warned.add(id);console.warn(`${card.name} (${id}) is not available from the catalogue`,error);}
   return false;
  }finally{clearTimeout(timer);}
 })();
 loading.set(id,task);task.finally(()=>{if(loading.get(id)===task)loading.delete(id);});
 return task;
}

/**
 * Takes an asset's model parsed elsewhere (a test reading it from disk, a tool without a page): the scene GLTFLoader
 * made of its model.glb. Its names are put back as Studio wrote them (GLTFLoader writes 'Massage chair back' as
 * 'Massage_chair_back'), so World's code, its tests and the films find the parts by Studio's names; the asset's own node
 * (the one Studio marked extras.asset) is the template. Solid parts cast and take shadows, printed labels only take
 * them, and an unlit glow neither (glTF stores no shadows; this is the rule Studio's hero render uses). Its textures are
 * shared by every copy and marked so (a room's clearing leaves them alone).
 */
export function provideAsset(id,scene){
 const card=catalogCard(id);
 scene.traverse(o=>{if(typeof o.userData?.name==='string')o.name=o.userData.name;});
 let node=null;scene.traverse(o=>{if(!node&&!o.isMesh&&o.userData?.asset===card.name)node=o;});
 if(!node)throw new Error(`${id}'s model has no node for ${card.name} (Studio marks it extras.asset)`);
 if(!node.position.equals(new THREE.Vector3())||!node.quaternion.equals(new THREE.Quaternion())||!node.scale.equals(new THREE.Vector3(1,1,1)))
  throw new Error(`${id}'s model is not at its file's origin: World places it by its card's frame`);
 node.removeFromParent();
 const names=new Set();node.traverse(o=>names.add(o.name));
 const missing=card.parts.map(p=>p.name).filter(n=>!names.has(n));
 if(missing.length)throw new Error(`${id}'s model is missing the parts its card names: ${missing.join(', ')}`);
 node.traverse(o=>{if(!o.isMesh)return;
  const list=Array.isArray(o.material)?o.material:[o.material],glow=list.every(m=>m.isMeshBasicMaterial),printed=list.some(m=>m.map);
  o.castShadow=!glow&&!printed;o.receiveShadow=!glow;
  for(const m of list)for(const key of ['map','emissiveMap','alphaMap','normalMap','roughnessMap','metalnessMap','aoMap'])if(m[key])m[key].userData.sharedAsset=true;});
 node.updateMatrixWorld(true);
 templates.set(id,node);
 const late=[...(waiting.get(id)||[])];waiting.delete(id);for(const fill of late)fill();
}

/**
 * Puts an asset in a place: what assetPlacement() gives, and the model itself under `parent`, at once if it is in hand,
 * else when it arrives (`ready` resolves true then, false if it cannot be had). `omit` names parts or pieces this place
 * draws itself (a room that wires the chair to its own socket leaves out the chair's cord); they are taken out of this
 * copy, not hidden (a raycaster does not care what is hidden), and a name the model does not have throws. Each copy has
 * its own materials, so a room's flags and its cel shading never reach another room; the geometry and the textures are
 * shared. `onModel(object)` runs as the model goes in (a late one too), before anything draws it. `dispose()` takes it
 * out and frees its materials (the room's clearing leaves a shared asset to it).
 */
export function placeAsset(id,{parent=null,x=0,z=0,y=0,yaw=0,omit=[],onModel=null}={}){
 const placement=assetPlacement(id,{x,z,y,yaw}),card=placement.card;
 const object=new THREE.Group();object.name='Catalogue asset '+id;object.userData.asset=id;object.userData.sharedAsset=true;
 object.position.set(x,y,z);object.rotation.y=placement.yaw;parent?.add(object);
 const own=new Set();let loaded=false,disposed=false,settle;
 const ready=new Promise(r=>{settle=r;});
 const fill=()=>{
  if(disposed||loaded)return loaded;
  const copy=templates.get(id).clone(true);
  for(const name of omit){const found=[];copy.traverse(o=>{if(o.name===name)found.push(o);});
   if(!found.length)throw new Error(`${card.name} has no part or piece ${JSON.stringify(name)} to leave out`);
   for(const o of found)o.removeFromParent();}
  const copies=new Map();
  copy.traverse(o=>{if(!o.isMesh)return;
   const swap=m=>{if(!copies.has(m)){const c=m.clone();copies.set(m,c);own.add(c);}return copies.get(m);};
   o.material=Array.isArray(o.material)?o.material.map(swap):swap(o.material);});
  object.add(copy);object.updateMatrixWorld(true);loaded=true;onModel?.(copy);settle(true);return true;};
 // Late: filled in when the model arrives (loadAsset, or provideAsset from a tool); `ready` says how the first try went.
 const late=()=>{try{fill();}catch(error){console.warn(error);settle(false);}};
 if(templates.has(id))fill();
 else{if(!waiting.has(id))waiting.set(id,new Set());waiting.get(id).add(late);loadAsset(id).then(ok=>{if(!ok)settle(false);});}
 return {...placement,object,ready,
  get loaded(){return loaded;},
  /** The part or piece of this copy by its name in Studio (a part's group before its mesh). */
  part(name){return object.getObjectByName(name)||null;},
  dispose(){if(disposed)return;disposed=true;waiting.get(id)?.delete(late);settle(false);object.removeFromParent();
   const drawn=new Set();object.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)drawn.add(m);});
   // the cel-shaded copies the room's pass made of them, and the copies themselves; never the shared textures
   for(const m of new Set([...drawn,...own]))m.dispose();own.clear();}};
}
