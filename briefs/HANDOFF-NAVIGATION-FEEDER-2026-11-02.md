# Minato Maru: the navigation lantern's actual supply

The owner corrected the previous independent practice installation: the chapter concerns the navigation lantern's feeder. This bounded correction starts from main `afd2dc2e2a1d4f03ec3eeab0a86d2aa9d9ecf681` and supersedes the independent battery/lamp part of the earlier bridge lantern/wiper releases. The pantograph wipers are preserved.

## Result

The separate battery, battery tray, exposed practice fuse and additional white lamp are absent from the active bridge. The existing navigation-light console is replaced in its original starboard-console position by an enclosed four-channel panel, paired fuse caps and mechanically retained double-pole switches. A separate incoming two-core feeder rises inside the existing console into its base gland. The outgoing two-core cable follows the forward sill, passes a gland through the solid sidewall below the glass and runs along the outer wing to the **existing green starboard sidelight**. No cable crosses a wing doorway or walking floor.

The actual ship data says **105 V AC, 60 Hz, insulated two-wire**, supplied by the emergency switchboard's 105 V section through the existing 440/105 V emergency transformer (`ferry-ship.js` FERRY_ELECTRICS and `nav-lights` load). The 24 V batteries are a separate system. Neither navigation conductor is DC negative or hull return. The chapter retains its explicitly simplified 12 V DC calculation values; these are not ship equipment ratings. There is no invented converter and no ship electrical redesign.

The existing `setNavigationLights` command still controls all four original navigation lamps and their original colors/positions. Its command is retained through loss of main supply: lenses extinguish while neither main nor emergency supply is available, then resume when the plant's emergency generator comes on load. Switches retain their ON position through power loss. The new starboard lens replaces the old primitive in the existing navigation-light list, rather than adding a fifth lamp. The asset loads only near the bridge; load failure retains the visible fallback and the same supply/command behavior.

## Sources and validation

- Editable original: `art/ferry-navigation-feeder/Minato_Maru_Navigation_Feeder.blend`, metres, individually named components. `scene.json` is the topology/placement record. `inputA`/`inputB` are AC source anchors; `inputP`/`busN` aliases exist solely to map the book's separate DC model.
- Reproducible builder: `tools/blender/build-minato-navigation-feeder.py`.
- Active asset: `assets/models/ferry-bridge/navigation-feeder-v2.glb`, two meshes, 111,436 bytes. Static housing/cable and dynamically controlled lens are separate; the four runtime lever pivots and normal panel markings remain when native geometry loads.
- Focused feeder/bridge/wiper plus unchanged vessel-walk tests: **25/25 passed**. Includes native load, offline fallback, correct retained control state, actual plant blackout and emergency recovery, walking floors and routes, and unchanged wiper mechanics. The panel-label UV check verifies the operator-facing text is above the correct physical channel after the plane’s 180° rotation.
- Runtime build and package/feeder checks: **10/10 passed**. All **172** pre-existing production runtime JS blobs are retained byte-for-byte for already-open clients.
- The emergency transition test uses minutes as required by `createPlant.tick`: lamp off at 44 seconds, restored at 46 seconds around the 45-second threshold.
- Blender proofs: `docs/qa/navigation-feeder-2026-11-02/console-final.png`, `circuit-overview-final.png`, `external-lamp-final.png`. These combine actual game geometry, native feeder geometry, actual runtime lever meshes, and Blender text reproducing the runtime panel canvas labels. They are **source-geometry proofs**, not browser screenshots or physical-device evidence.

No full local serial guard, physical iPad or hardware installation test is claimed. Hosted World guard, viewport checks, Pages publication and live-byte matching are tracked in root release evidence after main publication. Existing older v1/v2 practice assets remain solely for old clients; the active source never requests them.

Publication commit and final hosted status: see the latest root `HANDOVER.md` and `release-evidence/navigation-feeder-2026-11-02/README.md`.

## Bounded screen-joint correction

Initial feeder publication `177c0e21c39d4fc9a2491ca3b48d3e597d4f2b76` was followed by a late source/Blender review finding: the inboard and aft light screens overlapped at their coplanar upper faces. The inboard screen now ends exactly at the aft screen’s forward face, with no overlapping volume; native and fallback regenerate from the same parts. A bounds test prevents recurrence. Active asset URL is versioned v2, retaining v1 for already-open clients. The initial publication’s workflow status is superseded by the follow-up; final results are recorded in root release evidence. The old starboard primitive sector board is removed because the replacement housing now supplies its screens; a test inspects actual built-vessel geometry for the former overlapping corner. The route, supply ratings, controls, lamp color and wipers are unchanged.
