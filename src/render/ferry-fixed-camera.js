import * as THREE from '../../vendor/three.module.js';
import {ferryShotAt,FERRY_H1_SHOTS,h1ToLocal} from '../world/ferry-engine-room-plan.js';

/** Fixed ship-local shots; movement keeps its world heading until input is released. */
export function createFerryFixedCamera(camera){
 const local=new THREE.Vector3(),pos=new THREE.Vector3(),at=new THREE.Vector3();
 let shot=null,ship=null,saved=null,overridden=false,heldHeading=null,manual=null,floor=null;
 function restore(){if(saved){camera.fov=saved.fov;camera.zoom=saved.zoom;camera.updateProjectionMatrix();}saved=null;shot=null;manual=null;heldHeading=null;floor=null;}
 return {
  sync({ship:nextShip,position,deck,override=false}){
   ship=nextShip;const nextFloor=deck?.floor?.id;
   if(!ship||!nextFloor){restore();return false;}
   local.copy(position);ship.worldToLocal(local);
   const selected=ferryShotAt(nextFloor,local.toArray(),shot?.id);
   if(!selected){restore();return false;}
   if(!saved)saved={fov:camera.fov,zoom:camera.zoom};
   if(floor!==nextFloor)manual=null;
   floor=nextFloor;shot=manual||selected;overridden=override;
   return !override;
  },
  apply(){
   if(!shot||overridden)return false;
   ship.updateWorldMatrix(true,false);
   pos.set(...h1ToLocal(shot.pos));at.set(...h1ToLocal(shot.at));ship.localToWorld(pos);ship.localToWorld(at);
   camera.position.copy(pos);camera.lookAt(at);
   const fov=Math.min(84,shot.fov+(camera.aspect<1?13:0));
   if(camera.fov!==fov||camera.zoom!==1){camera.fov=fov;camera.zoom=1;camera.updateProjectionMatrix();}
   camera.updateMatrixWorld();return true;
  },
  heading(moving){
   if(!shot)return null;
   pos.set(...h1ToLocal(shot.pos));at.set(...h1ToLocal(shot.at));ship.localToWorld(pos);ship.localToWorld(at);
   const yaw=Math.atan2(pos.x-at.x,pos.z-at.z);
   if(!moving){heldHeading=null;return yaw;}
   return heldHeading??=yaw;
  },
  cycle(){
   if(!shot||overridden)return null;
   const choices=FERRY_H1_SHOTS.filter(s=>s.floor===floor);
   manual=choices[(choices.indexOf(shot)+1)%choices.length];shot=manual;return shot.label;
  },
  get active(){return !!shot&&!overridden;},
  get id(){return shot?.id??null;},
  dispose:restore,
 };
}
