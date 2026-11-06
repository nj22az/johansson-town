# Main Street homes

The supplied Street 2 frontage forms the west side of Main Street, facing the shopping and dining buildings. The former alley is now split into two rows facing the six-metre road; see [Road-facing shops](ROAD-FACING-SHOPS.md). The northern and southern ends of the homes join the existing grid; the sea boundary, Sakura, harbour office and warehouse remain connected. The superseded housing lane, canal bridge and overlapping bathhouse shell are removed. The bus stop is at the north junction.

| Entrance | Household | Interior |
| --- | --- | --- |
| 1 | Thuan and Nao | Supplied apartment, separate beds and belongings |
| 2 | Aya and Reiko | Shared flat, separate futons, wardrobes and notes |
| 3 | Kenji and Tetsuo | Shared flat, separate futons, wardrobes and notes |
| 4A | Mrs Sato | Own flat |
| 4B | Officer Mori | Own flat |
| 5A | Harbour master | Own flat |
| 5B | Bus driver | Own flat |

Seven homes use five street interaction targets. The two entrances with separate flats offer a flat selector. Every home stays open overnight. The existing ten actors are borrowed independently into rooms only when they have reached home; roommates retain their individual sleep, work, meal and departure times. Former Nao, Reiko and Tetsuo home IDs migrate to the surviving shared-home IDs without changing individual inventories or schedules.

Thuan retains her low-poly body and pink palette. The rigid apron panel is removed; fitted eyes, softer brows, blinking, a small smile and dialogue mouth movements share her original skeleton. Her original soft model remains a static collectible. The office now has one CRT workstation, a straightened chair, wrists aligned to the keyboard, a nameplate beside the working area, and fitted filing shelves. Existing spreadsheet viewing and downloads remain available.

## Asset processing

The 72.94 MB upload is cropped at authored party walls, scaled uniformly by 0.022, and packed into north, centre and south sections. It retains 84,956 triangles in six material draws. Two 2048-pixel atlases share the source tiles with 8-pixel gutters. The maximum simplification error is 2.5 cm. Combined runtime geometry and textures: 9.51 MB. Each section streams independently and failed requests can retry.

Rebuild with `node tools/pack-main-street.mjs /path/to/street_2.glb`, then `python tools/frontage-collisions.py /path/to/street_2.glb src/world/main-street-colliders.js`. `tools/refit-interiors.py` applies the documented furniture removal to the original packed office/apartment exports. Generated files preserve source credit and hashes.

54 superseded GLBs and their unused pack resources were removed (77.06 MB). The active five resident bases, soft Thuan collectible, supplied apartment and models still referenced by the separate historical overworld are retained.

## Verification

Coverage includes each physical doorstep, routes to every workplace, the uninterrupted pavement, concurrent section loading and retry, two cohabitants in the furnished apartment, separate beds, independent departure, overnight access, save aliases, facial skinning and keyboard wrist placement. The production build succeeds. The final whole suite passes 170 of 173 checks; the three pre-existing failures concern the inactive historical overworld, an old office fixture and the old Kenji subtitle expectation. All new-home, frontage, current-game startup, office routine and appearance checks pass. Offline geometry renders were inspected; this environment cannot perform a live WebGL visual review.
