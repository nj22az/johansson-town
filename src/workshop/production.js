import {sellToSakura} from '../commerce/sakura-economy.js';
import {recordFormSale} from '../progression/soft-quests.js';
import {WORKSHOP_MODELS,workshopModel} from './catalogue.js';

export const BAG_LIMIT=100;
export function restoreWorkshop(saved,inventory){
 const names=new Set(WORKSHOP_MODELS.map(model=>model.name)),seen=new Set();
 // Only printed goods are unique: ordinary shop purchases and fish still stack.
 for(let index=0;index<inventory.length;){const item=inventory[index];if(names.has(item)&&seen.has(item)){inventory.splice(index,1);continue;}seen.add(item);index++;}
 const selected=workshopModel(saved?.selected)?.id||WORKSHOP_MODELS[0].id;
 const recipe=workshopModel(saved?.job?.id),remaining=saved?.job?.remaining;
 const job=recipe&&Number.isFinite(remaining)&&remaining>=0&&!inventory.includes(recipe.name)?{id:recipe.id,remaining:Math.min(recipe.seconds,remaining)}:null;
 return {selected,job};
}
export function printProblem(state,id){
 const model=workshopModel(id);
 if(!model)return 'Choose a workshop model.';
 if(state.inventory.includes(model.name))return 'You already have this model. Carry only one of each; sell it to Thuan before making another.';
 if(state.workshop.job)return 'Collect the current print before starting another.';
 if(state.inventory.length>=BAG_LIMIT)return 'Your bag is full. Make room before printing.';
 if(state.yen<model.material)return 'You need ¥'+model.material+' for materials.';
 return null;
}
export function startPrint(state,id){
 const problem=printProblem(state,id);if(problem)return {ok:false,message:problem};
 const model=workshopModel(id);state.yen-=model.material;
 state.workshop.selected=id;state.workshop.job={id,remaining:model.seconds};
 return {ok:true,model};
}
export function advancePrint(state,seconds){
 const job=state.workshop.job;if(!job||job.remaining===0||!Number.isFinite(seconds)||seconds<=0)return false;
 job.remaining=Math.max(0,job.remaining-seconds);return job.remaining===0;
}
export function collectPrint(state){
 const job=state.workshop.job,model=workshopModel(job?.id);
 if(!model||job.remaining>0)return {ok:false,message:'The print is not ready yet.'};
 if(state.inventory.includes(model.name))return {ok:false,message:'You already carry one of this model.'};
 if(state.inventory.length>=BAG_LIMIT)return {ok:false,message:'Your bag is full. Your model will stay on the machine until there is room.'};
 state.inventory.push(model.name);state.workshop.job=null;return {ok:true,model};
}
export function sellPrint(state,id){
 const model=workshopModel(id);if(!model)return {ok:false,message:'Choose a workshop model.'};
 const result=sellToSakura(state,model.name);if(result.ok)recordFormSale(state,state.minutes||0);return result;
}
export function canSellAtSakura(context,minutes){
 const time=((minutes%1440)+1440)%1440;
 return context.inside==='market'&&time>=540&&time<1200&&context.thuanAvailable===true;
}
