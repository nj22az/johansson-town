import * as THREE from '../../vendor/three.module.js';
import {sampleCycle,advanceCycle,CYCLE_DURATION,SIP_FLOW_START,ease} from '../drinking/cycle.js';
import {requiredTilt,volumeAtPlane} from '../drinking/liquid.js';
import {createLiquid} from '../drinking/vessel.js';
import {drinkGrip,reach,HOLD_Q} from './consume.js';
import {faceLayout} from './face.js';
import {shapeHeadPoint} from './head-profile.js';

const Y=new THREE.Vector3(0,1,0),X=new THREE.Vector3(1,0,0),HALF_TURN=new THREE.Quaternion().setFromAxisAngle(Y,Math.PI);
const mix=(a,b,t)=>a+(b-a)*t;
const point=(a,b,t,arc=0)=>a.clone().lerp(b,t).addScaledVector(Y,arc*4*t*(1-t));

/** The rendered mouth, in the actual head's frame, shared across all cast recipes. */
export function avatarMouth(avatar){
 const own=avatar.pixar?.mouthPoint?.();if(own)return own;   // (a Pixar body's own lips, pixar.js)
 const m=avatar.measure,L=faceLayout(avatar.recipe),theta=Math.PI*.28+L.mouthY/256*Math.PI*.58,phi=Math.PI/2-.95+L.mouthX/256*1.9;
 const p=shapeHeadPoint(new THREE.Vector3(-Math.cos(phi)*Math.sin(theta),Math.cos(theta),Math.sin(phi)*Math.sin(theta)),m.profile);
 return avatar.bones.head.localToWorld(new THREE.Vector3(p.x*m.Rh*m.headSX,m.headCentre-m.headY+p.y*m.Rh*m.headSY,p.z*m.Rh*.98+.025*m.k));
}

/** A single loose vessel may move; bottle-and-cup arrangements need separate meshes. */
export const TABLE_DRINK_KINDS=Object.freeze(['draft','can','awamori','oolong']);

/** A held drink's liquid kept level as the hand tips it (the counter performance's liquid, for a resident's jug). */
export function levelHeldDrink(prop){return prop?.userData?.drinkSurface?.liquid?fluidFor(prop):null;}

function fluidFor(prop){
 if(prop.userData.tableDrinkFluid)return prop.userData.tableDrinkFluid;
 const surface=prop.userData.drinkSurface,source=surface?.liquid,kind=prop.userData.drinkKind;
 const h=prop.userData.rimHeight||.15,r=source?.geometry?.parameters?.radiusTop||prop.userData.grip?.radius||.039;
 const base=source?source.position.y-source.geometry.parameters.height/2:.006,top=h-.0008,n=48;
 const capacity=n*Math.sin(2*Math.PI/n)/2*r*r*(top-base)*1e6;
 const starting=source?n*Math.sin(2*Math.PI/n)/2*r*r*source.geometry.parameters.height*1e6:capacity*.9;
 const profile={id:kind,segments:n,innerRadiusBottom:r*.96,innerRadiusTop:r,interiorBottom:base,interiorTop:top,
  capacityMl:capacity*(.96*.96+.96+1)/3,liquidRimContact:[-r,top,0],height:h,
  liquidColor:source?.material?.color?.getHex()||0xc18c36,liquidOpacity:kind==='awamori'?.38:kind==='draft'?1:.92,
  hasFoam:!!surface?.head,foamHeight:kind==='draft'?.018:.006,hasIce:['awamori','oolong'].includes(kind),startingVolumeMl:starting};
 const liquid=source?createLiquid(profile):null;
 if(liquid)prop.add(liquid.root);
 const api={profile,liquid,startingVolumeMl:Math.min(starting,profile.capacityMl),update(fraction){
  if(!liquid)return;
  prop.updateWorldMatrix(true,false);
  const normal=Y.clone().applyQuaternion(prop.getWorldQuaternion(new THREE.Quaternion()).invert());
  liquid.update(api.startingVolumeMl*Math.max(0,Math.min(1,fraction)),normal);
 }};
 prop.userData.tableDrinkFluid=api;
 if(prop.userData.level)prop.userData.level.visible=false;
 if(prop.userData.pour?.bubbles)prop.userData.pour.bubbles.visible=false;
 api.update(prop.userData.portion??1);return api;
}

function setWorld(object,position,quaternion){
 const world=new THREE.Matrix4().compose(position,quaternion,new THREE.Vector3(1,1,1));
 if(object.parent){object.parent.updateWorldMatrix(true,false);world.premultiply(object.parent.matrixWorld.clone().invert());}
 world.decompose(object.position,object.quaternion,object.scale);object.matrixAutoUpdate=true;object.updateWorldMatrix(false,true);
}

/** A solid mitten clasps the handle without entering the hollow mug body. Its
 * authored palm is an ellipsoid (0.9 hand radii wide); the opposing thumb is a
 * sphere 0.55 radii inwards and 0.42 radii forwards. Fit both to the actual shell,
 * leaving 1 mm clear of the body while keeping the handle inside the clasp.
 */
function tableGrip(prop,m,profile){
 const grip=drinkGrip(prop,m);
 if(prop.userData.grip?.handle==null||m.realHand)return grip;   // (a real hand's clearance is drinkGrip's own)
 const shell=prop.getObjectByName('Hollow '+prop.userData.drinkKind+' glass');
 shell?.geometry?.computeBoundingBox();
 const bounds=shell?.geometry?.boundingBox;
 // The handle lies in the XY plane, so the shell's Z extent measures the body.
 const radius=bounds?Math.max(Math.abs(bounds.min.z),Math.abs(bounds.max.z))*shell.scale.z:profile.innerRadiusTop+.006;
 const h=m.hand,clearRadius=radius+.001,thumbRadius=h*.42;
 const palmClearance=clearRadius+h*.9;
 const thumbClearance=h*.55+Math.sqrt((clearRadius+thumbRadius)**2-thumbRadius**2);
 grip.x=Math.max(grip.x,palmClearance,thumbClearance);
 return grip;
}

/**
 * The existing cast adapter for the same sober timeline as the side-view simulator.
 * The table vessel keeps its parent: there is no second prop or attachment switch.
 * Call after the base seated pose and seat support have updated the world matrices.
 */
export function createAvatarTableDrink(avatar,lease,{onComplete=()=>{},onCancel=()=>{}}={}){
 const prop=lease.prop,body=avatar.root,b=avatar.bones,m=avatar.measure;
 body.updateWorldMatrix(true,true);prop.updateWorldMatrix(true,true);
 const originalParent=prop.parent,restP=prop.getWorldPosition(new THREE.Vector3()),restQ=prop.getWorldQuaternion(new THREE.Quaternion());
 const restHand=b.handR.getWorldPosition(new THREE.Vector3()),restHandQ=b.handR.getWorldQuaternion(new THREE.Quaternion());
 const restingHand=b.handL.getWorldPosition(new THREE.Vector3()),restingHandQ=b.handL.getWorldQuaternion(new THREE.Quaternion());
 const fluid=fluidFor(prop),profile=fluid.profile,rim=new THREE.Vector3(0,prop.userData.rimHeight,profile.innerRadiusTop+.002);
 const forward=new THREE.Vector3(0,0,1).transformDirection(body.matrixWorld),liftP=restP.clone().addScaledVector(Y,.065).addScaledVector(forward,-.014);
 const gripOffset=new THREE.Vector3(0,-m.hand*.55,0).add(tableGrip(prop,m,profile));
 let elapsed=0,active=true,last=null,maxWristError=0,lastFlow=0,lookAt=null;
 const restHead=b.head.rotation.x,restSpine=b.spine.rotation.x,restChest=b.chest.rotation.x;
 const restShoulder=b.shoulderR.position.clone();
 const realHand=!!m.realHand,g=prop.userData.grip||{};
 const contact=(mouth,tilt,away=0)=>{
  const q=heldQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(X,tilt));
  return {q,p:mouth.clone().addScaledVector(forward,away).sub(rim.clone().applyQuaternion(q))};
 };
 // A real hand (a Pixar body's, with finger bones) holds a jug by its handle as a person does: the wrist beside the
 // handle, the palm toward the glass, the fingers through the handle's hole (toward the glass's +z) to curl round its
 // bar, the thumb on top; a glass without a handle the same way round its body. The hand bone is the wrist; the
 // knuckles come half a hand along, in the plane of the handle. (The mitten is turned half round instead, its palm
 // being an ellipsoid either way.) The owner, 27 October 2026: "align ... the hand too so he can drink beer".
 // The hand's frame in the glass's: the palm (+x of the hand) toward the glass (-x of the glass, the handle being at +x),
 // the knuckle line (+z of the hand, pinky to index) up the bar (+y), so the fingers (-y of the hand) point -z through
 // the handle's hole and curl round its bar, and the thumb (+z of the hand) is on top. A right-handed turn.
 // (HOLD_Q: consume.js, shared with every resident's hand on a jug)
 // Where the bar (or a glass's side) is in the glass's frame, and where it lies in the curled hand (pixar.js holdPoint):
 // the wrist goes where those two meet, so the jug is in the hand (the owner, 27 October 2026: "he is not holding the
 // beer, model a beer jug that fits in his hand").
 const holdIn=avatar.pixar?.holdPoint?.('R',1)||null;
 const barAt=g.handle!=null?new THREE.Vector3(g.handle-(g.bar??.008),g.height??.08,0):new THREE.Vector3((g.radius??.04)+.012,g.height??.06,0);
 const wrist=(p,q)=>{if(realHand&&holdIn){const handQ=q.clone().multiply(HOLD_Q);return {p:p.clone().add(barAt.clone().applyQuaternion(q)).sub(holdIn.centre.clone().applyQuaternion(handQ)),q:handQ};}
  const handQ=q.clone().multiply(HALF_TURN);return {p:p.clone().sub(gripOffset.clone().applyQuaternion(handQ)),q:handQ};};
 // (and the jug turned in the hand as it is lifted, so its handle is at his right and he drinks from the far side; it
 // stays so when it is set down)
 const rightDir=new THREE.Vector3(-1,0,0).transformDirection(body.matrixWorld),heldQ=realHand&&g.handle!=null?new THREE.Quaternion().setFromAxisAngle(Y,Math.atan2(-rightDir.z,rightDir.x)):restQ.clone();
 const tableHand=wrist(restP,restQ);
 // (the reach stops a few centimetres short of the handle, behind it, with the fingers still open: they passed through the
 // bar on the way in; the grasp slides the hand on as the fingers close)
 const reachHand=realHand?{p:tableHand.p.clone().add(new THREE.Vector3(0,.004,.11).applyQuaternion(restQ)),q:tableHand.q}:tableHand;   // (a finger's length back: open fingers reach that far)
 // The free hand rests on the counter beside the jug's spot, palm down, fingers forward (a Pixar body; the mitten keeps
 // its lap): the judges of the counter frames, "the free hand hangs in the air at counter height, resting on nothing".
 const left=b.shoulderL.getWorldPosition(new THREE.Vector3()).sub(b.shoulderR.getWorldPosition(new THREE.Vector3())).setY(0).normalize();
 const toCounter=restP.clone().sub(b.shoulderL.getWorldPosition(new THREE.Vector3()).lerp(b.shoulderR.getWorldPosition(new THREE.Vector3()),.5)).setY(0).normalize();
 const counterHand=realHand?restP.clone().addScaledVector(left,.27).addScaledVector(toCounter,-.03).add(new THREE.Vector3(0,.022,0)):null;
 const counterHandQ=realHand?new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),toCounter.clone().negate(),new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),toCounter.clone().negate()))):null;
 let reachLean=.26;
 // Fit the same reach to each existing cast recipe. The pelvis stays on its seat;
 // shorter arms use a little more torso reach, never a longer forearm.
 for(;reachLean<.42;reachLean+=.01){
  b.spine.rotation.x=restSpine+reachLean*.62;b.chest.rotation.x=restChest+reachLean*.38;body.updateWorldMatrix(true,true);
  if(b.shoulderR.getWorldPosition(new THREE.Vector3()).distanceTo(tableHand.p)<(m.upper+m.fore)*.985)break;
 }
 b.spine.rotation.x=restSpine;b.chest.rotation.x=restChest;body.updateWorldMatrix(true,true);

 function renderAt(t,{allowConsumption=false}={}){
  const phase=sampleCycle(t),u=phase.progress,s=phase.eased;
  const volume=fluid.startingVolumeMl*(prop.userData.portion??lease.startFraction);
  // Raise only as far as the currently available liquid needs. During the flow part,
  // the target follows the same requested remaining volume as the lab controller.
  const desiredFraction=mix(lease.startFraction,lease.endFraction,phase.flowProgress);
  const flowTilt=requiredTilt(profile,Math.max(.0001,fluid.startingVolumeMl*desiredFraction));
  const tip=phase.id==='SIP'?mix(.12,flowTilt,ease(u/SIP_FLOW_START)):flowTilt;
  const near=['CONTACT','SIP','SWALLOW'].includes(phase.id),headWeight=phase.id==='SIP'?ease(u/SIP_FLOW_START):phase.id==='SWALLOW'?1-s:0;
  // The game animator supplies a fresh base pose every rendered frame. These offsets
  // are reapplied from that pose, so paused frames and subdivision do not accumulate.
  let reachWeight=0;
  if(phase.id==='PREPARE')reachWeight=.15*s;
  if(phase.id==='REACH')reachWeight=.15+.85*s;
  if(phase.id==='GRASP')reachWeight=1;
  if(phase.id==='LIFT')reachWeight=1;
  if(phase.id==='APPROACH')reachWeight=1-.8*s;
  if(near)reachWeight=.2;
  if(phase.id==='RECOVER')reachWeight=.2+.8*s;
  if(phase.id==='SET_DOWN')reachWeight=1;
  if(phase.id==='RELEASE')reachWeight=1;
  if(phase.id==='RETURN')reachWeight=1-s;
  b.spine.rotation.x=restSpine+reachLean*.62*reachWeight;
  b.chest.rotation.x=restChest+reachLean*.38*reachWeight;
  b.head.rotation.x=restHead-.08*headWeight;
  // A Pixar body drinks like a cartoon (the owner, 27 October 2026: "make the beer drinking look like it's from a
  // cartoon"): the head goes back as the jug tips, three gulps bob it, the chest leans back, the elbow comes up and
  // out as he drains it, and he comes down with a satisfied nod; the hand closes on the jug (grip) from the reach to
  // the release. The liquid, the rim at the lips and the timing are the sober performance's.
  const cartoon=!!avatar.pixar,tipShare=cartoon?THREE.MathUtils.clamp(tip/1.1,0,1):0,drain=headWeight*tipShare;
  if(cartoon){
   b.head.rotation.x-=.24*drain;b.chest.rotation.x-=.12*drain;
   if(phase.id==='SIP')b.head.rotation.x+=.035*Math.sin(u*Math.PI*6)*headWeight;
   if(phase.id==='RECOVER'){b.head.rotation.x+=.14*Math.sin(Math.PI*s);b.chest.rotation.x-=.05*Math.sin(Math.PI*s);}
   avatar.pixar.grip?.('R',phase.id==='REACH'||phase.id==='PREPARE'?.1:phase.id==='GRASP'?.1+.9*THREE.MathUtils.smoothstep(s,.55,1):phase.id==='RETURN'?1-s:1);

  }
  b.shoulderR.position.copy(restShoulder);b.shoulderR.position.y+=.016*headWeight;
  body.updateWorldMatrix(true,true);
  const mouth=avatarMouth(avatar),pre=contact(mouth,.12,.027),at=contact(mouth,.12),hold=contact(mouth,tip);
  let glassP=restP.clone(),glassQ=restQ.clone(),handP=restHand.clone(),handQ=restHandQ.clone(),controller='TABLE';
  const liftQ=heldQ.clone();
  switch(phase.id){
   case 'PREPARE':break;
   case 'REACH':handP=point(restHand,reachHand.p,s,.035);handQ.slerp(reachHand.q,s);break;
   case 'GRASP':handP=reachHand.p.clone().lerp(tableHand.p,Math.min(1,s/.6));handQ.copy(tableHand.q);break;   // (the hand slides on in the first part, open; the fingers close after)
   case 'LIFT':glassP.lerp(liftP,s);glassQ.copy(restQ).slerp(heldQ,s);controller='TRAJECTORY';break;
   case 'APPROACH':glassP=point(liftP,pre.p,s,.045);glassQ.copy(liftQ).slerp(pre.q,s);controller='TRAJECTORY';break;
   case 'CONTACT':{const k=contact(mouth,.12,.027*(1-s));glassP=k.p;glassQ=k.q;controller='MOUTH';break;}
   case 'SIP':glassP=hold.p;glassQ=hold.q;controller='MOUTH';break;
   case 'SWALLOW':{const k=contact(mouth,mix(requiredTilt(profile,Math.max(.0001,volume)),.12,s));glassP=k.p;glassQ=k.q;controller='MOUTH';break;}
   case 'RECOVER':glassP=point(at.p,liftP,s,.025);glassQ.copy(at.q).slerp(liftQ,s);controller='TRAJECTORY';break;
   case 'SET_DOWN':glassP=point(liftP,restP,s);glassQ.copy(liftQ).slerp(realHand?heldQ:restQ,s);controller='TRAJECTORY';break;
   case 'RELEASE':{const h=realHand?wrist(restP,heldQ):tableHand;handP.copy(h.p);handQ.copy(h.q);glassQ.copy(realHand?heldQ:restQ);break;}
   case 'RETURN':{const h=realHand?wrist(restP,heldQ):tableHand;handP=point(h.p,restHand,s,.035);handQ.copy(h.q).slerp(restHandQ,s);glassQ.copy(realHand?heldQ:restQ);break;}
  }
  if(phase.index>=4&&phase.index<=10){const h=wrist(glassP,glassQ);handP=h.p;handQ=h.q;}
  // (a Pixar body's eyes on the jug as he reaches for it and lifts it, shut for the sip and the swallow, a cartoon
  // drinking with its eyes closed; the happy face after, below)
  // (a Pixar body's eyes on the jug as he reaches for it and lifts it: `lookAt`, which the actor hands the animator as
  // his gaze; shut for the sip and the swallow, a cartoon drinking with its eyes closed; the happy face after, below)
  lookAt=cartoon&&['PREPARE','REACH','GRASP','LIFT','APPROACH'].includes(phase.id)?glassP.clone().add(new THREE.Vector3(0,.14,0)):null;
  if(cartoon&&phase.id==='SIP')avatar.paintFace({blink:1});
  setWorld(prop,glassP,glassQ);
  // The last mouthfuls tip the jug far over, and its handle (his wrist) swings out away from the lips: a short arm
  // (Mr Fujita's) would then be asked for more than its length, and the hand would come off the handle. A person
  // brings the shoulder forward for it, so the shoulder goes toward the hand by what the straight arm lacks (a few
  // millimetres; never more than 3 cm, a shoulder's own reach), and the forearm stays its length.
  {const sw=b.shoulderR.getWorldPosition(new THREE.Vector3()),ew=b.elbowR.getWorldPosition(new THREE.Vector3()),hw=b.handR.getWorldPosition(new THREE.Vector3());
   const arm=(sw.distanceTo(ew)+ew.distanceTo(hw))*.998,short=sw.distanceTo(handP)-arm;
   if(short>0){const to=sw.clone().addScaledVector(handP.clone().sub(sw).normalize(),Math.min(short,.03));
    b.shoulderR.position.copy(b.shoulderR.parent.worldToLocal(to));body.updateWorldMatrix(true,true);}}
  // (a Pixar body's elbow hangs below the shoulder through the whole performance, as consume.js poses its drink; the
  // cartoon's goes out to the side: the owner, 27 October 2026, "the arm gets stuck in his head")
  reach(avatar,handP,'R',avatar.pixar?[-.45-.5*drain,-1+.85*drain,.25]:-.25);
  b.handR.quaternion.copy(b.handR.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(handQ));
  b.handR.updateWorldMatrix(false,true);
  if(counterHand){reach(avatar,counterHand,'L',[.45,-1,.25]);b.handL.quaternion.copy(b.handL.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(counterHandQ));b.handL.updateWorldMatrix(false,true);avatar.pixar?.grip?.('L',.22);}
  else{reach(avatar,restingHand,'L');b.handL.quaternion.copy(b.handL.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(restingHandQ));b.handL.updateWorldMatrix(false,true);}
  const wristError=b.handR.getWorldPosition(new THREE.Vector3()).distanceTo(handP);maxWristError=Math.max(maxWristError,wristError);
  const actualRim=prop.localToWorld(rim.clone()),rimError=actualRim.distanceTo(mouth);
  const normal=Y.clone().applyQuaternion(glassQ.clone().invert());
  const liquidEdge=new THREE.Vector3(0,profile.interiorTop,profile.innerRadiusTop);
  const edgeVolume=volumeAtPlane(profile,normal,normal.dot(liquidEdge));
  const reachesEdge=volume+.02>=edgeVolume;
  const valid=phase.id==='SIP'&&rimError<.002&&wristError<.003&&reachesEdge;
  if(allowConsumption&&valid&&phase.flowProgress>lastFlow){lastFlow=phase.flowProgress;lease.consume(lastFlow);}
  fluid.update(prop.userData.portion??lease.startFraction);
  if(phase.id==='SWALLOW')avatar.paintFace({expression:'neutral',talk:Math.sin(Math.PI*u)*.08,blink:cartoon?1:0});
  else if(cartoon&&phase.id==='RECOVER')avatar.paintFace({expression:'happy',blink:s<.3?1:0});
  const fingersAt=avatar.pixar?.fingers?Object.fromEntries(Object.entries(avatar.pixar.fingers).filter(([n])=>/R[123]$/.test(n)).map(([n,b])=>[n,b.getWorldPosition(new THREE.Vector3()).toArray().map(v=>+v.toFixed(4))])):null;
  const barSeg=g.handle!=null?[barAt.clone().setY(g.opening?.[0]??(g.height-.05)),barAt.clone().setY(g.opening?.[1]??(g.height+.05))].map(v=>prop.localToWorld(v.clone()).toArray().map(x=>+x.toFixed(4))):null;
  last={...phase,controller,rimError,wristError,maxWristError,valid,tilt:phase.id==='SIP'?tip:0,consumedPortion:lease.consumedPortion,
   glassPosition:glassP.toArray(),glassUp:Y.clone().applyQuaternion(glassQ).toArray().map(v=>+v.toFixed(4)),restPosition:restP.toArray(),wristPosition:handP.toArray(),mouth:mouth.toArray(),
   fingers:fingersAt,bar:barSeg,glassRadius:profile.innerRadiusTop,glassHeight:profile.height,hold:holdIn?{centre:holdIn.centre.toArray(),span:+holdIn.span.toFixed(3)}:null};
  return last;
 }
 function finish(cancelled=false){
  if(!active)return;active=false;
  b.shoulderR.position.copy(restShoulder);avatar.pixar?.grip?.('R',0);
  if(prop.parent===originalParent){setWorld(prop,restP,realHand&&!cancelled?heldQ:restQ);fluid.update(prop.userData.portion??lease.startFraction);}
  const result={...(cancelled?lease.cancel():lease.finish()),volumeConsumedMl:Math.max(0,lease.startFraction-(prop.userData.portion??lease.startFraction))*fluid.startingVolumeMl};
  (cancelled?onCancel:onComplete)(result);return result;
 }
 return {
  prop,get active(){return active;},get elapsed(){return elapsed;},get diagnostics(){return last;},
  /** Where his eyes go while the performance has them (the jug as he reaches and lifts), or null. */
  get lookAt(){return lookAt;},
  renderAt,
  update(dt){
   if(!active)return last;if(!lease.active||prop.parent!==originalParent){finish(true);return last;}
   if(dt>0)elapsed=advanceCycle(elapsed,dt,t=>renderAt(t,{allowConsumption:true}));
   else renderAt(elapsed);
   if(elapsed>=CYCLE_DURATION)finish();return last;
  },
  cancel(){return finish(true);},
 };
}

/** Share skin attributes with the existing rig; only a small index buffer is new. */
export function createFirstPersonDrinkingArm(avatar){
 const root=new THREE.Group();root.name='Drinking arm, first person';avatar.root.add(root);
 const originals=[],copies=[];
 avatar.root.traverse(o=>{if((o.isMesh||o.isSprite)&&!o.userData.firstPersonDrinkingArm)originals.push([o,o.visible]);});
 for(const [source] of originals){
  if(!source.isSkinnedMesh)continue;
  const g=source.geometry,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;if(!si||!sw)continue;
  // (the arm's bones, the right hand's finger bones with them: a body with fingers keeps them in the first-person arm)
  const ids=new Set(source.skeleton.bones.map((bone,i)=>['shoulderR','elbowR','handR'].includes(bone.name)||/^(thumb|index|middle|ring|pinky)R[123]$/.test(bone.name)?i:-1));ids.delete(-1);
  const count=g.index?.count||g.attributes.position.count,index=[],groups=[];
  const armAt=i=>{let w=0;for(let k=0;k<4;k++)if(ids.has(si.getComponent(i,k)))w+=sw.getComponent(i,k);return w>.95;};
  for(let i=0;i<count;i+=3){const a=g.index?g.index.getX(i):i,c=g.index?g.index.getX(i+1):i+1,d=g.index?g.index.getX(i+2):i+2;
   if(!armAt(a)||!armAt(c)||!armAt(d))continue;
   const materialIndex=g.groups.find(group=>i>=group.start&&i<group.start+group.count)?.materialIndex||0,last=groups.at(-1);
   if(last?.materialIndex===materialIndex)last.count+=3;else groups.push({start:index.length,count:3,materialIndex});
   index.push(a,c,d);
  }
  if(!index.length)continue;
  const geometry=new THREE.BufferGeometry();for(const [name,attribute] of Object.entries(g.attributes))geometry.setAttribute(name,attribute);
  for(const [name,attributes] of Object.entries(g.morphAttributes))geometry.morphAttributes[name]=attributes;
  geometry.morphTargetsRelative=g.morphTargetsRelative;geometry.setIndex(index);geometry.groups=groups;
  const mesh=new THREE.SkinnedMesh(geometry,source.material);mesh.userData.firstPersonDrinkingArm=true;mesh.name=source.name+' drinking arm';
  mesh.bind(source.skeleton,source.bindMatrix);mesh.bindMode=source.bindMode;mesh.castShadow=source.castShadow;mesh.receiveShadow=source.receiveShadow;mesh.frustumCulled=false;
  root.add(mesh);copies.push({source,mesh});
 }
 let active=false;
 return {
  root,setVisible(show){
   if(show!==active){active=show;for(const [o,visible] of originals)o.visible=show?false:visible;}
   root.visible=show;
   if(show){avatar.root.updateWorldMatrix(true,true);const inv=avatar.root.matrixWorld.clone().invert();for(const {source,mesh} of copies){mesh.matrixAutoUpdate=false;mesh.matrix.copy(inv).multiply(source.matrixWorld);mesh.matrixWorldNeedsUpdate=true;mesh.morphTargetInfluences=source.morphTargetInfluences;}}
  },
  dispose(){for(const [o,visible] of originals)o.visible=visible;root.removeFromParent();for(const {mesh} of copies){
   // Attributes belong to the source mesh. Dispose only after detaching them so a
   // first-person inspection cannot evict the full avatar's GPU buffers.
   for(const name of Object.keys(mesh.geometry.attributes))mesh.geometry.deleteAttribute(name);mesh.geometry.morphAttributes={};mesh.geometry.dispose();
  }},
 };
}
