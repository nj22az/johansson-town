/**
 * Faster answers to the plan's two most-asked questions, the same answers as before: which route is under a point, and
 * whether a point is on the island's land. Every footstep, every builder that lays something on the ground and every
 * resident's walk asks them; scanning every route's every segment and every coastline edge each time was a fifth of the
 * town's build (docs/LOADING.md batch 4).
 */

/**
 * The first route, in the list's order, with a segment within its half width less `r` of (x,z), as a scan of every
 * segment gives, found through a grid of where each segment reaches (cells of `cell` metres). `from` skips the
 * list's first routes. Built on the first question, and again if the list grows or shrinks.
 */
export function routeFinder(routes,{cell=8,from=0}={}){
 let grid=null,count=-1;const key=(gx,gz)=>gx*65536+gz;
 const half=(route,i)=>(route.segmentWidths?.[i]??route.width)/2;
 function build(){
  grid=new Map();count=routes.length;
  for(let k=from;k<routes.length;k++){
   const P=routes[k].points;
   for(let i=1;i<P.length;i++){
    const a=P[i-1],b=P[i],w=half(routes[k],i-1);
    const x0=Math.floor((Math.min(a[0],b[0])-w)/cell),x1=Math.floor((Math.max(a[0],b[0])+w)/cell);
    const z0=Math.floor((Math.min(a[1],b[1])-w)/cell),z1=Math.floor((Math.max(a[1],b[1])+w)/cell);
    for(let gx=x0;gx<=x1;gx++)for(let gz=z0;gz<=z1;gz++){const c=key(gx,gz);let list=grid.get(c);if(!list)grid.set(c,list=[]);list.push(k,i);}
   }
  }
 }
 return (x,z,r=0)=>{
  if(count!==routes.length)build();
  const list=grid.get(key(Math.floor(x/cell),Math.floor(z/cell)));if(!list)return null;
  // Entries are in route order, then segment order: the first that is near enough is the scan's answer.
  for(let n=0;n<list.length;n+=2){
   const route=routes[list[n]],i=list[n+1],a=route.points[i-1],b=route.points[i];
   const dx=b[0]-a[0],dz=b[1]-a[1],q=dx*dx+dz*dz,t=q?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/q)):0;
   if(Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)<=half(route,i-1)-r)return route;
  }
  return null;
 };
}

/**
 * Inside a polygon ([[x,z],…], even-odd as a crossing test gives), through a grid: a cell no edge passes through is
 * wholly inside or outside, so it is answered by its middle once; only cells an edge crosses are tested point by point.
 */
export function polygonTest(polygon,{cell=4}={}){
 const xs=polygon.map(p=>p[0]),zs=polygon.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
 const nx=Math.ceil((maxX-minX)/cell)+1,nz=Math.ceil((maxZ-minZ)/cell)+1,state=new Int8Array(nx*nz); // 0 unknown, 1 in, 2 out, 3 edge
 const exact=(x,z)=>{let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const [ax,az]=polygon[i],[bx,bz]=polygon[j];if((az>z)!==(bz>z)&&x<(bx-ax)*(z-az)/(bz-az)+ax)inside=!inside;}return inside;};
 // Every cell an edge's box touches (with a margin for rounding) is an edge cell.
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [ax,az]=polygon[i],[bx,bz]=polygon[j];
  const x0=Math.floor((Math.min(ax,bx)-minX)/cell-.01),x1=Math.floor((Math.max(ax,bx)-minX)/cell+.01),z0=Math.floor((Math.min(az,bz)-minZ)/cell-.01),z1=Math.floor((Math.max(az,bz)-minZ)/cell+.01);
  for(let gx=Math.max(0,x0);gx<=Math.min(nx-1,x1);gx++)for(let gz=Math.max(0,z0);gz<=Math.min(nz-1,z1);gz++)state[gx*nz+gz]=3;
 }
 return (x,z)=>{
  if(x<minX||x>maxX||z<minZ||z>maxZ)return false;
  const gx=Math.floor((x-minX)/cell),gz=Math.floor((z-minZ)/cell),k=gx*nz+gz;let s=state[k];
  if(s===3)return exact(x,z);
  if(s===0){s=state[k]=exact(minX+(gx+.5)*cell,minZ+(gz+.5)*cell)?1:2;}
  return s===1;
 };
}

/**
 * The edges of a closed polygon that can be within `reach` of a point: every edge whose box, grown by `reach`, covers the
 * point's cell. An edge left out is farther than `reach`, so a nearest distance capped at `reach` is the same either way.
 * Returns (x,z) => the edges as a flat list [ax,az,bx,bz, …] (empty off the grid).
 */
export function edgesNear(polygon,reach,{cell=reach}={}){
 const grid=new Map(),key=(gx,gz)=>gx*65536+gz,none=[];
 // Each edge from a point to the next, as the scan it stands in for walks them (so its distances are the same to the bit).
 for(let i=0;i<polygon.length;i++){
  const [ax,az]=polygon[i],[bx,bz]=polygon[(i+1)%polygon.length];
  const x0=Math.floor((Math.min(ax,bx)-reach)/cell),x1=Math.floor((Math.max(ax,bx)+reach)/cell),z0=Math.floor((Math.min(az,bz)-reach)/cell),z1=Math.floor((Math.max(az,bz)+reach)/cell);
  for(let gx=x0;gx<=x1;gx++)for(let gz=z0;gz<=z1;gz++){const k=key(gx,gz);let list=grid.get(k);if(!list)grid.set(k,list=[]);list.push(ax,az,bx,bz);}
 }
 return (x,z)=>grid.get(key(Math.floor(x/cell),Math.floor(z/cell)))||none;
}
