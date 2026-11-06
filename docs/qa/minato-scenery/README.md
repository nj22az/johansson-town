# Minato scenery audit — 18 October 2026

Base: `e3ddf417287d718584e69c7f4efa7074188c8b3d` (main after PRs #203–207).

## Findings and corrections

- Constructed the active town in Node with the existing DOM fixture, including distant Kitano/mobile configuration. Inspected transformed mesh vertices, individual instanced-mesh transforms, collider footprints and deferred detail registrations. This is geometry inspection, not a rendered visual review.
- No active Minato tree roots or shop/stall structures were established in open sea. In particular, the florist at world (21,17), east-lawn drawn triangles and service-court foundations remain on the compact shoreline. The reported offshore objects are **not reproduced** by this audit; cached older runtime, another camera location or another object could still explain the report, but none is asserted as the cause.
- Two town-hall fukugi at (16.2,44.7) and (37.6,44.7) intersected the hall's rear wall: a 0.7 m trunk does not fit the retained 0.6 m rear strip. Removed them from the shared placement list consumed by both meshes and colliders. Retained fourteen other windbreak trees.
- Removed the obsolete east-lawn treeline generator. Its `x>6` exclusion already rejected every candidate, but it still constructed three unused broadleaf geometries and a material. The hall and police-box approach remains open; park/garden planting supplies the established tree system.
- Removed the two separate sphere-crown sea-almond decorations and their colliders from the narrow west promenade. Retained the existing benches, lamps, seawall, park cherry and garden windbreaks. No replacement planting, roads or attractions added.
- Empty `plantSites` no longer registers a `street-plants` detail job, avoiding an unnecessary GLB fetch and decode. The existing loader still operates if real placements are supplied later.
- Colliders: 611 → 607 in the same mobile/distant scene. Deferred jobs: four → three. Mesh count remains 2,685 because the changed district geometry is batched and the windbreaks are instanced. These counts are not a frame-rate or memory benchmark.

## Harbour structures deliberately preserved

The whole-collider support test permits bounded, documented deck footprints for the ferry pier, Fujita's shed and houseboat, and oil-jetty head. The east quay's seaward retaining kerb has its own narrow allowance. It does not permit arbitrary decorations outside the coastline. Shore rocks, wave-breaking tetrapods, boats, marine wildlife and utility crossarm overhangs are not evidence of misplaced terrestrial planting.

## Automated checks

`tests/scenery-placement.test.mjs` checks the actual generated town:

- Every active Minato collider's rotated footprint, including its interior, sampled at intervals no larger than 0.15 m, is supported by land or a documented harbour deck. Boundary tolerance is 0.1 mm. This is a sampled regression check, not an exact polygon-containment proof.
- Negative controls reject a tree in the east sea, a stall beyond the shortened northern coast, and a footprint whose centre is on land but extends over the concave shoreline.
- Retained planting roots clear building footprints.
- All used/drawn vertices of the lawn, compact neighbourhood ground, service foundations and florist stall are on land. Unreferenced lawn grid vertices are intentionally ignored.
- Empty planting cannot queue a model download; retired tree meshes/colliders cannot return.

32 focused tests passed:

```
node --test tests/scenery-placement.test.mjs tests/compact-island.test.mjs tests/coordinated-streets.test.mjs tests/school.test.mjs tests/park.test.mjs tests/fujita-houseboat.test.mjs tests/airport-dock-access.test.mjs tests/nakamura-shop.test.mjs tests/east-lawn-tree-collision.test.mjs
```

The compact-island test samples the entire pedestrian coastal circuit at 0.1 m, checks body collision and floor continuity, and floods residential/town-hall access. Nakamura tests cover counter access, the family entrance/stairs and the resident's homeward route.

`npm run build:runtime` passed; `node --test tests/runtime-package.test.mjs tests/ground-clearance.test.mjs` passed (5 tests). The build preserves the preceding runtime graph for cached clients, following the repository build script.

## Verification limits and existing failures

- The complete town test suite was not run.
- `tests/east-lawn.test.mjs` still has three failures: expected wall count 5 versus current 3; a coarse flood finds (7.2,-11.2) stranded; an older paving test reports 2 cm clearance failures around residential lanes. Re-running the original files against unchanged base reproduced all three, plus its stale requirement for the already absent lawn trees. The current tree tests explicitly require no retired treeline/collision. No claim is made that all pre-existing navigation/surface issues are resolved.
- Playwright browser installation failed because its download was not a valid ZIP. The available cloud browser opened the published town but reported “The browser could not start the 3D graphics engine” after Start Exploring. No overhead or pedestrian screenshots, visual acceptance or GPU performance results were obtained.
- Physical iPhone/iPad Safari performance, actual mobile rendering cost, streamed-model visual placement and the user's reported offshore trees/stalls remain unverified. Existing iPhone resource safeguards were preserved.
