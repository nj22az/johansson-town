// Johansson Town WebMCP surface — browser-native tools for AI agents.
// Current WebMCP draft: https://webmachinelearning.github.io/webmcp/
// Uses document.modelContext when available, with the older navigator.modelContext alias as fallback.
// The game remains fully playable without WebMCP.

const TOOL_PREFIX='johansson_';
const DESTINATIONS=Object.freeze({
  office:'The Office',
  frontrow:'Front-Row Books',
  form3d:'Form 3D Workshop',
  stepwise:'StepWise Instruments',
  journal:'The Journal Press',
  electronics:'Johansson Electronics',
  market:'Colonial Club Market',
  career:'Career Bureau',
  ramen:'Sato Ramen',
  izakaya:'Minato Izakaya',
  'tea-house':'Corner Tea House'
});

const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const visible=el=>!!el&&!el.classList.contains('hidden');
const text=id=>(document.querySelector(id)?.textContent||'').trim();
const normal=s=>String(s||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,' ');
const result=(ok,data={})=>JSON.stringify({ok,...data});

function gameReady(){return window.__JOHANSSON_RUNNING__===true&&visible(document.querySelector('#hud'));}
function activityOpen(){return visible(document.querySelector('#activity'));}
function directoryOpen(){return visible(document.querySelector('#directory'));}

function dispatchKey(code,type='keydown'){
  const keyMap={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ShiftLeft:'Shift',Space:' ',KeyE:'e',KeyQ:'q',KeyB:'b',KeyN:'n'};
  const event=new KeyboardEvent(type,{code,key:keyMap[code]||'',bubbles:true,cancelable:true,repeat:false});
  document.dispatchEvent(event);
}

function actionButtons(){
  if(window.__JOHANSSON_AGENT_CONTEXT__?.()?.concert?.active)return [...document.querySelectorAll('#concert button:not(:disabled)')].filter(b=>b.getClientRects().length);
  return [...document.querySelectorAll('#activityActions button:not(:disabled), #activity .bag-tile:not(:disabled), #activity .resident-list button:not(:disabled)')].filter(visible);
}

function getState(){
  const context=window.__JOHANSSON_AGENT_CONTEXT__?.(),allowed=context?.controlsAllowed??true,prompt=document.querySelector('#prompt');
  const concert=context?.concert?.active?context.concert:null;
  const modal=activityOpen()&&!concert;
  const directory=directoryOpen();
  const buttons=modal||concert?actionButtons().map((b,index)=>({index,label:(b.textContent||'').trim()})):[];
  const destinations=directory?[...document.querySelectorAll('#directoryGrid [data-id]')].map(b=>({id:b.dataset.id,label:(b.querySelector('b')?.textContent||b.textContent||'').trim(),quickTravel:b.dataset.travel==='ready'})):[];
  return {
    running:gameReady(),
    place:text('#place'),
    placeDetail:text('#placeSub'),
    time:text('#clock'),
    wallet:text('#wallet'),
    nearbyAction:prompt?.classList.contains('on')?text('#prompt'):'',
    subtitle:text('#subtitle'),
    activity:modal?{
      title:text('#activityTitle'),
      body:text('#activityBody'),
      actions:buttons
    }:null,
    concert:concert?{...concert,actions:buttons,choices:{songs:[...document.querySelectorAll('#concert [name="song"] option')].map(o=>({id:o.value,title:o.textContent})),singers:[...document.querySelectorAll('#concert [name="cast0"] option')].map(o=>o.value),arrangements:[...document.querySelectorAll('#concert [name="style"] option')].map(o=>o.value),voices:[...document.querySelectorAll('#concert [name="voice"] option')].map(o=>o.value),performances:[...document.querySelectorAll('#concert [name="performance"] option')].map(o=>o.value)}}:null,
    directoryOpen:directory,
    directoryDestinations:destinations,
    knownDestinations:context?.destinations||DESTINATIONS,
    controls:{jump:allowed,interact:allowed,move:allowed,look:allowed,directoryTravel:!concert,activityChoice:true},
    webmcp:window.__JOHANSSON_WEBMCP__||{status:'initialising'}
  };
}

async function move({direction,durationMs=700,run=false}={}){
  if(!gameReady())return result(false,{error:'Johansson Town is not running. Enter the town first.'});
  if(!getState().controls.move)return result(false,{error:'Movement is blocked by the current game state.',state:getState()});
  if(activityOpen()||directoryOpen())return result(false,{error:'Movement is blocked while a modal or directory is open.',state:getState()});
  const codes={forward:'KeyW',backward:'KeyS',left:'KeyA',right:'KeyD'};
  const code=codes[direction];
  if(!code)return result(false,{error:'direction must be forward, backward, left, or right'});
  const ms=Math.max(80,Math.min(2500,Number(durationMs)||700));
  if(run)dispatchKey('ShiftLeft','keydown');
  dispatchKey(code,'keydown');
  try{await sleep(ms);}finally{
    dispatchKey(code,'keyup');
    if(run)dispatchKey('ShiftLeft','keyup');
  }
  return result(true,{action:'move',direction,durationMs:ms,run:!!run,state:getState()});
}

async function look({direction,degrees=45}={}){
  if(!gameReady())return result(false,{error:'Johansson Town is not running.'});
  if(!getState().controls.look)return result(false,{error:'Camera control is blocked by the current game state.',state:getState()});
  if(activityOpen()||directoryOpen())return result(false,{error:'Camera control is blocked while a modal or directory is open.',state:getState()});
  if(direction!=='left'&&direction!=='right')return result(false,{error:'direction must be left or right'});
  const deg=Math.max(5,Math.min(180,Number(degrees)||45));
  // The game already implements touch-look without pointer lock. Feed that same path
  // with a small synthetic touch-like event rather than reaching into private Three.js state.
  const id=91731,startX=Math.max(innerWidth*.72,innerWidth-120),startY=innerHeight*.46;
  const px=(deg*Math.PI/180)/.005*(direction==='right'?1:-1);
  const make=(type,x)=>{
    const e=new Event(type,{bubbles:true,cancelable:true});
    Object.defineProperty(e,'changedTouches',{value:[{identifier:id,clientX:x,clientY:startY}],configurable:true});
    return e;
  };
  const canvas=document.querySelector('#game');
  canvas?.dispatchEvent(make('touchstart',startX));
  canvas?.dispatchEvent(make('touchmove',startX+px));
  canvas?.dispatchEvent(make('touchend',startX+px));
  await sleep(30);
  return result(true,{action:'look',direction,degrees:deg,state:getState()});
}

async function jump(){
  if(!gameReady())return result(false,{error:'Johansson Town is not running.'});
  if(!getState().controls.jump)return result(false,{error:'Jump is blocked by the current game state.',state:getState()});
  if(activityOpen()||directoryOpen())return result(false,{error:'Jump is blocked while a modal or directory is open.'});
  let accepted=false;
  if(typeof window.__JOHANSSON_JUMP__==='function')accepted=window.__JOHANSSON_JUMP__()===true;
  else{dispatchKey('Space','keydown');dispatchKey('Space','keyup');accepted=true;}
  return result(accepted,{action:'jump',accepted,state:getState()});
}

async function interact(){
  if(!gameReady())return result(false,{error:'Johansson Town is not running.'});
  if(!getState().controls.interact)return result(false,{error:'Interaction is blocked by the current game state.',state:getState()});
  if(activityOpen())return result(false,{error:'An activity is already open. Use johansson_choose_action instead.',state:getState()});
  if(directoryOpen())return result(false,{error:'The directory is open. Travel or close it first.',state:getState()});
  const before=text('#prompt');
  dispatchKey('KeyE','keydown');dispatchKey('KeyE','keyup');
  await sleep(80);
  return result(true,{action:'interact',promptBefore:before||null,state:getState()});
}

async function travel({destination}={}){
  if(getState().concert)return result(false,{error:'Return to Minato before travelling.'});
  if(!gameReady())return result(false,{error:'Johansson Town is not running.'});
  if(activityOpen())return result(false,{error:'Close the current activity before using the directory.',state:getState()});
  const wanted=normal(destination),destinations=window.__JOHANSSON_AGENT_CONTEXT__?.().destinations||DESTINATIONS;
  const id=Object.keys(destinations).find(key=>normal(key)===wanted||normal(destinations[key])===wanted||normal(destinations[key]).includes(wanted));
  if(!id)return result(false,{error:'Unknown destination.',destinations});
  if(!directoryOpen())document.querySelector('#directoryButton')?.click();
  await sleep(20);
  const disclosure=document.querySelector('.menu-places');if(disclosure&&!disclosure.open)disclosure.querySelector('summary')?.click();
  const search=document.querySelector('#directoryGrid .town-search');if(search){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}));}
  const places=document.querySelector('#directoryGrid [data-town-filter="places"]');places?.click();
  const target=()=>document.querySelector(`#directoryGrid [data-shortcut="${CSS.escape(id)}"]`)||document.querySelector(`#directoryGrid [data-id="${CSS.escape(id)}"]`);
  let button=target();
  if(!button){document.querySelector('#directoryGrid [data-town-filter="homes"]')?.click();button=target();}
  if(!button)return result(false,{error:'Destination button is unavailable.',destination:id,state:getState()});
  if(button.dataset.travel!=='ready'){button.click();return result(false,{error:'Quick travel is locked. Bring Tama home and finish Chin’s workshop escort. Walking directions are marked.',destination:id,state:getState()});}
  button.click();
  await sleep(80);
  return result(true,{action:'directory_travel',destination:id,label:destinations[id],state:getState()});
}

async function chooseAction({label,index}={}){
  if(!activityOpen()&&!getState().concert)return result(false,{error:'No activity dialog is open.',state:getState()});
  const buttons=actionButtons();
  let button=null;
  if(Number.isInteger(index)&&index>=0&&index<buttons.length)button=buttons[index];
  if(!button&&label){const wanted=normal(label);button=buttons.find(b=>normal(b.textContent)===wanted)||buttons.find(b=>normal(b.textContent).includes(wanted));}
  if(!button)return result(false,{error:'No matching enabled action.',actions:buttons.map((b,i)=>({index:i,label:(b.textContent||'').trim()}))});
  const chosen=(button.textContent||'').trim();
  button.click();
  await sleep(80);
  return result(true,{action:'choose_action',chosen,state:getState()});
}

async function ui({control}={}){
  if(!gameReady())return result(false,{error:'Johansson Town is not running.'});
  if(getState().concert)return result(false,{error:'Finish or close the karaoke panel first.',state:getState()});
  const map={
    notebook:'#notebookButton',time:'#timeButton',weather:'#weatherButton',sound:'#soundButton',directory:'#directoryButton',close_activity:'#closeActivity',close_directory:'#closeDirectory',ferry_operations:'#ferryOperationsButton',close_ferry_operations:'#closeFerryOperations',ferry_sequence:'#ferryProcedureToggle',ferry_crew:'#ferryCrewToggle',ferry_reports:'#ferryReportsToggle'
  };
  const selector=map[control];
  if(!selector)return result(false,{error:'Unknown control.',controls:Object.keys(map)});
  if(['notebook','time','weather','sound','ferry_operations'].includes(control)&&!directoryOpen()){
    document.querySelector('#directoryButton')?.click();await sleep(20);
  }
  const button=document.querySelector(selector);
  if(!button)return result(false,{error:'Control is unavailable.',control});
  // Open each enclosing disclosure through its summary, as a player would.
  const disclosures=[];for(let p=button.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)disclosures.unshift(p);
  for(const details of disclosures)details.querySelector('summary')?.click();
  button.click();
  await sleep(60);
  return result(true,{action:'ui',control,state:getState()});
}

async function concert({song,arrangement,voice,performance,cast,title,lines}={}){
 const state=getState();if(!state.concert)return result(false,{error:'Use the karaoke machine at Minato first.'});
 if(state.concert.playing||state.concert.busy)return result(false,{error:'Stop the performance before editing it.'});
 const set=(name,value)=>{const field=document.querySelector('#concert [name="'+name+'"]');field.value=value;field.dispatchEvent(new Event('change',{bubbles:true}));};
 if(song!==undefined&&!state.concert.choices.songs.some(s=>s.id===song))return result(false,{error:'Unknown song.'});
 if(arrangement!==undefined&&!state.concert.choices.arrangements.includes(arrangement))return result(false,{error:'Unknown arrangement.'});
 if(voice!==undefined&&!state.concert.choices.voices.includes(voice))return result(false,{error:'Unknown character voice.'});
 if(performance!==undefined&&!state.concert.choices.performances.includes(performance))return result(false,{error:'Unknown stage energy.'});
 if(cast!==undefined&&(!Array.isArray(cast)||cast.length<1||cast.length>4||new Set(cast).size!==cast.length||cast.some(n=>!state.concert.choices.singers.includes(n))))return result(false,{error:'Choose one to four distinct singers from the song book.'});
 if(title!==undefined&&(typeof title!=='string'||title.length>48))return result(false,{error:'The title is limited to 48 characters.'});
 if(lines!==undefined&&(!Array.isArray(lines)||lines.length!==4||lines.some(l=>typeof l!=='string'||l.length>64)))return result(false,{error:'Supply four lyric lines of at most 64 characters each.'});
 if(song!==undefined)set('song',song);if(arrangement!==undefined)set('style',arrangement);if(voice!==undefined)set('voice',voice);if(performance!==undefined)set('performance',performance);
 if(cast){set('size',String(cast.length));cast.forEach((name,i)=>set('cast'+i,name));}
 if(title!==undefined)set('title',title);if(lines)lines.forEach((l,i)=>set('line'+i,l));
 return result(true,{state:getState()});
}
const API=Object.freeze({getState,move,look,jump,interact,travel,chooseAction,ui,concert});
window.__JOHANSSON_AGENT_API__=API;
window.__JOHANSSON_WEBMCP__={status:'waiting-for-model-context',registered:0,api:'2026-draft',tools:[]};

const tools=[
  {
    name:TOOL_PREFIX+'concert',
    description:'Configure the open Minato karaoke song book. Use the physical karaoke machine first. Choose original song, one of six genre arrangements, live text voice, stage energy, one to four singers, title and four custom lyric lines spoken live by device TTS. Go wild adds chicken dancing, jelly wobbling and comic acting. Test voice checks speech availability. Cheer! adds a backing response while performing. Use choose_action to Perform, Stop, Encore or Return to Minato. A new session costs 100 in-game yen; encores are included.',
    inputSchema:{type:'object',properties:{song:{type:'string',enum:['harbour','bus','summer']},arrangement:{type:'string',enum:['pop','ballad','disco','rock','enka','eurobeat']},voice:{type:'string',enum:['cast','crooner','alto','belt','chip']},performance:{type:'string',enum:['relaxed','showtime','wild']},cast:{type:'array',items:{type:'string'},minItems:1,maxItems:4,uniqueItems:true},title:{type:'string',maxLength:48},lines:{type:'array',items:{type:'string',maxLength:64},minItems:4,maxItems:4}},additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},execute:concert
  },
  {
    name:TOOL_PREFIX+'get_state',
    description:'Read the current Johansson Town game state: location, clock, wallet, nearby interaction prompt, open activity and its available buttons. This does not change the game.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:async()=>result(true,{state:getState()})
  },
  {
    name:TOOL_PREFIX+'move',
    description:'Move Johansson using the same movement controls as the player. Direction is camera-relative. Duration is bounded to 80–2500 ms. Set run=true for faster movement.',
    inputSchema:{type:'object',properties:{direction:{type:'string',enum:['forward','backward','left','right']},durationMs:{type:'integer',minimum:80,maximum:2500},run:{type:'boolean'}},required:['direction'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:move
  },
  {
    name:TOOL_PREFIX+'look',
    description:'Turn Johansson Town camera left or right by a bounded number of degrees, using the game touch-look path.',
    inputSchema:{type:'object',properties:{direction:{type:'string',enum:['left','right']},degrees:{type:'number',minimum:5,maximum:180}},required:['direction'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:look
  },
  {
    name:TOOL_PREFIX+'jump',
    description:'Make Johansson jump once using the game jump controller. A second jump is rejected while already airborne.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:jump
  },
  {
    name:TOOL_PREFIX+'interact',
    description:'Use the current nearby ACTION/TALK/ENTER interaction in Johansson Town. Read johansson_get_state first to see the nearby prompt.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:interact
  },
  {
    name:TOOL_PREFIX+'travel',
    description:'Use unlocked town shortcuts to travel to a named place. Requires bringing Tama home and finishing Chin’s workshop escort. Before unlocking, marks walking directions and returns a locked result without moving the player.',
    inputSchema:{type:'object',properties:{destination:{type:'string',description:'Destination id or display name, such as frontrow or Front-Row Books.'}},required:['destination'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:travel
  },
  {
    name:TOOL_PREFIX+'choose_action',
    description:'Choose one enabled button in the currently open activity/dialogue. This can spend in-game yen or advance quests, exactly like the visible button. Select by label or zero-based index.',
    inputSchema:{type:'object',properties:{label:{type:'string'},index:{type:'integer',minimum:0}},additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:chooseAction
  },
  {
    name:TOOL_PREFIX+'ui',
    description:'Operate a Johansson Town HUD control, including the read-only ferry departure and crew view.',
    inputSchema:{type:'object',properties:{control:{type:'string',enum:['notebook','time','weather','sound','directory','close_activity','close_directory','ferry_operations','close_ferry_operations','ferry_sequence','ferry_crew','ferry_reports']}},required:['control'],additionalProperties:false},
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:ui
  }
];

async function registerWebMCP(){
  const mc=document.modelContext||navigator.modelContext;
  if(!mc||typeof mc.registerTool!=='function')return false;
  try{window.__JOHANSSON_WEBMCP_ABORT__?.abort?.();}catch{}
  const controller=new AbortController();
  window.__JOHANSSON_WEBMCP_ABORT__=controller;
  let registered=0;
  for(const tool of tools){
    try{
      await Promise.resolve(mc.registerTool(tool,{signal:controller.signal}));
      registered++;
    }catch(error){
      console.warn(`WebMCP tool ${tool.name} could not register`,error);
    }
  }
  window.__JOHANSSON_WEBMCP__={
    status:registered===tools.length?'ready':'partial',
    registered,
    api:document.modelContext?'document.modelContext':'navigator.modelContext',
    tools:tools.slice(0,registered).map(t=>t.name)
  };
  document.documentElement.dataset.webmcp=registered?'ready':'partial';
  console.info(`Johansson Town WebMCP: ${registered}/${tools.length} tools registered`,window.__JOHANSSON_WEBMCP__);
  return registered>0;
}

// Native implementations expose modelContext synchronously. Some extensions/polyfills
// inject it shortly after page load, so retry briefly without making it a game dependency.
(async()=>{
  for(let attempt=0;attempt<20;attempt++){
    if(await registerWebMCP())return;
    await sleep(500);
  }
  window.__JOHANSSON_WEBMCP__={status:'unsupported',registered:0,api:null,tools:[]};
  document.documentElement.dataset.webmcp='unsupported';
  console.info('Johansson Town: WebMCP is not available in this browser. Human controls remain unchanged; window.__JOHANSSON_AGENT_API__ is available to compatible browser-agent bridges.');
})();
