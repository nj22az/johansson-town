// Metres, shared by shop construction, the clerk schedule and clearance checks.
export const STORE_CLERK_POSITION=Object.freeze([1.6,0,-1.6]);
export const STORE_SEATS=Object.freeze([
 {id:'window-player',table:0,position:[3.8,0,4.3],stand:[2.8,0,4.3],yaw:0,height:.51,surfaceY:.51,eyeY:1.2},
 // Leave room to plant both feet in front before lowering into this chair.
 {id:'window-yuri',table:0,position:[3.8,0,1.95],stand:[2.8,0,2.43],yaw:Math.PI,height:.51,surfaceY:.51,eyeY:1.2,depth:.50},
 {id:'guest-north',table:1,position:[-4.6,0,3.35],stand:[-3.6,0,3.35],yaw:Math.PI,height:.51,surfaceY:.51,eyeY:1.2},
 {id:'guest-south',table:1,position:[-4.6,0,5.35],stand:[-3.6,0,5.35],yaw:0,height:.51,surfaceY:.51,eyeY:1.2},
].map(Object.freeze));