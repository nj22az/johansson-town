import {GROUND} from '../render/ground-palette.js';
import {GATEBALL,GATEBALL_ACTIVE} from './okinawa/layout.js';
import {HARBOUR_BENCH_DIMENSIONS} from './harbour-bench-dimensions.js';
import {HARBOUR_PARK_MAIN,HARBOUR_PARK_SEATS,inHarbourPark,harbourParkHeight,parkPathAt} from './harbour-park-plan.js';

export const inGateball=(x,z)=>GATEBALL_ACTIVE&&x>GATEBALL.minX&&x<GATEBALL.maxX&&z>GATEBALL.minZ&&z<GATEBALL.maxZ;
export const COURT_TERRACE=Object.freeze({minX:GATEBALL.minX,maxX:33.2,minZ:GATEBALL.minZ,maxZ:GATEBALL.maxZ,height:.7,bank:2.2});
export const onCourtTerrace=(x,z)=>GATEBALL_ACTIVE&&x>=COURT_TERRACE.minX&&x<=COURT_TERRACE.maxX&&z>=COURT_TERRACE.minZ&&z<=COURT_TERRACE.maxZ;
export const courtTerraceHeight=(x,z)=>onCourtTerrace(x,z)?COURT_TERRACE.height:null;
export const TURF_TINT=GROUND.grass,PARK_PATH_TINT=0xcfc2a0;
export const PARK_TERRAIN_SEGMENTS=96;
const b=HARBOUR_PARK_MAIN;
/** The raised imported mound is retired. The park, its porch walk and the lawn share datum zero. */
export const PARK=Object.freeze({id:'harbour-park',title:'Minato Harbour Park',x:(b.minX+b.maxX)/2,z:(b.minZ+b.maxZ)/2,half:(b.maxZ-b.minZ)/2,halfX:(b.maxX-b.minX)/2,halfZ:(b.maxZ-b.minZ)/2,lift:0,scale:.56,surface:'grass',level:true,bounds:b});
export const COMPACT_PARK=PARK;
export const activePark=()=>PARK;
export const parkHeight=harbourParkHeight;
export const PARK_SKIRT=0,PARK_SKIRT_WEST=0;
export const parkSkirtHeight=(x,z)=>inHarbourPark(x,z)?harbourParkHeight(x,z):null;
export const parkApproachHeight=(x,z)=>parkPathAt(x,z)?.park?0:null;
// Retained export for old bench imports; current geometry uses its measured dimensions below.
export const PARK_BENCH_FIT=Object.freeze({x:2.12,y:1.58,z:0,scale:2,seat:1.96,top:2.51,width:.52,length:1.86});
export const benchPoint=(x,y,z)=>{const f=PARK_BENCH_FIT;return [f.x+(x-f.x)*f.scale,f.y+(y-f.y)*f.scale,f.z+(z-f.z)*f.scale];};
export function parkBenchGeometry(){
 const d=HARBOUR_BENCH_DIMENSIONS,s=HARBOUR_PARK_SEATS[0],footY=.02;
 return {dimensions:d,scale:1,x:s.x,z:s.z,footY,seatY:footY+d.seatHeight,width:d.footprintDepth,length:d.length,top:d.backHeight};
}
export function parkBench(){
 const g=parkBenchGeometry(),s=HARBOUR_PARK_SEATS[0];
 return {position:[g.x+g.dimensions.sitZ,0,g.z],surfaceY:g.seatY,eyeY:g.seatY+.75,yaw:s.yaw,pitch:0,stand:[s.stand[0],0,s.stand[1]]};
}
export const PARK_BENCH=Object.freeze(parkBench());
