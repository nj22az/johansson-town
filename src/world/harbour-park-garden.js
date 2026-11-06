/**
 * What grows in Harbour Park, who keeps it and why: the data the park is planted from (park.js), the guide board reads
 * and the storyteller can use. The owner, 21 October 2026, on the park rework: lawns as clear edged beds, flower borders
 * along the walks, a koi pond with lily pads, the footbath, a big shade tree with its bench and lamp; "nothing random":
 * each active keeper comes from the cast (src/people/roster.js); a vacant assignment is recorded explicitly. Every plant is one an Okinawan park grows, flowering in
 * its own months by the town's calendar (town-clock.js), never all year because it looks nice.
 *
 * The beds are the rulebook's garden earth (ground-standard.js, 25 mm proud of the lawn), laid by the ground generator
 * from ground-plan-coast.js like the walks, each clear of the walks' setts by a strip of lawn, so a bed reads as a bed.
 * No module draws its own soil.
 */
import {townCalendarAt} from '../town-clock.js';

const rect=(minX,maxX,minZ,maxZ)=>Object.freeze({minX,maxX,minZ,maxZ});
const months=(...m)=>Object.freeze(m);
const ALL_YEAR=months(1,2,3,4,5,6,7,8,9,10,11,12);

/** Each plant: what it is (English, Japanese), when it flowers on Okinawa, and why a park here grows it. */
export const PARK_PLANTS=Object.freeze({
 hibiscus:Object.freeze({name:'hibiscus',jp:'ブッソウゲ',flowers:ALL_YEAR,colour:0xd8323a,
  why:'Okinawa’s everyday flower, red all year; the plants come in pots from Sakura’s flower stand across the street.'}),
 bougainvillea:Object.freeze({name:'bougainvillea',jp:'ブーゲンビレア',flowers:ALL_YEAR,colour:0xc8357f,
  why:'Magenta all year in the island’s heat and salt wind; clipped low as a screen between the bench and the traffic.'}),
 ixora:Object.freeze({name:'ixora',jp:'サンダンカ',flowers:months(5,6,7,8,9,10),colour:0xe8562a,
  why:'Sandanka, one of the three famous flowers of Okinawa: orange-red heads from May into October, low enough not to hide the gate.'}),
 lily:Object.freeze({name:'Easter lily',jp:'テッポウユリ',flowers:months(4,5),colour:0xf6f1e2,
  why:'The Ryukyu islands’ own white lily, in flower in April and May; the rest of the year it is a clump of narrow leaves.'}),
 getto:Object.freeze({name:'shell ginger',jp:'月桃',flowers:months(5,6),colour:0xf3e4d2,
  why:'Gettō: tall leaves that screen the bath’s fence all year, and hanging white-and-pink flowers in May and June; its leaves wrap the mūchī rice cakes in December.'}),
});

/**
 * The beds. `plants`: [kind, x, z] in town coordinates, each on its bed's earth. `keeper` is a roster id or null while
 * unassigned; `tends` records a keeper's time (no walk to it is scheduled yet: the people's days are cast.js's).
 */
export const HARBOUR_PARK_BEDS=Object.freeze([
 Object.freeze({id:'entrance-bed',title:'Entrance bed',bounds:rect(8.6,11.8,-19.4,-18.7),
  keeper:null,maintenance:'unassigned',tends:'No watering round assigned',
  why:'The planted bed between the gate and the closed dessert counter stays in place. Its keeper assignment is vacant until the facilities have an agreed maintenance plan.',
  plants:Object.freeze([['ixora',9.1,-19.05],['lily',9.9,-19.05],['ixora',10.7,-19.05],['lily',11.4,-19.05]].map(Object.freeze))}),
 Object.freeze({id:'main-street-border',title:'Main Street border',bounds:rect(6.15,7.45,-33,-27.3),
  keeper:'thuan',tends:'08:40, before Sakura opens',
  why:'The border along Main Street, opposite Sakura’s door: Sakura supplies the town’s flowers since Mrs Kinjō retired, and the border is where Thuan plants out what she sells in pots; it screens the cherry bench from the street.',
  plants:Object.freeze([['bougainvillea',6.8,-27.9],['hibiscus',6.8,-29.3],['bougainvillea',6.8,-30.7],['hibiscus',6.8,-32.2]].map(Object.freeze))}),
 Object.freeze({id:'bath-screen',title:'Gettō screen',bounds:rect(20.6,29.6,-25.7,-25),
  keeper:'gran-higa',tends:'09:45, before the bath opens',
  why:'Gettō along the bath’s south fence, so the pond walk does not look into the bath yard; Grandmother Higa cuts its leaves for mūchī in December.',
  plants:Object.freeze([21.4,23.0,24.6,26.2,27.8,29.0].map(x=>Object.freeze(['getto',x,-25.35])))}),
]);

/** The koi pond's keeper: the pond lies between Umi-no-yu and the quay. */
export const HARBOUR_POND_KEEPER=Object.freeze({keeper:'gran-higa',feeds:'when the bath opens at 10:00',food:'fu (麩), wheat-gluten crumbs, from a tin she keeps at the bandai',
 why:'The pond is beside her bathhouse; she feeds the koi on her way to open at ten, and leaves the tin of fu out on the post by the pond for the children until she shuts at 22:00.'});

/** The lily pads on the pond, [x, z, radius]: in the shallows at the ends, clear of the koi's stones and the reeds. */
export const HARBOUR_POND_PADS=Object.freeze([[24.0,-29.8,.26],[24.6,-29.5,.2],[24.3,-32.2,.18],[27.3,-32.3,.22],[28.6,-30.4,.2],[25.9,-32.6,.21],[26.4,-29.3,.19]].map(Object.freeze));

/**
 * The big shade tree: a gajumaru (banyan) on the beach lawn, where the walk comes up off the sand, with a slatted bench
 * in its shade and a globe lamp beside the bench (HARBOUR_PARK_SEATS gajumaru-bench).
 */
export const HARBOUR_SHADE_TREE=Object.freeze({x:24.4,z:-6.3,height:7,lamp:Object.freeze([28.95,-7.3]),
 why:'Shade where the walk comes up off the beach: for bathers drying off before Umi-no-yu and for anyone waiting for the ten o’clock opening. A gajumaru is the tree an Okinawan village sits under; the old people say a kijimunā lives in one this size.'});

/**
 * The guide board at the gate, painted in Japanese like every sign in town (its English beside each line, for the
 * prompt): the park's name, the landmarks on its map at their places, where you stand, and its two notices.
 */
export const PARK_GUIDE_BOARD=Object.freeze({jp:'港公園',en:'Minato Harbour Park',
 here:Object.freeze({jp:'現在地',en:'You are here'}),
 labels:Object.freeze([
  {jp:'海の湯',en:'Umi-no-yu',at:[25.2,-20.6],colour:'#fff',size:20},{jp:'足湯',en:'Footbath',at:[16.3,-18.7]},
  {jp:'鯉の池',en:'Koi pond',at:[26,-31]},{jp:'緋寒桜',en:'Kanhizakura (the harbour cherry)',at:[12,-28]},
  {jp:'拝所',en:'Shrine',at:[10.8,-35]},{jp:'ガジュマル',en:'Gajumaru',at:[HARBOUR_SHADE_TREE.x,HARBOUR_SHADE_TREE.z]},
  {jp:'甘味処（休業）',en:'Dessert counter (closed)',at:[8.4,-16.4]},{jp:'浜へ',en:'To the beach',at:[31.5,-11.6]},{jp:'岸壁',en:'The quay',at:[20.3,-35.6]},
 ].map(Object.freeze)),
 notices:Object.freeze([
  Object.freeze({jp:'海の湯・足湯 10:00〜22:00　足湯は住民無料',en:'Umi-no-yu and its footbath 10:00–22:00; the footbath is free for residents'}),
  Object.freeze({jp:'鯉のえさは ひとつまみ まで',en:'Koi food: one pinch each'}),
 ]),
});

/** Whether a plant is in flower on the town's date. */
export function plantInFlower(kind,minutes){
 const month=townCalendarAt(minutes).date.getMonth()+1;
 return PARK_PLANTS[kind].flowers.includes(month);
}
/** What a bed shows this month: its plants in flower and in leaf. */
export function bedNow(bed,minutes){
 const kinds=[...new Set(bed.plants.map(([k])=>k))];
 return {flowering:kinds.filter(k=>plantInFlower(k,minutes)),leaf:kinds.filter(k=>!plantInFlower(k,minutes))};
}
