import * as THREE from '../../../vendor/three.module.js';
import {mergeGeometries} from '../../../vendor/BufferGeometryUtils.js';
import {shopProductTemplate} from '../../commerce/shop-product.js';
import {STORE_BRANDS} from '../../commerce/brands.js';
import {packagingSlot,ATLAS_COLS,ATLAS_ROWS,ATLAS_SPAN} from './store-advertising.js';

const cache=new Map();
const FOODS=new Set(['rice','bento','sandwich','bun','pudding','yogurt','noodles']);
/** Foods use the same atlas and the same facing envelope as their original packs.
 * Clear wrappers are separate so the shop can instance them with one shared material.
 * Bounds intentionally retain the original envelope: stocking and reach positions
 * must not change when a packet gains visible food inside it.
 */
/** A geometry without its downward faces at its lowest level (within 4 mm of it). */
function withoutBase(g){
 const p=g.attributes.position,keep=[],a=new THREE.Vector3(),b=new THREE.Vector3(),c=new THREE.Vector3(),n=new THREE.Vector3();
 let low=Infinity;for(let i=0;i<p.count;i++)low=Math.min(low,p.getY(i));
 for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);
  n.subVectors(b,a).cross(c.clone().sub(a)).normalize();if(!(n.y<-.9&&Math.max(a.y,b.y,c.y)<low+.004))keep.push(i);}
 const out=new THREE.BufferGeometry();
 for(const [name,attr] of Object.entries(g.attributes)){const s=attr.itemSize,v=new attr.array.constructor(keep.length*3*s);
  keep.forEach((i,k)=>{for(let j=0;j<3*s;j++)v[k*3*s+j]=attr.array[i*s+j];});out.setAttribute(name,new THREE.BufferAttribute(v,s));}
 g.dispose();return out;
}
export function sakuraProductTemplate(id){
 if(cache.has(id))return cache.get(id);
 const original=shopProductTemplate(id);
 if(!FOODS.has(id)&&!['coffee','beer'].includes(id))return original;
 const brand=STORE_BRANDS[id==='bun'?'buns':id],parts=[],prints=[],wrappers=[],components=[],labelSurfaces=[];
 function append(list,geometry,name,color,pos=[0,0,0]){
  let g=geometry.index?geometry.toNonIndexed():geometry;
  if(g!==geometry)geometry.dispose();g.translate(...pos);
  if(color!=null){const c=new THREE.Color(color),values=new Float32Array(g.attributes.position.count*3);for(let i=0;i<values.length;i+=3)values.set(c.toArray(),i);g.setAttribute('color',new THREE.BufferAttribute(values,3));}
  if(list===parts)components.push({name,start:parts.reduce((n,p)=>n+p.attributes.position.count,0),count:g.attributes.position.count});
  list.push(g);return g;
 }
 const part=(g,color,pos,name)=>append(parts,g,name,color,pos);
 const box=(w,h,d,pos,color,name)=>part(new THREE.BoxGeometry(w,h,d),color,pos,name);
 // The small packs repeat across hundreds of facings. Eight-sided cups and
 // lens-shaped grains keep their silhouettes without spending hidden triangles.
 const cylinder=(rt,rb,h,pos,color,name)=>part(new THREE.CylinderGeometry(rt,rb,h,8),color,pos,name);
 const ellipsoid=(scale,pos,color,name,segments=8,rings=4)=>part(new THREE.SphereGeometry(1,segments,rings).scale(...scale),color,pos,name);
 const grain=(scale,pos,color,name)=>part(new THREE.OctahedronGeometry(1).scale(...scale),color,pos,name);
 function triangle(points,depth){const shape=new THREE.Shape();shape.moveTo(...points[0]);for(const p of points.slice(1))shape.lineTo(...p);shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1}).translate(0,0,-depth/2);}
 function label(geometry,pos,name){
  const g=append(prints,geometry,name,null,pos),uv=g.attributes.uv,slot=packagingSlot(id);
  for(let i=0;i<uv.count;i++)uv.setXY(i,(slot%ATLAS_COLS+.025+uv.getX(i)*.95)/ATLAS_SPAN,1-(Math.floor(slot/ATLAS_COLS)+.025+(1-uv.getY(i))*.95)/ATLAS_ROWS);
  labelSurfaces.push({name,start:prints.slice(0,-1).reduce((n,p)=>n+p.attributes.position.count,0),count:g.attributes.position.count});
 }
 const topLabel=(r,y,name)=>label(new THREE.CircleGeometry(r,8).rotateX(-Math.PI/2),[0,y,0],name);
 const frontLabel=(w,h,pos,name)=>label(new THREE.PlaneGeometry(w,h),pos,name);
 // The clear film has no underside: it rests on the shelf with the pack, where its base lay a millimetre or two off the
 // pack's own and fought it, and nobody sees under a pack on a shelf (the Sakura surface audit, SK-ZF rev A).
 const wrap=(g,pos=[0,0,0])=>append(wrappers,withoutBase(g.index?g.toNonIndexed():g),'clear wrapping',null,pos);
 function band(topRadius,bottomRadius,height,centre,fullHeight,start=-Math.PI*.48,length=Math.PI*.96){
  const radiusAt=y=>bottomRadius+(topRadius-bottomRadius)*y/fullHeight;
  label(new THREE.CylinderGeometry(radiusAt(centre+height/2)+.0008,radiusAt(centre-height/2)+.0008,height,8,1,true,start,length),[0,centre,0],'brand cup band');
 }

 if(id==='rice'){
  const outline=[[-.066,.003],[.066,.003],[0,.114]];
  part(triangle(outline,.056),0xf6f1dd,[0,0,0],'triangular rice');
  // Individual grains break up the rice face while staying inside the wrapper.
  for(let row=0;row<4;row++)for(let col=0;col<5-row;col++){
   const y=.067+row*.011,x=(col-(4-row)/2)*.012;
   grain([.0034,.0017,.0011],[x,y,.0286],col%2?0xe5dfca:0xfffae9,'rice grain');
  }
  box(.063,.057,.004,[0,.031,.031],0x293d2e,'nori front');
  box(.063,.057,.004,[0,.031,-.031],0x293d2e,'nori back');
  // The folded base runs between the two nori sheets, not under them; the label is printed straight on the film.
  box(.063,.003,.058,[0,.0015,0],0x293d2e,'folded nori base');
  frontLabel(.052,.022,[0,.029,.0335],'onigiri front label');
  wrap(triangle([[-.069,.001],[.069,.001],[0,.118]],.074));
  box(.008,.003,.004,[0,.119,0],brand.accent,'wrapper tear tab');
 }else if(id==='bento'){
  box(.190,.008,.132,[0,.004,0],0x292b26,'bento tray base');
  // The long rims stop at the end rims (butt joints): crossing them, their ends lay in the end rims' faces.
  for(const z of [-.064,.064])box(.184,.030,.004,[0,.023,z],0x32372c,'bento tray rim');
  for(const x of [-.094,.094])box(.004,.030,.132,[x,.023,0],0x32372c,'bento tray rim');
  box(.004,.023,.122,[0,.020,0],0x32372c,'compartment divider');
  box(.086,.023,.004,[.047,.020,.010],0x32372c,'compartment divider');
  box(.080,.014,.112,[-.047,.016,0],0xf2edd8,'rice bed');
  for(let row=0;row<5;row++)for(let col=0;col<4;col++)grain([.0045,.002,.0025],[-.077+col*.019,.024,-.045+row*.022],col%2?0xe6dfca:0xfff8e9,'bento rice grain');
  ellipsoid([.010,.005,.010],[-.046,.029,.001],0xb84440,'plum pickle');
  for(const z of [-.040,-.014]){
   box(.059,.014,.021,[.047,.020,z],0x9d6236,'grilled protein');
   for(const x of [.028,.047,.066])box(.003,.003,.019,[x,.028,z],0x5d3a28,'grill mark');
  }
  for(const z of [.024,.043])box(.029,.018,.015,[.065,.022,z],0xe6c359,'rolled egg');
  for(const x of [.018,.031])ellipsoid([.007,.006,.014],[x,.021,.036],0x668643,'greens',6,3);
  for(const z of [.025,.044])box(.011,.012,.014,[.045,.020,z],0xe4953d,'pickled vegetable');
  // A narrow sleeve identifies the meal without hiding the compartments.
  box(.042,.003,.128,[.005,.052,0],brand.paper,'bento paper sleeve');
  label(new THREE.PlaneGeometry(.124,.040).rotateX(-Math.PI/2).rotateY(Math.PI/2),[.005,.0545,0],'bento lid sleeve');
  wrap(new THREE.BoxGeometry(.192,.008,.134),[0,.044,0]);// the film 2.5 mm under the sleeve
 }else if(id==='sandwich'){
  const crust=[[-.064,.012],[.064,.012],[0,.125]],crumb=[[-.057,.018],[.057,.018],[0,.116]];
  // The crust is a ring round the crumb, the two flush on the cut face: a crumb laid over the crust fought it 0.4 mm away.
  const ring=new THREE.Shape(crust.map(p=>new THREE.Vector2(...p))),hole=new THREE.Path(crumb.map(p=>new THREE.Vector2(...p)));ring.holes.push(hole);
  for(const z of [-.0175,.0175]){
   part(new THREE.ExtrudeGeometry(ring,{depth:.010,bevelEnabled:false,steps:1}).translate(0,0,-.005),0xb9834b,[0,0,z],'bread crust');
   part(triangle(crumb,.010),0xf7edd2,[0,0,z],'bread crumb');
  }
  part(triangle([[-.059,.015],[.059,.015],[0,.117]],.019),0xecd274,[0,0,0],'egg filling');
  for(const z of [-.011,.011])part(triangle([[-.058,.015],[.058,.015],[0,.115]],.002),0x769451,[0,0,z],'lettuce filling');
  // Labels are printed on the film itself, front and back.
  frontLabel(.040,.025,[0,.035,.0262],'sandwich front label');
  label(new THREE.PlaneGeometry(.040,.025).rotateY(Math.PI),[0,.035,-.0262],'sandwich back label');
  wrap(triangle([[-.0705,.010],[.0705,.010],[0,.1315]],.052));// over 3 mm clear of the crust all round
 }else if(id==='bun'){
  box(.105,.002,.086,[0,.001,0],0xf1ead7,'steamer paper square');
  part(new THREE.CylinderGeometry(.053,.049,.019,10).scale(1,1,.79),0xeee0bd,[0,.0115,0],'bun base');
  part(new THREE.SphereGeometry(1,10,5,0,Math.PI*2,0,Math.PI/2).scale(.055,.063,.041),0xf5e9c8,[0,.021,0],'round steamed bun');
  for(let i=0;i<6;i++){
   const angle=i*Math.PI/3,start=new THREE.Vector3(0,.084,0),end=new THREE.Vector3(Math.cos(angle)*.039,.059,Math.sin(angle)*.030),delta=end.clone().sub(start);
   const ridge=new THREE.CylinderGeometry(.0011,.0018,delta.length(),3);ridge.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.clone().normalize()));
   part(ridge,0xdfcfaa,start.clone().add(end).multiplyScalar(.5).toArray(),'bun pleat');
  }
  frontLabel(.062,.018,[0,.010,.0435],'bun base label');
 }else if(id==='pudding'||id==='yogurt'){
  const yogurt=id==='yogurt',r=yogurt?.048:.038,h=yogurt?.078:.062,rb=r*.76;
  if(yogurt){
   cylinder(r-.002,rb-.002,h-.009,[0,(h-.009)/2+.002,0],0xf3f0df,'yogurt cream');
   cylinder(rb+.001,rb,.011,[0,.0055,0],0x729789,'yogurt cup foot');
  }else{
   cylinder(rb+.001,rb-.001,.010,[0,.005,0],0x9b5529,'caramel layer');
   cylinder(r-.002,rb+.001,h-.016,[0,.010+(h-.016)/2,0],0xf0d591,'custard layer');
  }
  const lidRadius=r+.0025;
  cylinder(lidRadius,lidRadius,.002,[0,h+.001,0],0xddd9c8,'foil lid');
  part(new THREE.TorusGeometry(r+.001,.001,3,8).rotateX(Math.PI/2),0xb8bdb4,[0,h+.0015,0],'rolled foil rim');
  topLabel(r-.003,h+.0025,'printed foil lid');
  band(r,rb,yogurt?.032:.020,yogurt?.039:.034,h);
  wrap(new THREE.CylinderGeometry(r+.0002,rb+.0002,h,8,1,true),[0,h/2,0]);
 }else if(id==='noodles'){
  // Built in courses, each starting where the last ends: the foot, the cup on it, the rim flange on the cup and the
  // foil inside the flange, flush with it; the tab lifts 3 mm off the foil (the Sakura surface audit, SK-ZF rev A).
  cylinder(.053,.053,.004,[0,.002,0],0xbbb8a3,'cup foot');
  cylinder(.067,.0525,.124,[0,.066,0],brand.paper,'tapered ramen cup');
  part(new THREE.CylinderGeometry(.070,.070,.003,8,1,true),brand.accent,[0,.1295,0],'ramen lid rim');
  part(new THREE.RingGeometry(.0675,.070,8).rotateX(-Math.PI/2),brand.accent,[0,.131,0],'ramen lid rim');
  part(new THREE.RingGeometry(.067,.070,8).rotateX(Math.PI/2),brand.accent,[0,.128,0],'ramen lid rim');
  part(new THREE.CircleGeometry(.0675,8).rotateX(-Math.PI/2),0xf2dfb5,[0,.131,0],'foil lid');
  band(.067,.052,.105,.065,.128);
  topLabel(.065,.1315,'ramen lid print');
  box(.010,.003,.011,[.062,.1325,-.022],brand.ink,'ramen pull tab');
 }else{
  // Existing can art and silhouette remain, with the opening cut through the lid (shop-product.js); the pull ring rests
  // on the recessed lid inside the raised rim, rather than creating a new outer can size.
  const lid=.135-.002;
  append(parts,original.body.clone(),'original can body',null);
  const ring=new THREE.TorusGeometry(.006,.00085,3,8).rotateX(Math.PI/2);
  part(ring,0xd6d9cd,[0,lid+.0009,.006],'can pull ring');
  const print=original.art.clone();prints.push(print.toNonIndexed());print.dispose();
 }
 function merged(list){if(!list.length)return null;const g=mergeGeometries(list);list.forEach(p=>p.dispose());g.computeBoundingBox();g.computeBoundingSphere();return g;}
 const body=merged(parts),art=merged(prints),glass=merged(wrappers);
 body.userData.components=components;art.userData.labelSurfaces=labelSurfaces;
 const result={body,art,bounds:original.bounds.clone()};if(glass)result.glass=glass;
 cache.set(id,result);return result;
}
