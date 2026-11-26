"""Sverker's head and his hair, sculpted in Blender (tools/blender/head_sculpt.py), and his review sheets.

  python tools/blender/build-sverker-head.py --root . [--sheet] [--only-sheet]

The owner, 26 November 2026, with his photograph: "This is the harbour master Sverker". From the photograph, as a cartoon:
- THE HEAD  broad and round: wider than it is tall, full cheeks, heavy soft jowls, a short chin with a second one under
            it; small eyes under heavy lids; a broad soft nose. All of it is in the mesh.
- THE HAIR  thick, straight and white-blond: a full mop swept across the forehead from his right, over the
            tops of his ears, full at the back.
Writes src/avatars/sculpts/broad-head.js (head form 'broad') and sweptmop-hair.js (hair style 'sweptmop'), and
art/characters/sverker/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                                       # noqa: E402

WIDTH, HEIGHT = 1.08, 1.0


def radius(x, y, z, F):
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    tb, te, tn, tm = F['brow'], F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    r += .04 * bell(a - 80, 32) * bell(t - 108, 24)                          # broad across the cheeks
    r -= .035 * smooth(t, 112, 160) * side ** 2
    r -= .06 * smooth(t, 152, 180)
    # Heavy soft jowls, hanging a little below the jaw's line either side of the chin.
    r += .075 * bell(a - 47, 20) * bell(t - 134, 13)
    # A short round chin between them, and a second one under it.
    r += .04 * bell(a, 20) * bell(t - 145, 8)
    r += .035 * plateau(a, 34) * bell(t - 159, 7)
    # Full cheeks, and the fold from the nose round each.
    r += .055 * bell(a - 39, 15) * bell(t - (tn + 3), 11)
    for s in (-1, 1):
        fold = s * (16 + 10 * smooth(t, tn - 4, tm + 6))
        r -= .022 * bell(A - fold, 3.4) * plateau(t - (tn + tm) / 2 - 2, 10)
    # A soft brow, and small eyes back under heavy lids.
    r += .028 * bell(t - (tb + 1), 5.5) * smooth(-a, -54, -30)
    for s in (-1, 1):
        r -= .034 * bell(A - s * F['eyeA'], 10.5) * bell(t - (te + 1.5), 6.4)
        r += .014 * bell(A - s * F['eyeA'], 12) * bell(t - (te - 5), 2.8)   # the lid's weight over each
    # The nose: broad and soft, a round tip, a wing each side.
    t0, tc = tb + 3, tn - 2.0
    u = np.clip((t - t0) / (tc - t0), 0, 1)
    rise = (.022 + .075 * u ** 1.5) * smooth(t, t0 - 3.5, t0 + 2)
    end = np.where(t > tc, plateau(t - tc, 5.6), 1)
    r += rise * end * bell(A, 5.4 + 5.0 * u)
    r += .1 * plateau(a, 10.2) * plateau(t - (tc + .2), 5.6)
    r += .065 * bell(a - 12.4, 4.6) * bell(t - (tc + 1.6), 3.9)
    # The mouth's ground and a full lower lip.
    r += .02 * bell(a, 17) * bell(t - (tm - 1), 7)
    r += .014 * bell(a, 11) * bell(t - (tm + 3.5), 3.5)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


EDGE = ([0, 30, 50, 66, 78, 90, 110, 140, 180], [56, 56, 61, 72, 86, 91, 110, 120, 123])   # the hairline: a from the front, t down to it


def hair_field(A, t):
    a = np.abs(A)
    fringe = 6.5 * np.clip(A / 50, -1, 1) * (1 - smooth(a, 40, 64))          # the fringe sweeps down across the forehead to his left
    return np.interp(a, *EDGE) + fringe - t


def hair_height(A, t):
    f = hair_field(A, t)
    h = .1 + .03 * smooth(t, 10, 45)
    h += .035 * np.exp(-((A + 18) / 38) ** 2 - ((t - 46) / 16) ** 2)         # the weight of the sweep
    h -= .03 * smooth(t, 104, 124)
    h = .03 + (h - .03) * smooth(f, 0, 13)                                   # thin at the hairline: an edge, not a step
    return np.where(f > 0, h, .02)


# His eye: small and pale under a heavy lid that comes a third of the way down and slopes to the outside, a line
# under it.
EYE = dict(rx=10.4, ry=9.0, topAmp=9.0, botAmp=7.0, pTop=.5, pBot=.6, cut=.33, slant=-.2, irx=6.2, iry=6.2, iy=-.4,
           pupil=.46, lash=3.6, flick=0, lower=1, highlight=.7, lidShadow=1)

CONFIG = {'eye': EYE, 'name': 'Sverker', 'slug': 'sverker', 'form': 'broad', 'const': 'BROAD_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8}


def with_hair(F):
    def ride(x, y, z):
        px, py, pz = points(x, y, z, F)
        return np.sqrt(px * px + py * py + pz * pz)
    return [H.hair_shell('SverkerHairSculpt', 'SWEPTMOP_HAIR', 'sweptmop', hair_field, hair_height, ride)]


CONFIG['extra'] = with_hair
H.run(CONFIG)
