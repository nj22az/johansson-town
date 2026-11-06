import {streetClass,STREET_STANDARD} from './street-plan.js';
import {DEPOT_COURT,depotCourtAt} from './architecture-ground.js';
import {ARCHITECTURE_ROUTES} from './architecture-plan.js';
import {houseboatSurface} from './fujita-houseboat.js';
import {routeFinder} from './plan-index.js';
import {DOCKLANDS,docklandsAt} from './docklands-layout.js';
import {ISLAND_ROUTES} from './island-plan.js';
import {airportSurface} from './airport-ground.js';
import {kitanoRoadAt} from './kitano-link-plan.js';
import {COAST_BOUNDS} from './island-coast.js';
import {DINING,NIGHT_LANE,inDiningLane,IZAKAYA_LANE} from './dining-layout.js';
import {oilJettyAt,oilJettyHeight} from './oil-jetty-layout.js';
const OIL_JETTY_ROUTE=Object.freeze({id:'oil-jetty',surface:'stone'});
import {PARK,parkHeight,parkApproachHeight,parkSkirtHeight} from './park-layout.js';
import {inHarbourPark,harbourPondAt,parkPathAt,HARBOUR_PARK_PATHS} from './harbour-park-plan.js';
import {MAIN_ROAD,SHOP_CROSSING_Z} from './main-road.js';
import {BUS_STATION,BUS_STATION_ROUTES} from './bus-station.js';
import {FOREST_EDGE} from './forest-edge.js';
import {CAVE_MOUTH,CAVE_ACTIVE} from './coyote-tunnel.js';
import {coastalSurface} from './coastal-ground.js';
import {beachAccessHeight,gradedHeight} from './beach-layout.js';
import {EAST_LAWN,eastLawnAt} from './east-lawn.js';
import {WEST_YARD,westYardAt} from './west-yard.js';
import {STAFF_YARD_ROUTE} from './staff-bench.js';
import {SCHOOL,schoolAt} from './school-layout.js';
import {NISHI,nishiAt,EAST_QUAY,eastQuayAt} from './okinawa/layout.js';
import {KITAHAMA,kitahamaLaneAt} from './kitahama-layout.js';
import {GROUND_LAYER} from './ground-layers.js';
import {mainStreetTop} from './ground-plan.js';
const KITAHAMA_ROUTE=Object.freeze({id:'kitahama-lane',surface:'stone'});
// Rendering, grounding and navigation use the same compact street network.
export const BOARDWALK=Object.freeze({x:MAIN_ROAD.x,minZ:-38,maxZ:8,width:MAIN_ROAD.width});
/**
 * The outer pier: from the quay's edge (z -49.65) out to z -88, lengthened from 15.3 m in 2026-10 for
 * the bigger Minato Maru, which lies along its west face (docs/FERRY-AUDIT.md §6, batch 3; its fittings
 * are in minato-berth.js). `open` is how far out you can walk: to the end rail at z -87.6, less the
 * lifebuoy hung on it (batch 4a; before, to the old end at -64.95).
 */
export const OUTER_PIER=Object.freeze({x:0,z:-68.825,width:8.2,length:38.35,height:.098,open:-87.35});
/**
 * The harbour's breakwater: a 68 m wall across the mouth, 4 m thick, a beacon at x ±27; its centre at
 * z -106 since 2026-10 (it stood at -83), so the basin inside is 54 m from the quay (batch 3).
 */
export const BREAKWATER=Object.freeze({minX:-34,maxX:34,z:-106,thickness:4});
/** The seaward edge of the quay, where its slab gives way to the outer pier. */
export const QUAY_SOUTH=-50;

const boardwalkRoute={id:'harbour-boardwalk',width:BOARDWALK.width,surface:'asphalt',points:[[BOARDWALK.x,BOARDWALK.maxZ],[BOARDWALK.x,BOARDWALK.minZ]]};
export const ROUTES = [
 {id:'shotengai',width:MAIN_ROAD.width,surface:'asphalt',points:[[MAIN_ROAD.x,MAIN_ROAD.maxZ],[MAIN_ROAD.x,MAIN_ROAD.minZ]]},
 {id:'quay',width:12,surface:'stone',points:[[-17,-44],[17,-44]]},
 {id:'outer-pier',width:8.2,surface:'wood',points:[[0,-44],[0,OUTER_PIER.open+.45]]},
 ...BUS_STATION_ROUTES,
 {id:'shop-crossing',width:3,surface:'stone',points:[[MAIN_ROAD.pavementWest,SHOP_CROSSING_Z],[MAIN_ROAD.pavementEast,SHOP_CROSSING_Z]]},
 // Across the zebra to the east footway, where the park's approach begins (harbour-park-plan.js park-approach): it ended in
 // the park's lawn past the footway, a way that went nowhere (the ground audit's dead end).
 {id:'south-shop-crossing',width:3,surface:'stone',points:[[MAIN_ROAD.pavementWest,-18],[HARBOUR_PARK_PATHS[0].points[0][0],-18]]},
 // Ends at the footway's edge: the police station stands on the lawn it used to run into (police-station-layout.js).
 {id:'east-alley',width:3,surface:'stone',points:[[0,18.4],[5.65,18.4]]},
 {id:'second-pier',width:2.2,surface:'wood',points:[[-37.35,-46.2],[-37.35,-55.5]]},
 {id:'izakaya-door',width:3,surface:'asphalt',points:IZAKAYA_LANE},
 {id:'ramen-door',width:2.8,surface:'stone',points:[[0,DINING.ramenDoor[1]],DINING.ramenDoor]},
 {id:'office-door',width:2.6,surface:'stone',points:[[13.3,-36],[13.3,-37.55]]},
 {id:'office-crossing',width:3,surface:'stone',points:[[0,-36],[18,-36]]},
 {id:'south-cut',width:3,surface:'stone',points:[[0,-36],[-12,-36]]},
 {id:'market-cut',width:3,surface:'stone',points:[[0,-26],[-5.5,-26]]},
 STAFF_YARD_ROUTE,
 ...ISLAND_ROUTES,
 ...ARCHITECTURE_ROUTES,
].map(route=>{const street=streetClass(route);return {...route,street,access:route.park?'pedestrians':STREET_STANDARD[street].access};});
export function activeRoutes(){return ROUTES;}
/** The routes past the first three (asked for on their own in regionAt), through their index (plan-index.js). */
const findRoute=routeFinder(ROUTES,{from:3});
export function nearestOnSegment(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],q=dx*dx+dz*dz;const t=q?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/q)):0;return {x:a[0]+dx*t,z:a[1]+dz*t,t,d:Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)};}
export const LANDINGS=[];
/**
 * Walkable ground, as the union of every region below.
 *
 * Each region is asked whether it holds a circle of the given radius on its own, which
 * is the right question for a region standing in open ground and the wrong one wherever
 * two of them meet. The pavement's east kerb and the lawn beside it are the same ground
 * to look at and to stand on, but the pavement gives up a body's radius short of its
 * edge and the lawn only starts a radius past it, so between them lay a band 0.7m wide
 * that both regions would have covered and neither would accept: twenty metres of
 * invisible wall along the kerb, with grass on the far side of it.
 *
 * So the strict answer is taken when there is one, and when there is not, the circle is
 * tested against the union instead: the centre and eight points around its rim each
 * have to land on some region, any region. On open ground that costs one call, because
 * the strict test answers first; only within a radius of an edge is the rim walked.
 */
const RIM=[[1,0],[-1,0],[0,1],[0,-1],[.7071,.7071],[.7071,-.7071],[-.7071,.7071],[-.7071,-.7071]];
export function routeAt(x,z,r=0){
 if(harbourPondAt(x,z,r))return null;
 if(globalThis.__JOHANSSON_WALK_SURFACE__?.level?.(x,z)!=null)return {id:"building-stairs",surface:"stone"};
 const strict=regionAt(x,z,r);
 if(strict||!(r>0))return strict;
 const here=regionAt(x,z,0);
 if(!here)return null;
 for(const [dx,dz] of RIM)if(!regionAt(x+dx*r,z+dz*r,0))return null;
 return here;
}
function regionAt(x,z,r=0){
 if(depotCourtAt(x,z))return DEPOT_COURT;
 const boat=houseboatSurface(x,z,r);if(boat)return boat;

 if(inDiningLane(x,z))return {id:'shop-pavement',surface:'stone'};

 if(x>=BUS_STATION.minX+r&&x<=BUS_STATION.maxX-r&&z>=BUS_STATION.minZ+r&&z<=BUS_STATION.maxZ-r)return {id:BUS_STATION.id,surface:'stone'};
 // The footpath up past the old terminus to the sea cave, and a couple of metres into
 // its mouth, where the way down into the dungeon is.
 if(CAVE_ACTIVE&&Math.abs(x-FOREST_EDGE.roadX)<=MAIN_ROAD.width/2-r
  &&z>=MAIN_ROAD.maxZ&&z<=CAVE_MOUTH.inside+.4-r)return {id:'cave-path',surface:'gravel'};
 // Kitano Road and its bridge, east of Main Street's kerb: asked before the lawn, the beach
 // and the airport, which it crosses on its own level. See kitano-link-plan.js.
 if((x>MAIN_ROAD.pavementEast)){const road=kitanoRoadAt(x,z,r);if(road)return road;}
 if(inHarbourPark(x,z,-r))return parkPathAt(x,z)||PARK;
 if(oilJettyAt(x,z,r))return OIL_JETTY_ROUTE;
 // The park is asked first, so the lawn is the ground around its mound rather than a
 // lid over it, and its ramp keeps its own paving where the two overlap.
 // Match the ends of the actual decks, without round route caps over water.
 if(x>=MAIN_ROAD.pavementWest&&x<=MAIN_ROAD.pavementEast-r&&z>=MAIN_ROAD.minZ&&z<=MAIN_ROAD.maxZ-r){
  if(x>=MAIN_ROAD.west&&x<=MAIN_ROAD.east)return z<=BOARDWALK.maxZ?boardwalkRoute:ROUTES[0];
  return {id:'main-street-pavement',surface:'stone'};
 }
 if(docklandsAt(x,z,r))return DOCKLANDS;
 if(Math.abs(x)<=19-r&&z>=-49.7&&z<=-38)return ROUTES[1];
 if(Math.abs(x)<=OUTER_PIER.width/2-r&&z>=Math.max(OUTER_PIER.z-OUTER_PIER.length/2,OUTER_PIER.open)+r&&z<=-49.7)return ROUTES[2];
 const route=LANDINGS.find(p=>Math.abs(x-p.x)<=p.w/2-r&&Math.abs(z-p.z)<=p.d/2-r)||findRoute(x,z,r);
 if(route)return route;
 // The lawn is asked last, so the park's mound, its ramp and every authored path keep
 // their own surface and the green is simply whatever is left over. Asking it earlier
 // cut holes it then had to patch: each one left a dead band a body wide where neither
 // the lawn nor what it deferred to would have you, and on open grass that is an
 // invisible wall.
 if(eastLawnAt(x,z,r))return EAST_LAWN;
 // The school grounds, through the gate in the windbreak at the lawn's south end.
 if(schoolAt(x,z,r))return SCHOOL;
 // ...and the same on the shop side, where the konbini stood in an invisible box with
 // only its frontage on ground you could stand on.
 if(westYardAt(x,z,r))return WEST_YARD;
 // Nishi-machi, through the lane openings in the yard wall and along the quay.
 if(nishiAt(x,z,r))return NISHI;
 // The auction shed and ice plant, on the quay east of the harbour office.
 if(eastQuayAt(x,z,r))return EAST_QUAY;
 // Kitahama's lanes, laid on the island's ground.
 if(kitahamaLaneAt(x,z,r))return KITAHAMA_ROUTE;
 {
  const airport=airportSurface(x,z,r);if(airport)return airport;
  const surface=coastalSurface(x,z);
  if(surface&&(!(r>0)||RIM.every(([dx,dz])=>coastalSurface(x+dx*r,z+dz*r))))return surface;
 }
 return null;
}
/**
 * Installs the drawn-surface lift (walk-surface.js); null takes it away again. It is kept
 * on the global object because this module is loaded under more than one URL (game.js asks
 * for it with ?snappy=1), and every copy has to stand people on the same ground.
 */
export function setWalkSurface(surface){globalThis.__JOHANSSON_WALK_SURFACE__=surface||null;}
/** Where feet go: the plan's ground, lifted onto whatever slab is drawn over it. */
export function groundHeight(x,z){const h=planHeight(x,z),walk=globalThis.__JOHANSSON_WALK_SURFACE__;return walk?(walk.level?.(x,z)??(h+walk.lift(x,z))):h;}
export function planHeight(x,z){
 const berthHeight=oilJettyHeight(x,z);if(berthHeight!==null)return berthHeight;
 if(depotCourtAt(x,z))return 0;
 const boat=houseboatSurface(x,z);if(boat)return boat.y;
 {
  if(x>MAIN_ROAD.pavementEast){const road=kitanoRoadAt(x,z);if(road)return road.y;}
  if(docklandsAt(x,z))return DOCKLANDS.y;
  // These slabs were built at the town datum. The garden's surrounding banks and
  // the beach continue underneath them, but must not replace their finished floor.
  // At the north end of Main Street that put a 40 cm invisible cliff across the
  // pavement; the drawn-surface sampler cannot lift a person through so large a step.
  const street=x>=MAIN_ROAD.pavementWest&&x<=MAIN_ROAD.pavementEast&&z>=MAIN_ROAD.minZ&&z<=MAIN_ROAD.maxZ;
  const station=x>=BUS_STATION.minX&&x<=BUS_STATION.maxX&&z>=BUS_STATION.minZ&&z<=BUS_STATION.maxZ;
  // Main Street's ground is laid from its plan (ground-plan.js), the carriageway and its bays a kerb under the
  // footways: feet go down onto the road, up the kerb, along the ramp, at the heights they are drawn at.
  if(street||station)return mainStreetTop(x,z)??0;
  // The east quay is at the datum too (its apron 6 cm over it, walk-surface.js): the beach beside it is graded up to it.
  if(eastLawnAt(x,z)||westYardAt(x,z)||nishiAt(x,z)||schoolAt(x,z)||eastQuayAt(x,z))return 0;
  if(kitahamaLaneAt(x,z))return KITAHAMA.y+GROUND_LAYER.lane;
  const garden=coastalSurface(x,z);if(garden?.id==='harbour-park')return garden.y;
  const airport=airportSurface(x,z);if(airport)return airport.y;
  const ramp=beachAccessHeight(x,z);if(ramp!==null)return gradedHeight(x,z,ramp);
  const coast=coastalSurface(x,z);if(coast&&coast.id!=='island-ground')return coast.y;
 }
 if(inDiningLane(x,z))return NIGHT_LANE.y;
 const ramp=parkApproachHeight(x,z);if(ramp!==null)return ramp;
 const ph=parkHeight(x,z);if(ph!==null)return ph;
 const skirt=parkSkirtHeight(x,z);if(skirt!==null)return skirt;
 if(Math.abs(x-OUTER_PIER.x)<=OUTER_PIER.width/2&&Math.abs(z-OUTER_PIER.z)<=OUTER_PIER.length/2)return OUTER_PIER.height;
 if(kitahamaLaneAt(x,z))return KITAHAMA.y+GROUND_LAYER.lane;
 // A route describes where one may walk, but does not replace its ground datum.
 // The radio trail and coastal road over plain island ground must stay at -.4;
 // Checking only the plain region id loses that datum when a terrain route
 // supplies its own id. Finished harbour decks retain their existing zero datum.
 {
  const region=regionAt(x,z,0);
  if(region?.id==='island-ground'||region?.terrain)return -.4;
 }
 return 0;
}
export const MAP_BOUNDS={minX:COAST_BOUNDS.minX-3,maxX:420,minZ:-460,maxZ:COAST_BOUNDS.maxZ+3};
