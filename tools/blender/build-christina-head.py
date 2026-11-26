"""Christina's head and her hair, sculpted in Blender (tools/blender/head_sculpt.py), and her review sheets.

  python tools/blender/build-christina-head.py --root . [--sheet] [--only-sheet]

The owner, 26 November 2026, with her photograph: "This is Mrs Higa who should be renamed to Christina and she should not
have a wheelchair". She owns Umi-no-yu and keeps Kissa Higa. From the photograph, as a cartoon:
- THE HEAD  round and soft: full cheeks low on the face, a soft jaw, a small round chin. Her nose is the body kit's.
- THE HAIR  white, soft and full: swept up and back off the forehead to one side, full over the ears, short at the nape.
Writes src/avatars/sculpts/kindly-head.js (head form 'kindly') and softwave-hair.js (hair style 'softwave'), and
art/characters/christina/.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, smooth                                       # noqa: E402

WIDTH, HEIGHT = 1.0, 1.02


def radius(x, y, z, F):
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    te, tn, tm = F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    r += .03 * bell(a - 76, 34) * bell(t - 104, 22)                          # full cheeks, low
    r -= .07 * smooth(t, 104, 160) * side ** 2                               # a gentle narrowing to the chin
    r -= .05 * smooth(t, 150, 180)
    r += .035 * bell(a - 46, 22) * bell(t - 128, 14)                         # a soft jaw
    r += .03 * bell(a - 34, 20) * bell(t - 150, 12)                          # a small round chin
    r += .02 * bell(a, 22) * bell(t - 146, 9)
    r -= .03 * bell(a, 44) * bell(t - (te + 4), 26)                          # the face a little flat
    r += .04 * bell(a - 40, 15) * bell(t - (tn + 6), 12)                     # apple cheeks
    r += .016 * bell(a, 11) * bell(t - (tm + .5), 5)                         # the lips
    r += .008 * bell(t - F['brow'], 5) * smooth(-a, -50, -28)
    for s in (-1, 1):
        r -= .01 * bell(A - s * F['eyeA'], 11) * bell(t - (te + 1), 7)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


EDGE = ([0, 20, 40, 56, 70, 90, 110, 140, 180], [46, 47, 54, 72, 96, 112, 116, 119, 120])   # the hairline: a from the front, t down to it


def hair_field(A, t):
    a = np.abs(A)
    sweep = 5 * np.clip(A / 40, -1, 1) * (1 - smooth(a, 30, 52))             # swept to her left: lower over that brow
    return np.interp(a, *EDGE) + sweep - t


def hair_height(A, t):
    a = np.abs(A)
    f = hair_field(A, t)
    h = .1 + .03 * smooth(t, 15, 50)
    h += .05 * np.exp(-((a - 86) / 30) ** 2 - ((t - 84) / 24) ** 2)          # full over the ears
    h += .045 * np.exp(-((A - 16) / 34) ** 2 - ((t - 42) / 14) ** 2)         # swept up off the forehead
    h -= .04 * smooth(t, 100, 120)                                           # close at the nape
    # Soft curls: a set wave, as a cartoon draws an old lady's hair; round lobes, larger at the sides.
    h += .028 * (.5 + .5 * np.cos(np.radians(A * 6.0)) * np.cos(np.radians((t - 40) * 6.5))) * smooth(t, 18, 40)
    h = .028 + (h - .028) * smooth(f, 0, 13)                                 # thin at the hairline: an edge, not a step
    return np.where(f > 0, h, .02)


CONFIG = {'name': 'Christina', 'slug': 'christina', 'form': 'kindly', 'const': 'KINDLY_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8}


def with_hair(F):
    def ride(x, y, z):
        px, py, pz = points(x, y, z, F)
        return np.sqrt(px * px + py * py + pz * pz)
    return [H.hair_shell('ChristinaHairSculpt', 'SOFTWAVE_HAIR', 'softwave', hair_field, hair_height, ride)]


CONFIG['extra'] = with_hair
H.run(CONFIG)
