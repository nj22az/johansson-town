import {KITAHAMA} from '../src/world/kitahama-layout.js';
import {yardHomeSpec} from '../src/world/interiors/yard-home.js';
import {HOME_CUSTOMIZATION_PLACEMENT} from '../src/world/interiors/home-customization.js';

// Secondary views complement the entrance fixture. They use the authored plans:
// concrete-family table (-2.25,-1.45), red-tile guest table (1.6,1), the staff
// houses' mirrored tatami rooms, and the mayor's keepsake shelf on his living room's west wall (−5.67,3.8).
// Eye positions stay below ceilings and away from full-height partitions.
const CONCRETE={name:'household',pos:[-.65,1.65,-.95],at:[-2.1,.95,-1.68]};
const RED_TILE={name:'household',pos:[2.55,1.65,2.55],at:[1.35,.65,.3]};
const THUAN_LIVING={name:'living',pos:[-.8,1.65,2.2],at:[-2.15,.8,.15]};
const shelf=HOME_CUSTOMIZATION_PLACEMENT.shelf;
const MAYOR={name:'keepsakes',pos:[-3.6,1.6,3.5],at:[shelf[0],shelf[1]+.15,shelf[2]]};
const SATO={name:'tea-corner',pos:[1.3,1.65,2],at:[-1.5,.8,0]};
const plots=new Map(KITAHAMA.plots.map(p=>['home-'+p.id,p]));

/** Primary fixtures stay inside the current house, rather than its retired room. */
export function homeEntranceView(id){
 const yard=yardHomeSpec(id);
 if(yard)return {pos:[yard.s*2.05,1.9,-yard.D/2+.16],at:[yard.s*.65,.75,.45]};
 if(id==='resident-home-thuan')return {pos:[2.45,1.65,2.4],at:[1.2,.7,.5]};
 return {pos:[.15,1.8,2.25],at:[-.4,.8,-2.4]};
}

/** Fixed camera fixtures for all fifteen entered homes; unknown venues return []. */
export function homeViews(id,layout){
 let view;
 if(id==='mayor-home')view=MAYOR;
 else if(id==='resident-home-mrs-sato')view=SATO;
 else if(id==='resident-home-thuan')view=THUAN_LIVING;
 else if(yardHomeSpec(id)){const yard=yardHomeSpec(id);view={name:'living',pos:[yard.s*-.65,1.6,yard.D/2-.45],at:[yard.s*-1.65,.45,-.4]};}
 else if(plots.has(id))view=plots.get(id).kind==='red-tile'?RED_TILE:CONCRETE;
 else return [];
 if(layout?.bounds){
  const b=layout.bounds,[x,,z]=view.pos;
  if(x<=b.minX||x>=b.maxX||z<=b.minZ||z>=b.maxZ)throw new RangeError('Secondary camera is outside '+id+' bounds');
 }
 return [{name:id==='home-kitahama-5'?'rental':view.name,pos:[...view.pos],at:[...view.at]}];
}
