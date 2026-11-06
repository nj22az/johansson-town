/**
 * The town's one tree: a broadleaf drawn the way a toy-town game draws it.
 *
 * A short trunk that flares into roots, then a crown of a few rounded lobes covered in
 * leaf shingles: small pointed leaves laid over a dark core, each tipped down and out
 * like tiles on a roof, so the toon light catches their edges and the shadow between
 * them reads as depth. The crown's normals point out from the middle of the tree, so the
 * cel bands sweep across it as one round mass instead of breaking up leaf by leaf.
 *
 * One shape in three forms keeps every tree on the island from the same hand
 * (docs/AMPLIFY-AUDIT.md, §12): `round` for park and street trees, `column` for the
 * fukugi windbreaks, `spread` for the banyan's low canopy. The kit version merges into
 * the quarter's buckets; `broadleafGeometry` gives the same tree with vertex colours for
 * instanced rows.
 */
import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {trs,rng} from './kit.js';
import {TREE_REBUILD,treeDesignParts,treeDesignGeometry,treeBarkEnvelope} from '../tree-designs.js';

export const TREE_GREENS=Object.freeze({
 round:{light:0x72c04a,mid:0x48a23a,core:0x1f5226,bark:0x7a5638},
 column:{light:0x5a9e44,mid:0x3c7f37,core:0x173f20,bark:0x5a4632},
 spread:{light:0x62a646,mid:0x468a3d,core:0x2a5d2f,bark:0x7a6a56},
 hill:{light:0x5b9a45,mid:0x417f3a,core:0x26552c,bark:0x5f4a36},
});

/** Lobes of a unit crown (radius about 1 round the origin), per variant. */
const LOBES=[
 [[0,0,0,1],[.5,.18,.22,.68],[-.48,.12,-.28,.7],[.06,.46,-.08,.72],[-.2,-.05,.5,.62]],
 [[0,0,0,1],[-.52,.2,.16,.7],[.46,.1,-.3,.68],[.1,.5,.12,.7]],
 [[0,0,0,1],[.42,.26,-.36,.66],[-.36,.3,.32,.66],[.38,-.02,.44,.6],[-.1,.52,0,.64]],
];

const cache=new Map();
/**
 * The parts of one unit tree: `core` and two leaf layers make a crown of radius about
 * 1 round the origin; `trunk` runs from y 0 to 1 with its roots at the bottom.
 * `lite` lays fewer, larger leaves, for trees seen only from a distance.
 */
export function broadleafParts(variant=0,{lite=false}={}){
 variant=Math.abs(Math.floor(variant))%LOBES.length;
 const key=variant+(lite?':lite':'');
 if(cache.has(key))return cache.get(key);
 const lobes=LOBES[variant],r=rng(31+variant*7);
 const leaves=[[],[]],normals=[[],[]];
 const up=new THREE.Vector3(0,1,0),n=new THREE.Vector3(),d=new THREE.Vector3(),side=new THREE.Vector3(),c=new THREE.Vector3(),pt=new THREE.Vector3(),out=new THREE.Vector3();
 const density=lite?12:46;
 lobes.forEach(([cx,cy,cz,rad],li)=>{
  c.set(cx,cy,cz);
  const count=Math.round(density*rad*rad*(li?1:1.15));
  for(let i=0;i<count;i++){
   // Fibonacci points over the lobe, the underside left to the dark core.
   const t=(i+.5)/count,y=1-t*1.75;if(y<-1)continue;
   const ring=Math.sqrt(Math.max(0,1-y*y)),phi=i*2.39996+li;
   n.set(Math.cos(phi)*ring,y,Math.sin(phi)*ring).normalize();
   pt.copy(n).multiplyScalar(rad).add(c);
   // Leaves buried inside another lobe never show; skip them.
   if(lobes.some(([ox,oy,oz,orad],k)=>k!==li&&pt.distanceTo(out.set(ox,oy,oz))<orad*.9))continue;
   d.copy(up).multiplyScalar(-1).addScaledVector(n,n.y);if(d.lengthSq()<1e-4)d.set(1,0,0).cross(n);d.normalize();
   side.crossVectors(n,d).normalize();
   const L=(lite?.46:.25)*(.85+r.next()*.3)*(.75+rad*.25),W=L*.64,lift=.035;
   const base=pt.clone().addScaledVector(d,-L*.35),tip=pt.clone().addScaledVector(d,L*.65).addScaledVector(n,lift*1.6);
   const left=pt.clone().addScaledVector(side,W/2).addScaledVector(n,lift),right=pt.clone().addScaledVector(side,-W/2).addScaledVector(n,lift);
   const layer=r.next()<.55?0:1;
   // Out from the middle of the tree, a touch upward: the crown shades as one mass.
   const nn=out.copy(pt).normalize().multiplyScalar(.85).addScaledVector(up,.25).normalize();
   const tri=(a,b,e)=>{const face=new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(e,a));if(face.dot(n)<0)[b,e]=[e,b];leaves[layer].push(...a.toArray(),...b.toArray(),...e.toArray());for(let k=0;k<3;k++)normals[layer].push(nn.x,nn.y,nn.z);};
   tri(base,left,tip);tri(base,tip,right);
  }
 });
 const sheet=(pos,nor)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return g;};
 const core=mergeGeometries(lobes.map(([x,y,z,rad])=>{
  const g=new THREE.IcosahedronGeometry(1,lite?0:1);g.applyMatrix4(trs(x,y,z,0,0,0,rad*.94,rad*.9,rad*.94));
  // Radial normals from the tree's middle, like the leaves, so the core does not band separately.
  const p=g.attributes.position,nrm=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){out.set(p.getX(i),p.getY(i)*.8,p.getZ(i)).normalize();nrm.set([out.x,out.y,out.z],i*3);}
  g.setAttribute('normal',new THREE.BufferAttribute(nrm,3));g.deleteAttribute('uv');return g;
 }),false);
 // A trunk that thickens at the foot and splits into four or five roots on the ground.
 const bark=[new THREE.CylinderGeometry(.11,.15,.8,7,1,true).translate(0,.6,0),new THREE.CylinderGeometry(.15,.24,.22,7,1,true).translate(0,.11,0)];
 const roots=lite?0:5;
 for(let i=0;i<roots;i++){
  const a=i/roots*Math.PI*2+.4,len=.2+((i*37)%5)*.02;
  const g=new THREE.ConeGeometry(.075,len,5,1,true);g.rotateZ(-Math.PI/2+.32);g.translate(len*.42,.045,0);g.rotateY(a);bark.push(g);
 }
 const trunk=mergeGeometries(bark.map(g=>{const ng=g.index?g.toNonIndexed():g;ng.deleteAttribute('uv');return ng;}),false);
 const parts={core,light:sheet(leaves[0],normals[0]),mid:sheet(leaves[1],normals[1]),trunk};
 cache.set(key,parts);return parts;
}

/** Where the crown sits and how big it is, for a tree `h` tall of a given form. */
function frameFor(h,form,spread){
 // `tw` scales the unit trunk (.11 m at the top, .24 m at the foot) to the tree.
 if(form==='column')return {trunkH:h*.4,cy:h*.62,rx:h*.17*spread,ry:h*.34,tw:h/5*1.1};
 if(form==='spread')return {trunkH:h*.55,cy:h*.68,rx:h*.48*spread,ry:h*.27,tw:h/5*2};
 return {trunkH:h*.48,cy:h*.66,rx:h*.33*spread,ry:h*.3,tw:h/5*1.25};
}

/**
 * Adds a broadleaf to a kit at x,z: `h` metres tall. Returns a collider for its trunk.
 * `form`: 'round' | 'column' | 'spread'. `greens` overrides the form's palette.
 */
export function broadleaf(kit,x,z,{h=5,form='round',spread=1,seed=1,greens,lite=false,name='tree',rootLimit}={}){
 if(TREE_REBUILD){
  const family=form==='column'?'fukugi':form==='spread'?'banyan':'broadleaf',options={height:h,lod:lite?'far':'near',variant:Math.abs(Math.floor(seed))%3,rootLimit};
  const r=rng(seed),turn=r.next()*Math.PI*2;
  for(const part of treeDesignParts(family,options))kit.add(part.geometry,trs(x,0,z,0,turn,0,spread,1,spread),part.color);
  const bounds=treeBarkEnvelope(family,options),radius=Math.max(.22,...[bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ].map(v=>Math.abs(v)))*spread;
  return kit.rect(x-radius,x+radius,z-radius,z+radius,h,name);
 }
 const r=rng(seed),pal=greens||TREE_GREENS[form]||TREE_GREENS.round,parts=broadleafParts(seed,{lite});
 const f=frameFor(h,form,spread),turn=r.next()*Math.PI*2,lean=(r.next()-.5)*.08;
 kit.add(parts.trunk,trs(x,0,z,0,turn,lean,f.tw,f.trunkH,f.tw),pal.bark);
 const crown=trs(x+lean*f.trunkH,f.cy,z,0,turn,0,f.rx,f.ry,f.rx*(.92+r.next()*.12));
 kit.add(parts.core,crown,pal.core);kit.add(parts.mid,crown,pal.mid);kit.add(parts.light,crown,pal.light);
 const w=Math.max(.25,f.tw*.22);
 return kit.rect(x-w,x+w,z-w,z+w,h,name);
}

/**
 * The same tree as one geometry with vertex colours, for an InstancedMesh: one metre
 * tall, so scale an instance by the tree's height; the round form unless told otherwise.
 */
export function broadleafGeometry({form='round',variant=0,greens,lite=false}={}){
 if(TREE_REBUILD)return treeDesignGeometry(form==='column'?'fukugi':form==='spread'?'banyan':'broadleaf',{height:1,lod:lite?'far':'near',variant});
 const pal=greens||TREE_GREENS[form]||TREE_GREENS.round,parts=broadleafParts(variant,{lite}),f=frameFor(1,form,1);
 const crown=trs(0,f.cy,0,0,0,0,f.rx,f.ry,f.rx),colour=new THREE.Color();
 const paint=(g,m,hex)=>{const out=g.clone();out.applyMatrix4(m);colour.set(hex);const n=out.attributes.position.count,c=new Float32Array(n*3);for(let i=0;i<n;i++)c.set([colour.r,colour.g,colour.b],i*3);out.setAttribute('color',new THREE.BufferAttribute(c,3));return out;};
 return mergeGeometries([
  paint(parts.trunk,trs(0,0,0,0,0,0,f.tw,f.trunkH,f.tw),pal.bark),
  paint(parts.core,crown,pal.core),paint(parts.mid,crown,pal.mid),paint(parts.light,crown,pal.light),
 ],false);
}
