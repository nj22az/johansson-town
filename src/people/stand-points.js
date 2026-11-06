import {CAST,castMember} from './cast.js';
import {STAND_SEQUENCES} from './stand-sequences.js';
import {fullLife,standsFor} from './full-life.js';

/**
 * Stand points in a resident's day (docs/research/new-yokosuka-lessons.md §2.3, §6, C6; approved by the owner on
 * 19 October 2026). A phase of a resident's day (cast.js `day`) may name a stand sequence (`{stand:'id'}`, the row's
 * fourth element): instead of one target for the whole phase, the resident walks the sequence's points in order, faces
 * each point's way, waits there doing its activity (a pose of the town's own, a tool in hand where the avatar has one),
 * and moves on, looping while the phase lasts. The points and their reasons are data (stand-sequences.js).
 *
 * Nothing here is random: where a resident is in the sequence is a pure function of the town clock and their name. The
 * walk between two points is timed at New Yokosuka's measured walk (1.25 m/s, §6) along the straight line with an
 * allowance for corners and turning; each wait is drawn from the point's range by a hash of the day, the loop and the
 * point, so the same day plays the same way on every device and after every reload. A walker slower than the timing
 * only eats into the next wait; nobody is ever moved without walking.
 */
export const STAND_WALK=1.25;
/** Straight-line distance × this is the time a route round furniture takes; plus TURN seconds to turn and settle. */
export const STAND_PATH_ALLOWANCE=1.3,STAND_TURN=3;
/** How close a resident must be to a point to count as standing on it (the town's other marks: schedules.js, neighbours.js). */
export const STAND_ARRIVAL=.35;
const MAX_STEPS=20000;

/** A deterministic number in [0,1) from any parts (FNV-1a over their text): the seeded clock's dice. */
export function hash01(...parts){
 let h=0x811c9dc5;
 for(const c of parts.join('|')){h^=c.codePointAt(0);h=Math.imul(h,0x01000193)>>>0;}
 // A final avalanche so neighbouring keys do not give neighbouring numbers.
 h^=h>>>16;h=Math.imul(h,0x85ebca6b)>>>0;h^=h>>>13;h=Math.imul(h,0xc2b2ae35)>>>0;h^=h>>>16;
 return (h>>>0)/4294967296;
}
/** The yaw a body has when it faces along [dx, dz] (the town's convention: atan2(-dx, -dz)). */
export const yawFacing=([dx,dz])=>Math.atan2(-dx,-dz);
/** Seconds to wait at a point: its `wait` (a number, or a [min, max] range drawn from the seeded clock by `key`). */
export function standWait(point,key){
 const w=point.wait;
 if(Array.isArray(w))return Math.round(w[0]+(w[1]-w[0])*hash01('wait',key));
 return w;
}
/** Seconds to walk from a to b (each {x, z}) by the timing above. */
export const standTravel=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z)*STAND_PATH_ALLOWANCE/STAND_WALK+STAND_TURN;

/**
 * Where in its sequence a resident is, `minutes` into the town clock, for a phase that began at `start` (absolute town
 * minutes). The first point is walked to from the last (a loop), so the timing of the first walk is the same as every
 * other. Returns {index, loop, point, arrive, leave, waiting}: arrive and leave in seconds from the phase's start.
 */
export function standAt(sequence,start,minutes,seed=''){
 const points=sequence.points,elapsed=Math.max(0,(minutes-start)*60),day=Math.floor(start/1440);
 let t=0;
 for(let step=0;step<MAX_STEPS;step++){
  const loop=Math.floor(step/points.length),index=step%points.length,point=points[index];
  const from=points[(index+points.length-1)%points.length];
  const arrive=t+(points.length>1?standTravel(from,point):0),leave=arrive+standWait(point,[seed,sequence.id,day,loop,index].join('/'));
  if(elapsed<leave)return {index,loop,point,arrive,leave,waiting:elapsed>=arrive};
  t=leave;
 }
 const index=points.length-1;return {index,loop:Math.floor(MAX_STEPS/points.length),point:points[index],arrive:t,leave:Infinity,waiting:true};
}

const minuteOf=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
/** Each resident's phases, as minute-of-day rows with their stand sequence (if any). */
const PHASES=new Map(CAST.map(p=>[p.name,p.day.map(([time,place,activity,extra])=>({from:minuteOf(time),place,activity,stand:extra?.stand||null})).sort((a,b)=>a.from-b.from)]));
/** The phase of a resident's day at this minute, with its absolute start; null for somebody not in the cast. */
export function dayPhase(name,minutes){
 const p=castMember(name);if(!p)return null;
 const rows=PHASES.get(p.name),m=((minutes%1440)+1440)%1440;
 const row=rows.filter(r=>r.from<=m).at(-1)||rows.at(-1);
 const start=minutes-(((m-row.from)%1440)+1440)%1440;
 return {...row,name:p.name,start};
}
/**
 * The stand point a resident should be at now, if the phase of their day they are in names a sequence in this frame
 * ('world' for the street, or a room's id: 'sakura', 'frontrow', 'ramen', 'koban'); otherwise null. `sequence` may
 * be given to read a sequence the controller chose itself (Sakura's clerk, whoever the rota puts at the counter).
 */
const memo=new Map();
export function standNow(name,minutes,frame=null,sequenceId=null){
 if(!fullLife()||!standsFor(name))return null;
 // Read every frame by several controllers: worked out once per town second and resident, then reused.
 const key=name+'|'+frame+'|'+sequenceId,second=Math.floor(minutes*60),hit=memo.get(key);
 if(hit&&hit.second===second)return hit.value;
 const value=standFresh(name,minutes,frame,sequenceId);
 if(memo.size>256)memo.clear();memo.set(key,{second,value});return value;
}
function standFresh(name,minutes,frame,sequenceId){
 const phase=dayPhase(name,minutes);if(!phase)return null;
 const id=sequenceId||phase.stand;if(!id)return null;
 const sequence=STAND_SEQUENCES[id];if(!sequence||(frame&&sequence.frame!==frame))return null;
 const at=standAt(sequence,phase.start,minutes,phase.name);
 return {...at,sequence,phase,yaw:yawFacing(at.point.facing)};
}
/** Who has stand sequences, and in which phases: the stories and the tests read this. */
export const STANDING_RESIDENTS=Object.freeze([...PHASES].flatMap(([name,rows])=>rows.filter(r=>r.stand).map(r=>Object.freeze({name,from:r.from,place:r.place,activity:r.activity,stand:r.stand}))));
export {STAND_SEQUENCES};
