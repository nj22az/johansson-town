/**
 * Lays a district's ground from its plan (ground-plan.js): one merged mesh per class of the rulebook
 * (ground-standard.js), each in the rulebook's colour and finish with one shared material, and one mesh per kind of edge
 * (kerbs, stone edging, copings). Every slab is a solid with its sides, so a kerb's face, a ramp's flank and a quay's
 * edge are drawn, never a sheet floating over the plan.
 *
 * Step 2 of the owner's ground plan (21 October 2026: "Can you make a plan to finally fix the roads to a unified system?")
 * lays Main Street and the harbour with it; steps 3 and 4 hand it their districts' plans.
 */
import * as THREE from '../../vendor/three.module.js';
import {GROUND_CLASSES,GROUND_EDGE} from './ground-standard.js';
import {partitionPlan,layerTop,laidAt} from './ground-plan.js';
import {paintedAsphalt,paintedConcrete,paintedPaving,paintedGrit,paintedTurf} from '../render/toy-surfaces.js';
import {applyWorldUV} from '../render/world-uv.js';

/** How a class is finished: its painted picture (near-neutral, so the rulebook's colour sets the tone) and its scale. */
const FINISH={
 road:{map:paintedAsphalt,metres:4,roughness:.9},
 lane:{map:paintedAsphalt,metres:4,roughness:.9},
 pavers:{map:paintedPaving,metres:3,roughness:.95},
 concrete:{map:paintedConcrete,metres:2,roughness:.94},
 quay:{map:paintedConcrete,metres:2,roughness:.95},
 // The loose classes (step 3: Nishi-machi's coral yards, Kitahama's pads, the school's rolled paths, the grove).
 'coral-sand':{map:paintedGrit,metres:2.4,roughness:1},
 'park-path':{map:paintedGrit,metres:2,roughness:1},
 gravel:{map:paintedGrit,metres:1.6,roughness:1},
 earth:{map:paintedGrit,metres:1.2,roughness:1},
 // The same painted turf as the neighbourhood's and the yard's lawns, at their 6 m repeat.
 grass:{map:paintedTurf,metres:6,roughness:1},
};
/** The edges are plain precast concrete and stone in the rulebook's colours. */
const EDGE_COLOUR={kerb:GROUND_EDGE.kerb.colour,drop:GROUND_EDGE.kerb.colour,edging:GROUND_EDGE.edging.colour,'coral-edging':GROUND_EDGE.coralEdging.colour,coping:GROUND_EDGE.coping.colour};
/** Which mesh an edge goes into: a dropped kerb's ramp is the kerb's own precast. */
const EDGE_MESH={kerb:'kerb',drop:'kerb',edging:'edging','coral-edging':'coral-edging',coping:'coping'};
const EDGE_NAME={kerb:'Kerbs and dropped kerbs',edging:'Stone edging','coral-edging':'Coral-stone edging',coping:'Quay coping'};
/** What a merged class mesh is called when more than one layer went into it. */
const CLASS_NAME={road:'Carriageways',pavers:'Main Street footway',concrete:'Concrete paving',quay:'Quay paving',lane:'Back lanes',
 'coral-sand':'Coral yards','park-path':'Rolled paths',gravel:'Gravel yards',earth:'Garden earth'};
/** Road paint lies on the ground it marks, a few millimetres over it: a decal, never stood on and never fighting it. */
const PAINT_LIFT=.003;
/** How far a slab's sides go down: under any neighbour, so no gap shows at a step. */
const DEPTH=.3;

const materials=new Map();
/** The one material of a class (or an edge), shared by every district laid with it. */
export function groundMaterial(id){
 if(materials.has(id))return materials.get(id);
 const c=GROUND_CLASSES[id],f=FINISH[id];let m;
 if(c&&f){
  const map=f.map();m=new THREE.MeshStandardMaterial({color:c.colour,map,roughness:f.roughness,metalness:0,dithering:true});
  applyWorldUV(m,f.metres);
 }else m=new THREE.MeshStandardMaterial({color:id==='coping'?0xffffff:(EDGE_COLOUR[id]??c?.colour??0xffffff),roughness:.92,vertexColors:id==='coping'});
 m.name='ground:'+id;materials.set(id,m);return m;
}

/** A quad a,b,c,d, wound to face `out` (three.js draws the counter-clockwise side). */
function pushQuad(list,a,b,c,d,out){
 const u=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],v=[c[0]-a[0],c[1]-a[1],c[2]-a[2]];
 const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
 if(n[0]*out[0]+n[1]*out[1]+n[2]*out[2]<0)[b,d]=[d,b];
 list.positions.push(...a,...b,...c,...a,...c,...d);
}
/**
 * A slab: its top at the four corners (planar for a straight grade), and its sides where they show: down to the ground
 * beside it where that is lower (a kerb's face, a ramp's flank), to its foot where nothing of the plan is beside it, and
 * not at all where the neighbour stands as high (two slabs of one paving never show a face between them, and no face
 * lies in another's plane).
 * `sides` gives, for each side, the runs along it and what is beside each run: [{a, b, beside(x,z) | null}].
 */
function slab(list,x0,x1,z0,z1,top,foot,colour,sides=null){
 const start=list.positions.length/3;
 pushQuad(list,[x0,top(x0,z0),z0],[x0,top(x0,z1),z1],[x1,top(x1,z1),z1],[x1,top(x1,z0),z0],[0,1,0]);
 const wall=(p,q,out,beside)=>{
  // p, q: the side's two ends; the face runs from the slab's top down to what is beside it, or its foot.
  const tp=top(p[0],p[1]),tq=top(q[0],q[1]);
  let bp=foot,bq=foot;
  if(beside){bp=Math.min(tp,beside(p[0],p[1]));bq=Math.min(tq,beside(q[0],q[1]));if(tp-bp<1e-4&&tq-bq<1e-4)return;}
  pushQuad(list,[p[0],bp,p[1]],[q[0],bq,q[1]],[q[0],tq,q[1]],[p[0],tp,p[1]],out);
 };
 const runs=(side,a,b)=>sides?.[side]??[{a,b,beside:null}];
 for(const r of runs('z0',x0,x1))wall([r.a,z0],[r.b,z0],[0,0,-1],r.beside);
 for(const r of runs('z1',x0,x1))wall([r.a,z1],[r.b,z1],[0,0,1],r.beside);
 for(const r of runs('x0',z0,z1))wall([x0,r.a],[x0,r.b],[-1,0,0],r.beside);
 for(const r of runs('x1',z0,z1))wall([x1,r.a],[x1,r.b],[1,0,0],r.beside);
 if(colour!==undefined){const col=new THREE.Color(colour);for(let i=start;i<list.positions.length/3;i++)list.colours.push(col.r,col.g,col.b);}
}
/** For each side of a rectangle of a plan's partition, the runs along it and the top of whatever of the plan is beside each. */
function sidesOf(rects,r){
 const E=1e-6,out={};
 for(const [side,line,along,lo,hi] of [['z0',r.z0,'x',r.x0,r.x1],['z1',r.z1,'x',r.x0,r.x1],['x0',r.x0,'z',r.z0,r.z1],['x1',r.x1,'z',r.z0,r.z1]]){
  const touching=rects.filter(n=>n!==r&&(along==='x'?(side==='z0'?Math.abs(n.z1-line)<E:Math.abs(n.z0-line)<E)&&n.x1>lo+E&&n.x0<hi-E
   :(side==='x0'?Math.abs(n.x1-line)<E:Math.abs(n.x0-line)<E)&&n.z1>lo+E&&n.z0<hi-E));
  const cuts=[lo,hi];for(const n of touching){const a=along==='x'?n.x0:n.z0,b=along==='x'?n.x1:n.z1;if(a>lo&&a<hi)cuts.push(a);if(b>lo&&b<hi)cuts.push(b);}
  const pts=[...new Set(cuts.map(v=>+v.toFixed(6)))].sort((a,b)=>a-b),runs=[];
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],m=(a+b)/2;
   const n=touching.find(n=>along==='x'?n.x0<=m&&n.x1>=m:n.z0<=m&&n.z1>=m);
   runs.push({a,b,beside:n?(x,z)=>n.plan?layerTop(n.plan,n.layer,x,z):n.layer.top:null});}
  out[side]=runs;
 }
 return out;
}
function box(list,[x0,y0,z0],[x1,y1,z1],colour){slab(list,x0,x1,z0,z1,()=>y1,y0,colour);}

/**
 * The ground of one or more plans, laid as one mesh per class and per edge.
 * @returns {{group:THREE.Group,meshes:Map<string,THREE.Mesh>,setRain:(wet:boolean)=>void}}
 */
export function buildGround(parent,plans,{shadows=false,name='Ground'}={}){
 const group=new THREE.Group();group.name=name;parent.add(group);
 const lists=new Map(),list=id=>lists.get(id)??lists.set(id,{positions:[],colours:[],names:new Set()}).get(id);
 const paint={positions:[],colours:[]};
 // Every plan's pieces, so a slab's side stops at a neighbour laid by another plan as it does at its own plan's.
 const all=plans.flatMap(plan=>partitionPlan(plan).map(r=>({...r,plan})));
 for(const plan of plans){
  const rects=partitionPlan(plan);
  // A coping block beside a slab hides its side as a neighbouring slab does.
  const blockRects=(plan.blocks||[]).map(b=>({x0:b.min[0],x1:b.max[0],z0:b.min[2],z1:b.max[2],layer:{top:b.max[1]}}));
  for(const r of rects){
   // A layer another module draws (a U-gutter, okinawa/lane-edges.js) owns its ground in the plan, so nothing is laid
   // under or over it and its neighbours' sides stop at it, but it is not drawn here.
   if(r.layer.drawnBy)continue;
   const l=r.layer,id=l.edge?EDGE_MESH[l.cls]:l.cls,top=(x,z)=>layerTop(plan,l,x,z);
   const lowest=Math.min(top(r.x0,r.z0),top(r.x1,r.z0),top(r.x0,r.z1),top(r.x1,r.z1));
   const L=list(id);L.names.add(l.name);
   slab(L,r.x0,r.x1,r.z0,r.z1,top,lowest-(l.depth??DEPTH),id==='coping'?GROUND_EDGE.coping.legacy[0]:undefined,sidesOf([...all,...blockRects],r));
  }
  for(const b of plan.blocks||[]){const L=list(EDGE_MESH[b.cls]??b.cls);L.names.add(b.name);box(L,b.min,b.max,b.colour);}
  // The paint: flat quads on the laid top, in their own colours, as one decal.
  for(const m of plan.marks||[]){
   const top=(x,z)=>(laidAt(plan,x,z)?.y??0)+PAINT_LIFT,col=new THREE.Color(m.colour??GROUND_EDGE.paint.colours[0]);
   const a=[m.x0,top(m.x0,m.z0),m.z0],b=[m.x0,top(m.x0,m.z1),m.z1],c=[m.x1,top(m.x1,m.z1),m.z1],d=[m.x1,top(m.x1,m.z0),m.z0];
   pushQuad(paint,a,b,c,d,[0,1,0]);for(let i=0;i<6;i++)paint.colours.push(col.r,col.g,col.b);
  }
 }
 const meshes=new Map();
 for(const [id,L] of lists){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(L.positions,3));
  if(L.colours.length)g.setAttribute('color',new THREE.Float32BufferAttribute(L.colours,3));
  g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  // Named for what it is, so the audit (tools/ground-audit.mjs) and the tests can find it: the pavers are Main Street's
  // footway and only that, the quay's paving is the quay's.
  const mesh=new THREE.Mesh(g,groundMaterial(id));
  mesh.name=EDGE_NAME[id]??(L.names.size===1?[...L.names][0]:CLASS_NAME[id]??'Ground: '+id);
  mesh.userData.groundClass=id;mesh.receiveShadow=true;mesh.castShadow=shadows&&!GROUND_CLASSES[id];
  group.add(mesh);meshes.set(id,mesh);
 }
 if(paint.positions.length){
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(paint.positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(paint.colours,3));
  g.computeVertexNormals();g.computeBoundingSphere();
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  mesh.name=name+' paint';mesh.renderOrder=1;mesh.receiveShadow=true;mesh.userData.walkSurface=false;mesh.userData.groundMarking=true;
  group.add(mesh);meshes.set('paint',mesh);
 }
 return {group,meshes,setRain(wet){for(const id of ['road','lane','quay','pavers','concrete']){const m=materials.get(id);if(m)m.roughness=wet?.32:FINISH[id].roughness;}}};
}
