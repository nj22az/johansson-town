// What stands near Sakura's street poster in the town as the game builds it: every mesh with a point within 300 mm of the
// poster's board across the wall and between 3 and 400 mm out from the wall's face. Only the poster itself may be there.
// Usage (from johansson-town/): node tools/street-poster-audit.mjs [out.json]
import {writeFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';

export async function measurePosterSurroundings(){
 installDOM();
 const {createTown}=await import('../src/world/town.js');
 const {SAKURA_STREET_POSTER:P}=await import('../src/world/sakura-street-poster.js');
 const world=createTown({scene:new THREE.Scene(),sites:[{id:'market',title:'Sakura Shōten',jp:'桜商店',side:-1,z:-28,color:0x9d7c7e,accent:'#a76680',line:'Thuan'}],mobile:true,shadows:false,register(){},onAction(){},enter(){},getPlayerPosition:()=>new THREE.Vector3()});
 world.group.updateMatrixWorld(true);
 const hw=P.board.w/2000+.3,hh=P.board.h/2000+.3,cx=P.centre.x,cy=P.centre.y/1000,o=P.normal[2];
 // the zone: 300 mm round the board across the wall, from the wall's face 400 mm out into the street
 const z0=Math.min(P.wallFace,P.wallFace+o*.4),z1=Math.max(P.wallFace,P.wallFace+o*.4);
 const zone=new THREE.Box3(new THREE.Vector3(cx-hw,cy-hh,z0-.005),new THREE.Vector3(cx+hw,cy+hh,z1+.005));
 // a point of the town in front of the wall's face (more than 3 mm out): the wall's own plaster lies on the face
 const proud=v=>(v.z-P.wallFace)*o>.003;
 const found={},v=new THREE.Vector3(),m=new THREE.Matrix4();
 world.group.traverse(o=>{
  if(!o.isMesh||!o.geometry?.attributes?.position)return;
  for(let p=o;p;p=p.parent)if(p.visible===false)return;
  const pos=o.geometry.attributes.position,count=o.isInstancedMesh?o.count:1;
  let path=[];for(let p=o;p&&p!==world.group;p=p.parent)if(p.name)path.unshift(p.name);path=path.join(' › ')||o.type;
  for(let k=0;k<count;k++){
   if(o.isInstancedMesh){o.getMatrixAt(k,m);m.premultiply(o.matrixWorld);}else m.copy(o.matrixWorld);
   for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(m);if(zone.containsPoint(v)&&(/Sakura street poster/.test(path)||proud(v))){const b=found[path]??={n:0,min:[1e9,1e9,1e9],max:[-1e9,-1e9,-1e9]};b.n++;['x','y','z'].forEach((a,j)=>{b.min[j]=Math.min(b.min[j],+v[a].toFixed(3));b.max[j]=Math.max(b.max[j],+v[a].toFixed(3));});}}
  }
 });
 const own=k=>/Sakura street poster/.test(k);
 return {zone:{min:zone.min.toArray(),max:zone.max.toArray()},found,intruders:Object.keys(found).filter(k=>!own(k))};
}

if(import.meta.url===`file://${process.argv[1]}`){
 const r=await measurePosterSurroundings();
 if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(r,null,1)+'\n');
 console.log('near the poster:',Object.keys(r.found).join(' | '));
 console.log('intruders:',r.intruders.join(' | ')||'none');
}
