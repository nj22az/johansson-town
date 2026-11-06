/**
 * Johansson Mart, Kitahama (ヨハンソンマート 北浜店): a one-room corner shop at the entrance to Kitahama, kept by
 * Grandmother Higa in the evenings and on Saturdays (the owner, 27 October 2026: "We need a resident we have already, maybe
 * bring grandma higa as the attendant"; "draw the shop in cad and I'll drop a Meshy for you after, exterior and interior").
 *
 * DESIGN DATA, NOT YET BUILT INTO THE WORLD. Drawing KS-001 (docs/qa/kitahama-shop/) is drawn from this; the Meshy
 * models of the exterior and the interior are made to it; the game builds it from this data once they are in.
 *
 * Its own shop, not a copy of any game's or real chain's: by the standing rule that Johansson is this universe's Acme,
 * the chain is a Johansson company and wears the house green of Johansson Marine (johansson-marine.js livery.green).
 *
 * Coordinates: metres. `local` is [u,v,h]: u east and v north from the outside south-west corner of the walls, h up from
 * the apron (the forecourt's concrete). WORLD is where that corner stands on the island (x east, z north, as lots.js).
 * Everything has a `why`: who it is for and why it stands where it does (the repository's "nothing is random").
 */
import {townDate} from '../../town-clock.js';

const F=Object.freeze;
const box=(id,what,u0,v0,u1,v1,h0,h1,why,extra={})=>F({id,what,min:F([u0,v0,h0]),max:F([u1,v1,h1]),why,...extra});

export const KS_DRAWING=F({number:'KS-001',revision:'A',date:'2026-10-27',title:'Johansson Mart, Kitahama: the corner shop',
 scale:'1:50 (site 1:200)',units:'millimetres'});

/** The outside south-west corner of the walls, on the island. */
export const WORLD=F([35.6,63.2]);
/** Local [u,v] to the island's [x,z]. */
export const toWorld=(u,v)=>[+(WORLD[0]+u).toFixed(3),+(WORLD[1]+v).toFixed(3)];

export const SHOP=F({
 name:'Johansson Mart',jp:'ヨハンソンマート',branch:'北浜店',branchEnglish:'Kitahama',
 company:'Johansson Mart (a Johansson company; this universe’s Acme)',
 keeper:'Grandmother Higa',
 why:'Sakura is the island’s shop and shuts on Saturdays (the owner, 22 October 2026) and at 20:30. The town wanted somewhere for milk, bread, a bento and a beer when Sakura is shut, and Grandmother Higa, whose liquor shop on Main Street had shut when its trade went to Sakura, wanted a counter again (since 30 October 2026 its room is hers again in the mornings, as Kissa Higa). The chain lets a franchise keep its own hours on a small island.',
 site:'the east end of the north block (lots.js kitahama-north-block): the corner of the cross lane and the approach, the one road a car comes into Kitahama by, so the van unloads at the door and nothing drives further in.',
});

/** The building: one storey of reinforced concrete with block infill, rendered, under a flat roof with a parapet. */
export const BUILDING=F({
 outside:F([6.0,6.2]),             // u × v
 wall:.15,                          // block and render
 floor:.10,                         // the shop floor over the apron: a 100 mm step, its edge chamfered
 ceiling:2.80,                      // clear ceiling over the apron datum (2.70 clear over the floor)
 roofTop:3.15,                      // the roof slab's top, under its screed
 parapetTop:3.60,
 parapetCap:.05,
 plinth:.30,                        // the painted base of the walls
 construction:'reinforced-concrete frame, 150 mm concrete block infill, cement render; flat RC roof falling 1:80 to a gutter and downpipe at the north-east corner',
 why:'how a small shop is built on Okinawa: concrete, because of the typhoons and the termites; flat, so the water tank and the condensers stand on the roof or behind',
});
const W=BUILDING.wall,[OU,OV]=BUILDING.outside;
/** The inside faces of the walls. */
export const INSIDE=F({u0:W,v0:W,u1:+(OU-W).toFixed(3),v1:+(OV-W).toFixed(3)});

/** The rooms inside the walls. Areas are the drawings' (net, inside the finishes). */
export const ROOMS=F([
 F({id:'sales',name:'Shop floor',zone:F([W,W,OU-W,4.40]),zoneB:F([W,4.40,3.90,OV-W]),
  why:'one room the customer walks round: in at the door, along the window to the magazines, back to the drinks, round the island, to the till'}),
 F({id:'stock',name:'Stockroom',zone:F([4.00,4.50,OU-W,OV-W]),
  why:'the day’s delivery and the cases for the cooler; reached from behind the counter and from the delivery door on the approach'}),
]);

/** Openings in the outside walls: [wall, from, to, sill, head]. `from`/`to` run along the wall (u on the south and north walls, v on the east and west). */
export const OPENINGS=F([
 F({id:'D1',wall:'south',kind:'automatic sliding door, two leaves',from:4.00,to:5.60,sill:BUILDING.floor,head:2.30,
  why:'the way in, at the corner end of the front, so it is the first thing seen from the approach; automatic, as every chain shop of the 1990s'}),
 F({id:'W1',wall:'south',kind:'shopfront glazing, aluminium, fixed',from:2.20,to:3.90,sill:.60,head:2.40,
  why:'the lit inside seen from the cross lane; the magazine rack stands behind it, as in every konbini window'}),
 F({id:'W2',wall:'east',kind:'side window, aluminium, fixed',from:.90,to:3.40,sill:1.10,head:2.40,
  why:'faces the approach: whoever comes up the road at night sees the shop open; high enough for the cigarette shelf below it behind the counter'}),
 F({id:'D2',wall:'east',kind:'steel delivery door, single, outward',from:4.70,to:5.60,sill:BUILDING.floor,head:2.10,
  why:'the van stops on the approach and the cases go straight into the stockroom, not through the shop'}),
]);
/** Where you stand to go in: on the forecourt, a stride in front of the door's glass (the street's door point, game.js doors). */
export const DOOR_POINT=F([+(WORLD[0]+4.80).toFixed(3),+(WORLD[1]-.45).toFixed(3)]);
/** The solid stretch of the front, west of the glazing: the vending machines stand against it outside, the copier inside. */
export const FRONT_PIER=F({from:0,to:2.20});

/** Partitions inside: the stockroom's two walls (100 mm studwork, painted). */
export const PARTITIONS=F([
 box('P1','stockroom wall, west',3.90,4.40,4.00,OV-W,BUILDING.floor,BUILDING.ceiling,'separates the stock from the shop floor'),
 box('P2','stockroom wall, south',3.90,4.40,OU-W,4.50,BUILDING.floor,BUILDING.ceiling,'with the staff door D3 from behind the counter'),
]);
export const INNER_DOORS=F([
 F({id:'D3',wall:'P2',kind:'staff door, flush, hinged',from:5.00,to:5.80,head:2.05,why:'from behind the counter to the stock, so the till is never left with the stockroom on the far side of the shop'}),
]);

/** The fixtures, standing on the floor (h from the apron datum). */
const fl=BUILDING.floor;
export const FIXTURES=F([
 box('F1','till counter (with the cash register and the hot case)',4.30,1.60,4.90,4.40,fl,fl+.95,
  'along the east wall, beside the door: the keeper sees who comes in and the whole floor; 950 mm, a counter’s height. It runs on to the stockroom wall, its last 600 mm the lift-up flap the keeper comes through (27 October 2026: the keeper’s aisle was open to the shop floor)',{flap:F([3.80,4.40]),parts:F(['till: a cash register with a pole display facing the customer','hot case for nikuman and fried chicken, 450 mm wide, south of the flap','a tray of island gōyā and greens from Grandmother Higa’s own garden at the customer’s end','the lift-up flap and the gate under it, at the north end, against the stockroom wall'])}),
 box('F12','counter return',4.90,1.45,5.60,1.60,fl,fl+.95,
  'closes the keeper’s aisle at its south end, by the door: nobody walks in behind the till'),
 box('F2','cigarette and spirits shelf, behind the counter',5.60,1.60,OU-W,3.80,fl,fl+.95,
  'behind the keeper and under the side window, 700 mm behind the counter (the keeper’s aisle): cigarettes, awamori and whisky, which are asked for, not picked'),
 box('F3','three-door drinks cooler (reach-in, glass doors)',.30,5.30,2.55,OV-W,fl,fl+2.00,
  'at the back, so the customer walks past everything else to reach it; its condenser is outside on the north wall'),
 box('F4','chest freezer for ice cream and ice',2.75,5.40,3.75,OV-W,fl,fl+.85,
  'beside the cooler; bagged ice for the boats and the barbecue, ice lollies for the children after school'),
 box('F5','open chiller (multideck): bento, onigiri, sandwiches, milk, tofu',W,2.20,.95,4.60,fl,fl+1.90,
  'down the west wall, the long way from the door: the evening’s bento is what most come for'),
 box('F6','gondola island, two-sided, four shelves',1.90,1.80,2.80,4.40,fl,fl+1.35,
  'the middle of the floor: bread and snacks on the east face, groceries and household goods on the west; low enough for the keeper to see over'),
 box('F7','magazine rack',2.30,W,3.50,.50,fl,fl+1.10,
  'along the shopfront glazing, so people browsing are seen from the lane and the shop looks busy'),
 box('F8','copier',W+.05,.20,1.00,.85,fl,fl+1.05,
  'behind the solid pier: the residents’ association copies its notices here (the notice boards)'),
 box('F9','stock shelving, steel, five shelves',4.00,4.55,4.35,5.50,fl,fl+2.10,
  'along the stockroom’s west wall, so the floor from the delivery door to the staff door is clear for the cases: the cases waiting for the cooler and the shelves'),
 box('F10','staff sink and kettle shelf',4.40,5.55,4.95,OV-W,fl,fl+.90,
  'a hand basin for the hot case and a kettle; there is no toilet (the bathhouse is hers, and her house is a short walk)'),
 box('F11','umbrella stand',3.60,.20,3.85,.45,fl,fl+.55,
  'inside the door; a basket of long umbrellas for sale beside it in the rains (avatars/umbrella.js, navy)'),
]);

/** Outside, on the apron and behind. */
export const OUTSIDE=F([
 box('X1','two drinks vending machines (Minato Drinks)',.10,-.80,2.10,-.05,0,1.83,
  'against the solid pier, facing the lane: cold drinks when the shop is shut; Minato Drinks rents the corner, as it rents Sakura’s wall (lots.js)'),
 box('X2','can and bottle bins',2.15,-.55,2.75,-.10,0,.90,'beside the machines, as the law asks of whoever sells cans'),
 box('X3','refrigeration condensing units, two',.50,OV+.10,2.30,OV+.70,0,.90,
  'outside the north wall behind the cooler and the chiller, on a pad, under a louvred screen; the gōyā curtain hides them from the spine'),
 box('X4','roof water tank, stainless, 1 m³, on a steel stand',4.40,4.40,5.60,5.60,BUILDING.roofTop,BUILDING.roofTop+1.40,
  'the island’s water is cut in dry summers; every Okinawan roof has its tank'),
 box('X5','canopy over the door, steel, in the house green',3.80,-1.00,5.80,0,2.45,2.55,
  'keeps the rain off the door and the bins’ users; underside 2.45 m'),
 box('X6','signboard (fascia), lit from inside, south and east faces',0,-.15,OU+.15,OV,2.80,3.50,
  'the shop’s name round the corner, read from the cross lane and from the approach'),
 box('X7','A-board for Grandmother Higa’s vegetables',2.85,-1.20,3.35,-.80,0,.90,
  'chalked: what is in from her garden today'),
 box('X8','downpipe and gutter outlet',OU-.10,OV-.10,OU+.02,OV+.02,0,BUILDING.parapetTop,'the roof falls to the north-east corner, away from the door'),
]);

/** The livery: the house green of Johansson Marine, with cream and white. */
export const LIVERY=F({
 green:'#2e7a4e',greenDark:'#235c3b',cream:'#efe6d2',white:'#ffffff',plinth:'#7d7f7a',frames:'#c9ccc8',
 fascia:'the house green, a white line along its foot, the name in white: “JOHANSSON MART” over “ヨハンソンマート 北浜店”',
 walls:'warm cream render; the plinth painted concrete grey',
 inside:'white walls, grey-speckled vinyl tiles on the floor, white fittings with green shelf edges; fluorescent troffers in four rows',
});

/** Grandmother Higa's week with the shop in it (the bath's hours are cast.js's). */
export const HOURS=F({
 weekdays:F([['06:00','08:00','her garden on the seawall walk (lots.js kinjo-lot)'],['10:00','17:00','the bandai at Umi-no-yu'],
  ['17:00','17:30','the walk to Kitahama; the van’s cases into the stockroom'],['17:30','21:00','the shop']]),
 saturday:F([['06:00','08:00','her garden'],['09:00','21:00','the shop (Miss Higa keeps the bandai at weekends)']]),
 sunday:F([['06:00','08:00','her garden'],['all day','','the shop is shut; Sakura is open']]),
 sign:'平日 17:30–21:00 · 土曜 9:00–21:00 · 日曜 定休',
 signEnglish:'Weekdays 17:30–21:00. Saturdays 9:00–21:00. Closed Sundays.',
 why:'open exactly when Sakura is shut (its evenings and its Saturdays) and when she is free of the bath. Nhung, her doctor, thinks a second job at 78 is the last thing her blood pressure needs.',
});

/** Open, at an absolute town minute: weekdays 17:30–21:00, Saturdays 9:00–21:00, shut on Sundays (HOURS; the device's
 *  calendar, town-clock.js). The one rule the door, the town's hours and Grandmother Higa's day all read. */
export const SHOP_OPEN=F({weekday:F([1050,1260]),saturday:F([540,1260])});
/** When Grandmother Higa is at the shop: from the 17:00 van on weekdays and a quarter of an hour before the Saturday
 *  opening, to closing. Her plan (people/canonical-day.js) and the till read it. */
export const SHOP_DUTY=F({weekday:F([1020,1260]),saturday:F([525,1260])});
export function kitahamaShopOnDuty(minutes){
 const {weekday}=townDate(minutes),m=((minutes%1440)+1440)%1440;
 const span=weekday===0?null:weekday===6?SHOP_DUTY.saturday:SHOP_DUTY.weekday;
 return !!span&&m>=span[0]&&m<span[1];
}
export function kitahamaShopOpen(minutes){
 const {weekday}=townDate(minutes),m=((minutes%1440)+1440)%1440;
 const span=weekday===0?null:weekday===6?SHOP_OPEN.saturday:SHOP_OPEN.weekday;
 return !!span&&m>=span[0]&&m<span[1];
}

/** Delivery: the island's everyday goods come on Sakura Trading's round (merchandising.js), the chain's too. */
export const DELIVERY=F({by:'Sakura Trading’s van, on its round (commerce/trade-round.js)',when:'17:00, Monday to Saturday',
 where:'on the approach at the delivery door D2',why:'Sakura Trading is the island’s distributor of everyday goods and alcohol; the chain buys through it rather than bring its own van over on the ferry'});

/** What is sold, by fixture, and why it is here when Sakura is shut. */
export const STOCK=F([
 F({fixture:'F5',goods:'bento, onigiri, sandwiches, milk, tofu, natto, yoghurt',why:'supper and tomorrow’s breakfast for whoever finishes late: the crew off the last boat, Kōji back from the sea'}),
 F({fixture:'F3',goods:'tea, water, sports drinks, milk coffee, beer, chūhai',why:'cold drinks; beer and chūhai on Saturdays when Sakura, the island’s only licence, is shut (Grandmother Higa held a liquor licence for fifty years)'}),
 F({fixture:'F4',goods:'ice cream, ice lollies, bagged ice',why:'after school on Saturdays; ice for the boats and Mac’s grill'}),
 F({fixture:'F6',goods:'bread, instant noodles, snacks, sweets; rice, oil, soy sauce, canned goods; batteries, tissues, toilet paper, toothbrushes, shampoo, plasters',why:'the things run out of in an evening'}),
 F({fixture:'F7',goods:'the island paper (printed by Nhung), weekly magazines, manga, puzzle books',why:'read by the window'}),
 F({fixture:'F2',goods:'cigarettes, awamori, whisky',why:'asked for at the till'}),
 F({fixture:'F1',goods:'nikuman, fried chicken; Grandmother Higa’s gōyā, handama and island greens',why:'the hot case is the smell at the door; the greens are from her garden that morning'}),
 F({fixture:'F11',goods:'long umbrellas (navy)',why:'in the rains, for whoever is caught out'}),
]);

/** What changes on the site to make room, and what each change touches (the repository's "plan a change before making it"). */
export const SITE_CHANGES=F([
 F({what:'the shop takes the east end of the monthly parking (old bays 3 and 4) and stands on its own concrete (lots.js shop-apron)',
  touches:'lots.js NORTH_BLOCK, ground-plan-quarters.js KITAHAMA_PADS; done 27 October 2026 (batch 1)'}),
 F({what:'the parking moves west and keeps three bays in the same order (1 Kōji, 2 Nhung, 3 Mac); the to-let bay goes',
  touches:'lot-dressing.js PARKING, the car and toolbox rectangles in lots.js; the sign now reads 空きなし (none free); done (batch 1)'}),
 F({what:'Mrs Sato’s spring onions and Riku’s sunflowers are shortened to x 24.6–27.8, clear of the gravel',
  touches:'lots.js negi-bed, sunflower-bed; done (batch 1)'}),
 F({what:'the hedge runs x 28.0–35.4 and the gōyā curtain x 29.8–35.4, short of the garden shed; the parking sign stands at x 31.7',
  touches:'lots.js parking-hedge, goya-curtain, parking-sign; done (batch 1)'}),
 F({what:'Grandmother Higa’s week gains the shop (HOURS); the bath’s hours do not change',
  touches:'people/cast.js her day and purpose, residents’ routines and walking routes (her home to Kitahama), the storyteller’s places (feed/places.js), the resident guide (batch 3)'}),
 F({what:'Sakura Trading’s round gains a stop at 17:00 on the approach',
  touches:'commerce/trade-round.js, the van’s route on the approach (batch 3)'}),
]);

/** Open questions, written down rather than guessed (the repository's "if a part is not built yet, record it"). */
export const OPEN=F([
 'The Meshy models of the exterior and the interior (the owner, 27 October 2026), to this drawing.',
 'Who keeps the shop when Grandmother Higa is ill: nobody is planned; the shop would stay shut.',
 'The chain’s logo: the drawing gives the wordmark only; a mark of its own is to be designed in Studio.',
]);
