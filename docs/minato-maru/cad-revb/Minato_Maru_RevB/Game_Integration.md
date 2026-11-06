# Minato Maru - correction integration, Revision B

The corrected source is recorded in [draft PR 173](https://github.com/nj22az/nj22az.github.io/pull/173), commit `b52cd035f382c8c185324a9966fe26839cf21340`. It has not been merged into or deployed to the live game. The complete application runtime and browser acceptance remain pending.

The game source remains the procedural rendering and collision authority. CAD equipment envelopes are engineering references; importing them over the complete existing ferry would duplicate geometry and could remove walkable surfaces or collision openings. The OBJ and 3D DXF contain the machinery-space reference, not a replacement full-vessel hull.

## Coordinate contract

CAD uses millimetres: X forward from the transom, Y to port from the centreline, Z upward from the baseline. Native game coordinates use metres: x port, y up from the design waterline, z forward of amidships.

| From CAD | Native game coordinate |
| --- | --- |
| X | z = X / 1000 - 17.25 |
| Y | x = Y / 1000 |
| Z | y = Z / 1000 - 1.90 |

OBJ is exported in CAD millimetres. Apply the coordinate conversion once, without adding a second floor or draft offset. The machinery floor is Z 900 mm and the current deck underside is Z 2800 mm. These remain unchanged by this correction.

## Adopted changes

- Generator beds move 2.65 m forward into the auxiliary room, at X 15200-16050 mm. Geometry, plates, terminals, local controls and electrical route estimates follow this move.
- The main-engine fore-end service band extends to the X 14000 mm engine-room bulkhead. Use the centre and outer auxiliary aisles, including the aft cross-passage at X 16550 mm, rather than cutting diagonally through the generators.
- The compatibility ID `aft-peak` now refers to paired trim-ballast reservations under the auxiliary room, at X 14100-15400 mm. It no longer denotes a tank outside the stern hull.
- Hull displacement at 1.9 m immersion is geometry-derived; the legacy lightship, operating-weight target and motion GM remain explicit unverified parameters.
- Engineering acceptance is available through `FERRY_INTERIOR.engineeringPipes`. `FERRY_INTERIOR.pipes` retains illustrative game previews and must not be presented as construction-valid pipework. Every unresolved positive-bore connection remains in `pipeRouteIssues`.

## Verification boundary

Eighty scoped source tests passed, covering the ship data, plant, game access, rendering budget and new electrical, hydrostatic and route regressions. The corrected model measures 92,316 triangles in 39 meshes, within the unchanged numerical budget. This is not a measured frame-rate guarantee or a full town/browser acceptance result.

Proposed manufacturer envelopes, machinery-removal covers and lifting reservations are not adopted construction geometry. Their supplier interfaces, service procedures, structure and certified lifting paths remain open. See the engineering review and construction work register before treating a CAD reservation as an implemented part.
