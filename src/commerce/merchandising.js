import {PRODUCTS} from './products-data.js';
/**
 * Why every line in Sakura Shōten is on the floor, who it is for, and why it stands where it
 * does. Nothing in the shop is random: Thuan stocks for the people who actually come in, and
 * lays the floor out the way a 1997 konbini does (docs/SAKURA-SHOP-PLAN.md): the drinks at the
 * back as the magnet, fresh food in the open chiller, one category to a gondola, children's
 * sweets low, the heavy and the everyday nearest the till, impulse at the counter.
 *
 *   zone     where it lives: drinks (the cold cabinet), fresh (the open chiller), pantry,
 *            sweets and daily (the three gondolas), counter (the steamer by the till)
 *   for      the residents who buy it, by name
 *   why      what they want it for
 *   placed   why it stands where it does
 *
 * Tests hold this to the real shelves (sakura-layout.js) and the real cast; the storyteller
 * can use it to know who would plausibly be holding what, and where.
 */
export const ZONES=Object.freeze({
 drinks:'The cold cabinet on the back wall. Drinks are the shop’s magnet: everyone walks the length of the floor to reach them and passes everything else on the way.',
 fresh:'The open chiller on the west wall. Made today, gone tomorrow; open decks so a lunch can be taken without opening a door.',
 pantry:'The west gondola, beside the chiller: the cupboard at home, for people who cook.',
 sweets:'The middle gondola, on the door’s own line, so it is the first aisle you look down: crisps at a grown-up’s eye, children’s sweets low.',
 daily:'The east gondola, nearest the till: what runs out at home, heavy things low, small dear things where Thuan can see them.',
 counter:'On the counter by the register: hot, quick, and bought on impulse while paying.',
});

/**
 * Each line's reason to be on the floor, from data/studio/products.json (`purpose` there: Johansson Studio edits it,
 * and its checks hold every line to a real resident, a reason and a place). In the order Thuan walks the floor: the
 * cold cabinet (tea and water nearest the door side, beer nearest the till), the open chiller, the pantry, the sweets,
 * the daily goods nearest the till, and the counter.
 */
export const MERCHANDISING=Object.freeze(Object.fromEntries(PRODUCTS.map(p=>[p.id,{zone:p.purpose.zone,for:[...p.purpose.for],why:p.purpose.why,placed:p.purpose.placed}])));
/** Which shelf fittings each zone is (sakura-layout.js SAKURA_SHELVES): the test reads them. */
export const ZONE_OF_SHELF=Object.freeze({fridge:'drinks',chiller:'fresh',west:'pantry',middle:'sweets',east:'daily',steamer:'counter'});
/** Who in town would buy this line. */
export const buyersOf=id=>MERCHANDISING[id]?.for||[];
/** What a resident would plausibly pick up in Sakura. */
export const linesFor=name=>Object.entries(MERCHANDISING).filter(([,m])=>m.for.includes(name)).map(([id])=>id);

/**
 * Who supplies whom. One wholesaler keeps the town's businesses going:
 *
 *   sakura        Sakura Shōten, Thuan's outright (docs/CAST-CONSOLIDATION.md §3), from its depot in the Quay
 *                 Warehouse (Sakura Trading): the everyday goods — drinks, food, washing, paper goods, batteries —
 *                 and, since Mrs Kinjō retired (§6, addendum 3), the town's flowers and decorations: the season's
 *                 window dressing, festival trimmings, lanterns and wreaths, for the shops, the bar, the bath, the
 *                 school and the town hall. Those are `decor` lines on an account, named goods rather than shelf
 *                 stock: they come in with the depot's deliveries, not off the gondolas. Since 22 October 2026
 *                 (the owner) also the stationery and office supplies Front-Row sold, when Nhung became the island
 *                 doctor: paper, ledgers, pens and envelopes for the town's offices, the school and the police box,
 *                 `stationery` lines on an account, named goods like the decorations. And since Higa Liquor closed
 *                 (the owner, 22 October 2026; commerce/higa-liquor.js), all the alcohol: Sakura sells it over its
 *                 own counter (commerce/konbini.js SAKURA_BOTTLES) and the depot supplies Minato's bottle keep and
 *                 tap, Sato Ramen's bottles, the Coral Bay Bar's ice boxes on Kitano-jima and Mr Fujita's crates,
 *                 `alcohol` lines on those accounts, carried by Sakura Trading's round, Kōji's on his weeks ashore
 *                 (commerce/trade-round.js TRADE_ROUND).
 *
 * Only places that are open trade (src/people/cast.js PLACES): the Fumoto co-op has closed, so Sakura no longer sends
 * it a Wednesday crate; the Rainflower pavilion sells nothing and supplies nobody, and Higa Liquor stands shut.
 *
 * An account is what one business orders from one supplier: owner (who places the order, or
 * contact when it is a post rather than anyone in the cast),
 * lines (what), why (what it is for) and delivery (when and how it arrives). Lines are
 * SHOP_STOCK ids; Sakura's decorations, stationery and alcohol are named goods in their own lists.
 */
export const SUPPLIERS=Object.freeze({
 sakura:{name:'Sakura Shōten (Sakura Trading)',owner:'Thuan',depot:'warehouse',goods:'Everyday goods: drinks, food, washing, paper goods, batteries; the town’s flowers and decorations; its stationery and office supplies; and all its beer, awamori, sake and shōchū.',
  decor:['seasonal window decorations','Tanabata bamboo and paper strips','New Year kadomatsu and shimenawa','paper lanterns and festival bunting','wreaths and table flowers','bouquets, from the buckets by the door'],
  stationery:['A4 copy paper by the ream','account ledgers and receipt books','ballpoint pens by the box','envelopes, long and square','cellophane tape and glue','exercise books and pencils'],
  alcohol:['Umineko lager, crates and kegs','awamori, from the 180 ml bottles to the clay kame','sake for warming','shōchū for the mixes']},
});

export const ACCOUNTS=Object.freeze({
 sakura:{
  izakaya:{name:'Minato Izakaya',owner:'Thao',lines:['soy','water','orange','tissues','detergent','battery'],decor:['paper lanterns','a vase of flowers for the counter'],
   alcohol:['Umineko lager, kegs and bottles','awamori for the bottle keep','sake for warming','shōchū for the mixes'],
   why:'Soy for the grill, water for chasers, mandarin juice for the shōchū mixes, table tissues, cloth washing, and batteries for the karaoke microphone. Fresh lanterns when the old ones fade, and one stem on the counter that Thao pretends not to care about. Everything behind the bar too, since the Higas closed: the tap, the keep shelf, the tokkuri and the highballs.',
   delivery:'Two crates on the trolley at three, before the noren goes up; Thao signs for it. Flowers on Mondays; lanterns when the typhoon has had the last ones. The kegs on Tuesdays and Fridays at a quarter to eleven, rolled down the side passage: Sakura Trading’s round, Kōji’s, or Thao’s own truck from the depot in his weeks at sea.'},
  ramen:{name:'Sato Ramen',owner:'Mrs Sato',lines:['soy','tea','detergent'],alcohol:['Umineko lager, large bottles'],
   why:'Soy to top up the tare, tea for the counter, and powder for the towels; and a bottle with the gyōza, for the lunch crowd who are not going back to work.',
   delivery:'At half past ten, while the stock comes up to the boil; the beer with the round on Tuesdays and Fridays, one crate left at the back door.'},
  onsen:{name:'Umi-no-yu',owner:'Miss Higa',lines:['milk','soda','soap','detergent'],decor:['seasonal flowers for the bandai'],
   why:'Bottled milk and ramune for the fridge by the bandai — the after-bath drink — soap for the washing stools, and powder for the towels. A small vase on the bandai, changed with the season, the first thing a bather sees.',
   delivery:'Mornings before the bath opens; the milk crate is the heaviest thing Thuan carries all week. The flowers every other Friday.'},
  frontrow:{name:'the town’s paper, at the old Front-Row shop',owner:'Nhung',lines:['tea','biscuit','battery'],
   why:'Tea and biscuits for the evenings at the back bench, batteries for the press-room radio.',
   delivery:'Thursdays, left inside the door for the evening, when the paper is set.'},
  form3d:{name:'Chin & Tetsuo Repairs',owner:'Chin',lines:['battery','coffee','rice'],
   why:'Batteries by the box for testing radios, canned coffee for the bench, and a lunch order of rice balls.',
   delivery:'Lunch at noon on the bicycle; batteries when Tetsuo remembers to ask.'},
  office:{name:'Johansson Harbour Office',owner:'Johansson',lines:['battery','coffee','tea','water'],stationery:['log books for tides and freight','A4 copy paper','carbon receipt books'],
   why:'Batteries for the quay lamps, and drinks for the crews. The harbour’s records too: tide tables, freight manifests and receipts for the ferry.',
   delivery:'With the first ferry, on the harbour cart; the paper and the log books with it.'},
  koban:{name:'Minato Police Station',owner:'Officer Mori',lines:['water','rice','battery'],stationery:['the incident book','ballpoint pens'],
   why:'Water and a rice ball for the night patrol, batteries for the torch; the incident book has to be the right kind, and pens disappear from a police station.',
   delivery:'Officer Mori collects it himself, at closing, and calls it a patrol.'},
  'coral-bay-bar':{name:'the Coral Bay Bar on Kitano-jima',contact:'the beach bar keeper',lines:['orange','water'],alcohol:['Umineko lager, bottles on ice'],
   why:'Mandarin and shikuwasa juice for the children and the drivers, water for anyone who fell asleep under a parasol, and cold beer for the day-trippers on Coral Bay, the reason half the morning ferry carries towels.',
   delivery:'The juice and the water every day on the morning car ferry, in the Sakura Trading crate on Thuan’s cart. The beer in ice boxes on Tuesdays and Fridays, left by the round at the Port Terminal’s freight counter for the 14:45 boat; the empties come back on the evening sailing.'},
  // Mr Fujita's standing order (world/fujita-day.js): the Higas' six o'clock van until their shop closed. The round
  // swaps the crate by his chair, a full one for the empties, twice a week: a crate of twenty is about half a week's.
  'fujita-shed':{name:'Mr Fujita’s shed on the pier',contact:'Mr Fujita',lines:[],alcohol:['Umineko lager, large bottles'],
   why:'Three to six large bottles an evening, three small glasses a bottle, poured from the armchair in front of the television once he has signed off; a crate of twenty is about half a week’s.',
   delivery:'With the round on Tuesdays and Fridays: a full crate carried out along the pier to his chair and the crate of empties taken back; at six every morning, signing on, he stands last night’s empties back in the crate at his right hand. Returnable bottles, counted by Thuan.'},
  // The Community Hall's account, the community kitchen's, took on the mayor's office's when the office went
  // (21 October 2026, briefs/town-hall-zone.md phase M): the tea and crackers for the register's visitors, and the
  // wreaths and bunting for the town's ceremonies, which the hall holds now.
  'community-kitchen':{name:'the Community Hall',contact:'the Community Hall register',kitchenClosed:true,lines:['tea','crackers','tissues'],decor:['ceremony wreaths','festival bunting'],stationery:['A4 copy paper','envelopes','account ledgers','cellophane tape'],
   why:'The family-run kitchen programme is closed pending staffing; tea, rice crackers and tissues remain for whoever comes to the register or the assembly. Wreaths and bunting for openings, prize days and the town\u2019s festivals. Paper, envelopes and ledgers for the register, the minutes, the town accounts and the notice board.',
   delivery:'Paper and refreshments for the register when required; the wreaths the morning of each ceremony. No kitchen food order while the programme is closed.'},
  school:{name:'the island school',contact:'the head teacher',lines:['milk','tissues'],decor:['sports day bunting','graduation flowers'],stationery:['exercise books','pencils','glue'],
   why:'School milk, and tissues every hay-fever season. Bunting for sports day in the autumn and flowers for the graduation in March. A new term’s exercise books, and the glue that is always running out.',
   delivery:'First thing on Mondays, by the school gate; the bunting and the flowers the day before, with the children helping to carry.'},
  // Kissa Higa, Grandmother Higa's morning coffee shop in the old liquor shop (commerce/kissa-higa.js KISSA_SUPPLY,
  // 30 October 2026): Sakura's milk bread and milk, and the beans and eggs Sakura Trading buys in for her (named goods,
  // not shelf lines: Sakura sells neither).
  'kissa-higa':{name:'Kissa Higa',owner:'Grandmother Higa',lines:['bread','milk'],goods:['coffee beans, roasted in Naha, a kilo a week','eggs, a tray a week','butter, a block a week'],
   why:'A loaf of milk bread a morning for the toast, cut thick, and milk for the coffee; the beans come over from a Naha roaster with Sakura’s order, the eggs for the morning set’s boiled egg and the butter for the toast.',
   delivery:'Sakura is shut before nine, so she takes the next morning’s loaf and milk at the till at five the afternoon before, on the account, crossing the park from the bandai (on Sundays, Monday’s); the beans, the eggs and the butter come with Sakura Trading’s order off the ferry on Mondays.'},
  clinic:{name:'the clinic',owner:'Nhung',lines:['tissues','soap','water','peaches'],
   why:'Tissues and soap for the waiting room, water for patients, and tinned peaches for anyone kept in overnight.',
   delivery:'Whenever the clinic telephones; it is never urgent and always is.'},
 },
});
/** Sakura's trade accounts (the business site id → its order). */
export const TRADE_ACCOUNTS=ACCOUNTS.sakura;
/** What a business buys from Sakura. */
export const accountOf=site=>TRADE_ACCOUNTS[site]||null;
/** Which businesses buy this Sakura line, by site id. */
export const tradeBuyersOf=id=>Object.entries(TRADE_ACCOUNTS).filter(([,a])=>a.lines.includes(id)).map(([site])=>site);
/** Which businesses take their flowers and decorations from Sakura (the florist's old round). */
export const decorBuyers=()=>Object.entries(TRADE_ACCOUNTS).filter(([,a])=>a.decor?.length).map(([site])=>site);
/** Who supplies a business with what: [{supplier, lines, why, delivery}]. */
export const suppliersOf=site=>Object.entries(ACCOUNTS).filter(([,accounts])=>accounts[site]).map(([supplier,accounts])=>({supplier,...accounts[site]}));
/** Where Sakura's own stock comes from when it is not Thuan's to buy in (each product's supplier): nowhere since Higa Liquor closed and the beer became Sakura Trading's own buying (22 October 2026). */
export const SOURCED_FROM=Object.freeze(Object.fromEntries(PRODUCTS.filter(p=>p.supplier!=='sakura').map(p=>[p.id,p.supplier])));
