# Drinking study mannequin

`drinking-mannequin.glb` is the actual model loaded by the side-view drinking laboratory.
`drinking-mannequin.blend` is its editable Blender 4.5 source. Both are generated from
`tools/blender/build-drinking-mannequin.py`; no downloaded character assets are used.

Run from `johansson-town`:

```sh
blender --background --python tools/blender/build-drinking-mannequin.py
```

## Rig and scale

This is a segmented artist mannequin with a named, hierarchical transform rig. Its
rigid pieces articulate at the shoulder, elbow, wrist, each finger hinge, opposing
thumb, spine, torso, neck, head and jaw. It is deliberately not a deforming skin.
GLB export contains the full meshes, materials and hinge hierarchy, rather than
metadata standing in for a model.

The runtime uses metres, Y up, +X facing forwards and +Z on the anatomical right,
camera-facing side. The Blender source converts those coordinates to Blender Z up
and exports them back to glTF Y up. No negative scale mirrors the right hand.

- Seat top: 0.46 m; pelvis underside meets it.
- Neutral shoulder: `[-0.28, 1.075, 0.178]`.
- Upper arm and forearm: 0.29 m and 0.26 m.
- Neutral mouth contact: approximately `[-0.1508, 1.307, 0]`.
- Both soles: Y = 0; the far hand rests on the thigh.

The motion is editable JavaScript in `src/drinking/cycle.js`, `simulation.js`,
`mannequin.js` and `hand.js`. No animation clip is baked into the neutral GLB.
`renderAt(t)` in the simulator evaluates an exact pose for inspection or capture.

`hand.js` constructs each digit's closed pose from external tangents to the vessel.
The actual phalanx lengths stay fixed; the vessel profile adjusts the wrap. Wrist
position and orientation are solved together, and an angular constraint chooses
an elbow position on the two-link reach circle without stretching either bone.
