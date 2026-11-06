/**
 * A built model in the shape the asset checks read (checks.js runChecks): {group, pieces, parts, anchors, stats}, the
 * shape the desktop Studio's kit (modeller/kit.js finish) and its GLB reader (modeller/build.js buildGlb) make. Here it
 * is made from any three.js object: a catalogue model, a prop World builds in code (prop-registry.js) or a maker's
 * model (makers/lathe.js). Each mesh is a piece, its geometry in the object's own frame (metres, y up, floor y = 0,
 * front +z). Sprites (a lantern's halo), lines and hidden meshes are not pieces: they are light, not shape.
 *
 * A group whose userData has `part` is a named part: its role (rules.json roles) and whether it is `loose` (a cord on
 * the floor beside the asset) come from its userData, as the kit writes them.
 */
export function madeFromObject(THREE,object,{anchors={}}={}){
 object.updateMatrixWorld(true);
 const inverse=new THREE.Matrix4().copy(object.matrixWorld).invert(),pieces=[],materials=new Set(),parts=new Map();
 let triangles=0,meshes=0;
 object.traverse(o=>{
  if(o.userData?.part&&!parts.has(o.userData.part))parts.set(o.userData.part,{name:o.userData.part,role:o.userData.role||'',loose:!!o.userData.loose,note:o.userData.note||''});
  if(!o.isMesh||!visible(o,object))return;
  meshes++;
  for(const m of [].concat(o.material))if(m)materials.add(m);
  const g=new THREE.BufferGeometry();g.setAttribute('position',o.geometry.attributes.position.clone());
  if(o.geometry.index)g.setIndex(o.geometry.index.clone());
  g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));g.computeBoundingBox();
  const t=Math.round((g.index?g.index.count:g.attributes.position.count)/3);triangles+=t;
  let loose=false,part='';for(let p=o;p&&p!==object.parent;p=p.parent){if(p.userData?.loose)loose=true;if(!part&&p.userData?.part)part=p.userData.part;}
  pieces.push({name:o.name||o.parent?.name||'mesh',part,finish:'glb',geometry:g,box:g.boundingBox.clone(),triangles:t,loose});
 });
 return {group:object,pieces,anchors:{...anchors},parts:[...parts.values()],
  stats:{triangles,materials:materials.size,meshes,pieces:pieces.length}};
}

/** Drawn: it and every parent up to the root are visible. */
function visible(o,root){for(let p=o;p;p=p.parent){if(!p.visible)return false;if(p===root)break;}return true;}

/** Frees the copies madeFromObject made (not the object's own geometry). */
export function disposeMade(made){for(const p of made?.pieces||[])p.geometry.dispose();}

/**
 * Puts an object's lowest point on the floor (y = 0) and its footprint's middle on x = z = 0, by moving the object
 * itself: World's props are built with their origin where their own code needs it (a hanging lantern at the top of its
 * cord, a basket at its rim). Returns the shift, so the place it hangs from can be named (an anchor).
 */
export function standOnFloor(THREE,object,{centre=true}={}){
 object.updateMatrixWorld(true);
 const box=boxOfMeshes(THREE,object);if(box.isEmpty())return [0,0,0];
 const shift=[centre?-(box.min.x+box.max.x)/2:0,-box.min.y,centre?-(box.min.z+box.max.z)/2:0].map(v=>Math.abs(v)<1e-9?0:v);
 object.position.x+=shift[0];object.position.y+=shift[1];object.position.z+=shift[2];object.updateMatrixWorld(true);
 return shift;
}

/** The box round an object's visible meshes (not its sprites or lights), in its parent's frame. */
export function boxOfMeshes(THREE,object){
 object.updateMatrixWorld(true);
 const box=new THREE.Box3(),parentInverse=object.parent?new THREE.Matrix4().copy(object.parent.matrixWorld).invert():new THREE.Matrix4(),v=new THREE.Vector3();
 object.traverse(o=>{
  if(!o.isMesh||!visible(o,object))return;
  const pos=o.geometry.attributes.position,m=new THREE.Matrix4().multiplyMatrices(parentInverse,o.matrixWorld);
  for(let i=0;i<pos.count;i++)box.expandByPoint(v.fromBufferAttribute(pos,i).applyMatrix4(m));
 });
 return box;
}
