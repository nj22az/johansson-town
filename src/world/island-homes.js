import * as THREE from '../../vendor/three.module.js';
import {KITAHAMA,KITAHAMA_FLATS,plotGate} from './kitahama-layout.js';

import {householdAtHome,householdTitle} from '../people/island-households.js';
import {HOUSEBOAT} from './fujita-houseboat.js';
import {NISHI} from './okinawa/layout.js';
import {NAKAMURA_HOME_DOOR} from './nakamura-plan.js';
import {householdFor} from '../people/households.js';

/**
 * The doors of the Kitahama houses (okinawa/layout.js KITAHAMA), as sites like every
 * door in town. The houses themselves are built with the Okinawan quarter (quarters.js).
 *
 * Thao, Chin and Vy, Mrs Sato, and Nhung with Kōji and Riku (phase 3 of the consolidation) are walking residents:
 * their houses are home sites with a homeOwner, so home-residents.js puts them to bed there and they no longer leave
 * on the ferry at night. The others are families from the household registry, whose room is built by
 * family-home.js; the house to let is empty.
 */
import {KITAHAMA_RESIDENT_HOMES} from './kitahama-layout.js';
export {KITAHAMA_RESIDENT_HOMES,ISLAND_RESIDENT_NAMES,kitahamaHomeFor} from './kitahama-layout.js';

export function buildIslandHomes(world,options){
 const homes=world.homes instanceof Map?world.homes:new Map();
 for(const p of KITAHAMA.plots){
  const {door,inward}=plotGate(p),household=householdAtHome(p.id),residents=KITAHAMA_RESIDENT_HOMES[p.id];
  const title=householdTitle(household);
  const site={id:household?.entranceSiteId||'home-'+p.id,title,jp:p.family,sub:'KITAHAMA',color:0xd4c6ad,accent:'#776953',
   homeId:p.id,isResidence:true,status:household?.status||'vacant',residents:[...(household?.residents||[])],
   directions:'Follow Kitahama’s cross lane to '+(household?.address||p.id)+'. The gate lists the household.',
   line:household?.address||p.id,door:[door[0],KITAHAMA.y+.02,door[1]],exitPosition:[door[0],KITAHAMA.y+.02,door[1]],entryFacing:inward,x:door[0],z:door[1],opens:'00:00',plot:p.id};
  if(residents){
   Object.assign(site,{homeOwner:residents[0],homeOwners:[...residents],homeEntry:p.id,houseKind:p.kind||'concrete'});
   for(const name of residents)homes.set(name,{owner:name,household:householdFor(name)?.id,address:site.line,door:[...door],building:'kitahama',occupied:false});
  }else Object.assign(site,{homeOwner:household.residents[0],homeOwners:[...household.residents],familyHome:household||{members:[],toLet:true},houseKind:p.kind||'concrete',ownRoom:true});
  options.sites.push(site);
  const anchor=new THREE.Object3D();anchor.name='kitahama entrance:'+p.id;anchor.position.set(door[0],1.3,door[1]);world.group.add(anchor);
  options.register?.(anchor,(household?.toLet?'Look round ':'Visit ')+title+' · '+site.line,()=>options.enter(site));
 }
 // Kitahama Heights: two attached ground-floor houses (kitahama-layout.js KITAHAMA_HEIGHTS), each with its own Enter
 // action at its gate on Fukugi Lane, its own room and its own front door at ground level.
 for(const house of KITAHAMA_FLATS){
  const h=householdAtHome(house.id),[x,y,z]=house.approachPosition;
  addHome(h,[x,y,z],{entrancePosition:[...house.door],entryFacing:house.approachFacing,unit:house.house,houseKind:'concrete'});
 }
 // The Higa house: the one Nishi-machi home that stands (the Kinjō and Ōshiro houses went in phase 4).
 for(const p of NISHI.plots.filter(p=>p.id==='higa')){
  const {door,inward}=plotGate(p);addHome(householdAtHome(p.id),[door[0],.04,door[1]],{entryFacing:inward,houseKind:p.kind});
 }
 // Separate residential entrances: customers never cross a private sleeping room.
 // Its door is on the shop-house's Main Street face, the building east of it: in is east (−π/2), as for every west gate.
 addHome(householdAtHome('nakamura'),[...NAKAMURA_HOME_DOOR],{upperHome:true,entryFacing:-Math.PI/2});
 // (The doctor's flat behind the clinic went with Dr Kakazu on 22 October 2026: Nhung, the doctor now, lives at 3 Kitahama.)
 // (The flat over the former post office and Barfly's room at the izakaya were retired in phase 4: no door, no site.)
 function addHome(h,door,extra={}){
  if(!h||h.retired)return;
  const id=h.entranceSiteId;
  const site={id,title:householdTitle(h),sub:'PRIVATE HOME',homeId:h.home,isResidence:true,status:h.status,
   residents:[...h.residents],homeOwner:h.residents[0],homeOwners:[...h.residents],familyHome:h,houseKind:'concrete',ownRoom:true,
   door,exitPosition:[...door],approachPosition:[...door],x:door[0],z:door[2],opens:'00:00',line:h.address,...extra};
  options.sites.push(site);(world.landmarks??=[]).push(site);
  const anchor=new THREE.Object3D();anchor.name='occupied home entrance:'+h.home;anchor.position.set(door[0],door[1]+1.1,door[2]);world.group.add(anchor);
  options.register?.(anchor,'Visit '+site.title,()=>options.enter(site));
  for(const name of h.residents)homes.set(name,{owner:name,address:h.address,door:[door[0],door[2]],building:h.home,occupied:false});
  if(extra.doorPanel){
   const panel=new THREE.Mesh(new THREE.BoxGeometry(.08,2.05,.92),new THREE.MeshStandardMaterial({color:0x665243,roughness:.85}));
   panel.name='Private residential door:'+h.home;panel.position.set(...(extra.panelPosition||[door[0]+.4,door[1]+1.025,door[2]]));world.group.add(panel);
  }
 }
 (world.landmarks??=[]).push({id:'fujita-houseboat',title:'Shiosai · Mr Fujita’s home',homeId:'fujita-houseboat',isResidence:true,residents:['Mr Fujita'],x:HOUSEBOAT.gangway.maxX+.35,z:(HOUSEBOAT.gangway.minZ+HOUSEBOAT.gangway.maxZ)/2,openDwelling:true});
 world.homes=homes;
}
