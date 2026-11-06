import * as THREE from '../../vendor/three.module.js';

const mat=(colour,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color:colour,roughness,metalness});
const mesh=(g,m,p,parent,shadow=true)=>{const o=new THREE.Mesh(g,m);o.position.set(...p);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;};

/** Restrained metre-scale fixture; the game adapter uses the town's real tables. */
export function createDrinkingScene(container) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x252a2e);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  container.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Three-dimensional seated drinking simulator');
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x252a2e);scene.fog=new THREE.Fog(0x252a2e,4,9);
  const hemi=new THREE.HemisphereLight(0xf2f5fa,0x697069,2.0);scene.add(hemi);
  const key=new THREE.DirectionalLight(0xfff6e7,3.0);key.position.set(.9,2.7,2.1);key.target.position.set(0,.8,0);
  key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-1.1;key.shadow.camera.right=1.1;
  key.shadow.camera.top=1.2;key.shadow.camera.bottom=-1.1;key.shadow.camera.near=.1;key.shadow.camera.far=6;
  key.shadow.normalBias=.005;key.shadow.bias=-.00015;key.shadow.radius=3;scene.add(key,key.target);
  const fill=new THREE.DirectionalLight(0xbecedf,.7);fill.position.set(-2,1.6,-1);scene.add(fill);
  const floorMat=mat(0x383e40,.88),wood=mat(0x705343,.5),metal=mat(0x373f43,.42,.35),seat=mat(0x656c68,.88);
  const floor=mesh(new THREE.PlaneGeometry(12,12),floorMat,[0,0,0],scene,false);floor.rotation.x=-Math.PI/2;
  const fixture=new THREE.Group();fixture.name='Metre-scale contact fixture';scene.add(fixture);
  mesh(new THREE.CylinderGeometry(.16,.16,.04,48),seat,[-.28,.44,0],fixture);
  mesh(new THREE.CylinderGeometry(.026,.034,.405,20),metal,[-.28,.2225,0],fixture);
  mesh(new THREE.CylinderGeometry(.19,.20,.02,40),metal,[-.28,.01,0],fixture);
  mesh(new THREE.BoxGeometry(.49,.032,.64),wood,[.285,.724,0],fixture);
  mesh(new THREE.BoxGeometry(.035,.708,.035),metal,[.47,.354,-.245],fixture);
  mesh(new THREE.BoxGeometry(.035,.708,.035),metal,[.47,.354,.245],fixture);
  mesh(new THREE.BoxGeometry(.035,.708,.035),metal,[.095,.354,-.245],fixture);
  // Camera-facing near leg sits beyond the arm's resting path.
  mesh(new THREE.BoxGeometry(.035,.708,.035),metal,[.095,.354,.245],fixture);
  mesh(new THREE.CylinderGeometry(.056,.056,.003,48),mat(0xb6aa94,.95),[.13,.7415,.085],fixture);

  const ortho=new THREE.OrthographicCamera(-1,1,1,-1,.01,20);
  const perspective=new THREE.PerspectiveCamera(35,1,.015,20);
  let camera=ortho,preset='side',width=1,height=1,zoom=1;
  const orbit={target:new THREE.Vector3(.02,.92,0),radius:2.5,phi:1.35,theta:.25};
  const updateOrbit=()=>{perspective.position.copy(orbit.target).add(new THREE.Vector3().setFromSphericalCoords(orbit.radius,orbit.phi,orbit.theta));perspective.lookAt(orbit.target);};
  const presets={side:{at:[.015,.98,0],h:1.18,w:1.10},body:{at:[.015,.76,0],h:1.59,w:1.10},
    mouth:{at:[-.015,1.255,0],h:.39,w:.48},grip:{at:[.10,.89,0],h:.40,w:.48},setdown:{at:[.13,.83,0],h:.32,w:.39}};
  function frame(rig,simulation) {
    if(preset==='orbit')return;
    const def=presets[preset],at=new THREE.Vector3(...def.at);
    if(preset==='mouth'&&rig) {rig.mouth.getWorldPosition(at);at.x+=.065;at.y-=.018;}
    if(preset==='grip'&&simulation){simulation.vessel.markers.grip.getWorldPosition(at);at.x+=.035;}
    const span=Math.max(def.h,def.w/(width/height))/zoom;
    ortho.left=-span*(width/height)/2;ortho.right=-ortho.left;ortho.top=span/2;ortho.bottom=-span/2;
    ortho.position.copy(at).add(new THREE.Vector3(0,.025,3));ortho.lookAt(at);ortho.updateProjectionMatrix();
  }
  function setCamera(id){if(id!=='orbit'&&!presets[id])return;preset=id;zoom=1;camera=id==='orbit'?perspective:ortho;updateOrbit();frame();}
  function resize(){const rect=container.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);renderer.setSize(width,height);perspective.aspect=width/height;perspective.updateProjectionMatrix();frame();}
  new ResizeObserver(resize).observe(container);resize();setCamera('side');
  const pointers=new Map();let last=null;
  renderer.domElement.addEventListener('pointerdown',e=>{if(preset!=='orbit')return;renderer.domElement.setPointerCapture(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);last=[e.clientX,e.clientY];});
  renderer.domElement.addEventListener('pointermove',e=>{
    if(preset!=='orbit'||!pointers.has(e.pointerId))return;
    const old=[...pointers.values()];pointers.set(e.pointerId,[e.clientX,e.clientY]);const now=[...pointers.values()];
    if(now.length===2){const d=a=>Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1]);orbit.radius*=d(old)/Math.max(1,d(now));}
    else if(last){const dx=e.clientX-last[0],dy=e.clientY-last[1];if(e.buttons===2||e.shiftKey){orbit.target.x-=dx*.001;orbit.target.y+=dy*.001;}else{orbit.theta-=dx*.007;orbit.phi-=dy*.007;}}
    last=[e.clientX,e.clientY];orbit.radius=THREE.MathUtils.clamp(orbit.radius,.4,4);orbit.phi=THREE.MathUtils.clamp(orbit.phi,.1,Math.PI-.1);updateOrbit();
  });
  const end=e=>{pointers.delete(e.pointerId);last=null;};renderer.domElement.addEventListener('pointerup',end);renderer.domElement.addEventListener('pointercancel',end);
  renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
  renderer.domElement.addEventListener('wheel',e=>{if(preset!=='orbit')return;e.preventDefault();orbit.radius=THREE.MathUtils.clamp(orbit.radius*Math.exp(e.deltaY*.001),.4,4);updateOrbit();},{passive:false});

  const debug=new THREE.Group();debug.visible=false;scene.add(debug);
  const marker=(color,r)=>{const m=mesh(new THREE.SphereGeometry(r,12,8),new THREE.MeshBasicMaterial({color,depthTest:false}),[0,0,0],debug,false);m.renderOrder=20;return m;};
  const mouthDot=marker(0xf47a82,.004),rimDot=marker(0x79d3d1,.003),wristDot=marker(0x79d3d1,.004),poleDot=marker(0xc3d77a,.006);
  const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]),new THREE.LineBasicMaterial({color:0xc3d77a,depthTest:false}));debug.add(line);line.renderOrder=20;
  function render(rig,simulation){
    frame(rig,simulation);
    if(debug.visible&&simulation.diagnostics){const d=simulation.diagnostics;mouthDot.position.fromArray(d.mouth);rimDot.position.fromArray(d.rim);wristDot.position.fromArray(d.wrist);poleDot.position.fromArray(d.pole);
      const a=rig.shoulder.getWorldPosition(new THREE.Vector3()),b=rig.elbow.getWorldPosition(new THREE.Vector3()),c=rig.wrist.getWorldPosition(new THREE.Vector3());
      line.geometry.attributes.position.set([a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z]);line.geometry.attributes.position.needsUpdate=true;}
    renderer.render(scene,camera);
  }
  return {scene,renderer,render,setCamera,get camera(){return camera;},get preset(){return preset;},debug,resize};
}
