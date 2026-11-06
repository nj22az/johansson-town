/**
 * What the residents own and keep: one small thing each that they carry or keep close, so a
 * story can lose it, find it, lend it or ask where it came from. Nothing is random: every thing
 * has a reason in the resident's life, and wherever possible it is the thing their own guide
 * entry already mentions (canon). Where it came from is real too: one of the town's suppliers
 * (merchandising.js SUPPLIERS), the resident's workplace, a family, or another resident.
 *
 *   what    the thing, written to follow "my" and "the" ("bait box", not "a bait box"); one
 *           thing, so a story can say "it"
 *   tale    one short line about it (60 characters at most, so a comic caption stays small and
 *           clear of faces) that a story can narrate as it stands
 *   from    a SUPPLIERS id, 'work' (issued by their workplace), 'own' (brought or made by them),
 *           'family' (handed down), 'won', or the name of the resident who gave or made it
 *   keeps   where it lives when it is not in their hand, as a place phrase ("in his jacket pocket")
 *   canon   true when the resident's guide entry (guide/residents.json) names the thing itself
 *
 * Tests hold every resident to at least one thing and every source to a real one; the
 * storyteller's "lost" stories lose these.
 */
export const BELONGING_SOURCES=Object.freeze(['work','own','family','won']);

// The stationery the town had from Front-Row is Sakura's trade since 22 October 2026 (merchandising.js SUPPLIERS.sakura
// `stationery`): the notebooks, the pens and the books below are bought there now.

export const BELONGINGS=Object.freeze({
 Johansson:[{what:'second notebook',from:'sakura',keeps:'in his jacket pocket',canon:true,
  tale:'The harbour has one notebook. Everything else has this one.'}],
 Thuan:[{what:'notebook of supplier names',from:'own',keeps:'in the drawer under Sakura’s till',canon:true,
  tale:'Thuan wrote every supplier’s name in it, her first year.'}],
 Thao:[{what:'tag pen',from:'sakura',keeps:'behind Minato’s counter, by the bottle keep',canon:false,
  tale:'Every bottle tag in Minato’s keep was written with it.'}],
 'Mrs Sato':[{what:'aluminium delivery box',from:'own',keeps:'on the shelf by Sato Ramen’s door',canon:true,
  tale:'At noon it carries two bowls to the harbour office.'}],
 Nhung:[{what:'pad of bookmark slips',from:'sakura',keeps:'in her satchel',canon:true,
  tale:'Nhung tucks its slips into books she wants found.'},
  // The doctor's bag came with the post when Dr Kakazu retired into her (22 October 2026).
  {what:'doctor’s bag',from:'work',keeps:'by the clinic door',canon:false,
  tale:'It goes on every house call, on foot or by car.'}],
 Chin:[{what:'tool roll',from:'own',keeps:'on the workshop bench',canon:true,
  tale:'Chin lines up its tools before any new repair.'}],
 Tetsuo:[{what:'pocket radio',from:'own',keeps:'in his shirt pocket, switched on',canon:true,
  tale:'Chin repaired it twice. Tetsuo is still finding screws.'}],
 'Officer Mori':[{what:'report book',from:'sakura',keeps:'on the kōban desk',canon:true,
  tale:'Three pages in it about a night when nothing happened.'}],
 'Harbour master':[{what:'pocket tide table',from:'work',keeps:'in his breast pocket',canon:false,
  tale:'The Harbour master trusts it over the radio forecast.'}],
 'Miss Higa':[{what:'crossword book',from:'sakura',keeps:'on the bandai',canon:true,
  tale:'Miss Higa finishes a clue in it before taking coins.'}],
 'Grandmother Higa':[{what:'old bus cap',from:'family',keeps:'on the hook inside her front door',canon:false,
  tale:'Her husband wore it for thirty years on the island bus.'}],
 Kōji:[{what:'tally board',from:'work',keeps:'on his sorting bench',canon:false,
  tale:'Kōji marks every sorted crate on it before dawn.'}],
 Riku:[{what:'football',from:'own',keeps:'beside the front door at 3 Kitahama',canon:true,
  tale:'Riku kicks it through Harbour Park before supper.'}],
 Vy:[{what:'satchel',from:'own',keeps:'over her shoulder',canon:true,
  tale:'It is full of kanji, minus the ten Vy has not learned.'}],
 // The eleven who joined the guide in phase 5 of docs/CAST-CONSOLIDATION.md: the ship's people, the port clerk, the
 // doctor and the relief engineer, each with the one thing their work or their day puts in their hand.
 Mac:[{what:'reading glasses',from:'own',keeps:'in his boiler-suit breast pocket',canon:false,
  tale:'He needs them for the gauges and denies it.'}],
 'Ms Uezu':[{what:'marlinspike',from:'work',keeps:'on her belt, aft',canon:false,
  tale:'Every splice on the ferry’s lines is hers.'}],
 'Ms Ganaha':[{what:'date stamp',from:'work',keeps:'on the counter by her window',canon:false,
  tale:'Every parcel on the shelf carries its mark.'}],
 'Mr Fujita':[{what:'television remote',from:'own',keeps:'on the arm of his chair in the shed',canon:false,
  tale:'He has the remote and no patience.'}],
 Ryo:[{what:'fifth-grade deck licence',from:'own',keeps:'in his cabin drawer',canon:true,
  tale:'Six years on the Kerama ferries, and it says so.'}],
 Ren:[{what:'heaving line',from:'work',keeps:'on its hook at the forward station, coiled',canon:true,
  tale:'Kai on the Kitano pier catches it most times.'}],
 Aya:[{what:'passenger book',from:'work',keeps:'in the drawer at the purser’s window',canon:true,
  tale:'The count goes to the bridge before she does.'}],
 Jun:[{what:'galley ladle',from:'own',keeps:'on its hook over the three-plate range',canon:false,
  tale:'Twenty years of cargo-boat galleys in one handle.'}],
 Kai:[{what:'straw hat',from:'own',keeps:'on the nail inside the Shiroma house door',canon:true,
  tale:'The sun on the water is the sun twice over.'}],
});

/** A resident's things (empty if they have none on record). */
export const belongingsOf=name=>BELONGINGS[name]||[];


/** The retired family’s belongings stay as historical story material, never in the live inventory. */
export const RETIRED_BELONGINGS=Object.freeze({
 'Mrs Nakamura':[{what:'bean ladle',from:'family',keeps:'on the hook over the bean pot',canon:false,
  tale:'Her mother’s ladle: the beans on at six since 1972.'}],
 Mai:[{what:'rabbit-feed tin',from:'own',keeps:'under the class rabbit’s hutch',canon:false,
  tale:'The rabbit eats before the class does, every morning.'}],
});
