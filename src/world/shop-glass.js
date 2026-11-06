import * as THREE from '../../vendor/three.module.js';

// Neutral, inexpensive glazing for the mobile renderer. Do not tint the panes
// with the shop's sign colour, or let a transparent pane occlude the room.
export function createShopGlass({haze=.055}={}){
 return new THREE.MeshBasicMaterial({name:'Clear shop glass',color:0xffffff,
  transparent:true,opacity:haze,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});
}

// Measured inner panes in minato-benmaher-exterior.glb (SHA-256 82093918…):
// four storefront triangles and six octagonal door-window triangles. The door
// surround, neon signs, masonry, wires and cloth keep their original materials.
export const IZAKAYA_GLASS_RANGES=Object.freeze([
 Object.freeze({first:266,count:4}),Object.freeze({first:2175,count:6}),
]);

export function prepareIzakayaGlass(scene){
 let building;
 scene.traverse(o=>{if(o.isMesh&&o.material?.name==='BenMaher building PBR')building=o;});
 if(!building)return 0;
 if(building.userData.clearWindowsPrepared)return 10;
 const original=building.geometry,index=original.index,p=original.attributes.position;
 // Fail closed for a changed asset rather than accidentally clearing its walls.
 if(index?.count!==7071||!p)return 0;
 const panes=new Set();
 for(const {first,count} of IZAKAYA_GLASS_RANGES)for(let face=first;face<first+count;face++){
  for(let j=0;j<3;j++){
   const v=index.getX(face*3+j),x=p.getX(v),y=p.getY(v),z=p.getZ(v);
   const valid=first===266?x>=-3.24&&x<=-1.17&&y>=.37&&y<=2.30&&z>=2.93&&z<=4.24:
    Math.abs(x)<.255&&y>1.40&&y<1.92&&z>4.04&&z<4.06;
   if(!valid)return 0;
  }
  panes.add(face);
 }
 const opaque=[],clear=[];
 for(let i=0;i<index.count;i+=3){const out=panes.has(i/3)?clear:opaque;out.push(index.getX(i),index.getX(i+1),index.getX(i+2));}
 const wallGeometry=original.clone();wallGeometry.setIndex(opaque);wallGeometry.clearGroups();
 const paneGeometry=original.clone();paneGeometry.setIndex(clear);paneGeometry.clearGroups();
 paneGeometry.computeBoundingBox();paneGeometry.computeBoundingSphere();
 building.geometry=wallGeometry;building.userData.clearWindowsPrepared=true;
 const windows=new THREE.Mesh(paneGeometry,createShopGlass());
 windows.name='Minato clear window panes';windows.userData.clearWindow=true;
 windows.position.copy(building.position);windows.quaternion.copy(building.quaternion);windows.scale.copy(building.scale);
 windows.castShadow=false;windows.receiveShadow=false;building.parent.add(windows);
 return clear.length/3;
}
