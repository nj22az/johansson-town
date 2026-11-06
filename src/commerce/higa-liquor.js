/**
 * Higa Liquor (比嘉酒店), Grandmother Higa's shop on Main Street, is shut for good. The owner, 22 October 2026: "The
 * sisters basically run commerce and healthcare on the island … maybe we don't need a liquor store, Sakura can sell
 * liquor too", and the answers that settled it: Higa Liquor closes; Sakura sells all the alcohol over its counter
 * (commerce/konbini.js SAKURA_BOTTLES) and supplies Minato, Sato Ramen and the Coral Bay Bar from its depot
 * (merchandising.js ACCOUNTS.sakura, `alcohol`); Kōji's round becomes Sakura Trading's (commerce/trade-round.js);
 * Grandmother Higa kept only the bathhouse, and the building stood shut with a closing notice on the shutter. Until then
 * (from 21 October) it was open 9–12 and 17–20 round her afternoon at the bandai, Yui minding it on Saturdays.
 *
 * Since 30 October 2026 the room is Kissa Higa, Grandmother Higa's morning coffee shop (commerce/kissa-higa.js): the
 * liquor shop stays closed and the drink stays Sakura's. What is left of the liquor shop is here: the family kusu still
 * behind the counter, and the yuntaku bench out front.
 */
const minute=m=>((m%1440)+1440)%1440;

/**
 * The family kusu (古酒): aged awamori in a clay jar behind the counter, the one thing in the shop that was never sold, and
 * still behind the counter now that the counter serves coffee: Grandmother Higa says it has stood there since the year it
 * was laid down and will not be moved before Yui's wedding. A story hook, and why the jar never had a price.
 */
export const HIGA_KUSU=Object.freeze({id:'higa-kusu',jp:'古酒',name:'The Higa family kusu',
 vessel:'a three-shō (5.4 litre) jar of unglazed nanban-yaki clay, its wooden lid tied down with hemp cord and a paper seal',
 laidDown:1968,by:'Grandmother Higa’s late husband, who drove the island bus and did the shop’s rounds on the black bicycle',
 why:'Laid down the year Yui was born, to be opened at her wedding. Every New Year a cup is drawn for the family altar and the jar is topped up from the next-oldest bottle (shitsugi), so it is older than any bottle in the shop and gets better every year it waits.',
 neverSold:'Not for sale at any price: it is the family’s, not the shop’s. Grandmother Higa says so to everyone who asks, and looks at Yui when she says it.',
 hooks:Object.freeze(['Grandmother wants Yui married, and the jar is waiting (cast.js RELATIONSHIPS: the granddaughter and the grandmother).',
  'Tetsuo is always offered a cup at New Year and never takes it (the slow spark with Miss Higa).',
  'A typhoon year the jar was carried into the bath house for safety, and the whole bath smelled of it.']),
 period:'Okinawan families laid down kusu for a child’s birth and opened it at a wedding or a sixtieth birthday; the shitsugi topping-up is the island’s own way of ageing awamori.'});

/**
 * The yuntaku bench (ゆんたく: Okinawan for sitting and talking) in front of the shop: a timber bench against the
 * police-station end of the front and two upturned beer crates for stools. The liquor shop has shut, the bench has not
 * (the kissaten is a morning's, and its shutter is down by evening): men still sit there of an evening with a bottle, bought at Sakura's till before it shuts at eight (on Saturdays, when
 * Sakura is shut all day, the one they bought on Friday). Who sits there comes
 * from their own days (people/cast.js): Tetsuo between the bath's boiler checks, Mac after the ship's engine room and
 * before his one beer at Minato. Mr Fujita's crate is the empty one: the owner's ruling of 19 October 2026 has him sober
 * on the bridge until 23:15, and the bench empties at eight, so his stool waits for a day the ship does not sail (none
 * is modelled).
 *
 * Seats are world positions: `at` is where the sitter sits, `stand` where they stand up to (clear of every solid), and
 * `yaw` the way they face as the town measures it (stand-points.js yawFacing).
 */
export const YUNTAKU=Object.freeze({
 bench:Object.freeze({x:5.32,z0:9.38,z1:10.78,depth:.42,height:.44}),
 crates:Object.freeze([Object.freeze({id:'mac',x:4.0,z:9.75}),Object.freeze({id:'fuji',x:4.0,z:10.45})]),
 // (`front`: how far ahead of the mark the seat's front edge is, seat-slots.js: the bench's at x 5.11, the crates .36 deep)
 seats:Object.freeze({
  tetsuo:Object.freeze({at:Object.freeze([5.3,9.75]),stand:Object.freeze([4.72,9.2]),height:.44,yaw:Math.PI/2,front:.19}),
  player:Object.freeze({at:Object.freeze([5.3,10.45]),stand:Object.freeze([4.75,11.2]),height:.44,yaw:Math.PI/2,front:.19}),
  mac:Object.freeze({at:Object.freeze([4.0,9.75]),stand:Object.freeze([3.3,9.75]),height:.31,yaw:-Math.PI/2,front:.18}),
  fuji:Object.freeze({at:Object.freeze([4.0,10.45]),stand:Object.freeze([3.3,10.45]),height:.31,yaw:-Math.PI/2,front:.18}),
 }),
 sitters:Object.freeze([
  Object.freeze({name:'Tetsuo',seat:'tetsuo',from:1110,to:1200,
   why:'The bath’s boiler is lit for the evening by half past six and holds by itself for an hour and a half; the shop is at the foot of Kitano Road, under Umi-no-yu, so he sits out with a bottle where he can hear the burner, and goes back up to the boiler at eight.'}),
  Object.freeze({name:'Mac',seat:'mac',from:1170,to:1200,
   why:'Off the ship at half past seven, he walks up Main Street and stops for half an hour on a crate with whoever is there; his one beer is still Minato’s, at eight.'}),
 ]),
 absent:Object.freeze({name:'Mr Fujita',seat:'fuji',why:'Sober on the bridge until he signs off at 23:15 (AGENTS.md, the consolidation’s ruling and the timetable of 21 October 2026), three hours after the bench empties: his crate is kept for him and stands empty.'}),
});
/** The yuntaku seat a resident is on at this minute, or null. */
export function yuntakuSeatAt(name,minutes){
 const m=minute(minutes),s=YUNTAKU.sitters.find(s=>s.name===name);
 if(!s||m<s.from||m>=s.to)return null;
 return {...YUNTAKU.seats[s.seat],id:s.seat,why:s.why};
}
