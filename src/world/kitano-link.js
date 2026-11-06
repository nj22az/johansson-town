import {GROUND} from '../render/ground-palette.js';
import * as THREE from '../../vendor/three.module.js';
import {signPlate} from './sign-plate.js';
import {KITANO_ROAD,KITANO_ROAD_LENGTH,KITANO_SURFACE_LIFT,roadPoint,roadHeight,leftOf} from './kitano-link-plan.js';

import {paintPatch,roadSign,stopMarking,roadPaintMaterial,ROAD_STANDARD} from './road-standards.js';
import {KITANO_STOP_S} from './town-traffic.js';
import {MAIN_STREET_GROUND} from './ground-plan.js';
import {GROUND_EDGE} from './ground-standard.js';
import {groundMaterial} from './ground-build.js';

/** Mainland lane and footway. The former airport bridge and all its supports are removed. */
const STEP=.5;
/** The road is laid as an apron over whatever it crosses, so the lawn's grass never shows through. */
const LIFT=KITANO_SURFACE_LIFT;
/** The lawn-side kerb's width (ground-standard.js GROUND_EDGE.kerb), taken off the carriageway's north edge. */
const NORTH_KERB=GROUND_EDGE.kerb.width;
/** Where the east service walk crosses the road (architecture-plan.js, x 14.9, 2.4 m wide): the kerb is dropped there. */
export const KITANO_WALK_CROSSING=Object.freeze({minX:13.7,maxX:16.1});
const C={asphalt:GROUND.asphalt,footway:GROUND.pavers,kerb:0xd3cec2,coral:0xd9cfb3,concrete:0xcfcbc0,girder:0xbcb8ad,pier:0xc4c0b5,rock:0x8f8a80,lampPost:0x9aa3a6,lamp:0xfff3d0,yellow:0xe8b923,carPark:0x666a6c};

function frameAt(s){const [x,z,hx,hz]=roadPoint(s),[lx,lz]=leftOf(hx,hz);return {x,z,hx,hz,lx,lz,y:roadHeight(s)};}

export function buildKitanoLink({parent,colliders=null,shadows=false}){
 const group=new THREE.Group();group.name='Kitano mainland access lane';parent.add(group);
 const mat=new Map(),material=(c,o={})=>{const k=c+JSON.stringify(o);if(!mat.has(k))mat.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.92,...o}));return mat.get(k);};
 const S=KITANO_ROAD.section,end=KITANO_ROAD_LENGTH;

 // ---- Running surfaces: ribbons across o0..o1 from s0 to s1, at the road's height plus lift. ----
 const ribbons=new Map();
 function ribbon(o0,o1,s0,s1,lift,colour){
  const list=ribbons.get(colour)??[];ribbons.set(colour,list);
  for(let s=s0;s<s1-1e-6;s+=STEP){
   const a=frameAt(s),b=frameAt(Math.min(s1,s+STEP));
   const p=(f,o)=>[f.x+f.lx*o,f.y+lift,f.z+f.lz*o];
   const A=p(a,o0),B=p(a,o1),Cc=p(b,o1),D=p(b,o0);
   list.push(...A,...D,...Cc,...A,...Cc,...B);
  }
 }
 // West of Main Street's district line the road's mouth is Main Street's ground (ground-plan.js): a raised table the
 // footway crosses on the level. From the line east the lane lays its own.
 const roadFrom=MAIN_STREET_GROUND.backEast-KITANO_ROAD.corners[0][0];
 // The carriageway in the rulebook's asphalt (ground-build.js groundMaterial): the footway is laid with the walks
 // (ground-plan-coast.js), and the lawn side is held by a 15 cm kerb (below), where the 10 cm gutter strip used to be.
 ribbon(S.north+NORTH_KERB,S.carriageway,roadFrom,end,LIFT,C.asphalt);
 for(const [colour,list] of ribbons){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(list,3));g.computeVertexNormals();
  // Faces up, whichever way the ribbon was wound.
  if(g.attributes.normal.getY(0)<0){const p=g.attributes.position;for(let i=0;i<p.count;i+=3)for(const k of [0,1,2]){const t=p.getComponent(i+1,k);p.setComponent(i+1,k,p.getComponent(i+2,k));p.setComponent(i+2,k,t);}g.computeVertexNormals();}
  const m=new THREE.Mesh(g,groundMaterial('road'));m.receiveShadow=true;m.name='Kitano Road carriageway';m.userData.groundClass='road';group.add(m);
 }

 // ---- Boxes along the road: one instanced mesh per material. ----
 const boxes=new Map();
 /** A segment from s to s+len, centred at offset o, from y0 to y1 (absolute), t thick. */
 function seg(colour,s,len,o,t,y0,y1){
  if(y1-y0<.01)return;
  const a=frameAt(s),b=frameAt(Math.min(end,s+len)),mid=frameAt(Math.min(end,s+len/2));
  const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz)||len;
  (boxes.get(colour)??boxes.set(colour,[]).get(colour)).push({x:mid.x+mid.lx*o,z:mid.z+mid.lz*o,y:(y0+y1)/2,len:l*1.03,t,h:y1-y0,yaw:Math.atan2(dx,dz),pitch:Math.atan2(b.y-a.y,l)});
 }
 // Kerb face along the footway.
 for(let s=roadFrom;s<end;s+=STEP){const f=frameAt(s+STEP/2);seg(C.kerb,s,STEP,S.carriageway+.06,.12,f.y,f.y+LIFT+S.kerb+.01);}
 // The kerb on the lawn side, 15 cm (ground-standard.js: a verge is kept off the road by a kerb), dropped where the
 // service walk crosses to the zebra, and across the road's end.
 const KERB_TOP=GROUND_EDGE.kerb.height+LIFT,DROP=LIFT+.02,TAPER=.6,cross=KITANO_WALK_CROSSING;
 const kerbTop=s=>{const x=frameAt(s).x,d=Math.max(cross.minX-x,0,x-cross.maxX);return DROP+(KERB_TOP-DROP)*Math.min(1,d/TAPER);};
 // In half-metre blocks, and in 10 cm ones where it tapers down to the drop.
 for(let s=roadFrom;s<end-1e-6;){const x=frameAt(s).x,near=x>cross.minX-TAPER-.6&&x<cross.maxX+TAPER+.1,len=Math.min(near?.1:.5,end-s),f=frameAt(s+len/2);seg(C.kerb,s,len,S.north+NORTH_KERB/2,NORTH_KERB,f.y-.1,kerbTop(s+len/2));s+=len;}
 {const f=frameAt(end);(boxes.get(C.kerb)??boxes.set(C.kerb,[]).get(C.kerb)).push({x:f.x+.09,z:f.z+f.lz*(S.north+S.carriageway+.12)/2,y:(f.y-.1+KERB_TOP)/2,len:S.carriageway-S.north+.12,t:.18,h:KERB_TOP-f.y+.1,yaw:Math.atan2(f.lx,f.lz),pitch:0});}
 const d=new THREE.Object3D();
 for(const [colour,list] of boxes){
  const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material(colour),list.length);
  // Each segment leans with the road's gradient, so tops run smooth rather than in steps.
  list.forEach((b,i)=>{d.position.set(b.x,b.y,b.z);d.rotation.order='YXZ';d.rotation.set(-b.pitch,b.yaw,0);d.scale.set(b.t,b.h,b.len);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});
  d.rotation.order='XYZ';
  mesh.castShadow=shadows&&colour!==C.kerb;mesh.receiveShadow=true;mesh.name='Kitano '+({[C.coral]:'retaining wall',[C.concrete]:'concrete',[C.girder]:'girders',[C.rock]:'causeway rock',[C.kerb]:'kerb',[C.pier]:'pier caps'}[colour]||'structure');
  mesh.userData.walkSurface=false;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();group.add(mesh);
 }
 // ---- Markings. ----
 const marks=new THREE.Group();marks.name='Kitano Road markings';group.add(marks);
 // Shared with every other street's paint, so all of it dims together after dark (road-standards.js).
 const paint=roadPaintMaterial(ROAD_STANDARD.paint),yellow=roadPaintMaterial(C.yellow);
 const dashes=[],solidY=[],edge=[];
 for(let s=KITANO_STOP_S+1;s<end-.5;s+=.5){
  const onBridge=false;
  if(onBridge)solidY.push(s);else if(Math.floor(s/2)%3!==2&&s>KITANO_STOP_S+3)dashes.push(s);
  if(s>13)edge.push(s);
 }
 const strip=(list,material,o,w,name)=>{
  const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(w,.52).rotateX(-Math.PI/2),material,list.length);
  list.forEach((s,i)=>{const f=frameAt(s+.25),g=frameAt(s+.5),a=frameAt(s);const pitch=Math.atan2(g.y-a.y,.5);d.position.set(f.x+f.lx*o,f.y+LIFT+.012,f.z+f.lz*o);d.rotation.set(0,Math.atan2(f.hx,f.hz),0);d.rotateX(-pitch);d.scale.set(1,1,1);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);});
  mesh.name=name;mesh.renderOrder=1;mesh.raycast=()=>{};mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();marks.add(mesh);
 };
 strip(dashes,paint,0,.15,'Centre line (white, dashed)');
 strip(solidY,yellow,0,.15,'Centre line (yellow: no overtaking)');
 strip(edge,paint,S.north+.25,.15,'Kitano Road edge line');
 // Westbound: the stop line and 止まれ before the zebra across the mouth.
 {const f=frameAt(KITANO_STOP_S),o=-KITANO_ROAD.lane/2;stopMarking(marks,{x:f.x+f.lx*o,z:f.z+f.lz*o,y:f.y+LIFT,width:KITANO_ROAD.lane,ry:Math.atan2(f.hx,f.hz)+Math.PI});}
 // Zebras: across the mouth on the dining lane, and on the lawn where the paths cross.
 // The lawn's zebra is where the service walk crosses (KITANO_WALK_CROSSING), the kerb dropped either side.
 for(const s of [3,(KITANO_WALK_CROSSING.minX+KITANO_WALK_CROSSING.maxX)/2-KITANO_ROAD.corners[0][0]]){
  const f=frameAt(s),{bar,gap,length}=ROAD_STANDARD.zebra,n=Math.floor((2*S.carriageway-gap)/(bar+gap));
  for(let i=0;i<n;i++){const o=-S.carriageway+gap+bar/2+i*(bar+gap)+((2*S.carriageway-gap)-(n*(bar+gap)))/2;paintPatch(marks,bar,length,f.x+f.lx*o,f.y+LIFT+.004,f.z+f.lz*o,Math.atan2(f.hx,f.hz)+Math.PI,'Zebra bar');}
  if(s>10)for(const o of [S.north-.35,S.footway+.2]){const x=f.x+f.lx*o+f.hx*1.9,z=f.z+f.lz*o+f.hz*1.9;roadSign(group,'crossing',{x,z,y:f.y,ry:Math.atan2(f.hx,f.hz)+Math.PI,colliders});}
 }
 // The stop sign, on the westbound driver's left.
 {const f=frameAt(KITANO_STOP_S+.4),o=S.north-.15;roadSign(group,'stop',{x:.35,z:f.z+f.lz*o,y:f.y,ry:Math.atan2(f.hx,f.hz),colliders});}

 // ---- Names and directions. ----
 const plate=(text,sub,x,y,z,ry,w=1.6,colour='#1f5aa8')=>{
  if(typeof document==='undefined'||!document.createElement)return;
  const c=document.createElement('canvas');c.width=512;c.height=sub?224:160;const ctx=c.getContext('2d');if(!ctx)return;
  ctx.fillStyle='#f4f1e8';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=colour;ctx.fillRect(8,8,c.width-16,c.height-16);
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 64px sans-serif';ctx.fillText(text,256,sub?78:80,480);
  if(sub){ctx.font='bold 40px sans-serif';ctx.fillText(sub,256,160,480);}
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  // A steel plate with its grey back (sign-plate.js): from behind it is the plate, never its words reversed.
  const m=signPlate(new THREE.MeshStandardMaterial({map:t,roughness:.6}),w,w*c.height/512,{name:'Sign: '+text});m.position.set(x,y,z);m.rotation.y=ry;group.add(m);
 };
 // A guide sign at the junction, facing Main Street, and the bridge's name plates.
 {const x=.2,z=6.45;
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,3.1,8),material(C.lampPost,{metalness:.3,roughness:.5}));post.position.set(x,1.55,z);group.add(post);
  plate('East lawn','Airport ferry · Harbour ↓',x-.05,2.75,z,-Math.PI/2,1.5);colliders?.push({id:'road-sign',x,z,w:.12,d:.12,height:3.1});}
 return {group,piers:[],bridge:null};
}
