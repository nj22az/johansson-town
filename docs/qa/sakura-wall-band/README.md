# Sakura wall band — drawings SK-WB-001..003, revision A (24 October 2026)

The owner, looking at Sakura in a render: "The banner is not good, I think it needs cad specific as it's ugly there."

## What was wrong (the shop as built, measured by `tools/sakura-band-audit.mjs`)

- One 3.2 m strip of lettering tiled round the room: "Sakura Shop · Groceries · Daily miscellaneous goods · Stamp · Ship
  ticket" three times on the back wall, cut mid-word at every run's end.
- The band (2560..2860) ran into the ceiling beams on the back wall: the beams' bottom is 2820.
- The stripe under it was a strip in the air, 64 mm off the wall with nothing behind it.
- The Eisa poster (top 2542) and the cigarette rack (top 2550) reached into the stripe.

## Revision A (data: `src/world/interiors/sakura-band.js`; built by `buildSakuraBand` in `sakura-cheer.js`)

- Planed boards 2560..2780 on 45 mm battens, face 60 mm off the wall (where the band always stood), a 10 mm bead under
  them, a 30 mm cap over them (top 2810, 10 mm under the beams), and the stripe painted on its own rail board 2482..2548.
- One composition per wall, signwritten for what is under it, nothing repeated, nothing cut:
  - back wall, over the cold cabinet: "Groceries · Daily goods" — crest — **Sakura Shop** — crest — "Since 1963";
  - west wall, over the open chiller: "Rice balls · Bento · Fresh bread", with two painted leaves;
  - east wall, behind the till: "Medicine · Batteries · Stationery".
- Boards in 3 m stock lengths, the fewest that fit, as even as they can be, every butt joint moved clear of the lettering.
- The Eisa poster drops 80 mm (centre 1920) and the cigarette rack's top to 2430, under the clear line (2470).

## Files

| File | What |
| --- | --- |
| `Sakura-Wall-Band-Rev-A.pdf` | SK-WB-001 key plan, section 1:5 and the checks; SK-WB-002 back wall 1:25; SK-WB-003 west and east 1:20 |
| `Sakura-Wall-Band-Rev-A.dxf` | 1:1 mm, R2010: the three elevations (fixtures from the built shop) and the section |
| `band-<wall>.png` | each wall's signwritten face at 1 px per mm (the Blender set uses these) |
| `checks.json`, `audit.json` | 49 checks, all passing; the shop as the game builds it, round each run |
| `build_cad.py` | regenerates everything: `python3 docs/qa/sakura-wall-band/build_cad.py` (node, Pillow, reportlab, ezdxf) |
| `fonts/` | M PLUS Rounded 1c Bold, subset to Latin (SIL OFL) |

Virtual-environment drawings, not a construction approval. The browser letters the boards in its own rounded font,
fitted to each text's width (`w`), so the game's letters can differ slightly from the drawing's.
