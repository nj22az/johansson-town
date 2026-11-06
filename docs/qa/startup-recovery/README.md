# Browser reload after entering the town — 18 October 2026

Reported behaviour: an error, followed by the town starting and the browser reloading.

The 35 deployed runtime modules were fetched and compared with the repository: all returned the expected bytes. Update activation does not reload the page automatically; the PWA only reloads when the player presses its save/reopen button. The available inspection browser has WebGL disabled, so it cannot establish the cause of the user's device restart.

Graphics memory pressure is a plausible cause, not a confirmed diagnosis. Previously mobile allocated a native antialiased canvas, four-sample offscreen targets, optional half-float colour, up to 2.4 million postprocess pixels and (on tablets) shadow buffers. The FPS governor cannot reduce allocations before the first rendered frame.

This mitigation caps mobile/recovery DPR at 1.25 and postprocess pixels at 1.2 million, uses single-sample eight-bit targets, disables mobile shadows and avoids compiling the entire scene at startup. Cel shading, ink, grading and FXAA remain. Normal desktop graphics are unchanged.

A session-only checkpoint detects an interrupted initial launch. The next attempt uses reduced graphics; a normal pagehide or 45 seconds of completed launch clears the checkpoint. Recovery remains scoped to the tab. `?graphics=safe` explicitly selects the same profile. Player saves are not accessed or changed by the checkpoint.

Validation: 25 focused tests pass, including real render-target allocation options, context pause/restore, interrupted/normal launches and coordinated street geometry. Three runtime packaging/source-hash checks pass. Production runtime rebuilt. Physical device/browser acceptance remains outstanding; no claim that the user's specific restart has been reproduced or conclusively fixed.
