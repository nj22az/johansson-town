import * as THREE from '../../../vendor/three.module.js';
import {assetURL} from '../../assets.js';
import {shopProductTemplate} from '../../commerce/shop-product.js';
import {drawBack} from '../../commerce/packaging-art.js';
import {drawFreshLabel} from '../../commerce/fresh-labels.js';
import {getLabelMaterial,packagingSlot,ATLAS_COLS,ATLAS_ROWS,ATLAS_SPAN} from './store-advertising.js';
import {STORE_BRANDS} from '../../commerce/brands.js';
import {stockSpec} from '../../commerce/shop-stock.js';
import {PRODUCTS,PRODUCT_BY_ID,PRINTS} from '../../commerce/products-data.js';
import {createPrintViewer} from '../../ui/print-viewer.js';

/**
 * Picking something off the shelf to look at it.
 *
 * The shop goes dim behind, and the pack comes up into the light at reading size, the way
 * you hold a bag of crisps up to read it: the front's art and its flash, then turned over,
 * the ingredients, the nutrition panel, the barcode. Drag to turn it, pinch or scroll to
 * bring it closer; underneath, its name, its price and what Thuan says about it, and the
 * choices a shopper has: put it back, take it to the till, or ask her.
 *
 * It draws with its own small renderer on its own canvas, so the town underneath does
 * not have to stop being what it is, and each pack is built at full size from
 * packaging-art.js rather than from the shelf's atlas.
 */
const CSS=`
#itemViewer{--ivg:var(--line-green,#06c755);--ivgh:var(--line-green-hover,#05b34c);--ivs:var(--line-surface,#f7f8f9);--ivb:var(--line-border,#e5e5e5);--ivt:var(--line-text,#000);--iv2:var(--line-secondary,#666);
 position:fixed;inset:0;z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
 background:radial-gradient(ellipse at 50% 42%,rgba(255,255,255,.22),rgba(0,0,0,.6) 72%);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
 font-family:var(--line-font,-apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,"Noto Sans JP",sans-serif);letter-spacing:normal;touch-action:none;user-select:none;-webkit-user-select:none}
#itemViewer[hidden]{display:none}
#itemViewer canvas{position:absolute;inset:0;width:100%;height:100%;cursor:grab}
#itemViewer canvas:active{cursor:grabbing}
/* LINE (awesome-design-md-jp): a white 12px card, 8px buttons, one green primary action. */
#itemViewer .iv-card{position:relative;margin:0 12px max(12px,env(safe-area-inset-bottom));width:min(560px,calc(100% - 24px));box-sizing:border-box;background:#fff;color:var(--ivt);
 border:1px solid var(--ivb);border-radius:12px;box-shadow:0 2px 8px rgb(0 0 0 / .08);padding:16px}
#itemViewer .iv-brand{font-size:12px;line-height:1.4;color:var(--iv2)}
#itemViewer .iv-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
#itemViewer .iv-name{font-size:18px;line-height:1.35;font-weight:700;margin:2px 0}
#itemViewer .iv-price{font-size:18px;font-weight:700;color:var(--ivt);white-space:nowrap}
#itemViewer .iv-line{font-size:14px;line-height:1.5;margin:4px 0 12px;color:var(--iv2)}
#itemViewer .iv-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#itemViewer button{min-height:48px;padding:0 12px;letter-spacing:normal;text-shadow:none;border:1px solid var(--ivb);border-radius:8px;font:inherit;font-size:15px;font-weight:700;background:var(--ivs);color:var(--ivt);cursor:pointer}
#itemViewer button:hover{background:#eef0f2}
#itemViewer button:focus-visible{outline:2px solid var(--ivg);outline-offset:3px}
#itemViewer button.iv-buy{background:var(--ivg);border-color:var(--ivg);color:#fff}
#itemViewer button.iv-buy:hover{background:var(--ivgh)}
#itemViewer .iv-close{position:absolute;top:max(14px,env(safe-area-inset-top));right:14px;width:44px;height:44px;min-height:0;padding:0;border-radius:8px;background:#fff;font-size:20px;box-shadow:0 2px 8px rgb(0 0 0 / .08)}
#itemViewer .iv-hint{position:absolute;top:max(18px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);padding:6px 12px;border-radius:999px;background:rgb(0 0 0 / .45);color:#fff;font-size:12px;white-space:nowrap;pointer-events:none}
#itemViewer .iv-view-tools{position:absolute;top:max(58px,calc(env(safe-area-inset-top) + 44px));display:flex;gap:6px;flex-wrap:wrap;justify-content:center;padding:0 8px}
#itemViewer .iv-view-tools button{min-height:44px;background:#fff}
#itemViewer .iv-paper{position:absolute;inset:0;z-index:2;background:#f5f4ee;overflow:auto;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));box-sizing:border-box;touch-action:pan-y}
#itemViewer .iv-paper .pv-stage{height:clamp(180px,calc(100dvh - 230px),820px)}
#itemViewer .iv-paper[hidden]{display:none}
`;


/** The painted labels at the resolution they were painted (store-advertising.js draws them into the shelf atlas at 256×128). */
// Round packs wrap their label most of the way round; the back panel fills the gap. Lidded packs are printed on top.
const ROUND_SHAPES=new Set(['bottle','can','cup','foil-cup']),TOP_SHAPES=new Set(['tray','newspaper']);
const shapeOf=id=>(PRODUCT_BY_ID[id]?.pack||PRINTS.find(p=>p.key===id)?.pack)?.shape;
export const ROUND=Object.freeze(new Set([...PRODUCTS.map(p=>p.id),...PRINTS.map(p=>p.key)].filter(id=>ROUND_SHAPES.has(shapeOf(id)))));
export const TOP_PRINTED=Object.freeze(new Set([...PRODUCTS.map(p=>p.id),...PRINTS.map(p=>p.key)].filter(id=>TOP_SHAPES.has(shapeOf(id)))));
/** The painted sheets, in order: a painted label is a cell of one of them (its label.sheet and label.cell). */
const SOURCES=['packaging-atlas.webp','packaging-groceries.webp'],sourceImages=new Map();
/** A picture under assets/graphics, loaded once: a painted sheet, or a label designed in Studio (labels/<id>.r<n>.webp). */
function sourceImage(path){
 if(!sourceImages.has(path))sourceImages.set(path,new Promise(resolve=>new THREE.ImageLoader().load(assetURL('graphics/'+path),resolve,undefined,()=>resolve(null))));
 return sourceImages.get(path);
}
/**
 * The pack in your hand is the pack on the shelf: the same shape (shop-product.js, with
 * more segments for the round ones) and the same painted label, cut from the painting at
 * full size instead of the shelf's small copy, so nothing changes but the sharpness.
 */
/**
 * buildPack(target, options): `target` is a product's id or, for Johansson Studio, a product record (a draft World's
 * data does not have yet). options: {renderer, labelCanvas} (a renderer alone is accepted too); labelCanvas is a
 * 1024×512 label to show instead of the product's own (Studio's preview of a design).
 */
export function buildPack(target,options={}){
 const draft=target&&typeof target==='object'?target:null,id=draft?draft.id:target,product=draft||PRODUCT_BY_ID[id]||null;
 const {renderer=null,labelCanvas=null}=options?.isWebGLRenderer?{renderer:options}:options||{};
 const t=shopProductTemplate(draft||id,{sides:64}),slot=draft?draft.cells.brand:packagingSlot(id),col=slot%ATLAS_COLS,row=Math.floor(slot/ATLAS_COLS);
 const printed=product?.label,painted=printed?.source==='painted'?printed:null,designed=printed?.source==='designed'?printed:null;
 const art=t.art.clone(),uv=art.attributes.uv;
 for(let i=0;i<uv.count;i++){
  const u=(uv.getX(i)*ATLAS_SPAN-col-.025)/.95,v=1-((1-uv.getY(i))*ATLAS_ROWS-row-.025)/.95;
  uv.setXY(i,THREE.MathUtils.clamp(u,0,1),THREE.MathUtils.clamp(v,0,1));
 }
 uv.needsUpdate=true;
 const label=document.createElement('canvas');label.width=1024;label.height=512;const ctx=label.getContext('2d');
 // At once: the shelf's own copy, scaled up; then the original painting when it has loaded.
 const atlas=getLabelMaterial().map.image,TW=atlas.width/ATLAS_SPAN,TH=atlas.height/ATLAS_ROWS;
 if(labelCanvas)ctx.drawImage(labelCanvas,0,0,label.width,label.height);
 else if(!drawFreshLabel(ctx,id,label.width,label.height))ctx.drawImage(atlas,col*TW,row*TH,TW,TH,0,0,label.width,label.height);
 const map=new THREE.CanvasTexture(label);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=renderer?.capabilities?.getMaxAnisotropy?.()||4;
 // The original painting, cut from its sheet at full size (a painted label says which sheet and which cell).
 let labelReady=Promise.resolve();
 if(painted&&!labelCanvas)labelReady=sourceImage('konbini/'+SOURCES[painted.sheet]).then(image=>{
  if(!image)return;const cw=image.width/ATLAS_COLS,ch=image.height/4;
  ctx.drawImage(image,painted.cell%ATLAS_COLS*cw,Math.floor(painted.cell/ATLAS_COLS)*ch,cw,ch,0,0,label.width,label.height);map.needsUpdate=true;
 });
 // A label designed in Studio: the picture it was baked as, at full size.
 if(designed&&!labelCanvas)labelReady=sourceImage(designed.image).then(image=>{if(!image)return;ctx.drawImage(image,0,0,label.width,label.height);map.needsUpdate=true;});
 const body=t.body.clone(),group=new THREE.Group(),inner=new THREE.Group();
 inner.add(new THREE.Mesh(body,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55})));
 inner.add(new THREE.Mesh(art,new THREE.MeshStandardMaterial({map,roughness:.42,emissive:0xffffff,emissiveMap:map,emissiveIntensity:.35})));
 const box=t.bounds,centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 // Turned over: the 一括表示 panel every pack carries, ingredients, contents, maker and
 // barcode, printed from the item's own data (packaging-art.js drawBack).
 art.computeBoundingBox();const a=art.boundingBox,round=draft?ROUND_SHAPES.has(draft.pack.shape):ROUND.has(id);
 const faceW=round?Math.PI*.38*Math.max(Math.abs(a.min.x),Math.abs(a.max.x)):a.max.x-a.min.x,faceH=a.max.y-a.min.y;
 const backMap=new THREE.CanvasTexture(drawBack(draft||id,768,Math.round(THREE.MathUtils.clamp(768*faceH/Math.max(faceW,.01),512,1536))));backMap.colorSpace=THREE.SRGBColorSpace;backMap.anisotropy=map.anisotropy;
 const backMaterial=new THREE.MeshStandardMaterial({map:backMap,roughness:.5,emissive:0xffffff,emissiveMap:backMap,emissiveIntensity:.3});
 let panel=null;
 if(round){
  const r=Math.max(Math.abs(a.min.x),Math.abs(a.max.x))+.0006,hgt=(a.max.y-a.min.y)*.96,arc=Math.PI*.38;
  panel=new THREE.Mesh(new THREE.CylinderGeometry(r,r,hgt,24,1,true,Math.PI-arc/2,arc),backMaterial);panel.position.y=(a.min.y+a.max.y)/2;
 }else if(a.min.z<-.002&&!(draft?TOP_SHAPES.has(draft.pack.shape):TOP_PRINTED.has(id))){
  const pw=faceW+.001,ph=faceH+.001;
  panel=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),backMaterial);panel.rotation.y=Math.PI;panel.position.set((a.min.x+a.max.x)/2,(a.min.y+a.max.y)/2,a.min.z-.0008);
 }
 if(panel)inner.add(panel);
 inner.position.copy(centre).multiplyScalar(-1);group.add(inner);
 // Lidded packs are printed on top: held up and tilted to you, so the lid is what you read.
 if(draft?TOP_SHAPES.has(draft.pack.shape):TOP_PRINTED.has(id))group.rotation.x=Math.PI*.38;
 group.userData.radius=size.length()/2;
 group.userData.frontLabel=label;group.userData.frontLabelReady=labelReady;group.userData.backLabel=backMap.image;
 group.userData.dispose=()=>{body.dispose();art.dispose();map.dispose();backMap.dispose();panel?.geometry.dispose();backMaterial.dispose();inner.traverse(o=>{if(o.isMesh)o.material.dispose();});};
 return group;
}
export function createItemViewer({onClose=()=>{}}={}){
 if(!document.getElementById('itemViewerStyle')){const s=document.createElement('style');s.id='itemViewerStyle';s.textContent=CSS;document.head.append(s);}
 const root=document.createElement('section');root.id='itemViewer';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label','Looking at an item');
 root.innerHTML=`<canvas aria-hidden="true"></canvas><div class="iv-hint">Drag to turn it · pinch to look closer</div>
 <div class="iv-view-tools"><button class="iv-zoom-out" aria-label="Zoom out">−</button><button class="iv-zoom-in" aria-label="Zoom in">+</button><button class="iv-reset">Fit item</button><button class="iv-read">Read label</button></div>
 <button class="iv-close" aria-label="Put it back">×</button>
 <div class="iv-card"><div class="iv-brand"></div><div class="iv-row"><div class="iv-name"></div><div class="iv-price"></div></div><p class="iv-line"></p>
 <div class="iv-actions"><button class="iv-turn">Turn over</button><button class="iv-back">Put back</button><button class="iv-talk">Ask Thuan</button><button class="iv-buy">Into basket</button></div></div>`;
 document.body.append(root);
 const canvas=root.querySelector('canvas'),$=s=>root.querySelector(s);
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(28,1,.01,10);
 scene.add(new THREE.HemisphereLight(0xfff6e6,0x5a5048,1.6));
 const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(.6,1,1.4);scene.add(key);
 const rim=new THREE.DirectionalLight(0xfff0d0,1.2);rim.position.set(-1,.4,-1);scene.add(rim);
 const pivot=new THREE.Group();scene.add(pivot);
 let held=null,item=null,raf=0,yaw=0,pitch=0,targetYaw=0,targetPitch=0,zoom=1,targetZoom=1,last=0,idle=0,paperView=null,previousFocus=null;
 const paper=document.createElement('div');paper.className='iv-paper';paper.hidden=true;root.append(paper);
 const pointers=new Map();let drag=null,pinch=null;
 function resize(){const w=root.clientWidth||innerWidth,h=root.clientHeight||innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
 function frame(time){
  raf=requestAnimationFrame(frame);const dt=Math.min(.05,(time-last)/1000||0);last=time;idle+=dt;
  if(paperView)return;
  if(!drag&&!pinch&&idle>2.5)targetYaw+=dt*.25;
  yaw+=(targetYaw-yaw)*Math.min(1,dt*10);pitch+=(targetPitch-pitch)*Math.min(1,dt*10);zoom+=(targetZoom-zoom)*Math.min(1,dt*8);
  pivot.rotation.set(pitch,yaw,0);
  // Framed so the pack fills about two thirds of the height above the card.
  const r=held?.userData.radius||.15,fit=r/Math.tan(camera.fov*Math.PI/360)*1.35/zoom;
  camera.position.set(0,-r*.18,fit);camera.lookAt(0,-r*.18,0);
  renderer.render(scene,camera);
 }
 function open(data){
  close(true);previousFocus=document.activeElement;item=data;const id=data.productId||data.id;
  const spec=stockSpec(id)||{},brand=STORE_BRANDS[id==='bun'?'buns':id]||{};
  held=buildPack(id,renderer);pivot.add(held);
  yaw=targetYaw=-.35;pitch=targetPitch=.12;zoom=targetZoom=1;idle=0;
  const same=(a,b)=>String(a||'').replace(/\s/g,'').toLowerCase()===String(b||'').replace(/\s/g,'').toLowerCase();
  $('.iv-brand').textContent=[brand.name,same(brand.jp,brand.name)?'':brand.jp,brand.line].filter(Boolean).join(' · ');
  $('.iv-name').textContent=spec.name||data.title||id;
  $('.iv-price').textContent=spec.cost!=null?'¥'+spec.cost:'';
  // The stock text opens with the brand, which the card already shows above it.
  const about=(spec.text&&!spec.text.includes(spec.name)?spec.text:'').replace(/^[A-Z0-9 ]+ · \S+\s*/,'');
  $('.iv-line').textContent=[data.liftLine?'Thuan: “'+data.liftLine+'”':'',about].filter(Boolean).join(' ');
  $('.iv-buy').textContent=spec.cost!=null?'Into basket · ¥'+spec.cost:'Into basket';
  $('.iv-talk').hidden=!(data.canTalk?.()??true);
  root.hidden=false;resize();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
  $('.iv-read').disabled=false;$('.iv-read').textContent='Read label';
  $('.iv-back').focus({preventScroll:true});
 }
 function close(silent=false){
  if(!held)return;closePaper(false);pointers.clear();drag=pinch=null;cancelAnimationFrame(raf);pivot.remove(held);held.userData.dispose();held=null;root.hidden=true;
  const was=item;item=null;if(!silent)onClose(was);
  if(!silent)previousFocus?.focus?.({preventScroll:true});
 }
 function closePaper(focus=true){paperView?.dispose();paperView=null;paper.replaceChildren();paper.hidden=true;if(focus&&held)$('.iv-read').focus();}
 async function readLabel(){
  if(!held)return;const holding=held;$('.iv-read').disabled=true;$('.iv-read').textContent='Loading label…';
  await holding.userData.frontLabelReady;
  if(held!==holding)return;$('.iv-read').disabled=false;$('.iv-read').textContent='Read label';closePaper(false);const id=item.productId||item.id,name=$('.iv-name').textContent;
  const pages=[['Front label',held.userData.frontLabel],['Back label',held.userData.backLabel]].filter(([,c])=>c).map(([title,c],i)=>({title:name+' · '+title,filename:id+'-'+(i?'back':'front'),width:c.width,height:c.height,draw(g,w,h){g.drawImage(c,0,0,w,h);}}));
  paperView=createPrintViewer({title:name,pages,onClose:()=>closePaper()});paper.replaceChildren(paperView.element);paper.hidden=false;paperView.element.querySelector('.pv-stage')?.focus();
 }
 $('.iv-close').onclick=$('.iv-back').onclick=()=>close();
 $('.iv-read').onclick=readLabel;
 $('.iv-zoom-in').onclick=()=>{targetZoom=Math.min(3,targetZoom*1.35);idle=0;};
 $('.iv-zoom-out').onclick=()=>{targetZoom=Math.max(.7,targetZoom/1.35);idle=0;};
 $('.iv-reset').onclick=()=>{yaw=targetYaw=-.35;pitch=targetPitch=.12;zoom=targetZoom=1;idle=0;};
 $('.iv-turn').onclick=()=>{targetYaw+=Math.PI;idle=0;};
 $('.iv-buy').onclick=()=>{const buy=item?.onBuy;close();buy?.();};
 $('.iv-talk').onclick=()=>{const talk=item?.onTalk;close();talk?.();};
 canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);idle=0;
  if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),z:targetZoom};drag=null;}else drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch};});
 canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);idle=0;
  if(pinch&&pointers.size>=2){const [a,b]=[...pointers.values()];targetZoom=THREE.MathUtils.clamp(pinch.z*Math.hypot(a[0]-b[0],a[1]-b[1])/pinch.d,.7,3);return;}
  if(drag){const s=Math.PI*2/Math.max(320,canvas.clientWidth);targetYaw=drag.yaw+(e.clientX-drag.x)*s;targetPitch=THREE.MathUtils.clamp(drag.pitch+(e.clientY-drag.y)*s,-1.2,1.2);}});
 const up=e=>{pointers.delete(e.pointerId);if(pointers.size<2)pinch=null;if(!pointers.size)drag=null;};
 canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('wheel',e=>{e.preventDefault();idle=0;targetZoom=THREE.MathUtils.clamp(targetZoom*Math.exp(-e.deltaY*.0015),.7,3);},{passive:false});
 root.addEventListener('keydown',e=>{
  if(paperView){if(e.key==='Escape'){e.preventDefault();closePaper();}else if(e.key==='Tab'){const items=[paper.querySelector('.pv-stage'),...paper.querySelectorAll('button')].filter(b=>b&&!b.hidden&&!b.disabled),i=items.indexOf(document.activeElement);e.preventDefault();items[(i+(e.shiftKey?-1:1)+items.length)%items.length]?.focus();}e.stopPropagation();return;}
  if(e.key==='Tab'){const buttons=[...root.querySelectorAll('button')].filter(b=>!b.hidden&&!b.disabled&&!paper.contains(b)),i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length]?.focus();}
  else if(e.key==='Escape'||e.key==='q'||e.key==='Q'){e.preventDefault();close();}
  else if(e.key==='ArrowLeft'){targetYaw-=.3;idle=0;}else if(e.key==='ArrowRight'){targetYaw+=.3;idle=0;}
  else if(e.key==='ArrowUp'){targetPitch-=.2;idle=0;}else if(e.key==='ArrowDown'){targetPitch+=.2;idle=0;}
  e.stopPropagation();
 });
 addEventListener('resize',()=>{if(held)resize();});
 return {open,close:()=>close(),get active(){return !!held;}};
}
