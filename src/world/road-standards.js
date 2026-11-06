import * as THREE from '../../vendor/three.module.js';
import {GROUND_EDGE} from './ground-standard.js';

/**
 * Public roads to one standard, the way a prefectural road office in 1997 would draw them.
 *
 * Minato is a small Okinawan town of the late 1990s, so its streets follow the national
 * rules of the day as an island public-works office applied them:
 *
 *  - 道路構造令 (Road Structure Ordinance): narrow local streets are single carriageways
 *    without a centre line; a raised kerb (歩車道境界ブロック) divides footway from road,
 *    dropped flush where people cross.
 *  - 道路標識、区画線及び道路標示に関する命令 (signs and markings order): road paint is white;
 *    edge lines (外側線) are solid white, 15 cm; zebra crossings (横断歩道) are white bars
 *    45 cm wide with 45 cm gaps and, since 1992, no side lines; a stop line is a solid
 *    white bar with 止まれ painted before it, under the red inverted-triangle sign.
 *  - The blue square crossing sign (407-A), on a post at each end of a crossing.
 *  - 点字ブロック: yellow warning blocks where a footway meets a crossing.
 *  - Okinawan practice: an ishiganto (石敢當) in the wall where a road runs straight into
 *    a house, to stop the mabui that travel in straight lines.
 *
 * One definition of each, so every street that uses it agrees.
 */
export const ROAD_STANDARD=Object.freeze({
 paint:0xf2efe6,
 edgeLine:Object.freeze({width:.15,inset:.3}),
 zebra:Object.freeze({bar:.45,gap:.45,length:3}),
 stopLine:Object.freeze({width:.45}),
 /** The kerb is the ground rulebook's (ground-standard.js GROUND_EDGE.kerb): 15 cm by 18 cm. */
 kerb:Object.freeze({height:GROUND_EDGE.kerb.height,width:GROUND_EDGE.kerb.width}),
 tactile:Object.freeze({depth:.3,colour:0xf2c230}),
});

const decal={depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2};
/**
 * Road paint is unlit (a decal takes no light, so it never fights the asphalt's ramp), which
 * left it glowing white on a night street. Every paint material registers here and is dimmed
 * together with the town's fill (setRoadPaintLight, from game.js setTime).
 */
const paints=new Set(),paintByColour=new Map();
let paintLight=1;
export function registerRoadPaint(material){
 material.userData.paintColour=material.color.getHex();paints.add(material);
 material.color.setHex(material.userData.paintColour).multiplyScalar(paintLight);return material;
}
/** One unlit paint material per colour, shared by every street. */
export function roadPaintMaterial(colour=ROAD_STANDARD.paint){
 if(!paintByColour.has(colour))paintByColour.set(colour,registerRoadPaint(new THREE.MeshBasicMaterial({color:colour,...decal})));
 return paintByColour.get(colour);
}
/** @param {number} level 1 in full day, the town's fill at night (dusk.js decalLight) */
export function setRoadPaintLight(level){
 paintLight=Math.max(0,Math.min(1,Number.isFinite(level)?level:1));
 for(const m of paints)m.color.setHex(m.userData.paintColour).multiplyScalar(paintLight);
}
const paint=()=>roadPaintMaterial(ROAD_STANDARD.paint);

/** A flat painted rectangle on the road, centred at x,z, rotated about y. */
export function paintPatch(parent,w,d,x,y,z,ry=0,name='Road paint'){
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),paint());m.rotation.set(-Math.PI/2,0,ry);m.position.set(x,y+.006,z);m.renderOrder=1;m.name=name;m.raycast=()=>{};parent.add(m);return m;
}

/**
 * A zebra crossing across a road running along z: bars lie along the road, spaced
 * across it, between the two kerb lines.
 */
export function zebraCrossing(parent,{x0,x1,z,y=0}){
 const {bar,gap,length}=ROAD_STANDARD.zebra,span=x1-x0,n=Math.floor((span-gap)/(bar+gap));
 const start=x0+(span-(n*bar+(n-1)*gap))/2+bar/2;
 const g=new THREE.Group();g.name='Zebra crossing (横断歩道)';parent.add(g);
 for(let i=0;i<n;i++)paintPatch(g,bar,length,start+i*(bar+gap),y,z,0,'Zebra bar');
 return g;
}

/** Solid white edge lines along a polyline of [x,z] points, following the ground. */
export function edgeLines(parent,points,{width:roadWidth,heightAt=()=>0,step=1}={}){
 const {width,inset}=ROAD_STANDARD.edgeLine,offset=roadWidth/2-inset,dashes=[];
 for(let i=1;i<points.length;i++){
  const [ax,az]=points[i-1],[bx,bz]=points[i],len=Math.hypot(bx-ax,bz-az),nx=-(bz-az)/len,nz=(bx-ax)/len,ry=Math.atan2(bx-ax,bz-az);
  for(let t=step/2;t<len;t+=step)for(const s of [-1,1]){const x=ax+(bx-ax)*t/len+nx*offset*s,z=az+(bz-az)*t/len+nz*offset*s;dashes.push([x,heightAt(x,z),z,ry]);}
 }
 const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(width,step*1.04).rotateX(-Math.PI/2),paint(),dashes.length),d=new THREE.Object3D();
 dashes.forEach(([x,y,z,ry],i)=>{d.position.set(x,y+.035,z);d.rotation.set(0,ry,0);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});
 mesh.name='Edge line (外側線)';mesh.renderOrder=1;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.raycast=()=>{};parent.add(mesh);
 return mesh;
}

function canvasTexture(w,h,draw){
 if(typeof document==='undefined'||!document.createElement)return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');if(!ctx)return null;draw(ctx,w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
let crossingSignFace=null,stopSignFace=null,ishigantoFace=null,tactileFace=null;
/** 407-A: blue square, white triangle, a pedestrian on a zebra. */
function crossingFace(){return crossingSignFace??=canvasTexture(128,128,(ctx,w)=>{
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,w);ctx.fillStyle='#1f5aa8';ctx.fillRect(5,5,w-10,w-10);
 ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(w/2,16);ctx.lineTo(w-16,w-20);ctx.lineTo(16,w-20);ctx.closePath();ctx.fill();
 ctx.fillStyle='#1c1c1c';for(let i=0;i<4;i++)ctx.fillRect(34+i*16,w-34,9,8);
 ctx.beginPath();ctx.arc(w/2+3,48,6,0,7);ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='#1c1c1c';ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(w/2+1,56);ctx.lineTo(w/2-3,74);ctx.lineTo(w/2-12,86);ctx.moveTo(w/2-3,74);ctx.lineTo(w/2+8,86);ctx.moveTo(w/2-10,64);ctx.lineTo(w/2+12,62);ctx.stroke();
});}
/** 330: red inverted triangle, 止まれ. */
function stopFace(){return stopSignFace??=canvasTexture(128,128,(ctx,w)=>{
 ctx.fillStyle='#ffffff';ctx.beginPath();ctx.moveTo(2,6);ctx.lineTo(w-2,6);ctx.lineTo(w/2,w-4);ctx.closePath();ctx.fill();
 ctx.fillStyle='#c8202a';ctx.beginPath();ctx.moveTo(12,12);ctx.lineTo(w-12,12);ctx.lineTo(w/2,w-16);ctx.closePath();ctx.fill();
 ctx.fillStyle='#ffffff';ctx.font='bold 27px "Hiragino Sans","Noto Sans CJK JP",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('止まれ',w/2,44);
});}
function ishigantoTexture(){return ishigantoFace??=canvasTexture(64,160,(ctx,w,h)=>{
 ctx.fillStyle='#d9d3c3';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#b9b2a0';ctx.lineWidth=4;ctx.strokeRect(2,2,w-4,h-4);
 ctx.fillStyle='#2b2a26';ctx.font='bold 38px "Hiragino Mincho ProN","Noto Serif CJK JP",serif';ctx.textAlign='center';ctx.textBaseline='middle';
 ['石','敢','當'].forEach((c,i)=>ctx.fillText(c,w/2,32+i*46));
});}
function tactileTexture(){return tactileFace??=canvasTexture(64,64,(ctx,w)=>{
 ctx.fillStyle='#f2c230';ctx.fillRect(0,0,w,w);ctx.fillStyle='#d9a91c';
 for(let y=0;y<5;y++)for(let x=0;x<5;x++){ctx.beginPath();ctx.arc(7+x*12.5,7+y*12.5,3.6,0,7);ctx.fill();}
 ctx.strokeStyle='#c99a18';ctx.lineWidth=2;ctx.strokeRect(1,1,w-2,w-2);
});}

/** The 330 sign's plate outline (the face's white border, stopFace), seen from the back: an inverted triangle. */
export function stopPlateShape(size){
 const p=(px,py)=>[(px/128-.5)*size,(.5-py/128)*size],shape=new THREE.Shape();
 const [a,b,c]=[p(2,6),p(126,6),p(64,124)];shape.moveTo(...a);shape.lineTo(...c);shape.lineTo(...b);shape.closePath();
 return new THREE.ShapeGeometry(shape);
}
const steel=()=>new THREE.MeshStandardMaterial({color:0x9aa3a6,roughness:.5,metalness:.3});
/** A sign plate on a galvanised post, facing ry. 407-A crossing or 330 stop. */
export function roadSign(parent,kind,{x,z,y=0,ry=0,colliders=null}={}){
 const g=new THREE.Group();g.name=kind==='stop'?'Stop sign (一時停止)':'Crossing sign (横断歩道)';g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);
 const post=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,2.5,8),steel());post.position.y=1.25;g.add(post);
 const face=kind==='stop'?stopFace():crossingFace(),size=kind==='stop'?.7:.6;
 // The face is printed on the front only; from behind, a sign is its grey aluminium plate. (The stop face was drawn
 // double-sided, so 止まれ read mirrored to everyone walking away from the junction.)
 const plate=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({map:face,color:face?0xffffff:(kind==='stop'?0xc8202a:0x1f5aa8),roughness:.6,transparent:kind==='stop',alphaTest:.5}));
 plate.position.set(0,2.45,.035);plate.name=g.name+' face';g.add(plate);
 const back=new THREE.Mesh(kind==='stop'?stopPlateShape(size):new THREE.PlaneGeometry(size*.98,size*.98),new THREE.MeshStandardMaterial({color:0x8d9497,roughness:.6}));back.position.set(0,2.45,.03);back.rotation.y=Math.PI;
 back.name=g.name+' back plate';g.add(back);
 colliders?.push({id:'road-sign',x,z,w:.12,d:.12,height:y+2.8});
 return g;
}
/** 止まれ and the stop line, painted across a lane that ends at a junction. */
export function stopMarking(parent,{x,z,y=0,width,ry=0}){
 const g=new THREE.Group();g.name='Stop line (停止線)';g.position.set(x,y,z);g.rotation.y=ry;parent.add(g);
 paintPatch(g,width-.3,ROAD_STANDARD.stopLine.width,0,0,0,0,'Stop line');
 const text=canvasTexture(256,128,(ctx,w,h)=>{ctx.fillStyle='#ffffff';ctx.font='bold 92px "Hiragino Sans","Noto Sans CJK JP",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('止まれ',w/2,h/2);});
 if(text){const m=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(2.4,width-.6),1.6),registerRoadPaint(new THREE.MeshBasicMaterial({map:text,transparent:true,...decal})));m.rotation.set(-Math.PI/2,0,Math.PI);m.position.set(0,.008,-1.5);m.renderOrder=1;m.raycast=()=>{};m.name='止まれ road marking';g.add(m);}
 return g;
}
/** Yellow warning blocks laid in the footway at the head of a crossing. */
export function tactileStrip(parent,{x,z,y=0,w,d=ROAD_STANDARD.tactile.depth,ry=0}){
 const t=tactileTexture();if(t){t.wrapS=t.wrapT=THREE.RepeatWrapping;}
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,.012,d),new THREE.MeshStandardMaterial({color:t?0xffffff:ROAD_STANDARD.tactile.colour,map:t?t.clone():null,roughness:.8}));
 if(m.material.map){m.material.map.repeat.set(w/.3,d/.3);m.material.map.needsUpdate=true;}
 m.position.set(x,y+.006,z);m.rotation.y=ry;m.name='Tactile warning blocks (点字ブロック)';m.receiveShadow=true;m.raycast=()=>{};parent.add(m);return m;
}
/** An ishiganto set in a wall at a T-junction, its face towards the lane that runs at it. */
export function ishiganto(parent,{x,z,y=0,ry=0}){
 const t=ishigantoTexture();
 const m=new THREE.Mesh(new THREE.BoxGeometry(.26,.66,.06),[0,0,0,0,0,0].map((_,i)=>new THREE.MeshStandardMaterial({color:i===4&&t?0xffffff:0xd2ccbb,map:i===4?t:null,roughness:.95})));
 m.position.set(x,y+.68,z);m.rotation.y=ry;m.name='Ishiganto (石敢當)';parent.add(m);return m;
}
/** 車止め: removable white posts across a road end, so cars stop and people walk on. */
export function roadEndPosts(parent,{x0,x1,z,y=0,colliders=null}){
 const g=new THREE.Group();g.name='Road-end posts (車止め)';parent.add(g);
 const white=new THREE.MeshStandardMaterial({color:0xf2f2ee,roughness:.55}),band=new THREE.MeshStandardMaterial({color:0xe2b822,roughness:.6});
 const n=Math.max(2,Math.round((x1-x0)/1.3)+1);
 for(let i=0;i<n;i++){const x=x0+(x1-x0)*i/(n-1);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.8,12),white);post.position.set(x,y+.4,z);g.add(post);
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(.062,.062,.08,12),band);ring.position.set(x,y+.68,z);g.add(ring);
  colliders?.push({id:'road-end-post',x,z,w:.16,d:.16,height:y+.82});}
 return g;
}
