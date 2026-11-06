import {alignedStep,forwardOnly,travelError,travelYaw} from './facing.js';
import {createNavigation,NAV_MARGIN} from './navmesh.js?snappy=1';

// Routes share the player's furniture collision geometry. No timeout teleports.
export function createRoomWalk(blocked=()=>false,{bounds={minX:-8,maxX:8,minZ:-8,maxZ:8},smoothTurn=false,radius=.3,height=0}={}){
 const collision=blocked;blocked=(x,z,r)=>collision(x,z,r,height);
 const nav=createNavigation(blocked,{step:.2,heightAt:()=>0,bounds,radius:Math.max(radius,NAV_MARGIN)}),routes=new Map();
 return {move(person,target,dt){
  const g=person.g,tag=target.join(','),smooth=smoothTurn||person.profile?.name==='Thuan'||g.userData.name==='Thuan';
  if(Math.hypot(g.position.x-target[0],g.position.z-target[2])<.12)return true;
  let route=routes.get(person);
  if(!route||route.tag!==tag){
   let points=nav.path(g.position,{x:target[0],z:target[2]});
   if(smooth){const simplified=[];let from=[g.position.x,g.position.z],at=0;const clear=(a,b)=>{const n=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/.1);for(let i=1;i<=n;i++)if(blocked(a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n,radius+.02))return false;return true;};while(at<points.length){let end=at;for(let i=at+1;i<points.length&&clear(from,points[i]);i++)end=i;from=points[end];simplified.push(from);at=end+1;}points=simplified;}
   route={tag,points,speed:0};routes.set(person,route);
  }
  while(route.points.length&&Math.hypot(g.position.x-route.points[0][0],g.position.z-route.points[0][1])<(smooth?.005:.04))route.points.shift();
  const next=route.points[0];if(!next)return false;
  const dx=next[0]-g.position.x,dz=next[1]-g.position.z,d=Math.hypot(dx,dz);let speed=person.profile.age>65?.7:1;
  if(smooth){const angle=travelError(g.rotation.y,dx,dz);g.rotation.y+=Math.max(-dt*2.6,Math.min(dt*2.6,angle));const aligned=forwardOnly(g.rotation.y,dx,dz),desired=aligned?Math.min(.9,Math.sqrt(2*1.8*d)):0;route.speed+=Math.max(-dt*2.4,Math.min(dt*1.8,desired-route.speed));if(!aligned)return false;speed=route.speed;}
  let step=Math.min(d,dt*speed);
  if(!smooth){
   // Match outdoor schedules faceStep: no translate until roughly aligned, then
   // scale residual step with alignedStep (Konbini door / aisle corners).
   const yaw=travelYaw(dx,dz),angle=travelError(g.rotation.y,dx,dz);
   g.rotation.y+=Math.max(-dt*3.4,Math.min(dt*3.4,angle));
   if(!forwardOnly(g.rotation.y,dx,dz))return false;
   step*=alignedStep(travelError(g.rotation.y,dx,dz));
  }
  if(step<=0)return false;
  const x=g.position.x+dx/d*step,z=g.position.z+dz/d*step;
  if(!blocked(x,z,radius)){g.position.set(x,target[1],z);route.stuck=0;}
  // The smoothed route checks its shortcuts every ten centimetres, and a corner can fall
  // between two checks: the step into it is refused and, with nothing to change the
  // route, a walker would stand at that corner for good. Blocked for a moment, fall back
  // to the planner's own route, which keeps its margin round every corner.
  else if((route.stuck=(route.stuck||0)+dt)>.4&&!route.raw){route.points=nav.path(g.position,{x:target[0],z:target[2]});route.raw=true;route.stuck=0;}
  return false;
 },forget(person){routes.delete(person);},clear(){routes.clear();nav.clearCache();}};
}

export function atDestination(person,place,target,radius=.85){
 const g=person.g;
 if(g.userData.inHome||g.userData.inMarket||g.userData.inRamen||g.userData.inIzakaya||g.userData.inOnsen||g.userData.inWorkplace)return false;
 return g.userData.indoors===place||!g.userData.indoors&&Math.hypot(g.position.x-target[0],g.position.z-target[1])<radius;
}
