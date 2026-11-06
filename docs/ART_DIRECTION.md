# Johansson Town: the street must earn the comparison

> **Superseded in part (October 2026).** The town is set in **1997**, not 1988, and the look, building kit and avatar rules are now set by `AMPLIFY-AUDIT.md`. Where this note disagrees, the audit wins.

The player's target is the grounded human scale, ordinary shop life and material richness of Shenmue, with Yakuza 0's late-1980s streets as a reference. The deliverable is a small original neighbourhood with that care. The current generic low-poly cast and repeated interiors are interim assets; extra geometry or post-processing does not certify this target.

## Changes in this pass

- Smooth hard export seams on character surfaces with a 70-degree crease threshold. Preserve positions, indices, palette boundaries and skin weights. No subdivision or extra triangles. Apply the existing resident clothing colours only to detected garment palettes, excluding palettes found on heads, necks and hands. Each identity has its own colour buffer; skeletons stay independent.
- Ease scheduled residents' turns and scale walk playback to speed. This reduces abrupt turning and sliding; it is not foot IK, facial animation or a new motion-capture library.
- Replace the original repeated roof pair with four forms: hipped tile, curved merchant-house gable, shallow tin gable and concrete parapet. Vary building heights, paint, sign proportions and exposed timber. Original walkways, entrances and collision footprints remain intact.
- Use the locally vendored, verified CC0 Industrial Sunset 02 HDR environment for shared reflected light. It does not become a photographed skybox or modern town backdrop. Reduce hemisphere fill when the environment loads; lower its intensity indoors, in rain and at night. Existing lights remain the load-failure fallback.
- Bake eligible static prop geometry into 24-metre spatial batches with original material colours stored per vertex. Keep the original interaction objects visible, on a non-rendering layer. Exclude trolleys and construct living props afterward so their motion remains independent.

## What still prevents the requested look

1. Faces, hair and clothing are generic. Shading improvements do not give Mrs Sato an elderly face or give each resident an authored Japanese 1988 wardrobe. Proper model work is required.
2. Interiors still share a shell, display windows lack convincing room depth, and a street remains too repetitive beneath the roof variation. The next asset work should concentrate on the marine office/bookshop/workshop view, not expand the playable area.
3. Lighting exposure and material roughness must be judged together in a real renderer. Do not tune them from code claims or an AI-generated street illustration.
4. The mesh submission estimate remains 621 draws at the starting view, above the requested budget. Profile the actual scene before choosing further batching, atlases and LOD.
5. Four voice clips are integrated, but native Japanese listening review is pending. Public Hugging Face GPU quota prevented further speech and all image-to-3D exports.

## Visual acceptance gate

Capture the actual running game at eye level: the starting street, close views of Aya and Mrs Sato, the bookshop threshold and the quay, in afternoon and night. Review head/hand proportions, material scale, shadow contact, sign legibility, silhouette repetition and moving feet. A 30-second walking clip is needed to judge motion and frame pacing. Keep the PR draft until those views are reviewed; the supplied browser has WebGL disabled, so this session cannot certify them.

The five prop reference PNGs are authoring inputs only. Do not insert them as flat scenery or call them 3D assets. Their intended TRELLIS conversion remains pending. Nothing from Shenmue or Yakuza is extracted or redistributed.
