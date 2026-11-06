import * as THREE from '../../vendor/three.module.js';
import {createWalkingRoute} from '../navigation/walking-route.js';
import {routeAt,groundHeight} from '../world/layout.js';
import {standingHitsRect} from '../../physics.js';

/**
 * Walking a real body over the real shore: the town's ground (world/layout.js routeAt, groundHeight) and its colliders,
 * a route found incrementally (navigation/walking-route.js) and walked a bounded step at a time, the feet on the
 * authored ground. Shared by the ferry's shore line hands (ferry-shore-crew.js) and the master's walk between his shed
 * and the gangway (master-commute.js), so there is one way to walk a quay, not two.
 *
 * A walk is a plain record on the body's behalf: {g, route, index, search, blocked, goal, state}. `exempt(collider)`
 * names a collider the body may cross (a seated person's own chair, crossed only by his getting up and sitting down).
 */
export const SHORE_RADIUS=.18,SHORE_SPEED=1.15;
const vec=new THREE.Vector3();
export const worldPoint=g=>g.getWorldPosition(new THREE.Vector3()).toArray();
export const setWorldPoint=(g,p)=>{g.parent.updateWorldMatrix(true,false);g.position.copy(g.parent.worldToLocal(vec.set(...p)));};
export const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);

export function createShoreWalker(shoreColliders=[]){
 const bins=new Map();let indexed=-1;
 function nearby(x,z){
  if(indexed!==shoreColliders.length){
   bins.clear();indexed=shoreColliders.length;
   for(const c of shoreColliders){
    if(c.moving||![c.x,c.z,c.w,c.d].every(Number.isFinite))continue;
    const reach=Math.hypot(c.w,c.d)/2+SHORE_RADIUS;
    for(let i=Math.floor((c.x-reach)/4);i<=Math.floor((c.x+reach)/4);i++)for(let j=Math.floor((c.z-reach)/4);j<=Math.floor((c.z+reach)/4);j++){
     const key=i+','+j;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(c);
    }
   }
  }
  return [...(bins.get(Math.floor(x/4)+','+Math.floor(z/4))||[]),...shoreColliders.filter(c=>c.moving)];
 }
 function sample(x,z,exempt){
  const y=groundHeight(x,z),ground=routeAt(x,z,SHORE_RADIUS);
  const blocked=!ground||nearby(x,z).some(c=>{
   if(c.disabled||c.walk===false||c.walkSolid===false)return false;
   if(exempt?.(c))return false;
   return standingHitsRect(x,z,SHORE_RADIUS,y,c);
  });
  return {y,blocked};
 }
 /** Start a walk to `target` (a world point); `margin` widens the search area round the two points. */
 function plan(b,target,{margin=5,exempt=null}={}){
  const p=worldPoint(b.g);b.goal=[...target];b.route=[];b.index=0;b.blocked=null;b.exempt=exempt;
  if(distance(p,target)<.08){b.search=null;b.state='at station';return;}
  b.state='finding a walking route';
  b.search=createWalkingRoute({start:{x:p[0],z:p[2]},goal:{x:target[0],z:target[2]},cell:.35,maxVisited:50000,margin,sample:(x,z)=>sample(x,z,exempt)});
 }
 /** Advance the walk by `dt` seconds. Returns true once the body stands at its goal. */
 function step(b,dt){
  if(b.search){
   b.search.step(1000);
   if(b.search.status==='found'){
    if(b.search.reason!=='goal-reached'){b.blocked='The destination is obstructed';b.state='blocked';}
    else{b.route=b.search.path.map(p=>[p.x,p.y,p.z]);b.index=1;b.state='walking';}
    b.search=null;
   }else if(b.search.status==='unreachable'){b.blocked=b.search.reason;b.search=null;b.state='blocked';}
  }
  let remaining=Math.min(Math.max(dt,0),.5)*SHORE_SPEED;
  while(!b.blocked&&b.index<b.route.length&&remaining>0){
   const p=worldPoint(b.g),to=b.route[b.index],d=distance(p,to),stride=Math.min(d,remaining),t=d>1e-6?stride/d:1;
   const next=p.map((v,i)=>v+(to[i]-v)*t),s=sample(next[0],next[2],b.exempt);
   if(s.blocked||Math.abs(s.y-p[1])>.24){b.blocked='The walking route is obstructed';b.state='blocked';break;}
   next[1]=s.y;setWorldPoint(b.g,next);if(d>.002)b.g.rotation.y=Math.atan2(to[0]-p[0],to[2]-p[2])+Math.PI;
   remaining-=stride;if(d<=stride+.002)b.index++;else break;
  }
  return arrived(b);
 }
 const arrived=b=>!b.search&&!b.blocked&&b.index>=b.route.length&&!!b.goal&&distance(worldPoint(b.g),b.goal)<.18;
 return {plan,step,arrived,sample};
}
