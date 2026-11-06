import * as THREE from '../../vendor/three.module.js';
import {WOODLAND_PLACE} from './harbour-noticeboard.js';

/** The owner's Blender diorama, printed beside Thuan's flyer behind the noticeboard's left door (JW-NB-003 rev A:
 * an 800 x 560 sheet, the 3:2 print contain-fitted in its 780 x 520 print box). */
export const WOODLAND_POSTER=Object.freeze({
 title:'Johansson woodland',
 prompt:'Look at the harbour notice board',
 boardImage:'./diorama/woodland/poster-board.webp',
 image:'./diorama/woodland/poster.webp',
 viewer:'./diorama/woodland/index.html',
 width:WOODLAND_PLACE.width,height:WOODLAND_PLACE.height,paper:WOODLAND_PLACE.paper,
 position:Object.freeze([...WOODLAND_PLACE.position]),
 description:'Johansson, Thuan, Vy, Mr Fujita and Tetsuo among pastel fruit trees, pines and familiar island places.',
});

let printMaterial;
function material(){
 if(!printMaterial){
  const texture=globalThis.document?.baseURI?new THREE.TextureLoader().load(new URL(WOODLAND_POSTER.boardImage,document.baseURI).href):new THREE.Texture();
  texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  printMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false});
 }
 return printMaterial;
}

export function addWoodlandPoster(parent,{register,onAction}={}){
 const {width,height,position,prompt}=WOODLAND_POSTER,group=new THREE.Group();
 group.name='Johansson woodland poster · harbour notice board';group.position.set(...position);parent.add(group);
 // The sheet's white margin is a frame round the print, in the print's own plane: one printed surface, nothing under it
 // (the pinboard is cut away behind the paper), so no face lies on another.
 const [pw,ph]=WOODLAND_POSTER.paper,margin=new THREE.Shape([[-pw/2,-ph/2],[pw/2,-ph/2],[pw/2,ph/2],[-pw/2,ph/2]].map(([x,y])=>new THREE.Vector2(x,y)));
 margin.holes.push(new THREE.Path([[-width/2,-height/2],[-width/2,height/2],[width/2,height/2],[width/2,-height/2]].map(([x,y])=>new THREE.Vector2(x,y))));
 const paper=new THREE.Mesh(new THREE.ShapeGeometry(margin),new THREE.MeshStandardMaterial({color:0xfff7e7,roughness:1}));
 paper.name='Woodland poster paper';group.add(paper);
 const print=new THREE.Mesh(new THREE.PlaneGeometry(width,height),material());
 print.name='Johansson woodland poster print';group.add(print);
 for(const x of [-width*.42,width*.42]){
  const pin=new THREE.Mesh(new THREE.SphereGeometry(.009,8,6),new THREE.MeshStandardMaterial({color:0x987858,roughness:.8}));
  pin.name='Woodland poster drawing pin';pin.position.set(x,ph/2-.01,.008);group.add(pin);
 }
 // The visible sheet and the board's walking anchor open the same menu. This also
 // gives mouse/touch picking a real surface, without a competing flyer prompt.
 register?.(group,prompt,()=>onAction?.('harbour-notice-board'));
 return group;
}
