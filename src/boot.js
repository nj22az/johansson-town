import {installIconControls} from './ui/icon-controls.js';
import {createStartupRecovery} from './render/startup-recovery.js';
// Count interruptions during model download/decoding too, before game.js exists.
window.__JOHANSSON_STARTUP_RECOVERY__??=createStartupRecovery({storage:(()=>{try{return globalThis.sessionStorage;}catch{return null;}})(),search:location.search,events:globalThis});
// The online World draws every resident as the cartoon, Johansson and Thuan too (the owner, 25 November 2026: "the
// blender avatars are better for Godot and Sakura world, the online game should use these cartoony characters even
// Johansson and Thuan"). The Blender (Pixar) bodies load only when a page asks for them, to compare: `?pixar=1` for all of
// them, `?pixar=thuan,johansson` for some (src/avatars/pixar.js pixarWanted). Studio loads its own (avatar-creator).
const pixarAsked=(()=>{const q=new URLSearchParams(location.search).get('pixar');return q!==null&&q!==''&&q!=='0';})();
const pixarBodies=pixarAsked
 ?import('./avatars/pixar.js').then(p=>p.loadPixarBodies()).catch(error=>console.warn('Pixar bodies unavailable:',error)):null;
// Benches and vending machines already have usable local stand-ins and hydrate
// through the detail stream. Their downloads must not gate the first town frame.
const status=document.querySelector('#bootStatus');
const startup=window.__JOHANSSON_STARTUP__;if(startup){startup.codeMs=performance.now()-startup.startedAt;startup.modelsMs=0;startup.stage='building';}
status.textContent='Building the town…';
// One frame for the status to be painted (or a moment, in a tab in the background): the town's build holds the page.
await new Promise(resolve=>{requestAnimationFrame(()=>setTimeout(resolve,0));setTimeout(resolve,120);});
window.__JOHANSSON_LOADING__?.start('controls');
await import('../touch-ui.js?ui=controls-3');
window.__JOHANSSON_LOADING__?.complete('controls');
window.__JOHANSSON_LOADING__?.start('code');
// Asked-for Blender bodies (above) are fetched before the town builds its people; without ?pixar there is nothing to wait for.
await pixarBodies;
await import('./game.js?snappy=1');
void import('../webmcp.js').then(()=>import('../webmcp-characters.js')).catch(error=>console.warn('Town browser tools unavailable:',error));

installIconControls();
