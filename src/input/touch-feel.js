/**
 * How walking and looking feel on a touch screen.
 *
 * The raw inputs were honest but clunky: walking jumped to full speed and stopped dead,
 * a swipe turned by a fixed amount per pixel (so a phone and a tablet disagreed by a
 * factor of two), every sideways swipe also tipped the view, and the stick only ever
 * side-stepped, so walking round a corner took both thumbs. These are the small
 * corrections a thumb expects, kept pure so they can be tested.
 */
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

/** Eased walking: quick to get going, a touch quicker to stop, never a jolt. */
export function createMotion({accelerate=9,decelerate=13}={}){
 const v={x:0,y:0};
 return {
  get value(){return v;},
  update(x,y,dt){
   const rate=Math.hypot(x,y)>Math.hypot(v.x,v.y)?accelerate:decelerate,k=1-Math.exp(-rate*clamp(dt,0,.1));
   v.x+=(x-v.x)*k;v.y+=(y-v.y)*k;
   if(Math.abs(v.x)<1e-3&&!x)v.x=0;if(Math.abs(v.y)<1e-3&&!y)v.y=0;
   return v;
  },
  reset(){v.x=v.y=0;},
 };
}

/**
 * Run by pushing the stick past about 85% of its reach and holding it there for a moment; ease
 * off and you walk again. The gap between the two thresholds stops it flickering. This is the
 * only way to run on a touch screen: there is no Run button over the picture (quiet-hud.css).
 */
export function createAutoRun({on=.85,off=.7,hold=.2}={}){
 let held=0,running=false;
 return {
  get running(){return running;},
  update(magnitude,dt){
   if(running){if(magnitude<off){running=false;held=0;}}
   else if(magnitude>=on){held+=dt;if(held>=hold)running=true;}
   else held=0;
   return running;
  },
  reset(){held=0;running=false;},
 };
}

/**
 * A swipe on the view, in radians. Scaled to the screen, so a swipe across the whole
 * width turns about 200 degrees on any device, and a mostly-sideways swipe barely tips
 * the view up or down.
 */
export function swipeLook(dx,dy,width,{sensitivity=1,invertY=false}={}){
 const perPixel=Math.PI*1.1/Math.max(320,width||0)*clamp(sensitivity,.3,2.5);
 const sideways=Math.abs(dy)<Math.abs(dx)*.5;
 return {yaw:-dx*perPixel,pitch:-dy*perPixel*(sideways?.3:.75)*(invertY?-1:1)};
}

/**
 * One-thumb steering: holding the stick off to the side while walking also turns the
 * view that way, so the walk curves round the corner instead of crabbing sideways.
 * Nothing while backing up, or while the other thumb is looking.
 */
export function steerYaw(move,dt,{rate=1.5,looking=false}={}){
 if(looking||move.y>.2)return 0;
 const side=Math.abs(move.x)<.18?0:move.x-Math.sign(move.x)*.18;
 return side?-side*rate*clamp(dt,0,.1):0;
}
