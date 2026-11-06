# Johansson Mart, Kitahama: drawing KS-001 rev A and the brief for its Meshy models

The corner shop at the entrance to Kitahama, kept by Grandmother Higa on weekday evenings and Saturdays: our own small
konbini, one room with a till, an island, a drinks cooler and a magazine window. The owner asked for it on 27 October
2026 ("draw the shop in cad and I'll drop a Meshy for you after, exterior and interior; you need to describe size and all
what we need").

**State:** drawn, and built as two models in Blender from the same data (below); not yet placed in World. The data is
`src/world/okinawa/kitahama-shop.js`; the drawing (`python3 docs/qa/kitahama-shop/build_shop_cad.py`, 23/23 checks) and
the models (`tools/blender/build-kitahama-shop.py`, 17/17 checks) are both made from it, so a change to the data changes
both. The Meshy brief further down stays as the specification the models meet, and as the way to a hand-sculpted
version if one is wanted.

## Built in Blender (27 October 2026)

| File | What |
| --- | --- |
| `tools/blender/build-kitahama-shop.py` | the parametric build: every wall, opening, fitting and outside item from the data |
| `assets/models/kitahama-shop/kitahama-shop-exterior.glb` | walls, roof, glazing, doors, signboard, canopy, vending machines, bins, A-board, condensers, tank: about 10 000 triangles |
| `assets/models/kitahama-shop/kitahama-shop-interior.glb` | floor, wall finishes, ceiling (its own mesh, to leave off), troffers, partitions, staff door, F1–F11 with their stock: about 9 100 triangles |
| `art/kitahama-shop/kitahama-shop.blend` | both, for editing |
| `art/kitahama-shop/kitahama-shop-export.json` | triangle counts, bounds, file hashes, and the checks: each fitting built inside its drawn box, the budgets |

Run it from `johansson-town/` with Blender (`blender -b --python tools/blender/build-kitahama-shop.py -- --root .`) or with
the bpy module (`python3.11 tools/blender/build-kitahama-shop.py -- --root .` after `pip install bpy`). Meshes are joined by
material, as the other Blender props are, to keep draw calls down on phones; the fittings' boxes travel as glTF extras.

**Which way round it is.** The game's frame (x east, z north, y up) shows the world mirrored against a printed map:
standing on the lane, the door is on your left and the vending machines on your right. The models are built in that frame,
so they drop in unrotated at x 35.6, z 63.2, and the elevations on sheet 3 are drawn as the player sees each face. The
plan (sheet 2) is the data's plan, north up, east to the right.

| File | What |
| --- | --- |
| `Kitahama-Shop-KS-001-Rev-A.pdf` | four A3 sheets: 1 site plan, 2 floor plan and fittings schedule, 3 four elevations, 4 section and inside walls |
| `Kitahama-Shop-KS-001-Rev-A.dxf` | the plan at 1:1 mm, a layer per kind (walls, openings, partitions, fittings, outside) |
| `checks.json` | what the drawing was checked for: aisles, door widths and swings, heights, the site, the signboard |
| `build_shop_cad.py` | draws all of it from the data |

It is our own shop. It borrows the scale and the feel of a 1990s small-town konbini, never a game's or a real chain's
name, colours, logo or layout. By the standing rule that Johansson is this universe's Acme, the chain is a Johansson company
and wears Johansson Marine's house green.

## The building in one paragraph

A single storey of rendered concrete block, **6.00 m wide (east–west) × 6.20 m deep (north–south)**, flat roof with a
parapet, **3.60 m** to the top of the parapet. The front faces **south** onto the cross lane; the corner door is at the
**east** end of the front, so it is seen from the approach. A green signboard wraps the south and east faces. Inside:
33.6 m² within the walls, a 30 m² shop floor and a 3 m² stockroom behind the till.

## How to model and export (both models)

- **Units: metres, 1 unit = 1 m.** Real sizes, as in the tables below; not scaled to look right.
- **Y up. Front (south) faces −Z; east is +X.** That is the island's frame (lots.js), so the model drops in unrotated.
- **Origin (0, 0, 0): the outside south-west corner of the walls, at apron level** (the forecourt's concrete).
  The shop floor is 0.10 m above it.
- **Format: GLB**, textures embedded, at most 2048 px.
- **Look:** World on `main` is the simplified, cute cartoon three.js town: clean shapes, flat or gently graded
  colours, no grime, no photo textures. Edges can be softly bevelled.
- **Budget:** exterior under about 20 000 triangles; interior with its fittings under about 40 000. If Meshy gives
  more, say so and I will decimate it.
- **No words except the signboard's**, and no real brands anywhere: no logos on the cooler, the vending machines, the
  magazines or the products. Products are coloured blocks and shapes; the game puts its own labels on.
- Two separate GLBs: `kitahama-shop-exterior.glb` and `kitahama-shop-interior.glb`. If Meshy makes the interior better as
  pieces, one GLB per fitting with its id (F1 … F11) is just as good: each is placed by the table below.

## Model 1: the exterior (`kitahama-shop-exterior.glb`)

The shell seen from the street, closed: walls, roof, parapet, openings with their glass and frames, signboard, canopy,
and what stands outside.

| Part | Size (m) | Where (u east, v north, h up from the origin) | Colour / material |
| --- | --- | --- | --- |
| Walls | 6.00 × 6.20 outside, 0.15 thick | u 0–6.00, v 0–6.20, h 0–3.60 | warm cream render `#efe6d2` |
| Plinth band | 0.30 high, all round | h 0–0.30 | painted concrete grey `#7d7f7a` |
| Parapet cap | 0.05 thick, 30 mm proud | h 3.55–3.60 | light grey concrete `#b7b8b2` |
| Roof | flat, slab top 3.15, falls to the NE corner | inside the parapet | grey screed |
| D1 door | 1.60 wide, two glass sliding leaves | south wall u 4.00–5.60, h 0.10–2.30 | clear glass, silver aluminium frames `#c9ccc8`; a 0.12 m frame box over it |
| W1 shop window | 1.70 wide, three fixed panes | south wall u 2.20–3.90, h 0.60–2.40 | clear glass, silver frames |
| Front pier | solid wall | south wall u 0–2.20 | the vending machines stand against it |
| W2 side window | 2.50 wide, fixed | east wall v 0.90–3.40, h 1.10–2.40 | clear glass, silver frames |
| D2 delivery door | 0.90 wide, steel, opens out | east wall v 4.70–5.60, h 0.10–2.10 | grey `#9aa0a6` |
| X6 signboard | 0.70 high, 0.15 proud | south face u 0–6.15 and east face v 0–6.20, h 2.80–3.50 | house green `#2e7a4e`, a 50 mm white line along its foot, lit from inside |
| Sign wording | — | centred on each face | **JOHANSSON MART** in white capitals, and under it smaller, **ヨハンソンマート　北浜店** |
| X5 canopy | 2.00 × 1.00, 0.10 thick | u 3.80–5.80, v −1.00–0, h 2.45–2.55 | house green steel |
| X1 two drinks vending machines | 2.00 × 0.75 × 1.83 h (two of 1.00) | u 0.10–2.10, v −0.80 to −0.05 | white bodies, rows of coloured cans behind glass, no brand |
| X2 can and bottle bins | 0.60 × 0.45 × 0.90 h | u 2.15–2.75, v −0.55 to −0.10 | grey plastic, two openings |
| X7 A-board | 0.50 × 0.40 × 0.90 h | u 2.85–3.35, v −1.20 to −0.80 | wood frame, blackboard faces, blank |
| X3 condensing units | 1.80 × 0.60 × 0.90 h | behind the north wall: u 0.50–2.30, v 6.30–6.90 | grey louvred screen in front of two units |
| X4 water tank | 1.20 × 1.20, to h 4.55 | on the roof: u 4.40–5.60, v 4.40–5.60, on a steel stand from h 3.15 | brushed stainless, a round-ended drum lying or a squat cylinder |
| X8 downpipe | 0.12 round | the NE corner, full height | grey |

The apron (forecourt concrete in front, 1.7 m to the lane) is the game's, not the model's.

**Meshy prompt, exterior** (image-to-3D with sheet 3's south and east elevations as the reference images, or text-to-3D):

> A small single-storey Japanese convenience store from the 1990s on a subtropical Okinawan island, cartoon style with
> clean simple shapes. Flat-roofed concrete building, 6 m wide and 6.2 m deep, 3.6 m tall to the parapet, warm cream
> rendered walls with a grey painted base. A green illuminated signboard band wraps around the front and one side near the
> top. Front: a large three-pane shop window on the left of centre, and two glass automatic sliding doors at the right
> corner under a small flat green canopy. Side wall: one wide window and a grey steel back door. Two plain white drinks
> vending machines stand against the solid left part of the front wall. A stainless steel water tank on the roof. No
> logos, no text except the signboard, no clutter, no dirt.

## Model 2: the interior (`kitahama-shop-interior.glb`)

The room inside the walls, open at the top (the game puts the ceiling on), with its floor, inside wall faces, the
stockroom partitions and every fitting. Same origin as the exterior, so the two fit together.

**The room:** inside faces u 0.15–5.85, v 0.15–6.05; floor at h 0.10; ceiling at h 2.80 (2.70 clear). White walls,
**grey-speckled vinyl floor tiles**, white fittings with **house-green shelf edges** (`#2e7a4e`), four rows of fluorescent
ceiling troffers (the game lights them).

**The stockroom:** two 0.10 m partitions to the ceiling: P1 along u 3.90–4.00 from v 4.40 to the north wall, P2 along
v 4.40–4.50 from u 3.90 to the east wall, with **D3**, a flush staff door, u 5.00–5.80, 2.05 high, opening into the
stockroom.

| Id | Fitting | Size w × d × h (m) | Where (u, v of its corners; stands on the floor at h 0.10) | Detail |
| --- | --- | --- | --- | --- |
| F1 | Till counter | 0.60 × 2.20 × 0.95 | u 4.30–4.90, v 1.60–3.80 | white front, green top edge; a cash register near the south end with a small pole display facing the customer; a glass hot case 0.45 wide at the north end (nikuman, fried chicken); a shallow tray of green gōyā and leafy greens at the customer's end; a lift-up flap at the north end |
| F2 | Cigarette and spirits shelf | 0.25 × 2.20 × 0.95 | u 5.60–5.85, v 1.60–3.80 | against the east wall under window W2; cigarette packs in rows, brown bottles; no brands |
| F3 | Three-door drinks cooler | 2.25 × 0.75 × 2.00 | u 0.30–2.55, v 5.30–6.05 | three glass doors, lit shelves of coloured drinks bottles and cans |
| F4 | Chest freezer | 1.00 × 0.65 × 0.85 | u 2.75–3.75, v 5.40–6.05 | white, sliding glass lid, ice-cream tubs and bags of ice inside |
| F5 | Open chiller (multideck) | 0.80 × 2.40 × 1.90 | u 0.15–0.95, v 2.20–4.60 | open front facing east, four shelves: bento boxes, rice balls, sandwiches, milk cartons, tofu |
| F6 | Gondola island, two-sided | 0.90 × 2.60 × 1.35 | u 1.90–2.80, v 1.80–4.40 | four shelves each side: bread and snacks (east face), groceries and household goods (west face) |
| F7 | Magazine rack | 1.20 × 0.35 × 1.10 | u 2.30–3.50, v 0.15–0.50 | along the inside of window W1, magazines face-out, blank covers in colours |
| F8 | Copier | 0.80 × 0.65 × 1.05 | u 0.20–1.00, v 0.20–0.85 | a 1990s office copier, beige-grey |
| F9 | Stock shelving | 0.35 × 0.95 × 2.10 | u 4.00–4.35, v 4.55–5.50 | grey steel, five shelves, cardboard cases |
| F10 | Staff sink and kettle shelf | 0.55 × 0.50 × 0.90 | u 4.40–4.95, v 5.55–6.05 | small steel basin, an electric kettle on the shelf |
| F11 | Umbrella stand | 0.25 × 0.25 × 0.55 | u 3.60–3.85, v 0.20–0.45 | by the door, a few long navy umbrellas |

**The aisles that must stay open** (the drawing checks them): 950 mm between F5 and F6, 1 500 mm in front of the
counter, 900 mm between the island and the cooler, 700 mm behind the counter for the keeper, 1 300 mm along the window,
900 mm clear inside each door. If a fitting comes out of Meshy bigger than its table size, it is scaled to it, not the
aisle squeezed.

**Meshy prompt, interior** (image-to-3D with sheet 2's floor plan and sheet 4's inside walls as references, or text-to-3D):

> The interior of a tiny 1990s Japanese convenience store, cartoon style, clean and bright. One room about 5.7 m by
> 5.9 m. White walls, grey speckled vinyl floor tiles. A three-door glass drinks cooler along the back wall, a white chest
> freezer beside it, an open refrigerated shelf of bento boxes and rice balls along the left wall, one low two-sided shelf
> island in the middle with snacks and groceries, a magazine rack along the front window, and a white checkout counter by
> the door with a cash register and a small glass food warmer. White shelving with green edges. A small stockroom behind
> the counter through a plain door. No logos, no brand names, no text, no people.

## Grandmother Higa's week and the shop's hours

| Day | Her day |
| --- | --- |
| Monday–Friday | 06:00–08:00 her garden on the seawall walk; 10:00–17:00 the bandai at Umi-no-yu; 17:00 to Kitahama and the van's cases in; **17:30–21:00 the shop** |
| Saturday | 06:00–08:00 her garden; **09:00–21:00 the shop** (Miss Higa keeps the bandai at weekends) |
| Sunday | her garden; the shop is shut (Sakura is open) |

The door says 平日 17:30–21:00 · 土曜 9:00–21:00 · 日曜 定休 (weekdays 17:30–21:00, Saturdays 9:00–21:00, closed
Sundays): open exactly when Sakura is shut and she is free of the bath. Stock comes on Sakura Trading's round at 17:00,
Monday to Saturday, to the delivery door on the approach. What is sold where, and why, is `STOCK` in the data.

## What changes on the site (sheet 1)

The shop takes the east end of the monthly parking (bays 3 and 4). Mac's bay moves to the west end, so the parking keeps
three bays (Kōji, Nhung, Mac) and drops the bay that was to let. Mrs Sato's spring-onion bed shortens to 3.2 m, the hedge
and the gōyā curtain shorten (the curtain stops short of the garden shed), and the parking sign moves. Every change and
what it touches in the code is `SITE_CHANGES` in the data, to be worked through when the shop is built.

## Open

- The two Meshy models (the owner).
- Who keeps the shop when Grandmother Higa is ill: nobody planned; it would stay shut.
- The chain's logo: the drawing has the wordmark only; a mark of its own is to be designed in Studio.
