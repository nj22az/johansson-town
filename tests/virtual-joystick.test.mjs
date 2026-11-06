import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Element,installDOM} from './fixtures.mjs';
import {
 joystickFrame,limitLength,insideRect,insideCircle,
 createVirtualJoystick,JOYSTICK_MODE,VISIBILITY
} from '../src/input/virtual-joystick.js';
import {createTouchSticks} from '../src/input/touch-sticks.js';

const centre={x:100,y:100};
const zones={deadzone:10,clampzone:75};

test('a vector is shortened to the clamp zone, never lengthened',()=>{
 assert.deepEqual(limitLength(3,4,10),{x:3,y:4},'already inside, left alone');
 const long=limitLength(300,0,75);
 assert.equal(long.x,75);
 assert.equal(Math.round(Math.hypot(...Object.values(limitLength(30,40,25)))),25);
 assert.deepEqual(limitLength(0,0,75),{x:0,y:0},'a zero vector has no direction to keep');
});

test('inside the dead zone the stick reads as untouched',()=>{
 const frame=joystickFrame({touch:{x:105,y:103},centre,...zones});
 assert.deepEqual(frame.output,{x:0,y:0});
 assert.equal(frame.pressed,false);
 // The knob still follows the thumb, so the stick does not look frozen.
 assert.deepEqual(frame.knob,{x:105,y:103});
});

test('output ramps from zero at the dead zone rather than jumping',()=>{
 const at=distance=>joystickFrame({touch:{x:centre.x+distance,y:centre.y},centre,...zones}).output.x;
 assert.equal(at(10),0,'the dead zone edge is still zero');
 const justOutside=at(11);
 assert.ok(justOutside>0&&justOutside<.05,
  'a hair past the dead zone is a hair of output, not a lurch to full speed');
 assert.ok(Math.abs(at(75)-1)<1e-9,'the clamp zone edge is full output');
 assert.ok(Math.abs(at(400)-1)<1e-9,'and nothing beyond it goes above one');
 assert.ok(at(30)<at(50),'and it rises in between');
});

test('a diagonal keeps its direction and reaches full magnitude',()=>{
 const {output,pressed}=joystickFrame({touch:{x:200,y:200},centre,...zones});
 assert.equal(pressed,true);
 assert.ok(Math.abs(output.x-output.y)<1e-9,'45 degrees stays 45 degrees');
 assert.ok(Math.abs(Math.hypot(output.x,output.y)-1)<1e-9);
});

test('screen coordinates: up the screen is negative y, as the walk code expects',()=>{
 assert.ok(joystickFrame({touch:{x:100,y:0},centre,...zones}).output.y<0);
 assert.ok(joystickFrame({touch:{x:100,y:300},centre,...zones}).output.y>0);
});

test('a following stick is dragged along once the thumb passes the clamp zone',()=>{
 const inside=joystickFrame({touch:{x:150,y:100},centre,...zones,mode:JOYSTICK_MODE.FOLLOWING});
 assert.deepEqual(inside.centre,centre,'within reach, the base stays put');

 const far=joystickFrame({touch:{x:400,y:100},centre,...zones,mode:JOYSTICK_MODE.FOLLOWING});
 assert.equal(far.centre.x,325,'the base is pulled to one clamp zone behind the thumb');
 assert.equal(far.centre.y,100);
 assert.ok(Math.abs(far.output.x-1)<1e-9,'and the output stays at full, not stuck');

 const fixed=joystickFrame({touch:{x:400,y:100},centre,...zones,mode:JOYSTICK_MODE.FIXED});
 assert.deepEqual(fixed.centre,centre,'a fixed stick never moves');
});

test('point tests for the hit area and the ring',()=>{
 const rect={left:10,top:20,width:100,height:50};
 assert.equal(insideRect({x:60,y:40},rect),true);
 assert.equal(insideRect({x:10,y:20},rect),true,'the edge counts');
 assert.equal(insideRect({x:9,y:40},rect),false);
 assert.equal(insideRect({x:60,y:71},rect),false);
 assert.equal(insideCircle({x:100,y:100},centre,10),true);
 assert.equal(insideCircle({x:111,y:100},centre,10),false);
});

/** A joystick wired to fixture elements, with a helper to send pointer events. */
function joystick(options={}){
 installDOM();
 const area=new Element(),base=new Element(),knob=new Element();
 area.getBoundingClientRect=()=>({left:0,top:0,width:300,height:300});
 base.getBoundingClientRect=()=>({left:88,top:88,width:124,height:124});
 base.offsetWidth=124;
 const attributes={};
 base.setAttribute=(name,value)=>{attributes[name]=value;};
 const stick=createVirtualJoystick({area,base,knob,deadzone:10,clampzone:75,...options});
 const send=(type,id,x=0,y=0)=>{
  for(const fn of area.listeners[type]||[])
   fn({pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,
    preventDefault(){},stopPropagation(){}});
 };
 return {stick,area,base,knob,attributes,send,
  visible:()=>area.classList.contains('joystick-on')};
}

test('nothing is drawn until a thumb is down, and it goes again on release',()=>{
 const {stick,send,visible,attributes}=joystick();
 assert.equal(visible(),false,'the view is clear before anyone touches it');
 assert.equal(attributes['aria-hidden'],'true');
 send('pointerdown',1,150,150);
 assert.equal(visible(),true);
 assert.equal(attributes['aria-hidden'],'false');
 send('pointerup',1);
 assert.equal(visible(),false,'and clear again afterwards');
 assert.equal(stick.output.x,0);
});

test('the ring is drawn where the thumb lands, not where it was last time',()=>{
 const {base,send}=joystick();
 send('pointerdown',1,40,260);
 assert.deepEqual([base.style.left,base.style.top],['40px','260px']);
 send('pointerup',1);
 send('pointerdown',2,220,90);
 assert.deepEqual([base.style.left,base.style.top],['220px','90px'],
  'there is no small circle to find: anywhere in the area is the middle of the stick');
});

test('a touch outside the area is ignored',()=>{
 const {send,visible}=joystick();
 send('pointerdown',1,400,400);
 assert.equal(visible(),false);
});

test('a fixed stick only answers a touch that lands on its ring',()=>{
 // The ring is fixed at 88,88 and 124 across, so its middle is 150,150.
 const {stick,send}=joystick({mode:JOYSTICK_MODE.FIXED,visibility:VISIBILITY.ALWAYS});
 send('pointerdown',1,20,20);
 assert.equal(stick.active,false,'a tap elsewhere in the area is not the stick');
 send('pointerdown',2,150,150);
 assert.equal(stick.active,true,'a tap on the ring is');
 send('pointermove',2,150,60);
 assert.ok(stick.output.y<-.9,'and it walks from where it has always been');
 send('pointerup',2);
 assert.equal(stick.active,false);
});

test('walking through a drag: press, move, release',()=>{
 const {stick,send,knob}=joystick();
 send('pointerdown',1,150,150);
 assert.deepEqual(stick.output,{x:0,y:0},'pressing alone does not walk');
 assert.equal(stick.active,true);
 send('pointermove',1,150,40);       // 110 up, past the clamp zone
 assert.ok(Math.abs(stick.output.y+1)<1e-9,'full speed forward');
 assert.equal(stick.pressed,true);
 assert.notEqual(knob.style.transform,'translate(0,0)');
 send('pointerup',1);
 assert.deepEqual(stick.output,{x:0,y:0});
 assert.equal(stick.pressed,false);
 assert.equal(knob.style.transform,'translate(0,0)','the knob returns to the middle');
});

test('a second finger cannot hijack a stick already in use',()=>{
 const {stick,send}=joystick();
 send('pointerdown',1,150,150);
 send('pointermove',1,150,40);
 const walking=stick.output.y;
 send('pointerdown',2,60,260);
 send('pointermove',2,60,260);
 assert.equal(stick.output.y,walking,'the walk in progress is undisturbed');
 send('pointerup',2);
 assert.equal(stick.output.y,walking,'and releasing the stray finger does not stop it');
 send('pointerup',1);
 assert.equal(stick.output.y,0);
});

test('being disabled mid-drag drops the stick rather than leaving it stuck on',()=>{
 let enabled=true;
 const {stick,send,visible}=joystick({enabled:()=>enabled});
 send('pointerdown',1,150,150);
 send('pointermove',1,150,40);
 assert.ok(stick.pressed);
 enabled=false;
 send('pointermove',1,150,40);
 assert.deepEqual(stick.output,{x:0,y:0},'opening a menu mid-walk does not leave it walking');
 assert.equal(visible(),false);
 enabled=true;
 send('pointerdown',2,150,150);
 send('pointermove',2,150,40);
 assert.ok(stick.pressed,'and it works again afterwards');
});

test('a cancelled pointer resets, so a notification cannot strand the stick',()=>{
 const {stick,send,visible}=joystick();
 send('pointerdown',1,150,150);
 send('pointermove',1,150,40);
 send('pointercancel',1);
 assert.deepEqual(stick.output,{x:0,y:0});
 assert.equal(visible(),false);
});

test('the opening hint shows the ring once, and any real touch takes it away',()=>{
 const {stick,send,visible,base}=joystick();
 stick.hint(true);
 assert.equal(visible(),true,'a first-time player can see there is a stick at all');
 assert.equal(base.style.left,'150px','drawn in the middle of the area');
 send('pointerdown',1,40,260);
 assert.equal(base.style.left,'40px','a real touch takes over');
 send('pointerup',1);
 assert.equal(visible(),false,'and the hint does not come back');
 stick.hint(false);
 assert.equal(visible(),false);
});

test('an always-visible stick ignores the hint entirely',()=>{
 const {stick,visible}=joystick({visibility:VISIBILITY.ALWAYS});
 stick.hint(true);
 assert.equal(visible(),false,'nothing to show or hide; it is drawn by CSS');
});

test('the touch build exposes the joystick as the move axes and keeps drag-to-look',()=>{
 installDOM();
 const canvas=new Element(),movePad=new Element(),stickBase=new Element(),stickKnob=new Element();
 movePad.getBoundingClientRect=()=>({left:0,top:0,width:300,height:300});
 stickBase.getBoundingClientRect=()=>({left:88,top:88,width:124,height:124});
 const dragged={x:0,y:0};
 const sticks=createTouchSticks({canvas,movePad,stickBase,stickKnob,
  enabled:()=>true,onDrag:(dx,dy)=>{dragged.x+=dx;dragged.y+=dy;}});
 const send=(target,type,id,x=0,y=0)=>{
  for(const fn of target.listeners[type]||[])
   fn({pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,
    preventDefault(){},stopPropagation(){}});
 };
 assert.deepEqual(sticks.look,{x:0,y:0},'there is no look stick to read');

 send(movePad,'pointerdown',1,150,150);
 send(movePad,'pointermove',1,150,20);
 assert.ok(sticks.move.y<-.9,'the joystick walks');
 assert.equal(sticks.moving,true);

 // Walking and looking at once: one thumb on the stick, another dragging the view.
 send(canvas,'pointerdown',2,600,400);
 send(canvas,'pointermove',2,640,380);
 assert.ok(dragged.x>0&&dragged.y<0,'dragging the view turns the camera');
 assert.ok(sticks.move.y<-.9,'and does not disturb the walk in progress');
 assert.equal(sticks.suppressClick(),true,'a drag is not also treated as a tap');

 send(canvas,'pointerup',2);
 send(movePad,'pointerup',1);
 assert.equal(sticks.move.y,0);
 assert.equal(sticks.moving,false);
});

test('the page and stylesheet agree: a hit area, a hidden ring, and buttons on the right',async()=>{
 const here=new URL('../',import.meta.url);
 const markup=await readFile(new URL('index.html',here),'utf8');
 assert.match(markup,/id="stick"[^>]*>\s*<div id="stickBase"/,'the ring lives inside the hit area');
 assert.match(markup,/id="stickBase"[^>]*aria-hidden="true"/,'and starts hidden');
 assert.doesNotMatch(markup,/id="lookStick"/,'the look stick is gone from the page');

 const css=await readFile(new URL('dual-controls.css',here),'utf8');
 const rule=name=>css.match(new RegExp('\\.touch-controls #mobile #'+name+'\\{([^}]*)\\}'))?.[1]||'';
 for(const name of ['act','movementActions','drink']){
  const body=rule(name);
  assert.match(body,/right:max\(20px/, name+' sits against the right edge');
  assert.match(body,/left:auto/, name+' is not also pinned left');
 }
 assert.match(css,/\.stick-base\{[^}]*opacity:0/,'the ring is transparent until touched');
 assert.match(css,/\.touch-stick\.joystick-on \.stick-base\{[^}]*opacity:\.92/);
});

test('the reach is taken from the ring, including on a short screen',()=>{
 installDOM();
 const area=new Element(),base=new Element(),knob=new Element();
 area.getBoundingClientRect=()=>({left:0,top:0,width:300,height:300});
 base.getBoundingClientRect=()=>({left:0,top:0,width:104,height:104});
 base.offsetWidth=104;                        // the max-height:520px ring
 const stick=createVirtualJoystick({area,base,knob,deadzone:9});
 const send=(type,id,x,y)=>{for(const fn of area.listeners[type]||[])
  fn({pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}});};
 send('pointerdown',1,150,150);
 send('pointermove',1,150,150-52);            // exactly the ring's radius
 assert.ok(Math.abs(stick.output.y+1)<1e-9,
  'full output lands on the rim, not short of it or past it');
});
