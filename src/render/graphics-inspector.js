/** Opt-in, local Spector diagnostics. Creating this facade does not load Spector. */
export function createGraphicsInspector({canvas,renderer,canCapture=()=>true,
 loadSpector=()=>import('spectorjs'),loadTimeoutMs=15000,captureTimeoutMs=15000}){
 let spector=null,loading=null,cancelLoad=null,disposed=false,lost=false,pending=null,recording=false;
 let captureCount=0,lastCapture=null,lastError=null,resultUI=null,shownCapture=null;
 const subscriptions=[];
 const error=value=>value instanceof Error?value:new Error(String(value||'Graphics inspection failed'));
 const contextReady=()=>!disposed&&!lost&&canCapture()&&!renderer.getContext().isContextLost?.();
 function requireReady(){
  if(disposed)throw new Error('Graphics inspector has been disposed');
  if(!contextReady())throw new Error('Graphics context is not ready for inspection');
 }
 function stats(){
  const render=renderer.info?.render||{},memory=renderer.info?.memory||{};
  return Object.freeze({enabled:!!spector,loading:!!loading,ready:contextReady()&&!recording,
   capturing:recording,disposed,lost:lost||!!renderer.getContext().isContextLost?.(),captures:captureCount,
   width:canvas.width,height:canvas.height,lastError,
   render:Object.freeze({calls:render.calls||0,triangles:render.triangles||0,lines:render.lines||0,points:render.points||0}),
   memory:Object.freeze({geometries:memory.geometries||0,textures:memory.textures||0,programs:renderer.info?.programs?.length||0}),
   lastCapture:lastCapture?Object.freeze({commands:lastCapture.commands?.length||0,
    draws:(lastCapture.commands||[]).filter(c=>/^draw/.test(c.name||'')).length}):null});
 }
 function settle(failure,capture){
  const task=pending;pending=null;
  if(!task)return;
  clearTimeout(task.timer);
  if(failure){lastError=error(failure).message;task.reject(error(failure));}
  else{lastError=null;task.resolve(capture);}
 }
 function captured(capture){
  recording=false;
  // A cancelled capture can arrive after a timeout or context loss. Do not treat
  // it as a successful new capture, or let it settle a subsequent request.
  if(!pending||disposed||!contextReady())return;
  lastCapture=capture;captureCount++;settle(null,capture);
 }
 function failed(failure){recording=false;settle(failure);}
 function stop(){
  if(!recording||!spector)return;
  try{const capture=spector.stopCapture();if(capture)recording=false;}
  catch(failure){recording=false;lastError=error(failure).message;}
  // Spector can wait for another frame when stopCapture has no commands. Keep
  // readiness false until its completion/error event drains that old request.
 }
 function enable(){
  try{requireReady();}catch(failure){return Promise.reject(failure);}
  if(spector)return Promise.resolve(stats());
  if(loading)return loading;
  let finish;
  const task=new Promise((resolve,reject)=>{
   let done=false;
   const timer=setTimeout(()=>finish(new Error('Loading the local graphics inspector timed out')),loadTimeoutMs);
   finish=(failure,module)=>{
    if(done)return;done=true;clearTimeout(timer);cancelLoad=null;
    if(failure){lastError=error(failure).message;reject(error(failure));return;}
    try{
     requireReady();
     const Spector=module.Spector||module.default?.Spector;
     if(typeof Spector!=='function')throw new Error('Spector.js did not expose its inspector');
     const instance=new Spector();
     subscriptions.push([instance.onCapture,instance.onCapture.add(captured)],[instance.onError,instance.onError.add(failed)]);
     spector=instance;lastError=null;resolve(stats());
    }catch(failure){lastError=error(failure).message;reject(error(failure));}
   };
   cancelLoad=failure=>finish(failure);
   Promise.resolve().then(loadSpector).then(module=>finish(null,module),failure=>finish(failure));
  });
  loading=task;
  task.then(()=>{if(loading===task)loading=null;},()=>{if(loading===task)loading=null;});
  return task;
 }
 async function capture({quick=true,full=false,timeoutMs=captureTimeoutMs}={}){
  requireReady();
  if(pending||recording)throw new Error('A graphics capture is already in progress');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)throw new Error('Capture timeout must be a positive number');
  // Reserve before awaiting the lazy import so two simultaneous requests cannot
  // subscribe to, or resolve from, the same frame.
  let resolve,reject;
  const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const task={resolve,reject,timer:null};pending=task;
  // Observe the rejection while loading; it is returned to the caller below.
  promise.catch(()=>{});
  try{
   await enable();requireReady();
   if(pending!==task)return promise;
   recording=true;
   task.timer=setTimeout(()=>{settle(new Error('No graphics frame was captured before the timeout'));stop();},timeoutMs);
   spector.captureContext(renderer.getContext(),0,!!quick,!!full);
  }catch(failure){recording=false;if(pending===task)settle(failure);}
  return promise;
 }
 async function show(){
  if(!spector)await enable();
  if(disposed)throw new Error('Graphics inspector has been disposed');
  resultUI??=spector.getResultUI();
  if(lastCapture&&shownCapture!==lastCapture){resultUI.addCapture(lastCapture);shownCapture=lastCapture;}
  resultUI.display();return stats();
 }
 function contextLost(){
  lost=true;
  cancelLoad?.(new Error('Graphics context was lost while loading the inspector'));
  settle(new Error('Graphics context was lost during capture'));stop();
 }
 function contextRestored(){lost=false;}
 canvas.addEventListener('webglcontextlost',contextLost,false);
 canvas.addEventListener('webglcontextrestored',contextRestored,false);
 return Object.freeze({enable,capture,show,get stats(){return stats();},dispose(){
  if(disposed)return;disposed=true;cancelLoad?.(new Error('Graphics inspector was disposed'));
  settle(new Error('Graphics inspector was disposed'));stop();
  for(const [observable,id] of subscriptions)observable.remove(id);
  canvas.removeEventListener('webglcontextlost',contextLost,false);
  canvas.removeEventListener('webglcontextrestored',contextRestored,false);
  resultUI?.hide?.();lastCapture=null;
 }});
}
