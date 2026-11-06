# A town worth staying in

Development review · Nils Johansson · 8 September 2026

The strongest direction is to make one social neighbourhood rewarding to revisit: memorable people, changing conversations, objects with a purpose, and a welcoming place to spend an evening. Thuan is the accepted character reference. Expanding the map alone would spread the existing visual weaknesses across a larger area.

This branch implements that direction around **Minato Izakaya**, reached along the eastern lane, opposite the existing Sato Ramen building. It opens at 16:00 and closes at 23:30. The original street ramen stall, Sakura, quests, portfolio objects and save migration remain available.

## What is playable

- Nao welcomes visitors to a new Blender-built izakaya. The room contains a cedar counter, shared tables, stools, bottle shelves, paper lanterns, a kitchen and prepared dishes.
- Residents have individual personalities, friendships, visual briefs, personal dialogue and exploration clues. Nao joins the existing twenty residents; Thuan retains her separate Sakura role and supplied asset.
- Adults visit for supper after their own shifts. The roster changes over the evening. Existing scene entities are temporarily moved into the room; their street state and interaction ownership are restored on leaving.
- Guests have seated, eating and drinking animation clips. A drinking guest carries a small cup. Food prices are fictional game prices. Purchasing a plate spends town yen, advances eight town minutes and records a memory.
- The table offers different gossip when the relevant friends are present. Its clues point towards existing activities, people and objects rather than requiring a visit to a website page.
- Exploration is first person on the street and inside every building. The player avatar is not rendered; nearby objects can still be tapped, and boundary collision plus the persistent Exit to street control remain active indoors.
- Warm paper, red and green controls replace the austere panel colours. Contextual visibility and the separated Run/Jump layout remain in place.
- Shopfronts gain brighter plaster, finer joinery, planted boxes and small posters. Open shutters disappear into their housings instead of floating above the roofs. Oversized circular road patches no longer cover the main street at lane junctions.

## Blender assets and visual status

The assets were generated with the available **Blender 4.2.23 LTS** installation, exported, loaded with the game's vendored GLTFLoader and exercised in CPU tests. The editable source, generator scripts and export records accompany this branch.

| Asset | Editable source | Runtime |
| --- | --- | --- |
| Minato exterior | `art/izakaya/minato-exterior.blend` | `assets/models/izakaya/minato-exterior.glb` |
| Minato interior | `art/izakaya/minato-interior.blend` | `assets/models/izakaya/minato-interior.glb` |
| 21 resident prototypes | `art/living-cast/resident-00.blend` through `resident-20.blend` | `assets/characters/living/` |

**The new cast remains prototype artwork.** It gives the town a consistent, softer cast with distinct styling, but does not yet match Thuan's detailed face, hair, clothing or character appeal. These are not approved final character replacements, AAA assets or a claim that the user's character-quality request is finished. Thuan's GLB and animation implementation are unchanged (paths may still use legacy `yuri*` filenames). The branch remains a draft for this reason and for the device-testing gap below.

The Blender review image uses exported GLBs and selected seated poses. It is an offline lighting review, not an in-game screenshot. The runtime sign lettering and hand-held cup are separate Three.js details and are not included in that image. The standalone cast strip samples five prototypes; it is not a visual review of every frame of every resident.

## Technical basis and research

The [Three.js optimisation guide](https://threejs.org/manual/en/optimize-lots-of-objects.html) explains the per-mesh drawing overhead and shows how merging static geometry and retaining colour attributes can reduce it. This supports consolidating the immobile shop stock and exporting each prototype body as one skinned draw. Animated residents and interactive moving parts retain their own transforms. This is an engineering application of the source, not evidence of a measured frame-rate gain on this game.

The [official Khronos Blender glTF importer/exporter](https://github.com/KhronosGroup/glTF-Blender-IO) supports Blender-to-glTF delivery and documents its import/export and round-trip validation workflow. The practical evidence here is the actual local export and loader checks, rather than an assumption that a Blender file will render identically in WebGL.

The game uses one perspective-camera contract throughout exploration. Keeping the same first-person projection indoors and outdoors avoids an abrupt change of scale and prevents the hidden player controller from ever becoming visible.

The user-supplied screenshots and the inspected repository are the primary evidence for the visual diagnosis. The named friendships, gossip, prices, building and opening schedule are original fictional design decisions. Attempts to retrieve JNTO izakaya guidance and the Blender manual were unsuccessful; no claim of historically verified 1988 izakaya practice is made. Further broad searching would not settle whether this particular cast is appealing or the game runs well on the user's iPad, so research stopped at the implementation and device-verification boundary.

## Verification and remaining work

- **49 tests pass**, including existing saves, quests, Thuan's greeting, every registered interior in forced first person, navigation, independent character rigs, purchases, guest restoration and finite grounded poses across every resident clip.
- The **Vite production build passes**. It retains a warning for a JavaScript chunk over 500 kB.
- Static Sakura stock batching removes **93 estimated draws** from the otherwise identical new street scene. The full updated start-view estimate, including the exported izakaya exterior, is **575 mesh draws and 200,690 submitted triangles**. It remains over budget.
- The measurement tool loads the actual exterior GLB and all 24 preloaded character sources. Counts are CPU/frustum estimates, excluding shadow passes, points, the player, held objects, interiors and GPU timings. They are not FPS results. The new cast also increases asset download volume.
- No browser rendering, touch-device run, shader compilation, sound playback or iPad frame-rate test was performed. Blender renders and CPU checks cannot establish those results.

Before a production merge, compare the new cast with Thuan in-game, refine the approved character direction, test portrait and landscape room framing and tapping, and measure street and supper scenes on the intended iPad. The next performance target is the remaining individual static meshes and delivery cost, using actual renderer counters and frame times.

## Rebuild

From `johansson-town/`, with Blender on the command path:

```sh
blender -b --python tools/blender/build-izakaya.py -- --root .
blender -b --python tools/blender/build-living-cast.py -- --root .
node tools/compact-living-cast.mjs
blender -b --python tools/blender/render-living-review.py -- --root .
npm test
npm run build
node tools/measure-art-scene.mjs
```

The source of resident identity data is `src/people/profiles.json`; its generated JavaScript module must be kept synchronised. Construction and runtime asset reports record geometry and clip counts.

## Follow-up: Thuan after hours and dialogue proportions

Thuan visits Minato on alternate town days from 20:20 to 21:30, after Sakura closes at 20:00. The first town evening is a visit evening. After work she also rotates through Sato Ramen (while it is open), a canal walk and lingering near her own door, then goes in at 23:30. Rain sends her home. The saved town clock determines the schedule, so reloading does not reroll it. Her existing actor is reused, with her original model, scale, idle and greeting; she stands by the table at Minato, at a ramen stool, or beside her bed. On return to Sakura she resumes her counter position.

The dialogue canvas now respects renderer-owned dimensions. The previous fullscreen CSS forcibly stretched the reserved scene viewport across the entire display, widening characters. CPU regression checks cover camera/canvas proportions and the visit/return lifecycle. A real-browser CSS fixture is included at `tests/conversation-layout.html`; the cloud review browser blocked both local and embedded test pages, so that fixture and iPad compositing have not been visually verified.
