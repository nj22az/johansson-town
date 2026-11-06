import {createVirtualJoystick,JOYSTICK_MODE,VISIBILITY} from './virtual-joystick.js';

/**
 * Touch movement and looking.
 *
 * Movement is a virtual joystick (see virtual-joystick.js, ported from
 * Virtual-Joystick-Godot) over a large invisible area in the lower left. It draws
 * nothing until a thumb is down, and the ring appears wherever that thumb lands, so
 * there is no small circle to aim at and nothing sitting on the view the rest of the
 * time.
 *
 * Looking stays a drag on the open view, which is what a thumb does anyway. Because
 * the joystick area takes its own pointer events, the left corner no longer steals
 * those drags: left is walking, the rest of the screen is looking. A gamepad's right
 * stick is unaffected — that arrives through analogue.js.
 */
export function createTouchSticks({canvas,movePad,stickBase,stickKnob,enabled,onDrag}){
 const axes={x:0,y:0};
 let drag=null,suppressClickUntil=0;

 const joystick=movePad&&stickBase&&stickKnob?createVirtualJoystick({
  area:movePad,base:stickBase,knob:stickKnob,enabled,
  // Following, so a long swipe never runs out of stick mid-walk.
  mode:JOYSTICK_MODE.FOLLOWING,
  visibility:VISIBILITY.WHEN_TOUCHED,
  // clampzone is left to the ring's own radius, so the tip rides its rim.
  deadzone:9,
  onChange:({output})=>{axes.x=output.x;axes.y=output.y;}
 }):null;

 // A swipe on the unobstructed view remains available for precise aiming.
 canvas.addEventListener('pointerdown',e=>{
  if(!enabled()||e.pointerType!=='touch'||drag)return;
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,distance:0};
  canvas.setPointerCapture(e.pointerId);
 });
 canvas.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.id)return;
  if(!enabled()){reset();return;}
  const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
  drag.distance+=Math.hypot(dx,dy);drag.x=e.clientX;drag.y=e.clientY;
  onDrag(dx,dy);
  if(drag.distance>8)suppressClickUntil=performance.now()+500;
 });
 const endDrag=e=>{if(e.pointerId===drag?.id)drag=null;};
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,endDrag);

 function reset(){joystick?.reset();drag=null;}

 return {
  get move(){return axes;},
  // Looking has no stick on touch; a pad's right stick comes in through analogue.js.
  get look(){return {x:0,y:0};},
  get moving(){return !!joystick?.pressed;},
  /** A thumb is dragging the view. */
  get looking(){return !!drag&&drag.distance>4;},
  hint:on=>joystick?.hint(on),
  reset,
  suppressClick:()=>performance.now()<suppressClickUntil
 };
}
