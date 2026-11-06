# Boss-night persistence acceptance

Baseline: main `f70f4540cea62328f1935cec9fc6e541fb293d6c`.

This adapts the persistence part of PR #131 to the existing one-boss-per-night
stockroom. Carton thieves, stolen-product shortages and cave-carton recovery are
not part of this change.

## Reproduce

```sh
node --test johansson-town/tests/storage*.test.mjs \
  johansson-town/tests/runtime-package.test.mjs \
  johansson-town/tests/activity-lifecycle.test.mjs \
  thuans-storage/tests/*.test.mjs
cd johansson-town
STORAGE_CHROME=/path/to/chrome-headless-shell node tests/storage-boss.browser.mjs
```

The browser driver serves the committed compiled files locally, at 1280×800 and
390×844 with touch enabled. Test instrumentation selects a repeatable bear night,
positions Thuan and accelerates the real fixed-step simulation. Boss behaviour,
checkpoint restoration, React UI, automatic collection and return navigation,
and the town's outcome/save/acknowledgement code execute from the built runtime.
No reward or restock logic is substituted. Browser scripts freeze the town
simulation after boot so unrelated purchases and schedules cannot change assertions.

`acceptance.json` records partial fight reload, exit and re-entry, defeated-boss
reload, a complete automatic restock and actual town redirect, duplicate handshakes,
completed-night re-entry, and failed-save recovery. Screenshots capture the paused
fight and the actual town return at each viewport.

The complete town Node suite passed 914 checks with five existing skips.
`town-suite.log` records that run. The final clock-recovery guard and current runtime
were subsequently checked by 15 focused town checks in `town-focused.log`.
`combined-focused.log` also records the 12 stockroom checks, including recovery of
all four bosses, completion, goods, position and control mode, and rejection of old
carton checkpoints. The stockroom game source was unchanged after that run.

Browser page exceptions are asserted absent. Network notes retain blocked external
font requests and requests cancelled by intentional navigation. Software WebGL
may use existing optional-detail fallbacks after asset timeouts; these are recorded
in `browser.log`. This is Chromium browser acceptance, not physical-device FPS,
WebKit or hardware-gamepad acceptance.
