import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from '../vendor/three.module.js';
import {createMannequin} from '../src/drinking/mannequin.js';
import {DrinkingSimulation,TABLE_PLACEMENT} from '../src/drinking/simulation.js';
import {CYCLE_DURATION,DRINK_PHASES,phaseStart} from '../src/drinking/cycle.js';
import {DRINK_PROFILES} from '../src/drinking/profiles.js';

const bytes=await readFile(new URL('../assets/models/drinking/drinking-mannequin.glb',import.meta.url));
async function fixture(){
  const rig=await createMannequin({arrayBuffer:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
  const scene=new THREE.Scene();scene.add(rig.root);
  const sim=new DrinkingSimulation({scene,rig});
  return {sim,rig,dispose(){sim.dispose();rig.dispose();}};
}
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
const near=(a,b,epsilon,label)=>assert.ok(Math.abs(a-b)<epsilon,`${label}: ${a} / ${b}`);

test('all three vessels: supported grasp, exact lip and wrist contact, full/half/final sip and release',async()=>{
  const f=await fixture();try{
    for(const p of Object.values(DRINK_PROFILES))for(const fill of [1,.5,.04]){
      f.sim.reset();f.sim.selectDrink(p.id);const initial=p.startingVolumeMl*fill;
      f.sim.setVolume(initial);const support=f.rig.getDiagnostics();let previous=initial;
      f.sim.sip();const phases=new Set();
      for(let step=0;step<Math.ceil(CYCLE_DURATION*60);step++){
        f.sim.update(1/60);const d=f.sim.diagnostics;phases.add(d.phase);
        assert.ok(!d.reachClamped,`${p.id}/${fill}/${d.phase}: fixed-length arm remains reachable`);
        assert.ok(d.wristError<1e-5,`${p.id}/${d.phase}: wrist reaches its requested contact`);
        assert.ok(distance(d.hips,support.hips)<1e-8,'hips remain on the seat');
        d.feet.forEach((v,i)=>assert.ok(distance(v,support.feet[i])<1e-8,'feet remain planted'));
        if(['PREPARE','REACH','GRASP','RELEASE','RETURN','IDLE'].includes(d.phase))near(d.baseError,0,1e-7,'base on placement');
        if(['LIFT','APPROACH','CONTACT','SIP','SWALLOW','RECOVER','SET_DOWN'].includes(d.phase))near(d.gripClosure,1,1e-9,'grip held during transport');
        if(['SIP','SWALLOW'].includes(d.phase)){assert.ok(d.mouthError<1e-7,'rim at measured lips');assert.ok(d.orientationError<1e-7,'rim tangent aligned to lips');}
        if(f.sim.volume<previous-1e-7){assert.equal(d.phase,'SIP','no consumption outside sip');assert.ok(d.flowValid,'physical flow gate is open');assert.ok(d.edgeVolumeMl<=previous+.025,'liquid has reached drinking edge');}
        assert.ok(f.sim.volume>=0&&f.sim.volume<=p.capacityMl,'bounded independent volume');
        if(d.gripClosure===1){assert.ok(d.fingerMinClearance>=-.0002,'fingers outside vessel wall');assert.ok(d.thumbMinClearance>=-.0002,'thumb outside vessel wall');}
        previous=f.sim.volume;
      }
      assert.equal(f.sim.active,false);assert.equal(phases.size,13,'all 12 phases and rest observed');
      near(f.sim.volume,Math.max(0,initial-p.sipAmountMl),1e-6,'actual consumed quantity');
      near(f.sim.lastEvent.volumeConsumedMl,Math.min(initial,p.sipAmountMl),1e-6,'completion event reports actual consumption');
    }
  }finally{f.dispose();}
});

test('phase boundaries keep world position and orientation continuous',async()=>{
  const f=await fixture();try{
    for(const id of Object.keys(DRINK_PROFILES)){
      f.sim.reset();f.sim.selectDrink(id);let time=0;
      for(const p of DRINK_PHASES){
        time+=p.duration;if(time>=CYCLE_DURATION)continue;
        f.sim.renderAt(time-1e-6);const before={p:f.sim.vessel.root.position.clone(),q:f.sim.vessel.root.quaternion.clone(),w:f.rig.wrist.getWorldPosition(new THREE.Vector3()),e:f.rig.elbow.getWorldPosition(new THREE.Vector3())};
        f.sim.renderAt(time+1e-6);const after={p:f.sim.vessel.root.position,q:f.sim.vessel.root.quaternion,w:f.rig.wrist.getWorldPosition(new THREE.Vector3()),e:f.rig.elbow.getWorldPosition(new THREE.Vector3())};
        for(const key of ['p','w','e'])assert.ok(before[key].distanceTo(after[key])<.00002,`${id}/${p.id}: ${key} position continuous`);
        assert.ok(before.q.angleTo(after.q)<.00002,`${id}/${p.id}: glass orientation continuous`);
      }
    }
  }finally{f.dispose();}
});

test('elapsed-time sampling agrees at 30/60/144 Hz, and delayed frames cannot lose flow',async()=>{
  const f=await fixture();try{
    const results=[];
    for(const dt of [1/30,1/60,1/144,.91]){
      f.sim.reset();f.sim.sip();let events=0;const on=()=>events++;f.sim.addEventListener('sipCompleted',on);
      for(let t=0;t<CYCLE_DURATION+dt;t+=dt)f.sim.update(dt);
      results.push(f.sim.volume);assert.equal(events,1,'one event per completed cycle');f.sim.removeEventListener('sipCompleted',on);
    }
    results.forEach(v=>near(v,results[0],1e-8,'frame-rate independent consumption'));
    f.sim.reset();f.sim.renderAt(3.5);const pose=JSON.stringify(f.sim.diagnostics);
    f.sim.renderAt(.7);f.sim.renderAt(5.8);f.sim.renderAt(3.5);
    assert.equal(JSON.stringify(f.sim.diagnostics),pose,'seek order does not affect contact, pose or volume');
  }finally{f.dispose();}
});

test('pause, repeated commands, resets during reach/sip/set-down and empty/refill are safe',async()=>{
  const f=await fixture();try{
    for(const phase of ['REACH','SIP','SET_DOWN']){
      f.sim.reset();assert.equal(f.sim.sip(),true);f.sim.update(phaseStart(phase)+.18);
      assert.equal(f.sim.sip(),false);assert.equal(f.sim.selectDrink('whiskey'),false);assert.equal(f.sim.refill(),false);
      f.sim.paused=true;const before=JSON.stringify(f.sim.diagnostics);f.sim.update(3);
      assert.equal(JSON.stringify(f.sim.diagnostics),before,'paused clock and liquid do not advance');
      f.sim.reset();assert.equal(f.sim.active,false);assert.equal(f.sim.paused,false);
      assert.deepEqual(f.sim.vessel.root.position.toArray(),TABLE_PLACEMENT);assert.equal(f.sim.diagnostics.phase,'IDLE');
      assert.equal(f.sim.volume,f.sim.profile.startingVolumeMl);
    }
    for(const p of Object.values(DRINK_PROFILES)){
      f.sim.selectDrink(p.id);let events=0;
      while(f.sim.volume>.0001){assert.ok(events<30,'bounded consecutive sips');assert.equal(f.sim.sip(),true);f.sim.update(CYCLE_DURATION+.1);events++;}
      assert.equal(f.sim.volume,0);assert.equal(f.sim.sip(),false);assert.equal(f.sim.refill(),true);
      assert.equal(f.sim.volume,p.startingVolumeMl);
    }
  }finally{f.dispose();}
});

test('a new sip resumes paused rest and a completed scrub without resuming a busy paused action',async()=>{
  const f=await fixture();try{
    f.sim.paused=true;
    assert.equal(f.sim.sip(),true,'a paused idle character accepts a new action');
    assert.equal(f.sim.paused,false,'the accepted action starts its clock');
    f.sim.update(CYCLE_DURATION+.1);
    near(f.sim.volume,f.sim.profile.startingVolumeMl-f.sim.profile.sipAmountMl,1e-6,'paused-rest sip completes');

    f.sim.reset();f.sim.renderAt(CYCLE_DURATION);
    assert.equal(f.sim.active,false);assert.equal(f.sim.paused,true);
    const before=f.sim.volume;
    assert.equal(f.sim.sip(),true,'the end of the scrub range accepts a fresh sip');
    assert.equal(f.sim.paused,false);
    f.sim.update(CYCLE_DURATION+.1);
    near(f.sim.volume,before-f.sim.profile.sipAmountMl,1e-6,'new sip consumes from the inspected remaining volume');
    near(f.sim.lastEvent.volumeConsumedMl,f.sim.profile.sipAmountMl,1e-6,'new cycle emits its actual volume');

    f.sim.reset();f.sim.sip();f.sim.update(.6);f.sim.paused=true;
    const time=f.sim.elapsed;
    assert.equal(f.sim.sip(),false,'a repeated command cannot restart a paused busy action');
    assert.equal(f.sim.paused,true);f.sim.update(2);assert.equal(f.sim.elapsed,time);
  }finally{f.dispose();}
});
