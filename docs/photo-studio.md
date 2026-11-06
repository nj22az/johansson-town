# Photo studio

Open **Town menu → Photo studio**, or press **P** while playing. The current outdoor or indoor location becomes the set.

- Stage up to six copies of Johansson and the town cast. Johansson uses the player's saved avatar.
- Choose thirteen poses and thirteen expressions; move, turn and raise each character. Add a speech bubble and adjust its height.
- Drag the photograph to orbit, or use the camera sliders. The camera checks the current room/world collision bounds.
- Choose landscape, square or portrait; export a clean photograph, a meme with top/bottom text, or a captioned comic panel.
- Capture up to four panels, then save each PNG or export a comic page/horizontal strip. Native file sharing appears when the browser supports it.
- Return to town to change locations. Captured panels stay available during this page session; download them before reloading or closing the page.

Staged characters have their own rig, textures and disposable resources. The live cast is hidden temporarily, with original visibility restored on exit. The game loop does not advance while composing. A set clock is re-anchored on return; real-time play resumes following the device clock. No staged pose, position, caption or panel is written into the gameplay save.

The studio uses the existing WebGL renderer. Its view redraws only when changed or resized; avatars are created on opening and disposed on closing. Captures render at 1,200 pixels wide (900/1,200/1,600 pixels high) and are stored only in memory until downloaded. The main runtime gains about 6 KB compressed; no additional initial JavaScript requests are introduced.

## Verification — 1 October 2026

- `node --test tests/photo-studio.test.mjs tests/runtime-package.test.mjs tests/warehouse*.test.mjs tests/town-clock.test.mjs tests/dual-controls.test.mjs`: 24 checks pass.
- `node --test tests/controller-game.test.mjs`: existing game/control smoke passes.
- `node tests/photo-studio.browser.mjs`: real WebGL studio at 1440×1000, 390×844, 844×390 and 320×568. Covers accessible controls, PNG pixels/dimensions, formats, four-panel limit, comic export, cast limit, deletion, reopening, focus and Escape. Phone capture uses a touch tap.
- `node tests/photo-game.browser.mjs`: actual published runtime at 1440×1000 and 390×844. Covers town-menu entry, outdoor capture, unchanged player/NPC/save state while staged, warehouse entry and capture, a two-location comic, return and warehouse exit. No page errors.

Browser commands use Playwright from `CODEX_PRIMARY_RUNTIME_NODE_MODULES`; `PHOTO_CHROME` can override the executable. Requests are fulfilled from the repository. Full-game tests stub native gamepad enumeration/events and fullscreen because this container has no working native gamepad service. Physical phones, Safari/WebKit and the native share sheet have not been tested.
