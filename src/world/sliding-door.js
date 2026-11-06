import * as THREE from '../../vendor/three.module.js';

/**
 * The town's automatic sliding door: one model for every shop that has one (Sakura's, from the street and
 * from inside; the films use the same numbers). Two glass leaves in light-grey aluminium frames part from
 * the middle when somebody comes within reach of the mat, the way a real one does: they get going, glide,
 * and settle open (about 0.8 s), stay open while anyone is near and a moment after (1.6 s), then slide shut
 * more slowly (about 1.4 s) and reverse at once if somebody comes back. No snap, no jump, no bounce: the
 * motion is a critically damped spring towards open or shut, so it is smooth from any point, even when it
 * changes its mind halfway.
 */
export const SLIDING_DOOR=Object.freeze({
 frame:0x879692,bar:0x465854,
 reach:2.6,      // metres from the mat at which the sensor sees somebody
 hold:1.6,       // seconds it stays open after the last person has gone
 open:6.5,       // spring rate opening (about 0.8 s to open)
 close:3.6,      // spring rate closing (about 1.4 s to shut)
});

/** A door's motion state: how open (0..1), how fast, and how long it will hold. */
export const doorState=()=>({amount:0,speed:0,hold:0});

/**
 * One step of the door (pure; the game and the films both use it). near: is anybody within reach of the mat.
 * rest: where it settles when nobody is near (0, shut, for an automatic door; a hand-slid door can be left
 * standing a little open, like Umi-no-yu's street door in opening hours). Long steps are split so it moves
 * the same at any frame rate.
 */
export function stepDoor(state,dt,near,rest=0){
 if(!(dt>0))return state;
 for(let left=dt;left>1e-6;){
  const h=Math.min(left,1/60);left-=h;
  if(near)state.hold=SLIDING_DOOR.hold;else state.hold=Math.max(0,state.hold-h);
  const target=near||state.hold>0?1:rest,w=target>state.amount?SLIDING_DOOR.open:SLIDING_DOOR.close;
  state.speed+=(w*w*(target-state.amount)-2*w*state.speed)*h;
  state.amount+=state.speed*h;
  if(state.amount<0){state.amount=0;state.speed=0;}
  if(state.amount>1){state.amount=1;state.speed=0;}
 }
 return state;
}

/**
 * The two leaves, centred at (x, 0, z) in `parent`, sliding along its local x: each leaf is half the opening
 * and parks clear of it. Returns the leaves and place(amount) to set them.
 * @param {{parent:THREE.Object3D,x?:number,z?:number,width:number,height:number,glazing:THREE.Material,travel?:number,offset?:number,name?:string,shadows?:boolean}} o
 *   travel: how far each leaf slides (default: half the width less a hand's breadth); offset: the leaves'
 *   stagger in depth so they pass each other.
 */
export function buildSlidingLeaves({parent,x=0,z=0,width,height,glazing,travel=width/2-.12,offset=0,name='Sliding door leaf',shadows=true}){
 const frame=new THREE.MeshStandardMaterial({color:SLIDING_DOOR.frame,roughness:.5}),bar=new THREE.MeshStandardMaterial({color:SLIDING_DOOR.bar,roughness:.6});
 const leaves=[];
 for(const side of [-1,1]){
  const leaf=new THREE.Group(),w=width/2;leaf.name=name;leaf.userData.dynamicProp=true;leaf.position.set(x+side*width/4,0,z+side*offset);parent.add(leaf);
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(w-.06,height-.28),glazing);
  pane.position.y=height/2-.06;pane.name=name+' pane';pane.userData.clearWindow=true;pane.renderOrder=3;leaf.add(pane);
  // The frame in four pieces, so the leaf reads as a leaf edge-on as well as flat.
  for(const [sw,sh,px,py] of [[.06,height,-(w/2-.03),height/2],[.06,height,w/2-.03,height/2],[w,.08,0,.04],[w,.08,0,height-.04]]){
   const m=new THREE.Mesh(new THREE.BoxGeometry(sw,sh,.07),frame);m.position.set(px,py,0);m.castShadow=shadows;leaf.add(m);}
  // The pull bar, on the edge that meets the other leaf.
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.035,.62,.035),bar);handle.position.set(-side*(w/2-.16),1.06,.06);leaf.add(handle);
  leaves.push({leaf,side,home:leaf.position.x});
 }
 return {leaves,place(amount){for(const {leaf,side,home} of leaves)leaf.position.x=home+side*travel*amount;}};
}
