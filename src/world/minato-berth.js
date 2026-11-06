import {OUTER_PIER} from './layout.js';

/**
 * The Minato Maru's berth at Minato: the outer pier's west face fitted out for the bigger ship
 * (docs/FERRY-AUDIT.md §6, batch 4a; briefs/ferry-audit.md §6.1), and the anglers' corner at the
 * pier's new end. What stands where, and why; town.js builds it, ferry-paths.js lays her alongside it.
 *
 * World frame: x east, z north (the pier runs south, to −z, from the quay at z −49.65 to −88).
 * The 34.5 m ship lies here with her stem at z −52 and her stern at −86.5; today's 22 m ship lies
 * on the same fenders from −50.5 to −72.5 until she is replaced (batch 5).
 */
const WEST=OUTER_PIER.x-OUTER_PIER.width/2;
/** The coping's outer face along the west flank (the coping beam stands 0.09 m proud of the slab). */
const FACE=WEST-.09;
const PIER_END=OUTER_PIER.z-OUTER_PIER.length/2;

export const MINATO_BERTH=Object.freeze({
 face:FACE,
 /**
  * V-type rubber fenders (V型防舷材, 250 mm high, 1 m long) bolted upright to the coping face at 4 m
  * centres, from just under the deck edge to 0.4 m below the water, so they take her side at any
  * tide. Nine of them span her length; the 22 m ship lies on the first six.
  */
 fenders:Object.freeze({depth:.25,length:1,base:.52,front:.26,top:.04,z:Object.freeze([-52,-56,-60,-64,-68,-72,-76,-80,-84])}),
 /** The line her side lies on: the faces of the fenders. */
 line:FACE-.25,
 /**
  * Cast-iron bitts (曲柱) 0.45 m in from the face, one for each of her lines: the head line from the
  * bow, the forward spring leading aft from the bow, the after spring leading forward from the stern,
  * the stern line from the stern. The forward spring's bitt stands at −62, a metre clear of the
  * 22 m ship's gangway (z −63.5), which lands between it and the queue.
  */
 bitts:Object.freeze([
  Object.freeze({z:-53,line:'head line'}),
  Object.freeze({z:-62,line:'forward spring'}),
  Object.freeze({z:-77,line:'after spring'}),
  Object.freeze({z:-87,line:'stern line'}),
 ].map(b=>Object.freeze({...b,x:WEST+.45}))),
 /** A steel ladder recessed into the face between two fenders: the way up for anyone who falls in between ship and pier. */
 ladder:Object.freeze({z:-66,width:.5,bottom:-1.9}),
 /** Pier lamps on the centreline: the old one, and one more over the new length and her gangway. */
 lamps:Object.freeze([-63.25,-79.5]),
 /** The new end: its rail across the pier, and how far out you can walk (layout.js OUTER_PIER.open: the rail, less the lifebuoy on it). */
 end:Object.freeze({z:PIER_END,rail:PIER_END+.4,walk:OUTER_PIER.open}),
 /**
  * The anglers' corner at the end, where the fishing is: the bait station (bait and ice), the winch
  * at the east edge (it hauls a basket or a skiff up from the water), the anglers' crates, the coiled
  * rope, and a lifebuoy hung on the end rail among them. All of it east of the stern line's bitt, out
  * of her lines, with room between for the anglers.
  */
 anglers:Object.freeze({
  bait:Object.freeze([-1.75,PIER_END+2.75]),
  winch:Object.freeze([3,PIER_END+3.6]),
  crates:Object.freeze([-3.05,PIER_END+4.2]),
  rope:Object.freeze([1.05,PIER_END+1]),
  fishing:Object.freeze([0,PIER_END+1.2]),
  lifebuoy:Object.freeze([-.45,PIER_END+.53]),
 }),
 /**
  * The ramp's landing on the quay: a 24 mm steel plate let into the quay's edge, its top flush with
  * the concrete, where the raised coping and kerb are cut away; wide enough for the 4.4 m ramp of the
  * 34.5 m ship (x −10.84 to −6.44) and the 22 m ship's 3.8 m one (−9.54 to −5.74), and long enough for
  * the leaf's end (at z −48.2) and its 2 m flap, so the ramp rests on steel and the cars drive off
  * level, not over a kerb. A steel angle 8 cm wide armours the quay's edge in front of it (harbour.js
  * casts the slab round both). Nothing stands on it.
  */
 landing:Object.freeze({minX:-10.95,maxX:-5.55,minZ:-50,maxZ:-45.6,top:-.016,thickness:.024,angle:.08,
  /** Where the warehouse's corner stands (x −10.57 from z −47.96): north of the leaf's touchdown the plate is narrower, under the flap. */
  flapMinX:-10.5,flapFromZ:-48.1}),
 /** The quay bollard for her starboard bow line, moved off the landing (it stood at x −10). */
 quayBollard:Object.freeze([-12.3,-49.3]),
});

/**
 * The island cargo boat's berth: the same pier's east face, from the quay out to z −72 (batch 4b). The
 * boat (cargo-shipping.js, a 19-ton class island cargo boat, 20 × 5 m) lies starboard side to,
 * bow to the quay 2 m off it, on five V-type fenders; four bitts on the east edge take her lines. She
 * comes in from the open water east of the harbour, round the breakwater's east end, so she never
 * crosses the ferry's water west of the pier. Her board, the staging bay and the depot's forklift stay on the
 * west quay by the depot she supplies.
 */
const EAST=OUTER_PIER.x+OUTER_PIER.width/2,EAST_FACE=EAST+.09;
export const CARGO_BERTH=Object.freeze({
 face:EAST_FACE,
 fenders:Object.freeze({...MINATO_BERTH.fenders,z:Object.freeze([-53,-57,-61,-65,-69])}),
 line:EAST_FACE+.25,
 boat:Object.freeze({length:20,beam:5}),
 bitts:Object.freeze([
  Object.freeze({z:-53,line:'head line'}),
  Object.freeze({z:-60,line:'forward spring'}),
  Object.freeze({z:-64,line:'after spring'}),
  Object.freeze({z:-73,line:'stern line'}),
 ].map(b=>Object.freeze({...b,x:EAST-.45}))),
 x:EAST_FACE+.25+2.5,z:-52-10,yaw:0,
});

/**
 * The fishing boat that lay off the pier's east face, now alongside the main quay east of the pier,
 * next to the east quay's boats: on the quay wall's tyre fender at x 14, her lines to the quay's
 * bollards at x 10 and 15, and 4 m clear of the cargo boat's side.
 */
export const QUAY_FISHING_BOAT=Object.freeze({x:16.65,z:-51.6,yaw:Math.PI/2,length:6.3,beam:2.9,bollards:Object.freeze([[10,-49.3],[15,-49.3]])});

