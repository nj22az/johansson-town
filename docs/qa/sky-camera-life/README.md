# Sky, indoor camera and resident routines

Prepared against main `465129a590d405f4b9401bb81a3f2a353c9139e7`.
Compiled source fingerprint: `3f0326e1f50128899c8ab9021c9c7bde307cfdf8bf6ed4c269af3cf8bc6e7ee1`.

The title restores its blue sky gradient while preserving the existing LINE controls. The sun remains within the phone viewport.

The previous phone camera reached 3.155 m inside Aya’s 2.50 m room. The camera now caches actual overhead geometry per room, including sloping roofs and upper floors, and keeps its near plane below those surfaces. Indoor boom checks begin at the shoulder and include walls close to the player. The outdoor wall lift is suppressed indoors; the player model is hidden when the lens must move very close. First-person, photo and conversation clearance use the same overhead checks. Keyboard, mouse, touch and controller look controls retain their existing settings.

Local residents leave home thirty minutes before their shift, after sleeping, waking and breakfast. Their existing individual work, shopping, park, harbour, cleaning and night-shift habits remain intact.

Thuan’s routine uses the saved town clock:

| Town time | Activity |
| --- | --- |
| 07:30 | Wake and stretch at home |
| 07:45–08:10 | Breakfast |
| 08:10–08:30 | Get ready |
| 08:30 | Walk from home to Sakura |
| 09:00 | Work at Sakura |
| 13:00–13:50 | Noodles and barley tea at Sato Ramen; finish serving waiting customers first |
| Afternoon | Existing bench, park and sea-wall break, then return to work |
| 20:00 | Complete closing preparation and restocking |
| Alternate dry evenings, until 21:30 | Beer with Nao at Minato |
| Other evenings / after Minato | Walk home |
| 23:50 | Sleep |

Invited onsen visits retain priority. Ordinary daytime drinks remain tea; the venue-specific beer preference applies at Minato. Existing meal records and the saved town day prevent reloads or re-entering from rerolling the evening or ordering a duplicate meal.

Verification:

- 768 source tests pass; five existing tests are skipped. The full run had one old expectation for the former 20:20 beer start; its updated closing-time boundary and all seven living-town checks pass.
- 35 focused camera, commute, lunch, closing stock, purchasing, rack path, onsen, portrait and venue checks pass.
- Chromium/WebGL walkthrough at 1280×800 and 390×844: sky; four headings in each of five interiors; wake, breakfast, home exit, arrival at Sakura, noodle meal, beer meal, return home, save and reload; one Thuan actor throughout.
- `results.json` records actual gameplay camera positions, ceiling limits and resident state. PNGs are captures of the compiled runtime.
- The managed test network cannot fetch Google Fonts. The browser evidence uses the existing system-font fallback. Navigation may cancel an optional figurine request during reload; application, JavaScript and missing-local-asset errors are checked separately.

Run `npm test`, `npm run build:runtime`, and `node tests/sky-camera-life.browser.mjs` from `johansson-town`.

Publication is pending user approval. No remote branch or pull request has been created for this change.
