/** One ground plan for the park opposite Sakura, its businesses and public walks. */
const point=(x,z)=>Object.freeze([x,z]);
const rect=(minX,maxX,minZ,maxZ)=>Object.freeze({minX,maxX,minZ,maxZ});
export const HARBOUR_PARK_MAIN=rect(5.2,32.5,-36.2,-14.4);
export const HARBOUR_PARK_EXTENSION=rect(16.0,32.5,-14.4,-3.6);
export const HARBOUR_PARK_ENTRY=point(6,-20.8);
export const HARBOUR_ONSEN=Object.freeze({x:23.4,z:-20.6,yaw:-Math.PI/2});
export const HARBOUR_POND=Object.freeze({x:26,z:-31,rx:3,rz:2,waterY:-.08,bedY:-.35});
export const HARBOUR_CHERRY=point(12,-29.8);
export const HARBOUR_SHRINE=Object.freeze({x:10.8,z:-34.6,approach:point(10.8,-33.5)});
export const HARBOUR_PARK_SEATS=Object.freeze([
 Object.freeze({id:'harbour-park-bench',x:11,z:-29.8,yaw:Math.PI/2,stand:point(9.7,-29.8)}),
 Object.freeze({id:'garden-pond-bench',x:26,z:-35.2,yaw:Math.PI,stand:point(26,-34.2)}),
 // Under the gajumaru on the beach lawn, facing south across the park to the bathhouse (HARBOUR_SHADE_TREE).
 Object.freeze({id:'gajumaru-bench',x:27.4,z:-7.3,yaw:0,stand:point(27.4,-8.15)}),
]);
export const HARBOUR_PARK_STUDY=Object.freeze([point(9.1,-27.4),point(10.6,-26.7)]);
/**
 * Where the Rainflower Florist pavilion stood on the lawn east of Main Street (x 19–23, z 15.4–18.6) until phase 4 of
 * docs/CAST-CONSOLIDATION.md took it down (addendum 3): the flowers are Sakura's (okinawa/old-town.js SAKURA_FLOWER_STAND),
 * the lawn is the lawn again, and a saved destination or photo at the old id lands at Sakura (HARBOUR_PARK_ALIASES).
 */
export const FORMER_FLORIST=Object.freeze({id:'rainflower-florist',name:'Rainflower Florist',bounds:rect(19,23,15.4,18.6),removed:'2026-10-19, phase 4'});
// The family retired on the owner's decision of 31 October 2026. Keep the facility and its fitted counter, not a service without a keeper.
export const NAKAMURA_DESSERTS=Object.freeze({id:'nakamura',alias:'blue-coral',name:'Nakamura · zenzai & Blue Coral',owner:null,staffed:false,status:'vacant',closedNotice:'The dessert counter is closed until it has a keeper. The shop and upstairs flat are vacant.',x:5.7,z:-10.9,approach:point(4.5,-10.0),staffAt:point(7.5,-11.7),open:600,close:1140});
const inside=(b,x,z,pad=0)=>x>=b.minX-pad&&x<=b.maxX+pad&&z>=b.minZ-pad&&z<=b.maxZ+pad;
export const inHarbourPark=(x,z,pad=0)=>inside(HARBOUR_PARK_MAIN,x,z,pad)||inside(HARBOUR_PARK_EXTENSION,x,z,pad);
export const harbourPondAt=(x,z,pad=0)=>((x-HARBOUR_POND.x)/(HARBOUR_POND.rx+pad))**2+((z-HARBOUR_POND.z)/(HARBOUR_POND.rz+pad))**2<1;
export const harbourParkHeight=(x,z)=>inHarbourPark(x,z)?(harbourPondAt(x,z)?HARBOUR_POND.bedY:0):null;
const route=(id,width,points,surface='stone')=>Object.freeze({id,width,points:Object.freeze(points.map(p=>point(...p))),surface,park:true,peninsula:true});
/** The road crossing stays at Z=-18; the clear path turns toward the visible onsen porch. */
export const HARBOUR_PARK_PATHS=Object.freeze([
 route('park-approach',3,[[2.5,-18],[6,-20.8],[12,-22.4]]),
 route('garden-onsen-approach',2.4,[[12,-22.4],[16.8,-22.2],[18,-22],[19.4,-22]]),
 // Leaves the approach a few metres in, so the lawns either side are whole beds, not a triangle at the gate.
 route('garden-cherry-walk',1.8,[[9.6,-21.8],[9.4,-24.8],[9,-29.8],[9,-32.8],[17,-34.2],[22,-34.2]]),
 route('garden-pond-loop',1.8,[[22,-34.2],[30.5,-34.2],[31.4,-31],[30.5,-27.8],[22,-27.8],[21,-31],[22,-34.2]],'gravel'),
 route('garden-quay-walk',2.2,[[20.3,-38],[20.3,-35.3],[22,-34.2]]),
 route('garden-shore-walk',2,[[31.5,-36.2],[31.5,-14.8],[31.5,-10],[32.7,-10]]),
 // Goes north from the bathhouse walk along the forecourt's side, beside the footbath, so no strip of lawn is left between walk and forecourt.
 route('garden-neighbourhood-walk',2,[[13.9,-21.6],[13.9,-15.4],[17,-15.4],[22,-15.4],[31.5,-15.4]]),
 route('garden-beach-connection',2.4,[[17,-15.4],[17,-10],[31.5,-10]]),
]);
export function parkPathAt(x,z,pad=0){
 for(const r of HARBOUR_PARK_PATHS)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));
  if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<=r.width/2+pad)return r;
 }
 return null;
}
/** Old named destinations resolve here; the former compounds no longer have scenery. */
export const HARBOUR_PARK_ALIASES=Object.freeze({park:'harbour-park','aoba-garden':'harbour-park','japanese-garden':'harbour-park','east-garden':'harbour-park','rainflower-lane':'market','rainflower-florist':'market','blue-coral':'nakamura'});
