/**
 * The east beach, from the oil jetty to the town hall's grounds: shared by the beach mesh (east-lawn.js), the access ramps,
 * navigation and grounding.
 *
 * Step 4 of the owner's ground plan (21 October 2026, docs/GROUND-STANDARD.md): the beach is coral-white sand graded to
 * the sea, its wet band at the water (ground-standard.js beach-sand.wet), and graded up, never stepped, to whatever is
 * laid on its edges. At its south end the quay north of the oil jetty ends at x 42.3 (the owner, approved: "bring the
 * beach back there"), so the sand runs from the fuel depot's court and the quay's edge to the water; at its north end it
 * runs up to the town hall's yard and to Kitahama's coastal walk, where the neighbourhood's lawn used to lie over it.
 *
 * `minZ`..`maxZ` is the whole sand; `open` the stretch with nothing laid over it (between the fuel depot's court and the
 * town hall's grounds), where the crabs live and the map draws the beach. The profile runs from under the east lawn's
 * parapet (x 33.2, the lawn's edge) out under the water.
 */
export const BEACH=Object.freeze({
 id:'east-beach',surface:'sand',minZ:-44.9,maxZ:29.3,
 open:Object.freeze({minZ:-27.4,maxZ:24.6}),
 profile:Object.freeze([[33.2,-.02],[33.9,-.06],[38.5,-.18],[42.5,-.29],[45,-.37],[47.8,-1.05]].map(Object.freeze)),
 accesses:Object.freeze([-10,22.5].map(z=>Object.freeze({z,half:1.6,fromX:32.7,toX:35.4}))),
 waterY:-.56,
});
/**
 * What is laid on the sand's edges, where there is no sand: the east quay north of the oil jetty (to x 42.3) and beside it
 * (to its end at x 44.3), the fuel depot's service court, and the town hall's grounds inside their seawall (x 41).
 * ground-plan-harbour.js and ground-plan-quarters.js lay them.
 */
export const BEACH_EDGES=Object.freeze({quayEdge:42.3,quayEnd:44.3,jettyNorth:-44.4,quayNorth:-38,
 /** The court runs a centimetre under the lawn's edge (x 33.2), so its side never lies in the parapet's face. */
 court:Object.freeze({minX:33.19,maxX:42.3,minZ:-38,maxZ:-27.4}),
 school:Object.freeze({maxX:41,minZ:24.6}),
 /** Kitahama's coastal walk comes down to the beach here (island-plan.js COAST_WALK, 2.4 m wide at x 43.6). */
 walk:Object.freeze({minX:42.4,maxX:44.8,z:29.3})});
/**
 * The shore at the beach's north end: the coastline the neighbourhood's lawn stops at (island-coast.js COASTLINE, x 45 from
 * z -43 to 29), and where a grade starts to give way to the beach's profile: the coastline where it leaves x 45 for
 * (47.5, 40), at the sand's north edge (z 29.3), so the lawn's last corner still meets level sand.
 */
export const BEACH_SHORE=Object.freeze({coastX:45,fadeFrom:45.07});
/** Whether there is sand at x, z (rather than the quay, the court or the town hall's grounds laid there). */
export function onBeach(x,z){
 const E=BEACH_EDGES;
 if(z<BEACH.minZ||z>BEACH.maxZ||x<BEACH.profile[0][0]||x>BEACH.profile.at(-1)[0])return false;
 // The sand runs on under the quay's coping and the oil jetty's deck at its root (the deck stands on piles over it).
 if(z<E.jettyNorth&&x<E.quayEnd-.15)return false;
 if(z<E.quayNorth&&x<E.quayEdge)return false;
 if(z>=E.court.minZ&&z<E.court.maxZ&&x<E.court.maxX)return false;
 if(z>E.school.minZ&&x<E.school.maxX)return false;
 return true;
}
/** The beach's own profile at x, z (before the grades), or null off the sand. */
export function beachHeight(x,z){
 if(!onBeach(x,z))return null;
 return beachProfile(x);
}
/** The profile across the beach at x (from the parapet out under the water), wherever the sand is. */
export function beachProfile(x){
 if(x<BEACH.profile[0][0]||x>BEACH.profile.at(-1)[0])return null;
 for(let i=1;i<BEACH.profile.length;i++){
  const [bx,by]=BEACH.profile[i], [ax,ay]=BEACH.profile[i-1];
  if(x<=bx)return ay+(by-ay)*(x-ax)/(bx-ax);
 }
 return null;
}
export function beachAccessHeight(x,z){
 const ramp=BEACH.accesses.find(a=>x>=a.fromX&&x<=a.toX&&Math.abs(z-a.z)<=a.half);
 return ramp?beachHeight(ramp.toX,z)*(x-ramp.fromX)/(ramp.toX-ramp.fromX):null;
}

/**
 * Where the sand is graded up to meet what is laid on its edges (ground-standard.js: beach sand meets every firm surface
 * graded, never stepped). Along each `core` (a line, or a rectangle) the sand is level with the surface it meets (`y`);
 * away from it, it falls back to the beach at 1:6.7 (`slope`, gentler than 1:6) until it meets the beach's own profile.
 * `apply` bounds the sand a grade may raise. The beach mesh (east-lawn.js) and every height asked of the sand
 * (coastal-ground.js, layout.js) take the grades.
 */
const E=BEACH_EDGES,SLOPE=.15,REACH=3;
const grade=(id,core,y,why)=>Object.freeze({id,y,slope:SLOPE,drawn:'sand',why,core:Object.freeze(core),
 apply:Object.freeze({minX:core.minX-REACH,maxX:core.maxX+REACH,minZ:core.minZ-REACH,maxZ:core.maxZ+REACH})});
export const BEACH_GRADES=Object.freeze([
 grade('quay-corner-east',{minX:E.quayEdge,maxX:E.quayEdge,minZ:E.jettyNorth,maxZ:E.quayNorth},.06,'the east quay north of the oil jetty ends at x 42.3 (ground-plan-harbour.js): the sand drifts up to its edge'),
 grade('quay-corner-north',{minX:E.quayEdge,maxX:E.quayEnd,minZ:E.jettyNorth,maxZ:E.jettyNorth},.06,'the quay\u2019s stretch to the oil jetty\u2019s root: the sand meets its north edge'),
 grade('fuel-court-east',{minX:E.court.maxX,maxX:E.court.maxX,minZ:E.court.minZ,maxZ:E.court.maxZ},.04,'the fuel depot\u2019s service court, flush concrete (ground-plan-harbour.js)'),
 grade('fuel-court-north',{minX:E.court.minX,maxX:E.court.maxX,minZ:E.court.maxZ,maxZ:E.court.maxZ},.04,'the court\u2019s north edge'),
 grade('lawn-north',{minX:33.2,maxX:33.2,minZ:BEACH.accesses[1].z+BEACH.accesses[1].half,maxZ:E.school.minZ},.02,'past the parapet\u2019s north end the neighbourhood\u2019s lawn comes to the sand'),
 grade('town-hall-yard',{minX:33.2,maxX:E.school.maxX,minZ:E.school.minZ,maxZ:E.school.minZ},.04,'the town hall\u2019s yard (ground-plan-quarters.js) at its south edge'),
 grade('town-hall-verge',{minX:E.school.maxX,maxX:E.school.maxX,minZ:E.school.minZ,maxZ:E.walk.z},.02,'the town hall\u2019s verge outside its seawall (ground-plan-quarters.js), turf'),
 // The lawn ends at the coastline (island-coast.js, x 45 here), not at the profile's end under the water: carried out to
 // x 47.8 it held a straight-edged slab of sand above the sea (the owner's phone, 21 October 2026).
 grade('kitahama-lawn',{minX:E.school.maxX,maxX:BEACH_SHORE.coastX,minZ:E.walk.z,maxZ:E.walk.z},.02,'north of the beach the neighbourhood\u2019s lawn, out to the shore'),
 grade('coast-walk',{minX:E.walk.minX-.1,maxX:E.walk.maxX+.1,minZ:E.walk.z,maxZ:E.walk.z},.04,'Kitahama\u2019s coastal walk comes down onto the sand (ground-plan-coast.js), flush'),
]);
/** The graded height at (x, z), or null where no grade reaches. */
export function beachGrade(x,z){
 // Only the sand is graded: the lawn, a ramp or a court beside it keeps its own level.
 if(!onBeach(x,z))return null;
 let best=null;
 for(const g of BEACH_GRADES){
  const a=g.apply,c=g.core;
  if(x<a.minX||x>a.maxX||z<a.minZ||z>a.maxZ)continue;
  const d=Math.hypot(Math.max(c.minX-x,0,x-c.maxX),Math.max(c.minZ-z,0,z-c.maxZ)),y=g.y-g.slope*d;
  if(best===null||y>best)best=y;
 }
 // Toward the sea a grade gives way to the beach's own profile, and is gone by the water's edge: a grade's 1:6.7 fall is
 // gentler than the beach's last fall into the sea, so carried on past the shore it held sand above the water.
 const p=beachProfile(x);
 if(best!==null&&p!==null&&best>p&&x>BEACH_SHORE.fadeFrom){
  const t=Math.min(1,(x-BEACH_SHORE.fadeFrom)/(BEACH_DRY_EDGE_X-BEACH_SHORE.fadeFrom)),k=1-t;
  best=p+(best-p)*k;
 }
 return best;
}
/** Ground height `y` at (x, z) with the sand grades laid over it: they only ever raise it. */
export function gradedHeight(x,z,y){
 const g=beachGrade(x,z);
 return y!==null&&g!==null&&g>y?g:y;
}

/** Dry edge derived from the same profile and tide used by movement. */
export const BEACH_DRY_EDGE_X=(()=>{
 const limit=BEACH.waterY+.025;
 for(let i=1;i<BEACH.profile.length;i++){
  const [ax,ay]=BEACH.profile[i-1],[bx,by]=BEACH.profile[i];
  if(by<limit)return ax+(limit-ay)*(bx-ax)/(by-ay);
 }
 return BEACH.profile.at(-1)[0];
})();

/** The quiet corner at the north end with chairs facing the sea (beach-corner.js); town-audio.js plays the shore around it. */
export const BEACH_CORNER=Object.freeze({x:38.4,z:16,radius:32});
