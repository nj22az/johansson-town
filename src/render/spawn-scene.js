import * as THREE from '../../vendor/three.module.js';

const DURATION=5.6,RETURN_TIME=.9;
/**
 * The docks openings (world/openings.js `docks`) begin with the harbour: a wide, high view that turns slowly round him
 * while the town is still being built (`hold`, the creator, 2026-10-13: "the animation should be long enough to load the
 * rest of the town"), at least ESTABLISH seconds and at most HOLD_MAX (on a slow line he is not kept standing longer:
 * what has not come by then streams in as he walks), then DESCEND seconds down to the shot of him.
 */
// The hold no longer outlasts the establishing shot (the creator, 2026-10-19: loading felt clunky and seemed to
// start again after START): what has not arrived by then streams in as he walks.
const ESTABLISH=2.2,DESCEND=2.4,HOLD_MAX=ESTABLISH,ORBIT=.05;
const SHOTS={
 'park-bench':{angle:-.9,distance:5.1,height:2.5,action:'LookAround',bird:true},
 pier:{angle:.95,distance:5,height:2.1,action:'LookAround',bird:true},
 ferry:{angle:-.85,distance:4.7,height:1.8,action:'Stretch',bird:true},
 seawall:{angle:-1,distance:4.9,height:1.65,action:'Think',bird:true},
 izakaya:{angle:.7,distance:2.5,height:1.4,action:'LookAround'},
 ramen:{angle:-.75,distance:2.5,height:1.5,action:'LookAround'},
 // The docks (world/openings.js): he is seen from the front, and the lens comes back behind him onto what he looks at.
 'minato-maru':{angle:-.9,distance:4.8,height:1.9,action:'LookAround',bird:true},
 'cargo-boat':{angle:.9,distance:4.6,height:1.8,action:'Think',bird:true},
 'fish-auction':{angle:-.8,distance:4.2,height:1.8,action:'Think'},
 houseboat:{angle:.85,distance:4.5,height:1.8,action:'Stretch',bird:true},
 'fishing-boat':{angle:-.85,distance:4.6,height:1.8,action:'LookAround',bird:true},
 'landing-sign':{angle:.9,distance:4.8,height:1.9,action:'Stretch',bird:true},
};
const smooth=t=>t*t*(3-2*t);

/** Check the whole sightline, so a clear endpoint cannot put the lens behind a wall. */
export function clearArrivalLens(target,lens,{blocked,ground,inside=false}={}){
 const length=target.distanceTo(lens),steps=Math.ceil(length/.12);
 for(let i=1;i<=steps;i++){
  const p=target.clone().lerp(lens,i/steps);
  // The sitter's own chair occupies the first few centimetres below the head.
  if(p.distanceTo(target)<.65)continue;
  if(blocked?.(p.x,p.z,p.y,.18)||!inside&&p.y<(ground?.(p.x,p.z)??0)+.25)return false;
 }
 return true;
}

/** A composed arrival, using the player's real avatar and the current collision floor. */
export function createSpawnScene({scene,camera,getActor,blocked,ground,onActive=()=>{}}){
 let pending=null,shot=null,time=0,reason=null,lastShot=null;
 const holding=()=>!!(shot?.establish&&!shot.establish.released&&shot.establish.hold?.()&&time<HOLD_MAX);
 const bird=new THREE.Group();bird.name='Arrival gull';bird.visible=false;bird.userData.dynamicProp=true;
 const white=new THREE.MeshStandardMaterial({color:0xeae7d8,roughness:1}),dark=new THREE.MeshStandardMaterial({color:0x47505b,roughness:1});
 const body=new THREE.Mesh(new THREE.SphereGeometry(.075,8,5),white);body.scale.set(.7,.8,2);bird.add(body);
 const wings=[-1,1].map(side=>{
  const wing=new THREE.Group();wing.position.x=side*.04;
  const feather=new THREE.Mesh(new THREE.BoxGeometry(.31,.018,.10),white);feather.position.x=side*.155;wing.add(feather);
  const tip=new THREE.Mesh(new THREE.BoxGeometry(.12,.018,.08),dark);tip.position.x=side*.32;wing.add(tip);bird.add(wing);return wing;
 });
 scene.add(bird);
 function finish(why){
  if(!pending&&!shot)return;
  // Nobody walks off into a town still being built: plain input waits for the hold to end.
  if(holding()&&(why==='input'||why==='interaction'))return;
  if(shot)camera.fov=shot.fov;
  pending=null;shot=null;time=0;reason=why;bird.visible=false;
  const actor=getActor();actor.stop();actor.lookAt(null);actor.express('neutral',0);
  onActive(false);camera.updateProjectionMatrix();
 }
 function begin(){
  const options=pending;pending=null;
  const actor=getActor(),origin=actor.root.position.clone(),preset=SHOTS[options.id]||SHOTS['fish-auction'];
  const target=origin.clone().add(new THREE.Vector3(0,actor.lens.head,0));
  const distance=preset.distance*(camera.aspect<1?1.2:1),base=options.yaw||0;
  let from=null,to=null;
  // A front three-quarter view. Try the other side and closer lenses if a wall intervenes.
  for(const angle of [preset.angle,-preset.angle,1.55,-1.55,2.4,-2.4,Math.PI]){
   for(const reach of [distance,distance*.72,distance*.48]){
    const a=base+angle;
    const p=origin.clone().add(new THREE.Vector3(-Math.sin(a)*reach,preset.height+actor.lens.head*.35,-Math.cos(a)*reach));
    const q=origin.clone().add(new THREE.Vector3(-Math.sin(a+.10)*reach*.9,p.y-origin.y+.14,-Math.cos(a+.10)*reach*.9));
    const clear=lens=>clearArrivalLens(target,lens,{blocked,ground,inside:options.inside});
    if(clear(p)&&clear(q)&&[.25,.5,.75].every(t=>clear(p.clone().lerp(q,t)))){from=p;to=q;break;}
   }
   if(from)break;
  }
  // Keep a safe existing view if the counter leaves no room for a front shot.
  from??=camera.position.clone();to??=from.clone();
  // The harbour first: high and wide on the same side as the shot of him, the other side, or round behind him (under a
  // roof he faces into, the front is closed above), lower if it must be, or not at all. The way down to the shot of him
  // is checked as well as the views from it: a fan of clear sightlines still let the lens descend through a column of the
  // auction shed, beside its sign (2026-10-19).
  let establish=null;
  if(options.establish&&!options.inside)search:for(const [reach,height] of [[15,9],[11,6]])for(const angle of [preset.angle*1.3,-preset.angle*1.3,preset.angle*.6,-preset.angle*.6,2.3,-2.3,Math.PI]){
   const a=base+angle,high=origin.clone().add(new THREE.Vector3(-Math.sin(a)*reach,height,-Math.cos(a)*reach));
   if(clearArrivalLens(target,high,{blocked,ground})&&clearArrivalLens(from,high,{blocked,ground})&&[.25,.5,.75].every(t=>clearArrivalLens(target,high.clone().lerp(from,t),{blocked,ground}))){establish={high,angle:0,hold:options.hold,released:null};break search;}
  }
  // Nowhere clear above him: the hold is kept on the shot of him itself, turning slowly round him from where it starts.
  if(options.establish&&!options.inside&&!establish)establish={high:from.clone(),angle:0,hold:options.hold,released:null};
  shot={id:options.id,inside:options.inside,preset,origin,target,from,to,fov:camera.fov,establish};time=0;
  lastShot={origin:origin.toArray(),target:target.toArray(),lens:from.toArray()};
  actor.play(preset.action);onActive(true);
 }
 return {
  get active(){return !!(pending||shot);},
  /** Still showing the harbour while the town is built: the game holds him still and keeps the shot. */
  get holding(){return holding();},
  get gaze(){return bird.visible?bird.position:null;},
  start(options){finish('replaced');pending=options;reason=null;},
  cancel(reason='input'){finish(reason);},
  update(dt,{paused=false,unavailable=false}={}){
   if(unavailable){finish('other-view');return;}
   if(!pending&&!shot)return;
   if(paused){finish('interaction');return;}
   if(pending)begin();
   time+=Math.max(0,Math.min(dt,.1));
   const E=shot.establish;
   if(E&&!E.released&&time>=ESTABLISH&&!holding())E.released=time;
   if(E&&!E.shifted&&(!E.released||time<E.released+DESCEND)){
    // Turning slowly round him over the harbour while it holds, never through anything; then down to the shot of him.
    const orbit=(E.released??time)*ORBIT,lens=E.high.clone().sub(shot.origin).applyAxisAngle(new THREE.Vector3(0,1,0),orbit).add(shot.origin);
    const lensHigh=clearArrivalLens(shot.target,lens,{blocked,ground})?(E.last=lens):(E.last??E.high);
    const u=E.released?smooth(Math.min(1,(time-E.released)/DESCEND)):0,at=lensHigh.clone().lerp(shot.from,u);
    camera.position.copy(at);camera.lookAt(shot.target);camera.fov=THREE.MathUtils.lerp(52,48,u);camera.updateProjectionMatrix();camera.updateMatrixWorld();
    bird.visible=false;return;
   }
   // The shot of him runs on its own clock after the harbour.
   if(E&&!E.shifted){E.shifted=true;time=Math.max(0,time-E.released-DESCEND);}
   if(time>=DURATION){const fov=shot.fov;finish('complete');camera.fov=fov;camera.updateProjectionMatrix();return;}
   const normal=camera.position.clone(),rotation=camera.quaternion.clone();
   const progress=Math.min(1,time/(DURATION-RETURN_TIME));
   const lens=shot.from.clone().lerp(shot.to,smooth(progress));
   // Streamed walls can arrive during the opening. Never continue a shot through one.
   if(!clearArrivalLens(shot.target,lens,{blocked,ground,inside:shot.inside})){finish('obstruction');return;}
   camera.position.copy(lens);camera.lookAt(shot.target);camera.fov=48;
   const returning=Math.max(0,(time-(DURATION-RETURN_TIME))/RETURN_TIME);
   if(returning){const t=smooth(returning);camera.position.lerp(normal,t);camera.quaternion.slerp(rotation,t);camera.fov=THREE.MathUtils.lerp(48,shot.fov,t);}
   camera.updateProjectionMatrix();camera.updateMatrixWorld();
   if(shot.preset.bird&&!shot.inside&&time>.5&&time<4.2){
    const u=(time-.5)/3.7,a=(shot.from.clone().sub(shot.target)).normalize();
    // Cross the foreground, clear of the ship or roofs behind him, within the lens.
    const right=new THREE.Vector3(a.z,0,-a.x),width=shot.from.distanceTo(shot.target)*.9;
    const p=shot.target.clone().addScaledVector(right,(u-.5)*width).addScaledVector(a,1.3);
    p.y=shot.target.y+.8+Math.sin(u*Math.PI)*.3;
    bird.visible=!blocked?.(p.x,p.z,p.y,.4)&&p.y>(ground?.(p.x,p.z)??0)+1;
    bird.position.copy(p);bird.rotation.y=Math.atan2(right.x,right.z);wings.forEach((wing,i)=>wing.rotation.z=(i?1:-1)*(Math.sin(time*8)*.35+.1));
   }else bird.visible=false;
  },
  snapshot(){return {active:this.active,id:pending?.id||shot?.id||null,seconds:+time.toFixed(2),action:shot?.preset.action||null,bird:bird.visible,reason,shot:lastShot,establishing:!!(shot?.establish&&!shot.establish.shifted),holding:holding()};},
 };
}
