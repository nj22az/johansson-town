/**
 * Room on a bench for two, or on a long one more (the owner, 21 October 2026: "two people should be able to sit together on
 * a bench"). A bench's seat (marker.userData.seat) keeps its middle as `position` and gains:
 *  - `front`: how far ahead of a sitter's mark the front edge of the seat's top is (along the way they face). The animator
 *    slides a body forward on the seat as far as its shins need to hang in front of that edge, never through the seat
 *    (animate.js CHAIR_SIT, seatFront);
 *  - `slots`: one place per sitter along the bench, each with its own mark, standing point and facing, SLOT.width apart:
 *    seated with the mittens on the lap the broadest of the town reach 0.33 m to the side at the elbows (Jun, Officer
 *    Mori over his duty belt) and Kai's straw hat 0.43 m, so two people sit side by side without touching
 *    (tests/bench-two-seats.test.mjs). Residents reserve a slot each (town-activities.js) and the player takes the free one
 *    nearest him (game.js onSeat), so a resident and the player, or two residents, share a bench.
 */
export const SLOT=Object.freeze({width:.72,end:.05});

/**
 * A bench's seat with its slots: `length` the seat's length, `front` as above. Slots run along the bench (across the way
 * it faces), as many as fit (`end`: kept clear at each end), and never fewer than two. Returns a new seat; the one given is
 * left as it is (some are frozen layout data).
 */
export function benchSeat(seat,{length,front,places=null}){
 const n=places?places.length:Math.max(2,Math.floor((length-2*SLOT.end)/SLOT.width)),yaw=seat.yaw||0;
 // across the bench: a sitter faces (-sin yaw, -cos yaw), so along it is (cos yaw, -sin yaw)
 const ax=Math.cos(yaw),az=-Math.sin(yaw),at=(p,o)=>p&&[p[0]+ax*o,p[1],p[2]+az*o];
 // (`places`: a bench whose places are laid out already, [{position, stand}])
 const slots=Array.from({length:n},(_,i)=>{const o=(i-(n-1)/2)*SLOT.width;
  return Object.freeze({id:(seat.id||'bench')+':'+i,slot:i,position:places?places[i].position:at(seat.position,o),stand:places?places[i].stand:at(seat.stand,o),yaw,front});});
 return {...seat,front,length,slots:Object.freeze(slots)};
}

/**
 * The slot of a bench (or the seat itself, when it has none) for somebody at [x, z]: the nearest one `taken` does not
 * rule out, or null when the bench is full.
 */
export function freeSlot(seat,x,z,taken=()=>false){
 if(!seat?.slots)return seat&&!taken(seat)?seat:null;
 return [...seat.slots].sort((a,b)=>Math.hypot(a.position[0]-x,a.position[2]-z)-Math.hypot(b.position[0]-x,b.position[2]-z)).find(s=>!taken(s))||null;
}
