/** Native 3D performance controls. No Live2D runtime or model data is required. */
const unit=(v,fallback=1)=>Number.isFinite(v)?Math.max(0,Math.min(1,v)):fallback;
export function createPerformance(){
 let strength=1,speaking=false,frozen=false,elapsed=0,from='neutral',mood='neutral',amount=1;
 return {
  configure(options={}){
   if('strength' in options)strength=unit(options.strength,strength);
   if(typeof options.speaking==='boolean')speaking=options.speaking;
   if(typeof options.frozen==='boolean')frozen=options.frozen;
  },
  update(dt,next='neutral'){
   if(next!==mood){from=amount<.5?from:mood;mood=next;amount=0;}
   if(!frozen){elapsed+=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));amount=Math.min(1,amount+Math.max(0,dt||0)/.3);}
   else amount=1;
   const blend=amount*amount*(3-2*amount);
   return {expression:mood,expressionFrom:from,expressionBlend:blend,expressionStrength:strength,
    talk:speaking?(.5+.5*Math.sin(elapsed*15)):0};
  },
  get state(){return {strength,speaking,frozen};}
 };
}
