/**
 * Virtual Joystick, ported from Virtual-Joystick-Godot by Marco Fazio (MIT).
 *
 * The old stick was a fixed 112px circle painted in the bottom-left corner whether or
 * not anyone was using it. That project's answer is two options, and they are exactly
 * the two things wanted here: a joystick *mode* that decides whether the base sits
 * still or appears under the thumb, and a *visibility* mode that can keep it off
 * screen until it is touched.
 *
 * So the hit area is now a large invisible region and the ring is drawn wherever the
 * thumb lands. Nothing is painted over the view until a finger is down, and there is
 * no small target to find: anywhere in the area is the middle of the stick.
 *
 * The maths below is the GDScript's, including the detail that makes it feel right —
 * the dead zone is subtracted from the vector and the remainder is rescaled across
 * what is left of the clamp zone, so the output ramps from zero at the edge of the
 * dead zone instead of jumping.
 */

/** Where the base sits when a touch begins. */
export const JOYSTICK_MODE=Object.freeze({
 /** The base never moves; only a touch inside it counts. */
 FIXED:'fixed',
 /** The base jumps to wherever in the area the thumb lands. */
 DYNAMIC:'dynamic',
 /** As dynamic, and the base is dragged along once the thumb passes the clamp zone. */
 FOLLOWING:'following'
});

export const VISIBILITY=Object.freeze({
 ALWAYS:'always',
 TOUCHSCREEN:'touchscreen',
 /** Drawn only while a finger is down. */
 WHEN_TOUCHED:'when-touched'
});

/** Shortens a vector to at most `max`, leaving shorter ones alone. */
export function limitLength(x,y,max){
 const length=Math.hypot(x,y);
 if(!(length>max)||length===0)return {x,y};
 return {x:x/length*max,y:y/length*max};
}

/**
 * One frame of joystick state. Pure: no DOM, no element, no time.
 *
 * Screen coordinates throughout, so y is positive downward — the same convention the
 * old stick used, and what the caller already negates for "forward".
 *
 * @param {object} options
 * @param {{x:number,y:number}} options.touch where the finger is now
 * @param {{x:number,y:number}} options.centre middle of the base
 * @param {number} options.deadzone radius, in pixels, inside which output is zero
 * @param {number} options.clampzone radius, in pixels, at which output reaches 1
 * @param {string} [options.mode]
 * @returns {{output:{x:number,y:number},pressed:boolean,centre:{x:number,y:number},knob:{x:number,y:number}}}
 */
export function joystickFrame({touch,centre,deadzone=10,clampzone=75,mode=JOYSTICK_MODE.FIXED}){
 const span=Math.max(1,clampzone-deadzone);
 let base={x:centre.x,y:centre.y};
 const raw={x:touch.x-base.x,y:touch.y-base.y};
 const vector=limitLength(raw.x,raw.y,clampzone);

 // Following mode drags the base along behind the thumb, so a long swipe never runs
 // out of stick.
 if(mode===JOYSTICK_MODE.FOLLOWING&&Math.hypot(raw.x,raw.y)>clampzone){
  base={x:touch.x-vector.x,y:touch.y-vector.y};
 }

 const knob={x:base.x+vector.x,y:base.y+vector.y};
 const length=Math.hypot(vector.x,vector.y);
 if(length<=deadzone)return {output:{x:0,y:0},pressed:false,centre:base,knob};
 const scale=(length-deadzone)/span/length;
 return {output:{x:vector.x*scale,y:vector.y*scale},pressed:true,centre:base,knob};
}

/** True when a point falls inside an element-style rect. */
export const insideRect=(point,rect)=>
 point.x>=rect.left&&point.x<=rect.left+rect.width&&
 point.y>=rect.top&&point.y<=rect.top+rect.height;

/** True when a point falls inside a circle of `radius` about `centre`. */
export const insideCircle=(point,centre,radius)=>
 Math.hypot(point.x-centre.x,point.y-centre.y)<=radius;

/**
 * Binds the joystick to elements.
 *
 * @param {object} options
 * @param {HTMLElement} options.area the region a touch may start in
 * @param {HTMLElement} options.base the ring, positioned within the area
 * @param {HTMLElement} options.knob the tip, positioned within the base
 * @param {() => boolean} options.enabled
 * @param {string} [options.mode]
 * @param {string} [options.visibility]
 * @param {number} [options.deadzone]
 * @param {number|null} [options.clampzone] null derives it from the ring's own radius
 * @param {(state:{output:{x:number,y:number},pressed:boolean}) => void} [options.onChange]
 */
export function createVirtualJoystick({
 area,base,knob,enabled=()=>true,
 mode=JOYSTICK_MODE.FOLLOWING,
 visibility=VISIBILITY.WHEN_TOUCHED,
 deadzone=10,clampzone=null,
 onChange=()=>{}
}){
 let output={x:0,y:0},pressed=false,touchId=null,centre={x:0,y:0},hinting=false;

 /**
  * How far the thumb travels for full output. Derived from the ring unless a caller
  * insists, so the tip rides the rim instead of sailing past it — and so the short-screen
  * stylesheet, which draws a smaller ring, cannot silently leave the two disagreeing.
  */
 const reach=()=>clampzone??(base.offsetWidth?base.offsetWidth/2:70);

 const shown=()=>visibility!==VISIBILITY.WHEN_TOUCHED;
 /** Places the base by its middle, in coordinates local to the area. */
 function drawBase(point){
  const rect=area.getBoundingClientRect();
  base.style.left=(point.x-rect.left)+'px';
  base.style.top=(point.y-rect.top)+'px';
 }
 function drawKnob(point){
  knob.style.transform=`translate(${point.x-centre.x}px,${point.y-centre.y}px)`;
 }
 function show(on){
  area.classList.toggle('joystick-on',on);
  base.setAttribute('aria-hidden',on?'false':'true');
 }

 /** The middle of the base as the page sees it. */
 function baseCentre(){
  const rect=base.getBoundingClientRect();
  return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};
 }

 function begin(event){
  if(!enabled()||touchId!==null||event.button>0)return;
  const point={x:event.clientX,y:event.clientY};
  if(!insideRect(point,area.getBoundingClientRect()))return;
  // A fixed stick only answers a touch that lands on the ring itself; the other two
  // take the whole area and bring the ring to the thumb.
  if(mode===JOYSTICK_MODE.FIXED){
   if(!insideCircle(point,baseCentre(),base.offsetWidth/2))return;
   centre=baseCentre();
  }else{
   drawBase(point);
   centre=point;
  }
  event.preventDefault();event.stopPropagation();
  touchId=event.pointerId;
  area.setPointerCapture?.(event.pointerId);
  area.classList.add('active');
  hinting=false;
  if(!shown())show(true);
  move(event);
 }

 function move(event){
  if(event.pointerId!==touchId)return;
  if(!enabled()){reset();return;}
  event.preventDefault();
  const frame=joystickFrame({
   touch:{x:event.clientX,y:event.clientY},centre,deadzone,clampzone:reach(),mode});
  if(frame.centre!==centre&&(frame.centre.x!==centre.x||frame.centre.y!==centre.y)){
   centre=frame.centre;drawBase(centre);
  }
  drawKnob(frame.knob);
  output=frame.output;pressed=frame.pressed;
  onChange({output,pressed});
 }

 function end(event){
  if(event.pointerId!==touchId)return;
  reset();
 }

 function reset(){
  if(touchId!==null&&area.hasPointerCapture?.(touchId))area.releasePointerCapture(touchId);
  touchId=null;output={x:0,y:0};pressed=false;
  area.classList.remove('active');
  knob.style.transform='translate(0,0)';
  if(!shown()&&!hinting)show(false);
  onChange({output,pressed});
 }

 area.addEventListener('pointerdown',begin);
 area.addEventListener('pointermove',move);
 for(const name of ['pointerup','pointercancel','lostpointercapture'])area.addEventListener(name,end);
 area.addEventListener('contextmenu',event=>event.preventDefault());
 if(!shown())show(false);

 return {
  get output(){return output;},
  get pressed(){return pressed;},
  get active(){return touchId!==null;},
  reset,
  /**
   * Shows the ring in the middle of the area without a touch, so a player arriving on
   * a phone can see there is a stick at all. Any real touch cancels it.
   */
  hint(on){
   if(shown())return;
   hinting=!!on;
   if(on&&touchId===null){
    const rect=area.getBoundingClientRect();
    drawBase({x:rect.left+rect.width/2,y:rect.top+rect.height*.62});
    show(true);
   }else if(touchId===null)show(false);
  }
 };
}
