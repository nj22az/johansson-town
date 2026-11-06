# Thuan character CAD and shared game limb proposal — 24 October 2026

**Updated:** 24 October 2026, 14:00 UTC.

**Status:** revision A, amendment 2 delivered: **12 A3 sheets and a 12-region editable proposal DXF with 27 native dimensions**, extending the delivered ten-sheet amendment with directional joint fans, explicit forearm weights, trainer collar/roll details and appearance safeguards. All 39 artifact checks passed and eight deliverables were saved. No new game mesh, shader, controller or character replacement implemented; no runtime acceptance.

**Measured World baseline:** `main` at `30771c750c710905d3105e7f1db3ab1e51242cd2`.

**Latest source review:** `main` at [`62bd8870cd64158ca3f673f6046297da245ea671`](https://github.com/nj22az/nj22az.github.io/commit/62bd8870cd64158ca3f673f6046297da245ea671). Relevant avatar/render source is unchanged from the arm-fit review at `0ca94d2ce0e3bfd92df232b60da318aed3ab1260`; measured character geometry remains the `30771c7` baseline above. These are source-review and measurement snapshots, not commits implementing the proposal. This handover records design work only; no game mesh, animation or runtime change accompanies it.

**Film source audited:** `nj22az/jojo`, `pixar` at `c9e3b6afdc911f07e01f9d888734a414e47207ea`.

## Owner request and scope

After the noticeboard drawing, the owner asked: “How about Cad for Thuan and identify parts of improvement?” This issue measures the current World/Avatar Creator default, identifies specific improvements and records the separate Blender film prototype's gaps. It is a design/audit task; no game mesh, recipe, animation, runtime bundle or film asset was changed.

**Owner correction:** her arms merge into her hips. The first visual review did not establish this defect; the subsequent source-mesh section and three-dimensional checks confirm neutral forearm/palm interference on both sides. Treat this as P0 before cosmetic detail, not as an accepted silhouette feature.

**Latest request:** CAD her arms, hands, legs and feet as a practical improvement for the current game, scalable to all Avatar Creator models. The Blender/Pixar workspace is too advanced for this game proposal and is not its replacement asset. Thuan supplies reference dimensions; every implementation must derive its fit from the shared recipe measurements.

The subsequent refinement request covers joint topology, sleeves, hand cupping/thumb movement, trainer construction and restrained surface detail. Amendment 2 corrects the quoted dimensions against the existing source and proposal rather than silently changing Thuan's proportions. Her approved charcoal polo and brown shorts remain; a crewneck or beige recolour is not authorised by the supplied wording.

The owner’s workflow remains: prototypes on `development`; separate Blender improvement on `pixar`; `main` keeps the simplified cartoon World. The next concrete task is the shared game limb prototype on `development`, not importing the film model or promoting an unvalidated replacement to main.

## Drawing package — amendment 2

- `Thuan_Character_CAD_Rev_A.pdf`: **12 A3 sheets, JW-TH-001 through JW-TH-012**. The measured baseline and interference correction remain; the last two sheets add directional joint fans/twist and trainer collar/foot-roll construction. The associated hand, shoe, shared-system and appearance notes are reconciled with them.
- `Thuan_Current_Model_Rev_A.dxf`: editable native millimetre geometry and dimensions, front/left/rear projections at 1:1, 28 bone centres in each view.
- `Thuan_Game_Limbs_Proposal_Rev_A1.dxf`: filename/identity retained, internal title **Rev A / Amendment 2**. Combined editable 1:1 millimetre proposal with **12 labelled regions and 27 native dimensions**, preserving the original 16 exactly. New regions show neutral elbow/knee fans, the collar plan and 10 mm recess; the sole plan now shows the transverse ball plane and corrected ankle-centred collar. The measured-current-model DXF is byte-for-byte unchanged.
- Unrigged neutral OBJ; **20 actual-model captures: 17 original baseline views and three static candidate-pose views**. The three new pictures pose the existing model and mittens; they do not show the proposed new limb meshes.
- Measured JSON, interference audit, `game_limb_design/arm-rest-proposal.json`, `hand-proposal.json`, `leg-foot-proposal.json`, `shared-game-limb-brief.md`, `proposed-controls.json`, generators and check reports. Amendment 2 adds `topology_refinement.py`/`topology-refinement.json`, `foot_roll_reference.py`, `foot_refinement.py`/`foot-refinement.json`, their briefs, `owner-refinement-audit.md` and the combined DXF detail helper/review evidence. The baseline previews remain `Thuan_Measured_Turnaround_Rev_A.png` and `Thuan_Improvement_Map_Rev_A.png`.

The 12-sheet amendment supersedes the earlier four- and ten-sheet issues while retaining their measured-source evidence. **Historical amendment 1 delivery:** seven amended files saved, ZIP **7,084,187 bytes / 74 entries**, CRC and manifest hashes passed; those byte/count values do not describe amendment 2. The existing identities below were retained for replacement; Amendment 2 package/save verification is recorded under Verification. Sheet 1 prints at 1:10 on A3 at 100%; component dimensions describe proposed game geometry, not a manufacturing-ready solid. The OBJ is intersecting triangulated reference geometry, not watertight or rigged.

### Stable delivered file identities

The following identities are verified by the original and Amendment 2 save receipts. All revised deliverables are saved; the measured-current-model DXF remains the original unchanged file.

| Deliverable | Stable file |
| --- | --- |
| PDF drawing set | [Thuan_Character_CAD_Rev_A.pdf](https://chatgpt.com/library?file_id=libfile_20d1ded5202881918ff95a826d5ad0c4&account_id=personal) |
| Current measured DXF — unchanged | [Thuan_Current_Model_Rev_A.dxf](https://chatgpt.com/library?file_id=libfile_238b37c6e7bc819192c448fdef3291da&account_id=personal) |
| Complete source package | [Thuan_Character_CAD_Package_Rev_A.zip](https://chatgpt.com/library?file_id=libfile_2c3e239afc188191a2b89012952b0e32&account_id=personal) |
| Measured turnaround | [Thuan_Measured_Turnaround_Rev_A.png](https://chatgpt.com/library?file_id=libfile_6688c956aa808191996e4991a6939cd3&account_id=personal) |
| Improvement map | [Thuan_Improvement_Map_Rev_A.png](https://chatgpt.com/library?file_id=libfile_445dbad235008191996dbfba4b8e6df7&account_id=personal) |
| Combined limb proposal DXF | [Thuan_Game_Limbs_Proposal_Rev_A1.dxf](https://chatgpt.com/library?file_id=libfile_700f2c50e7c88191b0c94b3c28453570&account_id=personal) |
| Four-limb overview | [Thuan_Game_Limbs_Overview_Rev_A1.png](https://chatgpt.com/library?file_id=libfile_e112f65e77d4819194892f0b81635060&account_id=personal) |
| Existing-model arm/hip candidate detail | [Thuan_Arm_Hip_Clearance_Amendment_1.png](https://chatgpt.com/library?file_id=libfile_42554fdaf55481919d50f25d495dfc3b&account_id=personal) |
| Amendment 2 joint and foot refinement preview | [Thuan_Limb_Refinement_Amendment_2.png](https://chatgpt.com/library?file_id=libfile_1614d586c5048191b99bc4e367bc822b&account_id=personal) |

## Current appearance and measured baseline

The approved `src/avatars/thuan-studio-design.js` recipe, selected by `cast.js`, is charcoal polo, brown shorts, warm-white sneakers, short dark braids and pale ties, heavy brown eyes and a wide rose mouth. It does not use historical glasses, long-braid overrides, the Meshy display figurine or the film blouse/pinafore.

Measurement method: `buildAvatar(recipeFor('Thuan'))`, no saved wardrobe/published look override, closed hands, neutral expression, no idle sway, `createFootGrounder(avatar)(0)`. Reset runtime root yaw to zero for drawing axes **+X wearer left, +Y up, +Z front**. Y0 is the grounded sole plane. Actual source vertices are evaluated after skinning. Shader ink and cloth displacement are excluded from dimensions.

| Reference | Millimetres |
| --- | --- |
| Actual grounded neutral envelope | **564.411 W × 1637.918 H × 532.002 D** |
| Current `THUAN_PROFILE.height`, `src/people/residents.js` | 1640 |
| Internal builder H parameter | 1621.062 |
| Bare head mesh | 538.962 W × 540.940 H × 468.547 D |
| Actual height / bare head height | 3.028 head heights |
| Left wrist joint centre | X185.712, Y534.328, Z0 |
| Left shoulder joint centre | X170.712, Y959.857, Z0 |
| Palm ellipsoid primitive only | 102.127 W × 130.496 H × 88.510 D |

The rounded values in the drawing use one decimal. The approximate three-head proportion is the accepted stylisation, not an anatomical error. Bind-space soles lie below the builder origin; normal foot grounding already corrects this. No floor bug is claimed.

## Confirmed arm/hip defect and static pose candidate

`audit/arm-hip-clearance-audit.json` confirms actual neutral mesh interpenetration. At the wrist-height Z0 section, the left arm and clothed hip share **65.144 mm along X**, and the palm/hip share **63.644 mm**; the right side mirrors them. These are shared intervals at one section, not surface-normal penetration depths, minimum translations or prescribed sideways corrections. Component overlap areas must not be added.

The selected candidate keeps the current pivot-to-pivot lengths: **223.120 mm upper arm and 202.694 mm forearm**. The builder's 222.896/202.633 mm values are vertical parameters, not those true distances. Local Three.js **XYZ** rotations relative to the existing bind pose are shoulder Z **+14° left / −14° right**, elbow X **−10°**, elbow Y **+75° left / −75° right**, and wrist XYZ zero. The 75° value is local rig twist, not an absolute anatomical pronation measurement. The resulting upper-arm centreline is **16.569° outward from vertical in front view**, not 14°.

Exact triangle-pair checks give **26.099 mm minimum geometric clearance on each side** between the selected existing forearm/elbow-band/palm/thumb surfaces and the complete torso plus both shorts-leg shells, with no intersections in that static pose. The existing closed mittens are retained; the intentional upper-arm/chest attachment is excluded. The current 11 mm ink expansion per surface gives a conservative 22 mm combined allowance, leaving approximately 4.099 mm geometrically; this is an envelope calculation, not a full-motion or projected-outline guarantee.

Three new front/quarter/detail captures show that candidate on the actual current model. **The new hand is not yet built:** its greater distal reach, digit poses, prop contacts, shoulders, other recipes and complete motion still require validation. Do not report the static 26.099 mm result as proof for the new meshes or all characters.

## Shared game limb dimensions and implementation contract

| Proposed or retained reference | Value and scope |
| --- | --- |
| Complete hand, longest wrist-to-tip reach | **155 mm**, proposed straight design |
| Palm width / palm length after wrist transition | **78 / 78 mm**, palm body only, not the thumb-inclusive outline |
| Wrist width / palm and wrist depth | **56 mm / 34 mm** |
| Thigh / shin pivot distances | **205.273 mm each**, retained |
| Trainer envelope | **180 W × 330 L × 105 H mm**, proposed |
| Sole band / ball plane / forefoot bend pivot | **18 mm / Z +92.669 mm / (0, 18, +92.669) mm** in the local foot construction frame; hinge parallel to +X |
| Geometric gap between proposed neutral shoes | **16.987 mm**, excluding shader ink; local outline treatment remains required |
| Complete component triangle ceilings | **Arm ≤700; leg ≤600; hand ≤1,200; shoe ≤520 per side**. Arm excludes hand and sleeve; these are component totals, not additions to the old geometry. |

The palmar thumb chain is a projected placement guide; its 24 + 19 + 15 mm values are true 3D targets requiring a fitted opposition axis and depth. The shared design uses continuous deforming arm/leg surfaces, controlled elbow/knee loops, a joined palm/thumb web and five separate digits, and one forefoot bend per foot. It preserves the current character family, colours, height/proportions, existing arm IK and named shoulder–elbow–hand / thigh–knee–foot semantics. Fit all dimensions from `measure(recipe)`; do not copy these Thuan dimensions unchanged onto children or other builds.

**Proposed rig ceiling: 62 bones** = existing 28 + 30 digit bones + two forearm twist helpers + two forefoot bones. Preserve the first 28 names, indices and parents; append additions, with at most four normalised weights per vertex. A 52-bone comparison with two bones per digit retains five visible digits but loses independently controllable distal flexion; equivalent handle/pinch/fist quality is unproved. The 62-bone registry is the canonical proposal; the 52-bone option is recorded only for comparison, not as a second body contract. Neither is performance-certified.

**Geometry/material gates:** canonical Thuan in the reference outfit targets **≤22,000 primary triangles**, versus 17,802 current. Other recipes may add **≤4,198 net primary triangles over their own baseline**, preserving existing wardrobe increment budgets; 22,000 is not a universal cap for every elaborate outfit. Keep two baseline colour meshes plus two ink shells, counting existing face accessories and held props separately. No extra limb material slots or per-finger draws. The two complete hands target ≤2,400 triangles after replacing the existing 1,840 hand-source triangles, including the collapsed finger payload. Paired desktop/iPad and actual-World measurements are still required; no frame-rate improvement is claimed.

Source compatibility gates, detailed in the package's `shared-game-limb-brief.md` and `proposed-controls.json`:

- Replace the implicit mitten contact offsets in `consume.js`/`work-hands.js` with geometry-derived palm/grip/tip data while preserving held-object attachments and two-bone reach. Make `setOpenHands(false)` rig-aware.
- Update `foot-ground.js`: it currently samples only vertices rigidly weighted to `footL/R`, so appended toe weights and blended soles need explicit membership/side metadata and cache invalidation. Preserve floor, seated, bicycle and lying support.
- Finalise digit/twist controls after the last actor/creator wrist override, including steering-wheel and work-hand operations; reconcile any new foot deformation with support.
- Preserve all clothes/swim/bath/after-bath bodies, shoe removal, shared spring bones and recipe rebuild behaviour. Verify child, teen, adult and elder stages, all three proportion modes and silhouettes, and extreme height/build combinations.
- Preserve recipe/share/save v1 compatibility. Version the rig/export contract separately: current motion v1 filters to its 17 named body joints, and GLB export opens the legacy fingers, splits braid geometry and omits runtime ink/cloth shaders. Explicitly support or bake new controls.
- Check six gestures, left/right grips and release, bends through the full existing pose range including beyond 90°, high reaches, walk/run, seated/floor transitions and all footwear. A frozen distant-hand/update mode is only a future option after measured validation; it is not implemented here.

## Amendment 2 — topology, outfit fitting and appearance

### Directional joint fans and full-arm outfit policy

`topology_refinement.py` supplies a concrete **nine-ring × 12-position** fan for each joint band: 108 construction positions, 96 quads and 192 triangles before surrounding connections. Elbow support is **±70 mm**, nominal section **86 × 90 mm**; knee support is **±90 mm**, section **122 × 130 mm**. Fan spacing compresses on the intended bend inside and opens outside, tapering to planar endpoints. Join corresponding ring phases without collapsed poles or internal caps. These replace the even joint-band guides in DXF regions 01/03/07; they are proposed topology, not a tested skinned mesh. The 90°/110° drawings are analytic bend guides, not runtime results. The replacement plans produce 17 whole-arm rings / 384 strip triangles and 16 whole-leg rings / 360 strip triangles before fitting/caps, within the unchanged component allowances.

Twelve cuff vertices alone do not guarantee a seam. A joined boundary needs matching phase, positions, bind frame and normalised influences; intentional cloth shells need their own offset and movement clearance. Preserve the sleeve's chest/shoulder blend. Remove or mask only arm faces proven hidden for the specific outfit and required motion. **Tank, sleeveless and swim variants must retain or regenerate a complete visible arm**; wardrobe changes must never expose a permanently truncated limb. A **2–4 mm cuff/hem flare** is only an initial fit range, subject to movement, shadows and ink. Collar stand/fold, cuff and hem work remains an optional appearance proposal preserving the existing charcoal polo.

### Axial helper and wrist transition

The one forearm helper per side carries **full extracted axial roll only**, inheriting forearm swing. Do not copy the full hand transform or apply the same roll twice through elbow and helper. Append it as a sibling of the existing hand under the elbow, aligned to the actual elbow–wrist bind vector, while preserving the old endpoint/prop APIs.

For the retained **202.694455 mm** forearm, use elbow→helper smoothstep weights over **0–190.694455 mm**, with **zero hand influence** in that shaft region. Over the **last 12 mm**, transition helper→hand so wrist swing remains local. At s = 95.347 mm the weights are 50% elbow / 50% helper / 0% hand; at s = 196.694 mm, halfway through the wrist transition, they are 0% / 50% / 50%. Blend the proximal bend band with the upper arm without exceeding four normalised influences. A single helper with linear blend skinning does not guarantee volume: an equal coaxial blend has approximately 20.7% radial loss at 75° and 29.3% at 90°. Actual mesh/corrective review remains required.

Build all 62 bones in the neutral bind frame, update world matrices and calculate a matching inverse-bind array before posing; verify the legacy 28 transforms/inverses remain unchanged. The bundled Three.js replaces mismatched supplied inverses with identities, so appending bones to the old inverse array is unsafe. Do not recalculate bind inverses in a posed frame.

### Hands and cupping

**Six-sided digit rings and three deformation segments were already in the CAD.** The refinement adds useful joint support, a thumb-web gusset and a shallow diagonal palm-cupping guide within the **34 mm depth** target. Keep five distinct digits; fit open, fist, point, pinch, wave and actual held-object contacts. Any palm corrective must be named and budgeted; no extra palm bone is included in 62.

“Toward the pinky” names the thumb-pad trajectory/grip target, not its hinge-axis vector. A simple swing axis is perpendicular to the current/target direction plane, expressed in the joint's local frame; mirror it properly and handle parallel/antiparallel cases. Fit opposition, flexion, web depth and pad orientation in 3D. The 35° placement and the palmar thumb projection are construction targets, not validated joint limits.

### Trainer collar and reference foot roll

At rim **Y105 mm**, the proposed leg section is **112.921 W × 121.053 D mm**. The revised clear collar is **122 W × 130 D mm**, outer **142 W × 150 D mm**, centred at local X0/Z0; its radial band is 10 mm and its **vertical recess is 10 mm to Y95**. Nominal static axis clearances are 4.539 mm per side laterally and 4.473 mm fore/aft. Keep a real opening and inner wall; darkness/AO must not conceal ankle clipping. These are static design clearances, not a moving-fit pass.

The **ball crease plane is Z = +92.669 mm**, normal +Z. The bend axis runs parallel to +X through **J = (0, 18, +92.669) mm**, above the ground contact B. `foot_roll_reference.py` defines a staged reference in the foot frame using `Q(P, θ) = T(P) Rx(θ) T(−P)`:

| Stance phase | Reference transform and nominal angles |
| --- | --- |
| **0–0.20: heel to flat** | Both segments rotate about heel H by −α; α decreases **12°→0°**. |
| **0.20–0.40: flat** | Both transforms are identity. |
| **0.40–0.75: ball support** | Hindfoot rotates about above-ground J by β, **0°→30°**; forefoot remains flat. |
| **0.75–1.00: toe support** | Forefoot rotates about toe T by γ, **0°→20°**; hindfoot composes that transform with β fixed at **30°**. |

Each stage uses smoothstep with zero angular slope at its boundaries. These are reference tuning values, not anatomical limits. Phase 1 still has toe support; the gait caller must release contact for swing. The executable accepts nonnegative angles with heel ≤85° and β+γ ≤85°. Hindfoot influence blends only across the **18 mm band behind B**, with loop offsets −18, −12, −6, 0 and +6 mm and respective hind weights 1, 20/27, 7/27, 0 and 0; it is exactly zero at and ahead of B. Move the posed ankle target through the hind transform and solve the leg IK; retain the original bind ankle and the forefoot child's fixed bind offset.

The final reference check covers **1,419,860 skinned-point evaluations**: 2,236 points × 127 phase samples × five angle cases. **Minimum Y = 0 mm, maximum support error = 0 mm, underside forward overrun = 0 mm**. Fixed-child-offset error is 5.12×10⁻¹⁴ mm; boundary differences at phase ±10⁻⁷ are below 10⁻⁶ mm. This verifies the defined flat-plane reference and weight assumptions only. Upper vertices may extend forward above the toe pivot; the sampled nominal design side outline has **6.420 mm** overhang. Upper volume, self-intersections, collar motion, terrain, whole gait, actual mesh weights and runtime/device performance remain unverified. The intentionally wrong whole-shoe +30° rotation about ground B puts the toe **57.750 mm below ground**; do not substitute it for the staged controller.

### Scalar AO, colour and ink safeguards

If visual review warrants AO, use a separate **normalised Uint8 scalar** per stored body vertex, neutral 255, instead of multiplying it into the RGB palette. Current garment texels alpha-replace the vertex colour, while ink also uses that colour: a colour bake can disappear under opaque cloth and darken the outline. For the first trial, apply scalar AO **after `aomap_fragment`, following lighting accumulation but before `outgoingLight` is summed**, multiplying **only `reflectedLight.indirectDiffuse`**. Keep direct cel bands, emissive, palette data, the face and ink unchanged. A separately approved all-light cavity tint has different semantics; do not silently substitute it.

Keep AO linear, before tone mapping/output colour conversion; do not gamma-convert the scalar or double-decode the sRGB garment texture. Chain existing Look compile hooks/cache keys and review Natural, Cartoon, Crayon/Sketchbook and other Looks for excessive darkening. Bake only stable local cavities, never bent-joint or arm-against-hip shadows that would remain after motion. Do not use shading to hide penetration.

There is no extra AO texture, but memory is not zero: the current non-indexed body adds **48,006 GPU-buffer bytes plus a 48,006-byte CPU array** for this attribute. At 22,000 primary triangles with the head unchanged at 1,800, the body attribute would be 60,600 bytes per buffer. The current body already stores triangle corners; changing their split normals alone adds no records or triangles. Bevels/extra loops add geometry, and a future indexed mesh must count actual duplicated attributes. Keep the baseline material/draw arrangement; explicitly handle custom AO in wardrobe rebuilds and standard GLB export.

## Prioritised improvements

1. **P0 — Correct the confirmed arm/hip interference.** Fit the complete clothed body and limbs before surface polish; preserve pivot lengths and validate relaxed pose plus full motion. The static candidate above is the starting evidence, not a completed fix.
2. **P0 — Record scale per variant before remaking.** World is approximately 1.64 m; film construction is 1.60 m; its poster mapping uses 1.49 m. These are distinct sources. This shared game proposal retains the current World scale; check counters, seats, prop reach and paired characters rather than silently rescaling it to the film reference.
3. **P1 — Articulated game hands, arms, legs and feet.** The latest owner request expands the hand-only suggestion to the shared limb system above. Current mittens are the existing style, not evidence that articulated fingers work. Preserve current IK, contacts, creator controls and save/export compatibility while implementing the proposed five-digit hands and coherent limb surfaces.
4. **P1 — Progressive facial controls.** World already has gaze, blinking and speech. Current `paintFace` uses a binary blink/talk repaint key; `face.js` closes eyelids above 0.5. Actual captures confirm blink 0.0 and 0.4 are identical, while 0.6 differs. `blinkLeft` alone does not repaint because independent blink fields are omitted from the cache key. Improve transitions and independent controls without losing heavy eyes, diamond jaw and rose mouth. Expression-based winks are not claimed absent; the latest limb request does not itself implement this earlier recommendation.
5. **P1 — Garment construction and deformation.** Current polo collar/placket are painted; lower sleeve edges are faceted, shoulder forms overlap in silhouette and the shorts read as rounded pelvis/thigh covers. Folded polo collar depth, coherent cuffs, waistband/crotch and controlled garment deformation remain proposals; preserve the charcoal polo and brown shorts. Follow the outfit-specific full-arm policy above, then review complete wave, high reach, walk and seated transitions.
6. **P2 — Braids and sneakers.** Replace stacked braid lobes with interlaced clumps while keeping colour, ties, silhouette and two-link secondary motion. Clarify trainer sole/upper/heel. The current neutral shoe gap is approximately 7.0 mm versus default 11 mm GPU ink expansion, and the front render shows their outlines meeting. The 16.987 mm proposal gap is separate and still needs local ink review; no underlying current shoe penetration is inferred from the outline alone.
7. **P2 — Runtime cost and exports.** Current body/head have 53,406 triangle corners and 17,802 source triangles, drawn in two primary meshes plus two ink shells. The isolated full views issue four draws, not a complete-game performance measure. In this neutral state 1,600 triangles are effectively zero area; 1,248 are specifically collapsed legacy fingers. Replace redundant geometry with export compatibility and meet the proposal's measured cost gates; no new runtime cost has been signed off.

## Blender film prototype — do not confuse with World

Authenticated source review of `jojo/3d/cast` confirms five-digit rigged hands, weighted jaw, clavicles, arm solving, reverse-foot controls and three-bone braids already exist in accepted film Thuan. Remaining work in its `checks.md`/implementation:

- Painted eyes have no blink or aim; do not transfer this claim to World.
- Fused sleeve/arm surface creases above approximately 70°; separate sleeve or corrective shapes remain needed.
- Blouse/pinafore is built around each still pose, not skinned for animation.
- Wrist colour transition, braid ends/grooming and fabric finish need refinement.
- Gesture and walk clips remain unrendered in the recorded work; stills do not prove continuous motion acceptance.

`thuan_ai.py` normalises the source to 1.60 m; `shots_poster.py` applies 1.49/1.60 for the shop scene. Its landmarks are rig centres, not external body dimensions. The film GLB was not downloaded, measured or newly rendered here. Local long-braid QA and Meshy figurine GLBs are separate, excluded assets.

## Verification actually completed

- **Initial four-sheet issue:** 14/14 artifact checks passed, covering snapshot/hash consistency, browser/CAD bounds, independent Node measurement agreement within 0.001 mm, sole datum, 17 baseline captures/no page errors, blink pixels, original PDF/DXF/OBJ/source counts and text bounds. Those unchanged baseline checks are retained in the final amended verification.
- **Historical amendment 1 verification:** **27/27 artifact checks passed**, including retained baseline checks, proposal CAD, rendered candidate landmarks within 0.001 mm, hand/arm geometry, registry, budget arithmetic and shoe-gap calculation. Its ZIP CRC/manifest hashes passed and seven amended files were saved. This historical total is not the amendment 2 aggregate.
- **Amendment 2 aggregate verification:** **39/39 artifact checks passed**. Final ZIP **9,255,316 bytes / 91 entries**; CRC and every manifest hash passed. All 12 PDF pages rendered and reviewed with no paragraph overflows. Seven established files were replaced with guarded versions and the refinement preview was saved as one new image; all eight per-file receipts succeeded and local identities were applied.
- **Amendment 2 PDF:** `output/drawing-checks.json` records **12 A3 pages, 420 × 297 mm, no text overflows**. New joint and foot detail sheets were rendered and independently reviewed against their source/proposal distinctions. Existing measured model/film distinctions remain.
- **20 capture records:** 17 baseline views plus three static candidate views in `output/limb-proposal-capture-report.json`; both reports contain zero page errors. Candidate captures retain the current model and mittens, with the declared local rotations.
- **Amendment 2 combined DXF:** 12 labelled regions, millimetres at 1:1, **27 native dimensions**, all `dimlfac=1`; the original 16 measurements/labels are preserved exactly. Reopening reports **zero audit errors and zero fixes** in `game_limb_design/combined-dxf-checks.json`. The current measured DXF's SHA-256 is unchanged. Full-layout, third-row and collar/recess renders were reviewed without clipped labels or unintended text overlap. Rows are at 0/−1400/−2800 mm; footer and initial viewport now fit all 12 regions.
- **Joint/foot reference evidence:** pure geometry and weight checks are recorded in the topology files; the final foot-roll report records **1,419,860 reference evaluations**, zero floor penetration/support drift/underside overrun within its stated assumptions. These checks do not validate a game mesh or controller integration.
- **Static clearance:** exact triangle-pair checks and containment checks for the selected existing limb/body surfaces give the 26.099 mm minimum on each side; candidate landmarks and true segment lengths agree with the capture and CAD data. Full motion, new-hand geometry and all-body clearance remain unverified.
- Three valid silhouette unions. DXF retains unsimplified boundaries; compact PDF contour errors are below 0.10 mm. Native dimensions explicitly show 564.4 / 1637.9 / 532.0 / 564.4 mm with `dimlfac=1`. Reopening reports zero audit errors/fixes.
- Neutral OBJ contains 16,202 non-degenerate faces; the source's 1,600 zero-area faces are excluded.
- The rig registry's 62 unique sequential indices, valid parent names and +4,198-triangle allocation arithmetic were checked. These validate the design data, not a working character.
- No new limb mesh, shader/controller integration, full game regression, continuous motion acceptance, Blender render or physical-device/performance sign-off is claimed. No game source/runtime files changed. The successful file-save receipts establish delivery only; they do not extend the scope of the design and mathematical checks.

## Primary source references and next action

World source review at `62bd8870`: `src/avatars/{thuan-studio-design,cast,build,face,garment,animate,springs,consume,work-hands,foot-ground,export,motion}.js`; `src/render/{cel,look-materials,looks}.js`; the bundled `vendor/three.module.js`; `src/people/residents.js`; `tests/thuan-studio-design.test.mjs`. The package's audit notes preserve exact source locations and the measurements/generators. Its geometry baseline remains `30771c7`; the existing-model static arm fit is recorded at `0ca94d2`.

Film: [checks](https://github.com/nj22az/jojo/blob/c9e3b6afdc911f07e01f9d888734a414e47207ea/3d/cast/checks.md), [rig](https://github.com/nj22az/jojo/blob/c9e3b6afdc911f07e01f9d888734a414e47207ea/3d/cast/airig.py), [wardrobe](https://github.com/nj22az/jojo/blob/c9e3b6afdc911f07e01f9d888734a414e47207ea/3d/cast/wardrobe.py), [scale/landmarks](https://github.com/nj22az/jojo/blob/c9e3b6afdc911f07e01f9d888734a414e47207ea/3d/cast/thuan_ai.py), [poster mapping](https://github.com/nj22az/jojo/blob/c9e3b6afdc911f07e01f9d888734a414e47207ea/3d/cast/shots_poster.py).

**Next:** prototype the shared game arms/hands/legs/feet on `development`, preserving current World scale, character identity and source compatibility. Resolve arm/hip clearance first, implement the directional fans and versioned bind/weight contract, adapt contacts/grounding and outfit rebuilds, then review matched before/after views plus complete motion across creator body variants. Integrate the staged foot reference only through the actual rig/IK/contact frames; validate upper shape and collar movement separately. Try scalar AO after geometry fits, with neutral comparisons and Look/ink/face safeguards. Measure runtime cost before promotion. The film workflow remains separate. This amendment records measured drawing, proposed construction and reference mathematics, not an implemented or performance-approved replacement.
