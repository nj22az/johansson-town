/**
 * One road network for everything that drives, and the driver that drives it.
 *
 * A lane is a directed line of points on the running surface, each with a height, and a
 * speed limit. A trip is a list of lanes: where one ends and the next begins a turning
 * curve is laid between them (a Hermite curve on the two headings), so a car turns the
 * corner rather than snapping round it. Lanes are kept on the left, as Japan drives;
 * the network does not decide that, the lanes are simply drawn there.
 *
 * The driver keeps to a few plain rules:
 *  - never faster than the lane allows, and slower into a bend (lateral 1.6 m/s²);
 *  - a following distance to whatever is ahead in its path, vehicle or person, braking
 *    smoothly to a stop short of it;
 *  - at a stop line, a full stop, a second's look, then go when nothing else is moving
 *    through the junction;
 *  - a stop at the end of the trip, in its bay.
 *
 * No three.js in here: a vehicle is anything with a position and a heading to set.
 */
export const DRIVING=Object.freeze({
 accel:1.6,brake:2.6,hardBrake:6,lateral:1.6,
 /** Gap kept to whatever is ahead when stopped behind it, bumper to bumper. */
 standoff:1.6,
 /** How far ahead a driver looks for something in the way. */
 look:22,
 /** A stop line: how long to wait once stopped, and how far round the junction to look. */
 stopWait:1,junctionRadius:9,
 sample:.5,
});

/** A lane from [x,y,z] points (y = running surface), resampled every half metre. */
export function makeLane(id,points,{speed=4.5,stopAtEnd=null}={}){
 const pts=resample(points.map(p=>({x:p[0],y:p[1],z:p[2]})));
 return {id,pts,speed,stopAtEnd,length:pts.at(-1).s};
}

function resample(raw){
 const out=[{...raw[0],s:0}];let s=0,carry=0;
 for(let i=1;i<raw.length;i++){
  const a=raw[i-1],b=raw[i],len=Math.hypot(b.x-a.x,b.z-a.z);if(len<1e-6)continue;
  let t=DRIVING.sample-carry;
  while(t<=len){const u=t/len;out.push({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,z:a.z+(b.z-a.z)*u,s:s+t});t+=DRIVING.sample;}
  carry=len-(t-DRIVING.sample);s+=len;
 }
 const last=raw.at(-1);if(Math.hypot(last.x-out.at(-1).x,last.z-out.at(-1).z)>.05)out.push({...last,s});
 return out;
}

/** A turning curve from the end of one lane to the start of the next. */
function connector(a,b){
 const p0=a.pts.at(-1),p1=b.pts[0],gap=Math.hypot(p1.x-p0.x,p1.z-p0.z);
 if(gap<.3)return [];
 const h0=heading(a.pts,a.pts.length-1),h1=heading(b.pts,0),k=gap*.55,pts=[];
 const n=Math.max(2,Math.ceil(gap/DRIVING.sample));
 for(let i=1;i<n;i++){
  const t=i/n,t2=t*t,t3=t2*t,H0=2*t3-3*t2+1,H1=t3-2*t2+t,H2=-2*t3+3*t2,H3=t3-t2;
  pts.push({x:H0*p0.x+H1*h0[0]*k+H2*p1.x+H3*h1[0]*k,y:p0.y+(p1.y-p0.y)*(3*t2-2*t3),z:H0*p0.z+H1*h0[1]*k+H2*p1.z+H3*h1[1]*k});
 }
 return pts;
}
function heading(pts,i){
 const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],l=Math.hypot(b.x-a.x,b.z-a.z)||1;
 return [(b.x-a.x)/l,(b.z-a.z)/l];
}

export function createRoadNetwork(){
 const lanes=new Map();
 return {
  lanes,
  add(lane){lanes.set(lane.id,lane);return lane;},
  get(id){const l=lanes.get(id);if(!l)throw new Error('No lane '+id);return l;},
  /**
   * A drivable path through lanes in order (ids or lane objects): points with distance,
   * heading, the speed allowed there, and the stop lines on the way.
   */
  path(list){
   const seq=list.map(l=>typeof l==='string'?this.get(l):l),raw=[],limits=[],stops=[];
   seq.forEach((lane,i)=>{
    if(i){for(const p of connector(seq[i-1],lane)){raw.push(p);limits.push(Math.min(seq[i-1].speed,lane.speed));}}
    for(const p of lane.pts){raw.push(p);limits.push(lane.speed);}
    if(lane.stopAtEnd&&i<seq.length-1)stops.push({index:raw.length-1,junction:lane.stopAtEnd});
   });
   return buildPath(raw,limits,stops);
  },
 };
}

function buildPath(raw,limits,stops){
 const pts=[];let s=0;
 raw.forEach((p,i)=>{if(i){const q=raw[i-1];s+=Math.hypot(p.x-q.x,p.z-q.z);}pts.push({x:p.x,y:p.y,z:p.z,s,limit:limits[i]});});
 // The speed a bend allows, from how fast the heading turns over a few metres.
 for(let i=0;i<pts.length;i++){
  const a=pts[Math.max(0,i-3)],b=pts[i],c=pts[Math.min(pts.length-1,i+3)];
  const h1=Math.atan2(b.x-a.x,b.z-a.z),h2=Math.atan2(c.x-b.x,c.z-b.z);let d=Math.abs(h2-h1);if(d>Math.PI)d=2*Math.PI-d;
  const len=Math.max(.5,c.s-a.s),radius=d>1e-3?len/d:Infinity;
  b.radius=radius;b.advisory=Math.min(b.limit,Math.sqrt(DRIVING.lateral*radius));
 }
 return {pts,length:s,stops:stops.map(t=>({s:pts[t.index].s,junction:t.junction}))};
}

/** Position, heading and slope at distance s along a path. */
export function pathPose(path,s,out={}){
 const P=path.pts;s=Math.max(0,Math.min(path.length,s));
 let lo=0,hi=P.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(P[m].s<=s)lo=m;else hi=m;}
 const a=P[lo],b=P[hi],span=b.s-a.s||1,t=(s-a.s)/span;
 out.x=a.x+(b.x-a.x)*t;out.y=a.y+(b.y-a.y)*t;out.z=a.z+(b.z-a.z)*t;
 const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||1;
 out.yaw=Math.atan2(dx,dz);out.pitch=Math.atan2(b.y-a.y,l);out.hx=dx/l;out.hz=dz/l;
 return out;
}

/** Keep the same pedestrian collider on the car, including while held or carried by the ferry.
 * `moving` means its pose is dynamic, not that it is non-solid. Height is relative to minY,
 * so a car on the ferry deck does not make an invisible wall down to the sea.
 */
export function syncVehicleCollider(v){
 const c=v.solid;if(!c)return;c.moving=true;
 if(v.g.visible===false){c.x=c.z=1e6;return;}
 const p=v.g.position;
 Object.assign(c,{x:p.x,z:p.z,yaw:v.g.rotation.y,minY:p.y,height:2});
}

/**
 * The drivers. Each vehicle: {g (has position/rotation), length, width}. obstacles()
 * returns people and other things to keep clear of as [{x,z,r}].
 */
export function createTraffic({obstacles=()=>[]}={}){
 const vehicles=[],pose={};let trips=0;
 function speedFor(v,dt){
  const path=v.trip.path,here=v.s,D=DRIVING;let target=Infinity;
  // The road ahead: limits and bends, braking in good time.
  const P=path.pts;
  for(let i=Math.max(0,Math.floor(here/D.sample)-2);i<P.length&&P[i].s<here+D.look+20;i++){
   const d=P[i].s-here;if(d<0)continue;
   target=Math.min(target,Math.sqrt(P[i].advisory**2+2*D.brake*d));
  }
  // The end of the trip: into the bay and stop.
  target=Math.min(target,Math.sqrt(2*D.brake*Math.max(0,path.length-here-.05)));
  // Stop lines.
  for(const stop of path.stops){
   if(stop.cleared)continue;const d=stop.s-here;if(d<-1){stop.cleared=true;continue;}
   if(d>D.look)break;
   target=Math.min(target,Math.sqrt(2*D.brake*Math.max(0,d)));
   if(d<.6&&v.speed<.05){
    v.waited=(v.waited||0)+dt;
    if(v.waited>=D.stopWait&&junctionClear(v,stop.junction)){stop.cleared=true;v.waited=0;}
   }
   break;
  }
  // Whatever is in the way: other vehicles (moving or parked) and people.
  pathPose(path,here,pose);
  const hx=pose.hx,hz=pose.hz;let blocker=null;
  // In the way means close to the path ahead (not merely ahead of the bonnet): the
  // nearest point of the path within the look distance, and how far along it that is.
  const i0=Math.max(0,Math.floor(here/D.sample)-1);
  const consider=(x,z,r,half,what,crawl=false)=>{
   if(Math.abs(x-pose.x)>D.look+half||Math.abs(z-pose.z)>D.look+half)return;
   let best=Infinity,at=0;
   for(let i=i0;i<P.length&&P[i].s<=here+D.look;i++){const q=P[i];if(q.s<here)continue;const dd=Math.hypot(x-q.x,z-q.z);if(dd<best){best=dd;at=q.s-here;}}
   if(best>v.width/2+r+.25)return;
   // Something beside the car's own body is not ahead of it.
   if(at<=.01&&(x-pose.x)*hx+(z-pose.z)*hz<=0)return;
   const gap=Math.max(at,(x-pose.x)*hx+(z-pose.z)*hz)-v.length/2-half-D.standoff;
   let allowed=Math.sqrt(2*D.brake*Math.max(0,gap));if(crawl)allowed=Math.max(allowed,.7);
   if(allowed<target){target=allowed;blocker=what;}
  };
  for(const o of vehicles){if(o===v||!o.g.visible)continue;consider(o.g.position.x,o.g.position.z,o.width/2,o.length/2,o);}
  // Wait for every person to clear the lane; never creep through their body.
  for(const o of obstacles())if(o)consider(o.x,o.z,o.r??.35,o.r??.35,o.player?'player':'person',false);
  if(blocker==='person')v.personWait=(v.personWait||0)+dt;else if(!blocker)v.personWait=Math.max(0,(v.personWait||0)-dt*.5);
  // Pulling out of a bay: wait for whatever set off nearby to get clear first.
  // Whoever set off first goes first, so two leaving side by side never both wait.
  if(v.s<1.2&&vehicles.some(o=>o!==v&&o.trip&&o.started<v.started&&o.g.visible&&Math.hypot(o.g.position.x-pose.x,o.g.position.z-pose.z)<9)){target=0;blocker=blocker||'traffic';}
  v.blocker=blocker;
  return target;
 }
 function junctionClear(v,j){
  return vehicles.every(o=>o===v||!o.trip||!o.g.visible||o.speed<.3||Math.hypot(o.g.position.x-j.x,o.g.position.z-j.z)>(j.r??DRIVING.junctionRadius));
 }
 function place(v){
  pathPose(v.trip.path,v.s,pose);
  v.g.position.set(pose.x,pose.y,pose.z);v.g.rotation.order='YXZ';v.g.rotation.set(v.trip.reverse?pose.pitch:-pose.pitch,pose.yaw+(v.trip.reverse?Math.PI:0),0);syncVehicleCollider(v);
 }
 return {
  vehicles,
  add(v){v.speed=0;v.trip=null;vehicles.push(v);return v;},
  /** Sets off along a path. onArrive runs once, at the end. */
  drive(v,path,{onArrive=null,from=0,reverse=false}={}){
   for(const s of path.stops)s.cleared=false;
   v.trip={path,onArrive,reverse};v.started=++trips;v.s=from;v.speed=0;v.waited=0;v.g.visible=true;place(v);
  },
  /** Stops wherever it is and puts it at the end of its trip (the clock jumped). */
  finish(v){if(!v.trip)return;v.s=v.trip.path.length;place(v);const done=v.trip.onArrive;v.trip=null;v.speed=0;done?.(v);},
  park(v,{x,y,z,yaw}){v.trip=null;v.speed=0;v.g.position.set(x,y,z);v.g.rotation.order='YXZ';v.g.rotation.set(0,yaw,0);v.g.visible=true;syncVehicleCollider(v);},
  update(dt){
   dt=Math.min(dt,.1);
   for(const v of vehicles){
    syncVehicleCollider(v);
    if(!v.trip)continue;if(v.hold){v.speed=0;continue;}
    const target=speedFor(v,dt);
    if(target>v.speed)v.speed=Math.min(target,v.speed+DRIVING.accel*dt);
    else v.speed=Math.max(target,v.speed-(target<v.speed-1?DRIVING.hardBrake:DRIVING.brake)*dt);
    v.s=Math.min(v.trip.path.length,v.s+v.speed*dt);place(v);
    // Braking stops 5 cm before the endpoint; the arrival tolerance must include
    // that gap even at 60 Hz, where a small step does not overshoot it.
    if(v.s>=v.trip.path.length-.06&&v.speed<.05){const done=v.trip.onArrive;v.trip=null;v.speed=0;done?.(v);}
   }
  },
 };
}
