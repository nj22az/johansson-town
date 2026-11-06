import {createRoomWalk,atDestination} from './room-walk.js';
import {residentPlan} from './social.js';
import {TOWN_DESTINATIONS} from '../world/town-grid.js';
import {fileDocument} from '../office/archive.js';

const SHELVES=[[-3.1,0,-.8],[1.8,0,-2.1],[2.7,0,1.4]],COUNTER=[-1.1,0,1.25];
const LINES=[['Have you any books about the sea?','Try the island histories. The reading copy is on the table.'],['I liked the one you recommended last time.','Then let me find something for your next quiet evening.'],['Just browsing today, Nhung.','Of course. Take your time; the window chair is free.']];
/** Borrow the real island residents; never create duplicate customer avatars. */
export function createBookshopCustomers({world,parent,getLayout,getPlayerPosition,collides,getState,ledger,onBorrow=()=>{},save=()=>{}}){
 const borrowed=new Map(),walkers=new Map();let active=false,clock=0,counter=null;
 const occupied=(x,z,person)=>{const player=getPlayerPosition();return player&&Math.hypot(player.x-x,player.z-z)<.7||world.people.some(p=>p!==person&&p.g.visible&&(p.g.userData.inBookshop||p.g.userData.inWorkplace==='frontrow')&&Math.hypot(p.g.position.x-x,p.g.position.z-z)<.65);};
 function move(person,target,dt){
  let path=walkers.get(person);if(!path){path={walker:createRoomWalk((x,z,r)=>collides(x,z,r)||occupied(x,z,person),{bounds:getLayout().bounds}),stalled:0};walkers.set(person,path);}
  const before=person.g.position.clone();let arrived=path.walker.move(person,target,dt);
  if(occupied(person.g.position.x,person.g.position.z,person)){person.g.position.copy(before);arrived=false;}
  // The navigation raster includes other people. Refresh it after a short wait:
  // a customer moving away or a player stepping into an aisle changes that route.
  if(!arrived&&person.g.position.distanceTo(before)<.0001){path.stalled+=dt;if(path.stalled>=.65){path.walker.clear();path.stalled=0;}}
  else path.stalled=0;
  return arrived;
 }
 function restore(person,remaining=false){const saved=borrowed.get(person);if(!saved)return;saved.parent.add(person.g);person.g.position.copy(saved.position);person.g.quaternion.copy(saved.rotation);person.g.userData.hit.inside=saved.inside;for(const k of ['inBookshop','roomTransition','socialPose','residentSpeech','chatHold','chat'])delete person.g.userData[k];person.g.userData.indoors=remaining?'bookshop':null;person.g.visible=!remaining;borrowed.delete(person);walkers.get(person)?.walker.clear();walkers.delete(person);if(counter===person){counter=null;for(const p of world.people)delete p.g.userData.bookshopServing;}}
 function sold(person){const state=getState(),day=Math.floor(clock/1440),key=day+':'+person.profile.name;state.bookshop??={sales:[]};const sales=state.bookshop.sales??=[];
  if(sales.some(s=>s.key===key))return;
  if(!ledger.purchase(person.profile.name,clock,'bookshop-paperback','Second-hand paperback',300))return;
  sales.push({key,minute:clock,buyer:person.profile.name,item:'Second-hand paperback',amount:300});state.bookshop.sales=sales.filter(s=>s.minute>clock-365*1440);
  const transaction='BOOKS-'+key,receipt=fileDocument(state,{type:'Receipt',organisation:'Front-Row Books',author:'Nhung',title:'Paperback sale — '+person.profile.name,source:transaction,transaction,amount:300,text:'FRONT-ROW BOOKS\nSecond-hand paperback: ¥300\nBuyer: '+person.profile.name+'\nCash received: ¥300\nThank you for shopping locally.'},clock);
  if(receipt)fileDocument(state,{type:'Ledger entry',organisation:'Front-Row Books',author:'Nhung',title:'Bookshop sales posting',source:transaction+'-ledger',transaction,links:[receipt.id],amount:300,text:receipt.text},clock);ledger.record(person.profile.name,clock,'Bought a second-hand paperback from Nhung');save();
 }
 function update(dt,minutes){clock=minutes;if(!active)return;const layout=getLayout(),entrance=layout.spawn,day=Math.floor(minutes/1440);
  for(const person of world.people){if(borrowed.has(person)||person.g.userData.playerControlled||residentPlan(person.profile,minutes,false,getState()).place!=='bookshop'||!atDestination(person,'bookshop',TOWN_DESTINATIONS.books))continue;
   if(occupied(entrance[0],entrance[2],person))continue;const settled=person.g.userData.indoors==='bookshop'&&!person.g.userData.justArrived;onBorrow(person,minutes);const saved={parent:person.g.parent,position:person.g.position.clone(),rotation:person.g.quaternion.clone(),inside:person.g.userData.hit.inside,phase:'browse',shelf:(world.people.indexOf(person)+day)%SHELVES.length,wait:0,turn:0,buy:(world.people.indexOf(person)+day)%2===0,chat:(world.people.indexOf(person)+day)%3===0,chatTurns:0};
   const shelf=SHELVES[saved.shelf],spawn=settled&&!collides(shelf[0],shelf[2],.32)&&!occupied(shelf[0],shelf[2],person)?shelf:entrance;
   borrowed.set(person,saved);parent.add(person.g);person.g.position.set(...spawn);person.g.visible=true;person.g.userData.inBookshop=true;person.g.userData.indoors='bookshop';person.g.userData.hit.inside=true;
  }
  for(const [person,saved] of borrowed){const g=person.g;if(g.userData.playerConversation)continue;g.userData.place='bookshop';
   if(residentPlan(person.profile,minutes,false,getState()).place!=='bookshop')saved.phase='leave';
   if(saved.phase==='leave'){g.userData.activity='leaving the bookshop';delete g.userData.socialPose;if(move(person,entrance,dt)){const state=getState();state.bookshop??={sales:[]};state.bookshop.completed??=[];const key=day+':'+person.profile.name;if(!state.bookshop.completed.some(v=>v.key===key))state.bookshop.completed.push({key,minute:minutes});state.bookshop.completed=state.bookshop.completed.filter(v=>v.minute>minutes-365*1440);restore(person);save();}continue;}
   if(saved.phase==='browse'){g.userData.activity='browsing the bookshelves';if(!move(person,SHELVES[saved.shelf],dt))continue;g.userData.socialPose='Think';saved.wait+=dt;if(saved.wait<14+saved.shelf*4)continue;delete g.userData.socialPose;saved.wait=0;saved.turn++;if(saved.turn<2){saved.shelf=(saved.shelf+1)%SHELVES.length;continue;}saved.phase=saved.buy||saved.chat?'counter':'leave';}
   if(saved.phase==='counter'){g.userData.activity=saved.buy?'taking a book to Nhung':'asking Nhung for a recommendation';if(counter&&counter!==person)continue;counter=person;const bookseller=world.people.find(p=>p.profile.name==='Nhung');if(bookseller)bookseller.g.userData.bookshopServing=true;if(!move(person,COUNTER,dt))continue;const aya=world.people.find(p=>p.profile.name==='Nhung'&&p.g.visible&&p.g.userData.inWorkplace==='frontrow');if(!aya||aya.g.userData.playerConversation||aya.g.userData.chatHold||Math.hypot(aya.g.position.x-g.position.x,aya.g.position.z-g.position.z)>1.8)continue;
    if(saved.chat){saved.wait+=dt;const turn=Math.floor(saved.wait/4),lines=LINES[(day+world.people.indexOf(person))%LINES.length];if(turn<2&&turn!==saved.chatTurns-1){const speaker=turn===0?g:aya.g; speaker.userData.residentSpeech={text:lines[turn],until:minutes+4};saved.chatTurns=turn+1;g.rotation.y=Math.atan2(-(aya.g.position.x-g.position.x),-(aya.g.position.z-g.position.z));}if(saved.wait<9)continue;}
    if(saved.buy)sold(person);g.userData.residentSpeech={text:saved.buy?'Thank you, Nhung. See you soon.':'I’ll leave the reading copy here. Thank you.',until:minutes+3};counter=null;delete aya.g.userData.bookshopServing;saved.phase='leave';
   }
  }
 }
 return {enter(site,minutes){this.restore();if(!site.bookshop)return;active=true;update(0,minutes);},update,restore(){for(const person of [...borrowed.keys()])restore(person,residentPlan(person.profile,clock,false,getState()).place==='bookshop');for(const p of world.people)delete p.g.userData.bookshopServing;active=false;for(const path of walkers.values())path.walker.clear();walkers.clear();},snapshot(){return [...borrowed].map(([p,s])=>({name:p.profile.name,phase:s.phase,activity:p.g.userData.activity}));}};
}
