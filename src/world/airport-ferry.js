import {FERRY_H1} from './ferry-engine-room-plan.js';
import * as THREE from '../../vendor/three.module.js';
import {AIRPORT_ISLAND,AIRPORT_JETTY} from './airport-island.js';
import {AIRPORT_LANDING,AIRPORT_LANDING_HEIGHT,airportWorld} from './airport-ground.js';
import {SEA_LEVEL} from './ocean.js';
import {GANGWAY_Z,FERRY_HULL,FERRY_DECKS} from './ferry-model.js';
import {BERTH_X,BERTH_Z,TOWN_UNBERTHING,TOWN_BERTHING,HARBOUR_MOUTH,passage,roundedTrack} from './ferry-paths.js';
import {timeFerryPassage} from './ferry-sailing-profile.js';

/**
 * Shared passenger and car crossing on the town ferry, the Minato Maru (ferry-ship.js).
 * The crossing's figures (AIRPORT_FERRY) follow the passages below (briefs/ferry-audit.md §7.1).
 */
/**
 * Her paces, metres a town minute: steady at sea, and out of the harbour mouth no faster than
 * she leaves the swing, so she gathers way gently rather than surging into the open water.
 */
const SEA_PACE=28,MANOEUVRE_PACE=24;
/**
 * The fixed legs each way, for the 34.5 m ship: to Kitano-jima, astern off the Minato berth, the pivot in
 * the western basin, the approach and berthing at the jetty; to Minato, astern off the jetty and her swing,
 * the approach through the mouth, the pivot in the western basin and alongside.
 */
const FIXED_MINUTES=Object.freeze({airport:2+2.5+1.5+1.6,town:1.5+2+1.5+1.6+2.9});
/** The least her way out of each harbour takes, at slow ahead from the swing. */
const MANOEUVRE_MINUTES=Object.freeze({airport:3,town:1.5});
const polyLength=(keys,from,to)=>{let L=0;for(let k=from+1;k<=to;k++)L+=Math.hypot(keys[k][0]-keys[k-1][0],keys[k][1]-keys[k-1][1]);return L;};
/** At Kitano-jima she lies bow to the jetty's west face, 1.9 m off it, with her ramp down on it. */
const AIRPORT_BERTH_U=AIRPORT_JETTY.minX-1.9-FERRY_HULL.length/2;
export const AIRPORT_FERRY_PORTS=Object.freeze({
 // Wait on the pier beyond the complete 4 m gangway sweep, clear of its foot and rails.
 // Until 21 October 2026 it was at x −3.2, 0.7 m short of that line, inside the south rail's footprint once she ran the
 // gangway out (ferry-walk.js), so he was penned against it (the owner: "the railing by the ships at the dock you can
 // get stuck when spawning there").
 town:Object.freeze({title:'Minato–Kitano-jima shared ferry',landing:Object.freeze([FERRY_H1.shore.landingX,BERTH_Z+GANGWAY_Z]),height:.098,berth:Object.freeze([BERTH_X,BERTH_Z]),yaw:0}),
 airport:Object.freeze({title:'Kitano-jima shared ferry pier',landing:AIRPORT_LANDING,height:AIRPORT_LANDING_HEIGHT,berth:Object.freeze(airportWorld(AIRPORT_BERTH_U,31)),yaw:AIRPORT_ISLAND.yaw+Math.PI/2}),
});
const BERTH_YAW=(AIRPORT_ISLAND.yaw+Math.PI/2)*180/Math.PI;
/** On Kitano-jima's leading line, `d` metres short of her berth there: she comes in along it, bow first. */
const onLeadingLine=d=>airportWorld(AIRPORT_BERTH_U-d,31);
/**
 * The sea between: out of Minato round the breakwater's west end, south of it, south-east across the
 * strait, and onto Kitano-jima's leading line to the jetty. Each corner is a steady turn (ferry-paths.js
 * roundedTrack); the two at sea are 60 m turns, so at her sea pace the 34.5 m ship turns about two thirds
 * of a degree a second at most, with room under the limit for where a turn meets a straight.
 */
const SEA_CORNERS=Object.freeze([HARBOUR_MOUTH,[-42,-132]]),SEA_RADII=Object.freeze([16,60,60]);
/** To Kitano-jima: off the Minato berth as on any departure, the sea, and bow in to the jetty. */
const outboundRoute=(()=>{
 const harbour=TOWN_UNBERTHING.keys,swingEnd=harbour.at(-1);
 const track=roundedTrack([[swingEnd[0],swingEnd[1]],...SEA_CORNERS,onLeadingLine(65),onLeadingLine(30)],SEA_RADII);
 // The harbour's last turn, round the breakwater's end, is hers on slow ahead; the sea begins as she steadies out of it.
 const keys=[...harbour,...track.slice(1,-1),[...onLeadingLine(30),BERTH_YAW],[...onLeadingLine(12),BERTH_YAW],[...AIRPORT_FERRY_PORTS.airport.berth,BERTH_YAW]];
 const clear=harbour.length-1+track.turns[1].from+1,line=keys.length-3;
 const manoeuvre=Math.max(MANOEUVRE_MINUTES.airport,polyLength(keys,harbour.length-1,clear)/MANOEUVRE_PACE);
 return {keys,manoeuvre,sea:polyLength(keys,clear,line),legs:sea=>[
  {to:TOWN_UNBERTHING.astern,minutes:2,kind:'astern',signal:['prolonged','astern']},
  {to:harbour.length-1,minutes:2.5,kind:'swing',ease:2},
  {to:clear,minutes:manoeuvre,kind:'manoeuvring',ease:6},
  {to:line,minutes:sea,kind:'sea',signal:'prolonged',ease:12},
  {to:keys.length-2,minutes:1.5,kind:'approach',ease:6},
  {to:keys.length-1,minutes:1.6,kind:'berthing',ease:4},
 ]};
})();
/** To Minato: astern off the jetty, a swing on the thruster, the sea, and in to the Minato berth as on any arrival. */
const inboundRoute=(()=>{
 const arrival=TOWN_BERTHING.keys,first=arrival[0];
 const track=roundedTrack([onLeadingLine(26),onLeadingLine(65),...[...SEA_CORNERS].reverse(),[first[0],first[1]]],[...SEA_RADII].reverse());
 const head=[[...AIRPORT_FERRY_PORTS.airport.berth,BERTH_YAW],[...onLeadingLine(16),BERTH_YAW],[...onLeadingLine(26),BERTH_YAW+180]];
 const keys=[...head,...track.slice(1,-1),...arrival];
 // Out along the leading line to its first turn; at sea until just short of the turn round the breakwater's end, which is the approach's.
 const out=head.length-1+track.turns[0].from,inside=head.length-2+track.turns.at(-1).from;
 // In through the mouth, the pivot in the western basin (TOWN_BERTHING's first four keys), and across to the berth.
 const pivot=head.length+track.length-2;
 const manoeuvre=Math.max(MANOEUVRE_MINUTES.town,polyLength(keys,2,out)/MANOEUVRE_PACE);
 return {keys,manoeuvre,sea:polyLength(keys,out,inside),legs:sea=>[
  {to:1,minutes:1.5,kind:'astern',signal:['prolonged','astern']},
  {to:2,minutes:2,kind:'swing',ease:2},
  {to:out,minutes:manoeuvre,kind:'manoeuvring',ease:3},
  {to:inside,minutes:sea,kind:'sea',ease:12},
  {to:pivot,minutes:1.5,kind:'approach',signal:'prolonged',ease:8},
  {to:pivot+3,minutes:1.6,kind:'swing',ease:2},
  {to:keys.length-1,minutes:2.9,kind:'berthing',ease:4},
 ]};
})();
/**
 * The crossing in town minutes, the same both ways: the harbour legs, and the longer of the two
 * sea legs at her sea pace, rounded up to a whole minute (the shorter way takes its time at sea). Kitano-jima lies far across the strait,
 * so it is the sea that sets it.
 */
const harbourMinutes=(route,way)=>FIXED_MINUTES[way]+route.manoeuvre;
const CROSSING=Math.ceil(Math.max(harbourMinutes(outboundRoute,'airport')+outboundRoute.sea/SEA_PACE,harbourMinutes(inboundRoute,'town')+inboundRoute.sea/SEA_PACE));
const outbound=passage(outboundRoute.keys,outboundRoute.legs(CROSSING-harbourMinutes(outboundRoute,'airport')));
const inbound=passage(inboundRoute.keys,inboundRoute.legs(CROSSING-harbourMinutes(inboundRoute,'town')));
/**
 * Shared ferry figures. `duration` is the crossing in town minutes; `ride` is how long the game
 * shows it in seconds, a time-lapse of those minutes, until crossings are sailed in real time.
 */
export const AIRPORT_FERRY=Object.freeze({length:FERRY_HULL.length,beam:FERRY_HULL.beam,deck:FERRY_DECKS.car.y,duration:CROSSING,ride:Math.round(CROSSING*.6)});
/** Each way's passage (ferry-paths.js), for the game, its sounds and the tests. */
export const AIRPORT_PASSAGES=Object.freeze({airport:outbound,town:inbound});
/** Visible motion has one clock, including unaccompanied vehicle voyages. */
export const FERRY_SAILINGS=Object.freeze({airport:timeFerryPassage(outbound),town:timeFerryPassage(inbound)});

/**
 * Where she is a share `progress` (0–1) of the way through a crossing: the passage played at
 * that share of its time, so her speed and rate of turn are the ship's own, only faster.
 */
export function airportFerryPose(destination,progress){
 if(!['town','airport'].includes(destination))throw new RangeError('Unknown airport ferry destination');
 const t=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0)),plan=AIRPORT_PASSAGES[destination],p=plan.pose(t*plan.duration);
 return {x:p.x,y:SEA_LEVEL+FERRY_HULL.origin,z:p.z,yaw:p.yaw,deckY:SEA_LEVEL+FERRY_HULL.origin+AIRPORT_FERRY.deck,progress:t,speed:p.speed,turn:p.turn,kind:p.kind,exposure:p.exposure,seconds:t*plan.duration};
}

/** A boarding anchor on the public pier, clear of its bollards and winch. */
export function registerAirportFerryPier({parent,register=()=>{},onBoard=()=>{}}){
 const p=AIRPORT_FERRY_PORTS.town,a=new THREE.Object3D();a.name='Shared ferry boarding point';a.position.set(p.landing[0],p.height+1,p.landing[1]);parent.add(a);
 register(a,'Board the Minato–Kitano-jima ferry',onBoard);
 return a;
}
