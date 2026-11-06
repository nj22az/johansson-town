// A local save catches up at the established one second / one town minute rate.
// Bound a return to one town day so a long absence cannot stall mobile startup.
export const MAX_ABSENCE_MINUTES=1440;
export function elapsedTownAbsence(savedAt,now=Date.now()){
 return Number.isFinite(savedAt)&&savedAt>0&&Number.isFinite(now)?Math.max(0,Math.min(MAX_ABSENCE_MINUTES,(now-savedAt)/1000)):0;
}

export function pendingTownAbsence(saved,now=Date.now()){
 const unfinished=Number.isFinite(saved?.pendingTownMinutes)?Math.max(0,saved.pendingTownMinutes):0;
 return Math.min(MAX_ABSENCE_MINUTES,unfinished+elapsedTownAbsence(saved?.savedAt,now));
}

// Preserve the same simulation steps, but give rendering and input a turn between
// batches. The step cap also bounds work when the clock has coarse resolution.
export function createTownCatchup({advance,now=()=>performance.now(),budgetMs=4,maxSteps=40}){
 let pending=0;
 return {get pending(){return pending;},add(seconds){
  if(Number.isFinite(seconds)&&seconds>0)pending=Math.min(MAX_ABSENCE_MINUTES,pending+seconds);
 },tick({budgetMs:frameBudget=budgetMs,maxSteps:stepLimit=maxSteps}={}){
  const start=now();let steps=0;
  while(pending>0&&steps<stepLimit&&(steps===0||now()-start<frameBudget)){
   const dt=Math.min(.2,pending);pending=Math.max(0,pending-dt);if(pending<1e-9)pending=0;
   advance(dt,pending);steps++;
  }
  return steps;
 }};
}
