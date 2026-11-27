import * as THREE from '../../vendor/three.module.js';
import {HAND,handHold,handleAt} from './build.js';
import {JUG} from '../people/izakaya-serving-visuals.js';

/**
 * How a hand holds each of Minato's beer glasses (the owner, 27 November 2026: "Remake it follow Disney principles how
 * should it look when anyone drinks beer"; the brief: "the handle hand's fingers through the mug's handle, thumb on top; a
 * pint glass wrapped like the can; the small glass held in the fingertips"):
 * - the draught mug (大ジョッキ, `draft`) by its handle: the bar in the closed hand's hollow (build.js handleAt), the fingers
 *   through the handle's opening and round the bar, the thumb along the bar on top (the hand's `handle` shape where the kit
 *   has one, else the fist);
 * - the pint (`pint`) wrapped round its body as the can is (consume.js canSocket, the WRAP), its axis tipped by the glass's
 *   taper so the palm lies along its side;
 * - the small glass the big bottle is poured into (`bottle`, held) in the fingertips: the hand less closed than round a can,
 *   the glass out from the palm on the fingers' pads (FINGERTIPS, measured on the kit's hand: tests/drink-beer.test.mjs).
 *
 * Each socket is the glass's own frame in the hand bone's (metres): its axis (y) along the knuckle line (the hand's +z, the
 * thumb's way, up when held upright), its +z (the side of the rim that goes to the lip) toward the wrist, its +x (the mug's
 * handle) toward the palm.
 */
export const VESSELS=Object.freeze({
 mug:Object.freeze({kind:'draft',shape:'handle',fill:.9}),
 pint:Object.freeze({kind:'pint',shape:'close',fill:.9}),
 glass:Object.freeze({kind:'bottle',shape:'close',fill:.85}),
});
/** Which of VESSELS a held prop is (by its drinkKind), or null: the beer glasses drunk as animated in Blender. */
export const vesselOf=prop=>{const k=prop?.userData?.drinkKind;return k==='draft'?'mug':k==='pint'?'pint':k==='bottle'?'glass':null;};
/** The fingertip hold of the small glass: the hand closed this share of the way it closes round a can (HAND.wrapAt), the
 *  glass's axis this many hand lengths further from the palm than a can's would be. */
export const FINGERTIPS=Object.freeze({close:.62,out:.3});
/** The hand shapes the kit and Blender need (tools/drink-beer-kit.mjs): name, closure, build.js grip shape. */
export const HAND_SHAPES=Object.freeze([['wrap',HAND.wrapAt,'close'],['fist',1,'close'],...(HAND.handleAt?[['handle',1,'handle']]:[])]);
/** How far the hand `m` closes on a vessel, and with which of build.js grip's shapes. */
export function beerGrip(m,prop){
 const v=vesselOf(prop),g=prop?.userData?.grip;
 if(v==='mug')return {amount:1,shape:HAND.handleAt?'handle':'close'};
 if(v==='glass')return {amount:FINGERTIPS.close*(HAND.wrapAt||.8),shape:'close'};
 return {amount:handHold(m,g?.radius??.034).grip,shape:'close'};
}
const BASIS=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(-1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,1,0)));
/** The same in the left hand: the right's mirrored across the hand (its x), the glass's own frame mirrored front to back (its
 *  z), which a glass round its axis with a mug's handle on its x has in itself: its handle the palm's way, its drinking side
 *  (now its -z) toward the wrist (drink-beer.js mirrorMotion). */
const BASIS_L=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(1,0,0),new THREE.Vector3(0,0,1),new THREE.Vector3(0,-1,0)));
/** The vessel's frame in the hand bone's frame (hand `side`, 'R' or 'L'), for a body of measure `m`. */
export function beerSocket(m,prop,side='R'){
 const v=vesselOf(prop),g=prop?.userData?.grip||{},s=side==='R'?1:-1;
 if(v==='mug'){
  // (the bar's axis where the closed hand holds a bar so thick, its middle there; the jug beyond it, through the fingers)
  const [bx,by,bz]=handleAt(m,side,g.bar??JUG.bar),mid=(JUG.opening[0]+JUG.opening[1])/2;
  return {position:new THREE.Vector3(bx+s*JUG.barX,by,bz-mid),quaternion:(side==='R'?BASIS:BASIS_L).clone()};
 }
 const h=handHold(m,g.radius??.033),out=h.out+(v==='glass'?FINGERTIPS.out*m.hand:0);
 const quaternion=(side==='R'?BASIS:BASIS_L).clone();
 // (a glass wider at the top: its axis tipped away from the palm as it rises, by the taper, so the palm lies on its side)
 if(g.taper)quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),s*g.taper));
 return {position:new THREE.Vector3(s*out,h.at[1],-(g.height??.06)),quaternion};
}
/** The rim on the side that goes to the lip, in the vessel's frame, 3 mm under its top (the lip goes over it): its +z side,
 *  or held in the left hand (`side` 'L'), its -z (BASIS_L). */
export const beerRim=(prop,side='R')=>{const g=prop?.userData?.grip||{},v=vesselOf(prop),r=v==='mug'?JUG.r:v==='pint'?.0378:v==='glass'?.03:(g.radius??.033);
 return new THREE.Vector3(0,(prop?.userData?.rimHeight??.12)-.003,(side==='L'?-1:1)*r*.92);};
