import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {rng} from './kit.js';
import {GUTTER,gutterRings as ringsOf,openEdgeRuns as edgeRuns,LANE_WEAR,LANE_STAINS} from './lane-edge-plan.js';
import {quarterPaved,quarterGutterRuns,KITAHAMA_EXTRA_LANES} from '../ground-plan-quarters.js';
import {KITAHAMA_LANES} from '../kitahama-layout.js';
export {GUTTER,LANE_WEAR,LANE_STAINS};
const LANES=[...KITAHAMA_LANES,...KITAHAMA_EXTRA_LANES];
/** The walled plots' rings against every Kitahama lane, as the ground plan lays them (lane-edge-plan.js gutterRings). */
export const gutterRings=(lots=[])=>ringsOf(lots,{lanes:LANES});

/**
 * The edge of every lane in Kitahama, one way everywhere (the owner, 19 October 2026: "we need a coherent look for
 * the roads on the island").
 *
 * Kitahama's walled plots stand half a metre in from the paving (the building circuits in architecture-plan.js run
 * 1.5 m out, 2 m wide), and that half metre was lawn: a lime verge at the foot of every wall. An Okinawan lane has a
 * U-gutter (U字溝) there instead, under grey concrete lids, and a line of weeds where the gutter meets the wall. So
 * every walled plot on the grid gets the same ring, from the paving inwards:
 *
 *   the gutter, 0.3 m: concrete lids 0.6 m long on a dark channel, a steel grating across each gate and every
 *     few lengths, its top 68 mm up (28 mm over the lane, a lid's lip);
 *   a strip of earth, 0.1 m (0.2 m where no wall stands), with the weeds growing out of it at the wall's foot.
 *
 * Where a lane's edge meets open ground instead (a field, a lot waiting for its use, the island's edge), the same
 * gutter and earth strip run along the outside of the edge (openEdgeRuns). The rings follow the plot data, so a
 * plot added or taken away takes its ring with it, and the open edges close round whatever is left.
 *
 * The lanes carry their wear: two faint tyre lines down the cross lane and the spine (the rubbish truck on Tuesdays
 * and Fridays, the postman's Cub, the cane lorry in January) and a few stains, each where something drips.
 */

/** The open edges of Kitahama's lanes beside the ground the plans lay (lane-edge-plan.js openEdgeRuns). */
export const openEdgeRuns=(rings=gutterRings())=>edgeRuns(rings,{paved:quarterPaved,lanes:LANES});

/** Lays every ring into the quarter's kit, and the weeds and the wear as their own meshes under `group`. */
export function buildLaneEdges(kit,group,{stains=[]}={}){
 // Every gutter the ground plans lay (ground-plan-quarters.js): Kitahama's rings and open edges, Nishi-machi's lanes.
 const G=GUTTER,runs=quarterGutterRuns(),r=rng(401),lidTints=[0xa3a198,0x9a988f,0xaaa89f,0x9f9c92];
 const tufts=[];
 for(const run of runs){
  const along=run.axis==='x',B=run.band,len=along?B.maxX-B.minX:B.maxZ-B.minZ,start=along?B.minX:B.minZ;
  const at=(u0,u1,v0,v1)=>along?[u0,u1,v0,v1]:[v0,v1,u0,u1];
  const [v0,v1]=along?[B.minZ,B.maxZ]:[B.minX,B.maxX];
  // The channel, dark, seen through the joints; the lids over it; a grating at every gate and every few lids.
  {const [x0,x1,z0,z1]=at(start,start+len,v0,v1);kit.block(x0,x1,.015,G.channel,z0,z1,0x46443f);}
  const n=Math.max(1,Math.round(len/G.lid)),step=len/n,gateMid=run.gates.map(([a,b])=>(a+b)/2);
  for(let i=0;i<n;i++){
   const u0=start+i*step+G.joint/2,u1=start+(i+1)*step-G.joint/2,mid=(u0+u1)/2;
   const grating=gateMid.some(g=>Math.abs(g-mid)<step/2)||(i%G.gratingEvery===3);
   const [x0,x1,z0,z1]=at(u0,u1,v0+.012,v1-.012);
   if(grating){
    kit.block(x0,x1,G.channel,G.top-.006,z0,z1,0x4d5154,'metal');
    for(let k=1;k<6;k++){const u=u0+(u1-u0)*k/6;const [a0,a1,c0,c1]=at(u-.012,u+.012,v0+.03,v1-.03);kit.block(a0,a1,G.top-.006,G.top,c0,c1,0x6a6f72,'metal');}
   }else kit.block(x0,x1,G.channel,G.top,z0,z1,lidTints[(i*7+Math.round(start*3))%lidTints.length]);
  }
  // The strip of earth, and the weeds out of it, except across a gate.
  const S=run.soil;if(!S)continue;kit.block(S.minX,S.maxX,.015,G.soilTop,S.minZ,S.maxZ,0x6f6048);
  const s0=along?S.minX:S.minZ,s1=along?S.maxX:S.maxZ;
  for(let u=s0+.08;u<s1-.05;u+=.2+r.next()*.14){
   if(run.gates.some(([a,b])=>u>a-.12&&u<b+.12))continue;
   const w=run.weedLine+(r.next()-.5)*.05,[x,z]=along?[u,w]:[w,u];
   tufts.push([x,z,.07+r.next()*(run.walled?.16:.1),r.next()]);
  }
 }
 const weeds=weedMesh(tufts);weeds.name='Kitahama lane-edge weeds';group.add(weeds);
 const wear=wearMesh([...LANE_STAINS,...stains]);group.add(...wear);
 return {runs,weeds,wear,tufts:tufts.length};
}

/** The weeds: low tufts of grass and the odd yellow-flowered one, one merged mesh kept off the walking surface. */
function weedMesh(tufts){
 const colour=new THREE.Color(),parts=[],palette=[0x5e8c3a,0x4f7d34,0x6f9a44,0x7a8f3e];
 const paint=(g,hex)=>{const out=g.index?g.toNonIndexed():g;out.deleteAttribute('uv');colour.set(hex);const n=out.attributes.position.count,c=new Float32Array(n*3);for(let i=0;i<n;i++)c.set([colour.r,colour.g,colour.b],i*3);out.setAttribute('color',new THREE.BufferAttribute(c,3));return out;};
 // Two blades of three facets a tuft: about twelve triangles, so a whole quarter of weeds stays light on a phone.
 const blade=new THREE.ConeGeometry(.055,1,3,1,true).translate(0,.5,0);
 for(const [x,z,h,u] of tufts){
  for(let k=0;k<2;k++){const a=u*6+k*2.6,t=.2+k*.1;parts.push(paint(blade.clone().scale(1,h*(1-k*.18),1).rotateZ(Math.cos(a)*t).rotateX(Math.sin(a)*t).translate(x+Math.cos(a)*.03,GUTTER.soilTop,z+Math.sin(a)*.03),palette[(Math.floor(u*16)+k)%palette.length]));}
  if(u>.86){const f=new THREE.SphereGeometry(.022,5,3).translate(x,GUTTER.soilTop+h*.9,z);parts.push(paint(f,0xe8c73a));}
 }
 const geometry=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());blade.dispose();geometry.computeVertexNormals();
 const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95}));
 mesh.userData.walkSurface=false;mesh.receiveShadow=true;return mesh;
}

/** Tyre lines and stains: decals a few millimetres over the lane, offset so they never fight it. */
function wearMesh(stainList){
 const decal=opacity=>new THREE.MeshStandardMaterial({color:0x3a3730,roughness:1,transparent:true,opacity,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
 const y=.043,strips=[];
 for(const w of LANE_WEAR)for(const off of [-.62,.62]){
  // Broken where the wheels wander, so the line reads as wear and not as paint.
  const r=rng(Math.round(w.at*13+off*7));
  for(let u=w.from;u<w.to;){const len=2+r.next()*5,gap=r.next()<.3?.6+r.next()*1.5:0,end=Math.min(w.to,u+len);
   const g=new THREE.PlaneGeometry(end-u,.28+r.next()*.06).rotateX(-Math.PI/2).translate((u+end)/2,y,w.at+off+(r.next()-.5)*.08);strips.push(g);u=end+gap;}
 }
 const tracks=new THREE.Mesh(mergeGeometries(strips,false),decal(.07));tracks.name='Kitahama lane tyre wear';strips.forEach(g=>g.dispose());
 const blots=stainList.map((s,i)=>new THREE.CircleGeometry(1,14).scale(s.r,s.r*(.6+(i%3)*.15),1).rotateX(-Math.PI/2).rotateY(i*.7).translate(s.x,y+.001,s.z));
 const stains=new THREE.Mesh(mergeGeometries(blots,false),decal(.13));stains.name='Kitahama lane stains';blots.forEach(g=>g.dispose());
 for(const m of [tracks,stains]){m.receiveShadow=true;m.userData.walkSurface=false;m.renderOrder=1;}
 return [tracks,stains];
}
