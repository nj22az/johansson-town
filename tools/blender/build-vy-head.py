"""Vy's head and her hair, sculpted in Blender (tools/blender/head_sculpt.py), and her review sheets.

  python tools/blender/build-vy-head.py --root . [--sheet] [--only-sheet]     (bpy 5.x from pip; or blender -b --python ... --)

The owner, 26 November 2026: "rework Vy, and Tetsuo give them expressions and fully rigged in blender"; then, with her
photograph, "This is the real Vy can you make cartoon Vy look more like her? Sculpt in blender from clay"; and of a first
head that was a big round ball, "Her head doesn't have to look like a balloon make her cute".

From the photograph, on Disney's terms (soft, clear shapes; nothing angular):
- THE HEAD  a soft oval, a little taller than wide: full low cheeks, the face narrowing in one curve to a small round
            chin, a small soft nose, a face a little flat so that her eyes lie on it.
- THE HAIR  a chin-length bob with a wispy fringe to the brows: round over the crown, fullest beside the cheeks, its ends
            turning in under the jaw, a little shorter at the nape; the fringe thin, in strands, close to the forehead.
Both are meshes made and smoothed here (art/characters/vy/vy-head.blend, shown as clay in review/clay.png) and measured
back for the game: src/avatars/sculpts/child-head.js (head form 'child') and softbob-hair.js (hair style 'softbob').
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np                                                         # noqa: E402
import head_sculpt as H                                                    # noqa: E402
from head_sculpt import bell, plateau, smooth                              # noqa: E402

# The head's half-axes as multiples of its radius (the game keeps its depth at 0.98): a soft oval.
WIDTH, HEIGHT = .93, 1.06


def radius(x, y, z, F):
    """The head's radius along each unit direction (game frame), before the half-axes are applied."""
    A = np.degrees(np.arctan2(x, z))
    a = np.abs(A)
    t = np.degrees(np.arccos(np.clip(y, -1, 1)))
    te, tn, tm = F['eye'], F['nose'], F['mouth']
    side = np.abs(np.sin(np.radians(A)))
    r = np.ones_like(x)
    r += .02 * bell(a - 80, 36) * bell(t - 100, 22)                          # widest at the cheeks
    r -= .1 * smooth(t, 96, 160) * side ** 2                                 # one soft curve down to the chin
    r -= .035 * smooth(t, 148, 180)
    r += .026 * bell(a, 24) * bell(t - 144, 10)                              # a small round chin
    r += .05 * bell(a - 36, 20) * bell(t - 150, 13)                          # the chin's sides filled: round, never a point
    r -= .03 * bell(a, 44) * bell(t - (te + 4), 26)                          # the face a little flat
    r += .035 * bell(a - 42, 16) * bell(t - (tn + 8), 13)                    # full cheeks, low
    r += .012 * bell(A, 5) * smooth(t, te - 4, te + 3) * (1 - smooth(t, tn - 2.5, tn + 1.5))   # a soft bridge
    r += .045 * bell(a, 8) * bell(t - (tn - 1.5), 5.5)                       # a small soft nose
    r += .016 * bell(a, 11) * bell(t - (tm + .5), 5)                         # the lips
    for s in (-1, 1):
        r -= .008 * bell(A - s * F['eyeA'], 11) * bell(t - (te + 1), 7)
    return r


def points(x, y, z, F):
    r = radius(x, y, z, F)
    return x * r, y * r, z * r


# ---------------------------------------------------------------------------- her bob
def hair_lines(A, t):
    a = np.abs(A)
    x = np.sin(np.radians(t)) * np.sin(np.radians(a))                        # how far across, on the head's sphere
    # The fringe: to the brows, in strands (two rhythms, so no two gaps are alike), a little longer toward the temples.
    strands = (.5 + .5 * np.cos(np.radians(A * 360 / 8.5))) ** 2 * .7 + (.5 + .5 * np.cos(np.radians(A * 360 / 5.3 + 40))) ** 2 * .3
    fringe = 76.5 + 5.5 * strands + 2.0 * smooth(a, 22, 44)
    # The face's opening: the hair hangs straight beside the cheeks, a little wider open low down.
    opening = .6 + .07 * smooth(t, 92, 132)
    front = smooth(-a, -95, -80)                                             # 1 over the face, 0 behind the ears
    top = fringe - t
    side = (x - opening) * 70 * front + 40 * (1 - front)
    # Its ends: at the jaw in front, a little shorter at the nape.
    bottom = (139 - 9 * smooth(a, 70, 165)) - t
    return top, side, bottom


def hair_field(A, t):
    top, side, bottom = hair_lines(A, t)
    return np.minimum(np.maximum(top, side), bottom)


def hair_height(A, t):
    a = np.abs(A)
    top, side, bottom = hair_lines(A, t)
    body = .07 + .012 * smooth(t, 20, 70)                                    # round over the crown
    body = body + .045 * bell(t - 116, 26) * smooth(a, 35, 75)               # fullest beside the cheeks
    body = body * (.62 + .38 * smooth(bottom, 0, 16))                        # the ends turn in
    # The fringe lies close to the forehead, thinnest at its tips.
    over_face = smooth(-a, -52, -38) * smooth(t, 50, 70)
    return body * (1 - over_face * (.42 + .25 * (1 - smooth(top, 0, 6))))


CONFIG = {'name': 'Vy', 'slug': 'vy', 'form': 'child', 'const': 'CHILD_HEAD', 'width': WIDTH, 'height': HEIGHT, 'points': points, 'melt': 8}


def with_hair(F):
    def ride(x, y, z):
        px, py, pz = points(x, y, z, F)
        return np.sqrt(px * px + py * py + pz * pz)
    return [H.hair_shell('VyHairSculpt', 'SOFTBOB_HAIR', 'softbob', hair_field, hair_height, ride)]


CONFIG['extra'] = with_hair
H.run(CONFIG)
