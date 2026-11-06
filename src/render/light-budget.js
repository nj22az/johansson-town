import * as THREE from '../../vendor/three.module.js';

/**
 * Keeps the number of point lights the renderer sees from changing.
 *
 * three.js builds every lit material's shader for an exact count of point lights. When a
 * lamp is hidden, removed or added (a shop's strip lights as you walk off, a room's lamps)
 * the count changes and every material in view recompiles: a hitch of a second or more on
 * a phone. So a few spare lights of no strength stand by: each frame enough of them are
 * shown to bring the count up to the most there have ever been, and the shaders never see
 * a difference. The count grows only when a new maximum is reached, a handful of times.
 */
/**
 * `town` is the most point lights the town shows at once (the four street lamps, Mr
 * Fujita's two and Sakura's two strip lights): the count starts there, so the shaders
 * compiled at the start (game.js) are the ones used all day.
 */
export const LIGHT_BUDGET=Object.freeze({spares:12,rescan:.25,town:8});

export function createLightBudget(scene,{spares=LIGHT_BUDGET.spares,start=LIGHT_BUDGET.town}={}){
 const pool=[];
 for(let i=0;i<spares;i++){const l=new THREE.PointLight(0x000000,0,.001,2);l.name='Light budget spare';l.position.set(0,-1000,0);l.visible=false;scene.add(l);pool.push(l);}
 const spare=new Set(pool);let lights=[],scanAt=0,most=start;
 const shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 return {
  get most(){return most;},
  update(now=performance.now()/1000){
   if(now>=scanAt){scanAt=now+LIGHT_BUDGET.rescan;lights=[];scene.traverse(o=>{if(o.isPointLight&&!spare.has(o))lights.push(o);});}
   let real=0;for(const l of lights)if(shown(l))real++;
   most=Math.max(most,real);
   const need=Math.min(spares,most-real);
   for(let i=0;i<spares;i++)pool[i].visible=i<need;
  },
 };
}
