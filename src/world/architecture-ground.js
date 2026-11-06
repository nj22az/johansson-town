import {BEACH_EDGES} from './beach-layout.js';
/**
 * The fuel depot stands on a level service court at the beach's south end, beside the quay; the forklift's bay is on the
 * quay north of the auction shed. Both are laid by the ground generator (ground-plan-harbour.js), flush concrete and the
 * quay's apron; here they are only the walkable regions and the plan's level (layout.js).
 */
export const DEPOT_COURT=Object.freeze({id:'fuel-service-court',surface:'stone',...BEACH_EDGES.court,y:0});
export const WORKSHOP_BAY=Object.freeze({id:"quay-workshop-bay",surface:"stone",minX:38.7,maxX:42.3,minZ:-43,maxZ:-38,y:0});
export function depotCourtAt(x,z){return [DEPOT_COURT,WORKSHOP_BAY].some(p=>x>=p.minX&&x<=p.maxX&&z>=p.minZ&&z<=p.maxZ);}
