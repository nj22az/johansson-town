import * as THREE from '../../../vendor/three.module.js';

/**
 * The drawing kit a house plan is built with (docs/BUILDING-AUDIT.md): partitions with
 * door gaps and head beams, fusuma, floor finishes, and wet rooms. Every partition is
 * solid to walk into, so a plan's rooms are only reached through their doors.
 *
 * `box(size,pos,colour,name)` adds a part to the room; `collider(x,z,w,d,h)` blocks it.
 */
export function createPlanKit({box,collider=()=>{},height:H=2.7,wall=0xeee3cc,frame=0x5a4430}){
 const partitions=[];let finished=false;
 const finishPartitions=()=>{if(!finished){clipPartitionFaces(partitions);finished=true;}};
 /** A partition from (x1,z1) to (x2,z2), axis-aligned, with gaps [from,to] along it. */
 const partition=(x1,z1,x2,z2,gaps=[],{name='Partition',fusuma=false}={})=>{
  const alongX=Math.abs(z2-z1)<1e-6,a0=alongX?Math.min(x1,x2):Math.min(z1,z2),a1=alongX?Math.max(x1,x2):Math.max(z1,z2),fixed=alongX?z1:x1;
  let at=a0;const spans=[];for(const [g0,g1] of [...gaps].sort((p,q)=>p[0]-q[0])){if(g0>at)spans.push([at,g0]);at=Math.max(at,g1);}if(a1>at)spans.push([at,a1]);
  for(const [p0,p1] of spans){const len=p1-p0,mid=(p0+p1)/2;
   const size=alongX?[len,H,.08]:[.08,H,len],pos=alongX?[mid,H/2,fixed]:[fixed,H/2,mid];
   partitions.push(box(size,pos,fusuma?0xf6efdc:wall,name));
   if(fusuma){// Paper panels in a dark frame, a panel to every 0.9 m.
    const uprightHeight=alongX?1.8:1.815;
    const n=Math.max(1,Math.round(len/.9));for(let k=0;k<=n;k++){const t=p0+len*k/n;box(alongX?[.04,uprightHeight,.1]:[.1,uprightHeight,.04],alongX?[t,uprightHeight/2,fixed]:[fixed,uprightHeight/2,t],frame,'Fusuma upright');}
    // Rails rest above uprights and cover panel ends, avoiding shared dark/paper faces.
    const railY=uprightHeight+.025;
    box(alongX?[len+.04,.05,.1]:[.1,.05,len+.04],alongX?[mid,railY,fixed]:[fixed,railY,mid],frame,'Fusuma head rail');}
   else {const dadoY=alongX?.935:.92;box(alongX?[len+.04,.05,.1]:[.1,.05,len+.04],alongX?[mid,dadoY,fixed]:[fixed,dadoY,mid],frame,'Partition dado');}
   collider(pos[0],pos[2],size[0]+.04,size[2]+.04,H);}
  // A head beam over each opening.
  for(const [g0,g1] of gaps){const len=g1-g0,mid=(g0+g1)/2;partitions.push(box(alongX?[len,H-2.0,.08]:[.08,H-2.0,len],alongX?[mid,2.0+(H-2.0)/2,fixed]:[fixed,2.0+(H-2.0)/2,mid],wall,'Doorway head beam'));}
 };
 const floorPatch=(x0,x1,z0,z1,c,name)=>box([x1-x0,.012,z1-z0],[(x0+x1)/2,.012,(z0+z1)/2],c,name);
 /** A toilet or bath room; the fitting stands at the end away from its door. */
 const wetRoom=(x0,x1,z0,z1,label,toilet,doorAt='z0')=>{
  floorPatch(x0+.04,x1-.04,z0+.04,z1-.04,0xd8e4e6,label+' floor');
  if(doorAt==='x0'||doorAt==='x1'){
   // The door is in a side wall: the fitting stands against the opposite one.
   const far=doorAt==='x0'?x1:x0,dir=doorAt==='x0'?-1:1,fx=far+dir*.33,cz=(z0+z1)/2;
   if(toilet){box([.55,.4,.4],[fx,.2,cz],0xf4f6f6,'Toilet');box([.16,.5,.42],[far+dir*.1,.65,cz],0xeef2f2,'Toilet cistern');}
   else{box([.6,.55,z1-z0-.2],[fx,.28,cz],0x7fb8c8,'Bath (ofuro)');box([.5,.04,z1-z0-.3],[fx,.56,cz],0xbfe0e8);}
   collider(fx,cz,.6,toilet?.5:z1-z0-.1,.6);return;
  }
  const far=doorAt==='z0'?z1:z0,dir=doorAt==='z0'?-1:1,fz=far+dir*.33,cx=(x0+x1)/2;
  if(toilet){box([.4,.4,.55],[cx,.2,fz],0xf4f6f6,'Toilet');box([.42,.5,.16],[cx,.65,far+dir*.1],0xeef2f2,'Toilet cistern');}
  else{box([x1-x0-.2,.55,.6],[cx,.28,fz],0x7fb8c8,'Bath (ofuro)');box([x1-x0-.3,.04,.5],[cx,.56,fz],0xbfe0e8);box([.12,.6,.12],[x0+.2,1.2,(z0+z1)/2],0x9aa3a6,'Shower');}
  collider(cx,fz,x1-x0-.1,.6,.6);
 };
 /**
  * A futon laid out for the night, head to -z, centred at (x, zc): mattress, quilt and
  * pillow, flat on the floor. It has no collider -- you step onto a futon -- and it
  * returns where its sleeper lies and gets up (the home-residents.js contract).
  */
 const futon=(x,zc,colour,name,{length=2.1,width=1.0}={})=>{
  box([width,.1,length],[x,.05,zc],0xe9dfc8,name);
  box([width-.08,.05,length*.62],[x,.125,zc+length*.12],colour,name+' quilt');
  box([width*.6,.1,.36],[x,.15,zc-length/2+.3],0xf3e8d2,name+' pillow');
  return {bed:[x,.28,zc+.75],bedside:[x,0,zc+.6],cover:{position:[x,.36,zc+.15],width:width-.02,length:1.3,axis:'z'}};
 };
 return {partition,floorPatch,wetRoom,futon,finishPartitions};
}

/** A wooden peg on the wall where a hat hangs when its owner is home. */
export function addHatPeg(box,hook){
 if(!hook)return;
 const [x,y,z]=hook.position,out=[Math.sin(hook.yaw||0),Math.cos(hook.yaw||0)];
 box([.1,.1,.03],[x+out[0]*.005,y+.12,z+out[1]*.005],0x6d5238).rotation.y=hook.yaw||0;
 box([.035,.035,.14],[x+out[0]*.07,y+.1,z+out[1]*.07],0x6d5238).rotation.y=hook.yaw||0;
}

/** A standard material cache, one per colour. */
export function materialCache(){
 const mats=new Map();
 return c=>{if(!mats.has(c))mats.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c);};
}

/** Surface union of axis-aligned partition boxes, preserving their colours/names. */
function clipPartitionFaces(meshes){
 const boxes=meshes.map(m=>{const p=m.geometry.parameters,s=[p.width,p.height,p.depth],at=m.position.toArray();return {min:at.map((v,i)=>v-s[i]/2),max:at.map((v,i)=>v+s[i]/2)};});
 const epsilon=1e-7;
 for(let i=0;i<meshes.length;i++){
  const owner=boxes[i],positions=[],normals=[],uvs=[];
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const plane=owner[sign<0?'min':'max'][axis],axes=[0,1,2].filter(a=>a!==axis),[u,v]=axes;
   let patches=[[owner.min[u],owner.max[u],owner.min[v],owner.max[v]]];
   for(let j=0;j<boxes.length;j++){
    if(i===j)continue;const other=boxes[j],outside=plane+sign*epsilon;
    const buried=outside>other.min[axis]&&outside<other.max[axis];
    const shared=j<i&&Math.abs(plane-other[sign<0?'min':'max'][axis])<epsilon;
    if(!buried&&!shared)continue;
    const next=[];
    for(const [a,b,c,d] of patches){
     const l=Math.max(a,other.min[u]),r=Math.min(b,other.max[u]),lo=Math.max(c,other.min[v]),hi=Math.min(d,other.max[v]);
     if(r-l<=epsilon||hi-lo<=epsilon){next.push([a,b,c,d]);continue;}
     if(l-a>epsilon)next.push([a,l,c,d]);if(b-r>epsilon)next.push([r,b,c,d]);
     if(lo-c>epsilon)next.push([l,r,c,lo]);if(d-hi>epsilon)next.push([l,r,hi,d]);
    }
    patches=next;
   }
   const front=(axis===1?-1:1)===sign,indices=front?[0,1,2,0,2,3]:[0,2,1,0,3,2];
   for(const [a,b,c,d] of patches){
    const corners=[[a,c],[b,c],[b,d],[a,d]];
    for(const n of indices){const point=[0,0,0],normal=[0,0,0];point[axis]=plane;point[u]=corners[n][0];point[v]=corners[n][1];normal[axis]=sign;
     positions.push(...point.map((p,k)=>p-meshes[i].position.toArray()[k]));normals.push(...normal);uvs.push((corners[n][0]-owner.min[u])/(owner.max[u]-owner.min[u]),(corners[n][1]-owner.min[v])/(owner.max[v]-owner.min[v]));}
   }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  meshes[i].geometry.dispose();meshes[i].geometry=geometry;meshes[i].userData.partitionSurface=true;
 }
}
