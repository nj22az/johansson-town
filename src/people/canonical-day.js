import {canonicalRest} from './canonical-rest.js';
import {NAKAMURA_DESSERTS,HARBOUR_PARK_STUDY} from '../world/harbour-park-plan.js';
import {ONSEN_DOOR} from '../world/onsen-layout.js';
import {RAMEN_DOOR} from '../world/dining-layout.js';
import {townCalendarAt} from '../town-clock.js';
import {rotaWeek,FERRY_WORKING_DAY} from './ferry-crew.js';
import {CAST,castMember} from './cast.js';
import {activeResidentHome,residentHome} from './home-directory.js';
import {SCHOOL} from '../world/school-layout.js';
import {TOWN_DESTINATIONS} from '../world/town-grid.js';
import {IZAKAYA_DOOR} from '../world/dining-layout.js';
import {MARKET_THRESHOLD} from '../world/town-grid.js';
import {KITANO_PIER_STAND} from '../world/kitano-hamlet-layout.js';
import {airportWorld} from '../world/airport-ground.js';
import {standNow} from './stand-points.js';
import {quayBreakPlan} from './quay-breaks.js';
import {shopDayPlan,LAUNDRY_STANDS} from './shop-days.js';
import {kitahamaShopOnDuty,kitahamaShopOpen,DOOR_POINT as KITAHAMA_SHOP_DOOR} from '../world/okinawa/kitahama-shop.js';
import {YUNTAKU} from '../commerce/higa-liquor.js';
import {KISSA,KISSA_KEEPER,kissaVisitAt} from '../commerce/kissa-higa.js';
import {EAST_QUAY} from '../world/okinawa/layout.js';

const HOME_TARGETS=new Map();
const activeTarget=name=>{if(!HOME_TARGETS.has(name))HOME_TARGETS.set(name,activeResidentHome(name)?.target);return HOME_TARGETS.get(name);};
const minute=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
// Ice for the boats is loaded at the ice plant's door (the steel shutter on its west wall, world/okinawa/quarters.js),
// a metre out in the lane. The old spot, [31, -41], is where the fish market's drinks machine has stood since the owner
// moved it there (21 October 2026, quarters.js AUCTION_VENDING), so Kōji was sent into the machine.
const ICE_DOOR=Object.freeze([EAST_QUAY.ice.minX-1,EAST_QUAY.ice.minZ+2.7]);
const points={izakaya:IZAKAYA_DOOR,sakura:MARKET_THRESHOLD,market:MARKET_THRESHOLD,warehouse:[-9.7,-41.4],
 school:[SCHOOL.genkan.x,SCHOOL.building.minZ-1.4],park:HARBOUR_PARK_STUDY[0],onsen:ONSEN_DOOR,
 port:[8,-38],ferry:[8,-38],office:[8,-38],koban:[5.05,20.3],
 'sato-ramen':RAMEN_DOOR,books:TOWN_DESTINATIONS.books,workshop:TOWN_DESTINATIONS.workshop,
 zenzai:NAKAMURA_DESSERTS.staffAt,'blue-coral':NAKAMURA_DESSERTS.staffAt,
 'fish-auction':[25,-39.6],'ice-plant':ICE_DOOR,boatyard:[-31.8,-45],sea:[-31.8,-45],
 'higa-bench':YUNTAKU.seats.mac.stand,'kissa-higa':KISSA_KEEPER.at,'coin-laundry':LAUNDRY_STANDS.W2.at,clinic:[34.1,35.1],'cargo-yard':[17,-40],
 'power-station':[SCHOOL.powerHouse.door[0]+.6,SCHOOL.powerHouse.door[1]-.9],quay:[20,-40],
 'main-street':[1,0],seawall:[-36.7,-20],'net-ground':[-28.4,7.6],'kitano-pier':airportWorld(...KITANO_PIER_STAND)};
export function canonicalDestination(name,place){
 const p=castMember(name),home=activeTarget(name);
 if(place===p?.home||p?.alsoAt.includes(place))return home?[home.x,home.z]:null;
 if(points[place])return [...points[place]];
 const host=CAST.find(p=>p.home===place),h=host?residentHome(host.name):null;if(h?.target)return [h.target.x,h.target.z];
 return null;
}
/** Shared by the street neighbour and the same actor borrowed into its private room. */
const DAYS=new Map(CAST.map(p=>[p.name,p.day.map(([time,place,activity])=>({from:minute(time),place,activity})).sort((a,b)=>a.from-b.from)]));
export function canonicalDay(name,minutes,rain=false,{kissaClosingHeld=false}={}){
 const p=castMember(name);if(!p)return null;
 const m=((minutes%1440)+1440)%1440,phases=DAYS.get(p.name);
 const phase=phases.filter(s=>s.from<=m).at(-1)||phases.at(-1),isHome=(phase.place===p.home||p.alsoAt.includes(phase.place))&&!/sweeping|the garden|at her gate/.test(phase.activity)&&(p.home!==p.work||/home|breakfast|asleep|sleep/.test(phase.activity));
 const homePlan=activity=>{const h=activeTarget(name);return {place:'home',target:[h.x,h.z],activity,rain:!!rain};};
 if(name===KISSA.keeper&&kissaClosingHeld)return shopDayPlan(name,minutes,{kissaClosingHeld:true});
 // The bosun's rota (ferry-crew.js bosunFor): Ms Uezu's week on and week off, Kōji her relief. On his week the ship has
 // him for her whole working day (FERRY_WORKING_DAY, the crew controller draws him aboard and hides this body), so he
 // is never at the auction, the ice plant or his own sabani while he is signed on, and his fisherman's early night
 // waits for the shore power; on her week off she is at home.
 if(name==='Kōji'&&rotaWeek(minutes)===1){
  if(m>=FERRY_WORKING_DAY.signOn-15&&m<FERRY_WORKING_DAY.signOff)return {place:'ferry',target:[...points.ferry],activity:'relief bosun’s working week'};
  if(m<FERRY_WORKING_DAY.signOn-15)return homePlan('a late start on his relief week; the sabani stays on the quay');
 }
 const rest=canonicalRest(name,minutes);
 // Breakfast at Kissa Higa's counter instead of at home, for a regular whose morning it is (Yui on weekdays; shop-days.js).
 if(rest&&!(rest.id==='breakfast'&&kissaVisitAt(name,minutes)))return {...homePlan(rest.activity),rest:rest.id};
 // Johansson Mart, Kitahama (world/okinawa/kitahama-shop.js; the owner, 27 October 2026): Grandmother Higa keeps its till
 // on weekday evenings and Saturdays, when Sakura is shut and Miss Higa has the bandai. It comes before the shops below:
 // while the shop has her, she is behind its counter (its hours and Kissa Higa's mornings never meet).
 if(name==='Grandmother Higa'&&kitahamaShopOnDuty(minutes))return {place:'kitahama-shop',target:[...KITAHAMA_SHOP_DOOR],
  activity:kitahamaShopOpen(minutes)?'the till at Johansson Mart':'taking in the van’s cases at Johansson Mart',rain:!!rain};
 // Sakura Trading's round, Kissa Higa's mornings, the bench outside it of an evening, and washing day at the coin laundry
 // (shop-days.js).
 const shop=shopDayPlan(name,minutes,{pointFor:place=>points[place]?[...points[place]]:null});
 if(shop){if(shop.home)return homePlan(shop.activity);return {...shop,target:shop.target||[...points[shop.place]],rain:!!rain};}
 const weekday=townCalendarAt(minutes).weekday,weekend=weekday===0||weekday===6;
 if(name==='Ms Uezu'&&rotaWeek(minutes)===1&&phase.place==='ferry')return homePlan('off watch at her shore home');
 if(weekend&&phase.place==='school'){
  if(name==='Miss Higa')return {place:'onsen',target:[...points.onsen],activity:'weekend bandai duty'};
  return rain?homePlan('a rainy school-free day at home'):{place:'park',target:[...points.park],activity:'weekend in Harbour Park'};
 }
 if(rain&&['park','quay'].includes(phase.place))return homePlan('sheltering at home until the rain clears');
 // A break on the quay's shared spots (quay-breaks.js): the claim holds the spot, so it is read before the phase.
 const quayBreak=!rain&&quayBreakPlan(name,minutes);
 if(quayBreak)return {...quayBreak,rain:false};
 // A phase that names a stand sequence (stand-points.js): the point the seeded clock has them at, its facing and pose.
 // Garden and net work is outdoor work: in the rain they wait it out at home.
 const stand=standNow(name,minutes,'world');
 if(stand){
  if(rain)return homePlan('sheltering at home until the rain clears');
  const {point}=stand;
  return {place:phase.place,target:[point.x,point.z],activity:point.activity,rain:false,
   stand:Object.freeze({yaw:stand.yaw,pose:point.pose,tool:point.tool,index:stand.index,why:point.why,sequence:stand.sequence.id})};
 }
 // Younger pupils walk to the real school gate. Their classroom owns them after arrival.
 const target=isHome?canonicalDestination(name,p.home):points[phase.place]?[...points[phase.place]]:canonicalDestination(name,phase.place);
 return {place:isHome?'home':phase.place==='sakura'?'market':phase.place,target,activity:phase.activity,school:phase.place==='school',rain:!!rain};
}

/** One continuous outdoor path. Every home door is at ground level now (Kitahama Heights lost its stair in phase 3), so the street raster reaches them all. */
export function canonicalStreetRoute(navigation,name,from,target){
 // Staying home is not a journey.
 if(Math.hypot(from.x-target[0],from.z-target[1])<.06)return [];
 return navigation.path(from,{x:target[0],z:target[1]});
}
