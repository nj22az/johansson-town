import {yuntakuSeatAt} from '../commerce/higa-liquor.js';
import {roundAt} from '../commerce/trade-round.js';
import {laundryVisitAt} from '../commerce/coin-laundry.js';
import {KISSA,KISSA_KEEPER,KISSA_MENU,kissaDay,kissaOnDuty,kissaVisitAt} from '../commerce/kissa-higa.js';

/**
 * Where the shops of 21 October 2026 put the residents (the owner's decision: no new people; commerce/coin-laundry.js,
 * commerce/higa-liquor.js): on Sakura Trading's round (Higa Liquor's until the shop closed on 22 October 2026;
 * commerce/trade-round.js), on the bench outside the old Higa Liquor of an evening, and at the coin laundry's machines
 * on their washing day; and since 30 October 2026 at Kissa Higa of a weekday morning, Grandmother Higa behind its
 * counter and the regulars on its stools (commerce/kissa-higa.js). A pure function of the clock, read by the canonical
 * day (canonical-day.js) and the walking residents' planner (social.js residentPlan) before their ordinary rows, so the
 * street, the stories and the tests ask the same question.
 *
 * The world positions are the shops' own (coin-laundry-dressing.js LAUNDRY_PLACES and LAUNDRY_BENCH), written here as
 * numbers so the people modules do not load the buildings; tests/shop-days.test.mjs holds the two the same.
 */
const minute=m=>((m%1440)+1440)%1440;
/** The coin laundry's frame: world = (x0 + local z, z0 - local x). */
const laundry=(x,z)=>Object.freeze([-11.9+z,20.7-x]);
/** In front of each machine, where a customer loads and unloads it, and the way they face (world). */
export const LAUNDRY_STANDS=Object.freeze({
 W1:Object.freeze({at:laundry(-1.0,1.4),yaw:Math.PI}),W2:Object.freeze({at:laundry(-1.0,.65),yaw:Math.PI}),
 W3:Object.freeze({at:laundry(-1.0,-.1),yaw:Math.PI}),W4:Object.freeze({at:laundry(-1.0,-.68),yaw:Math.PI}),
 D1:Object.freeze({at:laundry(.95,-.4),yaw:0}),D2:Object.freeze({at:laundry(.95,.5),yaw:0}),
 table:Object.freeze({at:laundry(1.45,2.0),yaw:-Math.PI/2}),
});
/** The bench's two places: [sit, stand] in the world, facing the machines (world +x). Visitors take them in this order. */
export const LAUNDRY_SEATS=Object.freeze([
 // (the bench's front edge, local z -1.04, is .16 ahead of the marks: `front`, seat-slots.js)
 Object.freeze({key:'laundry-bench-0',at:laundry(-.8,-1.2),stand:laundry(-.8,-.55),height:.42,yaw:-Math.PI/2,front:.16}),
 Object.freeze({key:'laundry-bench-1',at:laundry(.2,-1.2),stand:laundry(.2,-.55),height:.42,yaw:-Math.PI/2,front:.16}),
]);
const SEAT_OF=Object.freeze({'Ms Uezu':0,Nhung:0,Thao:1});

/**
 * The shop plan for a resident at this minute, or null when no shop has them. `pointFor(place)` turns a canonical place
 * into a world target for Kōji's drops (canonical-day.js points). Plans carry a `stand` ({yaw, pose, seat?, held?}) the
 * walkers stand or sit on (schedules.js standOnPoint, neighbours.js standAtPoint).
 */
export function shopDayPlan(name,minutes,{pointFor=()=>null,kissaClosingHeld=false}={}){
 if(!name)return null;
 const m=minute(minutes);
 // Sakura Trading's round, Kōji's on his weeks ashore.
 if(name==='Kōji'){const leg=roundAt(minutes);if(leg){const target=leg.point?[...leg.point]:pointFor(leg.place);if(target)return {place:'trade-round',target,activity:leg.activity};}}
 // Kissa Higa of a weekday morning: Grandmother Higa behind the counter, then up Kitano Road to open the bath at ten.
 if(name===KISSA.keeper){
  if(kissaClosingHeld)return {place:'kissa-higa',target:[...KISSA_KEEPER.front],activity:'waiting for the last customer, then closing Kissa Higa',
   stand:Object.freeze({yaw:KISSA_KEEPER.frontYaw,pose:'Interact',why:'Nobody is shut inside: she waits outside until the room and doorway are clear.'})};
  if(kissaOnDuty(minutes)){
   // At the front while the shutter goes up and comes down (she is out before it does: commerce/kissa-higa.js KISSA),
   // behind the counter between.
   const outside=m<KISSA.shutterUp+KISSA.roll||m>=KISSA.out;
   if(outside)return {place:'kissa-higa',target:[...KISSA_KEEPER.front],activity:m<KISSA.open?'lifting the shutter at Kissa Higa':'pulling the shutter down at Kissa Higa',
    stand:Object.freeze({yaw:KISSA_KEEPER.frontYaw,pose:'Interact',why:KISSA.why})};
   const activity=m<KISSA.open?'lighting the spirit lamps at Kissa Higa':m<KISSA.close?'behind the counter at Kissa Higa: the siphons and the toast':'washing up at Kissa Higa';
   return {place:'kissa-higa',target:[...KISSA_KEEPER.at],activity,stand:Object.freeze({yaw:KISSA_KEEPER.yaw,pose:'CounterIdle',why:KISSA.why})};
  }
  if(kissaDay(minutes)&&m>=KISSA.leave&&m<600){const target=pointFor('onsen');if(target)return {place:'onsen',target,activity:'up Kitano Road from Kissa Higa to open the bath'};}
 }
 // A regular on their stool or chair at Kissa Higa, with what they ordered.
 const regular=kissaVisitAt(name,minutes);
 if(regular){const order=KISSA_MENU.find(i=>i.id===regular.order);
  return {place:'kissa-higa',target:[...regular.stand],activity:`${order.name.toLowerCase()} at Kissa Higa`,
   stand:Object.freeze({yaw:regular.yaw,pose:'Drink',held:'coffee',seat:Object.freeze({key:'kissa-'+regular.id,at:regular.at,height:regular.height,front:regular.front}),why:regular.why})};}
 // The yuntaku bench of an evening, outside the old liquor shop.
 const seat=yuntakuSeatAt(name,minutes);
 if(seat)return {place:'higa-bench',target:[...seat.stand],activity:'a bottle on the bench outside Kissa Higa',
  stand:Object.freeze({yaw:seat.yaw,pose:'Drink',held:'beer',seat:Object.freeze({key:'higa-'+seat.id,at:seat.at,height:seat.height,front:seat.front}),why:seat.why})};
 // Washing day at the coin laundry.
 const visit=laundryVisitAt(name,minutes);
 if(visit){
  if(visit.stage==='waiting'){const s=LAUNDRY_SEATS[SEAT_OF[name]??0];
   return {place:'coin-laundry',target:[...s.stand],activity:'waiting for the washing on the coin laundry bench, a manga open',
    stand:Object.freeze({yaw:s.yaw,pose:'Read',held:'paper',seat:Object.freeze({key:s.key,at:s.at,height:s.height,front:s.front}),why:visit.why})};}
  const t=visit.timeline,stage=visit.stage==='folding'?'table':m<t.wash[0]?visit.washers[0]:visit.dryer,S=LAUNDRY_STANDS[stage];
  return {place:'coin-laundry',target:[...S.at],activity:visit.stage==='folding'?'folding the washing at the coin laundry':'loading the machines at the coin laundry',
   stand:Object.freeze({yaw:S.yaw,pose:'Interact',why:visit.why})};
 }
 return null;
}
