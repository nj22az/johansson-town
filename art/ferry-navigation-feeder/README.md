# Actual navigation-light feeder

Run the self-contained original builder with Blender 4.2:

`blender -b -t 2 --python tools/blender/build-minato-navigation-feeder.py`

The native original uses metres, +Z up. Game coordinates in `scene.json` are +X port, +Y up, +Z forward, referenced to the bridge floor/forward wall. Convert a game point `(x,y,z)` to Blender `(x,-z,y)`.

The ship's actual branch is ESB 105 V AC, 60 Hz, two insulated conductors. The two incoming conductors, two fuse poles, two switch poles and existing green starboard lantern form one circuit. No battery, independent lamp, converter or hull return is added. `inputP`/`busN` metadata are compatibility anchors for the book's separate simplified 12 V DC calculation; actual AC anchors are `inputA`/`inputB`.

The native GLB contains the static enclosure, fuse caps, sealed cable and housing plus the separate switched lens. Four runtime switch levers preserve commanded position through power loss. Panel canvas labels are mapped against those physical switch centers; the UV test prevents a mirrored label order. Native load failure retains the same fallback geometry/control state.

The older practice-lamp GLBs remain for old open clients only. They are no longer requested by active code. Original geometry and book material belong to Nils Johansson.
