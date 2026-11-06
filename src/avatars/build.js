import {authoredSkirtGeometry,authoredSkirtMaterial} from './authored-skirt.js';
import {skirtSpec,skirtRadiusAt,tailoredSkirtGeometry} from './skirt-shape.js';
import {longFringeGeometry} from './long-fringe.js';
import {SWEPT_PONYTAIL} from './swept-ponytail-mesh.js';
import {POLO_COLLAR} from './contrast-polo-mesh.js';
import {THUAN_SAILOR_OUTFIT,AFTERBATH,houseDressColour} from './outfit-constants.js';
import {SPRING_BONES,SPRING_PARENT,springRest,chainShare,quarterShare,hemSpec,createSprings} from './springs.js';
import {SHOPPING_LANE_OUTFIT} from '../world/shopping-lane-plan.js';
import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries,mergeVertices} from '../../vendor/BufferGeometryUtils.js';
import {normalizeRecipe,DRESS_BOTTOMS} from './recipe.js';
import {drawFace,faceLayout,INK_NOSES,BEARD_SHELL,drawBeardShell} from './face.js';
import {buildFaceObjects} from './face-objects.js';
import {buildEyes3d,eyes3dOn} from './eyes3d.js';
import {pixarBody,dressPixar} from './pixar.js';
import {beardSpec} from './beard-mesh.js';
import {headProfile,shapeHeadPoint} from './head-profile.js';
import {longBraidPoints} from './braid-path.js';
import {pleatedSkirtGeometry} from './pleated-skirt.js';
import {celFrom} from '../render/cel.js';
import {createTowelFit} from './towel-fit.js';
import {addPoliceCap,policeCapTuck,addPoliceJacket,addDutyBelt} from './police-uniform.js';
import {addKerchief,kerchiefTuck} from './kerchief.js';
import {GARMENT,PLAIN_UV,torsoUV,sleeveUV,paintGarment,SLEEVED_LONG,CAMP_COLLAR,SHIRT_SLEEVES,ACCENT_SLEEVES,UNDERSHIRT_ARMS,SLEEVE_END} from './garment.js';
import {ASSET_HATS,isAssetHat,assetHatPieces,hatTuck,weaveTexture} from './hat-assets.js';

/**
 * Builds a Shimanchu from a recipe.
 *
 * The body is one skinned mesh: every part -- torso, limbs, shoes, hair -- is a
 * simple rounded shape painted with vertex colour and bound rigidly to one bone, so the
 * legacy body is a single draw call and moves like a jointed toy, which is the look.
 * The optional authored panel skirt is a third main mesh with its own cloth
 * material, bound to the same skeleton and fitted with the shared cloth path.
 * The head is the second draw call: a sphere whose front carries the painted face. The
 * hat is the last range of the body, so it can be taken off and hung up.
 *
 * The head is roughly a quarter of the height, with an authored silhouette. The same
 * skeleton and measurements drive walking, seats, clothing and held objects.
 *
 * The body faces +z; the root is turned to face -z, the way the town's characters do.
 */
// The swing bones (springs.js) come last: hair, skirt and hem chains every body carries,
// used or not, so every skeleton has the same bones in the same order.
export const BONES=Object.freeze(['root','hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR',...SPRING_BONES]);
const BI=Object.fromEntries(BONES.map((n,i)=>[n,i]));

/** Every measurement of a body, from its recipe. Pure, for tests and the seat maths. */
/**
 * Height range and head scale per life stage. A child's head is about 0.4 of their
 * height, an adult's about a third, for the big-headed life-sim silhouette; elders lose a little height. Adult is the original scale.
 */
const STAGES=Object.freeze({
 child:{base:1.12,span:.2,head:1.4},
 teen:{base:1.4,span:.28,head:1.18},
 adult:{base:1.36,span:.44,head:1.12},
 elder:{base:1.33,span:.34,head:1.14},
});
export function measure(recipe){
 const r=normalizeRecipe(recipe);
 const stage=STAGES[r.age]||STAGES.adult;
 const studio=r.body.proportion==='studio';
 const H=stage.base+r.body.height*stage.span,k=H/1.6,build=r.body.build;
 const profile=headProfile(r.head),Rh=(.19+r.head.size*.055)*k*stage.head*(studio?.82:1)*(r.body.proportion==='rounded'?1.30:1),headSX=profile.width,headSY=profile.height;
 const rounded=r.body.proportion==='rounded';
 const neck=.055*k,body=H-Rh*2*headSY-neck;
 const leg=body*(studio?.60:rounded?.37:.47),torso=body-leg;
 const foot=.07*k,thigh=(leg-foot)*.5,shin=thigh;
 const legR=(.058+build*.024)*k*(studio?.9:1),armR=(.045+build*.016)*k*(studio?.85:1);
 const feminine=r.body.silhouette==='feminine',masculine=r.body.silhouette==='masculine';
 const width=(.3+build*.15)*k*(rounded?1.20:1)*(feminine?.94:masculine?1.08:1)*(studio?.84:1),depth=(.2+build*.09)*k*(rounded?1.15:1)*(studio?.87:1);
 const hips=width*(feminine?1.13:masculine?.9:1),waistRatio=studio?(feminine?.76:.88):feminine?.79:masculine?.98:.96;
 const upper=(rounded?.18:.22)*k*(studio?.92:1),fore=(rounded?.16:.2)*k*(studio?.92:1),hand=.056*k*(studio?.9:1);
 const hipY=leg,chestY=hipY+torso*.5,neckY=hipY+torso,headY=neckY+neck;
 return {studio,panelSkirt:r.outfit.bottom==='skirt'&&r.outfit.skirtCut==='panel',skirtLength:r.outfit.skirtLength,skirtFlare:r.outfit.skirtFlare,H,k,Rh,headSX,headSY,profile,neck,torso,leg,foot,thigh,shin,legR,armR,width,hips,waistRatio,depth,upper,fore,hand,hipY,chestY,neckY,headY,
  // The arm hangs from just inside the torso's edge, below its top, so the shoulder
  // rounds over it instead of the arm standing clear of the body.
  headCentre:headY+Rh*headSY*.94,shoulderX:width/2-armR*.2,shoulderY:neckY-.075*k,hipX:hips*.24,
  /** How far below the hip joint the backs of the thighs are when sitting. */
  seatDrop:legR*.95};
}

/** Where each bone stands at rest, in model space. */
function restPositions(m){
 return {
  root:[0,0,0],hips:[0,m.hipY,0],spine:[0,m.hipY+m.torso*.25,0],chest:[0,m.chestY,0],neck:[0,m.neckY,0],head:[0,m.headY,0],
  shoulderL:[m.shoulderX,m.shoulderY,0],elbowL:[m.shoulderX+.01,m.shoulderY-m.upper,0],handL:[m.shoulderX+.015,m.shoulderY-m.upper-m.fore,0],
  shoulderR:[-m.shoulderX,m.shoulderY,0],elbowR:[-m.shoulderX-.01,m.shoulderY-m.upper,0],handR:[-m.shoulderX-.015,m.shoulderY-m.upper-m.fore,0],
  thighL:[m.hipX,m.hipY,0],kneeL:[m.hipX,m.hipY-m.thigh,0],footL:[m.hipX,m.foot,0],
  thighR:[-m.hipX,m.hipY,0],kneeR:[-m.hipX,m.hipY-m.thigh,0],footR:[-m.hipX,m.foot,0],
 };
}
const PARENT={...SPRING_PARENT,hips:'root',spine:'hips',chest:'spine',neck:'chest',head:'neck',shoulderL:'chest',elbowL:'shoulderL',handL:'elbowL',shoulderR:'chest',elbowR:'shoulderR',handR:'elbowR',thighL:'hips',kneeL:'thighL',footL:'kneeL',thighR:'hips',kneeR:'thighR',footR:'kneeR'};

const tmpColour=new THREE.Color();
/** The torso lathe's radius at a fraction of its height. */
/** The camp collar from Blender (tools/blender/kariyushi_collar.py), body-relative. */
/**
 * The camp collar's leaf and lapel, one piece of cloth each side: the CAMP_COLLAR outline
 * laid onto the chest and given a few millimetres of thickness, so it has an edge the ink
 * outline follows and catches the light, plain cloth with no print. The outline is cut
 * into small triangles first so the cloth bends with the chest rather than cutting into it.
 */
function campCollar(list,m,prof,colour){
 const W=m.width,D=m.depth,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];
 for(const s of [-1,1]){
  const outline=CAMP_COLLAR.map(([f,t])=>new THREE.Vector2(f,t));
  let tris=THREE.ShapeUtils.triangulateShape(outline,[]).map(t=>t.map(i=>[outline[i].x,outline[i].y]));
  for(let k=0;k<3;k++)tris=tris.flatMap(([a,b,c])=>{const ab=mid(a,b),bc=mid(b,c),ca=mid(c,a);return [[a,ab,ca],[ab,b,bc],[ca,bc,c],[ab,bc,ca]];});
  // On the chest, lifted off it: out from the body's axis, and up a little where the chest
  // turns over into the shoulder.
  const at=([f,t],lift)=>{const r=latheRadius(prof,t),x=s*f*W/2*r,z=D/2*r*Math.sqrt(Math.max(0,1-f*f)),q=Math.hypot(x,z)||1,k=1+lift/q;
   return new THREE.Vector3(x*k,m.hipY+t*m.torso+lift*THREE.MathUtils.smoothstep(t,.9,1.02),z*k);};
  const top=.011*m.k,under=.003*m.k,pos=[],centre=at([.5,.84],0);
  const face=(a,b,c)=>{const n=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)),out=a.clone().add(b).add(c).multiplyScalar(1/3).sub(centre.clone().multiplyScalar(.2));
   if(n.dot(out)<0)[b,c]=[c,b];pos.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z);};
  for(const [a,b,c] of tris){face(at(a,top),at(b,top),at(c,top));const A=at(a,under),B=at(b,under),C=at(c,under),n=new THREE.Vector3().subVectors(B,A).cross(new THREE.Vector3().subVectors(C,A));
   // The underside faces into the body.
   if(n.dot(A)>0)pos.push(A.x,A.y,A.z,C.x,C.y,C.z,B.x,B.y,B.z);else pos.push(A.x,A.y,A.z,B.x,B.y,B.z,C.x,C.y,C.z);}
  // The edge all round, in the same steps as the triangles' edges.
  const ring=[];CAMP_COLLAR.forEach((p,i)=>{const q=CAMP_COLLAR[(i+1)%CAMP_COLLAR.length];for(let j=0;j<8;j++)ring.push([p[0]+(q[0]-p[0])*j/8,p[1]+(q[1]-p[1])*j/8]);});
  const c2=at([.45,.85],top);
  ring.forEach((p,i)=>{const q=ring[(i+1)%ring.length],a=at(p,under),b=at(q,under),c=at(q,top),d=at(p,top),n=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(d,a)),away=a.clone().add(c).multiplyScalar(.5).sub(c2);
   if(n.dot(away)>=0)pos.push(a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z,a.x,a.y,a.z,c.x,c.y,c.z,d.x,d.y,d.z);else pos.push(a.x,a.y,a.z,c.x,c.y,c.z,b.x,b.y,b.z,a.x,a.y,a.z,d.x,d.y,d.z,c.x,c.y,c.z);});
  let g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g=mergeVertices(g,1e-5);g.computeVertexNormals();
  // A light ink line round the collar, none along the open V: there the outline would
  // draw on the skin beside the edge and cross where the lapels meet at the button.
  const piece=part(list,g,'chest',colour),Q=piece.attributes.position,ink=piece.attributes.ink;
  for(let i=0;i<Q.count;i++){const t=(Q.getY(i)-m.hipY)/m.torso,f=Math.abs(Q.getX(i))/(W/2*latheRadius(prof,THREE.MathUtils.clamp(t,0,1.04))),edgeV=.035+(.62-.035)*THREE.MathUtils.clamp((t-.73)/.28,0,1);
   ink.setX(i,.55*THREE.MathUtils.smoothstep(f-edgeV,.04,.14));}
 }
}

function latheRadius(prof,t){for(let i=1;i<prof.length;i++){const [r0,y0]=prof[i-1],[r1,y1]=prof[i];if(t<=y1)return r0+(r1-r0)*((t-y0)/((y1-y0)||1));}return prof.at(-1)[0];}
/**
 * A part: geometry in model space, painted, bound to one bone -- or, for a limb, shared
 * between bones by a function of where each vertex is, so a joint bends as one soft piece.
 */
function part(list,geometry,bone,hex,matrix,uvAt=null){
 let g=geometry.index?geometry.toNonIndexed():geometry.clone();
 const authoredUV=geometry.userData.keepUV?g.attributes.uv.array.slice():null;
 for(const key of Object.keys(g.attributes))if(!['position','normal'].includes(key))g.deleteAttribute(key);
 if(matrix)g.applyMatrix4(matrix);
 const n=g.attributes.position.count,uv=authoredUV||new Float32Array(n*2);
 // Every part samples the garment texture; all but the torso sample its empty strip.
 if(uvAt){
  const P=g.attributes.position,q=new THREE.Vector3();
  for(let i=0;i<n;i++){q.fromBufferAttribute(P,i);const [u,v]=uvAt(q);uv[i*2]=u;uv[i*2+1]=v;}
  // A triangle across the back seam would sweep the whole texture: bring it round.
  for(let i=0;i<n;i+=3){const us=[uv[i*2],uv[i*2+2],uv[i*2+4]];if(Math.max(...us)-Math.min(...us)>.5)for(let j=0;j<3;j++)if(uv[(i+j)*2]<.5)uv[(i+j)*2]+=1;}
 }else if(!geometry.userData.keepUV)for(let i=0;i<n;i++){uv[i*2]=PLAIN_UV[0];uv[i*2+1]=PLAIN_UV[1];}
 g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 const colours=new Float32Array(n*3),index=new Uint16Array(n*4),weight=new Float32Array(n*4);
 const paint=typeof hex==='function'?hex:null,share=typeof bone==='function'?bone:null;
 if(!paint)tmpColour.set(hex);
 const p=new THREE.Vector3();
 const a=new THREE.Vector3(),b=new THREE.Vector3();
 for(let i=0;i<n;i++){
  // Painted per triangle, from its centre: a colour boundary is a clean edge between
  // two faces rather than a smear across one.
  if(paint&&i%3===0){const P=g.attributes.position;p.fromBufferAttribute(P,i);a.fromBufferAttribute(P,i+1);b.fromBufferAttribute(P,i+2);p.add(a).add(b).multiplyScalar(1/3);tmpColour.set(paint(p));}
  colours[i*3]=tmpColour.r;colours[i*3+1]=tmpColour.g;colours[i*3+2]=tmpColour.b;
  if(!share){index[i*4]=BI[bone];weight[i*4]=1;continue;}
  p.fromBufferAttribute(g.attributes.position,i);
  const w=share(p).filter(([,x])=>x>1e-3).sort((a,b)=>b[1]-a[1]).slice(0,4),sum=w.reduce((t,[,x])=>t+x,0)||1;
  w.forEach(([name,x],k)=>{index[i*4+k]=BI[name];weight[i*4+k]=x/sum;});
 }
 g.setAttribute('color',new THREE.BufferAttribute(colours,3));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(index,4));
 g.setAttribute('skinWeight',new THREE.BufferAttribute(weight,4));
 // How much ink outline this part carries (1 everywhere unless a part says otherwise).
 g.setAttribute('ink',new THREE.BufferAttribute(new Float32Array(n).fill(1),1));
 list.push(g);
 if(geometry!==g&&!geometry.userData?.keep)geometry.dispose?.();
 return g;
}
const M=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(sx,sy,sz));
/** A tube from a to b of radius r, capped round. */
function tube(list,a,b,r,bone,hex,segments=10){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),len=d.length();
 const g=new THREE.CapsuleGeometry(r,Math.max(.001,len),3,segments);
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());
 part(list,g,bone,hex,new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5),q,new THREE.Vector3(1,1,1)));
}
/**
 * A limb: one capsule from a to b, tapering from r0 to r1, its skin shared between the
 * bones along it. `joints` are [t, from, to] -- at t (0 at a, 1 at b) the skin passes
 * from one bone to the next over a soft band -- and `root` lends the top of the limb to
 * the body, so a shoulder or hip rounds off instead of hinging on a seam.
 */
function limb(list,a,b,r0,r1,hex,{bone,joints=[],root=null,soft=.13,segments=14,uvAt=null}={}){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),len=d.length(),dir=d.clone().normalize();
 // A capsule with rings all along it (three's own has none between its caps), so the
 // skin has somewhere to bend.
 const prof=[],cap=5,rows=12;
 for(let i=0;i<=cap;i++){const a=-Math.PI/2+i/cap*Math.PI/2;prof.push(new THREE.Vector2(Math.cos(a)*r0,-len/2+Math.sin(a)*r0));}
 for(let i=1;i<rows;i++)prof.push(new THREE.Vector2(r0,-len/2+i/rows*len));
 for(let i=0;i<=cap;i++){const a=i/cap*Math.PI/2;prof.push(new THREE.Vector2(Math.cos(a)*r0,len/2+Math.sin(a)*r0));}
 prof[0].x=prof.at(-1).x=0;
 const g=new THREE.LatheGeometry(prof,segments),pos=g.attributes.position;
 for(let i=0;i<pos.count;i++){
  const y=pos.getY(i),t=THREE.MathUtils.clamp(.5-y/len,0,1),k=THREE.MathUtils.lerp(r0,r1,t)/r0;
  pos.setXYZ(i,pos.getX(i)*k,y+(y>len/2?0:y<-len/2?(y+len/2)*(k-1):0),pos.getZ(i)*k);
 }
 // The lathe's own normals are kept: recomputing them would crease its seam.
 // Capsules run along +y; this one runs from a down to b.
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0),dir);
 const rel=new THREE.Vector3();
 const share=p=>{
  const t=rel.copy(p).sub(A).dot(dir)/len;
  let out=[[bone,1]];
  for(const [tj,from,to] of joints){const w=THREE.MathUtils.smoothstep(t,tj-soft,tj+soft);out=out.flatMap(([n,x])=>n===from?[[from,x*(1-w)],[to,x*w]]:[[n,x]]);}
  if(root){const w=root[1]*(1-THREE.MathUtils.smoothstep(t,-.04,root[2]??.2));out=out.map(([n,x])=>[n,x*(1-w)]);out.push([root[0],w]);}
  return out;
 };
 part(list,g,share,hex,new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(.5),q,new THREE.Vector3(1,1,1)),uvAt);
}
const ball=(list,r,at,bone,hex,s=[1,1,1],w=12,h=8)=>part(list,new THREE.SphereGeometry(r,w,h),bone,hex,M(at[0],at[1],at[2],0,0,0,...s));
/** The builder's own tools, for the wardrobe pieces built in their own modules (police-uniform.js, kerchief.js). */
const avatarKit=()=>({part,ball,tube,limb,M,HAIR,latheRadius,torsoProfile,bodyVolume,laidFrames,clothStrip});
/**
 * Smooth normals for a part that part() has split into separate triangles: each corner takes the sum of the faces that
 * meet at its position. (Recomputed per triangle, a reshaped piece of hair is faceted and its toon shadow runs in steps.)
 */
function smoothNormals(g){
 const P=g.attributes.position,N=g.attributes.normal,ids=new Int32Array(P.count),map=new Map();
 for(let i=0;i<P.count;i++){const key=Math.round(P.getX(i)*1e5)+','+Math.round(P.getY(i)*1e5)+','+Math.round(P.getZ(i)*1e5);if(!map.has(key))map.set(key,map.size);ids[i]=map.get(key);}
 const acc=new Float32Array(map.size*3),a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3();
 for(let i=0;i+2<P.count;i+=3){a.fromBufferAttribute(P,i);b.fromBufferAttribute(P,i+1).sub(a);c.fromBufferAttribute(P,i+2).sub(a);b.cross(c);for(let j=0;j<3;j++){const o=ids[i+j]*3;acc[o]+=b.x;acc[o+1]+=b.y;acc[o+2]+=b.z;}}
 for(let i=0;i<P.count;i++){const o=ids[i]*3;a.set(acc[o],acc[o+1],acc[o+2]);if(a.lengthSq()<1e-24)continue;a.normalize();N.setXYZ(i,a.x,a.y,a.z);}
 N.needsUpdate=true;
}

/**
 * Hair, as a cap over the head that stops where the face and neck begin. The cap is a
 * sphere a little bigger than the head; anywhere the style leaves bare is pulled back
 * inside the head, so the hairline is wherever the style says it is.
 */
const HAIR=Object.freeze({
 crop:{front:.46,side:.02,back:-.5,radius:1.07,faceHalf:.78},
 sidepart:{front:.4,swoop:.28,side:0,back:-.5,radius:1.08,faceHalf:.78},
 bob:{front:.24,side:-.62,back:-.66,radius:1.12,faceHalf:.64},
 longfringe:{fringe:.30,front:.24,side:-.5,back:-.7,radius:1.10,faceHalf:.72},
 long:{front:.3,side:-.62,back:-.7,radius:1.11,faceHalf:.64},
 ponytail:{front:.44,side:.02,back:-.25,radius:1.08,faceHalf:.78},
 braids:{front:.4,swoop:.26,side:-.12,back:-.6,radius:1.08,faceHalf:.74},
 longbraids:{front:.5,swoop:.31,side:-.12,back:-.6,radius:1.07,faceHalf:.76},
 bun:{front:.46,side:.02,back:-.32,radius:1.07,faceHalf:.78},
 spiky:{front:.5,side:.05,back:-.34,radius:1.08,faceHalf:.78},
 perm:{front:.42,side:-.12,back:-.44,radius:1.15,faceHalf:.74,bumps:true},
 buzz:{front:.52,side:.06,back:-.36,radius:1.025,faceHalf:.8},
 afro:{front:.48,side:-.12,back:-.5,radius:1.34,faceHalf:.74,lift:.18},
 horseshoe:{ring:true,radius:1.03},
 bald:null,
 pixie:{front:.36,swoop:.2,side:-.04,back:-.42,radius:1.06,faceHalf:.78},
 shoulder:{front:.28,side:-.42,back:-.56,radius:1.1,faceHalf:.66},
 // Parted in the middle, the fringe falling away to both sides.
 curtains:{front:.5,centre:.3,side:-.14,back:-.5,radius:1.09,faceHalf:.72},
 slick:{front:.62,side:.04,back:-.5,radius:1.04,faceHalf:.82},
 mullet:{front:.46,side:.0,back:-.78,radius:1.08,faceHalf:.78},
 // The old island topknot (katakashira): close at the sides, a knot on the crown.
 topknot:{front:.56,side:.08,back:-.36,radius:1.04,faceHalf:.8},
 pigtails:{front:.4,side:-.1,back:-.3,radius:1.08,faceHalf:.76},
 twinbuns:{front:.42,side:-.04,back:-.36,radius:1.08,faceHalf:.76},
});
function hairCap(style,flip,spec=HAIR[style]){
 if(!spec)return null;
 if(!spec.snug)return cutHairCap(style,flip,spec);
 const g=new THREE.SphereGeometry(1,64,44),pos=g.attributes.position,v=new THREE.Vector3();
 // The sphere's seam (its first and last meridian) made exactly one, so no pinholes show along it.
 for(let iy=0;iy<=44;iy++)pos.setXYZ(iy*65+64,pos.getX(iy*65),pos.getY(iy*65),pos.getZ(iy*65));
 const side=flip?-1:1;
 // How far each point is into the hair (the field below) and how much of the hair it is (0 tucked inside the head,
 // 1 on the hair's surface): the hair states (setHairState) reshape by them.
 const keepAt=new Float32Array(pos.count),fieldAt=new Float32Array(pos.count);g.userData.hairField={keep:keepAt,field:fieldAt};
 for(let i=0;i<pos.count;i++){
  v.fromBufferAttribute(pos,i);
  // The fringe: straight across, or swept down to one side from a parting.
  let front=spec.front;
  if(spec.swoop)front-=spec.swoop*THREE.MathUtils.smoothstep(v.x*side,-.3,.5);
  if(spec.centre)front-=spec.centre*THREE.MathUtils.smoothstep(Math.abs(v.x),.04,.42);
  // How far this point is inside the hair (positive) or out of it (negative): outside the
  // face opening and above the line at the sides and back. A smooth field rather than a
  // yes/no, so the hairline is a clean curve where the cap meets the head, not stair steps.
  const outFace=Math.max(.18-v.z,Math.abs(v.x)-spec.faceHalf,v.y-front);
  const low=THREE.MathUtils.lerp(spec.side,spec.back,THREE.MathUtils.smoothstep(-v.z,-.2,.7));
  // Leave a small curved opening around the ears on the original braid cap.
  // The fringe and plaits keep their original silhouette.
  const earOpening=style==='braids'&&v.z>-.32?Math.hypot((v.y+.035)/.25,(v.z-.04)/.30)-1:1;
  const f=spec.field?spec.field(v):Math.min(outFace,v.y-low,earOpening*.1),keep=f>0;
  // Bare scalp is tucked just inside the head; a close crop needs only a short step.
  // (A towel turban is snug at its edge and swells behind it: spec.snug, spec.swell; its edge goes in gently, spec.inner
  // and spec.tuck, so where it meets the skin is a smooth line across the mesh, not along its triangles.)
  const sw=spec.snug?THREE.MathUtils.smoothstep(f,0,spec.swell):1;
  const full=THREE.MathUtils.lerp(spec.snug??spec.radius,spec.radius*(1+(spec.lift&&v.y>0?v.y*spec.lift:0)),sw),inner=spec.inner??(spec.radius<1.04?.985:.8);
  const tuck=spec.tuck??.035,w=THREE.MathUtils.smoothstep(f,-tuck,tuck),r=THREE.MathUtils.lerp(inner,full,w);keepAt[i]=w;fieldAt[i]=f;
  pos.setXYZ(i,v.x*r,v.y*r+(spec.lift&&keep?spec.lift*.25*sw:0),v.z*r);
 }
 g.computeVertexNormals();
 return g;
}

/**
 * Hair cut exactly along its hairline (the creator, 2026-10-14: "The hair needs to be dynamic to fit"). The style's line is
 * a smooth field over the sphere; every triangle of the cap that the line crosses is cut where the line crosses its edges,
 * the bare part dropped, and a short wall runs from the cut down into the head. So the hairline is a smooth curve on every
 * head shape and parting (the cap is shaped with the head after), with no stair steps from the sphere's rows and columns,
 * no bare scalp tucked under the skin, and no bevel hanging in the air below a bob's ends.
 */
function cutHairCap(style,flip,spec){
 const side=flip?-1:1,smooth=THREE.MathUtils.smoothstep;
 // The line at the sides and back, and how far a point is inside the hair (positive) or out of it (negative).
 const lowAt=v=>THREE.MathUtils.lerp(spec.side,spec.back,smooth(-v.z,-.2,.7));
 const fieldOf=v=>{
  if(spec.field)return spec.field(v);
  if(spec.ring){
   // A horseshoe: a band from in front of one ear round the back to the other, low over the ears and rising well up
   // behind into a crescent with a soft wave along its top; its front ends come down as sideburns, where a beard joins.
   const a=Math.abs(Math.atan2(v.x,v.z)),back=smooth(a,1.2,Math.PI),wave=.035*Math.sin(Math.atan2(v.x,v.z)*9)*back;
   const top=.04+back*.5+wave-v.y,bottom=v.y-(-.44-back*.1),ends=a-1.08-.3*smooth(-v.y,-.04,.44);   // the sideburns narrow downward
   const m=Math.min(top,bottom),k=.2,h=Math.max(k-Math.abs(m-ends),0)/k;
   return Math.min(m,ends)-h*h*k*.25;
  }
  // The fringe: straight across (arched a little, so it frames the brow), or swept down to one side from a parting.
  let front=spec.front+.06*(v.x/spec.faceHalf)**2;
  if(spec.fringe)front+=spec.fringe*Math.pow(.5+.5*Math.cos((v.x+.08)*24),10);
  if(spec.swoop)front-=spec.swoop*smooth(v.x*side,-.3,.5);
  if(spec.centre)front-=spec.centre*smooth(Math.abs(v.x),.04,.42);
  // Outside the face's opening (its top corners rounded, so the line turns down at the temples in a curve as hair
  // grows) and above the line at the sides and back (rounded into the opening too, so a bob's ends curve).
  const a=Math.abs(v.x)-spec.faceHalf,b=v.y-front,k=.24,h=Math.max(k-Math.abs(a-b),0)/k;
  const outFace=Math.max(.18-v.z,Math.max(a,b)+h*h*k*.25);
  const c=v.y-lowAt(v),kk=.16,hh=Math.max(kk-Math.abs(outFace-c),0)/kk;
  // A small curved opening round the ears on the braids.
  const ear=style==='braids'&&v.z>-.32?Math.hypot((v.y+.035)/.25,(v.z-.04)/.30)-1:1;
  return Math.min(Math.min(outFace,c)-hh*hh*kk*.25,ear*.1);
 };
 // (A piece that covers only part of the head, a beard, takes a finer patch of the sphere: spec.patch.)
 const segments=spec.fringe?128:64,rings=spec.fringe?88:44;
 const sphere=spec.patch?new THREE.SphereGeometry(1,...spec.patch):new THREE.SphereGeometry(1,segments,rings),S=sphere.attributes.position,T=sphere.index.array;
 // The sphere's seam (its first and last meridian) made exactly one, so no pinholes show along it.
 if(!spec.patch)for(let iy=0;iy<=rings;iy++){const i=iy*(segments+1);S.setXYZ(i+segments,S.getX(i),S.getY(i),S.getZ(i));}
 const pts=[],fs=new Float32Array(S.count);
 for(let i=0;i<S.count;i++){pts.push(new THREE.Vector3().fromBufferAttribute(S,i));fs[i]=fieldOf(pts[i]);}
 const xyz=[],keep=[],field=[],tris=[],at=new Map(),cuts=new Map(),q=new THREE.Vector3();
 const add=(v,hair,f)=>{
  const r=spec.radiusAt?(hair?spec.radiusAt(v):.97):hair?spec.radius*(1+(spec.lift&&v.y>0?v.y*spec.lift:0)):Math.min(.97,spec.radius-.1);
  xyz.push(v.x*r,v.y*r+(spec.lift&&hair?spec.lift*.25:0),v.z*r);keep.push(hair?1:0);field.push(f);return keep.length-1;
 };
 const grid=i=>{if(!at.has(i))at.set(i,add(pts[i],true,fs[i]));return at.get(i);};
 // Where the line crosses an edge (halved down to it from the hair's end): its point on the hair and the wall's foot.
 const cut=(i,j)=>{
  const key=Math.min(i,j)+'|'+Math.max(i,j);
  if(!cuts.has(key)){const [a,b]=fs[i]>0?[i,j]:[j,i];let lo=0,hi=1;
   for(let n=0;n<16;n++){const t=(lo+hi)/2;if(fieldOf(q.copy(pts[a]).lerp(pts[b],t).normalize())>0)lo=t;else hi=t;}
   const p=q.copy(pts[a]).lerp(pts[b],lo).normalize().clone();cuts.set(key,{top:add(p,true,1e-4),foot:add(p,false,-.05)});}
  return cuts.get(key);
 };
 for(let t=0;t<T.length;t+=3){
  const v=[T[t],T[t+1],T[t+2]],inside=v.map(i=>fs[i]>0),n=inside.filter(Boolean).length;
  if(n===0)continue;
  if(n===3){tris.push(grid(v[0]),grid(v[1]),grid(v[2]));continue;}
  // The hair's part of the triangle, in the triangle's own winding, and the cut across it (leaving the hair, coming back).
  const poly=[];let out=null,back=null;
  for(let e=0;e<3;e++){
   const i=v[e],j=v[(e+1)%3];
   if(inside[e])poly.push(grid(i));
   if(inside[e]!==inside[(e+1)%3]){const c=cut(i,j);poly.push(c.top);if(inside[e])out=c;else back=c;}
  }
  for(let k=1;k+1<poly.length;k++)tris.push(poly[0],poly[k],poly[k+1]);
  // The wall under the cut faces out of the hair.
  tris.push(out.top,back.foot,out.foot,out.top,back.top,back.foot);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(xyz,3));g.setIndex(tris);
 // How much of the hair each point is (1 on its surface, 0 at a wall's foot) and how far into it: the hair states
 // (setHairState) reshape by them.
 g.userData.hairField={keep:Float32Array.from(keep),field:Float32Array.from(field)};
 sphere.dispose();g.computeVertexNormals();
 return g;
}

function addHair(list,recipe,m){
 const hairStart=list.length;
 const c=recipe.hair.colour,style=recipe.hair.style,side=recipe.hair.flip?-1:1;
 const R=m.Rh,cx=0,cy=m.headCentre-m.headY,S=[m.headSX*R,m.headSY*R,R*.98];
 // Hair and hat are built in head-bone space, then carried to model space.
 const at=(x,y,z)=>[x,m.headY+y,z];
 const cap=style==='longbraids'?null:hairCap(style,recipe.hair.flip);
 if(cap){const p=cap.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);shapeHeadPoint(v,m.profile);p.setXYZ(i,v.x,v.y,v.z);}cap.computeVertexNormals();
  // The cap's own field, laid out the way part() lays out its triangles (one vertex per corner, in index order).
  const hf=cap.userData.hairField,index=cap.index;
  const piece=part(list,cap,'head',c,M(cx,m.headY+cy,0,0,0,0,...S));
  if(hf&&index){const n=index.count,keep=new Float32Array(n),field=new Float32Array(n);for(let i=0;i<n;i++){const j=index.getX(i);keep[i]=hf.keep[j];field[i]=hf.field[j];}piece.userData.hairField={keep,field};}
 }
 const dark=new THREE.Color(c).multiplyScalar(.82).getStyle();
 // What hangs swings on its own chain of bones (springs.js); the rest is the head's.
 const swing=springRest(recipe,m),tailShare=chainShare('head',['hairA','hairB'],[swing.rest.hairA,swing.rest.hairB,swing.chains.find(ch=>ch.kind==='hair')?.tip??swing.rest.hairB]);
 if(style==='sweptponytail'||style==='longbraids'){
  for(const asset of SWEPT_PONYTAIL){
   if(style==='longbraids'&&asset.kind==='tail')continue;
   const positions=asset.vertices.flatMap(([x,y,z])=>{
    const p=new THREE.Vector3(x*side,y,z);if(asset.kind==='head')shapeHeadPoint(p,m.profile);
    return [p.x*m.headSX*R,m.headCentre+p.y*m.headSY*R,p.z*R*.98];
   });
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
   const indices=[...asset.indices];if(side<0)for(let i=0;i<indices.length;i+=3)[indices[i],indices[i+2]]=[indices[i+2],indices[i]];
   g.setIndex(indices);g.computeVertexNormals();part(list,g,asset.kind==='tail'?tailShare:'head',new THREE.Color(asset.colour==='scalp'?recipe.body.skin:c).multiplyScalar(asset.shade).getStyle());
  }
 }
 if(style==='longfringe')part(list,longFringeGeometry(recipe,m),tailShare,c);
 if(style==='long'){ball(list,R*.95,at(0,cy-R*.72,-R*.55),tailShare,c,[1.05,1.25,.5]);}
 if(style==='ponytail'){ball(list,R*.34,at(0,cy+R*.1,-R*1.05),'head',c,[1,1,1]);ball(list,R*.3,at(0,cy-R*.45,-R*1.18),tailShare,c,[.9,1.9,.9]);ball(list,R*.16,at(0,cy+R*.1,-R*1.2),'head',recipe.outfit.accent);}
 if(style==='bun'){ball(list,R*.42,at(0,cy+R*.95,-R*.3),'head',c);}
 if(style==='topknot'){ball(list,R*.24,at(0,cy+R*1.02,-R*.05),'head',c,[1,1.25,1.4],10,8);ball(list,R*.1,at(0,cy+R*.98,-R*.18),'head',dark,[1.3,1,1],8,6);}
 if(style==='twinbuns')for(const s of [-1,1])ball(list,R*.32,at(s*R*.62,cy+R*.82,-R*.18),'head',c);
 if(style==='pigtails')for(const s of [-1,1]){ball(list,R*.2,at(s*R*.92,cy+R*.05,-R*.25),'head',recipe.outfit.accent,[1,1,1],8,6);ball(list,R*.24,at(s*R*1.08,cy-R*.4,-R*.3),'head',c,[.9,1.8,.9]);}
 if(style==='spiky')for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const x=Math.cos(a)*R*.55,z=Math.sin(a)*R*.5-R*.1;
  const g=new THREE.ConeGeometry(R*.2,R*.5,6);part(list,g,'head',c,M(x,m.headY+cy+R*.88,z,Math.sin(a)*.5,0,-Math.cos(a)*.5));}
 if(style==='perm')for(let i=0;i<22;i++){const a=i*2.39996,y=.2+.75*((i*.618)%1);const rr=Math.sqrt(1-y*y);const x=Math.cos(a)*rr,z=Math.sin(a)*rr;if(z>.35&&y<.55)continue;ball(list,R*.24,at(x*R*1.1*m.headSX,cy+y*R*1.1,z*R*1.05),'head',i%3?c:dark,[1,1,1],8,6);}
 if(style==='braids'){
  // Plaits from behind each ear to the shoulders, in lobes, each with its tie.
  for(const s of [-1,1]){
   const x0=s*R*.8,z0=-R*.35;let y=cy-R*.35;
   const side=s>0?'L':'R',chain=swing.chains.find(ch=>ch.bones[0]==='braid'+side+'1');
   const share=chainShare('head',['braid'+side+'1','braid'+side+'2'],[swing.rest['braid'+side+'1'],swing.rest['braid'+side+'2'],chain.tip]);
   for(let i=0;i<6;i++){const r=R*(.2-i*.012);ball(list,r,at(x0+s*R*.05,y,z0+R*.05*i),share,i%2?c:dark,[1,1.3,1],8,6);y-=r*1.5;}
   ball(list,R*.13,at(x0+s*R*.05,y+R*.05,z0+R*.3),share,recipe.hair.tieColour,[1.2,.7,1.2],8,6);
   ball(list,R*.12,at(x0+s*R*.05,y-R*.12,z0+R*.3),share,c,[1,1.4,1],8,6);
  }
 }
 if(style==='longbraids'){
  // Three interwoven, tapered strands on each side; the roots start below the
  // ears and come forward over the shoulders, as in Thuan's reference photos.
  for(const s of [-1,1]){
   const points=longBraidPoints(m,s,recipe.hair),name=s>0?'L':'R',volume=.65+recipe.hair.volume*.7;
   const share=chainShare('head',['braid'+name+'1','braid'+name+'2'],points);
   const centre=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
   for(let strand=0;strand<3;strand++){
    const path=[];
    for(let i=0;i<=72;i++){
     const t=i/72,p=centre.getPoint(t),phase=t*Math.PI*(8+recipe.hair.length*10)+strand*Math.PI*2/3;
     p.x+=s*Math.sin(t*Math.PI*2)*R*.035*recipe.hair.length;
     const radius=R*.09*volume*(1-.35*t);
     p.x+=Math.sin(phase)*radius;p.z+=Math.cos(phase)*radius*.65;path.push(p);
    }
    const curve=new THREE.CatmullRomCurve3(path),g=new THREE.TubeGeometry(curve,72,R*.075*volume,8,false),P=g.attributes.position;
    for(let i=0;i<P.count;i++){
     const t=Math.floor(i/9)/72,p=curve.getPointAt(t),v=new THREE.Vector3().fromBufferAttribute(P,i);
     v.sub(p).multiplyScalar(1-.35*t).add(p);P.setXYZ(i,v.x,v.y,v.z);
    }
    g.computeVertexNormals();part(list,g,share,strand===1?dark:c);
   }
   const tip=points[2];
   part(list,new THREE.TorusGeometry(R*.083*volume,R*.022,6,12),share,recipe.hair.tieColour,M(...tip,Math.PI/2,0,0));
   ball(list,R*.073*volume,[tip[0],tip[1]-R*.13,tip[2]],share,c,[.9,1.8,.8],12,8);
  }
  // Three restrained loose wisps soften the raised crown without obscuring the face.
  for(let i=0;i<3;i++){
   const x=side*R*(.15+i*.13),y=m.headCentre+R*m.headSY*(.91-i*.03);
   const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x,y,-R*.05),new THREE.Vector3(x+side*R*.18,y+R*.14,-R*.10),new THREE.Vector3(x+side*R*.25,y+R*.04,-R*.08));
   part(list,new THREE.TubeGeometry(curve,8,R*.012,4,false),'head',i===1?dark:c);
  }
 }
 if(style==='sidepart'||style==='braids'){ball(list,R*.34,at(side*R*.5,cy+R*.62,R*.62),'head',c,[1.4,.55,.7],10,6);}
 if(FRINGE_ROLL[style]){const {y,z,r,scale}=FRINGE_ROLL[style];ball(list,R*r,at(0,cy+R*y,R*z),'head',c,scale,10,6);}
 // Hair is tucked under full hats, while fringes, braids and tails stay below them.
 // How much each hair point is tucked (head-cover.js): a fitted cap from its band up, a kerchief under its cloth, the
 // other full hats everything above the line y = 0.3.
 const tuck=recipe.outfit.hat==='police'?policeCapTuck:recipe.outfit.hat==='kerchief'?kerchiefTuck:(x,y)=>y>.3?1:0;
 if(style==='longfringe')for(const g of list.slice(hairStart))g.attributes.ink.array.fill(.35);
 if(!HAIR_OUT_HATS.includes(recipe.outfit.hat))for(const g of list.slice(hairStart)){
  const pos=g.attributes.position;g.userData.hatHair={position:pos.array.slice(),normal:g.attributes.normal.array.slice()};for(let i=0;i<pos.count;i++){
   const x=pos.getX(i)/S[0],y=(pos.getY(i)-m.headCentre)/S[1],z=pos.getZ(i)/S[2],r=Math.hypot(x,y,z);
   // (a hat may tuck some of it further in than the line under its cloth: the kerchief's fringe, under the skin)
   const target=tuck.target?tuck.target(x,y,z):1.035,w=r>target?tuck(x,y,z):0;if(w>0){const f=1+(target/r-1)*w;pos.setXYZ(i,x*f*S[0],m.headCentre+y*f*S[1],z*f*S[2]);}
  }smoothNormals(g);
 }
 // A hat from World's catalogue presses the hair in under its own band, and leaves it out of a snapback's opening above
 // the strap (hat-assets.js hatTuck): lower than the line above, all round the head.
 const assetTuck=hatTuck(recipe);
 if(assetTuck)for(const g of list.slice(hairStart)){
  const pos=g.attributes.position;for(let i=0;i<pos.count;i++){
   const x=pos.getX(i)/S[0],y=(pos.getY(i)-m.headCentre)/S[1],z=pos.getZ(i)/S[2],r=Math.hypot(x,y,z),to=assetTuck(x,y,z,r);
   if(to<r){const f=to/r;pos.setXYZ(i,x*f*S[0],m.headCentre+y*f*S[1],z*f*S[2]);}
  }g.computeVertexNormals();
 }
}

/**
 * How far out from a unit head's centre the hair's surface is in the direction v (hairCap's own field): the style's
 * radius where there is hair, and just outside the skin where the style leaves the head bare (a hair clip sits on it).
 */
function hairReach(style,flip,v){
 const spec=HAIR[style],skin=1.035;
 if(!spec||spec.ring)return skin;
 let front=spec.front;
 if(spec.swoop)front-=spec.swoop*THREE.MathUtils.smoothstep(v.x*(flip?-1:1),-.3,.5);
 if(spec.centre)front-=spec.centre*THREE.MathUtils.smoothstep(Math.abs(v.x),.04,.42);
 const outFace=Math.max(.18-v.z,Math.abs(v.x)-spec.faceHalf,v.y-front);
 const low=THREE.MathUtils.lerp(spec.side,spec.back,THREE.MathUtils.smoothstep(-v.z,-.2,.7));
 const f=spec.field?spec.field(v):Math.min(outFace,v.y-low);
 // Curls stand proud of the radius, and a lifted style (the afro) rises off it.
 const full=spec.radius*(1+(spec.lift&&v.y>0?v.y*spec.lift:0))+(spec.bumps?.05:0)+(spec.lift?spec.lift*.25:0);
 return THREE.MathUtils.lerp(skin,Math.max(skin,full),THREE.MathUtils.smoothstep(f,-.035,.035));
}

/**
 * A headband strip in unit head space: a ring of columns round the head at forehead
 * height, each point pushed out to just above the hair (or the skin, below a fringe
 * that stops higher up). Returns the geometry and where its knot sits behind.
 */
function headband(style,profile){
 const spec=HAIR[style],W=56,g=new THREE.SphereGeometry(1,W,1,0,Math.PI*2,.5,.5),pos=g.attributes.position,uv=g.attributes.uv,v=new THREE.Vector3();
 let knot=[0,.4,-1];
 for(let i=0;i<pos.count;i++){
  const u=(i%(W+1))/W,phi=u*Math.PI*2,x=Math.sin(phi),z=Math.cos(phi),back=THREE.MathUtils.smoothstep(-z,-.2,1);
  const mid=.3+back*.14,y=mid+(uv.getY(i)-.5)*.14,flat=Math.sqrt(1-y*y);
  v.set(x*flat,y,z*flat);
  // The same hair field as hairCap: is this point under hair, and how far out is it?
  let r=1.035;
  if(spec&&!spec.ring){
   const outFace=Math.max(.18-v.z,Math.abs(v.x)-spec.faceHalf,v.y-spec.front);
   const low=THREE.MathUtils.lerp(spec.side,spec.back,THREE.MathUtils.smoothstep(-v.z,-.2,.7));
   const f=Math.min(outFace,v.y-low),hair=spec.radius*(1+(spec.lift&&v.y>0?v.y*spec.lift:0))+.03;
   r=THREE.MathUtils.lerp(1.035,Math.max(1.035,hair),THREE.MathUtils.smoothstep(f,-.06,.06));
  }else if(spec?.ring&&back>.3)r=spec.radius+.03;
  v.multiplyScalar(r);shapeHeadPoint(v,profile);
  pos.setXYZ(i,v.x,v.y,v.z);
  if(Math.abs(u-.5)<1e-6&&uv.getY(i)>.5)knot=[0,v.y-.07,v.z];
 }
 g.computeVertexNormals();
 return {geometry:g,knot};
}

export function hatFit(recipe,m=measure(recipe)){
 return {brimY:m.headCentre+m.Rh*m.headSY*.55,crownHeight:m.Rh*m.headSY*.8};
}
function addHat(list,recipe,m){
 const hat=recipe.outfit.hat,c=recipe.outfit.hatColour,R=m.Rh,top=m.headCentre+R*m.headSY*.2;
 if(hat==='none')return;
 const S=[m.headSX*R,m.headSY*R,R];
 if(hat==='police'){addPoliceCap(list,recipe,m,avatarKit());return;}
 if(hat==='kerchief'){addKerchief(list,recipe,m,avatarKit());return;}
 if(hat==='cap'||hat==='captain'){
  part(list,new THREE.SphereGeometry(1.1,24,12,0,Math.PI*2,0,Math.PI*.5),'head',c,M(0,m.headCentre+R*m.headSY*.23,0,-.08,0,0,S[0],S[1]*(hat==='cap'?.9:1.05),S[2]));
  // A shallow curved visor reads as a cap bill rather than a cloth band.
  ball(list,R*.68,[0,m.headCentre+R*m.headSY*.25,R*.9],'head',hat==='cap'?c:'#1c1c24',[m.headSX*1.4,.07,1],20,8);
  if(hat==='captain'){part(list,new THREE.CylinderGeometry(R*1.12,R*1.12,R*.14,24,1,true),'head','#1c1c24',M(0,m.headCentre+R*.26,0,-.08));
   ball(list,R*.1,[0,m.headCentre+R*.62,R*1.02],'head','#e0b93a',[1,1,.4],8,6);}
 }else if(hat==='helmet'){
  if(hat!=='paperboat')part(list,new THREE.SphereGeometry(1.16,24,12,0,Math.PI*2,0,Math.PI*.52),'head',c,M(0,m.headCentre+R*m.headSY*.35,0,0,0,0,S[0],S[1]*.9,S[2]));
  part(list,new THREE.TorusGeometry(1.16,.045,6,24),'head',c,M(0,m.headCentre+R*m.headSY*.35,0,Math.PI/2,0,0,S[0],S[2],S[1]));
 }else if(hat==='straw'){
  const fit=hatFit(recipe,m),y=fit.brimY;
  // An annulus leaves room for the head; the crown has an open underside.
  part(list,new THREE.RingGeometry(R*.98,R*2.1,32),'head',c,M(0,y,0,-Math.PI/2,0,0,m.headSX,1,1));
  part(list,new THREE.RingGeometry(R*.98,R*2.1,32),'head',c,M(0,y-.012*m.k,0,Math.PI/2,0,0,m.headSX,1,1));
  part(list,new THREE.CylinderGeometry(R*.78,R*1.08,fit.crownHeight,24,1,true),'head',c,M(0,y+fit.crownHeight/2,0,0,0,0,m.headSX,1,1));
  part(list,new THREE.CircleGeometry(R*.78,24),'head',c,M(0,y+fit.crownHeight,0,-Math.PI/2,0,0,m.headSX,1,1));
  // The band in the island palette's bingata red (character-style.md section 6).
  part(list,new THREE.CylinderGeometry(R*1.045,R*1.09,R*.12*m.headSY,24,1,true),'head','#c8473a',M(0,y+R*.06*m.headSY,0,0,0,0,m.headSX,1,1));
  // A rolled edge round the brim: seen edge-on (at eye level, the maker's view and most comic shots) the brim reads as a
  // line of straw with its ink, not a broken hairline floating round the crown.
  part(list,new THREE.TorusGeometry(R*2.08,.009*m.k,6,48),'head',c,M(0,y-.006*m.k,0,Math.PI/2,0,0,m.headSX,1,1));
 }else if(hat==='beanie'){
  part(list,new THREE.SphereGeometry(1.17,20,12,0,Math.PI*2,0,Math.PI*.49),'head',c,M(0,m.headCentre+R*.12,0,0,0,0,...S));
  part(list,new THREE.TorusGeometry(1.14,.09,6,24),'head',c,M(0,m.headCentre+R*.18,0,Math.PI/2,0,0,S[0],S[2],S[1]));
  ball(list,R*.22,[0,m.headCentre+R*m.headSY*1.32,0],'head',c,[1,1,1],10,8);
 }else if(hat==='beret'){
  ball(list,R,[R*.15,m.headCentre+R*m.headSY*.83,0],'head',c,[m.headSX*1.35,.38,1.25],20,12);
  part(list,new THREE.CylinderGeometry(R*.055,R*.055,R*.15,6),'head',c,M(R*.15,m.headCentre+R*m.headSY*1.2,0));
 }else if(hat==='bucket'){
  const y=m.headCentre+R*m.headSY*.88;
  part(list,new THREE.CylinderGeometry(R*.93,R*1.13,R*.62,20),'head',c,M(0,y,0,0,0,0,m.headSX,1,1));
  part(list,new THREE.CylinderGeometry(R*1.12,R*1.5,R*.16,24,1,true),'head',c,M(0,y-R*.33,0,0,0,0,m.headSX,1,1));
 }else if(['squid','teapot','sunflower','paperboat','mountain'].includes(hat)){
  // A fitted open dome provides one consistent hat/hair boundary for every novelty.
  if(hat!=='paperboat')part(list,new THREE.SphereGeometry(1.16,24,12,0,Math.PI*2,0,Math.PI*.49),'head',c,M(0,m.headCentre+R*m.headSY*.35,0,0,0,0,S[0],S[1]*.86,S[2]));
  const y=m.headCentre+R*m.headSY*1.16;
  if(hat==='squid'){
   ball(list,R*.6,[0,y+R*.20,0],'head',c,[1,.9,1],16,12);
   for(const sx of [-1,1]){ball(list,R*.12,[sx*R*.25,y+R*.2,R*.53],'head','#f4f1ea',[1,1,.45],10,8);ball(list,R*.055,[sx*R*.25,y+R*.2,R*.59],'head','#27304d',[1,1,.4],8,6);for(const z of [-.45,.05])tube(list,[sx*R*.78,y-R*.18,z*R],[sx*R*.96,y-R*.65,z*R],R*.10,'head',c,8);}
  }else if(hat==='teapot'){
   ball(list,R*.62,[0,y+R*.14,0],'head',c,[1.15,.72,1],16,12);
   part(list,new THREE.TorusGeometry(R*.38,R*.07,8,18),'head',c,M(-R*.66,y+R*.14,0));
   part(list,new THREE.ConeGeometry(R*.17,R*.55,12),'head',c,M(R*.69,y+R*.25,0,0,0,-.9));ball(list,R*.12,[0,y+R*.67,0],'head',recipe.outfit.accent,[1,.6,1],10,8);
  }else if(hat==='sunflower'){
   for(let i=0;i<10;i++){const a=i*Math.PI/5;ball(list,R*.25,[Math.cos(a)*R*.45,y+R*.44+Math.sin(a)*R*.45,R*.25],'head','#f4d23c',[1,.65,.25],10,8);}
   ball(list,R*.29,[0,y+R*.44,R*.31],'head','#9a6a42',[1,1,.3],12,10);
  }else if(hat==='mountain'){
   part(list,new THREE.ConeGeometry(R*.75,R*.86,12),'head',c,M(0,y+R*.26,0));part(list,new THREE.ConeGeometry(R*.31,R*.38,12),'head','#f4f1ea',M(0,y+R*.69,0));
  }else{
   for(const side of [-1,1]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-R*1.25,y,side*R*.65,R*1.25,y,side*R*.65,0,y+R*.67,0],3));g.computeVertexNormals();part(list,g,'head','#f4f1ea');}
   part(list,new THREE.BoxGeometry(R*2.45,R*.16,R*.11),'head',c,M(0,y-R*.02,R*.66));
  }
 }else if(hat==='ribbon'){
  const x=R*m.headSX*.68,y=m.headCentre+R*m.headSY*.85,z=R*.52;
  for(const sign of [-1,1])ball(list,R*.2,[x+sign*R*.16,y,z],'head',c,[1.1,.7,.45],10,8);
  ball(list,R*.09,[x,y,z+R*.04],'head',c,[1,1,.7],8,6);
 }else if(hat==='hairclip'){
  // A hair slide at the temple on the parting's side (away from where a side-swept fringe falls), pinning the hair back:
  // a slim bar along the hair, slanting down to the front, with a little heart at its front end, both in the hat colour.
  // Both ends lie on the hair (or on the head, where the style leaves the temple bare), a hair's breadth off it, and it
  // goes with the head.
  const side=recipe.hair.flip?1:-1,H=[m.headSX*R,m.headSY*R,R*.98],head=m.headCentre,style=recipe.hair.style;
  // A bob's and long hair's fringe has a fuller roll across the brow (addHair: the ball at the crown's front): the slide
  // lies on it, not inside it.
  const roll=FRINGE_ROLL[style],rollAxes=roll?.scale.map(f=>f*roll.r*R),rollCentre=roll&&new THREE.Vector3(0,head+roll.y*R,roll.z*R);
  const inRoll=p=>roll?((p.x-rollCentre.x)/rollAxes[0])**2+((p.y-rollCentre.y)/rollAxes[1])**2+((p.z-rollCentre.z)/rollAxes[2])**2:2;
  // The point of the hair's surface (or the head's) in the unit direction d, carried out over the roll where it is.
  const surface=d=>{const u=d.clone().normalize(),v=u.clone().multiplyScalar(hairReach(style,recipe.hair.flip,u));shapeHeadPoint(v,m.profile);
   const p=new THREE.Vector3(v.x*H[0],head+v.y*H[1],v.z*H[2]),out=p.clone().sub(new THREE.Vector3(0,head,0)).normalize();
   for(let i=0;i<80&&inRoll(p)<1.04;i++)p.addScaledVector(out,R*.005);return p;};
  // A spot on the hair and the way out of it there, from its neighbours.
  const spot=d=>{const p=surface(d),e=.02,t1=surface(d.clone().add(new THREE.Vector3(0,e,0))).sub(surface(d.clone().add(new THREE.Vector3(0,-e,0)))),
   t2=surface(d.clone().add(new THREE.Vector3(0,0,e))).sub(surface(d.clone().add(new THREE.Vector3(0,0,-e)))),n=new THREE.Vector3().crossVectors(t1,t2).normalize();
   if(n.dot(p.clone().sub(new THREE.Vector3(0,head,0)))<0)n.negate();return {p,n};};
  // The bar runs from above and behind down to the heart at the front, each end on the hair.
  const back=spot(new THREE.Vector3(side*.6,.66,.46)),front=spot(new THREE.Vector3(side*.56,.48,.68)),lift=R*.032;
  const along=front.p.clone().sub(back.p),len=along.length();along.normalize();
  const frame=(n,dir,at,scale,geo,lean=1)=>{const up=n.clone().normalize(),fwd=dir.clone().addScaledVector(up,-dir.dot(up)).normalize(),across=new THREE.Vector3().crossVectors(up,fwd);
   const q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across,up,fwd));
   // Light ink, as on the necklace: a full outline round so small a piece breaks up into dashes.
   part(list,geo,'head',c,new THREE.Matrix4().compose(at.clone().addScaledVector(up,lift*lean),q,new THREE.Vector3(...scale))).attributes.ink.array.fill(.3);};
  const barN=back.n.clone().add(front.n).normalize();
  frame(barN,along,back.p.clone().add(front.p).multiplyScalar(.5),[R*.055,R*.03,len*.56],new THREE.SphereGeometry(1,12,6));
  // The heart: two round lobes and a point, flat on the hair at the bar's front end.
  const hs=R*.095,heart=new THREE.Shape();
  heart.moveTo(0,-hs*.95);heart.bezierCurveTo(-hs*.3,-hs*.68,-hs*1.05,-hs*.2,-hs*1.05,hs*.32);heart.bezierCurveTo(-hs*1.05,hs*.92,-hs*.32,hs*1.08,0,hs*.5);
  heart.bezierCurveTo(hs*.32,hs*1.08,hs*1.05,hs*.92,hs*1.05,hs*.32);heart.bezierCurveTo(hs*1.05,-hs*.2,hs*.3,-hs*.68,0,-hs*.95);
  const g=new THREE.ExtrudeGeometry(heart,{depth:R*.035,bevelEnabled:true,bevelThickness:R*.012,bevelSize:R*.012,bevelSegments:1,curveSegments:5});
  // The shape lies in x-y and is pressed out along z: laid flat on the hair, its point to the front.
  g.rotateX(-Math.PI/2);
  frame(front.n,along,front.p,[1,1,1],g,.9);
 }else if(hat==='headband'){
  // A hachimaki tied snug round the forehead: it follows the head (and the hair where
  // there is hair), rising a little behind, knotted at the back. Not a floating ring.
  const band=headband(recipe.hair.style,m.profile);
  part(list,band.geometry,'head',c,M(0,m.headCentre,0,0,0,0,...S));
  ball(list,R*.13,[0,m.headCentre+band.knot[1]*S[1],band.knot[2]*S[2]-R*.04],'head',c,[1.5,.8,.7],8,6);
 }
}

/**
 * Somebody's hat on its own, for a hook or a hat stand: the same pieces addHat puts on
 * their head, painted the same, as a plain mesh. 'wall' puts the back of the crown at
 * the origin with the brim facing +z; 'stand' sits the hat's rim on the origin. Null
 * for somebody who does not wear one.
 */
export function buildHatProp(input,{mode='wall',shadows=true}={}){
 const recipe=normalizeRecipe(input);
 if(recipe.outfit.hat==='none')return null;
 const parts=[],layers=[];wearHat(parts,recipe,measure(recipe),layers);
 if(!parts.length)return null;
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
 for(const key of ['skinIndex','skinWeight'])geometry.deleteAttribute(key);
 geometry.computeBoundingBox();
 const b=geometry.boundingBox,c=b.getCenter(new THREE.Vector3());
 const shift=new THREE.Vector3(-c.x,mode==='stand'?-b.min.y:-c.y,mode==='stand'?-c.z:-b.min.z);geometry.translate(shift.x,shift.y,shift.z);
 geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,celFrom(new THREE.MeshStandardMaterial({vertexColors:true}),{bands:'soft3'}));
 mesh.name=(recipe.name||'Resident')+'’s hat';mesh.castShadow=shadows;mesh.receiveShadow=true;
 mesh.userData.hatProp=true;
 // A see-through part (the trucker's mesh) hangs on it as its own layer, moved as the hat was.
 const clear=hatLayer(layers,{skinned:false,shadows});
 if(clear){clear.geometry.translate(shift.x,shift.y,shift.z);clear.geometry.computeBoundingSphere();mesh.add(clear);}
 return mesh;
}

/**
 * The hat on the head: a model from World's asset catalogue (hat-assets.js: Johansson's trucker cap), fitted to this head,
 * painted and bound to the head bone like every other part; or one of the hats drawn here (addHat). An asset hat whose model is not
 * in hand yet is drawn as its stand-in (ASSET_HATS: the trucker as the cap), so nobody is ever bare-headed for it.
 */
function wearHat(list,recipe,m,layers=null){
 const hat=recipe.outfit.hat;
 if(!isAssetHat(hat))return addHat(list,recipe,m);
 const pieces=assetHatPieces(recipe,m);
 if(!pieces)return addHat(list,{...recipe,outfit:{...recipe.outfit,hat:ASSET_HATS[hat].standIn}},m);
 for(const p of pieces){
  // A see-through part (the trucker's mesh) is not the body, which is opaque: it goes to the hat's own layer (hatLayer).
  if(p.seeThrough){if(layers)layers.push(p);else p.geometry.dispose();continue;}
  const g=part(list,p.geometry,'head',p.colour);if(!p.ink)g.attributes.ink.array.fill(0);else if(p.inkCorners)g.attributes.ink.array.set(p.inkCorners);
 }
}
/**
 * The hat's see-through layer (hat-assets.js: the trucker's mesh panels), or null: bound to the head bone of the body's
 * skeleton, in the knit's texture (weaveTexture), drawn after the opaque body without writing depth, so the hair and the
 * head show faintly through it; a child of the body, it is hidden with it (swimwear, the bath) and with the hat (setHat).
 * `skinned` false gives a plain mesh, for a hat on its own (buildHatProp). No ink: an outline shell would show through.
 */
function hatLayer(layers,{skinned=true,shadows=true}={}){
 if(!layers?.length)return null;
 const geometries=layers.map(p=>{
  const g=p.geometry,n=g.attributes.position.count,colour=new Float32Array(n*3);
  for(let i=0;i<n;i++)colour.set([p.colour.r,p.colour.g,p.colour.b],i*3);
  g.setAttribute('color',new THREE.BufferAttribute(colour,3));
  if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*2),2));
  if(skinned){const index=new Uint16Array(n*4),weight=new Float32Array(n*4);for(let i=0;i<n;i++){index[i*4]=BI.head;weight[i*4]=1;}
   g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(index,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(weight,4));}
  return g;
 });
 const geometry=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());geometry.computeBoundingSphere();
 const map=weaveTexture(layers[0].weave);
 const material=celFrom(new THREE.MeshStandardMaterial({vertexColors:true,map,transparent:true,opacity:map?1:.72,depthWrite:false,side:THREE.DoubleSide,roughness:.4}),{bands:'soft3'});
 const mesh=skinned?new THREE.SkinnedMesh(geometry,material):new THREE.Mesh(geometry,material);
 mesh.name='Hat see-through layer';mesh.castShadow=false;mesh.receiveShadow=shadows;mesh.frustumCulled=!skinned;mesh.userData.hatLayer=true;
 mesh.userData.dispose=()=>{geometry.dispose();material.dispose();};
 return mesh;
}

/** A shoe (or boot) on the foot of side s ('L' or 'R'): its upper and its sole, tagged so it can come off. */
function addShoe(list,recipe,m,s,wear){
 const o=recipe.outfit,sx=s==='L'?1:-1;
 ball(list,m.legR*1.25,[sx*m.hipX,m.foot*.62,m.legR*.55],'foot'+s,o.shoes,[1,.6,wear==='shoes'?1.85:1.75],12,8).userData.shoe=s;
 if(wear==='boots')limb(list,[sx*m.hipX,m.foot,0],[sx*m.hipX,m.foot+m.shin*.65,0],m.legR*1.08,m.legR*1.05,o.shoes,{bone:'knee'+s,joints:[]});
 // The sole: white rubber on a sneaker, dark under a leather shoe or an elder's.
 ball(list,m.legR*1.32,[sx*m.hipX,m.foot*.16,m.legR*.6],'foot'+s,wear==='shoes'?'#2b2622':recipe.age==='elder'?'#6b4a32':'#f2efe6',[1,.24,1.8],12,6).userData.shoe=s;
}
/** The sock left on a foot whose shoe has come off: pale, and a little smaller than the shoe was. */
export const SOCK=Object.freeze({colour:'#e7e1d3',size:.84});

/**
 * Somebody's shoe on its own (one that has come off: kicked off in a scuffle, left at a door): the same
 * pieces their foot wears, painted the same, inked like them, as a plain mesh. Its sole's middle is at the
 * origin, the toe towards +z. Null for somebody barefoot or in sandals.
 */
export function buildShoeProp(input,{side='R',shadows=true}={}){
 const recipe=normalizeRecipe(input),m=measure(recipe),wear=recipe.outfit.footwear;
 if(wear==='barefoot'||wear==='sandals')return null;
 const parts=[];addShoe(parts,recipe,m,side,wear);
 const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
 for(const key of ['skinIndex','skinWeight','ink'])geometry.deleteAttribute(key);
 geometry.computeBoundingBox();
 const b=geometry.boundingBox,c=b.getCenter(new THREE.Vector3());
 geometry.translate(-c.x,-b.min.y,-c.z);geometry.computeBoundingSphere();
 const mesh=new THREE.Mesh(geometry,celFrom(new THREE.MeshStandardMaterial({vertexColors:true}),{bands:'soft3'}));
 mesh.name=(recipe.name||'Resident')+'’s shoe';mesh.castShadow=shadows;mesh.receiveShadow=true;mesh.userData.shoeProp=true;
 // its ink line: the same back-faced hull as theirs, pushed out from the shoe's own middle
 const ink=geometry.clone();ink.translate(0,-(b.max.y-b.min.y)/2,0);
 const line=new THREE.Mesh(ink,outlineMaterial({skinned:false}));line.position.y=(b.max.y-b.min.y)/2;line.name=mesh.name+' outline';line.userData.outline=true;mesh.add(line);
 return mesh;
}

/** Accessories join the existing skinned mesh, adding no extra draw calls. */
function addAccessories(list,recipe,m){
 const a=recipe.accessories,R=m.Rh,c=a.colour,nc=a.necklaceColour;
 if(a.earrings!=='none')for(const sign of [-1,1]){
  const x=sign*R*m.headSX*1.035,y=m.headCentre-R*.21,z=R*.04;
  if(a.earrings==='studs')ball(list,R*.085,[x,y,z],'head',c,[1,1,.65],8,6);
  else part(list,new THREE.TorusGeometry(R*.16,R*.035,6,14),'head',c,M(x,y-R*.1,z,0,sign*.5));
 }
 if(a.neckwear==='pendant')addNecklace(list,recipe,m,nc);
 else if(a.neckwear==='scarf'){
  part(list,new THREE.TorusGeometry(m.armR*1.7,m.armR*.55,6,18),'chest',c,M(0,m.neckY-.035,0,Math.PI/2));
  part(list,new THREE.BoxGeometry(m.width*.22,m.torso*.5,.025),'chest',c,M(m.width*.14,m.neckY-m.torso*.28,m.depth*.53,0,0,-.15));
 }
 if(a.pin)ball(list,m.k*.024,[m.width*.22,m.neckY-m.torso*.28,m.depth*.52],'chest',c,[1,1,.3],8,6);
}
/**
 * A pendant necklace, worn the way people wear one: a fine chain laid on the body round the base of the neck (bodyVolume,
 * so it rests on the shoulders, never in the air and never inside them), dipping at the front to the pendant, which hangs
 * from its lowest point. Never over a collar: with a collared top the chain goes round the neck under the collar, out of
 * sight, and only its last drop and the pendant show, coming out from where the collar meets at the front (`under`: for
 * each such top, [half the gap there, its height up the torso, the pendant's height], as garment.js draws the collar);
 * under a uniform's tie, a sailor collar's scarf or a happi coat's crossed bands it does not show at all (`hidden`).
 * The chain itself is a fine line, so it carries only a hair of ink. Sizes are metres for a body of 1.6 m.
 */
export const NECKLACE=Object.freeze({clear:.012,radius:.0026,gap:.0012,front:.86,pendant:.015,anchor:1.25,
 under:Object.freeze({blouse:Object.freeze([.01,.85,.795]),smock:Object.freeze([.01,.85,.795]),apron:Object.freeze([.01,.85,.795]),
  polo:Object.freeze([.012,.95,.86]),contrastpolo:Object.freeze([.012,.95,.86]),jacket:Object.freeze([.009,.97,.84]),cardigan:Object.freeze([.009,.97,.84]),
  shirt:Object.freeze([.012,.95,.86]),vest:Object.freeze([.012,.95,.87]),knitvest:Object.freeze([.012,.96,.89])}),
 hidden:Object.freeze(['police','sailor','sailorlong','festival'])});
/**
 * Where the necklace lies on this body in its rest pose: its chain (one closed loop round the neck, or the two short drops
 * that come out from under a collar) as points on the chain's centre line, and the pendant (its middle, the way it faces
 * and its size). Null when it does not show. Pure, for tests and addNecklace.
 */
export function necklaceShape(input,m=measure(input)){
 const recipe=normalizeRecipe(input),N=NECKLACE,top=recipe.outfit.top;
 if(N.hidden.includes(top))return null;
 const vol=bodyVolume(recipe,m),W=m.width,D=m.depth,k=m.k,under=N.under[top],low=under?under[2]:N.front;
 // A point on the front of the body, x across from the middle, at the height t up the torso.
 const front=(x,t)=>vol.surf(Math.asin(THREE.MathUtils.clamp(x/(W/2*latheRadius(vol.prof,t)),-1,1)),t);
 // Laid on the body, then lifted so the chain rests on it: settled by the body's own distance, since a lift along one
 // normal lands further off a chest that curves away (a fuller build) than along a flat one.
 const rest=(N.gap+N.radius)*k;
 const lay=points=>laidFrames(vol,points).map(f=>{let s=rest;const q=new THREE.Vector3();for(let i=0;i<6;i++){q.copy(f.c).addScaledVector(f.n,s);s=THREE.MathUtils.clamp(s+rest-vol.sdf(q),rest*.5,rest*3);}return q.copy(f.c).addScaledVector(f.n,s);});
 const strands=[];
 if(under)for(const s of [-1,1])strands.push({closed:false,points:lay([0,.25,.5,.75,1].map(f=>front(s*under[0]*k*(1-f),under[1]+(low-under[1])*f)))});
 else{
  // Round the back of the neck on the shoulders' slope, `clear` off the neck, then down the front to the pendant.
  const rho=m.armR*1.08+N.clear*k,ringT=a=>vol.tAt(Math.min(1,rho*Math.hypot(Math.sin(a)/(W/2),Math.cos(a)/(D/2))));
  const A=N.anchor,tA=ringT(A),path=[];
  for(let i=0;i<24;i++){const a=A+(Math.PI*2-2*A)*i/24;path.push(vol.surf(a,ringT(a)));}
  for(let i=0;i<24;i++){const a=-A+2*A*i/24;path.push(vol.surf(a,low+(tA-low)*Math.abs(a/A)**1.5));}
  strands.push({closed:true,points:lay(new THREE.CatmullRomCurve3(path,true,'centripetal').getSpacedPoints(96).slice(0,-1))});
 }
 // The pendant: a small drop hanging from the chain's lowest point, lying on the chest.
 const size=N.pendant*k,[f]=laidFrames(vol,[front(0,low-size*1.1/m.torso)]);
 return {strands,radius:N.radius*k,pendant:{at:f.c.clone().addScaledVector(f.n,N.gap*k+size*.38),normal:f.n,size},low};
}
function addNecklace(list,recipe,m,colour){
 const shape=necklaceShape(recipe,m);if(!shape)return;
 for(const {points,closed} of shape.strands){
  const piece=part(list,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,closed,'centripetal'),closed?120:16,shape.radius,5,closed),'chest',colour);
  piece.attributes.ink.array.fill(.1);
 }
 const {at,normal,size}=shape.pendant,q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
 part(list,new THREE.SphereGeometry(1,12,8),'chest',colour,new THREE.Matrix4().compose(at,q,new THREE.Vector3(size*.72,size,size*.38))).attributes.ink.array.fill(.3);
}

/** Long hair, a lipstick or no beard and a slight build: a swimming costume, not trunks. */
export const wearsSwimTop=recipe=>recipe.facial.style==='none'&&(['longfringe','bob','long','ponytail','sweptponytail','braids','longbraids','bun','perm','shoulder','pigtails','twinbuns'].includes(recipe.hair.style)||recipe.mouth.colour!=='#b8544a');
/**
 * Swimwear (wear('swim')), modest, for Umi-no-yu's shared rock bath and the beach: a one-piece costume from the hips to
 * straight across above the bust, on two straps, with short legs, for anyone who would wear a swimsuit top; bath trunks to
 * mid-thigh for everyone else. A woman of the older generation -- an elder, or drawn with the lines of her years (wrinkles,
 * as Miss Higa is) -- wears the skirted costume her generation swam in: a little skirt over the hips.
 */
export const SWIMSUIT=Object.freeze({top:.79,trunks:.5,legs:.2});
export const wearsSwimSkirt=recipe=>wearsSwimTop(recipe)&&(recipe.age==='elder'||recipe.wrinkles>=.6);


function torsoProfile(recipe,m){
 const belly=1+(recipe.body.build-.5)*.12,hipRatio=m.hips/m.width;
 return [[0,-.1],[hipRatio*.86,-.08],[hipRatio,.05],[hipRatio,.13],[hipRatio,.15],[m.waistRatio*belly,.3],[m.waistRatio*(1+(belly-1)*.6),.5],[1,.66],[.985,.74],[.95,.8],[.88,.87],[.76,.93],[.58,.98],[.38,1.01],[.19,1.03],[0,1.04]];
}
/**
 * The body's material, carrying the painted garment. The texture is mixed over the
 * vertex colour by its alpha, so a part that samples the empty strip keeps its own
 * colour and the torso shows the cloth wherever nothing is drawn.
 */
function bodyMaterial(recipe,m){
 const canvas=document.createElement('canvas');canvas.width=GARMENT.width;canvas.height=GARMENT.height;
 const ctx=canvas.getContext('2d'),prof=torsoProfile(recipe,m);
 const marks=paintGarment(ctx,recipe,m,t=>latheRadius(prof,t))||[];
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 // Wraps round the body; no mipmaps, so distance never bleeds the drawing into the strip.
 texture.wrapS=THREE.RepeatWrapping;texture.generateMipmaps=false;texture.minFilter=THREE.LinearFilter;texture.anisotropy=4;
 const material=celFrom(new THREE.MeshStandardMaterial({vertexColors:true}),{bands:'soft3'});
 material.map=texture;
 const base=material.onBeforeCompile,key=material.customProgramCacheKey?.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{
  base?.call(material,shader,renderer);
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','').replace('#include <color_fragment>',
   '#include <color_fragment>\n#ifdef USE_MAP\n vec4 garment = texture2D( map, vMapUv );\n diffuseColor.rgb = mix( diffuseColor.rgb, garment.rgb, garment.a );\n#endif');
 };
 material.customProgramCacheKey=()=>'garment_'+(key?key():'');
 material.userData.garment={canvas,texture,marks};
 return material;
}
/** Bottoms that take stripes (bottomPattern 'stripes'): the ones that are legs of cloth. Plaid is for skirts. */
export const STRIPED_BOTTOMS=Object.freeze(['trousers','widepants','cropped','culottes']);
/**
 * Vertical stripes for trousers: a function of a point (and the x of the axis it turns round, and how many columns its
 * lathe has) to the bottom colour or the accent, alternating column by column round the leg, so every stripe is a whole
 * column of the mesh with clean edges (sx, sz undo a lathe's squash, so the columns are its own). Null when the bottoms are not striped.
 */
function bottomStripes(o,bottom,swim){
 if(swim||o.bottomPattern!=='stripes'||!STRIPED_BOTTOMS.includes(o.bottom))return null;
 return (p,x0,columns,sx=1,sz=1)=>{const a=Math.atan2((p.x-x0)/sx,p.z/sz)/(Math.PI*2)+.5;return Math.floor(a*columns+1e-6)%2?o.accent:bottom;};
}
/**
 * The fuller roll of hair across the brow of a bob and long hair, in head radii: its centre's height above the head's
 * centre and how far forward, and the ball it is made of (radius and squash). (The hair clip lies over it.)
 */
const ROLL=Object.freeze({y:.52,z:.72,r:.4,scale:Object.freeze([2,.5,.6])});
const FRINGE_ROLL=Object.freeze({bob:ROLL,long:ROLL});
/** Hats worn with the hair out, not over it: nothing tucks the hair under them. */
const HAIR_OUT_HATS=Object.freeze(['none','headband','ribbon','hairclip']);
/** swim: false for clothes, true for swimwear, 'towel' for the bare body under a bath wrap (addTowel). */
function addBody(list,recipe,m,swim=false){
 const o=recipe.outfit,skin=recipe.body.skin,top=swim?skin:o.topColour,bottom=swim?recipe.swim.colour:o.bottomColour;
 // Under a bath wrap nothing else is worn: the wrap is the garment, so nothing can show through it.
 const bare=swim==='towel',onePiece=swim===true&&wearsSwimTop(recipe);
 const W=m.width,D=m.depth,hipY=m.hipY;
 // The base layer everyone has on under their clothes: a tank top and underwear.
 const tank=!swim&&o.top==='tank',briefs=!swim&&o.bottom==='underwear';
 // A running vest after the bath (outfits.js AFTERBATH) is its own shell over the bare body, like the tank top's.
 const running=!swim&&o.top==='running';
 // The torso: a lathe, full width up to square shoulders that round off into the neck.
 // A sturdier build carries a little more round the middle, so a bare torso is shaped
 // like a body rather than a box.
 const prof=torsoProfile(recipe,m);
 const lathe=new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(r,y)),28);
 // The hem sits on a row of the lathe, so it is a clean line rather than a zigzag.
 // Underwear sits lower than a waistband.
 const waist=m.panelSkirt&&!swim?skirtSpec(m).waist:hipY+m.torso*(briefs?.05:.13);
 // Striped trousers (bottomPattern 'stripes'): the stripes run down the legs and round the seat, one lathe column each.
 const stripes=bottomStripes(o,bottom,swim);
 const torsoColour=p=>{
  if(swim)return !bare&&(p.y<waist||onePiece&&p.y<hipY+m.torso*SWIMSUIT.top)?bottom:skin;
  // (Not where the lathe closes up between the legs: there the columns would meet in a pinwheel.)
  if(p.y<waist)return stripes&&Math.hypot(p.x/(W/2),p.z/(D/2))>.55?stripes(p,0,28,W/2,D/2):bottom;
  // Under a tank top the body is bare; the vest is its own garment, added below.
  if(tank||running)return skin;
  // An open front shows the shirt under it (the accent colour); the happi coat's front is painted (garment.js). It is
  // the lathe's front columns, chosen by their angle round the body (π/14, the first column either side of the middle,
  // the band the old measure across picked down a straight chest): by distance across, a waist narrower than the chest
  // let the next column's triangles in and the shirt's edge zigzagged, and so did the shoulders where they round in.
  if(['jacket','cardigan'].includes(o.top)&&p.z>D*.18&&Math.abs(Math.atan2(p.x*D,p.z*W))<Math.PI/14)return o.accent;
  if(o.top==='sundress'&&(p.y-hipY)/m.torso>.78)return skin;
  return top;
 };
 // The shirt's details are painted, not modelled (garment.js): the torso carries the
 // garment texture's UVs, the cloth stays its vertex colour underneath.
 const torsoSkin=p=>{const chest=THREE.MathUtils.smoothstep(p.y,hipY+m.torso*.15,hipY+m.torso*.55);return [['hips',1-chest],['chest',chest]];};
 part(list,lathe,torsoSkin,torsoColour,M(0,hipY,0,0,0,0,W/2,m.torso,D/2),swim?null:p=>torsoUV(p,m));
 if(tank){
  // The vest: a thin shell over the body from the waist to straight across the chest,
  // so its edge is a clean line, and two straps that follow the shoulders over the top.
  const top0=.77,rows=prof.filter(([,y])=>y>=.05&&y<=top0).concat([[latheRadius(prof,top0),top0]]);
  const shell=new THREE.LatheGeometry(rows.map(([r,y])=>new THREE.Vector2(r*1.025,y)),28);
  part(list,shell,'chest',top,M(0,hipY,0,0,0,0,W/2,m.torso,D/2));
  const sx=.4,at=t=>{const r=latheRadius(prof,t)*1.025;return D/2*Math.sqrt(Math.max(0,r*r-sx*sx))+.004*m.k;};
  for(const side of [-1,1]){
   const x=side*W/2*sx,pts=[.77,.9,1.0].map(t=>[x,hipY+m.torso*t,at(t)]);
   pts.push([x,hipY+m.torso*1.035,0]);
   const path=pts.concat(pts.slice(0,-1).reverse().map(([px,py,pz])=>[px,py,-pz]));
   for(let i=1;i<path.length;i++)tube(list,path[i-1],path[i],.016*m.k,'chest',top,6);
  }
 }
 if(running)runningShirt(list,recipe,m,top);
 if(!swim&&o.top==='stripedvest')layeredStripedVest(list,recipe,m);
 // A one-piece costume: the torso itself is painted (torsoColour) to a clean line along a row of the lathe, and two
 // flat straps run from it over the shoulders and down the back to it again.
 if(onePiece)addStraps(list,bodyVolume(recipe,m),m,{x:W/2*.4,from:SWIMSUIT.top-.04,hw:.014*m.k,th:.003*m.k,gap:.002*m.k,colour:bottom,skin:'chest'});
 // Neck.
 tube(list,[0,m.neckY-.02,0],[0,m.headY+.01,0],m.armR*1.08,'neck',skin,8);
 // A kariyushi's open camp collar is modelled, not painted: a stand behind the neck that
 // rolls into the fall over the shoulders and folds back down the front to the V. It is
 // a real edge in silhouette and catches the light, so it reads as a collar, not a bib.
 // The collar's stand is modelled: a band of the shirt round the back and sides of the
 // neck, open at the front, rolling a little outward at the top, so the collar wraps the
 // neck from every side. Its leaves and lapels on the front are cloth too (campCollar).
 if(!swim&&o.top==='kariyushi'){
  const ri=m.armR*1.08+.004*m.k,t=.007*m.k,h=.04*m.k,roll=.012*m.k,open=.68;
  const band=new THREE.LatheGeometry([[ri,0],[ri+t,0],[ri+t+roll,h],[ri+roll*.6,h]].map(([r,y])=>new THREE.Vector2(r,y)).concat([new THREE.Vector2(ri,0)]),24,open,Math.PI*2-open*2);
  // It runs down to nothing at the front, where it turns into the collar's leaves.
  const P=band.attributes.position;for(let i=0;i<P.count;i++){const a=Math.abs(Math.atan2(P.getX(i),P.getZ(i)));P.setY(i,P.getY(i)*THREE.MathUtils.smoothstep(a,open,open+1.1));}band.computeVertexNormals();
  part(list,band,'chest',top,M(0,m.neckY-.012*m.k,0));
  campCollar(list,m,prof,top);
 }
 // The contrasting polo's collar is authored in Blender and fitted to this body.
 if(!swim&&o.top==='contrastpolo'){
  const ri=m.armR*1.08+.004*m.k;
  const band=new THREE.LatheGeometry([[ri,0],[ri+.006*m.k,0],[ri+.012*m.k,.026*m.k],[ri,.026*m.k],[ri,0]].map(([r,y])=>new THREE.Vector2(r,y)),24,.55,Math.PI*2-1.1);
  part(list,band,'chest',o.accent,M(0,m.neckY-.012*m.k,0));
  part(list,new THREE.CylinderGeometry(ri*1.12,ri*1.22,.026*m.k,32,1,true),'chest',top,M(0,m.neckY+.003*m.k,0));
  const positions=POLO_COLLAR.vertices.flatMap(([f,t,lift])=>{
   const r=latheRadius(prof,t),x=f*W/2*r,z=D/2*r*Math.sqrt(Math.max(0,1-f*f));
   return [x,hipY+t*m.torso+lift*m.k*THREE.MathUtils.smoothstep(t,.9,1.03),z+lift*m.k];
  });
  const collar=new THREE.BufferGeometry();collar.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));collar.setIndex(POLO_COLLAR.indices);collar.computeVertexNormals();
  // Front and back are both visible when a raised arm or a bow reveals the fold.
  const back=collar.clone();const I=back.index;for(let i=0;i<I.count;i+=3){const a=I.getX(i);I.setX(i,I.getX(i+2));I.setX(i+2,a);}back.computeVertexNormals();
  part(list,collar,'chest',o.accent);part(list,back,'chest',o.accent);
 }
 // A hood lies on the back; everything else on the front of a top is painted.
 if(!swim&&o.top==='hoodie')part(list,new THREE.SphereGeometry(m.width*.35,16,12,0,Math.PI*2,0,Math.PI*.75),'chest',top,M(0,m.neckY-.045,-D*.32,.9,0,0,1,.7,.55));
 // Original festival costumes are attached to the chest; limbs keep their normal rig.
 if(!swim&&['lighthouse','lantern','reef'].includes(o.top)){
  const cy=hipY+m.torso*.52;
  if(o.top==='lantern'){
   part(list,new THREE.SphereGeometry(1,24,16),'chest',top,M(0,cy,0,0,0,0,W*.63,m.torso*.55,D*.68));
   for(const t of [.12,.9])part(list,new THREE.CylinderGeometry(W*.48,W*.48,.026*m.k,24),'chest',o.accent,M(0,hipY+m.torso*t,0,0,0,0,1,1,D/W));
   for(const angle of [-.9,-.45,0,.45,.9]){const pts=[];for(let i=0;i<=10;i++){const a=-1.05+i*.21;pts.push([Math.sin(angle)*W*.64*Math.cos(a),cy+Math.sin(a)*m.torso*.55,Math.cos(angle)*D*.69*Math.cos(a)]);}for(let i=1;i<pts.length;i++)tube(list,pts[i-1],pts[i],.007*m.k,'chest',o.accent,5);}
  }else if(o.top==='lighthouse'){
   for(const t of [.25,.60])part(list,new THREE.CylinderGeometry(W*.51,W*.51,m.torso*.11,24,1,true),'chest',o.accent,M(0,hipY+m.torso*t,0,0,0,0,1,1,D/W));
   part(list,new THREE.TorusGeometry(W*.11,.012*m.k,8,18),'chest',o.accent,M(0,hipY+m.torso*.79,D*.38));
   ball(list,W*.09,[0,hipY+m.torso*.79,D*.38],'chest','#7fb0d8',[1,1,.2],12,8);
  }else{
   for(const side of [-1,1]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([side*W*.42,hipY+m.torso*.24,-D*.15,side*W*.9,hipY+m.torso*.49,-D*.15,side*W*.42,hipY+m.torso*.83,-D*.15],3));g.computeVertexNormals();part(list,g,'chest',o.accent);const back=g.clone();back.scale(1,1,-1);part(list,back,'chest',o.accent);}
   for(let i=0;i<3;i++)ball(list,.026*m.k,[(i-1)*W*.19,cy,D*.52],'chest',o.accent,[1,1,.35],8,6);
  }
 }
 if(!swim&&o.top==='apron'){
  const topY=hipY+m.torso*.75,bottomY=hipY-m.thigh*.78;
  const apron=new THREE.PlaneGeometry(W*.7,topY-bottomY,8,14);apron.translate(0,(topY+bottomY)/2,0);
  const positions=apron.attributes.position,skirt=['skirt','longskirt'].includes(o.bottom),len=o.bottom==='longskirt'?m.thigh+m.shin*.85:m.thigh*.9,cut=o.bottom==='skirt'?skirtSpec(m):null;
  for(let i=0;i<positions.count;i++){
   const y=positions.getY(i),t=(y-hipY)/m.torso;
   const radius=y>=hipY?W/2*latheRadius(prof,t):cut?skirtRadiusAt(cut,(cut.waist-y)/cut.length):skirt?THREE.MathUtils.lerp(m.hips*.53,m.hips*.66+len*.22,THREE.MathUtils.clamp((hipY+.03-y)/len,0,1)):W*.52;
   const x=positions.getX(i)*(y>hipY?1-THREE.MathUtils.clamp(t,0,1)*.25:1);
   positions.setXYZ(i,x,y,radius*D/W*Math.sqrt(Math.max(.05,1-(x/radius)**2))+.025*m.k);
  }apron.computeVertexNormals();
  // Follow the blouse above the waist and fold onto the lap below it.
  const drape=p=>{if(p.y>hipY){const chest=THREE.MathUtils.smoothstep(p.y,hipY,hipY+m.torso*.35);return [['hips',1-chest],['chest',chest]];}const leg=THREE.MathUtils.smoothstep(hipY-p.y,.02,.12),w=THREE.MathUtils.smoothstep(p.x,-W*.25,W*.25);return [['hips',1-leg],['thighL',leg*w],['thighR',leg*(1-w)]];};
  part(list,apron,drape,new THREE.Color(o.topColour).multiplyScalar(1.12).getHex());
 }

 // Arms: one soft piece from shoulder to wrist, bending at the elbow; a sleeve over the
 // top that rounds into the shoulder; a round hand.
 const longSleeve=!swim&&SLEEVED_LONG.includes(o.top);
 const coveredSleeve=!swim&&!tank&&!running&&o.top!=='sundress';
 const armT=m.upper/(m.upper+m.fore);
 for(const s of ['L','R']){
  const sx=s==='L'?1:-1,sh=[sx*m.shoulderX,m.shoulderY,0],hd=[sx*(m.shoulderX+.015),m.shoulderY-m.upper-m.fore,0];
  const arm={bone:'shoulder'+s,joints:[[armT,'shoulder'+s,'elbow'+s]]};
  // A long sleeve is the arm itself, in the shirt, with the print and the cuff painted on.
  // The shirt lining covers the upper arm underneath the sleeve, so a
  // raised arm cannot reveal a bare patch between the cap and sleeve shell.
  // Over a shirt (a vest), the sleeves, the shoulder and the underarm are the shirt's (the accent colour); under a
  // jersey's short sleeve the arm is the undershirt's to the wrist; a three-quarter sleeve (SLEEVE_END) stops on the
  // forearm.
  const sleeve=coveredSleeve&&(SHIRT_SLEEVES.includes(o.top)||ACCENT_SLEEVES.includes(o.top))?o.accent:top,below=coveredSleeve&&UNDERSHIRT_ARMS.includes(o.top)?o.accent:skin;
  const ends=longSleeve&&SLEEVE_END[o.top]?sh[1]-(m.upper+m.fore)*SLEEVE_END[o.top]:null;
  const armColour=coveredSleeve?(longSleeve?(ends===null?sleeve:p=>p.y>=ends?sleeve:skin):p=>p.y>=sh[1]-m.upper*.58?sleeve:below):skin;
  limb(list,sh,hd,m.armR*1.04,m.armR*.86,armColour,longSleeve?{...arm,uvAt:p=>sleeveUV(p,sh,hd,sx)}:arm);
  // The shoulder: a rounded cap over the joint, in the shirt, that joins the arm to the
  // torso. Its inner side stays with the chest and its outer side goes with the arm, so
  // it stretches over a raised arm rather than coming apart from the body.
  const capShare=p=>{const w=THREE.MathUtils.smoothstep(Math.abs(p.x),m.shoulderX-m.armR*1.1,m.shoulderX+m.armR*.3);return [['chest',1-w],['shoulder'+s,w]];};
  // Flattened on top so the shoulder slopes from the neck rather than standing up in a pad.
  part(list,new THREE.SphereGeometry(m.armR*1.18,16,12),capShare,swim||tank||running||o.top==='sundress'?skin:sleeve,M(sh[0]-sx*m.armR*.12,sh[1]-m.armR*.05,0,0,0,0,1,.62,Math.min(1.1,D/W*1.6)));
  // A short sleeve: one closed, rounded sleeve over the top of the arm, starting inside the
  // shoulder cap and lent to the chest at its top, so the shirt runs from the neck to the
  // hem without a seam. A kariyushi's is a little roomier and boxier, as real ones are.
  // Its print and its hem band are painted (garment.js), not separate pieces.
  if(!swim&&!longSleeve&&!tank&&!running&&o.top!=='sundress'){
   const roomy=o.top==='kariyushi',a0=[sh[0]-sx*m.armR*.05,sh[1]+m.armR*.08,0],a1=[sh[0]+sx*.008,sh[1]-m.upper*(roomy?.52:.56),0];
   limb(list,a0,a1,m.armR*(roomy?1.20:1.16),m.armR*(roomy?1.16:1.12),sleeve,{...arm,joints:[],root:['chest',.55,.3],uvAt:p=>sleeveUV(p,a0,a1,sx)});
  }
  if(coveredSleeve){
   // A closed underarm gusset shared by every sleeved top. The chest end
   // stays inside the torso while the outer end follows the upper arm.
   const a=[sx*(m.shoulderX-m.armR*.72),sh[1]-m.armR*.78,0],b=[sh[0],sh[1]-m.upper*.30,0];
   limb(list,a,b,m.armR*1.05,m.armR*1.12,sleeve,{...arm,joints:[],root:['chest',.9,.15],uvAt:p=>sleeveUV(p,a,b,sx)});
  }
  // A mitten hand: the palm, a little flattened, and a thumb on its front inner side,
  // so a wave or a point reads as a hand rather than a ball on a stick.
  ball(list,m.hand,[hd[0],hd[1]-m.hand*.55,0],'hand'+s,skin,[.9,1.15,.78],12,10);
  ball(list,m.hand*.42,[hd[0]-sx*m.hand*.55,hd[1]-m.hand*.35,m.hand*.42],'hand'+s,skin,[1,1.2,1],8,6);
 }
 // An island shirt worn out over the shorts: the hem below the waist is its own short skirt of
 // shirt, printed like the rest of it, and it swings on the hem quarters (springs.js).
 if(!swim&&o.top==='kariyushi'){
  // Its top tucks just inside the shirt above, so the two read as one piece of cloth; the
  // print is the shirt's own, painted down to this hem (garment.js).
  const hem=hemSpec(recipe,m),rTop=W/2*latheRadius(prof,(hem.waist-hipY)/m.torso)*.97;
  const ring=new THREE.CylinderGeometry(rTop,hem.rx*1.04,hem.length,32,4,true);
  part(list,ring,quarterShare(hem,()=>[['hips',1]]),top,M(0,hem.waist-hem.length/2,0,0,0,0,1,1,D/W),p=>torsoUV(p,m));
 }
 // The 1994 police jacket's modelled pieces and its skirt (police-uniform.js); its pockets, shirt and tie are painted.
 if(!swim&&o.top==='police')addPoliceJacket(list,recipe,m,prof,avatarKit(),{torsoUV,hemSpec,quarterShare});
 // A duty belt and its kit (police-data.js DUTY_BELT), out of the jacket's waist slots or on the belt over a shirt.
 if(!swim&&o.belt==='duty')addDutyBelt(list,recipe,m,prof,avatarKit(),{hemSpec,quarterShare});
 // Legs and shoes; shorts and skirts show the knees.
 const b=swim?'swim':o.bottom;
 for(const s of ['L','R']){
  const sx=s==='L'?1:-1,hp=[sx*m.hipX,hipY,0],kn=[sx*m.hipX,hipY-m.thigh,0],an=[sx*m.hipX,m.foot,0];
  const leg={bone:'thigh'+s,joints:[[m.thigh/(hipY-m.foot),'thigh'+s,'knee'+s]]};
  const trousers=b==='trousers'||b==='widepants';
  // Wide trousers are gathered at the ankle, as monpe are, so their rounded end stays inside the shoe or the sandal's sole
  // when the feet are up (a floor sit), instead of showing through it.
  const cloth=stripes?p=>stripes(p,hp[0],14):bottom;
  limb(list,hp,an,m.legR*(b==='widepants'?1.32:1.02),m.legR*.86,trousers?cloth:skin,leg);
  if(b==='cropped'||b==='culottes'){const end=b==='cropped'?m.foot+m.shin*.35:hipY-m.thigh*1.12;limb(list,hp,[hp[0],end,0],m.legR*(b==='culottes'?1.55:1.12),m.legR*(b==='culottes'?1.7:1.16),cloth,leg);}
  // Shorts and trunks: a wider piece over the top of the thigh.
  if(b==='shorts'||b==='swim'&&!bare)limb(list,[hp[0],hp[1]+m.legR*.3,0],[hp[0]*1.04,hipY-m.thigh*(b==='swim'?(onePiece?SWIMSUIT.legs:SWIMSUIT.trunks):.55),0],m.legR*1.2,m.legR*1.26,bottom,{...leg,joints:[]});
  // Long cotton drawers (ステテコ) after the bath: loose, from the waist to just below the knee, bending there.
  if(b==='suteteko'){const top=[hp[0],hp[1]+m.legR*.3,0],end=[hp[0]*1.04,hipY-m.thigh-m.shin*.18,0],len=top[1]-end[1];
   limb(list,top,end,m.legR*1.3,m.legR*1.22,bottom,{bone:'thigh'+s,joints:[[(top[1]-(hipY-m.thigh))/len,'thigh'+s,'knee'+s]]});}
  // Underwear: short briefs, snug over the top of the thigh.
  if(b==='underwear')limb(list,[hp[0],hp[1]+m.legR*.3,0],[hp[0]*1.02,hipY-m.thigh*.16,0],m.legR*1.12,m.legR*1.14,bottom,{...leg,joints:[]});
  // Feet: bare (and at the beach, and after the bath), or in sandals, sneakers or leather shoes.
  const wear=swim?'barefoot':o.footwear;
  if(wear==='barefoot'||wear==='sandals'){
   ball(list,m.legR*1.12,[sx*m.hipX,m.foot*.55,m.legR*.5],'foot'+s,skin,[1,.55,1.7],12,8);
   if(wear==='sandals'){
    // Setta: a flat sole and a thong strap over the top of the foot.
    // Deep enough that the bare foot above never shows through its underside (a broad adult's foot reaches 0.9 cm down).
    ball(list,m.legR*1.24,[sx*m.hipX,m.foot*.12,m.legR*.55],'foot'+s,recipe.age==='elder'?'#6b4a32':'#c8a878',[1,.24,1.8],12,6);
    ball(list,m.legR*.42,[sx*m.hipX,m.foot*.55+m.legR*.55,m.legR*.95],'foot'+s,o.shoes,[2.3,.5,.8],10,6);
   }
  }else addShoe(list,recipe,m,s,wear);
 }
 // The house dress's skirt and an older woman's swimsuit's little skirt are cloth round the legs (addHullSkirt).
 if(b==='housedress')addHullSkirt(list,recipe,m,'housedress',bottom);
 if(b==='swim'&&!bare&&wearsSwimSkirt(recipe))addHullSkirt(list,recipe,m,'swim',bottom);
 if(DRESS_BOTTOMS.includes(b)&&!(b==='skirt'&&o.skirtCut==='panel'&&!swim)){
  const len=skirtSpec(m,b).length;
  // The skirt hangs from the hips and, lower down, goes with the legs: seated, it lies on the lap; and a long skirt,
  // below the knee, goes with the shins, so seated it falls over them instead of sticking out past the knees like a tube.
  const drape=p=>{
   // Front and side panels track their own thigh during a stride. Retain
   // some hip/spring support behind so sitting does not lift the rear hem.
   const front=THREE.MathUtils.smoothstep(p.z,-D*.35,D*.22);
   const leg=b==='longskirt'?THREE.MathUtils.smoothstep(hipY-p.y,.02,.12):THREE.MathUtils.smoothstep(waist-p.y,len*.15,len*.85)*(.28+.72*front),w=THREE.MathUtils.smoothstep(p.x,-W*.20,W*.20);
   const shin=b==='longskirt'?THREE.MathUtils.smoothstep(hipY-p.y,m.thigh*.82,m.thigh*1.02):0;
   return [['hips',1-leg],['thighL',leg*(1-shin)*w],['thighR',leg*(1-shin)*(1-w)],['kneeL',leg*shin*w],['kneeR',leg*shin*(1-w)]];
  };
  const skirt=b==='skirt'?tailoredSkirtGeometry(m):b==='pleatedskirt'?pleatedSkirtGeometry(m,len):new THREE.CylinderGeometry(m.hips*.53,m.hips*.66+len*.22,len,32,8,true);
  const hem=hemSpec(recipe,m);
  const cloth=part(list,skirt,hem?quarterShare(hem,drape):drape,o.bottomPattern==='plaid'?(p=>{const vertical=Math.floor((Math.atan2(p.x,p.z)*12/Math.PI))%4===0,horizontal=Math.floor((hipY-p.y)/(.06*m.k))%4===0;return vertical||horizontal?o.accent:bottom;}):b==='pleatedskirt'?(p=>{
   const angle=Math.atan2(p.x,p.z*W/D),phase=((angle/(Math.PI*2)*12)%1+1)%1;
   const crease=Math.min(phase,1-phase)<.13,down=(waist-p.y)/len;
   return crease&&down>.12?new THREE.Color(bottom).multiplyScalar(.87).getStyle():bottom;
  }):bottom,M(0,waist-len/2,0,0,0,0,1,1,D/W));
  if(b==='skirt'){
   // The lining has real thickness, but no second ink shell poking through its hem.
   const P=cloth.attributes.position,N=cloth.attributes.normal,I=cloth.attributes.ink;
   for(let i=0;i<P.count;i++)I.setX(i,N.getX(i)*P.getX(i)+N.getZ(i)*P.getZ(i)<0?0:.55);
  }
  cloth.userData.fit=2;
 }
}

/**
 * The bath wrap: a yuamigi (湯浴み着), the towel-cloth wrap of a bath where people are seen.
 *
 * Nobody is ever bare at Umi-no-yu. It has a men's and a women's side, each behind its noren, a
 * lobby they share and a bath they share past the bath doors. Behind the noren grown-ups wrap
 * up in one of the bath's own terry wraps from the bandai (this): under the arms to the knees,
 * the end tucked in at the chest, for anyone who would wear a swimsuit top; from the waist to
 * the knees for everyone else. A small folded towel rests on the head, the classic way to keep
 * it out of the water and cool the head (wear('towel',{headTowel:false}) leaves it off, for
 * drying the hair at the mirror). Past the bath doors, in the washing room and the rock bath,
 * everybody wears swimwear (wear('swim')); in the lobby, the after-bath clothes (wear('afterbath')).
 * Children and teenagers keep their swimwear behind the noren too: a wrap that can come undone
 * is no garment for a child splashing about.
 *
 * The wrap is shrink-wrapped round the body: at each height it is the convex outline of the
 * torso and both legs (the arms hang outside it, over the cloth), pushed out by a small gap;
 * then, at each angle round the body, the tightest straight-sided profile that holds every
 * one of those outlines (a towel under tension spans a hollow rather than clinging to it).
 * Below the hips it eases away from the thighs, so a step or a seat moves the legs inside
 * the cloth instead of through it. Its skin is the body's own: the torso's weights above the
 * hips, the skirt's drape onto the thighs below.
 */
// Umi-no-yu's own: off-white terry with the navy band its rental towels carry (onsen-towels.js), so they come back.
export const TOWEL=Object.freeze({colour:'#f2ede2',band:'#2e3e68',fold:'#ddd5c3'});
/** Who wraps up in a bath towel: grown-ups. Children and teenagers keep their swimwear. */
export const wearsBathTowel=recipe=>recipe.age==='adult'||recipe.age==='elder';
/** What this person wears behind Umi-no-yu's noren: 'towel', or 'swim' for the young and anyone who prefers it. */
export function bathOutfit(input){const r=normalizeRecipe(input);return wearsBathTowel(r)&&r.swim.bath!=='swimwear'?'towel':'swim';}
/** Where the wrap runs: under the arms (or the waist) to just above the knee. Pure, for tests. */
export function towelSpan(recipe,m){
 const chest=wearsSwimTop(recipe);
 return {chest,top:m.hipY+m.torso*(chest?.72:.17),hem:m.hipY-m.thigh*.92};
}
/** The convex hull of [x,z] points (monotone chain), anticlockwise. */
function hull2(points){
 const p=points.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cross=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
 const lower=[],upper=[];
 for(const q of p){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),q)<=0)lower.pop();lower.push(q);}
 for(const q of p.slice().reverse()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),q)<=0)upper.pop();upper.push(q);}
 return lower.slice(0,-1).concat(upper.slice(0,-1));
}
/** How far from the body's axis a convex outline (round the axis) lies in the direction (x,z). */
function hullReach(hull,x,z){
 let best=Infinity;
 for(let i=0;i<hull.length;i++){
  const a=hull[i],b=hull[(i+1)%hull.length],ex=b[0]-a[0],ez=b[1]-a[1],den=x*ez-z*ex;
  if(Math.abs(den)<1e-12)continue;
  const t=(a[0]*ez-a[1]*ex)/den,u=(a[0]*z-a[1]*x)/den;
  if(t>0&&u>=-1e-9&&u<=1+1e-9)best=Math.min(best,t);
 }
 return best;
}
/** The body's outline at height y in its rest pose: the torso lathe and both legs, as points, `gap` outside. */
function bodySection(prof,m,y,gap){
 const pts=[],t=(y-m.hipY)/m.torso;
 if(t>=-.1&&t<=1.04){const r=latheRadius(prof,THREE.MathUtils.clamp(t,-.1,1.04));for(let i=0;i<64;i++){const a=i/64*Math.PI*2;pts.push([Math.sin(a)*(m.width/2*r+gap),Math.cos(a)*(m.depth/2*r+gap)]);}}
 // The legs as addBody makes them: a capsule from the hip to the ankle, round over the top.
 const r0=m.legR*1.02,r1=m.legR*.86;
 const r=y<=m.hipY&&y>=m.foot?THREE.MathUtils.lerp(r0,r1,(m.hipY-y)/(m.hipY-m.foot)):y>m.hipY&&y<m.hipY+r0?Math.sqrt(r0*r0-(y-m.hipY)**2):0;
 if(r>0)for(const sx of [-1,1])for(let i=0;i<32;i++){const a=i/32*Math.PI*2;pts.push([sx*m.hipX+Math.sin(a)*(r+gap),Math.cos(a)*(r+gap)]);}
 return pts;
}
/** The highest of each [y] list's linear profile: the outer (concave) envelope of (y, r) points sorted by y. */
function outerEnvelope(ys,rs){
 const idx=ys.map((_,i)=>i).sort((a,b)=>ys[a]-ys[b]),h=[];
 for(const i of idx){while(h.length>1){const o=h.at(-2),a=h.at(-1),c=(ys[a]-ys[o])*(rs[i]-rs[o])-(rs[a]-rs[o])*(ys[i]-ys[o]);if(c>=0)h.pop();else break;}h.push(i);}
 return ys.map(y=>{for(let j=1;j<h.length;j++){const a=h[j-1],b=h[j];if(y<=ys[b]+1e-12){const f=(y-ys[a])/((ys[b]-ys[a])||1);return rs[a]+(rs[b]-rs[a])*f;}}return rs[h.at(-1)];});
}
/**
 * Cloth shrink-wrapped round the body from the height `top` down to `hem`: the bath wrap (addTowel), the house dress's skirt
 * and an older woman's swimsuit skirt (addHullSkirt). At each height it is the convex outline of the torso and both legs, a
 * small gap outside, and `ease(y)` more below the hips; then, round the body, the tightest straight-sided profile that holds
 * them all. Its top is folded over and its hem turned under. Returns the cloth, its skin, and where it lies.
 */
function hullCloth(recipe,m,{top,hem,ease}){
 const span={top,hem},prof=torsoProfile(recipe,m),k=m.k,N=48,gap=.007*k,step=.012*k;
 const dirs=Array.from({length:N},(_,i)=>{const a=i/N*Math.PI*2;return [Math.sin(a),Math.cos(a)];});
 const reach=(y,g)=>{const h=hull2(bodySection(prof,m,y,g));return dirs.map(([x,z])=>hullReach(h,x,z));};
 // Rows from the hem up, so the woven band sits exactly on two of them; and every row where the torso's outline turns.
 const ys=[];for(let y=span.hem;y<span.top-step*.5;y+=step)ys.push(y);ys.push(span.top);
 for(const [,t] of prof){const y=m.hipY+t*m.torso;if(y>span.hem+step*2.5&&y<span.top-step*.5&&ys.every(v=>Math.abs(v-y)>step*.2))ys.push(y);}
 ys.sort((a,b)=>b-a);
 const want=ys.map(y=>reach(y,gap).map(r=>r+ease(y)));
 const radius=ys.map(()=>new Array(N));
 for(let i=0;i<N;i++){const env=outerEnvelope(ys,want.map(r=>r[i]));env.forEach((r,j)=>{radius[j][i]=r;});}
 // The top edge is folded over once and rolled a little proud; the hem is turned under.
 const roll=.006*k,rings=[];
 const inner=(y,r)=>rings.push({y,r});
 inner(span.top-.01*k,reach(span.top-.01*k,gap*.35));
 rings.push({y:span.top+.004*k,r:radius[0].map(r=>r+roll*.5)});
 ys.forEach((y,j)=>rings.push({y,r:radius[j].map(r=>r+roll*(1-THREE.MathUtils.smoothstep(span.top-y,0,.016*k)))}));
 const hemR=radius.at(-1),hemIn=reach(span.hem+.004*k,gap*.35);
 rings.push({y:span.hem-.005*k,r:hemR.map(r=>r-.003*k)});
 rings.push({y:span.hem+.003*k,r:hemR.map((r,i)=>Math.max(hemIn[i],r-.011*k))});
 const pos=[],index=[];
 for(const ring of rings)for(let i=0;i<N;i++)pos.push(dirs[i][0]*ring.r[i],ring.y,dirs[i][1]*ring.r[i]);
 for(let j=0;j+1<rings.length;j++)for(let i=0;i<N;i++){const a=j*N+i,b=j*N+(i+1)%N,c=(j+1)*N+i,d=(j+1)*N+(i+1)%N;index.push(a,c,b,b,c,d);}
 // Its inside: a lining a few millimetres in, facing in, from the top down to the row above the turned hem, so a look
 // into the hem (seated, from the front) finds the cloth's inner face rather than the dark inside of its ink line. It
 // carries no ink of its own (lining, the triangles from that index on).
 const lining=index.length,inset=.0035*k,first=rings.length;
 for(let j=0;j<ys.length-1;j++)for(let i=0;i<N;i++){const r=radius[j][i]-inset;pos.push(dirs[i][0]*r,ys[j],dirs[i][1]*r);}
 for(let j=0;j+1<ys.length-1;j++)for(let i=0;i<N;i++){const a=(first+j)*N+i,b=(first+j)*N+(i+1)%N,c=(first+j+1)*N+i,d=(first+j+1)*N+(i+1)%N;index.push(a,b,c,b,d,c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();
 // Skin: exactly the torso's above the hips; below, the skirt's drape onto each thigh.
 const share=p=>{
  if(p.y>=m.hipY){const chest=THREE.MathUtils.smoothstep(p.y,m.hipY+m.torso*.15,m.hipY+m.torso*.55);return [['hips',1-chest],['chest',chest]];}
  const leg=THREE.MathUtils.smoothstep(m.hipY-p.y,.02*k,.12*k),w=THREE.MathUtils.smoothstep(p.x,-m.hipX,m.hipX);
  return [['hips',1-leg],['thighL',leg*w],['thighR',leg*(1-w)]];
 };
 return {geometry:g,share,span,rings,dirs,ys,radius,step,lining};
}
/** A hull cloth's part: its lining (from `lining` on in the index, three corners a triangle in part()'s order) without ink. */
function unInk(piece,lining){piece.attributes.ink.array.fill(0,lining);return piece;}
/** The terry wrap round the body, and the end tucked in at the front. Returns where it lies, for the tuck and tests. */
function addTowel(list,recipe,m){
 const k=m.k,s0=towelSpan(recipe,m);
 // Below the hips the cloth stands off the thighs: room for a stride or a seat.
 const {geometry:g,share,span,rings,dirs,ys,radius,step,lining}=hullCloth(recipe,m,{top:s0.top,hem:s0.hem,ease:y=>.028*k*THREE.MathUtils.smoothstep(m.hipY-y,0,m.thigh*.9)});
 span.chest=s0.chest;const N=dirs.length;
 // Off-white terry, matte, with Umi-no-yu's navy band woven a hand's width above the hem.
 const band=[span.hem+step*4.02,span.hem+step*4.98];
 unInk(part(list,g,share,p=>p.y>band[0]&&p.y<band[1]?TOWEL.band:TOWEL.colour),lining);
 // The end of the towel overlaps at the front, on the wearer's left, where the right hand
 // tucks it in: its edge runs down the wrap from the top to the hem, and the corner is tucked
 // under at the top, a small fold standing just proud of the cloth.
 const ti=Math.round(.42/(Math.PI*2)*N),nx=dirs[ti][0],nz=dirs[ti][1],lift=.0025*k;
 const edge=ys.map((y,j)=>new THREE.Vector3(nx*(radius[j][ti]+lift),y,nz*(radius[j][ti]+lift)));
 part(list,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge),ys.length*2,.0032*k,6,false),share,TOWEL.fold);
 const fold=.0045*k,y0=span.top-.006*k,y1=y0-.03*k,r=Math.max(radius[0][ti],radius[Math.min(3,ys.length-1)][ti]);
 part(list,new THREE.SphereGeometry(1,10,12),share,TOWEL.fold,M(nx*(r+fold*.3),(y0+y1)/2,nz*(r+fold*.3),0,Math.atan2(nx,nz),.5,.016*k,(y0-y1)/2,fold));
 return {span,rings,dirs};
}
/**
 * Skirts that are cloth round the legs rather than a bell from the hips (hullCloth), so seated they lie on the lap as the
 * wrap does instead of standing up over it, and are fitted out of the legs and onto the seat as they are drawn (fit):
 * - the house dress's (after the bath): from just above the waist (where the bodice is sewn on) to just below the knee,
 *   loose, flaring a little to the hem;
 * - an older woman's swimsuit's (wearsSwimSkirt): from the waist to the top of the thigh.
 * Heights: `top` a fraction of the torso above the hips, `hem` a fraction of the thigh below them; `ease` and `flare`
 * (per thigh length down) in metres for a body of 1.6 m.
 */
export const HULL_SKIRTS=Object.freeze({
 housedress:Object.freeze({top:.2,hem:1.06,ease:.024,flare:.03}),
 swim:Object.freeze({top:.13,hem:.42,ease:.016,flare:.03}),
});
function addHullSkirt(list,recipe,m,kind,colour){
 const S=HULL_SKIRTS[kind],k=m.k;
 const {geometry,share,lining}=hullCloth(recipe,m,{top:m.hipY+m.torso*S.top,hem:m.hipY-m.thigh*S.hem,
  ease:y=>{const d=Math.max(0,m.hipY-y);return k*(S.ease*THREE.MathUtils.smoothstep(d,0,m.thigh*.9)+S.flare*d/m.thigh);}});
 const piece=unInk(part(list,geometry,share,colour),lining);piece.userData.fit=true;return piece;
}
/**
 * The folded towel on the head, lying on the crown (or the hair) and draped to its shape: each
 * point of its underside is dropped onto the head from above, so it rests rather than floats,
 * and nothing of the head comes through it. It is the head bone's, so it goes where the head goes.
 */
function addHeadTowel(list,m,surfaces){
 const k=m.k,R=m.Rh,lx=R*m.headSX*1.15,lz=R*.72,th=.026*k,rad=th*.5,cz=-R*.06,gap=.0025*k;
 // One smooth piece (shared vertices), so its ink line follows it rather than splitting at the edges.
 let g=new THREE.BoxGeometry(lx,th,lz,16,2,10);g.deleteAttribute('uv');g.deleteAttribute('normal');g=mergeVertices(g,1e-7);
 const P=g.attributes.position,v=new THREE.Vector3(),q=new THREE.Vector3();
 const half=new THREE.Vector3(lx/2-rad,0,lz/2-rad);
 for(let i=0;i<P.count;i++){v.fromBufferAttribute(P,i);q.set(THREE.MathUtils.clamp(v.x,-half.x,half.x),0,THREE.MathUtils.clamp(v.z,-half.z,half.z));const d=v.clone().sub(q);if(d.lengthSq()>1e-14)d.setLength(rad);v.copy(q).add(d);P.setXYZ(i,v.x,v.y,v.z);}
 const surface=new THREE.Mesh(mergeGeometries(surfaces.map(s=>{const c=new THREE.BufferGeometry();c.setAttribute('position',s.attributes.position.clone());return c;}),false),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
 const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),from=new THREE.Vector3(),d=.006*k;
 const ground=(x,z)=>{let top=-Infinity;for(const [ox,oz] of [[0,0],[d,0],[-d,0],[0,d],[0,-d]]){ray.set(from.set(x+ox,m.H+1,z+oz),down);const hit=ray.intersectObject(surface,false)[0];if(hit)top=Math.max(top,hit.point.y);}return top;};
 const cache=new Map();
 for(let i=0;i<P.count;i++){const x=P.getX(i),z=P.getZ(i)+cz,key=x.toFixed(5)+','+z.toFixed(5);if(!cache.has(key))cache.set(key,ground(x,z));P.setXYZ(i,x,cache.get(key)+gap+P.getY(i)+th/2,z);}
 surface.geometry.dispose();g.computeVertexNormals();
 // Folded in four, with the end of its band showing along one fold.
 const b0=-lx/2+lx*11/16,b1=-lx/2+lx*12/16;
 part(list,g,'head',p=>p.x>b0&&p.x<b1?TOWEL.band:TOWEL.colour);
}

/**
 * Cloth laid on the body: the running vest and its straps, the tenugui round the neck.
 *
 * The body here is its rest pose's volume as addBody builds it -- the torso lathe, the two shoulder caps and the neck --
 * as an approximate signed distance (metres, negative inside). A strip of cloth is laid along a centre line on it: each
 * point across the strip is dropped onto the body along the body's normal there and lifted `gap` off it (its inner face)
 * and `gap+th` (its outer), so it lies on the body, bends with it and is never inside it. The strips are the chest's, and
 * the chest carries the torso's top, so they stay where they were laid in every pose.
 */
export function bodyVolume(recipe,m){
 const prof=torsoProfile(recipe,m),W=m.width,D=m.depth,neckR=m.armR*1.08,n0=m.neckY-.02,n1=m.headY+.01,top=m.hipY+1.04*m.torso;
 const caps=[1,-1].map(sx=>({c:new THREE.Vector3(sx*m.shoulderX-sx*m.armR*.12,m.shoulderY-m.armR*.05,0),r:new THREE.Vector3(m.armR*1.18,m.armR*1.18*.62,m.armR*1.18*Math.min(1.1,D/W*1.6))}));
 const sdf=p=>{
  const t=(p.y-m.hipY)/m.torso;
  let d=t<-.1||t>1.04?Math.hypot(p.x,p.z,p.y-top):(Math.hypot(p.x/(W/2),p.z/(D/2))-latheRadius(prof,t))*Math.min(W,D)/2;
  for(const {c,r} of caps)d=Math.min(d,(Math.hypot((p.x-c.x)/r.x,(p.y-c.y)/r.y,(p.z-c.z)/r.z)-1)*r.y);
  return Math.min(d,Math.hypot(p.x,p.y-THREE.MathUtils.clamp(p.y,n0,n1),p.z)-neckR);
 };
 const h=.002*m.k,q=new THREE.Vector3();
 const normal=p=>{const n=new THREE.Vector3();for(const [ax,k] of [['x',0],['y',1],['z',2]]){q.copy(p);q[ax]+=h;const a=sdf(q);q[ax]-=2*h;n.setComponent(k,a-sdf(q));}return n.normalize();};
 /** p dropped onto the body along n (the outermost surface on that line) and lifted `lift` off it. */
 const layOn=(p,n,lift,reach=.1*m.k)=>{
  const steps=50,step=2*reach/steps;let hit=null;
  for(let i=0;i<=steps;i++){q.copy(p).addScaledVector(n,reach-i*step);if(sdf(q)<0){hit=reach-i*step;break;}}
  if(hit===null)return p.clone().addScaledVector(n,lift);
  let a=hit,b=hit+step;for(let k=0;k<22;k++){const mid=(a+b)/2;q.copy(p).addScaledVector(n,mid);if(sdf(q)<0)a=mid;else b=mid;}
  return p.clone().addScaledVector(n,b+lift);
 };
 return {prof,sdf,normal,layOn,surf:(a,t)=>{const r=latheRadius(prof,t);return new THREE.Vector3(Math.sin(a)*W/2*r,m.hipY+t*m.torso,Math.cos(a)*D/2*r);},
  /** The height t (upper torso, above the shoulder line) at which the lathe's radius is r. */
  tAt:r=>{for(let i=prof.length-1;i>0;i--){const [r0,t0]=prof[i],[r1,t1]=prof[i-1];if(t1<.66)break;if((r-r0)*(r-r1)<=0)return t0+(t1-t0)*((r-r0)/((r1-r0)||1));}return .66;}};
}
/**
 * A strip of cloth along `frames` ({c: centre, side: across, n: off the body, lay}): laid (lay true), on the body as
 * bodyVolume.layOn puts it; free, where its frame puts it in the air, pushed `gap` clear of the body. `hw` is half its
 * width, `th` its thickness. A frame may give its row of points instead (`across`: [inner, outer] for each of the
 * `across`+1). Returns an indexed geometry with smooth normals, and each vertex's fraction along it.
 */
function clothStrip(vol,frames,{hw,th,gap,across=6}){
 const N=frames.length,J=across,pos=[],along=[],index=[],v=new THREE.Vector3(),g=new THREE.Vector3();
 for(let i=0;i<N;i++){
  const f=frames[i],row=[];
  for(let j=0;j<=J;j++){
   if(f.across){row.push(f.across[j]);continue;}
   v.copy(f.c).addScaledVector(f.side,(j/J*2-1)*hw);
   if(f.lay){row.push([vol.layOn(v,f.n,gap),vol.layOn(v,f.n,gap+th)]);continue;}
   const a=v.clone().addScaledVector(f.n,-th/2),b=v.clone().addScaledVector(f.n,th/2);
   // In the air: both faces moved together, out of the body, until the nearer is `gap` clear of it.
   for(let k=0;k<8;k++){const d=Math.min(vol.sdf(a),vol.sdf(b));if(d>=gap)break;g.copy(vol.normal(vol.sdf(a)<vol.sdf(b)?a:b)).multiplyScalar(gap-d+1e-4);a.add(g);b.add(g);}
   row.push([a,b]);
  }
  for(let layer=0;layer<2;layer++)for(let j=0;j<=J;j++){const p=row[j][layer];pos.push(p.x,p.y,p.z);along.push(i/(N-1));}
 }
 const at=(i,layer,j)=>i*2*(J+1)+layer*(J+1)+j,P=k=>new THREE.Vector3(pos[k*3],pos[k*3+1],pos[k*3+2]);
 const quad=(a,b,c,d,want)=>{const n=P(b).sub(P(a)).cross(P(c).sub(P(a)));if(n.dot(want)<0)index.push(a,c,b,a,d,c);else index.push(a,b,c,a,c,d);};
 for(let i=0;i<N;i++){
  const f=frames[i],t=frames[Math.min(N-1,i+1)].c.clone().sub(frames[Math.max(0,i-1)].c).normalize(),n=t.clone().cross(f.side).normalize();
  // which way is out of the cloth's face here: across the thickness, from the inner face to the outer
  const out=P(at(i,1,J>>1)).sub(P(at(i,0,J>>1)));if(out.lengthSq()>1e-14)n.copy(out.normalize());
  if(i<N-1)for(let j=0;j<J;j++){quad(at(i,1,j),at(i+1,1,j),at(i+1,1,j+1),at(i,1,j+1),n);quad(at(i,0,j),at(i+1,0,j),at(i+1,0,j+1),at(i,0,j+1),n.clone().negate());}
  if(i<N-1){quad(at(i,0,0),at(i+1,0,0),at(i+1,1,0),at(i,1,0),f.side.clone().negate());quad(at(i,0,J),at(i+1,0,J),at(i+1,1,J),at(i,1,J),f.side);}
  if(i===0||i===N-1)for(let j=0;j<J;j++)quad(at(i,0,j),at(i,0,j+1),at(i,1,j+1),at(i,1,j),i===0?t.clone().negate():t);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setIndex(index);geometry.computeVertexNormals();
 return {geometry,along:Float32Array.from(along)};
}
/** Frames along a centre line laid on the body: each point dropped onto it, the strip's width across it. */
function laidFrames(vol,points){
 const c=points.map(p=>vol.layOn(p,vol.normal(p),0));
 return c.map((p,i)=>{const n=vol.normal(p),t=c[Math.min(c.length-1,i+1)].clone().sub(c[Math.max(0,i-1)]).normalize();return {c:p,n,side:t.clone().cross(n).normalize(),lay:true};});
}

/**
 * The running vest (ランニングシャツ) after the bath: white cotton from below the waist of the drawers to a deep scoop at
 * the neck front and back, cut away under the arms, on two flat straps over the shoulders. The body of it is a shell
 * round the torso, its top edge one smooth curve (so a clean line, not a stair of triangles); the straps are strips laid
 * on the shoulders that run down over the shell's edge. Its skin is the torso's own at every height.
 */
export const RUNNING_VEST=Object.freeze({hem:.02,neckFront:.8,neckBack:.86,straps:.92,armhole:.7,strapAt:.52,gap:.006});
function layeredStripedVest(list,recipe,m){
 const vol=bodyVolume(recipe,m),W=m.width,D=m.depth,k=m.k;
 const skin=p=>{const chest=THREE.MathUtils.smoothstep(p.y,m.hipY+m.torso*.15,m.hipY+m.torso*.55);return [['hips',1-chest],['chest',chest]];};
 const make=(points,hw,across=3)=>{
  const frames=laidFrames(vol,points),g=part(list,clothStrip(vol,frames,{hw,th:.002*k,gap:.007*k,across}).geometry,skin,recipe.outfit.topColour);
  g.attributes.ink.array.fill(.22);
 };
 for(const side of [-1,1]){
  const points=[.38,.48,.60,.72,.84,.94].map(t=>{
   const x=side*W*(.32-.04*(t-.38)),r=latheRadius(vol.prof,t);
   return new THREE.Vector3(x,m.hipY+t*m.torso,D/2*Math.sqrt(Math.max(.001,r*r-(x/(W/2))**2)));
  });
  make(points,W*.105);
  const x=side*W*.27,top=vol.tAt(Math.abs(x)/(W/2)+.02);
  const arc=[];
  for(const zsign of [1,-1])for(let i=0;i<=6;i++){
   const t=THREE.MathUtils.lerp(.89,top,zsign===1?i/6:1-i/6),r=latheRadius(vol.prof,t);
   arc.push(new THREE.Vector3(x,m.hipY+t*m.torso,zsign*D/2*Math.sqrt(Math.max(0,r*r-(x/(W/2))**2))));
  }
  make(arc,W*.10,2);
 }
 make([.38,.52,.68,.82,.91].map(t=>vol.surf(Math.PI,t)),W*.37,6);
}

function runningShirt(list,recipe,m,colour){
 const vol=bodyVolume(recipe,m),V=RUNNING_VEST,W=m.width,D=m.depth,k=m.k;
 // Its top edge round the body, by the angle from the front: the scoop, the strap's root, the armhole, the back's scoop.
 const knots=[[0,V.neckFront],[V.strapAt,V.straps],[Math.PI/2,V.armhole],[Math.PI-V.strapAt,V.straps],[Math.PI,V.neckBack]];
 const edge=a=>{a=Math.abs(((a+Math.PI)%(Math.PI*2)+Math.PI*2)%(Math.PI*2)-Math.PI);for(let i=1;i<knots.length;i++){const [a0,t0]=knots[i-1],[a1,t1]=knots[i];if(a<=a1)return t0+(t1-t0)*THREE.MathUtils.smoothstep(a,a0,a1);}return V.neckBack;};
 const cols=112,rows=18,pos=[],index=[];
 for(let i=0;i<=cols;i++){const a=i/cols*Math.PI*2,tTop=edge(a);
  for(let j=0;j<=rows;j++){const t=V.hem+(tTop-V.hem)*j/rows,r=latheRadius(vol.prof,t);pos.push(Math.sin(a)*(W/2*r+V.gap*k),m.hipY+t*m.torso,Math.cos(a)*(D/2*r+V.gap*k));}}
 for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){const a=i*(rows+1)+j,b=(i+1)*(rows+1)+j;index.push(a,b,a+1,b,b+1,a+1);}
 let shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));shell.setIndex(index);
 shell=mergeVertices(shell,1e-6);shell.computeVertexNormals();
 const torsoSkin=p=>{const chest=THREE.MathUtils.smoothstep(p.y,m.hipY+m.torso*.15,m.hipY+m.torso*.55);return [['hips',1-chest],['chest',chest]];};
 part(list,shell,torsoSkin,colour);
 // The straps: from a little below the shell's edge at the front, over the shoulder between the neck and the shoulder's
 // round, to the same below the edge at the back, lying just over the shell.
 addStraps(list,vol,m,{x:Math.sin(V.strapAt)*W/2*latheRadius(vol.prof,V.straps),from:V.straps-.05,hw:.019*k,th:.003*k,gap:(V.gap+.0015)*k,colour,skin:torsoSkin});
}
/**
 * Two flat straps laid over the shoulders, `x` either side of the middle, from the height `from` up the front, over the
 * top between the neck and the shoulder's round, and down the back to `from` again (the running vest's, a swimsuit's).
 */
function addStraps(list,vol,m,{x,from,hw,th,gap,colour,skin}){
 const W=m.width,D=m.depth;
 for(const sx of [1,-1]){
  const px=sx*x,pts=[],tTop=vol.tAt(Math.abs(px)/(W/2)+.02);
  for(const side of [1,-1])for(let i=0;i<=24;i++){const t=from+(tTop-from)*(side>0?i/24:1-i/24),r=latheRadius(vol.prof,t);
   pts.push(new THREE.Vector3(px,m.hipY+t*m.torso,side*D/2*Math.sqrt(Math.max(0,r*r-(px/(W/2))**2))));}
  // in order from the front root over the top to the back root, evenly spaced
  const ordered=pts.slice(0,25).concat(pts.slice(26));
  const frames=laidFrames(vol,new THREE.CatmullRomCurve3(ordered).getSpacedPoints(36));
  const strap=part(list,clothStrip(vol,frames,{hw,th,gap,across:4}).geometry,skin,colour);
  strap.attributes.ink.array.fill(.6);
 }
}

/**
 * The bath's tenugui round a man's neck after the bath: a thin cotton towel folded to a band, laid round the back of the
 * neck on the shoulders' slope, its two ends down the chest over the vest. Umi-no-yu's own, off-white with the navy band
 * its towels carry near each end. All the chest's, so it goes where the chest goes; it stands off the neck, which turns
 * inside it, and the chin, which nods above it.
 *
 * 'flag' (setTenugui): a gust has the two ends: from where they leave the shoulders they stream away the way the wind
 * blows, over the shoulders, rippling, the cloth on edge to it as a flag is. Every shape is a pure function of where the
 * wind blows and the moment (time), so the same call always draws the same cloth.
 */
// The navy band: rows `band` from each end of the strip (of samples), so its edges run straight across the cloth.
// Round the back of the neck it keeps `clear` (metres, for 1.6 m) between its inner edge and the neck; its ends leave the
// shoulders at `anchor` radians either side of the front and hang to `end` of the torso's height. In a gust (flag) the wind
// lifts it off from `lift` radians either side of the front, behind the neck, and the rest streams.
export const TENUGUI=Object.freeze({clear:.012,anchor:.72,lift:1.9,end:.42,halfWidth:.03,thickness:.006,gap:.012,band:Object.freeze([4,7]),samples:85});
function tenuguiShape(recipe,m,{state='rest',direction=Math.PI,time=0}={}){
 const vol=bodyVolume(recipe,m),T=TENUGUI,W=m.width,D=m.depth,k=m.k;
 // Round the neck at a set distance from it, wherever on the shoulders' slope that is: lower behind, where the neck is nearer
 // the back, than at the sides.
 const rho=m.armR*1.08+(T.halfWidth+T.clear)*k,ringT=a=>vol.tAt(Math.min(1,rho*Math.hypot(Math.sin(a)/(W/2),Math.cos(a)/(D/2))));
 const onRing=a=>vol.surf(a,ringT(a)),tA=ringT(T.anchor),xA=Math.abs(onRing(T.anchor).x);
 const down=(sx,t)=>{const x=sx*xA*(1+(tA-t)*.1),r=latheRadius(vol.prof,t);return new THREE.Vector3(x,m.hipY+t*m.torso,D/2*Math.sqrt(Math.max(0,r*r-(x/(W/2))**2)));};
 // From the right end's tip up the chest, round the back of the neck, and down to the left end's tip.
 const drop=[T.end,.6,.72,.82,.9,tA-.035];
 const ctrl=[...drop.map(t=>down(-1,t)),onRing(Math.PI*2-T.anchor)];
 for(let i=1;i<=7;i++)ctrl.push(onRing(Math.PI*2-T.anchor-i/8*(Math.PI*2-2*T.anchor)));
 ctrl.push(onRing(T.anchor),...drop.slice().reverse().map(t=>down(1,t)));
 const curve=new THREE.CatmullRomCurve3(ctrl,false,'centripetal'),rest=laidFrames(vol,curve.getSpacedPoints(T.samples-1));
 // The two anchors: where the ends leave the shoulders.
 const nearest=p=>rest.reduce((best,f,i)=>f.c.distanceTo(p)<rest[best].c.distanceTo(p)?i:best,0);
 const anchors=[nearest(ctrl[drop.length]),nearest(ctrl[drop.length+8])],lifted=[nearest(onRing(Math.PI*2-T.lift)),nearest(onRing(T.lift))];
 let frames=rest;
 if(state==='flag'){
  // A gust from in front of him or from a side blows the ends behind him or away to the side. One from behind him would
  // stream them forward, through his arms; it is drawn as from the side, and so is one from straight ahead's other half.
  const hd=new THREE.Vector3(Math.sin(direction),0,Math.cos(direction));if(hd.z>0)hd.set(Math.sign(hd.x)||1,0,0);
  const up=new THREE.Vector3(0,1,0),across=up.clone().cross(hd).normalize();
  frames=rest.slice();
  for(const [a,step,sx] of [[lifted[0],-1,-1],[lifted[1],1,1]]){
   const o=new THREE.Vector3(sx,0,0),count=step<0?a:rest.length-1-a;
   let length=0;for(let i=a;i!==a+step*count;i+=step)length+=rest[i].c.distanceTo(rest[i+step].c);
   // Each end first goes back from the neck, over the top of the back, and only then turns with the wind; the end on the far
   // side from the wind drops as it goes, so it crosses the upper back well under the head to reach the other side.
   const back=new THREE.Vector3(0,0,-1),far=o.dot(hd)<-.2;
   const first=(far?o.clone().multiplyScalar(.3).addScaledVector(back,.6).addScaledVector(up,-.7):o.clone().multiplyScalar(.2).addScaledVector(back,.8).addScaledVector(up,.12)).normalize();
   const last=hd.clone().addScaledVector(back,.35).addScaledVector(o,Math.max(0,o.dot(hd))*.3).addScaledVector(up,far?-.05:.06).normalize(),ds=length/count;
   const p=rest[a].c.clone(),s0=rest[a].side.clone(),flagUp=up.clone().multiplyScalar(Math.sign(s0.dot(up))||1);
   const centres=[];
   for(let n=1;n<=count;n++){const tau=n/count;p.addScaledVector(first.clone().lerp(last,THREE.MathUtils.smoothstep(tau,0,.45)).normalize(),ds);
    const ripple=Math.sin(Math.PI*2*(1.3*tau-.9*time)+(sx>0?0:1.7))*.1*length*tau;
    centres.push(p.clone().addScaledVector(across,ripple).addScaledVector(up,Math.sin(Math.PI*2*(.8*tau-.7*time)+sx)*.03*length*tau));}
   for(let n=1;n<=count;n++){
    const c=centres[n-1],prev=n>1?centres[n-2]:rest[a].c,next=centres[Math.min(count-1,n)],t=next.clone().sub(prev).normalize();
    const tau=n/count,w=s0.clone().lerp(flagUp,THREE.MathUtils.smoothstep(tau,.12,.5));w.addScaledVector(t,-w.dot(t)).normalize();
    frames[a+step*n]={c,side:w,n:w.clone().cross(t).normalize(),lay:false};
   }
  }
 }
 const {geometry,along}=clothStrip(vol,frames,{hw:T.halfWidth*k,th:T.thickness*k,gap:T.gap*k,across:6});
 return {geometry,along,anchors};
}
/**
 * The tenugui as a part of the body: painted, inked lightly, skinned as the torso under it is at each height (the chest's
 * round the neck, the torso's blend of chest and hips lower down the ends), so it moves exactly with what it lies on.
 * Returns the piece and its index (for setTenugui).
 */
function addTenugui(list,recipe,m){
 const {geometry,along}=tenuguiShape(recipe,m),index=geometry.index.array.slice();
 const torsoSkin=p=>{const chest=THREE.MathUtils.smoothstep(p.y,m.hipY+m.torso*.15,m.hipY+m.torso*.55);return [['hips',1-chest],['chest',chest]];};
 const piece=part(list,geometry,torsoSkin,TOWEL.colour),C=piece.attributes.color,band=new THREE.Color(TOWEL.band),last=TENUGUI.samples-1;
 const [b0,b1]=TENUGUI.band.map(r=>r/last),rows=[[b0,b1],[1-b1,1-b0]];
 // A whole quad of the cloth is in the band or out of it, so its edges are straight lines across.
 for(let i=0;i<index.length;i+=3){const a=[along[index[i]],along[index[i+1]],along[index[i+2]]],lo=Math.min(...a),hi=Math.max(...a);
  if(rows.some(([x,y])=>lo>=x-1e-6&&hi<=y+1e-6))for(let j=0;j<3;j++)C.setXYZ(i+j,band.r,band.g,band.b);}
 piece.attributes.ink.array.fill(.55);
 return {piece,index};
}

/**
 * A towel turban (after the bath, the women): the bath's terry towel wound round the head over the drying hair, the hair
 * all inside it, built so it reads as a towel and never as hair:
 * - a tall soft dome over the crown and the back, its sides no lower than the twist, so nothing off-white hangs by the
 *   face to be taken for hair; taller than any hairstyle;
 * - its front edge twisted into a fat two-ply roll from above one ear across the forehead to the other, as thick as the
 *   towel is deep there, so it rests on the forehead and covers the dome's edge (a clean line between the towel and the
 *   face, no strip of towel to be taken for a fringe), Umi-no-yu's navy band showing in the twist;
 * - the towel's hem round the back from one end of the twist to the other, lying on its lower edge (a clean line between
 *   the towel and the head), Umi-no-yu's navy stripe woven in;
 * - the edge of the outer turn of towel, a soft ridge from the twist's end over the crown to the tucked end;
 * - the end tucked in at the back of the crown, a flap with its band near the edge, coming out from under that turn.
 * Long hair needs more towel round it: a fuller dome (LONG_HAIR).
 */
const LONG_HAIR=new Set(['longfringe','bob','long','ponytail','braids','longbraids','bun','perm','shoulder','pigtails','twinbuns','afro','mullet','curtains']);
export const TURBAN=Object.freeze({front:.54,side:.3,back:-.48,lift:.16,radius:1.17,longRadius:1.23,snug:1.05,swell:.3,inner:.96,tuck:.08,
 twist:Object.freeze({reach:1.45,radius:.11,turns:1.5,band:Object.freeze([.5,.63])}),
 hem:Object.freeze({rows:Object.freeze([-.03,0,.03,.06,.09,.13,.17,.2]),band:Object.freeze([.09,.17])}),flap:Object.freeze({from:2.38,to:2.95,band:Object.freeze([.6,.78])})});
function addTurban(list,recipe,m){
 const T=TURBAN,R=m.Rh,S=[m.headSX*R,m.headSY*R,R*.98],long=LONG_HAIR.has(recipe.hair.style),rad=long?T.longRadius:T.radius,C=new THREE.Vector3(0,m.headCentre,0);
 // Its edge, a smooth line all round: across the forehead at `front`, down under the twist's ends to `side` above the ears,
 // and round the back down to `back`. (Not the hair's face opening, whose corners would show at the temples below the twist.)
 const low=z=>THREE.MathUtils.lerp(T.side,T.back,THREE.MathUtils.smoothstep(-z,-.2,.7));
 const field=d=>d.y-low(d.z)-(T.front-T.side)*(1-THREE.MathUtils.smoothstep(Math.abs(Math.atan2(d.x,d.z)),1.1,T.twist.reach));
 const spec={front:T.front,side:T.side,back:T.back,radius:rad,faceHalf:1,lift:T.lift,snug:T.snug,swell:T.swell,inner:T.inner,tuck:T.tuck,field};
 const dome=hairCap(null,false,spec);
 const p=dome.attributes.position,v=new THREE.Vector3();for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);shapeHeadPoint(v,m.profile);p.setXYZ(i,v.x,v.y,v.z);}dome.computeVertexNormals();
 const hf=dome.userData.hairField,di=dome.index,domePiece=part(list,dome,'head',TOWEL.colour,M(0,m.headCentre,0,0,0,0,...S));
 // Where its edge is inside the head it has no ink of its own.
 for(let i=0;i<di.count;i++)domePiece.attributes.ink.setX(i,THREE.MathUtils.smoothstep(hf.field[di.getX(i)],-.03,.02));
 // A point of the dome's surface in a direction (unit, before the head's shaping), `off` of its radius further out: the
 // same field and radius hairCap gives the dome.
 const at=(d,off=0)=>{const sw=THREE.MathUtils.smoothstep(field(d),0,T.swell),r=THREE.MathUtils.lerp(T.snug,rad*(1+Math.max(0,d.y)*T.lift),sw)*(1+off);
  const q=shapeHeadPoint(new THREE.Vector3(d.x*r,d.y*r+T.lift*.25*sw,d.z*r),m.profile);return new THREE.Vector3(q.x*S[0],C.y+q.y*S[1],q.z*S[2]);};
 const out=d=>at(d,.02).sub(at(d)).normalize(),round=(phi,y)=>{const h=Math.sqrt(Math.max(0,1-y*y));return new THREE.Vector3(Math.sin(phi)*h,y,Math.cos(phi)*h);};
 // The dome's own surface normal there (it swells away from its edge, so it is not the radial direction).
 const normalAt=d=>{const u=new THREE.Vector3(Math.abs(d.y)<.9?0:1,Math.abs(d.y)<.9?1:0,0).cross(d).normalize(),w=d.clone().cross(u),e=.01;
  const step=(a,k)=>at(d.clone().addScaledVector(a,k).normalize());
  const n=step(u,e).sub(step(u,-e)).cross(step(w,e).sub(step(w,-e))).normalize();return n.dot(at(d).sub(C))<0?n.negate():n;};
 // A strip of towel lying on the dome (the tucked end): laid along a line of directions.
 const onDome={layOn:(q,n,l)=>q.clone().addScaledVector(n,l),sdf:()=>1,normal:()=>new THREE.Vector3()};
 const framesOn=dirs=>{const c=dirs.map(d=>at(d)),n=dirs.map(normalAt);return c.map((q,i)=>{const t=c[Math.min(c.length-1,i+1)].clone().sub(c[Math.max(0,i-1)]).normalize();return {c:q,n:n[i],side:t.clone().cross(n[i]).normalize(),lay:true};});};
 const paintAlong=(piece,index,along,band,colour)=>{const P=piece.attributes.color,c=new THREE.Color(colour);
  for(let i=0;i<index.length;i+=3){const a=[along[index[i]],along[index[i+1]],along[index[i+2]]];if(Math.min(...a)>=band[0]-1e-6&&Math.max(...a)<=band[1]+1e-6)for(let j=0;j<3;j++)P.setXYZ(i+j,c.r,c.g,c.b);}return piece;};
 // The twist: right over the dome's front edge, from above one ear, across the forehead, to above the other, so the roll
 // covers the edge and meets the skin of the forehead under it (no strip of towel to be taken for a fringe).
 const W=T.twist,N=72,RAD=10,edgeAt=phi=>round(phi,THREE.MathUtils.lerp(T.front+.02,T.side+.04,THREE.MathUtils.smoothstep(Math.abs(phi),1.1,W.reach)));
 // Its middle stands off the snug edge by the roll's own reach, so the roll rests on the dome's edge and the forehead.
 const cr=T.snug+1.05*W.radius,twistAt=d=>{const q=shapeHeadPoint(new THREE.Vector3(d.x*cr,d.y*cr,d.z*cr),m.profile);return new THREE.Vector3(q.x*S[0],C.y+q.y*S[1],q.z*S[2]);};
 for(const strand of [0,1]){
  const line=[];
  for(let i=0;i<=N;i++){const s=i/N,phi=-W.reach+2*W.reach*s,d=edgeAt(phi),rs=R*W.radius,n=out(d),c=twistAt(d);
   const t=twistAt(edgeAt(phi+.01)).sub(c).normalize(),b=t.clone().cross(n).normalize(),ang=s*W.turns*Math.PI*2+strand*Math.PI;
   line.push(c.addScaledVector(n,Math.cos(ang)*rs*.45).addScaledVector(b,Math.sin(ang)*rs*.45));}
  const tube=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(line),N*2,R*W.radius*.66,RAD,false),index=tube.index.array.slice();
  const along=new Float32Array(tube.attributes.position.count).map((_,i)=>Math.floor(i/(RAD+1))/(N*2));
  paintAlong(part(list,tube,'head',strand?TOWEL.fold:TOWEL.colour),index,along,W.band,TOWEL.band);
  for(const e of [line[0],line.at(-1)])ball(list,R*W.radius*.66,e.toArray(),'head',strand?TOWEL.fold:TOWEL.colour,[1,1,1],10,8);
 }
 // The towel's hem round the back, from under one end of the twist to the other: a band of towel lying on the dome's
 // edge, Umi-no-yu's navy stripe woven in, its lower edge on the skin, so the line between the towel and the head is a
 // clean curve (the dome itself goes in under it, out of sight). Its rows follow the edge, so the stripe's edges are smooth.
 const yAt=(phi,f)=>{let a=-.95,b=.97;for(let k=0;k<30;k++){const y=(a+b)/2;if(field(round(phi,y))<f)a=y;else b=y;}return (a+b)/2;};
 const hemAt=(d,off)=>{const f=field(d);if(f>=0)return at(d,off);
  const r=THREE.MathUtils.lerp(1.006,T.snug,THREE.MathUtils.smoothstep(f,-.03,0))*(1+off),q=shapeHeadPoint(new THREE.Vector3(d.x*r,d.y*r,d.z*r),m.profile);
  return new THREE.Vector3(q.x*S[0],C.y+q.y*S[1],q.z*S[2]);};
 const H=T.hem,J=H.rows.length-1,hemFrames=[];
 // Narrower towards its ends, so it comes out from under the twist's ends rather than standing above them.
 const h0=W.reach-.06,h1=Math.PI*2-h0;
 for(let i=0;i<=64;i++){const phi=h0+(h1-h0)*i/64,k=THREE.MathUtils.lerp(.3,1,THREE.MathUtils.smoothstep(Math.min(phi-h0,h1-phi),0,.4));
  const across=H.rows.map(f=>{const d=round(phi,yAt(phi,f*k));return [hemAt(d,.003),hemAt(d,.016)];});
  hemFrames.push({c:across[J>>1][1],side:across[J][0].clone().sub(across[0][0]).normalize(),across});}
 const hem=clothStrip(null,hemFrames,{hw:0,th:0,gap:0,across:J}).geometry,hindex=hem.index.array.slice(),hemPiece=part(list,hem,'head',TOWEL.colour);
 hemPiece.attributes.ink.array.fill(.7);
 {const P=hemPiece.attributes.color,c=new THREE.Color(TOWEL.band),f=k=>H.rows[k%(J+1)];
  for(let i=0;i<hindex.length;i+=3){const a=[f(hindex[i]),f(hindex[i+1]),f(hindex[i+2])];if(Math.min(...a)>=H.band[0]-1e-6&&Math.max(...a)<=H.band[1]+1e-6)for(let j=0;j<3;j++)P.setXYZ(i+j,c.r,c.g,c.b);}}
 // The edge of the outer turn of towel: a soft ridge from under the twist's left end, up over the crown, to the top of
 // the tucked end at the back, which comes out from under it. It stays on the towel, never on the face.
 const F=T.flap,f0=round(-W.reach,T.side+.06),f1=round(Math.PI,Math.sin(F.from)+.03),fold=[];
 for(let i=0;i<=24;i++){const s=i/24;fold.push(at(f0.clone().lerp(f1,s).add(new THREE.Vector3(0,.7*Math.sin(Math.PI*s),0)).normalize(),.012));}
 part(list,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fold,false,'centripetal'),48,R*.032,8,false),'head',TOWEL.fold);
 for(const e of [fold[0],fold.at(-1)])ball(list,R*.032,e.toArray(),'head',TOWEL.fold,[1,1,1],8,6);
 // The tucked end at the back, under the turn, its band near the edge.
 const flapDirs=[];for(let i=0;i<=16;i++){const a=F.from+(F.to-F.from)*i/16;flapDirs.push(new THREE.Vector3(0,Math.sin(a),Math.cos(a)));}
 const flap=clothStrip(onDome,framesOn(flapDirs),{hw:R*.2,th:R*.03,gap:R*.008,across:6}),findex=flap.geometry.index.array.slice();
 paintAlong(part(list,flap.geometry,'head',TOWEL.colour),findex,flap.along,F.band,TOWEL.band);
}

/**
 * Ink outlines for people: an inverted hull.
 *
 * The town's ink is a screen pass over the depth buffer, which finds a building's
 * silhouette but loses a person against whatever is behind them, and never draws the
 * line where hair meets face (docs/AMPLIFY-AUDIT.md, C5). So every avatar carries a
 * second, back-faced copy of its body pushed out along the normals, as Guilty Gear
 * Xrd and most cel-shaded games draw their characters. It shares the body's geometry
 * and skeleton, so it animates with it and the hat's draw range applies to both.
 * The line takes a darkened version of the colour under it rather than black, so a
 * yellow shirt gets an ochre line and skin a warm brown, the way an animator inks.
 */
export const OUTLINE_WIDTH=.011;
const outlineMaterials=new Map();
export function outlineMaterial({skinned=true,colour=null,width=OUTLINE_WIDTH}={}){
 const key=(skinned?'s':'m')+(colour??'v')+width;
 if(outlineMaterials.has(key))return outlineMaterials.get(key);
 const material=new THREE.MeshBasicMaterial({color:colour??0xffffff,vertexColors:colour==null,side:THREE.BackSide});
 material.name='Shimanchu outline';material.userData.outline=true;
 const uniform={value:width};
 material.onBeforeCompile=shader=>{
  shader.uniforms.uOutline=uniform;
  shader.vertexShader='uniform float uOutline;\n'+shader.vertexShader.replace('#include <project_vertex>',
   (skinned?'vec3 outlineN = normalize( objectNormal ) * ink;\n':'vec3 outlineN = normalize( position );\n')+
   'transformed += outlineN * uOutline;\n#include <project_vertex>');
  if(skinned)shader.vertexShader='attribute float ink;\n'+shader.vertexShader;
  if(colour==null)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n diffuseColor.rgb *= vec3( 0.32, 0.27, 0.27 );');
 };
 material.customProgramCacheKey=()=>'shimanchu-outline-'+key;
 outlineMaterials.set(key,material);return material;
}
function addOutline(parent,mesh,skinned){
 const line=skinned?new THREE.SkinnedMesh(mesh.geometry,outlineMaterial({skinned:true})):new THREE.Mesh(mesh.geometry,outlineMaterial({skinned:false,colour:0x4a3028}));
 line.name=mesh.name+' outline';line.castShadow=false;line.receiveShadow=false;line.frustumCulled=false;line.userData.outline=true;
 if(skinned){line.bind(mesh.skeleton,mesh.bindMatrix);parent.add(line);}else mesh.add(line);
 return line;
}

/** The face texture and the head it lives on. */
function buildHead(recipe,m,faceSize){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=faceSize;
 const ctx=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 let g=new THREE.SphereGeometry(1,36,26);
 const pos=g.attributes.position,uv=g.attributes.uv,v=new THREE.Vector3();
 // The face is projected onto the front of the sphere; everything else samples the
 // canvas edge, which is plain skin.
 const PHI0=Math.PI/2-.95,PHI=1.9,TH0=Math.PI*.28,TH=Math.PI*.58;
 for(let i=0;i<pos.count;i++){
  v.fromBufferAttribute(pos,i);
  const phi=Math.atan2(v.z,-v.x),theta=Math.acos(THREE.MathUtils.clamp(v.y,-1,1));
  uv.setXY(i,THREE.MathUtils.clamp((phi-PHI0)/PHI,.002,.998),THREE.MathUtils.clamp(1-(theta-TH0)/TH,.002,.998));
  shapeHeadPoint(v,m.profile);pos.setXYZ(i,v.x,v.y,v.z);
 }
 g.scale(m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98);g.computeVertexNormals();
 // The face is shaded as if it were flat and tipped up to the light, as a drawn face
 // is: a sphere's own normals put a hard shadow line straight across the cheeks.
 const nrm=g.attributes.normal,n=new THREE.Vector3(),toward=new THREE.Vector3(0,.4,.92).normalize();
 for(let i=0;i<nrm.count;i++){n.fromBufferAttribute(nrm,i);n.lerp(toward,THREE.MathUtils.smoothstep(n.z,-.35,.45)*.7).normalize();nrm.setXYZ(i,n.x,n.y,n.z);}
 // atan2 wraps on the rear/side seam. Interpolating from u=0 to u=1
 // across a triangle paints the whole face there, including red lips.
 // Give those triangles their own plain-skin UVs, retaining smooth normals.
 const indexed=g;g=indexed.toNonIndexed();indexed.dispose();
 const P=g.attributes.position,U=g.attributes.uv;
 for(let i=0;i<P.count;i+=3){
  const us=[U.getX(i),U.getX(i+1),U.getX(i+2)];
  const rear=P.getZ(i)<=0&&P.getZ(i+1)<=0&&P.getZ(i+2)<=0;
  if(rear||Math.max(...us)-Math.min(...us)>.5)
   for(let j=0;j<3;j++)U.setXY(i+j,.002,.002);
 }
 // Cel-shaded like the town, on its high-key ramp, and a little self-lit so a face in
 // a dim room still reads. Every head form, the soft sculpted one too (the owner, 24 October 2026: Vy's "shiny 3d head"
 // must be cel shaded like the rest of the characters).
 const material=celFrom(new THREE.MeshStandardMaterial({map:texture,roughness:.82,emissive:0xffffff,emissiveMap:texture,emissiveIntensity:.05}),{bands:'soft3'});
 // Keep the painted eyes, brows and mouth readable in dim scenes before any Look
 // converts the picture to paper/ink. A floor on albedo lighting leaves daylight
 // unchanged, unlike adding more emission to every face at every hour.
 const faceCompile=material.onBeforeCompile,faceKey=material.customProgramCacheKey.bind(material);
 material.onBeforeCompile=(shader,renderer)=>{faceCompile.call(material,shader,renderer);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',
   'outgoingLight = max( outgoingLight, diffuseColor.rgb * 0.5 );\n#include <opaque_fragment>');
 };
 material.customProgramCacheKey=()=>faceKey()+':face-light-floor-v1';
 const head=new THREE.Mesh(g,material);head.name='Shimanchu head';
 head.position.y=m.headCentre-m.headY;
 if(INK_NOSES[recipe.nose.style])head.add(inkNoseBump(recipe,m,material,{PHI0,PHI,TH0,TH}));
 // The scruffy beard is painted on a shell (the other beards are built: beard-mesh.js).
 const beard=recipe.facial?.paint==='scruff'?beardShell(m,faceSize):null;if(beard)head.add(beard.mesh);
 return {head,canvas,ctx,texture,beard};
}

/**
 * The painted beard's shell: the lower head's own surface, lifted a hair off the skin, with a canvas of its own laid out in
 * degrees round the head (BEARD_SHELL, drawBeardShell). The face's canvas only reaches about 54° either side of the front,
 * short of the jaw's outline; this reaches round past the ears and down under the chin, so a beard meets both outlines.
 */
function beardShell(m,faceSize){
 const {A,T0}=BEARD_SHELL,a=A*Math.PI/180,t0=T0*Math.PI/180;
 const canvas=document.createElement('canvas');canvas.width=faceSize*2;canvas.height=Math.round(faceSize*1.125);
 const ctx=canvas.getContext('2d');
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 // Three's sphere puts a point at (−cos φ sin θ, cos θ, sin φ sin θ), the head's own mapping, so u runs with φ and v with θ.
 const g=new THREE.SphereGeometry(1,56,28,Math.PI/2-a,2*a,t0,Math.PI-t0);
 const pos=g.attributes.position,v=new THREE.Vector3();
 for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i);shapeHeadPoint(v,m.profile).multiplyScalar(1.012);pos.setXYZ(i,v.x,v.y,v.z);}
 g.scale(m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98);g.computeVertexNormals();
 // Leaned toward the light as the face's normals are, so the beard shades with the face beneath it.
 const nrm=g.attributes.normal,n=new THREE.Vector3(),toward=new THREE.Vector3(0,.4,.92).normalize();
 for(let i=0;i<nrm.count;i++){n.fromBufferAttribute(nrm,i);n.lerp(toward,THREE.MathUtils.smoothstep(n.z,-.35,.45)*.7).normalize();nrm.setXYZ(i,n.x,n.y,n.z);}
 const material=celFrom(new THREE.MeshStandardMaterial({map:texture,transparent:true,alphaTest:.04}),{bands:'soft3'});
 material.depthWrite=false;
 const mesh=new THREE.Mesh(g,material);mesh.name='Shimanchu painted beard';mesh.renderOrder=1;mesh.castShadow=false;mesh.receiveShadow=true;
 return {mesh,canvas,ctx,texture};
}

/**
 * The ink noses' bump (the creator, 2026-10-14: "They need a 3d bump too"): a low, smooth rise of the face under the drawn
 * line, so the nose stands off the face in profile and catches the light, as a Mii's does. It wears the face's own canvas,
 * its points mapped onto it the way the head's are, so the line drawn on the face runs over the bump unbroken.
 */
function inkNoseBump(recipe,m,material,{PHI0,PHI,TH0,TH}){
 const L=faceLayout(recipe),k=.7+recipe.nose.size*.7;
 const theta=TH0+(L.noseY-7*k)/256*TH,phi=PHI0+L.noseX/256*PHI;   // centred a little above the tip, where the bridge rises
 const at=shapeHeadPoint(new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),m.profile);
 const S=[m.Rh*m.headSX,m.Rh*m.headSY,m.Rh*.98],w=m.Rh*(.08+recipe.nose.size*.05),h=w*1.4,d=m.Rh*(.11+recipe.nose.size*.07);
 const g=new THREE.SphereGeometry(1,24,16,0,Math.PI*2,0,Math.PI*.5);g.rotateX(Math.PI/2);   // a dome, its top facing +z
 const pos=g.attributes.position,uv=g.attributes.uv,v=new THREE.Vector3(),centre=new THREE.Vector3(at.x*S[0],at.y*S[1],at.z*S[2]);
 const out=centre.clone().divide(new THREE.Vector3(S[0]*S[0],S[1]*S[1],S[2]*S[2])).normalize();   // the face's normal there
 const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),out);
 for(let i=0;i<pos.count;i++){
  v.fromBufferAttribute(pos,i);v.set(v.x*w,v.y*h,v.z*d-d*.3).applyQuaternion(q).add(centre);pos.setXYZ(i,v.x,v.y,v.z);
  // Where this point falls on the face's canvas: back through the head's scale to the sphere, then the head's own mapping.
  const n=v.clone().set(v.x/S[0],v.y/S[1],v.z/S[2]).normalize(),p=Math.atan2(n.z,-n.x),t=Math.acos(THREE.MathUtils.clamp(n.y,-1,1));
  uv.setXY(i,THREE.MathUtils.clamp((p-PHI0)/PHI,.002,.998),THREE.MathUtils.clamp(1-(t-TH0)/TH,.002,.998));
 }
 g.computeVertexNormals();
 // Lit like the face: its normals leaned the same way toward the light, so the bump shades softly and never darkly.
 const nrm=g.attributes.normal,nn=new THREE.Vector3(),toward=new THREE.Vector3(0,.4,.92).normalize();
 for(let i=0;i<nrm.count;i++){nn.fromBufferAttribute(nrm,i);nn.lerp(toward,.45).normalize();nrm.setXYZ(i,nn.x,nn.y,nn.z);}
 const bump=new THREE.Mesh(g,material);bump.name='Shimanchu nose';return bump;
}

/** A built beard (beard-mesh.js): cut from the head's sphere like the hair, shaped with the head, worn on every body. */
function addBeard(parts,recipe,m){
 const spec=beardSpec(recipe);if(!spec)return;
 const g=cutHairCap(null,false,spec),p=g.attributes.position,v=new THREE.Vector3(),ink=new Float32Array(p.count);
 for(let i=0;i<p.count;i++){
  v.fromBufferAttribute(p,i);
  // Ink only where the beard stands off the face: where it lies thin on the skin (its rooted top edge) an outline would
  // draw a hard line across the cheek.
  ink[i]=THREE.MathUtils.smoothstep(v.length()-1.004,.008,.03);
  shapeHeadPoint(v,m.profile);p.setXYZ(i,v.x,v.y,v.z);
 }
 g.computeVertexNormals();
 const piece=part(parts,g,'head',recipe.facial.colour,M(0,m.headCentre,0,0,0,0,m.headSX*m.Rh,m.headSY*m.Rh,m.Rh*.98)),I=g.index;
 for(let k=0;k<I.count;k++)piece.attributes.ink.setX(k,ink[I.getX(k)]);
}

function addNose(parts,recipe,m){
 addBeard(parts,recipe,m);   // (every body that has a nose has the beard too)
 if(recipe.nose.style==='none'||INK_NOSES[recipe.nose.style])return;   // an ink nose is all drawn on the face
 const layout=faceLayout(recipe),theta=Math.PI*.28+layout.noseY/256*Math.PI*.58,phi=Math.PI/2-.95+layout.noseX/256*1.9;
 const v=shapeHeadPoint(new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),m.profile);
 const hook=recipe.nose.style==='hook',wide=recipe.nose.style==='wide';
 const radius=m.Rh*(.065+recipe.nose.size*.055);
 ball(parts,radius,[v.x*m.Rh*m.headSX,m.headCentre+v.y*m.Rh*m.headSY,v.z*m.Rh*.98+radius*.55],'head',recipe.body.skin,
  [wide?1.45:.85,hook?1.55:.85,hook?1.65:1.2],12,10);
}

/**
 * Hair states (avatar.setHairState): the hair a body already has (its cap and its pieces) reshaped, so they work with any
 * hairstyle and in any outfit where the hair shows (under a turban or a towel on the head it does not, and nothing changes):
 * - 'halfDry': caught half way through drying: one side (the right unless told: the dryer is in the right hand) dry and
 *   blown out sideways in a big frizzy puff (HAIR_HALF), the hairline where it was and the face clear; the other side still
 *   wet, slicked flat to the scalp and darker with water (HAIR_WET), so the head reads lopsided even at comic size;
 * - 'wetFlat': slicked flat to the scalp and darker with water; what hangs (a ponytail, braids) keeps its shape.
 * Each is a pure function of the hair at rest, so the same state always looks the same, and a blend from one to another
 * (amount, from) moves every point in a straight line between the two, so nothing pops.
 */
// (A 'cloud' state, all the hair blown up round the head, was retired: the creator, 2026-10-10: "I don't want Fujitas hair
// blown up like that".)
export const HAIR_STATES=Object.freeze([null,'halfDry','wetFlat']);
export const HAIR_WET=Object.freeze({darken:.6,lie:1.02});
// The half-dried head (halfDry): the dry side's puff is a sphere `size` head widths across... in head half-widths: its middle
// `out` of them to that side, `lift` head radii up and `back` behind; the hair on that side is blown out to its surface
// (more the further into the hair, reaching full size `ramp` into it: the cap's own field, how far a point is into the hair,
// is at most 0.1), lumpy and frizzy (`frizz`, with `tufts` sticking out), less where the face is (`face`) and low behind the
// head (`tuck`). `parting`: how wide the change from wet to dry is, across the crown; `cling`: how far down (in head radii)
// the wet side's hair lies flat.
export const HAIR_HALF=Object.freeze({out:.7,lift:.14,back:.1,size:1.12,ramp:.08,frizz:.08,tufts:.06,face:.92,tuck:.55,parting:.22,cling:1.9});
/** Where, in one body's merged geometry, its hair is, and how much of each vertex is hair (hairCap's own field). */
function hairSpan(parts,from,to){
 let start=0;for(let i=0;i<from;i++)start+=parts[i].attributes.position.count;
 let n=0;for(let i=from;i<to;i++)n+=parts[i].attributes.position.count;
 const keep=new Float32Array(n).fill(-1),field=new Float32Array(n).fill(1);let at=0;
 for(let i=from;i<to;i++){const g=parts[i],hf=g.userData.hairField;if(hf){keep.set(hf.keep,at);field.set(hf.field,at);}at+=g.attributes.position.count;}
 return {start,end:start+n,keep,field};
}
const vertexCount=parts=>parts.reduce((n,g)=>n+g.attributes.position.count,0);
/** The cloth that is fitted out of the legs and onto the seat after skinning (towel-fit.js): a flag per vertex. */
function fitFlags(parts){const flags=new Float32Array(vertexCount(parts));let at=0;for(const g of parts){const n=g.attributes.position.count;if(g.userData.fit)flags.fill(Number(g.userData.fit),at,at+n);at+=n;}return flags;}

/**
 * @param {object} input recipe (anything; it is normalized)
 * @param {{shadows?:boolean,faceSize?:number,eyes3d?:boolean,pixar?:object|null}} [options] eyes3d: rigged eyes (eyes3d.js), off
 * with `?eyes3d=0`; pixar: a Pixar body to wear (pixar.js, `?pixar`), its joints and measures in place of the cartoon's
 */
export function buildAvatar(input,{shadows=true,faceSize=256,eyes3d=eyes3dOn(),pixar=pixarBody(input)}={}){
 const recipe=normalizeRecipe(input),m=pixar?{...measure(recipe),...pixar.measure}:measure(recipe);
 const swing=springRest(recipe,m),rest={...restPositions(m),...swing.rest,...pixar?.rest},bones={},list=BONES.map(name=>{const b=new THREE.Bone();b.name=name;bones[name]=b;return b;});
 for(const name of BONES){
  const b=bones[name],p=rest[name],parent=PARENT[name];
  if(parent){const q=rest[parent];b.position.set(p[0]-q[0],p[1]-q[1],p[2]-q[2]);bones[parent].add(b);}else b.position.set(...p);
 }
 const parts=[];
 addBody(parts,recipe,m,false);
 // Fingers share the body's skinning and draw call, and fold inside the mitten at rest.
 const fingerStart=parts.reduce((n,g)=>n+g.attributes.position.count,0);
 for(const side of ['L','R']){const sx=side==='L'?1:-1,x=sx*(m.shoulderX+.015),y=m.shoulderY-m.upper-m.fore;
  for(let i=0;i<4;i++)part(parts,new THREE.CapsuleGeometry(m.hand*.105,m.hand*(i===0||i===3?.40:.60),3,6),'hand'+side,recipe.body.skin,M(x+(i-1.5)*m.hand*.37,y-m.hand*(i===0||i===3?1.65:1.85),m.hand*.04,0,0,(i-1.5)*.16));
 }
 const fingerEnd=parts.reduce((n,g)=>n+g.attributes.position.count,0);
 addNose(parts,recipe,m);
 // Ears.
 const ears=list=>{
  const visible=recipe.hair.style==='braids';
  for(const s of [-1,1]){
   const at=[s*m.Rh*m.headSX*(visible?1.025:.97),m.headCentre-m.Rh*(visible?.025:.08),m.Rh*(visible?.08:-.05)];
   ball(list,m.Rh*(visible?.22:.2),at,'head',recipe.body.skin,[.55,1,.8],10,8);
   if(visible)ball(list,m.Rh*.105,[at[0]+s*m.Rh*.018,at[1],at[2]+m.Rh*.145],'head',new THREE.Color(recipe.body.skin).multiplyScalar(.91).getStyle(),[.55,1,.22],8,6);
  }
 };
 ears(parts);
 const mainHairFrom=parts.length;addHair(parts,recipe,m);const mainHairSpan=hairSpan(parts,mainHairFrom,parts.length);addAccessories(parts,recipe,m);
 // The hat goes in last, so taking it off is drawing one range shorter: people hang it
 // up when they get home (home-residents.js) and put it back on to go out.
 const hatStart=parts.reduce((n,g)=>n+g.attributes.position.count,0),hatLayers=[];wearHat(parts,recipe,m,hatLayers);
 const hatHairRanges=[];
 for(const g of parts.slice(mainHairFrom))if(g.userData.hatHair)hatHairRanges.push({original:g.userData.hatHair,tucked:{position:g.attributes.position.array.slice(),normal:g.attributes.normal.array.slice()}});
 let hairCovered=true;
 // Each shoe's vertices, so a shoe can come off and leave a sock (setShoe).
 const shoeRanges={L:[],R:[]};{let at=0;for(const g of parts){const n=g.attributes.position.count;if(g.userData.shoe)shoeRanges[g.userData.shoe].push([at,n]);at+=n;}}
 const bodyFit=fitFlags(parts);const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
 if(bodyFit.some(f=>f>0))geometry.setAttribute('towelFit',new THREE.BufferAttribute(bodyFit,1));
 const hasHat=geometry.attributes.position.count>hatStart;
 const shoeOn={L:true,R:true},shoeSaved={};
 for(const side of ['L','R'])for(const [at,n] of shoeRanges[side])(shoeSaved[side]??=[]).push({at,n,position:geometry.attributes.position.array.slice(at*3,(at+n)*3),colour:geometry.attributes.color.array.slice(at*3,(at+n)*3)});
 geometry.computeBoundingSphere();
 const material=bodyMaterial(recipe,m);
 const body=new THREE.SkinnedMesh(geometry,material);body.name='Shimanchu body';
 body.add(bones.root);body.bind(new THREE.Skeleton(list));
 // The hat's see-through layer (the trucker's mesh), on the body's skeleton: hidden with the body and with the hat.
 const seeThrough=hatLayer(hatLayers,{shadows});if(seeThrough){seeThrough.bind(body.skeleton,body.bindMatrix);body.add(seeThrough);}
 body.castShadow=shadows;body.receiveShadow=true;body.frustumCulled=false;
 // Swimwear, the bath wrap and the lobby's after-bath clothes are further bodies, swapped in at the onsen.
 let swimBody=null,towelBody=null,towelOutline=null,alternativeBody=null,alternativeOutline=null,alternativeKey=null,afterbathBody=null,afterbathOutline=null;
 let swimOutline=null;
 const face=buildHead(recipe,m,faceSize);
 face.head.castShadow=shadows;face.head.receiveShadow=true;
 bones.head.add(face.head);
 const faceObjects=buildFaceObjects(recipe,m,{shadows});bones.head.add(faceObjects);
 const eyes=eyes3d&&!pixar?buildEyes3d(recipe,m):null;if(eyes)bones.head.add(eyes.mesh);
 const root=new THREE.Group();root.name='Shimanchu · '+(recipe.name||'resident');
 // Keep the skeleton and face visible when a clothing mesh is swapped out.
 root.add(body,bones.root);root.rotation.y=Math.PI;
 let panelBody=null,panelOutline=null;
 let outline=addOutline(root,body,true);addOutline(face.head,face.head,false);
 // A Pixar body (pixar.js) on the same bones; the cartoon stays built underneath and hidden (hideCartoon).
 const pixarSkin=pixar?dressPixar(pixar,{root,bones,order:BONES,shadows,recipe}):null;
 const openFingerPositions=geometry.attributes.position.array.slice(fingerStart*3,fingerEnd*3),closedFingerPositions=openFingerPositions.slice();
 for(let i=fingerStart;i<fingerEnd;i++){const sx=geometry.attributes.skinIndex.getX(i)===BI.handL?1:-1,j=(i-fingerStart)*3;closedFingerPositions[j]=sx*(m.shoulderX+.015);closedFingerPositions[j+1]=m.shoulderY-m.upper-m.fore-m.hand*.55;closedFingerPositions[j+2]=0;}
 geometry.attributes.position.array.set(closedFingerPositions,fingerStart*3);let handsOpen=false;

 // ---- Hair states: every body's hair, as built, and its shape in each state.
 let hair={state:null,amount:1,from:null,side:'R'};const hairRecords=[];
 const headC=new THREE.Vector3(0,m.headCentre,0),HS=[m.headSX*m.Rh,m.headSY*m.Rh,m.Rh*.98];
 // How far out the head's surface is along a direction (in the head's unit space): the point of the unit sphere that
 // shapeHeadPoint carries onto that direction, found in a few steps.
 const hw=new THREE.Vector3(),hsd=new THREE.Vector3();
 const headSurface=d=>{hw.copy(d);for(let k=0;k<6;k++){hsd.copy(shapeHeadPoint(hsd.copy(hw),m.profile)).normalize();hw.add(hsd.subVectors(d,hsd)).normalize();}return shapeHeadPoint(hsd.copy(hw),m.profile).length();};
 // Frizz: soft tufts, not spikes.
 const frizz=d=>Math.sin(7*d.x+2.1)*Math.sin(6*d.y+.7)*Math.sin(7*d.z+1.3)+.35*Math.sin(13*d.x-9*d.z+.4)*Math.sin(11*d.y+1.2);
 // Blown-dry ends: small tufts standing out of the puff, everywhere on it (a fixed pattern, not a dice roll).
 const tufts=d=>Math.max(0,Math.sin(12*d.x+.3)*Math.sin(11*d.y+1.7)*Math.sin(13*d.z+.9))*1.6-.3;
 function hairShape(rec,state,side){
  const key=state+'|'+side;if(rec.cache.has(key))return rec.cache.get(key);
  if(!state){const out={position:rec.base.position,normal:rec.base.normal,colour:rec.colour};rec.cache.set(key,out);return out;}
  const B=rec.base.position,n=B.length/3,position=new Float32Array(B.length),colour=rec.colour.slice(),p=new THREE.Vector3(),u=new THREE.Vector3(),d=new THREE.Vector3(),q=new THREE.Vector3(),s=new THREE.Vector3();
  const sideSign=side==='L'?1:-1;
  // the half-dried head's puff, on the dry side
  const halfDelta=new THREE.Vector3(sideSign*HAIR_HALF.out*m.Rh*m.headSX,HAIR_HALF.lift*m.Rh,-HAIR_HALF.back*m.Rh),halfR=HAIR_HALF.size*m.Rh*m.headSX;
  for(let i=0;i<n;i++){
   p.fromArray(B,i*3);u.set(p.x/HS[0],(p.y-headC.y)/HS[1],p.z/HS[2]);const ru=u.length()||1e-6;d.copy(u).divideScalar(ru);
   const hs=headSurface(d),rel=ru/hs,k=rec.keep[i]>=0?rec.keep[i]:THREE.MathUtils.smoothstep(rel,.98,1.03);
   if(state==='halfDry'){
    // how much of this point is on the dry side (the change from wet to dry runs across the crown)
    const dry=THREE.MathUtils.smoothstep(d.x*sideSign,-HAIR_HALF.parting,HAIR_HALF.parting);
    // the wet side flat to the scalp and darker, as wetFlat
    const lie=hs*HAIR_WET.lie,wf=k*(1-dry)*(1-THREE.MathUtils.smoothstep(rel,HAIR_HALF.cling-.25,HAIR_HALF.cling));
    if(ru>lie)u.multiplyScalar((ru+(lie-ru)*wf)/ru);
    p.set(u.x*HS[0],headC.y+u.y*HS[1],u.z*HS[2]);
    for(let c=0;c<3;c++)colour[i*3+c]*=1-(1-HAIR_WET.darken)*(1-dry);
    // the dry side out along the line from the head's middle to where it meets the puff's sphere, lumpy and frizzy
    s.copy(p).sub(headC);const r=s.length()||1e-6;s.divideScalar(r);
    const b=s.dot(halfDelta),t=(b+Math.sqrt(Math.max(0,b*b-halfDelta.lengthSq()+halfR*halfR)))*(1+HAIR_HALF.frizz*frizz(s)+HAIR_HALF.tufts*tufts(s));
    const e=1-(1-THREE.MathUtils.smoothstep(rec.field[i],0,HAIR_HALF.ramp))**2;
    const w=k*e*dry*(1-HAIR_HALF.face*THREE.MathUtils.smoothstep(s.z,.3,.72))*(1-HAIR_HALF.tuck*THREE.MathUtils.smoothstep(-s.z,.3,.9)*THREE.MathUtils.smoothstep(-s.y,-.35,.3));
    if(t>r)p.addScaledVector(s,(t-r)*w);
   }else if(state==='wetFlat'){
    const lie=hs*HAIR_WET.lie,w=k*(1-THREE.MathUtils.smoothstep(rel,1.22,1.4));
    if(ru>lie){u.multiplyScalar((ru+(lie-ru)*w)/ru);p.set(u.x*HS[0],headC.y+u.y*HS[1],u.z*HS[2]);}
    for(let c=0;c<3;c++)colour[i*3+c]*=HAIR_WET.darken;
   }
   p.toArray(position,i*3);
  }
  // Smooth normals for the new shape: each corner's faces, summed over every corner at the same rest position.
  if(!rec.weld){const ids=new Int32Array(n),map=new Map();for(let i=0;i<n;i++){const key=Math.round(B[i*3]*1e5)+','+Math.round(B[i*3+1]*1e5)+','+Math.round(B[i*3+2]*1e5);if(!map.has(key))map.set(key,map.size);ids[i]=map.get(key);}rec.weld={ids,count:map.size};}
  const acc=new Float32Array(rec.weld.count*3),a=new THREE.Vector3(),e1=new THREE.Vector3(),e2=new THREE.Vector3();
  for(let i=0;i<n;i+=3){a.fromArray(position,i*3);e1.fromArray(position,i*3+3).sub(a);e2.fromArray(position,i*3+6).sub(a);e1.cross(e2);for(let j=0;j<3;j++){const id=rec.weld.ids[i+j]*3;acc[id]+=e1.x;acc[id+1]+=e1.y;acc[id+2]+=e1.z;}}
  const normal=new Float32Array(B.length);
  for(let i=0;i<n;i++){const id=rec.weld.ids[i]*3;a.set(acc[id],acc[id+1],acc[id+2]);if(a.lengthSq()<1e-20)a.fromArray(rec.base.normal,i*3);a.normalize().toArray(normal,i*3);}
  const out={position,normal,colour};rec.cache.set(key,out);return out;
 }
 function applyHair(rec){
  if(!rec)return;
  const g=rec.geometry,P=g.attributes.position,N=g.attributes.normal,C=g.attributes.color,o=rec.start*3,covered=rec.covered();
  if(covered||!hair.state&&!hair.from){const src=covered&&rec.tucked?rec.tucked:rec.base;P.array.set(src.position,o);N.array.set(src.normal,o);C.array.set(rec.colour,o);}
  else{
   const A=hairShape(rec,hair.from,hair.side),Bs=hairShape(rec,hair.state,hair.side),t=hair.amount,v=new THREE.Vector3();
   for(let i=0;i<A.position.length;i++){P.array[o+i]=A.position[i]+(Bs.position[i]-A.position[i])*t;C.array[o+i]=A.colour[i]+(Bs.colour[i]-A.colour[i])*t;}
   for(let i=0;i<A.normal.length;i+=3){v.set(A.normal[i]+(Bs.normal[i]-A.normal[i])*t,A.normal[i+1]+(Bs.normal[i+1]-A.normal[i+1])*t,A.normal[i+2]+(Bs.normal[i+2]-A.normal[i+2])*t).normalize();N.array[o+i]=v.x;N.array[o+i+1]=v.y;N.array[o+i+2]=v.z;}
  }
  P.needsUpdate=N.needsUpdate=C.needsUpdate=true;
 }
 function hairRecord(g,span,{covered=()=>false,base=null,tucked=null}={}){
  const {start,end}=span,P=g.attributes.position.array,N=g.attributes.normal.array;
  const rec={geometry:g,start,end,keep:span.keep,field:span.field,covered,tucked,cache:new Map(),weld:null,
   base:base||{position:P.slice(start*3,end*3),normal:N.slice(start*3,end*3)},colour:g.attributes.color.array.slice(start*3,end*3)};
  hairRecords.push(rec);if(hair.state||hair.from)applyHair(rec);return rec;
 }
 const join=list=>{const out=new Float32Array(list.reduce((n,a)=>n+a.length,0));let at=0;for(const a of list){out.set(a,at);at+=a.length;}return out;};
 const mainHair=mainHairSpan.end>mainHairSpan.start?hairRecord(geometry,mainHairSpan,hatHairRanges.length?{
  covered:()=>hairCovered,
  base:{position:join(hatHairRanges.map(r=>r.original.position)),normal:join(hatHairRanges.map(r=>r.original.normal))},
  tucked:{position:join(hatHairRanges.map(r=>r.tucked.position)),normal:join(hatHairRanges.map(r=>r.tucked.normal))}}:{}):null;
 let swimHair=null,towelHair=null,altHair=null,afterbathHair=null,headTowelOn=false,tenugui={state:'rest',direction:Math.PI,time:0},tenuguiRange=null;

 /** A body's cloth fitted out of the legs and onto the seat as it is drawn (towel-fit.js), with its ink and its shadow. */
 function fitCloth(mesh){
  const fit=createTowelFit(avatar,mesh);fit.fitted(mesh.material,'body');
  const line=addOutline(root,mesh,true),ink=line.material,fitted=ink.clone();fitted.onBeforeCompile=ink.onBeforeCompile;fitted.customProgramCacheKey=ink.customProgramCacheKey;line.material=fit.fitted(fitted,'outline');
  mesh.customDepthMaterial=fit.fitted(new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking}),'depth');
  // Read the pose as it is drawn, for the picture, its ink line and its shadow alike.
  mesh.onBeforeRender=mesh.onBeforeShadow=line.onBeforeRender=()=>fit.refresh();
  mesh.towelFit=fit;return line;
 }
 function applyTenugui(){
  if(!tenuguiRange)return;
  const {geometry:g}=tenuguiShape(recipe,m,tenugui),idx=tenuguiRange.index;
  // The rest's own triangles, so every state is the same cloth (vertex for vertex) in a new place.
  g.setIndex(new THREE.BufferAttribute(idx,1));g.computeVertexNormals();
  const P=afterbathBody.geometry.attributes.position,N=afterbathBody.geometry.attributes.normal,src=g.attributes.position.array,nrm=g.attributes.normal.array;
  for(let i=0;i<idx.length;i++){const j=idx[i]*3,o=(tenuguiRange.start+i)*3;for(let c=0;c<3;c++){P.array[o+c]=src[j+c];N.array[o+c]=nrm[j+c];}}
  P.needsUpdate=N.needsUpdate=true;g.dispose();
 }

 const avatar={
  recipe,measure:m,root,body,bones,face,eyes3d:eyes,height:m.H,outfit:'clothes',hasHat,garment:material.userData.garment,springSetup:swing,springs:null,
  setOpenHands(on){on=!!on;if(handsOpen===on)return;handsOpen=on;geometry.attributes.position.array.set(on?openFingerPositions:closedFingerPositions,fingerStart*3);geometry.attributes.position.needsUpdate=true;},
  /** Hat on or off. Off, it is somebody else's job to show where it went (buildHatProp). */
  setHat(on){if(seeThrough)seeThrough.visible=!!on;geometry.setDrawRange(0,on||!hasHat?Infinity:hatStart);if(hairCovered!==!!on){hairCovered=!!on;if(hatHairRanges.length)applyHair(mainHair);}},
  get hatOn(){return hasHat&&geometry.drawRange.count===Infinity;},
  /** A shoe on or off ('L' or 'R'). Off, the foot is in its sock (SOCK); where the shoe went is somebody
   *  else's to show (buildShoeProp). */
  setShoe(side,on){
   on=!!on;if(!shoeSaved[side]||shoeOn[side]===on)return;shoeOn[side]=on;
   const P=geometry.attributes.position.array,C=geometry.attributes.color.array,sock=new THREE.Color(SOCK.colour),mid=new THREE.Vector3(),q=new THREE.Vector3();
   // the sock: the shoe drawn in towards the middle of its upper (the first piece), in the sock's colour
   const upper=shoeSaved[side][0];for(let i=0;i<upper.n;i++)mid.add(q.fromArray(upper.position,i*3));mid.multiplyScalar(1/upper.n);
   for(const r of shoeSaved[side])for(let i=0;i<r.n;i++){
    const j=(r.at+i)*3;
    if(on){P.set(r.position.subarray(i*3,i*3+3),j);C.set(r.colour.subarray(i*3,i*3+3),j);continue;}
    q.fromArray(r.position,i*3).sub(mid).multiplyScalar(SOCK.size).add(mid);P[j]=q.x;P[j+1]=q.y;P[j+2]=q.z;C[j]=sock.r;C[j+1]=sock.g;C[j+2]=sock.b;
   }
   geometry.attributes.position.needsUpdate=true;geometry.attributes.color.needsUpdate=true;
  },
  shoeOn(side){return shoeOn[side];},
  faceState:{expression:'neutral',blink:0,talk:0,look:[0,0]},
  /** Repaint the face if what it is doing has changed. */
  paintFace(state){
   const s=avatar.faceState,n={...s,...state};
   // A Pixar body has no painted face: its rigged eyes and jaw follow every call.
   if(pixarSkin){Object.assign(s,n);pixarSkin.update(n);return false;}
   // Rigged eyes follow every call (a gaze, a blink: no repaint); the canvas leaves out the eyes they draw.
   const skipEyes=!!eyes?.update(n);
   const key=skipEyes?n.expression+'|3d|'+(n.talk>.5?1:0):n.expression+'|'+(n.blink>.5?1:0)+'|'+(n.talk>.5?1:0)+'|'+Math.round(n.look[0]*2)+','+Math.round(n.look[1]*2);
   if(skipEyes)Object.assign(s,n);
   if(key===avatar.faceKey)return false;
   avatar.faceKey=key;Object.assign(s,n);
   drawFace(face.ctx,recipe,{...n,size:face.canvas.width,objects:true,skipEyes});face.texture.needsUpdate=true;
   if(face.beard){drawBeardShell(face.beard.ctx,recipe,n);face.beard.texture.needsUpdate=true;}
   return true;
  },
  /** Whether the folded towel is on the head now (the bath wrap's, or swimwear's when asked for). */
  get headTowel(){return headTowelOn;},
  /** The hair state now: {state, amount, from, side}. */
  get hairState(){return {...hair};},
  /**
   * The hair's state, in every body that shows it (HAIR_STATES): null (as it is), 'halfDry' (one side blown into a puff;
   * side 'R' or 'L') or 'wetFlat'. `amount` (0–1) of the way from `from` (another state, or null for the hair as it is) to
   * it, for a change over time: a half-dried bob sinking in the water is setHairState('wetFlat',{from:'halfDry',amount:t}).
   */
  setHairState(state=null,{amount=1,from=null,side='R'}={}){
   if(!HAIR_STATES.includes(state)||!HAIR_STATES.includes(from))throw new Error('No hair state '+(HAIR_STATES.includes(state)?from:state));
   hair={state,amount:THREE.MathUtils.clamp(+amount,0,1),from,side:side==='L'?'L':'R'};
   for(const rec of hairRecords)applyHair(rec);
   return state;
  },
  /** The tenugui round the neck after the bath: 'rest' (draped) or 'flag' (streaming in a gust). */
  get tenuguiState(){return {...tenugui};},
  /**
   * The after-bath tenugui ('rest' or 'flag'). `direction` is where the wind blows the ends, in radians round the up axis
   * in the body's own frame (Math.PI behind them, the default, a gust in the face; Math.PI/2 to their left, -Math.PI/2 to
   * their right; a direction ahead of sideways is drawn as sideways, since ends blown forward would pass through the arms);
   * `time` (seconds) ripples the cloth, the same for the same moment. Only a man's after-bath clothes have one; it is
   * remembered until they put them on.
   */
  setTenugui(state='rest',direction=Math.PI,{time=0}={}){
   if(!['rest','flag'].includes(state))throw new Error('No tenugui state '+state);
   tenugui={state,direction:+direction||0,time:+time||0};applyTenugui();return state;
  },
  /**
   * 'clothes', 'swim', 'towel' (the bath wrap), 'bath' (whichever of the two this person wears behind Umi-no-yu's noren:
   * bathOutfit), 'afterbath' (the lobby's after-bath clothes, outfits.js AFTERBATH), or Thuan's 'sailor' and 'nozomi'.
   * A child or teenager asked into a towel gets their swimwear (wearsBathTowel), and asked into after-bath clothes keeps
   * their clothes. Options: headTowel, the folded towel on the head: on by default with the wrap (off for drying the
   * hair at the mirror), off by default with swimwear (on for a soak: Tetsuo's, square on his head). Returns what they
   * ended up wearing.
   */
  wear(requested,{headTowel}={}){
   let outfit=requested==='bath'?bathOutfit(recipe):requested;
   if(outfit==='towel'&&!wearsBathTowel(recipe))outfit='swim';
   if(outfit==='afterbath'&&!wearsBathTowel(recipe))outfit='clothes';
   avatar.outfit=outfit;
   if(outfit==='towel'&&!towelBody){
    const parts=[];addBody(parts,recipe,m,'towel');addNose(parts,recipe,m);ears(parts);
    const hairStart=parts.length;addHair(parts,{...recipe,outfit:{...recipe.outfit,hat:'none'}},m);
    const hair=parts.slice(hairStart),span=hairSpan(parts,hairStart,parts.length),wrapStart=vertexCount(parts);
    const head=face.head.geometry.clone();head.translate(0,m.headCentre,0);
    addTowel(parts,recipe,m);const wrapEnd=vertexCount(parts);addHeadTowel(parts,m,[head,...hair]);head.dispose();
    const g=mergeGeometries(parts,false),count=vertexCount(parts);parts.forEach(p=>p.dispose());
    // The wrap's vertices are kept out of the body after skinning (towel-fit.js); nothing else is.
    g.setAttribute('towelFit',new THREE.BufferAttribute(new Float32Array(count).fill(1,wrapStart,wrapEnd),1));
    towelBody=new THREE.SkinnedMesh(g,celFrom(new THREE.MeshStandardMaterial({vertexColors:true}),{bands:'soft3'}));towelBody.name='Shimanchu bath towel';towelBody.bind(body.skeleton,body.bindMatrix);
    // Which vertices are the wrap (with its tuck) and which the towel on the head, for tests and the seat.
    towelBody.userData.towel={wrap:[wrapStart,wrapEnd],head:[wrapEnd,count]};
    towelBody.castShadow=shadows;towelBody.frustumCulled=false;root.add(towelBody);towelOutline=fitCloth(towelBody);
    towelHair=hairRecord(g,span,{covered:()=>headTowelOn});
   }
   if(['nozomi','sailor'].includes(outfit)&&alternativeKey!==outfit){
    if(alternativeBody){hairRecords.splice(hairRecords.indexOf(altHair),1);alternativeBody.removeFromParent();alternativeOutline.removeFromParent();alternativeBody.geometry.dispose();alternativeBody.material.map?.dispose();alternativeBody.material.dispose();}
    alternativeKey=outfit;const r=normalizeRecipe({...recipe,outfit:{...recipe.outfit,skirtCut:'classic',...(outfit==='sailor'?THUAN_SAILOR_OUTFIT:SHOPPING_LANE_OUTFIT)}}),parts=[];addBody(parts,r,m);addNose(parts,r,m);ears(parts);
    const hairStart=parts.length;addHair(parts,r,m);const span=hairSpan(parts,hairStart,parts.length);
    const g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());alternativeBody=new THREE.SkinnedMesh(g,bodyMaterial(r,m));alternativeBody.name=outfit==='sailor'?'Thuan · harbour academy sailor':'Thuan · shopping lane outfit';alternativeBody.bind(body.skeleton,body.bindMatrix);alternativeBody.castShadow=shadows;alternativeBody.frustumCulled=false;root.add(alternativeBody);alternativeOutline=addOutline(root,alternativeBody,true);
    altHair=hairRecord(g,span);
   }
   if(outfit==='swim'&&!swimBody){
    const parts=[];addBody(parts,recipe,m,true);addNose(parts,recipe,m);ears(parts);
    const hairStart=parts.length;addHair(parts,{...recipe,outfit:{...recipe.outfit,hat:'none'}},m);
    const hair=parts.slice(hairStart),span=hairSpan(parts,hairStart,parts.length),headStart=vertexCount(parts);
    // The folded towel for the head (headTowel), last, so leaving it off is drawing one range shorter.
    const head=face.head.geometry.clone();head.translate(0,m.headCentre,0);addHeadTowel(parts,m,[head,...hair]);head.dispose();
    const flags=fitFlags(parts),count=vertexCount(parts),g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
    g.setAttribute('towelFit',new THREE.BufferAttribute(flags,1));
    swimBody=new THREE.SkinnedMesh(g,celFrom(new THREE.MeshStandardMaterial({vertexColors:true}),{bands:'soft3'}));swimBody.name='Shimanchu swimwear';swimBody.bind(body.skeleton,body.bindMatrix);
    swimBody.userData.swim={headTowel:[headStart,count],skirt:flags.some(f=>f>0)};
    swimBody.castShadow=shadows;swimBody.frustumCulled=false;root.add(swimBody);
    // An older woman's swimsuit's little skirt is fitted like the wrap; everything else is skin-tight.
    swimOutline=swimBody.userData.swim.skirt?fitCloth(swimBody):addOutline(root,swimBody,true);
    swimHair=hairRecord(g,span,{covered:()=>headTowelOn});
   }
   if(outfit==='afterbath'&&!afterbathBody){
    const women=recipe.body.silhouette==='feminine',dress=women?houseDressColour(recipe):null;
    const r={...recipe,outfit:{...recipe.outfit,...(women?{...AFTERBATH.women,topColour:dress,bottomColour:dress,accent:dress}:AFTERBATH.men)}};
    const parts=[];addBody(parts,r,m,false);addNose(parts,r,m);ears(parts);
    let span=null,tenuguiAt=null;
    if(women)addTurban(parts,r,m);
    else{const hairStart=parts.length;addHair(parts,{...r,outfit:{...r.outfit,hat:'none'}},m);span=hairSpan(parts,hairStart,parts.length);tenuguiAt={start:vertexCount(parts),...addTenugui(parts,r,m)};}
    const flags=fitFlags(parts),g=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
    const mat=bodyMaterial(r,m);
    afterbathBody=new THREE.SkinnedMesh(g,mat);afterbathBody.name=women?'Shimanchu after the bath · house dress':'Shimanchu after the bath · vest and drawers';afterbathBody.bind(body.skeleton,body.bindMatrix);
    afterbathBody.castShadow=shadows;afterbathBody.frustumCulled=false;root.add(afterbathBody);
    if(flags.some(f=>f>0)){g.setAttribute('towelFit',new THREE.BufferAttribute(flags,1));afterbathOutline=fitCloth(afterbathBody);}else afterbathOutline=addOutline(root,afterbathBody,true);
    if(tenuguiAt){tenuguiRange={start:tenuguiAt.start,count:tenuguiAt.index.length,index:tenuguiAt.index};afterbathBody.userData.tenugui=tenuguiRange;if(tenugui.state!=='rest')applyTenugui();}
    afterbathBody.userData.afterbath={women,dress,skirt:flags.some(f=>f>0)};
    if(span)afterbathHair=hairRecord(g,span);
   }
   // The folded towel on the head.
   headTowelOn=outfit==='towel'?headTowel!==false:outfit==='swim'?!!headTowel:false;
   if(towelBody){towelBody.geometry.setDrawRange(0,outfit==='towel'&&!headTowelOn?towelBody.userData.towel.head[0]:Infinity);applyHair(towelHair);}
   if(swimBody){swimBody.geometry.setDrawRange(0,outfit==='swim'&&headTowelOn?Infinity:swimBody.userData.swim.headTowel[0]);applyHair(swimHair);}
   // What swings depends on what is worn: Thuan's sailor skirt, Johansson's shirt hem, nothing in the bath or after it.
   const worn=outfit==='sailor'?{...recipe,outfit:{...recipe.outfit,...THUAN_SAILOR_OUTFIT}}:outfit==='nozomi'?{...recipe,outfit:{...recipe.outfit,...SHOPPING_LANE_OUTFIT}}
    :['swim','towel','afterbath'].includes(outfit)?{...recipe,outfit:{...recipe.outfit,top:'tank',bottom:'shorts'},...(outfit==='afterbath'&&afterbathBody?.userData.afterbath.women?{hair:{...recipe.hair,style:'crop'}}:{})}:recipe;
   if(avatar.springKey!==outfit){avatar.springKey=outfit;avatar.springs?.reset();avatar.springSetup=springRest(normalizeRecipe(worn),m);avatar.springs=createSprings(avatar);}
   body.visible=!['swim','towel','nozomi','sailor','afterbath'].includes(outfit);outline.visible=body.visible;
   if(panelBody){panelBody.visible=body.visible;panelOutline.visible=body.visible;}
   if(alternativeBody){alternativeBody.visible=outfit===alternativeKey;alternativeOutline.visible=alternativeBody.visible;}
   if(swimBody){swimBody.visible=outfit==='swim';swimOutline.visible=swimBody.visible;}
   if(towelBody){towelBody.visible=outfit==='towel';towelOutline.visible=towelBody.visible;}
   if(afterbathBody){afterbathBody.visible=outfit==='afterbath';afterbathOutline.visible=afterbathBody.visible;}
   hideCartoon();
   return outfit;
  },
  dispose(){
   pixarSkin?.dispose();
   seeThrough?.userData.dispose();
   if(panelBody){panelBody.geometry.dispose();panelBody.material.map?.dispose();panelBody.material.dispose();panelBody.customDepthMaterial?.dispose();panelOutline.material.dispose();}
   faceObjects.userData.dispose();
   body.customDepthMaterial?.dispose();if(body.towelFit)outline.material.dispose();
   geometry.dispose();material.dispose();material.map?.dispose();face.texture.dispose();face.head.geometry.dispose();face.head.material.dispose();eyes?.dispose();
   if(alternativeBody){alternativeBody.geometry.dispose();alternativeBody.material.map?.dispose();alternativeBody.material.dispose();}
   for(const [mesh,line] of [[swimBody,swimOutline],[towelBody,towelOutline],[afterbathBody,afterbathOutline]]){if(!mesh)continue;mesh.geometry.dispose();mesh.material.map?.dispose();mesh.material.dispose();mesh.customDepthMaterial?.dispose();if(mesh.towelFit)line.material.dispose();}
  },
 };
 if(bodyFit.some(f=>f>0)){outline.removeFromParent();outline=fitCloth(body);}
 if(m.panelSkirt){
  const pieces=[],spec=skirtSpec(m);
  const drape=p=>{const down=THREE.MathUtils.smoothstep(spec.waist-p.y,0,spec.length),side=THREE.MathUtils.smoothstep(p.x,-m.width*.2,m.width*.2),front=THREE.MathUtils.smoothstep(p.z,-m.depth*.35,m.depth*.22),leg=down*.45*(.35+.65*front);return [['hips',1-leg],['thighL',leg*side],['thighR',leg*(1-side)]];};
  const g=part(pieces,authoredSkirtGeometry(m,bodyVolume(recipe,m)),quarterShare(hemSpec(recipe,m),drape),recipe.outfit.bottomColour);g.attributes.ink.array.fill(.12);g.setAttribute('towelFit',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(2),1));
  panelBody=new THREE.SkinnedMesh(g,authoredSkirtMaterial(recipe.outfit));panelBody.name='Authored panel skirt';panelBody.bind(body.skeleton,body.bindMatrix);panelBody.castShadow=shadows;panelBody.receiveShadow=true;panelBody.frustumCulled=false;root.add(panelBody);panelOutline=fitCloth(panelBody);avatar.skirt=panelBody;
 }
 /** Under a Pixar body, every cartoon mesh stays hidden, whatever is worn (the Pixar body has its own clothes only). */
 function hideCartoon(){
  if(!pixarSkin)return;
  for(const o of [body,outline,panelBody,panelOutline,alternativeBody,alternativeOutline,swimBody,swimOutline,towelBody,towelOutline,afterbathBody,afterbathOutline,face.head,faceObjects])if(o)o.visible=false;
 }
 avatar.pixar=pixarSkin;hideCartoon();
 avatar.springs=createSprings(avatar);
 avatar.paintFace({});
 return avatar;
}
