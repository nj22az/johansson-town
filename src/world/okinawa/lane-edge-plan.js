import {KITAHAMA,KITAHAMA_LANES,KITAHAMA_HEIGHTS} from '../kitahama-layout.js';
import {TOWN_WALK_PLOTS} from '../architecture-plan.js';
import {NEIGHBOURHOOD,neighbourhoodHeight} from '../neighbourhood-ground.js';
import {SCHOOL} from '../school-layout.js';

/**
 * The edge of every lane in Kitahama, one way everywhere (the owner, 19 October 2026: "we need a coherent look for
 * the roads on the island").
 *
 * Kitahama's walled plots stand half a metre in from the paving (the building circuits in architecture-plan.js run
 * 1.5 m out, 2 m wide), and that half metre was lawn: a lime verge at the foot of every wall. An Okinawan lane has a
 * U-gutter (U字溝) there instead, under grey concrete lids, and a line of weeds where the gutter meets the wall. So
 * every walled plot on the grid gets the same ring, from the paving inwards:
 *
 *   the gutter, 0.3 m: concrete lids 0.6 m long on a dark channel, a steel grating across each gate and every
 *     few lengths, its top 68 mm up (28 mm over the lane, a lid's lip);
 *   a strip of earth, 0.1 m (0.2 m where no wall stands), with the weeds growing out of it at the wall's foot.
 *
 * Where a lane's edge meets open ground instead (a field, a lot waiting for its use, the island's edge), the same
 * gutter and earth strip run along the outside of the edge (openEdgeRuns). The rings follow the plot data, so a
 * plot added or taken away takes its ring with it, and the open edges close round whatever is left.
 *
 * The lanes carry their wear: two faint tyre lines down the cross lane and the spine (the rubbish truck on Tuesdays
 * and Fridays, the postman's Cub, the cane lorry in January) and a few stains, each where something drips.
 */
export const GUTTER=Object.freeze({ring:.5,width:.3,soil:.1,openSoil:.2,lid:.6,joint:.015,gratingEvery:6,
 top:.068,channel:.045,soilTop:.036});

const sideOf=(rect,side)=>{
 const {minX,maxX,minZ,maxZ}=rect;
 return {north:{axis:'x',at:maxZ,out:1,from:minX,to:maxX},south:{axis:'x',at:minZ,out:-1,from:minX,to:maxX},
  east:{axis:'z',at:maxX,out:1,from:minZ,to:maxZ},west:{axis:'z',at:minX,out:-1,from:minZ,to:maxZ}}[side];
};
/** Where a plot's gate opening is, in world coordinates along its front (okinawa/quarters.js walledHouse). */
function houseGates(p){
 const cx=(p.minX+p.maxX)/2,cz=(p.minZ+p.maxZ)/2;
 return p.gate==='north'||p.gate==='south'?{[p.gate]:[[cx-.95,cx+.95]]}:{[p.gate]:[[cz-.95,cz+.95]]};
}
/**
 * The rings, one run per side: `band` is the gutter's rectangle, `soil` the earth strip's, `walled` whether a wall
 * stands behind it (weeds at its foot), `gates` the openings along it. North and south runs take the corners.
 * The gutter lies against the lane: half a metre out where the lane runs that close (the grid's standard), further
 * where a plot stands back from its lane (3 and 8 Kitahama on the footpath, the Heights on Fukugi Lane, up to 1.6 m),
 * the earth strip widening to meet it, so no strip of lawn and no second gutter lies between the ring and the lane.
 */
export function gutterRings(lots=[],{lanes=KITAHAMA_LANES}={}){
 const owners=[
  ...KITAHAMA.plots.map(p=>({id:p.id,rect:p,walls:{north:true,south:true,east:true,west:true},gates:houseGates(p)})),
  ...lots.map(l=>({id:l.id,rect:l.rect,walls:Object.fromEntries(Object.entries(l.walls).map(([k,v])=>[k,!!v])),gates:l.gates})),
  // Kitahama Heights: its block wall on the lane side, a gate for each of its two houses (kitahama-layout.js
  // KITAHAMA_HEIGHTS); its north and south sides run up to the lanes and take the open gutter there.
  {id:KITAHAMA.apartment.id,rect:KITAHAMA.apartment,walls:{east:true},only:['east'],
   gates:{east:KITAHAMA_HEIGHTS.houses.map(h=>[...h.gate])}},
 ];
 const runs=[],G=GUTTER;
 /** How far out of a side its lane's edge lies, when a lane runs along it a little further out than the standard. */
 const reach=(rect,side)=>{
  const s=sideOf(rect,side),along=s.axis==='x';let best=G.ring;
  for(const L of lanes){
   const edge=along?(s.out>0?L.minZ:L.maxZ):(s.out>0?L.minX:L.maxX),d=(edge-s.at)*s.out;
   const lo=along?L.minX:L.minZ,hi=along?L.maxX:L.maxZ,shared=Math.min(hi,s.to)-Math.max(lo,s.from);
   if(d>G.ring+1e-6&&d<=1.6&&shared>(s.to-s.from)/2)best=Math.max(best,d);
   if(d>=G.ring-1e-6&&d<=G.ring+1e-6&&shared>0)return G.ring;
  }
  return best;
 };
 for(const o of owners){
  const R=Object.fromEntries(['north','south','east','west'].map(side=>[side,reach(o.rect,side)]));
  for(const side of o.only||['north','south','east','west']){
  const s=sideOf(o.rect,side),walled=!!o.walls[side],along=s.axis==='x',ring=R[side];
  const [lo,hi]=along?[R.west,R.east]:[R.south-G.width,R.north-G.width];
  const soilIn=walled?G.soil:0,soilOut=ring-G.width,from=s.from-lo,to=s.to+hi;
  const across=(a,b)=>s.out>0?[s.at+a,s.at+b]:[s.at-b,s.at-a];
  const [b0,b1]=across(ring-G.width,ring),[s0,s1]=across(soilIn,soilOut),soilFrom=s.from-(along?R.west-G.width:soilIn),soilTo=s.to+(along?R.east-G.width:soilIn);
  const box=(lo,hi,a,b)=>along?{minX:lo,maxX:hi,minZ:a,maxZ:b}:{minX:a,maxX:b,minZ:lo,maxZ:hi};
  runs.push({owner:o.id,side,axis:s.axis,walled,gates:(o.gates?.[side]||[]).map(g=>[...g]),
   band:box(from,to,b0,b1),soil:box(soilFrom,soilTo,s0,s1),weedLine:s.at+s.out*(soilIn+Math.min(G.soil,soilOut-soilIn)/2),ring:o.rect});
  }
 }
 return runs;
}

/**
 * The open edges: along each side of every Kitahama lane (`lanes`), the stretches where the ground just outside is neither
 * paving, nor a plot's ring, nor a building, but the island's own level ground. There the gutter lies against the
 * paving's edge with the earth strip beyond it. Lanes running along x are laid first and take the corners.
 * `paved(x,z)` says where the ground is paved already: the ground plans' firm ground (ground-plan-quarters.js
 * quarterPaved), so the gutter is laid beside the paving and never on it.
 */
export function openEdgeRuns(rings,{paved,lanes=KITAHAMA_LANES}){
 const G=GUTTER,depth=G.width+G.soil,step=.1;
 const N=NEIGHBOURHOOD,taken=[],inside=(r,x,z,pad=0)=>x>=r.minX-pad&&x<=r.maxX+pad&&z>=r.minZ-pad&&z<=r.maxZ+pad;
 // A ring's own ground: from its plot's edge out to the paving. The plots themselves are solid, except the Heights'
 // garden, which runs right up to the lanes on its north and south and takes the open gutter there.
 const ringZones=rings.map(r=>{const z={...r.band};for(const b of [r.soil,r.ring])if(b){if(r.axis==='x'){z.minZ=Math.min(z.minZ,r.side==='north'?r.ring.maxZ:z.minZ);z.maxZ=Math.max(z.maxZ,r.side==='south'?r.ring.minZ:z.maxZ);}else{z.minX=Math.min(z.minX,r.side==='east'?r.ring.maxX:z.minX);z.maxX=Math.max(z.maxX,r.side==='west'?r.ring.minX:z.maxX);}}return z;});
 const school={minX:SCHOOL.minX-.9,maxX:SCHOOL.maxX+.9,minZ:SCHOOL.minZ,maxZ:SCHOOL.seawall.south+.6},solidPlots=TOWN_WALK_PLOTS.filter(p=>p.id!==KITAHAMA.apartment.id);
 const level=(x,z)=>inside(N,x,z)&&neighbourhoodHeight(x,z)===0&&!(x<=-24.6&&z<=29.3)&&!inside(school,x,z);
 const free=(x,z)=>!ringZones.some(r=>inside(r,x,z,.01))&&!solidPlots.some(p=>inside(p,x,z,.01))&&!taken.some(r=>inside(r,x,z,-.002));
 // The gutter needs its own ground; the earth strip beyond it only where there is room before other paving.
 const open=(x,z)=>level(x,z)&&!paved(x,z)&&free(x,z),room=(x,z)=>!level(x,z)||(!paved(x,z)&&free(x,z));
 const runs=[];lanes=[...lanes].sort((a,b)=>(b.maxX-b.minX>b.maxZ-b.minZ)-(a.maxX-a.minX>a.maxZ-a.minZ));
 for(const L of lanes){
  const alongX=L.maxX-L.minX>L.maxZ-L.minZ;
  for(const out of [-1,1]){
   const edge=alongX?(out<0?L.minZ:L.maxZ):(out<0?L.minX:L.maxX),from=alongX?L.minX:L.minZ,to=alongX?L.maxX:L.maxZ;
   const pt=(u,d)=>alongX?[u,edge+out*d]:[edge+out*d,u];
   let start=null,soilOK=true,soilReach=depth;
   const close=end=>{if(start!==null&&end-start>=.15){
     const box=(a,b,lo,hi)=>{const [c0,c1]=out>0?[edge+a,edge+b]:[edge-b,edge-a];return alongX?{minX:lo,maxX:hi,minZ:c0,maxZ:c1}:{minX:c0,maxX:c1,minZ:lo,maxZ:hi};};
     const run={owner:'lane',side:alongX?(out>0?'north':'south'):(out>0?'east':'west'),axis:alongX?'x':'z',walled:false,gates:[],
      band:box(0,G.width,start,end),soil:soilOK?box(G.width,Math.min(depth,soilReach),start,end):null,weedLine:edge+out*(G.width+G.soil/2),open:true};
     runs.push(run);taken.push(box(0,soilOK?Math.min(depth,soilReach):G.width,start,end));}
    start=null;};
   for(let u=from;u<to-1e-6;u+=step){
    const a=u,b=Math.min(to,u+step),along=[a+.01,(a+b)/2,b-.01],ok=[.05,.15].every(d=>along.every(v=>open(...pt(v,d))));
    // The earth strip goes as far as there is room, up to its 0.1 m, and is left out where there is less than 2 cm.
    const reach=ok?[.4,.38,.36,.34,.32].find(d=>along.every(v=>room(...pt(v,d-.01))))??0:0,soil=reach>=.32;
    if(soil)soilReach=start===null||!soilOK?reach:Math.min(soilReach,reach);
    if(ok&&start!==null&&soil!==soilOK){if(a-start>1)close(a);else soilOK=soilOK&&soil;}
    if(ok&&start===null){start=a;soilOK=soil;}if(!ok)close(a);if(ok&&b>=to-1e-6)close(b);
   }
  }
 }
 return runs;
}

/** The tyre lines: on the shared lanes vehicles use, two 0.3 m strips a kei truck's track apart. */
export const LANE_WEAR=Object.freeze([
 Object.freeze({lane:'cross lane',axis:'x',from:KITAHAMA.lane.minX+1,to:KITAHAMA.lane.maxX-1,at:(KITAHAMA.lane.minZ+KITAHAMA.lane.maxZ)/2}),
 Object.freeze({lane:'spine',axis:'x',from:KITAHAMA.spine.minX+1,to:KITAHAMA.spine.maxX-1,at:(KITAHAMA.spine.minZ+KITAHAMA.spine.maxZ)/2}),
]);
/** The stains, and what made each one. */
export const LANE_STAINS=Object.freeze([
 Object.freeze({x:11.6,z:61,r:.45,why:'fish boxes drip outside Kōji’s gate at 3 Kitahama'}),
 Object.freeze({x:-16,z:28.7,r:.5,why:'the rubbish point at the end of Well Lane, after collection'}),
]);
