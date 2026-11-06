import {installIconControls} from './ui/icon-controls.js';
import {createStartupRecovery} from './render/startup-recovery.js';
// Count interruptions during model download/decoding too, before game.js exists.
window.__JOHANSSON_STARTUP_RECOVERY__??=createStartupRecovery({storage:(()=>{try{return globalThis.sessionStorage;}catch{return null;}})(),search:location.search,events:globalThis});
// Pixar Thuan's model starts downloading at once, beside the controls; the town waits for it below (src/avatars/pixar.js).
const pixarBodies=new URLSearchParams(location.search).get('pixar')==='0'?null
 :import('./avatars/pixar.js').then(p=>p.loadPixarBodies()).catch(error=>console.warn('Pixar bodies unavailable:',error));
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
// Pixar Thuan (src/avatars/pixar.js) is fetched before the town builds its people (?pixar=0: the cartoon).
await pixarBodies;
await import('./game.js?snappy=1');
void import('../webmcp.js').then(()=>import('../webmcp-characters.js')).catch(error=>console.warn('Town browser tools unavailable:',error));

installIconControls();
