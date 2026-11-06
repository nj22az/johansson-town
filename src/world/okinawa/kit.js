import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {markPane,sharedWindowMaterial} from '../../render/window-interior.js';
import {releaseAfterUpload} from '../../render/canvas-release.js';

/**
 * The building kit the Okinawan quarters are made with.
 *
 * Sakura Crossing (Kenton-GMI, MIT; see LICENSE-SAKURA-CROSSING.txt) builds each prop
 * out of primitives and bakes them into one geometry per material, so a whole utility
 * pole is a handful of draw calls rather than forty. This does the same for a whole
 * district: every box, cylinder and roof goes into a bucket by finish (matte, glossy,
 * glowing) and by 32-metre cell, with its colour carried per vertex, and at the end
 * each bucket becomes one mesh. The town's cel pass turns them into toon materials
 * like everything else, and the cells let the camera cull what is behind it.
 */
const CELL=32;
const FINISHES=Object.freeze({
 matte:{roughness:.92,metalness:0},
 gloss:{roughness:.45,metalness:.08},
 metal:{roughness:.5,metalness:.35},
 glow:{roughness:.7,metalness:0,emissive:0xffd9a0,emissiveIntensity:0},
 lamp:{roughness:.6,metalness:0,emissive:0xffc070,emissiveIntensity:0},
 /** Window glass with a room behind it (render/window-interior.js). */
 window:{},
 thin:{roughness:.8,metalness:0,side:THREE.DoubleSide},
 roof:{roughness:.88,metalness:0,side:THREE.DoubleSide},
});

/**
 * The one module every building is measured in (docs/AMPLIFY-AUDIT.md, §5.1).
 *
 * Japanese building runs on the ken and its half, so a door, a window and a shutter
 * bay are all the same few sizes wherever they turn up. The town used nine storey
 * heights and six door widths; new and rebuilt buildings take theirs from here.
 */
export const GRID=Object.freeze({
 unit:.91,bay:1.82,block:.30,
 storey:Object.freeze({shop:3.0,home:2.7}),slab:.15,parapet:.6,
 door:Object.freeze({home:[.91,2.0],shop:[1.82,2.1]}),shutterBay:2.73,
 window:Object.freeze({small:.91,wide:1.82,sill:.9,head:2.1}),
 eave:Object.freeze({hip:.6,canopy:.9,hood:.3}),
});
const colour=new THREE.Color();
const q=new THREE.Quaternion(),e=new THREE.Euler(),s=new THREE.Vector3(),p=new THREE.Vector3();

/** A transform from position, rotation (Euler XYZ, radians) and scale. */
export function trs(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1){
 return new THREE.Matrix4().compose(p.set(x,y,z),q.setFromEuler(e.set(rx,ry,rz)),s.set(sx,sy,sz));
}

/** A deterministic random source, so the town is the same town every visit. */
export function rng(seed=1){
 let a=seed>>>0;
 const next=()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 return {next,range:(lo,hi)=>lo+(hi-lo)*next(),int:(lo,hi)=>Math.floor(lo+(hi-lo+1)*next()),pick:list=>list[Math.floor(next()*list.length)]};
}

/** A sagging cable between two points: Sakura Crossing's sagCurve. */
export function sagCurve(a,b,sag,segments=12){
 const points=[];
 for(let i=0;i<=segments;i++){const t=i/segments,v=new THREE.Vector3().lerpVectors(a,b,t);v.y-=Math.sin(Math.PI*t)*sag;points.push(v);}
 return new THREE.CatmullRomCurve3(points);
}

export function createKit({shadows=false}={}){
 const buckets=new Map();
 const walkLevels=[],powerNodes=[],powerSpans=[];
 const geometryCache=new Map();
 /** Finishes with a picture on them, and how many metres one repeat of it covers. */
 const surfaces=new Map();
 /** Registers a textured finish: `name` then paints with `map`, projected in world space. */
 function surface(name,{map,normalMap,normalScale,roughnessMap,aoMap,metres=2,roughness=.95,side}={}){surfaces.set(name,{map,normalMap,normalScale,roughnessMap,aoMap,metres,roughness,side});}
 const shared=(key,make)=>{if(!geometryCache.has(key))geometryCache.set(key,make());return geometryCache.get(key);};
 let parts=0;

 /**
  * Adds a geometry, transformed by `matrix`, painted `hex`, with the given finish.
  * The geometry is copied, never kept, so shared primitives can be passed in freely.
  */
 let frame=null;
 /**
  * Builds in a local frame: `fn` places things as if the origin were at x,z and the
  * front of whatever it builds looked along +z, and they land turned by `ry`. Frames
  * nest, so a house can put a shisa on its own roof without knowing where it stands.
  */
 function at(x,z,ry,fn,y=0){
  const prev=frame,m=trs(x,y,z,0,ry);
  frame=prev?prev.clone().multiply(m):m;
  try{fn();}finally{frame=prev;}
 }
 function add(geometry,local,hex,finish='matte'){
  const matrix=frame?frame.clone().multiply(local):local;
  const g=(geometry.index?geometry.toNonIndexed():geometry.clone());
  for(const key of Object.keys(g.attributes))if(key!=='position'&&key!=='normal')g.deleteAttribute(key);
  if(!g.attributes.normal)g.computeVertexNormals();
  g.applyMatrix4(matrix);
  const textured=surfaces.get(finish);
  if(textured){
   // Projected from whichever axis the face looks along, so a long wall and a short
   // one carry the same size of stone rather than one stretched picture each.
   const pos=g.attributes.position,nor=g.attributes.normal,uv=new Float32Array(pos.count*2),k=1/textured.metres;
   for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),nx=Math.abs(nor.getX(i)),ny=Math.abs(nor.getY(i)),nz=Math.abs(nor.getZ(i));
    const [u,v]=ny>nx&&ny>nz?[x,z]:nx>nz?[z,y]:[x,y];
    uv[i*2]=u*k;uv[i*2+1]=v*k;
   }
   g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  }
  if(finish==='window'){g.computeBoundingBox();markPane(g,g.boundingBox);}
  colour.set(hex);
  const n=g.attributes.position.count,c=new Float32Array(n*3);
  for(let i=0;i<n;i++){c[i*3]=colour.r;c[i*3+1]=colour.g;c[i*3+2]=colour.b;}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));
  const cx=matrix.elements[12],cz=matrix.elements[14];
  const bucketCell=finish==='plaster'?CELL*2:CELL;
  const key=finish+'|'+Math.floor(cx/bucketCell)+'|'+Math.floor(cz/bucketCell);
  // For the z-fighting scan (tools/z-fighting.mjs): where in the source each merged piece was made.
  if(globalThis.__KIT_TRACE__)g.userData.where=new Error().stack.split('\n').slice(2).filter(l=>!/okinawa\/kit\.js/.test(l)).slice(0,2).map(l=>l.trim().replace(/^at .*?\(?(?:file:\/\/)?.*?johansson-town\//,'').replace(/\)$/,'')).join(' < ');
  if(!buckets.has(key))buckets.set(key,{finish,list:[]});
  buckets.get(key).list.push(g);parts++;
  return g;
 }
 const unitBox=shared('box',()=>new THREE.BoxGeometry(1,1,1));
 /** A box, w×h×d, centred at x,y,z, turned `ry` about its centre. */
 function box(w,h,d,x,y,z,hex,{ry=0,rx=0,rz=0,finish='matte'}={}){
  return add(unitBox,trs(x,y,z,rx,ry,rz,w,h,d),hex,finish);
 }
 /** A box between x0..x1, y0..y1, z0..z1. */
 function block(x0,x1,y0,y1,z0,z1,hex,finish='matte'){
  return box(x1-x0,y1-y0,z1-z0,(x0+x1)/2,(y0+y1)/2,(z0+z1)/2,hex,{finish});
 }
 function cyl(rTop,rBottom,h,x,y,z,hex,{segments=10,finish='matte',rx=0,ry=0,rz=0}={}){
  const g=shared(`cyl:${rTop}:${rBottom}:${segments}`,()=>new THREE.CylinderGeometry(rTop,rBottom,1,segments));
  return add(g,trs(x,y,z,rx,ry,rz,1,h,1),hex,finish);
 }
 /** A cylinder from point a to point b. */
 function rod(a,b,r,hex,{segments=6,finish='matte'}={}){
  const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),len=d.length();
  const g=shared(`rod:${r}:${segments}`,()=>new THREE.CylinderGeometry(r,r,1,segments));
  const m=new THREE.Matrix4().compose(av.clone().add(bv).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()),new THREE.Vector3(1,len,1));
  return add(g,m,hex,finish);
 }
 function sphere(r,x,y,z,hex,{sx=1,sy=1,sz=1,detail=1,finish='matte'}={}){
  const g=shared('ico:'+detail,()=>new THREE.IcosahedronGeometry(1,detail));
  return add(g,trs(x,y,z,0,0,0,r*sx,r*sy,r*sz),hex,finish);
 }
 /**
  * A hipped roof over a w×d plan: four slopes rising to a short ridge. Okinawan red
  * tile roofs are hipped and low, so this is most of the look.
  */
 function hipRoof(w,d,h,x,y,z,hex,{ry=0,overhang=.45,ridgeFrac=.35,finish='roof'}={}){
  const W=w/2+overhang,D=d/2+overhang,long=W>=D;
  const r=(long?W:D)*ridgeFrac;
  const top=long?[[-r,h,0],[r,h,0]]:[[0,h,-r],[0,h,r]];
  const a=[-W,0,-D],b=[W,0,-D],c=[W,0,D],dd=[-W,0,D],[t0,t1]=top;
  const tris=long?[a,b,t1, a,t1,t0, b,c,t1, c,dd,t0, c,t0,t1, dd,a,t0]:[a,b,t0, b,c,t1, b,t1,t0, c,dd,t1, dd,a,t0, dd,t0,t1];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(tris.flat(),3));
  g.computeVertexNormals();
  add(g,trs(x,y,z,0,ry),hex,finish);
  // The underside of the eaves, so the roof has a thickness from below.
  box(w+overhang*2,.08,d+overhang*2,x,y-.02,z,0x6b4a3a,{ry});
  g.dispose();
 }
 /** A gable roof, ridge along x. */
 function gableRoof(w,d,h,x,y,z,hex,{ry=0,overhang=.4}={}){
  const W=w/2+overhang,D=d/2+overhang;
  const v=[[-W,0,-D],[W,0,-D],[W,h,0],[-W,h,0],[-W,0,D],[W,0,D]];
  const idx=[0,2,1,0,3,2, 4,5,2,4,2,3, 0,4,3, 1,2,5];
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(idx.flatMap(i=>v[i]),3));
  g.computeVertexNormals();
  add(g,trs(x,y,z,0,ry),hex,'roof');g.dispose();
 }
 /** An extruded 2D outline (x,y points), `depth` deep along z, placed by matrix. */
 function extrude(points,depth,matrix,hex,finish='matte'){
  const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
  const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:1});
  add(g,matrix,hex,finish);g.dispose();
 }
 /**
  * A sagging wire between two points. The points are in the world, not the current
  * frame: they are pole anchors, which kit.point() has already carried across.
  */
 function wire(a,b,sag=.4,r=.02,hex=0x2b2a30){
  const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),dist=av.distanceTo(bv);
  const g=new THREE.TubeGeometry(sagCurve(av,bv,sag*Math.min(1.6,dist/14)),10,r,3,false);
  add(g,frame?frame.clone().invert():new THREE.Matrix4(),hex,'thin');g.dispose();
 }

 /** Where a local point lands in the world, under the current frame. */
 function point(x,y,z){const v=new THREE.Vector3(x,y,z);return frame?v.applyMatrix4(frame):v;}
 /**
  * A local rectangle as a world collider, the whole of it and no more, however the frame is turned: under a quarter turn
  * (or none) it is the axis-aligned rectangle it always was; under any other turn it keeps its own width and depth and
  * turns with the frame (the collider's `yaw`, as physics.js circleHitsRect reads it). (Two of its corners carried across
  * used to give an axis-aligned rectangle that shrank as the frame turned a little from square.)
  */
 function rect(x0,x1,z0,z1,height=3,id=''){
  const c=point((x0+x1)/2,0,(z0+z1)/2),w=Math.abs(x1-x0),d=Math.abs(z1-z0),y=c.y?{minY:c.y}:{};
  const e=frame?new THREE.Vector3(1,0,0).transformDirection(frame):null,yaw=e?Math.atan2(-e.z,e.x):0;
  const quarter=Math.round(yaw/(Math.PI/2));
  if(Math.abs(yaw-quarter*Math.PI/2)<1e-6){const across=quarter%2!==0;return {id,x:c.x,z:c.z,w:across?d:w,d:across?w:d,height,...y};}
  return {id,x:c.x,z:c.z,w,d,yaw,height,...y};
 }
 const signs=[];
 /** A painted board, w×h, facing local +z (after `ry`), made at finish time. */
 function sign(texture,w,h,x,y,z,{ry=0,depth=.05,edge=0x3a3630,name='sign',both=false}={}){
  signs.push({texture,w,h,depth,edge,name,both,matrix:(frame?frame.clone():new THREE.Matrix4()).multiply(trs(x,y,z,0,ry))});
 }
 /** Every bucket becomes one mesh under `parent`. Returns the meshes, keyed by finish. */
 function level(x0,x1,z0,z1,y,id){
  const a=point(x0,y,z0),b=point(x1,y,z1);
  walkLevels.push({id,minX:Math.min(a.x,b.x),maxX:Math.max(a.x,b.x),minZ:Math.min(a.z,b.z),maxZ:Math.max(a.z,b.z),y:a.y});
 }
 const powerNode=p=>powerNodes.push(p);
 const powerSpan=(a,b)=>powerSpans.push({from:a.id,to:b.id});
 function finish(parent,name='Okinawan quarter'){
  (parent.userData.walkLevels??=[]).push(...walkLevels);
  parent.userData.powerNetwork={nodes:powerNodes,spans:powerSpans};
  const meshes=[],materials={};
  for(const [key,{finish:kind,list}] of buckets){
   const sources=globalThis.__KIT_TRACE__?(()=>{let at=0;return list.map(g=>{const n=g.attributes.position.count;const r={start:at,count:n,where:g.userData.where};at+=n;return r;});})():null;
   const geometry=mergeGeometries(list,false);list.forEach(g=>g.dispose());
   if(!geometry)continue;
   geometry.computeBoundingSphere();
   const tex=surfaces.get(kind);
   const spec=tex?Object.fromEntries(Object.entries({map:tex.map,normalMap:tex.normalMap,normalScale:tex.normalScale,roughnessMap:tex.roughnessMap,aoMap:tex.aoMap,aoMapIntensity:.35,roughness:tex.roughness,side:tex.side}).filter(([,v])=>v!==undefined)):FINISHES[kind]||FINISHES.matte;
   const material=materials[kind]??=kind==='window'?sharedWindowMaterial():new THREE.MeshStandardMaterial({vertexColors:true,...spec});
   if(tex||['metal','gloss','roof'].includes(kind))material.userData.keepPhysical=true;
   // Window glass and lamps light up at dusk wherever they are built (town.js lightWindows).
   if(kind==='glow'||kind==='lamp')material.userData.kitFinish=kind;
   const mesh=new THREE.Mesh(geometry,material);
   mesh.name=`${name}:${key}`;if(sources)mesh.userData.kitSources=sources;
   mesh.castShadow=shadows&&kind!=='thin'&&kind!=='glow'&&kind!=='window';mesh.receiveShadow=kind!=='window';
   parent.add(mesh);meshes.push(mesh);
  }
  buckets.clear();
  const edges=new Map();
  for(const b of signs){
   const face=new THREE.MeshStandardMaterial({map:b.texture,roughness:.75});
   const edge=edges.get(b.edge)||new THREE.MeshStandardMaterial({color:b.edge,roughness:.8});edges.set(b.edge,edge);
   const mesh=new THREE.Mesh(new THREE.BoxGeometry(b.w,b.h,b.depth),[edge,edge,edge,edge,face,b.both?face:edge]);
   b.matrix.decompose(mesh.position,mesh.quaternion,mesh.scale);
   mesh.name=b.name;mesh.receiveShadow=true;mesh.castShadow=false;
   parent.add(mesh);meshes.push(mesh);materials['sign:'+meshes.length]=face;
  }
  signs.length=0;
  return {meshes,materials,parts};
 }
 return {at,point,rect,level,powerNode,powerSpan,sign,surface,add,box,block,cyl,rod,sphere,hipRoof,gableRoof,extrude,wire,finish,get parts(){return parts;}};
}

/** A canvas painted by `draw`, as a texture. Painted once: the canvas is released after upload (render/canvas-release.js). */
export function paint(width,height,draw){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 draw(canvas.getContext('2d'),width,height);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
 texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
 return releaseAfterUpload(texture,draw);
}

/** A flat painted board: a sign, a poster, a name plate. Faces +z before `ry`. */
export function board(parent,texture,w,h,x,y,z,{ry=0,depth=.06,frame=0x3a3630,shadows=false}={}){
 const face=new THREE.MeshStandardMaterial({map:texture,roughness:.75});
 const edge=new THREE.MeshStandardMaterial({color:frame,roughness:.8});
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),[edge,edge,edge,edge,face,edge]);
 mesh.position.set(x,y,z);mesh.rotation.y=ry;mesh.castShadow=shadows;mesh.receiveShadow=true;
 parent.add(mesh);return mesh;
}
