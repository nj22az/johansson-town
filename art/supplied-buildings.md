# Supplied town buildings

## Active Minato exterior — September 9 replacement

Minato now uses the owner's `izakaya_-_low_poly_building.glb`: BenMaher's **Izakaya - Low Poly Building**. The taller facade retains its neon sign, recessed door, pipes, rooftop canopy and boxes. The packed model removes only the presentation ground plane and retains all 2,446 building triangles in three draws. Re-encoded PBR atlases and cropped alpha textures reduce the 63,407,884-byte upload to 2,958,412 bytes. The existing dining room, menu, gossip, radio, seats and Yuri visits remain active.

Runtime: `assets/models/izakaya/minato-benmaher-exterior.glb`. Reproduction: `python tools/pack-benmaher-izakaya.py /path/to/izakaya_-_low_poly_building.glb`. Metadata, hashes, geometry parts and fitting details: `assets/models/izakaya/benmaher-manifest.json`. Credits: `assets/ATTRIBUTION.md`.

The source door faces the east lane at Minato's existing entrance `(24,20)`. New collision rectangles follow the asymmetric building and crates. The closed door opens the existing room through its entrance action. Street-exit stability checks use Minato's actual northward exit direction. CPU tests load the real exterior and interior, verify cutout/PBR materials and geometry, and exercise entry, exit and guest visits. Blender CPU renders inspect the fitted exterior and doorway; browser rendering and frame rate are not measured by these checks.

## Yuri’s house — September 9 canal replacement

Yuri’s canal-bank house now uses the owner’s `japanese_residential_home_02.glb`: Morrissey Alexander’s **Japanese Residential Home 02**. The two-storey timber house, porch and tiled roof replace the generic kit building at `house-west-canal`. The packed model is 1,996 triangles in one draw. Re-encoded PBR atlases reduce the 12,260,696-byte upload to 1,422,240 bytes. The existing bedroom interior, night visits and nameplate remain active.

Retired in the September 2026 cleanup: the canal-house exterior (`yuri-home-exterior.glb`, packed by `tools/pack-yuri-home.py` from `japanese_residential_home_02.glb`) is no longer in the town. Recover it from commit `5c63eb8` (see `docs/EXPANSION-NOTES.md`).

The source door faces local +Z after packing. Town yaw `π/2` turns it toward the west-bank boardwalk at `(-5.11, 11.53)`. Collision covers the house body and leaves the stoop walkable. Noren and a `ゆりの家` sign mark the enterable house.

## Earlier Meshy intake

The owner previously supplied two Meshy GLBs through Drive. Originals stay in Drive; source hashes and runtime hashes are recorded in each optimisation report. The Lantern Izakaya exterior is now inactive; Corner Tea House remains active.

| Asset | Source | Runtime | Triangles |
| --- | ---: | ---: | ---: |
| Lantern Izakaya | 101,242,600 bytes | 4,716,880 bytes | 60,000 |
| Corner Tea House | 101,733,180 bytes | 4,988,984 bytes | 60,000 |

Blender 4.2 decimation retains the source material and UVs. Portable JPEG maps use 2048px base colour and 1024px normal/roughness maps. No external texture URLs or runtime compression decoder are required. Each exterior is one opaque mesh. Small roof tiles and bicycle detail are simplified. The PNG reviews render the actual exported GLBs in Blender.

Reproduce from the source files:

```sh
blender -b --python tools/blender/prepare-supplied-izakaya.py -- --input /path/to/izakaya.glb --root .
python tools/pack-supplied-izakaya.py
blender -b --python tools/blender/prepare-supplied-izakaya.py -- --input /path/to/tea-house.glb --root . --asset tea-house --scale 4 --front-offset 0.4
python tools/pack-supplied-izakaya.py --asset tea-house
```

Minato's supplied exterior replaces its previous Blender facade; the existing first-person interior, supper/gossip and Yuri's alternate-evening visits remain. Corner Tea House replaces the decorative Shiomi apartment shell at (46,57), with an entrance on the residential lane at (46,62), a furnished tea room and a Town Book shortcut. It opens 09:00–19:00. The tea room offers inspection and seating; it does not implement food purchases. Both rooms use the visible Exit to street control.

Validation: CPU game entry/exit checks cover every registered interior; dedicated supplied-building checks load embedded textures and verify triangle, file-size, bounds and entrance limits. Production Vite build passes with the existing large-chunk warning. Blender previews were reviewed; browser interaction and mobile GPU performance were not measured in this environment.
