# Sakura entry and indoor town continuity — 18 October 2026

## Report and evidence

The owner reports an iPhone Safari crash when entering Sakura. Seven supplied screenshots show the street before entry, including duplicate `Come into Minato Izakaya` / `Enter Minato Izakaya` controls. They do not contain a crash log or establish its cause. Other visible concerns include the large blank upper Sakura frontage, pale surfaces and an open post-office frontage; these require a separate architecture/visual acceptance pass.

The owner's clarified requirement is that Sakura and Minato Izakaya draw only the room and the street visible through openings. Unseen residents must continue their journeys and routines. Tetsuo should reach home while the player shops if sufficient time passes.

## Changes

- Sakura entry skips mounting a merged exterior window copy immediately before entering the full room. Existing copies release their geometry/material buffers at entry.
- The outgoing window pass respects ancestor visibility and camera layers, and partitions only geometry intersecting the opening. Previously its first cache pass partitioned the whole town, including hidden original meshes. Looking away from the opening still uses only the room pass.
- Town state remains in memory; this is selective drawing and reduced render preparation, not a complete world-unloading system. Resident data and source geometry remain available for continuous routines and departure from the shop.
- Main resident schedules continue as before. Secondary neighbours and transport now advance indoors too. Fujita's journey/sleep update is separated from the shed television and decorative redraws. Unseen outdoor ocean/scenery animation is not enabled indoors.
- `Come into` entrance labels use the single building-entry action.
- No changes to the current graphics profile, canvas limits, postprocessing, shadows or asset-streaming policy.

## Verification

38 focused checks passed across continuous life, houseboat routes, shop-window culling, Sakura memory ownership, shop geometry budgets and context controls. The hidden-scene tests verify Tetsuo reaches his actual home and saves that state, and Fujita reaches bed without refreshing the exterior shed decoration. The production runtime build and three runtime-package checks passed.

The existing full-game CPU smoke test stops before its interior walkthrough: its hard-coded site inventory still expects removed Fumoto/Kitahama houses and omits the consolidated homes and Sakura office. This failure is unrelated to this patch; the stale inventory assertions were not changed.

Local Chromium could not launch because the environment denied its process-singleton socket. The available cloud browser cannot create a WebGL context. Neither test environment reproduced the physical iPhone crash; there are no new rendered acceptance screenshots. The changes remove evidenced allocation hazards but the crash cause remains unconfirmed.

## Required acceptance before calling the crash resolved

1. On the affected iPhone, enter and leave Sakura repeatedly, including after stock changes. Check for reloads, blank frames and WebGL context loss.
2. Repeat Minato Izakaya entry. Look towards and away from windows; confirm the outside view, doors and passing people remain correct.
3. Enter while Tetsuo is heading home, let enough game time pass, then check his actual home/location on leaving. Repeat across Fujita's 23:30 bedtime and 06:00 return.
4. Measure peak memory, shader compilation and frame time across repeated entry/exit cycles. Do not infer a verified crash fix from CPU-only checks.

## Follow-up requested in this conversation

- Added `docs/INTERIOR-INVENTORY.md`: the 24 occupied primary homes all have geometry, but 16 use shared residential layouts. Open shopfronts and external facilities are listed separately.
- Every secondary neighbour now has explicit overnight hours, breakfast time, saved home occupancy and departure from the same doorway. A resident who is already at an upper-flat door no longer receives a pointless downstairs-and-upstairs route. Existing main-cast night shifts, the player controller and ferry duty controllers are retained.
- Sakura shows the live worker and customers beside its merged fittings. These actors are excluded from the static copy and remain animated. The three street panes have a modest neutral haze (opacity 0.12); this is inexpensive translucent glazing, not a new refraction/blur render target.
- Only Sakura's near window is allowed through the phone's optional-detail cap (18 m reach, one queued load); unrelated scenery remains disabled. Back-room figure fetching waits until entry.
- Integrated latest main's physical Sakura office stairs and retained its cached-runtime compatibility files.

47 integrated checks passed covering routines, housing, ship crew, shop windows and stairs; six further glass/occupant checks passed. The roster test covers the 31 named villagers' controller assignments; it is not proof that every possible pedestrian route or background job-role actor has been visually accepted. Physical iPhone crash verification remains outstanding.
