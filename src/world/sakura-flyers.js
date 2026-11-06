import * as THREE from '../../vendor/three.module.js';
import {FLYER_PATH} from '../commerce/sakura-flyer.js';
let paperMaterial;
function material(){
 if(!paperMaterial){const texture=globalThis.document?.baseURI?new THREE.TextureLoader().load(new URL(FLYER_PATH,document.baseURI).href):new THREE.Texture();texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;paperMaterial=new THREE.MeshStandardMaterial({map:texture,roughness:.94,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4,side:THREE.DoubleSide});}
 return paperMaterial;
}
export function addSakuraFlyer(parent,{position,width=.42,rotation=[0,0,0],stack=false}={}){
 const group=new THREE.Group();group.name=stack?'Sakura flyer counter copies':'Sakura flyer on harbour notice board';group.position.set(...position);group.rotation.set(...rotation);parent.add(group);
 if(stack){const pile=new THREE.Mesh(new THREE.BoxGeometry(width,width*1280/900,.012),new THREE.MeshStandardMaterial({color:0xf7e5b4,roughness:1}));pile.position.z=-.007;group.add(pile);}
 const sheet=new THREE.Mesh(new THREE.PlaneGeometry(width,width*1280/900),material());sheet.name='Thuan’s English shop flyer';group.add(sheet);
 if(!stack){const pin=new THREE.Mesh(new THREE.SphereGeometry(.012,8,6),new THREE.MeshStandardMaterial({color:0xb93c39}));pin.position.set(0,width*1280/900/2-.016,.01);group.add(pin);}
 return group;
}
