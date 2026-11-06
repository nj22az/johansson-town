# Progress · 6r the plant

## Task
6r-1: the pipes built in 3D from the piping diagrams (see sources/task.md).

## Outputs
- `src/world/ferry-pipe-routes.js` (lanes, router, segments and bends), the anchors and routed runs in `src/world/ferry-interior.js` (`FERRY_INTERIOR.pipes`, `.anchors`), `tests/ferry-pipes.test.mjs`, sheets 5 and 7 with the runs.

## Completed
- Audit (2026-10-13): 37 hand-painted runs, none from data; no machinery state. Baseline tris 66 170 (budget 70 000).

## Completed (6r-1)
- 151 anchors, 172 routes; the hand-painted runs removed; the service tank lowered to 1.55 m (0.75 m wide) so the lanes pass over it; the bilge wells moved to the aisle's aft end (the ladder foot was over one); the hydrophore's 300 L pressure tank built in the aux room; the priming pumps built at the engines' forward feet; overboard valves, tank-top stubs, penetrations drawn.

## Decisions
- Anchors live beside the machines in ferry-interior.js (the coordinates are known there); the router is its own module.
- Out of scope for 6r-1: pipes beyond the machinery spaces; they end at a penetration (deckhead, bulkhead, tank top).
- Low lanes (bilge, ballast, lubricating oil) run under the floor plates, as they do on a ship: invisible but routed and tested; a machine's own circuit (jacket water, lubricating oil on an engine) hugs the machine, the router trying both orders round it.
- Cross-ship runs follow the forward bulkhead of each room, never the aft one (the switchboard stands there).
- The budget: 95 442 triangles in one merged mesh; raised to 100 000.

## Reviewed (2026-10-13)
- A separate reviewer (general-purpose agent, given the output paths, checks.md and the sources) found: suctions run straight across the walkways; compartment crossings stacked on one line and through the aux room's bulkhead; the storeP→vP loop; no penetration pieces or overboard valves drawn; collinear bars drawn twice. All fixed (low lanes for suctions, crossings by compartment and staggered, the near case, rings and stems, spans merged) and the walkway and bulkhead checks added to `tests/ferry-pipes.test.mjs`.
- `src/world/ferry-plant.js` (6r-2's core) written and tested (5 tests); not wired into the game yet.

## Completed (6r-2)
- `ferry-plant-controls.js` (stations, labels, menus, liveValue, plantSound, telegraphFor); `ferry.js` runs the plant by the clock and her phase; `ferry-interior.js` live keys on 35 plates and the alarm matrix as one plate; `ferry-model.js` redraws live plates (`ferry.userData.readPlant`); `town-audio.js` ENGINE generators/emergency; `game.js` plantStation menus; the console note removed from ferry-inspect.js. Tests: `tests/ferry-plant-game.test.mjs`.
- 6r-1 published: run 88 succeeded (57d4612e).

## Open issues
- 6r-3: overhaul scenes (covers off, parts on the plates) when a machine is opened; crew bodies at the handles; alarm acknowledge; the plant saved with the game.
- Lines to other decks (9) end at a penetration; drawn on their own decks later.

## Next action
6r-2 live (runs 92–94). **Paused by the creator (2026-10-13): the ship waits for the CAD; then tighten her to it (briefs/NEXT.md §9.1); then Johansson Automation, a Kongsberg-like alarm and monitoring system (§9.2).** After that 6r-3 overhaul (covers off, parts on the plates; the crew at the handles; alarm acknowledge; the plant saved with the game).
