# Avatar face dragging acceptance

Validated on 3 October 2026 against main `fa79cfdb6640ee634b6b625ae9bd4baaa53c383d`.

The substantive changes from PR head `1232d995ab66bcb76afb5ae02fa04394e0e03d9a` were reapplied to current main. The creator source also differed substantially from the PR base: main's four-step editor, face silhouettes, wardrobe rules, personality/voice flow, measured camera framing and adjustment buttons were retained. Dragging updates the current adjustment indicators; keyboard buttons remain available. No obsolete creator layout or sliders were restored.

Eyes and brows move symmetrically; nose and mouth move independently. One gesture adds one undo entry. Cancellation restores the recipe and indicators. Only the selected placement fields change. Active dragging repaints the face texture without replacing head geometry, freezes preview movement for stable picking, and adds no preview draw calls. Normal animation resumes on release.

Validation:

- 43 focused Node checks pass: face placement, recipe/share codes, avatar geometry/personality/springs and runtime packaging/fingerprint.
- 31 town subsystem and full-game CPU smoke checks pass: Photo Studio, dungeon, ramen kitchen/player/service, warehouse/port, storage restocking, full-game boot and interior walkthrough.
- Real Chromium/WebGL `creator-drag.browser.mjs` passes at 1280×800, 390×844, 320×568 and 844×390. Phone and landscape gestures use CDP touch input. Coverage includes both paired sides, selected-field isolation, single undo, stationary taps, mouse/touch cancellation, adjustment-indicator synchronisation, keyboard access, geometry identity, unchanged draw calls, overflow and page errors.
- Current main's `creator.browser.mjs` passes at 320×568, 390×844, 844×390, 1280×800 and 320×360: front/back preview, categories, face silhouettes, wardrobe, profile, voice steps, undo, sharing/save/focus and layout.
- Runtime rebuilt with current main's build script. Source fingerprint, local compiled dependencies and stylesheet hashes pass. The current main runtime is retained for cached pages; older runtime chunks are pruned by the existing packaging policy. `index.html` changes contain only generated runtime references. The existing service-worker version is regenerated.

The drag runner now targets main's Adjust tab and keyboard adjustment buttons, rather than the retired slider interface. It compares draw calls with the actual current preview before each gesture, rather than assuming the old three-draw avatar. Tests use software-rendered Chromium; physical-device frame rates were not measured.

Serve `johansson-town` on port 5173 in the browser runner's network namespace, set `CODEX_PRIMARY_RUNTIME_NODE_MODULES` to the runtime modules and `CREATOR_CHROME` to the Chromium executable, and run both browser runners.
