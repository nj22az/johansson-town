import {createCheckoutFeedback} from '../world/interiors/sakura-checkout.js';
import {sakuraClerkAt} from '../commerce/sakura-rota.js';
import * as THREE from '../../vendor/three.module.js';
import {circleHitsRect} from '../../physics.js?snappy=1';
import {buildSakuraInterior} from '../world/interiors/sakura-interior.js';
import {SAKURA_LAYOUT} from '../world/interiors/sakura-layout.js';
import {suppliedRoomBoundsBlocked} from '../world/supplied-rooms.js?snappy=1';
import {createIndoorResidents} from './indoor-residents.js';
import {createRetailClerk,inTillPocket,tillStep} from './retail-clerk.js';
import {createShopAttention} from './shop-attention.js';
import {createShopRetail} from './shop-retail.js';
import {returnShopStock,webShelves} from '../commerce/shop-stock.js';
import {BUDGET} from '../edition.js';
import {PALETTE,fluorescent} from '../render/dusk.js';
import {createStandIn} from '../render/static-props.js';
import {townAudio} from '../audio/town-audio.js?snappy=1';

// A single persistent shop owns stock, staff and customer jobs everywhere in town.
export function createSakuraShop({world,scene,state,ledger,register,action,exit,getMinutes,getPlayerPosition,isInside,onBorrow=()=>{},getRain=()=>false,save=()=>{},stair=()=>{}}){
 // Re-checked twice a second too: the interior's lights arrive when its model loads.
 let lightsInside=null,lightCheck=0;
 const group=new THREE.Group();group.name='Sakura Shōten continuous shop';group.userData.sharedAsset=true;group.visible=false;scene.add(group);
 const syncLightVisibility=inside=>{
  lightsInside=inside;lightCheck=.5;
  group.traverse(o=>{if(o.isLight)o.visible=inside;});
 };
 if(state.sakura.playerClaim){returnShopStock(state,state.sakura.playerClaim);delete state.sakura.playerClaim;}
 for(const account of Object.values(state.residentLife||{})){
  const meal=account.meals?.market;if(meal?.stockClaim&&!meal.delivered){returnShopStock(state,meal.stockClaim);meal.stockClaim=null;}if(meal)meal.finished=true;
  if(account.day!==Math.floor(getMinutes()/1440)){const visit=account.shopping;if(visit?.picked&&!visit.paid){returnShopStock(state,{item:visit.item});visit.picked=false;}}
 }
 // The clerk follows the rota (commerce/sakura-rota.js): Thuan, the owner, on weekdays and Nhung on Sunday, the shop shut on Saturday; nobody
 // at night, when the shop is shut. When the shift changes, the counter's services are bound to the new body; the shut
 // hours keep the last clerk's binding.
 const layout=SAKURA_LAYOUT,colliders=layout.colliders,clerkFor=m=>world.people.find(p=>p.profile.name===sakuraClerkAt(m))||null;
 let person=clerkFor(getMinutes())||world.people.find(p=>p.profile.name==='Thuan');
 const reg=(object,label,fn,inside=true)=>{object.userData.persistentShop=true;register(object,label,fn,inside);};
 const blocked=(x,z,r=.3)=>suppliedRoomBoundsBlocked(layout,x,z,r)||colliders.some(c=>circleHitsRect(x,z,r,c));
 const isOccupied=(x,z,r,excluded)=>{
  const player=isInside()&&getPlayerPosition();if(player&&(player.y??0)<1&&Math.hypot(player.x-x,player.z-z)<r+.28)return true;
  return world.people.some(p=>p!==excluded&&p.g.userData.inMarket&&p.g.visible&&Math.hypot(p.g.position.x-x,p.g.position.z-z)<r+(p===person?layout.clearance:.35));
 };
 let backRoomsFetched=false,lastDt=1/60;
 const display=buildSakuraInterior({room:group,reg,action,exit,stair:dir=>stair(dir)});display.updateStock(state.sakura.stock);
 const checkout=createCheckoutFeedback({drawer:display.cashDrawer,
  getSale:()=>state.sakura.journal?.findLast(entry=>entry.kind==='Sale'),
  onSale:()=>townAudio.bells([[1568,0],[2093,.09]],.16)});
 const retail=createShopRetail({world,state,ledger,display,collides:blocked,getMinutes,isOccupied});
 let attention=createShopAttention({clerk:person.g,world,retail,colliders,isInside,getPlayerPosition});
 let service;
 const residents=createIndoorResidents({world,parent:group,layout,collides:blocked,place:'market',getState:()=>state,getRain,
  onBorrow:(p,time)=>{onBorrow(p,time);retail.arriving(p,time);},getStandingVisit:retail.standing,
  isOccupied,radiusFor:p=>p===person?layout.clearance:.35,validateSpawn:true,
  // A clerk the rota has just relieved may still be at the till: out of the pocket first, facing the way she steps.
  canLeave:p=>{if(p!==person&&inTillPocket(p.g,layout)){tillStep(p.g,layout.staffApproach,lastDt);return false;}return p!==person||service?.prepareToLeave()!==false;}});
 const bindClerk=()=>createRetailClerk({person,room:group,layout,collides:blocked,getMinutes,getWork:retail.work,completeWork:job=>{retail.complete(job);save();},cancelWork:retail.cancelWork,accessShelf:display.accessShelf,
  isOccupied});
 service=bindClerk();
 const followRota=()=>{const next=clerkFor(getMinutes());if(!next||next===person)return;service?.prepareToLeave();person=next;attention=createShopAttention({clerk:person.g,world,retail,colliders,isInside,getPlayerPosition});service=bindClerk();};
 // Staff and customers remain live behind the glazing as their routines advance.
 const showPeople=on=>{
  // Staff are reparented in by the clerk service rather than added at the top, so this
  // has to look through the whole shop, not just its direct children. It does not look
  // inside the shop model: its meshes carry a name of their own from the file, and
  // taking that for a person hid every shelf, wall and fridge from the street, leaving
  // the goods hanging in the window with nothing under them.
  const visit=o=>{
   if(o!==group&&(o.userData?.name||o.userData?.character)){o.visible=on;return;}
   if(o.userData?.sharedAsset&&o!==group)return;
   for(const child of o.children)visit(child);
  };
  visit(group);
 };
 const UP=new THREE.Vector3(0,1,0);

 // Keep the real walls and partitions in both views. Only the duplicate facade
 // frame is hidden outside, where the storefront already supplies it.
 const frontFrame=()=>group.getObjectByName('sakura-front-frame');
 /**
  * What the interior scales to behind the glass.
  *
  * One wherever the frontage is built to the interior's own measurements, so the shop
  * you look into is the shop you walk into. On the street proper the frontage is the
  * smaller one the shops either side of it leave room for, and the interior has to be
  * fitted to its own window: without that its ends stand outside the side walls, in
  * daylight, as two black slabs either side of the fascia.
  */
 const WINDOW_FIT=1;
 /**
  * Strip lights, so the aisles are legible from the pavement. A shop lit only by what
  * gets past its own ceiling is a dark hole, which is not what a konbini looks like
  * from the street at any hour.
  */
 let strip=null;
 const updateLighting=minutes=>{
  display.updateLighting(minutes);display.smallOffice?.setWeather(getRain());
  for(const lamp of strip?.children||[])lamp.intensity=lamp.userData.openIntensity*fluorescent(minutes);
 };
 (world.hourly||(world.hourly=[])).push(updateLighting);
 updateLighting(getMinutes());
 const lit=on=>{
  if(on&&!strip){
   strip=new THREE.Group();strip.name='Sakura shopfront strip lights';
   // Two, because one over the counter leaves the far aisle in the dark and a konbini
   // is evenly lit end to end. Distances are in room units, which the window fit scales
   // along with everything else.
   for(const [x,z,power] of [[1.2,1.1,150],[-3.2,-1.6,110]]){
    const lamp=new THREE.PointLight(PALETTE.sakuraTube,power,17,2);lamp.userData.openIntensity=power;
    lamp.position.set(x,2.6,z);strip.add(lamp);
   }
   group.add(strip);
  }else if(!on&&strip){strip.traverse(o=>o.dispose?.());strip.removeFromParent();strip=null;}
  updateLighting(getMinutes());
 };

 // Rooms behind the shop floor: nobody sees them through the front windows, so from the
 // street they are not drawn (about 200 draw calls on a phone). Inside, they are.
 const BEHIND=new Set(['Sakura back room stock','Sakura restroom','Sakura small office','Sakura internal stairwell']);
 const backRooms=on=>group.traverse(o=>{if(BEHIND.has(o.name))o.visible=on;});
 /**
  * From the street the shop floor is a stand-in: the same shelves merged into a few
  * dozen meshes instead of about five hundred. Shelf products keep their existing
  * instanced buffers: expanding them would duplicate hundreds of thousands of
  * triangles just for a window. It is rebuilt when the stock changes or
  * a new day restocks the racks, and the real room comes back the moment you go in.
  */
 let standIn=null,standKey='';
 const windowView=on=>{
  if(on){
   const key=JSON.stringify(state.sakura.stock)+'/'+Math.floor(getMinutes()/1440);
   if(key!==standKey||!standIn){standIn?.dispose();standIn=createStandIn(group,{name:'Sakura window stand-in',keepInstances:true,keepLive:o=>!!(o.userData?.name||o.userData?.character)});group.add(standIn.group);standKey=key;}
   standIn.show(true);
  }else standIn?.show(false);
 };
 return {group,colliders:display.layout.colliders,service,retail,display,blocked,layout:display.layout,ready:display.ready,
  /** quiet: coming down the stair from the office, not in at the front door (no door chime). */
  enter(parent,{quiet=false}={}){
   if(!backRoomsFetched){backRoomsFetched=true;display.loadBackRooms?.();}
   parent.add(group);group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.setScalar(1);
   const frame=frontFrame();if(frame)frame.visible=true;
   // The expanded street copy is unnecessary indoors. Release its buffers before
   // the full shop and window view allocate their rendering resources.
   windowView(false);standIn?.dispose();standIn=null;standKey='';lit(false);backRooms(true);
   group.visible=true;showPeople(true);display.updateStock(state.sakura.stock);
   syncLightVisibility(true);
   // The door chime: a bright little arpeggio of our own as the automatic door opens.
   if(!quiet)townAudio.bells([[1319,0],[1568,.13],[2093,.26],[1760,.44],[2093,.57],[2637,.72]],.32);
  },
  /**
   * Parks the real interior behind the shop's own glazing, so the street looks in at
   * the shop the player will actually walk into rather than at a set of stand-in
   * shelves. The transform is the one shop-street-view.js uses to map the interior
   * camera out to the street, run the other way — which is what makes the view in and
   * the view out agree.
   *
   * @param {THREE.Object3D} parent the town group
   * @param {{position:number[],yaw:number}} frontage
   */
  street(parent,frontage){
   checkout.update(0,false);
   if(!parent||!frontage?.position)return false;
   parent.add(group);
   const fit=WINDOW_FIT;
   group.scale.setScalar(fit);
   group.rotation.set(0,frontage.yaw,0);
   group.position.set(...frontage.position)
    .add(new THREE.Vector3(0,0,-fit*(layout.frontZ??3.91)).applyAxisAngle(UP,frontage.yaw));
   const frame=frontFrame();if(frame)frame.visible=false;
   lit(true);backRooms(false);
   group.visible=true;showPeople(true);
   display.updateStock(state.sakura.stock);
   windowView(true);
   // Window mounting can finish after the outside light scan. Synchronise the new
   // tube lights now, including when a frozen fixture has no next simulation tick.
   syncLightVisibility(false);
   return true;
  },
  hide(){checkout.update(0,false);windowView(false);scene.add(group);group.position.set(0,0,0);group.rotation.set(0,0,0);group.scale.setScalar(1);group.visible=false;lit(false);backRooms(true);const frame=frontFrame();if(frame)frame.visible=true;showPeople(true);syncLightVisibility(false);},
  update(dt){
   if(!BUDGET.trade)webShelves(state,getMinutes());
   // The shop's lights are for the inside of the shop. The interior stays in the street
   // scene so you can see it through the glass, but a light has no walls: left on, its
   // hemisphere fill brightened the whole town and its tubes threw a 17 m halo over the
   // roof and the road. Outside, the shop shows through the window by its own glow.
   {const inside=!!isInside();lightCheck-=dt;if(inside!==lightsInside||lightCheck<=0)syncLightVisibility(inside);}
   lastDt=dt;display.tick?.(performance.now()/1000,getMinutes(),dt);followRota();if(!person.g.userData.playerControlled){residents.sync(getMinutes(),dt);retail.update(dt);service.update(dt);attention.update(dt);}
   checkout.update(dt,!!isInside());display.refrigerator.update(dt);display.updateStock(state.sakura.stock);
   // The office door opens for whoever is in the shop and near it: the player, Thuan, anyone borrowed in.
   // The front door, from inside, opens the same way (the street side has its own).
   if(display.officeDoor){const points=[];if(isInside()){const p=getPlayerPosition();points.push([p.x,p.z]);}for(const other of world.people)if(other.g.parent===group)points.push([other.g.position.x,other.g.position.z]);display.officeDoor.update(dt,points);display.frontDoor?.update(dt,points);}},
 };
}
