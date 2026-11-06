# Minato Maru bridge: wipers and normal equipment markings

The owner asked to remove the large teaching sign and replace the hanging T-shaped wipers with proper Blender models. This supersedes the appearance and wiper behaviour in the [earlier lantern release](HANDOFF-BRIDGE-LANTERN-2026-11-02.md). Preparation starts from current main `8e42b80ce0412834d9e3245b62c4819d5a49aa17` in a clean detached worktree, preserving the earlier checkout's staged work. This is the authorised bounded main fix; no extra remote branch, book or synchronisation-lab change.

## Result

The whole large plaque, its white backing board and both teaching phrases are removed from the native Blender scene and fallback. Only the small ordinary **12 V** marking remains on the battery. The new versioned `bridge-lantern-v2.glb` prevents an already cached v1 from restoring the sign. The v1 asset remains for old open tabs. The independent 12 V hardware, ship's canonical 24 V supply and four existing navigation lights are unchanged.

Three original Blender-built pantograph wipers replace the old T primitives. Fixed motors, mounting plates and spindles attach to the actual solid upper window frame. Paired arms connect to a carrier that keeps the rubber blade vertical on the exterior pane throughout its approximately 80-degree sweep. No invented raked panes replace the actual vertical game windows. Native and fallback share the same Blender geometry, with four mesh parts shared across three units: twelve draws and 4,080 triangles. The 124,792-byte GLB loads only near the bridge and retains current pivots/pose on replacement.

Powered rain wipes. Dry powered motors finish the cycle and park smoothly at −0.7 rad. Power loss holds the current pose and phase; restoration continues without a jump. The old instantaneous power-off park assertion was replaced by explicit pose-hold and powered-park checks. Heading, plant, radar, helm, existing walking floors/collisions, wing doors and navigation lights retain their previous code and behaviour.

## Validation

- Combined lantern, bridge and wiper checks: **10/10 passed**.
- Rebuilt runtime and package checks: **4/4 passed**.
- Complete unchanged vessel-walk suite: **12/12 passed**, including wing entry, gangway/ramp, moving ship and below-deck routes.
- All **148** production runtime JavaScript blobs preserved byte-for-byte.
- Wiper checks include 281 fallback poses, 41 poses using actual loaded native hinge/rubber vertices, pane clearance, linkage closure, fixed mounts, rain/power/parking, native/fallback parity, shared GPU buffers and pose preservation on lazy replacement.
- Independent `physical_model_v4` approved both frozen assets and all four corrected wiper views, plus the fresh sign-free console proof, with **no remaining P1/P2**. Root visually approved the same bounded change.

The earlier Blender review-import pose mismatch was fixed before freeze, and all four wiper images were regenerated. Native geometry and runtime poses are checked separately. These Blender proofs and module checks do not establish physical-device appearance or performance. The automatically triggered hosted World guard, WebKit profiles and Pages publication are monitored after the authorised main update; no full hosted pass is claimed before its result.

## Source and proofs

[Wiper source/API notes](../art/ferry-bridge-wipers/README.md) · [Wiper geometry verification and four images](../docs/qa/bridge-wipers-2026-11-02/README.md) · [Lantern source notes](../art/ferry-bridge-lantern/README.md) · [Sign-free console](../docs/qa/bridge-polish-2026-11-02/console-final.png).

Wiper GLB SHA-256: `317574e7030012e919c18acb5b74445a3f82fde48ee576e1773bb7808c1adc1d`.
Lantern v2 GLB SHA-256: `237050a588216dddf5011d68bd4a955c571193a13f644177f0f45c830b2090a0` (311,964 bytes, 4,916 triangles, three meshes).

Source/runtime implementation: [`390ff7fcfa68d050023d885b80bbab158d639fdb`](https://github.com/nj22az/nj22az.github.io/commit/390ff7fcfa68d050023d885b80bbab158d639fdb). The following metadata commit changes no tested runtime/source. Exact current publication/check state is recorded in the root handover index and closing release evidence. Use fresh compare-and-swap with `force=false`; preserve newer main work if the lease changes. Canonical game entry: [Johansson World](https://nj22az.github.io/johansson-town/).
