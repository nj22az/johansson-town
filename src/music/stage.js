import * as THREE from '../../vendor/three.module.js';
import {buildAvatar} from '../avatars/build.js';
import {createAvatarAnimator} from '../avatars/animate.js';
import {performanceAt} from './show.js';

/** Compact concert set, drawn with World's renderer. Never allocates a second WebGL context. */
export function createConcertStage(){
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x102b30);scene.fog=new THREE.Fog(0x102b30,13,25);let previousTime=0;
 const camera=new THREE.PerspectiveCamera(42,1,.1,40),actors=[],bulbs=[],materials=[],geometries=[],textures=[],aim=new THREE.Vector3(0,1.15,-.3),cameraGoal=new THREE.Vector3(),aimGoal=new THREE.Vector3();
 const mat=(colour,glow=false)=>{const m=glow?new THREE.MeshBasicMaterial({color:colour}):new THREE.MeshStandardMaterial({color:colour,roughness:.85});materials.push(m);return m;};
 const wood=mat(0x77554a),edge=mat(0xd9af79),dark=mat(0x203238),curtain=mat(0x8e4946),gold=mat(0xf1c780,true),teal=mat(0x4ca99d),cream=mat(0xf8e5bc,true);
 function mesh(g,m,position,parent=scene){geometries.push(g);const o=new THREE.Mesh(g,m);o.position.set(...position);parent.add(o);return o;}
 const box=(size,at,m,parent)=>mesh(new THREE.BoxGeometry(...size),m,at,parent);
 const sphere=(r,at,m,parent)=>mesh(new THREE.SphereGeometry(r,12,8),m,at,parent);
 scene.add(new THREE.HemisphereLight(0xfff2dc,0x34404a,2.1));
 const key=new THREE.DirectionalLight(0xffdec0,3.1);key.position.set(0,5,5);scene.add(key);
 const rim=new THREE.DirectionalLight(0x73cdca,2.3);rim.position.set(-4,3,-2);scene.add(rim);
 box([16,.16,16],[0,-.42,0],dark);
 box([7,.36,3.8],[0,-.2,-.45],wood);box([7,.08,.1],[0,-.02,1.49],edge);
 for(let i=0;i<18;i++)box([.36,.015,3.75],[-3.3+i*.39,-.013,-.45],i%2?edge:wood);
 box([2,.17,.45],[0,-.31,1.7],wood);
 box([7.6,4,.18],[0,1.6,-2.65],dark);
 // Vertical folds and a high valance frame the cast, with room for four bodies.
 for(const side of [-1,1])for(let i=0;i<6;i++){
  const fold=mesh(new THREE.CylinderGeometry(.22,.26,3.7,12),curtain,[side*(3.15+i*.16),1.5,-2.3+i*.04]);fold.scale.z=.7;
 }
 box([7.8,.45,.45],[0,3.45,-2.4],curtain);box([7.8,.08,.5],[0,3.19,-2.4],gold);
 box([4.25,1.05,.12],[0,2.45,-2.48],teal);
 const sign=document.createElement('canvas');sign.width=1024;sign.height=256;
 const c=sign.getContext('2d');c.fillStyle='#133b3d';c.fillRect(0,0,1024,256);c.strokeStyle='#ebc58b';c.lineWidth=5;c.strokeRect(15,15,994,226);
 c.fillStyle='#fff0c8';c.textAlign='center';c.font='600 95px Georgia';c.fillText('MINATO',512,125);c.font='25px sans-serif';c.fillText('K A R A O K E   ·   S I N C E   1 9 8 7',512,190);
 const texture=new THREE.CanvasTexture(sign);textures.push(texture);const signMat=new THREE.MeshBasicMaterial({map:texture});materials.push(signMat);mesh(new THREE.PlaneGeometry(4.2,1.05),signMat,[0,2.45,-2.40]);
 for(let i=0;i<15;i++)bulbs.push(sphere(.045,[-3.4+i*.486,3.09,-2.12],i%2?gold:cream));
 for(const side of [-1,1]){
  box([.58,1.35,.6],[side*3.0,.66,.4],dark);
  for(const y of [.3,.85]){const speaker=mesh(new THREE.CylinderGeometry(.20,.20,.025,20),mat(0x111a20),[side*3,y,.72]);speaker.rotation.x=Math.PI/2;}
  sphere(.055,[side*3.0,1.18,.72],gold);
  const stand=mesh(new THREE.CylinderGeometry(.028,.035,2.3,10),dark,[side*3.4,1.15,-.8]);
  const lamp=sphere(.17,[side*3.4,2.35,-.8],gold);lamp.scale.z=.7;
  const pool=mesh(new THREE.CircleGeometry(1,40),mat(side<0?0x397f78:0x9e6862),[side*1.7,.005,-.3]);pool.rotation.x=-Math.PI/2;
 }
 const discoBall=sphere(.23,[0,3.0,-.7],mat(0xb8ece8));
 const halos=[];
 for(const side of [-1,1]){
  const material=new THREE.MeshBasicMaterial({color:0x73cdca,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide});materials.push(material);
  const beam=mesh(new THREE.ConeGeometry(.65,3.5,16,1,true),material,[side*2.5,1.6,-1.3]);beam.rotation.z=side*.25;halos.push(beam);
 }
 function clearCast(){for(const a of actors){a.mic.removeFromParent();a.held.removeFromParent();for(const o of a.local){o.geometry.dispose();const i=geometries.indexOf(o.geometry);if(i>=0)geometries.splice(i,1);}a.holder.removeFromParent();a.avatar.body.skeleton.dispose();a.avatar.dispose();}actors.length=0;}
 function setCast(cast){
  clearCast();cast.forEach(({name,recipe,outfit},index)=>{
   const avatar=buildAvatar(recipe,{shadows:false,faceSize:256}),animator=createAvatarAnimator(avatar),holder=new THREE.Group();holder.name=name;
   if(['sailor','nozomi'].includes(outfit))avatar.wear(outfit);
   holder.add(avatar.root);holder.rotation.y=Math.PI;holder.position.set((index-(cast.length-1)/2)*1.22,0,cast.length>2&&index%3===0?-.35:0);scene.add(holder);
   // A proper stand microphone sized to each singer; its capsule is in front of the mouth, leaving the face visible.
   const m=avatar.measure,micY=m.headCentre-m.Rh*.43;
   const mic=new THREE.Group();mic.position.set(holder.position.x,micY,.48);scene.add(mic);
   const stem=mesh(new THREE.CylinderGeometry(.014,.018,micY,8),dark,[0,-micY/2,0],mic);
   const foot=mesh(new THREE.CylinderGeometry(.16,.18,.025,16),dark,[0,-micY+.013,0],mic);
   const capsule=sphere(.047,[0,0,0],edge,mic);capsule.scale.set(.8,.8,1.45);
   // Disposed with the actor holder rather than accumulating on cast changes.
   const held=new THREE.Group();held.name='Handheld karaoke microphone';held.position.set(0,-.035,.025);avatar.bones.handR.add(held);
   const grip=mesh(new THREE.CylinderGeometry(.018,.018,.13,10),dark,[0,.035,0],held),head=sphere(.035,[0,.115,0],edge,held);
   const local=[stem,foot,capsule,grip,head];mic.userData.concertMic=true;held.visible=false;
   actors.push({name,avatar,animator,holder,mic,held,local,baseX:holder.position.x,baseZ:holder.position.z});
  });
 }
 function frame(seconds,cue,score,{view='auto',reduced=false,cheering=false,vocalCue=null}={}){
  const reset=seconds<previousTime||!cue,dt=Math.max(0,Math.min(.1,seconds-previousTime));previousTime=seconds;
  const beat=seconds/(score?.beat||.6),performing=cue?.phase==='singing',bow=cue?.phase==='bow',front=actors.length||1;
  for(let i=0;i<actors.length;i++){
   const a=actors[i],b=a.avatar.bones,direction=score?performanceAt(score,seconds,i,front,{reduced,cheering}):null;
   const move=performing?direction.move:null;
   if(move!==a.move){a.animator.stop();if(move)a.animator.play(move);a.move=move;}
   a.animator.update(reduced?0:dt,{expression:direction?.expression||'smile',performBeat:beat+i*.12,performEnergy:direction?.energy||0});
   a.holder.position.x=a.baseX+(performing?direction.step:0);a.holder.rotation.y=Math.PI+(performing?direction.turn:0);
   a.held.visible=performing&&!['AirGuitar','RobotDance'].includes(move);a.mic.visible=!a.held.visible;
   if(bow){const bend=Math.sin(Math.min(1,(beat-36)/3)*Math.PI);b.chest.rotation.x+=bend*.36;b.spine.rotation.x+=bend*.16;b.head.rotation.x+=bend*.18;}
   const mouth=vocalCue?vocalCue.speaking&&(vocalCue.line===3||vocalCue.singer===i)?.65+.25*Math.sin(seconds*22):0:direction?.mouth||0;
   a.avatar.paintFace({expression:direction?.expression||'smile',blink:direction?.blink||0,talk:performing?mouth:0,look:[performing?Math.sin(beat*.3+i)*.12:0,0]});
   a.avatar.root.updateMatrixWorld(true);
  }
  // Slow moves only, never a flash or strobe. A fixed wide view is always available.
  const director=score?performanceAt(score,seconds,0,front,{reduced,cheering}):null;
  const auto=view==='auto'&&performing&&!reduced,close=auto&&score.song.performance!=='relaxed'&&director.shot==='lead';
  const distance=close?3.25:Math.max(6.4,front*1.9),angle=auto?Math.sin(seconds*.24)*.18:0,leadX=close?(actors[director.leadIndex]?.holder.position.x||0):0;
  cameraGoal.set(leadX+Math.sin(angle)*distance,close?1.65:2.0,Math.cos(angle)*distance);aimGoal.set(leadX,close?1.12:1.15,-.15);
  if(reset||camera.position.lengthSq()===0){camera.position.copy(cameraGoal);aim.copy(aimGoal);}else{const ease=1-Math.exp(-Math.max(dt,.008)*3.3);camera.position.lerp(cameraGoal,ease);aim.lerp(aimGoal,ease);}
  camera.lookAt(aim);
  camera.updateMatrixWorld();
  for(let i=0;i<bulbs.length;i++)bulbs[i].scale.setScalar(1+(reduced?0:Math.sin(seconds*.8+i*.4)*.06));
  rim.color.setHex(score?.style.colour||0x73cdca);discoBall.visible=['disco','eurobeat'].includes(score?.song.style);discoBall.rotation.y=reduced?0:seconds*.35;
  for(let i=0;i<halos.length;i++){halos[i].material.color.setHex(score?.style.colour||0x73cdca);halos[i].material.opacity=cheering?.20:.10;halos[i].rotation.z=(i?1:-1)*(.25+(reduced?0:Math.sin(seconds*.4+i)*.12));}
 }
 return {scene,camera,cast:setCast,frame,get actors(){return actors;},dispose(){clearCast();for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();}};
}
