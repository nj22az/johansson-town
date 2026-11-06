/** Remember only interrupted launches, never a save or the player's location.
 * A killed browser process cannot deliver pagehide; ordinary exits/reloads can. One interrupted launch is
 * often a moment (an evicted background tab, a dropped connection), so reduced graphics waits for a second
 * interruption in a row, and the game says so and offers the full look back (`recovering`). */
const KEY='johansson-startup-attempt-v1',SAFE='johansson-safe-graphics-v1',STRIKES=2;
export function createStartupRecovery({storage,now=()=>Date.now(),search='',events, schedule=setTimeout,cancel=clearTimeout}={}){
 const read=key=>{try{return storage?.getItem(key);}catch{return null;}};
 const write=(key,value)=>{try{storage?.setItem(key,value);}catch{}};
 const remove=key=>{try{storage?.removeItem(key);}catch{}};
 let prior=null;try{prior=JSON.parse(read(KEY)||'null');}catch{}
 const interrupted=!!prior&&['starting','entering'].includes(prior.stage)&&now()-prior.at>=0&&now()-prior.at<180000;
 const strikes=interrupted?(prior.strikes||1)+1:1;
 const requested=new URLSearchParams(search).get('graphics');
 // Only an explicit choice persists. The old automatic '1' marker could leave
 // a repaired game in plain rendering after every subsequent ordinary reload.
 const reduced=requested==='safe'||(requested!=='full'&&read(SAFE)==='manual');
 // A player's own request for the full look wins for that launch; a further crash counts on.
 const recovering=!reduced&&requested!=='full'&&strikes>STRIKES;
 const safe=reduced||recovering;
 if(reduced)write(SAFE,'manual');else remove(SAFE);
 let timer=null;
 const checkpoint=stage=>write(KEY,JSON.stringify({stage,at:now(),strikes}));
 const close=()=>{cancel(timer);remove(KEY);};
 events?.addEventListener('pagehide',close);
 checkpoint('starting');
 return {safe,reduced,interrupted,recovering,
  entering(){checkpoint('entering');},
  running(){cancel(timer);timer=schedule(()=>remove(KEY),45000);},
  failed(){cancel(timer);remove(KEY);},
  dispose(){close();events?.removeEventListener('pagehide',close);}
 };
}
/** The 16 October 2026 look on every device (the creator, 2026-10-19: "pre October 18 standard graphics is
 * what we are looking for"): desktop, tablet and phone differ only in drawing resolution and shadow detail.
 * Reduced graphics is a recovery mode or the player's own choice, never a device class. */
export function graphicsProfile({mobile=false,tablet=false,safe=false,reduced=safe}={}){
 const phone=mobile&&!tablet;
 return Object.freeze({dpr:safe?1:phone?1.5:mobile?1.85:2,shadows:!safe&&!phone,
  shadowSize:safe||phone?0:mobile?1024:2048,shadowRadius:26,
  // The cartoon pipeline draws offscreen and reaches the canvas as one FXAA quad, so a
  // multisampled canvas would only hold memory (a 4x canvas on an iPad was about 150 MB).
  antialias:false,
  samples:safe?0:4,pixelBudget:safe?650000:mobile?2.4e6:4.6e6,superScale:safe||mobile?1:1.25,
  precompile:!safe,preferHalfFloat:true,postprocess:!reduced,
  streamDetails:!safe,cinematic:!safe,quietOpening:safe,
  canvasPixels:safe?650000:null});
}
/** Bound the screen buffer too; an offscreen cap alone leaves the native canvas large. */
export function drawingDpr({width,height,deviceDpr=1,profile,scale=1}){
 // Retain the old one-scene-pixel-per-CSS-pixel floor within the hard budget.
 const base=Math.max(1,Math.min(deviceDpr||1,profile.dpr)*scale);
 return profile.canvasPixels?Math.min(base,Math.sqrt(profile.canvasPixels/Math.max(1,width*height))):base;
}
