import {ISLAND_RESIDENT_NAMES} from '../world/kitahama-layout.js';
import {YARD_RESIDENT_NAMES} from '../world/yard-homes-layout.js';
const shifts={
 // Day staff share the evening service; night staff return on the morning bus.
 // Work hours stay unchanged. Departure identifies the service's arrival time.
 // Thuan: the 08:30 boat from Kitano-jima, the shop 09:00–20:00 and its closing restock, the 22:00 boat home (docs/CAST-CONSOLIDATION.md addendum 4).
 Thuan:{arrival:510,start:540,finish:1200,departure:1320},
 // Nhung: the clinic's surgery, 9:00–17:00 with the lunch gap (clinic-hours.js decides her day; this is her evening's start).
 Nhung:{arrival:510,start:540,finish:1020,departure:1320},
 // Chin: the ferry's motorman (ferry-crew.js FERRY_WORKING_DAY, 06:05–23:15, social.js keeps his street body at the
 // terminal meanwhile); the evening after he signs off is his, the workshop bench and the izakaya.
 Chin:{arrival:360,start:365,finish:1395,departure:1320},
 'Mrs Sato':{arrival:510,start:540,finish:1260,departure:1320},
 // The 30 October Kissa Higa mornings use his cast.js day: breakfast before the radio bench at nine, then the boiler
 // and the yuntaku bench after six. He lives in the yard and never takes these legacy ferry arrival/departure slots.
 Tetsuo:{arrival:510,start:540,finish:1080,departure:1590},
 // Thao takes the morning service so her Konbini errand and park walk happen before
 // Minato opens. Her return service is the next morning after the night shift.
 Thao:{arrival:510,start:960,finish:1620,departure:1950},
 'Officer Mori':{arrival:870,start:1200,finish:1800,departure:1950},
 'Harbour master':{permanent:true},
};
export const COMMUTER_SHIFTS=Object.freeze(Object.fromEntries(Object.entries(shifts).map(([name,shift])=>[name,Object.freeze(shift)])));
const minuteOfDay=m=>((m%1440)+1440)%1440;
/**
 * On the island Mrs Sato cooks the lunch at Sato Ramen: in on the 08:30 ferry, fish from
 * the harbour, the pots on at 10:30, serving 11:00 to 14:00, home on the 14:30. She shuts
 * the counter at two and goes straight down to the pier to wait for it on the quay bench,
 * which also keeps her out of the street behind Sakura when Thuan goes out for her break.
 */
// Lunch is 11:00–14:00 (sato-ramen-layout.js); until 15:00 she washes up and wipes down (people/ramen-kitchen.js).
export const SATO_SHIFT=Object.freeze({arrival:510,start:630,finish:900,departure:930});
// A profile may carry its own shift (a visitor off the ferry has no name in the roster).
export const shiftFor=profile=>{if(profile&&typeof profile==='object'&&profile.shift)return profile.shift;const name=typeof profile==='string'?profile:profile?.name;return (name==='Mrs Sato')?SATO_SHIFT:COMMUTER_SHIFTS[name]||null;};
function elapsed(profile,minutes){const shift=shiftFor(profile);return shift&&!shift.permanent?minuteOfDay(minutes-shift.arrival):null;}

/**
 * The bus somebody actually goes home on.
 *
 * A shift with a lateDeparture has two: the one straight after work, and a later one
 * for the evening they stay out. Rain is what decides it, because rain is what keeps
 * everybody in this town indoors.
 */
export function departureFor(profile,rain=false){
 const shift=shiftFor(profile);
 if(!shift||shift.permanent)return null;
 return !rain&&Number.isFinite(shift.lateDeparture)?shift.lateDeparture:shift.departure;
}

/**
 * The Harbour Line timetable, in minutes past midnight.
 *
 * Three daily calls: morning, afternoon and evening. Residents share services.
 * These are arrival times; the bus waits BUS_DWELL minutes before returning.
 * The bus model, commuters and stop notice all use this schedule.
 */
export const HARBOUR_LINE=Object.freeze([
 510,  //  08:30  day staff arrive; night staff go home
 870,  //  14:30  late-shift staff arrive
1320,  //  22:00  day staff go home
]);

/**
 * The Minato Maru's crossing, in town minutes: worked out from her passage (airport-ferry.js AIRPORT_FERRY.duration),
 * written here so the timetable need not load the ship; tests/ganaha.test.mjs keeps the two the same.
 */
export const CROSSING_MINUTES=22;
/** How long the bus stands at the terminus with its doors open, in town minutes. */
export const BUS_DWELL=15;

/** Minutes until the next service, and which one it is. */
export function nextService(minutes){
 const m=minuteOfDay(minutes);
 for(const service of HARBOUR_LINE)if(service>=m)return {service,wait:service-m};
 return {service:HARBOUR_LINE[0],wait:1440-m+HARBOUR_LINE[0]};
}
export function serviceTime(minutes){
 const m=minuteOfDay(minutes);
 return String(Math.floor(m/60)).padStart(2,'0')+':'+String(Math.floor(m%60)).padStart(2,'0');
}
export function shiftActive(profile,minutes){
 const shift=shiftFor(profile),e=elapsed(profile,minutes);
 return !!shift&&(shift.permanent||e>=shift.start-shift.arrival&&e<shift.finish-shift.arrival);
}
/** On the island the Front-Row staff live in the yard behind the shop and never take the bus. */
export const livesInYard=profile=>YARD_RESIDENT_NAMES.includes(typeof profile==='string'?profile:profile?.name);
/**
 * Since the island grew, Thao, Mrs Sato and (since phase 3) Nhung live in Kitahama (kitahama-layout.js). They keep
 * their own days -- the izakaya, the lunch counter, the clinic -- but where the timetable used to put them on the
 * ferry, they walk home. Thuan is not among them any more: she really does take the boat (addendum 4).
 */
export const livesInKitahama=profile=>ISLAND_RESIDENT_NAMES.includes(typeof profile==='string'?profile:profile?.name);
/** commuterPhase as the town sees it: somebody who lives on the island is never 'away'. */
export function townPhase(profile,minutes,rain=false){
 const phase=commuterPhase(profile,minutes,rain);
 return livesInKitahama(profile)&&['away','arriving'].includes(phase)?'town':phase;
}
/** And two people live where they work: the harbour master in his office, Officer Mori at the police box. */
export const LIVES_AT_WORK=Object.freeze(['Harbour master','Officer Mori']);
export const livesAtWork=profile=>LIVES_AT_WORK.includes(typeof profile==='string'?profile:profile?.name);
export function commuterPhase(profile,minutes,rain=false){
 if(livesInYard(profile)||livesAtWork(profile))return 'town';
 const shift=shiftFor(profile),e=elapsed(profile,minutes);
 if(!shift)return 'town';
 if(shift.permanent)return 'permanent';
 const finish=shift.finish-shift.arrival,departure=departureFor(profile,rain)-shift.arrival;
 if(e<30)return 'arriving';
 if(e>=departure)return 'away';
 if(e>=finish)return 'departing';
 return 'town';
}
