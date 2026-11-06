# Minato Maru: crew stair and cosier accommodation, renders (3 November 2026)

These renders come from the game's own `buildFerryModel()`, loaded as ES modules in headless Chromium (SwiftShader
WebGL). The lighting is simple: a hemisphere light, a sun, and warm point lights placed in each room for the picture.
They prove the source geometry. They are **not** screenshots of the running game, they do not use the game's ink/cel
look, and they were not taken on a physical device. The windows show a plain sky colour because the ocean is not in
the scene.

| File | View |
|---|---|
| `saloon-to-the-bow.jpg` | Saloon from the cross passage to the bow windows. It shows the terracotta seats, head covers and wooden arms, the rose carpet, the curtains, the teak ledge and the muster sign. |
| `saloon-crew-stair-trunk.jpg` | The crew stair's trunk from the saloon aisle: the framed chart of the crossing, the seats beside it and the starboard side door. |
| `crew-stair-from-the-foot.jpg` | Up the crew stair from inside its doorway, with the yellow nosings and rails, and the well opening into the wheelhouse. |
| `wheelhouse-stair-well.jpg` | The well at the wheelhouse's aft starboard corner: its rail, and the chart table (with its paper chart and lamp) moved to the aft bulkhead. |
| `carpet-room.jpg` | The carpet room: the reading rack, the low tables with tea cups, the zabuton. |
| `stair-p-from-the-car-deck.jpg` | Stair P from its door on the car deck. The treads are clear of the stringers. |

**Rendered again after the z-fighting audit (same day).**
- In the first set, `crew-stair-from-the-foot.jpg` showed her wings' floor slab closing over the well; the flight
  climbed into it.
- On every stair a dark stub of stringer stood up at the back of each step.
- Both are fixed and tested (`tests/ferry-z-fighting.test.mjs`). The first set is in git at commit `c83256c`.

The CAD sheets of the same geometry are in `docs/minato-maru/exterior/` (JS-127-X3). The walk through the stair is
tested in `tests/ferry-walk.test.mjs`, and the seats and the accommodation in `tests/ferry-accommodation.test.mjs`.
