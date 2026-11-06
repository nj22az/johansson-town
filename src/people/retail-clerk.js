import * as THREE from '../../vendor/three.module.js';
import {createRoomWalk} from './room-walk.js';
import {createShopProduct} from '../commerce/shop-product.js';
import {standNow} from './stand-points.js';
/**
 * The till pocket: behind the counter, between the approach a clerk-sized walker is routed to and the clerk's stand
 * point 0.75 m behind the counter's front (sakura-queue.js). Nobody else is ever in it.
 */
export function inTillPocket(g,layout){
 const till=layout.staff,approach=layout.staffApproach;
 if(!approach||!till)return false;
 return g.position.x<approach[0]-.02&&g.position.x>till[0]-.05&&Math.abs(g.position.z-till[2])<.2;
}
/**
 * A straight step at a walker's pace, turning first to face the way it goes (never a slide or a moonwalk): into the till
 * pocket and out of it, where the routed walk with its clearance circle cannot go. True on arrival.
 */
export function tillStep(g,to,dt,speed=.6){
 const dx=to[0]-g.position.x,dz=to[2]-g.position.z,d=Math.hypot(dx,dz);
 if(d<.01){g.position.x=to[0];g.position.z=to[2];return true;}
 const want=Math.atan2(-dx,-dz),a=Math.atan2(Math.sin(want-g.rotation.y),Math.cos(want-g.rotation.y));
 g.rotation.y+=THREE.MathUtils.clamp(a,-dt*2.6,dt*2.6);if(Math.abs(a)>.05)return false;
 const step=Math.min(d,dt*speed);g.position.x+=dx/d*step;g.position.z+=dz/d*step;
 return d-step<.01;
}
export function createRetailClerk({person,room,layout,collides,getWork,completeWork,cancelWork,accessShelf=()=>{},isBlocked=()=>false,isOccupied=(x,z)=>isBlocked(x,z),getMinutes=()=>null}){
 const clerk=person.g,walker=createRoomWalk((x,z,r)=>collides(x,z,r)||isOccupied(x,z,r,person),{bounds:layout.bounds,smoothTurn:true,radius:layout.clearance??.3}),box=createShopProduct('stock');box.visible=false;room.add(box);
 let phase='counter',job=null,timer=0,cartonStops=0,stalled=0;
 const turn=(yaw,dt)=>{const a=Math.atan2(Math.sin(yaw-clerk.rotation.y),Math.cos(yaw-clerk.rotation.y));clerk.rotation.y+=THREE.MathUtils.clamp(a,-dt*2.6,dt*2.6);return Math.abs(a)<.025;};
 // Rebuild after an obstruction, with enough time for a complete smooth turn.
 const routed=(point,dt)=>{const before=clerk.position.clone(),arrived=walker.move(person,point,dt);if(!arrived&&clerk.position.distanceTo(before)<.0001){stalled+=dt;if(stalled>=2){walker.clear();stalled=0;}}else stalled=0;return arrived;};
 // To the till: routed to the approach, then the step forward into the pocket. From the till to anywhere else: the
 // step back out first (turned round to face it), then routed.
 const till=layout.staff,approach=layout.staffApproach;
 const walk=(point,dt)=>{
  if(!approach)return routed(point,dt);
  const toTill=Math.hypot(point[0]-till[0],point[2]-till[2])<.01;
  if(inTillPocket(clerk,layout)){
   if(toTill)return tillStep(clerk,till,dt);
   if(!tillStep(clerk,approach,dt))return false;
  }
  if(toTill){
   if(Math.hypot(clerk.position.x-till[0],clerk.position.z-till[2])<.01)return true;
   if(!routed(approach,dt))return false;
   return tillStep(clerk,till,dt);
  }
  return routed(point,dt);
 };
 /** Between jobs, the clerk's stand points (stand-sequences.js sakura-floor): the till, the cooler, the window. */
 const standing=()=>{const minutes=getMinutes();return Number.isFinite(minutes)?standNow(person.profile.name,minutes,'sakura','sakura-floor'):null;};
 const isStockJob=value=>value?.type==='restock'||value?.type==='restock-prep';
 const clearHandling=()=>{delete clerk.userData.shopReach;delete clerk.userData.heldItem;delete clerk.userData.shopGoods;delete clerk.userData.restocking;delete clerk.userData.tool;};
 const clerkTarget=point=>{if(!point)return null;const target=new THREE.Vector3(...point);room.updateWorldMatrix(true,false);clerk.updateWorldMatrix(true,false);room.localToWorld(target);clerk.worldToLocal(target);return target.toArray();};
 const beginPlacement=()=>{box.visible=false;delete clerk.userData.carriedTray;clerk.userData.carrying=false;clerk.userData.heldItem='shop-'+job.item;clerk.userData.shopGoods=true;const target=clerkTarget(job.reach||job.target);if(target)clerk.userData.shopReach=target;accessShelf(job.item);};
 const finish=()=>{const restocked=job?.type==='restock',stockJob=isStockJob(job);if(job&&(restocked||job.type==='checkout'))completeWork(job);job=null;clearHandling();box.visible=stockJob&&--cartonStops>0;phase=stockJob?'stock-next':'return';};
 return {get phase(){return phase;},get order(){return null;},cancel(){},occupied(){return false;},prepareToLeave(){if(phase==='counter'&&!inTillPocket(clerk,layout)){delete clerk.userData.tool;return true;}if(phase==='counter'){phase='step-out';return false;}if(phase==='step-out')return false;if(job){cancelWork(job);job=null;}box.visible=false;delete clerk.userData.carriedTray;clearHandling();phase='return';return false;},
  update(dt){
   if(!clerk.userData.inMarket||clerk.userData.roomTransition)return;
   delete clerk.userData.socialPose;delete clerk.userData.seatHeight;delete clerk.userData.chairBlend;clerk.userData.floorHeight=0;clerk.userData.serving=phase!=='counter';clerk.userData.carrying=box.visible;
   if(job?.type==='checkout'&&job.record.finished){cancelWork(job);job=null;clearHandling();phase='return';}
   clerk.userData.restocking=phase.startsWith('stock')||isStockJob(job);
   if(phase==='step-out'){if(tillStep(clerk,approach,dt))phase='counter';}
   else if(phase==='counter'){
    if((job=getWork())){delete clerk.userData.tool;phase=job.type==='restock'?'stock-fetch':job.type==='restock-prep'?'stock-prep-fetch':'checkout';clerk.userData.serving=true;}
    else{
     const stand=standing(),point=stand?[stand.point.x,0,stand.point.z]:layout.staff,yaw=stand?stand.yaw:layout.staffYaw;
     if(walk(point,dt)&&turn(yaw,dt)){
      clerk.userData.socialPose=stand?.point.pose||'CounterIdle';
      if(stand?.point.tool)clerk.userData.tool=stand.point.tool;else delete clerk.userData.tool;
      if(stand)clerk.userData.activity=stand.point.activity;
     }else delete clerk.userData.tool;
    }
   }else if(phase==='stock-next'){
    clerk.userData.activity='continuing the closing stock check';
    if((job=getWork()))phase=job.type==='restock'?(box.visible?'stock-carry':'stock-fetch'):job.type==='restock-prep'?(box.visible?'stock-prep-carry':'stock-prep-fetch'):'checkout';
    else{box.visible=false;phase='return';}
   }else if(phase==='return'){if(walk(layout.staff,dt)&&turn(layout.staffYaw,dt))phase='counter';}
   else if(phase==='checkout'){clerk.userData.activity='serving a customer at the till';if(walk(job.position,dt)&&turn(job.yaw,dt)){phase='checkout-pay';timer=2;}}
   else if(phase==='checkout-pay'){if(job.ready()){clerk.userData.shopReach=clerkTarget(layout.register);if((timer-=dt)<=0)finish();}}
   else if(phase==='stock-fetch'){clerk.userData.activity='fetching stock from the back room';if(walk(job.pickup,dt)){phase='stock-collect';timer=1.3;}}
   else if(phase==='stock-collect'){clerk.userData.activity='opening a carton of '+(job.name||job.item).toLowerCase();if((timer-=dt)<=0){box.visible=true;cartonStops=3;phase='stock-carry';}}
   else if(phase==='stock-carry'){clerk.userData.activity='carrying '+(job.name||job.item).toLowerCase()+' to the shelf';if(walk(job.position,dt)&&turn(job.yaw,dt)){phase='stock-place';timer=1.8;beginPlacement();}}
   else if(phase==='stock-prep-fetch'){clerk.userData.activity='checking the back-room stock';if(walk(job.pickup,dt)){phase='stock-prep-collect';timer=1.3;}}
   else if(phase==='stock-prep-collect'){clerk.userData.activity='bringing out a closing carton';if((timer-=dt)<=0){box.visible=true;cartonStops=3;phase='stock-prep-carry';}}
   else if(phase==='stock-prep-carry'){clerk.userData.activity='bringing '+(job.name||job.item).toLowerCase()+' out before closing';if(walk(job.position,dt)&&turn(job.yaw,dt))phase='stock-prep-hold';}
   else if(phase==='stock-prep-hold'){clerk.userData.activity='waiting to place '+(job.name||job.item).toLowerCase()+' after closing';if(job.ready?.()){job.type='restock';phase='stock-place';timer=1.8;beginPlacement();}}
   else if(phase==='stock-place'){clerk.userData.activity='placing '+(job.name||job.item).toLowerCase()+' on the shelf';accessShelf(job.item);if((timer-=dt)<=0)finish();}
   if(box.visible){clerk.userData.carrying=true;clerk.userData.carriedTray=box;box.position.copy(clerk.position).add(new THREE.Vector3(0,.98,-.34).applyAxisAngle(new THREE.Vector3(0,1,0),clerk.rotation.y));box.rotation.y=clerk.rotation.y;}
   else{clerk.userData.carrying=false;delete clerk.userData.carriedTray;}
  }
 };
}
