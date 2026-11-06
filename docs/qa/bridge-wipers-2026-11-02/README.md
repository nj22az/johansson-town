# Bridge wiper verification — 2 November 2026

The old three floating T-shaped wipers have been replaced by original Blender-built pantograph mechanisms attached to the actual upper window frame. The bridge, glass and ship geometry are unchanged. See [editable source and rebuild instructions](../../../art/ferry-bridge-wipers/README.md).

## Actual geometry

The source bridge origin is its floor at ship y9.1 m and forward wall at ship z5.75 m. Five vertical fore panes are defined by `ferry-interior.js`, despite its older “raked” comment. The three middle panes receive wipers. Each glass aperture spans centre x±0.525 m, bridge-local y0.975–1.925 m; its outer face is z−0.025 m. `export-bridge-wipers-review.mjs` runs the actual current ferry builder and excludes `b.wiperRig.group` before export. The Blender review then imports the final native GLB three times, without duplicate runtime wipers or invented panes.

Each motor and its inside flange are fixed behind the solid top frame. Its drive spindle passes through the solid wall to the outside bearing and faceplate. The secondary spindle is 50 mm away. Two 540 mm arms connect to a translating lower coupler that keeps the 530 mm blade vertical. The ±0.7 rad sweep is approximately 80°. The measured rubber envelope stays within x±0.3614 m and y1.198–1.859 m of its source pane; the nearest edge is z−0.0245 m, 0.5 mm outside the actual glass. The plate sits on wall z0 at y1.955–2.055 m, below the visor starting at y2.08 m. Arms/coupler stay forward of the glass. The motor and through-frame shaft are intentional mounted penetrations; the rubber does not enter the glass.

## Checks

`node --test tests/ferry-bridge-wipers.test.mjs` passed **5/5**. The assertions cover actual source pane dimensions; 281 fallback poses across the complete sweep; both pin-axis closures; unrotated blade carrier; pane bounds and rubber clearance; invariant support matrices; rain/power/self-park behaviour; four native GLB meshes and their fallback bounds; and late native replacement retaining angle, public pivots and shared GPU geometry buffers. A further 41 loaded-native poses check actual twelve-vertex hinge rings and the native rubber back-face vertices, confirming closure, blade attitude/clearance and fixed mounting matrices. Combined with `tests/ferry-bridge.test.mjs`, **7/7** passed.

Independent QA additionally measured matching expanded native/fallback point counts and maximum nearest-vertex difference 6.7×10⁻⁸ m. Its combined bridge/lantern/wiper checks passed 10/10 before final publication integration.

Powered rain wipes continuously. Removing rain with power available finishes the cycle and parks smoothly. Removing power freezes the pose and phase; power restoration continues without a jump. All three windows share the same four mesh geometries/materials, for twelve draws and 4,080 triangles total. The 124,792-byte native GLB is lazy-loaded only near the bridge. The fallback uses positions/normals/colours exported directly from the same original Blender source.

## Proofs

- [Outside, parked](outside-parked.png): upper-frame fastenings, paired arms and vertical blade on each window.
- [Inside, parked](inside-parked.png): fixed motor boxes above the glass and linked exterior mechanism through the actual panes.
- [Outside, middle of stroke](outside-midstroke.png): connected arms and lower coupler.
- [Outside contact detail](outside-contact-detail.png): hinge pins, pressure bridge, blade clips and rubber against the exterior pane.
- [Editable actual-source review scene](actual-source-review.blend).

These are **Blender renders of actual game-source geometry**, not browser screenshots or physical-device performance results. The initial review-import quaternion/Euler mismatch was corrected by setting imported linkage roots to XYZ before posing; all four proof images were regenerated and inspected. Runtime native rest rotations and actual moving mesh vertices are checked separately through the real Three.js GLTFLoader.

Final native asset SHA-256: `317574e7030012e919c18acb5b74445a3f82fde48ee576e1773bb7808c1adc1d`.

Final image SHA-256:

```text
aee96392751c6fac5798bb35c16b72dd4cd1d22ef94fe246dc9c603898288300  outside-parked.png
06b1c8bd1ab740db52b35e6e44270568285da7d36c3abace37ad31bab8a9d162  inside-parked.png
6c89dc8c5add8395b3f01d47fac5225ec4e2f0a0d08a52e98a7a11315460eef4  outside-midstroke.png
05a44d91a99d3acf613f550310d1f62757d79774cea5a585fe69a8116fd98eef  outside-contact-detail.png
```

World integration/publication, whole-runtime guards and actual browser/device acceptance are owned by the main bridge-update handover. No book or synchonisation-lab files were changed by this asset task.
