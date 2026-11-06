import {townCalendarAt} from '../town-clock.js';
import {rotaWeek} from '../people/ferry-crew.js';
import {ACCOUNTS,SUPPLIERS} from './merchandising.js';

/**
 * Sakura Trading's delivery round (the owner, 22 October 2026: Higa Liquor closes, Sakura sells and supplies all the
 * alcohol, and "Kōji's round becomes Sakura Trading's"). It was Higa Liquor's round since 21 October: Kōji, in his own
 * white kei truck (the Kitahama monthly parking's bay 1), on the days of his weeks ashore that have a drop, between the
 * ice plant and his sleep, paid by the round. Now he loads at Sakura Trading's depot in the Quay Warehouse and Thuan pays
 * him from Sakura's till. His weeks aboard as the bosun's relief (people/ferry-crew.js rotaWeek 1) are not broken: on
 * those, the customers collect, as the `aboard` line of each drop says.
 *
 * Each drop is one of Sakura's trade accounts that takes drink (merchandising.js ACCOUNTS.sakura, `alcohol`): Minato,
 * Sato Ramen, the Coral Bay Bar on Kitano-jima, whose ice boxes wait at the Port Terminal's freight counter for the 14:45
 * boat (the ferry is at Kitano-jima through the late morning: world/ferry-timetable.js), and Mr Fujita's shed on the west
 * pier: a full crate for the one of empties by his chair (world/fujita-day.js). Sakura's own beer comes in with the
 * depot's other goods; the shop is not a drop.
 */
const minute=m=>((m%1440)+1440)%1440;
export const TRADE_ROUND=Object.freeze({
 driver:'Kōji',vehicle:'Kōji’s white kei truck (Kitahama monthly parking, bay 1)',
 pay:1500,payText:'¥1,500 a round, cash from Sakura’s till, written in the delivery book',
 days:Object.freeze([2,5]),start:630,end:705,
 why:'Kōji is on the quay from half past four and asleep from noon: the round fits between the ice for the boats and his sleep, on his weeks ashore, and the truck he already has for the ice chests carries twenty crates.',
 // Where he loads and where he leaves the empties: the depot's door in the Quay Warehouse (the canonical day's
 // 'warehouse' point, canonical-day.js; tests/higa-liquor-laundry.test.mjs holds the two the same), and the crate yard
 // across Main Street that Sakura Trading rents from Grandmother Higa since her shop closed (lots.js).
 load:Object.freeze({place:'warehouse',at:Object.freeze([-9.7,-41.4]),what:'loading the round at Sakura Trading’s depot in the Quay Warehouse'}),
 stops:Object.freeze([
  Object.freeze({account:'izakaya',days:Object.freeze([2,5]),at:'10:42',where:'Minato’s door',place:'izakaya',
   aboard:'Thao fetches it herself in Minato’s white kei truck on the way back from the market.'}),
  Object.freeze({account:'ramen',days:Object.freeze([2,5]),at:'10:50',where:'Sato Ramen’s door',place:'sato-ramen',
   aboard:'It rides in Thao’s truck with the Minato order, one crate left at the back door.'}),
  Object.freeze({account:'coral-bay-bar',days:Object.freeze([2,5]),at:'10:58',where:'the Port Terminal’s freight counter, the ice boxes for the 14:45 boat to Kitano-jima',place:'port',
   aboard:'Thao drops the ice boxes at the Port Terminal on her way back from the market, and Kōji, the bosun that week, stows them on the car deck himself before the 14:45.'}),
  Object.freeze({account:'fujita-shed',days:Object.freeze([2,5]),at:'11:06',where:'Mr Fujita’s shed, a full crate carried out along the pier from the west quay and the empties back',place:'boatyard',
   aboard:'Thuan wheels the crate down from the depot on the hand truck after the morning boat.'}),
 ]),
 empties:Object.freeze({at:'11:30',where:'the crate yard across Main Street, Sakura Trading’s since the Higas closed',point:Object.freeze([-7.2,12.4])}),
});
const hm=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};

/** Whether Kōji is ashore this week (his weeks as the bosun's relief are rota week 1). */
export const kojiAshore=minutes=>rotaWeek(minutes)===0;
/** The drops of the day's round: [] on a day with none. */
export function roundDropsOn(minutes){
 const w=townCalendarAt(minutes).weekday;
 return TRADE_ROUND.stops.filter(s=>s.days.includes(w));
}
/** Whether Kōji drives the round today. */
export const roundToday=minutes=>kojiAshore(minutes)&&roundDropsOn(minutes).length>0;
/**
 * Where Kōji is on the round at this minute, or null outside it: loading at the depot (`point`, world metres, and its
 * place), at a drop (`place`, a canonical place of people/canonical-day.js), or the empties back to the crate yard
 * (`point`). Each leg is held from its time to the next's.
 */
export function roundAt(minutes){
 if(!roundToday(minutes))return null;
 const m=minute(minutes);if(m<TRADE_ROUND.start||m>=TRADE_ROUND.end)return null;
 const legs=[{from:TRADE_ROUND.start,point:TRADE_ROUND.load.at,place:TRADE_ROUND.load.place,activity:TRADE_ROUND.load.what,account:null},
  ...roundDropsOn(minutes).map(s=>({from:hm(s.at),place:s.place,activity:'Sakura Trading’s round: '+ACCOUNTS.sakura[s.account].name+', '+s.where,account:s.account})),
  {from:hm(TRADE_ROUND.empties.at),point:TRADE_ROUND.empties.point,activity:'the empties back to the crate yard across Main Street',account:null}];
 return legs.filter(l=>l.from<=m).at(-1);
}
/** The day's minutes at which a round leg starts, for tests and the film: [hm('10:30'), ...]. */
export const roundTimes=minutes=>roundToday(minutes)?[TRADE_ROUND.start,...roundDropsOn(minutes).map(s=>hm(s.at)),hm(TRADE_ROUND.empties.at)]:[];

/**
 * The round's delivery book, kept by Sakura's till: who takes what drink (merchandising.js), on which days, who carries it
 * this week, and the round's pay. A plain-text page, as the ledger reads it; `minutes` decides the week.
 */
export function roundDeliveryBook(minutes){
 const accounts=ACCOUNTS.sakura,ashore=kojiAshore(minutes),days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
 const lines=[`${SUPPLIERS.sakura.name} · drink round`,
  ashore?`This week: Kōji’s truck, Tue · Fri from 10:30 (${TRADE_ROUND.payText}).`:'This week Kōji is at sea as the bosun’s relief: the customers collect.',''];
 for(const s of TRADE_ROUND.stops){
  const a=accounts[s.account];
  lines.push(`${a.name} (${s.days.map(d=>days[d]).join(' · ')}, ${s.at})`,'  '+a.alcohol.join('; '),'  '+(ashore?'Kōji, to '+s.where+'.':s.aboard));
 }
 return lines.join('\n');
}
