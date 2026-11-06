/**
 * A canvas texture that never changes needs its picture on the GPU, not twice. Once uploaded, its 2D canvas gives
 * its backing store back (the ferry's static plates alone held about 60 MB of canvas memory that nothing read
 * again, and iOS Safari counts every canvas against one budget). A `deferred` picture is not painted at all until
 * `paintBack` is called before its first upload (a plate nobody can see yet).
 *
 * A restored WebGL context needs the pictures again: `redrawReleasedCanvases` paints every non-deferred one back
 * at its own size before the next frame uploads it, and it is released again after that upload; deferred ones
 * wait for their `paintBack`.
 *
 * Only for textures one renderer draws and nothing repaints later: a live dial or a shelf atlas keeps its canvas.
 */
const released=new Set(),entries=new WeakMap();
function paint(entry){
 const {texture,canvas,redraw,width,height}=entry;
 canvas.width=width;canvas.height=height;redraw(canvas.getContext('2d'),width,height);texture.needsUpdate=true;released.delete(entry);
}
export function releaseAfterUpload(texture,redraw,{width,height,deferred=false}={}){
 const canvas=texture.image,entry={texture,canvas,redraw,width:width??canvas.width,height:height??canvas.height,deferred};
 entries.set(texture,entry);
 let disposed=false;
 texture.onUpdate=()=>{if(disposed||released.has(entry))return;canvas.width=canvas.height=1;released.add(entry);};
 const dispose=()=>{
  disposed=true;released.delete(entry);entries.delete(texture);
  texture.removeEventListener('dispose',dispose);texture.onUpdate=null;
  canvas.width=canvas.height=1;
 };
 // A room can go away before the next context loss. Keeping its entry here kept
 // the texture, canvas and painter alive, then repainted a room nobody used.
 texture.addEventListener('dispose',dispose);
 if(deferred){canvas.width=canvas.height=1;released.add(entry);}
 return texture;
}
/** Paints a released or deferred picture back, ready for its next upload. */
export function paintBack(texture){const entry=entries.get(texture);if(entry&&released.has(entry))paint(entry);}
export function redrawReleasedCanvases(){for(const entry of [...released])if(!entry.deferred)paint(entry);}
export function releasedCanvasCount(){return released.size;}
