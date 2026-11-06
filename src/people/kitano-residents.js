import {KITANO_HAMLET,hamletGate} from '../world/kitano-hamlet-layout.js';
import {airportWorld} from '../world/airport-ground.js';
/**
 * The walking residents who live in Kitano hamlet on Kitano-jima (batch 7b; docs/KITANO-JIMA.md §3), by plot, and the
 * home record their profiles read (residents.js), the way Kitahama's residents have theirs (kitahama-layout.js). They
 * cannot walk there from Minato: in town they are ferry commuters, away "at home on Kitano-jima" between the boats.
 * Thuan is Johansson's wife and lives with him at kitano-1 and nowhere else (docs/CAST-CONSOLIDATION.md addendum 4,
 * phase 3): the 08:30 boat in, the 22:00 boat home, and the weekend on the island while the shop shuts on Saturday and Nhung keeps it on Sunday.
 */
// Only Johansson and Thuan live on the hamlet (the creator, 2026-10-12), and only Thuan is a walking resident of the town.
export const KITANO_RESIDENT_HOMES=Object.freeze({'kitano-1':Object.freeze(['Thuan'])});
export const KITANO_RESIDENT_NAMES=Object.freeze(Object.values(KITANO_RESIDENT_HOMES).flat());
export const KITANO_ADDRESS='Kitano hamlet, Kitano-jima';
export function kitanoHomeFor(name){
 for(const [id,names] of Object.entries(KITANO_RESIDENT_HOMES))if(names.includes(name)){
  const p=KITANO_HAMLET.plots.find(q=>q.id===id),{door}=hamletGate(p),[x,z]=airportWorld(door[0],door[1]);
  return {door:[x,z],address:KITANO_ADDRESS,plot:id};
 }
 return null;
}
export const livesOnKitano=profile=>KITANO_RESIDENT_NAMES.includes(typeof profile==='string'?profile:profile?.name);
