import {airportWorld} from './airport-ground.js';
import {AIRPORT_ISLAND} from './airport-island.js';

/**
 * The quay's shared spots (docs/research/new-yokosuka-lessons.md §5, C10; approved by the owner on 19 October 2026):
 * the places a worker on the harbour takes a break, each with the way you face there and why it is a place to stop.
 * New Yokosuka's harbour has nine workers sharing two lunch spots 2.1 m apart, claimed first-free; Minato's are the
 * bollard you lean on, the ice plant's plinth (the "lunch step"), the edge of the east quay over the boats and the
 * doorstep of the master's pier shed, and on Kitano-jima the pier's inner bitts. Who claims them, and when, is
 * people/quay-breaks.js; nobody stands on a spot somebody else holds.
 *
 * World frame for Minato (x east, z toward the town; the quay's face is at z −49.975). Kitano's are given in the
 * island's own frame (kitano-hamlet-layout.js) and carried to the world by airportWorld. Every spot was measured
 * against the town's colliders and walk raster (tests/quay-spots.test.mjs).
 */
const N=Object.freeze([0,-1]),S=Object.freeze([0,1]);
const spot=(id,quay,name,[x,z],facing,pose,why,extra={})=>Object.freeze({id,quay,name,x,z,facing,pose,why,...extra});
/** A direction in the island's frame, turned into the world's (the same turn airportWorld gives a point). */
const turnToWorld=([u,v])=>{const c=Math.cos(AIRPORT_ISLAND.yaw),s=Math.sin(AIRPORT_ISLAND.yaw);return Object.freeze([+(c*u+s*v).toFixed(6),+(-s*u+c*v).toFixed(6)]);};
const kitano=(id,name,local,facing,pose,why)=>{const [x,z]=airportWorld(...local);return spot(id,'kitano',name,[x,z],turnToWorld(facing),pose,why,{local:Object.freeze([...local]),localFacing:facing});};

export const QUAY_SPOTS=Object.freeze([
 // Minato, in the order a worker looks for a free one: nearest the office and the auction first.
 spot('stern-bollard','minato','the fishing boat’s stern bollard',[10,-48.6],N,'Idle',
  'Leaning on the bollard with a can of coffee, the fishing boat alongside and the harbour mouth beyond: the one place on the quay out of the office’s sight.'),
 spot('ice-step-west','minato','the ice plant’s plinth, west end',[33,-47.1],N,'Idle',
  'The ice plant’s plinth on the quay side, in the sun: the ice men come out here at lunch to thaw (the plant’s own inspect line), and anyone else who has been in the cold.'),
 spot('ice-step-east','minato','the ice plant’s plinth, east end',[34.8,-47.1],N,'Idle',
  'The other end of the same plinth, 1.8 m along: room for two, as New Yokosuka’s workers’ lounge has two lunch spots 2.1 m apart.'),
 spot('east-quay-edge','minato','the east quay’s edge',[29.5,-48.4],N,'Think',
  'At the quay’s edge beyond the auction shed, over the inshore boats: where you watch the squid boat’s lamps being strung.'),
 spot('shed-doorstep','minato','the doorstep of Mr Fujita’s pier shed',[-36.45,-56.2],S,'Idle',
  'On the platform in front of the master’s shed, facing the quay: while he is on the bridge the doorstep is anyone’s, and the kettle is just inside.'),
 // Kitano-jima's pier (Kai's only): the bitts' shore sides (where ferry.js FERRY_MOORINGS sends the line hand), facing the bitt, where a line hand eats between calls with his eye on the channel.
 kitano('kitano-inner-bitt','the pier’s inner bitt',[-51.4,29.1],N,'Idle',
  'The inner bitt, at the shore end of the head line: Kai eats here between calls with the channel in view, as he did as a deckhand.'),
 kitano('kitano-outer-bitt','the pier’s outer bitt',[-53.65,32.9],S,'Idle',
  'The outer bitt, at the stern line: out of the wind off the hamlet when it blows from the north.'),
]);
export const quaySpot=id=>QUAY_SPOTS.find(s=>s.id===id)||null;
