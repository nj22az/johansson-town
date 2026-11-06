import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {releaseAfterUpload} from '../render/canvas-release.js';

/**
 * The harbour's working boats, drawn to the Minato Maru's finish (ferry-model.js): a faired hull with its sheer, a
 * red bottom, a black boot-top at the waterline and topsides with a sheer stripe; bulwarks with a capping rail; a
 * deckhouse with real window openings; the gear each boat works with; her name in Japanese on the bow and her port
 * of registry (or her fishing registration) where the law puts it; and the wear a working boat carries.
 *
 * Model frame, metres: +z forward (the bow), +x to port, y up from the waterline. Parts are merged by finish into a
 * few meshes with their colours in the vertices (paint, metal, glass, rubber; the wear as a decal layer that never
 * fights the paint under it) and one atlas of lettering, so a boat is five or six draws.
 */

const kinds={
 paint:()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.04}),
 metal:()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.45}),
 glass:()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.18,metalness:.1}),
 rubber:()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}),
 // Rust and grime laid over the paint: pulled toward the eye by a polygon offset, never sharing its depth.
 wear:()=>new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),
};

function paintGeometry(g,hex){
 const c=new THREE.Color(hex),n=g.attributes.position.count,a=new Float32Array(n*3);
 for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);g.setAttribute('color',new THREE.BufferAttribute(a,3));return g;
}

/**
 * A board laid on a curved hull side: `xAt(z,y)` is the hull's half-breadth, `side` 1 (port) or −1 (starboard). Its
 * corners sit on the hull (a hand's breadth off it), so a long board follows her flare and her taper to the bow
 * rather than standing off it at one end and sinking into it at the other. UV 0–1, read from outside.
 */
export function hullQuad(xAt,side,z0,z1,y0,y1,{off=.008,v=[0,1],segments=Math.max(1,Math.ceil(Math.abs(z1-z0)/.15)),shift=null}={}){
 // Split along its length so it follows the hull's curve in plan, not the chord between its ends (the chord lies
 // inside a convex side, and the middle of a long board sank into the paint).
 const p=(z,y)=>[side*(xAt(z,y)+off),y,z+(shift?shift(z,y):0)],pos=[],uv=[];
 for(let k=0;k<segments;k++){
  const t0=k/segments,t1=(k+1)/segments,[a,b]=side>0?[lerp(z1,z0,t0),lerp(z1,z0,t1)]:[lerp(z0,z1,t0),lerp(z0,z1,t1)];
  const bl=p(a,y0),br=p(b,y0),tr=p(b,y1),tl=p(a,y1);pos.push(...bl,...br,...tr,...bl,...tr,...tl);
  uv.push(t0,v[0],t1,v[0],t1,v[1],t0,v[0],t1,v[1],t0,v[1]);
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g;
}

/** Collects parts by finish and draws them merged. */
export function createBoatKit(name){
 const group=new THREE.Group();group.name=name;const parts={paint:[],metal:[],glass:[],rubber:[],wear:[]};
 const add=(g,hex,kind='paint')=>{let n=g.index?g.toNonIndexed():g;if(n!==g)g.dispose();if(n.attributes.uv)n.deleteAttribute('uv');if(!n.attributes.normal)n.computeVertexNormals();parts[kind].push(paintGeometry(n,hex));return n;};
 const kit={group,parts,add,
  box(w,h,d,x,y,z,hex,kind='paint',{rx=0,ry=0,rz=0}={}){const g=new THREE.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);if(ry)g.rotateY(ry);g.translate(x,y,z);return add(g,hex,kind);},
  cyl(rt,rb,h,x,y,z,hex,kind='paint',{segments=12,rx=0,rz=0,open=false}={}){const g=new THREE.CylinderGeometry(rt,rb,h,segments,1,open);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);return add(g,hex,kind);},
  rod(a,b,r,hex,kind='metal',segments=6){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A),g=new THREE.CylinderGeometry(r,r,d.length(),segments,1,true);
   g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()));g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);return add(g,hex,kind);},
  sphere(r,x,y,z,hex,kind='paint',{sx=1,sy=1,sz=1,segments=8}={}){const g=new THREE.SphereGeometry(r,segments,Math.max(6,segments*.6|0));g.scale(sx,sy,sz);g.translate(x,y,z);return add(g,hex,kind);},
  torus(r,t,x,y,z,hex,kind='rubber',{rx=0,ry=0,radial=4,tubular=10}={}){const g=new THREE.TorusGeometry(r,t,radial,tubular);if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);g.translate(x,y,z);return add(g,hex,kind);},
  /** A flat streak of wear or paint on a surface whose outward normal is `normal` (±x, ±z, or 'y' for a floor: w along x, h along z). */
  streak(x,y,z,w,h,hex,normal='x'){const g=new THREE.PlaneGeometry(w,h);const s=normal[0]==='-'?-1:1,ax=normal.at(-1);if(ax==='y')g.rotateX(-Math.PI/2);else if(ax==='x')g.rotateY(s*Math.PI/2);else if(s<0)g.rotateY(Math.PI);g.translate(x,y,z);return add(g,hex,'wear');},
  finish(shadows=false){
   const meshes=[];
   for(const [kind,list] of Object.entries(parts)){if(!list.length)continue;const m=new THREE.Mesh(mergeGeometries(list,false),kinds[kind]());list.forEach(g=>g.dispose());m.name=name+' '+kind;m.castShadow=shadows&&kind!=='wear';m.receiveShadow=true;group.add(m);meshes.push(m);}
   return meshes;
  }};
 return kit;
}

const lerp=(a,b,t)=>a+(b-a)*t;
/** Piecewise-linear lookup of a station table [[z,value],...]. */
const table=rows=>z=>{if(z<=rows[0][0])return rows[0][1];for(let i=1;i<rows.length;i++)if(z<=rows[i][0]){const [z0,a]=rows[i-1],[z1,b]=rows[i];return lerp(a,b,(z-z0)/(z1-z0||1));}return rows.at(-1)[1];};

/**
 * A faired hull from its lines: half-breadth along the length (`breadth`, at the sheer), the sheer line (`sheer`),
 * the keel's depth (`keel`, negative) and the deck (`deck`). Its section is a rounded V below the waterline, flaring
 * out to the sheer above it. The paint follows the waterline: antifouling below, a boot-top across it, the topsides
 * and a sheer stripe; inside, the bulwarks and the deck in their own colours, and a capping rail on top.
 * @returns {{halfBreadth:(z:number,y:number)=>number,sheer:(z:number)=>number,deck:(z:number)=>number,stern:number,stem:number}}
 */
export function fairedHull(kit,{stations,length,colours,breaks=[],flare=.1,samples=26,cap=.07,bulwarkThickness=.07,rake=0,rakeFrom=0}){
 const half=length/2,breadth=table(stations.breadth),sheer=table(stations.sheer),keel=table(stations.keel),deck=table(stations.deck);
 const halfBreadth=(z,y)=>{const b=breadth(z),s=sheer(z),k=keel(z);
  if(y>=0)return b*(1-flare+flare*Math.min(1,y/Math.max(s,.01)));
  return b*(1-flare)*(1-Math.pow(Math.min(1,y/k),1.7));};
 const zs=[...new Set([...Array.from({length:samples+1},(_,i)=>-half+length*i/samples),...breaks].map(z=>+z.toFixed(4)))].sort((a,b)=>a-b);
 // A raked stem: toward the bow the hull is sheared aft below the sheer, so the forefoot sits behind the stem head.
 const shift=(z,y)=>{if(!rake||z<=rakeFrom)return 0;const u=Math.min(1,(z-rakeFrom)/(half-rakeFrom)),s=sheer(z),k=keel(z);return -rake*u*u*Math.min(1,Math.max(0,(s-y)/(s-k||1)));};
 const P=(x,y,z)=>[x,y,z+shift(z,y)];
 const C=colours,boot=[-.04,.08];
 // Bands: [bottom(z), top(z), colour]; each sampled at the same number of levels at every station.
 const bands=[[z=>keel(z),()=>boot[0],C.bottom,4],[()=>boot[0],()=>boot[1],C.boot,1],[()=>boot[1],z=>sheer(z)-C.stripeDepth,C.topsides,3],[z=>sheer(z)-C.stripeDepth,z=>sheer(z),C.stripe,1]];
 // Each band a grid shared between neighbouring facets, so the topsides shade round smoothly.
 for(const [lo,hi,hex,levels] of bands)for(const side of [1,-1]){
  const pos=[],index=[],row=levels+1;
  for(const z of zs)for(let j=0;j<=levels;j++){const y=lerp(lo(z),hi(z),j/levels);pos.push(...P(side*halfBreadth(z,y),y,z));}
  for(let i=0;i<zs.length-1;i++)for(let j=0;j<levels;j++){const a=i*row+j,b=(i+1)*row+j,c=b+1,d=a+1;
   if(side>0)index.push(a,d,b,b,d,c);else index.push(a,b,d,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();kit.add(g,hex);
 }
 // The transom: the same bands across the stern.
 {const z=zs[0],pos=[],cols=[];
  for(const [lo,hi,hex,levels] of bands)for(let j=0;j<levels;j++){
   const y0=lerp(lo(z),hi(z),j/levels),y1=lerp(lo(z),hi(z),(j+1)/levels),L0=[-halfBreadth(z,y0),y0,z],R0=[halfBreadth(z,y0),y0,z],L1=[-halfBreadth(z,y1),y1,z],R1=[halfBreadth(z,y1),y1,z];
   const quad=[...L0,...L1,...R0,...R0,...L1,...R1];pos.push(...quad);const c=new THREE.Color(hex);for(let k=0;k<6;k++)cols.push(c.r,c.g,c.b);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));kit.parts.paint.push(g);}
 // Deck, bulwarks inside, capping rail.
 const inner=(z,y)=>Math.max(0,halfBreadth(z,y)-bulwarkThickness);
 {const pos=[];for(let i=0;i<zs.length-1;i++){const z0=zs[i],z1=zs[i+1],y0=deck(z0),y1=deck(z1),w0=inner(z0,y0),w1=inner(z1,y1);pos.push(...P(-w0,y0,z0),...P(w1,y1,z1),...P(w0,y0,z0),...P(-w0,y0,z0),...P(-w1,y1,z1),...P(w1,y1,z1));}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.computeVertexNormals();kit.add(g,C.deck);}
 for(const side of [1,-1]){const pos=[],capPos=[];
  for(let i=0;i<zs.length-1;i++){const z0=zs[i],z1=zs[i+1],a=[side*inner(z0,deck(z0)),deck(z0),z0],b=[side*inner(z1,deck(z1)),deck(z1),z1],c=[side*inner(z1,sheer(z1)),sheer(z1),z1],d=[side*inner(z0,sheer(z0)),sheer(z0),z0];
   if(side>0)pos.push(...a,...b,...d,...b,...c,...d);else pos.push(...a,...d,...b,...b,...d,...c);
   const o0=[side*(halfBreadth(z0,sheer(z0))+.025),sheer(z0)+cap*.5,z0],o1=[side*(halfBreadth(z1,sheer(z1))+.025),sheer(z1)+cap*.5,z1],i0=[d[0],sheer(z0)+cap*.5,z0],i1=[c[0],sheer(z1)+cap*.5,z1];
   if(side>0)capPos.push(...i0,...i1,...o0,...o0,...i1,...o1);else capPos.push(...i0,...o0,...i1,...o0,...o1,...i1);
   // Its outer and inner faces, so the cap reads as a timber rail, not a line.
   const lo0=[o0[0],sheer(z0)-cap*.5,z0],lo1=[o1[0],sheer(z1)-cap*.5,z1];
   if(side>0)capPos.push(...lo0,...o0,...o1,...lo0,...o1,...lo1);else capPos.push(...lo0,...o1,...o0,...lo0,...lo1,...o1);
  }
  const sheared=list=>{for(let q=0;q<list.length;q+=3)list[q+2]+=shift(list[q+2],list[q+1]);return list;};
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(sheared(pos),3));g.computeVertexNormals();kit.add(g,C.bulwark);
  const k=new THREE.BufferGeometry();k.setAttribute('position',new THREE.Float32BufferAttribute(sheared(capPos),3));k.computeVertexNormals();kit.add(k,C.cap);
 }
 return {halfBreadth,sheer,deck,inner,shift,stern:-half,stem:half,keel};
}

/**
 * An atlas of painted lettering: each entry {text, sub?, bg, ink, w, h} gets a band of the canvas, and `plane(i, ...)`
 * places a board with it. One texture and one draw for all the lettering on a boat.
 */
export function letteringAtlas(entries,{name='boat lettering',width=512}={}){
 const rows=entries.map(e=>Math.max(32,Math.round(width*e.h/e.w)));const H=rows.reduce((a,b)=>a+b,0);
 const draw=ctx=>{let y=0;entries.forEach((e,i)=>{const h=rows[i];ctx.clearRect(0,y,width,h);if(e.bg){ctx.fillStyle=e.bg;ctx.fillRect(0,y,width,h);}ctx.fillStyle=e.ink;ctx.textAlign='center';ctx.textBaseline='middle';
  const serif='"Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif',sans='"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans CJK JP",sans-serif';
  const fit=(text,size,font,cy)=>{let s=size;ctx.font=`bold ${s}px ${font}`;while(s>8&&ctx.measureText(text).width>width*.92){s--;ctx.font=`bold ${s}px ${font}`;}ctx.fillText(text,width/2,cy);};
  if(e.sub){fit(e.text,h*.58,e.font==='sans'?sans:serif,y+h*.4);fit(e.sub,h*.22,sans,y+h*.84);}else fit(e.text,h*.74,e.font==='sans'?sans:serif,y+h*.53);
  y+=h;});};
 let texture=null;
 if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=width;c.height=H;const ctx=c.getContext('2d');if(ctx){draw(ctx);texture=releaseAfterUpload(new THREE.CanvasTexture(c),draw);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;}}
 // Letters painted straight on the hull: only the paint is drawn (alpha-tested, so it never needs sorting).
 const material=new THREE.MeshStandardMaterial({map:texture,color:texture?0xffffff:0xdddddd,roughness:.7,alphaTest:.5,transparent:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,visible:!!texture});
 const planes=[];let top=0;const v=rows.map(h=>{const r=[1-(top+h)/H,1-top/H];top+=h;return r;});
 return {
  /** Entry i laid on a hull side (hullQuad). */
  onHull(i,xAt,side,z0,z1,y0,y1,shift=null){const g=hullQuad(xAt,side,z0,z1,y0,y1,{v:v[i],shift});planes.push(g);return g;},
  /** A board for entry i, `w` × `h` m, centred at p, its face toward `normal` ('x','-x','z','-z'). */
  plane(i,p,normal,w=entries[i].w,h=entries[i].h){const g=new THREE.PlaneGeometry(w,h),uv=g.attributes.uv,[v0,v1]=v[i];
   for(let k=0;k<uv.count;k++)uv.setY(k,uv.getY(k)?v1:v0);
   const s=normal[0]==='-'?-1:1,ax=normal.at(-1);if(ax==='x')g.rotateY(s*Math.PI/2);else if(s<0)g.rotateY(Math.PI);g.translate(...p);const n=g.toNonIndexed();g.dispose();planes.push(n);return n;},
  finish(group){if(!planes.length)return null;const m=new THREE.Mesh(mergeGeometries(planes,false),material);planes.forEach(g=>g.dispose());m.name=name;m.castShadow=false;m.receiveShadow=true;group.add(m);return m;},
  material,texture,
 };
}

/* -------------------------------------------------------------------------------------------------------------- */

/**
 * The inshore fishing boat that lies at the main quay (minato-berth.js QUAY_FISHING_BOAT), a 4.9-ton class FRP boat
 * of the kind every Okinawan port had in 1997: white, a blue sheer stripe, a wheelhouse aft of amidships, a mast with
 * her working lamps, and the gear for the night's squid and the day's line fishing.
 */
export const QUAY_FISHING_BOAT_LOOK=Object.freeze({
 /** Painted on both bows: her name (第五 清栄丸, Daigo Seiei Maru) and her fishing registration (漁船登録番号, OK = Okinawa). */
 name:'第五 清栄丸',registration:'OK2-31057',
 colours:Object.freeze({bottom:0xa2402f,boot:0x1d2a36,topsides:0xeeebe2,stripe:0x2f6fb8,stripeDepth:.16,bulwark:0xe2ddd0,cap:0x7a6248,deck:0x8fa596}),
 why:Object.freeze({
  lamps:'Five bulbs on a spar over the foredeck: she fishes sodeika (diamond squid) at night, as the auction board says.',
  hauler:'A line hauler on the starboard bow, for the bottom lines she sets for gurukun by day.',
  floats:'Orange floats and a flag buoy (bonten) to mark her lines, stowed on the afterdeck with the net.',
  crates:'Blue fish crates stacked aft, for the catch she lands at the auction shed.',
  fenders:'White fenders hung ready on her port side; to starboard she lies on the quay wall’s tyres.',
 }),
});

/**
 * @param {{length?:number,beam?:number,look?:object,shadows?:boolean,name?:string,quayFenders?:{side:1|-1,radius:number}|null}} options
 *   quayFenders: big fenders hung on the side she lies to a quay with no tyres of its own (side −1 starboard, 1 port),
 *   as fat as the gap; without it she lies on the quay's tyres and carries two small ones ready on her port side.
 */
/** The two boats that lie at the east quay in front of the auction shed (okinawa/quarters.js). */
export const EAST_QUAY_BOAT_LOOKS=Object.freeze([
 Object.freeze({...QUAY_FISHING_BOAT_LOOK,name:'第三 みなと丸',registration:'OK2-20419'}),
 Object.freeze({...QUAY_FISHING_BOAT_LOOK,name:'第八 栄福丸',registration:'OK2-27753',colours:Object.freeze({...QUAY_FISHING_BOAT_LOOK.colours,stripe:0x8a3b2e})}),
]);

export function buildFishingBoat({length=6.3,beam=2.9,look=QUAY_FISHING_BOAT_LOOK,shadows=false,name='Fishing boat',quayFenders=null}={}){
 const kit=createBoatKit(name),half=length/2,hb=beam/2,C=look.colours;
 const hull=fairedHull(kit,{length,colours:C,flare:.12,rake:.6,rakeFrom:half*.2,stations:{
  breadth:[[-half,hb*.86],[-half*.4,hb],[half*.25,hb*.95],[half*.7,hb*.62],[half,0]],
  sheer:[[-half,.78],[0,.8],[half*.6,.98],[half,1.22]],
  keel:[[-half,-.5],[half*.5,-.55],[half,-.08]],
  deck:[[-half,.36],[0,.36],[half*.6,.5],[half,.72]],
 }});
 const top=z=>hull.sheer(z),deckY=z=>hull.deck(z),wide=(z,y)=>hull.halfBreadth(z,y),sh=hull.shift;
 // Rubbing strake: a black rubber D along the sheer, on both sides.
 for(const side of [1,-1])for(let i=0;i<8;i++){const z0=-half+.05+i*(length-.5)/8,z1=z0+(length-.5)/8;
  kit.rod([side*(wide(z0,top(z0)-.22)+.02),top(z0)-.22,z0],[side*(wide(z1,top(z1)-.22)+.02),top(z1)-.22,z1],.035,0x23292b,'rubber');}
 // The wheelhouse, aft of amidships: white, its front windows raked, a door to starboard, side windows.
 const wh={z0:-1.55,z1:-.05,w:1.7,y0:deckY(-.8),h:1.55};
 kit.box(wh.w,wh.h,wh.z1-wh.z0,0,wh.y0+wh.h/2,(wh.z0+wh.z1)/2,0xf3f1ea);
 kit.box(wh.w+.14,.08,wh.z1-wh.z0+.24,0,wh.y0+wh.h+.04,(wh.z0+wh.z1)/2+.04,0x2f6fb8);
 // Windows: the glass set back in the wall, white frames round it.
 for(const x of [-.5,0,.5])kit.box(.42,.42,.04,x,wh.y0+1.12,wh.z1+.005,0x22313a,'glass');
 for(const side of [1,-1]){kit.box(.04,.38,.9,side*(wh.w/2+.005),wh.y0+1.12,(wh.z0+wh.z1)/2+.15,0x22313a,'glass');
  // Sidelights on the wheelhouse sides, red to port, green to starboard, in their screens (off: she is alongside).
  kit.box(.05,.16,.22,side*(wh.w/2+.04),wh.y0+wh.h-.18,wh.z1-.18,0x1f2427,'metal');kit.box(.03,.09,.1,side*(wh.w/2+.07),wh.y0+wh.h-.18,wh.z1-.12,side>0?0xc23a2c:0x2f9a54,'glass');}
 kit.box(.04,1.25,.55,-(wh.w/2+.012),wh.y0+.63,wh.z0+.4,0xd8d4c8);
 // Mast on the wheelhouse roof: the masthead light, a radar scanner (1990s open array), whip aerial, the spar of lamps.
 const mastTop=wh.y0+wh.h+2.4;
 kit.cyl(.045,.06,2.38,0,wh.y0+wh.h+1.21,wh.z0+.35,0xe8e6de,'metal');
 kit.box(.12,.12,.12,0,mastTop+.02,wh.z0+.35,0xf5f2e2,'glass');
 kit.box(.9,.07,.12,0,wh.y0+wh.h+.85,wh.z0+.35,0x3b4245,'metal');kit.cyl(.08,.08,.1,0,wh.y0+wh.h+.78,wh.z0+.35,0x3b4245,'metal');
 kit.rod([.3,wh.y0+wh.h,wh.z0+.2],[.3,wh.y0+wh.h+1.6,wh.z0+.2],.01,0x2a2f31);
 // Stays from the masthead to the bow and the stern quarters.
 kit.rod([0,mastTop-.05,wh.z0+.35],[0,top(half*.85)+.05,half*.85],.01,0x2a2f31);
 for(const side of [1,-1])kit.rod([0,mastTop-.05,wh.z0+.35],[side*(hb*.78),top(-half+.3),-half+.3],.01,0x2a2f31);
 // The squid lamps: bulbs under their shades hung along the forestay from the masthead to the stem head, and two on
 // the backstays, so the light falls on the water all round her at night.
 const stay=(t,to)=>[lerp(0,to[0],t),lerp(mastTop-.05,to[1],t),lerp(wh.z0+.35,to[2],t)];
 const stem=[0,top(half*.85)+.05,half*.85];
 for(const t of [.3,.5,.7,.86]){const [x,y,z]=stay(t,stem);kit.rod([x,y,z],[x,y-.16,z],.008,0x2a2f31);kit.cyl(.07,.11,.07,x,y-.2,z,0xd8d6cf,'metal');kit.sphere(.06,x,y-.27,z,0xf4efdc,'glass');}
 for(const side of [1,-1]){const [x,y,z]=stay(.45,[side*(hb*.78),top(-half+.3),-half+.3]);kit.rod([x,y,z],[x,y-.16,z],.008,0x2a2f31);kit.cyl(.07,.11,.07,x,y-.2,z,0xd8d6cf,'metal');kit.sphere(.06,x,y-.27,z,0xf4efdc,'glass');}
 // The line hauler on the starboard bow: a pedestal, a grooved sheave, its hydraulic motor.
 const lhZ=half*.48,lhX=-(wide(lhZ,top(lhZ))-.28);
 kit.cyl(.07,.09,.55,lhX,deckY(lhZ)+.28,lhZ,0x6c7a7e,'metal');kit.cyl(.2,.2,.1,lhX,deckY(lhZ)+.62,lhZ,0x3d4548,'metal',{rz:Math.PI/2,segments:14});kit.box(.16,.16,.18,lhX+.14,deckY(lhZ)+.62,lhZ,0xc2442f,'metal');
 // Bitts fore and aft each side for her lines; a fairlead in the bulwark cap beside each.
 for(const side of [1,-1])for(const z of [half*.62,-half+.45]){const x=side*(wide(z,top(z))-.32);kit.cyl(.06,.06,.32,x,deckY(z)+.16,z,0x2f3437,'metal');kit.box(.24,.05,.05,x,deckY(z)+.26,z,0x2f3437,'metal');}
 // Afterdeck: the net with its floats, the flag buoy, the fish crates.
 kit.sphere(.55,.35,deckY(-2.3)+.12,-2.3,0x3d6b52,'paint',{sx:1.1,sy:.42,sz:.9});
 for(const [x,z] of [[.1,-2.05],[.55,-2.55],[.7,-2.0],[.2,-2.65]])kit.sphere(.1,x,deckY(z)+.32,z,0xe8742a,'paint');
 kit.rod([-.7,deckY(-2.6),-2.6],[-.7,deckY(-2.6)+2.1,-2.6],.02,0xd9d3c0,'paint');kit.box(.02,.32,.42,-.7,deckY(-2.6)+1.92,-2.4,0xd9412b,'paint');kit.sphere(.15,-.7,deckY(-2.6)+.55,-2.6,0xe8742a);
 for(let i=0;i<3;i++)kit.box(.62,.24,.42,-.55,deckY(-1.95)+.12+i*.245,-1.95,0x2f6fb8,'paint');
 // Fenders: two white ones hung ready on her port side, for a boat that comes alongside her; to starboard she lies on
 // the quay's own tyres (harbour.js), which take her side at her waterline.
 {const side=quayFenders?quayFenders.side:1,r=quayFenders?quayFenders.radius:.11,at=quayFenders?[-length*.3,0,length*.25]:[-1.6,.2];
  for(const z of at){kit.cyl(r,r,.5,side*(wide(z,top(z)-.4)+r),top(z)-.62,z,0xf0eee6,'rubber',{segments:10});
   kit.rod([side*(wide(z,top(z))-.02),top(z)+.02,z],[side*(wide(z,top(z)-.4)+r),top(z)-.37,z],.008,0x9b825e,'paint');}}
 // Wear: rust from the bitts' fastenings and the scuppers, scuffing along her quay side.
 for(const [z,h] of [[half*.62,.3],[-half+.45,.35],[-.7,.25]])for(const side of [1,-1])kit.add(hullQuad(wide,side,z-.025,z+.025,top(z)-.32-h,top(z)-.32,{off:.006,shift:sh}),0xa66a42,'wear');
 for(const z of [-1.2,.3])kit.add(hullQuad(wide,-1,z-.45,z+.45,.32,.38,{off:.006}),0xb4b0a4,'wear');
 // Lettering: her name on both bows, her registration under it, as the Fisheries Act wants it.
 const atlas=letteringAtlas([{text:look.name,bg:null,ink:'#1d2a36',w:1.5,h:.3},{text:look.registration,bg:null,ink:'#1d2a36',w:1.1,h:.22,font:'sans'}],{name:name+' lettering'});
 for(const side of [1,-1]){const z=half*.36,yN=top(z)-.42,yR=top(z)-.68;
  atlas.onHull(0,wide,side,z-.75,z+.75,yN-.15,yN+.15,sh);atlas.onHull(1,wide,side,z-.55,z+.55,yR-.11,yR+.11,sh);}
 // Her lines leave from the starboard bitts through fairleads in the cap (stern line, then the forward spring); on deck,
 // each runs from its bitt to the fairlead, and its tail lies coiled beside the bitt.
 const lead=side=>[-half+.45,half*.62].map(z=>{const x=side*(wide(z,top(z))-.32),fx=side*(wide(z,top(z))-.02);
  kit.rod([x,deckY(z)+.24,z],[fx,top(z)+.03,z],.022,0x9b825e,'paint');
  for(let k=0;k<2;k++)kit.torus(.16-k*.05,.022,x-side*.3,deckY(z)+.025+k*.03,z+(z>0?-.35:.35),0x9b825e,'paint',{rx:Math.PI/2});
  kit.box(.1,.06,.16,fx,top(z)+.05,z,0x2f3437,'metal');
  return [fx+side*.03,top(z)+.04,z];});
 // Her lines go from the side she lies to the quay: starboard at the main quay, either at the east quay.
 const fairleads=lead(quayFenders?.side??-1);
 kit.finish(shadows);atlas.finish(kit.group);
 Object.assign(kit.group.userData,{look,fairleads});
 return kit.group;
}

/**
 * Mooring lines that move with a boat: each line a chain of short rope segments hanging between its two ends (a
 * parabola, close to the catenary at these spans), re-laid every frame from where the fairlead is now, so a line
 * never parts from a boat that rises and rolls at her berth. One instanced mesh for all of them.
 */
export function createMooringLines(parent,count,{segments=10,radius=.024,colour=0x9b825e,name='Mooring lines'}={}){
 const mesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(radius,radius,1,6,1,true),new THREE.MeshStandardMaterial({color:colour,roughness:.92}),count*segments);
 mesh.name=name;mesh.userData.dynamicProp=true;mesh.frustumCulled=false;parent.add(mesh);
 const o=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),a=new THREE.Vector3(),b=new THREE.Vector3(),d=new THREE.Vector3();
 const point=(from,to,sag,t,out)=>out.copy(from).lerp(to,t).setY(from.y+(to.y-from.y)*t-sag*4*t*(1-t));
 return {mesh,
  /** Line i from `from` to `to` (world Vector3s), hanging `sag` metres at its middle. */
  set(i,from,to,sag=.15){
   for(let k=0;k<segments;k++){point(from,to,sag,k/segments,a);point(from,to,sag,(k+1)/segments,b);d.subVectors(b,a);const len=d.length();
    o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(up,d.normalize());o.scale.set(1,len+radius,1);o.updateMatrix();mesh.setMatrixAt(i*segments+k,o.matrix);}
   mesh.instanceMatrix.needsUpdate=true;},
  /** Hide line i (the boat has gone). */
  hide(i){o.scale.set(0,0,0);o.updateMatrix();for(let k=0;k<segments;k++)mesh.setMatrixAt(i*segments+k,o.matrix);mesh.instanceMatrix.needsUpdate=true;},
 };
}

/* -------------------------------------------------------------------------------------------------------------- */

/**
 * The island cargo boat (cargo-shipping.js, 19-ton class, 20 × 5 m): a raised forecastle with the anchor windlass,
 * a long cargo deck with its hatch and a hydraulic cargo crane, the house and wheelhouse aft with the funnel. Two
 * services use the berth on alternate days, each with its own boat and name (cargoVisit's names); the boards show
 * the one that is in.
 */
export const CARGO_BOAT_LOOK=Object.freeze({
 names:Object.freeze({
  'Kitano Supply':Object.freeze({bow:'北野丸',roman:'KITANO MARU',port:'那覇'}),
  'Island Trader':Object.freeze({bow:'第三 島栄丸',roman:'SHIMAEI MARU No.3',port:'那覇'}),
 }),
 colours:Object.freeze({bottom:0x9a3b2c,boot:0x1c2326,topsides:0x2c4b66,stripe:0xe8e4d8,stripeDepth:.1,bulwark:0xc9c8bc,cap:0x3d4a4e,deck:0x6f7f69}),
 /** What she has brought in today, on her hatch, and why (merchandising.js: Sakura Trading is the town's supplier). */
 load:Object.freeze([
  Object.freeze({id:'sakura-container',what:'A 12-foot box of shop stock for Sakura Trading’s depot in the Quay Warehouse, the depot’s name painted on its side.'}),
  Object.freeze({id:'higa-beer',what:'Two pallets of yellow Umineko crates for Sakura Trading’s depot, who supply every bar and shop in town with drink since Higa Liquor closed.'}),
  Object.freeze({id:'rice',what:'A sling of rice in 30 kg sacks, on the crane’s hook over the open hatch: the island’s rice comes by sea.'}),
 ]),
});

export function buildCargoBoat({length=20,beam=5,look=CARGO_BOAT_LOOK,shadows=false,name='Island cargo boat'}={}){
 const kit=createBoatKit(name),half=length/2,hb=beam/2-.03,C=look.colours;
 const FC=6.8;// the break of the forecastle
 const hull=fairedHull(kit,{length,colours:C,flare:.08,samples:30,cap:.09,bulwarkThickness:.09,rake:1.4,rakeFrom:4.5,breaks:[FC-.4,FC-.05,FC+.05,FC+.2],stations:{
  breadth:[[-half,hb*.9],[-half*.6,hb],[half*.4,hb],[half*.75,hb*.76],[half,0]],
  sheer:[[-half,1.9],[FC-.4,1.85],[FC+.2,2.8],[half,3.0]],
  keel:[[-half,-.62],[half*.8,-.72],[half,-.25]],
  deck:[[-half,.95],[FC-.05,.95],[FC+.05,1.95],[half,2.05]],
 }});
 const top=z=>hull.sheer(z),deckY=z=>hull.deck(z),wide=(z,y)=>hull.halfBreadth(z,y),sh=hull.shift,grey=0xeeebe0,steel=0x3d4a4e;
 // The forecastle's after bulkhead, the step down to the cargo deck.
 kit.box(2*hull.inner(FC,1.9)-.02,1.0,.1,0,1.45,FC-.05,C.bulwark);
 // Rubbing band along the sheer each side, within her beam: she lies on the pier's own fenders.
 for(const side of [1,-1])for(let i=0;i<12;i++){const z0=-half+.3+i*(length-1.4)/12,z1=z0+(length-1.4)/12,y0=top(z0)-.35,y1=top(z1)-.35;
  kit.rod([side*(wide(z0,y0)-.03),y0,z0],[side*(wide(z1,y1)-.03),y1,z1],.05,0x23292b,'rubber');}
 // The house aft and the wheelhouse on it.
 const H={z0:-9.3,z1:-5.8,w:4.1,y0:.95,h:2},WH={z0:-8.7,z1:-6.4,w:3.0,y0:2.95,h:1.5};
 kit.box(H.w,H.h,H.z1-H.z0,0,H.y0+H.h/2,(H.z0+H.z1)/2,grey);
 for(const side of [1,-1]){
  for(const z of [-8.6,-7.2])kit.cyl(.17,.17,.03,side*(H.w/2+.016),H.y0+1.3,z,0x22313a,'glass',{rz:Math.PI/2,segments:12});// portholes
  kit.box(.04,1.7,.7,side*(H.w/2+.01),H.y0+.86,-6.5,0x8d9493,'metal');// steel door
  // Lifebuoys on the house sides, orange with white bands.
  kit.torus(.27,.06,side*(H.w/2+.07),H.y0+1.35,-7.9,0xe2552c,'paint',{ry:Math.PI/2});
 }
 kit.box(WH.w,WH.h,WH.z1-WH.z0,0,WH.y0+WH.h/2,(WH.z0+WH.z1)/2,grey);
 kit.box(WH.w+.3,.1,WH.z1-WH.z0+.45,0,WH.y0+WH.h+.05,(WH.z0+WH.z1)/2+.1,0xd9d6cc);
 // Wheelhouse windows: four across the front, three a side, two aft; frames are the white wall between them.
 for(let i=0;i<4;i++)kit.box(.6,.62,.04,-1.05+i*.7,WH.y0+1.0,WH.z1+.012,0x22313a,'glass');
 for(const side of [1,-1]){for(let i=0;i<3;i++)kit.box(.04,.55,.55,side*(WH.w/2+.012),WH.y0+1.0,WH.z0+.45+i*.7,0x22313a,'glass');
  // Sidelights in their screens on the wheelhouse front corners (red to port, green to starboard; off alongside).
  kit.box(.06,.2,.34,side*(WH.w/2+.06),WH.y0+1.25,WH.z1-.25,0x1f2427,'metal');kit.box(.04,.12,.12,side*(WH.w/2+.1),WH.y0+1.25,WH.z1-.14,side>0?0xc23a2c:0x2f9a54,'glass');}
 for(const x of [-.6,.6])kit.box(.55,.5,.04,x,WH.y0+1.0,WH.z0-.012,0x22313a,'glass');
 // The boat deck round the wheelhouse: stanchions and two rails along its edge, a ladder down to the cargo deck.
 for(const side of [1,-1]){const x=side*(H.w/2-.08);for(let z=H.z0+.1;z<=H.z1;z+=.85)kit.rod([x,H.y0+H.h,z],[x,H.y0+H.h+.95,z],.022,0xe5e3da);
  for(const y of [.5,.95])kit.rod([x,H.y0+H.h+y,H.z0+.1],[x,H.y0+H.h+y,H.z1],.02,0xe5e3da);}
 for(const y of [.5,.95])kit.rod([-(H.w/2-.08),H.y0+H.h+y,H.z0+.1],[H.w/2-.08,H.y0+H.h+y,H.z0+.1],.02,0xe5e3da);
 for(const x of [H.w/2-.25,H.w/2-.65])kit.rod([x,H.y0+H.h+.95,H.z1+.02],[x,H.y0+.02,H.z1+.95],.025,0xe5e3da);
 for(let k=1;k<7;k++){const t=k/7;kit.rod([H.w/2-.25,lerp(H.y0+H.h,H.y0,t),lerp(H.z1,H.z1+.9,t)],[H.w/2-.65,lerp(H.y0+H.h,H.y0,t),lerp(H.z1,H.z1+.9,t)],.02,0xe5e3da);}
 // Funnel aft of the wheelhouse: the owner's blue band, a black top, rust weeping from its rim.
 kit.box(.85,1.5,1.0,0,H.y0+H.h+.75,-9.0,grey);kit.box(.88,.3,1.03,0,H.y0+H.h+1.05,-9.0,0x2f6fb8);kit.box(.87,.18,1.02,0,H.y0+H.h+1.42,-9.0,0x1d2224);
 kit.streak(.441,H.y0+H.h+1.18,-9.2,.05,.4,0x9a6040,'x');kit.streak(-.441,H.y0+H.h+1.18,-8.8,.05,.36,0x9a6040,'-x');
 // Liferaft canister in its cradle on the boat deck.
 kit.cyl(.25,.25,.95,-1.3,H.y0+H.h+.3,-6.2,0xf2efe6,'paint',{rx:Math.PI/2,segments:12});kit.box(.6,.12,.7,-1.3,H.y0+H.h+.06,-6.2,steel,'metal');
 // The mast on the wheelhouse roof: yard with the radar scanner, the masthead light, a whip aerial, the horn.
 const roof=WH.y0+WH.h+.1,mz=-7.3;
 kit.cyl(.06,.08,3.2,0,roof+1.6,mz,0xe8e6de,'metal');kit.rod([-.9,roof+2.3,mz],[.9,roof+2.3,mz],.035,0xe8e6de);
 kit.box(1.5,.08,.16,0,roof+1.0,mz+.35,0x3b4245,'metal');kit.box(.3,.22,.3,0,roof+.88,mz+.35,0x3b4245,'metal');
 kit.box(.14,.16,.14,0,roof+3.28,mz,0xf5f2e2,'glass');kit.rod([.9,roof+2.3,mz],[.9,roof+3.6,mz],.012,0x2a2f31);
 kit.cyl(.06,.12,.3,-.5,roof+2.45,mz+.05,0x8d9493,'metal',{rx:Math.PI/2});
 // Stays from the yard to the house sides.
 for(const side of [1,-1])kit.rod([side*.9,roof+2.3,mz],[side*(WH.w/2-.05),roof-.05,mz-.6],.01,0x2a2f31);
 // Stern light on the taffrail.
 kit.box(.12,.14,.1,0,top(-half)+.1,-half+.12,0xf5f2e2,'glass');
 // The hatch: a coaming round the hold, steel pontoon covers, one cover lifted off and stacked forward so the crane
 // can work the hold; the hold's dark inside under it.
 const HC={z0:-5.0,z1:5.6,w:3.6,h:.6,y:.95};
 for(const side of [1,-1])kit.box(.12,HC.h,HC.z1-HC.z0,side*(HC.w/2-.06),HC.y+HC.h/2,(HC.z0+HC.z1)/2,0x5d6f63);
 for(const z of [HC.z0+.06,HC.z1-.06])kit.box(HC.w,HC.h,.12,0,HC.y+HC.h/2,z,0x5d6f63);
 const panels=[[-5,-2.9],[-2.9,-.8],[-.8,1.3],[1.3,3.45],[3.45,5.6]],open=2;
 panels.forEach(([z0,z1],i)=>{if(i===open)return;kit.box(HC.w+.06,.14,z1-z0-.04,0,HC.y+HC.h+.07,(z0+z1)/2,0x6f8272);for(const dx of [-1.2,0,1.2])kit.box(.08,.06,z1-z0-.1,dx,HC.y+HC.h+.17,(z0+z1)/2,0x627566);});
 {const [z0,z1]=panels[open];kit.box(HC.w-.24,.02,z1-z0-.1,0,-.3,(z0+z1)/2,0x2a2e2c);// the hold floor, in shadow
  for(const side of [1,-1])kit.box(.04,1.25,z1-z0,side*(HC.w/2-.14),.33,(z0+z1)/2,0x3b433e);
  // The lifted cover, stacked on the next one forward.
  kit.box(HC.w+.06,.14,z1-z0-.04,0,HC.y+HC.h+.21,(panels[3][0]+panels[3][1])/2,0x6f8272);}
 // The load (look.load): Sakura Trading's container aft on the hatch; Higa's beer on two pallets forward.
 const hatchTop=HC.y+HC.h+.14;
 kit.box(2.4,2.45,3.65,0,hatchTop+1.225,-3.0,0xb8463a);for(let i=0;i<9;i++)kit.box(2.44,2.3,.05,0,hatchTop+1.225,-4.7+i*.42,0xa63d33);
 for(const side of [1,-1])kit.box(.03,.03,3.6,side*1.21,hatchTop+.2,-3.0,0x2b2f30,'metal');
 for(const [x,z] of [[-.75,4.1],[.75,4.1]]){const y0=hatchTop+.28;kit.box(1.1,.14,1.1,x,hatchTop+.07+.21,z,0x8a6c4a);// the pallet, on the stacked covers
  for(let r=0;r<3;r++)for(let c=0;c<4;c++)kit.box(.5,.28,.34,x+(c%2?.26:-.26),y0+.14+.14+r*.29,z+(c<2?-.18:.18),0xe7b52c);}
 // The cargo crane between the hatch and the forecastle: pedestal, slewing post, the boom luffed up and swung aft over
 // the open hatch, the whip and the hook with a sling of rice sacks just clear of the coaming.
 const cz=6.1,boomFoot=[0,2.9,cz],tip=[0,5.2,(panels[open][0]+panels[open][1])/2];
 kit.cyl(.32,.4,1.3,0,.95+.65,cz,0xe0b93a,'metal',{segments:12});kit.box(.8,.9,.9,0,2.5,cz,0xe0b93a,'metal');
 kit.rod(boomFoot,tip,.16,0xe0b93a,'metal',8);kit.rod([0,2.4,cz-.4],[0,(2.9+5.2)/2-.45,(cz+tip[2])/2],.08,0x9aa3a6,'metal',8);
 const hookY=hatchTop+1.15;kit.rod([tip[0],tip[1],tip[2]],[tip[0],hookY+.3,tip[2]],.014,0x2a2f31);kit.box(.18,.26,.12,0,hookY+.2,tip[2],0xe0b93a,'metal');
 for(let i=0;i<6;i++)kit.box(.62,.18,.38,(i%2?.33:-.33),hookY-.3+(i>>1)*.19,tip[2],0xf0ead8);
 for(const side of [1,-1])kit.rod([0,hookY+.1,tip[2]],[side*.66,hookY-.38,tip[2]],.012,0x9b825e,'paint');
 // The forecastle: the anchor windlass, its chain to the hawse pipes, the anchors home in them.
 const fd=deckY(8.2);
 kit.box(1.4,.5,.6,0,fd+.25,8.0,0x5d6f63,'metal');for(const side of [1,-1]){kit.cyl(.26,.26,.22,side*.6,fd+.42,8.0,0x3a4245,'metal',{rz:Math.PI/2,segments:12});
  kit.rod([side*.6,fd+.2,8.2],[side*.95,fd+.05,9.2],.05,0x2b2f30,'metal');
  const az=9.0,ay=top(az)-.75;kit.box(.12,.6,.42,side*(wide(az,ay)+.03),ay-.15,az,0x1d2224,'metal');}
 // Bitts and fairleads for her four lines (stern line, after spring, forward spring, head line: cargo-shipping.js),
 // on her starboard side, the side she lies to the pier; their tails coiled on deck.
 const leads=[[-8.7,'stern line'],[-8.1,'after spring'],[7.55,'forward spring'],[8.45,'head line']].map(([z,line])=>{
  const y=top(z),x=-(wide(z,y)-.02),bx=-(wide(z,y)-.55),d=deckY(z);
  kit.cyl(.09,.09,.42,bx,d+.21,z,0x2b2f30,'metal');kit.box(.32,.06,.07,bx,d+.36,z,0x2b2f30,'metal');
  kit.box(.12,.12,.3,x+.04,y+.06,z,0x2b2f30,'metal');kit.rod([bx,d+.3,z],[x,y+.06,z],.026,0x9b825e,'paint');
  for(let k=0;k<2;k++)kit.torus(.22-k*.07,.026,bx+.45,d+.03+k*.035,z+(z>0?-.5:.5),0x9b825e,'paint',{rx:Math.PI/2});
  return {line,at:[x-.04,y+.06,z]};});
 // Wear: rust weeping from the hawse pipes and the scuppers along the cargo deck, the paint scuffed where she lies to
 // the pier's fenders, draught marks at stem and stern.
 for(const side of [1,-1]){
  kit.add(hullQuad(wide,side,8.95,9.05,top(9)-1.6,top(9)-.95,{off:.006,shift:sh}),0x8f5636,'wear');
  for(let z=-4.5;z<=5;z+=2.4)kit.add(hullQuad(wide,side,z-.03,z+.03,.6,top(z)-.95+.82,{off:.006,shift:sh}),0x91603e,'wear');
  for(const z of [8.6,-9.6])for(let k=0;k<3;k++){const y=-.4+k*.2;kit.add(hullQuad(wide,side,z-.05,z+.05,y,y+.04,{off:.006,shift:sh}),0xe8e4d8,'wear');}
 }
 // Where the pier's V-fenders take her starboard side (minato-berth.js CARGO_BERTH: z −53 to −69, her 9 to −7) the
 // paint is rubbed paler.
 for(const z of [9,5,1,-3,-7])kit.add(hullQuad(wide,-1,z-.3,z+.3,.15,1.25,{off:.006,shift:sh}),0x35536b,'wear');
 kit.finish(shadows);
 // Lettering: one board set for each boat on the service, shown by update(name).
 const boards=new Map();
 for(const [service,n] of Object.entries(look.names)){
  const atlas=letteringAtlas([{text:n.bow,sub:n.roman,bg:null,ink:'#f2efe6',w:2.4,h:.62},{text:n.bow,sub:n.port,bg:null,ink:'#f2efe6',w:2.2,h:.6}],{name:'Name boards: '+service});
  for(const side of [1,-1]){atlas.onHull(0,wide,side,7.05,9.0,top(7.6)-.8,top(7.6)-.25,sh);}
  atlas.plane(1,[0,top(-half)-.55,-half-.012],'-z');
  const mesh=atlas.finish(kit.group);mesh.visible=false;boards.set(service,mesh);
 }
 const g=kit.group;
 Object.assign(g.userData,{look,leads,
  /** Show the boards of the boat that is in. */
  showName(service){for(const [k,m] of boards)m.visible=k===service;}});
 return g;
}
