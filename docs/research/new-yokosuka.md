# New Yokosuka — a permanent inspiration for Johansson World

The owner, 19 October 2026: "add this as a permanent inspiration for Johansson World, here you can see home interiors
and convenience stores and everything we need", and, on the period: "Shenmue is the 1980's, it doesn't matter, small
town Japan still has much old parts in the 90s and even today."

## What it is

<https://github.com/brynnb/new-yokosuka>: a browser-based (Babylon.js) multiplayer recreation of the worlds of Shenmue I
and II: Yokosuka in 1986 (Yamanose, Sakuragaoka, Dobuita Street, the harbour at Amihama) and Hong Kong, Kowloon and
Guilin. It decodes the original Dreamcast models, textures and animations at runtime, has a searchable asset viewer
(`/asset-viewer/`) in which every room, shop, prop and character can be opened and exported, NPC routes with dialogue
and subtitles, forklifts, arcade cabinets, nine-ball, and a music and ambience archive. The code is GPL-3.0; the game
data is SEGA's and is not in the repository (the browser loads extracted data from the project's hosted bucket; local
extraction needs your own discs).

## Why it is our reference

Minato Machi is a small Okinawan port town in the 1990s. Small-town Japan keeps its old parts: a 1986 home, tobacco
shop, convenience store, bar, harbour warehouse or back lane is the same place in 1995 with a newer vending machine
outside. So New Yokosuka is the catalogue of real rooms and streets we plan ours from:

- **Homes**: the Hazuki residence (genkan, corridor, tatami rooms with the low table, the kitchen, the bath, the
  butsudan corner, the futon cupboard, the dojo) and the Sakuragaoka and Yamanose houses and apartments; what hangs on
  the walls and what sits on the shelves.
- **Convenience stores and shops**: the Tomato Convenience Store and Abe Store (shelf runs, gondola ends, the cooler
  wall, the counter with its hot case and cigarette rack, the magazine rack at the window, floor and light); Dobuita's
  shops and bars (the tobacco shop, the jacket shop, the ramen and the bars, the game centre).
- **Streets**: Dobuita's shopfront rhythm, signage layered on signage, vending-machine rows, the phone booth, the bus
  stop, the lanes between and behind.
- **The harbour**: Amihama's warehouses, the forklift yard, the pier and the workers' routines.
- **Routines and ambience**: who stands where at what hour, the dialogue rhythm, the ambient loop of each place.

## How to use it

1. Run it on your own computer (Node 22.19 or newer: `npm install`, `npm run dev`, then `/asset-viewer/` or `/play/`
   at `http://localhost:5173`). The cloud session can read the repository, but its network may not reach the hosted
   assets; say so when a room could not be opened rather than guessing.
2. Open the room or street that matches what you are building and **measure**: footprints and ceiling heights,
   counter and shelf heights, aisle widths, products per metre of shelf, where the till, the cooler, the hot case and
   the magazine rack stand; how a home's genkan, kitchen, tatami room, bath and toilet connect; what a street carries
   per ten metres (signs, machines, posts, wires, planters, bicycles).
3. Record the numbers next to what you build, as data with its `why` and a period note, the way
   [shenmue-lessons.md](shenmue-lessons.md) records measured budgets. The town's rule holds: nothing is random, every
   item has a purpose, an owner and a reason to be where it is.
4. Who opens it: the street-designer and set-designer agents (`jojo/.claude/agents/`) before building a shop, a home
   or a street; the konbini merchandising (`src/commerce/merchandising.js`) checks Sakura Shōten against the Tomato
   store; the home interiors (`src/world/interiors/`) check against the Hazuki house for how a home is planned.

## The rule

Study, measure and learn; never copy. Nothing from Shenmue (models, textures, names, music, text, characters, logos)
goes into Johansson World or Johansson Studio, and New Yokosuka's own code is not vendored either. We take
proportions, layouts, densities, routines and atmosphere, and build our own in the town's style. The same rule as
[shenmue-lessons.md](shenmue-lessons.md).

## What to take first (the owner's list: home interiors, convenience stores, everything we need)

1. The Hazuki house and the Sakuragaoka homes as the plan for Minato's households (after the 19 October consolidation:
   fourteen households, every one with a real plan a person walks).
2. The Tomato Convenience Store for Sakura Shōten's floor, counter and stock density.
3. Dobuita for Main Street and the East Row; Amihama for the Quay Warehouse and the docks.
4. The NPC schedules and per-place ambience for the storyteller and the soundscape.
