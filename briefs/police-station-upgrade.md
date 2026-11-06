# Minato Police Station upgrade: brief (queued)

The owner, 21 October 2026: "I have some improvement suggestions for the police station can you look at this and decide
what to use avoid Z fighting". They pasted a three.js diorama, "Minato Machi · 1990s Island Chūzaisho". It is a reference:
study it and take what fits, never copy its code. This brief records what to take and what to leave out. It is queued
until the owner's usage resets, after the Higa Liquor and coin laundry job (branch `claude/higa-liquor-laundry`).

The station today (`src/world/police-station.js`, built 20 October) already has:
- the concrete canopy;
- the red lamp;
- the counter window under its 交番 sign, which is a light box;
- the notice board and the name board;
- the kei patrol car and the bicycle rack.

Officer Mori (roster `mori`) lives there: his home id is `koban`.

## Take: each piece needs who/why in the data

- **Upstairs is Mori's home.** A small balcony with a painted iron railing. His futon is aired over the rail on dry
  mornings only, and it goes in by noon and when it rains: follow the weather and the clock. A laundry pole with towels.
  Curtains behind the upstairs windows.
- **Hanabuku (Okinawan breeze-block) screen** beside the entrance, giving privacy and shade. The holes must be real
  geometry or a cut-out texture on one plane, never coplanar layers.
- **A small Asahikage (police emblem) in gold** over the entrance canopy. It is part of the sign, not a separate plane
  stuck on the wall.
- **The notice board's posters:**
  - Yesterday's traffic accidents: 0 (昨日の交通事故 0件).
  - Maritime-accident prevention month (海難防止月間).
  - A seat-belt poster.
  - When Mori is out on patrol, a card on the counter window reading パトロール中・ご用の方はベルへ ("on patrol, ring
    the bell"). It follows his schedule.
  - Feed some notices from the storyteller (lost and found, a missing cat), as at the laundry, so the board starts
    stories.
- **A white patrol bicycle** with its rear box, parked in the rack when Mori isn't riding it.
- **Back and service side:**
  - the outdoor air-conditioner unit on brackets;
  - two LP gas cylinders in a hutch, for his kitchen;
  - a roof water tank on a steel stand, the Okinawan way;
  - the radio antenna mast.
- **Two hibiscus pots** by the door (Mori's).

## Leave out

- Weathering-streak planes 1 cm off the wall: z-fighting.
- Reflection-stripe planes on the glass: z-fighting. Use the town's own glass material.
- A second drinks machine: the town's six are placed on purpose, so add none without a reason that passes
  `vending-placement`.
- The wooden utility pole and power lines: the town has its own wiring plan.
- The pink neighbour, the ocean, the clouds and the beach parasol: those are the diorama's scenery.
- Inverted-hull outlines: the town has its own ink pass.
- Point lights: the red lamp stays emissive (phone budget).
- 沖縄県警察 lettering and the slogan bar: keep to the station's own 交番 / Minato naming.

## Rules

- **No z-fighting.** Every thin layer (signs, posters, curtains, railings against the wall, the emblem) stands clear of
  its backing by at least the no-z-fighting test's margin. Add the station region to `tests/no-z-fighting.test.mjs` at
  the 0.01 m² owner threshold, and prove it catches a planted fault.
- **Budget.** Merge meshes; report draw calls and triangles before and after.
- **Placement.** Everything stands on the laid ground (ground standard: no new keys), clear of walk routes and the
  patrol car's path. `enterable-sites` and `vending-placement` keep passing.
- **Photos.** Before and after at 390×844 from the street, both sides, the back, dusk, and a rainy morning (futon in).
