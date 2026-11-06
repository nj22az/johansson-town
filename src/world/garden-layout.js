import {HARBOUR_PARK_MAIN,HARBOUR_PARK_ENTRY,HARBOUR_ONSEN,HARBOUR_POND,HARBOUR_SHRINE,HARBOUR_PARK_SEATS,HARBOUR_PARK_PATHS,inHarbourPark,harbourPondAt,harbourParkHeight} from './harbour-park-plan.js';
/** Compatibility names now describe the one garden in Minato Harbour Park. */
export const GARDEN=Object.freeze({id:'harbour-park',title:'Minato Harbour Park',...HARBOUR_PARK_MAIN,y:0,entry:HARBOUR_PARK_ENTRY,pond:HARBOUR_POND,onsen:HARBOUR_ONSEN,shrine:HARBOUR_SHRINE});
export const GARDEN_AUTHOR=Object.freeze({id:'aoba-garden',title:'Aoba Traditional Garden',minX:-49,maxX:-5,minZ:107,maxZ:154,y:0,entry:Object.freeze([-28,108]),pond:Object.freeze({x:-34,z:132,rx:7,rz:5,waterY:-.14}),onsen:Object.freeze({x:-14,z:131}),shrine:Object.freeze({x:-35,z:149})});
export const GARDEN_SCALE=.36;
export const GARDEN_BENCHES_AUTHOR=Object.freeze([[-42,144],[-26,143]].map(([x,z])=>Object.freeze({seat:Object.freeze([x,z]),stand:Object.freeze([x,z+.9])})));
export const GARDEN_BRIDGE_AUTHOR_Z=132+1.7/.6;
export const GARDEN_PATHS_AUTHOR=Object.freeze([]);
/** Old authored seat targets are aliases of the two accessible benches, not abandoned coordinates. */
export function gardenPoint(x,z){
 for(let i=0;i<GARDEN_BENCHES_AUTHOR.length;i++){
  const old=GARDEN_BENCHES_AUTHOR[i],now=HARBOUR_PARK_SEATS[i];
  if(x===old.seat[0]&&Math.abs(z-old.seat[1])<.001)return [now.x,now.z];
  if(x===old.stand[0]&&Math.abs(z-old.stand[1])<.001)return [...now.stand];
 }
 return [HARBOUR_POND.x+(x+34)*GARDEN_SCALE,HARBOUR_POND.z+(z-132)*GARDEN_SCALE];
}
export const gardenLocal=(x,z)=>[(x-HARBOUR_POND.x)/GARDEN_SCALE-34,(z-HARBOUR_POND.z)/GARDEN_SCALE+132];
/** Retain the useful public connectors through the former Aoba/Rainflower grounds. */
export const PARK_ACCESS=Object.freeze([
 // Round Kitahama's pocket park, not through it: up Fukugi Lane to the north lane and along it (kitahama-layout.js). It
 // used to run straight across the ground the park now stands on, through its railing, its sandpit and its bench.
 {id:'neighbourhood-residential-connector',peninsula:true,width:1.8,surface:'stone',points:[[-23.4,40.6],[-21.5,40.6],[-21.5,46],[-5.4,46],[-5.4,36.9],[1.9,36.9],[1.9,46]],heights:[0,0,0,0,0,0,0]},
 // Along Kitahama's south lane and up Fukugi Lane to the Heights' corner: the straight line at z 34.6 ran along the
 // pocket park's railing and into the Heights' lot.
 {id:'neighbourhood-town-connector',peninsula:true,width:2.5,surface:'stone',points:[[3,10],[1.9,14],[1.9,27],[-5.4,27],[-8,31],[-21.5,31],[-21.5,34.6],[-23.4,34.6]]},
 {id:'neighbourhood-west-connector',peninsula:true,width:2.5,surface:'stone',points:[[-37.6,20],[-37.6,32],[-23.4,32],[-23.4,34.6],[-23.4,40.6]]},
]);
export const GARDEN_PATHS=Object.freeze([...HARBOUR_PARK_PATHS,...PARK_ACCESS]);
export const inGarden=inHarbourPark;
export const gardenPondAt=harbourPondAt;
export const gardenHeight=harbourParkHeight;
export const gardenApronHeight=(x,z)=>inHarbourPark(x,z)?harbourParkHeight(x,z):null;
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
let accessReach=null;
export function gardenAccessHeight(x,z){
 if(!accessReach){const p=PARK_ACCESS.flatMap(r=>r.points);accessReach={minX:Math.min(...p.map(p=>p[0]))-3.05,maxX:Math.max(...p.map(p=>p[0]))+3.05,minZ:Math.min(...p.map(p=>p[1]))-3.05,maxZ:Math.max(...p.map(p=>p[1]))+3.05};}
 if(x<accessReach.minX||x>accessReach.maxX||z<accessReach.minZ||z>accessReach.maxZ)return null;
 let distance=Infinity,level=0;
 for(const r of PARK_ACCESS)for(let i=1;i<r.points.length;i++){
  const a=r.points[i-1],b=r.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1))),d=Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t);
  if(d<distance){distance=d;level=r.heights?r.heights[i-1]*(1-t)+r.heights[i]*t:0;}
 }
 if(distance>3.05)return null;
 const surrounding=-.4*smooth((z-12)/6);return level+(surrounding-level)*smooth((distance-1.25)/1.8);
}
export function gardenGroundHeight(x,z){const heights=[gardenApronHeight(x,z),gardenAccessHeight(x,z)].filter(h=>h!==null);return heights.length?Math.max(...heights):null;}
// The ground these heights describe is drawn by the neighbourhood's ground and the streets' paving; the separate
// 'Continuous neighbourhood garden ground' mesh that once covered x −44..15, z 6..70 lay under them and was removed with
// the west-shore bank (west-shore.js).
