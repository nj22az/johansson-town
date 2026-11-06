import {SAKURA_SHELL} from '../src/world/interiors/sakura-shell.js';

/** Close art views are derived from the loaded display, inside the actual shell. */
export function ownedDisplayView(kind,{min,max}){
 const at=min.map((n,i)=>(n+max[i])/2);
 const delta=kind==='thuanFigurine'?[-.82,.28,.72]:[-.60,.25,.50];
 const pos=at.map((n,i)=>n+delta[i]);
 if(kind==='thuanFigurine'){
  pos[0]=Math.max(SAKURA_SHELL.backWestX+.15,Math.min(SAKURA_SHELL.backEastX-.15,pos[0]));
  pos[2]=Math.max(SAKURA_SHELL.backZ+.15,Math.min(SAKURA_SHELL.partitionZ-.15,pos[2]));
 }
 pos[1]=Math.max(.15,Math.min(SAKURA_SHELL.ceiling-.15,pos[1]));
 return {pos,at};
}
