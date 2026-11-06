# Compact Minato street correction — 17 October 2026

## Baseline and scope

Reconciles main `cd7eb799` with the compact urban island from PR #191 (`4801004d`). Merge conflicts were confined to generated runtime references and the service-worker build stamp; the current main entry page was retained and rebuilt from the combined source. Main's Linux download, site and course updates are retained. The compact shoreline and all 43 retained building plots remain as specified by PR #191. No new rural land or tropical-island changes are introduced by the street correction.

## Confirmed defects and corrections

- Coastal paving used a separate ribbon builder, with 120 mm / 100 mm lifts and overlapping round discs at bends. It now shares the urban surface compiler; junctions have one geometric owner.
- Old garden diagonals and the old shopping-lane strip duplicated the new grid/footway. Their separate paving is retired; compatibility navigation aliases and underlying terrain remain.
- Plot circuits crossed carriageways as independent paving. Explicit precedence keeps asphalt continuous and joins circuits edge to edge.
- The west promenade and coastal path ran along parallel centrelines. The promenade now uses the coastal alignment at x = -36.7 m, width 2.4 m.
- The Main Street extension's square end extended into the first northern plot. The asphalt now ends at z = 46 m within the residential cross lane.
- The commercial mouth was laid across the east pavement, with a different asphalt colour, width and elevation. Both vehicle streets now use 4.5 m carriageways, the shared painted asphalt palette and the 40 mm paving datum. The east pavement and kerb are cut at the junction.
- Service turnout and loading slabs overlapped the main carriageway. They now stop at its edges. Cargo driveway and parking lay-by have disjoint footprints.
- A west crossing sign obstructed the swept body of a delivery vehicle. It is now on the outer pavement edge.

## Hierarchy

| Element | Width | Surface | Use |
| --- | --- | --- | --- |
| Main Street | 4.5 m | Painted asphalt | Vehicles; marked pedestrian crossings |
| Commercial branch | 4.5 m | Same asphalt | Vehicles; separate footway |
| Residential lanes | 3 m; existing 4 m collector | Plain concrete | Shared low-speed local access |
| Harbour service access | Existing measured courts and swept paths | Asphalt driveway / concrete quay | Deliveries, parking, ferry access |
| Main Street pavements | Existing frontage-bound widths | Matching paving | Pedestrians |
| Building circuits | 2 m | Plain concrete | Pedestrians |
| Coastal circuit | 2.4 m | Same plain concrete | Pedestrians |
| Fujita access | Existing 2.2 m pier and 1.2 m shed circuit | Timber | Pedestrians |

`street-plan.js` supplies classification, explicit priority, specialist reservations and convex polygon subtraction. `layout.js` exposes street/access metadata for navigation. `lane-surfaces.js` renders the resulting disjoint patches, subdividing only graded areas. Original harbour, park, ferry and timber builders retain ownership of their specialist surfaces.

## Verification

- 167 focused regression checks: **166 pass, 0 fail, 1 intentional skip** (removed headland). Includes full building/coastal circuits, shoreline support, actual collision/navigation, full rendered vehicle footprint, quay driving surfaces and ferry systems/operations.
- Five street-specific checks within that run cover polygon area, pairwise non-overlap including oblique joins, asphalt priority, the northern endpoint and raycast support at a common finished height.
- Production runtime rebuilt successfully. Three runtime packaging/source-hash checks pass.
- The source-derived overhead surface plan was inspected (`surface-plan.png`). It is a plan, not a WebGL screenshot; specialist reservations are shown schematically.
- The available remote browser cannot connect to the local preview (connection refused). Browser ground-level/mobile visual acceptance is therefore not established by the local tests. Live browser verification is attempted after publication and recorded separately.
