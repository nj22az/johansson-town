import * as THREE from '../vendor/three.module.js';

/**
 * What a walker's feet would see from above at a point: the highest upward-facing surface below `top` metres among
 * the visible meshes of `root`, with the mesh's name. Built once over a region (a 1 m hash of the triangles), so a test
 * can ask thousands of points what covers the ground there (the lane edges, a lot) without a ray per mesh.
 */
export function groundCover(root,{minX=-Infinity,maxX=Infinity,minZ=-Infinity,maxZ=Infinity,top=.4,bottom=-1}={}){
 const cells=new Map(),key=(i,j)=>i+','+j;
 const a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3(),e1=new THREE.Vector3(),e2=new THREE.Vector3();
 const box=new THREE.Box3(),m=new THREE.Matrix4(),im=new THREE.Matrix4();
 const shown=o=>{for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;};
 root.updateMatrixWorld(true);
 root.traverse(mesh=>{
  if(!mesh.isMesh||!shown(mesh))return;
  const g=mesh.geometry,pos=g?.attributes?.position;if(!pos)return;
  if(!g.boundingBox)g.computeBoundingBox();
  const count=mesh.isInstancedMesh?mesh.count:1;
  for(let k=0;k<count;k++){
   m.copy(mesh.matrixWorld);if(mesh.isInstancedMesh){mesh.getMatrixAt(k,im);m.multiply(im);}
   box.copy(g.boundingBox).applyMatrix4(m);
   if(box.min.y>top||box.max.y<bottom||box.max.x<minX||box.min.x>maxX||box.max.z<minZ||box.min.z>maxZ)continue;
   const idx=g.index,tris=(idx?idx.count:pos.count)/3;
   for(let t=0;t<tris;t++){
    const i0=idx?idx.getX(t*3):t*3,i1=idx?idx.getX(t*3+1):t*3+1,i2=idx?idx.getX(t*3+2):t*3+2;
    a.fromBufferAttribute(pos,i0).applyMatrix4(m);b.fromBufferAttribute(pos,i1).applyMatrix4(m);c.fromBufferAttribute(pos,i2).applyMatrix4(m);
    const hi=Math.max(a.y,b.y,c.y),lo=Math.min(a.y,b.y,c.y);if(hi>top||lo<bottom)continue;
    n.crossVectors(e1.subVectors(b,a),e2.subVectors(c,a));const len=n.length();if(!len||Math.abs(n.y)/len<.6)continue;
    const x0=Math.min(a.x,b.x,c.x),x1=Math.max(a.x,b.x,c.x),z0=Math.min(a.z,b.z,c.z),z1=Math.max(a.z,b.z,c.z);
    if(x1<minX||x0>maxX||z1<minZ||z0>maxZ)continue;
    const tri={ax:a.x,ay:a.y,az:a.z,bx:b.x,by:b.y,bz:b.z,cx:c.x,cy:c.y,cz:c.z,name:mesh.name};
    for(let i=Math.floor(Math.max(x0,minX-1));i<=Math.floor(Math.min(x1,maxX+1));i++)for(let j=Math.floor(Math.max(z0,minZ-1));j<=Math.floor(Math.min(z1,maxZ+1));j++){
     const k2=key(i,j);if(!cells.has(k2))cells.set(k2,[]);cells.get(k2).push(tri);
    }
   }
  }
 });
 return (x,z)=>{
  let best=null;
  for(const t of cells.get(key(Math.floor(x),Math.floor(z)))||[]){
   const d=(t.bz-t.cz)*(t.ax-t.cx)+(t.cx-t.bx)*(t.az-t.cz);if(!d)continue;
   const u=((t.bz-t.cz)*(x-t.cx)+(t.cx-t.bx)*(z-t.cz))/d,v=((t.cz-t.az)*(x-t.cx)+(t.ax-t.cx)*(z-t.cz))/d,w=1-u-v;
   if(u<-1e-6||v<-1e-6||w<-1e-6)continue;
   const y=u*t.ay+v*t.by+w*t.cy;if(!best||y>best.y)best={y,name:t.name};
  }
  return best;
 };
}
