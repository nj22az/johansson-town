import * as THREE from '../../vendor/three.module.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {getLabelMaterial,packagingSlot,ATLAS_COLS,ATLAS_ROWS,ATLAS_SPAN} from '../world/interiors/store-advertising.js';
import {STORE_BRANDS} from './brands.js';
import {PRODUCT_BY_ID,PRINTS} from './products-data.js';
// Twelve sides: a shelf of round packs at arm's length reads as round under the cel ramp, at
// under two thirds of the triangles twenty cost.
const SIDES=12;
/** Drinks cans: their lid has the drinking opening cut through it. */
const DRINK_CANS=new Set(['coffee','beer']);
/** A geometry turned inside out (its faces seen from within): the inner wall of a can's rim. */
function inward(g){
 const index=g.index.array;for(let i=0;i<index.length;i+=3){const t=index[i+1];index[i+1]=index[i+2];index[i+2]=t;}
 const n=g.attributes.normal.array;for(let i=0;i<n.length;i++)n[i]=-n[i];
 return g;
}
const templates=new Map(),bodyMaterial=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62});
/** A box of this size is what anything without a pack of its own is built as. */
const PLAIN={shape:'box',size:[.15,.18,.025]};
/**
 * What a key in the label atlas is built as: a product (by its id, or as an object, for Studio's drafts), the bun by
 * its own id, or printed matter (the delivery carton, the magazines, the paper).
 */
function lookOf(target){
 if(target&&typeof target==='object')return {id:target.id,brand:target.brand,pack:target.pack,slot:target.cells.brand};
 const product=PRODUCT_BY_ID[target],print=PRINTS.find(p=>p.key===target);
 return {id:target,brand:STORE_BRANDS[target==='bun'?'buns':target]||STORE_BRANDS.stock,pack:product?.pack||print?.pack||PLAIN,slot:packagingSlot(target)};
}
/**
 * `sides`: round packs' segments; the shelf uses 12, the close-up (item-viewer.js) more of the same shape. The pack
 * is built from its shape and size (data/studio/products.json): a bottle, a can, a cup or a foil-lidded cup, a carton,
 * a tray, a wedge, a bag, a box, a magazine or a newspaper.
 */
export function shopProductTemplate(target,{sides=SIDES}={}){
 const draft=target&&typeof target==='object',id=draft?target.id:target,key=sides===SIDES?id:id+':'+sides;
 if(!draft&&templates.has(key))return templates.get(key);
 const parts=[],labels=[],{brand,pack,slot}=lookOf(target),[W,H,D]=pack.size;
 const part=(g,color,pos=[0,0,0])=>{g.translate(...pos);const c=new THREE.Color(color),a=new Float32Array(g.attributes.position.count*3);for(let i=0;i<a.length;i+=3)a.set(c.toArray(),i);g.setAttribute('color',new THREE.BufferAttribute(a,3));parts.push(g);};
 const box=(w,h,d,y,color)=>part(new THREE.BoxGeometry(w,h,d),color,[0,y,0]);
 const cyl=(r,h,y,color,rb=r)=>part(new THREE.CylinderGeometry(r,rb,h,sides),color,[0,y,0]);
 const label=(g,y,z=0)=>{g.translate(0,y,z);const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(slot%ATLAS_COLS+.025+uv.getX(i)*.95)/ATLAS_SPAN,1-(Math.floor(slot/ATLAS_COLS)+.025+(1-uv.getY(i))*.95)/ATLAS_ROWS);labels.push(g);};
 const fronts=(w,h,d,y)=>{label(new THREE.PlaneGeometry(w,h),y,d/2+.001);label(new THREE.PlaneGeometry(w,h).rotateY(Math.PI),y,-d/2-.001);};
 if(pack.shape==='bottle'){
  // The bottle's own tint (the tea's green, the cola's brown), its shoulder and neck, and the cap in the brand's ink.
  const color=pack.colour,r=W/2;
  // A marble bottle's neck stops at the collar, which stops at the cap: one surface each, none inside another.
  const marble=pack.detail==='marble';
  cyl(r,.16,.08,color);cyl(.023,.035,.1775,color,r);if(marble)cyl(.023,.044,.217,color);else cyl(.023,.05,.22,color);cyl(.025,.018,.254,brand.ink);
  if(marble){cyl(.031,.026,.185,0xc4e1dc,.034);cyl(.025,.006,.242,0xe9e8d8);}
  label(new THREE.CylinderGeometry(r+.001,r+.001,.123,sides,1,true,-Math.PI*.76,Math.PI*1.52),.085);
 }else if(pack.shape==='can'){
  // Built as a can is (the Sakura surface audit, SK-ZF rev A): the body runs from the base bead to the lid, which lies
  // 4 mm down inside the seamed rim; nothing lies in another part's plane. A drinks can's lid has its opening cut
  // through it, over a dark well 2.5 mm below.
  const r=W/2,h=H,lid=h-.002,rim=h+.002,ri=r*.82,drink=DRINK_CANS.has(id);
  part(new THREE.CylinderGeometry(r,r,lid-.006,sides,1,true),brand.paper,[0,(lid+.006)/2,0]);
  // The base bead: its side and the can's bottom, open above (inside the can nothing needs a face).
  part(new THREE.CylinderGeometry(r+.0015,r+.0015,.006,sides,1,true),0xa8b3ad,[0,.003,0]);
  part(new THREE.CircleGeometry(r+.0015,sides).rotateX(Math.PI/2),0xa8b3ad,[0,0,0]);
  part(new THREE.RingGeometry(r,r+.0015,sides).rotateX(-Math.PI/2),0xa8b3ad,[0,.006,0]);
  part(new THREE.CylinderGeometry(r+.0015,r+.0015,rim-lid,sides,1,true),0xcad0c8,[0,(lid+rim)/2,0]);
  part(new THREE.RingGeometry(ri,r+.0015,sides).rotateX(-Math.PI/2),0xcad0c8,[0,rim,0]);
  part(new THREE.RingGeometry(r,r+.0015,sides).rotateX(Math.PI/2),0xcad0c8,[0,lid,0]);
  part(inward(new THREE.CylinderGeometry(ri,ri,rim-lid,sides,1,true)),0xcad0c8,[0,(lid+rim)/2,0]);
  {const top=new THREE.Shape().absarc(0,0,ri+.001,0,Math.PI*2);if(drink)top.holes.push(new THREE.Path().absarc(0,.010,.007,0,Math.PI*2,true));
   part(new THREE.ShapeGeometry(top,sides).rotateX(-Math.PI/2),0xcad0c8,[0,lid,0]);}
  if(drink)cyl(.02,.002,lid-.0035,0x505850);// the well under the opening
  part(new THREE.TorusGeometry(r*.79,.0014,3,sides).rotateX(Math.PI/2),0x88958c,[0,lid+.0014,0]);
  label(new THREE.CylinderGeometry(r+.001,r+.001,h*.87,sides,1,true,-Math.PI*.8,Math.PI*1.6),h/2);
 }else if(pack.shape==='cup'){
  const r=W/2,h=H;
  cyl(r,h,h/2,brand.paper,r*.76);cyl(r+.003,.005,h+.002,brand.ink);
  label(new THREE.CylinderGeometry(r+.001,r*.76+.001,h*.9,sides,1,true,-Math.PI*.7,Math.PI*1.4),h/2);
 }else if(pack.shape==='magazine'){
  const w=W,h=H,d=D;box(w,h,d,h/2,brand.paper);fronts(w*.97,h*.95,d,h/2);
 }else if(pack.shape==='newspaper'){
  const w=W,h=H,d=D;box(w,h,d,h/2,brand.paper);
  label(new THREE.PlaneGeometry(w*.95,d*.95).rotateX(-Math.PI/2),h+.001);
 }else if(pack.shape==='carton'){
  box(.093,.177,.093,.0885,brand.paper);
  part(new THREE.CylinderGeometry(0,.066,.055,4).rotateY(Math.PI/4),brand.paper,[0,.2045,0]);box(.082,.013,.006,.237,brand.ink);fronts(.086,.157,.093,.09);
 }else if(pack.shape==='tray'){
  // A lidded tray, seen from above on the top shelf, so the print goes on the lid.
  const w=W,h=H,d=D;
  box(w,h*.62,d,h*.31,brand.ink);                        // the black tray
  box(w+.004,h*.42,d+.004,h*.79,brand.paper);            // the paper lid band
  label(new THREE.PlaneGeometry(w*.9,d*.86).rotateX(-Math.PI/2),h+.001);
  part(new THREE.BoxGeometry(w*.03,.004,d*.9),brand.accent,[w*.47,h+.002,0]); // the band's edge, clear of the printed lid (fresh-labels.js)
 }else if(pack.shape==='wedge'){
  // The wedge pack: a triangular prism on its side, cut corner up, which is the one
  // silhouette on a konbini shelf you recognise before you can read it.
  const r=.082,t=.052;
  const wedge=new THREE.CylinderGeometry(r,r,t,3).rotateX(Math.PI/2).rotateZ(Math.PI);
  part(wedge,brand.paper,[0,r*.62,0]);
  label(new THREE.PlaneGeometry(r*1.05,r*.78),r*.66,t/2+.001);
  label(new THREE.PlaneGeometry(r*1.05,r*.78).rotateY(Math.PI),r*.66,-t/2-.001);
 }else if(pack.shape==='foil-cup'){
  // A tapered cup under a foil lid, which is how a pudding came in 1997 and still does.
  const r=W/2,h=H;
  cyl(r,h,h/2,brand.paper,r*.72);
  cyl(r+.003,.004,h+.001,0xd8cfae);                      // the foil rim
  label(new THREE.CylinderGeometry(r+.001,r*.72+.001,h*.82,sides,1,true,-Math.PI*.7,Math.PI*1.4),h/2);
 }else if(pack.shape==='bag'){
  const w=W,h=H,d=D;
  const g=new THREE.BoxGeometry(w,h,d,1,4,1),p=g.attributes.position;
  for(let i=0;i<p.count;i++){const t=Math.abs(p.getY(i))/(h/2);p.setX(i,p.getX(i)*(1-.08*t));p.setZ(i,p.getZ(i)*(1-.60*t**4));}g.computeVertexNormals();part(g,brand.paper,[0,h/2,0]);
  // The crimp seals: the bottom one 2.5 mm up, clear of the bag's base.
  box(w*.90,.009,d*.42,h-.002,brand.accent);box(w*.90,.009,d*.42,.007,brand.accent);fronts(w*.88,h*.72,d,h/2);
 }else{
  const [w,h,d]=[W,H,D];
  // The page edges show as a band round the pack: the band is cut into the body, which is built round it, so the band
  // and the cover never lie one in front of the other.
  if(pack.detail==='pages'){const y0=h*.92-.002,y1=h*.92+.002,bw=w*.92,side=(w-bw)/2;
   box(w,y0,d,y0/2,brand.paper);box(w,h-y1,d,(h+y1)/2,brand.paper);
   for(const s of [-1,1])part(new THREE.BoxGeometry(side,y1-y0,d),brand.paper,[s*(bw+side)/2,h*.92,0]);
   box(bw,y1-y0,d+.001,h*.92,0xeee8d7);
  }else box(w,h,d,h/2,brand.paper);
  fronts(w*.95,h*.89,d,h*.5);
  // The tissue stands 2.2 mm proud of the slot.
  if(pack.detail==='tissue-slot')box(.105,.0022,.018,h+.0011,0xf9f7ec);
 }
 const body=mergeGeometries(parts),art=mergeGeometries(labels);[...parts,...labels].forEach(g=>g.dispose());body.computeBoundingBox();art.computeBoundingBox();
 const bounds=body.boundingBox.clone().union(art.boundingBox),result={body,art,bounds};if(!draft)templates.set(key,result);return result;
}
export function createShopProduct(id){const t=shopProductTemplate(id),group=new THREE.Group();group.name='Branded '+id;group.userData.sharedAsset=true;group.add(new THREE.Mesh(t.body,bodyMaterial),new THREE.Mesh(t.art,getLabelMaterial()));return group;}
export function shopProductMaterials(){return [bodyMaterial,getLabelMaterial()];}
