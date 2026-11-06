import {createShopProduct} from '../commerce/shop-product.js';
import * as THREE from '../../vendor/three.module.js';
import {createSteamedBunGeometry} from '../world/interiors/steamed-bun.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';

// Small, solid-colour props at metre scale. One draw per item, including beer foam
// and handles; no transparent sorting or new downloads on mobile.
export function createResidentProp(kind){
 if(kind.startsWith('shop-'))return createShopProduct(kind.slice(5));
 const parts=[];
 function part(geometry,color,position=[0,0,0],rotation=[0,0,0]){
  geometry.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(...position),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(1,1,1)));
  const c=new THREE.Color(color),rgb=new Float32Array(geometry.attributes.position.count*3);for(let i=0;i<rgb.length;i+=3)rgb.set([c.r,c.g,c.b],i);
  geometry.setAttribute('color',new THREE.BufferAttribute(rgb,3));parts.push(geometry);
 }
 const box=(size,pos,color)=>part(new THREE.BoxGeometry(...size),color,pos);
 const cylinder=(top,bottom,h,pos,color)=>part(new THREE.CylinderGeometry(top,bottom,h,12),color,pos);
 if(kind==='carton'){
  box([.32,.22,.25],[0,.11,0],0xb98d57);box([.06,.224,.255],[0,.11,0],0xdac59b);
 }else if(['beer','tea','cup','can'].includes(kind)){
  const beer=kind==='beer',can=kind==='can',h=beer?.145:.10,r=beer?.047:.037;
  cylinder(r,r*.90,h,[0,h/2,0],beer?0xc88b2c:can?0x769e89:0x9db18a);
  cylinder(r*.99,r*.99,.009,[0,h-.004,0],beer?0xf6edcd:can?0xb7bdb6:0x667b42);
  if(beer)part(new THREE.TorusGeometry(.037,.010,5,10),0xc7c3a9,[.055,h*.54,0]);
 }else if(kind==='bun')parts.push(createSteamedBunGeometry());
 else if(kind==='chopsticks'){for(const x of [-.008,.008])box([.005,.005,.18],[x,.025,.065],0xc5a16a);}
 else if(kind==='rice'){
  part(new THREE.ConeGeometry(.070,.125,3),0xf3e8d1,[0,.067,0],[0,Math.PI/2,0]);box([.043,.055,.095],[0,.032,0],0x2c4538);
 }else if(['ramen','fish','yakitori'].includes(kind)){
  cylinder(.091,.050,.065,[0,.033,0],0xd9d3be);cylinder(.078,.076,.01,[0,.064,0],kind==='ramen'?0x997644:0x9c774e);
  if(kind==='ramen')for(let i=0;i<4;i++)part(new THREE.TorusGeometry(.028+i*.009,.003,4,12),0xe4cc8d,[0,.074,0],[Math.PI/2,0,0]);
  else if(kind==='fish')box([.12,.025,.05],[0,.075,0],0x858f84);
  else for(const z of [-.026,.026]){box([.13,.008,.008],[0,.073,z],0xc9ac77);for(const x of [-.035,0,.035])box([.027,.026,.029],[x,.080,z],0xa16b3e);}
 }else if(['book','paper'].includes(kind)){
  box([.17,.022,.13],[0,.011,0],kind==='book'?0x785660:0xe2d9bb);box([.156,.014,.115],[.006,.015,.004],0xf0e3c2);
  for(const z of [-.035,0,.035])box([.105,.001,.003],[0,.023,z],0x6d6f66);
 }else if(kind==='phone'){
  box([.033,.15,.035],[0,.05,0],0x323c3b);for(const y of [-.022,.122])box([.055,.035,.06],[0,y,.012],0x323c3b);
 }else if(kind==='rod'){
  part(new THREE.CylinderGeometry(.004,.011,1.5,6),0x785d3b,[0,.64,0],[.65,0,0]);
  cylinder(.024,.024,.030,[0,0,.027],0x6c7b77);
 }
 if(!parts.length)box([.05,.07,.04],[0,.035,0],0x9d8360);
 const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.72,flatShading:true}));mesh.name='resident-prop-'+kind;return mesh;
}
