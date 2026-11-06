# Compact seaside grid — 12 September 2026

Supersedes the coordinates in GRID-TOWN.md and COMPACT-TOWN.md.
The later consolidation in CONSOLIDATED-BUSINESSES.md supersedes the shop rows
and moves the residential street closer to the main street.

The six main-street businesses form three paired blocks. The supplied residential
street sits immediately behind the western shops; the supplied dining lane joins
the centre cross-street on the east. The tea house, bathhouse and bus hut close the
northern blocks. The working quay and warehouse terminate the main street.

| Measure | Previous | Revised |
| --- | ---: | ---: |
| Main street centreline | 110 m | 69 m |
| Navigation/map envelope | 120 × 156 m | 92 × 126 m |
| Envelope area | 18,720 m² | 11,592 m² (38% smaller) |
| Main shop rows, Z | Eight staggered addresses | 14, −8, −28 m |
| Quay centre, Z | −58 m | −44 m |
| Residential street centre, Z | −4 m | −8 m |
| Dining lane centre, Z | 18 m | 4 m |

These are map-envelope and route measurements, not a measurement of walkable area.
Building models retain their scale. The park is 70% of its previous linear size;
its sampled ground, retaining edge, bench and colliders use the same transform.

The coastline is closed, with sea on every side and distant land across water.
The former mainland neck is removed. The cave remains beyond the northern coastal
barrier, clear of the hillside shrine. Player movement uses the authored ground
network; the old fallback rectangle can no longer admit water beyond the moved
pier or abandoned streets.

Shop IDs, room contents, quests and save keys are retained. Doors, exit positions,
resident work/evening destinations, patrol and escort routes, inspection objects,
ambient sound, map markers and streaming triggers follow the relocated addresses.
The alley's sealed backs and existing interior assignments remain in place.

Validation: production build and compiled-runtime hash checks pass. The full-game
CPU smoke test enters and exits every registered interior and checks touch sprint.
The revised geometry tests cover all home/work journeys, district destinations,
loaded residential/dining ground, park ramps, model door visibility, coastal
barriers, collision-free cross-streets and the new map dimensions.

Six unrelated tests already fail on the parent revision: the inactive full-town
scene, harbour fallback expectations, two Inakaya guest expectations, office
wiring, and old Kenji voice subtitles. The parent's additional grid-clearance
failure is resolved by this layout. These results do not establish WebGL shader
output, sound playback or iPad frame rate. The local browser preview was blocked
by the browser connection.
