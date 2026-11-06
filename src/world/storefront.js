import {createShopGlass} from './shop-glass.js';
import {createMaterials} from '../render/materials.js?snappy=1';
import * as THREE from '../../vendor/three.module.js';
import {SLIDING_DOOR,buildSlidingLeaves,doorState,stepDoor} from './sliding-door.js';
import {localToWorld} from './landmark-lots.js';
import {buildSakuraDetails} from './exterior-details.js';
// Sakura's shopfront: a family shōten's wooden sashes and signboard under a tile hood,
// with the real shop seen through the glass.

/**
 * The signboard's face, painted for the board it hangs on. It used to be the town's
 * generic label: a 3:1 canvas stretched over a 13:1 board, which pulled every letter
 * four times wide. This one is painted at the board's own proportions: the shop's crest,
 * さくら商店 in a serif face, and the English in two lines beside it.
 */
function buildSignboard(group,{width}){
 const w=Math.min(width*.86,12.6),h=.6,W=4096,H=Math.round(W*h/w);
 if(typeof document==='undefined'||!document.createElement)return null;
 const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');if(!ctx)return null;
 // Cream enamel with a double brown rule round it.
 ctx.fillStyle='#f6ead0';ctx.fillRect(0,0,W,H);
 ctx.strokeStyle='#4a2a18';ctx.lineWidth=H*.06;ctx.strokeRect(H*.06,H*.06,W-H*.12,H*.88);
 ctx.lineWidth=H*.015;ctx.strokeRect(H*.14,H*.14,W-H*.28,H*.72);
 // The crest: five pink petals round a gold heart in a red ring.
 const cx=H*.85,cy=H/2,r=H*.33;
 ctx.fillStyle='#c8202a';ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();ctx.fillStyle='#fbf6ea';ctx.beginPath();ctx.arc(cx,cy,r*.84,0,7);ctx.fill();
 ctx.fillStyle='#f19bb0';for(let k=0;k<5;k++){const a=k*Math.PI*2/5-Math.PI/2;ctx.beginPath();ctx.ellipse(cx+Math.cos(a)*r*.38,cy+Math.sin(a)*r*.38,r*.28,r*.19,a,0,7);ctx.fill();}
 ctx.fillStyle='#e9b42a';ctx.beginPath();ctx.arc(cx,cy,r*.13,0,7);ctx.fill();
 // The name, large and spaced, then a rule, then the English.
 ctx.fillStyle='#3a2414';ctx.textBaseline='middle';ctx.textAlign='left';
 ctx.font='bold '+Math.round(H*.6)+'px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP","Noto Serif JP",serif';
 // Measure the whole line first, so crest, name and English sit centred on the board.
 const name='さくら商店',gap=H*.1,nameFont='bold '+Math.round(H*.62)+'px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP","Noto Serif JP",serif';
 const enFont='bold '+Math.round(H*.3)+'px Georgia,"Times New Roman",serif',subFont=Math.round(H*.19)+'px Georgia,"Times New Roman",serif';
 ctx.font=nameFont;const nameW=[...name].reduce((s,ch)=>s+ctx.measureText(ch).width+gap,-gap);
 ctx.font=enFont;const enW=Math.max(ctx.measureText('SAKURA SHŌTEN').width,(ctx.font=subFont,ctx.measureText('FOOD & DAILY GOODS · SINCE 1963').width));
 const total=r*2+H*.5+nameW+H*.7+enW,start=(W-total)/2;
 // Redraw the crest at its centred place (the first one was at the left edge).
 ctx.fillStyle='#f6ead0';ctx.fillRect(cx-r-4,cy-r-4,r*2+8,r*2+8);
 const crestX=start+r;ctx.fillStyle='#c8202a';ctx.beginPath();ctx.arc(crestX,cy,r,0,7);ctx.fill();ctx.fillStyle='#fbf6ea';ctx.beginPath();ctx.arc(crestX,cy,r*.84,0,7);ctx.fill();
 ctx.fillStyle='#f19bb0';for(let k=0;k<5;k++){const a=k*Math.PI*2/5-Math.PI/2;ctx.beginPath();ctx.ellipse(crestX+Math.cos(a)*r*.38,cy+Math.sin(a)*r*.38,r*.28,r*.19,a,0,7);ctx.fill();}
 ctx.fillStyle='#e9b42a';ctx.beginPath();ctx.arc(crestX,cy,r*.13,0,7);ctx.fill();
 ctx.fillStyle='#3a2414';ctx.font=nameFont;let x=start+r*2+H*.5;for(const ch of name){ctx.fillText(ch,x,H*.53);x+=ctx.measureText(ch).width+gap;}
 const rule=x-gap+H*.35;ctx.fillStyle='#4a2a18';ctx.fillRect(rule,H*.22,H*.025,H*.56);
 ctx.fillStyle='#3a2414';ctx.font=enFont;ctx.fillText('SAKURA SHŌTEN',rule+H*.35,H*.38);
 ctx.fillStyle='#8a3a2a';ctx.font=subFont;ctx.fillText('FOOD & DAILY GOODS · SINCE 1963',rule+H*.35,H*.68);
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
 const face=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,roughness:.6,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:.05}));
 face.position.set(0,3.25,.352);face.name='Sakura signboard';group.add(face);
 return face;
}

/** How tall the sliding door is. The valance over it has to clear this. */
const DOOR_HEIGHT=2.25;
/**
 * @param {object} options
 * @param {{width:number,depth:number,doorX:number}} [options.span] how big the shop is
 *   and where its door is, in metres. The default is the frontage the canal-quarter lot
 *   was cut for. The harbour street asks for one the size of the supplied interior, so
 *   what you see through the glass is the shop you walk into rather than a smaller copy
 *   of it — see WINDOW_FIT in sakura-shop.js.
 */
export function buildStorefront({parent,site,register,enter,label,placement,span}){
 const width=span?.width??10,depth=span?.depth??8.2,doorX=span?.doorX??-2.5;
 const half=width/2,mid=-depth/2,back=-depth;
 const x=placement?.x??site.side*7.55,z=placement?.z??site.z;
 const yaw=placement?.yaw??-site.side*Math.PI/2,scale=placement?.scale??1;
 const sx=scale.x??scale,sy=scale.y??scale,sz=scale.z??scale;
 const group=new THREE.Group();group.name='Sakura glass storefront';group.position.set(x,0,z);group.rotation.y=yaw;group.scale.set(sx,sy,sz);parent.add(group);
 buildSakuraDetails(group,{width,depth,doorX});
 const surfaces=createMaterials(),materials=new Map();function box(size,pos,color,kind=null){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.67}));const o=new THREE.Mesh(new THREE.BoxGeometry(...size),kind?surfaces.material(kind,color):materials.get(color));o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;o.userData.staticProp=true;group.add(o);return o;}
 box([width,.18,depth],[0,.09,mid],0xdad9c8,'plaster');box([width,3.7,.18],[0,1.85,back-.09],0xeee7d1,'plaster');
 for(const wall of [-1,1])box([.18,3.8,depth],[wall*(half+.09),1.9,mid],0xd9d7c9,'plaster');
 box([width+.5,.22,depth+.5],[0,3.9,mid],0xd5d0bd);
 // A family shop's signboard, not a chain's band: a long board of dark wood with the
 // name on a cream panel, under a short hood of red Okinawan tile.
 box([width+.3,.8,.45],[0,3.25,.12],0x5b3f2a);
 // The two rails stand proud of the board on every side (2 cm under it, 1 cm over), never flush with its faces: a rail's
 // face in the board's own plane flashed on a phone's depth buffer.
 for(const y of [2.86,3.61])box([width+.32,.06,.49],[0,y,.13],0x3f2b1c);
 {const hood=new THREE.Group();hood.position.set(0,3.98,.32);hood.rotation.x=.42;group.add(hood);
  const tile=new THREE.MeshStandardMaterial({color:0xb5523a,roughness:.8}),ridge=new THREE.MeshStandardMaterial({color:0x8f3c2a,roughness:.8});
  const slab=new THREE.Mesh(new THREE.BoxGeometry(width+.5,.06,.7),tile);slab.position.set(0,0,.2);slab.castShadow=true;slab.receiveShadow=true;hood.add(slab);
  for(let x=-width/2-.2;x<=width/2+.2;x+=.26){const rib=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.68,6),ridge);rib.rotation.x=Math.PI/2;rib.position.set(x,.045,.2);hood.add(rib);}
  const cap=new THREE.Mesh(new THREE.BoxGeometry(width+.56,.1,.12),ridge);cap.position.set(0,.04,-.12);hood.add(cap);}
 const logo=new THREE.Object3D();logo.position.set(0,3.24,.38);group.add(logo);group.updateMatrixWorld(true);site.streetFrontage={position:group.localToWorld(new THREE.Vector3(0,.18,.02)).toArray(),yaw};buildSignboard(group,{width});
 // A light haze softens the view without a refraction framebuffer on phones.
 const glazing=createShopGlass({haze:.12});
 // Glass to either side of the doorway, whatever the frontage is: a pane list authored
 // for a ten-metre shop leaves a wall of nothing when the shop is fourteen.
 const DOOR=1.9,JAMB=.15,panes=[[doorX,DOOR]];
 for(const side of [-1,1]){
  const outer=side*(half-JAMB),inner=doorX+side*DOOR/2,run=Math.abs(outer-inner);
  if(run>.7)panes.push([(outer+inner)/2,run]);
 }
 // The doorway has only a fanlight over the door's rail: a full pane there lay in the leaves' own plane, glass on glass.
 for(const [lx,paneWidth] of panes){const fan=lx===doorX,pane=new THREE.Mesh(new THREE.PlaneGeometry(paneWidth,fan?2.775-(DOOR_HEIGHT+.11):2.55),glazing);pane.position.set(lx,fan?(2.775+DOOR_HEIGHT+.11)/2:1.5,.02);pane.name='Sakura clear window pane';pane.userData.clearWindow=true;group.add(pane);for(const edge of [-1,1])box([.065,2.75,.09],[lx+edge*paneWidth/2,1.47,.055],0x4a3a2c);box([paneWidth,.08,.09],[lx,.15,.055],0x4a3a2c);
  if(lx===doorX)continue;
  // The shop window as sashes: wooden mullions about a pace apart, a transom bar with the
  // fanlights over it, and a kick panel along the bottom.
  const bays=Math.max(1,Math.round(paneWidth/1.45));
  // In front of the glass (z .02) by a centimetre, not touching it: their backs in the pane's plane flashed through it.
  for(let i=1;i<bays;i++)box([.07,2.6,.08],[lx-paneWidth/2+paneWidth*i/bays,1.45,.07],0x4a3a2c);
  box([paneWidth,.07,.08],[lx,2.15,.07],0x4a3a2c);box([paneWidth-.01,.34,.05],[lx,.19,.065],0x6b4c32);}
 box([width,.1,.1],[0,2.82,.05],0x4a3a2c);for(const lx of [doorX-.4,doorX+.4])box([.035,.5,.12],[lx,1.4,.12],0x465854);
 // The persistent shop provides all furnishings and stock; no street-only replicas.
 // The mat lies 8 mm over the threshold stone (exterior-details.js, top 0.2275), not in its plane.
 const mat=box([1.7,.035,.8],[doorX,.218,.55],0x777064);mat.userData.storeEntrance=true;
 const flag=box([.06,2.4,.42],[half+.05,2.15,.22],0xb84e45);flag.userData.banner=true;
 // Clear of the doorway. It used to hang from 1.08 to 2.63, straight across the
 // opening, so anybody standing in the door was cut off at the waist by a curtain —
 // which you saw from the pavement as a customer with no upper half. A shop with an
 // automatic door hangs a short valance over the head of it instead.
 hangNoren(group,doorX,DOOR_HEIGHT+.26,.09);
 // The back of house. It was never seen while the shop stood in an invisible box with
 // only its frontage on walkable ground; now that you can walk round it, a blank wall
 // the size of the building is the thing you notice.
 if(span){
  // Everything here is dark for its own good: under this town's sun a mid grey renders
  // as cream, and a fitting the colour of the wall it is bolted to is not a fitting.
  const wall=back-.19,door=.9;
  box([1.32,2.32,.1],[door,1.16,wall+.02],0x6b6154);             // door surround
  box([1.05,2.1,.12],[door,1.05,wall-.03],0x42514a);             // the stockroom door
  box([.1,.05,.06],[door+.38,1.0,wall-.11],0xb9b2a0);            // its handle
  box([.1,3.8,.14],[door-1.5,1.9,wall-.06],0x5b5548);            // downpipe, from the roof's edge to its gully (okinawa/old-town.js)
  box([.66,.8,.32],[door-2.5,1.42,wall-.145],0x7a7164);           // meter cupboard
  box([.58,.1,.34],[door-2.5,1.84,wall-.155],0x5d564a);           // its lid
  box([1.2,.86,.5],[-half+2.8,2.3,wall-.235],0x6d736d);           // extractor
  for(const y of [2.12,2.3,2.48])box([1.0,.06,.54],[-half+2.8,y,wall-.275],0x4a4f4a);
  // The empties, back in their cases on a pallet by the door for the depot's hand truck to take away (Sakura Trading
  // buys in its own beer since Higa Liquor closed: commerce/merchandising.js). The row against the wall stands two high.
  const pallet=[half-4.4,wall-.52];
  box([.9,.06,.7],[pallet[0],.03,pallet[1]],0x5d5a50);             // the pallet
  for(const [dx,dz,layer,colour] of [[-.22,-.17,0,0xd9a832],[.22,-.17,0,0xb8432f],[-.22,.17,0,0xb8432f],[.22,.17,0,0xd9a832],[-.22,.17,1,0xd9a832],[.22,.17,1,0xb8432f]]){
   const y=.06+layer*.3;
   box([.43,.28,.32],[pallet[0]+dx,y+.14,pallet[1]+dz],colour);
   box([.37,.02,.26],[pallet[0]+dx,y+.29,pallet[1]+dz],0x5a3a22);  // the bottles' shoulders and caps
  }
 }
 const [ax,az]=localToWorld(x,z,yaw,scale,doorX,.85);
 const anchor=new THREE.Object3D();anchor.position.set(ax,1.2,az);parent.add(anchor);register?.(anchor,'Enter '+site.title,()=>enter(site));
 const door=buildSlidingDoor({group,doorX,width:DOOR,glazing,box});
 site.shopDoor=door;
 // Where you stand to come in, and which way you are facing when you do. The shopfront
 // faces along its own +z, so the placement yaw is the heading of somebody walking in
 // through it — which is what carries a heading across the threshold.
 site.entryFacing=yaw;
 site.approachPosition=[door.mat.x,0,door.mat.z];
 return Object.assign(group,{shopDoor:door});
}

/**
 * The doorway, which was a gap.
 *
 * A konbini's door is automatic, and the whole point of the thing is that it moves:
 * people were walking up to a hole in the frontage and being gone. Two leaves part
 * when anybody comes up to the mat — the player, Thuan, a customer, it does not ask —
 * and slide back once they are through, so you can watch somebody use the door
 * instead of arriving at where a door would be.
 *
 * The leaves stop short of the jambs by a hand's width, the way they do when they are
 * parked against the glass rather than pocketed into the wall.
 */
function buildSlidingDoor({group,doorX,width,glazing,box}){
 const HEIGHT=DOOR_HEIGHT;
 const rail=box([width+.26,.1,.15],[doorX,HEIGHT+.06,.02],SLIDING_DOOR.frame);rail.userData.staticProp=true;
 // The town's standard sliding door (sliding-door.js): the same leaves and the same motion as from inside.
 // The leaves run 4.5 cm inside the fixed glass (z 0.02): open, they park behind the side panes, and in the panes' own
 // plane they flashed through them every time somebody came in.
 const {place}=buildSlidingLeaves({parent:group,x:doorX,z:-.025,width,height:HEIGHT,glazing,name:'Sakura door leaf'});
 // Where the mat is, in the town's own coordinates, so a person's position can be
 // compared with it without anybody having to know how the shop is placed.
 group.updateMatrixWorld(true);
 const mat=group.localToWorld(new THREE.Vector3(doorX,0,.55));
 const state=doorState();let held=false;
 return {
  group,mat,
  get amount(){return state.amount;},
  /** Hold the door at an amount (0 shut, 1 open), e.g. for a film's photographs of it opening;
   *  null hands it back to the people walking up to it. */
  set(value){held=value!==null&&value!==undefined;if(held){state.amount=Math.max(0,Math.min(1,+value||0));state.speed=0;place(state.amount);}},
  /**
   * @param {number} dt
   * @param {Array<{x:number,z:number}>} bodies everyone who could open it.
   */
  update(dt,bodies){
   if(!(dt>0)||held)return;
   let near=false;
   for(const b of bodies||[]){
    const bx=b?.x??b?.position?.x,bz=b?.z??b?.position?.z;
    if(!Number.isFinite(bx)||!Number.isFinite(bz))continue;
    if((bx-mat.x)**2+(bz-mat.z)**2<SLIDING_DOOR.reach**2){near=true;break;}
   }
   stepDoor(state,dt,near);place(state.amount);
  },
 };
}

function hangNoren(group,x,y,z){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=144;
 const ctx=canvas.getContext('2d');
 ctx.fillStyle='#6f1f2c';ctx.fillRect(0,0,512,144);
 ctx.fillStyle='#f4e4c8';ctx.fillRect(8,10,496,124);
 ctx.fillStyle='#6f1f2c';ctx.textAlign='center';ctx.textBaseline='middle';
 // A noren carries the shop's name in kana, not in English.
 ctx.font='700 80px "Hiragino Mincho ProN","Yu Mincho","Noto Serif CJK JP",serif';ctx.fillText('さくら',256,64);
 ctx.font='600 22px sans-serif';ctx.fillText('SAKURA SHŌTEN',256,116);
 const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.0,.56),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,transparent:true}));
 mesh.position.set(x,y,z);mesh.userData.banner=true;mesh.name='Sakura noren';group.add(mesh);
}
