/**
 * Sakura's till queue (docs/research/new-yokosuka-lessons.md §3.1, C1; approved by the owner on 19 October 2026).
 *
 * New Yokosuka's konbini, measured: the clerk's stand point 0.75 m behind the counter's front, facing the floor; every
 * caller uses the same two queue spots, 1.0 m apart in the entrance lane, facing the till, and a browsing spot on the
 * floor when both are taken. Sakura is three times that shop (it is the town's supplier too), so it keeps its floor
 * and takes the queue: the paying spot at the till and the next spot one metre back along the lane from the door, each
 * with its facing; one browsing spot in each aisle, clear of every shelf's own stand point, for a customer who finds
 * both queue spots taken and tries again when one comes free. Nobody stands in the door's opening (DOOR_PATH): the
 * spots are all clear of it, and the queue never reaches back to it.
 *
 * The shop's own frame (sakura-layout.js): the front door at z 3.91 on x 0, the counter along the east wall from
 * x 4.54 (its customer face) to 5.06, the till at z 0.85–1.17.
 */
export const SAKURA_COUNTER_FRONT=4.54;
/** New Yokosuka's clerk: 0.75 m behind the counter's front (§3.1). */
export const CLERK_BEHIND_FRONT=.75;
export const SAKURA_TILL_Z=.85;
/** The register on the counter (sakura-layout.js `register`): what “facing the till” faces. */
export const SAKURA_REGISTER=Object.freeze([4.88,1.17]);
/** Where the clerk stands to serve: 0.75 m behind the counter front, at the till, facing the shop floor (−x). */
export const SAKURA_CLERK_POINT=Object.freeze([+(SAKURA_COUNTER_FRONT+CLERK_BEHIND_FRONT).toFixed(2),0,SAKURA_TILL_Z]);
/**
 * Where a clerk-sized walker (CLERK_CLEARANCE, 0.36 m) can be routed to behind the counter. The last 0.21 m to the
 * clerk point is a straight step forward, facing the way she walks (retail-clerk.js tillStep): close enough to the
 * counter to take money over it, which a 0.36 m clearance circle cannot be. Her body is 0.2 m deep from its middle
 * (TILL_BODY), and the counter's back edge is 0.23 m from the point.
 */
export const SAKURA_CLERK_APPROACH=Object.freeze([5.5,0,SAKURA_TILL_Z]);
export const TILL_BODY=.2;
const dir=(dx,dz)=>{const d=Math.hypot(dx,dz);return Object.freeze([+(dx/d).toFixed(4),+(dz/d).toFixed(4)]);};
/** The two queue spots, the paying one first. */
export const SAKURA_QUEUE=Object.freeze([
 Object.freeze({id:'paying',x:3.9,z:SAKURA_TILL_Z,facing:Object.freeze([1,0]),
  why:'at the till, across the counter from the clerk: the customer being served'}),
 // One metre back from the paying spot, on the lane from the door to the till (the angle that keeps a metre from
 // the east island's shelf stand at 2.72, 0.88 and from the evening guests' places along the counter).
 Object.freeze({id:'next',x:3.33,z:1.67,facing:dir(SAKURA_REGISTER[0]-3.33,SAKURA_REGISTER[1]-1.67),
  why:'next in line, one metre behind the customer paying, facing the till, in the lane the door opens on to'}),
]);
/** One browsing spot per aisle, west to east, facing the shelf it looks at, each 0.78 m or more from every shelf's stand. */
export const SAKURA_BROWSE=Object.freeze([
 Object.freeze({id:'chiller-aisle',x:-4.7,z:-1.4,facing:Object.freeze([-1,0]),why:'the chiller aisle, at its back end by the delivery shelf: the rice balls and bento in view'}),
 Object.freeze({id:'pantry-aisle',x:-2.99,z:1.5,facing:Object.freeze([-1,0]),why:'the pantry island’s east face at its window end: noodles, soups and the curry'}),
 Object.freeze({id:'sweets-aisle',x:-.4,z:-1.2,facing:Object.freeze([-1,0]),why:'the sweets island, at the back of the door’s own aisle, well inside the shop'}),
 Object.freeze({id:'daily-aisle',x:3.6,z:-.4,facing:Object.freeze([-1,0]),why:'the daily goods on the long east island, behind the till lane'}),
]);
/** The door's opening path inside the shop: the doorway's width with a body either side, from the glass 1.5 m in. */
export const DOOR_PATH=Object.freeze({minX:-.89-.35,maxX:.89+.35,minZ:2.41,maxZ:3.91});
export const inDoorPath=(x,z)=>x>DOOR_PATH.minX&&x<DOOR_PATH.maxX&&z>DOOR_PATH.minZ&&z<DOOR_PATH.maxZ;

/**
 * Who stands where. `entries`: [{id, phase: 'queue'|'paid', since, held}] — `held` is what they were given last time
 * ({kind:'queue'|'browse', index}). A paid customer still at the till keeps the paying spot until they turn away; the
 * waiting take the free queue spots in the order they joined (so the one behind moves up when the one in front leaves);
 * whoever is left over browses, keeping their aisle while they wait, or the first aisle nobody is in. Returns a Map
 * id → {kind, index} (`kind:'hold'` when every aisle is taken too: they stay where they are).
 */
export function assignSakuraQueue(entries){
 const out=new Map(),taken=new Set(),browsing=new Set();
 for(const e of entries)if(e.phase==='paid'&&e.held?.kind==='queue'){out.set(e.id,{kind:'queue',index:e.held.index});taken.add(e.held.index);}
 const waiting=entries.filter(e=>e.phase==='queue').sort((a,b)=>a.since-b.since||(String(a.id)<String(b.id)?-1:1));
 const left=[];
 for(const e of waiting){
  const index=SAKURA_QUEUE.findIndex((_,i)=>!taken.has(i));
  if(index<0){left.push(e);continue;}
  taken.add(index);out.set(e.id,{kind:'queue',index});
 }
 // Browsers keep the aisle they are in; newcomers take the first free one.
 for(const e of left)if(e.held?.kind==='browse'&&!browsing.has(e.held.index)){browsing.add(e.held.index);out.set(e.id,{kind:'browse',index:e.held.index});}
 for(const e of left){
  if(out.has(e.id))continue;
  const index=SAKURA_BROWSE.findIndex((_,i)=>!browsing.has(i));
  if(index<0){out.set(e.id,{kind:'hold'});continue;}
  browsing.add(index);out.set(e.id,{kind:'browse',index});
 }
 return out;
}
export const yawOf=([dx,dz])=>Math.atan2(-dx,-dz);
