import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';

/**
 * Cleaning things held in the right hand: a broom, a mop, a cloth, a glass being
 * polished. Built in the body's frame (forward is -z, as everyone faces), with the
 * grip at the origin; fitToolProp puts the grip in the hand every frame, so the pole
 * keeps its lean while the arms sweep (avatars/animate.js Sweep, Mop, Wipe, Polish).
 */
const cache=new Map();
// Forward of the feet (forward is -z): a positive turn about x tips the foot of the pole that way.
const LEAN=.5;
function coloured(g,hex){
 const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<a.length;i+=3)a.set(c.toArray(),i);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;
}
/** A pole from the grip down to the floor ahead of the feet. */
function pole(length,hex){
 const g=new THREE.CylinderGeometry(.013,.013,length,6).translate(0,-length/2,0);
 g.rotateX(LEAN);return coloured(g,hex);
}
function geometry(kind){
 if(cache.has(kind))return cache.get(kind);
 const lean=new THREE.Euler(LEAN,0,0),end=new THREE.Vector3(0,-.86,0).applyEuler(lean);
 let parts;
 if(kind==='broom')parts=[pole(.86,0xc8a46a),coloured(new THREE.ConeGeometry(.22,.36,10).scale(1,1,.4).translate(end.x,end.y+.13,end.z),0xd9b860),coloured(new THREE.CylinderGeometry(.045,.045,.05,8).translate(end.x,end.y+.31,end.z),0x8a2b20)];
 else if(kind==='mop')parts=[pole(.86,0x9aa0a6),coloured(new THREE.CylinderGeometry(.16,.22,.14,12).translate(end.x,end.y+.06,end.z),0xeae6dc)];
 else if(kind==='cloth')parts=[coloured(new THREE.BoxGeometry(.16,.02,.12).translate(0,-.04,-.04),0x5aa0c8)];
 else parts=[coloured(new THREE.CylinderGeometry(.035,.03,.09,10).translate(0,0,-.05),0xdfe9ee),coloured(new THREE.BoxGeometry(.12,.06,.02).translate(-.04,-.02,-.05),0xf4f0e6)];
 const merged=mergeGeometries(parts.map(g=>g.index?g.toNonIndexed():g));parts.forEach(g=>g.dispose());
 cache.set(kind,merged);return merged;
}
const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6});
export function createToolProp(kind){
 const mesh=new THREE.Mesh(geometry(kind),material);mesh.name='Cleaning '+kind;mesh.userData.tool=kind;mesh.userData.sharedAsset=true;
 // A pole is scaled so its foot meets the floor, however tall the one holding it.
 if(kind==='broom'||kind==='mop')mesh.userData.reach=.86*Math.cos(LEAN);
 return mesh;
}
/** Keeps the grip in the right hand and the tool square to the body. */
export function fitToolProp(avatar,prop){
 const hand=avatar.bones.handR;avatar.root.updateWorldMatrix(true,true);
 const q=avatar.root.getWorldQuaternion(new THREE.Quaternion()),p=hand.getWorldPosition(new THREE.Vector3());
 const reach=prop.userData.reach,floor=avatar.root.getWorldPosition(new THREE.Vector3()).y;
 const k=reach?THREE.MathUtils.clamp((p.y-floor)/reach,.3,1.4):1;
 const world=new THREE.Matrix4().compose(p,q,new THREE.Vector3(k,k,k));
 prop.matrixAutoUpdate=false;prop.matrix.copy(hand.matrixWorld).invert().multiply(world);prop.matrixWorldNeedsUpdate=true;
}
