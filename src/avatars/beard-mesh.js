/**
 * Beards as hair, not paint (the creator's review, 2026-10-14: the painted beards "read more like a bicycle helmet chinstrap
 * or a surgical mask than organic hair"). Each beard is a piece of the head's own sphere cut along a smooth line, as the hair
 * is (build.js cutHairCap), so it fits every head shape: it rises from nothing at its top edge (rooted in the skin, no line
 * across the cheek), grows fuller toward the jaw, pushes the chin forward, and breaks its lower outline into a few rounded
 * tufts. Its top runs up under the sideburns, so hair and beard are one mass, with no seam where they meet.
 *
 * The lines are laid out in degrees: a, round from the front (+ toward the avatar's left, as on the face), and θ, down from
 * the crown (the chin's point is 180). Seen from the front the face's outline is a = ±90 and the chin's is θ = 180.
 * Scruff stays a painted shadow (face.js drawBeardShell); every other painted beard is built here.
 */
import * as THREE from '../../vendor/three.module.js';
import {faceLayout} from './face.js';

const DEG=180/Math.PI,smooth=THREE.MathUtils.smoothstep,clamp=THREE.MathUtils.clamp;
/** A smooth curve through [x, y] points (a cubic through each, its slopes from its neighbours), flat beyond the ends. */
function curve(points){
 const n=points.length,slope=points.map((p,i)=>{const a=points[Math.max(0,i-1)],b=points[Math.min(n-1,i+1)];return (b[1]-a[1])/(b[0]-a[0]||1);});
 return x=>{
  if(x<=points[0][0])return points[0][1];if(x>=points[n-1][0])return points[n-1][1];
  let i=0;while(x>points[i+1][0])i++;
  const [x0,y0]=points[i],[x1,y1]=points[i+1],h=x1-x0,t=(x-x0)/h,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*y0+(t3-2*t2+t)*h*slope[i]+(-2*t3+3*t2)*y1+(t3-t2)*h*slope[i+1];
 };
}
/** A rounded lobe every `step` along x: 1 at each lobe's middle, 0 between. */
const lobes=(x,step)=>(.5+.5*Math.cos(2*Math.PI*x/step))**2;
/** How far inside an ellipse a point is (about in degrees: positive inside). */
const ellipse=(a,t,ca,ct,ra,rt)=>(1-Math.hypot((a-ca)/ra,(t-ct)/rt))*Math.min(ra,rt);

export const MESH_BEARDS=Object.freeze(['full','circle','chops','mutton','anchor','soul','strip']);

/**
 * The beard's piece for cutHairCap: its patch of the sphere, the field whose positive side is beard, and its height off the
 * head at each point (the head is 1). Null without a built beard.
 */
export function beardSpec(recipe){
 const paint=recipe.facial?.paint;if(!MESH_BEARDS.includes(paint))return null;
 const L=faceLayout(recipe),T=fy=>50.4+fy*.58*180/256;
 const aM=(L.mouthX-128)*1.9/256*DEG,tM=T(L.mouthY),tN=T(L.noseY),aw=14*L.mouthS*L.mouthW*1.9/256*DEG;
 const thick=.028+.05*(recipe.facial.size??.5);
 // The mouth stays clear, with room for it to open.
 const mouth=(a,t)=>-ellipse(a,t,aM,tM+3.6,aw+2.8,6.8);
 // The back edge follows the jaw: just behind the ear at the top (under the hair), slanting forward to the neck below.
 const jaw=curve([[90,93],[122,92],[148,84],[168,66],[180,40]]);
 const sides=(a,t)=>jaw(t)-Math.abs(a);
 let field,height;
 if(paint==='full'){
  // Sideburn to sideburn and round the mouth, with a moustache across the top lip: the mouth sits in the beard.
  const top=curve([[0,tN+3.5],[aw+5,tN+5],[38,tN+9],[58,tN+2],[68,94],[80,87],[110,86]]);
  field=(a,t)=>Math.min(t-top(Math.abs(a)),sides(a,t),mouth(a,t));
  height=(a,t)=>{const A=Math.abs(a);
   const body=thick*smooth(t-top(A),0,9)*(.55+.45*smooth(t,tM,165))*smooth(sides(a,t),0,8)*smooth(mouth(a,t),0,3);
   // The chin pushed forward, and tufts along the jaw's outline and under the chin.
   return body+.035*smooth(t,tM+8,168)*Math.max(0,Math.cos(a/DEG))*smooth(mouth(a,t),0,3)
    +.022*smooth(A,58,84)*smooth(t,112,130)*lobes(t-112,12)+.02*smooth(t,156,172)*lobes(a,16);};
 }else if(paint==='circle'){
  // A ring from the top lip round the mouth, opened round the lips and stretched down over the chin.
  const ring=(a,t)=>ellipse(a,t,aM,tM+9,aw+11,18);
  field=(a,t)=>Math.min(ring(a,t),mouth(a,t));
  height=(a,t)=>thick*.75*smooth(ring(a,t),0,4)*smooth(mouth(a,t),0,2)*(.6+.4*smooth(t,tM,tM+22))+.015*smooth(t,tM+16,tM+26)*lobes(a-aM,9);
 }else if(paint==='chops'||paint==='mutton'){
  if(paint==='chops'){
   // From under the sideburn down the jaw, flaring forward toward the chin like a boot, fullest at the bottom.
   const inner=curve([[80,70],[110,66],[130,58],[145,44],[160,36]]);
   const bottom=A=>curve([[30,150],[40,157],[55,158],[75,150],[90,142],[110,140]])(A)+1.8*lobes(A-40,18)*(1-smooth(A,62,74));
   const top=curve([[60,100],[70,93],[85,87],[110,86]]);   // a rounded slant up under the sideburn
   field=(a,t)=>{const A=Math.abs(a);return Math.min(t-top(A),A-inner(t),sides(a,t),bottom(A)-t);};
   height=(a,t)=>{const A=Math.abs(a);return thick*smooth(A-inner(t),0,8)*smooth(t-top(A),0,10)*(.45+.55*smooth(t,95,148))*smooth(sides(a,t),0,8);};
  }else{
   // Friendly mutton chops: full chops that sweep forward into a thick moustache over the top lip.
   const top=curve([[0,tN+3.5],[aw+6,tN+4.5],[40,tN+5],[58,99],[68,93],[80,87],[110,86]]);
   const bottom=A=>curve([[0,tM-1.6],[aw+1,tM-1.2],[aw+5,tM+5],[aw+12,tM+13],[45,tM+19],[70,150],[90,142],[110,140]])(A)+1.8*smooth(A,40,50)*(1-smooth(A,62,74))*lobes(A-45,18);
   field=(a,t)=>{const A=Math.abs(a);return Math.min(t-top(A),bottom(A)-t,sides(a,t));};
   height=(a,t)=>{const A=Math.abs(a);return thick*smooth(t-top(A),0,7)*(.55+.45*smooth(A,aw,aw+14))*(.6+.4*smooth(t,100,140))*smooth(sides(a,t),0,8);};
  }
 }else if(paint==='strip'){
  // A chin curtain: down from the sideburns, forward along the jaw to the point of the chin, widest under it.
  const top=curve([[0,157],[40,153],[65,142],[76,124],[80,93],[86,87],[110,86]]),bottom=curve([[0,167],[40,162],[70,149],[80,141],[98,139],[110,139]]);
  field=(a,t)=>{const A=Math.abs(a);return Math.min(t-top(A),bottom(A)-t,sides(a,t));};
  height=(a,t)=>{const A=Math.abs(a);return thick*.7*smooth(Math.min(t-top(A),bottom(A)-t),0,3)+.012*smooth(t,150,165)*lobes(a,12);};
 }else if(paint==='anchor'){
  // Wide along the bottom of the chin, a thin line up to the lower lip, and a pencil moustache.
  const spade=(a,t)=>Math.min(ellipse(a,t,aM,tM+25,aw+9,12),t-(tM+13.5));
  const line=(a,t)=>Math.min(1.8-Math.abs(a-aM),t-(tM+6.6),tM+16-t);
  const pencil=(a,t)=>ellipse(a,t,aM,tM-4.4,aw+1.5,1.9);
  field=(a,t)=>Math.max(spade(a,t),line(a,t),pencil(a,t));
  height=(a,t)=>thick*.6*smooth(Math.max(spade(a,t),line(a,t)),0,2.5)+thick*.25*smooth(pencil(a,t),0,1);
 }else{
  // The soul patch: an upside-down teardrop under the lower lip, round at the top and a point below.
  const c=tM+9.2,round=(a,t)=>ellipse(a,t,aM,c,3.7,3.7),drop=(a,t)=>Math.min(t-c,tM+18-t,3.7*clamp((tM+18-t)/(tM+18-c),0,1)-Math.abs(a-aM));
  field=(a,t)=>Math.max(round(a,t),drop(a,t));
  height=(a,t)=>thick*.5*smooth(field(a,t),0,1.6);
 }
 const at=v=>[Math.atan2(v.x,v.z)*DEG,Math.acos(clamp(v.y,-1,1))*DEG];
 return {
  // a from -108 to 108 and θ from 66 to the chin's point, finely enough for a pencil moustache.
  patch:[144,76,Math.PI/2-108/DEG,216/DEG,66/DEG,Math.PI-66/DEG],
  field:v=>{const [a,t]=at(v);return field(a,t);},
  radiusAt:v=>{const [a,t]=at(v);return 1.004+Math.max(0,height(a,t));},
 };
}
