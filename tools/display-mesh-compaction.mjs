/** compactMesh returns entries only through the last referenced source vertex. */
export function compactDisplayAttribute(array,width,remap,unique){
 const result=new Float32Array(unique*width);
 for(let i=0;i<remap.length;i++){
  const target=remap[i];
  if(target!==0xffffffff&&target<unique)result.set(array.subarray(i*width,i*width+width),target*width);
 }
 return result;
}
