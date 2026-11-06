# Vy: actual Creator integration, 24 October 2026

**Implemented locally on `codex/vy-reference-avatar`. Not pushed, merged, deployed or visually signed off.** The paired-pose failure below remains a release blocker.

The owner asked to bring the Blender skirt, outfit and head into Avatar Creator and enhance the Creator. “This head” was interpreted as the head in the same owner-supplied GLB; no additional head image was attached in that request.

## Use the features

- **Outfits → Vy monochrome** puts on the striped long-sleeve tee, modelled charcoal vest, panel skirt and white sneakers. It preserves the wearer's identity, head and body choices.
- **Bottoms → Tailored skirt → Panel skirt** selects the authored Blender cut. **Adjust → Skirt length / Hem ease** change its fit. Colour, plaid and stripe controls remain functional. Classic cut remains available and old saved recipes default to it.
- **Face → Soft sculpted** selects the new editable head profile. Width, jaw, cheeks, size, features and expressions remain editable. This head uses soft Standard material shading and more geometric facial normals; other heads retain their accepted cel path. Ink ovals are an additional selectable eye style. The sculpted head's drawn nose stays painted rather than adding the old raised nose bump.
- **Body → Studio proportions** selects a smaller head relative to height, narrower torso, longer legs and corresponding arm/leg proportions. Age, silhouette, height and build remain editable. Existing classic/rounded recipes do not change. This is a new proportion preset, not an exact retopology of the reference body or a universal body-width morph.
- Vy's local default selects the new parts. Existing saved resident look overrides keep their priority. Open [the editable design](Vy-Creator.avatar.json) through **Files → Open design** to inspect this exact look.

## Actual implementation

`authored-skirt-data.js` contains only the original Blender garment candidate's rest positions, UVs and indices, baked from the reviewed garment GLB. No runtime GLB fetch, supplied dense character or second rig is introduced. The source data retain **1,472 triangles** including the band and short returns. The builder fits each upper vertex to the actual torso surface before binding, rather than uniformly scaling an ellipse. An initial front-shirt penetration was found in the real render and corrected by this section fitting.

The panel skirt is one additional skinned cloth mesh with a Physical material, subtle weave normal, sheen and a restrained outline. Its index topology is expanded to corners by the engine's existing skin-assignment helper; triangle count remains 1,472, with 4,416 rendered corner vertices. All weights normalise onto the shared hips/thigh/spring bones. The existing continuous hip-flexion/lap/capsule correction, its CPU twin, depth shadow and normal correction also fit the panel skirt. Waist uniforms and spring endpoints use the same fitted dimensions. It is a practical analytic deformation, not cloth simulation, and does not claim a newly authored full sitting corrective system.

The existing striped-vest part now has separate modelled front panels, a back panel and shoulder connections laid outside the torso and skinned with it. The tee and sleeve stripes retain their existing garment atlas. Vest geometry stays merged with the body; it does not add a separate material draw. The cloth material uses one additional main mesh and outline rather than silently claiming the old two-draw budget. Plaid/stripe textures are per-garment and disposed; the small shared weave texture is bounded and reused.

Outfit switches hide the independent skirt alongside the everyday body, including bath/lobby and alternative uniform modes. Alternative sailor clothing clears the inherited panel-cut selector so its own skirt is not accidentally omitted. A regression check verifies the alternate still contains skirt-helper vertices. Recipe fields are optional with backwards-compatible defaults; existing part/set identifiers stay in order, with new head/eye/set identifiers appended. World runtime rebuilt and Studio entry cache versions updated.

## Visual evidence and audit

[Reference, previous prototype and actual Creator views](Vy-Creator-Integration.png). The supplied static model is labelled separately. It uses different lighting and is a direction reference, not a matched-pixel similarity test. [Actual skirt controls](creator-skirt-controls.png), [actual head option](creator-head-option.png), [browser check result](creator-verification.json).

Eleven actual Studio exports cover front, quarter, left, back, face, walk, run, sit, plus teen/adult/elder wearers. The screenshots show the real Creator selecting the panel cut, changing its length and selecting the head. No shader/page errors were observed in that run.

**Self-audit: the requested parts are now usable and editable in Creator, but overall reference fidelity remains incomplete.** The head is a reference-inspired profile rather than the supplied head mesh. Hair is still a broad simplified curtain/cap, limbs and hands remain the existing cartoon construction, vest edges and sleeves still show the limits of the current garment/body topology, and the source's subtle material response is not reproduced across the whole character. Walking/sitting images are posed evidence; finite-coordinate tests and the seated-contact checks do not establish appealing continuous cloth motion on every wearer. No Pixar-quality or exact likeness claim.

## Verification

- Focused avatar/customisation/features/springs/wardrobe-sets/seated/Vy/authored-skirt run: **35/35 passed** after the explicit additional-mesh wardrobe expectation was updated. Its underlying bath requirement was retained: no everyday skirt may remain visible while another outfit is on.
- Independent authored fit checks cover **48** age/proportion/silhouette/build-extreme combinations against the actual torso volume. Length/flare and recipe round-trip checks pass. Shared skeleton, normalised support weights, fitted waist, alternate sailor skirt, outfit visibility and finite fitted positions through 90-frame walking/running/sitting sequences pass. The motion check supplies actual locomotion/seated animator state rather than merely calling a gesture named Walk.
- Final targeted run after the alternate-uniform fix: **3 authored-skirt checks pass**. Runtime rebuild succeeds; **5 runtime/English checks pass**. `git diff --check` and helper syntax check pass. Earlier floor-support run: **3/3 passes**; actual seated contact suite passed in the 35-check run. No physical iPad or hardware performance measurement.
- Broader paired-pose test: **3 pass / 1 fails**, with **six findings** involving Vy: four hand-to-chest distances in legacy Studio Shove (44-63 mm), and two BackToBack separations (79-84 mm). These belong to the previously blocked paired-fit category; the changed body proportions alter the findings from the earlier prototype's four to six. Do not describe that as an unchanged or passing regression. No combat gameplay is restored; runtime package checks confirm retired combat handlers remain absent.
- The previously recorded `no-z-fighting` baseline process failure was not rerun; no passing scenery guard claim. The full World guard is not signed off while paired fitting remains red.

Reproduce the UI/images/design from repository root:

```sh
TOWN_CHROMIUM_PATH=/path/to/chromium node avatar-creator/render-integrated-vy.mjs /path/output
node --test johansson-town/tests/authored-skirt.test.mjs
```

Next: resolve paired fitting for the new proportions and hanging hair, refine vest/sleeve edges and source head/hair likeness, review continuous multi-body movement, then run the full guard and actual device acceptance before merging. Nothing is published by this delivery.

## Approved default replacement — 24 October 2026

The owner accepted the integrated design (“This is better”) and instructed replacement of current Vy everywhere, including the Johansson website. This supersedes the local-only publication boundary above; it does not claim exact source-mesh likeness or Pixar-level completion.

Vy now uses this shared default in World, Studio, portraits and new scenes. A one-time appearance revision upgrades older saved resident wardrobes, Studio's restored Vy and player slots using Vy. Personality/profile data is retained; subsequent deliberate edits are respected. Historical imported designs and already-authored comics remain editable snapshots.

Website assets regenerated from the actual avatar: the Linux Port Psst mascot, Vy's resident-guide portrait, both her article photos and Mai's photo with Vy. The World hub's Vy portrait uses the updated asset and corrected description. The live website character bundle and World runtime are rebuilt from the shared sources.

The six paired-pose findings are fixed without changing the acceptance tolerances: multi-start reach fitting clears narrow-body hand targets; a pelvis hinge with counter-rotated legs keeps hanging hair clear during BackToBack while the backs can meet, with an allowance for the authored panel hem. **All four paired-pose checks pass**, including all five resident pairs. No combat gameplay is restored.

[Website desktop](default-replacement/website-desktop.png), [website mobile](default-replacement/website-mobile.png), [Studio with an upgraded old save](default-replacement/creator-upgraded-save.png), [current Vy](default-replacement/vy-default.png) and [browser report](default-replacement/verification.json). Browser report has no page errors. Saved-wardrobe and player-slot regression checks confirm one-time adoption and retention of later edits; no physical-device performance claim.

Reproduce:

```sh
TOWN_CHROMIUM_PATH=/path/to/chromium node avatar-creator/render-vy-default.mjs
TOWN_CHROMIUM_PATH=/path/to/chromium node scripts/render-vy-whisper.cjs
NODE_OPTIONS=--max-old-space-size=6656 node johansson-town/tools/ci-guard.mjs --test-concurrency=1
```

See the latest [handover](../../../briefs/HANDOFF-VY-REFERENCE-2026-10-24.md) for final release checks and publication state. Existing downloaded Linux installers are versioned releases; changing the website and shared sources does not rewrite an already-installed binary.
