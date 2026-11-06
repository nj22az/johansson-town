import * as THREE from '../../vendor/three.module.js';
import {FERRY_HULL} from './ferry-model.js';
import {MINATO_BERTH} from './minato-berth.js';

/**
 * How the Minato Maru moves in Minato harbour: where her centre goes, and which way her bow
 * points, which is not always the way she is going. A 34.5 m twin-screw ferry with a bow thruster
 * comes in round the breakwater's west end, pivots in the western basin and lays herself alongside
 * the pier; leaving, she goes astern off the berth, pivots on the thruster and only then goes ahead.
 *
 * A path is a list of keys [x, z, yaw°|null]: the centre passes through every key; where a key
 * gives a yaw the bow points that way there (null: along the track, bow first), and between keys
 * it turns smoothly. The keys were chosen so that every point of the hull stays off the outer pier's
 * fenders (she lies on their faces only at the berth), a metre and more off the second pier's arm and the
 * breakwater, and off the quay (tests/ferry.test.mjs, tests/airport-ferry.test.mjs).
 *
 * Since the breakwater moved out (batch 3) the basin is 54 m from the quay, and the outer pier runs
 * 38 m out along her port side: she backs out and to the west until her stern is clear of it, then
 * swings in the western basin onto a heading for the mouth.
 */
/**
 * Moored: port side to the outer pier's west flank, lying on its fenders (minato-berth.js), her stem 2.2 m
 * off the quay's face: her ramp's leaf spans the gap onto the landing plate, and its end lands short of the
 * warehouse's corner (batch 5).
 */
export const BERTH_X=MINATO_BERTH.line-FERRY_HULL.beam/2,BERTH_Z=-52.2-FERRY_HULL.length/2;
const freeze=keys=>Object.freeze(keys.map(k=>Object.freeze(k)));
/**
 * Off the berth: she springs her stern off and goes astern, to seaward and to the west, until she is in
 * the western basin (to key `astern`); then she pivots on her thruster and screws about (−24, −84), her
 * hull sweeping a 17.8 m circle that keeps 2 m off the pier's fenders, the second pier's arm and the
 * breakwater, until she lies on a heading for the harbour mouth at the last key.
 */
export const TOWN_UNBERTHING=Object.freeze({astern:4,keys:freeze([
 [BERTH_X,BERTH_Z,0],[BERTH_X-.5,-73,0],[-12.5,-78.6,0],[-17.5,-82.7,0],
 [-21.6,-84.05,0],[-23.6,-84.15,-6],[-24.2,-84.15,-34],[-24.5,-84.2,-58],[-24.9,-84.3,-80],[-26.3,-84.5,-91],[-28.3,-84.7,-94],
])});
/**
 * In from inside the breakwater's west end, heading east: she pivots about (−24, −84) until her bow points a
 * little east of north, then works across to the berth, her bow coming round to the north as she closes
 * the pier (so it never points at it), and alongside, parallel to the fenders for her last metres.
 */
export const TOWN_BERTHING=Object.freeze({keys:freeze([[-26,-84.9,90],[-24.7,-84.5,68],[-23.9,-83.8,44],[-22.9,-82.6,26],[-20,-80,17],[-15.5,-76.2,11],[-11.6,-72.7,5],[-9.2,-70.5,0],[BERTH_X,BERTH_Z,0]])});
export const HARBOUR_MOUTH=Object.freeze([-47,-86]);
/** The fairway from the open sea to the harbour mouth (the timetable's boats come and go by it). */
export const TOWN_FAIRWAY=freeze([[-82,-142],[-56,-100]]);
const wrap=d=>{while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};

/**
 * The fastest a ship of her kind turns, in degrees a second, by the kind of leg she is on
 * (briefs/ferry-audit.md §7.2): pivoting on the thruster and split engines in a harbour, up to
 * 3°/s; under way at sea with the rudder, 1°/s. Every passage is held to these (tests/airport-ferry).
 */
export const TURN_LIMITS=Object.freeze({astern:3,swing:3,manoeuvring:3,approach:3,berthing:3,sea:1});

/**
 * A polyline turned into keys a ship can sail: each corner is rounded on a circle of the given
 * radius (a turn at a steady rate of turn, as a helmsman makes it). The exact track, straights and
 * arcs, is sampled every `step` metres along its length, so the spline through the keys lies on it.
 * `points` are [x, z]; `radius` one number or one per corner. The keys carry no yaw: along them the
 * bow follows the track. `turns` lists, for each turn, the keys where it begins and ends.
 */
export function roundedTrack(points,radius,step=3){
 // The track as pieces: straights [a, b] and arcs {c, R, a0, sweep}, end to end.
 const pieces=[],used=points.map(()=>0);let at=[...points[0]];
 for(let i=1;i<points.length-1;i++){
  const [ax,az]=points[i-1],[bx,bz]=points[i],[cx,cz]=points[i+1],R=Array.isArray(radius)?radius[i-1]:radius;
  const u=[ax-bx,az-bz],v=[cx-bx,cz-bz],lu=Math.hypot(...u),lv=Math.hypot(...v);u[0]/=lu;u[1]/=lu;v[0]/=lv;v[1]/=lv;
  const angle=Math.acos(Math.max(-1,Math.min(1,u[0]*v[0]+u[1]*v[1])));
  if(Math.PI-angle<1e-3)continue;
  const t=R/Math.tan(angle/2);
  // Each straight is shared by the turns at its two ends: together they must leave some of it straight.
  if(used[i-1]+t>lu*.98||t>lv*.98)throw new RangeError('Corner '+i+' is too tight for a '+R+' m turn');used[i]=t;
  const p=[bx+u[0]*t,bz+u[1]*t],q=[bx+v[0]*t,bz+v[1]*t],bis=[u[0]+v[0],u[1]+v[1]],lb=Math.hypot(...bis),d=R/Math.sin(angle/2);
  const c=[bx+bis[0]/lb*d,bz+bis[1]/lb*d],a0=Math.atan2(p[1]-c[1],p[0]-c[0]),sweep=wrap(Math.atan2(q[1]-c[1],q[0]-c[0])-a0);
  pieces.push({a:at,b:p,length:Math.hypot(p[0]-at[0],p[1]-at[1])});
  pieces.push({c,R,a0,sweep,length:Math.abs(sweep)*R,turn:true});at=q;
 }
 pieces.push({a:at,b:[...points.at(-1)],length:Math.hypot(points.at(-1)[0]-at[0],points.at(-1)[1]-at[1])});
 const total=pieces.reduce((sum,piece)=>sum+piece.length,0),count=Math.max(2,Math.round(total/step));
 const sample=s=>{for(const piece of pieces){if(s<=piece.length+1e-9){const f=piece.length?Math.min(1,s/piece.length):0;
   if(!piece.turn)return [piece.a[0]+(piece.b[0]-piece.a[0])*f,piece.a[1]+(piece.b[1]-piece.a[1])*f];
   const a=piece.a0+piece.sweep*f;return [piece.c[0]+Math.cos(a)*piece.R,piece.c[1]+Math.sin(a)*piece.R];}s-=piece.length;}
  return [...points.at(-1)];};
 const out=[];for(let k=0;k<=count;k++)out.push([...sample(total*k/count),null]);
 // Which keys each turn spans.
 const turns=[];let s0=0;for(const piece of pieces){if(piece.turn)turns.push({from:Math.floor(s0/total*count),to:Math.ceil((s0+piece.length)/total*count)});s0+=piece.length;}
 out.turns=turns;
 return out;
}

/**
 * A track of lines and arcs (roundedTrack) sailed bow first (or stern first, `astern`) at the speed a
 * ship would carry on it: never more than `vMax`, slow enough on each arc that she turns at no more
 * than `turnDeg` °/s, and changing speed by no more than `accel` m/s² (she carries her way in and
 * takes it off well before she stops), from `startSpeed` to `endSpeed`. For the island cargo boat
 * (cargo-shipping.js), whose calls are a few long, plain runs rather than the ferry's keyed legs.
 * pose(seconds) gives {x, z, yaw, speed, turn} as passage() does.
 */
export function profiledTrack(points,radii,{vMax=3,turnDeg=2.4,accel=.05,startSpeed=0,endSpeed=0,astern=false}={}){
 const track=roundedTrack(points,radii,.5),n=track.length,s=[0];
 for(let i=1;i<n;i++)s.push(s[i-1]+Math.hypot(track[i][0]-track[i-1][0],track[i][1]-track[i-1][1]));
 const dir=track.map((_,i)=>{const a=track[Math.max(0,i-1)],b=track[Math.min(n-1,i+1)];return Math.atan2(b[0]-a[0],b[1]-a[1]);});
 const bend=dir.map((_,i)=>{const j=Math.min(n-1,i+1),k=Math.max(0,i-1);return Math.abs(wrap(dir[j]-dir[k]))/Math.max(1e-6,s[j]-s[k]);});
 const omega=turnDeg*Math.PI/180,v=bend.map(b=>Math.min(vMax,b>1e-5?omega/b:vMax));
 v[0]=Math.min(v[0],startSpeed);v[n-1]=Math.min(v[n-1],endSpeed);
 for(let i=1;i<n;i++)v[i]=Math.min(v[i],Math.sqrt(v[i-1]**2+2*accel*(s[i]-s[i-1])));
 for(let i=n-2;i>=0;i--)v[i]=Math.min(v[i],Math.sqrt(v[i+1]**2+2*accel*(s[i+1]-s[i])));
 // Time to each sample: the speed changes evenly in time between samples, so dt = 2 ds / (v0 + v1).
 const t=[0];for(let i=1;i<n;i++)t.push(t[i-1]+2*(s[i]-s[i-1])/Math.max(v[i]+v[i-1],1e-4));
 const T=t.at(-1),flip=astern?Math.PI:0;
 function pose(time){
  time=Math.max(0,Math.min(T,time));let lo=0,hi=n-1;while(hi-lo>1){const m=(lo+hi)>>1;if(t[m]<=time)lo=m;else hi=m;}
  const i=lo,h=(t[i+1]-t[i])||1,u=(time-t[i])/h,a=(v[i+1]-v[i])/h,ds=v[i]*(time-t[i])+a*(time-t[i])**2/2,f=Math.min(1,ds/((s[i+1]-s[i])||1));
  const x=track[i][0]+(track[i+1][0]-track[i][0])*f,z=track[i][1]+(track[i+1][1]-track[i][1])*f,dy=wrap(dir[i+1]-dir[i]);
  const speed=v[i]+(v[i+1]-v[i])*u;
  return {x,z,yaw:wrap(dir[i]+dy*f+flip),speed:astern?-speed:speed,turn:dy/(s[i+1]-s[i]||1)*speed};
 }
 return {pose,duration:T,length:s.at(-1),start:pose(0),end:pose(T)};
}

/**
 * A passage: a keyed track sailed leg by leg, as a ship sails it. Each leg runs from where the last
 * one ended to the key `to`, in its own time (`minutes`), and is of a `kind` (TURN_LIMITS):
 * 'astern' off a berth, 'swing' (pivoting), 'manoeuvring' (slow ahead in a harbour), 'sea',
 * 'approach' and 'berthing'. Her speed along the track is continuous from rest at the first key to
 * rest at the last: a monotone cubic in time through the legs' ends (Fritsch–Carlson, with the
 * Fritsch–Butland slopes), so she never jumps, stops dead or backs up the track. Her bow turns
 * through the keyed headings on a cubic in time whose rate is continuous at every key, and where the
 * keys give no heading she follows the track, bow first. A leg may carry a whistle `signal`
 * ('prolonged', 'astern'), sounded as she enters it.
 *
 * pose(seconds) answers where she is, her heading, speed (m/s), rate of turn (rad/s), the leg, and
 * how exposed she is to the swell (0 in harbour, 1 at sea), for her roll and pitch. `under` says
 * whether she is already making way at the first key (`from`) or still at the last (`to`), as a
 * ship that comes in from beyond the horizon or goes out of sight is; otherwise she is at rest there.
 */
export function passage(keys,legs,under={from:false,to:false}){
 const n=keys.length,curve=new THREE.CatmullRomCurve3(keys.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
 // Arc lengths finely enough that her speed along it does not ripple (the curve's default is 200 steps).
 const PER=Math.max(40,Math.ceil(curve.getLength()*12/(n-1)));curve.arcLengthDivisions=PER*(n-1);curve.updateArcLengths();
 const lengths=curve.getLengths(),L=lengths.at(-1),S=keys.map((_,k)=>lengths[k*PER]);
 const v=new THREE.Vector3(),tan=new THREE.Vector3();
 const point=s=>{curve.getPointAt(Math.max(0,Math.min(1,s/L)),v);return [v.x,v.z];};
 const trackYaw=s=>{curve.getTangentAt(Math.max(.0001,Math.min(.9999,s/L)),tan);return Math.atan2(tan.x,tan.z);};
 // Headings at the keys (unwrapped): keyed, or the track's own where she follows it.
 const free=keys.map(k=>k[2]===null||k[2]===undefined);
 const Y=[];for(let k=0;k<n;k++){let y=free[k]?trackYaw(S[k]):keys[k][2]*Math.PI/180;if(k)y=Y[k-1]+wrap(y-Y[k-1]);Y.push(y);}
 // Time knots at every key. A leg's time is shared among its keys by the work each stretch needs:
 // its distance at the leg's mean speed, or its turn at a comfortable rate (60 % of the limit),
 // whichever takes longer; so she slows where she pivots instead of spinning. Then the monotone
 // cubic s(t) runs through the knots.
 const kt=[0],ks=[0],legEnd=[0];let from=0;
 for(const leg of legs){
  if(!(leg.to>from)||leg.to>=n)throw new RangeError('Legs must run forward along the keys');
  if(!(leg.kind in TURN_LIMITS))throw new RangeError('Unknown leg kind '+leg.kind);
  const span=leg.minutes*60,mean=(S[leg.to]-S[from])/span,rate=TURN_LIMITS[leg.kind]*.6*Math.PI/180,work=[];
  // `ease` (metres): her speed changes from the one she ends the last leg at to this leg's own over that
  // much of it, as a ship carries her way, rather than at its first key (for long legs at very different
  // speeds). The leg's own speed is then the one that still takes its minutes.
  const before=leg.ease&&kt.length>1?(ks.at(-1)-ks.at(-2))/(kt.at(-1)-kt.at(-2)):0;
  const shape=k=>{const f=Math.min(1,((S[k]+S[k+1])/2-S[from])/leg.ease);return f*f*(3-2*f);};
  const stretch=(k,v)=>Math.max((S[k+1]-S[k])/v,Math.abs(Y[k+1]-Y[k])/rate,1e-6);
  let cruise=mean;
  if(before>0){let lo=1e-4,hi=1e3;for(let i=0;i<80;i++){const V=(lo+hi)/2;let t=0;for(let k=from;k<leg.to;k++)t+=stretch(k,before+(V-before)*shape(k));if(t>span)lo=V;else hi=V;}cruise=(lo+hi)/2;}
  for(let k=from;k<leg.to;k++)work.push(stretch(k,before>0?before+(cruise-before)*shape(k):mean));
  const total=work.reduce((a,b)=>a+b,0);
  for(let k=from;k<leg.to;k++){kt.push(kt.at(-1)+span*work[k-from]/total);ks.push(S[k+1]);}
  legEnd.push(kt.length-1);from=leg.to;
 }
 if(from!==n-1)throw new RangeError('The last leg must end at the last key');
 const m=kt.length,h=[],d=[];for(let j=0;j<m-1;j++){h.push(kt[j+1]-kt[j]);d.push((ks[j+1]-ks[j])/h[j]);}
 // At rest at a berth; or already making way, at the speed of her first or last stretch, where she comes in from or goes out to sea.
 const slope=[under.from?d[0]:0];for(let j=1;j<m-1;j++)slope.push(d[j-1]*d[j]<=0?0:3*(h[j-1]+h[j])/((2*h[j]+h[j-1])/d[j-1]+(h[j]+2*h[j-1])/d[j]));slope.push(under.to?d[m-2]:0);
 const hermite=(t,t0,t1,y0,y1,m0,m1)=>{const hh=t1-t0,u=(t-t0)/hh,u2=u*u,u3=u2*u;
  return [(2*u3-3*u2+1)*y0+(u3-2*u2+u)*hh*m0+(-2*u3+3*u2)*y1+(u3-u2)*hh*m1,((6*u2-6*u)*y0+(3*u2-4*u+1)*hh*m0+(-6*u2+6*u)*y1+(3*u2-2*u)*hh*m1)/hh];};
 const T=kt.at(-1);
 const knot=t=>{let j=0;while(j<m-2&&t>kt[j+1])j++;return j;};
 const distance=t=>{t=Math.max(0,Math.min(T,t));const j=knot(t);return hermite(t,kt[j],kt[j+1],ks[j],ks[j+1],slope[j],slope[j+1]);};
 // She passes key k at kt[k] (every key is a knot).
 const keyT=kt;
 // Her heading along the track: between keyed headings a cubic in distance (so the hull sweeps the
 // same water whatever her speed), with the track's own curvature where it meets a stretch she
 // sails bow first, and Fritsch–Butland slopes elsewhere (no overshoot between keys). Her rate of
 // turn is that slope times her speed.
 const trackCurve=s=>{const e=Math.min(.25,L/1e4),a=Math.max(0,s-e),b=Math.min(L,s+e);return wrap(trackYaw(b)-trackYaw(a))/(b-a);};
 const M=keys.map((_,k)=>{
  if(k===0||k===n-1)return free[k]?trackCurve(S[k]):0;
  if(free[k]&&(free[k-1]||free[k+1]))return trackCurve(S[k]);
  const a=(Y[k]-Y[k-1])/(S[k]-S[k-1]),b=(Y[k+1]-Y[k])/(S[k+1]-S[k]),ha=S[k]-S[k-1],hb=S[k+1]-S[k];
  return a*b<=0?0:3*(ha+hb)/((2*hb+ha)/a+(hb+2*ha)/b);
 });
 const headingAt=s=>{let k=0;while(k<n-2&&s>S[k+1])k++;
  if(free[k]&&free[k+1]){const y=Y[k]+wrap(trackYaw(s)-Y[k]);return [y,trackCurve(s)];}
  return hermite(s,S[k],S[k+1],Y[k],Y[k+1],M[k],M[k+1]);};
 const legTimes=legEnd.map(i=>kt[i]);
 const legAt=t=>{let j=0;while(j<legs.length-1&&t>=legTimes[j+1])j++;return j;};
 // Exposure to the swell: 1 on a sea leg, easing in and out over its first and last minute.
 const exposureAt=t=>{const j=legAt(t);if(legs[j].kind!=='sea')return 0;const e=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};return Math.min(e((t-legTimes[j])/60),e((legTimes[j+1]-t)/60));};
 function pose(t){
  t=Math.max(0,Math.min(T,t));const [s,speed]=distance(t),[x,z]=point(s),[yaw,perMetre]=headingAt(s),turn=perMetre*speed;
  const leg=legAt(t);
  return {x,z,yaw:wrap(yaw),speed,turn,leg,kind:legs[leg].kind,exposure:exposureAt(t),distance:s};
 }
 /** Whistle signals in order, with the time she sounds each (entering the leg that carries it). */
 const signals=legs.flatMap((leg,j)=>[].concat(leg.signal||[]).map(kind=>({kind,at:legTimes[j],leg:j})));
 return {pose,duration:T,length:L,legs:legs.map((leg,j)=>({...leg,from:legTimes[j],until:legTimes[j+1]})),keyTimes:keyT,signals,curve};
}

/** A keyed path: pose(u) for u 0–1 along it, and the share at which it passes a key or a point. */
export function keyedPath(keys){
 const curve=new THREE.CatmullRomCurve3(keys.map(([x,z])=>new THREE.Vector3(x,0,z)),false,'centripetal');
 const v=new THREE.Vector3(),t=new THREE.Vector3();
 const shareNear=(x,z)=>{let best=0,bestD=Infinity;for(let i=0;i<=1200;i++){curve.getPointAt(i/1200,v);const d=Math.hypot(v.x-x,v.z-z);if(d<bestD){bestD=d;best=i/1200;}}return best;};
 const at=keys.map(([x,z])=>shareNear(x,z));at[0]=0;at[at.length-1]=1;
 const tangentYaw=u=>{curve.getTangentAt(Math.max(.0005,Math.min(.9995,u)),t);return Math.atan2(t.x,t.z);};
 const yawOf=(i,u)=>keys[i][2]===null?tangentYaw(u):keys[i][2]*Math.PI/180;
 function pose(u){
  u=Math.max(0,Math.min(1,u));curve.getPointAt(u,v);
  let j=at.findIndex(a=>a>u);if(j===-1)j=at.length-1;if(j===0)j=1;
  const i=j-1,f=Math.max(0,Math.min(1,(u-at[i])/((at[j]-at[i])||1))),s=f*f*(3-2*f);
  const a=yawOf(i,u),b=yawOf(j,u);
  return {x:v.x,z:v.z,yaw:a+wrap(b-a)*s};
 }
 return {curve,pose,at,shareNear};
}

/**
 * The timetable's arrival and departure (ferry.js): in from the open sea by the fairway, round the
 * corner at the harbour mouth, across the basin and alongside; and out the same way. Their legs
 * are FERRY_TIMES in ferry.js: in, two minutes at sea and three and a half in harbour; out, a minute
 * and a half astern, a minute and a half swinging, two minutes to the mouth and two at sea.
 */
export function townArrival(T){
 const track=roundedTrack([...TOWN_FAIRWAY,HARBOUR_MOUTH,TOWN_BERTHING.keys[0].slice(0,2)],[60,16]),inside=track.turns.at(-1).from;
 const keys=[...track.slice(0,-1),...TOWN_BERTHING.keys],first=track.length-1;
 // In through the mouth, the pivot in the western basin (TOWN_BERTHING's first four keys), and across to the berth.
 return passage(keys,[{to:inside,minutes:T.sea,kind:'sea'},{to:first,minutes:T.harbour*.25,kind:'approach',signal:'prolonged'},
  {to:first+3,minutes:T.harbour*.35,kind:'swing',ease:2},{to:keys.length-1,minutes:T.harbour*.4,kind:'berthing',ease:4}],{from:true});
}
export function townDeparture(T){
 const U=TOWN_UNBERTHING,last=U.keys.at(-1);
 const track=roundedTrack([last.slice(0,2),HARBOUR_MOUTH,...[...TOWN_FAIRWAY].reverse()],[16,60]);
 const keys=[...U.keys,...track.slice(1)],clear=U.keys.length-1+track.turns[0].to;
 return passage(keys,[{to:U.astern,minutes:T.reverse,kind:'astern',signal:['prolonged','astern']},{to:U.keys.length-1,minutes:T.turn,kind:'swing'},
  {to:clear,minutes:T.leaveHarbour,kind:'manoeuvring'},{to:keys.length-1,minutes:T.leaveSea,kind:'sea',signal:'prolonged'}],{to:true});
}
