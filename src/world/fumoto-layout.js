/**
 * Fumoto ("the foot of the mountain"), the farming hamlet at the south-west foot of
 * Mount Aoba: an Okinawan buraku as it stood from the seventies to the nineties.
 *
 *  - Houses in walled yards, every one facing south (+z, towards the sun and the cane),
 *    on lanes of white coral sand. Red tile and coral stone for the old families, concrete
 *    and block for the ones who rebuilt after a typhoon.
 *  - The main lane comes up from the coastal road through the gap between the two south
 *    cane fields, through the hamlet, and joins the summit path below Aoba Radio, so the
 *    hamlet is on the way up the mountain.
 *  - The asagi square (the village's open ground) under an old gajumaru, with the
 *    village well (mura-gā) and the stone bench where everybody sits in the evening.
 *  - The kyōdō baiten, the co-operative store the hamlet owns together: everyday goods,
 *    the telephone, the post box, and the notices.
 *
 * The ground here is the island's own, flattened round the hamlet (island-plan.js), at
 * the same level as Kitahama. The houses are the town's standard walled plots
 * (okinawa/quarters.js walledHouse); who lives in them is people/island-households.js.
 *
 * A plot's `gate:'north'` is the code's name for a gate on the plot's +z side (the frame
 * walledHouse builds in); on the island +z is south, and these gates look south.
 */
export const FUMOTO=Object.freeze({
 name:'Fumoto',
 /** Everything the hamlet owns, for the terrain, the trees and the map. */
 bounds:Object.freeze({minX:3,maxX:46,minZ:175,maxZ:224}),
 /** The level of the hamlet's ground: the island's (coastal-ground.js ISLAND_GROUND_Y). */
 y:-.4,
 /** The main lane: from the coastal road, north between the cane, up to the summit path. */
 mainLane:Object.freeze([[34,228],[34,226],[34,180],[42.6,171.9]]),
 /** The two cross lanes the houses face, west from the main lane. */
 upperLane:Object.freeze([[5,192.5],[32.5,192.5]]),
 lowerLane:Object.freeze([[5,214.5],[32.5,214.5]]),
 laneWidth:3,
 /**
  * The power line: the feeder comes from the Rainflower circuit up the mountain trail's
  * verge, west of Aoba Radio, to the top of the main lane, then runs down the lane's east
  * verge to the cane. Trees are kept clear of it (island-landscape.js).
  */
 feeder:Object.freeze([[26.3,137.5],[27.2,160.5],[35.25,174.5],[35.25,186]]),
 lanePoles:Object.freeze([[35.25,186],[35.25,208],[35.25,215],[38.5,219.8]]),
 plots:Object.freeze([
  {id:'fumoto-1',kind:'red-tile',family:'Kuniyoshi',romaji:'Kuniyoshi',minX:7,maxX:18,minZ:178,maxZ:190.5,gate:'north'},
  {id:'fumoto-2',kind:'red-tile',family:'Tokashiki',romaji:'Tokashiki',minX:21,maxX:32,minZ:178,maxZ:190.5,gate:'north'},
  {id:'fumoto-3',kind:'concrete',family:'Ishimine',romaji:'Ishimine',minX:7,maxX:18,minZ:200,maxZ:212.5,gate:'north',wall:'block'},
  {id:'fumoto-4',kind:'red-tile',family:'Zukeran',romaji:'Zukeran',minX:21,maxX:32,minZ:200,maxZ:212.5,gate:'north'},
 ].map(Object.freeze)),
 /** The co-operative store, its front (the sliding doors) on the main lane. */
 store:Object.freeze({id:'fumoto-baiten',name:'Fumoto Co-op Store',minX:36.2,maxX:43.4,minZ:194,maxZ:201.5,front:'west'}),
 /** The asagi square: coral sand under the gajumaru, beside the main lane. */
 square:Object.freeze({minX:35.5,maxX:45,minZ:204,maxZ:221}),
 banyan:Object.freeze([41.5,214]),
 well:Object.freeze([38.6,208]),
 bench:Object.freeze([41.5,218.4]),
 notices:Object.freeze([36.2,203.4]),
});

/** The lanes and the square as walking routes (island-plan.js ISLAND_ROUTES). */
export const FUMOTO_ROUTES=Object.freeze([
 {id:'fumoto-main-lane',width:FUMOTO.laneWidth,surface:'coral-sand',points:FUMOTO.mainLane},
 {id:'fumoto-upper-lane',width:FUMOTO.laneWidth,surface:'coral-sand',points:FUMOTO.upperLane},
 {id:'fumoto-lower-lane',width:FUMOTO.laneWidth,surface:'coral-sand',points:FUMOTO.lowerLane},
 {id:'fumoto-square',width:FUMOTO.square.maxX-FUMOTO.square.minX,surface:'coral-sand',
  points:[[(FUMOTO.square.minX+FUMOTO.square.maxX)/2,FUMOTO.square.minZ],[(FUMOTO.square.minX+FUMOTO.square.maxX)/2,FUMOTO.square.maxZ]]},
].map(r=>Object.freeze({...r,peninsula:true})));

/** Whether (x,z) lies within `pad` metres of the hamlet. */
export function inFumoto(x,z,pad=0){
 const b=FUMOTO.bounds;return x>=b.minX-pad&&x<=b.maxX+pad&&z>=b.minZ-pad&&z<=b.maxZ+pad;
}

/** Whether (x,z) is within `pad` metres of the hamlet's power line. */
export function nearFumotoLine(x,z,pad=3.5){
 for(const line of [FUMOTO.feeder,FUMOTO.lanePoles])for(let i=1;i<line.length;i++){
  const [ax,az]=line[i-1],[bx,bz]=line[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
  if(Math.hypot(x-ax-dx*t,z-az-dz*t)<pad)return true;
 }
 return false;
}
