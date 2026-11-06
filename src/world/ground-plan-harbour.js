/**
 * The harbour's ground, as a plan for ground-build.js (the form is ground-plan.js's): the main quay at its own level, the
 * Nishi and east quays' aprons either side of it, graded into it where they meet, the copings along the water, and the
 * stone edging where the quays meet the yard, the park and the lawns behind them.
 *
 * Step 2 of the owner's ground plan (21 October 2026, docs/GROUND-STANDARD.md). The levels are the ones everything on the
 * quays already stands on: the main quay 16 mm under the datum (the ferry's ramp lands on a plate let in at that level,
 * minato-berth.js), the Nishi and east aprons 6 cm over it (the auction shed's floor, the boat yard, Mr Fujita's pier).
 * All three are within the rulebook's quay level (4 cm, ±8).
 */
import {MAIN_ROAD} from './main-road.js';
import {NISHI,EAST_QUAY,EAST_QUAY_CORNER} from './okinawa/layout.js';
import {SHED_WALKWAY,FUJITA_PIER} from './fujita-layout.js';
import {OIL_JETTY} from './oil-jetty-layout.js';
import {MINATO_BERTH} from './minato-berth.js';
import {BEACH_EDGES} from './beach-layout.js';
/** Where the east lawn's parapet begins its run north (east-lawn.js); south of it the lawn meets the fuel depot's court. */
const EAST_LAWN_WALL_FROM=-36;
import {GROUND_CLASSES,GROUND_EDGE} from './ground-standard.js';
import {EDGING_PROUD,laidAt,mainStreetPlan,MAIN_STREET_GROUND,MAIN_QUAY_TOP} from './ground-plan.js';
export {MAIN_QUAY_TOP};

/** The Nishi and east quays' aprons. */
export const APRON_TOP=.06;
/** East of the east quay its apron runs on to the oil jetty, over the bank that showed bare between them. */
export const EAST_QUAY_END=EAST_QUAY_CORNER.jettyFrom;
/**
 * North of the oil jetty the east quay ends at x 42.3, in line with the fuel depot's court, and the beach runs from there
 * to the water (step 4; the owner approved bringing the beach back where step 2 had laid the quay over it).
 */
const BEACH_FROM=EAST_QUAY_CORNER.beachFrom;
/** The quay's edge with the town behind it: a row of setts 3 mm proud of the quay, and never under the footway's level. */
const EDGE_TOP=GROUND_CLASSES.road.top+EDGING_PROUD;
/** Over how many metres an apron comes down to the main quay where they meet (5 %). */
const APRON_GRADE=1.5;
/** How far up the main quay rises towards Main Street, so it meets the street's footways and road on their level. */
const NORTH_GRADE=1.5;

const grade=(axis,a,ya,b,yb)=>({axis,a,ya,b,yb});
const rect=(x0,x1,z0,z1)=>({x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1)});

/** The shore approach to the raised CAD quay uses the town's concrete and grade generator. */
export function cargoAccessPlan(){
 const A=OIL_JETTY.access,D=OIL_JETTY.deck;
 return {id:'cargo-berth-access',district:'harbour',layers:[
  {cls:'concrete',name:'Cargo berth shore ramp',...rect(A.minX,A.rampEndX,A.minZ,A.maxZ),top:grade('x',A.minX,A.fromY,A.rampEndX,D.y),depth:.25,why:'A continuous shore grade reaches the cargo quay at its working freeboard.'},
  {cls:'concrete',name:'Cargo berth access landing',...rect(A.rampEndX,A.maxX,A.minZ,A.maxZ),top:D.y,depth:.3,why:'A level turning space connects the shore ramp to the piled quay.'},
 ]};
}

let layers=null;
/** The quays' and their edges' layers: the plan without the copings, which need the pier and the ferry's landing. */
function harbourLayers(){
 if(layers)return layers;
 const L=[];
 const Q={minX:-19,maxX:19,minZ:-50,maxZ:-38},N=NISHI.quay,EQ=EAST_QUAY;
 const seawallFoot=NISHI.seawall.x-NISHI.seawall.thickness/2-.25;
 const eastEnd=EAST_QUAY_END;
 // 1. The quays.
 // (Its paving stops a millimetre short of Main Street's, which begins on the line.)
 L.push({cls:'quay',name:'Quay paving',...rect(Q.minX,Q.maxX,Q.minZ,Q.maxZ-.001),top:MAIN_QUAY_TOP,why:'The main quay, at the level the ferry\'s ramp lands on.'});
 // The ferry's ramp lands on a steel plate let into the quay, flush with it (harbour.js lays the plate in the recess).
 const P=MINATO_BERTH.landing;
 L.push({cls:'quay',name:'Quay paving',...rect(P.minX,P.maxX,P.minZ,P.flapFromZ),top:P.top-P.thickness,why:'The quay is cast round the ramp\'s plate and recessed under it.'});
 L.push({cls:'quay',name:'Quay paving',...rect(P.flapMinX,P.maxX,P.flapFromZ,P.maxZ),top:P.top-P.thickness,why:'The quay is cast round the ramp\'s plate and recessed under it.'});
 // Not across the street's road and the cargo driveway, which come down to the quay's own level (ground-plan.js).
 L.push({cls:'quay',name:'Quay paving',...rect(Q.minX,MAIN_ROAD.west,Q.maxZ-NORTH_GRADE,Q.maxZ-.001),top:grade('z',Q.maxZ-NORTH_GRADE,MAIN_QUAY_TOP,Q.maxZ,GROUND_CLASSES.road.top),
  why:'The quay rises 6 cm over its last metre and a half to the west footway and the yard, so they run onto it without a step.'});
 L.push({cls:'quay',name:'Quay paving',...rect(seawallFoot,Q.minX-APRON_GRADE,N.minZ,Q.maxZ),top:APRON_TOP,why:'The Nishi quay\'s apron, from under the seawall to the main quay.'});
 L.push({cls:'quay',name:'Quay paving',...rect(Q.minX-APRON_GRADE,Q.minX,N.minZ,Q.maxZ),top:grade('x',Q.minX-APRON_GRADE,APRON_TOP,Q.minX,MAIN_QUAY_TOP),why:'The Nishi apron comes down to the main quay over a metre and a half.'});
 const jetty=OIL_JETTY.shore;
 L.push({cls:'quay',name:'Quay paving',...rect(Q.maxX+APRON_GRADE,BEACH_FROM,EQ.minZ,Q.maxZ-.001),top:APRON_TOP,why:'The east quay\'s apron, under the auction shed, the ice plant and the forklift\'s bay.'});
 L.push({cls:'quay',name:'Quay paving',...rect(BEACH_FROM,eastEnd,EQ.minZ,jetty.maxZ),top:APRON_TOP,why:'On to the oil jetty\'s root; north of it the beach.'});
 L.push({cls:'quay',name:'Quay paving',...rect(Q.maxX,Q.maxX+APRON_GRADE,EQ.minZ,Q.maxZ),top:grade('x',Q.maxX,MAIN_QUAY_TOP,Q.maxX+APRON_GRADE,APRON_TOP),why:'The east apron comes up from the main quay over a metre and a half.'});
 // Where the quay ends at the water, its edge is a coping; where it ends at the beach, the sand is graded up to it
 // (beach-layout.js BEACH_GRADES), never a step.
 L.push({cls:'coping',edge:true,name:'Quay coping',...rect(eastEnd-.15,eastEnd,EQ.minZ,jetty.maxZ),top:APRON_TOP+EDGING_PROUD,depth:1,why:'South of the jetty the quay ends at its wall with the coping, the water below it.'});
 // The fuel depot's service court, on the beach's south end beside the quay: flush concrete, the sand graded up to it.
 const C=BEACH_EDGES.court;
 L.push({cls:'concrete',name:'Fuel depot service court',...rect(C.minX,C.maxX,C.minZ,C.maxZ),top:GROUND_CLASSES.concrete.flushTop,
  why:'The fuel depot\'s tank stands in its bund on a level court where the tanker lorry fills from it; it opens off the quay, flush, and the beach is graded up to its other sides.'});
 L.push({cls:'edging',edge:true,name:'Stone edging',...rect(C.minX,C.minX+.1,C.minZ,EAST_LAWN_WALL_FROM),top:'flush',why:'Where the east lawn comes to the court, south of the parapet, a row of setts.'});
 // 2. The stone edging along the quays' landward side, where the yard, the park and the lawns meet them; none across the
 // street's road and the cargo driveway, which run onto the quay flush.
 for(const [x0,x1] of [[seawallFoot,MAIN_ROAD.west-GROUND_EDGE.kerb.width],[3.2,BEACH_EDGES.court.minX]])
  L.push({cls:'edging',edge:true,name:'Stone edging',...rect(x0,x1,Q.maxZ-.1,Q.maxZ),top:'flush',atLeast:EDGE_TOP,why:'The quay ends at a row of setts where the town\'s ground begins.'});
 // The access builder lays these same layers, so the old apron stops under the new grade.
 L.push(...cargoAccessPlan().layers.map(layer=>({...layer,drawnBy:'cargo-berth-access'})));
 return layers={layers:L,Q,N,EQ,seawallFoot,eastEnd};
}
const harbourGround={id:'harbour',district:'harbour',layers:null};
/**
 * The top of the laid ground of Main Street and the quays at a point (the road, a ramp, a quay; a kerb or an edging's
 * where one is), or null off them: where the traffic's wheels go.
 */
export function groundTopAt(x,z){
 const M=MAIN_STREET_GROUND;
 if(x>=M.backWest-.05&&x<=M.backEast+.05&&z>=M.minZ&&z<=M.maxZ){const at=laidAt(mainStreetPlan(),x,z);if(at)return at.y;}
 harbourGround.layers??=harbourLayers().layers;
 return laidAt(harbourGround,x,z)?.y??null;
}

/**
 * @param {object} o
 * @param {{x:number,width:number}} o.pier  the outer pier (layout.js OUTER_PIER): the main quay's coping stops at its root
 * @param {{minX:number,maxX:number}} o.landing  the ferry ramp's landing (minato-berth.js): no coping where the ramp lands
 */
export function harbourPlan({pier,landing}){
 const {layers:L,Q,N,EQ,seawallFoot,eastEnd}=harbourLayers(),blocks=[];
 // 3. The copings at the water. The main quay's carries a raised kerb with the bollards on it; the aprons' a low yellow one.
 const coping=GROUND_EDGE.coping.colour,face=GROUND_EDGE.coping.legacy[0];
 const pierWest=pier.x-pier.width/2-.17,pierEast=pier.x+pier.width/2+.17;
 for(const [a,b] of [[Q.minX,landing.minX],[landing.maxX,pierWest],[pierEast,Q.maxX]]){
  blocks.push({cls:'coping',name:'Quay coping',min:[a-.01,-.42,-49.975],max:[b+.01,.18,-49.325],colour:face});
  blocks.push({cls:'coping',name:'Quay coping',min:[a+.01,.10,-49.555],max:[b-.01,.24,-49.005],colour:face});
  blocks.push({cls:'coping',name:'Quay coping',min:[a+.02,.24,-49.555],max:[b-.02,.28,-49.005],colour:coping});
 }
 const gap=[SHED_WALKWAY.minX,SHED_WALKWAY.maxX];
 // Under Mr Fujita's pier the wall runs on as the shelf its stringers rest on (timber-pier.js).
 blocks.push({cls:'coping',name:'Quay coping',min:[gap[0],-.7,N.minZ-.45],max:[gap[1],FUJITA_PIER.top-.045-.15,N.minZ],colour:face});
 for(const [x0,x1] of [[seawallFoot,gap[0]],[gap[1],Q.minX]]){
  // The face runs out to the main quay's line at the water, so nothing of the bank shows between them.
  blocks.push({cls:'coping',name:'Quay coping',min:[x0,-.7,Math.min(N.minZ-.45,Q.minZ-.05)],max:[x1,APRON_TOP,N.minZ],colour:face});
  blocks.push({cls:'coping',name:'Quay coping',min:[x0,APRON_TOP,N.minZ-.4],max:[x1,APRON_TOP+.12,N.minZ-.1],colour:coping});
 }
 blocks.push({cls:'coping',name:'Quay coping',min:[Q.maxX,-.7,EQ.minZ-.45],max:[eastEnd,APRON_TOP,EQ.minZ],colour:face});
 blocks.push({cls:'coping',name:'Quay coping',min:[Q.maxX,APRON_TOP,EQ.minZ-.4],max:[eastEnd,APRON_TOP+.12,EQ.minZ-.1],colour:coping});
 return {id:'harbour',district:'harbour',layers:L,blocks,
  /** Where the quay's colliders go (the coping's yellow kerb is a trip edge, not a wall). */
  edges:{nishi:[[seawallFoot,gap[0]],[gap[1],Q.minX]],east:[[Q.maxX,eastEnd]]}};
}
