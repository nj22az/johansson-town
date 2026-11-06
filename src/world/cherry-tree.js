import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {rng,trs} from './okinawa/kit.js';
import {townCalendarAt} from '../town-clock.js';

/**
 * The harbour cherry: a kanhizakura (緋寒桜), Okinawa's cherry, which is not the mainland's. It flowers in the middle
 * of the island winter, deep pink bells hanging in clusters before the leaves, from late January through February;
 * it drops its leaves in December, stands bare into January, and is an ordinary green tree from March to November.
 * In October it is green. (It was a pink ball in bloom all year: the town's broadleaf in a blossom palette.)
 *
 * Built as a tree is drawn in a hand-painted background: a short trunk that forks into a few limbs, each limb ending
 * in a cluster of rounded lobes, so the crown reads as clumps with sky between them rather than one sphere. The lobes'
 * normals point out from the middle of their clump, so the toon bands sweep across each clump as one mass. Every
 * season is one merged mesh in vertex colour with one shared material; the season shows one of them.
 */
export const CHERRY_SEASONS=Object.freeze([
 Object.freeze({id:'bloom',from:[1,20],to:[2,29],what:'deep pink bells in clusters, before the leaves'}),
 Object.freeze({id:'leaf',from:[3,1],to:[11,30],what:'green, an ordinary shade tree over the bench'}),
 Object.freeze({id:'turning',from:[12,1],to:[12,31],what:'the leaves thin, yellow and red, and fall'}),
 Object.freeze({id:'bare',from:[1,1],to:[1,19],what:'bare branches, the buds swelling'}),
]);
/** The cherry's season on the town's date (month 1–12). */
export function cherrySeason(minutes){
 const d=townCalendarAt(minutes).date,md=(d.getMonth()+1)*100+d.getDate();
 return CHERRY_SEASONS.find(s=>md>=s.from[0]*100+s.from[1]&&md<=s.to[0]*100+s.to[1])?.id||'leaf';
}

const PALETTE=Object.freeze({
 bark:0x5e4636,barkLight:0x76594a,
 leaf:[0x3d7a39,0x52903f,0x6aa84a],
 bloom:[0xb8306a,0xd94f86,0xf28ab2],
 turning:[0x9a7a2e,0xc9953a,0xc8592f],
});

/** Limbs of the unit tree: from a fork point to a crown cluster [x,y,z, radius]. Height about 1. */
const LIMBS=[
 {from:[0,.34,0],to:[.36,.62,.1],cluster:[.42,.7,.12,.24]},
 {from:[0,.34,0],to:[-.3,.66,.2],cluster:[-.36,.74,.24,.22]},
 {from:[0,.38,0],to:[.06,.72,-.32],cluster:[.08,.8,-.36,.23]},
 {from:[0,.4,0],to:[-.12,.82,-.04],cluster:[-.1,.9,-.02,.24]},
 {from:[.2,.5,.06],to:[.26,.86,.32],cluster:[.24,.92,.34,.18]},
];

function paint(g,hex){
 const out=g.index?g.toNonIndexed():g;if(out.attributes.uv)out.deleteAttribute('uv');
 const c=new THREE.Color(hex),n=out.attributes.position.count,a=new Float32Array(n*3);
 for(let i=0;i<n;i++)a.set([c.r,c.g,c.b],i*3);out.setAttribute('color',new THREE.BufferAttribute(a,3));return out;
}
/** A clump of lobes round a centre, its normals radial from the clump, its top a lighter tone than its underside. */
function clump(cx,cy,cz,r,tones,r0,{lobes=5,fill=1,flower=false}){
 const parts=[],out=new THREE.Vector3(),up=new THREE.Vector3(0,1,0);
 for(let i=0;i<lobes;i++){
  if(r0.next()>fill)continue;
  const a=i/lobes*Math.PI*2+r0.next(),rad=r*(.35+r0.next()*.35),lr=r*(.45+r0.next()*.25);
  const x=cx+Math.cos(a)*rad,y=cy+(r0.next()-.35)*r*.5,z=cz+Math.sin(a)*rad;
  const g=new THREE.IcosahedronGeometry(1,1).applyMatrix4(trs(x,y,z,0,r0.next()*3,0,lr,lr*(flower?.85:.82),lr));
  const p=g.attributes.position,nrm=new Float32Array(p.count*3),col=new Float32Array(p.count*3),c=new THREE.Color();
  for(let k=0;k<p.count;k++){
   out.set(p.getX(k)-cx,(p.getY(k)-cy)*1.4,p.getZ(k)-cz).normalize().multiplyScalar(.8).addScaledVector(up,.25).normalize();nrm.set([out.x,out.y,out.z],k*3);
   const h=(p.getY(k)-(cy-r))/(2*r);c.set(tones[h>.62?2:h>.3?1:0]);col.set([c.r,c.g,c.b],k*3);
  }
  g.setAttribute('normal',new THREE.BufferAttribute(nrm,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));g.deleteAttribute('uv');
  parts.push(g.index?g.toNonIndexed():g);
 }
 // The centre lobe closes the clump.
 const g=new THREE.IcosahedronGeometry(1,1).applyMatrix4(trs(cx,cy+r*.08,cz,0,0,0,r*.62,r*.6,r*.62));parts.push(paint(g,tones[1]));
 return parts;
}

/**
 * The tree, height 1 (scale it to the tree): `bark` always shown (trunk, limbs and twigs) and one crown per season.
 * The geometry is the same every visit: a fixed seed, as every tree in the town.
 */
export function cherryGeometries({seed=7}={}){
 const r=rng(seed),bark=[];
 const limb=(a,b,ra,rb)=>{const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),d=bv.clone().sub(av),len=d.length();
  const g=new THREE.CylinderGeometry(rb,ra,len,6,1,true).applyMatrix4(new THREE.Matrix4().compose(av.clone().add(bv).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()),new THREE.Vector3(1,1,1)));bark.push(paint(g,PALETTE.bark));};
 // Trunk with a slight lean, the root flare, then the limbs and two twigs off each.
 limb([0,0,0],[.02,.36,0],.055,.04);bark.push(paint(new THREE.CylinderGeometry(.06,.09,.06,7,1,true).translate(0,.03,0),PALETTE.barkLight));
 for(const L of LIMBS){
  limb(L.from,L.to,.03,.016);
  for(let k=0;k<3;k++){const t=L.to,c=L.cluster,ang=k*2.2+r.next();limb(t,[c[0]+Math.cos(ang)*c[3]*.8,c[1]+(r.next()-.2)*c[3]*.6,c[2]+Math.sin(ang)*c[3]*.8],.012,.005);}
 }
 const crowns={};
 for(const [id,tones,opts] of [['leaf',PALETTE.leaf,{lobes:6,fill:1}],['bloom',PALETTE.bloom,{lobes:6,fill:.92,flower:true}],['turning',PALETTE.turning,{lobes:4,fill:.6}]]){
  const rr=rng(seed+(id==='leaf'?0:id==='bloom'?11:23)),parts=[];
  for(const L of LIMBS){const [x,y,z,rad]=L.cluster;parts.push(...clump(x,y,z,id==='turning'?rad*.8:rad,tones,rr,opts));}
  // Between the limbs' clumps, a few smaller ones, so the crown is a canopy and not five balls.
  for(const [x,y,z,rad] of [[.12,.78,.22,.15],[-.24,.82,-.22,.15],[.3,.78,-.18,.14]])parts.push(...clump(x,y,z,id==='turning'?rad*.7:rad,tones,rr,{...opts,lobes:4}));
  crowns[id]=mergeGeometries(parts,false);parts.forEach(p=>p.dispose());
 }
 return {bark:mergeGeometries(bark,false),...crowns};
}

/**
 * The cherry as two meshes with one shared vertex-colour material, as the park's draw budget allows: `blossom` (the
 * branches in flower) and `leaf`, which wears the season's other dress: green leaves, the turning leaves of December,
 * or bare branches in early January.
 */
export function buildCherryTree({scale=6.2,shadows=false,seed=7,name='Harbour Park cherry'}={}){
 const geo=cherryGeometries({seed}),material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85});
 const dresses={leaf:mergeGeometries([geo.bark,geo.leaf],false),turning:mergeGeometries([geo.bark,geo.turning],false),bare:geo.bark,bloom:mergeGeometries([geo.bark,geo.bloom],false)};
 const group=new THREE.Group();group.name=name;group.scale.setScalar(scale);
 const mesh=(g,label)=>{const m=new THREE.Mesh(g,material);m.name=name+' '+label;m.castShadow=shadows;m.receiveShadow=true;group.add(m);return m;};
 const meshes={leaf:mesh(dresses.leaf,'leaf'),blossom:mesh(dresses.bloom,'blossom')};
 let season=null;
 const setSeason=id=>{season=id;meshes.blossom.visible=id==='bloom';meshes.leaf.visible=id!=='bloom';if(id!=='bloom'){meshes.leaf.geometry=dresses[id];}};
 return {group,meshes,dresses,setSeason,dress:minutes=>setSeason(cherrySeason(minutes)),get season(){return season;}};
}
