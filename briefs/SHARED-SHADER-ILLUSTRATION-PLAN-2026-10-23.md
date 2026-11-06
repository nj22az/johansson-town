# Shared World and Studio illustration-shader improvement plan

23 October 2026. Status: **implemented on the review branch; see [implementation handover](HANDOFF-SHARED-SHADERS-2026-10-23.md) for current checks, evidence and remaining acceptance.**

The owner supplied Gemini's review of all fourteen Thuan comic variations and explicitly extended its useful points
to World as well as Studio. Treat the visual observations as review evidence, not as an authoritative description of
our code. The direction is more deliberate illustration, readable faces and distinct media, preserving Johansson's
established cartoon identity. Minato quality remains the owner's priority; this is shared rendering work, not an
island expansion or another engine.

## Verified starting point

Reviewed against main `c43be1b4383811a99842096292b94b40eff7f6b1`. The following local and main blob hashes match:

| File | Blob | Actual role |
| --- | --- | --- |
| `src/render/looks.js` | `bab4c5b21489c97cc07a59cba4187fc8db47d88a` | One shared catalogue and GLSL fragment factory for all fourteen looks. |
| `src/render/cel.js` | `574f6a4f2e910a0584680b03a3591a63cc3dd6cc` | Existing MeshToonMaterial conversion, stepped ramps, shadow tint and texture flattening. |
| `avatar-creator/comic-look.js` | `3b4e804ec2aaf5dbe11fa3233cf2dea19cf81440` | Three.js fullscreen shader over a captured clean picture; dummy depth; always LIGHT. |
| `avatar-creator/scene-looks.js` | `c79d64b9b33c5cf66bd45df0b44a935a4679d190` | Shader on the live 3D scene target with real depth; always LIGHT. |

The first two paths above are relative to `johansson-town/`; Studio paths are repository-relative. Vendor Three.js is
r170. Check its API before using examples from newer documentation.

World's `src/render/ink-pipeline.js` renders scene colour and depth and applies the chosen final look. `src/game.js`
also calls `celPass.scaleFlatten(lookFlatten(look))`. Studio imports the same look fragments, but its 3D wrapper does
not perform that same look-dependent flattening integration. Its After effects wrapper cannot change materials in a
picture already captured. The comic renderer then composites assets and fresh lettering in Canvas 2D. Therefore the
answer to Gemini's pipeline question is **both**: custom WebGL/Three.js GLSL for looks, Canvas 2D for composition and
lettering. These wrappers do not use EffectComposer.

Captured layers currently preserve the picture, lettering anchors, scene and post settings. They do not preserve
normals, object IDs, UVs, world positions or real depth. Passing a constant texture into `tDepth` does not create any
of those data. Depth-dependent near/far attenuation is consequently arbitrary on a saved picture.

## Correct the diagnosis before implementing

| Look | Verified behaviour | Improvement to carry forward |
| --- | --- | --- |
| Natural | Avatars already use toon ramps, including pale `soft3`; not an unmodified Phong baseline. Multiple light contributions, materials and textures still produce dimensional modelling. | Inspect material/lighting contributions and colour space; prototype stronger intentional two/three-band treatment as a look-controlled setting. Preserve Natural as a comparison baseline. Coordinate with the material prototype work linked from PR #371 before changing shared materials. |
| Black & white | Rec.709 luminance plus 1.12 contrast already exists. | Test an S-curve and controlled channel contributions against faces, shirt and booth. Avoid globally crushing already-dark rooms or mistaking hue weights for semantic skin detection. |
| Sepia | A sepia matrix and contrast, rather than a single multiply. | Test parchment/umber duotone with a protected midtone range and real print reference. |
| Pocket Gentleman | Already downsamples to approximately 144 lines BEFORE Bayer dithering and uses four greens. | Make pixel/dither scale adjustable and preserve glasses, eyes and silhouette at their intended output size; do not add a duplicate downsampling pass. |
| 16-bit | Pixelates to roughly 240 lines; 16 levels PER CHANNEL, not a sixteen-colour indexed palette. | Test a curated 16/32-colour palette and pixel-aligned silhouettes. This is a palette redesign, not a missing pixelation feature. |
| Line drawing | Shared edges combine inverse-depth curvature and colour Sobel; spot-black detection protects small dark marks. Captured pictures have no geometry edge data. | Use actual normals/depth for structural edges; retain restrained colour detail for eyes, lips and signs, which normals alone will miss. Add controlled pressure/taper. |
| Old TV | Barrel curvature, scanlines, RGB slot mask, horizontal bleed and vignette already exist. | Tune the heavy corners and add restrained edge-dependent red/blue separation. Keep lettering outside the CRT transform. |
| Manga | Already has a 45-degree dot grid with luminance-dependent dot radius, multiple hatching thresholds and black fills. | Redesign tone assignment into readable tiers; reduce combined dot/hatch density on midtone faces/walls. Preserve distinct hair/eye ink without filling the entire room black. |
| Pencil crayon | Has tooth, variable stroke pressure and wobbling outlines; its coordinates remain screen-based. | Leave brighter paper; prototype contour-aligned strokes anchored to objects/surfaces. A normal buffer alone does not supply persistent surface coordinates. |
| Miniature | Blur radius currently depends on screen Y, including in World despite available depth. | Provide a separate depth-focus mode with focus distance/aperture and foreground/background separation. Retain deliberate tilt-shift as an artistic option; it is not synonymous with shallow depth of field. |
| Woodblock print | Already maps to ten explicit inks, including pink; it is not independent RGB posterisation. | Improve perceptual nearest-ink assignment and the palette's skin/highlight choices. Explore small deterministic ink/fill registration offsets. |
| Watercolour | Already includes two-scale colour warping, wet-edge darkening, granulation and unpainted highlights. | Tune scale/region behaviour so these read as washes rather than clouds over the whole scene. Do not add a second uncontrolled bleed pass. |
| Cartoon | Shared toon materials and World texture flattening already exist; the final fragment also quantises colour. | Bring Studio's live material treatment into parity with World, then simplify remaining tonal bands. Existing flattened pictures require recapture to remove baked gradients/textures. |
| Oil painting | Already implements a four-quadrant Kuwahara variance filter and eye/letter mark recovery. Studio always uses its sparse LIGHT branch. | Expose a genuine still-export quality path and measure the result first. A later anisotropic/sector Kuwahara upgrade needs directional/structure-tensor work; merely increasing this radius is not anisotropic filtering. |

## One implementation shared across the suite

Keep look IDs and menus stable. Put artistic math, palette definitions and style parameters in the shared rendering
area. World, Studio 3D and After effects should be adapters supplying their actual inputs, colour encoding and quality
budget. Do not make three divergent Manga/Oil implementations. Inventory other photo/film consumers before rollout;
avoid applying the same look twice to a capture that already includes it.

Use explicit capabilities: colour, depth, normals and stable surface coordinates. A shared `hasDepth`/equivalent
capability must govern geometry edges and distance-dependent effects. For old picture-only projects use honest 2D
edges and a named approximation, or request recapture when a geometry-dependent look is selected. Do not present a
dummy texture as real scene depth. Keep every existing text/asset editor usable on legacy projects.

Share quality intent too: interactive preview and still export can use different sample budgets, but must keep the
same style and palette. Cache programs by quality/capabilities as well as look. Currently both Studio wrappers hardcode
`light:true`; changing that is an integration task, not proof that a new oil algorithm is required. Measure GPU and
software-renderer cost before selecting export defaults. Do not introduce device classes that remove core graphics.

## Staged implementation and review

1. **Capability and integration parity.** Add honest depth availability to wrappers; audit colour-space consistency,
   look-dependent material flattening and preview/export quality. Keep current defaults and save old reference images.
   Use World and Studio views of the same scene. Inspect opaque, transparent, skinned and textured materials and restore
   all temporary material changes after rendering.
2. **First visible proof: Manga, Cartoon and Oil.** Compare current and revised versions of the three-panel Thuan
   comic, plus a World street and interior. Manga: clearer tiered tones. Cartoon: compare actual 3D material treatment
   and recapture, not only a picture filter. Oil: high-quality current Kuwahara versus a deliberately stronger, tunable
   kernel; prototype anisotropy only after the simpler comparison. Produce separate full-strip previews and a small PDF,
   not another huge grid. No claim of approval until the owner reviews the actual changes.
3. **Lossless auxiliary capture.** Extend project/layer metadata to keep depth, camera near/far and normal encoding,
   with optional object/region IDs. Use actual deformed geometry and correct cutouts; keep data textures out of sRGB
   conversion, lossy WebP and photographic JPEG. Version the schema, validate dimensions/size, measure RAM and project
   growth, maintain old project support and the existing input limits. URL shares may use canonical asset references;
   arbitrary heavy auxiliary captures travel in the project file. Never silently truncate buffers to fit a URL.
4. **Structural ink and focus.** Feed normals/depth into shared edge logic, vary line pressure deterministically, and
   add depth-focus blur with foreground/background edge handling. Normals must represent the same posed frame as colour
   and depth. Preserve painted facial details and signs. A normals/depth pass is a new capture capability, not a second
   renderer or a duplicate scene graph.
5. **Surface media.** Prototype material/UV or world-position-anchored pencil hatching and restrained wash behaviour.
   Normals can orient a stroke; stable UV/world/object coordinates must anchor it. Screen-space noise alone still slides
   across objects. Keep paper grain screen/paper based intentionally. Animation defaults should use stable seeds and no
   temporal jitter; optional line boil is a later deliberate effect, not a universal animation change.
6. **Other looks and lettered finish.** Tune monochrome, duotone, indexed retro palettes, CRT and woodblock with the same
   fixtures. Add optional deterministic roughness only to bubble/border paths. Text glyphs stay sharp; protect balloon
   interiors, joined tails, head clearance and panel gutters. This is a composition feature shared by comics, not a
   filter over World's menus, HUD or subtitles.

## Acceptance and release

- Preserve names, recipe identity, facial expression, camera, pose, beer/TV props and dialogue when comparing styles.
- Check head/arm tonal rings and facial separation at full size AND normal reading size; check bright and dark skin,
  black hair, glasses, patterned clothing, corrugated metal, foliage, sky and signs. Use the bar, hero burst and shed,
  then Minato street, Izakaya and a night scene.
- Check moving camera, animated faces/hands and lighting transitions. Stationary frames alone cannot reveal swimming
  strokes, jittering silhouettes, flickering dots or temporal paint instability. Check normal/depth mismatch at skin
  deformation, transparency and silhouettes. Keep feature scale consistent with export resolution.
- Require GPU shader compilation and image comparisons for all fourteen looks, legacy-project open/save, new project
  auxiliary-data round trips, PNG/PDF output and share-link fallback. Source-string assertions alone are insufficient.
- Record interactive frame times, export time, peak GPU/CPU memory and file sizes. World targets remain 60 fps desktop
  and 30 fps iPad; measure on actual devices before claiming these targets or native iPad acceptance.
- Shared `src/` changes require runtime rebuild, runtime-package checks, focused looks/cel/pipeline tests and the World
  guard; Linux acceptance and packaging apply when a Linux release is made. Studio-only adapters still require browser
  rendering, import/export and regression checks. Preserve Natural's baseline until the new artistic choice is explicit.
- Keep implementation on a branch and deliver concrete before/after previews. The owner's instruction here broadens
  the improvement scope to World; this document itself does not implement, merge or deploy visual changes.

## References and next action

Primary code above is the evidence for current behaviour. Three.js documents render targets and optional depth
textures, supporting auxiliary render buffers, not reconstruction of geometry from an already-flattened picture:
https://archive.threejs.org/docs/api/en/renderers/WebGLRenderTarget.html and
https://threejs.org/docs/pages/DepthTexture.html . Match proposed calls to this repository's r170 vendor.

Implementation now exists in [PR #382](https://github.com/nj22az/nj22az.github.io/pull/382). See the [implementation handover](HANDOFF-SHARED-SHADERS-2026-10-23.md) for exact source, completed checks, three-style proof, auxiliary schema and remaining acceptance. The next action is visual review, memory-sufficient geometry-guard validation and actual-device profiling; this plan's earlier audit remains historical evidence.
