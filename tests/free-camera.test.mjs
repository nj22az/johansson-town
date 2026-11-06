import test from 'node:test';
import assert from 'node:assert/strict';
import {stepFreeCamera,createFreeCamera} from '../src/input/free-camera.js';

const still={move:{x:0,y:0,z:0},look:{x:0,y:0}};
const fly=(pose,input,seconds,limits)=>{for(let t=0;t<seconds;t+=1/60)pose=stepFreeCamera(pose,input,1/60,limits);return pose;};
const origin={x:0,y:2,z:0,yaw:0,pitch:0};

test('with nothing pressed the lens stays exactly where it is',()=>{
 const after=fly(origin,still,2);
 assert.deepEqual([after.x,after.y,after.z,after.yaw,after.pitch],[0,2,0,0,0]);
});

test('W flies the way the lens looks, easing in rather than jumping',()=>{
 const first=stepFreeCamera(origin,{...still,move:{z:1}},1/60);
 assert.ok(first.z<0&&first.z>-4/60,'starts gently');
 const after=fly(origin,{...still,move:{z:1}},1);
 assert.ok(after.z<-3&&after.z>-4.1,`about four metres a second, got ${after.z}`);
 assert.ok(Math.abs(after.x)<1e-9);
 // Turned a quarter to the right (yaw -90 degrees), forward is +x.
 const turned=fly({...origin,yaw:-Math.PI/2},{...still,move:{z:1}},1);
 assert.ok(turned.x>3&&Math.abs(turned.z)<1e-6);
});

test('it never goes below the ground, nor past its leash',()=>{
 const floor=()=>1;
 const down=fly(origin,{...still,move:{y:-1}},3,{floor});
 assert.ok(Math.abs(down.y-1.15)<1e-9,`stops just above the ground, got ${down.y}`);
 const far=fly(origin,{...still,move:{z:1},fast:true},10,{centre:{x:0,z:0},radius:20});
 assert.ok(Math.hypot(far.x,far.z)<=20+1e-9);
 const high=fly(origin,{...still,move:{y:1}},5,{ceiling:5});
 assert.equal(high.y,5);
});

test('looking up and down stops short of straight up or down',()=>{
 const up=stepFreeCamera(origin,{...still,look:{x:0,y:-10}},1/60);
 assert.ok(up.pitch<=1.5&&up.pitch>1.4);
 const down=stepFreeCamera(origin,{...still,look:{x:0,y:10}},1/60);
 assert.ok(down.pitch>=-1.5);
});

test('a pinch or the wheel moves a set distance once',()=>{
 const after=stepFreeCamera(origin,{...still,nudge:{z:2}},1/60);
 assert.ok(Math.abs(after.z+2)<1e-9);
 const next=stepFreeCamera(after,still,1/60);
 assert.equal(next.z,after.z,'and nothing carries on afterwards');
});

/** Just enough of a browser to see who gets the keys. */
function fakeBrowser(){
 const listeners=[],classes=new Set(),made=[];
 const el=()=>{const e={children:[],hidden:false,dataset:{},style:{},classList:{add(){},remove(){}},append(...c){this.children.push(...c);},setAttribute(){},querySelector(){return {classList:{add(){},remove(){}},setAttribute(){},set innerHTML(v){e.hint=v;}};},contains:()=>false};made.push(e);return e;};
 const doc={head:{append(){}},body:{append(){}},documentElement:{classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)}},createElement:el,exitPointerLock(){}};
 const win={addEventListener:(type,fn)=>listeners.push({type,fn}),matchMedia:()=>({matches:false}),navigator:{}};
 const fire=(type,extra={})=>{const e={type,code:extra.code,repeat:false,target:{},stopped:false,prevented:false,cancelable:true,
  stopImmediatePropagation(){this.stopped=true;},preventDefault(){this.prevented=true;},...extra};for(const l of listeners)if(l.type===type)l.fn(e);return e;};
 return {doc,win,classes,fire};
}
const camera={position:{set(x,y,z){Object.assign(this,{x,y,z});}},rotation:{set(){}},updateMatrixWorld(){}};

test('while the lens is loose it takes every key, and Escape puts it back',()=>{
 const b=fakeBrowser(),changes=[];
 const free=createFreeCamera({doc:b.doc,win:b.win,onChange:c=>changes.push(c.active)});
 assert.equal(b.fire('keydown',{code:'KeyW'}).stopped,false,'closed, the game has its keys');
 free.enter({position:{x:1,y:2,z:3},yaw:0,pitch:0});
 assert.ok(free.active&&b.classes.has('free-camera'));
 assert.equal(b.fire('keydown',{code:'KeyQ'}).stopped,true,'Q would open the Town book; here it flies down');
 assert.equal(b.fire('pointerdown',{pointerId:1,clientX:0,clientY:0}).stopped,true);
 b.fire('keydown',{code:'Escape'});
 assert.equal(free.active,false);assert.ok(!b.classes.has('free-camera'));
 assert.deepEqual(changes,[true,false]);
});

test('held keys fly the camera and are let go on leaving',()=>{
 const b=fakeBrowser(),free=createFreeCamera({doc:b.doc,win:b.win});
 free.enter({position:{x:0,y:2,z:0},yaw:0,pitch:0});
 b.fire('keydown',{code:'KeyW'});
 for(let i=0;i<60;i++)free.update(1/60,camera);
 assert.ok(camera.position.z<-3);
 b.fire('keydown',{code:'KeyO'});assert.equal(free.active,false);
 free.enter({position:{x:0,y:2,z:0},yaw:0,pitch:0});
 for(let i=0;i<30;i++)free.update(1/60,camera);
 assert.equal(camera.position.z,0,'W from last time is not still held');
});

test('L and the Look button step through the looks without leaving the free camera',()=>{
 const b=fakeBrowser(),order=['none','manga','crayon'];let i=0;
 const free=createFreeCamera({doc:b.doc,win:b.win,look:{id:()=>order[i],label:()=>order[i],next:()=>{i=(i+1)%order.length;}}});
 b.fire('keydown',{code:'KeyL'});assert.equal(i,0,'closed, L belongs to the game');
 free.enter({position:{x:0,y:2,z:0},yaw:0,pitch:0});
 b.fire('keydown',{code:'KeyL'});b.fire('keydown',{code:'KeyL'});
 assert.equal(order[i],'crayon');assert.ok(free.active);
});
