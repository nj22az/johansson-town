# Johansson Town — Late-Shōwa asset intake

This directory is the controlled intake area for third-party assets used by Johansson Town.

## Rules

- Runtime assets are served locally from this repository. Do not hot-link third-party model or texture hosts.
- Every mirrored third-party asset must have a verified source and licence recorded here before it is used by the game.
- Prefer CC0/public-domain assets. CC-BY assets may be used only when the exact downloadable item and attribution requirement have been verified.
- Keep source files out of the runtime path when they are unnecessarily large. Runtime 3D assets should normally be glTF/GLB, with textures reduced to 1K for mobile unless visual testing justifies 2K.
- Optimise geometry/material count before enabling an asset in the live town. Preserve an unambiguous source record even after optimisation.

## Approved sources

### Quaternius — Universal Base Characters
- Source: https://quaternius.com/packs/universalbasecharacters.html
- Licence: CC0 1.0 Universal.
- Free Standard pack: six rigged base characters, twenty hairstyles, humanoid rig, roughly 13k triangles per base, glTF/FBX formats.
- Intended use: replace the procedural fallback residents with locally packaged human rigs after a period-clothing pass.

### Quaternius — Universal Animation Library 2
- Source: https://quaternius.com/packs/universalanimationlibrary2.html
- Licence: CC0 1.0 Universal.
- Intended use: walk, jog, idle, gesture and contextual animations. Curate only the clips Johansson Town needs.

### Quaternius — Sushi Restaurant Kit
- Original source: https://quaternius.com/packs/sushirestaurantkit.html
- Public source mirror inspected: https://github.com/agentkaerf/FreeModels/tree/main/Sushi%20Restaurant%20Kit%20-%20May%202023
- Licence: CC0.
- Original pack: 108 models in FBX, OBJ, glTF and Blend formats.
- Intended use: period-compatible Japanese restaurant/interior props where the model does not look too modern or stylised.

### Poly Haven
- Source: https://polyhaven.com
- Licence: CC0.
- Intended use: asphalt, concrete, corrugated iron, weathered wall/roof materials and restrained environment lighting.
- Mobile target: 1K colour + normal + packed roughness/AO/metal where available.

### ambientCG
- Source: https://ambientcg.com
- Licence: CC0.
- Intended use: secondary PBR materials where Poly Haven does not provide the required surface.

## Reference-only until licence/download is re-verified

### Keshi Corner / MrTalida — Internet Archive
- Collection: https://archive.org/details/@keshicorner
- Content: hundreds of highly detailed 3D scans of vintage Japanese keshi-gomu toys, including sets based on Super Mario Bros., The Legend of Zelda, Ghosts 'n Goblins, Goemon, Donkey Kong Country, Street Fighter, Dragon Quest and other game properties.
- The creator explicitly makes the scan files freely downloadable for preservation, research and printing.
- Production policy: **reference-only for Johansson Town unless the exact item has a licence that clearly permits redistribution and game use, and the underlying depicted IP is also safe to use.** The scans reproduce copyrighted franchise characters/toys, so free download alone is not sufficient clearance for a public game.
- Potential safe use: study scan density, surface treatment, 1980s gashapon aesthetics and toy-display presentation; create original Johansson Town keshi-style capsule toys rather than importing franchise characters.

### bta_kelorinjo — Shouwa Minka / Nagaya / Omise
These are excellent visual references for the architecture target. Current public listings inspected during the September 2026 asset pass include links or wording associated with commercial Asset Store versions. Do not mirror or redistribute them until the exact downloadable file and its current licence are verified.

### Sketchfab / itch.io individual models
Do not assume that “free to view” or “free download” means CC0. Record the exact model, author, licence and source page before mirroring it here.

## Target asset list

1. Human base rigs and hairstyles.
2. Curated idle/walk/jog/talk animations.
3. Corrugated iron, ceramic-roof, weathered asphalt and concrete PBR sets.
4. Late-Shōwa shopfront modules: timber siding, aluminium sliding doors, shutters, noren and small awnings.
5. Utility poles, transformers and cross-arms; generate wires at runtime with curves.
6. Period street props: red postbox, convex traffic mirror, crates, bins, public telephone and non-digital vending machine.
7. One boxy late-1970s/1980s kei truck or minivan with a redistribution-safe licence.

## Runtime policy

External asset hosts must never be required for the game to start. If a third-party model fails to load, Johansson Town must keep its local procedural fallback so the player is never left with missing people or collision geometry.

## Made in-house

### Johansson trucker cap (assets/catalog/johansson-trucker) — 2026-10-14
- Made in-house in Blender (bpy 5.0.1 as a Python module) by `assets/catalog/johansson-trucker/source/build-johansson-trucker.py`;
  the `.blend` and the 64 px weave tile (`weave.png`, generated by the script) beside it. Licence: CC0, no third-party
  geometry, textures or logos.
- A late-1990s six-panel trucker modelled on a real one's measurements (58 cm band, a 12 cm foam front, a 7 cm bill, a
  4.5 mm knit), scaled to the town's default adult head; 2,968 triangles, four materials, one 64 px texture. The maker is
  invented: Johansson Headwear JH-712. The J is the house mark: the site's rubber-stamp seal (config.js CONFIG.logo).
- Checked and exported by Johansson Studio (`jojo/town-studio/assets/johansson-trucker`, every check passed), published
  into World's catalogue; worn through `src/avatars/hat-assets.js`, sold from Sakura's cap tree (`src/commerce/sakura-caps.js`).
- Its shop-display level of detail (`assets/catalog/johansson-trucker-display`, same script with `--display`, output in
  `source/display/`): 1,298 triangles, for the six caps on Sakura's stand.
- The Seagulls six-panel built before it (same day, same method) is kept in `source/seagulls-six-panel/`, not published.
