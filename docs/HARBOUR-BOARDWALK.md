# Harbour boardwalk and supplied shop block

The owner's Quiet City Block replaces the four southern shop exteriors in place. The original fused road, utility poles and trees are excluded from the runtime block. A flush timber boardwalk occupies the main street from Z −52 to 8, linking the shopping street to the quay. Northern shops retain their existing frontage.

| Supplied building | Existing destination |
| --- | --- |
| Timber shop with lanterns | Harbour Evening Press (`journal`) |
| Three-storey grey shop | Electronics (`electronics`) |
| Blue convenience store | Sakura / Thuan (`market`) |
| Stone shop | Harbour Records (`career`) |

Each exterior has its own collider, readable destination sign and entrance connected to the existing interior. Site IDs and save data remain compatible. First-person movement, running, jumping, Thuan, opening hours and quest-gated travel use the existing game systems. Low deck lights replace the overhead poles along this section.

## Runtime asset

`assets/models/harbour-block/manifest.json` records exact source and runtime sizes, triangle counts, source hash and simplification errors. The four buildings use separate near and far meshes, sharing three 2048px PBR textures. Mobile switches to distant geometry at 28 metres; desktop at 44 metres, with hysteresis. Standard glTF loads locally without a compression decoder. If the block or its textures fail to load within 15 seconds, the original shop exteriors remain available.

Close surfaces receive additional tiled timber or plaster grain, fading with distance and limited on smooth glass. This adds small surface variation; it does not reconstruct detail missing from the supplied texture atlas. Door frames and threshold geometry are authored at game scale.

## Reproduction

Download the owner's original `Meshy_AI_Quiet_City_Block_0908215843_texture.glb` from [Drive](https://drive.google.com/file/d/1n-K5OgB0sRO5Ve4Z82Uf-wP-nDythdoN/view). The original is not duplicated in this repository.

From `johansson-town`, with Python, NumPy, SciPy and Pillow installed:

```sh
npm ci
python tools/prepare-harbour-block.py /path/to/source.glb /tmp/harbour-block
node tools/compact-harbour-block.mjs /tmp/harbour-block
npm test
npm run build
node tools/measure-art-scene.mjs
```

The extraction separates connected building surfaces, trims fused foliage, places the doorway planes at local Z=0 and scales geometry to metres. The packing script uses meshoptimizer with normals and UVs included in the simplification cost, compacts attributes and re-encodes the JPEGs.

## Verification and limits

All 51 tests pass, including actual GLB loading, both LODs, reachable entrances, entry and exit from every interior, running, jumping, quests and save compatibility. The production Vite build passes with the existing large JavaScript chunk warning. CPU renders of the exported building geometry were inspected.

At the south-facing street viewpoint, the CPU scene estimate falls from 305 to 261 draw calls, while submitted triangles increase from roughly 149,000 to 216,000. The replacement reduces draw calls but adds geometric detail relative to the procedural shops. These estimates exclude shadow passes and GPU timings; they do not establish mobile frame rate. Browser rendering, shader appearance and iPad performance still need an on-device review.
