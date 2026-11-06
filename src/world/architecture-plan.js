import {SHED_CIRCUIT} from './fujita-layout.js';

import {SCHOOL} from './school-layout.js';
import {POLICE_STATION} from './police-station-layout.js';
import {KITAHAMA,KITAHAMA_LANES} from './kitahama-layout.js';
import {NISHI,EAST_ROW,YARD_ROW,EAST_BACK} from './okinawa/layout.js';
import {YARD_HOMES} from './yard-homes-layout.js';
import {BOOKSHOP_WORKSHOP_PLOT} from './bookshop-workshop-layout.js';
/** Measured public circulation. Plot boundaries include garden walls; a path behind
 * a house inside a closed garden does not count as its public walking circuit. */
export const WALKING_STANDARD=Object.freeze({plotClear:2,coastClear:2.4,lane:3,offset:1.5});
const plot=(id,minX,maxX,minZ,maxZ)=>({id,minX,maxX,minZ,maxZ});
export const TOWN_WALK_PLOTS=Object.freeze([
 {...plot('port-building',3.7,17,-46.9,-38.4),walkBounds:[2.2,18.5,-48,-36.9]},
 plot('warehouse',-16.71,-10.57,-45.505,-37.295),
 {...plot('dock-workshop',-29.4,-20.6,-47.4,-40),walkBounds:[-30.9,-19.1,-48.5,-38.5]},
 plot('nishi-net-shed',-34.9,-27.4,-37.2,-29.9),
 {...plot('fish-auction',20.8,29.2,-46.8,-40.6),walkBounds:[19.3,30.5,-48.3,-36.9]},
 plot('ice-plant',31.8,36.2,-46.4,-40.4),
 plot('fuel-depot',36.9,42.1,-35.1,-29.9),
 plot('park-shrine',10.225,11.375,-35.025,-34.175),
 plot('town-hall-bike-shed',34,37.1,25.3,28),
 {...plot('sakura',-20.2,-7.45,-34.43,-20.17),walkBounds:[-22.6,-4.35,-35.93,-18.67]},
 {...plot('minato-and-ramen',-17.1,-7.8,-16.54,-6.1),walkBounds:[-18.6,-4.35,-18.04,-4.6]},
 // Minato Police Station (police-station-layout.js). Its circuit runs a metre out on every side, so the paving meets the
 // walls with no verge between: the Main Street footway on the street face, Higa Liquor's circuit to the north, the
 // east service walk behind, and the plaza side clear of the bench under the south wall.
 {...plot('police-station',POLICE_STATION.minX,POLICE_STATION.maxX,POLICE_STATION.minZ,POLICE_STATION.maxZ),walkBounds:[POLICE_STATION.minX-1,POLICE_STATION.maxX+1,POLICE_STATION.minZ-1,POLICE_STATION.maxZ+1.5]},
 plot('power-house',SCHOOL.powerHouse.minX,SCHOOL.powerHouse.maxX,SCHOOL.powerHouse.minZ,SCHOOL.powerHouse.maxZ),
 plot('town-hall',12.1,41.2,24.6,45),
 plot('onsen',15.2,30.5,-24.4,-16.8),
 ...KITAHAMA.plots,KITAHAMA.apartment,
 ...NISHI.plots.filter(p=>p.kind!=='grove'&&p.kind!=='shed'),...EAST_BACK.plots,
 ...EAST_ROW.plots.map(p=>({...p,minX:EAST_ROW.minX,maxX:EAST_ROW.maxX})),
 ...YARD_ROW.plots.map(p=>({...p,minX:YARD_ROW.minX,maxX:YARD_ROW.maxX,walkBounds:[YARD_ROW.minX-1.5,-3.9,p.minZ-1.5,p.maxZ+1.5]})),
 {...plot('frontrow',-15.42,-7.8,BOOKSHOP_WORKSHOP_PLOT.z-BOOKSHOP_WORKSHOP_PLOT.width/2-.22,BOOKSHOP_WORKSHOP_PLOT.z+BOOKSHOP_WORKSHOP_PLOT.width/2+.22),walkBounds:[-16.92,-3.9,-4.52,8.05]},
 ...Object.entries(YARD_HOMES).map(([id,p])=>plot(id,p.x-p.w/2-.05,p.x+p.w/2+.05,p.z-p.d/2-.05,p.z+p.d/2+.05)),
]);
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
