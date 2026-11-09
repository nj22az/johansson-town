# Handoff: the title's wordmark in one typeface, the Studio link readable at night, the title above the fold — 9 November 2026

**Branch** `claude/laughing-brahmagupta-ybyndm` (this repository). **Not on `main`**: the owner publishes.

## The owner's words

"Johansson Worlds landing page is a bit off too" (9 November 2026, while the Pocket Camera's own landing page was being
looked at: `nj22az.github.io`, `camera/HANDOVER-LANDING-2026-11-09.md`).

## What was off

1. **Every plain vowel on the island was drawn in a second typeface.** The rule (line-ui.css) is LINE Seed JP for every
   interface word and Figtree, first in the font lists, for ā ē ī ō ū and their capitals only, because LINE Seed JP
   draws their bars beside the letter. The Figtree face came from Google's `css2?family=Figtree…&text=āēīōūĀĒĪŌŪ`. That
   subset's `unicode-range` is `U+41, U+45, U+49, U+4f, U+55, U+61, U+65, U+69, U+6f, U+75, U+100-101, … , U+304`: the
   subsetter reaches ā as a plus a combining macron and so declares A E I O U a e i o u too. With Figtree first, the
   browser drew every plain vowel in Figtree: on the title, JOHANSSON was six glyphs of LINE Seed JP ExtraBold and three
   of Figtree (smaller, lighter O, A, O), WORLD four and one, and so on through every word of the interface.
2. **The Studio link had no backing at night.** The footer's light pills (`#start .title-foot>:is(span,a)`) lost to
   `#start #openStudio.title-studio{background:transparent}` on specificity, so the link was dark ink on the night
   harbour.
3. **On an iPhone's Safari (390 × 664) the title was 28 px taller than the screen**, and the copyright pill sat half
   under the fold.

## What changed

- `assets/fonts/figtree-macrons.woff2` (2.2 KB): Figtree's variable font cut to the ten long vowels (fontTools, from
  `@fontsource-variable/figtree` 5.3.0; OFL 1.1, `LICENSE-FIGTREE.txt`, a row in `assets/ATTRIBUTION.md`).
- `line-ui.css`: its own `@font-face` for Figtree with that file and `unicode-range:U+100-101,U+112-113,U+12A-12B,
  U+14C-14D,U+16A-16B`. The lists (`--line-font`, `--balloon-font`, `src/feed/comic.js`, `manga-fx.js`,
  `sakura-print.js`) are unchanged: Figtree is still first, and now matches only those ten letters.
- `index.html` and `creator/index.html` no longer link Google's Figtree subset (LINE Seed JP is still Google's).
  **Johansson Studio (`nj22az.github.io/avatar-creator/index.html`) links the same subset and loads this
  `line-ui.css`: its link is removed on the same branch name there; until both are published the Studio keeps the
  fault.**
- `title-screen.css`: the Studio link on the footer's backing, 32 high in a 44-point target; the scenery's window
  between the title and the menu is `clamp(120px, 100dvh − 466px − safe areas, 230px)`, so the title fits from 600 px
  of height up and 230 px is kept where there is room.
- `tools/font-audit.mjs` (new): asks the browser which platform fonts draw the wordmark, the tag, the stamp, the
  player's name, a button and a line with long vowels, glyph by glyph (CDP `CSS.getPlatformFontsForNode`), and fails
  when a word mixes faces, when a plain vowel is Figtree's or when a long vowel is not.
- `tests/okinawa-fish.test.mjs`: the long-vowel test now reads the face in `line-ui.css` (the file, the range of
  exactly ten letters, no Google link on either page) instead of the Google link's `text=`.
- The stylesheets' `?h=` stamps in `index.html` and `creator/index.html` were set by hand with the build's own rule
  (the first eight hex digits of the file's SHA-256); no source module changed, so the runtime was not rebuilt.

## Checked

- `node tools/font-audit.mjs`: before the change it fails (JOHANSSON 3 glyphs from Figtree, WORLD 1, the tag 8, the
  stamp 4, a line with three long vowels 15); after it passes: JOHANSSON LINE Seed JP ExtraBold × 9, WORLD × 5, the
  long vowels Figtree × 10, "Sakura Shōten, Kōji, Ōshiro, Kitano-jima" LINE Seed JP × 37 and Figtree × 3.
- The title measured at 375 × 553, 390 × 600, 629, 664, 700, 780, 430 × 850 and 820 × 1100: nothing under the fold
  from 600 up (2 px of scroll at 553, every element visible); the Studio link's backing `rgba(245,245,236,.85)`, 32 px
  high, the point 4 px above it still the link.
- `node --test tests/okinawa-fish.test.mjs tests/runtime-package.test.mjs tests/live-features.test.mjs`: 13 tests
  pass. `tests/studio-mcp.test.mjs` needs `@modelcontextprotocol/client`, which this checkout did not install; it fails
  the same way without these changes and is not in the guard.
- Software Chromium on a cloud machine only. **Not seen on a physical iPhone.** The comic's canvas text
  (`src/feed/comic.js`) uses the same list and was not photographed.

## Open

- LINE Seed JP is still loaded from Google Fonts; the game needs that host for its typeface.
- The full guard (`node tools/ci-guard.mjs`) was not run in this checkout (no `npm ci`); the three tests that read the
  changed files were.
