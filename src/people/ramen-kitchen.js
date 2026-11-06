import * as THREE from '../../vendor/three.module.js';
import {createDrinkProp,createDishProp,disposeServing} from './izakaya-beer.js';
import {SATO_KITCHEN as K} from '../world/sato-ramen-layout.js';
import {standNow,hash01} from './stand-points.js';

/**
 * Mrs Sato's kitchen at lunch. Every order, yours or a regular's, is cooked where it would
 * be: noodles into the boiler, soup from the stock pots, toppings from the tray, coffee and
 * barley tea from the back counter. Then she carries it to the pass and sets it down over
 * the counter in front of the stool, with a little bow. Between orders she is never still:
 * she stirs the pots, chops spring onion, lays out toppings and wipes the counter.
 *
 * She walks the kitchen aisle only (world/sato-ramen-layout.js), out to the aisle, along
 * it, then in to the station, so she never cuts through the line.
 */
const DRINK_PROPS={beer:'bottle',tea:'oolong',mugicha:'mugicha',coffee:'coffee'};
const isDrink=kind=>kind in DRINK_PROPS;
/** The stations an item visits, how long she works at each, and what she is doing there. */
function stepsFor(kind){
 if(kind==='ramen')return [['boiler',3.2,'dropping noodles into the boiler'],['pots',2.4,'ladling soup from the stock pots'],['toppings',2.2,'laying chashu and spring onion on the bowl']];
 if(kind==='gyoza')return [['boiler',3.6,'frying gyoza on the hot plate']];
 if(kind==='rice')return [['prep',1.6,'filling a bowl of rice']];
 if(kind==='beer')return [['drinks',1.4,'opening a bottle of Orion']];
 return [['drinks',1.8,kind==='coffee'?'pouring a hot coffee':kind==='mugicha'?'pouring a cold barley tea':'pouring an oolong tea']];
}
const IDLE=[['pots',7,'stirring the stock pots'],['prep',6,'chopping spring onion'],['toppings',5,'laying out the toppings'],['pass',4,'wiping down the counter'],['boiler',5,'checking the noodle boiler']];
/** After lunch (14:00–15:00, commuter-schedule.js SATO_SHIFT): washing up and wiping down, cloth or glass in hand. */
const WASHUP=[['pass',9,'wiping the counter down after lunch','Wipe','cloth'],['prep',10,'washing up the lunch bowls','Wipe','cloth'],['drinks',8,'drying and polishing the glasses','Polish','glass'],['pots',9,'scrubbing out the stock pots','Wipe','cloth'],['toppings',7,'wiping down the topping tray','Wipe','cloth']];

export function createRamenKitchen({getCook,isAfterLunch=()=>false,getMinutes=()=>null}){
 const queue=[];let task=null,idle=null,idleIndex=0,cook=null;
 const passX=x=>THREE.MathUtils.clamp(x,K.minX,K.maxX);
 const spot=(name,x)=>name==='pass'?[passX(x),K.passZ]:K[name];
 const facing=name=>name==='pass'||name==='drinks'?Math.PI:0;
 /** Out to the aisle, along it, in to the spot: the line and the counter stay solid. */
 function route(g,[x,z]){const pts=[];if(Math.abs(g.position.z-K.aisleZ)>.05)pts.push([g.position.x,K.aisleZ]);pts.push([x,K.aisleZ]);pts.push([x,z]);return pts;}
 function walk(g,points,dt){
  while(points.length){
   const [x,z]=points[0],dx=x-g.position.x,dz=z-g.position.z,d=Math.hypot(dx,dz);
   if(d<.03){points.shift();continue;}
   const want=Math.atan2(-dx,-dz),turn=Math.atan2(Math.sin(want-g.rotation.y),Math.cos(want-g.rotation.y));
   g.rotation.y+=Math.max(-dt*6,Math.min(dt*6,turn));
   if(Math.abs(turn)<.9){const step=Math.min(d,dt*1.2*(1-Math.abs(turn)/1.2));g.position.x+=dx/d*step;g.position.z+=dz/d*step;}
   return false;
  }
  return true;
 }
 function turnTo(g,yaw,dt){const turn=Math.atan2(Math.sin(yaw-g.rotation.y),Math.cos(yaw-g.rotation.y));g.rotation.y+=Math.max(-dt*6,Math.min(dt*6,turn));return Math.abs(turn)<.05;}
 function pose(g,{socialPose=null,carrying=false,activity,tool=null}={}){
  const u=g.userData;if(socialPose)u.socialPose=socialPose;else delete u.socialPose;if(tool)u.tool=tool;else delete u.tool;
  if(carrying)u.carrying=true;else delete u.carrying;if(activity)u.activity=activity;
 }
 // What she carries to the pass: the real bowl and cup, held in front of her.
 function carry(g,items){
  const tray=new THREE.Group();tray.name='Mrs Sato carrying';
  items.forEach((kind,i)=>{const p=isDrink(kind)?createDrinkProp(DRINK_PROPS[kind]):createDishProp(kind);p.position.set((i-(items.length-1)/2)*.17,0,0);tray.add(p);});
  tray.position.set(0,1.0,-.34);g.add(tray);return tray;
 }
 function drop(t){if(t?.tray){for(const c of [...t.tray.children])disposeServing(c);t.tray.removeFromParent();t.tray=null;}}
 function start(t,g){
  t.plan=[...t.items.flatMap(stepsFor),['pass',.9,'setting it down over the counter']];
  // Drinks only: no need to go to the line.
  t.step=-1;next(t,g);
 }
 function next(t,g){
  t.step++;const step=t.plan[t.step];if(!step)return false;
  const [name,seconds,activity]=step;t.phase='walking';t.work=seconds;t.activity=activity;
  t.path=route(g,spot(name,t.x));t.station=name;
  if(name==='pass'){t.tray=carry(g,t.items);pose(g,{carrying:true,activity:'bringing '+t.label+' '+t.items.map(k=>k==='mugicha'?'barley tea':k).join(' and ')});}
  else pose(g,{activity:'on the way to the '+name});
  return true;
 }
 function finish(t){drop(t);t.onServed?.();}
 return {
  get busy(){return !!task||queue.length>0;},get queued(){return queue.length+(task?1:0);},get task(){return task;},
  /**
   * An order for a stool: `items` are prop kinds ('ramen', 'gyoza', 'rice', 'beer', 'tea',
   * 'mugicha', 'coffee'), `x` the stool's place along the counter. False when she is not
   * in her kitchen to cook it; the caller then serves it the old way.
   */
  request({items,x,label='',tag=null,onServed}){
   if(!getCook())return false;
   queue.push({items:[...items],x,label,tag,onServed});return true;
  },
  /** Forget orders for someone who left, or for you when you stand up. */
  cancel(tag){
   for(let i=queue.length-1;i>=0;i--)if(queue[i].tag===tag)queue.splice(i,1);
   if(task?.tag===tag){drop(task);task=null;if(cook)pose(cook,{activity:'back to the stock pots'});}
  },
  update(dt){
   const g=getCook();
   if(g!==cook){if(cook)delete cook.userData.tool;if(task){if(cook)drop(task);if(!g){finish(task);task=null;}}cook=g;idle=null;}
   if(!g){
    // She has gone (end of lunch, or the room was rebuilt): nobody waits for a bowl that will never come.
    while(queue.length)queue.shift().onServed?.();return;
   }
   // `serving` keeps the room's own staff routine (indoor-residents.js) from talking over her.
   g.userData.kitchen=true;g.userData.serving=true;
   if(!task&&queue.length){task=queue.shift();idle=null;start(task,g);}
   if(task){
    if(task.phase==='walking'){
     if(walk(g,task.path,dt)){task.phase='turning';}
    }else if(task.phase==='turning'){
     if(turnTo(g,facing(task.station),dt)){task.phase='working';pose(g,{socialPose:task.station==='pass'?'CarryIdle':'Use',carrying:task.station==='pass',activity:task.activity});}
    }else if(task.phase==='working'){
     if((task.work-=dt)<=0){
      if(task.station==='pass'){finish(task);task.phase='bowing';task.work=.8;pose(g,{socialPose:'Greet',activity:"Here you are"});}
      else if(!next(task,g)){finish(task);task=null;}
     }
    }else if(task.phase==='bowing'){
     if((task.work-=dt)<=0){pose(g,{});task=null;}
    }
    return;
   }
   // Between orders: a round of small jobs, never standing about. In a phase of her day with stand points
   // (stand-sequences.js ramen-stock, ramen-lunch) the seeded clock says which station and for how long; after lunch,
   // and with no clock, the washing-up round and the small jobs in turn.
   const minutes=getMinutes(),stand=Number.isFinite(minutes)&&!isAfterLunch()?standNow('Mrs Sato',minutes,'ramen'):null,key=stand?stand.loop+'/'+stand.index:null;
   if(idle&&idle.key!==key)idle=null;
   if(!idle){
    if(stand){const P=stand.point;idle={key,name:P.station,seconds:Infinity,activity:P.activity,workPose:P.pose,tool:P.tool,x:P.x,yaw:stand.yaw,path:null,phase:'walking'};idle.path=route(g,[P.x,P.z]);}
    else{const list=isAfterLunch()?WASHUP:IDLE,i=idleIndex++,[name,seconds,activity,workPose='Use',tool=null]=list[i%list.length];idle={key,name,seconds,activity,workPose,tool,x:K.minX+.4+hash01('sato-pass',i)*(K.maxX-K.minX-.8),path:null,phase:'walking'};idle.path=route(g,spot(name,idle.x));}
    pose(g,{tool:idle.tool,activity:'on the way to the '+idle.name});
   }
   if(idle.phase==='walking'){if(walk(g,idle.path,dt))idle.phase='turning';}
   else if(idle.phase==='turning'){if(turnTo(g,idle.yaw??facing(idle.name),dt)){idle.phase='working';pose(g,{socialPose:idle.workPose,tool:idle.tool,activity:idle.activity});}}
   else if((idle.seconds-=dt)<=0)idle=null;
  },
  dispose(){if(task)drop(task);task=null;queue.length=0;idle=null;if(cook)for(const k of ['kitchen','serving','socialPose','carrying','tool'])delete cook.userData[k];cook=null;}
 };
}
