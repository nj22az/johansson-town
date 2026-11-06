/**
 * The ground of Kitahama, Nishi-machi, the west yard and the town hall's grounds, as plans for ground-build.js (the form
 * is ground-plan.js's): step 3 of the owner's ground plan (21 October 2026: "Can you make a plan to finally fix the roads
 * to a unified system? Pavement? Walk paths, grass and sandy beach?"; docs/GROUND-STANDARD.md, "Step 3").
 *
 * What these plans lay, and why, by district:
 *  - Kitahama: every lane in back-lane asphalt at the town's datum (4 cm), Main Street's continuation north of the bus
 *    plaza with them, its old footways become the walking strips outside a white edge line (路側帯); the U-gutters
 *    of okinawa/lane-edges.js at every plot and every open edge are the lanes' edge, and the plan holds their ground
 *    so nothing is laid under or over them. The cleared lots' pads (the monthly parking, the eisa ground, the hoop's
 *    pad, the cane's red earth) are the plan's too, edged where they meet the lawn. The houses meet the lane by their
 *    own gate and the gutter: no ring of paving round a walled plot.
 *  - Nishi-machi: the quarter's crushed-coral yards between the coral walls, its lanes and the seawall walk in back-lane
 *    asphalt with a U-gutter along every yard, the sacred grove's gravel, and a coral-stone edging where the coral meets
 *    the west yard's lawn.
 *  - The west yard: the lawn stays (west-yard.js); the shops and the yard house stand on concrete aprons that run to
 *    their walls, the paths the yard is walked by are concrete, flush with the lawn, and every edge on the lawn is a
 *    row of setts.
 *  - The town hall (the old school): its yard is rolled crushed stone (the rulebook's park path), with a concrete
 *    forecourt from the gate to the entrance, a concrete apron along the breezeway, round the power house and the fuel
 *    tank, a concrete car park, and a lawn with its flower bed, edged.
 *
 * The plans read the layout modules (kitahama-layout.js, okinawa/layout.js, west-yard.js, school-layout.js, lots.js), so a
 * plot or a lane moved there moves its ground. street-plan.js leaves every district to the plans (coordinatedStreetPatches lays nothing since step 4).
 */
import {KITAHAMA,KITAHAMA_LANES} from './kitahama-layout.js';
import {NISHI,utakiStones} from './okinawa/layout.js';
import {WEST_YARD} from './west-yard.js';
import {SCHOOL,TOWN_HALL_BUILDINGS,TOWN_HALL_PASSAGES} from './school-layout.js';
import {POLICE_STATION} from './police-station-layout.js';
import {TOWN_WALK_PLOTS} from './architecture-plan.js';
import {BOOKSHOP_WORKSHOP_PLOT} from './bookshop-workshop-layout.js';
import {GROUND_CLASSES,GROUND_EDGE,edgeRule,districtAt} from './ground-standard.js';
import {EDGING_PROUD,laidAt,partitionPlan,mainStreetPlan,MAIN_STREET_GROUND as MS} from './ground-plan.js';
import {GUTTER,gutterRings,openEdgeRuns} from './okinawa/lane-edge-plan.js';
import {CLEARED_LOTS,STREET_LOTS} from './okinawa/lots.js';
import {SAKURA_BACK} from './okinawa/old-town.js';
import {lotPaint} from './okinawa/lot-dressing.js';
import {activeRoutes} from './layout.js';
import {laidWalkPieces} from './ground-walks.js';

const C=GROUND_CLASSES,LANE=C.lane.top,FLUSH=C.concrete.flushTop,CORAL=C['coral-sand'].top,GRAVEL=C.gravel.top,PATH=C['park-path'].top,GRASS=C.grass.top,EARTH=C.earth.top;
/** A rolled pad on a sub-base (the monthly parking, the eisa ground, the hoop's pad), 25 mm proud of the lawn (lots.js). */
export const PAD_TOP=C['coral-sand'].raisedTop;
const rect=(x0,x1,z0,z1)=>({x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1)});
const fromBounds=b=>rect(b.minX,b.maxX,b.minZ,b.maxZ);
const FIRM=new Set(['lane','road','concrete','pavers','quay','park-path','coral-sand','gravel','earth','deck']);

/** The audit samples a 25 cm lattice: an edging strip always covers one of its lines, or it would read as no edge. */
const LATTICE=.25;
function stripWidth(lo,w){
 // The strip runs from `lo` inwards `w` (signed); widen it (up to a lattice step) until a lattice line lies inside it.
 const a=Math.min(lo,lo+w),b=Math.max(lo,lo+w);
 for(let extra=0;extra<=LATTICE+1e-9;extra+=.05){
  const A=w<0?a-extra:a,B=w<0?b:b+extra;
  if(Math.floor((B-.02)/LATTICE)*LATTICE>A+.02-1e-9)return Math.sign(w)*(B-A);
 }
 return w;
}

/**
 * The edge strips round a plan's pieces: along every side of a piece of `classes` whose neighbour (the plan's own piece
 * there, or `neighbour(x,z)` beyond the plan) needs a stone or coral-stone edging by the rulebook (edgeRule), a strip
 * of it laid inside the piece, its top 3 mm over the higher of the two. Pieces of another plan say nothing here: each
 * plan edges its own side of a seam.
 */
function edgeStrips(layers,{classes,neighbour,skip=()=>false}){
 const plan={layers},rects=partitionPlan(plan),out=[],E=.02,STEP=.05;
 for(const r of rects){
  const l=r.layer;if(l.edge||!classes.has(l.cls))continue;
  const top=y=>Math.max(typeof l.top==='number'?l.top:GRASS,y)+EDGING_PROUD;
  for(const [side,line,along,lo,hi,out_] of [['z0',r.z0,'x',r.x0,r.x1,-1],['z1',r.z1,'x',r.x0,r.x1,1],['x0',r.x0,'z',r.z0,r.z1,-1],['x1',r.x1,'z',r.z0,r.z1,1]]){
   let run=null;
   const close=end=>{if(run&&end-run.a>.05){
     const w=stripWidth(line,-out_*run.width),[c0,c1]=[Math.min(line,line+w),Math.max(line,line+w)];
     out.push({cls:run.edge,edge:true,name:run.edge==='coral-edging'?'Coral-stone edging':'Stone edging',...(along==='x'?rect(run.a,end,c0,c1):rect(c0,c1,run.a,end)),top:run.top,
      why:run.edge==='coral-edging'?'Crushed coral meets the lawn or an apron at a coral-stone edging (ground-standard.js).':'A firm surface meets the lawn at a row of setts (ground-standard.js).'});}
    run=null;};
   for(let u=lo;u<hi-1e-9;u+=STEP){
    const m=Math.min(hi,u+STEP/2),[x,z]=along==='x'?[m,line+out_*E]:[line+out_*E,m];
    const inside=laidAt(plan,x,z),n=inside&&!inside.edge?{cls:inside.cls,y:inside.y,own:true}:inside?.edge?null:neighbour(x,z);
    const rule=n&&!skip(x,z)?edgeRule(l.cls,n.cls).edge:null,edge=rule==='edging'||rule==='coral-edging'?rule:null;
    // Two pieces of the plan that both take edging: the lower lays it (the higher's top sets it), on a tie the first by name.
    const mine=typeof l.top==='number'?l.top:0,theirs=n?.y??0;
    const want=edge&&!(n.own&&classes.has(n.cls)&&(theirs<mine-1e-6||(Math.abs(theirs-mine)<1e-6&&n.cls<l.cls)))?edge:null;
    if(run&&(run.edge!==want))close(u);
    if(want&&!run)run={a:u,edge:want,width:want==='coral-edging'?GROUND_EDGE.coralEdging.width:GROUND_EDGE.edging.width,top:top(n.y??GRASS)};
   }
   close(hi);
  }
 }
 return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Kitahama.

/** Main Street north of the bus plaza, through Kitahama to the north lane: one lane, its old footways the walking strips. */
export const KITAHAMA_MAIN=Object.freeze({...rect(MS.pavementWest,KITAHAMA.footpath.minX,MS.maxZ,KITAHAMA.northLane.minZ),
 /** The white edge lines (外側線) where the kerbs were: the walking strips (路側帯) outside them. */
 lines:Object.freeze([-5,-.5]),linesFrom:KITAHAMA.mainCrossLane.maxZ});
/** Kitahama's lanes beyond KITAHAMA_LANES, from the routes they carry (architecture-plan.js, island-plan.js). */
export const KITAHAMA_EXTRA_LANES=Object.freeze([
 Object.freeze({minX:-23,maxX:6,minZ:88,maxZ:91,why:'The north cross lane (north-residential-cross-lane), from Fukugi Lane to the footpath.'}),
 Object.freeze({minX:-38.5,maxX:-33.5,minZ:55.5,maxZ:58.5,why:'The link from the east lane out to the coastal walk (kitahama-west-link).'}),
 Object.freeze({minX:KITAHAMA_MAIN.x0,maxX:KITAHAMA_MAIN.x1,minZ:KITAHAMA_MAIN.z0,maxZ:KITAHAMA_MAIN.z1,why:'Main Street north of the bus plaza.'}),
]);
const lot=id=>CLEARED_LOTS.find(l=>l.id===id);
const flatOf=(id,f)=>lot(id).dressing.flat.find(x=>x.id===f).rect;
/** The pads and beds the cleared lots are laid with (lots.js): what each is, its class and its top. */
export const KITAHAMA_PADS=Object.freeze([
 {lot:'kitahama-north-block',flat:'parking-gravel',cls:'coral-sand',top:PAD_TOP,name:'Kitahama monthly parking',why:'Crushed coral rolled on a sub-base under the three bays: cars on grass rut it in the rains.'},
 {lot:'kitahama-north-block',flat:'shop-apron',cls:'concrete',top:PAD_TOP,name:'Johansson Mart forecourt',why:'The shop stands on its slab and the forecourt is swept concrete: the vending machines, the bins and the A-board stand on it (okinawa/kitahama-shop.js).'},
 {lot:'kitahama-7-lot',flat:'practice-ground',cls:'coral-sand',top:PAD_TOP,name:'The eisa ground',why:'Crushed coral, swept: the drummers\' feet and the dancers\' want level ground, not grass.'},
 {lot:'kitahama-9-lot',flat:'hoop-pad',cls:'concrete',top:PAD_TOP,name:'The hoop\'s pad',why:'A ball bounces on concrete, not on grass.'},
].map(p=>Object.freeze({...p,...fromBounds(flatOf(p.lot,p.flat))})));
/** The cane's red earth, 15 cm round the rows (lots.js caneLot). */
export const KITAHAMA_CANE=Object.freeze(['kitahama-10-lot','kitahama-11-lot','kitahama-12-lot'].map(id=>{
 const r=lot(id).dressing.props.find(p=>p.id.startsWith('cane-')).rect;
 return Object.freeze({lot:id,...rect(r.minX-.15,r.maxX+.15,r.minZ-.15,r.maxZ+.15)});
}));

function kitahamaBase(){
 const L=[],Y=POLICE_STATION.yard;
 // The police station's yard (the forecourt where the police box stood) is concrete, flush, from the station's wall to
 // the north lane's edge; Main Street's footway keeps its own ground west of it (ground-plan.js).
 L.push({cls:'concrete',name:'Police station yard',...rect(MS.pavementEast,Y.maxX,Y.minZ,Y.maxZ),top:FLUSH,why:'The station\'s yard: the patrol car\'s bay, the bicycle rack and the flagpole on poured concrete (police-station.js).'});
 for(const l of [...KITAHAMA_LANES,...KITAHAMA_EXTRA_LANES])L.push({cls:'lane',name:'Kitahama lane',...fromBounds(l),top:LANE,
  why:l.why||'Kitahama\'s lanes are back lanes: asphalt at the town\'s datum, a U-gutter at every plot (lane-edges.js).'});
 for(const p of KITAHAMA_PADS)L.push({cls:p.cls,name:p.name,x0:p.x0,x1:p.x1,z0:p.z0,z1:p.z1,top:p.top,why:p.why});
 // The approach comes up off the beach (step 4 grades the sand to it): a row of setts across its foot holds the lane's edge.
 {const A=KITAHAMA.approach;L.push({cls:'edging',edge:true,name:'Stone edging',...rect(A.minX,A.maxX,A.minZ,A.minZ+.15),top:LANE+EDGING_PROUD,why:'Where the approach lane meets the beach, a row of setts at its foot.'});}
 for(const c of KITAHAMA_CANE)L.push({cls:'earth',name:'The association\'s cane',x0:c.x0,x1:c.x1,z0:c.z0,z1:c.z1,top:EARTH,why:'Red earth in ridges, the cane in rows across it (lots.js).'});
 return L;
}

// ---------------------------------------------------------------------------------------------------------------------
// Nishi-machi.

const N=NISHI,SEAWALL_FACE=N.seawall.x+N.seawall.thickness/2;
/** The seawall walk: from the seawall's face to the yards, the quay to the north lane. */
export const NISHI_WALK=Object.freeze(rect(SEAWALL_FACE,-35.5,-38,MS.maxZ));
/** Where the quarter's lanes end, at the west yard (the old yard wall's gaps), with a grating across. */
const NISHI_END=WEST_YARD.minX;
/** The plots' gates on the lanes, as gaps along the lane edge (okinawa/quarters.js walledHouse, lots.js). */
function nishiGates(){
 const out=[];
 for(const p of N.plots){const cx=(p.minX+p.maxX)/2;
  // The grove's opening in its south wall (quarters.js utaki, centred on x −30.8).
  if(p.kind==='grove')out.push({z:p.minZ,gap:[-30.8-1,-30.8+1]});
  else if(p.gate==='south')out.push({z:p.minZ,gap:[cx-.95,cx+.95]});
  else if(p.gate==='north')out.push({z:p.maxZ,gap:[cx-.95,cx+.95]});}
 // The cleared lots' gates on the lanes (lots.js: Gran Higa's garden faces the Higa gate across the lane).
 for(const l of CLEARED_LOTS.filter(l=>l.district==='Nishi-machi')){
  const props=l.dressing.props.filter(q=>/^wall-south/.test(q.id)).map(q=>q.rect).sort((a,b)=>a.minX-b.minX);
  if(props.length===2)out.push({z:l.rect.minZ,gap:[props[0].maxX,props[1].minX]});
 }
 return out;
}
/** The gutter runs along Nishi-machi's lanes (lane-edges.js draws them): both sides of each cross lane, the walk's yard side. */
export function nishiGutterRuns(){
 const G=GUTTER,runs=[],x0=NISHI_WALK.x1,gates=nishiGates();
 const lanes=N.lanes.map(l=>({z0:l.z-l.half,z1:l.z+l.half}));
 const run=(owner,side,axis,band,gs=[])=>runs.push({owner,side,axis,walled:false,gates:gs,band,soil:null,weedLine:0,open:true});
 for(const [i,l] of lanes.entries()){
  for(const [side,z0,z1] of [['south',l.z0-G.width,l.z0],['north',l.z1,l.z1+G.width]]){
   const edgeZ=side==='south'?l.z0:l.z1,gs=gates.filter(g=>Math.abs(g.z-edgeZ)<.45).map(g=>g.gap);
   run('nishi-lane-'+i,side,'x',{minX:x0,maxX:NISHI_END-G.width,minZ:z0,maxZ:z1},gs);
  }
  // Across its end at the west yard: a grated channel the width of the lane and its gutters.
  run('nishi-lane-'+i,'east','z',{minX:NISHI_END-G.width,maxX:NISHI_END,minZ:l.z0-G.width,maxZ:l.z1+G.width},[[l.z0+.4,l.z1-.4]]);
 }
 // The walk's yard side, between the lanes' gutters; and the north lane's south edge from the walk to the west yard.
 const cuts=[N.minZ>-38?N.minZ:-38,...lanes.flatMap(l=>[l.z0-G.width,l.z1+G.width]),MS.maxZ-G.width].sort((a,b)=>a-b);
 for(let k=0;k+1<cuts.length;k+=2)run('nishi-walk','east','z',{minX:x0,maxX:x0+G.width,minZ:cuts[k],maxZ:cuts[k+1]});
 run('kitahama-south-lane','south','x',{minX:x0,maxX:NISHI_END,minZ:MS.maxZ-G.width,maxZ:MS.maxZ});
 // The walk's own end at the north lane, between the seawall and the lane's end (x −36): the lawn is north of it.
 run('nishi-walk','north','x',{minX:SEAWALL_FACE,maxX:KITAHAMA.southLane.minX,minZ:MS.maxZ-G.width,maxZ:MS.maxZ});
 return runs;
}
function nishiBase(){
 const L=[],grove=N.plots.find(p=>p.kind==='grove');
 L.push({cls:'coral-sand',name:'Nishi-machi coral yards',...rect(SEAWALL_FACE,NISHI_END,-38,MS.maxZ),top:CORAL,
  why:'Nishi-machi\'s yards between the coral walls are crushed coral, as old Okinawan house yards were.'});
 L.push({cls:'gravel',name:'The utaki\'s gravel',...rect(grove.minX,grove.maxX,grove.minZ,MS.maxZ),top:GRAVEL,
  why:'The sacred grove is left as it was: grey crushed limestone under the trees, nobody builds and nobody shouts.'});
 for(const s of utakiStones(grove))L.push({hole:true,name:'Utaki stepping stone',...rect(s.x-s.w/2,s.x+s.w/2,s.z-s.d/2,s.z+s.d/2)});
 L.push({cls:'lane',name:'The seawall walk',x0:NISHI_WALK.x0,x1:NISHI_WALK.x1,z0:NISHI_WALK.z0,z1:NISHI_WALK.z1-GUTTER.width,top:LANE,
  why:'The walk behind the seawall is the quarter\'s back lane, from the quay to Kitahama.'});
 L.push({cls:'lane',name:'The seawall walk',x0:KITAHAMA.southLane.minX,x1:NISHI_WALK.x1,z0:NISHI_WALK.z1-GUTTER.width,z1:NISHI_WALK.z1,top:LANE,
  why:'Where the walk meets the north lane.'});
 for(const l of N.lanes)L.push({cls:'lane',name:'Nishi-machi lane',...rect(NISHI_WALK.x1,NISHI_END-GUTTER.width,l.z-l.half,l.z+l.half),top:LANE,
  why:'The lanes from the seawall walk to the west yard: back-lane asphalt, a U-gutter along each yard.'});
 return L;
}

// ---------------------------------------------------------------------------------------------------------------------
// The west yard.

const WEST_PLOTS=new Set(['sakura','minato-and-ramen','frontrow','coin-laundry','resident-home-kenji','warehouse']);
/** Where the yard's paving stops at Main Street's: its back strip's setts south of the plaza, its footway beside it. */
const westLimit=z=>z<=MS.backTo?MS.backWest-.05:MS.pavementWest;
/** The yard's paths, from the routes they carry (layout.js): a route's rectangles, concrete, flush with the lawn. */
const WEST_PATHS=new Set(['staff-yard','south-cut','izakaya-door','shop-crossing','south-shop-crossing','bus-platform']);
function westYardBase(){
 const L=[],y0=-38,limit=r=>{const x1=Math.min(r.x1,westLimit(r.z1>MS.backTo&&r.z0<MS.backTo?MS.backTo:r.z1));return x1>r.x0+1e-6?{...r,x1,z0:Math.max(r.z0,y0)}:null;};
 const push=(r,name,why)=>{if(!r)return;if(r.z1>MS.backTo&&r.z0<MS.backTo){push(limit({...r,z1:MS.backTo}),name,why);push(limit({...r,z0:MS.backTo}),name,why);return;}const c=limit(r);if(c&&c.z1>c.z0+1e-6)L.push({cls:'concrete',name,...c,top:FLUSH,why});};
 // Aprons: from each building's walls out to where its walking circuit reached (architecture-plan.js, 1.5 m out ±1).
 for(const p of TOWN_WALK_PLOTS.filter(p=>WEST_PLOTS.has(p.id))){
  const [a,b,c,d]=p.walkBounds??[p.minX-1.5,p.maxX+1.5,p.minZ-1.5,p.maxZ+1.5],o=1;
  const outer=rect(Math.max(a-o,WEST_YARD.minX),b+o,c-o,d+o);
  for(const r of [rect(outer.x0,outer.x1,outer.z0,p.minZ),rect(outer.x0,outer.x1,p.maxZ,outer.z1),rect(outer.x0,p.minX,p.minZ,p.maxZ),rect(p.maxX,outer.x1,p.minZ,p.maxZ)])
   if(r.x1>r.x0+1e-6&&r.z1>r.z0+1e-6)push(r,'West yard apron','A building in the yard stands on a concrete apron to its walls, where the vans back up and the bins and bicycles stand.');
 }
 // Sakura's service apron behind the shop (old-town.js SAKURA_BACK.strip: where the van backs up and the empties stand).
 for(const [x0,x1,z0,z1] of SAKURA_BACK.strip.rects)push(rect(x0,x1,z0,z1),'Sakura service apron',SAKURA_BACK.strip.why);
 // The passage between the bookshop and Minato (west-shops.js), over their aprons to Main Street's back strip.
 {const P=BOOKSHOP_WORKSHOP_PLOT;push(rect(-16.92,MS.backWest,-5.8,-3.4),'Bookshop–Minato passage','The passage between the bookshop and Minato, from the yard to Main Street.');void P;}
 // Higa Liquor's crate yard (lots.js STREET_LOTS): poured concrete inside its walls, to Main Street's back strip.
 {const r=STREET_LOTS.find(l=>l.id==='higa-crate-yard').rect;push(rect(r.minX,MS.backWest,r.minZ,r.maxZ),'Higa crate yard','Empties come back in crates and wait here on concrete, stacked, for the brewery\'s boat.');}
 // The bicycle shed at the top of the yard stands on a slab (quarters.js buildYardLife).
 push(rect(-24.2,-19.2,15.6,19.8),'Yard bicycle shed slab','The yard\'s bicycle shed stands on a concrete slab, off the lawn.');
 // The coastal walk's stretch down the yard's west edge, from the Nishi lane at z −27.5 to the quay (island-plan.js):
 // concrete, flush, beside Sakura's apron.
 push(rect(NISHI_END,-23.3,-38,-26.3),'West yard path','The coastal walk comes down the yard\'s west edge to the quay.');
 // The paths the yard is walked by.
 for(const route of activeRoutes().filter(r=>WEST_PATHS.has(r.id)))for(const r of routeRects(route))push(r,'West yard path','A path across the yard, flush with the lawn (concrete, the rulebook\'s footway off Main Street).');
 // The Nishi lanes run on into the yard as concrete paths to the aprons they lead to.
 for(const l of N.lanes){
  const z0=l.z-l.half,z1=l.z+l.half,to=nishiPathEnd(L,z0,z1);
  if(to>NISHI_END+.1)push(rect(NISHI_END,to,z0,z1),'West yard path','A Nishi-machi lane runs on into the yard, flush with the lawn, to the apron it leads to.');
 }
 return L;
}
/** How far a Nishi lane's path runs into the yard: to the first apron across its width, if one is within 6 m. */
function nishiPathEnd(L,z0,z1){
 let to=NISHI_END;
 const hit=L.filter(r=>r.z0<z1-1e-6&&r.z1>z0+1e-6&&r.x0>=NISHI_END-1e-6&&r.x0-NISHI_END<6).sort((a,b)=>a.x0-b.x0)[0];
 if(hit)to=hit.x0;
 // Where the lane's end already meets an apron (it starts at the yard's edge), nothing more is laid.
 return hit&&hit.x0<=NISHI_END+.1?NISHI_END:to;
}
/** The axis-aligned rectangles a route is paved as (street-plan.js routePolygons, without its bevels). */
function routeRects(route){
 const w=route.width/2,out=[];
 for(let i=1;i<route.points.length;i++){
  const a=route.points[i-1],b=route.points[i];
  if(a[0]!==b[0]&&a[1]!==b[1])continue;
  out.push(rect(Math.min(a[0],b[0])-w,Math.max(a[0],b[0])+w,Math.min(a[1],b[1])-w,Math.max(a[1],b[1])+w));
 }
 return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// The town hall's grounds (the old school).

/** The town hall's grounds, as laid: what each part is and why (school-layout.js gives the places). */
export const TOWN_HALL_GROUND=Object.freeze((()=>{
 const S=SCHOOL,B=S.building,ph=S.powerHouse,pk=S.parking,b=S.bikeShed,k=ph.compound;
 return {
  yard:rect(S.minX,S.maxX,S.minZ,B.maxZ),
  forecourt:rect(18.2,23.6,S.minZ,S.corridor.minZ),
  // Each building's own breezeway apron (school-layout.js TOWN_HALL_BUILDINGS), and the passages between them to the lane behind.
  breezeways:Object.freeze(TOWN_HALL_BUILDINGS.map(t=>rect(t.minX-.3,t.maxX+.3,S.corridor.minZ-.2,B.minZ))),
  passages:Object.freeze(TOWN_HALL_PASSAGES.map(p=>rect(p.minX,p.maxX,S.corridor.minZ-.2,B.maxZ))),
  compound:rect(k.minX,k.maxX,k.minZ,k.maxZ),
  powerApron:rect(ph.minX-.6,ph.door[0]+.6,ph.minZ+.2,ph.maxZ+.6),
  tankBund:rect(ph.tank[0]-1.9,ph.tank[0]+1.9,ph.tank[1]-.75,ph.tank[1]+.75),
  parking:rect(pk.minX,pk.maxX,pk.minZ,pk.maxZ),
  bikeShed:rect(b.minX,b.maxX,b.minZ+.8,b.maxZ),
  lawn:rect(23.9,30.6,k.maxZ,S.field.maxZ),
  bed:rect(24.6,29.9,32.25,32.95),
  verges:Object.freeze([rect(S.minX-.9,S.minX,S.minZ,B.maxZ),rect(S.maxX,S.seawall.east,S.minZ,30.5),rect(S.maxX,S.maxX+.9,30.5,B.maxZ)]),
  bays:Object.freeze([0,1,2,3].map(i=>pk.minX+.4+i*2.6)),
  /**
   * Rolled crushed stone only where it is walked or played on (the owner's phone, 21 October 2026: the whole yard was
   * one sheet of it, under the trees and round the car park, and read as bare sand). The rest of the yard is lawn.
   */
  stone:Object.freeze([
   {name:'School playground',...rect(S.field.minX+.4,18.2,S.minZ,S.corridor.minZ-.2),why:'The classroom\'s playground west of the forecourt, between the windbreak and the entrance: rolled stone, the old sports ground\'s last piece.'},
   {name:'Town hall front walk',...rect(23.6,30.6,S.field.maxZ,S.corridor.minZ-.2),why:'Along the front, from the forecourt past the lawn to the car park, under the breezeway\'s edge.'},
   {name:'Town hall front walk',...rect(30.6,pk.maxX,pk.maxZ,S.corridor.minZ-.2),why:'From the car park to the breezeway, where the clinic\'s and the kitchen\'s visitors walk.'},
   {name:'Bicycle shed walk',...rect(ph.door[0]+.6,b.minX,S.minZ,pk.minZ),why:'From the power house\'s door and the car park to the bicycle shed.'},
   {name:'Bicycle shed walk',...rect(b.minX,b.maxX,S.minZ,b.minZ+.8),why:'In front of the shed\'s open side, where the bicycles are wheeled in.'},
  ].map(Object.freeze)),
 };
})());
function schoolBase(){
 const T=TOWN_HALL_GROUND,L=[];
 L.push({cls:'grass',name:'Town hall yard',...T.yard,top:GRASS,why:'The yard between the paths, under the windbreak and along the walls: lawn, as the town hall keeps it.'});
 for(const st of T.stone)L.push({cls:'park-path',...st,top:PATH});
 for(const p of T.passages)L.push({cls:'park-path',name:'Back passage',...p,top:PATH,why:'Between two of the buildings, from the breezeway through to Kitahama\'s north lane behind: rolled stone, the short way in from the Kitahama houses.'});
 L.push({cls:'gravel',name:'Power compound yard',...T.compound,top:GRAVEL,why:'Inside the power house\'s fence, round its apron and the tank: a work yard of crushed limestone, not a lawn anyone walks on.'});
 L.push({cls:'grass',name:'Town hall lawn',...T.lawn,top:GRASS,why:'A lawn in the middle of the old sports ground, with its flower bed.'});
 // Outside the boundary wall and along the seawall's inner foot, the neighbourhood's lawn runs on to the yard's edge
 // (neighbourhood-ground.js stops 0.9 m short of it): turf, so no bare island ground shows under the wall.
 for(const r of T.verges)L.push({cls:'grass',name:'Town hall verge',...r,top:GRASS,why:'The lawn up to the yard, under the boundary wall.'});
 L.push({cls:'earth',name:'Town hall flower bed',...T.bed,top:EARTH,why:'The town hall\'s flower bed, dug every spring.'});
 for(const [k,name,why] of [['forecourt','Town hall forecourt','From the gate to the entrance under the canopy, poured concrete.'],
  ['powerApron','Power house apron','The power house stands on a concrete apron, its door on the east side for the fuel truck.'],
  ['tankBund','Fuel tank bund','The fuel tank stands in its concrete bund.'],
  ['parking','Town hall car park','The car park where the sandpit and the iron bars were: concrete, with its bays painted.'],
  ['bikeShed','Bicycle shed pad','Under the bicycle shed, a concrete pad.']])L.push({cls:'concrete',name,...T[k],top:FLUSH,why});
 for(const r of T.breezeways)L.push({cls:'concrete',name:'Breezeway apron',...r,top:FLUSH,why:'The concrete apron along a building\'s breezeway, under its roof.'});
 // The buildings and the power house stand on their own floors.
 const B=SCHOOL.building,ph=SCHOOL.powerHouse;
 for(const t of TOWN_HALL_BUILDINGS)L.push({hole:true,name:t.name,...rect(t.minX,t.maxX,B.minZ,B.maxZ)});
 L.push({hole:true,name:'Power house',...rect(ph.minX,ph.maxX,ph.minZ,ph.maxZ)});
 return L;
}

/**
 * The white edge line (外側線) a lane carries where it runs beside other paving with no gutter between (the coastal walk,
 * the police station's yard): 15 cm wide, 30 cm in from the lane's edge (ground-standard.js GROUND_EDGE.line), on the
 * lattice the audit reads (see stripWidth).
 */
function edgeLines(lanes,{needs}){
 const out=[],LW=GROUND_EDGE.line.width,IN=GROUND_EDGE.line.inset,STEP=.1;
 for(const L of lanes){
  for(const alongX of [true,false])for(const s of [-1,1]){
   const edge=alongX?(s<0?L.minZ:L.maxZ):(s<0?L.minX:L.maxX),from=alongX?L.minX:L.minZ,to=alongX?L.maxX:L.maxZ;
   // Inset 30 cm, nudged (up to 10 cm further in) so a lattice line lies inside the paint.
   let a=IN;for(let k=0;k<=10;k++){const lo=edge-s*(IN+k*.01),hi=lo-s*LW,mn=Math.min(lo,hi),mx=Math.max(lo,hi);if(Math.floor((mx-.01)/LATTICE)*LATTICE>mn+.01){a=IN+k*.01;break;}}
   const line=edge-s*(a+LW/2);let start=null;
   const close=u=>{if(start!==null&&u-start>.3){const [c0,c1]=[line-LW/2,line+LW/2];out.push(alongX?rect(start,u,c0,c1):rect(c0,c1,start,u));}start=null;};
   for(let u=from;u<to-1e-9;u+=STEP){const m=Math.min(to,u+STEP/2),[x,z]=alongX?[m,edge+s*.05]:[edge+s*.05,m];
    const want=needs(x,z);if(want&&start===null)start=u;if(!want)close(u);}
   close(to);
  }
 }
 return out.map(r=>({...r,colour:GROUND_EDGE.line.colour,name:'Kitahama edge line'}));
}

// ---------------------------------------------------------------------------------------------------------------------
// The plans, their gutters, and what is paved.

let built=null;
function buildPlans(){
 if(built)return built;
 const K=kitahamaBase(),Nb=nishiBase(),W=westYardBase(),S=schoolBase();
 // The walks laid across these plans' ground by ground-plan-coast.js (ground-walks.js): Kitahama's coastal walk and the
 // service walk past the town hall's gate.
 const foreign=laidWalkPieces().map(p=>{const xs=p.polygon.map(v=>v[0]),zs=p.polygon.map(v=>v[1]);return {poly:p.polygon,minX:Math.min(...xs),maxX:Math.max(...xs),minZ:Math.min(...zs),maxZ:Math.max(...zs)};});
 const inPoly=(poly,x,z)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;};
 // Where a walk is laid across these plans' ground (the service walk past the town hall's gate), the plan leaves it that
 // ground: a hole the walk's rectangle wide.
 for(const L of [K,Nb,W,S]){
  const firm=L.filter(l=>!l.hole&&!l.edge);
  for(const f of foreign){
   const box=rect(f.minX,f.maxX,f.minZ,f.maxZ),isRect=f.poly.length===4&&f.poly.every(([x,z])=>(Math.abs(x-f.minX)<1e-6||Math.abs(x-f.maxX)<1e-6)&&(Math.abs(z-f.minZ)<1e-6||Math.abs(z-f.maxZ)<1e-6));
   if(isRect&&firm.some(l=>l.x0<box.x1-1e-6&&l.x1>box.x0+1e-6&&l.z0<box.z1-1e-6&&l.z1>box.z0+1e-6))L.push({hole:true,name:'Laid walk',...box});
  }
 }
 const bases=[K,Nb,W,S].map(layers=>({layers}));
 const foreignAt=(x,z)=>foreign.some(p=>x>=p.minX-1e-6&&x<=p.maxX+1e-6&&z>=p.minZ-1e-6&&z<=p.maxZ+1e-6&&inPoly(p.poly,x,z));
 const street=(x,z)=>x>=MS.pavementWest-1e-6&&x<=MS.pavementEast+1e-6&&z>=MS.minZ-1e-6&&z<=MS.maxZ+1e-6;
 const firmIn=(plan,x,z)=>{const at=laidAt(plan,x,z);return !!at&&!at.edge&&FIRM.has(at.cls);};
 const paved=(x,z)=>street(x,z)||bases.some(p=>firmIn(p,x,z))||foreign.some(p=>x>=p.minX-1e-6&&x<=p.maxX+1e-6&&z>=p.minZ-1e-6&&z<=p.maxZ+1e-6&&inPoly(p.poly,x,z));
 // Kitahama's gutters: the walled plots' rings and every open edge of its lanes.
 const rings=gutterRings([],{lanes:[...KITAHAMA_LANES,...KITAHAMA_EXTRA_LANES]}),open=openEdgeRuns(rings,{paved,lanes:[...KITAHAMA_LANES,...KITAHAMA_EXTRA_LANES]});
 const kitahamaRuns=[...rings,...open],nishiRuns=nishiGutterRuns();
 const gutterLayers=runs=>runs.flatMap(r=>[{cls:'gutter',edge:true,drawnBy:'lane-edges',name:'U-gutter',x0:r.band.minX,x1:r.band.maxX,z0:r.band.minZ,z1:r.band.maxZ,top:GUTTER.top,why:'A lane meets a plot at its U-gutter (lane-edges.js).'},
  ...(r.soil?[{cls:'gutter',edge:true,drawnBy:'lane-edges',name:'U-gutter',x0:r.soil.minX,x1:r.soil.maxX,z0:r.soil.minZ,z1:r.soil.maxZ,top:GUTTER.soilTop,why:'The strip of earth and weeds between the gutter and the wall.'}]:[])]);
 // What lies beyond a plan where it has nothing: another plan's ground, Main Street's, or the lawn.
 const others=plans=>(x,z)=>{for(const p of [...plans,mainStreetPlan()]){const at=laidAt(p,x,z);if(at)return at.edge?null:{cls:at.cls,y:at.y};}return null;};
 const lawnOr=(plans,lawn)=>(x,z)=>others(plans)(x,z)??(foreignAt(x,z)?{cls:'concrete',y:FLUSH}:lawn(x,z)?{cls:'grass',y:GRASS}:null);
 const inLawn=(x,z)=>['kitahama','west-yard','east-lawn','school'].includes(districtAt(x,z))||x>=-24.6;
 // Sakura's service apron ends at the shop's back wall (old-town.js SAKURA_BACK.wall): no setts there.
 const inBuilding=(x,z)=>TOWN_WALK_PLOTS.some(p=>p.id==='sakura'&&x>=SAKURA_BACK.wall-1e-3&&x<p.maxX&&z>p.minZ&&z<p.maxZ);
 const Kl=[...K,...gutterLayers(kitahamaRuns)];
 const Nl=[...Nb,...gutterLayers(nishiRuns)];
 const kitahama={id:'kitahama',district:'kitahama',layers:[...Kl,...edgeStrips(Kl,{classes:new Set(['coral-sand','concrete']),neighbour:lawnOr([{layers:Nl},{layers:W}],inLawn)})],
  marks:[...edgeLines([...KITAHAMA_LANES,...KITAHAMA_EXTRA_LANES],{needs:(x,z)=>{
    // Beside paving that is not a lane and has no gutter between (the coastal walk, a pad, the police station's yard),
    // or at a lane's end on the lawn: the lane's edge line.
    const own=laidAt({layers:Kl},x,z);if(own)return !own.edge&&own.cls!=='lane'&&FIRM.has(own.cls);
    if(foreign.some(p=>x>=p.minX-1e-6&&x<=p.maxX+1e-6&&z>=p.minZ-1e-6&&z<=p.maxZ+1e-6&&inPoly(p.poly,x,z)))return true;
    if(street(x,z)||[Nl,W].some(l=>laidAt({layers:l},x,z)))return false;
    const hall=laidAt({layers:S},x,z);if(hall)return hall.cls==='grass';
    return ['kitahama','west-yard'].includes(districtAt(x,z));}}),
   ...KITAHAMA_MAIN.lines.map(x=>({...rect(x-.075,x+.075,KITAHAMA_MAIN.linesFrom,KITAHAMA_MAIN.z1),colour:GROUND_EDGE.line.colour,name:'Kitahama edge line'})),
   ...lotPaint().map(p=>({...fromBounds(p),colour:p.colour,name:p.name}))]};
 const nishi={id:'nishi-machi',district:'nishi-machi',layers:[...Nl,...edgeStrips(Nl,{classes:new Set(['coral-sand','gravel']),neighbour:lawnOr([{layers:W},{layers:K}],(x,z)=>x>=NISHI_END-1e-6||z>=MS.maxZ-1e-6)})]};
 const west={id:'west-yard',district:'west-yard',layers:[...W,...edgeStrips(W,{classes:new Set(['concrete']),neighbour:(x,z)=>x<NISHI_END||inBuilding(x,z)?null:lawnOr([{layers:K}],(x,z)=>districtAt(x,z)==='west-yard')(x,z)})]};
 const school={id:'school',district:'school',layers:[...S,...edgeStrips(S,{classes:new Set(['grass','concrete','park-path']),neighbour:(x,z)=>foreign.some(p=>x>=p.minX-1e-6&&x<=p.maxX+1e-6&&z>=p.minZ-1e-6&&z<=p.maxZ+1e-6&&inPoly(p.poly,x,z))?{cls:'concrete',y:FLUSH}:z<SCHOOL.minZ||x<SCHOOL.minX||x>SCHOOL.maxX?{cls:'grass',y:GRASS}:null})],
  marks:TOWN_HALL_GROUND.bays.map(x=>({...rect(x-.05,x+.05,SCHOOL.parking.minZ+.2,SCHOOL.parking.maxZ-.4),name:'Town hall car park bays'}))};
 return built={plans:[kitahama,nishi,west,school],kitahamaRuns,nishiRuns,paved};
}
/** The four plans (Kitahama, Nishi-machi, the west yard, the town hall), for ground-build.js. */
export function quarterPlans(){return buildPlans().plans;}
/** Every gutter run the plans lay, in lane-edges.js's form: what lane-edges.js draws. */
export function quarterGutterRuns(){const b=buildPlans();return [...b.kitahamaRuns,...b.nishiRuns];}
/** Whether a point is paved (by these plans, Main Street's, or the lane builder's remaining routes): where no gutter goes. */
export function quarterPaved(x,z){return buildPlans().paved(x,z);}
/** The top of the ground these plans lay at a point (a lane, a pad, a gutter's lid), or null off them. */
export function quarterTopAt(x,z){for(const p of quarterPlans()){const at=laidAt(p,x,z);if(at)return at.y;}return null;}
