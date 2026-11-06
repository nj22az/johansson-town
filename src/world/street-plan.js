import {MAIN_ROAD,MAIN_SERVICE_COURT,MAIN_LOADING_APRON,MAIN_PARKING_LAYBY} from './main-road.js';
import {KITANO_ROAD} from './kitano-link-plan.js';
import {HARBOUR_PARK_PATHS} from './harbour-park-plan.js';
/** The bus plaza's north edge, where Main Street's ground ends (bus-station.js BUS_STATION.maxZ). */
const MAIN_STREET_MAX_Z=29.3;

/** Compact Minato street hierarchy, in metres. Existing frontage setbacks are retained.
 * Local lanes are shared access, not a second arterial road. Coast/circuits are foot-only.
 * Higher priority owns junctions; pedestrian routes never pave over a carriageway. */
export const STREET_STANDARD=Object.freeze({
 main:{width:MAIN_ROAD.width,surface:'asphalt',access:'vehicles',priority:60},
 commercial:{width:KITANO_ROAD.section.carriageway*2,surface:'asphalt',access:'vehicles',priority:60},
 residential:{width:3,collectorWidth:4,surface:'concrete',access:'shared',priority:40},
 harbour:{surface:'concrete',access:'service',priority:50},
 footway:{surface:'stone',access:'pedestrians',priority:30},
 circuit:{width:2,surface:'concrete',access:'pedestrians',priority:20},
 coast:{width:2.4,surface:'concrete',access:'pedestrians',priority:10},
 boardwalk:{width:1.2,surface:'wood',access:'pedestrians',priority:10},
});
export function streetClass(route){
 if(route.id==='quay')return 'harbour';
 if(route.id==='outer-pier')return 'boardwalk';
 if(route.id==='shotengai'||route.id==='main-street-extension')return 'main';
 if(route.id==='island-coast-walk')return 'coast';
 if(route.id==='fujita-shed-circuit'||route.id==='second-pier')return 'boardwalk';
 if(route.id.startsWith('building-circuit-'))return 'circuit';
 // A building's own forecourt (the police station's yard) is concrete like its circuit, and gives way like it.
 if(route.forecourt)return 'circuit';
 if(route.id.includes('footway')||route.id==='island-shopping-lane')return 'footway';
 if(/neighbourhood-lane|nishi-|residential-cross-lane|kitahama-west/.test(route.id))return 'residential';
 return 'footway';
}
export const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
const bounds=p=>({minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minZ:Math.min(...p.map(v=>v[1])),maxZ:Math.max(...p.map(v=>v[1]))});
const overlap=(a,b)=>a.minX<b.maxX-1e-8&&a.maxX>b.minX+1e-8&&a.minZ<b.maxZ-1e-8&&a.maxZ>b.minZ+1e-8;
export const rectangle=(x0,x1,z0,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
function halfPlane(poly,a,b,inside){
 const side=p=>((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*(inside?1:-1),out=[];
 for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],d=side(p),e=side(q);
  if(d>=-1e-9)out.push(p);
  if((d>1e-9&&e< -1e-9)||(d< -1e-9&&e>1e-9)){const t=d/(d-e);out.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
 }
 return out;
}
/** Convex difference, returning disjoint convex pieces. No depth bias conceals duplicates. */
export function subtractPolygon(poly,mask){
 if(!overlap(bounds(poly),bounds(mask)))return [poly];
 let remaining=poly;const out=[];
 for(let i=0;i<mask.length&&remaining.length>=3;i++){
  const a=mask[i],b=mask[(i+1)%mask.length],outside=halfPlane(remaining,a,b,false);
  if(outside.length>=3&&area(outside)>1e-8)out.push(outside);
  remaining=halfPlane(remaining,a,b,true);
 }
 return out;
}
/** Square ends for grid streets, bevelled (not stacked round-disc) coastal corners. */
export function routePolygons(route){
 const out=[],w=route.width/2;
 for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(!len)continue;
  if(route.id==='main-street-extension'){out.push(rectangle(a[0]-w,a[0]+w,Math.min(a[1],b[1]),Math.max(a[1],b[1])));continue;}
  if(!dx||!dz){out.push(rectangle(Math.min(a[0],b[0])-w,Math.max(a[0],b[0])+w,Math.min(a[1],b[1])-w,Math.max(a[1],b[1])+w));continue;}
  const ox=-dz/len*w,oz=dx/len*w;
  out.push([[a[0]-ox,a[1]-oz],[b[0]-ox,b[1]-oz],[b[0]+ox,b[1]+oz],[a[0]+ox,a[1]+oz]]);
 }
 // Fill diagonal bends with a small bevel; ownership subtraction removes the overlap.
 for(const [x,z] of (route.id==='main-street-extension'?[]:route.points))out.push([[x-w,z],[x,z-w],[x+w,z],[x,z+w]]);
 return out;
}
/** Areas already rendered by specialist builders. Keep their decks, park paths and access.
 * Exact masks let the common paving meet them at an edge instead of crossing on top. */
export function specialistStreetMasks(){
 const rect=b=>rectangle(b.minX,b.maxX,b.minZ,b.maxZ);
 const K=KITANO_ROAD;
 // Main Street and the bus plaza, and the quays, are laid by the ground generator (ground-plan.js, ground-plan-harbour.js).
 return [rectangle(-8.1,5.75,MAIN_ROAD.minZ,MAIN_ROAD.maxZ),rectangle(MAIN_ROAD.pavementWest,MAIN_ROAD.pavementEast,MAIN_ROAD.maxZ,MAIN_STREET_MAX_Z),
  rectangle(-40.1,19,-50,MAIN_ROAD.minZ),rectangle(19,44.3,-49.6,MAIN_ROAD.minZ),
  rectangle(K.corners[0][0],K.corners.at(-1)[0],K.corners[0][1]-K.section.footway,K.corners[0][1]-K.section.north),
  ...[MAIN_SERVICE_COURT,MAIN_LOADING_APRON,MAIN_PARKING_LAYBY].map(rect),
  ...HARBOUR_PARK_PATHS.flatMap(routePolygons)];
}
/** Old garden diagonals and shopping connector are navigation aliases of the new grid.
 * Their paving is retired; the Main Street footway and plot circuits provide the connection. */
export const retiredStreetOverlay=r=>r.id.startsWith('neighbourhood-')||r.id==='island-shopping-lane';
/**
 * Every route's paving as the junction owner cuts it (a higher-priority route owns where two cross; the specialist masks
 * are left out), before anything is given to a ground plan: the pieces the plans lay from (ground-walks.js).
 */
export function streetPieces(routes){
 const masks=specialistStreetMasks().map(p=>({polygon:p,bounds:bounds(p)})),pieces=[];
 const ordered=routes.filter(r=>!r.park&&r.id!=='second-pier'&&r.id!=='fujita-shed-circuit'&&!retiredStreetOverlay(r))
  .map(route=>({route,kind:streetClass(route)})).sort((a,b)=>STREET_STANDARD[b.kind].priority-STREET_STANDARD[a.kind].priority);
 for(const {route,kind} of ordered)for(const polygon of routePolygons(route)){
  const box=bounds(polygon);let list=[polygon];
  for(const mask of masks){if(!overlap(box,mask.bounds))continue;list=list.flatMap(p=>subtractPolygon(p,mask.polygon));if(!list.length)break;}
  for(const p of list)if(area(p)>1e-6)pieces.push({polygon:p,route:route.id,kind,surface:STREET_STANDARD[kind].surface});
  masks.push({polygon,bounds:box});
 }
 return pieces;
}
/**
 * What the lane builder (lane-surfaces.js) still paves itself: nothing. Since step 4 of the ground plan every district of
 * Minato is laid by its plan (ground-plan.js, ground-plan-harbour.js, ground-plan-quarters.js, ground-plan-coast.js);
 * the walks that cross the lawns are laid from streetPieces() by ground-walks.js, and a building's walking circuit is
 * its apron, its gate or the lawn, never a ring of paving.
 */
export function coordinatedStreetPatches(routes){
 return [];
}
