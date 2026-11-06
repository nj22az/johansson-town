import {MAIN_ROAD} from './main-road.js';
import {FOREST_EDGE} from './forest-edge.js';

export const BUS_STATION=Object.freeze({
 id:'bus-station',x:MAIN_ROAD.x,z:24.9,
 minX:-10.6,maxX:5.4,minZ:MAIN_ROAD.maxZ,maxZ:FOREST_EDGE.roadStartZ,
 queue:Object.freeze([MAIN_ROAD.x,23.05]),
 /**
  * Where you stand on the platform, as opposed to where you queue to board.
  *
  * The queue point is in the bus's own bay, which is right for boarding and wrong for
  * everything else: once the Harbour Line had a collider it covered that point, so the
  * station's doorway spawned you inside the bus and the boot-time stability check has
  * been reporting "door spawn bus-station" ever since. This is the same platform, two
  * metres west of the bus's flank, which is where somebody waiting actually stands.
  */
 platform:Object.freeze([MAIN_ROAD.x-2.3,23.05]),
 arrival:Object.freeze([-6.1,22.45]),
 driver:Object.freeze([4.1,23.35]),
 /**
  * Away / boarding-off waypoint for NPC schedules (not a place to loiter).
  *
  * This used to be [MAIN_ROAD.x, FOREST_EDGE.roadEndZ] — the painted coyote-tunnel
  * mouth. Anyone still visible while phase is `away` (or restored from a save that
  * stored exit) stood in a clump in front of the arch. The bus owns the mouth
  * (MOUTH_Z in bus.js). NPCs stay on the platform / queue / street only.
  */
 exit:Object.freeze([MAIN_ROAD.x-2.3,23.05]),
});
export const BUS_STATION_ROUTES=Object.freeze([
 {id:'bus-approach',width:MAIN_ROAD.width,surface:'asphalt',points:[[BUS_STATION.x,MAIN_ROAD.maxZ],[BUS_STATION.x,BUS_STATION.maxZ]]},
 {id:'bus-platform',width:3.8,surface:'stone',points:[[-8.7,BUS_STATION.queue[1]],[2.2,BUS_STATION.queue[1]]]},
]);

/**
 * True where the terminus lays its own ground: the apron, and the bus road beyond it.
 *
 * Both are built to their own heights, so the lane surfacing must not pave the same
 * patch a second time -- that left the approach, the platform and the road stacked in
 * four sheets a centimetre apart, flashing against each other across the whole
 * northern end of the town.
 */
export const pavedByTerminus=(x,z)=>z>MAIN_ROAD.maxZ&&(
 x>=BUS_STATION.minX&&x<=BUS_STATION.maxX&&z<=BUS_STATION.maxZ
 ||Math.abs(x-FOREST_EDGE.roadX)<=MAIN_ROAD.width/2+2.1&&z<=FOREST_EDGE.roadEndZ);
