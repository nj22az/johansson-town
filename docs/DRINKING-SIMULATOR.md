# Shared sober drinking simulator

The standalone laboratory is available at `/drinking-simulator/`. It uses the repository's vendored **Three.js r170**, an original Blender mannequin, and one **6.6-second sober choreography** shared by beer, whiskey and gin and tonic. Vessel size, hand fit, pour and the tilt required by remaining liquid are profile data. There are no personality or intoxication variants in this baseline.

Johansson World's seated izakaya interaction also uses the shared timeline through an adapter for its existing cast and serving props. The laboratory provides the detailed finger, mouth and liquid inspection scene; the game keeps its established models and visual style.

## Run locally

Run from `johansson-town` in the repository. The static route needs Python 3 and a browser with WebGL2; it has no build step or external CDN dependency.

```sh
python3 -m http.server 5175 --bind 127.0.0.1
```

Open **http://127.0.0.1:5175/drinking-simulator/**. Keep the server running. The source `index.html` needs this server for its ES modules and GLB.

For an immediate offline demonstration, open **`drinking-simulator/standalone.html`** directly in a WebGL2 browser. This separate, self-contained build embeds the same application, model, editable Blender download and instructions. Its three drinking cycles were verified from a `file:` URL with all HTTP requests blocked. **`drinking-simulator/drinking-simulator-source.zip`** contains the portable source, vendored dependencies, Blender assets and focused tests, with its own README. The full town adapter remains in this repository.

For development with the repository's Vite setup:

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open `/drinking-simulator/` on the URL printed by Vite. The static server is preferable while recording evidence because source edits will not trigger a hot reload.

### Tests and repository build

```sh
node --test tests/drinking-liquid.test.mjs tests/drinking-rig.test.mjs tests/drinking-simulator.test.mjs tests/drinking-game.test.mjs
npm run build:runtime
node --test tests/runtime-package.test.mjs
npm run build
```

`npm run build` regenerates the existing town runtime and runs the repository's Vite production build. The static laboratory can also be hosted directly with its relative `src/`, `vendor/` and `assets/` dependencies.

To repeat browser interaction checks, screenshots and live recordings, start the static server and run:

```sh
DRINKING_URL=http://127.0.0.1:5175/drinking-simulator/ CHROMIUM_EXECUTABLE=/path/to/chromium node tests/drinking-simulator.browser.mjs
```

This uses the installed Playwright package and the supplied Chromium executable. It writes evidence and `browser-results.json` to `docs/qa/drinking/`. Its software-rendering configuration must be identified in the results.

## Controls and inspection

Select a drink, then press **Take a sip** or **Space**. The volume display follows actual consumption. **Refill** is available at rest; **Reset** immediately restores the selected drink and seated rest pose from any phase, including a paused phase. Empty glasses cannot start another sip. Repeated sip input, refill and drink changes are blocked during an action.

**Inspect** opens development controls, hidden initially: pause/resume, slow motion, exact-time scrubbing, fill presets, phase/contact telemetry, coordinate markers and side, body, mouth, grip, set-down and orbit cameras. The normal presentation is an orthographic side view. The body view reveals seat and foot support.

**Record sip** captures the live canvas through `MediaRecorder` at normal speed, choosing a supported WebM or MP4 format. It records one cycle and a short resting hold. The requested capture rate is 30 fps; this is not a claim that a device renders at 30 fps. Recording locks speed, scrub and repeated actions through the final hold. Reset cancels recording without downloading an incomplete clip. Recorder setup, encoding and timeout failures restore the controls and prior playback speed.

## Shared choreography

| Time (seconds) | Phase | Contact requirement |
| --- | --- | --- |
| 0–0.25 | Prepare | Small head/shoulder adjustment; hips and feet stay supported |
| 0.25–0.90 | Reach | Open hand follows a curved path around the stationary vessel |
| 0.90–1.20 | Grasp | Fingers and opposing thumb close before lifting |
| 1.20–1.65 | Lift | Glass and wrist move together with the grip established |
| 1.65–2.30 | Approach | Raise the glass clear of chin and chest |
| 2.30–2.60 | Contact | Drinking rim arrives at the mouth target |
| 2.60–3.85 | Sip | Tilt about the lips; consume only with valid contact and liquid at the edge |
| 3.85–4.40 | Swallow | Restrained jaw/throat cue; consumption has stopped |
| 4.40–5.00 | Recover | Move away from the face and return towards upright |
| 5.00–5.65 | Set down | Base meets the supported table placement |
| 5.65–5.95 | Release | Fingers open after the glass is supported |
| 5.95–6.60 | Return | Hand settles into its original rest pose |

The timeline uses smooth acceleration/deceleration and an absolute elapsed clock. Phase boundaries are evaluated explicitly even when a delayed frame crosses several. Pausing freezes time and volume; returning from a hidden tab resets the wall-clock reference. Reset and exact-time inspection do not depend on the preceding pose.

### Drink profiles

| Identifier | Vessel height | Starting pour | Requested amount per sip | Appearance |
| --- | ---: | ---: | ---: | --- |
| `beer` | 155 mm | 400 mL | 42 mL | Tapered clear glass, amber liquid, modest foam |
| `whiskey` | 92 mm | 60 mL | 12 mL | Wide tumbler, thick base, shallow amber pour |
| `gintonic` | 165 mm | 260 mL | 35 mL | Narrow highball, pale liquid, three retained ice cubes |

Capacities derive from the actual polygonal interior. Profiles also contain wall/base dimensions, rim markers, wrist position/orientation, finger geometry, material and foam/ice settings. The last sip consumes only what remains. All three retain the same phases and timing; lower fills require greater tilt, approaching horizontal for the final mouthful.

## Source structure and contact model

| Source | Responsibility |
| --- | --- |
| `drinking-simulator/index.html`, `main.js`, `style.css` | Entry point, controls, telemetry and recording |
| `src/drinking/scene.js` | Lighting, floor/table/seat, cameras, shadows and framing |
| `src/drinking/mannequin.js` | GLB loading, supported pose, analytical arm IK and diagnostics |
| `src/drinking/hand.js` | Fixed-length fingers and opposing-thumb fit |
| `src/drinking/cycle.js` | Shared phases, easing and boundary-safe time advancement |
| `src/drinking/simulation.js` | State, glass authority, trajectories, constraints and consumption |
| `src/drinking/profiles.js`, `vessel.js` | Drink data, thick glass geometry, markers and liquid visuals |
| `src/drinking/liquid.js` | Volume-conserving plane/interior intersection and required tilt |
| `src/avatars/table-drink.js` | Adapter for town avatars and the delivered table prop |

One unit is one metre. The mannequin faces +X; its anatomical right arm is on the camera-facing +Z side. The seat top is 0.46 m, table surface 0.74 m and coaster 3 mm thick. The glass base rests at `[0.13, 0.743, 0.085]`. Hips, soles and the far resting hand retain their support positions while the upper body moves.

The head has a local mouth marker; each vessel has outer-rim contact, inner liquid edge, grip and base markers. One controller owns the vessel transform: table during rest/grasp/release, trajectory during transport, and mouth during contact/sipping. The laboratory never changes the glass's parent. During contact, position is solved from the rotated rim offset, so the glass rotates about the lips without sliding away.

Evaluation order is body pose, world matrices, mouth target, vessel transform, wrist/arm constraints, fingers, liquid and diagnostics. The arm retains its 0.29 m upper arm and 0.26 m forearm. An analytical elbow solution respects an 8–155° flexion range and a 55° wrist-deviation limit without stretching. Digit poses use tangents outside the vessel wall with approximately 0.6 mm capsule clearance. Diameter and grip height change the wrap without changing finger lengths. An outward approach stand-off keeps extended fingertips clear before closure.

Liquid volume is independent of the mesh. The solver intersects the closed, 48-sided tapered interior with a world-horizontal plane, then finds the plane offset enclosing the requested volume. Displayed sides and cap use that same volume. Foam is a bounded band above the surface; ice is positioned deterministically inside the glass and remains after emptying. Flow requires `SIP`, rim-to-mouth position/orientation agreement, and sufficient tilt to reach the inner drinking edge. Actual consumption is clamped to available volume.

## Reuse and events

The laboratory dispatches `sipCompleted` once when a real cycle finishes. Subscribe on the `DrinkingSimulation` instance, or on `window` in the included page, which forwards the event:

```js
window.addEventListener('sipCompleted', ({detail}) => {
  const {drinkId, volumeConsumedMl, remainingVolumeMl} = detail;
  // Future behaviour uses actual consumption, not button presses.
});
```

The laboratory detail contains `drinkId`, `volumeConsumedMl` and `remainingVolumeMl` as unrounded millilitres. Reset cancels without emitting completion. `renderAt` is an inspection operation and does not emit a completion event.

For deterministic inspection in the running page:

```js
const lab = window.__DRINKING_LAB__;
lab.sim.reset();
lab.sim.selectDrink('whiskey');
lab.view.setCamera('mouth');
const diagnostics = lab.renderAt(3.5, {volume: 30});
// volume is this sampled cycle's starting volume, not a forced final level.
// Seeking pauses playback and is independent of seek order.
console.log(diagnostics);

lab.sim.reset();
lab.sim.sip(); // Start a normal action from rest.
```

`lab.metrics()` exposes measured frame intervals, CPU frame times, draw calls, triangles, renderer dimensions and available browser/GPU identification. `lab.clearMetrics()` starts a fresh sample. `lab.record({download: false})` returns `{completed: true, blob, filename, mimeType}` after a full capture. Cancellation returns `{completed: false, cancelled: true}`; failures return `{completed: false, error}`. Neither produces a misleading partial download.

### Izakaya integration

The complete 6.6-second interaction currently runs on the player's seated izakaya actor. `createAvatarTableDrink` retargets it to the existing cast rig. Resident/NPC and other held-item drinking paths share the phase envelope but retain their existing 2.4-second timing and held-prop controllers.

`createBeerService.beginSip()` reserves the delivered prop and prevents a competing sip or replacement. The original prop retains its room parent; no duplicate held glass is created. The adapter aligns its rim to the rendered mouth, solves the existing arm, uses the volume-aware liquid visual and debits only valid contact. Completion restores the original placement. Cancellation also restores placement while retaining any amount already consumed.

The adapter supports the game's single-vessel `draft`, `can`, `awamori` and `oolong` props. First-person drinking exposes the near arm from the original skinned avatar with its shared skeleton. View changes and completion/cancellation restore visibility. Standing, jumping or issuing another pose cancels the reservation safely.

The shared adapter was checked against Johansson, Thuan and Mr Fujita and all seven izakaya seats. It fits the existing palm/thumb around the delivered mug's handle, preserving approximately 1 mm clearance from the glass body. These characters keep their authored mitten-like hands; adding the laboratory's individual finger articulation would require extending their models and rigs.

The game's event contains `drinkId` (`draft` maps to `beer`), `volumeConsumedMl` and `source: 'izakaya'`; it currently omits `remainingVolumeMl`. Existing town alcohol/time accounting receives actual consumption. This work does not add a separate drunken animation.

## Editable assets

- `assets/models/drinking/drinking-mannequin.blend`: editable Blender 4.5 source.
- `assets/models/drinking/drinking-mannequin.glb`: actual runtime meshes, materials and hinge hierarchy.
- `tools/blender/build-drinking-mannequin.py`: reproducible authoring/export script.
- `assets/models/drinking/README.md`: coordinate conventions and rig notes.

Regenerate from `johansson-town` with Blender 4.5 on `PATH`:

```sh
blender --background --python tools/blender/build-drinking-mannequin.py
```

This overwrites the generated `.blend` and `.glb`; preserve manual Blender edits first. The export has 53 meshes and 28,506 triangles, including fingers, thumb, facial silhouette, jaw and throat. It is an original segmented artist mannequin with rigid articulated parts, not a deforming human skin. Motion remains editable JavaScript; no baked animation clip is claimed. Vessel source is the editable geometry/profile code.

## Verified numerical checks

The four focused test files above pass on the current implementation. Numerical/model checks are separate from browser appearance and rendering performance:

| Check | Verified scope and tolerance |
| --- | --- |
| Liquid volume | Full, half and 2.5% starting pours at upright/intermediate/drinking tilt; solved and rendered enclosed volumes within **0.0002 mL** of requested volume |
| Surface/enclosure | Cap lies on its horizontal world plane within **1e-8 m**; liquid/foam stays inside; rotated ice corners remain enclosed after emptying |
| Fill-dependent flow | Lower pours require greater tilt, including 1 mL; insufficient tilt cannot consume |
| Rig/support | Actual Blender/GLB geometry, positive scales and right-hand hinges; soles meet floor and pelvis meets seat; hips/feet/far hand remain fixed |
| Grip/arm | 41 closure samples per vessel; full-closure finger/thumb capsule clearance **0.45–1 mm**; wrist error below **1e-6 m**, no reach clamp, wrist deviation ≤**55.001°** |
| Sampled mesh clearance | All drinks at starting pour, half and **1 mL**, whole cycles at 40 Hz plus five neighbouring samples around each phase boundary; actual mannequin vertices and triangle centroids clear the vessel side-wall envelope within **0.1 mm** tolerance |
| Phase continuity | Boundary samples: glass/wrist/elbow displacement below **0.02 mm** and glass orientation change below **0.00002 rad** |
| Time/state robustness | 30, 60 and 144 Hz plus 0.91 s updates give matching consumption within **1e-8 mL**; repeatable seeks, pause, repeated input, reset during reach/sip/set-down and consecutive sips through empty/refill |
| Town adapter | Seven izakaya seats; wrist error below **3 mm**, sip rim error below **1e-8 m**; three cast proportions across six consecutive draft sips; cancellation, first-person visibility and frame-subdivision accounting |

Mesh checks exclude lip meshes, which touch the rounded rim, and narrow end-plane regions. They sample vertices and triangle centroids rather than continuously sweeping every triangle. They detect the tested penetrations/discontinuities; they do not prove collision-free movement for arbitrary future changes.

## Evidence and measured browser results

The browser script produces a real-time recording per drink, full/half/nearly-empty sip views, grip/mouth/set-down close-ups, five-frame transition sequences, whole-body support and portrait captures in `docs/qa/drinking/`. `browser-results.json` records actual host/browser/graphics identification, measurements, checks and errors.

Validation ran on **21 October 2026** in **Chromium 131.0.6778.0**, Linux 6.18.55, on an **AMD EPYC 9V74** host exposing **9 logical CPUs**. Graphics used **ANGLE/Vulkan SwiftShader (software rendering)**. The desktop viewport was 1100 × 800 with a 1100 × 636 canvas; the mobile viewport was 390 × 844 with a 390 × 631 canvas. Both used DPR 1. The mobile context enabled touch/coarse-pointer input and exercised actual taps; it was not a physical phone.

All three drinks passed real browser captures at starting pour, half and 4%, including oblique grip, lip contact and supported set-down. The browser run reported **zero page/HTTP errors**. Controls passed repeated-input, selection gating, pause, phase-reset and recorder fault-injection checks. Complete normal-speed captures consumed **42 mL beer, 12 mL whiskey and 35 mL gin and tonic**. Their captured elapsed times were approximately 6.8–7.0 seconds, including the ending hold.

| Measurement | Mean frame time | Mean rendered FPS | p95 frame time | Median / p95 CPU frame time |
| --- | ---: | ---: | ---: | ---: |
| Desktop, beer, no recording | 54.8 ms | 18.2 | 116.7 ms | 3.0 / 5.0 ms |
| Desktop, beer, recording | 91.1 ms | 11.0 | 116.6 ms | 2.9 / 6.0 ms |
| Desktop, whiskey, recording | 91.3 ms | 10.9 | 250.0 ms | 2.4 / 6.3 ms |
| Desktop, gin and tonic, recording | 103.1 ms | 9.7 | 233.3 ms | 2.6 / 5.8 ms |
| Mobile viewport, gin and tonic, no recording | 43.1 ms | 23.2 | 83.3 ms | 2.5 / 3.6 ms |

CPU timing covers JavaScript update and render submission; it is not a GPU timing measurement. The rendering reports approximately 31,000–32,000 triangles and 66–72 draw calls, with DPR capped at 1.5 and one 1024-pixel shadow map. The recordings are genuine live canvas captures, and the low software-renderer cadence is retained. **The 60 fps desktop / 30 fps mobile targets have not been established on physical hardware.** Safari, Firefox and physical iOS/Android devices were not tested.

The feature build passed the full local repository guard: **46 test files in 196 seconds**, including runtime consistency and the four new drinking suites. The later main-branch startup fix and ferry brief were then incorporated, the runtime was regenerated, and the runtime-consistency and additional audit-startup tests both passed. The combined guard now lists 47 files. The final compiled-town browser run below also passed against that combined runtime. The cast-grip regression samples real skinned hand vertices and triangle centres: the palm clears the mug body while the handle remains inside the clasp. See `docs/qa/drinking/ci-guard.txt` and the machine-readable capture reports.

The additional unrecorded desktop measurement used 121 frame samples. A separate **0.25× beer recording** captured 26.81 seconds of actual browser playback and consumed exactly 42 mL. It is not a slowed copy of the normal-speed video. Offline verification completed all three drink cycles with no network requests or page errors. These results are recorded in `docs/qa/drinking/slow-motion-results.json`.

### Delivered visual evidence

| File in `docs/qa/drinking/` | Contents |
| --- | --- |
| `beer-real-time.mp4`, `whiskey-real-time.mp4`, `gintonic-real-time.mp4` | Separate normal-speed, complete live drinking cycles |
| `beer-quarter-speed.mp4` | Real browser playback at 0.25× for inspecting transitions |
| `contact-sheet.png` | Oblique hand grip, lip contact and supported set-down for all three vessels |
| `transition-contact-sheet.png` | Five neighbouring frames around grasp, lip contact and table contact |
| `*-full-sip.png`, `*-half-sip.png`, `*-near-empty-sip.png` | Changing fill-level inspection captures |
| `browser-results.json`, `slow-motion-results.json`, `video-files.json` | Browser checks, measured performance and encoded file metadata |

Original WebM captures are retained alongside MP4 delivery copies. MP4 files use a 30 Hz presentation track that holds existing frames where necessary; no motion interpolation or playback acceleration is applied. This encoding choice does not imply 30 newly rendered frames per second.

### Compiled-town verification

The final rebuilt game passed its browser smoke test in Chromium 131 with the same SwiftShader software renderer at **1280 × 800**. The test used normal **Drink / R / V / W** controls in Minato Izakaya. It covered all twelve phases, the same delivered mug and room parent throughout, first- and third-person sips, repeated input, two completion events and standing during a partially consumed third sip. Cancellation returned the mug to its table position and retained only the amount already consumed. The final run reported **zero browser, shader, HTTP or model-load errors**, and no cancelled requests. It did not measure game FPS.

At third-person grasp/sip/set-down and first-person grasp/sip, **3,056 rendered hand surface samples per pose** gave a minimum mug-body clearance of **0.999994 mm**, with the handle retained inside the clasp. Sampled wrist and sip rim-target errors were below **1e-12 m**. These figures describe the tested geometric targets and samples, not continuous collision guarantees. The two completed game sips each consumed approximately **95.295 mL** under the town's existing serving model; the laboratory uses the separate profile amounts above.

Town captures and `browser-results.json` are in `docs/qa/drinking-simulator/town/`. The game browser evidence specifically verifies draft beer. Repeat that check after building the runtime with:

```sh
CHROMIUM_EXECUTABLE=/path/to/chromium node tests/drinking-town.browser.mjs
```

The town script starts its own private loopback server and opens the izakaya at 20:30.

Rebuild the portable deliverables from the full checkout with:

```sh
node tools/build-drinking-preview.mjs
python3 tools/package-drinking-source.py
```

`tools/record-drinking-slow.mjs` captures quarter-speed playback and verifies the offline HTML. `tools/build-drinking-evidence.py` assembles the captured contact sheets and converts original recordings to MP4; it requires Pillow and FFmpeg. The evidence tools do not generate substitute screenshots.

## Remaining limitations

- The rigid segmented mannequin has articulated fingers and a swallow cue, but no deforming facial skin, muscle simulation or anatomical hand-surface deformation.
- Liquid is a volume-conserving quasi-static approximation, without dynamic slosh, spilling, bubbles or fluid/ice momentum. Visual ice does not subtract displaced volume from the pour calculation; foam does not simulate drainage.
- Glass uses alpha blending and explicit render order rather than physically simulated refraction. Material/camera changes require renewed visual inspection.
- Collision checks are sampled with the exclusions above. Constraints are tuned for the supplied body, vessels and table placement; arbitrary props/proportions require validation.
- Town cast hands remain mitten-like and do not acquire the laboratory's articulated digits. Composite bottle/cup, sake flask/cup and coffee/saucer props retain their existing interactions until the vessels can move independently. Ramen/inventory and NPC drinking paths also retain their existing controllers. Standalone whiskey/gin profiles do not automatically add those drinks to the town menu.
- Browser/device claims are limited to recorded measurements. Safari, Firefox and physical iOS/Android devices need their own runs before compatibility or frame-rate claims are made.
