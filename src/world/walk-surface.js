import * as THREE from '../../vendor/three.module.js';

/**
 * Where feet go: on top of what is drawn, not on the plan's idea of the ground.
 *
 * groundHeight() (layout.js) answers from the plan -- regions and their nominal heights --
 * while the town draws its own slabs over it: lanes 4 cm up, aprons 6 cm, a school yard,
 * a quay deck, a jetty. Each of those was a place people walked ankle- or knee-deep, found
 * one at a time from screenshots. This reads the slabs instead. Every upward-facing, opaque
 * triangle in the static town is laid onto a grid, and a cell keeps the highest one
 * that sits a little above the plan's ground there (up to a kerb's height). Gentle slopes
 * count, so a lane laid over a graded mound is stood on along its whole length. groundHeight()
 * then adds that lift.
 *
 * Only lifts, never lowers: a slab under the plan's ground is just buried geometry. Steps
 * taller than STEP are left out, so a bench seat or a table top is never somewhere you
 * stand. Moving things (people, boats, vehicles) are skipped.
 */
export const WALK=Object.freeze({cell:.25,step:.25,min:.008});
const SKIP=/ferry|boat|tanker|vehicle|truck|bicycle|bus\b|avatar|person|people|character|cast|ocean|sea\b|water|sky|cloud|bird|cat\b|crab|window interior/i;

export function createWalkSurface({minX,maxX,minZ,maxZ,base,cell=WALK.cell,step=WALK.step}){
 const nx=Math.ceil((maxX-minX)/cell)+1,nz=Math.ceil((maxZ-minZ)/cell)+1;
 const lift=new Float32Array(nx*nz);
 const baseAt=new Float32Array(nx*nz).fill(NaN);
 const seen=new WeakSet(),levelRoots=new WeakSet(),levels=[];
 const ground=(i,j)=>{const k=j*nx+i;let b=baseAt[k];if(Number.isNaN(b)){b=base(minX+i*cell,minZ+j*cell);baseAt[k]=b;}return b;};
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),e1=new THREE.Vector3(),e2=new THREE.Vector3(),nrm=new THREE.Vector3(),m=new THREE.Matrix4(),inst=new THREE.Matrix4();
 let triangles=0;
 function splat(){
  const x0=Math.min(a.x,b.x,c.x),x1=Math.max(a.x,b.x,c.x),z0=Math.min(a.z,b.z,c.z),z1=Math.max(a.z,b.z,c.z);
  const i0=Math.max(0,Math.ceil((x0-minX)/cell)),i1=Math.min(nx-1,Math.floor((x1-minX)/cell));
  const j0=Math.max(0,Math.ceil((z0-minZ)/cell)),j1=Math.min(nz-1,Math.floor((z1-minZ)/cell));
  if(i0>i1||j0>j1)return;
  const d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(d)<1e-9)return;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){
   const px=minX+i*cell,pz=minZ+j*cell;
   const l1=((b.z-c.z)*(px-c.x)+(c.x-b.x)*(pz-c.z))/d,l2=((c.z-a.z)*(px-c.x)+(a.x-c.x)*(pz-c.z))/d,l3=1-l1-l2;
   if(l1<-1e-4||l2<-1e-4||l3<-1e-4)continue;
   const off=l1*a.y+l2*b.y+l3*c.y-ground(i,j);
   if(off>WALK.min&&off<=step){const k=j*nx+i;if(off>lift[k])lift[k]=off;}
  }
 }
 function skipped(o){
  for(let p=o;p;p=p.parent){
   if(p.userData?.walkSurface===false||p.userData?.playerControlled||p.isSkinnedMesh)return true;
   if(SKIP.test(p.name||''))return true;
  }
  return false;
 }
 function addMesh(o){
  const g=o.geometry,pos=g?.attributes?.position;if(!pos)return;
  const mat=o.material;if(!mat||Array.isArray(mat)&&!mat.length)return;
  const one=Array.isArray(mat)?mat[0]:mat;
  if(one.transparent&&(one.opacity??1)<.9||one.depthWrite===false||one.colorWrite===false||one.userData?.windowInterior)return;
  if(!g.boundingBox)g.computeBoundingBox();
  const idx=g.index,count=idx?idx.count:pos.count;
  const matrices=[];
  if(o.isInstancedMesh){for(let n=0;n<o.count;n++){o.getMatrixAt(n,inst);matrices.push(m.multiplyMatrices(o.matrixWorld,inst).clone());}}
  else matrices.push(o.matrixWorld);
  for(const mw of matrices){
   // A quick reject: nothing in this mesh comes near the ground.
   const box=g.boundingBox.clone().applyMatrix4(mw);
   if(box.min.y>2||box.max.x<minX||box.min.x>maxX||box.max.z<minZ||box.min.z>maxZ)continue;
   for(let t=0;t<count;t+=3){
    const ia=idx?idx.getX(t):t,ib=idx?idx.getX(t+1):t+1,ic=idx?idx.getX(t+2):t+2;
    a.fromBufferAttribute(pos,ia).applyMatrix4(mw);b.fromBufferAttribute(pos,ib).applyMatrix4(mw);c.fromBufferAttribute(pos,ic).applyMatrix4(mw);
    if(Math.max(a.y,b.y,c.y)>2)continue;
    // Walkable means facing up, flat or gently sloped (a lane over a graded mound): the
    // normal within about 25 degrees of straight up, either winding.
    e1.subVectors(b,a);e2.subVectors(c,a);nrm.crossVectors(e1,e2);
    const len=nrm.length();if(len<1e-9||Math.abs(nrm.y)/len<.9)continue;
    triangles++;splat();
   }
  }
 }
 return {
  /** Lays every static, opaque mesh under `root` not laid yet. Safe to call again. */
  add(root){
   if(!root)return 0;root.updateMatrixWorld(true);const before=triangles;
   root.traverse(o=>{if(o.userData?.walkLevels&&!levelRoots.has(o)){levelRoots.add(o);levels.push(...o.userData.walkLevels);}if(!o.isMesh||seen.has(o))return;seen.add(o);if(!skipped(o))addMesh(o);});
   return triangles-before;
  },
  level(x,z){let y=null;for(const s of levels)if(x>=s.minX-1e-7&&x<=s.maxX+1e-7&&z>=s.minZ-1e-7&&z<=s.maxZ+1e-7)y=Math.max(y??-Infinity,s.y);return y;},
  get levels(){return levels;},
  /** How far above the plan's ground the drawn surface is at x,z (0 where nothing is). */
  lift(x,z){
   const i=Math.round((x-minX)/cell),j=Math.round((z-minZ)/cell);
   if(i<0||j<0||i>=nx||j>=nz)return 0;
   return lift[j*nx+i];
  },
  get triangles(){return triangles;},
 };
}
