/**
 * The ground of a district, as a plan: which class of the rulebook (ground-standard.js) lies where, how high its top is,
 * and what edge stands at every seam. ground-build.js lays it; layout.js asks it where the ground has been lowered (Main
 * Street's carriageway), and the traffic asks it where its wheels go. No THREE here, so the plan can be asked anywhere.
 *
 * The owner, 21 October 2026: "Can you make a plan to finally fix the roads to a unified system? Pavement? Walk paths,
 * grass and sandy beach?" Step 2 of that plan (docs/GROUND-STANDARD.md) moves Main Street and the harbour onto one
 * generator; steps 3 and 4 add their districts' plans here in the same form.
 *
 * A plan is a list of layers in the order they are laid: a later layer takes the ground where it overlaps an earlier
 * one, so a plan reads like the paving gang's drawing (the footway everywhere, then the carriageway cut through it, then
 * the kerbs along it). Each layer is an axis-aligned rectangle with
 *  - `cls`: a ground class of the rulebook, or an edge element (`edge`: kerb, drop, edging, coping) laid between classes;
 *  - `top`: its finished top, a number, a straight grade `{axis, a, ya, b, yb}` (the top runs from ya at a to yb at b
 *    along x or z), or 'flush' for an edge whose top is the surface it is set in;
 *  - `name` and `why`, so the drawing says what it is and the data says why it is there.
 * partitionPlan() cuts the layers into disjoint rectangles, so no two surfaces ever lie one on the other.
 */
import {MAIN_ROAD,MAIN_SERVICE_COURT,MAIN_LOADING_APRON,MAIN_PARKING_LAYBY,SHOP_CROSSING_Z} from './main-road.js';
import {KITANO_ROAD} from './kitano-link-plan.js';
import {BUS_STATION} from './bus-station.js';
import {POLICE_STATION} from './police-station-layout.js';
import {DISTRICTS,GROUND_CLASSES,GROUND_EDGE} from './ground-standard.js';

const EPS=1e-7;
/** Setts are bedded a few millimetres proud of the surface they edge, so the line reads and the rain runs off it. */
export const EDGING_PROUD=.003;
/** A grade's top at a point (clamped to its two ends). */
function gradeAt(t,x,z){
 const u=t.axis==='x'?x:z,f=Math.max(0,Math.min(1,(u-t.a)/(t.b-t.a)));
 return t.ya+(t.yb-t.ya)*f;
}
const inside=(l,x,z)=>x>=l.x0-EPS&&x<=l.x1+EPS&&z>=l.z0-EPS&&z<=l.z1+EPS;
/** The top of a layer at a point; 'flush' takes the surface laid under it. */
export function layerTop(plan,layer,x,z){
 if(typeof layer.top==='number')return layer.top;
 if(typeof layer.top==='function')return layer.top(x,z);
 if(layer.top==='flush'){
  const i=plan.layers.indexOf(layer);
  let under=null;
  for(let k=i-1;k>=0;k--){const l=plan.layers[k];if(!l.edge&&!l.hole&&inside(l,x,z)){under=layerTop(plan,l,x,z);break;}}
  // `atLeast`: an edging that also holds back ground higher than the surface it edges (a lawn over a low quay).
  return Math.max((under??0)+EDGING_PROUD,layer.atLeast??-Infinity);
 }
 return gradeAt(layer.top,x,z);
}
/** The layer that has the ground at a point (the last laid), or null. */
export function layerAt(plan,x,z){
 // A hole laid over a point takes the ground there out of the plan (another module lays it).
 for(let k=plan.layers.length-1;k>=0;k--)if(inside(plan.layers[k],x,z))return plan.layers[k].hole?null:plan.layers[k];
 return null;
}
/** {layer, y}: what is laid at a point and its top, or null outside the plan. */
export function laidAt(plan,x,z){const l=layerAt(plan,x,z);return l?{layer:l,cls:l.cls,edge:!!l.edge,y:layerTop(plan,l,x,z)}:null;}

/**
 * The layers cut into disjoint rectangles: every point of the plan belongs to exactly one, the last layer laid there.
 * A layer marked `hole` cuts what is under it and lays nothing (a building's own floor, a pit).
 */
export function partitionPlan(plan){
 if(plan.partition)return plan.partition;
 const layers=plan.layers,xs=new Set(),zs=new Set();
 for(const l of layers){xs.add(+l.x0.toFixed(6));xs.add(+l.x1.toFixed(6));zs.add(+l.z0.toFixed(6));zs.add(+l.z1.toFixed(6));}
 const X=[...xs].sort((a,b)=>a-b),Z=[...zs].sort((a,b)=>a-b);
 // Each strip along x, its runs of one layer; then runs stacked along z while they match.
 const open=new Map(),out=[];
 for(let j=1;j<Z.length;j++){
  const cz=(Z[j-1]+Z[j])/2,runs=[];
  let run=null;
  for(let i=1;i<X.length;i++){
   const cx=(X[i-1]+X[i])/2;let owner=null;
   for(let k=layers.length-1;k>=0;k--){const l=layers[k];if(cx>l.x0&&cx<l.x1&&cz>l.z0&&cz<l.z1){owner=l.hole?null:l;break;}}
   if(run&&run.layer===owner&&run.x1===X[i-1])run.x1=X[i];
   else{if(run&&run.layer)runs.push(run);run={layer:owner,x0:X[i-1],x1:X[i]};}
  }
  if(run&&run.layer)runs.push(run);
  const next=new Map();
  for(const r of runs){
   const key=layers.indexOf(r.layer)+'|'+r.x0+'|'+r.x1,was=open.get(key);
   if(was&&was.z1===Z[j-1]){was.z1=Z[j];next.set(key,was);open.delete(key);}
   else{const rect={layer:r.layer,x0:r.x0,x1:r.x1,z0:Z[j-1],z1:Z[j]};out.push(rect);next.set(key,rect);}
  }
  open.clear();for(const [k,v] of next)open.set(k,v);
 }
 return plan.partition=out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Main Street and the bus plaza.

const district=id=>DISTRICTS.find(d=>d.id===id);
/**
 * Main Street's datum is a kerb under the town's: the carriageway was lowered rather than the footways raised, so every
 * shop door, step, drinks machine and bench on the footway stands where it always stood (ground-standard.js DISTRICTS).
 */
export const MAIN_STREET_DATUM=district('main-street').datum;
const ROAD=MAIN_STREET_DATUM+GROUND_CLASSES.road.top,FOOT=MAIN_STREET_DATUM+GROUND_CLASSES.pavers.top;
/** The kerb's width, and how far behind a dropped kerb the footway is ramped down to it. */
const KERB=GROUND_EDGE.kerb.width,RAMP=.9,TAPER=.6;
/** A dropped kerb stands 2 cm proud of the road, so the rain still runs along it to the gully. */
const DROP_TOP=ROAD+.02;
/** A kerb is set 5 mm proud of the footway behind it, so the footway's rain runs to its own drains and not over it. */
const KERB_TOP=FOOT+.005;
/** Where the carriageway meets the town's datum at its ends: the quay to the south, the bus road to the north. */
/** Over 4 m (3.75 %) a car on the driveway keeps all four wheels on the ground; over 3 m (5 %) the bus road. */
const SOUTH_GRADE=4,NORTH_GRADE=3,TOWN_ROAD=GROUND_CLASSES.road.top;
/** The main quay's top, where the ferry's plate is let in (minato-berth.js MINATO_BERTH.landing.top): the road runs onto it. */
export const MAIN_QUAY_TOP=-.016;
/** Kitano Road's mouth is a raised table at the footway's level from here east: the footway crosses it on the flat. */
const MOUTH_TABLE_X=1.5;
/** Where the yellow warning blocks go: at the top of each zebra's ramps (filled in as the plan is drawn). */
export const TACTILE=[];

export const MAIN_STREET_GROUND=Object.freeze({
 id:'main-street',datum:MAIN_STREET_DATUM,road:ROAD,footway:FOOT,
 west:MAIN_ROAD.west,east:MAIN_ROAD.east,minZ:MAIN_ROAD.minZ,maxZ:BUS_STATION.maxZ,
 pavementWest:MAIN_ROAD.pavementWest,pavementEast:MAIN_ROAD.pavementEast,
 /** The concrete strips beyond the district line, out to where the old footway reached (west yard, east lawn). */
 backWest:-8,backEast:5.75,backTo:MAIN_ROAD.maxZ,
 crossings:Object.freeze([SHOP_CROSSING_Z,-18]),
 /** Kitano Road's mouth across the east footway (its carriageway, and its kerb on the north side). */
 mouth:Object.freeze({z0:KITANO_ROAD.corners[0][1]-KITANO_ROAD.section.carriageway,z1:KITANO_ROAD.corners[0][1]+KITANO_ROAD.section.carriageway+.02}),
 /** Where the bus stop's platform crosses the street: kerbs dropped, no zebra (an uncontrolled crossing point). */
 busCrossing:Object.freeze({z0:22.05,z1:24.05}),
 why:'The shōtengai as a 1990s prefectural works office would have relaid it: dark asphalt between 15 cm kerbs, reddish and beige pavers to the shop fronts, the kerb dropped at the two zebras and the bus stop, and bays at the road\'s level where vehicles stop.',
});

function grade(axis,a,ya,b,yb){return {axis,a,ya,b,yb};}
const rect=(x0,x1,z0,z1)=>({x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1)});

/**
 * A kerb dropped along one side of a road-level area, with its ramp and the tapers either side: `side` is the side of
 * the edge the footway lies on ('-x', '+x', '-z', '+z'), `at` the edge's line, [a, b] its extent along it.
 */
function droppedKerb(L,{side,at,a,b,name='dropped kerb',why}){
 const s=side[0]==='-'?-1:1,alongX=side[1]==='z';
 const box=(u0,u1,v0,v1)=>alongX?rect(v0,v1,u0,u1):rect(u0,u1,v0,v1);
 const k0=at,k1=at+s*KERB,r1=k1+s*RAMP,axis=alongX?'z':'x',along=alongX?'x':'z';
 // The tapers: the kerb either side of the drop comes down to it over 60 cm.
 L.push({cls:'kerb',edge:true,name:'Main Street kerb',...box(k0,k1,a-TAPER,a),top:grade(along,a-TAPER,KERB_TOP,a,DROP_TOP),why:'The kerb comes down to the drop.'});
 L.push({cls:'kerb',edge:true,name:'Main Street kerb',...box(k0,k1,b,b+TAPER),top:grade(along,b,DROP_TOP,b+TAPER,KERB_TOP),why:'The kerb comes back up from the drop.'});
 L.push({cls:'kerb',edge:true,name:'Main Street '+name,...box(k0,k1,a,b),top:DROP_TOP,why});
 const ramp=grade(axis,k1,DROP_TOP,r1,FOOT);
 L.push({cls:'drop',edge:true,name:'Main Street '+name+' ramp',...box(k1,r1,a,b),top:ramp,why:'Behind a dropped kerb the footway is ramped down to it, so a pram, a wheelchair or a trolley rolls straight across.'});
 // Its flanks are flared, as the kerb is tapered: the footway beside the ramp comes down to it over 60 cm, never a step.
 for(const [w0,w1,near] of [[a-TAPER,a,a],[b,b+TAPER,b]])
  L.push({cls:'drop',edge:true,name:'Main Street '+name+' ramp',...box(k1,r1,w0,w1),
   top:(x,z)=>{const q=Math.min(1,Math.abs((along==='x'?x:z)-near)/TAPER);return gradeAt(ramp,x,z)*(1-q)+FOOT*q;},
   why:'The ramp\'s flank, flared into the footway.'});
}

function mainStreetLayers(){
 const M=MAIN_STREET_GROUND,W=M.west,E=M.east,Z0=M.minZ,Z1=M.maxZ,L=[];
 const C=MAIN_SERVICE_COURT,LA=MAIN_LOADING_APRON,LB=MAIN_PARKING_LAYBY,K=KITANO_ROAD;
 // The mouth's north kerb stands 2 cm off the lane's own line, on the footway's edge where it reaches the lawn's corner.
 const mouth=M.mouth;
 // 1. The footways, kerb to shop front, and the concrete strips beyond the district line to the old footway's reach.
 L.push({cls:'pavers',name:'Main Street footway',...rect(M.pavementWest,M.pavementEast,Z0,Z1),top:FOOT,why:'Main Street\'s footways and shop fronts are pavers.'});
 L.push({cls:'concrete',name:'Main Street back strip',...rect(M.backWest,M.pavementWest,Z0,M.backTo),top:TOWN_ROAD,why:'Behind the west shop line, where the yard begins: poured concrete flush with the yard, under the shops\' fronts and across the gaps between them.'});
 L.push({cls:'concrete',name:'Main Street back strip',...rect(M.pavementEast,M.backEast,Z0,M.backTo),top:TOWN_ROAD,why:'The East Row\'s and the park\'s frontage: poured concrete, flush with the lawn and the park\'s paths.'});
 // North of it, between the footway and the police station's street face, to its yard: the station's doors open onto it.
 L.push({cls:'concrete',name:'Main Street back strip',...rect(M.pavementEast,M.backEast,M.backTo,POLICE_STATION.yard.minZ),top:TOWN_ROAD,why:'The police station\'s street face and doors stand on the frontage strip, as the East Row\'s do; north of it is the station\'s yard.'});
 // Kitano Road lays its own ground east of the district line (kitano-link.js).
 L.push({hole:true,name:'Kitano Road footway',...rect(M.pavementEast,M.backEast,K.corners[0][1]-K.section.footway,mouth.z0-KERB)});
 // 2. Stone edging at the back of the footway and the strips, where the yard's and the park's lawns come up to them.
 L.push({cls:'edging',edge:true,name:'Stone edging',...rect(M.backWest-.05,M.backWest+.05,Z0,M.backTo),top:'flush',why:'The west yard\'s lawn meets the concrete at a row of setts.'});
 L.push({cls:'edging',edge:true,name:'Stone edging',...rect(M.pavementWest,M.pavementWest+.1,M.backTo,Z1),top:'flush',why:'The bus plaza\'s west side, where the neighbourhood\'s lawn comes up to the footway.'});
 L.push({cls:'edging',edge:true,name:'Stone edging',...rect(M.backEast-.05,M.backEast+.05,Z0,K.corners[0][1]-K.section.footway),top:'flush',why:'Harbour Park\'s and the east lawn\'s turf meet the frontage strip at a row of setts.'});
 L.push({cls:'edging',edge:true,name:'Stone edging',...rect(M.backEast-.05,M.backEast+.05,mouth.z1+KERB,M.backTo),top:'flush',why:'The lawn by the East Row meets the frontage strip at a row of setts.'});
 // 3. Where the footway meets the lane at the plaza's north end: a flush kerb, the line a lane stops at.
 L.push({cls:'kerb',edge:true,name:'Main Street kerb',...rect(M.pavementWest,W,Z1-KERB,Z1),top:KERB_TOP,why:'Where the footway meets the lane at the plaza\'s north end, a flush kerb marks the line.'});
 L.push({cls:'kerb',edge:true,name:'Main Street kerb',...rect(E,M.pavementEast,Z1-KERB,Z1),top:KERB_TOP,why:'Where the footway meets the lane at the plaza\'s north end, a flush kerb marks the line.'});
 // 4. The kerbs along the carriageway and round every bay, at the footway's level.
 const bays=[
  {name:'Main Street carriageway',...rect(W,E,Z0,Z1),open:['z0','z1']},
  {name:'Main Street freight pullout',...rect(LA.minX,W,LA.minZ,C.maxZ),open:['x1']},
  {name:'Main Street parking lay-by',...rect(E,LB.maxX,LB.minZ,LB.kerbTo),open:['x0','z0']},
  {name:'Quay cargo driveway',...rect(E,3.2,Z0,LB.minZ),open:['x0','z0','z1']},
  {name:'Quay cargo driveway',...rect(LB.maxX,3.2,LB.minZ,-32.8),open:['z0']},
  {name:'Kitano Road carriageway',...rect(E,M.backEast,mouth.z0,mouth.z1),open:['x0','x1']},
 ];
 const kerb=(r,why='A 15 cm kerb divides the footway from the carriageway.')=>L.push({cls:'kerb',edge:true,name:'Main Street kerb',...r,top:KERB_TOP,why});
 for(const b of bays){
  const o=new Set(b.open);
  if(!o.has('x0'))kerb(rect(b.x0-KERB,b.x0,b.z0-(o.has('z0')?0:KERB),b.z1+(o.has('z1')?0:KERB)));
  if(!o.has('x1'))kerb(rect(b.x1,b.x1+KERB,b.z0-(o.has('z0')?0:KERB),b.z1+(o.has('z1')?0:KERB)));
  if(!o.has('z0'))kerb(rect(b.x0,b.x1,b.z0-KERB,b.z0));
  if(!o.has('z1'))kerb(rect(b.x0,b.x1,b.z1,b.z1+KERB));
 }
 // 5. The kerbs dropped: the two zebras, the bus stop and the freight pullout's crossing.
 // The warning blocks are set into the footway, on a bed sunk for them.
 const tactile=t=>{if(!TACTILE.some(o=>o.x===t.x&&o.z===t.z))TACTILE.push(t);L.push({cls:'pavers',name:'Main Street footway',...rect(t.x-t.w/2,t.x+t.w/2,t.z-t.d/2,t.z+t.d/2),top:FOOT-.012,why:'The warning blocks\' bed, a block\'s depth under the paving round it.'});};
 for(const z of M.crossings){
  const why='Kerbs dropped at the zebra, the yellow warning blocks at the top of the ramp.';
  if(z>LA.minZ&&z<C.maxZ){
   // The zebra's west end lands in the freight pullout, whose back is a narrow strip before the bookshop's wall: the
   // kerb is dropped at the pullout's south end instead, east of the bookshop's door, the way you walk to it.
   droppedKerb(L,{side:'-z',at:LA.minZ,a:-6.55,b:W-.3,why:'From the zebra across the pullout onto the footway by the bookshop\'s door.'});
   tactile({x:(-6.55+W-.3)/2,z:LA.minZ-KERB-RAMP-.2,w:W-.3+6.55,d:.3});
  }else{droppedKerb(L,{side:'-x',at:W,a:z-1.6,b:z+1.6,why});tactile({x:W-KERB-RAMP-.2,z,w:.3,d:3.2});}
  // Where the zebra's east end lands in Kitano Road's mouth (the shop crossing), there is no kerb to drop: the mouth
  // rises from the road to its table at the footway's level.
  if(z>mouth.z0&&z<mouth.z1)continue;
  droppedKerb(L,{side:'+x',at:E,a:z-1.6,b:z+1.6,why});tactile({x:E+KERB+RAMP+.2,z,w:.3,d:3.2});
 }
 for(const [side,at] of [['-x',W],['+x',E]])droppedKerb(L,{side,at,a:M.busCrossing.z0,b:M.busCrossing.z1,why:'The bus stop\'s platform crosses the street here: an uncontrolled crossing point, its kerbs dropped.'});
 // 6. The road at its level, last, so nothing is laid over it: graded to the town's datum where it leaves the district.
 const southGrade=grade('z',Z0,MAIN_QUAY_TOP,Z0+SOUTH_GRADE,ROAD),northGrade=grade('z',Z1-NORTH_GRADE,ROAD,Z1,TOWN_ROAD);
 const why='The carriageway, one kerb under the footways.';
 L.push({cls:'road',name:'Main Street carriageway',...rect(W,E,Z0,Z0+SOUTH_GRADE),top:southGrade,why:'The carriageway rises to the quay over its last four metres (3.75 %), so the trucks drive onto the quay on its level.'});
 L.push({cls:'road',name:'Main Street carriageway',...rect(W,E,Z0+SOUTH_GRADE,Z1-NORTH_GRADE),top:ROAD,why});
 L.push({cls:'road',name:'Main Street carriageway',...rect(W,E,Z1-NORTH_GRADE,Z1),top:northGrade,why:'The bus road rises to the lane beyond the plaza over three metres (5 %).'});
 // The turnout's west half is the pullout's north end; its east half (to x 0.35) is footway: the delivery turn swings
 // round on the carriageway (town-traffic.js), and the bench, the post box and the cabinet stand there.
 L.push({cls:'road',name:'Main Street freight pullout',...rect(LA.minX,W,LA.minZ,C.maxZ),top:ROAD,why:'Freight stops in a west-side bay at the road\'s level, behind its own kerb; deliveries turn at its north end.'});
 // The lay-by runs on past its bay to where its kerb was dropped (main-road.js kerbTo), so the harbour master's car pulls
 // out forwards onto the road without its wheels or its nose crossing the footway.
 L.push({cls:'road',name:'Main Street parking lay-by',...rect(E,LB.maxX,LB.minZ,LB.kerbTo),top:ROAD,why:'The harbour master parks in the lay-by, at the road\'s level behind a kerb, and pulls out at its north end.'});
 L.push({cls:'road',name:'Quay cargo driveway',...rect(E,3.2,Z0,Z0+SOUTH_GRADE),top:southGrade,why:'The cargo driveway rises to the quay with the carriageway.'});
 L.push({cls:'road',name:'Quay cargo driveway',...rect(E,3.2,Z0+SOUTH_GRADE,LB.minZ),top:ROAD,why:'The working quay\'s trucks come and go by the driveway beside the lay-by.'});
 L.push({cls:'road',name:'Quay cargo driveway',...rect(LB.maxX,3.2,LB.minZ,-32.8),top:ROAD,why:'Drivers straighten clear of the Port Building\'s canopy before they leave.'});
 L.push({cls:'road',name:'Kitano Road carriageway',...rect(E,MOUTH_TABLE_X,mouth.z0,mouth.z1),top:grade('x',E,ROAD,MOUTH_TABLE_X,FOOT),why:'Kitano Road climbs out of Main Street onto its raised mouth (7.5 %).'});
 L.push({cls:'road',name:'Kitano Road carriageway',...rect(MOUTH_TABLE_X,M.backEast,mouth.z0,mouth.z1),top:FOOT,why:'The mouth is a raised table at the footway\'s level, so the footway runs across the side road on the flat at the zebra.'});
 const bx0=M.backWest-.05,bx1=M.backEast+.05;
 return L.map(l=>({...l,x0:Math.max(l.x0,bx0),x1:Math.min(l.x1,bx1),z0:Math.max(l.z0,Z0),z1:Math.min(l.z1,Z1)})).filter(l=>l.x1-l.x0>1e-6&&l.z1-l.z0>1e-6);
}

/**
 * Where Main Street's datum runs back up to the town's: the strips its carriageway is graded along, with the datum at
 * their two ends. The rulebook's heights hold over the datum here as everywhere (tools/ground-audit.mjs asks datumShift).
 */
export const MAIN_STREET_GRADES=Object.freeze([
 {id:'quay',why:'The carriageway and the cargo driveway rise onto the quay, on its level.',...rect(MAIN_ROAD.west,3.2,MAIN_ROAD.minZ,MAIN_ROAD.minZ+SOUTH_GRADE),top:grade('z',MAIN_ROAD.minZ,MAIN_QUAY_TOP-TOWN_ROAD,MAIN_ROAD.minZ+SOUTH_GRADE,MAIN_STREET_DATUM)},
 {id:'bus-road',why:'The bus road rises to the lane north of the plaza.',...rect(MAIN_ROAD.west,MAIN_ROAD.east,BUS_STATION.maxZ-NORTH_GRADE,BUS_STATION.maxZ),top:grade('z',BUS_STATION.maxZ-NORTH_GRADE,MAIN_STREET_DATUM,BUS_STATION.maxZ,0)},
 {id:'kitano-mouth',why:'Kitano Road climbs onto its raised mouth.',...rect(MAIN_ROAD.east,MOUTH_TABLE_X,KITANO_ROAD.corners[0][1]-KITANO_ROAD.section.carriageway,KITANO_ROAD.corners[0][1]+KITANO_ROAD.section.carriageway+.02),top:grade('x',MAIN_ROAD.east,MAIN_STREET_DATUM,MOUTH_TABLE_X,0)},
 {id:'kitano-table',why:'The raised mouth is at the town\'s datum, so the footway crosses it on the flat.',...rect(MOUTH_TABLE_X,5.75,KITANO_ROAD.corners[0][1]-KITANO_ROAD.section.carriageway,KITANO_ROAD.corners[0][1]+KITANO_ROAD.section.carriageway+.02),top:0},
].map(Object.freeze));
/** How far the datum at a point lies from its district's own (0 off the grades). */
export function datumShift(x,z,districtId){
 for(const g of MAIN_STREET_GRADES)if(x>=g.x0-EPS&&x<=g.x1+EPS&&z>=g.z0-EPS&&z<=g.z1+EPS){
  const datum=typeof g.top==='number'?g.top:gradeAt(g.top,x,z);
  return datum-(DISTRICTS.find(d=>d.id===districtId)?.datum??0);
 }
 return 0;
}

let mainStreet=null;
/** Main Street's plan (built once). */
export function mainStreetPlan(){return mainStreet??={id:'main-street',district:'main-street',layers:mainStreetLayers()};}

/**
 * The top of Main Street's laid ground at a point (the road, a kerb, a ramp, the footway), or null off the street.
 * layout.js planHeight answers it there, so people stand on the road, the kerb and the ramp at their own heights, and
 * the drawn-surface lift (walk-surface.js) adds only what stands on them (a sill, a step).
 */
export function mainStreetTop(x,z){
 const M=MAIN_STREET_GROUND;
 // Strictly inside: on the street's own edge the neighbours' ground is laid to the town's datum (their meshes ask
 // planHeight at their vertices there).
 if(!(x>M.pavementWest+1e-6&&x<M.pavementEast-1e-6&&z>M.minZ+1e-6&&z<M.maxZ-1e-6))return null;
 return highestLaid(mainStreetPlan(),x,z);
}
/**
 * The highest top of the pieces that meet at a point (one inside a piece, two or more on the line where they meet): on
 * a kerb's line the kerb's top, so the drawn-surface lift sampled there never takes the kerb's height over the road's.
 */
export function highestLaid(plan,x,z){
 const index=plan.index??=(()=>{const bins=new Map();for(const r of partitionPlan(plan))for(let i=Math.floor(r.x0);i<=Math.floor(r.x1);i++)for(let j=Math.floor(r.z0);j<=Math.floor(r.z1);j++){const k=i+','+j;(bins.get(k)??bins.set(k,[]).get(k)).push(r);}return bins;})();
 let y=null;
 for(const r of index.get(Math.floor(x)+','+Math.floor(z))||[])if(x>=r.x0-EPS&&x<=r.x1+EPS&&z>=r.z0-EPS&&z<=r.z1+EPS){const t=layerTop(plan,r.layer,x,z);if(y===null||t>y)y=t;}
 return y;
}
/**
 * How far the laid ground of Main Street lies under the town datum's road level at a point: 0 on the footways and off
 * the street, down to a kerb (-0.15) on the carriageway and its bays, graded at the ends and on the ramps: where the road's
 * paint and ironwork go (harbour.js, boardwalk.js).
 */
export function streetDrop(x,z){
 const M=MAIN_STREET_GROUND;
 if(x<M.pavementWest-1e-9||x>M.pavementEast+1e-9||z<M.minZ-1e-9||z>M.maxZ+1e-9)return 0;
 const at=laidAt(mainStreetPlan(),x,z);if(!at)return 0;
 return Math.min(0,at.y-TOWN_ROAD);
}
