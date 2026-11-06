import {MINATO_COMPACT as P} from './minato-compact-plan.js';

// Blender, the two doors, the walkers and the furniture share this measured plan.
// Bounds describe the usable inside faces. Solids retain their authored dimensions;
// there is no scale applied to the room or its people.
/** How far ahead of a sitter's mark a seat's front edge is (seat-slots.js `front`), measured on the fitted GLB: the round
 *  counter, ramen and ledge stools are .38 across, the booth benches as deep as the plan says. */
export const SHARED_DINING_SEAT_FRONT=Object.freeze({stool:.19,bench:P.booth.benchDepth/2});
export const SHARED_DINING_BOUNDS=Object.freeze({...P.bounds});
export const SHARED_DINING_FLOOR=Object.freeze(P.floorPolygon.map(p=>Object.freeze([...p])));
const solid=(id,fixture,height=fixture.top??fixture.height)=>({id,x:fixture.position[0],z:fixture.position[2]+(fixture.collisionOffsetZ||0),w:fixture.width,d:fixture.depth,height});
const wall=(id,x,z,w,d,height=P.ceilingY)=>({id,x,z,w,d,height});
const W=P.wc,T=P.wallThickness,doorLo=W.doorZ-W.doorWidth/2,doorHi=W.doorZ+W.doorWidth/2;
const partition=(id,z0,z1)=>wall(id,P.connection.x,(z0+z1)/2,P.connection.width,z1-z0);

export const SHARED_DINING_COLLIDERS=Object.freeze([
 solid('minato-counter',P.counter),solid('minato-worktop',P.worktop),
 solid('minato-backbar',P.backbar,P.floorY+P.backbar.height),
 solid('drinks-fridge',P.storage),solid('kitchen-sink',P.sink),
 ...P.counterStools.map(x=>wall('minato-stool',x,P.counterSeatZ,.6,.6,P.seatHeight)),
 wall('dining-table',P.booth.position[0],P.booth.position[2],P.booth.tableWidth,P.booth.tableDepth,P.booth.tableTop),
 ...P.booth.benchZ.map(z=>wall('dining-bench',P.booth.position[0],z,P.booth.benchWidth,P.booth.benchDepth,.98)),
 // The back and its cap project beyond the cushion footprint in the Blender model.
 ...P.booth.benchZ.map(z=>wall('dining-bench-back',P.booth.position[0],z+Math.sign(z-P.booth.position[2])*.235,P.booth.benchWidth+.025,.12,1.085)),
 partition('connecting-wall-rear',P.ramen.minZ,P.connection.minZ),
 partition('connecting-wall-front',P.connection.maxZ,P.main.maxZ),
 wall('wc-north',(W.minX+W.maxX)/2,W.minZ,W.maxX-W.minX,T),
 wall('wc-west-rear',W.minX,(W.minZ+doorLo)/2,T,doorLo-W.minZ),
 wall('wc-west-front',W.minX,(doorHi+W.maxZ)/2,T,W.maxZ-doorHi),
 // Parked folding leaves, hinges and handle: x .520–.6075, z 2.695–3.134 in plan 8.
 wall('wc-folded-door',W.doorX-.135,doorHi+.235,.10,.45,2.085),
 wall('wc-toilet',W.toilet[0],W.toilet[2],.44,.68,.82),
 wall('wc-basin',W.sink[0],W.sink[2],.48,.36,.86),
 solid('ramen-counter',P.ramenCounter),solid('ramen-prep',P.ramenPrep),
 ...P.ramenStools.map(x=>wall('ramen-stool',x,P.ramenSeatZ,.38,.38,P.seatHeight)),
 solid('wall-ledge',P.ramenLedge),
 ...P.ramenLedge.seatZ.map(z=>wall('ledge-stool',P.ramenLedge.seatX,z,.36,.36,P.seatHeight)),
 wall('ticket-machine',P.details.ticketMachine[0],P.details.ticketMachine[2],.5,.4,1.5),
 wall('pink-phone',P.details.phone[0],P.details.phone[2],.4,.26,1.3),
 wall('karaoke',P.details.karaoke[0],P.details.karaoke[2],.62,.48,P.details.karaoke[1]+1.1),
 wall('bottle-keep',P.details.keptBottleShelf.x+P.details.keptBottleShelf.depth/2,P.details.keptBottleShelf.z,P.details.keptBottleShelf.depth,P.details.keptBottleShelf.width,2.0),
].map(c=>Object.freeze(c)));
