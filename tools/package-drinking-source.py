#!/usr/bin/env python3
"""Package the portable lab, real model sources and its focused tests."""
from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / 'drinking-simulator' / 'drinking-simulator-source.zip'
files = [
    root / 'drinking-simulator' / name for name in ('index.html', 'main.js', 'style.css')
]
files += sorted((root / 'src' / 'drinking').glob('*.js'))
files += sorted((root / 'assets' / 'models' / 'drinking').glob('*'))
files += [root / 'vendor' / name for name in (
    'three.module.js', 'GLTFLoader.js', 'BufferGeometryUtils.js', 'LICENSE-THREE.txt')]
files += [root / 'tests' / name for name in (
    'drinking-liquid.test.mjs', 'drinking-rig.test.mjs', 'drinking-simulator.test.mjs')]
files += [root / 'tools' / 'blender' / 'build-drinking-mannequin.py',
          root / 'docs' / 'DRINKING-SIMULATOR.md']
readme = '''# Drinking simulator — portable source

Beer, whiskey and gin and tonic share one sober 6.6-second drinking animation.
This archive contains the standalone lab and its actual editable Blender model.
The full Johansson World integration and browser evidence are in the repository.

## Run

Extract the archive and, from this folder, run:

```sh
python3 -m http.server 5175 --bind 127.0.0.1
```

Open http://127.0.0.1:5175/drinking-simulator/ in a WebGL2 browser.
All runtime dependencies are included (Three.js r170); no install or CDN is needed.
Use Take a sip or Space. Inspect reveals pause, slow motion, cameras and markers.

## Tests

With Node 24 or newer, run `npm test`. No npm installation is required for these
focused tests. The complete repository has additional game, runtime and browser tests.

## Edit

- `src/drinking/`: shared clock, constraints, rig, hand, profiles, vessel and liquid.
- `drinking-simulator/`: browser presentation and controls.
- `assets/models/drinking/drinking-mannequin.blend`: editable model.
- `tools/blender/build-drinking-mannequin.py`: reproducible Blender authoring source.
- `docs/DRINKING-SIMULATOR.md`: architecture, event API, measured checks and limits.
- `vendor/LICENSE-THREE.txt`: Three.js dependency licence.

The repository production-build commands in the detailed document apply to the
full Johansson World checkout. This portable lab runs directly from the server above.
'''
package = {
    'name': 'johansson-drinking-simulator-source', 'private': True, 'type': 'module',
    'scripts': {'test': 'node --test tests/drinking-liquid.test.mjs tests/drinking-rig.test.mjs tests/drinking-simulator.test.mjs'},
}
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    prefix = 'drinking-simulator-source/'
    for path in files:
        if path.is_file():
            archive.write(path, prefix + path.relative_to(root).as_posix())
    archive.writestr(prefix + 'README.md', readme)
    archive.writestr(prefix + 'package.json', json.dumps(package, indent=2) + '\n')
print(f'Created {output} ({output.stat().st_size:,} bytes).')
