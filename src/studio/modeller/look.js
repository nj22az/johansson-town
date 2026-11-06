import * as THREE from '../../../vendor/three.module.js';
import {createCelPass} from '../../render/cel.js';
import {createInkPipeline} from '../../render/ink-pipeline.js';
import {boxOfMeshes} from './made.js';

/**
 * World's look for a model on its own, as the desktop Studio draws it (jojo town-studio modeller/look.js and
 * export.js): the town's lights (a hemisphere, a cool bounce, a lilac uplight and the warm sun, game.js), its cel pass
 * (render/cel.js) and its ink pipeline (render/ink-pipeline.js) with the town's INK_OPTIONS. The numbers are the
 * desktop's, which keeps them in step with game.js; tests/asset-modeller.test.mjs holds them to the desktop's files.
 *
 * renderHero() draws the hero render: from the fixed three-quarter angle (front-right, 22° up, a 28° lens), on the
 * desktop's light ground with a soft shadow (the catalogue's hero.png), or on nothing (a transparent PNG to drop into a
 * comic, a meme or a slide). Both take a freshly built model, because the cel pass changes materials in place.
 */
export const LIGHTS=Object.freeze({
 hemisphere:{sky:0xdbe7f2,ground:0x6b5f8c,intensity:1.15},
 bounce:{colour:0x9db6e8,intensity:1.25,from:[26,16,-22]},
 uplight:{colour:0xc9b9e0,intensity:.35,from:[4,-18,6]},
 sun:{colour:0xffdca8,intensity:2.6,from:[-28,38,18]},
});
export const INK_OPTIONS=Object.freeze({
 superScale:1.25,samples:4,pixelBudget:4.6e6,fxaa:true,
 inkOptions:{thickness:1.05,strength:.68,concaveAmount:.25},
 gradeOptions:{shadowTint:0xe0dcf0,lift:.045,saturation:1.08,warmth:.02,vignette:.05},
});
export const HERO=Object.freeze({azimuth:-38*Math.PI/180,elevation:22*Math.PI/180,fov:28,fill:.9,background:'#f7f3ea',shadow:.16,lightTurn:82*Math.PI/180});
export const INK_COLOUR=0x2b2a33;
export {createCelPass,createInkPipeline};

/** World's lights in a scene, turned `turn` radians about y; with `fit` {center, radius} the sun casts a shadow over it. */
export function addLights(scene,{turn=0,shadows=false,fit=null}={}){
 const rot=v=>new THREE.Vector3(...v).applyAxisAngle(new THREE.Vector3(0,1,0),turn),L=LIGHTS,lights={};
 const hemi=new THREE.HemisphereLight(L.hemisphere.sky,L.hemisphere.ground,L.hemisphere.intensity);scene.add(hemi);lights.hemisphere=hemi;
 for(const key of ['bounce','uplight','sun']){
  const l=new THREE.DirectionalLight(L[key].colour,L[key].intensity);l.position.copy(rot(L[key].from).normalize().multiplyScalar(10));
  scene.add(l);scene.add(l.target);lights[key]=l;
 }
 if(shadows&&fit){
  const sun=lights.sun,r=fit.radius*1.4;
  sun.position.copy(fit.center).add(rot(L.sun.from).normalize().multiplyScalar(r*3));sun.target.position.copy(fit.center);sun.castShadow=true;
  Object.assign(sun.shadow.camera,{left:-r,right:r,top:r,bottom:-r,near:.1,far:r*8});sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.01;
  sun.shadow.camera.updateProjectionMatrix();
 }
 return lights;
}

/** The direction from a model to a camera at `azimuth` round from its front (+z) and `elevation` up. */
export const viewDirection=(azimuth,elevation)=>new THREE.Vector3(Math.sin(azimuth)*Math.cos(elevation),Math.sin(elevation),Math.cos(azimuth)*Math.cos(elevation));

/** Moves a camera along `dir` until the box fills `fill` of the frame (projected corners, a few passes; export.js). */
export function frameBox(camera,box,dir,fill){
 const centre=box.getCenter(new THREE.Vector3()),corners=[];
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new THREE.Vector3(x,y,z));
 let dist=box.getSize(new THREE.Vector3()).length()*1.5;
 for(let i=0;i<6;i++){
  camera.position.copy(centre).addScaledVector(dir,dist);camera.lookAt(centre);camera.updateMatrixWorld(true);
  const p=corners.map(c=>c.clone().project(camera));
  const cx=(Math.min(...p.map(v=>v.x))+Math.max(...p.map(v=>v.x)))/2,cy=(Math.min(...p.map(v=>v.y))+Math.max(...p.map(v=>v.y)))/2;
  const ext=Math.max(...p.map(v=>Math.max(Math.abs(v.x-cx),Math.abs(v.y-cy))));
  const shift=new THREE.Vector3(cx,cy,p[0].z).unproject(camera).sub(new THREE.Vector3(0,0,p[0].z).unproject(camera));
  centre.add(shift);dist*=Math.max(ext,1e-3)/fill;
 }
 camera.position.copy(centre).addScaledVector(dir,dist);camera.lookAt(centre);camera.updateMatrixWorld(true);
 return centre;
}

/**
 * A renderer for hero renders and library pictures, kept for many of them (an iPad has room for only a few WebGL
 * contexts): pass it to renderHero as `stage`, dispose it when done.
 */
export function createHeroStage(doc=globalThis.document){
 const canvas=doc.createElement('canvas');canvas.width=canvas.height=2;
 const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});
 return {canvas,renderer,dispose(){renderer.dispose();renderer.forceContextLoss?.();}};
}

/**
 * The hero render of a freshly built model (y up, floor y = 0), as PNG bytes. `transparent`: no ground and no
 * background, only the model and its ink line (the ink round its outline is kept as a soft dark edge). `stage`: a
 * createHeroStage() to draw with (else one is made and let go).
 */
export async function renderHero(group,{size=1200,azimuth=HERO.azimuth,elevation=HERO.elevation,transparent=false,doc=globalThis.document,stage=null,type='image/png'}={}){
 const own=stage?null:createHeroStage(doc),{canvas,renderer}=stage||own;
 canvas.width=canvas.height=size;
 const scene=new THREE.Scene();
 try{
  renderer.setPixelRatio(1);renderer.setSize(size,size,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
  renderer.shadowMap.enabled=!transparent;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  scene.background=new THREE.Color(HERO.background);scene.add(group);group.updateMatrixWorld(true);
  // the drawn shape only: a lamp's halo is light, a torch's unlit beam is not shown
  const box=boxOfMeshes(THREE,group),sphere=box.getBoundingSphere(new THREE.Sphere());
  for(const o of meshesOf(group)){o.castShadow=o.material&&!o.material.isMeshBasicMaterial;o.receiveShadow=true;}
  if(!transparent){
   // A shadow on the ground, drawn without depth so the ink does not outline the ground's edge.
   const ground=new THREE.Mesh(new THREE.CircleGeometry(sphere.radius*6,48),new THREE.ShadowMaterial({opacity:HERO.shadow,depthWrite:false}));
   ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;ground.renderOrder=-1;scene.add(ground);
  }
  addLights(scene,{turn:HERO.lightTurn+azimuth-HERO.azimuth,shadows:!transparent,fit:{center:sphere.center,radius:sphere.radius}});
  createCelPass().apply(scene);
  const camera=new THREE.PerspectiveCamera(HERO.fov,1,.05,100);
  frameBox(camera,box,viewDirection(azimuth,elevation),HERO.fill);
  camera.near=Math.max(.005,camera.position.distanceTo(sphere.center)-sphere.radius*2);camera.far=camera.position.distanceTo(sphere.center)+sphere.radius*8;camera.updateProjectionMatrix();
  const ink=createInkPipeline(renderer,INK_OPTIONS);ink.setCamera(camera);
  const read=()=>{const c=doc.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(canvas,0,0);return {c,g,data:g.getImageData(0,0,size,size)};};
  ink.render(r=>r.render(scene,camera));
  const drawn=read();
  if(transparent){
   // The background alone through the same chain (its grade and vignette), then the model's silhouette, plain: what
   // is the model keeps its colour, what the ink drew beside it keeps the ink as a soft edge, the rest goes.
   group.visible=false;ink.render(r=>r.render(scene,camera));const empty=read().data.data;group.visible=true;
   const background=scene.background;scene.background=new THREE.Color(0x000000);scene.overrideMaterial=new THREE.MeshBasicMaterial({color:0xffffff});
   const hidden=[];group.traverse(o=>{if((o.isSprite||o.isPoints||o.isLine)&&o.visible){o.visible=false;hidden.push(o);}});
   renderer.render(scene,camera);const mask=read().data.data;scene.overrideMaterial.dispose();scene.overrideMaterial=null;scene.background=background;
   for(const o of hidden)o.visible=true;
   const px=drawn.data.data,ink3=new THREE.Color(INK_COLOUR).convertLinearToSRGB(),inkRGB=[ink3.r*255,ink3.g*255,ink3.b*255];
   const lum=(a,i)=>.299*a[i]+.587*a[i+1]+.114*a[i+2],inkL=.299*inkRGB[0]+.587*inkRGB[1]+.114*inkRGB[2];
   for(let i=0;i<px.length;i+=4){
    const m=mask[i]/255,bgL=lum(empty,i),cover=Math.max(0,Math.min(1,(bgL-lum(px,i))/Math.max(1,bgL-inkL)));
    const a=Math.max(m,cover);
    if(a<=.004){px[i]=px[i+1]=px[i+2]=px[i+3]=0;continue;}
    if(m>=.999){px[i+3]=255;continue;}
    // the edge: take the background out of the mixed pixel
    for(let k=0;k<3;k++)px[i+k]=Math.max(0,Math.min(255,(px[i+k]-(1-a)*empty[i+k])/a));
    px[i+3]=Math.round(a*255);
   }
   drawn.g.putImageData(drawn.data,0,0);
  }
  ink.dispose();
  const blob=await new Promise((resolve,reject)=>drawn.c.toBlob(b=>b?resolve(b):reject(Error('The hero render could not be encoded.')),type));
  return new Uint8Array(await blob.arrayBuffer());
 }finally{
  scene.remove(group);scene.traverse(o=>{if(o!==group&&o.isMesh){o.geometry.dispose();o.material.dispose();}});own?.dispose();
 }
}

export function meshesOf(object){const out=[];object.traverse(o=>{if(o.isMesh)out.push(o);});return out;}
