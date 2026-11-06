import {householdFor} from './households.js';
import {ISLAND_RESIDENT_NAMES,kitahamaHomeFor} from '../world/kitahama-layout.js';
import {KITANO_RESIDENT_NAMES,kitanoHomeFor} from './kitano-residents.js';
import {HARBOUR_OFFICE} from '../world/business-layout.js';
import {TOWN_DESTINATIONS} from '../world/town-grid.js';
import {restaurantApproach,IZAKAYA_DOOR} from '../world/dining-layout.js';
import {residentialHome} from '../world/residential-layout.js';
import {PROFILES} from './profiles.js';
import {YARD_RESIDENT_NAMES,YARD_HOMES} from '../world/yard-homes-layout.js';
import {KOBAN} from '../world/koban-layout.js';
import {SCHOOL} from '../world/school-layout.js';
import {activeHomeForResident,homeForResident} from './island-households.js';
/**
 * On the island two people live where they work: the harbour master in a bed nook in
 * his office, Officer Mori in the tatami room behind the police box.
 */
const WORKPLACE_HOMES={
 'Harbour master':()=>({door:[HARBOUR_OFFICE.door[0],HARBOUR_OFFICE.door[2]],address:'Johansson Harbour Office (the bed behind the screen)'}),
 'Officer Mori':()=>({door:[...KOBAN.door],address:KOBAN.address}),
};
// Thuan lives on Kitano-jima with Johansson and commutes by the ferry (the Harbour Line's boats, commuter-schedule.js):
// her weekday room at 1 Kitahama was dropped (docs/CAST-CONSOLIDATION.md addendum 4), so she has no room ashore to be
// put to bed in, and her home record is the Kitano house (kitano-residents.js).
export const THUAN_PROFILE={...residentialHome('Thuan'),"name":"Thuan","age":25,"role":"Sakura owner","height":1.64,"work":[-4,-25.5],"evening":restaurantApproach('izakaya'),"friend":"Thao","start":540,"close":1200,"retire":1410,"supperStart":null,"supperEnd":null};
// The walking residents. Reiko, the Bus driver and Barfly were retired in phase 4 of the consolidation (roster.js
// RETIRED): Nhung prints the paper, the Harbour master keeps his own stories, and Minato's regulars are the residents.
// Dr Kakazu retired into Nhung on 22 October 2026: she is the island doctor (clinic-hours.js), the clinic her work.
// Her work is the clinic's step (school.js: the Minato Clinic door at x 34.1, approached from B.minZ-1.4; canonical-day.js
// `clinic`). The profile's [4.3,34] was nobody's door, thirty metres west of the town hall, where she walked to open up.
const CLINIC_STEP=Object.freeze([34.1,SCHOOL.building.minZ-1.4]);
export const ACTIVE_RESIDENT_NAMES=Object.freeze(['Nhung','Chin','Mrs Sato','Harbour master','Tetsuo','Officer Mori','Thao','Thuan']);
const NEIGHBOURHOOD={
 Nhung:{friend:'Thao',role:'the island doctor',gossip:'I put Tama in the paper. He has been sitting on the entire edition ever since.',clue:'Surgery is nine to twelve and two to five. In the evening I set the town’s paper at the old Front-Row shop; Sakura sells the books now.'},
 'Mrs Sato':{friend:'Thuan',gossip:'Thuan calls her plant the assistant manager. I am still waiting for it to help with the stock.'},
 'Harbour master':{friend:'Mrs Sato',gossip:'Ms Ganaha sends the sailing list up from the terminal every morning. I check it against the harbour clock.'},
 Thao:{friend:'Thuan',gossip:'Thuan is my little sister; she takes the last boat home to Kitano-jima every night and is back on the half past eight. Nhung says I am stubborn. I say I am right.'},
 'Officer Mori':{clue:'Main Street leads straight to the harbour. I follow it on the night patrol.'},
 Chin:{clue:'Star Port is inside our repair shop. Beat my score and I will show you around.'},
};
// Existing identities and saved routines use the supplied street’s shared entrances.
export const RESIDENTS=ACTIVE_RESIDENT_NAMES.map(name=>{
 const source=name==='Thuan'?THUAN_PROFILE:PROFILES.find(p=>p.name===name);
 const diningPoint=point=>point&&point[0]===24&&point[1]>=18&&point[1]<=25?restaurantApproach('izakaya'):point;
 const shopFloor={Chin:'workshop',Tetsuo:'workshop'}[name];
 const profile={...source,...NEIGHBOURHOOD[name],work:({'Harbour master':[HARBOUR_OFFICE.door[0],HARBOUR_OFFICE.door[2]],'Officer Mori':[...KOBAN.door],Thao:IZAKAYA_DOOR,Nhung:CLINIC_STEP})[name]||diningPoint(source.work),evening:({Nhung:[.15,18.7],Chin:[.15,17.6], 'Mrs Sato':TOWN_DESTINATIONS.bus,'Harbour master':[0,-48],Tetsuo:[.15,16.5],'Officer Mori':[0,28],Thao:IZAKAYA_DOOR})[name]||diningPoint(source.evening),...residentialHome(name)};
 // The shop staff stand at their own shop's door, and where that door is depends on
 // the layout, which is not known yet. Read it when somebody asks.
 if(shopFloor)Object.defineProperty(profile,'work',{get:()=>TOWN_DESTINATIONS[shopFloor],enumerable:true,configurable:true});
 // The same for home: on the island the shop's staff live in the yard houses behind
 // Front-Row (yard-homes-layout.js); elsewhere, the Main Street flats they always had.
 if(YARD_RESIDENT_NAMES.includes(name)||WORKPLACE_HOMES[name]||kitahamaHomeFor(name)||KITANO_RESIDENT_NAMES.includes(name)){
  const yard=()=>(WORKPLACE_HOMES[name]?.()||kitahamaHomeFor(name)||kitanoHomeFor(name)||YARD_HOMES[householdFor(name)?.id]),street={home:profile.home,homeAddress:profile.homeAddress};
  Object.defineProperty(profile,'home',{get:()=>yard()?[...yard().door]:street.home,enumerable:true,configurable:true});
  Object.defineProperty(profile,'homeAddress',{get:()=>yard()?.address||street.homeAddress,enumerable:true,configurable:true});
 }
 return profile;
});
export function residentHomeDescription(name){
 const h=activeHomeForResident(name),primary=homeForResident(name);if(!h)return '';
 if(name==='Tetsuo')return 'I live at '+h.address+', behind the shop. My mother’s people were Chinens, from Kitano-jima; the workshop is home now.';
 if(name==='Thuan')return 'My home is '+primary.address+', with my husband Johansson. I come over on the half past eight boat and go home on the last one. The shop shuts on Saturdays, and on Sunday Nhung keeps it.';
 if(name==='Chin')return 'My place is at '+h.address+', bro, with my wife Thao and our daughter Vy.';
 const roommates=h.members.filter(m=>m.name!==name&&!m.secondary).map(m=>m.name),guests=h.members.filter(m=>m.secondary&&m.name!==name).map(m=>m.name);
 return 'I live at '+h.address+'.'+(roommates.length?' I share my home with '+roommates.join(' and ')+'.':'')+(guests.length?' '+guests.join(' and ')+' stays here on weekdays.':'');
}
/** Residents with an authored playable home. */
export const HOME_OWNERS=RESIDENTS.filter(p=>p.homeEntry);
// Reintroduce residents deliberately, one at a time. Thao was the first neighbour back;
// the Front-Row staff followed with their own homes in the yard behind the shop, then
// the harbour master and Officer Mori, who live at the office and the police box, and
// Mrs Sato, who comes in on the morning bus to cook the lunch ramen.
export const STREET_CAST_NAMES=Object.freeze(['Thuan','Thao','Nhung','Chin','Tetsuo','Harbour master','Officer Mori','Mrs Sato']);
export const STREET_CAST=RESIDENTS.filter(p=>STREET_CAST_NAMES.includes(p.name));
/** Everybody the town builds: the street cast. (Minato's live-in regular was retired in phase 4; nobody lives in the bar.) */
export const WORLD_CAST=[...STREET_CAST];
