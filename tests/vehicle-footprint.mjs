import * as THREE from '../vendor/three.module.js';
import {buildVehicle} from '../src/world/road-vehicles.js';

// Use the envelope of the rendered body, lamps and wheels, including their offsets.
export function renderedVehicleFootprint(kind='car'){
 const g=buildVehicle(kind,0xffffff),b=new THREE.Box3().setFromObject(g),size=b.getSize(new THREE.Vector3()),centre=b.getCenter(new THREE.Vector3());
 return {width:size.x,length:size.z,x:centre.x,z:centre.z};
}
export function vehicleHitsRect(x,z,hx,hz,body,c){
 const lateral=[hz,-hx],forward=[hx,hz],co=Math.cos(c.yaw||0),si=Math.sin(c.yaw||0),width=[co,-si],depth=[si,co];
 x+=lateral[0]*body.x+forward[0]*body.z;z+=lateral[1]*body.x+forward[1]*body.z;
 const dot=(a,b)=>a[0]*b[0]+a[1]*b[1];
 return [lateral,forward,width,depth].every(axis=>{
  const car=body.width/2*Math.abs(dot(axis,lateral))+body.length/2*Math.abs(dot(axis,forward));
  const solid=c.w/2*Math.abs(dot(axis,width))+c.d/2*Math.abs(dot(axis,depth));
  return Math.abs((c.x-x)*axis[0]+(c.z-z)*axis[1])<car+solid-1e-5;
 });
}
