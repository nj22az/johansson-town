// WebMCP tools for controlling the individual Johansson Town residents.
// Loaded separately from the general player-control surface so NPC control can remain bounded.

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const result=(ok,data={})=>JSON.stringify({ok,...data});
const allowed=new Set(['Nhung','Chin','Mrs Sato','Harbour master','Thao']);

function controller(){return window.__JOHANSSON_CHARACTER_CONTROL__||null;}
function list(){const c=controller();return c?c.list():[];}

async function control({name,action,direction,distance=1.5,seconds=4,target='Johansson'}={}){
  const c=controller();
  if(!c)return result(false,{error:'Character controller is not ready.'});
  if(!allowed.has(name))return result(false,{error:'Only town NPCs can be controlled directly.',allowed:[...allowed]});
  let ok=false;
  if(action==='move'){
    const d=Math.max(.1,Math.min(4,Number(distance)||1.5));
    const vectors={north:[0,-d],south:[0,d],east:[d,0],west:[-d,0],harbour:[0,-d],inland:[0,d]};
    const v=vectors[direction];
    if(!v)return result(false,{error:'direction must be north, south, east, west, harbour, or inland'});
    ok=c.moveNPC(name,{dx:v[0],dz:v[1],seconds});
  }else if(action==='face'){
    const validTarget=target==='Johansson'||allowed.has(target);
    if(!validTarget)return result(false,{error:'Unknown face target.',targets:['Johansson',...allowed]});
    ok=c.faceCharacter(name,target,seconds);
  }else if(action==='gesture'){
    ok=c.gesture(name);
  }else if(action==='release'){
    ok=c.release(name);
  }else return result(false,{error:'action must be move, face, gesture, or release'});
  await sleep(50);
  return result(ok,{action,name,direction:direction||null,target:target||null,characters:list()});
}

const tools=[
  {
    name:'johansson_list_characters',
    description:'List Johansson and all named Johansson Town residents with their current world positions and whether an NPC is under temporary AI control. Read-only.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},
    annotations:{readOnlyHint:true,untrustedContentHint:false},
    execute:async()=>result(true,{characters:list()})
  },
  {
    name:'johansson_control_npc',
    description:'Temporarily control one named NPC in Johansson Town. Move them a bounded distance along the street, make them face another character, play a restrained gesture, or release AI control. Johansson himself is controlled through johansson_move/look/jump.',
    inputSchema:{
      type:'object',
      properties:{
        name:{type:'string',enum:['Nhung','Chin','Mrs Sato','Harbour master','Thao']},
        action:{type:'string',enum:['move','face','gesture','release']},
        direction:{type:'string',enum:['north','south','east','west','harbour','inland']},
        distance:{type:'number',minimum:.1,maximum:4},
        seconds:{type:'number',minimum:.5,maximum:15},
        target:{type:'string',enum:['Johansson','Nhung','Chin','Mrs Sato','Harbour master','Thao']}
      },
      required:['name','action'],
      additionalProperties:false
    },
    annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute:control
  }
];

async function register(){
  const mc=document.modelContext||navigator.modelContext;
  if(!mc||typeof mc.registerTool!=='function'||!controller())return false;
  try{window.__JOHANSSON_WEBMCP_NPC_ABORT__?.abort?.();}catch{}
  const ac=new AbortController();window.__JOHANSSON_WEBMCP_NPC_ABORT__=ac;
  let count=0;
  for(const tool of tools){try{await Promise.resolve(mc.registerTool(tool,{signal:ac.signal}));count++;}catch(error){console.warn(`WebMCP NPC tool ${tool.name} could not register`,error);}}
  window.__JOHANSSON_WEBMCP_NPC__={status:count===tools.length?'ready':'partial',registered:count,tools:tools.slice(0,count).map(t=>t.name)};
  return count>0;
}

(async()=>{
  for(let i=0;i<20;i++){if(await register())return;await sleep(500);}
  window.__JOHANSSON_WEBMCP_NPC__={status:'unsupported',registered:0,tools:[]};
})();
