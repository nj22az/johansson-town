/** Three.js compile() traverses hidden meshes too. Warm only drawable subtrees;
 * unused outfits and closed interiors compile naturally if they later appear.
 * compileAsync() gathers its materials synchronously before polling the driver. */
export function withVisibleMaterials(object,compile){
 const own=Object.hasOwn(object,'traverse'),previous=object.traverse;
 object.traverse=object.traverseVisible;
 try{return compile();}
 finally{if(own)object.traverse=previous;else delete object.traverse;}
}
