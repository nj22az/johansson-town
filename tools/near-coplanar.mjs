import * as THREE from '../vendor/three.module.js';
import {coplanarOverlaps} from './z-fighting.mjs';

/**
 * Near-coplanar faces: the flicker the owner still saw after the coplanar scan passed (26 November 2026, on his iPad:
 * "Lots of z fighting I thought we eliminated it", "no z fighting allowed"). tools/z-fighting.mjs finds two faces within
 * one fixed tolerance; this sets the tolerance from what the depth buffer can tell apart at the distance a pair is seen
 * from, and adds what that scan was blind to: identical-looking pairs and decals in the rooms drawn with the Kikkou line
 * (`ink`), and two faces alike but for taking shadows.
 *
 * The arithmetic (game.js: PerspectiveCamera(65°, near 0.15 m, far 640 m); ink-pipeline.js draws into a 24-bit depth
 * target, and a Metal GPU stores it as 32-bit float, which near 1.0 has the same 2⁻²⁴ step):
 *   depth step at distance z       Δz(z) = z² (f − n) / (f n 2²⁴)          (n = 0.15, f = 640)
 *     1 m 0.0004 mm · 10 m 0.040 mm · 30 m 0.36 mm · 50 m 0.99 mm · 70 m 1.95 mm · 100 m 3.97 mm
 *   two faces are told apart when their depths differ by more than both their errors: each is rounded (one step) and
 *   interpolated over a different triangulation after a float32 transform (about one more), so margin 4 steps:
 *     required gap g(z) = 4 Δz(z)
 *   the distance a pair matters at: the farthest it still covers 4 × 4 pixels on the owner's screen (an iPad held
 *   upright, about 2000 drawn rows under a 65° lens: one pixel is 2 tan 32.5° / 2000 = 0.64 mrad), capped at the place's
 *   longest view (a room's diagonal; 100 m for the town, past which the ink has faded and the fronts are a few pixels):
 *     z(A) = min(√A / (4 × 0.000637), zmax) = min(392 √A, zmax)
 *   and never less than the 2 mm the town's scans already hold (tests/no-z-fighting.test.mjs), which is what decides
 *   indoors (g(25 m) = 1.0 mm):
 *     required(A) = max(2 mm, 4 Δz(z(A)))
 *     A = 0.0005 m² → 2 mm · 0.01 m² (39 m) → 2.45 mm · 0.03 m² (68 m) → 7.3 mm · 0.065 m² and over (100 m) → 15.9 mm
 * A decal drawn with polygon offset is told apart by its offset in the picture, so it is only compared where the Kikkou
 * line is drawn (its ID pass ignores the offset: kind 'decal'), and there by the arithmetic alone, 4 Δz(z(A)) without
 * the 2 mm floor: paint is meant to lie 0.5 to 4 mm off what it is on (JSY-STD-403 rule 6), and is a fault in the ID
 * pass only where the depth cannot tell it from its backing (in practice: laid in the backing's plane).
 */
export const DEPTH=Object.freeze({near:.15,far:640,bits:24,margin:4,fov:65,rows:2000,pixels:4,floor:.002,town:100});
/** The depth buffer's step (m) at a distance z (m). */
export const depthStep=z=>z*z*(DEPTH.far-DEPTH.near)/(DEPTH.far*DEPTH.near*2**DEPTH.bits);
/** One drawn pixel's size (m) at a distance z. */
export const pixelAt=z=>2*Math.tan(DEPTH.fov*Math.PI/360)/DEPTH.rows*z;
/** The farthest (m) an overlap of `area` m² still covers DEPTH.pixels across, capped at the place's longest view. */
export const seenFrom=(area,maxDistance=DEPTH.town)=>Math.min(maxDistance,Math.sqrt(area)/(DEPTH.pixels*pixelAt(1)));
/** The separation (m) two faces overlapping by `area` m² need so as never to fight. */
export const requiredGap=(area,maxDistance=DEPTH.town)=>Math.max(DEPTH.floor,DEPTH.margin*depthStep(seenFrom(area,maxDistance)));

/**
 * Every pair of faces under `root` that look the same way, overlap, and lie nearer each other than requiredGap (each pair
 * by its own overlap, measured at the overlap; a pair exactly `required` apart passes), largest overlap first; each with
 * `required` (m) and `seen` (m).
 * `ink`: the place is drawn with the Kikkou line (render/kikkou-ids.js KIKKOU_ROOMS), so its ID pass is checked too.
 */
export function nearCoplanar(root,{regions=null,maxDistance=DEPTH.town,minArea=.0005,skip=()=>false,ink=false,keepHidden=false}={}){
 const tolerance=requiredGap(Infinity,maxDistance);
 return coplanarOverlaps(root,{regions,tolerance,minArea,skip,ink,shadowLook:true,keepHidden})
  .map(f=>({...f,required:f.kind==='decal'?DEPTH.margin*depthStep(seenFrom(f.area,maxDistance)):requiredGap(f.area,maxDistance),seen:seenFrom(f.area,maxDistance)}))
  .filter(f=>f.gap<f.required-1e-5);
}

/** A room's longest view: the diagonal of what is built in it (m), 4 m at least and 40 m at most. */
export function longestView(room){
 const box=new THREE.Box3();room.updateMatrixWorld(true);
 room.traverse(o=>{if(o.isMesh&&o.visible&&o.geometry?.attributes?.position&&!o.isInstancedMesh){o.geometry.boundingBox??o.geometry.computeBoundingBox();box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));}});
 return box.isEmpty()?8:Math.min(40,Math.max(4,box.getSize(new THREE.Vector3()).length()));
}

/** A finding as one line: the two surfaces, the overlap, the separation and what it needs, where. */
export const describe=f=>`[${f.kind}] ${f.a} | ${f.b}: ${f.area.toFixed(4)} m² ${(f.gap*1000).toFixed(2)} mm apart (needs > ${(f.required*1000).toFixed(1)} mm) at ${f.centre.join(', ')} facing ${f.normal.join(', ')}`;
