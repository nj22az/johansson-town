> **September 2026:** the character models (MakeHuman Thuan and Johansson, Nao's VRoid, the Meshy Thuan, the low-poly residents) and the retired districts were removed; everyone in town is now a code-built Shimanchu (`src/avatars/`). Their entries below are kept as history. Files can be recovered from git (see `docs/EXPANSION-NOTES.md`).

> **October 2026:** the legacy town layouts (Main Street frontage, dining lane, Willow Alley, Inakaya, tea house, Thuan's supplied apartment) were deleted with the old town modes; their entries are marked retired.

> Current asset inventory: `assets/models/` and [resident provenance](characters/residents/PROVENANCE.md). Older cast descriptions below are historical; unused prototype binaries have been retired.

# Asset licence ledger

All runtime files are served from this game's directory. No remote model, map, texture or audio service is required while playing. This ledger identifies included files; proposed sources are not credited as if their assets shipped.

| Files | Creator/source | Licence and changes |
| --- | --- | --- |
| `../vendor/three.module.js`, loaders, utilities and `../tools/vendor/GLTFExporter.js` | [Three.js r170](https://github.com/mrdoob/three.js/tree/r170) | MIT; full text in `../vendor/LICENSE-THREE.txt`; module paths and whitespace normalised |
| `../src/dialogue/dialogue-engine.js` | [Godot Open Dialogue System — Tina Qin (QueenChristina)](https://github.com/QueenChristina/gd_dialog) | MIT; full text in `../src/dialogue/LICENSE-GD-DIALOG.txt`; GDScript reimplemented in JavaScript as a DOM-free state machine. The dialogue data format and its rules are kept: text pages, conditional `next` with a trailing default, `show_only_if` choices, actions, and the `&` and `|` characters. Godot's scene tree, typewriter timer, voices and bbcode are not ported; town dialogue in `../src/dialogue/sakura.json` is original writing |
| `../landing.css` | [AsagaoUI — Hiroshi ISOBE](https://github.com/ctpena/asagaoui), following [Japan's Digital Agency design system](https://design.digital.go.jp) | MIT; full text in `../LICENSE-ASAGAOUI.txt`; design language only. The grey and blue ramps, type scale, 0.5rem spacing, 4/8/12px rounding and the yellow-on-black focus ring are ported as CSS custom properties and written against this page's own markup. None of the framework's CSS, JavaScript, icons or illustrations is included: at 105KB minified it would sit in front of the town it links to |
| `../src/input/virtual-joystick.js` | [Virtual Joystick — Marco Fazio (MarcoFazioRandom)](https://github.com/MarcoFazioRandom/Virtual-Joystick-Godot) | MIT; full text in `../LICENSE-VIRTUAL-JOYSTICK.txt`; GDScript reimplemented in JavaScript against pointer events. The behaviour is kept: the fixed, dynamic and following joystick modes, the always/touchscreen/when-touched visibility modes, and the output curve that subtracts the dead zone and rescales the remainder across the clamp zone so the stick ramps from zero instead of jumping. Godot's Control nodes, input actions and texture handling are not ported; the hit area, the layout and the opening hint are this town's own |
| `../src/render/cel.js`, `../src/render/ink-pipeline.js` | [Sakura Crossing — Kenton Wang (Kenton-GMI)](https://github.com/Kenton-GMI/sakura-crossing) | MIT; full text in `../LICENSE-SAKURA-CROSSING.txt`. The shading is ported: the quantised gradient ramps, the `lights_toon_pars_fragment` patch that hue-shifts the shadow bands toward violet, the screen-space ink read as a second difference of linearised depth, the split-tone grade and the FXAA resolve. None of its textures or world building is included; the few pieces of its geometry that are ported are listed in the next row. Two things are this town's own: the materials are converted by a pass over the scene graph rather than authored as toon from the start, because the districts here stream in and are built across fifty files; and photographic maps are mixed part-way toward flat colour, which that project never needs because it ships no image assets at all |
| `../src/world/okinawa/kit.js`, `../src/world/okinawa/props.js` | [Sakura Crossing — Kenton Wang (Kenton-GMI)](https://github.com/Kenton-GMI/sakura-crossing) | MIT; full text in `../LICENSE-SAKURA-CROSSING.txt`. Ported and adapted: the bake-per-material batching of primitives (`bake`, `trs`), the sagging-cable curve (`sagCurve`) and the construction of its utility pole (`makePole`: crossarms, insulators, transformer cans, cable bundle) and kei truck (`makeKeiTruck`). They are rebuilt on this town's kit, which bakes by finish and 32 m cell with vertex colour, and use its materials and cel pass rather than `cel()`. Its Canvas2D sign style informed `../src/world/okinawa/signs.js`, whose painters are this town's own; the Okinawan houses, walls, gardens, quays and boats are original |
| `../src/avatars/` (recipe, face, build, animate, actors, cast, creator), `../creator/` | Original to this town | The Shimanchu avatars and their maker are this town's own work: the part shapes, the painted faces, the procedural body and its animation, the palettes and the maker's layout. They take no assets, code or artwork from any console character system; the maker's tabs-parts-colours-sliders layout is a common convention for character makers. They are shaded by the town's own cel pass (`../src/render/cel.js`, credited above) |
| `../src/commerce/konbini.js` | [Yorimichi — emaxsaun](https://github.com/emaxsaun/yorimichi) | MIT; full text in `../LICENSE-YORIMICHI.txt`; design only, no code. The counter ritual, the paper stamp card, the kept receipt and the record of what you have tried are its ideas, rebuilt in 3D against this town's own stock and ledger. Adapted to 1988: its IC card and QR payments postdate the setting, so the counter takes cash and counts change, and the bag is asked about but never charged for, as it would not have been until 2020 |
| `asphalt.jpg`, `materials/asphalt-*.jpg` | [asphalt_02 — Rob Tuytel / Poly Haven](https://polyhaven.com/a/asphalt_02) | CC0; 1K albedo, OpenGL normal and packed AO/roughness/metalness |
| `timber.jpg`, `materials/timber-*.jpg` | [weathered_planks — Dario Barresi and Dimitrios Savva / Poly Haven](https://polyhaven.com/a/weathered_planks) | CC0; same three channels |
| `roof.jpg`, `materials/roof-*.jpg` | [roof_tiles_14 — Rob Tuytel / Poly Haven](https://polyhaven.com/a/roof_tiles_14) | CC0; same three channels |
| `plaster.jpg`, `materials/plaster-*.jpg` | [plastered_stone_wall — Rob Tuytel / Poly Haven](https://polyhaven.com/a/plastered_stone_wall) | CC0; same three channels |
| `characters/residents/town-*.glb` | [Quaternius Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html), [Ultimate Modular Women](https://quaternius.com/packs/ultimatemodularwomen.html) | CC0; five clothed adult bases. Material palettes merged to vertex colours; six compatible clips retained; suit weapon removed. Included creator licence texts and exact provenance in `characters/residents/`. |
| `maps/tomonoura.json`, `maps/adapted-roads.json` | [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) | ODbL 1.0; retained source coordinates plus explicitly adapted game centrelines. The map data, including adaptations, is offered under ODbL. No Google or GSI tiles are included. |
| `audio/*.wav` | Original Johansson Town signal-rendered Foley and instrumental loops | Newly created project material; generator in `../tools/render-audio.py`. No sampled songs, recorded broadcasts or third-party music. CC0 dedication in `audio/LICENSE.txt`. |

Poly Haven's [licence statement](https://polyhaven.com/license) and [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). OSM's [ODbL 1.0 terms](https://opendatacommons.org/licenses/odbl/1-0/). File hashes are included in the manifests alongside download/source URLs.

Original town geometry, procedural fallback rigs, signs and fictional paper text are authored project content. This ledger does not relicense the entire repository.

All named residents now use the five Quaternius low-poly bases, including Aya and Nozomi in Reiko's existing role. Each identity has a stable individual palette, build and bone-mounted accessories; shared base geometry and animation clips are retained. New ponytails, hairbands, scarves and satchels are original project geometry. The earlier Aya and Nozomi models remain archived and are not requested by the character loader. Thuan's original soft model is loaded only for the static figurine inside Sakura.

The older Kenney Mini Character archive remains on disk under its included CC0 licence but is not loaded. ambientCG, Quaternius UBC/UAL2 and restaurant packs, GSI historical photographs and Sketchfab kits are **not included** in this revision. Later additions, including user-supplied franchise models, are recorded separately below.

## Generation pilot

`audio/voices/*.wav`: four project-scripted synthetic Japanese dialogue clips generated with [Qwen3-TTS CustomVoice](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice) via its public Hugging Face Space. Model licence: Apache-2.0; no weights distributed. Output provenance, exact requests and licensing scope are in `audio/voices/PROVENANCE.md`.

`generation/pilot/references/*.png`: five OpenAI-generated isolated prop references, with original project prompts and hashes alongside them. Authoring only; no generated street photograph is used as a game surface. TRELLIS.2 conversion was attempted but blocked by public GPU quota; no TRELLIS meshes ship in this revision.

`lighting/industrial_sunset_02_1k.hdr`: [Industrial Sunset 02 — Sergej Majboroda / Poly Haven](https://polyhaven.com/a/industrial_sunset_02), CC0. Unmodified 1K HDR file; verified against the creator API's MD5, SHA-256 in `lighting/PROVENANCE.json`. Used for lighting/reflections, not photographed modern scenery. `../vendor/RGBELoader.js` is Three.js r170, MIT under the included Three licence, with its import made local.

Kenji: `characters/realistic/kenji.glb` is authored in Blender using MPFB/MakeHuman anatomical data and the MakeHuman CC0 system asset pack (skin, casualsuit01, shoes01, short01, low-poly eyes, eyebrow001). Exact file hashes, holders, source links and full CC0 text are in `characters/realistic/`. The editable packed `.blend`, scripts and actual CPU render previews are included under `art/characters/kenji/` and `tools/blender/`. MPFB add-on code is an authoring dependency and is not bundled.

Thuan (legacy yui* asset): `characters/realistic/yui.glb` uses the MakeHuman CC0 anatomical base, young Asian female skin, female_elegantsuit01, shoes03, long01 hair, low-poly eyes and eyebrow001. Pink textile adaptation, A-line skirt shape, cream collar, glasses, hat and ribbon geometry were authored in Blender. Source hashes and rights holders: `characters/realistic/yui-provenance.json`; full CC0 text is shared with Kenji. User reference photographs are not redistributed.

## Thuan (legacy yuri* paths) — user-supplied Meshy design

`characters/realistic/yuri-meshy.glb` is the user's uploaded `Meshy_AI_Garden_Charm_0908113531_texture.glb`, included at their explicit request. It embeds three 2048px JPEG textures and contains 14,235 triangles. It is an unrigged posed mesh with no animation clips. It is **not represented as CC0**; the original author/account retains their applicable rights. The previous MakeHuman Thuan remains the local loading fallback.

## Thuan (legacy yuri* paths) — Thoughtful Girl biped revision

The runtime `characters/realistic/yuri-playful.glb` now uses the user's newer `Meshy_AI_Thoughtful_Girl_in_Pi_biped.zip`, containing textured Walking and Running GLBs. Included at the user's request; not represented as CC0. The supplied skeleton and locomotion are retained, with local Blender geometry/shading/weight repairs and an original quiet idle. The previous Garden Charm design is preserved in git history. Editable packed source and renders: `art/characters/yuri-biped/`.
## Thuan (legacy yuri* paths) — Thoughtful Girl (2026-09-08)
- Source: owner-supplied `Meshy_AI_Thoughtful_Girl_in_Pi_biped(1).zip`, used at the owner's request. No CC0 licence is asserted.
- Active file: `characters/realistic/yuri-playful.glb`; one textured skinned mesh with the supplied walking and running clips.
- Packed with `tools/prepare-yuri.py`: duplicate clip removal, shared mesh/textures, embedded 1024px JPEG maps.
- Original rig-specific idle/head tilt and greeting nod/hand flutter: `src/people/yuri-animation.js`. No facial morph targets or facial animation are supplied.
- Previous Garden Charm asset is retained for rollback and is no longer requested at boot.

### Vending machine (September 2026)
- **Vending Machine**, Don Carson: https://poly.pizza/m/0CX6wj64Swu
- Licence: Creative Commons Attribution 3.0 Unported, https://creativecommons.org/licenses/by/3.0/
- Download: https://static.poly.pizza/f12c4236-7a2b-4b50-aa1f-fa2575fab9ae.glb
- Local original: `models/props/vending-machine.glb` (249,008 bytes).
- Runtime adaptations: normalize scale/orientation; omit transparent glass; bake source colours into one opaque mesh; add original Minato Drinks, Harbour Tea and Dockside Coffee mock branding.
- All drink brands and campaign artwork are fictional placeholders, not endorsements. Campaign presentation is in `src/commerce/vending-catalogue.js`; saved inventory IDs and drink gameplay remain independent of branding. No advertising service is connected.

## Living-town prototype · September 2026

Minato izakaya and the 21 resident prototypes are original scripted Blender constructions for this project. Editable `.blend` files, generators and export records are included under `art/izakaya`, `art/living-cast` and `tools/blender`. Runtime GLBs are local. No downloaded third-party mesh or texture was used in these new constructions. Thuan's user-supplied Meshy asset and its existing provenance are unchanged. The prototype cast is not a claim of final art approval or equivalence to Thuan; see `docs/LIVING-TOWN.md`.

## Quiet City Block — owner-supplied Meshy asset (2026-09-08)

`models/harbour-block/harbour-shops.glb` and its three JPEG maps derive from the owner's `Meshy_AI_Quiet_City_Block_0908215843_texture.glb`, supplied through [Drive](https://drive.google.com/file/d/1n-K5OgB0sRO5Ve4Z82Uf-wP-nDythdoN/view) and included at their request. No CC0 licence is asserted for this supplied asset. Four buildings are extracted and simplified into near/far versions; source ground and detached vegetation/poles are removed, fused foliage is trimmed, and textures are re-encoded at their original 2048px resolution. Exact source hash and runtime counts: `models/harbour-block/manifest.json`. The boardwalk, entry frames and signs are authored project geometry; the extra surface grain uses the existing credited Poly Haven timber and plaster textures. Reproduction and validation: `../docs/HARBOUR-BOARDWALK.md`.

## Fitted neighbours and street surfaces (2026-09-09)

The archived fitted cast used `characters/neighbours/resident-00.glb` through `resident-20.glb`, authored with Blender 4.2.23 LTS and MPFB from the MakeHuman CC0 anatomical base and system asset pack. Each has independent age/build/face fitting, fitted clothes and hair, blended skin weights, seven original in-place clips and grounded soles. Covered thighs are masked beneath skirts. Textures are shared locally and limited to 256–1024px; clothing colours and older residents' hair are adapted. Exact inputs, hashes, pinned authoring revision and modifications are in `characters/neighbours/manifest.json` and the per-resident `.source.json` files. Full CC0 terms and source rights holders remain in `characters/realistic/LICENSE-MAKEHUMAN-CC0.md` and `characters/realistic/provenance.json`. The former segmented `living/` models are now an inactive archive. Thuan's supplied asset and rights are unchanged.

The following surfaces were discovered through the owner's [GameDev Free Resources catalogue](https://github.com/teamgravitydev/gamedev-free-resources). All are CC0 1.0; exact source downloads and before/after hashes are in `materials/oga-manifest.json`.

| Shipped files | Creator and exact source | Adaptation |
| --- | --- | --- |
| `materials/oga-concrete.jpg` | [YCbCr — Concrete Textures Seamless 1k](https://opengameart.org/content/concrete-textures-seamless-1k) | Selected concrete2 diffuse image; 1024px JPEG; shallow runtime bump inference |
| `materials/oga-paving.jpg` | [para — Ground Pavement Texture Pack](https://opengameart.org/content/ground-pavement-texture-pack) | Selected ground_stone_pavement_01.png; downsampled to 1024px JPEG; shallow runtime bump inference |
| `materials/oga-bamboo.jpg`, `materials/oga-bamboo-normal.jpg` | [YCbCr — Bamboo Wood Seamless 1k](https://opengameart.org/content/bamboo-wood-seamless-1k) | Original colour and normal channels re-encoded as 1024px JPEG |

`models/street/potted-plant.glb`: [Banana Plant — Polygonal Mind](https://github.com/ToxSam/cc0-models-Polygonal-Mind/blob/main/projects/avatar-show/Banana_Plant.glb), discovered through the owner's [ToxSam OS3A Gallery](https://github.com/ToxSam/os3a-gallery). CC0 under the collection's [creator licence](https://github.com/ToxSam/cc0-models-Polygonal-Mind/blob/main/License.md), included as `models/street/LICENSE-CC0.md`. Original geometry retained, embedded textures reduced to 512px, leaf blending changed to alpha testing, and repeated plants instanced in spatial cells. Original and shipped hashes are in `models/street/manifest.json`.

## User-supplied office and ramen restaurant (2026-09-09) — retired

**Removed 1 October 2026.** Both files were game rips (Nintendo's *Tomodachi Life*, Sega's *Shenmue*); a Sketchfab upload cannot license them. The harbour office is now an original room built in `src/world/interiors/office-workplace.js` (`buildOfficeShell`), and the ramen restaurant model was not loaded by anything. The supplied *Tomodachi Life* crystal room was retired with them. Recover from git history only for reference, not for shipping.

These two models were supplied by the owner and included at their express request. They are separate from the CC0 catalogue assets above. The following author, source and licence fields are preserved from the supplied GLBs; they are uploader metadata, not an independent rights verification for the original games.

| Runtime model | Supplied source and attribution | Adaptation |
| --- | --- | --- |

Both models use unlit materials to preserve their baked texture/vertex lighting. Original source metadata, input/output SHA-256 hashes, transforms and counts are recorded in each model directory's `manifest.json`. The original uploads are not modified. Reproduction: `python tools/pack-supplied-rooms.py --office /path/to/office.glb --ramen /path/to/ramen.glb` (Python with NumPy). Collision shapes, interaction anchors and the original Sato Ramen fascia/roof trim are project additions. No CC0 licence is asserted for either supplied model.

## Thuan’s bedroom — Bedroom Interior (2026-09-09) — retired

`models/yuri-home/yuri-bedroom.glb` is the owner-supplied **Bedroom Interior** by [ankitk2618](https://sketchfab.com/ankitk2618), [model page](https://sketchfab.com/3d-models/bedroom-interior-082a0fa7766448b8ad68202367cb27c1). Embedded licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Included at the owner’s request from their Drive file.

Adaptations: bake the source hierarchy into vertices; scale the 1.33 m dollhouse interior to a 2.72 m ceiling; rotate the south doorway to +Z; downsample embedded JPEGs to 1024px; merge primitives that share a material; unlit materials keep the baked lighting. 74,874 triangles; 24 draws. Source/output hashes, furniture bounds and transforms: `models/yuri-home/manifest.json`. Reproduction: `python tools/pack-yuri-bedroom.py /path/to/bedroom.glb` (NumPy and Pillow). No CC0 licence is asserted for this supplied interior.

## Thuan’s house — Japanese Residential Home 02 (2026-09-09) — retired

`models/yuri-home/yuri-home-exterior.glb` is the owner-supplied **Japanese Residential Home 02** by [Morrissey Alexander](https://sketchfab.com/reckzilla), [model page](https://sketchfab.com/3d-models/japanese-residential-home-02-c31697f09152453cb3ed215482e7a810). Embedded licence: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Included at the owner’s request from their Drive file.

Adaptations: bake the Sketchfab hierarchy into one mesh; convert centimetres to metres; rotate the east door to local +Z; ground the floor at Y=0; re-encode the base-colour atlas at 2048px JPEG and packed metallic-roughness/normal maps at 1024px; opaque front-facing materials. 1,996 triangles; one draw; 1,422,240 bytes. Source/output hashes, bounds and door centre: `models/yuri-home/exterior-manifest.json`. Reproduction: `python tools/pack-yuri-home.py /path/to/japanese_residential_home_02.glb` (NumPy and Pillow). The house replaces the generic canal-bank shell at 22 Willow Alley; the existing bedroom interior remains.

## Minato Izakaya — BenMaher exterior (2026-09-09)

The active exterior is now `models/izakaya/minato-benmaher-exterior.glb`, derived from the owner's supplied **Izakaya - Low Poly Building** by [BenMaher](https://sketchfab.com/BenMaher). The GLB identifies this [source model](https://sketchfab.com/3d-models/izakaya-low-poly-building-3f43e5429171408e9bd19553ea813364) and [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) licence. These credits are preserved from the upload's embedded metadata. No endorsement by the creator is implied.

Adaptations: remove the separate two-triangle presentation ground plane; keep all 2,446 building triangles; merge opaque geometry; preserve wire and rooftop-cloth cutouts with small RGBA texture crops; re-encode the base-colour atlas at 2048px and normal, packed AO/roughness/metalness and emission atlases at 1024px; retain the original neon colours at 65% emission strength; fit human scale, orientation and the door to Minato's existing street entrance. The result is 2,958,412 bytes and three draws. Source/output hashes, preserved metadata and geometry bounds are in `models/izakaya/benmaher-manifest.json`. Reproduce with `python tools/pack-benmaher-izakaya.py /path/to/izakaya_-_low_poly_building.glb` (NumPy and Pillow).

The previously supplied Meshy izakaya exterior is an inactive archive. Minato's existing project-authored dining room and activities remain active.

## VRoid anime town cast (2026-09-09)

The active 21 town residents now use `characters/vroid/`. Five CC0 sample models by **pixiv Inc. / VRoid Project** supply the actual anime geometry, humanoid skinning and facial morph targets. Sources and model-specific creator licence pages:

| Packed base | Original VRoid sample | Creator licence |
| --- | --- | --- |
| `vroid-bob.glb` | Vivi / beta AvatarSample_2 | [CC0](https://vroid.pixiv.help/hc/en-us/articles/360014900273) |
| `vroid-casual.glb` | HairSample_Male | [CC0 sample listing](https://vroid.pixiv.help/hc/en-us/articles/4402614652569) |
| `vroid-vest.glb` | Sakurada Fumiriya | [CC0](https://vroid.pixiv.help/hc/en-us/articles/360014788554) |
| `vroid-ponytail.glb` | Victoria Rubin / beta AvatarSample_4 | [CC0](https://vroid.pixiv.help/hc/en-us/articles/360014900233) |
| `vroid-long.glb` | Sendagaya Shino | [CC0](https://vroid.pixiv.help/hc/en-us/articles/360013482714) |

The original VRMs were obtained from the public [madjin/vrm-samples mirror](https://github.com/madjin/vrm-samples/tree/e16eb187100149a315ad92c3c9968f1d5baa6c7d/vroid/beta). `characters/vroid/manifest.json` records the exact input and output hashes. Changes: 512–1024px local texture atlases, four or five skinned draws per base, shared geometry, individual hair/clothes colours, head-bound glasses, retained eyelid/smile/mouth morphs, seven original humanoid animations, seated skirt fitting, fitted dark shorts beneath skirts, sole grounding and orientation conversion. The runtime uses portable GLB and illustrated unlit materials, without a VRoid Hub account or remote asset service. See `../docs/VROID-CAST.md` for reproduction.

## Complete canal overworld — retired

Japanese Town by Nazareno_rojas, CC BY 4.0. All original buildings, streets, bridge and canal retained. Texture compression, static batching and gameplay adaptation: Johansson Town. See [source, licence and changes](models/full-town/CREDITS.md).

### Inakaya restaurant exterior, interior and adjoining timber house — retired

`models/ramen/inakaya-exterior.glb`: **Japanese Restaurant “Inakaya”**, by
[Jellepostma](https://sketchfab.com/Jellepostma),
[original model](https://sketchfab.com/3d-models/japanese-restaurant-inakaya-97594e92c418491ab7f032ed2abbf596),
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), as embedded in the supplied file.
Adapted for the east lane: fitted width/depth, grounded geometry, removed source
foreground paving/poles, compacted unused vertices, reduced embedded texture sizes.
Both buildings, their material assignments and transparent details are retained.
The right doorway leads to the existing Sato Ramen interior; the timber doorway
is closed (its crystal room was a game rip and was retired in October 2026).
Rebuild with `python tools/pack-inakaya.py /path/to/japanese_restaurant_inakaya.glb`.
Hashes, dimensions and texture sizes are recorded in `models/ramen/inakaya-manifest.json`.

The playable ramen interior reuses this Inakaya asset. A cached geometry variant restores the source width/depth and adds 0.6 m within the customer aisle; textures and street geometry remain shared/unmodified. Floor, stools, interaction points and NPC seating are fitted to the source model.

## Sakura fictional advertisements

`graphics/konbini/*.webp`: original AI-generated NAGI, PORT 88 and KOMOREBI poster art created for Johansson Town with OpenAI image generation. See `../art/store/advertising/README.md` for the design briefs and runtime treatment. Product packaging uses the original generated atlases described below, with canvas-drawn fallback labels and shelf prices.

## Umanose (Horseback) Sea Cave

- Author: [STUDIO DUCKBILL](https://sketchfab.com/DuckbillStudio).
- Source: [Umanose(Horseback) Sea Cave](https://sketchfab.com/3d-models/umanosehorseback-sea-cave-955ca0d3f21547198f44deb4363a830a), supplied by the user through Google Drive.
- Licence in supplied GLB metadata: [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/). This asset retains its non-commercial restriction; it is not covered by the repository's general licence.
- Changes: baked transforms, texture-aware simplification, two 2048px JPEG textures, lit rough rock materials, uniform placement beyond the northern street boundary. No portion of the scan was cropped out.
- Runtime file: `models/sea-cave/umanose.glb`. Rebuild with `node tools/pack-sea-cave.mjs /path/to/umanosehorseback_sea_cave.glb`. Source hash and geometry measurements are in `models/sea-cave/manifest.json`.

## Old Warehouse (2026-09-11) — retired

**Removed 1 October 2026.** The harbour warehouse is now built in code from the Okinawan kit (`src/world/warehouse.js`, `buildWarehouseShell`); the photographed model is no longer shipped.

`models/warehouse/old-warehouse.glb` replaces the western harbour shed with the user-supplied **Old Warehouse** by [aswin.baskaran](https://sketchfab.com/aswin4550). [Source model](https://sketchfab.com/3d-models/old-warehouse-5ca553c34c524a85b3d72ce64da95e41); licence recorded in the supplied file: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Changes: removed the detached presentation ground plane; merged static geometry by material; capped textures at 1024 pixels and recompressed photographic maps. The warehouse, awning, ladder, pipes, windows and loading props are retained. Source metadata and hashes are preserved in the GLB and `models/warehouse/manifest.json`. Rebuild with `python tools/pack-warehouse.py /path/to/old_warehouse.glb`.

## Nozomi model for Reiko (2026-09-10)

`characters/realistic/nozomi.glb` is adapted from the user-supplied `shenmue_-_nozomi.glb`. The embedded source metadata credits [Kiklox](https://sketchfab.com/kiklox), links to [Shenmue — Nozomi](https://sketchfab.com/3d-models/shenmue-nozomi-0ac87fba37dd45af9286d440eee1d753), and declares [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The Nozomi character and original Shenmue artwork are associated with SEGA; the uploader's metadata is retained as provenance, not a separate grant from the original rights holder. Included at the user's request.

Changes: 57 skinned pieces combined into four material draws; unused second skeleton removed; legacy specular/glossiness textures converted to supported PBR materials; original geometry, skin weights, UVs and four embedded PNGs preserved. Seven original idle, walking, running, greeting, sitting, eating and drinking clips are baked onto the supplied skeleton. Reiko retains her existing name, role, conversations and schedule. Source hash and preparation details are embedded in the GLB. Reproduce with `tools/pack-nozomi.py` followed by `tools/animate-nozomi.mjs`.

## Willow Alley residential street (2026-09-11) — retired

`models/residential-street/willow-street.glb` is the user-supplied **Stylized Little Japanese Town Street** by [Michał Solarek](https://sketchfab.com/misiek13). [Source model](https://sketchfab.com/3d-models/stylized-little-japanese-town-street-200fc33b8a2b4da98e71590feeb255a8); licence recorded in the supplied GLB: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The complete seven-building street, canal and bridge are retained. Changes include uniform scaling, ground alignment, UV-aware geometry simplification, quantised positions and normals, and smaller embedded JPEG textures. Source metadata, hashes and measurements are in `models/residential-street/manifest.json`; reproduction and attribution details are in that directory's `CREDITS.md`.

## Dining approach — Japanese street at night (2026-09-11) — retired

`models/dining-street/night-lane.glb` adapts the user-supplied **Japanese street at night** by [AFX/CGMotion 3DModel Maker](https://sketchfab.com/afx_cgmotion). [Source model](https://sketchfab.com/3d-models/japanese-street-at-night-fb1bdcd71a5544d699379d2d13dd1171); licence recorded in its GLB: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Eight approach buildings, signs, lights, vending machines and paving lead into the existing restaurant façades. The studio backdrop, two closing buildings and central pole/cables were removed to make the connection. Other changes: baked transforms, static material batches, compacted vertices and smaller embedded JPEG textures. Original retained geometry, UVs and authorship are preserved. See `models/dining-street/CREDITS.md`, `manifest.json` and `tools/pack-dining-street.mjs`.

## Thuan’s apartment replacement — retired

**Seinfeld Apartment** by **kagley**, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Source model](https://sketchfab.com/3d-models/seinfeld-apartment-fd8abc336560446f9714dfe7076295b9). Supplied by the project owner as `seinfeld_apartment.glb`. Converted legacy diffuse materials, resized embedded textures, merged compatible primitives, scaled uniformly to metres, and moved the breakfast table 25 cm to clear the study passage. Runtime file: `models/yuri-home/seinfeld-apartment.glb`. Original metadata and SHA-256 recorded in the adjacent `manifest.json`.

## Advertising screen

Owner-supplied `Image-to-Image-5b45ad04.mp4`, encoded as `video/izakaya-ad.mp4`; poster extracted from its first frame. No third-party source or licence was supplied.

## Main Street frontage — September 2026 — retired

The user supplied `street_2.glb`, **Street 2** by **Pasha**. Its embedded metadata records the [original model](https://sketchfab.com/3d-models/street-2-3c11ac40e38442489df9a0a7193ee62c) and [Sketchfab Standard licence](https://sketchfab.com/licenses). The central contiguous frontage is cropped, uniformly scaled, simplified and divided into three sections in `models/main-street/`. Two padded texture atlases preserve the original repeated tile UVs. Exact source hash, dimensions and processing budget are in the adjacent manifest.

The office and Seinfeld apartment retain their existing source attribution. Redundant furniture was removed and replaced with original procedural furnishings for the office workstation and two sleeping corners. Both manifests record the refit and original source hashes.


## Sakura Shōten interior

Original procedural geometry (`src/world/interiors/sakura-shell.js`), built for Johansson Town from the shop's own measurements. It replaced a user-supplied convenience-store model that had no licence on record, which is no longer shipped.

The fictional packaging atlas at `graphics/konbini/packaging-atlas.webp` was generated for Johansson Town on 13 September 2026 with the built-in image-generation tool. It contains original NAGI, PORT 88, SAKURA, KOMOREBI, HANAMORI, SHIOFUMI, HOSHIMARU, SHIOSAI, MIZUNOWA, UMINEKO, YUNAGI and ASAMORI labels. It is used on both shelf goods and customers’ held goods. Existing generated shop posters are reused.

`graphics/konbini/packaging-groceries.webp`: sixteen additional original fictional labels generated on 13 September 2026. The complete built-in generation prompt, cell order and asset path are recorded in `../art/store/advertising/packaging-groceries.json`. Runtime meshes distinguish cans, shaped bottles, foil bags, cartons and household boxes. The fitted refrigerator, sliding doors and lighting are original project geometry; the supplied bakery trays have been levelled to keep stock supported.

## Magazines (assets/magazines/)

Manga pages, the サクラ商店 4-koma and the セルアニメ posters are original artwork drawn
by `tools/magazines/draw_pages.py` (Pillow). Lettering was rendered with WenQuanYi Zen
Hei (GPL-2.0 with font exception); the images contain rendered glyphs only, no font
data. All titles, characters and brands are fictional.

### IKEA home furniture

LACK side table (30449908) and IVAR pine cabinet (70033766): IKEA / Inter IKEA Systems. Downloaded from IKEA's published product-viewer GLBs using the discovery approach in [IKEA 3D Model Download Button](https://github.com/apinanaivot/IKEA-3D-Model-Download-Button). Exact model URLs and original files are retained in `models/furniture/SOURCES.json`. Blender variants remove photographic textures, simplify dense meshes and use the town's cel materials. The downloader's code license does not grant a license to IKEA's designs or models; no open asset license is asserted.

### Harbour Park Blender bench

`models/park/harbour-bench.glb`: original Johansson Town geometry authored in Blender. Editable `.blend`, measured design, reproducible generator, export budget and provenance are in `../art/park/PROVENANCE.md`. Plain worn-cedar and dark-iron materials; no third-party model or image texture. Runtime seating, collider and exported mesh share the same generated physical dimensions.

### IEC 90L pump motor (Dock Electrical Workshop)

`models/props/motor-90l-display.glb`: the site's own 1.5 kW IEC 90L pump motor (`../../motor-90l/`, original nj22az.github.io content), built from `motor-90l/motor.js` and packed by `../tools/pack-motor-90l.mjs`: the closed motor's outside only, simplified with meshoptimizer, one vertex-coloured mesh with `KHR_mesh_quantization`, true size in metres (shown 1.7x on the bench). No third-party model or texture. Source hashes, part list and budget: `models/props/motor-90l-display-provenance.json`. The steel test bench is original procedural geometry (`../src/workshop/motor-bench.js`).


### Shiosai houseboat (6 October 2026)

`models/harbour/fujita-houseboat-hull.glb` retains three reshaped hull meshes from the owner-supplied **Animal Crossing: New Horizons Crazy Redd Boat** upload by **damien_max59** ([source](https://sketchfab.com/3d-models/animal-crossing-new-horizons-crazy-redd-boat-f8cb034fa89e497588fb041f3e0c6704)). The embedded uploader metadata states [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); this preserves that metadata, not an independent rights verification of the original game. The retained hull geometry is attributed and not claimed as original Johansson Town work.

Changes: discard the merchant cabin, sprite textures, merchant fittings, signs, masts and decorations; shorten and broaden the hull, reduce its depth, rebuild normals and replace its materials. `src/world/fujita-houseboat.js` supplies the original replacement timber cabin, sleeping berth, galley, radio, deck, rails, tyres, mooring fittings and SHIOSAI name board. `models/harbour/fujita-houseboat.glb` is the complete reusable export. No Nintendo endorsement is implied.

### Sakura and J-Coffee campaign artwork (20 October 2026)

`graphics/advertising/j-coffee-island-banner.webp` and `graphics/izakaya/sakura-konbini.webp` are original campaign images generated with the built-in image-generation tool at the owner's request. The owner-supplied Garden Grace GLB provided the character reference. The J-Coffee banner uses the game's black, cream and gold branding from `src/world/halloween-props.js`. Runtime copies are optimised WebP images. The banner is mounted on the warehouse's clear south wall for the quay crews; Thao posts Sakura's portrait campaign inside Minato for the neighbours visiting before supper.
