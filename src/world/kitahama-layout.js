import {householdAtHome,activeHomeForResident,homeNameplate,HEIGHTS_HOUSES} from '../people/island-households.js';

/**
 * Kitahama (北浜), the new district on the north-east land the island gained in
 * October 2026: one lane up from the east beach past the town hall's seawall, one lane
 * across, five walled house plots on a compact street grid. The plots
 * are the same standard walled houses as Nishi-machi (red-tile or concrete, gate,
 * shisa, nameplate), so the island has one way of building a home. Who lives in each
 * is island-homes.js; the gate faces the lane.
 */
export const KITAHAMA=Object.freeze({
 /** From the north end of the beach, between the town hall's seawall and the shore. */
 approach:Object.freeze({minX:42,maxX:45,minZ:30.5,maxZ:75}),
 /** The cross lane the houses face. */
 lane:Object.freeze({minX:-35,maxX:45,minZ:57.5,maxZ:61.5}),
 plots:Object.freeze([
  {id:'kitahama-1',kind:'red-tile',family:"Tuan Thao",romaji:'Thuan, Thao & Chin',minX:20,maxX:28,minZ:48,maxZ:57,gate:'north'},
  {id:'kitahama-2',kind:'concrete',family:"Sato",romaji:'Sato',minX:33,maxX:41,minZ:48,maxZ:57,gate:'north'},
  {id:'kitahama-3',kind:'concrete',family:"Uehara",romaji:'Uehara',minX:7,maxX:15,minZ:62,maxZ:71,gate:'south'},
  // 4 and 5 Kitahama (x 20–28 and 33–41 on the north row) and 6 Kitahama (x −32..−24 on the south row) were removed in
  // phase 4 of docs/CAST-CONSOLIDATION.md with their residents (the postman, Grandmother Chinen, the former master);
  // 7, 9, 10, 11 and 12 by the housing project before it. Their lots are KITAHAMA_CLEARED (okinawa/lots.js), waiting
  // for the dressing pass the owner deferred (addendum 2). `family` and `romaji` are what the nameplate on the gate
  // says (the house's own sign); who lives there is the cast (people/cast.js).
  {id:'kitahama-8',kind:'concrete',family:'Uezu',romaji:'Uezu',minX:-6,maxX:2,minZ:48,maxZ:57,gate:'north'},
 ].map(p=>{const plate=homeNameplate(p.id);return Object.freeze({...p,wall:'block',family:plate.address,romaji:plate.owners});})),
 field:Object.freeze({minX:37,maxX:47,minZ:84,maxZ:88.2}),
 /** The quarter's lanes, each 3 m: the spine west from the cross lane, and two dead ends. */
 spine:Object.freeze({minX:-35,maxX:45,minZ:72,maxZ:75}),
 fukugiLane:Object.freeze({minX:-23,maxX:-20,minZ:30.5,maxZ:91}),
 wellLane:Object.freeze({minX:-17.5,maxX:-14.5,minZ:26.8,maxZ:30.8}),
 /** Main Street continues directly through the relocated residential blocks. */
 footpath:Object.freeze({minX:3,maxX:6,minZ:30.5,maxZ:91}),
 northLane:Object.freeze({minX:-35,maxX:45,minZ:44.5,maxZ:47.5}),
 eastLane:Object.freeze({minX:-36,maxX:-33,minZ:30.5,maxZ:75}),
 southLane:Object.freeze({minX:-36,maxX:6,minZ:29.3,maxZ:32.3}),
 westCrossLane:Object.freeze({minX:-36,maxX:-20,minZ:44.5,maxZ:47.5}),
 /**
  * The two side lanes between the houses of the south row (1 and 2 Kitahama, and the cleared 9) run from the north
  * lane to the cross lane. They used to carry on to the spine between 3, 4 and 5 Kitahama; with 4 and 5 gone (phase 4)
  * nothing stood on either side of those 10 m, so the lanes end at the cross lane, and the cleared ground behind it
  * is one block from the middle of 3 Kitahama's east wall to the approach (KITAHAMA_CLEARED, okinawa/lots.js). The
  * spine stays: it is the loop that joins the east lane, Fukugi Lane, the footpath and the approach, and the rubbish
  * truck's and the cane lorry's way round.
  */
 middleLane:Object.freeze({minX:16,maxX:19,minZ:45.1,maxZ:61.5}),
 mainCrossLane:Object.freeze({minX:-7.55,maxX:6,minZ:30.5,maxZ:33.5}),
 fieldLane:Object.freeze({minX:29,maxX:32,minZ:45.1,maxZ:61.5}),
 /** Kitahama Heights on Fukugi Lane: two attached ground-floor houses (KITAHAMA_HEIGHTS), the lot kept at the block's size. */
 apartment:Object.freeze({id:'kitahama-flats',minX:-32,maxX:-24,minZ:33.5,maxZ:44.5,name:'Kitahama Heights'}),
 /** The pocket park at the corner of the spine and Well Lane. */
 park:Object.freeze({minX:-19,maxX:-11,minZ:34.5,maxZ:43.5}),
 /** The compact residential blocks share the town datum. neighbourhood-ground.js
  * supplies their ground and grades the outer edge back to the island. */
 y:0,
});
/** Every lane in Kitahama: the approach, the cross lane, and the quarter's. The map, the walk surface, the gutters and the walking tests read this list. */
export const KITAHAMA_LANES=Object.freeze([KITAHAMA.approach,KITAHAMA.lane,KITAHAMA.spine,KITAHAMA.fukugiLane,KITAHAMA.wellLane,KITAHAMA.footpath,KITAHAMA.northLane,KITAHAMA.eastLane,KITAHAMA.fieldLane,KITAHAMA.southLane,KITAHAMA.westCrossLane,KITAHAMA.middleLane,KITAHAMA.mainCrossLane]);
/** Whether a circle of radius r stands on one of Kitahama's lanes. */
export function kitahamaLaneAt(x,z,r=0){
 return KITAHAMA_LANES.some(L=>x>=L.minX+r&&x<=L.maxX-r&&z>=L.minZ+r&&z<=L.maxZ-r);
}
/** A plot's gate, the point just outside it, and the heading of somebody walking in. */
export function plotGate(p,out=.7){
 const cx=(p.minX+p.maxX)/2,cz=(p.minZ+p.maxZ)/2;
 if(p.gate==='north')return {door:[cx,p.maxZ+out],inward:0};
 if(p.gate==='south')return {door:[cx,p.minZ-out],inward:Math.PI};
 if(p.gate==='east')return {door:[p.maxX+out,cz],inward:Math.PI/2};
 return {door:[p.minX-out,cz],inward:-Math.PI/2};
}

/**
 * Canonical occupants of the homes whose walking residents are put to bed in them (home-residents.js): Thao, Chin and
 * Vy at 1 Kitahama, Mrs Sato at 2, and Nhung at 3 Kitahama with Kōji and Riku since phase 3 of the consolidation
 * (docs/CAST-CONSOLIDATION.md §7: her family reunited as one household).
 */
export const KITAHAMA_RESIDENT_HOMES=Object.freeze({
 'kitahama-1':householdAtHome('kitahama-1').residents,
 'kitahama-2':householdAtHome('kitahama-2').residents,
 'kitahama-3':householdAtHome('kitahama-3').residents,
});
export const ISLAND_RESIDENT_NAMES=Object.freeze(Object.values(KITAHAMA_RESIDENT_HOMES).flat());
/** The home record a walking resident's profile reads (residents.js). */
export function kitahamaHomeFor(name){
 const h=activeHomeForResident(name),p=KITAHAMA.plots.find(q=>q.id===h?.home);
 if(!p)return null;
 return {door:[...plotGate(p).door],address:h.address,plot:p.id};
}

/**
 * Kitahama Heights (docs/CAST-CONSOLIDATION.md addendum 6): two attached ground-floor houses side by side along Fukugi
 * Lane, A to the north and B to the south of the party wall at the lot's middle, each with its own front door on the
 * lane side, its gate in the low block wall and a strip of garden between (okinawa/kitahama-quarter.js draws them). No
 * corridor, no stair, no upper storey: every door is at ground level, so a visitor walks from the lane to the gate to
 * the door. `door` is the front door; `approachPosition` the point on the lane a visitor is routed to, as every
 * Kitahama gate is (plotGate); `gate` the opening in the front wall, in world z.
 */
const HEIGHTS_BODY=(()=>{const A=KITAHAMA.apartment;return Object.freeze({x0:A.minX+.5,x1:A.maxX-2.6,z0:A.minZ+.6,z1:A.maxZ-.6,party:(A.minZ+A.maxZ)/2,height:3.0});})();
export const KITAHAMA_HEIGHTS=Object.freeze({
 ...HEIGHTS_BODY,lot:KITAHAMA.apartment,
 houses:Object.freeze(HEIGHTS_HOUSES.map(h=>{
  const B=HEIGHTS_BODY,z=h.side==='north'?(B.party+B.z1)/2:(B.z0+B.party)/2,minZ=h.side==='north'?B.party:B.z0,maxZ=h.side==='north'?B.z1:B.party;
  return Object.freeze({id:h.id,house:h.house,name:h.name,side:h.side,minZ,maxZ,z,
   door:Object.freeze([B.x1+.65,KITAHAMA.y+.02,z]),approachPosition:Object.freeze([KITAHAMA.fukugiLane.minX+.2,KITAHAMA.y+.04,z]),
   faceX:B.x1+.03,inward:-Math.PI/2,approachFacing:-Math.PI/2,gate:Object.freeze([z-.95,z+.95])});
 })),
});
/** Every door in the pair (the unit list the registry, the directory and the lights read). */
export const KITAHAMA_FLATS=KITAHAMA_HEIGHTS.houses;
