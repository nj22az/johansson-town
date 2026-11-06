/**
 * Incremental walking routes over the caller's actual collision and ground tests.
 * `sample` must already include the walker's radius. Its optional cost is a per-metre
 * multiplier (minimum 1); a blocked or non-finite-height sample cannot be crossed.
 *
 * step(budget) returns the status string. The budget counts work checkpoints, including
 * individual sample calls, so it does not conceal hundreds of collision probes in one
 * node expansion. Samples are cached for this search; start a new search if the world
 * changes. Every join, grid edge and simplified segment is checked at <= 0.14 m with
 * <= 0.24 m between successive ground heights. Diagonal grid corners stay closed if
 * either adjoining cardinal cell is blocked.
 *
 * An obstructed goal may finish at a free grid point within 1 m, with reason
 * `goal-approach`. That path ends at the actual approach, never at the blocked goal.
 * A free but unreachable goal is not silently replaced by a nearby point.
 */
export function createWalkingRoute({start,goal,sample,cell=.5,maxVisited=40000,bounds,margin=14}={}){
 if(typeof sample!=='function')throw new TypeError('walking route requires a sample function');
 if(!Number.isFinite(cell)||cell<=0)throw new RangeError('walking route cell must be positive');
 const valid=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
 const startPoint=valid(start)?{x:start.x,z:start.z}:null;
 const goalPoint=valid(goal)?{x:goal.x,z:goal.z}:null;
 const pad=Number.isFinite(margin)?Math.max(0,margin):14;
 const area=bounds?{...bounds}:startPoint&&goalPoint?{
  minX:Math.min(startPoint.x,goalPoint.x)-pad,maxX:Math.max(startPoint.x,goalPoint.x)+pad,
  minZ:Math.min(startPoint.z,goalPoint.z)-pad,maxZ:Math.max(startPoint.z,goalPoint.z)+pad,
 }:null;
 const limit=Number.isFinite(maxVisited)?Math.max(1,Math.floor(maxVisited)):40000;
 const within=(x,z)=>x>=area.minX&&x<=area.maxX&&z>=area.minZ&&z<=area.maxZ;
 const pointKey=(x,z)=>`${x},${z}`;
 const samples=new Map(),nodes=new Map(),edges=new Map(),open=[],goalJoins=new Map();
 const probeSpacing=Math.min(.14,cell/2),epsilon=1e-9;
 let status='searching',path=[],reason=null,visited=0,serial=0;
 let goalBlocked=false;

 function release(){samples.clear();nodes.clear();edges.clear();goalJoins.clear();open.length=0;}
 function fail(why){status='unreachable';reason=why;release();}
 function* probe(x,z){
  const key=pointKey(x,z);
  if(samples.has(key)){yield;return samples.get(key);}
  if(!within(x,z)){yield;return {x,z,blocked:true,y:NaN,cost:1};}
  const value=sample(x,z),y=value?.y;
  const result={x,z,blocked:!!value?.blocked||!Number.isFinite(y),y,
   cost:Number.isFinite(value?.cost)?Math.max(1,value.cost):1};
  samples.set(key,result);
  yield;
  return result;
 }
 function* nodeAt(i,j){
  const key=pointKey(i,j);
  if(nodes.has(key))return nodes.get(key);
  const p=yield* probe(i*cell,j*cell);
  const node={...p,key,i,j,g:Infinity,parent:null,closed:false};
  nodes.set(key,node);
  return node;
 }
 function* segment(a,b){
  const ak=pointKey(a.x,a.z),bk=pointKey(b.x,b.z),key=ak<bk?`${ak}|${bk}`:`${bk}|${ak}`;
  if(edges.has(key))return edges.get(key);
  const reject=()=>{const result={pass:false,cost:Infinity};edges.set(key,result);return result;};
  const distance=Math.hypot(b.x-a.x,b.z-a.z),count=Math.max(1,Math.ceil(distance/probeSpacing));
  let previous=yield* probe(a.x,a.z),cost=0;
  if(previous.blocked)return reject();
  for(let k=1;k<=count;k++){
   const t=k/count,next=yield* probe(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);
   if(next.blocked||Math.abs(next.y-previous.y)>.24+epsilon)return reject();
   if(next.x!==previous.x&&next.z!==previous.z){
    // The game resolves component moves separately. Checking only the diagonal
    // centre line let its X-then-Z step graze the onsen and Nishi trellis posts.
    // Keep both component orders clear, so a shorter frame cannot cut the corner.
    const acrossX=yield* probe(next.x,previous.z),acrossZ=yield* probe(previous.x,next.z);
    if(acrossX.blocked||acrossZ.blocked||
     Math.abs(acrossX.y-previous.y)>.24+epsilon||Math.abs(next.y-acrossX.y)>.24+epsilon||
     Math.abs(acrossZ.y-previous.y)>.24+epsilon||Math.abs(next.y-acrossZ.y)>.24+epsilon)return reject();
   }
   const i0=Math.round(previous.x/cell),j0=Math.round(previous.z/cell),i1=Math.round(next.x/cell),j1=Math.round(next.z/cell);
   if(i0!==i1&&j0!==j1){
    const sideX=yield* probe(i1*cell,j0*cell),sideZ=yield* probe(i0*cell,j1*cell);
    if(sideX.blocked||sideZ.blocked)return reject();
   }
   cost+=distance/count*(previous.cost+next.cost)/2;
   previous=next;
  }
  const result={pass:true,cost};edges.set(key,result);return result;
 }

 const heuristic=n=>{
  // Measure to the actual validated final joins. An approximate allowance for an
  // off-grid goal left a whole field of nodes cheaper than arrival, so long walks
  // flooded thousands of lawn cells before completing an otherwise obvious route.
  let best=Infinity;
  for(const {node,cost} of goalJoins.values()){
   const dx=Math.abs(n.x-node.x),dz=Math.abs(n.z-node.z);
   best=Math.min(best,Math.max(dx,dz)+(Math.SQRT2-1)*Math.min(dx,dz)+cost);
  }
  return best;
 };
 const before=(a,b)=>a.f<b.f-epsilon||Math.abs(a.f-b.f)<=epsilon&&(a.h<b.h||a.h===b.h&&a.order<b.order);
 function push(node){
  const h=node.endpoint?0:heuristic(node),entry={node,g:node.g,h,f:node.g+h,order:serial++};
  let i=open.length;open.push(entry);
  while(i){const p=(i-1)>>1;if(!before(entry,open[p]))break;open[i]=open[p];i=p;}open[i]=entry;
 }
 function pop(){
  const first=open[0],last=open.pop();
  if(open.length){
   let i=0;
   while(i*2+1<open.length){let child=i*2+1;if(child+1<open.length&&before(open[child+1],open[child]))child++;
    if(!before(open[child],last))break;open[i]=open[child];i=child;}
   open[i]=last;
  }
  return first;
 }
 function* finish(end,why){
  const raw=[];
  for(let n=end;n;n=n.parent){raw.push(n);yield;}
  raw.reverse();
  const result=[raw[0]];
  // String pulling may only shorten a route along fully checked segments. Keep a
  // deliberately cheaper surface route if a straight shortcut would cost more.
  for(let i=0;i<raw.length-1;){
   let next=i+1;
   for(let j=raw.length-1;j>i+1;j--){
    const edge=yield* segment(raw[i],raw[j]);
    if(edge.pass&&edge.cost<=(raw[j].g-raw[i].g)*1.01+epsilon){next=j;break;}
   }
   result.push(raw[next]);i=next;yield;
  }
  path=result.filter((p,i)=>!i||Math.hypot(p.x-result[i-1].x,p.z-result[i-1].z)>epsilon)
   .map(({x,z,y})=>({x,z,y}));
  status='found';reason=why;release();
 }
 function* search(){
  if(!startPoint||!goalPoint||!area||!['minX','maxX','minZ','maxZ'].every(k=>Number.isFinite(area[k]))||area.minX>area.maxX||area.minZ>area.maxZ){fail('invalid-input');return;}
  if(!within(startPoint.x,startPoint.z)||!within(goalPoint.x,goalPoint.z)){fail('outside-bounds');return;}
  const startSample=yield* probe(startPoint.x,startPoint.z);
  if(startSample.blocked){fail('start-blocked');return;}
  const goalSample=yield* probe(goalPoint.x,goalPoint.z);
  goalBlocked=goalSample.blocked;
  const source={...startSample,g:0,parent:null};
  const endpoint={...goalSample,g:Infinity,parent:null,endpoint:true,closed:false};
  const separation=Math.hypot(source.x-goalPoint.x,source.z-goalPoint.z);
  if(goalBlocked&&separation<=1+epsilon){yield* finish(source,'goal-approach');return;}
  if(!goalBlocked&&separation<=cell/2){
   const edge=yield* segment(source,endpoint);
   if(edge.pass){endpoint.g=edge.cost;endpoint.parent=source;yield* finish(endpoint,'goal-reached');return;}
  }
  const si=Math.round(source.x/cell),sj=Math.round(source.z/cell);
  const alignedStart=Math.hypot(si*cell-source.x,sj*cell-source.z)<epsilon;
  const alignedGoal=Math.hypot(Math.round(goalPoint.x/cell)*cell-goalPoint.x,Math.round(goalPoint.z/cell)*cell-goalPoint.z)<epsilon;
  const radius=goalBlocked?1:alignedGoal?epsilon:cell*1.5;
  for(let i=Math.ceil((goalPoint.x-radius)/cell);i<=Math.floor((goalPoint.x+radius)/cell);i++){
   for(let j=Math.ceil((goalPoint.z-radius)/cell);j<=Math.floor((goalPoint.z+radius)/cell);j++){
    if(!within(i*cell,j*cell)||Math.hypot(i*cell-goalPoint.x,j*cell-goalPoint.z)>radius+epsilon)continue;
    const n=yield* nodeAt(i,j);if(n.blocked)continue;
    const edge=goalBlocked?{pass:true,cost:0}:yield* segment(n,endpoint);
    if(edge.pass)goalJoins.set(n.key,{node:n,cost:edge.cost});
   }
  }
  if(!goalJoins.size){fail(goalBlocked?'no-goal-approach':'no-route');return;}
  for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){
   if(alignedStart&&(di||dj))continue;
   const x=(si+di)*cell,z=(sj+dj)*cell;
   if(!within(x,z)||Math.hypot(x-source.x,z-source.z)>cell*1.5)continue;
   const n=yield* nodeAt(si+di,sj+dj);if(n.blocked)continue;
   const edge=yield* segment(source,n);if(!edge.pass)continue;
   n.g=edge.cost;n.parent=source;push(n);
  }
  const directions=[[1,0],[0,1],[-1,0],[0,-1],[1,1],[-1,1],[-1,-1],[1,-1]];
  while(open.length){
   const entry=pop(),n=entry.node;yield;
   if(n.closed||entry.g!==n.g)continue;
   if(visited>=limit){fail('search-limit');return;}
   n.closed=true;visited++;
   if(n.endpoint){yield* finish(n,'goal-reached');return;}
   const join=goalJoins.get(n.key);
   if(join){
    if(goalBlocked){yield* finish(n,'goal-approach');return;}
    if(n.g+join.cost<endpoint.g){endpoint.g=n.g+join.cost;endpoint.parent=n;push(endpoint);}
   }
   for(const [di,dj] of directions){
    const i=n.i+di,j=n.j+dj;
    if(!within(i*cell,j*cell))continue;
    const next=yield* nodeAt(i,j);if(next.blocked||next.closed)continue;
    const edge=yield* segment(n,next);if(!edge.pass)continue;
    const g=n.g+edge.cost;
    if(g+epsilon<next.g){next.g=g;next.parent=n;push(next);}
   }
  }
  fail(goalBlocked?'no-goal-approach':'no-route');
 }
 const work=search();
 return {
  step(budget=200){
   const count=Number.isFinite(budget)?Math.max(0,Math.floor(budget)):200;
   for(let i=0;i<count&&status==='searching';i++)if(work.next().done)break;
   return status;
  },
  get status(){return status;},get path(){return path;},get reason(){return reason;},get visited(){return visited;},
 };
}
