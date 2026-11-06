import * as THREE from '../../vendor/three.module.js';
import {assetURL} from '../assets.js';

// Add further supplied clips here. Each cycle uses every clip once, with no
// immediate repeat between cycles when the playlist contains multiple clips.
export const ADVERTISING_CLIPS=[{file:'video/izakaya-ad.mp4',poster:'video/izakaya-ad.jpg',aspect:1}];
export function shuffledPlaylist(length,previous=-1,random=Math.random){
 const order=Array.from({length},(_,i)=>i);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 if(order.length>1&&order[0]===previous)[order[0],order[1]]=[order[1],order[0]];
 return order;
}

// Mount the set on the right wall, clear of the back-wall radio and its grille.
// The square supplied film is
// pillarboxed inside a curved 4:3 tube instead of stretching the picture.
export function createIzakayaTV({parent,position=[5.94,2.72,-3.65],yaw=-Math.PI/2,clips=ADVERTISING_CLIPS,video=document.createElement('video')}){
 const group=new THREE.Group();group.name='Minato CRT television';group.position.set(...position);group.rotation.y=yaw;parent.add(group);
 const cabinet=new THREE.MeshStandardMaterial({color:0x654637,roughness:.78}),plastic=new THREE.MeshStandardMaterial({color:0x383632,roughness:.65}),metal=new THREE.MeshStandardMaterial({color:0x222927,roughness:.72}),glass=new THREE.MeshBasicMaterial({color:0x101b18,toneMapped:false});
 function box(size,position,material,name){const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...position);mesh.name=name;group.add(mesh);return mesh;}
 box([.86,.63,.50],[0,0,-.02],cabinet,'Wood veneer cabinet');
 box([.80,.56,.035],[0,0,.247],plastic,'Deep charcoal bezel');
 const tube=new THREE.PlaneGeometry(.60,.45,20,16),points=tube.attributes.position;
 for(let i=0;i<points.count;i++)points.setZ(i,.022*(1-(points.getX(i)/.30)**2)*(1-(points.getY(i)/.225)**2));
 tube.computeVertexNormals();
 const backing=new THREE.Mesh(new THREE.PlaneGeometry(.60,.45),glass);backing.position.set(-.066,0,.27);group.add(backing);
 const material=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 const screen=new THREE.Mesh(tube,material);screen.position.set(-.066,0,.273);screen.name='CRT video screen';screen.userData.dynamic=true;group.add(screen);
 for(const y of [.145,.035]){const dial=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.022,16),metal);dial.rotation.x=Math.PI/2;dial.position.set(.323,y,.28);group.add(dial);box([.006,.042,.004],[.323,y,.294],cabinet,'Channel dial marker');}
 for(let i=0;i<6;i++)box([.096,.008,.008],[.322,-.068-i*.022,.27],metal,'Speaker grille');
 const led=new THREE.Mesh(new THREE.SphereGeometry(.006,6,4),new THREE.MeshBasicMaterial({color:0xbca46a}));led.position.set(.323,-.245,.273);group.add(led);
 for(const x of [-.29,.29])box([.055,.038,.30],[x,-.328,-.04],metal,'TV feet');
 box([1.0,.055,.68],[0,-.374,-.055],cabinet,'Television shelf');
 // The horizontal arm meets the front of its wall plate, rather than crossing
 // through it with both steel side faces at the same depth.
 for(const x of [-.33,.33]){box([.035,.31,.035],[x,-.55,-.34],metal,'Wall bracket');box([.035,.035,.4425],[x,-.413,-.10125],metal,'Shelf support');}
 const texture=new THREE.VideoTexture(video);texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='none';video.setAttribute('playsinline','');video.setAttribute('webkit-playsinline','');
 let order=[],current=-1,visible=false,playingRequest=false,blocked=false,disposed=false,poster=null,failed=new Set();
 const frustum=new THREE.Frustum(),matrix=new THREE.Matrix4(),centre=new THREE.Vector3(),normal=new THREE.Vector3(),toward=new THREE.Vector3();
 function play(){
  if(disposed||!visible||blocked||playingRequest||!video.paused||current<0)return;
  playingRequest=true;
  Promise.resolve(video.play?.()).catch(()=>{blocked=true;}).finally(()=>{playingRequest=false;if(!visible)video.pause?.();});
 }
 function select(){
  if(disposed||!clips.length||failed.size===clips.length)return;
  if(!order.length)order=shuffledPlaylist(clips.length,current);
  let next=order.shift();while(failed.has(next)){if(!order.length)order=shuffledPlaylist(clips.length,current);next=order.shift();}
  current=next;blocked=false;
  const clip=clips[current];video.loop=clips.length===1;video.src=assetURL(clip.file);
  poster?.dispose();poster=null;material.map=null;material.color.set(0x1b2727);
  if(clip.poster){poster=new THREE.TextureLoader().load(assetURL(clip.poster));poster.colorSpace=THREE.SRGBColorSpace;material.map=poster;material.color.set(0xffffff);}
  material.needsUpdate=true;
  const aspect=clip.aspect||1,tubeAspect=4/3;screen.scale.set(Math.min(1,aspect/tubeAspect),Math.min(1,tubeAspect/aspect),1);
  video.load?.();play();
 }
 function loaded(){if(disposed)return;material.map=texture;material.color.set(0xffffff);material.needsUpdate=true;play();}
 function ended(){select();}
 function error(){failed.add(current);select();}
 function gesture(){blocked=false;play();}
 function hide(){visible=false;video.pause?.();}
 function visibility(){if(document.hidden)hide();}
 video.addEventListener('loadeddata',loaded);video.addEventListener('ended',ended);video.addEventListener('error',error);
 document.addEventListener('pointerdown',gesture);document.addEventListener('keydown',gesture);document.addEventListener('visibilitychange',visibility);
 return {group,screen,video,update({camera,active=false,paused=false}){
  if(disposed)return;
  group.updateWorldMatrix(true,false);camera.updateMatrixWorld();screen.getWorldPosition(centre);
  normal.set(0,0,1).transformDirection(group.matrixWorld);camera.getWorldPosition(toward).sub(centre);
  matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(matrix);
  visible=active&&!paused&&!document.hidden&&toward.lengthSq()<16*16&&normal.dot(toward)>0&&frustum.intersectsSphere(new THREE.Sphere(centre,.43));
  if(!visible){video.pause?.();return;}
  if(current<0)select();else play();
 },dispose(){if(disposed)return;disposed=true;hide();video.removeAttribute?.('src');video.load?.();
  video.removeEventListener('loadeddata',loaded);video.removeEventListener('ended',ended);video.removeEventListener('error',error);
  document.removeEventListener?.('pointerdown',gesture);document.removeEventListener?.('keydown',gesture);document.removeEventListener?.('visibilitychange',visibility);
  texture.dispose();poster?.dispose();const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());group.removeFromParent();
 }};
}
