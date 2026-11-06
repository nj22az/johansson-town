/** One timber footprint for rendering, grounding and the nightly walk aboard. */
export const PORT_SHED=Object.freeze({id:'fujita-shed',x:-36.45,z:-58,width:3.6,depth:2.4,y:0,chair:[-36.1,-57.2],tv:[-36.3,-59.35]});
/**
 * The platform the shed stands on. Its west edge is the Shiosai's berth: it stood at x −38.85, inside her hull (which
 * reaches −38.81) and her tyres, so the pier now stops at −38.55 and three fender piles stand off it with their rubber
 * faces on the line of her side (2026-10-19).
 */
export const SHED_PIER=Object.freeze({minX:-38.55,maxX:-34.05,minZ:-61,maxZ:-53.75});
/** The walk round the shed, clear of the berth's kerb on the west (x −38.05) and of the rails on the other three sides. */
export const SHED_CIRCUIT=Object.freeze([[-38.05,-60.45],[-34.6,-60.45],[-34.6,-55.55],[-38.05,-55.55],[-38.05,-60.45]]);
/** The walkway from the Nishi-machi quay out to the platform, 2.2 m wide; its deck lands on the quay wall at z −49.95. */
export const SHED_WALKWAY=Object.freeze({minX:-38.45,maxX:-36.25,minZ:-53.75,maxZ:-49.5,quayFace:-49.95});

/**
 * Mr Fujita's pier as a dock builder sets it out (timber-pier.js): what holds it up, what stops you falling off it and
 * what the Shiosai is tied to. Every fitting has its reason beside it.
 */
const W=SHED_WALKWAY,P=SHED_PIER;
export const FUJITA_PIER=Object.freeze({
 id:'fujita-pier',top:.06,seabed:-2.6,
 decks:Object.freeze([
  // The walkway: two piles a bent, a bent 0.3 m off the quay wall and one half-way; its stringers run on to a
  // shelf on the wall (okinawa/quarters.js leaves the wall whole under it) and its south end rests on the
  // platform's first cap.
  Object.freeze({id:'walkway',...W,landing:W.quayFace,pileX:Object.freeze([-38.27,-36.43]),bents:Object.freeze([-50.25,-52.05]),stringersFrom:W.quayFace+.4,stringersTo:-54}),
  // The platform: three piles a bent (under its west edge, the shed's front and its east edge), bents at 1.75 m.
  Object.freeze({id:'platform',...P,pileX:Object.freeze([-38.37,-36.3,-34.23]),bents:Object.freeze([-53.9,-55.65,-57.4,-59.15,-60.85])}),
 ]),
 // The shed has its own floor of old pallet boards (port-shed.js); the deck stops round it.
 cutouts:Object.freeze([Object.freeze({minX:-37.65,maxX:-35.25,minZ:-59.8,maxZ:-56.2})]),
 rails:Object.freeze([
  // Where people walk beside open water: the walkway's east side, and the platform's three sides that are not the
  // berth. The west sides are working edges (the Shiosai's berth and her bow line) and have a kerb only.
  Object.freeze({from:[W.maxX-.07,W.quayFace+.1],to:[W.maxX-.07,P.maxZ+.1]}),
  Object.freeze({from:[W.maxX-.07,P.maxZ-.06],to:[P.maxX-.06,P.maxZ-.06]}),
  // The east rail opens for the ladder, closed by a chain; it meets the other two at their corner posts.
  Object.freeze({from:[P.maxX-.06,P.maxZ-.06],to:[P.maxX-.06,P.minZ+.06],trim:[.065,.065],gaps:Object.freeze([[6.08,6.62]])}),
  Object.freeze({from:[P.maxX-.06,P.minZ+.06],to:[P.minX+.06,P.minZ+.06]}),
 ]),
 kerbs:Object.freeze([
  // Broken round the bollard's base plate.
  Object.freeze({from:[W.minX+.06,W.maxZ],to:[W.minX+.06,-50.45]}),
  Object.freeze({from:[W.minX+.06,-50.95],to:[W.minX+.06,P.maxZ]}),
  // Broken where the gangway lands (z −54.65 to −53.75).
  Object.freeze({from:[P.minX+.06,-54.65],to:[P.minX+.06,P.minZ+.12]}),
  Object.freeze({from:[W.maxX-.06,W.maxZ],to:[W.maxX-.06,P.maxZ]}),
  Object.freeze({from:[W.maxX,P.maxZ-.06],to:[P.maxX,P.maxZ-.06]}),
  Object.freeze({from:[P.maxX-.06,P.maxZ-.12],to:[P.maxX-.06,-59.97]}),
  Object.freeze({from:[P.maxX-.06,-60.43],to:[P.maxX-.06,P.minZ+.12]}),
  Object.freeze({from:[P.maxX,P.minZ+.06],to:[P.minX,P.minZ+.06]}),
 ]),
 // The Shiosai lies against these, not against the pier's frame: rubber faces on the line of her side (x −38.81).
 fenders:Object.freeze([-55.4,-57.3,-59.2].map(z=>Object.freeze({x:-38.685,z,face:'west',edge:P.minX}))),
 // Down to the water from the platform's east side, for the skiff and for anyone who falls in.
 ladders:Object.freeze([Object.freeze({x:P.maxX,z:-60.2,face:'east',bottom:-1.5})]),
 cleats:Object.freeze([
  // Her stern line, on the berth's kerb at the platform's south-west corner.
  Object.freeze({x:P.minX+.06,z:-60.62,along:'z',onKerb:true,line:'stern line'}),
 ]),
 // Her head line, led forward to the walkway near the quay, clear of the gangway.
 bollards:Object.freeze([Object.freeze({x:-38.22,z:-50.7,line:'head line'})]),
});
