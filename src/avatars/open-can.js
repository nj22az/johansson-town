import * as THREE from '../../vendor/three.module.js';

/**
 * A can's ring-pull tab, as the hands open it (the owner, 27 November 2026: "A can needs to be opened also, removing the
 * tab"; the opening is animated in Blender with the drink, drink-can.js, which says when each of these happens): the ring
 * lifted about the tongue's front end, then the tongue torn away whole, the tab in the left hand where it is when it tears
 * and the opening shown; then the tab in the shirt's pocket, gone. A sealed can is izakaya-serving-visuals.js 'can',
 * `sealed`: its `userData.sealed` is {tab, opening, ring}.
 */
/** Where the tongue's front end is, in the can's frame: what the ring is lifted about. */
export const PIVOT=Object.freeze(new THREE.Vector3(0,.121,.023));
/** How far the ring is lifted before the tongue tears (radians, about its front end): tools/blender/drink-can.py LIFT. */
export const LIFT=.55;
const X=new THREE.Vector3(1,0,0);

/** The ring lifted `f` of the way (0 down on the lid, 1 as far as it goes before it tears). */
export function liftTab(prop,f){
 const S=prop?.userData?.sealed;if(!S||S.off||S.done)return;
 const a=LIFT*THREE.MathUtils.clamp(f,0,1);S.tab.quaternion.setFromAxisAngle(X,a);S.tab.position.copy(PIVOT).sub(PIVOT.clone().applyAxisAngle(X,a));S.tab.updateMatrixWorld(true);
}
/** The tongue torn away: the tab into `hand` (the left hand's bone) where it is, the opening shown. */
export function tearTab(prop,hand){
 const S=prop?.userData?.sealed;if(!S||S.off||S.done)return;
 // (the whole body's places as they are now: the can's and the hand's, from the root down)
 prop.updateWorldMatrix(true,true);hand.updateWorldMatrix(true,false);hand.attach(S.tab);S.opening.visible=true;S.off=true;
}
/** The tab gone from the can for good: in the pocket, or (a move cut short) torn off and put away at once. */
function putAway(S){S.tab.removeFromParent();S.tab.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});S.opening.visible=true;S.off=true;S.done=true;}
/** The tab in the shirt's pocket: gone. */
export function pocketTab(prop){const S=prop?.userData?.sealed;if(S&&!S.done)putAway(S);}
/** A move cut short (he walked off, or another move began): the can is opened all the same, the tab put away. */
export function finishOpening(prop){pocketTab(prop);}
