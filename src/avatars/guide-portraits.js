import * as THREE from '../../vendor/three.module.js';
import {buildAvatar} from './build.js';
import {recipeFor} from './cast.js';
import {readSave} from '../save.js';
import {readStudioChoices} from '../studio-handoff.js';
import {playerRecipe} from './actors.js';
import {loadHatModels} from '../catalog/hat-models.js';

/** One shared renderer, only visible cards, using the game's current saved recipes. */
export function mountResidentPortraits(){
 const start=document.getElementById('start'),images=[...document.querySelectorAll('.resident-portrait')];
 let renderer=null,running=false;const pending=new Set();
 const active=()=>!start.classList.contains('hidden')&&start.classList.contains('guide-open');
 const scene=new THREE.Scene();scene.add(new THREE.HemisphereLight(0xffffff,0x71828a,2));
 const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(-3,5,-4);scene.add(key);
 function release(){renderer?.dispose();renderer?.forceContextLoss();renderer=null;}
 async function draw(){
  if(running)return;running=true;
  // The hats from World's catalogue (Johansson's trucker cap), so a resident's portrait shows theirs and not the stand-in.
  await loadHatModels();
  try{while(pending.size&&active()){
   const img=pending.values().next().value;pending.delete(img);
   if(!img.isConnected)continue;
   if(!renderer){renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(480,480);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor('#faf7ef',1);}
   const name=img.closest('[data-resident]').dataset.resident,recipe=name==='Johansson'?playerRecipe():recipeFor(name),avatar=buildAvatar(recipe,{shadows:false,faceSize:512});
   try{scene.add(avatar.root);if(name==='Thuan'){
    try{const outfit=readStudioChoices(localStorage).thuanOutfit||readSave(localStorage)?.thuanOutfit;if(['nozomi','sailor'].includes(outfit))avatar.wear(outfit);}catch{}
   }
   const h=avatar.height,view=img.dataset.portraitView,close=!!view,frame=h*(close?.42:1.12),camera=new THREE.OrthographicCamera(-frame/2,frame/2,frame/2,-frame/2,.1,20);const targetY=h*(close?.83:.51);const angle=view==='side'?Math.PI/2:view==='three-quarter'?.7:0;camera.position.set(Math.sin(angle)*4,targetY+.03,-Math.cos(angle)*4);camera.lookAt(0,targetY,0);scene.updateMatrixWorld(true);avatar.body.skeleton.update();renderer.render(scene,camera);img.src=renderer.domElement.toDataURL('image/webp',.9);img.dataset.liveRecipe=JSON.stringify(recipe);img.dataset.livePortrait='true';
   }finally{scene.remove(avatar.root);avatar.body.skeleton.dispose();avatar.dispose();renderer.renderLists.dispose();}
   await new Promise(resolve=>setTimeout(resolve,0));
  }}catch(error){console.warn('Resident portrait fallback:',error.message);}
  finally{running=false;if(!active())release();}
 }
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting&&!entry.target.dataset.livePortrait)pending.add(entry.target);draw();},{rootMargin:'120px'});
 images.forEach(img=>observer.observe(img));
 document.querySelectorAll('.resident-story').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)refresh();}));
 const refresh=()=>{for(const img of images){delete img.dataset.livePortrait;const box=img.getBoundingClientRect();if(box.height>0&&box.bottom>0&&box.top<innerHeight+120)pending.add(img);}draw();};
 addEventListener('johansson-appearance-change',refresh);addEventListener('storage',refresh);
 new MutationObserver(()=>{if(active())refresh();else{pending.clear();if(!running)release();}}).observe(start,{attributes:true,attributeFilter:['class']});
 return {refresh};
}
