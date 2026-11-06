import * as THREE from '../../vendor/three.module.js';
import {BOARDWALK} from './layout.js?snappy=1';

/**
 * The paint and ironwork on Main Street's carriageway, from the shopping arcade down to the quay: solid white edge lines
 * a hand's width in from the kerb, the gutters against the kerbs, and round cast-iron manhole covers down the crown.
 *
 * The carriageway itself is the ground's (ground-build.js, from ground-plan.js): it lies a kerb under the footways and is
 * graded back up to the quay over its last two metres, so every mark here is laid on it a metre at a time at its height
 * there (`heightAt`). The name and the returned shape (joints, edges, setRain) are kept for the dining street and the
 * tests. Everything here is painted, not photographed (docs/AMPLIFY-AUDIT.md, §4).
 */
export function buildBoardwalk(parent,{heightAt=()=>.04}={}){
 const length=BOARDWALK.maxZ-BOARDWALK.minZ;
 // Paint and iron lie in the road's own plane, so they win the depth test on a polygon
 // offset rather than on height: two millimetres of daylight flickers on a phone.
 const decal=()=>({depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const dummy=new THREE.Object3D();
 /** A metre-long piece at its height and slope on the road. */
 const lay=(x,z0,z1,w,h)=>{const y0=heightAt(x,z0),y1=heightAt(x,z1);dummy.position.set(x,(y0+y1)/2,(z0+z1)/2);dummy.rotation.set(Math.atan2(y0-y1,z1-z0),0,0);dummy.scale.set(w,h,z1-z0+.02);dummy.updateMatrix();return dummy.matrix.clone();};
 const pieces=[];for(let z=BOARDWALK.minZ;z<BOARDWALK.maxZ-1e-6;z+=1)pieces.push([z,Math.min(BOARDWALK.maxZ,z+1)]);
 // White edge lines, solid, each side: an edge line (外側線) is continuous.
 const paint=new THREE.MeshStandardMaterial({color:0xf2efe6,roughness:.8,...decal()});
 const joints=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),paint,pieces.length*2);
 joints.name='main-street-edge-lines';joints.receiveShadow=true;joints.renderOrder=1;
 let n=0;for(const side of [-1,1])for(const [z0,z1] of pieces)joints.setMatrixAt(n++,lay(BOARDWALK.x+side*(BOARDWALK.width/2-.3),z0,z1,.15,.003));
 joints.instanceMatrix.needsUpdate=true;joints.computeBoundingSphere();parent.add(joints);
 // Gutters: a darker concrete strip against each kerb.
 const edgeMaterial=new THREE.MeshStandardMaterial({color:0x8d918f,roughness:.95,...decal()});
 const edges=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),edgeMaterial,pieces.length*2);edges.name='main-street-gutters';edges.renderOrder=1;
 n=0;for(const side of [-1,1])for(const [z0,z1] of pieces)edges.setMatrixAt(n++,lay(BOARDWALK.x+side*(BOARDWALK.width/2-.11),z0,z1,.22,.003));
 edges.instanceMatrix.needsUpdate=true;edges.computeBoundingSphere();edges.receiveShadow=true;parent.add(edges);
 // Manhole covers down the crown, every twelve metres or so.
 const iron=new THREE.MeshStandardMaterial({color:0x5d6265,roughness:.7,...decal()});
 const covers=Math.floor(length/12),manholes=new THREE.InstancedMesh(new THREE.CylinderGeometry(.32,.32,.004,20),iron,covers);
 manholes.name='main-street-manholes';manholes.renderOrder=1;manholes.receiveShadow=true;
 for(let i=0;i<covers;i++){const x=BOARDWALK.x+(i%2?.6:-.4),z=BOARDWALK.minZ+6+i*12;dummy.position.set(x,heightAt(x,z),z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();manholes.setMatrixAt(i,dummy.matrix);}
 manholes.instanceMatrix.needsUpdate=true;manholes.computeBoundingSphere();parent.add(manholes);
 return {joints,edges,setRain(){}};
}
