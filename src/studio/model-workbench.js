/** Shared by the GLB workshop and MCP. Metres, Y up; no World or player state is written here. */
import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {GLTFExporter} from '../../tools/vendor/GLTFExporter.js';

export const MAX_GLB_BYTES=24*1024*1024;
const round=n=>Math.round(n*1e6)/1e6;
const vector=(v,fallback,label)=>{
 const a=v??fallback;if(!Array.isArray(a)||a.length!==3||!a.every(Number.isFinite))throw Error(`${label} needs three finite numbers.`);
 return new THREE.Vector3(...a);
};
export function glbDocument(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<20||bytes.length>MAX_GLB_BYTES)throw Error('Choose a GLB smaller than 24 MiB.');
 const v=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2||v.getUint32(8,true)!==bytes.length)throw Error('Invalid GLB v2 header or file length.');
 const n=v.getUint32(12,true);
 if(v.getUint32(16,true)!==0x4e4f534a||n%4||20+n>bytes.length)throw Error('Invalid GLB JSON chunk.');
 let doc;try{doc=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+n)));}catch{throw Error('Invalid GLB JSON.');}
 if(doc.asset?.version!=='2.0')throw Error('Only glTF 2.0 GLB models are supported.');
 if([...(doc.buffers||[]),...(doc.images||[])].some(x=>x.uri))throw Error('Embed all buffers and textures in the GLB; external resources are not loaded.');
 const unsupported=(doc.extensionsRequired||[]).filter(x=>['KHR_draco_mesh_compression','EXT_meshopt_compression','KHR_texture_basisu'].includes(x));
 if(unsupported.length)throw Error(`Re-export without ${unsupported.join(', ')} compression before importing.`);
 if(doc.skins?.length||doc.animations?.length)throw Error('This first workshop supports static GLBs. Rigged and animated GLB import is not supported yet.');
 return doc;
}

export async function loadModel(bytes,{name='Imported model',scale=1,rotation=[0,0,0],position=[0,0,0],ground=true}={}){
 glbDocument(bytes);
 if(!Number.isFinite(scale)||scale<=0||scale>1000)throw Error('Scale must be greater than zero and at most 1000.');
 const r=vector(rotation,[0,0,0],'Rotation'),p=vector(position,[0,0,0],'Position');
 if([...r.toArray(),...p.toArray()].some(n=>Math.abs(n)>100000))throw Error('Rotation or position is outside the supported range.');
 const parsed=await new GLTFLoader().parseAsync(bytes.slice().buffer,''),content=parsed.scene;
 const root=new THREE.Group(),transform=new THREE.Group();root.name=String(name).slice(0,80);root.userData.asset=root.name;
 root.add(transform);transform.add(content);transform.scale.setScalar(scale);transform.rotation.set(...r.toArray().map(THREE.MathUtils.degToRad));
 root.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(transform);
 if(bounds.isEmpty()||!bounds.min.toArray().concat(bounds.max.toArray()).every(Number.isFinite)){disposeModel(root);throw Error('The GLB has no finite visible model bounds.');}
 if(ground)transform.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
 transform.position.add(p);root.updateMatrixWorld(true);
 return root;
}
export function disposeModel(root){
 const native=!!root?.studioDispose;
 const geometries=new Set(),materials=new Set(),textures=new Set();
 root?.traverse(o=>{if(native){for(let a=o;a;a=a.parent)if(a.userData.sharedAsset)return;}if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[])){materials.add(m);for(const x of Object.values(m))if(x?.isTexture)textures.add(x);}});
 root?.studioDispose?.();
 for(const x of [...textures,...materials,...geometries])x.dispose();
 root?.removeFromParent();
}
export async function exportModel(root){
 root.updateMatrixWorld(true);
 return new Uint8Array(await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true}));
}

/** Align an object's local connector to a world connector; opposed normals meet without guessed offsets. */
export function snapConnector({source,target,scale=1,clearance=0}){
 if(!Number.isFinite(scale)||scale<=0||scale>1000||!Number.isFinite(clearance)||Math.abs(clearance)>1)throw Error('Invalid scale or connector clearance.');
 const sp=vector(source?.point,null,'Source point'),sn=vector(source?.normal,null,'Source normal');
 const tp=vector(target?.point,null,'Target point'),tn=vector(target?.normal,null,'Target normal');
 if(sn.length()<1e-8||tn.length()<1e-8)throw Error('Connector normals cannot be zero.');
 sn.normalize();tn.normalize();
 // A normal alone leaves roll unconstrained. Optional up vectors make modular joins repeatable.
 const frame=(normal,up,label)=>{
  let u=up===undefined?(Math.abs(normal.y)<.99?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1)):vector(up,null,label);
  u.addScaledVector(normal,-u.dot(normal));if(u.length()<1e-8)throw Error(`${label} must not be parallel to its normal.`);u.normalize();
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(u,normal),u,normal));
 };
 const q=frame(tn.clone().negate(),target.up,'Target up').multiply(frame(sn,source.up,'Source up').invert());
 const p=tp.clone().addScaledVector(tn,clearance).sub(sp.multiplyScalar(scale).applyQuaternion(q));
 return {position:p.toArray().map(round),quaternion:q.toArray().map(round),scale,clearance};
}
export function snapGrid({position,step=.05,origin=[0,0,0]}){
 const p=vector(position,null,'Position'),o=vector(origin,[0,0,0],'Grid origin');
 if(!Number.isFinite(step)||step<.001||step>10)throw Error('Grid step must be between 0.001 and 10 metres.');
 return p.sub(o).toArray().map((x,i)=>round(Math.round(x/step)*step+o.getComponent(i)));
}

/** Broad-phase boxes, followed by coplanarity and actual projected triangle intersection. Not a GPU visibility proof. */
export function auditSurfaces(root,{tolerance=.001,maxTriangles=50000,maxComparisons=250000,maxFindings=100}={}){
 if(!Number.isFinite(tolerance)||tolerance<=0||tolerance>.01)throw Error('Surface tolerance must be greater than 0 and at most 0.01 m.');
 const faces=[],findings=[];let triangles=0,comparisons=0,complete=true,unsupported=0;
 root.updateMatrixWorld(true);
 root.traverseVisible(o=>{
  if(!o.isMesh)return;
  if(o.isSkinnedMesh||o.isInstancedMesh){unsupported++;complete=false;return;}
  const g=o.geometry,attr=g?.attributes.position;if(!attr)return;
  const index=g.index,start=g.drawRange?.start||0,end=Math.min(index?.count??attr.count,Number.isFinite(g.drawRange?.count)?start+g.drawRange.count:Infinity);
  for(let i=start;i+2<end;i+=3){
   if(triangles++>=maxTriangles){complete=false;break;}
   const group=g.groups.find(a=>i>=a.start&&i<a.start+a.count),m=Array.isArray(o.material)?o.material[group?.materialIndex??0]:o.material;
   if(!m||m.visible===false||m.depthWrite===false)continue;
   const points=[0,1,2].map(j=>new THREE.Vector3().fromBufferAttribute(attr,index?index.getX(i+j):i+j).applyMatrix4(o.matrixWorld));
   if(points.some(p=>!p.toArray().every(Number.isFinite))){unsupported++;complete=false;continue;}
   const normal=new THREE.Vector3().subVectors(points[1],points[0]).cross(new THREE.Vector3().subVectors(points[2],points[0]));
   if(normal.lengthSq()<1e-20)continue;normal.normalize();
   const box=new THREE.Box3().setFromPoints(points).expandByScalar(tolerance);
   faces.push({points,normal,box,mesh:o.name||o.uuid,triangle:Math.floor(i/3),biased:m.polygonOffset===true});
  }
 });
 faces.sort((a,b)=>a.box.min.x-b.box.min.x);
 outer:for(let i=0;i<faces.length;i++)for(let j=i+1;j<faces.length&&faces[j].box.min.x<=faces[i].box.max.x;j++){
  if(++comparisons>maxComparisons){complete=false;break outer;}
  const a=faces[i],b=faces[j];if(!a.box.intersectsBox(b.box))continue;
  if(Math.abs(a.normal.dot(b.normal))<.999999)continue;
  if(b.points.some(p=>Math.abs(a.normal.dot(new THREE.Vector3().subVectors(p,a.points[0])))>tolerance))continue;
  if(!overlap(a,b))continue;
  findings.push({a:{mesh:a.mesh,triangle:a.triangle},b:{mesh:b.mesh,triangle:b.triangle},kind:'coplanar-overlap',depthBias:a.biased||b.biased});
  if(findings.length>=maxFindings){complete=false;break outer;}
 }
 return {complete,triangles:Math.min(triangles,maxTriangles),comparisons,unsupported,findings,
  ok:complete&&findings.length===0,scope:'Visible static depth-writing triangles in this model only. Near-coplanar overlap is a risk, not proof of visible z-fighting. No findings is not a whole-island or all-camera guarantee.'};
}
function overlap(a,b){
 const n=a.normal.toArray().map(Math.abs),drop=n.indexOf(Math.max(...n)),project=p=>p.toArray().filter((_,i)=>i!==drop);
 let poly=a.points.map(project);const clip=b.points.map(project),cross=(u,v,w)=>(v[0]-u[0])*(w[1]-u[1])-(v[1]-u[1])*(w[0]-u[0]);
 const sign=Math.sign(cross(...clip));
 for(let k=0;k<3&&poly.length;k++){
  const u=clip[k],v=clip[(k+1)%3],next=[];
  for(let i=0;i<poly.length;i++){
   const p=poly[i],q=poly[(i+1)%poly.length],dp=sign*cross(u,v,p),dq=sign*cross(u,v,q),ip=dp>=-1e-10,iq=dq>=-1e-10;
   if(ip)next.push(p);
   if(ip!==iq){const t=dp/(dp-dq);next.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t]);}
  }poly=next;
 }
 const area=Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
 return area>1e-9;
}
export function inspectModel(root,options){
 const box=new THREE.Box3().setFromObject(root),materials=new Set();let meshes=0;
 root.traverseVisible(o=>{if(o.isMesh){meshes++;for(const m of [].concat(o.material||[]))materials.add(m);}});
 return {name:root.name,metres:box.getSize(new THREE.Vector3()).toArray().map(round),bounds:{min:box.min.toArray().map(round),max:box.max.toArray().map(round)},meshes,materials:materials.size,surfaces:auditSurfaces(root,options)};
}
