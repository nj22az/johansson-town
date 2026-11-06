import * as THREE from '../../../vendor/three.module.js';

/**
 * Sakura's customer restroom, dressed as a 1990s Okinawan konbini 便所.
 *
 * The model supplies the shell, a plain toilet against the west wall and a pedestal
 * basin with a mirror on the south wall, all in bare grey and white. Around them:
 * mint wall tiles to shoulder height, a grey mosaic floor with a drain, a 花ブロック
 * breeze-block vent high over the toilet with daylight coming through, a wall fan,
 * the hand-wash spout on the cistern lid and its flush lever, a paper holder with a
 * spare roll, a glass shelf with a pink soap pump under the mirror, the green soap
 * globe, a blue towel, a fluorescent mirror light, blue vinyl toilet slippers, a
 * little terracotta シーサー on a corner shelf, and the notices: the cleaning sheet
 * with Thuan's hanko on every round, "paper only" and the hand-washing card.
 *
 * Positions are measured off the model, in the shop's frame (sakura-layout.js): the
 * room is x -6.82..-4.09, z -3.95..-2.58, its doorway on the east side around z -3.2.
 * The doorway is open: you can walk in, flush, wash your hands and read the sheet. The
 * toilet and basin have colliders in sakura-layout.js; the slippers are walked over.
 */
export const RESTROOM=Object.freeze({
 minX:-6.82,maxX:-4.09,minZ:-3.95,maxZ:-2.58,
 mirror:Object.freeze({x:-5.175,y:1.61,z:-3.871,w:.55,h:.62}),
 doorway:Object.freeze({x:-4.09,z:-3.2}),
});

const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';
const canvasTex=(w,h,draw,repeat)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;if(repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(...repeat);}return t;};
const say=(ctx,s,x,y,size,colour,align='center',weight='bold')=>{ctx.fillStyle=colour;ctx.font=`${weight} ${size}px ${MARU}`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);};
const std=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.6,...extra});
const hash=(i,s=0)=>{const n=Math.sin(i*127.1+s*311.7)*43758.5453;return n-Math.floor(n);};
const TILE_TOP=1.35;

function kit(parent){
 const group=new THREE.Group();group.name='Sakura restroom';parent.add(group);
 const mesh=(geometry,material,x,y,z,label='Sakura restroom')=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=label;group.add(m);return m;};
 const box=(w,h,d,x,y,z,material,label)=>mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z,label);
 // A flat print on a wall; yaw turns its face (+z) to look into the room.
 const plane=(material,w,h,x,y,z,yaw,label)=>{const m=mesh(new THREE.PlaneGeometry(w,h),material,x,y,z,label);m.rotation.y=yaw;return m;};
 return {group,mesh,box,plane};
}

// ======================================================================= tiles
function tiles(k){
 const R=RESTROOM;
 const wall=canvasTex(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#8fa89c';ctx.fillRect(0,0,w,h);
  const s=64;for(let y=0;y<h;y+=s)for(let x=0;x<w;x+=s){const r=hash(x+y*7,2);
   ctx.fillStyle=r>.7?'#c4dccf':r<.3?'#b4cdc0':'#bcd4c8';ctx.fillRect(x+2,y+2,s-4,s-4);
   ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x+2,y+2,s-4,3);ctx.fillRect(x+2,y+2,3,s-4);}
 },[1,1]);
 const tileMat=repeatX=>{const t=wall.clone();t.needsUpdate=true;t.repeat.set(repeatX/.3,TILE_TOP/.3);return new THREE.MeshStandardMaterial({map:t,roughness:.35,polygonOffset:true,polygonOffsetFactor:-1});};
 const w=R.maxX-R.minX,d=R.maxZ-R.minZ,cx=(R.minX+R.maxX)/2,cz=(R.minZ+R.maxZ)/2,y=TILE_TOP/2;
 k.plane(tileMat(d),d,TILE_TOP,R.minX+.006,y,cz,Math.PI/2,'Restroom wall tiles');
 k.plane(tileMat(w),w,TILE_TOP,cx,y,R.maxZ-.006,Math.PI,'Restroom wall tiles');
 k.plane(tileMat(w),w,TILE_TOP,cx,y,R.minZ+.006,0,'Restroom wall tiles');
 // The east wall is mostly doorway: tile the two jambs either side of it.
 for(const [z0,z1] of [[R.minZ,-3.7],[-2.76,R.maxZ]])k.plane(tileMat(z1-z0),z1-z0,TILE_TOP,R.maxX-.006,y,(z0+z1)/2,-Math.PI/2,'Restroom wall tiles');
 // A bullnose cap along the top course.
 const cap=std(0x7f998c,{roughness:.3});
 k.box(.02,.03,d,R.minX+.01,TILE_TOP,cz,cap);k.box(w,.03,.02,cx,TILE_TOP,R.maxZ-.01,cap);k.box(w,.03,.02,cx,TILE_TOP,R.minZ+.01,cap);
 // Grey mosaic floor, a little darker round the drain, laid flush: the shop's terrazzo is cut round it (sakura-shell.js).
 const floor=canvasTex(256,256,(ctx,W,H)=>{
  ctx.fillStyle='#4a524f';ctx.fillRect(0,0,W,H);
  const s=16;for(let y=0;y<H;y+=s)for(let x=0;x<W;x+=s){const c=118+Math.floor(hash(x*3+y,5)*26);ctx.fillStyle=`rgb(${c-4},${c+4},${c})`;ctx.fillRect(x+1,y+1,s-2,s-2);}
 },[w/.5,d/.5]);
 const f=k.plane(new THREE.MeshStandardMaterial({map:floor,roughness:.5}),w,d,cx,0,cz,0,'Restroom mosaic floor');f.rotation.x=-Math.PI/2;
 const drain=k.mesh(new THREE.CylinderGeometry(.07,.07,.006,20),std(0x9aa3a8,{metalness:.6,roughness:.3}),-5.6,.006,-3.0,'Restroom floor drain');
 for(let i=-2;i<=2;i++)k.box(.11,.008,.008,drain.position.x,.008,drain.position.z+i*.022,std(0x2a2e30));
}

// ======================================================= vent, fan and light
function ventilation(k){
 const R=RESTROOM;
 // 花ブロック: concrete breeze blocks with the light coming through the holes.
 const block=canvasTex(256,256,(ctx,w,h)=>{
  ctx.fillStyle='#c8cec6';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#8c948c';ctx.lineWidth=6;ctx.strokeRect(3,3,w-6,h-6);
  ctx.globalCompositeOperation='destination-out';
  for(const [x,y] of [[64,64],[192,64],[64,192],[192,192]]){ctx.beginPath();ctx.arc(x,y,40,0,Math.PI*2);ctx.fill();}
  ctx.beginPath();ctx.moveTo(128,96);ctx.lineTo(160,128);ctx.lineTo(128,160);ctx.lineTo(96,128);ctx.closePath();ctx.fill();
 },[3,1]);
 const glow=k.plane(new THREE.MeshBasicMaterial({color:0xd8f2dc,toneMapped:false}),.88,.28,R.minX+.008,2.2,-3.27,Math.PI/2,'Restroom vent daylight');void glow;
 k.plane(new THREE.MeshStandardMaterial({map:block,transparent:true,alphaTest:.5,roughness:.9,side:THREE.DoubleSide}),.9,.3,R.minX+.03,2.2,-3.27,Math.PI/2,'Restroom hana-block vent');
 k.box(.06,.025,.96,R.minX+.03,2.04,-3.27,std(0xb9bfb7));
 // Wall fan high on the north wall, over the door side, with its pull cord.
 const fan=new THREE.Group();fan.position.set(-4.62,2.25,R.maxZ-.035);fan.rotation.y=Math.PI;fan.name='Restroom wall fan';k.group.add(fan);
 const frame=new THREE.Mesh(new THREE.BoxGeometry(.3,.3,.06),std(0xd6cebe));fan.add(frame);
 const grille=new THREE.Mesh(new THREE.TorusGeometry(.11,.006,6,24),std(0x9a9588));grille.position.z=.035;fan.add(grille);
 const blades=new THREE.Group();blades.position.z=.03;fan.add(blades);
 for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(.04,.1,.005),std(0x3b4652));b.rotation.z=i*Math.PI/2;b.position.set(-.05*Math.sin(i*Math.PI/2),.05*Math.cos(i*Math.PI/2),0);blades.add(b);}
 const cord=new THREE.Mesh(new THREE.CylinderGeometry(.002,.002,.5,5),std(0xf2f0ea));cord.position.set(.12,-.38,.03);fan.add(cord);
 const pull=new THREE.Mesh(new THREE.SphereGeometry(.014,8,6),std(0xd7263d));pull.position.set(.12,-.64,.03);fan.add(pull);
 // Fluorescent bar over the mirror.
 const M=RESTROOM.mirror;
 k.box(.5,.05,.07,M.x,M.y+.43,R.minZ+.035,std(0xe2ddd0),'Mirror light');
 k.mesh(new THREE.CylinderGeometry(.012,.012,.44,10),new THREE.MeshStandardMaterial({color:0xfffbe6,emissive:0xfff3c9,emissiveIntensity:1}),M.x,M.y+.40,R.minZ+.07,'Mirror light tube').rotation.z=Math.PI/2;
 return blades;
}

// ======================================================================= toilet
function toiletFittings(k){
 const chrome=std(0xc6ccd2,{metalness:.8,roughness:.25});
 // The hand-wash basin on the cistern lid and the swan-neck spout over it.
 k.mesh(new THREE.CylinderGeometry(.075,.06,.012,20),std(0xd9d5ca),-6.68,.937,-3.26,'Cistern hand-wash basin').scale.z=1.2;
 const spout=new THREE.CatmullRomCurve3([new THREE.Vector3(-6.78,.93,-3.26),new THREE.Vector3(-6.78,1.04,-3.26),new THREE.Vector3(-6.73,1.07,-3.26),new THREE.Vector3(-6.68,1.0,-3.26)]);
 k.mesh(new THREE.TubeGeometry(spout,16,.009,8,false),chrome,0,0,0,'Cistern spout');
 // Flush lever on the cistern's front corner.
 k.mesh(new THREE.CylinderGeometry(.018,.018,.012,12),chrome,-6.59,.84,-3.04,'Flush lever').rotation.z=Math.PI/2;
 const arm=k.box(.012,.012,.07,-6.575,.84,-3.0,chrome,'Flush lever');arm.rotation.x=.25;
 // Paper holder on the north wall beside the toilet, with the spare roll on top.
 const Z=RESTROOM.maxZ-.06;
 k.box(.16,.012,.12,-6.15,.78,Z,chrome,'Paper holder');
 k.mesh(new THREE.CylinderGeometry(.055,.055,.11,16),std(0xfaf8f2,{roughness:.95}),-6.15,.72,Z,'Paper roll').rotation.z=Math.PI/2;
 k.mesh(new THREE.CylinderGeometry(.052,.052,.11,16),std(0xbfe6c4,{roughness:.95}),-6.15,.84,Z+.005,'Spare paper roll').rotation.z=Math.PI/2;
 // Blue vinyl slippers inside the door, toes to the room.
 const blue=std(0x2c5fc8,{roughness:.45});
 for(const s of [-1,1]){
  const g=new THREE.Group();g.position.set(-4.42,0,-3.2+s*.07);g.rotation.y=Math.PI/2+s*.06;g.name='Toilet slipper';k.group.add(g);
  const sole=new THREE.Mesh(new THREE.BoxGeometry(.09,.02,.25),blue);sole.position.y=.01;g.add(sole);
  const band=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.1,12,1,true,-Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({color:0x2c5fc8,roughness:.45,side:THREE.DoubleSide}));
  band.rotation.x=Math.PI/2;band.position.set(0,.02,.06);g.add(band);
 }
 return {arm};
}

// ============================================================== basin and mirror
function basinFittings(k){
 const R=RESTROOM,M=R.mirror,chrome=std(0xc6ccd2,{metalness:.8,roughness:.25});
 // The mirror reads as glass: cool grey with a soft sheen across it.
 const sheen=canvasTex(128,160,(ctx,w,h)=>{
  const g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,'#c9d4d8');g.addColorStop(1,'#93a2a8');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='rgba(255,255,255,.28)';ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(56,0);ctx.lineTo(-10,h*.7);ctx.lineTo(-10,h*.35);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.16)';ctx.beginPath();ctx.moveTo(78,0);ctx.lineTo(92,0);ctx.lineTo(30,h);ctx.lineTo(16,h);ctx.fill();
 });
 k.plane(new THREE.MeshStandardMaterial({map:sheen,roughness:.08,metalness:.35}),M.w,M.h,M.x,M.y,M.z+.005,0,'Restroom mirror glass');
 // Glass shelf under the mirror: the pink pump, a cup and a toothbrush someone forgot.
 const y=M.y-.37;
 k.box(.5,.01,.09,M.x,y,R.minZ+.06,new THREE.MeshStandardMaterial({color:0xcfe6e4,roughness:.1,transparent:true,opacity:.6}),'Mirror shelf');
 for(const s of [-1,1])k.box(.02,.03,.08,M.x+s*.24,y-.015,R.minZ+.05,chrome);
 k.mesh(new THREE.CylinderGeometry(.03,.034,.1,14),std(0xf06b8a,{roughness:.35}),M.x-.15,y+.055,R.minZ+.06,'Soap pump');
 k.mesh(new THREE.CylinderGeometry(.008,.008,.03,8),std(0xf2ede0),M.x-.15,y+.12,R.minZ+.06);
 k.box(.04,.012,.02,M.x-.135,y+.137,R.minZ+.06,std(0xf2ede0),'Soap pump head');
 const label=canvasTex(64,64,(ctx,w,h)=>{ctx.fillStyle='#f06b8a';ctx.fillRect(0,0,w,h);ctx.fillStyle='#ffffff';ctx.fillRect(6,18,w-12,28);say(ctx,"Hand",w/2,32,14,'#c4566e');});
 k.plane(new THREE.MeshStandardMaterial({map:label,roughness:.4}),.04,.04,M.x-.15,y+.055,R.minZ+.0945,0,'Soap pump label');
 k.mesh(new THREE.CylinderGeometry(.03,.026,.08,14),new THREE.MeshStandardMaterial({color:0xa9d8e6,roughness:.2,transparent:true,opacity:.75}),M.x+.12,y+.045,R.minZ+.06,'Tumbler');
 // The green soap globe on its wall bracket, right of the mirror.
 k.box(.02,.08,.04,-4.7,1.3,R.minZ+.012,chrome,'Soap globe bracket');
 k.box(.016,.016,.08,-4.7,1.31,R.minZ+.05,chrome);
 k.mesh(new THREE.SphereGeometry(.05,16,12),new THREE.MeshStandardMaterial({color:0x27b07a,roughness:.15,transparent:true,opacity:.85}),-4.7,1.31,R.minZ+.1,'Green soap globe');
 k.mesh(new THREE.CylinderGeometry(.007,.007,.03,8),chrome,-4.7,1.245,R.minZ+.1,'Soap globe plunger');
 // A blue towel on a ring, between the toilet and the basin.
 const ring=k.mesh(new THREE.TorusGeometry(.05,.007,8,18),chrome,-5.7,1.2,R.minZ+.03,'Towel ring');void ring;
 k.box(.13,.34,.02,-5.7,1.0,R.minZ+.039,std(0x2f6fd0,{roughness:.95}),'Hand towel');
 k.box(.13,.02,.03,-5.7,1.155,R.minZ+.04,std(0x2a62b8,{roughness:.95}));
}

// ================================================================ notices, shisa
function notices(k){
 const R=RESTROOM;
 const tex=canvasTex(640,512,(ctx,w,h)=>{
  ctx.clearRect(0,0,w,h);
  const tape=(x,y)=>{ctx.fillStyle='rgba(245,214,120,.75)';ctx.fillRect(x-16,y-7,32,14);};
  // お願い, the one every konbini has.
  ctx.fillStyle='#fffdf6';ctx.fillRect(16,16,300,250);ctx.strokeStyle='#2f5fb8';ctx.lineWidth=6;ctx.strokeRect(24,24,284,234);
  say(ctx,"Request to customers",166,64,30,'#1e3a8a');say(ctx,"Anything other than paper",166,118,34,'#c23a32');say(ctx,"Please do not flush",166,160,34,'#c23a32');
  say(ctx,"Always use cleanly",166,206,20,'#333','center','normal');say(ctx,"Thank you",166,232,20,'#333','center','normal');
  tape(30,18);tape(302,18);
  // Cleaning rounds, with Thuan's hanko on every one.
  ctx.fillStyle='#ffffff';ctx.fillRect(340,24,280,300);say(ctx,"Cleaning checklist",480,56,28,'#2b2b2b');
  ctx.strokeStyle='#c9c4b6';ctx.lineWidth=2;
  ['7:00','11:00','14:00','18:00','21:30'].forEach((t,i)=>{const y=100+i*44;ctx.beginPath();ctx.moveTo(352,y+22);ctx.lineTo(608,y+22);ctx.stroke();
   say(ctx,t,360,y,20,'#333','left','normal');say(ctx,"Done",470,y,20,'#333');
   ctx.strokeStyle='#d0312d';ctx.lineWidth=3;ctx.beginPath();ctx.arc(560,y,17,0,Math.PI*2);ctx.stroke();say(ctx,"Thuan",560,y-1,13,'#d0312d');ctx.strokeStyle='#c9c4b6';ctx.lineWidth=2;});
  tape(480,26);
  // The hand-washing card.
  ctx.fillStyle='#ecfaf2';ctx.fillRect(40,300,270,190);ctx.strokeStyle='#2f9a62';ctx.lineWidth=4;ctx.strokeRect(46,306,258,178);
  say(ctx,"Enforce hand washing",175,340,28,'#1f7a4a');
  ["① Lather with soap","② Fingertips and between fingers","③ With running water15Rinse for seconds","④ Wipe with a towel"].forEach((s,i)=>say(ctx,s,66,382+i*26,18,'#245a3e','left','normal'));
  tape(175,300);
  // さんぴん茶, on special at the till.
  ctx.save();ctx.translate(480,420);ctx.rotate(-.05);ctx.fillStyle='#fde68a';ctx.fillRect(-120,-70,240,140);ctx.strokeStyle='#b7791f';ctx.lineWidth=4;ctx.strokeRect(-114,-64,228,128);
  say(ctx,"It's cold",0,-34,22,'#8a5a12');say(ctx,"Jasmine Tea",0,6,36,'#7a4a0c');say(ctx,'¥110',0,46,24,'#c23a32');ctx.restore();
 });
 k.plane(new THREE.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.05,roughness:.9}),.78,.62,-5.0,1.68,R.maxZ-.008,Math.PI,'Restroom notices');
 // A terracotta シーサー on a corner shelf, keeping an eye on the place.
 const S={x:-6.62,y:1.62,z:R.maxZ-.13};
 k.box(.26,.022,.22,S.x,S.y,S.z,std(0x7a4a26),'Shisa shelf');
 const clay=std(0xb0542c,{roughness:.8}),dark=std(0x4a1e10);
 const g=new THREE.Group();g.position.set(S.x,S.y+.011,S.z);g.rotation.y=Math.PI*.8;g.name='Shisa';k.group.add(g);
 const add=(geo,mat,x,y,z)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
 add(new THREE.BoxGeometry(.07,.08,.1),clay,0,.04,0);
 add(new THREE.SphereGeometry(.045,12,10),clay,0,.11,.035);
 for(const s of [-1,1]){add(new THREE.SphereGeometry(.014,8,6),clay,s*.035,.15,.03);add(new THREE.SphereGeometry(.008,6,5),dark,s*.017,.12,.073);}
 add(new THREE.BoxGeometry(.05,.016,.02),dark,0,.09,.075);
 for(let i=0;i<5;i++)add(new THREE.SphereGeometry(.014,6,5),clay,(i-2)*.016,.15+Math.abs(i-2)*-.006,.0);
 add(new THREE.ConeGeometry(.02,.06,6),clay,0,.08,-.06).rotation.x=-.8;
}

export function buildSakuraRestroom(room,{anchor,action}={}){
 const k=kit(room);
 tiles(k);const blades=ventilation(k),{arm}=toiletFittings(k);basinFittings(k);notices(k);
 let now=0,flushedAt=-9;
 if(anchor&&action){
  const D=RESTROOM.doorway;
  anchor([D.x-.25,1.35,D.z],'Look into the restroom',()=>action('inspect',"Toilet · The restroom",
   "Mint tiles, a mosaic floor still damp from the last mop, and the breeze-block vent letting the afternoon in over the cistern. The fan rattles on its cord.\n\nSlip on the blue slippers and go in. The little Shisa on the corner shelf has seen it all."));
  anchor([-6.4,1.0,-3.0],'Flush the toilet',()=>{flushedAt=now;action('inspect',"Toilet · Flush",
   'You press the lever. The cistern roars, then the little spout on its lid runs clean water into the basin on top while the tank fills again: wash your hands on the way out, the way the old cisterns ask you to.');});
  anchor([-5.18,1.15,-3.55],'Wash your hands',()=>action('inspect',"Toilet · Wash your hands",
   'One push of the green soap globe, cold water from the tap, and the blue towel on its ring. The card on the wall says fifteen seconds under running water. You count them.'));
  anchor([-5.0,1.6,-2.75],'Read the cleaning sheet',()=>action('inspect',"Cleaning checklist · Cleaning rounds",
   "7:00, 11:00, 14:00, 18:00, 21:30 — Done, every one, each with the same small red hanko: Thuan.\nAbove it, in blue: Request to customers — Please do not throw away anything other than paper..\nBeside it, a card for Jasmine Tea, ¥110, It's cold."));
 }
 const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 return {tick(time){now=time;blades.rotation.z=reduce?0:time*9;arm.rotation.x=.25+(time-flushedAt<.7?.7:0);}};
}
