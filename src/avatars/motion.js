import * as THREE from '../../vendor/three.module.js';

/** Original Johansson motion interchange and retargeting. No inference models or upstream Prompt2Rig code. */
export const MOTION_JOINTS=Object.freeze(['hips','spine','chest','neck','head','shoulderL','elbowL','handL','shoulderR','elbowR','handR','thighL','kneeL','footL','thighR','kneeR','footR']);
const MIXAMO={hips:'Hips',spine:'Spine',chest:'Spine2',neck:'Neck',head:'Head',shoulderL:'LeftArm',elbowL:'LeftForeArm',handL:'LeftHand',shoulderR:'RightArm',elbowR:'RightForeArm',handR:'RightHand',thighL:'LeftUpLeg',kneeL:'LeftLeg',footL:'LeftFoot',thighR:'RightUpLeg',kneeR:'RightLeg',footR:'RightFoot'};
const short=name=>name.replace(/^mixamorig\d*[:_]?/i,'');
const fail=message=>{throw new Error(message);};

/**
 * A motion file, checked: `johansson-motion` version 1 (the joints' turns over time), or version 2, which adds what a
 * performance made in Blender carries (tools/blender/drink-can.py): `shapes` (how far each hand is closed, build.js grip:
 * closeR/closeL, and hooked: hookR/hookL), `face` (blink, breath, smile, and look: the eyes on what is in the hands; kaa, the
 * breath out after a long draught; foam, a moustache of it on the upper lip; swallow, each swallow's beat; shrug, the shoulders up:
 * cues the face painter and the player take), `prop` (tab: how far a can's ring is lifted, of the way it goes before it tears), `contact` (how far
 * a contact the game keeps is on: lip, ring, mouth, pocket; a glass's foot on the counter, held in the hand, the left hand's
 * fingers wiping the upper lip; lean, how far the body leans in for a counter), `fill` (what is left in what is drunk), each a number 0..1 a sample;
 * `events` ({t, name}) and `markers` (name: time); `reach`, each wrist's path (reachPaths). Every track has a value a sample.
 */
export function normalizeMotion(value){
 if(!value||value.format!=='johansson-motion'||(value.version!==1&&value.version!==2))fail('Choose a Johansson motion file.');
 const times=value.times;
 if(!Array.isArray(times)||times.length<2||times.length>901||times[0]!==0||times.at(-1)<=0||times.at(-1)>30)fail('Motion must last at most 30 seconds, with 2–901 samples starting at zero.');
 if(times.some((t,i)=>!Number.isFinite(t)||i>0&&t<=times[i-1]))fail('Motion sample times must increase.');
 const joints={};
 for(const name of MOTION_JOINTS){
  const data=value.joints?.[name];if(data===undefined)continue;
  if(!Array.isArray(data)||data.length!==times.length*4||data.some(n=>!Number.isFinite(n)))fail('Invalid joint samples: '+name);
  joints[name]=data.slice();
  for(let i=0;i<data.length;i+=4){const length=Math.hypot(...data.slice(i,i+4));if(length<.1||length>2)fail('Invalid joint rotation: '+name);for(let j=0;j<4;j++)joints[name][i+j]/=length;}
 }
 if(!Object.keys(joints).length)fail('The motion contains no supported body joints.');
 const name=typeof value.name==='string'?value.name.slice(0,60)||'Motion':'Motion';
 if(value.version===1)return {format:'johansson-motion',version:1,name,times:times.slice(),joints};
 const end=times.at(-1),track=(label,data)=>{if(!Array.isArray(data)||data.length!==times.length||data.some(n=>!Number.isFinite(n)||n<-1e-6||n>1+1e-6))fail('Invalid '+label+' track.');return data.slice();};
 const group=(key,names)=>{const out={};for(const [n,data] of Object.entries(value[key]||{})){if(!names.includes(n))fail('Unknown '+key+' track: '+n);out[n]=track(n,data);}return out;};
 const events=(value.events||[]).map(e=>{if(!e||typeof e.name!=='string'||!Number.isFinite(e.t)||e.t<0||e.t>end)fail('Invalid motion event.');return {t:e.t,name:e.name};});
 const markers={};for(const [n,t] of Object.entries(value.markers||{})){if(!Number.isFinite(t)||t<0||t>end)fail('Invalid motion marker: '+n);markers[n]=t;}
 return {format:'johansson-motion',version:2,name,times:times.slice(),joints,shapes:group('shapes',['closeR','closeL','hookR','hookL']),face:group('face',['blink','breath','smile','look','kaa','foam','swallow','shrug']),prop:group('prop',['tab']),
  contact:group('contact',['lip','ring','mouth','pocket','counter','hold','wipe','lean']),fill:value.fill===undefined?null:track('fill',value.fill),events,markers,reach:reachPaths(value.reach,times.length),props:value.props&&typeof value.props==='object'?JSON.parse(JSON.stringify(value.props)):{}};
}
/** Where each wrist goes (`reach`: R and L, [x, y, z] a sample in the chest's frame, in the body's own size: the game's
 *  metres over its k), so a body built otherwise puts its hands where the animated body did, for its size; `mouth`, the
 *  right wrist from the lower lip in the head's frame, which it goes by as far as `contact.mouth` says. */
function reachPaths(value,n){
 if(value===undefined)return null;const out={};
 for(const [side,data] of Object.entries(value||{})){if(!['R','L','mouth','mouthL','foot','spot'].includes(side)||!Array.isArray(data)||data.length!==n*3||data.some(v=>!Number.isFinite(v)||Math.abs(v)>2))fail('Invalid reach path: '+side);out[side]=data.slice();}
 return out;
}
/** A track's value at time t (a 0..1 track sampled with the motion's times): eased between samples as the joints are. */
export function sampleTrack(motion,data,t){
 const T=motion.times;if(!data)return 0;if(t<=T[0])return data[0];if(t>=T.at(-1))return data.at(-1);
 let lo=0,hi=T.length-1;while(hi-lo>1){const mid=(lo+hi)>>1;if(T[mid]<=t)lo=mid;else hi=mid;}
 return data[lo]+(data[hi]-data[lo])*(t-T[lo])/(T[hi]-T[lo]);
}

export function motionClip(value){
 const motion=normalizeMotion(value);
 return new THREE.AnimationClip(motion.name,motion.times.at(-1),Object.entries(motion.joints).map(([name,data])=>new THREE.QuaternionKeyframeTrack(name+'.quaternion',motion.times,data)));
}

/** Sampling is independent of the game animator: absent joints retain their ordinary pose. */
export function createMotionPlayer(value){
 const motion=normalizeMotion(value),clip=motionClip(motion),tracks=clip.tracks.map(t=>[t.name.split('.')[0],t.createInterpolant()]);
 return {motion,duration:clip.duration,apply(avatar,time){
  const t=Math.max(0,Math.min(clip.duration,Number.isFinite(time)?time:0));
  for(const [name,track] of tracks)avatar.bones[name]?.quaternion.fromArray(track.evaluate(t));
  avatar.root.updateMatrixWorld(true);
 }};
}

/** A small original reference take, playable without a file, account or service. */
export function waveMotion(){
 const times=Array.from({length:91},(_,i)=>i/30),joints=Object.fromEntries(MOTION_JOINTS.map(n=>[n,[]])),q=new THREE.Quaternion(),e=new THREE.Euler();
 for(const t of times){
  const rise=THREE.MathUtils.smoothstep(t,0,.6)*(1-THREE.MathUtils.smoothstep(t,2.4,3));
  for(const name of MOTION_JOINTS){
   e.set(0,0,0);
   if(name==='shoulderR')e.set(-.25*rise,0,-1.9*rise);
   if(name==='elbowR')e.set(-.45*rise,0,Math.sin(t*11)*.25*rise);
   if(name==='handR')e.set(0,0,Math.sin(t*11)*.16*rise);
   q.setFromEuler(e).toArray(joints[name],joints[name].length);
  }
 }
 return normalizeMotion({format:'johansson-motion',version:1,name:'A friendly wave',times,joints});
}

/** Bake a single skinned native/Mixamo rig onto a fresh Johansson avatar, in place.
 * Uses bind transforms, never assumes the first animated frame is the rest pose.
 * Only rotations are transferred: the target's bone lengths, scale and position stay its own.
 */
export function retargetMotion(source,clip,target){
 if(!clip||!Number.isFinite(clip.duration)||clip.duration<=0||clip.duration>30)fail('Choose an animation lasting up to 30 seconds.');
 const skeletons=new Map();source.traverse(o=>{if(o.isSkinnedMesh)skeletons.set(o.skeleton.bones.map(b=>b.uuid).sort().join('/'),o.skeleton);});
 if(skeletons.size!==1)fail('Choose a file with one character skeleton.');
 const skeleton=[...skeletons.values()][0],sourceBones={};
 for(const bone of skeleton.bones){const key=short(bone.name);if(sourceBones[key])fail('The source has ambiguous bone names.');sourceBones[key]=bone;}
 const native=!!sourceBones.hips,map=native?Object.fromEntries(MOTION_JOINTS.map(n=>[n,n])):{...MIXAMO};
 if(!native&&!sourceBones.Spine2)map.chest=sourceBones.Spine1?'Spine1':'Spine';
 const required=['hips','spine','shoulderL','elbowL','shoulderR','elbowR','thighL','kneeL','thighR','kneeR'];
 if(required.some(n=>!sourceBones[map[n]]))fail('This skeleton is not a supported Johansson or Mixamo body rig.');
 const sourceState=[],targetState=[];
 source.traverse(o=>sourceState.push([o,o.position.clone(),o.quaternion.clone(),o.scale.clone()]));
 for(const bone of Object.values(target.bones))targetState.push([bone,bone.position.clone(),bone.quaternion.clone(),bone.scale.clone()]);
 const restore=list=>{for(const [o,p,q,s] of list){o.position.copy(p);o.quaternion.copy(q);o.scale.copy(s);}};
 const mixer=new THREE.AnimationMixer(source);
 try{
  skeleton.pose();source.updateMatrixWorld(true);
  // A Mixamo bind is a T-pose; Johansson's authored bind has the arms at the sides.
  if(!native){target.bones.shoulderL.rotation.z=Math.PI/2;target.bones.shoulderR.rotation.z=-Math.PI/2;}
  target.root.updateMatrixWorld(true);
  const names=MOTION_JOINTS.filter(n=>sourceBones[map[n]]&&target.bones[n]);
  const sourceRest=Object.fromEntries(names.map(n=>[n,sourceBones[map[n]].getWorldQuaternion(new THREE.Quaternion()).invert()]));
  const targetRest=Object.fromEntries(names.map(n=>[n,target.bones[n].getWorldQuaternion(new THREE.Quaternion())]));
  const align=targetRest.hips.clone().multiply(sourceRest.hips),inverseAlign=align.clone().invert();
  // Parent-first order is deliberate: local rotations depend on the newly posed parent.
  const count=Math.ceil(clip.duration*30),times=Array.from({length:count+1},(_,i)=>i*clip.duration/count),joints=Object.fromEntries(names.map(n=>[n,[]]));
  const q=new THREE.Quaternion(),parent=new THREE.Quaternion();
  const action=mixer.clipAction(clip);action.setLoop(THREE.LoopOnce,1);action.clampWhenFinished=true;action.play();
  for(const t of times){
   mixer.setTime(t);source.updateMatrixWorld(true);
   for(const name of names){
    sourceBones[map[name]].getWorldQuaternion(q);
    q.premultiply(align).multiply(sourceRest[name]).multiply(inverseAlign).multiply(targetRest[name]);
    const bone=target.bones[name];bone.parent.getWorldQuaternion(parent).invert();bone.quaternion.copy(parent.multiply(q));bone.updateMatrixWorld(true);
    bone.quaternion.toArray(joints[name],joints[name].length);
   }
  }
  return normalizeMotion({format:'johansson-motion',version:1,name:clip.name||'Imported motion',times,joints});
 }finally{mixer.stopAllAction();mixer.uncacheRoot(source);restore(sourceState);restore(targetState);source.updateMatrixWorld(true);target.root.updateMatrixWorld(true);}
}
