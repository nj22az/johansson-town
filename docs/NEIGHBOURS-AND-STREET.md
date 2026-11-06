# Fitted neighbours archive and town surfaces

The character section records an earlier art pass. The active cast is now documented in [VROID-CAST.md](VROID-CAST.md); these MakeHuman assets remain archived. The street surface and plant work below remains active.

The former resident prototypes had segmented limbs, simplified faces and stiff poses. The active 21 neighbours now use fitted MakeHuman anatomy, textured skin, everyday clothing, hair and blended joints. Age, build, face targets, wardrobe and colour vary by resident. Fine spectacles are bound to the heads of Aya, Reiko, Tetsuo and Fumiko. Skirts have extra hem room and masked covered thighs to avoid walking intersections.

Seven original in-place actions cover idle, walk, run, wave, sit, eat and drink. Animation pace follows measured horizontal movement; teleports and vertical ground changes do not trigger walking. Heading follows actual movement around obstacles. Greeting plays once and returns to idle, crossfades reset their weights, and the cup follows the right hand. All actors enter an idle pose immediately after loading.

Concrete, stone paving and bamboo textures from OpenGameArt add detail to walls, paths, doors and counters. Architectural UVs now use metres in world space so an eight-metre wall no longer stretches one texture tile across its whole width. This also survives colour batching; imported buildings retain their authored UVs. Daylight ambient fill and exposure are reduced slightly for more readable surface contrast. Fog remains disabled.

Fifteen detailed Polygonal Mind potted plants replace spherical foliage and dress the supplied harbour shops. The two-part model uses alpha-tested leaves and 512px textures. Nearby plants share instanced draws in 32-metre cells. A bounded loader keeps a missing decorative asset from blocking startup.

The existing harbour shops and boardwalk, first-person controls, Thuan's supplied model and greeting, doors, interiors, NPC subjects/schedules, v4 saves and quest-gated travel remain connected. The older cast stays in the repository for rollback.

## Sources and reproduction

The owner's [GameDev Free Resources catalogue](https://github.com/teamgravitydev/gamedev-free-resources) led to the OpenGameArt surface files. The owner's [OS3A Gallery](https://github.com/ToxSam/os3a-gallery) led to Polygonal Mind's Banana Plant. Exact sources, creator licences, source hashes and output hashes are in the asset ledger and these receipts:

- `assets/characters/neighbours/manifest.json` and each `.source.json`
- `assets/materials/oga-manifest.json`
- `assets/models/street/manifest.json` and `LICENSE-CC0.md`
- `assets/characters/realistic/provenance.json` and `LICENSE-MAKEHUMAN-CC0.md`

The characters use Blender 4.2.23 LTS, MPFB revision `437dd513888a92399d1d3200d2e80859fae55abc` and the verified MakeHuman CC0 system asset pack. The MPFB add-on is an authoring dependency; the game distributes its generated CC0 assets. No new external asset service runs during play.

From the game directory, with those dependencies downloaded and extracted:

```sh
blender -b -t 4 --python tools/blender/build-neighbours.py -- \
  --root /absolute/path/to/johansson-town \
  --mpfb /absolute/path/to/mpfb/src/mpfb \
  --assets /absolute/path/to/makehuman-system-assets
python tools/pack-neighbours.py
blender -b -t 4 --python tools/blender/review-neighbours.py
```

The builder supports `--only resident-02,resident-07` for targeted edits. The packer verifies and preserves already-packed assets with matching receipts, shares texture files, reduces image sizes, preserves blended skin weights, and compacts constant animation tracks. Rebuild the plant with `python tools/pack-street-plant.py /path/to/Banana_Plant.glb`; the original download and its required SHA-256 are recorded in the shipped plant manifest.

## Validation and budget

`npm test` covers 54 cases, including real GLB geometry/animation loading, all seven clips across all 21 residents, normalized blended skin weights, bounded deformations and grounded soles. It also covers plant loading/batching, texture scaling after batching, collision-free routes, interiors, quest progression, v4 saves, first-person movement, Thuan and drink interactions. The production Vite build passes with the existing large JavaScript chunk warning.

Studio CPU renders of four packed production characters were inspected in walking, running and seated poses. The final images and before/after scene estimates are in `art/neighbours/`. These renders use studio lighting outside the game. The scene estimator stubs image decoding and excludes shadows, interiors, GPU timing and the held/player objects; its fixed starting cast is used across viewpoints.

The cast shares 34 texture files at 256–1024px, with three concurrent decode workers and shared runtime texture objects. Each actor has six or seven skinned draws. At most eight scheduled residents remain visible. Exact byte totals and per-model triangle counts are in the manifest; exact scene counts are in the two review JSON files. This visual upgrade adds draw calls and geometry relative to the preceding harbour-only branch. Browser shader appearance and iPad frame rate have not been measured in this pass.

Compared with harbour-only commit `a8dbbbd63496c14ec46fc844ecb94fd060e1f7da`, daytime CPU estimates are:

| View | Earlier draws | Updated draws | Earlier triangles | Updated triangles |
| --- | ---: | ---: | ---: | ---: |
| start | 515 | 564 | 240,374 | 307,899 |
| street | 261 | 310 | 216,122 | 246,715 |
| quay | 62 | 105 | 113,036 | 128,513 |
| pierLookingBack | 587 | 633 | 319,403 | 390,384 |
| shrineLookingBack | 605 | 651 | 301,980 | 372,961 |

The 21 GLBs total 16,668,444 bytes; their 34 shared textures total 5,405,990 bytes. Each resident has 10,243–15,028 triangles. The street plant is 420,756 bytes. All 15 plants use 16 spatially grouped draws. These are storage and scene-geometry budgets; on-device rendering performance remains unmeasured.
