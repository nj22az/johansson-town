import {townCalendarAt} from '../town-clock.js';
import {rotaWeek} from '../people/ferry-crew.js';

/**
 * Kissa Higa (喫茶ひが): Grandmother Higa's morning coffee shop in the shut Higa Liquor on Main Street. The owner,
 * 30 October 2026: "Since the liquor store is closed maybe it can be replaced by one of the buildings maybe the cafe",
 * Grandmother Higa to keep it in the mornings; then "work accordingly to your own recommendations"
 * (briefs/higa-kissaten/progress.md: the name, Monday to Friday, her garden round before opening, Yui's breakfast at the
 * counter, her husband's records).
 *
 * The liquor shop stays closed: the drink is Sakura's (commerce/higa-liquor.js, the ruling of 22 October 2026). The
 * room, its counter and the family kusu are hers, and the mornings before the bath opens at ten were free. The island
 * had nowhere to sit over a coffee: Sato Ramen pours urn coffee with lunch (sato-ramen-layout.js).
 *
 * Positions are world positions, worked out in the shop-house's frame (higa-liquor-dressing.js HIGA_FRAME: world x =
 * 9.55 - local z, world z = 8.4 + local x), so the people modules do not load the building; tests/kissa-higa.test.mjs
 * holds the two the same.
 */
const minute=m=>((m%1440)+1440)%1440;
const local=(x,z)=>Object.freeze([+(9.55-z).toFixed(3),+(8.4+x).toFixed(3)]);

export const KISSA=Object.freeze({
 id:'kissa-higa',name:'Kissa Higa',jp:'喫茶ひが',keeper:'Grandmother Higa',
 /** Monday to Friday (Date weekdays). On Saturdays she opens Johansson Mart at 08:45 (kitahama-shop.js SHOP_DUTY); Sunday is her morning off. */
 days:Object.freeze([1,2,3,4,5]),
 /**
  * Her morning, in minutes: at the front at 06:45, the shutter up at 06:50 over nine seconds and the doors open, open 07:00 to 09:30,
  * washing up until 09:40, then out on the pavement to pull the shutter down (09:44, over nine seconds), and up Kitano Road to the
  * bath at 09:50. She is out before it comes down, so nobody is shut in.
  */
 arrive:405,shutterUp:410,open:420,close:570,out:580,shutterDown:584,leave:590,
 /** The shutter takes nine seconds up or down, by hand (the same steel as Nakamura's). */
 roll:.15,
 why:'The shop stood shut with its counter and its jar inside, and the mornings before the bath opens at ten were Grandmother Higa’s own. Nobody on the island could sit over a coffee: Sato Ramen pours urn coffee with lunch. So the shutter goes up at seven on weekdays, and the counter has her behind it again.',
 period:'Morning service (モーニング): from the 1950s a kissaten gave toast and a boiled egg free with the morning coffee, for people on their way to work.',
});

const weekday=minutes=>townCalendarAt(minutes).weekday;
/** True on the kissaten's days (Monday to Friday). */
export const kissaDay=minutes=>KISSA.days.includes(weekday(minutes));
/** Open for customers: 07:00 to 09:30 on its days. */
export function kissaOpen(minutes){const m=minute(minutes);return kissaDay(minutes)&&m>=KISSA.open&&m<KISSA.close;}
/** Grandmother Higa's time at the kissaten, at its front or behind its counter: 06:45 to 09:50 on its days. */
export function kissaOnDuty(minutes){const m=minute(minutes);return kissaDay(minutes)&&m>=KISSA.arrive&&m<KISSA.leave;}
/**
 * How far down the shutter is, 1 down and 0 up: up from 06:50 over nine seconds, down from 09:44 over nine seconds, down all day
 * on Saturdays and Sundays (Nakamura's rule, nakamura-dressing.js nakamuraShutterDown).
 */
export function kissaShutterDown(minutes){
 if(!kissaDay(minutes))return 1;
 const m=minute(minutes),{shutterUp,shutterDown,roll}=KISSA;
 if(m>=shutterUp&&m<shutterUp+roll)return 1-(m-shutterUp)/roll;
 if(m>=shutterUp+roll&&m<shutterDown)return 0;
 if(m>=shutterDown&&m<shutterDown+roll)return (m-shutterDown)/roll;
 return 1;
}
/** True while the shutter is up far enough to walk under and the doors are open (Nakamura's rule: down past 40%, shut). */
export const kissaPassable=minutes=>kissaShutterDown(minutes)<=.4;

/** The shop floor and threshold in world coordinates; a whole body must clear the shutter before it closes. */
export function inKissaHiga({x,y=0,z},radius=.32){
 return y<2.3&&x>9.55-3.7-radius&&x<9.55+1.9+radius&&z>8.4-2.07-radius&&z<8.4+2.07+radius;
}
/**
 * She never shuts somebody in. If a customer or late walker is still inside, she waits at the front; when the last
 * body clears the threshold she takes the usual nine seconds to lower it, then walks to the bath. Orders still end
 * at 09:30. Seeking backwards or to another day resets the delay (the audit and a restored clock can do either).
 */
export function createKissaClosing(){
 let waiting=false,released=null,last=null;
 return {
  get waiting(){return waiting;},
  update(minutes,occupied=false){
   if(last!==null&&(minutes<last||Math.floor(minutes/1440)!==Math.floor(last/1440))){waiting=false;released=null;}
   last=minutes;
   const scheduled=kissaShutterDown(minutes);
   if(scheduled===0&&minute(minutes)<KISSA.shutterDown){waiting=false;released=null;return 0;}
   if(occupied){waiting=true;released=null;return 0;}
   if(waiting&&released===null)released=minutes;
   if(released!==null){
    const down=Math.min(1,Math.max(0,(minutes-released)/KISSA.roll));
    if(down===1){waiting=false;released=null;}
    return down;
   }
   return scheduled;
  },
 };
}

/**
 * The paper on the shutter, in her brush hand, read when it is down: the name, the hours, and where the drink is now (the
 * line the old closing notice carried, so the liquor shop's regulars still know). Japanese on the paper, English for the
 * player.
 */
export const KISSA_NOTICE=Object.freeze({jp:'喫茶ひが',jpLines:Object.freeze(['モーニング 朝7時〜9時半','月曜〜金曜','お酒は さくら商店へ']),
 en:'Kissa Higa. Morning coffee and the morning set, 7:00 to 9:30, Monday to Friday. For beer, awamori and sake, please go to Sakura Shōten, down Main Street towards the harbour. The Higa family',
 who:'Grandmother Higa',
 why:'The shutter is down outside the kissaten’s hours. The paper says when it opens, and keeps the old notice’s last line: the drink is Sakura’s.',
 period:'A hand-written paper on the shutter is how a small shop gave its hours and pointed its customers on.'});

/** What she serves: the coffee at one price, the morning set at the coffee's price (morning service). No alcohol: it is Sakura's. */
export const KISSA_MENU=Object.freeze([
 Object.freeze({id:'morning-set',label:'Order the morning set',name:'Morning set',jp:'モーニング',cost:300,item:'Morning set',
  text:'A blend coffee from the siphon, a slice of milk bread toasted thick and buttered, and a boiled egg in a cup with salt beside it: all for the coffee’s price, as morning service is. Grandmother Higa cuts the toast in two without asking.',
  why:'The kissaten’s morning: the toast and the egg come with the coffee, for anyone on the way to work.'}),
 Object.freeze({id:'blend',label:'Order a blend coffee',name:'Blend coffee',jp:'ブレンド',cost:300,item:'Blend coffee',
  text:'Brewed a cup at a time in the siphon: the water climbs into the top bowl over the spirit lamp, she stirs it, and it falls back dark. In a white cup on a saucer, sugar and milk if you want them.',
  why:'A cup made for you, slower and dearer than Sato Ramen’s ¥200 urn coffee at lunch.'}),
 Object.freeze({id:'iced',label:'Order an iced coffee',name:'Iced coffee',jp:'アイスコーヒー',cost:300,item:'Iced coffee',
  text:'Brewed double strength in the siphon and poured straight over a glass packed with ice from the fridge behind the counter, with a jug of gum syrup and one of milk. On an Okinawan morning it is gone before the ice is.',
  why:'Most of the year on the island is too hot for a hot cup.'}),
]);

/**
 * Where what she serves comes from (merchandising.js ACCOUNTS.sakura 'kissa-higa'). Sakura is shut before nine, so the
 * next morning's loaf and milk are taken at its till at five the afternoon before, on her account, as she crosses the
 * park from the bandai (Umi-no-yu stands opposite Sakura); on Sundays, Monday's. Sakura sells no beans, eggs or butter, so
 * Sakura Trading buys them in with its Monday order off the ferry.
 */
export const KISSA_SUPPLY=Object.freeze([
 Object.freeze({what:'Milk bread, a loaf a morning, cut thick',from:'Sakura’s till the afternoon before, on the account (bread)',why:'Sakura’s own milk bread, for the morning set’s toast.'}),
 Object.freeze({what:'Milk for the coffee',from:'Sakura’s till the afternoon before, on the account (milk)',why:'The same Asamori milk the bath’s fridge sells; it keeps overnight in her fridge at home.'}),
 Object.freeze({what:'Coffee beans, roasted in Naha, a kilo a week',from:'Sakura Trading, with Monday’s order off the ferry',why:'Nobody roasts on the island; she grinds them by hand, a cup at a time.'}),
 Object.freeze({what:'Eggs, a tray a week, and a block of butter',from:'Sakura Trading, with Monday’s order',why:'The morning set’s boiled egg, and the butter for the toast.'}),
 Object.freeze({what:'Ice',from:'the fridge-freezer behind the counter, its own trays',why:'For the iced coffee; nobody carries ice up from the quay at half past six.'}),
]);

/**
 * The record player and the records: her late husband's 45s, Okinawan min'yō and enka, the songs he played on the bus
 * route's last run home. She plays one when the shop is quiet, and never the same one twice in a morning.
 */
export const KISSA_RECORDS=Object.freeze({
 what:'A teak-cased record player and a box of 45s: Okinawan min’yō and enka',
 whose:'Her late husband’s. He drove the island bus for thirty years and did the shop’s rounds on the black bicycle (higa-liquor.js HIGA_KUSU).',
 text:'A teak-cased record player on its own cabinet, and beside it a box of 45s in paper sleeves, the corners soft with handling: Okinawan min’yō and old enka, her husband’s. One of them has his writing on the sleeve. Grandmother Higa puts one on when the shop is quiet.',
 hook:'Somebody asks for the one with the writing on the sleeve.'});

/**
 * The seats, in the world. The three stools stand along the customers' ledge in front of the counter (0.74 m on the
 * 8 cm shop floor, the izakaya's counter height, with seats at 0.46 m like its stools; the cartoon bodies still leave their
 * shoes 0.21–0.25 m above the floor on chair-height seats across town, pending the owner’s decision); the ledge stops short of the register, where customers pay at
 * the counter's open end. The two bentwood chairs (the Meshy model, its seat 0.42 m up) stand at the table by the
 * police-station wall: the near one the player's, the far one Ms Uezu's on her weeks off. `at` is where the sitter sits, `stand`
 * where they stand up to, `height` the seat above the shop floor, `yaw` the way they face (stand-points.js yawFacing),
 * `front` how far ahead of the mark the seat's front edge is (seat-slots.js).
 */
export const KISSA_SEATS=Object.freeze({
 'stool-0':Object.freeze({at:local(-1.66,.44),stand:local(-1.66,.98),height:.46,yaw:-Math.PI/2,front:.17}),
 'stool-1':Object.freeze({at:local(-1.12,.44),stand:local(-1.12,.98),height:.46,yaw:-Math.PI/2,front:.17}),
 'stool-2':Object.freeze({at:local(-.58,.44),stand:local(-.58,.98),height:.46,yaw:-Math.PI/2,front:.17}),
 'chair-0':Object.freeze({at:local(1.3,1.5),stand:local(.66,1.5),height:.42,yaw:Math.PI/2,front:.25}),
 'chair-1':Object.freeze({at:local(1.3,2.7),stand:local(.66,2.7),height:.42,yaw:-Math.PI/2,front:.25}),
});
/**
 * Where Grandmother Higa stands behind the counter, facing the ledge (round the counter's open end); and on the pavement
 * before the door, facing the shutter, while she lifts it and pulls it down.
 */
export const KISSA_KEEPER=Object.freeze({at:local(-.9,-1.15),yaw:Math.PI/2,front:local(.3,4.12),frontYaw:-Math.PI/2});

/**
 * The regulars, from their own days (cast.js; the morning sweep of 30 October 2026 in briefs/higa-kissaten/progress.md):
 * whoever is free and near between seven and half past nine. Everyone else is at work by seven.
 */
export const KISSA_REGULARS=Object.freeze([
 Object.freeze({name:'Miss Higa',seat:'stool-1',from:435,to:465,order:'morning-set',
  why:'Her grandmother is at the counter from seven now, so Yui’s breakfast is too: the morning set on the stool her grandmother keeps for her, before the walk to school at eight.'}),
 Object.freeze({name:'Ms Ganaha',seat:'stool-0',from:452,to:480,order:'blend',
  why:'A blend at the end of the ledge before she opens up the coin laundry across Main Street at eight.'}),
 Object.freeze({name:'Tetsuo',seat:'stool-2',from:460,to:505,order:'morning-set',days:Object.freeze([1,3,5]),
  why:'Three mornings a week he takes his breakfast here instead of at home: the bath’s boiler is up the road, and the stool next to Yui’s is the one Grandmother Higa sets his cup at.'}),
 Object.freeze({name:'Officer Mori',seat:'stool-2',from:510,to:540,order:'morning-set',
  why:'Next door from the station after the night patrol: the morning set on the stool nearest the station, Tetsuo’s until 08:25, with five minutes to clear it before Mori, then upstairs to sleep at nine.'}),
 Object.freeze({name:'Ms Uezu',seat:'chair-1',from:480,to:540,order:'iced',offWatch:true,
  why:'On her weeks off watch (the ferry’s rota): an iced coffee at the table with the town paper, the one morning hour she is not on the deck.'}),
]);

/** The regular's visit at this minute, or null: their seat, what they ordered and why. */
export function kissaVisitAt(name,minutes){
 const r=KISSA_REGULARS.find(r=>r.name===name);
 if(!r||!kissaOpen(minutes))return null;
 const m=minute(minutes);
 if(m<r.from||m>=r.to)return null;
 if(r.days&&!r.days.includes(weekday(minutes)))return null;
 if(r.offWatch&&rotaWeek(minutes)!==1)return null;
 return {...KISSA_SEATS[r.seat],id:r.seat,order:r.order,why:r.why};
}
/** Who is at the kissaten at this minute: the keeper on duty and the regulars on their seats. */
export function kissaPeopleAt(minutes){
 const out=[];
 if(kissaOnDuty(minutes))out.push(KISSA.keeper);
 for(const r of KISSA_REGULARS)if(kissaVisitAt(r.name,minutes))out.push(r.name);
 return out;
}
