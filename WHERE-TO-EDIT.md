# Where to edit this folder

This repository is Johansson Town since 7 November 2026 (it was the folder `johansson-town/` of
`nj22az/nj22az.github.io`). A push to `main` publishes it: `.github/workflows/pages.yml` copies the site, without
`docs/`, `tests/` and `output/`, to <https://nj22az.github.io/johansson-town/>. Work on a branch; `main` is the
published result. (Before the move it was published from a work branch of the Office repository by
`johansson-town-live.yml`; that route is gone.)

Johansson World (the game) is `johansson-town/`; Johansson Studio (the web studio) is `avatar-creator/` and runs on
World's own code.

## The title screen and the brand

- **What the World looks like** (ink, green, cream, typeface, the wordmark's setting): [`brand/`](brand/README.md).
  `tests/brand.test.mjs` fails when `brand/brand.json` and the stylesheets disagree; change both together.
- **The title's look** is `title-screen.css` and `line-ui.css`, the last stylesheets of `index.html`. `landing.css`
  and `base.css` come first and still hold an older title's layout; where the two disagree the later sheet wins. Do
  not read the look out of the earlier sheets (Pocket Camera's brand was copied from them once, wrongly).
- **Before deleting a title rule**, ask the browser whether it still decides anything:
  `node tools/title-style-proof.mjs --dead landing.css base.css` lists declarations that move no computed value, and
  `node tools/title-style-proof.mjs` compares every computed style of the title with `origin/main`.
- **Which typeface really draws a word**: `node tools/font-audit.mjs`.
- A stylesheet's `?h=` stamp in `index.html` is the first eight hex digits of the file's SHA-256
  (`scripts/build-runtime.mjs` sets it; set it by hand when only a stylesheet changed).
