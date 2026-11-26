"""Erik's head, sculpted in Blender (tools/blender/head_sculpt.py), and his review sheets.

  python tools/blender/build-erik-head.py --root . [--sheet] [--only-sheet]

The owner, 26 November 2026, with his photograph: "This is Mac who should be renamed Erik"; then, of the first drawings:
"redraw all their heads they need to be drawn in Blender". He is the Minato Maru's relief engineer. From the photograph,
as a cartoon, with everything in the mesh:
- THE HEAD  broad and heavy: a wide jaw under full cheeks pushed up by a smile; a brow with a ridge to it, the eyes set
            back under it; a big round nose, broad at the tip, with a wing each side; and the mass of a full beard: the
            jaw and the chin carried out and down, a moustache's weight over the lip, the lower lip in a hollow of it.
His beard's colour is painted on that mass (cast.js), and he wears his cap.
Writes src/avatars/sculpts/burly-head.js (head form 'burly') and art/characters/erik/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

WIDTH, HEIGHT = 1.05, 1.05


def radius(x, y, z, F):
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    tb, te, tn, tm = F['brow'], F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    r += .035 * bell(a - 80, 30) * bell(t - 110, 24)                         # wide across the cheeks and the jaw
    r -= .03 * smooth(t, 114, 160) * side ** 2                               # the jaw hardly narrows
    r -= .055 * smooth(t, 154, 180)
    # The beard's mass: the jaw carried out, the chin broad and down, a moustache over the lip.
    r += .06 * bell(a - 50, 22) * bell(t - 132, 14)
    r += .065 * plateau(a, 30) * bell(t - 147, 11)
    r += .034 * plateau(a, 17) * bell(t - (tm - 4.5), 3.6)
    r -= .014 * bell(a, 9) * bell(t - (tm + 1.5), 2.6)                       # the mouth, in the beard
    # Full cheeks, pushed up by the smile.
    r += .055 * bell(a - 38, 14) * bell(t - (tn + 1), 10)
    # The brow: a ridge, heaviest toward the middle; the eyes back under it.
    r += (.045 + .012 * bell(a, 12)) * bell(t - (tb + .5), 4.8) * smooth(-a, -54, -30)
    for s in (-1, 1):
        r -= .04 * bell(A - s * F['eyeA'], 10.5) * bell(t - (te + 1.5), 6.6)
    # The nose: a broad bridge from the brow, a big round ball of a tip, a wing each side.
    t0, tc = tb + 3, tn - 2.0
    u = np.clip((t - t0) / (tc - t0), 0, 1)
    rise = (.03 + .1 * u ** 1.5) * smooth(t, t0 - 3.5, t0 + 2)
    end = np.where(t > tc, plateau(t - tc, 5.8), 1)
    r += rise * end * bell(A, 5.2 + 5.0 * u)
    r += .13 * plateau(a, 10.4) * plateau(t - (tc + .2), 6.0)
    r += .08 * bell(a - 12.6, 4.6) * bell(t - (tc + 1.6), 4.0)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


# His eye: small under the brow and creased by his smile: a low arch of an upper lid, the lower lid pushed up nearly
# flat by the cheek; a heavy lash line, no flick.
EYE = dict(rx=10.8, ry=8.0, topAmp=8.0, botAmp=4.4, pTop=.6, pBot=.8, cut=.18, slant=-.1, irx=6.4, iry=6.4, iy=.2,
           pupil=.5, lash=3.8, flick=0, lower=0, highlight=.8, lidShadow=1)

H.run({'name': 'Erik', 'slug': 'erik', 'form': 'burly', 'const': 'BURLY_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8, 'eye': EYE})
