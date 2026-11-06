# Johansson Woodland

The corrected R3 Blender diorama, available from **Look** on Minato’s harbour notice board.

The board carries `poster-board.webp`. The board menu shows `poster.webp`; only choosing Look creates the viewer iframe and downloads the model. The viewer supports the orthographic front view, an orbit view, and the exact Blender poster. Its URLs are relative for the web and packaged World.

## Source and integrity

The model is the final `Johansson_Woodland_Diorama.glb`, compressed losslessly with gzip. The two WebP images are web-sized exports of `Johansson_Woodland_Corrected_R3_Front.png` (3000 × 2000). They retain the corrected whole characters and original composition. The native `.blend`, full PNG and editable source package were delivered separately. Asset sizes, hashes, cast-source commit and camera are recorded in `build-manifest.json`.

To extract the exact original model:

```bash
python3 -c "import gzip,pathlib; p=pathlib.Path('woodland.glb.gz'); pathlib.Path('Johansson_Woodland_Diorama.glb').write_bytes(gzip.decompress(p.read_bytes()))"
```

The original model SHA-256 is `94ad597834509739204ac7b0374a33ee50eac7f59678c8f6cb8efc2b99fbe549`. No geometry, material or character placement was changed for hosting.

## Runtime

The viewer uses the existing `../../vendor/three.module.js` and `GLTFLoader.js`, plus the matching OrbitControls r170. Native gzip decoding is preferred; the local Pako inflate-only module loads only when needed. Third-party licences accompany both components. No CDN or remote service is required.

The embedded header is supplied by Activities. Ready/close messages include the per-opening token; Activities checks the iframe source, document origin and token before acting. Closing, browser Back and replacing the activity remove the iframe and its listeners. The game holds its hidden renderer and clock while the viewer is open, keeping controller Back available.

## Checks

Run from `johansson-town/`:

```bash
node --test tests/woodland-poster.test.mjs tests/activity-lifecycle.test.mjs tests/sakura-flyer.test.mjs
npm run build:runtime
node --test tests/runtime-package.test.mjs
TOWN_CHROMIUM_PATH=/path/to/chromium node tools/woodland-poster-review.mjs
node tools/ci-guard.mjs --test-concurrency=1
```

The browser check boots the actual compiled World, walks through the board menu, verifies on-demand model loading and return paths, and captures desktop and phone-size views. Run it alone. It does not claim physical-device or packaged Linux acceptance.
