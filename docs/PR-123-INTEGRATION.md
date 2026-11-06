# PR #123 integration validation

Reapplied `13a735cf767e368fd60580f3b073cc2a12148769` onto main
`75e2d0b3b8714844655120f41fac28e3b96ddf69`.

The animation gesture registry keeps Fist, Jab, JabL, Swipe and Hurt alongside
SitToast, SitDrink, SitEat, Drink and Eat. The game changes only its dining paths;
the ferry, sea cave dungeon and fighting logic from main remain intact. Generated
runtime files from the old PR were discarded and rebuilt from the combined source.
The previous main runtime stays available for pages still holding its cached index.

## Validation

- `npm run build:runtime`: passed.
- 35 focused Node checks passed: avatars, facial features and expressions, polish,
  dining/combat transitions, izakaya service, dungeon, ferry and runtime packaging.
  This includes all 21 avatar/service checks reported by the original PR.
- `CREATOR_CHROME=/tmp/chromium CREATOR_LOCAL_FILES=1 node tests/creator.browser.mjs`:
  passed at 320×568, 390×844, 844×390, 1280×800 and 320×360. Covers front/rear
  preview, categories, controls, undo, sharing, keyboard access and save.
- `CREATOR_CHROME=/tmp/chromium node tests/avatar-polish.browser.mjs`: passed at
  390×844 and 1280×800 in real Chromium 153 using SwiftShader WebGL. Front/rear
  sipping screenshots inspected; two avatars and drinks remain below 15 draw calls.
  Gradual eating renders a shrinking morsel and individual disappearing dish pieces.
  Dungeon smoke uses actual costumed avatars, checks Swipe and Hurt joint movement,
  alternating first-person fists and a club swing, and renders them with WebGL.
- Runtime source hash, compiled dependencies and stylesheet hashes passed.
- Source/test/document diff whitespace checks passed. Generated Three.js shader
  strings retain the whitespace emitted by Vite.

The browser tests exercise source modules through a local file route; the compiled
runtime is verified separately by the packaging tests. These checks are not a full
end-to-end playthrough. Physical iPhone/iPad and WebKit checks were not performed.
No furniture assets are included; the separate .max salvage task remains separate.
