// Actual current game geometry in the bridge frame, for a Blender visual check.
import {mkdir,writeFile} from 'node:fs/promises';
import {installDOM} from '../tests/fixtures.mjs';
import * as THREE from '../vendor/three.module.js';
import {buildFerryModel,FERRY_DECKS} from '../src/world/ferry-model.js';
import {FERRY_HOUSE} from '../src/world/ferry-interior.js';
installDOM();
const f=buildFerryModel(),b=f.userData.bridgeEquipment;b.navigationFeeder.group.remove(b.navigationFeeder.group.getObjectByName('Navigation feeder fallback'));b.navigationFeeder.group.remove(b.navigationFeeder.group.getObjectByName('Navigation light panel markings'));f.updateMatrixWorld(true);
const data=[];
f.traverse(o=>{if(!o.isMesh)return;const g=o.geometry,index=g.index,p=g.attributes.position,c=g.attributes.color,m=o.material;if(Array.isArray(m))return;
 const points=[],colours=[],colour=m.color?.toArray()||[.7,.7,.7];
 for(let i=0;i<(index?.count||p.count);i+=3){
  const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k),v=ids.map(j=>new THREE.Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld).sub(new THREE.Vector3(0,FERRY_DECKS.bridge.y,FERRY_HOUSE.fore)));
  if(!v.every(q=>q.y>=-.15&&q.y<=2.25&&q.z>=-3.55&&q.z<=.15&&Math.abs(q.x)<4.3))continue;
  for(let k=0;k<3;k++){points.push(...v[k].toArray());const j=ids[k];colours.push(...(c?[c.getX(j),c.getY(j),c.getZ(j)]:colour));}
 }
 if(points.length)data.push({name:o.name||'current game geometry',points,colours,glass:!!m.transparent,opacity:m.opacity??1});
});
const dir=new URL('../docs/qa/navigation-feeder-2026-11-02/',import.meta.url);await mkdir(dir,{recursive:true});await writeFile(new URL('bridge-source-geometry.json',dir),JSON.stringify(data));console.log('Exported',data.length,'game meshes',data.reduce((n,m)=>n+m.points.length/9,0),'triangles');
