import {HARBOUR_LINE,BUS_DWELL,CROSSING_MINUTES,serviceTime} from '../people/commuter-schedule.js';

/**
 * The Minato Maru's timetable (the owner, 21 October 2026: "How to simplify so that the ferry doesn't have to wait for
 * Nils", and, on the recommendation, "Yes proceed"; briefs/ferry-timetable.md). She sails to it whether he is aboard,
 * ashore or on the gangway; nothing in her day waits for the player.
 *
 * Built from the Harbour Line (commuter-schedule.js HARBOUR_LINE, the departures board in Sakura's office): each of its
 * three calls is a boat in from Kitano-jima, alongside at Minato at the Harbour Line's time and out again BUS_DWELL
 * minutes later, Thuan's boat home the last of them at 22:15. She lies overnight at Minato on shore power, where her
 * crew live (the owner, 21 October 2026, asked where she spends the night: "Minato"), so two more sailings close the
 * day: the first boat out at 07:30 to fetch the morning's commuters, and the last boat back at 22:45, after Thuan's.
 *
 * Times are town minutes past midnight. `departs` is when her gangway closes; `arrives` is the advertised arrival, the
 * crossing's own minutes after it (CROSSING_MINUTES), which is when a passenger aboard steps off.
 */
export const FERRY_WARNING_MINUTES=2;
/** When the crew begin preparing a sailing: the machinery and the deck, with the gangway still out. */
export const FERRY_PREPARE_MINUTES=3;
/** How late a sailing may still go (a fast town clock, a held departure); later than this it is dropped. */
export const FERRY_LATE_MINUTES=30;
const PLACE={town:'Minato',airport:'Kitano-jima'};
const sailing=(id,from,to,departs,why)=>Object.freeze({id,from,to,departs,arrives:departs+CROSSING_MINUTES,why});
export const FERRY_TIMETABLE=Object.freeze([
 sailing('first','town','airport',7*60+30,'The first boat: out from her night berth at Minato to fetch the 08:30 commuters from Kitano-jima.'),
 ...HARBOUR_LINE.flatMap((call,i)=>[
  sailing('in-'+i,'airport','town',call-CROSSING_MINUTES,'The commuter boat in, alongside at Minato at '+serviceTime(call)+' (the Harbour Line).'),
  sailing('out-'+i,'town','airport',call+BUS_DWELL,i===HARBOUR_LINE.length-1?'Thuan’s boat home: the last boat out of Minato, which does not wait.':'Back across with the island’s passengers and cars.'),
 ]),
 sailing('last','airport','town',22*60+45,'The last boat back to her night berth at Minato, with the crew who live there.'),
].sort((a,b)=>a.departs-b.departs));

const minuteOfDay=m=>((m%1440)+1440)%1440;
export const placeName=berth=>PLACE[berth]||berth;

/** Where the timetable has her at this minute: the destination of the last sailing gone, or Minato overnight. */
export function timetableBerth(minutes){
 const m=minuteOfDay(minutes);let berth='town';
 for(const s of FERRY_TIMETABLE)if(s.departs<=m)berth=s.to;
 return berth;
}

/** The sailing from `berth` she should be preparing or making now, with its departure as an absolute minute. */
export function sailingDue(minutes,berth){
 const day=Math.floor(minutes/1440)*1440;
 for(const base of [day-1440,day])for(const s of FERRY_TIMETABLE){
  if(s.from!==berth)continue;const at=base+s.departs;
  if(minutes>=at-FERRY_PREPARE_MINUTES&&minutes<=at+FERRY_LATE_MINUTES)return {sailing:s,at,key:s.id+'@'+at};
 }
 return null;
}

/** The next sailing (from `from`, or from either side) not yet gone: the board's and the counter's "next". */
export function nextSailing(minutes,from=null){
 const day=Math.floor(minutes/1440)*1440;
 for(const base of [day,day+1440])for(const s of FERRY_TIMETABLE){
  if(from&&s.from!==from)continue;const at=base+s.departs;
  if(at>=minutes)return {sailing:s,at,wait:at-minutes};
 }
 return null;
}

/** Within the two minutes before a sailing from `berth`: the horn has sounded and the sign reads 出港. */
export function departureWarning(minutes,berth){
 const n=nextSailing(minutes,berth);
 return n&&n.wait<=FERRY_WARNING_MINUTES?n:null;
}

/** One line a sailing, as the boards print it. */
export const sailingLine=s=>serviceTime(s.departs)+'  '+placeName(s.from)+' → '+placeName(s.to)+'  (arr. '+serviceTime(s.arrives)+')';

/** The service as the Port Terminal, the counter and the clerk state it. */
export function ferryTimetableText(minutes){
 const lines=FERRY_TIMETABLE.map(sailingLine).join('\n');
 const here=Number.isFinite(minutes)?nextSailing(minutes):null;
 return 'Minato Maru · Minato ⇄ Kitano-jima · '+CROSSING_MINUTES+'-minute crossing\nShe keeps her timetable and does not wait: be aboard two minutes before she sails, when the horn sounds.\n'
  +lines+(here?'\n\nNext sailing: '+serviceTime(here.at)+' from '+placeName(here.sailing.from)+(here.wait<1?' · boarding now':' · in '+Math.ceil(here.wait)+' town minutes'):'')
  +'\nMissed her? The quick crossing at the landing sign takes Johansson across on his own.';
}
