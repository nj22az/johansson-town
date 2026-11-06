// The miniature rider has shorter legs than the retained full-size character.
// Fit a low saddle and compact commuter frame to her measured limb lengths.
export function bicycleRiderFit(m){
 const scale=Math.max(.5,Math.min(.9,((m.thigh+m.shin)*.94+m.foot-m.seatDrop)/.56));
 return {scale,saddle:.74};
}

// Sample both wheel contacts and the rider, so the front cannot enter a wall
// while the centre remains outside. No scene queries or allocations are needed.
export function bicycleBlocked(x,z,yaw,scale,blocked){
 const dx=Math.sin(yaw)*.54*scale,dz=Math.cos(yaw)*.54*scale;
 return blocked(x,z,.28)||blocked(x-dx,z-dz,.23*scale)||blocked(x+dx,z+dz,.23*scale);
}
