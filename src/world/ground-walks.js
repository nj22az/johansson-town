/**
 * The walks across the lawns that are paved, from the town's routes (layout.js ROUTES), as the junction owner cuts them
 * (street-plan.js streetPieces): step 4 of the owner's ground plan (docs/GROUND-STANDARD.md). The lane builder lays none
 * of them any more; ground-plan-coast.js lays these with ground-paths.js, and the quarter plans
 * (ground-plan-quarters.js) leave them their ground and paint a lane's edge line beside them.
 *
 * Which routes are walks, and what they are laid in, is written here with the reason. Every other route over a lawn is
 * walked on the lawn: a building's circuit is no ring of paving (the owner: no paving rings round buildings in sand or
 * lawn), a crossing ends on the footway it lands on.
 */
import {streetPieces} from './street-plan.js';
import {activeRoutes} from './layout.js';
import {DISTRICTS} from './ground-standard.js';

export const LAID_WALKS=Object.freeze({
 'east-service-walk':{cls:'concrete',why:'The service walk from Harbour Park up the east lawn to the town hall\'s gate and Kitahama: poured concrete, flush with the lawn, edged.'},
 'office-crossing':{cls:'concrete',why:'Along the park\'s south edge, from Main Street to the harbour office and the park\'s quay walk: concrete, flush.'},
 'office-door':{cls:'concrete',why:'The harbour office\'s door onto the walk.'},
 'island-coast-walk':{cls:'concrete',districts:['kitahama'],why:'The island\'s coastal walk round Kitahama\'s shore: a concrete promenade, flush with the lawn and edged. On the east beach it is the sand; through Harbour Park, the park\'s walks; down Nishi-machi and the west yard, the quarter plans\' own.'},
});

/** A convex polygon cut to a rectangle (Sutherland–Hodgman on its four sides). */
export function clipToRect(poly,r){
 let out=poly;
 for(const [axis,v,keep] of [[0,r.minX,1],[0,r.maxX,-1],[1,r.minZ,1],[1,r.maxZ,-1]]){
  const list=out,next=[];
  for(let i=0;i<list.length;i++){const p=list[i],q=list[(i+1)%list.length],dp=(p[axis]-v)*keep,dq=(q[axis]-v)*keep;
   if(dp>=0)next.push(p);if((dp>0&&dq<0)||(dp<0&&dq>0)){const t=dp/(dp-dq);next.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}}
  out=next;if(out.length<3)return [];
 }
 return out;
}

let cached=null;
/** The laid walks' pieces: [{polygon, route, cls}], convex and disjoint. */
export function laidWalkPieces(){
 if(cached)return cached;
 const out=[];
 for(const p of streetPieces(activeRoutes().slice(3))){
  const w=LAID_WALKS[p.route];if(!w)continue;
  const parts=w.districts?w.districts.map(id=>DISTRICTS.find(d=>d.id===id)).map(d=>clipToRect(p.polygon,d)):[p.polygon];
  for(const polygon of parts)if(polygon.length>=3)out.push({polygon,route:p.route,cls:w.cls});
 }
 return cached=out;
}
