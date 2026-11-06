import {CANONICAL_REST} from './canonical-rest.js';
import {activeHomeForResident} from './island-households.js';
import {TATAMI_HOME_LAYOUT,TATAMI_HOME_OWNER} from '../world/interiors/tatami-home-layout.js';
import {householdFor,householdNames} from './households.js';
// Repeatable household routines use the saved town clock, including night workers.
const minute=m=>((m%1440)+1440)%1440;
export function sleepHours(profile){
 if(profile.canonicalDay&&CANONICAL_REST[profile.name])return CANONICAL_REST[profile.name];
 // Kissa Higa (30 October 2026): his morning set is before bed at nine, not in the middle of a seven-o'clock sleep.
 if(profile.name==='Officer Mori')return {sleep:540,wake:900};
 // On the island he lives in the office and keeps the ship's day, the last boat fast by half past ten (social.js HARBOUR_MASTER_DAY).
 if((profile.name==='Harbour master'))return {sleep:1380,wake:330};
 if(profile.name==='Thao')return {sleep:240,wake:720};
 // His authored cast day has the radio bench from nine and home at 22:30; the old 17:00–midnight shift left him asleep
 // through the decided Kissa Higa breakfasts. Keep eight hours overnight, then breakfast at home or at her counter.
 if(profile.name==='Tetsuo')return {sleep:1380,wake:420};
 // Chin is the ferry's motorman (ferry-crew.js FERRY_WORKING_DAY: signed on 06:05, off 23:15 after the last boat back, then the izakaya).
 if(profile.name==='Chin')return {sleep:1425,wake:300};
 // The doctor is on call: to bed at eleven, after the Wednesday laundry (coin-laundry.js) and the clinic's medicines off
 // the evening boats (world/town-traffic.js), as Dr Kakazu was before he retired into her (22 October 2026).
 if(profile.name==='Nhung')return {sleep:1380,wake:minute(profile.start-90)};
 return {sleep:minute(profile.retire+20),wake:minute(profile.start-90)};
}
export function homeRoutine(profile,minutes){
 const {sleep,wake}=sleepHours(profile),m=minute(minutes),sinceWake=minute(m-wake);
 if(minute(m-sleep)<minute(wake-sleep))return {id:'sleep',activity:'sleeping',pose:'Sleep'};
 if(sinceWake<15)return {id:'wake',activity:'waking up and stretching',pose:'Wake'};
 if(sinceWake<40)return {id:'breakfast',activity:'having breakfast',pose:'Eat',item:'rice'};
 if(sinceWake<60)return {id:'prepare',activity:'getting ready for the day',pose:'Read',item:'paper'};
 if(minute(sleep-m)<20)return {id:'bedtime',activity:'settling down for bed',pose:'Sit'};
 const leisure=[{id:'read',activity:'reading',pose:'Read',item:'paper'},{id:'tea',activity:'having tea',pose:'Drink',item:'tea'},{id:'plan',activity:'planning tomorrow’s errands',pose:'Read',item:'paper'}];
 return leisure[(Math.floor(m/30)+profile.name.length)%leisure.length];
}
export const homeSiteId=name=>householdFor(name)?.id||activeHomeForResident(name)?.entranceSiteId||'resident-home-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
export const homeOwner=site=>householdNames(site)[0]||null;

export const HOME_LAYOUT={bounds:{minX:-3,maxX:3,minZ:-3,maxZ:3},spawn:[1.5,0,2],exit:[1.5,1.1,2.9],
 bed:[-1.75,.58,.65],bedside:[-.5,0,-.3],table:[1.1,0,-1.2],tableStand:[1.1,0,-.65],tableSeatYaw:0,tableSeatHeight:.41,tableSeatFront:.3,door:[1.5,0,2.45],
 cover:{position:[-1.75,.64,.05],width:1.10,length:1.30,axis:'z'},
 /** A peg by the door for the hat (home-residents.js). */
 hatHook:{position:[2.93,1.6,1.2],yaw:-Math.PI/2}};
export const SHARED_HOME_LAYOUT={bounds:{minX:-3.5,maxX:3.5,minZ:-3.4,maxZ:3.4},spawn:[0,0,2.6],exit:[0,1.1,3.3],door:[0,0,2.8],tableSeatHeight:.41,tableSeatFront:.3};
/** Where Thuan and Thao sleep, eat and leave from in their shared flat. */
const THUAN_APARTMENT_ROUTINES={
 Thuan:{bed:[-4.15,.58,3.95],bedside:[-3.08,0,2.25],table:[-1.6,0,.5],door:[-.45,0,.4],
  cover:{position:[-4.15,.64,3.35],width:1.08,length:1.3,axis:'z'}},
 Thao:{bed:[-1.6,.58,3.95],bedside:[-2.65,0,3.3],table:[-3.98,0,.5],door:[-.45,0,.4],
  cover:{position:[-1.6,.64,3.35],width:1.08,length:1.3,axis:'z'}},
 // Chin, Thao's husband (batch 7b), beside her.
 Chin:{bed:[.95,.58,3.95],bedside:[.0,0,3.3],table:[-2.8,0,.5],door:[-.45,0,.4],
  cover:{position:[.95,.64,3.35],width:1.08,length:1.3,axis:'z'}},
};
export function homeLayoutFor(name){
 if(name===TATAMI_HOME_OWNER)return TATAMI_HOME_LAYOUT;
 if(THUAN_APARTMENT_ROUTINES[name])return THUAN_APARTMENT_ROUTINES[name];
 const household=householdFor(name);if(!household||household.residents.length===1)return HOME_LAYOUT;
 const side=household.residents.indexOf(name)===0?-1:1,x=side*2.1;
 return {...SHARED_HOME_LAYOUT,bed:[x,.58,-.3],bedside:[side*.95,0,-.4],table:[side*.72,0,2.15],
  cover:{position:[x,.64,-.9],width:1.1,length:1.3,axis:'z'},hatHook:{position:[side*1.4,1.6,3.33],yaw:Math.PI}};
}
