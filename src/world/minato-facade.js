import * as THREE from '../../vendor/three.module.js';
import {createMaterials} from '../render/materials.js?snappy=1';
import {createKit} from './okinawa/kit.js';
import {shisa,potPlant} from './okinawa/houses.js';
import {fascia,japaneseSign,signText} from './okinawa/signs.js';
import {glazeWithRoom} from '../render/window-interior.js';
import {createLampGlow} from './light-pools.js';
import {MINATO_COMPACT} from './interiors/minato-compact-plan.js';

/**
 * Minato Izakaya, built rather than fetched.
 *
 * The supplied exterior was a generic bar frontage: a flat glazed box that read as an
 * office at a distance and had no eave, no lantern and nothing to tell you what was
 * behind it. This is the building the town actually wants on that plot — a two-storey
 * harbour machiya as it stood in 1997, with the bar downstairs and business storage
 * upstairs. Thao's family lives elsewhere; the frontage does the talking:
 *
 *   a tiled pitch with its ridge along the street and a deep eave over the pavement,
 *   koshi lattice over a warm window, a recessed doorway under a noren,
 *   three akachochin on the eave beam, a vertical kanban on the corner,
 *   and the working clutter of a bar — crates, bottle cases, a compressor, a meter.
 *
 * Every colour here is darker than the thing it stands for. This town's sun, its fill
 * and the cel grade together lift a mid tone to cream over an area this size; the
 * bookshop next door was rendered as a blank slab twice before its plaster came down
 * to 0xa79d85. Tone down, never up.
 *
 * Local frame, which is the plot's frame rotated by its yaw (see dining-layout.js):
 * +z runs out to the street, +x runs south along the pavement, y is up. The door sits
 * at local x 0 so that IZAKAYA_DOOR keeps meaning what it meant.
 */

/**
 * Sato Ramen against the alley flank, in the same local frame: from the flank wall out
 * to local x 6.01, sharing Minato's party wall. The door stays at local x 3.47
 * (SATO_RAMEN_DOOR in dining-layout.js); the compact interior fixes the actual width.
 */
export const SATO_ANNEX=Object.freeze({x0:6.01-MINATO_COMPACT.exterior.annexWidth,x1:6.01,door:3.47,height:3.1,depth:MINATO_COMPACT.exterior.annexDepth});
/** The frontage line, shared with the bookshop next door, in the plot's local frame. */
export const MINATO=Object.freeze({
 width:MINATO_COMPACT.exterior.mainWidth,depth:MINATO_COMPACT.exterior.mainDepth,front:4.7,centreX:-.88,
 /** Ground-floor head height, wall plate, and the ridge above it. */
 groundH:3.05,upperH:5.75,ridge:7.0,
 /** The doorway, recessed behind the frontage under the noren. */
 doorWidth:1.5,doorHeight:2.1,recess:.55,
 /** How far the eave hangs out over the pavement. */
 eave:.95,
});

/** Indigo cloth with the shop's name, hung in three panels over the doorway. */
function norenTexture(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#1f2c3d';ctx.fillRect(0,0,512,256);
 // A cloth is not a flat colour: a little vertical streaking reads as dye at this size.
 ctx.globalAlpha=.16;
 for(let i=0;i<150;i++){ctx.fillStyle=i%2?'#27364a':'#18222f';const x=Math.random()*512;ctx.fillRect(x,0,2+Math.random()*4,256);}
 ctx.globalAlpha=1;
 ctx.fillStyle='#ddd2b8';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='bold 116px serif';ctx.fillText("みなと",256,128);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

/** The corner board: 居酒屋 みなと read from up the pavement, painted on dark timber. */
/**
 * Red paper with its bamboo ribs showing, and the word brushed on front and back. `lit` is the
 * same paper with the bulb behind it, for the emissive map: paper lit from inside is orange,
 * not the red it is by day, and the ribs and the word stay dark against it.
 */
function chochinTexture(word,lit=false){
 const c=document.createElement('canvas');c.width=256;c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle=lit?'#ffac5c':'#b8392a';ctx.fillRect(0,0,256,256);
 ctx.strokeStyle=lit?'rgba(120,40,10,.4)':'rgba(60,20,14,.35)';ctx.lineWidth=2;
 for(let y=10;y<256;y+=14){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(256,y);ctx.stroke();}
 ctx.fillStyle=lit?'#3a1c0c':'#1c1410';ctx.textAlign='center';ctx.textBaseline='middle';
 const chars=[...japaneseSign(word)],size=Math.min(62,200/chars.length);
 ctx.font=`bold ${size}px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif`;
 // u=0 faces the street, so the front word straddles the seam; the back one is at u=.5.
 for(const cx of [0,256,128])chars.forEach((ch,k)=>ctx.fillText(ch,cx,128+(k-(chars.length-1)/2)*size*1.05));
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function kanbanTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=1024;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#2b1d17';ctx.fillRect(0,0,256,1024);
 ctx.strokeStyle='#8a6a43';ctx.lineWidth=7;ctx.strokeRect(14,14,228,996);
 ctx.fillStyle='#e0bc7c';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.font='bold 150px serif';
 // Vertical writing, which is how a kanban is read.
 "居酒屋".split('').forEach((c,i)=>ctx.fillText(c,128,150+i*165));
 ctx.fillStyle='#d8534a';ctx.fillRect(58,648,140,6);
 ctx.fillStyle='#e8d6ae';ctx.font='bold 130px serif';
 "みなと".split('').forEach((c,i)=>ctx.fillText(c,128,742+i*100));
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

/** Tonight's dishes, chalked up beside the door. Nobody reads it; everybody expects it. */
function menuTexture(){
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=352;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#20242a';ctx.fillRect(0,0,256,352);
 ctx.fillStyle='#cfc6ad';ctx.textAlign='left';ctx.font='bold 34px serif';ctx.fillText("Today",18,44);
 ctx.font='26px serif';
 for(const [i,line] of ["Yakitori  ￥180","Fried horse mackerel ￥320","Cold tofu    ￥200","Edamame    ￥150","Draft beer  ￥400"].entries())
  signText(ctx,line,18,96+i*46,220,24);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

/**
 * @param {object} options
 * @param {THREE.Object3D} options.parent the plot group, already placed and rotated
 * @param {Array} options.colliders collected in the plot's local frame; the caller
 *   rotates them into the world with restaurantCollider
 * @returns {{group:THREE.Group,lit:(open:boolean,day:number)=>void}}
 */
export function buildMinatoFacade({parent,shadows=false,anisotropy=4,colliders=[]}={}){
 const {width,depth,front,centreX,groundH,upperH,ridge,doorWidth,doorHeight,recess,eave}=MINATO;
 const back=front-depth,half=width/2,northX=centreX-half,southX=centreX+half;
 const surfaces=createMaterials({anisotropy});
 const group=new THREE.Group();group.name='Minato izakaya frontage';parent.add(group);

 const cache=new Map();
 const shade=(kind,colour,metres=2)=>{
  const key=kind+'/'+colour+'/'+metres;
  if(!cache.has(key))cache.set(key,surfaces.worldMaterial(kind,colour,metres));
  return cache.get(key);
 };
 const box=(size,position,kind,colour,metres=2)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),shade(kind,colour,metres));
  mesh.position.set(...position);mesh.castShadow=!!shadows;mesh.receiveShadow=true;
  mesh.userData.staticProp=true;group.add(mesh);return mesh;
 };
 /** Painted joinery, which has no photograph behind it and should not pick one up. */
 const paint=(colour,extra={})=>new THREE.MeshStandardMaterial({color:colour,roughness:.82,...extra});
 const painted=(size,position,colour,extra,parentGroup=group)=>{
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),paint(colour,extra));
  mesh.position.set(...position);mesh.castShadow=!!shadows;mesh.receiveShadow=true;
  mesh.userData.staticProp=true;parentGroup.add(mesh);return mesh;
 };

 // ---- shell -------------------------------------------------------------------
 box([width+.3,.2,depth+.2],[centreX,.1,(front+back)/2],'concrete',0x8c8578);
 // Warm lime plaster rather than the grey it was: on a street of pale Okinawan walls a
 // dark grey slab read as a hole in the row.
 const wallT=MINATO_COMPACT.wallThickness,sideFront=front-.30,sideBack=back+wallT;
 // The measured dimensions include the walls: their inside faces now agree with
 // the Blender room, and Sato meets a real party wall instead of a 24 cm air gap.
 painted([width,upperH,wallT],[centreX,upperH/2,back+wallT/2],0xbdac8c,{roughness:.95});
 for(const side of [-1,1])
  painted([wallT,upperH,sideFront-sideBack],[centreX+side*(half-wallT/2),upperH/2,(sideFront+sideBack)/2],0xbfae8e,{roughness:.95});
 // Timber corner posts, the frame the frontage hangs off.
 // A centimetre proud of the walls and the band at every face they share, and stopping just under their tops: flush, the
 // post's faces and the plaster's flashed into each other on a phone (the owner, 20 October 2026).
 for(const x of [northX,southX])box([.28,upperH-.02,.28],[x,(upperH-.02)/2,front-.13],'timber',0x3c3025);

 // ---- ground-floor frontage ----------------------------------------------------
 // The doorway is recessed, so the frontage comes forward each side of it and returns
 // back to the door plane. That shadow is most of what says "bar" from across the road.
 const doorPlane=front-recess,cheekHalf=doorWidth/2+.12;
 const bay=(fromX,toX)=>{
  const runX=Math.abs(toX-fromX),midX=(fromX+toX)/2;
  if(runX<.4)return null;
  // Sill, head and the warm pane between them.
  box([runX,.75,.3],[midX,.375,front-.15],'timber',0x4a3a2a);
  box([runX,.42,.3],[midX,groundH-.21,front-.15],'timber',0x4a3a2a);
  const paneH=groundH-.21-.21-.75/2-.375;
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(runX-.12,groundH-1.38),
   new THREE.MeshStandardMaterial({color:0x4a4034,emissive:0xd8a557,emissiveIntensity:.1,roughness:.5}));
  glazeWithRoom(pane);
  pane.position.set(midX,(0.75+groundH-.42)/2,front-.29);pane.userData.clearWindow=true;
  pane.userData.minatoGlow=true;group.add(pane);
  // Koshi: vertical slats across the pane, close enough to read as a screen and open
  // enough to let the light through. This is the single most recognisable thing on a
  // frontage like this, and the supplied model had none.
  const slats=Math.max(3,Math.round(runX/.17));
  for(let i=0;i<slats;i++){
   const x=fromX+(i+.5)*(toX-fromX)/slats;
   painted([.045,groundH-1.42,.05],[x,(0.75+groundH-.42)/2,front-.26],0x33291f);
  }
  // Two rails across the slats.
  for(const y of [1.12,2.24])if(y<groundH-.45)painted([runX-.12,.05,.06],[midX,y,front-.255],0x33291f);
  return {midX,runX,paneH};
 };
 bay(northX+.13,-cheekHalf);
 bay(cheekHalf,southX-.13);

 // The recess: two returns and the wall above the doorway.
 for(const side of [-1,1])
  box([.24,groundH+.01,recess+.01],[side*cheekHalf,(groundH+.01)/2,front-recess/2+.005],'plaster',0x6f6656);
 box([doorWidth+.5,groundH-doorHeight+.01,recess+.02],[0,doorHeight+(groundH-doorHeight+.01)/2,front-recess/2],'plaster',0x6f6656);
 // A threshold stone and the step up off the pavement.
 box([doorWidth+.7,.16,.75],[0,.08,front-.1],'concrete',0x8f887a);

 // The door itself: a timber-framed sliding pair with frosted glazing, standing shut.
 // It is scenery — the entrance prompt is what opens it — so it is built as one leaf
 // pair rather than something that slides.
 painted([doorWidth+.16,.14,.1],[0,doorHeight+.06,doorPlane],0x3c3025);
 for(const side of [-1,1]){
  const leaf=new THREE.Group();leaf.position.set(side*doorWidth/4,0,doorPlane);group.add(leaf);
  const frame=(size,position)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),paint(0x413324));
   m.position.set(...position);m.castShadow=!!shadows;m.userData.staticProp=true;leaf.add(m);};
  frame([doorWidth/2,doorHeight,.07],[0,doorHeight/2,0]);
  const glazing=new THREE.Mesh(new THREE.PlaneGeometry(doorWidth/2-.14,doorHeight-.3),
   new THREE.MeshStandardMaterial({color:0x5d5344,emissive:0xd8a557,emissiveIntensity:.08,roughness:.65,transparent:true,opacity:.9}));
  glazing.position.set(0,doorHeight/2,.045);glazing.userData.clearWindow=true;glazing.userData.minatoGlow=true;leaf.add(glazing);
  // A handle, at the height a hand finds it.
  frame([.05,.34,.05],[side*(doorWidth/4-.14),1.02,.07]);
 }

 // ---- the noren ----------------------------------------------------------------
 // Hung from a pole across the recess, three panels with a gap between them, so you
 // duck through it rather than walk past it. Out when the bar is open; see lit().
 const noren=new THREE.Group();noren.name='Minato noren';noren.position.set(0,0,doorPlane+.1);group.add(noren);
 painted([doorWidth+.44,.055,.055],[0,doorHeight-.06,0],0x2e2418);
 {
  const map=norenTexture();
  const cloth=new THREE.MeshStandardMaterial({map,roughness:.95,side:THREE.DoubleSide});
  const panelW=(doorWidth+.3)/3-.035;
  for(const [i,offset] of [-1,0,1].entries()){
   const panel=new THREE.Mesh(new THREE.PlaneGeometry(panelW,.62),cloth);
   panel.position.set(offset*(panelW+.035),doorHeight-.39,0);
   // A cloth hangs from a pole, so it is not flat: each panel leans out a little.
   panel.rotation.x=-.05-i%2*.02;
   panel.userData.staticProp=true;noren.add(panel);
   const uv=panel.geometry.attributes.uv;
   for(let v=0;v<uv.count;v++)uv.setX(v,(uv.getX(v)+i)/3);
   uv.needsUpdate=true;
  }
 }

 // ---- the eave ------------------------------------------------------------------
 // The line that makes the building. It carries the lanterns and it puts the whole
 // frontage in shade, which is how a bar front reads warm at four in the afternoon.
 const eaveY=groundH+.12;
 box([width+.5,.14,eave+.3],[centreX,eaveY,front+eave/2-.15],'timber',0x473726);
 {
  const shape=new THREE.Shape();
  shape.moveTo(0,0);shape.lineTo(eave+.34,-.46);shape.lineTo(eave+.34,-.58);shape.lineTo(0,-.12);shape.closePath();
  const tiles=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:width+.52,bevelEnabled:false}),
   shade('roof',0xa24c35));
  tiles.rotation.y=Math.PI/2;tiles.position.set(northX-.26,eaveY+.2,front-.15);
  tiles.castShadow=!!shadows;tiles.receiveShadow=true;tiles.userData.staticProp=true;group.add(tiles);
 }
 // Rafter ends under it, which is the detail that stops the eave looking like a shelf.
 for(let x=northX;x<=southX;x+=.52)painted([.07,.1,eave+.2],[x,eaveY-.12,front+eave/2-.1],0x3d2f21);

 // ---- second storey and roof -----------------------------------------------------
 // Painted rather than photographed plaster: the photograph's own shadows took every
 // tint down to the grey of wet concrete, and the upper floor read as a blank slab.
 painted([width,upperH-eaveY-.14,.26],[centreX,(upperH+eaveY+.14)/2,front-.13],0xc9b796,{roughness:.95});
 // Two lattice windows over the street, the flat's own.
 for(const x of [centreX-1.55,centreX+1.55]){
  // Proud of the wall face, so the window is a window: the panes used to sit a
  // quarter of a metre inside a solid wall and only the rails showed, as two slits.
  box([1.62,.16,.36],[x,upperH-1.62,front-.1],'timber',0x4a3a2a);
  box([1.62,.16,.36],[x,upperH-.36,front-.1],'timber',0x4a3a2a);
  for(const dx of [-.78,.78])painted([.08,1.3,.34],[x+dx,upperH-.99,front-.1],0x4a3a2a);
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.1),
   new THREE.MeshStandardMaterial({color:0x5c6a6c,emissive:0xd0a35e,emissiveIntensity:.06,roughness:.35}));
  glazeWithRoom(pane);
  pane.position.set(x,upperH-.99,front+.012);pane.userData.clearWindow=true;pane.userData.minatoGlow=true;group.add(pane);
  for(let i=0;i<7;i++)painted([.04,1.06,.03],[x-.66+i*.22,upperH-.99,front+.035],0x362b20);
  painted([1.5,.05,.035],[x,upperH-.99,front+.04],0x362b20);
  // A sudare, the bamboo blind, let half-way down against the afternoon sun.
  painted([1.52,.52,.02],[x,upperH-.72,front+.07],0xcaa86a,{roughness:.95});
  for(let k=0;k<5;k++)painted([1.52,.018,.02],[x,upperH-.52-k*.1,front+.075],0x8d7448);
  // A sill with a pot of something on it, which says somebody lives up there.
  painted([1.7,.07,.24],[x,upperH-1.72,front+.05],0x4a3a2a);
 }
 // The painted board between the floors: what the place is, for anyone up the street.
 {
  const board=new THREE.Mesh(new THREE.BoxGeometry(4.4,.56,.06),[paint(0x3a2c20),paint(0x3a2c20),paint(0x3a2c20),paint(0x3a2c20),
   new THREE.MeshStandardMaterial({map:fascia({jp:"Ryukyu cuisine/Awamori",en:'Minato izakaya · Ryukyu cooking & awamori',bg:'#efe2c2',accent:'#8a3b2e',ink:'#2b1d17'}),roughness:.8}),paint(0x3a2c20)]);
  board.position.set(centreX,eaveY+.62,front+.02);board.userData.staticProp=true;group.add(board);
 }
 // A shisa on the eave over the door, and pot plants either side of the step.
 {
  const kit=createKit({shadows});
  shisa(kit,southX-.45,eaveY+.08,front+.55,0,1.05);
  potPlant(kit,-cheekHalf-.35,front+.35,{seed:3,size:.3});potPlant(kit,cheekHalf+.95,front+.3,{seed:6,size:.26});
  kit.finish(group,'Minato shisa and plants');
 }
 // The main pitch, ridge along the street, eaves front and back: a machiya, not a hut
 // with a gable pointed at the road.
 {
  const shape=new THREE.Shape();
  shape.moveTo(front+.42,0);shape.lineTo((front+back)/2,ridge-upperH);shape.lineTo(back-.42,0);
  shape.lineTo(back-.42,-.24);shape.lineTo((front+back)/2,ridge-upperH-.24);shape.lineTo(front+.42,-.24);shape.closePath();
  const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:width+.44,bevelEnabled:false}),
   shade('roof',0xa24c35));
  roof.rotation.y=-Math.PI/2;roof.position.set(southX+.22,upperH,0);
  roof.castShadow=!!shadows;roof.receiveShadow=true;roof.userData.staticProp=true;group.add(roof);
  // A ridge cap, because a bare fold reads as paper.
  // Okinawan red tile, the ridge pointed in white lime.
  painted([width+.5,.2,.34],[centreX,ridge-.06,(front+back)/2],0xe6e0d2,{roughness:.9});
 }

 // ---- lanterns --------------------------------------------------------------------
 // Three akachochin on the eave beam. They are the reason you can find the place after
 // dark from the far end of the pavement.
 //
 // Paper over bamboo, so they belly out between round black caps, and each says what
 // is inside: yakitori, sake, oden. They used to be straight tubes between square
 // plates, which from the pavement read as three orange boxes.
 const lanterns=[],lanternSpots=[];
 const belly=Array.from({length:13},(_,k)=>{const t=k/12;return new THREE.Vector2(.12+.085*Math.sin(Math.PI*t),-.25+.5*t);});
 const lanternShape=new THREE.LatheGeometry(belly,20);
 for(const [i,x] of [centreX-1.9,centreX,centreX+1.9].entries()){
  const hang=new THREE.Group();hang.position.set(x,eaveY-.2,front+.46);group.add(hang);
  painted([.03,.2,.03],[0,-.1,0],0x2b231a,undefined,hang);
  const word=["Yakitori","Alcohol","Oden"][i],map=chochinTexture(word);
  // Lit, the paper goes orange with the bulb behind it (its own map), not the daytime red made brighter.
  const body=new THREE.Mesh(lanternShape,
   new THREE.MeshStandardMaterial({map,emissiveMap:chochinTexture(word,true),color:0xffffff,emissive:0xffb27a,emissiveIntensity:0,roughness:.9,side:THREE.DoubleSide}));
  // The clock changes this material; a static batch would freeze a cloned copy.
  body.position.y=-.45;body.userData.dynamicProp=true;hang.add(body);
  lanterns.push(body);
  lanternSpots.push({head:{x,y:eaveY-.65,z:front+.46},ground:{x,y:0,z:front+.9},radius:1.9,size:1.1});
  for(const y of [-.2,-.7]){
   const cap=new THREE.Mesh(new THREE.CylinderGeometry(.115,.115,.05,16),paint(0x201813));
   cap.position.y=y;cap.castShadow=!!shadows;hang.add(cap);
  }
  hang.rotation.z=(i-1)*.015;
 }
 // The glow round each lantern and the pool it throws on the pavement (light-pools.js): sprites and
 // decals, no light, lit with the paper.
 const lanternGlowFx=createLampGlow(group,lanternSpots,{halo:{color:0xffa860}});

 // ---- kanban, menu and the clutter of a working bar ---------------------------------
 {
  const map=kanbanTexture();
  const board=new THREE.Mesh(new THREE.BoxGeometry(.1,2.3,.58),
   [paint(0x2b1d17),paint(0x2b1d17),paint(0x2b1d17),paint(0x2b1d17),
    new THREE.MeshStandardMaterial({map,emissiveMap:map,emissive:0xffffff,emissiveIntensity:0,roughness:.85}),
    paint(0x2b1d17)]);
  board.position.set(southX+.19,2.05,front+.34);board.castShadow=!!shadows;board.userData.staticProp=true;group.add(board);
  board.userData.minatoSign=true;lanterns.push(board);
  painted([.09,2.2,.09],[southX+.2,1.1,front+.62],0x33281d);
 }
 {
  const map=menuTexture();
  const menu=new THREE.Mesh(new THREE.PlaneGeometry(.52,.72),new THREE.MeshStandardMaterial({map,roughness:.9}));
  menu.position.set(cheekHalf+.36,1.42,front+.02);menu.userData.staticProp=true;group.add(menu);
 }
 // Beer crates by the north cheek, stacked the way an empties stack actually is.
 for(const [i,[x,y,z,turn]] of [[-2.35,.16,front+.34,.05],[-2.3,.48,front+.32,-.09],[-1.9,.16,front+.4,.22]].entries()){
  const crate=painted([.44,.3,.34],[x,y,z],i%2?0x5c4a33:0x4d3f2d);crate.rotation.y=turn;
 }
 // A bottle case, and two bottles that never made it back into it.
 painted([.4,.26,.3],[-2.72,.13,front+.3],0x3e5044).rotation.y=-.14;
 for(const [x,z] of [[-2.62,front+.56],[-2.44,front+.52]]){
  const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.037,.041,.26,7),paint(0x3b4a2c,{roughness:.45}));
  bottle.position.set(x,.13,z);bottle.userData.staticProp=true;group.add(bottle);
 }
 // ---- Sato Ramen ------------------------------------------------------------------
 // The single-storey corner shop against the alley flank, open at lunch while the bar is
 // shut. Its kitchen is Minato's own line carried on through the wall (see
 // tools/blender/build-minato-compact.py); out here it is a door, a noren and a sign.
 // Its depth is independent of Minato's rear extension: the lunch shop keeps its street footprint.
 const {x0:AX0,x1:AX1,door:AD,height:AH,depth:annexDepth}=SATO_ANNEX,AZ1=front-.1,AZ0=AZ1-annexDepth,AMX=(AX0+AX1)/2;
 const ramen=new THREE.Group();ramen.name='Sato Ramen frontage';group.add(ramen);
 const rbox=(size,pos,colour,extra)=>painted(size,pos,colour,extra,ramen);
 box([AX1-AX0+.2,.18,AZ1-AZ0+.1],[AMX,.09,(AZ0+AZ1)/2],'concrete',0x8c8578);
 rbox([AX1-AX0,AH,wallT],[AMX,AH/2,AZ0+wallT/2],0xb3a890,{roughness:.95});
 // The flank stops inside the back and street walls, so no face of it lies in theirs.
 rbox([wallT,AH,AZ1-AZ0-2*wallT],[AX1-wallT/2,AH/2,(AZ0+AZ1)/2],0xb5aa92,{roughness:.95});
 // The street face: wall either side of the door and the window, and the lintel over both.
 const dl=AD-.6,dr=AD+.6,wl=dr+.35,wr=AX1-.3;
 rbox([dl-AX0,AH,wallT],[(AX0+dl)/2,AH/2,AZ1-wallT/2],0xb8ad95,{roughness:.95});
 rbox([wl-dr,AH,wallT],[(dr+wl)/2,AH/2,AZ1-wallT/2],0xb8ad95,{roughness:.95});
 rbox([AX1-wr,AH,wallT],[(wr+AX1)/2,AH/2,AZ1-wallT/2],0xb8ad95,{roughness:.95});
 rbox([wr-wl,.9,wallT],[(wl+wr)/2,.45,AZ1-wallT/2],0xb8ad95,{roughness:.95});
 rbox([dr-dl,AH-2.15,wallT],[AD,2.15+(AH-2.15)/2,AZ1-wallT/2],0xb8ad95,{roughness:.95});
 rbox([wr-wl,AH-2.05,wallT],[(wl+wr)/2,2.05+(AH-2.05)/2,AZ1-wallT/2],0xb8ad95,{roughness:.95});
 // A sliding glass door in an aluminium frame, and a steamed-up window beside it.
 const glass=new THREE.MeshStandardMaterial({color:0xcfdcd8,roughness:.2,metalness:.1,transparent:true,opacity:.55});
 for(const dx of [-.3,.3]){const pane=new THREE.Mesh(new THREE.BoxGeometry(.58,2.05,.03),glass);pane.position.set(AD+dx,1.1,AZ1-.02);ramen.add(pane);}
 for(const dx of [-.6,0,.6])rbox([.05,2.15,.06],[AD+dx,1.1,AZ1+.01],0x9aa0a0,{roughness:.4,metalness:.5});
 rbox([1.25,.06,.06],[AD,2.16,AZ1+.01],0x9aa0a0,{roughness:.4,metalness:.5});
 const steam=new THREE.MeshStandardMaterial({color:0xe9ece6,roughness:.3,transparent:true,opacity:.72,emissive:0xffe8c0,emissiveIntensity:0});
 const pane=new THREE.Mesh(new THREE.BoxGeometry(wr-wl,1.1,.03),steam);pane.position.set((wl+wr)/2,1.5,AZ1-.02);ramen.add(pane);pane.userData.ramenGlow=true;
 rbox([wr-wl+.08,.06,.1],[(wl+wr)/2,.92,AZ1+.02],0x9aa0a0,{roughness:.4,metalness:.5});
 // A shed roof falling to the alley, and a short awning over the door and the window.
 const roof=rbox([AX1-AX0+.5,.12,AZ1-AZ0+.7],[AMX,AH+.25,(AZ0+AZ1)/2+.2],0x5a4a3c,{roughness:.8});roof.rotation.z=-.1;
 const awning=rbox([dr-dl+2.1,.06,.7],[AD+.9,2.45,AZ1+.33],0x7a1f1a,{roughness:.7});awning.rotation.x=.18;
 // The signboard: 中華そば さとう, red on cream, over the door.
 const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=128;const sx=signCanvas.getContext('2d');
 sx.fillStyle='#efe4c8';sx.fillRect(0,0,512,128);sx.strokeStyle='#7a1f1a';sx.lineWidth=10;sx.strokeRect(5,5,502,118);
 sx.fillStyle='#a3241c';sx.textAlign='center';sx.textBaseline='middle';sx.font='bold 70px serif';signText(sx,"中華そば さとう",256,58,470,70);
 sx.font='bold 20px sans-serif';sx.fillText('SATO RAMEN · LUNCH 11:00–14:00',256,108);
 const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;
 const board=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.6),new THREE.MeshStandardMaterial({map:signTex,emissiveMap:signTex,emissive:0xffffff,emissiveIntensity:0,roughness:.8}));
 board.position.set(AMX,2.85,AZ1+.02);board.userData.ramenGlow=true;board.name='Sato Ramen sign';ramen.add(board);
 // The noren: red, ラーメン in white, out while Mrs Sato is open.
 const norenCanvas=document.createElement('canvas');norenCanvas.width=256;norenCanvas.height=160;const nx=norenCanvas.getContext('2d');
 nx.fillStyle='#9c2b22';nx.fillRect(0,0,256,160);nx.fillStyle='#f4ead2';nx.textAlign='center';nx.textBaseline='middle';nx.font='bold 56px serif';nx.fillText("Ramen",128,80);
 nx.fillStyle='#9c2b22';nx.fillRect(126,0,4,160);
 const norenTex=new THREE.CanvasTexture(norenCanvas);norenTex.colorSpace=THREE.SRGBColorSpace;
 const ramenNoren=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.75),new THREE.MeshStandardMaterial({map:norenTex,side:THREE.DoubleSide,roughness:.9}));
 ramenNoren.position.set(AD,1.8,AZ1+.12);ramenNoren.name='Sato Ramen noren';ramen.add(ramenNoren);
 // A menu board on the pavement, and the kitchen's vent up the alley flank with its cap.
 const aframe=rbox([.5,.8,.08],[AX1-.55,.42,AZ1+.55],0x3b2a1e,{roughness:.8});aframe.rotation.x=-.12;
 const menuCanvas=document.createElement('canvas');menuCanvas.width=128;menuCanvas.height=192;const mx=menuCanvas.getContext('2d');
 mx.fillStyle='#1f2a22';mx.fillRect(0,0,128,192);mx.fillStyle='#f4ead2';mx.textAlign='center';mx.font='bold 20px serif';
 ["Soy sauce 450","Miso 500","Salt 450","Char siu 650","Gyoza 250"].forEach((l,k)=>mx.fillText(l,64,30+k*34));
 const menuTex=new THREE.CanvasTexture(menuCanvas);menuTex.colorSpace=THREE.SRGBColorSpace;
 const chalk=new THREE.Mesh(new THREE.PlaneGeometry(.42,.66),new THREE.MeshStandardMaterial({map:menuTex,roughness:.9}));chalk.position.set(AX1-.55,.44,AZ1+.6);chalk.rotation.x=-.12;ramen.add(chalk);
 rbox([.3,AH+.6,.3],[AX1+.18,(AH+.6)/2,AZ0+1.4],0x8a8e8a,{roughness:.5,metalness:.4});
 rbox([.45,.12,.45],[AX1+.18,AH+.66,AZ0+1.4],0x6a6e6a,{roughness:.5,metalness:.4});
 // The compressor and the meter box, moved out on to the alley flank.
 painted([.62,.5,.3],[AX1+.14,1.05,front-1.5],0x7b7669,{roughness:.7});
 painted([.3,.38,.24],[AX1+.14,1.75,front-2.35],0x8a8578);

 // ---- collision ----------------------------------------------------------------
 // The walls stop you and the recess does not, so the doorway stays a doorway. These
 // are in the plot's local frame; the caller rotates them.
 colliders.push(
  // The two halves of the building, each side of the doorway.
  {x:(northX-cheekHalf)/2,z:(front+back)/2,w:-cheekHalf-northX,d:depth,height:upperH},
  {x:(southX+cheekHalf)/2,z:(front+back)/2,w:southX-cheekHalf,d:depth,height:upperH},
  // Behind the recessed door: the doorway is scenery, and you stop at the leaf.
  {x:0,z:doorPlane-.12,w:doorWidth+.3,d:.24,height:doorHeight},
  // The crates and the kanban post, which are things in the street.
  {x:-2.3,z:front+.36,w:1.1,d:.5,height:.8},
  {x:southX+.2,z:front+.48,w:.34,d:.5,height:2.3},
  // Sato Ramen, and its menu board on the pavement.
  {x:AMX,z:(AZ0+AZ1)/2,w:AX1-AX0+.2,d:AZ1-AZ0,height:AH},
  {x:AX1-.55,z:AZ1+.55,w:.55,d:.35,height:.9},
 );

 /**
  * The frontage after dark and when the bar is open.
  * @param {boolean} open whether Thao has the place running
  * @param {number} day 1 at noon, 0 at night
  * @param {number} [lantern] paper-lantern glow 0–1 from the dusk clock; falls back to 1−day
  */
 const lit=(open,day,lantern)=>{
  const dusk=1-THREE.MathUtils.clamp(day,0,1);
  const paper=lantern==null?dusk:THREE.MathUtils.clamp(lantern,0,1);
  const glow=open?.12+dusk*.95:dusk*.06;
  group.traverse(o=>{if(o.userData.minatoGlow)o.material.emissiveIntensity=glow;});
  const lanternI=open?.35+paper*1.35:0;
  for(const item of lanterns){
   const mat=Array.isArray(item.material)?item.material[4]:item.material;
   if(mat)mat.emissiveIntensity=lanternI;
  }
  // The halos and the pool show as the daylight goes (dusk.js poolGlow), not the moment the paper is switched on.
  lanternGlowFx.update(open?paper*Math.pow(dusk,1.5):0);
  noren.visible=open;
 };
 lit(false,1);
 /** The ramen shop: noren out and the sign lit while Mrs Sato is serving. */
 const ramenLit=(open,day)=>{
  const dusk=1-THREE.MathUtils.clamp(day,0,1);
  ramen.traverse(o=>{if(o.userData.ramenGlow)o.material.emissiveIntensity=open?.25+dusk*.5:0;});
  ramenNoren.visible=open;
 };
 ramenLit(false,1);
 // The frontage's timber, plaster and fittings stand still and are drawn in batches. The noren
 // come and go with opening hours and the lanterns and signs glow, so those stay live.
 {const live=new Set();for(const o of [noren,ramenNoren,...lanterns])o?.traverse?.(c=>live.add(c));
  group.traverse(o=>{if(o.isMesh&&!live.has(o)&&!o.userData.minatoGlow&&!o.userData.ramenGlow)o.userData.staticProp=true;});}
 return {group,noren,lanterns,lanternGlow:lanternGlowFx,lit,ramen:{group:ramen,noren:ramenNoren,lit:ramenLit}};
}
