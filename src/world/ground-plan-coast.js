/**
 * The walks of the east side and the coast, as laid: step 4 of the owner's ground plan (21 October 2026: "Can you make a
 * plan to finally fix the roads to a unified system? Pavement? Walk paths, grass and sandy beach?"; docs/GROUND-STANDARD.md,
 * "Step 4"). ground-paths.js lays them; this module says what lies where and why.
 *
 *  - Harbour Park's walks are the rulebook's park path (rolled crushed stone, 4 cm, flush with the turf at 2 cm), the
 *    stone walks and the pond's circuit alike, in their round joins as the park has always drawn them, and held by a row
 *    of setts wherever they meet the turf (harbour-park-plan.js HARBOUR_PARK_PATHS).
 *  - Its flower beds are garden earth, 25 mm proud of the turf, each in the lawn clear of the walks (harbour-park-garden.js
 *    HARBOUR_PARK_BEDS says what grows in them, who keeps them and why).
 *  - Umi-no-yu stands on the lawn: no ring of paving round it. A forecourt in front of the bathhouse, from the walks to
 *    its porch, with the footbath on it, is the park's rolled crushed stone, the bathhouse's stepping stones set in it;
 *    the bath behind its fence is the bathhouse's own.
 *  - The walks across the east lawn (the service walk to the town hall's gate, the walk along the park's south edge to
 *    the harbour office) and Kitahama's coastal walk are concrete, flush, edged (ground-walks.js says which and why).
 *  - Kitano Road's footway is concrete at the road's level behind its flush kerb (kitano-link-plan.js), edged on the lawn
 *    side; the carriageway is the rulebook's asphalt behind a 15 cm kerb on the lawn (kitano-link.js).
 *
 * A building's walking circuit is no ring of paving: the walls stand in the lawn, or the sand.
 */
import {HARBOUR_PARK_PATHS,harbourPondAt} from './harbour-park-plan.js';
import {HARBOUR_PARK_BEDS} from './harbour-park-garden.js';
import {laidWalkPieces,clipToRect} from './ground-walks.js';
import {walkPieces,edgingPieces,band,disc,onPieces} from './ground-paths.js';
import {GROUND_CLASSES,districtAt} from './ground-standard.js';
import {laidAt,partitionPlan,mainStreetPlan,MAIN_STREET_GROUND as MS} from './ground-plan.js';
import {CLEARED_LOTS} from './okinawa/lots.js';
import {quarterPlans} from './ground-plan-quarters.js';
import {groundTopAt} from './ground-plan-harbour.js';
import {onsenPoint} from './onsen-layout.js';
import {KITANO_ROAD} from './kitano-link-plan.js';
import {BEACH,BEACH_EDGES,onBeach} from './beach-layout.js';

const C=GROUND_CLASSES;
const rect=(minX,maxX,minZ,maxZ)=>({minX,maxX,minZ,maxZ});
const poly=r=>[[r.minX,r.minZ],[r.maxX,r.minZ],[r.maxX,r.maxZ],[r.minX,r.maxZ]];
const inside=(r,x,z,pad=0)=>x>=r.minX-pad&&x<=r.maxX+pad&&z>=r.minZ-pad&&z<=r.maxZ+pad;

/** Umi-no-yu (park-onsen.js): the bathhouse and the fenced bath behind it, and the forecourt in front. */
const onsenRect=(x,z,w,d)=>{const [cx,cz]=onsenPoint(x,z);return rect(cx-d/2,cx+d/2,cz-w/2,cz+w/2);};
export const ONSEN_GROUND=Object.freeze({
 bathhouse:Object.freeze(onsenRect(0,1.7,7.6,3.8)),
 bath:Object.freeze(onsenRect(0,-3.65,7.6,6.9)),
 forecourt:Object.freeze(rect(14.8,onsenRect(0,1.7,7.6,3.8).minX,-24.4,-16.4)),
 why:'Umi-no-yu\'s forecourt: from the park\'s walks to the porch, the footbath and its bench on it, rolled crushed stone with the bathhouse\'s stepping stones set 2 cm proud in it to the door; the bathhouse and the bath behind their walls stand in the lawn.',
});

/** Kitano Road's footway, from Main Street's footway (in the hole Main Street's plan leaves it) to the road's end. */
const K=KITANO_ROAD,KZ=K.corners[0][1],KERB_FLUSH=.12;
export const KITANO_FOOTWAY=Object.freeze([
 rect(MS.pavementEast,MS.backEast,KZ-K.section.footway,KZ-K.section.carriageway-.18),
 rect(MS.backEast,K.corners.at(-1)[0],KZ-K.section.footway,KZ-K.section.carriageway-KERB_FLUSH),
].map(Object.freeze));
/** The carriageway and its kerbs (kitano-link.js): what the walks meet there. */
const KITANO_ROAD_RECT=rect(MS.backEast,K.corners.at(-1)[0]+.18,KZ-K.section.carriageway-KERB_FLUSH,KZ-K.section.north);

/**
 * The drinks corner's pad on the post-office lot (okinawa/lots.js POST_OFFICE): the machines need a level slab and the
 * footway runs into it. Concrete, flush, from Main Street's frontage strip to past the screen wall.
 */
const DRINKS_PAD=(()=>{const r=CLEARED_LOTS.find(l=>l.id==='post-office-lot').dressing.flat.find(f=>f.id==='pad').rect;return rect(MS.backEast,r.maxX,r.minZ,r.maxZ);})();
/** Where the park's walks are laid: east of Main Street's frontage strip, north of the quay, west of the beach. */
const PARK_FIELD=rect(MS.backEast,33.2,-38,30);
/** The beach's access ramps (east-lawn.js), stone, laid by the beach: the walks end at them. */
const RAMPS=BEACH.accesses.map(a=>rect(a.fromX,a.toX,a.z-a.half,a.z+a.half));

let built=null;
function build(){
 if(built)return built;
 const park=HARBOUR_PARK_PATHS.map(r=>({id:r.id,cls:'park-path',polygons:[
  ...r.points.slice(1).map((b,i)=>band(r.points[i],b,r.width)),...r.points.map(([x,z])=>disc(x,z,r.width/2))]
  .flatMap(p=>{const q=clipToRect(p,PARK_FIELD);return q.length>=3?[q]:[];})}));
 const walks=[
  ...park,
  {id:'onsen-forecourt',cls:'park-path',polygons:[poly(ONSEN_GROUND.forecourt)]},
  // The park's flower beds (harbour-park-garden.js): garden earth in the lawn, clear of the walks' setts.
  ...HARBOUR_PARK_BEDS.map(b=>({id:'park-bed-'+b.id,cls:'earth',polygons:[poly(b.bounds)]})),
  {id:'drinks-corner',cls:'concrete',polygons:[poly(DRINKS_PAD)]},
  {id:'kitano-footway',cls:'concrete',polygons:KITANO_FOOTWAY.map(poly)},
  ...laidWalkPieces().map((p,i)=>({id:p.route+'#'+i,cls:p.cls,polygons:[p.polygon]})),
 ];
 // The ramps and the beach are the beach's; the walks stop at them, and at whatever the quarter plans lay (Kitahama's
 // lanes, where the coastal walk runs beside them at an angle).
 const quarter=quarterPlans().flatMap(p=>partitionPlan(p)).map(r=>poly(rect(r.x0,r.x1,r.z0,r.z1)));
 const pieces=walkPieces(walks,{masks:[...RAMPS.map(poly),poly(rect(33.2,60,-50,29.3)),...quarter]});
 const edging=edgingPieces(pieces,{neighbour:(x,z)=>beside(pieces,x,z),top:(cls,x,z)=>topOf(cls,x,z)});
 return built={pieces,edging};
}
/** The finished top of a class on these walks (all on the town's datum: the lawns here are level). */
export function topOf(cls){return cls==='concrete'?C.concrete.flushTop:C[cls].top;}

/** What lies beside a walk at a point: another plan's ground, the road, the sand, a building (nothing to edge), or the lawn. */
function beside(pieces,x,z){
 if(inside(KITANO_ROAD_RECT,x,z))return x>K.corners.at(-1)[0]?null:{cls:'road'};
 const ms=laidAt(mainStreetPlan(),x,z);if(ms)return ms.edge?null:{cls:ms.cls};
 if(z<-38&&groundTopAt(x,z)!==null)return {cls:'quay'};
 if(inside(BEACH_EDGES.court,x,z))return {cls:'concrete'};
 for(const p of quarterPlans()){const at=laidAt(p,x,z);if(at)return at.edge?null:{cls:at.cls};}
 // A ramp's head lies under the lawn (east-lawn.js) as far as the parapet's line: lawn there; past it, the ramp's own.
 if(RAMPS.some(r=>inside(r,x,z)))return x<33.2?{cls:'grass'}:null;
 if(onBeach(x,z))return {cls:'beach-sand'};
 // The bathhouse and the fenced bath behind it stand in the lawn: a walk along their walls needs no setts.
 if(inside(ONSEN_GROUND.bathhouse,x,z)||inside(ONSEN_GROUND.bath,x,z)||harbourPondAt(x,z,.2))return null;
 return ['east-lawn','harbour-park','kitahama','school','beach'].includes(districtAt(x,z))?{cls:'grass'}:null;
}

/** The step-4 walks as pieces and their setts (ground-paths.js), for buildPaths. */
export function coastWalkGround(){return build();}
/** Whether a point lies on one of these walks. */
export function coastPaved(x,z,pad=0){return onPieces(build().pieces,x,z,pad);}
