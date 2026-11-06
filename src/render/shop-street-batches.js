import * as THREE from '../../vendor/three.module.js';

// A city exported as one large mesh cannot be culled building by building.
// Share its existing vertex/texture buffers, but submit only indices belonging
// to spatial cells that intersect the window view. Never modify the street mesh.
export function createWindowBatch(mesh,{cellSize=8,minIndices=3000}={}){
 const source=mesh.geometry,position=source?.attributes.position,index=source?.index;
 if(!mesh.isMesh||mesh.isSkinnedMesh||mesh.isInstancedMesh||Array.isArray(mesh.material)||source.groups.length>1||!position)return null;
 const count=index?.count??position.count;
 if(count<minIndices)return null;
 const cells=new Map(),points=[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()];
 const start=source.drawRange.start,end=Math.min(count,start+source.drawRange.count),triangles=Math.floor((end-start)/3);
 // One integer per triangle, rather than millions of boxed indices in growable
 // arrays. Two packed index buffers are the only retained copies; vertices and
 // textures still belong to the source mesh.
 const cellIds=new Uint32Array(triangles);
 for(let t=0;t<triangles;t++){
  const i=start+t*3;
  for(let j=0;j<3;j++)points[j].fromBufferAttribute(position,index?index.getX(i+j):i+j).applyMatrix4(mesh.matrixWorld);
  const x=(points[0].x+points[1].x+points[2].x)/3,z=(points[0].z+points[1].z+points[2].z)/3;
  const key=Math.floor(x/cellSize)+','+Math.floor(z/cellSize);
  if(!cells.has(key))cells.set(key,{id:cells.size,count:0,bounds:new THREE.Box3()});
  const cell=cells.get(key);cellIds[t]=cell.id;cell.count+=3;
  for(const p of points)cell.bounds.expandByPoint(p);
 }
 if(cells.size<2)return null;
 const partitions=[...cells.values()];let offset=0;
 for(const cell of partitions){cell.start=offset;cell.next=offset;offset+=cell.count;}
 const Index=position.count<=65535?Uint16Array:Uint32Array,packed=new Index(triangles*3),output=new Index(triangles*3);
 for(let t=0;t<triangles;t++){
  const cell=partitions[cellIds[t]],i=start+t*3;
  for(let j=0;j<3;j++)packed[cell.next++]=index?index.getX(i+j):i+j;
 }
 const geometry=new THREE.BufferGeometry();
 for(const [name,attribute] of Object.entries(source.attributes))geometry.setAttribute(name,attribute);
 geometry.boundingBox=source.boundingBox;geometry.boundingSphere=source.boundingSphere;
 const attribute=new THREE.BufferAttribute(output,1).setUsage(THREE.DynamicDrawUsage);geometry.setIndex(attribute);
 let signature='',visibleCount=0,disposed=false;
 return {source,geometry,totalTriangles:triangles,bytes:packed.byteLength+output.byteLength,get triangles(){return visibleCount/3;},select(intersects){
  const selected=partitions.filter(cell=>intersects(cell.bounds)),key=selected.map(cell=>cell.id).join(',');
  if(key!==signature||!geometry.userData.ready){
   signature=key;visibleCount=0;
   for(const cell of selected){output.set(packed.subarray(cell.start,cell.start+cell.count),visibleCount);visibleCount+=cell.count;}
   attribute.clearUpdateRanges();if(visibleCount)attribute.addUpdateRange(0,visibleCount);attribute.needsUpdate=true;
   geometry.setDrawRange(0,visibleCount);geometry.userData.ready=true;
  }
  return visibleCount>0;
 },dispose(){
  if(disposed)return;disposed=true;
  // Three disposes every attribute attached to a geometry. These are borrowed
  // vertex buffers: detach them before releasing only our private index buffer.
  for(const name of Object.keys(geometry.attributes))geometry.deleteAttribute(name);
  geometry.dispose();
 }};
}
