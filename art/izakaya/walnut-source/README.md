# Minato walnut back bar — runtime assets

Compact game derivatives of the original **Walnut Harbour Back Bar**, authored
in Blender 4.5.0. These exports retain the cabinet design, walnut/slate/brass
palette, fourteen original fictional liquor brands and forty-two bottle
placements. The original high-resolution Blender scene is a separate authoring
deliverable and is not required to regenerate these game assets.

## Files and budgets

| Asset | Triangles | Primitives / draw calls | File bytes |
|---|---:|---:|---:|
| `minato-walnut-backbar.glb` | 15,662 | 8 | 2,242,940 |
| `minato-walnut-counter.glb` | 418 | 4 | 110,712 |

The GLBs use standard glTF 2.0, embedded JPEG textures, ordinary PBR materials,
Y-up coordinates, metre units and front **+Z**. They require no Draco, Meshopt,
KTX2, transmission, reflection or other optional decoder or material extension.
Both assets use exclusively opaque, front-sided materials.

## Placement contract

| Asset | Root | Local bounds | Room placement |
|---|---|---|---|
| Shelf | `Backbar` | X −1.695…1.695; Y 0…2.6405; Z −0.27…0.37 | X −2.875; Y 0.04; Z −5.95; no yaw |
| Counter | `Counter` | X −4.2…4.2; Y 0…0.74; Z −0.415…0.415 | X −0.8; Y 0.04; Z −2.34; no yaw |

The room's floorboards finish at Y=0.04. Counter geometry therefore finishes at
**Y=0.78**, preserving the existing serving, seated-guest and prop heights. Its
world footprint is X −5…3.4, Z −2.755…−1.925. The existing raised steel service
worktop behind the counter is outside this asset and should remain in place.

The shelf is 3.39 m wide and 0.64 m deep. Its local worktop is Y=0.99, therefore
Y=1.03 after placement. Existing loose backbar props must be supported at that
height or moved to the kitchen.

## Geometry and depth stability

- Bottles have solid, opaque tinted shells. Nested transmissive glass and
  liquid layers, microscopic cap knurls, rear labels and invisible internal
  surfaces are omitted.
- Each paper label is an integral region of the bottle shell, assigned the
  shared label-atlas material. There is **no second surface beneath the label**,
  no floating label plane and no depth offset requirement.
- Raised wood panels and brass shelf fascias are continuous surfaces, with
  inset regions built into the geometry rather than stacked coplanar overlays.
- The silver backing is an opaque material; it does not render a second scene.
- The hidden rear lower-cornice face is omitted to remove a 2 mm overlap at the
  fitted backboard joint.
- The renderer can leave `polygonOffset` disabled for these assets. The normal
  room camera near/far planes and depth buffer remain authoritative.

Each material-batched mesh/node includes `extras.mergedParts`, with actual
exported accessor vertex offsets and source-piece names. Root extras include
the fourteen brand names and forty-two bottle positions for provenance,
support-height checks and geometry diagnostics.

## Regenerate

Requirements: Python 3 and NumPy.

```bash
python3 johansson-town/tools/blender/build-minato-walnut.py
```

Run the command from the repository root. It writes both GLBs to
`johansson-town/assets/models/izakaya/` and the measured report to
`johansson-town/art/izakaya/walnut-runtime-report.json`. It needs only the following
compact inputs in this directory:

- `spirits-brands.json` — silhouette, dimensions, palette and label-region data.
- `bottle-placements.json` — transforms and metadata taken from the original
  Blender export.
- `spirits-label-atlas.jpg` — fourteen original label designs in a padded
  2048 × 2048 atlas, with edge-extruded gutters.
- `runtime-walnut.jpg` and `runtime-slate.jpg` — 512 × 512 derivatives of the
  original procedural material maps.

The generator resolves its project paths relative to the script and writes ordinary GLB buffers directly
so mesh provenance offsets remain exact. It does not read or modify the
original `.blend` or high-resolution `.glb`, and it performs no network requests.

All labels and procedural material designs were created for this project.
