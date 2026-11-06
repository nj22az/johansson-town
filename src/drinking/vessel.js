import * as THREE from '../../vendor/three.module.js';
import {solveFill,clippedBandGeometry} from './liquid.js';
import {innerRadiusAtY} from './profiles.js';

const UP=new THREE.Vector3(0,1,0);

function dynamicMesh(material,name,order){
 const geometry=new THREE.BufferGeometry(),count=4096;
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage));
 geometry.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(count*3),3).setUsage(THREE.DynamicDrawUsage));
 geometry.setDrawRange(0,0);
 const mesh=new THREE.Mesh(geometry,material);mesh.name=name;mesh.renderOrder=order;
 mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;return mesh;
}

function setTriangles(mesh,positions){
 const g=mesh.geometry,p=g.getAttribute('position'),n=g.getAttribute('normal');
 if(positions.length>p.array.length)throw new RangeError('Liquid mesh exceeded its allocated triangle budget.');
 p.array.set(positions);g.setDrawRange(0,positions.length/3);
 // Flat normals are exact for the clipped planes and shared by the 48-sided wall.
 // No allocations or traversal of the unused buffer on a liquid update.
 for(let i=0;i<positions.length;i+=9){
  const ax=positions[i+3]-positions[i],ay=positions[i+4]-positions[i+1],az=positions[i+5]-positions[i+2];
  const bx=positions[i+6]-positions[i],by=positions[i+7]-positions[i+1],bz=positions[i+8]-positions[i+2];
  const x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx,len=Math.hypot(x,y,z)||1;
  for(let j=0;j<3;j++){n.array[i+j*3]=x/len;n.array[i+j*3+1]=y/len;n.array[i+j*3+2]=z/len;}
 }
 p.clearUpdateRanges();n.clearUpdateRanges();p.addUpdateRange(0,positions.length);n.addUpdateRange(0,positions.length);
 p.needsUpdate=true;n.needsUpdate=true;mesh.visible=positions.length>0;
}

/** Reusable liquid visual for a simulator vessel or one of the game's serving props. */
export function createLiquid(profile){
 const root=new THREE.Group();root.name=profile.id+' liquid';
 const color=profile.liquidColor??0xc77915,opacity=profile.liquidOpacity??.87;
 // (a liquid as good as opaque, beer, writes depth and is not drawn transparent: with depthWrite off, chopsticks behind
 // the jug were drawn over the beer and the ink drew the chin and collar through it: the judges of the counter frames)
 const solid=opacity>=.98;
 const body=dynamicMesh(new THREE.MeshPhysicalMaterial({color,roughness:.2,metalness:0,transparent:!solid,opacity:solid?1:opacity,depthWrite:solid,side:THREE.FrontSide}), 'Enclosed liquid',10);
 const cap=dynamicMesh(new THREE.MeshStandardMaterial({color:new THREE.Color(color).lerp(new THREE.Color(0xffffff),.035),roughness:.24,metalness:.02,transparent:!solid,opacity:solid?1:Math.min(1,opacity+.13),depthWrite:solid,side:THREE.DoubleSide}), 'Horizontal free surface',11);
 root.add(body,cap);
 let foam=null,ice=null;
 if(profile.hasFoam){
  foam=dynamicMesh(new THREE.MeshStandardMaterial({color:0xfff8ec,roughness:.9,metalness:0}), 'Foam on liquid surface',13);root.add(foam);
 }
 const iceRadius=.013,iceSize=.014;
 if(profile.hasIce){
  ice=new THREE.Group();ice.name='Three retained ice cubes';root.add(ice);
  const geometry=new THREE.BoxGeometry(iceSize,iceSize,iceSize),material=new THREE.MeshPhysicalMaterial({color:0xc4e7e2,roughness:.17,metalness:0,transparent:true,opacity:.48,depthWrite:false});
  for(let i=0;i<3;i++){
   const cube=new THREE.Mesh(geometry,material);cube.rotation.set(.14+i*.17,.19+i*.29,.11-i*.2);cube.name='Ice '+(i+1);cube.renderOrder=20;ice.add(cube);
  }
 }
 const lastNormal=new THREE.Vector3(Infinity,Infinity,Infinity);let lastVolume=-1;
 const api={root,body,cap,foam,ice,solution:null,
  update(volumeMl,normalLocal=UP){
   const n=normalLocal.clone().normalize(),volume=Math.max(0,Math.min(profile.capacityMl,Number(volumeMl)||0));
   if(api.solution&&Math.abs(volume-lastVolume)<1e-8&&n.distanceToSquared(lastNormal)<1e-16)return api.solution;
   const s=solveFill(profile,volume,n);api.solution=s;lastNormal.copy(n);lastVolume=volume;
   setTriangles(body,volume>1e-6?s.sidePositions:[]);setTriangles(cap,volume>1e-6?s.capPositions:[]);
   if(foam){
    const thickness=(profile.foamHeight??.006)*Math.min(1,volume/30);
    setTriangles(foam,volume>.05?clippedBandGeometry(profile,n,s.offset+.00005,s.offset+thickness):[]);
   }
   if(ice){
    // Bounded deterministic secondary placement, so seeking/pause/reset produce
    // identical pictures. Ice settles onto the base as the drink empties; it is
    // never removed with the liquid. A bounding sphere keeps every rotated corner
    // inside the glass, including the final near-horizontal mouthful.
    for(let i=0;i<ice.children.length;i++){
     const cube=ice.children[i],z=(i-1)*.006,base=profile.interiorBottom+iceRadius,low=base+i*.024,high=profile.interiorTop-iceRadius-(2-i)*.024;
     const tangent=innerRadiusAtY(profile,low)-iceRadius-.0004;
     const x=-Math.sin(Math.acos(Math.max(-1,Math.min(1,n.y))))*tangent*(.7-i*.12);
     let y=n.y>.08?(s.offset-n.x*x-n.z*z-.004)/n.y-(2-i)*.024:low;
     y=Math.max(low,Math.min(high,y));
     const limit=Math.max(0,innerRadiusAtY(profile,y)-iceRadius-.0004),rad=Math.hypot(x,z),scale=rad>limit?limit/rad:1;
     cube.position.set(x*scale,y,z*scale);
    }
   }
   return s;
  },
  dispose(){disposeTree(root);root.removeFromParent();},
 };
 api.update(profile.startingVolumeMl??profile.capacityMl);return api;
}

function disposeTree(root){
 const geometries=new Set(),materials=new Set();
 root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}

/** One authoritative transform at the external glass base; every marker is local. */
export function createVessel(profile){
 const root=new THREE.Group();root.name=profile.name+' vessel';
 const b=profile.baseThickness,h=profile.height,rb=profile.outerRadiusBottom,rt=profile.outerRadiusTop,t=profile.wallThickness;
 const points=[
  new THREE.Vector2(0,0),new THREE.Vector2(rb*.95,0),new THREE.Vector2(rb,.003),
  new THREE.Vector2(rt,h-t*.45),new THREE.Vector2(rt-t*.18,h-.0002),
  new THREE.Vector2(rt-t*.58,h),new THREE.Vector2(rt-t,h-.0002),
  new THREE.Vector2(profile.innerRadiusBottom+.00025,b),new THREE.Vector2(0,b),
 ];
 const glassGeometry=new THREE.LatheGeometry(points,profile.segments);
 // The lathe already contains outward and inward wall faces. Rendering both
 // sides of both walls would quadruple opacity and make clear glass look milky.
 const glassMaterial=new THREE.MeshPhysicalMaterial({color:0xe0efe9,roughness:.13,metalness:0,transparent:true,opacity:.12,depthWrite:false,side:THREE.FrontSide,reflectivity:.65});
 const glass=new THREE.Mesh(glassGeometry,glassMaterial);glass.name='Thick glass wall and base';glass.renderOrder=30;root.add(glass);
 const highlight=new THREE.MeshStandardMaterial({color:0xdcece7,roughness:.24,metalness:.14,transparent:true,opacity:.64,depthWrite:false});
 const rim=new THREE.Mesh(new THREE.TorusGeometry(rt-t*.5,t*.42,8,profile.segments),highlight);rim.rotation.x=Math.PI/2;rim.position.y=h-.0003;rim.name='Rounded drinking rim';rim.renderOrder=32;root.add(rim);
 const baseRing=new THREE.Mesh(new THREE.TorusGeometry(rb-t*.5,t*.38,8,profile.segments),highlight);baseRing.rotation.x=Math.PI/2;baseRing.position.y=.002;baseRing.name='Glass base edge';baseRing.renderOrder=32;root.add(baseRing);
 const markers={base:new THREE.Object3D(),rim:new THREE.Object3D(),flowRim:new THREE.Object3D(),grip:new THREE.Object3D()};
 markers.base.name='Placement marker';markers.rim.name='Lip contact marker';markers.flowRim.name='Inner liquid edge';markers.grip.name='Wrist grip marker';
 markers.rim.position.fromArray(profile.rimContact);markers.flowRim.position.fromArray(profile.liquidRimContact);
 markers.grip.position.fromArray(profile.grip.position);markers.grip.quaternion.fromArray(profile.grip.quaternion);
 for(const marker of Object.values(markers))root.add(marker);
 const liquid=createLiquid(profile);root.add(liquid.root);
 const inverse=new THREE.Quaternion(),normal=new THREE.Vector3();
 return {root,markers,liquid,glass,profile,
  update(volumeMl,dt=0){
   root.updateWorldMatrix(true,false);root.getWorldQuaternion(inverse).invert();normal.copy(UP).applyQuaternion(inverse);
   return liquid.update(volumeMl,normal);
  },
  dispose(){disposeTree(root);root.removeFromParent();},
 };
}
