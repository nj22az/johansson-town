import {createToolProp,fitToolProp} from './tools.js';
import {buildUmbrella,fitUmbrella} from './umbrella.js';
import {wearEarDefenders} from './ear-defenders.js';
import {appropriateOutfit} from './outfits.js';
import * as THREE from '../../vendor/three.module.js';
import {buildAvatar,measure} from './build.js';
import {createAvatarAnimator,GESTURES} from './animate.js';
import {recipeFor} from './cast.js';
import {normalizeRecipe,decodeRecipe,encodeRecipe} from './recipe.js';
import {fitAvatarHeldProp,gripWheel} from './consume.js';
import {workHands} from './work-hands.js';
import {createAvatarTableDrink,createFirstPersonDrinkingArm,TABLE_DRINK_KINDS,levelHeldDrink} from './table-drink.js';
import {DEFAULT_PLAYER,readPlayers,readSave} from '../save.js';
import {swingsAt} from './springs.js';
const swingAt=new THREE.Vector3();
/** What can be worn at Umi-no-yu (build.js wear): anything else asked for is the clothes. */
const BATH_OUTFITS=Object.freeze(['swim','towel','bath','afterbath']);
import {createDrinkProp,createDishProp,createBiteProp,setPropPortion,updatePropPortion,disposeServing} from '../people/izakaya-beer.js';

/**
 * Where the Shimanchu meet the town: everybody the character system attaches becomes one
 * (see models.js), and the player's own third-person body is one (see game.js). The town's
 * characters are driven by flags on their entity -- a seat height, a pose, a mood, whether
 * they are speaking -- so the avatars read the same flags, and nothing that moves people
 * about had to change.
 *
 */

/** The player's own recipe, as the creator saved it; until then Johansson as World draws him (recipeFor: with any look
 * published from Johansson Studio, so the player, the guide and the photo studio match the comics). */
export const PLAYER_RECIPE_KEY='johansson-town-avatar';
export function playerRecipeKey(storage=globalThis.localStorage){
 const id=readPlayers(storage).active;
 return id===DEFAULT_PLAYER.id?PLAYER_RECIPE_KEY:PLAYER_RECIPE_KEY+'@'+id;
}
export function playerRecipe(storage=globalThis.localStorage){
 // The first player's old key remains theirs. Other slots never inherit that look.
 // A save-file snapshot restores imported appearances; a later creator edit wins.
 try{
  const r=decodeRecipe(storage?.getItem(playerRecipeKey(storage)))||decodeRecipe(readSave(storage)?.avatarRecipe);
  if(r){
   if(r.name==='Vy'&&Number(storage?.getItem(playerRecipeKey(storage)+'.appearance-revision')||0)<1){const adopted=normalizeRecipe({...recipeFor('Vy'),profile:r.profile});savePlayerRecipe(adopted,storage);return adopted;}
   return {...r,outfit:appropriateOutfit(r.name||'Johansson',r.outfit)};
  }
 }catch{}
 return recipeFor('Johansson');
}
export function savePlayerRecipe(recipe,storage=globalThis.localStorage){
 const code=encodeRecipe({...recipe,outfit:appropriateOutfit(recipe.name||'Johansson',recipe.outfit)});try{const key=playerRecipeKey(storage);storage?.setItem(key,code);if(recipe.name==='Vy')storage?.setItem(key+'.appearance-revision','1');}catch{}return code;
}


/** An actor for models.js: a body built from the resident's recipe. */
export function createAvatarActor(entity,name,{shadows=false}={}){
 const recipe=recipeFor(name);
 const avatar=buildAvatar(recipe,{shadows,faceSize:name==='Thuan'?512:256});
 for(const child of entity.children)child.visible=false;
 entity.add(avatar.root);
 entity.userData.visualReady=true;entity.userData.visualSource='Shimanchu · '+(recipe.name||name);
 return {isAvatar:true,avatar,animator:createAvatarAnimator(avatar,{lively:true}),entity,model:avatar.root,mixer:null,actions:new Map(),
  current:null,last:entity.position.clone(),gestureTime:0,speed:0,moving:false,wasVisible:true,height:avatar.height,
  isThuan:name==='Thuan',outfit:'clothes',requested:'clothes'};
}

/** Once a frame: what the flags say, into the body. */
export function updateAvatarActor(actor,dt,now=performance.now()){
 const {entity,avatar}=actor,u=entity.userData;
 let visible=true;for(let p=entity;p;p=p.parent)if(!p.visible){visible=false;break;}
 if(!visible){actor.last.copy(entity.position);actor.speed=0;actor.moving=false;actor.wasVisible=false;return;}
 const distance=Math.hypot(entity.position.x-actor.last.x,entity.position.z-actor.last.z);actor.last.copy(entity.position);
 const relocated=!actor.wasVisible||distance>1;actor.wasVisible=true;
 const measured=relocated||Number.isFinite(u.chairBlend)?0:distance/Math.max(dt,.001);
 actor.speed=THREE.MathUtils.damp(actor.speed,measured,20,dt);
 actor.moving=actor.speed>(actor.moving?.03:.07);
 actor.gestureTime=Math.max(0,actor.gestureTime-dt);
 // At the bath: 'bath' is whatever this person wears behind Umi-no-yu's noren (build.js bathOutfit: a bath
 // wrap for grown-ups, swimwear for children), or 'towel'/'swim' outright, and 'afterbath' the lobby's after-bath
 // clothes. The actor records what they actually have on, so a child asked into a towel reads as in swimwear.
 const bathing=BATH_OUTFITS.includes(u.outfit),outfit=bathing?u.outfit:actor.isThuan?(u.alternativeOutfit||'clothes'):(u.outfit||'clothes');if(actor.requested!==outfit){actor.outfit=avatar.wear(outfit)||outfit;actor.requested=outfit;}
 // At home the hat is on its hook (home-residents.js), not on the head.
 const hatOn=!u.hatOff;if(actor.hatOn!==hatOn){avatar.setHat?.(hatOn);actor.hatOn=hatOn;}
 const riding=!!(u.playerControlled&&actor.isThuan);
 // The seat owns the support, while the pose owns the hands and head. Reading,
 // talking or using a telephone must not stand somebody up inside their chair.
 const seated=!riding&&Number.isFinite(u.seatHeight);
 const mood=u.thuanMood,line=u.lineFeeling,feeling=mood&&mood.until>now?mood.expression:line&&line.until>now?line.expression:null;
 const engaged=!!(u.playerConversation||u.chat||actor.gestureTime);
 const sleeping=Number(u.sleepBlend)>.28||(u.sleeping&&!u.roomTransition);
 // Every resident uses the same hand fit and portion animation as the player.
 const heldKind=u.heldItem||(['Drink','DrinkStanding'].includes(u.socialPose)?'beer':u.socialPose==='Eat'?'rice':null);
 if(actor.heldKind!==heldKind){
  disposeServing(actor.heldProp);disposeServing(actor.dishProp);actor.heldProp=null;actor.dishProp=null;actor.heldKind=heldKind;actor.portion=1;actor.consumedCycle=-1;
  const drinks={beer:'draft',tea:'oolong',cup:'oolong',coffee:'coffee',mugicha:'mugicha',can:'can',bottle:'bottle',draft:'draft',oolong:'oolong',awamori:'awamori',sake:'sake'};
  const foods=['rice','bun','ramen','fish','yakitori','gyoza','edamame','sashimi','oden','hiyayakko','dashimaki','agedashi','karaage','ochazuke','chopsticks'];
  if(drinks[heldKind]){
   actor.heldProp=createDrinkProp(drinks[heldKind],{held:true});
   // (a hand with fingers holds a jug by its handle and tips it to the lips: the beer in it stays level, as Johansson's)
   if(avatar.pixar?.holdPoint&&drinks[heldKind]==='draft')levelHeldDrink(actor.heldProp);
  }
  else if(foods.includes(heldKind)){
   actor.heldProp=createBiteProp(heldKind);
   if(heldKind!=='bun'&&heldKind!=='chopsticks'){
    actor.dishProp=createDishProp(heldKind==='fish'?'hokke':heldKind);actor.dishProp.userData.food=true;avatar.bones.handL.add(actor.dishProp);
   }
  }
  if(actor.heldProp)avatar.bones.handR.add(actor.heldProp);
  if(actor.heldProp&&Number.isFinite(u.heldPortion))setPropPortion(actor.heldProp,u.heldPortion,{immediate:true});
  if(actor.dishProp&&Number.isFinite(u.foodPortion))setPropPortion(actor.dishProp,u.foodPortion,{immediate:true});
 }
 // In the rain (people/schedules.js umbrellaFor): an umbrella in the right hand, one per colour, while outdoors.
 const umbrella=Number.isFinite(u.umbrella)?u.umbrella:null;
 if(actor.umbrellaColour!==umbrella){actor.umbrellaProp?.removeFromParent();actor.umbrellaProp=umbrella===null?null:buildUmbrella({canopy:umbrella});actor.umbrellaColour=umbrella;if(actor.umbrellaProp)avatar.bones.handR.add(actor.umbrellaProp);}
 actor.animator.update(dt,{
  speed:actor.moving?actor.speed:0,running:actor.speed>3.2,seated,seatHeight:u.seatHeight,seatFront:u.seatFront,chairBlend:u.chairBlend,floorHeight:Number(u.floorHeight)||0,
  pose:u.socialPose,seat:u.socialPose,climbing:!!u.climbing,driving:!!u.inVehicle,riding,ridePhase:u.bicyclePhase||0,bicycleFit:u.bicycleFit,carrying:!!u.carrying,heldProp:actor.heldProp,umbrella:!!actor.umbrellaProp,
  waving:!!(u.chat?.greeting||actor.gestureTime>0&&!actor.waved),
  talking:!!(u.chat?.speaking||u.speakingUntil>now),
  expression:u.thuanExpression||feeling||(engaged?'smile':'neutral'),
  sleeping,conversing:!!(u.playerConversation||u.chat||u.playing),gaze:Array.isArray(u.lookTarget)?u.lookTarget:null,consumeElapsed:u.consumeElapsed,tipsy:u.tipsy||0,
 });
 // A driver's hands are on the wheel, not hovering in front of it.
 const wheel=u.inVehicle&&entity.parent?.userData?.steeringWheel;
 if(wheel)gripWheel(avatar,entity.parent,wheel,now/1000);
 // Behind a counter (people/izakaya-bar.js): the hands go to the glass, the bottle, the tap, and hold what they took.
 workHands(avatar,u,dt);
 // Hair, skirts and hems swing (springs.js): always for Thuan, near the camera for everyone else.
 if(swingsAt(entity.getWorldPosition(swingAt),actor.isThuan)){avatar.springs?.update(dt);actor.swingResting=false;}
 else if(!actor.swingResting){avatar.springs?.reset();actor.swingResting=true;}
 // Cleaning tools (izakaya-hours.js): one in the right hand while the pose works it.
 const toolKind=u.tool||null;
 if(actor.toolKind!==toolKind){actor.toolProp?.removeFromParent();actor.toolProp=toolKind?createToolProp(toolKind):null;actor.toolKind=toolKind;if(actor.toolProp)avatar.bones.handR.add(actor.toolProp);}
 if(actor.toolProp)fitToolProp(avatar,actor.toolProp);
 if(actor.umbrellaProp)fitUmbrella(avatar,actor.umbrellaProp);
 if(actor.heldProp){
  const c=actor.animator.consumption;
  if(c&&!Number.isFinite(u.heldPortion)&&c.swallow>.5&&actor.consumedCycle!==c.cycle){
   actor.consumedCycle=c.cycle;actor.portion=Math.max(0,actor.portion-(c.food?.25:1/6));setPropPortion(actor.heldProp,c.food?0:actor.portion);
   if(actor.dishProp)setPropPortion(actor.dishProp,actor.portion);
  }
  if(Number.isFinite(u.heldPortion))setPropPortion(actor.heldProp,u.heldPortion);
  else if(c?.food&&c.swallow===0&&actor.portion>0)setPropPortion(actor.heldProp,1);
  updatePropPortion(actor.heldProp,dt);fitAvatarHeldProp(avatar,actor.heldProp,c?.lift||0);
  if(actor.dishProp){if(Number.isFinite(u.foodPortion))setPropPortion(actor.dishProp,u.foodPortion);updatePropPortion(actor.dishProp,dt);fitAvatarHeldProp(avatar,actor.dishProp,0,'L');}
 }
 if(actor.gestureTime>0)actor.waved=true;else actor.waved=false;
}

/** Eye level, for the conversation camera. */
export function avatarConversationTarget(actor,target=new THREE.Vector3()){
 const head=actor.avatar.bones.head,m=actor.avatar.measure;
 head.getWorldPosition(target);target.y+=(m.headCentre-m.headY)*.95;return target;
}

/**
 * The player's body in the third-person view, with the interface game.js already uses
 * for Johansson: play a move, speak, look, sit, hold a drink, change for the bath.
 */
export function createAvatarJohansson({scene,recipe=playerRecipe()}={}){
 const root=new THREE.Group();root.name='Johansson (third person)';root.visible=false;scene.add(root);
 let avatar=buildAvatar(recipe,{shadows:true,faceSize:512}),animator=createAvatarAnimator(avatar,{bowDepth:.18});
 root.add(avatar.root);
 let expression='neutral',expressionUntil=0,speakUntil=0,time=0,seatMove='Sit',outfit='clothes',requested='clothes',held=null,lookPoint=null,move=null,earDefendersOn=false,tableDrink=null,drinkingArm=null,posedSeconds=0,lastState={};
 const hand=()=>avatar.bones.handR;
 const api={
  root,loading:Promise.resolve(true),
  get ready(){return true;},get move(){return move;},get expression(){return expression;},get weights(){return {};},
  get actions(){return [...Object.keys(GESTURES),'Idle','Walk','Run','Sit','SitEat','Soak','Fall'];},
  get avatar(){return avatar;},
  get drinking(){return !!tableDrink?.active;},
  get drinkingState(){return tableDrink?.diagnostics||null;},
  drinkFromTable(lease,callbacks={}){
   if(tableDrink?.active||held||!lease?.active||!TABLE_DRINK_KINDS.includes(lease.kind))return false;
   animator.stop();move=null;expression='neutral';
   // First-person players may instantiate their body only when taking this sip.
   // Fit that unseen initial body to its seat before taking the resting-hand sample.
   if(posedSeconds<.3)animator.update(.7,{...lastState,seated:true,seat:seatMove,tipsy:0});
   tableDrink=createAvatarTableDrink(avatar,lease,callbacks);return true;
  },
  cancelTableDrink(){const result=tableDrink?.cancel();tableDrink=null;drinkingArm?.dispose();drinkingArm=null;return result;},
  play(name,{face}={}){
   if(tableDrink?.active)api.cancelTableDrink();
   move=name;if(face)api.express(face,3);
   const map={Bow:'Bow',Wave:'Wave'};if(!animator.play(map[name]||name))animator.play('Nod');
   const faces={Wave:'happy',Clap:'happy',Kachashi:'laugh',Laugh:'laugh',Think:'thinking',Shrug:'worried',HeadShake:'grumpy',Bow:'content',Nod:'smile',Stretch:'content',LookAround:'surprised',SitToast:'happy',Heart:'happy',Peace:'laugh',Coy:'smile',Tada:'laugh',HandsOnHips:'content',HeelKick:'happy'};
   if(faces[name])api.express(faces[name],(GESTURES[name]===Infinity?4:GESTURES[name]||2)+.6);
  },
  express(name,seconds=3){expression=name;expressionUntil=seconds>0?time+seconds:0;},
  speak(seconds=2){speakUntil=Math.max(speakUntil,time+seconds);},
  lookAt(point){lookPoint=point?point.clone?.()||point:null;},
  seat(name='Sit'){if(tableDrink?.active)api.cancelTableDrink();seatMove=name;},
  /** 'clothes', 'swim', 'towel', 'bath' (what they wear behind Umi-no-yu's noren: bathOutfit) or 'afterbath' (the
   *  lobby's after-bath clothes). Returns what is on. */
  wear(name){if(tableDrink?.active)api.cancelTableDrink();requested=BATH_OUTFITS.includes(name)?name:'clothes';outfit=avatar.wear(requested)||requested;return outfit;},
  get outfit(){return outfit;},
  get measure(){return avatar.measure;},
  /** Ear defenders on or off (avatars/ear-defenders.js); they survive a recipe swap. */
  earDefenders(on){earDefendersOn=!!on;return wearEarDefenders(avatar,earDefendersOn);},
  get earDefendersOn(){return earDefendersOn;},
  /** Where the third-person lens pivots: above the big head and clear of it to the right. */
  get lens(){const m=avatar.measure;return {eye:m.H+.14,side:m.Rh*m.headSX+.26,head:m.headCentre};},
  /** Hip height above the feet when seated, for game.js's seat fit. */
  get sitHip(){const m=avatar.measure;return m.hipY+.09-m.seatDrop;},
  hold(prop){if(tableDrink?.active)api.cancelTableDrink();if(held){if(held.userData.consumable)disposeServing(held);else held.removeFromParent();}held=prop||null;if(!held)avatar.pixar?.grip?.('R',0);if(held){held.position.set(0,-avatar.measure.hand*.4,avatar.measure.hand*.6);hand().add(held);if(held.userData.consumable)fitAvatarHeldProp(avatar,held);}},
  jump(){api.cancelTableDrink();animator.play('Jump');},
  stop(){api.cancelTableDrink();animator.stop();move=null;},
  /** Swap to a new recipe (the creator's save), keeping everything else. */
  setRecipe(next){
   api.cancelTableDrink();
   const r=normalizeRecipe(next);avatar.root.removeFromParent();avatar.dispose();
   avatar=buildAvatar(r,{shadows:true,faceSize:512});animator=createAvatarAnimator(avatar,{bowDepth:.18});root.add(avatar.root);
   outfit=avatar.wear(requested)||requested;if(held)hand().add(held);if(earDefendersOn)wearEarDefenders(avatar,true);
  },
  update(dt,state={}){
   time+=dt;posedSeconds+=Math.max(0,dt);lastState=state;root.visible=!!state.visible;
   if(tableDrink?.active&&!state.seated)api.cancelTableDrink();
   if(expressionUntil&&time>expressionUntil){expression='neutral';expressionUntil=0;}
   if(!animator.gesture)move=null;
   // Seat support samples the original rendered skin. Restore it while solving the
   // pose, then show the arm-only view after the contact solve for this frame.
   drinkingArm?.setVisible(false);
   // Player and residents use the same measured seat support.
   animator.update(dt,{speed:state.speed||0,running:!!state.running,seated:!!state.seated,
    seatHeight:state.seatHeight,seatFront:state.seatFront,seat:seatMove,sleeping:!!state.sleeping,airborne:!!state.airborne,
    talking:tableDrink?.active?false:time<speakUntil,expression,gaze:tableDrink?.active?(tableDrink.lookAt||null):lookPoint,heldProp:held,tipsy:tableDrink?.active?0:state.tipsy||0});
   if(tableDrink?.active){
    tableDrink.update(dt);
    if(tableDrink.active&&state.firstPersonDrinking){drinkingArm??=createFirstPersonDrinkingArm(avatar);drinkingArm.setVisible(true);root.visible=true;}
    else drinkingArm?.setVisible(false);
   }
   if(tableDrink&&!tableDrink.active){tableDrink=null;drinkingArm?.dispose();drinkingArm=null;}
   // Johansson's shirt hem swings wherever he is.
   if(root.visible)avatar.springs?.update(dt);
   if(held?.userData.consumable){
    const c=animator.consumption;
    if(c&&held.userData.finishPortion!==undefined)setPropPortion(held,THREE.MathUtils.lerp(held.userData.startPortion,held.userData.finishPortion,c.swallow));
    updatePropPortion(held,dt);fitAvatarHeldProp(avatar,held,c?.lift||0);
   }
  },
 };
 return api;
}

export {measure};
