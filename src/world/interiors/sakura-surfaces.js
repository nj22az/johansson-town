import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {SAKURA_SHELL,SAKURA_FLOOR_INSETS,floorWithout} from './sakura-shell.js';
import {SAKURA_BAND} from './sakura-cheer.js';

/**
 * Light on Sakura's surfaces, cel style.
 *
 * - The floor's sheen: a konbini floor is polished, and the tubes lie along it as long
 *   soft streaks down the aisles. Here they are painted, once, into one additive layer
 *   just over the terrazzo. The shelving and the mats stand on top of it.
 * - Sakura's stripe -- red, orange, yellow, as on the till canopy -- run under the wooden
 *   band round the walls, which gives the walls the colour a konbini's walls carry.
 *
 * Two draws in all.
 */
// Where the floor shows the tubes: down the middle of each aisle, where you look along
// the polish and see the lights lying in it. [x, z0, z1].
const AISLES=Object.freeze([[-5.5,-2.6,2.6],[-2.8,-2.9,3.0],[0,-2.9,3.0],[3.1,-2.9,2.9]]);
const S=SAKURA_SHELL,FLOOR={x0:S.westX,x1:S.eastX,z0:S.partitionZ,z1:S.floorFront};

function canvas(w,h,draw){
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
/** The streaks, painted in floor coordinates: x across the canvas, z down it. */
function sheenTexture(){
 const W=1024,H=Math.round(1024*(FLOOR.z1-FLOOR.z0)/(FLOOR.x1-FLOOR.x0));
 return canvas(W,H,(ctx,w,h)=>{
  ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
  const px=x=>(x-FLOOR.x0)/(FLOOR.x1-FLOOR.x0)*w,pz=z=>(z-FLOOR.z0)/(FLOOR.z1-FLOOR.z0)*h;
  for(const [x,z0,z1] of AISLES){
   // A soft band, brightest on its centre line, fading at both ends.
   const cx=px(x),half=w*.05,top=pz(z0),bottom=pz(z1);
   const across=ctx.createLinearGradient(cx-half,0,cx+half,0);
   across.addColorStop(0,'rgba(255,248,232,0)');across.addColorStop(.5,'rgba(255,248,232,.85)');across.addColorStop(1,'rgba(255,248,232,0)');
   ctx.fillStyle=across;ctx.fillRect(cx-half,top,half*2,bottom-top);
   const fade=ctx.createLinearGradient(0,top,0,bottom);
   fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(.12,'rgba(0,0,0,0)');fade.addColorStop(.88,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');
   ctx.fillStyle=fade;ctx.fillRect(cx-half,top,half*2,bottom-top);
  }
 });
}
const glow=(map,opacity)=>new THREE.MeshBasicMaterial({map,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});

export function buildSakuraSurfaces(room){
 const group=new THREE.Group();group.name='Sakura surfaces';room.add(group);
 // The floor's sheen, over the whole shop floor at once.
 // The till's tiles and the restroom's mosaic have no terrazzo sheen: it is cut round them as the floor is.
 const floor=new THREE.Mesh(floorWithout(FLOOR.x0,FLOOR.x1,FLOOR.z0,FLOOR.z1,SAKURA_FLOOR_INSETS,.004),glow(sheenTexture(),.42));
 floor.name='Sakura floor sheen';floor.renderOrder=1;
 group.add(floor);
 // Sakura's stripe under the wall band.
 const stripes=[],y=SAKURA_BAND.y0;
 for(const r of SAKURA_BAND.runs){
  const length=r.x!=null?r.z1-r.z0:r.x1-r.x0,cx=r.x!=null?r.x:(r.x0+r.x1)/2,cz=r.x!=null?(r.z0+r.z1)/2:r.z;
  // Just proud of the wall, on the side the band faces.
  const out=new THREE.Vector3(Math.sin(r.yaw),0,Math.cos(r.yaw)).multiplyScalar(.004);
  [[0xd7263d,0],[0xf08a24,1],[0xffcf3f,2]].forEach(([hex,i])=>{
   const g=new THREE.PlaneGeometry(length,.022);g.rotateY(r.yaw);g.translate(cx+out.x,y-.013-i*.022,cz+out.z);
   const c=new THREE.Color(hex),a=new Float32Array(g.attributes.position.count*3);for(let k=0;k<a.length;k+=3)a.set(c.toArray(),k);
   g.setAttribute('color',new THREE.BufferAttribute(a,3));g.deleteAttribute('uv');stripes.push(g);
  });
 }
 const stripe=new THREE.Mesh(mergeGeometries(stripes),new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false}));stripe.name='Sakura wall stripe';group.add(stripe);
 stripes.forEach(g=>g.dispose());
 return group;
}
