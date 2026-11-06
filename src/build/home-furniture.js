import * as THREE from '../../vendor/three.module.js';

/**
 * Furniture for decorating Johansson's own rooms (the mayor's home in the east wing): tatami, a low table, the futon.
 * Every piece is something a man living alone in a small Okinawan room in 1997 would plausibly own, says what it is
 * for, and is built at real size from the same plain boxes as the room around it (furniture-standards.js heights).
 *
 * `flat` pieces (a rug) are walked over: no collider, and they may lie under other furniture.
 */
const mat=new Map();
const material=(colour,options={})=>{const k=colour+JSON.stringify(options);if(!mat.has(k))mat.set(k,new THREE.MeshStandardMaterial({color:colour,roughness:.85,...options}));return mat.get(k);};
const geo=new Map();
const boxGeometry=size=>{const k=size.join(',');if(!geo.has(k))geo.set(k,new THREE.BoxGeometry(...size));return geo.get(k);};
function part(group,size,pos,colour,name,options){const m=new THREE.Mesh(boxGeometry(size),material(colour,options));m.position.set(...pos);m.name=name;m.castShadow=m.receiveShadow=true;group.add(m);return m;}
function cylinder(group,r,h,pos,colour,name,options){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,16),material(colour,options));m.position.set(...pos);m.name=name;m.castShadow=m.receiveShadow=true;group.add(m);return m;}

export const HOME_FURNITURE=Object.freeze([
 {id:'side-table',name:'Side table',size:[.55,.55,.45],purpose:'A cup of tea and the evening paper within reach of the cushion.',
  build(g){part(g,[.55,.04,.55],[0,.43,0],0xc9b99b,'Side table top');for(const x of [-.22,.22])for(const z of [-.22,.22])part(g,[.05,.41,.05],[x,.205,z],0xc9b99b,'Side table leg');}},
 {id:'tansu',name:'Tansu chest',size:[.9,.45,1.05],purpose:'Clothes and papers in a chest of drawers, the way island homes kept them.',
  build(g){part(g,[.9,1.05,.45],[0,.525,0],0x6e4a2e,'Tansu');for(let i=0;i<4;i++){part(g,[.82,.2,.01],[0,.16+i*.245,-.23],0x7d5636,'Tansu drawer');part(g,[.12,.025,.02],[0,.18+i*.245,-.245],0x2d2a26,'Tansu handle',{metalness:.5,roughness:.4});}}},
 {id:'low-bookcase',name:'Low bookcase',size:[.9,.3,.8],purpose:'Paperbacks and sea charts at reading height from the floor.',
  build(g){part(g,[.9,.8,.3],[0,.4,0],0x8a6a4a,'Low bookcase');part(g,[.84,.02,.26],[0,.4,-.01],0x7a5c3e,'Bookcase shelf');
   for(let i=0;i<7;i++)part(g,[.07,.28,.2],[-.34+i*.1,.56,-.02],[0x2f4f6f,0xc9a64a,0x6f2f2f,0x3f6a4a][i%4],'Book');}},
 {id:'andon',name:'Andon lamp',size:[.32,.32,.78],purpose:'Soft paper light on the floor for evenings without the ceiling lamp.',
  build(g){part(g,[.32,.04,.32],[0,.02,0],0x3b2a1d,'Andon base');for(const x of [-.14,.14])for(const z of [-.14,.14])part(g,[.025,.72,.025],[x,.4,z],0x3b2a1d,'Andon post');
   part(g,[.27,.6,.27],[0,.42,0],0xf6ead0,'Andon paper',{emissive:0xffcf8a,emissiveIntensity:.55});part(g,[.32,.03,.32],[0,.765,0],0x3b2a1d,'Andon top');}},
 {id:'plant',name:'Potted palm',size:[.6,.6,.9],purpose:'Something green and alive in the room; an areca palm likes the island light.',
  build(g){cylinder(g,.17,.3,[0,.15,0],0xa65a3c,'Plant pot');cylinder(g,.15,.02,[0,.3,0],0x3d2b1e,'Soil');
   for(let i=0;i<7;i++){const a=i/7*Math.PI*2,leaf=part(g,[.07,.55,.02],[Math.cos(a)*.11,.62,Math.sin(a)*.11],0x4f7d3e,'Palm frond');leaf.rotation.set(Math.sin(a)*.5,-a,Math.cos(a)*.5);}}},
 {id:'cushion',name:'Floor cushion',size:[.5,.5,.08],purpose:'A zabuton for a guest, so nobody sits on the bare tatami.',
  build(g){part(g,[.5,.08,.5],[0,.04,0],0xb2453b,'Zabuton');}},
 {id:'rug',name:'Rag rug',size:[1.4,.9,.012],flat:true,purpose:'A Swedish rag rug, woven from old shirts; a little of home on the tatami.',
  build(g){part(g,[1.4,.012,.9],[0,.006,0],0x6f8fa6,'Rag rug');for(let i=0;i<5;i++)part(g,[1.4,.013,.06],[0,.0065,-.36+i*.18],[0xe9dcc3,0xb86d61,0xe9dcc3,0x395777,0xe9dcc3][i],'Rug stripe');}},
]);

export const homeFurniture=id=>HOME_FURNITURE.find(f=>f.id===id)||null;

/**
 * The home furniture in the shape the builder expects (placements.js): make(x,z,yaw) → {object, collider}, keyed by
 * catalogue id, and a catalogue lookup.
 */
export function homeFurnitureFactory(){
 const out={};
 for(const f of HOME_FURNITURE)out[f.id]=(x,z,yaw=0)=>{
  const g=new THREE.Group();g.name='home:'+f.id;g.position.set(x,0,z);g.rotation.y=yaw;f.build(g);
  return {object:g,collider:f.flat?null:{x,z,w:f.size[0],d:f.size[1]}};
 };
 return out;
}
export const HOME_CATALOGUE=Object.freeze(HOME_FURNITURE.map(f=>Object.freeze({id:f.id,name:f.name,make:f.id,purpose:f.purpose,flat:!!f.flat,size:f.size})));

/** Saved furniture, cleaned: known pieces with a position and their own id; anything else is dropped. */
export function restoreHomeItems(raw){
 if(!Array.isArray(raw))return [];
 const ids=new Set();
 return raw.filter(p=>p&&homeFurniture(p.kind)&&[+p.x,+p.z].every(Number.isFinite)&&typeof p.id==='string'&&!ids.has(p.id)&&ids.add(p.id))
  .slice(0,40).map(p=>({id:p.id,kind:p.kind,x:+p.x,z:+p.z,yaw:Number.isFinite(+p.yaw)?+p.yaw:0}));
}
