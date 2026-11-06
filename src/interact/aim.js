// Shelf rows must follow the camera aim, including looking up/down.
export function shelfAimScore(origin,direction,target){
 const dx=target.x-origin.x,dy=target.y-origin.y,dz=target.z-origin.z,d=Math.hypot(dx,dy,dz);
 if(d>.001&&d<=3.1){const cosine=(dx*direction.x+dy*direction.y+dz*direction.z)/d;if(cosine>=.98)return d*.05+(1-cosine)*10;}
 return Infinity;
}
