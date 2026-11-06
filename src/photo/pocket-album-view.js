import {paint,POCKET_PALETTES} from './pocket-camera.js';
import {unpackShades,photoCaption,ALBUM_SLOTS} from './pocket-album.js';

/**
 * The pocket album as a page (opened from the Field book, src/../activities.js): every photo at twice its size with
 * square pixels, what it shows in words, and two things to do with it: save it as a picture (four times its size, so
 * it prints and shares crisp), or let it go to make room. Letting go asks first (press again) and says what is lost.
 */
const SAVE_SCALE=4;

/** A photo drawn on a canvas at `scale` pixels a camera pixel. */
export function photoCanvas(photo,{scale=1,doc=globalThis.document}={}){
 const shades=unpackShades(photo.shades,photo.w*photo.h);
 const small=doc.createElement('canvas');small.width=photo.w;small.height=photo.h;
 const ctx=small.getContext('2d'),img=ctx.createImageData(photo.w,photo.h);
 paint(shades,POCKET_PALETTES[photo.palette]||POCKET_PALETTES.green,img.data);ctx.putImageData(img,0,0);
 if(scale===1)return small;
 const big=doc.createElement('canvas');big.width=photo.w*scale;big.height=photo.h*scale;
 const b=big.getContext('2d');b.imageSmoothingEnabled=false;b.drawImage(small,0,0,big.width,big.height);small.width=0;
 return big;
}

/** The album page's grid. onLetGo(id) removes a photo (after asking); the page is rebuilt by the caller. */
export function albumView(album,{onLetGo,doc=globalThis.document}={}){
 const box=doc.createElement('div');box.className='pocket-album';
 if(!album.length){const p=doc.createElement('p');p.className='pocket-album-empty';p.textContent='No photos yet. Raise the camera with F, or from the Town book, and press Space or Take.';box.append(p);return box;}
 const grid=doc.createElement('div');grid.className='pocket-album-grid';box.append(grid);
 for(const photo of [...album].reverse()){
  const figure=doc.createElement('figure'),caption=photoCaption(photo),pic=photoCanvas(photo,{scale:2,doc});
  pic.className='pocket-album-photo';pic.setAttribute('role','img');pic.setAttribute('aria-label',caption);
  const text=doc.createElement('figcaption');text.textContent=caption;
  const row=doc.createElement('div');row.className='pocket-album-row';
  const save=doc.createElement('button');save.type='button';save.textContent='Save picture';
  // The link lives a minute: Safari's save sheet can still be reading it long after the tap.
  save.onclick=()=>{const big=photoCanvas(photo,{scale:SAVE_SCALE,doc});big.toBlob(blob=>{big.width=0;if(!blob)return;const url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download=`johansson-pocket-${photo.id}.png`;doc.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);},'image/png');};
  // Letting go asks by asking twice on the button itself (a controller can answer it; a browser box it cannot).
  const go=doc.createElement('button');go.type='button';go.textContent='Let go';go.setAttribute('aria-label','Let go of the photo: '+caption);
  // The town's buttons carry an icon beside a label span (src/ui/icon-controls.js): change the words, keep the icon.
  let sure=0;const words=text=>{(go.querySelector?.('.ui-control-label')||go).textContent=text;};
  go.onclick=()=>{
   if(Date.now()<sure){onLetGo?.(photo.id);return;}
   sure=Date.now()+5000;words('Let go for good?');go.setAttribute('aria-label',`Press again to let go of the photo for good: ${caption}. It cannot be brought back.`);
   setTimeout(()=>{if(Date.now()>=sure){words('Let go');go.setAttribute('aria-label','Let go of the photo: '+caption);}},5100);
  };
  row.append(save,go);figure.append(pic,text,row);grid.append(figure);
 }
 return box;
}

export const albumLead=album=>`${album.length} of ${ALBUM_SLOTS} photos.`+(album.length>=ALBUM_SLOTS?' The album is full: let one go to take another.':' Newest first.');
