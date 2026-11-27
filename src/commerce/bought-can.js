import * as THREE from '../../vendor/three.module.js';
import {createDrinkProp} from '../people/izakaya-beer.js';
import {vendingProductOf} from './vending-catalogue.js';
import {PRODUCTS,RETIRED} from './products-data.js';
import {VENDING_COLUMNS,VENDING_MACHINE,vendingCanTexture} from '../world/vending.js';
import {getLabelMaterial,packagingSlot,ATLAS_COLS,ATLAS_ROWS,ATLAS_SPAN} from '../world/interiors/store-advertising.js';

/**
 * The can you bought, in his hand while he drinks it (the owner, 27 November 2026, of the hands: "Can they still drink
 * beer or anything from the vending machines?"). In the third-person view he played the drink with an empty hand: the
 * can was only drawn in front of the first-person camera (interact/hands.js).
 *
 * It is the izakaya's can (people/izakaya-serving-visuals.js), whose grip, rim and tilt the hand is already fitted to
 * (consume.js fitAvatarHeldProp; tests/izakaya-bar.test.mjs), printed as what was bought: a machine's can with the
 * machine's own print (world/vending.js vendingCanTexture: the beers' drawn in Python, tools/draw-vending-cans.py), at the
 * size of the machine's column it came from (190 g, 350 ml or the 500 ml long can; a retired can at the size it was
 * sold in); Sakura's own can (Umineko lager) with the shop's printed label, the one on its shelf.
 */
const SERVING={radius:.033,label:.092,labelAt:.062};   // the izakaya can's printed side (izakaya-serving-visuals.js)
// A drawn print covers the band the machine's dummy can shows, 0.86 of the can's height (vending.js sampleCan); this
// can's printed side is .092 of its .122, so it shows the middle of it at the same scale, the mascots unstretched.
const ART_SHARE=SERVING.label/(.122*.86);
const SHOP_DRINKS=[...PRODUCTS,...RETIRED].filter(p=>p.drink);

/** The machine's can size for a product: the column it is sold from (VENDING_COLUMNS). */
function vendingSize(product){
 const column=VENDING_COLUMNS.find(c=>c.id===product.id),can=VENDING_MACHINE.cans[column?.size??product.size??350];
 return {x:can.diameter/(SERVING.radius*2),y:can.height/.122};   // (the izakaya can is a 350 ml can, 6.6 cm by 12.2)
}

function printed(geometry,material,name){
 const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.position.set(0,SERVING.labelAt,0);
 mesh.castShadow=false;mesh.receiveShadow=true;return mesh;
}

/** A machine's can: its print once round the can, the front at the middle (vending.js paintCan). */
function vendingPrint(product){
 const map=vendingCanTexture(product.id);if(!map)return [];
 const geometry=new THREE.CylinderGeometry(SERVING.radius,SERVING.radius,SERVING.label,32,1,true,-Math.PI,Math.PI*2);
 if(product.art){const uv=geometry.attributes.uv,lo=(1-ART_SHARE)/2;for(let i=0;i<uv.count;i++)uv.setY(i,lo+uv.getY(i)*ART_SHARE);}
 return [printed(geometry,new THREE.MeshStandardMaterial({map,roughness:.45,metalness:.15}),'Printed can · '+product.brand)];
}

/** Sakura's own can: the shelf's label from the packaging atlas round the front, the brand's paper round the back. */
function shopPrint(product){
 const slot=packagingSlot(product.id);if(slot===undefined)return [];
 const front=new THREE.CylinderGeometry(SERVING.radius,SERVING.radius,SERVING.label,24,1,true,-Math.PI*.8,Math.PI*1.6),uv=front.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,(slot%ATLAS_COLS+.025+uv.getX(i)*.95)/ATLAS_SPAN,1-(Math.floor(slot/ATLAS_COLS)+.025+(1-uv.getY(i))*.95)/ATLAS_ROWS);
 const atlas=getLabelMaterial().map;
 return [printed(front,new THREE.MeshBasicMaterial({map:atlas,toneMapped:false}),'Printed can · '+product.brand.name),
  printed(new THREE.CylinderGeometry(SERVING.radius,SERVING.radius,SERVING.label,8,1,true,Math.PI*.8,Math.PI*.4),
   new THREE.MeshStandardMaterial({color:product.brand.paper,roughness:.45,metalness:.15}),'Can back · '+product.brand.name)];
}

/** The bought can `name` (its name in the bag), ready for Johansson's hand (actors.js hold). */
export function createBoughtCan(name){
 // (sealed: he opens it first, open-can.js)
 const prop=createDrinkProp('can',{held:true,sealed:true});prop.name='Bought can · '+name;prop.userData.bought=name;
 const vending=vendingProductOf(name),shop=SHOP_DRINKS.find(p=>p.inventoryName===name);
 const print=vending?vendingPrint(vending):shop?shopPrint(shop):[];
 const serving=prop.getObjectByName('Printed serving product label');
 if(print.length&&serving){serving.removeFromParent();serving.geometry.dispose();serving.material.dispose();prop.add(...print);}
 if(vending){
  // A 190 g can is smaller than the izakaya's 350 ml one, the 500 ml long can taller: the can drawn to its column's size, and the hold and the rim
  // that the hand and the mouth are fitted to (consume.js drinkGrip, fitAvatarHeldProp) measured on it as drawn.
  const s=vendingSize(vending);
  if(Math.abs(s.x-1)>.01||Math.abs(s.y-1)>.01){
   const inner=new THREE.Group();inner.name='Can at its size';inner.scale.set(s.x,s.y,s.x);inner.add(...prop.children);prop.add(inner);
   const g=prop.userData.grip;prop.userData.grip={...g,radius:g.radius*s.x,height:g.height*s.y};prop.userData.rimHeight*=s.y;
  }
 }
 return prop;
}
