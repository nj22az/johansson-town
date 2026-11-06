import * as THREE from '../../vendor/three.module.js';
/** Static support queries; no simulated time. A virtual floor is explicit, not exported geometry. */
export function findSupport(root,object,{floorY=0,maxTriangles=100000,tolerance=.005}={}){
 root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object);if(box.isEmpty())return {complete:false,reason:'Empty object bounds.'};
 const meshes=[];let triangles=0,unsupported=false;root.traverse(o=>{
  if(!o.isMesh||!o.visible)return;let ancestor=o;while(ancestor){if(ancestor===object)return;if(!ancestor.visible)return;ancestor=ancestor.parent;}
  if(o.isInstancedMesh||o.isSkinnedMesh){unsupported=true;return;}if([].concat(o.material||[]).every(m=>m.depthWrite===false||m.visible===false))return;
  triangles+=(o.geometry.index?.count||o.geometry.attributes.position?.count||0)/3;meshes.push(o);
 });
 if(unsupported||triangles>maxTriangles)return {complete:false,reason:unsupported?'Instanced or skinned support geometry needs a dedicated query.':'Support geometry exceeds the triangle budget.'};
 const mid=box.getCenter(new THREE.Vector3()),dx=(box.max.x-box.min.x)*.35,dz=(box.max.z-box.min.z)*.35;
 const samples=[[0,0],[-dx,-dz],[-dx,dz],[dx,-dz],[dx,dz]],ray=new THREE.Raycaster(),normal=new THREE.Vector3(),matrix=new THREE.Matrix3();let supportY=-Infinity,support=null,hits=0;
 for(const [x,z] of samples){ray.set(new THREE.Vector3(mid.x+x,box.min.y+tolerance,mid.z+z),new THREE.Vector3(0,-1,0));ray.far=Math.max(0,box.min.y-floorY+100);
  let y=floorY<=box.min.y+tolerance?floorY:-Infinity,name='Room floor';for(const h of ray.intersectObjects(meshes,false)){if(!h.face)continue;normal.copy(h.face.normal).applyNormalMatrix(matrix.getNormalMatrix(h.object.matrixWorld));if(normal.y<.7)continue;if(h.point.y>y){y=h.point.y;name=h.object.name||'Supporting model';}break;}
  if(Number.isFinite(y)){hits++;if(y>supportY){supportY=y;support=name;}}
 }
 if(!Number.isFinite(supportY))return {complete:true,supported:false,reason:'No support below the object.',bottom:box.min.y};
 const gap=box.min.y-supportY;return {complete:true,supported:Math.abs(gap)<=tolerance,gap,bottom:box.min.y,supportY,support,samples:hits,position:[object.position.x,Number((object.position.y-gap).toFixed(6)),object.position.z],scope:'Five footprint samples and a horizontal floor; checks contact, not physical stability or full collision clearance.'};
}
export function auditSupport(root,{floorY=0,exempt=new Set()}={}){const findings=[];let complete=true;for(const object of root.children){const id=object.userData.roomObject;if(exempt.has(id))continue;const r=findSupport(root,object,{floorY});if(!r.complete)complete=false;if(!r.supported)findings.push({id,name:object.name,...r});}return {complete,ok:complete&&!findings.length,findings,scope:'Visible resting room objects. Attached/suspended objects excluded. Static contact check, not rigid-body simulation.'};}
