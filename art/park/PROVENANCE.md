# Harbour Park bench

Original Johansson Town geometry authored in Blender for Harbour Park. Worn cedar
boards and dark painted iron use three plain materials; no downloaded model,
photographic texture or third-party geometry is included.

- Editable source: `harbour-bench.blend`.
- Design and physical dimensions: `harbour-bench-spec.json`.
- Reproducible generator: `../../tools/blender/build-harbour-bench.py`.
- Runtime export: `../../assets/models/park/harbour-bench.glb`.
- Generated runtime dimensions: `../../src/world/harbour-bench-dimensions.js`.
- Export budget and SHA-256: `harbour-bench-export.json`.

Regenerate from the game directory with:

```sh
blender -b --python tools/blender/build-harbour-bench.py -- --root .
```

The GLB is in physical metres with +Y up, front -Z and back +Z. The runtime turns
it west toward the harbour and positions it on the park mound. Its four level
seat slats are 45.4272 cm deep and 208.32 cm long, with their upper surface at
42.56 cm above the origin. The sitting point is 9.3184 cm behind the front edge,
so the character's thighs lead to knees and shins in front of the boards. The
generated dimensions also place the interaction and define the collider. The
fallback uses the same design if the local GLB cannot load.

The original project material remains subject to the repository's project terms;
this document does not assert a separate open asset licence.
