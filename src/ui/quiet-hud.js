/**
 * The HUD steps back so the town has the screen (the owner, 20 October 2026, on an iPhone screenshot: "I think the ui
 * needs a revamp, this nice picture is almost ruined by the ui"). Two states, both classes on <html>, styled by
 * quiet-hud.css:
 *
 * - `hud-idle`: after IDLE_MS without any input the place chip, the town book button and the action pill fade to a low
 *   opacity. Any touch, click, key, wheel or controller input (and walking, which the game reports through wake())
 *   brings them straight back.
 * - `hud-photo`: photo mode, every control hidden for a clean picture. Entered from the town book's "Clean view" tile or
 *   the H key; a tap (a touch or click that does not drag), H, Escape or a controller button brings the controls back.
 *   Dragging still looks round and the stick still walks, so the picture can be framed while the screen is clean.
 */
export const IDLE_MS=4000;
/** A press that moves less than this, and lifts within TAP_MS, is a tap, not a look-around drag. */
const TAP_PX=10,TAP_MS=350;

export function createQuietHud({doc=globalThis.document,idleMs=IDLE_MS,now=()=>performance.now(),
 schedule=(fn,ms)=>setTimeout(fn,ms),cancel=id=>clearTimeout(id),listen=true}={}){
 const root=doc.documentElement;
 let last=now(),timer=null,idle=false,photo=false,press=null,held=false;
 const arm=wait=>{if(timer!==null)cancel(timer);timer=schedule(check,wait);};
 function check(){
  timer=null;
  const left=idleMs-(now()-last);
  if(held)return;
  if(left>0){arm(left);return;}
  if(!idle){idle=true;root.classList.add('hud-idle');}
 }
 function wake(){
  last=now();
  if(idle){idle=false;root.classList.remove('hud-idle');}
  if(timer===null)arm(idleMs);
 }
 function setPhoto(on){
  on=!!on;if(on===photo)return photo;
  photo=on;root.classList.toggle('hud-photo',on);press=null;
  wake();return photo;
 }
 if(listen&&doc.addEventListener){
  const opts={capture:true,passive:true};
  doc.addEventListener('pointerdown',e=>{wake();press=photo?{x:e.clientX,y:e.clientY,t:now()}:null;},opts);
  doc.addEventListener('pointerup',e=>{
   if(!photo||!press)return;
   const tap=Math.hypot(e.clientX-press.x,e.clientY-press.y)<TAP_PX&&now()-press.t<TAP_MS;press=null;
   if(tap)setPhoto(false);
  },opts);
  doc.addEventListener('pointermove',wake,opts);
  doc.addEventListener('wheel',wake,opts);
  doc.addEventListener('keydown',e=>{wake();if(photo&&e.code==='Escape')setPhoto(false);},opts);
 }
 arm(idleMs);
 return {
  wake,
  /** A controller button: wakes the HUD, and leaves photo mode. */
  button(){wake();if(photo)setPhoto(false);},
  photo:setPhoto,
  togglePhoto(){return setPhoto(!photo);},
  /** Keep the HUD awake whatever the clock says (audit stills, where one frame of a software renderer takes seconds). */
  hold(on){held=!!on;if(held)wake();else arm(idleMs);},
  /** Fade now, as if the player had stopped touching anything IDLE_MS ago (the audit's shots). */
  rest(){last=now()-idleMs;const keep=held;held=false;check();held=keep;},
  get idle(){return idle;},
  get photoMode(){return photo;},
 };
}
