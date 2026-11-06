/** Pause a lost WebGL context without discarding the live town or its open room. */
export function createGraphicsLifecycle({canvas,getRunning,setRunning,save=()=>{},resetInput=()=>{},
 suspendInput=()=>{},dropPipeline=()=>{},restoreGraphics=()=>{},resetClock=()=>{},followClock=()=>{},
 onLost=()=>{},onRestored=()=>{},onError=()=>{}}){
 let lost=false,resumeRunning=false;
 const report=(error,phase)=>{try{onError(error,phase);}catch{}};
 const safely=(callback,phase)=>{try{callback();}catch(error){report(error,phase);}};
 function contextLost(event){
  // Cancelling the browser's default makes this context eligible for restoration.
  event.preventDefault?.();
  if(lost)return;
  lost=true;resumeRunning=!!getRunning();setRunning(false);
  // Saving or input cleanup can fail independently; neither should prevent the
  // rendering pause and disposal of targets belonging to the dead context.
  for(const callback of [save,resetInput,suspendInput,dropPipeline])safely(callback,'pause');
  safely(onLost,'pause');
 }
 function contextRestored(){
  if(!lost)return;
  try{
   restoreGraphics();resetClock();followClock();
  }catch(error){report(error,'restore');return;}
  lost=false;setRunning(resumeRunning);safely(onRestored,'restore');
 }
 canvas.addEventListener('webglcontextlost',contextLost,false);
 canvas.addEventListener('webglcontextrestored',contextRestored,false);
 return {
  get lost(){return lost;},
  dispose(){canvas.removeEventListener('webglcontextlost',contextLost,false);canvas.removeEventListener('webglcontextrestored',contextRestored,false);}
 };
}
