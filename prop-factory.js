import * as THREE from './vendor/three.module.js';

// Small local-authored moving props, separate from the human rigs.
export function createLivingProps(world,factory){
  const bird=new THREE.Group();world.group.add(bird);
  factory.box(bird,[.12,.10,.36],[0,0,0],0xe3ded0);
  const wings=[-1,1].map(s=>factory.box(bird,[.48,.025,.17],[s*.26,0,0],0xcbd1cb));
  const reflection=world.cat.clone();reflection.scale.setScalar(.35);reflection.position.set(-6.15,2.4,16.07);reflection.rotation.y=Math.PI;reflection.visible=false;world.group.add(reflection);
  let mirrorUntil=0;
  return {mirror(){mirrorUntil=performance.now()+6000;},update(dt,time,minutes){
    bird.position.set(Math.cos(time*.13)*10,7+Math.sin(time*.3)*.4,-73+Math.sin(time*.13)*5);bird.rotation.y=-time*.13;wings.forEach((w,i)=>w.rotation.z=Math.sin(time*3)*(i?1:-1)*.12);
    reflection.visible=performance.now()<mirrorUntil;
  }};
}
import {getTextureResource,resourceSummary} from './resource-catalog.js';

// Local-first environment prop factory. Poly Haven textures are the actual sourced
// runtime assets; geometry remains deterministic and procedural so iOS never depends
// on third-party hosts. Higher-detail CC0 models can replace individual factories later.
export function createPropFactory({shadows=true,maxAnisotropy=4}={}){
  const loader=new THREE.TextureLoader(),textures=new Map(),materials=new Map(),geometries=new Map();

  function texture(name){
    if(textures.has(name))return textures.get(name);
    const spec=getTextureResource(name);if(!spec)return null;
    const t=loader.load(spec.path);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(8,maxAnisotropy||1);
    const repeats={asphalt:[4,4],timber:[2.4,2.4],roof:[2,2],plaster:[2.2,2.2]};const r=repeats[name]||[1,1];t.repeat.set(...r);textures.set(name,t);return t;
  }
  function material(key,color,roughness=.84,metalness=0,emissive=0,emissiveIntensity=0){
    const mk=`${key}/${color}/${roughness}/${metalness}/${emissive}/${emissiveIntensity}`;if(materials.has(mk))return materials.get(mk);
    const m=new THREE.MeshStandardMaterial({color,map:key?texture(key):null,roughness,metalness,emissive,emissiveIntensity,dithering:true});materials.set(mk,m);return m;
  }
  function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function add(parent,geo,mat,pos=[0,0,0],rot=[0,0,0],scale=[1,1,1],cast=shadows){const o=new THREE.Mesh(geo,mat);o.position.set(...pos);o.rotation.set(...rot);o.scale.set(...scale);o.castShadow=cast;o.receiveShadow=cast;o.userData.staticProp=true;parent.add(o);return o;}
  function box(parent,size,pos,color,kind=null,cast=shadows){return add(parent,geometry(`box:${size.join(',')}`,()=>new THREE.BoxGeometry(...size)),material(kind,color),pos,[0,0,0],[1,1,1],cast);}
  function cylinder(parent,r,h,pos,color,segments=12,kind=null,cast=shadows){return add(parent,geometry(`cyl:${r}/${h}/${segments}`,()=>new THREE.CylinderGeometry(r,r,h,segments)),material(kind,color),pos,[0,0,0],[1,1,1],cast);}
  function beam(parent,a,b,r,color,segments=8,kind=null,cast=shadows){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(bv,av);const o=add(parent,geometry(`beam:${r}/${segments}`,()=>new THREE.CylinderGeometry(r,r,1,segments)),material(kind,color),[0,0,0],[0,0,0],[1,1,1],cast);o.position.copy(av).add(bv).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());o.scale.set(1,d.length(),1);return o;}
  const make=(name,x,z,rotation=0)=>{const g=new THREE.Group();g.name=`prop:${name}`;g.position.set(x,0,z);g.rotation.y=rotation;return g;};

  function bench(x,z,rotation=0){const g=make('bench',x,z,rotation);for(const y of [.54,.73,.92])box(g,[1.78,.10,.16],[0,y,.18],0x755b43,'timber');box(g,[1.78,.12,.52],[0,.56,-.08],0x755b43,'timber');for(const dx of [-.68,.68]){box(g,[.12,.54,.12],[dx,.28,-.16],0x40494a);box(g,[.12,.62,.12],[dx,.52,.18],0x40494a);}return {object:g,collider:{x,z,w:1.95,d:.78}};}
  function postbox(x,z,rotation=0){const g=make('postbox',x,z,rotation);box(g,[.74,1.05,.58],[0,.65,0],0x9c4339);const top=add(g,geometry('postbox-top',()=>new THREE.CylinderGeometry(.37,.37,.60,16,1,false,0,Math.PI)),material(null,0x9c4339),[0,1.17,0],[0,0,Math.PI/2]);box(g,[.50,.055,.08],[0,1.03,-.33],0x222a2b);box(g,[.44,.20,.035],[0,.72,-.315],0xd7d0bb,null,false);return {object:g,collider:{x,z,w:.82,d:.68}};}
  function newspaperRack(x,z,rotation=0){const g=make('newspaper-rack',x,z,rotation);box(g,[.92,1.05,.50],[0,.60,0],0x4a6065);for(let y=.35;y<=.92;y+=.19){box(g,[.74,.035,.36],[0,y,-.18],0xd7cfb8,null,false);box(g,[.64,.025,.03],[0,y+.045,-.38],0x8f8b79,null,false);}box(g,[1,.08,.56],[0,1.15,0],0x394a4e);return {object:g,collider:{x,z,w:1.02,d:.62}};}
  function noticeBoard(x,z,rotation=0){const g=make('notice-board',x,z,rotation);for(const dx of [-.62,.62])cylinder(g,.055,2.15,[dx,1.08,0],0x59615b,8);box(g,[1.48,1.10,.10],[0,1.55,0],0xcac0a5);for(const [px,py,c] of [[-.32,1.72,0xd6c8a6],[.28,1.68,0xc9d6cf],[-.28,1.39,0xe0d0c2],[.32,1.36,0xd7c991]])box(g,[.48,.24,.015],[px,py,-.06],c,null,false);return {object:g,collider:{x,z,w:1.55,d:.26}};}
  function utilityCabinet(x,z,rotation=0){const g=make('utility-cabinet',x,z,rotation);box(g,[.88,1.36,.56],[0,.76,0],0x52666a);box(g,[.72,.03,.42],[0,1.12,-.30],0x3b4c50);box(g,[.12,.24,.025],[.27,.73,-.30],0xa94f42,null,false);for(let y=.34;y<.95;y+=.16)box(g,[.52,.025,.025],[-.06,y,-.30],0x768183,null,false);return {object:g,collider:{x,z,w:.96,d:.66}};}
  function bicycleRack(x,z,rotation=0){const g=make('bicycle-rack',x,z,rotation);for(const dz of [-.17,.17])beam(g,[0,.02,dz],[0,.43,dz],.022,0x79827b);add(g,geometry('single-cycle-stand',()=>new THREE.TorusGeometry(.17,.022,6,16,Math.PI)),material(null,0x79827b),[0,.43,0],[0,Math.PI/2,0]);return {object:g,collider:{x,z,w:.10,d:.40}};}
  function convexMirror(x,z,rotation=0){const g=make('convex-mirror',x,z,rotation);cylinder(g,.06,2.8,[0,1.4,0],0x5b625d,9);const ring=add(g,geometry('convex-ring',()=>new THREE.CylinderGeometry(.43,.43,.08,24)),material(null,0xe7ded0),[0,2.62,0],[Math.PI/2,0,0]);add(g,geometry('convex-face',()=>new THREE.SphereGeometry(.39,18,10,0,Math.PI*2,0,Math.PI*.42)),material(null,0x9fb8be,.35,.18),[0,2.59,-.03],[Math.PI/2,0,0],[1,.35,1],false);return {object:g,collider:{x,z,w:.28,d:.28}};}
  function airConditioner(x,z,rotation=0){const g=make('air-conditioner',x,z,rotation);box(g,[1.10,.70,.44],[0,1.35,0],0xd3d1c7);for(let y=1.14;y<1.52;y+=.09)box(g,[.76,.025,.03],[0,y,-.235],0x777d79,null,false);const fan=add(g,geometry('ac-fan',()=>new THREE.TorusGeometry(.19,.035,8,18)),material(null,0x6d7470),[.30,1.36,-.24],[Math.PI/2,0,0],undefined,false);return {object:g,collider:{x,z,w:1.18,d:.50}};}
  function noren(x,z,rotation=0,color=0x5e6575){const g=make('noren',x,z,rotation);beam(g,[-.75,2.35,0],[.75,2.35,0],.025,0x493f35);for(const dx of [-.50,0,.50])box(g,[.46,.72,.025],[dx,1.95,0],color,null,false);return {object:g,collider:null};}
  function awning(x,z,rotation=0,color=0x6f7e76){const g=make('awning',x,z,rotation);const canopy=box(g,[1.9,.12,1.05],[0,2.45,0],color);canopy.rotation.x=-.12;for(const dx of [-.72,.72])beam(g,[dx,2.42,.15],[dx,2.05,.48],.025,0x4c5350);return {object:g,collider:null};}
  function crateStack(x,z,rotation=0){const g=make('crate-stack',x,z,rotation);for(let r=0;r<2;r++)for(let c=0;c<2;c++){const px=(c-.5)*.64,pz=(r-.5)*.58;box(g,[.58,.42,.52],[px,.28+r*.04,pz],r?0x806344:0x9b7651,'timber');for(const sx of [-.22,.22])box(g,[.035,.27,.56],[px+sx,.29+r*.04,pz],0x554233,'timber');}return {object:g,collider:{x,z,w:1.35,d:1.18}};}
  function baitStation(x,z,rotation=0){const g=make('bait-station',x,z,rotation);box(g,[1.12,.72,.72],[0,.40,0],0x5d6e6e);box(g,[1.20,.08,.78],[0,.80,0],0xc8c4b2);box(g,[.52,.34,.54],[-.25,1.02,0],0x879aa0);box(g,[.30,.34,.32],[.34,.99,-.04],0x80634a,'timber');return {object:g,collider:{x,z,w:1.24,d:.84}};}
  function pierWinch(x,z,rotation=0){const g=make('pier-winch',x,z,rotation);box(g,[1.05,.18,.78],[0,.18,0],0x4a5657);for(const dx of [-.34,.34])cylinder(g,.08,.72,[dx,.58,0],0x4a5657,10);const drum=cylinder(g,.28,.70,[0,.60,0],0x30393a,16);drum.rotation.z=Math.PI/2;beam(g,[0,.78,0],[.52,1.02,0],.035,0x4a5657);cylinder(g,.08,.18,[.58,1.05,0],0xb69662,10);return {object:g,collider:{x,z,w:1.18,d:.90}};}
  function menuBoard(x,z,rotation=0){const g=make('menu-board',x,z,rotation);for(const dx of [-.38,.38])beam(g,[dx,0,0],[dx,1.22,0],.035,0x514739);box(g,[.94,.82,.07],[0,.84,0],0xd9cdb0);box(g,[.72,.05,.015],[0,.98,-.045],0x8b4338,null,false);box(g,[.62,.035,.015],[0,.78,-.045],0x5c5e51,null,false);box(g,[.52,.035,.015],[0,.62,-.045],0x5c5e51,null,false);return {object:g,collider:{x,z,w:1.0,d:.26}};}

  return {
    box,cylinder,beam,material,
    bench,postbox,newspaperRack,noticeBoard,utilityCabinet,bicycleRack,convexMirror,airConditioner,noren,awning,crateStack,baitStation,pierWinch,menuBoard,
    resources:resourceSummary(),
    dispose(){for(const t of textures.values())t.dispose?.();for(const m of materials.values())m.dispose?.();for(const g of geometries.values())g.dispose?.();textures.clear();materials.clear();geometries.clear();}
  };
}
