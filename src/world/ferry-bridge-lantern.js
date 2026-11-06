import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../assets.js';
import {BRIDGE_LANTERN_PLAN as PLAN} from './ferry-bridge-lantern-plan.js';

// The ship's ESB 105 V insulated AC branch, not a separate battery circuit.
// Both conductors return to the panel. Neither is a hull return or DC negative.
export function buildBridgeNavigationFeeder(parent){
 const group=new THREE.Group();group.name='Navigation lantern supply';parent.add(group);
 const fallback=new THREE.Group();fallback.name='Navigation feeder fallback';group.add(fallback);
 const parts=[],up=new THREE.Vector3(0,1,0);
 for(const q of PLAN.parts){
  let g,p=q.p;
  if(q.kind==='box')g=new THREE.BoxGeometry(...q.d);
  else if(q.kind==='bar'){
   const a=new THREE.Vector3(...q.a),b=new THREE.Vector3(...q.b),v=b.clone().sub(a);
   g=new THREE.CylinderGeometry(q.r,q.r,v.length(),12);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,v.normalize()));p=a.add(b).multiplyScalar(.5).toArray();
  }else{
   g=new THREE.CylinderGeometry(q.r,q.r,q.h,12);if(q.axis==='x')g.rotateZ(-Math.PI/2);if(q.axis==='z')g.rotateX(Math.PI/2);
  }
  g=g.toNonIndexed();g.translate(...p);g.deleteAttribute('uv');const c=new THREE.Color(q.color),a=new Float32Array(g.attributes.position.count*3);
  for(let i=0;i<a.length;i+=3){a[i]=c.r;a[i+1]=c.g;a[i+2]=c.b;}g.setAttribute('color',new THREE.BufferAttribute(a,3));parts.push(g);
 }
 const opaque=new THREE.Mesh(mergeGeometries(parts,false),new THREE.MeshStandardMaterial({vertexColors:true,roughness:.67}));opaque.name='Navigation panel, protection and actual two-core cable';fallback.add(opaque);for(const g of parts)g.dispose();
 const l=PLAN.lamp,lamp=new THREE.Mesh(new THREE.CylinderGeometry(l.r,l.r,l.h,16),new THREE.MeshBasicMaterial({color:0x333333}));lamp.position.set(...l.p);lamp.name=l.name;lamp.userData.on=l.on;fallback.add(lamp);
 // One double-pole switch per lamp. The navigation command drives these and the
 // existing exterior lamps together; no separate pedagogic lamp can remain lit.
 const toggles=[];for(let i=0;i<4;i++){
  const pivot=new THREE.Group();pivot.position.set(-2.425+i*.27,1.205,-.64);pivot.name='Navigation double-pole switch '+i;group.add(pivot);
  const lever=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.055,8),new THREE.MeshStandardMaterial({color:0x303a3b}));lever.rotation.x=Math.PI/2;lever.position.z=-.025;pivot.add(lever);toggles.push(pivot);
 }
 let on=false,nativeLamp=null;
 const setLights=(value,command=value)=>{on=!!value;lamp.material.color.setHex(on?l.on:0x333333);if(nativeLamp)nativeLamp.material.color.setHex(on?l.on:0x333333);for(const t of toggles)t.rotation.x=command?-.45:.45;};
 const state={group,lamp,loaded:false,pending:null,error:null,plan:PLAN,setLights,ensure(){
  return this.pending??=import('../../vendor/GLTFLoader.js').then(async({GLTFLoader})=>{
   const gltf=await new GLTFLoader().loadAsync(assetURL('models/ferry-bridge/navigation-feeder-v2.glb'));
   const bounds=new THREE.Box3().setFromObject(gltf.scene);if(bounds.isEmpty()||!bounds.min.toArray().concat(bounds.max.toArray()).every(Number.isFinite))throw Error('Invalid navigation feeder asset');
   let meshes=0,triangles=0;gltf.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;o.castShadow=o.receiveShadow=true;if(o.name==='Starboard_sidelight'||o.name==='Starboard sidelight')nativeLamp=o;}});
   if(meshes!==2||triangles>12000||!nativeLamp)throw Error('Unexpected navigation feeder asset');
   nativeLamp.material.dispose();nativeLamp.material=new THREE.MeshBasicMaterial({color:on?l.on:0x333333});
   gltf.scene.name='Minato Maru / actual navigation feeder';group.add(gltf.scene);group.remove(fallback);
   const geometries=new Set(),materials=new Set();fallback.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of [].concat(o.material||[]))materials.add(m);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();fallback.clear();
   this.loaded=true;this.meshes=meshes;this.triangles=triangles;return true;
  }).catch(error=>{this.error=String(error?.message||error);return false;});
 }};
 const eye=new THREE.Vector3(),centre=new THREE.Vector3(-2.6,1.1,-.4);opaque.onBeforeRender=(_renderer,_scene,camera)=>{if(state.pending)return;camera.getWorldPosition(eye);group.worldToLocal(eye);if(eye.y>-.5&&eye.y<3.5&&eye.distanceToSquared(centre)<144)state.ensure();};
 if(typeof document!=='undefined'){
  const c=document.createElement('canvas');c.width=1024;c.height=256;const x=c.getContext('2d');x.fillStyle='#d8d2c0';x.fillRect(0,0,c.width,c.height);x.fillStyle='#25373b';x.textAlign='center';x.font='bold 40px sans-serif';x.fillText('NAVIGATION LIGHTS · 105 V AC',512,45);x.font='bold 26px sans-serif';['STERN','MASTHEAD','PORT','STBD'].forEach((s,i)=>x.fillText(s,88+i*263.3,130));
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.25),new THREE.MeshBasicMaterial({map:texture}));label.position.set(-2.05,1.16,-.619);label.rotation.y=Math.PI;label.name='Navigation light panel markings';group.add(label);
 }
 setLights(false);group.userData.navigationFeeder=state;return state;
}
