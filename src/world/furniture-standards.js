// Furniture elevations are measured from the local floor; mounted props share the same surface.
// The low service counter leaves the shortest adult cast visible without changing their height.
export const FURNITURE_HEIGHTS=Object.freeze({seat:.46,table:.72,lowTable:.36,serviceCounter:.78,till:.26});
export const TILL_TOP=FURNITURE_HEIGHTS.serviceCounter+FURNITURE_HEIGHTS.till;

/** Move a named authored furniture body from its floor and carry its mounted props. */
export function setFurnitureSurface(root,{from,to,bodies,props,floor=0}){
 const ratio=(to-floor)/(from-floor),delta=to-from;
 root.traverse(object=>{
  if(!object.isMesh)return;
  if(bodies?.test(object.name)){object.position.y=floor+(object.position.y-floor)*ratio;object.scale.y*=ratio;}
  else if(props?.test(object.name))object.position.y+=delta;
 });
}
