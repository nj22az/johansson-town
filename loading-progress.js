// One bar from the first byte to the first playable frame. It counts completed work: each step carries its share
// of a typical start (`weight`, measured) and how long it usually takes (`seconds`). While a step runs, the page
// lets the bar glide towards that step's end at its usual pace (a compositor animation, index.html, so it keeps
// moving through the town's single blocking build), but it never passes the end of a step that has not finished, and it
// never goes backwards. No timers here: the module reports where the bar may go and how fast.
export const STARTUP_STEPS=Object.freeze([
 // Shares of a start measured in Chromium (desktop and phone profiles, 19 October 2026): building the town and
 // drawing it the first time (shader programs, texture uploads) are most of the wait.
 ['controls','Preparing controls',1,.3],['code','Loading game code',8,1.5],
 ['accessories','Loading character accessories',2,.5],['graphics','Preparing graphics',2,.5],
 ['town','Building the town',30,3],['residents','Preparing residents',12,1.5],
 ['shaders','Preparing materials',5,.8],['walking','Preparing walking routes',10,1.2],
 ['preview','Drawing the island',30,3],['frame','Entering the island',0,.5]
].map(([id,label,weight,seconds])=>Object.freeze([id,label,weight,seconds])));
const TOTAL=STARTUP_STEPS.reduce((sum,step)=>sum+step[2],0);
/** How far into a running step the bar may glide before that step is done. */
const GLIDE=.9;

export function createLoadingProgress({onChange=()=>{},now=()=>0}={}){
 const completed=new Set(),files=new Map(),timings={};let active=STARTUP_STEPS[0][0],error=null;
 let resolveReady,rejectReady;
 const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
 ready.catch(()=>{}); // Preview errors may precede the player's START click.
 const step=id=>STARTUP_STEPS.find(s=>s[0]===id);
 const valid=id=>{if(!step(id))throw Error('Unknown loading step: '+id);};
 function snapshot(){
  const assets={completed:0,total:0,failed:0};for(const item of files.values())for(const key of Object.keys(assets))assets[key]+=item[key];
  const done=STARTUP_STEPS.reduce((sum,[id,,weight])=>sum+(completed.has(id)?weight:0),0);
  const running=active&&!completed.has(active)&&!error?step(active):null;
  const percent=done/TOTAL*100,target=running?(done+running[2]*GLIDE)/TOTAL*100:percent;
  const next=STARTUP_STEPS.find(s=>!completed.has(s[0]));
  return {completed:completed.size,total:STARTUP_STEPS.length,percent,target,seconds:running?running[3]:.3,
   ready:STARTUP_STEPS.every(([id])=>id==='frame'||completed.has(id)),
   label:error?'Loading failed':running?running[1]:!next||next[0]==='frame'?'Island ready':next[1],
   error:error?.message||null,assets,timings:{...timings}};
 }
 const emit=()=>onChange(snapshot());
 const api={snapshot,ready,
  start(id){valid(id);if(error||completed.has(id))return;active=id;(timings[id]??={}).start??=now();emit();},
  complete(id){valid(id);if(error||completed.has(id))return;completed.add(id);(timings[id]??={}).end=now();if(active===id)active=null;emit();if(completed.size===STARTUP_STEPS.length)resolveReady(snapshot());},
  fileProgress(group,done,total,failed=0){
   if(error||completed.size===STARTUP_STEPS.length)return;
   files.set(group,{completed:done,total,failed});emit();
  },
  fail(reason){if(error||completed.size===STARTUP_STEPS.length)return;error=reason instanceof Error?reason:new Error(String(reason));emit();rejectReady(error);},
  watch(manager){
   const before={onStart:manager.onStart,onProgress:manager.onProgress,onError:manager.onError},failed=new Set();
   const update=(url,done,total)=>api.fileProgress('scene',done,total,failed.size);
   manager.onStart=function(...args){before.onStart?.apply(this,args);update(...args);};
   manager.onProgress=function(...args){before.onProgress?.apply(this,args);update(...args);};
   manager.onError=function(url){failed.add(url);before.onError?.call(this,url);};
  }
 };
 emit();return api;
}
