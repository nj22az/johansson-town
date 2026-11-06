# Island trees: main publication — 25 October 2026

The owner explicitly authorised publication after reviewing the development game captures: **“Apply tree fixes to main.”** This authorises these tree changes as an exception to their usual development-only prototype workflow. It does not authorise unrelated Sakura, wardrobe, character or Pixar prototypes.

## Scope and provenance

Publication baseline: `feabf390514024079038630c3e10b33ac25dfb59` (preserves the newer auction-board fix). Original preparation baseline: `7c048393daaf614e242956cf3ee7b3f9bdc0f626`. Tree implementation: development `5ab0316ce45eaaf8662abe8e9a5e794d030cbe95`; reviewed evidence `71933188456381a4a17a23ddafb3eeb9251bff42`. Only the tree source changes, CAD A1 implementation data/tools, relevant checks and evidence are applied to current main. The main runtime is rebuilt from this checkout; no development runtime or unrelated prototype is copied.

The accepted CAD-derived trees are enabled in ordinary play, with **no URL flag required**. `TREE_REBUILD` is now an unconditional true compatibility switch; existing consumers and historical fallback code remain intact. The geometry stays in its own cacheable runtime chunk and now loads for every World session. The cherry builder and seasonal behaviour, planting centres and resident schedules remain unchanged. Cherry root collision, typed tropical bark collision, branch/root forms and matching near/middle/far geometry are included. No new planting or Linux package is released.

Read the [development implementation record](https://github.com/nj22az/nj22az.github.io/blob/development/johansson-town/briefs/HANDOFF-TREE-IMPLEMENTATION-2026-10-25.md) and [original CAD audit](HANDOFF-ISLAND-TREES-2026-10-25.md) for measured design provenance. The retained [contact sheet](../docs/qa/island-trees-2026-10-25/implementation/compiled-world-review.png) is from that exact development candidate, not a new main capture.

## Checks and limits

**23/23 focused checks passed** on both the original preparation and the final auction-board-preserving main candidate: geometry, park paths, Kitano on-demand loading, east-lawn collision and runtime packaging. The local full guard was interrupted before completion; no complete main guard pass is claimed. The final runtime is rebuilt on newer main before publication. GitHub guard, Pages deployment and hosted ordinary-play review are checked after the push. The production browser review explicitly omits `tree-rebuild`, proving ordinary-play activation; its workflow now runs on main.

The Kitano load check counts actual indexed triangles. Accepted near plants cost **592,364** triangles; distant plants **106,900** (18.05% of near). The far budget is 120,000, replacing the old 20,000 non-indexed substitute budget so curved fronds and crown placement remain consistent. This is a deliberate geometry-cost increase for the accepted shapes; physical frame rate is unverified. Near/middle/far hysteresis, on-demand island loading and instancing are retained.

The park route check now verifies the single visible-bark collider which encloses the accepted banyan trunk and roots, instead of requiring a duplicate legacy root collider. The production tree suite runs without environment overrides.

An additional non-guard scenery-placement check reports `nakamura-planter intersects shop-house` at (8.35, -14.375). The exact same failure was reproduced with the original tree path, confirming a pre-existing planter/building test issue; no planter or building is changed here.

Fine shade/outline banding remains visible on both rebuilt foliage and the retained cherry in the reviewed captures. Full World Look coverage, physical iPad/Safari and actual desktop/iPad frame rates remain unverified.
