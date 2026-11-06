import {EAST_ROW} from './okinawa/layout.js';
const plot=EAST_ROW.plots.find(p=>p.id==='nakamura');
export const NAKAMURA_PLAN=Object.freeze({w:plot.maxZ-plot.minZ-.1,d:EAST_ROW.maxX-EAST_ROW.minX,x:(EAST_ROW.minX+EAST_ROW.maxX)/2,z:(plot.minZ+plot.maxZ)/2,floor:.08,upper:3.3,stairX:1.65,stairStart:3.25,stairLength:5.2,stairWidth:1.1});
export const nakamuraPoint=(x,y,z)=>[NAKAMURA_PLAN.x-z,y,NAKAMURA_PLAN.z+x];
export const NAKAMURA_HOME_DOOR=Object.freeze(nakamuraPoint(1.65,.08,4.15));
// Explicit measured indoor route, never a 2D shortest path through the counter.
export const NAKAMURA_GO_HOME=Object.freeze([
 nakamuraPoint(.65,.08,2.05),nakamuraPoint(.65,.08,4.15),
 NAKAMURA_HOME_DOOR,nakamuraPoint(1.65,.08,3.25),
 ...Array.from({length:18},(_,i)=>nakamuraPoint(1.65,.08+(i+1)*3.22/18,3.25-(i+.5)*5.2/18)),
 nakamuraPoint(1.65,3.3,-2.45)
].map(Object.freeze));
