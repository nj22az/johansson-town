/**
 * The resident bible as magazine articles: one feature per person you can meet, written as the
 * island's own monthly would print it in autumn 1997, and illustrated by a photo shoot in the
 * game's photo studio (tools/render-resident-shoot.mjs renders `photos` into
 * assets/images/residents/shoot/). Merged into guide/residents.json by tools/apply-articles.mjs.
 *
 * Photos: pose and expression from src/photo/layout.js, backdrop and film from src/photo/sets.js,
 * `with` another resident in the same frame.
 */
const shot=(pose,expression,backdrop,film,caption,extra={})=>({pose,expression,backdrop,film,caption,...extra});

export const ARTICLES={
 Johansson:{
  headline:'The chief engineer who reads the island like a wiring diagram',
  standfirst:'Johansson keeps the Minato Maru’s machinery running, with a duty cabin aboard and his home with Thuan on Kitano-jima.',
  body:[
   'Johansson is chief engineer of the Minato Maru. His notebooks hold machinery readings, maintenance jobs and the small details that make a reliable crossing: the generators on at ten past six, the shore power at a quarter past ten, and everything in between. Mac Turner, the relief engineer, takes the watch whenever he is ashore; Tetsuo maintains the electrical equipment under contract and is watched near the switchboard like a hawk.',
   'He and Thuan live on Kitano-jima, across the water, and he has a duty cabin aboard for the nights the ship needs him. Lunch is often at Sato Ramen with the harbour’s other regulars. A broken radio still brings him to Chin and Tetsuo’s bench on a quiet afternoon, and an evening meal brings him to Minato, where his sister-in-law keeps his plate warm and tells him he works too late.',
   'He carries a second notebook that is not the ship’s. The harbour has one notebook; everything else, the island included, goes in this one.',
  ],
  quote:'A town is a machine that runs on people remembering each other. You keep the small parts oiled.',
  photos:[shot('Think','thinking','sky','film','Plans for a quay that still has room for the boats.'),shot('Laugh','laugh','sunset','warm','Weekends on Kitano-jima.',{with:'Thuan'})],
 },
 Thuan:{
  headline:'Sakura’s owner knows what you need before you ask',
  standfirst:'From a notebook of supplier names to the island’s best-run shelves: Thuan owns Sakura Shōten outright and runs it one delivery at a time.',
  body:[
   'Thuan came from Vietnam after her two elder sisters, with a notebook and a plan, and wrote every supplier’s name in it the first year. Now the shop, the accounts, the stock and the supply trade from the depot in the Quay Warehouse are hers, and she can tell the harbour cart from the bakery van by the sound of its wheels. The shelves are tea, rice, soap and batteries, but the regulars come for the way she sets a favourite aside before they ask. Since the florist on Rainflower Lane closed, the town’s flowers are hers too: island-grown stems in the buckets by the door, wrapped in brown paper at the till.',
   'Her name is on nearly every line of the staff roster in the back room. At the bottom, in her own hand, she has appointed an assistant manager: the potted palm. In the corner by the delivery door stands a figurine of her, a present from Johansson’s shipmates. She says it is too much. She dusts it every morning.',
   'She is the youngest of three sisters. Nhung, the eldest, is the island doctor and keeps Sakura’s counter on Sunday (the shop shuts on Saturday); Thao, the middle one, runs Minato. Lunch is in the park with both of them. Thuan comes over on the half past eight boat from Kitano-jima, where she lives with Johansson, opens at nine, pulls the shutter down at half past eight in the evening and takes the last boat home at ten. The plans for Sakura’s future are hers, and she will build them at her own pace.',
  ],
  quote:'People think a shop sells things. A shop remembers people.',
  photos:[shot('HandsOnHips','smile','peach','warm','Behind the till: “Oldest stock at the front.”'),shot('Peace','happy','hearts','vivid','Lunch in the park with Thao, who has just woken up.',{with:'Thao'})],
 },
 Thao:{
  headline:'Minato never closes — it just changes who is holding the mop',
  standfirst:'Thao’s izakaya opens at four. The pink telephone, the bottle keep and the karaoke all answer to her.',
  body:[
   'At four o’clock Thao hangs the noren and the evening begins: lanterns, the pink ¥10 telephone by the door, a laserdisc karaoke that takes its time finding the disc. Regulars keep their own bottles on the shelf behind the counter, each with a tag in Thao’s careful hand. Keep one yourself and she will warn you that being a regular is worse for you than it sounds.',
   'The regulars are the town. Mr Fujita comes in once the ship’s shore power is on and not a minute before; Mac has his one beer at half past seven and Officer Mori, passing on the night patrol, counts it. Nhung comes in with her sisters on Thuan’s Minato nights, Ren comes down from the ship for a late bowl, and Chin, her husband of twelve years, has won the last-Friday karaoke contest three times running. The police notice by the door asks drivers not to drink; Mori put it up himself and then sat under it with a beer. He walked home. Thao tells this story more often than Mori would like.',
   'Nobody lives at the bar. After last orders the cushions are stacked, Thao wipes the counter down and mops the floor herself, and walks home to 1 Kitahama, where Chin and their daughter Vy are asleep. She sleeps until late morning, buys for the izakaya at Sakura, has lunch in the park with her sisters and is back at her station to prep. The amber corner by the window is kept for unhurried conversations. She will not turn it into a hurried table, however full the room.',
  ],
  quote:'The spare chair is for whoever arrives last. Somebody always does.',
  photos:[shot('Laugh','laugh','sunset','warm','Last orders, which at Minato is a suggestion.'),shot('Clap','happy','night','vivid','Karaoke night. Chin is already queueing.',{with:'Chin'})],
 },
 'Mrs Sato':{
  headline:'Lunch at Sato Ramen is three hours long and sixty years deep',
  standfirst:'Mrs Sato buys her fish at dawn, feeds the harbour at noon and washes every bowl herself. Her autograph boards tell the rest.',
  body:[
   'Her morning starts at the harbour, choosing fish for the stock while the auction is still shouting. By half past ten she is at the pots in her own kitchen, which she shares with nobody. Lunch runs from eleven to two, and the ticket machine sells your bowl if it is in the mood; when it is not, she takes the money over the counter. Miso ramen with butter and corn is the autumn bowl, ¥500.',
   'On the wall hang three autograph boards: a television presenter who came for the Hārī, the 1996 Seagulls squad, and Kayoko Shima, who sang at the harbour hall, ate two bowls and left a tip folded into a crane. At noon Mrs Sato carries two bowls in the aluminium okamochi to the harbour office, very fast and very level. She delivers to the harbour only. Anywhere else, she says, they can walk.',
   'Officer Mori has the same shoyu ramen at one o’clock every day of the year; she would like him to try the miso once. Nhung, the doctor, is not allowed to pay either; when surgery runs late Mrs Sato sends the bowl over. Jun, the ferry’s cook, says her stock recipe is his, which it is not. In the evenings she and Thao fight for the same crowd, ramen against the izakaya; they fall out, and make up over a delivery. On Wednesdays the shop is shut so she can make the week’s stock. She notices who has eaten and who has only said so.',
  ],
  quote:'Sit down. You can tell me how your morning went after you have eaten.',
  photos:[shot('Bow','smile','cream','warm','Eleven o’clock: the stools come down.'),shot('HandsOnHips','content','peach','film','Wednesday. Stock day. Do not knock.')],
 },
 Nhung:{
  headline:'The island doctor who still marks the funny parts, and prints the paper',
  standfirst:'Morning surgery at nine, house calls in the afternoon, and in the evening the town’s small paper coming off the bench at the back of the old Front-Row shop: Nhung is Minato’s doctor.',
  body:[
   'Surgery is at nine, in the clinic at the town hall, and the town comes in with its blood pressure, its backs and its opinions. Nhung knows that Grandmother Higa will ignore her advice and that Mr Fujita will not rest his back, and writes it all down anyway, in the same pencil she once used for slips in other people’s books. House calls are in the afternoon, in the little car in bay 2 of the Kitahama parking, with the bag. On Saturday the clinic shuts at noon; on Sunday she keeps Sakura’s counter while Thuan stays on Kitano-jima.',
   'The books went to Sakura when she took the clinic, but the paper did not. In the evening she sets it at the printing bench at the back of the old Front-Row shop: the ferry timetable, the tide table, the typhoon map and whatever Officer Mori’s three-page reports contain, which is mostly his lunch. The reading copies stayed on the shelves, with her slips still in them, and Tama the shop cat stayed with them; he has refused, on principle and permanently, to wear the tiny apron she once made him.',
   'The eldest of three sisters, she still checks that Thao has eaten and that Thuan has slept, now with a stethoscope to back her up. Home is 3 Kitahama, with her husband Kōji, who comes in smelling of the auction, and their son Riku, who is not allowed to borrow the stethoscope. Mrs Sato sends a bowl over when surgery runs late and will not take her money.',
  ],
  quote:'Everybody on this island has a cure for something. Some of them even work. I print the ones that don’t.',
  photos:[shot('Think','calm','cream','film','Morning surgery. Next, please.'),shot('Point','happy','cream','warm','“That one. Trust me.”',{with:'Kōji'})],
 },
 Chin:{
  headline:'Chin’s workbench: where repairs become experiments',
  standfirst:'The Minato Maru’s motorman by day, the dock workshop’s repairman between watches. It also wins karaoke contests.',
  body:[
   'Chin signs on aboard the Minato Maru at five past six and tends her diesels, bilges and lubricating oil under the chief until the shore power goes on at night. He took the engine-room rating post when it came free, and he lines up his tools before he touches anything, aboard or ashore. Ask him to mend a radio and it may come back with a better aerial, a louder speaker and a screw left over, which Tetsuo will find and hold up in silence.',
   'He and Tetsuo have shared the workshop since school, and their argument about volume has no closing time. Tetsuo keeps the bench while the ship sails; Chin has it in the evenings and between watches, and the sabani hauled out in the Nishi yard are his to mend now. Johansson stops by on a quiet afternoon; the harbour office’s equipment is in their hands more often than the harbour master admits.',
   'On the last Friday of every month he becomes another person entirely: Minato’s karaoke champion, three titles in a row. The prize is a bottle on Thao’s keep shelf with his name on it. He has not opened any of them. Thao, his wife of twelve years, keeps them dusted, and their daughter Vy keeps count. Jun, the ship’s cook, keeps count of his second helpings.',
  ],
  quote:'A good repair should look like nobody touched it.',
  photos:[shot('Tada','happy','sky','vivid','Fixed. Probably better.'),shot('Cheer','laugh','night','warm','Karaoke champion, third year running.')],
 },
 Tetsuo:{
  headline:'Tetsuo listens to radios the way other people listen to friends',
  standfirst:'The workshop’s electrician treats static as conversation, keeps the ferry’s switchboard honest and the island’s lights on.',
  body:[
   'Tetsuo turns a tuning knob as though the radio might answer back, and on a good day it does. Old valve sets, ship receivers, the counter radio at Minato: he handles them gently, and he will not be rushed. His mother was a Chinen, from the old house on Kitano-jima, and the gentleness is hers.',
   'Chin has repaired Tetsuo’s own radio twice. Tetsuo keeps finding extra screws. Their disagreement about volume began at the workbench when they were at school together, and it has never been settled. After lunch he crosses to the Minato Maru, where he is the ferry’s electrician under contract, and Mac guards the switchboard from him like a hawk. The power house’s switchboard is his too, since it lost its keeper: two diesels, one running, one resting, and the logbook on the clipboard by the door.',
   'At six he goes to Umi-no-yu to tend the boiler and the pumps, and stays to close up. He takes his time over the gauges. Grandmother Higa sends him in past the bandai; he does not complain. A clear broadcast after a difficult repair is, he says, the best sound on the island, though the boiler running sweet comes close. Home is 2 Front-Row Yard, behind the bookshop, with the yard to himself.',
  ],
  quote:'Static is just a station that has not said its name yet.',
  photos:[shot('Think','thinking','cream','sepia','Tuning in to something only he can hear.'),shot('Shrug','grumpy','mint','film','“He left another screw.”',{with:'Chin'})],
 },
 'Officer Mori':{
  headline:'Night patrol with the island’s most thorough policeman',
  standfirst:'Officer Mori keeps the desk at Minato Police Station from four, walks Main Street after dark, writes everything down and still cannot get the cat to respect him.',
  body:[
   'Mori takes the ordinary safety of the streets seriously. The desk at the police station is his from four in the afternoon until ten, with the lost property tagged in his careful handwriting and a thermos of barley tea for anybody who comes in upset. Then the night patrol, slow and exact: Main Street, the seawall, the lanes behind the shops, a stop at Minato to count Mac’s one beer, a look in on an elderly neighbour. He wants the streets to feel safe without feeling watched.',
   'His reports are three pages long and supply Nhung’s town paper with more detail than incident; she wants his stories, and he wants her to print fewer of them. The cat outside Sakura declines to acknowledge his authority, a long-running difficulty he records conscientiously. Lunch is the same shoyu ramen at Sato Ramen at one o’clock, every day of the year.',
   'The drink-driving notice at Minato is his. He put it up himself and then, off duty, sat under it with a beer. He walked home, which is upstairs at the station, where he sleeps until three after the patrol. He would like that to be in the paper too, as an example.',
  ],
  quote:'Nothing happened tonight. I wrote it down so we will know.',
  photos:[shot('Bow','neutral','night','film','Off on patrol at ten.'),shot('Wave','smile','sky','warm','Morning, after the night shift.')],
 },
 'Harbour master':{
  headline:'Jack Reed trusts the tide board more than the radio',
  standfirst:'Cargo, the ferry’s lines, a changing forecast and a lunch delivered by okamochi: a day with the harbour agent everybody calls the harbour master.',
  body:[
   'Jack Reed came to the island as a merchant seaman out of Seattle, paid off here in the seventies and never signed on again. The town calls him the harbour master, and the title stuck to the man rather than the job. He checks the tide board before the radio forecast and his knees before either. The harbour office desk holds the manifests, the freight book and the berth radio, on which Ryo, the ferry’s chief officer, gives him distance off at every call.',
   'When the Minato Maru calls he walks to the bitts himself and takes her lines, bow and stern, the way the old linesman did before he went to the bridge. At noon Mrs Sato arrives with two bowls in her aluminium delivery box. She delivers to the harbour only, which he takes as a professional courtesy and never asks about. They are widow and widower; he eats her ramen every day and never says why.',
   'A working harbour teaches patience with tides and with people. When equipment misbehaves he sends for the dock workshop; when a visitor is lost he points them to the right door. Every crate on the cargo quay gets a line in the freight book, and every line gets his initials. He lives behind the screen at the back of the office, likes watching the morning cargo come in, and likes it more when it arrives on time.',
  ],
  quote:'The sea is always on time. It is the boats you have to wait for.',
  photos:[shot('Point','neutral','sky','film','Next ferry: on the board, and on time.'),shot('Idle','content','cream','sepia','Noon. The okamochi is on its way.')],
 },
 'Miss Higa':{
  headline:'By day the blackboard, by night the bandai',
  standfirst:'Miss Higa teaches the island school until half past three. From five she takes your coins at Umi-no-yu, and she still notices who has not done their homework.',
  body:[
   'The island school is one room and one small mixed class, and Miss Higa teaches all of it. Vy asks the most questions. Riku talks, and is moved to the front row every week. Miss Higa is twenty-nine, marks until five, and then walks down to the bath.',
   'The bandai is a raised seat by the door of Umi-no-yu, the island’s bathhouse. From up there you can see over the counter, which is the point of a bandai. Three hundred yen, swimwear in the bath, please: it is a family bath. In the evenings and at weekends she keeps it, with the marking on her knee and the crossword under the marking.',
   'The bath is her grandmother’s, and so is the opinion that Miss Higa should be married by now. Grandmother Higa says it at breakfast and again over supper. After hours Tetsuo comes to tend the boiler and the pumps. He fixes things; she does the till and pretends not to watch. He takes longer over the pressure gauge than any gauge needs. Neither of them has said a word about it, and the whole of Nishi-machi is waiting.',
  ],
  quote:'Wash first. Then soak. Then tell me why the homework is late.',
  photos:[shot('Think','content','mint','sepia','At the bandai, marking between customers.'),shot('Coy','shy','peach','warm','The boiler is fixed. She was not watching.',{with:'Tetsuo'})],
 },
 'Grandmother Higa':{
  headline:'Grandmother Higa has a seat for you and an opinion about your onions',
  standfirst:'She owns the bath, and she knows the ferry by its whistle. Her old liquor shop on Main Street is Kissa Higa now, coffee and thick toast on weekday mornings; from her verandah in Nishi-machi she keeps an eye on the rest.',
  body:[
   'Sit a moment, she says, and you will. Grandmother Higa offers a seat, an observation about Sakura, and practical advice on preparing a house for typhoon season, in that order. She keeps the bandai at Umi-no-yu by day. Her liquor shop on Main Street shut when the drink went to Sakura, and every bottle on the island, at Minato, Sato Ramen or the master’s crate on the pier, comes from Thuan’s depot now; she has an opinion about that too. But the room was hers, and so were the mornings before the bath opens: from seven on weekdays the shutter is up and it is Kissa Higa, two siphons on spirit lamps, toast cut thick and a boiled egg with the coffee, her husband’s records on the player. Yui has her breakfast at the counter before school. The family kusu is still behind it, and still not for sale.',
   'Her granddaughter teaches the island school and keeps the bandai in the evenings. Grandmother Higa would like her married, and says so. She has noticed that Tetsuo, who keeps her boiler running for a bath and his supper, takes his time over the pumps. She sends him through the front way, past the bandai, on purpose.',
   'Mr Fujita soaks his back whenever the sailings let him and tells her the water is never hot enough. She tells Nhung, the doctor, the same about her advice on her blood pressure. Her husband drove the island bus for thirty years; when the Minato Maru is late she hears it in the whistle, and the master hears about it at the bandai.',
  ],
  quote:'You are the one who talks to the girl at Sakura every day. Good. Somebody should.',
  photos:[shot('Wave','smile','cream','sepia','Sit a moment. The verandah, Nishi-machi.'),shot('Point','thinking','mint','film','That is not a shallot.')],
 },
 'Kōji':{
  headline:'The case for tuna-head soup',
  standfirst:'Kōji is up at half past four for the auction and asleep by noon. In between he sorts the catch, loads the ice, mends his own sabani and would like you to take the tuna head. It is free.',
  body:[
   'By half past four he is on the auction floor sorting the catch. What the buyers leave goes to Mrs Sato for her stock pot or to the freezer, and Kōji has it sorted before most of the street is awake. At nine he moves to the ice plant and loads the boats for the next night. At noon he goes home to sleep.',
   'The sabani on the west quay is his own, and he fishes her alone; Chin does the repairs he cannot. One week in two he is aboard the Minato Maru instead, as bosun on Ms Uezu’s week off, and says the ramp is the only thing on the island heavier than a tuna. Ren, forward, unties every fisherman’s knot he ties.',
   'He is married to Nhung, the island doctor, who says he smells of fish. He says she smells of the clinic. Home is 3 Kitahama with their son Riku, who wants to come out on the boat. He may, Kōji says, when he can swim to the buoy. He likes practical food. He would especially like you to try tuna-head soup.',
  ],
  quote:'You want a tuna head? Free. Great soup.',
  photos:[shot('Peace','happy','sky','vivid','After the auction.'),shot('Laugh','laugh','sunset','warm','Supper at home. Still offering the tuna head.',{with:'Nhung'})],
 },
 Riku:{
  headline:'Which boat is that? Ask Riku.',
  standfirst:'Nine years old, 3 Kitahama, the front row at school every week. After the bell he is on the quay, watching the boats come in.',
  body:[
   'Riku can tell you which sabani is coming round the breakwater before anyone else can see it, and whose it is. His father sorts the catch at the auction and fishes his own boat, and Riku watches from the quay with his satchel on, because he is not allowed out on the water until he can swim to the buoy.',
   'At school he talks, and is moved to the front row every week by Miss Higa. His cousin Vy is in the same class, which is the only reason either of them admits to having the same grandmother. At five there is football on the park lawn, away from the pond and the bathhouse windows.',
   'Supper is at 3 Kitahama with his mother, Nhung, the island doctor, who reads him bedtime stories from the old bookshop’s reading copies, and his father, who offers him the tuna head. He is training for the buoy. It is further than it looks.',
  ],
  quote:'That one is Dad’s. I can tell by the way it sits.',
  photos:[shot('Point','neutral','sky','film','That one is coming in first.'),shot('HandsOnHips','happy','cream','warm','On the quay with Dad, after the auction.',{with:'Kōji'})],
 },
 Vy:{
  headline:'A walk before homework: the rule Vy made and keeps',
  standfirst:'The island school is out at half past three. Vy walks through Harbour Park with a satchel full of kanji, then spreads her homework across a bench.',
  body:[
   'Vy is eleven and in Miss Higa’s class at the island school, where she asks the most questions and would like that noted. After school she walks through Harbour Park; the Blue Coral counter is closed while it waits for a keeper.',
   'Then she spreads her homework across a park bench and does the hard half first, or says she will. When she is thinking she counts the pleats in her skirt. When she is not, she is keeping score for the three sisters’ jan-ken-pon in the park, all of whom claim to be winning.',
   'Home is 1 Kitahama with her parents, Thao and Chin. Her aunt Thuan lives on Kitano-jima and comes over on the boat every day. Vy would like to be a ferry captain, or a translator, or both on alternate days. She has told Mr Fujita so. He has told her the bridge is not for passengers.',
  ],
  quote:'Homework is easier with guava. That is not an opinion, it is research.',
  photos:[shot('Peace','happy','mint','vivid','After school, on the park walk.'),shot('Think','thinking','cream','film','The hard half first. Probably.')],
 },
 Mac:{
  headline:'Mac Turner came with the diesels and stayed',
  standfirst:'The Minato Maru’s relief engineer is an American who arrived with the Caterpillar engines in the seventies, married the island’s weather and never left.',
  body:[
   'Mac Turner is sixty-one and came to the island from Oregon with the Caterpillar diesels, to commission them and go home. He is still here. He is the ferry’s relief engineer: whenever the chief is ashore Mac takes the working watch, and the engine room runs to his standards, which are high and loudly held. He guards his switchboard from Tetsuo, the contract electrician, like a hawk.',
   'He lives in Kitahama Heights A on Fukugi Lane, the north house of the pair, with Ms Ganaha through the party wall, who hears his generator stories whether she wants them or not. He keeps a duty berth aboard in the crew cabin for the nights the ship needs him, and he and Ms Uezu, the bosun, have the ferry’s oldest argument, deck against engine room, every day.',
   'At half past seven he has his one beer at Minato. Officer Mori, passing on the night patrol, counts it. Mac says the timetable runs the engines too hard. The master says the timetable runs everything.',
  ],
  quote:'An engine tells you everything. You just have to be there when it talks.',
  photos:[shot('HandsOnHips','content','cream','sepia','The engine room, his standards.'),shot('Laugh','laugh','night','warm','One beer. Counted.',{with:'Officer Mori'})],
 },
 'Ms Uezu':{
  headline:'A week on, a week off, and the ramp in between',
  standfirst:'Ms Uezu is the Minato Maru’s bosun. Ferry work runs in her family, and the aft lines, the ramp and the car lashings run through her hands.',
  body:[
   'The bosun supervises the deck: the aft mooring lines, the ramp orders from the port wing, the vehicle deck lashed down before every crossing. Ms Uezu is forty-four and ferry work runs in her family; she does a week on, living aboard in the crew cabin, and a week off at 8 Kitahama, with Kōji covering her relief week. She checks Ren’s coils forward and does not pretend otherwise.',
   'With Mac in the engine room she keeps the ferry’s oldest argument going, deck against engine room, every day. With Kai at the Kitano berth it is the after spring, which he says she pays out too fast. With Ryo on the wing it is who counts the cars. She wins most of these.',
   'On her week off she has supper at Sato Ramen at seven and is home by half past eight, and the ship, she says, manages. She says it in a way that suggests it only just manages.',
  ],
  quote:'The ramp does not care whose week it is.',
  photos:[shot('Salute','neutral','sky','film','The aft station, lines ready.'),shot('HandsOnHips','smug','sunset','warm','Deck against engine room. Deck wins.',{with:'Mac'})],
 },
 'Ms Ganaha':{
  headline:'One window: tickets, parcels, the post and the islands',
  standfirst:'From noon to the last boat Ms Ganaha keeps the Port Terminal’s window. She sells the tickets, takes the parcels, answers the ferry desk telephone and knows every island you can ask about.',
  body:[
   'The mailbag comes off the morning boat and by half past nine Ms Ganaha has the parcels on the shelf behind her window and the letters in the pigeonholes. From noon the window is open: tickets for the Minato Maru, letters and parcels handed in by half past four for the evening boat to Naha, and the ferry desk telephone, which she picks up on the fourth ring. She is twenty-seven, and the old post office counter on Main Street is shut because of her.',
   'Everybody going to the islands passes her window, so she is the one who knows: the timetable, the fare, the strait map, what is actually built on Kitano-jima and what is only talked about. Aya, the sailing purser, radios her the passenger count before every departure, and the two counts do not always match. The harbour master gets the sailing list from her every morning and checks it against his clock.',
   'An early lunch at Sato Ramen at a quarter past eleven, before the window opens. Home is Kitahama Heights B on Fukugi Lane, the south house of the pair, with Mac’s generator stories through the party wall.',
  ],
  quote:'Where are you off to, love? The half past two is in, and the parcel shelf is behind me.',
  photos:[shot('Wave','smile','cream','film','The window opens at noon.'),shot('Point','happy','sky','warm','The last boat is alongside. Where are you off to?',{with:'Aya'})],
 },
 'Mr Fujita':{
  headline:'The master of the Minato Maru, sober on watch, and the shed after',
  standfirst:'Mr Fujita has forty years on the island boats and the fourth-grade ticket he sat for at fifty. He cons every berthing himself, and the television and the beer wait until the shore power is on.',
  body:[
   'Fujita is sixty-three, the master of the Minato Maru, and on the bridge from the generators at ten past six to the shore power at a quarter past ten, every day the ship sails. He brings her alongside from the wing himself, with Ms Uezu aft, Ren forward and Jack Reed on the quay to take the lines, and he keeps the log. Ryo, his chief officer, would like the afternoon berthings. Ryo can keep wanting them.',
   'He is sober for the whole of it. At twenty past ten he signs off, walks the pier to his shed and sits down with the first bottle of Umineko; Sakura Trading’s round swaps his crate twice a week, and at six every morning he stands the empties back in it. The set is on, the remote is his, and a variety show gets a laugh out of him every half a minute. After the last station signs off he walks aboard Shiosai, his houseboat at the west pier, and sleeps it off.',
   'He keeps the old seamen’s stories, the sabani race of 1979 included, and tells them to anybody at Minato who sits still. Nhung, his doctor, would like him to rest his back. Grandmother Higa says the bath is hot enough and he says it never is. Vy has told him she will be a ferry captain. He has told her the bridge is not for passengers, and that she should keep asking.',
  ],
  quote:'The ship sails sober. The shed does not have to.',
  photos:[shot('Salute','neutral','sky','film','Ten past six. The generators are on.'),shot('Laugh','laugh','night','warm','Twenty past ten. Signed off.')],
 },
 Ryo:{
  headline:'The chief officer who wants the afternoon berthings',
  standfirst:'Ryo is forty-one, from Itoman, with six years on the Kerama ferries before the Minato Maru. He keeps the lookout, works the ramp and checks the berth from the wing while the master cons.',
  body:[
   'The chief officer keeps the lookout, supervises access and works the ramp controls; at every call Ryo is on the port wing with the berth in view, giving Jack Reed distance off on the radio while the master brings her alongside. He holds a fifth-grade deck licence from his Kerama years and would like to con the afternoon berthings himself. Mr Fujita cons every berthing himself. The matter is open.',
   'He is up in his cabin at twenty to six and signs on at five past, with the log, the weather and the berth. With Ms Uezu, the bosun, the ramp orders go down from the wing and the argument about who counts the cars comes back up. Lunch is in the mess at half past twelve, Jun’s two sittings, and the last log entry is written with the master at twenty past ten.',
   'He lives aboard, in the chief officer’s cabin. Itoman is a telephone call and a ferry away, and most evenings he says he will go next week.',
  ],
  quote:'Distance off, fifty metres. Yes, Captain. Next time, perhaps.',
  photos:[shot('Salute','neutral','sky','film','The port wing, every call.'),shot('Shrug','dry','cream','sepia','The afternoon berthings. One day.',{with:'Mr Fujita'})],
 },
 Ren:{
  headline:'First ship, forward station',
  standfirst:'Ren is twenty-three, from Nago, and the Minato Maru is his first ship. The forward mooring station, the gangway and the passenger-deck rounds are his, and so is the late bowl at Minato.',
  body:[
   'The deck hand works the forward mooring station and the passenger gangway, then makes the rounds of the passenger deck; keeping the post separate leaves the bosun free to work aft. Ren is up in the deckhand’s cabin at twenty to six and at the forward station by six, heaving line ready, and Kai on the Kitano pier catches it most times.',
   'Ms Uezu checks his coils and he lets her. On Kōji’s relief weeks the fisherman ties a knot Ren has never seen, and Ren unties it on principle. Aya counts the last passenger twice and he counts once, and whose count is right is settled on the bridge.',
   'At half past ten, signed off, he walks up to Minato for a late bowl and whatever Thao has left, and is back in his bunk by half past eleven. Nago, he says, has nothing like this. He has not been back to check.',
  ],
  quote:'Heaving line away. Kai, that one was yours.',
  photos:[shot('Wave','happy','sky','vivid','The forward station, line ready.'),shot('FistPump','laugh','night','warm','A late bowl at Minato.',{with:'Thao'})],
 },
 Aya:{
  headline:'The count goes to the bridge before she does',
  standfirst:'Aya is the Minato Maru’s sailing purser, thirty-one, from the Kume line. She counts the passengers, clears the vehicle deck and answers the lobby’s questions, and the count is always right.',
  body:[
   'The purser counts the passengers, checks that every driver has left the vehicle deck and answers questions in the lobby; the passenger count goes to the bridge before departure, every time. Aya came from the Kume line for the short crossings, and says a short crossing has more questions in it than a long one.',
   'Before each departure she radios the count to Ms Ganaha at the terminal window, and the two counts do not always agree, which the two of them discuss in a tone the lobby can hear. Ren counts the last passenger once; she counts twice. In the lobby Jun’s kiosk sells cup noodles from the hot-water dispenser, and she has opinions about the dispenser.',
   'She is up in the crew cabin at ten to six, at the purser’s window at ten past, and writes up the day’s takings and the passenger book at twenty past ten. Kume is three islands away. She says she does not miss it, and keeps its timetable in her drawer.',
  ],
  quote:'Fourteen. I counted twice. The bridge has it.',
  photos:[shot('Point','focus','cream','film','The count, before departure.'),shot('Laugh','happy','mint','warm','The two counts, discussed.',{with:'Ms Ganaha'})],
 },
 Jun:{
  headline:'Lunch for eight, two sittings, and the master’s tea',
  standfirst:'Jun is fifty-two, after twenty years in the galleys of the cargo boats out of Naha. He cooks the crew’s meals on the three-plate range, runs the kiosk and secures the galley for every crossing.',
  body:[
   'The cook-steward prepares the crew’s meals on the three-plate range and attends to the kiosk, and before every departure the galley equipment and the loose stores are secured for the crossing. Jun is up before the generators, at five, and has the crew’s breakfast on by twenty past. Lunch for eight is two sittings at eleven, and Chin’s second helping is counted.',
   'Twenty years in the galleys of the cargo boats out of Naha taught him that a galley is a small country with its own laws. Mrs Sato’s stock recipe, he says, is his. She says it is not. Mr Fujita’s tea goes up to the bridge at every call, and Aya’s cup noodles come down from the kiosk.',
   'At three there is a smoke on the open deck between sailings. At half past nine the galley is wiped down and the kiosk counted, and at twenty to eleven he is in his bunk in the crew cabin. He has not cooked ashore in twenty years and sees no reason to start.',
  ],
  quote:'Two sittings. Second helpings are a privilege, not a right.',
  photos:[shot('HandsOnHips','content','cream','sepia','The three-plate range, lunch for eight.'),shot('Scold','grumpy','peach','warm','Whose stock it is.',{with:'Mrs Sato'})],
 },
 Kai:{
  headline:'The shore eyes at the Kitano berth',
  standfirst:'Kai is the line hand at Kitano-jima’s pier, forty-seven, and lives across the lane in the Shiroma house. Every call of the Minato Maru ends in his hands.',
  body:[
   'At the Kitano berth there is one man on the pier when the Minato Maru comes in, and it is Kai. He stands by from twenty past six, catches Ren’s heaving line, takes the bow and stern lines on the bitts and, with Ms Uezu aft, argues about the after spring, which he says she pays out too fast. He is the shore eyes for every call, and the ship does not move without his wave.',
   'He rents the Shiroma house across the lane from the pier, from the Shiromas in Naha, who left it when the children went to the mainland. It is a concrete house with a bed, a table and a door, twenty-five metres from the bitts, and he is home for lunch between calls. Across the lane again is Johansson and Thuan’s house, so Thuan is his neighbour on the island and the shop’s owner on the other side of the water.',
   'He wears a straw hat on the pier because the sun on the water is the sun twice over, and goes home when the crew sign off. The pier, he says, is a better front garden than most.',
  ],
  quote:'Heaving line! Got it. Now we are talking.',
  photos:[shot('Wave','happy','sunset','warm','The bitts, the hat, the boat coming in.'),shot('Point','dry','sky','film','The after spring. Too fast.',{with:'Ms Uezu'})],
 },
};

/**
 * The people who had a feature and have retired (people/roster.js RETIRED; phase 4 of
 * docs/CAST-CONSOLIDATION.md, and Dr Kakazu, who retired into Nhung on 22 October 2026). Kept as history, as the monthly printed them: nothing applies them
 * to the guide (tools/apply-articles.mjs reads ARTICLES only), so no story summons them.
 */
export const RETIRED_ARTICLES={
 'Mrs Nakamura':{
  headline:'Zenzai since 1972, and the shaving machine still sounds like a tractor',
  standfirst:'Mrs Nakamura has the beans on at six, the ice-cream counter open at three and the community kitchen’s andagi in the fryer whenever the town needs feeding.',
  body:[
   'Kintoki beans, cooked since six. The ice comes from the plant on the quay, and the old shaving machine roars like a tractor; she trusts its work completely. There has been zenzai on this corner since 1972, and she has no plans to stop. Thuan comes on Sundays, orders the small one and eats half of hers.',
   'At three she crosses to Blue Coral and opens the ice-cream counter for the school crowd. Her daughter Mai arrives at half past with Vy, her best friend, and the pink guava scoop is already set aside. Mrs Nakamura is bringing Mai up on her own, upstairs over the shop, and does it the way she does everything, early and without fuss.',
   'She also runs the community kitchen. When there is a festival, a funeral or a typhoon, the andagi come from her fryer, by the hundred. Minato sends its guests across the park for a zenzai after supper, and the street lamp outside the east row, which has flickered since the rain, is on her list for the town hall.',
  ],
  quote:'Zenzai is not fast food. Sit down.',
  photos:[shot('Bow','smile','polka','vivid','Welcome! Zenzai?'),shot('Laugh','laugh','peach','warm','Half past three: two ice creams, one of them guava.',{with:'Mai'})],
 },
 Mai:{
  headline:'The keeper of the class rabbit',
  standfirst:'Mai is ten, lives above the zenzai shop, and takes Vy’s side in everything. The rabbit, she says, is the best-behaved pupil in the school, and the rabbit agrees.',
  body:[
   'Mai keeps the class rabbit, which means she arrives at school before the bell to feed it and leaves after the bell to say goodbye to it. Miss Higa says the rabbit is the best-behaved pupil in the room. Mai has never argued with that.',
   'At half past three she and Vy, her best friend, are at her mother’s Blue Coral counter, where the pink guava scoop is already Vy’s and Mai has whatever is left. Then homework on a park bench, the hard half first. Riku, in the same class, says Mai always takes Vy’s side. Mai says that is because Vy is always right.',
   'Home is upstairs over Nakamura Zenzai with her mother, who has the beans on at six. On a hot Sunday she walks to Kitahama in her sundress to see Vy, and on festival nights she is in the community kitchen with a tray of andagi, pretending not to eat them.',
  ],
  quote:'The rabbit does its homework. I checked.',
  photos:[shot('Heart','happy','hearts','vivid','After school, at her mother’s counter.'),shot('Peace','laugh','mint','warm','Homework. The hard half first.',{with:'Vy'})],
 },

 'Dr Kakazu':{
  headline:'The doctor who is not allowed to pay for lunch',
  standfirst:'Dr Kakazu came from Naha for a two-year posting at the town hall clinic. He has learned that on this island the patients feed the doctor.',
  body:[
   'Morning surgery is at nine, in the clinic at the town hall, and the town comes in with its blood pressure, its backs and its opinions. Dr Kakazu is thirty-four, posted from Naha for two years, and already knows that Grandmother Higa will ignore his advice and Mr Fujita will not rest his back. He writes it all down anyway.',
   'Lunch is at Sato Ramen at half past twelve. Mrs Sato will not let him pay, and has not let him pay since his first week. House calls are in the afternoon, on foot, with the bag. Supper is at Minato, where Thao keeps him a stool and the evening crowd asks him things they would not ask at the clinic.',
   'He lives in the doctor’s flat behind the clinic and is on call at night; after dark he and Officer Mori are the two telephones that still answer. He has decided, privately, that two years will not be long enough.',
  ],
  quote:'Everybody on this island has a cure for something. Some of them even work.',
  photos:[shot('Think','calm','cream','film','Morning surgery. Next, please.'),shot('Shrug','happy','peach','warm','Lunch, again not paid for.',{with:'Mrs Sato'})],
 },
 Barfly:{
  headline:'The regular who lives at the end of the counter',
  standfirst:'He has a stool, a tab and a broom. We asked the Barfly how a man ends up working off his drinks one sweep at a time.',
  body:[
   'Nobody at Minato uses his name; the Barfly prefers it that way. He sits on the stool at the kitchen end of the counter, the one with the best view of the lanterns, and he knows when a hook is loose before anyone looks up. Last buses come and go without disturbing the arrangement.',
   'When Minato shuts at three he stacks the cushions. From four until ten he sleeps on that same stool, and somebody always puts a jacket over him. Then he works off his tab: sweeping until noon, washing and polishing the glasses until two, mopping, and wiping the tables down for the evening while Thao preps.',
   'He says the tab is nearly paid. Thao says the same thing, in a different tone. Both of them seem quite happy with the arrangement, which has outlasted several menus and one karaoke machine.',
  ],
  quote:'A bar is only as clean as its most loyal customer.',
  photos:[shot('Idle','sleep','night','mono','Four in the morning, asleep on his feet. Somebody will find him a jacket.'),shot('Shrug','content','cream','sepia','On the tab: “Nearly paid.”')],
 },
 Reiko:{
  headline:'The editor whose best source never has anything to report',
  standfirst:'Reiko prints the evening paper from a desk in the bookshop. Officer Mori supplies the news, when there is some.',
  body:[
   'Reiko taps her pencil twice before she asks the real question. The evening paper is set at a desk at the back of Front-Row Books, where the press shares the room with Nhung’s poetry and the smell of ink stays in the shelves.',
   'Officer Mori writes beautiful incident reports. Unfortunately, nothing ever happens. He once gave her three pages in reply to a request for a statement; she printed the part about his lunch. They remain good friends, mostly because he keeps reading the paper.',
   'She wants to print a town paper people keep rather than throw away. The ferry timetable, the tide table and the typhoon map are her most clipped pages, and she is quietly proud of every one of them.',
  ],
  quote:'Nothing happened today is also news. It just needs a better headline.',
  photos:[shot('Point','thinking','cream','mono','Deadline in an hour.'),shot('Laugh','laugh','polka','vivid','The incident report, page three: lunch.',{with:'Officer Mori'})],
 },
 'Bus driver':{
  headline:'The bus driver who became the master of the Minato Maru',
  standfirst:'He drove the Harbour Line bus for twelve years, until the line became a ferry. The town still calls him the bus driver, and he still keeps the old timetable.',
  body:[
   'When the Harbour Line became the ferry he did not want to give up the route. He sat his deck licence on the cargo boats out of Naha, came home as her mate, and has been master of the Minato Maru since 1994. He is aboard by a quarter past seven and ashore after the last call.',
   'He brings her alongside from the port wing, where he can see the pier, with Ms Uezu forward on the bow line and Mr Fujita on the quay to take it. Mr Nakandakari, the relief engineer, says he runs her engines too hard. He says the timetable runs them. Ms Ganaha at the ticket window has to explain any late departure, and makes sure he hears about it.',
   'He still notices who is carrying groceries, who has missed lunch and who just wants a little company on the crossing, and he knows the regulars by the way they wave from the quay. At seven he takes the day’s log to the harbour master, an old friend, and they read it over the harbour clock.',
   'Grandmother Higa’s husband drove the island bus for thirty years. She can still tell the ferry is late by its whistle. He considers that the highest standard in his profession, and keeps time accordingly.',
  ],
  quote:'People tell a bus driver how their story begins. On a ferry you have twenty minutes to hear how it ends.',
  photos:[shot('Wave','smile','sunset','warm','The last crossing of the day.'),shot('Bow','happy','cream','film','Mind the step. Mind the ramp.')],
 },
 'Grandmother Chinen':{
  headline:"A ground-floor home, and a son within walking distance",
  standfirst:"Tetsuo’s mother keeps a ground-access home at 5 Kitahama, close enough for her son to visit on foot.",
  body:[
   "Grandmother Chinen remembers the red-tile house on Kitano-jima, but her home is now 5 Kitahama in Minato. Its level entrance and clear walking route matter more than a grand address.",
   "She sweeps by her gate in the morning, tends her plants and keeps a pot ready for Tetsuo. He can visit from his workshop without waiting for a boat, and still eats like he is fifteen.",
   "Thuan brings day-old bread from Sakura. Johansson is the ferry’s chief engineer; he and Thuan keep their shared home across the water. Chinen has opinions about his hours, but no longer watches for him at the end of the tropical lane."
],
  quote:'Three tiles in forty years. The house knows what it is doing.',
  photos:[shot('Wave','happy','garden','warm','At her gate, for the breeze.'),shot('Laugh','content','sky','film','A pot on for her son, who eats like he is still fifteen.',{with:'Tetsuo'})],
 },
 'Mr Ōshiro':{
  headline:'A sabani from 1968 and the man who will not sell it',
  standfirst:'Mr Ōshiro built his boat from Yakushima cedar. He still scrapes and tars her by hand, and he still goes out before the auction.',
  body:[
   'The cedar came from Yakushima before you could not get it any more. He built her in 1968 and will tell you, if you ask, the difference between a repair and a replacement. Most mornings he takes her out with Kōji, his crewman, and they are in before the auction calls. In the afternoons Kōji comes back to the yard to help with the tar.',
   'Kōji recommends fibreglass. He has recommended it every season. Mr Ōshiro sees no reason to replace something that has carried him this far, and says so while Kōji bails.',
   'Fourth place in the 1979 sabani race remains, in his view, a perfectly respectable subject for conversation. Mr Fujita, who also raced that year, brings it up whenever they meet, and never mentions where he came himself.',
   'His yard on the water is a place to stand and watch patient hands. Mr Higa Jr served his time here on sabani and outboards before he went to the ferry, and still comes back to borrow a clamp.',
  ],
  quote:'You do not own a boat like this. You look after her for the next one.',
  photos:[shot('Crouch','content','sky','film','Scraping the hull, as every spring.'),shot('HandsOnHips','happy','sunset','warm','Back before the auction, with his crew.',{with:'Kōji'})],
 },
 'Mrs Kinjō':{
  headline:'Rainflower Florist wraps every bouquet in brown paper',
  standfirst:'Mrs Kinjō sells island-grown stems from half past eight, dresses the town for every festival, and keeps a careful eye on her neighbour’s doorway.',
  body:[
   'Buckets of fresh stems, leafy pots and hand-made wreaths fill the open front of the flower shop on Rainflower Lane. The morning stems come in at half past eight; by the afternoon she is out on deliveries. Thuan comes after closing, and the bouquets for Sakura’s counter are chosen with care on both sides.',
   'She is the town’s decorator as well as its florist. The bunting at the harbour, the paper lanterns at Minato and the flowers on Thao’s counter all come from her back room. Thao says the lanterns cost more than the sake. Mrs Kinjō says that is because the lanterns last.',
   'She shares the walkway with Mrs Nakamura’s zenzai counter. They eat lunch at each other’s counters and argue about whose customers block whose doorway, usually in the same conversation. On Sundays she takes tea with Grandmother Sakurai, an old friend, and they agree about almost everything except Grandmother Higa.',
   'She wraps everything in plain brown paper, because the flowers should be the bright part.',
  ],
  quote:'The flowers are the bright part. Everything else should get out of their way. Including that queue.',
  photos:[shot('Heart','happy','hearts','vivid','Fresh stems, Rainflower Lane.'),shot('Coy','smile','peach','warm','A bouquet for Sakura’s counter.',{with:'Thuan'})],
 },
 'Mr Shimabukuro':{
  headline:'Two diesels, one running, one resting: the man who keeps the lights on',
  standfirst:'Mr Shimabukuro minds the power house. Every light on the island comes through his engine room.',
  body:[
   'Hear that? Two diesels, one running, one resting. Mr Shimabukuro listens to the generators the way a doctor listens to a chest, and he hears a fault before the meters show it.',
   'The second set is to be overhauled before typhoon season; the town assembly minutes say so, and so does he, at length.',
   'Postman Tōma brings his parcels to the power house door. They are usually spare parts. Tetsuo comes over when the switchboard needs a second pair of hands, and they talk about the island’s load as other men talk about the weather.',
   'On Sunday mornings he fishes off the seawall with Chin at dawn. Who caught the bigger one is a question that has run for years.',
  ],
  quote:'You only notice electricity when it stops. I would like you never to notice it.',
  photos:[shot('Think','thinking','cream','mono','Listening to the engines.'),shot('Point','neutral','sky','film','One running, one resting.')],
 },
 'Postman Tōma':{
  headline:'Two collections a day, and the postbox is never wrong',
  standfirst:'Postman Tōma walks his round at 10:30 and 16:30, and meets the evening boat for the mailbag. He does not read postcards. The pictures are very nice.',
  body:[
   'The plate on the postbox says 10:30 and 16:30, and Tōma trusts it even on the days he doubts himself. Letters for the Ōshiros, a parcel for Mr Shimabukuro at the power station, a postcard for Sakura from somebody in Hanoi.',
   'Letters give him a different map of the island, made of names and remembered doorways. Shopkeepers give him news between parcels, and Reiko gets most of it back by teatime. Officer Mori has asked him, more than once, not to lean his bicycle on the koban’s line.',
   'At five he takes the evening mailbag at the Port Terminal. Ms Ganaha sells the tickets there. He lingers at her window longer than any mailbag needs; she is busy, and says so, and has not yet asked him to leave.',
   'He does not read postcards. He will admit that some of the pictures are very nice.',
  ],
  quote:'The post box is never wrong. I am sometimes wrong.',
  photos:[shot('Wave','happy','sky','film','On his round.'),shot('Coy','shy','peach','warm','The evening mailbag, and a long wait at the ticket window.',{with:'Ms Ganaha'})],
 },
};
