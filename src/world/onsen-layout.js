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

/**
 * Umi-no-yu's boiler (風呂釜): the oil-fired heater for the bath's sea water, in the open at the back corner of the
 * bathhouse on the park side, where the bathhouse meets the bath's fence, standing on the garden's ground (the ground
 * is the ground standard's: no slab of its own) with its kerosene tank on a stand and its flue up the wall. Model frame (park-onsen.js builds it; x across, the bathhouse's wall at x -3.8; z along
 * it, the fence from z -0.2 back). Who: Tetsuo keeps it under contract (people/cast.js: he lights it at six and tends it
 * from eight until the bath closes at ten); Christina owns it. Why here: outside, so the burner's fumes and the oil are
 * out of the bath, at the corner where the hot water goes straight in to the baths, and away from the street front and
 * the footbath. He works it standing in front of it on the lawn (`stand`, facing it), never inside the bath and never in
 * swimwear (people/onsen-boiler.js).
 */
export const ONSEN_BOILER=Object.freeze({
 who:'Tetsuo',owner:'Christina',
 why:'The bath’s sea water is heated by an oil-fired boiler outside the back corner of the bathhouse: the fumes and the kerosene stay out of the bath, and the hot water goes straight in to the baths. Tetsuo lights it at six and keeps it until the bath shuts at ten.',
 unit:Object.freeze({x0:-4.3,x1:-3.86,z0:.1,z1:.7,foot:.003,top:.88}),
 tank:Object.freeze({x0:-4.28,x1:-3.88,z0:.95,z1:1.7,foot:.46,top:1.06}),
 flue:Object.freeze({x:-4.02,z:.4,r:.05,top:2.45}),
 /** Where he stands to work it: on the lawn in front of the unit, facing it (local +x is the town's +z). */
 stand:Object.freeze(onsenPoint(-4.85,.4)),facing:Object.freeze([0,1]),
});
