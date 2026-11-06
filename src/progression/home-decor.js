import {restoreHomeItems} from '../build/home-furniture.js';
// Small, saved choices for Johansson's real room; rewards come from island life.
export const HOME_WALLS=Object.freeze([
 {id:'cream',name:'Island cream',colour:0xf1e9d6},
 {id:'harbour',name:'Harbour blue',colour:0xd4e5e8},
 {id:'garden',name:'Garden green',colour:0xdde5cb},
]);
export const HOME_TEXTILES=Object.freeze([
 {id:'indigo',name:'Indigo',colour:0x395777},
 {id:'coral',name:'Coral',colour:0xb86d61},
 {id:'leaf',name:'Leaf green',colour:0x638574},
]);
export function unlockedHomeKeepsakes(state={}){
 const items=[{id:'postcard',name:'Swedish harbour postcard',text:'A little reminder of the shore you came from.'}];
 if(state.fish>0)items.push({id:'shell',name:'Fishing-pier shell',text:'A shell found after your first catch.'});
 if(state.quest>=3)items.push({id:'cat',name:'Tama thank-you cat',text:'Nhung’s small clay cat, to thank you for bringing Tama home.'});
 if(state.kenjiEscort==='done')items.push({id:'radio',name:'Workshop miniature radio',text:'Chin’s little radio case, made from a spare part after your workshop walk.'});
 return items;
}
export function restoreHomeDecor(raw){
 const data=raw&&typeof raw==='object'?raw:{};
 const items=restoreHomeItems(data.items);
 return {wall:HOME_WALLS.some(c=>c.id===data.wall)?data.wall:'cream',
  textile:HOME_TEXTILES.some(c=>c.id===data.textile)?data.textile:'indigo',
  keepsake:['postcard','shell','cat','radio'].includes(data.keepsake)?data.keepsake:'postcard',
  ...(items.length?{items}:{})};
}
export function setHomeDecor(state,key,id){
 const available=key==='wall'?HOME_WALLS:key==='textile'?HOME_TEXTILES:key==='keepsake'?unlockedHomeKeepsakes(state):[];
 if(!available.some(c=>c.id===id))return false;
 state.homeDecor={...restoreHomeDecor(state.homeDecor),[key]:id};return true;
}
