# Minato Police Station: visual review

Branch: `codex/police-station-upgrade`. Base: `bb006df` (latest main at branch creation and final fetch). Do not merge before owner visual approval.

The approved brief is `briefs/police-station-upgrade.md`. The upstairs remains Mori’s home (`koban`).

## Entrance correction following owner review — latest revision

The owner circled the canopy, lamp and nameplate in the street photograph. The vertical plate retained the old seven-character proportions after its inscription became four characters: its text filled only the top. It is now a compact 1.18 m plate, its four characters evenly distributed, below the canopy and clear of the lamp. The concrete canopy has a visible cream cap above a complete enamel sign; the emblem and station name are painted on that one sign face. The sign’s backing stands 15 mm clear of the cap. Two separate pull handles replace the rail across both door panes. Each correction has who/why in the dressing data.

These close views are from the **full compiled game**, at 390×844, after normal title startup. Both runs completed without JavaScript errors; the town’s ink, grade, FXAA, HDR and four-sample target remain enabled. Chromium/SwiftShader with an iPhone user agent; requestAnimationFrame throttled to protect the runner’s software-GPU queue, so these are functional/visual checks, not FPS or physical-iPhone evidence. “Before” replays the compiled page and runtime of `63074d0`.

| Entrance view | Before review correction | Latest correction |
|---|---|---|
| Front | [Before](entrance-review/before/front.png) | [After](entrance-review/after/front.png) |
| Angle | [Before](entrance-review/before/angle.png) | [After](entrance-review/after/angle.png) |

Reproduce with `SHOT_STAGE=before node tools/police-station-entrance-review.mjs` and `SHOT_STAGE=after node tools/police-station-entrance-review.mjs`. Reports sit beside the images. The latest model has 14,040 triangles and 80 material groups (previous entrance: 13,920 and 80).

## Changes

A south balcony with painted iron railing; bedding out 08:00–12:00 only when dry; towels out 08:00–17:00 only when dry; an open geometric breeze-block screen; a small Asahikage painted in a canopy sign; two hibiscus pots; bracket supports for the existing cooler; two chained LP cylinders in a ventilated service hutch; an open steel stand under the existing tank. The existing window material provides curtains behind the upstairs glazing. The tank, antenna, white bicycle and rear box are retained rather than duplicated.

The board carries yesterday’s traffic accidents (0), maritime safety and seat-belt notices. Its lost-property story uses the storyteller’s actual resident belongings; missing Tama is drawn from the bookshop’s story catalogue. The physical posters are Japanese; the readable inspection is English. The patrol card follows Mori’s existing cast timetable, 21:00–02:00, including midnight. Weather changes take bedding and towels in immediately. Every addition records who/why.

## Initial upgrade photographs (first revision)

All images are 390×844 Chromium/SwiftShader captures of the actual static `createTown` scene, with the town’s cel and ink passes, clock/weather colours and station sun shadows. This is not a physical iPhone or FPS test. No simulation or asynchronously streamed detail models run. The original harness froze the title loop before Start was enabled. A follow-up through normal startup reached play and passed 13 live checks (entry, walking upstairs to y=3 m, exit, weather and patrol boundaries) without JavaScript errors. These static photos do not establish frame rate or physical-device performance. Existing surrounding buildings, street poles and laid ground remain visible. The front camera was moved along the street after the first view was obscured by an opposite building.

| View | Before | After |
|---|---|---|
| street | [Before](before/street.png) | [After](after/street.png) |
| south | [Before](before/south.png) | [After](after/south.png) |
| north | [Before](before/north.png) | [After](after/north.png) |
| back | [Before](before/back.png) | [After](after/back.png) |
| dusk | [Before](before/dusk.png) | [After](after/dusk.png) |
| rainy-morning | [Before](before/rainy-morning.png) | [After](after/rainy-morning.png) |
| patrol | [Before](before/patrol.png) | [After](after/patrol.png) |

## Geometry and rendering cost

| Measure | Before | After |
|---|---:|---:|
| Station mesh batches (all states) | 21 | 25 |
| Station material draw groups (all states) | 66 | 80 |
| Station model triangles (latest entrance revision, all states) | 8,300 | 14,040 |

Static additions are merged into the station’s kit. Only the futon, towels and patrol card need independently visible groups. Material draw groups include sign fronts/backs/edges and hidden states; they are not the number visible in every frame. The initial revision had 13,920 triangles; the entrance correction adds 120 triangles with no extra material groups. Below are the initial revision’s measured rendered calls/triangles for the complete static scene and its shadow/postprocess passes, with `renderer.info.autoReset=false`, reset once per shot.

| View | Calls before | Calls after | Triangles before | Triangles after |
|---|---:|---:|---:|---:|
| street | 274 | 290 | 351,888 | 363,104 |
| south | 583 | 599 | 453,367 | 464,583 |
| north | 337 | 353 | 438,247 | 449,463 |
| back | 291 | 307 | 390,684 | 401,900 |
| dusk | 283 | 295 | 352,498 | 363,546 |
| rainy-morning | 585 | 597 | 453,395 | 464,443 |
| patrol | 282 | 306 | 352,114 | 363,186 |

## Verification

The station is an owner region in `no-z-fighting.test.mjs` at 0.01 m². A planted 0.04 m² pane, 0.5 mm off its actual west wall, must be detected. The dressing suite also scans dry morning, rain, noon and patrol states. Entrance and car exit clearance are checked; ground-standard retains its empty baseline with zero violations. A real-town downward-ray inspection confirmed the pot bases on 0.04 m concrete and the hutch on 0.02 m lawn. No ground plan or ground baseline was edited.

**48 checks passed:** 34 acceptance checks, 11 z-fighting checks and 3 runtime-package checks. The z-fighting suite ran separately with a 6 GB Node heap after a combined run was terminated on the runner.

Required checks: ground-standard, no-z-fighting, enterable-sites, vending-placement, police-station, police-station-dressing, english-language, sign-backs, edition and runtime-package. Runtime built with `npm run build:runtime`; generated `runtime/`, `index.html` and `sw.js` are committed separately last. See the test output files alongside this report.

## Deliberate omissions and retained behaviour

- No weathering or reflection-stripe planes, duplicate drinks machine, utility pole, power lines, diorama scenery, inverted-hull outline or point lights were added. The town’s own materials and ink pass are used.
- No new riding performance: the existing timetable and locomotion have Mori walking the night patrol. His white bicycle therefore remains locked in the rack; it does not disappear without a rider. Cast and Mori’s timetable are unchanged.
- No new enterable balcony or altered interior: the existing functional station and upstairs accommodation remain in place.
- Harbour Park, Umi-no-yu, Higa Liquor, the laundry and their source modules are untouched.
