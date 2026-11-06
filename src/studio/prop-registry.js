/**
 * The props World builds in its own code that can be built on their own, for Johansson Studio's asset library ("Make
 * model": the creator, 2026-10-14, "I want all assets to be available in a studio maker as well and easy to export").
 * Each entry names its builder (the module and the function World itself calls, imported only when it is opened, so
 * the game never loads this list), its real size (what the built model measures, metres w × h × d; the size check
 * holds the two together), its kind (modeller/rules.json: the phone budget it is checked against) and its purpose:
 * who it is for, why they want it and where it is in World, taken from the code's own comments and data. Nothing here
 * changes how World builds them.
 *
 * What World builds in code and is not here yet, with why, is in briefs/NEXT.md §5 ("The survey").
 *
 * Frames: Studio stands every model on the floor (its lowest point at y = 0, its footprint's middle on x = z = 0). A
 * thing World hangs (`hangs`) names the point it hangs from as the anchor `hang`; one World builds the other way up
 * (`turn`) is turned upright first.
 */
const ENTRIES=[
 {id:'ramen-drinks-stand',name:'Sato Ramen drinks stand',kind:'furniture',size:[.94,.88,.56],
  source:'world/interiors/sato-ramen.js buildRamenDrinksStand',load:()=>import('../world/interiors/sato-ramen.js'),build:m=>m.buildRamenDrinksStand(),
  purpose:{for:'Mrs Sato, serving coffee and cold barley tea.',why:'Supports the coffee urn, jug and cups at working height instead of leaving them in mid-air.',where:'At the east end of the ramen kitchen beside the serving pass.'},tags:['Sato Ramen','kitchen','support','drinks']},
 {id:'vending-machine',name:'Drinks machine (Johansson Vending JV-16C)',kind:'fixture',size:[1.042,1.83,.826],
  source:'world/vending.js createVendingMachine',load:()=>import('../world/vending.js'),build:m=>m.createVendingMachine({pad:false}),
  purpose:{for:'The quay crew before and after a shift, the children on the Halloween walk, and anyone on Sakura Street who wants a cold sanpin tea or a hot J-Coffee.',
   why:'Sixteen columns of the island’s own drinks, cold and hot, day and night: Minato Drinks fills it from its van every morning, and Sakura gives it the wall and the power for a share.',
   where:'Against Sakura Shōten’s wall on Sakura Street, on its own concrete pad beside its own outdoor socket (okinawa/old-town.js SAKURA_VENDING).'},
  action:{kind:'buy',label:'Buy a drink'},tags:['Sakura Street','drinks','1990s','Johansson Vending','coin-operated']},
 {id:'pumpkin-lantern',name:'Paper pumpkin lantern',kind:'prop',size:[.395,.361,.372],hangs:true,glow:true,
  source:'world/halloween-props.js buildPumpkinLantern',load:()=>import('../world/halloween-props.js'),build:m=>m.buildPumpkinLantern(),
  purpose:{for:'The children on the Halloween walk along Sakura Street, and the shopkeepers who string the route for them.',
   why:'Thirteen paper lanterns, a 25 W bulb in each, light the walk’s route on the last evening of October.',
   where:'On one string from the nobori pole by the drinks machine, along the front edge of Sakura Shōten’s awning (halloween.js).'},
  action:{kind:'look',label:'Look at the lantern'},tags:['Halloween','lantern','paper','Sakura Street']},
 {id:'jack-o-lantern-pail',name:'Plastic jack-o’-lantern pail',kind:'prop',size:[.32,.203,.318],glow:true,
  source:'world/halloween-props.js buildJackOLantern',load:()=>import('../world/halloween-props.js'),build:m=>m.buildJackOLantern(),
  purpose:{for:'The children collecting sweets on the Halloween walk, who carry the pails from shop to shop.',
   why:'A sweets pail lit inside by a little torch, so it glows in the walk’s photograph.',
   where:'Ringed round Sakura’s drinks machine for the walk’s photograph (halloween.js, the story things).'},
  action:{kind:'look',label:'Look at the pail'},tags:['Halloween','sweets','pail']},
 {id:'obake-plush',name:'Plush obake',kind:'prop',size:[.329,.436,.309],
  source:'world/halloween-props.js buildObake',load:()=>import('../world/halloween-props.js'),build:m=>m.buildObake(),
  purpose:{for:'The children on the Halloween walk, and the story’s séance, where one peeks from the crates.',
   why:'A soft toy ghost, round and smiling: a Japanese Halloween’s obake is cute, not frightening.',
   where:'Peeking from the crates beside Sakura’s drinks machine (halloween.js, the story things).'},
  action:{kind:'look',label:'Look at the obake'},tags:['Halloween','ghost','plush']},
 {id:'obake-cutout',name:'Cardboard obake',kind:'sign',size:[.37,.332,.009],
  source:'world/halloween-props.js buildObake({flat:true})',load:()=>import('../world/halloween-props.js'),build:m=>m.buildObake({flat:true}),
  purpose:{for:'The children on the Halloween walk, at whose eye height the ghosts are taped.',
   why:'Paper ghosts turn Sakura’s closed shutter into part of the walk.',
   where:'Four of them taped to Sakura Shōten’s shutter at a child’s eye height (halloween.js).'},
  action:{kind:'look',label:'Look at the ghost'},tags:['Halloween','ghost','cardboard'],flat:true},
 {id:'kuro-dog',name:'Kuro, the Tamashiros’ dog',kind:'prop',size:[.272,.534,.484],
  source:'world/halloween-props.js buildDog',load:()=>import('../world/halloween-props.js'),build:m=>m.buildDog({pose:'sit'}),
  purpose:{for:'The Tamashiro family, whose black dog he is, and the stories that need a dog on the street.',
   why:'He barks at the postman’s Super Cub and nothing else; a dog makes a street lived in.',
   where:'On Sakura Street with the Tamashiros on the Halloween evening (halloween.js, stage dog).'},
  action:{kind:'look',label:'Look at Kuro'},tags:['dog','Tamashiro','Sakura Street']},
 {id:'cord-reel',name:'Cord reel',kind:'prop',size:[.222,.392,.32],
  source:'world/halloween-props.js buildCordReel',load:()=>import('../world/halloween-props.js'),build:m=>m.buildCordReel(),
  purpose:{for:'Kōji, who brought it from his boat shed, and Tetsuo, the electrician who finds the fault in it.',
   why:'Thirty metres of thin cord still half coiled on its drum: the story’s trouble, carrying the machine’s start surge and the lanterns at once.',
   where:'On the pavement by Sakura’s drinks machine and its outdoor socket (halloween.js, the reel).'},
  action:{kind:'look',label:'Look at the cord reel'},tags:['electrics','Halloween','Kōji','Tetsuo']},
 {id:'j-coffee-can',name:'J-Coffee can',kind:'prop',size:[.066,.125,.066],
  source:'world/halloween-props.js buildJCoffeeCan',load:()=>import('../world/halloween-props.js'),build:m=>m.buildJCoffeeCan(),
  purpose:{for:'The quay crew, who press it before and after a shift, and anyone at a drinks machine at night.',
   why:'The island’s own canned black coffee (Minato Drinks, a made-up brand), ¥120 from the town’s machines; it sells out first at night.',
   where:'Three columns of the bottom row of Sakura’s drinks machine, at hand height under the coin slot (vending.js VENDING_COLUMNS).'},
  action:{kind:'buy',label:'Buy a J-Coffee (¥120)'},tags:['coffee','can','Minato Drinks','drinks machine']},
 {id:'pocket-torch',name:'Tetsuo’s pocket torch',kind:'prop',size:[.028,.029,.134],story:'torch',
  source:'avatars/story-props.js buildPocketTorch',load:()=>import('../avatars/story-props.js'),build:m=>m.buildPocketTorch()},
 {id:'rattan-basket',name:'Rattan locker basket',kind:'prop',size:[.407,.22,.407],story:'basketOnHead',turn:true,
  source:'avatars/story-props.js buildBasket',load:()=>import('../avatars/story-props.js'),build:m=>m.buildBasket(),
  purpose:{for:'The bathers in Umi-no-yu’s changing rooms, and Thuan, who ends up wearing one in the blackout.',
   why:'A rattan clothes basket at every locker: your clothes wait in it while you bathe.',
   where:'On the locker shelves of Umi-no-yu’s changing rooms, the men’s side’s size, 0.40 × 0.40 × 0.22 m (story-props.js BASKET).'}},
 {id:'evening-paper',name:'Evening paper',kind:'prop',size:[.342,.28,.083],story:'newspaper',
  source:'avatars/story-props.js buildPaper',load:()=>import('../avatars/story-props.js'),build:m=>m.buildPaper()},
 {id:'paperback',name:'Miss Higa’s paperback',kind:'prop',size:[.234,.142,.157],story:'paperback',
  source:'avatars/story-props.js buildPaperback',load:()=>import('../avatars/story-props.js'),build:m=>m.buildPaperback()},
 {id:'voltage-tester',name:'Two-pole voltage tester',kind:'prop',size:[.07,.476,.041],story:'voltageTester',
  source:'avatars/story-props.js buildTester',load:()=>import('../avatars/story-props.js'),build:m=>m.buildTester()},
 {id:'tea-stop',name:'Tea stop (bench and parasol)',kind:'fixture',size:[3.625,2.64,2.9],
  source:'world/roadside-props.js buildTeaStop',load:()=>import('../world/roadside-props.js'),build:m=>m.buildTeaStop(),
  purpose:{for:'People walking up to Minato Park, who stop for a cup of sencha and a sata andagi.',
   why:'A long bench in red felt under a paper parasol: somewhere to sit a while with tea and the view of the town.',
   where:'On the open turf south of the path into Minato Park (park.js placeTeaStop), facing the path.'},
  action:{kind:'buy',label:'Buy a cup of tea (¥100)'},tags:['park','tea','bench','parasol']},
 {id:'commuter-bicycle',name:'Commuter bicycle',kind:'vehicle-part',size:[.545,1.08,1.814],
  source:'world/bicycle.js buildBicycle',load:()=>import('../world/bicycle.js'),build:m=>m.buildBicycle({}).object,
  purpose:{for:'The residents who ride to the shops and the quay, and the player, who rides the bookshop’s one.',
   why:'The island’s everyday transport: a commuter bicycle with a front basket, a rear carrier and a stand.',
   where:'Parked outside Front-Row Books & Stationery (bicycle.js BOOKSHOP_BICYCLE) and along the harbour (harbour.js).'},
  action:{kind:'use',label:'Ride the bicycle'},tags:['bicycle','transport','harbour']},
 {id:'kept-sake-bottle',name:'Kept sake bottle',kind:'prop',size:[.09,.358,.09],
  source:'world/interiors/izakaya-devices.js buildKeptBottleVisual',load:()=>import('../world/interiors/izakaya-devices.js'),build:m=>{const g=m.buildKeptBottleVisual();g.visible=true;return g;},
  purpose:{for:'The izakaya’s regulars, and the player, whose own bottle waits on the keep shelf.',
   why:'Bottle keep: you buy a whole bottle and Minato keeps it for you, with your name on its card, until your next visit.',
   where:'On Minato’s keep shelf by the counter (izakaya-dressing.js KEEP_SHELF).'},
  action:{kind:'use',label:'Pour from your bottle'},tags:['izakaya','sake','bottle keep']},
];

let storyProps=null;
/** A story prop's purpose: STORY_PROPS's own who, why and where (avatars/story-props.js). */
async function storyPurpose(key){
 storyProps??=(await import('../avatars/story-props.js')).STORY_PROPS;
 const s=storyProps[key];return {for:s.who+(/[.!?]$/.test(s.who)?'':', who carries it in the stories.'),why:s.why,where:s.where};
}

/** The registry's entries as data (what the library lists before anything is built). */
export const PROP_REGISTRY=Object.freeze(ENTRIES.map(e=>Object.freeze({id:e.id,name:e.name,kind:e.kind,size:Object.freeze([...e.size]),source:e.source,
 hangs:!!e.hangs,glow:!!e.glow,turn:!!e.turn,flat:!!e.flat,story:e.story||null,tags:Object.freeze([...(e.tags||[])]),purpose:e.purpose?Object.freeze({...e.purpose}):null,action:e.action||null})));
export const propEntry=id=>PROP_REGISTRY.find(e=>e.id===id)||null;

/** An entry's purpose (a story prop's from STORY_PROPS). */
export async function propPurpose(id){
 const e=ENTRIES.find(x=>x.id===id);if(!e)throw Error(`No prop ${JSON.stringify(id)} in Studio's registry.`);
 return e.purpose?{...e.purpose}:await storyPurpose(e.story);
}

/**
 * Builds a prop fresh with World's own builder: {object (the builder's own object, unchanged), entry}. `THREE` is
 * World's three.js.
 */
export async function buildProp(id){
 const e=ENTRIES.find(x=>x.id===id);if(!e)throw Error(`No prop ${JSON.stringify(id)} in Studio's registry.`);
 const module=await e.load(),object=e.build(module);
 if(!object?.isObject3D)throw Error(`${e.source} did not build an object.`);
 return object;
}
