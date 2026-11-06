import * as THREE from '../../vendor/three.module.js';

/**
 * What the third-person lens can see through, outdoors.
 *
 * The boom used to test only the walking colliders, and those stop at what stands on the
 * ground: an awning, a shop's glass front, a canopy or a roof overhang is not one. So the lens
 * slid under Sakura's awning and behind its windows, and the whole view came out pale and
 * cut across by a beam. This casts the boom against the drawn surfaces instead.
 *
 * The town (and the shops drawn beside it) is static. Meshes are filed in an 8 m grid by
 * their world bounds; the first time the lens comes near a cell, the triangles of those
 * meshes that fall in it are copied out in world space, once. The town's merged quarters run
 * to tens of thousands of triangles a mesh, and a query then tests only the few hundred
 * that lie in its own cell, both faces, so a single-sided awning seen from below still
 * counts. People, vehicles and moving props are left out (the lens should not jump because
 * a neighbour walked behind you), and so are flat slabs: the caller keeps the lens above
 * the ground itself.
 */
const CELL=8;
/** Cells copied out per query at most, so walking into new streets never costs a hitch. */
const BUILDS_PER_QUERY=1;

function passing(o){
 if(o.isSkinnedMesh)return true;
 for(let p=o;p;p=p.parent){const u=p.userData;if(u.character||u.name||u.vehicle||u.dynamicProp||u.lensClear)return true;}
 return false;
}
function seeThroughOnly(m){const list=Array.isArray(m)?m:[m];return list.every(x=>!x||x.visible===false||x.colorWrite===false||x.depthWrite===false&&!x.transparent||(x.transparent&&(x.opacity??1)<.08));}
function key(i,j){return (i+4096)*8192+(j+4096);}

export function createLensOcclusion({root,skip=()=>false}={}){
 const meshesByCell=new Map(),built=new Map();let count=-1,size=0,indexedAt=-Infinity;
 const box=new THREE.Box3(),m4=new THREE.Matrix4(),inst=new THREE.Matrix4(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 function index(){
  meshesByCell.clear();built.clear();size=0;root.updateMatrixWorld(true);
  root.traverse(o=>{
   if(!o.isMesh||o.isLine||o.isPoints||o.isSprite||!o.geometry?.attributes?.position)return;
   if(seeThroughOnly(o.material)||passing(o))return;
   for(let p=o;p;p=p.parent)if(skip(p))return;
   const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();
   // An instanced field (cane, tetrapods) is filed instance by instance, so a cell only
   // copies out the few that stand in it.
   if(o.isInstancedMesh)for(let k=0;k<o.count;k++){o.getMatrixAt(k,inst);file(o,k,box.copy(g.boundingBox).applyMatrix4(m4.multiplyMatrices(o.matrixWorld,inst)));}
   else file(o,-1,box.copy(g.boundingBox).applyMatrix4(o.matrixWorld));
  });
  count=root.children.length;indexedAt=performance.now();
 }
 function file(o,k,box){
  // Flat slabs, and the sky and sea that wrap the whole world, are not in the way.
  if(box.isEmpty()||box.max.y-box.min.y<.3||box.max.x-box.min.x>250||box.max.z-box.min.z>250)return;
  size++;const entry={o,k};
  for(let i=Math.floor(box.min.x/CELL);i<=Math.floor(box.max.x/CELL);i++)for(let j=Math.floor(box.min.z/CELL);j<=Math.floor(box.max.z/CELL);j++){
   const id=key(i,j);let list=meshesByCell.get(id);if(!list)meshesByCell.set(id,list=[]);list.push(entry);
  }
 }
 /** The world triangles of cell (i,j), with the mesh each run of them belongs to. */
 function build(i,j){
  const list=meshesByCell.get(key(i,j))||[],tris=[],runs=[],x0=i*CELL,x1=x0+CELL,z0=j*CELL,z1=z0+CELL;
  const take=(g,matrix)=>{
   const pos=g.attributes.position,idx=g.index,n=idx?idx.count:pos.count;
   for(let t=0;t+2<n;t+=3){
    const ia=idx?idx.getX(t):t,ib=idx?idx.getX(t+1):t+1,ic=idx?idx.getX(t+2):t+2;
    a.fromBufferAttribute(pos,ia).applyMatrix4(matrix);b.fromBufferAttribute(pos,ib).applyMatrix4(matrix);c.fromBufferAttribute(pos,ic).applyMatrix4(matrix);
    if(Math.max(a.x,b.x,c.x)<x0||Math.min(a.x,b.x,c.x)>x1||Math.max(a.z,b.z,c.z)<z0||Math.min(a.z,b.z,c.z)>z1)continue;
    tris.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);
   }
  };
  for(const {o,k} of list){
   const start=tris.length;
   if(k>=0){o.getMatrixAt(k,inst);take(o.geometry,m4.multiplyMatrices(o.matrixWorld,inst));}
   else take(o.geometry,o.matrixWorld);
   if(tris.length>start)runs.push(o,start/9,tris.length/9);
  }
  const cell={tris:new Float32Array(tris),runs};built.set(key(i,j),cell);return cell;
 }
 function shown(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
 // Möller–Trumbore against both faces; the distance along the unit ray, or Infinity.
 function hitTriangle(t,k,ox,oy,oz,dx,dy,dz){
  const ax=t[k],ay=t[k+1],az=t[k+2],e1x=t[k+3]-ax,e1y=t[k+4]-ay,e1z=t[k+5]-az,e2x=t[k+6]-ax,e2y=t[k+7]-ay,e2z=t[k+8]-az;
  const px=dy*e2z-dz*e2y,py=dz*e2x-dx*e2z,pz=dx*e2y-dy*e2x,det=e1x*px+e1y*py+e1z*pz;
  if(det>-1e-9&&det<1e-9)return Infinity;
  const inv=1/det,sx=ox-ax,sy=oy-ay,sz=oz-az,u=(sx*px+sy*py+sz*pz)*inv;if(u<0||u>1)return Infinity;
  const qx=sy*e1z-sz*e1y,qy=sz*e1x-sx*e1z,qz=sx*e1y-sy*e1x,v=(dx*qx+dy*qy+dz*qz)*inv;if(v<0||u+v>1)return Infinity;
  const d=(e2x*qx+e2y*qy+e2z*qz)*inv;return d>=0?d:Infinity;
 }
 /**
  * The clear distance along `dir` (unit) from `from`, up to `max`. Returns `max` when
  * nothing drawn is in the way.
  */
 function clear(from,dir,max){
  // Refiled when something is added to or taken from the world's top level (a room's
  // continuous set, a section swapped in); otherwise the copied cells are kept.
  if(root.children.length!==count&&performance.now()-indexedAt>5000)index();
  const ox=from.x,oy=from.y,oz=from.z,dx=dir.x,dy=dir.y,dz=dir.z,ex=ox+dx*max,ey=oy+dy*max,ez=oz+dz*max;
  const lx=Math.min(ox,ex),hx=Math.max(ox,ex),ly=Math.min(oy,ey),hy=Math.max(oy,ey),lz=Math.min(oz,ez),hz=Math.max(oz,ez);
  let best=max,builds=0;
  for(let i=Math.floor(lx/CELL);i<=Math.floor(hx/CELL);i++)for(let j=Math.floor(lz/CELL);j<=Math.floor(hz/CELL);j++){
   let cell=built.get(key(i,j));
   if(!cell){if(builds>=BUILDS_PER_QUERY||!meshesByCell.has(key(i,j)))continue;builds++;cell=build(i,j);}
   const t=cell.tris,r=cell.runs;
   for(let q=0;q<r.length;q+=3){
    if(!shown(r[q]))continue;
    for(let n=r[q+1];n<r[q+2];n++){
     const k=n*9;
     if(Math.max(t[k],t[k+3],t[k+6])<lx||Math.min(t[k],t[k+3],t[k+6])>hx||Math.max(t[k+1],t[k+4],t[k+7])<ly||Math.min(t[k+1],t[k+4],t[k+7])>hy||Math.max(t[k+2],t[k+5],t[k+8])<lz||Math.min(t[k+2],t[k+5],t[k+8])>hz)continue;
     const d=hitTriangle(t,k,ox,oy,oz,dx,dy,dz);if(d<best)best=d;
    }
   }
  }
  return best;
 }
 return {clear,index,get size(){return size;},
  /** For audits: the named meshes filed in the cell around a point. */
  near(x,z){return (meshesByCell.get(key(Math.floor(x/CELL),Math.floor(z/CELL)))||[]).map(({o})=>o.name||o.parent?.name||'?');}};
}
