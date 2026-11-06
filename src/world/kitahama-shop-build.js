import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';
import {GROUND_CLASSES} from './ground-standard.js';
import {registerDetail} from './detail-stream.js';
import {WORLD,BUILDING,FIXTURES,OUTSIDE,OPENINGS,SHOP,HOURS,kitahamaShopOpen} from './okinawa/kitahama-shop.js';
import {kitahamaShopFrontage} from './interiors/kitahama-shop-room.js';

/**
 * Johansson Mart, Kitahama, on the island: the two Blender models (tools/blender/build-kitahama-shop.py, from
 * okinawa/kitahama-shop.js) placed unrotated at their corner, on the concrete of the north block's shop apron
 * (lots.js 'shop-apron', ground-plan-quarters.js KITAHAMA_PADS).
 *
 * Batch 1 of bringing it in (the owner, 27 October 2026: "So bring the new shop to the island?"): the building stands, the
 * inside shows through the glass, and it is solid. Walking in is batch 2, Grandmother Higa behind the till batch 3
 * (briefs/HANDOFF-KITAHAMA-SHOP-2026-10-27.md); until then the door is shut and says when it opens.
 *
 * Streamed in near the player like the other model buildings (detail-stream.js); until it has loaded, a cream stand-in
 * the size of the walls holds the corner, so nothing is ever seen standing in a hole.
 */
export const SHOP_PAD_TOP=GROUND_CLASSES['coral-sand'].raisedTop;
const [OU,OV]=BUILDING.outside;
/** Local (u, v) on the island. */
const at=(u,v)=>[WORLD[0]+u,WORLD[1]+v];
const centre=(f,pad=0)=>{const [x,z]=at((f.min[0]+f.max[0])/2,(f.min[1]+f.max[1])/2);
 return {x,z,w:f.max[0]-f.min[0]+pad,d:f.max[1]-f.min[1]+pad,height:f.max[2]};};

/** What is solid outside: the walls (the shop is shut until batch 2), the machines, the bins, the A-board, the condensers. */
export function kitahamaShopColliders(){
 const [x,z]=at(OU/2,OV/2);
 // Named, as the police station's is: the shop stands on the old 5 Kitahama plot by the owner's word (27 October 2026).
 const out=[{x,z,w:OU,d:OV,height:BUILDING.parapetTop,id:'johansson-mart',kitahamaShop:'walls'}];
 for(const id of ['X1','X2','X7','X3']){const f=OUTSIDE.find(o=>o.id===id);out.push({...centre(f),id:'johansson-mart-'+id,kitahamaShop:id});}
 return out;
}

const cache=new Map();let loading=null;
/** Both models, loaded once and shared by the street and the room. */
export async function loadKitahamaShopModels(){
 if(cache.size===2)return true;
 loading??=(async()=>{
  const loader=new GLTFLoader();
  for(const part of ['exterior','interior']){
   const response=await fetch(assetURL('models/kitahama-shop/kitahama-shop-'+part+'.glb'));
   if(!response.ok)throw Error('kitahama-shop-'+part+'.glb: '+response.status);
   const scene=(await loader.parseAsync(await response.arrayBuffer(),'')).scene;
   scene.traverse(o=>{
    if(!o.isMesh)return;
    const glass=/glass/i.test(o.material?.name||'');
    // Glass is seen through, both ways, and writes no depth, so the shop behind it is not cut away.
    if(glass){o.material.transparent=true;o.material.depthWrite=false;o.material.side=THREE.DoubleSide;o.renderOrder=2;o.castShadow=false;o.receiveShadow=false;o.userData.clearWindow=true;}
    else{o.castShadow=true;o.receiveShadow=true;}
   });
   cache.set(part,scene);
  }
  return true;
 })().catch(e=>{console.warn('Johansson Mart models unavailable',e);loading=null;return false;});
 return loading;
}

/** A copy of one loaded model, for the room (null until loaded). */
export function kitahamaShopModel(part){const m=cache.get(part);if(!m)return null;const c=m.clone(true);c.name='Johansson Mart '+part;c.userData.sharedAsset=true;return c;}

export function buildKitahamaShop({world,group=world.group,register,onAction,enter,sites,shadows=false}){
 let minutes=0;
 const root=new THREE.Group();root.name='Johansson Mart, Kitahama';
 root.position.set(WORLD[0],SHOP_PAD_TOP,WORLD[1]);root.userData.placeId='kitahama-shop';group.add(root);
 // The stand-in: the walls' size, in the render's cream, until the models are in.
 const standIn=new THREE.Mesh(new THREE.BoxGeometry(OU,BUILDING.parapetTop,OV),new THREE.MeshStandardMaterial({color:0xefe6d2,roughness:.9}));
 standIn.name='Johansson Mart stand-in';standIn.position.set(OU/2,BUILDING.parapetTop/2,OV/2);standIn.castShadow=shadows;root.add(standIn);
 (world.colliders??=[]).push(...kitahamaShopColliders());
 let built=false;
 const place=()=>{
  if(built||cache.size<2)return built;
  for(const part of ['exterior','interior']){const m=cache.get(part).clone(true);m.name='Johansson Mart '+part;m.userData.sharedAsset=true;root.add(m);}
  standIn.removeFromParent();standIn.geometry.dispose();standIn.material.dispose();built=true;return true;
 };
 registerDetail(world,{id:'kitahama-shop',priority:1,x:WORLD[0]+OU/2,z:WORLD[1]+OV/2,radius:60,load:async()=>(await loadKitahamaShopModels())&&place()});
 // What can be read from the street: the hours on the door, and the machines.
 const anchor=(u,v,h,label,fn)=>{const a=new THREE.Object3D();const [x,z]=at(u,v);a.position.set(x,SHOP_PAD_TOP+h,z);a.userData.placeId='kitahama-shop';group.add(a);register?.(a,label,fn);};
 const door=OPENINGS.find(o=>o.id==='D1'),[dx,dz]=at((door.from+door.to)/2,0);
 // The shop as a place you go into (game.js roomShell 'kitahama-shop'): its door on the lane, its front glazing on the
 // real street (interiors/kitahama-shop-room.js).
 const site={id:'kitahama-shop',title:SHOP.name,jp:SHOP.jp+' '+SHOP.branch,sub:'CORNER SHOP · KITAHAMA',color:0x2e7a4e,accent:'#2e7a4e',
  line:'Grandmother Higa’s corner shop · '+HOURS.signEnglish,opens:'17:30',x:dx,z:dz,
  // On the forecourt, a stride clear of the glass (the walls' collider starts at the glass), so you come out onto it.
  door:[dx,0,dz-.45],exitPosition:[dx,0,dz-.45],approachPosition:[dx,0,dz-1.2],entryFacing:Math.PI,
  streetFrontage:kitahamaShopFrontage(WORLD,SHOP_PAD_TOP)};
 sites?.push(site);
 anchor((door.from+door.to)/2,-.5,1.3,'Go into Johansson Mart',()=>{
  if(kitahamaShopOpen(minutes))return enter?.(site);
  onAction?.('read',SHOP.name+' · '+SHOP.branchEnglish,'The hours on the door: '+HOURS.signEnglish+'\n\nShut. Grandmother Higa keeps the till here when Sakura is shut: weekday evenings and Saturdays.');
 });
 const vm=OUTSIDE.find(o=>o.id==='X1');
 anchor((vm.min[0]+vm.max[0])/2,vm.min[1]-.4,1.1,'Look at the drinks machines',()=>onAction?.('read','Minato Drinks · Kitahama',
  'Two machines against the shop’s front wall: tea, water, milk coffee and sports drinks, cold all night. Minato Drinks rents the corner, as it rents Sakura’s wall.'));
 return {root,site,isBuilt:()=>built,isOpen:()=>kitahamaShopOpen(minutes),update(value){if(Number.isFinite(value))minutes=value;},load:async()=>(await loadKitahamaShopModels())&&place()};
}

/** The fittings' boxes on the island, for later batches (walking in, the keeper at the till). */
export const KITAHAMA_SHOP_FIXTURES=Object.freeze(FIXTURES.map(f=>Object.freeze({id:f.id,what:f.what,...centre(f)})));
