/** A read-only window on the crew's actual departure work. Opening it never stops or starts the ship. */
export const FERRY_COMMAND_DUTIES=Object.freeze({
 master:'Commands the ship. Receives the readiness reports and gives the orders to let go and manoeuvre.',
 mate:'Leads the deck department. Checks vehicle securing, closures and mooring reports before reporting to the master.',
 chief:'Leads engineering. Prepares the plant, checks steering and controls, and reports machinery ready to the master.',
 oiler:'Works under the chief engineer: auxiliaries, machinery checks and engine-room rounds.',
 bosun:'Leads the deck ratings at the vehicles, ramp and mooring stations under the chief officer.',
 deck:'The able seafarer handles assigned vehicle securing and lines, then reports the station clear.',
 purser:'Completes boarding and the passenger count, clears the passenger access and gives the safety announcement.',
 cook:'Secures the galley and passenger spaces, then assists the purser with passenger readiness.'
});

const portName=port=>port==='airport'?'Kitano-jima':'Minato';
const human=value=>String(value||'').replace(/[-_]/g,' ').replace(/^./,c=>c.toUpperCase());
const completeLine=line=>['in','clear','stowed','aboard','coiled'].includes(line.status);
export function ferryOperationSummary(run){
 const op=run?.operation;
 if(!op)return {active:false,label:'Alongside '+portName(run?.berth),detail:'Choose a sailing at the landing. The crew prepare the ship before letting go.',report:'',checks:[]};
 const history=op.history||[],last=history.at(-1),blocks=Array.isArray(op.blocking)?op.blocking.filter(Boolean):op.blocking?[op.blocking]:[];
 const tasks=op.tasks||[],done=tasks.filter(t=>t.complete).length;
 const progress=Number.isFinite(op.phaseProgress)?Math.max(0,Math.min(1,op.phaseProgress)):null;
 const vehicle=op.vehicleSummary;
 const checks=[];
 if(op.plant)checks.push(['Machinery',op.plant.ready?'Ready':op.plant.label||human(op.plant.stage)||'Being prepared']);
 if(vehicle){const driversPending=vehicle.driversClear===false||Number.isFinite(vehicle.driversClear)&&vehicle.driversClear<(vehicle.aboard??0);
  checks.push(['Vehicles',`${vehicle.secured??0} of ${vehicle.aboard??0} secured${driversPending?' · drivers still on vehicle deck':''}`]);}
 if(op.ramp)checks.push(['Ramp',op.ramp.locked?'Up and locked':op.ramp.down>.99?'Down':op.ramp.down>.01?'Moving':'Checking locks']);
 if(op.gangway)checks.push(['Passenger access',op.gangway.out>=.999?'Open':op.gangway.out>0?'Moving · access closed':'Recovered and closed']);
 if(op.lines?.length){const arrival=['making-fast','opening-access','alongside'].includes(op.stage);
  checks.push(['Moorings',arrival?`${op.lines.filter(l=>l.status==='fast').length} of ${op.lines.length} lines fast`:`${op.lines.filter(completeLine).length} of ${op.lines.length} lines recovered`]);}
 return {active:true,label:op.label||human(op.stage),detail:blocks.length?blocks.join(' · '):tasks.length?`${done} of ${tasks.length} assigned tasks complete`:'Bound for '+portName(op.destination||run.destination),
  report:last?`${last.speaker||human(last.post)||'Bridge'}: ${last.text}`:'',checks,progress,history,stage:op.stage};
}

export function createFerryOperationsView({parent,run,getMinutes=()=>0,getCrew=()=>[],getProcedure=()=>({})}){
 if(!parent||!run)return null;
 const doc=parent.ownerDocument||document,el=(tag,cls,text)=>{const n=doc.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 const root=el('details','ferry-operations');root.id='ferryOperations';root.hidden=true;
 const summary=el('summary','ferry-operations-summary');summary.id='ferryOperationsToggle';summary.setAttribute('aria-controls','ferryOperationsBody');
 const brand=el('span','ferry-operations-brand','Minato Maru'),heading=el('strong','ferry-operations-title','Departure & crew');summary.append(brand,heading);
 const body=el('div','ferry-operations-body');body.id='ferryOperationsBody';
 const close=el('button','ferry-operations-close','Close');close.type='button';close.id='closeFerryOperations';close.setAttribute('aria-label','Close ferry departure and crew');
 const detail=el('p','ferry-operations-detail'),radio=el('p','ferry-operations-radio');radio.setAttribute('role','status');radio.setAttribute('aria-live','polite');
 const progress=el('progress','ferry-operations-progress');progress.max=1;progress.setAttribute('aria-label','Current departure task progress');
 const checks=el('dl','ferry-operations-checks');
 const section=(title,id)=>{const d=el('details','ferry-operations-section'),s=el('summary','',title);s.id=id;d.append(s);body.append(d);return d;};
 body.append(close,detail,progress,radio,checks);
 const sequence=section('Startup and departure sequence','ferryProcedureToggle'),procedure=el('ol','ferry-procedure');sequence.append(procedure);
 const note=el('p','ferry-operations-note','On a normal turnround, machinery already running is checked. A cold start also prepares generators, pumps, starting air and the main engines. The same readiness checks apply to both.');sequence.append(note);
 const crewSection=section('Chain of command','ferryCrewToggle'),crew=el('dl','ferry-crew-list');crewSection.append(crew);
 crewSection.append(el('p','ferry-operations-note','The shore line handler works with the ship’s mooring team. The master retains the decision to let go; the chief officer receives and reports the station clearances.'));
 const reportsSection=section('Recent crew reports','ferryReportsToggle'),reports=el('ol','ferry-reports');reportsSection.append(reports);
 root.append(summary,body);parent.append(root);
 let pinned=false,dismissed=null,lastKey='',lastStatic='';
 const setText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
 const closeView=()=>{pinned=false;root.open=false;dismissed=run.operation?.id??'alongside';root.hidden=true;};
 close.onclick=closeView;
 root.addEventListener?.('keydown',event=>{if(event.key==='Escape'){event.stopPropagation();closeView();}});
 root.addEventListener?.('pointerdown',event=>event.stopPropagation());
 root.addEventListener?.('toggle',()=>summary.setAttribute('aria-expanded',String(root.open)));
 function staticContent(){
  const roster=getCrew(getMinutes()),plan=getProcedure(),rows=Array.isArray(plan)?plan:Object.entries(plan).map(([stage,p])=>({stage,...p}));
  const key=JSON.stringify([roster,rows]);if(key===lastStatic)return;lastStatic=key;
  crew.replaceChildren();for(const person of roster){const label=person.name&&person.name!==person.title?`${person.title} · ${person.name}`:person.title;
   crew.append(el('dt','',label),el('dd','',FERRY_COMMAND_DUTIES[person.post]||'Reports to the responsible department head.'));}
  procedure.replaceChildren();for(const row of rows.filter(row=>row.sequential!==false&&row.stage!=='held')){const li=el('li','');li.append(el('strong','',row.label||human(row.stage)));if(row.description)li.append(el('span','',row.description));procedure.append(li);}
 }
 function update({visible=false}={}){
  const op=run.operation,s=ferryOperationSummary(run),id=op?.id??'alongside';
  if(dismissed!==id)dismissed=null;
  root.hidden=!(pinned||visible&&dismissed===null);if(root.hidden)return;
  setText(heading,s.label);summary.setAttribute('aria-label',`Minato Maru: ${s.label}. Departure and crew`);root.dataset.stage=s.stage||'alongside';
  const key=JSON.stringify([s.label,s.detail,s.report,s.checks,Math.round((s.progress??0)*100),s.history?.at(-1)?.sequence]);if(key===lastKey)return;lastKey=key;
  setText(detail,s.detail);setText(radio,s.report||'The crew report their work here as it happens.');
  progress.hidden=s.progress===null||s.progress===undefined;if(!progress.hidden)progress.value=s.progress;
  if(root.open){
   checks.replaceChildren();for(const [label,value] of s.checks)checks.append(el('dt','',label),el('dd','',value));
   reports.replaceChildren();for(const item of (s.history||[]).slice(-12).reverse())reports.append(el('li','',`${item.speaker||human(item.post)||'Bridge'}: ${item.text}`));
   if(!reports.children.length)reports.append(el('li','','No departure has been requested.'));
   staticContent();
  }
 }
 root.addEventListener?.('toggle',()=>{lastKey='';if(root.open){staticContent();update({visible:true});}});
 return {element:root,update,open(){pinned=true;dismissed=null;root.hidden=false;root.open=true;lastKey='';staticContent();update({visible:true});},close:closeView,destroy(){root.remove();}};
}
