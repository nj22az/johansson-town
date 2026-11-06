import test from 'node:test';
import assert from 'node:assert/strict';
import {stickAxes,lookStep,createGamepadInput,createMenuRepeat} from '../src/input/analogue.js';
import {cameraSettings,createCameraControls,navigateControls} from '../src/input/camera-controls.js';
import {createTouchSticks} from '../src/input/touch-sticks.js';
import {Element,installDOM} from './fixtures.mjs';

const pad=()=>({id:'Test standard controller',index:0,connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))});
test('analogue walking has a radial dead zone, bounded diagonals and independent look axes',()=>{
 assert.deepEqual(stickAxes(.07,-.08),{x:0,y:0});assert.ok(stickAxes(.3,0).x>0&&stickAxes(.3,0).x<.3);
 assert.ok(Math.abs(Math.hypot(...Object.values(stickAxes(1,1)))-1)<1e-8);
 assert.deepEqual(stickAxes(NaN,Infinity),{x:0,y:0});
 const input=createGamepadInput(),p=pad();input.sample([null,p]);p.axes=[.5,-.5,1,.4];const f=input.sample([null,p]);assert.ok(f.move.x>0&&f.move.y<0&&f.look.x>.9&&f.look.y>0);
});
test('controller buttons fire once and disconnect, focus loss and held reconnects do not leave stuck input',()=>{
 const input=createGamepadInput(),p=pad();input.sample([p]);p.buttons[0]={pressed:true,value:1};
 assert.equal(input.sample([p]).pressed[0],true);assert.equal(input.sample([p]).pressed[0],false);
 assert.equal(input.sample([]).connected,false);assert.deepEqual(input.sample([]).move,{x:0,y:0});
 assert.equal(input.sample([p]).pressed[0],undefined);p.buttons[0]={pressed:false,value:0};input.sample([p]);p.buttons[0].pressed=true;assert.equal(input.sample([p]).pressed[0],true);
 input.suspend();p.axes[0]=1;assert.deepEqual(input.sample([p]).move,{x:0,y:0});p.axes[0]=0;p.buttons[0].pressed=false;input.sample([p]);p.axes[0]=1;assert.equal(input.sample([p]).move.x,1);
 p.mapping='';assert.equal(input.sample([p]).connected,false,'Unknown layouts must not silently map the wrong controls');
});
test('camera rotation is independent of frame rate, invertible and pitch-limited',()=>{
 const run=hz=>{let view={yaw:0,pitch:0};for(let i=0;i<hz;i++)view=lookStep(view.yaw,view.pitch,.7,.2,1/hz);return view;};
 const a=run(30),b=run(120);assert.ok(Math.abs(a.yaw-b.yaw)<1e-9&&Math.abs(a.pitch-b.pitch)<1e-9);
 assert.ok(lookStep(0,0,0,1,.1,{invertY:true,sensitivity:1}).pitch>0);
 assert.equal(lookStep(0,-1.25,0,1,.1).pitch,-1.25);
 const settings=cameraSettings({sensitivity:Infinity,fov:-100,deadzone:.9,invertY:true,bob:false});assert.deepEqual(settings,{sensitivity:1,fov:45,deadzone:.35,invertY:true,bob:false});
});
test('the move axes come from the joystick and a paused game drops them',()=>{
 installDOM();let enabled=true,dragged=0;
 const canvas=new Element(),movePad=new Element(),stickBase=new Element(),stickKnob=new Element();
 movePad.getBoundingClientRect=()=>({left:0,top:0,width:300,height:300});
 stickBase.getBoundingClientRect=()=>({left:88,top:88,width:124,height:124});
 const sticks=createTouchSticks({canvas,movePad,stickBase,stickKnob,
  enabled:()=>enabled,onDrag:dx=>dragged+=dx});
 const send=(target,type,id,x=0,y=0)=>{for(const fn of target.listeners[type]||[])
  fn({pointerId:id,pointerType:'touch',button:0,clientX:x,clientY:y,preventDefault(){},stopPropagation(){}});};

 send(movePad,'pointerdown',1,150,150);send(movePad,'pointermove',1,150,20);
 assert.ok(sticks.move.y<-.9,'a thumb drag up walks forward');
 send(movePad,'pointerup',1);assert.equal(sticks.move.y,0);

 send(movePad,'pointerdown',3,150,150);send(movePad,'pointermove',3,150,20);
 enabled=false;send(movePad,'pointermove',3,150,20);
 assert.deepEqual(sticks.move,{x:0,y:0},'pausing mid-walk stops the walk');

 enabled=true;send(canvas,'pointerdown',4,56,56);send(canvas,'pointermove',4,90,56);
 assert.equal(dragged,34);
 assert.ok(sticks.suppressClick(),'Camera dragging must not activate a shelf item');
 sticks.reset();
});
test('controller menu repeats do not spam and range adjustments remain within the camera limits',()=>{
 installDOM();const repeat=createMenuRepeat(),f={held:[],move:{x:0,y:1}};assert.equal(repeat(f,.016),'down');assert.equal(repeat(f,.016),'');assert.equal(repeat(f,.4),'down');f.move.y=0;repeat(f,.016);f.move.y=-1;assert.equal(repeat(f,.016),'up');
 const range={type:'range',min:'45',max:'85',step:'1',value:'85',getClientRects:()=>[{}],dispatchEvent(){this.changed=true;}};document.activeElement=range;const root={querySelectorAll:()=>[range]};navigateControls(root,'right');assert.equal(range.value,'85');navigateControls(root,'left');assert.equal(range.value,'84');assert.ok(range.changed);
});
test('camera settings open and close safely with malformed stored preferences',()=>{
 installDOM({'johansson-town-camera-v1':'broken'});let opened=0,closed=0;
 const camera=createCameraControls({onChange(){},onCentre(){},onOpen(){opened++;},onClose(){closed++;}});
 camera.open();assert.equal(camera.active,true);camera.close();assert.equal(camera.active,false);assert.equal(opened,1);assert.equal(closed,1);assert.equal(camera.settings.fov,65);
});

