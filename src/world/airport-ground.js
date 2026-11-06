import {AIRPORT_ISLAND,AIRPORT_JETTY} from './airport-island.js';
import {AIRPORT_PLAZA} from './airport-district-plan.js';
import {TROPIC_PLACES,tropicHeight,tropicSurface} from './tropical-island.js';
import {SEA_LEVEL} from './ocean.js';
import {GROUND_LAYER} from './ground-layers.js';
import {KITANO_HAMLET_FLOORS} from './kitano-hamlet-layout.js';
export function airportWorld(x,z){const a=AIRPORT_ISLAND,c=Math.cos(a.yaw),s=Math.sin(a.yaw);return [a.x+c*x+s*z,a.z-s*x+c*z];}
export function airportLocal(x,z){const a=AIRPORT_ISLAND,dx=x-a.x,dz=z-a.z,c=Math.cos(a.yaw),s=Math.sin(a.yaw);return [c*dx-s*dz,s*dx+c*dz];}
export const AIRPORT_HEIGHT=SEA_LEVEL+1.1;
export const AIRPORT_PAVEMENT_HEIGHT=AIRPORT_HEIGHT+GROUND_LAYER.grass;
/** The drawn cargo slab overlaps the shoreward pier and is the highest floor there. */
export const AIRPORT_CARGO_SURFACE=Object.freeze({minX:-52,maxX:-11,minZ:21,maxZ:35,y:AIRPORT_HEIGHT+.12});
export const AIRPORT_PIER_HEIGHT=SEA_LEVEL+AIRPORT_JETTY.top;
// Match the raised slab in airport-district.js.
const [LOOK_U,LOOK_V]=TROPIC_PLACES.lookout,LOOK={minX:LOOK_U-3,maxX:LOOK_U+3,minZ:LOOK_V-3,maxZ:LOOK_V+3};
let lookTop=-Infinity;for(let u=LOOK.minX;u<=LOOK.maxX;u+=.5)for(let v=LOOK.minZ;v<=LOOK.maxZ;v+=.5)lookTop=Math.max(lookTop,tropicHeight(u,v));
export const AIRPORT_PUBLIC_FLOORS=Object.freeze([
 {id:'airport-terminal-plaza',...AIRPORT_PLAZA,y:AIRPORT_HEIGHT+.06},
 // The Hinata lookout deck stands just clear of the highest ground under it.
 {id:'kitano-lookout',...LOOK,y:SEA_LEVEL+lookTop+.12},
 // Kitano hamlet's lane and yards (kitano-hamlet-layout.js), slabs over the uneven plateau south of the cargo court.
 ...KITANO_HAMLET_FLOORS.map(f=>({...f,y:SEA_LEVEL+f.y,...(f.slope?{slope:{...f.slope,y1:SEA_LEVEL+f.slope.y1}}:{})})),
].map(Object.freeze));
/** A public floor's height at the island's v: level, or a flight of steps rising along v (`slope`: from y at v0 to y1 at v1). */
export function floorHeight(f,v){
 if(!f.slope)return f.y;
 const {v0,v1,y1}=f.slope,t=Math.max(0,Math.min(1,(v-v0)/(v1-v0)));
 return f.y+(y1-f.y)*t;
}
export const AIRPORT_LANDING=Object.freeze(airportWorld(...AIRPORT_JETTY.landing));
export const AIRPORT_LANDING_HEIGHT=airportSurface(...AIRPORT_LANDING)?.y??AIRPORT_PIER_HEIGHT;
export const AIRPORT_COUNTER=Object.freeze(airportWorld(-10,18.7));
/**
 * Passenger side only: the runway, apron, sewage works and hangar are behind the airport
 * fence. South of it the whole island is open: the plaza, the beaches, the jungle trail.
 */
export function airportSurface(x,z,r=0){
 const [u,v]=airportLocal(x,z);
 // A micrometre of slack: a point on a floor's drawn edge (rounding through the island's turn) is on that floor.
 const E=1e-6,within=s=>u>=s.minX+r-E&&u<=s.maxX-r+E&&v>=s.minZ+r-E&&v<=s.maxZ-r+E;
 const cargo=AIRPORT_CARGO_SURFACE;if(within(cargo))return {id:'airport-cargo-court',surface:'asphalt',y:cargo.y};
 const floor=AIRPORT_PUBLIC_FLOORS.find(within);if(floor)return {id:floor.id,surface:'stone',y:floorHeight(floor,v)};
 if(within(AIRPORT_JETTY))return {id:'airport-jetty',surface:'stone',y:AIRPORT_PIER_HEIGHT};
 if(within({minX:-44,maxX:44,minZ:19.4,maxZ:20.8}))return {id:'airport-terminal-approach',surface:'stone',y:SEA_LEVEL+1.14};
 if(within({minX:-44,maxX:44,minZ:17,maxZ:19.7}))return {id:'airport-passenger-walk',surface:'stone',y:AIRPORT_PAVEMENT_HEIGHT};
 if(within({minX:-19,maxX:-1,minZ:16.5,maxZ:19.7}))return {id:'airport-terminal',surface:'stone',y:AIRPORT_PAVEMENT_HEIGHT};
 // The rest of the island, from the fence to the water's edge (feet stay dry).
 if(v-r<TROPIC_PLACES.fence+.25||u-r<TROPIC_PLACES.quayU+.4)return null;
 if(r>0&&[[u-r,v],[u+r,v],[u,v-r],[u,v+r]].some(([a,b])=>tropicHeight(a,b)<=.18))return null;
 const h=tropicHeight(u,v);if(h<=.18)return null;
 return {id:'kitano-jima-island',surface:tropicSurface(u,v),y:SEA_LEVEL+h};
}
