/** Shared, beat-driven performance poses for World and Studio. Original choreography. */
export const MUSIC_MOVES=Object.freeze([
 ['DiscoPoint','Disco point'],['IdolDance','Idol step-touch'],['AirGuitar','Air guitar'],
 ['RockBelt','Stadium rock singer'],['EnkaReach','Dramatic ballad'],['RobotDance','Robot dance'],
 ['ChickenDance','Chicken dance'],['JellyWobble','Jelly wobble'],['DramaFinish','Overdramatic superstar']
].map(Object.freeze));
const TAU=Math.PI*2;
export function musicPose(name,beat,energy=1){
 beat=Number.isFinite(beat)?beat:0;energy=Number.isFinite(energy)?Math.max(.15,Math.min(1,energy)):1;
 const swing=Math.sin(beat*Math.PI),pulse=Math.sin(beat*TAU),left=Math.max(0,swing),right=Math.max(0,-swing),joints={
  hips:[0,swing*.12*energy,swing*.055*energy],chest:[0,-swing*.16*energy,-swing*.07*energy],head:[-.08,0,-swing*.09*energy],
  shoulderR:[-1.05,0,-.25],elbowR:[-1.25,0,0],shoulderL:[-.25,0,.35],elbowL:[-.45,0,0],
  thighL:[-left*.28*energy,0,.04],kneeL:[left*.45*energy,0,0],thighR:[-right*.28*energy,0,-.04],kneeR:[right*.45*energy,0,0]
 };
 if(name==='DiscoPoint'){
  const point=Math.sin(beat*Math.PI/2);joints.shoulderL=[-.4,0,1.65+point*.7];joints.elbowL=[-.15,0,.15];joints.handL=[0,0,pulse*.25];
  joints.chest=[-.1,0,-swing*.16*energy];
 }else if(name==='IdolDance'){
  const answer=Math.floor(beat/4)%2;joints.shoulderL=[-.8+left*.3,0,.6+right*.65];joints.elbowL=[-1.3+right*.45,0,0];
  if(answer){joints.shoulderR=[-.6,0,-1.25-right*.35];joints.elbowR=[-.55,0,-.25];}
  joints.head=[-.06,Math.sin(beat*Math.PI/2)*.18,-swing*.17*energy];
 }else if(name==='AirGuitar'){
  joints.shoulderL=[-.8,-.25,.8];joints.elbowL=[-1.05,0,.5];joints.shoulderR=[-.5+pulse*.2,0,-.2];joints.elbowR=[-.9+pulse*.5,0,0];
  joints.head=[.15+pulse*.22*energy,0,0];joints.chest=[.16,Math.sin(beat*Math.PI/2)*.2,0];
 }else if(name==='RockBelt'){
  joints.shoulderR=[-1.4,0,-.28];joints.elbowR=[-1.3,0,0];joints.shoulderL=[-.3,0,1.55+left*.55];joints.elbowL=[-.25,0,0];
  joints.chest=[-.2+Math.abs(pulse)*.11,0,-swing*.1];joints.head=[-.22+Math.abs(pulse)*.14,0,0];
 }else if(name==='EnkaReach'){
  const reach=(1+Math.sin(beat*Math.PI/4))/2;joints.shoulderL=[-.45-reach*.75,0,.35+reach*.4];joints.elbowL=[-.4,0,0];
  joints.head=[-.12+reach*.18,Math.sin(beat*Math.PI/4)*.2,-swing*.06];joints.chest=[-.12+reach*.1,0,-swing*.04];
  joints.thighL=[0,0,.04];joints.thighR=[0,0,-.04];joints.kneeL=[.04,0,0];joints.kneeR=[.04,0,0];
 }else if(name==='RobotDance'){
  const tick=Math.floor(beat*2)%4,arm=tick%2?-.35:-1.25;
  joints.shoulderL=[arm,0,.7];joints.shoulderR=[-1.5-arm,0,-.7];joints.elbowL=[-Math.PI/2,0,0];joints.elbowR=[-Math.PI/2,0,0];
  joints.head=[0,(tick-1.5)*.17,0];joints.chest=[0,(tick%2?1:-1)*.18,0];
 }else if(name==='ChickenDance'){
  joints.shoulderL=[-.25,0,.8+left*.65];joints.shoulderR=[-.25,0,-.8-right*.65];joints.elbowL=[-1.8,0,.3];joints.elbowR=[-1.8,0,-.3];
  joints.head=[.15+pulse*.18,0,-swing*.18];joints.chest=[.18,0,-swing*.13];
 }else if(name==='JellyWobble'){
  joints.hips=[0,swing*.3*energy,Math.sin(beat*TAU/3)*.14*energy];joints.chest=[Math.sin(beat*TAU/3)*.17,0,-swing*.23*energy];
  joints.head=[-.1,Math.sin(beat*Math.PI/2)*.3,swing*.25*energy];joints.shoulderL=[-.3,0,.7+left*.4];joints.elbowL=[-.5-pulse*.45,0,0];
 }else if(name==='DramaFinish'){
  joints.head=[-.3,Math.sin(beat*Math.PI/4)*.28,0];joints.chest=[-.22,0,-swing*.15];
  joints.shoulderL=[-.35,0,2.05+left*.25];joints.elbowL=[-.2,0,0];joints.shoulderR=[-1.4,0,-.35];joints.elbowR=[-1.25,0,0];
 }
 return {joints,root:0};
}
