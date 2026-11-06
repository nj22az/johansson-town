import * as THREE from '../../../vendor/three.module.js';
import {homeExitLabel} from './home-exit-label.js';
import {GLTFLoader} from '../../../vendor/GLTFLoader.js';
import {assetURL} from '../../assets.js';
import {homeRoutine,sleepHours} from '../../people/home-life.js';
import {TATAMI_HOME_LAYOUT} from './tatami-home-layout.js';

// Smooth, clock-derived state: reopening a home at night immediately finds bedding
// already down. It does not require another saved flag or change the town's clock.
export function createFutonRoutine(profile){
 let amount=0,initial=true;
 return {update(dt,minutes){
  const id=homeRoutine(profile,minutes).id,needed=['bedtime','sleep','wake'].includes(id);
  const target=needed?1:0;if(initial){amount=target;initial=false;}else amount=THREE.MathUtils.clamp(amount+(needed?1:-1)*Math.max(0,dt)/1.8,0,1);
  return {amount,needed,phase:amount===0?'stored':amount===1?'laid out':needed?'unfolding':'folding away'};
 }};
}

export function buildTatamiHome({site,profile,room,box,reg,collider,action,exit}){
 const shell=new THREE.Group();shell.name='Blender tatami home';room.add(shell);
 const fallback=new THREE.Group();shell.add(fallback);
 const part=(s,p,c)=>box(s,p,c,fallback,false);
 part([6,.06,6],[0,-.03,0],0xc6bd83);
 for(const x of [-3,3])part([.08,2.8,6],[x,1.4,0],0xeee4cb);
 part([6,2.8,.08],[0,1.4,-3],0xeee4cb);
 for(const x of [-2.15,2.15])part([1.7,2.8,.08],[x,1.4,3],0xeee4cb);
 part([1.25,1.35,.56],[-1.95,.675,-2.57],0x86643e);
 part([1.18,.07,.78],[-1.65,.35,1.45],0x86643e);
 part([.65,.12,.60],[-1.0,.065,2.10],0x63775e);
 const fallbackBed=new THREE.Group();fallbackBed.name='LaidFuton';fallback.add(fallbackBed);
 box([1.18,.15,2.15],[.65,.095,-.6],0xeee4cb,fallbackBed,false);
 box([1.1,.055,1.43],[.65,.19,-.32],0x63775e,fallbackBed,false);
 box([.85,.16,.4],[.65,.23,-1.42],0xeee4cb,fallbackBed,false);
 // Furniture footprints leave both the entry and the bedtime route clear.
 collider(-1.95,-2.57,1.25,.56,1.35);collider(-1.65,1.45,1.18,.78,.39);collider(2.35,1.8,.66,.42,1.44);
 let workRequired=false,workStage=null,workAge=0,observedNeed=null;
 let disposed=false,model=null,elapsed=0,lastMinutes=0,bedding={amount:0,phase:'stored'};
 const routine=createFutonRoutine(profile);
 function apply(){
  const bed=model?.getObjectByName('LaidFuton')||fallbackBed,stored=model?.getObjectByName('StoredFuton');
  bed.visible=bedding.amount>.001;bed.scale.set(1,1,Math.max(.03,bedding.amount));
  if(stored)stored.visible=bedding.amount<.05;
  const cupboard=model?.getObjectByName('FutonCupboardDoor');if(cupboard)cupboard.position.x=2.25-1.35*Math.sin(bedding.amount*Math.PI);
  const rotor=model?.getObjectByName('FanRotor');if(rotor)rotor.rotation.z=elapsed*9;
  shell.userData.futon={...bedding};
 }
 // Room-local lazy load; visitors can enter immediately. A late download cannot
 // resurrect a room after exit. Clone materials so normal room cleanup owns them.
 const ready=(typeof document==='undefined'||!document.baseURI)?Promise.resolve(false):new GLTFLoader().loadAsync(assetURL('models/tatami-home/tatami-home.glb')).then(gltf=>{
  if(disposed){gltf.scene.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m?.dispose();});return false;}
  model=gltf.scene;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  // The supplied rear paper stops at 2.35 m and its rail starts at 2.37 m.
  // Back the 20 mm aperture with an overlapping header behind both front faces.
  const header=box([6,.1,.06],[0,2.375,-3.045],0x6d5238,model,false);
  header.name='Rear fusuma header backing';header.castShadow=false;header.receiveShadow=false;
  shell.add(model);fallback.visible=false;apply();return true;
 }).catch(e=>{console.warn('Tatami home uses its simple furnishings until the model is available',e);return false;});
 const anchor=(pos,label,fn)=>{const o=new THREE.Object3D();o.position.set(...pos);shell.add(o);reg(o,label,fn,true);return o;};
 anchor([2.1,1,-2.1],'Inspect the futon cupboard',()=>action('inspect','Futon cupboard',profile.name+' keeps the mattress, quilt and pillow here during the day. At bedtime the futon is laid on the tatami; after waking it is folded away. It is currently '+bedding.phase+'.'));
 anchor([-1.95,1.1,-2.15],'Look at the tea cabinet',()=>action('inspect','The tea cabinet','A wooden glass-front cabinet holds rice bowls, tea cups and two tins of barley tea. The pendulum clock above keeps island time.'));
 anchor([2.35,1.1,1.4],'Inspect the standing fan',()=>action('inspect','Summer standing fan','A pale green three-blade fan keeps this little room comfortable through the island summer.'));
 const hours=sleepHours(profile),fmt=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
 anchor([-1.65,.55,1.1],'Read daily routine',()=>action('read',profile.name+' at home','Tea at the low table, a quiet fan, and bedding stored until evening. Usually sleeps at '+fmt(hours.sleep)+' and wakes at '+fmt(hours.wake)+'.'));
 const cushion=anchor([-1.0,.7,2.1],'Sit at the tea table',()=>action('seat','Tatami tea table','A cushion beside the low tea table.'));cushion.userData.npcInteraction=false;cushion.userData.seat={position:[-1.0,0,2.1],stand:[-.15,0,2.1],front:TATAMI_HOME_LAYOUT.tableSeatFront,surfaceY:.125,eyeY:.85,yaw:Math.PI/4,pitch:0};
 anchor(TATAMI_HOME_LAYOUT.exit,homeExitLabel(site,profile),exit);
 shell.add(new THREE.HemisphereLight(0xfff0d4,0x887958,1.5));const lamp=new THREE.PointLight(0xffe7b7,1.5,9,2);lamp.position.set(0,2.4,-.65);shell.add(lamp);
 return {...TATAMI_HOME_LAYOUT,home:true,ready,tick(dt,minutes){elapsed+=dt;lastMinutes=minutes;const needed=['bedtime','sleep','wake'].includes(homeRoutine(profile,minutes).id);
 if(observedNeed!==null&&needed!==observedNeed){workRequired=true;workStage='walk';workAge=0;}observedNeed=needed;
 bedding=routine.update(workRequired&&workStage==='walk'?0:dt,minutes);apply();},
 prepareBedding(person,walker,dt){if(!workRequired)return false;const g=person.g,target=bedding.needed?[2.05,0,-1.4]:TATAMI_HOME_LAYOUT.bedside;
 g.userData.activity=bedding.needed?'taking the futon out of the cupboard':'folding the futon away';
 if(workStage==='walk'){if(!walker.move(person,target,dt))return true;workStage='arrange';}
 g.rotation.set(0,bedding.needed?Math.PI:0,0);g.userData.socialPose='Interact';workAge+=dt;if(workAge>=1.8){workRequired=false;workStage=null;}return true;},snapshot(){return {owner:profile.name,modelReady:!!model,minutes:lastMinutes,beddingActivity:workRequired?(bedding.needed?'taking out':'putting away'):null,futon:{...bedding}};},dispose(){disposed=true;}};
}
