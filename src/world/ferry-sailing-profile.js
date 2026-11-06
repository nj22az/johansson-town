/** The same cleared water track, timed in visible seconds. The timetable's minutes
 * remain a journey-accounting contract; neither a camera nor a passenger changes
 * a ship's motion. Limits are game tuning for this miniature harbour. */
export const FERRY_MOTION_LIMITS=Object.freeze({
 speed:Object.freeze({astern:.7,swing:.65,manoeuvring:1.5,sea:3,approach:1.1,berthing:.6}),
 turn:1.8,acceleration:.12,
});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

export function timeFerryPassage(plan,limits=FERRY_MOTION_LIMITS){
 const count=Math.ceil(plan.duration/.25),samples=[];
 for(let i=0;i<=count;i++){const sourceTime=plan.duration*i/count,p=plan.pose(sourceTime);samples.push({...p,sourceTime});}
 const n=samples.length,ds=new Float64Array(n),speed=new Float64Array(n),times=new Float64Array(n);
 const omega=limits.turn*Math.PI/180;
 for(let i=0;i<n;i++)speed[i]=limits.speed[samples[i].kind]??.4;
 for(let i=1;i<n;i++){
  const a=samples[i-1],b=samples[i];ds[i]=Math.hypot(b.x-a.x,b.z-a.z);
  const angle=Math.abs(wrap(b.yaw-a.yaw)),cap=angle>1e-9?omega*ds[i]/angle:Infinity;
  speed[i-1]=Math.min(speed[i-1],cap);speed[i]=Math.min(speed[i],cap);
 }
 speed[0]=speed[n-1]=0;
 for(let i=1;i<n;i++)speed[i]=Math.min(speed[i],Math.sqrt(speed[i-1]**2+2*limits.acceleration*ds[i]));
 for(let i=n-2;i>=0;i--)speed[i]=Math.min(speed[i],Math.sqrt(speed[i+1]**2+2*limits.acceleration*ds[i+1]));
 for(let i=1;i<n;i++){
  const travel=ds[i]>1e-10?2*ds[i]/Math.max(1e-8,speed[i-1]+speed[i]):0;
  const turn=Math.abs(wrap(samples[i].yaw-samples[i-1].yaw))/omega;
  times[i]=times[i-1]+Math.max(travel,turn,1e-8);
 }
 const duration=times[n-1];
 const indexAt=time=>{let lo=0,hi=n-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(times[mid]<=time)lo=mid;else hi=mid;}return lo;};
 function pose(time){
  const t=Math.max(0,Math.min(duration,Number.isFinite(time)?time:0)),i=indexAt(t),dt=times[i+1]-times[i],u=(t-times[i])/dt;
  const a=samples[i],b=samples[i+1],v0=speed[i],v1=speed[i+1];
  // Constant acceleration on a short arc-length sample; using the original pose
  // retains the hull-clear track and its keyed, sometimes astern, heading.
  const f=ds[i+1]>1e-10?Math.max(0,Math.min(1,(v0*dt*u+(v1-v0)*dt*u*u/2)/ds[i+1])):u;
  const p=plan.pose(a.sourceTime+(b.sourceTime-a.sourceTime)*f);
  const actualSpeed=ds[i+1]>1e-10?v0+(v1-v0)*u:0;
  return {...p,speed:t===duration?0:actualSpeed,turn:wrap(b.yaw-a.yaw)/Math.max(ds[i+1],1e-10)*actualSpeed,seconds:t,sourceTime:a.sourceTime+(b.sourceTime-a.sourceTime)*f,progress:t/duration};
 }
 const atSource=t=>{let i=Math.min(n-2,Math.floor(t/plan.duration*count));const f=(t-samples[i].sourceTime)/(samples[i+1].sourceTime-samples[i].sourceTime);return times[i]+(times[i+1]-times[i])*f;};
 return Object.freeze({duration,length:plan.length,pose,
  legs:Object.freeze(plan.legs.map(l=>Object.freeze({...l,from:atSource(l.from),until:atSource(l.until)}))),
  signals:Object.freeze(plan.signals.map(s=>Object.freeze({...s,at:atSource(s.at)}))),limits});
}
