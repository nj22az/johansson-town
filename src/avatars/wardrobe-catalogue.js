import {PARTS} from './recipe.js';
import {ISLAND_OUTFITS,ISLAND_COSTUMES} from './outfits.js';

/**
 * The wardrobe catalogue: one entry for every item anyone can put on in the maker, World's photo studio and Johansson
 * Studio's Edit character -- every wardrobe part in recipe.js PARTS and every set in outfits.js.
 *
 *   {slot, id, label, category, tags, who, why, supplier?, colourways:[{name, colours}], wornIn?}
 *
 * Nothing is random (CLAUDE.md): `who` names the islanders who wear it and `why` says what it is for, and the maker shows
 * both under the pictures ("Worn by … · why"). `label` is the short name under a picture (about 18 letters). `category`
 * files it under one chip of its tab, `tags` are the places and occasions a search finds it by. `colourways` are the
 * real colour variants an item comes in, as recipe fields: an outfit set's fields are outfit fields (topColour), a
 * part's are full paths ('outfit.shoes'); an item that comes in colourways is put on in its first.
 *
 * Labels are per slot, so an id two slots share (`police` is a top and a hat, `none` a hat and an earring) reads right in
 * each. Ids are appended, never renamed: saved looks and share codes hold them.
 */

/** The island palette (character-style.md §6): sun-washed 1990s Okinawa, mid-tones, warm whites. */
export const ISLAND_PALETTE=Object.freeze([
 ['#f4f1ea','Paper white'],['#27304d','Night navy'],['#2f4f7f','Indigo'],['#c8473a','Bingata red'],['#e8b83e','Turmeric yellow'],
 ['#d9668a','Hibiscus'],['#e8836a','Coral'],['#8cc4b4','Sea glass'],['#3a9cb8','Lagoon'],['#8fbfe0','Sky'],['#4f7a4f','Fukugi green'],
 ['#9cb85a','Sugarcane'],['#e3d4b0','Sand'],['#c9b68c','Bashō beige'],['#b4583c','Roof-tile terracotta'],['#6e4a33','Black-sugar brown'],
 ['#6d7478','Typhoon grey'],['#2b2b2b','Charcoal'],
 // Pastels for the cute everyday wear (2026-10-14): a washed sakura pink and a mint, for sneakers, clips and sleeves.
 ['#f2b8c6','Sakura pink'],['#b8dcc8','Mint'],
].map(([hex,name])=>Object.freeze({hex,name})));
export const ISLAND_HEX=Object.freeze(new Set(ISLAND_PALETTE.map(c=>c.hex)));

/** Each slot: its name in the maker, where in a recipe it is written, and its categories (one chip each, in order). */
export const SLOTS=Object.freeze({
 set:Object.freeze({name:'Outfits',at:'outfit',categories:Object.freeze(['Everyday','Work','School & sport','Festival','Costume'])}),
 top:Object.freeze({name:'Tops',at:'outfit.top',categories:Object.freeze(['Everyday','Work & uniform','School & sport','Island & festival','Costume'])}),
 bottom:Object.freeze({name:'Bottoms',at:'outfit.bottom',categories:Object.freeze(['Trousers & shorts','Skirts'])}),
 footwear:Object.freeze({name:'Shoes',at:'outfit.footwear',categories:Object.freeze(['Everyday','Work'])}),
 hat:Object.freeze({name:'Hats',at:'outfit.hat',categories:Object.freeze(['Sun & everyday','Work','Festival','Fun'])}),
 belt:Object.freeze({name:'Belts',at:'outfit.belt',categories:Object.freeze(['Work'])}),
 earrings:Object.freeze({name:'Earrings',at:'accessories.earrings',categories:Object.freeze(['Jewellery'])}),
 neckwear:Object.freeze({name:'Neckwear',at:'accessories.neckwear',categories:Object.freeze(['Jewellery','Scarves'])}),
 glasses:Object.freeze({name:'Glasses',at:'glasses.style',categories:Object.freeze(['Everyday','Sun'])}),
});
/** The slot a recipe path writes ('outfit.top' → 'top'). */
export const SLOT_AT=Object.freeze(Object.fromEntries(Object.entries(SLOTS).map(([slot,s])=>[s.at,slot])));

const PROPOSED_PARADE='children in the Port Festival parade (proposed)';
/** Every wardrobe part, by slot, in PARTS order. */
const PART_ENTRIES={
 top:{
  stripedvest:{label:'Striped tee & vest',category:'Everyday',tags:['stripes','long sleeves','vest','Vy'],who:'Vy off school',why:'A striped cotton tee under a dark sleeveless vest for a cool afternoon by the harbour.',colourways:[{name:'Monochrome',colours:{'outfit.topColour':'#24252b','outfit.accent':'#f4f1ea'}}]},
  tank:{label:'Tank top',category:'Everyday',tags:['vest','base layer','summer'],who:'everyone, under it all; Nhung on the hottest days',why:'The base layer under every top, and on its own in August.'},
  tee:{label:'T-shirt',category:'Everyday',tags:['tee','cotton','summer'],who:'Thao, Chin, Kai and Kōji',why:'Cotton that is cheap, cool and dry on the line by noon.'},
  kariyushi:{label:'Kariyushi',category:'Island & festival',tags:['island shirt','aloha','town hall','summer','Minato'],who:'Johansson in his sky-blue one; Mr Fujita at Minato once he has signed off',why:'The island’s own summer shirt, worn untucked and open at the neck, even to the town hall.'},
  polo:{label:'Polo',category:'Everyday',tags:['collar','uniform','gateball','post'],who:'Ren off watch, Kai on the Kitano pier and Daichi',why:'A collar that looks tidy at work and still breathes in the heat.'},
  contrastpolo:{label:'Contrast-collar polo',category:'Everyday',tags:['polo','collar','ferry','harbour'],who:'the harbour visitor off the ferry; Thuan on her days off',why:'A navy knit with a cream collar that stays smart on the ferry deck.'},
  blouse:{label:'Blouse',category:'Everyday',tags:['shop','shrine','summer'],who:'Thuan in her yellow one; Miss Higa, Naoko and Yoshiko',why:'Light cotton with a round collar, as right at the shop counter as at the shrine.'},
  jacket:{label:'Jacket',category:'Everyday',tags:['ferry','evening','wind','harbour office'],who:'Nhung, Tetsuo and the harbour master',why:'For the ferry deck and the wind off the sea after dark.'},
  apron:{label:'Apron',category:'Work & uniform',tags:['apron dress','stall','kitchen','fish counter','Sato Ramen'],who:'Mrs Sato, Mrs Nakamura and Hiroshi',why:'An apron dress that keeps the stall and the kitchen off their clothes.'},
  smock:{label:'Smock',category:'Work & uniform',tags:['school lunch','ink','newspaper','generators','sleeves','kitchen','shop'],who:'Nhung at the paper’s bench, Tetsuo at the generators, Mrs Sato at her stove, Thuan at the shop and the Years 5–6 lunch squad',why:'Long sleeves and a pocket against ink, oil, broth and school lunch.'},
  sailor:{label:'Sailor shirt',category:'School & sport',tags:['school uniform','high school','ferry'],who:'Vy and Hana, on the ferry to the high school',why:'The high school’s summer uniform.'},
  sailorlong:{label:'Long-sleeved sailor',category:'School & sport',tags:['sailor','Thuan’s wardrobe','navy'],who:'Thuan, from her own wardrobe',why:'Her navy sailor top with long sleeves and a red necktie, for the cooler days.'},
  police:{label:'Police jacket',category:'Work & uniform',tags:['police','officer','patrol','uniform','1994','kōban','tie'],who:'Officer Mori',
   why:'The 1994-pattern police jacket: navy, notched lapels, three dark-gold buttons, shoulder straps, the rank plate on the left breast and the emblem on the right arm, over a white shirt and tie.'},
  hoodie:{label:'Hooded sweater',category:'Everyday',tags:['hoodie','rain','early boats','pier'],who:'Chin, Daichi, Masaru, Kenta, Hiroshi and the Cold-storage kid',why:'A hood and a pocket for the early boats, the rainy season and the windy pier.'},
  cardigan:{label:'Cardigan',category:'Everyday',tags:['knit','January','winter','bookshop','florist'],who:'Thuan at the flower buckets on January mornings; Nhung in the air-conditioned bookshop, before she became the island doctor',why:'A knitted layer for the north wind of January, and for air-conditioning.'},
  overalls:{label:'Work overalls',category:'Work & uniform',tags:['cargo yard','quay','repair','workshop'],who:'Kōji at the auction; Chin on a repair',why:'A bib with pockets that takes the grease and the crates.'},
  sundress:{label:'Sundress bodice',category:'Everyday',tags:['dress','summer','Sunday','beach'],who:'Mai and Vy at the beach',why:'The coolest thing to wear on a hot Sunday.'},
  festival:{label:'Happi coat',category:'Island & festival',tags:['happi','festival coat','eisa','tug-of-war','Obon','steward','andagi'],who:'the stewards at the eisa night, the tug-of-war and the andagi stall',why:'A happi coat shows who is helping to run the festival.'},
  lighthouse:{label:'Lighthouse costume',category:'Costume',tags:['costume','parade','Port Festival','lighthouse'],who:PROPOSED_PARADE,why:'The white lighthouse on the breakwater head with its red lamp: the harbour’s landmark.'},
  lantern:{label:'Lantern costume',category:'Costume',tags:['costume','parade','Port Festival','Obon','lantern'],who:PROPOSED_PARADE,why:'The lanterns hung along the quay on the last night of Obon.'},
  reef:{label:'Reef costume',category:'Costume',tags:['costume','parade','Port Festival','reef','Kitahama'],who:PROPOSED_PARADE,why:'The coral reef off Kitahama, in ribbons, so nobody forgets it is there.'},
  // The wardrobe plan's batch 2: painted on the body every top already has. Each comes in the colours it is really worn
  // in (put on in the first), and plain, without a print; the accent is the shirt under a vest, the class colour on a PE
  // shirt, the jersey's piping.
  shirt:{label:'Open-collar shirt',category:'Work & uniform',tags:['office','school','summer school','town hall','power station','clinic','pen','collar'],
   who:'Jack Reed at the harbour office, Nhung under her white coat at the clinic, and Daichi at summer school',why:'The island’s office and school shirt: short sleeves, the top button open, and a pen in the pocket.',
   colourways:[{name:'Paper white',colours:{'outfit.topColour':'#f4f1ea','outfit.accent':'#2f4f7f','outfit.pattern':'none'}},{name:'Sky',colours:{'outfit.topColour':'#8fbfe0','outfit.accent':'#2f4f7f','outfit.pattern':'none'}}]},
  vest:{label:'Vest over a shirt',category:'Work & uniform',tags:['uniform','waistcoat','harbour office','bus','police','ticket window','port terminal','1990s'],
   who:'the harbour master, Officer Mori, Tetsuo, Aya at the purser’s window and Ms Ganaha at the ticket window',why:'The 1990s service uniform their own looks describe: a vest over a short-sleeved shirt.',
   colourways:[{name:'Service navy',colours:{'outfit.topColour':'#27304d','outfit.accent':'#f4f1ea','outfit.pattern':'none'}},{name:'Terminal terracotta',colours:{'outfit.topColour':'#b4583c','outfit.accent':'#f4f1ea','outfit.pattern':'none'}}]},
  knitvest:{label:'Knitted vest',category:'Everyday',tags:['knit','sweater vest','pier','shrine','wind','winter'],
   who:'Mr Fujita on the pier and Mr Tanabe at the shrine',why:'A knitted layer over the shirt for the wind on the pier and the shrine’s shade.',
   colourways:[{name:'Sea glass',colours:{'outfit.topColour':'#8cc4b4','outfit.accent':'#f4f1ea','outfit.pattern':'none'}},{name:'Sand',colours:{'outfit.topColour':'#e3d4b0','outfit.accent':'#f4f1ea','outfit.pattern':'none'}},{name:'Bashō beige',colours:{'outfit.topColour':'#c9b68c','outfit.accent':'#f4f1ea','outfit.pattern':'none'}}]},
  gymtee:{label:'PE shirt',category:'School & sport',tags:['PE','gym','school','sports day','name patch','children','Years 5–6'],
   who:'the Years 5–6 pupils in PE with Miss Higa',why:'The name patch sewn on the chest is how the teachers tell the children apart.',
   colourways:[{name:'Lagoon class',colours:{'outfit.topColour':'#f4f1ea','outfit.accent':'#3a9cb8','outfit.pattern':'none'}},{name:'Red class',colours:{'outfit.topColour':'#f4f1ea','outfit.accent':'#c8473a','outfit.pattern':'none'}}]},
  baseball:{label:'Seagulls jersey',category:'School & sport',tags:['baseball','Minato Seagulls','Seagulls','team','game day','number','Aoba'],
   who:'the Minato Seagulls, whose signed board hangs at Sato Ramen (players proposed: Kōji, Chin and Mr Iha); Daichi, who dreams of a perfect game',
   why:'The town team’s home jersey, with Minato across the chest and a number on the back. They have not beaten Aoba since 1989.',
   colourways:[{name:'Seagulls home',colours:{'outfit.topColour':'#f4f1ea','outfit.accent':'#27304d','outfit.pattern':'none'}}]},
  // Cute everyday wear (the creator, 2026-10-14: "characters need to … have cute clothes"): painted on the same body.
  raglan:{label:'Raglan tee',category:'Everyday',tags:['tee','baseball tee','heart','weekend','Sunday','Blue Coral','park','school'],
   who:'Vy and Mai on Saturdays, walking to Blue Coral for ice cream; Thao on her afternoon off',
   why:'A cotton tee with sleeves in a second colour that run up to the neck, and a little heart on the chest: easy to run about in.',
   colourways:[{name:'Hibiscus sleeves',colours:{'outfit.topColour':'#f4f1ea','outfit.accent':'#d9668a','outfit.pattern':'none'}},{name:'Lagoon sleeves',colours:{'outfit.topColour':'#f4f1ea','outfit.accent':'#3a9cb8','outfit.pattern':'none'}},{name:'Navy sleeves',colours:{'outfit.topColour':'#e3d4b0','outfit.accent':'#27304d','outfit.pattern':'none'}}]},
  pinafore:{label:'Pinafore',category:'Everyday',tags:['dress','pinafore','jumper skirt','Sunday','school','tee'],
   who:'Mai on Sundays; Miss Higa on school trips',
   why:'A pinafore over a T-shirt, its bib and skirt one cloth: a dress that takes a fall in the playground and washes in one go.',
   colourways:[{name:'Indigo over white',colours:{'outfit.topColour':'#f4f1ea','outfit.bottomColour':'#2f4f7f','outfit.accent':'#e8b83e','outfit.pattern':'none'}},{name:'Hibiscus over white',colours:{'outfit.topColour':'#f4f1ea','outfit.bottomColour':'#d9668a','outfit.accent':'#f4f1ea','outfit.pattern':'none'}}]},
 },
 bottom:{
  underwear:{label:'Underwear',category:'Trousers & shorts',tags:['base layer'],who:'everyone, under it all',why:'The base layer.'},
  shorts:{label:'Shorts',category:'Trousers & shorts',tags:['summer','beach','school'],who:'Johansson, Thao, Chin, Kōji and the schoolboys',why:'Knees out from May to October.'},
  trousers:{label:'Trousers',category:'Trousers & shorts',tags:['work','uniform'],who:'most of the island at work: Thuan, Nhung, Mrs Sato, Officer Mori and the harbour master',why:'Cotton trousers for work, and for the sun on the legs.'},
  skirt:{label:'Tailored skirt',category:'Skirts',tags:['summer','school'],who:'Miss Higa, Mrs Nakamura, Ms Ganaha and the schoolgirls',why:'A fitted waistband and rounded hips with a gently opened hem, tailored to the wearer.'},
  longskirt:{label:'Long skirt',category:'Skirts',tags:['shrine','verandah'],who:'Nhung, Miss Higa, Grandmother Higa and Yoshiko',why:'A long skirt that keeps the sun and the mosquitoes off.'},
  widepants:{label:'Wide trousers',category:'Trousers & shorts',tags:['monpe','work','garden','quay'],who:'the harbour day shift; Grandmother Higa in her garden',why:'Loose trousers that let the air in on a hot shift.'},
  cropped:{label:'Cropped trousers',category:'Trousers & shorts',tags:['rain','rainy season'],who:'Kenta and the Cold-storage kid in the rainy season',why:'Hems clear of the puddles in May and June.'},
  culottes:{label:'Culottes',category:'Skirts',tags:['bookshop','ladder'],who:'Nhung at Front-Row Books, before she became the island doctor',why:'As cool as a skirt, and easy on the ladder to the top shelves.'},
  pleatedskirt:{label:'Pleated skirt',category:'Skirts',tags:['school uniform','ferry','pleats'],who:'Vy and Hana with the sailor uniform; Thuan; the harbour visitor',why:'Pleats that swing on the walk to the ferry and fall back neat.'},
 },
 footwear:{
  barefoot:{label:'Bare feet',category:'Everyday',tags:['genkan','beach','indoors'],who:'everyone indoors, and on the beach',why:'Shoes come off at every door on the island.'},
  sneakers:{label:'Sneakers',category:'Everyday',tags:['canvas','school','lanes'],who:'most of the island, and the schoolchildren',why:'Canvas shoes for the lanes, cheap and quick to dry.'},
  sandals:{label:'Sandals',category:'Everyday',tags:['summer','genkan','beach'],who:'Johansson, Thao and Chin',why:'Off in a second at the genkan, and cool all summer.'},
  shoes:{label:'Shoes',category:'Everyday',tags:['leather','school','office','occasion'],who:'Vy and Hana with the uniform; Officer Mori; anyone in their Sunday best',why:'Leather shoes for school, the office and occasions.'},
  boots:{label:'Boots',category:'Work',tags:['quay','fish market','wet','work'],who:'Kōji at the auction; the harbour day shift',why:'For the wet quay and the fish market floor.'},
 },
 hat:{
  none:{label:'No hat',category:'Sun & everyday',tags:['bare head'],who:'most people, most of the time',why:'Hair out.'},
  cap:{label:'Cap',category:'Sun & everyday',tags:['baseball cap','sun','post','bus'],who:'Ren, Kai and Chin',why:'A peak to keep the sun out of the eyes.'},
  captain:{label:'Captain’s cap',category:'Work',tags:['harbour master','ferry','harbour office'],who:'the harbour master',why:'His cap, so the ferry knows who gives the berth.'},
  police:{label:'Police cap',category:'Work',tags:['police','officer','uniform','peaked cap','1994'],who:'Officer Mori',why:'The peaked police cap: a navy crown, a black band, a black visor and chin strap, and the island police badge.'},
  helmet:{label:'Helmet',category:'Work',tags:['hard hat','safety','cargo yard','ice plant'],who:'Kōji at the ice plant and the quay workers under the ice chute',why:'A hard hat where crates and blocks of ice swing overhead.'},
  straw:{label:'Straw hat',category:'Sun & everyday',tags:['sun','sabani','gateball','garden'],who:'Kai on the Kitano pier, Kōji on his sabani; the elders at gateball',why:'Wide shade for the open water and the court at noon.'},
  headband:{label:'Headband',category:'Work',tags:['sweat','fish counter','ice plant','post'],who:'Kōji at the auction and Naoko',why:'A band to keep sweat and hair out of the eyes while they work.'},
  kerchief:{label:'Kerchief',category:'Work',tags:['kitchen','shop','school lunch','hair covered','headscarf','sankakukin','engine room'],who:'Mrs Sato, Mrs Nakamura, Kōji, Chin in the engine room, Jun in the galley, Hiroshi and the school’s lunch squad',
   why:'A triangle of cotton tied at the back of the neck, so hair stays covered over food (and out of the oil in the engine room).'},
  beanie:{label:'Beanie',category:'Work',tags:['cold','ice plant','cold room','knit','winter'],who:'Kōji and the Cold-storage kid in the ice plant’s cold room',why:'The only warm hat on the island in August, for a room below freezing.'},
  beret:{label:'Beret',category:'Sun & everyday',tags:['bookshop','wool','autumn'],who:'Nhung on cooler days',why:'A soft wool beret, her own style.'},
  bucket:{label:'Bucket hat',category:'Sun & everyday',tags:['sun','school','children','yellow hat','beach','seawall'],who:'the Years 5–6 pupils on the walk to school; anglers on the seawall',why:'A soft brim all round, shade for the neck too.'},
  ribbon:{label:'Hair bow',category:'Sun & everyday',tags:['bow','occasion','Sunday'],who:'Hana and the schoolgirls on Sundays',why:'A bow for an occasion.'},
  squid:{label:'Squid cap',category:'Fun',tags:['costume','parade','Port Festival','fish auction','silly'],who:PROPOSED_PARADE,why:'The squid the boats bring in, as a silly hat.'},
  teapot:{label:'Teapot hat',category:'Fun',tags:['costume','parade','Port Festival','tea','silly'],who:PROPOSED_PARADE,why:'A pot of sanpin-cha, the island’s jasmine tea, worn on the head.'},
  sunflower:{label:'Sunflower bonnet',category:'Fun',tags:['costume','parade','Port Festival','summer','silly'],who:PROPOSED_PARADE,why:'A sunflower for the brightest day of summer.'},
  paperboat:{label:'Paper-boat hat',category:'Fun',tags:['newspaper','folded','children','silly'],who:'children who fold yesterday’s evening paper',why:'The paper hat every child on the island learns to fold.'},
  mountain:{label:'Mount Aoba hat',category:'Fun',tags:['costume','parade','Port Festival','Mount Aoba','silly'],who:PROPOSED_PARADE,why:'Mount Aoba, the island’s peak, worn on the head.'},
  // A model from World's asset catalogue (assets/catalog/johansson-trucker, avatars/hat-assets.js), sold at Sakura Shōten.
  // Its foam front and bill are the hat colour, its mesh, undervisor, rope and J the accent: each colourway sets both.
  trucker:{label:'Johansson trucker',category:'Sun & everyday',tags:['trucker cap','baseball cap','snapback','mesh','J','Johansson','premium','sun','quay','boats','Sakura Shōten','konbini'],
   who:'Kōji, who bought the first one at Sakura; Mr Fujita at the bow bollards',
   why:'A well-made trucker cap: a tall foam front with Johansson’s J raised in embroidery, a mesh back that lets the sea wind through, a strap that fits anyone.',
   supplier:'Sakura Shōten, ¥3,800 (Johansson Headwear JH-712)',
   colourways:[{name:'Navy & white',colours:{'outfit.hatColour':'#27304d','outfit.accent':'#f4f1ea'}},{name:'Charcoal & grey',colours:{'outfit.hatColour':'#2b2b2b','outfit.accent':'#6d7478'}},{name:'White & navy',colours:{'outfit.hatColour':'#f4f1ea','outfit.accent':'#27304d'}}]},
  hairclip:{label:'Hair clip',category:'Sun & everyday',tags:['hair slide','hairpin','clip','heart','fringe','school','Sunday'],
   who:'Vy, pinning back her fringe for school; Mai; Thao at the izakaya counter',
   why:'A little slide at the temple that keeps the fringe out of the eyes, with a heart on it.',
   colourways:[{name:'Sakura pink',colours:{'outfit.hatColour':'#f2b8c6'}},{name:'Lagoon',colours:{'outfit.hatColour':'#3a9cb8'}},{name:'Turmeric',colours:{'outfit.hatColour':'#e8b83e'}}]},
 },
 belt:{
  none:{label:'No belt',category:'Work',tags:[],who:'most islanders',why:'Nothing hanging at the waist.'},
  duty:{label:'Duty belt',category:'Work',tags:['police','officer','patrol','holster','baton','handcuffs','radio','uniform'],who:'Officer Mori',
   why:'A police officer’s duty belt: the holster, the baton, the handcuffs and the radio, with its microphone on the shoulder. Under the police jacket only what comes out of its side slots shows.'},
 },
 earrings:{
  none:{label:'No earrings',category:'Jewellery',tags:[],who:'most islanders',why:'Nothing in the ears.'},
  studs:{label:'Studs',category:'Jewellery',tags:['gold','small'],who:'Thuan and Thao',why:'Small enough to forget at work.'},
  hoops:{label:'Hoops',category:'Jewellery',tags:['bold'],who:'Nhung',why:'Her one bold piece.'},
 },
 neckwear:{
  none:{label:'Nothing at the neck',category:'Jewellery',tags:[],who:'most islanders',why:'Nothing at the neck in the heat.'},
  pendant:{label:'Pendant',category:'Jewellery',tags:['necklace','gold','chain'],who:'Thuan',why:'A small gold pendant she always wears.'},
  scarf:{label:'Scarf',category:'Scarves',tags:['air-conditioning','newspaper','winter'],who:'Nhung at the paper’s bench',why:'A light scarf against the air-conditioning at the paper.'},
 },
 glasses:{
  none:{label:'No glasses',category:'Everyday',tags:[],who:'most islanders',why:'Nothing on the nose.'},
  round:{label:'Round',category:'Everyday',tags:['spectacles','reading'],who:'Thuan in rose frames; Mrs Sato and the harbour master',why:'Round frames, for reading and for seeing.'},
  square:{label:'Square',category:'Everyday',tags:['spectacles','reading'],who:'Mr Fujita, Mr Tanabe and Fumiko',why:'Square frames that sit firm through a day of fishing.'},
  sun:{label:'Shades',category:'Sun',tags:['sunglasses','glare','sea','boat'],who:'Kōji out on the water at noon',why:'Against the glare off the sea.'},
  half:{label:'Half-rim',category:'Everyday',tags:['reading glasses','reading'],who:'Tetsuo, Miss Higa and Grandmother Higa',why:'Reading glasses to look over.'},
 },
};

const freeze=entry=>Object.freeze({...entry,tags:Object.freeze([...(entry.tags||[])]),colourways:Object.freeze((entry.colourways||[]).map(c=>Object.freeze({name:c.name,colours:Object.freeze({...c.colours})})))});
/** Every set, outfits then costumes, as catalogue entries; `outfit` is what it puts on. */
export const SETS=Object.freeze([...ISLAND_OUTFITS,...ISLAND_COSTUMES].map(set=>freeze({slot:'set',id:set.id,label:set.label,name:set.name,category:set.category,
 tags:set.tags,who:set.who,why:set.why,colourways:set.colourways,outfit:set.outfit,costume:ISLAND_COSTUMES.includes(set)})));
/** The whole catalogue: the sets, then every wardrobe part in its slot's PARTS order. */
export const CATALOGUE=Object.freeze([...SETS,...Object.keys(PART_ENTRIES).flatMap(slot=>PARTS[slot].map(id=>PART_ENTRIES[slot][id]&&freeze({slot,id,...PART_ENTRIES[slot][id]})).filter(Boolean))]);
const BY_KEY=new Map(CATALOGUE.map(e=>[e.slot+':'+e.id,e]));

/** The catalogue entry for an item, or null. */
export const entryFor=(slot,id)=>BY_KEY.get(slot+':'+id)||null;
/** The words under an item's picture; an id with no entry reads as itself. */
export const labelFor=(slot,id)=>entryFor(slot,id)?.label||String(id);
/** "Worn by … · why", the line the maker shows under the chosen item. */
export const wornLine=entry=>entry?`Worn by ${entry.who} · ${entry.why}`:'';

/**
 * The set someone is wearing, if their outfit is one: every field the set puts on matches, in one of its colourways.
 * Returns {set, colourway} (colourway is an index, or -1 for a set without colourways), or null.
 */
export function wornSet(outfit){
 for(const set of SETS){
  const ways=set.colourways.length?set.colourways:[{colours:{}}];
  for(const [i,way] of ways.entries()){
   const want={...set.outfit,...way.colours};
   if(Object.entries(want).every(([k,v])=>outfit?.[k]===v))return {set,colourway:set.colourways.length?i:-1};
  }
 }
 return null;
}

/**
 * What `outfit` becomes with `set` put on (`colours`: one of its colourways' fields). A field the set leaves out stays as it
 * was, except the hat (or the belt) that came with the set being worn now: it comes off with that set (no kitchen kerchief on a Sunday
 * dress). A hat of one's own stays (Nhung keeps her beret for a bookshop afternoon).
 */
export function putOnSet(outfit,set,colours={}){
 const was=wornSet(outfit)?.set,next={...outfit,...set.outfit,...colours};
 // The same for a belt that came with a set (the police duty belt comes off with the uniform).
 for(const field of ['hat','belt'])if(!(field in set.outfit)&&was&&was.id!==set.id&&field in was.outfit&&outfit[field]===was.outfit[field])next[field]='none';
 return next;
}

/**
 * The name a reader hears for an item's picture: its full name, which holds the short label under the picture, or the
 * label and then the name when it does not ("Reef explorer: Reef ribbon explorer"), so saying what is on screen works
 * (WCAG 2.5.3, label in name).
 */
export const accessibleName=entry=>!entry.name?entry.label:entry.name.toLowerCase().includes(entry.label.toLowerCase())?entry.name:entry.label+': '+entry.name;

/** Text folded for searching: lower case, without accents or macrons (Kōji → koji, zōri → zori). */
export const fold=text=>String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
// Not the category: the chips browse by category, and a chip's name is no word about the item ("school" found the
// gateball set by its 'School & sport' chip).
const haystack=new Map(CATALOGUE.map(e=>[e,' '+fold([e.label,e.name,e.id,SLOTS[e.slot].name,...e.tags,e.who,e.supplier,e.wornIn].filter(Boolean).join(' ')).replace(/[^a-z0-9]+/g,' ')+' ']));
/**
 * Every item a search finds, grouped by slot in SLOTS order: [{slot, name, entries}]. Each word of the query must begin a
 * word of the item's label, its name, tags, the names in `who`, or its places and occasions; accents are ignored.
 */
export function searchWardrobe(query){
 const words=fold(query).split(/[^a-z0-9]+/).filter(Boolean);
 if(!words.length)return [];
 const found=CATALOGUE.filter(e=>words.every(w=>haystack.get(e).includes(' '+w)));
 return Object.keys(SLOTS).map(slot=>({slot,name:SLOTS[slot].name,entries:found.filter(e=>e.slot===slot)})).filter(g=>g.entries.length);
}
