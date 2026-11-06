# Sakura surfaces — drawings SK-ZF-001..003, revision A (26 October 2026)

The owner: "Cad out the Sakura, and rebuild it. We had some work on it where we tried to remove the top floor office now I
want to keep it … there is much Z fighting on the floor and every where now, I want it to be impeccable."

The upper floor stays (the owner's ruling of 24 October): office, kitchenette, rest room, hall and stores, as on `main`.
The single-storey prototype (`development`, draft PRs #378/#384/#385) was not used. Its two-storey reconciliation, CAD
revision F1, is in the studio repo (`jojo`, branch `pixar`, `3d/sakura/cad/`) for the Pixar set.

## What was wrong (main at `a098bbe5`, measured by `tools/sakura-surface-audit.mjs`, `audit-before.json`)

242 pairs of faces lay within 2 mm of one plane, over 44 m² on the two storeys. Wherever two faces overlap like that,
the depth buffer picks a different winner from frame to frame, so the surface flickers.

| Kind | Pairs | m² | Mostly |
| --- | --- | --- | --- |
| Floors | 1 | 11.04 | the till's green tiles laid 6 mm over the terrazzo |
| Products | 143 | 24.35 | packaging prints 1 mm off their packs; can beads round the can body; lids in their rims |
| Joinery | 34 | 2.74 | price rails flush with board edges; wainscot into its rail; shopfront posts flush with panels |
| Prints and props | 64 | 6.16 | posters, flyers, labels, screens and clipboards 1–2 mm off what they are on |

Also found: two ceiling tubes ran past the end of their runs, through the partition into the shop and through the small
office's front wall.

## Revision A

The rules (SK-ZF-002), now checked by `tests/sakura-surfaces.test.mjs`:

1. No two faces that look the same way within 2 mm of one plane where they overlap, decals compared with each other too.
2. Joinery is built in courses that butt: each piece starts where the last ends. A rail is at least 3 mm proud of the
   board it fronts, and a post 5 mm proud of the panel behind it.
3. Printed things are decals, drawn with polygon offset on what they are printed on.
4. Floors: an inset is cut into the floor it sits in; a covering is a decal or a glaze; solid layers keep 10 mm apart.
5. The packs are built the same way: a can's body runs between its beads, a lid sits inside its rim flange, a crust is a
   ring round its crumb, and clear film has no underside on the shelf.
6. Each ceiling tube ends inside its run.

After: **0 pairs on both storeys** (`audit.json`).

## Files

| File | What |
| --- | --- |
| `Sakura-Surfaces-Rev-A.pdf` | SK-ZF-001 floor finishes 1:60 and the upper floor kept; SK-ZF-002 rules and typical joints; SK-ZF-003 the audit, before and after |
| `Sakura-Surfaces-Rev-A.dxf` | 1:1 mm, R2010: both floor plans, the finishes by layer, fixtures, tubes and the before-audit marks |
| `audit.json`, `audit-before.json` | the audit of this revision and of main `a098bbe5` |
| `checks.json` | 11 checks, all passing |
| `build_cad.py` | regenerates everything but `audit-before.json`: `python3 docs/qa/sakura-surfaces/build_cad.py` (node, reportlab, ezdxf) |

Real-game photographs: `node tools/sakura-surface-review.mjs --tag after <dir>` (after `npm run build:runtime`).
These are virtual-environment drawings, not a construction approval. The scanner checks the geometry; it does not prove
how the shop looks on a particular phone's GPU.
