/**
 * Minato's ground, as one rulebook: every outdoor surface the town is paved, planted or sanded with, how high its top
 * is, what colour it is, how it is finished, where it belongs and why, and what has to stand between it and each
 * neighbour.
 *
 * The owner, 21 October 2026, on his phone: "the roads seems to have reversed to chaos again… Can you make a plan to
 * finally fix the roads to a unified system? Pavement? Walk paths, grass and sandy beach?" (approved: "Go ahead").
 * A survey that day found about twenty modules each drawing their own ground slab, about thirty colours where the
 * palette had seven, about fifteen top heights where the layers named three, four kerbs and no rule for where two
 * surfaces meet. This module is that rule. The plan of record is docs/GROUND-STANDARD.md; the audit that measures the
 * town against it is tools/ground-audit.mjs, and tests/ground-standard.test.mjs keeps the town from getting worse
 * (a ratchet: today's violations are listed in tests/fixtures/ground-baseline.json and the list may only shrink).
 *
 * The town is a small Okinawan port of the late 1990s, as a prefectural public-works office would have paved it:
 * dark grey asphalt carriageways, raised footways behind a 15 cm precast kerb (歩車道境界ブロック), Main Street's
 * footways and shop fronts relaid in reddish and beige interlocking blocks (the shōtengai renewals of the decade),
 * pale grey-beige poured concrete for the quay, aprons and yards, back lanes of patched asphalt with a white edge
 * line and a U-gutter (U字溝) at the plot, crushed-coral yards behind coral-stone walls, lawns edged in stone, and
 * the coral-white beach graded to the sea.
 *
 * Heights are the top of the finished surface above its district's datum (DISTRICTS[].datum, the town datum 0 of
 * layout.js planHeight), in metres. Colours are sRGB hex, the material colour (the painted textures of
 * render/toy-surfaces.js are near-neutral and only carry detail).
 *
 * Steps 2 to 4 of the plan move the town onto these numbers. Until a family is moved, `drawn` is the tone the town
 * draws it in today, and the old exports (render/ground-palette.js GROUND, world/ground-layers.js GROUND_LAYER,
 * world/road-standards.js ROAD_STANDARD.kerb) are thin re-exports of this module, so nothing changes until a step
 * changes it on purpose.
 */

/** The town datum: layout.js planHeight is 0 on the town's finished plan. */
/** The kerb's height, which is also how far Main Street's carriageway lies under the town's datum. */
const GROUND_EDGE_KERB_HEIGHT=.15;
export const DATUM=0;
/**
 * Main Street's datum lies one kerb under the town's (step 2, 21 October 2026). The rulebook puts the footways a kerb
 * above the carriageway; the street was brought to it by lowering the carriageway and its bays, not by raising the
 * footways, so every shop door, step, drinks machine, bench and lamp on the footway stands where it always stood, and the
 * footways stay flush with the yard, the park and the lawns behind them. The carriageway is graded back up to the town's
 * datum where it leaves the street (ground-plan.js).
 */
export const MAIN_STREET_DATUM=DATUM-GROUND_EDGE_KERB_HEIGHT;
/** The open island ground outside the town lies 40 cm under the datum (layout.js planHeight, "island-ground"). */
export const ISLAND_DATUM=-.42;
/** Two surfaces that overlap in plan keep at least this much between them (tests/ground-clearance.test.mjs). */
export const GROUND_CLEARANCE=.015;

/** The edge elements: what is built where two classes meet. Sizes in metres. */
export const GROUND_EDGE=Object.freeze({
 /** Precast concrete kerb (歩車道境界ブロック) between a carriageway and a raised footway, dropped flush at crossings. */
 kerb:Object.freeze({id:'kerb',name:'Concrete kerb',height:GROUND_EDGE_KERB_HEIGHT,width:.18,colour:0xcac6bb,legacy:Object.freeze([0xd9d6cc,0xd3cec2,0xcdc7ba,0xc9c3b4]),
  why:'The road structure ordinance divides footway from carriageway with a 15 cm kerb; it is the step a pram is lifted over.'}),
 /** A back lane has no footway: a white edge line (外側線) 30 cm in, then a U-gutter along the plot boundary. */
 line:Object.freeze({id:'line',name:'White edge line',width:.15,inset:.3,colour:0xf2efe6,
  why:'A lane too narrow for a footway marks the walking strip with a solid white line instead.'}),
 /** The U-gutter (U字溝) along a lane's plot side. */
 gutter:Object.freeze({id:'gutter',name:'U-gutter with concrete lids',width:.3,colour:0x8d918f,
  /** Kitahama's gutters (okinawa/lane-edges.js): lid tints, the dark channel, the gratings. */
  legacy:Object.freeze([0xa3a198,0x9a988f,0xaaa89f,0x9f9c92,0x46443f,0x4d5154,0x6a6f72]),
  why:'Rain off the lane and the plots runs in a 30 cm U-gutter at the boundary; its lids are flush with the lane.'}),
 /** Thin stone edging where a path meets planted ground; its top is flush with the path. */
 edging:Object.freeze({id:'edging',name:'Stone edging',width:.1,colour:0x9e9a8f,legacy:Object.freeze([0x9e9b93,0x9a958a]),
  why:'Lawn grows over an unedged path within a season; a row of setts holds the line.'}),
 /** Coral-stone edging where crushed coral meets another surface, as the yards are walled. */
 coralEdging:Object.freeze({id:'coral-edging',name:'Coral-stone edging',width:.15,colour:0xd8cfba,legacy:Object.freeze([0xcfc8b4,0xe6e0d0]),
  why:'Crushed coral walks off its yard on every shoe; a coral-stone kerb keeps it in, the same stone as the walls.'}),
 /** The quay's edge: a coping stone at the water, its face painted safety yellow where boats come alongside. */
 coping:Object.freeze({id:'coping',name:'Quay coping',width:.3,colour:0xe0b93a,legacy:Object.freeze([0xa9a497]),
  why:'The quay ends at a coping, not at a slab edge: the line a deckhand steps from, painted so it is seen at night.'}),
 /** Road paint and the yellow tactile blocks are markings: they lie on a class, they are not one. */
 paint:Object.freeze({id:'paint',name:'Road paint',colours:Object.freeze([0xf2efe6,0xd6c8a7,0xe7c04a]),
  why:'White lines, bays and stop lines (road-standards.js); the yellow centre line on Kitano Road.'}),
 /** 点字ブロック. */
 tactile:Object.freeze({id:'tactile',name:'Tactile blocks',colour:0xf2c230,
  why:'Yellow warning blocks where a footway meets a crossing.'}),
});

/**
 * The districts, in the order they are asked (the first that contains a point owns it), with the datum their
 * ground is measured from. Bounds mirror the layout modules (main-road.js, east-lawn.js, west-yard.js,
 * school-layout.js, harbour-park-plan.js, okinawa/layout.js, kitahama-layout.js); tests/ground-standard.test.mjs
 * checks that they still agree. Kitano-jima is a separate island and keeps its own terrain (AGENTS.md).
 */
export const DISTRICTS=Object.freeze([
 {id:'harbour',name:'The harbour: quays, piers, docklands and the east quay',minX:-45,maxX:55,minZ:-110,maxZ:-38,datum:DATUM},
 {id:'main-street',name:'Main Street and the bus plaza',minX:-7.55,maxX:5.2,minZ:-38,maxZ:29.3,datum:MAIN_STREET_DATUM},
 {id:'harbour-park',name:'Harbour Park',minX:5.2,maxX:32.5,minZ:-36.2,maxZ:-3.6,datum:DATUM},
 {id:'school',name:'Minato school',minX:12.4,maxX:40.6,minZ:24.6,maxZ:45.1,datum:DATUM},
 {id:'east-lawn',name:'The east lawn and the East Row',minX:5.2,maxX:33.2,minZ:-38,maxZ:29.3,datum:DATUM},
 {id:'beach',name:'The east beach',minX:33.2,maxX:55,minZ:-38,maxZ:30.5,datum:DATUM},
 {id:'west-yard',name:'The west yard behind the shops',minX:-24.6,maxX:-7.55,minZ:-38,maxZ:29.3,datum:DATUM},
 {id:'nishi-machi',name:'Nishi-machi',minX:-45,maxX:-24.6,minZ:-38,maxZ:29.3,datum:DATUM},
 {id:'kitahama',name:'Kitahama and the north',minX:-45,maxX:55,minZ:29.3,maxZ:100,datum:DATUM},
].map(Object.freeze));
export function districtAt(x,z){return DISTRICTS.find(d=>x>=d.minX&&x<d.maxX&&z>=d.minZ&&z<d.maxZ)?.id??'outside';}

/**
 * The classes. `top` is the finished top above the datum, `tolerance` how far a drawn top may stray, `graded` a
 * surface that follows the land (checked between `range`), `colour` the standard, `drawn` the tone the town draws
 * it in today until its step moves it (absent where the two agree), `legacy` other tones of it that the survey
 * found, `where` the districts it belongs in and `why` the reason it is there.
 */
export const GROUND_CLASSES=Object.freeze(Object.fromEntries([
 {id:'road',name:'Asphalt road',finish:'dense asphalt, dark grey, patched where dug up and made good',
  colour:0x5f6266,drawn:0xa9aeb4,top:.04,tolerance:.012,
  where:['main-street','harbour','kitahama','east-lawn'],
  why:'Main Street, Kitano Road, the quay driveway and the car parks carry vehicles; 1990s Okinawan asphalt is dark grey, never the blue-grey the town drew. The carriageway is the datum the rest is measured from.'},
 {id:'lane',name:'Back lane (asphalt)',finish:'thin asphalt over concrete, patched; no footway',
  colour:0x676a6c,top:.04,tolerance:.012,
  where:['kitahama','nishi-machi','west-yard','school'],
  why:'Kitahama, Nishi and the lanes between houses are shared by people, bicycles and the odd kei truck; too narrow for a footway, so a white edge line and a U-gutter mark the plot side. Kitahama\'s north lane runs along the town hall\'s back wall, over the old school\'s seawall line (the school district).'},
 {id:'pavers',name:'Brick pavers',finish:'interlocking concrete blocks, reddish and beige, running bond',
  colour:0xb0907a,drawn:0xc6c3ba,legacy:[0xcfc8b4],top:.19,tolerance:.015,
  where:['main-street'],
  why:'Main Street\'s footways and shop fronts only: the shōtengai was relaid in coloured interlocking blocks in the 1990s. A kerb on the road side, a building on the other.'},
 {id:'concrete',name:'Concrete',finish:'poured concrete in 2 m bays, broom finish, saw-cut joints',
  colour:0xc4c0b4,drawn:0xb7b5ab,legacy:[0xb9b0a0,0xb6b2a5,0xaca58c,0x999b94,0x9a968c,0x8e8a7c,0xb9b4a8],top:.19,flushTop:.04,tolerance:.015,
  where:['main-street','harbour','east-lawn','west-yard','school','kitahama','nishi-machi','harbour-park','beach'],
  why:'Aprons, forecourts, yards and every footway that is not Main Street\'s: pale grey-beige poured concrete, at kerb height beside a road; a walk or a yard with no road beside it lies flush with the ground around it (flushTop), as a park path does.'},
 {id:'quay',name:'Quay concrete',finish:'heavy poured concrete, salt-stained, with a coping at the water',
  colour:0xb3b0a6,legacy:[0x909386,0x8b9192,0x8c918b,0x999283],top:.04,tolerance:.08,
  where:['harbour'],
  why:'The quays and piers are at their own level for the boats; trucks drive onto them from the road flush, and the coping stone is the edge at the water.'},
 {id:'park-path',name:'Park path',finish:'rolled crushed stone, pale',
  colour:0xcbb994,legacy:[0xcfc2a0,0xd2c39d,0xc6b58c],top:.04,tolerance:.012,
  where:['harbour-park','school','east-lawn'],
  why:'Harbour Park, the school grounds and the east lawn are walked on paths flush with the grass, held by a thin stone edging.'},
 {id:'grass',name:'Grass',finish:'mown lawn',
  colour:0x5c9848,top:.02,tolerance:.015,alsoAt:[ISLAND_DATUM],graded:true,range:[-.5,.04],
  where:['harbour-park','east-lawn','west-yard','school','kitahama','nishi-machi','beach'],
  why:'Lawns and verges sit just below the paths that cross them, so a path never has grass growing over its edge; on the open island the grass follows the land.'},
 {id:'coral-sand',name:'Coral sand',finish:'crushed coral, raked',
  colour:0xddd6c4,drawn:0xe2dac8,legacy:[0xd6cab3,0xd9cdb0,0xf1efe6],top:.02,tolerance:.015,
  /** A pad rolled on a sub-base where wheels or feet work it (Kitahama's monthly parking, the eisa ground), 25 mm proud of the lawn as a dug bed is (step 3). */
  raisedTop:.045,
  where:['nishi-machi','kitahama'],
  why:'Nishi-machi\'s yards between the coral walls are crushed coral, as old Okinawan house yards were, and so are Kitahama\'s unpaved lots (the parking, the hoop pad); at the level of a lawn, edged in coral stone.'},
 {id:'beach-sand',name:'Beach sand',finish:'coral-white beach sand',
  colour:0xeee3c6,legacy:[0xe3d2a4,0xcdb88c,0xe8dfc6],top:-.1,graded:true,range:[-1.3,.06],
  /**
   * The band the tide wets (step 4): below `wetBelow` the sand is wet and darker, blending into the dry over `wetBlend`
   * of height above it (6 cm, about two metres of beach: 2 cm drew a hard line, the owner's phone, 21 October 2026).
   */
  wet:0xc8b48e,wetBelow:-.32,wetBlend:.06,
  where:['beach','kitahama','nishi-machi','harbour-park','harbour'],
  why:'The coast (and, in the harbour district, the beach\'s south end beside the east quay north of the oil jetty): coral-white sand that slopes to the sea, a band of wet sand at the water, and is graded, never stepped, where anything firm meets it.'},
 {id:'gravel',name:'Gravel yard',finish:'grey crushed limestone',
  colour:0xa29e93,top:.02,tolerance:.015,
  where:['harbour','nishi-machi','kitahama','school'],
  why:'Work yards, the boat yard and the sacred grove: ground that takes a trailer or is left as it was, edged like a lawn. At the old school, the power house\'s fenced compound (briefs/town-hall-zone.md, phase S).'},
 {id:'earth',name:'Garden earth',finish:'red Okinawan earth (kunjan), dug or ridged',
  colour:0x9a5f40,legacy:[0xb07a52,0x93593b,0x6f6048],top:.045,tolerance:.03,
  where:['kitahama','nishi-machi','school','harbour-park'],
  why:'The vegetable plots, the cane rows and the beds of Kitahama and Nishi, the town hall\'s flower bed and Harbour Park\'s flower beds (harbour-park-garden.js): the red earth of the island, 25 mm proud of the lawn where it is dug (okinawa/lots.js lotGround).'},
 {id:'deck',name:'Timber deck',finish:'treated timber boards',
  colour:0x8a7559,legacy:[0xaaaaaa,0xc8c1af,0x846449,0x95714f,0x9d7b5b,0x8e6b4c],top:.04,tolerance:.08,
  where:['harbour'],
  why:'The boardwalks and the timber piers, at the quay\'s level; they abut the concrete flush.'},
].map(c=>[c.id,Object.freeze({...c,legacy:Object.freeze(c.legacy||[]),where:Object.freeze(c.where)})])));

/**
 * What must stand between two classes where they meet. `edge`: 'kerb' (a 15 cm step, GROUND_EDGE.kerb), 'line-gutter'
 * (white edge line on the lane, U-gutter at the plot), 'edging' (stone edging), 'coral-edging', 'graded' (no step, the
 * softer surface is graded up to meet the firmer), 'flush' (a joint and nothing else). A pair not listed takes stone
 * edging: two surfaces never simply touch.
 */
export const GROUND_EDGES=Object.freeze([
 ['road','pavers','kerb','The footway is a kerb above the carriageway.'],
 ['road','concrete','kerb','Every footway beside a road is behind a kerb.'],
 ['road','grass','kerb','A verge is kept off the road by a kerb, never left to crumble the asphalt edge.'],
 ['road','park-path','kerb','A park path meets a road at a dropped kerb and a crossing.'],
 ['road','coral-sand','kerb','Crushed coral is kept off the road by a kerb.'],
 ['road','gravel','kerb','A gravel yard meets a road behind a kerb.'],
 ['road','lane','flush','A lane joins the road on its own level (a stop line, not a step).'],
 ['road','quay','flush','Trucks drive from the road onto the quay.'],
 ['road','deck','flush','The boardwalk is driven on at its ends.'],
 ['lane','concrete','line-gutter','A lane meets a plot\'s apron at its edge line and gutter.'],
 ['lane','grass','line-gutter','A lane meets a garden at its edge line and gutter.'],
 ['lane','coral-sand','line-gutter','A lane meets a coral yard at its edge line and gutter.'],
 ['lane','gravel','line-gutter','A lane meets a work yard at its edge line and gutter.'],
 ['lane','park-path','flush','A path leaves the lane on its own level.'],
 ['lane','pavers','kerb','A lane reaching Main Street meets its footway at a kerb.'],
 ['lane','quay','flush','Nishi\'s lanes run out onto the quay.'],
 ['pavers','concrete','flush','The paving changes at a shop front or a side street with a joint.'],
 ['pavers','park-path','flush','The park opens off Main Street\'s footway.'],
 ['pavers','grass','edging','A tree pit or verge in the footway is edged.'],
 ['concrete','quay','flush','An apron runs out onto the quay.'],
 ['concrete','park-path','flush','A forecourt opens onto a path.'],
 ['concrete','grass','edging','An apron meets a lawn at a stone edging.'],
 ['concrete','coral-sand','coral-edging','An apron meets a coral yard at a coral-stone edging.'],
 ['concrete','gravel','edging','An apron meets a gravel yard at an edging.'],
 ['concrete','deck','flush','A deck abuts its landing flush.'],
 ['quay','deck','flush','A timber pier abuts the quay flush.'],
 ['quay','gravel','flush','The boat yard runs out onto the quay.'],
 ['park-path','grass','edging','A path is held by a thin stone edging.'],
 ['park-path','coral-sand','coral-edging','A path meets crushed coral at a coral-stone edging.'],
 ['park-path','beach-sand','graded','A path comes down onto the beach graded, never stepped.'],
 ['grass','coral-sand','coral-edging','A lawn meets crushed coral at a coral-stone edging.'],
 ['grass','beach-sand','graded','The lawn runs down into the beach.'],
 ['grass','gravel','edging','A lawn meets gravel at an edging.'],
 ['coral-sand','beach-sand','graded','A coral yard opens onto the beach graded.'],
 ['concrete','beach-sand','graded','A slipway or ramp comes down onto the beach graded.'],
 ['quay','beach-sand','graded','A slipway runs from the quay down into the sand.'],
 ['earth','grass','flush','A dug plot simply ends at the lawn.'],
 ['earth','lane','line-gutter','A plot meets the lane at its edge line and gutter.'],
 ['earth','concrete','edging','A bed meets an apron at an edging.'],
 ['earth','gravel','edging','A plot meets a gravel yard at an edging.'],
 ['earth','coral-sand','coral-edging','A plot in a coral yard is edged in coral stone.'],
].map(([a,b,edge,why])=>Object.freeze({between:Object.freeze([a,b]),edge,why})));
const edgeIndex=new Map(GROUND_EDGES.map(r=>[[...r.between].sort().join('|'),r]));
/** The rule where class a meets class b (the same class meets itself flush). */
export function edgeRule(a,b){
 if(a===b)return {between:[a,b],edge:'flush',why:'One surface.'};
 return edgeIndex.get([a,b].sort().join('|'))||{between:[a,b],edge:'edging',why:'Two surfaces never simply touch; unlisted pairs take a stone edging.'};
}
/** The finished top a class should have in a district (its datum plus the class's top). */
export function expectedTop(classId,districtId){
 const c=GROUND_CLASSES[classId],d=DISTRICTS.find(x=>x.id===districtId);
 return (d?d.datum:DATUM)+c.top;
}
/** Every top a class may have in a district: its top, its flush top where it has one, and its other datums. */
export function allowedTops(classId,districtId){
 const c=GROUND_CLASSES[classId],d=DISTRICTS.find(x=>x.id===districtId),datum=d?d.datum:DATUM;
 return [datum+c.top,...(c.flushTop!==undefined?[datum+c.flushTop]:[]),...(c.raisedTop!==undefined?[datum+c.raisedTop]:[]),...(c.alsoAt||[]).map(a=>a+c.top)];
}

/** The town's ground palette as drawn today (render/ground-palette.js GROUND re-exports it): each family's `drawn` tone. */
const drawn=id=>GROUND_CLASSES[id].drawn??GROUND_CLASSES[id].colour;
export const GROUND=Object.freeze({
 /** Main road and lanes that cars use. */
 asphalt:drawn('road'),
 /** Footways and shop forecourts: small interlocking pavers. */
 pavers:drawn('pavers'),
 /** Quays, piers, village lanes, yards and plinths: poured concrete. */
 concrete:drawn('concrete'),
 /** The old quarter's crushed-coral ground between the walls. */
 coral:drawn('coral-sand'),
 /** The beach and the gateball court. */
 sand:drawn('beach-sand'),
 /** The sacred grove and the work yard: grey gravel. */
 gravel:drawn('gravel'),
 /** Lawns, park and open land: one green. */
 grass:drawn('grass'),
});

/**
 * The layers the town draws its slabs at today (world/ground-layers.js GROUND_LAYER re-exports it). Grass and gravel
 * are their classes' tops and the lane layer is the carriageway's; `apron` is the old "surface of its own laid over the
 * lanes", which the rulebook replaces with concrete at kerb height (steps 2 to 4 retire it).
 */
export const GROUND_LAYER=Object.freeze({
 grass:GROUND_CLASSES.grass.top,
 gravel:GROUND_CLASSES.gravel.top,
 lane:GROUND_CLASSES.road.top,
 apron:.06,
});
