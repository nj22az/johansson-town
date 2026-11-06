import {routeAt} from './src/world/layout.js?snappy=1';
// Deterministic 2D collision helpers used by Johansson Town.
// Kept independent of Three.js so the core movement rules can be regression-tested.
export function circleHitsRect(x,z,r,c){
  let dx=x-c.x,dz=z-c.z;if(c.yaw){const co=Math.cos(c.yaw),si=Math.sin(c.yaw),u=co*dx-si*dz;dz=si*dx+co*dz;dx=u;}
  const ax=Math.abs(dx),az=Math.abs(dz),halfW=c.w/2,halfD=c.d/2;
  // A point inside the rectangle still hits when its radius is zero. Outside it,
  // measure to the closest point: adding r to both axes made corners square walls.
  if(ax<halfW&&az<halfD)return true;
  const gapX=Math.max(ax-halfW,0),gapZ=Math.max(az-halfD,0);
  return gapX*gapX+gapZ*gapZ<r*r;
}

export function circleHitsCircle(ax,az,ar,bx,bz,br){
  const dx=ax-bx,dz=az-bz,rr=ar+br;
  return dx*dx+dz*dz<rr*rr;
}

export function roomBoundsBlocked(x,z,r=0){
  return x<-5.6+r||x>5.6-r||z<-5.5+r||z>5.7-r;
}

// Town envelope follows the actual playable ground instead of a single rectangle:
// narrow shopping street -> broad harbour apron -> central working pier.
export function townBoundsBlocked(x,z,r=0){
  // No legacy rectangle may admit water beyond the relocated quay or streets.
  return !routeAt(x,z,r);
}

// Sweep from start to end and return the last safe interpolation fraction.
// This prevents a swept observer or object from tunnelling through thin props/walls.
export function sweepFraction(start,end,isBlocked,step=.14){
  const dx=end.x-start.x,dz=end.z-start.z,dist=Math.hypot(dx,dz);
  const count=Math.max(1,Math.ceil(dist/Math.max(.04,step)));
  let safe=0;
  for(let i=1;i<=count;i++){
    const t=i/count,x=start.x+dx*t,z=start.z+dz*t;
    const y=Number.isFinite(start.y)&&Number.isFinite(end.y)?start.y+(end.y-start.y)*t:undefined;
    if(isBlocked(x,z,y))break;
    safe=t;
  }
  return safe;
}

/** Vertical overlap for a standing person; raised floors do not erase walls above them. */
export function standingHitsRect(x,z,r,y,c,height=1.82){
 const bottom=c.minY||0,top=Number.isFinite(c.height)?bottom+c.height:Infinity;
 return bottom<y+height&&top>y+.03&&circleHitsRect(x,z,r,c);
}
export function canStepBetween(from,to){return Math.abs(to-from)<=.24;}
