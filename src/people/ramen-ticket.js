import {SATO_MENU,satoRamenOpen} from '../world/sato-ramen-layout.js';

/**
 * Sato Ramen's ticket machine (shokkenki). You press a button, feed it yen, and it drops a
 * ticket; sit down, order that dish, and Mrs Sato takes the ticket instead of your money
 * (people/ramen-player-service.js `ticket`). One ticket at a time, kept until it is used.
 */
export const hasRamenTicket=(state,item)=>!!item&&state.ramenTicket?.id===item.id;
export function useRamenTicket(state,item){if(!hasRamenTicket(state,item))return false;delete state.ramenTicket;return true;}

export function createRamenTicketMachine({state,show,close,spend,save,receipt,getMinutes}){
 function machine(){
  if(!satoRamenOpen(getMinutes())){receipt('Ticket machine','The machine’s buttons are dark and its coin slot is taped over. Sato Ramen serves lunch, 11:00 to 14:00.');return;}
  const held=state.ramenTicket&&SATO_MENU.find(item=>item.id===state.ramenTicket.id);
  if(held){receipt('Ticket machine','You already have a ticket for '+held.name.toLowerCase()+'. Take a seat and order it: Mrs Sato will take the ticket.');return;}
  show('Ticket machine','A cream-coloured machine with a button for every dish. Press one, put the yen in, and a ticket drops into the tray.',[
   ...SATO_MENU.map(item=>[item.name+' · ¥'+item.cost,()=>{
    if(!spend(item.cost))return;state.ramenTicket={id:item.id,name:item.name,bought:getMinutes()};save();
    receipt('Your ticket','The machine thinks about it, then clunks. A small pink ticket: '+item.name+', ¥'+item.cost+'. Sit down and order it, and hand it over.');}]),
   ['Back',close]]);
 }
 return {machine};
}
