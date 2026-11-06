# Minato Maru: 12 V lantern circuit

Original Blender equipment by Nils Johansson, shared with the book's lantern illustration. This game derivative shows a healthy intact fuse and complete two-conductor circuit. It has no deliberately poor contact, discrete 2 Ω resistor or baked fault readings. Copyright Nils Johansson; existing World ownership is retained.

The lantern has its own 12 V battery. The only wording on the equipment is the small ordinary **12 V** battery marking; the large teaching plaque and its supporting board were removed at the owner's request. The ship's 24 V banks, emergency system and four existing navigation lights remain unchanged. The added exterior white lamp remains separate from the port/red and starboard/green sidelights.

The small battery rests on a bracketed tray at the side of the existing wheelhouse console. The intact fuse holder is on its operator-facing fascia. Positive goes from battery to fuse to lamp; a separate blue conductor returns to battery negative. Both conductors pass through paired glands below the windows and follow the forward and outer bridge-wing dodger. The existing walking floors, solids, wing door and instrument apertures are unchanged.

`Minato_Maru_Bridge_Lantern.blend` contains individually named editable parts in metres. The frame is bridge local: +X port, +Y up in the game, +Z forward; origin at the bridge floor and front-window plane. Blender uses Z up. `scene.json` records exact routes, component provenance and label orientation. `tools/blender/build-minato-bridge-lantern.py` is self-contained and rebuilds the native source, three-mesh game GLB and generated runtime plan.

```sh
blender -b -t 2 --python tools/blender/build-minato-bridge-lantern.py
node tools/export-bridge-lantern-review.mjs
blender -b -t 2 --python tools/blender/review-minato-bridge-lantern.py
node --test tests/ferry-bridge-lantern.test.mjs tests/ferry-bridge.test.mjs
npm run build:runtime
```

The v2 GLB loads when the bridge is rendered nearby. Initial and failed-load views retain matching equipment and the small battery marking. No extra point lights, shadow maps, animation timers or startup model request are introduced. Current GLB is 311,964 bytes, 4,916 triangles and three meshes; source hashes are recorded in the handover/QA evidence. The earlier v1 file remains available for old cached tabs. The Blender proof uses actual current game bridge geometry, but is not a browser screenshot or a physical-device performance test.
