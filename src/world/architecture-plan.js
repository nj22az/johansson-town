import {SHED_CIRCUIT} from './fujita-layout.js';

import {SCHOOL} from './school-layout.js';
import {POLICE_STATION} from './police-station-layout.js';
import {KITAHAMA,KITAHAMA_LANES} from './kitahama-layout.js';
import {NISHI,EAST_ROW,YARD_ROW,EAST_BACK} from './okinawa/layout.js';
import {YARD_HOMES} from './yard-homes-layout.js';
import {BOOKSHOP_WORKSHOP_PLOT} from './bookshop-workshop-layout.js';
/** Measured public circulation. Plot boundaries include garden walls; a path behind
 * a house inside a closed garden does not count as its public walking circuit. */
export const WALKING_STANDARD=Object.freeze({plotClear:2,coastClear:2.4,lane:3,offset:1.5,
 /** Where a fitting placed for a reason leaves less than the standard's clear width, the circuit is the lane that is
  * left, checked at its real width (a plot's `narrow`): never narrower than this, a person's width with room (the
  * walkers' body is 0.3 m round, the player's 0.32), and each with the fittings either side and why they are there. */
 personClear:.8});
/**
 * A side's narrow lane: its clear `radius` (half the width checked, at least personClear / 2), over `span` (the side's
 * running coordinate, x along a north or south side, z along an east or west side; the whole side when absent), with
 * `between` (what stands either side) and `why` (whose fitting it is and why it is there).
 */
const narrow=(radius,span,between,why)=>Object.freeze({radius,span:span&&Object.freeze(span),between:Object.freeze(between),why});
// The lane between the auction shed and the ice plant, shared by both circuits: 1.62 m at the drinks machine on the ice
// plant's west wall, 2.1 m at the auction's price board, checked along one line 1.1 m wide.
const AUCTION_LANE='The owner, 21 October 2026, of the fish market\u2019s drinks machine: "a vending machine misplaced in the fish market" (it stood on the auction floor); it stands on the ice plant\u2019s west wall, off the auction floor and north of the ice door (okinawa/quarters.js AUCTION_VENDING).';
const SOUTH_RETURN='The east lawn\u2019s south return wall along the auction apron, the lawn\u2019s edge over a strip that lay open 0.4 m deep, with its truck gate at the west end beside the harbour office (east-lawn.js, EAST_QUAY.gate): the lawn is reached from the quay through the gate, so the circuit keeps to the quay.';
const plot=(id,minX,maxX,minZ,maxZ)=>({id,minX,maxX,minZ,maxZ});
const EAST_ROW_WALKS=Object.freeze({
 'higa-saketen':{walkBounds:[EAST_ROW.minX-2.9,EAST_ROW.maxX+1.5,5.9-1.5,10.9+1.5]},
 nakamura:{walkBounds:[EAST_ROW.minX-1.5,EAST_ROW.maxX+1.5,-15.285,-9.2+1.5],narrow:Object.freeze({
  south:narrow(.6,null,['nakamura-planter','nakamura-bench-table'],'1.37 m between the planter under Nakamura\u2019s south wall and the table at the shop end of its dessert bench (okinawa/quarters.js: "A usable park-side eating bench"; okinawa/nakamura-dressing.js), kept with the vacant counter by the owner\u2019s decision of 31 October 2026.')})},
});
export const TOWN_WALK_PLOTS=Object.freeze([
 {...plot('port-building',3.7,17,-46.9,-38.4),walkBounds:[2.2,18.5,-48,-36.9]},
 plot('warehouse',-16.71,-10.57,-45.505,-37.295),
 {...plot('dock-workshop',-29.4,-20.6,-47.4,-40),walkBounds:[-30.9,-19.1,-48.5,-38.5]},
 plot('nishi-net-shed',-34.9,-27.4,-37.2,-29.9),
 // The auction shed and the ice plant keep to the quay: north of them is the east lawn's south return wall, and between
 // them the drinks machine (both narrow lanes, at their real widths).
 {...plot('fish-auction',20.8,29.2,-46.8,-40.6),walkBounds:[19.3,30.25,-48.3,-39.785],narrow:Object.freeze({
  north:narrow(.75,null,['auction-column','auction-catch','fish-counter','east-lawn-south-return'],'1.63 m between the shed\u2019s north columns and the return wall. '+SOUTH_RETURN),
  east:narrow(.55,[-44.8,-39.785],['auction-price-board','vending','east-lawn-south-return'],AUCTION_LANE)})},
 {...plot('ice-plant',31.8,36.2,-46.4,-40.4),walkBounds:[30.25,37.7,-47.9,-39.685],narrow:Object.freeze({
  west:narrow(.55,[-44.8,-39.685],['vending','auction-price-board','east-lawn-south-return'],AUCTION_LANE),
  north:narrow(.66,[30.25,37.2],['ice-plant','east-lawn-south-return'],'1.43 m between the plant\u2019s north wall and the return wall. '+SOUTH_RETURN)})},
 plot('fuel-depot',36.9,42.1,-35.1,-29.9),
 plot('park-shrine',10.225,11.375,-35.025,-34.175),
 // A metre out on its west side, between it and the power compound's east fence 2.2 m away.
 {...plot('town-hall-bike-shed',34,37.1,25.3,28),walkBounds:[33,38.6,23.8,29.5]},
 {...plot('sakura',-20.2,-7.45,-34.43,-20.17),walkBounds:[-22.6,-4.35,-35.93,-18.67]},
 {...plot('minato-and-ramen',-17.1,-7.8,-16.54,-6.1),walkBounds:[-18.6,-4.35,-18.04,-4.6]},
 // Minato Police Station (police-station-layout.js). Its circuit runs a metre out on the north, the plaza side clear of
 // the bench under the south wall, and on the Main Street footway 1.9 m out from the street face, past Mori's hibiscus
 // pots and the hanabuku beside the board; on the east service walk 1.8 m out, past the gas cylinders' hutch
 // (police-station-dressing.js, each with whose it is and why).
 {...plot('police-station',POLICE_STATION.minX,POLICE_STATION.maxX,POLICE_STATION.minZ,POLICE_STATION.maxZ),walkBounds:[POLICE_STATION.minX-1.9,POLICE_STATION.maxX+1.8,POLICE_STATION.minZ-1,POLICE_STATION.maxZ+1.5]},
 // The power house's public circuit is outside its fenced compound (school-layout.js: the house, its apron and its tank,
 // a gate in the east fence at the steel doors), as the standard says of a closed garden. West and north of the fence
 // stand the power line's pole, the flagpole and the town hall's colonnade: narrow lanes, at their real widths.
 {...plot('power-house',SCHOOL.powerHouse.minX,SCHOOL.powerHouse.maxX,SCHOOL.powerHouse.minZ,SCHOOL.powerHouse.maxZ),walkBounds:[24.02,32.9,22.9,33.525],narrow:Object.freeze({
  west:narrow(.44,null,['power-compound-fence','utility-pole','school-column'],'0.96 m between the compound\u2019s hana-block fence and the pole that carries the power house\u2019s line into town (school-layout.js, okinawa/props.js).'),
  north:narrow(.5,null,['school-flagpole','utility-pole','school-column'],'1.15 m between the flagpole and the line\u2019s pole, outside the fence, and the town hall\u2019s colonnade (school-layout.js: the old school\u2019s flagpole kept on the town hall\u2019s ground).'),
  east:narrow(.5,[33.15,33.525],['school-column'],'The last 0.4 m of the gate side, at the colonnade\u2019s corner.')})},
 plot('town-hall',12.1,41.2,24.6,45),
 plot('onsen',15.2,30.5,-24.4,-16.8),
 // Kitahama Heights: 2.1 m out on the east and 1.6 m on the north, past the drinks corner's machines and can bin
 // (okinawa/kitahama-quarter.js, the lot dressing).
 ...KITAHAMA.plots,{...KITAHAMA.apartment,walkBounds:[KITAHAMA.apartment.minX-1.5,KITAHAMA.apartment.maxX+2.1,KITAHAMA.apartment.minZ-1.5,KITAHAMA.apartment.maxZ+1.6]},
 ...NISHI.plots.filter(p=>p.kind!=='grove'&&p.kind!=='shed'),...EAST_BACK.plots,
 // Kissa Higa's circuit runs on the 5.7 m footway 2.9 m out from its front, past the yuntaku bench, its crate stools and
 // the bicycle (the owner, 21 October 2026: "A bench and two beer-crate stools in front of the shop"). Nakamura's south
 // side is the lane between its planter and its dessert bench's table (okinawa/quarters.js: "A usable park-side eating
 // bench"; the counter and its fittings kept, vacant, by the owner's decision of 31 October 2026).
 ...EAST_ROW.plots.map(p=>({...p,minX:EAST_ROW.minX,maxX:EAST_ROW.maxX,...EAST_ROW_WALKS[p.id]})),
 ...YARD_ROW.plots.map(p=>({...p,minX:YARD_ROW.minX,maxX:YARD_ROW.maxX,walkBounds:[YARD_ROW.minX-1.5,-3.9,p.minZ-1.5,p.maxZ+1.5]})),
 {...plot('frontrow',-15.42,-7.8,BOOKSHOP_WORKSHOP_PLOT.z-BOOKSHOP_WORKSHOP_PLOT.width/2-.22,BOOKSHOP_WORKSHOP_PLOT.z+BOOKSHOP_WORKSHOP_PLOT.width/2+.22),walkBounds:[-16.92,-3.9,-4.52,8.05]},
 ...Object.entries(YARD_HOMES).map(([id,p])=>plot(id,p.x-p.w/2-.05,p.x+p.w/2+.05,p.z-p.d/2-.05,p.z+p.d/2+.05)),
]);
/**
 * A circuit's sides, in plotCircuit's order: each says where a point of it is on a narrow lane (`narrowAt(x, z)`: that
 * lane, or null where the standard's clear width holds).
 */
export function plotSides(p,offset=WALKING_STANDARD.offset){
 const [a,b,c,d]=p.walkBounds??[p.minX-offset,p.maxX+offset,p.minZ-offset,p.maxZ+offset];
 return [['south',[a,c],[b,c]],['east',[b,c],[b,d]],['north',[b,d],[a,d]],['west',[a,d],[a,c]]].map(([side,from,to])=>{
  const n=p.narrow?.[side]||null,run=side==='south'||side==='north'?0:1;
  const narrowAt=(x,z)=>{if(!n||!n.span)return n;const v=run?z:x;return v>=Math.min(...n.span)-1e-9&&v<=Math.max(...n.span)+1e-9?n:null;};
  return {side,from,to,narrow:n,narrowAt};
 });
}
export function plotCircuit(p,offset=WALKING_STANDARD.offset){
 const [a,b,c,d]=p.walkBounds??[p.minX-offset,p.maxX+offset,p.minZ-offset,p.maxZ+offset];
 return [[a,c],[b,c],[b,d],[a,d],[a,c]];
}
export const ARCHITECTURE_ROUTES=[
 {id:'fujita-shed-circuit',width:1.2,surface:'wood',points:SHED_CIRCUIT},
 {id:'nishi-promenade',width:2.4,surface:'stone',points:[[-36.7,-38],[-36.7,30]]},
 ...NISHI.lanes.map((l,i)=>({id:'nishi-cross-lane-'+i,width:3,surface:'stone',points:[[-36.7,l.z],[-24.6,l.z]]})),
 {id:'main-street-extension',width:4.5,surface:'asphalt',points:[[-2.75,20.5],[-2.75,46]]},
 {id:'main-west-footway-extension',width:2.55,surface:'stone',points:[[-6.275,20.5],[-6.275,46]]},
 // Its square end reaches half its width past the last point: from 45.7 that is the cross lane's north edge (z 47.5),
 // not 0.3 m beyond it into the gutter in front of 8 Kitahama (okinawa/lane-edges.js), where the stone lay 5 mm under
 // the gutter's floor.
 {id:'main-east-footway-extension',width:3.6,surface:'stone',points:[[1.3,20.5],[1.3,45.7]]},
 ...KITAHAMA_LANES.map((p,i)=>{const horizontal=p.maxX-p.minX>p.maxZ-p.minZ,w=horizontal?p.maxZ-p.minZ:p.maxX-p.minX;return {id:'planned-neighbourhood-lane-'+i,width:w,surface:'stone',points:horizontal?[[p.minX+w/2,(p.minZ+p.maxZ)/2],[p.maxX-w/2,(p.minZ+p.maxZ)/2]]:[[(p.minX+p.maxX)/2,p.minZ+w/2],[(p.minX+p.maxX)/2,p.maxZ-w/2]]};}),
 {id:'north-residential-cross-lane',width:3,surface:'stone',points:[[-21.5,89.5],[4.5,89.5]]},
 ...TOWN_WALK_PLOTS.map(p=>({id:'building-circuit-'+p.id,width:2,surface:'stone',points:plotCircuit(p)})),
 // The common service lanes connect every shop's rear circuit to the quay and town.
 {id:'east-service-walk',width:2.4,surface:'stone',points:[[14.9,-13],[14.9,7],[14.9,24],[1.25,24]]},
 // The police station's yard, where the police box stood: concrete from the station's south wall to the old box's
 // paving edge, the patrol-car bay, the bicycle rack and the flagpole on it (police-station.js). A forecourt is paved
 // as a circuit is, in concrete, and gives way to every footway and lane it meets (street-plan.js).
 (({minX,maxX,minZ,maxZ})=>({id:'police-station-yard',forecourt:true,width:maxX-minX,surface:'concrete',points:[[(minX+maxX)/2,minZ+(maxX-minX)/2],[(minX+maxX)/2,maxZ-(maxX-minX)/2]]}))(POLICE_STATION.yard),
];
