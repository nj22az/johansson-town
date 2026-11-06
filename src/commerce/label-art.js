import {MARU,GOTHIC,drawSymbol,drawArt} from './packaging-art.js';

/**
 * The one renderer of a designed label (src/studio/label-spec.js): Johansson Studio draws with it on the iPad, the
 * johansson-studio tools bake with it in headless Studio, and previews show it. World never calls it at runtime: it
 * shows the picture Studio baked (labels/<id>.r<n>.webp), so the shelf and the close-up show exactly what the creator
 * approved, on any device and with any fonts. It grew out of packaging-art.js's drawFront: the same band, emblem,
 * wordmark, line, illustration window and flash, as layers the creator can move.
 *
 * drawLabel(ctx, spec, brand, w, h, {painting, pictures}) draws a normalised spec into a w×h (2:1) area at the
 * context's origin. `brand` gives the colour tokens (paper, ink, accent). `painting` is the painted label underneath
 * for base "painted" (an image or canvas of its cell); `pictures` maps a picture layer's file to its decoded image.
 * A picture that has not arrived is drawn as a plain hatched box, never left out silently.
 */
export const MINCHO='"Hiragino Mincho ProN","Noto Serif CJK JP","Yu Mincho",serif';
export const LABEL_FONTS=Object.freeze({gothic:GOTHIC,maru:MARU,mincho:MINCHO});

export function drawLabel(ctx,spec,brand,w,h,{painting=null,pictures={}}={}){
 const colour=c=>c==='paper'?brand.paper:c==='ink'?brand.ink:c==='accent'?brand.accent:c;
 ctx.save();
 if(spec.base==='painted'&&painting)ctx.drawImage(painting,0,0,w,h);
 else{ctx.fillStyle=brand.paper;ctx.fillRect(0,0,w,h);}
 for(const l of spec.layers){
  ctx.save();ctx.globalAlpha=l.opacity??1;
  const cx=(l.x??.5)*w,cy=(l.y??.5)*h;
  if(l.type==='band'){ctx.fillStyle=colour(l.colour);ctx.fillRect(0,l.y*h,w,l.h*h);}
  else if(l.type==='stripe'){ctx.fillStyle=colour(l.colour);ctx.fillRect(l.x*w,0,l.w*w,h);}
  else if(l.type==='shape')shape(ctx,l,cx,cy,l.w*w,l.h*h,colour);
  else if(l.type==='symbol')drawSymbol(ctx,l.symbol,cx,cy,l.size*h,colour(l.colour));
  else if(l.type==='art')drawArt(ctx,l.art,cx,cy,l.size*h,brand);
  else if(l.type==='text'){
   const px=Math.max(1,Math.round(l.size*h)),align=l.align||'center',max=l.maxWidth?l.maxWidth*w:undefined;
   ctx.font=`${l.weight==='normal'?'normal':'bold'} ${px}px ${LABEL_FONTS[l.font]||GOTHIC}`;ctx.textAlign=align;ctx.textBaseline='middle';
   if(l.outline){ctx.lineJoin='round';ctx.strokeStyle=colour(l.outline);ctx.lineWidth=px*.16;ctx.strokeText(l.text,cx,cy,max);}
   ctx.fillStyle=colour(l.colour);ctx.fillText(l.text,cx,cy,max);
  }else if(l.type==='picture'){
   const pw=l.w*w,ph=l.h*h,image=pictures[l.file];
   if(image)ctx.drawImage(image,cx-pw/2,cy-ph/2,pw,ph);
   else{const x0=cx-pw/2,y0=cy-ph/2;ctx.beginPath();ctx.rect(x0,y0,pw,ph);ctx.clip();ctx.fillStyle='#e9e4d8';ctx.fillRect(x0,y0,pw,ph);
    ctx.strokeStyle='#b8b0a0';ctx.lineWidth=Math.max(1,h*.006);for(let t=-ph;t<pw;t+=h*.06){ctx.beginPath();ctx.moveTo(x0+t,y0+ph);ctx.lineTo(x0+t+ph,y0);ctx.stroke();}}
  }
  ctx.restore();
 }
 ctx.restore();
}

/** A shape layer: circle, ring, roundel (the starburst flash a pack wears), diamond or rounded rectangle. */
function shape(ctx,l,cx,cy,sw,sh,colour){
 ctx.translate(cx,cy);if(l.angle)ctx.rotate(l.angle*Math.PI/180);
 const rx=sw/2,ry=sh/2,fill=colour(l.colour);ctx.beginPath();
 if(l.shape==='circle'||l.shape==='ring')ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
 else if(l.shape==='roundel')for(let i=0;i<=28;i++){const a=i/28*Math.PI*2,k=i%2?.78:1;ctx.lineTo(Math.cos(a)*rx*k,Math.sin(a)*ry*k);}
 else if(l.shape==='diamond'){ctx.moveTo(0,-ry);ctx.lineTo(rx,0);ctx.lineTo(0,ry);ctx.lineTo(-rx,0);}
 else ctx.roundRect(-rx,-ry,sw,sh,Math.min(sw,sh)*.18);
 ctx.closePath();
 if(l.shape==='ring'){ctx.strokeStyle=fill;ctx.lineWidth=Math.min(sw,sh)*.12;ctx.stroke();}
 else{ctx.fillStyle=fill;ctx.fill();}
 if(l.line&&l.shape!=='ring'){ctx.strokeStyle=colour(l.line);ctx.lineWidth=Math.max(1,Math.min(sw,sh)*.04);ctx.stroke();}
}
