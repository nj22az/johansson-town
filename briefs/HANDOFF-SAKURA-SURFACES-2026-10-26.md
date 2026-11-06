# Handover: Sakura's surfaces rebuilt, no faces fighting (26 October 2026)

The owner: "Cad out the Sakura, and rebuild it. We had some work on it where we tried to remove the top floor office now I
want to keep it can you find the work on Sakura though there is much Z fighting on the floor and every where now, I want
it to be impeccable." Then: "Screenshot and show me".

## The Sakura work found

- **Single-storey prototype** (Codex): `development` (opt-in `?sakura-rebuild`) and draft PRs #378/#384/#385
  (`719f1435`). Not used: it removes the upper floor. Scanned anyway: 206 coplanar pairs, 33 m², the same kinds of fault.
- **Two-storey reconciliation, CAD revision F1** (24 October): studio repo `jojo`, branch `pixar`, `3d/sakura/cad/`
  (six A3 sheets, DXF, JSON; reach-in refrigeration approved). It is the plan for the Pixar Blender set and is unchanged.
- **World `main`**: the upper office, kitchenette and rest room as the owner wants them kept (`sakura-office-room.js`).
  This work rebuilds the surfaces of that Sakura. Its layout, stock and upper floor stay as they are.

## What changed (branch `claude/funny-clarke-f7puhg`)

Drawings: `docs/qa/sakura-surfaces/` (SK-ZF-001..003 rev A, PDF, DXF, audits, `build_cad.py`, README with the rules).
On main the audit found **242 pairs of faces within 2 mm of one plane, 44 m² over both storeys**. After this branch:
**0**.

- **Floor**: the till's tiles were laid 6 mm over the terrazzo over 11 m². They are now flush, and the terrazzo and its
  sheen are cut round them and round the restroom mosaic (`floorWithout`, `SAKURA_FLOOR_INSETS` in `sakura-shell.js`,
  `SAKURA_TILL_FLOOR` in `sakura-layout.js`). The welcome mat and office rug sit at 10 mm; the stickers have polygon offset.
- **Packaging**: the label atlas material is a polygon-offset decal (`store-advertising.js`), and so are the stockroom
  bottle labels, onigiri stickers, flyers, clipboard, TV and handy-terminal screens, cash-corner prints, checkout prints,
  office prints, poster tape and the Daisha slip.
- **Packs rebuilt so none of their own faces share a plane**: the can (body between its beads), the marble bottle neck and
  collar, the bag's crimp seal, the notebook/postcard page band, the tissue slot (`shop-product.js`); onigiri, bento,
  sandwich (crust is a ring round the crumb), bun, ramen lid (foil inside the rim flange) and clear film without an
  underside (`sakura-food-products.js`). Every can is now built as a can is: the body up to a lid 4 mm down inside the
  seamed rim. On the drinks cans (coffee, beer) the opening is cut through the lid over a dark well 2.5 mm below; it used
  to be a disc 0.5 mm over the lid. The pull ring rests on the lid. The old rivet is gone. The cans' envelope is 1.2 mm
  lower; `tests/fixtures/products-legacy.json` re-records the geometry of the 17 rebuilt packs (nothing else in it).
- **Joinery**: gondola price rails and chiller rails 3 mm proud; chiller well, lip, back and canopy between its end
  panels; medicine boards between their sides; wainscot courses butt at 880; shopfront posts 5 mm proud; till cabinet,
  cold cabinet, fridge, daisha tray, letter tray, pen can, nageshi rail, basket rims and rack boards rebuilt the same way.
- **Two tubes through walls**: the stockroom's ran through the partition into the shop, and the small office's through its
  front wall. Each tube now ends within its run (`buildTubes`).
- **Scanner** (`tools/z-fighting.mjs`): option `offsetPairs` (decals with equal offsets compared with each other), and
  `centre` on each finding. Existing callers are unchanged (the option is off by default).
- **Tools**: `tools/sakura-surface-audit.mjs` (the audit, JSON) and `tools/sakura-surface-review.mjs` (real-game photographs).
- **Test**: `tests/sakura-surfaces.test.mjs` (7 checks: both storeys at 2 mm with decals, floors at 10 mm, insets flush,
  every pack template clean to 1 cm², tubes inside their runs).
- Runtime rebuilt (`npm run build:runtime`).

## Checks run

- `tests/sakura-surfaces.test.mjs`: 7/7 pass. The same audit on untouched main: 240 + 2 pairs (`audit-before.json`).
- `build_cad.py`: 11/11 checks pass, the DXF reopens with no audit errors, all three PDF sheets inspected.
- 89 Sakura, shop, product, interior, studio, stair and draw-call test files, on this branch and on untouched `main` in
  the same container: here 460 pass, 7 fail; main 453 pass, 7 fail, **the same 7 tests**. The full `npm test` was
  stopped about two-thirds through on this machine (load ~10). Every failure it had reached was re-run on `main` and
  fails there too: architect-masterplan, avatar-expressions, building-stairs, continuous-life, countryside, diary,
  drink-grip, drunk, dual-controls, ferry-design-book and avatar-wardrobe-sets, one each. They come from this container
  (the hosted guard passed 455/455 on main), not from this change. The hosted guard has not been run on this branch.
- Close-up render of the rebuilt cans, ramen cup and sandwich (SwiftShader): recessed lids, openings and rings read.
- Real-game photographs, desktop Chromium/SwiftShader, before and after: nine shop views and the upper office.
  SwiftShader's depth buffer does not reproduce a phone's flicker, so the photographs show nothing missing or out of
  place. They do not prove the flicker has gone on the owner's devices.

## Not done / next

- No PR opened and nothing published to `main` (the owner decides).
- Physical iPhone/Mac check of the shop at grazing angles is outstanding.
- The town exterior keeps its own test (`no-z-fighting.test.mjs`). Other interiors were not scanned with `offsetPairs`.
- The Pixar Blender konbini (`jojo` `pixar`, F1) is unchanged. It should follow the same surface rules when it is built.
