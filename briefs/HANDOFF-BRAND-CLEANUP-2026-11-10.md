# Handoff: the older toy title deleted, the World's brand written down, the WebKit checks' time limit — 10 November 2026

**Branch** `claude/laughing-brahmagupta-ybyndm` (this repository). **Not published**: it waits for the owner's "Push to
main". The camera's half of the same round is in `nj22az.github.io`, `camera/HANDOVER-GREEN-2026-11-10.md`.

## The owner's words

"What's your recommendations" → the recommendation, of which this repository's part was: delete the dead toy-wordmark
and gold styles in the World, add one small brand file (ink, green, cream, typeface, wordmark) as the single place that
says what the World looks like, and give the iPad ferry check a longer limit or split it → **"Proceed according to your
recommendation"** (10 November 2026).

## Why

On 9 November Pocket Camera's brand was copied from `landing.css` and `base.css`: yellow and orange letters with a
green outline, WORLD in a tilted red box, a gold, a navy. None of it is what the World shows. Those are the rules of an
older title, overridden by `title-screen.css` and `line-ui.css` (the last stylesheets of `index.html`). The owner saw
the result at once. As long as the old rules were in the files, the next reader could make the same mistake.

## What changed

- **`landing.css`** (101 lines deleted, 7 of comment added): the wordmark's old rules are gone (`.logo-jp`, `.logo-small`, the per-letter
  `span` rules and their colours, `.logo-main` and `.logo-town` with their shadows, box and tilt, the later
  `#start .logo-*` overrides, the keyframes `letter-drop`, `pop-in`, `pop-flat`, `logo-bob`, the tokens `--ts-sun` and
  `--ts-orange`), and the company splash's inside (`.splash-mark`, `.splash-seal`, `.splash-word`, `splash-drop`,
  `splash-glint`): `#splash` is an empty element that is always "done". A comment stands where each block was.
  `.splash`, `.splash.done` and `splash-out` stay (the page's script still names them).
- **`base.css`**: `#start`'s navy gradient is gone (`title-screen.css` sets the ground transparent in every state).
- **`title-screen.css`**: the three things the old rules still decided moved here, unchanged in effect:
  `#start :is(.logo-main,.logo-town){display:flex;justify-content:center}`, `position:relative` on `.logo-town`, and
  the wordmark's smaller sizes while the World loads on a short screen (`@media(max-height:620px)`,
  `#start.booting …`). The wordmark is now declared in this file and nowhere else.
- **`brand/`** (new): `brand.json` (ink `#263d39`, green `#16815e`, cream `#f5f5ec`, the interface green `#06c755`,
  LINE Seed JP with Figtree for the ten long vowels, the wordmark's setting), `wordmark.svg` (the wordmark as outlines,
  the ones Pocket Camera's title card draws), `README.md` (the table, where the game reads these, why the folder
  exists). The game does not load the folder; `tests/brand.test.mjs` (5 tests, in the guard list) fails when the
  record and the stylesheets disagree and when any of the deleted names comes back.
- **`tools/title-style-proof.mjs`** (new): asks the browser instead of reading stylesheets.
  - `--dead landing.css base.css`: takes each written declaration of the title's rules out in turn, at six screen
    sizes and five states, and lists those that move no computed value of the boxes their selector matches.
  - without arguments: compares every computed style of every box of `#start` (and `::before`, `::after`) with
    `origin/main`, the two sites side by side in one browser, the changed files of the earlier side read from git.
    Two passes: the page standing still (no script file fetched; 30 readings), and the game loaded on both sides at a
    phone's size and a desktop's (the title and the guide; the same clock and the same dice on both sides; the
    guide's town feed waited for).
- **`.github/workflows/johansson-world.yml`**: `ferry-exploration` and `iphone-startup` get 25 minutes (they had 15).
  On 9 November (run 42716075691) the iPad in landscape passed every step of its exploration in 818.7 s after a
  minute and a half of set-up, and the job was cancelled in the same second it finished (15 min 10 s); on 6 November
  the same. The hosted runner draws WebKit in software at about 1.5 s a frame. Portrait took 12 min 9 s, the desktop
  10 min 47 s, the iPhone start-up 12 min 41 s.
- **`WHERE-TO-EDIT.md`**: it still described publishing from a work branch of the Office repository. It now says how
  this repository publishes, and has a section on the title, the brand and the two tools.
- The three stylesheets' `?h=` stamps in `index.html` (the first eight hex digits of each file's SHA-256).

## What was not done, on purpose

- **`--gold` and `--rust`** are still the names many of the game's rules use. Both resolve to the interface green
  (`line-ui.css`). Renaming them is a change across the whole game; `brand/README.md` says what they are.
- **The rest of the old title in `landing.css`** (the layout of `.title-screen`, the menu, the loading bar, the
  `--ts-navy`, `--ts-red`, `--ts-cream` tokens): much of it is overridden too, but some still decides layout, and the
  `:hover` and `:focus` states are not read by the proof. `--dead` lists what moves nothing; delete from that list only
  what a search and the proof both clear.
- `base.css` and `landing.css` `#start{position;inset;z-index;display;…}`: reported dead (later sheets repeat them),
  left in place.

## Checked

- `node tools/title-style-proof.mjs origin/main`: **the same computed styles in all 34 readings** (30 with the page
  standing still: 390 × 664, 375 × 560, 740 × 360, 820 × 1180, 1180 × 820, 1440 × 900, each as the title, booting,
  the guide, every hidden part shown, and reduced motion, 337 boxes each; 4 with the game loaded: the title 1287
  boxes and the guide 1330, at 390 × 664 and 1440 × 900).
  - A control each way. With `.title-logo{display:flex}` changed to `block` the proof reports 21 moved values at once.
    With both sides serving the same files and the feed not waited for, the guide still "differed" (the town feed
    mounts when the guide opens and draws its residents one by one): the wait was added, and a first cut that compared
    custom properties and the two servers' addresses was corrected.
- `--dead` on `landing.css` and `base.css`, rules matching `logo|splash|^#start$`: 101 of 128 written declarations
  decide nothing in any state read. Every deleted declaration is in that list or matches no element at all.
- `node tools/font-audit.mjs`: JOHANSSON LINE Seed JP ExtraBold × 9, WORLD × 5, the long vowels Figtree × 10,
  "Sakura Shōten, Kōji, Ōshiro, Kitano-jima" LINE Seed JP × 37 and Figtree × 3. The title looked at, at a phone's size.
- `node --test tests/brand.test.mjs`: 5 pass. The whole guard list: all green, see "The guard" below.
- Software Chromium on a cloud machine. **Not seen on a physical iPhone.**

## The guard

`node tools/ci-guard.mjs` on this branch, after `npm ci --ignore-scripts` in this checkout (`NODE_OPTIONS=
--max-old-space-size=6144`, as the workflow sets): **118 files, 623 tests, all green in 302 s**, `brand.test.mjs`
among them. The WebKit jobs of the workflow (`iphone-startup`, `ferry-exploration`) were not run here: WebKit is not
installed on this machine, and they run on a push to `main` or a pull request.

## Open

1. Publishing is the owner's word. A push to `main` publishes (`pages.yml`) and runs the guard workflow, where the
   new 25-minute limit will show whether the iPad in landscape now reports its pass.
2. `iphone-startup` failed once on 9 November at "authored dining exit approach failed" in the Izakaya and passed on
   the next run. Not looked into.
3. LINE Seed JP is still loaded from Google Fonts by the World (`index.html`). Pocket Camera carries its own copy of
   the Latin letters (7 KB a weight); the World could do the same and load nothing from another host.
