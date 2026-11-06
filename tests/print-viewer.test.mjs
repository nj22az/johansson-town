import test from 'node:test';
import assert from 'node:assert/strict';
import {createPrintTransform,createPrintViewer} from '../src/ui/print-viewer.js';
import {createReaderHistory} from '../src/ui/reader-history.js';

const near=(actual,expected,message)=>assert.ok(Math.abs(actual-expected)<1e-8,`${message}: ${actual} != ${expected}`);

test('a complete print fits without stretching and the full fit resets after close inspection',()=>{
 const t=createPrintTransform();t.fit(1000,2000,800,600);
 near(t.state.fit,.3,'portrait fit');near(t.state.width*t.state.fit,300,'fitted width');near(t.state.height*t.state.fit,600,'fitted height');
 assert.equal(t.state.zoom,1);assert.equal(t.state.x,0);assert.equal(t.state.y,0);
 t.setZoom(4);t.panTo(99999,-99999);
 assert.equal(t.state.zoom,4);near(t.state.x,200,'rightmost print edge');near(t.state.y,-900,'bottom print edge');
 t.reset();assert.equal(t.state.zoom,1);assert.equal(t.state.x,0);assert.equal(t.state.y,0);
 t.fit(2000,1000,800,600);
 near(t.state.fit,.4,'landscape fit');near(t.state.width*t.state.fit,800,'landscape width');near(t.state.height*t.state.fit,400,'landscape height');
});

test('zoom preserves the image point under the cursor or pinch midpoint until the edge is reached',()=>{
 const t=createPrintTransform();t.fit(1000,1000,500,500);t.setZoom(2);t.panTo(-50,20);
 const ax=100,ay=-80,before=t.state;
 const imagePoint=[(ax-before.x)/(before.fit*before.zoom),(ay-before.y)/(before.fit*before.zoom)];
 t.setZoom(4,ax,ay);const after=t.state;
 near((ax-after.x)/(after.fit*after.zoom),imagePoint[0],'cursor image X');
 near((ay-after.y)/(after.fit*after.zoom),imagePoint[1],'cursor image Y');
 assert.equal(after.zoom,4);near(after.x,-200,'anchored pan X');near(after.y,120,'anchored pan Y');
});

test('zoom and panning stay bounded on narrow and resized stages',()=>{
 const t=createPrintTransform();t.fit(1000,2000,400,600);t.setZoom(100);
 assert.equal(t.state.zoom,8);t.panTo(-1e6,1e6);
 near(t.state.x,-1000,'left edge at maximum zoom');near(t.state.y,2100,'top edge at maximum zoom');
 t.fit(1000,2000,1000,400);
 assert.equal(t.state.zoom,8,'resizing preserves the chosen magnification');
 near(t.state.x,-300,'resize clamps horizontal overflow');near(t.state.y,1400,'resize clamps vertical overflow');
 t.setZoom(-100);assert.equal(t.state.zoom,1);near(t.state.x,0,'fitted X');near(t.state.y,0,'fitted Y');
});

// This fixture belongs to the print viewer alone. Other game's DOM fixtures stay small.
function printDOM(){
 const made=[],downloads=[],blobs=[],resizeListeners=new Set(),observers=[];
 class Node{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes=new Map();this.listeners=new Map();this.captures=new Set();this.style={};this.clientWidth=500;this.clientHeight=500;this.width=0;this.height=0;this.disabled=false;this.hidden=false;this.className='';made.push(this);}
  append(...items){for(const item of items){this.children.push(item);item.parent=this;}}
  replaceChildren(...items){for(const item of this.children)item.parent=null;this.children=[];this.append(...items);}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null;}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  getAttribute(name){return this.attributes.get(name);}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,extra={}){const event={type,prevented:false,stopped:false,preventDefault(){this.prevented=true;},stopPropagation(){this.stopped=true;},...extra};for(const fn of [...(this.listeners.get(type)||[])])fn(event);return event;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  querySelectorAll(selector){const found=[];const match=n=>selector[0]==='.'?n.className.split(/\s+/).includes(selector.slice(1)):selector[0]==='#'?n.id===selector.slice(1):n.tagName===selector.toUpperCase();const scan=n=>{for(const child of n.children){if(match(child))found.push(child);scan(child);}};scan(this);return found;}
  getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight};}
  setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);}
  getContext(){return {};}
  toBlob(callback,type){blobs.push({node:this,callback,type});}
  click(){if(this.tagName==='A')downloads.push({href:this.href,filename:this.download});else if(!this.disabled)this.onclick?.();}
 }
 const head=new Node('head'),body=new Node('body');
 globalThis.document={head,body,baseURI:'https://nj22az.github.io/johansson-town/',createElement:tag=>new Node(tag),getElementById:id=>made.find(x=>x.id===id)};
 globalThis.location={href:document.baseURI};
 globalThis.addEventListener=(type,fn)=>{if(type==='resize')resizeListeners.add(fn);};
 globalThis.removeEventListener=(type,fn)=>{if(type==='resize')resizeListeners.delete(fn);};
 globalThis.ResizeObserver=class{constructor(callback){this.callback=callback;this.active=true;observers.push(this);}observe(node){this.node=node;}disconnect(){this.active=false;}};
 const load=(node,w=1000,h=1000)=>{node.naturalWidth=w;node.naturalHeight=h;node.onload();};
 return {downloads,blobs,resizeListeners,observers,load};
}

function readerHistoryDOM({asynchronous=false}={}){
 const events=new Map(),entries=[{world:'retained'}],queued=[];let index=0,backCalls=0;
 const emit=(kind,event)=>{for(const fn of [...(events.get(kind)||[])])fn(event);};
 const traverse=()=>{if(index>0){index--;emit('popstate',{state:entries[index]});}};
 globalThis.window={
  addEventListener(kind,fn){if(!events.has(kind))events.set(kind,new Set());events.get(kind).add(fn);},
  removeEventListener(kind,fn){events.get(kind)?.delete(fn);},
  history:{
   get state(){return entries[index];},
   pushState(state,_title,url){assert.equal(url,location.href);entries.splice(index+1);entries.push(state);index++;},
   back(){backCalls++;if(asynchronous)queued.push(traverse);else traverse();},
  },
 };
 return {events,get backCalls(){return backCalls;},get state(){return window.history.state;},async flush(){while(queued.length){queued.shift()();await Promise.resolve();}await Promise.resolve();}};
}

test('original image downloads keep their source; page changes reset zoom and stale loads cannot replace the page',()=>{
 const dom=printDOM(),viewer=createPrintViewer({title:'Supplier posters',pages:[
  {image:'/johansson-town/assets/first.png',title:'First advert'},
  {image:'/johansson-town/assets/second.webp',title:'Second advert',filename:'Second supplier poster'},
 ]}),root=viewer.element,stage=root.querySelector('.pv-stage'),save=root.querySelector('.pv-download');
 const first=stage.children[0];assert.equal(save.disabled,true);
 dom.load(first,1000,2000);assert.equal(save.disabled,false);
 root.querySelector('.pv-zoom-in').click();assert.equal(viewer.transform.state.zoom,1.5);
 viewer.setPage(1);const second=stage.children[0];assert.equal(save.disabled,true);assert.equal(viewer.transform.state.zoom,1);
 first.onerror();assert.equal(root.querySelector('.pv-status').textContent,'Loading artwork…','an old failure cannot mark the new page failed');
 dom.load(second,2000,1000);save.click();
 assert.deepEqual(dom.downloads,[{href:'/johansson-town/assets/second.webp',filename:'Second-supplier-poster.webp'}],'download the full original, never a zoomed screenshot');
 assert.equal(viewer.pageIndex,1);assert.equal(root.querySelector('.pv-count').textContent,'2 / 2');
 viewer.dispose();assert.equal(dom.resizeListeners.size,0);assert.ok(dom.observers.every(x=>!x.active));
});

test('wheel zoom, pinch continuation and keyboard pan stay within the viewer and preserve the page',()=>{
 const dom=printDOM(),viewer=createPrintViewer({pages:[{image:'/page-a.png'},{image:'/page-b.png'}]}),root=viewer.element,stage=root.querySelector('.pv-stage');dom.load(stage.children[0]);
 const wheel=stage.emit('wheel',{clientX:250,clientY:250,deltaY:-200});
 assert.equal(wheel.prevented,true);assert.equal(wheel.stopped,true);assert.ok(viewer.transform.state.zoom>1);
 const pointer=(id,x,y)=>({pointerId:id,clientX:x,clientY:y,button:0});
 stage.emit('pointerdown',pointer(1,200,250));stage.emit('pointerdown',pointer(2,300,250));
 stage.emit('pointermove',pointer(2,400,250));const pinched=viewer.transform.state.zoom;assert.ok(pinched>2);
 stage.emit('pointerup',pointer(2,400,250));const beforePan=viewer.transform.state.x;
 stage.emit('pointermove',pointer(1,250,250));assert.ok(viewer.transform.state.x>beforePan,'remaining finger immediately resumes panning');
 stage.emit('pointercancel',pointer(1,250,250));assert.equal(stage.captures.size,0);
 const arrow=root.emit('keydown',{key:'ArrowRight'});assert.equal(arrow.prevented,true);assert.equal(arrow.stopped,true);assert.equal(viewer.pageIndex,0,'arrows pan a magnified page rather than turn it');
 const escape=root.emit('keydown',{key:'Escape'});assert.equal(escape.prevented,false);assert.equal(escape.stopped,false,'the host owns Escape and modal cleanup');
 root.querySelector('.pv-fit').click();assert.equal(viewer.transform.state.zoom,1);
 root.emit('keydown',{key:'ArrowRight'});assert.equal(viewer.pageIndex,1,'arrows turn an unzoomed page');
 assert.equal(root.emit('pointerdown').stopped,true,'toolbar gestures do not reach the World');
 viewer.dispose();assert.ok([...stage.listeners.values()].every(set=>set.size===0));assert.ok([...root.listeners.values()].every(set=>set.size===0));
});

test('drawn pages export their full canvas and reject an asynchronous export from a replaced page',()=>{
 const dom=printDOM(),dimensions=[];
 const viewer=createPrintViewer({title:'Island journal',pages:[
  {title:'Cover',width:1200,height:1680,draw(_ctx,w,h){dimensions.push([w,h]);}},
  {title:'Article',width:1600,height:2400,draw(_ctx,w,h){dimensions.push([w,h]);}},
 ]}),root=viewer.element,save=root.querySelector('.pv-download');
 assert.deepEqual(dimensions,[[1200,1680]]);save.click();assert.equal(dom.blobs[0].type,'image/png');
 viewer.setPage(1);dom.blobs[0].callback(new Blob(['old-page']));assert.equal(dom.downloads.length,0,'a previous page cannot download after the reader has turned');
 save.click();assert.deepEqual(dimensions,[[1200,1680],[1600,2400]]);assert.equal(dom.blobs[1].node.width,1600);assert.equal(dom.blobs[1].node.height,2400);
 const revoked=[],create=URL.createObjectURL,revoke=URL.revokeObjectURL;
 try{
  URL.createObjectURL=()=> 'blob:current-page';URL.revokeObjectURL=href=>revoked.push(href);
  dom.blobs[1].callback(new Blob(['current-page']));assert.deepEqual(dom.downloads,[{href:'blob:current-page',filename:'Article.png'}]);
  viewer.dispose();assert.deepEqual(revoked,['blob:current-page'],'leaving releases retained export data');
 }finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;}
});

test('touch double-tap zoom is applied once and lost capture cannot leave a dragging page',()=>{
 const dom=printDOM(),viewer=createPrintViewer({pages:[{image:'/touch-page.png'}]}),stage=viewer.element.querySelector('.pv-stage');dom.load(stage.children[0]);
 const touch=(pointerId,x=250,y=250)=>({pointerId,pointerType:'touch',button:0,clientX:x,clientY:y});
 for(const id of [1,2]){stage.emit('pointerdown',touch(id));stage.emit('pointerup',touch(id));}
 assert.equal(viewer.transform.state.zoom,2.5,'two stationary finger taps enlarge the page without relying on mouse synthesis');
 stage.emit('dblclick',{clientX:250,clientY:250});assert.equal(viewer.transform.state.zoom,2.5,'a synthetic compatibility double-click cannot immediately undo touch zoom');
 stage.emit('pointerdown',touch(3));stage.emit('pointermove',touch(3,290,280));
 const before={...viewer.transform.state};stage.emit('lostpointercapture',touch(3,290,280));
 assert.equal(stage.captures.size,0);stage.emit('pointermove',touch(3,400,400));
 near(viewer.transform.state.x,before.x,'lost pointer no longer pans X');near(viewer.transform.state.y,before.y,'lost pointer no longer pans Y');
 viewer.dispose();
});

test('native Back and ordinary close each consume only their own reader history entry',()=>{
 printDOM();const history=readerHistoryDOM();let closes=0,viewer;
 viewer=createPrintViewer({pages:[{draw(){}}],onClose(){closes++;viewer.dispose();}});
 assert.ok(history.state.johanssonPrint);window.history.back();
 assert.equal(closes,1);assert.equal(history.backCalls,1,'the host close callback cannot traverse Back for a second time');assert.deepEqual(history.state,{world:'retained'});
 viewer=createPrintViewer({pages:[{draw(){}}],onClose(){closes++;viewer.dispose();}});
 viewer.dispose();assert.equal(closes,1,'disposing during an activity replacement does not run the previous close action');
 assert.equal(history.backCalls,2);assert.deepEqual(history.state,{world:'retained'});assert.equal(history.events.get('popstate').size,0);
 delete globalThis.window;
});

test('quick replacement between diorama and flat reader waits for pending Back in either direction',async()=>{
 for(const first of ['diorama','print']){
  printDOM();const history=readerHistoryDOM({asynchronous:true});let oldClosed=0,newClosed=0,oldDispose,newDispose,newViewer;
  if(first==='diorama')oldDispose=createReaderHistory(()=>oldClosed++,{key:'johanssonDiorama',token:'old-diorama'});
  else{const oldViewer=createPrintViewer({pages:[{draw(){}}],onClose:()=>oldClosed++});oldDispose=()=>oldViewer.dispose();}
  const oldState={...history.state};oldDispose();
  if(first==='diorama'){
   newViewer=createPrintViewer({pages:[{draw(){}}],onClose(){newClosed++;newViewer.dispose();}});newDispose=()=>newViewer.dispose();
  }else newDispose=createReaderHistory(()=>{newClosed++;newDispose();},{key:'johanssonDiorama',token:'new-diorama'});
  assert.deepEqual(history.state,oldState,'the replacement must wait instead of stacking on a retiring marker');assert.equal(history.backCalls,1);
  await history.flush();assert.equal(oldClosed,0);assert.equal(newClosed,0,'the retiring reader cannot close its replacement');
  assert.equal(history.state.world,'retained');
  if(first==='diorama'){assert.ok(history.state.johanssonPrint);assert.equal(history.state.johanssonDiorama,undefined);}
  else{assert.equal(history.state.johanssonDiorama,'new-diorama');assert.equal(history.state.johanssonPrint,undefined);}
  window.history.back();await history.flush();
  assert.equal(newClosed,1);assert.equal(history.backCalls,2,'native Back closes the new reader exactly once');assert.deepEqual(history.state,{world:'retained'});
  assert.equal(history.events.get('popstate').size,0);newDispose();delete globalThis.window;
 }
});
