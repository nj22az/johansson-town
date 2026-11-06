# Minato Maru bridge lantern circuit — 2 November 2026

The owner asked to redraw the unclear bridge/lantern book image in Blender and then update **Bryggan på Minato Maru**. This bounded prop addition preserves the existing cartoon bridge. It is eligible as the owner's small-feature exception in AGENTS.md; it does not replace the room or promote a detailed-room/Pixar prototype. Only the local isolated branch `codex/minato-bridge-lantern-2026-11-02` was used for preparation. No new remote branch is needed. Publication is authorised by the root after independent review, the rebuilt runtime/package checks, focused asset/bridge checks and unchanged vessel-walk checks. The complete hosted guard is monitored after the push; the local serial run is not a pre-publication requirement in the applicable instructions. Base: main `4f545da4b6c441d1c36dd8eb34db44b1a480879d`.

## Delivered

Native [Blender scene and equipment notes](../art/ferry-bridge-lantern/README.md), self-contained builder, versioned game GLB and actual-source Blender proofs. A small healthy 12 V independent teaching/service circuit is marked **12 V ÖVNINGSKRETS / EGET BATTERI · TVÅ LEDARE**. Its battery sits on an explicitly supported sidewall tray beside the existing echo sounder, clear of retained VHF equipment. An intact fuse holder is mounted to the console fascia. Both conductors are physically modeled through paired below-window glands and along the bridge-wing dodger to a separate exterior practice lamp. No poor-contact patch or book-only 2 Ω fault appears in the normal game.

The ship's canonical 24 V banks, existing red/green sidelights and other navigation lights, emergency plant, floors, collisions, wing-door routes and bridge instruments are unchanged. Runtime integration is confined to building/exposing the independent practice prop from `ferry-bridge.js`. GLB is lazy near the bridge, three meshes, 692,060 bytes; load failure retains matching geometry and its label. No additional runtime light source or timer is added.

The original larger aft cabinet was rejected when the unchanged real-vessel walking test caught a narrowed wing-door approach; it was removed completely. Independent review then found an unsupported fuse overhang; the final tray/fascia layout resolves it and the retained VHF overlap. Actual Blender images caught upside-down native lettering; the final source corrects all three labels and tests their up/normal vectors. These are corrected intermediate findings, not remaining defects.

## Review and verification

Independent agent `physical_model_v4` approved the frozen final source and all three Blender views with **no remaining P1/P2**. Its focused new/existing bridge/runtime run passed **9/9**. Root also inspected all three final proofs and authorised publication after the final guard and unchanged walking checks.

Final GLB SHA-256: `77158376cc01d50bc5a8007217a3857faa5544b7c5ad934bd0f7f843bbd1f2ad` (10,968 triangles).
Native `.blend` SHA-256: `201fc43e8440fc01840d73bfea4aa5c3ce51f670b9fdabd261ddc5e8ac132f64`.

Local focused asset/topology/failure-path, retained CRT/helm/plant and runtime checks: **9/9 pass**. The complete unchanged vessel-walk suite passes **12/12**, including port-wing entry, below-deck routes, ramp, gangway and moving ship. Final runtime rebuilt; all **122** production runtime JavaScript blobs are preserved byte-for-byte (see `docs/qa/bridge-lantern-2026-11-02/production-cache.json`). Unpublished intermediate chunks are excluded. The local serial guard passed all 13 town surface/no-z-fighting checks and seven NPC seating checks, with no failure recorded in the captured portion. It has no completed aggregate summary and is not claimed as a full pass. Root authorised this bounded publication while tracking the automatically triggered hosted full guard; no unrelated older-area approval rule is applied to this feature.

Proofs: [console](../docs/qa/bridge-lantern-2026-11-02/console-final.png), [circuit overview](../docs/qa/bridge-lantern-2026-11-02/circuit-overview-final.png), [external lamp](../docs/qa/bridge-lantern-2026-11-02/external-lamp-final.png). These render the actual source bridge plus the final GLB in Blender. No local browser executable or physical device was available; no browser-render, iPad/Safari or hardware performance success is claimed. Hosted World/WebKit checks and Pages deployment status must be recorded following the authorised fast-forward publication.

## Publication state

Implementation commit: [`7e362dc956032af6d710b31597b4852e411995ee`](https://github.com/nj22az/nj22az.github.io/commit/7e362dc956032af6d710b31597b4852e411995ee). Authorised for atomic publication from fresh main `4f545da4b6c441d1c36dd8eb34db44b1a480879d`; the following metadata commit changes no tested runtime/source. Current release/check status is recorded in the root handover index. Fast-forward only; no force push and no additional remote branch. Canonical game entry [Johansson World](https://nj22az.github.io/johansson-town/) was verified HTTP 200 from this environment.

Next: monitor the automatically triggered hosted full guard and Pages deployment, and verify the public versioned GLB plus rebuilt page/source bytes. Physical-device visual review remains distinct from these checks.
