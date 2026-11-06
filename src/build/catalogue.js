/**
 * What the builder can place outdoors. Every piece says who it is for and why a street would have it, so a placement is
 * never random: the builder adds the reason for this particular spot (placements.js `note`).
 *
 * `make` is the prop factory's builder (prop-factory.js), called as factory[make](x,z,yaw). `ground` says where it
 * belongs; the rules in placements.js only check that the spot is walkable ground, clear and not in a doorway.
 */
export const BUILD_CATALOGUE=Object.freeze([
 {id:'bench',name:'Bench',make:'bench',ground:'pavement, park, quay',purpose:'Somewhere to sit for people waiting, resting or watching the harbour; older residents walk further when there is a bench on the way.'},
 {id:'postbox',name:'Postbox',make:'postbox',ground:'pavement',purpose:'Letters and postcards; residents post on their way to work, so it belongs on a walking route.'},
 {id:'notice-board',name:'Notice board',make:'noticeBoard',ground:'pavement, square',purpose:'Town news, lost cats and events; people stop and read, which starts conversations.'},
 {id:'newspaper-rack',name:'Newspaper rack',make:'newspaperRack',ground:'pavement by a shop',purpose:'The morning paper for commuters, next to the shop that sells it.'},
 {id:'bicycle-rack',name:'Bicycle rack',make:'bicycleRack',ground:'pavement, station',purpose:'Parking for people who cycle to the shops or the ferry.'},
 {id:'menu-board',name:'Menu board',make:'menuBoard',ground:'outside a restaurant',purpose:"Tonight's dishes, set out by the restaurant's door to bring people in."},
 {id:'crate-stack',name:'Stack of crates',make:'crateStack',ground:'yard, quay, back door',purpose:'Deliveries waiting to be unpacked; they show that a shop is supplied from somewhere.'},
 {id:'utility-cabinet',name:'Utility cabinet',make:'utilityCabinet',ground:'pavement edge',purpose:"The street's electrics and phone lines; one stands near every block it serves."},
 {id:'convex-mirror',name:'Traffic mirror',make:'convexMirror',ground:'a blind corner',purpose:'Lets drivers and cyclists see round a corner they cannot see past.'},
 {id:'bait-station',name:'Bait station',make:'baitStation',ground:'quay',purpose:'Bait and ice for the people who fish from the pier.'},
 {id:'pier-winch',name:'Pier winch',make:'pierWinch',ground:'quay, pier',purpose:'Hauls boats and heavy loads up from the water.'},
]);

export const catalogueEntry=kind=>BUILD_CATALOGUE.find(e=>e.id===kind)||null;
