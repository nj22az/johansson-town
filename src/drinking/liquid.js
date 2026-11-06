import * as THREE from '../../vendor/three.module.js';

// Quasi-static fluid: intersect the exact convex vessel interior with a plane. The
// finite polygon is also the rendered interior, so the solved and drawn volumes agree.
const interiors=new WeakMap();
const EPS=1e-11;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const arrayNormal=n=>{
 const a=Array.isArray(n)?n:[n.x,n.y,n.z],l=Math.hypot(...a);
 if(!(l>0))throw new RangeError('Liquid plane normal must be nonzero.');
 return a.map(v=>v/l);
};

function interior(profile){
 if(interiors.has(profile))return interiors.get(profile);
 const n=profile.segments,bottom=[],top=[];
 for(let i=0;i<n;i++){
  const a=i*2*Math.PI/n,c=Math.cos(a),s=Math.sin(a);
  bottom.push([profile.innerRadiusBottom*c,profile.interiorBottom,profile.innerRadiusBottom*s]);
  top.push([profile.innerRadiusTop*c,profile.interiorTop,profile.innerRadiusTop*s]);
 }
 const faces=[];
 for(let i=0;i<n;i++){const j=(i+1)%n;faces.push([bottom[i],top[i],top[j],bottom[j]]);}
 faces.push(bottom,top.slice().reverse());
 const result={faces,points:[...bottom,...top],tiltTable:null};interiors.set(profile,result);return result;
}

function clipFace(face,n,d){
 const result=[];
 if(!face.length)return result;
 let a=face[face.length-1],da=dot(n,a)-d,insideA=da<=EPS;
 for(const b of face){
  const db=dot(n,b)-d,insideB=db<=EPS;
  if(insideA!==insideB){
   const t=da/(da-db);
   result.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]);
  }
  if(insideB)result.push(b);
  a=b;da=db;insideA=insideB;
 }
 return result;
}

function faceVolume(face,origin){
 if(face.length<3)return 0;
 const a=face[0],ax=a[0]-origin[0],ay=a[1]-origin[1],az=a[2]-origin[2];let volume=0;
 for(let i=1;i<face.length-1;i++){
  const b=face[i],c=face[i+1],bx=b[0]-origin[0],by=b[1]-origin[1],bz=b[2]-origin[2],cx=c[0]-origin[0],cy=c[1]-origin[1],cz=c[2]-origin[2];
  volume+=ax*(by*cz-bz*cy)+ay*(bz*cx-bx*cz)+az*(bx*cy-by*cx);
 }
 return volume/6;
}

function planeVolume(model,n,d){
 // The cap's tetrahedra contribute zero because the origin lies on the clipping
 // plane. This gives exact polyhedral volume without sorting a cap during bisection.
 const origin=n.map(v=>v*d);let volume=0;
 for(const face of model.faces)volume+=faceVolume(clipFace(face,n,d),origin);
 return Math.max(0,volume*1e6);
}

/** Millilitres contained below n·p=offset, with n expressed in vessel-local space. */
export function volumeAtPlane(profile,normalLocal,offset){
 return clamp(planeVolume(interior(profile),arrayNormal(normalLocal),offset),0,profile.capacityMl);
}

function addTriangles(poly,target){
 for(let i=1;i<poly.length-1;i++)target.push(...poly[0],...poly[i],...poly[i+1]);
}

function capFor(faces,n,d){
 const points=[];
 for(const face of faces)for(const p of face){
  if(Math.abs(dot(n,p)-d)>2e-9)continue;
  if(!points.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])<1e-8))points.push(p);
 }
 if(points.length<3)return [];
 const centre=[0,0,0];for(const p of points)for(let k=0;k<3;k++)centre[k]+=p[k]/points.length;
 const ref=Math.abs(n[1])<.9?[0,1,0]:[1,0,0];
 const u=[ref[1]*n[2]-ref[2]*n[1],ref[2]*n[0]-ref[0]*n[2],ref[0]*n[1]-ref[1]*n[0]],len=Math.hypot(...u);
 for(let k=0;k<3;k++)u[k]/=len;
 const v=[n[1]*u[2]-n[2]*u[1],n[2]*u[0]-n[0]*u[2],n[0]*u[1]-n[1]*u[0]];
 points.sort((a,b)=>{
  const da=a.map((x,i)=>x-centre[i]),db=b.map((x,i)=>x-centre[i]);
  return Math.atan2(dot(da,v),dot(da,u))-Math.atan2(dot(db,v),dot(db,u));
 });
 return points;
}

/** Actual enclosed liquid mesh: immutable rest vertices are clipped afresh each call. */
export function clippedGeometry(profile,normalLocal,offset){
 const n=arrayNormal(normalLocal),model=interior(profile),faces=model.faces.map(face=>clipFace(face,n,offset));
 const sidePositions=[],capPositions=[],cap=capFor(faces,n,offset);
 // The top boundary only has area when callers tilt past the spill limit. Keep
 // that closure rather than letting geometry escape; normal drinking follows
 // requiredTilt, where this face has zero area. Avoid a duplicate at 100% upright.
 for(const face of faces)if(!face.every(p=>Math.abs(dot(n,p)-offset)<2e-9))addTriangles(face,sidePositions);
 addTriangles(cap,capPositions);
 const vertices=faces.flat().map(p=>new THREE.Vector3(...p));
 return {sidePositions,capPositions,cap:cap.map(p=>new THREE.Vector3(...p)),vertices};
}

/** Foam is a thin, closed slice above the liquid plane, bounded by the same interior. */
export function clippedBandGeometry(profile,normalLocal,lowerOffset,upperOffset){
 const n=arrayNormal(normalLocal),negative=n.map(x=>-x);
 const faces=interior(profile).faces.map(face=>clipFace(clipFace(face,n,upperOffset),negative,-lowerOffset));
 const positions=[];
 for(const face of faces)if(!face.every(p=>Math.abs(dot(n,p)-lowerOffset)<2e-9)&&!face.every(p=>Math.abs(dot(n,p)-upperOffset)<2e-9))addTriangles(face,positions);
 addTriangles(capFor(faces,n,upperOffset),positions);
 addTriangles(capFor(faces,negative,-lowerOffset),positions);
 return positions;
}

/** Solve the horizontal free surface's intercept, then construct its closed volume. */
export function solveFill(profile,volumeMl,normalLocal=new THREE.Vector3(0,1,0),{geometry=true}={}){
 const n=arrayNormal(normalLocal),model=interior(profile),volume=clamp(Number(volumeMl)||0,0,profile.capacityMl);
 let lo=Infinity,hi=-Infinity;
 for(const p of model.points){const d=dot(n,p);lo=Math.min(lo,d);hi=Math.max(hi,d);}
 let offset;
 if(volume<=1e-8)offset=lo;
 else if(profile.capacityMl-volume<=1e-8)offset=hi;
 else{
  // 24 iterations resolve well below a microlitre for these vessels.
  for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(planeVolume(model,n,mid)<volume)lo=mid;else hi=mid;}
  offset=(lo+hi)/2;
 }
 const result={normal:new THREE.Vector3(...n),offset,volumeMl:volume,enclosedVolumeMl:planeVolume(model,n,offset)};
 if(geometry)Object.assign(result,clippedGeometry(profile,n,offset));
 return result;
}

/** Lowest-rim equilibrium: increasing the tilt exposes progressively smaller volumes. */
export function requiredTilt(profile,volumeMl){
 const model=interior(profile),volume=clamp(Number(volumeMl)||0,0,profile.capacityMl);
 if(volume<=0)return Math.PI/2;
 if(volume>=profile.capacityMl)return 0;
 const rim=profile.liquidRimContact;
 const at=angle=>{const n=[Math.sin(angle),Math.cos(angle),0];return planeVolume(model,n,dot(n,rim));};
 if(!model.tiltTable){
  const count=256,values=new Float64Array(count+1);
  for(let i=0;i<=count;i++)values[i]=at(i/count*Math.PI/2);
  model.tiltTable=values;
 }
 const table=model.tiltTable,count=table.length-1;
 let left=0,right=count;
 while(right-left>1){const mid=(left+right)>>1;if(table[mid]>volume)left=mid;else right=mid;}
 let lo=left/count*Math.PI/2,hi=right/count*Math.PI/2;
 // Refinement keeps the contact/flow predicate accurate near the final mouthful.
 for(let i=0;i<8;i++){const mid=(lo+hi)/2;if(at(mid)>volume)lo=mid;else hi=mid;}
 return hi;
}

/** Does liquid actually reach the inner drinking edge? Contact itself is checked by the controller. */
export function liquidReachesRim(profile,solution,tolerance=.00001){
 return solution.volumeMl>0&&solution.normal.dot(new THREE.Vector3(...profile.liquidRimContact))<=solution.offset+tolerance;
}
