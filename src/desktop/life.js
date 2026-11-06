import {playableRoster,restoreLife,shouldSleep,insultResident,apologiseTo,canonicalResidentName} from './life-state.js';
import {recoverSakuraBenchCheckpoint} from '../world/openings.js';
/** Linux-only possession and personal homes. Rendering and navigation stay owned by the game. */
export function createLinuxLife({state,names,getMinutes,getPose,getEntityPose,applyIdentity,spawnHome,spawnOutside,menu,close,save,say}){
 const roster=playableRoster(names);let life=state.desktopLife=restoreLife(state.desktopLife,roster),inBed=false,bed=null,busy=false,generation=0;
 // Restore all resident records before start/select so neither path can place someone in the former bench's shrubs.
 for(const person of Object.values(life.people))if(person.checkpoint)person.checkpoint=recoverSakuraBenchCheckpoint(person.checkpoint);
 const current=()=>roster.find(p=>p.name===life.active);
 function checkpoint(){const p=getPose();if(!p)return;life.people[life.active].checkpoint={x:p.x,z:p.z,yaw:p.yaw,atHome:!!p.atHome};state.desktopLife=life;}
 function snapshot(){return {active:life.active,home:current().home,inBed,busy,roster:roster.map(p=>({name:p.name,home:p.home.address})),bed:bed?{position:bed.position,stand:bed.stand,axis:bed.axis}:null};}
 function wake(){if(!inBed)return false;inBed=false;spawnOutside({homeBedside:bed.stand,yaw:0});say(life.active+' gets out of bed. Your home is here whenever you need it.',5);checkpoint();save();return true;}
 async function goHome({sleep=shouldSleep(life.active,getMinutes())}={}){
  if(busy)throw Error('The home is still opening.');busy=true;const ticket=++generation;
  try{const layout=await spawnHome(current(),sleep);if(ticket!==generation)return;bed=layout;inBed=!!sleep;checkpoint();save();say(sleep?life.active+' is in their own bed. Move the left stick to get up.':life.active+' is home at '+current().home.address+'.',7);}finally{busy=false;}
 }
 async function select(name,{started=true}={}){
  const person=roster.find(p=>p.name===name);if(!person)throw Error('That character is not in this island.');if(busy)throw Error('Wait for the home to finish opening.');
  checkpoint();inBed=false;bed=null;life.active=name;applyIdentity(name);state.desktopLife=life;save();
  if(!started)return;
  const point=life.people[name].checkpoint;
  if(shouldSleep(name,getMinutes())||point?.atHome)await goHome();
  else {const position=point||getEntityPose(name);if(position)spawnOutside(position);else await goHome({sleep:false});checkpoint();save();}
 }
 function social(target,result=null){
  if(target===life.active)return;
  const text=result?.text||'Choose your words. If words become hurtful, the conversation ends. You can apologise or walk away.';
  const choices=[['Apologise',()=>{apologiseTo(life,target);save();menu(target,'Apology accepted. Give each other a little space.',[['Leave',close]],{desktopSocial:false});}],['Leave them alone',close]];
  if(!result||result.kind==='warning')choices.push(['Insult '+target+(result?' again':''),()=>insult(target)]);
  menu(target,text,choices,{desktopSocial:false});
 }
 function insult(target){const result=insultResident(life,target,getMinutes());save();social(target,result);}
 applyIdentity(life.active);
 return {roster,current,snapshot,checkpoint,wake,goHome,select,
  leaveHome(){inBed=false;bed=null;},
  get inBed(){return inBed;},get busy(){return busy;},get active(){return life.active;},get bed(){return bed;},
  async start(){applyIdentity(life.active);if(shouldSleep(life.active,getMinutes())){await goHome({sleep:true});return true;}const saved=life.people[life.active].checkpoint;if(saved?.atHome){await goHome({sleep:false});return true;}if(saved){spawnOutside(saved);return true;}if(life.active!=='Johansson'){const p=getEntityPose(life.active);if(p)spawnOutside(p);else await goHome({sleep:false});return true;}return false;},
  conversationActions(title,buttons,options={}){if(options.desktopSocial===false)return buttons;const name=canonicalResidentName(title.split('·')[0].trim());if(!roster.some(p=>p.name===name)||name===life.active||buttons.some(([label])=>/^Insult |^Clear the air/.test(label)))return buttons;return [...buttons,['Clear the air…',()=>social(name)]];},
 };
}
