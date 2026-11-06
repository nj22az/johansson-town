import {NAKAMURA_HOME_DOOR} from '../world/nakamura-plan.js';
import {CAST,castMember} from './cast.js';
import {householdAtHome,homeForResident,secondaryHomesFor,activeHomeForResident,householdTitle} from './island-households.js';
import {canonicalHomeId} from './households.js';
import {KITAHAMA,KITAHAMA_FLATS,plotGate} from '../world/kitahama-layout.js';
import {YARD_HOMES} from '../world/yard-homes-layout.js';
import {NISHI,EAST_BACK,EAST_ROW,YARD_ROW} from '../world/okinawa/layout.js';

import {HARBOUR_OFFICE} from '../world/business-layout.js';
import {KOBAN} from '../world/koban-layout.js';
import {SCHOOL} from '../world/school-layout.js';
import {PORT_BUILDING} from '../world/port-building.js';
import {HOUSEBOAT} from '../world/fujita-houseboat.js';
import {KITANO_HAMLET,hamletGate,houseIsland} from '../world/kitano-hamlet-layout.js';
import {HOUSE_OPENINGS} from '../world/johansson-house.js';
import {AIRPORT_ISLAND} from '../world/airport-island.js';
import {airportWorld,airportSurface} from '../world/airport-ground.js';

/** Read-only directory data. No DOM, renderer, save writes, clock changes or character movement. */
const ROLES=Object.freeze({Johansson:'Chief engineer',Thuan:'Sakura owner',Thao:'Izakaya owner',Chin:'Ferry motorman and repairman',
 Vy:'School pupil',Nhung:'Doctor, and the town’s paper','Kōji':'Fisherman and catch sorter',Riku:'School pupil','Miss Higa':'Teacher and bathhouse attendant',
 'Grandmother Higa':'Bathhouse owner',Tetsuo:'Radio repairer and electrician','Mrs Sato':'Ramen cook',
 'Officer Mori':'Police officer','Harbour master':'Harbour master',
 Mac:'Relief engineer',
 'Ms Uezu':'Ferry bosun','Ms Ganaha':'Port clerk: tickets, parcels and post','Mr Fujita':'Ferry master',
 Ryo:'Ferry chief officer',Ren:'Ferry deck hand',Aya:'Ferry purser',Jun:'Ferry cook-steward',Kai:'Kitano line hand'});
// The post and parcel counter is at the Port Terminal (phase 3), so a saved 'post-office' points there; the flowers are
// Sakura's (addendum 3), so 'florist' points at the shop.
const PLACE_IDS=Object.freeze({sakura:'market',books:'frontrow',paper:'frontrow',workshop:'form3d','sato-ramen':'ramen','town-hall':'community-kitchen',
 port:'ferry-terminal',ferry:'ferry-terminal','post-office':'ferry-terminal','higa-liquor':'higa-saketen','kissa-higa':'higa-saketen',
 florist:'market',zenzai:'nakamura','blue-coral':'nakamura','power-station':'power-station'});
const INDOOR_FLAGS=Object.freeze({inMarket:'market',inIzakaya:'izakaya',inRamen:'ramen',inOnsen:'onsen',inBookshop:'frontrow',inWorkshop:'form3d'});
const minute=value=>((value%1440)+1440)%1440;
const hhmm=s=>{const [h,m]=s.split(':').map(Number);return h*60+m;};
const slug=name=>name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const point=value=>Array.isArray(value)?value.length>=3?{x:value[0],y:value[1],z:value[2]}:{x:value[0],y:0,z:value[1]}:
 value&&Number.isFinite(value.x)&&Number.isFinite(value.z)?{x:value.x,y:Number.isFinite(value.y)?value.y:0,z:value.z}:null;
const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z);
const sitePoint=site=>point(site?.approachPosition)||point(site?.exitPosition)||point(site?.door)||point(site);
const indexSites=({sites=[],landmarks=[]}={})=>new Map([...sites,...landmarks].map(s=>[canonicalHomeId(s.id),s]));
const makeTarget=(id,title,p,extra={})=>finite(p)?{id,title,...p,door:[p.x,p.y,p.z],...extra}:null;

/** The retained public places a retired home's records land at (roster.js RETIRED_HOMES), before the sites are registered. */
const FALLBACK_GEOMETRY=Object.freeze({
 'community-kitchen':()=>({x:27.0,y:0,z:SCHOOL.building.minZ-1.4,entryFacing:Math.PI}),
 'ferry-terminal':()=>({x:PORT_BUILDING.hallDoor[0]-.7,y:0,z:PORT_BUILDING.hallDoor[2],entryFacing:-Math.PI/2}),
 market:()=>({x:-5.5,y:0,z:-28.5,entryFacing:Math.PI/2}),
 izakaya:()=>({x:-17.65,y:.04,z:-9,entryFacing:-Math.PI/2}),
});
/**
 * Existing entrance geometry is preferred to any fallback, so relocating a site relocates its directions. A retired
 * home resolves to the roster's fallback, the retained public place its saved records land at (nobody lives in one:
 * the retired identities have no body since phase 4).
 */
function homeGeometry(h){
 if(h.retired)return h.fallback&&FALLBACK_GEOMETRY[h.fallback]?FALLBACK_GEOMETRY[h.fallback]():null;
 const id=h.home;
 const plot=KITAHAMA.plots.find(p=>p.id===id)||NISHI.plots.find(p=>p.id===id)||EAST_BACK.plots.find(p=>p.id===id);
 if(plot){const g=plotGate(plot);return {...point(g.door),y:id.startsWith('kitahama-')?KITAHAMA.y+.02:.02,entryFacing:g.inward};}
 const house=KITAHAMA_FLATS.find(p=>p.id===id);
 if(house)return {...point(house.approachPosition),entrancePosition:[...house.door],entryFacing:house.approachFacing};
 if(YARD_HOMES[id])return {...point(YARD_HOMES[id].door),y:.02,entryFacing:YARD_HOMES[id].inward};
 const kitano=KITANO_HAMLET.plots.find(p=>p.id===id);
 if(kitano){
  const opening=id==='kitano-1'?HOUSE_OPENINGS.find(o=>o.id==='D-ENTRY'):null;
  const g=opening?{door:houseIsland((opening.from+opening.to)/2,-.4),inward:Math.PI}:hamletGate(kitano);
  const [x,z]=airportWorld(...g.door);return {x,z,y:airportSurface(x,z)?.y??0,entryFacing:g.inward+AIRPORT_ISLAND.yaw};
 }
 if(id==='office')return {...point(HARBOUR_OFFICE.door),entryFacing:0};
 if(id==='koban')return {...point(KOBAN.door),y:.02,entryFacing:KOBAN.inward};
 if(id==='clinic')return {x:37.7,y:0,z:SCHOOL.building.minZ-1.4,entryFacing:Math.PI};
 if(id==='ferry'||h.aboard)return {x:PORT_BUILDING.hallDoor[0]-.7,y:0,z:PORT_BUILDING.hallDoor[2],entryFacing:-Math.PI/2};
 if(id==='fujita-houseboat')return {x:HOUSEBOAT.gangway.maxX+.35,y:0,z:(HOUSEBOAT.gangway.minZ+HOUSEBOAT.gangway.maxZ)/2,entryFacing:Math.PI/2};
 if(id==='market')return {x:-5.5,y:0,z:-28.5,entryFacing:Math.PI/2};
 // The published island's established Minato entrance, used only before runtime site registration.
 if(id==='izakaya')return {x:-17.65,y:.04,z:-9,entryFacing:-Math.PI/2};
 if(id==='nakamura')return {...point(NAKAMURA_HOME_DOOR),entryFacing:-Math.PI/2};
 for(const row of [EAST_ROW,YARD_ROW]){
  const p=row.plots.find(p=>p.id===id);if(p)return {x:row===EAST_ROW?row.minX-.9:row.maxX+.9,y:.02,z:(p.minZ+p.maxZ)/2,entryFacing:row===EAST_ROW?-Math.PI/2:Math.PI/2};
 }
 return null;
}
function recordForHome(h,siteIndex){
 if(!h)return null;
 // A retired home's target is the public place its records land at (the registered site when the town is built).
 const site=h.retired?h.fallback?siteIndex.get(h.fallback):null:siteIndex.get(canonicalHomeId(h.entranceSiteId)),fallback=homeGeometry(h),p=sitePoint(site)||fallback;
 const directions=h.retired?h.retainedBuilding?h.address+' is vacant; the building remains and has no private home entrance.':h.address+' has been removed; ask at '+(site?.title||'the town hall')+'.':
  h.aboard?'The home is aboard the Minato Maru. Start at the Port Terminal and check where the ferry is berthed.':
  h.island==='kitano'?'Take the ferry to Kitano-jima, then follow the hamlet lane to '+h.address+'.':
  h.unit?h.address+' · its own gate and front door on Fukugi Lane.':
  'Follow the walking route to '+h.address+'. The entrance identifies the household.';
 const target=makeTarget(h.retired?site?.id||h.fallback||h.entranceSiteId:h.entranceSiteId,householdTitle(h),p,{homeId:h.home,isResidence:!h.retired,kind:'home',status:h.status,
  address:h.address,line:h.address,residents:[...h.residents],unit:h.unit,island:h.island,aboard:!!h.aboard,
  entrancePosition:site?.entrancePosition?[...site.entrancePosition]:site?.door?[...site.door]:fallback?.entrancePosition||[p?.x,p?.y,p?.z],
  entryFacing:site?.entryFacing??fallback?.entryFacing??0,directions:site?.directions||directions});
 return {id:h.home,address:h.address,residents:[...h.residents],unit:h.unit,district:h.district,island:h.island,
  status:h.status,aboard:!!h.aboard,retired:!!h.retired,target};
}
export function residentHome(name,options={}){return recordForHome(homeForResident(name),indexSites(options));}
export function activeResidentHome(name,options={}){return recordForHome(activeHomeForResident(name),indexSites(options));}

function placeTarget(place,siteIndex){
 const id=canonicalHomeId(PLACE_IDS[place]||place),site=siteIndex.get(id),p=sitePoint(site);
 if(p)return makeTarget(site.id,site.title,p,{entryFacing:site.entryFacing??0,island:'minato',directions:site.directions||'Follow the walking route to '+site.title+'.'});
 const home=householdAtHome(place);if(home)return recordForHome(home,siteIndex)?.target||null;
 if(place==='home-nakamura')return recordForHome(householdAtHome('nakamura'),siteIndex)?.target;
 // The public service fronts share the same reachable threshold as the home upstairs.
 if(['zenzai','blue-coral'].includes(place))return recordForHome(householdAtHome('nakamura'),siteIndex)?.target;
 if(place==='fujita-shed')return makeTarget('fujita-shed','Mr Fujita’s pier shed',{x:-36.6,y:.02,z:-55.6},{island:'minato'});
 return null;
}
function schedulePhase(person,minutes){
 const m=minute(minutes),phases=person.day.map(([time,place,activity])=>({from:hhmm(time),place,activity})).sort((a,b)=>a.from-b.from);
 return phases.filter(s=>s.from<=m).at(-1)||phases.at(-1);
}
function entityName(p){const g=p?.g||p;return p?.profile?.name||p?.spec?.name||g?.userData?.name||g?.name;}
function worldPoint(g){
 const e=g?.matrixWorld?.elements;
 if(e?.length===16)return {x:e[12],y:e[13],z:e[14]};
 return point(g?.position);
}
function visibleInWorld(g){for(let o=g;o;o=o.parent)if(o.visible===false)return false;return true;}
function currentRecord(person,entity,siteIndex,minutes){
 const phase=schedulePhase(person,minutes),g=entity?.g||entity,u=g?.userData||{},profile=entity?.profile,spec=entity?.spec;
 const activeHome=recordForHome(activeHomeForResident(person.name),siteIndex);
 if(g){
  if(u.ferryCrew||u.aboardFerry)return {activity:u.activity||'Aboard the Minato Maru',locationLabel:'Aboard the Minato Maru',source:'live',aboard:true,target:placeTarget('port',siteIndex)};
  let indoorHome=u.inHome||u.indoors==='home',place=u.inWorkplace||Object.entries(INDOOR_FLAGS).find(([flag])=>u[flag])?.[1];
  if(!place&&typeof u.indoors==='string'&&u.indoors!=='home')place=u.indoors==='work'?profile?.workSite||person.work:u.indoors;
  if(!place&&u.hit?.inside&&!indoorHome)place=u.place||person.work;
  // Hidden home actors and borrowed indoor actors retain room-local coordinates. Never route to those coordinates.
  if(indoorHome||place){
   const target=indoorHome?activeHome?.target:placeTarget(place,siteIndex);
   return {activity:u.activity||(indoorHome?'At home':phase.activity),locationLabel:indoorHome?activeHome?.address:target?.title||String(place),
    source:'live',indoors:true,target:target||null};
  }
  if(['away','bus','station'].includes(u.place))return {activity:u.activity||'Travelling',locationLabel:'Port and ferry service',source:'live',target:placeTarget('port',siteIndex)};
  const localPhase=spec?.routine?.filter(s=>minute(minutes)>=s.from).at(-1);
  if(localPhase?.away||u.scheduledAway)return {activity:localPhase?.role||u.activity||'At school',locationLabel:'At school',source:'schedule',target:null};
  if(localPhase?.home)return {activity:u.activity||'At home',locationLabel:activeHome?.address,source:'live',indoors:true,target:activeHome?.target||null};
  const position=worldPoint(g);
  if(visibleInWorld(g)&&finite(position))return {activity:u.activity||spec?.role||phase.activity,locationLabel:u.locationLabel||'On the island',source:'live',
   target:makeTarget('person-'+slug(person.name),person.name,position,{kind:'person',personName:person.name,island:position.x>100?'kitano':'minato'})};
 }
 const target=placeTarget(phase.place,siteIndex);
 return {activity:phase.activity,locationLabel:target?.address||target?.title||phase.place,source:'schedule',target:target||null};
}

/**
 * All cast members, including separately built neighbours. Pass live site and entity lists after world construction.
 * A schedule fallback is labelled source:'schedule'; it is never presented as an observed live position.
 */
export function residentCards(options={}){
 const {people=[],neighbours=[],minutes=720}=options,siteIndex=indexSites(options);
 const entities=new Map([...neighbours,...people].map(p=>[castMember(entityName(p))?.name||entityName(p),p]));
 return CAST.map(person=>{
  const home=recordForHome(homeForResident(person.name),siteIndex),secondaryHomes=secondaryHomesFor(person.name).map(h=>recordForHome(h,siteIndex));
  const current=currentRecord(person,entities.get(person.name),siteIndex,minutes);
  return {id:person.name,name:person.name,role:ROLES[person.name]||person.purpose,purpose:person.purpose,home,secondaryHomes,
   household:{id:home.id,address:home.address,residents:[...home.residents]},current,homeTarget:home.target,personTarget:current.target};
 });
}
/** Distinct occupied home targets, including secondary residences. Shared households appear once; a retired home's fallback is not a home. */
export function canonicalHomeSites(cards=residentCards()){
 const homes=new Map();
 for(const card of cards)for(const h of [card.home,...card.secondaryHomes])if(h?.target&&!h.retired&&!homes.has(h.id))homes.set(h.id,{...h.target,title:householdTitle(h.id)});
 return [...homes.values()];
}
