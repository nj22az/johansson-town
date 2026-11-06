# Sakura visual revision

This revision responds to the live-play feedback about heavy fog, the clerk's generic appearance and the sparsely furnished shop. It is a concrete art iteration, not certification that the whole town meets an AAA or Shenmue quality bar.

## Clerk first

The clerk's display name is **Thuan**. Existing `yui` / `yuri*` asset filenames remain stable until a later rename pass. The Blender source changes facial proportions and adds a restrained smile with MakeHuman's Asian expression units; it also changes hair to near-black, reduces the glasses, builds a sewn collar and cloth tie, fits a brimmed hat, and adjusts the body proportions. Covered scalp geometry is kept beneath the hat. The photos guide the design; they are not embedded as facial textures or represented as a scan. The same anatomical CC0 base and authoring dependencies remain in use.

The model is still a modest-polygon authored asset with scripted motion. Hair, costume tailoring and animation need continued art work; the entire cast has not been replaced.

## Town and shop

- Clear-day fog now starts at 180 m instead of 58 m; interiors are outside the fog range. Rain retains distant haze. A brighter sky, neutral shop fill and higher exposure replace the grey-green daytime appearance.
- Added a distant sea extension and wooded ridge so visibility does not depend on hiding scenery edges with fog.
- Sakura Shōten has its own glass-fronted shell, metal frames, sliding-door handles, red/cream fascia and actual shelf geometry visible through its windows. It keeps its original entrance coordinates and navigation core.
- The shop has four stocked gondolas, 96 selectable instances across eight purchasable SKUs, a back-wall household display, price strips, checker tiles, fluorescent fixtures, checkout keys, a physical till drawer and a transparent opening cooler door.
- The selection logic now follows camera pitch for shelf goods. Looking upward can select the upper shelf instead of always selecting a lower, nearer packet.
- Existing town-yen purchases, saves, opening hours, dialogue and the disabled Shopify adapter remain intact.

Tomato's shelf density and everyday retail layout were studied as visual reference. No Shenmue mesh, logo, music, texture or product brand is shipped. Reference: https://www.phantomriverstone.com/2023/02/tomato-convenience-store-shelves-early.html

## Evidence and limits

`art/characters/yui/` contains the actual reduced character renders and packed editable Blender source. `art/store/` contains CPU renders built from the shop's actual Three.js geometry, with equivalent label textures and review lighting. They are **not browser screenshots** and do not establish game frame rate or identical renderer appearance.

Reproduce the store review:

```sh
node tools/review/export-store.mjs
python tools/review/label-textures.py /path/to/NotoSansCJKjp-Regular.otf
blender -b --factory-startup -t 4 --python tools/blender/render-store.py -- --root "$PWD"
```

Noto Sans CJK is used only by the review renderer; the game uses the existing system-font canvas labels. Font binaries are not shipped. The JSON and label textures in `/tmp` are intermediate render inputs.

Tests exercise the playable shop approaches, camera-pitch selection, clear/rain/interior atmosphere, geometry, independent skeletal animation and existing purchases/saves. The supplied browser cannot create a WebGL context, so actual desktop/iPad visual and performance review remains outstanding. Other shop interiors retain their earlier layouts; this revision concentrates the detailed retail work on Sakura Shōten.
