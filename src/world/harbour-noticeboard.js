import * as THREE from '../../vendor/three.module.js';
import {assetURL} from '../assets.js';

/**
 * Minato's harbour noticeboard, built from drawings JW-NB-001..004 revision A (24 October 2026; the dimension schedule
 * is in briefs/HANDOFF-NOTICEBOARD-DESIGN-2026-10-24.md). Every number below is the drawing's, in millimetres:
 * U across (+ to the right as you read it), V up from the world datum, D toward the reader. The board stands at world
 * X 5.5, Z -33.2, facing +Z, so U = 1000*(x-5.5), V = 1000*y, D = 1000*(z+33.2).
 *
 * A muted green aluminium case under a sloping rain hood, two clear acrylic doors (kept shut in play), a warm pinboard
 * behind them carrying the woodland print and Thuan's flyer, on two 80 mm box posts. Foundations are schematic: the
 * posts stop just under the local grade, so nothing below ground enlarges the walking obstruction.
 */
export const NOTICEBOARD=Object.freeze({
 origin:[5.5,0,-33.2],yaw:0,
 cabinet:{u:[-740,740],v:[1000,2100],d:[-50,50]},
 frame:{lower:40,window:900,transom:40,header:80,upper:40,stile:40,back:5},
 openings:{left:{u:[-700,205],v:[1040,1940]},right:{u:[230,700],v:[1040,1940]},mullion:[205,230],leafFrame:25},
 sight:{left:{u:[-675,180],v:[1065,1915]},right:{u:[255,675],v:[1065,1915]},band:[180,255]},
 backingFront:-20,acrylic:[40,45],doorFront:50,
 hood:{u:[-775,775],d:[-120,130],rearTop:2180,frontTop:2150,dripBottom:2130,sheet:2,upstandTo:2169.6},
 posts:{size:80,wall:3,u:[-620,620],d:-90,top:2100,grade:{left:40,right:20},below:600},
 fixings:{v:[1210,1900],bolt:'M8'},
 drains:{sillSlots:{count:3,size:[20,6]},postDrain:{diameter:5,above:30}},
 woodland:{paper:[800,560],print:[780,520],centre:[-247.5,1530]},
 flyer:{sheet:[297,420],aspect:900/1280,centre:[465,1530]},
 envelope:{plan:[1550,260],top:2180},
 header:{jp:'みなと掲示板',en:'MINATO NOTICEBOARD',image:'graphics/noticeboard/header.webp'},
});

const N=NOTICEBOARD,mm=v=>v/1000;
/** The woodland print's and the flyer's world places on the board: the papers lie 0.5 mm proud of the pinboard. */
export const PAPER_D=N.backingFront+.5;
const world=(u,v,d)=>[N.origin[0]+mm(u),mm(v),N.origin[2]+mm(d)];
export const WOODLAND_PLACE=Object.freeze({position:world(N.woodland.centre[0],N.woodland.centre[1],PAPER_D),width:mm(N.woodland.print[0]),height:mm(N.woodland.print[1]),paper:N.woodland.paper.map(mm)});
// The flyer's 900:1280 sheet is contain-fitted to the A3 space: the full 420 mm height, 295 mm wide.
export const FLYER_PLACE=Object.freeze({position:world(N.flyer.centre[0],N.flyer.centre[1],PAPER_D),width:mm(N.flyer.sheet[1])*N.flyer.aspect,height:mm(N.flyer.sheet[1])});

const MAT={
 frame:()=>new THREE.MeshStandardMaterial({color:0x4e6858,roughness:.48,metalness:.55}),
 post:()=>new THREE.MeshStandardMaterial({color:0x4a5f52,roughness:.55,metalness:.5}),
 hood:()=>new THREE.MeshStandardMaterial({color:0x56705f,roughness:.42,metalness:.6,side:THREE.DoubleSide}),
 cork:()=>new THREE.MeshStandardMaterial({color:0xc99a5e,roughness:.95}),
 back:()=>new THREE.MeshStandardMaterial({color:0x7a5c3a,roughness:.9}),
 acrylic:()=>new THREE.MeshStandardMaterial({color:0xe6f2f2,roughness:.06,metalness:0,transparent:true,opacity:.1,depthWrite:false}),
 steel:()=>new THREE.MeshStandardMaterial({color:0xb9bcb8,roughness:.35,metalness:.85}),
 dark:()=>new THREE.MeshStandardMaterial({color:0x1d2320,roughness:1}),
 brass:()=>new THREE.MeshStandardMaterial({color:0xa98a4c,roughness:.4,metalness:.8}),
};

/** A box between two corners, in drawing millimetres. */
function slab(parent,name,mat,[u0,u1],[v0,v1],[d0,d1]){
 const m=new THREE.Mesh(new THREE.BoxGeometry(mm(u1-u0),mm(v1-v0),mm(d1-d0)),mat);
 m.name=name;m.position.set(mm(u0+u1)/2,mm(v0+v1)/2,mm(d0+d1)/2);parent.add(m);return m;
}
/** A flat plate in a U–V plane at depth d, with rectangular holes, facing +D. */
function face(parent,name,mat,[u0,u1],[v0,v1],d,holes=[]){
 const s=new THREE.Shape([new THREE.Vector2(u0,v0),new THREE.Vector2(u1,v0),new THREE.Vector2(u1,v1),new THREE.Vector2(u0,v1)].map(p=>p.multiplyScalar(.001)));
 for(const [[a0,a1],[b0,b1]] of holes)s.holes.push(new THREE.Path([new THREE.Vector2(a0,b0),new THREE.Vector2(a0,b1),new THREE.Vector2(a1,b1),new THREE.Vector2(a1,b0)].map(p=>p.multiplyScalar(.001))));
 const m=new THREE.Mesh(new THREE.ShapeGeometry(s),mat);m.name=name;m.position.z=mm(d);parent.add(m);return m;
}
/** A frame ring (outer minus inner rectangle) extruded between two depths. */
function ring(parent,name,mat,outer,inner,[d0,d1]){
 const [[u0,u1],[v0,v1]]=outer,[[a0,a1],[b0,b1]]=inner;
 const s=new THREE.Shape([new THREE.Vector2(u0,v0),new THREE.Vector2(u1,v0),new THREE.Vector2(u1,v1),new THREE.Vector2(u0,v1)].map(p=>p.multiplyScalar(.001)));
 s.holes.push(new THREE.Path([new THREE.Vector2(a0,b0),new THREE.Vector2(a0,b1),new THREE.Vector2(a1,b1),new THREE.Vector2(a1,b0)].map(p=>p.multiplyScalar(.001))));
 const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:mm(d1-d0),bevelEnabled:false}),mat);m.name=name;m.position.z=mm(d0);parent.add(m);return m;
}
/** A plate in a D–V plane (a side profile), extruded across U from u0 to u1. Points are [d, v] pairs. */
function profile(parent,name,mat,points,[u0,u1]){
 const s=new THREE.Shape(points.map(([d,v])=>new THREE.Vector2(mm(d),mm(v))));
 const g=new THREE.ExtrudeGeometry(s,{depth:mm(u1-u0),bevelEnabled:false});
 // shape x is D, shape y is V, extrusion is U: turn it so x→+Z, z→+X
 g.rotateY(-Math.PI/2);g.translate(mm(u1),0,0);
 const m=new THREE.Mesh(g,mat);m.name=name;parent.add(m);return m;
}
function cylinderAt(parent,name,mat,r,len,[u,v,d],axis='z'){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(mm(r),mm(r),mm(len),12),mat);m.name=name;m.position.set(mm(u),mm(v),mm(d));
 if(axis==='z')m.rotation.x=Math.PI/2;else if(axis==='x')m.rotation.z=Math.PI/2;parent.add(m);return m;
}

let headerTexture;
function headerMaterial(map){
 if(map)return new THREE.MeshStandardMaterial({map,color:0xffffff,roughness:.5,metalness:.15});
 const mat=new THREE.MeshStandardMaterial({color:0x4e6858,roughness:.5,metalness:.4});
 if(globalThis.document?.baseURI){
  headerTexture??=new THREE.TextureLoader().load(assetURL(N.header.image),t=>{t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;});
  headerTexture.colorSpace=THREE.SRGBColorSpace;headerTexture.anisotropy=4;
  mat.map=headerTexture;mat.color.set(0xffffff);mat.metalness=.15;
 }
 return mat;
}

/**
 * The case, hood, posts and hardware, as one group in its place. The papers are added by their own modules at
 * WOODLAND_PLACE and FLYER_PLACE. Returns the town's prop shape: {object, collider}.
 */
export function buildHarbourNoticeboard({spec:N=NOTICEBOARD,headerMap}={}){
 const g=new THREE.Group();g.name='Minato harbour noticeboard (JW-NB rev A)';g.position.set(...N.origin);g.rotation.y=N.yaw;
 const m=Object.fromEntries(Object.entries(MAT).map(([k,f])=>[k,f()]));
 const {cabinet:C,frame:F}=N,[U0,U1]=C.u,[V0,V1]=C.v,[D0,D1]=C.d;
 const sU0=U0+F.stile,sU1=U1-F.stile,vWin0=V0+F.lower,vWin1=vWin0+F.window,vHead0=vWin1+F.transom,vHead1=vHead0+F.header;
 const backFront=D0+F.back;
 // the case: back panel, stiles, rails, header plate, top rail
 slab(g,'Noticeboard back panel',m.frame,[U0,U1],[V0,V1],[D0,backFront]);
 slab(g,'Noticeboard left stile',m.frame,[U0,sU0],[V0,vHead0],[backFront,D1]);
 slab(g,'Noticeboard right stile',m.frame,[sU1,U1],[V0,vHead0],[backFront,D1]);
 slab(g,'Noticeboard sill rail',m.frame,[sU0,sU1],[V0,vWin0],[backFront,D1]);
 slab(g,'Noticeboard transom',m.frame,[sU0,sU1],[vWin1,vHead0],[backFront,D1]);
 const header=new THREE.Mesh(new THREE.BoxGeometry(mm(U1-U0),mm(F.header),mm(D1-backFront)),[m.frame,m.frame,m.frame,m.frame,headerMaterial(headerMap),m.frame]);
 header.name='Noticeboard header plate · みなと掲示板 / MINATO NOTICEBOARD';header.position.set(0,mm(vHead0+vHead1)/2,mm(backFront+D1)/2);g.add(header);
 slab(g,'Noticeboard top rail',m.frame,[U0,U1],[vHead1,V1],[backFront,D1]);
 // the pinboard: a backing slab, and its face with openings where the papers lie (no paper sits on a covered face)
 const bf=N.backingFront;
 slab(g,'Noticeboard pinboard core',m.back,[sU0,sU1],[vWin0,vWin1],[backFront,bf-10]);
 const wl=N.woodland,fl=N.flyer,fw=fl.sheet[1]*fl.aspect;
 const holes=[
  [[wl.centre[0]-wl.paper[0]/2,wl.centre[0]+wl.paper[0]/2],[wl.centre[1]-wl.paper[1]/2,wl.centre[1]+wl.paper[1]/2]],
  [[fl.centre[0]-fw/2,fl.centre[0]+fw/2],[fl.centre[1]-fl.sheet[1]/2,fl.centre[1]+fl.sheet[1]/2]],
  [N.openings.mullion,[vWin0,vWin1]],
 ];
 face(g,'Noticeboard pinboard face',m.cork,[sU0,sU1],[vWin0,vWin1],bf,holes);
 // the opaque centre band: the two leaves' frames meet the 25 mm mullion, which runs back to the pinboard core
 slab(g,'Noticeboard mullion',m.frame,N.openings.mullion,[vWin0,vWin1],[bf-10,N.doorFront]);
 // the two doors: 25 mm frames round the sight openings, 5 mm clear acrylic behind the frame face
 const [a0,a1]=N.acrylic;
 for(const side of ['left','right']){
  const o=N.openings[side],s=N.sight[side];
  ring(g,`Noticeboard ${side} door frame`,m.frame,[o.u,o.v],[s.u,s.v],[a0,N.doorFront]);
  const pane=face(g,`Noticeboard ${side} acrylic`,m.acrylic,s.u,s.v,(a0+a1)/2);pane.renderOrder=2;
  // clear glazing: a click or tap goes through it to the paper behind, which opens the board (picking, game.js)
  pane.raycast=()=>{};pane.userData.clearPane=true;
 }
 // hinges on the outer stiles, a cylinder lock on each leaf by the centre band
 for(const [u,v] of [[-700,1150],[-700,1830],[700,1150],[700,1830]])cylinderAt(g,'Noticeboard hinge',m.steel,5,60,[u,v,N.doorFront+5],'y');
 cylinderAt(g,'Noticeboard left door lock',m.brass,7,6,[192.5,1490,N.doorFront+3],'z');
 cylinderAt(g,'Noticeboard right door lock',m.brass,7,6,[242.5,1490,N.doorFront+3],'z');
 // the sill's three drain slots, open on its underside
 for(const u of [-450,0,450])slab(g,'Noticeboard sill drain slot',m.dark,[u-10,u+10],[V0-1,V0-.5],[-3,3]);
 // the rain hood: a 2 mm sheet falling 30 in its 250 projection, front drip, rear upstand, side cheeks
 const H=N.hood,[hd0,hd1]=H.d,t=H.sheet,under=d=>H.rearTop-t-(H.rearTop-H.frontTop)*(d-hd0)/(hd1-hd0);
 profile(g,'Noticeboard hood sheet',m.hood,[[hd0,H.rearTop-t],[hd1,H.frontTop-t],[hd1,H.frontTop],[hd0,H.rearTop]],H.u);
 profile(g,'Noticeboard hood front drip',m.hood,[[hd1-t,H.dripBottom],[hd1,H.dripBottom],[hd1,H.frontTop-t],[hd1-t,under(hd1-t)]],H.u);
 profile(g,'Noticeboard hood rear upstand',m.hood,[[hd0,V1],[hd0+t,V1],[hd0+t,under(hd0+t)],[hd0,H.upstandTo]],[H.u[0]+t,H.u[1]-t]);
 for(const [u0,u1,name] of [[H.u[0],H.u[0]+t,'left'],[H.u[1]-t,H.u[1],'right']])
  profile(g,`Noticeboard hood ${name} cheek`,m.hood,[[hd0,V1],[hd1-t,H.dripBottom],[hd1-t,under(hd1-t)],[hd0,under(hd0)]],[u0,u1]);
 // hood brackets: 6 mm gusset plates on the posts' line, from the case top to the hood's underside
 for(const u of N.posts.u)profile(g,'Noticeboard hood bracket',m.hood,[[hd0+t,V1],[D1,V1],[D1,under(D1)],[hd0+t,under(hd0+t)]],[u-3,u+3]);
 // the posts: 80 x 80 box section behind the case, each from just under its own grade to V 2100
 const P=N.posts,h=P.size/2;
 for(const [u,side] of [[P.u[0],'left'],[P.u[1],'right']]){
  const grade=P.grade[side];
  slab(g,`Noticeboard ${side} post`,m.post,[u-h,u+h],[grade-5,P.top],[P.d-h,P.d+h]);
  // the post's 5 mm drain hole, 30 above grade, on its outer side face (inside the plan envelope)
  const out=side==='left'?-1:1;
  cylinderAt(g,'Noticeboard post drain',m.dark,N.drains.postDrain.diameter/2,1,[u+out*(h+.5),grade+N.drains.postDrain.above,P.d],'x');
  // M8 fixings at two levels: run from inside the case's reinforced back frame into threaded inserts in the post's front
  // wall, so no head stands proud of the 260 mm plan envelope; only the back panel's bolt heads show, behind the pinboard.
  for(const v of N.fixings.v)cylinderAt(g,'Noticeboard M8 fixing head',m.steel,6.5,4,[u,v,D0+F.back+2],'z');
 }
 for(const o of g.children)if(o.isMesh){o.castShadow=o.material!==m.acrylic;o.receiveShadow=true;}
 g.userData.noticeboard=N;
 const [pw,pd]=N.envelope.plan;
 return {object:g,collider:{id:'harbour-noticeboard',x:N.origin[0],z:N.origin[2],w:mm(pw),d:mm(pd),yaw:N.yaw}};
}
