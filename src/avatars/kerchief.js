import * as THREE from '../../vendor/three.module.js';
import {unitToModel,headReach,dirAt,TUCK_R,shapeScale} from './head-cover.js';
import {orient} from './police-uniform.js';

/**
 * The kitchen kerchief: a sankakukin (三角巾), the triangle of cotton every Japanese school-lunch server, kitchen hand and
 * shop cook ties over the hair (and the boiler-room oiler over his, against the oil mist). It covers all the hair: the long
 * edge is folded over once and laid low and straight across the forehead, about a finger above the brows; from the
 * temples it runs down over the tops of the ears to the nape, where the two ends are tied in a knot, two short tails
 * standing out of it, the triangle's point hanging under it.
 *
 * Built as cloth on the head (head-cover.js): it lies a couple of millimetres over the head, the hair under it and the
 * tops of the ears, every hair point under it drawn in (kerchiefTuck), and the fringe just below its front edge pushed
 * under it, so no hair shows at the front or the sides and nothing comes through. The folded hem is a doubled band of
 * cloth with a soft roll at its edge, so the front reads as cloth folded over, not the rim of a cap; the crown has a
 * little slack, the cloth gathers behind in a pouch above the knot, and creases fan out from the knot over the back and
 * the sides. Its colour is the hat colour: white for the school lunch squad and Mrs Nakamura, the red of Sato Ramen's
 * noren for Mrs Sato in the kitchen, red for the oiler.
 */
export const KERCHIEF=Object.freeze({
 /**
  * The folded edge's height on the head's unit sphere: straight across the forehead to `straight` radians either side of
  * the front, down past the temples (by `temple`, so from the front it turns down at the corners as a headscarf does, not
  * round like a cap's rim) to the tops of the ears at the side, and from behind the ears (`behind`) to the nape.
  */
 edge:Object.freeze({front:.35,straight:.24,temple:.85,side:-.02,back:-.42,behind:.75}),gap:.022,
 /** The folded hem: its height up from the edge (radians on the head), how far it stands off the cloth, its rolled edge. */
 hem:Object.freeze({height:.1,lift:.02,roll:.032}),
 /** The cloth's slack: over the crown, gathered behind above the knot (a pouch), and a soft unevenness. */
 slack:Object.freeze({crown:.03,wave:.012}),
 /** Where the ends are drawn round above the ears the cloth bunches: how much, where (azimuth from the back, height). */
 bunch:Object.freeze({size:.13,at:1.25,y:.32,across:.4,up:.3}),
 pouch:Object.freeze({size:.08,across:.85,y:-.08,up:.4}),
 /** Hair under the cloth is tucked from this far outside the edge (in the edge's own measure) to the edge. */
 tuck:Object.freeze([-.06,0]),
 /** The fringe below the front edge is pushed in under it: how far round from the front, how far below the edge. */
 fringe:Object.freeze({reach:1.35,below:.24,under:.965}),
 knot:Object.freeze({size:.15}),
 /** The creases fanning from the knot: how far round the head each runs (radians) and how high it reaches. */
 creases:Object.freeze([Object.freeze([2.3,.3]),Object.freeze([1.55,.02]),Object.freeze([1.15,.38]),Object.freeze([.65,.7])]),
 tails:Object.freeze({length:.5,width:.085,spread:1.2}),
 /** The triangle's point, hanging under the knot: its length and width at the knot (unit radii). */
 point:Object.freeze({length:.24,width:.3}),
 why:'Hair covered over food, the way school lunch servers and cooks in Japan wear it: a triangle of cotton tied at the nape.',
});

const {smoothstep,lerp}=THREE.MathUtils;
/** The folded edge's height at azimuth a (0 straight ahead). */
export function kerchiefEdge(a){
 const E=KERCHIEF.edge,x=Math.abs(Math.atan2(Math.sin(a),Math.cos(a)));
 // behind the ears it goes straight down to the nape, so from the front the cloth frames the face down the sides of the head
 return x<E.temple?lerp(E.front,E.side,smoothstep(x,E.straight,E.temple)):lerp(E.side,E.back,smoothstep(x,Math.PI/2,Math.PI/2+E.behind));
}
/** How far a unit point is under the cloth (positive) or out from under it (negative). */
export const kerchiefField=(x,y,z)=>{const r=Math.hypot(x,y,z)||1;return y/r-kerchiefEdge(Math.atan2(x,z));};
const frontness=(x,z)=>1-smoothstep(Math.abs(Math.atan2(x,z)),KERCHIEF.fringe.reach-.2,KERCHIEF.fringe.reach);
/**
 * How much of the hair at a unit point the kerchief tucks in (0–1): everything under the cloth, and at the front the fringe
 * a little below the edge too; `target` is how far in (TUCK_R under the cloth, under the skin for the fringe).
 */
export function kerchiefTuck(x,y,z){
 const f=kerchiefField(x,y,z),F=KERCHIEF.fringe;
 return Math.max(smoothstep(f,KERCHIEF.tuck[0],KERCHIEF.tuck[1]),frontness(x,z)*(1-smoothstep(-f,F.below,F.below+.06)));
}
// (the fringe goes under the skin from a little above the edge, under the hem, so not a hair of it shows below the roll)
kerchiefTuck.target=(x,y,z)=>{const f=kerchiefField(x,y,z);return lerp(TUCK_R,lerp(TUCK_R,KERCHIEF.fringe.under,frontness(x,z)),1-smoothstep(f,.01,.05));};

/** The ears, as build.js draws them, in the head's unit space: centre and half-axes. */
function ears(recipe,m){
 const visible=recipe.hair.style==='braids',r=visible?.22:.2;
 return [-1,1].map(s=>({c:new THREE.Vector3(s*(visible?1.025:.97),-(visible?.025:.08)/m.headSY,(visible?.08:-.05)/.98),
  h:new THREE.Vector3(r*.55/m.headSX,r/m.headSY,r*.8/.98)}));
}
/** How far out along d an ear reaches (0 when the line misses it). */
function earReach(list,d){
 let best=0;
 for(const {c,h} of list){const dx=d.x/h.x,dy=d.y/h.y,dz=d.z/h.z,cx=c.x/h.x,cy=c.y/h.y,cz=c.z/h.z,a=dx*dx+dy*dy+dz*dz,b=-2*(dx*cx+dy*cy+dz*cz),k=cx*cx+cy*cy+cz*cz-1,disc=b*b-4*a*k;
  if(disc>0)best=Math.max(best,(-b+Math.sqrt(disc))/(2*a));}
 return best;
}

export function addKerchief(list,recipe,m,kit){
 const K=KERCHIEF,c=recipe.outfit.hatColour,spec=kit.HAIR[recipe.hair.style]||null,flip=recipe.hair.flip,U=v=>unitToModel(v,m);
 const fold=new THREE.Color(c).multiplyScalar(.9).getStyle(),centre=new THREE.Vector3(0,m.headCentre,0);
 // The cloth lies over whatever is highest under it: between two of its rows it is a straight chord, so each point takes the
 // most the head and hair reach a little either side of it, and the chord's own sag.
 // The slack of the cloth gathers behind, above the knot, in a soft pouch: a kerchief, not a swimming cap.
 const pouch=(a,y)=>{const da=Math.atan2(Math.sin(a-Math.PI),Math.cos(a-Math.PI));return K.pouch.size*Math.exp(-((da/K.pouch.across)**2)-(((y-K.pouch.y)/K.pouch.up)**2));};
 // a little slack over the crown and an unevenness, so its outline is cloth, not a dome
 const slack=(a,y)=>{const back=Math.abs(Math.atan2(Math.sin(a-Math.PI),Math.cos(a-Math.PI))),B=K.bunch;
  return K.slack.crown*smoothstep(y,.25,.95)+K.slack.wave*(1+Math.sin(3*a+1.3))*Math.sin(Math.PI*smoothstep(y,-.2,.9))+B.size*Math.exp(-(((back-B.at)/B.across)**2)-(((y-B.y)/B.up)**2));};
 const earList=ears(recipe,m),under=d=>Math.max(headReach(spec,d,1,flip,shapeScale(d,m)),earReach(earList,d)+.012);
 const NA=32,NR=8,reach=(a,th,step)=>{let r=0;for(const k of [-.5,0,.5]){const t=Math.min(Math.PI/2,th+k*step);r=Math.max(r,under(dirAt(a,Math.sin(t))));}return r/Math.cos(step/2)/Math.cos(Math.PI/NA)+K.gap+pouch(a,Math.sin(th))+slack(a,Math.sin(th));};
 const rowTh=(a,j)=>{const e=Math.asin(kerchiefEdge(a));return e+(Math.PI/2-e)*j/NR;},rings=[];
 for(let j=0;j<NR;j++){const row=[];
  for(let i=0;i<NA;i++){const a=i/NA*Math.PI*2,th=rowTh(a,j),step=rowTh(a,1)-rowTh(a,0),d=dirAt(a,Math.sin(th));row.push(U(d.multiplyScalar(reach(a,th,step))));}
  rings.push(row);}
 const pos=[],index=[];for(const row of rings)for(const p of row)pos.push(p.x,p.y,p.z);
 const top=U(new THREE.Vector3(0,reach(0,Math.PI/2,.1),0)),ti=pos.length/3;pos.push(top.x,top.y,top.z);
 for(let j=0;j+1<NR;j++)for(let i=0;i<NA;i++){const a=j*NA+i,b=j*NA+(i+1)%NA,cc=a+NA,d=b+NA;index.push(a,cc,b,b,cc,d);}
 for(let i=0;i<NA;i++)index.push((NR-1)*NA+i,ti,(NR-1)*NA+(i+1)%NA);
 const cloth=new THREE.BufferGeometry();cloth.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));cloth.setIndex(index);
 kit.part(list,orient(cloth,()=>centre),'head',c);
 // The folded hem: the long edge turned over once, a doubled band of cloth from the forehead round over the ears to the
 // knot, standing proud of the cloth with a soft round top where it folds, and a rolled lower edge on the forehead.
 const B=K.hem,NB=48,hemRows=[];
 for(const [f,lift] of [[0,B.lift*.6],[.2,B.lift],[.9,B.lift*.7],[1.08,0]]){const row=[];
  for(let i=0;i<NB;i++){const a=i/NB*Math.PI*2,e=Math.asin(kerchiefEdge(a)),th=e+B.height*f,step=rowTh(a,1)-rowTh(a,0),d=dirAt(a,Math.sin(th));row.push(U(d.multiplyScalar(reach(a,th,step)+lift)));}
  hemRows.push(row);}
 {const pos=[],idx=[];for(const row of hemRows)for(const p of row)pos.push(p.x,p.y,p.z);
  for(let j=0;j+1<hemRows.length;j++)for(let i=0;i<NB;i++){const a=j*NB+i,b=j*NB+(i+1)%NB;idx.push(a,a+NB,b,b,a+NB,b+NB);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
  kit.part(list,orient(g,()=>centre),'head',c).attributes.ink.array.fill(.75);}
 const edge=hemRows[0].map((p,i)=>{const a=i/NB*Math.PI*2,e=Math.asin(kerchiefEdge(a)),d=dirAt(a,Math.sin(e-.006));return U(d.multiplyScalar(reach(a,e,rowTh(a,1)-rowTh(a,0))+B.roll*.45));});
 kit.part(list,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(edge,true),NB,m.Rh*B.roll,4,true),'head',fold).attributes.ink.array.fill(.55);
 // The cloth drawn back to the knot: soft creases fanning out from it over the back and the sides.
 for(const [da,el] of K.creases)for(const sgn of [-1,1]){
  const pts=[];for(let i=0;i<=16;i++){const f=i/16,a=Math.PI+sgn*da*f**.8,e0=Math.asin(K.edge.back+.08),th=e0+(el-e0)*f,step=rowTh(a,1)-rowTh(a,0);
   pts.push(U(dirAt(a,Math.sin(th)).multiplyScalar(reach(a,th,step)+.006)));}
  const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),9,m.Rh*.018,3,false);
  // thicker in the middle of its run, nothing at its ends: a fold that fades into the cloth
  const P=g.attributes.position;for(let i=0;i<P.count;i++){const t=Math.floor(i/4)/9,c=new THREE.CatmullRomCurve3(pts).getPointAt(t),v=new THREE.Vector3().fromBufferAttribute(P,i);v.sub(c).multiplyScalar(Math.sin(Math.PI*t)**.7).add(c);P.setXYZ(i,v.x,v.y,v.z);}
  g.computeVertexNormals();kit.part(list,g,'head',fold).attributes.ink.array.fill(.3);
 }
 // The triangle's point, hanging from under the knot, lying on the back of the head.
 {const P=K.point,top=K.edge.back+.04,rows=5,pos=[],idx=[];
  for(let j=0;j<=rows;j++){const t=j/rows,y=top-P.length*t,half=P.width/2*(1-t);
   for(const s of [-1,0,1]){const a=Math.PI+s*half,th=Math.asin(Math.max(-.95,y)),d=dirAt(a,Math.sin(th));pos.push(...U(d.multiplyScalar(Math.max(headReach(spec,d,0,flip),under(d))+K.gap+.012)).toArray());}}
  for(let j=0;j<rows;j++)for(let i=0;i<2;i++){const a=j*3+i;idx.push(a,a+3,a+1,a+1,a+3,a+4);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);
  kit.part(list,orient(g,()=>centre),'head',c).attributes.ink.array.fill(.6);}
 // The knot at the nape and its two tails, standing out and down from it.
 const dk=dirAt(Math.PI,K.edge.back+.05),knot=U(dk.clone().multiplyScalar(reach(Math.PI,Math.asin(K.edge.back+.05),.1)+K.hem.roll*1.6)),R=m.Rh;
 kit.part(list,new THREE.SphereGeometry(1,8,6),'head',fold,new THREE.Matrix4().compose(knot,new THREE.Quaternion(),new THREE.Vector3(R*K.knot.size*1.25,R*K.knot.size*.85,R*K.knot.size*.8))).attributes.ink.array.fill(.6);
 for(const s of [-1,1]){
  const T=K.tails,dir=new THREE.Vector3(s*Math.sin(T.spread),-Math.cos(T.spread),-.35).normalize(),mid=knot.clone().addScaledVector(dir,R*T.length*.5);
  const g=new THREE.CapsuleGeometry(1,1.6,2,6);
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir);
  // flat cloth: thin across its face, which looks out from the nape
  const flat=new THREE.Quaternion().setFromAxisAngle(dir,s*.35);q.premultiply(flat);
  kit.part(list,g,'head',c,new THREE.Matrix4().compose(mid,q,new THREE.Vector3(R*T.width,R*T.length/3.6,R*T.width*.3))).attributes.ink.array.fill(.5);
 }
 return {knot,edge:KERCHIEF.edge};
}
