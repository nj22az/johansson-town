import * as THREE from '../../vendor/three.module.js';

/**
 * Live pictures for the Look picker (ui/look-picker.js): the town as it is on the screen now, in each look, drawn by
 * the ink pipeline's own look passes (render/ink-pipeline.js shrinkPicture, renderLookPreview) into a small target and
 * copied to the picker's canvas. The owner (29 October 2026): "shader picking is a surprise I want to be able to choose
 * from a menu like in the camera app you are making and see the results".
 *
 * A round starts when the picker opens: the frame is shrunk once, then each look is drawn from that one picture, one
 * a call, so compiling a look the player has never chosen costs one frame at a time rather than all at once.
 */
export function createLookPreviews(renderer,pipeline,{height=240}={}){
 let source=null,target=null,pixels=null,round=0,shrunk=-1;
 const options={type:THREE.UnsignedByteType,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false,colorSpace:THREE.NoColorSpace};
 function size(p){
  const aspect=p.width/p.height;
  return {w:Math.max(2,Math.round(height*aspect)),h:height};
 }
 function targets(w,h){
  if(!source||source.width!==w||source.height!==h){
   source?.dispose();target?.dispose();
   source=new THREE.WebGLRenderTarget(w,h,options);target=new THREE.WebGLRenderTarget(w,h,options);pixels=new Uint8Array(w*h*4);shrunk=-1;
  }
 }
 return {
  /** A new round: the next picture drawn starts from the frame on the screen then. */
  begin(){round++;},
  /** Draws one look into the canvas (sized to the screen's shape); false if the pipeline cannot. */
  draw(name,canvas){
   const p=pipeline();if(!p?.renderLookPreview||!p.width)return false;
   const {w,h}=size(p);targets(w,h);
   if(shrunk!==round){if(!p.shrinkPicture(source))return false;shrunk=round;}
   const into=name==='none'?source:target;
   if(name!=='none'&&!p.renderLookPreview(name,source,target))return false;
   renderer.readRenderTargetPixels(into,0,0,w,h,pixels);
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   const g=canvas.getContext('2d'),image=g.createImageData(w,h),row=w*4;
   // The target's rows run bottom first.
   for(let y=0;y<h;y++)image.data.set(pixels.subarray((h-1-y)*row,(h-y)*row),y*row);
   g.putImageData(image,0,0);
   return true;
  },
  dispose(){source?.dispose();target?.dispose();source=target=pixels=null;},
 };
}
