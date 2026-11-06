import * as THREE from '../../vendor/three.module.js';

/**
 * A painted sign plate with a proper back: the lettered face on its front (+z before it is turned), plain painted metal
 * on the back and round its edges. The owner, 20 October 2026, of the guide sign at the Kitano Road junction: its text
 * read mirrored from behind, because it was one plane drawn on both sides. A street sign is a pressed steel plate; from
 * behind you see the plate's grey back, never its words reversed. (Cloth hung both ways, a noren or a flag, is another
 * matter: dyed through, it does read reversed from behind.)
 */
export const SIGN_PLATE=Object.freeze({depth:.03,back:0x8d9497,edge:0x7d8487});

const backs=new Map();
const metal=hex=>{if(!backs.has(hex))backs.set(hex,new THREE.MeshStandardMaterial({color:hex,roughness:.6,metalness:.25}));return backs.get(hex);};

/** `face` is the lettered material (its map the sign); returns the mesh, its front looking along local +z. */
export function signPlate(face,w,h,{depth=SIGN_PLATE.depth,back=SIGN_PLATE.back,edge=SIGN_PLATE.edge,name='Sign'}={}){
 const e=metal(edge),b=metal(back);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),[e,e,e,e,face,b]);
 mesh.name=name;mesh.userData.signPlate=true;
 return mesh;
}
