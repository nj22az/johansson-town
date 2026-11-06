import * as THREE from '../../vendor/three.module.js';
import {assetURL} from '../assets.js';

// Minato Drinks reaches the quay crews here, opposite the ferry apron. The
// warehouse's blank south end carries the campaign; its working frontage stays clear.
export const J_COFFEE_BANNER=Object.freeze({
 file:'graphics/advertising/j-coffee-island-banner.webp',
 width:5.1,height:1.7,position:Object.freeze([-13.6,2.65,-45.58]),yaw:Math.PI,
});
let material;
function bannerMaterial(){
 if(!material){
  material=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
  material.name='J-Coffee island campaign';
  const texture=new THREE.TextureLoader().load(assetURL(J_COFFEE_BANNER.file));
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;material.map=texture;
 }
 return material;
}
export function buildJCoffeeBanner(parent){
 const S=J_COFFEE_BANNER,group=new THREE.Group();group.name='J-Coffee warehouse wall banner';
 group.position.set(...S.position);group.rotation.y=S.yaw;group.userData.sharedAsset=true;
 const backing=new THREE.Mesh(new THREE.BoxGeometry(S.width+.08,S.height+.08,.04),
  new THREE.MeshStandardMaterial({color:0x314d51,roughness:.85}));
 backing.position.z=-.025;group.add(backing);
 const print=new THREE.Mesh(new THREE.PlaneGeometry(S.width,S.height),bannerMaterial());
 print.name='J-Coffee · A little island time';group.add(print);parent.add(group);
 return group;
}
