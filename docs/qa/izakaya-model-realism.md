# Minato model prop replacement — 5 October 2026

The original prop placements now contain recognisable objects rather than coloured
solid primitives. Replacement runs before the model joins by finish, so the game
still loads seven meshes/material batches. This note covers the Blender model;
runtime dressing, exploration windows, calendar and interactive serving are separate.

| Existing family | Actual replacement |
| --- | --- |
| Fish, sashimi, yakitori, edamame, oden, ramen toppings | 136 original food objects across all 12 source families: fish grain, shrimp segments/tails, charred chicken, pod lobes/seams, daikon fibres, speckled triangular konnyaku, pork fat spirals, rippled nori, cut eggs/yolks, spring onion rings and bamboo fibres. |
| Dishes, glasses and drinks | Turned ceramic dishes with cobalt edges, real inner walls/feet, hollow cups and glasses, partial amber beer and foam, recessed glass ashtrays, shaped sake flasks and pouring pitchers. |
| Bottles and storage | 70 complete back-bar bottles with shoulders, necks, capped mouths and mesh labels; labelled beer/open spirits/sauce; six open slatted crates with real handle gaps and 72 return bottles. Covered lower crates have shorter bottles so stacked bases stay clear. Bottle heights fit the next shelf. |
| Counter and shared kitchen | Cut-through counter holes with three recessed sinks/drains; curved mixer taps/valves; hollow stock pots, wok/pan handles, kettle spout/lid, gas supports/knobs, rice cooker controls, actual wire fryer/noodle baskets, fryer/boiler wells, open trays, drying rack and vertical ceramic plates, extraction filters, cabinetry seams/pulls and beer-tap hardware. |
| Everyday devices | Register keys/drawer/display/receipt, full ceramic beckoning cat, tuning radio with woven cloth/controls, speaker drivers, labelled meal-ticket machine, corner CRT controls/grille/antenna and daruma face. The redundant overlapping second CRT is removed. Latin LUCK marks avoid missing CJK-font glyphs. |
| Domestic objects and furnishings | Furled umbrellas with curved handles, hollow stand, shoes with soles/collars/seams, straw-wrapped sake barrels, miniature shrine with doors/rope/paper/leafed branches, tailored seat piping and stitched seams, woven tatami, zabuton seams, pleated noren and hollow light shades. |
| Entry and windows | Street sheet removed for the runtime transparent window/view. Physical sill/runner/catches/fasteners, layered non-emissive koagari washi/fibres/finger pulls and carved entry trim. The entrance remains clear within x ±1.85. The generator contains no full Minato entry wall above the dado; that enclosing wall belongs to the runtime room. |

The export is **203,549 triangles / 10,850,976 bytes / seven meshes**, compared with
the earlier **46,012 triangles / 3,685,964 bytes / seven meshes**. The larger mesh
contains actual cavities, handles, wirework and labels. Reducing tiny radial parts
from the first detailed export saved 23,340 triangles and 2,347,032 bytes. Finish
merges remain fixed, and no label textures add draw calls or external requests.

`art/izakaya/minato-prop-inventory.json` records per-family source counts and triangle
costs. The original furniture tops, venue footprint and seat heights are preserved.
The runtime oshibori warmer reservation remains clear at x .55/z -3.06 on the .9175
worktop; the sink remains x 2.85/z -3.06.

Validation: `node --test tests/minato-model-props.test.mjs tests/living-town.test.mjs`
passes all 12 tests. Tests load the actual GLB, check seven batches, finite attributes,
bounded shared-room dimensions, existing seat heights, sink-centre raycasts reaching
the recessed floors instead of counter slabs, cup/glass floors below their rims, and
continuous cotton rolls grounded on their trays.

The final model was rendered at six actual camera views and inspected: overview,
kitchen, table, bottles, counter and entry. The final renders are
`art/izakaya/minato-interior.png` and `minato-real-{kitchen,table,bottles,counter,entry}.png`.
Review corrected glass cloudiness and bottles clipping the next shelf. These images
contain the exported static model and no runtime props, posters, people or window
street backdrop.

Reproduce with Blender 5.2:

```sh
blender -b --python tools/blender/build-minato-interior.py -- --root .
blender -b --python tools/blender/render-minato-realism.py -- --root .
```

Generation uses direct mesh construction, avoiding Blender's slow context operations
for thousands of small pieces. Food and appliance upgrades are isolated in the
`minato_food_props.py` and `minato_device_props.py` helpers; the shared API and vessel,
kitchen, storage and upholstery upgrades are in `minato_real_props.py`.
