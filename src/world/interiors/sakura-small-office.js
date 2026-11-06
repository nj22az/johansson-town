import {SAKURA_HOURS_TEXT,SAKURA_STAFF} from '../../commerce/sakura-rota.js';

/**
 * Sakura's small office beside the till: the room behind the counter's back aisle, through the panelled door at
 * x 5.14..6.28 on z -1.17 (sakura-life.js OFFICE_DOOR), inside walls x 4.66..6.82, z -3.95..-1.21 (sakura-shell.js),
 * 2.16 × 2.74 m, about 6 m² (3½ jō) under the shop's 2.98 m ceiling and its own tube (sakura-shell.js buildTubes).
 *
 * The owner, 20 October 2026, with a three.js "Sakura Shōten - 3D Anime Office" page: "This could probably fix the tiny
 * office next to the till in Sakura." Its ideas are rebuilt here in the town's own way (plain geometry, the cel pass,
 * one canvas for everything printed) and in its canon: Thuan owns the shop and keeps the counter Monday to Friday,
 * Nhung on Sunday, 9:00–20:30, shut on Saturday (commerce/sakura-rota.js); the upstairs is the main office (sakura-office-room.js),
 * and this room is the one at hand during a shift, a step from the till, where the day's sales book is written up.
 *
 * Everything in it is data first: what it is, whose it is, why it is there and why it stands where it does, its period
 * and the Japanese label the real thing carried (`jp`); every prompt and line the player reads is English.
 *
 * Sizes: New Yokosuka's home and konbini (docs/research/new-yokosuka-lessons.md) give the chair's 0.42 m seat, the
 * 0.26 m wall clock, one wall switch per room by its door and, for scale, its 0.80 × 0.40 m living-room TV and
 * 0.83 × 1.88 m kitchen fridge, which a 6 m² back office cannot take: here they are the small kinds a shop office had,
 * a 14-inch portable on a one-door 75-litre fridge. The desk is the upstairs office's steel desk shortened to the
 * 1000 × 700 mm single-pedestal size (片袖机) so the door's swing stays clear.
 *
 * Editions (edition.js): on Linux (`machinery`) the lamp switches, the fridge door opens, the TV changes channel and
 * the chair swivels; on the web each is a display piece whose prompt reads what it is. The sales ledger opens the same
 * way on both (activities.js shopLedger): the live shop's books on Linux, the web's fixed October 1997 paperwork
 * (commerce/paperwork.js) there.
 */
export const SAKURA_SMALL_OFFICE=Object.freeze({
 room:Object.freeze({minX:4.66,maxX:6.82,minZ:-3.95,maxZ:-1.21,ceiling:2.98,jp:'事務所',
  door:Object.freeze({hingeX:5.16,z:-1.17,width:1.1,from:5.14,to:6.28}),
  why:'The office a step from the till: Thuan writes up the sales book here between customers, keeps her lunch and a cold drink, and hears the door chime through the open door. The upstairs office (sakura-office-room.js) has the safe, the files and the kitchenette; this one is for the shift.'}),
 /** The door's swing (sakura-life.js OFFICE_DOOR): nothing that stands on the floor may be inside it. */
 swing:Object.freeze({x:5.16,z:-1.17,radius:1.12}),
});

const item=o=>Object.freeze({...o,at:Object.freeze(o.at),size:Object.freeze(o.size)});

/**
 * The room's things. `at` is the base centre in the shop's frame (y is the surface it stands on), `size` is
 * [x, y, z] as it stands, `watts` what it draws from the office's one double socket. A thing on a `wall` has `at` on
 * that wall's face, at the height of its middle.
 */
export const SMALL_OFFICE_ITEMS=Object.freeze([
 item({id:'desk',name:'Office desk',jp:'事務机',owner:'Thuan',at:[6.44,0,-3.42],size:[.7,.7,1.0],
  why:'Thuan’s working desk against the east wall, its drawer pedestal at the back so her knees and the chair have the front half: the sales book, the delivery notes and the till rolls. Back in the corner, out of the door’s swing, facing the calendar and the rota.',
  period:'A grey steel single-pedestal office desk with a green linoleum top, 1000 × 700 mm, the desk of every Japanese small office from the 1970s to the 1990s.'}),
 item({id:'ledger',name:'Sales ledger',jp:'売上帳',owner:'Thuan',at:[6.36,.7,-3.24],size:[.3,.02,.42],
  why:'The green cloth-bound sales book, open at the day with a pencil in the gutter: each evening Thuan copies the till’s Z report into it and the drawer is counted against it. One a quarter, from Sakura Trading’s own stationery since Front-Row’s trade came to Sakura (paperwork.js STATIONERY).',
  period:'A 1990s A4 account book with a green cloth cover and red-ruled columns; small shops kept their books by hand next to the register’s roll.'}),
 item({id:'lamp',name:'Desk lamp',jp:'電気スタンド',owner:'Thuan',at:[6.66,.7,-2.98],size:[.14,.48,.14],watts:40,
  why:'A gooseneck lamp clamped at the front of the desk and bent over the book: the tube overhead throws her own shadow on the page.',
  period:'A green-enamelled flexible-arm desk lamp with a 40 W pear bulb, the household kind before desk fluorescents took over.'}),
 item({id:'tray',name:'Letter tray',jp:'書類トレー',owner:'Thuan',at:[6.6,.7,-3.76],size:[.25,.2,.33],
  why:'Three tiers at the back of the desk: the depot’s delivery notes to check, the invoices to pay at the month’s end, and the papers done.',
  period:'A stacking plastic letter tray in red, yellow and blue, a stationery-shop staple of the 1990s.'}),
 item({id:'mug',name:'Mug',owner:'Thuan',at:[6.15,.7,-2.98],size:[.08,.1,.08],
  why:'Thuan’s tea, brought down from the kitchenette upstairs; at the desk’s front edge, out of the lamp’s pool and away from the book.',
  period:'A pink enamel mug.'}),
 item({id:'plush',name:'Plush Jaga-bō',owner:'Thuan',at:[6.6,.9,-3.76],size:[.12,.14,.12],
  why:'The KOGANE crisps rep left him on the letter tray when the new line went in; Jaga-bō by the window is his big brother.',
  period:'A promotional plush, the sort salesmen left with every shop that took a display.'}),
 item({id:'cactus',name:'Cactus',owner:'Thuan',at:[6.24,.7,-3.82],size:[.08,.13,.08],
  why:'Mrs Kinjō’s, from the last of her stock the week she shut the florist; the one plant that lives in a room without a window.',
  period:'A small cactus in a pink glazed pot.'}),
 item({id:'remote',name:'TV remote',owner:'Thuan',at:[6.2,.7,-3.56],size:[.05,.02,.16],
  why:'For the little TV across the room, kept on the desk so it is not lost behind the fridge.',
  period:'A grey infrared remote with rubber buttons.'}),
 item({id:'chair',name:'Swivel chair',jp:'事務椅子',owner:'Thuan',at:[5.72,0,-3.24],size:[.5,.86,.5],seat:.42,
  why:'At the desk, turned to it; it swivels to the TV and to the door when the chime goes. The 0.42 m seat is New Yokosuka’s chair height.',
  period:'A light-blue cloth swivel chair on a five-star base with castors, the 1990s office chair.'}),
 item({id:'rug',name:'Round rug',owner:'Thuan',at:[5.66,0,-3.14],size:[1.04,.006,1.04],
  why:'Under the chair’s castors, so they do not scour the terrazzo; and colour in a room without a window.',
  period:'A round braided rag rug in rings of colour.'}),
 item({id:'fridge',name:'Mini fridge',jp:'冷蔵庫',owner:'Thuan',at:[4.93,0,-3.67],size:[.48,.85,.5],watts:75,
  why:'In the back-left corner, its door opening against the west wall: Thuan’s lunch box from home (over on the 08:30 boat) and a cold drink or two, bought at her own till like anyone else’s. Never shop stock: the shop’s drinks are in the cold cabinets.',
  period:'A white one-door 75-litre fridge with a freezer box at the top, the student-flat and office size of the 1990s.'}),
 item({id:'tv',name:'Small TV',jp:'14型カラーテレビ',owner:'Thuan',at:[4.93,.85,-3.67],size:[.34,.31,.32],yaw:.5,watts:55,
  why:'On the fridge, turned towards the desk and the door: the community cable channel shows the ferry’s arrivals, which Thuan watches for the boat home and the deliveries; the weather; and on Sundays Riku’s games while his mother keeps the shop.',
  period:'A navy 14-inch portable colour CRT with push buttons, on cable: the island’s community channel ran the port notices and the forecast between programmes.'}),
 item({id:'console',name:'Games console',owner:'Riku',at:[4.93,1.16,-3.69],size:[.24,.06,.18],yaw:.5,watts:10,
  why:'Riku’s, left here for Sundays, when Nhung keeps the shop and he does his homework at the desk first (the note on the board says so).',
  period:'A grey 32-bit home console of 1997 with a pad, no brand on it.'}),
 item({id:'clock',wall:'back',name:'Cat clock',jp:'掛け時計',owner:'Thuan',at:[5.62,2.0,-3.95],size:[.32,.34,.04],
  why:'On the back wall where she sees it from the desk and from the door: the 22:00 boat home does not wait. It keeps the town’s time.',
  period:'A battery quartz wall clock with a 0.26 m dial (New Yokosuka’s wall clocks) and a cat’s ears.'}),
 item({id:'fairy',wall:'back',name:'Fairy lights',jp:'電飾',owner:'Thuan',at:[5.75,2.4,-3.95],size:[1.95,.2,.03],watts:20,
  why:'A string of tree lights along the back wall, up since Christmas and never taken down: the room has no window.',
  period:'A 1990s string of small coloured bulbs on two circuits with a flasher box, the two halves taking turns.'}),
 item({id:'corkboard',wall:'west',name:'Cork board',jp:'コルクボード',owner:'Thuan',at:[4.66,1.5,-2.62],size:[.03,.6,.9],
  why:'On the west wall facing the desk: the reminders that are not on the calendar, and the photographs.',
  period:'A pine-framed cork board with drawing pins and sticky notes.'}),
 item({id:'calendar',wall:'east',name:'Calendar',jp:'さくら商事 平成9年10月',owner:'Thuan',at:[6.82,1.62,-3.62],size:[.01,.46,.32],
  why:'Sakura Trading’s own calendar, the one the depot gives every account at New Year (Chin has one too), above the desk: the drink round’s Tuesdays and Fridays and the month’s end.',
  period:'A one-month wall calendar of October 1997, Heisei 9, the supplier’s name in red across the top.'}),
 item({id:'rota',wall:'east',name:'Staff rota',jp:'勤務表',owner:'Thuan',at:[6.82,1.56,-3.08],size:[.01,.4,.3],
  why:'Who keeps the counter which day, beside the calendar: Thuan on weekdays, Saturday shut, Nhung on Sunday, the shop’s own hours.',
  period:'A typed sheet in a clear sleeve, pinned at its corners.'}),
 item({id:'switch',wall:'front',name:'Light switch',jp:'照明',owner:'Thuan',at:[6.52,1.25,-1.21],size:[.07,.12,.01],
  why:'One switch by the door, on the latch side, for the room’s tube, as every room has (New Yokosuka’s homes). Its little lamp glows green in the dark so it can be found.',
  period:'A wide-rocker switch plate with a pilot lamp (the “firefly switch”), standard in Japanese buildings of the 1980s and 1990s.'}),
]);
export const SMALL_OFFICE_ITEM=Object.freeze(Object.fromEntries(SMALL_OFFICE_ITEMS.map(i=>[i.id,i])));

/** What is in the fridge: Thuan’s, bought at her own till (the shop’s product ids). */
export const SMALL_OFFICE_FRIDGE=Object.freeze([
 Object.freeze({id:'soda',name:'AOZORA ramune',count:2,why:'Her afternoon drink; the marble rattles when the door shuts.'}),
 Object.freeze({id:'cola',name:'SHIOSAI cola',count:1,why:'The island’s own cola, for the late boat.'}),
 Object.freeze({id:'bento',name:'Lunch box',count:1,why:'Brought over on the 08:30 boat from Kitano-jima, wrapped in a cloth.'}),
]);

/**
 * The cork board's notes, in Thuan’s and Nhung’s hands, each from the town’s own data: `source` says where its fact
 * lives (tests/sakura-small-office.test.mjs checks them).
 */
export const SMALL_OFFICE_NOTES=Object.freeze([
 Object.freeze({id:'boat',text:'8:30 boat: Coral Bay crate on the cart (mandarin juice, water)',by:'Thuan',colour:'#ffe28a',
  source:'merchandising.js ACCOUNTS.sakura["coral-bay-bar"]: lines orange and water, on the morning car ferry; commuter-schedule.js HARBOUR_LINE 08:30'}),
 Object.freeze({id:'round',text:'Tue · Fri 10:30: Kōji’s round at the depot. Count the crates out, empties back!',by:'Thuan',colour:'#ff9dc6',
  source:'trade-round.js TRADE_ROUND: Kōji loads at the Quay Warehouse depot at 10:30 on Tuesdays and Fridays; the empties back to the crate yard (Higa Liquor’s round until it closed, 22 October 2026)'}),
 Object.freeze({id:'eisa',text:'Eisa poster: back to the youth association (Kitahama)',by:'Thuan',colour:'#a6e57c',
  source:'sakura-dressing.js: the Eisa poster on the back wall, August’s Obon; lots.js: the youth association’s store on the eisa ground'}),
 Object.freeze({id:'riku',text:'Riku: homework FIRST, then games!',by:'Nhung',colour:'#9fd6f0',
  source:'roster.js: Riku, 9, Nhung’s son; the console is his for the Sundays Nhung keeps the shop'}),
]);

/** The photographs pinned beside the notes. */
export const SMALL_OFFICE_PHOTOS=Object.freeze([
 Object.freeze({id:'sisters',caption:'Thao & me · Minato',why:'Thuan and her sister at the harbour.'}),
 Object.freeze({id:'jagabo',caption:'Jaga-bō!!',why:'The day the KOGANE display went in.'}),
 Object.freeze({id:'plant',caption:'Assistant manager, day 1',why:'The rubber plant by the door, the day it was promoted.'}),
]);

/** October 1997 (1 October was a Wednesday): what is marked on the calendar, and why. */
export const SMALL_OFFICE_CALENDAR=Object.freeze({year:1997,month:10,era:'平成9年',firstWeekday:3,days:31,
 marks:Object.freeze([
  ...[3,7,10,14,17,21,24,28,31].map(day=>Object.freeze({day,text:'round',why:'Kōji’s drink round from the depot, Tuesdays and Fridays (trade-round.js)'})),
  ...[4,11,18,25].map(day=>Object.freeze({day,text:'closed',why:'Saturday, the shop’s closing day (sakura-rota.js)'})),
  Object.freeze({day:31,text:'pay',why:'The month’s invoices are paid at the end of the month (paperwork.js deliveryNote)'}),
 ])});

/** The rota on the wall, from the shop’s own rota: the weekdays Thuan’s, Saturday shut, Sunday Nhung’s, the shop’s hours. */
export const SMALL_OFFICE_ROTA=Object.freeze(['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day,i)=>
 Object.freeze(i===5?{day,who:'closed',hours:'—'}:{day,who:SAKURA_STAFF[i<5?0:1],hours:SAKURA_HOURS_TEXT})));

/** The TV's channels, in the order the channel button steps through them. The first is what it shows by default. */
export const SMALL_OFFICE_CHANNELS=Object.freeze([
 Object.freeze({id:'ferry',name:'Community cable 12: ferry arrivals',jp:'港町有線 12ch 入港案内',
  why:'The island’s cable channel runs the port’s board between programmes: the Minato Maru’s commuter boats in from Kitano-jima, from the town’s timetable (commuter-schedule.js HARBOUR_LINE).'}),
 Object.freeze({id:'weather',name:'Weather',jp:'天気予報',
  why:'The forecast for the main island and the islands near it, sky from the town’s own weather; October’s normal 27 °C by day and 22 °C at night.'}),
 Object.freeze({id:'game',name:'Video: Riku’s game',jp:'ビデオ',title:'SHIMA NEKO DASH!',sub:'Island Cat Dash',maker:'© 1997 Harbour Soft',
  why:'Riku’s console on the video input, at its title screen: an invented 1997 game of a cat running the harbour wall for fish.'}),
]);
/** October's normals for Naha, °C, for the weather channel. */
export const OCTOBER_NORMALS=Object.freeze({high:27,low:22});

/** The office's one double socket (コンセント 15 A, 100 V): what is plugged into it, in watts. */
export const SMALL_OFFICE_SOCKET=Object.freeze({amps:15,volts:100,loads:Object.freeze(['fridge','tv','console','lamp','fairy'])});
export const socketLoad=()=>SMALL_OFFICE_SOCKET.loads.reduce((s,id)=>s+(SMALL_OFFICE_ITEM[id].watts||0),0);

/** Solid furniture for walking, in the shop's frame: rect(x, z, w, d, height). */
export const SMALL_OFFICE_COLLIDERS=Object.freeze([
 Object.freeze({id:'desk',x:6.44,z:-3.42,w:.7,d:1.0,height:.75}),
 Object.freeze({id:'fridge',x:4.93,z:-3.67,w:.48,d:.5,height:1.22}),
 Object.freeze({id:'chair',x:5.72,z:-3.24,w:.5,d:.5,height:.9}),
]);

/** One read line per thing, the same on both editions (and the web's whole prompt). */
export function smallOfficeText(id){const i=SMALL_OFFICE_ITEM[id];return i?i.why+'\n\n'+i.period:'';}
