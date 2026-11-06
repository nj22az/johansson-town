/**
 * Minato when it is closed (open 16:00–03:00, people/social.js izakayaOpen).
 *
 * Nobody lives in the bar (the live-in regular was retired in phase 4 of docs/CAST-CONSOLIDATION.md):
 *   03:00–04:00  Thao wipes the counter down after last orders, then goes home (she sleeps 04:00–12:00).
 *   04:00–16:00  The room is shut and dark; Thao preps at her station from three (social.js NAO_DAY).
 *
 * A job is a list of stations: where to stand, which way to face, the pose, the tool in
 * the right hand. The station changes every few minutes of town time, and the walker in
 * indoor-residents.js walks them there. Poses are drawn in avatars/animate.js; tools in
 * avatars/tools.js.
 */
import {MINATO_COMPACT} from '../world/interiors/minato-compact-plan.js';
const minuteOfDay=m=>((m%1440)+1440)%1440;
const FACE_DOOR=Math.PI;
// Behind the fitted counter, facing over it from the shared staff aisle.
const BEHIND=MINATO_COMPACT.counterStools.slice(1,-1).map(x=>[x,0,MINATO_COMPACT.staff.counterPassZ]);

const JOBS=Object.freeze({
 Thao:[
  {from:180,to:240,every:9,stations:BEHIND.map(at=>({at,yaw:FACE_DOOR})),pose:'Wipe',tool:'cloth',activity:'wiping the counter down after closing'},
 ],
});

/** What somebody is doing in closed Minato at `minutes`, or null (asleep, out, or open). */
export function izakayaJob(name,minutes){
 const m=minuteOfDay(minutes),job=JOBS[name]?.find(j=>m>=j.from&&m<j.to);if(!job)return null;
 const step=Math.floor((m-job.from)/job.every),station=job.stations[step%job.stations.length];
 return {key:name+':'+job.from+':'+step%job.stations.length,at:station.at,yaw:station.yaw,pose:job.pose,tool:job.tool,activity:job.activity};
}
/** Who is cleaning, for the line you get coming in while Minato is closed. */
export function closedGreeting(minutes){
 const m=minuteOfDay(minutes);
 if(m>=180&&m<240)return 'Minato is closed. Thao is wiping the counter down.';
 if(m>=900&&m<960)return 'Minato opens at four. Thao is getting ready.';
 return 'Minato is closed until four.';
}
export const CLEANING_POSES=Object.freeze(['Stack','Sweep','Polish','Mop','Wipe']);
