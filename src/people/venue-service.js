import * as THREE from '../../vendor/three.module.js';
import {DRINKS,serviceFor,createDrinkProp,createDishProp,setPropPortion,updatePropPortion,disposeServing} from './izakaya-beer.js';
import {consumptionPhase} from '../avatars/consume.js';
import {LIMIT,wantsAnother,drink as drinkUp} from './drunk.js';
import {izakayaJob} from './izakaya-hours.js';

// A beer at Minato is a draught; a round comes every ROUND_GAP town minutes for as long
// as there is room under the limit (drunk.js).
const BEER=DRINKS.draft.alcohol,ROUND_GAP=20,MAX_ROUNDS=4;
import {createResidentLedger,residentPersonality} from './resident-personalities.js';

const LABELS={beer:'beer',tea:'green tea',coffee:'hot coffee',mugicha:'cold barley tea',rice:'rice',yakitori:'yakitori',fish:'grilled fish',ramen:'ramen'};
const DRINK_PROP={beer:'draft',coffee:'coffee',mugicha:'mugicha'};
/**
 * How a meal goes, in steps of `step` seconds through `pattern`: a mouthful on an 'eat'
 * step, a sip on a 'drink' step, nothing on 'rest', until `bites` and `sips` are used up.
 * The drink goes from `from` to `to` of a glass. Minato's supper is the old 42 seconds;
 * Sato Ramen's lunch is a slow bowl with the drink between (MEALS.lunch).
 */
export const MEALS=Object.freeze({
 supper:Object.freeze({step:3,pattern:['drink','rest','eat','rest'],bites:3,sips:4}),
 round:Object.freeze({step:3,pattern:['drink','rest'],bites:0,sips:4}),
 lunch:Object.freeze({step:4,pattern:['eat','rest','eat','rest','drink','rest','rest'],bites:8,sips:4,to:.45}),
 linger:Object.freeze({step:4,pattern:['rest','rest','rest','rest','drink'],bites:0,sips:3,from:.45}),
 refill:Object.freeze({step:4,pattern:['rest','rest','rest','drink','rest'],bites:0,sips:5}),
});
export function mealState(plan,t){
 const k=Math.floor(t/plan.step),local=t-k*plan.step,act=i=>plan.pattern[i%plan.pattern.length];let eats=0,sips=0;
 for(let i=0;i<k;i++){const a=act(i);if(a==='eat'&&eats<plan.bites)eats++;else if(a==='drink'&&sips<plan.sips)sips++;}
 let action=act(k);if(action==='eat'&&eats>=plan.bites||action==='drink'&&sips>=plan.sips)action='rest';
 const sw=consumptionPhase(local).swallow,from=plan.from??1,to=plan.to??0;
 return {action,local,foodLeft:plan.bites?Math.max(0,1-(eats+(action==='eat'?sw:0))/plan.bites):0,
  drinkLeft:from-(from-to)*Math.min(1,(sips+(action==='drink'?sw:0))/plan.sips),done:eats>=plan.bites&&sips>=plan.sips};
}
// Persistent meal records stop guests ordering again when the player re-enters.
// A venue can keep its props under a hidden group and continue its dining cycle.
export function createVenueService({room,place,getCustomers,getMinutes,getStaff=()=>null,ledger=createResidentLedger(),staffName=place==='izakaya'?'Thao':null,venueName=place==='ramen'?'Inakaya':'Minato',drinkFor=null,tableFor=null,kitchen=null,meal=null,bar=null}){
 // At Minato Thao makes each drink from where it is kept and brings it (`bar`: the izakaya's service, izakaya-beer.js).
 const barService=()=>place==='izakaya'?bar?.()||null:null;
 const inside=place==='ramen'?'inRamen':'inIzakaya';
 const settings=new Map();let serving=null,timer=0;
 function clear(person){for(const key of ['heldItem','mealState','residentSpeech','heldPortion','foodPortion','consumeElapsed'])delete person.g.userData[key];}
 function remove(person){kitchen?.cancel(person);barService()?.cancel(person);const setting=settings.get(person);if(!setting)return;for(const prop of [setting.food,setting.drink])disposeServing(prop);settings.delete(person);clear(person);if(serving===person){serving=null;timer=0;}}
 function table(person,prop,side){
  const g=person.g,forward=new THREE.Vector3(-Math.sin(g.rotation.y),0,-Math.cos(g.rotation.y)),right=new THREE.Vector3(Math.cos(g.rotation.y),0,-Math.sin(g.rotation.y));
  // Use the actual fitted table or counter top; seat height cannot tell them apart.
  const top=tableFor?.(person);if(top){prop.position.set(...top).addScaledVector(right,side*.15);return;}
  prop.position.copy(g.position).addScaledVector(forward,place==='ramen'?.40:g.userData.seatHeight>.65?.78:.60).addScaledVector(right,side*.15);
  prop.position.y=place==='ramen'?1.04:g.userData.seatHeight>.65?1.16:1.01;
 }
 const mealCost=record=>place==='ramen'?300:record.drinkOnly?180:({yakitori:180,fish:260,rice:150}[record.item]||180)+(record.drink==='beer'?180:120);
 /** The bowl arrives: pay for it, say thank you. Without the yen, they go without. */
 function settle(person,record,minutes){
  if(ledger.purchase(person.profile.name,minutes,place+'-meal'+(record.drinkOnly?'-round-'+record.rounds:''),record.drinkOnly?'another '+record.drink:record.item+' + '+record.drink,mealCost(record))){record.delivered=true;person.g.userData.residentSpeech={text:place==='ramen'?'That smells wonderful.':'Thank you, Thao.',until:minutes+4};}
  else record.finished=true;
 }
 /**
  * After the bowl, at a counter with a kitchen: the rest of the drink a sip at a time,
  * then a refill when the glass is empty -- the cook brings it over -- for as long as they stay.
  */
 function linger(person,setting,data,dt,minutes){
  const L=setting.linger??={phase:'sipping',t:0,plan:MEALS.linger};
  setting.food.visible=false;data.mealState='lingering';delete data.foodPortion;
  if(L.phase==='sipping'){
   L.t+=dt;const m=mealState(L.plan,L.t),drink=m.action==='drink';
   setPropPortion(setting.drink,m.drinkLeft);updatePropPortion(setting.drink,dt);
   data.consumeElapsed=m.local;data.heldPortion=drink?m.drinkLeft:undefined;data.heldItem=drink?setting.record.drink:null;
   data.socialPose=drink?'Drink':'Sit';data.activity=(drink?'sipping ':'taking their time over ')+LABELS[setting.record.drink];
   if(setting.drinkAt)setting.drink.position.copy(setting.drinkAt);else table(person,setting.drink,1);setting.drink.visible=!drink;
   if(m.done){L.phase='waiting';L.t=25;}
  }else{
   delete data.heldItem;delete data.heldPortion;delete data.consumeElapsed;data.socialPose='Sit';
   setting.drink.visible=L.phase==='waiting';
   data.activity=L.phase==='refill'?'waiting for a refill of '+LABELS[setting.record.drink]:'chatting over an empty glass';
   if(L.phase==='waiting'&&(L.t-=dt)<=0){
    L.phase='refill';data.residentSpeech={text:"I'd like another helping, please.",until:minutes+4};
    const asked=kitchen.request({items:[setting.record.drink],x:(tableFor?.(person)||[person.g.position.x])[0],label:person.profile.name+'’s',tag:person,
     onServed:()=>{if(settings.get(person)!==setting)return;setPropPortion(setting.drink,1,{immediate:true});Object.assign(L,{phase:'sipping',t:0,plan:MEALS.refill});data.residentSpeech={text:"Thank you.",until:minutes+3};}});
    if(!asked)L.phase='waiting',L.t=60;
   }
  }
 }
 /** Minato's glass and meal arrive separately; only their own clocks can consume them. */
 function minato(person,setting,dt,minutes,seated){
  const r=setting.record,u=person.g.userData,service=barService();
  // Old saves' delivered flag meant both were on the table. Migrate it once.
  r.foodDelivered??=r.delivered||!!r.drinkOnly;r.drinkDelivered??=r.delivered;r.paid??=r.delivered;
  r.sipped??=r.eaten||0;
  for(const part of ['food','drink'])if(r[part+'Delivered']&&!setting[part+'At']){const at={position:new THREE.Vector3()};table(person,at,part==='food'?-1:1);setting[part+'At']=new THREE.Vector3(...serviceFor(at.position.toArray(),part==='food').table);}
  const accept=(part,prop)=>{
   if(!prop||settings.get(person)!==setting){if(prop)disposeServing(prop);if(settings.get(person)===setting)setting[part+'Requested']=false;return;}
   if(!r.paid){
    if(!ledger.purchase(person.profile.name,getMinutes(),place+'-meal'+(r.drinkOnly?'-round-'+r.rounds:''),r.drinkOnly?'another '+r.drink:r.item+' + '+r.drink,mealCost(r))){disposeServing(prop);r.finished=true;service.cancel(person);return;}
    r.paid=true;
   }
   disposeServing(setting[part]);setting[part]=prop;setting[part+'At']=prop.position.clone();r[part+'Delivered']=true;
   r.delivered=r.foodDelivered&&r.drinkDelivered;
   u.residentSpeech={text:'Thank you, Thao.',until:getMinutes()+4};
  };
  if(!r.drinkDelivered&&!setting.drinkRequested){const at={position:new THREE.Vector3()};table(person,at,1);
   setting.drinkRequested=service.request({kind:DRINK_PROP[r.drink]||'oolong',table:at.position.toArray(),tag:person,onServed:p=>accept('drink',p)});}
  // Submit food after this customer's glass is down. The queue continues to serve
  // other customers and the player, without a second controller moving Thao.
  if(!r.foodDelivered&&r.drinkDelivered&&!setting.foodRequested){const at={position:new THREE.Vector3()};table(person,at,-1);
   setting.foodRequested=service.request({kind:r.item==='fish'?'hokke':r.item,table:at.position.toArray(),tag:person,onServed:p=>accept('food',p)});}
  const plan=r.drinkOnly?MEALS.round:meal||MEALS.supper;
  let f=mealState(plan,r.eaten),d=mealState(plan,r.sipped);
  const drinking=r.drinkDelivered&&d.action==='drink',eating=r.foodDelivered&&!r.drinkOnly&&f.action==='eat'&&!drinking;
  if(r.foodDelivered&&(!r.drinkOnly)&&(f.action!=='eat'||eating))r.eaten+=dt;
  if(r.drinkDelivered&&(d.action!=='drink'||drinking))r.sipped+=dt;
  f=mealState(plan,r.eaten);d=mealState(plan,r.sipped);
  // Keep one performance at a time, advancing a mouthful only while its action owns
  // the resident. Independent clocks preserve all original bites, sips and portions.
  const sip=r.drinkDelivered&&d.action==='drink',bite=r.foodDelivered&&!r.drinkOnly&&f.action==='eat'&&!sip;
  if(r.drink==='beer'&&r.drinkDelivered){const drunk=(1-d.drinkLeft)*BEER;u.tipsy=drinkUp(u.tipsy,drunk-(r.drunk||0));r.drunk=drunk;}
  u.consumeElapsed=sip?d.local:f.local;u.heldPortion=sip?d.drinkLeft:bite?1-consumptionPhase(f.local).swallow:undefined;
  u.foodPortion=r.foodDelivered?f.foodLeft:undefined;
  if(r.foodDelivered){setPropPortion(setting.food,f.foodLeft);updatePropPortion(setting.food,dt);if(setting.foodAt)setting.food.position.copy(setting.foodAt);else table(person,setting.food,-1);}
  if(r.drinkDelivered){setPropPortion(setting.drink,d.drinkLeft);updatePropPortion(setting.drink,dt);if(setting.drinkAt)setting.drink.position.copy(setting.drinkAt);else table(person,setting.drink,1);}
  setting.food.visible=seated&&r.foodDelivered&&!r.drinkOnly&&!bite;setting.drink.visible=seated&&r.drinkDelivered&&!sip;
  u.heldItem=sip?r.drink:bite?r.item:null;u.socialPose=sip?(seated?'Drink':'DrinkStanding'):bite?(seated?'Eat':'EatStanding'):seated?'Sit':'Idle_Neutral';
  u.mealState=r.delivered?'eating':r.drinkDelivered?'waiting-food':'ordered';
  u.activity=sip?'drinking '+LABELS[r.drink]+' at '+venueName:bite?'eating '+LABELS[r.item]:r.delivered?'enjoying supper':r.drinkDelivered?'waiting for '+LABELS[r.item]:'waiting for '+LABELS[r.drink];
  if(r.drinkDelivered&&d.drinkLeft<=0&&(r.drinkOnly||r.foodDelivered&&f.foodLeft<=0)){
   r.finished=true;r.nextRound=minutes+ROUND_GAP;ledger.record(person.profile.name,minutes,r.drinkOnly?'had another beer at '+place:'enjoyed '+LABELS[r.item]+' and '+LABELS[r.drink]+' at '+place);
  }
 }
 return {update(dt){
  const minutes=getMinutes(),present=getCustomers().filter(p=>p.profile.name!==staffName&&p.g.visible&&!p.g.userData.roomTransition);
  for(const p of [...settings.keys()])if(!present.includes(p))remove(p);
  for(const person of present){
   const name=person.profile.name;
   const account=ledger.account(name,minutes),taste=residentPersonality(name);account.meals??={};
   const record=account.meals[place]??={item:place==='ramen'?'ramen':taste.meal,drink:place==='ramen'?drinkFor?.(name)||'tea':(drinkFor?.(name)||taste.drink)==='beer'&&!wantsAnother(person.g.userData.tipsy,BEER)?'tea':(drinkFor?.(name)||taste.drink),delivered:false,eaten:0,finished:false};
   let setting=settings.get(person);if(setting&&setting.record!==record){remove(person);setting=null;}
   if(!setting){
    const food=createDishProp(record.item==='fish'?'hokke':record.item),drink=createDrinkProp(DRINK_PROP[record.drink]||'oolong');food.visible=drink.visible=false;room.add(food,drink);setting={record,food,drink};settings.set(person,setting);
    if(!record.delivered&&!record.finished)person.g.userData.residentSpeech={text:place==='ramen'?(drinkFor?'One ramen and a '+LABELS[record.drink]+', please.':'One ramen, please.'):'A '+LABELS[record.drink]+' and '+LABELS[record.item]+', please, Thao.',until:minutes+5};
   }
   const data=person.g.userData,seated=Number.isFinite(data.seatHeight);
   // Another round? Only beer drinkers, only after a pause, and only while there is room under the limit.
   if(record.finished&&record.drink==='beer'&&place==='izakaya'&&(record.rounds||1)<MAX_ROUNDS&&minutes>=(record.nextRound??Infinity)&&wantsAnother(data.tipsy,BEER)){
    Object.assign(record,{finished:false,delivered:false,eaten:0,drunk:0,drinkOnly:true,rounds:(record.rounds||1)+1});delete record.nextRound;
    // The empty glass stays until she brings the next; without her bar it is refilled at the counter as before.
    if(barService()){setting.drinkRequested=false;setting.foodRequested=false;Object.assign(record,{drinkDelivered:false,foodDelivered:true,paid:false,sipped:0});}else setPropPortion(setting.drink,1,{immediate:true});data.residentSpeech={text:'Thao, another beer, please!',until:minutes+5};
   }
   if(record.finished&&kitchen&&seated){linger(person,setting,data,dt,minutes);continue;}
   if(record.finished){const merry=(data.tipsy||0)>=LIMIT-1;data.socialPose=seated?'Sit':'Idle_Neutral';delete data.heldItem;delete data.heldPortion;delete data.foodPortion;delete data.consumeElapsed;data.mealState='finished';data.activity=merry?'merry after a few beers':'relaxing after '+LABELS[record.item];setting.food.visible=setting.drink.visible=false;continue;}
   if(barService()){minato(person,setting,dt,minutes,seated);continue;}
   if(!record.delivered){
    data.socialPose=seated?'Sit':'Idle_Neutral';data.mealState='ordered';data.activity=record.drinkOnly?'waiting for another beer':'waiting for '+LABELS[record.item]+' and '+LABELS[record.drink];
    // With a kitchen, the cook makes it and brings it (ramen-kitchen.js); otherwise it simply arrives.
    if(kitchen&&setting.requested!==false){
     setting.requested??=kitchen.request({items:[record.item,record.drink],x:(tableFor?.(person)||[person.g.position.x])[0],label:name+'’s',tag:person,onServed:()=>{if(settings.get(person)===setting&&!record.delivered)settle(person,record,getMinutes());}});
    }else if(!serving){serving=person;timer=2.8;}
   }else{
    record.eaten+=dt;
    const m=mealState(record.drinkOnly?MEALS.round:meal||MEALS.supper,record.eaten),drink=m.action==='drink',eat=m.action==='eat',drinkLeft=m.drinkLeft,foodLeft=m.foodLeft;
    // Each mouthful of beer goes to the head as it goes down.
    if(record.drink==='beer'){const drunk=(1-drinkLeft)*BEER;data.tipsy=drinkUp(data.tipsy,drunk-(record.drunk||0));record.drunk=drunk;}
    data.consumeElapsed=m.local;data.heldPortion=drink?drinkLeft:eat?1-consumptionPhase(data.consumeElapsed).swallow:undefined;data.foodPortion=foodLeft;
    setPropPortion(setting.food,foodLeft);setPropPortion(setting.drink,drinkLeft);updatePropPortion(setting.food,dt);updatePropPortion(setting.drink,dt);
    data.mealState='eating';data.socialPose=drink?(seated?'Drink':'DrinkStanding'):eat?(seated?'Eat':'EatStanding'):seated?'Sit':'Idle_Neutral';data.heldItem=drink?record.drink:eat?record.item:null;
    data.activity=drink?'drinking '+LABELS[record.drink]+' at '+venueName:eat?'eating '+LABELS[record.item]:record.drinkOnly?'between sips':place==='ramen'?'blowing on the noodles':'enjoying supper';
    table(person,setting.food,-1);if(setting.drinkAt)setting.drink.position.copy(setting.drinkAt);else table(person,setting.drink,1);setting.food.visible=seated&&!eat&&!record.drinkOnly;setting.drink.visible=seated&&!drink;
    if(m.done){record.finished=true;record.nextRound=minutes+ROUND_GAP;setPropPortion(setting.food,0);if(!kitchen)setPropPortion(setting.drink,0);ledger.record(name,minutes,record.drinkOnly?'had another beer at '+place:'enjoyed '+LABELS[record.item]+' and '+LABELS[record.drink]+' at '+place);}
   }
  }
  // While Thao is bringing the player a drink, izakaya-beer.js has her.
  // After last orders she is cleaning down (izakaya-hours.js); the job has her then.
  const candidate=kitchen?null:getStaff(),staff=candidate&&candidate.visible&&candidate.userData[inside]&&!candidate.userData.roomTransition&&!candidate.userData.playerService&&!(place==='izakaya'&&izakayaJob('Thao',minutes))?candidate:null;if(staff){
   const tidying=!serving&&Math.floor(minutes/6)%3!==2;
   staff.userData.serving=!!serving;staff.userData.socialPose=serving||tidying?'Use':'Idle_Neutral';
   staff.userData.activity=place==='ramen'?serving?'ladling a bowl of ramen for '+serving.profile.name:tidying?'minding the stock pots':'wiping down the ramen counter'
    :serving?'preparing '+settings.get(serving)?.record.drink+' for '+serving.profile.name:tidying?'tidying the Minato counter':'welcoming the evening guests';
  }
  if(serving&&(place!=='izakaya'||staff)&&(timer-=dt)<=0){settle(serving,settings.get(serving).record,minutes);serving=null;}
 },dispose(){for(const person of [...settings.keys()])remove(person);if(kitchen)return;const candidate=getStaff(),staff=candidate&&candidate.visible&&candidate.userData[inside]&&!candidate.userData.roomTransition?candidate:null;if(staff){delete staff.userData.serving;delete staff.userData.socialPose;}}};
}
