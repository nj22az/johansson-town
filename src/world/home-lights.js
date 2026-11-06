import {KITAHAMA,KITAHAMA_HEIGHTS,KITAHAMA_RESIDENT_HOMES} from './kitahama-layout.js';

import {registerHomeLight,setHomeLight,clearHomeLights} from '../render/window-interior.js';

/**
 * The lights in Kitahama's and Fumoto's windows follow the people who live behind them
 * (docs/RESIDENTIAL-PLAN.md: "a home's lights follow its residents").
 *
 * - Thao and Chin's house and Mrs Sato's follow the walking residents themselves: lit
 *   when one of them is in and up, dark when they are out or asleep.
 * - The other households keep a routine of their own: the auction hand is up at half
 *   past four, the bosun's house is dark every other week.
 * - A house with both (3 Kitahama: Nhung walks, Kōji and Riku keep the household's
 *   routine) is lit when either says so.
 * - Kitahama Heights is two ground-floor houses, each its own light.
 *
 * Lights only show after dark (the window shader mixes them in by its night glow), so the
 * routines can be simple: when somebody is up at home, the light is on.
 */
const H=(h,m=0)=>h*60+m;
/** Ambient households: [wake, bed] in minutes of the day; `away(day)` empties the house. */
export const HOME_ROUTINES=Object.freeze({
 'kitahama-3':{wake:H(4,30),bed:H(21,30)},
 // (4, 5, 6, 7 and 9–12 Kitahama have no routine: they are gone, phase 4 and the housing project before it.)
 'kitahama-8':{wake:H(6,30),bed:H(23,30),away:day=>Math.floor(day/7)%2===0},
 // Fumoto: farmers' hours. The Ishimines' kitchen is lit from a quarter to four, for the tofu.
 'fumoto-1':{wake:H(5,30),bed:H(21,30)},
 'fumoto-2':{wake:H(6),bed:H(22)},
 'fumoto-3':{wake:H(3,45),bed:H(21)},
 'fumoto-4':{wake:H(5,45),bed:H(22)},
 // Kitahama Heights (addendum 6 of docs/CAST-CONSOLIDATION.md): Mac in A, up for the generators and in bed by ten;
 // Ms Ganaha in B, home from the last boat's window after half past ten.
 'kitahama-flat-3':{wake:H(5),bed:H(22)},
 'kitahama-flat-4':{wake:H(6,30),bed:H(23)},
});

const between=(m,a,b)=>{a=((a%1440)+1440)%1440;b=((b%1440)+1440)%1440;return a<=b?m>=a&&m<b:m>=a||m<b;};

/** Whether an ambient household's light is on at an absolute town minute. */
export function routineLit(routine,minutes){
 if(!routine||routine.empty)return false;
 const day=Math.floor(minutes/1440),m=((minutes%1440)+1440)%1440;
 if(routine.away?.(day))return false;
 if(routine.nightCall?.(day)&&between(m,H(2),H(2,40)))return true;
 return between(m,routine.wake,routine.bed);
}

/** Whether a walking resident is at home and up (their profile's hours say when they sleep). */
export function residentUpAtHome(person,minutes){
 const u=person?.g?.userData;if(!u)return false;
 if(u.indoors!=='home'&&!u.inHome)return false;
 if(u.sleeping)return false;
 const p=person.profile||{},m=((minutes%1440)+1440)%1440;
 if(!Number.isFinite(p.retire)||!Number.isFinite(p.start))return true;
 return between(m,p.start-75,p.retire);
}

/** The two houses' boxes, matching okinawa/kitahama-quarter.js buildHeights: each half of the body, to its roof. */
function heightsBoxes(){
 const B=KITAHAMA_HEIGHTS,y=KITAHAMA.y;
 return B.houses.map(h=>[h.id,[B.x0-.2,y,h.minZ],[B.x1+.2,y+B.height-.01,h.maxZ]]);
}

export function createHomeLights({people=()=>[]}={}){
 // One town at a time: a rebuilt town takes the table over.
 clearHomeLights();
 const homes=[];
 for(const p of KITAHAMA.plots){
  const slot=registerHomeLight([p.minX,KITAHAMA.y,p.minZ],[p.maxX,KITAHAMA.y+8,p.maxZ]);
  homes.push({id:p.id,slot,residents:KITAHAMA_RESIDENT_HOMES[p.id]||null,routine:HOME_ROUTINES[p.id]||null});
 }

 for(const [id,lo,hi] of heightsBoxes())homes.push({id,slot:registerHomeLight(lo,hi),residents:null,routine:HOME_ROUTINES[id]});
 const state=new Map();
 return {
  homes,
  /** Sets every home's light for this town minute. Cheap: a dozen lookups. */
  update(minutes){
   const list=people();
   for(const h of homes){
    // A walking resident in and up lights the house; so does the household's own routine where it has one.
    const lit=!!(h.residents?.some(name=>residentUpAtHome(list.find(p=>p.profile?.name===name),minutes)))||routineLit(h.routine,minutes);
    if(state.get(h.id)!==lit){state.set(h.id,lit);setHomeLight(h.slot,lit?1:0);}
   }
  },
  /** Which homes are lit now, for tests and the town book. */
  lit(){return homes.filter(h=>state.get(h.id)).map(h=>h.id);},
 };
}
