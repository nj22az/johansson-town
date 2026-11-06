// One decode at a time, with bounded recovery and a small walking look-ahead.
export function createDetailStream({enabled=true,onStart=()=>{},onChange=()=>{},timeoutMs=15000,retryMs=2000,maxAttempts=3,lookAhead=16,radiusScale=1,maxConcurrent=1,maxPending=Infinity,now=Date.now}={}){
 const entries=[],stats={enabled,active:null,loaded:[],failed:[],retries:0};let busy=0;
 const remove=(list,id)=>{const i=list.indexOf(id);if(i>=0)list.splice(i,1);};
 function add(entry){const state={...entry,status:'idle',attempts:0,retryAt:0,pending:false};entries.push(state);return state;}
 function update(position,direction){
  if(busy>=maxConcurrent||entries.filter(e=>e.pending).length>=maxPending)return;
  const ahead={x:position.x+(direction?.x||0)*lookAhead,z:position.z+(direction?.z||0)*lookAhead};
  const distance=(entry,point)=>entry.distance?entry.distance(point):Math.hypot(point.x-entry.x,point.z-entry.z);
  const entry=entries.filter(e=>(enabled||e.requiredNearby)&&!e.pending&&(e.status==='idle'||e.status==='failed'&&e.attempts<maxAttempts&&now()>=e.retryAt))
   .map(e=>({e,d:Math.min(distance(e,position),distance(e,ahead))}))
   .filter(v=>v.d<=(v.e.radius??40)*radiusScale).sort((a,b)=>((a.e.priority??2)*12+a.d)-((b.e.priority??2)*12+b.d))[0]?.e;
  if(!entry)return;
  busy++;entry.pending=true;entry.status='loading';entry.attempts++;stats.active=entry.id;
  if(entry.attempts>1)stats.retries++;
  try{onStart(entry.id);}catch{}
  let timer,timedOut=false;
  const fail=error=>{entry.status='failed';entry.retryAt=now()+retryMs*2**(entry.attempts-1);if(!stats.failed.includes(entry.id))stats.failed.push(entry.id);console.warn('Detail fallback:',entry.id,error.message);};
  const task=Promise.resolve().then(entry.load).then(ok=>{
   if(ok===false)throw Error('Detail unavailable');
   entry.status='ready';remove(stats.failed,entry.id);if(!stats.loaded.includes(entry.id))stats.loaded.push(entry.id);onChange();
  }).catch(fail).finally(()=>{entry.pending=false;});
  // Late decodes still mount and clear the failure. Do not request that entry twice.
  Promise.race([task,new Promise(resolve=>{timer=setTimeout(()=>{timedOut=true;fail(Error('Detail loading timed out'));resolve();},entry.timeoutMs??timeoutMs);})])
   .finally(()=>{if(!timedOut)clearTimeout(timer);busy--;stats.active=null;});
 }
 /** Whether anything within its reach of `position` has still to load (not a failure waiting to retry). */
 function pendingNear(position){return entries.some(e=>(enabled||e.requiredNearby)&&(e.status==='idle'||e.status==='loading')&&(e.distance?e.distance(position):Math.hypot(position.x-e.x,position.z-e.z))<=(e.radius??40));}
 return {add,update,stats,pendingNear};
}
export function registerDetail(world,entry){(world.details??=[]).push(entry);}
