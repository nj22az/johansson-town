# Minato Maru engine room — Blender H1-F1, 31 October 2026

**Publication update:** the owner has now instructed “Implement and push to main”. The [main-release handover](HANDOFF-FERRY-ENGINE-ROOM-MAIN-2026-10-31.md) supersedes the development-only status below. This note preserves the original asset construction and verification history.

**Latest owner decision: "Make the assets in blender don't care about mushy now".** The active workflow is Blender only. Meshy and its former sign-in handoff are superseded. H1-F1 refines and applies the measured assets without changing the machinery arrangement or camera design.

Development only, opt-in `?engine-room-h1`. H1-F1 implementation: [091b24d3](https://github.com/nj22az/nj22az.github.io/commit/091b24d31a808854740c59da920ed0771f5d2133), verified source tree 6b3a2fe881006a29a6df3eecfa6099c4c61326eb. All 53 changed blobs and the complete tree match the tested local Git snapshot. It follows development `a30fb308700921e36032d1fdcd11dd78edd7dcab`; original H1 implementation is `e43e6ff292bda94b5918dcb881acc8692e1b450b`. Exact current source/tree publication evidence belongs in `docs/qa/ferry-engine-room-h1/validation.json`. Preserve the owner's main/development/pixar workflow; no main promotion or Linux release is included. Main was read at `83783c93448d1be251a61c213959448e1d21c971` during this pass.

## Delivered assets

[Editable Blender scene](../art/ferry-engine-room/Minato_Maru_Engine_Room_H1.blend) retains 1,290 named source components in metres, with the machinery collection marked for the Asset Browser. H1-F1 adds inward bevels to 221 equipment boxes, rounder cylindrical parts, separate source-colour paint/metal/rubber materials, 43 source gauge faces, plate backgrounds and retained control-booth glass. Cylindrical faces in the earlier Blender export were inward-facing; their winding is corrected, with all 29,268 evaluated source faces now audited outwards. The two-material game GLB includes bounded contact shading. The source plate and glass detail is render-only; World retains its existing live plate and glass planes.

The applied asset is `assets/models/ferry-engine-room/minato-engine-room-h1-f1.glb`: **80,376 triangles, two primitives, 3,587,152 bytes**. Vertex colour is normalized unsigned byte; positions/normals retain floating-point precision. No UVs or texture downloads. The loader uses the new versioned filename to avoid stale cached geometry, retaining its lazy load/disposed-fallback behaviour. The older GLB remains for older compiled clients.

[Sixteen-sheet A2 CAD](../art/ferry-engine-room/cad/Minato_Maru_Engine_Room_H1_Implementation.pdf) includes the sealed original twelve-sheet checkpoint and four implementation amendments. H1-06 and `cad/finish-h1-f1.json` define surface refinements before construction: maximum 6 mm bevel inside the existing envelope, further limited by part size; no new machinery or pipe routes. The mm amendment DXF has four A2 layouts and native dimensions. Six editable DXFs total, five preserved in the checkpoint ZIP.

| Element | Retained H1 geometry |
| --- | --- |
| Machinery floor / tank top | +900 / +700 mm above keel |
| Working envelope | 2,400 mm clear; services at or above +3,300 |
| Structural underside / car deck | +3,600 / +4,000; 400 mm reserved structure zone |
| Passenger / bridge / compass decks | +8,400 / +11,000 / +13,400; preserve 4,200 vehicle clearance |
| Primary ladder | X6,400 head to X8,600 foot; 3,100 rise / 2,200 run; 14 risers; 54.64 degrees |
| Clear ladder / top landing | 800 width / 1,150 landing X5,250–6,400 |
| Port side door / lobby benches | Door X5,300–6,400; benches X3,200–5,000 and X6,700–11,000, total 6,100 retained |
| Service rails | Two 800 mm openings between 40 mm posts at X10,380 / X11,220 |
| Doors | Booth X10,900; bulkheads X14,000 / 19,000 / 22,500; all 2,100 high |
| Grating | 3,100 × 1,260; real 6 mm bars / 50 mm pitch; floor +900 over tank top +700 |
| Lights | Nine measured fittings; nearest two active in World, no light shadows |
| Boarding | 4,000 gangway solves actual pier-top contact; forward crew station derives from actual forecastle floor |

Engine, gearbox and shaft axes/counts remain source-derived fictional Johansson Marine equipment, without an OEM substitution. Starboard crankcase stays closed. Illustrative pipe previews remain omitted. No unaccepted fuel C1 work is incorporated.

## Exploration and rendering

Eight locked camera positions/targets remain CAD-exact in the saved Blender scene and World. They follow the ship's full translation/yaw/pitch/roll. Automatic cuts have hysteresis. Held movement keeps its world heading across a cut until released. V cycles the current room's shots without overwriting first/third-person preference. Normal FOV/zoom restore on exit. Free camera, inspection, Photo Studio, pocket camera, cinematics and explicit audit cameras take precedence; hands are hidden and Johansson remains visible.

`tools/ferry-engine-room-review.html` supplies placements in the compiled game. It does not replace ordinary gangway/ladder access. The [artifact README](../art/ferry-engine-room/README.md) gives reproducible CAD/export/render/build commands. Previews use Blender and the eight saved cameras, with AgX tone mapping. They are model previews, not actual-game captures.

## Verification

Current pass results and hashes: [validation.json](../docs/qa/ferry-engine-room-h1/validation.json). Build geometry evidence: `blender-finish-audit.json`; camera reopen evidence: `blender-audit.json`; guard and focused logs in the same directory.

- Focused geometry/camera/GLB/boarding and runtime package: **11/11 pass**. Covers metric bounds, finite unit normals, byte vertex colours, two-material budget, retained 2 m booth-door envelope, locked-camera transforms and movement.
- Full World guard: **482/482 pass, 93 files, 485 s**, Node heap 6,144 MB / concurrency 2.
- CAD: sixteen A2 pages, mm DXF with clean audit; surface details stay inside the source envelope.
- Saved Blender: 1,290 source components; eight locked CAD camera positions/FOV; all evaluated source faces point outwards.
- H1 vessel walk from the preceding geometry pass: **7/7 pass**, including actual physical voyage/crew procedure, gangway, both bow ramps, stairs, bridge and crew-house routes. H1-F1 changes surfaces only. The current focused route check also goes down the primary ladder through ER/aux/workshop and returns to the car deck.
- Runtime rebuilt for the versioned asset path; package hash checks pass. No source changes are hidden in a Blender-only delivery.

## Remaining acceptance

**Actual-game visual review remains open.** This cloud browser reports `GL_VENDOR = Disabled`, `GL_RENDERER = Disabled`, `BindToCurrentSequence failed`; direct and review-iframe WebGL both fail. The stored browser picture is a startup page. Do not claim actual-game H1 screenshots, GPU performance or physical-device acceptance from Blender stills or numerical framing checks.

**Real vessel engineering remains open.** Structure, lightship/KG/stability, windage, tidal/berth access, hoist/stow restraints, ramp loads, protected emergency escape, fire-suppression volume, ventilation duties, complete pipe routing and supplier lifting/overhaul paths require acceptance. The old 190 m³ fire-volume basis is not accepted for the enlarged space. The historical 1.8 m fuel-head claim is not established by the roughly 0.15 m interface difference. Fuel C1 PR #192 was last verified open/unmerged at `9761f61304d3ac7a66d9061b593d61fce706805c`; it is not described as main.

Next: on a WebGL-capable device, open development with `?engine-room-h1`, walk the pier–gangway–ladder–ER–booth–aux–workshop/store–electrical route and back, inspect all automatic cuts/V selections, verify view/photo/inspection restoration, and capture desktop/phone game views. Resolve engineering holds before real-vessel acceptance. Main awaits the owner's separate promotion decision.
