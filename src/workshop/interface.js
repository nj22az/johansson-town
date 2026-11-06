import {sakuraStock,saleProblem,sellToSakura} from '../commerce/sakura-economy.js';
import {WORKSHOP_MODELS,workshopModel,modelTicket} from './catalogue.js';
import {printProblem,startPrint,collectPrint,canSellAtSakura} from './production.js';
import {recordFormSale} from '../progression/soft-quests.js';
import {isWorkshopSite} from '../world/businesses.js';

export function createWorkshopUI({state,show,close,save,say,note,getContext,getMinutes,preview,body,modal}){
 let embedded=null;
 const inWorkshop=()=>isWorkshopSite(getContext().inside);
 const selection=()=>workshopModel(state.workshop.selected)||WORKSHOP_MODELS[0];
 function unavailable(){show('Workshop','Use the printer at the workshop bench.',[['Back',close]]);}
 function choose(model,next){state.workshop.selected=model.id;save();next();}
 function openTool(tool){
  if(!inWorkshop()){unavailable();return;}
  const calculator=tool==='stepwise',title=calculator?'StepWise calculator':'Form 3D Studio';
  show(title,calculator?'Use the calculator, then return to the workshop estimate.':'Explore your designs here. Return to the printer to make one of its five stocked patterns.',[[calculator?'Back to StepWise estimate':'Back to printer',calculator?stepwise:printer],['Leave the bench',close]]);
  modal.classList.add('workshop-tool');
  const frame=document.createElement('iframe');frame.title=title;frame.src=calculator?'/stepbuddy/':'/form-3d-studio/';
  frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');frame.setAttribute('referrerpolicy','same-origin');
  frame.onload=()=>{try{frame.contentDocument.addEventListener('keydown',event=>{if(event.code==='Escape'){event.preventDefault();close();}});}catch{/* Same-origin apps; the close button remains available if a page cannot load. */}};
  frame.className='workshop-app-frame';body.append(frame);embedded=frame;
 }
 function printer(){
  if(!inWorkshop()){unavailable();return;}
  const job=state.workshop.job;
  if(job){
   const model=workshopModel(job.id),ready=job.remaining===0;
   show('Form 3D · '+(ready?'Ready to collect':'Printing'),model.name+'\n\n'+(ready?'Your model is on the print bed. Collect it for your inventory, or leave it here until there is room.':Math.ceil(job.remaining)+' seconds remaining. The machine runs while you explore; return to collect the finished model.'),[
    ...(ready?[['Collect model',()=>{if(!inWorkshop()){unavailable();return;}const result=collectPrint(state);if(!result.ok){show('Form 3D',result.message,[['Back to printer',printer]]);return;}save();note('Printed '+model.name+' at Chin’s workshop.');show('Added to your inventory',model.name+' · 1 of 1\n\nTalk to Thuan at Sakura Konbini. When her takings cover it, she offers ¥'+model.price+'.',[['Inspect model',()=>preview(model)],['Back to printer',printer],['Leave the bench',close]]);}]]:[]),
    [ready?'Leave it on the machine':'Leave the machine running',close],
   ]);return;
  }
  const model=selection(),problem=printProblem(state,model.id);
  show('Form 3D · Workshop printer',model.name+'\n'+model.description+'\n\nMaterials ¥'+model.material+' · Thuan pays ¥'+model.price+'\nPrint time '+model.seconds+' seconds\n\n'+(problem||'Carry one of each model. Sell a copy at Sakura to make room for another.'),[
   ['Print model · ¥'+model.material,()=>{if(!inWorkshop()){unavailable();return;}const result=startPrint(state,model.id);if(!result.ok){printer();return;}if(!state.operated.includes('Form 3D printer'))state.operated.push('Form 3D printer');save();close();say('Form 3D: printing '+model.name+'. Return to collect it in '+model.seconds+' seconds.',5);},!!problem],
   ['Preview model in 3D',()=>preview(model)],
   ['Check with StepWise',stepwise],
   ...WORKSHOP_MODELS.filter(other=>other.id!==model.id).map(other=>[other.name+(state.inventory.includes(other.name)?' · In bag':''),()=>choose(other,printer)]),
   ['Open Form 3D Studio',()=>openTool('form3d')],['Leave the bench',close],
  ]);
 }
 function stepwise(){
  if(!inWorkshop()){unavailable();return;}
  const model=selection();note('Checked the StepWise workshop estimate.');
  show('StepWise · Workshop estimate',model.name+'\n\n'+modelTicket(model)+'\n\nYour balance: ¥'+state.yen,[
   ['Use this pattern in Form 3D',printer],['Open StepWise calculator',()=>openTool('stepwise')],
   ...WORKSHOP_MODELS.filter(other=>other.id!==model.id).map(other=>[other.name,()=>choose(other,stepwise)]),['Leave the bench',close],
  ]);
 }
 function selling(){
  if(!canSellAtSakura(getContext(),getMinutes())){show('Thuan · Shop counter','Bring your items to Sakura while I am working, from 09:00 to 20:00.',[['Back',close]]);return;}
  const offers=sakuraStock(state),cash=state.sakura.cash;
  show('Thuan · Buy and sell','Shop takings available: ¥'+cash+'\n\nI use my sales to buy useful finds, fresh fish and your workshop creations. Tidy up around town or make something at Chin’s workshop. Personal papers stay with you.\n\n'+(offers.length?'My offers are below. Grey offers need a few more shop sales.':'There is nothing I can buy in your bag yet.'),[
   ...offers.map(offer=>['Sell '+offer.name+' · +¥'+offer.price,()=>{
    if(!canSellAtSakura(getContext(),getMinutes())){selling();return;}
    const result=sellToSakura(state,offer.name,getMinutes());if(!result.ok){show('Thuan · Shop counter',result.message,[['Back to offers',selling],['Keep looking around',close]]);return;}
    if(offer.model)recordFormSale(state,getMinutes());
    save();note('Sold '+offer.name+' to Thuan for ¥'+offer.price+'.');
    show('Thuan · Thank you',offer.name+' sold for ¥'+offer.price+'.\n\nShop funds remaining: ¥'+state.sakura.cash+'.'+(offer.model?' You can make another now that there is room in your bag.':''),[['Sell another item',selling],['See you soon, Thuan',close]]);
   },!!saleProblem(state,offer.name)]),['Keep my items',close],
  ]);
 }

 return {printer,stepwise,selling,dispose(){if(embedded){embedded.src='about:blank';embedded.remove?.();embedded=null;}modal.classList.remove('workshop-tool');}};
}
