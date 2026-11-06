import {groundHeight} from '../world/layout.js';
import {buildPlane,AIRPORT_ISLAND} from '../world/airport-island.js';
import {airportWorld} from '../world/airport-ground.js';
import {AIRPORT_FERRY,AIRPORT_FERRY_PORTS,registerAirportFerryPier} from '../world/airport-ferry.js';
import {createFerryRun} from '../world/ferry.js';
import {buildQuickCrossings,QUICK_CROSSING} from '../world/ferry-quick-crossing.js';
import {nextSailing,timetableBerth,ferryTimetableText,placeName,FERRY_WARNING_MINUTES} from '../world/ferry-timetable.js';
import {serviceTime} from '../people/commuter-schedule.js';
import {crewRoute} from '../people/ferry-crew-walk.js';
import {GANGWAY_Z,GANGWAY_LENGTH,FERRY_RAMP,FERRY_DECKS,FERRY_HULL} from '../world/ferry-model.js';
import * as THREE from '../../vendor/three.module.js';
import {AIRPORT_LANDING,AIRPORT_HEIGHT,AIRPORT_COUNTER} from '../world/airport-ground.js';
import {islandState,buyFerry,FERRY_FARE,ferryArrival,buyFlight,checkIn,boardFlight,flightArrival,finishRepair,completeProject,DEVELOPMENT_PROJECTS,projectReady,stamp,flightTimes} from './services.js';
export const NAHA_ARRIVALS={id:'naha-airport-arrivals',title:'Naha Commuter Arrivals',jp:'Naha Commuter Arrivals',sub:'RETURN CONNECTION · KITANO-JIMA',x:AIRPORT_COUNTER[0],z:AIRPORT_COUNTER[1],exitPosition:[AIRPORT_COUNTER[0],AIRPORT_HEIGHT,AIRPORT_COUNTER[1]],entryFacing:0,line:'A small domestic arrivals room. Your return ticket takes you back to Kitano-jima.'};
/**
 * Ticketing and the physical ferry crossing. The Minato Maru keeps her timetable (world/ferry-timetable.js; the owner,
 * 21 October 2026: she "doesn't have to wait for Nils"): nothing here asks her to sail or holds her. If he is aboard when
 * she sails he crosses with her on his own feet; two minutes before, he is offered Go ashore or Stay aboard; if he is on
 * her gangway or ramp as it closes he is walked off to the nearer end. Mid-crossing saves retain the last safe shore.
 * `aboard()` says whether he stands on her decks.
 */
export function createIslandPlay({world,player,camera,activities,aboard=()=>false,getMinutes,getRain,passTime,place,enterNaha,leaveNaha,register=()=>{},veil=run=>run()}){
 let ride=null,observedVoyage=0;const a=activities,state=a.state,s=islandState(state);
 const thuan=world.people.find(p=>p.profile?.name==='Thuan'||p.g.userData.name==='Thuan')?.g;if(thuan)thuan.userData.alternativeOutfit=['nozomi','sailor'].includes(state.thuanOutfit)?state.thuanOutfit:'clothes';
 const ferryRun=world.ferry||(world.ferry=createFerryRun({parent:world.group,colliders:world.colliders})),boat=ferryRun.ferry;ferryRun.parkAt(timetableBerth(getMinutes()));ferryRun.keepTimetable();
 // His walk off her (Go ashore, or off the gangway as it closes): points in her frame (`local`) or the world's (`world`), walked by game.js.
 let walk=null,choice=null,voyage=null;
 registerAirportFerryPier({parent:world.group,register,onBoard:()=>ferry(false)});
 const landingSigns=buildQuickCrossings({parent:world.group,colliders:world.colliders,register,onUse:location=>quickCrossing(location)});
 const aircraft=buildPlane();aircraft.name='Boarded commuter aircraft';aircraft.userData.dynamicProp=true;aircraft.visible=false;world.group.add(aircraft);
 const result=(title,r,back)=>{a.save();if(!r.ok){a.menu(title,r.message,[['Back',back]]);return false;}return true;};
 // Passengers ride on the open upper deck, not among the cars (ferry-ship.js FERRY_DECKS.passenger).
 function standOnFerry(){boat.updateWorldMatrix(true,false);player.position.copy(new THREE.Vector3(...(boat.userData.passengerDeck||[1.3,boat.userData.deckY??1.01,.2])).applyMatrix4(boat.matrixWorld));}
 /** Her way off at the berth she lies at: the gangway at Minato, the bow ramp at Kitano-jima, in her frame then the shore's. */
 function exitRoute(){
  const deck=FERRY_DECKS.car.y,port=AIRPORT_FERRY_PORTS[ferryRun.berth],shore=[port.landing[0],port.height,port.landing[1]];boat.updateWorldMatrix(true,false);const at=boat.worldToLocal(player.position.clone()).toArray();
  const door=ferryRun.berth==='town'?[3.25,deck,GANGWAY_Z]:[0,deck,FERRY_HULL.length/2-1.05];
  const plan=crewRoute(at,door,{obstacles:ferryRun.vehicleObstacles?.()||[]});
  const inboard=plan.ok?plan.path.slice(1):[{pos:door}];
  return [...inboard.map(p=>({local:p.pos,climb:!!p.climb})),{world:shore}];
 }
 /** Go ashore: walked from wherever he is aboard to the quay end of her gangway (or off her ramp). */
 function goAshore(){if(!aboard()||walk)return false;choice=ferryRun.operation?.id??null;walk={why:'ashore',route:exitRoute(),index:0};return true;}
 function stayAboard(){choice=ferryRun.operation?.id??null;return true;}
 /**
  * Her access guard: a car still on its way aboard holds her (the cars are her own business); a person on the gangway
  * or the ramp as it closes is walked off to the nearer end, and only then does it move.
  */
 function clearAccess(){
  if(world.traffic?.loadingVehicles||ferryRun.loadingVehicles)return 'A vehicle is still on the loading route.';
  if(walk)return 'Walking a passenger off the '+(ferryRun.berth==='town'?'gangway':'ramp')+'.';
  boat.updateWorldMatrix(true,true);
  const deck=FERRY_DECKS.car.y,port=AIRPORT_FERRY_PORTS[ferryRun.berth],shore=[port.landing[0],port.height,port.landing[1]];
  const onSurface=(object,length,width,height)=>{
   if(!object)return null;const p=object.worldToLocal(player.position.clone());
   return p.x>=-width/2&&p.x<=width/2&&p.z>=0&&p.z<=length&&Math.abs(p.y-height)<.35?p:null;
  };
  const gangway=boat.userData.gangway,q=gangway?.worldToLocal(player.position.clone());
  const onGangway=q&&q.x>=0&&q.x<=GANGWAY_LENGTH&&Math.abs(q.z)<.7&&Math.abs(q.y-.03)<.35;
  if(onGangway){walk={why:'gangway',route:q.x<GANGWAY_LENGTH/2?[{local:[3.25,deck,GANGWAY_Z]}]:[{world:shore}],index:0};return 'Clearing the passenger gangway before it is stowed.';}
  const leaf=onSurface(boat.userData.ramp,FERRY_RAMP.leaf,FERRY_RAMP.width,.07),flap=onSurface(boat.userData.flap,FERRY_RAMP.flap,FERRY_RAMP.flapWidth,.05);
  if(leaf||flap){
   const progress=leaf?leaf.z:FERRY_RAMP.leaf+flap.z;
   const toe=boat.userData.flap.localToWorld(new THREE.Vector3(0,.05,FERRY_RAMP.flap+.6));
   walk={why:'ramp',route:progress<(FERRY_RAMP.leaf+FERRY_RAMP.flap)/2?[{local:[0,deck,FERRY_HULL.length/2-1.05]}]:[{world:ferryRun.berth==='airport'?shore:[toe.x,groundHeight(toe.x,toe.z),toe.z]}],index:0};
   return 'Clearing the bow ramp before it is raised.';
  }
  return true;
 }
 /**
  * The quick crossing (the creator, 2026-10-13: "Include a quick travel point at the docks to travel to the island and
  * back"; "quick crossing should be free it's only Johansson who can do it, npcs need to go by ferry"): his own way across
  * from the landing sign at either end (ferry-quick-crossing.js) to the one at the other. No fare and no wait, and the
  * Minato Maru, her cars and her passengers are left as they are: the residents still go by ferry.
  */
 function quickCrossing(location){
  if(ride||aboard())return;const q=QUICK_CROSSING[location];
  ride={kind:'quick',location,elapsed:0,duration:1};
  // Behind the veil Kitano-jima is finished before he is put there (world/kitano-on-demand.js).
  void veil(()=>{
   const arrive=()=>{ride=null;s.journey.location=location;a.save();place(...q.stand,q.ground,q.facing);};
   return location==='airport'&&world.kitano&&!world.kitano.loaded?world.kitano.prepare().then(arrive):arrive();
  });
 }
 function fly(location){a.close();const ground=airportWorld(0,-4),air=airportWorld(95,-4);ride={kind:'flight',from:location==='naha'?ground:air,to:location==='naha'?air:ground,location,elapsed:0,duration:12};aircraft.visible=true;a.save();}
 /**
  * The window, the boarding point and the purser: her timetable and the next sailing from here. Aboard, or with her
  * alongside and her gangway out, he goes aboard (or stays); otherwise he can wait for the next boat, which passes the
  * time to a few minutes before it, as waiting for a flight does. She never waits for him.
  */
 function ferry(home=false){
  const j=s.journey,now=getMinutes(),from=home?'airport':'town',next=nextSailing(now,from),here=ferryRun.berth===from&&(ferryRun.phase==='waiting'&&!ferryRun.operation||['alongside','preparing','securing'].includes(ferryRun.operation?.stage));
  const title=home?'Kitano-jima → Minato':'Minato → Kitano-jima',ticket=!home&&!j.roundTrip&&FERRY_FARE;
  const text=ferryTimetableText(now)+'\nPassengers ride the upper deck; cars go on the car deck below. You can walk her decks and go below throughout.\n'
   +(FERRY_FARE?'Return fare ¥'+FERRY_FARE+'. The return journey remains valid until used.':'No fare while the game is being built: passengers sail free.')
   +'\nMs Ganaha keeps the ticket window from noon to 22:15; before noon the deck hand sells tickets at the gangway on the outer pier.';
  const buttons=[];
  if(ticket)buttons.push(['Buy return ticket · ¥'+FERRY_FARE,()=>{if(!result('Airport ferry',buyFerry(state,getMinutes()),()=>ferry(home)))return;ferry(home);}]);
  else if(aboard())buttons.push(['Stay aboard for the '+serviceTime(next.at),()=>{if(!home&&!j.roundTrip)buyFerry(state,getMinutes());stayAboard();a.close();}]);
  else if(here&&next.wait<=30)buttons.push(['Go aboard for the '+serviceTime(next.at)+' to '+placeName(next.sailing.to),()=>{if(!home&&!j.roundTrip)buyFerry(state,getMinutes());a.close();standOnFerry();a.save();}]);
  else if(next)buttons.push(['Wait for the '+serviceTime(next.at)+' boat',()=>{if(!home&&!j.roundTrip)buyFerry(state,getMinutes());a.close();
   const wait=Math.max(0,next.wait-FERRY_WARNING_MINUTES-3);if(wait>0)passTime(wait);const port=AIRPORT_FERRY_PORTS[from];place(...port.landing,port.height);a.save();}]);
  buttons.push(['Stay here',a.close]);
  a.menu(title,text,buttons);
 }
 function counter(){const j=s.journey,now=getMinutes(),times=flightTimes(state).map(stamp).join(' · ');const buttons=[];if(j.ticket===null)buttons.push(['Buy Naha return ticket · ¥800',()=>{if(result('Commuter flight',buyFlight(state,getMinutes(),getRain()),counter))counter();}]);else if(!j.checked)buttons.push(['Check in with one cabin bag',()=>{if(result('Check-in',checkIn(state,getMinutes(),getRain()),counter))counter();}]);else buttons.push(['Board the Naha commuter flight',()=>{const r=boardFlight(state,getMinutes(),getRain());if(r.wait){a.menu('Waiting for the commuter flight',r.message,[['Wait until departure',()=>{passTime(r.wait);counter();}],['Keep exploring',a.close]]);return;}if(!result('Boarding',r,counter))return;fly('naha');}]);buttons.push(['Back to the passenger walkway',a.close]);a.menu('Kitano-jima Airport','Island commuter service · 1997 · Terminal district expanding\nDepartures: '+times+'\nCheck-in closes ten minutes before departure.\n'+(getRain()?'Heavy rain: flights suspended; tickets remain valid.':'Weather permitting, twin-prop aircraft serve Naha.')+(j.ticket!==null?'\nYour flight: '+stamp(j.ticket)+(j.checked?' · checked in':' · check-in required'):''),buttons);}
 function projects(){const buttons=DEVELOPMENT_PROJECTS.filter(p=>!s.projects.includes(p.id)).map(p=>[p.title+' · ¥'+p.budget,()=>{const r=completeProject(state,p.id,getMinutes());if(result('Island development',r,projects))projects();}]);buttons.push(['Back to town',a.close]);a.menu('Island development programme','Town treasury: ¥'+s.treasury+'\nCompleted: '+(s.projects.join(', ')||'none')+'\n\n'+DEVELOPMENT_PROJECTS.map(p=>p.title+'\n'+p.text+'\n'+(s.projects.includes(p.id)?'Completed':projectReady(state,p)?'Service requirement met':'Needed: '+({repair:'complete the airport radio service at the docks',flight:'complete an outbound commuter flight',visits:'make two airport ferry visits'}[p.requires]))).join('\n\n')+'\n\nEvery completed project files its decision, works order, completion, invoice, payment and ledger posting at the Community Hall.',buttons);}
 function action(kind,title,data){if(ride&&!ride.afoot)return true;if(ride&&['airport-ferry','airport-return','airport-counter'].includes(kind))return true;if(kind==='airport-shop'){const items=data.items||[[data.item,data.price]];a.menu(title,data.line||'A kiosk on the airport plaza, beside check-in, for travellers waiting for their flight.',[...items.map(([item,price])=>['Buy '+item+' · ¥'+price,()=>{if(!a.spend(price))return;state.inventory.push(item);a.save();a.close();}]),['Keep exploring',a.close]]);return true;}if(kind==='airport-ferry'){ferry();return true;}if(kind==='airport-return'){ferry(true);return true;}if(kind==='airport-counter'){counter();return true;}if(kind==='island-projects'){projects();return true;}if(kind==='island-repair'){a.menu('Airport ground-service radio','Tetsuo supervises a service test: isolate the supply, inspect the cable, check the reference signal and record the result.',[[s.repair?'Review completed test':'Complete the supervised service test',()=>{finishRepair(state,getMinutes());a.save();passTime(15);a.menu('Airport radio service complete','The work order, test sheet and maintenance posting are filed in the Community Hall. The radio can return to service.',[['Back to the docks',a.close]]);}],['Leave it for now',a.close]]);return true;}if(kind==='island-shop'){a.menu('Hoshizaki General Store','Rice crackers, island tea and postcards. The fishing families collect their daily supplies here.',[['Buy island tea · ¥100',()=>{if(!a.spend(100))return;state.inventory.push('Hoshizaki island tea');a.save();a.close();}],['Ask about the village',()=>a.menu('Hoshizaki','Fishing boats land their catch each morning. The family guesthouse opens when the town completes its visitor programme.',[['Thank you',a.close]])],['Keep walking',a.close]]);return true;}if(kind==='island-bus'){a.menu('Coastal Harbour Line',s.projects.includes('bus')?'The local coastal service returns to Minato. Town-funded service; no fare.':'The village bus service awaits the town development programme.',s.projects.includes('bus')?[['Ride back to Minato',()=>{a.close();passTime(30);place(0,30);}],['Keep walking',a.close]]:[['Keep walking',a.close]]);return true;}return false;}
 ferryRun.setAccessGuard?.(clearAccess);
 /**
  * Her arrivals. With him aboard, the crossing takes the advertised minutes on his clock (the timetable's contract,
  * ferry-sailing-profile.js): the time she took is topped up to them as she lands him, and he is recorded ashore there.
  */
 function observeVoyages(){
  for(const event of ferryRun.completedVoyages||[]){
   if(event.sequence<=observedVoyage)continue;observedVoyage=event.sequence;
   if(!aboard()||voyage!==event.id)continue;voyage=null;
   const from=Number.isFinite(event.departs)?event.departs:event.startedMinute,passed=Math.max(0,getMinutes()-from);
   if(passed<AIRPORT_FERRY.duration)passTime(AIRPORT_FERRY.duration-passed);
   ferryArrival(state,event.destination,getMinutes());a.save();
  }
 }
 function tick(dt){
  world.airportIsland?.setDepartures(flightTimes(state));world.islandLandscape?.update(state,getMinutes());world.traditionalGarden?.update(getMinutes()*60);world.shoppingLane?.update(getRain());
  observeVoyages();
  // The landing sign beside where she lies reads 出港 · DEPARTING from two minutes before she sails until she has gone.
  const leaving=ferryRun.departing;for(const from of ['town','airport'])landingSigns.setDeparting(from,leaving?.from===from?serviceTime(leaving.at):null);
  // Aboard when the clock jumped (he slept or waited aboard): she was put where her timetable has her and he with her,
  // so his journey is recorded at that shore.
  if(aboard()&&(!ferryRun.operation||ferryRun.operation.stage==='alongside')&&ferryRun.phase==='waiting'&&['town','airport'].includes(s.journey.location)&&s.journey.location!==ferryRun.berth){ferryArrival(state,ferryRun.berth,getMinutes());a.save();}
  // Aboard as she leaves the berth: this voyage is his (he crosses on his own feet; game.js carries him with her).
  const op=ferryRun.operation;
  if(op&&['letting-go','departing','passage'].includes(op.stage)&&aboard()&&voyage!==op.id){
   voyage=op.id;
   // Kitano-jima is built while she takes him there (world/kitano-on-demand.js), a step at a time.
   if(op.destination==='airport')void world.kitano?.prepare();
  }
  if(choice!==null&&choice!==op?.id&&!ferryRun.departing)choice=null;
  if(!ride||ride.kind==='quick')return;
  if(ride.kind!=='flight')return;
  ride.elapsed+=Math.max(0,dt);const t=Math.min(1,ride.elapsed/ride.duration),u=t*t*(3-2*t);
  const x=ride.from[0]+(ride.to[0]-ride.from[0])*u,z=ride.from[1]+(ride.to[1]-ride.from[1])*u,y=2+(ride.location==='naha'?u*u:(1-u)*(1-u))*22;
  aircraft.position.set(x,y,z);aircraft.rotation.y=AIRPORT_ISLAND.yaw;player.position.set(x,y+.7,z);camera.position.set(x-9,y+6,z+13);camera.lookAt(x,y+1,z);
  if(t>=1){const destination=ride.location;ride=null;aircraft.visible=false;passTime(45);flightArrival(state,destination,getMinutes());place(...AIRPORT_COUNTER);a.save();if(destination==='naha')enterNaha();}
 }
 /** The walk he is on (game.js steps it): the next point in the world, and done() when he reaches the end. */
 function walkTarget(){
  if(!walk)return null;const p=walk.route[walk.index];if(!p){walk=null;return null;}
  if(p.world)return {at:new THREE.Vector3(...p.world),climb:false,shore:true};
  boat.updateWorldMatrix(true,false);return {at:boat.localToWorld(new THREE.Vector3(...p.local)),climb:!!p.climb,shore:false};
 }
 return {action,boat,goAshore,stayAboard,walkTarget,landingSigns,
  walkReached(){if(walk&&++walk.index>=walk.route.length)walk=null;},cancelWalk(){walk=null;},get walking(){return !!walk;},
  /** The Go ashore / Stay aboard prompt: aboard, two minutes before she sails, until he has chosen. */
  get departurePrompt(){const d=ferryRun.departing;if(!d||walk||!aboard()||choice===ferryRun.operation?.id||d.stage==='closing-access')return null;return {at:d.at,to:d.to,time:serviceTime(d.at),place:placeName(d.to)};},
  get phase(){return ride?.kind||null;},get active(){return !!ride;},
  get cinematic(){return !!ride&&!ride.afoot;},tick,
  returnFlight(){a.close();s.journey.location='airport';leaveNaha();fly('airport');},
  recover(){if(s.journey.location==='airport'){place(...AIRPORT_LANDING,AIRPORT_FERRY_PORTS.airport.height);}else if(s.journey.location==='naha')enterNaha();},
  snapshot(){return {location:s.journey.location,cinematic:!!ride&&!ride.afoot,ferry:{berth:ferryRun.berth,destination:ferryRun.destination,progress:ferryRun.crossingProgress,departing:ferryRun.departing,next:nextSailing(getMinutes(),ferryRun.berth)},crossing:ride?{destination:ride.location,progress:ride.elapsed/ride.duration}:voyage!==null&&ferryRun.operation?.id===voyage?{destination:ferryRun.destination,progress:ferryRun.crossingProgress??0}:null,ticket:s.journey.ticket,checked:s.journey.checked,projects:s.projects,treasury:s.treasury};}
 };
}
