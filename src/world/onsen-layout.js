import {HARBOUR_ONSEN} from './harbour-park-plan.js';
/**
 * Where Umi-no-yu stands, without the building: people plan walks to its door from this,
 * and park-onsen.js builds the bathhouse on it.
 */
export const ONSEN=Object.freeze({...HARBOUR_ONSEN,opens:600,closes:1320,fee:300});

/** A point in the model's own frame, in the town's. */
export function onsenPoint(x,z){
 const c=Math.cos(ONSEN.yaw),s=Math.sin(ONSEN.yaw);
 return [ONSEN.x+x*c+z*s,ONSEN.z-x*s+z*c];
}

/** The porch remains the safe player exit; residents enter across the facade at Z=4.2. */
export const ONSEN_APPROACH=Object.freeze(onsenPoint(-1.4,5.4));
export const ONSEN_DOOR=Object.freeze(onsenPoint(-1.4,4.0));
/** Small enough that an arrival must have crossed the facade, rather than the lawn. */
export const ONSEN_ENTRY_RADIUS=.15;

export const onsenOpen=minutes=>{const m=((minutes%1440)+1440)%1440;return m>=ONSEN.opens&&m<ONSEN.closes;};
