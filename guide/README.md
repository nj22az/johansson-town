# Resident guide

Edit `residents.json` for biographies and backstories. Names match the live cast; this catalogue extends their dialogue and relationships without changing schedules or saves.

Portraits use the same `buildAvatar(recipeFor(name))` pipeline as the game. Visitors receive lazy-loaded WebP images and native backstory disclosures, with no extra WebGL contexts. Established resident portraits also remain available when a visitor chooses `?classic`.

Regenerate after changing the catalogue or avatar appearance:

```sh
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tools/render-resident-guide.mjs
npm run build:runtime
node --test tests/resident-guide.test.mjs tests/runtime-package.test.mjs
```

Use `TOWN_CHROMIUM_PATH` to select an existing Chromium executable. The portrait manifest fingerprints the catalogue and model source files; the regression rejects stale portraits.
