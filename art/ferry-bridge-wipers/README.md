# Minato Maru bridge wipers — original Blender source

Three frame-mounted marine pantograph wipers replace the old hanging T-shaped primitives. Original simplified geometry by Nils Johansson, designed for the existing cartoon World. No manufacturer geometry or logo is used.

The actual source panes are vertical, despite the older source comment calling them raked. `ferry-interior.js` defines five fore panes; the three centre panes have centres x = −1.18, 0 and +1.18 m. Each is 1.05 × 0.95 × 0.03 m, centred 1.45 m above the bridge floor and z = −0.04 m relative to the forward wall. The exterior face is z = −0.025 m, with +z forward. This model does not alter any pane or hull geometry.

The fixed electric motor is inside the cabin, behind the solid upper frame. A flange bears against the inside wall; a through-frame spindle, outside mounting plate and retaining bearings support the two parallel arms. The secondary spindle is 50 mm from the driven spindle. Equal 540 mm arms connect to the 50 mm lower coupler; its carrier translates without rotating. A pressure bridge supports the vertical 530 mm blade and rubber edge. The rubber's nearest edge is 0.5 mm outside the actual glass, avoiding coplanar shimmer and intersection. The full ±0.7 rad stroke is about 80°, with the arm/blade safely below the visor.

`Minato_Maru_Bridge_Wiper.blend` preserves the separate original components, hierarchy, material names and parked pose. `bridge-wipers-v1.glb` is the same model reduced to four articulated mesh parts. The generated JavaScript fallback contains the same Blender mesh positions, normals and vertex colours. All three windows share the same geometry and material buffers. The native asset is requested only when the bridge is viewed nearby; failure retains the same connected fallback mechanism.

Rebuild from `johansson-town/`:

```sh
blender -b -t 2 --python tools/blender/build-minato-bridge-wipers.py
node --test tests/ferry-bridge-wipers.test.mjs
node tools/export-bridge-wipers-review.mjs
blender -b -t 2 --python tools/blender/review-minato-bridge-wipers.py
```

Runtime API: `buildBridgeWipers(parent)` returns `group`, `wipers` (the three public drive pivots), `units`, `update(dt,{rain,powered})`, `setAngle(angle)` and `ensureNative()`. Powered rain drives a continuous wipe. Dry powered operation finishes the current cycle and self-parks smoothly; loss of power holds the current pose and phase. A late native load preserves the public pivots and current pose.

Mechanical reference: Exalto's [PU-arm installation instructions](https://www.exaltowipers.com/assets/files/hl-exalto-installation-puarms-en-1122.pdf) and [223BDO datasheet](https://www.exaltowipers.com/assets/files/datasheet-223bdo-1.pdf) informed the paired shafts, parallel linkage and spring contact arrangement. This is a simplified original game mechanism, not an installation drawing or a branded product model.

Focused checks use the actual Three.js GLTFLoader, all 281 sampled stroke positions, actual source pane dimensions, fixed support matrices, exact lower-pin linkage closure, blade attitude/clearance, rain/power/park transitions and late native replacement. The four source-review views in `docs/qa/bridge-wipers-2026-11-02/` are Blender renders from current game geometry with the runtime wipers excluded before the final native models are inserted. They do not claim browser or physical-device verification.
