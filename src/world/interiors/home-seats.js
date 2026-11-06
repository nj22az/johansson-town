import * as THREE from '../../../vendor/three.module.js';

/** The physical household seats are usable by visitors as well as their owners. */
export function registerHomeSeats({parent,reg,action,layouts={},extra=[]}){
 const seen=new Set();
 const seats=[...Object.entries(layouts).map(([name,layout])=>({
  label:'Sit at '+name+'’s table',position:layout.table,stand:layout.tableStand||layout.table,
  surfaceY:(layout.tableSeatHeight??.41)+(layout.table?.[1]||0),yaw:layout.tableSeatYaw??0,front:layout.tableSeatFront,
 })),...extra];
 for(const seat of seats){
  if(!seat.position)continue;
  const key=seat.position.join('/');if(seen.has(key))continue;seen.add(key);
  const marker=new THREE.Object3D();marker.position.set(seat.stand[0],seat.stand[1]+.85,seat.stand[2]);
  marker.userData.npcInteraction=false;
  marker.userData.seat={...seat,id:'home-seat:'+key,eyeY:seat.surfaceY+.75,pitch:0};parent.add(marker);
  reg(marker,seat.label,()=>action('seat',seat.label.replace(/^Sit at /,''),'A place at the household table.'),true);
 }
 return seats;
}
