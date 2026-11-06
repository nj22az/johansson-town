import {SAKURA_FONT,refreshSakuraPrint} from './sakura-print.js';
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {SAKURA_SHELVES} from './sakura-layout.js';

/**
 * The edges of Sakura's shelves, the way a konbini dresses them.
 *
 * - A price channel along the lip of every board: a cream strip with a red top line,
 *   which the shelf's price tags (store-advertising.js) sit in. One merged mesh.
 * - Shelf talkers: small cards on a stalk standing out into the aisle at a few boards,
 *   so you see them looking down the aisle rather than face on. One merged mesh.
 *
 * Fridges carry their own strips (shop-refrigerator.js) and are left alone.
 */
// These describe the shelf, never an unimplemented discount or limited-stock offer.
export const SAKURA_TALKERS=Object.freeze([
 ['おすすめ','STAFF PICKS','#d7263d','#ffffff'],['定番','EVERYDAY','#ffcf3f','#3b2a1a'],
 ['日用品','DAILY GOODS','#2a8fcc','#ffffff'],['食品','PANTRY','#3f6e58','#ffffff'],
]);
/** One small category card per selected board, clear of its actual price tag. */
const TALKER_AT=Object.freeze({chips:[0,0],noodles:[3,2],chocolate:[0,0],soap:[2,0],curry:[3,0],pudding:[1,1],battery:[2,0]});

function colourise(geometry,hex){
 const c=new THREE.Color(hex),a=new Float32Array(geometry.attributes.position.count*3);
 for(let i=0;i<a.length;i+=3)a.set(c.toArray(),i);geometry.setAttribute('color',new THREE.BufferAttribute(a,3));return geometry;
}
function talkerTexture(){
 const c=document.createElement('canvas');c.width=1024;c.height=256;
 const draw=ctx=>SAKURA_TALKERS.forEach(([jp,en,bg,ink],i)=>{
  const x=i*256;ctx.clearRect(x,0,256,256);ctx.fillStyle=bg;ctx.fillRect(x+8,28,240,200);
  ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font=`700 48px ${SAKURA_FONT}`;ctx.fillText(jp,x+128,110,218);
  ctx.font=`700 25px ${SAKURA_FONT}`;ctx.fillText(en,x+128,172,218);
 });
 draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 refreshSakuraPrint(t,draw,SAKURA_TALKERS.map(t=>t[0]+t[1]).join(''));return t;
}

export function buildShelfEdges(room){
 const rails=[],cards=[];
 for(const [id,shelf] of Object.entries(SAKURA_SHELVES)){
  if(!shelf.width||shelf.fridge!=null)continue;
  const front=new THREE.Vector3(Math.sin(shelf.yaw),0,Math.cos(shelf.yaw)),along=new THREE.Vector3(Math.cos(shelf.yaw),0,-Math.sin(shelf.yaw));
  for(const [i,level] of shelf.levels.entries()){
   const put=(g,dx,dy,depth)=>{g.rotateY(shelf.yaw);g.translate(shelf.x+front.x*depth+along.x*dx,level+dy,shelf.z+front.z*depth+along.z*dx);return g;};
   rails.push(colourise(put(new THREE.BoxGeometry(shelf.width,.034,.012),0,-.024,.112),0xf7f1e1));
   rails.push(colourise(put(new THREE.BoxGeometry(shelf.width,.006,.014),0,-.006,.113),0xc8342d));
   const talker=TALKER_AT[id];
   if(talker&&talker[1]===i){
    // A card on a clear stalk at the end of the board, edge on to the shelf front.
    // Two cards back to back, so it reads the right way round from either end of the aisle.
    for(const side of [1,-1]){
     const kind=talker[0],g=new THREE.PlaneGeometry(.12,.12),uv=g.attributes.uv;
     for(let j=0;j<uv.count;j++)uv.setX(j,(kind+uv.getX(j))/SAKURA_TALKERS.length);
     g.rotateY(side*Math.PI/2);g.translate(side*.002,0,0);cards.push(put(g,shelf.width/2-.25,.07,.2));
    }
   }
  }
 }
 const group=new THREE.Group();group.name='Sakura shelf edges';room.add(group);
 if(rails.length){
  const mesh=new THREE.Mesh(mergeGeometries(rails),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5}));
  mesh.name='Sakura price channels';group.add(mesh);
 }
 if(cards.length){
  const mesh=new THREE.Mesh(mergeGeometries(cards),new THREE.MeshBasicMaterial({map:talkerTexture(),transparent:true,alphaTest:.5,toneMapped:false}));
  mesh.name='Sakura shelf talkers';group.add(mesh);
 }
 [...rails,...cards].forEach(g=>g.dispose());
 return group;
}
