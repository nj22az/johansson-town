import * as THREE from '../../vendor/three.module.js';
import {createShopProduct,shopProductTemplate} from '../commerce/shop-product.js';

/**
 * What Johansson carries round Sakura before he pays.
 *
 * One thing goes in his hand, the way you would carry a single bottle to the till. Two
 * or more and he picks up one of the shop's red plastic baskets, with the tops of what
 * is in it showing over the rim. The prop follows the basket in the konbini state, so it
 * appears, changes and disappears with Into the basket, Put something back and paying.
 *
 * Props are built with their origin at the grip — the middle of a single item, the top
 * of the basket's handles — because holders put that point in the palm.
 */
const RED=0xd7263d,RED_DARK=0xa81a2e,WHITE=0xfff6ea;

/** The item alone, centred on the grip and a touch larger than life so it reads in hand. */
export function carriedItem(id){
 const product=createShopProduct(id),b=shopProductTemplate(id).bounds,group=new THREE.Group();
 product.position.y=-(b.min.y+b.max.y)/2;product.scale.setScalar(1);
 group.add(product);group.scale.setScalar(1.15);group.name='Carried '+id;group.userData.shopCarry=true;
 return group;
}

/** A konbini basket: slatted red sides, a white rim band, two handles meeting at the grip. */
export function carriedBasket(ids=[]){
 const group=new THREE.Group();group.name='Sakura basket';group.userData.shopCarry=true;
 const W=.2,D=.32,H=.17,drop=.13,wall=.008;
 const red=new THREE.MeshStandardMaterial({color:RED,roughness:.55}),dark=new THREE.MeshStandardMaterial({color:RED_DARK,roughness:.6}),white=new THREE.MeshStandardMaterial({color:WHITE,roughness:.6});
 const top=-drop,bottom=top-H;
 const box=(w,h,d,x,y,z,m)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);group.add(mesh);return mesh;};
 box(W,.01,D,0,bottom+.005,0,dark);
 // Each side is three bars with gaps between them: the slotted look of the real thing.
 for(let i=0;i<3;i++){
  const y=bottom+.03+i*.05;
  for(const s of [-1,1]){box(wall,.032,D,s*W/2,y,0,red);box(W,.032,wall,0,y,s*D/2,red);}
 }
 for(const s of [-1,1]){box(wall*1.4,.02,D+.01,s*W/2,top-.01,0,white);box(W+.01,.02,wall*1.4,0,top-.01,s*D/2,white);}
 // Handles: two arcs from the long rims, meeting over the middle where the hand is.
 for(const s of [-1,1]){
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(s*W/2,top,-D*.28),new THREE.Vector3(s*W*.18,-.01,-D*.12),new THREE.Vector3(s*W*.06,0,0),new THREE.Vector3(s*W*.18,-.01,D*.12),new THREE.Vector3(s*W/2,top,D*.28)]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve,20,.007,6),red));
 }
 // What is inside: up to four things standing in it, their tops over the rim.
 const shown=ids.slice(0,4);
 shown.forEach((id,i)=>{
  const product=createShopProduct(id),b=shopProductTemplate(id).bounds,h=b.max.y-b.min.y;
  const s=Math.min(1,(H*1.25)/Math.max(h,.01));product.scale.setScalar(s);
  product.position.set((i%2?.045:-.045),bottom+.012-b.min.y*s,(Math.floor(i/2)?.07:-.07)+(i%2?.02:0));
  product.rotation.y=i*.5;group.add(product);
 });
 return group;
}

/**
 * @param {{holder:()=>({hold(prop:any):void}|null)}} options
 */
export function createShopCarry({holder}){
 let key='',prop=null,owner=null;
 // The products share the shelf templates; only the basket's own pieces are freed.
 const dispose=old=>old?.traverse(o=>{if(o.isMesh&&!o.parent?.userData?.sharedAsset)o.geometry.dispose();});
 const release=()=>{if(prop&&owner){owner.hold(null);}dispose(prop);prop=null;owner=null;key='';};
 return {
  /** @param {string[]} basket product ids; @param {boolean} active in the shop, visible */
  sync(basket,active){
   const h=active?holder():null;
   if(!h||!basket?.length){if(prop)release();return;}
   const next=basket.length===1?'one:'+basket[0]:'basket:'+basket.slice(0,4).join(',')+':'+Math.min(basket.length,4);
   if(next===key&&owner===h)return;
   if(prop&&owner&&owner!==h)owner.hold(null);
   dispose(prop);
   prop=basket.length===1?carriedItem(basket[0]):carriedBasket(basket);
   h.hold(prop);owner=h;key=next;
  },
  get holding(){return prop?(key.startsWith('one:')?'item':'basket'):null;},
  release,
 };
}
