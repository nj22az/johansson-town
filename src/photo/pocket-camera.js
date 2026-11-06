/**
 * The pocket film: a photo the way the town's fictional hand-helds take it, the Pocket Gentleman and the Pocket Lady
 * (src/photo/pocket-models.js), chunky pixels and an ordered dither on a four-shade screen. The method is the one the
 * 1998 Game Boy Camera cartridge uses (read with Ghidra from its camera driver, bank 0x0A; research only, nothing of
 * the cartridge is shipped): four tone levels; three threshold planes, each a linear ramp from one level to the next in sixteen
 * steps; and the steps dealt out over a 4x4 cell in the order of a Bayer matrix (transposed). A pixel's shade is how many
 * of its cell's three thresholds it is brighter than. The sensor also sharpened edges before the dither, which gives
 * the photos their crisp outlines (a small Laplacian here), and the camera set its exposure for each photo (`expose`). Palettes and levels are our own.
 * Pure functions on plain arrays; `pocketFilm` alone needs a canvas.
 */

/** The rank of each cell in the 4x4 dither cell, row by row: the order the cartridge fills the sensor's matrix. */
export const POCKET_MATRIX=Object.freeze([0,12,3,15, 8,4,11,7, 2,14,1,13, 10,6,9,5]);

/** Four shades, darkest first: the Pocket Gentleman's green (and its grey), and the Pocket Lady's rose. Our own. */
export const POCKET_PALETTES=Object.freeze({
 green:Object.freeze([[24,48,32],[62,98,56],[130,158,76],[200,212,138]]),
 grey:Object.freeze([[34,33,31],[104,103,99],[170,169,163],[232,231,224]]),
 rose:Object.freeze([[72,26,44],[146,62,94],[214,130,160],[251,216,228]]),
});

/** Tone levels (luminance 0-255): below the first is always the darkest shade, above the last always the lightest. */
export const POCKET_LEVELS=Object.freeze([36,100,164,228]);

/** The picture's size in camera pixels: the short side 112, as on the camera's 128x112 photos. */
export function pocketSize(aspect,short=112){
 const a=Number.isFinite(aspect)&&aspect>0?aspect:1;
 return a>=1?{w:Math.round(short*a),h:short}:{w:short,h:Math.round(short/a)};
}

/** The 48 thresholds, cell by cell (3 per cell, plane 0 first), ramped between the four levels as the cartridge does. */
export function pocketThresholds(levels=POCKET_LEVELS){
 const t=new Float32Array(48);
 for(let plane=0;plane<3;plane++){
  const lo=levels[plane],step=(levels[plane+1]-lo)/16;
  for(let cell=0;cell<16;cell++)t[cell*3+plane]=lo+step*POCKET_MATRIX[cell];
 }
 return t;
}

/** Luminance (Rec. 601, as a video camera sees it) of RGBA pixels. */
export function luma(rgba,count=rgba.length/4){
 const out=new Float32Array(count);
 for(let i=0;i<count;i++)out[i]=.299*rgba[i*4]+.587*rgba[i*4+1]+.114*rgba[i*4+2];
 return out;
}

/**
 * Automatic exposure, as the camera set it before each photo: the picture's own dark and light ends (2nd and 98th
 * percentile) are stretched towards black and white, so a pale pastel set or a dim room still uses all four shades.
 * The gain is capped (`maxGain`), so a nearly flat backdrop is not blown up into noise. Changes `l` in place.
 */
export function expose(l,{maxGain=4,low=.02,high=.98}={}){
 if(!l.length)return l;
 const hist=new Uint32Array(256);for(const v of l)hist[Math.min(255,Math.max(0,v|0))]++;
 const at=q=>{let n=0;const want=q*l.length;for(let i=0;i<256;i++){n+=hist[i];if(n>=want)return i;}return 255;};
 const lo=at(low),hi=at(high),span=Math.max(1,hi-lo),gain=Math.min(maxGain,236/span),mid=(lo+hi)/2;
 for(let i=0;i<l.length;i++)l[i]=Math.min(255,Math.max(0,128+(l[i]-mid)*gain));
 return l;
}

/**
 * Shades (0 darkest … 3 lightest) for a luminance image `l` of w x h. `edge` is how strongly edges are sharpened first
 * (0 for none).
 */
export function ditherLuma(l,w,h,{levels=POCKET_LEVELS,edge=.6}={}){
 const t=pocketThresholds(levels),out=new Uint8Array(w*h);
 const at=(x,y)=>l[Math.min(h-1,Math.max(0,y))*w+Math.min(w-1,Math.max(0,x))];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  let v=l[y*w+x];
  if(edge)v+=edge*(4*v-at(x-1,y)-at(x+1,y)-at(x,y-1)-at(x,y+1));
  const c=((y&3)*4+(x&3))*3;
  out[y*w+x]=(v>t[c])+(v>t[c+1])+(v>t[c+2]);
 }
 return out;
}

/** RGBA pixels for shades in a palette. */
export function paint(shades,palette=POCKET_PALETTES.green,rgba=new Uint8ClampedArray(shades.length*4)){
 for(let i=0;i<shades.length;i++){const p=palette[shades[i]];rgba[i*4]=p[0];rgba[i*4+1]=p[1];rgba[i*4+2]=p[2];rgba[i*4+3]=255;}
 return rgba;
}

/**
 * A photo as the carried camera takes it: the middle of `source` cropped to the camera's own frame (w x h, 128x112) and
 * turned into shades (0 darkest … 3 lightest), one a pixel, row by row. `into` is a scratch canvas (made when not given).
 */
export function pocketShot(source,{w=128,h=112,levels=POCKET_LEVELS,edge=.6,into=null}={}){
 const sw=source.width,sh=source.height,scale=Math.min(sw/w,sh/h),cw=w*scale,ch=h*scale;
 const canvas=into||document.createElement('canvas');if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(source,(sw-cw)/2,(sh-ch)/2,cw,ch,0,0,w,h);
 const img=ctx.getImageData(0,0,w,h);
 return ditherLuma(expose(luma(img.data,w*h)),w,h,{levels,edge});
}

/**
 * The film on a picture: `source` (a canvas or image) shrunk to camera pixels and dithered, returned in `into` (a canvas,
 * made when not given). Draw it back up with image smoothing off to keep the pixels square.
 */
export function pocketFilm(source,{palette='green',levels=POCKET_LEVELS,edge=.6,into=null}={}){
 const sw=source.width,sh=source.height,{w,h}=pocketSize(sw/sh);
 const canvas=into||document.createElement('canvas');if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(source,0,0,w,h);
 const img=ctx.getImageData(0,0,w,h);
 paint(ditherLuma(expose(luma(img.data,w*h)),w,h,{levels,edge}),POCKET_PALETTES[palette]||POCKET_PALETTES.green,img.data);
 ctx.putImageData(img,0,0);return canvas;
}
