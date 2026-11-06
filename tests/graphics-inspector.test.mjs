import test from 'node:test';
import assert from 'node:assert/strict';
import {createGraphicsInspector} from '../src/render/graphics-inspector.js';

class Observable{
 listeners=new Map();next=0;
 add(fn){const id=++this.next;this.listeners.set(id,fn);return id;}
 remove(id){this.listeners.delete(id);}
 emit(value){for(const fn of this.listeners.values())fn(value);}
}
function fixture(options={}){
 const canvas=new EventTarget();canvas.width=640;canvas.height=480;
 const context={lost:false,isContextLost(){return this.lost;}},calls=[],instances=[];
 class Spector{
  onCapture=new Observable();onError=new Observable();
  constructor(){instances.push(this);}
  captureContext(...args){calls.push(['capture',...args]);if(options.captureError)throw Error('Invalid framebuffer');}
  stopCapture(){calls.push(['stop']);return options.stopCapture;}
  getResultUI(){return {addCapture:frame=>calls.push(['show-capture',frame]),display:()=>calls.push(['show']),hide:()=>calls.push(['hide'])};}
 }
 let imports=0;
 const renderer={getContext:()=>context,info:{render:{calls:7,triangles:40},memory:{geometries:6,textures:3},programs:[{},{}]}};
 const inspector=createGraphicsInspector({canvas,renderer,loadSpector:()=>{imports++;return options.load?options.load():Promise.resolve({default:{Spector}});},...options});
 const lose=()=>{context.lost=true;canvas.dispatchEvent(new Event('webglcontextlost'));};
 const restore=()=>{context.lost=false;canvas.dispatchEvent(new Event('webglcontextrestored'));};
 return {inspector,canvas,context,calls,instances,Spector,lose,restore,get imports(){return imports;}};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const frame={commands:[{name:'drawElements'},{name:'bindFramebuffer'},{name:'drawArrays'}]};

test('stats and context events never load Spector; explicit activation is shared and UI stays hidden',async()=>{
 const f=fixture();assert.equal(f.imports,0);assert.equal(f.inspector.stats.enabled,false);
 assert.deepEqual(f.inspector.stats.render,{calls:7,triangles:40,lines:0,points:0});
 assert.throws(()=>{f.inspector.stats.memory.textures=999;},TypeError);
 f.lose();assert.equal(f.inspector.stats.ready,false);await assert.rejects(f.inspector.enable(),/not ready/);
 f.restore();await Promise.all([f.inspector.enable(),f.inspector.enable()]);
 assert.equal(f.imports,1);assert.equal(f.instances.length,1);assert.deepEqual(f.calls,[]);f.inspector.dispose();
});

test('capture resolves with its frame and reports compact statistics; a concurrent request is rejected',async()=>{
 const f=fixture(),capture=f.inspector.capture();
 await assert.rejects(f.inspector.capture(),/already in progress/);await tick();
 assert.equal(f.calls[0][1],f.context);assert.deepEqual(f.calls[0].slice(2),[0,true,false]);
 f.instances[0].onCapture.emit(frame);assert.equal(await capture,frame);
 assert.equal(f.inspector.stats.captures,1);assert.deepEqual(f.inspector.stats.lastCapture,{commands:3,draws:2});
 assert.deepEqual(f.calls.map(c=>c[0]),['capture']);
 await f.inspector.show();await f.inspector.show();assert.equal(f.calls.filter(c=>c[0]==='show-capture').length,1);f.inspector.dispose();
});

test('import and capture failures reject their promise and allow an explicit retry',async()=>{
 let attempt=0;const f=fixture({load:()=>++attempt===1?Promise.reject(Error('Local chunk unavailable')):Promise.resolve({Spector:f.Spector})});
 await assert.rejects(f.inspector.capture(),/Local chunk unavailable/);assert.equal(f.inspector.stats.capturing,false);
 const capture=f.inspector.capture();await tick();f.instances[0].onError.emit('Framebuffer incomplete');
 await assert.rejects(capture,/Framebuffer incomplete/);assert.equal(f.inspector.stats.ready,true);
 const next=f.inspector.capture({quick:false,full:true});await tick();f.instances[0].onCapture.emit(frame);assert.equal(await next,frame);
 assert.deepEqual(f.calls.at(-1).slice(2),[0,false,true]);f.inspector.dispose();
 const throwing=fixture({captureError:true});await assert.rejects(throwing.inspector.capture(),/Invalid framebuffer/);throwing.inspector.dispose();
});

test('context loss cancels a capture and cannot let its late frame resolve a new request',async()=>{
 const f=fixture(),capture=f.inspector.capture();await tick();f.lose();
 await assert.rejects(capture,/context was lost during capture/);assert.equal(f.inspector.stats.ready,false);
 f.restore();await assert.rejects(f.inspector.capture(),/already in progress/);
 f.instances[0].onCapture.emit(frame);assert.equal(f.inspector.stats.captures,0);assert.equal(f.inspector.stats.ready,true);
 const next=f.inspector.capture();await tick();f.instances[0].onCapture.emit(frame);assert.equal(await next,frame);f.inspector.dispose();
});

test('capture timeout settles even without frames and waits for Spector to drain before retry',async()=>{
 const f=fixture();await assert.rejects(f.inspector.capture({timeoutMs:5}),/before the timeout/);
 assert.equal(f.inspector.stats.ready,false);await assert.rejects(f.inspector.capture(),/already in progress/);
 f.instances[0].onError.emit('No frames detected');assert.equal(f.inspector.stats.ready,true);
 assert.equal(f.calls.filter(c=>c[0]==='stop').length,1);f.inspector.dispose();
});

test('a delayed or cancelled import cannot instantiate Spector after loading times out or disposal',async()=>{
 let release;const f=fixture({loadTimeoutMs:5,load:()=>new Promise(resolve=>{release=resolve;})});
 await assert.rejects(f.inspector.enable(),/Loading.*timed out/);release({Spector:f.Spector});await tick();
 assert.equal(f.instances.length,0);f.inspector.dispose();
 const disposed=fixture({load:()=>new Promise(resolve=>{release=resolve;})});
 const capture=disposed.inspector.capture();await tick();disposed.inspector.dispose();
 await assert.rejects(capture,/disposed/);release({Spector:disposed.Spector});await tick();assert.equal(disposed.instances.length,0);
});

test('disposal removes subscriptions and listeners, hides requested UI and rejects outstanding capture',async()=>{
 const f=fixture();await f.inspector.enable();await f.inspector.show();const capture=f.inspector.capture();await tick();
 f.inspector.dispose();await assert.rejects(capture,/disposed/);
 assert.equal(f.instances[0].onCapture.listeners.size,0);assert.equal(f.instances[0].onError.listeners.size,0);
 assert.ok(f.calls.some(c=>c[0]==='hide'));f.lose();assert.equal(f.inspector.stats.lost,true);
 f.restore();assert.equal(f.inspector.stats.lost,false);assert.equal(f.inspector.stats.ready,false);
 await assert.rejects(f.inspector.capture(),/disposed/);
});
