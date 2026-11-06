import {disposeServing} from './izakaya-beer.js';
import * as THREE from '../../vendor/three.module.js';
import {createAvatarActor,updateAvatarActor,avatarConversationTarget} from '../avatars/actors.js';

/**
 * The town's people, as bodies.
 *
 * Everybody is a Shimanchu: one family of bodies built at load time from recipes
 * (src/avatars/). There is nothing to download, so every resident is ready on the
 * frame they are attached. The GLB cast that used to stream in behind placeholders —
 * the MakeHuman Thuan and Johansson, Thao's VRoid, the low-poly residents — was retired
 * in the September 2026 cleanup (see docs/EXPANSION-NOTES.md to recover it).
 */
export function createLocalCharacters({shadows=false}={}){
  const actors=[],byEntity=new Map();
  function attach(entity,name){
    const actor=createAvatarActor(entity,entity.userData.name||name,{shadows});
    byEntity.set(entity,actor);actors.push(actor);return actor;
  }
  function refresh(entity){const old=byEntity.get(entity);if(!old)return false;disposeServing(old.heldProp);disposeServing(old.dishProp);old.model.removeFromParent();old.avatar.body.skeleton.dispose();old.avatar.dispose();Object.assign(old,createAvatarActor(entity,entity.userData.name,{shadows}));return true;}
  function update(dt){for(const actor of actors)updateAvatarActor(actor,dt);}
  function conversationTarget(entity,target=new THREE.Vector3()){
    const actor=byEntity.get(entity);return actor?avatarConversationTarget(actor,target):null;
  }
  /** 'swim', 'towel' or 'bath' dresses a resident for the bath (avatars/build.js wear), anything else back into their clothes. */
  function wear(entity,outfit){const actor=byEntity.get(entity);if(!actor)return false;actor.outfit=actor.avatar.wear(outfit)||outfit;actor.requested=outfit;return true;}
  function gesture(entity){const actor=byEntity.get(entity);if(!actor)return false;if(!(actor.gestureTime>0))actor.gestureTime=1.6;return true;}
  return {attach,refresh,update,actors,conversationTarget,wear,gesture};
}
