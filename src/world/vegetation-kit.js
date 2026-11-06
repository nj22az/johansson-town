import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';

/**
 * Plants and shore pieces for the islands, built from their real anatomy and drawn in the
 * town's cel-shaded style: faceted forms, flat colour per facet, and the light and dark of a
 * real plant painted into the vertex colours (sunlit tops, shaded undersides, yellowing old
 * fronds), so the toon ramp and the ink outlines have something true to draw.
 *
 * Every builder returns one non-indexed geometry with position, normal and colour, so a whole
 * plant (bark and leaves together) is one instanced draw with one double-sided material.
 * Builders are deterministic: the same seed always grows the same plant.
 */

const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export function seeded(seed){let s=seed|0;return ()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function hash3(x,y,z){const h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h);}
/** Smooth value noise in 3D, 0–1: lumps on a canopy or a rock that agree where faces meet. */
function noise3(x,y,z){
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,s=t=>t*t*(3-2*t),u=s(fx),v=s(fy),w=s(fz);
 const l=(a,b,t)=>a+(b-a)*t,c=(dx,dy,dz)=>hash3(ix+dx,iy+dy,iz+dz);
 return l(l(l(c(0,0,0),c(1,0,0),u),l(c(0,1,0),c(1,1,0),u),v),l(l(c(0,0,1),c(1,0,1),u),l(c(0,1,1),c(1,1,1),u),v),w);
}

/** Non-indexed, uv-free, coloured: `color` is a hex, or (position, normal) → THREE.Color. */
export function part(geometry,color){
 const g=geometry.index?geometry.toNonIndexed():geometry;
 for(const k of Object.keys(g.attributes))if(k!=='position'&&k!=='normal')g.deleteAttribute(k);
 g.computeVertexNormals();
 const p=g.attributes.position,n=g.attributes.normal,c=new Float32Array(p.count*3),out=new THREE.Color(),a=new THREE.Vector3(),b=new THREE.Vector3();
 for(let i=0;i<p.count;i++){
  if(typeof color==='function'){a.fromBufferAttribute(p,i);b.fromBufferAttribute(n,i);out.copy(color(a,b,i));}else out.set(color);
  c[i*3]=out.r;c[i*3+1]=out.g;c[i*3+2]=out.b;
 }
 g.setAttribute('color',new THREE.BufferAttribute(c,3));g.computeBoundingBox();g.computeBoundingSphere();return g;
}
/** Triangles from a flat list of [x,y,z] triplets. */
function tris(points,color){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));const out=part(g,color);out.computeBoundingBox();out.computeBoundingSphere();return out;}
export function merge(parts){const g=mergeGeometries(parts,false);for(const p of parts)p.dispose();g.computeBoundingBox();g.computeBoundingSphere();return g;}

/** A trunk or branch swept along a curve: `radius(t)` and an optional ring colour `ring(k)`. */
export function sweep(curve,{segments=12,sides=7,radius=()=>.2,color=0x7a6650,ring=null}){
 const pos=[],up=V(0,0,1),frames=[];
 for(let k=0;k<=segments;k++){const t=k/segments,p=curve.getPoint(t),tan=curve.getTangent(t).normalize();let n=V(0,0,0).crossVectors(tan,up);if(n.lengthSq()<1e-6)n.set(1,0,0);n.normalize();const b=V(0,0,0).crossVectors(tan,n).normalize();frames.push({p,n,b,r:radius(t,k)});}
 const at=(f,j)=>{const a=j/sides*Math.PI*2;return f.p.clone().addScaledVector(f.n,Math.cos(a)*f.r).addScaledVector(f.b,Math.sin(a)*f.r);};
 const colours=[];
 for(let k=0;k<segments;k++)for(let j=0;j<sides;j++){const a=at(frames[k],j),b=at(frames[k],j+1),c=at(frames[k+1],j),d=at(frames[k+1],j+1);pos.push(a,c,b,b,c,d);const col=ring?ring(k):color;for(let q=0;q<6;q++)colours.push(col);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos.flatMap(v=>[v.x,v.y,v.z]),3));
 return part(g,(p,n,i)=>new THREE.Color(colours[i]));
}
/** A lumpy clump: an icosphere pushed in and out by noise, flattened, sunlit on top. */
function clump(r,{detail=1,squash=.75,lump=.24,seed=0,light=0x6db04f,dark=0x2f6a35,mid=null}={}){
 const g=new THREE.IcosahedronGeometry(r,detail),p=g.attributes.position,v=V(0,0,0);
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=noise3(v.x*1.3/r+seed,v.y*1.3/r+seed*.7,v.z*1.3/r);v.multiplyScalar(1+lump*(n-.5)*2);v.y*=squash;p.setXYZ(i,v.x,v.y,v.z);}
 const L=new THREE.Color(light),D=new THREE.Color(dark),M=mid==null?null:new THREE.Color(mid);
 return part(g,(q,n)=>{const t=THREE.MathUtils.clamp(n.y*.5+.5+(q.y/(r*squash))*.25,0,1);return M&&t<.5?D.clone().lerp(M,t*2):(M?M.clone().lerp(L,(t-.5)*2):D.clone().lerp(L,t));});
}

/**
 * One pinnate frond (coconut, fern): a rachis arching out along +x, leaflets in a drooping V
 * either side, longest at the middle. Returns triangles in the frond's own frame.
 */
function frondTriangles({length=3.4,rise=.55,droop=1.6,leaflets=22,leaflet=.8,width=.09,vee=.42,rand=Math.random}){
 const P=t=>V(t*length,(rise*t-droop*t*t)*length*.5,0),out=[],shade=[];
 for(let i=1;i<=leaflets;i++){
  const t=.08+.9*i/(leaflets+1),p=P(t),d=P(Math.min(1,t+.01)).sub(P(Math.max(0,t-.01))).normalize();
  const len=leaflet*(.35+.65*Math.sin(Math.PI*Math.min(1,t*1.12)))*(1-.2*t)*(.85+rand()*.3);
  for(const s of [-1,1]){
   const dir=d.clone().multiplyScalar(.5).add(V(0,-vee,s*.85)).normalize(),tip=p.clone().addScaledVector(dir,len),side=V(0,0,s);
   out.push([p.clone().addScaledVector(d,-width)],[p.clone().addScaledVector(d,width).addScaledVector(side,.01)],[tip]);shade.push(t,t,t);
  }
 }
 // The rachis: a narrow ribbon along the top.
 for(let k=0;k<8;k++){const a=P(k/8),b=P((k+1)/8),w=.035*(1-k/9);out.push([a.clone().add(V(0,0,-w))],[b.clone().add(V(0,0,-w*.8))],[a.clone().add(V(0,0,w))],[a.clone().add(V(0,0,w))],[b.clone().add(V(0,0,-w*.8))],[b.clone().add(V(0,0,w*.8))]);for(let q=0;q<6;q++)shade.push(-1);}
 return {points:out.map(x=>x[0]),shade};
}
function frond(opts,{yaw,pitch,base,young,old,midrib,dead=false}){
 const {points,shade}=frondTriangles(opts),m=new THREE.Matrix4().makeTranslation(base.x,base.y,base.z).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationZ(pitch));
 const Y=new THREE.Color(young),O=new THREE.Color(old),R=new THREE.Color(midrib),brown=new THREE.Color(0x8a6a40);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points.flatMap(v=>{v.applyMatrix4(m);return [v.x,v.y,v.z];}),3));
 return part(g,(p,n,i)=>dead?brown.clone().lerp(new THREE.Color(0xb39a6a),Math.max(0,shade[i])):shade[i]<0?R:Y.clone().lerp(O,shade[i]));
}

/** Cocos nucifera: a ringed trunk bowing toward the light, a crown of fronds, coconuts. */
export function coconutPalm({height=8.5,bow=1.8,fronds=12,seed=1}={}){
 const rand=seeded(seed),parts=[];
 const curve=new THREE.CubicBezierCurve3(V(0,-.3,0),V(bow*.05,height*.35,0),V(bow*.45,height*.75,0),V(bow,height,0));
 const tip=curve.getPoint(1);
 // Leaf scars ring the trunk: alternate bands, a little swollen at the foot.
 parts.push(sweep(curve,{segments:18,sides:7,radius:(t,k)=>(.27-.11*t)*(1+(k%2?.06:-.02))+.12*Math.max(0,.12-t),ring:k=>k%2?0x8a7660:0x6f5d4a}));
 // The crown: young fronds up the middle, old ones hanging, one or two dead ones brown.
 for(let f=0;f<fronds;f++){
  const yaw=f*2.39996+rand()*.3,age=(f%3)/2,pitch=.55-age*.75+rand()*.12;
  parts.push(frond({length:3.1+rand()*.7,rise:.6,droop:1.3+age*.8,leaflets:18,leaflet:.95,rand},{yaw,pitch,base:tip.clone().add(V(0,.12,0)),young:0x6fb04a,old:0x3f8a3a,midrib:0xb8b06a}));
 }
 for(let f=0;f<2;f++)parts.push(frond({length:2.6,rise:.1,droop:3,leaflets:14,leaflet:.55,vee:.9,rand},{yaw:rand()*Math.PI*2,pitch:-1.15,base:tip.clone().add(V(0,-.15,0)),young:0,old:0,midrib:0,dead:true}));
 // The crownshaft, and the coconuts hanging under it.
 parts.push(part(new THREE.SphereGeometry(.32,8,6).scale(1,1.3,1).translate(tip.x,tip.y,tip.z),0x6b7a3a));
 for(let c=0;c<6;c++){const a=c*1.05+rand();parts.push(part(new THREE.IcosahedronGeometry(.17,0).translate(tip.x+Math.cos(a)*.3,tip.y-.28-rand()*.15,tip.z+Math.sin(a)*.3),c%3?0x6f8a33:0x8a6a2c));}
 return merge(parts);
}

/** A rainforest canopy tree: buttress roots, a straight bole, branches, lumpy layered crown. */
export function rainforestTree({height=8,spread=3.4,seed=1,light=0x74b552,dark=0x2a6233,mid=0x4a8a3e}={}){
 const rand=seeded(seed),parts=[],h=height,bole=h*.5;
 const trunk=new THREE.CatmullRomCurve3([V(0,-.3,0),V(rand()*.2-.1,bole*.5,rand()*.2-.1),V(rand()*.4-.2,bole,rand()*.4-.2)]);
 parts.push(sweep(trunk,{segments:6,sides:8,radius:t=>.34*(h/8)*(1-.45*t)+.25*Math.max(0,.15-t)*4,color:0x7b6650}));
 for(let k=0;k<4;k++){const a=k*Math.PI/2+rand()*.4;parts.push(part(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute([0,1.3,0, Math.cos(a)*1.1,-.2,Math.sin(a)*1.1, 0,-.2,0, 0,1.3,0, 0,-.2,0, Math.cos(a)*1.1,-.2,Math.sin(a)*1.1],3)),0x75604a));}
 const top=trunk.getPoint(1),tips=[top.clone().add(V(0,1.2,0))];
 const n=3+Math.floor(rand()*2);
 for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rand(),reach=spread*(.55+rand()*.25),end=top.clone().add(V(Math.cos(a)*reach,.6+rand()*1.1,Math.sin(a)*reach));
  parts.push(sweep(new THREE.QuadraticBezierCurve3(top.clone().add(V(0,-.6,0)),top.clone().add(V(Math.cos(a)*reach*.3,.4,Math.sin(a)*reach*.3)),end),{segments:4,sides:5,radius:t=>.16*(1-.6*t),color:0x6e5a47}));tips.push(end);}
 // A layered crown: the top, a clump at each limb, and lower ones filling under it so it is not a lid on a pole.
 for(let k=0;k<n;k++){const a=(k+.5)/n*Math.PI*2+rand(),r=spread*.45;tips.push(top.clone().add(V(Math.cos(a)*r,-.2-rand()*.5,Math.sin(a)*r)));}
 tips.forEach((t,k)=>parts.push(clump(spread*(k?(k>n?.36:.48):.58)*(.85+rand()*.3),{seed:seed*7+k,light,dark,mid}).translate(t.x,t.y+.4,t.z)));
 return merge(parts);
}

/** Gajumaru (banyan): several trunks twisted together, aerial roots down to the ground. */
export function banyan({height=7,spread=5,seed=1}={}){
 const rand=seeded(seed),parts=[];
 for(let k=0;k<4;k++){const a=k*1.6+rand(),c=new THREE.CatmullRomCurve3([V(Math.cos(a)*.5,-.3,Math.sin(a)*.5),V(Math.cos(a+1)*.3,height*.35,Math.sin(a+1)*.3),V(Math.cos(a+2)*.4,height*.62,Math.sin(a+2)*.4)]);parts.push(sweep(c,{segments:6,sides:6,radius:t=>.32*(1-.35*t),color:k%2?0x8a7a66:0x766652}));}
 const crown=[];for(let k=0;k<7;k++){const a=k/7*Math.PI*2+rand()*.5,r=k?spread*(.55+rand()*.25):0;crown.push(V(Math.cos(a)*r,height*.75+rand()*1.2,Math.sin(a)*r));}
 crown.forEach((c,k)=>parts.push(clump(spread*(k?.42:.55),{seed:seed*5+k,light:0x5d9a48,dark:0x244f2c,mid:0x3a7438}).translate(c.x,c.y,c.z)));
 // Aerial roots hang from the limbs; the older ones have reached the ground and thickened.
 for(let k=0;k<12;k++){const a=rand()*Math.PI*2,r=spread*(.3+rand()*.6),y=height*(.62+rand()*.12),thick=k<5;
  // A thick root runs from the limb into the ground; a young one hangs part of the way down.
  const len=thick?y+.3:(y-1.2)*(.35+rand()*.45),mid=thick?(y-.3)/2:y-len/2;
  parts.push(part(new THREE.CylinderGeometry(thick?.08:.018,thick?.13:.022,len,5).translate(Math.cos(a)*r,mid,Math.sin(a)*r),thick?0x806e5a:0x9a876c));}
 return merge(parts);
}

/** Adan (Pandanus): stilt roots, a crooked trunk, spiral tufts of long drooping sword leaves. */
export function pandanus({seed=1}={}){
 const rand=seeded(seed),parts=[],top=V(.6,2.6,0);
 for(let k=0;k<5;k++){const a=k/5*Math.PI*2+rand()*.4;parts.push(sweep(new THREE.QuadraticBezierCurve3(V(Math.cos(a)*.75,-.2,Math.sin(a)*.75),V(Math.cos(a)*.4,.6,Math.sin(a)*.4),V(.08,1.2,0)),{segments:4,sides:5,radius:()=>.05,color:0x8f7d63}));}
 const trunk=new THREE.CatmullRomCurve3([V(0,1,0),V(.35,1.9,.1),top]);parts.push(sweep(trunk,{segments:6,sides:6,radius:t=>.13*(1-.25*t),ring:k=>k%2?0x8a7a64:0x6f604e}));
 const heads=[top.clone().add(V(.5,.7,.3)),top.clone().add(V(-.4,.8,-.4)),top.clone().add(V(.1,1.1,0))];
 for(const [h,head] of heads.entries()){parts.push(sweep(new THREE.LineCurve3(top,head),{segments:2,sides:5,radius:()=>.08,color:0x7a6a55}));
  for(let l=0;l<12;l++){const a=l*2.39996+h,elev=.9-l*.09,len=1.3+rand()*.5,pts=[];
   const at=t=>head.clone().add(V(Math.cos(a)*Math.cos(elev-t*1.6)*len*t,Math.sin(elev-t*1.6)*len*t,Math.sin(a)*Math.cos(elev-t*1.6)*len*t));
   for(let s=0;s<4;s++){const t0=s/4,t1=(s+1)/4,w0=.11*(1-t0*.8),w1=.11*(1-t1*.8),side=V(-Math.sin(a),0,Math.cos(a));const p0=at(t0),p1=at(t1);
    pts.push([p0.clone().addScaledVector(side,-w0).toArray(),p1.clone().addScaledVector(side,-w1).toArray(),p0.clone().add(V(0,.02,0)).toArray()],[p0.clone().add(V(0,.02,0)).toArray(),p1.clone().addScaledVector(side,-w1).toArray(),p1.clone().add(V(0,.02,0)).toArray()],[p0.clone().add(V(0,.02,0)).toArray(),p1.clone().add(V(0,.02,0)).toArray(),p0.clone().addScaledVector(side,w0).toArray()],[p0.clone().addScaledVector(side,w0).toArray(),p1.clone().add(V(0,.02,0)).toArray(),p1.clone().addScaledVector(side,w1).toArray()]);}
   parts.push(tris(pts.flat(),l<3?0x86b55a:l<9?0x5f9a45:0x9aa060));}}
 // One ripening fruit, the orange "pineapple" the hermit crabs wait for.
 parts.push(part(new THREE.IcosahedronGeometry(.22,1).scale(1,1.25,1).translate(heads[0].x,heads[0].y-.35,heads[0].z),0xe0873a));
 return merge(parts);
}

/** A banana plant: a green pseudostem and a fountain of broad paddle leaves, ribbed down the middle. */
export function bananaPlant({seed=1}={}){
 const rand=seeded(seed),parts=[part(new THREE.CylinderGeometry(.11,.17,1.9,8).translate(0,.95,0),0x7f9a4a)];
 for(let l=0;l<7;l++){const a=l*2.39996+rand()*.3,elev=1.15-l*.08,len=1.6+rand()*.4,base=V(0,1.75+l*.02,0),pts=[];
  const at=t=>base.clone().add(V(Math.cos(a)*Math.cos(elev-t*1.2)*len*t,Math.sin(elev-t*1.2)*len*t,Math.sin(a)*Math.cos(elev-t*1.2)*len*t));
  const side=V(-Math.sin(a),0,Math.cos(a));
  for(let s=0;s<6;s++){const t0=s/6,t1=(s+1)/6,w=t=>.42*Math.sin(Math.PI*Math.min(1,.08+t*.95)),p0=at(t0),p1=at(t1),fold=.05;
   for(const sd of [-1,1]){const e0=p0.clone().addScaledVector(side,sd*w(t0)).add(V(0,-fold,0)),e1=p1.clone().addScaledVector(side,sd*w(t1)).add(V(0,-fold,0));pts.push(p0.toArray(),p1.toArray(),e0.toArray(),e0.toArray(),p1.toArray(),e1.toArray());}}
  parts.push(tris(pts.map(x=>[x]).flat(),(p,n,i)=>new THREE.Color(l===6?0x9fa04e:0x5fae45).lerp(new THREE.Color(0x3d8a3a),(i%6)/12)));}
 return merge(parts);
}

/** A fern: a ring of arching pinnate fronds. */
export function fern({seed=1,size=1}={}){
 const rand=seeded(seed),parts=[];
 for(let f=0;f<9;f++)parts.push(frond({length:.95*size,rise:1.2,droop:1.7,leaflets:12,leaflet:.24*size,vee:.25,rand},{yaw:f/9*Math.PI*2+rand()*.3,pitch:.5+rand()*.3,base:V(0,.05,0),young:0x6aab4a,old:0x3d7d3a,midrib:0x55803e}));
 return merge(parts);
}

/** A shrub of several leafy clumps; with `flowers`, hibiscus or bougainvillea blooms on the sunny side. */
export function shrub({seed=1,flowers=null,size=1}={}){
 const rand=seeded(seed),parts=[];
 const n=3+Math.floor(rand()*2);
 for(let k=0;k<n;k++){const a=k/n*Math.PI*2+rand(),r=k?.42*size:0;parts.push(clump(.6*size*(.8+rand()*.4),{detail:1,lump:.2,seed:seed*3+k,light:0x5f9e46,dark:0x24572c,mid:0x3d7c37,squash:.85}).translate(Math.cos(a)*r,.45*size+rand()*.25*size,Math.sin(a)*r));}
 if(flowers)for(let k=0;k<30;k++){const a=rand()*Math.PI*2,e=rand()*1.2,r=.75*size;const c=V(Math.cos(a)*Math.cos(e)*r,.55*size+Math.sin(e)*r*.75,Math.sin(a)*Math.cos(e)*r);parts.push(part(new THREE.TetrahedronGeometry(.1*size,0).translate(c.x,c.y,c.z),k%6?flowers:0xf6e3a0));}
 return merge(parts);
}

/** A tuft of grass blades, darker at the root. */
export function grassTuft({seed=1,height=.45,blades=9}={}){
 const rand=seeded(seed),pts=[];
 for(let b=0;b<blades;b++){const a=rand()*Math.PI*2,lean=.15+rand()*.35,h=height*(.6+rand()*.6),w=.035,x=Math.cos(a)*.08,z=Math.sin(a)*.08,s=V(-Math.sin(a),0,Math.cos(a));
  const tip=V(x+Math.cos(a)*lean*h,h,z+Math.sin(a)*lean*h);pts.push([V(x,0,z).addScaledVector(s,-w).toArray()],[V(x,0,z).addScaledVector(s,w).toArray()],[tip.toArray()]);}
 return tris(pts.flat(),(p)=>new THREE.Color(0x3f7a33).lerp(new THREE.Color(0x9cc260),Math.min(1,p.y/height)));
}

/** A coral-limestone or basalt rock: rounded, pitted, paler where the weather reaches it. */
export function rock({seed=1,size=1,flat=.7,light=0xd8d2c0,dark=0x8f8a7e}={}){
 const g=new THREE.DodecahedronGeometry(size,1),p=g.attributes.position,v=V(0,0,0);
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const n=noise3(v.x*1.7/size+seed,v.y*1.7/size,v.z*1.7/size+seed*.3),m=noise3(v.x*4/size,v.y*4/size+seed,v.z*4/size);v.multiplyScalar(1+.32*(n-.5)+.08*(m-.5));v.y*=flat;p.setXYZ(i,v.x,v.y,v.z);}
 const L=new THREE.Color(light),D=new THREE.Color(dark);
 const geo=part(g,(q,n)=>D.clone().lerp(L,THREE.MathUtils.clamp(n.y*.55+.45+(hash3(Math.round(q.x*3),Math.round(q.y*3),Math.round(q.z*3))-.5)*.25,0,1)));
 geo.computeBoundingBox();geo.computeBoundingSphere();return geo;
}

/** Silvered driftwood: a bleached, bent log with the stub of a branch. */
export function driftwood({seed=1,length=2.4}={}){
 const rand=seeded(seed),c=new THREE.QuadraticBezierCurve3(V(-length/2,.08,0),V(0,.12,rand()*.6-.3),V(length/2,.1,rand()*.4-.2));
 return merge([sweep(c,{segments:6,sides:6,radius:t=>.12*(1-.4*t),color:0xb9b2a2}),sweep(new THREE.LineCurve3(V(.2,.12,0),V(.6,.35,.45)),{segments:2,sides:5,radius:()=>.04,color:0xa49d8e})]);
}

/** A beach shell: a ribbed fan (scallop) or a little cone. */
export function shell({seed=1}={}){
 const rand=seeded(seed);
 if(rand()<.5){const pts=[];for(let k=0;k<7;k++){const a0=-1+k/7*2,a1=-1+(k+1)/7*2,r=.07,y=k%2?.018:.008;pts.push([[0,.004,0]],[[Math.sin(a0)*r,y,Math.cos(a0)*r]],[[Math.sin(a1)*r,y,Math.cos(a1)*r]]);}return tris(pts.flat(),rand()<.5?0xf2d9c8:0xe9e2d4);}
 return part(new THREE.ConeGeometry(.03,.09,6).rotateZ(Math.PI/2).translate(0,.025,0),0xe7cfb3);
}
