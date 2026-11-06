# Task: 6r, the plant (the creator, 2026-10-13)

The creator asked (2026-10-13): "So audit the engine room are pipes connected to they lead to systems? Can you stop
the engines and overhaul them? Turn off help systems?" and, on the audit's answer (no on all three), "So proceed".

- **Task:** make the machinery spaces of the Minato Maru work as the drawings say: 6r-1 the pipes built in 3D from
  the piping diagrams' data (`src/world/ferry-piping.js`), so every line on sheets 8.1–8.11 that runs through the
  machinery spaces exists in the game in its colour and bore, from the machine it leaves to the machine it reaches;
  6r-2 the plant's state (machines running, stopped, standby, isolated; the board; interlocks; dials, alarms and sound
  reading it; prompts to start, stop and change over); 6r-3 overhaul (an engine stopped, tagged out and opened).
- **Output:** `src/world/ferry-pipe-routes.js` (anchors and the router), the routed runs in `FERRY_INTERIOR`, sheet 5
  and 7 showing them, tests; later `src/world/ferry-plant.js`.
- **Checks:** `checks.md`. Fixed evaluator: `npm test` (the ferry tests, the design-book test, the walk test), the
  headless game (`/tmp/claude-0/board.mjs`) walked and photographed, the triangle budget.
- **Sources:** the piping diagrams (sheets 8.1–8.11, 2026-10-13), the engine-room arrangement as built
  (`ferry-interior.js`), the creator's engine-room photographs (2026-10-12), CLAUDE.md (no glitches, no shortcuts,
  plan before moving anything).
- **Scope:** the machinery spaces (engine room, auxiliary machinery room, workshop and store) and the penetrations
  out of them (tanks under the plates, risers up the casings, the exhaust uptakes). Pipes on other decks (hydrants
  on the car and passenger decks, the galley, the toilets, the steering-gear room, the bow house) are out of scope
  for 6r-1 and end at a penetration.
- **Limit:** one batch per commit, published after the suite and a headless look; the triangle budget may rise with
  a reason written down.
