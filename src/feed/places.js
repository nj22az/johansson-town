import {kissaPeopleAt} from '../commerce/kissa-higa.js';
const KISSA_STORY_TIME=4*1440+462; // Monday 07:42: Yui, Ganaha and Tetsuo overlap before school and work.
import {HARBOUR_POND,HARBOUR_PARK_SEATS} from '../world/harbour-park-plan.js';

/**
 * The real places the town feed's stories happen in. Each is a room or street in the game,
 * with the backdrop tools/render-feed-backdrops.mjs captures from it (`shot`: a room the
 * audit hook enters, or a street camera), and the nouns a story can pick up there.
 *
 * kind: shop, food, bar, work, bath, civic, outdoor. `regulars` are the residents who belong
 * there, by the live cast's own days (people/cast.js CAST, phase 5 of docs/CAST-CONSOLIDATION.md: every one of the 26
 * is a regular somewhere, the ship's people aboard her, the port clerk at her window, the officer at his station);
 * anyone else is a visitor (nobody the roster retired is a regular anywhere: the storyteller leaves them out of
 * the catalogue too, storyteller.js). tests/feed-storyteller.test.mjs holds the names to the cast. `things` are objects actually in the place, `doing` are
 * verbs phrases that make sense there ("{who} was {doing}"). `activity` is what people do
 * there in a comic: the drinks they may hold (izakaya-serving-visuals.js kinds), how likely
 * they are to (chance) and how likely to be sitting (sit). `captured:false` marks a place whose backdrops have not been
 * photographed yet: it is wired (its regulars, things and shot), but the storyteller does not set a story there until
 * `node tools/render-feed-backdrops.mjs <id>` has run (Chromium with a GPU, or swiftshader given the minutes the first
 * frame takes), and the flag is removed with the pictures committed.
 */
export const FEED_PLACES=Object.freeze([
 {id:'sakura',name:'Sakura Shōten',short:'Sakura',kind:'shop',regulars:['Thuan','Nhung'],
  things:['the drinks fridge','the sale poster by the door','the onigiri shelf','the potted palm','the till','the price gun','the ATM','the biscuit aisle','the staff roster'],
  doing:['restocking the biscuit aisle','taping up the sale poster','arguing with the price gun','counting onigiri','dusting the potted palm','reading the staff roster'],
  activity:{hold:['can','coffee'],chance:.4,sit:0},
  shot:{room:'market'}},
 {id:'sakura-street',name:'outside Sakura Shōten',short:'Sakura',kind:'outdoor',regulars:['Thuan','Vy'],
  things:['the parcel sign','the vending machine','the bus stop sign','the shop awning','the bicycle rack'],
  doing:['waiting for the bus','carrying out a delivery crate','reading the shop window','sheltering under the awning'],
  activity:{hold:['can','coffee'],chance:.7,sit:0},
  shot:{at:[-1,-24],camera:{pos:[3.5,1.7,-21.5],at:[-5.5,2,-27.3]}}},
 {id:'minato',name:'Minato Izakaya',short:'Minato',kind:'bar',regulars:['Thao','Chin','Mr Fujita','Mac','Nhung','Ren'],
  things:['the bottle keep','the karaoke machine','the pink telephone','the yakitori grill','the red stools','the oden pot','the lantern'],
  doing:['queueing for karaoke','tidying the bottle keep','fanning the yakitori grill','sharing a plate of edamame','writing a name on a bottle tag'],
  activity:{hold:['draft','draft','bottle','sake','awamori'],chance:.95,sit:.65},
  shot:{room:'izakaya',time:1200}},
 {id:'sato-ramen',name:'Sato Ramen',short:'Sato Ramen',kind:'food',regulars:['Mrs Sato','Harbour master','Officer Mori','Nhung','Ms Uezu','Ms Ganaha'],
  things:['the ticket machine','the stock pot','the red stools','the noodle basket','the chopstick box','the window table for two'],
  doing:['feeding the ticket machine','waiting for a bowl of shoyu ramen','watching the stock pot','slurping noodles','mending something at the window table'],
  activity:{hold:['coffee','can'],chance:.5,sit:.8},
  shot:{room:'ramen'}},
 // The shop floor closed on 22 October 2026 (Sakura sells the books; Nhung, the doctor, prints the paper here in the evening).
 {id:'books',name:'the old Front-Row shop, where the town paper is printed',short:'Front-Row',kind:'shop',regulars:['Nhung','Officer Mori'],
  things:['the window seat','the town paper','the poetry shelf','a paper bookmark slip','the printing bench','Tama the cat'],
  doing:['reading on the window seat','proofreading the town paper','tucking slips into books','negotiating with Tama the cat'],
  activity:{hold:['coffee'],chance:.35,sit:0},
  shot:{room:'frontrow'}},
 {id:'onsen',name:'Umi-no-yu bathhouse',short:'Umi-no-yu',kind:'bath',regulars:['Miss Higa','Grandmother Higa','Tetsuo','Mr Fujita'],
  things:['the bandai counter','the coin tray','the milk fridge','the noren curtain','the women’s crimson noren','the men’s indigo noren','the price board','the breaker board behind the bandai','the breaker board','the men’s mirror','the comb sterilizer','the swimwear-zone sign over the rock-bath door','a stack of rental towels','the towel rail by the bath door','the three hair dryers','the massage chair','the straw jar on the milk fridge','the uchiwa rack','the giant Hārī fan','Miss Higa’s rubber plant','Miss Higa’s account book','Miss Higa’s noren pole','the box of extension cords under the bandai','the massage chair’s coin timer','the andon on the bandai','Miss Higa’s electric pot on the bandai','the supply breaker beside the board','the women’s fluorescent tube','the porch lamp','the stone lantern by the rock bath','the harbour lights across the water','the steam over the rock bath'],
  doing:['paying at the bandai','choosing a bottle of milk','reading the price board','waiting for the bath to cool','resetting a tripped breaker','putting the supply breaker back up in the dark','making tea at the bandai','folding rental towels','drying their hair at the mirror','combing their hair at the men’s mirror','hanging a towel on the rail','fanning themselves with an uchiwa'],
  activity:{hold:['bottle','can'],chance:.6,sit:0},
  shot:{room:'onsen'}},
 // The town hall's place is the Community Hall's kitchen since the mayor's office went (21 October 2026,
 // briefs/town-hall-zone.md phase M); its backdrops were shot on 22 October 2026 (node tools/render-feed-backdrops.mjs town-hall).
 {id:'town-hall',name:'the Community Hall',short:'the town hall',kind:'civic',regulars:['Nhung'],captured:true,
  things:['the document register','the request box','the booking sheet','the rice cookers','the work islands','the aprons on their pegs'],
  doing:['filing a request at the register','putting a request in the box','booking the stoves for Saturday','reading the booking sheet','reading the kitchen closure notice','looking at the stored equipment'],
  activity:{hold:['coffee'],chance:.5,sit:0},
  // (from the dish cupboards, across both work islands to the back wall and the WC door)
  shot:{room:'community-kitchen',camera:{pos:[-2.5,1.6,2.2],at:[2.5,1.0,-.4]}}},
 // Since the campus was split into its own buildings (briefs/town-hall-zone.md, phase S): the school and the clinic are
 // places of their own, shot on 22 October 2026 (node tools/render-feed-backdrops.mjs school clinic).
 {id:'school',name:'Minato Elementary School',short:'the school',kind:'civic',regulars:['Miss Higa','Vy','Riku'],captured:true,
  things:['the blackboard','the class board','the attendance book','the serving table','the cubbies','the class TV and its VHS deck','the milk crate'],
  doing:['copying the kanji off the blackboard','serving the kyūshoku','reading the class board','watching a video on the class TV','putting a bag in the cubbies','calling the register from the attendance book'],
  activity:{hold:['book'],chance:.4,sit:.5},
  // (from the back corner by the door: the blackboard, the sea windows and the rows of desks; at noon on a Wednesday in
  // term, 22 October (day 294, town-clock.js): the board is dated by the day it is drawn on, and 1 January is a holiday)
  shot:{room:'school',camera:{pos:[-3.93,1.6,3.07],at:[.6,1,-.6]},time:294*1440+720}},
 {id:'clinic',name:'Minato Clinic',short:'the clinic',kind:'civic',regulars:['Nhung'],captured:true,
  things:['the waiting bench','the eye chart','the examination couch','the X-ray lightbox','the scales and the height rod','the medicine cabinet','the clinic hours'],
  doing:['waiting on the bench','reading the eye chart','being weighed','looking at an X-ray on the lightbox','reading the clinic hours','sitting down for a check-up'],
  activity:{hold:[],chance:0,sit:.6},
  // (from inside the consulting room's door (the high view steps back, still this side of the partition): the couch behind its curtain, the eye chart, the lightbox, the stool and the desk)
  shot:{room:'clinic',camera:{pos:[1.9,1.6,.1],at:[-1.4,1,-2.3]}}},
 {id:'police-station',name:'Minato Police Station',short:'the police station',kind:'civic',regulars:['Officer Mori'],captured:false,
  things:['the counter bell','the incident log','the lost-property shelf','the lobby notice board','the long waiting bench','the town map on the wall','the holding-room door','the duty roster','the desk telephone','the thermos of barley tea','the typhoon cupboard'],
  doing:['ringing the bell at the counter','reading the lobby notice board','looking through the lost property','waiting on the long bench','studying the town map','asking the way to the harbour','handing in a blue umbrella','reading the duty roster'],
  activity:{hold:['coffee'],chance:.35,sit:.4},
  shot:{room:'koban',time:1020}},
 {id:'port-hall',name:'the Port Terminal',short:'the terminal',kind:'civic',regulars:['Ms Ganaha','Harbour master','Thuan','Aya'],captured:false,
  things:['the ticket window','the departures board','the parcel shelf','the map of the strait','the punch-card shelf','the hall bench','the vending machine','the date stamp','the brass parcel scale','the glass doors'],
  doing:['buying a ticket for the half past two','reading the departures board','collecting a parcel from the shelf','studying the map of the strait','waiting on the hall bench for the last boat','asking when the next boat is','posting a letter before half past four'],
  activity:{hold:['can','coffee'],chance:.5,sit:.45},
  shot:{room:'ferry-terminal',time:840}},
 // Higa Liquor and the coin laundry (the owner, 21 October 2026; commerce/higa-liquor.js, commerce/coin-laundry.js): their
 // regulars are the people the data puts there, their things are in the rooms, and the laundry's noticeboard is where the
 // street's story hooks are pinned (LAUNDRY_NOTICES). Higa Liquor shut for good on 22 October 2026 (the owner); since 30
 // October its room is Kissa Higa, Grandmother Higa's on weekday mornings (commerce/kissa-higa.js): a morning place, with
 // its regulars from their own days, and the bench out front an evening one. Street shots, waiting for
 // `render-feed-backdrops.mjs kissa-higa higa-liquor coin-laundry`.
 {id:'kissa-higa',name:'Kissa Higa, Grandmother Higa’s morning coffee shop in the old liquor shop',short:'Kissa Higa',kind:'shop',regulars:kissaPeopleAt(KISSA_STORY_TIME),captured:true,
  things:['the two siphons on their spirit lamps','the morning set: thick toast and a boiled egg','the white enamel kettle','the hand grinder','the record player and her husband’s 45s','the photograph of the island bus','the family kusu with its not-for-sale card','the stools along the ledge','the bentwood chairs at the table','the A-board on the pavement','the week’s town paper on the rack'],
  doing:['ordering the morning set','waiting for the siphon to draw','reading the town paper at the ledge','asking for the record with the writing on the sleeve','being told the jar is not for sale','pretending not to notice which stool Grandmother Higa keeps for Yui'],
  activity:{hold:['coffee'],chance:.7,sit:.6},
  shot:{at:[8.85,7.8],camera:{pos:[6.45,1.55,9.3],at:[9.85,.8,7.7]},time:KISSA_STORY_TIME}},
 {id:'higa-liquor',name:'the bench outside Kissa Higa',short:'the bench outside Kissa Higa',kind:'shop',regulars:['Tetsuo','Mac'],captured:true,
  things:['the shutter, down for the evening','the kissaten’s paper on it, still sending the drink to Sakura','the crates of empties','the bench out front','the crate stools','the enamel awamori tin left up on the flank'],
  doing:['sitting on the bench with a bottle from Sakura','pointing a visitor down the street to Sakura','counting the empties back','asking after the old jar','arguing about whether the coffee or the beer came first'],
  activity:{hold:['bottle','can'],chance:.6,sit:.4},
  shot:{at:[3.5,10.5],camera:{pos:[2.7,1.6,10.7],at:[6,1.1,8.7]},time:1110}},
 {id:'coin-laundry',name:'the coin laundry',short:'the laundry',kind:'shop',regulars:['Ms Ganaha','Thao','Ms Uezu','Nhung'],captured:false,
  things:['the noticeboard','the missing-cat notice','the found blue sandal','the manga shelf','the vinyl bench','the change machine','dryer 2, which eats coins','the folding counter','the powder box','a basket of somebody’s washing'],
  doing:['waiting for the spin','reading a manga on the bench','pinning up a notice','folding warm towels at the window','feeding coins into the dryer','reading the noticeboard','emptying the coin boxes'],
  activity:{hold:['can','coffee'],chance:.35,sit:.5},
  shot:{at:[-6.2,20.6],camera:{pos:[-3.6,1.7,24.2],at:[-11.5,1.6,20.4]},time:1320}},
 {id:'harbour',name:'the harbour',short:'the harbour',kind:'outdoor',regulars:['Harbour master','Johansson','Riku','Kōji','Ms Uezu'],
  things:['the ferry gangway','a bollard','the quay lamp','a coil of rope','the tide board','a crate of gurukun'],
  doing:['watching the ferry come in','checking the tide board','coiling rope','counting crates','waiting for the gangway'],
  activity:{hold:['can','coffee'],chance:.5,sit:0},
  shot:{at:[3,-48],camera:{pos:[6,1.8,-47],at:[-4,1,-58]},time:960}},
 {id:'pier',name:'the outer pier',short:'the pier',kind:'outdoor',regulars:['Harbour master','Officer Mori','Kōji','Mr Fujita'],
  things:['the end of the pier','a fishing rod','the warning light','a bucket of bait','the sea'],
  doing:['fishing off the pier','watching the sunset','reading the night warning sign','feeding a gull'],
  activity:{hold:['can','draft'],chance:.6,sit:0},
  shot:{at:[-.6,-83.2],camera:{pos:[-1.2,1.8,-80.2],at:[-1.6,1,-94.2]},time:1080}},
 {id:'ferry',name:'the Minato Maru',short:'the ferry',kind:'work',regulars:['Mr Fujita','Johansson','Chin','Mac','Ryo','Ren','Aya','Jun','Ms Uezu'],
  things:['the gangway','the bow ramp','the bow line on its bollard','the wheelhouse wing','the orange life floats','the funnel','the name on her bow','the draft marks','the stern capstan','the car lashings'],
  doing:['waiting for the gangway','watching the ramp come down','backing a kei truck aboard','reading the name on her bow','reading the draft marks','coiling the bow line','waving from the wheelhouse wing','counting the cars aboard'],
  activity:{hold:['can','coffee'],chance:.5,sit:0},
  shot:{at:[-2.6,-60.5],camera:{pos:[-1,1.7,-55.2],at:[-7.6,2.2,-64.5]},time:900}},
 {id:'park',name:'Harbour Park',short:'the park',kind:'outdoor',regulars:['Vy','Grandmother Higa','Riku','Thao'],
  things:['the park bench','the raised walk','the banyan tree','a lost umbrella','the drinking fountain'],
  doing:['playing jan-ken-pon','doing homework on the bench','walking the raised path','resting under the banyan tree'],
  activity:{hold:['can','coffee'],chance:.6,sit:.55},
  shot:{at:[12,-23.8],camera:{pos:[8.4,2.6,-23.8],at:[18,1.2,-23.8]}}},
 {id:'garden',name:'the pond in Harbour Park',short:'the park pond',kind:'outdoor',regulars:['Tetsuo'],
  things:['the garden pond','the gravel circuit','the pond bench','the bathhouse roof','the shore walk'],
  doing:['watching the pond','walking the gravel circuit','resting on the pond bench','looking toward the bathhouse'],
  activity:{hold:['coffee'],chance:.3,sit:0},
  shot:{at:HARBOUR_PARK_SEATS[1].stand,camera:{pos:[20.3,2.4,-38],at:[HARBOUR_POND.x,1,HARBOUR_POND.z]}}},
 {id:'coral-bay',name:'Coral Bay on Kitano-jima',short:'Coral Bay',kind:'outdoor',regulars:['Thuan','Johansson','Kai'],
  things:['the beach bar','a rented parasol','the leaning coconut palms','the turquoise shallows','a bottle of Umineko on ice','the Coral Bay notice'],
  doing:['dozing under a rented parasol','paddling in the shallows','queueing at the beach bar','reading on the bench','watching the commuter plane climb away','burying someone’s feet in the sand'],
  activity:{hold:['can','bottle'],chance:.7,sit:.35},
  shot:{at:[133.9,-43],camera:{pos:[140.8,1.6,-37.3],at:[127.2,1,-49.6]},time:780}},

]);
export const feedPlace=id=>FEED_PLACES.find(p=>p.id===id);
/** The places a story can be set in: those with their backdrops photographed. */
export const STORY_PLACES=Object.freeze(FEED_PLACES.filter(p=>p.captured!==false));
