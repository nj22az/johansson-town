// Measures Sakura's shop floor round the wall band, from the room the game builds (no drawing is trusted over it):
// for each run of the band (src/world/interiors/sakura-band.js), what stands in front of the wall below it (the elevation
// drawings' context) and anything inside the band's own volume (wall to the cap's front, bead bottom to the cap top),
// which must be nothing but the band, its stripe and the beams it clears.
// Usage (from johansson-town/): node tools/sakura-band-audit.mjs [out.json]
import {writeFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {installDOM} from '../tests/fixtures.mjs';
installDOM();
const {buildSakuraInterior}=await import('../src/world/interiors/sakura-interior.js');
const {SAKURA_BAND_DESIGN:D,runLength}=await import('../src/world/interiors/sakura-band.js');
const {SAKURA_SHELL}=await import('../src/world/interiors/sakura-shell.js');

export function measure(room){
 room.updateMatrixWorld(true);
 const out={ceiling:SAKURA_SHELL.ceiling*1000,runs:{}},v=new THREE.Vector3(),m=new THREE.Matrix4();
 for(const r of D.runs){
  const L=runLength(r),dir=Math.sign(r.to-r.from),wallFace=r.wall==='x'?SAKURA_SHELL[r.at<0?'westX':'eastX']:SAKURA_SHELL.partitionZ;
  // depth: how far into the shop from the wall's face (negative behind the wall, in the stockroom or outside)
  const into=r.wall==='x'?(r.at<0?1:-1):1;
  const toRun=p=>{const t=r.wall==='x'?p.z:p.x,n=r.wall==='x'?p.x:p.z;return {u:(t-r.from)*dir*1000,depth:(n-wallFace)*into*1000,y:p.y*1000};};
  const front={},inside={};
  room.traverse(o=>{
   if(!o.isMesh||!o.geometry?.attributes?.position)return;
   for(let p=o;p;p=p.parent)if(p.visible===false)return;
   const pos=o.geometry.attributes.position,count=o.isInstancedMesh?o.count:1,name=o.name||o.parent?.name||o.type;
   for(let k=0;k<count;k++){
    if(o.isInstancedMesh){o.getMatrixAt(k,m);m.premultiply(o.matrixWorld);}else m.copy(o.matrixWorld);
    for(let i=0;i<pos.count;i++){
     v.fromBufferAttribute(pos,i).applyMatrix4(m);const q=toRun(v);
     if(q.u<-30||q.u>L+30)continue;
     const add=(bag)=>{const b=bag[name]??={u0:Infinity,u1:-Infinity,y0:Infinity,y1:-Infinity,d0:Infinity,d1:-Infinity,n:0};
      b.u0=Math.min(b.u0,q.u);b.u1=Math.max(b.u1,q.u);b.y0=Math.min(b.y0,q.y);b.y1=Math.max(b.y1,q.y);b.d0=Math.min(b.d0,q.depth);b.d1=Math.max(b.d1,q.depth);b.n++;};
     if(q.depth>=0&&q.depth<=900&&q.y<=SAKURA_SHELL.ceiling*1000+1)add(front);
     // the band's volume: from the wall to the cap's front, from just under the bead to the cap's top
     const reach=Math.abs(r.wall==='x'?r.at-wallFace:r.at-wallFace)*1000+D.cap.project+5;
     if(q.depth>2&&q.depth<=reach&&q.y>=D.bead.y0-70&&q.y<=D.cap.y1+5)add(inside);
    }
   }
  });
  const round=b=>Object.fromEntries(Object.entries(b).map(([k,x])=>[k,typeof x==='number'?Math.round(x):x]));
  out.runs[r.id]={length:L,wallFace:Math.round(wallFace*1000),boardFace:Math.round(Math.abs((r.at-wallFace)*1000)),
   front:Object.fromEntries(Object.entries(front).filter(([,b])=>b.n>=4).map(([k,b])=>[k,round(b)])),
   inside:Object.fromEntries(Object.entries(inside).map(([k,b])=>[k,round(b)]))};
 }
 return out;
}

if(import.meta.url===`file://${process.argv[1]}`){
 const room=new THREE.Group();buildSakuraInterior({room,reg(){},action(){},exit(){}});
 const res=measure(room);
 const file=process.argv[2];
 if(file)await writeFile(file,JSON.stringify(res,null,1)+'\n');
 for(const [id,r] of Object.entries(res.runs)){
  console.log(`\n${id}: ${r.length} mm, wall face ${r.wallFace}, board face ${r.boardFace} mm off the wall`);
  console.log(' in the band volume:',Object.keys(r.inside).join(', ')||'nothing');
 }
}
