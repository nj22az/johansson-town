// Scene coordinates are metres on the town's X/Z ground plane.
// A collider is a circle {x,z,r} or a box {x,z,w,d,yaw?} (yaw as three.js rotation.y, as World's circleHitsRect in
// johansson-town/physics.js; copied, since importing that file would load a second copy of layout.js into Studio).
export function hitsSolid(x,z,r,solids,floor=0){
 return solids.some(c=>{
  if(c.height!=null&&c.height<=floor+.12)return false;
  if(c.minY!=null&&c.minY>floor+1.8)return false;
  if(c.r!=null)return Math.hypot(x-c.x,z-c.z)<r+c.r;
  let dx=x-c.x,dz=z-c.z;
  if(c.yaw){const co=Math.cos(c.yaw),si=Math.sin(c.yaw),u=co*dx-si*dz;dz=si*dx+co*dz;dx=u;}
  const ex=Math.max(Math.abs(dx)-(c.w||0)/2,0),ez=Math.max(Math.abs(dz)-(c.d||0)/2,0);
  return ex*ex+ez*ez<r*r;
 });
}
/** Walk in a straight line, sampled every 8 cm so a thin wall is never crossed; stops at the last free sample. */
export function walkTo(start,target,blocked){
 const distance=Math.hypot(target.x-start.x,target.z-start.z),steps=Math.max(1,Math.ceil(distance/.08));
 let result={...start};
 for(let i=1;i<=steps;i++){
  const next={x:start.x+(target.x-start.x)*i/steps,z:start.z+(target.z-start.z)*i/steps};
  if(blocked(next.x,next.z))break;result=next;
 }
 return result;
}
/**
 * Walk, and where something stops the walk, slide along it: from where it stopped, try what is left of the x part alone
 * and of the z part alone, and keep whichever ends nearer the target.
 */
export function slideTo(start,target,blocked){
 const first=walkTo(start,target,blocked);let best=first,distance=Math.hypot(target.x-first.x,target.z-first.z);
 if(distance<1e-6)return first;
 for(const p of [walkTo(first,{x:target.x,z:first.z},blocked),walkTo(first,{x:first.x,z:target.z},blocked)]){
  const d=Math.hypot(target.x-p.x,target.z-p.z);if(d<distance-1e-9){distance=d;best=p;}
 }
 return best;
}
