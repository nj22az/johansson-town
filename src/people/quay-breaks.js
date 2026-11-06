import {QUAY_SPOTS} from '../world/quay-spots.js';
import {hash01,yawFacing} from './stand-points.js';
import {rotaWeek,FERRY_WORKING_DAY} from './ferry-crew.js';
import {fullLife} from './full-life.js';

/**
 * Who takes a break on the quay, when, and on which shared spot (world/quay-spots.js; docs/research/new-yokosuka-
 * lessons.md §5, C10). New Yokosuka's harbour workers hand themselves to a "free lunch spot" graph and take the first
 * free leaf, staying 60 to 1,800 seconds; the same here, as a ledger worked out from the town clock alone, so it is the
 * same on every device, after a reload and in a test: every break of the day is laid out in the order they begin, and
 * each takes the first spot of its quay nobody holds at that moment, keeping it until the break ends. A break that finds
 * every spot taken is not taken (they stay at work). A claim covers the walk out as well as the stop, so a spot is never
 * walked to by one while another stands on it.
 *
 * The breakers are the harbour's people when they are ashore: Kōji at lunch between the ice plant and home to sleep (not
 * on his relief week, when he is the ship's bosun), Jack after his ramen and before the afternoon round, Chin straight off the gangway after
 * the motorman signs off and before his supper at Minato, and Kai on Kitano's pier at lunch between calls. Fuji and Ren
 * are signed on from the generators to the shore power with every meal in the mess (ferry-crew.js FERRY_WORKING_DAY), so
 * the ship's day leaves them no time ashore at a shared spot: Fuji's own time ashore is his shed and his chair, Ren's a
 * late bowl at Minato. `notAshore` records that, so a later ship's day with a break ashore can add them here.
 */
export const BREAK_WAIT=Object.freeze([60,1800]);
/** Minutes allowed for the walk out to the spot, inside the claim. */
export const BREAK_WALK=4;
const day=minutes=>Math.floor(minutes/1440);
export const QUAY_BREAKERS=Object.freeze([
 Object.freeze({name:'Kōji',quay:'minato',window:Object.freeze([720,750]),activity:'his lunch on the quay, thawing out after the ice plant',
  why:'Three hours of loading ice for the boats since the auction: the ice men thaw out on the quay at lunch, and then he goes home to sleep.',
  takes:minutes=>rotaWeek(minutes)===0}),
 Object.freeze({name:'Harbour master',quay:'minato',window:Object.freeze([765,770]),activity:'a coffee on the quay after his ramen',
  why:'Ramen at Sato’s at twelve, every day, then a coffee in the air before the afternoon round with the freight book.'}),
 Object.freeze({name:'Chin',quay:'minato',window:Object.freeze([FERRY_WORKING_DAY.signOff,FERRY_WORKING_DAY.signOff+5]),activity:'a cold coffee on the quay, straight off the gangway',
  why:'Sixteen hours in the engine room: ten minutes of air on the quay before the workshop bench and Thao’s counter.',
  // His break ends by the time Minato's late supper is his (cast.js: 23:00).
  latest:1380}),
 Object.freeze({name:'Kai',quay:'kitano',window:Object.freeze([720,735]),activity:'lunch on the pier between calls',
  why:'The midday gap between the morning and the afternoon calls: lunch out of his tin on the bitt, eye on the channel.'}),
]);
export const NOT_ASHORE=Object.freeze([
 Object.freeze({name:'Mr Fujita',why:'Fuji is signed on 06:05–23:15 with his meals in the mess; ashore after that is his own shed and chair, and the beer.'}),
 Object.freeze({name:'Ren',why:'Ren is signed on 06:05–23:15 and lives aboard; ashore is a late bowl at Minato.'}),
]);

/** One worker's break on one day: its start (absolute town minutes), its end, and how long the stop is (seconds). */
export function breakFor(breaker,d){
 const [from,to]=breaker.window,start=d*1440+from+Math.floor(hash01('quay-break',breaker.name,d)*(to-from+1));
 if(breaker.takes&&!breaker.takes(start))return null;
 const stop=Math.round(BREAK_WAIT[0]+(BREAK_WAIT[1]-BREAK_WAIT[0])*hash01('quay-stop',breaker.name,d));
 let end=start+BREAK_WALK+stop/60;
 if(Number.isFinite(breaker.latest))end=Math.min(end,d*1440+breaker.latest);
 return {name:breaker.name,quay:breaker.quay,start,end,stop,activity:breaker.activity,why:breaker.why};
}
const ledgers=new Map();
/** Every break of a town day with the spot it took (or none), first come, first served. */
export function quayLedger(d){
 if(ledgers.has(d))return ledgers.get(d);
 const breaks=QUAY_BREAKERS.map(b=>breakFor(b,d)).filter(Boolean).sort((a,b)=>a.start-b.start||(a.name<b.name?-1:1)),held=[];
 for(const b of breaks){
  const free=QUAY_SPOTS.find(s=>s.quay===b.quay&&!held.some(h=>h.spot===s&&h.end>b.start));
  b.spot=free||null;if(free)held.push(b);
 }
 const ledger=Object.freeze(breaks.map(Object.freeze));
 if(ledgers.size>8)ledgers.clear();ledgers.set(d,ledger);return ledger;
}
/** A worker's claim at this minute, if they are on a break that found a spot: {spot, start, end, activity, yaw}. */
const claims=new Map();
export function quayClaim(name,minutes){
 if(!fullLife()||!QUAY_BREAKERS.some(q=>q.name===name))return null;
 const b=quayLedger(day(minutes)).find(b=>b.name===name&&b.spot&&minutes>=b.start&&minutes<b.end);
 if(!b)return null;
 // One claim object per break, reused every frame it is read.
 if(!claims.has(b)){if(claims.size>32)claims.clear();claims.set(b,Object.freeze({...b,yaw:yawFacing(b.spot.facing)}));}
 return claims.get(b);
}
/** Every claim held at this minute (spot id → worker). */
export function quayClaimsAt(minutes){
 return new Map(quayLedger(day(minutes)).filter(b=>b.spot&&minutes>=b.start&&minutes<b.end).map(b=>[b.spot.id,b.name]));
}
/** The plan a street or neighbour controller follows while the worker is on a claimed break. */
const plans=new Map();
export function quayBreakPlan(name,minutes){
 const c=quayClaim(name,minutes);if(!c)return null;
 if(plans.get(name)?.claim===c)return plans.get(name).plan;
 const plan=quayPlanFor(c);plans.set(name,{claim:c,plan});return plan;
}
function quayPlanFor(c){
 return {place:'quay-break',target:[c.spot.x,c.spot.z],activity:c.activity+' ('+c.spot.name+')',
  stand:Object.freeze({yaw:c.yaw,pose:c.spot.pose,tool:null,spot:c.spot.id,why:c.spot.why})};
}
