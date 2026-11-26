"""Erik's head, sculpted in Blender (tools/blender/head_sculpt.py), and his review sheets.

  python tools/blender/build-erik-head.py --root . [--sheet] [--only-sheet]

The owner, 26 November 2026, with his photograph: "This is Mac who should be renamed Erik". He is the Minato Maru's relief
engineer. From the photograph, as a cartoon:
- THE HEAD  broad and heavy: a wide jaw under full cheeks, the weight of a full beard round a broad chin, a brow with
            some ridge to it. His nose is the body kit's (a big round one). His beard is painted on the face (cast.js),
            and he wears his cap.
Writes src/avatars/sculpts/burly-head.js (head form 'burly') and art/characters/erik/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, smooth                                       # noqa: E402

WIDTH, HEIGHT = 1.05, 1.05


def radius(x, y, z, F):
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    te, tn, tm = F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    r += .035 * bell(a - 80, 30) * bell(t - 110, 24)                         # wide across the cheeks and the jaw
    r -= .03 * smooth(t, 112, 160) * side ** 2                               # the jaw hardly narrows
    r -= .06 * smooth(t, 152, 180)
    r += .05 * bell(a - 48, 22) * bell(t - 132, 15)                          # the jaw's weight, and the beard on it
    r += .045 * bell(a, 30) * bell(t - 148, 12)                              # a broad bearded chin
    r -= .03 * bell(a, 44) * bell(t - (te + 4), 26)
    r += .04 * bell(a - 40, 15) * bell(t - (tn + 6), 12)                     # full cheeks
    r += .016 * bell(a, 11) * bell(t - (tm + .5), 5)
    r += .02 * bell(t - F['brow'], 6) * smooth(-a, -60, -30)                 # a brow with some ridge
    for s in (-1, 1):
        r -= .012 * bell(A - s * F['eyeA'], 11) * bell(t - (te + 1), 7)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


H.run({'name': 'Erik', 'slug': 'erik', 'form': 'burly', 'const': 'BURLY_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8})
