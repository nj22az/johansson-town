import * as THREE from '../../vendor/three.module.js';
import {GLTFLoader} from '../../vendor/GLTFLoader.js';
import {OrbitControls} from './orbit-controls.js';

const CONFIG={centre:[0,9.5,0],width:32,height:21.5};

async function loadModel(signal,state,onProgress){
  const response=await fetch(new URL('./woodland.glb.gz',import.meta.url),{signal});
  if(!response.ok)throw new Error(`The scene could not be downloaded (${response.status}).`);
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(signal.aborted)throw new DOMException('Closed','AbortError');
  onProgress('Arranging the woodland…');
  // A server may already have applied Content-Encoding. Recognise both forms.
  if(bytes[0]===0x67&&bytes[1]===0x6c&&bytes[2]===0x54&&bytes[3]===0x46){state.decoder='server';return bytes.buffer;}
  if(bytes[0]!==0x1f||bytes[1]!==0x8b)throw new Error('The downloaded scene is not complete.');
  if(typeof DecompressionStream==='function'){
    try{
      const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const buffer=await new Response(stream).arrayBuffer();state.decoder='native';return buffer;
    }catch(error){if(signal.aborted)throw error;}
  }
  const {inflateGzip}=await import('./inflate-fallback.js');
  const unpacked=inflateGzip(bytes);state.decoder='fallback';
  return unpacked.buffer.slice(unpacked.byteOffset,unpacked.byteOffset+unpacked.byteLength);
}

export async function createDiorama(stage,{signal,onProgress,onError,state}){
  let renderer,controls,observer,scene;
  let loaded=false,visible=false,disposed=false,mode='front';
  const centre=new THREE.Vector3(...CONFIG.centre);
  const camera=new THREE.OrthographicCamera(-16,16,11,-11,.05,300);

  function draw(){if(renderer&&loaded&&visible&&!disposed)renderer.render(scene,camera);}
  function resize(){
    if(!renderer||disposed)return;
    const width=Math.max(stage.clientWidth,1),height=Math.max(stage.clientHeight,1),aspect=width/height;
    renderer.setSize(width,height,false);
    let fitHeight=Math.max(CONFIG.height,CONFIG.width/aspect);
    if(mode==='orbit'&&state.modelBounds){
      camera.updateMatrixWorld(true);let halfX=0,halfY=0;const b=state.modelBounds;
      for(const x of[b.min[0],b.max[0]])for(const y of[b.min[1],b.max[1]])for(const z of[b.min[2],b.max[2]]){
        const point=new THREE.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse);
        halfX=Math.max(halfX,Math.abs(point.x));halfY=Math.max(halfY,Math.abs(point.y));
      }
      fitHeight=Math.max(halfY*2,halfX*2/aspect)*1.08;
    }
    camera.left=-fitHeight*aspect/2;camera.right=fitHeight*aspect/2;camera.top=fitHeight/2;camera.bottom=-fitHeight/2;
    camera.updateProjectionMatrix();draw();
  }
  function view(next){
    if(!controls||disposed)return;
    mode=next==='orbit'?'orbit':'front';controls.target.copy(centre);
    camera.position.copy(centre).add(mode==='front'?new THREE.Vector3(0,0,50):new THREE.Vector3(28,13,42));
    camera.zoom=1;camera.lookAt(centre);controls.enableRotate=mode==='orbit';
    controls.mouseButtons.LEFT=mode==='orbit'?THREE.MOUSE.ROTATE:THREE.MOUSE.PAN;
    controls.touches.ONE=mode==='orbit'?THREE.TOUCH.ROTATE:THREE.TOUCH.PAN;
    controls.update();resize();
  }
  function dispose(){
    if(disposed)return;disposed=true;observer?.disconnect();controls?.dispose();
    const geometries=new Set(),materials=new Set(),textures=new Set();
    scene?.traverse(object=>{
      if(object.geometry)geometries.add(object.geometry);
      for(const material of Array.isArray(object.material)?object.material:[object.material])if(material)materials.add(material);
    });
    for(const material of materials){for(const value of Object.values(material))if(value?.isTexture)textures.add(value);material.dispose();}
    geometries.forEach(geometry=>geometry.dispose());textures.forEach(texture=>texture.dispose());
    renderer?.dispose();renderer?.domElement.remove();
  }

  try{
    const buffer=await loadModel(signal,state,onProgress);
    if(signal.aborted)throw new DOMException('Closed','AbortError');
    renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.NoToneMapping;renderer.setClearColor('#f7eedc');renderer.domElement.hidden=true;
    renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D woodland scene. Drag to move or turn; pinch to zoom.');stage.prepend(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();onError(new Error('The 3D view was interrupted.'));});
    scene=new THREE.Scene();scene.background=new THREE.Color('#f7eedc');
    controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.minZoom=.55;controls.maxZoom=5;
    controls.minPolarAngle=.13*Math.PI;controls.maxPolarAngle=.86*Math.PI;controls.rotateSpeed=.65;controls.zoomSpeed=.85;controls.panSpeed=.8;controls.screenSpacePanning=true;controls.addEventListener('change',draw);
    scene.add(new THREE.HemisphereLight('#fff9ed','#ddd1bc',1.55));
    const key=new THREE.DirectionalLight('#fff9ed',2);key.position.set(-14,35,30);scene.add(key);
    const fill=new THREE.DirectionalLight('#e8f5ec',.45);fill.position.set(24,15,-20);scene.add(fill);
    const gltf=await new GLTFLoader().parseAsync(buffer,'');
    if(signal.aborted)throw new DOMException('Closed','AbortError');
    const remove=[];gltf.scene.traverse(object=>{
      if(object.isLight||object.isCamera)remove.push(object);
      if(object.isMesh){state.modelMeshCount++;state.modelVertexCount+=object.geometry.attributes.position?.count||0;}
    });remove.forEach(object=>object.removeFromParent());scene.add(gltf.scene);gltf.scene.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromObject(gltf.scene);state.modelBounds={min:box.min.toArray(),max:box.max.toArray()};
    loaded=true;observer=new ResizeObserver(resize);observer.observe(stage);view('front');
    return{
      view,
      visible(value){visible=value;renderer.domElement.hidden=!value;controls.enabled=value;if(value){resize();draw();}},
      zoom(factor){camera.zoom=Math.min(5,Math.max(.55,camera.zoom*factor));camera.updateProjectionMatrix();draw();},
      dispose,
    };
  }catch(error){dispose();throw error;}
}
