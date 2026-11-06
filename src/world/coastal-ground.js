import {neighbourhoodHeight} from './neighbourhood-ground.js';
import {inShoppingLane,shoppingLaneGroundHeight} from './shopping-lane-plan.js';
import {parkPathAt} from './harbour-park-plan.js';
import {inGarden,gardenHeight,gardenPondAt,gardenGroundHeight,GARDEN} from './garden-layout.js';
import {islandTerrainHeight,islandRouteAt} from './island-plan.js';
import {COASTLINE} from './island-coast.js';
import {polygonTest} from './plan-index.js';
import {headlandHeight} from './coyote-tunnel.js';
import {BEACH,beachHeight,beachAccessHeight,gradedHeight} from './beach-layout.js';
export const ISLAND_GROUND_Y=-.4;
/** Interior of the actual rendered land polygon, including its slanted coast (through its grid, plan-index.js). */
const insideCoast=polygonTest(COASTLINE);
export function onIslandLand(x,z){return insideCoast(x,z);}
/** Surface beyond the authored streets. Water remains outside the playable union. */
export function coastalSurface(x,z){
 const surface=coastalSurfaceBelowGrades(x,z);if(!surface)return surface;
 // Where a path crosses the beach's step onto the town's datum the sand is graded up (beach-layout.js BEACH_GRADES).
 const y=gradedHeight(x,z,surface.y);
 return y===surface.y?surface:{...surface,y};
}
function coastalSurfaceBelowGrades(x,z){
 const access=beachAccessHeight(x,z);if(access!==null)return {id:"beach-access",surface:"stone",y:access};
 if(z>=16.5&&onIslandLand(x,z)){const n=neighbourhoodHeight(x,z);if(n!==null)return {id:"central-neighbourhood",surface:"grass",y:n};}
 const ramp=beachAccessHeight(x,z);
 if(ramp!==null)return {id:'beach-access',surface:'stone',y:ramp};
 const sand=beachHeight(x,z);
 if(sand!==null&&sand>=BEACH.waterY+.025)return {id:BEACH.id,surface:BEACH.surface,y:sand};
 if(inGarden(x,z)){const y=gardenHeight(x,z);if(gardenPondAt(x,z)&&y<0)return null;return {id:GARDEN.id,surface:parkPathAt(x,z)?.surface||'grass',y};}
 const neighbourhood=onIslandLand(x,z)?neighbourhoodHeight(x,z):null;
 if(neighbourhood!==null)return {id:'central-neighbourhood',surface:'grass',y:neighbourhood};
 if(inShoppingLane(x,z))return {id:'kitahama-connector',surface:islandRouteAt(x,z)?.surface||'grass',y:shoppingLaneGroundHeight(x,z)??0};
 const heights=[gardenGroundHeight(x,z),shoppingLaneGroundHeight(x,z)].filter(h=>h!==null),park=heights.length?Math.max(...heights):null;
 if(park!=null)return {id:'garden-approach',surface:islandRouteAt(x,z)?.surface||'grass',y:park};
 const land=onIslandLand(x,z),hill=headlandHeight(x,z);
 if(hill!==null&&hill> (land?ISLAND_GROUND_Y:BEACH.waterY+.025))return {id:'minato-headland',surface:'grass',y:hill};

 if(land&&z>=97){const route=islandRouteAt(x,z);return {id:route?.id||'island-uplands',surface:route?.surface||'grass',y:islandTerrainHeight(x,z)??ISLAND_GROUND_Y};}
 return land?{id:'island-ground',surface:'grass',y:ISLAND_GROUND_Y}:null;
}
