# Sakura wall band, revision A — 24 October 2026, evening

**Owner request:** "The banner is not good, I think it needs cad specific as it's ugly there" (about the lettered board
round the top of Sakura's walls, seen in the Pixar Thuan render). CAD first, audited, then built.

**Status:** drawings SK-WB-001..003 rev A delivered (`docs/qa/sakura-wall-band/`, 49/49 checks); built in World on `main`'s
cartoon shop (`src/world/interiors/sakura-band.js`, `buildSakuraBand` in `sakura-cheer.js`) and in Studio's Blender set
(`jojo/3d/cast/set_sakura.py`). Sakura keeps its upper floor (owner, 20:07); nothing here touches it.

## What changed in World

- One composition per wall instead of a tiled strip: back wall "Groceries · Daily goods" — crest — **Sakura Shop** — crest —
  "Since 1963" (centred on the cold cabinet); west "Rice balls · Bento · Fresh bread" (over the chiller); east
  "Medicine · Batteries · Stationery" (behind the till). Nothing repeated or cut; joints kept clear of the lettering.
- Boards 2560..2780, cap to 2810 (10 mm under the beams, which the old band ran into), bead 2550, stripe on its own rail
  2482..2548 (it used to float). `SAKURA_BAND.y0` is now the bead's bottom; the stripe follows it.
- Eisa poster centre 2000 → 1920; cigarette rack top 2520 → 2430 (both reached into the stripe).
- Tests: new `tests/sakura-wall-band.test.mjs` (in ci-guard): each wall lettered once, inside its width; cap under the
  beams; nothing else in the band's volume (measured from the built room by `tools/sakura-band-audit.mjs`); no coplanar
  faces. The old frieze test in `sakura-counter.test.mjs` described the tiled strip and was retired.
- Built-game photographs: `tools/sakura-band-review.mjs [--baseline] <out>` (back, west, east, oblique, close, phone).

## Open

- The east run sits behind the till canopy from most of the floor; it reads from the till side only.
- Found, not changed: on the east wall the medicine shelf's sign (2195..2405) stands inside the cigarette rack's glass
  depth; the rack and the sign overlap in depth. Worth its own CAD look.
- The browser letters in its own rounded font, fitted to each width; screenshots are SwiftShader, not a physical device.
