/** Sakura's generated shop lettering follows the font already loaded by the game. */
export const SAKURA_FONT='Figtree,"LINE Seed JP","Hiragino Sans","Yu Gothic",sans-serif';

/** Paint immediately with offline fallbacks, then repaint once if the web font arrives.
 * Reuse the canvas and texture; never delay entry or allocate a second atlas.
 */
export function refreshSakuraPrint(texture,draw,sample){
 const fonts=globalThis.document?.fonts;
 if(!fonts?.load)return;
 let disposed=false;texture.addEventListener('dispose',()=>{disposed=true;});
 Promise.all([400,700,800].map(weight=>fonts.load(`${weight} 24px "LINE Seed JP"`,sample)))
  .then(()=>{if(!disposed){draw(texture.image.getContext('2d'));texture.needsUpdate=true;}})
  .catch(()=>{}); // The existing system-font print remains usable offline.
}
