import {actionFor,svg} from '../ui/icons.js';

const clean=label=>String(label||'').replace(/^(?:E|Enter|ACTION)\s*·\s*/i,'').trim();
const action=(id,label,icon,key='')=>({id,label,icon,key,primary:false});
const IDs=['act','enterBuildingButton','exitRoomButton','standButton','orderButton','eatButton','drink','goAshoreButton','stayAboardButton'];

/** The rail offers one next action, plus the choices that make sense beside it. */
export function contextActions(state={}){
 const {playing,paused,seated,table,canOrder,orderPending,canEat,canDrink,heldDrink,inside,canExit=true}=state;
 if(!playing||paused)return {actions:[],status:''};
 const actions=[];
 const add=(id,label,icon,key)=>{if(!actions.some(a=>a.id===id))actions.push(action(id,label,icon,key));};
 // Two minutes before the Minato Maru sails, aboard (island/play.js departurePrompt): go ashore, or stay and cross.
 if(state.departure&&!seated){
  add('goAshoreButton','Go ashore','exit','E');add('stayAboardButton','Stay aboard','stand');
  actions[0].primary=true;
  return {actions,status:'Departing '+state.departure.time+' for '+state.departure.place};
 }
 const target=clean(state.targetLabel),enter=clean(state.enterLabel);
 if(seated){
  if(table&&canEat)add('eatButton','Eat','bowl','E');
  else if(table&&canDrink||heldDrink)add('drink','Drink','cup','R');
  else if(table&&canOrder)add('orderButton','Order food & drinks','basket','E');
  else add('standButton','Stand up','stand','E');
  if(table&&canEat)add('eatButton','Eat','bowl','E');
  if(table&&canDrink||heldDrink)add('drink','Drink','cup','R');
  if(table&&canOrder)add('orderButton','Order food & drinks','basket');
  add('standButton','Stand up','stand');
 }else{
  const targetIsDoor=/^(?:enter|exit|leave|step outside|go in|go out|come into)\b/i.test(target);
  if(target&&!targetIsDoor){const face=actionFor(target);add('act',target,face.icon,'E');if(enter)add('enterBuildingButton',enter,'door');}
  else if(enter)add('enterBuildingButton',enter,'door','E');
  else if(target&&/^(?:exit|leave|step outside|go out)\b/i.test(target))add('exitRoomButton','Exit to street','exit','E');
  else if(target){const face=actionFor(target);add('act',target,face.icon,'E');}
  else if(heldDrink)add('drink','Drink','cup','R');
  else if(inside&&canExit)add('exitRoomButton','Exit to street','exit','Enter');
  if(heldDrink)add('drink','Drink','cup','R');
  if(inside&&canExit)add('exitRoomButton','Exit to street','exit','Enter');
 }
 if(actions[0]){actions[0].primary=true;actions[0].key='E';}
 // A press already in flight keeps its target and meaning until release. A new
 // nearby object cannot steal the primary action from under the player's finger.
 const held=state.pressed||[],previous=state.previousActions||[];
 const heldPrimary=previous.find(a=>a.primary&&held.includes(a.id));
 if(heldPrimary){for(const a of actions)a.primary=false;const at=actions.findIndex(a=>a.id===heldPrimary.id);if(at>=0)actions.splice(at,1);actions.unshift({...heldPrimary});}
 for(const id of held){const previousAction=previous.find(a=>a.id===id);if(previousAction&&!actions.some(a=>a.id===id))actions.push({...previousAction,primary:false});}
 return {actions,status:seated&&table&&orderPending?'Your order is on its way.':''};
}

/** Render into existing controls so every input method invokes the same action. */
export function createContextRail({doc=globalThis.document,onAction=()=>{}}={}){
 const rail=doc.querySelector('#contextActions'),status=doc.querySelector('#contextActionStatus');
 const buttons=new Map(IDs.map(id=>[id,doc.querySelector('#'+id)]).filter(([,button])=>button));
 let model={actions:[],status:''},signatures=new Map(),lastState={},selection=null,contextKey='';
 for(const [id,button] of buttons){
  button.onpointerdown=event=>{
   if(event.button!==undefined&&event.button!==0||button.hidden||button.disabled)return;
   event.preventDefault?.();event.stopPropagation?.();return onAction(id,event);
  };
  // Keyboard and assistive technology clicks have no pointer-down counterpart.
  button.onclick=event=>{if(event.detail===0&&!button.hidden&&!button.disabled)return onAction(id,event);};
 }
 return {
  update(state){
   const nextKey=[state.targetLabel,state.enterLabel,state.inside,state.seated].join('/');if(nextKey!==contextKey){selection=null;contextKey=nextKey;}lastState=state;
   model=contextActions({...state,previousActions:model.actions});
   if(selection&&model.actions.some(a=>a.id===selection)&&!state.pressed?.length){for(const a of model.actions){a.primary=a.id===selection;a.key=a.primary?'E':'';}}
   const shown=new Map(model.actions.map(a=>[a.id,a]));
   // When the last action goes, the rail fades out with its words still on it (quiet-hud.css): the buttons that were
   // showing keep their face but can no longer be pressed, reached or read, and the rail itself is hidden.
   const leaving=!model.actions.length&&!model.status;
   for(const [id,button] of buttons){
    const descriptor=shown.get(id),visible=!!descriptor;
    if(leaving&&!button.hidden){button.disabled=true;button.tabIndex=-1;button.setAttribute('aria-hidden','true');continue;}
    button.hidden=!visible;button.disabled=!visible;button.tabIndex=visible?0:-1;
    button.classList.toggle('hidden',!visible);button.classList.toggle('control-off',!visible);button.classList.toggle('context-primary',!!descriptor?.primary);
    button.setAttribute('aria-hidden',String(!visible));
    if(!descriptor)continue;
    const signature=descriptor.label+'/'+descriptor.icon+'/'+descriptor.key;
    if(signatures.get(id)!==signature){
     button.replaceChildren();
     const glyph=doc.createElement('span'),label=doc.createElement('span');
     glyph.className='context-glyph';glyph.innerHTML=svg(descriptor.icon);label.className='context-label';label.textContent=descriptor.label;
     button.append(glyph,label);
     if(descriptor.key){const key=doc.createElement('kbd');key.textContent=descriptor.key;key.setAttribute('aria-hidden','true');button.append(key);}
     button.setAttribute('aria-label',descriptor.label);button.setAttribute('title',descriptor.label);
     if(descriptor.key)button.setAttribute('aria-keyshortcuts',descriptor.key);else button.removeAttribute?.('aria-keyshortcuts');
     signatures.set(id,signature);
    }
   }
   if(status){if(status.textContent!==model.status)status.textContent=model.status;status.hidden=!model.status;}
   if(rail){rail.hidden=!model.actions.length&&!model.status;rail.setAttribute('aria-hidden',String(rail.hidden));}
   return model;
  },
  cycle(step){if(model.actions.length<2)return false;const at=model.actions.findIndex(a=>a.primary);selection=model.actions[(at+step+model.actions.length)%model.actions.length].id;this.update(lastState);return true;},
  get primary(){return model.actions.find(a=>a.primary)||null;},
  activatePrimary(){const primary=model.actions.find(a=>a.primary);if(!primary)return false;onAction(primary.id,{detail:0});return true;},
 };
}
