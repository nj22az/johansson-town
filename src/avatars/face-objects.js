import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {faceLayout} from './face.js';
import {shapeHeadPoint} from './head-profile.js';

/** The same angular projection as the head texture, lifted along its surface. */
export function faceObjectPoint(m,x,y,lift=0){
 const theta=Math.PI*.28+y/256*Math.PI*.58,phi=Math.PI/2-.95+x/256*1.9;
 const v=shapeHeadPoint(new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),m.profile);
 const p=new THREE.Vector3(v.x*m.Rh*m.headSX,v.y*m.Rh*m.headSY,v.z*m.Rh*.98);
 p.addScaledVector(p.clone().normalize(),lift*m.Rh);p.y+=m.headCentre-m.headY;return p;
}

/** Separate head-bound meshes; no accessory is baked into the face texture. */
export function buildFaceObjects(recipe,m,{shadows=false}={}){
 const group=new THREE.Group();group.name='Face objects';const L=faceLayout(recipe);
 const at=(x,y,lift=.045)=>faceObjectPoint(m,x,y,lift);
 function mesh(name,parts,material){
  if(!parts.length){material.dispose();return;}
  const geometry=mergeGeometries(parts,false);parts.forEach(g=>g.dispose());
  const object=new THREE.Mesh(geometry,material);object.name=name;object.castShadow=shadows;object.receiveShadow=true;group.add(object);return object;
 }
 function tube(parts,points,radius,closed=false){
  const curve=new THREE.CatmullRomCurve3(points,closed,'centripetal');
  parts.push(new THREE.TubeGeometry(curve,Math.max(12,points.length*2),radius*m.Rh,6,closed));
 }
 function tuft(parts,x,y,rx,ry,depth,lift=.035){
  const p=at(x,y,lift),normal=p.clone();normal.y-=m.headCentre-m.headY;normal.normalize();
  const g=new THREE.SphereGeometry(1,10,6);g.scale(rx*m.Rh,ry*m.Rh,depth*m.Rh);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1),normal));g.translate(p.x,p.y,p.z);parts.push(g);
 }
 const glasses=recipe.glasses;
 if(glasses.enabled&&glasses.style!=='none'){
  const frames=[],lenses=[],glints=[],r=16*L.eyeS*L.glassS,rx=r*L.eyeW,y=L.glassY;
  for(const side of [-1,1]){
   const x=128+side*L.spread,round=glasses.style==='round'||glasses.style==='half',half=glasses.style==='half';
   const ring=[];
   for(let i=0;i<32;i++){
    const a=i/32*Math.PI*2;
    if(round)ring.push([x+Math.cos(a)*rx,y+Math.sin(a)*r]);
    else{const c=Math.cos(a),s=Math.sin(a);ring.push([x+Math.sign(c)*Math.pow(Math.abs(c),.35)*rx*1.1,y+Math.sign(s)*Math.pow(Math.abs(s),.35)*r*.76]);}
   }
   tube(frames,(half?ring.filter((_,i)=>i<=16):ring).map(([a,b])=>at(a,b,.065)),half?.012:.019,!half);
   // Thin curved lens surfaces follow the same contour, with their own material.
   const pos=[],centre=at(x,y,.07);
   for(let i=0;i<ring.length;i++){const a=at(...ring[i],.07),b=at(...ring[(i+1)%ring.length],.07);pos.push(centre.x,centre.y,centre.z,a.x,a.y,a.z,b.x,b.y,b.z);}
   const lens=new THREE.BufferGeometry();lens.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));lens.computeVertexNormals();lenses.push(lens);
   // A glint on the glass (the creator's review, 2026-10-14: the lenses should catch the light): a short diagonal stroke
   // high on each lens, and a dot beside it, lit the same in every room.
   tube(glints,[at(x-rx*.5,y-r*.05,.08),at(x-rx*.12,y-r*.5,.08)],.007,false);tube(glints,[at(x-rx*.02,y-r*.6,.08),at(x+rx*.06,y-r*.68,.08)],.007,false);
   const outer=at(x+side*rx*(round?1:1.1),y,.065);
   tube(frames,[outer,outer.clone().add(new THREE.Vector3(side*m.Rh*.065,0,-m.Rh*.12)),new THREE.Vector3(side*m.Rh*m.headSX*1.01,m.headCentre-m.headY+(outer.y-(m.headCentre-m.headY))*.7,-m.Rh*.08)],.017);
  }
  tube(frames,[at(128-L.spread+rx,y-2,.065),at(128,y-8,.19),at(128+L.spread-rx,y-2,.065)],.017);
  mesh('Glasses frames and temples',frames,new THREE.MeshStandardMaterial({color:glasses.colour,roughness:.32,metalness:.2}));
  mesh('Glasses glints',glints,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.8,depthWrite:false}));
  mesh('Glasses lenses',lenses,new THREE.MeshStandardMaterial({color:glasses.style==='sun'?'#263442':'#dbeaf2',transparent:true,opacity:glasses.style==='sun'?.92:.12,roughness:.15,metalness:0,depthWrite:false,side:THREE.DoubleSide}));
 }
 const f=recipe.facial,k=L.facialS,dy=L.facialDY,wk=.6+(f.width??.5)*.8;   // the moustache stretches with facial.width
 const hairMaterial=()=>new THREE.MeshStandardMaterial({color:f.colour,roughness:.92});
 const moustache=[],beard=[],fy=(L.noseY+L.mouthY)/2+3+dy;
 if(f.moustache==='moustache'||f.moustache==='walrus'){
  for(const side of [-1,1])tuft(moustache,128+side*10*k*wk,fy+(f.moustache==='walrus'?2:0),.085*k,(f.moustache==='walrus'?.05:.028)*k,.045*k);
 }else if(f.moustache==='pencil'){
  tube(moustache,Array.from({length:9},(_,i)=>at(128+(i-4)*4*k*wk,fy-2+Math.abs(i-4)*.5,.035)),.012*k);
 }else if(f.moustache==='handlebar'){
  for(const side of [-1,1])tube(moustache,[[0,0],[10,-2],[20,3],[28,0],[27,-7],[23,-6]].map(([x,y])=>at(128+side*x*k*wk,fy+y*k,.05)),.025*k);
 }
 if(f.beard==='goatee'){
  tuft(beard,128,L.mouthY+20*k+dy,.058*k,.085*k,.05*k);
 }else if(f.beard==='beard'||f.beard==='chinstrap'){
  // A jaw-shaped band leaves the lips open, rather than covering the mouth.
  const path=Array.from({length:21},(_,i)=>{const a=i/20*Math.PI;return [128+Math.cos(a)*42*k,L.noseY+8+Math.sin(a)*(L.mouthY-L.noseY+31)*k+dy];});
  tube(beard,path.map(([x,y])=>at(x,y,.035)),(f.beard==='beard'?.095:.032)*k);
  if(f.beard==='beard')for(let i=1;i<path.length-1;i+=2){const [x,y]=path[i];tuft(beard,x,y,.072*k,.09*k,.055*k);}
 }else if(f.beard==='stubble'){
  // Deterministic short raised bristles, distributed below the nose and around the lips.
  for(let i=0;i<120;i++){const x=128+((i*37)%101-50)*.85*k,y=L.noseY+10+((i*53)%71)*.7*k+dy;
   if(Math.abs(x-L.mouthX)<26*L.mouthW&&Math.abs(y-L.mouthY)<14)continue;
   const a=at(x,y,.013),b=at(x+.4,y-1.6,.022);const g=new THREE.CylinderGeometry(.0035*k*m.Rh,.0035*k*m.Rh,a.distanceTo(b),4,1);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize()));g.translate((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);beard.push(g);
  }
 }
 mesh('Sculpted moustache',moustache,hairMaterial());mesh('Sculpted beard',beard,hairMaterial());
 group.userData.dispose=()=>{group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});};
 return group;
}
