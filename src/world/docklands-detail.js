import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
/** Weathered freight equipment, all kept off the dispatch, workshop and crew paths. */
export function addDocklandsDetail(world,group,{register,onAction}={}){
 const geos=new Map(),put=(geo,c)=>{if(!geos.has(c))geos.set(c,[]);geos.get(c).push(geo);};
 const box=(s,p,c)=>{const g=new THREE.BoxGeometry(...s);g.translate(...p);put(g,c);};
 const cylinder=(r,h,p,c)=>{const g=new THREE.CylinderGeometry(r,r,h,12);g.translate(...p);put(g,c);};
 const solid=(id,x,z,w,d,height)=>world.colliders.push({id,x,z,w,d,height});
 // Drainage channels and tire scuffs lie flush with the concrete.
 for(const z of [-41.2,-43.2,-45.2])for(let i=0;i<10;i++)box([.025,.008,.32],[-28.7+i*.045,.012,z],0x4b5351);
 for(let i=0;i<5;i++)box([.035,.003,1.5],[-21.7+i*.14,.014,-45.2],0x62675e);
 // A mug, radio and manifest tray make the existing dispatch desk a workplace.
 box([.40,.035,.29],[-29.65,.94,-34.5],0xe8dfc2);box([.38,.012,.27],[-29.65,.967,-34.5],0xd3c7a3);
 box([.3,.18,.16],[-30.45,1.00,-34.5],0x3d4a44);cylinder(.045,.09,[-30.12,.98,-34.3],0xe8e4ce);
 for(const [c,list] of geos){const m=new THREE.Mesh(mergeGeometries(list,false),new THREE.MeshStandardMaterial({color:c,roughness:.94}));m.name='Weathered dock finish';m.receiveShadow=true;group.add(m);list.forEach(g=>g.dispose());}
 const a=new THREE.Object3D();a.position.set(-30.7,1,-40.9);group.add(a);register?.(a,'Inspect the cargo staging bay',()=>onAction?.('inspect','West quay cargo staging','The containers carry rice, shop stock, letters and electrical spares. Empty drums wait against the workshop wall for the hoist to swing them back aboard. The harbour master checks the load and keeps the manifest and the evening dispatch copies.'));
}
