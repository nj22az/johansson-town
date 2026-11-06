# Minato Maru engine room — Blender H1-F1

The owner's latest instruction is to make the assets in Blender and drop the Meshy step. H1-F1 implements that decision. The owner has authorised main publication. The room is the default game arrangement, with eight fixed exploration cameras; no URL flag is required. Current publication evidence is in `briefs/HANDOFF-FERRY-ENGINE-ROOM-MAIN-2026-10-31.md`.

## Editable assets and CAD

- `Minato_Maru_Engine_Room_H1.blend`: native Blender 4.0.2, metric, 1,290 named editable source components, 221 inward-bevelled equipment boxes, 43 source dial faces, retained booth glass and eight locked cameras. The machinery collection is marked as an Asset Browser asset.
- `cad/Minato_Maru_Engine_Room_H1_Implementation.pdf`: sixteen A2 sheets. H1-01/02 define the height scheme; H1-03/04 coordinate service openings, lighting, doors, landing and ladder; H1-05 coordinates boarding; H1-06 specifies inward surface refinements before construction. Ten survey sheets retain the machinery arrangement.
- `cad/JS127-ER-H1-03.dxf`: mm model space with native dimensions and four A2 layouts. `cad/finish-h1-f1.json` is the controlling surface schedule. Maximum equipment bevel 6 mm, further limited to 10% of the smallest part dimension; corners are cut inside the original envelope.
- `cad/Minato_Maru_RevC_H1_Checkpoint.zip`: sealed original twelve-sheet CAD checkpoint, five DXFs, source measurements and earlier reference. Later amendments govern the prototype.
- `geometry-h1.json`: shared source geometry in game-local metres. Blender maps `(x,y,z)` to `(x,-z,y)`, then exports glTF Y-up into the same game frame.
- `renders/`: Blender model previews, distinct from game captures. All use the eight CAD cameras, EEVEE / 64 samples / 960 × 720 and AgX tone mapping.

The machinery remains the existing fictional Johansson Marine specification. Engines, gearboxes, shaft axes, counts and tank-top levels are retained. Nominal underside is +3,600 mm above keel, floor +900 and tank top +700. A 2,400 mm working envelope remains below services at +3,300. Two inboard service openings retain 800 mm between post faces. The 400 mm deck structure zone is a reservation.

H1 raises the vehicle deck and upper decks by 1,000 mm, retaining 4,200 mm vehicle clearance. The primary ladder has a 3,100 rise, 2,200 run, fourteen risers, 800 clear width and 1,150 top landing. The side door and retained lobby benches clear its approach. The 4,000 mm gangway meets the actual Minato pier top; the forward crew station follows its actual forecastle floor.

## Game application

`assets/models/ferry-engine-room/minato-engine-room-h1-f1.glb` contains 80,376 triangles, two paint/metal material groups and 3,587,152 bytes. Round parts have outward faces and smoother sides; all 29,268 evaluated source faces pass the outward-normal audit. Normalized byte vertex colours hold a bounded 220 mm contact-shading pass. Positions and normals retain floating-point precision. No texture downloads or UVs are required.

The GLB loads lazily on the first H1 machinery/access view. A failed load keeps the source fallback; successful loading disposes it. Live labels, gauges and controls remain the game's own, with no coincident exported copies. The original H1 GLB remains available for older compiled clients. Illustrative pipe previews remain excluded.

Cameras follow the ship's complete transform, with hysteresis at cuts. Held input retains its world heading until released. V cycles room shots; ordinary FOV/zoom and the saved first/third-person preference restore on exit. Explicit free-camera, inspection, photo and cinematic tools take precedence. The two nearest source luminaires supply runtime light, without shadows.

`tools/ferry-engine-room-review.html` supplies placements in the compiled game: Start Exploring, choose a room, walk with WASD and cycle with V. The ordinary gangway/ladder route remains available.

## Rebuild

From `johansson-town`:

```sh
node tools/export-ferry-engine-room-h1.mjs
python tools/ferry-engine-room-cad-h1.py
blender -b --factory-startup --python tools/blender/build-ferry-engine-room-h1.py
blender -b --python tools/blender/review-ferry-engine-room-h1.py -- --render
npm run build:runtime
node --test tests/ferry-fixed-camera.test.mjs tests/runtime-package.test.mjs
```

The builder reads the surface schedule before constructing details, checks every evaluated source face, bakes contact colour and enforces the two-material / 100,000-triangle / 4 MB budget. `--shots=control,workshop` restricts a render review; `--cycles` selects the offline renderer. Render-only plate readings are static source values; runtime gauges remain live. The saved scene retains 1,600 × 1,200 / 128-sample Cycles settings for further rendering.

## Acceptance

The cloud browser cannot create a WebGL context. Actual game screenshots, desktop/phone visual acceptance and GPU performance remain unverified. Blender previews and numerical geometry/camera checks provide review evidence.

The model remains a development geometry study. Real vessel structure, lightship/KG/stability, windage, tidal/berth access, hoist/restraints, ramps, protected escapes, fire volumes, ventilation, complete pipe routing and supplier lifting/removal remain engineering holds. Open fuel C1 work is not silently incorporated. The owner authorised publication of this engine room on 31 October 2026. Real-vessel engineering acceptance remains separate.
