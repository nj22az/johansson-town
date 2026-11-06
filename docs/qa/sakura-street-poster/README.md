# Sakura street poster — drawing SP-NK-001, revision C (24 October 2026)

The owner: "make the ads for Sakura Konbini make a poster we can put on the wall on another building", then "Use another
building maybe the ice cream shop".

- **Where:** Nakamura / Blue Coral's south wall (plaster, face z −14.150), centre x 11.9 at 1760 high, between its window
  and its back corner: the side seen walking up Main Street from Sakura and the harbour. The shop front, door and flag
  (the open Nakamura exterior audit) are on the other face and untouched.
- **What:** a B1 poster (728 × 1030) on a 12 mm painted board: Pixar Thuan (her stamp-card photograph from Studio), "After
  the ice cream, a cold tea.", NAGI ¥120, Sakura's hours. Artwork: `assets/graphics/advertising/sakura-street-poster.webp`,
  composed by `jojo/art/poster/sakura_ads.py` from World's catalogue and rota.
- **Checks:** 9/9 (`checks.json`), including the built town measured round the board (`tools/street-poster-audit.mjs`:
  nothing 3–400 mm off the wall within 300 mm of it). `tests/sakura-street-poster.test.mjs` is in the guard.
- **History:** rev A (Harbour Warehouse street face) hung behind the Fisheries Co-op enamel sign, which no hand-made list
  had; rev B (warehouse north gable) faced only the narrow lane. Neither was published. That is why the audit now measures
  the built town instead of listing fittings.

Regenerate: `python3 docs/qa/sakura-street-poster/build_cad.py` (from johansson-town/). Photographs:
`tools/street-poster-review.mjs <out>`. Virtual-environment drawing, not a construction approval.
