# Brief: the Minato Maru keeps her timetable (owner's decision, 21 October 2026)

The owner: "How to simplify so that the ferry doesn't have to wait for Nils", and, on the recommendation, "Yes proceed".
The decision is recorded in `johansson-town/AGENTS.md`. Read CLAUDE.md, AGENTS.md, johansson-town/AGENTS.md and
`briefs/HANDOFF-2026-10-21.md` first.

## Today: two rules make her wait

1. **She sails on request** (`FERRY_WORKING_DAY` in `src/people/ferry-crew.js`, "she sails on request within it").
2. **`holdFerry()`** in `src/island/play.js` (around lines 23–25: "Nobody sails off with a visitor walking her decks: a
   vehicle's crossing waits until he is ashore", with `game.js deckUnder`) holds any requested crossing while the player
   stands on her decks.

The chief's cover is already independent: Mac takes the watch whenever the player is ashore (`ferry-crew-aboard.js`).

## Build

- **One timetable.** The Harbour Line sailings (`HARBOUR_LINE`, the same data as the departures board in
  `sakura-office-dressing.js`) drive her departures and arrivals. No request starts or holds the Harbour Line; check
  where the requests come from (`airport-ferry.js`, `ferry-operations`, `play.js`) and route them to "next sailing".
- **Warnings.** Two town minutes before each departure:
  - the horn sounds (use the existing audio if there is one);
  - the gangway sign switches to 出港 · Departing;
  - on deck a context prompt offers **Go ashore** (walks him to the quay end of the gangway) or **Stay aboard**.
- **The gangway closes at departure.** Its collider and the access rules follow, so no one is left standing on a
  vanishing gangway: an NPC or the player on it at that moment is moved to the nearer end, believably.
- **Aboard at departure.** He crosses with her on his own feet. The ship's floors stay under him; reuse play.js's
  "afoot" ride. He can walk decks and the engine room. At the other berth the gangway opens and he can go ashore.
- **Missed her.** The board and the counter show the next sailing. The small quick crossing to Kitano-jima
  (`ferry-quick-crossing.js`) stays on request.
- **Chief's watch.** It is Nils's only while he is aboard during his working hours; otherwise Mac has it. Remove every
  dependency of the ship's day on the player (holdFerry and any "waiting for the chief" state).
- **Linux edition.** It keeps its full crew simulation. The timetable is the same in both editions.
- **Stories.** Feed the storyteller: missed ferry, last boat home at 22:15 (Thuan), waving from the quay.
- **Saves.** Old saves holding a requested or held crossing migrate to the timetable.

## Tests

- The new `tests/ferry-timetable.test.mjs`:
  - she departs on time with the player aboard, ashore and on the gangway;
  - the horn and prompt come two minutes before;
  - Go ashore lands him on the quay;
  - Stay aboard crosses with him and lands him at the other berth;
  - nobody is left on a closed gangway;
  - Mac has the watch when Nils is ashore;
  - the save migration works.
- The ferry, airport-ferry, ferry-walk, openings, enterable-sites and island-play tests.
- The CI guard (`node tools/ci-guard.mjs`) stays green; add the new test to `tests/ci-guard.txt`.
- Rebuild the runtime last. Never take main's `index.html` blindly when merging.

## Show the owner

Photos at 390×844 (the `?audit` harness):
- the gangway sign at T−2 minutes;
- the Go ashore / Stay aboard prompt;
- the crossing with him on deck;
- arrival at Kitano-jima.

Merge after the owner sees them. After that, fold it into the next Linux release.
