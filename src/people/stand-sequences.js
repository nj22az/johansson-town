import {SATO_KITCHEN as K} from '../world/sato-ramen-layout.js';
/**
 * The stand sequences of the residents' days (stand-points.js; New Yokosuka's measured routines, docs/research/
 * new-yokosuka-lessons.md §2.3, §3.2, §6, C6). Each sequence is a list of points walked in order and looped while the
 * phase that names it lasts (cast.js `day`, a row's `{stand:'id'}`). A point is where the resident stands (`x`, `z`, in
 * the sequence's `frame`: 'world' for the street and the quay, or a room's own frame), the way they face (`facing`, a
 * direction [dx, dz]), how long they stay (`wait`, seconds, drawn from the range by the seeded clock), what they do
 * there (`activity`, and `pose`, one of the town's poses, with `tool` in the right hand where the avatar has one:
 * avatars/tools.js), and why the point is where it is (`why`). Nothing is placed for its own sake.
 *
 * The numbers follow the measured days: a shopkeeper holds two or three stand points with waits of two to twenty
 * minutes (§3.2: 120–1,200 s), a homemaker's day is seven to twelve such rows (§2.3), waits have a median of five
 * minutes (§6: p10 120 s, p90 1,200 s), and people walk at 1.25 m/s between them.
 *
 * Coordinates were measured against the rooms' and the town's own colliders (tests/stand-points.test.mjs proves each
 * point reachable, clear of every solid at the town's contact distance and out of every doorway's opening).
 */
const pt=(x,z,facing,wait,activity,why,{pose='Idle',tool=null,station=null}={})=>Object.freeze({x,z,facing:Object.freeze(facing),wait:Object.freeze(wait),activity,why,pose,tool,station});
const seq=(id,frame,who,why,points)=>Object.freeze({id,frame,who,why,points:Object.freeze(points)});
const N=[0,-1],S=[0,1],E=[1,0],W=[-1,0];

export const STAND_SEQUENCES=Object.freeze(Object.fromEntries([
 // ── Sakura Shōten (commerce/sakura-rota.js) ──
 // The doorstep at opening, on the pavement in front of the door (world frame; the frontage runs along z at x −7.45 and
 // its doorstep is a step up the town's walkers do not take, so she sweeps the pavement edge in front of it).
 seq('sakura-doorstep','world','Thuan','The shutter goes up at nine and the owner sweeps her own pavement before the first customer, as every shopkeeper on the street does.',[
  pt(-6.1,-25.6,W,[180,300],'sweeping the pavement in front of Sakura before opening','north of the doorway, by the fruit trestle: the leaves and the night’s sand blow in against it',{pose:'Sweep',tool:'broom'}),
  pt(-6.1,-29.4,W,[180,300],'sweeping the pavement by the bin','south of the doorway, by the bin: the last of the sweepings go in it',{pose:'Sweep',tool:'broom'}),
 ]),
 // The shop floor (Sakura's own frame, world/interiors/sakura-layout.js): whoever the rota puts at the counter.
 seq('sakura-floor','sakura','the clerk on the rota (Thuan on weekdays, Nhung on Sunday)','A shopkeeper alone in a shop this size is at the till most of the day and leaves it only for the jobs that cannot wait: the cold drinks and the window.',[
  pt(5.29,.85,W,[300,1200],'at the till, facing the shop','the clerk’s stand point, 0.75 m behind the counter’s front (New Yokosuka’s konbini, §3.1): where she can see the door and both aisles',{pose:'CounterIdle'}),
  pt(2.39,-2.66,N,[120,480],'facing up the cold drinks, beer to the front','the cooler’s column nearest the till, the beer and the cold tea that sell first and leave gaps',{pose:'Interact'}),
  pt(5.29,.85,W,[300,900],'back at the till','the till again: nobody should wait to pay while she is in an aisle',{pose:'CounterIdle'}),
  pt(-4.6,3.2,S,[120,300],'wiping the west window, where the magazine rack stood','the west window, the shop’s face to the lane: the sale poster and the glass are what passers-by see',{pose:'Wipe',tool:'cloth'}),
 ]),
 // ── Front-Row Books (world/bookshop-workshop-layout.js; its own frame) ──
 // Since 22 October 2026 (the owner) Nhung is the island doctor and the shop floor is unstaffed: the paper is her evening's.
 seq('frontrow-paper','frontrow','Nhung','In the evening, after surgery and supper, the town’s small paper is set and printed at the back bench of the old shop.',[
  pt(-2.0,-2.0,N,[600,1500],'setting the paper’s page at the back bench','the back bench with the proofs and the wrapping roll: the paper is set here',{pose:'Use'}),
  pt(-2.6,1.2,S,[300,900],'at the counter, counting the honesty tin','the counter: the day’s coins from the honesty tin by the till, the proofs beside it',{pose:'CounterIdle'}),
  pt(-2.0,-2.0,N,[300,900],'reading the page’s proofs for corrections','the back bench again, for the corrections in Nhung’s hand',{pose:'Use'}),
 ]),
 // ── Sato Ramen's kitchen (world/sato-ramen-layout.js SATO_KITCHEN; people/ramen-kitchen.js walks the aisle) ──
 // Each point is a station of the compact kitchen's aisle (art/izakaya/compact/plan.json ramenStaff), so the points move
 // with the measured plan; the pass is behind the counter between the boiler and the pots.
 seq('ramen-stock','ramen','Mrs Sato','Before lunch the stock pot is the kitchen: bones in at seven, skimmed and topped up all morning.',[
  pt(...K.pots,N,[600,1500],'skimming the stock pots','the stock pots on the back line',{pose:'Use',station:'pots'}),
  pt(...K.prep,N,[300,900],'cutting the chashu and the spring onion for lunch','the prep board at the west end of the line',{pose:'Use',station:'prep'}),
  pt(...K.boiler,N,[120,300],'checking the noodle boiler is up to heat','the noodle boiler, lit an hour before lunch',{pose:'Use',station:'boiler'}),
 ]),
 seq('ramen-lunch','ramen','Mrs Sato','Between orders at lunch she is never still: pots, board, toppings, the counter wiped.',[
  pt(...K.pots,N,[120,420],'stirring the stock pots','the stock pots on the back line, kept at a simmer through lunch',{pose:'Use',station:'pots'}),
  pt(...K.prep,N,[120,300],'chopping spring onion','the prep board, where the onion and the chashu are cut as the bowls go out',{pose:'Use',station:'prep'}),
  pt(...K.toppings,N,[60,240],'laying out the toppings','the topping tray at the east end of the line',{pose:'Use',station:'toppings'}),
  pt((K.boiler[0]+K.pots[0])/2,K.passZ,S,[60,180],'wiping down the counter','the pass, over the counter to the stools, wiped after every bowl',{pose:'Wipe',tool:'cloth',station:'pass'}),
  pt(...K.boiler,N,[60,180],'checking the noodle boiler','the boiler, kept at the boil through lunch',{pose:'Use',station:'boiler'}),
 ]),
 // ── Minato Police Station (world/interiors/police-station.js STATION_ROOM; ground floor) ──
 seq('station-desk','koban','Officer Mori','The desk shift is the counter, the window where the police box used to be, and the notice board people read while they wait.',[
  pt(1.1,.15,S,[300,1200],'at the front desk with the incident log','behind the counter, facing the lobby and the door (STATION_ROOM.staff)',{pose:'CounterIdle'}),
  pt(-1.8,2.2,S,[120,600],'at the counter window, for people who come up to ask the way','the window desk in the bay where the police box’s window is now',{pose:'CounterIdle'}),
  pt(.55,1.95,W,[120,300],'pinning the week’s notices on the lobby board','the lobby notice board on the partition: lost property, the traffic-safety week, the typhoon notice',{pose:'Interact'}),
 ]),
 // ── Gran Higa's garden (the dressed Kinjō lot, world/okinawa/lots.js KINJO; world frame) ──
 seq('higa-garden','world','Grandmother Higa','An obaa’s morning garden round before the bath: the vines, the water, the beds and the altar flowers (the lot’s hours: from six to half past eight).',[
  pt(-31.4,-8.4,W,[300,900],'tying up the gōyā vines on the A-frame','the gōyā frame against the west wall, out of the salt wind',{pose:'Interact'}),
  pt(-30.1,-10.0,E,[120,300],'filling the watering can from the water jar','the kame by the gate, filled from the hose so the water is warm for the beds',{pose:'Interact'}),
  pt(-30.5,-6.6,E,[300,900],'weeding the island greens','the greens and chillies east of the path, in the morning sun',{pose:'Interact'}),
  pt(-31.4,-4.3,W,[120,600],'picking handama for lunch','the handama bed, purple under green',{pose:'Interact'}),
  pt(-31.4,-1.7,W,[120,300],'cutting chrysanthemums for the family altar','Mrs Kinjō’s chrysanthemums along the north wall, kept for the altar',{pose:'Interact'}),
 ]),
 // ── Kōji's net ground (the dressed Ōshiro lot, KOJI's nets; world frame) ──
 seq('koji-nets','world','Kōji','The lot’s hours: the nets come down before dark and are mended in the afternoon.',[
  pt(-28.4,7.6,N,[600,1500],'mending the hole the coral made','the net heap by the lane, with the mending stool beside it',{pose:'Interact'}),
  pt(-31.5,8.6,W,[300,900],'checking the long net for holes along the rail','between the two rails, where the wind goes through the mesh',{pose:'Think'}),
  pt(-29.0,9.5,W,[300,900],'taking the dry net down off the east rail','the east rail, the long net',{pose:'Interact'}),
  pt(-28.5,10.6,S,[120,300],'stacking the fish boxes for the morning','the fish boxes, out of the rails’ way',{pose:'Interact'}),
 ]),
 // ── The coin laundry's morning round (world frame; commerce/coin-laundry.js LAUNDRY_KEEPER) ──
 // The room's own points (coin-laundry-dressing.js LAUNDRY_ROUND_POINTS) as numbers, so this list loads no building.
 seq('laundry-round','world','Ms Ganaha','The keeper’s hour before the mailbag: the room swept, the dryers’ lint filters cleared, the coin boxes emptied for the bank, the powder box filled and the board’s notices put up, as a coin laundry that runs itself is kept.',[
  pt(-10.1,20.6,W,[180,420],'sweeping the coin laundry’s floor','the middle of the room, from the door back: the night’s sand comes in on everybody’s sandals',{pose:'Sweep',tool:'broom'}),
  pt(-11.6,21.7,S,[300,600],'emptying the washers’ coin boxes into a cloth bag','in front of the washers, whose coin boxes open with her key under each lid',{pose:'Interact'}),
  pt(-11.85,19.75,N,[300,600],'clearing the dryers’ lint filters','in front of the two gas dryers, whose filters choke by morning',{pose:'Interact'}),
  pt(-12.45,20.95,W,[120,300],'pinning up the new notices','the noticeboard over the bench, where the street reads while its washing goes round',{pose:'Interact'}),
 ]),
 // ── The harbour agent's round of the quay (world frame) ──
 seq('harbour-round','world','Harbour master','Between the lunch and the evening boat Jack walks the quay with the freight book: the sailing list, the boats’ lines, the fuel and the east quay’s boats.',[
  pt(5.0,-45.0,E,[120,300],'checking the sailing list under the canopy','the timetable poster on the hall’s pier between the tower and the glass (port-building.js), which he keeps up to date, clear of the hall’s doors',{pose:'Think'}),
  pt(15,-48.6,N,[120,480],'looking over the fishing boat’s head line','the fishing boat’s bow bollard (minato-berth.js QUAY_FISHING_BOAT)',{pose:'Think'}),
  pt(18.2,-48.6,N,[120,300],'reading the diesel meter for the freight book','the co-op’s fuel point on the kerb (quay-dressing.js)',{pose:'Interact'}),
  pt(24.6,-48.4,N,[300,900],'a word with the Daisan Minatomaru’s skipper about tomorrow’s ice','the east quay’s edge by the fishing boats, in front of the auction shed',{pose:'Idle'}),
 ]),
].map(s=>[s.id,s])));
