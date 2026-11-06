import * as THREE from '../../../vendor/three.module.js';
import {createPlanKit,addHatPeg,materialCache} from './house-plan.js';
import {yardHomeSpec} from './yard-home.js';
import {createFutonRoutine} from './tatami-home.js';
import {homeRoutine,sleepHours} from '../../people/home-life.js';
import {townCalendarAt} from '../../town-clock.js';

/**
 * Tetsuo's flat, 2 Front-Row Yard: the creator's 1990s Japanese flat diorama (2026-10-14: "Can you use this to make
 * Tetsuo's home on the Minato island?"), built to the yard house's own size (yard-homes-layout.js, 5.4 × 3.4 m inside).
 *
 * Why it looks like a Tokyo flat in an Okinawan port: it is the room Tetsuo kept in Tokyo through his years behind an
 * electronics repair counter, brought home on the ferry when he and Chin opened the workshop. The kotatsu only wears
 * its quilt in the cool months; the fan does the work the rest of the year.
 *
 * The plan, as a real 1K is laid out (room contract: the front door on +z; drawn for a door east of centre and
 * mirrored for one west, like yard-home.js):
 *  - the tatami room, six danchi-size mats (0.83 × 1.66 m) laid so no four corners meet, behind a sliding door;
 *  - its window in the back wall, an aluminium sash with two shoji inside it, looking at the yard's breeze-block wall;
 *  - the board-floored kitchen strip: fridge, sink and a table gas stove along the back wall;
 *  - the genkan at the door with its shoe cabinet, the WC beside it. No bath: Umi-no-yu, where he helps out.
 *
 * Machines are Johansson Denki (ヨハンソン電機), this town's maker of everything electric.
 */
const mat=materialCache();
const MAT=.83;                                  // a danchi tatami's short side; the long side is two of them
const ROOM_X0=-2.66,ROOM_X1=ROOM_X0+3*MAT;      // the tatami room's inner faces (west wall, sliding-door partition)
const PARTITION_X=ROOM_X1+.04;
const WINDOW=Object.freeze({x0:-2.35,x1:-.55,sill:.3,head:2.1});
/** The yard house's two front windows, in plan coordinates (yard-homes.js: door − 1.35 m and the house's west end + 0.55 m). */
export const TETSUO_FRONT_WINDOWS=Object.freeze([-.65,-2.25]);
export const TETSUO_BACK_WINDOW=WINDOW;

/** A canvas texture, or null without a page to paint on (the tests, the tools). */
function paint(w,h,draw){
 if(typeof document==='undefined')return null;
 const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;
}
function tatamiTexture(){
 return paint(128,256,(ctx,w,h)=>{
  ctx.fillStyle='#a7aa6c';ctx.fillRect(0,0,w,h);
  for(let y=0;y<h;y+=3){ctx.fillStyle=y%6?'rgba(196,198,138,.35)':'rgba(92,98,48,.28)';ctx.fillRect(0,y,w,1.5);}
  // The heri, the cloth binding along both long edges.
  ctx.fillStyle='#24382c';ctx.fillRect(0,0,9,h);ctx.fillRect(w-9,0,9,h);
 });
}

export function buildTetsuoFlat({site,profile,room,reg,action,collider=()=>{}}){
 const {W,D,H,s,doorX}=yardHomeSpec(site.id),hw=W/2,hd=D/2,X=x=>s*x,yaw=a=>s*a;
 const group=new THREE.Group();group.name='Tetsuo’s flat';room.add(group);
 const box=(size,pos,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof c==='number'?mat(c):c);m.position.set(...pos);m.receiveShadow=true;m.castShadow=true;if(name)m.name=name;group.add(m);return m;};
 const at=(size,[x,y,z],c,name)=>box(size,[X(x),y,z],c,name);
 const block=(x,z,w,d,h)=>collider(X(x),z,w,d,h);
 /** A group at plan (x, z), turned by `a` (mirrored with the plan); children are in its own frame, front to +z. */
 const piece=(x,z,a=0,name)=>{const g=new THREE.Group();g.position.set(X(x),0,z);g.rotation.y=yaw(a);if(name)g.name=name;group.add(g);return g;};
 const part=(g,size,pos,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),typeof c==='number'?mat(c):c);m.position.set(...pos);m.castShadow=m.receiveShadow=true;if(name)m.name=name;g.add(m);return m;};
 const anchor=(pos,label,fn)=>{const o=new THREE.Object3D();o.position.set(X(pos[0]),pos[1],pos[2]);o.userData.npcInteraction=false;group.add(o);reg(o,label,fn,true);return o;};
 const wall=0xeee6d2,trim=0x2a6f9c;
 const kit=createPlanKit({box:(size,pos,c,name)=>box(size,pos,c,name),collider,height:H,wall});
 const partition=(x1,z1,x2,z2,gaps=[],opts)=>kit.partition(X(x1),z1,X(x2),z2,Math.abs(z2-z1)<1e-6?gaps.map(([a,b])=>[Math.min(X(a),X(b)),Math.max(X(a),X(b))]):gaps,opts);

 // ------------------------------------------------------------ floors
 const genkan=[doorX-.45,doorX+.45];
 box([W,.02,D],[0,-.01,0],0x8a7a64,'Floor slab');
 const tatami=tatamiTexture(),tatamiMat=new THREE.MeshStandardMaterial({map:tatami,color:tatami?0xffffff:0xb8b47a,roughness:.88});
 // Six mats in units of one short side: [u0,v0,u1,v1], u across the room from its west wall, v from its back wall.
 const v=k=>-hd+.04+k*((D-.08)/4);
 for(const [u0,v0,u1,v1] of [[0,0,2,1],[2,0,3,2],[0,1,1,3],[1,1,2,3],[2,2,3,4],[0,3,2,4]]){
  const x0=ROOM_X0+u0*MAT,x1=ROOM_X0+u1*MAT,z0=v(v0),z1=v(v1),long=(x1-x0)>(z1-z0);
  const m=at([long?z1-z0:x1-x0,.014,long?x1-x0:z1-z0],[(x0+x1)/2,.007,(z0+z1)/2],tatamiMat,'Tatami');
  if(long)m.rotation.y=Math.PI/2;m.castShadow=false;
 }
 kit.floorPatch(Math.min(X(PARTITION_X),X(hw)),Math.max(X(PARTITION_X),X(hw)),-hd,hd,0xa67c50,'Kitchen boards');
 kit.floorPatch(Math.min(X(genkan[0]),X(genkan[1])),Math.max(X(genkan[0]),X(genkan[1])),hd-.8,hd,0x8f918c,'Genkan tiles');
 at([genkan[1]-genkan[0],.06,.1],[doorX,.03,hd-.8],0x6b4a2c,'Genkan step (agarikamachi)');

 // ------------------------------------------------------------ the shell, with the back window cut in
 const shellMat=c=>{const m=mat(c).clone();m.shadowSide=THREE.FrontSide;return m;};
 const shellPiece=(size,pos,name='Wall')=>{const m=box(size,pos,shellMat(wall),name);m.castShadow=false;return m;};
 const backZ=-hd,wx0=Math.min(X(WINDOW.x0),X(WINDOW.x1)),wx1=Math.max(X(WINDOW.x0),X(WINDOW.x1));
 shellPiece([wx0+hw,H,.08],[(-hw+wx0)/2,H/2,backZ],'Back wall');shellPiece([hw-wx1,H,.08],[(wx1+hw)/2,H/2,backZ],'Back wall');
 shellPiece([wx1-wx0,WINDOW.sill,.08],[(wx0+wx1)/2,WINDOW.sill/2,backZ],'Under the window');
 shellPiece([wx1-wx0,H-WINDOW.head,.08],[(wx0+wx1)/2,(H+WINDOW.head)/2,backZ],'Over the window');
 shellPiece([.08,H,D],[-hw,H/2,0],'End wall');shellPiece([.08,H,D],[hw,H/2,0],'End wall');
 const left=genkan[0]+hw,right=hw-genkan[1];
 shellPiece([left,H,.08],[X((-hw+genkan[0])/2),H/2,hd],'Front wall');shellPiece([right,H,.08],[X((genkan[1]+hw)/2),H/2,hd],'Front wall');
 at([genkan[1]-genkan[0],H-2.05,.08],[doorX,2.05+(H-2.05)/2,hd],shellMat(wall),'Over the door');
 for(const [z,sx] of [[backZ+.05,1],[hd-.05,-1]])void sx,at([W-.1,.08,.03],[0,.04,z],0x5a4430,'Skirting');
 const ceiling=box([W,.04,D],[0,H+.02,0],0xf4efe4,'Ceiling');ceiling.material=ceiling.material.clone();ceiling.material.shadowSide=THREE.FrontSide;ceiling.receiveShadow=false;ceiling.castShadow=false;
 collider(0,backZ,W,.1,H);

 // The sash: an aluminium frame, two glass leaves; the shoji slide on their own track inside it.
 const alu=0xb9bec0,glass=new THREE.MeshStandardMaterial({color:0xcfe3ea,transparent:true,opacity:.18,roughness:.05,depthWrite:false});
 const wmid=(WINDOW.x0+WINDOW.x1)/2,ww=WINDOW.x1-WINDOW.x0,wh=WINDOW.head-WINDOW.sill,wy=(WINDOW.head+WINDOW.sill)/2;
 for(const y of [WINDOW.sill,WINDOW.head])at([ww,.04,.07],[wmid,y,backZ-.01],alu,'Sash frame');
 for(const x of [WINDOW.x0,WINDOW.x1,wmid])at([.04,wh,.07],[x,wy,backZ-.01],alu,'Sash frame');
 const pane=at([ww-.06,wh-.06,.01],[wmid,wy,backZ-.02],glass,'Window glass');pane.castShadow=false;
 // Outside, as it is (tools/tetsuo-flat-look.mjs 02-house-back): the yard's lawn and its laundry pole, the lane's
 // coral-stone wall and, over it, the two-storey house with its breeze-block balcony; the sky, lit by the hour.
 const view=paint(512,448,(ctx,w,h)=>{
  const sky=ctx.createLinearGradient(0,0,0,h*.5);sky.addColorStop(0,'#5fa8e0');sky.addColorStop(1,'#cfe6f2');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#f2e6cf';ctx.fillRect(40,70,330,190);ctx.fillStyle='#9fc0c4';for(const x of [80,250])ctx.fillRect(x,100,70,50);
  ctx.fillStyle='#e9dcc2';ctx.fillRect(40,165,200,40);ctx.fillStyle='#b8ab92';for(let x=48;x<236;x+=16){ctx.beginPath();ctx.arc(x,185,5,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#d8c9a8';ctx.fillRect(0,250,w,70);ctx.strokeStyle='#b5a684';ctx.lineWidth=2;for(let y=250;y<320;y+=18)for(let x=(y%36?0:20);x<w;x+=40)ctx.strokeRect(x,y,40,18);
  ctx.fillStyle='#5f9a3e';ctx.fillRect(0,320,w,h-320);
  ctx.strokeStyle='#a9aeb0';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(300,440);ctx.lineTo(330,230);ctx.lineTo(360,440);ctx.moveTo(330,232);ctx.lineTo(500,232);ctx.stroke();
  for(const [x,c] of [[360,'#f4f4f0'],[410,'#a8d4a0'],[455,'#f0a8c0']]){ctx.fillStyle=c;ctx.fillRect(x,234,36,70);}
 });
 const viewMat=new THREE.MeshBasicMaterial({map:view,color:view?0xffffff:0xa9c8d8,toneMapped:false});
 const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(ww+1.2,wh+1.0),viewMat);backdrop.position.set(X(wmid),wy,backZ-.9);backdrop.name='Window view: the yard wall';group.add(backdrop);
 // Shoji: two leaves on twin tracks; the east leaf slides over the west to open the window's east half.
 const shojiPaper=new THREE.MeshStandardMaterial({color:0xfbf5e4,emissive:0x8a8470,emissiveIntensity:.25,roughness:.95,transparent:true,opacity:.9});
 const leafW=ww/2+.03,shoji=[];
 for(const [i,x] of [WINDOW.x0+leafW/2,WINDOW.x1-leafW/2].entries()){
  const g=piece(x,backZ+.07+i*.04,0,'Shoji leaf');part(g,[leafW,wh,.02],[0,wy,0],shojiPaper,'Shoji paper').castShadow=false;
  for(const fx of [-leafW/2+.015,leafW/2-.015])part(g,[.03,wh,.035],[fx,wy,0],0x6e4a2b,'Shoji frame');
  for(const fy of [WINDOW.sill+.015,WINDOW.head-.015])part(g,[leafW,.03,.035],[0,fy,0],0x6e4a2b,'Shoji frame');
  for(let k=1;k<4;k++)part(g,[.012,wh,.03],[-leafW/2+k*leafW/4,wy,0],0x6e4a2b,'Kumiko');
  for(let k=1;k<5;k++)part(g,[leafW,.012,.03],[0,WINDOW.sill+k*wh/5,0],0x6e4a2b,'Kumiko');
  shoji.push({g,closed:X(x),open:X(i?WINDOW.x0+leafW/2:x)});
 }
 // The two front windows (yard-homes.js) are frosted from inside: the yard path is right there.
 const frosted=new THREE.MeshStandardMaterial({color:0xe8eef0,emissive:0xd8e2e6,emissiveIntensity:.35,roughness:.6});
 for(const px of TETSUO_FRONT_WINDOWS){const f=at([.82,.66,.012],[px,1.37,hd-.05],frosted,'Frosted front window');f.castShadow=false;at([.95,.04,.06],[px,1.02,hd-.06],alu,'Window sill');}

 // ------------------------------------------------------------ partitions: the sliding door, the WC
 const doorway=[-.25,.55];
 partition(PARTITION_X,-hd,PARTITION_X,hd,[doorway],{name:'Partition (sliding door)'});
 partition(1.6,hd-1.15,1.6,hd,[[hd-1.0,hd-.2]]);partition(1.6,hd-1.15,hw,hd-1.15);
 kit.finishPartitions();
 // The sliding door stands open, parked against the kitchen face beside the opening.
 at([.03,1.85,.82],[PARTITION_X+.07,.93,doorway[0]-.43],0xdcd6c4,'Sliding door (frosted glass, open)');at([.035,1.85,.04],[PARTITION_X+.07,.93,doorway[0]-.03],0x6e4a2b,'Sliding door stile');
 const t0=Math.min(X(1.64),X(hw-.04)),t1=Math.max(X(1.64),X(hw-.04));
 kit.wetRoom(t0,t1,hd-1.11,hd-.04,'Toilet',true,s>0?'x0':'x1');

 // ------------------------------------------------------------ the kitchen strip and the genkan
 const fridge=piece(2.35,-hd+.35,0,'Fridge, Johansson Denki 2-door');
 part(fridge,[.6,.92,.6],[0,.46,0],0xd4ecdf,'Fridge (cold room)');part(fridge,[.6,.5,.6],[0,1.18,0],0xd4ecdf,'Fridge (freezer)');part(fridge,[.6,.015,.61],[0,.93,0],0x9fb8ab);
 part(fridge,[.03,.3,.03],[-.22,.7,.31],0x8a9a92,'Handle');part(fridge,[.03,.2,.03],[-.22,1.2,.31],0x8a9a92,'Handle');
 part(fridge,[.3,.24,.3],[0,1.55,0],0xf6eee6,'Rice cooker');block(2.35,-hd+.35,.62,.62,1.45);
 at([1.6,.85,.6],[1.05,.425,-hd+.34],0xf2f0ea,'Sink counter');at([1.62,.04,.62],[1.05,.87,-hd+.34],0xa8b0b4,'Stainless top');
 at([.46,.02,.34],[.65,.885,-hd+.34],0x6f777b,'Sink');
 at([.52,.1,.36],[1.45,.94,-hd+.34],0x3a4048,'Table gas stove (konro)');
 const kettle=new THREE.Mesh(new THREE.SphereGeometry(.11,14,10),new THREE.MeshStandardMaterial({color:0xc8322a,roughness:.3,metalness:.3}));kettle.scale.set(1,.8,1);kettle.position.set(X(1.38),1.07,-hd+.34);kettle.name='Red kettle';kettle.castShadow=true;group.add(kettle);
 block(1.05,-hd+.34,1.6,.6,.95);
 at([.32,.95,.7],[PARTITION_X+.2,.475,hd-.4],0x5c3a21,'Shoe cabinet (getabako)');block(PARTITION_X+.2,hd-.4,.32,.7,.95);
 for(const dz of [-.08,.08])at([.12,.08,.27],[doorX-.18+dz,.04,hd-.35],0xd8352d,'Sneakers');
 const hatHook={position:[X(1.45),1.6,hd-.05],yaw:Math.PI};addHatPeg((size,pos,c)=>box(size,pos,c),hatHook);

 // ------------------------------------------------------------ the tatami room
 const ROOM=(u,vv)=>[ROOM_X0+u,-hd+.04+vv];
 // Kotatsu: a 0.75 m table frame, its quilt in the cool months, the lacquered top over it.
 const [kx,kz]=[-1.0,-.75],kot=piece(kx,kz,0,'Kotatsu');
 for(const [lx,lz] of [[-.33,-.33],[.33,-.33],[-.33,.33],[.33,.33]])part(kot,[.05,.36,.05],[lx,.18,lz],0x3e2412,'Kotatsu leg');
 // The quilt: plain madder red with a fine asanoha (hemp-leaf) print, as a kotatsu-buton was.
 const quiltTex=paint(128,128,(ctx,w,h)=>{ctx.fillStyle='#9a2e25';ctx.fillRect(0,0,w,h);ctx.strokeStyle='rgba(232,170,120,.35)';ctx.lineWidth=1.2;for(let x=0;x<=w;x+=16)for(let y=0;y<=h;y+=16){ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.moveTo(x,y-8);ctx.lineTo(x,y+8);ctx.moveTo(x-6,y-6);ctx.lineTo(x+6,y+6);ctx.moveTo(x+6,y-6);ctx.lineTo(x-6,y+6);ctx.stroke();}});
 const quilt=part(kot,[.94,.34,.94],[0,.19,0],new THREE.MeshStandardMaterial({map:quiltTex,color:quiltTex?0xffffff:0x8c2a22,roughness:.9}),'Kotatsu quilt');
 const skirt=part(kot,[1.02,.06,1.02],[0,.03,0],quilt.material,'Kotatsu quilt hem');
 part(kot,[.8,.035,.8],[0,.38,0],new THREE.MeshStandardMaterial({color:0x4a2511,roughness:.25}),'Kotatsu top');
 const heater=new THREE.PointLight(0xff5a1f,0,1.6,2);heater.position.set(0,.22,0);kot.add(heater);
 const bowl=part(kot,[.24,.05,.24],[-.2,.42,-.12],0x22303c,'Mikan bowl');void bowl;
 for(const [mx,mz] of [[-.24,-.15],[-.16,-.1],[-.21,-.06]]){const m=new THREE.Mesh(new THREE.SphereGeometry(.04,10,8),mat(0xf28a1a));m.scale.set(1,.8,1);m.position.set(mx,.47,mz);m.name='Mikan';kot.add(m);}
 const pot=new THREE.Mesh(new THREE.SphereGeometry(.075,12,10),mat(0x4d6b53));pot.scale.set(1,.8,1);pot.position.set(.2,.45,.12);pot.name='Teapot (kyūsu)';kot.add(pot);
 for(const [cx,cz] of [[.08,.26],[.28,-.06]]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.033,.028,.065,10),mat(0xe8e4dc));c.position.set(cx,.43,cz);c.name='Teacup';kot.add(c);}
 for(const [i,col] of [0xe8b13a,0x3c86c4,0xd94a5a].entries()){const b=part(kot,[.2,.022,.27],[-.24,.41+i*.023,.24],col,'Radio and manga magazines');b.rotation.y=.18*i-.1;}
 block(kx,kz,1.0,1.0,.42);
 // His zaisu on its zabuton, facing the set; the spare zabuton on the bookshelf's foot.
 const zaisu=piece(kx,.06,0,'Zaisu (legless chair)');
 part(zaisu,[.56,.07,.56],[0,.035,0],0x2c4c3e,'Zabuton');part(zaisu,[.52,.45,.05],[0,.27,.26],0x3e2412,'Zaisu back').rotation.x=.2;part(zaisu,[.44,.36,.03],[0,.27,.23],0x2c4c3e,'Zaisu pad').rotation.x=.2;
 // The set in the north-west corner, turned to the zaisu: a low cabinet with the video deck, the 21-inch tube.
 const [tvx,tvz]=[-2.2,-1.22],tvYaw=Math.atan2(kx-tvx,.06-tvz),tv=piece(tvx,tvz,tvYaw,'Television, Johansson Denki Kirara 21');
 part(tv,[.86,.42,.42],[0,.21,0],0x4a2f1d,'TV cabinet');part(tv,[.5,.09,.34],[-.12,.2,.05],0x232a33,'Video deck');
 part(tv,[.62,.5,.4],[0,.68,.02],0x2a2a2c,'Television body');part(tv,[.44,.36,.24],[0,.66,-.27],0x2a2a2c,'Picture tube housing');
 const tvCanvas=typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:128,height:96}):null;
 const tvTex=tvCanvas?new THREE.CanvasTexture(tvCanvas):null;if(tvTex){tvTex.magFilter=THREE.NearestFilter;tvTex.colorSpace=THREE.SRGBColorSpace;}
 const screenMat=new THREE.MeshBasicMaterial({map:tvTex,color:0x10161c,toneMapped:false});
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(.5,.38),screenMat);screen.position.set(0,.69,.225);screen.name='Television screen';tv.add(screen);
 const tvGlow=new THREE.PointLight(0x7fc4ff,0,3.2,2);tvGlow.position.set(0,.7,.7);tv.add(tvGlow);
 const console16=piece(-1.55,-1.12,tvYaw,'Johansson Super Comet 16 console');
 part(console16,[.26,.07,.2],[0,.035,0],0xc9c9cf,'Console');part(console16,[.13,.05,.05],[0,.09,-.03],0x6b6b74,'Game cartridge');
 for(const [i,cx] of [-.2,.2].entries()){const p=part(console16,[.13,.022,.06],[cx,.011,.22+i*.04],0xc9c9cf,'Controller');p.rotation.y=i?-.25:.3;}
 block(tvx,tvz,.8,.6,1.0);
 // Bookshelf against the sliding-door wall, facing into the room: manga up top, repair manuals and his cassettes below.
 const shelf=piece(PARTITION_X-.2,-.75,-Math.PI/2,'Bookshelf');
 part(shelf,[.8,1.8,.3],[0,.9,0],0x6b4423,'Bookshelf');
 const spines=[0xd25656,0x4f8bd0,0xe8c046,0x52a86a,0xd876a8,0x8f7ad0,0xe88c3c];
 for(let r=0;r<4;r++)for(let b=0;b<12;b++){const manual=r>=2,h=manual?.27:.2+((b*7+r*3)%4)*.012;
  part(shelf,[.055,h,.2],[-.33+b*.06,.12+r*.43+h/2,.02],manual?(r===3?0x2e3a46:[0xe9e3d0,0xc8b48a][b%2]):spines[(b+r*3)%spines.length],manual?(r===3?'Cassette tapes':'Repair manuals'):'Manga');}
 part(shelf,[.56,.08,.56],[.05,1.84,.0],0x2c4c3e,'Spare zabuton');
 block(PARTITION_X-.2,-.75,.32,.82,1.8);
 // The desk under the front window: his machine, where he keeps the workshop's repair book; the radio-cassette.
 const [dx0,dx1]=[-1.6,-.6],dzc=hd-.32,desk=piece((dx0+dx1)/2,dzc,Math.PI,'Desk');
 part(desk,[1.0,.04,.56],[0,.72,0],0x6b4423,'Desk top');part(desk,[.04,.7,.54],[-.48,.35,0],0x6b4423);part(desk,[.36,.7,.54],[.3,.35,0],0x6b4423,'Desk drawers');
 part(desk,[.4,.12,.38],[.02,.8,-.04],0xe7e5dc,'Computer, Johansson Denki J-Station 486');part(desk,[.36,.33,.34],[.02,1.03,-.06],0xe7e5dc,'Monitor');
 const pcCanvas=typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:128,height:96}):null;
 const pcTex=pcCanvas?new THREE.CanvasTexture(pcCanvas):null;if(pcTex)pcTex.colorSpace=THREE.SRGBColorSpace;
 const pcScreen=new THREE.Mesh(new THREE.PlaneGeometry(.29,.22),new THREE.MeshBasicMaterial({map:pcTex,color:pcTex?0xffffff:0x0b2a52,toneMapped:false}));pcScreen.position.set(.02,1.04,.115);pcScreen.name='Monitor screen';desk.add(pcScreen);
 part(desk,[.42,.025,.15],[.02,.75,.2],0xe7e5dc,'Keyboard').rotation.x=.06;
 part(desk,[.34,.15,.12],[-.35,.81,-.12],0x22293a,'Radio-cassette (Johansson Denki CFS-9)');
 part(desk,[.08,.03,.08],[.42,.75,-.15],0x0f766e,'Desk lamp base');const arm=part(desk,[.02,.4,.02],[.42,.95,-.15],0x94a3b8,'Desk lamp arm');arm.rotation.z=.25;part(desk,[.24,.04,.1],[.34,1.14,-.1],0x0f766e,'Desk lamp head');
 const deskLamp=new THREE.PointLight(0xfff0b0,0,2.2,2);deskLamp.position.set(.32,1.08,-.08);desk.add(deskLamp);
 block((dx0+dx1)/2,dzc,1.0,.56,.76);
 const chair=piece(-1.1,hd-.95,Math.PI,'Swivel chair');
 part(chair,[.46,.06,.46],[0,.46,0],0x1e3a8a,'Chair seat');part(chair,[.42,.4,.05],[0,.72,-.22],0x1e3a8a,'Chair back');part(chair,[.05,.42,.05],[0,.22,0],0x334155);part(chair,[.5,.03,.5],[0,.02,0],0x334155,'Chair base');
 part(chair,[.9,.004,.9],[0,.002,0],0xc8c2b0,'Chair mat (it saves the tatami)');
 // The fan by the window; the air conditioner high on the end wall; the poster and the calendar.
 const fan=piece(-.4,-hd+.3,Math.PI*.85,'Standing fan, Johansson Denki');
 part(fan,[.32,.05,.32],[0,.025,0],0xeef2f4);part(fan,[.05,.62,.05],[0,.34,0],0xeef2f4);part(fan,[.16,.16,.18],[0,.68,-.02],0xeef2f4,'Fan motor');
 const blades=new THREE.Group();blades.position.set(0,.68,.1);fan.add(blades);
 for(let i=0;i<3;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.1,.22,.008),new THREE.MeshStandardMaterial({color:0x3fa7dc,transparent:true,opacity:.8,roughness:.2}));b.rotation.z=i*Math.PI*2/3;b.position.set(Math.cos(i*2.094+1.571)*.09,Math.sin(i*2.094+1.571)*.09,0);blades.add(b);}
 const cage=new THREE.Mesh(new THREE.TorusGeometry(.2,.01,6,24),mat(0xcbd5e1));cage.position.set(0,.68,.11);fan.add(cage);
 block(-.4,-hd+.3,.34,.34,1.0);
 const ac=at([.3,.28,.82],[ROOM_X0+.15,2.18,-.55],0xe7e5dc,'Air conditioner, Johansson Denki Sea Breeze');ac.castShadow=false;
 const acLed=at([.01,.025,.05],[ROOM_X0+.305,2.1,-.25],new THREE.MeshBasicMaterial({color:0x22c55e}),'Air conditioner lamp');
 const poster=paint(256,360,(ctx,w,h)=>{const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#0f172a');g.addColorStop(.6,'#4c1d95');g.addColorStop(1,'#be185d');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#f59e0b';ctx.beginPath();ctx.arc(128,175,65,0,Math.PI*2);ctx.fill();ctx.fillStyle='#090d16';[60,95,130,80,150,110,75,120,85].forEach((hh,i)=>ctx.fillRect(i*28,280-hh,26,hh+80));
  ctx.fillStyle='#fff';ctx.font='bold 34px sans-serif';ctx.fillText('NEO TOKYO',28,52);ctx.fillStyle='#38bdf8';ctx.font='bold 20px sans-serif';ctx.fillText('1994 SPECIAL OVA',38,80);});
 const posterMesh=new THREE.Mesh(new THREE.PlaneGeometry(.5,.7),new THREE.MeshStandardMaterial({map:poster,color:poster?0xffffff:0x4c1d95,roughness:.7}));posterMesh.position.set(X(ROOM_X0+.012),1.45,.35);posterMesh.rotation.y=yaw(Math.PI/2);posterMesh.name='Poster: Neo Tokyo';group.add(posterMesh);
 const calCanvas=typeof document!=='undefined'?Object.assign(document.createElement('canvas'),{width:200,height:280}):null;
 const calTex=calCanvas?new THREE.CanvasTexture(calCanvas):null;if(calTex)calTex.colorSpace=THREE.SRGBColorSpace;
 const calendar=new THREE.Mesh(new THREE.PlaneGeometry(.3,.42),new THREE.MeshStandardMaterial({map:calTex,color:calTex?0xffffff:0xf4f1e8,roughness:.8}));calendar.position.set(X(-1.52),1.5,hd-.05);calendar.rotation.y=Math.PI;calendar.name='Calendar, Minato fishermen’s co-op';group.add(calendar);
 let calendarMonth=-1;
 function drawCalendar(date){
  if(!calCanvas)return;const ctx=calCanvas.getContext('2d'),w=calCanvas.width,h=calCanvas.height;
  ctx.fillStyle='#f8f6ee';ctx.fillRect(0,0,w,h);const g=ctx.createLinearGradient(0,0,w,110);g.addColorStop(0,'#1aa6c0');g.addColorStop(1,'#e8566a');ctx.fillStyle=g;ctx.fillRect(10,10,w-20,100);
  ctx.fillStyle='#fff';ctx.font='bold 18px sans-serif';ctx.textAlign='center';ctx.fillText('港町漁協',w/2,66);
  ctx.fillStyle='#1e293b';ctx.font='bold 22px sans-serif';ctx.fillText(date.getFullYear()+'年 '+(date.getMonth()+1)+'月',w/2,140);
  const first=new Date(date.getFullYear(),date.getMonth(),1).getDay(),days=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
  ctx.font='12px sans-serif';for(let d=1;d<=days;d++){const k=first+d-1,c=k%7,r=Math.floor(k/7);ctx.fillStyle=c===0?'#d0312d':c===6?'#2f6fd0':'#334155';ctx.fillText(String(d),24+c*25.5,170+r*21);}
  calTex.needsUpdate=true;
 }
 // The futon: rolled against the end wall by day, laid along it at night.
 const routine=createFutonRoutine(profile),futonX=ROOM_X0+.52,futonZ=.2;
 const laid=new THREE.Group();laid.name='Tetsuo’s futon, laid out';laid.position.set(X(futonX),0,futonZ-1.05);group.add(laid);
 const lp=(size,pos,c,name)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(...size),mat(c));m.position.set(...pos);m.name=name;m.receiveShadow=true;laid.add(m);return m;};
 lp([1.0,.1,2.1],[0,.05,1.05],0xe9dfc8,'Mattress');lp([.92,.05,1.3],[0,.125,1.3],0x807398,'Quilt');lp([.6,.1,.36],[0,.15,.3],0xf3e8d2,'Pillow');
 const rolled=new THREE.Mesh(new THREE.CylinderGeometry(.24,.24,.98,16),mat(0xf3e6c4));rolled.rotation.x=Math.PI/2;rolled.position.set(X(futonX),.24,1.05);rolled.name='Tetsuo’s futon, rolled';rolled.castShadow=true;group.add(rolled);
 // The ceiling: a square washitsu pendant over the kotatsu, with its pull cord; a tube over the sink.
 const shade=new THREE.MeshStandardMaterial({color:0xfffbeb,emissive:0xfde68a,emissiveIntensity:0,roughness:.8});
 // Over the kotatsu, where people sit rather than walk, so the cord is never in anyone's way.
 const pendant=piece(kx,kz,0,'Pendant lamp');part(pendant,[.012,.3,.012],[0,H-.15,0],0x1e293b);part(pendant,[.55,.18,.55],[0,H-.39,0],shade,'Pendant shade');part(pendant,[.6,.04,.6],[0,H-.49,0],0x5c3a21,'Pendant frame');part(pendant,[.006,.5,.006],[.18,H-.75,.18],0xd4d4d8,'Pull cord');
 const lamp=new THREE.PointLight(0xffe8c8,0,7,2);lamp.position.set(X(kx),H-.6,kz);lamp.castShadow=false;group.add(lamp);
 at([.9,.05,.12],[1.05,H-.04,-hd+.5],new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xf5f2e0,emissiveIntensity:.6}),'Kitchen tube light');
 group.add(new THREE.HemisphereLight(0xfff0d8,0x7a6a54,.85));
 const kitchenLight=new THREE.PointLight(0xfdf2d0,.45,4.5,2);kitchenLight.position.set(X(1.05),H-.3,-hd+.6);group.add(kitchenLight);
 const daylight=new THREE.PointLight(0xcfe6ff,0,4,2);daylight.position.set(X(wmid),1.4,backZ+.35);group.add(daylight);

 // ------------------------------------------------------------ what can be done here
 const state={light:null,tv:null,fan:null,shojiOpen:false};
 const hours=sleepHours(profile),fmt=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
 anchor([kx+.18,1.3,kz+.18],'Pull the light cord',()=>{state.light=!lightOn();});
 anchor([tvx+.45,.8,tvz+.35],'Switch the television on or off',()=>{state.tv=!tvOn();});
 anchor([-.4,.9,-hd+.65],'Switch the fan on or off',()=>{state.fan=!fanOn();});
 anchor([wmid,1.3,backZ+.4],'Slide the shoji',()=>{state.shojiOpen=!state.shojiOpen;});
 anchor([-1.1,1.1,hd-.75],'Look at the computer',()=>action('inspect','Johansson Denki J-Station 486','Tetsuo keeps the workshop’s repair book on it: who brought what in, what was wrong, what it cost. Chin writes his on the back of envelopes, which is why the computer exists.'));
 anchor([-1.55,.4,-.85],'Look at the game console',()=>action('inspect','Johansson Super Comet 16','A 16-bit console with a racing game in it. Two controllers: one for him, one for Chin on Fridays, who has never once won.'));
 anchor([PARTITION_X-.55,1.1,-.75],'Look at the bookshelf',()=>action('inspect','Tetsuo’s shelf','Manga up top, a run of service manuals for every radio Johansson Denki made since 1970 below, and a whole shelf of cassettes, mostly city pop, labelled in his small square hand.'));
 anchor([kx,.7,kz+.6],'Look at the kotatsu',()=>action('inspect','The kotatsu','The table he brought back from his Tokyo flat. In Minato it wears its quilt only in the cool months; the rest of the year it is a low table with a bowl of mikan on it.'));
 anchor([-1.52,1.3,hd-.35],'Read the calendar',()=>action('read','The fishermen’s co-op calendar','A free calendar from the Minato fishermen’s co-op. Two dates ringed: the day his mother’s gas cylinder is due on Kitano-jima, and the boiler service at Umi-no-yu.'));
 anchor([ROOM_X0+.45,1.4,.35],'Look at the poster',()=>action('inspect','Neo Tokyo','A poster from a video shop near the Tokyo flat, for an anime he taped off the satellite channel in 1994. It has followed him to every wall since.'));
 anchor([2.35,1.1,-hd+.75],'Look in the fridge',()=>action('inspect','Tetsuo’s fridge','Barley tea, two eggs, a tray of Mrs Sato’s leftover chashu, and the onsen’s spare fuses, which he keeps cold “so they don’t get ideas”.'));
 anchor([-1.45,1.0,hd-.4],'Look at the radio-cassette',()=>action('inspect','The radio-cassette','A Johansson Denki CFS-9 he has taken apart and put back together so often that it now plays better than new. A city-pop tape is in it.'));
 anchor([futonX+.6,.6,.6],'Read daily routine',()=>action('read','Tetsuo at home','Up late, by island standards: sleeps at '+fmt(hours.sleep)+', wakes at '+fmt(hours.wake)+'. The workshop until six, then the set, the console or the repair book until late.'));
 anchor([2.35,1.1,-hd+.75],'Inspect Tetsuo’s belongings',()=>action('inspect','Tetsuo at home',(profile.role||'Radio repairer')+'. '+(profile.personality||'')+'. The room he kept in Tokyo, put back together in a yard in Minato.'));

 // ------------------------------------------------------------ his routine in it
 const zc=futonZ,layout={
  bounds:{minX:-hw+.05,maxX:hw-.05,minZ:-hd+.05,maxZ:hd-.05},spawn:[X(doorX),0,hd-.5],exit:[X(doorX),1.1,hd-.04],door:[X(doorX),0,hd-.45],
  bed:[X(futonX),.28,zc+.75],bedside:[X(futonX+.75),0,zc+.55],cover:{position:[X(futonX),.36,zc+.15],width:.9,length:1.3,axis:'z'},
  table:[X(kx),0,.06],tableStand:[X(kx-.05),0,.5],tableSeatHeight:.11,tableSeatFront:.28,tableSeatYaw:0,hatHook,
 };
 let elapsed=0,lastMinutes=0,bedding={amount:0,phase:'stored'},workRequired=false,workStage=null,workAge=0,observedNeed=null,screenClock=0;
 const awake=m=>!['sleep','wake','bedtime'].includes(homeRoutine(profile,m).id);
 const dark=m=>{const h=((m%1440)+1440)%1440/60;return h<6.5||h>18.3;};
 const cool=m=>[0,1,2,10,11].includes(townCalendarAt(m).date.getMonth());
 const lightOn=()=>state.light??(dark(lastMinutes)&&awake(lastMinutes));
 const tvOn=()=>state.tv??(awake(lastMinutes)&&(((lastMinutes%1440)+1440)%1440>=1260||((lastMinutes%1440)+1440)%1440<120));
 const fanOn=()=>state.fan??(!cool(lastMinutes)&&awake(lastMinutes));
 function drawTV(t){
  if(!tvCanvas)return;const ctx=tvCanvas.getContext('2d');
  ctx.fillStyle='#1e1b4b';ctx.fillRect(0,0,128,48);ctx.fillStyle='#f43f5e';ctx.beginPath();ctx.arc(64,44,18,Math.PI,0);ctx.fill();
  ctx.fillStyle='#0f172a';ctx.fillRect(0,48,128,48);const off=Math.floor(t*12)%8;
  for(let y=48;y<96;y+=6){const rw=(y-44)*2.2;ctx.fillStyle=((y+off)%12<6)?'#334155':'#475569';ctx.fillRect(64-rw/2,y,rw,5);}
  const cx=54+Math.sin(t*2.5)*14;ctx.fillStyle='#ef4444';ctx.fillRect(cx,76,20,9);ctx.fillStyle='#fde047';ctx.fillRect(cx+2,78,4,3);ctx.fillRect(cx+14,78,4,3);
  ctx.fillStyle='#4ade80';ctx.font='10px monospace';ctx.fillText('1P 049200',8,14);tvTex.needsUpdate=true;
 }
 function drawPC(t){
  if(!pcCanvas)return;const ctx=pcCanvas.getContext('2d');
  ctx.fillStyle='#001b44';ctx.fillRect(0,0,128,96);ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;ctx.strokeRect(4,4,120,88);
  ctx.fillStyle='#f8fafc';ctx.font='9px monospace';ctx.fillText('J-STATION 486',12,18);ctx.fillStyle='#fde047';ctx.fillText('A>EDIT REPAIRS.TXT',12,32);
  ctx.fillStyle='#cbd5e1';for(const [i,l] of ['GANAHA  RADIO  1800','OSHIRO  SONAR  4500','HIGA    BOILER  ---'].entries())ctx.fillText(l,12,46+i*11);
  if(Math.floor(t*2)%2===0){ctx.fillStyle='#4ade80';ctx.fillRect(12,80,7,9);}pcTex.needsUpdate=true;
 }
 function apply(dt){
  const cold=cool(lastMinutes),on=tvOn();
  laid.visible=bedding.amount>.001;laid.scale.set(1,1,Math.max(.03,bedding.amount));rolled.visible=bedding.amount<.05;
  quilt.visible=skirt.visible=cold;heater.intensity=cold&&awake(lastMinutes)&&dark(lastMinutes)?.9:0;
  const light=lightOn();lamp.intensity=light?1.2:0;shade.emissiveIntensity=light?.8:.04;
  deskLamp.intensity=light&&awake(lastMinutes)?.5:0;
  tvGlow.intensity=on?.9:0;screenMat.color.setHex(on?0xffffff:0x10161c);
  if(fanOn())blades.rotation.z-=Math.min(.1,dt)*14;
  acLed.visible=!cold;
  for(const s of shoji){const target=state.shojiOpen?s.open:s.closed;s.g.position.x+=(target-s.g.position.x)*Math.min(1,dt*6);}
  const hour=((lastMinutes%1440)+1440)%1440/60,day=hour>6&&hour<18.5?Math.min(1,Math.min(hour-6,18.5-hour)/1.2):0;
  viewMat.color.setRGB(.18+.82*day,.2+.8*day,.3+.7*day);daylight.intensity=day*(state.shojiOpen?.9:.45);
  screenClock+=dt;if(screenClock>=1/12||dt===0){if(on)drawTV(elapsed);drawPC(elapsed);screenClock=0;}
 }
 return {...layout,home:true,homeLayouts:{[profile.name]:layout},
  tick(dt,minutes){
   elapsed+=dt;lastMinutes=minutes;
   const month=townCalendarAt(minutes).date;if(month.getMonth()!==calendarMonth){calendarMonth=month.getMonth();drawCalendar(month);}
   const needed=['bedtime','sleep','wake'].includes(homeRoutine(profile,minutes).id);
   if(observedNeed!==null&&needed!==observedNeed){workRequired=true;workStage='walk';workAge=0;}observedNeed=needed;
   bedding=routine.update(workRequired&&workStage==='walk'?0:dt,minutes);apply(dt);
  },
  /** He lays the futon out himself, and rolls it away in the morning (home-residents.js). */
  prepareBedding(person,walker,dt){
   if(!workRequired)return false;const g=person.g;
   g.userData.activity=bedding.needed?'laying out the futon':'rolling the futon away';
   if(workStage==='walk'){if(!walker.move(person,layout.bedside,dt))return true;workStage='arrange';}
   g.rotation.set(0,s>0?-Math.PI/2:Math.PI/2,0);g.userData.socialPose='Interact';workAge+=dt;if(workAge>=1.8){workRequired=false;workStage=null;}return true;
  },
  /** For the tools and the comics: set what the room's switches are (null leaves one to the clock). */
  set({light,tv,fan,shojiOpen}={}){if(light!==undefined)state.light=light;if(tv!==undefined)state.tv=tv;if(fan!==undefined)state.fan=fan;if(shojiOpen!==undefined)state.shojiOpen=!!shojiOpen;},
  snapshot(){return {owner:profile.name,futon:bedding.phase,tv:tvOn(),light:lightOn(),fan:fanOn(),shojiOpen:state.shojiOpen,kotatsuQuilt:cool(lastMinutes)};},
 };
}
