# Johansson World's brand

One place that says what the World looks like, so nobody has to work it out from the stylesheets again.

| | |
|---|---|
| Ink | `#263d39`: JOHANSSON in the wordmark, the words on the title |
| Green | `#16815e`: WORLD in the wordmark, Start |
| Cream | `#f5f5ec`: the title's surfaces |
| Interface green | `#06c755`: buttons and marks inside the game |
| Typeface | LINE Seed JP, 400, 700 and 800 (SIL OFL 1.1). Figtree draws ā ē ī ō ū and their capitals only |
| Wordmark | JOHANSSON, ExtraBold, tracked .035 em, over WORLD, ExtraBold, tracked .18 em, 4 px between; at the smallest size 28 px over 24 px |

- [`brand.json`](brand.json): the same, for programs.
- [`wordmark.svg`](wordmark.svg): the wordmark as outlines (LINE Seed JP ExtraBold at the smallest setting, kerned as a
  browser kerns it), for anything that must show it without loading the font. Pocket Camera's title card draws these
  outlines (`nj22az.github.io`, `tools/draw-camera-wordmark.py` made them).

## Where the game reads these

The game does not load this folder. Its title is drawn by `title-screen.css` (`--title-text`, `--title-green`,
`--title-surface`, the `.logo-main` and `.logo-town` rules) and `line-ui.css` (`--line-font`, `--line-green`), and
`tests/brand.test.mjs` fails when either of them and `brand.json` disagree. Change the look in the stylesheet and
here together.

## Why this folder exists

On 9 November 2026 Pocket Camera's brand was copied from `landing.css` and `base.css`: yellow and orange letters with
a green outline, WORLD in a tilted red box, a gold and a navy. None of it was what the World showed. Those were the
rules of an older title, still in the files and overridden by the two stylesheets above; in the running game
`--gold` and `--rust` both resolve to the interface green. The owner saw the result at once ("the landing page …
doesn't look quite right"). The lesson was to look at the drawn screen and ask the browser which rule wins, never to
read a look out of a stylesheet. On 10 November the overridden title rules were deleted
(`tools/title-style-proof.mjs` shows the title computes the same styles without them) and this folder was written.

`--gold` and `--rust` are still the names many of the game's rules use. They are names only: both are the interface
green. Renaming them is a change across the whole game and was not part of this.
