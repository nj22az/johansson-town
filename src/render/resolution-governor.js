/** Ignore brief stalls; lower sustained load and recover after a settled view. */
export function createResolutionGovernor(){
 let time=0,frames=0,settled=0,cooldown=5,scale=1;
 return {
  get scale(){return scale;},
  sample(dt,{active=true}={}){
   if(!active){time=frames=settled=0;return false;}
   cooldown-=dt;time+=dt;frames++;
   if(time<3)return false;
   const average=time/frames,window=time;time=frames=0;
   if(average<1/35)settled+=window;else settled=0;
   if(cooldown>0)return false;
   const before=scale;
   if(average>1/24){scale=Math.max(2/3,scale-.1);settled=0;cooldown=6;}
   else if(settled>=12&&scale<1){scale=Math.min(1,scale+.1);settled=0;cooldown=6;}
   return scale!==before;
  }
 };
}
