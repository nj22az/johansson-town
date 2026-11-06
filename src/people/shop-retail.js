import {sakuraClerkAt} from '../commerce/sakura-rota.js';
import * as THREE from '../../vendor/three.module.js';

import {SHOP_STOCK,stockSpec,takeShopStock,returnShopStock,restockItem,depletedShelf,closingDay,closingStockPending,closingPreparationPending,SOLD_OUT} from '../commerce/shop-stock.js';
import {recordSakuraSale,shopEntry,advanceDeliveries} from '../commerce/sakura-economy.js';
import {BUDGET} from '../edition.js';
import {createRoomWalk} from './room-walk.js';
import {marketVisitPurpose} from './market-visits.js';
import {residentPersonality} from './resident-personalities.js';
import {SAKURA_SHELVES} from '../world/interiors/sakura-layout.js';
import {SAKURA_QUEUE,SAKURA_BROWSE,assignSakuraQueue,yawOf} from '../world/interiors/sakura-queue.js';


export function createShopRetail({world,state,ledger,display,collides,getMinutes,isOccupied=()=>false}){
 const layout=display.layout,COUNTER=layout.checkout,STOCKROOM=layout.stockroom,walkers=new Map(),customers=new Map();let activeJob=null;
 const radius=.35;
 function walk(person,target,dt){
  let path=walkers.get(person);if(!path){path={walker:createRoomWalk((x,z,r)=>collides(x,z,r)||isOccupied(x,z,r,person),{bounds:layout.bounds,smoothTurn:true,radius}),stalled:0};walkers.set(person,path);}
  const before=person.g.position.clone(),arrived=path.walker.move(person,target,dt);
  // A full smooth turn can take over a second. Let it finish before rebuilding
  // the route, while still recovering when somebody moves into a cached aisle.
  if(!arrived&&person.g.position.distanceTo(before)<.0001){path.stalled+=dt;if(path.stalled>=2){path.walker.clear();path.stalled=0;}}else path.stalled=0;
  return arrived;
 }
 function visit(person,minutes){
  if(sakuraClerkAt(minutes)===person.profile.name||marketVisitPurpose(person.profile.name,minutes,state)!=='goods')return null;
  const account=ledger.account(person.profile.name,minutes);
  const record=account.shopping??={phase:'browse',started:minutes,finished:false,item:null,picked:false,paid:false,timer:0,position:[...layout.entrance]};
  // Old saves can remember a spot occupied by a moved shelf or a person now in
  // that aisle. Restart an unpicked visit before the real resident is placed at
  // the entrance, so pickup still requires walking back to the physical shelf.
  if(!record.finished&&(!Array.isArray(record.position)||record.position.length!==3||!record.position.every(Number.isFinite)||collides(record.position[0],record.position[2],radius)||isOccupied(record.position[0],record.position[2],radius,person))){
   record.position=[...layout.entrance];
   if(!record.picked&&record.phase!=='paid'){record.phase='browse';record.timer=0;}
   delete record.atCounter;
  }
  if(Array.isArray(record.position))record.position[1]=0;
  return record;
 }
 function arriving(person,minutes){return visit(person,minutes);}
 function point(item,slot){return display.unitPositions.get(item+':'+slot)||[0,1,0];}
 function stand(item,slot=Math.max(0,state.sakura.stock[item].shelf-1)){return display.unitApproaches.get(item+':'+slot)||SAKURA_SHELVES[item].stand;}
 function face(g,yaw,dt){const angle=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y));g.rotation.y+=THREE.MathUtils.clamp(angle,-dt*2.6,dt*2.6);return Math.abs(angle)<.025;}
 function clear(person){for(const key of ['heldItem','shopGoods','shopReach','shopping'])delete person.g.userData[key];}
 function finish(person,record){
  if(record.picked&&!record.paid){if(BUDGET.trade)returnShopStock(state,{item:record.item});record.picked=false;}
  record.finished=true;record.phase='finished';clear(person);customers.delete(person);walkers.get(person)?.walker.clear();walkers.delete(person);
 }
 function choices(person){
  const start=(Math.floor(getMinutes()/1440)+person.profile.name.length)%SHOP_STOCK.length;
  const rotation=Array.from({length:SHOP_STOCK.length},(_,i)=>SHOP_STOCK[(start+i)%SHOP_STOCK.length]),preferred=residentPersonality(person.profile.name).shopping;
  if(preferred){const index=rotation.findIndex(item=>item.id===preferred);if(index>0)rotation.unshift(rotation.splice(index,1)[0]);}
  return rotation.filter(item=>ledger.account(person.profile.name,getMinutes()).yen>=item.cost);
 }
 function soldOut(person,record){finish(person,record);const clerk=world.people.find(p=>p.profile.name===sakuraClerkAt(getMinutes()));if(clerk)clerk.g.userData.residentSpeech={text:SOLD_OUT,until:getMinutes()+5};}
 /**
  * The till queue (world/interiors/sakura-queue.js): the paying spot and the next spot a metre back, taken in the
  * order people join; a paid customer keeps the paying spot until they turn away; whoever finds both taken browses an
  * aisle's spot and comes back when one is free. Worked out once a frame, before anyone moves.
  */
 let places=new Map();
 function queuePlaces(){
  const entries=[...customers].filter(([p,r])=>p.g.userData.inMarket&&!r.finished&&(r.phase==='queue'||r.phase==='paid'))
   .map(([p,r])=>({id:p.profile.name,phase:r.phase,since:Number.isFinite(r.queuedAt)?r.queuedAt:r.started,held:r.queueSpot||null}));
  places=assignSakuraQueue(entries);
 }
 function update(dt){
  const minutes=getMinutes(),open=true;if(BUDGET.trade)advanceDeliveries(state,minutes);queuePlaces();
  for(const person of world.people){
   if(person.profile.name===sakuraClerkAt(minutes))continue;const account=ledger.account(person.profile.name,minutes),record=account.shopping,previous=customers.get(person);
   if(previous&&previous!==record)finish(person,previous);
   if(!person.g.userData.inMarket||person.g.userData.roomTransition||!record||record.finished){if(customers.has(person))finish(person,record);continue;}
   customers.set(person,record);const g=person.g;g.userData.shopping=true;g.userData.floorHeight=0;
   if(!open){finish(person,record);continue;}
   if(record.phase==='browse'){
    if(!record.item){const item=choices(person)[0];if(!item){finish(person,record);continue;}record.item=item.id;}
    g.userData.activity='choosing '+stockSpec(record.item).name.toLowerCase();
    if(walk(person,stand(record.item),dt)){record.phase='pickup';record.timer=1.2;}
   }else if(record.phase==='pickup'){
    const count=state.sakura.stock[record.item].shelf;if(!count){soldOut(person,record);continue;}
    if(!face(g,SAKURA_SHELVES[record.item].yaw,dt))continue;display.accessShelf(record.item);g.userData.shopReach=point(record.item,count-1);record.timer-=dt;
    if(record.timer<=0){const claim=BUDGET.trade?takeShopStock(state,record.item):{item:record.item,virtual:true};delete g.userData.shopReach;if(!claim){record.item=null;record.phase='browse';continue;}record.picked=true;record.phase='queue';record.queuedAt=minutes;}
   }else if(record.phase==='queue'){
    const place=places.get(person.profile.name)||{kind:'hold'},name=stockSpec(record.item).name.toLowerCase();
    record.queueSpot=place.kind==='hold'?record.queueSpot||null:place;
    if(place.kind==='queue'){
     const spot=SAKURA_QUEUE[place.index];
     g.userData.activity=place.index===0?'paying for '+name:'next in the queue for the till with '+name;
     record.atCounter=place.index===0&&walk(person,[spot.x,0,spot.z],dt)&&face(g,yawOf(spot.facing),dt);
     if(place.index>0&&walk(person,[spot.x,0,spot.z],dt))face(g,yawOf(spot.facing),dt);
    }else{
     // Both queue spots are taken: an aisle's browsing spot, the purchase in hand, until one comes free.
     record.atCounter=false;g.userData.activity='browsing with '+name+' in hand until the queue clears';
     const spot=place.kind==='browse'?SAKURA_BROWSE[place.index]:null;
     if(spot&&walk(person,[spot.x,0,spot.z],dt))face(g,yawOf(spot.facing),dt);
    }
   }else if(record.phase==='paid'){
    g.userData.activity='putting a purchase away';record.timer-=dt;if(record.timer<=0)finish(person,record);
   }
   if(record.picked&&!record.finished){g.userData.heldItem='shop-'+record.item;g.userData.shopGoods=true;}
   record.position=g.position.toArray();
  }
  display.updateStock(state.sakura.stock);
 }
 function work(){
  if(activeJob)return activeJob;
  const minutes=getMinutes(),minute=minutes%1440,open=minute>=540&&minute<1200;
  // The customer on the paying spot: the one the queue has put first (assignSakuraQueue).
  const waiting=open&&[...customers].find(([p,record])=>record.phase==='queue'&&!record.paid&&places.get(p.profile.name)?.kind==='queue'&&places.get(p.profile.name).index===0);
  if(waiting){const [customer,record]=waiting;activeJob={type:'checkout',customer,record,ready:()=>record.atCounter,position:layout.staff,yaw:layout.staffYaw};return activeJob;}
  // The web edition has no closing restock (edition.js `trade`): the shelves are full again at the next opening.
  if(!BUDGET.trade)return null;
  const preparation=closingPreparationPending(state,minutes);
  if(!preparation&&!closingStockPending(state,minutes))return null;
  const item=depletedShelf(state);
  if(!item){
   const expected=state.sakura.deliveries.some(d=>state.sakura.stock[d.item].shelf<stockSpec(d.item).capacity);
   if(!preparation&&!expected)state.sakura.restockedDay=closingDay(minutes);
   return null;
  }
  const stock=state.sakura.stock[item.id],slot=stock.shelf,reach=point(item.id,slot);
  activeJob={type:preparation?'restock-prep':'restock',item:item.id,name:item.name,quantity:Math.min(item.capacity-stock.shelf,stock.reserve),slot,position:stand(item.id),pickup:STOCKROOM,target:reach,reach,yaw:SAKURA_SHELVES[item.id].yaw,ready:preparation?()=>closingStockPending(state,getMinutes()):undefined};return activeJob;
 }
 function complete(job){
  if(job!==activeJob)return;const minutes=getMinutes();
  if(job.type==='checkout'){
   const {customer,record}=job,item=stockSpec(record.item);
   if(!record.finished&&record.picked&&!record.paid&&customer.g.userData.inMarket&&ledger.purchase(customer.profile.name,minutes,'shop-goods',item.id,item.cost)){
    record.paid=true;record.phase='paid';record.timer=2;
    recordSakuraSale(state,item.cost,'goods-'+Math.floor(minutes/1440)+'-'+customer.profile.name,{minute:minutes,item:item.name,buyer:customer.profile.name,unitCost:item.unitCost});
    customer.g.userData.residentSpeech={text:'Thank you, '+sakuraClerkAt(minutes)+'.',until:minutes+3};
   }else if(!record.paid)finish(customer,record);
  }else if(closingStockPending(state,minutes)){
   const spec=stockSpec(job.item),stock=state.sakura.stock[job.item],quantity=spec&&stock?Math.min(spec.capacity-stock.shelf,stock.reserve):0;
   const count=restockItem(state,job.item,quantity);if(count)shopEntry(state,{minute:minutes,kind:'Restocked',item:spec.name,buyer:sakuraClerkAt(minutes),quantity:count});
  }
  activeJob=null;display.updateStock(state.sakura.stock);
 }
 return {update,work,complete,cancelWork(){activeJob=null;},arriving,standing(person,minutes){const record=visit(person,minutes);return record&&!record.finished?record.position:null;},get customers(){return customers;}};
}
