# Graphics inspection and visual regression

The visual suite covers all 15 accessible homes from two angles: the entrance and a view of household belongings. It also covers Rainflower, the traditional garden, the harbour frontage and the airport junction in daylight and at night. These 38 scenes run at desktop (1280 × 800) and phone (390 × 844) viewport sizes, producing 76 comparisons. This checks the browser rendering path; physical phone GPU testing remains necessary.

Install the pinned development dependencies with `npm ci`. From `johansson-town`, run `npm run build`, then start the local audit server:

```sh
npm run audit:serve
```

From `johansson-town`, compare the build with its reviewed reference images:

```sh
npm run audit:visual
```

The runner creates a fresh save for each viewport, fixes the calendar, seeds procedural randomness and freezes simulation, animation and resolution changes. It waits for room models, nearby streamed assets and fonts, then captures through the normal ink and antialiasing pipeline. Two consecutive captures must match exactly before comparing against the reference. Missing images, different dimensions, failed loading, invalid scene transforms and graphics errors fail the run. The colour-distance threshold is 0.05; no pixels above that threshold are allowed to differ, including antialiased edges.

Reference images live under `tests/visual-baselines/<environment>/`. Each environment records the exact Chromium version, operating system family, architecture and observed WebGL GPU details. A browser/environment change requires new reviewed references. Run artifacts and `report.json` are saved under the repository's local `output/visual-audit/` directory; a failing comparison also writes a transparent red difference mask.

To establish or intentionally replace references:

```sh
npm run audit:visual:update
```

The update runner stages candidate images and writes references only after the whole run passes. Review the screenshots before committing changed references. Baselines are never replaced by a normal comparison run. Optional arguments include `--url`, `--output`, `--baselines`, `--viewport desktop|phone`, and `--scene <name-substring>` for a focused run.

## Inspect an actual WebGL frame

Open the game with `?audit`, enter town, then use the browser console:

```js
const graphics = window.__JOHANSSON_GRAPHICS__;
const frame = await graphics.capture({quick: true, full: false});
graphics.stats;
```

The Spector dependency loads from the local compiled runtime only after explicit activation. Ordinary visits load no Spector dependency or inspection UI. The inspector can display captured results using `graphics.show()`. Context loss cancels an in-flight capture without discarding the town.

Use `npm run audit:visual -- --diagnostics` to validate a real Spector capture along with the screenshots. The inspector is a debugging tool; it does not repair a bad frame automatically.
