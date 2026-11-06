import {SAKURA_FONT,refreshSakuraPrint} from './sakura-print.js';
import * as THREE from '../../../vendor/three.module.js';
import {assetURL} from '../../assets.js';
import {STORE_BRANDS,BRAND_ATLAS_KEYS,ATLAS_CELLS} from '../../commerce/brands.js';
import {GROCERY_ITEMS as STORE_ITEMS} from '../../commerce/catalogue.js';
import {PRODUCTS,PRODUCT_BY_ID} from '../../commerce/products-data.js';
import {FRESH_LABELS,drawFreshLabel} from '../../commerce/fresh-labels.js';

export const POSTER_SPECS=Object.freeze([
 {id:'tea',file:'thuan-labels/golden-tea.webp',title:"GOLDEN MILK TEA · Golden milk tea",position:[-6.325,2.02,1.3],yaw:Math.PI/2,approach:[-5.15,1.55,1.3]},
 {id:'coffee',file:'thuan-labels/night-shift.webp',title:"NIGHT SHIFT · Night shift",position:[-6.325,2.02,3.8],yaw:Math.PI/2,approach:[-5.15,1.55,3.8]},
 {id:'biscuit',file:'thuan-labels/stick-bites.webp',title:"STICK BITES · Stick Bites",position:[6.325,2.02,2.8],yaw:-Math.PI/2,approach:[5.1,1.55,2.8]},
]);
export const ATLAS_COLS=4,ATLAS_ROWS=20;
/**
 * The atlas is two halves side by side. The left half is the original packaging and the
 * shelf prices, cell for cell as they always were (the painted overlays cover its top
 * rows). The right half holds the other flavours of each line (flavours.js), painted
 * from the original pack. ATLAS_SPAN is the width in cells that UVs are divided by.
 */
export const ATLAS_SPAN=ATLAS_COLS*2;
const COLS=ATLAS_COLS,ROWS=ATLAS_ROWS,TW=256,TH=128;
// Every label, price tag and flavour has its own cell (data/studio/products.json), so adding or retiring a product
// never moves another one's cells.
const slots=new Map(BRAND_ATLAS_KEYS.map(key=>[key,ATLAS_CELLS[key]]));
export const packagingSlot=id=>slots.get(id==='bun'?'buns':id);
// Packaging takes the first rows, shelf prices the rest. The two printed overlays
// only cover the first eight rows, so anything added after them is drawn here.
/** The cell of a line's shelf price tag (null for what has none, like the bun in the steamer). */
export const priceSlot=id=>PRODUCT_BY_ID[id]?.cells.price??null;
/** Flavour k (1 = the first flavour) of a line: its cell in the right half. */
const variantCells=new Map();
for(const {id,cells} of [...PRODUCTS].filter(p=>p.cells.flavours.length).sort((a,b)=>a.cells.flavours[0].cell-b.cells.flavours[0].cell))
 cells.flavours.forEach(({name,hue,cell},i)=>variantCells.set(id+':'+(i+1),{index:cell,id,name,hue}));
if([...slots.values(),...STORE_ITEMS.map(i=>priceSlot(i.id))].some(c=>c>=COLS*ROWS)||[...variantCells.values()].some(c=>c.index>=COLS*ROWS))throw Error('A Sakura label is outside the atlas');
/** Where a cell starts in the atlas, in pixels: the left half (labels, prints, price tags) or the right (flavours). */
export const cellOrigin=(slot,right=false)=>[(slot%COLS+(right?COLS:0))*TW,Math.floor(slot/COLS)*TH];
/**
 * How far a pack's printed UVs move to show flavour k instead of the original: added to
 * the label's UVs per instance on the shelf (sakura-interior.js). [0,0] for the original.
 */
export function flavourShift(id,k){
 const cell=k>0&&variantCells.get((id==='bun'?'buns':id)+':'+k);if(!cell)return [0,0];
 const base=packagingSlot(id),[bx,by]=cellOrigin(base),[vx,vy]=cellOrigin(cell.index,true);
 return [(vx-bx)/TW/ATLAS_SPAN,-(vy-by)/TH/ROWS];
}
/** Rotates the hue of an RGBA pixel block in place (the standard luminance-preserving matrix). */
function hueRotate(data,degrees){
 const a=degrees*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
 const m=[.213+c*.787-s*.213,.715-c*.715-s*.715,.072-c*.072+s*.928,.213-c*.213+s*.143,.715+c*.285+s*.140,.072-c*.072-s*.283,.213-c*.213-s*.787,.715-c*.715+s*.715,.072+c*.928+s*.072];
 for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2];data[i]=m[0]*r+m[1]*g+m[2]*b;data[i+1]=m[3]*r+m[4]*g+m[5]*b;data[i+2]=m[6]*r+m[7]*g+m[8]*b;}
}
/**
 * Paints one flavour from its original pack's cell (at `from`) into its own cell (at `to`): the same print, turned in
 * hue, with its flavour named on a ribbon. False when the canvas cannot be read back (a test's stand-in canvas).
 */
export function paintFlavourCell(ctx,[bx,by],[vx,vy],{name,hue}){
 let block;try{block=ctx.getImageData(bx,by,TW,TH);}catch{return false;}
 if(!block?.data)return false;
 hueRotate(block.data,hue);ctx.putImageData(block,vx,vy);
 ctx.save();ctx.translate(vx,vy);
 ctx.font='bold 19px sans-serif';const w=Math.min(TW-24,(ctx.measureText(name).width||name.length*10)+22);
 ctx.fillStyle='rgba(255,250,236,.94)';ctx.fillRect(TW-12-w,TH-40,w,26);ctx.fillStyle='#b63831';ctx.fillRect(TW-12-w,TH-40,5,26);
 ctx.fillStyle='#2f2a24';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,TW-12-w/2+2,TH-27,w-10);
 ctx.restore();return true;
}
/** Paints every flavour from its original pack (paintFlavourCell), after the cells they come from are drawn. */
function paintFlavours(ctx){
 if(typeof ctx.getImageData!=='function')return;
 for(const cell of variantCells.values())if(!paintFlavourCell(ctx,cellOrigin(packagingSlot(cell.id)),cellOrigin(cell.index,true),cell))return;
}
/**
 * Labels designed in Johansson Studio: the picture each was baked as (labels/<id>.r<n>.webp, 1024×512), laid over
 * its product's own cell at shelf size once it has loaded. World never draws a design itself, so every device shows
 * exactly the label the creator approved.
 */
const DESIGNED=PRODUCTS.filter(p=>p.label.source==='designed');
function paintDesigned(ctx,loaded){
 for(const [cell,image] of loaded){
  const [x,y]=cellOrigin(cell);ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,x,y,TW,TH);ctx.restore();
 }
}
const posterGeometry=new THREE.PlaneGeometry(1.06,1.59);
let labelMaterial=null;const posterMaterials=new Map();

function emblem(ctx,kind,x,y,r,color){
 ctx.save();ctx.translate(x,y);ctx.fillStyle=color;ctx.strokeStyle=color;ctx.lineWidth=2.5;
 if(kind==='leaf'){
  for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*r*.32,0,r*.38,r*.82,side*.6,0,Math.PI*2);ctx.fill();}
 }else if(kind==='gull'){
  ctx.beginPath();ctx.moveTo(-r,r*.25);ctx.quadraticCurveTo(-r*.45,-r*.55,0,r*.02);ctx.quadraticCurveTo(r*.45,-r*.55,r,r*.25);ctx.stroke();
 }else if(kind==='wave'){
  for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(-r,k*5);ctx.bezierCurveTo(-r*.3,k*5-6,r*.3,k*5+6,r,k*5);ctx.stroke();}
 }else if(kind==='rice'){
  ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,r*.8);ctx.lineTo(-r,r*.8);ctx.closePath();ctx.fill();
 }else if(kind==='flower'){
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*r*.5,Math.sin(a)*r*.5,r*.42,0,Math.PI*2);ctx.fill();}
 }else if(kind==='star'){
  ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.43:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();ctx.fill();
 }else{
  ctx.beginPath();ctx.arc(0,0,r*.5,0,Math.PI*2);ctx.fill();
  for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.65,Math.sin(a)*r*.65);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}
 }
 ctx.restore();
}
function drawShelfPrices(ctx){
 for(const item of STORE_ITEMS){
  const index=priceSlot(item.id),x=index%COLS*TW,y=Math.floor(index/COLS)*TH,b=STORE_BRANDS[item.id];
  ctx.save();ctx.translate(x,y);ctx.fillStyle='#fff4d9';ctx.fillRect(0,0,TW,TH);ctx.fillStyle='#b63831';ctx.fillRect(0,0,TW,8);
  ctx.textAlign='left';ctx.fillStyle='#41362a';ctx.font=`700 23px ${SAKURA_FONT}`;ctx.fillText(b.name,10,37,236);
  ctx.font=`400 17px ${SAKURA_FONT}`;ctx.fillText(item.jp,10,63,236);ctx.textAlign='right';ctx.fillStyle='#a62e28';ctx.font=`700 45px ${SAKURA_FONT}`;ctx.fillText('¥'+item.cost,244,112,230);ctx.restore();
 }
}
export function createLabelAtlas(){
 const canvas=document.createElement('canvas');canvas.width=ATLAS_SPAN*TW;canvas.height=ROWS*TH;
 // Read back for every flavour (paintFlavourCell): a canvas kept in memory reads back at once, where a GPU canvas
 // stalled the town's build for over a second (docs/LOADING.md batch 5).
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#f0e5ca';ctx.fillRect(0,0,canvas.width,canvas.height);
 for(const [id,index] of slots){
  const b=STORE_BRANDS[id]||STORE_BRANDS.stock,x=index%COLS*TW,y=Math.floor(index/COLS)*TH;
  // Fresh food and the paper have their own printed faces (fresh-labels.js).
  if(FRESH_LABELS.includes(id)){ctx.save();ctx.translate(x,y);drawFreshLabel(ctx,id,TW,TH);ctx.restore();continue;}
  ctx.save();ctx.translate(x,y);ctx.fillStyle=b.paper;ctx.fillRect(0,0,TW,TH);
  ctx.strokeStyle=b.ink;ctx.lineWidth=2;ctx.strokeRect(6,6,TW-12,TH-12);
  ctx.fillStyle=b.accent;ctx.fillRect(8,90,TW-16,30);
  emblem(ctx,b.symbol,25,31,12,b.ink);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=b.ink;
  ctx.font=`${id==='coffee'?'italic ':''}bold ${b.name.length>8?26:34}px Georgia,serif`;
  ctx.fillText(b.name,143,34,194);ctx.font='bold 23px serif';ctx.fillText(b.jp,128,70,228);
  ctx.fillStyle=['water','cola','biscuit','buns','milk'].includes(id)?b.ink:'#fff2d4';
  ctx.font='bold 16px sans-serif';ctx.fillText(b.line,128,105,226);ctx.restore();
 }
 drawShelfPrices(ctx);
 paintFlavours(ctx);
 return canvas;
}
/**
 * The shelf's one label material. Its atlas is drawn at once (createLabelAtlas); then, as each picture arrives, the
 * painted sheets are laid in whole over their cells, every designed label that has arrived is laid over its own cell
 * (so a sheet arriving later never covers one), and the flavours are painted again from the cells they come from, so a
 * new label's flavours follow it. A cell beyond the painted sheets shows its drawn label until its picture arrives.
 */
export function getLabelMaterial(){
 if(!labelMaterial){const texture=new THREE.CanvasTexture(createLabelAtlas());texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;
  // Packaging art is printed on its pack: a decal 1 mm proud of the body, drawn in front of it by polygon offset so the
  // two never trade places in the depth buffer (the owner, 26 October 2026: "much Z fighting ... I want it impeccable").
  labelMaterial=new THREE.MeshBasicMaterial({map:texture,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4});labelMaterial.name='Sakura fictional packaging atlas';
  refreshSakuraPrint(texture,drawShelfPrices,STORE_ITEMS.map(item=>STORE_BRANDS[item.id].name+item.jp+'¥'+item.cost).join(''));
  const designed=new Map(),repaint=ctx=>{paintDesigned(ctx,designed);paintFlavours(ctx);texture.needsUpdate=true;};
  for(const [row,file] of [[0,'packaging-atlas.webp'],[1,'packaging-groceries.webp']])new THREE.ImageLoader().load(assetURL('graphics/konbini/'+file),image=>{const canvas=texture.image,ctx=canvas.getContext('2d');ctx.drawImage(image,0,row*512,COLS*TW,512);repaint(ctx);},undefined,()=>{});
  for(const p of DESIGNED)new THREE.ImageLoader().load(assetURL('graphics/'+p.label.image),image=>{designed.set(p.cells.brand,image);repaint(texture.image.getContext('2d'));},undefined,()=>{console.warn('Sakura label unavailable: '+p.label.image+'; the shelf keeps its drawn label.');});}
 return labelMaterial;
}
function fallbackPoster(id){
 const b=STORE_BRANDS[id],c=document.createElement('canvas');c.width=256;c.height=384;const x=c.getContext('2d');
 x.fillStyle=b.paper;x.fillRect(0,0,256,384);x.fillStyle=b.ink;x.textAlign='center';x.font='bold 36px serif';x.fillText(b.name,128,78,235);
 emblem(x,b.symbol,128,185,55,b.ink);x.font='bold 28px serif';x.fillText(b.line,128,288,230);x.font='20px serif';x.fillText("Sakura Shop",128,350);
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
export function getPosterMaterial(spec){
 if(!posterMaterials.has(spec.id)){
  const material=new THREE.MeshBasicMaterial({map:fallbackPoster(spec.id),toneMapped:false});
  material.name='Sakura advertisement '+spec.id;posterMaterials.set(spec.id,material);
  new THREE.TextureLoader().load(assetURL('graphics/konbini/'+spec.file),texture=>{
   texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=2;
   const placeholder=material.map;material.map=texture;material.needsUpdate=true;placeholder.dispose();
  },undefined,()=>{console.warn('Sakura poster unavailable: '+spec.file+'; retaining the printed brand panel.');});
 }
 return posterMaterials.get(spec.id);
}

// One static textured draw for all shelf labels and curved bottle/can wrappers.
// Each room owns its geometry; material/texture caches survive room changes.
export function createStoreAdvertising({room,reg,action,posterSpecs=POSTER_SPECS}){
 const positions=[],normals=[],uvs=[],indices=[],stockRanges=[];let count=0;const labels=[];
 function append(geometry,pos,yaw,slot){
  const matrix=new THREE.Matrix4().makeRotationY(yaw);matrix.setPosition(...pos);geometry.applyMatrix4(matrix);
  const p=geometry.attributes.position,n=geometry.attributes.normal,uv=geometry.attributes.uv,offset=positions.length/3;
  for(let i=0;i<p.count;i++){
   positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));
   // Pixel gutters avoid sampling neighbouring labels through the mip chain.
   uvs.push((slot%COLS+(2+uv.getX(i)*(TW-4))/TW)/ATLAS_SPAN,1-(Math.floor(slot/COLS)+(2+(1-uv.getY(i))*(TH-4))/TH)/ROWS);
  }
  for(const i of geometry.index.array)indices.push(offset+i);geometry.dispose();count++;
 }
 function label(id,pos,width,height,{yaw=0,radius=null,price=false,stockKey=null}={}){
  const slot=price?priceSlot(id):slots.get(id);if(slot==null||slot<0)throw Error('Unknown Sakura label: '+id);
  const g=radius?new THREE.CylinderGeometry(radius,radius,height,16,1,true,-1.3,2.6):new THREE.PlaneGeometry(width,height);
  const start=positions.length;append(g,pos,yaw,slot);if(stockKey)stockRanges.push({key:stockKey,start,end:positions.length});labels.push({id,price,position:[...pos],width,height});
 }
 function finish(){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,getLabelMaterial());mesh.name='Sakura branded packaging and shelf prices';
  // clearRoom disposes owned geometry but must preserve this shared material.
  mesh.userData.preserveMaterial=true;mesh.userData.labelCount=count;mesh.userData.labels=labels;room.add(mesh);
  const posterGroup=new THREE.Group();posterGroup.name='Sakura Showa advertisements';posterGroup.userData.sharedAsset=true;
  // The small paper meshes also persist with the cached materials.
  for(const spec of posterSpecs){
   const poster=new THREE.Mesh(posterGeometry,getPosterMaterial(spec));poster.name=spec.title;poster.position.set(...spec.position);poster.rotation.y=spec.yaw;posterGroup.add(poster);
   const target=new THREE.Object3D();target.position.set(...spec.approach);target.name='Read '+spec.title;room.add(target);
   const item=STORE_ITEMS.find(i=>i.id===spec.id);
   reg(target,target.name,()=>action('inspect',spec.title,STORE_BRANDS[spec.id].line+' · '+item.name+' · ¥'+item.cost+'\nAvailable here at Sakura. '+item.text),true);
  }
  room.add(posterGroup);const originals=geometry.attributes.position.array.slice();
  return {mesh,posters:posterGroup,labels,updateStock(stock){
   const points=geometry.attributes.position.array;for(const range of stockRanges){const [id,slot]=range.key.split(':');const visible=Number(slot)<(stock[id]?.shelf??Infinity);for(let i=range.start;i<range.end;i++)points[i]=visible?originals[i]:0;}
   geometry.attributes.position.needsUpdate=true;
  }};
 }
 return {label,finish};
}
