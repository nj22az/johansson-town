import * as WALK from '../world/ferry-walk.js';

/** Ship-local walking over the same floors and solids as the player, including stacked decks. */
export const CREW_RADIUS=.18;
const EPS=1e-6,STEP=.15,HEIGHT=1.82;
const length=(a,b)=>Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const shipFloors=WALK.FERRY_FLOORS.filter(f=>f.part==='ship');
const shipSolids=WALK.FERRY_SOLIDS.filter(s=>s.part==='ship'&&s.walk);
const solidsByZ=new Map();
for(const s of shipSolids)for(let z=Math.floor(s.z[0]-1);z<=Math.ceil(s.z[1]+1);z++){
 if(!solidsByZ.has(z))solidsByZ.set(z,[]);solidsByZ.get(z).push(s);
}
export function crewBlocked(p,r=CREW_RADIUS){
 const [x,y,z]=p;
 return (solidsByZ.get(Math.floor(z))||[]).some(s=>s.y[0]<y+HEIGHT&&s.y[1]>y+.03&&x>s.x[0]-r&&x<s.x[1]+r&&z>s.z[0]-r&&z<s.z[1]+r);
}
/** Exact sweep of the standing envelope. Sampling alone can miss a thin diagonal
 * corner at a stair-head rail, then a shorter rendered step finds that corner. */
function crossesBox(a,b,min,max){
 let lo=0,hi=1;
 for(let i=0;i<3;i++){
  const d=b[i]-a[i];
  if(Math.abs(d)<1e-12){if(a[i]<=min[i]+1e-9||a[i]>=max[i]-1e-9)return false;continue;}
  let t0=(min[i]-a[i])/d,t1=(max[i]-a[i])/d;if(t0>t1)[t0,t1]=[t1,t0];
  lo=Math.max(lo,t0);hi=Math.min(hi,t1);if(hi-lo<=1e-9)return false;
 }
 return hi>0&&lo<1&&hi-lo>1e-9;
}
export function crewBlockedBetween(a,b,r=CREW_RADIUS,obstacles=[]){
 const solids=Math.abs(b[2]-a[2])<=1?(solidsByZ.get(Math.floor((a[2]+b[2])/2))||[]):shipSolids;
 if(solids.some(s=>crossesBox(a,b,[s.x[0]-r,s.y[0]-HEIGHT,s.z[0]-r],[s.x[1]+r,s.y[1]-.03,s.z[1]+r])))return true;
 return obstacles.some(c=>{
  if(c.disabled)return false;const y=c.y??c.minY??1.1;
  return crossesBox(a,b,[c.x-c.w/2-r,y-HEIGHT,c.z-c.d/2-r],[c.x+c.w/2+r,y+(c.height??2)-.03,c.z+c.d/2+r]);
 });
}
export function crewFloorsAt(x,z,r=CREW_RADIUS){
 const out=[];
 for(const f of shipFloors){
  if(x<f.x[0]-EPS||x>f.x[1]+EPS||z<f.z[0]-EPS||z>f.z[1]+EPS||f.inside&&!f.inside(x,z,r))continue;
  const y=Array.isArray(f.y)?f.y[0]+(f.y[1]-f.y[0])*(z-f.z[0])/(f.z[1]-f.z[0]):f.y;
  if(!crewBlocked([x,y,z],r)&&!out.some(o=>Math.abs(o.y-y)<.025))out.push({y,floor:f.id});
 }
 return out;
}
/** Test the complete edge, not just its endpoints: a deck above a room never becomes a stair. */
export function crewObstacleAt(p,obstacles=[],r=CREW_RADIUS){
 return obstacles.some(c=>{
  if(c.disabled)return false;
  const y=c.y??c.minY??1.1,height=c.height??2;
  return p[1]+HEIGHT>y&&p[1]+.03<y+height&&Math.abs(p[0]-c.x)<c.w/2+r&&Math.abs(p[2]-c.z)<c.d/2+r;
 });
}
export function crewWalkSegment(a,b,r=CREW_RADIUS,obstacles=[]){
 if(crewBlockedBetween(a,b,r,obstacles))return false;
 const horizontal=Math.hypot(b[0]-a[0],b[2]-a[2]);
 if(horizontal<.001&&Math.abs(b[1]-a[1])>.24)return false;
 const count=Math.max(1,Math.ceil(length(a,b)/.055));let last=a[1];
 for(let k=0;k<=count;k++){
  const p=mix(a,b,k/count),options=crewFloorsAt(p[0],p[2],r).sort((u,v)=>Math.abs(u.y-p[1])-Math.abs(v.y-p[1]));
  const on=options.find(o=>Math.abs(o.y-p[1])<=.16+EPS&&Math.abs(o.y-last)<=.24+EPS);
  if(!on||crewObstacleAt([p[0],on.y,p[2]],obstacles,r))return false;last=on.y;
 }
 return true;
}

class Heap{
 constructor(){this.a=[];}
 push(v){let i=this.a.length;this.a.push(v);while(i){const p=(i-1)>>1;if(this.a[p].f<=v.f)break;this.a[i]=this.a[p];i=p;}this.a[i]=v;}
 pop(){const first=this.a[0],v=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let k=i*2+1;if(k+1<this.a.length&&this.a[k+1].f<this.a[k].f)k++;if(this.a[k].f>=v.f)break;this.a[i]=this.a[k];i=k;}this.a[i]=v;}return first;}
}
let graph=null;
function makeGraph(){
 if(graph)return graph;
 const nodes=[],cells=new Map(),links=new Map();
 const add=(p,i,j)=>{const n={id:nodes.length,p,i,j};nodes.push(n);return n;};
 const cellKey=(i,j)=>i+','+j;
 const at=(i,j)=>{
  const key=cellKey(i,j);if(cells.has(key))return cells.get(key);
  const x=i*STEP,z=j*STEP;
  const row=crewFloorsAt(x,z).map(({y})=>add([x,y,z],i,j));cells.set(key,row);return row;
 };
 // Floor cells are generated on demand; stairs preserve their interpolated height.
 const neighbours=n=>{
  if(links.has(n.id))return links.get(n.id);
  const out=[];
  for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
   if(!di&&!dj)continue;
   for(const next of at(n.i+di,n.j+dj)){
    if(Math.abs(next.p[1]-n.p[1])>.55||!crewWalkSegment(n.p,next.p))continue;
    out.push({node:next,d:length(n.p,next.p)});
   }
  }
  links.set(n.id,out);return out;
 };
 const near=p=>{
  const out=[],i=Math.round(p[0]/STEP),j=Math.round(p[2]/STEP);
  for(let di=-2;di<=2;di++)for(let dj=-2;dj<=2;dj++)for(const n of at(i+di,j+dj)){
   if(length(n.p,p)<.65&&crewWalkSegment(p,n.p))out.push(n);
  }
  return out;
 };
 // Vertical ladders are explicit, visible model connectors. Their top run-out is kept
 // at roof height until the feet are over the forecastle, never diagonally through it.
 const climbs=(WALK.FERRY_CLIMBS||[]).map(c=>({id:c.id,path:[c.from,...(c.via||[]),c.to]}));
 const ports=[];
 for(const c of climbs){
  if(c.path.some(p=>crewBlocked(p)))continue;
  const a={p:c.path[0],near:near(c.path[0])},b={p:c.path.at(-1),near:near(c.path.at(-1))};
  ports.push({a,b,path:c.path,id:c.id},{a:b,b:a,path:[...c.path].reverse(),id:c.id});
 }
 graph={nodes,near,neighbours,ports};return graph;
}

/** A route of {pos,climb?}; failure is explicit and cannot acknowledge a task. */
export function crewRoute(start,goal,{obstacles=[],exclude=null}={}){
 const occupied=obstacles.filter(c=>c.id!==exclude),clear=p=>!crewObstacleAt(p,occupied);
 if(length(start,goal)<.015)return {ok:!crewBlocked(goal)&&clear(goal),path:[{pos:[...goal]}]};
 if(crewWalkSegment(start,goal,CREW_RADIUS,occupied))return {ok:true,path:[{pos:[...start]},{pos:[...goal]}]};
 const g=makeGraph(),begins=g.near(start).filter(n=>crewWalkSegment(start,n.p,CREW_RADIUS,occupied)),ends=g.near(goal).filter(n=>crewWalkSegment(goal,n.p,CREW_RADIUS,occupied)),endById=new Map(ends.map(n=>[n.id,n]));
 if(!begins.length||!ends.length)return {ok:false,reason:!begins.length?'No walking floor at the crew’s starting position':'The assigned station is outside the walkable deck'};
 const open=new Heap(),cost=new Map(),previous=new Map(),closed=new Set();
 const offer=(n,v,prev,via=null)=>{if(v>=(cost.get(n.id)??Infinity)-EPS)return;cost.set(n.id,v);previous.set(n.id,{prev,via});open.push({node:n,f:v+length(n.p,goal),g:v});};
 for(const n of begins)offer(n,length(start,n.p),null);
 let end=null,visits=0;
 while(open.a.length&&visits++<50000){
  const entry=open.pop(),n=entry.node;if(closed.has(n.id)||entry.g!==cost.get(n.id))continue;closed.add(n.id);
  if(endById.has(n.id)){end=n;break;}
  for(const e of g.neighbours(n))if(clear(e.node.p)&&(!occupied.length||crewWalkSegment(n.p,e.node.p,CREW_RADIUS,occupied)))offer(e.node,entry.g+e.d,n);
  for(const port of g.ports){
   if(!port.a.near.some(p=>p.id===n.id)||!crewWalkSegment(n.p,port.a.p,CREW_RADIUS,occupied))continue;
   const d=port.path.slice(1).reduce((sum,p,i)=>sum+length(port.path[i],p),0);
   for(const next of port.b.near)if(crewWalkSegment(port.b.p,next.p,CREW_RADIUS,occupied))offer(next,entry.g+length(n.p,port.a.p)+d+length(port.b.p,next.p),n,port);
  }
 }
 if(!end)return {ok:false,reason:'No continuous walking route to the assigned station'};
 const chunks=[];
 for(let n=end;n;){const p=previous.get(n.id);chunks.push({n,via:p?.via});n=p?.prev;}
 chunks.reverse();const path=[{pos:[...start]}];
 for(const c of chunks){
  if(c.via)for(let k=0;k<c.via.path.length;k++)path.push({pos:[...c.via.path[k]],...(k?{climb:c.via.id}:{})});
  path.push({pos:[...c.n.p]});
 }
 path.push({pos:[...goal]});
 // Keep the validated grid shape. Small paths avoid cutting corners across rooms,
 // and a single cached graph serves every crew member and subsequent call.
 return {ok:true,path:path.filter((p,i)=>!i||length(p.pos,path[i-1].pos)>.001)};
}

export function stepCrewRoute(body,dt,{speed=1.18,climbSpeed=.55,obstacles=[]}={}){
 let budget=Math.min(Math.max(dt,0),.5),moved=false,climbing=false;
 while(budget>EPS&&body.routeIndex<body.route.length){
  const node=body.route[body.routeIndex],target=node.pos,a=body.g.position.toArray(),d=length(a,target),rate=node.climb?climbSpeed:speed;
  if(d<EPS){body.g.position.set(...target);body.routeIndex++;continue;}
  const step=Math.min(d,budget*rate),p=mix(a,target,step/d);
  if(node.climb?crewBlocked(p)||crewObstacleAt(p,obstacles):!crewWalkSegment(a,p,CREW_RADIUS,obstacles)){
   body.blocked='The walking route is obstructed';return {arrived:false,moved,climbing:false};
  }
  if(node.climb){
   const c=WALK.FERRY_CLIMBS.find(c=>c.id===node.climb);
   if(c)body.g.rotation.y=Math.atan2(c.to[0]-c.from[0],c.to[2]-c.from[2])+Math.PI;
  }else if(Math.hypot(target[0]-a[0],target[2]-a[2])>.001)body.g.rotation.y=Math.atan2(target[0]-a[0],target[2]-a[2])+Math.PI;
  body.g.position.set(...p);moved=true;climbing=!!node.climb;budget-=step/rate;
  if(step>=d-EPS)body.routeIndex++;
 }
 body.g.userData.climbing=climbing;
 return {arrived:body.routeIndex>=body.route.length,moved,climbing};
}
