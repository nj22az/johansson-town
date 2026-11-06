import * as THREE from '../../../vendor/three.module.js';
import {MAGAZINE_TITLES,rackIssues} from './magazine-issues.js';
import {drawCover,drawBackAd} from './magazine-art.js';

/**
 * The magazine rack under Sakura's west window.
 *
 * The model's rack was a four-metre gondola holding three titles, fifteen identical
 * copies to a shelf, stood bolt upright. It is replaced (REMOVED_SHELVING in
 * sakura-layout.js) by one slim two-metre rack of the kind konbini kept from the
 * seventies: cream enamel tube frame, a laminate plinth on casters, three stepped wire
 * tiers with the covers leaning back on their rails, yellowed price strips, and a pink
 * header sign. The folded papers ride on the top tier; the weeklies and monthlies
 * below, ten titles, each with a couple of copies behind the one on show.
 *
 * Every cover is drawn into one atlas, and each title is one instanced draw. The covers
 * are the issues on sale on the town date (magazine-issues.js) and are redrawn when the
 * calendar turns one over. The back of the rack faces the street, so it carries a print.
 */
// Widened to run most of the window, as a konbini's magazine wall does.
// A konbini's window rack, waist to chest high. Not placed at the moment (placed: false): it stood under Sakura's west
// window, in front of the sale poster and across anyone standing there, and is kept to be put somewhere else.
export const MAGAZINE_RACK=Object.freeze({placed:false,x:-3.6,z:3.22,width:1.8,depth:.56,height:1.3});

const MARU='"Hiragino Maru Gothic ProN","M PLUS Rounded 1c","Yu Gothic","Noto Sans CJK JP",sans-serif';
const COLS=4,ROWS=4,CW=320,CH=440;
const hash=(i,s=0)=>{const n=Math.sin(i*127.1+s*311.7)*43758.5453;return n-Math.floor(n);};
const RACK_TITLES=MAGAZINE_TITLES;
const BACK_AD=13,EDGES=15;

/** Draws every title's current issue into the atlas canvas. Returns the issue key. */
function paintAtlas(canvas,date){
 const ctx=canvas.getContext('2d'),{issues,key}=rackIssues(date);
 issues.forEach(({title,issue},i)=>{ctx.save();ctx.translate((i%COLS)*CW,Math.floor(i/COLS)*CH);ctx.beginPath();ctx.rect(0,0,CW,CH);ctx.clip();drawCover(ctx,title,issue,CW,CH);ctx.restore();});
 ctx.save();ctx.translate((BACK_AD%COLS)*CW,Math.floor(BACK_AD/COLS)*CH);drawBackAd(ctx,CW,CH);ctx.restore();
 // Page edges: newsprint cream, and the green recycled stock of the shōnen weekly.
 ctx.save();ctx.translate((EDGES%COLS)*CW,Math.floor(EDGES/COLS)*CH);ctx.fillStyle='#efe8d4';ctx.fillRect(0,0,CW,CH/2);ctx.fillStyle='#d3e6cc';ctx.fillRect(0,CH/2,CW,CH/2);ctx.restore();
 return key;
}

/** A cell of the atlas as UV bounds, inset a little so neighbours never bleed in. */
function cell(index,inset=.004){
 const c=index%COLS,r=Math.floor(index/COLS);
 return [c/COLS+inset,1-(r+1)/ROWS+inset,(c+1)/COLS-inset,1-r/ROWS-inset];
}
function remapFace(geometry,face,[u0,v0,u1,v1]){
 const uv=geometry.attributes.uv;
 for(let i=face*4;i<face*4+4;i++)uv.setXY(i,u0+uv.getX(i)*(u1-u0),v0+uv.getY(i)*(v1-v0));
}
/** One title's geometry: its cover on +z, the ad on the back, page edges round the sides. */
function titleGeometry(title,index){
 const w=title.paper?.27:.2,h=title.paper?.37:.27,d=title.paper?.014:title.thick;
 const g=new THREE.BoxGeometry(w,h,d);g.translate(0,h/2,-d/2);
 const ec=cell(EDGES),edge=title.kind==='shonen'?[ec[0]+.05,ec[1]+.02,ec[2]-.05,(ec[1]+ec[3])/2-.02]:[ec[0]+.05,(ec[1]+ec[3])/2+.02,ec[2]-.05,ec[3]-.02];
 for(const face of [0,1,2,3])remapFace(g,face,edge);
 remapFace(g,4,cell(index));remapFace(g,5,title.paper?cell(index):cell(BACK_AD));
 return g;
}

export function buildMagazineRack(room,{anchor,action,date=new Date(1997,8,13)}={}){
 const R=MAGAZINE_RACK,group=new THREE.Group();group.name='Sakura magazine rack';
 // Built facing +z and turned to face the shop; the back stands to the window.
 group.position.set(R.x,0,R.z);group.rotation.y=Math.PI;room.add(group);
 const enamel=new THREE.MeshStandardMaterial({color:0xece4d2,roughness:.42,metalness:.15});
 const wire=new THREE.MeshStandardMaterial({color:0xbdb8ad,roughness:.35,metalness:.55});
 const laminate=new THREE.MeshStandardMaterial({color:0x5a3a28,roughness:.7});
 const dark=new THREE.MeshStandardMaterial({color:0x22252a,roughness:.8});
 const add=(geometry,material,x,y,z,label='Sakura magazine rack')=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.name=label;group.add(m);return m;};
 const W=R.width,D=R.depth,halfW=W/2-.02;
 // Plinth on four little casters.
 add(new THREE.BoxGeometry(W,.1,D),laminate,0,.1,0);
 for(const sx of [-1,1])for(const sz of [-1,1]){const c=add(new THREE.CylinderGeometry(.03,.03,.025,12),dark,sx*(W/2-.08),.03,sz*(D/2-.08));c.rotation.z=Math.PI/2;}
 // Tube frame: front and back uprights each side, joined over the top.
 const tube=(len)=>new THREE.CylinderGeometry(.015,.015,len,10);
 for(const sx of [-1,1]){
  add(tube(1.05),enamel,sx*halfW,.65,-D/2+.04);add(tube(.52),enamel,sx*halfW,.41,D/2-.06);
  const brace=add(tube(.6),enamel,sx*halfW,.6,0);brace.rotation.x=-.95;
  add(tube(D-.1),enamel,sx*halfW,1.18,-.02).rotation.x=Math.PI/2;
 }
 add(tube(W-.04),enamel,0,1.18,-D/2+.04).rotation.z=Math.PI/2;
 // Back panel, with a print for the street on its far side.
 const backPrint=new THREE.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=1024;c.height=512;const x=c.getContext('2d');x.fillStyle='#f6eadf';x.fillRect(0,0,1024,512);x.fillStyle='#f06b9a';x.fillRect(0,0,1024,120);x.fillStyle='#d7263d';x.fillRect(0,120,1024,14);
  x.fillStyle='#fff';x.font=`900 72px ${MARU}`;x.textAlign='center';x.textBaseline='middle';x.fillText("Books, magazines, newspapers",512,62);x.fillStyle='#b5455f';x.font=`800 54px ${MARU}`;x.fillText('BOOKS & MAGAZINES',512,260);x.font=`700 40px ${MARU}`;x.fillText("Arrived every morning · Sakura Shop",512,360);return c;})());
 backPrint.colorSpace=THREE.SRGBColorSpace;
 add(new THREE.BoxGeometry(W-.06,.95,.012),[enamel,enamel,enamel,enamel,enamel,new THREE.MeshStandardMaterial({map:backPrint,roughness:.6})],0,.65,-D/2+.04,'Magazine rack back panel');
 // Three stepped tiers: the papers on top, the magazines below, each leaning on a rail.
 const TIERS=[{y:.24,z:.21},{y:.52,z:.07},{y:.8,z:-.07}];
 const LEAN=.27,priceStrip=new THREE.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=1024;c.height=48;const x=c.getContext('2d');x.fillStyle='#f3e3a0';x.fillRect(0,0,1024,48);x.fillStyle='#7a5a1c';x.font=`800 26px ${MARU}`;x.textBaseline='middle';
  ['¥200','¥380','¥350','¥420','¥360','¥580','¥150','¥450'].forEach((p,i)=>x.fillText(p,22+i*126,25));return c;})());
 priceStrip.colorSpace=THREE.SRGBColorSpace;const stripMat=new THREE.MeshStandardMaterial({map:priceStrip,roughness:.5});
 for(const tier of TIERS){
  const tray=add(new THREE.BoxGeometry(W-.06,.012,.3),wire,0,tier.y,tier.z-.12);tray.rotation.x=.12;
  add(new THREE.BoxGeometry(W-.06,.03,.012),stripMat,0,tier.y-.012,tier.z+.03,'Magazine rack price strip');
  add(tube(W-.06).clone().scale(.35,1,.35),wire,0,tier.y+.075,tier.z-.065).rotation.z=Math.PI/2;
  for(let i=-3;i<=3;i++)add(new THREE.CylinderGeometry(.004,.004,.1,6),wire,i*.27,tier.y+.04,tier.z-.06);
 }
 // The header sign, in the shop's pink.
 const signTex=new THREE.CanvasTexture((()=>{const c=document.createElement('canvas');c.width=1024;c.height=128;const x=c.getContext('2d');x.fillStyle='#f06b9a';x.fillRect(0,0,1024,128);x.fillStyle='#d7263d';x.fillRect(0,108,1024,20);
  x.fillStyle='#fff';x.font=`900 52px ${MARU}`;x.textAlign='center';x.textBaseline='middle';x.fillText("Magazines/Newspapers",512,42,960);x.fillStyle='#fff6c8';x.font=`800 24px ${MARU}`;x.fillText("★ Arrived every morning · Welcome to browse ★",512,88,960);return c;})());
 signTex.colorSpace=THREE.SRGBColorSpace;const signMat=new THREE.MeshStandardMaterial({map:signTex,roughness:.5,emissive:0xffffff,emissiveMap:signTex,emissiveIntensity:.25});
 add(new THREE.BoxGeometry(1.5,.18,.025),[enamel,enamel,enamel,enamel,signMat,signMat],0,1.3,-D/2+.04,'Magazine rack sign');
 for(const sx of [-.6,.6])add(tube(.12),enamel,sx,1.16+.06,-D/2+.04);
 // The stock. Each title is one instanced draw over the shared atlas.
 const canvas=document.createElement('canvas');canvas.width=COLS*CW;canvas.height=ROWS*CH;
 let lastDay=null;let issueKey=paintAtlas(canvas,date);
 const atlas=new THREE.CanvasTexture(canvas);atlas.colorSpace=THREE.SRGBColorSpace;atlas.anisotropy=8;
 const material=new THREE.MeshStandardMaterial({map:atlas,roughness:.5});
 const placed=RACK_TITLES.map(()=>[]),dummy=new THREE.Object3D();
 const magazines=RACK_TITLES.map((t,i)=>i).filter(i=>!RACK_TITLES[i].paper),papers=RACK_TITLES.map((t,i)=>i).filter(i=>RACK_TITLES[i].paper);
 const row=(tier,list,count,width,copies)=>{
  const gap=(W-.12-count*width)/(count-1);
  for(let k=0;k<count;k++){
   const index=list[k%list.length],t=RACK_TITLES[index],x=-W/2+.06+width/2+k*(width+gap);
   for(let c=0;c<copies;c++){
    const d=t.paper?.014:t.thick,z=tier.z-.03-c*(d+.002)*Math.cos(LEAN);
    placed[index].push([x+(hash(k,c)-.5)*.006,tier.y+.006+c*.004,z,LEAN+(hash(k,c+3)-.5)*.02,(hash(k,c+7)-.5)*.03]);
   }
  }
 };
 // Papers across the top, magazines on the two tiers below, no title twice side by side.
 row(TIERS[2],papers,5,.27,3);
 row(TIERS[1],magazines,7,.2,3);
 row(TIERS[0],[...magazines.slice(5),...magazines.slice(0,5)],7,.2,3);
 placed.forEach((list,index)=>{
  if(!list.length)return;
  const mesh=new THREE.InstancedMesh(titleGeometry(RACK_TITLES[index],index),material,list.length);mesh.name='Sakura rack '+RACK_TITLES[index].id;
  list.forEach(([x,y,z,lean,tilt],i)=>{dummy.position.set(x,y,z);dummy.rotation.set(-lean,0,tilt);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.computeBoundingSphere();group.add(mesh);
 });
 if(anchor&&action)anchor([R.x,1.15,R.z-R.depth/2-.45],'Read the magazines',()=>action('magazine-rack'));
 return {group,
  /** Puts the issues on sale on `date` on the rack; a no-op until one changes. */
  // Called every frame; covers only change with the date, so only a new day is looked at.
  refresh(date){const day=date.getFullYear()*400+date.getMonth()*32+date.getDate();if(day===lastDay)return false;lastDay=day;const {key}=rackIssues(date);if(key===issueKey)return false;issueKey=paintAtlas(canvas,date);atlas.needsUpdate=true;return true;},
  get issueKey(){return issueKey;}};
}
