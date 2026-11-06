import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {mergeGeometries} from '../../vendor/BufferGeometryUtils.js';
import {assetURL} from '../assets.js';
import {VENDING_AD,VENDING_PRODUCTS} from '../commerce/vending-catalogue.js';
import {paintJCoffeeLabel} from './halloween-props.js';

let template,pending;
// Source colours are baked into one opaque mesh. Omit the source glass so the
// small display stays clear on phones and adds no transparency sorting cost.
export function prepareVendingModel(source){
  source.updateMatrixWorld(true);
  const parts=[];
  source.traverse(node=>{
    if(!node.isMesh||node.material.transparent)return;
    const geometry=node.geometry.clone().applyMatrix4(node.matrixWorld);
    for(const key of Object.keys(geometry.attributes))if(!['position','normal'].includes(key))geometry.deleteAttribute(key);
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    const colors=new Float32Array(geometry.attributes.position.count*3);
    for(let i=0;i<colors.length;i+=3)node.material.color.toArray(colors,i);
    geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));parts.push(geometry);
  });
  if(!parts.length)throw new Error('Vending model has no opaque geometry');
  const geometry=mergeGeometries(parts,false);parts.forEach(part=>part.dispose());
  geometry.rotateY(Math.PI);geometry.computeBoundingBox();
  const bounds=geometry.boundingBox,center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  const scale=Math.min(1.3/size.x,2.25/size.y,1/size.z);
  geometry.translate(-center.x,-bounds.min.y,-center.z);geometry.scale(scale,scale,scale);
  geometry.computeBoundingBox();geometry.computeBoundingSphere();
  return new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.68,metalness:.16}));
}
export async function preloadVending(){
  if(template)return true;if(pending)return pending;
  pending=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch(assetURL('models/props/vending-machine.glb'),{signal:controller.signal});if(!response.ok)throw Error(response.status);const gltf=await new GLTFLoader().parseAsync(await response.arrayBuffer(),'');template=prepareVendingModel(gltf.scene);gltf.scene.traverse(node=>{if(node.isMesh){node.geometry.dispose();node.material.dispose();}});return true;}
  catch(error){console.warn('Vending model unavailable; using local fallback.',error);return false;}finally{clearTimeout(timer);}
  })();const task=pending;task.finally(()=>{pending=null;});return task;
}
// The machine is drawn in code now (below), so there is nothing to wait for. The GLB
// loader above is kept for the asset test and anyone who wants the old body back.
export const vendingReady=()=>true;
export async function hydrateVending(){return true;}


/* ------------------------------------------------------------------------------------------------------------------ *
 * The drinks machine: a 1990s Japanese can vending machine (缶自販機) as the bottlers set them out along Okinawa's
 * streets in 1997. Built in code from chunky rounded parts and two painted 1K atlases, about seven draw calls.
 * ------------------------------------------------------------------------------------------------------------------ */

const JP='"Hiragino Sans","Noto Sans CJK JP","IPAGothic","Yu Gothic",sans-serif';
const BOLD='"Arial Black","Helvetica Neue",Arial,sans-serif';

/**
 * What the machine is, as numbers the street, the stories, the film and the tests share. Sizes in metres; the machine
 * is fronted on +z with its origin on the ground under its middle (on its concrete pad, if it has one).
 */
export const VENDING_MACHINE=Object.freeze({
 what:'A can vending machine of the mid-1990s, as Okinawa’s bottlers set them out along the streets: a pressed-steel cabinet in the bottler’s red with a cream face, a lit header, two rows of dummy cans behind glass with a price plate and a lit push button under each, the coin and note mechanism on the right, the take-out pocket at the bottom behind a smoked flap.',
 // its maker: a Johansson company, as every maker in this world is (CLAUDE.md, "Johansson is this universe's Acme"); the
 // model and the plate's numbers are the machine's own (vendingMakerPlate), and Minato Drinks is only the bottler's livery
 maker:Object.freeze({name:'Johansson Vending',jp:'ヨハンソン自販機',works:'Johansson Vending Works, Urasoe',founded:1972,series:'JV',built:1994,serial:'9403-17',
  why:'Johansson Vending builds the island’s drinks machines at its Urasoe works and sells them to the bottlers; Minato Drinks, the island’s bottler, owns and fills this one and puts its own name on the light panel.'}),
 // how many cans one column holds, by the can it is set up for (a short coffee can stacks deeper than a long one)
 columnCapacity:Object.freeze({190:36,350:25,500:18}),
 operator:Object.freeze({name:VENDING_AD.brand,why:'Minato Drinks owns the machines, fills them from its van every morning and keeps the takings; Sakura gives the wall and the power and takes a share.'}),
 size:Object.freeze({width:1.03,height:1.83,depth:.74,door:.21,pad:.04,padFront:.12,padSide:.07}),
 // the window: two rows of eight columns, each band of glass with its price plates inside and the buttons on the rail below
 bands:Object.freeze([Object.freeze({row:0,bottom:1.37,top:1.585,rail:1.305}),Object.freeze({row:1,bottom:1.09,top:1.305,rail:1.025})]),
 windowWidth:.89,
 header:Object.freeze({bottom:1.61,top:1.795,width:.9}),
 pocket:Object.freeze({x0:-.43,x1:.19,y0:.16,y1:.36,depth:.17,why:'The take-out pocket (取出口): a can drops down the chute onto its floor, behind a hinged flap of smoked plastic that you push in to reach it.'}),
 money:Object.freeze({x0:.225,x1:.455,y0:.43,y1:.97}),
 faceTop:1.005,
 // what one can of each size measures (a 190 g coffee can is the short one; 350 ml the cola can; 500 ml the long can)
 cans:Object.freeze({190:Object.freeze({diameter:.053,height:.104}),350:Object.freeze({diameter:.066,height:.122}),500:Object.freeze({diameter:.066,height:.168})}),
 coins:Object.freeze([10,50,100,500]),notes:Object.freeze([1000]),
 // its rating plate (銘板): the compressor's running current is the story's (halloween.js HALLOWEEN_ELECTRICS reads it)
 rating:Object.freeze({volts:100,hz:'50/60',amps:4,why:'The cooling compressor and the window’s tubes: 4 A running at 100 V, and about six times that for the moment the compressor starts.'}),
 lever:Object.freeze({travel:.45,why:'The coin-return lever (返却レバー): pushed down, it opens the coin mechanism’s gate and the coins drop to the change cup.'}),
 flap:Object.freeze({swing:1.1,why:'The take-out flap hangs from its hinge bar at the top of the pocket: a hand pushes it in to reach the can (up to about 60°), and it swings back and settles; cold air from the chute stirs it a little outward.'}),
 // where the power cord leaves the cabinet: low on the back, at the right (the money side)
 cord:Object.freeze({x:.40,y:.10,why:'The cord leaves the back low on the right, behind the coin mechanism, and runs to the machine’s own outdoor socket.'}),
});

/**
 * What stands in the window, column by column (row 0 the top row): every column is a product of the catalogue
 * (commerce/vending-catalogue.js) in the can that column is set up for. The top row, at eye height, is what people
 * choose by sight: Okinawa's everyday sanpin tea, green tea, the island's shikuwasa soda and cola (all cold, blue).
 * The bottom row, at hand height under the coin slot, is the port's coffee: J-Coffee in three columns because it is
 * what the quay crew press before and after a shift and what sells out first at night, Dockside's sweet milk coffee
 * in the short 190 g can, and hot corn soup at the right end, where a machine keeps its warm columns (red).
 * The first shikuwasa column is sold out by evening in a warm October (its 売切 lamp lit): the van comes at eight.
 */
export const VENDING_COLUMNS=Object.freeze([
 ['sanpin',350],['sanpin',350],['harbour-tea',350],['harbour-tea',350],['shikuwasa',350,true],['shikuwasa',350],['ryukyu-cola',350],['ryukyu-cola',350],
 ['j-coffee',350],['j-coffee',350],['j-coffee',350],['dockside-coffee',190],['dockside-coffee',190],['dockside-coffee',190],['corn-soup',190],['corn-soup',190],
].map(([id,size,soldOut=false],i)=>{const product=VENDING_PRODUCTS.find(p=>p.id===id);if(!product)throw Error('vending column: no product '+id);
 return Object.freeze({row:Math.floor(i/8),col:i%8,id,size:product.size??size,soldOut,hot:!!product.hot,price:product.price});}));

/** The machine's model: the maker's series, its number of columns, C for cans (JV-16C). */
export const vendingModel=()=>`${VENDING_MACHINE.maker.series}-${VENDING_COLUMNS.length}C`;
/** How many cans it holds full: each column's capacity for the can it is set up for. */
export const vendingCapacity=()=>VENDING_COLUMNS.reduce((n,c)=>n+VENDING_MACHINE.columnCapacity[c.size],0);
/** The lines on its maker's plate (Johansson Marine's style, johansson-marine.js makerPlate): the maker, the model and
 *  what it holds, its rating and year, its serial number and works; every number the machine's own data. */
export function vendingMakerPlate(){
 const M=VENDING_MACHINE,R=M.rating;
 return [M.maker.name.toUpperCase(),`${vendingModel()} · ${VENDING_COLUMNS.length} columns · ${vendingCapacity()} cans`,`${R.volts} V ${R.hz} Hz · ${R.amps.toFixed(1)} A · ${M.maker.built}`,`No. ${M.maker.serial} · ${M.maker.works}`];
}

/** A point in a machine's own frame (x across, y up, z out of its front) to the town's, for a machine standing at
 *  {x,y,z,ry} (rotation about y, as the street places it). */
export function vendingToWorld(at,[lx,ly,lz]){
 const c=Math.cos(at.ry||0),s=Math.sin(at.ry||0);
 return [at.x+lx*c+lz*s,(at.y||0)+ly,at.z-lx*s+lz*c];
}

/**
 * The points other things meet on a machine, in its own frame (pad: standing on its concrete pad): takeOut, where a
 * dropped 350 ml can lies on the pocket's floor (its middle; its axis across the machine), with the floor's height,
 * the flap's plane and the pocket's sides; cordExit, where the power cord leaves the back; top, the cabinet's top.
 */
export function vendingPoints({pad=true}={}){
 const M=VENDING_MACHINE,P=M.pocket,Y=pad?M.size.pad:0,F=M.size.depth/2,r=M.cans[350].diameter/2;
 return Object.freeze({
  takeOut:Object.freeze({x:(P.x0+P.x1)/2,y:Y+P.y0+r,floor:Y+P.y0,z:F-.075,flap:F-.006,x0:P.x0,x1:P.x1,back:F-P.depth,axis:'x'}),
  cordExit:Object.freeze({x:M.cord.x,y:Y+M.cord.y,z:-F-.012}),
  top:Y+M.size.height,front:F,back:-F,padFront:pad?F+M.size.padFront:F,
 });
}

/* ---------------------------------------------------- the paint --------------------------------------------------- */

const S=1024;
const LIT=Object.freeze({white:[0,0,128,128],header:[128,0,896,188],label:i=>[(i%4)*256,192+Math.floor(i/4)*128,256,128],
 price:i=>[(i%4)*128,656+Math.floor(i/4)*48,128,48],lampCold:[256,448,64,32],lampHot:[320,448,64,32],soldOn:[384,448,64,24],soldOff:[448,448,64,24],
 otsuri:[512,448,128,32],led:[640,448,128,32],bill:[768,448,128,32],backdrop:[0,512,512,144]});
const PRINT=Object.freeze({poster:[0,0,640,432],sideA:[640,0,256,416],sideB:[0,440,256,416],money:[256,440,240,512],rating:[512,440,256,160],badge:[768,440,256,112],takeOut:[512,680,512,56]});
const PRICES=[...new Set(VENDING_COLUMNS.map(c=>c.price+'|'+(c.hot?1:0)))].map(k=>{const [p,h]=k.split('|');return [+p,h==='1'];});
const priceKey=col=>PRICES.findIndex(([p,h])=>p===col.price&&h===col.hot);
const LABELLED=['sanpin','harbour-tea','shikuwasa','ryukyu-cola','j-coffee','dockside-coffee','corn-soup'];

function cell(ctx,[x,y,w,h],paint){ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.rect(0,0,w,h);ctx.clip();paint(ctx,w,h);ctx.restore();}
const ink=hex=>{const n=parseInt(hex.slice(1),16),l=(.299*(n>>16&255)+.587*(n>>8&255)+.114*(n&255))/255;return l>.62?'#2b2116':'#fff8e8';};
function round(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}

/** A can's printed body, in a 512 × 256 design (once round the can; its front at the middle). */
function paintCan(ctx,p,w,h){
 if(p.id==='j-coffee'){paintJCoffeeLabel(ctx,w,h);return;}
 ctx.save();ctx.scale(w/512,h/256);
 ctx.fillStyle=p.color;ctx.fillRect(0,0,512,256);const fg=ink(p.color);
 ctx.fillStyle=fg;ctx.globalAlpha=.9;ctx.fillRect(0,14,512,8);ctx.fillRect(0,234,512,8);ctx.globalAlpha=1;
 ctx.beginPath();ctx.arc(256,92,52,0,Math.PI*2);ctx.fillStyle=fg;ctx.fill();
 ctx.fillStyle=p.color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold 66px ${JP}`;ctx.fillText(p.mark,256,95,90);
 ctx.fillStyle=fg;ctx.font=`900 34px ${BOLD}`;ctx.fillText(p.brand,256,172,156);
 ctx.font='bold 22px Arial,sans-serif';ctx.fillText(p.subtitle,256,208,150);
 ctx.font=`900 70px ${BOLD}`;ctx.globalAlpha=.85;for(const u of [0,512])ctx.fillText(p.mark,u,120);ctx.globalAlpha=1;
 ctx.restore();
}
function paintLit(ctx){
 cell(ctx,LIT.white,(c,w,h)=>{c.fillStyle='#fff';c.fillRect(0,0,w,h);});
 cell(ctx,LIT.header,(c,w,h)=>{
  const g=c.createLinearGradient(0,0,0,h*.74);g.addColorStop(0,'#fffdf6');g.addColorStop(1,'#f6eedb');c.fillStyle=g;c.fillRect(0,0,w,h*.74);
  c.fillStyle='#c4262e';c.textAlign='center';c.textBaseline='middle';c.font=`900 92px ${BOLD}`;c.fillText(VENDING_AD.brand,w/2,h*.36,w*.9);
  c.fillStyle='#7a2a20';c.font=`bold 22px ${JP}`;const kana='ミナトドリンク',k=c.measureText(kana).width;c.font='italic bold 22px Arial,sans-serif';const t=c.measureText(VENDING_AD.tagline).width,x0=w/2-(k+24+t)/2;
  c.textAlign='left';c.fillText(VENDING_AD.tagline,x0+k+24,h*.65);c.font=`bold 22px ${JP}`;c.fillText(kana,x0,h*.65);c.textAlign='center';
  // the strip under it: cold columns in blue, the warm ones in red, as wide as their columns
  const split=Math.round(w*14/16);
  c.fillStyle='#2a63c4';c.fillRect(0,h*.74,split,h*.26);c.fillStyle='#d6322a';c.fillRect(split,h*.74,w-split,h*.26);
  c.fillStyle='#ffffff';c.font=`bold 30px ${JP}`;c.fillText('つめた〜い',split/2,h*.875,split*.9);c.font=`bold 22px ${JP}`;c.fillText('あったか〜い',split+(w-split)/2,h*.875,(w-split)*.92);
 });
 LABELLED.forEach((id,i)=>cell(ctx,LIT.label(i),(c,w,h)=>paintCan(c,VENDING_PRODUCTS.find(p=>p.id===id),w,h)));
 // a price plate for each price and temperature the window shows (blue strip cold, red strip hot)
 PRICES.forEach(([price,hot],i)=>cell(ctx,LIT.price(i),(c,w,h)=>{
  c.fillStyle='#fbfaf4';c.fillRect(0,0,w,h);c.fillStyle=hot?'#d6322a':'#2a63c4';c.fillRect(0,0,w,h*.22);
  c.fillStyle='#1b1b1b';c.textAlign='center';c.textBaseline='middle';c.font=`900 30px ${BOLD}`;c.fillText('¥'+price,w/2,h*.62,w*.9);}));
 for(const [key,col,hi] of [['lampCold','#2f7cf0','#bfe0ff'],['lampHot','#ec3a2c','#ffd0c4']])cell(ctx,LIT[key],(c,w,h)=>{
  c.fillStyle='#e8eef2';c.fillRect(0,0,w,h);const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,hi);g.addColorStop(.5,col);g.addColorStop(1,col);
  c.fillStyle=g;round(c,3,3,w-6,h-6,6);c.fill();c.fillStyle='rgba(255,255,255,.75)';c.fillRect(10,6,w-20,3);});
 for(const [key,bg,fg] of [['soldOn','#ff3b2a','#fff6d8'],['soldOff','#3b2422','#6e4e48']])cell(ctx,LIT[key],(c,w,h)=>{
  c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.font=`bold 18px ${JP}`;c.fillText('売切',w/2,h/2+1,w*.9);});
 cell(ctx,LIT.otsuri,(c,w,h)=>{c.fillStyle='#fffaf0';c.fillRect(0,0,w,h);c.fillStyle='#c4262e';c.textAlign='center';c.textBaseline='middle';c.font=`bold 24px ${JP}`;c.fillText('おつり',w/2,h/2+1);});
 cell(ctx,LIT.led,(c,w,h)=>{c.fillStyle='#1a0d0c';c.fillRect(0,0,w,h);c.fillStyle='#ff4a2a';c.textAlign='right';c.textBaseline='middle';c.font='bold 26px "Courier New",monospace';c.fillText('0',w-12,h/2+1);
  c.globalAlpha=.16;c.fillText('888',w-12,h/2+1);c.globalAlpha=1;});
 cell(ctx,LIT.bill,(c,w,h)=>{c.fillStyle='#55d07a';c.fillRect(0,0,w,h);c.fillStyle='#0f3a1c';c.textAlign='center';c.textBaseline='middle';c.font=`bold 20px ${JP}`;c.fillText('千円札 使えます',w/2,h/2+1,w*.92);});
 cell(ctx,LIT.backdrop,(c,w,h)=>{const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#fdfefe');g.addColorStop(.55,'#eef6f8');g.addColorStop(1,'#dbe8ee');c.fillStyle=g;c.fillRect(0,0,w,h);
  c.fillStyle='rgba(42,99,196,.045)';for(let x=-h;x<w;x+=46)c.fillRect(x,0,14,h);});
}
function paintPrint(ctx){
 const P=id=>VENDING_PRODUCTS.find(p=>p.id===id);
 // the front poster: J-Coffee, the machine's own hero and the port's can (the story's free can)
 cell(ctx,PRINT.poster,(c,w,h)=>{const p=P('j-coffee');
  c.fillStyle='#17130f';c.fillRect(0,0,w,h);c.fillStyle='#d9a441';c.fillRect(0,h-34,w,34);
  // the can, big, on the left
  const cx=150,top=52,cw=150,ch=290;c.fillStyle='#c9cdd0';round(c,cx-cw/2,top,cw,ch,18);c.fill();
  c.save();c.beginPath();c.rect(cx-cw/2,top+18,cw,ch-36);c.clip();c.translate(cx-cw/2-cw*.5,top+18);paintJCoffeeLabel(c,cw*2,ch-36);c.restore();
  c.fillStyle='rgba(255,255,255,.18)';c.fillRect(cx-cw/2+16,top+20,14,ch-40);
  c.fillStyle='#f3e6c4';c.textAlign='left';c.textBaseline='alphabetic';c.font=`900 74px ${BOLD}`;c.fillText('J-COFFEE',268,128,350);
  c.font=`bold 34px ${JP}`;c.fillText('BLACK · 無糖 · 350ml',272,182,340);
  c.fillStyle='#d9a441';c.font=`bold 44px ${JP}`;c.fillText('港の一本。',272,262,340);
  c.fillStyle='#f3e6c4';c.font='italic bold 28px Arial,sans-serif';c.fillText('The port’s own can',274,302,330);
  c.fillStyle='#17130f';c.textAlign='center';c.font=`900 26px ${BOLD}`;c.fillText('つめた〜い  ¥'+p.price,w/2,h-9);});
 // the sides: the island's tea on one, its soda on the other, for people coming along the pavement either way
 cell(ctx,PRINT.sideA,(c,w,h)=>{const p=P('sanpin');
  c.fillStyle='#f4ead0';c.fillRect(0,0,w,h);c.fillStyle=p.color;c.fillRect(0,0,w,h*.62);
  c.fillStyle='rgba(255,255,255,.85)';for(const [x,y,r] of [[50,60,18],[200,40,14],[180,150,22],[60,190,15],[130,230,12]]){for(let k=0;k<5;k++){const a=k*Math.PI*2/5;c.beginPath();c.ellipse(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,r*.5,r*.32,a,0,7);c.fill();}}
  c.fillStyle='#fffaf0';c.textAlign='center';c.textBaseline='middle';c.font=`bold 64px ${JP}`;c.fillText('さんぴん茶',w/2,h*.47,w*.92);
  c.fillStyle='#4a3a18';c.font=`900 40px ${BOLD}`;c.fillText(p.brand,w/2,h*.7,w*.9);c.font='bold 24px Arial,sans-serif';c.fillText('Okinawa’s jasmine tea',w/2,h*.79,w*.9);
  c.fillStyle='#2a63c4';c.fillRect(0,h*.86,w,h*.14);c.fillStyle='#fff';c.font=`bold 30px ${JP}`;c.fillText('つめた〜い ¥'+p.price,w/2,h*.93,w*.9);});
 cell(ctx,PRINT.sideB,(c,w,h)=>{const p=P('ryukyu-cola');
  c.fillStyle=p.color;c.fillRect(0,0,w,h);c.fillStyle='#fff8e8';c.beginPath();c.moveTo(0,h*.55);c.bezierCurveTo(w*.3,h*.45,w*.6,h*.68,w,h*.56);c.lineTo(w,h*.64);c.bezierCurveTo(w*.6,h*.76,w*.3,h*.53,0,h*.63);c.fill();
  c.fillStyle='rgba(255,255,255,.55)';for(const [x,y,r] of [[40,70,9],[70,120,6],[200,60,11],[180,140,7],[120,40,5],[220,200,8],[30,220,6]]){c.beginPath();c.arc(x,y,r,0,7);c.fill();}
  c.fillStyle='#fff8e8';c.textAlign='center';c.textBaseline='middle';c.font=`900 54px ${BOLD}`;c.fillText('RYUKYU',w/2,h*.32,w*.9);c.fillText('COLA',w/2,h*.44,w*.9);
  c.font=`bold 34px ${JP}`;c.fillText('スカッと冷えてる!',w/2,h*.76,w*.92);c.font=`bold 30px ${JP}`;c.fillText('つめた〜い ¥'+p.price,w/2,h*.88,w*.9);});
 // the money panel's printed face (the slots, the lever, the cup and the lit labels are parts on it)
 cell(ctx,PRINT.money,(c,w,h)=>{const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'#c9ced1');g.addColorStop(.5,'#e3e6e7');g.addColorStop(1,'#bfc4c7');c.fillStyle=g;c.fillRect(0,0,w,h);
  const m=VENDING_MACHINE.money,y=v=>(1-(v-m.y0)/(m.y1-m.y0))*h,x=u=>(u-m.x0)/(m.x1-m.x0)*w;   // panel metres to its pixels
  c.fillStyle='#2b2f33';c.textAlign='left';c.textBaseline='middle';c.font=`bold 15px ${JP}`;c.fillText('硬貨',x(.24),y(.887));
  const coin=(u,v,r,fill,label,hole=false)=>{c.beginPath();c.arc(x(u),y(v),r,0,7);c.fillStyle=fill;c.fill();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1.5;c.stroke();if(hole){c.beginPath();c.arc(x(u),y(v),r*.3,0,7);c.fillStyle='#e3e6e7';c.fill();}
   c.fillStyle='#2b2f33';c.font='bold 12px Arial,sans-serif';c.textAlign='center';c.fillText(label,x(u),y(v)+r+9);};
  coin(.25,.86,11,'#b87333','10');coin(.29,.86,10,'#d9dcdf','50',true);coin(.33,.86,11.5,'#d9dcdf','100');coin(.373,.86,13,'#d8c58a','500');
  c.fillStyle='#2b2f33';c.textAlign='left';c.font=`bold 15px ${JP}`;c.fillText('紙幣',x(.24),y(.815));
  c.font=`bold 16px ${JP}`;c.fillText('返却レバー',x(.235),y(.658));c.font='bold 18px Arial';c.fillText('▶',x(.345),y(.658));
  c.font=`12px ${JP}`;c.fillStyle='#4a4f53';c.fillText('お金を入れて',x(.235),y(.62));c.fillText('ボタンを押してください',x(.235),y(.604));
  c.fillStyle='#8a9094';c.fillRect(0,0,w,3);c.fillRect(0,h-3,w,3);c.fillRect(0,0,3,h);c.fillRect(w-3,0,3,h);});
 cell(ctx,PRINT.rating,(c,w,h)=>{const M=VENDING_MACHINE,R=M.rating;c.fillStyle='#d9dcdd';c.fillRect(0,0,w,h);c.strokeStyle='#5a5f63';c.lineWidth=3;c.strokeRect(4,4,w-8,h-8);
  c.fillStyle='#22262a';c.textAlign='left';c.textBaseline='middle';c.font=`bold 20px ${JP}`;c.fillText(M.maker.jp+'株式会社',14,24,w-28);const model=vendingModel();
  c.font=`16px ${JP}`;for(const [i,t] of [`自動販売機  ${model}`,`定格電圧 ${R.volts}V  ${R.hz}Hz`,`定格電流 ${R.amps.toFixed(1)}A`,`製造 ${M.maker.built}年  No. ${M.maker.serial}`,'屋外用'].entries())c.fillText(t,14,52+i*21,w-28);});
 // the maker's aluminium plate, in the house style of Johansson Marine's (johansson-marine.js livery.plate / plateText,
 // ferry-model.js drawPlate): a framed plate, the maker's name bold, then the model's own numbers
 cell(ctx,PRINT.badge,(c,w,h)=>{const lines=vendingMakerPlate(),rowH=(h-16)/lines.length;
  c.fillStyle='#dcd8c8';c.fillRect(0,0,w,h);c.strokeStyle='#1d2326';c.lineWidth=3;c.strokeRect(5,5,w-10,h-10);
  c.fillStyle='#1d2326';c.textAlign='center';c.textBaseline='middle';
  lines.forEach((line,i)=>{let size=Math.round(rowH*(i===0?.78:.66));const weight=i===0?'bold ':'';c.font=weight+size+'px Arial,sans-serif';const tw=c.measureText(line).width;
   if(tw>w-22){size=Math.max(6,Math.floor(size*(w-22)/tw));c.font=weight+size+'px Arial,sans-serif';}c.fillText(line,w/2,8+rowH*(i+.5));});});
 cell(ctx,PRINT.takeOut,(c,w,h)=>{c.fillStyle='#f2ecdc';c.fillRect(0,0,w,h);c.fillStyle='#3a3530';c.textAlign='center';c.textBaseline='middle';c.font=`bold 34px ${JP}`;c.fillText('取出口',w*.36,h/2+2);
  c.font='bold 20px Arial,sans-serif';c.fillText('▼ TAKE OUT',w*.66,h/2+2);});
}
let atlases=null;
function paintAtlases(){
 if(atlases)return atlases;atlases={lit:null,print:null};
 if(typeof document==='undefined'||!document.createElement)return atlases;
 for(const [key,paint] of [['lit',paintLit],['print',paintPrint]]){
  const canvas=document.createElement('canvas');canvas.width=S;canvas.height=S;const ctx=canvas.getContext?.('2d');if(!ctx)continue;
  paint(ctx);const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;atlases[key]=t;
 }
 return atlases;
}

/* -------------------------------------------------- the geometry -------------------------------------------------- */

const BEV=.012;
/** A rounded rectangle path (x0,y0)-(x1,y1), corner radius r, on a Shape or a Path. */
function roundRect(path,x0,y0,x1,y1,r){r=Math.max(.0005,Math.min(r,(x1-x0)/2-.0001,(y1-y0)/2-.0001));
 path.moveTo(x0+r,y0);path.lineTo(x1-r,y0);path.quadraticCurveTo(x1,y0,x1,y0+r);path.lineTo(x1,y1-r);path.quadraticCurveTo(x1,y1,x1-r,y1);
 path.lineTo(x0+r,y1);path.quadraticCurveTo(x0,y1,x0,y1-r);path.lineTo(x0,y0+r);path.quadraticCurveTo(x0,y0,x0+r,y0);return path;}
/**
 * A slab seen face on: the rectangle x0..x1, y0..y1 (rounded r) with rectangular holes, extruded back from zFront by
 * depth, every edge rounded by the bevel (the holes' edges too). The bevel grows a shape, so the shape is drawn that
 * much smaller and the holes that much bigger: the result measures what was asked.
 */
function slab(x0,x1,y0,y1,r,zFront,depth,holes=[],bev=BEV){
 const shape=roundRect(new THREE.Shape(),x0+bev,y0+bev,x1-bev,y1-bev,r-bev);
 for(const h of holes)shape.holes.push(roundRect(new THREE.Path(),h.x0-bev,h.y0-bev,h.x1+bev,h.y1+bev,(h.r??.02)+bev));
 const g=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.0005,depth-2*bev),bevelEnabled:true,bevelThickness:bev,bevelSize:bev,bevelSegments:2,curveSegments:4});
 g.translate(0,0,zFront-(depth-bev));return g;
}
const boxGeo=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const planeGeo=(w,h)=>new THREE.PlaneGeometry(w,h);
const LIGHT=new THREE.Vector3(.25,.62,.74).normalize();
/**
 * Collects the parts of one material: each part is placed, painted (its vertex colour, and for the textured buckets
 * its atlas cell) and kept until merge() makes one mesh of them.
 */
function bucket({uv=false,alpha=false}={}){
 const list=[],names=[],m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),n=new THREE.Vector3();
 return {list,names,
  add(geo,{c=0xffffff,a=1,cellRect=null,shade=null,at=[0,0,0],rot=[0,0,0],name=null}={}){
   let g=geo.index?geo.toNonIndexed():geo.clone();geo.dispose();
   for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);
   g.applyMatrix4(m.compose(new THREE.Vector3(...at),q.setFromEuler(e.set(...rot)),new THREE.Vector3(1,1,1)));
   const P=g.attributes.position,N=g.attributes.normal,count=P.count;
   if(uv){const U=g.attributes.uv??new THREE.BufferAttribute(new Float32Array(count*2),2),[x,y,w,h]=cellRect??LIT.white,inset=cellRect?0:.5;
    for(let i=0;i<count;i++){const u=cellRect?U.getX(i):inset,v=cellRect?U.getY(i):inset;U.setXY(i,(x+u*w)/S,1-(y+(1-v)*h)/S);}
    g.setAttribute('uv',U);}
   else g.deleteAttribute('uv');
   const col=new THREE.Color(c),out=new Float32Array(count*(alpha?4:3));
   for(let i=0;i<count;i++){let k=1;if(shade){n.fromBufferAttribute(N,i);k=shade[0]+shade[1]*Math.max(0,n.dot(LIGHT));}
    out[i*(alpha?4:3)]=col.r*k;out[i*(alpha?4:3)+1]=col.g*k;out[i*(alpha?4:3)+2]=col.b*k;if(alpha)out[i*4+3]=a;}
   g.setAttribute('color',new THREE.BufferAttribute(out,alpha?4:3));
   list.push(g);if(name&&!names.includes(name))names.push(name);return g;
  },
  merge(){if(!list.length)return null;const g=mergeGeometries(list,false);list.forEach(x=>x.dispose());list.length=0;g.computeBoundingBox();g.computeBoundingSphere();return g;},
 };
}

/** A dummy can standing on its base at (x,y,z), its printed front to +z: body, shoulder, base and lid. */
function sampleCan(lit,product,size,[x,y,z]){
 const C=VENDING_MACHINE.cans[size],r=C.diameter/2,H=C.height,i=LABELLED.indexOf(product.id);
 const shade=[.74,.3],alu=0xc9cdd0;
 lit.add(new THREE.CylinderGeometry(r,r,H*.86,14,1,true).rotateY(Math.PI),{cellRect:LIT.label(i),shade,at:[x,y+H*.5,z]});
 lit.add(new THREE.CylinderGeometry(r*.86,r,H*.07,14,1,true),{c:alu,shade,at:[x,y+H*.965,z]});
 lit.add(new THREE.CylinderGeometry(r,r*.9,H*.07,14,1,true),{c:alu,shade,at:[x,y+H*.035,z]});
 lit.add(new THREE.CircleGeometry(r*.86,14).rotateX(-Math.PI/2),{c:0xdfe2e4,at:[x,y+H,z]});
}

let geometryCache=new Map();
/** Builds (once for each kind) the machine's merged geometries: body, print, lit, clear (glass), flap, lever, pool. */
function machineGeometry({pad=true}={}){
 const key=pad?'pad':'bare';if(geometryCache.has(key))return geometryCache.get(key);
 const M=VENDING_MACHINE,{width:W,height:H,depth:D,door:DOOR}=M.size,F=D/2,Y=pad?M.size.pad:0,WW=M.windowWidth;
 const body=bucket(),print=bucket({uv:true}),lit=bucket({uv:true}),clear=bucket({alpha:true}),flapB=bucket({alpha:true});let hingeAt=[0,0,0];
 const RED=0xc4262e,CREAM=0xf2ecdc,DARK=0x2b2f33,STEEL=0xbfc4c7,CHROME=0xdfe3e5,KICK=0x3a3d40,GREYP=0xe4e1d8;
 const face=F+.008;   // the cream face panel's front, on the door
 // ---- the concrete pad it stands on, poured flush with its back
 if(pad){const s=M.size,e=.006,shape=roundRect(new THREE.Shape(),-W/2-s.padSide+e,-(F+s.padFront)+e,W/2+s.padSide-e,D/2-e,.03);
  const g=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.001,s.pad-.012),bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:1,curveSegments:3});
  g.rotateX(-Math.PI/2);g.translate(0,.006,0);body.add(g,{c:0xb5b1a7,name:'Vending pad'});}
 // ---- the kick plate under the cabinet, set back, with its air slots (the condenser breathes in at the bottom)
 body.add(boxGeo(W-.1,.072,D-.1),{c:KICK,at:[0,Y+.036,-.03],name:'Vending plinth'});
 for(let i=0;i<9;i++)body.add(boxGeo(.07,.012,.004),{c:0x1d1f22,at:[-.36+i*.09,Y+.036,F-.08+.002]});
 // ---- the cabinet: pressed steel in the bottler's red, every edge rounded; the door is a slab of its own in front
 body.add(slab(-W/2,W/2,Y+.07,Y+H,.05,F-DOOR,D-DOOR),{c:RED,name:'Vending cabinet'});
 // (the openings' corners nearly square: the lit linings inside are flat panels, and a round corner would show the door's red past them)
 const holes=[...M.bands.map(b=>({x0:-WW/2,x1:WW/2,y0:Y+b.bottom,y1:Y+b.top,r:.0015})),{x0:M.pocket.x0,x1:M.pocket.x1,y0:Y+M.pocket.y0,y1:Y+M.pocket.y1,r:.0015}];
 body.add(slab(-W/2,W/2,Y+.07,Y+H,.05,F,DOOR,holes),{c:RED,name:'Vending door'});
 // hinges on the left, at the seam
 for(const y of [.42,1.52])body.add(boxGeo(.008,.09,.03),{c:DARK,at:[-W/2-.003,Y+y,F-DOOR],name:'Door hinge'});
 // ---- the header: the lit name panel in its dark bezel
 {const h=M.header,hw=h.width/2;
  for(const [w,hh,x,y] of [[h.width+.016,.009,0,h.top+.004],[h.width+.016,.009,0,h.bottom-.004],[.009,h.top-h.bottom,-hw-.004,(h.top+h.bottom)/2],[.009,h.top-h.bottom,hw+.004,(h.top+h.bottom)/2]])
   body.add(boxGeo(w,hh,.014),{c:DARK,at:[x,Y+y,F+.005],name:'Header bezel'});
  lit.add(planeGeo(h.width,h.top-h.bottom),{cellRect:LIT.header,at:[0,Y+(h.top+h.bottom)/2,F+.003],name:'Vending header'});}
 // ---- the window: two bands, each a lit box of dummy cans behind glass, the price plates on the lip, the buttons below
 const colX=c=>-WW/2+WW*(c+.5)/8,samples=[];
 for(const b of M.bands){const yb=Y+b.bottom,yt=Y+b.top,back=F-.19,lip=.034,mid=(yb+yt)/2,h=yt-yb;
  lit.add(planeGeo(WW,h),{cellRect:LIT.backdrop,at:[0,mid,back],name:'Vending display window'});
  lit.add(planeGeo(WW,.19).rotateX(Math.PI/2),{c:0xfbfdff,at:[0,yt-.001,F-.095]});                                   // the tube's diffuser
  for(const s of [-1,1])lit.add(planeGeo(.19,h).rotateY(-s*Math.PI/2),{c:0xe2eaee,at:[s*(WW/2-.001),mid,F-.095]});
  lit.add(planeGeo(WW,.19-.035).rotateX(-Math.PI/2),{c:0xd5dde0,at:[0,yb+lip,back+(.19-.035)/2]});             // the shelf the cans stand on
  lit.add(planeGeo(WW,lip),{c:0xc9d2d6,at:[0,yb+lip/2,F-.035]});                                                   // its lip
  for(let c=0;c<8;c++){const col=VENDING_COLUMNS[b.row*8+c],x=colX(c);
   lit.add(planeGeo(.074,.026),{cellRect:LIT.price(priceKey(col)),at:[x,yb+lip/2,F-.034],name:'Price plate'});
   sampleCan(lit,VENDING_PRODUCTS.find(p=>p.id===col.id),col.size,[x,yb+lip,F-.105]);
   samples.push(Object.freeze({id:col.id,row:b.row,col:c,size:col.size,soldOut:col.soldOut,hot:col.hot,x,y:yb+lip,z:F-.105,glass:F-.008,back,top:yt}));
   // on the rail below: the push button with its lamp, and the sold-out lamp above it
   const ry=Y+b.rail;
   body.add(boxGeo(.066,.032,.012),{c:0xe8ecee,at:[x,ry+.024,face+.006],name:'Push button'});
   lit.add(planeGeo(.058,.025),{cellRect:col.hot?LIT.lampHot:LIT.lampCold,at:[x,ry+.024,face+.0125]});
   lit.add(planeGeo(.034,.012),{cellRect:col.soldOut?LIT.soldOn:LIT.soldOff,at:[x,ry+.051,face+.002],name:'Sold-out lamp'});
  }
  body.add(boxGeo(WW+.01,.065,.008),{c:GREYP,at:[0,Y+b.rail+.0325,F+.004],name:'Button rail'});
  // the glass: faintly blue, with two soft streaks of the street's light across it
  clear.add(planeGeo(WW,h),{c:0xcfe6ee,a:.08,at:[0,mid,F-.008],name:'Vending glass'});
  for(const [x0,w] of [[-.3,.05],[-.18,.022],[.22,.04]]){const g=new THREE.BufferGeometry(),t=h*.42;
   g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([x0,-h/2,0,x0+w,-h/2,0,x0+w+t,h/2,0,x0,-h/2,0,x0+w+t,h/2,0,x0+t,h/2,0]),3));g.computeVertexNormals();
   clear.add(g,{c:0xffffff,a:.13,at:[0,mid,F-.0075]});}
 }
 // ---- the lower door: its cream face panel round the pocket, the poster, the money panel
 const P=M.pocket;
 {const shape=roundRect(new THREE.Shape(),-.465,Y+.095,.465,Y+M.faceTop,.02);shape.holes.push(roundRect(new THREE.Path(),P.x0,Y+P.y0,P.x1,Y+P.y1,.0015));
  const g=new THREE.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:false,curveSegments:4});g.translate(0,0,F);body.add(g,{c:CREAM,name:'Vending face panel'});}   // (seated on the door: no slit behind it)
 print.add(planeGeo(.62,.42),{cellRect:PRINT.poster,at:[-.13,Y+.71,face+.006],name:'Vending poster'});
 body.add(boxGeo(.632,.432,.006),{c:DARK,at:[-.13,Y+.71,face+.002]});
 print.add(planeGeo(.62,.034),{cellRect:PRINT.takeOut,at:[(P.x0+P.x1)/2,Y+.392,face+.001],name:'Take-out label'});
 print.add(planeGeo(.17,.074),{cellRect:PRINT.badge,at:[.34,Y+.2,face+.004],name:'Maker’s plate'});
 body.add(boxGeo(.176,.08,.004),{c:0x8a9094,at:[.34,Y+.2,face+.001]});
 // the money panel: stainless, with its slots, lit labels, lever housing and change cup
 {const m=M.money,cx=(m.x0+m.x1)/2,cy=(m.y0+m.y1)/2,z=face+.012;
  body.add(new THREE.BoxGeometry(m.x1-m.x0+.012,m.y1-m.y0+.012,.024),{c:STEEL,at:[cx,Y+cy,face],name:'Vending money panel'});
  print.add(planeGeo(m.x1-m.x0,m.y1-m.y0),{cellRect:PRINT.money,at:[cx,Y+cy,z+.0005]});
  lit.add(planeGeo(.1,.028),{cellRect:LIT.led,at:[.30,Y+.91,z+.0015],name:'Amount display'});
  body.add(boxGeo(.04,.085,.01),{c:CHROME,at:[.415,Y+.86,z+.005],name:'Coin slot'});body.add(boxGeo(.008,.05,.004),{c:0x0e0f10,at:[.415,Y+.86,z+.0105]});
  body.add(boxGeo(.19,.036,.012),{c:CHROME,at:[.34,Y+.765,z+.006],name:'Note slot'});body.add(boxGeo(.15,.008,.004),{c:0x0e0f10,at:[.34,Y+.765,z+.0125]});
  lit.add(planeGeo(.1,.022),{cellRect:LIT.bill,at:[.30,Y+.799,z+.0015],name:'Note lamp'});
  body.add(boxGeo(.07,.05,.01),{c:0x1d1f22,at:[.41,Y+.658,z+.003],name:'Return lever housing'});
  lit.add(planeGeo(.15,.026),{cellRect:LIT.otsuri,at:[.34,Y+.58,z+.0015],name:'Change label'});
  body.add(boxGeo(.15,.09,.022),{c:CHROME,at:[.34,Y+.505,z+.011],name:'Change cup'});body.add(boxGeo(.12,.06,.004),{c:0x101113,at:[.34,Y+.512,z+.0225]});
  body.add(boxGeo(.13,.016,.05),{c:CHROME,at:[.34,Y+.467,z+.03]});}
 // the T-handle lock of the door, on its right, below the money panel
 body.add(new THREE.CylinderGeometry(.022,.022,.014,16).rotateX(Math.PI/2),{c:CHROME,at:[.34,Y+.31,face+.007],name:'Vending lock'});
 body.add(boxGeo(.012,.05,.012),{c:0x9aa0a4,at:[.34,Y+.31,face+.019]});body.add(new THREE.CylinderGeometry(.005,.005,.004,10).rotateX(Math.PI/2),{c:0x2b2f33,at:[.34,Y+.34,face+.015]});
 // ---- the take-out pocket: a light-lined bin, its smoked flap hanging in the mouth from a bright hinge bar
 // (its floor, sides and top are lined right out to the face panel's front, so no edge of the door shows in the mouth)
 {const z0=F-P.depth,zf=F+.008,zc=(z0+zf)/2,L=zf-z0,w=P.x1-P.x0,h=P.y1-P.y0,cx=(P.x0+P.x1)/2,cy=Y+(P.y0+P.y1)/2;
  lit.add(planeGeo(w,h),{c:0x6d757a,at:[cx,cy,z0+.001],name:'Take-out pocket'});
  lit.add(planeGeo(w,L).rotateX(-Math.PI/2),{c:0x9aa3a8,at:[cx,Y+P.y0+.001,zc],name:'Take-out pocket floor'});
  lit.add(planeGeo(w,L).rotateX(Math.PI/2),{c:0x3f4549,at:[cx,Y+P.y1-.001,zc]});
  for(const s of [-1,1])lit.add(planeGeo(L,h).rotateY(-s*Math.PI/2),{c:0x596166,at:[s>0?P.x1-.001:P.x0+.001,cy,zc]});
  body.add(boxGeo(w-.01,.014,.014),{c:CHROME,at:[cx,Y+P.y1-.008,F-.004],name:'Flap hinge'});
  for(const [ww,hh,x,y] of [[w+.024,.012,cx,Y+P.y1+.006],[w+.024,.012,cx,Y+P.y0-.006],[.012,h,P.x0-.006,cy],[.012,h,P.x1+.006,cy]])body.add(boxGeo(ww,hh,.01),{c:CHROME,at:[x,y,face+.003],name:'Pocket trim'});
  // the flap is its own piece, hung from the hinge bar (so it can swing: userData.setFlap), in the hinge's frame
  hingeAt=[cx,Y+P.y1-.008,F-.006];
  flapB.add(planeGeo(w-.012,h-.02),{c:0x1c2226,a:.34,at:[0,cy-.004-hingeAt[1],0],name:'Take-out flap'});
  flapB.add(planeGeo(w-.03,.014),{c:0xffffff,a:.16,at:[0,Y+P.y1-.03-hingeAt[1],.0005]});                               // the light along its top
  body.add(boxGeo(w-.014,.01,.008),{c:0x23282b,at:[cx,Y+P.y0+.016,F-.006],name:'Flap lip'});}
 // ---- the sides: a poster on each, the louvres low at the back, the rating plate on the right
 for(const s of [-1,1]){const x=s*(W/2+.0035);
  print.add(planeGeo(.45,.73).rotateY(s*Math.PI/2),{cellRect:s<0?PRINT.sideA:PRINT.sideB,at:[x,Y+1.145,-.095],name:'Vending side poster'});
  body.add(boxGeo(.004,.742,.462),{c:0xe9e3d3,at:[s*(W/2+.0005),Y+1.145,-.095]});
  for(let i=0;i<6;i++)body.add(boxGeo(.006,.012,.22),{c:0x7e1a1f,at:[s*(W/2+.002),Y+.14+i*.034,-.21],name:'Vending vents'});}
 print.add(planeGeo(.11,.07).rotateY(Math.PI/2),{cellRect:PRINT.rating,at:[W/2+.0025,Y+.52,-.25],name:'Vending rating plate'});
 // ---- the back: the condenser grille and the cord's grommet
 body.add(boxGeo(.6,.26,.006),{c:0x5a1418,at:[0,Y+.3,-D/2-.002],name:'Back grille'});
 for(let i=0;i<7;i++)body.add(boxGeo(.58,.01,.004),{c:0x2a0b0d,at:[0,Y+.19+i*.035,-D/2-.006]});
 body.add(new THREE.CylinderGeometry(.016,.016,.012,12).rotateX(Math.PI/2),{c:0x1d1f22,at:[M.cord.x,Y+M.cord.y,-D/2-.005],name:'Cord grommet'});
 // ---- the lever, its own piece (pivot at its back, so it can be pushed down)
 const lever=new THREE.BoxGeometry(.044,.014,.034);lever.translate(0,0,.017);
 const glow=new THREE.BufferGeometry();{const n=20,pos=[],col=[];
  // the machine's light on the pavement at night: a soft half-oval out from its pad
  for(let i=0;i<n;i++){const a0=Math.PI*i/n,a1=Math.PI*(i+1)/n;for(const [px,pz,al] of [[0,0,1],[Math.cos(a0)*.95,Math.sin(a0)*1.25,0],[Math.cos(a1)*.95,Math.sin(a1)*1.25,0]]){pos.push(px,0,pz);col.push(.86,.94,1,al*.36);}}
  glow.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));glow.setAttribute('color',new THREE.BufferAttribute(new Float32Array(col),4));
  glow.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(pos.length).map((_,i)=>i%3===1?1:0),3));
  glow.translate(0,.004,F+(pad?M.size.padFront:0)+.01);glow.computeBoundingSphere();}
 const names=[...body.names,...print.names,...lit.names,...clear.names,...flapB.names];
 const out={body:body.merge(),print:print.merge(),lit:lit.merge(),clear:clear.merge(),flap:flapB.merge(),hingeAt,lever,glow,names,Y,samples:Object.freeze(samples)};
 geometryCache.set(key,out);return out;
}

let shared=null;
function sharedMaterials(){
 if(shared)return shared;const A=paintAtlases();
 shared={body:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.12}),
  // The printed and lit panels are decals a millimetre or two over the body: drawn with polygon offset, as the town's
  // decal layers are, so a phone's depth buffer never lets the body flash through them at a distance.
  print:new THREE.MeshStandardMaterial({vertexColors:true,map:A.print,roughness:.55,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),
  lever:new THREE.MeshStandardMaterial({color:0xd8342c,roughness:.4}),lit:A.lit};
 return shared;
}

/**
 * A Japanese can vending machine of the mid-1990s (VENDING_MACHINE has its measurements and VENDING_COLUMNS what
 * stands in its window), fronted on +z, its origin on the ground under its middle. pad: it stands on a slight
 * concrete pad (outdoors). The lit window, header, lamps and labels are one unlit mesh ('Vending lit panels'), so a
 * story dims them all at once (halloween.js); userData.night(k) lights its pool on the pavement after dark (0 … 1);
 * userData.setLever(k) pushes the coin-return lever down (0 … 1); userData.setFlap(k) swings the take-out flap (+ in, - out). userData.takeOut is where a dropped can lies (its
 * axis across the machine), userData.cordExit where its power cord leaves the back, userData.top its height.
 */
export function createVendingMachine({shadows=false,pad=true}={}){
 const M=VENDING_MACHINE,G=machineGeometry({pad}),mats=sharedMaterials(),{depth:D}=M.size,F=D/2;
 const group=new THREE.Group();group.name='Harbour vending machine';
 const add=(geo,mat,name,cast=false)=>{if(!geo)return null;const m=new THREE.Mesh(geo,mat);m.name=name;m.castShadow=shadows&&cast;m.receiveShadow=true;group.add(m);return m;};
 add(G.body,mats.body,'Vending machine body',true);
 add(G.print,mats.print,'Vending printed panels');
 // its own unlit materials (a story dims one machine, not every machine in town)
 add(G.lit,new THREE.MeshBasicMaterial({map:mats.lit,vertexColors:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2}),'Vending lit panels');
 const clearMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false});
 add(G.clear,clearMat,'Vending glass');
 const flap=add(G.flap,clearMat,'Take-out flap');flap.position.set(...G.hingeAt);
 const lever=add(G.lever,mats.lever,'Coin return lever',true);lever.position.set(.41,G.Y+.658,F+.008+.012+.006);
 const poolMat=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0,toneMapped:false});
 const pool=pad?add(G.glow,poolMat,'Vending light on the pavement'):null;if(pool){pool.visible=false;pool.receiveShadow=false;pool.renderOrder=1;}
 const cans=VENDING_COLUMNS.map(()=>'can');
 group.userData.parts=[...G.names,'Coin return lever',...cans];
 group.userData.columns=VENDING_COLUMNS;group.userData.samples=G.samples;   // where each dummy can stands, in its frame
 group.userData.lever=lever;group.userData.flap=flap;
 // the flap: + pushed in (a hand reaching for the can, 1 = fully in), - stirred outward (the chute's cold air); radians = k × swing
 group.userData.setFlap=k=>{flap.rotation.x=THREE.MathUtils.clamp(k,-1,1)*M.flap.swing;};
 group.userData.setLever=k=>{lever.rotation.x=THREE.MathUtils.clamp(k,0,1)*M.lever.travel;};
 group.userData.night=k=>{if(!pool)return;poolMat.opacity=THREE.MathUtils.clamp(k,0,1);pool.visible=poolMat.opacity>.02;};
 const at=vendingPoints({pad});
 group.userData.takeOut=at.takeOut;group.userData.cordExit=at.cordExit;group.userData.top=at.top;
 return group;
}
