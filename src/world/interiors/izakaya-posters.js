import * as THREE from '../../../vendor/three.module.js';
import {assetURL} from '../../assets.js';

export const IZAKAYA_POSTERS=Object.freeze([
 {id:'sakura',file:'sakura-konbini.webp',title:'SAKURA KONBINI · Your little island stop',jp:'Sakura',
  position:[-6.28,1.96,-4],yaw:Math.PI/2,approach:[-5.15,1.55,-4],size:[.96,1.28],
  paper:'#f6edda',ink:'#174f40',accent:'#b73741',
  line:'Sakura’s island-stop campaign, posted by Thao for the neighbours who stop at the shop before supper.'},
 {id:'yakitori',file:'minato-tori.webp',title:"MINATO TORI · Harbour Birds",jp:"Harbour Birds",
  position:[-6.28,1.96,2.7],yaw:Math.PI/2,approach:[-5.15,1.55,2.7],
  paper:'#f3efe4',ink:'#141414',accent:'#c41230',
  line:'Charcoal yakitori until last pour. Hiroshi turns the skewers; Thao keeps the sauce.'},
 {id:'sake',file:'sango-quay-artlist.webp',title:"SANGO QUAY · Minato island awamori",jp:"Sango Quay",size:[1.08,1.44],
  position:[-6.28,1.96,0.55],yaw:Math.PI/2,approach:[-5.15,1.55,0.55],
  paper:'#e7efe8',ink:'#1a3036',accent:'#c41230',
  line:'Thao’s everyday island awamori, supplied by Sakura Trading. An original Artlist harbour print for the house brand displayed on her back bar.'},
 {id:'house',file:'minato-lanterns.webp',title:"MINATO · Minato",jp:"Minato",
  position:[4.15,1.98,6.28],yaw:Math.PI,approach:[4.15,1.55,5.15],
  paper:'#1a3036',ink:'#f3efe4',accent:'#c41230',
  line:"The house poster. Red lanterns, the noren, and Welcome back — welcome back."},
]);

const posterGeometries=new Map(IZAKAYA_POSTERS.map(spec=>[spec.id,new THREE.PlaneGeometry(...(spec.size||[1.08,1.62]))]));
const posterMaterials=new Map();

function fallbackPoster(spec){
 const c=document.createElement('canvas');c.width=512;c.height=768;const x=c.getContext('2d');
 x.fillStyle=spec.paper;x.fillRect(0,0,512,768);
 x.fillStyle=spec.accent;x.fillRect(0,0,512,18);x.fillRect(0,750,512,18);
 x.textAlign='center';x.fillStyle=spec.ink;
 x.font='bold 42px serif';x.fillText(spec.title.split(' · ')[0],256,220,460);
 x.font='bold 64px serif';x.fillText(spec.jp,256,330,460);
 x.font='22px sans-serif';x.fillText('MINATO IZAKAYA · 1997',256,620,460);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function getPosterMaterial(spec){
 if(!posterMaterials.has(spec.id)){
  const material=new THREE.MeshBasicMaterial({map:fallbackPoster(spec),toneMapped:false});
  material.name='Minato poster '+spec.id;posterMaterials.set(spec.id,material);
  new THREE.TextureLoader().load(assetURL('graphics/izakaya/'+spec.file),texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;
   const placeholder=material.map;material.map=texture;material.needsUpdate=true;placeholder.dispose();
  },undefined,()=>{console.warn('Minato poster unavailable: '+spec.file+'; retaining the printed panel.');});
 }
 return posterMaterials.get(spec.id);
}

export function hangIzakayaPosters({room,reg,action,placements={}}){
 const group=new THREE.Group();group.name='Minato Showa posters';group.userData.sharedAsset=true;
 for(const original of IZAKAYA_POSTERS){
  const spec={...original,...placements[original.id]};
  const poster=new THREE.Mesh(posterGeometries.get(spec.id),getPosterMaterial(spec));
  poster.name=spec.title;poster.position.set(...spec.position);poster.rotation.y=spec.yaw;group.add(poster);
  const target=new THREE.Object3D();target.position.set(...spec.approach);target.name='Read '+spec.title;room.add(target);
  reg(target,target.name,()=>action('inspect',spec.title,spec.line+'\nPosted on the wall at Minato. Original harbour print, not a historical reproduction.'),true);
 }
 room.add(group);return group;
}
