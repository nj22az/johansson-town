import {AIRPORT_ISLAND} from './airport-island.js';
import {batchStaticProps} from '../render/static-props.js';

/**
 * Kitano-jima on demand (the creator, 2026-10-13: "tropical island doesn't need to load until we are there we see it in
 * the distance but it's not the whole island"). createTown({kitano:'distant'}) builds the island's ground, its airport
 * buildings, the hamlet's sites and prompts, and a view of the rest as it is read from across the strait; the rest (the
 * island's plants, the airport district and the hamlet's houses) is queued with `later` and built by `prepare()` (a step
 * at a time, while he is on his way) or `ensure()` (all at once, before he is put there). 'full', the default, builds
 * everything at once, as the tests, the tools and Studio expect.
 */
/** Within this of the island's middle he is "there": the island's shore, its jetty and the water round it. */
export const KITANO_NEAR=260;

export function createKitano(world,{distant=false}={}){
 const steps=[],built=[],farParts=[];let state=distant?'distant':'full',running=null;
 const k={
  get distant(){return distant;},
  get state(){return state;},
  get loaded(){return state==='full';},
  /** The builders run, in order. */
  get built(){return [...built];},
  /** A builder of the island's: run now, or queued until he heads there. */
  later(name,fn){if(state==='full')return fn();steps.push({name,fn});return null;},
  /** A stand-in for the distant view, taken away when the real thing is built. */
  far(object){if(state!=='full')farParts.push(object);return object;},
  near:(x,z)=>Math.hypot(x-AIRPORT_ISLAND.x,z-AIRPORT_ISLAND.z)<KITANO_NEAR,
  /** Called with the island's group once it is whole: the game shades and compiles it (game.js). */
  onLoaded:[],
  /** All of it, now: before he is put on the island. True if anything was built. */
  ensure(){if(state==='full')return false;while(steps.length)run(steps.shift());finish();return true;},
  /** All of it, a step at a time (`frame` waits between steps): while he is on his way. */
  prepare({frame=()=>new Promise(resolve=>setTimeout(resolve,0))}={}){
   if(state==='full')return Promise.resolve(false);
   return running??=(async()=>{
    state='loading';
    while(steps.length){await frame();if(state==='full')return true;run(steps.shift());}
    finish();return true;
   })();
  },
 };
 function run(step){built.push(step.name);step.fn();}
 function finish(){
  if(state==='full')return;state='full';
  for(const o of farParts){o.removeFromParent();o.traverse(x=>x.geometry?.dispose?.());}farParts.length=0;
  const island=world.airportIsland?.group;
  // Batched in the island's own group, as at startup (render/static-props.js); its window glass and lamps join the clock.
  if(island){batchStaticProps(island);world.glow?.collect(island);}
  for(const fn of k.onLoaded)fn(island);
 }
 return k;
}

/** A Kitano-jima builder through the world's queue, or at once when the world has none. */
export const kitanoLater=(world,name,fn)=>world.kitano?world.kitano.later(name,fn):fn();
