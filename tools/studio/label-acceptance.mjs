/**
 * Which cells of World's label atlas a products file changes, pixel for pixel: the atlas is drawn by World's own code
 * (store-advertising.js getLabelMaterial, with the painted sheets laid in, designed labels laid over their cells and the
 * flavours painted from them) twice in headless Chromium, once as this checkout has it and once with another
 * products-data.js and its label pictures served in their place, and every pixel that differs is counted in its cell.
 * The smoke test uses it to prove a designed label changes only its own cell and its flavours' cells.
 *
 *   atlasDifference({products: <products.json text>, labels: <folder of label pictures>})
 *     → {cells: [{half: 'left'|'right', cell, pixels}], pixels}
 */
import {readFile} from 'node:fs/promises';
import {resolve,basename} from 'node:path';
import {serveGame} from '../mcp/static-server.mjs';
import {CODE_ROOT} from './repo.mjs';
import {productsModule} from './build-data.mjs';

const PAGE='/johansson-town/__studio-atlas__.html';

/** In the page: World's atlas once every picture it waits for has been laid in, as a PNG data URL. */
async function drawAtlas(expected){
 const advertising=await import('./src/world/interiors/store-advertising.js'),material=advertising.getLabelMaterial();
 const end=performance.now()+120000;
 while(material.map.version<expected){if(performance.now()>end)throw Error(`The atlas waited for ${expected-1} pictures and got ${material.map.version-1}.`);await new Promise(r=>setTimeout(r,50));}
 await new Promise(r=>setTimeout(r,500));
 return material.map.image.toDataURL('image/png');
}
/** In the page: the cells where two atlases differ. */
async function compare([a,b,cols,rows]){
 const load=src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src;});
 const [A,B]=await Promise.all([load(a),load(b)]),w=A.width,h=A.height,pixels=x=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.drawImage(x,0,0);return g.getImageData(0,0,w,h).data;};
 const pa=pixels(A),pb=pixels(B),cw=w/(cols*2),ch=h/rows,cells=new Map();let total=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(pa[i]!==pb[i]||pa[i+1]!==pb[i+1]||pa[i+2]!==pb[i+2]||pa[i+3]!==pb[i+3]){
  total++;const col=Math.floor(x/cw),right=col>=cols,key=`${right?'right':'left'}:${Math.floor(y/ch)*cols+col%cols}`;cells.set(key,(cells.get(key)||0)+1);}}
 return {pixels:total,cells:[...cells].map(([k,n])=>({half:k.split(':')[0],cell:Number(k.split(':')[1]),pixels:n}))};
}

export async function atlasDifference({products,labels}){
 const {chromium}=await import('playwright'),preview=await serveGame({root:CODE_ROOT,mounts:['johansson-town']}),origin=new URL(preview.url).origin;
 const browser=await chromium.launch({headless:true,args:[...process.getuid?.()===0?['--no-sandbox']:[],'--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const designed=JSON.parse(products).products.filter(p=>p.label.source==='designed').length;
 try{
  async function atlas(routed){
   const page=await browser.newPage({viewport:{width:640,height:480}});
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort();
    if(url.pathname===PAGE)return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><title>atlas</title>'});
    if(routed&&url.pathname==='/johansson-town/src/commerce/products-data.js')return route.fulfill({contentType:'text/javascript',body:productsModule(products)});
    if(routed&&url.pathname.startsWith('/johansson-town/assets/graphics/labels/')){
     const file=basename(url.pathname);if(!/^[a-z][a-z0-9-]{1,40}\.r[0-9]{1,4}\.webp$/.test(file))return route.fulfill({status:404,body:''});
     return route.fulfill({contentType:'image/webp',body:await readFile(resolve(labels,file)).catch(()=>Buffer.alloc(0))});
    }
    return route.continue();
   });
   await page.goto(origin+PAGE);
   try{return await page.evaluate(drawAtlas,3+(routed?designed:0));}finally{await page.close();}
  }
  const [today,changed]=[await atlas(false),await atlas(true)];
  const page=await browser.newPage();
  const {ATLAS_COLS,ATLAS_ROWS}=await import('../../src/world/interiors/store-advertising.js');
  return await page.evaluate(compare,[today,changed,ATLAS_COLS,ATLAS_ROWS]);
 }finally{await browser.close();await preview.close();}
}
