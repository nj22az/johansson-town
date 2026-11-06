import * as THREE from '../../../vendor/three.module.js';
import {SAKURA_SPECIALS} from '../../commerce/sakura-specials.js';

/**
 * The specials board behind Thuan: a chalkboard (黒板) in a wooden frame on the wall at
 * the end of the counter, written up the way a shopkeeper does it every morning --
 * 本日のおすすめ across the top, then each special with a little chalk drawing, its
 * name in Japanese and English, and the price, in white, yellow and pink chalk.
 *
 * Everything on it is drawn here with the canvas API from SAKURA_SPECIALS, so changing
 * the menu changes the board. It hangs at local x 6.78 (the counter's back wall) facing
 * the shop, clear of the medicine shelf and the cigarette rack.
 */
export const SPECIALS_BOARD=Object.freeze({x:6.78,z:-.36,y:1.74,width:1.24,height:.9});

const CHALK='#f3f1e8',YELLOW='#f6d45c',PINK='#f4a3b7',BLUE='#9fd3f0';

/** Chalk: a line drawn twice, slightly offset and faint, so it reads as dusty. */
function chalkStroke(ctx,draw,colour,width){
 ctx.save();ctx.strokeStyle=colour;ctx.lineCap='round';ctx.lineJoin='round';
 ctx.globalAlpha=.85;ctx.lineWidth=width;ctx.beginPath();draw();ctx.stroke();
 ctx.globalAlpha=.35;ctx.lineWidth=width*.6;ctx.translate(1.5,-1);ctx.beginPath();draw();ctx.stroke();ctx.restore();
}
function chalkText(ctx,text,x,y,size,colour,{font='"Hiragino Maru Gothic ProN","Hiragino Sans","Noto Sans CJK JP",sans-serif',align='left',weight='bold'}={}){
 ctx.save();ctx.font=`${weight} ${size}px ${font}`;ctx.textAlign=align;ctx.textBaseline='middle';
 ctx.globalAlpha=.9;ctx.fillStyle=colour;ctx.fillText(text,x,y);ctx.globalAlpha=.25;ctx.fillText(text,x+1.5,y+1);ctx.restore();
}

/** One small chalk drawing per special. */
const DOODLES={
 karaage(ctx,x,y,s){chalkStroke(ctx,()=>{ctx.ellipse(x,y,s*.5,s*.4,.3,0,7);},YELLOW,4);chalkStroke(ctx,()=>{ctx.moveTo(x+s*.35,y-s*.25);ctx.lineTo(x+s*.75,y-s*.6);ctx.moveTo(x+s*.68,y-s*.72);ctx.arc(x+s*.75,y-s*.62,s*.12,0,7);},CHALK,4);},
 'pork-tamago'(ctx,x,y,s){chalkStroke(ctx,()=>{ctx.moveTo(x,y-s*.55);ctx.lineTo(x+s*.55,y+s*.45);ctx.lineTo(x-s*.55,y+s*.45);ctx.closePath();},CHALK,4);chalkStroke(ctx,()=>{ctx.rect(x-s*.42,y+s*.05,s*.84,s*.32);},'#7fb0d8',4);chalkStroke(ctx,()=>{ctx.arc(x,y-s*.1,s*.13,0,7);},YELLOW,4);},
 andagi(ctx,x,y,s){for(const [dx,dy] of [[-.25,.1],[.25,.1],[0,-.25]])chalkStroke(ctx,()=>{ctx.arc(x+dx*s,y+dy*s,s*.26,0,7);},'#e8a35a',4);},
 'iced-coffee'(ctx,x,y,s){chalkStroke(ctx,()=>{ctx.moveTo(x-s*.35,y-s*.45);ctx.lineTo(x-s*.25,y+s*.5);ctx.lineTo(x+s*.25,y+s*.5);ctx.lineTo(x+s*.35,y-s*.45);},CHALK,4);chalkStroke(ctx,()=>{ctx.rect(x-s*.18,y-s*.2,s*.16,s*.16);ctx.rect(x+.02*s,y-s*.05,s*.16,s*.16);},BLUE,3);chalkStroke(ctx,()=>{ctx.moveTo(x+s*.1,y-s*.45);ctx.lineTo(x+s*.25,y-s*.8);},PINK,4);},
 'iced-sanpin'(ctx,x,y,s){chalkStroke(ctx,()=>{ctx.rect(x-s*.3,y-s*.45,s*.6,s*.95);},CHALK,4);chalkStroke(ctx,()=>{ctx.moveTo(x-s*.25,y-s*.1);ctx.lineTo(x+s*.25,y-s*.1);},YELLOW,3);for(let k=0;k<5;k++){const a=k*Math.PI*2/5;chalkStroke(ctx,()=>{ctx.arc(x+s*.62+Math.cos(a)*s*.13,y-s*.45+Math.sin(a)*s*.13,s*.07,0,7);},'#f8f8f8',3);}},
};

/** The board's face, drawn on a canvas sized to the board. */
export function drawSpecialsBoard(ctx,W,H,specials=SAKURA_SPECIALS){
 // Slate: dark green with a faint wiped-clean haze.
 ctx.fillStyle='#24392f';ctx.fillRect(0,0,W,H);
 for(let i=0;i<220;i++){ctx.globalAlpha=.035;ctx.fillStyle='#e8efe8';const x=(i*97)%W,y=(i*53)%H;ctx.beginPath();ctx.ellipse(x,y,40+(i%5)*12,10+(i%3)*5,(i%7)*.4,0,7);ctx.fill();}
 ctx.globalAlpha=1;
 // Header.
 chalkText(ctx,'本日のおすすめ',W/2,H*.09,Math.round(H*.075),YELLOW,{align:'center'});
 chalkText(ctx,"TODAY’S SPECIALS",W/2,H*.165,Math.round(H*.04),CHALK,{align:'center',font:'Georgia,serif'});
 chalkStroke(ctx,()=>{ctx.moveTo(W*.1,H*.205);ctx.quadraticCurveTo(W*.5,H*.225,W*.9,H*.205);},PINK,3);
 // The specials, one to a line.
 const top=H*.27,row=(H*.84-top)/specials.length,icon=row*.55;
 specials.forEach((sp,i)=>{
  const y=top+row*(i+.5);
  (DOODLES[sp.id]||DOODLES.karaage)(ctx,W*.1,y,icon);
  chalkText(ctx,sp.jp,W*.19,y-row*.16,Math.round(row*.34),CHALK);
  chalkText(ctx,sp.name,W*.19,y+row*.2,Math.round(row*.22),BLUE,{font:'Georgia,serif',weight:'normal'});
  chalkText(ctx,'¥'+sp.price,W*.9,y,Math.round(row*.36),i%2?PINK:YELLOW,{align:'right'});
  if(i<specials.length-1){ctx.save();ctx.setLineDash([6,10]);chalkStroke(ctx,()=>{ctx.moveTo(W*.18,y+row*.48);ctx.lineTo(W*.9,y+row*.48);},'rgba(243,241,232,.35)',2);ctx.restore();}
 });
 // Footer: the hours, and a cherry blossom for the shop.
 chalkText(ctx,'hot case 9:00–20:00 · open 9:00–20:30',W/2,H*.92,Math.round(H*.034),CHALK,{align:'center',font:'Georgia,serif',weight:'normal'});
 for(let k=0;k<5;k++){const a=k*Math.PI*2/5-Math.PI/2;chalkStroke(ctx,()=>{ctx.ellipse(W*.9+Math.cos(a)*14,H*.92+Math.sin(a)*14,9,6,a,0,7);},PINK,3);}
}

/**
 * @param {THREE.Object3D} room the shop interior
 * @param {{anchor:Function,action:Function}} hooks
 */
export function buildSpecialsBoard(room,{anchor,action}={}){
 const B=SPECIALS_BOARD,group=new THREE.Group();group.name='Sakura specials board';
 group.position.set(B.x,B.y,B.z);group.rotation.y=-Math.PI/2;room.add(group);
 const wood=new THREE.MeshStandardMaterial({color:0x7a5232,roughness:.75});
 const frame=(w,h,x,y)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,.04),wood);m.position.set(x,y,.0);group.add(m);};
 frame(B.width+.08,.05,0,B.height/2+.015);frame(B.width+.08,.05,0,-B.height/2-.015);frame(.05,B.height+.08,B.width/2+.015,0);frame(.05,B.height+.08,-B.width/2-.015,0);
 // The chalk ledge, with two sticks of chalk and a duster.
 const ledge=new THREE.Mesh(new THREE.BoxGeometry(B.width,.025,.07),wood);ledge.position.set(0,-B.height/2-.05,.035);group.add(ledge);
 for(const [x,c] of [[-.3,0xf3f1e8],[-.22,0xf6d45c]]){const stick=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.07,6),new THREE.MeshStandardMaterial({color:c}));stick.rotation.z=Math.PI/2;stick.position.set(x,-B.height/2-.03,.045);group.add(stick);}
 const duster=new THREE.Mesh(new THREE.BoxGeometry(.11,.03,.045),new THREE.MeshStandardMaterial({color:0x3b3f55}));duster.position.set(.35,-B.height/2-.025,.04);group.add(duster);
 let face=null;
 if(typeof document!=='undefined'&&document.createElement){
  const W=1024,H=Math.round(1024*B.height/B.width),c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
  if(ctx){drawSpecialsBoard(ctx,W,H);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;
   face=new THREE.Mesh(new THREE.PlaneGeometry(B.width,B.height),new THREE.MeshStandardMaterial({map:t,roughness:.9}));face.position.z=.012;face.name='Sakura specials chalkboard';group.add(face);}
 }
 // Ordering is done across the counter, in front of the board.
 anchor?.([4.25,1.2,-.1],'Order from the specials board',()=>action?.('sakura-specials'));
 return {group,face};
}
