# Minato Maru: free-look exploration — 1 November 2026

Owner: the room looks better but is difficult to explore; the camera jitters. The proposed free-look walk, stable ship-relative lens, proper collision, machinery inspection and labelled ladder guide were authorised with **“Implement”**. This follows the owner's existing instruction to implement and publish this engine-room work on main. It supersedes the default locked-camera behaviour in the [H1-F1 release handover](HANDOFF-FERRY-ENGINE-ROOM-MAIN-2026-10-31.md); the measured layout, Blender source, GLB, headroom and original engineering holds remain unchanged.

Source implementation `8bdf28c6073775fb4f87115ba2aff37b3be13ca7`, tree `3ee34359570f63166d22f9f8e5c31bded82373f0`; identical to local source snapshot `f6b4f142ccbbb06f8e334a896911251c4b1a705d`. Prepared from current main `027f3e3f8a1dc993d3801f415fc57c5f6e0ea855`, preserving its newer Pocket Camera metadata. Publication, hosted checks and actual captures are recorded in the root handover/release evidence.

## Behaviour

- Default **Explore** uses freely controlled looking at a fixed eye height, 1 m/s walking and 0.35 m/s precision speed. The left thumb moves without automatic steering or running; the open view looks. Keyboard WASD/right-drag/IJKL and controller looking remain available. No head bob, automatic camera cut or automatic recentering below deck. Third-person preference outside the room is retained.
- The final rendered camera is placed once after ship motion. Feet and lens use the same current ship transform and the measured local floor. Look easing is independent of frame rate. Conversations, the item inspector, photo studio and pocket camera retain camera ownership when active.
- Tap visible machinery, use **Inspect machinery**, or press **O**. Drag to orbit; pinch, wheel or the zoom buttons adjust distance. The inspection lens sweeps in short steps against actual solids and glazing, remains within the room's floor/headroom envelope and hides Johansson to keep the item unobstructed. The player stays in place; **Explore/Escape** restores the walking view. Inspecting continues the ferry's normal timetable.
- **V / Saved views** selects one of the original eight views explicitly. The panel's selector reaches each view; movement is paused while viewing it. **Explore/Escape** returns. Walking through a room boundary never selects a view.
- A collapsible panel carries the labelled measured floor plan, live position/heading and **Guide to ladder**. It computes a body-clear route using the existing floors/solids and standing footprint. Guidance never teleports or auto-walks. Existing live plant actions remain available in ordinary exploration.
- The enclosed-room draw excludes hidden town scenery behind opaque bulkheads, retaining the ferry, people, lights and the established ink/grade/HDR/MSAA pipeline. Visibility restores after every draw, including errors. Outdoor/ladder views retain the town.
- Inspection releases the walking thumb's invisible hit area, so it cannot intercept an orbit gesture. Sensitivity and invert-Y are respected. The departure panel and Jump do not cover the engine-room view.

## Genuine spatial limit

The chair in the control booth blocks the aft pocket for the standing 560 mm footprint. The old review placement at CAD `[9.2,-3.1,.9]` was clear at that point but had no body-clear way past the chair. The review now uses the physically tested entrance-side position `[10.55,-2.8,.9]`. The route finder explicitly refuses a path through that chair, through equipment or from midway up the ladder. The camera can inspect the controls above the chair without moving the player's body. No furniture, geometry or collision footprint was silently shrunk; a future furniture move requires an updated measured arrangement and Blender export.

## Verification

Local browser attempt: the available cloud browser reports **WebGL disabled / error creating WebGL context**, including after one retry. No direct hands-on device success is claimed.

The full-game CPU tour (real controller, geometry, physics, simulation and rooms; renderer/DOM substituted) passed and then exercised the engine room: **0.49748 m** travel in 0.6 s, standing ship-relative lens drift **1.87e-13 m**, inspection return and eight manual views. Focused controls/collision checks passed **48/48**; final package/vehicle/camera checks passed **22/22**, including nine new camera/navigation tests. The initial guard's two failures were an intentionally not-yet-rebuilt runtime and an isolated click-handler fixture missing the new ferry context dependency; the runtime and fixture are corrected with all original assertions retained.

The full local guard passed **576/576**, 111 files, 350 s; subsequent focused checks include the final route-entry and actual-GLB picking cases. Exact source/tree hashes, current runtime cache preservation and hosted publication results are recorded in the release evidence and root index. No physical iPhone/iPad/Steam Deck performance claim is made.

The native phone flow now uses the shared real-game exploration check. An additional WebKit job creates **fresh** iPad portrait (744×1133), iPad landscape (1133×744) and desktop contexts, checks canvas bounds and full graphics, drives normal walking/looking, precision speed, actual surface taps, orbit/zoom, floor-plan guidance, all eight manual views and room transitions, then restores the ordinary lens/preference. It records software-rendered frame intervals, screenshots and video; those timings are observations, not physical-device benchmarks. The earlier resized-phone tablet capture is no longer used as tablet evidence.

## Next

Review the actual hosted captures/recordings and then try the room on a physical iPad. Check two-thumb walking/looking, close gauge inspection and standing stability. Keep the source geometry and CAD as the basis for any future furniture or access change. No new Linux package is published by this change.
