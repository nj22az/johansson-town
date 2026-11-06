/** The fitted furniture is shared by Minato and Sato's kitchen, in room metres.
 * Authored placements: no runtime randomisation and no change to the serving lanes.
 */
export const MINATO_WALNUT_LAYOUT=Object.freeze({
 floor:.04,
 serviceTop:.78,
 backbar:Object.freeze({file:'minato-walnut-backbar.glb',name:'Minato walnut back bar',position:Object.freeze([-2.875,.04,-5.95]),width:3.39,depth:.64,height:2.641,worktop:1.03}),
 counter:Object.freeze({file:'minato-walnut-counter.glb',name:'Minato walnut counter',position:Object.freeze([-.8,.04,-2.34]),width:8.4,depth:.83,height:.74}),
});

/** Original fictional stock. Thao chooses the range; Sakura Trading supplies it (Higa Liquor did until it closed).
 * Local awamori anchors a harbour bar whose visiting crews also order familiar spirits.
 * Keeping the descriptions as data makes this stock available to the storyteller.
 */
export const MINATO_FICTIONAL_SPIRITS=Object.freeze([
 ['sango_quay','Sango Quay','Awamori','The everyday Okinawan pour for local regulars.'],
 ['hoshinami','Hoshinami','Aged awamori','A slower island reserve for an evening conversation.'],
 ['greywake','Greywake','Single malt whisky','A coastal whisky for visiting crews.'],
 ['copper_ledger','Copper Ledger','Bourbon whiskey','An American whiskey for the harbour trade.'],
 ['juniper_sound','Juniper Sound','Dry gin','A botanical base for a simple long drink.'],
 ['marrow_cay','Marrow Cay','Aged dark rum','An oak-aged rum for travellers from warmer ports.'],
 ['northglass','Northglass','Vodka','A clear spirit for straightforward mixed drinks.'],
 ['maison_veyrille','Maison Veyrille','VSOP brandy','A small after-supper brandy selection.'],
 ['rosso_lunaro','Rosso Lunaro','Vermouth rosso','The herbal wine aperitif in the mixing stock.'],
 ['nami_yuzu','Nami Yuzu','Citrus liqueur','An island citrus choice beside the local awamori.'],
 ['canto_rubino','Canto Rubino','Bitter aperitivo','A bitter citrus option before supper.'],
 ['sierra_candela','Sierra Candela','Tequila blanco','An imported agave spirit for visiting sailors.'],
 ['orchard_hour','Orchard Hour','Pear liqueur','A gentle fruit liqueur after the meal.'],
 ['black_tide','Black Tide','Coffee liqueur','A dark coffee finish to the evening.'],
].map(([id,name,spirit,reason])=>Object.freeze({id,name,spirit,reason,owner:'Thao',supplier:'Sakura Trading',fictional:true,place:'izakaya'})));

export const MINATO_WALNUT_STORY=Object.freeze({
 title:'Thao’s back bar',
 text:'Thao chose this walnut cabinet for Minato. Sakura Trading supplies its fourteen house brands: local awamori, visiting crews’ whiskies and a small selection for mixed drinks. Each bottle has its own label. The brass rails keep the stock in place, and the low matching counter leaves the conversation open.',
 owner:'Thao',supplier:'Sakura Trading',brands:MINATO_FICTIONAL_SPIRITS,
});
