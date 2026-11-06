// Exact broad phases for the installed edition: discard impossible candidates,
// then run the original geometry checks. No scenery or collision is simplified.
export function indexedPaving(patches,cell=8){
 const buckets=new Map(),key=(x,z)=>Math.floor(x/cell)+':'+Math.floor(z/cell);
 for(const p of patches)for(let x=Math.floor((p.x0-.01)/cell);x<=Math.floor((p.x1+.01)/cell);x++)for(let z=Math.floor((p.z0-.01)/cell);z<=Math.floor((p.z1+.01)/cell);z++){const k=x+':'+z,list=buckets.get(k)||[];list.push(p);buckets.set(k,list);}
 return (x,z)=>(buckets.get(key(x,z))||[]).some(p=>x>=p.x0-.01&&x<=p.x1+.01&&z>=p.z0-.01&&z<=p.z1+.01);
}
export function rayCandidates(meshes,THREE){
 const entries=meshes.map(mesh=>{if(mesh.isSkinnedMesh||mesh.isInstancedMesh)return {mesh,box:null};mesh.geometry.computeBoundingBox();return {mesh,box:mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld).expandByScalar(.001)};}),hit=new THREE.Vector3();
 return raycaster=>entries.filter(({box})=>!box||box.containsPoint(raycaster.ray.origin)||(raycaster.ray.intersectBox(box,hit)&&raycaster.ray.origin.distanceTo(hit)<=raycaster.far+.001)).map(({mesh})=>mesh);
}
