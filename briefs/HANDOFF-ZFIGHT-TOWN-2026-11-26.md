# Handover · z-fighting in the town (everything but the ferry) · 26 November 2026

The owner, on his iPad, 26 November 2026: "Lots of z fighting I thought we eliminated it", "why is there so much z
fighting can you help me overhaul Johansson World, no z fighting allowed". The ferry is a separate pass (its own files and
tests). This pass: branch `zfight/town`. The audit, with every pair and the counts: `docs/qa/ZFIGHT-AUDIT-2026-11-26.md`
and `docs/qa/zfight-audit-2026-11-26.json`.

## What was found

1. **23 of the rooms the game opens had never been scanned.** The coplanar scan covered the streets, Sakura's office storey
   and its stair (`tests/no-z-fighting.test.mjs`) and Sakura's shop (`tests/sakura-surfaces.test.mjs`, which was not in
   the guard and had one known failure). The homes, Johansson's house, the town hall, the clinic, the police station,
   Umi-no-yu, the harbour office, the workshops, the port terminal and the warehouse had 423 pairs between them over
   85.5 m², most of them two faces exactly in one plane (floors laid over floors, view cards over view cards, skirting
   backs in the wall's back, things standing through the tatami).
2. **The Kikkou line sees what the picture does not** (on since 25 November in Sakura, its office, the izakaya, Sato Ramen
   and the ferry indoors: `kikkouWanted`, `src/render/kikkou-ids.js`). Its ID pass inks wherever two objects' ID colours
   meet, so two alike objects overlapping in one plane, which the old scan skipped as indistinguishable, fight there as
   scribbled ink; and its ID material does not carry the source material's polygon offset, so every decal is drawn at its
   backing's depth there. Both arrived the day before the complaint.
3. **On the streets, a fixed 2 mm is too little for large layers seen from far.** 117 pairs over 59.8 m², 2.5 to 13 mm
   apart: signs, banners, lettering, posters, noticeboard faces and window sashes on the fronts.

## The method and the threshold

`tools/near-coplanar.mjs` runs the existing scan (`tools/z-fighting.mjs coplanarOverlaps`) with a tolerance set by the
depth buffer, and keeps a pair only if its faces are nearer than it needs:

- one depth step at distance z (24-bit, or 32-bit float on a Metal GPU, which has the same 2⁻²⁴ step near 1.0; near
  0.15 m, far 640 m, `game.js`): **Δz(z) = z²(f − n) / (f n 2²⁴)** → 10 m 0.040 mm, 30 m 0.36 mm, 70 m 1.95 mm, 100 m 3.97 mm;
- needed: **4 steps** (each face rounded, one step, and interpolated over its own triangles after a float32 transform,
  about one more);
- at the farthest the overlap still covers 4 × 4 pixels on the owner's iPad (about 2000 drawn rows, a 65° lens: one pixel
  0.64 mrad): **z(A) = min(392 √A, longest view)**, a room's diagonal or the streets' 100 m;
- **required(A) = max(2 mm, 4 Δz(z(A)))**: 2 mm in every room, 2.45 mm for 0.01 m² in the street, 15.9 mm from
  0.065 m² up. Decals in the Kikkou ID pass: the arithmetic alone (4 Δz), since paint is meant to lie 0.5–4 mm off.

`tools/z-fighting.mjs` gained two options, off by default so the existing tests are unchanged: `ink` (compare what the
Kikkou ID pass draws: alike objects as kind `ink`, decals against their backings as kind `decal`; skips what `idSkips`
skips and lettered plates and hull outlines, as the ID pass does) and `shadowLook` (a face taking shadows differs from one
that does not). `tools/zfight-audit.mjs` builds every room the game opens with game.js's own `roomShell` (as
`tests/enterable-sites.test.mjs` does), plus Sakura's shop and the izakaya, scans each at its own diagonal (Kikkou rooms
with `ink`), and scans the streets in 30 m tiles (the whole town in one scan needs over 6 GB).

`tests/near-coplanar.test.mjs` (added to `tests/ci-guard.txt`): the arithmetic, a sensitivity test (a sign 5 mm proud,
a decal in its backing's plane, two alike pieces in one plane), and every room held to the number of pairs still on file
for it (`ON_FILE`, each with its reason). A room not named may have none; a number may only go down.

## Fixed in this pass (rooms 423 pairs / 85.5 m² → 316 / 19.1 m²)

- `src/world/interiors/house-plan.js` `floorPatch`: a finish laid where another is now cuts the earlier one (rebuilt round
  it): Tetsuo's kitchen boards, genkan tiles and toilet floor were in one plane (the yard homes and Vy's room use the kit too).
- `src/world/interiors/johansson-house-interior.js`: each window's painted view card at a distance of its own (4 cm
  steps on its side); the cards are larger than their windows and overlapped in one plane, up to 5.8 m² a pair.
- `src/world/interiors/town-hall.js`, `office-workplace.js`: the skirting and the dado rail stand on the dado's face, not
  through to the wall's back.
- `src/world/interiors/police-station.js`: the futon, the TV cabinet and the extension telephone stand on the tatami, not
  through it; the boot rack's shelf stands 4 mm proud of the rack.
- `src/world/sliding-door.js`, `shop-refrigerator.js`, `sakura-cheer.js`: stiles take the corners, rails butt between them;
  the hot case's base and back panel butt instead of overlapping (Kikkou ink flicker at every corner in Sakura).
- `src/world/interiors/sakura-life.js`: the Tanabata star standee stood inside the beer crates, its strut through the
  bottles (the known stockroom failure): it now leans west of them. `tests/sakura-surfaces.test.mjs` passes and is in
  the guard.

The look is unchanged in each: the same fronts, colours and sizes; only hidden or doubled faces moved.

## The global setting at fault (not changed here: render files belong to the ferry/render pass)

`src/render/kikkou-ids.js`, `idFor`: the ID material is a fresh `ShaderMaterial` that copies `side` and nothing of the
depth state. Every decal (polygon offset) is drawn in the ID pass at its backing's depth and fights there; the ink then
draws a ragged line across every print, label and poster in a Kikkou room. The change recommended, in `idFor` where
`n.visible` and `n.side` are set each call:

```js
n.polygonOffset=!!m.polygonOffset;n.polygonOffsetFactor=m.polygonOffsetFactor||0;n.polygonOffsetUnits=m.polygonOffsetUnits||0;
```

With it, the 28 `decal` pairs on file (Sakura's packs, bottles and stair plates) go, and the ferry's decals with them.
Alike objects in one plane (kind `ink`) need their geometry fixed (as above), or the ID pass to give an assembly one ID.

Also seen, not measured: the owner's ferry screenshot shows diagonal saw-toothed bands across flat walls, the look of
shadow acne or of two wall layers in one plane; on an iPad the sun's shadow map is 1024² over ±26 m (5 cm a texel) with
`normalBias` 0.045 (`game.js`, `startup-recovery.js`). That is the ferry pass's to measure.

## Tests run (this worktree, after the fixes)

- `node --test tests/near-coplanar.test.mjs`: 3/3 pass.
- 20 suites of the touched rooms and tools (`sakura-surfaces`, `sliding-door`, `shop-door`, `police-station`,
  `police-station-dressing`, `johansson-house-interior`, `resident-home-plan`, `town-hall-plan`, `sakura-detail`,
  `sakura-counter`, `izakaya-backbar`, `warehouse-port`, `sakura-street-poster`, `sakura-wall-band`, `woodland-poster`,
  `furniture-heights`, `seat-layouts`, `home-decorating`, `sakura-small-office`, `higa-shop-collision`): 122/122 pass.
- `tests/no-z-fighting.test.mjs`: see the report of this pass; it needs over 6 GB and was killed by the shared memory limit
  while other sessions ran the same suite.

Not verified: no render (the page draws the compiled runtime, which this pass does not rebuild); nothing measured on the
owner's iPad; software GL is not an iPhone GPU.

## Tasks left (each self-contained; run `node --expose-gc --max-old-space-size=5000 tools/zfight-audit.mjs out.json --only=<room id>` before and after, then lower the room's number in `tests/near-coplanar.test.mjs` ON_FILE)

1. `src/render/kikkou-ids.js` `idFor`: copy `polygonOffset`, `polygonOffsetFactor`, `polygonOffsetUnits` into the ID
   material (the snippet above). Then `market` 39 → 13 and `sakura-office` 2 → 0 in ON_FILE.
2. `src/world/interiors/johansson-house-interior.js` `shell()` (lines 181, 195, 198, 201, 206, 218, 224, 258, 622–623):
   wall blocks and slab blocks end in each other's faces at every storey (60 pairs, 0.09–0.45 m²). Apply JSY-STD-403
   rule 2: the wall along one axis takes the corner, the other stops at its face; slabs stop at the walls' inner faces.
3. `src/world/interiors/classroom.js` (room `school`, 33 pairs, up to 0.6 m²): unnamed meshes batched by
   `render/static-props.js`; name the pieces, then butt the desks', boards' and cupboards' parts instead of overlapping.
4. `src/world/interiors/onsen-*.js` (room `onsen`, 43): the swimwear sign 1 mm off its frame and the breaker tape labels
   1.2 mm off the plate (make them decals with polygon offset, or stand them 4 mm off); the CRT glass 1.5 mm off the set
   (same); bath-wall pieces and the ceiling beams ending in the walls' faces (stop the beams 2 mm short of the wall).
5. `src/world/interiors/office-workplace.js` (room `office`, 14): the filing cabinet's back, sides and shelves flush (sides
   and back butt, shelves stop inside); the desk's modesty panel in the desk run's face; partition posts in the screens.
6. The workshop shell shared by `frontrow` and `form3d` (world-room `workshop-shell`): the plaster rear wall in the side
   walls' plane (0.44 m²): the side walls stop at the rear wall's face. Front-Row's bookcase backs flush with the case
   timber: set the backs 4 mm into the case.
7. `src/world/interiors/port-hall.js` (room `ferry-terminal`, 15): the door frame in the glass doors' plane; the ceiling
   crossbeam in the spine's; the dado ends in the walls.
8. `src/world/interiors/police-station.js` lines 144–149, 205, 237 (room `koban`, 8): the counter's and desks' pieces flush.
9. `src/world/interiors/family-home.js` (five homes, 6 each): the outer wall's skirting ends (0.012 m²), a notebook lying
   in a recipe book's plane, the DK floor at the genkan step.
10. `src/world/interiors/tetsuo-flat.js` (13): the shoji frames in their paper's plane (paper 3 mm inside the frame), the
    kotatsu leg in the quilt, the fridge's doors.
11. The streets (`node … tools/zfight-audit.mjs out.json --town-only`, about 15 minutes): 117 pairs, each a layer 2.5 to
    13 mm off a large face seen from far. Worst: the J-Coffee banner on the Harbour Warehouse (5 mm, 8.7 m²), Sakura's
    signboard on its storefront (7 mm, 7.4 m²), the fish market's roof under the quarters' (`okinawa/quarters.js:85` and
    `fish-market.js:436`, 3 mm, 3.4 m² ×2), the izakaya frontage boards (10–12 mm), the yard homes' windows in their
    sashes (5 mm), the Blue Coral street poster's print on its board (3 mm, 2.8 m²), the shop lettering of Nakamura and
    Kissa Higa (6–8 mm, `okinawa/houses.js:212/215`), the vending machines' panels (2.5–13 mm), the noticeboards' faces
    (10 mm). For a print or lettering: a decal with polygon offset (factor −1, units −4) as well as its standoff; for a
    board or panel: 16 mm off, or one face. Then add a streets test beside the rooms' one (it needs the tiled scan).
12. Visual check: once the runtime is rebuilt by its owner, look at Tetsuo's floor, Johansson's windows from upstairs,
    Sakura's front door and refrigerator corners with `?kikkou=1` and `?kikkou=edge`, on a phone.
