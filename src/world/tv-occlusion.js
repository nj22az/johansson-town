import * as THREE from '../../vendor/three.module.js';

/**
 * What stands between the camera and the izakaya television's screen (world/izakaya-tv-youtube.js).
 *
 * The YouTube player is a web page laid over the canvas, so nothing the game draws can pass in front of it: the overlay
 * may show only when the screen is in clear view. This answers "is any of these sight lines blocked?" for lines from the
 * camera to points on the screen, against three kinds of thing:
 *
 * - the room's meshes. The izakaya is about 105,000 triangles in a few large batches that span the room (the probe of
 *   27 November 2026: one batch of 15,000), so a plain three.js raycast would test most of them on every line. The
 *   room's triangles within reach of the screen are put once, in world space, into a bounding-volume tree and queried
 *   from it. A mesh that moves afterwards (a cold-store door, a glass), turns invisible or is added later is noticed on
 *   each query and handled on its own with three.js's raycast;
 * - other objects given at query time (the first-person hands and what they hold, which hang off the camera);
 * - people, as upright capsules round their bodies (residents and Johansson's own body in third person): a skinned body
 *   raycast per triangle is costly, and a capsule a little larger than the body also covers an arm or a held glass.
 */

const LEAF=8,STEP=3000;

/**
 * A bounding-volume tree over triangles (positions: 9 floats a triangle, world space; owners: a mesh index each), built a
 * step at a time: the generator yields after about STEP triangles' work and returns the tree. buildTriangleTree() runs it
 * to the end at once.
 */
export function* triangleTreeSteps(positions,owners){
 const n=owners.length,order=new Uint32Array(n),cx=new Float32Array(n),cy=new Float32Array(n),cz=new Float32Array(n);
 for(let i=0;i<n;i++){const p=i*9;order[i]=i;cx[i]=(positions[p]+positions[p+3]+positions[p+6])/3;cy[i]=(positions[p+1]+positions[p+4]+positions[p+7])/3;cz[i]=(positions[p+2]+positions[p+5]+positions[p+8])/3;if(i%(STEP*4)===STEP*4-1)yield;}
 // A tree of n triangles has fewer than 2n nodes; the arrays are cut to what was used once it is built.
 const capacity=2*n+1;let box=new Float32Array(capacity*6),start=new Uint32Array(capacity),count=new Uint32Array(capacity);
 let nodes=0,work=0;
 // Depth first, the left child straight after its parent; the right child's number is written into its parent's `start`.
 const tasks=n?[[0,n,-1]]:[];
 while(tasks.length){
  const [lo,hi,parent]=tasks.pop(),node=nodes++;if(parent>=0)start[parent]=node;
  let x0=Infinity,y0=Infinity,z0=Infinity,x1=-Infinity,y1=-Infinity,z1=-Infinity;
  let a0=Infinity,b0=Infinity,c0=Infinity,a1=-Infinity,b1=-Infinity,c1=-Infinity;
  for(let k=lo;k<hi;k++){
   const t=order[k],p=t*9;
   for(let v=0;v<9;v+=3){const x=positions[p+v],y=positions[p+v+1],z=positions[p+v+2];if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;if(z<z0)z0=z;if(z>z1)z1=z;}
   if(cx[t]<a0)a0=cx[t];if(cx[t]>a1)a1=cx[t];if(cy[t]<b0)b0=cy[t];if(cy[t]>b1)b1=cy[t];if(cz[t]<c0)c0=cz[t];if(cz[t]>c1)c1=cz[t];
  }
  const b=node*6;box[b]=x0;box[b+1]=y0;box[b+2]=z0;box[b+3]=x1;box[b+4]=y1;box[b+5]=z1;
  if(hi-lo<=LEAF){start[node]=lo;count[node]=hi-lo;}
  else{
   // Split the centroids at the middle of their longest extent; when they all sit together, split the list in half.
   const ex=a1-a0,ey=b1-b0,ez=c1-c0,axis=ex>=ey&&ex>=ez?cx:ey>=ez?cy:cz,mid=axis===cx?(a0+a1)/2:axis===cy?(b0+b1)/2:(c0+c1)/2;
   let i=lo,j=hi-1;
   while(i<=j){if(axis[order[i]]<mid)i++;else{const s=order[i];order[i]=order[j];order[j]=s;j--;}}
   let split=i;if(split===lo||split===hi)split=(lo+hi)>>1;
   count[node]=0;tasks.push([split,hi,node],[lo,split,-1]);
  }
  if((work+=hi-lo)>=STEP){work=0;yield;}
 }
 box=box.slice(0,nodes*6);start=start.slice(0,nodes);count=count.slice(0,nodes);
 const stack=new Uint32Array(128);
 /** The owner of a triangle the segment from o along d (not normalised), for t in (near,far), meets and accept() allows; -1 for none. */
 function anyHit(ox,oy,oz,dx,dy,dz,near,far,accept){
  if(!n)return -1;
  const ix=1/(Math.abs(dx)>1e-12?dx:1e-12),iy=1/(Math.abs(dy)>1e-12?dy:1e-12),iz=1/(Math.abs(dz)>1e-12?dz:1e-12);
  let top=0;stack[top++]=0;
  while(top){
   const node=stack[--top],b=node*6;
   let t0=(box[b]-ox)*ix,t1=(box[b+3]-ox)*ix,lo=Math.min(t0,t1),hi=Math.max(t0,t1);
   t0=(box[b+1]-oy)*iy;t1=(box[b+4]-oy)*iy;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
   t0=(box[b+2]-oz)*iz;t1=(box[b+5]-oz)*iz;lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
   if(hi<lo||hi<near||lo>far)continue;
   if(count[node]){
    for(let k=start[node],end=k+count[node];k<end;k++){const t=order[k];if(accept(owners[t])&&hitsTriangle(positions,t*9,ox,oy,oz,dx,dy,dz,near,far))return owners[t];}
   }else{stack[top++]=start[node];stack[top++]=node+1;}
  }
  return -1;
 }
 return {anyHit,triangles:n,nodes};
}
export function buildTriangleTree(positions,owners){const steps=triangleTreeSteps(positions,owners);for(;;){const r=steps.next();if(r.done)return r.value;}}

/** Möller–Trumbore, both faces, the hit's parameter strictly inside (near, far). */
function hitsTriangle(P,p,ox,oy,oz,dx,dy,dz,near,far){
 const ax=P[p],ay=P[p+1],az=P[p+2],e1x=P[p+3]-ax,e1y=P[p+4]-ay,e1z=P[p+5]-az,e2x=P[p+6]-ax,e2y=P[p+7]-ay,e2z=P[p+8]-az;
 const px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;
 if(Math.abs(det)<1e-14)return false;
 const inv=1/det,sx=ox-ax,sy=oy-ay,sz=oz-az,u=(sx*px+sy*py+sz*pz)*inv;if(u<0||u>1)return false;
 const qx=sy*e1z-sz*e1y,qy=sz*e1x-sx*e1z,qz=sx*e1y-sy*e1x,v=(dx*qx+dy*qy+dz*qz)*inv;if(v<0||u+v>1)return false;
 const t=(e2x*qx+e2y*qy+e2z*qz)*inv;return t>near&&t<far;
}

/** Closest distance between segments p0–p1 and q0–q1 (Ericson, Real-Time Collision Detection 5.1.9). */
export function segmentDistance(p0,p1,q0,q1){
 const d1=_a.subVectors(p1,p0),d2=_b.subVectors(q1,q0),r=_c.subVectors(p0,q0),a=d1.dot(d1),e=d2.dot(d2),f=d2.dot(r);
 let s,t;
 if(a<=1e-12&&e<=1e-12)return p0.distanceTo(q0);
 if(a<=1e-12){s=0;t=THREE.MathUtils.clamp(f/e,0,1);}
 else{const c=d1.dot(r);if(e<=1e-12){t=0;s=THREE.MathUtils.clamp(-c/a,0,1);}else{const b=d1.dot(d2),den=a*e-b*b;s=den>1e-12?THREE.MathUtils.clamp((b*f-c*e)/den,0,1):0;t=(b*s+f)/e;if(t<0){t=0;s=THREE.MathUtils.clamp(-c/a,0,1);}else if(t>1){t=1;s=THREE.MathUtils.clamp((b-c)/a,0,1);}}}
 _d.copy(p0).addScaledVector(d1,s);_e.copy(q0).addScaledVector(d2,t);return _d.distanceTo(_e);
}
const _a=new THREE.Vector3(),_b=new THREE.Vector3(),_c=new THREE.Vector3(),_d=new THREE.Vector3(),_e=new THREE.Vector3();

/** Whether a mesh is drawn as something solid now: itself and every parent visible, an opaque material, on the camera's layers. */
export function solidNow(mesh,layers=null){
 for(let o=mesh;o;o=o.parent)if(!o.visible)return false;
 if(layers&&!mesh.layers.test(layers))return false;
 if(mesh.userData?.clearWindow||mesh.isSprite||mesh.isPoints||mesh.isLine)return false;
 const list=Array.isArray(mesh.material)?mesh.material:[mesh.material];
 return list.some(m=>m&&m.visible!==false&&m.colorWrite!==false&&!(m.transparent&&(m.opacity??1)<.5));
}

const SAME=1e-6;
function sameMatrix(a,b){for(let i=0;i<16;i++)if(Math.abs(a[i]-b[i])>SAME)return false;return true;}

/**
 * The sight-line test for one screen. `root` is the room, `exclude` the television's own group (its bezel and cabinet
 * surround the screen), `centre` and `reach` bound what can stand between a camera near enough to see the overlay and
 * the screen: only triangles within `reach` of the centre are put in the tree.
 */
export function createScreenOcclusion({root,exclude=null,centre=new THREE.Vector3(),reach=4.5}={}){
 let tree=null,meshes=[],index=new Map(),stamp=0,rebuildWanted=true,building=null,workMs=0;
 const clock=()=>globalThis.performance?.now?.()??Date.now();
 const excluded=o=>{for(let p=o;p;p=p.parent)if(p===exclude)return true;return false;};
 const boxed=new THREE.Box3(),sphere=new THREE.Sphere(),ray=new THREE.Ray(),raycaster=new THREE.Raycaster(),hits=[];
 const v=new THREE.Vector3(),w=new THREE.Vector3(),u=new THREE.Vector3(),dir=new THREE.Vector3(),top=new THREE.Vector3(),base=new THREE.Vector3();
 function inTree(mesh){return mesh.isMesh&&!mesh.isSkinnedMesh&&!mesh.isInstancedMesh&&!!mesh.geometry?.attributes?.position;}
 // The room's triangles within reach, then the tree, a step at a time (prepare() gives it a few milliseconds a frame).
 function* rebuildSteps(){
  root.updateWorldMatrix(true,true);const list=[],seen=new Map(),positions=[],owners=[];
  boxed.set(v.copy(centre).subScalar(reach),w.copy(centre).addScalar(reach));
  const found=[];root.traverse(o=>{if(inTree(o)&&!excluded(o))found.push(o);});
  let work=0;
  for(const o of found){
   const k=list.length,record={mesh:o,matrix:o.matrixWorld.elements.slice(),moved:false,active:false};list.push(record);seen.set(o,record);
   const p=o.geometry.attributes.position,ix=o.geometry.index,count=ix?ix.count:p.count,m=o.matrixWorld;
   for(let i=0;i+2<count;i+=3){
    v.fromBufferAttribute(p,ix?ix.getX(i):i).applyMatrix4(m);w.fromBufferAttribute(p,ix?ix.getX(i+1):i+1).applyMatrix4(m);u.fromBufferAttribute(p,ix?ix.getX(i+2):i+2).applyMatrix4(m);
    if(++work>=1500){work=0;yield;}
    if(Math.max(v.x,w.x,u.x)<boxed.min.x||Math.min(v.x,w.x,u.x)>boxed.max.x||Math.max(v.y,w.y,u.y)<boxed.min.y||Math.min(v.y,w.y,u.y)>boxed.max.y||Math.max(v.z,w.z,u.z)<boxed.min.z||Math.min(v.z,w.z,u.z)>boxed.max.z)continue;
    positions.push(v.x,v.y,v.z,w.x,w.y,w.z,u.x,u.y,u.z);owners.push(k);
   }
  }
  const built=yield* triangleTreeSteps(new Float32Array(positions),new Uint32Array(owners));
  tree=built;meshes=list;index=seen;rebuildWanted=false;stamp++;
 }
 /** Work on the tree for at most `budget` ms; true once it is ready. */
 function prepare(budget=Infinity){
  if(tree&&!rebuildWanted&&!building)return true;
  if(!building){rebuildWanted=false;building=rebuildSteps();}
  const t0=clock(),end=t0+budget;
  try{for(;;){if(building.next().done){building=null;return !rebuildWanted;}if(clock()>=end)return false;}}
  finally{workMs+=clock()-t0;}
 }
 /** Whether a body capsule ({base,height,radius}) is on the segment from a to b. */
 function bodyOn(a,b,body,extra=0){
  base.copy(body.base);base.y+=body.radius;top.copy(body.base);top.y+=Math.max(body.radius,body.height-body.radius);
  return segmentDistance(a,b,base,top)<body.radius+extra;
 }
 return {
  get triangles(){return tree?.triangles??0;},get built(){return stamp;},get buildMs(){return workMs;},
  get ready(){return !!tree&&!rebuildWanted&&!building;},
  /** Build the tree for at most `budget` ms (a query finishes it at once if it is needed before then). */
  prepare,
  invalidate(){rebuildWanted=true;building=null;},
  /**
   * Whether any segment from `origin` to one of `targets` is blocked. `bodies`: capsules ({base, height, radius});
   * `extra`: added to their radii (an early warning); `others`: more roots whose meshes block (the camera's held items);
   * `layers`: the camera's, so what it does not draw does not block. Returns the first thing found ({kind, name}), or null.
   */
  blocked({origin,targets,bodies=[],extra=0,others=[],layers=null}){
   if(!(tree&&!rebuildWanted&&!building))prepare(Infinity);
   // What is in the tree, as it is now; what is not (added, moved, skinned, instanced, held), raycast on its own.
   const loose=[];
   for(const record of meshes){
    const o=record.mesh;if(!o.parent){record.active=false;continue;}
    if(!record.moved&&!sameMatrix(o.matrixWorld.elements,record.matrix))record.moved=true;
    record.active=!record.moved&&solidNow(o,layers);if(record.moved&&solidNow(o,layers))loose.push(o);
   }
   const gather=r=>r?.traverse?.(o=>{if((o.isMesh||o.isSkinnedMesh||o.isInstancedMesh)&&!excluded(o)&&!index.has(o)&&solidNow(o,layers))loose.push(o);});
   gather(root);for(const r of others)gather(r);
   for(const target of targets){
    dir.subVectors(target,origin);const length=dir.length();if(length<1e-6)continue;
    // 1 cm short at both ends: the lens's own near plane and the screen's face are not in the way.
    const near=.01/length,far=1-.01/length;
    const owner=tree.anyHit(origin.x,origin.y,origin.z,dir.x,dir.y,dir.z,near,far,k=>meshes[k].active);
    if(owner>=0)return {kind:'room',name:meshes[owner].mesh.name||meshes[owner].mesh.parent?.name||'mesh'};
    for(const body of bodies)if(bodyOn(origin,target,body,extra))return {kind:'body',name:body.name||'body'};
    if(loose.length){
     ray.set(origin,v.copy(dir).divideScalar(length));raycaster.ray.copy(ray);raycaster.near=.01;raycaster.far=length-.01;if(layers)raycaster.layers.mask=layers.mask;
     for(const o of loose){
      if(o.geometry){if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();sphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);if(!ray.intersectsSphere(sphere))continue;}
      hits.length=0;o.raycast(raycaster,hits);if(hits.some(h=>h.distance>raycaster.near&&h.distance<raycaster.far))return {kind:'object',name:o.name||o.parent?.name||'mesh'};
     }
    }
   }
   return null;
  },
  dispose(){tree=null;building=null;meshes=[];index=new Map();},
 };
}
