import {svg} from '../ui/icons.js';
import {pocketShot,paint,POCKET_PALETTES} from './pocket-camera.js';
import {PHOTO_W,PHOTO_H,ALBUM_SLOTS} from './pocket-album.js';
import {POCKET_MODELS} from './pocket-models.js';

/**
 * The pocket camera raised to the eye, a Pocket Gentleman or a Pocket Lady (pocket-models.js: `model()`, the one the
 * player carries; its body, name and screen shades). The game's own view, cropped to the camera's 128x112 frame and turned into its
 * four shades every frame (src/photo/pocket-camera.js), shown at a whole-pixel scale so the pixels stay square. The
 * shutter keeps that very frame (the shades the player saw), so the album holds what the screen showed.
 *
 * source: the game's canvas, read right after it is drawn (frame()). onShoot(shades) keeps a photo and says what
 * happened ({ok, text}); onLower() puts the camera away. count() → number of photos kept.
 */
export const REFRESH_MS=66;

export function createPocketViewfinder({source,onShoot,onLower,count=()=>0,model=()=>POCKET_MODELS.gentleman}){
 // The model is taken once, when the camera is raised: its body, screen and photos stay one camera until it is lowered.
 let held=POCKET_MODELS.gentleman;const palette=()=>held.palette;
 const ui=document.createElement('section');ui.id='pocketViewfinder';ui.hidden=true;ui.setAttribute('aria-label','Pocket Gentleman camera');
 // The body: the lens at the top (round, like a monocle), the screen in its bezel, the model's name under it.
 ui.innerHTML=`<div class="pocket-body"><span class="pocket-lens" aria-hidden="true"></span><div class="pocket-bezel"><canvas class="pocket-screen" width="${PHOTO_W}" height="${PHOTO_H}" role="img" aria-label="What the camera sees"></canvas></div>
 <p class="pocket-mark" aria-hidden="true"></p>
 <div class="pocket-controls"><button type="button" class="pocket-shutter" data-shutter aria-label="Take a photo" title="Take a photo (Space)">${svg('camera')}<span>Take</span></button>
 <p class="pocket-count" aria-live="polite"></p><button type="button" class="pocket-lower" data-lower aria-label="Put the camera away" title="Put the camera away (F)">${svg('close')}<span>Lower</span></button></div>
 <p class="pocket-said" role="status" aria-live="polite"></p></div>`;
 document.body.append(ui);
 const screen=ui.querySelector('.pocket-screen'),ctx=screen.getContext('2d'),said=ui.querySelector('.pocket-said'),counter=ui.querySelector('.pocket-count');
 const scratch=document.createElement('canvas'),image=ctx.createImageData(PHOTO_W,PHOTO_H);
 let raised=false,last=null,lastAt=-Infinity,flashUntil=0,flashed=false,sayTimer=0;

 // The screen is scaled by a whole number so every camera pixel is the same size on any screen.
 function fit(){
  const room=Math.min(innerWidth*.8,(innerHeight-180)*PHOTO_W/PHOTO_H),scale=Math.max(1,Math.floor(room/PHOTO_W));
  screen.style.width=PHOTO_W*scale+'px';screen.style.height=PHOTO_H*scale+'px';
 }
 const tell=text=>{said.textContent=text;clearTimeout(sayTimer);if(text)sayTimer=setTimeout(()=>{said.textContent='';},3500);};
 const showCount=()=>{counter.textContent=`Album ${count()} / ${ALBUM_SLOTS}`;};

 /** Call right after the game has drawn its frame: the camera's screen shows that frame. */
 function frame(now=performance.now()){
  if(!raised||!source.width||!source.height)return;
  // Reading the drawn frame back makes the CPU wait for the graphics card to finish it (measured: the copy and the
  // shades take about 1 ms, the wait is the rest), so the camera's screen is refreshed 15 times a second, not every
  // frame: three frames in four pay nothing.
  // The shutter's blink: the screen goes to its lightest shade for a moment as the picture is kept (nothing is read).
  if(now<flashUntil){ctx.fillStyle=`rgb(${(POCKET_PALETTES[palette()]||POCKET_PALETTES.green)[3].join(',')})`;ctx.fillRect(0,0,PHOTO_W,PHOTO_H);flashed=true;return;}
  if(last&&!flashed&&now-lastAt<REFRESH_MS)return;
  flashed=false;lastAt=now;
  last=pocketShot(source,{w:PHOTO_W,h:PHOTO_H,into:scratch});
  paint(last,POCKET_PALETTES[palette()]||POCKET_PALETTES.green,image.data);
  ctx.putImageData(image,0,0);
 }
 function shoot(){
  if(!raised)return {ok:false,text:'The camera is put away.'};
  if(!last)return {ok:false,text:'The camera is still waking up.'};
  if(performance.now()<flashUntil)return {ok:false,text:''};   // one photo a blink: a double tap keeps one, not two
  const r=onShoot(last.slice(),held.palette)||{ok:false,text:'The photo could not be kept.'};
  if(r.ok)flashUntil=performance.now()+120;
  if(r.text)tell(r.text);showCount();return r;
 }
 function raise(){if(raised)return;const m=held=model()||POCKET_MODELS.gentleman;ui.dataset.model=m.id;ui.setAttribute('aria-label',m.name+' camera');ui.querySelector('.pocket-mark').textContent=m.name;
  raised=true;last=null;lastAt=-Infinity;ui.hidden=false;document.documentElement.classList.add('pocket-raised');fit();showCount();tell('');ui.querySelector('[data-shutter]').focus({preventScroll:true});}
 function lower(){if(!raised)return;raised=false;last=null;ui.hidden=true;document.documentElement.classList.remove('pocket-raised');tell('');onLower?.();}
 ui.querySelector('[data-shutter]').onclick=e=>{e.stopPropagation();shoot();};
 ui.querySelector('[data-lower]').onclick=e=>{e.stopPropagation();lower();};
 // Only the buttons take the pointer: a drag anywhere else still turns the view, as with the camera down.
 for(const b of ui.querySelectorAll('button'))for(const type of ['pointerdown','pointerup','mousedown','touchstart'])b.addEventListener(type,e=>e.stopPropagation());
 addEventListener('resize',()=>{if(raised)fit();});
 return {raise,lower,shoot,frame,get raised(){return raised;},get shades(){return last;},tell};
}
