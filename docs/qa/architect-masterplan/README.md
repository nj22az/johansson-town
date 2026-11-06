# Architect masterplan — 17 October 2026

The town now has a shared public circulation plan in `src/world/architecture-plan.js`. Twelve Kitahama homes occupy two aligned rows of six; the two former east-back homes have moved inland into the same street grid. Main Street continues to the neighbourhood cross street. The police box, flats, staff homes, flower counter and utility buildings have reserved public approaches and circuits. The internal west-yard dividing wall and redundant dock staging clutter are retired.

Main-island land area is **37,280.375 m²**, down from **44,997.625 m²** in the previous published revision: **17.15% less land**, or **30.85% less than the original 53,911.625 m² island**. This trims unused shore while retaining Aoba, Fumoto, Hoshizaki, the lighthouse, harbour and town.

## Walking and alignment

- 57 registered building or garden plots have closed public circuits. These include the shop backs, houses, flats, town hall, power house, bike shelter, harbour buildings, island homes, radio station, farm buildings and lighthouse.
- Public building circuits have nominal 2 m paving; the collision audit probes a 0.95 m radius along every circuit, leaving a 10 cm numerical allowance across the total width. The player radius is 0.32 m.
- The coastal circuit closes and has 2.4 m clear width. The coastal road is checked across its full width, including its narrower 2.6 m approach. Its old narrow Nishi promenade section is replaced by a proper connection to the neighbourhood street.
- Fujita has a narrower 1.2 m timber circuit on piles around the shed, connected to the timber approach and houseboat gangway. The obsolete broad L-pier spur remains removed. His nightly walk aboard is still tested.
- Main Street paving is partitioned around asphalt courts. The shared lane union replaces overlapping district paving. Building signs fit their lettering; air conditioners and upright signs are above the fascia band.
- Both beach entrances retain continuous descents; the north shore grades into the new neighbourhood level.

## Verification

`tests/architect-masterplan.test.mjs` builds the **live business catalogue**, including Sakura and Front-Row, rather than an empty shop list. It samples all full circuits every 15 cm, checks the reserved collision widths and shoreline, checks successive heights, and floods the real scene at 50 cm player-navigation resolution to verify that every circuit connects to Main Street. The coastal carriageway is checked at 25 cm intervals across its full width.

The focused 22-file regression run passed **77 tests**, with one existing retired-headland test skipped. Subsequent checks covering the final plot changes, coastal road, beach grading, paving separation, home approaches, power wires and flower-shop interactions passed. The production runtime build succeeded; source hashes and packaged runtime are checked separately before publication.

The following are source-derived geometry previews, **not browser screenshots**. They omit textures, game UI, water shaders and streamed model details. A live visual browser check could not be completed because the available browser could not create a WebGL context. Automated collision checks and these previews do not establish visual perfection on the user's device.

- [Measured island and town plan](masterplan.png)
- [Actual town geometry](architect-geometry-preview.png)
- [Actual Fujita timber geometry](fujita-geometry-preview.png)
