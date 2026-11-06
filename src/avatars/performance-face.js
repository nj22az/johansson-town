import {drawFace} from './face.js';

// Reuse three scratch canvases for each live preview. Only the final composite is uploaded to the GPU.
// A neutral layer keeps strength=0 faithful to the person's own features; no recipe fields are modified.
export function createPerformancePainter(avatar,recipe){
 const size=avatar.face.canvas.width;
 const layers=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;});
 let lastKey='';
 const original=avatar.paintFace.bind(avatar);
 return state=>{
  const changed=original(state),s={...avatar.faceState,...state};
  Object.assign(avatar.faceState,s);
  const strength=state.expressionStrength??1,blend=state.expressionBlend??1;
  const key=[s.expression,state.expressionFrom,Math.round(strength*40),Math.round(blend*40),
   s.blink>.5,...['blinkLeft','blinkRight','actingBrow','actingSmile'].map(k=>Math.round((s[k]||0)*12)),Math.round(s.talk*12),s.look?.map(v=>Math.round(v*4)).join(',')].join('|');
  if(!changed&&key===lastKey)return false;
  lastKey=key;
  const weights=[1-strength,strength*(1-blend),strength*blend];
  const moods=['neutral',state.expressionFrom||s.expression,s.expression];
  const ctx=avatar.face.ctx;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,size,size);
  // 'lighter' sums premultiplied colours. Source-over would wrongly darken the weighted opaque layers.
  ctx.globalCompositeOperation='lighter';
  for(let i=0;i<3;i++){
   if(weights[i]<=0)continue;
   const layer=layers[i],g=layer.getContext('2d');
   drawFace(g,recipe,{...s,expression:moods[i],size,objects:true,skipEyes:!!avatar.eyes3d?.showing});
   ctx.globalAlpha=weights[i];ctx.drawImage(layer,0,0);
  }
  ctx.restore();avatar.face.texture.needsUpdate=true;return true;
 };
}
