# Minato Izakaya — walnut back bar and counter

21 October 2026. Replacement of the original fitted shelf and guest counter with
the commissioned Walnut Harbour design: 42 bottles carrying 14 original fictional
brands, a walnut cabinet with brass rails, and a matching walnut-and-slate counter.
Thao owns the stock and Higa Liquor supplies it; the descriptions are available as
story data and through **Look at Thao’s back bar** in the room.

## What changed

The original cupboard, stock and counter are removed in the Blender authoring
pipeline before the room is merged. Kitchen equipment, the raised steel worktop,
Sato Ramen’s counter, dining furniture and serving positions remain in place.
The tea service, rice cooker and clean plates move to supported positions on the
rear kitchen prep bench. The left menu strips clear the new cabinet crown.

The runtime waits for the stripped room, new cabinet and counter together.
`minato-interior-walnut.glb` has its own filename; the original
`minato-interior.glb` remains available to the preceding cached runtime. Repeated
entries share immutable geometry and create one instance of each replacement.
Physical material preservation is confined to these two new furniture assets.

## Depth stability

- Bottle labels are integral regions of the bottle shell, with no bottle face
  beneath them and no floating paper planes.
- Bottles and finishes use opaque, front-sided materials. There are no nested
  glass/liquid shells, transparency sorting dependencies or polygon offsets.
- Raised panels and shelf fascias use continuous geometry. The hidden lower
  cornice face at the backboard join is removed.
- The old guest-ledge patina overlay is removed. The Blender refit also removes
  240 hidden horizontal prop-contact faces within 2.1 mm of the counter top.
- Printed labels and material maps use trilinear mipmaps; atlas tiles have
  edge-extruded gutters.

The regression scan tests the actual loaded exports and the real room/dressing
at a **2 mm** plane tolerance and **0.0005 m²** minimum exposed overlap. It retains
identical mesh faces so textured duplicates are not silently discarded. No
exposed conflict involving either replacement is found. A deliberately planted
counter plane 0.5 mm above the surface is detected by the same test.

## Measured geometry

| Asset | Triangles | Material primitives | Bytes |
|---|---:|---:|---:|
| Walnut back bar | 15,662 | 8 | 2,242,940 |
| Walnut counter | 418 | 4 | 110,712 |
| Room after retiring original furniture | 168,046 | 7 | 8,470,604 |

The room plus replacement geometry totals 184,126 triangles, compared with
203,549 in the original baked room. These are asset counts, not a claim about
whole-frame performance. The original high-resolution Blender scene is retained
as a separate authoring deliverable; these are compact game derivatives.

The counter retains the existing 8.4 × 0.83 m collision footprint and finishes at
Y=0.78 m. Both pieces stand on the Y=0.04 m floorboards. Every bottle is ray-tested
against its shelf, and all ten counter drink/dish positions meet the new slate.

## Verification

The final source is integrated with main `3f5b4f493493b08d2a3ae02bfbf445810ce964bd`.
The runtime source digest is
`17292864641e47d0b9e6b74f1899b0f698e5ab7522ab071028b548f975cb331b`.

| Check | Result |
|---|---|
| Furniture geometry, stock, support, depth conflicts and positive control | 9 assertions pass |
| Original model props and shared furniture heights | 9 assertions pass |
| Izakaya suites, serving, exploration, hours, entrances and Minato walking routes | All 14 selected test files pass |
| Runtime build and source/package checks | Pass |
| Final compiled desktop and phone browser run | Both pass: zero changed fixed-view pixels; 12 normal desktop walking waypoints; exit and re-entry pass |

Both fixed-view comparisons changed **zero pixels** above the three-colour-level
threshold (1,024,000 desktop pixels and 329,160 phone pixels). The browser records
no JavaScript, shader or failed HTTP responses after the complete room is ready.
Initial preload cancellations, if any, are recorded separately; the loaded-model
check confirms all three pieces are present.

The browser harness uses the actual compiled game, its normal materials, lighting
and ink pass. It captures room, shelf, counter, overhead and seven close/grazing
views at 1280 × 800 and 390 × 844. It compares two frozen renders of the shelf,
walks the customer and staff aisles with normal controls, exits normally and
checks that re-entry creates one shelf and one counter.

The initial staff walk crossed Thao’s collision radius while she was tidying the
counter at [3.5, -3.8]. Live navigation identified Thao as the sole blocker, with
no static collision. The verified route goes through [4.15, -4.7] and
[-2.875, -4.7] before approaching the shelf. No collision rules were changed.

Chromium runs with SwiftShader in this environment. A phone-sized touch viewport
was used; this is not a physical iPhone/Safari or hardware-GPU test. The geometry
checks and captured views establish the tested scope and do not promise behaviour
on every browser and driver.

## Reproduce

From `johansson-town/`, with Blender 4.5 and Python/NumPy available:

```bash
blender -b --python tools/blender/build-minato-interior.py -- --root .
python3 tools/blender/build-minato-walnut.py
npm run build:runtime
node --test tests/runtime-package.test.mjs
node --test --test-concurrency=2 tests/izakaya-*.test.mjs \
  tests/minato-model-props.test.mjs tests/furniture-heights.test.mjs \
  tests/minato-walking-routes.test.mjs tests/enterable-sites.test.mjs
node tests/izakaya-backbar.browser.mjs
```

For an installed browser outside Playwright’s cache, set `CHROMIUM_EXECUTABLE`.
Set `JOHANSSON_SWIFTSHADER=1` for the software-GPU launch used here. The optional
`JOHANSSON_AUDIT_SOURCE=1` loads source modules for iteration; the final recorded
run uses the compiled runtime. The furniture generator’s five compact inputs and
placement contract are documented in `art/izakaya/walnut-source/README.md`.
