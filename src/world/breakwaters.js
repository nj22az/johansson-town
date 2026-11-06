import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {SEA_LEVEL} from './ocean.js';

/**
 * Tetrapods: the four-legged concrete blocks piled along every Okinawan seawall and in
 * banks offshore to break the waves before they reach the beach.
 *
 * - A bank along the foot of the Nishi-machi seawall, two rows deep and half drowned, so
 *   the waves break into spray against them rather than on the wall.
 * - Two detached breakwaters off the east beach, low mounds of them parallel to the shore,
 *   with calmer water inside where the beach corner looks out.
 *
 * One instanced mesh for all of them: each block is the same casting, turned and settled
 * a little differently.
 */
export const BREAKWATERS=Object.freeze({
 west:Object.freeze({x0:-40.35,x1:-41.6,minZ:-38,maxZ:29}),
 // The gap between them is where Kitano Bridge crosses (kitano-link-plan.js), with room either side.
 offshore:Object.freeze([Object.freeze({x:54.5,minZ:-26,maxZ:-10.5}),Object.freeze({x:54.5,minZ:3.5,maxZ:19})]),
});

/** One tetrapod, about 1.9 m across: a core and four tapered legs along a tetrahedron. */
export function tetrapodGeometry(){
 const parts=[new THREE.IcosahedronGeometry(.36,1)];
 for(const d of [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]]){
  const dir=new THREE.Vector3(...d).normalize();
  const leg=new THREE.CylinderGeometry(.17,.3,1,10);leg.translate(0,.5,0);
  leg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir));
  parts.push(leg.index?leg.toNonIndexed():leg);
 }
 const g=mergeGeometries(parts.map(p=>{const q=p.index?p.toNonIndexed():p;for(const k of Object.keys(q.attributes))if(k!=='position'&&k!=='normal')q.deleteAttribute(k);return q;}),false);
 g.computeVertexNormals();return g;
}

/** Where every block goes: [x, y, z, yaw, tilt, scale]. Deterministic. */
export function breakwaterPlacements(){
 let seed=97;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const out=[],B=BREAKWATERS;
 // Along the seawall's foot: two staggered rows, the inner one a little higher.
 for(let z=B.west.minZ;z<=B.west.maxZ;z+=1.15)for(const [i,x] of [[0,B.west.x0],[1,B.west.x1]])
  out.push([x+(rnd()-.5)*.25,SEA_LEVEL+(i?.02:.32)+rnd()*.12,z+(i?.55:0)+(rnd()-.5)*.2,rnd()*6.28,(rnd()-.5)*.9,.9+rnd()*.2]);
 // Offshore: three rows and a crest, low enough that the swell washes over the top.
 for(const b of B.offshore)for(let z=b.minZ;z<=b.maxZ;z+=1.2){
  for(const [dx,dy] of [[-1.05,-.35],[0,-.25],[1.05,-.35]])out.push([b.x+dx+(rnd()-.5)*.3,SEA_LEVEL+dy+rnd()*.1,z+(rnd()-.5)*.3,rnd()*6.28,(rnd()-.5)*.9,.95+rnd()*.2]);
  if(rnd()>.25)out.push([b.x+(rnd()-.5)*.6,SEA_LEVEL+.35+rnd()*.1,z+.6,rnd()*6.28,(rnd()-.5)*.9,.9+rnd()*.15]);
 }
 return out;
}

export function buildBreakwaters({parent,shadows=false}){
 const list=breakwaterPlacements(),geometry=tetrapodGeometry();
 const material=new THREE.MeshStandardMaterial({color:0xbab6ab,roughness:.95});
 const mesh=new THREE.InstancedMesh(geometry,material,list.length);mesh.name='Tetrapod breakwaters';
 const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),p=new THREE.Vector3(),s=new THREE.Vector3();
 list.forEach(([x,y,z,yaw,tilt,k],i)=>{e.set(tilt,yaw,tilt*.6);q.setFromEuler(e);mesh.setMatrixAt(i,m.compose(p.set(x,y,z),q,s.set(k,k,k)));});
 mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.userData.walkSurface=false;
 parent.add(mesh);
 return {mesh,count:list.length};
}
