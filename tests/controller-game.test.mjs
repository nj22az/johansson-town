import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {installDOM} from './fixtures.mjs';

// Run the actual game with its fallback scenery and real Three.js transforms.
// Only rendering, asset transport and browser APIs are replaced in this smoke.
test('controller and camera controls boot in the game, pause movement in settings and resume cleanly',async()=>{
 installDOM();globalThis.innerHeight=768;globalThis.matchMedia=()=>({matches:false});globalThis.addEventListener=()=>{};
 // 30 October 2026 publication: the random opening can put this input smoke beside an occupied fish-auction mark.
 // The same 2.7 cm stop reproduces on unchanged main. Use the clear ferry landing; keep every control assertion.
 location.search='?spawn=ferry';location.href+=location.search;
 globalThis.requestAnimationFrame=()=>1;globalThis.cancelAnimationFrame=()=>{};document.querySelectorAll=()=>[];
 document.head=document.createElement('head');document.getElementById=id=>document.querySelector('#'+id);document.hidden=false;window.devicePixelRatio=1;
 let pads=[];Object.defineProperty(navigator,'getGamepads',{configurable:true,value:()=>pads});
 const fetchBefore=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:404});
 const moduleUrl=new URL('../src/game.js',import.meta.url),three=new URL('../vendor/three.module.js',import.meta.url).href;
 const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
 let source=await readFile(moduleUrl,'utf8');source=source.replace(/(from\s*['"])(\.[^'"]+)(['"])/g,(_,a,b,c)=>a+new URL(b,moduleUrl).href+c);
 const shim=data(`export * from ${JSON.stringify(three)};export class WebGLRenderer {constructor({canvas}){this.domElement=canvas;this.capabilities={getMaxAnisotropy:()=>8,isWebGL2:true};this.shadowMap={};this.info={render:{calls:0,triangles:0}};this.dpr=1;this.target=null;this.autoClear=true;}setPixelRatio(x){this.dpr=x;}getPixelRatio(){return this.dpr;}setSize(){}render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}getDrawingBufferSize(t){t.set(1280,720);return t;}getRenderTarget(){return this.target;}setRenderTarget(t){this.target=t;}clear(){}clearDepth(){}}`);
 source=source.replace("import * as THREE from '"+three+"';","import * as THREE from '"+shim+"';");
 source+='\nexport {camera,player,activities,cameraControls,touchSticks,controllerFrame,updateController,simulate,controlsAllowed,resetInput,centreCamera,keys};export const stand=()=>{seated=false;parkSeat=null;};export const resetMovementSample=()=>{walkMotion.reset();accumulator=0;};';
 try{
  const api=await import(data(source));assert.equal(window.__JOHANSSON_RUNNING__,true);assert.equal(window.__JOHANSSON_STABILITY__.ok,true,window.__JOHANSSON_STABILITY__.failures.join(', '));api.stand();assert.ok(api.controlsAllowed());
  assert.deepEqual([api.player.position.x,api.player.position.z],[-1.5,-72.7],'the controller smoke starts on its clear ferry landing');
  const p={id:'CPU standard pad',index:0,mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};pads=[p];api.updateController(1/60);
  p.axes=[0,0,1,.2];api.updateController(1/60);const before=api.camera.quaternion.clone();api.simulate(.1);assert.ok(api.camera.quaternion.angleTo(before)>.05,'Right stick turns the actual game camera');
  api.cameraControls.open();assert.equal(api.controlsAllowed(),false);api.resetInput();assert.deepEqual(api.touchSticks.move,{x:0,y:0});
  p.buttons[1].pressed=true;api.updateController(1/60);assert.equal(api.cameraControls.active,false,'B closes settings without opening an activity');
  p.buttons[1].pressed=false;api.updateController(1/60);p.buttons[9].pressed=true;api.updateController(1/60);assert.equal(document.querySelector('#directory').classList.contains('hidden'),false,'Menu opens town book');
  p.buttons[9].pressed=false;api.updateController(1/60);p.buttons[1].pressed=true;api.updateController(1/60);assert.equal(document.querySelector('#directory').classList.contains('hidden'),true);
  pads=[];api.updateController(1/60);assert.deepEqual(api.controllerFrame.look,{x:0,y:0});assert.deepEqual(api.controllerFrame.move,{x:0,y:0});
  api.centreCamera();assert.equal(api.camera.rotation.x,0);assert.equal(window.__JOHANSSON_CAMERA_MODE__,'first');
  const {createDesktopInput}=await import('../../steam-deck/ui/controller.mjs');
  window.johanssonDesktop={offline:true};window.johanssonDesktopInput=createDesktopInput(()=>({}));
  p.mapping='';p.buttons.forEach(b=>{b.pressed=false;b.value=0;});p.axes=[0,-1,.8,.2];pads=[p];
  const linuxBefore=api.player.position.clone(),linuxView=api.camera.quaternion.clone();
  for(let i=0;i<12;i++){api.updateController(1/60);api.simulate(1/60);}
  assert.ok(api.player.position.distanceTo(linuxBefore)>.05,'Unmapped Linux left stick moves the actual player');
  assert.ok(api.camera.quaternion.angleTo(linuxView)>.05,'Unmapped Linux right stick rotates the actual camera');
  p.axes=[0,-.5,0,0];
  const origin=api.player.position.clone(),distances=[];
  for(const hz of [30,60,90]){
   api.player.position.copy(origin);api.resetInput();api.resetMovementSample();
   for(let i=0;i<hz;i++){api.updateController(1/hz);api.simulate(1/hz);}
   distances.push(api.player.position.distanceTo(origin));
  }
  assert.ok(distances.every(d=>d>.05),'Movement must remain real at all refresh rates');
  assert.ok(Math.max(...distances)-Math.min(...distances)<.10,'One second of movement must not accelerate on a 90 Hz Deck: '+JSON.stringify(distances));
  pads=[];api.updateController(1/60);assert.deepEqual(api.controllerFrame.move,{x:0,y:0});
 }catch(error){if(error.stack)error.stack=error.stack.split('\n').map(line=>line.length>500?line.slice(0,200)+'…':line).join('\n');throw error;}
 finally{globalThis.fetch=fetchBefore;}
});
