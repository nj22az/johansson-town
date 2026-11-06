import {stockSpec} from '../commerce/shop-stock.js';
// Stable identities, shared by wardrobe, errands and menus. No random reroll on load.
const DEFAULT={interests:['read','inspect','seat','shop'],snack:'rice',drink:'tea',meal:'rice'};
export const RESIDENT_PERSONALITIES=Object.freeze(Object.fromEntries(Object.entries({
 Chin:{source:'casual_2',top:'#477697',trousers:'#334b55',hair:'#24272b',skin:'#bd8b65',width:.96,accessory:'tool-pouch',interests:['arcade','machine','radio','inspect'],snack:'bun',drink:'beer',meal:'yakitori'},
 'Mrs Sato':{source:'female_formal',top:'#96566d',trousers:'#96566d',hair:'#c5c0ae',skin:'#c69c7c',width:1.06,accessory:'glasses',interests:['read','shop','seat','post'],snack:'tea',drink:'tea',meal:'rice'},
 'Harbour master':{source:'suit',top:'#455b6b',trousers:'#374653',hair:'#92958d',skin:'#b5805d',width:1.10,accessory:'captain',shopping:'notebook',interests:['office','fish','read','machine','phone'],snack:'rice',drink:'beer',meal:'fish'},
 Tetsuo:{source:'worker',top:'#698071',trousers:'#4a5146',hair:'#444035',skin:'#ba895d',helmet:'#737768',width:1.03,accessory:'glasses',interests:['radio','machine','arcade','inspect'],snack:'bun',drink:'beer',meal:'yakitori'},
 'Officer Mori':{source:'suit',top:'#3c5780',trousers:'#303e57',hair:'#202528',skin:'#c79872',width:.98,accessory:'police',interests:['read','phone','post','inspect'],snack:'rice',drink:'tea',meal:'rice'},
 'Bus driver':{source:'suit',top:'#437f78',trousers:'#3b514e',hair:'#61564b',skin:'#b88968',width:1.04,accessory:'driver',interests:['seat','read','phone','shop'],snack:'tea',drink:'tea',meal:'fish'},
 Thao:{source:'female_casual',top:'#bd7557',trousers:'#394b58',hair:'#292a30',skin:'#cf9b77',width:.98,accessory:'apron',interests:['shop','post','read','radio'],shopping:'soda',snack:'rice',drink:'tea',meal:'yakitori'},
 Nhung:{source:'female_casual',top:'#424552',trousers:'#74764e',hair:'#24212a',skin:'#d5a17d',width:.91,accessory:'ponytail-satchel',accent:'#ab799e',height:1.62,interests:['read','seat','post','shop'],snack:'tea',drink:'beer',meal:'rice'},
 Reiko:{source:'female_formal',top:'#a05c75',trousers:'#a05c75',hair:'#44332b',skin:'#d8ae8c',width:.96,accessory:'headband-scarf',accent:'#efe2c3',height:1.62,interests:['read','radio','phone','shop'],snack:'rice',drink:'beer',meal:'fish'},
 Thuan:{source:'thuan-mh',top:'#d8b23a',trousers:'#27304d',hair:'#1c1612',skin:'#e6c3a8',width:1.02,accessory:'ribbon',interests:['shop','seat','read','post'],snack:'tea',drink:'tea',meal:'rice',height:1.64},
 'Cold-storage kid':{source:'worker',top:'#87a5b2',trousers:'#495e71',hair:'#664634',skin:'#d4a982',helmet:'#658499',width:.90,accessory:'scarf',accent:'#ddd6ba'},
 Hana:{source:'female_formal',top:'#c58176',trousers:'#c58176',hair:'#76503e',skin:'#dcb594',width:.92,accessory:'headband',accent:'#eee0ae'},
 Daichi:{source:'casual_2',top:'#bba153',trousers:'#5d614c',hair:'#634f34',skin:'#cea276',width:.93,accessory:'satchel',accent:'#655337'},
 'Mr Fujita':{source:'suit',top:'#648a80',trousers:'#455d5c',hair:'#d2ccba',skin:'#b08461',width:1.08,accessory:'glasses'},
 Masaru:{source:'worker',top:'#a56545',trousers:'#485970',hair:'#514335',skin:'#ac7655',helmet:'#ad9264',width:1.15,accessory:'scarf',accent:'#caba8a'},
 Yoshiko:{source:'female_formal',top:'#859263',trousers:'#859263',hair:'#b3ada0',skin:'#c59b79',width:1.04,accessory:'bun-apron'},
 Emi:{source:'female_casual',top:'#c08d97',trousers:'#68657b',hair:'#775746',skin:'#d3a884',width:.95,accessory:'ponytail-satchel',accent:'#ded0ab'},
 'Mr Tanabe':{source:'suit',top:'#b9aa85',trousers:'#797565',hair:'#aaa998',skin:'#bd936e',width:1.02,accessory:'glasses'},
 Naoko:{source:'female_casual',top:'#b45a51',trousers:'#484753',hair:'#302f32',skin:'#c89977',width:.98,accessory:'headband-satchel',accent:'#7b5746'},
 Hiroshi:{source:'casual_2',top:'#778a53',trousers:'#535345',hair:'#79776a',skin:'#bb9269',width:1.12,accessory:'apron'},
 Fumiko:{source:'female_formal',top:'#9c7fac',trousers:'#9c7fac',hair:'#d6d2c8',skin:'#c69f82',width:1.08,accessory:'glasses'},
 Kenta:{source:'casual_2',top:'#78a7b8',trousers:'#546679',hair:'#825f44',skin:'#d4ac85',width:.96,accessory:'tool-pouch'},
 Yui:{source:'female_casual',top:'#66969a',trousers:'#45465e',hair:'#332d31',skin:'#d0a586',width:1.01,accessory:'headband',accent:'#e8cf85'},
 Barfly:{source:'casual_2',top:'#b74e43',trousers:'#36343a',hair:'#77766f',skin:'#b9825f',width:1.14,accessory:'hawaiian',interests:['seat','drink','radio'],snack:'yakitori',drink:'beer',meal:'yakitori',height:1.72},
}).map(([name,style])=>[name,Object.freeze({...DEFAULT,...style})])));
// Historical names address the same resident; they do not create extra townspeople.
const ALIASES=Object.freeze({Aiko:'Nhung',Nozomi:'Reiko'});
export const residentPersonality=name=>RESIDENT_PERSONALITIES[ALIASES[name]||name]||DEFAULT;

export function restoreResidentLife(saved){
 const restored={};if(!saved||typeof saved!=='object')return restored;
 for(const name of Object.keys(RESIDENT_PERSONALITIES)){
  const source=saved[name];if(!source||!Number.isSafeInteger(source.day)||!Number.isFinite(source.yen))continue;
  const record={day:source.day,yen:Math.max(0,Math.min(2400,source.yen)),purchases:[],activities:[],meals:{}};
  if(Array.isArray(source.purchases))record.purchases=source.purchases.filter(p=>p&&typeof p.id==='string'&&typeof p.item==='string'&&Number.isFinite(p.cost)&&p.cost>=0).slice(-24).map(p=>({id:p.id.slice(0,160),item:p.item.slice(0,160),cost:p.cost}));
  if(Array.isArray(source.activities))record.activities=source.activities.filter(s=>typeof s==='string').slice(-8).map(s=>s.slice(0,180));
  for(const place of ['market','izakaya','ramen']){
   const meal=source.meals?.[place];if(!meal||!['bun','rice','tea','ramen','fish','yakitori'].includes(meal.item))continue;
   record.meals[place]={stockClaim:meal.stockClaim&&['bun','rice','tea'].includes(meal.stockClaim.item)&&Number.isSafeInteger(meal.stockClaim.unitCost)?{item:meal.stockClaim.item,unitCost:meal.stockClaim.unitCost}:null,item:meal.item,drink:meal.drink==='beer'?'beer':'tea',delivered:meal.delivered===true,finished:meal.finished===true,started:Number.isFinite(meal.started)?meal.started:null,waited:Number.isFinite(meal.waited)?Math.max(0,Math.min(45,meal.waited)):0,eaten:Number.isFinite(meal.eaten)?Math.max(0,Math.min(42,meal.eaten)):0};
   if(place==='izakaya'){
    const target=record.meals[place];
    for(const key of ['foodDelivered','drinkDelivered','paid','drinkOnly'])if(typeof meal[key]==='boolean')target[key]=meal[key];
    for(const key of ['sipped','drunk','rounds','nextRound'])if(Number.isFinite(meal[key])&&meal[key]>=0)target[key]=meal[key];
   }
  }
  const shopping=source.shopping;
  if(shopping&&['browse','pickup','queue','paid','finished'].includes(shopping.phase)&&Number.isFinite(shopping.started)&&(stockSpec(shopping.item)||shopping.phase==='browse'&&!shopping.picked)){
   record.shopping={phase:shopping.phase,started:shopping.started,finished:shopping.finished===true,item:stockSpec(shopping.item)?shopping.item:null,picked:shopping.picked===true,paid:shopping.paid===true,timer:Number.isFinite(shopping.timer)?Math.max(0,Math.min(3,shopping.timer)):0,position:Array.isArray(shopping.position)&&shopping.position.length===3&&shopping.position.every(n=>Number.isFinite(n)&&Math.abs(n)<7)?shopping.position:null};
  }
  restored[name]=record;
 }return restored;
}

// A resident's daily spending is separate from the player's wallet and inventory.
// The bounded record survives room changes and saves; repeat delivery is idempotent.
export function createResidentLedger(getState=()=>null){
 const fallback={};
 function account(name,minutes){
  const state=getState()||fallback,day=Math.floor(minutes/1440);
  state.residentLife??={};let record=state.residentLife[name];
  if(!record||record.day!==day)record=state.residentLife[name]={day,yen:2400,purchases:[],activities:[]};
  return record;
 }
 return {account,
  purchase(name,minutes,id,item,cost){
   const record=account(name,minutes);
   if(record.purchases.some(p=>p.id===id))return true;
   if(!Number.isFinite(cost)||cost<0||record.yen<cost)return false;
   if(cost===0)return true;
   record.yen-=cost;record.purchases.push({id,item,cost});record.purchases=record.purchases.slice(-24);return true;
  },
  record(name,minutes,activity){const record=account(name,minutes);record.activities.push(activity);record.activities=record.activities.slice(-8);},
 };
}
