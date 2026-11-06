import * as THREE from '../../vendor/three.module.js';
import {BUDGET} from '../edition.js';
/**
 * Who the town simulates in full this frame (edition.js). On Linux, everybody, always. On the web, a resident is
 * attended while within the budget's radius of the player (or of the door of the room he is in: `inside`), or anywhere the
 * camera can see them: there they walk their routes, step round each other and use the town exactly as on Linux.
 * Out of sight and out of reach they keep their timetable without walking it (people/schedules.js, neighbours.js):
 * no route searches, no steps, simply where their day has them, so nobody is ever seen to jump.
 *
 * Nothing here allocates per call; the frustum is taken once a frame (update).
 */
export function createAttention({camera,getObserver,budget=BUDGET}){
 const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4(),sphere=new THREE.Sphere(new THREE.Vector3(),2.2),world=new THREE.Vector3();
 let observer=null,ready=false;const r2=(budget.residentRadius||0)**2;
 return {
  get everywhere(){return !!budget.residentsEverywhere;},
  /** Once a frame, before the town is advanced. */
  update(){
   if(budget.residentsEverywhere)return;
   observer=getObserver?.()||null;
   if(camera){camera.updateMatrixWorld();matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);ready=true;}
  },
  /** Whether this body (a resident's group) is simulated in full now. */
  attends(g){
   if(budget.residentsEverywhere||!g)return true;
   const p=g.parent?g.getWorldPosition(world):g.position;
   if(!observer||!ready)return true;
   const dx=p.x-observer.x,dz=p.z-observer.z;if(dx*dx+dz*dz<r2)return true;
   // Indoors the lens is in the room: the street is reached by distance from its door alone.
   if(observer.inside)return false;
   sphere.center.set(p.x,p.y+.9,p.z);return frustum.intersectsSphere(sphere);
  },
 };
}
