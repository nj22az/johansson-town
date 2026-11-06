import {preloadTradePosters,mountTradePosters} from './sakura-trade-posters.js';
import {buildSakuraBaskets} from './sakura-baskets.js';
import * as THREE from '../../../vendor/three.module.js';
import {buildSpecialsBoard} from './sakura-specials-board.js';
import {SHOP_STOCK} from '../../commerce/shop-stock.js';
import {shopProductTemplate,shopProductMaterials} from '../../commerce/shop-product.js';
import {sakuraProductTemplate} from './sakura-food-products.js';
import {buildSakuraCounterDetail} from './sakura-counter-detail.js';
import {createStoreAdvertising} from './store-advertising.js';
import {createShopRefrigerator} from './shop-refrigerator.js';
import {townCalendarAt} from '../../town-clock.js';
import {buildMedicineShelf,hangWallPosters,createWindowDecorations} from './sakura-dressing.js';
import {SAKURA_LAYOUT,SAKURA_SHELVES,SAKURA_DRESSING,SAKURA_BACKBAR,SAKURA_TILL_CABINET,BUN_STEAMER,COPY_MACHINE} from './sakura-layout.js';
import {buildSakuraStairFoot} from './sakura-stairs.js';
import {buildSakuraShell} from './sakura-shell.js';
import {PALETTE,fluorescent} from '../../render/dusk.js';
import {buildSakuraCheer,buildSakuraBand} from './sakura-cheer.js';
import {buildSakuraLife} from './sakura-life.js';
import {buildSakuraSmallOffice} from './sakura-small-office-build.js';
import {buildMagazineRack,MAGAZINE_RACK} from './sakura-magazine-rack.js';
import {buildShelfEdges} from './sakura-shelf-edge.js';
import {buildSakuraCorners} from './sakura-corners.js';
import {buildSakuraSurfaces} from './sakura-surfaces.js';
import {buildCapStand} from './sakura-cap-stand.js';
import {shelfArtMaterial,flavouredArt,flavourForColumn,setFlavour,flavourTint} from './shelf-flavours.js';
let model=null;
const sakuraFoodGlass=new THREE.MeshStandardMaterial({color:0xf1f7ef,transparent:true,opacity:.09,roughness:.12,depthWrite:false,side:THREE.DoubleSide});
sakuraFoodGlass.name='Sakura clear food wrappers';
/**
 * The shop's building and fittings (sakura-shell.js), made once and cloned into the room.
 * They used to come from a supplied convenience-store model with no licence on record;
 * the shell is now drawn from the shop's own measurements, so nothing is fetched and the
 * promise resolves at once. It goes through the cel pass like the rest of the town; only
 * the tubes keep their physical material, because they glow.
 */
export function preloadSakuraInterior(){
 if(!model){
  model=buildSakuraShell();model.userData.sharedAsset=true;
  model.traverse(o=>{if(o.isMesh){o.castShadow=false;const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){m.dithering=true;if(o.name==='sakura-light'){m.userData.keepPhysical=true;m.userData.keepPhysicalStrict=true;}}}});
 }
 return Promise.resolve(true);
}

/** Thin impulse wall behind Thuan at the till — props only, readable on approach. */
function dressBackbar(room,anchor,action,materials){
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.78});
 const box=(w,h,d,x,y,z,color)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.name='Sakura backbar';m.userData.sharedAsset=true;room.add(m);return m;};
 // The cabinet they stand on: sides, back, a kick board and three boards.
 {const C=SAKURA_TILL_CABINET,wood=0x8a6a4a,cx=(C.x0+C.x1)/2,cz=(C.z0+C.z1)/2,w=C.x1-C.x0,d=C.z1-C.z0,top=C.boards.at(-1);
  // Carcass joinery: the boards, back and kick board sit between the sides and the boards in front of the back, so no
  // two faces lie in one plane (the Sakura surface audit, SK-ZF rev A).
  const inner=d-.044,back=.018;
  for(const y of C.boards)box(w-back,.022,inner,cx-back/2,y-.011,cz,wood);
  for(const z of [C.z0+.011,C.z1-.011])box(w,top,.022,cx,top/2,z,wood);
  box(back,top,inner,C.x1-back/2,top/2,cz,0x6f553b);box(.02,.08,inner,C.x0+.02,.04,cz,0x5c4631);}
 for(const prop of SAKURA_BACKBAR){
  const {id,x,y,z}=prop;
  if(id==='ferry-tickets'){for(let i=0;i<6;i++)box(.10,.003,.055,x,y+i*.004,z-i*.008,0xc45c48);}
  else if(id==='phone-cards'){for(let i=0;i<5;i++)box(.08,.003,.045,x,y+i*.0035,z,0x2f6f9a);}
  else if(id==='stamps'){for(let i=0;i<4;i++)box(.028,.002,.032,x,y,z+i*.038,i%2?0xd4a0b0:0xe8c96a);}
  else if(id==='gum'){box(.05,.04,.03,x,y,z,0x7aab6e);box(.05,.04,.03,x,y,z-.08,0xe8d48a);}
  else if(id==='matches'){box(.045,.014,.022,x,y,z,0x6b4030);box(.018,.048,.014,x,y+.01,z-.07,0xb8bec2);}
  else if(id==='osusume'){box(.15,.11,.006,x,y,z,0xf3e7cf);box(.12,.004,.004,x,y+.02,z+.004,0xc45c48);}
  else if(id==='postcard-stand'){
   const tpl=shopProductTemplate('postcard'),group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=-Math.PI/2;group.rotation.x=-.35;
   group.name='Sakura postcard stand';group.userData.sharedAsset=true;room.add(group);
   group.add(new THREE.Mesh(tpl.body,materials[0]),new THREE.Mesh(tpl.art,materials[1]));
   box(.12,.02,.06,x,y-.04,z,0x5a5044);
  }
  else if(id==='radio'){
   box(.13,.08,.07,x,y,z,0x3a3f42);box(.04,.015,.02,x,y+.05,z+.01,0x2a2e30);
   const ant=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,.12,8),mat(0x9aa3a0));ant.position.set(x+.05,y+.12,z);ant.name='Sakura backbar';ant.userData.sharedAsset=true;room.add(ant);
  }
  else if(id==='batteries'){
   const tpl=shopProductTemplate('battery'),group=new THREE.Group();group.position.set(x,y,z);group.rotation.y=-Math.PI/2;
   group.name='Sakura backbar batteries';group.userData.sharedAsset=true;room.add(group);
   group.add(new THREE.Mesh(tpl.body,materials[0]),new THREE.Mesh(tpl.art,materials[1]));
  }
 }
 const look=SAKURA_BACKBAR.find(p=>p.id==='osusume');
 if(look)anchor([look.x-.15,1.2,look.z],'Buy from the till counter',()=>action('sakura-counter-goods'));
}
export function buildSakuraInterior({room,reg,action,exit,stair=()=>{}}){
 const layout={...SAKURA_LAYOUT,colliders:[...SAKURA_LAYOUT.colliders]},unitPositions=new Map(),unitApproaches=new Map(),batches=[],materials=shopProductMaterials(),dummy=new THREE.Object3D(),zero=new THREE.Matrix4().makeScale(0,0,0);
 const refrigerator=createShopRefrigerator(room,reg);
 const advertising=createStoreAdvertising({room,reg,action,posterSpecs:[]});
 const anchor=(pos,label,fn)=>{const o=new THREE.Object3D();o.position.set(...pos);room.add(o);reg(o,label,fn,true);return o;};
 for(const spec of SHOP_STOCK){const shelf=SAKURA_SHELVES[spec.id];if(!shelf)continue;
  const template=sakuraProductTemplate(spec.id),perLevel=spec.capacity/shelf.levels.length,columns=shelf.columns||6,rows=perLevel/columns;
  // Faced by the pack's own size: never closer than its width across or its depth back.
  const size=template.bounds.getSize(new THREE.Vector3()),gap={spacing:Math.max(shelf.spacing,size.x+.012),depth:Math.max(shelf.depth,size.z+.01)};
  // A konbini board is full from upright to upright. Where the shelf says how wide it is,
  // the packs stand shoulder to shoulder and the rest of the board is filled with the
  // line's other flavours: on display, never counted as stock, never sold out.
  const tight=size.x+.015,across=shelf.width?Math.max(columns,Math.floor(shelf.width/tight)):columns;
  if(across>columns)gap.spacing=tight;
  const first=Math.floor((across-columns)/2),extra=(across-columns)*rows*shelf.levels.length;
  const art=flavouredArt(template.art,spec.capacity+extra);
  const pair=[template.body,art].map((geometry,i)=>{const mesh=new THREE.InstancedMesh(geometry,i?shelfArtMaterial():materials[0],spec.capacity+extra);mesh.name='Sakura '+spec.id+(i?' packaging':' goods');room.add(mesh);return mesh;});
  if(template.glass){
   const mesh=new THREE.InstancedMesh(template.glass,sakuraFoodGlass,spec.capacity+extra);mesh.name='Sakura '+spec.id+' clear wrapper';mesh.userData.preserveMaterial=true;mesh.renderOrder=2;room.add(mesh);pair.push(mesh);
  }
  const matrices=[];
  const place=(slot,level,column,row)=>{
   const along=(column-(across-1)/2)*gap.spacing,depth=(row-(rows-1)/2)*gap.depth;
   const x=shelf.x+Math.cos(shelf.yaw)*along+Math.sin(shelf.yaw)*depth,z=shelf.z-Math.sin(shelf.yaw)*along+Math.cos(shelf.yaw)*depth;
   const y=shelf.levels[level]+.002-template.bounds.min.y;
   dummy.position.set(x,y,z);dummy.rotation.set(0,shelf.yaw,0);dummy.updateMatrix();pair.forEach(m=>m.setMatrixAt(slot,dummy.matrix));
   const k=flavourForColumn(spec.id,column,across);setFlavour(art,slot,spec.id,k);pair[0].setColorAt(slot,flavourTint(spec.id,k));
   return {x,y,z,along};
  };
  for(let slot=0;slot<spec.capacity;slot++){
   const local=slot%perLevel,{x,y,z,along}=place(slot,Math.floor(slot/perLevel),first+local%columns,Math.floor(local/columns));
   matrices.push(dummy.matrix.clone());
   unitPositions.set(spec.id+':'+slot,[x,y+Math.min(.15,template.bounds.max.y*.6),z]);unitApproaches.set(spec.id+':'+slot,[shelf.stand[0]+Math.cos(shelf.yaw)*along,0,shelf.stand[2]-Math.sin(shelf.yaw)*along]);
  }
  let slot=spec.capacity;
  for(let level=0;level<shelf.levels.length;level++)for(let column=0;column<across;column++){
   if(column>=first&&column<first+columns)continue;
   for(let row=0;row<rows;row++)place(slot++,level,column,row);
  }
  pair.forEach(m=>m.computeBoundingSphere());batches.push({spec,pair,matrices});
  const front=new THREE.Vector3(Math.sin(shelf.yaw),0,Math.cos(shelf.yaw));
  for(const level of shelf.levels)advertising.label(spec.id==='bun'?'buns':spec.id,[shelf.x+front.x*(shelf.fridge!=null?.34:.12),level-.025,shelf.z+front.z*(shelf.fridge!=null?.34:.12)],.23,.075,{price:spec.id!=='bun',yaw:shelf.yaw});
  const o=anchor([shelf.x+front.x*.17,shelf.levels.at(-1)+.14,shelf.z+front.z*.17],'Examine '+(spec.brand||'SAKURA')+' · '+spec.name,()=>action('store-item',spec.name,{...spec,jp:spec.jp||"Meat bun",text:spec.text||'A wrapped steamed bun to take away.'}));o.userData.storeItem=spec.id;
 }
 buildShelfEdges(room);
 buildSakuraCorners(room,{anchor,action});
 buildSakuraSurfaces(room);
 // The cap tree by the east window: Johansson's trucker caps, World's catalogue's model (commerce/sakura-caps.js).
 const capStand=buildCapStand(room,{anchor,action});
 // Fittings the model came with that nothing stood on (SAKURA_DRESSING). Instanced the
 // same way as the goods, but never restocked: none of it is for sale.
 for(const piece of SAKURA_DRESSING){
  const template=shopProductTemplate(piece.template),count=piece.levels.length*piece.columns*piece.rows;
  const pair=[template.body,template.art].map((geometry,i)=>{const mesh=new THREE.InstancedMesh(geometry,materials[i],count);mesh.name='Sakura '+piece.id+(i?' print':' display');room.add(mesh);return mesh;});
  let slot=0;
  for(const level of piece.levels)for(let column=0;column<piece.columns;column++)for(let row=0;row<piece.rows;row++){
   const along=(column-(piece.columns-1)/2)*piece.spacing,depth=(row-(piece.rows-1)/2)*piece.depth;
   dummy.position.set(piece.x+Math.cos(piece.yaw)*along+Math.sin(piece.yaw)*depth,level+.002-template.bounds.min.y,piece.z-Math.sin(piece.yaw)*along+Math.cos(piece.yaw)*depth);
   dummy.rotation.set(0,piece.yaw,0);dummy.updateMatrix();pair.forEach(m=>m.setMatrixAt(slot,dummy.matrix));slot++;
  }
  pair.forEach(m=>m.computeBoundingSphere());
  if(piece.look)anchor(piece.look,piece.title,()=>action('inspect',piece.title.replace(/^(Read|Look over) (the )?/,'Sakura · '),piece.text));
 }
 // The bun steamer's glass, and the copy machine (their frames are in sakura-shell.js).
 {const B=BUN_STEAMER,glass=new THREE.MeshStandardMaterial({color:0xf4fbfb,transparent:true,opacity:.22,roughness:.05,depthWrite:false});
  const pane=(w,h,d,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glass);m.position.set(x,y,z);m.name='Sakura bun steamer glass';room.add(m);};
  const y=B.top+.06+(B.h-.1)/2,h=B.h-.1;
  // The front and back panes stop at the steel side (x1 - 0.02), rather than running flush to its outer face.
  pane(.008,h,B.d,B.x-B.w/2,y,B.z);for(const s of [-1,1])pane(B.w-.02,h,.008,B.x-.01,y,B.z+s*B.d/2);
  anchor([B.x-.35,B.top+.25,B.z],'Ask for a steamed bun',()=>action('sakura-hot-snacks'));}
 anchor([COPY_MACHINE.x,1.1,COPY_MACHINE.z-.45],'Use the copy machine',()=>action('inspect','Copy machine · fax',
  'Ten yen a copy, fifty a page to fax. The fishermen\u2019s co-op sends its catch sheets to Naha from here every morning, and the lid is warm by nine.'));
 const magazineRack=MAGAZINE_RACK.placed?buildMagazineRack(room,{anchor,action}):null;
 const ads=advertising.finish();
 // The posters hang on the shop's own walls, not across its windows (sakura-dressing.js):
 // the glass is for seeing in, and for the paper decorations that change with the season.
 hangWallPosters(room,{anchor,action});
 buildMedicineShelf(room);
 anchor([5.55,1.35,2.3],'Ask Thuan for something from the medicine shelf',()=>action('sakura-medicine'));
 const decorations=createWindowDecorations(room);
 // The ledger lives on Thuan's desk in the small office behind the till (sakura-small-office.js); the counter carries
 // the hot case, the oden and the bell (sakura-cheer.js).
 buildSakuraCheer(room,{anchor,action});
 const equipment=buildSakuraCounterDetail(room);
 buildSakuraBaskets(room);
 // The specials board on the wall behind the counter (sakura-specials-board.js).
 buildSpecialsBoard(room,{anchor,action});
 buildSakuraBand(room);
 const life=buildSakuraLife(room,{anchor,action});
 // The small office behind the till: Thuan's desk and sales book, the fridge and TV, the cork board (sakura-small-office.js).
 const smallOffice=buildSakuraSmallOffice(room,{anchor,action});
 // The stair from the stockroom: five treads up into the dark; the office upstairs is a room of its own (sakura-stairs.js).
 const stairFoot=buildSakuraStairFoot({room,reg,go:dir=>stair(dir)});layout.colliders.push(...stairFoot.colliders);
 anchor([4.50,1.2,.6],'Ring service bell',()=>action('resident','Thuan'));
 dressBackbar(room,anchor,action,materials);
 anchor([4.5,1.2,2.35],'Browse mail-order catalogue',()=>action('store-catalogue'));
 anchor(layout.exit,'Exit to street',exit);
 // Back-room cartons: open Thuan's Storage restock (navigate, not iframe).
 // Stock cartons carry the same generated Sakura label as delivered cartons.
 const carton=shopProductTemplate('stock');for(const z of [-5.95,-6.25])for(const x of [.15,.65,1.15]){const group=new THREE.Group();group.position.set(x,.25,z);room.add(group);group.add(new THREE.Mesh(carton.body,materials[0]),new THREE.Mesh(carton.art,materials[1]));}
 // SK-ST-004: supplier campaigns above the stockroom's old stand-ups, with clear aisle Look anchors.
 mountTradePosters('stockroom',{parent:room,register:reg,onView:id=>action('trade-poster',id)});
 // Bright, even konbini light: warm white from the tubes, a pale floor bounce rather
 // than the old green-grey, so the shop reads cheerful instead of dim.
 const fill=new THREE.HemisphereLight(PALETTE.sakuraTube,0xd8d2c4,1.7);room.add(fill);
 let lightLevel=1;const tubes=[];
 const updateLighting=minutes=>{
  // The decorations and the magazine rack follow the town calendar, looked at once an hour.
  decorations.refresh(townCalendarAt(minutes).date);magazineRack?.refresh(townCalendarAt(minutes).date);
  lightLevel=fluorescent(minutes);fill.intensity=1.7*lightLevel;smallOffice.setHours(minutes);
  for(const tube of tubes)for(const mat of Array.isArray(tube.material)?tube.material:[tube.material]){
   mat.emissive.set(PALETTE.sakuraTube);mat.emissiveIntensity=lightLevel;
  }
 };
 let mounted=false,disposed=false,last='';
 return {smallOffice,dispose:()=>{disposed=true;life.dispose();smallOffice.dispose();},cashDrawer:equipment.getObjectByName('Sakura cash drawer'),officeDoor:life.officeDoor,frontDoor:life.frontDoor,loadBackRooms:life.loadBackRooms,layout,unitPositions,unitApproaches,refrigerator,updateLighting,decorations,tick:(time,minutes,dt)=>{decorations.tick(time);life.tick(time);smallOffice.tick(time,minutes,dt);},accessShelf:id=>refrigerator.open(SAKURA_SHELVES[id]?.fridge),advertising:ads,ready:async()=>{const [ok]=await Promise.all([preloadSakuraInterior(),life.ready,capStand.ready,preloadTradePosters()]);if(disposed)return false;if(ok&&!mounted){
   const interior=model.clone(true);
   interior.traverse(o=>{if(o.isMesh&&o.name==='sakura-light'){
    const prepare=m=>{const mat=m.clone();mat.emissive.set(PALETTE.sakuraTube);mat.emissiveIntensity=lightLevel;return mat;};
    o.material=Array.isArray(o.material)?o.material.map(prepare):prepare(o.material);tubes.push(o);
   }});
   room.add(interior);mounted=true;
  }return ok;},
  updateStock(stock){const key=JSON.stringify(Object.values(stock).map(s=>s.shelf));if(last===key)return;last=key;for(const {spec,pair,matrices} of batches)for(const mesh of pair){for(let i=0;i<spec.capacity;i++)mesh.setMatrixAt(i,i<(stock[spec.id]?.shelf||0)?matrices[i]:zero);mesh.instanceMatrix.needsUpdate=true;}},
 };
}
