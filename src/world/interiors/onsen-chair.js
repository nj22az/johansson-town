import {assetPlacement} from '../../catalog/catalog.js';

/**
 * Umi-no-yu's coin massage chair (the creator, 2026-10-10: "The chair needs to be clearer in the comic it's a bit blurry we
 * don't see what Fujita is wanting to sit on"; "I would like to build assets in studio and assemble them in world").
 *
 * It is Johansson Studio's 'massage-chair' from World's catalogue (assets/catalog, src/catalog/catalog.js): a 1990s lobby
 * chair in sky-blue vinyl on an ivory shell, with a coin box on its right arm, a remote on its left and a calf and foot
 * massager in front. Its card says who it is for and why (Bathers resting after the bath; Mr Fujita) and gives its
 * colliders, its seat and its anchors; this file says where it stands in the lobby, what the room draws on it itself, and
 * derives from the card what the rest of the onsen reads (the seat, the seat's front edge, the arm the offering stands on).
 *
 * The room keeps drawing what moves, lights or is wired (the card's `replaces.keep`): the coin timer's LED readout and its
 * 運転中 lamp, the two kneading rollers, the cord to the 1994 socket, and the rating plate (onsen-electrics.js), each on
 * the model's anchors. The model's own copies of those are left out here (`omit`).
 */
export const ONSEN_CHAIR=Object.freeze({
 asset:'massage-chair',x:4.505,z:3.55,yaw:-Math.PI/2,
 why:'Its back to the east wall on the men’s side, beside the milk cooler, facing the lobby: where the bath’s chair has always stood. Its body covers exactly the old chair’s footprint (x 4.20–4.81, z 3.10–4.00) and its seat is where the old one was (the mark 4.25, 3.55, the seat 0.50 high, its front edge at x 4.20), so no mark, walk or camera round it moves; only its leg rest comes 12 cm further into the lobby.',
 // The model's lamp is unlit glass that would glow through a blackout; its printed 10:00 cannot count; its rollers are one
 // still mesh; and the room runs its own cord to its own socket. The room's versions are below and in onsen-electrics.js.
 omit:Object.freeze(['Massage chair lamp','Massage chair timer display','Massage chair rollers','Massage chair cord']),
 /** The 運転中 lamp: a red lens on the coin box's face plate, its front at the running-lamp anchor. */
 lamp:Object.freeze({r:.0075,depth:.004}),
 /** The LED readout in the coin box's window, at the timer-display anchor (the model's window: 46 × 22 mm). */
 led:Object.freeze({w:.046,h:.022}),
 /**
  * The kneading rollers on the backrest's roller track (the roller-track anchor is the cushions' face): two soft lumps
  * either side of the middle that travel up and down while it runs and knead as they go. Their centres travel mid ± travel
  * and knead ± knead, so the lumps (radius r) stay within y 0.485–0.975: on the track (0.475–0.985 in the model) and under
  * the headrest pillow (from 0.98); across, spread ± wobble from the middle, on the cushions, never at the shoulder wings.
  */
 rollers:Object.freeze({mid:.73,travel:.18,knead:.015,r:.05,spread:.095,wobble:.012,period:9}),
 /**
  * The 1994 socket's cord: from the cord anchor inside the plinth's back, straight out of it (2 cm), down onto the floor
  * and along it behind the chair's right corner to the wall by the milk cooler (the gap nobody stands in), and up the wall
  * in front of the wainscot rail into the plug.
  */
 cord:Object.freeze([[4.793,.03,3.19],[4.815,.03,3.19],[4.832,.004,3.15],[4.845,.004,3.04],[4.858,.004,2.96],[4.872,.03,2.905],[4.877,.3,2.9],[4.879,.9,2.9],[4.882,1.03,2.9],[4.884,1.075,2.9]].map(p=>Object.freeze(p))),
 /**
  * The rating plate (200 W 100 V): on the right arm unit's flat outer face (z 3.105, x 4.275–4.71, y 0.085–0.635 there),
  * low and near the back where the cord leaves the chair, under the lowest vent (0.293). Facing the cooler. Studio's model
  * has no plate yet (briefs/NEXT.md §5), so the room draws it.
  */
 plate:Object.freeze({at:Object.freeze([4.62,.17,3.1045]),w:.11,h:.05,yaw:Math.PI}),
});

/** The chair's card in the lobby's frame (no model needed): its colliders, its seat, its spots and its anchors. */
export const CHAIR=assetPlacement(ONSEN_CHAIR.asset,ONSEN_CHAIR);

/**
 * The seat's front edge (room x): the sitter's mark is the card's 5 cm behind it, facing the lobby (−x). A sitter's knees,
 * a child's too, reach past it, so the lower legs hang in front of it (tests/onsen-seats.test.mjs).
 */
export const MASSAGE_CHAIR=Object.freeze({front:(s=>Math.round((s.position[0]+CHAIR.facing[0]*s.front)*1e6)/1e6)(CHAIR.seat('seat'))});
