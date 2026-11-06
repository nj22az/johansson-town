import {businessId} from '../world/businesses.js';
// Nhung's is the clinic since she became the island doctor (22 October 2026); the room draws her at her desk itself
// (town-hall.js buildClinic), so her walking body stays indoors there and is never borrowed into it (OWN_STAFF_ROOMS).
export const WORK_SITES=Object.freeze({Nhung:'clinic',Chin:'form3d',Tetsuo:'form3d','Harbour master':'office'});
export const OWN_STAFF_ROOMS=Object.freeze(['clinic']);
/**
 * An evening desk in somebody else's room: Nhung sets the town's paper at the back bench of the old Front-Row shop
 * (social.js AFTER_WORK, place `paper`), so the room draws her there while her plan says she is.
 */
export const EVENING_DESKS=Object.freeze({Nhung:Object.freeze({place:'paper',site:'frontrow'}),
 // Grandmother Higa at Johansson Mart's till, weekday evenings and Saturdays (world/okinawa/kitahama-shop.js SHOP_DUTY).
 'Grandmother Higa':Object.freeze({place:'kitahama-shop',site:'kitahama-shop'})});
/** The room a plan puts this person in: their workplace at work, or their evening desk's. */
export const workRoomOf=(profile,plan)=>plan?.place==='work'?profile.workSite||null:EVENING_DESKS[profile.name]?.place===plan?.place?EVENING_DESKS[profile.name].site:null;
/** Workplaces only the island builds: Sato Ramen for Mrs Sato, the police box for Officer Mori. */
const ISLAND_WORK_SITES=Object.freeze({'Mrs Sato':'ramen','Officer Mori':'koban'});
export function assignWorkplaces(world,sites){
 for(const person of world.people){const id=businessId(ISLAND_WORK_SITES[person.profile.name]||WORK_SITES[person.profile.name]),site=[...sites,...(world.landmarks||[])].find(s=>s.id===id);if(!site?.door)continue;
  person.profile={...person.profile,work:[site.door[0],site.door[2]],workSite:id};
 }
}
