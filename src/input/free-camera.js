/**
 * Free camera: the town stops where it stands and the lens comes loose, to fly round the scene and look at it from any
 * angle (the owner, 22 October 2026: "add a free camera option too? So I could rotate and view the scene from any angle;
 * it freezes the game"). Entered from the Town book or O; Escape, O or the Exit button leaves, and the view goes back
 * to exactly where it was.
 *
 * While it is on, game.js draws the world through its still path (no clock, simulation, animation or input reach the
 * town), and this module owns every key, pointer and controller input:
 *
 *   keyboard  W A S D or arrows fly, E / Space up, Q / C down, Shift faster, Alt slower; drag the mouse to look,
 *             the wheel moves forward and back; L steps to the next Look
 *   touch     one finger looks; two fingers pinch to move forward and back, and drag together to slide and rise
 *   controller left stick flies, right stick looks, triggers (or bumpers) down and up, B leaves
 *
 * The lens may go through walls, as any free camera does, but never below the ground or the floor of the room, and
 * never so far from where it started that the streamed districts round the player stop being drawn.
 */
const LOOK_PER_PX=0.0042,PAD_LOOK=2.4,SPEED=4,FAST=3.2,SLOW=0.3,EASE=10,PITCH_LIMIT=1.5,CLEARANCE=0.15,DEADZONE=0.16;

/**
 * Pure: one step of flight. `input.move` and `input.look` are held amounts (-1..1, keys and sticks); `input.nudge` is a
 * distance in metres along the view (gestures and the wheel), spent in this step. Returns the next pose.
 */
export function stepFreeCamera(pose,input,dt,{floor=()=>-Infinity,centre=null,radius=Infinity,ceiling=Infinity}={}){
 const yaw=pose.yaw-(input.look?.x||0),pitch=Math.max(-PITCH_LIMIT,Math.min(PITCH_LIMIT,pose.pitch-(input.look?.y||0)));
 const speed=SPEED*(input.fast?FAST:1)*(input.slow?SLOW:1);
 const m=input.move||{},fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
 // Forward follows the view's tilt, so looking down and pressing W dives towards what you look at.
 const cp=Math.cos(pitch),sp=Math.sin(pitch);
 const want={x:(fx*cp*(m.z||0)+rx*(m.x||0))*speed,y:((m.y||0)+sp*(m.z||0))*speed,z:(fz*cp*(m.z||0)+rz*(m.x||0))*speed};
 // Velocity eases towards the wanted one, so starts and stops are smooth rather than a jolt.
 const k=1-Math.exp(-EASE*Math.max(0,dt)),v=pose.velocity||{x:0,y:0,z:0};
 const velocity={x:v.x+(want.x-v.x)*k,y:v.y+(want.y-v.y)*k,z:v.z+(want.z-v.z)*k};
 const n=input.nudge||{};
 let x=pose.x+velocity.x*dt+fx*cp*(n.z||0)+rx*(n.x||0),y=pose.y+velocity.y*dt+sp*(n.z||0)+(n.y||0),z=pose.z+velocity.z*dt+fz*cp*(n.z||0)+rz*(n.x||0);
 if(centre&&Number.isFinite(radius)){
  const dx=x-centre.x,dz=z-centre.z,d=Math.hypot(dx,dz);
  if(d>radius){x=centre.x+dx/d*radius;z=centre.z+dz/d*radius;}
 }
 const ground=floor(x,z);
 if(Number.isFinite(ground)&&y<ground+CLEARANCE){y=ground+CLEARANCE;velocity.y=Math.max(0,velocity.y);}
 if(y>ceiling){y=ceiling;velocity.y=Math.min(0,velocity.y);}
 return {x,y,z,yaw,pitch,velocity};
}

const dead=v=>Math.abs(v)<DEADZONE?0:(v-Math.sign(v)*DEADZONE)/(1-DEADZONE);

const STYLE=`
html.free-camera #hud,html.free-camera #mobile,html.free-camera #subtitle{visibility:hidden!important}
#freeCamera{position:fixed;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:40;
 display:flex;flex-direction:column;align-items:center;gap:8px;pointer-events:none;color:#f4f1ea;font:600 12px/1.3 system-ui,sans-serif}
#freeCamera[hidden]{display:none}
#freeCamera .free-hint{margin:0;padding:6px 10px;border-radius:999px;background:rgba(20,28,28,.72);white-space:nowrap;transition:opacity .6s}
#freeCamera .free-hint.gone{opacity:0}
#freeCamera kbd{display:inline-block;min-width:18px;margin:0 1px;padding:1px 4px;border-radius:4px;background:rgba(255,255,255,.18);font:700 11px system-ui,sans-serif;text-align:center}
#freeCamera .free-buttons{display:flex;gap:10px;padding:6px;border-radius:999px;background:rgba(20,28,28,.72);pointer-events:auto}
#freeCamera button{display:grid;place-items:center;width:48px;height:48px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:inherit}
#freeCamera button svg{width:24px;height:24px}
#freeCamera button[data-look] svg{width:40px;height:40px;border-radius:50%}
#freeCamera button:focus-visible{outline:3px solid #9fe0c8;outline-offset:2px}
`;

/**
 * @param {object} o
 * @param {HTMLCanvasElement} o.canvas
 * @param {()=>{sensitivity?:number,invertY?:boolean}} [o.settings] the player's own look settings (Controls)
 * @param {{id:()=>string,label:()=>string,next:()=>void}} [o.look] the town's Look (render/looks.js): a button and L step through them
 * @param {(name:string)=>string} [o.icon] an icon's SVG (ui/icons.js svg)
 * @param {(id:string)=>string} [o.swatch] a look's picture (ui/look-picker.js lookSwatch), shown on the Look button
 * @param {(free:{active:boolean})=>void} [o.onChange] told when the camera comes loose and when it is put back
 */
export function createFreeCamera({canvas,doc=globalThis.document,win=globalThis,settings=()=>({}),look:style=null,icon=()=>'',swatch=()=>'',onChange=()=>{}}={}){
 const keys=new Set(),pointers=new Map();
 let active=false,pose=null,start=null,limits={},bar=null,look={x:0,y:0},dolly=0,slide={x:0,y:0},pinch=null,padExit=false;
 const coarse=()=>!!win.matchMedia?.('(pointer:coarse)').matches;

 let hintTimer=null;
 function showStyle(){const b=bar?.querySelector('[data-look]');if(!b||!style)return;b.innerHTML=swatch(style.id());b.setAttribute('aria-label',`Look: ${style.label()}. Next look (L)`);b.title=style.label();}
 function nextStyle(){if(!style)return;style.next();showStyle();}
 function button(name,label,run){const b=doc.createElement('button');b.type='button';b.innerHTML=icon(name);b.setAttribute('aria-label',label);b.title=label;b.onclick=run;return b;}
 function ensureBar(){
  if(bar)return bar;
  const css=doc.createElement('style');css.textContent=STYLE;doc.head.append(css);
  bar=doc.createElement('div');bar.id='freeCamera';bar.hidden=true;bar.setAttribute('role','region');bar.setAttribute('aria-label','Free camera');
  const hint=doc.createElement('p');hint.className='free-hint';hint.dataset.hint='';
  const row=doc.createElement('div');row.className='free-buttons';
  if(style){const b=button('camera','Next look (L)',()=>nextStyle());b.dataset.look='';row.append(b);}
  row.append(button('reset','Back to where you started',()=>{if(start)pose={...start,velocity:{x:0,y:0,z:0}};}),button('close','Leave the free camera (Esc)',()=>leave()));
  bar.append(hint,row);doc.body.append(bar);
  return bar;
 }
 /** The controls, in keys or gestures, for a few seconds; then only the buttons stay. */
 function showHint(){
  const hint=bar.querySelector('[data-hint]');
  hint.innerHTML=coarse()?'drag to look · pinch to move · two fingers slide'
   :'<kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> fly · <kbd>E</kbd><kbd>Q</kbd> up/down · drag to look · <kbd>L</kbd> look · <kbd>Esc</kbd>';
  hint.classList.remove('gone');clearTimeout(hintTimer);hintTimer=setTimeout(()=>hint.classList.add('gone'),4500);hintTimer?.unref?.();
 }
 /**
  * @param {{position:{x,y,z},yaw:number,pitch:number}} view where the lens is now
  * @param {{floor?:(x:number,z:number)=>number,radius?:number,ceiling?:number}} [bounds]
  */
 function enter(view,bounds={}){
  if(active)return false;
  pose={x:view.position.x,y:view.position.y,z:view.position.z,yaw:view.yaw,pitch:view.pitch,velocity:{x:0,y:0,z:0}};
  start={...pose};
  limits={floor:bounds.floor,radius:bounds.radius??80,ceiling:(bounds.ceiling??view.position.y+60),centre:{x:pose.x,z:pose.z}};
  keys.clear();pointers.clear();pinch=null;look={x:0,y:0};dolly=0;slide={x:0,y:0};
  // A button already held on the pad as the camera opens must be let go before it can close it again.
  padExit=true;
  active=true;
  doc.exitPointerLock?.();
  doc.documentElement.classList.add('free-camera');
  const b=ensureBar();b.hidden=false;showStyle();showHint();
  onChange({active:true});
  return true;
 }
 function leave(){
  if(!active)return false;
  active=false;keys.clear();pointers.clear();pinch=null;
  doc.documentElement.classList.remove('free-camera');
  if(bar)bar.hidden=true;
  onChange({active:false});
  return true;
 }

 // Capture on the window, ahead of the game's own listeners: nothing reaches the town while the lens is loose.
 const own=e=>bar&&bar.contains(e.target);
 win.addEventListener('keydown',e=>{
  if(!active)return;
  if(own(e)&&(e.code==='Enter'||e.code==='Space'||e.code==='Tab'))return;
  e.stopImmediatePropagation();e.preventDefault();
  if((e.code==='Escape'||e.code==='KeyO')&&!e.repeat){leave();return;}
  if(e.code==='KeyL'&&!e.repeat){nextStyle();return;}
  keys.add(e.code);
 },true);
 win.addEventListener('keyup',e=>{if(!active)return;keys.delete(e.code);e.stopImmediatePropagation();},true);
 win.addEventListener('blur',()=>keys.clear());
 const swallow=e=>{if(active&&!own(e)){e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();}};
 win.addEventListener('pointerdown',e=>{
  if(!active||own(e))return;swallow(e);
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas?.setPointerCapture?.(e.pointerId);
  pinch=null;
 },true);
 win.addEventListener('pointermove',e=>{
  if(!active||!pointers.has(e.pointerId))return;swallow(e);
  const before=pointers.get(e.pointerId),now={x:e.clientX,y:e.clientY};
  if(pointers.size===1){const c=settings()||{},gain=LOOK_PER_PX*(c.sensitivity||1);look.x+=(now.x-before.x)*gain;look.y+=(now.y-before.y)*gain*(c.invertY?-1:1);}
  pointers.set(e.pointerId,now);
  if(pointers.size>=2){
   const [a,b]=[...pointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},gap=Math.hypot(a.x-b.x,a.y-b.y);
   // Fingers apart moves in; both fingers sliding move the lens with them, as dragging a map does.
   if(pinch){dolly+=(gap-pinch.gap)*0.012;slide.x-=(mid.x-pinch.mid.x)*0.01;slide.y+=(mid.y-pinch.mid.y)*0.01;}
   pinch={mid,gap};
  }
 },true);
 const lift=e=>{if(!active)return;if(pointers.delete(e.pointerId))swallow(e);pinch=null;};
 win.addEventListener('pointerup',lift,true);win.addEventListener('pointercancel',lift,true);
 for(const type of ['click','dblclick','contextmenu','touchstart','touchmove','mousedown','mousemove','mouseup'])
  win.addEventListener(type,e=>{if(active&&!own(e))swallow(e);},{capture:true,passive:false});
 win.addEventListener('wheel',e=>{if(!active||own(e))return;swallow(e);dolly-=Math.sign(e.deltaY)*Math.min(1.5,Math.abs(e.deltaY)/100);},{capture:true,passive:false});

 function pad(){
  const list=win.navigator?.getGamepads?.()||[];
  for(const g of list){
   if(!g||!g.connected)continue;
   const button=i=>g.buttons[i]?.value||0;
   const b=button(1)>.5;
   if(b&&!padExit){leave();return null;}
   padExit=b;
   return {move:{x:dead(g.axes[0]||0),z:-dead(g.axes[1]||0),y:Math.max(button(7),button(5))-Math.max(button(6),button(4))},
    look:{x:dead(g.axes[2]||0),y:dead(g.axes[3]||0)},fast:button(10)>.5};
  }
  padExit=false;return null;
 }

 /** One frame: flies the lens and writes it into `camera`. */
 function update(dt,camera){
  if(!active)return;
  const p=pad();if(!active)return;
  const k=c=>keys.has(c)?1:0;
  const clamp=v=>Math.max(-1,Math.min(1,v)),c=settings()||{},padLook=PAD_LOOK*(c.sensitivity||1)*dt;
  const input={
   move:{x:clamp(k('KeyD')+k('ArrowRight')-k('KeyA')-k('ArrowLeft')+(p?.move.x||0)),
    y:clamp(k('KeyE')+k('Space')+k('PageUp')-k('KeyQ')-k('KeyC')-k('PageDown')+(p?.move.y||0)),
    z:clamp(k('KeyW')+k('ArrowUp')-k('KeyS')-k('ArrowDown')+(p?.move.z||0))},
   look:{x:look.x+(p?.look.x||0)*padLook,y:look.y+(p?.look.y||0)*padLook*(c.invertY?-1:1)},
   // Gestures and the wheel are distances, not held keys: they are spent in the frame they arrive.
   nudge:{x:slide.x,y:slide.y,z:dolly},
   fast:keys.has('ShiftLeft')||keys.has('ShiftRight')||!!p?.fast,slow:keys.has('AltLeft')||keys.has('AltRight')
  };
  look={x:0,y:0};dolly=0;slide={x:0,y:0};
  pose=stepFreeCamera(pose,input,dt,limits);
  camera.position.set(pose.x,pose.y,pose.z);
  camera.rotation.set(pose.pitch,pose.yaw,0,'YXZ');
  camera.updateMatrixWorld();
 }

 return {
  get active(){return active;},
  get pose(){return pose&&{...pose};},
  enter,leave,update,
  toggle(view,bounds){return active?leave():enter(view,bounds);}
 };
}
