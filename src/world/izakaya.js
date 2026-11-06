import {buildCompactDiningRoom} from './interiors/minato-compact-room.js';
import {MINATO_COMPACT} from './interiors/minato-compact-plan.js';
import {minatoAssets as assets,minatoLoading as loading} from './interiors/minato-asset-cache.js';
import {japaneseSign,signText} from './okinawa/signs.js';
import {restaurantCollider,restaurantApproach,izakayaPlot,SATO_RAMEN_DOOR} from './dining-layout.js';
import {SATO_RAMEN,satoRamenOpen} from './sato-ramen-layout.js';
import {prepareIzakayaGlass} from './shop-glass.js';
import {buildMinatoFacade,MINATO} from './minato-facade.js';
import {registerDetail} from './detail-stream.js';
import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {assetURL} from '../assets.js';
import {daylight, lanternGlow} from '../render/dusk.js';
export {MINATO_WALNUT_LAYOUT,MINATO_FICTIONAL_SPIRITS,MINATO_WALNUT_STORY} from './interiors/izakaya-walnut.js';
export async function preloadIzakaya(kinds=['exterior','interior']){
 const loader=new GLTFLoader();await Promise.allSettled(kinds.filter(kind=>!assets.has(kind)).map(kind=>{
  if(loading.has(kind))return loading.get(kind);
  const pending=(async()=>{
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
   const read=async file=>{const response=await fetch(assetURL('models/izakaya/'+file),{signal:controller.signal});if(!response.ok)throw Error(file+': '+response.status);return (await loader.parseAsync(await response.arrayBuffer(),'')).scene;};
   try{
    if(kind==='exterior'){const source=await read('minato-benmaher-exterior.glb');prepareIzakayaGlass(source);assets.set(kind,source);}
    else{
     // The fitted compact room includes the commissioned cabinet and its shorter
     // counter. Load one complete scene, so neither entrance can mix old geometry
     // with the new circulation or duplicate the retained furniture.
     const source=await read('minato-interior-compact.glb');
     for(const name of ['Minato walnut back bar','Minato walnut counter']){
      // GLTFLoader sanitises node names, retaining Blender's original in extras.
      let holder;source.traverse(o=>{if(o.userData.name===name||o.name===name)holder=o;});
      if(!holder)throw Error('Compact Minato is missing '+name);
      holder.name=name;holder.userData.sharedAsset=true;holder.userData.walnutFurniture=name.endsWith('counter')?'counter':'backbar';
      holder.traverse(o=>{if(o.isMesh)for(const material of Array.isArray(o.material)?o.material:[o.material]){
       material.userData.keepPhysical=true;material.userData.keepPhysicalStrict=true;
      }});
     }
     assets.set(kind,source);
    }
   }catch(e){console.warn('Izakaya asset unavailable',kind,e);}finally{clearTimeout(timeout);loading.delete(kind);}
  })();loading.set(kind,pending);return pending;
 }));return {ready:assets.size,total:2};
}
export const izakayaReady=kind=>assets.has(kind);
function asset(kind,parent){
 const source=assets.get(kind);if(!source)return false;
 const model=source.clone(true);model.userData.sharedAsset=true;model.name='Minato '+kind;model.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.clearWindow;o.receiveShadow=!o.userData.clearWindow;}});parent.add(model);return true;
}
/** The shared interior -- Minato, its kitchen and Sato Ramen -- into a room. False until it has loaded. */
export const addMinatoInterior=room=>asset('interior',room);
export function buildIzakaya(world,options){
 // Where it stands depends on the layout: see IZAKAYA_PLOTS in dining-layout.js.
 const plot=izakayaPlot();
 const site={id:'izakaya',title:'Minato Izakaya',jp:"Izakaya Minato",sub:'SUPPER & STORIES',x:plot.x,z:plot.z,color:0xc98a65,accent:'#b55049',line:'Thao’s place · small plates, old friends and new stories · 16:00–03:00',door:[plot.door[0],0,plot.door[1]],opens:'16:00'};
 const facadeColliders=[];
 const approach=restaurantApproach('izakaya');site.exitPosition=[...site.door];site.approachPosition=[approach[0],0,approach[1]];site.entryFacing=plot.yaw;
 options.sites.push(site);const exterior=new THREE.Group();exterior.position.set(plot.x,0,plot.z);exterior.rotation.y=plot.yaw;world.group.add(exterior);
 // Inside, the street is the real street: the room's front wall stands on the door plane,
 // so the doorway looks out past the recess, the noren and the lantern, and the window
 // through the bay's own koshi slats (shop-street-view.js). Room x runs along the frontage.
 {const doorPlane=MINATO.front-MINATO.recess,c=Math.cos(plot.yaw),s=Math.sin(plot.yaw);
  site.streetFrontage={position:[plot.x+s*doorPlane,0,plot.z+c*doorPlane],yaw:plot.yaw,interiorZ:MINATO_COMPACT.main.maxZ,span:{minX:MINATO_COMPACT.window.position[0]-MINATO_COMPACT.window.width/2,maxX:MINATO_COMPACT.ramenEntrance.position[0]+MINATO_COMPACT.ramenEntrance.width/2,minY:.03,maxY:2.25},hideGlazing:true};}
 // The supplied exterior was a flat glazed box with no eave, no lantern and nothing to
 // say what was behind it — an office frontage with a bar's name on it. See
 // minato-facade.js for what stands there now.
 const built=buildMinatoFacade({parent:exterior,shadows:options.shadows,anisotropy:options.maxAnisotropy,colliders:facadeColliders});
 const suppliedExterior=built?true:asset('exterior',exterior);
 // Something behind the glass, for the supplied model only: the built frontage has
 // solid walls behind its own windows and needs no backing block.
 //
 // prepareIzakayaGlass lifts the window triangles out of the wall and covers the holes
 // with near-invisible glazing so you can see in. On the old street there was always
 // another building behind Minato; on the island there is the west yard and then
 // the open sea, so from the pavement its windows read as holes you can watch the
 // horizon through. The interior is a separate room and cannot stand in for it, so
 // what goes behind the glazing is this: a dim warm box the size of the ground floor,
 // inward-facing, which is what a bar looks like from outside at any hour.
 if(!built){
  // A solid block rather than an inward-facing shell: a shell's near wall is culled,
  // so from the pavement you look straight into it and it fills the view. And darker
  // than it looks it should be — under this town's exposure 0x2c2018 came back as
  // terracotta, which is the same lift that turned the park and the east lawn cream.
  const inside=new THREE.Mesh(new THREE.BoxGeometry(5.4,3.2,5.8),
   new THREE.MeshStandardMaterial({color:0x140d09,roughness:.97}));
  inside.name='Minato window backing';inside.position.set(-1.24,1.6,.8);
  inside.castShadow=false;inside.receiveShadow=false;exterior.add(inside);
 }
 // Held by name rather than by position in the child list: the streamed model used to
 // retire this by removing the group's first child, which is only the placeholder for
 // as long as nothing is ever added before it. Add anything -- the window backing
 // above, say -- and the load quietly removed that instead, leaving the orange block
 // standing in the street with the real building around it.
 let placeholder=null;
 if(!suppliedExterior){
  placeholder=new THREE.Mesh(new THREE.BoxGeometry(5.22,4,6.82),new THREE.MeshStandardMaterial({color:0x965332}));
  placeholder.name='Minato placeholder';placeholder.position.set(-.91,2,1.11);exterior.add(placeholder);
 }
 // Warm readable bilingual sign remains a runtime canvas so it does not require font textures in GLB.
 const c=document.createElement('canvas');c.width=768;c.height=192;const ctx=c.getContext('2d');ctx.fillStyle='#36241e';ctx.fillRect(0,0,768,192);ctx.textAlign='center';ctx.fillStyle='#ffe4af';ctx.font='bold 70px serif';signText(ctx,japaneseSign("Izakaya Minato"),384,88,700,70);ctx.font='26px sans-serif';ctx.fillText('MINATO · SUPPER & STORIES',384,146);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.5,.68),new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.3}));sign.position.set(0,3.35,4.3);sign.visible=!suppliedExterior;exterior.add(sign);
 const entrance=new THREE.Object3D();entrance.position.set(...site.door);entrance.position.y=1.2;world.group.add(entrance);options.register(entrance,'Come into Minato Izakaya',()=>options.enter(site));
 // The new facade has a recessed closed door and an asymmetric footprint.
 // Stop at the visible step; the entrance prompt opens the existing dining room.
 world.colliders.push(...(built?facadeColliders
  :[{x:-.91,z:1.11,w:5.22,d:6.82,height:9.05},{x:-3.92,z:-1.54,w:.85,d:.85,height:1.08},{x:-3.74,z:-.90,w:.50,d:.50,height:.36}]
 ).map(c=>restaurantCollider('izakaya',c)));

 if(built){
  // Lanterns on after dark, noren out while Thao is open. world.hourly is run by the
  // town's own updateHours, so this follows the clock rather than the frame.
  (world.hourly||(world.hourly=[])).push(minutes=>{
   const h=((minutes%1440)+1440)%1440,open=h>=960||h<180;
   built.lit(open,daylight(minutes),lanternGlow(minutes));
   built.ramen.lit(satoRamenOpen(minutes),daylight(minutes));
  });
  // Sato Ramen, the lunch counter on the alley corner of the same building.
  const ramen={id:SATO_RAMEN.id,title:SATO_RAMEN.title,jp:SATO_RAMEN.jp,sub:'LUNCH · SAME KITCHEN AS MINATO',x:SATO_RAMEN_DOOR[0],z:SATO_RAMEN_DOOR[1],color:0xa3241c,accent:'#a3241c',
   line:'Mrs Sato’s shoyu, miso and shio ramen · lunch 11:00–14:00',door:[SATO_RAMEN_DOOR[0],0,SATO_RAMEN_DOOR[1]],opens:'11:00',entryFacing:plot.yaw};
  ramen.exitPosition=[...ramen.door];
  // Both doors enter the same local coordinate frame. Reuse the complete front
  // transformation so the Minato window and both door openings show the same
  // street from either entry, without moving Sato's exterior doorway identity.
  ramen.streetFrontage=site.streetFrontage;
  const old=options.sites.findIndex(s=>s.id===ramen.id);if(old>=0)options.sites.splice(old,1);options.sites.push(ramen);
  const ramenEntrance=new THREE.Object3D();ramenEntrance.position.set(SATO_RAMEN_DOOR[0],1.2,SATO_RAMEN_DOOR[1]);ramenEntrance.name='Sato Ramen entrance';world.group.add(ramenEntrance);
  options.register(ramenEntrance,'Come into Sato Ramen',()=>options.enter(ramen));
 }
 if(!suppliedExterior)registerDetail(world,{id:'izakaya-exterior',priority:1,x:plot.x,z:plot.z,radius:48,load:async()=>{
  await preloadIzakaya(['exterior']);if(!assets.has('exterior'))return false;
  asset('exterior',exterior);placeholder?.removeFromParent();placeholder=null;sign.visible=false;return true;
 }});
 return site;
}
export function buildIzakayaRoom(options){
 return buildCompactDiningRoom(options,{addInterior:addMinatoInterior,kind:'izakaya'});
}
