# Facial visibility — 25 October 2026

Owner report: Johansson's eyes and other facial features disappear under several Looks. Screenshot: Sketchbook at approximately 00:07.

## Cause and correction

The face is a painted CanvasTexture on a cel-shaded head. In dim light its existing 0.05 textured emission was insufficient to keep the painted features distinct after grading and stylisation. Nose geometry and the inverted-hull outline survived while the eyes and mouth faded. This reproduces independently of the greeting expression bug.

The shared head now floors outgoing light at 0.5 times the painted albedo, before post-processing. It does not add a constant grey wash: dark painted features remain dark relative to skin. Brighter lighting continues to supply its original result. Every head shape uses the same correction; nose bumps retain the shared material. The toon ramp, texture, UVs, animation and blink logic remain in place.

Sketchbook also uses the existing local dark-mark detector, already used by the drawing/ink Looks, to retain small dark features through its paper wash. It adds texture sampling within that existing filter, not another pass or render target. No new geometry or per-frame scene traversal.

## Evidence

- Original main `b998e375344804717fa338d1afe622efe2a94637` fails the new actual-WebGL test: 390px, dim light, Natural eye contrasts 0.0252 and 0.0246, below the unchanged 0.045 threshold.
- Corrected source: 92 actual avatar/pipeline cases, all 19 Looks, dim/day light, 390×600 and 1024×768, plus repeated Natural/Sketchbook/Cartoon switching. Every tested eye remains above the threshold; minimum 0.0646 (experimental Stamp). Natural dim contrasts 0.1664 and 0.1649. Full measurements: [filter-report.json](filter-report.json).
- Four actual shared character recipes checked in Node: Johansson, Thuan, Vy and Mr Fujita. Existing tint compile hook, animated face map, blink/speech state and body-material separation verified.
- Rebuilt complete game: 12 steps, eight captures, no page/shader errors; midnight Johansson street views and Community Hall in Natural, Sketchbook, Cartoon and Oil. [Game report](game-report.json).

| Look | Midnight built game |
| --- | --- |
| Natural | [capture](johansson-night-none.png) |
| Sketchbook | [capture](johansson-night-sketchbook.png) |
| Cartoon | [capture](johansson-night-flat.png) |
| Oil | [capture](johansson-night-oil.png) |

Reproduce the numeric rendering check from `johansson-town/`:

```sh
FACE_BROWSER_TEST=1 TOWN_CHROMIUM_PATH=/path/to/chromium node --test tests/face-lighting.browser.mjs
```

The full guard includes `face-lighting.test.mjs`; browser checks are an explicit separate run. The synthetic dim fixture is a contrast stress test, not a reconstruction of every island lamp. The actual-game captures are fixed midnight views. Physical iPad/iPhone Safari and hardware performance are not verified. No Linux package is released by this task.
