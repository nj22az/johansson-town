import {FUN_POSES} from '../avatars/fun-poses.js';
import {EXPRESSIVE_POSES} from '../avatars/expressive-poses.js';
export const PHOTO_LIMIT=4;
export const CAST_LIMIT=6;
export const FORMATS=Object.freeze({landscape:4/3,square:1,portrait:3/4});
// (and every funny pose: avatars/fun-poses.js is their one list)
export const POSES=Object.freeze(['Idle','Wave','Cheer','Point','Shrug','Laugh','Think','Bow','Clap','Kachashi','Crouch','Sit','Heart','Peace','Coy','Tada','HandsOnHips','HeelKick','CheekRest','DoubleCheek',...Object.keys(FUN_POSES),...Object.keys(EXPRESSIVE_POSES)]);
// Every face World's face painter knows (avatars/face.js is the one list): the photo studio offers them all.
export {EXPRESSION_NAMES as EXPRESSIONS} from '../avatars/face.js';
export const cleanCaption=text=>Array.from(String(text||'').replace(/[\u0000-\u001f]/g,' ')).slice(0,120).join('');
export function frameSize(width,height,aspect){const w=Math.max(1,Math.min(width,height*aspect));return {width:Math.floor(w),height:Math.max(1,Math.floor(w/aspect))};}
export function comicLayout(count,style='grid',width=1200){
 const n=Math.max(1,Math.min(PHOTO_LIMIT,count)),columns=style==='strip'?n:Math.min(n,2),rows=Math.ceil(n/columns),gap=18,cellW=(width-gap*(columns+1))/columns,cellH=cellW*.75;
 return {width,height:Math.ceil(gap+(cellH+gap)*rows),cells:Array.from({length:n},(_,i)=>({x:gap+(i%columns)*(cellW+gap),y:gap+Math.floor(i/columns)*(cellH+gap),w:cellW,h:cellH}))};
}
// Unicode-safe wrapping, including a long word or Japanese text without spaces.
export function wrapCaption(ctx,text,maxWidth,maxLines=3){
 // A line breaks at its last space, so English words stay whole ("ramen", not "ram / en"); a word too long for a line,
 // or Japanese without spaces, breaks where it must.
 const lines=[];let line='';for(const character of Array.from(cleanCaption(text))){if(ctx.measureText(line+character).width>maxWidth&&line){
  const cut=character===' '?line.length:line.lastIndexOf(' '),rest=cut>0?line.slice(cut+1):'';
  if(cut>0)line=line.slice(0,cut);lines.push(line.trim());line=rest;if(lines.length===maxLines)return [...lines.slice(0,-1),lines.at(-1).slice(0,-1)+'…'];}
  line+=character;}if(line.trim())lines.push(line.trim());return lines;
}
export function drawCaptions(ctx,w,h,{style='photo',top='',bottom='',bubbles=[],vignette=false}={}){
 ctx.clearRect(0,0,w,h);ctx.textAlign='center';ctx.textBaseline='middle';
 if(vignette){const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.38,w/2,h/2,Math.hypot(w,h)*.56);g.addColorStop(0,'rgba(20,16,12,0)');g.addColorStop(1,'rgba(20,16,12,.5)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 function text(value,y,outline=true){ctx.font=`900 ${Math.round(w*.044)}px system-ui,sans-serif`;ctx.lineWidth=w*.007;ctx.strokeStyle='#171d20';ctx.fillStyle='#fff';const lines=wrapCaption(ctx,value,w*.89,2);lines.forEach((line,i)=>{if(outline)ctx.strokeText(line,w/2,y+i*w*.053);ctx.fillText(line,w/2,y+i*w*.053);});}
 if(style==='meme'){text(top,h*.09);text(bottom,h*.83);}
 if(style==='comic'&&bottom){ctx.fillStyle='#fff8e7';ctx.fillRect(0,h*.83,w,h*.17);ctx.fillStyle='#222';ctx.font=`700 ${Math.round(w*.031)}px system-ui,sans-serif`;wrapCaption(ctx,bottom,w*.9,2).forEach((line,i)=>ctx.fillText(line,w/2,h*.89+i*w*.038));}
 for(const bubble of bubbles){
  if(!bubble.text||bubble.visible===false)continue;ctx.font=`700 ${Math.max(12,Math.round(w*.026))}px system-ui,sans-serif`;
  const maxW=w*.38,lines=wrapCaption(ctx,bubble.text,maxW,3),lineH=w*.033,bw=Math.min(w*.44,Math.max(w*.12,...lines.map(t=>ctx.measureText(t).width))+w*.04),bh=lines.length*lineH+w*.035;
  const x=Math.max(bw/2+5,Math.min(w-bw/2-5,bubble.x*w)),y=Math.max(bh/2+5,Math.min(h-bh/2-w*.035,bubble.y*h));
  ctx.fillStyle='#fffdf4';ctx.strokeStyle='#202722';ctx.lineWidth=Math.max(1.5,w*.003);ctx.beginPath();ctx.roundRect(x-bw/2,y-bh/2,bw,bh,w*.018);ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-bw*.15,y+bh/2-2);ctx.lineTo(x-bw*.10,y+bh/2+w*.028);ctx.lineTo(x+bw*.02,y+bh/2-2);ctx.fill();ctx.stroke();ctx.fillStyle='#222';lines.forEach((line,i)=>ctx.fillText(line,x,y+(i-(lines.length-1)/2)*lineH));
 }
}
