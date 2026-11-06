import {relationshipsNextYear} from '../people/relationships.js';
/**
 * The island's year starts over. The calendar follows the real date, always in 1997 (town-clock.js); when the real year
 * turns, the next time a save is opened it is 1 January 1997 again on the island. What the player built up with people
 * stays: friendships, the bag, the money and the decorating. Everything else (quests, the shops' and residents' days,
 * the diary and notes, what happened in town) starts fresh, the way the year did the first time.
 *
 * A save remembers which real year it is living (loopYear) and how many times its year has started over (loops).
 */
// The pocket album is kept as the decorating is: the photos are the player's own work.
export const YEAR_KEEPS=Object.freeze(['friendship','inventory','yen','homeDecor','avatarRecipe','sound','radioStation','pocketAlbum','pocketTaken','pocketSeen','concert']);
// A friendship's per-day marks belong to the old year's days.
const DAY_MARKS=['talkDay','giftDay','giftsToday','wantDoneDay'];

export const realYear=(now=new Date())=>now.getFullYear();

/** Has the real year moved on since this save last lived its year? A save from before loops existed has not. */
export const newYearDue=(saved,now=new Date())=>!!saved&&Number.isInteger(saved.loopYear)&&realYear(now)>saved.loopYear;

/**
 * The save to open: unchanged when its year is still running, or the start of a new 1997 when the real year has turned.
 * Returns {saved, turned}.
 */
export function openYear(saved,now=new Date()){
 if(!saved||typeof saved!=='object')return {saved,turned:false};
 if(!Number.isInteger(saved.loopYear))return {saved:{...saved,loopYear:realYear(now),loops:saved.loops|0},turned:false};
 if(!newYearDue(saved,now))return {saved,turned:false};
 const next={loopYear:realYear(now),loops:(saved.loops|0)+1};
 if(saved.relationships)next.relationships=relationshipsNextYear(saved.relationships);
 for(const key of YEAR_KEEPS)if(saved[key]!==undefined)next[key]=structuredClone(saved[key]);
 // A favour's thing goes with the favour: the errand is not kept, so neither is what he was carrying for it.
 const carried=saved.errand?.favour&&typeof saved.errand.item==='string'?saved.errand.item:null;
 if(carried&&Array.isArray(next.inventory)){const i=next.inventory.indexOf(carried);if(i>=0)next.inventory.splice(i,1);}
 if(next.friendship&&typeof next.friendship==='object')for(const f of Object.values(next.friendship))if(f&&typeof f==='object')for(const k of DAY_MARKS)delete f[k];
 next.notes=[`1 January 1997, again. The year on the island has started over (${ordinal(next.loops+1)} time round): the town does not remember last year, but the people you know still know you.`];
 return {saved:next,turned:true};
}
const ordinal=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');
