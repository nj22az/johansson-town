/**
 * Minato Police Station (港警察署), on the lawn corner where Main Street opens into the bus plaza.
 *
 * The owner, 19 October 2026: "the police station should be a real big police station that you can interact with and go
 * inside; the police station could easily grow to the empty lot". His ruling the same day (AGENTS.md, the consolidation's
 * addendum 1): a real station on the empty lot next to the kōban, enterable like the shops, with Officer Mori's
 * accommodation inside it; his home id stays `koban` (the roster and the save migration depend on it).
 *
 * So the station takes both pieces of ground. The building stands on the lot: the empty lawn between Higa Liquor's yard
 * and the old police box, 6.9 m by 8 m, its street face on Main Street's east footway, two storeys of plain Shōwa
 * concrete with a flat roof behind a parapet, as small-town stations were built in the seventies. Where the police box
 * stood is now the station's yard on the bus plaza: the patrol-car bay, the bicycle rack, the flagpole. The old box is
 * gone; its counter window lives on in the station's front wall, under the same 交番 sign, because people still come up
 * to it to ask the way.
 *
 * World metres, +x east (away from Main Street), +z south (away from the harbour). Everything that has to agree (the
 * building, its colliders, the yard's paving, the walk circuit, the interior, the people who live and work here) reads
 * its measurements from here.
 */
export const POLICE_STATION=Object.freeze({
 id:'koban',
 /** The building's outer walls. */
 minX:5.7,maxX:12.6,minZ:14,maxZ:22,
 /** Ground-floor level (a low plinth, one step up from the footway), each storey, the roof slab and the parapet's top. */
 plinth:.12,storey:3,roof:6.15,parapet:6.75,
 /** The street face, and the glazed sliding doors in it, at its south end, the corner you see from the bus. */
 face:5.7,entrance:Object.freeze({z:20.3,half:.6}),
 /** The counter window (交番) in the street face, north of the doors: the old police box's job, kept. */
 window:Object.freeze({z:16.2,half:.8}),
 /** The back door in the south wall, out to the yard and the car. */
 backDoor:Object.freeze({x:11.85,half:.42}),
 /** The yard where the police box stood: concrete, from the station's south wall to the old box's paving edge. */
 yard:Object.freeze({minX:3.1,maxX:9.65,minZ:22,maxZ:31.66}),
});
const S=POLICE_STATION;

/**
 * The yard's furniture, each with who it is for and why it stands where it does (CLAUDE.md: nothing is random).
 */
export const STATION_YARD=Object.freeze({
 /** Reverse-parked, nose to the plaza, so the car leaves forwards in a hurry (it never has, but it could). */
 car:Object.freeze({x:7.85,z:26.6,length:3.39,width:1.47,heading:'west',
  why:'The station’s one car, a white-and-black kei patrol car: narrow enough for Kitahama’s lanes and the lane up to the sea cave.'}),
 /**
  * A front-wheel rack (前輪式) of four slots along the yard's south side, out of the car's way, 0.7 m apart (a bicycle's
  * bars are 0.58 m): each bicycle stands with its front wheel between a slot's two guides, which are on the line `slot`,
  * and its body behind, to the south. Mori's white bicycle is in the first slot, the lost child's in the third, and the
  * others are for visitors, so nobody leans a bicycle on the notice board.
  */
 rack:Object.freeze({x0:7.1,x1:9.2,slot:29.08,slots:4,z:29.6,why:'Mori’s white bicycle lives in the first slot. The others are for visitors, so nobody leans a bicycle on the notice board.'}),
 /**
  * The flagpole at the yard's south-west corner, by the plaza, where the flag is seen across the bus plaza and up Main
  * Street; 2.5 m clear of the rack, so no bicycle stands in front of it seen from the plaza (the owner's phone, 20 October
  * 2026: a bicycle seemed to stand in the pole when it was behind the rack). Its foot is on the yard's own concrete, which
  * starts at the footway's edge (x 5.2, ground-plan-quarters.js), 2.7 m from the rack's first slot: at x 4.0 it stood on
  * the footway, in the middle of the lane that opens north from the plaza across this corner (x 4.5), where a walker
  * up the lane met it.
  */
 flagpole:Object.freeze({x:5.45,z:31.2,height:6.2,raise:510,lower:1035,
  why:'The national flag, raised at half past eight when the desk opens for the day and lowered at a quarter past five.'}),
 /** Against the station's south wall, under the eave, facing the bus plaza. */
 bench:Object.freeze({x:7.4,z:22.26,length:1.6,why:'For whoever is waiting: to see the officer, for the bus, or for a child to be collected.'}),
 /** The station's outdoor air-conditioner, on the south wall beside the back door: Okinawa's summers, and the duty office behind it. */
 aircon:Object.freeze({x:9.05,z:22.18}),
});

/** The street face's outdoor notice board, between the counter window and the doors. */
export const STATION_NOTICE=Object.freeze({z0:17.4,z1:19.1,y0:1.0,y1:1.95});

/**
 * Officer Mori's home and his station, as the people code reads them (people/residents.js, people/home-directory.js):
 * the id `koban`, the door point on the footway in front of the glazed doors, and the heading you walk in with.
 */
export const KOBAN=Object.freeze({
 id:S.id,title:'Minato Police Station',jp:'Police station',
 x:(S.minX+S.maxX)/2,z:(S.minZ+S.maxZ)/2,w:S.maxX-S.minX,d:S.maxZ-S.minZ,height:S.parapet,
 face:S.face,door:Object.freeze([S.face-.65,S.entrance.z]),
 /** Walking in heads east, into the lobby. */
 inward:-Math.PI/2,
 address:'Minato Police Station, top of Main Street',
 resident:'Officer Mori',
});

/** The station's own ground: the building and its yard. */
export const inPoliceStation=(x,z,r=0)=>x>S.minX-r&&x<S.maxX+r&&z>S.minZ-r&&z<S.maxZ+r;
export const inPoliceYard=(x,z,r=0)=>x>S.yard.minX-r&&x<S.yard.maxX+r&&z>S.yard.minZ-r&&z<S.yard.maxZ+r;
