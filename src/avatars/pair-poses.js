import * as THREE from '../../vendor/three.module.js';
import {bodyVolume} from './build.js';
import {createSoleFinder} from './foot-ground.js';
import {both,leg,matchKnee} from './fun-poses.js';
/**
 * Pair poses: two bodies at once (the creator, 2026-10-19: "And running and walking, and kissing and hugging and fighting",
 * for Johansson Studio's stickers and panels "so anyone can use these"; Crayon Shin-chan's world is the register: silly,
 * warm, family-friendly). A pair pose is a spec with two roles, A and B: each role is a pose for one body (animate.js plays
 * it as the move `<name>:A` or `<name>:B`, eased in and out like a funny pose), plus the placing of B relative to A (metres
 * in A's own frame, x to A's left and z ahead of A, and B's facing), worked out for the two bodies that play it (fitPair):
 * a child's head is at a grandmother's chest, a tall man's shoulders over a short woman's, and the toy heads, wider than
 * the shoulders, need more room beside each other than real ones. The fit is a search, the same every time: the nearest
 * standing that keeps the two heads (with their hair and hats) and the two bodies clear of each other by a known gap, and
 * every hand that touches the partner within its arm's reach; the arms are then solved by the body's reach solver
 * (animate.js REACH) on the partner's own posed body (`keepOut`), so a mitten lies on a back and a forearm goes round a
 * flank, never through it. `playPair(animA,animB,name)` does all of it for the game and for Johansson Studio alike: the
 * fit, the placing of B's holder beside A's, the arms, and the two moves started together.
 *
 * Each pair: `label`, `use` (for the storyteller: what has just happened), `faces` (each role's expression, face.js),
 * `d` (how long the pair holds, seconds) and `ramp` (how long it takes to come and to go), and `fit(ctx)`, which returns
 * the placing and both roles' bodies (joints, and the places the hands go, as reach specs).
 */
const JOINTS=['hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR'];
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
/** A gap the two bodies keep from each other (metres): between the heads (with their hair), between the bodies, and the
 *  lips from a cheek; and how far clothes stand off the body's own volume (build.js bodyVolume is the bare torso), kept
 *  from the partner too. */
export const PAIR_GAP=Object.freeze({heads:.012,bodies:.01,lips:.004,cloth:.012,
 /** How far a mitten laid on the partner presses into the clothes: the reach solver's mitten envelope (animate.js TOUCH)
  *  stands about a centimetre off the drawn mitten, so this much of it may go into the shirt for the drawn mitten to rest on it. */
 press:.008});
/** How far a straight arm puts the middle of its mitten from the shoulder, and the share of it a pose may use. */
const reachOf=m=>m.upper+m.fore+m.hand*.55,USABLE=.95;
const segment=(p,a,b,r)=>{const ab=_ab.subVectors(b,a),t=clamp(_ap.subVectors(p,a).dot(ab)/(ab.lengthSq()||1),0,1);return _ap.copy(a).addScaledVector(ab,t).distanceTo(p)-r;};
const _ab=new THREE.Vector3(),_ap=new THREE.Vector3(),_v=new THREE.Vector3();
/** The matrix that places B in A's frame: B's own frame turned `yaw` about the vertical and set at (dx, 0, dz). */
export const pairMatrix=({dx,dz,yawB})=>new THREE.Matrix4().makeRotationY(yawB).setPosition(dx,0,dz);
/** The smallest v in [lo, hi] (to a millimetre) for which `ok` holds, given that it holds at hi: the nearest standing. */
function bisect(lo,hi,ok){if(ok(lo))return lo;for(let i=0;i<12;i++){const mid=(lo+hi)/2;if(ok(mid))hi=mid;else lo=mid;}return hi;}

/**
 * One body of a pair, measured once: its volume (build.js bodyVolume), its head and everything on it (hair, a hat, the
 * drawn face) as points in the head bone's frame and as a shell (how far they reach out from the head's middle by
 * direction, in the head's own radii: the reach solver's hairShell), and its soles.
 */
const bodies=new WeakMap();
function bodyOf(avatar){
 const meshes=avatar.root.children.filter(o=>o.isSkinnedMesh&&o.visible&&!o.name.includes('outline')),key=meshes.map(o=>o.uuid).join('/');
 let b=bodies.get(avatar);if(b?.key===key)return b;
 const m=avatar.measure,S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],hc=m.headCentre-m.headY,pts=[];
 for(const mesh of meshes){
  const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex,W=mesh.geometry.attributes.skinWeight,head=mesh.skeleton.bones.indexOf(avatar.bones.head);
  if(head<0||!I)continue;
  // (and the hair that swings from the head on its own bones (springs.js: braids, a ponytail): it hangs from the head at
  // rest and goes with it)
  const hair=new Set(mesh.skeleton.bones.map((b,i)=>/^(hair|braid)/.test(b.name)?i:-1).filter(i=>i>=0));
  for(let i=0;i<P.count;i+=2)if((I.getX(i)===head||hair.has(I.getX(i)))&&W.getX(i)>.5)pts.push(new THREE.Vector3(P.getX(i),P.getY(i)-m.headY,P.getZ(i)));
 }
 const F=avatar.face?.head?.geometry?.attributes.position;
 if(F)for(let i=0;i<F.count;i+=2)pts.push(new THREE.Vector3(F.getX(i),F.getY(i)+hc,F.getZ(i)));
 if(!pts.length)for(let a=0;a<48;a++)for(let e=1;e<12;e++){const t=a/48*Math.PI*2,f=e/12*Math.PI;pts.push(new THREE.Vector3(S[0]*Math.sin(f)*Math.cos(t),hc+S[1]*Math.cos(f),S[2]*Math.sin(f)*Math.sin(t)));}
 const A=72,E=36,bin=(x,y,z)=>{const r=Math.hypot(x,y,z)||1;return Math.min(E-1,Math.floor((Math.asin(y/r)/Math.PI+.5)*E))*A+((Math.floor((Math.atan2(x,z)/Math.PI+1)/2*A))%A);};
 const R=new Float32Array(A*E).fill(1);
 for(const p of pts){const x=p.x/S[0],y=(p.y-hc)/S[1],z=p.z/S[2],b=bin(x,y,z);R[b]=Math.max(R[b],Math.hypot(x,y,z));}
 const shell=new Float32Array(A*E);
 for(let e=0;e<E;e++)for(let a=0;a<A;a++){let r=0;for(let de=-1;de<=1;de++){const f=e+de;if(f<0||f>=E)continue;for(let da=-1;da<=1;da++)r=Math.max(r,R[f*A+(a+da+A)%A]);}shell[e*A+a]=r;}
 const least=Math.min(...S),vol=bodyVolume(avatar.recipe,m);
 // how far this body's clothes stand off its bare torso where hands land (the chest, the upper back, the flanks between
 // the waist and the shoulders), at rest: nearly all of the drawn shirt's points, so a collar standing off the neck or a
 // hem hanging free at the hips is not a thickness; kept from the partner as the body itself is, within what a shirt can be
 const worn=new Set(['spine','chest']),q=new THREE.Vector3(),off=[];
 for(const mesh of meshes){const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex;if(!I)continue;
  for(let i=0;i<P.count;i+=2){const bone=mesh.skeleton.bones[I.getX(i)]?.name;if(!worn.has(bone))continue;q.fromBufferAttribute(P,i);
   if(q.y<m.chestY-.08*m.k||q.y>m.shoulderY-.03*m.k||Math.abs(q.x)>m.width*.42)continue;off.push(vol.sdf(q));}}
 off.sort((a,b)=>a-b);const cloth=clamp(off.length?off[Math.floor(off.length*.9)]:0,.006*m.k,.018*m.k);
 /** How far a point (in the head bone's frame) is outside the head and what it carries (metres, negative inside): by the
  *  shell's reach in its direction. */
 const gap=q=>{const x=q.x/S[0],y=(q.y-hc)/S[1],z=q.z/S[2];return (Math.hypot(x,y,z)-shell[bin(x,y,z)])*least;};
 // a skirt or a dress (the drawn points the thighs carry that stand well off the legs: a long skirt hangs 10 to 15 cm out
 // from them), kept from the partner as it is drawn: the legs' round limbs are the trousers' (BackToBack, 2026-10-20: a
 // grandmother's long skirt against a child's back)
 const skirt=[];
 for(const mesh of meshes){const P=mesh.geometry.attributes.position,I=mesh.geometry.attributes.skinIndex;if(!I)continue;
  for(let i=0;i<P.count;i+=3){const bone=mesh.skeleton.bones[I.getX(i)]?.name;if(!/^(thigh|knee)[LR]$/.test(bone))continue;q.fromBufferAttribute(P,i);
   if(q.y<m.foot+.04||q.y>m.hipY-.02)continue;const sx=bone.endsWith('L')?1:-1;if(Math.hypot(q.x-sx*m.hipX,q.z)-m.legR>.04*m.k)skirt.push({bone,p:q.toArray()});}}
 b={key,avatar,m,vol,S,hc,pts,gap,cloth,skirt,soles:createSoleFinder(avatar),reach:reachOf(m)};
 bodies.set(avatar,b);return b;
}
/**
 * With the body put in `pose` (joint: [x, y, z]; every other joint straight) for a moment, and stood on the floor as the
 * animator stands it (its lowest sole on it: up on the toes it rises, in a lunge it comes down): for each bone, the matrix
 * from the bone's frame to the body's own frame (its root's), `at(bone, p)`: where the bone carries a point given in the
 * body's frame at rest, and `pos(bone)`. The body is put back as it was.
 */
function posed(body,pose){
 const {avatar}=body,{bones,root}=avatar,saved=JOINTS.map(j=>bones[j].rotation.toArray().slice(0,3)),rootInv=new THREE.Matrix4();
 const put=f=>{JOINTS.forEach((j,i)=>bones[j].rotation.set(...f(j,i)));root.updateMatrixWorld(true);rootInv.copy(root.matrixWorld).invert();};
 const names=['root',...JOINTS],take=()=>Object.fromEntries(names.map(n=>[n,new THREE.Matrix4().multiplyMatrices(rootInv,bones[n].matrixWorld)]));
 put(()=>[0,0,0]);const rest=take();put(j=>pose[j]||[0,0,0]);const now=take(),S=body.soles(),lift=-Math.min(S.L.y,S.R.y);put((j,i)=>saved[i]);
 const up=new THREE.Matrix4().makeTranslation(0,lift,0);
 for(const n of names)now[n].premultiply(up);
 const carry=Object.fromEntries(names.map(n=>[n,now[n].clone().multiply(rest[n].clone().invert())]));
 return {lift,bone:n=>now[n],carry:n=>carry[n],at:(n,p)=>new THREE.Vector3(...p).applyMatrix4(carry[n]),pos:n=>new THREE.Vector3().setFromMatrixPosition(now[n])};
}
/** Which bone carries a point of the torso at height y (the body's frame at rest). */
const torsoBone=(m,y)=>y<m.hipY+m.torso*.25?'hips':y<m.chestY?'spine':'chest';
/** Points over the body's surface, each with the bone that carries it: the torso (bodyVolume's lathe) and the shoulder
 *  caps, rings round the thighs and the shins, and the shoes (the ellipsoids tests/body-contact.mjs measures with); and,
 *  when the arms are posed by the pose itself (`arms`), rings round the upper arms and the forearms and the mittens; and,
 *  with `skirt`, a skirt's or a dress's own drawn points. */
function bodyPoints(body,arms=false,skirt=false){
 const {m}=body,out=[],push=(bone,p)=>out.push({bone,p:p.toArray()});
 if(arms)for(const s of ['L','R']){const sx=s==='L'?1:-1,x=sx*m.shoulderX;
  for(const [bone,y0,y1,r] of [['shoulder'+s,m.shoulderY-.01,m.shoulderY-m.upper+.01,m.armR],['elbow'+s,m.shoulderY-m.upper-.01,m.shoulderY-m.upper-m.fore+.01,m.armR*.9]])
   for(let j=0;j<=3;j++)for(let i=0;i<8;i++){const t=i/8*Math.PI*2,y=y0+(y1-y0)*j/3;push(bone,new THREE.Vector3(x+r*Math.sin(t),y,r*Math.cos(t)));}
  const w=m.shoulderY-m.upper-m.fore;for(let i=0;i<8;i++)for(let j=1;j<3;j++){const t=i/8*Math.PI*2,f=j/3*Math.PI;push('hand'+s,new THREE.Vector3(x+.015*sx+m.hand*.9*Math.sin(f)*Math.cos(t),w-m.hand*.55+m.hand*1.15*Math.cos(f),m.hand*.78*Math.sin(f)*Math.sin(t)));}}
 for(let i=0;i<24;i++)for(let j=0;j<=10;j++){const p=body.vol.surf(i/24*Math.PI*2,j/10*1.02);push(torsoBone(m,p.y),p);}
 for(const sx of [1,-1])for(let i=0;i<12;i++)for(let j=1;j<4;j++){const t=i/12*Math.PI*2,f=j/4*Math.PI,r=m.armR*1.18;
  push('chest',new THREE.Vector3(sx*m.shoulderX-sx*m.armR*.12+r*Math.sin(f)*Math.cos(t),m.shoulderY-m.armR*.05+r*.62*Math.cos(f),r*Math.min(1.1,m.depth/m.width*1.6)*Math.sin(f)*Math.sin(t)));}
 for(const s of ['L','R']){const sx=s==='L'?1:-1;
  for(const [bone,y0,y1,r] of [['thigh'+s,m.hipY-.02,m.hipY-m.thigh+.02,m.legR],['knee'+s,m.hipY-m.thigh-.02,m.foot+.04,m.legR*.9]])
   for(let j=0;j<=4;j++)for(let i=0;i<8;i++){const t=i/8*Math.PI*2,y=y0+(y1-y0)*j/4;push(bone,new THREE.Vector3(sx*m.hipX+r*Math.sin(t),y,r*Math.cos(t)));}
  for(let i=0;i<12;i++)for(let j=1;j<4;j++){const t=i/12*Math.PI*2,f=j/4*Math.PI;
   push('foot'+s,new THREE.Vector3(sx*m.hipX+m.legR*1.25*Math.sin(f)*Math.cos(t),m.foot*.62+m.legR*.75*Math.cos(f),m.legR*.55+m.legR*2.3*Math.sin(f)*Math.sin(t)));}}
 if(skirt)for(const o of body.skirt)out.push(o);
 return out;
}
/**
 * A body as a signed distance (metres, negative inside) in the frame of the other body: its torso (bodyVolume, carried by
 * the hips and the chest), its head with its hair and hat (the shell), round limbs along the legs and, when `arms` are
 * known (shoulder, elbow and hand angles as armTo takes them, [x, y, z, elbow x, elbow y]), along the arms with the
 * mittens on their ends. `M`: this body's frame placed in the other's.
 */
/** A pose with its arms set as armTo sets them from `arms` ({L, R, handL, handR}: the right arm's angles, the left its mirror). */
function withArms(pose,arms){
 const full={...pose};if(!arms)return full;
 for(const s of ['L','R']){const k=s==='R'?1:-1,a=arms[s];if(!a)continue;full['shoulder'+s]=[a[0],a[1]*k,a[2]*k];full['elbow'+s]=[a[3],(a[4]||0)*k,0];const h=arms['hand'+s];if(h)full['hand'+s]=[h[0],h[1]*k,h[2]*k];}
 return full;
}
function field(body,pose,M,arms=null,heads=true,sleeves=true){
 const {m,vol,cloth}=body,full=withArms(pose,arms);
 const F=posed(body,full),place=n=>new THREE.Matrix4().multiplyMatrices(M,F.bone(n)),inv=n=>place(n).invert();
 const frames=[['hips',m.hipY,true],['chest',m.chestY,false]].map(([n,y,lower])=>[inv(n),y,lower]),head=inv('head'),at=n=>new THREE.Vector3().setFromMatrixPosition(place(n));
 const limbs=[],feet=['L','R'].map(s=>inv('foot'+s)),foot=[m.legR*1.25,m.legR*.75,m.legR*2.3],footAt=[0,m.foot*.62-m.foot,m.legR*.55];
 // (and the sleeves, for an arm laid over a shoulder: a shoulder in a shirt stands off its cap by more than the shirt
 // stands off the chest; not for hands on the chest, where on a narrow body the sleeves would hold them off)
 for(const s of ['L','R']){limbs.push([at('thigh'+s),at('knee'+s),m.legR*1.05],[at('knee'+s),at('foot'+s),m.legR*.95]);if(sleeves)limbs.push([at('shoulder'+s),at('shoulder'+s),m.armR*1.25+.006*m.k]);
  if(arms?.[s]){const hand=place('hand'+s),mit=new THREE.Vector3(0,-m.hand*.55,0).applyMatrix4(hand),tip=new THREE.Vector3(0,-m.hand*1.3,0).applyMatrix4(hand);
   limbs.push([at('shoulder'+s),at('elbow'+s),m.armR*1.08],[at('elbow'+s),at('hand'+s),m.armR],[mit,tip,m.hand*.8]);}}
 const q=new THREE.Vector3();
 // (a bent torso is its lower half carried by the hips and its upper half by the chest, not the whole of it by both: the
 // whole torso carried by the hips would stand where a chest that leans back has gone from)
 const half=.03*m.k;
 // (the shirt's thickness over the torso; a sleeve or a trouser leg over a limb is thinner, and a shoe is its own skin)
 const sleeve=.006*m.k;
 return p=>{let d=Infinity;for(const [Mi,y,lower] of frames){q.copy(p).applyMatrix4(Mi);q.y+=y;if(lower?q.y>m.chestY+half:q.y<m.chestY-half)continue;d=Math.min(d,vol.sdf(q));}
  d-=cloth;for(const [a,b,r] of limbs)d=Math.min(d,segment(p,a,b,r)-sleeve);
  for(const Mi of feet){q.copy(p).applyMatrix4(Mi);d=Math.min(d,(Math.hypot((q.x-footAt[0])/foot[0],(q.y-footAt[1])/foot[1],(q.z-footAt[2])/foot[2])-1)*foot[1]);}
  // (the head and its hair stand that much further off: a mitten may press into a shirt (PAIR_GAP.press), never into hair)
  if(!heads)return d;q.copy(p).applyMatrix4(head);return Math.min(d,body.gap(q)+PAIR_GAP.press*m.k);};
}
/** The nearest the two heads (and what they carry) come to each other, A in its pose and B in its, B placed by M. */
function headGap(A,poseA,B,poseB,M){
 const hA=posed(A,poseA).bone('head'),hB=posed(B,poseB).bone('head');
 const toB=new THREE.Matrix4().copy(hB).invert().multiply(new THREE.Matrix4().copy(M).invert()).multiply(hA),toA=toB.clone().invert();
 let g=Infinity;const q=new THREE.Vector3();
 for(const p of A.pts){q.copy(p).applyMatrix4(toB);g=Math.min(g,B.gap(q));if(g<-.05)return g;}
 for(const p of B.pts){q.copy(p).applyMatrix4(toA);g=Math.min(g,A.gap(q));if(g<-.05)return g;}
 return g;
}
/** The nearest the two bodies (torsos, heads, legs, and the arms a pose itself places: `armsA`, `armsB`, as armTo takes
 *  them; not the arms the reach solver places after) come to each other. */
function bodyGap(A,poseA,B,poseB,M,armsA=null,armsB=null,heads=true,skirts=false,headMargin=0){
 const I=new THREE.Matrix4(),fB=field(B,poseB,M,armsB,heads),fA=field(A,poseA,I,armsA,heads),FA=posed(A,withArms(poseA,armsA)),FB=posed(B,withArms(poseB,armsB));
 let g=Infinity;
 for(const {bone,p} of bodyPoints(A,!!armsA,skirts))g=Math.min(g,fB(FA.at(bone,p)));
 for(const {bone,p} of bodyPoints(B,!!armsB,skirts))g=Math.min(g,fA(FB.at(bone,p).applyMatrix4(M)));
 // (and the heads against the other's body: a chin on a shoulder, a child's head at a chest)
 const hA=posed(A,poseA).bone('head'),hB=new THREE.Matrix4().multiplyMatrices(M,posed(B,poseB).bone('head'));
 if(heads){
  for(let i=0;i<A.pts.length;i+=4)g=Math.min(g,fB(_v.copy(A.pts[i]).applyMatrix4(hA))-headMargin);
  for(let i=0;i<B.pts.length;i+=4)g=Math.min(g,fA(_v.copy(B.pts[i]).applyMatrix4(hB))-headMargin);
 }
 return g;
}
/** A point on the partner's torso surface (angle `a` round it: 0 its front, π its back, +π/2 its left; `t` up it), the
 *  partner's clothes and a mitten's thickness off it (a mitten laid on the shirt), in the partner's frame at rest, with the
 *  bone that carries it. */
const onPartner=(body,a,t,hand,off=.95)=>{const p=body.vol.surf(a,t);return {bone:torsoBone(body.m,p.y),p:p.addScaledVector(body.vol.normal(p),hand*off+body.cloth-PAIR_GAP.press*body.m.k).toArray()};};
/** The height t up the partner's torso at which a point stands `y` above the floor (0.08 to 0.96 of it). */
const tAt=(body,y)=>clamp((y-body.m.hipY)/body.m.torso,.08,.96);

/**
 * A reach spec (animate.js REACH) for one arm of a role: the mitten's middle at `target` (the body's own frame, posed as
 * `joints` pose it), kept out of the partner (`keepOut`, a field in the same frame), seeded `seed` (the right arm's angles;
 * the left arm's are its mirror), the elbow sent `elbow` when given.
 */
/** How far an arm reaching for a partner may turn: forward and up to overhead, out to the side or across the chest, never
 *  wound round backward or windmilled over the head (the right arm's terms: x forward negative, z out to the right negative). */
const ARM_BOUNDS=Object.freeze([[-2.4,.6],[-1.2,1.2],[-1.6,1],[-2.3,0],[-1.2,1.2]]);
const armSpec=(side,joints,head,target,keepOut,seed,{elbow=null,hand=[0,0,0],twist=.4,upper=true,touch=false,multiStart=false}={})=>({pose:()=>joints,hair:true,head,only:side,
 [side]:{root:target,keepOut,seed,hand,upper,twist,touch,multiStart,press:true,bounds:ARM_BOUNDS,...(elbow?{elbow:()=>elbow}:{})}});

/** The stance of a fight: the left foot forward with the knee bent, the right braced back, both soles flat. */
const stance=(front,knee,back,spread=.14)=>({thighL:[front,0,spread],kneeL:[knee,0,0],footL:[-(front+knee),0,-spread],thighR:[back,0,-spread],kneeR:[matchKnee(front,knee,back),0,0],footR:[-(back+matchKnee(front,knee,back)),0,spread]});
/** Sat back on the heels (a crouch, `c` of the way), the soles flat. */
const crouch=c=>({thighL:[-.9*c,0,.08],kneeL:[1.6*c,0,0],footL:[-.7*c,0,-.08],thighR:[-.9*c,0,-.08],kneeR:[1.6*c,0,0],footR:[-.7*c,0,.08]});

/**
 * The hug. Toy heads are as wide as the shoulders, so two people cannot hug chest to chest with their heads side by side:
 * the hug that reads at a glance is the one for the camera, side by side and both facing it, B turned a little toward A,
 * the heads leaning together until the hair nearly touches, A's near arm over B's shoulders with the mitten on B's back,
 * B's near arm round A's waist with the mitten on A's back (the two arms cross behind, one high and one low), and each
 * free hand up beside its own cheek in a peace sign. A grandmother's arm goes over a child's shoulders the same way, and
 * the child's round her waist. The bodies stand as near as the two heads allow.
 */
function fitHug(ctx){
 const {A,B}=ctx,yawB=-.55;
 // B turned toward A, A's chest turned toward B (so A's near shoulder is behind B's and the arm goes over it to B's back),
 // each head turned and leant a little toward the other (B's right side is toward A)
 // (a much taller A leans down toward B from the chest: a grandmother to a child)
 const down=clamp((A.m.shoulderY-B.m.shoulderY)/.3,0,1)*.25;
 const pA={hips:[0,0,0],spine:[.02,.1,0],chest:[.04,.18,-down],neck:[.02,0,0],head:[.06,.1,-.12],thighL:[0,0,.06],thighR:[0,0,-.06],kneeL:[.03,0,0],kneeR:[.03,0,0]};
 const pB={hips:[0,0,0],spine:[.02,0,0],chest:[.04,0,0],neck:[.02,0,0],head:[.06,-.22,.08],thighL:[0,0,.06],thighR:[0,0,-.06],kneeL:[.03,0,0],kneeR:[.03,0,0]};
 const dz=0;
 const dx=bisect(.2,1.2,v=>{const M=pairMatrix({dx:v,dz,yawB});return headGap(A,pA,B,pB,M)>=PAIR_GAP.heads&&bodyGap(A,pA,B,pB,M)>=PAIR_GAP.bodies;});
 const PM=pairMatrix({dx,dz,yawB}),PMi=PM.clone().invert(),FA=posed(A,pA),FB=posed(B,pB);
 const shA=FA.pos('shoulderL'),shB=FB.pos('shoulderR'),shBinA=shB.clone().applyMatrix4(PM);
 // a mitten on the partner's back, as far round it from the near side as the arm reaches (phi: from the far side of the
 // spine toward the near flank); `side` +1 when the partner's near side is its left, -1 its right; `from` where the arm
 // reaches from (the shoulder, or an elbow held over the partner's shoulder) and how far it reaches from there
 const backOf=(me,other,F,toMe,from,reach,t0,side)=>{let best=null;
  for(let t=t0;t<=.96;t+=.05)for(let phi=-.5;phi<=1.5;phi+=.05){const place=onPartner(other,Math.PI-side*phi,t,me.m.hand),p=toMe(F,place),d=p.distanceTo(from);
   if(d<=reach)return {place,p};if(!best||d<best.d)best={place,p,d};}
  return best;};
 const inA=(F,place)=>F.at(place.bone,place.p).applyMatrix4(PM),inB=(F,place)=>F.at(place.bone,place.p);
 // A's left arm over B's near shoulder, the forearm lying over it and the mitten hanging down its front, on the chest just
 // below the collarbone: where a hand rests when an arm lies over someone's shoulders (seen in the renders: the solver
 // found it when sent behind the shoulder, where a big head leaning this way overhangs everything on top). Within a short
 // reach of A, and B's arm, solved first, is kept out of; the hand itself does not depend on it.
 const frontB=new THREE.Vector3(Math.sin(yawB),0,Math.cos(yawB));   // B's front, in A's frame
 const overOf=()=>shBinA.clone().addScaledVector(frontB,B.m.armR*1.1+B.cloth+A.m.hand*.85-PAIR_GAP.press*B.m.k).add(new THREE.Vector3(0,-.05*B.m.k,0));
 // B's right arm round A's waist: the mitten on A's back, from B's shoulder
 const under=backOf(B,A,FA,inB,shBinA,B.reach*.9,tAt(A,clamp(shB.y-.3*B.m.k,A.m.hipY+.08*A.m.k,A.m.chestY)),1);
 const keepA=field(B,pB,PM),keepB=field(A,pA,PMi);
 const A_near=armsB=>{const p=overOf(armsB),elbow=shA.clone().lerp(p,.5).add(new THREE.Vector3(0,.06*A.m.k,0));
  return armSpec('L',pA,pA.head,p.toArray(),field(B,pB,PM,armsB),[-1.3,.3,-.6,-1.1,0],{elbow:elbow.toArray()});};
 const B_near=armSpec('R',pB,pB.head,under.p.applyMatrix4(PMi).toArray(),keepB,[-.6,.3,.5,-1.3,.3]);
 // the free hand up beside the cheek, fingers up (the peace sign of every photo), clear of the head and the hair
 // (a side's own place is not mirrored by the solver: the left hand's is written for the left cheek)
 const peace=(joints,side)=>({pose:()=>joints,hair:true,head:joints.head,only:side,[side]:{cover:true,head:[side==='L'?.9:-.9,-.3,.5,.04],seed:[-1.5,.7,-.7,-1.95,0],hand:[0,0,0]}});
 // (B's arm first: A's hand rests on it)
 return {dx,dz,yawB,order:'BA',
  A:{joints:pA,near:A_near,far:()=>peace(pA,'R'),keep:arms=>field(B,pB,PM,arms)},
  B:{joints:pB,near:B_near,far:()=>peace(pB,'L'),keep:arms=>field(A,pA,PMi,arms)}};
}

/**
 * The kiss: a peck on the cheek, the classic (the owner, 2026-10-19: "The kiss should look cuter"). A comes at B from the
 * front and a little to the side (about 60° off B's facing), up on the toes of one foot with the other kicked up behind,
 * the torso tipped toward B, the hands clasped behind the back, the head tilted, eyes shut and lips puckered, landing on
 * B's right cheek; B goes stiff and red to the ears, leaning back a touch, the arms held a little out from the sides,
 * eyes wide. A shorter A rises on the toes and tips the head back; a taller A tips further in and bends the standing knee;
 * a much taller B (a grandmother and a child) bends down to it and tips the cheek. The two heads come as near as their
 * hair and noses allow, the lips at the cheek.
 */
function fitKiss(ctx){
 const {A,B}=ctx,yawB=-2.1;
 // (both bodies' arms are the pose's own: A's clasped behind the back, B's a little out from the sides, the mittens
 // splayed; written as armTo takes them)
 const armsA={L:[.42,0,-.14,-1.05,0],R:[.42,0,-.14,-1.05,0]},armsB={L:[.08,0,-.3,-.1,0],R:[.08,0,-.3,-.1,0],handL:[0,0,-.3],handR:[0,0,-.3]};
 const behind=withArms({},armsA),stiff=withArms({},armsB);
 // A: always up on the left toes with the right foot kicked up behind, tipped toward B; u>0 rises further (the toes
 // pointed, the head back), u<0 comes down (tipped further in, the head down, the standing knee bent). B: v>0 bends down to
 // A (the chest and the head tipped toward A, the knees bent), v<0 rises on the toes to A.
 const poseA=u=>{const dn=Math.max(0,-u),up=Math.max(0,u),knee=.9*dn,thigh=-.5*dn;
  return {...behind,hips:[0,0,0],spine:[.06+.06*dn,0,0],chest:[.22+.3*dn,0,0],neck:[.04,0,0],head:[.22*dn-.3*up,0,-.14],
   thighL:[thigh,0,.03],kneeL:[knee,0,0],footL:[-(thigh+knee)+.55+.4*up,0,-.03],thighR:[.55,0,-.06],kneeR:[1.5,0,0],footR:[.4,0,.06]};};
 const poseB=v=>{const dn=Math.max(0,v),up=Math.max(0,-v);
  return {...stiff,hips:[0,0,0],spine:[0,0,.08*dn],chest:[-.1+.3*dn,0,.3*dn],neck:[0,0,0],head:[-.06+.12*dn,0,.1+.3*dn],
   thighL:[-.6*dn,0,.06],kneeL:[1.1*dn,0,0],footL:[-.5*dn+.85*up,0,-.06],thighR:[-.6*dn,0,-.06],kneeR:[1.1*dn,0,0],footR:[-.5*dn+.85*up,0,.06]};};
 const lipsA=F=>_v.set(0,A.hc-.3*A.S[1],A.S[2]*.95).applyMatrix4(F.bone('head')).clone(),cheekB=F=>_v.set(-B.S[0]*.95,B.hc-.3*B.S[1],0).applyMatrix4(F.bone('head')).clone();
 const split=s=>s>=0?[Math.min(s,1),Math.max(0,s-1)]:[Math.max(s,-1),Math.min(0,s+1)];
 const mismatch=s=>{const [u,v]=split(s);return cheekB(posed(B,poseB(v))).y-lipsA(posed(A,poseA(u))).y;};
 // the lips to the cheek's height: the least effort that gets there (bisection on the monotone mismatch)
 // (the mismatch falls as s rises: A up, then B down; beyond either end, the end)
 let lo=-2,hi=2;if(mismatch(hi)>0)lo=hi;else if(mismatch(lo)<0)hi=lo;else for(let i=0;i<16;i++){const mid=(lo+hi)/2;if(mismatch(mid)>0)lo=mid;else hi=mid;}
 const s=(lo+hi)/2,[u,v]=split(s),pA=poseA(u),pB=poseB(v),FA=posed(A,pA),FB=posed(B,pB),lips=lipsA(FA),cheek=cheekB(FB);
 // B's cheek before A's lips: across, and as near as the heads (hair, noses) allow, then no nearer than the bodies allow
 const dxFor=dz=>lips.x-new THREE.Vector3().copy(cheek).applyMatrix4(pairMatrix({dx:0,dz,yawB})).x;
 let dz=bisect(.15,1.2,v=>headGap(A,pA,B,pB,pairMatrix({dx:dxFor(v),dz:v,yawB}))>=PAIR_GAP.lips);
 // (the heads are placed already, by the lips' gap: this stage keeps the bodies and the arms apart)
 dz=bisect(dz,1.2,v=>bodyGap(A,pA,B,pB,pairMatrix({dx:dxFor(v),dz:v,yawB}),armsA,armsB,false)>=PAIR_GAP.bodies);
 const dx=dxFor(dz);
 return {dx,dz,yawB,A:{joints:pA},B:{joints:pB}};
}

/**
 * The squabble, two ways. Fight: A grabs B by the collar with both fists (by the shirt, where the arms reach on a taller
 * B), leaning in and yelling; B is yanked forward, leaning back from it with both arms flung up and out. Shove: both of
 * A's mittens flat on B's chest, pushing; B reels back, a foot back to catch the fall, the arms up. The two stand face to
 * face as near as the heads allow, B leaning back as far as it takes for the arms to reach.
 */
function fitFacing(ctx,{grabT,wide,leanA,armsB,reel,handA,off=.95}){
 const {A,B}=ctx,yawB=Math.PI;
 // A lunges, the left foot forward between B's feet, the face in B's; B stands with the feet wide and braced (its own
 // feet clear of A's), leaning back, the arms thrown up and out (shoulder high, so the elbows are above A's reaching arms)
 // or, reeling from the shove, out to the sides, a foot back to catch the fall
 const bodyA=()=>({spine:[.05,0,0],chest:[leanA,0,0],neck:[-.08,0,0],head:[-.18,0,-.14],...stance(-.3,.5,.22,.1)});
 const bodyB=back=>withArms({spine:[-.08,0,0],chest:[-back,0,0],neck:[-.08,0,0],head:[-.12,0,.1],...(reel?stance(-.05,.25,.4,.24):stance(-.08,.3,.08,.26))},armsB);
 const pA=bodyA();
 // the grip: at B's collar, or lower on a B whose collar a short A cannot reach (the shirt front at A's own shoulder height);
 // the two stand as near as the heads allow, B leaning back; where A's fists still cannot reach, the grip goes down the
 // shirt before B is leant further back (a collar leans back with the chest and gets no nearer)
 const y0=clamp(A.m.shoulderY+.1*A.m.k,B.m.hipY+.08*B.m.k,B.m.hipY+B.m.torso*grabT),t0=tAt(B,y0);
 let last=null;
 for(let back=.28;back<=.6;back+=.08){
  const pB=bodyB(back);
  const dz=bisect(.15,1,v=>{const M=pairMatrix({dx:0,dz:v,yawB});return headGap(A,pA,B,pB,M)>=PAIR_GAP.heads&&bodyGap(A,pA,B,pB,M,null,armsB)>=PAIR_GAP.bodies;});
  const PM=pairMatrix({dx:0,dz,yawB}),FA=posed(A,pA),FB=posed(B,pB);
  for(let t=t0;t>=.5;t-=.06){
   // (A's left fist on B's right collar: B's right is at A's left once B faces A)
   const targets=['L','R'].map(s=>{const k=s==='L'?1:-1,o=onPartner(B,-k*wide,t,A.m.hand,off);return {side:s,p:FB.at(o.bone,o.p).applyMatrix4(PM),shoulder:FA.pos('shoulder'+s)};});
   const fit=()=>{const keepA=field(B,pB,PM,armsB,true,false),specs=targets.map(o=>armSpec(o.side,pA,pA.head,o.p.toArray(),keepA,[-1.25,.15,-.05,-.45,0],{hand:handA,upper:true,multiStart:B.m.studio}));
    return {dx:0,dz,yawB,A:{joints:pA,near:specs[0],far:()=>specs[1],keep:()=>keepA},B:{joints:pB}};};
   if(targets.every(o=>o.p.distanceTo(o.shoulder)<=A.reach*.82))return fit();
   last=fit;
  }
 }
 return last();
}

/**
 * Back to back: the buddy-film poster (the owner, 2026-10-20: "a die cut sticker with Johansson and Thuan standing back to
 * back like a buddy cop trailer graphic", "and make so studio can use it too"). The two stand with their backs together,
 * each turned BACK_TURN (34°) out of the straight back-to-back toward a lens on A's left (BACK_TO_BACK_VIEW: the line
 * between the two bodies runs across that lens, A on one side of the picture and B on the other), the chest and the head
 * turned on toward it, so both faces read three-quarter, the chins up, the feet planted a little apart, both with the
 * arms folded: A smug, B determined. Why so:
 * - Both arms folded, on both. The posters' finger pistol cannot be made: World's hands are always mittens (animate.js:
 *   never fingers, in any move), and a mitten fist raised by the shoulder, seen from this lens, sat under B's chin like
 *   someone thinking (tried, in the renders). Two pairs of folded arms back to back is the poster everybody knows, and the
 *   faces carry the difference.
 * - 34° and not 20–30°: toy heads are wider than the shoulders and stand behind the back, so at 24° the heads met 25 cm
 *   before the backs did. Turned further, the line between the two is more across the picture, and each head is tipped
 *   out away from the other (`out`: the chest and the neck leaning a little forward and to the outer side, the head held
 *   back so the chin stays up) only as far as it takes for the backs to come within a centimetre of where the bodies
 *   alone would let them stand: the two touch at the shoulder blades and the backs, never kept apart by their heads.
 */
const BACK_TURN=.6;
/** The more a back keeps from a back than the pair gap when either wears a dress or a skirt: it stands off the hips more
 *  than a shirt does off the chest (measured: a dress's hips went 7 mm into the partner at the pair gap alone). */
const BACK_CLOTH=.006;
/** Where a lens sees BackToBack best: radians round from A's front, as Johansson Studio's sticker and panel lenses count
 *  them (positive toward A's right), so negative: the lens on A's left, across the line between the two. */
export const BACK_TO_BACK_VIEW=-(Math.PI/2-BACK_TURN);
function fitBackToBack(ctx){
 const {A,B}=ctx,yawB=Math.PI-2*BACK_TURN,flowingHair=A.avatar.recipe.hair.style==='longfringe'||B.avatar.recipe.hair.style==='longfringe';
 const panelClearance=(A.avatar.recipe.outfit.skirtCut==='panel'||B.avatar.recipe.outfit.skirtCut==='panel')?.01*Math.max(A.m.k,B.m.k):0;
 // B's place: behind A and to A's left, along the line between the two fronts (A's front +z, B's at yawB), so B's back
 // faces A's; s metres along it
 const ux=Math.sin(yawB),uz=Math.cos(yawB)-1,ul=Math.hypot(ux,uz),at=s=>({dx:ux/ul*s,dz:uz/ul*s,yawB});
 // away from the partner, in each body's own frame: forward `fw` and to the outer side `sd` (B is A's mirror)
 const fw=-uz/ul,sd=ux/ul;
 // the chest and the head turned on toward the lens (A's left; B's right: k), the chin up, leant out by `out`; the feet
 // planted a little apart, the knees straight
 const legsA=stance(-.25,.25,.04,.08),swap=j=>j.replace(/[LR]$/,c=>c==='L'?'R':'L');
 const legs=k=>k>0?legsA:Object.fromEntries(Object.entries(legsA).map(([j,[x,y,z]])=>[swap(j),[x,-y,-z]]));
 const body=(k,out)=>{
  if(!flowingHair)return {hips:[0,0,0],spine:[-.02,k*.08,0],chest:[-.04+fw*out*.4,k*.14,k*sd*out*.5],neck:[-.04+fw*out*.6,0,k*sd*out*.5],head:[-.14-fw*out,k*.38,k*sd*out*.3],...legs(k)};
  // Hinge from the pelvis, with the legs counter-rotated to keep the soles
  // planted. This clears hanging hair while the lower backs can still meet.
  const x=fw*out*.7,z=k*sd*out*.5,lower=legs(k);
  for(const side of ['L','R']){const a=lower['thigh'+side];lower['thigh'+side]=[a[0]-x,a[1],a[2]-z];}
  return {hips:[x,0,z],spine:[-.02,k*.08,0],chest:[-.04+fw*out*.15,k*.14,k*sd*out*.15],neck:[-.04+fw*out*.15,0,k*sd*out*.15],head:[-.14-fw*out,k*.38,k*sd*out*.3],...lower};
 };
 let best=null;
 for(let out=0;out<=(flowingHair?1.2:.8);out+=.04){
  const pA=body(1,out),pB=body(-1,out);
  const ok=heads=>s=>{const M=pairMatrix(at(s));return (!heads||headGap(A,pA,B,pB,M)>=PAIR_GAP.heads)&&bodyGap(A,pA,B,pB,M,null,null,heads,true,flowingHair?.012:0)>=PAIR_GAP.bodies+panelClearance+(A.skirt.length||B.skirt.length?BACK_CLOTH*Math.max(A.m.k,B.m.k):0);};
  const s=bisect(.05,1.4,ok(true)),bodies=bisect(.05,s,ok(false));
  best={s,pA,pB,out};
  if(s-bodies<=.005)break;
 }
 const {s,pA,pB}=best,place=at(s),PM=pairMatrix(place),PMi=PM.clone().invert();
 // arms folded across the chest (fun-poses Huff's: each mitten on the front of the torso, on the other side), on the body
 // as this pose turns it, kept out of the partner and never wound round to get there
 const onFront=(side,t)=>(m,v)=>{const p=v.surf(side*.3,t);return p.addScaledVector(v.normal(p),m.hand*.9).toArray();};
 const arm=(keep,side,t)=>({touch:true,on:['spine',onFront(side,t)],keepOut:keep,seed:[-.6,.3,.35,-2.1,0],hand:[0,0,0],bounds:ARM_BOUNDS,twist:.4});
 const folded=(joints,keep)=>({pose:()=>joints,hair:true,head:joints.head,R:arm(keep,1,.72),L:arm(keep,-1,.62)});
 return {dx:place.dx,dz:place.dz,yawB,out:best.out,
  A:{joints:pA,near:folded(pA,field(B,pB,PM))},
  B:{joints:pB,near:folded(pB,field(A,pA,PMi))}};
}

export const PAIR_POSES=Object.freeze({
 Hug:Object.freeze({label:'Hug',d:3.2,ramp:.8,faces:Object.freeze({A:'happy',B:'shy'}),
  use:'Someone to hold, after a scare, a parting or good news: side by side for the camera, heads leaning together, A\u2019s arm over B\u2019s shoulders and B\u2019s round A\u2019s waist, the free hands up in a peace sign.',
  fit:fitHug,life:(P,role)=>{P.add('chest',Math.sin(P.t*2)*.008*P.w);}}),
 Kiss:Object.freeze({label:'Kiss',d:2.8,ramp:.7,faces:Object.freeze({A:'kiss',B:'flustered'}),
  use:'A peck on the cheek, cartoon-cute: A tipped in from the front-side, up on one foot with the other kicked up behind, hands clasped behind the back, eyes shut; B stiff, eyes wide and red to the ears.',
  fit:fitKiss,life:(P,role)=>{if(role==='B')P.add('head',0,0,Math.sin(P.t*24)*.006*P.w);}}),
 Fight:Object.freeze({label:'Fight',d:3,ramp:.6,faces:Object.freeze({A:'raging',B:'pain'}),
  use:'The squabble: A has B by the collar with both fists, leaning in and yelling; B, yanked forward, leans back from it with both arms flung up.',
  fit:ctx=>fitFacing(ctx,{grabT:.9,wide:.26,leanA:.16,handA:[0,0,0],armsB:{L:[-1.9,.1,-.75,-.7,0],R:[-1.9,.1,-.75,-.7,0],handL:[0,0,.3],handR:[0,0,-.3]}}),
  life:(P,role)=>{P.add('chest',Math.sin(P.t*16)*(role==='A'?.012:.02)*P.w);}}),
 Shove:Object.freeze({label:'Shove',d:2.6,ramp:.5,faces:Object.freeze({A:'angry',B:'shock'}),
  use:'The push: both of A’s mittens flat on B’s chest; B reels back, a foot back to catch the fall, the arms up and the eyes wide.',
  fit:ctx=>fitFacing(ctx,{grabT:.66,wide:.32,leanA:.22,handA:[-1.5,0,0],off:.78,reel:true,armsB:{L:[-.5,.2,-1.35,-.5,0],R:[-.5,.2,-1.35,-.5,0],handL:[0,0,.3],handR:[0,0,-.3]}}),life:()=>{}}),
 BackToBack:Object.freeze({label:'Back to back',d:3.2,ramp:.8,faces:Object.freeze({A:'smug',B:'focus'}),view:BACK_TO_BACK_VIEW,
  use:'Partners facing trouble together, a standoff or a team-up: back to back like a buddy-film poster, both turned to the lens with the chins up and the arms folded; A smug, B determined.',
  fit:fitBackToBack,life:(P,role)=>{P.add('chest',Math.sin(P.t*1.6)*.006*P.w);}}),
});
/** The two roles of every pair as moves of one body (animate.js GESTURES): `<pair>:A` and `<pair>:B`. */
export const PAIR_ROLES=Object.freeze(Object.fromEntries(Object.entries(PAIR_POSES).flatMap(([name,p])=>['A','B'].map(role=>[name+':'+role,Object.freeze({pair:name,role,label:p.label+' ('+role+')',face:p.faces[role],d:p.d,ramp:p.ramp,
 /** The role's body: the fit's joints, both arms where the fit sends them (P.reach), and the pair's bit of life. The
  *  standing body's own sway and wandering head are held still under it: the fit placed the two heads a centimetre apart. */
 play(P){const {w}=P,F=P.fit;const arms=P.reach();if(arms)both(P,arms,w);
  for(const j of PINNED)if(!(j in F.joints))P.toward(j,0,0,0,w);
  for(const [j,a] of Object.entries(F.joints))P.toward(j,...a,w);p.life(P,role);}})]))));
const PINNED=['hips','spine','chest','neck','head','thighL','thighR'];

/**
 * The fit of a pair for two bodies (or one body as both, for a role played without a partner): the placing of B in A's
 * frame and each role's body. `solve` (when given, {A, B}: each a function (key, spec) → the solved arms, the animator's
 * reach solver) works the arms out at once, in the order they depend on each other: A's near arm, then B's near arm kept
 * out of it, then each one's far hand, laid on the other's near arm; without it, each role solves its own arms when it is
 * first played, on the partner's body without its arms.
 */
export function fitPair(name,avatarA,avatarB=avatarA,solve=null){
 const spec=PAIR_POSES[name];if(!spec)throw new Error('no pair pose '+name);
 const A=bodyOf(avatarA),B=bodyOf(avatarB),fit=spec.fit({A,B});
 const key=role=>`${name}:${role}:${(role==='A'?avatarB:avatarA).recipe?.name||'?'}|${(role==='A'?avatarB:avatarA).outfit||''}|${fit.dx.toFixed(3)}|${fit.dz.toFixed(3)}`;
 for(const role of ['A','B'])fit[role]={...fit[role],role,name,key:key(role),face:spec.faces[role],arms:null};
 if(solve){
  // (the near arms in the pair's order: the second kept out of the first; a near spec may be a function of the first's arms)
  const nearSpec=(F,arms)=>typeof F.near==='function'?F.near(arms):F.near&&arms&&F.keep?{...F.near,[F.near.only]:{...F.near[F.near.only],keepOut:F.keep(arms)}}:F.near;
  let nearA={},nearB={};
  if(fit.order==='BA'){if(fit.B.near)nearB=solve.B(fit.B.key+':near',nearSpec(fit.B,null));const sp=nearSpec(fit.A,nearB);if(sp)nearA=solve.A(fit.A.key+':near',sp);}
  else{const sa=nearSpec(fit.A,null);if(sa)nearA=solve.A(fit.A.key+':near',sa);const sb=nearSpec(fit.B,nearA);if(sb)nearB=solve.B(fit.B.key+':near',sb);}
  const farA=fit.A.far?solve.A(fit.A.key+':far',fit.A.far(nearB,fit.A.keep?.(nearB))):{},farB=fit.B.far?solve.B(fit.B.key+':far',fit.B.far({...nearA,...farA},fit.B.keep?.({...nearA,...farA}))):{};
  fit.A.arms=fit.A.near||fit.A.far?{...nearA,...farA}:null;fit.B.arms=fit.B.near||fit.B.far?{...nearB,...farB}:null;
 }
 return fit;
}
/** A role's arms solved on its own (no partner's arms known): what the animator does when a role is played by itself. */
export function solveRole(F,solve){
 if(!F.near&&!F.far)return null;
 const near=F.near?solve(F.key+':near',typeof F.near==='function'?F.near(null):F.near):{},far=F.far?solve(F.key+':far',F.far(null)):{};
 return {...near,...far};
}
/** The fit's placing of B as a matrix from B's holder to A's holder: the fit is in the bodies' own frames (the bones', facing
 *  +z), and a body's root is turned in its holder (build.js: the town's characters face -z), so the offset turns with it. */
export function holderMatrix(avatarA,avatarB,fit){
 const turn=a=>new THREE.Matrix4().makeRotationFromQuaternion(a.root.quaternion);
 return turn(avatarA).multiply(pairMatrix(fit)).multiply(turn(avatarB).invert());
}
/**
 * How near two bodies' heads (with their hair and hats) come as they stand and are posed now (metres, negative when one
 * is in the other): for a test, or a check before a still is shot.
 */
export function headsApart(avatarA,avatarB){
 const A=bodyOf(avatarA),B=bodyOf(avatarB);avatarA.root.updateMatrixWorld(true);avatarB.root.updateMatrixWorld(true);
 const hA=avatarA.bones.head.matrixWorld,hB=avatarB.bones.head.matrixWorld,toB=new THREE.Matrix4().copy(hB).invert().multiply(hA),toA=toB.clone().invert();
 let g=Infinity;const q=new THREE.Vector3();
 for(const p of A.pts){q.copy(p).applyMatrix4(toB);g=Math.min(g,B.gap(q));}
 for(const p of B.pts){q.copy(p).applyMatrix4(toA);g=Math.min(g,A.gap(q));}
 return g;
}
/** B's holder placed beside A's by the fit: B's frame at (dx, 0, dz) in A's, turned yawB. True when both have holders. */
export function placePair(avatarA,avatarB,fit){
 const hA=avatarA.root.parent,hB=avatarB.root.parent;if(!hA||!hB||hA===hB)return false;
 hA.updateMatrixWorld(true);const M=new THREE.Matrix4().multiplyMatrices(hA.matrixWorld,holderMatrix(avatarA,avatarB,fit));
 if(hB.parent){hB.parent.updateMatrixWorld(true);M.premultiply(new THREE.Matrix4().copy(hB.parent.matrixWorld).invert());}
 M.decompose(hB.position,hB.quaternion,hB.scale);hB.updateMatrixWorld(true);return true;
}
/**
 * Two bodies play a pair: the fit for these two, their arms solved on each other, B's holder set beside A's (when both
 * are in holders), and the two roles started together (held `seconds` when given, else the pair's own length). Returns
 * the fit. The animators are animate.js createAvatarAnimator's.
 */
export function playPair(animA,animB,name,{seconds,place=true}={}){
 const avatarA=animA.avatar,avatarB=animB.avatar;
 const fit=fitPair(name,avatarA,avatarB,{A:animA.solveReach,B:animB.solveReach});
 avatarA.pair={name,role:'A',fit};avatarB.pair={name,role:'B',fit};
 if(place)placePair(avatarA,avatarB,fit);
 animA.play(name+':A',seconds);animB.play(name+':B',seconds);
 return fit;
}
