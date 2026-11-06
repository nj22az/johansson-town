# East lawn Japanese garden

A small procedural garden on the peninsula's east lawn, clear of the harbour park mound and its graded skirt.

Module: `johansson-town/src/world/east-garden.js`

The water-wave and firefly shader approach follows [Orlando Carnate's Japanese garden](https://github.com/orlandocarnate/japanese_garden) (Three.js Journey Perlin elevation and additive points). No model, baked GLB, texture, or external request is introduced by the garden. The existing harbour park may still stream its own `models/park/park-spring.glb`; that is a separate, unchanged asset.

## Behaviour

- Stone-rimmed pond at `x=28.15, z=-6.4`, two stone lanterns and a tsukubai basin.
- One 24-point firefly draw, visible from 18:30 inclusive until 06:00 exclusive, including midnight rollover.
- Water and fireflies animate using elapsed seconds; visibility follows town minutes.
- Pond, lanterns and basin register solid colliders. The inspection point and approaches remain walkable.
- The pond has concentric interior vertices for its ripples. Water is raised to 0.16 m above ground and troughs are limited to 0.10 m below that surface, clearing the 0.02 m lawn. Crests remain below the stone rim.

## Integration

`buildEastLawn` creates the garden once, passing through the parent group, colliders, shadows, terrain height, interaction registration and action handler. It returns `garden` and `tick: garden.tick` alongside the existing `useParkGreenery` hook.

`createTown` builds the east lawn only in peninsula mode. Its `world.update(dt, time, day, minutes)` calls `world.eastLawn?.tick?.(time, minutes)`. Other layouts retain their normal update behaviour. The game already pauses world updates indoors or while paused; the garden uses that same lifecycle and catches up to the town clock on the next outdoor update.

The garden's shader materials survive cel conversion and section culling. The existing streamed park grass/leaf hand-over is preserved.

## Verification

From `johansson-town`:

```sh
npm run build:runtime
node --test tests/east-garden.test.mjs tests/east-lawn.test.mjs tests/ground-clearance.test.mjs tests/cel-look.test.mjs tests/town-sections.test.mjs tests/shop-door.test.mjs tests/bus.test.mjs tests/thuan-evening.test.mjs tests/runtime-package.test.mjs
```

The tests exercise the actual town update, dusk/dawn boundaries, midnight wrapping, non-peninsula modes, collision clearance, the pond interaction, terrain clearance, cel/section compatibility and the absence of asset fetches during garden construction. The existing lawn flood test checks access from the road across the east lawn; the runtime tests verify that the compiled files match current source.

Browser visual verification remains outstanding: the review environment blocked its browser from opening the local preview. To finish that check, serve the repository, enter the peninsula town and walk to the pond. Check moving water without grass breaking through it, solid props, the pond inspection and fireflies at 18:30, midnight and 05:59, disappearing at 06:00. Confirm the Network panel contains no requests to the source garden project or its baked GLB. Inspect the console for WebGL shader errors and repeat after leaving and returning to the garden.
