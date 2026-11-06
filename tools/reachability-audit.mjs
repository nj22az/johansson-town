// Can you walk everywhere and do everything? A flood fill of the walking rules from Main
// Street (and from the airport quay, which the ferry joins to the town), then every door,
// seat, counter and noticeboard checked against the ground you can actually reach.
//
//   node tools/reachability-audit.mjs [--json out.json] [--png out.ppm]
//
// It uses the same rules the player does: routeAt (the plan's walkable ground), the
// world's colliders at standing height, and the step limit between neighbouring cells.
import * as THREE from '../vendor/three.module.js';
import {writeFileSync} from 'node:fs';
import {installDOM} from '../tests/fixtures.mjs';
import {createTown} from '../src/world/town.js';
import {createBusinesses} from '../src/world/businesses.js';
import {routeAt,groundHeight,MAP_BOUNDS} from '../src/world/layout.js';
import {standingHitsRect} from '../physics.js';
import {AIRPORT_LANDING} from '../src/world/airport-ground.js';

installDOM();
const anchors=[];
const sites=createBusinesses();
const world=createTown({scene:new THREE.Scene(),sites,townMode:'peninsula',mobile:true,shadows:false,register:(object,label)=>anchors.push({object,label}),enter(){},onAction(){},getPlayerPosition:()=>new THREE.Vector3()});
world.group.updateMatrixWorld(true);
const CELL=.5,R=.3,STEP=.42,B=MAP_BOUNDS,nx=Math.ceil((B.maxX-B.minX)/CELL)+1,nz=Math.ceil((B.maxZ-B.minZ)/CELL)+1;
const bins=new Map(),bin=4;
for(const c of world.colliders){const reach=Math.hypot(c.w,c.d)/2+.5;for(let x=Math.floor((c.x-reach)/bin);x<=Math.floor((c.x+reach)/bin);x++)for(let z=Math.floor((c.z-reach)/bin);z<=Math.floor((c.z+reach)/bin);z++){const k=x*100003+z;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(c);}}
const height=new Float32Array(nx*nz).fill(NaN),open=new Uint8Array(nx*nz),reached=new Uint8Array(nx*nz);
const at=(i,j)=>[B.minX+i*CELL,B.minZ+j*CELL];
let t=Date.now();
for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
 const [x,z]=at(i,j);if(!routeAt(x,z,R))continue;
 const y=groundHeight(x,z),list=bins.get(Math.floor(x/bin)*100003+Math.floor(z/bin))||[];
 if(list.some(c=>standingHitsRect(x,z,R,y,c)))continue;
 open[j*nx+i]=1;height[j*nx+i]=y;
}
const sampled=Date.now()-t;
function flood(x,z){
 const i0=Math.round((x-B.minX)/CELL),j0=Math.round((z-B.minZ)/CELL);
 // Start from the nearest open cell to the seed.
 let best=null;for(let dj=-4;dj<=4;dj++)for(let di=-4;di<=4;di++){const k=(j0+dj)*nx+i0+di;if(open[k]&&(!best||Math.hypot(di,dj)<best[1]))best=[k,Math.hypot(di,dj)];}
 if(!best)return 0;const queue=[best[0]];reached[best[0]]=1;let n=0;
 while(queue.length){const k=queue.pop();n++;const i=k%nx,j=(k-i)/nx;
  for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz)continue;const q=b*nx+a;if(!open[q]||reached[q])continue;if(Math.abs(height[q]-height[k])>STEP)continue;reached[q]=1;queue.push(q);}
 }
 return n;
}
const fromTown=flood(0,-36),fromAirport=flood(...AIRPORT_LANDING);
function nearestReached(x,z,radius){
 const i0=Math.round((x-B.minX)/CELL),j0=Math.round((z-B.minZ)/CELL),n=Math.ceil(radius/CELL);let best=Infinity;
 for(let dj=-n;dj<=n;dj++)for(let di=-n;di<=n;di++){const i=i0+di,j=j0+dj;if(i<0||j<0||i>=nx||j>=nz||!reached[j*nx+i])continue;best=Math.min(best,Math.hypot(di,dj)*CELL);}
 return best;
}
const report={cells:{open:open.reduce((a,b)=>a+b,0),fromTown,fromAirport},stranded:[],doors:[],anchors:[]};
// Open ground no one can get to: islands of walkable cells the fill never touched.
{const seen=new Uint8Array(nx*nz);for(let k=0;k<nx*nz;k++){if(!open[k]||reached[k]||seen[k])continue;const q=[k];seen[k]=1;let n=0,sx=0,sz=0;while(q.length){const c=q.pop();n++;const i=c%nx,j=(c-i)/nx;const [x,z]=at(i,j);sx+=x;sz+=z;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=nx||b>=nz)continue;const p=b*nx+a;if(open[p]&&!reached[p]&&!seen[p]&&Math.abs(height[p]-height[c])<=STEP){seen[p]=1;q.push(p);}}}
 if(n*CELL*CELL>=4)report.stranded.push({area:+(n*CELL*CELL).toFixed(1),centre:[+(sx/n).toFixed(1),+(sz/n).toFixed(1)]});}}
report.stranded.sort((a,b)=>b.area-a.area);
for(const s of [...sites,...(world.landmarks||[])]){const d=s.approachPosition||s.door||s.exitPosition;if(!d)continue;const x=d[0],z=d.length>2?d[2]:d[1],gap=nearestReached(x,z,3);if(gap>1.2)report.doors.push({id:s.id,title:s.title,at:[+x.toFixed(1),+z.toFixed(1)],gap:Number.isFinite(gap)?+gap.toFixed(2):null});}
const p=new THREE.Vector3();
for(const {object,label} of anchors){if(object.userData.hit?.inside)continue;object.getWorldPosition(p);if(p.x<B.minX||p.x>B.maxX||p.z<B.minZ||p.z>B.maxZ)continue;const gap=nearestReached(p.x,p.z,4);if(gap>2.6)report.anchors.push({label,at:[+p.x.toFixed(1),+p.z.toFixed(1)],gap:Number.isFinite(gap)?+gap.toFixed(2):null});}
console.log(`Sampled ${nx}×${nz} cells in ${sampled} ms. Walkable ${report.cells.open}, reached from Main Street ${fromTown}, from the airport quay ${fromAirport}.`);
console.log(`Unreachable doors: ${report.doors.length}. Unreachable interactions: ${report.anchors.length}. Stranded patches ≥4 m²: ${report.stranded.length}.`);
for(const d of report.doors)console.log('  door',d.id,d.at,'gap',d.gap);
for(const a of report.anchors)console.log('  anchor',JSON.stringify(a.label),a.at,'gap',a.gap);
for(const s of report.stranded.slice(0,25))console.log('  stranded',s.area+' m²','at',s.centre);
const arg=k=>{const i=process.argv.indexOf(k);return i>0?process.argv[i+1]:null;};
if(arg('--json'))writeFileSync(arg('--json'),JSON.stringify(report,null,1));
if(arg('--png')){// A plain PPM: reached ground green, open but unreached red, blocked dark.
 const w=nx,h=nz,buf=Buffer.alloc(w*h*3);for(let j=0;j<h;j++)for(let i=0;i<w;i++){const k=j*nx+i,o=((h-1-j)*w+i)*3;const c=reached[k]?[90,170,90]:open[k]?[220,60,60]:[40,48,60];buf.set(c,o);}
 writeFileSync(arg('--png'),Buffer.concat([Buffer.from(`P6 ${w} ${h} 255\n`),buf]));}
