import {TOWN_FINDS} from './sakura-economy.js';
export const CLEANUP_SPOTS=Object.freeze([
 {id:'canal-bottle',kind:'bottle',full:[-2.7,-5.8],classic:[3.1,-23.1]},
 {id:'quay-cans',kind:'cans',full:[2.35,8],classic:[-2.8,-41]},
 {id:'park-bottle',kind:'bottle',full:[9,-16.1],classic:[4.8,18]},
 {id:'coast-parts',kind:'scrap',full:[19.4,5],classic:[-3,-32]},
 {id:'west-cans',kind:'cans',full:[-22.2,-5],classic:[3,-12]},
 {id:'workshop-parts',kind:'scrap',full:[-8,-6.7],classic:[3.2,-18]},
].map(Object.freeze));
export function restoreTownCleanup(saved){return {collected:Array.isArray(saved?.collected)?[...new Set(saved.collected.filter(id=>CLEANUP_SPOTS.some(s=>s.id===id)))]:[]};}
export function collectTownFind(state,id){
 const spot=CLEANUP_SPOTS.find(s=>s.id===id);if(!spot)return {ok:false,message:'There is nothing to collect here.'};
 state.townCleanup??=restoreTownCleanup();
 if(state.townCleanup.collected.includes(id))return {ok:false,message:'This spot is already tidy.'};
 if(state.inventory.length>=100)return {ok:false,message:'Your bag is full. Make room before picking this up.'};
 const item=TOWN_FINDS.find(i=>i.id===spot.kind);state.inventory.push(item.name);state.townCleanup.collected.push(id);return {ok:true,...item};
}
