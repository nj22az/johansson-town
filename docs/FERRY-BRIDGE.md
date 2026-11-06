# Minato Maru bridge equipment

The bridge keeps the ferry's shared floor and collision arrangement, wing doors, crew stations, route controller, camera and audio. The supplied Setouchi prototype informed the equipment styling; it is not embedded as another scene.

`src/world/ferry-bridge.js` builds the sea-green console fascia, open CRT hood, twin order levers, eight-spoke helm, compass card, engine repeater, wipers, clear-view screen, pedestal chair and paper route sketch. Fixed fittings join the existing material batches. Parts which move together share a mesh; propeller hubs and blades are likewise batched without changing their shapes or rotation.

The repeater reads heading from the ship's yaw and RPM/orders from `ferry-plant.js`. Each lever follows its corresponding engine. Rain drives the wipers through the town weather setter; loss of board power parks them and blanks the radar. CRT updates are limited to eight per second. No new renderer, camera, pointer handlers, audio context or external dependencies are introduced.

The existing automatic crossing controller retains command of the ship. The helm is a model, not a new manual steering interface. The radar sweep is marked DEMO and supplies no navigational contacts. The sounder reports missing depth data; the chart is explicitly a route sketch, not surveyed bathymetry.

## Verification

- `node --test tests/ferry*.test.mjs tests/runtime-package.test.mjs`: 108 passing checks, including access routes, crossings, plant integration, ray-tested CRT visibility, chart orientation and mesh/triangle budgets.
- `npm run build:runtime`: rebuilt hashed runtime, manifest, page references and service-worker version.
- `TOWN_CHROMIUM_PATH=/path/to/chromium node tools/ferry-bridge-look.mjs output/ferry-bridge-look`: source views at 960 × 675 and 390 × 844.
- Add `--runtime --only='wide|phone'` to inspect the published bundle. Screenshots are in `docs/qa/ferry-bridge/`.
