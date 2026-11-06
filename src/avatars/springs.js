import {skirtSpec} from './skirt-shape.js';
import {POLICE_UNIFORM} from './police-data.js';
import * as THREE from '../../vendor/three.module.js';
import {longBraidPoints} from './braid-path.js';
import {DRESS_BOTTOMS} from './recipe.js';

/**
 * Swing: hair, skirts and shirt hems that follow the body a moment late, the way
 * KawaiiPhysics (pafuhana1213, MIT) does it for Unreal, ported to the Shimanchu.
 *
 * A soft part hangs from a short chain of extra bones. Every step each bone's end:
 *  - keeps going the way it was going (inertia), less a little (damping);
 *  - is drawn back toward where the animated pose puts it (stiffness);
 *  - is held at its own length from the bone's head;
 *  - may not swing further than a set angle from the pose;
 *  - is pushed out of a few spheres on the body (head, chest, thighs), so a braid lies
 *    on the shoulder and a hem never goes through a leg.
 * Then the bone is turned to point at its end. No physics engine, a few dozen lines a frame.
 *
 * The extra bones are always in the skeleton (their names are fixed); which of them a body
 * uses depends on its hair and clothes. Unused ones stay at rest and carry no skin.
 */
export const SPRING_BONES=Object.freeze(['hairA','hairB','braidL1','braidL2','braidR1','braidR2','skirtF','skirtB','skirtL','skirtR']);
export const SPRING_PARENT=Object.freeze({hairA:'head',hairB:'hairA',braidL1:'head',braidL2:'braidL1',braidR1:'head',braidR2:'braidR1',skirtF:'hips',skirtB:'hips',skirtL:'hips',skirtR:'hips'});

/** How each kind of part moves: per step at 60 Hz. Gentle and quick to settle: one signal, not a jiggle. */
export const SWING=Object.freeze({
 hair:Object.freeze({stiffness:.1,damping:.14,gravity:1.2,limit:40,radius:.025}),
 braid:Object.freeze({stiffness:.09,damping:.12,gravity:1.6,limit:50,radius:.03}),
 // (a bob's sides: short, so stiff, a little sway when she turns or walks, never flying out from her face)
 bob:Object.freeze({stiffness:.28,damping:.22,gravity:.5,limit:14,radius:.004}),
 skirt:Object.freeze({stiffness:.22,damping:.22,gravity:0,limit:20,radius:.02}),
 hem:Object.freeze({stiffness:.3,damping:.24,gravity:0,limit:14,radius:.015}),
 step:1/60,
});

/** The skirt or shirt hem: its waist, its hem's height and its radii there, or null. */
export function hemSpec(recipe,m){
 const o=recipe.outfit,hipY=m.hipY,waist=hipY+m.torso*(o.bottom==='underwear'?.05:.13);
 if(DRESS_BOTTOMS.includes(o.bottom)){
  return {kind:'skirt',...skirtSpec(m,o.bottom)};
 }
 if(o.top==='kariyushi'){
  // An island shirt is worn out over the shorts: its hem hangs a hand's width below the waist.
  const len=.1*m.k;return {kind:'hem',waist:waist+m.torso*.08,length:len+m.torso*.08,rx:m.hips*.56,rz:m.hips*.56*m.depth/m.width};
 }
 if(o.top==='police'){
  // The 1994 police jacket (police-data.js): from just above the waist to a little below the hip joint, over the duty belt.
  const top=waist+m.torso*.08,J=POLICE_UNIFORM.jacket.hem,r=m.hips*J.ease;
  return {kind:'hem',waist:top,length:top-(hipY-J.below*m.k),rx:r,rz:r*m.depth/m.width};
 }
 return null;
}

/** Where each swing bone stands at rest, its chain's end, and the chains this body uses. */
export function springRest(recipe,m){
 const R=m.Rh,cy=m.headCentre-m.headY,H=y=>m.headY+cy+y,style=recipe.hair.style;
 const rest={},chains=[];
 // Hair: a ponytail from its tie, long hair from the back of the head.
 const tail=style==='sweptponytail'?[[0,H(-R*.45),-R*1.02],[0,H(-R*.95),-R*1.19],[0,H(-R*1.48),-R*1.02]]
  :style==='ponytail'?[[0,H(R*.1),-R*1.12],[0,H(-R*.45),-R*1.18],[0,H(-R*1.02),-R*1.2]]
  :style==='longfringe'?[[0,H(-R*.1),-R*.65],[0,H(-R*(.9+recipe.hair.length*.3)),-R*.7],[0,H(-R*(1.7+recipe.hair.length*.8)),-R*.65]]
  :style==='long'?[[0,H(-R*.05),-R*.55],[0,H(-R*.7),-R*.58],[0,H(-R*1.38),-R*.55]]
  :[[0,H(0),-R*.5],[0,H(-R*.3),-R*.5],[0,H(-R*.6),-R*.5]];
 rest.hairA=tail[0];rest.hairB=tail[1];
 // (a body with a rigged hairstyle of its own swings that, not the cartoon recipe's)
 if(!m.ownHair&&(style==='ponytail'||style==='sweptponytail'||style==='long'||style==='longfringe'))chains.push({bones:['hairA','hairB'],tip:tail[2],...SWING.hair,kind:'hair'});
 // Braids: from behind each ear to the shoulders.
 for(const [s,side] of [[1,'L'],[-1,'R']]){
  const x=s*R*.85,own=m.braids?.[side];
  rest['braid'+side+'1']=own?own[0]:[x,H(-R*.3),-R*.35];rest['braid'+side+'2']=own?own[1]:[x,H(-R*1.05),-R*.2];
  // (own: a body's own braids, root, joint and end: a Pixar body's, pixar.js)
  if(style==='braids')chains.push({bones:['braid'+side+'1','braid'+side+'2'],tip:own?own[2]:[x,H(-R*1.98),-R*.05],...SWING.braid,kind:'braid'});
  // (a bob of its own, Pixar Thao's: its sides on the same two bones a side)
  else if(own&&m.ownHair==='bob')chains.push({bones:['braid'+side+'1','braid'+side+'2'],tip:own[2],...SWING.bob,kind:'bob'});
  if(style==='longbraids'){
   const points=longBraidPoints(m,s,recipe.hair);rest['braid'+side+'1']=points[0];rest['braid'+side+'2']=points[1];
   chains.push({bones:['braid'+side+'1','braid'+side+'2'],tip:points[2],...SWING.braid,kind:'braid'});
  }
 }
 // Skirts and hems: four quarters round a pivot at the waist, each swinging its own side.
 const hem=hemSpec(recipe,m),waist=hem?.waist??m.hipY+m.torso*.13;
 // The chain's end is put a little further out than the cloth, so it swings in angles, not centimetres.
 const reach=Math.max(hem?.length??.2,.24*m.k);
 const ends={skirtF:[0,waist-reach,(hem?.rz??m.depth*.4)],skirtB:[0,waist-reach,-(hem?.rz??m.depth*.4)],skirtL:[(hem?.rx??m.hips*.5),waist-reach,0],skirtR:[-(hem?.rx??m.hips*.5),waist-reach,0]};
 for(const name of ['skirtF','skirtB','skirtL','skirtR']){
  rest[name]=[0,waist,0];
  if(hem)chains.push({bones:[name],tip:ends[name],...(hem.kind==='skirt'?SWING.skirt:SWING.hem),kind:hem.kind});
 }
 return {rest,chains,hem};
}

/**
 * Skin weights for something hanging along a chain from its root bone: the top stays
 * with the root, then it passes to each bone in turn over a soft band.
 * `points` are the chain's rest positions top to bottom (heads, then the end).
 */
export function chainShare(root,bones,points){
 const A=new THREE.Vector3(...points[0]),B=new THREE.Vector3(...points.at(-1)),d=B.clone().sub(A),len2=d.lengthSq()||1;
 const joints=points.slice(1,-1).map(p=>new THREE.Vector3(...p).sub(A).dot(d)/len2);
 const rel=new THREE.Vector3();
 return p=>{
  const t=rel.copy(p).sub(A).dot(d)/len2,s0=THREE.MathUtils.smoothstep(t,-.05,.18);
  const out=[[root,1-s0]];let left=s0;
  bones.forEach((b,i)=>{const next=i<joints.length?THREE.MathUtils.smoothstep(t,joints[i]-.1,joints[i]+.1):0;out.push([b,left*(1-next)]);left*=next;});
  return out;
 };
}

/** Skin weights for a skirt or hem: the waist stays with the hips, the hem goes with its quarter. */
export function quarterShare(hem,base){
 return p=>{
  const a=Math.atan2(p.x/hem.rx,p.z/hem.rz),down=THREE.MathUtils.smoothstep(hem.waist-p.y,0,hem.length*.7);
  // F at a=0 (+z), L at +pi/2 (+x), B at pi, R at -pi/2: each point between its two nearest.
  const q=[['skirtF',Math.max(0,Math.cos(a))],['skirtL',Math.max(0,Math.sin(a))],['skirtB',Math.max(0,-Math.cos(a))],['skirtR',Math.max(0,-Math.sin(a))]];
  const sum=q.reduce((t,[,w])=>t+w,0)||1;
  const under=base(p);// what the cloth would follow without swing (hips, and thighs low down)
  const out=[];
  for(const [name,w] of under){if(name==='hips'){out.push(['hips',w*(1-down)]);for(const [qn,qw] of q)out.push([qn,w*down*qw/sum]);}else out.push([name,w]);}
  return out;
 };
}

// ---- The simulation. ----
const v1=new THREE.Vector3(),v2=new THREE.Vector3(),v3=new THREE.Vector3(),qa=new THREE.Quaternion(),qb=new THREE.Quaternion();
/**
 * @param avatar from buildAvatar: bones, measure and springRest's chains.
 * @returns {update(dt), reset(), active}
 */
export function createSprings(avatar){
 const {bones,measure:m}=avatar,setup=avatar.springSetup;
 const links=[];
 for(const chain of setup.chains){
  const points=[...chain.bones.map(n=>setup.rest[n]),chain.tip];
  chain.bones.forEach((name,i)=>{
   const a=points[i],b=points[i+1];
   links.push({bone:bones[name],chain,end:new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),len:Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),
    p:new THREE.Vector3(),q:new THREE.Vector3(),ready:false});
  });
 }
 // The body's collision spheres, as [bone, offset in that bone, radius].
 const spheres=[
  [bones.head,new THREE.Vector3(0,m.headCentre-m.headY,0),m.Rh*Math.max(m.headSX,1)*.98],
  [bones.chest,new THREE.Vector3(0,m.torso*.2,0),m.width*.42],
  [bones.neck,new THREE.Vector3(0,0,0),m.width*.3],
  [bones.thighL,new THREE.Vector3(0,-m.thigh*.55,0),m.legR*1.15],
  [bones.thighR,new THREE.Vector3(0,-m.thigh*.55,0),m.legR*1.15],
  [bones.kneeL,new THREE.Vector3(0,-m.shin*.4,0),m.legR*1.05],
  [bones.kneeR,new THREE.Vector3(0,-m.shin*.4,0),m.legR*1.05],
 ].map(([bone,offset,radius])=>({bone,offset,radius,at:new THREE.Vector3()}));
 const head=new THREE.Vector3(),target=new THREE.Vector3(),down=new THREE.Vector3(0,-1,0);
 let carry=0,lastRoot=null;
 const scale=new THREE.Vector3();
 function step(h){
  for(const s of spheres)s.at.copy(s.offset).applyMatrix4(s.bone.matrixWorld);
  for(const l of links){
   const b=l.bone;
   // Where the pose alone would put this bone's end.
   b.quaternion.identity();b.updateMatrixWorld(true);
   b.getWorldPosition(head);target.copy(l.end).applyMatrix4(b.matrixWorld);
   b.matrixWorld.decompose(v3,qa,scale);const len=l.len*scale.x;
   if(!l.ready){l.p.copy(target);l.q.copy(target);l.ready=true;}
   const c=l.chain;
   // Inertia, less damping; gravity; drawn back toward the pose.
   v1.subVectors(l.p,l.q).multiplyScalar(1-c.damping);l.q.copy(l.p);
   l.p.add(v1).addScaledVector(down,c.gravity*h*h);
   l.p.lerp(target,c.stiffness);
   // Out of the body.
   for(const s of spheres){v2.subVectors(l.p,s.at);const d=v2.length(),r=s.radius*scale.x+c.radius*scale.x;if(d<r&&d>1e-6)l.p.copy(s.at).addScaledVector(v2,r/d);}
   // Its own length, and no further from the pose than the limit.
   v1.subVectors(l.p,head).normalize();v2.subVectors(target,head).normalize();
   const angle=v1.angleTo(v2),limit=c.limit*Math.PI/180;
   if(angle>limit){qb.setFromUnitVectors(v2,v1);qa.identity().slerp(qb,limit/angle);v1.copy(v2).applyQuaternion(qa);}
   l.p.copy(head).addScaledVector(v1,len);
   // Turn the bone to point at it: the world turn from pose to end, in the parent's frame.
   qb.setFromUnitVectors(v2,v1);
   b.parent.getWorldQuaternion(qa);
   b.quaternion.copy(qa).invert().multiply(qb).multiply(qa);
   b.updateMatrixWorld(true);
  }
 }
 const api={
  get active(){return links.length>0;},
  links,
  /** Back to the pose, as if it had always stood still (after a teleport or a long sleep). */
  reset(){for(const l of links){l.ready=false;l.bone.quaternion.identity();}carry=0;lastRoot=null;},
  update(dt){
   if(!links.length)return;
   avatar.root.updateWorldMatrix(true,true);
   // A body that jumped across the town starts again from rest rather than whipping after it.
   avatar.root.getWorldPosition(v3);
   if(lastRoot&&v3.distanceTo(lastRoot)>1.5)for(const l of links)l.ready=false;
   (lastRoot??=new THREE.Vector3()).copy(v3);
   carry=Math.min(carry+Math.min(dt,.25),SWING.step*4);
   while(carry>=SWING.step){step(SWING.step);carry-=SWING.step;}
  },
 };
 return api;
}

/**
 * Who swings: only bodies near the camera are worth the work. Johansson and Thuan always
 * swing, wherever they are; everyone else within this distance of the camera.
 */
export const SWING_RADIUS=18;
const focus=new THREE.Vector3(),seen={set:false};
export function setSwingFocus(point){if(!point)return;focus.copy(point);seen.set=true;}
export function swingsAt(position,always=false){return always||!seen.set||position.distanceToSquared(focus)<SWING_RADIUS*SWING_RADIUS;}
