import * as THREE from '../../../vendor/three.module.js';
import {addMinatoInterior} from '../izakaya.js?snappy=1';
import {buildCompactDiningRoom} from './minato-compact-room.js';

/**
 * Inside Sato Ramen. The room is the shared interior model, so the kitchen behind the
 * counter is Minato's own line carried on round the corner; this adds what only the
 * ramen shop has: white lunch light, the wooden menu plaques, the steam off the pots,
 * and its counter and window seats, each served by Mrs Sato across the counter or at the ledge.
 */
/** The drinks corner needs a real support, clear of the cook's approach at z=-3.72. */
export const SATO_DRINKS_STAND=Object.freeze({x:10.72,z:-3.2,width:.94,depth:.56,floor:.04,top:.92});
export function buildRamenDrinksStand(){
 const s=SATO_DRINKS_STAND,g=new THREE.Group();g.name='Sato Ramen drinks stand';
 g.userData.purpose={for:'Mrs Sato, serving coffee and cold barley tea.',why:'Supports the coffee urn, jug and cups at working height instead of leaving them in mid-air.',where:'The east end of the ramen kitchen, beside the serving pass.'};
 const steel=new THREE.MeshStandardMaterial({color:0x9ca9a5,metalness:.55,roughness:.4});
 const top=new THREE.Mesh(new THREE.BoxGeometry(s.width,.04,s.depth),steel);top.position.y=s.top-.02;top.name='Drinks stand top';g.add(top);
 const height=s.top-.04-s.floor;
 for(const x of [-s.width/2+.045,s.width/2-.045])for(const z of [-s.depth/2+.045,s.depth/2-.045]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.04,height,.04),steel);leg.position.set(x,s.floor+height/2,z);leg.name='Drinks stand leg';g.add(leg);}
 return g;
}

export function buildSatoRamenRoom(options){
 return buildCompactDiningRoom(options,{addInterior:addMinatoInterior,kind:'ramen'});
}
