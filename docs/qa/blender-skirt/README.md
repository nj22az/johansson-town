# Blender-first skirt study — 24 October 2026

**Partial authoring study. Reference sophistication and Avatar Creator integration are not signed off.**

The owner asked to work in Blender first, then determine how Avatar Creator can build a character like the supplied GLB. This iteration establishes an editable skirt in Blender 4.5.3 LTS. It does not reconstruct the complete character. The owner subsequently requested screenshots and a self-audit.

## Latest: revision 2, owner's geometric/material/runtime brief

**The sections below this revision note retain the first review's historical measurements and findings.** The updated PDF is ten pages, with 31 rendered views. Pixar is the owner's quality ambition; neither an isolated skirt nor passing topology checks establish that standard.

- Waistband lower offset reduced to 0.00015 source units, with a 0.0012 maximum outer offset. Front dips by 0.0016 and hips rise by 0.001; the main skirt's upper contour follows the same wave. The band's lower custom normals transfer from the skirt through a weighted seam region. Its thickness is 0.0013, directed inward. The raised shelf is materially reduced; the upper edge still needs review against a real shirt tuck.
- Three shallow, broad, asymmetric release lines and 0.00055 side-seam pinches interrupt the mathematical sweep. These are authored surface variations, not simulated drape. Native cloth adds low-strength UV micro-weave bump, sheen and restrained anisotropy. Surface detail remains deliberately quiet at normal framing.
- **Separate runtime candidate: 1,472 triangles**, 768 vertices before glTF UV/normal splitting, two parts, six exported shape targets per part. Circumference is 32 rather than 64. Body retains only short top/tuck and three-ring hem returns; its two open boundary loops are intentional, with no edge shared by more than two faces. The band remains closed. The complete interior lining remains only in the offline authoring/beauty model, whose rest export is now 6,912 triangles.
- The unsubdivided original 960-quads would already be 1,920 triangles. Thus reaching 1,200-1,600 requires reducing the cage, not merely turning subdivision off. No blanket claim that every full lining is 85% hidden in every seated pose: visibility depends on wearer and motion.
- Runtime glTF carries a low-strength tangent normal texture and `KHR_materials_sheen`. Checked in the **actual repository Three.js and GLTFLoader**, Chromium software WebGL: `MeshPhysicalMaterial`, normal scale 0.08, restrained sheen colour 0.06, six finite morph targets on both parts, 1,472 triangles, two isolated draw calls and no page errors. Five actual WebGL angles exported. This is an isolated review harness, not an enabled Creator garment or hardware performance result.
- Export checks caught two real problems: collapsed return-strip UVs caused streaks, and Blender's independent sheen weight did not survive as intended, yielding full-white glTF sheen colour. Returns now have nonzero UV area (asserted per face); export uses explicit subdued tint, confirmed after Three.js loading. The runtime result is still visibly darker and more faceted than the Blender model. No rendering-parity or aesthetic sign-off.
- Native **17/17 checks still pass** after the shape/material revision. Eight-section native surface error: mean 0.00152, p95 0.00433, max 0.01329 source units. Runtime builder separately asserts budget, expected open/closed boundary topology, noncollapsed UVs, exported morphs and material channels. Python syntax, JS syntax and whitespace checks passed. No game test or runtime build claimed because nothing in the active shared builder changed.

[Before/refined/WebGL comparison](revision-2/Vy-skirt-revision-2.png), [runtime candidate GLB](revision-2/Vy-skirt-runtime-candidate.glb), [runtime data checks](revision-2/runtime-candidate-verification.json), [actual WebGL checks](revision-2/webgl-verification.json), [revised native checks](revision-2/native-verification.json).

### Rig/body work remains open

The requested non-propagating waist/pelvis shape, actual shirt clearance and hip-flexion-driven sit/splay correction are **not implemented in Creator**. Existing six garment morphs do not solve those tasks. Avoid simply scaling the existing pelvis bone or assigning a constant 50/50 thigh/helper weight everywhere: either could produce new attachment, rear-hem or seated-contact errors. A local pre-skin body deformation is the proposed route, with anatomical region masks and corresponding leg-root/hip clearance checks; preserve spine and leg lengths and other residents' recipes.

Before choosing any exact body narrowing, measure the actual naked torso and clothed waist section in the same frame. The earlier 40% number compares garment widths at equal nominal height, not identical anatomical landmarks, and must not become an unmeasured 40% body shrink. The source waistband top and shirt tuck landmark also need a precise section on a wearer; the first crop's waist plane was a study selection, not an approved anatomical anchor.

Next concrete acceptance: dress an identified wearer, refine the shirt termination inside the lip, then bind the shared rig with support from existing skirt helpers and a hip-flexion corrective. Review continuous 0-90 degree lifts, asymmetric walking and sitting with frame-by-frame thigh/hem/seat contacts. Only then integrate the authored geometry and material into the Creator, preserve recipe round-trips, rerun shared outfit/contact budgets and measure device rendering. Full character shape, hair, hands and layered clothing require their own authoring passes to make the desired overall quality coherent.

Reproduce the candidate after the native authoring build:

```sh
blender -b --python johansson-town/tools/blender/build_vy_skirt_runtime.py -- /path/study
TOWN_CHROMIUM_PATH=/path/chromium node avatar-creator/render-skirt-runtime-candidate.mjs /path/study
```

## Actual deliverables

- Native `Vy-skirt-study.blend`: original supplied static character in a clearly labelled hidden reference collection; bounded source skirt crop for review; authored continuous quad cage with separately shaped front/back contours and named panel regions; separate waistband; thickness/lining, turned lower profile and softened edges; stable UVs; six fitting shape keys. The waistband follows each control through drivers.
- `Vy-skirt-rest.glb`: **6,936 triangles**, two authored garment parts only, baked rest geometry, approximately 157 kB. It contains no reference character, rig, animation or fitting morph targets. The native file retains the editable fitting controls.
- `Vy-skirt-fit-cage.json`: authoring interchange with basis positions, quads, UVs and six shape deltas. No runtime currently loads it.
- [Matched-view comparison](Vy-Blender-comparison.png): front, quarter, side and back, reference crop and authored garment in the same clay material, plus the authored cloth response. Same orthographic scale, cameras and lights. CPU Cycles, 32 samples, 700 px per source image.
- [Source measurements](reference-measurements.json) and [independent verification](verification.json).
- Owner-requested nine-page PDF review: four matched reference angles, twelve new 30-degree orbit angles, five construction views and the self-audit. Reproduce the extra views with `render_vy_skirt_review.py /path/study`, then `build_vy_review_pdf.py /path/study /path/review.pdf`.

The native file and exports are delivered separately rather than adding the supplied dense reference or large binary authoring scene to the public repository.

## Self-audit

| Item | Finding | Status |
|---|---|---|
| Basic silhouette | Measured waist, growing hip volume, skirt length and independent front/back contours are much closer than the rejected Creator lathe. | Useful rest-form progress |
| Waistband | A real separate mesh exists, but its raised edge still reads too much as a rim. It needs a softer sewn transition and an actual shirt tuck on the wearer. | Needs refinement |
| Hem | Lower cage rows now turn inwards and the thickness edge is softened. Still requires review on a dressed body; isolated geometry does not prove a convincing cloth hem. | Partial |
| Cloth surface | Soft neutral highlights show volume, but the black surface is still too uniform. No authored weave, restrained compression folds or worn edge response. Do not add random wrinkles to hide form errors. | Incomplete |
| Panel sophistication | The cage is editable and front/back differ, but its construction is still a controlled parametric surface with named regions. It is not a flat-pattern/sewing simulation, hand-sculpted tailoring pass or validated drape. Earlier wording about “panels” must not imply those processes occurred. | Limited |
| Reference crop | The source is one combined textured mesh. Spatial/colour selection leaves jagged cut edges and some holes/fragments. These are selection artefacts, not defects to copy or evidence the authored garment is superior. | QA limitation |
| Whole character | No new original body, hair, face, hands, top or footwear authored in this Blender pass. The full-character context image is the supplied character itself, explicitly labelled. | Not delivered |
| All-body fitting and motion | Six authoring controls exist; only their data and waistband linkage have been checked. No shared-rig binding, walking, sitting, turning, contact clearance, or broad/slim/age-stage acceptance. | Not verified |
| Runtime cost | Compact rest export is far below the source's 603k triangles, but 6,936 triangles for one garment still needs reduction and a real total-avatar/device budget. Two exported parts are not evidence of two extra runtime draw calls; final batching remains unimplemented. | Not accepted for runtime |
| Creator status | No new runtime change in this Blender pass. The earlier rejected skirt remains on the local prototype branch. | Integration open |

**Verdict: a useful Blender rest-shape study, not a finished reference-quality character or a successful shared Creator replacement.**

## What was checked

Reopened the saved `.blend` with a separate Blender process, checked both cages/UVs, finite coordinates, all six shape-key links to the band, then independently reimported the garment-only GLB. **17/17 data/topology checks passed**, including closed shells after positional seam welding. A degenerate strip caused by tight bevel clamping was found in the first rest export and removed in the bake; the final closed-shell check passes without loosening it.

An additional 1,024 angular ray samples across eight skirt cross-sections, independent of the four cardinal samples used to construct the shape, give mean surface discrepancy **0.00150 source units**, 95th percentile **0.00439**, maximum **0.01328**, no missed samples. These numbers exclude the band and lower hem and are affected by the bounded crop; they do not establish an overall 5% visual match, cloth sophistication, all-body fit or motion quality. The source units are not assumed to be real metres.

Python syntax compilation and `git diff --check` passed. No game tests or runtime rebuild needed for these offline authoring tools/data. Earlier branch blockers remain unchanged.

## Adopting this into Avatar Creator

The existing shared engine can support an authored garment, but the current lathe builder cannot carry this form faithfully. Preserve the existing engine, rig and recipe compatibility.

1. **Finish the garment on a wearer in Blender.** Refine band and hem against the shirt/body; review source versus authored garment on equivalent proportions. The next image must show the new garment on a clearly identified wearer, not a source character masquerading as a reconstruction.
2. **Separate body proportions from garment fit.** Current Vy: nominal height 1.204, pelvis width 0.27576, skirt waist width 0.28780, hem width 0.31538, length 0.15454. At that height the source study has waist width about 0.17305, width at its lowest measured section 0.25224, length 0.17083. Different waist/pelvis proportions prevent a literal same-height garment import. These compare garment sections and a nominal Creator pelvis, not identical anatomical landmarks. Offer independent torso/pelvis/leg proportions for the reference look; do not force every resident into Vy's target body.
3. **Bake a reusable production cage.** Use the authored basis and fit deltas to generate `BufferGeometry` in `src/avatars/skirt-shape.js`; do not load the dense supplied character. Convert Blender `[x,y,z]` to Three `[x,z,-y]`, align waist to the wearer's measured waist and keep length/front ease/seat depth independent. Fit to the actual body surface with clearance, not one uniform X/Z multiplier. Reduce the rest mesh further while retaining the silhouette and UV layout.
4. **Bind to the shared rig.** In `build.js`, preserve existing hips/leg skinning and skirt spring bone identifiers. Rework `springs.js` hem endpoints and `towel-fit.js` CPU/GPU fit with the same authored contours. A new rest mesh alone cannot fix the analytic sitting/walking deformation. Bake fitting before assigning skin weights, or explicitly export morphs through a modifier-safe path; the present GLB deliberately has none.
5. **Carry the cloth response into Studio.** Add a garment UV/material region that can retain subtle roughness and thin edge shading. Existing plain-skirt blank UV and broad cel/ink fill will erase much of this work. Review a skirt-specific material path and measure its cost; do not change all accepted character shaders globally or call Blender PBR proof of Studio parity.
6. **Expose and preserve editability.** Use backward-compatible defaults for any added garment fitting fields in `recipe.js` and Creator controls. Preserve existing part IDs and saved wardrobes. Validate old recipe round-trips and optional fit controls before replacing the shared plain skirt.
7. **Accept the actual result.** Render neutral and final-material views on child, teen, adult, elder, slim and broad bodies. Review continuous walk/turn/sit footage and contacts, then rerun wardrobe budgets, floor/seating/spring/contact and runtime tests. Resolve the existing Vy paired-pose regression separately. Record actual iPad performance before claiming it.

This route is technically feasible. The garment component and interchange data now exist; a reference-quality full character still needs separate body, hair, layered clothing, face and hand authoring work and verified animation.

## Reproduction

From repository root, with Blender 4.5 available and the owner's source GLB supplied separately:

```sh
blender -b --threads 8 --python johansson-town/tools/blender/vy_skirt_study.py -- --reference /path/vy-reference.glb --output /path/study --render
blender -b --threads 8 --python johansson-town/tools/blender/verify_vy_skirt.py -- /path/study
```

Nothing pushed, merged or deployed. The earlier publication boundary remains in force.
