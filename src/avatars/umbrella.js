import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';

/**
 * An umbrella, held in the right hand when it rains (people/schedules.js umbrellaFor, avatars/actors.js).
 *
 * A long umbrella of the 1990s: eight ribs, a shallow canopy, a straight shaft and a crook handle. It is
 * built with the grip at the origin and the shaft straight up, in the body's frame; fitUmbrella puts the
 * grip in the hand every frame and leans the shaft towards the head, the way you hold one, so the canopy
 * is over the head and clears it, however tall the one holding it, and stays steady while the arm moves.
 *
 * Nothing is random: each colour has a reason (UMBRELLA_COLOURS).
 */
export const UMBRELLA=Object.freeze({
 ribs:8,radius:.5,rise:.15,          // the canopy: 1 m across, a shallow dome
 clear:.07,                          // between the top of the head and the rim
 minRise:.55,                        // the canopy never comes lower than this above the grip
 shaft:.006,ferrule:.07,             // the shaft's radius and the tip above the canopy
 crook:Object.freeze({radius:.035,tube:.011}),
});

/** Who carries which colour, and why. */
export const UMBRELLA_COLOURS=Object.freeze({
 adult:Object.freeze({canopy:0x2a3244,why:'Navy: the plain long umbrella most grown-ups in 1990s Japan owned, and the one Sakura keeps by the door.'}),
 child:Object.freeze({canopy:0xf2c623,why:'Yellow: the safety colour schoolchildren carry, so drivers see them on a grey day.'}),
 Thuan:Object.freeze({canopy:0xe79bb3,why:'Pink, like the shirt she calls her favourite.'}),
});

/** The colour record for a resident: by name first, then a child's yellow, then the grown-up's navy. */
export function umbrellaColourFor(name,age){
 if(UMBRELLA_COLOURS[name])return UMBRELLA_COLOURS[name];
 return Number.isFinite(age)&&age<13?UMBRELLA_COLOURS.child:UMBRELLA_COLOURS.adult;
}

function coloured(g,hex){
 const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);
 for(let i=0;i<a.length;i+=3)a.set(c.toArray(),i);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;
}
const plain=g=>g.index?g.toNonIndexed():g;
const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,side:THREE.DoubleSide});
const canopies=new Map();

/** The canopy and its ribs' tips, its rim at y=0 and its crown at y=rise. */
function canopyGeometry(hex){
 if(canopies.has(hex))return canopies.get(hex);
 const {ribs,radius,rise,ferrule}=UMBRELLA;
 const parts=[
  // eight flat panels: a cone open at the bottom, its seams on the ribs
  coloured(new THREE.ConeGeometry(radius,rise,ribs,1,true).translate(0,rise/2,0),hex),
  // the tip above the crown
  coloured(new THREE.CylinderGeometry(.004,UMBRELLA.shaft*1.4,ferrule,6).translate(0,rise+ferrule/2,0),0x9aa0a6),
 ];
 // the rib ends, small caps at each corner of the rim
 for(let i=0;i<ribs;i++){const a=i/ribs*Math.PI*2;
  parts.push(coloured(new THREE.SphereGeometry(.009,6,4).translate(Math.sin(a)*radius,0,Math.cos(a)*radius),0x9aa0a6));}
 const merged=mergeGeometries(parts.map(plain));parts.forEach(g=>g.dispose());
 canopies.set(hex,merged);return merged;
}
let shaftGeometry=null,crookGeometry=null;
/** A unit-long shaft from the grip up (scaled to length by fitUmbrella). */
function shaft(){
 return shaftGeometry??=coloured(new THREE.CylinderGeometry(UMBRELLA.shaft,UMBRELLA.shaft,1,6).translate(0,.5,0),0x6f6a62);
}
/** The crook: half a ring below the grip, opening forward. */
function crook(){
 const {radius,tube}=UMBRELLA.crook;
 return crookGeometry??=coloured(new THREE.TorusGeometry(radius,tube,5,10,Math.PI).rotateY(Math.PI/2).rotateX(Math.PI).translate(0,-.02,-radius),0x4a3626);
}

/** An umbrella in a colour from UMBRELLA_COLOURS. Its parts are shared; only the group is new. */
export function buildUmbrella(colour=UMBRELLA_COLOURS.adult){
 const group=new THREE.Group();group.name='Umbrella';
 const stick=new THREE.Mesh(shaft(),material),hook=new THREE.Mesh(crook(),material),top=new THREE.Mesh(canopyGeometry(colour.canopy),material);
 stick.name='Umbrella shaft';hook.name='Umbrella handle';top.name='Umbrella canopy';
 for(const m of [stick,hook,top]){m.castShadow=true;m.userData.sharedAsset=true;group.add(m);}
 group.userData={umbrella:true,colour:colour.canopy,shaft:stick,canopy:top,rise:UMBRELLA.minRise};
 stick.scale.y=UMBRELLA.minRise;top.position.y=UMBRELLA.minRise;
 return group;
}

/** How high the canopy's middle sits above the grip, held upright, to clear the head: head top + clear, never below minRise. */
export function umbrellaRise(gripY,headTopY){
 return Math.max(UMBRELLA.minRise,headTopY+UMBRELLA.clear-gripY);
}

const _p=new THREE.Vector3(),_q=new THREE.Quaternion(),_lean=new THREE.Quaternion(),_top=new THREE.Vector3(),_dir=new THREE.Vector3(),_m=new THREE.Matrix4(),_one=new THREE.Vector3(1,1,1);
const UP=new THREE.Vector3(0,1,0);
/** The most the shaft is leaned from upright to bring the canopy over the head (about 18 degrees). */
export const UMBRELLA_MAX_LEAN=.32;
/**
 * Grip in the right hand; the shaft leaned from the grip towards the top of the head, as anybody holds one, so the
 * canopy's middle is over the head; the canopy raised along the shaft until it clears the head even on its low side.
 * Once a frame.
 */
export function fitUmbrella(avatar,prop){
 const hand=avatar.bones.handR,m=avatar.measure;avatar.root.updateWorldMatrix(true,true);
 avatar.root.getWorldQuaternion(_q);
 // the grip is in the palm, a little below the wrist joint
 hand.localToWorld(_p.set(0,-m.hand*.55,0));
 avatar.root.localToWorld(_top.set(0,m.headCentre+m.Rh*m.headSY,0));
 // lean: from the grip towards a point over the head, no further than UMBRELLA_MAX_LEAN
 const height=Math.max(UMBRELLA.minRise,_top.y+UMBRELLA.clear-_p.y);
 _dir.set(_top.x-_p.x,height,_top.z-_p.z);
 const lean=Math.min(UMBRELLA_MAX_LEAN,Math.atan2(Math.hypot(_dir.x,_dir.z),_dir.y));
 const across=Math.hypot(_dir.x,_dir.z);
 _dir.set(across>1e-6?_dir.x/across*Math.sin(lean):0,Math.cos(lean),across>1e-6?_dir.z/across*Math.sin(lean):0);
 _lean.setFromUnitVectors(UP,_dir);
 // along the leaned shaft, far enough that the low side of the rim still clears the head
 const rise=Math.max(UMBRELLA.minRise,(height+UMBRELLA.radius*Math.sin(lean)*.5)/Math.cos(lean));
 if(Math.abs(rise-prop.userData.rise)>1e-4){prop.userData.rise=rise;prop.userData.shaft.scale.y=rise;prop.userData.canopy.position.y=rise;}
 prop.userData.lean=lean;
 _m.compose(_p,_lean.multiply(_q),_one);
 prop.matrixAutoUpdate=false;prop.matrix.copy(hand.matrixWorld).invert().multiply(_m);prop.matrixWorldNeedsUpdate=true;
}

/** The places a body is under a roof, whatever the street plan says (people/schedules.js flags). */
const UNDER_A_ROOF=Object.freeze(['indoors','inVehicle','inBookshop','inWorkplace','inIzakaya','inOnsen','inMarket','inRamen','inHome']);
/**
 * Whether someone out in the town has their umbrella up: raining, in the street, and the right hand free.
 * Not seated, not cycling or driving, not carrying a box, a drink, a dish or a broom, not working a town
 * object (a vending machine, a bench), and not the body the player is steering.
 */
export function wantsUmbrella(u,rain){
 if(!rain||!u)return false;
 if(UNDER_A_ROOF.some(k=>u[k]))return false;
 if(u.playerControlled||u.usingTownObject||u.carrying||u.heldItem||u.tool||u.socialPose==='Drink'||u.socialPose==='Eat')return false;
 if(Number.isFinite(u.seatHeight)||u.sleeping||u.bicyclePhase||u.climbing)return false;
 return true;
}
