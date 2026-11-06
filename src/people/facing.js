import * as THREE from '../../vendor/three.module.js';

/**
 * Turning to face whoever is talking to you.
 *
 * A person who is free stops what they are doing and turns round. A person in the
 * middle of something does not: they carry on and turn their head, the way you would
 * if someone spoke to you while you were counting stock. The head turn already
 * existed for customers inside the shop (see shop-attention.js); this decides who is
 * being addressed, whether they can spare the whole body for it, and points the head
 * gaze at the right person wherever they are.
 */

/** Poses a person will not abandon mid-way. They answer over their shoulder. */
export const OCCUPIED_POSES=Object.freeze([
 'Sit','Type','Eat','Drink','Wake','Sleep','Fish','Use','Read','Phone','CounterIdle'
]);

/**
 * @param {object} data the person's userData
 * @param {boolean} moving whether they are walking
 */
export function occupied(data={},moving=false){
 if(moving)return true;
 if(data.carrying||data.restocking||data.shopReach||data.sleeping||data.roomTransition)return true;
 if(data.usingTownObject)return true;
 return OCCUPIED_POSES.includes(data.socialPose);
}

/** The yaw that puts `from` face-on to `to`, in the convention the town walks in. */
export const faceYaw=(from,to)=>Math.atan2(from.x-to.x,from.z-to.z);

/** One damped step of a turn, taking the short way round. */
export function turnToward(current,target,dt,rate=6){
 const delta=Math.atan2(Math.sin(target-current),Math.cos(target-current));
 return current+delta*(1-Math.exp(-Math.max(0,dt)*rate));
}

/**
 * How much of a step to take when you are not yet facing where you are going.
 *
 * Full pace facing forward, nothing at all facing backward, and the cosine in
 * between. Walking at full speed toward a place you have not turned to face yet is
 * what reads as walking backwards: the legs play forward while the body travels the
 * other way. Turning is never blocked by this, so nobody can get stuck.
 *
 * @param {number} angle radians between facing and heading
 */
export const alignedStep=angle=>Math.max(0,Math.cos(Math.min(Math.abs(angle),Math.PI)));

// Thuan may only translate once her body is effectively pointing along the step.
// Eight hundredths of a radian is under five degrees: visually forward, not a
// sideways shuffle disguised by a slowed walk cycle.
export const FORWARD_ONLY_ANGLE=.08;
export const travelYaw=(dx,dz)=>Math.atan2(-dx,-dz);
export function travelError(yaw,dx,dz){
 const target=travelYaw(dx,dz);
 return Math.atan2(Math.sin(target-yaw),Math.cos(target-yaw));
}
export const forwardOnly=(yaw,dx,dz)=>Math.abs(travelError(yaw,dx,dz))<=FORWARD_ONLY_ANGLE;

/** How far off a person's own facing a point is, in radians. */
export function offBy(entity,point){
 const want=faceYaw(entity.position,point);
 return Math.abs(Math.atan2(Math.sin(want-entity.rotation.y),Math.cos(want-entity.rotation.y)));
}

/**
 * @param {object} options
 * @param {{people:Array}} options.world
 * @param {() => THREE.Vector3} options.getPlayerPosition
 * @param {() => number} [options.getPlayerEyeHeight]
 * @param {number} [options.range] how close you have to be before someone notices you
 * @param {number} [options.turnRate]
 */
export function createFacing({world,getPlayerPosition,getPlayerEyeHeight=()=>1.66,range=2.6,turnRate=6}){
 const point=new THREE.Vector3();
 const stats={addressed:0,turning:0};
 return {stats,update(dt){
  const player=getPlayerPosition();
  if(!player)return stats;
  stats.addressed=0;stats.turning=0;
  for(const person of world.people||[]){
   const entity=person?.g;if(!entity)continue;
   const data=entity.userData;
   const talking=data.playerConversation===true;
   // In a conversation of their own they look at each other (neighbour-chats.js), not at you.
   if(!talking&&(data.chat||data.playing)){if(data.facingPlayer)delete data.facingPlayer;continue;}
   const near=Math.hypot(entity.position.x-player.x,entity.position.z-player.z)<=range;
   // Standing next to someone is not the same as talking to them, so proximity only
   // earns a look when they have nothing else on.
   const busy=occupied(data,!!data.walking||!!data.character?.moving);
   if(!talking&&!(near&&!busy)){
    if(data.facingPlayer){delete data.facingPlayer;if(data.lookSource==='facing')delete data.lookTarget;}
    continue;
   }
   stats.addressed++;
   point.set(player.x,player.y+getPlayerEyeHeight(),player.z);
   // The head gaze reads this wherever the person is; it used to be set only by the
   // shop's own attention pass, which is why people outside stared straight ahead.
   data.lookTarget=point.toArray();data.lookSource='facing';
   data.facingPlayer=true;
   if(busy||!talking)continue;
   entity.rotation.y=turnToward(entity.rotation.y,faceYaw(entity.position,player),dt,turnRate);
   stats.turning++;
  }
  // Street neighbours you are talking to turn and look at you as well.
  for(const entity of world.neighbours||[]){
   const data=entity?.userData;if(!data?.playerConversation)continue;
   point.set(player.x,player.y+getPlayerEyeHeight(),player.z);
   data.lookTarget=point.toArray();data.lookSource='facing';stats.addressed++;
   if(occupied(data,!!data.walking||!!data.character?.moving))continue;
   entity.rotation.y=turnToward(entity.rotation.y,faceYaw(entity.position,player),dt,turnRate);stats.turning++;
  }
  return stats;
 }};
}
