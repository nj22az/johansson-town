import * as THREE from '../vendor/three.module.js';
import {bodyVolume} from '../src/avatars/build.js';

/**
 * Contact between people's bodies, for poses where they touch or come close (a carry, a hug): the drawn surface of a body as
 * it is posed (every visible skinned mesh but the ink outlines, every `stride`-th point, in the world), and a body's core
 * as a signed distance (negative inside): its torso as bodyVolume has it (where the hips and the chest have taken it), its
 * head, a round limb along each bone of the arms and legs, the mittens and the shoes. Clothes and hair lie outside the core,
 * so a point of another body found inside it has gone through that body, not just brushed its sleeve.
 */
export function surface(avatar,{stride=1,only=null}={}){
 const out=[];avatar.root.updateMatrixWorld(true);
 for(const mesh of avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline'))){
  const g=mesh.geometry,P=g.attributes.position,I=g.attributes.skinIndex,F=g.attributes.towelFit,r=g.drawRange,end=Math.min(P.count,r.start+r.count),bones=mesh.skeleton.bones,p=new THREE.Vector3(),rest=new THREE.Vector3();
  // cloth fitted after skinning (towel-fit.js: a wrap, a skirt, a dress) is where the fit puts it, as it is drawn
  const fit=F&&mesh.towelFit;if(fit)fit.refresh();
  for(let i=r.start;i<end;i+=stride){const bone=bones[I.getX(i)].name;if(only&&!only(bone))continue;mesh.getVertexPosition(i,p);
   if(fit&&F.getX(i)>.5)fit.fitPoint(p,F.getX(i),rest.fromBufferAttribute(P,i));out.push({p:p.clone().applyMatrix4(mesh.matrixWorld),bone});}
 }
 return out;
}
const segment=(p,a,b,r)=>{const ab=b.clone().sub(a),t=THREE.MathUtils.clamp(p.clone().sub(a).dot(ab)/ab.lengthSq(),0,1);return p.distanceTo(a.clone().addScaledVector(ab,t))-r;};
/** An ellipsoid's signed distance, roughly (exact on its axes): p in its own frame, centre c, half-axes s. */
const ellipsoid=(q,c,s)=>(Math.hypot((q.x-c[0])/s[0],(q.y-c[1])/s[1],(q.z-c[2])/s[2])-1)*Math.min(...s);
/** The body's core as it is posed now: a function of a world point, the signed distance to it (metres, negative inside). */
export function core(avatar){
 const m=avatar.measure,b=avatar.bones,vol=bodyVolume(avatar.recipe,m);avatar.root.updateMatrixWorld(true);
 const at=n=>b[n].getWorldPosition(new THREE.Vector3()),inv=n=>b[n].matrixWorld.clone().invert();
 const frames=[['hips',m.hipY],['chest',m.chestY]].map(([n,y])=>[inv(n),y]),head=inv('head'),hands=['handL','handR'].map(inv),feet=['footL','footR'].map(inv);
 const limbs=[];for(const s of ['L','R'])limbs.push([at('shoulder'+s),at('elbow'+s),m.armR],[at('elbow'+s),at('hand'+s),m.armR*.9],[at('thigh'+s),at('knee'+s),m.legR],[at('knee'+s),at('foot'+s),m.legR*.9]);
 const S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY,q=new THREE.Vector3();
 // (a bent torso is its lower half carried by the hips and its upper half by the chest, never the whole of it by both:
 // the whole torso carried by the hips would stand where a chest that leans back has gone from, and a fist at the collar
 // of the real chest would read as inside it)
 const half=.03*m.k;
 return p=>{let d=Infinity;
  for(const [M,y] of frames){q.copy(p).applyMatrix4(M);q.y+=y;if(y===m.hipY?q.y>m.chestY+half:q.y<m.chestY-half)continue;d=Math.min(d,vol.sdf(q));}
  if(d===Infinity)for(const [M,y] of frames){q.copy(p).applyMatrix4(M);q.y+=y;d=Math.min(d,vol.sdf(q));}
  d=Math.min(d,ellipsoid(q.copy(p).applyMatrix4(head),[0,hc,0],S));
  for(const [a,c,r] of limbs)d=Math.min(d,segment(p,a,c,r));
  for(const M of hands)d=Math.min(d,ellipsoid(q.copy(p).applyMatrix4(M),[0,-m.hand*.55,0],[m.hand*.9,m.hand*1.15,m.hand*.78]));
  for(const M of feet)d=Math.min(d,ellipsoid(q.copy(p).applyMatrix4(M),[0,m.foot*.62-m.foot,m.legR*.55],[m.legR*1.25,m.legR*.75,m.legR*2.3]));
  return d;};
}
/** How deep the points go into a core (metres, 0 when none does), and the deepest point's bone. */
export function intrusion(points,sdf){let deepest={depth:0};for(const a of points){const d=-sdf(a.p);if(d>deepest.depth)deepest={depth:d,bone:a.bone,at:a.p.clone()};}return deepest;}
/** The nearest the points come to a core (metres; negative when inside). */
export function clearance(points,sdf){let g=Infinity;for(const a of points)g=Math.min(g,sdf(a.p));return g;}
