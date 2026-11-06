import * as THREE from '../../vendor/three.module.js';
import {DRINK_PROFILES} from './profiles.js';
import {createVessel} from './vessel.js';
import {requiredTilt, volumeAtPlane} from './liquid.js';
import {CYCLE_DURATION, DRINK_PHASES, sampleCycle, advanceCycle, ease, SIP_FLOW_START} from './cycle.js';

const V = (x=0,y=0,z=0) => new THREE.Vector3(x,y,z);
const Z = V(0,0,1), UP=V(0,1,0);
const mix = (a,b,t) => THREE.MathUtils.lerp(a,b,t);
const curve = (a,b,c,t) => a.clone().multiplyScalar((1-t)**2)
  .addScaledVector(b,2*(1-t)*t).addScaledVector(c,t*t);
export const TABLE_PLACEMENT = Object.freeze([.13,.743,.085]);

/** Base posture is sampled before mouth, prop and IK constraints. All phase ends
 * meet exactly: no change of elbow pole or posture at a state transition.
 */
function posture(frame, tilt) {
  const points = [
    [0,0,0],[-.014,-.055,.003],[-.035,-.04,.005],[-.035,-.025,.005],
    [-.02,-.005,.009],[-.012,.025,.012],[-.012,.025,.012],
    [-.006,.025,.018],[-.006,.025,.014],[-.02,-.005,.009],
    [-.035,-.04,.005],[-.022,-.025,.003],[0,0,0],
  ];
  if (!frame.busy) return {lean:0,head:0,neck:0,shoulder:0,swallow:0,breath:0};
  const i=frame.index, a=points[i-1], b=points[i], s=frame.eased;
  const headBack = Math.max(0,tilt-.42)*.31;
  const headWeight= i===6 ? .0 : i===7 ? ease(frame.progress/SIP_FLOW_START) : i===8 ? 1-frame.eased : 0;
  return {lean:-mix(a[0],b[0],s),head:mix(a[1],b[1],s)+headBack*headWeight,
    neck:headBack*headWeight*.20,shoulder:mix(a[2],b[2],s),
    swallow:frame.id==='SWALLOW' ? Math.sin(Math.PI*frame.progress)**2 : 0,
    jaw:frame.id==='CONTACT'?.035*s:frame.id==='SIP'?.035:frame.id==='SWALLOW'?.035*(1-s):0,breath:0};
}

/** Shared clock + constraints for the lab. The rig is a replaceable adapter; the
 * vessel has exactly one world transform, without attachment/reparenting switches.
 */
export class DrinkingSimulation extends EventTarget {
  constructor({scene,rig,drink='beer'}) {
    super();this.scene=scene;this.rig=rig;
    this.rest=V(...TABLE_PLACEMENT);this.elapsed=0;this.active=false;
    this.paused=false;this.speed=1;this.lastEvent=null;this.cycleNumber=0;
    this.selectDrink(drink);
  }
  selectDrink(id) {
    if (this.active || !DRINK_PROFILES[id]) return false;
    if(this.vessel) { this.scene.remove(this.vessel.root);this.vessel.dispose(); }
    this.profile=DRINK_PROFILES[id];this.vessel=createVessel(this.profile);
    this.scene.add(this.vessel.root);this.reset();return true;
  }
  reset() {
    this.active=false;this.paused=false;this.elapsed=0;this.lastEvent=null;
    this.volume=this.profile.startingVolumeMl;this.startVolume=this.volume;this.consumed=0;this.requested=0;
    this.evaluate(0,false);return true;
  }
  refill() {
    if(this.active)return false;
    this.volume=this.profile.startingVolumeMl;this.startVolume=this.volume;this.consumed=0;this.requested=0;
    this.evaluate(0,false);return true;
  }
  setVolume(volume) {
    if(this.active)return false;
    this.volume=THREE.MathUtils.clamp(volume,0,this.profile.capacityMl);
    this.startVolume=this.volume;this.consumed=0;this.requested=0;this.evaluate(0,false);return true;
  }
  sip() {
    if(this.active||this.volume<=.0001)return false;
    this.paused=false;this.active=true;this.elapsed=0;this.startVolume=this.volume;this.consumed=0;
    this.requested=Math.min(this.profile.sipAmountMl,this.startVolume);this.cycleNumber++;
    this.evaluate(0,true);return true;
  }
  update(dt) {
    if(this.paused||!this.active||!Number.isFinite(dt)||dt<=0)return;
    this.elapsed=advanceCycle(this.elapsed,dt*this.speed,t=>this.evaluate(t,true));
    if(this.elapsed>=CYCLE_DURATION-1e-9){
      const detail={drinkId:this.profile.id,volumeConsumedMl:this.consumed,remainingVolumeMl:this.volume};
      this.active=false;this.elapsed=0;this.lastEvent=detail;this.evaluate(0,false);
      this.dispatchEvent(new CustomEvent('sipCompleted',{detail}));
    }
  }
  /** Deterministic inspection, independent of the order frames are requested.
   * This explicitly starts a fresh sampled cycle and pauses playback.
   */
  renderAt(time,{volume=this.profile.startingVolumeMl}={}) {
    this.startVolume=THREE.MathUtils.clamp(volume,0,this.profile.capacityMl);
    this.requested=Math.min(this.profile.sipAmountMl,this.startVolume);this.volume=this.startVolume;this.consumed=0;
    this.elapsed=Math.max(0,Math.min(CYCLE_DURATION,time));this.active=this.elapsed<CYCLE_DURATION;
    const frame=sampleCycle(this.elapsed);
    // Evaluate the final contact sample before a later non-contact phase, exactly
    // as playback does. Never assert consumption merely from a phase name.
    if(frame.index>7 || frame.done) this.evaluate(DRINK_PHASES.slice(0,7).reduce((a,p)=>a+p.duration,0)-1e-8,true);
    this.evaluate(this.elapsed,true);this.paused=true;return this.diagnostics;
  }
  evaluate(time,active) {
    const f=sampleCycle(time,{active}),p=this.profile,v=this.vessel,rig=this.rig;
    const scheduled=this.startVolume-(this.requested||0)*f.flowProgress;
    // During flow the requested post-step volume sets the necessary angle. A
    // physically valid contact can consume at most that requested difference.
    const flowTilt=requiredTilt(p,Math.max(.00001,f.id==='SIP'?scheduled:Math.max(0,this.startVolume-(this.requested||0))));
    const pre=.13;
    let tilt=0;
    if(f.id==='LIFT')tilt=.025*f.eased;
    if(f.id==='APPROACH')tilt=mix(.025,pre,f.eased);
    if(f.id==='CONTACT')tilt=pre;
    if(f.id==='SIP')tilt=mix(pre,flowTilt,ease(f.progress/SIP_FLOW_START));
    if(f.id==='SWALLOW')tilt=mix(flowTilt,pre,f.eased);
    if(f.id==='RECOVER')tilt=mix(pre,.025,f.eased);
    if(f.id==='SET_DOWN')tilt=.025*(1-ease(Math.min(1,f.progress/.72)));
    rig.setPosture(posture(f,flowTilt));
    rig.root.updateMatrixWorld(true);
    const mouth=rig.mouth.getWorldPosition(V());
    const rim=v.markers.rim.position.clone(),q=new THREE.Quaternion().setFromAxisAngle(Z,tilt);
    const fromRim=(target,rotation=q)=>target.clone().sub(rim.clone().applyQuaternion(rotation));
    const approachOffset=V(.040,-.008,0);
    const near=fromRim(mouth.clone().add(approachOffset),new THREE.Quaternion().setFromAxisAngle(Z,pre));
    const lift=this.rest.clone().add(V(-.012,.075,0));
    const recover=this.rest.clone().add(V(-.018,.200,0));
    const pos=this.rest.clone();let controller='TABLE';
    if(f.id==='LIFT'){pos.lerp(lift,f.eased);controller='TRAJECTORY';}
    if(f.id==='APPROACH'){
      pos.copy(curve(lift,V(Math.max(lift.x,near.x)+.022,(lift.y+near.y)/2+.025,(lift.z+near.z)/2),near,f.eased));controller='TRAJECTORY';
    }
    if(f.id==='CONTACT'){pos.copy(fromRim(mouth.clone().addScaledVector(approachOffset,1-f.eased)));controller='MOUTH';}
    if(f.id==='SIP'||f.id==='SWALLOW'){pos.copy(fromRim(mouth));controller='MOUTH';}
    if(f.id==='RECOVER'){
      const start=fromRim(mouth,new THREE.Quaternion().setFromAxisAngle(Z,pre));
      pos.copy(curve(start,V((start.x+recover.x)/2+.030,(start.y+recover.y)/2+.015,recover.z*.6),recover,f.eased));controller='TRAJECTORY';
    }
    if(f.id==='SET_DOWN'){pos.lerpVectors(recover,this.rest,f.eased);controller=f.progress>=1?'TABLE':'TRAJECTORY';}
    v.root.position.copy(pos);v.root.quaternion.copy(q);v.root.updateMatrixWorld(true);
    const heldWrist=v.markers.grip.getWorldPosition(V()),heldQ=v.markers.grip.getWorldQuaternion(new THREE.Quaternion());
    const tableWrist=v.markers.grip.position.clone().add(this.rest);
    // Approach from the palm's outside. The fingertips extend farther than the
    // wrist: a straight wrist path alone would sweep them through the glass.
    const open=tableWrist.clone().add(V(0,.004,.035).applyQuaternion(v.markers.grip.quaternion));
    const rest=rig.restWrist.position.clone(),restQ=rig.restWrist.quaternion;
    const wrist=heldWrist.clone(),wristQ=heldQ.clone();
    if(!f.busy){wrist.copy(rest);wristQ.copy(restQ);}
    else if(f.id==='PREPARE'){wrist.copy(rest);wristQ.copy(restQ);}
    else if(f.id==='REACH'){
      wrist.copy(curve(rest,V((rest.x+open.x)/2-.018,Math.max(rest.y,open.y)+.040,Math.max(rest.z,open.z)+.14),open,f.eased));
      wristQ.copy(restQ).slerp(heldQ,f.eased);
    } else if(f.id==='GRASP') {wrist.lerpVectors(open,heldWrist,f.eased);}
    else if(f.id==='RELEASE'){wrist.lerpVectors(heldWrist,open,f.eased);}
    else if(f.id==='RETURN'){
      wrist.copy(curve(open,V((open.x+rest.x)/2,Math.max(open.y,rest.y)+.032,Math.max(rest.z,open.z)+.14),rest,f.eased));
      wristQ.copy(heldQ).slerp(restQ,f.eased);
    }
    // Pole is a fixed continuous anatomical direction, never a per-phase switch.
    const pole=V(-.25,.78,.41);
    rig.solveArm(wrist,wristQ,pole);rig.setGrip(p,f.grip);rig.root.updateMatrixWorld(true);
    const rimWorld=v.markers.rim.getWorldPosition(V()),mouthError=rimWorld.distanceTo(mouth);
    const tangent=Z.clone().applyQuaternion(q),mouthTangent=Z.clone().applyQuaternion(rig.mouth.getWorldQuaternion(new THREE.Quaternion()));
    const orientationError=Math.acos(THREE.MathUtils.clamp(Math.abs(tangent.dot(mouthTangent)),-1,1));
    const n=UP.clone().applyQuaternion(q.clone().invert());
    const flowPoint=V(...p.liquidRimContact),rimOffset=n.dot(flowPoint);
    const edgeVolume=volumeAtPlane(p,n,rimOffset);
    const reachesEdge=this.volume>=edgeVolume-.025;
    const valid=f.id==='SIP' && mouthError<.0005 && orientationError<.015 && reachesEdge;
    const before=this.volume;
    if(valid && scheduled<this.volume) this.volume=Math.max(0,scheduled);
    this.volume=THREE.MathUtils.clamp(this.volume,0,p.capacityMl);
    this.consumed=this.startVolume-this.volume;
    v.update(this.volume,0);
    this.frame=f;this.diagnostics={phase:f.id,phaseProgress:f.progress,elapsed:time,
      volumeMl:this.volume,consumedMl:this.consumed,controller,tiltRadians:tilt,requiredTilt:flowTilt,
      mouthError,orientationError,edgeVolumeMl:edgeVolume,flowValid:valid,flowing:this.volume<before,
      baseError:v.markers.base.getWorldPosition(V()).distanceTo(this.rest),
      gripClosure:f.grip,mouth:mouth.toArray(),rim:rimWorld.toArray(),wrist:wrist.toArray(),pole:pole.toArray(),
      ...rig.getDiagnostics()};
    return this.diagnostics;
  }
  dispose(){this.vessel.dispose();this.scene.remove(this.vessel.root);}
}
