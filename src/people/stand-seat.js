/**
 * A stand with a seat (shop-days.js: Higa Liquor's bench, the coin laundry's): once they have turned on the point in front
 * of it they sit back onto it, as a person sits down (as far forward as the seat's front edge needs: `front`), and stand up onto that point again when the plan moves on; what they
 * hold (`held`) is in their hand while they sit.
 */
export function sitOnStand(g,stand){
 const u=g.userData;if(!stand.seat||u.standSeat?.key===stand.seat.key)return;
 u.standSeat={key:stand.seat.key,from:[g.position.x,g.position.z]};g.position.x=stand.seat.at[0];g.position.z=stand.seat.at[1];
 u.seatHeight=stand.seat.height;if(Number.isFinite(stand.seat.front))u.seatFront=stand.seat.front;if(stand.held)u.heldItem=stand.held;
}
export function standUpFromStand(g){
 const u=g.userData;if(!u.standSeat)return;
 g.position.x=u.standSeat.from[0];g.position.z=u.standSeat.from[1];delete u.standSeat;delete u.seatHeight;delete u.seatFront;delete u.heldItem;
}
/** Whether a walker is sitting on the seat of the stand their plan has them on now. */
export const seatedOn=(g,stand)=>!!stand?.seat&&g.userData.standSeat?.key===stand.seat.key;
