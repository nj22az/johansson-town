import {rng} from './kit.js';
import {blockWall,coralWall} from './houses.js';
import {poster} from './signs.js';

/**
 * What stands where houses stood (docs/MINATO-HOMES-PLAN.md: "where empty houses were removed, the street plan
 * closes up around them: no vacant lawn or paving lots left where buildings stood").
 *
 * On an Okinawan street nobody leaves ground idle. Each cleared lot is given to somebody who already lives here and
 * has a use for it, and the reason is written beside it, so a story can send someone there and a test can check the
 * lot is what it says. `rect` is the lot; `walls` names what stands on each side ('block', 'coral' or null where it
 * is open); `gates` are the openings, in world coordinates along that side. The old house's centre is kept clear of
 * anything solid (tests/housing-consolidation.test.mjs: no house stands there).
 *
 * The Yonamine shop-house on Main Street is the lot here. The lots that wait for their dressing are CLEARED_LOTS below.
 */
export const lotRect=(minX,maxX,minZ,maxZ)=>Object.freeze({minX,maxX,minZ,maxZ});
const rect=lotRect;
export const STREET_LOTS=Object.freeze([
 Object.freeze({
  id:'higa-crate-yard',formerly:'yonamine',use:'crate-yard',name:'Higa Liquor’s crate yard',
  rect:rect(-15.9,-8.25,9.35,15.25),walls:Object.freeze({north:'block',south:'block',east:'block',west:'block'}),gates:Object.freeze({east:Object.freeze([[10.8,13.2]])}),
  owner:'Grandmother Higa (her old liquor shop across Main Street is Kissa Higa in the mornings)',users:'Sakura Trading, which rents it since Higa Liquor closed (22 October 2026)',
  why:'The drink trade is Sakura Trading’s now, and its depot on the quay has no room for empties. The round’s empties come back in crates and wait here, stacked, for the brewery’s boat, as they did for the Higas.',
  hours:'The round’s empties stacked at half past eleven on Tuesdays and Fridays (commerce/trade-round.js).',
  stories:['children counting bottles','the clink at half past eleven on a round day','a crate tower after a festival'],
 }),
]);
export const streetLot=id=>STREET_LOTS.find(l=>l.id===id);

/**
 * The lots that were cleared, and what each is now. Phase 4 of docs/CAST-CONSOLIDATION.md cleared the retired residents'
 * houses (brief §8, addendum 3 and 5), and the housing project of 18 October 2026 cleared five Kitahama plots before it.
 * The owner deferred their dressing to the final layout (addendum 2: "the dressing (gardens, 月極 parking, bike sheds,
 * hedges) follows on the final layout"), and this is it: each lot is given to people who already live round it and have a
 * use for it, and that is written beside it (`dressing`), so a story can send somebody there and a test can check that
 * the lot is what it says, that every solid on it has its collider, and that no walking circuit, lane, door approach or
 * opening is in its way (tests/lot-dressing.test.mjs). No house stands on any of them, and no door, light or prompt of
 * the old house is left (tests/housing-consolidation.test.mjs).
 *
 * `ground` is what the lot's ground was when it was cleared: Kitahama's level grass (neighbourhood-ground.js), the
 * quarter's coral sand (quarters.js buildNishiGround), the Front-Row yard's lawn (west-yard.js), the lawn east of Main
 * Street, or Kitano-jima's own ground and plantings (tropical-island.js). The dressing keeps to it: the beds, hedges and
 * cane stand in the grass, the gravel is laid only where cars stand, and the coral sand stays sand.
 *
 * A dressing's `props` are its solids, in world metres, each with what it is and why it stands there; the builder
 * (lot-dressing.js) draws them inside their rectangles and gives each the collider `lot-<id>` of exactly that rectangle
 * and height (the drinks machines carry the quarter's own `vending` collider). `flat` are the surfaces laid on the ground
 * (gravel, paint, a concrete pad: walkable, no collider). `prompts` are what a player can read or look at there, in
 * English; the signs on the lot are in Japanese (`signs`, with what they say).
 *
 * Density and period: the owner's standing reference for what stands where in a small Japanese town is New Yokosuka
 * (docs/research/new-yokosuka.md: its back lanes, 月極 parking, hedges, gardens and harbour yards; study and measure,
 * never copy). Its rooms and streets could not be opened from the cloud session that dressed these lots (the game data
 * is on the project's hosted bucket), so the measures here are the town's own: the bays are a kei truck's 2.6 m with a
 * wheel stop at 5 m, as the police station's bay; a bed is a person's reach across (1.2 m) with a 1–1.4 m path; a hedge
 * is 0.6 m deep and a metre high, inside the lot so the lane's gutter stays. Check them against New Yokosuka's
 * Sakuragaoka and Yamanose lots on the creator's computer.
 */
const R=(minX,maxX,minZ,maxZ)=>Object.freeze({minX,maxX,minZ,maxZ});
const prop=(id,what,r,height,why,extra={})=>Object.freeze({id,what,rect:r,height,why,...extra});
const flat=(id,what,r,why,extra={})=>Object.freeze({id,what,rect:r,why,...extra});
const dress=d=>Object.freeze({...d,props:Object.freeze(d.props||[]),flat:Object.freeze(d.flat||[]),prompts:Object.freeze(d.prompts||[]),
 signs:Object.freeze(d.signs||[]),stories:Object.freeze(d.stories||[])});
/** A lot dressed as part of a larger one (4 and 5 Kitahama are the north block's). */
const partOf=(block,part)=>dress({status:'part',partOf:block,what:part});

/**
 * The north block behind the cross lane, where 4 and 5 Kitahama stood: the lane's vegetable garden on the west, next to
 * 3 Kitahama and across the lane from 1, and the quarter's monthly parking on the east, beside the approach, the one
 * way a car comes into Kitahama, so nothing drives further in than it must. Between them and the spine, the parking's
 * hedge and a gōyā curtain.
 */
const NORTH_BLOCK=dress({
 status:'dressed',name:'The lane garden and Kitahama monthly parking',use:Object.freeze(['vegetable-garden','monthly-parking']),
 for:'1, 2 and 3 Kitahama (the garden); Kōji, Nhung and Mac (the parking); the Kitahama residents’ association, which lets both',
 why:'Kitahama’s houses are walled plots with a pedestrian gate and no drive, and their yards are full (1 Kitahama’s hinpun and herb pots, Mrs Sato’s stock pot on the back step, Kōji’s fish boxes), so the lane wanted ground to grow on and somewhere to leave a car off the 3 m lanes. Cars come up the approach from the beach, so the bays are at its end; the garden is where the households are.',
 ground:'grass, as every Kitahama lot; crushed coral under the three bays; concrete under Johansson Mart and its forecourt',
 hours:'The garden is busiest from six to eight in the morning and after five, out of the sun. The cars hardly move: everything on Minato is a walk away.',
 stories:Object.freeze(['the first gōyā of the summer, and whose turn it is','Mac under his bonnet on his week ashore, Chin and Tetsu leaning on the wing','Nhung’s car going out at night for a house call','crows and the negi','Thao teaching Riku the Vietnamese names of the herbs','the bay to let']),
 props:[
  prop('herb-bed','Thao’s herb bed: lemongrass, rau răm and perilla',R(18.4,23.4,62.8,64.0),1.3,'1 Kitahama is across the lane; the herbs her family cooks with are not sold on the island'),
  prop('negi-bed','Mrs Sato’s spring onions',R(24.6,27.8,62.8,64.0),.8,'for her own kitchen at 2 Kitahama; she likes to pull them the minute she needs them (shortened on 27 October 2026, when the parking moved west for Johansson Mart)'),
  prop('greens-bed','Nhung’s island greens: handama and island lettuce',R(18.4,23.4,65.4,66.6),.6,'3 Kitahama is next door, and Nhung cooks for three'),
  prop('sunflower-bed','Riku’s sunflowers',R(24.6,27.8,65.4,66.6),2.15,'his own bed, planted for the school’s growing project; the tallest is measured against the shed'),
  prop('wheelbarrow','the garden’s wheelbarrow',R(22.3,23.6,68.3,68.9),.7,'for the compost and the red earth'),
  prop('papaya-1','a papaya',R(18.75,19.25,70.25,70.75),3.2,'at the garden’s back corner, out of the way of the beds'),
  prop('papaya-2','a papaya',R(20.55,21.05,70.45,70.95),3.2,'its fruit is picked green for salad'),
  prop('standpipe','the standpipe and the hose reel',R(25.2,26.4,69.9,70.9),.95,'the water: the beds are watered at dawn'),
  prop('garden-shed','the garden’s steel shed (物置)',R(27.4,29.6,69.7,71.0),1.95,'hoes, sickles, seed tins and the gōyā nets for the winter'),
  prop('goya-curtain','the gōyā curtain over its bed',R(29.8,35.4,69.55,70.55),2.35,'shared by the lane; it screens the bays from the spine'),
  prop('parking-hedge','the parking’s hibiscus hedge',R(28.0,35.4,67.7,68.3),1.0,'between the cars and the garden'),
  prop('parking-sign','the monthly parking sign (月極駐車場) on its posts',R(31.05,32.35,67.22,67.38),1.9,'at the back of the bays, read from the lane'),
  prop('bay-1-truck','Kōji’s white kei truck, reversed into bay 1',R(28.5,30.1,63.6,67.05),1.99,'for the outboard, the ice chests and the nets when the boat comes out of the water',{owner:'Kōji',bay:1}),
  prop('bay-2-car','Nhung’s little kei car, in bay 2',R(30.95,32.45,63.55,67.0),1.82,'for house calls to Kitahama and the far end of the island; the clinic has no bay of its own',{owner:'Nhung',bay:2}),
  prop('bay-3-hatchback','Mac’s old yellow hatchback, its bonnet up, in bay 3',R(33.23,34.97,63.15,67.1),1.86,'an engineer keeps an old engine running for the pleasure of it: the bonnet is up more often than the car is driven',{owner:'Mac',bay:3}),
  prop('mac-toolbox','Mac’s red toolbox, on the gravel by his front wheel',R(35.04,35.24,63.25,63.67),.3,'the spanners for the job in hand, in reach of the open bonnet and inside his own bay, off the lane',{owner:'Mac',bay:3}),
 ],
 flat:[
  flat('parking-gravel','crushed coral under the three bays, the white lines and the wheel stops',R(27.9,35.45,62.2,67.55),'cars on grass rut it in the rains'),
  flat('shop-apron','Johansson Mart’s concrete: its floor slab and the forecourt in front, where the machines, the bins and the A-board stand',R(35.5,42.0,62.0,70.3),'a shop stands on concrete, and the forecourt is swept every evening (okinawa/kitahama-shop.js)'),
 ],
 signs:[{name:'Kitahama monthly parking sign',says:'月極駐車場 · 空きなし · 契約車以外駐車禁止 · 北浜自治会',english:'Monthly parking. No bays free. Contract holders only. Kitahama residents’ association.'}],
 prompts:['Look at the lane garden','Read the monthly parking sign','Look under Mac’s bonnet'],
});

/** 9 Kitahama, between 8 and 1 on the footpath that is Main Street's line through the quarter. */
const LOT_9=dress({
 status:'dressed',name:'The footpath bicycle shed and the hoop',use:Object.freeze(['bicycle-shed','play']),
 for:'1 Kitahama (Thao, Chin and Vy), Riku and Mrs Sato (the shed); Vy and Riku, and Mai when she comes up (the hoop)',
 why:'The footpath is the way into town, so the bicycles live beside it: 1 Kitahama’s red-tile yard is all hinpun, herbs and step and has no room for three bicycles, Mrs Sato cannot lift hers over the gate step, and Riku’s stays here because his mother’s fills their own yard. The hoop is between Vy’s house and Riku’s, across the lane from both, and away from the pocket park’s swing (its sign asks for ball games before six).',
 ground:'grass; a concrete pad under the hoop',
 hours:'The bicycles go out at a quarter to eight and come back from five. The hoop is busy after school until the light goes or somebody is called in for supper.',
 stories:Object.freeze(['Vy against Riku, first to ten','the ball in the garden across the lane','Mac shows them a hook shot','Mrs Sato’s bicycle bell']),
 props:[
  prop('bicycle-shed','the bicycle shed: a tin roof on posts, five bicycles under it',R(7.3,9.5,49.2,55.2),2.25,'open to the footpath; Thao’s, Chin’s, Vy’s, Riku’s and Mrs Sato’s bicycles'),
  prop('hoop','the basketball hoop on its post, the ball at its foot',R(12.3,12.85,48.45,48.95),3.4,'at the south end of the pad, the backboard facing the cross lane'),
 ],
 flat:[flat('hoop-pad','a concrete pad with the key painted on it',R(10.2,14.8,48.4,56.6),'a ball bounces on concrete, not on grass')],
 prompts:['Look at the bicycle shed','Shoot a basket'],
});

/** 7 Kitahama, across the north lane from the pocket park and the notice board. */
const LOT_7=dress({
 status:'dressed',name:'The youth association’s store and the eisa ground',use:Object.freeze(['association-store','practice-ground']),
 for:'the Kitahama residents’ association and its youth association: the eisa drummers and dancers; the elders who watch',
 why:'The youth association’s Eisa (the poster at Sakura) needs its drums kept dry and a level piece of ground to practise on in the evenings before Obon; the association needs a store for the cane knives and the festival tent. Across the lane from the pocket park and its notice board, where the lane already meets.',
 ground:'grass round a square of crushed coral, swept for the dancing',
 hours:'Practice is from seven on summer evenings in the weeks before Obon; the store is opened for the cane cut in January and the festival.',
 stories:Object.freeze(['eisa practice and the drum you can hear from the harbour','Gran Higa supervises, loudly','the tent that will not go up','the cane knives come out in January']),
 props:[
  prop('association-store','the association’s store: two steel sheds side by side',R(-18.4,-14.4,55.1,56.5),2.1,'the eisa drums, the festival tent and the cane knives; doors open onto the practice ground'),
  prop('watching-bench','a bench for the elders who watch',R(-12.25,-11.75,50.5,52.1),.85,'on the ground’s east edge, facing the dancers'),
 ],
 flat:[flat('practice-ground','crushed coral, swept',R(-18.6,-11.4,48.4,56.6),'the drummers’ feet and the dancers’ want level ground, not grass')],
 signs:[{name:'Kitahama youth association store sign',says:'北浜自治会 · 青年会 倉庫 · エイサー用具',english:'Kitahama residents’ association. Youth association store. Eisa things.'}],
 prompts:['Look at the eisa practice ground','Read the store sign'],
});

/** 6 Kitahama, across the north lane from Kitahama Heights. */
const LOT_6=dress({
 status:'dressed',name:'Mac’s garden',use:Object.freeze(['garden','barbecue']),
 for:'Mac at Kitahama Heights A, and Mika next door at B, who is asked to everything',
 why:'The Heights’ two houses have a strip of garden each, not room for a table, and Mac is an American who grills. He took the lot across the lane for a table, a kettle grill and his tomatoes and chillies, behind a hibiscus hedge with its gap facing the Heights.',
 ground:'grass, behind the hedge',
 hours:'The grill is lit on his week ashore, Sunday about four; the tomatoes are watered morning and evening by whoever is home.',
 stories:Object.freeze(['Mac’s ribs on Sunday and who turns up','the chilli that was too hot','Fuji’s beer, only after he signs off','Mika minding the tomatoes while Mac is aboard']),
 props:[
  prop('hedge-south-west','the hibiscus hedge on the lane',R(-31.6,-28.6,48.4,49.0),1.0,'along the north lane, with its gap facing the Heights'),
  prop('hedge-south-east','the hibiscus hedge on the lane',R(-27.4,-24.4,48.4,49.0),1.0,'along the north lane'),
  prop('hedge-east','the hibiscus hedge on Fukugi Lane',R(-25.0,-24.4,49.0,56.6),1.0,'along Fukugi Lane'),
  prop('picnic-table','a picnic table and its benches',R(-30.6,-28.6,51.15,53.25),.8,'for six, at a squeeze'),
  prop('kettle-grill','Mac’s kettle grill',R(-26.95,-26.25,51.25,51.95),1.0,'downwind of the table, with the sea wind'),
  prop('tomato-bed','tomatoes on canes and island chillies',R(-31.4,-26.4,55.0,56.2),1.5,'at the back, in the sun'),
 ],
 prompts:['Look at Mac’s barbecue'],
});

/** 10, 11 and 12 Kitahama, the north row west of the footpath: one block of cane, the association's. */
const caneLot=(n,r,extra={})=>dress({
 status:'dressed',name:'The association’s cane',use:Object.freeze(['sugar-cane']),
 for:'the Kitahama residents’ association: everybody on the lane cuts it',
 why:'Sugar cane is the island’s crop, and the north row west of the footpath went back to it when its three houses came down: the cane cut on the notice board (“Mon 12 January, 7:00. Everybody on the lane. Lunch at Sato Ramen.”) is this cane, the cane lorry takes it round the spine, and what it fetches pays for the eisa. The talk of a habu in the cane is about this cane too.',
 ground:'red earth in ridges, the cane in rows across it',
 hours:'Nobody goes in from planting to the cut; it is cut in January.',
 stories:Object.freeze(['the January cut and lunch at Sato Ramen','a habu, or somebody says so','the cane lorry on the spine','children chewing a stick of cane']),
 props:[prop('cane-'+n,'sugar cane in rows',r,2.8,'solid to walk into: cane is planted close and stands higher than a man')],
 ...extra,
});
const LOT_10=caneLot(10,R(-31.6,-24.4,62.5,70.5));
const LOT_11=caneLot(11,R(-18.6,-11.4,62.5,70.5),{prompts:['Look at the cane']});
const LOT_12=caneLot(12,R(-5.6,1.6,62.5,70.5),{
 props:[prop('cane-12','sugar cane in rows',R(-5.6,1.6,62.5,70.5),2.8,'solid to walk into: cane is planted close and stands higher than a man'),
  prop('habu-sign','the habu sign at the corner by the footpath',R(1.72,1.88,62.22,62.38),1.4,'where the children pass on the footpath')],
 signs:[{name:'Habu warning sign',says:'ハブに注意 · 畑に入らないでください',english:'Beware of habu. Please keep out of the field.'}],
 prompts:['Read the habu sign'],
});

/** The Kinjō lot on the seawall walk, across the lane from the Higa house. */
const KINJO=dress({
 status:'dressed',name:'Gran Higa’s garden',use:Object.freeze(['vegetable-garden']),
 for:'Gran Higa (Grandmother Higa), across the lane at the Higa house; Yui carries the water jar in the typhoon season',
 why:'An obaa of 78 with a garden over the lane is the oldest thing on an Okinawan street. Gran Higa keeps Umi-no-yu by day, so she works it from six until the bath opens: gōyā on an A-frame, handama and island greens, a papaya, and a big water jar, inside a low coral wall against the salt wind off the walk. The bed of chrysanthemums along the north wall was Mrs Kinjō’s, and Gran Higa keeps it for the family altar.',
 ground:'the quarter’s coral sand, with beds of red earth in it',
 hours:'From six to half past eight in the morning, and a look round after supper.',
 stories:Object.freeze(['Mrs Kinjō’s chrysanthemums','gōyā for the whole street','Gran Higa and the crows','the water jar before a typhoon']),
 props:[
  prop('wall-west','the garden’s coral wall on the seawall walk',R(-34.7,-34.1,-10.6,-.8),1.1,'the salt wind off the sea'),
  prop('wall-north','the coral wall on the lane to 2 Front-Row Yard',R(-34.7,-27.0,-.8,-.2),1.1,'the garden’s north side'),
  prop('wall-east','the coral wall on the yard side',R(-27.6,-27.0,-10.6,-.8),1.1,'the garden’s east side'),
  prop('wall-south-west','the coral wall on the Higa house’s lane',R(-34.7,-31.5,-11.2,-10.6),1.1,'west of the gate'),
  prop('wall-south-east','the coral wall on the Higa house’s lane',R(-30.3,-27.0,-11.2,-10.6),1.1,'east of the gate, which faces the Higa gate across the lane'),
  prop('goya-frame','gōyā on an A-frame over its bed',R(-34.0,-32.0,-10.45,-6.45),2.15,'against the west wall, out of the wind'),
  prop('handama-bed','handama, purple under green',R(-34.0,-32.0,-5.6,-3.0),.5,'the island’s own spinach'),
  prop('chrysanthemum-bed','Mrs Kinjō’s chrysanthemums',R(-34.0,-32.0,-2.4,-1.0),.65,'for the family altar and the tombs at Shīmī'),
  prop('greens-bed','island greens and chillies',R(-29.9,-27.8,-8.8,-4.4),.55,'east of the path, in the morning sun'),
  prop('water-jar','the big water jar (kame) with its lid and ladle',R(-29.5,-28.7,-10.4,-9.6),.85,'filled from the hose, so the water is warm for the beds'),
  prop('papaya','a papaya',R(-28.65,-28.15,-1.85,-1.35),3.2,'in the corner, out of the beds’ light'),
  prop('stool','her low stool',R(-29.6,-29.2,-3.6,-3.2),.35,'for weeding, by the greens'),
 ],
 prompts:['Look over Gran Higa’s garden wall'],
});

/** The Ōshiro lot on the seawall walk, between the lane to 2 Front-Row Yard and the utaki's. */
const OSHIRO=dress({
 status:'dressed',name:'Kōji’s net ground',use:Object.freeze(['net-drying']),
 for:'Kōji, who fishes his own sabani since Mr Ōshiro retired, and Chin, who mends the boats and the nets with him',
 why:'Mr Ōshiro dried his nets on the seawall walk in the sea wind, a step from the boats on the west quay, and the ground went to the man who took on his fishing. Two rails of nets in the wind, a heap waiting to be mended, the mending stool and the fish boxes, on the quarter’s own coral sand.',
 ground:'the quarter’s coral sand',
 hours:'The nets go up in the morning after a night out and come down before dark; mending in the afternoons.',
 stories:Object.freeze(['mending the hole the coral made','the cat and the fish boxes','what Mr Ōshiro would have said','a float lost and found']),
 props:[
  prop('net-rail-west','a rail of nets drying, on five posts',R(-33.3,-32.7,4.5,12.7),2.0,'along the shore, so the wind goes through the mesh'),
  prop('net-rail-east','a rail of nets drying, on five posts',R(-30.3,-29.7,4.5,12.7),2.0,'a second, for the long net'),
  prop('net-heap','a heap of net waiting to be mended, and the mending stool',R(-29.4,-27.4,4.6,7.0),.7,'by the lane, where Chin stops on his way to the workshop'),
  prop('fish-boxes','the fish boxes, stacked',R(-28.95,-28.0,11.35,12.1),1.0,'out of the way of the rails'),
 ],
 prompts:['Look at Kōji’s nets drying'],
});

/** Where 1 Front-Row Yard stood, south of the path from the lane gap to Tetsu's door. */
const YARD_1=dress({
 status:'dressed',name:'Tetsu’s store',use:Object.freeze(['store','yard']),
 for:'Tetsu at 2 Front-Row Yard, and Chin, his workshop partner, on summer evenings',
 why:'Tetsu’s is a one-room staff house, and the island’s electrician has ladders, cable drums and the spare lamps for the lane lights (the Kitahama notice board: “Tetsuo will check the lane lights”). A steel shed for them, and an empty cable drum for a table with two crates for chairs, south of his path and clear of the passage beside Minato.',
 ground:'the yard’s lawn',
 hours:'The shed is opened at half past seven on a working day; the table is used after dark.',
 stories:Object.freeze(['a summer evening at the cable drum','the lamp that is always the wrong size','borrowing a ladder']),
 props:[
  prop('store-shed','Tetsu’s steel shed (物置)',R(-23.9,-22.1,-2.6,-1.7),1.9,'ladders, cable drums, the spare lamps; its doors face his path'),
  prop('cable-drum','an empty cable drum for a table',R(-21.0,-20.0,-2.0,-1.0),.6,'the workshop’s, finished with'),
  prop('crate-east','a crate to sit on',R(-19.6,-19.2,-1.7,-1.3),.35,'a chair'),
  prop('crate-west','a crate to sit on',R(-21.75,-21.35,-1.7,-1.3),.35,'a chair'),
 ],
 prompts:['Look at Tetsu’s store'],
});

/** The post-office shop-house's lot on Main Street, between Nakamura's and Kitano Road. */
const POST_OFFICE=dress({
 status:'dressed',name:'The drinks corner',use:Object.freeze(['vending-corner']),
 for:'everybody on Main Street, and the bathers coming down Kitano Road from Umi-no-yu',
 why:'A cold drink after the bath is the oldest habit in Japan, and the old lane up to the sea bath had a drinks machine until Kitano Road took its place. Minato Drinks rents the corner from the town, as it rents Sakura’s wall: two machines on a concrete pad facing the footway, backed by a block screen wall the bottler built along the park edge, the can bin beside them and a bench against the same wall.',
 ground:'the park’s lawn, with a concrete pad at the footway',
 hours:'The machines are lit all night; Minato Drinks fills them from its van in the morning.',
 stories:Object.freeze(['the coin under the machine','coffee milk after the bath','the can bin on a windy night','a bench to wait for a friend']),
 props:[
  prop('machine-1','a drinks machine, facing the footway',R(7.32,8.22,-6.095,-5.005),2.2,'Minato Drinks’',{builtBy:'vending',at:[7.85,-5.55]}),
  prop('machine-2','a drinks machine, facing the footway',R(7.32,8.22,-4.995,-3.905),2.2,'Minato Drinks’',{builtBy:'vending',at:[7.85,-4.45]}),
  prop('can-bin','the can bin (空き缶入れ)',R(7.75,8.25,-3.6,-3.1),.9,'beside the machines, as the law asks'),
  prop('bench','a bench facing the street',R(7.65,8.15,-2.75,-1.85),.5,'out of the footway, beside the machines'),
  prop('screen-wall','the block screen wall behind the corner, its coping painted white',R(8.25,8.45,-6.3,-1.75),1.4,
   'machines stand with their backs to a wall (the owner, 20 October 2026): Minato Drinks built this one along the pad\'s park edge, so the machines, the bin and the bench back onto it, their cords run behind it out of the rain, and a ball from the park does not end up under a machine'),
 ],
 flat:[flat('pad','a concrete pad from the footway',R(5.15,8.7,-6.4,-1.75),'the machines need a level slab and the footway runs into it',{meets:'the Main Street footway: across the 0.5 m apron strip every standing shop on the East Row has paved (quarters.js buildEastRow)'})],
 prompts:['Buy a drink','Sit at the drinks corner'],
});

/** The Rainflower pavilion's lot, on the lawn east of Main Street in front of the school gate. */
const RAINFLOWER=dress({
 status:'open by design',name:'The lawn before the school gate',use:Object.freeze(['open-lawn']),
 for:'the school children and whoever crosses the lawn from Main Street to the school gate',
 why:'The pavilion stood on the open lawn east of Main Street, six metres in front of the school gate, not on a lot between buildings. With it gone the lawn is whole again, the straight way from the street to the gate (phase 4, tests/neighbourhood-access.test.mjs: the lawn where it stood is open ground). Anything put on it would stand in the children’s way; the flowers it sold are Sakura’s.',
 ground:'the lawn',
 hours:'Crossed at a run at twenty past eight.',
 stories:Object.freeze(['late for school','a game of tag on the way home']),
});

/** The Chinen house's plot on Kitano-jima, east of the Shiroma house. */
const KITANO_3=dress({
 status:'open by design',name:'The island’s ground',use:Object.freeze(['island-ground']),
 for:'Kitano-jima',
 why:'The owner’s ruling (addendum 5): the Chinen house is removed and the island’s own ground and plantings take the plot back; his standing rule is that the tropical island’s terrain and facilities are kept, not rebuilt by housing work on Minato. Nobody lives near enough to use it: Nils and Thuan are on the ship and at Sakura all day, and Kai is on the pier between calls.',
 ground:'the island’s ground and plantings (island frame)',
});

const cleared=(id,formerly,district,r,ground,cleared,why,dressing)=>Object.freeze({id,formerly,district,rect:r,ground,cleared,why,dressing});
const PHASE_4='2026-10-19, phase 4 of docs/CAST-CONSOLIDATION.md',HOUSING='2026-10-18, the housing project (docs/MINATO-HOMES-IMPLEMENTATION.md)';
export const CLEARED_LOTS=Object.freeze([
 cleared('kitahama-4-lot','kitahama-4','Kitahama',rect(20,28,62,71),'grass',PHASE_4,'the postman’s house: the post is Ms Ganaha’s counter at the terminal, and the round went with him',partOf('kitahama-north-block','the lane garden')),
 cleared('kitahama-5-lot','kitahama-5','Kitahama',rect(33,41,62,71),'grass',PHASE_4,'Grandmother Chinen’s house: she retired with only her family history kept, as Tetsuo’s mother',partOf('kitahama-north-block','Johansson Mart (the owner, 27 October 2026), with the monthly parking’s east end, its hedge and the gōyā curtain beside it')),
 cleared('kitahama-6-lot','kitahama-6','Kitahama',rect(-32,-24,48,57),'grass',PHASE_4,'the former master’s house: Fuji is the master and keeps Shiosai, not this house too',LOT_6),
 cleared('kitahama-north-block','kitahama-4 and kitahama-5 with the ends of the middle and field lanes','Kitahama',rect(16,42,62,72),'grass',PHASE_4,'with 4 and 5 gone nothing stood on either side of the two side lanes north of the cross lane, so they end at it (kitahama-layout.js) and the ground from 3 Kitahama’s east wall to the approach is one block behind the cross lane',NORTH_BLOCK),
 cleared('kitahama-7-lot','kitahama-7','Kitahama',rect(-19,-11,48,57),'grass',HOUSING,'an empty house the housing project removed',LOT_7),
 cleared('kitahama-9-lot','kitahama-9','Kitahama',rect(7,15,48,57),'grass',HOUSING,'an empty house the housing project removed',LOT_9),
 cleared('kitahama-10-lot','kitahama-10','Kitahama',rect(-32,-24,62,71),'grass',HOUSING,'an empty house the housing project removed',LOT_10),
 cleared('kitahama-11-lot','kitahama-11','Kitahama',rect(-19,-11,62,71),'grass',HOUSING,'an empty house the housing project removed',LOT_11),
 cleared('kitahama-12-lot','kitahama-12','Kitahama',rect(-6,2,62,71),'grass',HOUSING,'an empty house the housing project removed',LOT_12),
 cleared('kinjo-lot','kinjo','Nishi-machi',rect(-34.7,-27,-11.2,-.2),'coral sand',PHASE_4,'Mrs Kinjō’s house: the flowers are Sakura’s; the lane at z −13 stays as the Higa house’s side',KINJO),
 cleared('oshiro-lot','oshiro','Nishi-machi',rect(-34.7,-27,3.3,14.2),'coral sand',PHASE_4,'Mr Ōshiro’s house: Kōji fishes on his own and Chin mends the boats; the lanes at z 1.5 (to 2 Front-Row Yard) and 16 (the utaki) stay',OSHIRO),
 cleared('front-row-yard-1','resident-home-aya','Front-Row Yard',rect(-24.15,-18.45,-2.85,.45),'lawn',PHASE_4,'1 Front-Row Yard: Nhung had moved home to 3 Kitahama and Reiko retired; the path from the lane gap to Tetsuo’s door runs past it',YARD_1),
 cleared('post-office-lot','shimabukuro','Main Street, the East Row',rect(5.7,13.4,-6.6,-1.6),'lawn',PHASE_4,'the post-office shop-house: its counter is the terminal’s and its tenant retired; the park’s lawn meets Main Street between Nakamura’s and Kitano Road',POST_OFFICE),
 cleared('rainflower-lot','rainflower-florist','the lawn east of Main Street',rect(19,23,15.4,18.6),'lawn',PHASE_4,'the Rainflower pavilion: the flowers are sold at Sakura’s door (addendum 3)',RAINFLOWER),
 cleared('kitano-3-lot','kitano-3','Kitano hamlet',rect(-33,-23,38,48),'the island’s ground and plantings (island frame)',PHASE_4,'the Chinen house on Kitano-jima (addendum 5): Grandmother Chinen retired; the island takes the plot back',KITANO_3),
]);
export const clearedLot=id=>CLEARED_LOTS.find(l=>l.id===id||l.formerly===id);
/** The Kitahama lots the dressing planned on the final layout (addendum 2). */
export const KITAHAMA_CLEARED=Object.freeze(CLEARED_LOTS.filter(l=>l.district==='Kitahama'));
/** Every solid a lot's dressing puts down, with its lot: what the colliders and the clearance tests read. */
export const LOT_PROPS=Object.freeze(CLEARED_LOTS.flatMap(l=>l.dressing.props.map(p=>Object.freeze({...p,lot:l.id,collider:p.builtBy||'lot-'+p.id}))));
/**
 * The retained Kitahama plots' planting (addendum 2: hedges round plots 1, 2, 3, 8 and the Heights): what is on or over
 * their walls, kept to the walls' own footprints so no gate, nameplate or gutter changes. 8 Kitahama's nameplate says a
 * neighbour waters the bougainvillea while Nao is on the ferry: this is it, spilling over her front wall either side of
 * the gate. The Heights' hedge is Mac's, round lot 6 across the lane.
 */
export const PLOT_PLANTING=Object.freeze([
 Object.freeze({plot:'kitahama-8',what:'bougainvillea over the front wall',wall:'north',at:Object.freeze([-5.15,-4.05,.75,1.5]),why:'its nameplate: “A neighbour waters the bougainvillea”'}),
]);

export const LOT_COLOURS=Object.freeze({earth:0x9a5f40,earthDry:0xb07a52,coral:0xd9cdb0,concrete:0xb9b4a8,steel:0x9aa0a4,galv:0xa9b1b3,
 timber:0x8a6a45,timberDark:0x5d4431,leaf:0x4f7d3e,leafDark:0x3c6a35,net:0x2f5a4a,roof:0x8c9ea3});
/** A level patch of ground: crushed coral, earth or concrete, 3 cm thick, its top 45 mm up (25 mm over the grass). */
export function lotGround(kit,r,hex,finish='matte'){kit.block(r.minX,r.maxX,.015,.045,r.minZ,r.maxZ,hex,finish);}
/** The walls a lot names, with their gates. Open sides are left to the gutter. */
export function lotWalls(kit,solid,lot,{height=.9}={}){
 const {minX,maxX,minZ,maxZ}=lot.rect,g=side=>lot.gates?.[side]||[];
 const make=(type,x0,z0,x1,z1,gaps,seed)=>type==='coral'?coralWall(kit,x0,z0,x1,z1,{height,gaps,seed}):blockWall(kit,x0,z0,x1,z1,{height,gaps});
 const w=lot.walls;
 if(w.north)solid(make(w.north,minX,maxZ,maxX,maxZ,g('north'),301));
 if(w.south)solid(make(w.south,minX,minZ,maxX,minZ,g('south'),302));
 if(w.west)solid(make(w.west,minX,minZ,minX,maxZ,g('west'),303));
 if(w.east)solid(make(w.east,maxX,minZ,maxX,maxZ,g('east'),304));
}
export const lotRead=(anchor,onAction,x,z,label,lot,extra='')=>anchor(x,1.1,z,label,()=>onAction?.('read',lot.name,[lot.why,lot.hours,extra].filter(Boolean).join('\n\n')));

/** Builds the lots into the quarter's kit (one draw call per finish and cell). */
export function buildStreetLots(kit,solid,{anchor,onAction}){
 crateYard(kit,solid,streetLot('higa-crate-yard'),{anchor,onAction});
}

/* Higa Liquor's yard: crates of empties on pallets under a roof, the hand truck, the painted name on the wall. */
function crateYard(kit,solid,lot,{anchor,onAction}){
 const R=lot.rect;
 // (Its concrete is the ground's: ground-plan-quarters.js lays it inside the walls.)
 lotWalls(kit,solid,lot);
 const rx0=R.minX+.3,rx1=R.minX+5,rz0=R.maxZ-2.1,rz1=R.maxZ-.25;
 for(const x of [rx0+.1,(rx0+rx1)/2,rx1-.1]){kit.box(.08,2.2,.08,x,1.1,rz0+.05,LOT_COLOURS.steel);solid(kit.rect(x-.07,x+.07,rz0,rz0+.12,2.2,'crate-roof-post'));}
 kit.box(rx1-rx0+.3,.04,rz1-rz0+.4,(rx0+rx1)/2,2.28,(rz0+rz1)/2,LOT_COLOURS.roof,{rx:.1,finish:'metal'});
 const r=rng(371),crate=[0xd8b13c,0xc8432f,0x7a4a2a,0xd8b13c];
 for(let i=0;i<6;i++){
  const x=rx0+.45+i*.75,n=2+Math.floor(r.next()*4);
  kit.box(.7,.1,1.3,x,.1,(rz0+rz1)/2,LOT_COLOURS.timber);
  for(let k=0;k<n;k++)for(const dz of [-.3,.3]){const c=r.pick(crate),y=.15+k*.3;kit.box(.44,.28,.58,x,y+.14,(rz0+rz1)/2+dz,c);for(let b=0;b<3;b++)kit.cyl(.035,.035,.1,x-.13+b*.13,y+.3,(rz0+rz1)/2+dz,0x6a4a24,{segments:5});}
 }
 solid(kit.rect(rx0,rx1,rz0+.15,rz1,1.6,'crate-stacks'));
 // The hand truck by the gate, and a crate set out for children to sit on.
 const hx=R.maxX-1.1,hz=lot.gates.east[0][1]+.5;
 kit.rod([hx,.05,hz],[hx-.15,1.2,hz],.02,0xc8432f);kit.rod([hx+.4,.05,hz],[hx+.25,1.2,hz],.02,0xc8432f);kit.box(.5,.03,.3,hx+.2,.05,hz+.15,0x9aa0a4,{finish:'metal'});
 for(const dx of [0,.4])kit.cyl(.1,.1,.06,hx+dx,.1,hz-.08,0x222326,{segments:10,rz:Math.PI/2});
 kit.box(.44,.28,.58,hx+.2,.33,hz+.15,0xd8b13c);
 solid(kit.rect(hx-.2,hx+.6,hz-.25,hz+.5,1.2,'hand-truck'));
 kit.sign(poster({title:'Higa empty-bottle yard',lines:['HIGA LIQUOR','EMPTIES','STAFF ONLY'],bg:'#f2ede0',band:'#8a3b2e'}),.6,.8,R.maxX+.14,1.25,lot.gates.east[0][0]-.9,{ry:Math.PI/2,name:'crate yard sign'});
 const at=kit.point(R.maxX+.9,0,(lot.gates.east[0][0]+lot.gates.east[0][1])/2);lotRead(anchor,onAction,at.x,at.z,'Look into Higa Liquor’s crate yard',lot);
}

