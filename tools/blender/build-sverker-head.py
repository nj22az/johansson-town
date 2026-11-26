"""Sverker's head and his hair, sculpted in Blender (tools/blender/head_sculpt.py), and his review sheets.

  python tools/blender/build-sverker-head.py --root . [--sheet] [--only-sheet]

The owner, 26 November 2026, with his photograph: "This is the harbour master Sverker". From the photograph, as a cartoon:
- THE HEAD  broad and round: wider than it is tall, full cheeks, heavy soft jowls, a short chin with a second one under
            it. His nose is the body kit's.
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
from head_sculpt import bell, smooth                                       # noqa: E402

WIDTH, HEIGHT = 1.08, 1.0


def radius(x, y, z, F):
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    te, tn, tm = F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    r += .04 * bell(a - 80, 32) * bell(t - 108, 24)                          # broad across the cheeks
    r -= .035 * smooth(t, 110, 160) * side ** 2
    r -= .07 * smooth(t, 150, 180)
    r += .055 * bell(a - 50, 24) * bell(t - 130, 15)                         # heavy soft jowls
    r += .03 * bell(a, 26) * bell(t - 146, 10)                               # a short chin
    r += .02 * bell(a, 40) * bell(t - 158, 8)                                # and a second under it
    r -= .03 * bell(a, 44) * bell(t - (te + 4), 26)
    r += .045 * bell(a - 40, 15) * bell(t - (tn + 6), 12)                    # full cheeks
    r += .016 * bell(a, 11) * bell(t - (tm + .5), 5)
    r += .01 * bell(t - F['brow'], 5) * smooth(-a, -50, -28)
    for s in (-1, 1):
        r -= .01 * bell(A - s * F['eyeA'], 11) * bell(t - (te + 1), 7)
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


CONFIG = {'name': 'Sverker', 'slug': 'sverker', 'form': 'broad', 'const': 'BROAD_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8}


def with_hair(F):
    def ride(x, y, z):
        px, py, pz = points(x, y, z, F)
        return np.sqrt(px * px + py * py + pz * pz)
    return [H.hair_shell('SverkerHairSculpt', 'SWEPTMOP_HAIR', 'sweptmop', hair_field, hair_height, ride)]


CONFIG['extra'] = with_hair
H.run(CONFIG)
