// Snap into place: the pure rules behind Johansson Studio's Build scene magnets (no DOM, no Three.js), so Node tests can check
// them and the room, building and island builders can reuse them later. They are World's, beside the 3D places they measure
// (scene-world.js); Studio re-exports them (avatar-creator/scene-snap.mjs). Distances are metres on the ground (x, z), screen distances are
// CSS pixels, angles are degrees in the Studio's turn convention (0 faces +z, a larger turn turns to the left, seen from
// above: scene-controls.mjs).

/** An angle in (-180, 180]. (Studio's scene-controls.mjs re-exports it.) */
export function wrapTurn(degrees){const d=((Number(degrees)%360)+540)%360-180;return d===-180?180:Math.round(d*10)/10;}

const freeze=o=>{for(const v of Object.values(o))if(v&&typeof v==='object')freeze(v);return Object.freeze(o);};
export const SNAP=freeze({
 capturePx:{touch:44,mouse:24},                 // CSS px; a pen counts as a mouse
 metres:{seat:[.20,.45],person:[.15,.35],edge:[.12,.30],grid:[.12,.30]},   // clamp of the capture radius on the ground
 rank:{seat:0,person:1,edge:2,grid:3},rankWeight:.1,release:1.5,switchRatio:.75,
 body:.23,feet:.12,talk:.95,beside:.70,         // × size (body radius; feet: where the floor must be level) or × the two characters' mean size
 edgeTop:[.73,1.15],                             // a counter's top above the floor (Minato's .78 counter stands on a .04 slab; tables .72)
 edgeMinLength:.6,edgeGap:.03,edgeStep:.05,edgeSample:.25,
 search:{step:.05,max:.6,directions:16},level:.06,bounds:12,reach:12,quantum:.01,   // bounds: what a saved scene keeps (origin ±12 m, the walk surface)
 seenHead:1.45,seenSeat:.75,                     // × size above the floor / above the seat's top
 turn:{step:15,tap:45,catch:8,release:12,hysteresis:3,detentReach:2.5},history:20,
});

const round=(v,q=SNAP.quantum)=>Math.round(v/q)*q;
const fixed=v=>Math.round(v*1e6)/1e6;
const atKey=(x,z)=>'@'+(+x).toFixed(2)+','+(+z).toFixed(2);

/**
 * A seat's stable key: World's own seat id when no other seat has it, else its place ('@x,z', 1 cm). Never its position in
 * the scene graph, which changes whenever World adds a seat anywhere. Two seats at one spot get '#2', '#3' in list order.
 */
export function seatKey(seat,seats){
 const id=seat.id;
 if(typeof id==='string'&&id&&seats.filter(s=>s.id===id).length===1)return id;
 const key=atKey(seat.position[0],seat.position[2]);
 const twins=seats.filter(s=>!(typeof s.id==='string'&&s.id&&seats.filter(t=>t.id===s.id).length===1)&&atKey(s.position[0],s.position[2])===key);
 const n=twins.indexOf(seat);return n>0?key+'#'+(n+1):key;
}

/** The seat a saved scene means: its key, else an old 'seat-N' (its legacyId), else the nearest seat within 0.3 m of '@x,z'. */
export function matchSeat(saved,seats){
 if(!saved||typeof saved!=='string')return null;
 const exact=seats.find(s=>s.id===saved);if(exact)return exact;
 const legacy=seats.find(s=>s.legacyId===saved);if(legacy)return legacy;
 const m=/^@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(saved);if(!m)return null;
 const x=Number(m[1]),z=Number(m[2]);let best=null,distance=.3;
 for(const s of seats){const d=Math.hypot(s.position[0]-x,s.position[2]-z);if(d<=distance){distance=d;best=s;}}
 return best;
}

/** Labels for a menu: a label that repeats gets ' 1' … ' n', left to right on the screen (`screenX(seat)`). */
export function numberLabels(seats,screenX){
 const out=seats.map(s=>s.label),groups=new Map();
 seats.forEach((s,i)=>{if(!groups.has(s.label))groups.set(s.label,[]);groups.get(s.label).push(i);});
 for(const [label,list] of groups){if(list.length<2)continue;
  const x=i=>{const v=Number(screenX(seats[i]));return Number.isFinite(v)?v:Infinity;};
  list.map(i=>[i,x(i)]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]).forEach(([i],k)=>{out[i]=label+' '+(k+1);});}
 return out;
}

/** The turn of someone sitting on a World seat (World's seat yaw is a camera yaw: forward is (−sin, −cos)). */
export function seatTurn(seat){return wrapTurn(180+(seat.yaw||0)*180/Math.PI);}

/**
 * The faces of counters near `origin`: box colliders whose top stands edgeTop above the floor in front of the face (where
 * someone stands: under the box itself a plinth or a raised step can lift the walk surface, as under Sakura's till), that
 * start on that floor and whose face is at least edgeMinLength long. Rotation (yaw, three.js rotation.y) follows World's
 * footprint(). Furniture someone sits on is not a counter: not a box holding one of `seats` ([x,z,turn] each), nor a
 * face with one in front of it, within 0.6 m, that has its back to it (a booth's tall back).
 * Each face: {id, a:[x,z], b:[x,z], n:[nx,nz] (outward), turn (facing the face), top, floor}.
 */
export function counterEdges(solids,floor,{reach=SNAP.reach,origin=[0,0,0],seats=[]}={}){
 const out=[],faces=new Set(),[low,high]=SNAP.edgeTop,ox=origin[0],oz=origin.length>2?origin[2]:origin[1];
 solids.forEach((c,i)=>{
  if(c.r!=null||!(c.w>0)||!(c.d>0)||!Number.isFinite(c.height)||!Number.isFinite(c.x)||!Number.isFinite(c.z))return;
  if(Math.hypot(c.x-ox,c.z-oz)>reach)return;
  const co=Math.cos(c.yaw||0),si=Math.sin(c.yaw||0),hw=c.w/2,hd=c.d/2;
  const local=seats.map(([x,z,turn])=>{const dx=x-c.x,dz=z-c.z,t=turn*Math.PI/180,fx=Math.sin(t),fz=Math.cos(t);return {u:co*dx-si*dz,v:si*dx+co*dz,fu:co*fx-si*fz,fv:si*fx+co*fz,turned:Number.isFinite(turn)};});
  if(local.some(p=>Math.abs(p.u)<=hw+.05&&Math.abs(p.v)<=hd+.05))return;
  const backTo=(nu,nv)=>local.some(p=>{if(!p.turned)return false;const out=nu?nu*p.u-hw:nv*p.v-hd,along=nu?Math.abs(p.v)<=hd:Math.abs(p.u)<=hw;return along&&out>0&&out<=.6&&(nu*p.fu+nv*p.fv)>.3;});
  const at=(u,v)=>[fixed(c.x+u*co+v*si),fixed(c.z-u*si+v*co)],dir=(u,v)=>[fixed(u*co+v*si),fixed(-u*si+v*co)];
  for(const [face,nu,nv,length] of [['+u',1,0,c.d],['-u',-1,0,c.d],['+v',0,1,c.w],['-v',0,-1,c.w]]){
   if(length<SNAP.edgeMinLength||backTo(nu,nv))continue;
   const [a,b]=nu?[at(nu*hw,-hd),at(nu*hw,hd)]:[at(-hw,nv*hd),at(hw,nv*hd)],n=dir(nu,nv),out1=SNAP.body+SNAP.edgeGap;
   const f=floor((a[0]+b[0])/2+n[0]*out1,(a[1]+b[1])/2+n[1]*out1);
   if(!Number.isFinite(f)||c.height-f<low||c.height-f>high||(c.minY!=null&&c.minY>f+.12))continue;
   const same=[...a,...b,...n].map(v=>v.toFixed(2)).join();if(faces.has(same))continue;faces.add(same);   // one counter registered twice
   out.push({id:'edge:'+(c.id?c.id+'.':'')+i+':'+face,a,b,n,turn:wrapTurn(Math.atan2(-n[0],-n[1])*180/Math.PI),top:c.height,floor:f});
  }
 });
 return out;
}

/** Where someone of `size` stands at a counter face: body·size + edgeGap out from it, body·size in from both ends. */
export function edgeLine(edge,size=1){
 const off=SNAP.body*size+SNAP.edgeGap,inset=SNAP.body*size,[ax,az]=edge.a,[bx,bz]=edge.b,length=Math.hypot(bx-ax,bz-az);
 if(!(length>0))return null;
 const tx=(bx-ax)/length,tz=(bz-az)/length,ox=edge.n[0]*off,oz=edge.n[1]*off;
 if(length<=2*inset){const x=(ax+bx)/2+ox,z=(az+bz)/2+oz;return {a:[x,z],b:[x,z],length:0};}
 return {a:[ax+tx*inset+ox,az+tz*inset+oz],b:[bx-tx*inset+ox,bz-tz*inset+oz],length:length-2*inset};
}

/** The distance on the ground from {x,z} to a line {a,b}. */
export function lineDistance(p,line){
 const [ax,az]=line.a,[bx,bz]=line.b,dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz;
 const t=l2?Math.max(0,Math.min(1,((p.x-ax)*dx+(p.z-az)*dz)/l2)):0;
 return Math.hypot(p.x-(ax+dx*t),p.z-(az+dz*t));
}

/**
 * The places beside a standing character `other` ({x,z,turn,size}) for someone of `size`: in front, talking to them, and at
 * their left and right, facing the same way. None for someone seated (other.seat or other.seated).
 */
export function personMarks(other,size=1){
 if(other.seat||other.seated)return [];
 const mean=((other.size||1)+(size||1))/2,t=(other.turn||0)*Math.PI/180,s=Math.sin(t),c=Math.cos(t),talk=SNAP.talk*mean,side=SNAP.beside*mean,turn=wrapTurn(other.turn||0);
 return [
  {mark:'talk',x:other.x+talk*s,z:other.z+talk*c,turn:wrapTurn(turn+180)},
  {mark:'left',x:other.x+side*c,z:other.z-side*s,turn},
  {mark:'right',x:other.x-side*c,z:other.z+side*s,turn},
 ];
}

/**
 * The nearest free place to `want`: rings every 5 cm out to 60 cm, 16 directions each; the first ring with a free point
 * wins (on it, the point nearest `prefer`, e.g. the last landing, so a drag along a wall slides smoothly). Points are
 * rounded to 1 cm. → {x,z} or null.
 */
export function nearestFree(want,free,opt=SNAP.search,prefer=null){
 const {step=.05,max=.6,directions=16}=opt||{};
 for(let i=1;i*step<=max+1e-9;i++){
  const r=i*step,ring=[];
  for(let k=0;k<directions;k++){const a=k*2*Math.PI/directions,x=fixed(round(want.x+r*Math.sin(a))),z=fixed(round(want.z+r*Math.cos(a)));if(free(x,z))ring.push({x,z});}
  if(prefer)ring.sort((p,q)=>Math.hypot(p.x-prefer.x,p.z-prefer.z)-Math.hypot(q.x-prefer.x,q.z-prefer.z));
  if(ring.length)return ring[0];
 }
 return null;
}

/**
 * Where a dragged character lands. `want` {x,y,z}: the feet under the finger. ctx:
 *  targets: point targets {id,kind,rank,point:[x,y,z],turn,seat?,ok?} and line targets {id,kind:'edge',rank,line:{a,b},turn,ok?(x,z)};
 *  project(point, clip=true): CSS px {x,y} on the picture, or null behind the camera or (clip) off it, 8 px in;
 *  free(x,z): no wall, furniture, person, edge or step (bound to this character); seen(x,z): the camera sees them there;
 *  lock: the target caught last; capturePx; snapping; grid ({size,origin,yaw}, builders only); floor(x,z); previous landing.
 * A target catches within R = capturePx clamped to its kind's metres; the one caught keeps them until 1.5 R and wins ties
 * (score × 0.75); a seat beats a person, a person a counter, by 0.1 R. Without a target: the point itself (to the nearest free
 * centimetre) if free and seen,
 * else the nearest free one within 0.6 m, else null (keep the last landing).
 * → {x,z,y,kind:'seat'|'person'|'edge'|'grid'|'free',target,turn,seat,key}|null; `key` changes only when the result does.
 */
export function resolveSnap(want,ctx={}){
 const {targets=[],project=null,free=()=>true,seen=()=>true,lock=null,capturePx=SNAP.capturePx.touch,snapping=true,grid=null,floor=null,previous=null}=ctx;
 const y0=Number.isFinite(want.y)?want.y:0;
 if(snapping&&targets.length&&project){
  const at=project([want.x,y0,want.z],false);
  if(at){
   let best=null;
   const scale=(p,c)=>{let s=0;for(const q of [[p[0]+.25,p[1],p[2]],[p[0],p[1],p[2]+.25]]){const o=project(q,false);if(o)s=Math.max(s,Math.hypot(o.x-c.x,o.y-c.y)*4);}return s;};
   for(const t of targets){
    let point=t.point;
    if(t.line){
     const [ax,az]=t.line.a,[bx,bz]=t.line.b,dx=bx-ax,dz=bz-az,length=Math.hypot(dx,dz);
     let s=length?((want.x-ax)*dx+(want.z-az)*dz)/length:0;s=Math.max(0,Math.min(Math.floor(length/SNAP.edgeStep+1e-9)*SNAP.edgeStep,Math.round(s/SNAP.edgeStep)*SNAP.edgeStep));
     const x=fixed(length?ax+dx/length*s:ax),z=fixed(length?az+dz/length*s:az);
     point=[x,floor?floor(x,z):(Number.isFinite(t.y)?t.y:y0),z];
    }
    if(!point||!point.every(Number.isFinite))continue;
    const c=project(point,false);if(!c)continue;   // the caller's gates decide what counts as on the picture
    const s=scale(point,c);if(!(s>0))continue;
    const [low,high]=SNAP.metres[t.kind]||SNAP.metres.edge,R=Math.min(Math.max(capturePx,low*s),high*s);
    const d=Math.hypot(at.x-c.x,at.y-c.y),locked=!!lock&&lock===t.id;
    if(d>(locked?SNAP.release:1)*R)continue;
    let score=d/R+SNAP.rankWeight*(t.rank??SNAP.rank[t.kind]??0);if(locked)score*=SNAP.switchRatio;
    if(best&&score>=best.score)continue;
    if(t.ok&&!t.ok(point[0],point[2]))continue;   // a gate checked only for a target that would win (it may cast rays)
    best={score,t,point};
   }
   if(best){const {t,point}=best,[x,y,z]=point;
    return {x,y,z,kind:t.kind,target:t,turn:Number.isFinite(t.turn)?t.turn:null,seat:t.seat||null,key:t.line?t.id+'@'+x.toFixed(2)+','+z.toFixed(2):t.id};}
  }
 }
 const landing=(x,z,kind)=>({x,y:floor?floor(x,z):y0,z,kind,target:null,turn:null,seat:null,key:kind+':'+x.toFixed(2)+','+z.toFixed(2)});
 if(snapping&&grid){const g=gridPoint(want,grid);if(free(g.x,g.z)&&seen(g.x,g.z))return landing(g.x,g.z,'grid');}
 // The centimetre points around the wanted one, nearest first: rounding alone can step 5 mm into whatever they stand against.
 const q=SNAP.quantum,around=[];for(const fx of [Math.floor,Math.ceil])for(const fz of [Math.floor,Math.ceil])around.push({x:fixed(fx(want.x/q)*q),z:fixed(fz(want.z/q)*q)});
 around.sort((a,b)=>Math.hypot(a.x-want.x,a.z-want.z)-Math.hypot(b.x-want.x,b.z-want.z));
 for(const p of around)if(free(p.x,p.z)&&seen(p.x,p.z))return landing(p.x,p.z,'free');
 const near=nearestFree({x:want.x,z:want.z},free,SNAP.search,previous);
 return near&&seen(near.x,near.z)?landing(near.x,near.z,'free'):null;
}

/**
 * A turn on stops of `step` degrees from `zero` (facing the camera), which changes only `hysteresis` degrees past halfway,
 * and caught by `detents` (facing a neighbour, a counter) within `catch` degrees until `release`. `previous` is the last
 * result. → {turn, detent: index into detents | null}
 */
export function snapTurn(raw,{zero=0,previous=null,detents=[],step=SNAP.turn.step,catch:catchAt=SNAP.turn.catch,release=SNAP.turn.release,hysteresis=SNAP.turn.hysteresis}={}){
 const off=(a,b)=>Math.abs(wrapTurn(a-b));
 if(previous?.detent!=null&&Number.isFinite(detents[previous.detent])&&off(raw,detents[previous.detent])<=release)return {turn:wrapTurn(detents[previous.detent]),detent:previous.detent};
 let best=null;detents.forEach((d,i)=>{if(Number.isFinite(d)&&off(raw,d)<=catchAt&&(best==null||off(raw,d)<off(raw,detents[best])))best=i;});
 if(best!=null)return {turn:wrapTurn(detents[best]),detent:best};
 const rel=wrapTurn(raw-zero);let k=Math.round(rel/step);
 if(previous&&previous.detent==null&&Number.isFinite(previous.turn)){const pk=Math.round(wrapTurn(previous.turn-zero)/step);if(off(rel,pk*step)<=step/2+hysteresis)k=pk;}
 return {turn:wrapTurn(zero+k*step),detent:null};
}

/** The next stop strictly beyond `turn` in `dir` (+1 left, −1 right) on zero + k·step. */
export function stepTurn(turn,dir,{zero=0,step=SNAP.turn.step}={}){
 const rel=wrapTurn(turn-zero),tolerance=.06;
 const k=dir>0?Math.floor((rel+tolerance)/step)+1:Math.ceil((rel-tolerance)/step)-1;
 return wrapTurn(zero+k*step);
}

/** The nearest point of a square grid of `size` metres turned by `yaw` about `origin` [x,z] (for the builders). */
export function gridPoint(p,{size=.5,origin=[0,0],yaw=0}={}){
 const c=Math.cos(yaw),s=Math.sin(yaw),dx=p.x-origin[0],dz=p.z-origin[1];
 const u=Math.round((c*dx-s*dz)/size)*size,v=Math.round((s*dx+c*dz)/size)*size;
 return {x:fixed(origin[0]+u*c+v*s),z:fixed(origin[1]-u*s+v*c)};
}

