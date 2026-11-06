#!/usr/bin/env node
/**
 * Run once (batch 2a of Studio over MCP, stage 2): writes data/studio/products.json from what World's modules said
 * about Sakura Shōten's products before they moved into data, so the move changes nothing World draws or does.
 *
 *   node johansson-town/tools/studio/seed-products.mjs [--force]
 *
 * It reads the snapshot of every legacy export (tests/fixtures/products-legacy.json, taken by products-snapshot.mjs
 * before any module was touched), plus the few facts that lived only in code: how each pack is built on the shelf
 * (shop-product.js) and which bay each line stands in (sakura-layout.js). tests/products-move.test.mjs proves the result:
 * the views over the data give back every export, every shelf, every atlas cell and the same geometry.
 *
 * Every product gets its own atlas cells (its label, its shelf price tag, each flavour), so adding or retiring a
 * product never moves another one's cells. The products are listed the way Thuan walks the floor (the order
 * MERCHANDISING always had); the catalogue's order is the order of the price tags.
 */
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {openRepo,PATHS,jsonText,serial} from './repo.mjs';
import {productsModule} from './build-data.mjs';
import {FRESH_LABELS} from '../../src/commerce/fresh-labels.js';

const town=fileURLToPath(new URL('../../',import.meta.url));
/** How each pack is built on the shelf (shop-product.js before the move), in metres: the shape, its size, and what else it has. */
const MESH={
 tea:{shape:'bottle',size:[.092,.26,.092],colour:'#657d3c'},water:{shape:'bottle',size:[.092,.26,.092],colour:'#afd5d4'},
 cola:{shape:'bottle',size:[.092,.26,.092],colour:'#443126'},soy:{shape:'bottle',size:[.092,.26,.092],colour:'#392d23'},
 orange:{shape:'bottle',size:[.092,.26,.092],colour:'#e6a038'},soda:{shape:'bottle',size:[.074,.26,.074],colour:'#afd6da',detail:'marble'},
 coffee:{shape:'can',size:[.094,.135,.094]},beer:{shape:'can',size:[.094,.135,.094]},tuna:{shape:'can',size:[.102,.046,.102]},peaches:{shape:'can',size:[.106,.095,.106]},
 noodles:{shape:'cup',size:[.136,.13,.136]},yogurt:{shape:'cup',size:[.096,.078,.096]},pudding:{shape:'foil-cup',size:[.076,.062,.076]},
 milk:{shape:'carton',size:[.093,.2,.093]},bento:{shape:'tray',size:[.19,.052,.135]},sandwich:{shape:'wedge',size:[.12,.12,.052]},
 chips:{shape:'bag',size:[.16,.22,.07]},crackers:{shape:'bag',size:[.16,.22,.07]},candy:{shape:'bag',size:[.16,.22,.07]},
 bread:{shape:'bag',size:[.19,.235,.12]},rice:{shape:'bag',size:[.15,.12,.09]},bun:{shape:'bag',size:[.15,.12,.09]},
 biscuit:{shape:'box',size:[.18,.22,.075]},detergent:{shape:'box',size:[.18,.255,.095]},tissues:{shape:'box',size:[.22,.075,.11],detail:'tissue-slot'},
 toothpaste:{shape:'box',size:[.205,.05,.045]},curry:{shape:'box',size:[.16,.13,.045]},soup:{shape:'box',size:[.14,.17,.05]},
 chocolate:{shape:'box',size:[.17,.1,.018]},battery:{shape:'box',size:[.105,.15,.03]},soap:{shape:'box',size:[.14,.08,.07]},
 notebook:{shape:'box',size:[.15,.18,.025],detail:'pages'},postcard:{shape:'box',size:[.15,.18,.025],detail:'pages'},
};
/** The gondola bays (sakura-layout.js before the move): the lines on each, lowest boards first. */
const BAYS={'west-front':['noodles','soup','curry'],'west-back':['soy','tuna','peaches'],'middle-front':['crackers','chips','biscuit'],'middle-back':['candy','chocolate'],
 'east-front-1':['detergent','soap'],'east-front-2':['tissues','toothpaste'],'east-back-1':['battery','notebook'],'east-back-2':['postcard']};
/** Printed matter in the atlas that is not stock: what it is, and how the shelf builds it where it is built. */
const PRINTS={
 stock:{what:'Sakura\'s delivery carton: the cartons on the delivery shelf, by the back door and in the back room.',pack:{shape:'box',size:[.32,.22,.25]}},
 shop:{what:'Sakura Shōten\'s own mark, painted on the first packaging sheet; nothing on the floor carries it yet.'},
 'magazine-sea':{what:'A monthly for the rack under the window: read standing up, never sold.',pack:{shape:'magazine',size:[.21,.245,.013]}},
 'magazine-night':{what:'A weekly for the rack under the window: read standing up, never sold.',pack:{shape:'magazine',size:[.21,.245,.013]}},
 'magazine-rod':{what:'The fishing monthly for the rack under the window: read standing up, never sold.',pack:{shape:'magazine',size:[.21,.245,.013]}},
 newspaper:{what:'The Minato Shimbun\'s evening edition, on the rack and in the comics.',pack:{shape:'newspaper',size:[.285,.021,.205]}},
};
const FRIDGE_LEVELS=[.34,.70,1.06,1.42,1.78],CHILLER_LEVELS=[.42,.76,1.1,1.44],CHILLER_BAYS=[-.93,.43,1.79];
const hex=n=>'#'+n.toString(16).padStart(6,'0');

export function seed(legacy){
 const flavourCells=new Map();let next=0;
 for(const [id,list] of Object.entries(legacy.FLAVOURS))flavourCells.set(id,list.map(([name,hue])=>({name,hue,cell:next++})));
 const vendingNames=new Set(legacy.VENDING_PRODUCTS.map(p=>p.inventoryName));
 const products=Object.keys(legacy.MERCHANDISING).map(id=>{
  const stock=legacy.SHOP_STOCK.find(s=>s.id===id),item=legacy.GROCERY_ITEMS.find(i=>i.id===id)||null,key=id==='bun'?'buns':id;
  const brand=legacy.STORE_BRANDS[key],cell=legacy.packagingSlot[id],packs=legacy.PACKS[id],back=legacy.back[id],mesh=MESH[id],merch=legacy.MERCHANDISING[id];
  if(!stock||!brand||!packs||!mesh)throw Error(`The legacy snapshot is missing part of ${id}.`);
  const declared={};
  if(packs.shape!==mesh.shape)declared.shape=packs.shape;
  if(JSON.stringify(packs.size)!==JSON.stringify(mesh.size))declared.size=packs.size;
  const pack={shape:mesh.shape,size:mesh.size,...mesh.colour?{colour:mesh.colour}:{},...mesh.detail?{detail:mesh.detail}:{},
   net:packs.net,flash:packs.flash,tag:packs.tag,art:packs.art,
   back:{ingredients:back.ingredients,unit:back.unit,recycle:back.recycle,food:back.food},...Object.keys(declared).length?{declared}:{}};
  const label=FRESH_LABELS.includes(id)?{source:'fresh'}:cell<32?{source:'painted',sheet:Math.floor(cell/16),cell:cell%16}:null;
  if(!label)throw Error(`${id} has no painted or fresh label.`);
  const s=legacy.SAKURA_SHELVES[id];let shelf;
  if(s.fitting==='fridge')shelf={fitting:'fridge',column:s.fridge,levels:s.levels.map(y=>FRIDGE_LEVELS.indexOf(y))};
  else if(s.fitting==='chiller')shelf={fitting:'chiller',bay:CHILLER_BAYS.indexOf(s.z),deck:s.levels[0]===CHILLER_LEVELS[2]?'upper':'lower'};
  else if(s.fitting==='steamer')shelf={fitting:'steamer'};
  else{const bay=Object.keys(BAYS).find(b=>BAYS[b].includes(id));shelf={fitting:s.fitting,bay,order:BAYS[bay].indexOf(id)};}
  const supplier=legacy.SOURCED_FROM[id]||'sakura',name=stock.name;
  const drink=legacy.DRINKABLE.includes(name)&&!vendingNames.has(name)?{alcohol:supplier==='higa-saketen',container:legacy.emptyFor[name]==='Empty can'?'can':'bottle',handColour:hex(legacy.canColour[name])}:null;
  const unitCost=Math.ceil(stock.cost*55/100)===stock.unitCost?null:stock.unitCost;
  return {id,inventoryName:name,shop:'sakura',name,jp:item?item.jp:'Meat bun',price:stock.cost,...unitCost!=null?{unitCost}:{},
   text:item?item.text:'A wrapped steamed bun to take away.',bagColour:item?hex(item.color):null,...legacy.STORE_ITEMS.some(i=>i.id===id)?{mailOrder:true}:{},
   brand:{name:brand.name,jp:brand.jp,line:brand.line,paper:brand.paper,ink:brand.ink,accent:brand.accent,symbol:brand.symbol},
   pack,label,cells:{...key!==id?{key}:{},brand:cell,price:legacy.priceSlot[id],flavours:flavourCells.get(id)||[]},
   purpose:{zone:merch.zone,for:merch.for,why:merch.why,placed:merch.placed},shelf,capacity:stock.capacity,supplier,...drink?{drink}:{}};
 });
 const prints=legacy.BRAND_ATLAS_KEYS.filter(k=>!products.some(p=>(p.cells.key||p.id)===k)).map(key=>{
  const b=legacy.STORE_BRANDS[key],extra=PRINTS[key];if(!extra)throw Error(`The print ${key} has no description.`);
  return {key,cell:legacy.packagingSlot[key],what:extra.what,...b?{brand:{name:b.name,jp:b.jp,line:b.line,paper:b.paper,ink:b.ink,accent:b.accent,symbol:b.symbol}}:{},...extra.pack?{pack:extra.pack}:{}};
 });
 return {format:'johansson-products',version:1,products,prints,retired:[]};
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const repo=openRepo(),legacy=JSON.parse(await readFile(resolve(town,'tests/fixtures/products-legacy.json'),'utf8'));
 if(await repo.exists(PATHS.products)&&!process.argv.includes('--force')){console.error(`${PATHS.products} exists already: the seed runs once. Studio changes it from now on.`);process.exit(1);}
 const text=jsonText(seed(legacy));
 await serial(()=>repo.locked(()=>repo.writeAll([[PATHS.products,text],[PATHS.productsModule,productsModule(text)]])));
 console.log(`Wrote ${PATHS.products} and ${PATHS.productsModule}.`);
}
