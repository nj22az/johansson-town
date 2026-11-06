# Island sculpts owned by Nils Johansson

Supplied by the owner in `Pictures/my_own3d_Assets` for use in Johansson Town. These are game exports of his own artwork, not downloaded characters.

- **barfly.glb**: one complete standing figure separated from the four-pose sculpt; flowered shirt preserved. Nine-bone skin with Idle, Wave and Work clips.
- **Jonsson.glb**: the original kneeling mechanic and engine, with a seven-bone skin and Idle, Wave and Work clips. Limited head and arm movement suits the authored repair pose; the floor base remains fixed. This is a stationary working rig, not a walking rig.
- **merry_Moose.glb**: clean matte colours, a separate readable MERRY MOOSE plaque, complete pupils and small highlights.
- **Maneki_neko_Colorful.glb**: the owner's colourful lucky cat, reduced for a counter ornament.

The original files are untouched. Editable Blender scenes and exports are saved beside them in `Prepared-for-Johansson-Town`. Reproduction script: `tools/prepare-owned-assets.py`, requiring Blender 5.2. Run it with the source and output folder arguments documented at the top. Embedded images are reduced to 1024 pixels; meshes are simplified before skinning. The four runtime files total about 5 MB versus roughly 113 MB supplied.

The game loads these assets only when entering their rooms, shares cached geometry and textures, and gives each animated instance its own skeleton and mixer. Runtime shading uses the town's cel ramp. Barfly and Merry Moose are at Minato. Jonsson no longer stands in the dock workshop (the owner, 20 October 2026): the room shows a poster of him on Chin’s wall (`src/workshop/chin-wall.js`), rendered from this model by `tools/render-jonsson-poster.mjs`; the model is kept for the poster and for Studio.

The avatar creator's Rounded proportions are inspired by Barfly's larger head, wider torso and shorter limbs. Existing saved avatars retain Classic proportions unless changed. This option does not substitute the Barfly mesh for other residents.
