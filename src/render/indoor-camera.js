import * as THREE from '../../vendor/three.module.js';

/** Cache overhead surfaces once per room, including sloping roofs and upstairs floors.
 * Queries use projected triangles, independent of material sidedness or cutaway layers.
 * `from`: surfaces lower than this are floors and table tops, not ceilings (1.9 m over a room's floor; a house with a
 * basement starts lower, interiors/johansson-house-interior.js). */
export function createIndoorCeilings(root,{from=1.9}={}){
 root.updateMatrixWorld(true);
 const triangles=[],cells=new Map(),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),normal=new THREE.Vector3(),edge=new THREE.Vector3();
 root.traverse(o=>{
  if(!o.isMesh||o.isSkinnedMesh||!o.geometry?.attributes.position)return;
  const p=o.geometry.attributes.position,index=o.geometry.index,n=index?.count??p.count;
  for(let i=0;i+2<n;i+=3){
   a.fromBufferAttribute(p,index?index.getX(i):i).applyMatrix4(o.matrixWorld);
   b.fromBufferAttribute(p,index?index.getX(i+1):i+1).applyMatrix4(o.matrixWorld);
   c.fromBufferAttribute(p,index?index.getX(i+2):i+2).applyMatrix4(o.matrixWorld);
   normal.subVectors(b,a).cross(edge.subVectors(c,a)).normalize();
   if(Math.abs(normal.y)<.5||Math.min(a.y,b.y,c.y)<(from??1.9))continue;
   const den=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
   if(Math.abs(den)<1e-8)continue;
   triangles.push({ax:a.x,ay:a.y,az:a.z,bx:b.x,by:b.y,bz:b.z,cx:c.x,cy:c.y,cz:c.z,den,
    minX:Math.min(a.x,b.x,c.x),maxX:Math.max(a.x,b.x,c.x),minZ:Math.min(a.z,b.z,c.z),maxZ:Math.max(a.z,b.z,c.z)});
  }
 });
 for(const t of triangles)for(let x=Math.floor(t.minX);x<=Math.floor(t.maxX);x++)for(let z=Math.floor(t.minZ);z<=Math.floor(t.maxZ);z++){
  const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(t);
 }
 function heightAt(x,z,floor=0){
  let height=Infinity;
  for(const t of cells.get(Math.floor(x)+','+Math.floor(z))||[]){
   if(x<t.minX||x>t.maxX||z<t.minZ||z>t.maxZ)continue;
   const u=((t.bz-t.cz)*(x-t.cx)+(t.cx-t.bx)*(z-t.cz))/t.den;
   const v=((t.cz-t.az)*(x-t.cx)+(t.ax-t.cx)*(z-t.cz))/t.den;
   if(u<-.0001||v<-.0001||u+v>1.0001)continue;
   const y=u*t.ay+v*t.by+(1-u-v)*t.cy;
   if(y>floor+.8)height=Math.min(height,y);
  }
  return height;
 }
 return {heightAt,limit(x,z,floor=0,radius=.22){return Math.min(heightAt(x,z,floor),heightAt(x-radius,z,floor),heightAt(x+radius,z,floor),heightAt(x,z-radius,floor),heightAt(x,z+radius,floor))-radius;},count:triangles.length};
}
