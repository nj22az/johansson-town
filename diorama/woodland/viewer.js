// The iframe is created by World only after Look. Keeping it separate lets
// World retain its live scene, position and camera when this view closes.
const stage=document.querySelector('#stage');
const poster=document.querySelector('#poster');
const message=document.querySelector('#message');
const hint=document.querySelector('#hint');
const buttons=Object.fromEntries(['front','orbit','posterButton','zoomOut','zoomIn','reset','close'].map(id=>[id,document.getElementById(id)]));
const params=new URLSearchParams(location.search);
const embedded=params.get('embedded')==='1'&&window.parent!==window;
document.body.classList.toggle('embedded',embedded);
const token=params.get('token')||'';
// Electron's custom scheme may serialize its origin as null. The receiver
// still validates the iframe Window and unguessable session token.
const parentOrigin=location.origin==='null'?'*':location.origin;
const abortController=new AbortController();
const state={ready:false,mode:'front',errors:[],modelRequested:false,modelMeshCount:0,modelVertexCount:0,modelBounds:null,decoder:null};
let core=null,closed=false;
let posterScale=1,posterX=0,posterY=0;

function tellParent(type){if(embedded)window.parent.postMessage({type,token},parentOrigin);}
function close(){
  if(closed)return;
  closed=true;abortController.abort();core?.dispose();
  if(embedded)tellParent('johansson-diorama-close');
  else location.href='../../index.html';
}
function showPoster(){return state.mode==='poster'||!state.ready||!core;}
function paintPoster(){poster.style.transform=`translate(${posterX}px,${posterY}px) scale(${posterScale})`;}
function zoomPoster(factor,focusX=0,focusY=0){
  const next=Math.min(5,Math.max(.55,posterScale*factor)),ratio=next/posterScale;
  posterX=focusX-(focusX-posterX)*ratio;posterY=focusY-(focusY-posterY)*ratio;posterScale=next;paintPoster();
}
function setView(next){
  state.mode=['front','orbit','poster'].includes(next)?next:'front';
  buttons.front.setAttribute('aria-pressed',String(state.mode==='front'));
  buttons.orbit.setAttribute('aria-pressed',String(state.mode==='orbit'));
  buttons.posterButton.setAttribute('aria-pressed',String(state.mode==='poster'));
  poster.hidden=!showPoster();
  if(core){core.visible(!showPoster());if(state.mode!=='poster')core.view(state.mode);}
  hint.textContent=state.mode==='orbit'?'Drag to turn · Pinch or scroll to zoom':'Drag to move · Pinch or scroll to zoom';
}
function reset(){if(showPoster()){posterScale=1;posterX=posterY=0;paintPoster();}else core.view(state.mode);}
function zoom(factor){if(showPoster())zoomPoster(factor);else core.zoom(factor);}
window.dioramaViewer={state,view:setView,reset,zoom,close};
buttons.front.addEventListener('click',()=>setView('front'));
buttons.orbit.addEventListener('click',()=>setView('orbit'));
buttons.posterButton.addEventListener('click',()=>setView('poster'));
buttons.reset.addEventListener('click',reset);
buttons.zoomIn.addEventListener('click',()=>zoom(1.2));
buttons.zoomOut.addEventListener('click',()=>zoom(1/1.2));
buttons.close.addEventListener('click',close);
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){event.preventDefault();close();return;}
  if(event.metaKey||event.ctrlKey||event.altKey)return;
  if(event.key==='0')reset();
  if(event.key==='1')setView('front');
  if(event.key==='2')setView('orbit');
  if(event.key==='3')setView('poster');
  if(event.key==='+'||event.key==='=')zoom(1.2);
  if(event.key==='-')zoom(1/1.2);
});

// The exact Blender poster remains useful while loading and as a separate
// view. Its pan/pinch works on touch screens without browser page gestures.
const pointers=new Map();
let previousGesture=null;
function gesture(){
  const values=[...pointers.values()];
  if(!values.length)return null;
  if(values.length===1)return {x:values[0].x,y:values[0].y,distance:0};
  const [a,b]=values;return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,distance:Math.hypot(a.x-b.x,a.y-b.y)};
}
poster.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  poster.setPointerCapture(event.pointerId);pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});previousGesture=gesture();
});
poster.addEventListener('pointermove',event=>{
  if(!pointers.has(event.pointerId))return;
  pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});const next=gesture();
  if(previousGesture){
    posterX+=next.x-previousGesture.x;posterY+=next.y-previousGesture.y;
    if(next.distance&&previousGesture.distance){const box=stage.getBoundingClientRect();zoomPoster(next.distance/previousGesture.distance,next.x-box.left-box.width/2,next.y-box.top-box.height/2);}
    else paintPoster();
  }
  previousGesture=next;
});
function endPointer(event){pointers.delete(event.pointerId);previousGesture=gesture();}
poster.addEventListener('pointerup',endPointer);poster.addEventListener('pointercancel',endPointer);
poster.addEventListener('wheel',event=>{
  event.preventDefault();const box=stage.getBoundingClientRect();zoomPoster(Math.exp(-event.deltaY*.0015),event.clientX-box.left-box.width/2,event.clientY-box.top-box.height/2);
},{passive:false});

function fail(error){
  if(closed||error?.name==='AbortError')return;
  state.errors.push(String(error?.message||error));
  state.ready=false;setView('poster');stage.setAttribute('aria-busy','false');
  buttons.front.disabled=buttons.orbit.disabled=true;message.classList.add('notice');
  message.textContent='The 3D view could not open. You can still explore the finished poster.';
  tellParent('johansson-diorama-ready');
  console.error('Diorama could not open:',error);
}

async function open(){
  try{
    state.modelRequested=true;
    const {createDiorama}=await import('./viewer-3d.js');
    if(closed)return;
    core=await createDiorama(stage,{
      signal:abortController.signal,
      onProgress:text=>{message.textContent=text;},
      onError:fail,
      state,
    });
    if(closed){core.dispose();return;}
    state.ready=true;message.textContent='';stage.setAttribute('aria-busy','false');setView(state.mode);
    tellParent('johansson-diorama-ready');
  }catch(error){fail(error);}
}
window.addEventListener('pagehide',()=>{closed=true;abortController.abort();core?.dispose();},{once:true});
open();
