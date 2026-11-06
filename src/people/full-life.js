/**
 * One switch for the residents' fuller life: stand points in their days (stand-points.js) and the quay's shared spots
 * (quay-breaks.js). On by default; an edition that has to keep the web light can turn it off (setFullLife(false)), and
 * those residents fall back to one target a phase and no quay breaks. Sakura's till queue is not behind it: it only runs
 * while customers are in the shop, with no path search of its own.
 */
const options={fullLife:true,standFor:null};
export const fullLife=()=>options.fullLife;
export function setFullLife(on=true){options.fullLife=on!==false;}
/**
 * Who keeps their stand points (edition.js): everybody on Linux (no filter); on the web only a resident in view or in
 * the room the player is in (game.js, people/attention.js). The others keep one target a phase, which the web's
 * timetable puts them on without a walk. `fn(name)` says whether this resident stands on their points now.
 */
export function setStandFilter(fn=null){options.standFor=typeof fn==='function'?fn:null;}
export const standsFor=name=>!options.standFor||!!options.standFor(name);
export {options as lifeOptions};
