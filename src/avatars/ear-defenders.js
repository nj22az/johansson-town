import * as THREE from '../../vendor/three.module.js';
import {celFrom} from '../render/cel.js';
/**
 * Ear defenders (the creator, 2026-10-12: "he should take on ear protectors automatically when he goes down or anyone
 * goes down"): a black band over the head and two yellow cups over the ears, built to the body's head measurements
 * (build.js measure) and hung on the head bone, where the head's centre is at y = headCentre - headY.
 */
export const EAR_DEFENDERS_NAME='Ear defenders';
let cupMat=null,bandMat=null;
const mats=()=>{cupMat??=celFrom(new THREE.MeshStandardMaterial({color:0xe0b93a,roughness:.5}));bandMat??=celFrom(new THREE.MeshStandardMaterial({color:0x1f2224,roughness:.6}));return [cupMat,bandMat];};
export function createEarDefenders(m){
 const [cup,band]=mats(),g=new THREE.Group();g.name=EAR_DEFENDERS_NAME;g.userData.earDefenders=true;
 const R=m.Rh,cy=m.headCentre-m.headY,rx=m.headSX*R,ry=m.headSY*R,k=m.k;
 for(const s of [-1,1]){
  const c=new THREE.Mesh(new THREE.CylinderGeometry(R*.34,R*.3,.04*k,16),cup);c.rotation.z=Math.PI/2;c.position.set(s*(rx+.018*k),cy-ry*.08,0);c.name='Ear defender cup';g.add(c);
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(R*.3,R*.3,.012*k,16),band);pad.rotation.z=Math.PI/2;pad.position.set(s*(rx-.004*k),cy-ry*.08,0);g.add(pad);
 }
 // The band: a half ring from cup to cup over the crown, stretched to the head's width and height.
 // The band clears the crown and the hair: its ends sit on the cups, its top a hand's width over the head (the
 // creator, 2026-10-12: "cover his bald head, not clip into the head"), and it leans a little aft like a worn pair.
 const arc=new THREE.Mesh(new THREE.TorusGeometry(1,.018*k,8,28,Math.PI),band);arc.scale.set(rx+.018*k,ry*1.3,1);arc.position.set(0,cy-ry*.08,-.02*k);arc.rotation.x=-.12;arc.name='Ear defender band';g.add(arc);
 // Two short stems from the band down into each cup, so the band does not float off them.
 for(const s of [-1,1]){const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012*k,.012*k,ry*.3,8),band);stem.position.set(s*(rx+.018*k),cy-ry*.08+ry*.15,-.02*k);stem.name='Ear defender stem';g.add(stem);}
 g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;}});
 return g;
}
/** Puts the defenders on a body (or takes them off with null); the body's head bone keeps one pair at most. */
export function wearEarDefenders(avatar,on){
 const head=avatar?.bones?.head;if(!head)return null;
 const worn=head.children.find(o=>o.userData?.earDefenders)||null;
 if(!on){worn?.removeFromParent();return null;}
 if(worn)return worn;
 const g=createEarDefenders(avatar.measure);head.add(g);return g;
}
