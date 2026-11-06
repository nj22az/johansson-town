// Maps a lot-local point onto the town, given the lot's centre, yaw and scale.
export function localToWorld(x,z,yaw,scale,lx,lz){
 const sx=scale.x??scale,sz=scale.z??scale,c=Math.cos(yaw),s=Math.sin(yaw);
 return [x+lx*sx*c+lz*sz*s,z-lx*sx*s+lz*sz*c];
}
