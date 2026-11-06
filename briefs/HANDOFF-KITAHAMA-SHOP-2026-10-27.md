# Handover: Johansson Mart, Kitahama: the corner shop, drawn (27 October 2026)

**State: on `main` and live (PR #400, merge `f05a2470b`, Pages deployed 27 October 2026).** Drawn (KS-001 rev A), built
as two Blender models from the same data (`tools/blender/build-kitahama-shop.py`), and brought to the island in three
batches: the building on the north block's shop apron, walking in, Grandmother Higa at the till on weekday evenings and
Saturdays. The guard check's red at merge was `main`'s own (cast proportions, izakaya drinks station, seated pose,
no-z-fighting heap), the same four failing on a clean `main`; the Linux check was green. Open items below.

## The owner's decisions (27 October 2026)

- A smaller konbini than Sakura, in the feel of a small 1990s chain shop, but our own: Johansson Mart, in Johansson
  Marine's house green (the Acme rule), no game's or real chain's name, colours, logo or layout.
- On the northern part of the island: the entrance to Kitahama, the east end of the north block, at the corner of the
  cross lane and the approach.
- Kept by a resident we already have: Grandmother Higa ("maybe bring grandma higa as the attendant"), weekday evenings
  17:30–21:00 and Saturdays 9:00–21:00, when Sakura is shut and she is free of the bath; shut on Sundays.
- "Draw the shop in cad and I'll drop a Meshy for you after, exterior and interior; you need to describe size and all
  what we need."

## Where

| File | What |
| --- | --- |
| `src/world/okinawa/kitahama-shop.js` | the design data: building, openings, partitions, fittings and outside items, each with its why; livery; her week; delivery; stock; site changes; open items |
| `docs/qa/kitahama-shop/build_shop_cad.py` | draws KS-001 rev A from the data (needs reportlab, ezdxf; fonts DejaVu Sans and IPA Gothic, embedded) |
| `docs/qa/kitahama-shop/Kitahama-Shop-KS-001-Rev-A.pdf` / `.dxf` / `checks.json` | four A3 sheets, the plan at 1:1 mm, 23/23 checks |
| `docs/qa/kitahama-shop/README.md` | the Meshy brief: export frame, sizes, colours, every fitting placed, prompts |

## Found while drawing (fixed in the data)

- The keeper's aisle behind the till was 500 mm; the counter and the back shelf were moved to give 700 mm.
- The stock shelving stood across the delivery door; it now runs along the stockroom's west wall, and a check keeps
  900 mm clear inside each door and the staff door's swing clear.
- The gōyā curtain, shortened for the shop, would have run into the garden shed; it now stops at x 29.8.

## Found while building

- Renders of the models from the lane showed the game's frame mirrors a printed map: from the lane the door is on the
  left. The models are right (built in the game's frame); the elevations were redrawn as the player sees each face.
- The canopy's tie rods, the A-board, the vending machines' displays and the island's packets were corrected after the
  first renders; a leaning A-board panel dipped 3 mm below the ground (the export check caught it).

## Batch 1: the shop on the island (27 October 2026)

The owner: "So bring the new shop to the island?" In three batches, the project's rule for characters, ground and lighting:

1. **Done: the shop stands.** `src/world/kitahama-shop-build.js` places both models unrotated at x 35.6, z 63.2 on the
   pad top (0.045), streamed in near the player with a cream stand-in until they load; colliders for the walls (the shop
   is shut), the machines, the bins, the A-board and the condensers; prompts for the hours on the door and the machines.
   The parking moved west with three bays in the same order (Kōji, Nhung, Mac), the to-let bay went, the onion and
   sunflower beds shortened, the hedge, the gōyā curtain and the sign moved, and the sign reads 空きなし; the shop stands
   on its own concrete (lots.js `shop-apron`, KITAHAMA_PADS). `tests/lot-dressing.test.mjs` now walks to the shop's
   forecourt (where the free bay was) and checks the walls are solid. Seen in the running game from source (the audit
   session, headless): from the lane and the approach the shop stands, lit inside through the glass.
2. **Done: walking in.** `src/world/interiors/kitahama-shop-room.js`, the room in the shop's own frame (floor at y 0),
   its front glazing mapped onto the real street (`kitahamaShopFrontage`); solids for the inside walls, the stockroom
   and every fitting; prompts at the till, the cooler, the chiller, the magazines, the copier and the door. The door
   lets you in only in the shop's hours (`kitahamaShopOpen`, also the town's `isOpen`), its point on the forecourt
   450 mm clear of the glass. Found while making it walkable: the keeper's aisle was open to the shop floor; the
   counter now runs to the stockroom wall with its last 600 mm the flap, and F12, a counter return, closes the door
   end (data, drawing 23/23 and models 18/18 rebuilt). Walked in the running game at 18:00: in by the door's E,
   round the floor, out to the lane.
3. **Done: Grandmother Higa at the till.** `SHOP_DUTY` / `kitahamaShopOnDuty` (from the 17:00 van on weekdays, 8:45 on
   Saturdays, to 21:00); her plan in `people/canonical-day.js` puts her at `kitahama-shop` then, ahead of the shut
   liquor shop's bench; `people/workplaces.js` EVENING_DESKS gives her the shop's till (`KITAHAMA_SHOP_ROOM.staff`);
   `people/schedules.js` takes the shop as indoors through its own door; her purpose in `people/cast.js` says so.
   `tests/higa-liquor-laundry.test.mjs` now holds the new ruling (the till Wednesday 18:00 and Saturday, home Sunday);
   `tests/boot.test.mjs` lists the shop among the interiors; `tests/housing-consolidation.test.mjs` records the shop as
   what stands on the old 5 Kitahama plot.

Found in the running game and fixed: Grandmother Higa is a neighbour (`people/neighbours.js`), not one of the town's main
residents, so the schedule's indoor list did not take her in, and the room's staff drawing does not reach neighbours.
`neighbours.js` now takes her indoors on reaching the shop's door, and the room draws her at the till itself
(`ownedUpdate`), facing the shop floor, with a short greeting. Seen at 18:00: she is behind the register.

**Open:** the side window W2 shows a flat colour from inside (only the front glazing is mapped onto the street); the
van's 17:00 stop on Sakura Trading's round (`commerce/trade-round.js`) is not built; the shop is not yet a storyteller
place (`feed/places.js`, with captured backdrops) or in the resident guide's article for Grandmother Higa. Local
failures that are on `main` too (not this work): the Hoshizaki store's approach, the guide's portraits, Sato Ramen's
stand points, no-z-fighting and floor-sit here.

## Next

1. The owner looks at the renders; any change goes into the data, and both builders are run again.
2. Place it in World: place the models at `WORLD` (x 35.6, z 63.2), colliders from the data, the doors, the lights; then work
   through `SITE_CHANGES` (the parking, the beds, the hedge, the sign), Grandmother Higa's day in `people/cast.js`,
   the van's stop, the storyteller's place. Check it in the live game before publishing.
