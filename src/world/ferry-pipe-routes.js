/** Orthogonal concept routes. Only geometrically clear centre-lines are rendered; rejected or unavailable routes are retained as issues. This is not an installation or pressure-design approval. */
export const PIPE_LANES=Object.freeze({
 fuel:Object.freeze({k:0,dy:-.1}),seawater:Object.freeze({k:1,dy:-.1}),freshwater:Object.freeze({k:2,dy:-.1}),fire:Object.freeze({k:3,dy:-.1}),
 air:Object.freeze({k:4,dy:-.14}),sewage:Object.freeze({k:5,dy:-.14}),
 bilge:Object.freeze({low:true,k:0}),lube:Object.freeze({low:true,k:1}),
 jacket:Object.freeze({local:true}),exhaust:Object.freeze({skip:true}),hydraulics:Object.freeze({skip:true}),
});
const DIRS={up:[0,1,0],down:[0,-1,0],port:[1,0,0],stbd:[-1,0,0],fwd:[0,0,1],aft:[0,0,-1]};
const add=(p,d,s=.25)=>p.map((v,k)=>v+d[k]*s);
const leave=a=>add(a.pos,DIRS[a.dir],a.off??.25);
const key=p=>p.map(n=>n.toFixed(6)).join(',');
/** Visual outside-radius allowance in metres, not a pipe-standard wall or insulation schedule. */
export const pipeRadius=dn=>Math.max(.012,dn*.0006+.004);
const clean=pts=>pts.filter((p,i)=>!i||key(p)!==key(pts[i-1]));
const bounds=b=>({lo:b.a.map((v,k)=>Math.min(v,b.b[k])),hi:b.a.map((v,k)=>Math.max(v,b.b[k]))});
const contains=(p,b,r)=>p.every((v,k)=>v>=b.lo[k]-r&&v<=b.hi[k]+r);
/** Exact conservative swept-cylinder/AABB test, using the outside-radius-expanded equipment box. */
export function pipeSegmentIntersectsBox(a,b,box,radius=0){
 const q=box.lo?box:bounds(box);
 return a.every((v,k)=>Math.max(v,b[k])>q.lo[k]-radius+1e-9&&Math.min(v,b[k])<q.hi[k]+radius-1e-9);
}
function contactNearTerminal(p,q,u,v,t,reach,r){
 const lo=[],hi=[];for(let k=0;k<3;k++){lo[k]=Math.max(Math.min(p[k],q[k])-r,Math.min(u[k],v[k])-r);hi[k]=Math.min(Math.max(p[k],q[k])+r,Math.max(u[k],v[k])+r);if(lo[k]>hi[k])return false;}
 return Math.hypot(...lo.map((n,k)=>Math.max(Math.abs(n-t.pos[k]),Math.abs(hi[k]-t.pos[k]))))<=reach;
}
function segmentDistance(a,b,c,d){
 let sq=0;for(let k=0;k<3;k++){const gap=Math.max(Math.min(a[k],b[k])-Math.max(c[k],d[k]),Math.min(c[k],d[k])-Math.max(a[k],b[k]),0);sq+=gap*gap;}return Math.sqrt(sq);
}
/** Validate the conceptual equipment envelope. A first/last stub may enter a box containing its recorded terminal; physical nozzle ownership is not established by this check. */
export function validatePipeRoute(points,G,dn,{a,b,existing=[]}={}){
 if(!Number.isFinite(dn)||dn<=0||points.length<2||points.some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v))))return {ok:false,reason:'invalid pipe geometry'};
 const r=pipeRadius(dn),obstacles=(G.obstacles||[]).map(o=>({...o,...bounds(o)}));
 for(let i=1;i<points.length;i++){
  const p=points[i-1],q=points[i];if([0,1,2].filter(k=>Math.abs(p[k]-q[k])>1e-7).length!==1)return {ok:false,reason:'non-orthogonal segment',segment:i};
  // Bounds include outside radius; the first/last stub may enter a tagged deck penetration only.
  const terminals=[...(i===1&&a?[a]:[]),...(i===points.length-1&&b?[b]:[])],terminal=terminals.find(t=>t.penetration)||terminals[0]||null;
  if((Math.min(p[1],q[1])<G.y0-.24+r-1e-7||Math.max(p[1],q[1])>G.y1-r+1e-7||Math.max(Math.abs(p[0]),Math.abs(q[0]))>G.W-r+1e-7||(Number.isFinite(G.z0)&&Math.min(p[2],q[2])<G.z0+r-1e-7)||(Number.isFinite(G.z1)&&Math.max(p[2],q[2])>G.z1-r+1e-7))&&!terminal?.penetration)return {ok:false,reason:'outside machinery-space envelope',segment:i};
  for(const o of obstacles){if(!pipeSegmentIntersectsBox(p,q,o,r))continue;
   if(terminals.some(t=>contains(t.pos,o,r)))continue;
   return {ok:false,reason:'equipment clearance',obstacle:o.name||'equipment',segment:i};}
  if(G.clear){const n=Math.max(1,Math.ceil(Math.hypot(...q.map((v,k)=>v-p[k]))/.02));
   for(let j=0;j<=n;j++){const at=p.map((v,k)=>v+(q[k]-v)*j/n);if(!G.clear(at,r,{terminal,segment:i}))return {ok:false,reason:'clearance callback',segment:i};}}
  for(const other of existing){const rr=r+pipeRadius(other.dn)+.01;
   for(let j=1;j<other.points.length;j++){
    const u=other.points[j-1],v=other.points[j];if(segmentDistance(p,q,u,v)>=rr-1e-7)continue;
    // Branches at the same diagram node may share their short terminal fitting. A shared long main requires explicit spool/junction data.
    const sameTerm=[a,b].filter(Boolean).find(t=>other.terminals?.some(ot=>ot.id===t.id&&key(ot.pos)===key(t.pos)));
    if(sameTerm&&contactNearTerminal(p,q,u,v,sameTerm,.36,rr))continue;
    return {ok:false,reason:'pipe clearance',other:other.lineId,segment:i};}}
 }
 return {ok:true};
}
/** Returns accepted paths, with immutable `.issues` for every unsupported, missing or obstructed line. */
export function routePipes(systems,anchors,G){
 const routes=[],issues=[];let serial=0;
 const sideOf=p=>p[0]>=0?1:-1;
 for(const s of systems){const lane=PIPE_LANES[s.id];
  for(const li of s.lines){if(!(li.dn>0))continue;const lineId=s.id+'/'+li.from+'>'+li.to+'#'+serial++;
   const a0=anchors[s.id+'/'+li.from],b0=anchors[s.id+'/'+li.to];
   const issue=(reason,extra={})=>issues.push(Object.freeze({lineId,system:s.id,from:li.from,to:li.to,dn:li.dn,status:'unresolved',reason,...extra}));
   if(!lane||lane.skip){issue('system has no coordinated 3D route');continue;}
   if(!a0||!b0){issue('missing physical terminal',{missing:Object.freeze([!a0&&li.from,!b0&&li.to].filter(Boolean))});continue;}
   if(!Number.isFinite(li.dn)||[a0.pos,b0.pos].some(p=>!Array.isArray(p)||p.length!==3||p.some(v=>!Number.isFinite(v)))){issue('invalid pipe geometry');continue;}
   if(!DIRS[a0.dir]||!DIRS[b0.dir]){issue('invalid terminal direction');continue;}
   const a={...a0,id:s.id+'/'+li.from},b={...b0,id:s.id+'/'+li.to},pa=leave(a),pb=leave(b),sa=sideOf(pa),sb=sideOf(pb),r=pipeRadius(li.dn),candidates=[];
   const near=Math.abs(pa[0]-pb[0])<.3&&Math.abs(pa[2]-pb[2])<.3;
   if(near)candidates.push([a.pos,pa,[pa[0],pb[1],pa[2]],[pb[0],pb[1],pa[2]],pb,b.pos]);
   if(lane.local||a.local&&b.local&&sa===sb||near){
    const ys=[Math.min(G.y1-r-.01,Math.max(pa[1],pb[1])+.06),G.y1-r-.02,G.y0-.16];
    for(const y of ys)candidates.push([a.pos,pa,[pa[0],y,pa[2]],[pb[0],y,pa[2]],[pb[0],y,pb[2]],pb,b.pos],[a.pos,pa,[pa[0],y,pa[2]],[pa[0],y,pb[2]],[pb[0],y,pb[2]],pb,b.pos]);
   }
   // Try bounded alternative lanes, at the same deck/floor and always within the compartment's envelope.
   const low=lane.low||(pa[1]<G.y0+.7&&pb[1]<G.y0+.7),k=lane.k??0;
   const yBase=low?G.y0-.11-(k%3)*.03:G.y1+(lane.dy??-.1),xBase=G.W-.14-k*.12;
   const xs=[xBase,...[.24,.42,.64,.88,1.12,1.45,1.8].map(v=>G.W-v)];
   const ys=low?[yBase,G.y0-.13,G.y0-.19]:[yBase,G.y1-r-.015,G.y1-.24,G.y1-.37];
   const crossings=[...(G.crossings||[])].sort((u,v)=>Math.abs(u-(pa[2]+pb[2])/2)-Math.abs(v-(pa[2]+pb[2])/2));
   for(const y of ys)for(const x of xs)for(const zc of sa===sb?[null]:crossings){
    const xa=sa*x,xb=sb*x,pts=[a.pos,pa,[pa[0],y,pa[2]],[xa,y,pa[2]]];
    if(zc!==null)pts.push([xa,y,zc-k*.11],[xb,y,zc-k*.11]);
    pts.push([xb,y,pb[2]],[pb[0],y,pb[2]],pb,b.pos);candidates.push(pts);
   }
   let accepted=null,last=null;
   for(const candidate of candidates){const pts=clean(candidate);last=validatePipeRoute(pts,G,li.dn,{a,b,existing:routes});if(last.ok){accepted=pts;break;}}
   if(!accepted){issue(last?.reason||'no routing candidate',{attempts:candidates.length,obstacle:last?.obstacle||null,other:last?.other||null});continue;}
   routes.push(Object.freeze({lineId,system:s.id,from:li.from,to:li.to,dn:li.dn,colour:s.colour,status:'geometry-clear',terminals:Object.freeze([Object.freeze({id:a.id,pos:a.pos}),Object.freeze({id:b.id,pos:b.pos})]),points:Object.freeze(accepted.map(p=>Object.freeze(p)))}));
  }
 }
 Object.defineProperty(routes,'issues',{value:Object.freeze(issues),enumerable:false});return Object.freeze(routes);
}
/** Keep source-line identity: coincident independent loops are never silently combined into one fabricated main. */
export function pipeSegments(routes){
 const out=[];for(const r of routes)for(let i=1;i<r.points.length;i++){const a=r.points[i-1],b=r.points[i];if(key(a)===key(b))continue;out.push({lineId:r.lineId,system:r.system,from:r.from,to:r.to,dn:r.dn,colour:r.colour,a,b});}return out;
}
export function pipeBends(routes){
 const out=[];for(const r of routes)for(let i=1;i<r.points.length-1;i++)out.push({lineId:r.lineId,system:r.system,dn:r.dn,colour:r.colour,p:r.points[i]});return out;
}

/** Legacy illustrative network for the game view only. Its paths are not clearance accepted and must not enter CAD release/export. */
export function routePipePreview(systems,anchors,G){
 const out=[],sideOf=p=>p[0]>=0?1:-1;
 for(const s of systems){const lane=PIPE_LANES[s.id];if(!lane||lane.skip)continue;
  for(const li of s.lines){if(!(li.dn>0))continue;const a=anchors[s.id+'/'+li.from],b=anchors[s.id+'/'+li.to];if(!a||!b)continue;
   const pa=leave(a),pb=leave(b),sa=sideOf(pa),sb=sideOf(pb),near=Math.abs(pa[0]-pb[0])<.3&&Math.abs(pa[2]-pb[2])<.3;let points;
   if(near)points=[a.pos,pa,[pa[0],pb[1],pa[2]],[pb[0],pb[1],pa[2]],pb,b.pos];
   else if(lane.local||a.local&&b.local&&sa===sb){const y=Math.min(G.y1-.08,Math.max(pa[1],pb[1])+.06),orders=[[a.pos,pa,[pa[0],y,pa[2]],[pb[0],y,pa[2]],[pb[0],y,pb[2]],pb,b.pos],[a.pos,pa,[pa[0],y,pa[2]],[pa[0],y,pb[2]],[pb[0],y,pb[2]],pb,b.pos]];
    // Preserve the old visual preference only; this centreline heuristic confers no engineering acceptance.
    const preference=o=>{if(!G.previewClear)return true;for(let i=2;i<o.length-2;i++){const p=o[i-1],q=o[i],n=Math.max(1,Math.ceil(Math.hypot(...q.map((v,k)=>v-p[k]))/.05));for(let j=0;j<=n;j++)if(!G.previewClear(p.map((v,k)=>v+(q[k]-v)*j/n)))return false;}return true;};
    points=orders.find(preference)||orders[0];}
   else{const low=lane.low||pa[1]<G.y0+.7&&pb[1]<G.y0+.7,k=lane.k??0,y=low?G.y0-.11-(k%3)*.03:G.y1+lane.dy,xa=sa*(low?G.W-.3-k*.12:G.W-.14-k*.12),xb=sb*(low?G.W-.3-k*.12:G.W-.14-k*.12);
    points=[a.pos,pa,[pa[0],y,pa[2]],[xa,y,pa[2]]];
    if(sa!==sb){const comp=z=>G.crossings.findIndex(c=>z<c+.22),ca=comp(pa[2]),cb=comp(pb[2]),mid=(pa[2]+pb[2])/2,zc=(ca===cb&&ca>=0?G.crossings[ca]:G.crossings.reduce((best,z)=>Math.abs(z-mid)<Math.abs(best-mid)?z:best))-k*.11;points.push([xa,y,zc],[xb,y,zc]);}
    points.push([xb,y,pb[2]],[pb[0],y,pb[2]],pb,b.pos);}
   out.push(Object.freeze({lineId:'preview/'+s.id+'/'+li.from+'>'+li.to,system:s.id,from:li.from,to:li.to,dn:li.dn,colour:s.colour,status:'visual-preview-unverified',points:Object.freeze(clean(points).map(p=>Object.freeze(p)))}));
  }
 }
 return Object.freeze(out);
}
/** Visual-only union of collinear runs, for legacy game rendering. Source spool and topology acceptance are intentionally absent. */
export function pipePreviewSegments(routes){
 const lines=new Map();for(const sg of pipeSegments(routes)){const ax=[0,1,2].find(k=>Math.abs(sg.a[k]-sg.b[k])>1e-6);if(ax===undefined)continue;
  const fixed=[0,1,2].filter(k=>k!==ax),lk=sg.system+'|'+ax+'|'+fixed.map(k=>Math.round(sg.a[k]*100)).join(',');
  if(!lines.has(lk))lines.set(lk,{...sg,ax,fixed,spans:[]});lines.get(lk).spans.push({lo:Math.min(sg.a[ax],sg.b[ax]),hi:Math.max(sg.a[ax],sg.b[ax]),dn:sg.dn});}
 const out=[];for(const l of lines.values()){l.spans.sort((a,b)=>a.lo-b.lo);let cur=null;const emit=()=>{if(cur){const a=[...l.a],b=[...l.b];a[l.ax]=cur.lo;b[l.ax]=cur.hi;out.push({system:l.system,colour:l.colour,dn:cur.dn,status:'visual-preview-unverified',a,b});}};
  for(const sp of l.spans){if(cur&&sp.lo<=cur.hi+1e-6){cur.hi=Math.max(cur.hi,sp.hi);cur.dn=Math.max(cur.dn,sp.dn);}else{emit();cur={...sp};}}emit();}
 return out;
}

/** Preview bends are merged geometrically to retain the existing game mesh budget; this confers no spool identity. */
export function pipePreviewBends(routes){
 const seen=new Set();return pipeBends(routes).filter(b=>{const k=b.system+'|'+b.p.map(n=>Math.round(n*100)).join(',');if(seen.has(k))return false;seen.add(k);b.status='visual-preview-unverified';return true;});
}
