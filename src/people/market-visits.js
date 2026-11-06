import {PROFILES} from './profiles.js';
import {homeRoutine} from './home-life.js';
export const RAMEN_VISITS=Object.freeze({
 Chin:[555,660], 'Harbour master':[615,720], 'Mrs Sato':[675,780],
 Thao:[780,840], Tetsuo:[795,900], Nhung:[855,960],
 'Officer Mori':[1140,1255],
});
// A small, repeatable daily shuffle. Loading a save or opening the shop does not
// reroll customers. Long gaps leave Thuan time for the player and her counter.
const CUSTOMERS=['Mrs Sato','Nhung','Chin','Tetsuo','Harbour master'];
const cache=new Map();
export function marketVisitsForDay(minutes){
 const day=Math.floor(minutes/1440);if(cache.has(day))return cache.get(day);
 let seed=(Math.imul(day+17,2654435761)^0x5a4b2f19)>>>0;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const names=[...CUSTOMERS];for(let i=names.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[names[i],names[j]]=[names[j],names[i]];}
 const windows=Array.from({length:5},(_,i)=>{const start=550+i*120+Math.floor(random()*24);return [start,start+90];});
 const overlap=(a,b)=>a[0]<b[1]&&a[1]>b[0];
 function choose(index,remaining,visits){
  if(index===windows.length)return visits;
  for(const name of remaining){const profile=PROFILES.find(p=>p.name===name),ramen=RAMEN_VISITS[name];
   // Night workers keep their sleep and breakfast. Assign another shopper to
   // these early windows so the daily shuffle retains five usable errands.
   if(profile&&[windows[index][0],windows[index][1]-1].some(m=>['sleep','wake','breakfast','prepare'].includes(homeRoutine(profile,m).id)))continue;
   if(ramen&&overlap(windows[index],ramen)||profile&&overlap(windows[index],[profile.supperStart,profile.supperEnd]))continue;
   const found=choose(index+1,remaining.filter(n=>n!==name),{...visits,[name]:Object.freeze(windows[index])});if(found)return found;
  }return null;
 }
 const visits=choose(0,names,{})||{};
 const result=Object.freeze(visits);cache.set(day,result);if(cache.size>3)cache.delete(cache.keys().next().value);return result;
}

// Meals are served at Inakaya. Every Sakura visit is now a retail errand.
export function marketVisitPurpose(){return 'goods';}
