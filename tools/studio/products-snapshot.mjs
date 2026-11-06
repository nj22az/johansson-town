#!/usr/bin/env node
/**
 * A snapshot of everything World says about Sakura Shōten's products, as World's own modules export it: the brands and
 * their atlas order, the catalogue, the packs and their backs, the flavours, why each line is stocked and where it
 * stands, the stock, what you can drink, the shelves, every atlas cell and flavour shift, and a fingerprint of every
 * pack's geometry (shelf and close-up). It was taken once before the products moved into data/studio/products.json
 * (tests/fixtures/products-legacy.json, batch 2a), and tests/products-move.test.mjs takes it again from the views over
 * the data: the two must be the same, so the move changed nothing World draws or does.
 *
 *   node johansson-town/tools/studio/products-snapshot.mjs --write tests/fixtures/products-legacy.json
 *
 * A few things were never exported (the ingredients, the back panel's food, unit and recycling mark, the close-up's
 * round and top-printed packs, the price-tag cells): before the move they are read from the source exactly as the code
 * computed them; after it, from the exports the views added for them.
 */
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';

const town=fileURLToPath(new URL('../../',import.meta.url));
const source=path=>readFile(resolve(town,path),'utf8');
/** A JavaScript literal from a module's source: `const NAME=<literal>;` (only for values the module never exported). */
async function literal(path,pattern){
 const text=await source(path),match=text.match(pattern);
 if(!match)throw Error(`${path} no longer has ${pattern}`);
 return Function(`"use strict";return (${match[1]});`)();
}
const json=value=>JSON.parse(JSON.stringify(value,(k,v)=>v instanceof Set?[...v]:v));
/** The sha256 of a geometry's attributes and index, so two meshes are the same only if every number is. */
function geometrySha(geometry){
 const hash=createHash('sha256');
 for(const name of Object.keys(geometry.attributes).sort()){const a=geometry.attributes[name];hash.update(name+':'+a.itemSize+':'+a.count+'\0').update(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength));}
 if(geometry.index)hash.update('index\0').update(Buffer.from(geometry.index.array.buffer,geometry.index.array.byteOffset,geometry.index.array.byteLength));
 return hash.digest('hex');
}

export async function productSnapshot(){
 const [brands,catalogue,packaging,flavours,merch,stock,vending,layout,advertising,shopProduct,food,viewer]=await Promise.all([
  import('../../src/commerce/brands.js'),import('../../src/commerce/catalogue.js'),import('../../src/commerce/packaging-art.js'),
  import('../../src/commerce/flavours.js'),import('../../src/commerce/merchandising.js'),import('../../src/commerce/shop-stock.js'),
  import('../../src/commerce/vending-catalogue.js'),import('../../src/world/interiors/sakura-layout.js'),
  import('../../src/world/interiors/store-advertising.js'),import('../../src/commerce/shop-product.js'),
  import('../../src/world/interiors/sakura-food-products.js'),import('../../src/world/interiors/item-viewer.js')]);
 const ids=stock.SHOP_STOCK.map(s=>s.id),keys=[...brands.BRAND_ATLAS_KEYS],every=[...new Set([...keys,...ids])];
 // Never exported before the move: read from the source as the code had them.
 const INGREDIENTS=packaging.INGREDIENTS??await literal('src/commerce/packaging-art.js',/\nconst INGREDIENTS=(\{[\s\S]*?\n\});/);
 let back=packaging.backPanel;
 if(!back){
  const FOOD=await literal('src/commerce/packaging-art.js',/\nconst FOOD=(new Set\(\[[^\]]*\]\));/);
  const BOTTLE=await literal('src/commerce/packaging-art.js',/'Nutrition \(per '\+\((\[[^\]]*\])\.includes\(id\)/);
  const [PET,CAN]=(await source('src/commerce/packaging-art.js')).match(/text\(ctx,(\[[^\]]*\])\.includes\(id\)\?'PET':(\[[^\]]*\])\.includes\(id\)\?'CAN':'PLA'/).slice(1).map(s=>Function(`return ${s}`)());
  back=id=>({food:FOOD.has(id),unit:BOTTLE.includes(id)?'bottle':'pack',recycle:PET.includes(id)?'PET':CAN.includes(id)?'CAN':'PLA',ingredients:INGREDIENTS[id]});
 }
 let ROUND=viewer.ROUND,TOP_PRINTED=viewer.TOP_PRINTED;
 if(!ROUND){
  ROUND=await literal('src/world/interiors/item-viewer.js',/\nconst ROUND=(new Set\(\[[^\]]*\]\)),TOP_PRINTED=/);
  TOP_PRINTED=await literal('src/world/interiors/item-viewer.js',/,TOP_PRINTED=(new Set\(\[[^\]]*\]\));/);
 }
 const priceSlot=advertising.priceSlot??(id=>{const i=catalogue.GROCERY_ITEMS.findIndex(item=>item.id===id);return i<0?null:brands.BRAND_ATLAS_KEYS.length+i;});
 const names=[...new Set([...vending.VENDING_PRODUCTS.map(p=>p.inventoryName),...stock.SHOP_STOCK.map(s=>s.name),'Umineko lager','Empty can','A stranger\'s parcel'])];
 const geometry={};
 for(const id of [...every,'shop']){
  const shelf=shopProduct.shopProductTemplate(id),close=shopProduct.shopProductTemplate(id,{sides:64});
  geometry[id]={shelf:[geometrySha(shelf.body),geometrySha(shelf.art)],closeUp:[geometrySha(close.body),geometrySha(close.art)],bounds:[...shelf.bounds.min.toArray(),...shelf.bounds.max.toArray()]};
 }
 for(const id of ids){const t=food.sakuraProductTemplate(id);geometry[id].food=['body','art','glass'].map(k=>t[k]?geometrySha(t[k]):null);}
 return json({
  STORE_BRANDS:brands.STORE_BRANDS,BRAND_ATLAS_KEYS:brands.BRAND_ATLAS_KEYS,
  STORE_ITEMS:catalogue.STORE_ITEMS,GROCERY_ITEMS:catalogue.GROCERY_ITEMS,
  PACKS:packaging.PACKS,INGREDIENTS,
  back:Object.fromEntries(every.map(id=>{const b=back(id);return [id,{food:b.food,unit:b.unit,recycle:b.recycle,ingredients:b.ingredients??null}];})),
  FLAVOURS:flavours.FLAVOURS,flavourCount:Object.fromEntries(every.map(id=>[id,flavours.flavourCount(id)])),
  ZONES:merch.ZONES,MERCHANDISING:merch.MERCHANDISING,ZONE_OF_SHELF:merch.ZONE_OF_SHELF,SOURCED_FROM:merch.SOURCED_FROM,SUPPLIERS:merch.SUPPLIERS,ACCOUNTS:merch.ACCOUNTS,
  linesFor:Object.fromEntries([...new Set(Object.values(merch.MERCHANDISING).flatMap(m=>m.for))].sort().map(name=>[name,merch.linesFor(name)])),
  SHOP_STOCK:stock.SHOP_STOCK,shelfCapacity:Object.fromEntries([...every,'nothing'].map(id=>[id,stock.shelfCapacity(id)])),
  VENDING_PRODUCTS:vending.VENDING_PRODUCTS,DRINKABLE:[...vending.DRINKABLE],canColour:Object.fromEntries(names.map(n=>[n,vending.canColour(n)])),emptyFor:Object.fromEntries(names.map(n=>[n,vending.emptyFor(n)])),
  SAKURA_SHELVES:layout.SAKURA_SHELVES,SAKURA_DRESSING:layout.SAKURA_DRESSING,
  packagingSlot:Object.fromEntries([...every,'nothing'].map(id=>[id,advertising.packagingSlot(id)??null])),
  priceSlot:Object.fromEntries(every.map(id=>[id,priceSlot(id)])),
  flavourShift:Object.fromEntries(every.map(id=>[id,Array.from({length:flavours.flavourCount(id)+2},(_,k)=>advertising.flavourShift(id,k))])),
  ROUND:[...ROUND].sort(),TOP_PRINTED:[...TOP_PRINTED].sort(),
  geometry,
 });
}

if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const at=process.argv.indexOf('--write'),out=at<0?null:process.argv[at+1];
 const {installDOM}=await import('../../tests/fixtures.mjs');installDOM();
 const snapshot=await productSnapshot(),text=JSON.stringify(snapshot,null,1)+'\n';
 if(out){const path=resolve(town,out);await mkdir(dirname(path),{recursive:true});await writeFile(path,text);console.log(`Wrote ${out} (${text.length} bytes).`);}
 else console.log(text);
}
