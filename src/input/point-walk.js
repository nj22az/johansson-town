import {createNavigation} from '../people/navmesh.js';
/**
 * Route planning uses the same clearance and floor heights as ordinary walking.
 * `step` is the planning grid: 0.35 m in the town; a room passes a finer one (game.js), because a doorway leaves the
 * player's centre a corridor narrower than 0.35 m and a coarse grid has no point in it. Sakura's office door, with its
 * leaf standing open beside the opening, leaves 0.25 m: tapping the office from the hall said "There is no clear path
 * from here" (the owner, on his iPhone, 20 October 2026: "I can't seem to get into the office in the Sakura").
 */
export const ROOM_STEP=.15;
export function createPointWalk({blocked,heightAt,radius=.28,step=()=>.35}){
 let points=[],destination=null,arrival=null,context=null,stalled=0,last=null;
 function cancel(){points=[];destination=null;arrival=null;last=null;stalled=0;}
 function walk(from,to,{space=null,onArrival=null}={}){
  cancel();if(Math.hypot(to.x-from.x,to.z-from.z)>60)return false;
  const bounds={minX:Math.min(from.x,to.x)-12,maxX:Math.max(from.x,to.x)+12,minZ:Math.min(from.z,to.z)-12,maxZ:Math.max(from.z,to.z)+12};
  const nav=createNavigation(blocked,{step:typeof step==='function'?step(space):step,bounds,heightAt,radius});points=nav.path(from,to);
  if(!points.length)return false;destination={...to};arrival=onArrival;context=space;return true;
 }
 function direction(position,dt,space){
  if(space!==context){cancel();return null;}
  if(!points.length)return null;
  if(last&&Math.hypot(position.x-last.x,position.z-last.z)<.001)stalled+=dt;else stalled=0;
  last={x:position.x,z:position.z};if(stalled>1.2){cancel();return null;}
  while(points.length&&Math.hypot(points[0][0]-position.x,points[0][1]-position.z)<.12)points.shift();
  if(!points.length){const fn=arrival;cancel();fn?.();return null;}
  const dx=points[0][0]-position.x,dz=points[0][1]-position.z,d=Math.hypot(dx,dz);
  return {x:dx/d,z:dz/d,strength:Math.min(1,d/Math.max(.01,3*dt))};
 }
 return {walk,direction,cancel,get active(){return !!points.length;},get destination(){return destination;}};
}
