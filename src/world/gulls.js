import * as THREE from '../../vendor/three.module.js';
import {pixelSprite} from '../render/pixel-sprite.js';
/**
 * The harbour's gulls (the owner, 27 November 2026: "Then make the seagull", in the shark's look, as Tama is). They are
 * umineko (ウミネコ, the black-tailed gull: "sea cat", for its mewing call), the gull of every Japanese harbour: white, a
 * slate-grey back and wings with black tips, a black band across the tail, a yellow bill with a red and black spot at its
 * tip. They circle over the east quay because the fish auction and the boats are there (the scraps; the storyteller's
 * "feeding a gull" on the pier, feed/places.js).
 *
 * Each is a small 3D bird drawn as a pixel sprite (render/pixel-sprite.js). It moves to the animation standard: it flaps
 * in bursts and glides between them (the wings ease from one to the other), the outer wing comes a beat after the inner
 * (overlap: the tip follows through), the body rises a little on each downstroke, and it banks into its turn.
 */
export const GULLS=Object.freeze({
 why:'Over the east quay: the fish auction and the boats are there, and with them the scraps.',
 count:4,centre:Object.freeze([9,-39]),radius:Object.freeze([22,10]),height:8,rise:1.3,speed:.035,
 flap:Object.freeze({hz:2.4,cycle:7,flapping:2.2,ease:.45,inner:.55,outer:.42,lag:.75,dihedral:.1}),
 layers:Object.freeze([26,27,28,29]),
});

const smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);

function buildGull(i){
 const root=new THREE.Group();root.name='Harbour gull (umineko)';root.userData.dynamicProp=true;
 const WHITE=new THREE.Color(0xf3f1ea),GREY=new THREE.Color(0x6c7884),BLACK=new THREE.Color(0x24222a),YELLOW=new THREE.Color(0xe8c43a),RED=new THREE.Color(0xc8402e);
 const paint=(g,at)=>{const p=g.attributes.position,c=new Float32Array(p.count*3),v=new THREE.Vector3();for(let k=0;k<p.count;k++){v.fromBufferAttribute(p,k);at(v).toArray(c,k*3);}g.setAttribute('color',new THREE.BufferAttribute(c,3));return g;};
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.9});material.name='Harbour gull';
 const mesh=(g,name)=>{const m=new THREE.Mesh(g,material);m.name=name;return m;};
 const body=new THREE.Group();root.add(body);
 body.add(mesh(paint(new THREE.SphereGeometry(1,16,12).scale(.075,.068,.2),v=>v.y>.035&&Math.abs(v.x)<.05&&v.z<.12?GREY:WHITE),'Gull body'));
 body.add(mesh(paint(new THREE.SphereGeometry(.058,14,10).translate(0,.045,.2),()=>WHITE),'Gull head'));
 // The bill: yellow, its tip red below and black above, as an umineko's is.
 body.add(mesh(paint(new THREE.ConeGeometry(.014,.07,8).rotateX(Math.PI/2).translate(0,.035,.285),v=>v.z>.3?(v.y<.035?RED:BLACK):YELLOW),'Gull bill'));
 for(const s of [-1,1]){const eye=mesh(paint(new THREE.SphereGeometry(.009,6,5),()=>BLACK),'Gull eye');eye.position.set(s*.04,.06,.235);body.add(eye);}
 // The tail: white, a black band across it.
 body.add(mesh(paint(new THREE.BoxGeometry(.13,.014,.11).translate(0,.005,-.23),v=>v.z<-.255?BLACK:WHITE),'Gull tail'));
 const wings=[];
 for(const s of [-1,1]){
  const inner=new THREE.Group();inner.position.set(s*.06,.03,.03);body.add(inner);
  inner.add(mesh(paint(new THREE.BoxGeometry(.3,.012,.14).translate(s*.15,0,0),()=>GREY),'Gull inner wing'));
  const outer=new THREE.Group();outer.position.set(s*.3,0,0);inner.add(outer);
  outer.add(mesh(paint(new THREE.BoxGeometry(.28,.01,.11).translate(s*.14,0,-.01),v=>Math.abs(v.x)>.17?BLACK:GREY),'Gull outer wing'));
  wings.push({side:s,inner,outer});
 }
 return {root,body,wings};
}

/** The gulls over the harbour. `update(time)` each frame (seconds). */
export function buildGulls(world){
 const F=GULLS.flap,birds=[];
 for(let i=0;i<GULLS.count;i++){const b=buildGull(i);world.group.add(b.root);
  const drawn=pixelSprite(b.root,{name:'Harbour gull, drawn',dots:56,span:1.4,fps:24,layer:GULLS.layers[i],centre:[0,0,0],forward:.6,far:120});
  world.group.add(drawn.card);birds.push({...b,drawn,phase:i*1.8});}
 const at=(t,phase)=>[GULLS.centre[0]+Math.cos(t)*GULLS.radius[0],GULLS.height+Math.sin(t*.7+phase)*GULLS.rise,GULLS.centre[1]+Math.sin(t)*GULLS.radius[1]];
 function update(time){
  for(const b of birds){
   const t=time*GULLS.speed+b.phase,[x,y,z]=at(t,b.phase),[x2,y2,z2]=at(t+.01,b.phase);
   b.root.position.set(x,y,z);
   // Along its way, the nose up a little as it climbs, banked into the turn (the circle's centre is to its left).
   const dx=x2-x,dz=z2-z,dy=y2-y,flat=Math.hypot(dx,dz);
   b.root.rotation.set(0,Math.atan2(dx,dz),0);b.body.rotation.set(-Math.atan2(dy,flat)*.8,0,-.32);
   // Flapping in bursts and gliding between them, eased from one to the other.
   const c=((time+b.phase*3.1)%F.cycle+F.cycle)%F.cycle,w=smooth(c/F.ease)*(1-smooth((c-F.flapping)/F.ease));
   const beat=(time+b.phase)*F.hz*Math.PI*2;
   b.body.position.y=w*.025*Math.sin(beat+Math.PI/2);
   for(const g of b.wings){
    g.inner.rotation.z=g.side*(F.dihedral+w*F.inner*Math.sin(beat));
    // the tip a beat behind the arm, and held a little up in the glide
    g.outer.rotation.z=g.side*(w*F.outer*Math.sin(beat-F.lag)+(1-w)*.06);
   }
  }
 }
 return {birds,update};
}
