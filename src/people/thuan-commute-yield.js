/**
 * Resident right-of-way — schedule layer only (not WalkFix gait/facing).
 * Ordinary walkers make room for Thuan; residents committed to an activity hold
 * their place and become an obstacle Thuan must route around.
 */

/** An activity which must not be interrupted merely because another walker passes. */
export function residentCommitted(g){
 const d=g?.userData||{};
 return !!(d.shopping||d.usingTownObject||d.serving||d.restocking||d.shopReach||d.mealState||Number.isFinite(d.seatHeight));
}

/** @param {{visible?:boolean,userData:Record<string,unknown>}|null|undefined} g */
export function thuanHasCommutePriority(g,phase){
 if(!g||g.visible===false||g.userData.inMarket||g.userData.indoors==='market')return false;
 if(g.userData.indoors||g.userData.inIzakaya||g.userData.inOnsen||g.userData.inRamen||g.userData.inHome)return false;
 // Once she is visibly walking, the rule applies to the whole street rather than
 // only the market and bus approaches. This keeps two routines from deadlocking at
 // an arbitrary corner between named destinations.
 if(g.userData.character?.moving)return true;
 const place=g.userData.place;
 if(place==='market')return true;
 if(place==='bus'||place==='station')return phase==='arriving'||phase==='town';
 return false;
}

/**
 * Side-step target clear of Thuan's forward path, or null if no yield needed.
 * @returns {[number,number]|null}
 */
export function yieldAsideTarget(personPos,thuanPos,thuanYaw,collides=()=>false,groundOk=()=>true){
 const dist=Math.hypot(personPos[0]-thuanPos[0],personPos[1]-thuanPos[1]);
 if(dist>2.6||dist<.05)return null;
 const fx=-Math.sin(thuanYaw),fz=-Math.cos(thuanYaw);
 const toX=personPos[0]-thuanPos[0],toZ=personPos[1]-thuanPos[1];
 if(toX*fx+toZ*fz<-.35)return null;
 const sideX=-fz,sideZ=fx;
 const sign=(toX*sideX+toZ*sideZ)>=0?1:-1;
 for(const extra of [1.15,1.55,1.95]){
  const x=personPos[0]+sideX*sign*extra,z=personPos[1]+sideZ*sign*extra;
  if(!collides(x,z)&&groundOk(x,z))return [x,z];
 }
 return null;
}

/** Personal space radii while Thuan has commute priority. */
export function commuteCrowdRadii(walkerIsThuan,otherIsThuan,otherCommitted=false){
 // Thuan goes around a resident who is shopping, eating, serving, or using a town
 // object. She only gets the softer advance when that resident is actively yielding.
 if(walkerIsThuan&&otherCommitted)return .78;
 if(otherIsThuan&&!walkerIsThuan)return .95;
 if(walkerIsThuan&&!otherIsThuan)return .42;
 return .61;
}
