import * as THREE from '../../vendor/three.module.js';
import {shapeHeadPoint} from './head-profile.js';

/**
 * Fitting things that are worn on the head (the police cap, the kerchief) to the head and the hair that is under them.
 *
 * Hats and hair are built in the head's unit space: a sphere of radius 1 round the head's centre, shaped by the head's
 * profile (head-profile.js) and scaled to the head, exactly as the hair cap is (build.js hairCap, addHair). So a hat built
 * here against `headReach` sits on the same surface the hair and the face are drawn on, for every head form.
 *
 * Under a full hat the hair is tucked (build.js addHair): every hair point the hat covers is drawn in to TUCK_R, so the
 * hat can sit just over it and nothing comes through. Each hat says which hair it covers (hatTuck): a cap's band from the
 * band down, a kerchief everything under its cloth, the older hats everything above the line y = 0.3.
 */
export const TUCK_R=1.035;
const {smoothstep,lerp}=THREE.MathUtils;

/** A point in the head's unit space carried to model space (the hair's own mapping, build.js addHair). */
export function unitToModel(v,m){
 const q=shapeHeadPoint(v.clone(),m.profile);
 return new THREE.Vector3(q.x*m.headSX*m.Rh,m.headCentre+q.y*m.headSY*m.Rh,q.z*m.Rh*.98);
}

/**
 * How far out the head and its hair reach along the unit direction d, in unit radii: 1 on bare skin, the style's own
 * radius where it has hair (its fringe, parting and hairline as hairCap draws them), drawn in to TUCK_R by `tuck` (0–1)
 * where a hat tucks it. `spec` is the style's HAIR entry (build.js), null when bald.
 */
export function headReach(spec,d,tuck=0,flip=false,scale=1){
 let r=1;
 if(spec&&spec.ring){
  // A horseshoe: the band of hair round the back and over the ears.
  r=lerp(1,spec.radius,smoothstep(-d.z,-.35,-.1)*(1-smoothstep(d.y,.45,.6)));
 }else if(spec){
  let front=spec.front;const side=flip?-1:1;
  if(spec.swoop)front-=spec.swoop*smoothstep(d.x*side,-.3,.5);
  if(spec.centre)front-=spec.centre*smoothstep(Math.abs(d.x),.04,.42);
  const outFace=Math.max(.18-d.z,Math.abs(d.x)-spec.faceHalf,d.y-front);
  const low=lerp(spec.side,spec.back,smoothstep(-d.z,-.2,.7));
  const f=Math.min(outFace,d.y-low),full=spec.radius*(1+(spec.lift&&d.y>0?d.y*spec.lift:0));
  r=lerp(1,Math.max(1,full),smoothstep(f,-.035,.035));
 }
 // Tucked hair is drawn in to TUCK_R after the head's shaping (build.js addHair), which scales a direction by `scale`
 // (shapeScale): before it, that is TUCK_R / scale.
 const tucked=TUCK_R/scale;
 return r>tucked?lerp(r,tucked,tuck):r;
}
/** How much the head's shaping (head-profile.js: the flatter face, the jaw) scales a unit direction d. */
export const shapeScale=(d,m)=>shapeHeadPoint(d.clone(),m.profile).length();

/** The unit direction at azimuth a (0 straight ahead, +x the wearer's left) and height y on the unit sphere. */
export const dirAt=(a,y)=>{const h=Math.sqrt(Math.max(0,1-y*y));return new THREE.Vector3(Math.sin(a)*h,y,Math.cos(a)*h);};
