import {makeWorkshopModel} from './src/workshop/models.js';
import * as THREE from './vendor/three.module.js';
import {ITEMS} from './content-data.js?warehouse=1';
import {createShopProduct} from './src/commerce/shop-product.js';

export function textTexture(title,body,scale=1){
  const c=document.createElement('canvas');c.width=1024*scale;c.height=1440*scale;
  const x=c.getContext('2d');x.scale(scale,scale);x.fillStyle='#eee4cd';x.fillRect(0,0,1024,1440);
  x.strokeStyle='#a4916f';x.lineWidth=3;x.strokeRect(36,36,952,1368);
  let y=100;
  const wrap=(text,font,line)=>{x.font=font;for(const paragraph of text.split('\n')){let row='';for(const word of paragraph.split(' ')){const next=(row?row+' ':'')+word;if(x.measureText(next).width>840&&row){x.fillText(row,90,y);y+=line;row=word;}else row=next;}x.fillText(row,90,y);y+=line;}};
  x.fillStyle='#29454a';wrap(title,'bold 46px Georgia',56);y+=35;x.fillStyle='#30372e';
  let size=34;
  function rows(fontSize){x.font=fontSize+'px Georgia';let count=0;for(const p of body.split('\n')){let row='';count++;for(const word of p.split(' ')){const next=(row?row+' ':'')+word;if(row&&x.measureText(next).width>840){count++;row=word;}else row=next;}}return count;}
  while(size>22&&y+rows(size)*size*1.35>1310)size-=2;
  wrap(body,size+'px Georgia',size*1.35);
  x.font='22px monospace';x.fillStyle='#6c705f';x.fillText('THE OFFICE OF NILS JOHANSSON',90,1370);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function cube(g,size,pos,color){const m=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshStandardMaterial({color,roughness:.78}));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
function ring(g,r,t,pos,color){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,24),new THREE.MeshStandardMaterial({color,roughness:.4,metalness:.4}));m.position.set(...pos);g.add(m);return m;}

// The same mesh builder supplies shelf objects and their temporary held copies.
export function makeContentObject(item,{pageScale=1}={}){
  const g=new THREE.Group();g.name='content-'+item.id;
  if(item.kind==='shop-good'){
    const product=createShopProduct(item.productId||item.id);
    product.scale.setScalar(4.5);
    g.add(product);
    g.userData.reader={setPage(){},next(){},open(){},flip(){},update(){},get page(){return 1;}};
    return g;
  }
  const page=new THREE.Mesh(new THREE.PlaneGeometry(.70,.98),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
  page.position.set(0,0,.065);g.add(page);
  let current=0,flip=0;
  const setPage=n=>{current=Math.max(0,Math.min(item.pages.length-1,n));const old=page.material.map;page.material.map=textTexture(...item.pages[current],pageScale);page.material.needsUpdate=true;old?.dispose();};
  setPage(0);
  const hinge=new THREE.Group();hinge.position.x=-.37;g.add(hinge);
  if(item.kind==='book'||item.kind==='folio'){
    cube(g,[.78,1.07,.10],[0,0,0],item.color);cube(g,[.70,.98,.09],[0,0,.018],0xddd3b9);
    const cover=cube(hinge,[.77,1.07,.022],[.385,0,.09],item.color);cover.name='folding-cover';
    cube(hinge,[.055,1.07,.026],[.08,0,.11],item.kind==='folio'?0x3b6588:0xaa9058);
    // A small pelican stamp: body, neck and bill, all embossed local geometry.
    if(item.id==='book'){const bird=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),new THREE.MeshStandardMaterial({color:0xc1a16c}));bird.scale.set(1.4,.65,.25);bird.position.set(.39,.27,.114);hinge.add(bird);cube(hinge,[.025,.1,.018],[.44,.33,.11],0xc1a16c);cube(hinge,[.13,.016,.018],[.49,.38,.11],0xc1a16c);}
  }else if(item.kind==='keychain'){
    page.visible=false;const blank=cube(g,[.68,.88,.08],[0,0,0],item.color);blank.material.transparent=true;blank.material.opacity=.65;blank.material.roughness=.25;
    ring(g,.09,.014,[0,.32,.06],0xa6bdb4);ring(g,.16,.02,[0,.49,0],0x9da9a8);
    cube(g,[.69,.006,.087],[0,-.14,0],0xbdd4c5);
  }else if(item.kind==='printed-model'){
    page.visible=false;g.add(makeWorkshopModel(item.meshData,item.color));
  }else if(item.kind==='calculator'){
    cube(g,[.8,1.14,.18],[0,0,-.09],item.color);page.scale.set(.8,.32,1);page.position.y=.34;
    for(let i=0;i<20;i++)cube(g,[.12,.10,.055],[-.27+(i%4)*.18,-.06-Math.floor(i/4)*.1,.035],i%4===3?0xa78d5b:0xc5c7b1);
  }else if(item.kind==='model'){
    page.visible=false;cube(g,[1.25,.10,1.5],[0,-.4,0],0x745d41);cube(g,[.22,.015,1.35],[0,-.335,0],0x505e60);
    for(let i=0;i<8;i++){const x=i%2?.35:-.35,z=-.52+Math.floor(i/2)*.32;cube(g,[.30,.22,.23],[x,-.21,z],i%2?0x9d7b5d:0x73857a);const roof=cube(g,[.34,.06,.28],[x,-.06,z],0x414e54);roof.rotation.z=i%2?.08:-.08;}
    cube(g,[.95,.012,.22],[0,-.33,-.61],0x527b86);
    const glass=new THREE.Mesh(new THREE.CylinderGeometry(.79,.79,1,32,1,true),new THREE.MeshPhysicalMaterial({color:0xb4cfca,transparent:true,opacity:.12,roughness:.08,depthWrite:false,side:THREE.DoubleSide}));glass.position.y=.10;g.add(glass);
    const dome=new THREE.Mesh(new THREE.SphereGeometry(.79,24,12,0,Math.PI*2,0,Math.PI/2),glass.material);dome.scale.y=.35;dome.position.y=.60;g.add(dome);
  }else if(item.kind==='parcel'){
    cube(g,[.8,1.06,.3],[0,0,-.1],item.color);cube(g,[.025,1.08,.32],[.26,0,-.1],0xe1d4b5);cube(g,[.81,.025,.32],[0,-.32,-.1],0xe1d4b5);page.scale.set(.75,.7,1);
  }else cube(g,[.71,.99,.008],[0,0,.055],item.color);
  g.userData.reader={setPage,next:d=>{setPage(current+d);flip=.22;},open:()=>hinge.rotation.y=-Math.PI*.92,flip:()=>{if(item.kind==='folio'){setPage(1-current);flip=.22;}else if(item.kind==='book'){hinge.rotation.y=hinge.rotation.y?0:-Math.PI*.92;}else {g.rotation.y+=Math.PI;}},update:dt=>{flip=Math.max(0,flip-dt);page.rotation.y=Math.sin(flip/.22*Math.PI)*.65;},get page(){return current+1;}};
  return g;
}
export function createContentItems({group,register,colliders,onInspect,onRead,placements}){
  const items=placements?ITEMS.map(item=>({...item,pos:placements.get(item.id),place:"Canal quarter · harbour reading tables"})):ITEMS;
  const objects=new Map();
  for(const item of items){const object=makeContentObject(item);object.position.set(...item.pos);object.rotation.x=-Math.PI/2+.23;object.scale.setScalar(.72);group.add(object);objects.set(item.id,object);register(object,'Lift '+item.title,()=>onInspect(item));
    if(placements||!/^book[2-6]$/.test(item.id)&&!['github','linkedin','etsy','wordpress'].includes(item.id)){cube(group,[.88,.10,1.05],[item.pos[0],item.pos[1]-.12,item.pos[2]],0x735b41);for(const dx of [-.34,.34])cube(group,[.08,item.pos[1]-.18,.08],[item.pos[0]+dx,(item.pos[1]-.18)/2,item.pos[2]+.35],0x4e4538);colliders.push({x:item.pos[0],z:item.pos[2],w:.88,d:1.05});}
  }
  if(placements)return {items,objects};
  // One wall-side delivery shelf replaces the row of freestanding tables.
  const shelf=new THREE.Group();shelf.name='East lane delivery shelf';group.add(shelf);
  for(const y of [.90,1.55])cube(shelf,[.64,.065,1.95],[6.65,y,10.8],0x735b41);
  for(const z of [9.9,11.7])cube(shelf,[.10,1.70,.10],[6.85,.85,z],0x4e4538);
  colliders.push({x:6.65,z:10.8,w:.65,d:2,height:1.85});
  const cv=ITEMS.find(i=>i.id==='cv');for(const x of [-.45,.45])cube(group,[.025,.18,1.04],[cv.pos[0]+x,cv.pos[1]-.04,cv.pos[2]],0x647170);
  const chair=new THREE.Group();chair.position.set(4.9,0,22);group.add(chair);cube(chair,[.7,.12,.7],[0,.5,0],0x5a6357);cube(chair,[.7,.72,.09],[0,.85,.32],0x5a6357);register(chair,'Read in the window chair',onRead);colliders.push({x:4.9,z:22,w:.72,d:.72});
  // Calipers and vice occupy the workshop edge; they are never attached to a character.
  cube(group,[.34,.25,.35],[-6.5,1.17,-5],0x4e5c5e);cube(group,[.5,.05,.05],[-6.4,1.24,-4.7],0xaab4b0);cube(group,[.035,.05,.25],[-6.5,1.25,-4.7],0xaab4b0);
  const label=(title,body,pos)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.75),new THREE.MeshBasicMaterial({map:textTexture(title,body),side:THREE.DoubleSide}));p.position.set(...pos);group.add(p);};
  label('PATTERN WORKSHOP','BRASS · TIMBER · HAND TOOLS',[-6.2,1.85,-4.3]);
  label('HARBOUR OFFICE','FIELD SERVICE · MARINE SYSTEMS',[-6.05,1.85,-35.4]);
  label('SIX BOOKS','Five centuries. Read in the chair by the window.',[5.25,1.85,19.9]);
  return {items:ITEMS,objects};
}
