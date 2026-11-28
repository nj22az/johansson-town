import * as THREE from '../../vendor/three.module.js';
/**
 * Looking at something, held up close (the owner, 28 November 2026: "When looking at something it should show an enlarged
 * view like the item viewer in Sakura ... when I look at the poster in the workshop now it only shows text ... I want to be
 * able to enjoy the graphics").
 *
 * A "Look at …" in the town or a room opens this: the thing itself, taken from where it stands (the meshes round the
 * prompt's point, not the wall or floor they are on), on a stage of its own, lit and big. Drag to turn it, pinch or scroll
 * to come closer; underneath, its name and what is said about it, and Close. Like Sakura's item viewer
 * (world/interiors/item-viewer.js) it draws with its own small renderer on its own canvas, so the town underneath is left
 * as it is: nothing of the town is moved, changed or disposed (the copies share its shapes and paints).
 */

/** What counts as the thing looked at: within `near` metres of the prompt's point, and no bigger than `largest` across. */
export const LOOK_PICK=Object.freeze({near:.35,largest:3.5,reach:.62});

/**
 * Where a room has merged what is fixed into a few big meshes (the workshop's wall, chin-wall.js bake), the thing looked at
 * is a handful of triangles in one of them: this cuts out the triangles lying wholly within `reach` of the point, as a
 * mesh of their own (same paint, placed where the big one is). Null when none are that near.
 */
export function nearPart(mesh,point,reach=LOOK_PICK.reach){
 const g=mesh.geometry,pos=g.attributes.position,index=g.index,count=index?index.count:pos.count,v=new THREE.Vector3(),keep=[];
 mesh.updateMatrixWorld(true);
 const at=i=>v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld).distanceTo(point)<=reach;
 for(let t=0;t<count;t+=3){const a=index?index.getX(t):t,b=index?index.getX(t+1):t+1,c=index?index.getX(t+2):t+2;if(at(a)&&at(b)&&at(c))keep.push(a,b,c);}
 if(!keep.length)return null;
 const part=new THREE.BufferGeometry();
 for(const [name,attr] of Object.entries(g.attributes)){const n=attr.itemSize,array=new attr.array.constructor(keep.length*n);
  keep.forEach((i,k)=>{for(let j=0;j<n;j++)array[k*n+j]=attr.array[i*n+j];});part.setAttribute(name,new THREE.BufferAttribute(array,n,attr.normalized));}
 const cut=new THREE.Mesh(part,mesh.material);cut.name=mesh.name+' (the part looked at)';cut.matrixAutoUpdate=false;cut.matrix.copy(mesh.matrixWorld);cut.matrixWorld.copy(mesh.matrixWorld);
 cut.userData.cutOut=true;return cut;
}

/**
 * The meshes of the thing at `point` (world coordinates) under `root`: near it, small enough to be a thing and not the room,
 * not a person (their skinned bodies), not ink, not a drawn card. `anchor`'s own meshes always count.
 */
export function lookTargetsNear(root,point,{anchor=null,near=LOOK_PICK.near,largest=LOOK_PICK.largest,reach=LOOK_PICK.reach}={}){
 const found=[],cuts=[],box=new THREE.Box3(),size=new THREE.Vector3(),own=new Set();
 anchor?.traverse?.(o=>{if(o.isMesh)own.add(o);});
 root.updateMatrixWorld(true);
 const usable=o=>o.isMesh&&!o.isSkinnedMesh&&!o.isInstancedMesh&&!o.userData.outline&&!!o.geometry;
 const small=o=>{box.setFromObject(o);box.getSize(size);return Math.max(size.x,size.y,size.z)<=largest;};
 root.traverse(o=>{
  if(!usable(o))return;
  if(!o.geometry.boundingBox)o.geometry.computeBoundingBox();
  box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);box.getSize(size);
  const across=Math.max(size.x,size.y,size.z),printed=(Array.isArray(o.material)?o.material:[o.material]).some(m=>m?.map);
  if(own.has(o))found.push(o);
  else if(box.distanceToPoint(point)<=near){
   // A printed surface much bigger than the thing (a merged wall of prints) gives only its part; anything else whole,
   // if it is thing-sized.
   if(printed&&across>2*reach)cuts.push(o);else if(across<=largest)found.push(o);
  }
 });
 // The whole of the thing: a piece found brings the rest of the group it belongs to, if that group is thing-sized (the
 // poster's print brings its four pins at the corners), never the room it stands in.
 const whole=new Set(found);
 for(const o of found){const g=o.parent;if(!g||g===root||!small(g))continue;g.traverse(m=>{if(usable(m))whole.add(m);});}
 // A merged room's part of the thing: only from a mesh painted with prints or pictures (a map), not its plain walls.
 for(const o of cuts){const part=nearPart(o,point,reach);if(part)whole.add(part);}
 return [...whole];
}

const CSS=`
#lookViewer{position:fixed;inset:0;z-index:2000;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;
 background:radial-gradient(ellipse at 50% 40%,rgba(255,255,255,.28),rgba(0,0,0,.62) 74%);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);
 font-family:var(--line-font,-apple-system,BlinkMacSystemFont,"SF Pro Text",Arial,"Noto Sans JP",sans-serif);touch-action:none;user-select:none;-webkit-user-select:none}
#lookViewer[hidden]{display:none}
#lookViewer canvas{position:absolute;inset:0;width:100%;height:100%;cursor:grab}
#lookViewer canvas:active{cursor:grabbing}
#lookViewer .lv-card{position:relative;margin:0 12px max(12px,env(safe-area-inset-bottom));width:min(560px,calc(100% - 24px));box-sizing:border-box;background:#fff;color:#000;
 border:1px solid #e5e5e5;border-radius:12px;box-shadow:0 2px 8px rgb(0 0 0 / .08);padding:16px;max-height:40dvh;overflow:auto}
#lookViewer .lv-name{font-size:18px;line-height:1.35;font-weight:700;margin:0 0 4px}
#lookViewer .lv-text{font-size:14px;line-height:1.5;margin:0 0 12px;color:#444;white-space:pre-line}
#lookViewer .lv-hint{font-size:12px;color:#777;margin:0 0 12px}
#lookViewer button{min-height:44px;width:100%;border:0;border-radius:8px;background:var(--line-green,#06c755);color:#fff;font:600 15px/1 inherit;cursor:pointer}
#lookViewer button:focus-visible{outline:3px solid #16805c;outline-offset:2px}`;

export function createLookViewer({onClose=()=>{}}={}){
 const style=document.createElement('style');style.textContent=CSS;document.head.append(style);
 const root=document.createElement('section');root.id='lookViewer';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');
 const canvas=document.createElement('canvas');
 const card=document.createElement('div');card.className='lv-card';
 const name=document.createElement('h2');name.className='lv-name';
 const text=document.createElement('p');text.className='lv-text';
 const hint=document.createElement('p');hint.className='lv-hint';hint.textContent='Drag to turn · pinch or scroll to come closer';
 const close=document.createElement('button');close.textContent='Close';
 card.append(name,text,hint,close);root.append(canvas,card);document.body.append(root);root.setAttribute('aria-labelledby','lookViewerName');name.id='lookViewerName';
 let renderer=null,frame=0,open=false,stage=null,yaw=0,pitch=.15,distance=1,base=1,centre=new THREE.Vector3(),drag=null;const touches=new Map();let pinch=null;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.01,100);
 scene.add(new THREE.HemisphereLight(0xfff6e6,0x5b6470,1.9));const key=new THREE.DirectionalLight(0xffffff,1.6);key.position.set(2,3,2.5);scene.add(key);
 // The thing is framed in the space above the card, not behind it: the view is the lower part of a taller one whose
 // centre sits half way down that space.
 let fit=1;
 const resize=()=>{if(!renderer)return;const w=innerWidth,h=innerHeight,below=Math.min(h*.6,card.offsetHeight+24);fit=(h+below)/Math.max(1,h-below);renderer.setSize(w,h,false);
  camera.aspect=w/(h+below);camera.setViewOffset(w,h+below,0,below,w,h);camera.updateProjectionMatrix();};
 function draw(){if(!open)return;frame=requestAnimationFrame(draw);
  const c=Math.cos(pitch);camera.position.set(centre.x+Math.sin(yaw)*c*distance,centre.y+Math.sin(pitch)*distance,centre.z+Math.cos(yaw)*c*distance);camera.lookAt(centre);
  key.position.copy(camera.position).add(new THREE.Vector3(1,2,0));renderer.render(scene,camera);}
 function shut(){if(!open)return;open=false;cancelAnimationFrame(frame);root.hidden=true;if(stage){stage.traverse(o=>{if(o.userData.cutOut)o.geometry.dispose();});scene.remove(stage);stage=null;}document.documentElement.classList.remove('looking');onClose();}
 close.onclick=shut;
 addEventListener('keydown',e=>{if(open&&(e.key==='Escape'||e.code==='KeyQ')){e.preventDefault();e.stopImmediatePropagation();shut();}},{capture:true});
 canvas.addEventListener('pointerdown',e=>{touches.set(e.pointerId,[e.clientX,e.clientY]);if(touches.size===2){const [a,b]=[...touches.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,distance};drag=null;return;}drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(touches.has(e.pointerId))touches.set(e.pointerId,[e.clientX,e.clientY]);
  if(pinch&&touches.size>=2){const [a,b]=[...touches.values()];distance=THREE.MathUtils.clamp(pinch.distance*pinch.d/(Math.hypot(a[0]-b[0],a[1]-b[1])||1),base*.25,base*2.2);return;}
  if(!drag)return;yaw-=(e.clientX-drag.x)*.008;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.006,-1.2,1.2);drag={x:e.clientX,y:e.clientY};});
 const up=e=>{touches.delete(e.pointerId);if(touches.size<2)pinch=null;drag=null;};canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);
 canvas.addEventListener('wheel',e=>{e.preventDefault();distance=THREE.MathUtils.clamp(distance*(1+e.deltaY*.0015),base*.25,base*2.2);},{passive:false});
 addEventListener('resize',resize);
 return {
  get active(){return open;},
  close:shut,
  /** `meshes`: the town's own meshes (shared, never changed); `from`: where the looker stands, for the first view. */
  open({title,detail,meshes,from}){
   if(!meshes?.length)return false;
   if(!renderer){renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;}
   stage=new THREE.Group();
   for(const m of meshes){const copy=new THREE.Mesh(m.geometry,m.material);copy.userData.cutOut=!!m.userData.cutOut;copy.matrixAutoUpdate=false;copy.matrix.copy(m.matrixWorld);copy.layers.set(0);copy.name=m.name;stage.add(copy);}
   scene.add(stage);stage.updateMatrixWorld(true);
   name.textContent=title||'';text.textContent=detail||'';text.hidden=!detail;root.hidden=false;resize();
   const box=new THREE.Box3().setFromObject(stage),sphere=box.getBoundingSphere(new THREE.Sphere());centre.copy(sphere.center);
   // (whole, with a margin, in the space above the card)
   base=distance=Math.max(.2,sphere.radius)/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.08*fit;
   // The first view is from where the looker stands, level with the thing.
   const toward=from?new THREE.Vector3().subVectors(from,centre):new THREE.Vector3(0,0,1);yaw=Math.atan2(toward.x,toward.z);pitch=.08;
   name.textContent=title||'';text.textContent=detail||'';text.hidden=!detail;
   root.hidden=false;open=true;document.documentElement.classList.add('looking');resize();draw();close.focus();return true;
  },
 };
}
