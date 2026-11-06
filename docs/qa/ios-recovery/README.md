# iPhone Safari recovery — 18 October 2026

The user reports that the town starts, goes blank and Safari reloads; the earlier reduced-buffer mitigation did not resolve this. The device is confirmed as iPhone with Safari. A physical iPhone failure has not been reproduced in this environment; graphics/resource pressure remains a hypothesis.

## Current recovery path

- iOS phones and explicit `?graphics=safe` use direct rendering without creating the ink/grade/FXAA render targets. The existing material shading remains; postprocess line/colour effects are omitted in this mode.
- The native screen buffer is capped at 650,000 pixels and DPR at 1. Shadows, MSAA and whole-scene precompilation remain off.
- Optional detail streaming is disabled. Existing procedural building representations remain; the stream reports no pending arrival load. Deliberate indoor entry still loads its required assets on demand.
- The recovery opening uses the existing Sakura bench and omits the arrival cinematic. An existing tropical-island journey still uses the original recovery logic.
- Normal desktop/Android/iPad profiles are retained unless explicit or interrupted-start recovery is active.

## Local loading report

`loading-report.html` is a small page with no graphics dependency. It reads a bounded local report containing the last four attempts, loading stages, errors and numeric rendering counts/buffer dimensions. It does not read player saves or transmit data. The user can copy the report from the same Safari storage context if the problem continues. Storage failures cannot block startup.

The report marks entry, first gameplay draw and successful play, plus optional detail starts on profiles where streaming remains enabled. Five-second playing checkpoints retain the latest numeric graphics counts. Pagehide records an ordinary exit, while a process termination cannot run that handler.

## Verification

29 focused tests pass: disabled streaming makes no requests and cannot hold the opening camera; constrained profiles omit postprocessing/streaming/cinematic; native buffer pixels remain bounded across phone/landscape/large viewports; loading reports survive restarts and handle corrupt/full storage; existing context recovery, render-target and street geometry checks pass. Production runtime is rebuilt and three packaging/source-hash checks pass.

Runtime/device acceptance remains separate. The available remote browser has WebGL disabled and cannot establish whether this resolves the user's Safari restart.
