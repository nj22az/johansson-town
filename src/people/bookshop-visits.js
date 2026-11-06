import {TOWN_DESTINATIONS} from '../world/town-grid.js';
/**
 * Short, staggered errands. No visits after closing or while someone is travelling away. Chin's afternoon visit went to
 * Mrs Sato with the consolidation (docs/CAST-CONSOLIDATION.md §9): Chin is the ferry's motorman, aboard until the shore
 * power, and Mrs Sato is on her way home to Kitahama from the washing-up by half past three (Officer Mori, the other
 * one ashore then, is in his morning routine until the station desk at four).
 *
 * Since 22 October 2026 (the owner) the shop floor is shut: Nhung is the island doctor, Sakura sells the books and the
 * stationery, and the back bench prints the paper in the evenings. Nobody browses there, so there are no visits; the
 * errands are Sakura's (market-visits.js).
 */
export const BOOKSHOP_VISITS=Object.freeze({});
export function bookshopVisitPlan(profile,minutes,base,state={}){
 const window=BOOKSHOP_VISITS[profile.name],m=((minutes%1440)+1440)%1440;
 if(state?.bookshop?.completed?.some(v=>v.key===Math.floor(minutes/1440)+':'+profile.name))return base;
 if(!window||m<window[0]||m>=window[1]||!['work','home','park','stroll'].includes(base.place))return base;
 return {place:'bookshop',target:TOWN_DESTINATIONS.books,activity:'browsing at Front-Row Books'};
}
