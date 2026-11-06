/**
 * Giving Thuan something from your bag, and how she takes it.
 *
 * Anything you carry can be given except the rubbish you tidy up around town (that goes
 * back through her till) and the waterlogged book page (it is Yoshiko's to dry). She is
 * delighted the first time in a day; a second present the same day makes her shy.
 */
import {TOWN_FINDS} from '../commerce/sakura-economy.js';
import {pierFishOfItem} from '../world/okinawa/fish.js';
import {GROCERY_ITEMS} from '../commerce/catalogue.js';
import {WORKSHOP_MODELS} from '../workshop/catalogue.js';

const RUBBISH=new Set(TOWN_FINDS.map(item=>item.name));

/** The things in the bag she could be given, each once, in the order they were picked up. */
export function giftableItems(inventory=[]){
 return [...new Set(inventory.filter(name=>typeof name==='string'&&!RUBBISH.has(name)&&!/^Waterlogged page/.test(name)))];
}

/** Takes one of `item` out of the bag. False when it is not there. */
export function takeGift(inventory,item){
 const index=inventory.indexOf(item);
 if(index<0)return false;
 inventory.splice(index,1);
 return true;
}

/**
 * Her reply to a present.
 * @param {string} item
 * @param {{giftsToday?:number}} [context] presents already given today, before this one
 * @returns {{text:string,mood:'happy'|'shy'}}
 */
export function giftReaction(item,{giftsToday=0}={}){
 if(giftsToday>=1)return {mood:'shy',text:"Again? Already…\nAnother one? You are spoiling me. The assistant manager is going to think I have a favourite customer."};
 if(WORKSHOP_MODELS.some(model=>model.name===item))
  return {mood:'happy',text:"Wow, that's amazing!\nYou printed this? It is going on the shelf by the till, where everyone can see it. The assistant manager will be jealous."};
 if(item==='Zenzai')
  return {mood:'happy',text:"Zenzai! Before it melts!\nQuick, before it melts — no, you have a spoon too. We share. That is the rule with zenzai."};
 if(item==='Sata andagi')
  return {mood:'happy',text:"Sata Andagi!\nStill warm! My grandmother said they smile when they are done properly. Look — this one is smiling."};
 if(item==='Awamori miniature')
  return {mood:'shy',text:"Awamori? Already…\nAwamori? Are you trying to get the shopkeeper drunk? I will keep it for after closing. Maybe we open it together."};
 if(item==='Tuna head')
  return {mood:'shy',text:"Eh…Tuna head?\nA tuna head. For me. Wrapped in the Ryūkyū Shimpō. …Kōji gave it to you, didn’t he. He gives it to everybody. Fine — soup tonight. You are washing the pot."};
 if(item==='Mozuku')
  return {mood:'happy',text:"Mozuku!\nMozuku from the auction! With vinegar, cold, after work. You are learning how to live here."};
 // The pier's catch (fish.js): a taman is a feast; a mijun is a joke she is happy to be in on.
 const fish=pierFishOfItem(item);
 if(fish?.id==='mijun')
  return {mood:'happy',text:"A mijun! Hehe.\nOne mijun. That is bait, you know. …Fine, it is going in the fryer with the croquettes, and I will eat it in one bite."};
 if(fish)
  return {mood:'happy',text:`${item}! Splendid!\nA whole ${fish.name}! Supper is solved. I will tell Thao I caught it myself. She will not believe me.`};
 if(item==='Coffee milk')
  return {mood:'happy',text:"Coffee milk!\nCoffee milk! That is the best part of the bath. How did you know?"};
 if(item==='Ice')
  return {mood:'happy',text:"Ice? Hehe.\nIce? For the hottest shop assistant in the harbour, I suppose. It is going straight in the cooler."};
 if(GROCERY_ITEMS.some(spec=>spec.name===item))
  return {mood:'happy',text:"From my own shelf? Thank you!\nFrom my own shelves? Then I know it is good. I will have it on my break and think of you."};
 return {mood:'happy',text:"For me? Thank you!\nFor me? Thank you! Nobody brings the shopkeeper presents. I will keep it behind the counter."};
}
