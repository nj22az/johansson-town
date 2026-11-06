/**
 * How drunk someone is, on one scale for the player and every resident.
 *
 * `tipsy` runs from 0 (sober) to 4. Each drink adds its `alcohol` (izakaya-beer.js);
 * from DRUNK up the walk goes (animate.js). Nobody drinks past LIMIT: residents stop
 * ordering, and Thao stops pouring for the player -- drunk, yes, but never on the floor.
 * The body sobers by SOBER_PER_HOUR every town hour.
 */
/** A can of Umineko lager from Sakura, drunk wherever you are. Minato's can is .8 too. */
export const LAGER_ALCOHOL=.8;
export const DRUNK=2.5,LIMIT=3,SOBER_PER_HOUR=1,MAX_TIPSY=4;

/** One more? Only while there is room under the limit for it. */
export function wantsAnother(tipsy,alcohol=1){return (tipsy||0)+alcohol*.5<LIMIT;}

/** After a drink: never above MAX_TIPSY. */
export function drink(tipsy,alcohol){return Math.min(MAX_TIPSY,(tipsy||0)+Math.max(0,alcohol||0));}

/** Town minutes pass and the body clears. */
export function soberUp(tipsy,minutes){return Math.max(0,(tipsy||0)-Math.max(0,minutes||0)/60*SOBER_PER_HOUR);}
