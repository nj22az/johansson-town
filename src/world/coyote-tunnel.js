import * as THREE from '../../vendor/three.module.js';
import {FOREST_EDGE} from './forest-edge.js';
import {broadleafGeometry,TREE_GREENS} from './okinawa/trees.js';

/**
 * The old sea cave in the headland at the top of Main Street.
 *
 * Minato is an island now, reached by the ferry, and nothing drives out of town. Where the
 * Minato Tunnel's concrete portal stood -- a two-lane road tunnel with sodium lamps, a
 * nine-metre headwall and a sign saying no pedestrians -- the footpath up past the old
 * terminus comes to a low mouth in the rock of a smaller, wooded headland, with a sacred
 * rope across it, a stone lantern and a weathered sign. You can walk a couple of metres in
 * out of the light; past that it goes down into the dark, whose descent is closed.
 *
 * The file keeps the name it had when the tunnel was a cartoon gag, and TUNNEL keeps its
 * name too: the map, the shore and the old bus code all place themselves by it.
 */
/**
 * October 2026: the island has no sea cave. The headland, its tunnel and the cave mouth
 * are gone, and the land they stood on is plain island ground waiting for the new
 * residential quarter (docs/RESIDENTIAL-PLAN.md). The descent under the cave is closed,
 * not deleted: set this back to true and the hill, the cave and the way down return.
 */
export const CAVE_ACTIVE=false;
export const TUNNEL=Object.freeze({
 x:FOREST_EDGE.roadX,
 // Beyond the end of the path, so there is a run of it between the old terminus and here.
 z:FOREST_EDGE.roadEndZ+3.4,
 /** The rock face's footprint across the path and front to back, for the map and bounds. */
 width:14,
 height:9.5,
 depth:4,
 /** The cave: half its width, the height its sides stand before the roof arches, how far in you can walk. */
 bore:Object.freeze({half:1.35,spring:1.25,length:4.5}),
 /** The rock face stands this far out in front of the line the hill is measured from. */
 portal:.5,
 /** The notch the path runs up into, with rock either side of it. */
 cut:Object.freeze({half:2.1,length:3.2}),
});
/** The mouth, in world metres: where you stand to go in. */
export const CAVE_MOUTH=Object.freeze({x:TUNNEL.x,z:TUNNEL.z-TUNNEL.portal-.2,inside:TUNNEL.z+1.6});
const {half:R,spring:S,length:L}=TUNNEL.bore;
/** Height of the rock face above the path, over the mouth. */
const HEADWALL=S+R+1.9;

const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
/**
 * The hill, as a height above the path at a point. It rises steeply from the path to the
 * top of the rock face, climbs to a wooded crown about nine metres up and falls away to the
 * sea; across it, it is broad over the cave and lower to either side, with a shoulder to
 * the west. A few low waves keep it from being a perfect bell.
 */
export function hillHeight(x,z){
 const dx=x-TUNNEL.x,dz=z-TUNNEL.z;
 let along;
 if(dz<=0)along=(HEADWALL+.3)*smooth((dz+4.2)/4.5)**1.25;
 else if(dz<18)along=HEADWALL+.3+(9.5-HEADWALL-.3)*Math.sin(dz/18*Math.PI/2);
 else along=9.5-12*smooth((dz-18)/30);
 const spread=12+.25*Math.max(0,dz);
 const across=.34+.66*Math.exp(-((dx/spread)**2))+.22*Math.exp(-(((dx+15)/7)**2))*smooth(dz/6);
 const waves=.35*Math.sin(x*.37+z*.21)+.28*Math.sin(x*.19-z*.43)+.2*Math.sin(x*.71+z*.53);
 // Out to the edges of the patch it comes down under the water, so it never ends in mid-air.
 const edge=smooth((34-Math.abs(dx+2))/9)*smooth((TUNNEL.z+58-z)/12);
 // Deep enough at the rim to vanish into the water: at -1.6 the skirt showed through the
 // shallows as a square of green from the air (docs/QA-REPORT.md, O1).
 let h=(along*across+waves*smooth(dz/3+1))*edge-5.5*(1-edge);
 // To the east it comes down behind the school's boundary wall and goes under the yard.
 const east=smooth((dx-8.5)/6.5);h=h*(1-east)-1.2*east;
 // Just behind the portal the ground comes down onto the headwall's coping, so there is
 // no step between the concrete and the slope above it.
 const onto=(1-smooth((dz-.35)/3.5))*(1-smooth((Math.abs(dx)-TUNNEL.cut.half)/2))*(dz>-.5?1:0);
 return h*(1-onto)+(HEADWALL+.38)*onto;
}
/** Inside the notch the path comes up in, which the rock face closes off rather than the hill. */
const inCut=(dx,dz)=>Math.abs(dx)<TUNNEL.cut.half&&dz<.35;
/** On the cave's own floor, under the hill: the ground there is the path's, not the hilltop's. */
const inCave=(dx,dz)=>Math.abs(dx)<R+.15&&dz<TUNNEL.bore.length-TUNNEL.portal;

/** The same triangles support feet and the rendered headland. Cache heights once;
 * movement never raycasts or resamples the procedural terrain. */
export const HEADLAND=Object.freeze({minX:TUNNEL.x-33,maxX:TUNNEL.x+30,minZ:TUNNEL.z-8,maxZ:TUNNEL.z+60});
const terrainLines=(from,to,step,...keep)=>{
 const set=new Set(keep.filter(v=>v>from&&v<to));
 for(let v=from;v<=to+1e-6;v+=step)set.add(+v.toFixed(3));
 return [...set].sort((a,b)=>a-b);
};
const hillXs=terrainLines(HEADLAND.minX,HEADLAND.maxX,1.5,TUNNEL.x-TUNNEL.cut.half,TUNNEL.x+TUNNEL.cut.half);
const hillZs=terrainLines(HEADLAND.minZ,HEADLAND.maxZ,1.5,TUNNEL.z+.35);
const hillYs=hillZs.map(z=>hillXs.map(x=>hillHeight(x,z)));
function cellAt(lines,value){
 if(value<lines[0]||value>lines.at(-1))return -1;
 let lo=0,hi=lines.length-1;
 while(hi-lo>1){const mid=(lo+hi)>>1;if(lines[mid]<=value)lo=mid;else hi=mid;}
 return lo;
}
export function headlandHeight(x,z){
 if(!CAVE_ACTIVE)return null;
 const i=cellAt(hillXs,x),j=cellAt(hillZs,z);if(i<0||j<0)return null;
 const x0=hillXs[i],x1=hillXs[i+1],z0=hillZs[j],z1=hillZs[j+1];
 if(inCut((x0+x1)/2-TUNNEL.x,(z0+z1)/2-TUNNEL.z)||inCave(x-TUNNEL.x,z-TUNNEL.z))return null;
 const u=(x-x0)/(x1-x0),v=(z-z0)/(z1-z0);
 const a=hillYs[j][i],b=hillYs[j][i+1],c=hillYs[j+1][i],d=hillYs[j+1][i+1];
 return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
}

/** The bore's inner outline, from the foot of one wall over the crown to the other. */

/** The bore's inner outline, from the foot of one wall over the crown to the other. */
function boreProfile(r=R,s=S,steps=18){
 const points=[[-r,0],[-r,s]];
 for(let i=1;i<steps;i++){const a=Math.PI-i/steps*Math.PI;points.push([r*Math.cos(a),s+r*Math.sin(a)]);}
 points.push([r,s],[r,0]);
 return points;
}
function arch(shape,r,s,reverse=false){
 const pts=boreProfile(r,s);if(reverse)pts.reverse();
 pts.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
 shape.closePath();return shape;
}

function canvasTexture(width,height,draw){
 const c=document.createElement('canvas');c.width=width;c.height=height;draw(c.getContext('2d'),width,height);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}


/** The headland over the cave, grassed and wooded, with rock where it is steep. */
function buildHill(parent,shadows,colliders){
 const {minX:X0,maxX:X1}=HEADLAND;
 const xs=hillXs,zs=hillZs;
 const positions=[],colours=[],index=[];
 const grass=new THREE.Color(0x4f6a3c),forest=new THREE.Color(0x3a5433),rock=new THREE.Color(0x6e6a5f),sandShore=new THREE.Color(0xd9c79a),reef=new THREE.Color(0x3f8a8c),c=new THREE.Color();
 for(let j=0;j<zs.length;j++)for(let i=0;i<xs.length;i++){
  const x=xs[i],z=zs[j],h=hillYs[j][i];positions.push(x,h,z);
  // Steep ground is bare rock; the rest is grass going over to woodland near the top.
  const e=.8,slope=Math.hypot(hillHeight(x+e,z)-hillHeight(x-e,z),hillHeight(x,z+e)-hillHeight(x,z-e))/(2*e);
  const tree=smooth((h-2.5)/5),bare=smooth((slope-.75)/.6);
  c.copy(grass).lerp(forest,tree).lerp(rock,bare);
  // Below the tide line it is sand and then reef, the colours the sea shader expects to
  // see through, not lawn.
  const wet=smooth((-.2-h)/.6),deep=smooth((-1.4-h)/2);
  c.lerp(sandShore,wet).lerp(reef,deep);
  const n=.93+.07*Math.sin(x*1.7+z*2.3);colours.push(c.r*n,c.g*n,c.b*n);
 }
 for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){
  const mx=(xs[i]+xs[i+1])/2-TUNNEL.x,mz=(zs[j]+zs[j+1])/2-TUNNEL.z;
  if(inCut(mx,mz))continue;
  const a=j*xs.length+i,b=a+1,cc=a+xs.length,d=cc+1;
  index.push(a,cc,b,b,cc,d);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));
 geometry.setIndex(index);geometry.computeVertexNormals();
 const hill=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,flatShading:true}));
 hill.name='Minato headland';hill.receiveShadow=true;hill.castShadow=shadows;parent.add(hill);

 // Pines and cedars on the upper slopes, kept off the face over the portal.
 const spots=[];let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
 for(let tries=0;tries<900&&spots.length<80;tries++){
  const x=X0+6+rnd()*(X1-X0-12),z=TUNNEL.z+2+rnd()*44,dx=x-TUNNEL.x,dz=z-TUNNEL.z;
  if(dz<4&&Math.abs(dx)<6)continue;
  const h=hillHeight(x,z);if(h<1.6)continue;
  spots.push([x,h,z,.75+rnd()*.7,rnd()]);
 }
 // The island's broadleaf (okinawa/trees.js), in its lighter far-off build: the
 // headland is seen from the town, not walked under.
 const treeMat=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.95});
 const dummy=new THREE.Object3D(),tint=new THREE.Color(),groups=[0,1,2].map(()=>[]);
 spots.forEach((spot,i)=>groups[i%3].push(spot));
 const meshes=groups.map((list,variant)=>{
  const mesh=new THREE.InstancedMesh(broadleafGeometry({variant,lite:true,greens:TREE_GREENS.hill}),treeMat,list.length);
  list.forEach(([x,y,z,s,r],i)=>{
   colliders.push({id:'headland-tree',x,z,w:.32*s,d:.32*s,height:y+6*s});
   dummy.position.set(x,y-.1,z);dummy.scale.setScalar(5.4*s);dummy.rotation.set(0,r*6,0);dummy.updateMatrix();
   mesh.setMatrixAt(i,dummy.matrix);mesh.setColorAt(i,tint.setScalar(.85+r*.3));
  });
  mesh.name='Minato headland trees';mesh.castShadow=shadows;parent.add(mesh);return mesh;
 });
 const trees=meshes[0];
 return {hill,trees};
}


/** A lumpy stone: an icosahedron with its corners pushed about, flat-shaded. */
function boulder(size,seed,material){
 const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position;let r=seed*9301+49297;
 const rand=()=>((r=(r*9301+49297)%233280)/233280);
 const moved=new Map();
 for(let i=0;i<p.count;i++){
  const k=p.getX(i).toFixed(3)+','+p.getY(i).toFixed(3)+','+p.getZ(i).toFixed(3);
  if(!moved.has(k))moved.set(k,.78+rand()*.4);
  const f=moved.get(k);p.setXYZ(i,p.getX(i)*f,p.getY(i)*f*.8,p.getZ(i)*f);
 }
 g.computeVertexNormals();
 const m=new THREE.Mesh(g,material);m.scale.setScalar(size);return m;
}

/**
 * The mouth: a rough rock face over a low arched opening, a short passage going dark, the
 * rope across the top, a stone lantern and the sign. In the group's frame the face is at
 * z = -portal and the cave runs in toward +z.
 */
function buildCaveMouth(group,shadows){
 const rock=new THREE.MeshStandardMaterial({color:0x6f685d,roughness:1,flatShading:true});
 const darkRock=new THREE.MeshStandardMaterial({color:0x4e4942,roughness:1,flatShading:true});
 const W=TUNNEL.cut.half,face=-TUNNEL.portal;
 // The face over and beside the opening, cut up from below so it has no floor of its own.
 const wall=new THREE.Shape();wall.moveTo(-W-.6,-.3);wall.lineTo(-R,-.3);
 for(const [x,y] of boreProfile(R,S).slice(1,-1))wall.lineTo(x,y);
 wall.lineTo(R,-.3);wall.lineTo(W+.6,-.3);wall.lineTo(W+.6,HEADWALL+.2);wall.lineTo(-W-.6,HEADWALL+.2);wall.closePath();
 const faceMesh=new THREE.Mesh(new THREE.ExtrudeGeometry(wall,{depth:TUNNEL.portal+.6,bevelEnabled:false,curveSegments:1}),rock);
 faceMesh.position.set(0,0,face);faceMesh.name='Sea cave rock face';faceMesh.castShadow=shadows;faceMesh.receiveShadow=true;group.add(faceMesh);
 // Boulders over the straight edges, so the face reads as rock rather than as a wall.
 const stones=[];
 const place=(x,y,z,size,seed,mat=rock)=>{const b=boulder(size,seed,mat);b.position.set(x,y,z);b.rotation.set(seed*.7,seed*1.3,seed*.4);b.castShadow=shadows;b.receiveShadow=true;group.add(b);stones.push(b);return b;};
 [[-R-.55,.5,face-.25,.75],[R+.6,.45,face-.2,.7],[-R-.35,1.6,face-.3,.6],[R+.4,1.7,face-.25,.62],[-1.05,S+R+.25,face-.2,.55],[.1,S+R+.55,face-.25,.6],[1.1,S+R+.3,face-.2,.5],
  [-W-.2,2.8,face-.1,.9],[W+.25,2.6,face,.85],[-W,HEADWALL-.2,face+.2,.8],[W-.1,HEADWALL,face+.25,.75],[0,HEADWALL+.2,face+.3,.9]]
  .forEach(([x,y,z,size],i)=>place(x,y,z,size,i+1,i%3?rock:darkRock));
 // The rock either side of the notch the path comes up in, following the hill down.
 for(const side of [-1,1])for(let k=0;k<4;k++){
  const dz=face-.6-k*.85,h=Math.max(.5,hillHeight(TUNNEL.x+side*W,TUNNEL.z+dz));
  place(side*(W+.1),h*.45,dz,Math.max(.55,h*.55),20+k*2+(side>0?1:0),k%2?darkRock:rock);
 }
 // The passage: the arch carried in, getting darker, ending in black.
 const positions=[],colours=[],profile=boreProfile(R,S),depth=TUNNEL.bore.length,rings=6;
 for(let k=0;k<rings;k++){
  const z0=face+k*depth/rings,z1=face+(k+1)*depth/rings,l0=Math.max(0,.55-k*.1),l1=Math.max(0,.55-(k+1)*.1);
  for(let i=0;i<profile.length-1;i++){
   const [ax,ay]=profile[i],[bx,by]=profile[i+1];
   const jitter=(x,y,z)=>.06*Math.sin(x*5.1+y*3.7+z*2.3);
   const quad=[[ax,ay,z0,l0],[bx,by,z0,l0],[ax,ay,z1,l1],[bx,by,z0,l0],[bx,by,z1,l1],[ax,ay,z1,l1]];
   for(const [x,y,z,l] of quad){positions.push(x*(1+jitter(x,y,z)),y,z);colours.push(.42*l,.39*l,.35*l);}
  }
  // The floor, packed sand going dark with the walls.
  positions.push(-R,.01,z0,R,.01,z0,-R,.01,z1,R,.01,z0,R,.01,z1,-R,.01,z1);
  for(const l of [l0,l0,l1,l0,l1,l1])colours.push(.6*l,.55*l,.45*l);
 }
 const passageGeo=new THREE.BufferGeometry();
 passageGeo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 passageGeo.setAttribute('color',new THREE.Float32BufferAttribute(colours,3));passageGeo.computeVertexNormals();
 const passage=new THREE.Mesh(passageGeo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide}));
 passage.name='Sea cave passage';group.add(passage);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(2*R+.2,S+R+.2),new THREE.MeshBasicMaterial({color:0x050404}));
 back.position.set(0,(S+R)/2,face+depth);back.rotation.y=Math.PI;back.name='Sea cave dark';group.add(back);
 // The shimenawa: a straw rope across the top of the mouth with four paper shide.
 const straw=new THREE.MeshStandardMaterial({color:0xc9b27a,roughness:.95});
 const paper=new THREE.MeshStandardMaterial({color:0xf3f0e6,roughness:.8,side:THREE.DoubleSide});
 const rope=new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(-R-.25,S+.55,face-.35),new THREE.Vector3(0,S+.05,face-.5),new THREE.Vector3(R+.25,S+.55,face-.35)),16,.07,6,false),straw);
 rope.name='Shimenawa';group.add(rope);
 for(const x of [-.75,-.25,.25,.75]){
  const shide=new THREE.Mesh(new THREE.PlaneGeometry(.12,.34),paper);
  shide.position.set(x,S+.02-Math.abs(x)*-.35-.2,face-.48);shide.rotation.z=x*.15;group.add(shide);
 }
 // A stone lantern beside the path, lit in the evening.
 const stone=new THREE.MeshStandardMaterial({color:0x9a958a,roughness:.95});
 const glow=new THREE.MeshStandardMaterial({color:0xf2d59a,roughness:.6,emissive:0xf2b25a,emissiveIntensity:0});
 // It stands on the headland's own surface there, which rises above the path's level;
 // at y 0 it sank half a metre into the hill with only its roof showing.
 const lantern=new THREE.Group();{const lx=-W-.9,lz=face-2.2,h=headlandHeight(TUNNEL.x+lx,TUNNEL.z+lz);lantern.position.set(lx,Number.isFinite(h)?Math.max(0,h-.04):0,lz);}lantern.name='Stone lantern';group.add(lantern);
 for(const [geo,y,mat] of [[new THREE.CylinderGeometry(.28,.34,.18,6),.09,stone],[new THREE.CylinderGeometry(.1,.12,.7,8),.53,stone],[new THREE.BoxGeometry(.42,.12,.42),.94,stone],
  [new THREE.BoxGeometry(.3,.3,.3),1.15,glow],[new THREE.ConeGeometry(.42,.32,4),1.46,stone],[new THREE.SphereGeometry(.07,6,4),1.66,stone]]){
  const m=new THREE.Mesh(geo,mat);m.position.y=y;if(geo.type==='ConeGeometry')m.rotation.y=Math.PI/4;m.castShadow=shadows;lantern.add(m);
 }
 // The sign: a weathered board on a post.
 const board=typeof document==='undefined'?null:canvasTexture(384,256,(ctx,w,h)=>{
  ctx.fillStyle='#8a6f4e';ctx.fillRect(0,0,w,h);
  for(let i=0;i<14;i++){ctx.strokeStyle='rgba(60,40,24,.25)';ctx.beginPath();ctx.moveTo(0,i*19+5);ctx.lineTo(w,i*19+9);ctx.stroke();}
  ctx.fillStyle='#f1e9d6';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 76px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';ctx.fillText("Old Cave",w/2,h*.36);
  ctx.font='bold 26px sans-serif';ctx.fillText('THE OLD SEA CAVE',w/2,h*.7);
  ctx.font='18px sans-serif';ctx.fillText('Enter at your own risk',w/2,h*.87);
 });
 const post=new THREE.Mesh(new THREE.BoxGeometry(.1,1.5,.1),new THREE.MeshStandardMaterial({color:0x5d4a36,roughness:1}));
 post.position.set(W+.9,.75,face-2);group.add(post);
 const sign=new THREE.Mesh(new THREE.BoxGeometry(.9,.6,.05),[...Array(4).fill(post.material),post.material,new THREE.MeshStandardMaterial({map:board,color:board?0xffffff:0x8a6f4e,roughness:.9})]);
 sign.position.set(W+.9,1.45,face-2.06);sign.rotation.y=Math.PI+.25;sign.name='Sea cave sign';group.add(sign);
 return {face:faceMesh,stones,passage,rope,lantern,glow,sign};
}

/**
 * @param {object} options
 * @param {THREE.Object3D} options.parent
 * @param {Array} options.colliders
 * @param {(object:THREE.Object3D,label:string,fn:Function)=>void} [options.register]
 * @param {(kind:string,title:string,text:string)=>void} [options.onAction]
 */
export function buildCoyoteTunnel({parent,colliders,register,onAction,shadows=false}={}){
 const group=new THREE.Group();group.name='Old sea cave';group.position.set(TUNNEL.x,0,TUNNEL.z);parent.add(group);
 const mouth=buildCaveMouth(group,shadows);
 const {hill,trees}=buildHill(parent,shadows,colliders);
 // A gravel footing from the end of the path into the mouth.
 const apron=TUNNEL.z-FOREST_EDGE.roadEndZ;
 const path=new THREE.Mesh(new THREE.BoxGeometry(2.4,.05,apron-TUNNEL.portal),new THREE.MeshStandardMaterial({color:0x9c927c,roughness:1}));
 path.name='Sea cave path';path.position.set(0,.01,-(apron+TUNNEL.portal)/2);path.receiveShadow=true;group.add(path);

 // The rock stops you either side of the mouth and over it; inside, the dark does, a
 // couple of metres in, where the way down begins.
 const front=TUNNEL.z-TUNNEL.portal-.22,W=TUNNEL.cut.half;
 for(const side of [-1,1]){
  colliders.push({id:'cave-rock',x:TUNNEL.x+side*(R+(W+3.5-R)/2+.05),z:(front+TUNNEL.z+TUNNEL.depth)/2,w:W+3.5-R,d:TUNNEL.z+TUNNEL.depth-front,height:TUNNEL.height});
  colliders.push({id:'cave-notch',x:TUNNEL.x+side*(W+.35),z:front-TUNNEL.cut.length/2,w:.7,d:TUNNEL.cut.length,height:3});
 }
 colliders.push({id:'cave-back',x:TUNNEL.x,z:CAVE_MOUTH.inside+1.1,w:2*R+.4,d:1.2,height:3});

 let anchor=null;
 if(register){
  anchor=new THREE.Object3D();anchor.position.set(TUNNEL.x,1.2,CAVE_MOUTH.z+.6);parent.add(anchor);
  register(anchor,'Read the closed descent notice',()=>onAction?.('read','Cave descent closed','The descent is closed. Stay at the cave mouth.'));
  const read=new THREE.Object3D();read.position.set(TUNNEL.x+W+.9,1.3,front-2);parent.add(read);
  register(read,'Read the cave sign',()=>onAction?.('inspect','The old sea cave',
   "Painted on the board: Old Cave, the old cave. The rope across the mouth is new straw each New Year. The fishermen say it goes down a long way under the headland, further than anyone has walked, and that things wash up in it that never came from the sea."));
 }
 /** True in the mouth of the cave, with a hand's margin: the way in. */
 const splat=(x,z)=>Math.abs(x-TUNNEL.x)<=R+.5&&z>=front-.9&&z<=CAVE_MOUTH.inside+.3;
 /** The lantern lights at dusk. */
 const update=(day=1)=>{mouth.glow.emissiveIntensity=day<.4?1.2:0;};
 return {group,mouth,hill,trees,splat,face:hill,anchor,update};
}
