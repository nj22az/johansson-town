import {createLocalCharacters} from './models.js?snappy=1';
import * as THREE from '../../vendor/three.module.js';
import {faceYaw,turnToward} from './facing.js';
import {separateBodies} from './body-collision.js';

// Each resident has one appearance. Keep the logical entity while its chosen
// model loads; never render an obsolete body or borrow another resident’s face.
const CAST=Object.freeze({
  player:{source:'first-person-controller',height:1.82,identity:'Johansson'},
  Nhung:{source:'local-authored',height:1.62,identity:'Nhung'},
  Chin:{source:'local-authored',height:1.76,identity:'Chin'},
  'Mrs Sato':{source:'local-authored',height:1.55,identity:'Mrs Sato'},
  'Harbour master':{source:'local-authored',height:1.74,identity:'Harbour master'}
});


export function createCharacters(options={}){
  const models=createLocalCharacters(options),actors=[],conversations=new Map(),entities=new Map(),aiControls=new Map();
  let playerEntity=null,groundY=0,jumpVelocity=0,jumping=false;

  function attach(entity,file,height){
    const isPlayer=file==='player'||!entity.userData.name;
    const targetHeight=height||(isPlayer?CAST.player.height:CAST[entity.userData.name]?.height);
    const identity=isPlayer?'Johansson':entity.userData.name;
    if(identity)entities.set(identity,entity);
    if(isPlayer){
      playerEntity=entity;groundY=entity.position.y;entity.visible=false;
      entity.userData.visualSource='First-person controller';
      return null;
    }
    // Discard legacy world placeholders before the first rendered frame.
    for(const child of [...entity.children])child.removeFromParent();
    const actor=models.attach(entity,file,targetHeight);
    entity.userData.visualReady=true;entity.userData.character=actor;actors.push(actor);
    return actor;
  }

  function face(entity,target,flip=false){if(!entity||!target)return;entity.lookAt(target.position.x,entity.position.y,target.position.z);if(flip)entity.rotateY(Math.PI);}
  const bodyBusy=entity=>entity.userData.ferryCrew||entity.userData.ferryShoreTask||entity.userData.staffBenchPhase||Number.isFinite(entity.userData.seatHeight)||entity.userData.character?.moving||entity.userData.shopping||entity.userData.serving||entity.userData.sleeping||entity.userData.waking||entity.userData.roomTransition;

  function stageConversation(entity){
    if(!playerEntity||!entity||entity===playerEntity)return;
    if(bodyBusy(entity))return;
    const dx=playerEntity.position.x-entity.position.x,dz=playerEntity.position.z-entity.position.z;
    let d=Math.hypot(dx,dz),nx=0,nz=1;if(d>.001){nx=dx/d;nz=dz/d;}
    const targetDistance=1.34;
    // Facing never moves the player through a wall or prop.
    const hold=1900,now=performance.now();conversations.set(entity,{until:now+hold,x:entity.position.x,z:entity.position.z});
    // Only they turn, and smoothly (update): the player's own turn belongs to the
    // conversation camera (game.js frameConversation). Snapping the player here used to
    // point their back at the speaker, and the two fought every frame.
    models.gesture(entity);
  }

  function gesture(entity){stageConversation(entity);}

  function canJump(){
    const hud=document.querySelector('#hud'),directory=document.querySelector('#directory'),activity=document.querySelector('#activity'),qte=document.querySelector('#qte');
    return !window.__JOHANSSON_INSPECTING__&&!!playerEntity&&window.__JOHANSSON_RUNNING__===true&&hud&&!hud.classList.contains('hidden')&&directory?.classList.contains('hidden')&&activity?.classList.contains('hidden')&&qte?.classList.contains('hidden');
  }

  function jump(){if(!canJump()||options.canJump?.()===false||jumping)return false;jumping=true;jumpVelocity=4.25;groundY=playerEntity.position.y;navigator.vibrate?.(12);options.onJump?.();return true;}
  if(!window.__JOHANSSON_JUMP_BOUND__){window.__JOHANSSON_JUMP_BOUND__=true;document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat)jump();});document.querySelector('#jump')?.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();jump();});}
  window.__JOHANSSON_JUMP__=jump;

  function updateJump(dt,terrainY=0){if(!playerEntity)return;if(!jumping){groundY=terrainY;playerEntity.position.y=terrainY;return;}groundY=terrainY;jumpVelocity-=11.2*dt;playerEntity.position.y+=jumpVelocity*dt;if(playerEntity.position.y<=groundY){playerEntity.position.y=groundY;jumpVelocity=0;jumping=false;}}

  // Bounded AI/NPC control. This deliberately operates on the same local actor entities
  // that the player sees; it does not spawn hidden duplicate avatars or bypass the cast pipeline.
  function listCharacters(){return [...entities.entries()].map(([name,e])=>({name,x:+e.position.x.toFixed(2),y:+e.position.y.toFixed(2),z:+e.position.z.toFixed(2),player:name==='Johansson',aiControlled:aiControls.has(e)}));}
  function getCharacter(name){const e=entities.get(name);return e?{name,x:+e.position.x.toFixed(2),y:+e.position.y.toFixed(2),z:+e.position.z.toFixed(2),player:name==='Johansson',aiControlled:aiControls.has(e)}:null;}
  function moveNPC(name,{dx=0,dz=0,seconds=4}={}){
    const e=entities.get(name);if(!e||e===playerEntity)return false;
    const targetX=THREE.MathUtils.clamp(e.position.x+THREE.MathUtils.clamp(Number(dx)||0,-4,4),-5.7,5.7);
    const targetZ=THREE.MathUtils.clamp(e.position.z+THREE.MathUtils.clamp(Number(dz)||0,-6,6),-55,48);
    aiControls.set(e,{targetX,targetZ,until:performance.now()+THREE.MathUtils.clamp(Number(seconds)||4,.5,15)*1000,faceName:null});
    return true;
  }
  function faceCharacter(name,targetName='Johansson',seconds=4){
    const e=entities.get(name),target=entities.get(targetName);if(!e||!target||e===playerEntity)return false;
    const current=aiControls.get(e)||{targetX:e.position.x,targetZ:e.position.z};
    aiControls.set(e,{...current,until:performance.now()+THREE.MathUtils.clamp(Number(seconds)||4,.5,15)*1000,faceName:targetName});
    return true;
  }
  function commandGesture(name){const e=entities.get(name);if(!e||e===playerEntity)return false;if(name==='Thuan'){stageConversation(e);return true;}models.gesture(e);return true;}
  function releaseCharacter(name){const e=entities.get(name);if(!e||e===playerEntity)return false;aiControls.delete(e);return true;}
  function updateAIControls(dt){
    const now=performance.now();
    for(const [e,c] of aiControls){
      if(c.until<=now){aiControls.delete(e);continue;}
      const x=THREE.MathUtils.damp(e.position.x,c.targetX,6.5,dt),z=THREE.MathUtils.damp(e.position.z,c.targetZ,6.5,dt);
      if(!options.isBlocked?.(x,e.position.z,.32))e.position.x=x;
      if(!options.isBlocked?.(e.position.x,z,.32))e.position.z=z;
      if(c.faceName){const target=entities.get(c.faceName);if(target)face(e,target,true);}
    }
  }
  /**
   * Pins a facial expression, and optionally plays a gesture with it. The dialogue and
   * the language model both reach the face through here rather than touching the rig.
   */
  function setExpression(name,expression,gesture='idle'){
    const entity=entities.get(name);
    if(!entity)return false;
    entity.userData.thuanExpression=expression||null;
    if(gesture&&gesture!=='idle')models.gesture(entity);
    return true;
  }
  /**
   * A mood that lasts a little while on its own, and outlives the conversation that
   * caused it: she is still smiling as you walk away from the till.
   */
  function feel(name,expression,seconds=6){
    const entity=entities.get(name);
    if(!entity||!expression)return false;
    entity.userData.thuanMood={expression,until:performance.now()+Math.max(0,seconds)*1000};
    return true;
  }
  /** Holds the mouth open while a spoken line runs; the controller does the shaping. */
  function setSpeaking(name,value){
    const entity=entities.get(name);
    if(!entity)return false;
    // A generous window: the voice clears it on end, cancel or timeout.
    entity.userData.speakingUntil=value?performance.now()+60000:0;
    return true;
  }
  window.__JOHANSSON_CHARACTER_CONTROL__=Object.freeze({list:listCharacters,get:getCharacter,moveNPC,faceCharacter,gesture:commandGesture,release:releaseCharacter,setExpression,setSpeaking,feel});

  function update(dt){
    updateAIControls(dt);
    const now=performance.now();
    for(const [entity,c] of conversations){if(c.until<=now||bodyBusy(entity)){conversations.delete(entity);continue;}entity.position.x=c.x;entity.position.z=c.z;if(playerEntity)entity.rotation.y=turnToward(entity.rotation.y,faceYaw(entity.position,playerEntity.position),dt,7);}
    models.update(dt);
    // Re-apply the AI target after the conversation layer so a commanded resident does not drift.
    separateAll();
  }

  // Bodies are solid (body-collision.js): every standing, visible person, the player included, kept apart from the
  // others in the same space. Busy bodies (seated, serving, asleep, in a conversation hold) do not move.
  const scratch=new THREE.Vector3();
  function separateAll(){
    const bodies=[];
    for(const entity of new Set(entities.values())){
      if(!entity?.parent||(entity!==playerEntity&&!entity.visible))continue;
      const u=entity.userData;
      if(u.lying||u.ridingBicycle)continue;
      entity.getWorldPosition(scratch);
      bodies.push({entity,radius:u.serviceRadius,x:scratch.x,z:scratch.z,x0:scratch.x,z0:scratch.z,space:entity.parent,
        fixed:entity!==playerEntity&&(u.ferryCrew||u.ferryShoreTask||bodyBusy(entity)&&!entity.userData.character?.moving||conversations.has(entity)||!!u.sleeping||Number.isFinite(u.seatHeight))});
    }
    if(bodies.length<2)return;
    if(!separateBodies(bodies,{blocked:options.isBlocked}))return;
    for(const b of bodies){
      if(Math.abs(b.x-b.x0)+Math.abs(b.z-b.z0)<1e-6)continue;
      // the new spot in the world, back into the room's own frame (a room may be turned or scaled)
      b.entity.getWorldPosition(scratch);scratch.x=b.x;scratch.z=b.z;b.entity.parent.worldToLocal(scratch);
      b.entity.position.x=scratch.x;b.entity.position.z=scratch.z;
    }
  }

  function conversationTarget(entity){
    const target=models.conversationTarget(entity);if(target)return target;
    const fallback=entity.getWorldPosition(new THREE.Vector3());fallback.y+=(CAST[entity.userData.name]?.height||1.75)*.9;return fallback;
  }
  return {refresh:name=>models.refresh(entities.get(name)),get jumping(){return jumping;},wear:(entity,outfit)=>models.wear(entity,outfit),attach,gesture,jump,update,physics:updateJump,actors,conversationTarget,preloaded:()=>actors.length,profiles:CAST,mode:'local-skinned-direct',listCharacters,getCharacter,moveNPC,faceCharacter,releaseCharacter};
}
